const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createRoom, getRoom, addPlayer, removePlayer,
  startGame, flipCard, resolveNoMatch, advanceTurn,
  getPublicState, deleteRoom, CARD_FLIP_DELAY_MS,
} = require('./gameManager');
const { TURN_TIMER_SECONDS } = require('./constants');

const app = express();
app.use(cors());
app.get('/health', (_, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Store socket->room mapping for disconnect handling
const socketRoomMap = new Map();

// Turn timer helpers
const timers = new Map(); // roomCode -> intervalId

function startTurnTimer(roomCode) {
  stopTurnTimer(roomCode);
  const room = getRoom(roomCode);
  if (!room) return;
  room.turnTimer = TURN_TIMER_SECONDS;

  const interval = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || r.status !== 'playing') { clearInterval(interval); return; }
    r.turnTimer -= 1;
    io.to(roomCode).emit('timer-tick', { timeLeft: r.turnTimer });
    if (r.turnTimer <= 0) {
      clearInterval(interval);
      timers.delete(roomCode);
      advanceTurn(roomCode);
      io.to(roomCode).emit('game-state', getPublicState(roomCode));
      startTurnTimer(roomCode);
    }
  }, 1000);

  timers.set(roomCode, interval);
}

function stopTurnTimer(roomCode) {
  const interval = timers.get(roomCode);
  if (interval) { clearInterval(interval); timers.delete(roomCode); }
}

function resetTurnTimer(roomCode) {
  const room = getRoom(roomCode);
  if (!room) return;
  room.turnTimer = TURN_TIMER_SECONDS;
  stopTurnTimer(roomCode);
  startTurnTimer(roomCode);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // HOST: create a new room
  socket.on('create-room', ({ idols }) => {
    const state = createRoom(idols);
    socket.join(state.roomCode);
    socketRoomMap.set(socket.id, state.roomCode);
    socket.emit('room-created', { roomCode: state.roomCode });
    socket.emit('game-state', getPublicState(state.roomCode));
  });

  // PLAYER: join existing room
  socket.on('join-room', ({ roomCode, name }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Room not found' });
    if (room.status !== 'waiting') return socket.emit('error', { message: 'Game already started' });

    const player = addPlayer(roomCode, socket.id, name);
    if (!player) return socket.emit('error', { message: 'Room is full' });

    socket.join(roomCode);
    socketRoomMap.set(socket.id, roomCode);
    socket.emit('joined-room', { player, roomCode });
    io.to(roomCode).emit('game-state', getPublicState(roomCode));
  });

  // HOST: start the game
  socket.on('start-game', ({ roomCode }) => {
    const ok = startGame(roomCode);
    if (!ok) return socket.emit('error', { message: 'Cannot start game' });

    io.to(roomCode).emit('game-started');
    io.to(roomCode).emit('game-state', getPublicState(roomCode));
    startTurnTimer(roomCode);
  });

  // PLAYER: flip a card
  socket.on('flip-card', ({ roomCode, cardId }) => {
    const result = flipCard(roomCode, socket.id, cardId);
    if (result.error) return socket.emit('error', { message: result.error });

    io.to(roomCode).emit('game-state', getPublicState(roomCode));

    if (result.gameOver) {
      stopTurnTimer(roomCode);
      io.to(roomCode).emit('game-over', { players: getPublicState(roomCode).players });
      return;
    }

    if (result.match === false) {
      // Show the non-match for a moment, then flip back and advance turn
      stopTurnTimer(roomCode);
      setTimeout(() => {
        resolveNoMatch(roomCode);
        io.to(roomCode).emit('game-state', getPublicState(roomCode));
        startTurnTimer(roomCode);
      }, CARD_FLIP_DELAY_MS);
    }

    if (result.match === true) {
      io.to(roomCode).emit('match-found', {
        playerId: socket.id,
        playerName: getPublicState(roomCode).players.find(p => p.id === socket.id)?.name,
      });
      resetTurnTimer(roomCode);
    }
  });

  socket.on('disconnect', () => {
    const roomCode = socketRoomMap.get(socket.id);
    if (roomCode) {
      removePlayer(roomCode, socket.id);
      socketRoomMap.delete(socket.id);
      const state = getPublicState(roomCode);
      if (state) {
        io.to(roomCode).emit('game-state', state);
        // If it was this player's turn, advance
        if (state.status === 'playing') {
          const currentPlayer = state.players[state.currentPlayerIndex];
          if (currentPlayer?.id === socket.id) {
            stopTurnTimer(roomCode);
            // Also flip back any exposed cards from this player's unfinished turn
            resolveNoMatch(roomCode);
            io.to(roomCode).emit('game-state', getPublicState(roomCode));
            startTurnTimer(roomCode);
          }
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createRoom, getRoom, addPlayer, removePlayer,
  startGame, flipCard, resolveNoMatch, advanceTurn,
  getPublicState, deleteRoom, endGameEarly, CARD_FLIP_DELAY_MS,
} = require('./gameManager');
const { TURN_TIMER_SECONDS } = require('./constants');

const app = express();
app.use(cors());
app.get('/health', (_, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
  pingTimeout: 30000,
  pingInterval: 10000,
});

// Store socket->room mapping for disconnect handling
const socketRoomMap = new Map();
// Store host socket per room
const roomHostMap = new Map(); // roomCode -> socketId

// Turn timer helpers
const timers = new Map(); // roomCode -> intervalId
// Track rooms with pending no-match flip-back
const pendingFlipBack = new Map(); // roomCode -> timeoutId

function startTurnTimer(roomCode) {
  stopTurnTimer(roomCode);
  const room = getRoom(roomCode);
  if (!room || room.status !== 'playing') return;
  room.turnTimer = TURN_TIMER_SECONDS;

  const interval = setInterval(() => {
    const r = getRoom(roomCode);
    if (!r || r.status !== 'playing') { clearInterval(interval); timers.delete(roomCode); return; }
    r.turnTimer -= 1;
    io.to(roomCode).emit('timer-tick', { timeLeft: r.turnTimer });
    if (r.turnTimer <= 0) {
      clearInterval(interval);
      timers.delete(roomCode);
      // Clear any pending flip-back
      clearPendingFlipBack(roomCode);
      resolveNoMatch(roomCode);
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

function clearPendingFlipBack(roomCode) {
  const timeout = pendingFlipBack.get(roomCode);
  if (timeout) { clearTimeout(timeout); pendingFlipBack.delete(roomCode); }
}

function cleanupRoom(roomCode) {
  stopTurnTimer(roomCode);
  clearPendingFlipBack(roomCode);
  roomHostMap.delete(roomCode);
  deleteRoom(roomCode);
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // HOST: create a new room
  socket.on('create-room', ({ idols }) => {
    const state = createRoom(idols);
    socket.join(state.roomCode);
    socketRoomMap.set(socket.id, state.roomCode);
    roomHostMap.set(state.roomCode, socket.id);
    socket.emit('room-created', { roomCode: state.roomCode });
    socket.emit('game-state', getPublicState(state.roomCode));
  });

  // PLAYER: join existing room
  socket.on('join-room', ({ roomCode, name }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala no encontrada. Puede que haya expirado.' });
    if (room.status !== 'waiting') return socket.emit('error', { message: 'El juego ya empezó' });

    const player = addPlayer(roomCode, socket.id, name);
    if (!player) return socket.emit('error', { message: 'La sala está llena' });

    socket.join(roomCode);
    socketRoomMap.set(socket.id, roomCode);
    socket.emit('joined-room', { player, roomCode });
    io.to(roomCode).emit('game-state', getPublicState(roomCode));
  });

  // HOST: start the game
  socket.on('start-game', ({ roomCode }) => {
    const ok = startGame(roomCode);
    if (!ok) return socket.emit('error', { message: 'No se puede iniciar el juego' });

    io.to(roomCode).emit('game-started');
    io.to(roomCode).emit('game-state', getPublicState(roomCode));
    startTurnTimer(roomCode);
  });

  // HOST or PLAYER: end game early
  socket.on('end-game', ({ roomCode }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    
    const ok = endGameEarly(roomCode);
    if (ok) {
      stopTurnTimer(roomCode);
      clearPendingFlipBack(roomCode);
      io.to(roomCode).emit('game-over', { players: getPublicState(roomCode).players });
    }
  });

  // HOST or PLAYER: leave room and go back to menu
  socket.on('leave-room', ({ roomCode }) => {
    socket.leave(roomCode);
    socketRoomMap.delete(socket.id);
    
    const isRoomHost = roomHostMap.get(roomCode) === socket.id;
    
    if (isRoomHost) {
      // Host left: end the game and clean up
      stopTurnTimer(roomCode);
      clearPendingFlipBack(roomCode);
      io.to(roomCode).emit('room-closed', { message: 'El host cerró la sala' });
      cleanupRoom(roomCode);
    } else {
      // Player left
      removePlayer(roomCode, socket.id);
      const state = getPublicState(roomCode);
      if (state) {
        io.to(roomCode).emit('game-state', state);
      }
    }
  });

  // PLAYER: flip a card
  socket.on('flip-card', ({ roomCode, cardId }) => {
    const room = getRoom(roomCode);
    if (!room) return socket.emit('error', { message: 'Sala no encontrada' });
    
    // Ignore flips while a no-match is being resolved
    if (pendingFlipBack.has(roomCode)) return;
    
    const result = flipCard(roomCode, socket.id, cardId);
    if (result.error) {
      // Don't alert for non-critical errors like "Not your turn" or "Invalid card"
      // These happen naturally from race conditions and double-clicks
      console.log(`flip-card warning: ${result.error} (player: ${socket.id})`);
      return;
    }

    io.to(roomCode).emit('game-state', getPublicState(roomCode));

    if (result.gameOver) {
      stopTurnTimer(roomCode);
      io.to(roomCode).emit('game-over', { players: getPublicState(roomCode).players });
      return;
    }

    if (result.match === false) {
      // Show the non-match for a moment, then flip back and advance turn
      stopTurnTimer(roomCode);
      const timeout = setTimeout(() => {
        pendingFlipBack.delete(roomCode);
        const r = getRoom(roomCode);
        if (!r || r.status !== 'playing') return;
        resolveNoMatch(roomCode);
        io.to(roomCode).emit('game-state', getPublicState(roomCode));
        startTurnTimer(roomCode);
      }, CARD_FLIP_DELAY_MS);
      pendingFlipBack.set(roomCode, timeout);
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
      const isRoomHost = roomHostMap.get(roomCode) === socket.id;
      
      // Check turn ownership BEFORE mutating player state
      const stateBeforeRemoval = getPublicState(roomCode);
      const wasCurrentPlayer = stateBeforeRemoval?.status === 'playing' &&
        stateBeforeRemoval.players[stateBeforeRemoval.currentPlayerIndex]?.id === socket.id;

      removePlayer(roomCode, socket.id);
      socketRoomMap.delete(socket.id);
      const state = getPublicState(roomCode);

      // Clean up room if all players are gone
      const room = getRoom(roomCode);
      const allGone = room?.players.every(p => !p.connected);
      if (allGone || isRoomHost) {
        // If host disconnected, close everything
        if (isRoomHost && !allGone) {
          io.to(roomCode).emit('room-closed', { message: 'El host se desconectó' });
        }
        cleanupRoom(roomCode);
      } else if (state) {
        io.to(roomCode).emit('game-state', state);
        // If it was this player's turn, flip back any cards, advance turn, restart timer
        if (wasCurrentPlayer) {
          stopTurnTimer(roomCode);
          clearPendingFlipBack(roomCode);
          resolveNoMatch(roomCode);
          io.to(roomCode).emit('game-state', getPublicState(roomCode));
          startTurnTimer(roomCode);
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

httpServer.listen(PORT, HOST, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Local: http://localhost:${PORT}`);
  
  const os = require('os');
  const interfaces = os.networkInterfaces();
  Object.keys(interfaces).forEach(name => {
    interfaces[name].forEach(addr => {
      if (addr.family === 'IPv4' && !addr.internal) {
        console.log(`Network: http://${addr.address}:${PORT}`);
      }
    });
  });
});

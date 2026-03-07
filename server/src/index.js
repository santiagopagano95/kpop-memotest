const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const {
  createRoom, getRoom, addPlayer, removePlayer,
  startGame, restartGame, flipCard, resolveNoMatch, advanceTurn,
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

const socketRoomMap = new Map();
const roomHostMap = new Map();
const timers = new Map();
const pendingFlipBack = new Map();

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

  socket.on('create-room', ({ idols, pairsCount }) => {
    const pairs = pairsCount || 6;
    const state = createRoom(idols, pairs);
    socket.join(state.roomCode);
    socketRoomMap.set(socket.id, state.roomCode);
    roomHostMap.set(state.roomCode, socket.id);
    socket.emit('room-created', { roomCode: state.roomCode });
    socket.emit('game-state', getPublicState(state.roomCode));
  });

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

  socket.on('start-game', ({ roomCode }) => {
    const ok = startGame(roomCode);
    if (!ok) return socket.emit('error', { message: 'No se puede iniciar el juego' });

    io.to(roomCode).emit('game-started');
    io.to(roomCode).emit('game-state', getPublicState(roomCode));
    startTurnTimer(roomCode);
  });

  socket.on('restart-game', ({ roomCode }) => {
    const ok = restartGame(roomCode);
    if (!ok) return socket.emit('error', { message: 'No se puede reiniciar' });

    stopTurnTimer(roomCode);
    clearPendingFlipBack(roomCode);
    io.to(roomCode).emit('game-restarted');
    io.to(roomCode).emit('game-state', getPublicState(roomCode));
  });

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

  socket.on('leave-room', ({ roomCode }) => {
    socket.leave(roomCode);
    socketRoomMap.delete(socket.id);
    const isRoomHost = roomHostMap.get(roomCode) === socket.id;
    if (isRoomHost) {
      io.to(roomCode).emit('room-closed', { message: 'El host cerró la sala' });
      cleanupRoom(roomCode);
    } else {
      removePlayer(roomCode, socket.id);
      const state = getPublicState(roomCode);
      if (state) io.to(roomCode).emit('game-state', state);
    }
  });

  socket.on('flip-card', ({ roomCode, cardId }) => {
    const room = getRoom(roomCode);
    if (!room) return;
    if (pendingFlipBack.has(roomCode)) return;

    const result = flipCard(roomCode, socket.id, cardId);
    if (result.error) {
      console.log(`flip-card: ${result.error} (${socket.id})`);
      return;
    }

    io.to(roomCode).emit('game-state', getPublicState(roomCode));

    if (result.gameOver) {
      stopTurnTimer(roomCode);
      io.to(roomCode).emit('game-over', { players: getPublicState(roomCode).players });
      return;
    }

    if (result.match === false) {
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
      const stateBeforeRemoval = getPublicState(roomCode);
      const wasCurrentPlayer = stateBeforeRemoval?.status === 'playing' &&
        stateBeforeRemoval.players[stateBeforeRemoval.currentPlayerIndex]?.id === socket.id;

      removePlayer(roomCode, socket.id);
      socketRoomMap.delete(socket.id);

      const room = getRoom(roomCode);
      const allGone = room?.players.every(p => !p.connected);
      if (allGone || isRoomHost) {
        if (isRoomHost && !allGone) {
          io.to(roomCode).emit('room-closed', { message: 'El host se desconectó' });
        }
        cleanupRoom(roomCode);
      } else {
        io.to(roomCode).emit('game-state', getPublicState(roomCode));
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
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
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

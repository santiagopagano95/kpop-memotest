# K-Pop Memotest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a real-time multiplayer K-Pop memory card game (memotest) where players join from their phones and take turns on a shared board visible on TV/tablet.

**Architecture:** React frontend (Vercel) + Node.js/Socket.io backend (Railway). The server owns all game state and broadcasts updates to all connected clients. The frontend has two views: HostView (TV/tablet, read-only board + scoreboard) and PlayerView (phone, interactive board on your turn / waiting screen otherwise).

**Tech Stack:** React 18, Vite, Socket.io-client, Node.js, Express, Socket.io, canvas-confetti, Framer Motion (card flip animations), Tailwind CSS.

---

## Task 1: Project Scaffolding

**Files:**
- Create: `server/package.json`
- Create: `server/src/index.js`
- Create: `client/` (Vite React app)
- Create: `client/src/data/idols.js`

**Step 1: Initialize the server**

```bash
mkdir server && cd server
npm init -y
npm install express socket.io cors
npm install --save-dev nodemon
```

Add to `server/package.json` scripts:
```json
"scripts": {
  "start": "node src/index.js",
  "dev": "nodemon src/index.js"
}
```

**Step 2: Create the Express + Socket.io entry point**

Create `server/src/index.js`:
```js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.get('/health', (_, res) => res.json({ ok: true }));

const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

**Step 3: Scaffold the React client with Vite**

```bash
cd ..
npm create vite@latest client -- --template react
cd client
npm install
npm install socket.io-client framer-motion canvas-confetti
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Configure `client/tailwind.config.js`:
```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: { extend: {} },
  plugins: [],
}
```

Add to `client/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**Step 4: Create the idol data file**

Create `client/src/data/idols.js`:
```js
// Add idol photos to client/public/images/idols/
// Each image should be square, min 300x300px

export const IDOLS = [
  { id: 'jin-bts',       name: 'Jin',       group: 'BTS',        image: 'jin.jpg' },
  { id: 'jungkook-bts',  name: 'Jungkook',  group: 'BTS',        image: 'jungkook.jpg' },
  { id: 'taehyung-bts',  name: 'V',         group: 'BTS',        image: 'taehyung.jpg' },
  { id: 'jimin-bts',     name: 'Jimin',     group: 'BTS',        image: 'jimin.jpg' },
  { id: 'momo-twice',    name: 'Momo',      group: 'TWICE',      image: 'momo.jpg' },
  { id: 'nayeon-twice',  name: 'Nayeon',    group: 'TWICE',      image: 'nayeon.jpg' },
  { id: 'lisa-bp',       name: 'Lisa',      group: 'BLACKPINK',  image: 'lisa.jpg' },
  { id: 'jennie-bp',     name: 'Jennie',    group: 'BLACKPINK',  image: 'jennie.jpg' },
  { id: 'felix-skz',     name: 'Felix',     group: 'Stray Kids', image: 'felix.jpg' },
  { id: 'hyunjin-skz',   name: 'Hyunjin',   group: 'Stray Kids', image: 'hyunjin.jpg' },
  { id: 'karina-aespa',  name: 'Karina',    group: 'aespa',      image: 'karina.jpg' },
  { id: 'winter-aespa',  name: 'Winter',    group: 'aespa',      image: 'winter.jpg' },
];
```

**Step 5: Create placeholder image directories**

```bash
mkdir -p client/public/images/idols
mkdir -p client/public/audio
```

Create `client/public/images/idols/placeholder.jpg` — use any 300x300 placeholder image for development.

**Step 6: Verify both servers start**

```bash
# Terminal 1
cd server && npm run dev
# Expected: "Server running on port 3001"

# Terminal 2
cd client && npm run dev
# Expected: Vite dev server on http://localhost:5173
```

**Step 7: Commit**

```bash
git add .
git commit -m "feat: scaffold client and server projects"
```

---

## Task 2: Server — Game Manager (Core Logic)

**Files:**
- Create: `server/src/gameManager.js`
- Create: `server/src/constants.js`

**Step 1: Create constants**

Create `server/src/constants.js`:
```js
module.exports = {
  TURN_TIMER_SECONDS: 30,
  MAX_PLAYERS: 6,
  CARD_FLIP_DELAY_MS: 1000,  // time to show non-match before flipping back
};
```

**Step 2: Create the game manager**

Create `server/src/gameManager.js`:
```js
const { TURN_TIMER_SECONDS, CARD_FLIP_DELAY_MS } = require('./constants');

const rooms = new Map(); // roomCode -> gameState

function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function createCards(idols) {
  const pairs = [...idols, ...idols]; // duplicate for pairs
  const shuffled = shuffleArray(pairs);
  return shuffled.map((idol, index) => ({
    id: index,
    idolId: idol.id,
    idolName: idol.name,
    idolGroup: idol.group,
    image: idol.image,
    isFlipped: false,
    isMatched: false,
  }));
}

function createRoom(idols) {
  const code = generateRoomCode();
  const state = {
    roomCode: code,
    players: [],
    cards: createCards(idols),
    currentPlayerIndex: 0,
    flippedCards: [],
    status: 'waiting', // 'waiting' | 'playing' | 'finished'
    turnTimer: TURN_TIMER_SECONDS,
    turnCount: 0,
    timerInterval: null,
  };
  rooms.set(code, state);
  return state;
}

function getRoom(code) {
  return rooms.get(code) || null;
}

function addPlayer(code, socketId, name) {
  const room = rooms.get(code);
  if (!room || room.status !== 'waiting') return null;
  if (room.players.length >= 6) return null;
  const player = { id: socketId, name, score: 0, connected: true };
  room.players.push(player);
  return player;
}

function removePlayer(code, socketId) {
  const room = rooms.get(code);
  if (!room) return;
  const player = room.players.find(p => p.id === socketId);
  if (player) player.connected = false;
}

function startGame(code) {
  const room = rooms.get(code);
  if (!room || room.players.length < 1) return false;
  room.status = 'playing';
  room.currentPlayerIndex = 0;
  return true;
}

function flipCard(code, socketId, cardId) {
  const room = rooms.get(code);
  if (!room || room.status !== 'playing') return { error: 'Game not active' };

  const currentPlayer = room.players[room.currentPlayerIndex];
  if (!currentPlayer || currentPlayer.id !== socketId) return { error: 'Not your turn' };
  if (room.flippedCards.length >= 2) return { error: 'Already flipped 2 cards' };

  const card = room.cards[cardId];
  if (!card || card.isFlipped || card.isMatched) return { error: 'Invalid card' };

  card.isFlipped = true;
  room.flippedCards.push(cardId);

  if (room.flippedCards.length === 2) {
    const [id1, id2] = room.flippedCards;
    const card1 = room.cards[id1];
    const card2 = room.cards[id2];

    if (card1.idolId === card2.idolId) {
      // Match!
      card1.isMatched = true;
      card2.isMatched = true;
      currentPlayer.score += 1;
      room.flippedCards = [];
      // Player gets another turn — no index change
      const allMatched = room.cards.every(c => c.isMatched);
      if (allMatched) {
        room.status = 'finished';
        return { match: true, gameOver: true };
      }
      return { match: true, gameOver: false };
    } else {
      // No match — schedule flip back
      return { match: false, gameOver: false };
    }
  }

  return { flipped: true };
}

function resolveNoMatch(code) {
  const room = rooms.get(code);
  if (!room) return;
  room.flippedCards.forEach(id => {
    room.cards[id].isFlipped = false;
  });
  room.flippedCards = [];
  advanceTurn(code);
}

function advanceTurn(code) {
  const room = rooms.get(code);
  if (!room) return;
  room.turnCount += 1;
  // Find next connected player
  let attempts = 0;
  do {
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    attempts++;
  } while (!room.players[room.currentPlayerIndex].connected && attempts < room.players.length);
  room.turnTimer = TURN_TIMER_SECONDS;
}

function getPublicState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  const { timerInterval, ...publicState } = room; // exclude internal timer ref
  return publicState;
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room?.timerInterval) clearInterval(room.timerInterval);
  rooms.delete(code);
}

module.exports = {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  startGame,
  flipCard,
  resolveNoMatch,
  advanceTurn,
  getPublicState,
  deleteRoom,
  CARD_FLIP_DELAY_MS,
};
```

**Step 3: Commit**

```bash
git add server/src/gameManager.js server/src/constants.js
git commit -m "feat: add server game manager with room and turn logic"
```

---

## Task 3: Server — Socket.io Event Handlers

**Files:**
- Modify: `server/src/index.js`

**Step 1: Replace the socket handler in index.js with full event handling**

Replace the `io.on('connection', ...)` block in `server/src/index.js`:

```js
const {
  createRoom, getRoom, addPlayer, removePlayer,
  startGame, flipCard, resolveNoMatch, advanceTurn,
  getPublicState, deleteRoom, CARD_FLIP_DELAY_MS,
} = require('./gameManager');
const { TURN_TIMER_SECONDS } = require('./constants');

// Store socket->room mapping for disconnect handling
const socketRoomMap = new Map();

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
            advanceTurn(roomCode);
            io.to(roomCode).emit('game-state', getPublicState(roomCode));
            startTurnTimer(roomCode);
          }
        }
      }
    }
    console.log('Client disconnected:', socket.id);
  });
});

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
```

**Step 2: Verify the server starts without errors**

```bash
cd server && npm run dev
```
Expected: No errors, server listens on port 3001.

**Step 3: Commit**

```bash
git add server/src/index.js
git commit -m "feat: add socket.io event handlers for full game flow"
```

---

## Task 4: Client — Socket Hook and Game Context

**Files:**
- Create: `client/src/hooks/useSocket.js`
- Create: `client/src/context/GameContext.jsx`

**Step 1: Create the socket hook**

Create `client/src/hooks/useSocket.js`:
```js
import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, { autoConnect: false });
  }
  return socket;
}

export function useSocket(eventHandlers = {}) {
  const s = getSocket();
  const handlersRef = useRef(eventHandlers);
  handlersRef.current = eventHandlers;

  useEffect(() => {
    s.connect();
    const entries = Object.entries(handlersRef.current);
    entries.forEach(([event, handler]) => s.on(event, handler));
    return () => {
      entries.forEach(([event, handler]) => s.off(event, handler));
    };
  }, []); // eslint-disable-line

  return s;
}
```

**Step 2: Create the game context**

Create `client/src/context/GameContext.jsx`:
```jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { getSocket, useSocket } from '../hooks/useSocket';
import { IDOLS } from '../data/idols';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);   // full server state
  const [roomCode, setRoomCode] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);     // { id, name, score }
  const [isHost, setIsHost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lastMatch, setLastMatch] = useState(null);   // { playerName } for animation
  const [view, setView] = useState('home');           // 'home'|'waiting'|'playing'|'victory'

  useSocket({
    'room-created': ({ roomCode: code }) => {
      setRoomCode(code);
      setView('waiting');
    },
    'joined-room': ({ player, roomCode: code }) => {
      setMyPlayer(player);
      setRoomCode(code);
      setView('waiting');
    },
    'game-state': (state) => {
      setGameState(state);
      if (state.status === 'playing' && view === 'waiting') setView('playing');
      if (state.status === 'finished') setView('victory');
    },
    'game-started': () => setView('playing'),
    'timer-tick': ({ timeLeft: t }) => setTimeLeft(t),
    'match-found': (data) => {
      setLastMatch(data);
      setTimeout(() => setLastMatch(null), 2000);
    },
    'game-over': () => setView('victory'),
    'error': ({ message }) => alert(message),
  });

  const createRoom = useCallback(() => {
    const socket = getSocket();
    setIsHost(true);
    socket.emit('create-room', { idols: IDOLS });
  }, []);

  const joinRoom = useCallback((code, name) => {
    const socket = getSocket();
    socket.emit('join-room', { roomCode: code.toUpperCase(), name });
  }, []);

  const startGame = useCallback(() => {
    const socket = getSocket();
    socket.emit('start-game', { roomCode });
  }, [roomCode]);

  const flipCard = useCallback((cardId) => {
    const socket = getSocket();
    socket.emit('flip-card', { roomCode, cardId });
  }, [roomCode]);

  const isMyTurn = useCallback(() => {
    if (!gameState || !myPlayer) return false;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.id === myPlayer.id;
  }, [gameState, myPlayer]);

  return (
    <GameContext.Provider value={{
      gameState, roomCode, myPlayer, isHost,
      timeLeft, lastMatch, view,
      createRoom, joinRoom, startGame, flipCard, isMyTurn,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
```

**Step 3: Wrap app in provider**

Replace `client/src/main.jsx`:
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GameProvider } from './context/GameContext.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)
```

**Step 4: Commit**

```bash
git add client/src/hooks client/src/context client/src/main.jsx
git commit -m "feat: add socket hook and game context"
```

---

## Task 5: Client — Card Component with Flip Animation

**Files:**
- Create: `client/src/components/Card/Card.jsx`
- Create: `client/src/components/Card/Card.css`

**Step 1: Create the Card CSS for 3D flip**

Create `client/src/components/Card/Card.css`:
```css
.card-container {
  perspective: 800px;
  cursor: pointer;
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  transform-style: preserve-3d;
}

.card-inner.flipped {
  transform: rotateY(180deg);
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  overflow: hidden;
}

.card-back {
  background: linear-gradient(135deg, #1a0533, #2d0f5e, #1a0533);
  border: 2px solid rgba(200, 100, 255, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-front {
  transform: rotateY(180deg);
  background: #0f0f1a;
  border: 2px solid rgba(255, 100, 200, 0.6);
}

.card-back-shimmer {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    45deg,
    transparent 30%,
    rgba(200, 100, 255, 0.15) 50%,
    transparent 70%
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%) rotate(45deg); }
  100% { transform: translateX(200%) rotate(45deg); }
}

.card-matched {
  border-color: #ffd700 !important;
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
}
```

**Step 2: Create the Card component**

Create `client/src/components/Card/Card.jsx`:
```jsx
import { motion } from 'framer-motion';
import './Card.css';

export default function Card({ card, onClick, disabled }) {
  const handleClick = () => {
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick(card.id);
    }
  };

  return (
    <div
      className={`card-container aspect-square`}
      onClick={handleClick}
      style={{ cursor: disabled || card.isFlipped || card.isMatched ? 'default' : 'pointer' }}
    >
      <div className={`card-inner ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}>
        {/* Back */}
        <div className="card-face card-back">
          <div className="card-back-shimmer" />
          <span className="text-purple-300 text-2xl select-none">✦</span>
        </div>

        {/* Front */}
        <div className={`card-face card-front ${card.isMatched ? 'card-matched' : ''}`}>
          <img
            src={`/images/idols/${card.image}`}
            alt={card.idolName}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/images/idols/placeholder.jpg'; }}
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
            <p className="text-white text-xs font-bold text-center leading-tight truncate">
              {card.idolName}
            </p>
            <p className="text-purple-300 text-xs text-center truncate">
              {card.idolGroup}
            </p>
          </div>
          {card.isMatched && (
            <motion.div
              className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <span className="text-yellow-400 text-3xl">★</span>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/components/Card
git commit -m "feat: add Card component with 3D flip animation"
```

---

## Task 6: Client — Board Component

**Files:**
- Create: `client/src/components/Board/Board.jsx`

**Step 1: Create Board component**

Create `client/src/components/Board/Board.jsx`:
```jsx
import Card from '../Card/Card';

export default function Board({ cards, onFlip, canInteract }) {
  return (
    <div className="grid grid-cols-6 gap-2 w-full max-w-2xl">
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          onClick={onFlip}
          disabled={!canInteract}
        />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/Board
git commit -m "feat: add Board component"
```

---

## Task 7: Client — Scoreboard Component

**Files:**
- Create: `client/src/components/Scoreboard/Scoreboard.jsx`

**Step 1: Create Scoreboard component**

Create `client/src/components/Scoreboard/Scoreboard.jsx`:
```jsx
export default function Scoreboard({ players, currentPlayerIndex, timeLeft }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 w-full">
      <h2 className="text-purple-300 font-bold text-sm uppercase tracking-wider mb-3">
        Puntajes
      </h2>

      <div className="space-y-2">
        {sorted.map((player, i) => {
          const isCurrent = players[currentPlayerIndex]?.id === player.id;
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all
                ${isCurrent ? 'bg-pink-500/20 border border-pink-400/50' : 'bg-white/5'}`}
            >
              <span className="text-yellow-400 text-sm w-5">
                {i === 0 ? '👑' : `${i + 1}.`}
              </span>
              <span className={`flex-1 text-sm font-semibold truncate
                ${player.connected ? 'text-white' : 'text-gray-500'}`}>
                {player.name}
              </span>
              <span className="text-pink-300 font-bold text-sm">{player.score}</span>
            </div>
          );
        })}
      </div>

      {/* Turn timer */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-purple-300 mb-1">
          <span>Turno</span>
          <span>{timeLeft}s</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000
              ${timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-500'}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/Scoreboard
git commit -m "feat: add Scoreboard component with timer bar"
```

---

## Task 8: Client — WaitingRoom Component

**Files:**
- Create: `client/src/components/WaitingRoom/WaitingRoom.jsx`

**Step 1: Create WaitingRoom component**

Create `client/src/components/WaitingRoom/WaitingRoom.jsx`:
```jsx
import { useGame } from '../../context/GameContext';
import QRCode from 'qrcode.react'; // install separately

export default function WaitingRoom() {
  const { gameState, roomCode, isHost, myPlayer, startGame } = useGame();
  const players = gameState?.players || [];
  const joinUrl = `${window.location.origin}?room=${roomCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col items-center justify-center p-6 gap-8">

      <h1 className="text-4xl font-black text-transparent bg-clip-text
        bg-gradient-to-r from-pink-400 to-purple-400">
        ✨ K-Pop Memotest ✨
      </h1>

      {isHost ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-purple-200 text-lg">Codigo de sala:</p>
          <div className="text-6xl font-black text-pink-400 tracking-widest">{roomCode}</div>
          <div className="bg-white p-3 rounded-2xl">
            <QRCode value={joinUrl} size={160} />
          </div>
          <p className="text-purple-300 text-sm">{joinUrl}</p>
        </div>
      ) : (
        <p className="text-purple-200">Sala: <strong className="text-pink-400">{roomCode}</strong></p>
      )}

      <div className="bg-white/5 rounded-2xl p-6 w-full max-w-sm border border-purple-500/30">
        <h2 className="text-white font-bold mb-4">
          Jugadoras ({players.length})
        </h2>
        <ul className="space-y-2">
          {players.map(p => (
            <li key={p.id} className="flex items-center gap-2 text-white">
              <span className="text-pink-400">♪</span>
              <span>{p.name}</span>
              {p.id === myPlayer?.id && <span className="text-xs text-purple-400">(vos)</span>}
            </li>
          ))}
          {players.length === 0 && (
            <li className="text-purple-400 text-sm">Esperando jugadoras...</li>
          )}
        </ul>
      </div>

      {isHost && players.length >= 1 && (
        <button
          onClick={startGame}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600
            rounded-full text-white font-black text-lg shadow-lg
            hover:scale-105 transition-transform active:scale-95"
        >
          ¡Iniciar Juego!
        </button>
      )}

      {!isHost && (
        <p className="text-purple-300 animate-pulse">
          Esperando que el host inicie el juego...
        </p>
      )}
    </div>
  );
}
```

**Step 2: Install QR code package**

```bash
cd client && npm install qrcode.react
```

**Step 3: Commit**

```bash
git add client/src/components/WaitingRoom
git commit -m "feat: add WaitingRoom component with QR code"
```

---

## Task 9: Client — Victory Screen

**Files:**
- Create: `client/src/components/Victory/Victory.jsx`

**Step 1: Create Victory component**

Create `client/src/components/Victory/Victory.jsx`:
```jsx
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';

export default function Victory() {
  const { gameState } = useGame();
  const players = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);
  const winner = players[0];

  useEffect(() => {
    // Fire confetti
    const end = Date.now() + 4000;
    const colors = ['#ff6ad5', '#c774e8', '#ad8cff', '#8795e8', '#94d0ff'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col items-center justify-center p-6 gap-8">

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-8xl"
      >
        👑
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-black text-center text-transparent bg-clip-text
          bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400"
      >
        {winner ? `¡${winner.name} ganó!` : '¡Juego terminado!'}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/5 rounded-2xl p-6 w-full max-w-sm border border-purple-500/30"
      >
        <h2 className="text-white font-bold mb-4 text-center">Ranking Final</h2>
        <ul className="space-y-3">
          {players.map((p, i) => (
            <li key={p.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3
                ${i === 0 ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5'}`}>
              <span className="text-xl">{['👑','🥈','🥉'][i] || `${i+1}.`}</span>
              <span className="flex-1 text-white font-semibold">{p.name}</span>
              <span className="text-pink-300 font-bold">{p.score} pts</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add client/src/components/Victory
git commit -m "feat: add Victory screen with confetti"
```

---

## Task 10: Client — Host View and Player View

**Files:**
- Create: `client/src/views/HostView.jsx`
- Create: `client/src/views/PlayerView.jsx`

**Step 1: Create HostView**

Create `client/src/views/HostView.jsx`:
```jsx
import { useGame } from '../context/GameContext';
import Board from '../components/Board/Board';
import Scoreboard from '../components/Scoreboard/Scoreboard';

export default function HostView() {
  const { gameState, timeLeft } = useGame();
  if (!gameState) return null;

  const { cards, players, currentPlayerIndex } = gameState;
  const currentPlayer = players[currentPlayerIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col p-4 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-transparent bg-clip-text
          bg-gradient-to-r from-pink-400 to-purple-400">
          ✨ K-Pop Memotest
        </h1>
        <div className="text-right">
          <p className="text-purple-300 text-xs">Turno de:</p>
          <p className="text-pink-400 font-black text-lg">{currentPlayer?.name || '—'}</p>
        </div>
      </div>

      {/* Main: board + sidebar */}
      <div className="flex gap-4 flex-1 items-start">
        <div className="flex-1 flex justify-center">
          <Board cards={cards} onFlip={() => {}} canInteract={false} />
        </div>
        <div className="w-48 flex flex-col gap-4">
          <Scoreboard
            players={players}
            currentPlayerIndex={currentPlayerIndex}
            timeLeft={timeLeft}
          />
          <div className="bg-white/5 rounded-xl p-3 border border-purple-500/20 text-center">
            <p className="text-purple-300 text-xs">Pares restantes</p>
            <p className="text-pink-400 font-black text-2xl">
              {cards.filter(c => !c.isMatched).length / 2}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create PlayerView**

Create `client/src/views/PlayerView.jsx`:
```jsx
import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Board from '../components/Board/Board';

export default function PlayerView() {
  const { gameState, myPlayer, isMyTurn, flipCard, timeLeft } = useGame();
  if (!gameState) return null;

  const { cards, players, currentPlayerIndex } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const myTurn = isMyTurn();
  const myScore = players.find(p => p.id === myPlayer?.id)?.score ?? 0;
  const myRank = [...players].sort((a, b) => b.score - a.score)
    .findIndex(p => p.id === myPlayer?.id) + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col p-3 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-white font-bold">{myPlayer?.name}</p>
        <div className="text-right">
          <p className="text-pink-400 font-black">{myScore} pts</p>
          <p className="text-purple-300 text-xs">#{myRank}</p>
        </div>
      </div>

      {/* Turn banner */}
      <AnimatePresence mode="wait">
        {myTurn ? (
          <motion.div
            key="your-turn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2 bg-gradient-to-r from-pink-500/30 to-purple-500/30
              rounded-xl border border-pink-400/50"
          >
            <p className="text-pink-400 font-black text-lg">⚡ ES TU TURNO ⚡</p>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2 bg-white/5 rounded-xl border border-purple-500/20"
          >
            <p className="text-purple-300 text-sm">
              Turno de: <span className="text-pink-300 font-bold">{currentPlayer?.name}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000
            ${timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-500'}`}
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      {/* Board */}
      <div className="flex-1 flex justify-center items-start">
        <Board
          cards={cards}
          onFlip={flipCard}
          canInteract={myTurn}
        />
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add client/src/views
git commit -m "feat: add HostView and PlayerView"
```

---

## Task 11: Client — Home Screen and App Router

**Files:**
- Modify: `client/src/App.jsx`
- Create: `client/src/views/HomeView.jsx`

**Step 1: Create HomeView**

Create `client/src/views/HomeView.jsx`:
```jsx
import { useState } from 'react';
import { useGame } from '../context/GameContext';

export default function HomeView() {
  const { createRoom, joinRoom } = useGame();
  const [mode, setMode] = useState(null); // null | 'host' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col items-center justify-center p-6 gap-8">

      <div className="text-center">
        <h1 className="text-5xl font-black text-transparent bg-clip-text
          bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 mb-2">
          ✨ K-Pop
        </h1>
        <h2 className="text-3xl font-black text-white">Memotest</h2>
      </div>

      {!mode && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={() => setMode('host')}
            className="py-4 bg-gradient-to-r from-pink-500 to-purple-600
              rounded-2xl text-white font-black text-lg shadow-lg
              hover:scale-105 transition-transform"
          >
            Crear sala (Host)
          </button>
          <button
            onClick={() => setMode('join')}
            className="py-4 bg-white/10 border border-purple-400/50
              rounded-2xl text-white font-bold text-lg
              hover:scale-105 transition-transform"
          >
            Unirme a una sala
          </button>
        </div>
      )}

      {mode === 'host' && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button
            onClick={createRoom}
            className="py-4 bg-gradient-to-r from-pink-500 to-purple-600
              rounded-2xl text-white font-black text-lg"
          >
            Crear sala nueva
          </button>
          <button onClick={() => setMode(null)} className="text-purple-400 text-sm">
            Volver
          </button>
        </div>
      )}

      {mode === 'join' && (
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            className="py-3 px-4 bg-white/10 border border-purple-400/50 rounded-xl
              text-white placeholder-purple-400 focus:outline-none focus:border-pink-400"
          />
          <input
            value={roomCode}
            onChange={e => setRoomCode(e.target.value.toUpperCase())}
            placeholder="Codigo de sala (ej: 4821)"
            maxLength={4}
            className="py-3 px-4 bg-white/10 border border-purple-400/50 rounded-xl
              text-white placeholder-purple-400 text-2xl tracking-widest text-center
              focus:outline-none focus:border-pink-400"
          />
          <button
            onClick={() => name && roomCode && joinRoom(roomCode, name)}
            disabled={!name || roomCode.length < 4}
            className="py-4 bg-gradient-to-r from-pink-500 to-purple-600
              rounded-2xl text-white font-black text-lg
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Unirme
          </button>
          <button onClick={() => setMode(null)} className="text-purple-400 text-sm">
            Volver
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Update App.jsx to route between views**

Replace `client/src/App.jsx`:
```jsx
import { useGame } from './context/GameContext';
import HomeView from './views/HomeView';
import HostView from './views/HostView';
import PlayerView from './views/PlayerView';
import WaitingRoom from './components/WaitingRoom/WaitingRoom';
import Victory from './components/Victory/Victory';

export default function App() {
  const { view, isHost } = useGame();

  if (view === 'home') return <HomeView />;
  if (view === 'waiting') return <WaitingRoom />;
  if (view === 'playing') return isHost ? <HostView /> : <PlayerView />;
  if (view === 'victory') return <Victory />;
  return <HomeView />;
}
```

**Step 3: Verify the app renders without errors**

```bash
cd client && npm run dev
```
Open http://localhost:5173 — should see the Home screen.

**Step 4: Commit**

```bash
git add client/src/App.jsx client/src/views/HomeView.jsx
git commit -m "feat: add HomeView and app router"
```

---

## Task 12: Client — Auto-join from URL (QR code flow)

**Files:**
- Modify: `client/src/views/HomeView.jsx`

**Step 1: Read `?room=XXXX` param on mount and pre-fill join form**

Add to HomeView.jsx, inside the component before the return:
```jsx
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const roomParam = params.get('room');
  if (roomParam) {
    setMode('join');
    setRoomCode(roomParam.toUpperCase());
  }
}, []);
```
Add `useEffect` to the import: `import { useState, useEffect } from 'react';`

**Step 2: Commit**

```bash
git add client/src/views/HomeView.jsx
git commit -m "feat: auto-fill room code from QR link"
```

---

## Task 13: Audio

**Files:**
- Create: `client/src/hooks/useAudio.js`
- Modify: `client/src/context/GameContext.jsx`

**Step 1: Add audio files**

Place the following files in `client/public/audio/`:
- `bg-music.mp3` — loopeable K-Pop instrumental (~30s)
- `flip.mp3` — short card flip sound
- `match.mp3` — short fanfare (~1s)
- `victory.mp3` — victory jingle (~3s)

Free sources: freesound.org, pixabay.com/music (search "kpop", "fanfare", "card flip")

**Step 2: Create audio hook**

Create `client/src/hooks/useAudio.js`:
```js
const audioCache = {};

function getAudio(src) {
  if (!audioCache[src]) {
    audioCache[src] = new Audio(src);
  }
  return audioCache[src];
}

export function playSound(src) {
  const audio = getAudio(src);
  audio.currentTime = 0;
  audio.play().catch(() => {}); // ignore autoplay errors
}

export function startBgMusic() {
  const audio = getAudio('/audio/bg-music.mp3');
  audio.loop = true;
  audio.volume = 0.3;
  audio.play().catch(() => {});
}

export function stopBgMusic() {
  const audio = getAudio('/audio/bg-music.mp3');
  audio.pause();
  audio.currentTime = 0;
}
```

**Step 3: Wire audio into GameContext**

Add to `client/src/context/GameContext.jsx`:
```js
import { playSound, startBgMusic, stopBgMusic } from '../hooks/useAudio';
```

In the socket event handlers:
- `game-started`: call `startBgMusic()`
- `match-found`: call `playSound('/audio/match.mp3')`
- `game-over`: call `stopBgMusic()` then `playSound('/audio/victory.mp3')`

In the `flipCard` callback, call `playSound('/audio/flip.mp3')` before emitting.

**Step 4: Commit**

```bash
git add client/src/hooks/useAudio.js client/src/context/GameContext.jsx
git commit -m "feat: add audio support for flip, match, and victory"
```

---

## Task 14: Deploy

**Step 1: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/kpop-memotest.git
git push -u origin main
```

**Step 2: Deploy backend to Railway**

1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select the `kpop-memotest` repo, set root directory to `server`
3. Railway auto-detects Node.js. Set env var `PORT=3001` if needed.
4. Copy the generated public URL (e.g. `https://kpop-memotest-server.up.railway.app`)

**Step 3: Configure frontend env**

Create `client/.env.production`:
```
VITE_SOCKET_URL=https://kpop-memotest-server.up.railway.app
```

**Step 4: Deploy frontend to Vercel**

1. Go to https://vercel.com → New Project → Import from GitHub
2. Set root directory to `client`
3. Add env variable: `VITE_SOCKET_URL` = Railway URL
4. Deploy. Vercel gives you a public URL.

**Step 5: Test the full flow**

1. Open Vercel URL on the tablet → Create sala → note PIN
2. Open Vercel URL on a phone → Join sala → enter PIN and name
3. Host presses Start → verify both devices sync
4. Flip cards → verify animations and score updates

**Step 6: Commit**

```bash
git add client/.env.production
git commit -m "chore: add production env config"
```

---

## Task 15: Add idol photos

**Step 1: Download photos**

Find square photos (min 300x300px) for each idol in `client/src/data/idols.js`. Good sources:
- Google Images
- Kprofiles.com
- Official group websites

**Step 2: Resize and optimize**

Recommended: use squoosh.app to compress each image to <100KB.

**Step 3: Place files**

Copy images to `client/public/images/idols/` matching the filenames in `idols.js`.

**Step 4: Test locally, then push**

```bash
cd client && npm run dev
# Verify all cards show idol photos
git add client/public/images
git commit -m "feat: add idol photos"
git push
```

Vercel will auto-deploy.

---

## Summary

| Task | Component | Est. Time |
|------|-----------|-----------|
| 1 | Scaffolding | 20 min |
| 2 | Server game logic | 30 min |
| 3 | Socket.io handlers | 20 min |
| 4 | Socket hook + context | 20 min |
| 5 | Card component | 20 min |
| 6 | Board component | 10 min |
| 7 | Scoreboard | 15 min |
| 8 | WaitingRoom | 20 min |
| 9 | Victory screen | 20 min |
| 10 | Host/Player views | 25 min |
| 11 | Home + router | 20 min |
| 12 | QR auto-join | 5 min |
| 13 | Audio | 15 min |
| 14 | Deploy | 30 min |
| 15 | Idol photos | 20 min |
| **Total** | | **~5 horas** |

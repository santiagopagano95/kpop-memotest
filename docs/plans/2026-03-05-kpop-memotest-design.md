# K-Pop Memotest — Design Document
**Date:** 2026-03-05  
**Status:** Approved

---

## Overview

A real-time multiplayer memory card game (memotest) with K-Pop idol photos, designed for a group of 3–5 players. One device (tablet/TV) acts as the host display; each player joins from their own phone. The experience is similar to Kahoot: players join a room via QR code or PIN, take turns flipping cards, and compete for the highest score.

---

## Architecture

### Approach: Opcion A — Full Multiplayer (Kahoot-style)

```
┌─────────────────────────────────────────────────────┐
│                    INTERNET                          │
│                                                      │
│  ┌─────────────────┐      ┌──────────────────────┐  │
│  │  Frontend        │      │  Backend             │  │
│  │  React App       │◄────►│  Node.js + Socket.io │  │
│  │  (Vercel)        │      │  (Railway)           │  │
│  └─────────────────┘      └──────────────────────┘  │
└─────────────────────────────────────────────────────┘
         ▲                          ▲
         │ same URL                 │ WebSocket
    ┌────┴────┐               ┌─────┴─────┐
    │  TV /   │               │  Players  │
    │ Tablet  │               │  (phones) │
    │ (host)  │               │           │
    └─────────┘               └───────────┘
```

- **Frontend (Vercel, free):** React app with two views — Host View (TV/tablet) and Player View (phone).
- **Backend (Railway, free tier):** Node.js + Express + Socket.io. Manages rooms, game state, turns, and scoring.
- **Images:** Static assets bundled with the frontend. Owner adds idol photos before the event.

---

## Game Flow

```
HOST (tablet/TV)                    PLAYERS (phones)
─────────────────                   ──────────────────
1. Opens app → creates room
2. Displays QR code + PIN

                                    3. Scan QR or enter PIN
                                    4. Enter name/nickname
                                    5. See waiting room

5. Sees joined players list
6. Presses "Start Game"

═══════════════════ GAME LOOP ════════════════════════

7. Player A's turn:
   - TV shows "Player A's turn"
   - TV shows board (read-only)
                                    8. Player A's phone: board active, taps card 1
                                    9. Player A's phone: taps card 2

10. If match:
    - Match animation on TV and phone
    - A scores a point, A plays again

11. If no match:
    - Cards flip back face-down
    - Turn passes to Player B
                                    12. Player B's phone activates, others wait

═══════════════════ END OF GAME ══════════════════════

13. All pairs found
14. Victory screen on TV
    (ranking, confetti, winner name)
                                    15. Each phone shows final position
```

**Turn timer:** 30 seconds per turn. A visible countdown bar is shown on both TV and the active player's phone. If time runs out, the turn passes automatically (no score penalty).

**Disconnection handling:** If a player disconnects, their turn is skipped automatically with a notice on TV.

**Extra turn rule:** Finding a pair grants an additional turn.

---

## UI / Visual Design

### Aesthetic
Dark background (deep navy/black) with neon accents in **pink, violet, and cyan**. Glassmorphism cards, gradients, shimmer effects. Bold modern typography (`Poppins` or `Nunito`).

### Host View (TV/Tablet)
- Game board (4×6 grid, 24 cards) on the left
- Sidebar on the right: current turn indicator, scoreboard, pairs remaining
- PIN and QR code visible in the header throughout the game

### Player View — Waiting
- Shows whose turn it is
- Shows own score and position
- Animated waiting indicator

### Player View — Active Turn
- Full interactive board
- "IT'S YOUR TURN!" banner
- 30-second countdown bar

### Cards
- **Back:** K-Pop themed pattern with game logo, shimmer animation
- **Front:** Idol photo + idol name + group name (e.g. "Jin — BTS")
- **Flip animation:** 3D Y-axis rotation
- **Match effect:** Gold sparkle + particles, card stays face-up permanently

### Victory Screen
- Confetti rain
- Animated crown for the winner
- Full ranking with player names
- Plays victory jingle

### Audio
- Background music: loopeable K-Pop instrumental track (~30s loop)
- Card flip sound effect
- Match fanfare (short)
- Victory jingle at game end

---

## Technical Structure

### Repository Layout
```
kpop-memotest/
├── client/                    # React app (Vercel)
│   ├── public/
│   │   ├── images/idols/      # Idol photos (added manually)
│   │   └── audio/             # Music and sound effects
│   ├── src/
│   │   ├── components/
│   │   │   ├── Board/
│   │   │   ├── Card/
│   │   │   ├── Scoreboard/
│   │   │   ├── WaitingRoom/
│   │   │   └── Victory/
│   │   ├── views/
│   │   │   ├── HostView.jsx
│   │   │   └── PlayerView.jsx
│   │   ├── hooks/
│   │   │   └── useSocket.js
│   │   └── context/
│   │       └── GameContext.jsx
│   └── package.json
│
└── server/                    # Node.js (Railway)
    ├── src/
    │   ├── index.js
    │   ├── gameManager.js
    │   └── constants.js
    └── package.json
```

### Game State Model (server)
```js
{
  roomCode: "4821",
  players: [
    { id: "socket_id", name: "Sofi", score: 4, connected: true }
  ],
  cards: [
    { id: 0, idol: "jin-bts", imageUrl: "/images/idols/jin.jpg",
      isFlipped: false, isMatched: false }
    // ... 23 more cards (12 pairs)
  ],
  currentPlayerIndex: 1,
  flippedCards: [3, 7],
  status: "waiting" | "playing" | "finished",
  turnTimer: 30,
  turnCount: 0
}
```

### Socket.io Events
| Event | Direction | Description |
|-------|-----------|-------------|
| `create-room` | client→server | Host creates a room |
| `join-room` | client→server | Player joins with PIN |
| `start-game` | client→server | Host starts the game |
| `flip-card` | client→server | Player flips a card |
| `game-state` | server→all | Full state broadcast |
| `match-found` | server→all | Pair found, triggers animation |
| `turn-change` | server→all | Turn change notification |
| `timer-tick` | server→all | Countdown update each second |
| `game-over` | server→all | Game ended with final ranking |

### Idol Configuration
```js
// client/src/data/idols.js
export const IDOLS = [
  { id: "jin-bts",      name: "Jin",      group: "BTS",     image: "jin.jpg" },
  { id: "jungkook-bts", name: "Jungkook", group: "BTS",     image: "jungkook.jpg" },
  { id: "momo-twice",   name: "Momo",     group: "TWICE",   image: "momo.jpg" },
  // ... up to 12 idols = 12 pairs = 24 cards
]
```

### Deploy
- **Frontend:** Vercel — connected to GitHub repo, auto-deploy on push
- **Backend:** Railway — `railway up` from `/server`, public HTTPS URL

---

## Constraints & Decisions

| Decision | Rationale |
|----------|-----------|
| React + Socket.io | Mature ecosystem, strong real-time primitives, fast to build |
| Static idol images | No external API dependency, full control over image quality |
| 12 pairs (24 cards) | Good challenge for 3–5 players without being too long |
| 30s turn timer | Keeps energy up, prevents stalling |
| Free tier deploy | Vercel + Railway free tiers are sufficient for a private party session |

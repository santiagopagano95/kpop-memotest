const { TURN_TIMER_SECONDS, MAX_PLAYERS, CARD_FLIP_DELAY_MS } = require('./constants');

const rooms = new Map();

function generateRoomCode() {
  let code;
  do {
    code = String(Math.floor(1000 + Math.random() * 9000));
  } while (rooms.has(code));
  return code;
}

function shuffleArray(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomIdols(allIdols, count) {
  return shuffleArray(allIdols).slice(0, count);
}

function createCards(idols) {
  const pairs = [...idols, ...idols];
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

function createRoom(allIdols, pairsCount) {
  const code = generateRoomCode();
  const selectedIdols = pickRandomIdols(allIdols, pairsCount);
  const state = {
    roomCode: code,
    players: [],
    cards: createCards(selectedIdols),
    currentPlayerIndex: 0,
    flippedCards: [],
    status: 'waiting',
    turnTimer: TURN_TIMER_SECONDS,
    turnCount: 0,
    timerInterval: null,
    pairsCount: pairsCount,
    allIdols: allIdols,  // Store for restart
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
  if (room.players.length >= MAX_PLAYERS) return null;
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

function restartGame(code) {
  const room = rooms.get(code);
  if (!room) return false;
  
  // Re-pick random idols and create new cards
  const selectedIdols = pickRandomIdols(room.allIdols, room.pairsCount);
  room.cards = createCards(selectedIdols);
  room.currentPlayerIndex = 0;
  room.flippedCards = [];
  room.status = 'waiting';
  room.turnTimer = TURN_TIMER_SECONDS;
  room.turnCount = 0;
  
  // Reset scores
  room.players.forEach(p => { p.score = 0; });
  
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
      card1.isMatched = true;
      card2.isMatched = true;
      currentPlayer.score += 1;
      room.flippedCards = [];
      const allMatched = room.cards.every(c => c.isMatched);
      if (allMatched) {
        room.status = 'finished';
        return { match: true, gameOver: true };
      }
      return { match: true, gameOver: false };
    } else {
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
  let attempts = 0;
  do {
    room.currentPlayerIndex = (room.currentPlayerIndex + 1) % room.players.length;
    attempts++;
  } while (!room.players[room.currentPlayerIndex].connected && attempts < room.players.length);
  if (!room.players[room.currentPlayerIndex].connected) {
    room.status = 'paused';
  }
  room.turnTimer = TURN_TIMER_SECONDS;
}

function getPublicState(code) {
  const room = rooms.get(code);
  if (!room) return null;
  // Exclude internal fields
  const { timerInterval, allIdols, ...publicState } = room;
  return publicState;
}

function deleteRoom(code) {
  const room = rooms.get(code);
  if (room?.timerInterval) clearInterval(room.timerInterval);
  rooms.delete(code);
}

function endGameEarly(code) {
  const room = rooms.get(code);
  if (!room) return false;
  room.status = 'finished';
  return true;
}

module.exports = {
  createRoom,
  getRoom,
  addPlayer,
  removePlayer,
  startGame,
  restartGame,
  flipCard,
  resolveNoMatch,
  advanceTurn,
  getPublicState,
  deleteRoom,
  endGameEarly,
  CARD_FLIP_DELAY_MS,
};

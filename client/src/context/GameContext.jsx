import { createContext, useContext, useState, useCallback } from 'react';
import { getSocket, useSocket } from '../hooks/useSocket';
import { IDOLS } from '../data/idols';
import { playSound, startBgMusic, stopBgMusic } from '../hooks/useAudio';

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
      setView(prev => {
        if (state.status === 'playing' && prev === 'waiting') return 'playing';
        if (state.status === 'finished') return 'victory';
        return prev;
      });
    },
    'game-started': () => {
      startBgMusic();
      setView('playing');
    },
    'timer-tick': ({ timeLeft: t }) => setTimeLeft(t),
    'match-found': (data) => {
      playSound('/audio/match.mp3');
      setLastMatch(data);
      setTimeout(() => setLastMatch(null), 2000);
    },
    'game-over': () => {
      stopBgMusic();
      playSound('/audio/victory.mp3');
      setView('victory');
    },
    'error': ({ message }) => alert(message),
  });

  const createRoom = useCallback(() => {
    const socket = getSocket();
    setIsHost(true);
    
    if (!socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      socket.connect();
      // Wait a moment for connection before emitting
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('create-room', { idols: IDOLS });
        } else {
          alert('Error: No se pudo conectar al servidor');
        }
      }, 500);
    } else {
      socket.emit('create-room', { idols: IDOLS });
    }
  }, []);

  const joinRoom = useCallback((code, name) => {
    const socket = getSocket();
    console.log('Joining room:', code, 'Socket URL:', socket.io.opts.hostname, 'Connected:', socket.connected);
    
    if (!socket.connected) {
      console.log('Socket not connected, attempting to connect...');
      socket.connect();
      setTimeout(() => {
        console.log('After timeout - Connected:', socket.connected);
        if (socket.connected) {
          socket.emit('join-room', { roomCode: code.toUpperCase(), name });
        } else {
          alert('Error: No se pudo conectar al servidor. Verifica que estés en el mismo WiFi.');
        }
      }, 1000);
    } else {
      socket.emit('join-room', { roomCode: code.toUpperCase(), name });
    }
  }, []);

  const startGame = useCallback(() => {
    const socket = getSocket();
    socket.emit('start-game', { roomCode });
  }, [roomCode]);

  const flipCard = useCallback((cardId) => {
    const socket = getSocket();
    playSound('/audio/flip.mp3');
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

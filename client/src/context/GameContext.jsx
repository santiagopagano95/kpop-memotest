import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSocket, useSocket } from '../hooks/useSocket';
import { ALL_IDOLS } from '../data/idols';
import { playSound, startBgMusic, stopBgMusic } from '../hooks/useAudio';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [gameState, setGameState] = useState(null);
  const [roomCode, setRoomCode] = useState(null);
  const [myPlayer, setMyPlayer] = useState(null);
  const [isHost, setIsHost] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [lastMatch, setLastMatch] = useState(null);
  const [view, setView] = useState('home');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [boardCols, setBoardCols] = useState(4);
  const [countdown, setCountdown] = useState(null);
  const [noMatchTrigger, setNoMatchTrigger] = useState(0);

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
      const totalCards = state.cards?.length || 24;
      if (totalCards <= 12) setBoardCols(4);
      else if (totalCards <= 16) setBoardCols(4);
      else setBoardCols(5);

      setView(prev => {
        if (state.status === 'playing' && prev === 'waiting') return 'playing';
        if (state.status === 'finished') return 'victory';
        return prev;
      });
    },
    'game-started': () => {
      setView('playing');
      setCountdown(3);
      let n = 3;
      const tick = setInterval(() => {
        n -= 1;
        if (n <= 0) {
          clearInterval(tick);
          setCountdown(null);
          startBgMusic();
        } else {
          setCountdown(n);
        }
      }, 1000);
    },
    'game-restarted': () => {
      stopBgMusic();
      setCountdown(null);
      setView('waiting');
    },
    'timer-tick': ({ timeLeft: t }) => setTimeLeft(t),
    'match-found': () => {
      playSound('match');
    },
    'no-match': () => {
      playSound('error');
      setNoMatchTrigger(n => n + 1);
    },
    'game-over': () => {
      stopBgMusic();
      playSound('victory');
      setView('victory');
    },
    'room-closed': ({ message }) => {
      stopBgMusic();
      resetState();
      alert(message);
    },
    'error': ({ message }) => {
      console.warn('Server:', message);
    },
  });

  useEffect(() => {
    const socket = getSocket();
    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', () => setConnectionStatus('connecting'));
    if (socket.connected) setConnectionStatus('connected');
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const resetState = useCallback(() => {
    setGameState(null);
    setRoomCode(null);
    setMyPlayer(null);
    setIsHost(false);
    setTimeLeft(30);
    setLastMatch(null);
    setView('home');
    setCountdown(null);
    setBoardCols(4);
    stopBgMusic();
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const createRoom = useCallback((pairsCount = 6) => {
    const socket = getSocket();
    if (!socket.connected) return;
    setIsHost(true);
    socket.emit('create-room', { idols: ALL_IDOLS, pairsCount });
  }, []);

  const joinRoom = useCallback((code, name) => {
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit('join-room', { roomCode: code.toUpperCase(), name });
  }, []);

  const startGame = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected) return;
    socket.emit('start-game', { roomCode });
  }, [roomCode]);

  const restartGame = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected || !roomCode) return;
    socket.emit('restart-game', { roomCode });
  }, [roomCode]);

  const flipCard = useCallback((cardId) => {
    const socket = getSocket();
    if (!socket.connected) return;
    playSound('flip');
    socket.emit('flip-card', { roomCode, cardId });
  }, [roomCode]);

  const endGame = useCallback(() => {
    const socket = getSocket();
    if (!socket.connected || !roomCode) return;
    socket.emit('end-game', { roomCode });
  }, [roomCode]);

  const leaveRoom = useCallback(() => {
    const socket = getSocket();
    if (socket.connected && roomCode) {
      socket.emit('leave-room', { roomCode });
    }
    resetState();
  }, [roomCode, resetState]);

  const isMyTurn = useCallback(() => {
    if (!gameState || !myPlayer) return false;
    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    return currentPlayer?.id === myPlayer.id;
  }, [gameState, myPlayer]);

  return (
    <GameContext.Provider value={{
      gameState, roomCode, myPlayer, isHost,
      timeLeft, lastMatch, view, connectionStatus, boardCols, countdown, noMatchTrigger,
      createRoom, joinRoom, startGame, restartGame, flipCard, isMyTurn,
      endGame, leaveRoom, resetState,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getSocket, useSocket } from '../hooks/useSocket';
import { IDOLS } from '../data/idols';
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
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // 'connected' | 'connecting' | 'disconnected'

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
    'room-closed': ({ message }) => {
      stopBgMusic();
      resetState();
      alert(message);
    },
    'error': ({ message }) => {
      console.warn('Server error:', message);
      // Only alert for important errors, not race conditions
      if (!message.includes('Not your turn') && !message.includes('Invalid card') && !message.includes('Already flipped')) {
        alert(message);
      }
    },
  });

  // Track connection status
  useEffect(() => {
    const socket = getSocket();
    
    const onConnect = () => setConnectionStatus('connected');
    const onDisconnect = () => setConnectionStatus('disconnected');
    const onReconnecting = () => setConnectionStatus('connecting');
    
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.io.on('reconnect_attempt', onReconnecting);
    
    if (socket.connected) setConnectionStatus('connected');
    
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.io.off('reconnect_attempt', onReconnecting);
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
    stopBgMusic();
    // Clear URL params
    window.history.replaceState({}, '', window.location.pathname);
  }, []);

  const ensureConnected = useCallback(() => {
    return new Promise((resolve, reject) => {
      const socket = getSocket();
      if (socket.connected) {
        resolve(socket);
        return;
      }
      
      setConnectionStatus('connecting');
      socket.connect();
      
      const timeout = setTimeout(() => {
        socket.off('connect', onConnect);
        setConnectionStatus('disconnected');
        reject(new Error('No se pudo conectar al servidor. Intentá de nuevo.'));
      }, 5000);
      
      const onConnect = () => {
        clearTimeout(timeout);
        setConnectionStatus('connected');
        resolve(socket);
      };
      
      socket.once('connect', onConnect);
    });
  }, []);

  const createRoom = useCallback(async () => {
    try {
      const socket = await ensureConnected();
      setIsHost(true);
      socket.emit('create-room', { idols: IDOLS });
    } catch (err) {
      alert(err.message);
    }
  }, [ensureConnected]);

  const joinRoom = useCallback(async (code, name) => {
    try {
      const socket = await ensureConnected();
      socket.emit('join-room', { roomCode: code.toUpperCase(), name });
    } catch (err) {
      alert(err.message);
    }
  }, [ensureConnected]);

  const startGame = useCallback(async () => {
    try {
      const socket = await ensureConnected();
      socket.emit('start-game', { roomCode });
    } catch (err) {
      alert(err.message);
    }
  }, [roomCode, ensureConnected]);

  const flipCard = useCallback((cardId) => {
    const socket = getSocket();
    if (!socket.connected) return; // silently ignore if disconnected
    playSound('/audio/flip.mp3');
    socket.emit('flip-card', { roomCode, cardId });
  }, [roomCode]);

  const endGame = useCallback(() => {
    const socket = getSocket();
    if (socket.connected && roomCode) {
      socket.emit('end-game', { roomCode });
    }
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
      timeLeft, lastMatch, view, connectionStatus,
      createRoom, joinRoom, startGame, flipCard, isMyTurn,
      endGame, leaveRoom, resetState,
    }}>
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);

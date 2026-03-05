import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';

export default function HomeView() {
  const { createRoom, joinRoom } = useGame();
  const [mode, setMode] = useState(null); // null | 'host' | 'join'
  const [name, setName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  // Task 12: Auto-fill room code from QR link (?room=XXXX)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setMode('join');
      setRoomCode(roomParam.toUpperCase());
    }
  }, []);

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

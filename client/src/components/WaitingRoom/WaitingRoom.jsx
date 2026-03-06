import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../../context/GameContext';
import { useLocalIP } from '../../hooks/useLocalIP';
import { useState } from 'react';

export default function WaitingRoom() {
  const { gameState, roomCode, isHost, myPlayer, startGame, leaveRoom } = useGame();
  const players = gameState?.players || [];
  const detectedIP = useLocalIP();
  const [manualIP, setManualIP] = useState('');
  
  const localIP = manualIP || detectedIP;
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  // Get current port from the page URL
  const port = window.location.port || '5173';
  const joinUrl = isLocalhost && localIP 
    ? `http://${localIP}:${port}?room=${roomCode}`
    : `${window.location.origin}?room=${roomCode}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col items-center justify-center p-6 gap-8">

      <img 
        src="/images/resources/Logo memotest.png?v=2" 
        alt="K-Pop Memotest"
        className="w-72 h-auto object-contain drop-shadow-2xl"
      />

      {isHost ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-purple-200 text-lg">Codigo de sala:</p>
          <div className="text-6xl font-black text-pink-400 tracking-widest">{roomCode}</div>
          
          {isLocalhost && !localIP ? (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-4 max-w-sm">
              <p className="text-yellow-200 text-sm mb-2">
                Para escanear desde el celular, ingresa tu IP local:
              </p>
              <input
                type="text"
                placeholder="192.168.1.x"
                value={manualIP}
                onChange={(e) => setManualIP(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-black/30 border border-yellow-500/30 
                  text-white placeholder-yellow-500/50 text-center"
              />
              <p className="text-yellow-300/60 text-xs mt-2">
                En Windows: ipconfig | En Mac/Linux: ifconfig
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white p-3 rounded-2xl">
                <QRCodeSVG value={joinUrl} size={160} />
              </div>
              <p className="text-purple-300 text-sm break-all text-center">{joinUrl}</p>
            </>
          )}
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

      <div className="flex flex-col gap-3 w-full max-w-xs">
        {isHost && players.length >= 1 && (
          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600
              rounded-full text-white font-black text-lg shadow-lg
              hover:scale-105 transition-transform active:scale-95"
          >
            Iniciar Juego
          </button>
        )}

        <button
          onClick={leaveRoom}
          className="px-6 py-3 bg-white/10 border border-red-400/40
            rounded-full text-red-300 font-bold text-sm
            hover:bg-red-500/20 transition-colors"
        >
          Salir de la sala
        </button>
      </div>

      {!isHost && (
        <p className="text-purple-300 animate-pulse">
          Esperando que el host inicie el juego...
        </p>
      )}
    </div>
  );
}

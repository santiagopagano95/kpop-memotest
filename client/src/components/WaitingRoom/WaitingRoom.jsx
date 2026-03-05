import { QRCodeSVG } from 'qrcode.react';
import { useGame } from '../../context/GameContext';

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
            <QRCodeSVG value={joinUrl} size={160} />
          </div>
          <p className="text-purple-300 text-sm break-all text-center">{joinUrl}</p>
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

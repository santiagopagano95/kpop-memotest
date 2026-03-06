import { useState } from 'react';
import { useGame } from '../context/GameContext';
import Board from '../components/Board/Board';
import Scoreboard from '../components/Scoreboard/Scoreboard';

export default function HostView() {
  const { gameState, timeLeft, endGame, leaveRoom } = useGame();
  const [showConfirm, setShowConfirm] = useState(false);
  
  if (!gameState) return null;

  const { cards, players, currentPlayerIndex } = gameState;
  const currentPlayer = players[currentPlayerIndex];

  const handleEndGame = () => {
    if (showConfirm) {
      endGame();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col p-4 gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <img 
          src="/images/resources/Logo memotest.png?v=2" 
          alt="K-Pop Memotest"
          className="h-16 w-auto object-contain"
        />
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-purple-300 text-xs">Turno de:</p>
            <p className="text-pink-400 font-black text-lg">{currentPlayer?.name || '—'}</p>
          </div>
          <button
            onClick={handleEndGame}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors
              ${showConfirm 
                ? 'bg-red-600 text-white' 
                : 'bg-white/10 text-red-300 border border-red-400/40 hover:bg-red-500/20'}`}
          >
            {showConfirm ? 'Confirmar' : 'Terminar'}
          </button>
        </div>
      </div>

      {/* Main: board + sidebar */}
      <div className="flex gap-4 flex-1 items-start">
        <div className="flex-1 flex justify-center items-center min-h-0">
          <div className="w-full max-w-5xl">
            <Board cards={cards} onFlip={() => {}} canInteract={false} />
          </div>
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

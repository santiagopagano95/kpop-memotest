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

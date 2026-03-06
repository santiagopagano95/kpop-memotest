import { motion, AnimatePresence } from 'framer-motion';
import { useGame } from '../context/GameContext';
import Board from '../components/Board/Board';

export default function PlayerView() {
  const { gameState, myPlayer, isMyTurn, flipCard, timeLeft } = useGame();
  if (!gameState) return null;

  const { cards, players, currentPlayerIndex } = gameState;
  const currentPlayer = players[currentPlayerIndex];
  const myTurn = isMyTurn();
  const myScore = players.find(p => p.id === myPlayer?.id)?.score ?? 0;
  const rankIndex = [...players].sort((a, b) => b.score - a.score)
    .findIndex(p => p.id === myPlayer?.id);
  const myRank = rankIndex === -1 ? '?' : rankIndex + 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col p-3 gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img 
            src="/images/resources/Logo memotest.png?v=2" 
            alt="K-Pop Memotest"
            className="h-12 w-auto object-contain"
          />
          <p className="text-white font-bold text-sm">{myPlayer?.name}</p>
        </div>
        <div className="text-right">
          <p className="text-pink-400 font-black">{myScore} pts</p>
          <p className="text-purple-300 text-xs">#{myRank}</p>
        </div>
      </div>

      {/* Turn banner */}
      <AnimatePresence mode="wait">
        {myTurn ? (
          <motion.div
            key="your-turn"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2 bg-gradient-to-r from-pink-500/30 to-purple-500/30
              rounded-xl border border-pink-400/50"
          >
            <p className="text-pink-400 font-black text-lg">⚡ ES TU TURNO ⚡</p>
          </motion.div>
        ) : (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-2 bg-white/5 rounded-xl border border-purple-500/20"
          >
            <p className="text-purple-300 text-sm">
              Turno de: <span className="text-pink-300 font-bold">{currentPlayer?.name}</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer bar */}
      <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000
            ${timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-500'}`}
          style={{ width: `${(timeLeft / 30) * 100}%` }}
        />
      </div>

      {/* Board */}
      <div className="flex-1 flex justify-center items-start">
        <Board
          cards={cards}
          onFlip={flipCard}
          canInteract={myTurn}
        />
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';

export default function Victory() {
  const { gameState, resetState, restartGame, isHost } = useGame();
  const players = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);
  const topScore = players[0]?.score ?? 0;
  const winners = players.filter(p => p.score === topScore);
  const isTie = winners.length > 1;

  useEffect(() => {
    const end = Date.now() + 4000;
    const colors = ['#ff6ad5', '#c774e8', '#ad8cff', '#8795e8', '#94d0ff'];
    let rafId;
    function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) rafId = requestAnimationFrame(frame);
    }
    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Build the headline text
  let headline;
  if (players.length === 0) {
    headline = 'Juego terminado!';
  } else if (isTie) {
    const names = winners.map(w => w.name).join(' y ');
    headline = `Empate! ${names}`;
  } else {
    headline = `${winners[0].name} gano!`;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col items-center justify-center p-6 gap-6">

      <img 
        src="/images/resources/Logo memotest.png?v=2" 
        alt="K-Pop Memotest"
        className="w-56 h-auto object-contain opacity-80"
      />

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-8xl"
      >
        {isTie ? '🤝' : '👑'}
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-black text-center text-transparent bg-clip-text
          bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400"
      >
        {headline}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/5 rounded-2xl p-6 w-full max-w-sm border border-purple-500/30"
      >
        <h2 className="text-white font-bold mb-4 text-center">Ranking Final</h2>
        <ul className="space-y-3">
          {players.map((p, i) => {
            const isWinner = p.score === topScore;
            return (
              <li key={p.id}
                className={`flex items-center gap-3 rounded-xl px-4 py-3
                  ${isWinner ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5'}`}>
                <span className="text-xl">
                  {isTie && isWinner ? '🤝' : ['👑','🥈','🥉'][i] || `${i+1}.`}
                </span>
                <span className="flex-1 text-white font-semibold">{p.name}</span>
                <span className="text-pink-300 font-bold">{p.score} pts</span>
              </li>
            );
          })}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="flex flex-col gap-3 w-full max-w-xs"
      >
        {isHost && (
          <button
            onClick={restartGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-purple-600
              rounded-full text-white font-black text-lg shadow-lg
              hover:scale-105 transition-transform active:scale-95"
          >
            Jugar de nuevo
          </button>
        )}

        <button
          onClick={resetState}
          className="px-8 py-4 bg-gradient-to-r from-pink-500 to-purple-600
            rounded-full text-white font-black text-lg shadow-lg
            hover:scale-105 transition-transform active:scale-95"
        >
          Volver al inicio
        </button>
      </motion.div>

      {!isHost && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-purple-300 text-sm"
        >
          El host puede reiniciar la partida
        </motion.p>
      )}
    </div>
  );
}

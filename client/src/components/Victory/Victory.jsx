import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useGame } from '../../context/GameContext';

export default function Victory() {
  const { gameState } = useGame();
  const players = [...(gameState?.players || [])].sort((a, b) => b.score - a.score);
  const winner = players[0];

  useEffect(() => {
    // Fire confetti for 4 seconds
    const end = Date.now() + 4000;
    const colors = ['#ff6ad5', '#c774e8', '#ad8cff', '#8795e8', '#94d0ff'];
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors });
      if (Date.now() < end) requestAnimationFrame(frame);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0d0d1a] via-[#1a0533] to-[#0d0d1a]
      flex flex-col items-center justify-center p-6 gap-8">

      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', duration: 0.8 }}
        className="text-8xl"
      >
        👑
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-3xl font-black text-center text-transparent bg-clip-text
          bg-gradient-to-r from-yellow-300 via-pink-400 to-purple-400"
      >
        {winner ? `¡${winner.name} ganó!` : '¡Juego terminado!'}
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="bg-white/5 rounded-2xl p-6 w-full max-w-sm border border-purple-500/30"
      >
        <h2 className="text-white font-bold mb-4 text-center">Ranking Final</h2>
        <ul className="space-y-3">
          {players.map((p, i) => (
            <li key={p.id}
              className={`flex items-center gap-3 rounded-xl px-4 py-3
                ${i === 0 ? 'bg-yellow-400/20 border border-yellow-400/50' : 'bg-white/5'}`}>
              <span className="text-xl">{['👑','🥈','🥉'][i] || `${i+1}.`}</span>
              <span className="flex-1 text-white font-semibold">{p.name}</span>
              <span className="text-pink-300 font-bold">{p.score} pts</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

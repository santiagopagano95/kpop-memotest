export default function Scoreboard({ players, currentPlayerIndex, timeLeft }) {
  const sorted = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-purple-500/30 w-full">
      <h2 className="text-purple-300 font-bold text-sm uppercase tracking-wider mb-3">
        Puntajes
      </h2>

      <div className="space-y-2">
        {sorted.map((player, i) => {
          const isCurrent = players[currentPlayerIndex]?.id === player.id;
          return (
            <div
              key={player.id}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-all
                ${isCurrent ? 'bg-pink-500/20 border border-pink-400/50' : 'bg-white/5'}`}
            >
              <span className="text-yellow-400 text-sm w-5">
                {i === 0 ? '👑' : `${i + 1}.`}
              </span>
              <span className={`flex-1 text-sm font-semibold truncate
                ${player.connected ? 'text-white' : 'text-gray-500'}`}>
                {player.name}
              </span>
              <span className="text-pink-300 font-bold text-sm">{player.score}</span>
            </div>
          );
        })}
      </div>

      {/* Turn timer */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-purple-300 mb-1">
          <span>Turno</span>
          <span>{timeLeft}s</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000
              ${timeLeft > 10 ? 'bg-green-400' : timeLeft > 5 ? 'bg-yellow-400' : 'bg-red-500'}`}
            style={{ width: `${(timeLeft / 30) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

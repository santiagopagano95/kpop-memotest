import { motion } from 'framer-motion';
import './Card.css';

export default function Card({ card, onClick, disabled }) {
  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !card.isFlipped && !card.isMatched) {
      onClick(card.id);
    }
  };

  return (
    <div
      className="card-container aspect-square"
      onClick={handleClick}
      onTouchStart={handleClick}
      style={{ 
        cursor: disabled || card.isFlipped || card.isMatched ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className={`card-inner ${card.isFlipped || card.isMatched ? 'flipped' : ''}`}>
        {/* Back */}
        <div className="card-face card-back">
          <div className="card-back-shimmer" />
          <span className="text-purple-300 text-2xl select-none">✦</span>
        </div>

        {/* Front */}
        <div className={`card-face card-front ${card.isMatched ? 'card-matched' : ''}`}>
          <img
            src={`/images/idols/${card.image}`}
            alt="Idol"
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = '/images/idols/placeholder.jpg'; }}
            draggable="false"
          />
          {/* Nombre solo visible cuando hay match */}
          {card.isMatched && (
            <>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                <p className="text-white text-xs font-bold text-center leading-tight truncate">
                  {card.idolName}
                </p>
                <p className="text-purple-300 text-xs text-center truncate">
                  {card.idolGroup}
                </p>
              </div>
              <motion.div
                className="absolute inset-0 bg-yellow-400/20 flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <span className="text-yellow-400 text-3xl">★</span>
              </motion.div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useGame } from '../../context/GameContext';
import './Card.css';

export default function Card({ card, onClick, disabled }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [shaking, setShaking] = useState(false);
  const { noMatchTrigger } = useGame();
  const wasFlipped = useRef(false);

  // Shake this card if it was flipped when a no-match event fires
  useEffect(() => {
    if (noMatchTrigger > 0 && wasFlipped.current) {
      setShaking(true);
      const t = setTimeout(() => setShaking(false), 450);
      return () => clearTimeout(t);
    }
  }, [noMatchTrigger]);

  // Track whether this card was flipped (so we shake the right ones)
  useEffect(() => {
    wasFlipped.current = card.isFlipped && !card.isMatched;
  }, [card.isFlipped, card.isMatched]);

  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isProcessing || disabled || card.isFlipped || card.isMatched) return;

    setIsProcessing(true);
    onClick(card.id);
    setTimeout(() => setIsProcessing(false), 300);
  }, [isProcessing, disabled, card.isFlipped, card.isMatched, card.id, onClick]);

  return (
    <div
      className={`card-container aspect-square ${shaking ? 'card-shake' : ''}`}
      onClick={handleClick}
      style={{
        cursor: disabled || card.isFlipped || card.isMatched ? 'default' : 'pointer',
        touchAction: 'manipulation',
        WebkitTapHighlightColor: 'transparent',
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

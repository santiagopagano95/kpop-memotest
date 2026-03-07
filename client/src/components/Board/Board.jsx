import Card from '../Card/Card';
import { useGame } from '../../context/GameContext';

export default function Board({ cards, onFlip, canInteract }) {
  const { boardCols } = useGame();

  const gridClass = boardCols === 6
    ? 'grid-cols-6'
    : boardCols === 5
    ? 'grid-cols-5'
    : 'grid-cols-4';

  const maxWidthClass = boardCols === 6
    ? 'max-w-6xl'
    : boardCols === 5
    ? 'max-w-5xl'
    : 'max-w-4xl';

  return (
    <div className={`grid ${gridClass} gap-1.5 sm:gap-2 w-full ${maxWidthClass} px-2 sm:px-4`}>
      {cards.map(card => (
        <Card
          key={card.id}
          card={card}
          onClick={onFlip}
          disabled={!canInteract}
        />
      ))}
    </div>
  );
}

import Card from '../Card/Card';

export default function Board({ cards, onFlip, canInteract }) {
  return (
    <div className="grid grid-cols-6 gap-1.5 sm:gap-2 w-full max-w-4xl px-2 sm:px-4">
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

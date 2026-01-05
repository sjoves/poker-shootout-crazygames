import React, { useCallback, useRef, memo } from 'react';
import { Card } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudio } from '@/contexts/AudioContext';

interface StaticGridProps {
  deck: Card[];
  selectedCardIds: string[];
  onSelectCard: (card: Card) => void;
}

// Show at most 25 cards in a 5x5 grid
const MAX_VISIBLE_CARDS = 25;
const GRID_COLUMNS = 5;
const BUSY_MS = 50; // Minimal gate for rapid clicking

// Memoized card slot - only re-renders when its specific card changes
interface CardSlotProps {
  card: Card;
  isSelected: boolean;
  cardSize: 'sdm' | 'sd';
  onPointerDown: (card: Card, e: React.PointerEvent) => void;
}

const CardSlot = memo(
  function CardSlot({ card, isSelected, cardSize, onPointerDown }: CardSlotProps) {
    return (
      <div
        onPointerDown={(e) => onPointerDown(card, e)}
        style={{
          cursor: isSelected ? 'not-allowed' : 'pointer',
          touchAction: 'none',
        }}
        className="select-none"
      >
        <PlayingCard
          card={card}
          isSelected={isSelected}
          isDisabled={isSelected}
          size={cardSize}
          animate={false}
          className="pointer-events-none"
        />
      </div>
    );
  },
  // Custom comparison: only re-render if card.id or isSelected changes
  (prev, next) =>
    prev.card.id === next.card.id &&
    prev.isSelected === next.isSelected &&
    prev.cardSize === next.cardSize
);

export function StaticGrid({ deck, selectedCardIds, onSelectCard }: StaticGridProps) {
  const visibleCards = deck.slice(0, MAX_VISIBLE_CARDS);
  const isMobile = useIsMobile();
  const { playSound } = useAudio();

  const busyUntilRef = useRef<number>(0);
  const cardSize = isMobile ? 'sdm' : 'sd';

  const handleCardPointerDown = useCallback(
    (card: Card, e: React.PointerEvent) => {
      if (selectedCardIds.length >= 5) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      const now = performance.now();
      if (now < busyUntilRef.current) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      if (selectedCardIds.includes(card.id)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      busyUntilRef.current = now + BUSY_MS;

      e.stopPropagation();
      (e.nativeEvent as any)?.stopImmediatePropagation?.();

      playSound('cardSelect');
      onSelectCard(card);
      e.preventDefault();
    },
    [onSelectCard, playSound, selectedCardIds]
  );

  return (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{ paddingTop: '5rem', paddingBottom: '9rem' }}
    >
      <div
        className="grid p-2 sm:p-4"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, minmax(0, 1fr))`,
          gap: isMobile ? '0.37rem' : '0.67rem',
        }}
      >
        {visibleCards.map((card, index) => (
          <CardSlot
            key={`slot-${index}`}
            card={card}
            isSelected={selectedCardIds.includes(card.id)}
            cardSize={cardSize}
            onPointerDown={handleCardPointerDown}
          />
        ))}
      </div>
    </div>
  );
}

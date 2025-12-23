import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/types/game';
import { PlayingCard, EmptyCardSlot } from './PlayingCard';
import { cn } from '@/lib/utils';

interface HandDisplayProps {
  cards: Card[];
  maxCards?: number;
  className?: string;
}

export function HandDisplay({ cards, maxCards = 5, className }: HandDisplayProps) {
  const slots = Array(maxCards).fill(null);

  return (
    <div className={cn('flex flex-col items-center gap-3', className)}>
      <div className="flex gap-2 justify-center">
        <AnimatePresence mode="popLayout">
          {slots.map((_, index) => {
            const card = cards[index];
            return (
              <motion.div
                key={card?.id || `slot-${index}`}
                layout
                initial={{ scale: 0.5, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {card ? (
                  <PlayingCard card={card} size="lg" isDisabled animate={false} />
                ) : (
                  <EmptyCardSlot size="lg" />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
      
      <div className="text-center">
        <span className="text-lg font-medium text-foreground">
          {cards.length}/{maxCards} Cards
        </span>
      </div>
    </div>
  );
}

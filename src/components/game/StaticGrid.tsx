import { motion } from 'framer-motion';
import { Card } from '@/types/game';
import { PlayingCard } from './PlayingCard';

interface StaticGridProps {
  deck: Card[];
  selectedCardIds: string[];
  onSelectCard: (card: Card) => void;
}

export function StaticGrid({ deck, selectedCardIds, onSelectCard }: StaticGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-9 gap-1 p-2 max-w-full overflow-auto"
    >
      {deck.map((card, index) => (
        <motion.div
          key={card.id}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.01 }}
        >
          <PlayingCard
            card={card}
            onClick={() => onSelectCard(card)}
            isSelected={selectedCardIds.includes(card.id)}
            size="sm"
            animate={false}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}

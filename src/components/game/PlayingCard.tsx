import { motion } from 'framer-motion';
import { Card, Suit } from '@/types/game';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  card: Card;
  onClick?: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  animate?: boolean;
  className?: string;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<Suit, string> = {
  hearts: 'text-suit-hearts',
  diamonds: 'text-suit-diamonds',
  clubs: 'text-suit-clubs',
  spades: 'text-suit-spades',
};

const SIZE_CLASSES = {
  sm: 'w-12 h-16 text-sm',
  md: 'w-16 h-22 text-base',
  lg: 'w-20 h-28 text-lg',
};

export function PlayingCard({
  card,
  onClick,
  isSelected,
  isDisabled,
  size = 'md',
  animate = true,
  className,
}: PlayingCardProps) {
  const suitColor = SUIT_COLORS[card.suit];
  const suitSymbol = SUIT_SYMBOLS[card.suit];

  return (
    <motion.button
      onClick={onClick}
      disabled={isDisabled || isSelected}
      whileHover={!isDisabled && !isSelected ? { scale: 1.05, y: -5 } : {}}
      whileTap={!isDisabled && !isSelected ? { scale: 0.95 } : {}}
      initial={animate ? { scale: 0.8, opacity: 0 } : false}
      animate={{ scale: 1, opacity: 1 }}
      className={cn(
        SIZE_CLASSES[size],
        'relative rounded-lg bg-foreground shadow-lg cursor-pointer select-none',
        'flex flex-col items-center justify-center',
        'border-2 border-border/20',
        'transition-all duration-200',
        isSelected && 'ring-2 ring-primary opacity-50 cursor-not-allowed',
        isDisabled && 'opacity-50 cursor-not-allowed',
        !isDisabled && !isSelected && 'hover:shadow-xl active:shadow-md',
        className
      )}
    >
      {/* Top-left corner */}
      <div className={cn('absolute top-1 left-1 flex flex-col items-center leading-none', suitColor)}>
        <span className="font-bold">{card.rank}</span>
        <span className="text-xs">{suitSymbol}</span>
      </div>

      {/* Center symbol */}
      <span className={cn('text-2xl', suitColor)}>{suitSymbol}</span>

      {/* Bottom-right corner (inverted) */}
      <div className={cn('absolute bottom-1 right-1 flex flex-col items-center leading-none rotate-180', suitColor)}>
        <span className="font-bold">{card.rank}</span>
        <span className="text-xs">{suitSymbol}</span>
      </div>
    </motion.button>
  );
}

export function EmptyCardSlot({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return (
    <div
      className={cn(
        SIZE_CLASSES[size],
        'rounded-lg border-2 border-dashed border-muted-foreground/30',
        'flex items-center justify-center',
        'bg-muted/20'
      )}
    >
      <span className="text-muted-foreground text-2xl">?</span>
    </div>
  );
}

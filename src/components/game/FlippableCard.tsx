import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, Suit } from '@/types/game';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import { useAudio } from '@/contexts/AudioContext';

interface FlippableCardProps {
  card: Card;
  isKept: boolean;
  isFlippedExternal?: boolean;
  onFlip?: (cardId: string) => void;
  onKeep: (card: Card) => void;
  onUnkeep: (card: Card) => void;
  disabled?: boolean;
}

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const isRedSuit = (suit: Suit) => suit === 'hearts' || suit === 'diamonds';

// Time in ms before card flips back if not kept
const AUTO_UNFLIP_DELAY = 2500;

export function FlippableCard({ card, isKept, isFlippedExternal, onFlip, onKeep, onUnkeep, disabled }: FlippableCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const unflipTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { playSound } = useAudio();
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const colorClass = isRedSuit(card.suit) ? 'text-red-600' : 'text-gray-900';

  // Sync with external flipped state - flip back if another card is flipped
  useEffect(() => {
    if (isFlippedExternal === false && isFlipped && !isKept) {
      setIsFlipped(false);
    }
  }, [isFlippedExternal, isFlipped, isKept]);

  // Auto-unflip after delay if not kept
  useEffect(() => {
    if (isFlipped && !isKept) {
      unflipTimerRef.current = setTimeout(() => {
        setIsFlipped(false);
      }, AUTO_UNFLIP_DELAY);
    }

    return () => {
      if (unflipTimerRef.current) {
        clearTimeout(unflipTimerRef.current);
      }
    };
  }, [isFlipped, isKept]);

  const handleCardClick = () => {
    if (disabled || isKept || isFlipped) return;
    setIsFlipped(true);
    playSound('cardFlip');
    onFlip?.(card.id);
  };

  const handleKeepToggle = () => {
    // Clear the auto-unflip timer when keeping
    if (unflipTimerRef.current) {
      clearTimeout(unflipTimerRef.current);
    }
    
    if (isKept) {
      onUnkeep(card);
      setIsFlipped(false);
    } else {
      playSound('cardSelect');
      onKeep(card);
    }
  };

  return (
    <div className="relative perspective-1000">
      <motion.div
        className={cn(
          'w-[50px] h-[71px] cursor-pointer relative',
          'transform-style-preserve-3d transition-transform duration-300',
          disabled && !isKept && 'opacity-50 cursor-not-allowed'
        )}
        animate={{ rotateY: isFlipped || isKept ? 180 : 0 }}
        transition={{ duration: 0.2 }}
      >
        {/* Card Back - Black and white diamond pattern */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg backface-hidden overflow-hidden',
            'border-2 border-gray-300',
            'shadow-lg bg-white'
          )}
          onClick={handleCardClick}
        >
          {/* Outer border */}
          <div className="absolute inset-1 border border-gray-800 rounded">
            {/* Inner pattern container */}
            <div className="absolute inset-1 bg-gray-900 rounded-sm overflow-hidden">
              {/* Diamond pattern using CSS */}
              <div 
                className="w-full h-full"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, white 25%, transparent 25%),
                    linear-gradient(-45deg, white 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, white 75%),
                    linear-gradient(-45deg, transparent 75%, white 75%)
                  `,
                  backgroundSize: '8px 8px',
                  backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                }}
              />
            </div>
          </div>
          {/* Center diamond accent */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-6 h-6 bg-white border-2 border-gray-800 rotate-45" />
          </div>
        </div>

        {/* Card Front */}
        <div
          className={cn(
            'absolute inset-0 rounded-lg backface-hidden rotate-y-180',
            'bg-white border border-gray-200',
            'flex flex-col items-center justify-center',
            'shadow-lg',
            colorClass,
            isKept && 'ring-2 ring-green-500'
          )}
        >
          {/* Top-left corner */}
          <div className="absolute top-0.5 left-1 flex flex-col items-center leading-none">
            <span className="font-bold text-sm">{card.rank}</span>
            <span className="text-[10px]">{suitSymbol}</span>
          </div>

          {/* Center */}
          <span className="text-lg font-normal">{suitSymbol}</span>

          {/* Bottom-right corner */}
          <div className="absolute bottom-0.5 right-1 flex flex-col items-center leading-none rotate-180">
            <span className="font-bold text-sm">{card.rank}</span>
            <span className="text-[10px]">{suitSymbol}</span>
          </div>

          {/* Keep Button */}
          <AnimatePresence>
            {(isFlipped || isKept) && (
              <motion.button
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleKeepToggle();
                }}
                className={cn(
                  'absolute -bottom-2 -right-2 w-6 h-6 rounded-full',
                  'flex items-center justify-center',
                  'border-2 transition-all duration-200',
                  'shadow-md z-10',
                  isKept
                    ? 'bg-green-500 border-green-600 text-white'
                    : 'bg-white border-gray-300 hover:border-green-500'
                )}
              >
                {isKept && <Check className="w-4 h-4" />}
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

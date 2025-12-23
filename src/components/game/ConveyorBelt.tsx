import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, ConveyorCard } from '@/types/game';
import { PlayingCard } from './PlayingCard';

interface ConveyorBeltProps {
  deck: Card[];
  selectedCardIds: string[];
  onSelectCard: (card: Card) => void;
  speed?: number;
  isPaused?: boolean;
  rows?: number;
}

export function ConveyorBelt({
  deck,
  selectedCardIds,
  onSelectCard,
  speed = 1,
  isPaused = false,
  rows = 4,
}: ConveyorBeltProps) {
  const [conveyorCards, setConveyorCards] = useState<ConveyorCard[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const initializedRef = useRef(false);

  // Initialize cards on tracks
  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    initializedRef.current = true;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = 64;
    const cardsPerRow = Math.floor(containerWidth / (cardWidth + 20));
    
    const cards: ConveyorCard[] = [];
    let deckIndex = 0;
    
    for (let row = 0; row < rows; row++) {
      for (let i = 0; i < cardsPerRow; i++) {
        if (deckIndex >= deck.length) deckIndex = 0;
        const card = deck[deckIndex];
        if (!card) continue;
        
        const isLeftToRight = row % 2 === 0;
        const x = isLeftToRight 
          ? i * (cardWidth + 20)
          : containerWidth - (i + 1) * (cardWidth + 20);
        
        cards.push({
          ...card,
          id: `${card.id}-row${row}-pos${i}`,
          x,
          y: 0,
          row,
          speed: speed * (isLeftToRight ? 1 : -1) * 0.5,
        });
        
        deckIndex++;
      }
    }
    
    setConveyorCards(cards);
  }, [deck, rows, speed]);

  // Animation loop
  useEffect(() => {
    if (isPaused || !containerRef.current) return;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = 64;
    
    const animate = () => {
      setConveyorCards(prev => {
        return prev.map(card => {
          let newX = card.x + card.speed;
          
          // Wrap around
          if (card.speed > 0 && newX > containerWidth) {
            newX = -cardWidth;
          } else if (card.speed < 0 && newX < -cardWidth) {
            newX = containerWidth;
          }
          
          return { ...card, x: newX };
        }).filter(card => !selectedCardIds.includes(card.id.split('-row')[0]));
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, selectedCardIds, speed]);

  const handleCardClick = useCallback((card: ConveyorCard) => {
    const originalCard: Card = {
      id: card.id.split('-row')[0],
      suit: card.suit,
      rank: card.rank,
      value: card.value,
    };
    onSelectCard(originalCard);
  }, [onSelectCard]);

  const rowHeight = 120;
  const totalHeight = rows * rowHeight;

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center overflow-hidden"
    >
      <div 
        className="relative w-full"
        style={{ height: totalHeight }}
      >
      {/* Track backgrounds */}
      {Array(rows).fill(null).map((_, index) => (
        <div
          key={`track-${index}`}
          className="absolute left-0 right-0 h-20 bg-muted/30 border-y border-border/20"
          style={{ top: index * rowHeight }}
        >
          <div className="absolute inset-0 flex items-center opacity-20">
            {Array(20).fill(null).map((_, i) => (
              <div key={i} className="flex-1 border-r border-dashed border-muted-foreground/30" />
            ))}
          </div>
        </div>
      ))}
      
      {/* Cards */}
      <AnimatePresence>
        {conveyorCards.map(card => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
            style={{
              position: 'absolute',
              left: card.x,
              top: card.row * rowHeight + 10,
            }}
          >
            <PlayingCard
              card={card}
              onClick={() => handleCardClick(card)}
              size="md"
              animate={false}
              isSelected={selectedCardIds.includes(card.id.split('-row')[0])}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      </div>
    </div>
  );
}

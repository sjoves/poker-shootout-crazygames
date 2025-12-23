import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, FallingCard } from '@/types/game';
import { PlayingCard } from './PlayingCard';

interface FallingCardsProps {
  deck: Card[];
  selectedCardIds: string[];
  onSelectCard: (card: Card) => void;
  speed?: number;
  isPaused?: boolean;
  isRecycling?: boolean;
}

export function FallingCards({
  deck,
  selectedCardIds,
  onSelectCard,
  speed = 1,
  isPaused = false,
  isRecycling = false,
}: FallingCardsProps) {
  const [fallingCards, setFallingCards] = useState<FallingCard[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const lastSpawnRef = useRef(0);
  const deckIndexRef = useRef(0);

  // Spawn new cards
  const spawnCard = useCallback(() => {
    if (!containerRef.current) return;
    
    const availableCards = deck.filter(c => !selectedCardIds.includes(c.id));
    if (availableCards.length === 0) return;
    
    const cardIndex = isRecycling 
      ? Math.floor(Math.random() * availableCards.length)
      : deckIndexRef.current % availableCards.length;
    
    const card = availableCards[cardIndex];
    if (!card) return;
    
    deckIndexRef.current++;
    
    const containerWidth = containerRef.current.offsetWidth;
    const cardWidth = 64;
    
    const fallingCard: FallingCard = {
      ...card,
      x: Math.random() * (containerWidth - cardWidth),
      y: -100,
      speed: (0.5 + Math.random() * 0.5) * speed * 2,
      rotation: (Math.random() - 0.5) * 30,
      rotationSpeed: (Math.random() - 0.5) * 2,
      sway: Math.random() * 20,
      swaySpeed: 2 + Math.random() * 2,
    };
    
    setFallingCards(prev => [...prev, fallingCard]);
  }, [deck, selectedCardIds, speed, isRecycling]);

  // Animation loop
  useEffect(() => {
    if (isPaused) return;
    
    const containerHeight = containerRef.current?.offsetHeight || 600;
    
    const animate = (timestamp: number) => {
      // Spawn new cards periodically
      if (timestamp - lastSpawnRef.current > 800 / speed) {
        spawnCard();
        lastSpawnRef.current = timestamp;
      }
      
      setFallingCards(prev => {
        return prev
          .map(card => ({
            ...card,
            y: card.y + card.speed,
            rotation: card.rotation + card.rotationSpeed,
            x: card.x + Math.sin(timestamp / 1000 * card.swaySpeed) * 0.5,
          }))
          .filter(card => {
            if (card.y > containerHeight + 50) {
              return isRecycling; // Keep for recycling, remove otherwise
            }
            return !selectedCardIds.includes(card.id);
          });
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPaused, speed, spawnCard, selectedCardIds, isRecycling]);

  const handleCardClick = useCallback((card: FallingCard) => {
    setFallingCards(prev => prev.filter(c => c.id !== card.id));
    onSelectCard(card);
  }, [onSelectCard]);

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
    >
      <AnimatePresence>
        {fallingCards.map(card => (
          <motion.div
            key={`${card.id}-${card.y}`}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            style={{
              position: 'absolute',
              left: card.x,
              top: card.y,
              transform: `rotate(${card.rotation}deg)`,
            }}
            className="cursor-pointer"
          >
            <PlayingCard
              card={card}
              onClick={() => handleCardClick(card)}
              size="md"
              animate={false}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

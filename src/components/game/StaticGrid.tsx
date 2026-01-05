import React, { useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAudio } from '@/contexts/AudioContext';

interface StaticGridProps {
  deck: Card[];
  selectedCardIds: string[];
  onSelectCard: (card: Card) => void;
}

// Show at most 50% of the deck (26 cards), arranged in 5 columns x 5 rows = 25 cards max
const MAX_VISIBLE_CARDS = 25;
const GRID_COLUMNS = 5;
const BUSY_MS = 300;

export function StaticGrid({ deck, selectedCardIds, onSelectCard }: StaticGridProps) {
  // Only show up to MAX_VISIBLE_CARDS
  const visibleCards = deck.slice(0, MAX_VISIBLE_CARDS);
  const isMobile = useIsMobile();
  const { playSound } = useAudio();

  // Busy flag to prevent multi-touch / ghost taps
  const busyUntilRef = useRef<number>(0);
  // Track which cards have been tapped this session (for instant hide)
  const tappedCardsRef = useRef<Set<string>>(new Set());

  // Sitting Duck: larger cards on both mobile + desktop
  const cardSize = isMobile ? 'sdm' : 'sd';

  const handleCardPointerDown = useCallback((card: Card, e: React.PointerEvent) => {
    // Prevent ghost taps: block if busy
    const now = performance.now();
    if (now < busyUntilRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Already selected? Ignore
    if (selectedCardIds.includes(card.id) || tappedCardsRef.current.has(card.id)) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }

    // Set busy flag immediately
    busyUntilRef.current = now + BUSY_MS;
    tappedCardsRef.current.add(card.id);

    // Stop all event propagation first
    e.preventDefault();
    e.stopPropagation();
    (e.nativeEvent as any)?.stopImmediatePropagation?.();

    // Instant visual removal (opacity: 0 for hardware-accelerated hide)
    const el = e.currentTarget as HTMLElement;
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';

    // Pointer capture to prevent multi-target / ghost interactions
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    playSound('cardSelect');
    onSelectCard(card);

    // Final preventDefault to stop any click event from firing
    e.preventDefault();
  }, [selectedCardIds, onSelectCard, playSound]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
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
        {visibleCards.map((card, index) => {
          const isSelected = selectedCardIds.includes(card.id) || tappedCardsRef.current.has(card.id);
          return (
            <motion.div
              key={card.id}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01, duration: 0.1 }}
              onPointerDown={(e) => handleCardPointerDown(card, e)}
              style={{
                willChange: 'transform, opacity',
                cursor: isSelected ? 'not-allowed' : 'pointer',
                touchAction: 'none',
              }}
            >
              <PlayingCard
                card={card}
                isSelected={isSelected}
                isDisabled={isSelected}
                size={cardSize}
                animate={false}
                className="pointer-events-none"
              />
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

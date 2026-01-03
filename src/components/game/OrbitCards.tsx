import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/types/game';
import { PlayingCard } from './PlayingCard';
import useSound from 'use-sound';

interface OrbitCard extends Card {
  ring: number;
  baseAngle: number; // Initial angle offset for this card's slot
  speed: number;
  isNew?: boolean;
  entryTime?: number; // Time when card entered orbit (for fly-in animation tracking)
}

interface OrbitCardsProps {
  deck: Card[];
  selectedCardIds: string[];
  onSelectCard: (card: Card) => void;
  level: number;
  isPaused?: boolean;
  reshuffleTrigger?: number;
  breathingEnabled?: boolean;
  breathingAmplitude?: number;
  breathingSpeed?: number;
  showRingGuides?: boolean;
}

// Wrapper component for smooth fly-in transitions
const OrbitCardWrapper = ({ 
  x, 
  y, 
  isNew, 
  children, 
  cardId,
  onClick 
}: { 
  x: number; 
  y: number; 
  isNew: boolean; 
  children: React.ReactNode; 
  cardId: string;
  onClick: () => void;
}) => {
  return (
    <motion.div
      key={cardId}
      initial={isNew ? { x: 0, y: 0, scale: 0, opacity: 0 } : false}
      animate={{ 
        x, 
        y, 
        scale: 1, 
        opacity: 1 
      }}
      exit={{ opacity: 0, scale: 0, transition: { duration: 0.2 } }}
      transition={{ 
        type: 'spring', 
        stiffness: 70, 
        damping: 15,
        mass: 1
      }}
      className="absolute top-1/2 left-1/2 cursor-pointer z-20"
      style={{
        marginLeft: '-28px',
        marginTop: '-40px',
        willChange: 'transform',
      }}
      onClick={onClick}
      whileHover={{ scale: 1.1, zIndex: 30 }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.div>
  );
};

export function OrbitCards({
  deck,
  selectedCardIds,
  onSelectCard,
  level,
  isPaused = false,
  reshuffleTrigger = 0,
  breathingEnabled = true,
  breathingAmplitude = 30,
  breathingSpeed = 0.5,
  showRingGuides = true,
}: OrbitCardsProps) {
  const [orbitCards, setOrbitCards] = useState<OrbitCard[]>([]);
  const [hiddenDeck, setHiddenDeck] = useState<Card[]>([]);
  const [globalTime, setGlobalTime] = useState(0); // Global time for rotation + breathing
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const pendingReplenishRef = useRef(false); // Prevent infinite loop
  const [playCardHit] = useSound('/sounds/card-hit.wav', { volume: 0.3 });

  // Configuration - 5/8/12 card distribution per ring = 25 total
  const totalRings = 3;
  const cardsPerRing = useMemo(() => [5, 8, 12], []); // Inner to outer
  const ringMultipliers = useMemo(() => [1.0, 1.15, 1.3], []); // Speed multipliers per ring
  const safeZonePadding = 40;
  const totalOrbitCards = 25;

  // Calculate base ring radii based on container size
  const getBaseRingRadii = useCallback(() => {
    if (!containerRef.current) return [80, 140, 200];
    const rect = containerRef.current.getBoundingClientRect();
    const maxRadius = Math.min(rect.width, rect.height) / 2 - safeZonePadding;
    return [
      maxRadius * 0.35, // Inner ring
      maxRadius * 0.6,  // Middle ring
      maxRadius * 0.9,  // Outer ring
    ];
  }, []);

  // Calculate base speed with level scaling
  const baseSpeed = useMemo(() => {
    return 1.05 * (1 + (level > 10 ? (level - 10) * 0.005 : 0));
  }, [level]);

  // Initialize orbit cards with 25 in orbit, rest in hidden deck
  const initializeCards = useCallback(() => {
    const newOrbitCards: OrbitCard[] = [];
    const newHiddenDeck: Card[] = [];
    let deckIndex = 0;

    // Populate orbit rings
    for (let ring = 0; ring < totalRings; ring++) {
      const numCards = cardsPerRing[ring];
      const ringSpeed = baseSpeed * ringMultipliers[ring];
      
      for (let i = 0; i < numCards && deckIndex < deck.length; i++) {
        const card = deck[deckIndex++];
        // baseAngle is the card's fixed slot position in the ring
        const baseAngle = (i / numCards) * Math.PI * 2;
        newOrbitCards.push({
          ...card,
          ring,
          baseAngle,
          speed: ringSpeed,
          isNew: false,
          entryTime: 0,
        });
      }
    }

    // Rest goes to hidden deck (recycle queue)
    while (deckIndex < deck.length) {
      newHiddenDeck.push(deck[deckIndex++]);
    }

    setOrbitCards(newOrbitCards);
    setHiddenDeck(newHiddenDeck);
    setGlobalTime(0);
    lastTimeRef.current = 0;
  }, [deck, baseSpeed, cardsPerRing, ringMultipliers, totalRings]);

  // Reset on deck change or reshuffle
  useEffect(() => {
    initializeCards();
  }, [deck.length, reshuffleTrigger, initializeCards]);

  // Animation loop - updates global time for rotation and breathing
  useEffect(() => {
    if (isPaused) return;

    const animate = (timestamp: number) => {
      if (lastTimeRef.current === 0) {
        lastTimeRef.current = timestamp;
      }
      
      const deltaTime = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Update global time - this drives both rotation and breathing
      setGlobalTime(prev => prev + deltaTime);

      // Clear isNew flag after fly-in animation completes
      setOrbitCards(prev => 
        prev.map(card => ({
          ...card,
          isNew: card.isNew && card.entryTime !== undefined && (timestamp / 1000 - card.entryTime) < 0.6,
        }))
      );

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [isPaused]);

  // Reset time ref when paused
  useEffect(() => {
    if (isPaused) {
      lastTimeRef.current = 0;
    }
  }, [isPaused]);

  // Handle card selection with recycling
  const handleCardClick = useCallback((card: OrbitCard) => {
    playCardHit();
    onSelectCard(card);
    
    // Remove from orbit and add to back of hidden deck
    setOrbitCards(prev => prev.filter(c => c.id !== card.id));
    setHiddenDeck(prev => [...prev, card as Card]);
    pendingReplenishRef.current = true;
  }, [onSelectCard, playCardHit]);

  // Replenish orbit from hidden deck (debounced with ref to prevent infinite loop)
  useEffect(() => {
    if (!pendingReplenishRef.current) return;
    
    const missingCount = totalOrbitCards - orbitCards.length;
    
    if (missingCount > 0 && hiddenDeck.length > 0) {
      pendingReplenishRef.current = false;
      
      const cardsToAdd = hiddenDeck.slice(0, missingCount);
      const remainingHidden = hiddenDeck.slice(missingCount);
      
      if (cardsToAdd.length > 0) {
        // Find which ring needs cards
        const ringCounts = [0, 0, 0];
        orbitCards.forEach(c => ringCounts[c.ring]++);
        
        const newCards: OrbitCard[] = cardsToAdd.map((card) => {
          // Find first ring that needs cards
          let targetRing = 0;
          for (let r = 0; r < totalRings; r++) {
            if (ringCounts[r] < cardsPerRing[r]) {
              targetRing = r;
              ringCounts[r]++;
              break;
            }
          }
          
          // Calculate entry angle - find a gap in the ring
          const ringCards = orbitCards.filter(c => c.ring === targetRing);
          const numCardsInRing = cardsPerRing[targetRing];
          
          // Find the missing slot index
          const existingSlots = new Set(ringCards.map(c => {
            // Calculate which slot this card occupies based on its baseAngle
            return Math.round((c.baseAngle / (Math.PI * 2)) * numCardsInRing) % numCardsInRing;
          }));
          
          let entrySlot = 0;
          for (let i = 0; i < numCardsInRing; i++) {
            if (!existingSlots.has(i)) {
              entrySlot = i;
              break;
            }
          }
          
          const entryBaseAngle = (entrySlot / numCardsInRing) * Math.PI * 2;
          
          return {
            ...card,
            ring: targetRing,
            baseAngle: entryBaseAngle,
            speed: baseSpeed * ringMultipliers[targetRing],
            isNew: true,
            entryTime: globalTime,
          };
        });
        
        setOrbitCards(prev => [...prev, ...newCards]);
        setHiddenDeck(remainingHidden);
      }
    }
  }, [orbitCards.length, hiddenDeck.length, totalOrbitCards, baseSpeed, cardsPerRing, ringMultipliers, totalRings, globalTime, orbitCards, hiddenDeck]);

  // Calculate breathing radii based on global time
  const ringRadii = useMemo(() => {
    const baseRadii = getBaseRingRadii();
    if (!breathingEnabled) return baseRadii;
    
    // Formula: baseRadius + (Math.sin(time * breathingSpeed) * amplitude)
    return baseRadii.map((radius, index) => {
      const phaseOffset = index * 0.3;
      const breathOffset = Math.sin(globalTime * breathingSpeed + phaseOffset) * breathingAmplitude;
      return radius + breathOffset;
    });
  }, [getBaseRingRadii, breathingEnabled, globalTime, breathingSpeed, breathingAmplitude]);

  const baseRadii = useMemo(() => getBaseRingRadii(), [getBaseRingRadii]);

  // Calculate card position using angle + radius formula
  // angle = baseAngle + (time * speedMultiplier)
  // radius = baseRadius + (Math.sin(time * 0.5) * amplitude)
  // x = cos(angle) * radius; y = sin(angle) * radius
  const getCardPosition = useCallback((card: OrbitCard) => {
    const radius = ringRadii[card.ring] || ringRadii[0];
    // Rotation: angle = baseAngle + (globalTime * speed * 0.35)
    const angle = card.baseAngle + (globalTime * card.speed * 0.35);
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    return { x, y };
  }, [ringRadii, globalTime]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden touch-none flex items-center justify-center"
      style={{ perspective: '1000px' }}
    >
      {/* Center anchor container */}
      <div className="relative w-full h-full max-w-[100vmin] max-h-[100vmin] mx-auto">
        {/* Center point indicator */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-primary/30 z-10" />

        {/* Orbit rings visual guides */}
        {showRingGuides && ringRadii.map((radius, index) => (
          <motion.div
            key={index}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary/10 pointer-events-none"
            style={{
              width: radius * 2,
              height: radius * 2,
            }}
          />
        ))}

        {/* Ring info labels */}
        {showRingGuides && baseRadii.map((_, index) => (
          <div
            key={`label-${index}`}
            className="absolute top-1/2 left-1/2 text-[8px] text-primary/40 pointer-events-none z-5"
            style={{
              transform: `translate(-50%, -50%) translateY(${-ringRadii[index] - 8}px)`,
            }}
          >
            {[`Inner ${cardsPerRing[0]}×1.0`, `Mid ${cardsPerRing[1]}×1.15`, `Outer ${cardsPerRing[2]}×1.3`][index]}
          </div>
        ))}

        {/* Hidden deck counter */}
        {showRingGuides && (
          <div className="absolute bottom-2 left-2 text-[10px] text-primary/50 bg-background/50 px-2 py-1 rounded">
            Orbit: {orbitCards.length}/{totalOrbitCards} | Queue: {hiddenDeck.length}
          </div>
        )}

        {/* Orbiting cards with AnimatePresence for smooth transitions */}
        <AnimatePresence mode="popLayout">
          {orbitCards.map(card => {
            const pos = getCardPosition(card);
            const isSelected = selectedCardIds.includes(card.id);
            if (isSelected) return null;

            return (
              <OrbitCardWrapper
                key={card.id}
                cardId={card.id}
                x={pos.x}
                y={pos.y}
                isNew={card.isNew || false}
                onClick={() => handleCardClick(card)}
              >
                <PlayingCard
                  card={card}
                  size="sm"
                  className="shadow-lg hover:shadow-xl transition-shadow"
                />
              </OrbitCardWrapper>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
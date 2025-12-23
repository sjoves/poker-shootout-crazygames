import { Card, HandResult, POKER_HANDS, RANK_VALUES, Rank, Suit, SUITS, RANKS } from '@/types/game';

function getValueCounts(cards: Card[]): Map<number, Card[]> {
  const counts = new Map<number, Card[]>();
  cards.forEach(card => {
    const existing = counts.get(card.value) || [];
    counts.set(card.value, [...existing, card]);
  });
  return counts;
}

function getSuitCounts(cards: Card[]): Map<Suit, Card[]> {
  const counts = new Map<Suit, Card[]>();
  cards.forEach(card => {
    const existing = counts.get(card.suit) || [];
    counts.set(card.suit, [...existing, card]);
  });
  return counts;
}

function isFlush(cards: Card[]): boolean {
  const suits = getSuitCounts(cards);
  return Array.from(suits.values()).some(group => group.length >= 5);
}

function isStraight(cards: Card[]): boolean {
  const values = [...new Set(cards.map(c => c.value))].sort((a, b) => a - b);
  
  // Check for regular straight
  for (let i = 0; i <= values.length - 5; i++) {
    let consecutive = true;
    for (let j = 0; j < 4; j++) {
      if (values[i + j + 1] - values[i + j] !== 1) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) return true;
  }
  
  // Check for Ace-low straight (A-2-3-4-5)
  if (values.includes(14) && values.includes(2) && values.includes(3) && values.includes(4) && values.includes(5)) {
    return true;
  }
  
  return false;
}

function isRoyalFlush(cards: Card[]): boolean {
  const suits = getSuitCounts(cards);
  for (const [, suitCards] of suits) {
    if (suitCards.length >= 5) {
      const values = suitCards.map(c => c.value).sort((a, b) => a - b);
      if (values.includes(10) && values.includes(11) && values.includes(12) && values.includes(13) && values.includes(14)) {
        return true;
      }
    }
  }
  return false;
}

function isStraightFlush(cards: Card[]): boolean {
  const suits = getSuitCounts(cards);
  for (const [, suitCards] of suits) {
    if (suitCards.length >= 5 && isStraight(suitCards)) {
      return true;
    }
  }
  return false;
}

export function evaluateHand(cards: Card[]): HandResult {
  if (cards.length !== 5) {
    return {
      hand: POKER_HANDS[9], // High Card
      cards,
      valueBonus: cards.reduce((sum, c) => sum + c.value, 0),
      totalPoints: 5 + cards.reduce((sum, c) => sum + c.value, 0)
    };
  }

  const valueCounts = getValueCounts(cards);
  const countValues = Array.from(valueCounts.values()).map(group => group.length).sort((a, b) => b - a);
  const valueBonus = cards.reduce((sum, c) => sum + c.value, 0);

  let hand = POKER_HANDS[9]; // Default: High Card

  // Check from highest to lowest
  if (isRoyalFlush(cards)) {
    hand = POKER_HANDS[0];
  } else if (isStraightFlush(cards)) {
    hand = POKER_HANDS[1];
  } else if (countValues[0] === 4) {
    hand = POKER_HANDS[2]; // Four of a Kind
  } else if (countValues[0] === 3 && countValues[1] === 2) {
    hand = POKER_HANDS[3]; // Full House
  } else if (isFlush(cards)) {
    hand = POKER_HANDS[4];
  } else if (isStraight(cards)) {
    hand = POKER_HANDS[5];
  } else if (countValues[0] === 3) {
    hand = POKER_HANDS[6]; // Three of a Kind
  } else if (countValues[0] === 2 && countValues[1] === 2) {
    hand = POKER_HANDS[7]; // Two Pair
  } else if (countValues[0] === 2) {
    hand = POKER_HANDS[8]; // One Pair
  }

  return {
    hand,
    cards,
    valueBonus,
    totalPoints: hand.basePoints + valueBonus
  };
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  SUITS.forEach(suit => {
    RANKS.forEach(rank => {
      deck.push({
        id: `${rank}-${suit}`,
        suit,
        rank,
        value: RANK_VALUES[rank]
      });
    });
  });
  return deck;
}

export function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function calculateTimeBonus(seconds: number): number {
  if (seconds < 60) return 200;
  if (seconds < 90) return 100;
  if (seconds < 120) return 50;
  return 0;
}

export function calculateLeftoverPenalty(cards: Card[]): number {
  return cards.reduce((sum, card) => sum + card.value * 10, 0);
}

export function calculateLevelGoal(level: number): number {
  if (level <= 1) return 1000;
  if (level <= 2) return 1500;
  if (level <= 3) return 2000;
  if (level <= 15) return 2000 + (level - 3) * 300;
  return 2000 + 12 * 300 + (level - 15) * 200;
}

export function getSSCPhase(level: number): 'static' | 'conveyor' | 'falling' {
  const cyclePosition = ((level - 1) % 15) + 1;
  if (cyclePosition <= 5) return 'static';
  if (cyclePosition <= 10) return 'conveyor';
  return 'falling';
}

export function getSSCSpeed(level: number): number {
  const phase = getSSCPhase(level);
  const cyclePosition = ((level - 1) % 15) + 1;
  
  if (phase === 'static') return 0;
  if (phase === 'conveyor') {
    const phaseLevel = cyclePosition - 5;
    return 0.4 + (phaseLevel - 1) * 0.1;
  }
  // falling
  const phaseLevel = cyclePosition - 10;
  return 0.6 + (phaseLevel - 1) * 0.15;
}

// Generate a hand of a specific type for power-ups
export function generateSpecificHand(handType: string, availableCards: Card[]): Card[] | null {
  const shuffled = shuffleDeck([...availableCards]);
  
  switch (handType) {
    case 'Two Pair': {
      const valueCounts = getValueCounts(shuffled);
      const pairs: Card[][] = [];
      for (const [, cards] of valueCounts) {
        if (cards.length >= 2) pairs.push(cards.slice(0, 2));
        if (pairs.length === 2) break;
      }
      if (pairs.length < 2) return null;
      const kicker = shuffled.find(c => !pairs[0].includes(c) && !pairs[1].includes(c));
      return kicker ? [...pairs[0], ...pairs[1], kicker] : null;
    }
    case 'Three of a Kind': {
      const valueCounts = getValueCounts(shuffled);
      for (const [, cards] of valueCounts) {
        if (cards.length >= 3) {
          const kickers = shuffled.filter(c => !cards.includes(c)).slice(0, 2);
          return [...cards.slice(0, 3), ...kickers];
        }
      }
      return null;
    }
    case 'Straight': {
      const sorted = [...new Map(shuffled.map(c => [c.value, c])).values()].sort((a, b) => a.value - b.value);
      for (let i = 0; i <= sorted.length - 5; i++) {
        const straight: Card[] = [];
        for (let j = 0; j < 5; j++) {
          if (sorted[i + j]?.value === sorted[i].value + j) {
            straight.push(sorted[i + j]);
          }
        }
        if (straight.length === 5) return straight;
      }
      return null;
    }
    case 'Flush': {
      const suitCounts = getSuitCounts(shuffled);
      for (const [, cards] of suitCounts) {
        if (cards.length >= 5) return cards.slice(0, 5);
      }
      return null;
    }
    case 'Full House': {
      const valueCounts = getValueCounts(shuffled);
      let threeOfKind: Card[] | null = null;
      let pair: Card[] | null = null;
      for (const [, cards] of valueCounts) {
        if (cards.length >= 3 && !threeOfKind) threeOfKind = cards.slice(0, 3);
        else if (cards.length >= 2 && !pair) pair = cards.slice(0, 2);
      }
      if (threeOfKind && pair) return [...threeOfKind, ...pair];
      return null;
    }
    case 'Four of a Kind': {
      const valueCounts = getValueCounts(shuffled);
      for (const [, cards] of valueCounts) {
        if (cards.length >= 4) {
          const kicker = shuffled.find(c => !cards.includes(c));
          return kicker ? [...cards.slice(0, 4), kicker] : null;
        }
      }
      return null;
    }
    case 'Straight Flush': {
      const suitCounts = getSuitCounts(shuffled);
      for (const [, cards] of suitCounts) {
        if (cards.length >= 5) {
          const sorted = [...cards].sort((a, b) => a.value - b.value);
          for (let i = 0; i <= sorted.length - 5; i++) {
            const straight: Card[] = [];
            for (let j = 0; j < 5; j++) {
              if (sorted[i + j]?.value === sorted[i].value + j) {
                straight.push(sorted[i + j]);
              }
            }
            if (straight.length === 5) return straight;
          }
        }
      }
      return null;
    }
    case 'Royal Flush': {
      const suitCounts = getSuitCounts(shuffled);
      for (const [, cards] of suitCounts) {
        const values = cards.map(c => c.value);
        if (values.includes(10) && values.includes(11) && values.includes(12) && values.includes(13) && values.includes(14)) {
          return cards.filter(c => [10, 11, 12, 13, 14].includes(c.value));
        }
      }
      return null;
    }
    default:
      return null;
  }
}

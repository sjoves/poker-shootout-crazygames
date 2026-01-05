import { useCallback } from 'react';
import { Card, GameState } from '@/types/game';

// ============= DEBUG INSTRUMENTATION =============
const isDebugInput = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debugInput');

interface SelectionDebugEvent {
  seq: number;
  action: string;
  cardId: string;
  reason?: string;
  selectedCount?: number;
  perfNow: number;
  dateNow: number;
}

let selectionDebugSeq = 0;
const selectionDebugLog: SelectionDebugEvent[] = [];
const MAX_SELECTION_LOG = 100;

function logSelectionEvent(event: Omit<SelectionDebugEvent, 'seq' | 'perfNow' | 'dateNow'>) {
  if (!isDebugInput) return;
  const entry: SelectionDebugEvent = {
    ...event,
    seq: ++selectionDebugSeq,
    perfNow: performance.now(),
    dateNow: Date.now(),
  };
  selectionDebugLog.push(entry);
  if (selectionDebugLog.length > MAX_SELECTION_LOG) selectionDebugLog.shift();
  // eslint-disable-next-line no-console
  console.log(`[SELECTION ${entry.seq}] ${entry.action} | ${entry.cardId}`, entry);
}

// Expose debug log to console
if (isDebugInput && typeof window !== 'undefined') {
  (window as any).__selectionDebugLog = selectionDebugLog;
}
// ============= END DEBUG INSTRUMENTATION =============

// Atomic boolean lock - no time-based gating
let isSelecting = false;
export function useCardSelection(
  setState: React.Dispatch<React.SetStateAction<GameState>>,
  getState?: () => GameState
) {
  const selectCard = useCallback(
    (card: Card) => {
      // Atomic lock - reject if already processing
      if (isSelecting) {
        logSelectionEvent({ action: 'BLOCKED_atomic_lock', cardId: card.id });
        return;
      }
      isSelecting = true;

      try {
        const snapshot = getState?.();
        const selectedCount = snapshot?.selectedCards.length ?? 0;

        logSelectionEvent({
          action: 'selectCard_enter',
          cardId: card.id,
          selectedCount,
        });

        // Validation checks
        if (selectedCount >= 5) {
          logSelectionEvent({ action: 'BLOCKED_hand_full', cardId: card.id, selectedCount });
          return;
        }

        if (snapshot) {
          if (!snapshot.isPlaying || snapshot.isPaused) {
            logSelectionEvent({ action: 'BLOCKED_not_playing', cardId: card.id });
            return;
          }

          if (snapshot.selectedCards.some((c) => c.id === card.id)) {
            logSelectionEvent({ action: 'BLOCKED_already_selected', cardId: card.id });
            return;
          }
        }

        logSelectionEvent({
          action: 'ACCEPTED_pick',
          cardId: card.id,
          selectedCount,
        });

        setState((prev) => {
          // Hard cap
          if (prev.selectedCards.length >= 5) return prev;

          // Game state check
          if (!prev.isPlaying || prev.isPaused) return prev;

          // Duplicate card check
          if (prev.selectedCards.some((c) => c.id === card.id)) return prev;

          const isBlitz = prev.mode === 'blitz_fc' || prev.mode === 'blitz_cb';
          const isSSC = prev.mode === 'ssc';
          const shouldRecycle = isBlitz || isSSC;

          return {
            ...prev,
            selectedCards: [...prev.selectedCards, card],
            usedCards: shouldRecycle ? prev.usedCards : [...prev.usedCards, card],
            deck: prev.deck.filter((c) => c.id !== card.id),
            cardsSelected: prev.cardsSelected + 1,
          };
        });
      } finally {
        // Release lock in next microtask
        queueMicrotask(() => {
          isSelecting = false;
        });
      }
    },
    [setState, getState]
  );

  return { selectCard };
}



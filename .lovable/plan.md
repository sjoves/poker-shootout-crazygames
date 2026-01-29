
# Classic Mode Scoring Logic Update

## Summary
Update Classic Mode to use new scoring formulas:
- **Time Penalty**: `seconds × 100` (deducted from final score)
- **Leftover Card Bonus**: `sum of card values × 10,000` (added to final score)
- Update the Game Over screen to display these with proper labels and formatting for large numbers

## Current vs New Logic

| Component | Current | New |
|-----------|---------|-----|
| Time Penalty | `-(seconds - 60)` if over 60s, else +1000 bonus | `seconds × 100` (always a penalty) |
| Leftover Cards | `sum(value × 10)` penalty | `sum(values) × 10,000` bonus |

### Example Calculation (New Logic)
- Base Score: 7,500
- Time Taken: 85 seconds → Time Penalty: `85 × 100 = 8,500`
- Leftover Cards: [K=13, 7=7] → Bonus: `(13 + 7) × 10,000 = 200,000`
- **Final Score**: `7,500 - 8,500 + 200,000 = 199,000`

## Changes Required

### 1. Update Poker Engine Functions (`src/lib/pokerEngine.ts`)

**Time Penalty Function** (line 232-240):
```typescript
export function calculateTimePenalty(seconds: number): number {
  // Classic Mode: Time penalty = seconds × 100
  return seconds * 100;
}
```

**Leftover Card Bonus Function** (line 242-244):
```typescript
export function calculateLeftoverBonus(cards: Card[]): number {
  // Classic Mode: Sum of card values × 10,000
  const totalValue = cards.reduce((sum, card) => sum + card.value, 0);
  return totalValue * 10000;
}
```

### 2. Update Hand Submission Hook (`src/hooks/game/useHandSubmission.ts`)

Update Classic game over calculation (lines 103-120):
- Replace `calculateTimeBonus` with `calculateTimePenalty`
- Replace `calculateLeftoverPenalty` with `calculateLeftoverBonus`
- Update formula: `finalScore = rawScore - timePenalty + leftoverBonus`

### 3. Update Game Store (`src/stores/gameStore.ts`)

Update `endGame` action (lines 190-215) and `submitHand` action (lines 299-316):
- Use new functions for Classic mode calculation
- Rename state properties for clarity:
  - `timeBonus` → `timePenalty` (or repurpose for penalty value)
  - `leftoverPenalty` → `leftoverBonus`

### 4. Update Game State Types (`src/types/game.ts`)

Rename state fields for semantic clarity (lines 81-83):
```typescript
// Classic mode scoring breakdown
rawScore: number;
timePenalty: number;      // was: timeBonus
leftoverBonus: number;    // was: leftoverPenalty
```

### 5. Update Game Over Screen (`src/pages/GameOverScreen.tsx`)

Update Classic mode display (lines 282-304):
```typescript
{isClassicMode && (
  <>
    <p className="text-sm text-muted-foreground">
      Base Score: {gameState.rawScore.toLocaleString()}
    </p>
    <p className="text-sm text-destructive">
      - Time Penalty: {gameState.timePenalty.toLocaleString()}
    </p>
    <p className="text-sm text-green-500">
      + Leftover Card Bonus: {gameState.leftoverBonus.toLocaleString()}
    </p>
    <div className="border-t border-border my-2" />
    <p className="text-sm font-medium text-primary">
      = Final Score: {displayScore.toLocaleString()}
    </p>
  </>
)}
```

### 6. Update Initial Game State (`src/hooks/game/gameConstants.ts`)

Rename default values:
```typescript
timePenalty: 0,      // was: timeBonus
leftoverBonus: 0,    // was: leftoverPenalty
```

## Technical Details

### Files to Modify
1. `src/lib/pokerEngine.ts` - Scoring calculation functions
2. `src/hooks/game/useHandSubmission.ts` - Classic game over logic
3. `src/stores/gameStore.ts` - Zustand store calculations
4. `src/types/game.ts` - GameState interface
5. `src/pages/GameOverScreen.tsx` - UI display
6. `src/hooks/game/gameConstants.ts` - Initial state values

### Large Number Handling
The UI already uses `.toLocaleString()` for number formatting, which handles large numbers with proper comma separators. The current layout with `max-w-md` container should accommodate 6-7 digit numbers comfortably.

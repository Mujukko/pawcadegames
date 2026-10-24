import { describe, it, expect, beforeEach } from 'bun:test';
import {
  createInitialMemoryState,
  generateDeck,
  flipCard,
  processMismatch,
  activatePeek,
  freezeTimer,
  updateMemoryTimer,
  MemoryGameState,
} from './engine';

describe('Pet Memory Match Core Logic Engine', () => {
  let state: MemoryGameState;

  beforeEach(() => {
    state = createInitialMemoryState(1, 4000);
  });

  describe('Deck Generation & Initialization', () => {
    it('initializes Level 1 with 12 cards, 6 pairs, and 50s time limit', () => {
      expect(state.level).toBe(1);
      expect(state.cards.length).toBe(12);
      expect(state.config.totalPairs).toBe(6);
      expect(state.timeRemaining).toBe(50);
      expect(state.moves).toBe(0);
      expect(state.pairsMatched).toBe(0);
      expect(state.score).toBe(0);
      expect(state.highScore).toBe(4000);
      expect(state.comboStreak).toBe(1);
      expect(state.cards.every((c) => !c.isFlipped && !c.isMatched)).toBe(true);
    });

    it('guarantees each card has exactly one matching pair in the deck', () => {
      const pairCounts: Record<string, number> = {};
      state.cards.forEach((c) => {
        expect(c.symbol).toBeTruthy();
        expect(c.icon).toBeTruthy();
        pairCounts[c.pairId] = (pairCounts[c.pairId] || 0) + 1;
      });

      expect(Object.keys(pairCounts).length).toBe(6);
      Object.values(pairCounts).forEach((count) => {
        expect(count).toBe(2);
      });
    });
  });

  describe('Card Flipping & Match Evaluation', () => {
    it('flips the first card in a turn', () => {
      const res = flipCard(state, 0);

      expect(res.action).toBe('first_flip');
      expect(state.cards[0]!.isFlipped).toBe(true);
      expect(state.flippedIndices).toEqual([0]);
      expect(state.moves).toBe(0);
    });

    it('evaluates match when second card has the same pairId', () => {
      const cardA = state.cards[0]!;
      const matchingIndex = state.cards.findIndex((c, idx) => idx !== 0 && c.pairId === cardA.pairId);

      flipCard(state, 0);
      const res = flipCard(state, matchingIndex);

      expect(res.action).toBe('match');
      expect(res.pointsAwarded).toBeGreaterThan(0);
      expect(state.moves).toBe(1);
      expect(state.pairsMatched).toBe(1);
      expect(state.comboStreak).toBe(2);
      expect(cardA.isMatched).toBe(true);
      expect(state.cards[matchingIndex]!.isMatched).toBe(true);
      expect(state.flippedIndices.length).toBe(0); // cleared after match
    });

    it('evaluates mismatch when second card has different pairId', () => {
      const cardA = state.cards[0]!;
      const nonMatchingIndex = state.cards.findIndex((c, idx) => idx !== 0 && c.pairId !== cardA.pairId);

      state.comboStreak = 3;
      flipCard(state, 0);
      const res = flipCard(state, nonMatchingIndex);

      expect(res.action).toBe('mismatch');
      expect(state.moves).toBe(1);
      expect(state.pairsMatched).toBe(0);
      expect(state.comboStreak).toBe(1); // reset combo
      expect(state.flippedIndices).toEqual([0, nonMatchingIndex]);

      // Process mismatch turns cards face down
      processMismatch(state);
      expect(cardA.isFlipped).toBe(false);
      expect(state.cards[nonMatchingIndex]!.isFlipped).toBe(false);
      expect(state.flippedIndices.length).toBe(0);
    });

    it('ignores clicks on already flipped or matched cards', () => {
      flipCard(state, 0);
      const res = flipCard(state, 0); // click same card again

      expect(res.action).toBe('already_flipped');
      expect(state.flippedIndices.length).toBe(1);
    });
  });

  describe('Game Completion & Star Rating', () => {
    it('detects game completion and calculates 3 stars for efficient moves', () => {
      // Simulate matching all 6 pairs in 6 moves
      const uniquePairIds = Array.from(new Set(state.cards.map((c) => c.pairId)));

      uniquePairIds.forEach((pairId) => {
        const idx1 = state.cards.findIndex((c) => c.pairId === pairId && !c.isMatched);
        flipCard(state, idx1);
        const idx2 = state.cards.findIndex((c, i) => i !== idx1 && c.pairId === pairId && !c.isMatched);
        flipCard(state, idx2);
      });

      expect(state.pairsMatched).toBe(6);
      expect(state.isComplete).toBe(true);
      expect(state.stars).toBe(3); // <= 8 moves for 3 stars
    });
  });

  describe('Boosters & Timers', () => {
    it('activates peek booster and reveals cards for duration', () => {
      expect(state.peekCharges).toBe(1);

      const activated = activatePeek(state);
      expect(activated).toBe(true);
      expect(state.peekActive).toBe(true);
      expect(state.peekCharges).toBe(0);

      // Advance timer past peek duration
      updateMemoryTimer(state, 1.5);
      expect(state.peekActive).toBe(false);
    });

    it('freezes countdown timer when freeze is applied', () => {
      const initialTime = state.timeRemaining;
      freezeTimer(state, 10);

      updateMemoryTimer(state, 3.0);
      expect(state.timeRemaining).toBe(initialTime); // paused during freeze!
    });

    it('triggers game over when countdown timer reaches zero', () => {
      state.timeRemaining = 2.0;
      updateMemoryTimer(state, 3.0);

      expect(state.timeRemaining).toBe(0);
      expect(state.isGameOver).toBe(true);
    });
  });
});

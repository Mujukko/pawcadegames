import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  canClearCard,
  clearTableauCard,
  drawCard,
  undoMove,
  nextStage,
  getRankLabel,
  getSuitSymbol,
} from './engine';
import { TriPeaksCard } from './types';

describe('Farm TriPeaks Solitaire Core Engine', () => {
  it('initializes game state with 28 tableau cards and correct deal', () => {
    const state = createInitialState(1200, 0);
    expect(state.status).toBe('playing');
    expect(state.currentStageIndex).toBe(0);
    expect(state.highScore).toBe(1200);
    expect(state.score).toBe(0);
    expect(state.streak).toBe(1);
    expect(state.tableau).toHaveLength(28);
    expect(state.stockDeck).toHaveLength(23);
    expect(state.wasteCard).toBeDefined();
    expect(state.wasteCard?.isFaceUp).toBe(true);

    // Bottom row cards (row 3) must be face up
    const row3Cards = state.tableau.filter((c) => c.row === 3);
    expect(row3Cards).toHaveLength(10);
    row3Cards.forEach((c) => expect(c.isFaceUp).toBe(true));

    // Top rows must be initially face down
    const row0Cards = state.tableau.filter((c) => c.row === 0);
    expect(row0Cards).toHaveLength(3);
    row0Cards.forEach((c) => expect(c.isFaceUp).toBe(false));
  });

  it('validates card match rules with +/- 1 and wrap-around Ace & King', () => {
    const waste5: TriPeaksCard = {
      id: 'w',
      suit: 'clover',
      rank: 5,
      isFaceUp: true,
      isCleared: false,
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      blockedBy: [],
    };

    const card4: TriPeaksCard = { ...waste5, id: 'c4', rank: 4 };
    const card6: TriPeaksCard = { ...waste5, id: 'c6', rank: 6 };
    const card8: TriPeaksCard = { ...waste5, id: 'c8', rank: 8 };

    expect(canClearCard(card4, waste5)).toBe(true);
    expect(canClearCard(card6, waste5)).toBe(true);
    expect(canClearCard(card8, waste5)).toBe(false);

    // Wrap-around Ace (1) and King (13)
    const wasteKing: TriPeaksCard = { ...waste5, rank: 13 };
    const cardAce: TriPeaksCard = { ...waste5, rank: 1 };
    const cardQueen: TriPeaksCard = { ...waste5, rank: 12 };

    expect(canClearCard(cardAce, wasteKing)).toBe(true);
    expect(canClearCard(cardQueen, wasteKing)).toBe(true);
    expect(canClearCard(card4, wasteKing)).toBe(false);

    // Blocked or face-down card cannot be cleared
    const faceDownCard: TriPeaksCard = { ...card4, isFaceUp: false };
    expect(canClearCard(faceDownCard, waste5)).toBe(false);
  });

  it('clears matching tableau card and increases streak and score', () => {
    let state = createInitialState();
    const faceUpCard = state.tableau.find((c) => c.isFaceUp && !c.isCleared)!;

    // Force wasteCard to be matching rank (faceUpCard.rank + 1)
    state.wasteCard = {
      id: 'waste-mock',
      suit: 'wheat',
      rank: faceUpCard.rank === 13 ? 12 : faceUpCard.rank + 1,
      isFaceUp: true,
      isCleared: false,
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      blockedBy: [],
    };

    const res = clearTableauCard(state, faceUpCard.id);
    expect(res.event?.type).toBe('card_cleared');
    expect(res.state.streak).toBe(2);
    expect(res.state.score).toBe(200);
    expect(res.state.wasteCard?.rank).toBe(faceUpCard.rank);
    expect(res.state.totalCardsCleared).toBe(1);

    const clearedCardInTableau = res.state.tableau.find((c) => c.id === faceUpCard.id);
    expect(clearedCardInTableau?.isCleared).toBe(true);
  });

  it('draws card from stock deck and resets streak to 1', () => {
    let state = createInitialState();
    state.streak = 4;
    const initialStockCount = state.stockDeck.length;

    const res = drawCard(state);
    expect(res.event?.type).toBe('card_drawn');
    expect(res.state.streak).toBe(1);
    expect(res.state.stockDeck.length).toBe(initialStockCount - 1);
    expect(res.state.wasteCard?.isFaceUp).toBe(true);
    expect(res.state.canUndo).toBe(true);
  });

  it('allows clearing any face-up card with a Wildcard', () => {
    let state = createInitialState();
    const faceUpCard = state.tableau.find((c) => c.isFaceUp)!;

    // Non-matching waste card
    state.wasteCard = {
      id: 'waste-far',
      suit: 'apple',
      rank: (faceUpCard.rank + 5) % 13 || 1,
      isFaceUp: true,
      isCleared: false,
      row: 0,
      col: 0,
      x: 0,
      y: 0,
      blockedBy: [],
    };

    expect(canClearCard(faceUpCard, state.wasteCard)).toBe(false);

    const res = clearTableauCard(state, faceUpCard.id, true);
    expect(res.event?.type).toBe('card_cleared');
    expect(res.state.wildcardsLeft).toBe(0);
    expect(res.state.wasteCard?.id).toBe(faceUpCard.id);
  });

  it('supports undoing the last move', () => {
    let state = createInitialState();
    const initialScore = state.score;
    const initialStockLength = state.stockDeck.length;

    const drawn = drawCard(state);
    expect(drawn.state.stockDeck.length).toBe(initialStockLength - 1);

    const undone = undoMove(drawn.state);
    expect(undone.event?.type).toBe('undo_used');
    expect(undone.state.stockDeck.length).toBe(initialStockLength);
    expect(undone.state.score).toBe(initialScore);
  });

  it('advances to next stage and refills wildcards', () => {
    let state = createInitialState(500, 0);
    state.wildcardsLeft = 0;

    const next = nextStage(state);
    expect(next.currentStageIndex).toBe(1);
    expect(next.status).toBe('playing');
    expect(next.wildcardsLeft).toBe(1);
    expect(next.tableau).toHaveLength(28);
    expect(next.stockDeck).toHaveLength(23);
  });

  it('formats rank labels and suit symbols correctly', () => {
    expect(getRankLabel(1)).toBe('A');
    expect(getRankLabel(10)).toBe('10');
    expect(getRankLabel(11)).toBe('J');
    expect(getRankLabel(12)).toBe('Q');
    expect(getRankLabel(13)).toBe('K');

    expect(getSuitSymbol('clover')).toBe('🍀');
    expect(getSuitSymbol('wheat')).toBe('🌾');
    expect(getSuitSymbol('apple')).toBe('🍎');
    expect(getSuitSymbol('acorn')).toBe('🌰');
  });
});

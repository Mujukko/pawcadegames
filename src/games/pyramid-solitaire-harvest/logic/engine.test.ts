import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  drawStockCard,
  getHint,
  isCardSelectable,
  redealWaste,
  selectCard,
  updateCoveredStatus,
} from './engine';

describe('Pyramid Solitaire: Barnyard Harvest Logic Engine', () => {
  it('initializes game state with 28 pyramid cards, 24 stock cards, and 2 redeals', () => {
    const state = createInitialState(12345);
    expect(state.status).toBe('playing');
    expect(state.pyramid.length).toBe(28);
    expect(state.stock.length).toBe(24);
    expect(state.waste.length).toBe(0);
    expect(state.redealsRemaining).toBe(2);
    expect(state.cardsRemainingInPyramid).toBe(28);

    // Row 6 cards should be uncovered
    const row6 = state.pyramid.filter((c) => c.row === 6);
    expect(row6.length).toBe(7);
    expect(row6.every((c) => !c.isCovered)).toBe(true);

    // Top card (row 0) should be covered
    const topCard = state.pyramid.find((c) => c.row === 0);
    expect(topCard?.isCovered).toBe(true);
  });

  it('draws card from stock into waste pile', () => {
    let state = createInitialState(12345);
    const topStockId = state.stock[0].id;

    state = drawStockCard(state);
    expect(state.waste.length).toBe(1);
    expect(state.waste[0].id).toBe(topStockId);
    expect(state.stock.length).toBe(23);
    expect(state.events.some((e) => e.type === 'draw')).toBe(true);
  });

  it('redeals waste into stock when stock is exhausted', () => {
    let state = createInitialState(12345);
    state.stock = [];
    state.waste = [
      { id: 'w1', suit: 'hearts', rank: 5, value: 5 },
      { id: 'w2', suit: 'spades', rank: 8, value: 8 },
    ];

    state = redealWaste(state);
    expect(state.stock.length).toBe(2);
    expect(state.waste.length).toBe(0);
    expect(state.redealsRemaining).toBe(1);
    expect(state.events.some((e) => e.type === 'redeal')).toBe(true);
  });

  it('clears King immediately when selected and unblocked', () => {
    let state = createInitialState(12345);
    // Find an uncovered card and make it a King
    const card = state.pyramid.find((c) => c.row === 6)!;
    card.rank = 13;
    card.value = 13;

    state = selectCard(state, card.id);
    const updatedCard = state.pyramid.find((c) => c.id === card.id)!;

    expect(updatedCard.isRemoved).toBe(true);
    expect(state.score).toBeGreaterThan(0);
    expect(state.cardsRemainingInPyramid).toBe(27);
    expect(state.events.some((e) => e.type === 'king_clear')).toBe(true);
  });

  it('removes two uncovered cards that sum to 13', () => {
    let state = createInitialState(12345);
    const row6Cards = state.pyramid.filter((c) => c.row === 6);
    row6Cards[0].rank = 6;
    row6Cards[0].value = 6;
    row6Cards[1].rank = 7;
    row6Cards[1].value = 7;

    state = selectCard(state, row6Cards[0].id);
    expect(state.selectedCardId).toBe(row6Cards[0].id);

    state = selectCard(state, row6Cards[1].id);
    expect(state.pyramid.find((c) => c.id === row6Cards[0].id)!.isRemoved).toBe(true);
    expect(state.pyramid.find((c) => c.id === row6Cards[1].id)!.isRemoved).toBe(true);
    expect(state.score).toBeGreaterThan(100);
    expect(state.cardsRemainingInPyramid).toBe(26);
    expect(state.events.some((e) => e.type === 'match')).toBe(true);
  });

  it('uncovers parent card once both child cards are removed', () => {
    let state = createInitialState(12345);
    const parent = state.pyramid.find((c) => c.row === 5 && c.col === 0)!;
    const childLeft = state.pyramid.find((c) => c.row === 6 && c.col === 0)!;
    const childRight = state.pyramid.find((c) => c.row === 6 && c.col === 1)!;

    expect(parent.isCovered).toBe(true);

    childLeft.isRemoved = true;
    childRight.isRemoved = true;

    const updated = updateCoveredStatus(state.pyramid);
    const updatedParent = updated.find((c) => c.id === parent.id)!;
    expect(updatedParent.isCovered).toBe(false);
  });

  it('switches selection when clicking another card that does not sum to 13', () => {
    let state = createInitialState(12345);
    const row6Cards = state.pyramid.filter((c) => c.row === 6);
    row6Cards[0].rank = 4;
    row6Cards[0].value = 4;
    row6Cards[1].rank = 5;
    row6Cards[1].value = 5;

    state = selectCard(state, row6Cards[0].id);
    expect(state.selectedCardId).toBe(row6Cards[0].id);

    state = selectCard(state, row6Cards[1].id);
    expect(state.selectedCardId).toBe(row6Cards[1].id); // Switched selection
    expect(row6Cards[0].isRemoved).toBe(false);
  });

  it('finds valid moves and pairs using getHint', () => {
    let state = createInitialState(12345);
    const row6Cards = state.pyramid.filter((c) => c.row === 6);
    row6Cards[0].rank = 9;
    row6Cards[0].value = 9;
    row6Cards[1].rank = 4;
    row6Cards[1].value = 4;

    const hint = getHint(state);
    expect(hint).toBeDefined();
    expect(hint?.card1Id).toBe(row6Cards[0].id);
    expect(hint?.card2Id).toBe(row6Cards[1].id);
  });

  it('triggers victory when all 28 cards are removed', () => {
    let state = createInitialState(12345);
    // Mark all cards except last as removed
    state.pyramid.forEach((c) => {
      c.isRemoved = true;
      c.isCovered = false;
    });
    const lastCard = state.pyramid[0];
    lastCard.isRemoved = false;
    lastCard.rank = 13;
    lastCard.value = 13;
    state.cardsRemainingInPyramid = 1;

    state = selectCard(state, lastCard.id);
    expect(state.status).toBe('victory');
    expect(state.events.some((e) => e.type === 'victory')).toBe(true);
  });
});

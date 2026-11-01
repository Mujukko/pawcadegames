import { describe, expect, it } from 'bun:test';
import {
  canPour,
  initWaterSortGame,
  isBottleCompleted,
  pourWater,
  TOTAL_WATER_SORT_LEVELS,
  undoWaterSortMove,
} from './engine';

describe('Water Sort: Farm Bottle Pour Logic Engine', () => {
  it('initializes game with valid bottles and 0 moves', () => {
    const state = initWaterSortGame(1);
    expect(state.levelIndex).toBe(1);
    expect(state.bottles.length).toBe(3);
    expect(state.moves).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.bottles[2].slots.length).toBe(0); // empty bottle
  });

  it('validates canPour rules properly', () => {
    const state = initWaterSortGame(1);
    const b0 = state.bottles[0];
    const b1 = state.bottles[1];
    const bEmpty = state.bottles[2];

    // Can pour into empty bottle
    expect(canPour(b0, bEmpty)).toBe(true);

    // Cannot pour into same bottle
    expect(canPour(b0, b0)).toBe(false);

    // Cannot pour from empty bottle
    expect(canPour(bEmpty, b0)).toBe(false);

    // Cannot pour into full bottle with mismatched top color
    expect(canPour(b0, b1)).toBe(false);
  });

  it('transfers liquid slots on pour and increments moves', () => {
    let state = initWaterSortGame(1);
    const topColor = state.bottles[0].slots[state.bottles[0].slots.length - 1];

    state = pourWater(state, 0, 2);
    expect(state.moves).toBe(1);
    expect(state.bottles[0].slots.length).toBe(3);
    expect(state.bottles[2].slots.length).toBe(1);
    expect(state.bottles[2].slots[0]).toBe(topColor);
  });

  it('allows undoing moves successfully', () => {
    let state = initWaterSortGame(1);
    state = pourWater(state, 0, 2);
    expect(state.moves).toBe(1);
    expect(state.history.length).toBe(1);

    state = undoWaterSortMove(state);
    expect(state.moves).toBe(0);
    expect(state.history.length).toBe(0);
    expect(state.bottles[0].slots.length).toBe(4);
    expect(state.bottles[2].slots.length).toBe(0);
  });

  it('identifies completed bottles accurately', () => {
    expect(isBottleCompleted({ id: 0, slots: ['strawberry', 'strawberry', 'strawberry', 'strawberry'], completed: false })).toBe(true);
    expect(isBottleCompleted({ id: 0, slots: ['strawberry', 'blueberry', 'strawberry', 'strawberry'], completed: false })).toBe(false);
    expect(isBottleCompleted({ id: 0, slots: ['strawberry', 'strawberry', 'strawberry'], completed: false })).toBe(false);
  });

  it('triggers level_cleared when all bottles are solved in Level 1', () => {
    let state = initWaterSortGame(1);
    // Artificially configure solved state
    state.bottles = [
      { id: 0, slots: ['strawberry', 'strawberry', 'strawberry'], completed: false },
      { id: 1, slots: ['blueberry', 'blueberry', 'blueberry', 'blueberry'], completed: true },
      { id: 2, slots: ['strawberry'], completed: false },
    ];

    // Pour final strawberry into bottle 0
    state = pourWater(state, 2, 0);
    expect(state.status).toBe('level_cleared');
  });

  it('triggers victory on final level completion', () => {
    let state = initWaterSortGame(TOTAL_WATER_SORT_LEVELS);
    state.bottles = [
      { id: 0, slots: ['honey', 'honey', 'honey'], completed: false },
      { id: 1, slots: ['honey'], completed: false },
    ];

    state = pourWater(state, 1, 0);
    expect(state.status).toBe('victory');
  });
});

import { describe, expect, it } from 'bun:test';
import {
  canMoveDuck,
  checkVictory,
  createInitialPondSortState,
  executeMove,
  undoMove,
  type PondColumn,
} from './engine';

describe('Duck Pond Sort Engine', () => {
  it('initializes Level 1 with 3 filled ponds and 2 buffer ponds', () => {
    const state = createInitialPondSortState(1, 100);
    expect(state.columns.length).toBe(5); // 3 colors + 2 buffer
    expect(state.columns[0].ducks.length).toBe(4);
    expect(state.columns[1].ducks.length).toBe(4);
    expect(state.columns[2].ducks.length).toBe(4);
    expect(state.columns[3].ducks.length).toBe(0); // buffer
    expect(state.columns[4].ducks.length).toBe(0); // buffer
    expect(state.isWon).toBe(false);
    expect(state.highScore).toBe(100);
  });

  it('correctly evaluates valid and invalid duck moves', () => {
    const emptyCol: PondColumn = { id: 'c1', ducks: [], maxCapacity: 4 };
    const yellowCol: PondColumn = { id: 'c2', ducks: ['yellow'], maxCapacity: 4 };
    const pinkCol: PondColumn = { id: 'c3', ducks: ['pink'], maxCapacity: 4 };
    const fullCol: PondColumn = { id: 'c4', ducks: ['yellow', 'yellow', 'yellow', 'yellow'], maxCapacity: 4 };

    // Move from empty is invalid
    expect(canMoveDuck(emptyCol, yellowCol)).toBe(false);

    // Move to full is invalid
    expect(canMoveDuck(yellowCol, fullCol)).toBe(false);

    // Move to empty is valid
    expect(canMoveDuck(yellowCol, emptyCol)).toBe(true);

    // Move to matching color is valid
    expect(canMoveDuck(yellowCol, yellowCol)).toBe(true);

    // Move to different color is invalid
    expect(canMoveDuck(yellowCol, pinkCol)).toBe(false);
  });

  it('moves matching duck to empty buffer pond and records history', () => {
    const state = createInitialPondSortState(1);
    const topDuck = state.columns[0].ducks[state.columns[0].ducks.length - 1];

    const result = executeMove(state, 0, 3); // move to buffer 1

    expect(result.success).toBe(true);
    expect(state.columns[3].ducks.length).toBeGreaterThan(0);
    expect(state.columns[3].ducks[0]).toBe(topDuck);
    expect(state.moveHistory.length).toBe(1);
    expect(state.score).toBeGreaterThan(0);
  });

  it('undoes move cleanly, restoring duck to original pond and updating score', () => {
    const state = createInitialPondSortState(1);
    const initialCount = state.columns[0].ducks.length;

    executeMove(state, 0, 3);
    expect(state.columns[0].ducks.length).toBeLessThan(initialCount);

    const undone = undoMove(state);
    expect(undone).toBe(true);
    expect(state.columns[0].ducks.length).toBe(initialCount);
    expect(state.columns[3].ducks.length).toBe(0);
    expect(state.moveHistory.length).toBe(0);
    expect(state.score).toBe(0);
  });

  it('detects puzzle victory when all ducks of each color are sorted', () => {
    const victoryColumns: PondColumn[] = [
      { id: 'p1', ducks: ['yellow', 'yellow', 'yellow', 'yellow'], maxCapacity: 4 },
      { id: 'p2', ducks: ['pink', 'pink', 'pink', 'pink'], maxCapacity: 4 },
      { id: 'p3', ducks: ['white', 'white', 'white', 'white'], maxCapacity: 4 },
      { id: 'p4', ducks: [], maxCapacity: 4 },
      { id: 'p5', ducks: [], maxCapacity: 4 },
    ];

    expect(checkVictory(victoryColumns)).toBe(true);

    const incompleteColumns: PondColumn[] = [
      { id: 'p1', ducks: ['yellow', 'yellow', 'yellow'], maxCapacity: 4 },
      { id: 'p2', ducks: ['pink', 'pink', 'pink', 'pink'], maxCapacity: 4 },
      { id: 'p3', ducks: ['white', 'white', 'white', 'white'], maxCapacity: 4 },
      { id: 'p4', ducks: ['yellow'], maxCapacity: 4 },
      { id: 'p5', ducks: [], maxCapacity: 4 },
    ];

    expect(checkVictory(incompleteColumns)).toBe(false);
  });
});

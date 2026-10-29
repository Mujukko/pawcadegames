import { describe, it, expect } from 'bun:test';
import {
  createConnectGame,
  findConnectionPath,
  selectConnectTile,
  findValidMove,
  shuffleBoard,
  updateConnectTimer,
} from './engine';
import { ConnectTile } from './types';

describe('Farm Mahjong Connect Logic Engine', () => {
  it('initializes game with valid even grid and available moves', () => {
    const state = createConnectGame(0);
    expect(state.rows).toBe(6);
    expect(state.cols).toBe(8);
    expect(state.timeRemaining).toBe(120);
    expect(state.isGameOver).toBe(false);
    expect(state.isWon).toBe(false);

    // Initial board must have at least one valid connectable move
    const validMove = findValidMove(state);
    expect(validMove).not.toBeNull();
  });

  it('connects two adjacent identical tiles in a straight line (0 turns)', () => {
    const grid: (ConnectTile | null)[][] = [
      [
        { id: '1', r: 0, c: 0, type: 'carrot', isEmpty: false },
        { id: '2', r: 0, c: 1, type: 'carrot', isEmpty: false },
      ],
    ];

    const path = findConnectionPath(grid, 1, 2, { r: 0, c: 0 }, { r: 0, c: 1 });
    expect(path).not.toBeNull();
    expect(path?.length).toBe(2);
  });

  it('connects two tiles with 1 turn through an empty corner', () => {
    const grid: (ConnectTile | null)[][] = [
      [
        { id: '1', r: 0, c: 0, type: 'corn', isEmpty: false },
        { id: 'empty', r: 0, c: 1, type: 'corn', isEmpty: true },
      ],
      [
        { id: 'blocked', r: 1, c: 0, type: 'apple', isEmpty: false },
        { id: '2', r: 1, c: 1, type: 'corn', isEmpty: false },
      ],
    ];

    // Corner at (0, 1) is empty
    const path = findConnectionPath(grid, 2, 2, { r: 0, c: 0 }, { r: 1, c: 1 });
    expect(path).not.toBeNull();
    expect(path?.length).toBe(3); // [p1, corner, p2]
  });

  it('connects two tiles around the outer grid border with 2 turns', () => {
    // Both tiles on top edge separated by an obstacle, but outer border (r = -1) is clear
    const grid: (ConnectTile | null)[][] = [
      [
        { id: '1', r: 0, c: 0, type: 'strawberry', isEmpty: false },
        { id: 'obs', r: 0, c: 1, type: 'apple', isEmpty: false },
        { id: '2', r: 0, c: 2, type: 'strawberry', isEmpty: false },
      ],
    ];

    const path = findConnectionPath(grid, 1, 3, { r: 0, c: 0 }, { r: 0, c: 2 });
    expect(path).not.toBeNull();
    expect(path?.length).toBe(4); // 2 turns: p1 -> (-1, 0) -> (-1, 2) -> p2
  });

  it('blocks connection if more than 2 turns are required or blocked', () => {
    // Both inner tiles enclosed completely by obstacles
    const grid: (ConnectTile | null)[][] = [
      [
        { id: 'obs1', r: 0, c: 0, type: 'apple', isEmpty: false },
        { id: 'obs2', r: 0, c: 1, type: 'apple', isEmpty: false },
        { id: 'obs3', r: 0, c: 2, type: 'apple', isEmpty: false },
      ],
      [
        { id: 'obs4', r: 1, c: 0, type: 'apple', isEmpty: false },
        { id: 't1', r: 1, c: 1, type: 'carrot', isEmpty: false },
        { id: 'obs5', r: 1, c: 2, type: 'apple', isEmpty: false },
      ],
      [
        { id: 'obs6', r: 2, c: 0, type: 'apple', isEmpty: false },
        { id: 'obs7', r: 2, c: 1, type: 'apple', isEmpty: false },
        { id: 't2', r: 2, c: 2, type: 'carrot', isEmpty: false },
      ],
    ];

    const path = findConnectionPath(grid, 3, 3, { r: 1, c: 1 }, { r: 2, c: 2 });
    expect(path).toBeNull();
  });

  it('selects tile, matches pair, removes tiles, and adds points', () => {
    let state = createConnectGame(0);
    // Find a valid move on board
    const valid = findValidMove(state);
    expect(valid).not.toBeNull();

    if (valid) {
      state = selectConnectTile(state, valid.tile1);
      expect(state.selectedTile).toEqual(valid.tile1);

      state = selectConnectTile(state, valid.tile2);
      expect(state.selectedTile).toBeNull();
      expect(state.score).toBe(100);
      expect(state.grid[valid.tile1.r][valid.tile1.c]?.isEmpty).toBe(true);
      expect(state.grid[valid.tile2.r][valid.tile2.c]?.isEmpty).toBe(true);
      expect(state.events.some((e) => e.type === 'match_pair')).toBe(true);
    }
  });

  it('shuffles board and preserves remaining active tiles', () => {
    let state = createConnectGame(0);
    const beforeCount = state.grid.flat().filter((t) => t && !t.isEmpty).length;

    state = shuffleBoard(state);
    const afterCount = state.grid.flat().filter((t) => t && !t.isEmpty).length;

    expect(afterCount).toBe(beforeCount);
    expect(state.events.some((e) => e.type === 'shuffle_board')).toBe(true);
  });

  it('counts down timer and triggers game over when timer expires', () => {
    let state = createConnectGame(0);
    state.timeRemaining = 2;

    state = updateConnectTimer(state, 1);
    expect(state.timeRemaining).toBe(1);
    expect(state.isGameOver).toBe(false);

    state = updateConnectTimer(state, 1.5);
    expect(state.timeRemaining).toBe(0);
    expect(state.isGameOver).toBe(true);
    expect(state.events.some((e) => e.type === 'game_over_timeout')).toBe(true);
  });
});

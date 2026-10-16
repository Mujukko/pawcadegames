import { describe, expect, it } from 'bun:test';
import {
  createEmptyGrid,
  createInitialGameState,
  getEmptyCells,
  getMaxTier,
  isGameOver,
  performMove,
  slideAndMergeLine,
  slideGrid,
  spawnRandomTile,
  undoMove,
} from './engine';
import { GameState2048 } from './types';

describe('Animal 2048 Engine Tests', () => {
  it('creates an empty 4x4 grid', () => {
    const grid = createEmptyGrid();
    expect(grid.length).toBe(4);
    expect(grid[0]!.length).toBe(4);
    expect(getEmptyCells(grid).length).toBe(16);
  });

  it('spawns random animal tile (mouse 2 or hamster 4)', () => {
    const grid = createEmptyGrid();
    const res = spawnRandomTile(grid);
    expect(res.spawned).not.toBeNull();
    expect([2, 4]).toContain(res.spawned!.value);
    expect(getEmptyCells(res.grid).length).toBe(15);
  });

  describe('slideAndMergeLine', () => {
    it('slides tiles to the left without merge if values are different', () => {
      const line = [0, 2, 0, 4];
      const res = slideAndMergeLine(line);
      expect(res.newLine).toEqual([2, 4, 0, 0]);
      expect(res.score).toBe(0);
      expect(res.mergedIndices).toEqual([]);
    });

    it('merges adjacent matching animals (2 + 2 -> 4)', () => {
      const line = [2, 2, 0, 0];
      const res = slideAndMergeLine(line);
      expect(res.newLine).toEqual([4, 0, 0, 0]);
      expect(res.score).toBe(4);
      expect(res.mergedIndices).toEqual([{ index: 0, value: 4 }]);
    });

    it('merges separated matching animals through zeros (2 + 0 + 2 -> 4)', () => {
      const line = [2, 0, 2, 0];
      const res = slideAndMergeLine(line);
      expect(res.newLine).toEqual([4, 0, 0, 0]);
      expect(res.score).toBe(4);
    });

    it('handles multiple merges in single row ([2, 2, 4, 4] -> [4, 8, 0, 0])', () => {
      const line = [2, 2, 4, 4];
      const res = slideAndMergeLine(line);
      expect(res.newLine).toEqual([4, 8, 0, 0]);
      expect(res.score).toBe(12);
      expect(res.mergedIndices.length).toBe(2);
    });

    it('does not merge thrice in single slide ([2, 2, 2, 0] -> [4, 2, 0, 0])', () => {
      const line = [2, 2, 2, 0];
      const res = slideAndMergeLine(line);
      expect(res.newLine).toEqual([4, 2, 0, 0]);
      expect(res.score).toBe(4);
    });

    it('collapses [2, 2, 2, 2] -> [4, 4, 0, 0]', () => {
      const line = [2, 2, 2, 2];
      const res = slideAndMergeLine(line);
      expect(res.newLine).toEqual([4, 4, 0, 0]);
      expect(res.score).toBe(8);
    });
  });

  describe('slideGrid 4 directions', () => {
    it('slides left correctly', () => {
      const grid = [
        [2, 0, 2, 4],
        [0, 4, 4, 0],
        [0, 0, 0, 0],
        [8, 8, 8, 8],
      ];
      const res = slideGrid(grid, 'left');
      expect(res.moved).toBe(true);
      expect(res.grid[0]).toEqual([4, 4, 0, 0]);
      expect(res.grid[1]).toEqual([8, 0, 0, 0]);
      expect(res.grid[2]).toEqual([0, 0, 0, 0]);
      expect(res.grid[3]).toEqual([16, 16, 0, 0]);
      expect(res.scoreGained).toBe(4 + 8 + 32);
    });

    it('slides right correctly', () => {
      const grid = [
        [2, 0, 2, 4],
        [0, 4, 4, 0],
        [0, 0, 0, 0],
        [8, 8, 8, 8],
      ];
      const res = slideGrid(grid, 'right');
      expect(res.moved).toBe(true);
      expect(res.grid[0]).toEqual([0, 0, 4, 4]);
      expect(res.grid[1]).toEqual([0, 0, 0, 8]);
      expect(res.grid[2]).toEqual([0, 0, 0, 0]);
      expect(res.grid[3]).toEqual([0, 0, 16, 16]);
    });

    it('slides up correctly', () => {
      const grid = [
        [2, 0, 0, 8],
        [2, 4, 0, 8],
        [4, 4, 0, 0],
        [0, 0, 0, 0],
      ];
      const res = slideGrid(grid, 'up');
      expect(res.moved).toBe(true);
      expect(res.grid[0]).toEqual([4, 8, 0, 16]);
      expect(res.grid[1]).toEqual([4, 0, 0, 0]);
      expect(res.grid[2]).toEqual([0, 0, 0, 0]);
      expect(res.grid[3]).toEqual([0, 0, 0, 0]);
    });

    it('slides down correctly', () => {
      const grid = [
        [2, 0, 0, 8],
        [2, 4, 0, 8],
        [4, 4, 0, 0],
        [0, 0, 0, 0],
      ];
      const res = slideGrid(grid, 'down');
      expect(res.moved).toBe(true);
      expect(res.grid[3]).toEqual([4, 8, 0, 16]);
      expect(res.grid[2]).toEqual([4, 0, 0, 0]);
    });

    it('detects no move when grid is blocked in that direction', () => {
      const grid = [
        [2, 4, 8, 16],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ];
      const res = slideGrid(grid, 'up');
      expect(res.moved).toBe(false);
      expect(res.scoreGained).toBe(0);
    });
  });

  describe('Game Over and Max Tier', () => {
    it('detects game over when board is full and no adjacent matches', () => {
      const fullGrid = [
        [2, 4, 2, 4],
        [4, 2, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      expect(isGameOver(fullGrid)).toBe(true);
    });

    it('is not game over if there is an empty cell', () => {
      const gridWithEmpty = [
        [2, 4, 2, 4],
        [4, 0, 4, 2],
        [2, 4, 2, 4],
        [4, 2, 4, 2],
      ];
      expect(isGameOver(gridWithEmpty)).toBe(false);
    });

    it('is not game over if adjacent matches exist horizontally or vertically', () => {
      const gridWithMatch = [
        [2, 2, 4, 8],
        [4, 8, 16, 32],
        [8, 16, 32, 64],
        [16, 32, 64, 128],
      ];
      expect(isGameOver(gridWithMatch)).toBe(false);
    });

    it('calculates max tier correctly', () => {
      const grid = [
        [2, 4, 8, 16],
        [32, 64, 128, 256],
        [512, 1024, 2048, 0],
        [0, 0, 0, 0],
      ];
      expect(getMaxTier(grid)).toBe(2048);
    });
  });

  describe('State Machine & Undo', () => {
    it('initializes game state with 2 tiles and score 0', () => {
      const state = createInitialGameState(100);
      expect(state.score).toBe(0);
      expect(state.bestScore).toBe(100);
      expect(state.isGameOver).toBe(false);
      expect(state.hasWon).toBe(false);
      const emptyCount = getEmptyCells(state.grid).length;
      expect(emptyCount).toBe(14);
    });

    it('performs move, increments score, and preserves history', () => {
      const initial: GameState2048 = {
        grid: [
          [2, 2, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        score: 0,
        bestScore: 50,
        maxTier: 2,
        isGameOver: false,
        hasWon: false,
        keepPlayingAfterWin: false,
      };

      const result = performMove(initial, 'left');
      expect(result.slideResult.moved).toBe(true);
      expect(result.state.score).toBe(4);
      expect(result.state.history).toBeDefined();
      expect(result.state.history!.score).toBe(0);
      expect(result.state.grid[0]![0]).toBe(4);

      // Test Undo
      const reverted = undoMove(result.state);
      expect(reverted.score).toBe(0);
      expect(reverted.grid[0]).toEqual([2, 2, 0, 0]);
      expect(reverted.history).toBeUndefined();
    });

    it('triggers victory flag when Elephant (2048) is created', () => {
      const nearElephant: GameState2048 = {
        grid: [
          [1024, 1024, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
          [0, 0, 0, 0],
        ],
        score: 1000,
        bestScore: 2000,
        maxTier: 1024,
        isGameOver: false,
        hasWon: false,
        keepPlayingAfterWin: false,
      };

      const result = performMove(nearElephant, 'left');
      expect(result.state.maxTier).toBe(2048);
      expect(result.state.hasWon).toBe(true);
      expect(result.state.score).toBe(3048);
    });
  });
});

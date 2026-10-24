import { describe, it, expect, beforeEach } from 'bun:test';
import {
  createInitialMahjongState,
  generateSolvableBoard,
  isTileFree,
  selectTile,
  undoMove,
  shuffleRemaining,
  getHint,
  getAvailablePairs,
  MahjongTile,
  MahjongState,
} from './engine';

describe('Farm Mahjong Solitaire Core Logic Engine', () => {
  let state: MahjongState;

  beforeEach(() => {
    state = createInitialMahjongState(1, 5000);
  });

  describe('Board Generation & Layout Integrity', () => {
    it('initializes Level 1 board with 36 tiles and 18 pairs', () => {
      expect(state.tiles.length).toBe(36);
      expect(state.totalPairs).toBe(18);
      expect(state.matchesMade).toBe(0);
      expect(state.score).toBe(0);
      expect(state.highScore).toBe(5000);
      expect(state.combo).toBe(1);
    });

    it('ensures all generated tiles have valid symbols and matching pairs', () => {
      const symbolCounts: Record<string, number> = {};
      state.tiles.forEach((t) => {
        expect(t.symbol).toBeTruthy();
        expect(t.icon).toBeTruthy();
        symbolCounts[t.symbol] = (symbolCounts[t.symbol] || 0) + 1;
      });

      // Each symbol must occur an even number of times (pairs)
      Object.values(symbolCounts).forEach((count) => {
        expect(count % 2).toBe(0);
      });
    });

    it('guarantees that initial board has available free matching moves', () => {
      const available = getAvailablePairs(state.tiles);
      expect(available.length).toBeGreaterThan(0);
    });
  });

  describe('Tile Freedom Rules (Top Coverage & Left/Right Obstruction)', () => {
    it('detects a tile is NOT free if covered directly from layer above (z+1)', () => {
      const mockTiles: MahjongTile[] = [
        { id: 'bottom', symbol: 'corn', label: 'Corn', icon: '🌽', x: 4, y: 4, z: 0, matched: false },
        { id: 'top', symbol: 'apple', label: 'Apple', icon: '🍎', x: 4, y: 4, z: 1, matched: false },
      ];

      expect(isTileFree('bottom', mockTiles)).toBe(false);
      expect(isTileFree('top', mockTiles)).toBe(true);
    });

    it('detects a tile is NOT free if blocked on BOTH left and right sides', () => {
      const mockTiles: MahjongTile[] = [
        { id: 'center', symbol: 'corn', label: 'Corn', icon: '🌽', x: 4, y: 4, z: 0, matched: false },
        { id: 'left', symbol: 'apple', label: 'Apple', icon: '🍎', x: 2, y: 4, z: 0, matched: false },
        { id: 'right', symbol: 'sheep', label: 'Sheep', icon: '🐑', x: 6, y: 4, z: 0, matched: false },
      ];

      // Blocked on both left and right
      expect(isTileFree('center', mockTiles)).toBe(false);
      // Outer tiles have at least one side open
      expect(isTileFree('left', mockTiles)).toBe(true);
      expect(isTileFree('right', mockTiles)).toBe(true);
    });

    it('considers a tile free if at least one side (left or right) is open', () => {
      const mockTiles: MahjongTile[] = [
        { id: 'center', symbol: 'corn', label: 'Corn', icon: '🌽', x: 4, y: 4, z: 0, matched: false },
        { id: 'left', symbol: 'apple', label: 'Apple', icon: '🍎', x: 2, y: 4, z: 0, matched: false },
      ];

      // Right side is open
      expect(isTileFree('center', mockTiles)).toBe(true);
    });
  });

  describe('Tile Selection & Matching', () => {
    it('selects a free tile on first click and deselects on second click', () => {
      const freeTiles = state.tiles.filter((t) => isTileFree(t.id, state.tiles));
      const firstId = freeTiles[0]!.id;

      selectTile(state, firstId);
      expect(state.selectedTileId).toBe(firstId);

      selectTile(state, firstId);
      expect(state.selectedTileId).toBeNull();
    });

    it('matches two free tiles with identical symbols and awards points with combo streak', () => {
      const available = getAvailablePairs(state.tiles);
      const [id1, id2] = available[0]!;

      // Click first
      const res1 = selectTile(state, id1);
      expect(res1.success).toBe(false);
      expect(state.selectedTileId).toBe(id1);

      // Click second matching
      const res2 = selectTile(state, id2);
      expect(res2.success).toBe(true);
      expect(res2.pointsAwarded).toBe(100);
      expect(state.score).toBe(100);
      expect(state.matchesMade).toBe(1);
      expect(state.combo).toBe(2); // Combo increments

      const tile1 = state.tiles.find((t) => t.id === id1)!;
      const tile2 = state.tiles.find((t) => t.id === id2)!;
      expect(tile1.matched).toBe(true);
      expect(tile2.matched).toBe(true);
    });

    it('resets combo streak when clicking non-matching tiles', () => {
      state.combo = 3;
      const freeTiles = state.tiles.filter((t) => isTileFree(t.id, state.tiles));

      // Find two free tiles with different symbols
      const tileA = freeTiles[0]!;
      const tileB = freeTiles.find((t) => t.symbol !== tileA.symbol)!;

      selectTile(state, tileA.id);
      const res = selectTile(state, tileB.id);

      expect(res.success).toBe(false);
      expect(state.combo).toBe(1);
      expect(state.selectedTileId).toBe(tileB.id);
    });
  });

  describe('Undo, Shuffle & Hints', () => {
    it('undoes the last match and restores tiles and score', () => {
      const available = getAvailablePairs(state.tiles);
      const [id1, id2] = available[0]!;

      selectTile(state, id1);
      selectTile(state, id2);
      expect(state.matchesMade).toBe(1);

      const undone = undoMove(state);
      expect(undone).toBe(true);
      expect(state.matchesMade).toBe(0);
      expect(state.score).toBe(0);

      const tile1 = state.tiles.find((t) => t.id === id1)!;
      const tile2 = state.tiles.find((t) => t.id === id2)!;
      expect(tile1.matched).toBe(false);
      expect(tile2.matched).toBe(false);
    });

    it('shuffles remaining tiles and preserves active tile count', () => {
      const countBefore = state.tiles.filter((t) => !t.matched).length;
      const shuffled = shuffleRemaining(state);

      expect(shuffled).toBe(true);
      const countAfter = state.tiles.filter((t) => !t.matched).length;
      expect(countAfter).toBe(countBefore);
    });

    it('provides a hint for an available free pair', () => {
      const hint = getHint(state);
      expect(hint).not.toBeNull();
      expect(hint!.length).toBe(2);

      const [h1, h2] = hint!;
      const t1 = state.tiles.find((t) => t.id === h1)!;
      const t2 = state.tiles.find((t) => t.id === h2)!;
      expect(t1.symbol).toBe(t2.symbol);
      expect(isTileFree(h1, state.tiles)).toBe(true);
      expect(isTileFree(h2, state.tiles)).toBe(true);
    });
  });
});

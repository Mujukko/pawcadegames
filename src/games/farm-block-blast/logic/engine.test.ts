import { describe, expect, it } from 'bun:test';
import {
  GRID_SIZE,
  PieceShape,
  canPieceFitAnywhere,
  canPlacePiece,
  checkGameOver,
  createEmptyGrid,
  createInitialGameState,
  placePiece,
} from './engine';

describe('Farm Block Blast Core Engine', () => {
  it('initializes an 8x8 grid with 3 available pieces in the barn', () => {
    const state = createInitialGameState(500);
    expect(state.grid.length).toBe(GRID_SIZE);
    expect(state.grid[0]!.length).toBe(GRID_SIZE);
    expect(state.score).toBe(0);
    expect(state.bestScore).toBe(500);
    expect(state.combo).toBe(0);
    expect(state.availablePieces.length).toBe(3);
    expect(state.availablePieces[0]).not.toBeNull();
    expect(state.isGameOver).toBe(false);
  });

  describe('canPlacePiece', () => {
    const samplePiece: PieceShape = {
      id: 'test_2x2',
      name: 'Test Square',
      matrix: [
        [true, true],
        [true, true],
      ],
      width: 2,
      height: 2,
      cellCount: 4,
      colorIndex: 2,
    };

    it('allows placement on empty grid within bounds', () => {
      const grid = createEmptyGrid();
      expect(canPlacePiece(grid, samplePiece, 0, 0)).toBe(true);
      expect(canPlacePiece(grid, samplePiece, 6, 6)).toBe(true);
    });

    it('rejects placement when piece extends beyond right boundary', () => {
      const grid = createEmptyGrid();
      expect(canPlacePiece(grid, samplePiece, 0, 7)).toBe(false);
    });

    it('rejects placement when piece extends beyond bottom boundary', () => {
      const grid = createEmptyGrid();
      expect(canPlacePiece(grid, samplePiece, 7, 0)).toBe(false);
    });

    it('rejects placement if target cells are already occupied', () => {
      const grid = createEmptyGrid();
      grid[1]![1] = 1; // Occupy cell
      expect(canPlacePiece(grid, samplePiece, 0, 0)).toBe(false);
    });
  });

  describe('placePiece and Line Clearing', () => {
    const horizontalPiece: PieceShape = {
      id: 'test_h4',
      name: 'Test H4',
      matrix: [[true, true, true, true]],
      width: 4,
      height: 1,
      cellCount: 4,
      colorIndex: 3,
    };

    it('places piece onto grid, clears full row, and awards points', () => {
      let state = createInitialGameState(0);
      // Pre-fill row 0 except cols 0..3
      for (let c = 4; c < 8; c++) {
        state.grid[0]![c] = 1;
      }
      state.availablePieces[0] = horizontalPiece;

      const result = placePiece(state, 0, 0, 0);
      expect(result.success).toBe(true);
      expect(result.clearedRows).toEqual([0]);
      expect(result.pointsEarned).toBeGreaterThanOrEqual(104); // 4 placement + 100 line
      expect(result.comboStreak).toBe(1);

      // Verify row 0 is completely cleared
      expect(result.state.grid[0]!.every((c) => c === 0)).toBe(true);
    });

    it('clears simultaneous row and column (Double Clear) with bonus', () => {
      let state = createInitialGameState(0);
      // Fill entire row 0 and col 0 except at (0,0)
      for (let c = 1; c < 8; c++) state.grid[0]![c] = 1;
      for (let r = 1; r < 8; r++) state.grid[r]![0] = 1;

      const singleDot: PieceShape = {
        id: 'dot',
        name: 'Single',
        matrix: [[true]],
        width: 1,
        height: 1,
        cellCount: 1,
        colorIndex: 4,
      };
      state.availablePieces[0] = singleDot;

      const result = placePiece(state, 0, 0, 0);
      expect(result.success).toBe(true);
      expect(result.clearedRows).toEqual([0]);
      expect(result.clearedCols).toEqual([0]);
      // Double clear base = 300 + 1 placement = 301
      expect(result.pointsEarned).toBe(301);
      expect(result.comboStreak).toBe(1);
    });

    it('builds combo streak on consecutive clears and resets on empty clear', () => {
      let state = createInitialGameState(0);
      state.combo = 2; // Was already on a 2x combo

      // Set up row 0 to clear
      for (let c = 1; c < 8; c++) state.grid[0]![c] = 1;

      const singleDot: PieceShape = {
        id: 'dot',
        name: 'Single',
        matrix: [[true]],
        width: 1,
        height: 1,
        cellCount: 1,
        colorIndex: 4,
      };
      state.availablePieces[0] = singleDot;

      const res1 = placePiece(state, 0, 0, 0);
      expect(res1.comboStreak).toBe(3); // Incremented to 3x combo!
      expect(res1.state.combo).toBe(3);
      expect(res1.state.maxCombo).toBe(3);

      // Place next piece on empty cell with no line clear
      res1.state.availablePieces[1] = singleDot;
      const res2 = placePiece(res1.state, 1, 3, 3);
      expect(res2.comboStreak).toBe(0); // Combo reset
      expect(res2.state.combo).toBe(0);
      expect(res2.state.maxCombo).toBe(3); // Best combo preserved
    });

    it('automatically generates 3 new pieces when all 3 are consumed', () => {
      let state = createInitialGameState(0);
      const dot: PieceShape = {
        id: 'dot',
        name: 'Dot',
        matrix: [[true]],
        width: 1,
        height: 1,
        cellCount: 1,
        colorIndex: 1,
      };

      state.availablePieces = [dot, dot, dot];

      state = placePiece(state, 0, 0, 0).state;
      expect(state.availablePieces[0]).toBeNull();
      expect(state.availablePieces[1]).not.toBeNull();

      state = placePiece(state, 1, 1, 1).state;
      expect(state.availablePieces[1]).toBeNull();

      state = placePiece(state, 2, 2, 2).state;
      // All 3 used -> deals a fresh batch of 3 pieces!
      expect(state.availablePieces.length).toBe(3);
      expect(state.availablePieces[0]).not.toBeNull();
      expect(state.availablePieces[1]).not.toBeNull();
      expect(state.availablePieces[2]).not.toBeNull();
    });
  });

  describe('Game Over Detection', () => {
    it('detects game over when no pieces in hand can fit on board', () => {
      const grid = createEmptyGrid();
      // Fill the board completely
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          grid[r]![c] = 1;
        }
      }

      const bigSquare: PieceShape = {
        id: 'sq2',
        name: 'Square',
        matrix: [
          [true, true],
          [true, true],
        ],
        width: 2,
        height: 2,
        cellCount: 4,
        colorIndex: 1,
      };

      expect(canPieceFitAnywhere(grid, bigSquare)).toBe(false);
      expect(checkGameOver(grid, [bigSquare])).toBe(true);
    });

    it('does not trigger game over if at least one piece can fit in any open cell', () => {
      const grid = createEmptyGrid();
      // Fill all cells except one (7,7)
      for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
          grid[r]![c] = 1;
        }
      }
      grid[7]![7] = 0; // 1 single hole

      const bigSquare: PieceShape = {
        id: 'sq2',
        name: 'Square',
        matrix: [
          [true, true],
          [true, true],
        ],
        width: 2,
        height: 2,
        cellCount: 4,
        colorIndex: 1,
      };

      const dot: PieceShape = {
        id: 'dot',
        name: 'Dot',
        matrix: [[true]],
        width: 1,
        height: 1,
        cellCount: 1,
        colorIndex: 2,
      };

      // Big square cannot fit, but dot CAN fit!
      expect(checkGameOver(grid, [bigSquare, dot])).toBe(false);
    });
  });
});

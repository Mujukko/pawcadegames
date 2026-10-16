import { describe, expect, it } from 'bun:test';
import {
  BOARD_COLS,
  BOARD_ROWS,
  canSwap,
  createInitialBoard,
  createInitialGameState,
  createTile,
  detonateSpecialTile,
  executeSwap,
  findMatches,
  hasPossibleMoves,
  resolveCascades,
  smashTileWithHammer,
  LEVEL_CONFIGS,
  getLevelGoal,
  findBestTutorialMove,
} from './engine';
import { TileData } from './types';

describe('Farm Animal Match: Match-3 Core Engine', () => {
  it('creates an 8x8 initial board with no pre-existing matches (including 2x2 squares)', () => {
    const board = createInitialBoard();
    expect(board.length).toBe(BOARD_ROWS);
    expect(board[0]!.length).toBe(BOARD_COLS);

    // Initial board must have zero matches (no 3-in-a-row and no 2x2 square)
    const matches = findMatches(board);
    expect(matches.length).toBe(0);

    // Initial board must have at least one valid move
    expect(hasPossibleMoves(board)).toBe(true);
  });

  describe('findMatches detection', () => {
    it('detects a simple 3-in-a-row horizontal match', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Force 3 cows horizontally
      board[0]![0] = createTile(0, 0, 'cow');
      board[0]![1] = createTile(0, 1, 'cow');
      board[0]![2] = createTile(0, 2, 'cow');

      const matches = findMatches(board);
      const cowMatches = matches.filter((m) => m.type === 'cow');
      expect(cowMatches.length).toBe(1);
      expect(cowMatches[0]!.tiles.length).toBe(3);
    });

    it('detects 4-in-a-row and creates a striped special treat', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Force 4 cows horizontally at row 2 cols 1..4
      board[2]![1] = createTile(2, 1, 'cow');
      board[2]![2] = createTile(2, 2, 'cow');
      board[2]![3] = createTile(2, 3, 'cow');
      board[2]![4] = createTile(2, 4, 'cow');

      const matches = findMatches(board);
      const match = matches.find((m) => m.type === 'cow');
      expect(match).toBeDefined();
      expect(match!.tiles.length).toBe(4);
      expect(match!.createdSpecial).toBeDefined();
      expect(match!.createdSpecial!.special).toBe('striped_v');
    });

    it('detects a 2x2 Square (4-lu Kare) match and crafts a square_bomb (Dynamite)', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Force a 2x2 square of horses at rows 3..4, cols 3..4
      board[3]![3] = createTile(3, 3, 'horse');
      board[3]![4] = createTile(3, 4, 'horse');
      board[4]![3] = createTile(4, 3, 'horse');
      board[4]![4] = createTile(4, 4, 'horse');

      const matches = findMatches(board);
      const horseMatch = matches.find((m) => m.type === 'horse');
      expect(horseMatch).toBeDefined();
      expect(horseMatch!.tiles.length).toBe(4);
      expect(horseMatch!.createdSpecial).toBeDefined();
      expect(horseMatch!.createdSpecial!.special).toBe('square_bomb');
    });

    it('detects an L-shape match and crafts a wrapped_bomb (Mega Barrel Bomb)', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Force an L-shape of ducks: row 2 cols 1,2,3 and col 1 rows 2,3,4
      board[2]![1] = createTile(2, 1, 'duck');
      board[2]![2] = createTile(2, 2, 'duck');
      board[2]![3] = createTile(2, 3, 'duck');
      board[3]![1] = createTile(3, 1, 'duck');
      board[4]![1] = createTile(4, 1, 'duck');

      const matches = findMatches(board);
      const duckMatch = matches.find((m) => m.type === 'duck');
      expect(duckMatch).toBeDefined();
      expect(duckMatch!.createdSpecial).toBeDefined();
      expect(duckMatch!.createdSpecial!.special).toBe('wrapped_bomb');
    });

    it('detects 5-in-a-row and creates a Rainbow Star special treat', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Force 5 pigs vertically
      for (let r = 1; r <= 5; r++) {
        board[r]![3] = createTile(r, 3, 'pig');
      }

      const matches = findMatches(board);
      const match = matches.find((m) => m.tiles.length === 5);
      expect(match).toBeDefined();
      expect(match!.createdSpecial).toBeDefined();
      expect(match!.createdSpecial!.special).toBe('rainbow_star');
    });
  });

  describe('canSwap validation', () => {
    it('rejects non-adjacent tiles', () => {
      const board = createInitialBoard();
      expect(canSwap(board, 0, 0, 2, 2)).toBe(false);
      expect(canSwap(board, 0, 0, 0, 2)).toBe(false);
    });

    it('allows swapping a Rainbow Star with any adjacent farm animal', () => {
      const board = createInitialBoard();
      board[2]![2] = createTile(2, 2, 'cow', 'rainbow_star');
      // Even if it wouldn't make a normal match, rainbow star can swap!
      expect(canSwap(board, 2, 2, 2, 3)).toBe(true);
    });

    it('validates a swap that completes a 3-in-a-row', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Place two cows at (3, 0) and (3, 1), and one cow at (4, 2)
      board[3]![0] = createTile(3, 0, 'cow');
      board[3]![1] = createTile(3, 1, 'cow');
      board[3]![2] = createTile(3, 2, 'pig');
      board[4]![2] = createTile(4, 2, 'cow');

      // Swapping (3, 2) with (4, 2) completes 3 cows horizontally at row 3
      expect(canSwap(board, 3, 2, 4, 2)).toBe(true);

      // Swapping (3, 2) with (3, 3) does not make a match
      board[3]![3] = createTile(3, 3, 'chicken');
      expect(canSwap(board, 3, 2, 3, 3)).toBe(false);
    });
  });

  describe('resolveCascades and gravity drop', () => {
    it('clears matches, drops tiles down, and computes score', () => {
      const board: TileData[][] = Array.from({ length: 8 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => createTile(r, c, (r + c) % 2 === 0 ? 'sheep' : 'chicken'))
      );
      // Setup a match of 3 cows at bottom row
      board[7]![0] = createTile(7, 0, 'cow');
      board[7]![1] = createTile(7, 1, 'cow');
      board[7]![2] = createTile(7, 2, 'cow');

      const result = resolveCascades(board);
      expect(result.steps.length).toBeGreaterThanOrEqual(1);
      expect(result.totalScore).toBeGreaterThan(0);
      expect(result.clearedByTreat.cow).toBe(3);
    });
  });

  describe('executeSwap & Game Objectives', () => {
    it('executes a valid swap, consumes 1 move, and updates collected items', () => {
      const state = createInitialGameState();
      const initialMoves = state.movesRemaining;

      // Force a guaranteed match setup
      state.board[3]![0] = createTile(3, 0, 'cow');
      state.board[3]![1] = createTile(3, 1, 'cow');
      state.board[3]![2] = createTile(3, 2, 'sheep');
      state.board[4]![2] = createTile(4, 2, 'cow');

      const { nextState, valid } = executeSwap(state, 3, 2, 4, 2);
      expect(valid).toBe(true);
      expect(nextState.movesRemaining).toBe(initialMoves - 1);
      expect(nextState.score).toBeGreaterThan(0);
      expect(nextState.collected.cow).toBeGreaterThanOrEqual(3);
    });

    it('rejects an invalid swap with zero moves consumed', () => {
      const state = createInitialGameState();
      const initialMoves = state.movesRemaining;

      // Populate top 4 rows with checkerboard pattern of duck and horse to prevent accidental random matches
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 8; c++) {
          state.board[r]![c] = createTile(r, c, (r + c) % 2 === 0 ? 'duck' : 'horse');
        }
      }
      // Force two specific tiles that swap into no match
      state.board[0]![0] = createTile(0, 0, 'cow');
      state.board[0]![1] = createTile(0, 1, 'pig');

      const { nextState, valid } = executeSwap(state, 0, 0, 0, 1);
      expect(valid).toBe(false);
      expect(nextState.movesRemaining).toBe(initialMoves);
      expect(nextState.score).toBe(0);
    });

    it('detects victory when collect targets and target score are reached', () => {
      const state = createInitialGameState({
        targetScore: 500,
        maxMoves: 10,
        collectTargets: { cow: 3 },
        starThresholds: [500, 1000, 1500],
      });

      // Force a match of 3 cows
      state.board[3]![0] = createTile(3, 0, 'cow');
      state.board[3]![1] = createTile(3, 1, 'cow');
      state.board[3]![2] = createTile(3, 2, 'sheep');
      state.board[4]![2] = createTile(4, 2, 'cow');
      state.score = 400; // 400 + >180 score = >580!

      const { nextState, valid } = executeSwap(state, 3, 2, 4, 2);
      expect(valid).toBe(true);
      expect(nextState.hasWon).toBe(true);
      expect(nextState.stars).toBeGreaterThanOrEqual(1);
    });

    it('detonates a Square Dynamite Bomb (square_bomb) directly when double-tapped', () => {
      const state = createInitialGameState();
      const initialMoves = state.movesRemaining;
      state.board[4]![4] = createTile(4, 4, 'cow', 'square_bomb');

      const { nextState, valid, steps } = detonateSpecialTile(state, 4, 4);
      expect(valid).toBe(true);
      expect(nextState.movesRemaining).toBe(initialMoves - 1);
      expect(nextState.score).toBeGreaterThan(200);
      expect(steps.length).toBeGreaterThanOrEqual(1);
      expect(steps[0]!.clearedCoords.length).toBeGreaterThanOrEqual(15);
    });

    it('combines two bombs (wrapped_bomb + square_bomb) for a 5x5 mega crater explosion', () => {
      const state = createInitialGameState();
      state.board[3]![3] = createTile(3, 3, 'cow', 'wrapped_bomb');
      state.board[3]![4] = createTile(3, 4, 'pig', 'square_bomb');

      const { nextState, valid, steps } = executeSwap(state, 3, 3, 3, 4);
      expect(valid).toBe(true);
      expect(nextState.score).toBeGreaterThan(400);
      expect(steps[0]!.clearedCoords.length).toBeGreaterThanOrEqual(25);
    });

    it('prevents swapping a Locked X-Cage tile directly, but breaks the lock when matched', () => {
      const state = createInitialGameState();
      // Place a locked cow at (3, 0), unlocked cow at (3, 1), sheep at (3, 2), and cow at (4, 2)
      state.board[3]![0] = createTile(3, 0, 'cow', 'none', true);
      state.board[3]![1] = createTile(3, 1, 'cow');
      state.board[3]![2] = createTile(3, 2, 'sheep');
      state.board[4]![2] = createTile(4, 2, 'cow');

      // Direct swap with locked tile (3,0) is forbidden
      expect(canSwap(state.board, 3, 0, 3, 1)).toBe(false);

      // Swapping (3,2) with (4,2) matches 3 cows including the locked cow at (3,0) and breaks its lock!
      const { nextState, valid } = executeSwap(state, 3, 2, 4, 2);
      expect(valid).toBe(true);
      expect(nextState.locksCleared).toBeGreaterThanOrEqual(1);
      expect(nextState.hayCollected).toBeGreaterThan(0);
    });

    it('smashes any locked cage or swirl blocker with the Hammer Booster without consuming a move', () => {
      const state = createInitialGameState();
      const initialMoves = state.movesRemaining;
      state.board[7]![0] = createTile(7, 0, 'cow', 'none', true);

      const { nextState, valid } = smashTileWithHammer(state, 7, 0);
      expect(valid).toBe(true);
      expect(nextState.movesRemaining).toBe(initialMoves);
      expect(nextState.locksCleared).toBeGreaterThanOrEqual(1);
    });

    it('initializes all 12 Caged Animal Rescue levels with exact caged animal species and zero starting matches', () => {
      expect(LEVEL_CONFIGS.length).toBe(12);

      for (let lvl = 1; lvl <= LEVEL_CONFIGS.length; lvl++) {
        const goal = getLevelGoal(lvl);
        const state = createInitialGameState(goal);
        expect(findMatches(state.board).length).toBe(0);
        expect(hasPossibleMoves(state.board)).toBe(true);

        // Verify each lockedCell has isLocked === true and the exact configured animal species
        for (const cell of goal.lockedCells || []) {
          const tile = state.board[cell.row]![cell.col]!;
          expect(tile.isLocked).toBe(true);
          if (cell.animal) {
            expect(tile.type).toBe(cell.animal);
          }
        }
      }
    });

    it('completes Level 1 immediately when its single caged cow is rescued and awards move bonus hay', () => {
      const state = createInitialGameState(getLevelGoal(1));
      expect(state.goal.targetLocks).toBe(1);

      // Smash the single caged cow at (5, 4)
      const { nextState, valid } = smashTileWithHammer(state, 5, 4);
      expect(valid).toBe(true);
      expect(nextState.hasWon).toBe(true);
      expect(nextState.score).toBeGreaterThanOrEqual(state.movesRemaining * 60);
    });

    it('finds a valid tutorial finger move on Level 1 and prioritizes moves that break a locked cage', () => {
      const state = createInitialGameState(getLevelGoal(1));
      const hint = findBestTutorialMove(state.board);
      expect(hint).not.toBeNull();
      expect(canSwap(state.board, hint!.r1, hint!.c1, hint!.r2, hint!.c2)).toBe(true);

      // Force a guaranteed cage-breaking swap next to the locked cow at (5, 4)
      state.board[5]![2] = createTile(5, 2, 'cow');
      state.board[5]![3] = createTile(5, 3, 'pig');
      state.board[4]![3] = createTile(4, 3, 'cow');
      const cageHint = findBestTutorialMove(state.board);
      expect(cageHint).not.toBeNull();
      expect(cageHint!.breaksCage).toBe(true);
    });
  });
});



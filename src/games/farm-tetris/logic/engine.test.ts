import { describe, expect, test } from 'bun:test';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createEmptyBoard,
  createInitialState,
  generateBag,
  hardDrop,
  holdPieceAction,
  lockPiece,
  movePiece,
  rotatePiece,
  softDrop,
  spawnPiece,
} from './engine';
import { Board, TetrisGameState } from './types';

describe('Farm Tetris Core Logic Engine', () => {
  test('Initial state initializes properly', () => {
    const state = createInitialState(500);

    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.linesCleared).toBe(0);
    expect(state.level).toBe(1);
    expect(state.siloProgress).toBe(0);
    expect(state.silosFilled).toBe(0);
    expect(state.board.length).toBe(BOARD_HEIGHT);
    expect(state.board[0]!.length).toBe(BOARD_WIDTH);
    expect(state.currentPiece).not.toBeNull();
    expect(state.ghostY).toBeGreaterThanOrEqual(18);
    expect(state.isGameOver).toBe(false);
  });

  test('generateBag produces all 7 unique tetrominoes', () => {
    const bag = generateBag();
    expect(bag.length).toBe(7);
    const unique = new Set(bag);
    expect(unique.size).toBe(7);
  });

  test('movePiece moves left, right, and down within bounds', () => {
    const state = createInitialState();
    const initialX = state.currentPiece!.x;

    // Move left
    const leftRes = movePiece(state, -1, 0);
    expect(leftRes.moved).toBe(true);
    expect(leftRes.state.currentPiece!.x).toBe(initialX - 1);

    // Move right
    const rightRes = movePiece(leftRes.state, 1, 0);
    expect(rightRes.moved).toBe(true);
    expect(rightRes.state.currentPiece!.x).toBe(initialX);

    // Cannot move beyond left wall
    let wallState = state;
    for (let i = 0; i < 10; i++) {
      wallState = movePiece(wallState, -1, 0).state;
    }
    const blockedLeft = movePiece(wallState, -1, 0);
    expect(blockedLeft.moved).toBe(false);
  });

  test('rotatePiece rotates piece and wraps correctly', () => {
    const state = createInitialState();
    const initRot = state.currentPiece!.rotation;

    const rotRes = rotatePiece(state, 1);
    expect(rotRes.rotated).toBe(true);
    expect(rotRes.state.currentPiece!.rotation).toBe((initRot + 1) % 4);
  });

  test('hardDrop drops piece to floor and locks it', () => {
    const state = createInitialState();
    const droppedState = hardDrop(state);

    // Score increased by drop bonus
    expect(droppedState.score).toBeGreaterThan(0);
    // Board has at least 4 placed blocks
    let placedCount = 0;
    for (const row of droppedState.board) {
      for (const cell of row) {
        if (cell !== null) placedCount++;
      }
    }
    expect(placedCount).toBe(4);
    // New piece has spawned
    expect(droppedState.currentPiece).not.toBeNull();
  });

  test('Clearing 1 line updates score, fills silo by 10%, and triggers Farmer "WOW!" reaction', () => {
    let state = createInitialState();
    // Fill row 19 completely except for columns 4, 5, 6, 7
    for (let c = 0; c < 10; c++) {
      if (c !== 4 && c !== 5) {
        state.board[19]![c] = 'O';
      }
    }

    // Spawn an 'O' piece (2x2) at column 4
    state.currentPiece = {
      type: 'O',
      rotation: 0,
      x: 4,
      y: 18,
      shape: [
        [1, 1],
        [1, 1],
      ],
    };

    // Lock piece
    const nextState = lockPiece(state);

    expect(nextState.linesCleared).toBe(1);
    expect(nextState.score).toBeGreaterThanOrEqual(100);
    expect(nextState.siloProgress).toBe(10); // 1 / 10 = 10%
    expect(nextState.lastLineClear).not.toBeNull();
    expect(nextState.lastLineClear?.linesCount).toBe(1);
    expect(nextState.lastLineClear?.farmerReaction.text).toContain('WOW');
  });

  test('Clearing 4 lines (TETRIS) awards 800+ pts, fills silo by 40%, and triggers Farmer "SUPER HARVEST!" reaction', () => {
    let state = createInitialState();
    // Fill bottom 4 rows except for column 0
    for (let r = 16; r < 20; r++) {
      for (let c = 1; c < 10; c++) {
        state.board[r]![c] = 'T';
      }
    }

    // Spawn an 'I' piece vertically at column 0
    state.currentPiece = {
      type: 'I',
      rotation: 1,
      x: -1, // I piece vertical matrix has 1s in column 2, so x=-1 places column 2 at board column 1, x=-2 places at 0
      y: 16,
      shape: [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
    };
    state.currentPiece.x = -2; // places 1s at column 0

    const nextState = lockPiece(state);

    expect(nextState.linesCleared).toBe(4);
    expect(nextState.score).toBeGreaterThanOrEqual(800);
    expect(nextState.siloProgress).toBe(40); // 4 / 10 = 40%
    expect(nextState.lastLineClear?.farmerReaction.type).toBe('super_wow');
    expect(nextState.lastLineClear?.farmerReaction.text).toContain('SUPER HARVEST');
  });

  test('Filling the silo with 10 lines increments silosFilled, levels up, and increases speed', () => {
    let state = createInitialState();
    state.siloProgress = 80; // 8 lines already in silo

    // Clear 3 lines
    for (let r = 17; r < 20; r++) {
      for (let c = 1; c < 10; c++) {
        state.board[r]![c] = 'O';
      }
    }

    state.currentPiece = {
      type: 'I',
      rotation: 1,
      x: -2,
      y: 16,
      shape: [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
    };

    const nextState = lockPiece(state);

    expect(nextState.linesCleared).toBe(3);
    expect(nextState.silosFilled).toBe(1); // 80% + 30% = 110% -> 1 full silo!
    expect(nextState.siloProgress).toBe(10); // 10% carried over
    expect(nextState.level).toBe(2);
    expect(nextState.dropInterval).toBeLessThan(800); // Speed increased!
  });

  test('holdPieceAction swaps current piece into hold and prevents double-hold', () => {
    let state = createInitialState();
    const initialPieceType = state.currentPiece!.type;

    // First hold: succeeds
    state = holdPieceAction(state);
    expect(state.holdPiece).toBe(initialPieceType);
    expect(state.canHold).toBe(false);

    // Second hold in same drop: blocked
    const prevHold = state.holdPiece;
    state = holdPieceAction(state);
    expect(state.holdPiece).toBe(prevHold);

    // After locking piece: canHold is refreshed
    state = hardDrop(state);
    expect(state.canHold).toBe(true);
  });

  test('softDrop correctly distinguishes between moving down and locking', () => {
    let state = createInitialState();
    const initialY = state.currentPiece!.y;

    // 1. Moving down when clear
    const stepRes = softDrop(state, false);
    expect(stepRes.locked).toBe(false);
    expect(stepRes.state.currentPiece!.y).toBe(initialY + 1);

    // 2. Clear any lastLineClear on movement
    stepRes.state.lastLineClear = {
      rows: [19],
      linesCount: 1,
      scoreGained: 100,
      siloProgressBefore: 0,
      siloProgressAfter: 10,
      siloCompleted: false,
      farmerReaction: { type: 'wave', text: 'WOW! 🌾', lines: 1, timestamp: 0 },
    };
    const moveRes = movePiece(stepRes.state, 1, 0);
    expect(moveRes.state.lastLineClear).toBeNull();

    // 3. Move all the way to floor until softDrop locks
    let droppingState = state;
    let locked = false;
    for (let i = 0; i < 25; i++) {
      const dropRes = softDrop(droppingState, false);
      droppingState = dropRes.state;
      if (dropRes.locked) {
        locked = true;
        break;
      }
    }
    expect(locked).toBe(true);
  });
});

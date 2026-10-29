import { describe, expect, test } from 'bun:test';
import {
  createEmptyBoard,
  dropToken,
  checkWin,
  isBoardFull,
  getBestAiMove,
  initializeConnectFour,
  resetBoard,
  NUM_ROWS,
  NUM_COLS,
} from './engine';
import { CellValue } from './types';

describe('Barnyard Four in a Row Logic Engine', () => {
  test('initializes empty 6x7 board with 0s and valid initial state', () => {
    const state = initializeConnectFour();
    expect(state.board.length).toBe(NUM_ROWS);
    expect(state.board[0].length).toBe(NUM_COLS);
    for (let r = 0; r < NUM_ROWS; r++) {
      for (let c = 0; c < NUM_COLS; c++) {
        expect(state.board[r][c]).toBe(0);
      }
    }
    expect(state.currentPlayer).toBe(1);
    expect(state.winner).toBeNull();
    expect(state.winningLine).toBeNull();
  });

  test('drops token to the lowest available row in a column with gravity', () => {
    let state = initializeConnectFour();

    // First drop in col 3 -> lands in row 5 (bottom)
    const { nextState: s1, droppedRow: r1 } = dropToken(state, 3);
    expect(r1).toBe(5);
    expect(s1.board[5][3]).toBe(1);
    expect(s1.currentPlayer).toBe(2);

    // Second drop in col 3 -> lands in row 4 (on top of row 5)
    const { nextState: s2, droppedRow: r2 } = dropToken(s1, 3);
    expect(r2).toBe(4);
    expect(s2.board[4][3]).toBe(2);
    expect(s2.currentPlayer).toBe(1);
  });

  test('rejects move when a column is already full (6 tokens stacked)', () => {
    let state = initializeConnectFour();

    // Fill column 0 completely (6 tokens)
    for (let i = 0; i < 6; i++) {
      const res = dropToken(state, 0);
      state = res.nextState;
    }

    // 7th attempt in column 0
    const { nextState, droppedRow } = dropToken(state, 0);
    expect(droppedRow).toBe(-1);
    expect(nextState).toBe(state);
  });

  test('detects horizontal 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    board[5][1] = 1;
    board[5][2] = 1;
    board[5][3] = 1;
    board[5][4] = 1;

    const win = checkWin(board);
    expect(win).not.toBeNull();
    expect(win?.player).toBe(1);
    expect(win?.positions.length).toBe(4);
    expect(win?.positions[0]).toEqual({ row: 5, col: 1 });
    expect(win?.positions[3]).toEqual({ row: 5, col: 4 });
  });

  test('detects vertical 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    board[5][2] = 2;
    board[4][2] = 2;
    board[3][2] = 2;
    board[2][2] = 2;

    const win = checkWin(board);
    expect(win).not.toBeNull();
    expect(win?.player).toBe(2);
    expect(win?.positions.length).toBe(4);
    expect(win?.positions[0]).toEqual({ row: 2, col: 2 });
    expect(win?.positions[3]).toEqual({ row: 5, col: 2 });
  });

  test('detects diagonal down-right 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    board[2][0] = 1;
    board[3][1] = 1;
    board[4][2] = 1;
    board[5][3] = 1;

    const win = checkWin(board);
    expect(win).not.toBeNull();
    expect(win?.player).toBe(1);
    expect(win?.positions.length).toBe(4);
  });

  test('detects diagonal down-left 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    board[2][5] = 2;
    board[3][4] = 2;
    board[4][3] = 2;
    board[5][2] = 2;

    const win = checkWin(board);
    expect(win).not.toBeNull();
    expect(win?.player).toBe(2);
    expect(win?.positions.length).toBe(4);
  });

  test('detects a draw when all 42 cells are filled with no 4-in-a-row', () => {
    const board: CellValue[][] = [
      [1, 2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2, 1],
      [2, 1, 2, 1, 2, 1, 2],
      [2, 1, 2, 1, 2, 1, 2],
      [1, 2, 1, 2, 1, 2, 1],
      [1, 2, 1, 2, 1, 2, 1],
    ];

    expect(isBoardFull(board)).toBe(true);
    expect(checkWin(board)).toBeNull();
  });

  test('AI takes immediate winning move when 3-in-a-row is ready to complete', () => {
    const board = createEmptyBoard();
    // AI has 3 tokens in row 5 at cols 0, 1, 2
    board[5][0] = 2;
    board[5][1] = 2;
    board[5][2] = 2;

    // AI must pick column 3 to win
    const bestMove = getBestAiMove(board, 'hard', 2);
    expect(bestMove).toBe(3);
  });

  test('AI blocks opponent immediate winning threat', () => {
    const board = createEmptyBoard();
    // Opponent (Player 1) has 3 tokens in col 4 stacked from row 5 up to 3
    board[5][4] = 1;
    board[4][4] = 1;
    board[3][4] = 1;

    // Player 1 threatens to drop in col 4 row 2 to win!
    // AI must block by dropping in col 4
    const blockMove = getBestAiMove(board, 'medium', 2);
    expect(blockMove).toBe(4);
  });

  test('resets board while preserving player match scores', () => {
    let state = initializeConnectFour();
    state.p1Score = 3;
    state.p2Score = 2;
    state.draws = 1;
    state.board[5][0] = 1;

    const reset = resetBoard(state);
    expect(reset.p1Score).toBe(3);
    expect(reset.p2Score).toBe(2);
    expect(reset.draws).toBe(1);
    expect(reset.board[5][0]).toBe(0);
    expect(reset.winner).toBeNull();
    expect(reset.currentPlayer).toBe(1);
  });
});

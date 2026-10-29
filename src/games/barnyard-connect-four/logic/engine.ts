import {
  AiDifficulty,
  CellValue,
  ConnectFourState,
  GameMode,
  Player,
  WinningLine,
} from './types';

export const NUM_ROWS = 6;
export const NUM_COLS = 7;

export function createEmptyBoard(): CellValue[][] {
  return Array.from({ length: NUM_ROWS }, () => Array(NUM_COLS).fill(0));
}

export function initializeConnectFour(
  mode: GameMode = 'ai',
  aiDifficulty: AiDifficulty = 'medium'
): ConnectFourState {
  return {
    board: createEmptyBoard(),
    currentPlayer: 1,
    winner: null,
    winningLine: null,
    mode,
    aiDifficulty,
    isAiThinking: false,
    moveHistory: [],
    p1Score: 0,
    p2Score: 0,
    draws: 0,
    hoveredCol: 3,
  };
}

export function getLowestEmptyRow(board: CellValue[][], col: number): number {
  if (col < 0 || col >= NUM_COLS) return -1;
  for (let r = NUM_ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      return r;
    }
  }
  return -1;
}

export function isValidMove(board: CellValue[][], col: number): boolean {
  return getLowestEmptyRow(board, col) !== -1;
}

export function getValidMoves(board: CellValue[][]): number[] {
  const moves: number[] = [];
  for (let c = 0; c < NUM_COLS; c++) {
    if (isValidMove(board, c)) {
      moves.push(c);
    }
  }
  return moves;
}

export function checkWin(board: CellValue[][]): WinningLine | null {
  // 1. Horizontal Checks
  for (let r = 0; r < NUM_ROWS; r++) {
    for (let c = 0; c <= NUM_COLS - 4; c++) {
      const p = board[r][c];
      if (
        p !== 0 &&
        p === board[r][c + 1] &&
        p === board[r][c + 2] &&
        p === board[r][c + 3]
      ) {
        return {
          player: p,
          positions: [
            { row: r, col: c },
            { row: r, col: c + 1 },
            { row: r, col: c + 2 },
            { row: r, col: c + 3 },
          ],
        };
      }
    }
  }

  // 2. Vertical Checks
  for (let r = 0; r <= NUM_ROWS - 4; r++) {
    for (let c = 0; c < NUM_COLS; c++) {
      const p = board[r][c];
      if (
        p !== 0 &&
        p === board[r + 1][c] &&
        p === board[r + 2][c] &&
        p === board[r + 3][c]
      ) {
        return {
          player: p,
          positions: [
            { row: r, col: c },
            { row: r + 1, col: c },
            { row: r + 2, col: c },
            { row: r + 3, col: c },
          ],
        };
      }
    }
  }

  // 3. Diagonal Down-Right Checks
  for (let r = 0; r <= NUM_ROWS - 4; r++) {
    for (let c = 0; c <= NUM_COLS - 4; c++) {
      const p = board[r][c];
      if (
        p !== 0 &&
        p === board[r + 1][c + 1] &&
        p === board[r + 2][c + 2] &&
        p === board[r + 3][c + 3]
      ) {
        return {
          player: p,
          positions: [
            { row: r, col: c },
            { row: r + 1, col: c + 1 },
            { row: r + 2, col: c + 2 },
            { row: r + 3, col: c + 3 },
          ],
        };
      }
    }
  }

  // 4. Diagonal Down-Left Checks
  for (let r = 0; r <= NUM_ROWS - 4; r++) {
    for (let c = 3; c < NUM_COLS; c++) {
      const p = board[r][c];
      if (
        p !== 0 &&
        p === board[r + 1][c - 1] &&
        p === board[r + 2][c - 2] &&
        p === board[r + 3][c - 3]
      ) {
        return {
          player: p,
          positions: [
            { row: r, col: c },
            { row: r + 1, col: c - 1 },
            { row: r + 2, col: c - 2 },
            { row: r + 3, col: c - 3 },
          ],
        };
      }
    }
  }

  return null;
}

export function isBoardFull(board: CellValue[][]): boolean {
  for (let c = 0; c < NUM_COLS; c++) {
    if (board[0][c] === 0) return false;
  }
  return true;
}

/**
 * Executes a move in the specified column for the given player.
 * Returns the target row where the token settles, or -1 if invalid.
 */
export function dropToken(
  state: ConnectFourState,
  col: number
): { nextState: ConnectFourState; droppedRow: number } {
  if (state.winner !== null) {
    return { nextState: state, droppedRow: -1 };
  }

  const row = getLowestEmptyRow(state.board, col);
  if (row === -1) {
    return { nextState: state, droppedRow: -1 };
  }

  // Clone board
  const nextBoard = state.board.map((r) => [...r]);
  nextBoard[row][col] = state.currentPlayer;

  const win = checkWin(nextBoard);
  let winner: Player | 'draw' | null = null;
  let p1Score = state.p1Score;
  let p2Score = state.p2Score;
  let draws = state.draws;

  if (win) {
    winner = win.player;
    if (winner === 1) p1Score++;
    else p2Score++;
  } else if (isBoardFull(nextBoard)) {
    winner = 'draw';
    draws++;
  }

  const nextPlayer: Player = state.currentPlayer === 1 ? 2 : 1;

  const nextState: ConnectFourState = {
    ...state,
    board: nextBoard,
    currentPlayer: nextPlayer,
    winner,
    winningLine: win,
    isAiThinking: false,
    p1Score,
    p2Score,
    draws,
    moveHistory: [...state.moveHistory, { col, player: state.currentPlayer }],
  };

  return { nextState, droppedRow: row };
}

// ==========================================
// Smart Minimax AI with Alpha-Beta Pruning
// ==========================================

function evaluateWindow(window: CellValue[], piece: Player): number {
  let score = 0;
  const oppPiece: Player = piece === 1 ? 2 : 1;

  let pieceCount = 0;
  let emptyCount = 0;
  let oppCount = 0;

  for (const cell of window) {
    if (cell === piece) pieceCount++;
    else if (cell === 0) emptyCount++;
    else if (cell === oppPiece) oppCount++;
  }

  if (pieceCount === 4) {
    score += 100000;
  } else if (pieceCount === 3 && emptyCount === 1) {
    score += 120;
  } else if (pieceCount === 2 && emptyCount === 2) {
    score += 15;
  }

  if (oppCount === 3 && emptyCount === 1) {
    score -= 150; // Block opponent's immediate winning threat
  }

  return score;
}

export function scoreBoard(board: CellValue[][], piece: Player): number {
  let score = 0;

  // Center column priority (col 3 offers highest connect potential)
  const centerArray = [];
  for (let r = 0; r < NUM_ROWS; r++) {
    centerArray.push(board[r][3]);
  }
  const centerCount = centerArray.filter((x) => x === piece).length;
  score += centerCount * 18;

  // Horizontal windows
  for (let r = 0; r < NUM_ROWS; r++) {
    for (let c = 0; c <= NUM_COLS - 4; c++) {
      const window = [board[r][c], board[r][c + 1], board[r][c + 2], board[r][c + 3]];
      score += evaluateWindow(window, piece);
    }
  }

  // Vertical windows
  for (let c = 0; c < NUM_COLS; c++) {
    for (let r = 0; r <= NUM_ROWS - 4; r++) {
      const window = [board[r][c], board[r + 1][c], board[r + 2][c], board[r + 3][c]];
      score += evaluateWindow(window, piece);
    }
  }

  // Positive slope diagonal
  for (let r = 0; r <= NUM_ROWS - 4; r++) {
    for (let c = 0; c <= NUM_COLS - 4; c++) {
      const window = [board[r][c], board[r + 1][c + 1], board[r + 2][c + 2], board[r + 3][c + 3]];
      score += evaluateWindow(window, piece);
    }
  }

  // Negative slope diagonal
  for (let r = 0; r <= NUM_ROWS - 4; r++) {
    for (let c = 3; c < NUM_COLS; c++) {
      const window = [board[r][c], board[r + 1][c - 1], board[r + 2][c - 2], board[r + 3][c - 3]];
      score += evaluateWindow(window, piece);
    }
  }

  return score;
}

function minimax(
  board: CellValue[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPiece: Player
): { column: number; score: number } {
  const oppPiece: Player = aiPiece === 1 ? 2 : 1;
  const win = checkWin(board);

  if (win) {
    if (win.player === aiPiece) return { column: -1, score: 1000000 + depth };
    else return { column: -1, score: -1000000 - depth };
  }
  if (isBoardFull(board) || depth === 0) {
    return { column: -1, score: scoreBoard(board, aiPiece) };
  }

  const validMoves = getValidMoves(board);
  // Center-first move ordering for faster alpha-beta cutoffs: [3, 2, 4, 1, 5, 0, 6]
  const centerOrder = [3, 2, 4, 1, 5, 0, 6];
  const orderedMoves = centerOrder.filter((m) => validMoves.includes(m));

  if (isMaximizing) {
    let value = -Infinity;
    let bestCol = orderedMoves[0];

    for (const col of orderedMoves) {
      const row = getLowestEmptyRow(board, col);
      board[row][col] = aiPiece;
      const res = minimax(board, depth - 1, alpha, beta, false, aiPiece);
      board[row][col] = 0; // undo

      if (res.score > value) {
        value = res.score;
        bestCol = col;
      }
      alpha = Math.max(alpha, value);
      if (alpha >= beta) break; // beta cutoff
    }
    return { column: bestCol, score: value };
  } else {
    let value = Infinity;
    let bestCol = orderedMoves[0];

    for (const col of orderedMoves) {
      const row = getLowestEmptyRow(board, col);
      board[row][col] = oppPiece;
      const res = minimax(board, depth - 1, alpha, beta, true, aiPiece);
      board[row][col] = 0; // undo

      if (res.score < value) {
        value = res.score;
        bestCol = col;
      }
      beta = Math.min(beta, value);
      if (alpha >= beta) break; // alpha cutoff
    }
    return { column: bestCol, score: value };
  }
}

/**
 * Calculates the best AI move according to the selected difficulty level.
 */
export function getBestAiMove(board: CellValue[][], difficulty: AiDifficulty, aiPiece: Player = 2): number {
  const validMoves = getValidMoves(board);
  if (validMoves.length === 0) return -1;

  const oppPiece: Player = aiPiece === 1 ? 2 : 1;

  // 1. Immediate Win Check for AI
  for (const col of validMoves) {
    const row = getLowestEmptyRow(board, col);
    board[row][col] = aiPiece;
    const win = checkWin(board);
    board[row][col] = 0;
    if (win && win.player === aiPiece) {
      return col;
    }
  }

  // 2. Immediate Block Check for Opponent's Win
  for (const col of validMoves) {
    const row = getLowestEmptyRow(board, col);
    board[row][col] = oppPiece;
    const win = checkWin(board);
    board[row][col] = 0;
    if (win && win.player === oppPiece) {
      return col;
    }
  }

  // Easy: Depth 1 with 35% chance of picking a random valid column
  if (difficulty === 'easy') {
    if (Math.random() < 0.35) {
      return validMoves[Math.floor(Math.random() * validMoves.length)];
    }
    const { column } = minimax(board, 1, -Infinity, Infinity, true, aiPiece);
    return column !== -1 ? column : validMoves[0];
  }

  // Medium: Depth 3
  if (difficulty === 'medium') {
    const { column } = minimax(board, 3, -Infinity, Infinity, true, aiPiece);
    return column !== -1 ? column : validMoves[0];
  }

  // Hard (Master Owl): Depth 5
  const { column } = minimax(board, 5, -Infinity, Infinity, true, aiPiece);
  return column !== -1 ? column : validMoves[0];
}

export function resetBoard(state: ConnectFourState): ConnectFourState {
  return {
    ...state,
    board: createEmptyBoard(),
    currentPlayer: 1,
    winner: null,
    winningLine: null,
    isAiThinking: false,
    moveHistory: [],
    hoveredCol: 3,
  };
}

import {
  Board,
  CellValue,
  FarmerReaction,
  LineClearEvent,
  Piece,
  TetrisGameState,
  TetrominoType,
} from './types';

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;
export const SILO_LINES_PER_FILL = 10;

// Standard Tetromino shapes (4 rotation states for each)
export const TETROMINOES: Record<TetrominoType, number[][][]> = {
  I: [
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    [
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
      [0, 0, 1, 0],
    ],
    [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
    ],
    [
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
      [0, 1, 0, 0],
    ],
  ],
  O: [
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
    [
      [1, 1],
      [1, 1],
    ],
  ],
  T: [
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  S: [
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 0, 0],
      [0, 1, 1],
      [1, 1, 0],
    ],
    [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 0],
    ],
  ],
  Z: [
    [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 0, 1],
      [0, 1, 1],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 1, 0],
      [1, 1, 0],
      [1, 0, 0],
    ],
  ],
  J: [
    [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [0, 0, 1],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [1, 1, 0],
    ],
  ],
  L: [
    [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 1],
    ],
    [
      [0, 0, 0],
      [1, 1, 1],
      [1, 0, 0],
    ],
    [
      [1, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
    ],
  ],
};

const ALL_TYPES: TetrominoType[] = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

/**
 * Creates an empty 20x10 board
 */
export function createEmptyBoard(): Board {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array.from({ length: BOARD_WIDTH }, () => null)
  );
}

/**
 * Generates a randomized 7-bag sequence of tetrominoes
 */
export function generateBag(): TetrominoType[] {
  const bag = [...ALL_TYPES];
  for (let i = bag.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = bag[i]!;
    bag[i] = bag[j]!;
    bag[j] = temp;
  }
  return bag;
}

/**
 * Spawns a new piece centered at the top of the board
 */
export function spawnPiece(type: TetrominoType): Piece {
  const shape = TETROMINOES[type][0]!;
  const matrixWidth = shape[0]!.length;
  const startX = Math.floor((BOARD_WIDTH - matrixWidth) / 2);
  const startY = type === 'I' ? -1 : 0;

  return {
    type,
    rotation: 0,
    x: startX,
    y: startY,
    shape,
  };
}

/**
 * Checks if a piece intersects walls, bottom floor, or existing blocks
 */
export function checkCollision(
  board: Board,
  piece: Piece,
  offsetX: number = 0,
  offsetY: number = 0,
  matrix: number[][] = piece.shape
): boolean {
  const targetX = piece.x + offsetX;
  const targetY = piece.y + offsetY;

  for (let r = 0; r < matrix.length; r++) {
    for (let c = 0; c < matrix[r]!.length; c++) {
      if (matrix[r]![c] !== 0) {
        const boardX = targetX + c;
        const boardY = targetY + r;

        // Wall bounds check
        if (boardX < 0 || boardX >= BOARD_WIDTH) {
          return true;
        }

        // Floor bounds check
        if (boardY >= BOARD_HEIGHT) {
          return true;
        }

        // Existing block collision (ignore negative rows above board)
        if (boardY >= 0 && board[boardY]![boardX] !== null) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Calculates ghost piece landing row for projection guideline
 */
export function calculateGhostY(board: Board, piece: Piece | null): number {
  if (!piece) return 0;
  let ghostY = piece.y;
  while (!checkCollision(board, piece, 0, ghostY - piece.y + 1)) {
    ghostY++;
  }
  return ghostY;
}

/**
 * Creates initial state for Farm Tetris
 */
export function createInitialState(savedHighScore: number = 0): TetrisGameState {
  const board = createEmptyBoard();
  const bag = generateBag();
  const nextBag = generateBag();
  const queue = [...bag, ...nextBag];

  const firstType = queue.shift()!;
  const currentPiece = spawnPiece(firstType);
  const ghostY = calculateGhostY(board, currentPiece);

  return {
    board,
    currentPiece,
    ghostY,
    holdPiece: null,
    canHold: true,
    nextQueue: queue.slice(0, 5),
    score: 0,
    highScore: savedHighScore,
    linesCleared: 0,
    level: 1,
    siloProgress: 0,
    siloMaxLines: SILO_LINES_PER_FILL,
    silosFilled: 0,
    lastLineClear: null,
    combo: 0,
    isGameOver: false,
    isPaused: false,
    dropInterval: 800,
  };
}

/**
 * Attempts to move current piece by (dx, dy)
 */
export function movePiece(
  state: TetrisGameState,
  dx: number,
  dy: number
): { state: TetrisGameState; moved: boolean } {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return { state, moved: false };
  }

  if (!checkCollision(state.board, state.currentPiece, dx, dy)) {
    const updatedPiece: Piece = {
      ...state.currentPiece,
      x: state.currentPiece.x + dx,
      y: state.currentPiece.y + dy,
    };
    const ghostY = calculateGhostY(state.board, updatedPiece);

    return {
      state: {
        ...state,
        currentPiece: updatedPiece,
        ghostY,
        lastLineClear: null,
      },
      moved: true,
    };
  }

  return { state, moved: false };
}

/**
 * Rotates piece with wall kick resolution
 */
export function rotatePiece(
  state: TetrisGameState,
  direction: 1 | -1 = 1
): { state: TetrisGameState; rotated: boolean } {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return { state, rotated: false };
  }

  const piece = state.currentPiece;
  const numRotations = TETROMINOES[piece.type].length;
  const newRotation = (piece.rotation + direction + numRotations) % numRotations;
  const newShape = TETROMINOES[piece.type][newRotation]!;

  // Wall kick test offsets: (0, 0), (-1, 0), (+1, 0), (-2, 0), (+2, 0), (0, -1)
  const kicks = [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 2, y: 0 },
    { x: 0, y: -1 },
    { x: -1, y: -1 },
    { x: 1, y: -1 },
  ];

  for (const kick of kicks) {
    if (!checkCollision(state.board, piece, kick.x, kick.y, newShape)) {
      const updatedPiece: Piece = {
        ...piece,
        rotation: newRotation,
        shape: newShape,
        x: piece.x + kick.x,
        y: piece.y + kick.y,
      };
      const ghostY = calculateGhostY(state.board, updatedPiece);

      return {
        state: {
          ...state,
          currentPiece: updatedPiece,
          ghostY,
          lastLineClear: null,
        },
        rotated: true,
      };
    }
  }

  return { state, rotated: false };
}

/**
 * Locks current piece into the board, checks for line clears, fills the hay silo,
 * updates score, triggers farmer reaction, and spawns the next piece.
 */
export function lockPiece(state: TetrisGameState): TetrisGameState {
  if (!state.currentPiece || state.isGameOver) return state;

  const piece = state.currentPiece;
  const newBoard: Board = state.board.map((row) => [...row]);

  // 1. Stamp piece onto board
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r]!.length; c++) {
      if (piece.shape[r]![c] !== 0) {
        const boardY = piece.y + r;
        const boardX = piece.x + c;
        if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
          newBoard[boardY]![boardX] = piece.type;
        }
      }
    }
  }

  // 2. Identify full lines
  const clearedRowIndices: number[] = [];
  for (let r = 0; r < BOARD_HEIGHT; r++) {
    if (newBoard[r]!.every((cell) => cell !== null)) {
      clearedRowIndices.push(r);
    }
  }

  const linesCount = clearedRowIndices.length;
  let newScore = state.score;
  let newCombo = state.combo;
  let lineClearEvent: LineClearEvent | null = null;
  let newSiloProgress = state.siloProgress;
  let newSilosFilled = state.silosFilled;
  let newLevel = state.level;
  let newLinesCleared = state.linesCleared + linesCount;

  // 3. Clear lines & compute Silo + Farmer reaction
  if (linesCount > 0) {
    newCombo += 1;

    // Standard scoring scaled by level + combo bonus
    const baseScores = [0, 100, 300, 500, 800];
    const gained = (baseScores[linesCount] || 100) * state.level + newCombo * 50;
    newScore += gained;

    // Collapse board rows
    const remainingRows = newBoard.filter((_, idx) => !clearedRowIndices.includes(idx));
    const emptyRowsToAdd = Array.from({ length: linesCount }, () =>
      Array.from({ length: BOARD_WIDTH }, () => null)
    );
    const collapsedBoard: Board = [...emptyRowsToAdd, ...remainingRows];

    // Silo Hay fill progress
    const progressBefore = state.siloProgress;
    const progressAdd = (linesCount / state.siloMaxLines) * 100;
    let totalProgress = progressBefore + progressAdd;
    let siloCompleted = false;

    while (totalProgress >= 100) {
      totalProgress -= 100;
      newSilosFilled += 1;
      newLevel += 1;
      siloCompleted = true;
    }
    newSiloProgress = Math.round(totalProgress * 10) / 10;

    // Cute Farmer Reaction based on line clear count
    let reaction: FarmerReaction;
    if (linesCount >= 4) {
      reaction = {
        type: 'super_wow',
        text: 'SUPER HARVEST! 🌾🌟',
        lines: 4,
        timestamp: Date.now(),
      };
    } else if (linesCount === 3) {
      reaction = {
        type: 'cheer',
        text: 'AWESOME! 🌽',
        lines: 3,
        timestamp: Date.now(),
      };
    } else if (linesCount === 2) {
      reaction = {
        type: 'thumbs_up',
        text: 'GREAT! 🚜',
        lines: 2,
        timestamp: Date.now(),
      };
    } else {
      reaction = {
        type: 'wave',
        text: 'WOW! 🌾',
        lines: 1,
        timestamp: Date.now(),
      };
    }

    lineClearEvent = {
      rows: clearedRowIndices,
      linesCount,
      scoreGained: gained,
      siloProgressBefore: progressBefore,
      siloProgressAfter: newSiloProgress,
      siloCompleted,
      farmerReaction: reaction,
    };

    newBoard.splice(0, newBoard.length, ...collapsedBoard);
  } else {
    newCombo = 0;
  }

  // 4. Replenish next queue
  let nextQueue = [...state.nextQueue];
  if (nextQueue.length < 5) {
    nextQueue = [...nextQueue, ...generateBag()];
  }
  const nextType = nextQueue.shift()!;
  const nextPiece = spawnPiece(nextType);

  // Check Game Over (spawn collision)
  const isGameOver = checkCollision(newBoard, nextPiece);
  const ghostY = calculateGhostY(newBoard, nextPiece);

  // Recalculate drop interval based on level (speed progression)
  const newDropInterval = Math.max(90, 800 - (newLevel - 1) * 65);

  return {
    ...state,
    board: newBoard,
    currentPiece: isGameOver ? null : nextPiece,
    ghostY: isGameOver ? 0 : ghostY,
    canHold: true,
    nextQueue,
    score: newScore,
    highScore: Math.max(state.highScore, newScore),
    linesCleared: newLinesCleared,
    level: newLevel,
    siloProgress: newSiloProgress,
    silosFilled: newSilosFilled,
    lastLineClear: lineClearEvent,
    combo: newCombo,
    isGameOver,
    dropInterval: newDropInterval,
  };
}

/**
 * Hard drop: instantly drops piece to ghost row and locks
 */
export function hardDrop(state: TetrisGameState): TetrisGameState {
  if (!state.currentPiece || state.isGameOver || state.isPaused) return state;

  const dropDistance = state.ghostY - state.currentPiece.y;
  const hardDroppedPiece: Piece = {
    ...state.currentPiece,
    y: state.ghostY,
  };

  // Add bonus points for hard drop distance
  const dropBonus = dropDistance * 2;
  const stateWithDroppedPiece: TetrisGameState = {
    ...state,
    currentPiece: hardDroppedPiece,
    score: state.score + dropBonus,
  };

  return lockPiece(stateWithDroppedPiece);
}

/**
 * Soft drop: moves piece down 1 row, or locks if blocked.
 * Returns both the updated state and whether the piece locked into the board.
 */
export function softDrop(
  state: TetrisGameState,
  isManualSoftDrop: boolean = false
): { state: TetrisGameState; locked: boolean } {
  if (!state.currentPiece || state.isGameOver || state.isPaused) {
    return { state, locked: false };
  }

  const moveRes = movePiece(state, 0, 1);
  if (moveRes.moved) {
    return {
      state: {
        ...moveRes.state,
        score: isManualSoftDrop ? moveRes.state.score + 1 : moveRes.state.score,
        lastLineClear: null,
      },
      locked: false,
    };
  }

  // Hit bottom / obstacle -> lock
  const lockedState = lockPiece(state);
  return {
    state: lockedState,
    locked: true,
  };
}

/**
 * Hold piece: swaps current piece into hold slot
 */
export function holdPieceAction(state: TetrisGameState): TetrisGameState {
  if (!state.currentPiece || !state.canHold || state.isGameOver || state.isPaused) {
    return state;
  }

  const currentType = state.currentPiece.type;
  let nextQueue = [...state.nextQueue];
  let newCurrentType: TetrominoType;

  if (state.holdPiece) {
    newCurrentType = state.holdPiece;
  } else {
    if (nextQueue.length < 5) {
      nextQueue = [...nextQueue, ...generateBag()];
    }
    newCurrentType = nextQueue.shift()!;
  }

  const newPiece = spawnPiece(newCurrentType);
  const ghostY = calculateGhostY(state.board, newPiece);

  return {
    ...state,
    holdPiece: currentType,
    canHold: false,
    currentPiece: newPiece,
    ghostY,
    nextQueue,
    lastLineClear: null,
  };
}

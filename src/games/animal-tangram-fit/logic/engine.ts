import {
  TangramState,
  TangramEvent,
  TangramPiece,
  StageConfig,
  SilhouetteCell,
  WoodColor,
} from './types';

export const STAGE_CONFIGS: StageConfig[] = [
  {
    stage: 1,
    title: 'Rooster Silhouette',
    animalName: 'Clucky the Rooster',
    animalMascot: '🐓',
    gridRows: 6,
    gridCols: 6,
    // Solution layout:
    // p1 at (0, 1): (0,1), (0,2), (0,3), (1,2) [4 cells]
    // p2 at (1, 0): (1,0), (2,0), (3,0), (3,1) [4 cells]
    // p3 at (2, 2): (2,2), (2,3), (3,2), (3,3) [4 cells]
    // p4 at (4, 1): (4,1), (4,2), (4,3), (5,2) [4 cells]
    // Total 16 cells
    targetCells: [
      { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
      { row: 1, col: 0 }, { row: 1, col: 2 },
      { row: 2, col: 0 }, { row: 2, col: 2 }, { row: 2, col: 3 },
      { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 },
      { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 3 },
      { row: 5, col: 2 },
    ],
    pieces: [
      {
        id: 'r-head-t',
        name: 'Comb Crest',
        color: 'cherry',
        shape: [
          [1, 1, 1],
          [0, 1, 0],
        ],
      },
      {
        id: 'r-neck-l',
        name: 'Beak & Throat',
        color: 'oak',
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
      },
      {
        id: 'r-body-sq',
        name: 'Plump Body',
        color: 'walnut',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'r-feet-t',
        name: 'Perch Stand',
        color: 'pine',
        shape: [
          [1, 1, 1],
          [0, 1, 0],
        ],
      },
    ],
  },
  {
    stage: 2,
    title: 'Puppy Silhouette',
    animalName: 'Buster the Puppy',
    animalMascot: '🐶',
    gridRows: 6,
    gridCols: 6,
    // Solution layout:
    // p1 at (0, 1): (0,1), (0,2), (1,1), (1,2) [Square, 4 cells]
    // p2 at (0, 3): (0,3), (1,3), (2,3) [Bar-3, 3 cells]
    // p3 at (2, 0): (2,0), (2,1), (2,2) [Bar-3, 3 cells]
    // p4 at (3, 1): (3,1), (4,1), (5,1), (5,2) [L-4, 4 cells]
    // p5 at (3, 2): (3,2), (3,3), (4,3), (5,3) [L-4, 4 cells]
    // p6 at (1, 0): (1,0), (1,1)? Wait: at (4, 4): (3,4), (4,4) [Domino-2, 2 cells]
    // Total 20 cells:
    // (0,1),(0,2),(0,3),(1,1),(1,2),(1,3),(2,0),(2,1),(2,2),(2,3),(3,1),(3,2),(3,3),(3,4),(4,1),(4,3),(4,4),(5,1),(5,2),(5,3)
    targetCells: [
      { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
      { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
      { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
      { row: 4, col: 1 }, { row: 4, col: 3 }, { row: 4, col: 4 },
      { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 3 },
    ],
    pieces: [
      {
        id: 'p-ears-sq',
        name: 'Puppy Face',
        color: 'walnut',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'p-snout-bar',
        name: 'Snout Bar',
        color: 'cherry',
        shape: [
          [1],
          [1],
          [1],
        ],
      },
      {
        id: 'p-collar-bar',
        name: 'Collar Strip',
        color: 'mahogany',
        shape: [
          [1, 1, 1],
        ],
      },
      {
        id: 'p-front-l',
        name: 'Front Paws',
        color: 'oak',
        shape: [
          [1, 0],
          [1, 0],
          [1, 1],
        ],
      },
      {
        id: 'p-hind-l',
        name: 'Hind Legs',
        color: 'pine',
        shape: [
          [1, 1],
          [0, 1],
          [0, 1],
        ],
      },
      {
        id: 'p-tail-dom',
        name: 'Wagging Tail',
        color: 'cherry',
        shape: [
          [1],
          [1],
        ],
      },
    ],
  },
  {
    stage: 3,
    title: 'Lamb Silhouette',
    animalName: 'Daisy the Meadow Lamb',
    animalMascot: '🐑',
    gridRows: 6,
    gridCols: 6,
    // Solution layout:
    // p1 at (0, 0): (0,0), (0,1), (1,0), (1,1) [Square, 4 cells]
    // p2 at (0, 2): (0,2), (0,3), (1,2), (1,3) [Square, 4 cells]
    // p3 at (2, 0): (2,0), (2,1), (2,2), (2,3) [Bar-4, 4 cells]
    // p4 at (3, 1): (3,1), (3,2), (3,3), (3,4) [Bar-4, 4 cells]
    // p5 at (4, 0): (4,0), (5,0), (4,1), (5,1) [Square, 4 cells]
    // p6 at (4, 3): (4,3), (5,3), (4,4), (5,4) [Square, 4 cells]
    // Total 24 cells
    targetCells: [
      { row: 0, col: 0 }, { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 },
      { row: 1, col: 0 }, { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 },
      { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 },
      { row: 4, col: 0 }, { row: 4, col: 1 }, { row: 4, col: 3 }, { row: 4, col: 4 },
      { row: 5, col: 0 }, { row: 5, col: 1 }, { row: 5, col: 3 }, { row: 5, col: 4 },
    ],
    pieces: [
      {
        id: 'l-wool-top1',
        name: 'Wool Tuft A',
        color: 'pine',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'l-wool-top2',
        name: 'Wool Tuft B',
        color: 'oak',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'l-back-bar',
        name: 'Fleece Spine',
        color: 'cherry',
        shape: [
          [1, 1, 1, 1],
        ],
      },
      {
        id: 'l-belly-bar',
        name: 'Fleece Belly',
        color: 'walnut',
        shape: [
          [1, 1, 1, 1],
        ],
      },
      {
        id: 'l-front-feet',
        name: 'Front Hooves',
        color: 'mahogany',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'l-back-feet',
        name: 'Rear Hooves',
        color: 'cherry',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
    ],
  },
  {
    stage: 4,
    title: 'Cow Silhouette',
    animalName: 'Bessie the Dairy Cow',
    animalMascot: '🐮',
    gridRows: 7,
    gridCols: 7,
    // Solution layout:
    // p1 at (0, 1): (0,1), (0,2), (1,1), (1,2) [Square, 4 cells]
    // p2 at (0, 3): (0,3), (0,4), (1,3), (1,4) [Square, 4 cells]
    // p3 at (2, 0): (2,0), (2,1), (2,2), (2,3) [Bar-4, 4 cells]
    // p4 at (2, 4): (2,4), (2,5), (3,4), (3,5) [Square, 4 cells]
    // p5 at (3, 0): (3,0), (3,1), (3,2), (3,3) [Bar-4, 4 cells]
    // p6 at (4, 1): (4,1), (4,2), (5,1), (5,2) [Square, 4 cells]
    // p7 at (4, 4): (4,4), (4,5), (5,4), (5,5) [Square, 4 cells]
    // Total 28 cells
    targetCells: [
      { row: 0, col: 1 }, { row: 0, col: 2 }, { row: 0, col: 3 }, { row: 0, col: 4 },
      { row: 1, col: 1 }, { row: 1, col: 2 }, { row: 1, col: 3 }, { row: 1, col: 4 },
      { row: 2, col: 0 }, { row: 2, col: 1 }, { row: 2, col: 2 }, { row: 2, col: 3 }, { row: 2, col: 4 }, { row: 2, col: 5 },
      { row: 3, col: 0 }, { row: 3, col: 1 }, { row: 3, col: 2 }, { row: 3, col: 3 }, { row: 3, col: 4 }, { row: 3, col: 5 },
      { row: 4, col: 1 }, { row: 4, col: 2 }, { row: 4, col: 4 }, { row: 4, col: 5 },
      { row: 5, col: 1 }, { row: 5, col: 2 }, { row: 5, col: 4 }, { row: 5, col: 5 },
    ],
    pieces: [
      {
        id: 'c-horn-l',
        name: 'Left Horn',
        color: 'pine',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'c-horn-r',
        name: 'Right Horn',
        color: 'oak',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'c-spine',
        name: 'Upper Back',
        color: 'cherry',
        shape: [
          [1, 1, 1, 1],
        ],
      },
      {
        id: 'c-belly',
        name: 'Lower Flank',
        color: 'walnut',
        shape: [
          [1, 1, 1, 1],
        ],
      },
      {
        id: 'c-tail-rump',
        name: 'Spotted Rump',
        color: 'mahogany',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'c-front-legs',
        name: 'Front Stanchion',
        color: 'cherry',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
      {
        id: 'c-rear-legs',
        name: 'Rear Stanchion',
        color: 'oak',
        shape: [
          [1, 1],
          [1, 1],
        ],
      },
    ],
  },
];

export function rotateMatrix(matrix: number[][]): number[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: number[][] = [];
  for (let c = 0; c < cols; c++) {
    rotated[c] = [];
    for (let r = rows - 1; r >= 0; r--) {
      rotated[c].push(matrix[r][c]);
    }
  }
  return rotated;
}

export function createStageState(stageNum: number, currentScore: number = 0, highScore: number = 0): TangramState {
  const stageIdx = Math.max(0, Math.min(STAGE_CONFIGS.length - 1, stageNum - 1));
  const config = STAGE_CONFIGS[stageIdx];

  const boardGrid: (string | null)[][] = Array.from({ length: config.gridRows }, () =>
    Array(config.gridCols).fill(null)
  );

  const targetMask: boolean[][] = Array.from({ length: config.gridRows }, () =>
    Array(config.gridCols).fill(false)
  );

  for (const cell of config.targetCells) {
    if (cell.row < config.gridRows && cell.col < config.gridCols) {
      targetMask[cell.row][cell.col] = true;
    }
  }

  const pieces: TangramPiece[] = config.pieces.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
    shape: p.shape.map((row) => [...row]),
    placedRow: null,
    placedCol: null,
  }));

  return {
    status: 'ready',
    stage: config.stage,
    totalStages: STAGE_CONFIGS.length,
    score: currentScore,
    selectedPieceId: null,
    pieces,
    boardGrid,
    targetMask,
    totalTargetCells: config.targetCells.length,
    filledTargetCells: 0,
    highScore: Math.max(highScore, currentScore),
  };
}

export function createInitialState(savedHighScore: number = 0): TangramState {
  return createStageState(1, 0, savedHighScore);
}

export function selectPiece(state: TangramState, pieceId: string | null): { state: TangramState; event?: TangramEvent } {
  if (state.selectedPieceId === pieceId) {
    return { state: { ...state, selectedPieceId: null } };
  }
  return {
    state: { ...state, selectedPieceId: pieceId },
    event: pieceId ? { type: 'piece_selected', pieceId } : undefined,
  };
}

export function rotatePiece(state: TangramState, pieceId: string): { state: TangramState; event?: TangramEvent } {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) return { state };

  const rotatedShape = rotateMatrix(piece.shape);

  // If piece is placed, check if rotated shape still fits
  if (piece.placedRow !== null && piece.placedCol !== null) {
    // Can only rotate in place if valid
    const canPlace = canPlacePiece(
      state.boardGrid,
      state.targetMask,
      rotatedShape,
      piece.placedRow,
      piece.placedCol,
      piece.id
    );
    if (!canPlace) {
      return { state }; // cannot rotate placed piece into invalid spot
    }

    // Re-place with rotated shape
    const newBoard = state.boardGrid.map((row) => [...row]);
    // Clear old placement
    clearPieceFromBoard(newBoard, piece.id);
    // Apply new placement
    applyPieceToBoard(newBoard, rotatedShape, piece.placedRow, piece.placedCol, piece.id);

    const updatedPieces = state.pieces.map((p) =>
      p.id === pieceId ? { ...p, shape: rotatedShape } : p
    );

    return {
      state: {
        ...state,
        pieces: updatedPieces,
        boardGrid: newBoard,
      },
      event: { type: 'piece_rotated', pieceId },
    };
  }

  // If piece is in tray, simply rotate shape
  const updatedPieces = state.pieces.map((p) =>
    p.id === pieceId ? { ...p, shape: rotatedShape } : p
  );

  return {
    state: {
      ...state,
      pieces: updatedPieces,
    },
    event: { type: 'piece_rotated', pieceId },
  };
}

export function canPlacePiece(
  boardGrid: (string | null)[][],
  targetMask: boolean[][],
  shape: number[][],
  startRow: number,
  startCol: number,
  ignorePieceId?: string
): boolean {
  const gridRows = boardGrid.length;
  const gridCols = boardGrid[0].length;
  const pRows = shape.length;
  const pCols = shape[0].length;

  for (let r = 0; r < pRows; r++) {
    for (let c = 0; c < pCols; c++) {
      if (shape[r][c] === 1) {
        const boardR = startRow + r;
        const boardC = startCol + c;

        // Must stay inside board boundaries
        if (boardR < 0 || boardR >= gridRows || boardC < 0 || boardC >= gridCols) {
          return false;
        }

        // Must be placed strictly within the animal silhouette target mask
        if (!targetMask[boardR][boardC]) {
          return false;
        }

        // Must not overlap another piece
        const existingPiece = boardGrid[boardR][boardC];
        if (existingPiece !== null && existingPiece !== ignorePieceId) {
          return false;
        }
      }
    }
  }

  return true;
}

function clearPieceFromBoard(boardGrid: (string | null)[][], pieceId: string): void {
  for (let r = 0; r < boardGrid.length; r++) {
    for (let c = 0; c < boardGrid[0].length; c++) {
      if (boardGrid[r][c] === pieceId) {
        boardGrid[r][c] = null;
      }
    }
  }
}

function applyPieceToBoard(
  boardGrid: (string | null)[][],
  shape: number[][],
  startRow: number,
  startCol: number,
  pieceId: string
): void {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[0].length; c++) {
      if (shape[r][c] === 1) {
        boardGrid[startRow + r][startCol + c] = pieceId;
      }
    }
  }
}

export function placePiece(
  state: TangramState,
  pieceId: string,
  targetRow: number,
  targetCol: number
): { state: TangramState; events: TangramEvent[] } {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece) return { state, events: [] };

  const valid = canPlacePiece(
    state.boardGrid,
    state.targetMask,
    piece.shape,
    targetRow,
    targetCol,
    piece.id
  );

  if (!valid) {
    return { state, events: [] };
  }

  const newBoard = state.boardGrid.map((row) => [...row]);
  clearPieceFromBoard(newBoard, piece.id);
  applyPieceToBoard(newBoard, piece.shape, targetRow, targetCol, piece.id);

  const updatedPieces = state.pieces.map((p) =>
    p.id === pieceId ? { ...p, placedRow: targetRow, placedCol: targetCol } : p
  );

  // Count filled target cells
  let filledCells = 0;
  for (let r = 0; r < newBoard.length; r++) {
    for (let c = 0; c < newBoard[0].length; c++) {
      if (state.targetMask[r][c] && newBoard[r][c] !== null) {
        filledCells++;
      }
    }
  }

  const events: TangramEvent[] = [
    { type: 'piece_placed', pieceId, row: targetRow, col: targetCol },
  ];

  let nextStatus = state.status;
  let nextScore = state.score + 50; // 50 pts per piece placed

  // Check victory / stage complete
  if (filledCells === state.totalTargetCells) {
    const config = STAGE_CONFIGS[state.stage - 1];
    nextScore += 500; // Stage clear bonus
    if (state.stage >= state.totalStages) {
      nextStatus = 'victory';
      events.push({ type: 'victory', finalScore: nextScore });
    } else {
      nextStatus = 'stage_cleared';
      events.push({ type: 'stage_clear', stage: state.stage, animalName: config.animalName });
    }
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      selectedPieceId: null, // Deselect after placement
      pieces: updatedPieces,
      boardGrid: newBoard,
      filledTargetCells: filledCells,
      highScore: Math.max(state.highScore, nextScore),
    },
    events,
  };
}

export function removePieceToTray(
  state: TangramState,
  pieceId: string
): { state: TangramState; event?: TangramEvent } {
  const piece = state.pieces.find((p) => p.id === pieceId);
  if (!piece || piece.placedRow === null) return { state };

  const newBoard = state.boardGrid.map((row) => [...row]);
  clearPieceFromBoard(newBoard, piece.id);

  const updatedPieces = state.pieces.map((p) =>
    p.id === pieceId ? { ...p, placedRow: null, placedCol: null } : p
  );

  let filledCells = 0;
  for (let r = 0; r < newBoard.length; r++) {
    for (let c = 0; c < newBoard[0].length; c++) {
      if (state.targetMask[r][c] && newBoard[r][c] !== null) {
        filledCells++;
      }
    }
  }

  return {
    state: {
      ...state,
      pieces: updatedPieces,
      boardGrid: newBoard,
      filledTargetCells: filledCells,
    },
    event: { type: 'piece_removed', pieceId },
  };
}

export function nextStage(state: TangramState): TangramState {
  if (state.stage >= state.totalStages) {
    return state;
  }
  return createStageState(state.stage + 1, state.score, state.highScore);
}

export function resetStage(state: TangramState): TangramState {
  return createStageState(state.stage, state.score, state.highScore);
}

export function restartGame(state: TangramState): TangramState {
  return createStageState(1, 0, state.highScore);
}

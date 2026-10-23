// Pure TypeScript Game Logic Engine for Farm Block Blast (Barnyard Grid)

export type Grid = number[][]; // 8x8 matrix (0 = empty, 1-6 = block styles)

export interface PieceShape {
  id: string;
  name: string;
  matrix: boolean[][]; // [row][col]
  width: number;
  height: number;
  cellCount: number;
  colorIndex: number; // 1: wood, 2: pumpkin, 3: corn, 4: apple, 5: berry, 6: lettuce
}

export interface PlacedCell {
  row: number;
  col: number;
  colorIndex: number;
}

export interface GameState {
  grid: Grid;
  score: number;
  bestScore: number;
  combo: number;
  maxCombo: number;
  linesClearedTotal: number;
  availablePieces: (PieceShape | null)[]; // 3 slots in the barn hand
  isGameOver: boolean;
  lastClearInfo: {
    rows: number[];
    cols: number[];
    points: number;
    combo: number;
  } | null;
}

export const GRID_SIZE = 8;

export const SHAPES_DEFINITIONS: Omit<PieceShape, 'colorIndex'>[] = [
  // 1x1 Dot
  { id: 'dot', name: 'Single Crate', matrix: [[true]], width: 1, height: 1, cellCount: 1 },

  // 1x2 and 2x1
  { id: 'h2', name: 'Horizontal 2', matrix: [[true, true]], width: 2, height: 1, cellCount: 2 },
  { id: 'v2', name: 'Vertical 2', matrix: [[true], [true]], width: 1, height: 2, cellCount: 2 },

  // 1x3 and 3x1
  { id: 'h3', name: 'Horizontal 3', matrix: [[true, true, true]], width: 3, height: 1, cellCount: 3 },
  { id: 'v3', name: 'Vertical 3', matrix: [[true], [true], [true]], width: 1, height: 3, cellCount: 3 },

  // 1x4 and 4x1
  { id: 'h4', name: 'Horizontal 4', matrix: [[true, true, true, true]], width: 4, height: 1, cellCount: 4 },
  { id: 'v4', name: 'Vertical 4', matrix: [[true], [true], [true], [true]], width: 1, height: 4, cellCount: 4 },

  // 1x5 and 5x1
  { id: 'h5', name: 'Horizontal 5', matrix: [[true, true, true, true, true]], width: 5, height: 1, cellCount: 5 },
  { id: 'v5', name: 'Vertical 5', matrix: [[true], [true], [true], [true], [true]], width: 1, height: 5, cellCount: 5 },

  // 2x2 Square
  {
    id: 'sq2',
    name: '2x2 Hay Bale',
    matrix: [
      [true, true],
      [true, true],
    ],
    width: 2,
    height: 2,
    cellCount: 4,
  },

  // 3x3 Square
  {
    id: 'sq3',
    name: '3x3 Granary',
    matrix: [
      [true, true, true],
      [true, true, true],
      [true, true, true],
    ],
    width: 3,
    height: 3,
    cellCount: 9,
  },

  // L-Shapes (2x2)
  {
    id: 'l2_1',
    name: 'L-2 A',
    matrix: [
      [true, false],
      [true, true],
    ],
    width: 2,
    height: 2,
    cellCount: 3,
  },
  {
    id: 'l2_2',
    name: 'L-2 B',
    matrix: [
      [false, true],
      [true, true],
    ],
    width: 2,
    height: 2,
    cellCount: 3,
  },
  {
    id: 'l2_3',
    name: 'L-2 C',
    matrix: [
      [true, true],
      [true, false],
    ],
    width: 2,
    height: 2,
    cellCount: 3,
  },
  {
    id: 'l2_4',
    name: 'L-2 D',
    matrix: [
      [true, true],
      [false, true],
    ],
    width: 2,
    height: 2,
    cellCount: 3,
  },

  // L-Shapes (3x3 Corner)
  {
    id: 'l3_1',
    name: 'Corner 3 A',
    matrix: [
      [true, false, false],
      [true, false, false],
      [true, true, true],
    ],
    width: 3,
    height: 3,
    cellCount: 5,
  },
  {
    id: 'l3_2',
    name: 'Corner 3 B',
    matrix: [
      [false, false, true],
      [false, false, true],
      [true, true, true],
    ],
    width: 3,
    height: 3,
    cellCount: 5,
  },
  {
    id: 'l3_3',
    name: 'Corner 3 C',
    matrix: [
      [true, true, true],
      [true, false, false],
      [true, false, false],
    ],
    width: 3,
    height: 3,
    cellCount: 5,
  },
  {
    id: 'l3_4',
    name: 'Corner 3 D',
    matrix: [
      [true, true, true],
      [false, false, true],
      [false, false, true],
    ],
    width: 3,
    height: 3,
    cellCount: 5,
  },

  // T-Shapes
  {
    id: 't1',
    name: 'T-Shape Up',
    matrix: [
      [false, true, false],
      [true, true, true],
    ],
    width: 3,
    height: 2,
    cellCount: 4,
  },
  {
    id: 't2',
    name: 'T-Shape Down',
    matrix: [
      [true, true, true],
      [false, true, false],
    ],
    width: 3,
    height: 2,
    cellCount: 4,
  },

  // Z-Shapes
  {
    id: 'z1',
    name: 'Z-Shape',
    matrix: [
      [true, true, false],
      [false, true, true],
    ],
    width: 3,
    height: 2,
    cellCount: 4,
  },
  {
    id: 'z2',
    name: 'S-Shape',
    matrix: [
      [false, true, true],
      [true, true, false],
    ],
    width: 3,
    height: 2,
    cellCount: 4,
  },

  // Plus / Cross
  {
    id: 'plus',
    name: 'Farm Cross',
    matrix: [
      [false, true, false],
      [true, true, true],
      [false, true, false],
    ],
    width: 3,
    height: 3,
    cellCount: 5,
  },
];

export function createEmptyGrid(): Grid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

export function generateRandomPiece(): PieceShape {
  const def = SHAPES_DEFINITIONS[Math.floor(Math.random() * SHAPES_DEFINITIONS.length)]!;
  // Random color from 1 to 6
  const colorIndex = Math.floor(Math.random() * 6) + 1;
  return {
    ...def,
    colorIndex,
  };
}

export function generateBatchOf3Pieces(): PieceShape[] {
  return [generateRandomPiece(), generateRandomPiece(), generateRandomPiece()];
}

export function createInitialGameState(savedBest = 0): GameState {
  const grid = createEmptyGrid();
  const pieces = generateBatchOf3Pieces();

  return {
    grid,
    score: 0,
    bestScore: savedBest,
    combo: 0,
    maxCombo: 0,
    linesClearedTotal: 0,
    availablePieces: pieces,
    isGameOver: false,
    lastClearInfo: null,
  };
}

export function canPlacePiece(
  grid: Grid,
  piece: PieceShape,
  targetRow: number,
  targetCol: number
): boolean {
  for (let r = 0; r < piece.height; r++) {
    for (let c = 0; c < piece.width; c++) {
      if (piece.matrix[r]![c]) {
        const boardR = targetRow + r;
        const boardC = targetCol + c;

        // Out of board bounds
        if (boardR < 0 || boardR >= GRID_SIZE || boardC < 0 || boardC >= GRID_SIZE) {
          return false;
        }

        // Cell is already occupied
        if (grid[boardR]![boardC] !== 0) {
          return false;
        }
      }
    }
  }

  return true;
}

export function canPieceFitAnywhere(grid: Grid, piece: PieceShape): boolean {
  for (let r = 0; r <= GRID_SIZE - piece.height; r++) {
    for (let c = 0; c <= GRID_SIZE - piece.width; c++) {
      if (canPlacePiece(grid, piece, r, c)) {
        return true;
      }
    }
  }
  return false;
}

export function checkGameOver(grid: Grid, availablePieces: (PieceShape | null)[]): boolean {
  const remainingPieces = availablePieces.filter((p): p is PieceShape => p !== null);
  if (remainingPieces.length === 0) return false;

  for (const piece of remainingPieces) {
    if (canPieceFitAnywhere(grid, piece)) {
      return false; // At least one piece fits!
    }
  }

  return true; // No piece fits anywhere!
}

export interface PlaceResult {
  state: GameState;
  success: boolean;
  clearedRows: number[];
  clearedCols: number[];
  pointsEarned: number;
  comboStreak: number;
  message?: string;
}

export function placePiece(
  state: GameState,
  pieceIndex: number,
  targetRow: number,
  targetCol: number
): PlaceResult {
  if (state.isGameOver) {
    return {
      state,
      success: false,
      clearedRows: [],
      clearedCols: [],
      pointsEarned: 0,
      comboStreak: state.combo,
      message: 'Game is over',
    };
  }

  const piece = state.availablePieces[pieceIndex];
  if (!piece) {
    return {
      state,
      success: false,
      clearedRows: [],
      clearedCols: [],
      pointsEarned: 0,
      comboStreak: state.combo,
      message: 'Piece already used',
    };
  }

  if (!canPlacePiece(state.grid, piece, targetRow, targetCol)) {
    return {
      state,
      success: false,
      clearedRows: [],
      clearedCols: [],
      pointsEarned: 0,
      comboStreak: state.combo,
      message: 'Piece does not fit at this position',
    };
  }

  // 1. Stamp piece onto a new grid copy
  const nextGrid = state.grid.map((row) => [...row]);
  for (let r = 0; r < piece.height; r++) {
    for (let c = 0; c < piece.width; c++) {
      if (piece.matrix[r]![c]) {
        nextGrid[targetRow + r]![targetCol + c] = piece.colorIndex;
      }
    }
  }

  // 2. Identify full rows and full columns
  const fullRows: number[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    if (nextGrid[r]!.every((cell) => cell !== 0)) {
      fullRows.push(r);
    }
  }

  const fullCols: number[] = [];
  for (let c = 0; c < GRID_SIZE; c++) {
    let colFull = true;
    for (let r = 0; r < GRID_SIZE; r++) {
      if (nextGrid[r]![c] === 0) {
        colFull = false;
        break;
      }
    }
    if (colFull) {
      fullCols.push(c);
    }
  }

  // 3. Clear identified lines from grid
  for (const r of fullRows) {
    for (let c = 0; c < GRID_SIZE; c++) {
      nextGrid[r]![c] = 0;
    }
  }
  for (const c of fullCols) {
    for (let r = 0; r < GRID_SIZE; r++) {
      nextGrid[r]![c] = 0;
    }
  }

  // 4. Calculate Scores & Combo
  const placementPoints = piece.cellCount * 1;
  const linesCleared = fullRows.length + fullCols.length;
  let clearPoints = 0;
  let nextCombo = 0;

  if (linesCleared > 0) {
    nextCombo = state.combo + 1;
    // Base points: 100 for 1 line, 300 for 2, 600 for 3, 1000 for 4+
    const lineBase =
      linesCleared === 1
        ? 100
        : linesCleared === 2
        ? 300
        : linesCleared === 3
        ? 600
        : 1000 + (linesCleared - 4) * 400;

    // Combo streak bonus
    const comboBonus = nextCombo > 1 ? (nextCombo - 1) * 80 : 0;
    clearPoints = lineBase + comboBonus;
  } else {
    // Reset combo if move produced no line clear
    nextCombo = 0;
  }

  const totalPointsEarned = placementPoints + clearPoints;
  const nextScore = state.score + totalPointsEarned;
  const nextBestScore = Math.max(state.bestScore, nextScore);

  // 5. Update Pieces in Hand
  const nextPieces = [...state.availablePieces];
  nextPieces[pieceIndex] = null;

  // If all 3 pieces are consumed, deal fresh 3 pieces
  const allUsed = nextPieces.every((p) => p === null);
  const finalPieces = allUsed ? generateBatchOf3Pieces() : nextPieces;

  // 6. Check Game Over
  const isOver = checkGameOver(nextGrid, finalPieces);

  const nextState: GameState = {
    grid: nextGrid,
    score: nextScore,
    bestScore: nextBestScore,
    combo: nextCombo,
    maxCombo: Math.max(state.maxCombo, nextCombo),
    linesClearedTotal: state.linesClearedTotal + linesCleared,
    availablePieces: finalPieces,
    isGameOver: isOver,
    lastClearInfo:
      linesCleared > 0
        ? {
            rows: fullRows,
            cols: fullCols,
            points: totalPointsEarned,
            combo: nextCombo,
          }
        : null,
  };

  return {
    state: nextState,
    success: true,
    clearedRows: fullRows,
    clearedCols: fullCols,
    pointsEarned: totalPointsEarned,
    comboStreak: nextCombo,
  };
}

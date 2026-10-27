export type DuckColor = 'yellow' | 'white' | 'pink' | 'blue' | 'green';

export interface PondColumn {
  id: string;
  ducks: DuckColor[]; // bottom to top
  maxCapacity: number;
}

export interface MoveAction {
  fromIndex: number;
  toIndex: number;
  ducksMoved: DuckColor[];
}

export interface DuckPondSortState {
  columns: PondColumn[];
  selectedColumnIndex: number | null;
  moveHistory: MoveAction[];
  level: number;
  score: number;
  highScore: number;
  isWon: boolean;
  movesCount: number;
}

export const DUCK_COLORS: DuckColor[] = ['yellow', 'white', 'pink', 'blue', 'green'];

export const DUCK_COLOR_META: Record<DuckColor, { name: string; hex: string; emoji: string }> = {
  yellow: { name: 'Sunny Yellow', hex: '#facc15', emoji: '🐥' },
  white: { name: 'Feather White', hex: '#f8fafc', emoji: '🦆' },
  pink: { name: 'Rosy Pink', hex: '#f472b6', emoji: '🪿' },
  blue: { name: 'Splash Blue', hex: '#38bdf8', emoji: '🌊' },
  green: { name: 'Mallard Green', hex: '#22c55e', emoji: '🌿' },
};

export const MAX_CAPACITY = 4;

export function createInitialPondSortState(level: number = 1, highScore: number = 0): DuckPondSortState {
  const columns = generatePondLevel(level);

  return {
    columns,
    selectedColumnIndex: null,
    moveHistory: [],
    level,
    score: 0,
    highScore,
    isWon: false,
    movesCount: 0,
  };
}

export function generatePondLevel(level: number): PondColumn[] {
  // Determine number of colors based on level
  const numColors = Math.min(5, 3 + Math.floor((level - 1) / 3)); // 3 colors at L1-3, 4 at L4-6, 5 at L7+
  const activeColors = DUCK_COLORS.slice(0, numColors);

  // Pool of ducks: each active color has 4 ducks
  const duckPool: DuckColor[] = [];
  for (const color of activeColors) {
    for (let i = 0; i < MAX_CAPACITY; i++) {
      duckPool.push(color);
    }
  }

  // Shuffle pool with deterministic pseudo-random seed based on level
  let seed = level * 1337 + 42;
  const pseudoRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  for (let i = duckPool.length - 1; i > 0; i--) {
    const j = Math.floor(pseudoRandom() * (i + 1));
    [duckPool[i], duckPool[j]] = [duckPool[j], duckPool[i]];
  }

  const columns: PondColumn[] = [];

  // Filled ponds
  for (let i = 0; i < numColors; i++) {
    const ducks = duckPool.slice(i * MAX_CAPACITY, (i + 1) * MAX_CAPACITY);
    columns.push({
      id: `pond-${i}`,
      ducks,
      maxCapacity: MAX_CAPACITY,
    });
  }

  // 2 Empty buffer ponds
  columns.push({
    id: `pond-buffer-1`,
    ducks: [],
    maxCapacity: MAX_CAPACITY,
  });
  columns.push({
    id: `pond-buffer-2`,
    ducks: [],
    maxCapacity: MAX_CAPACITY,
  });

  return columns;
}

export function canMoveDuck(fromCol: PondColumn, toCol: PondColumn): boolean {
  if (fromCol.ducks.length === 0) return false;
  if (toCol.ducks.length >= toCol.maxCapacity) return false;

  const movingColor = fromCol.ducks[fromCol.ducks.length - 1];

  // Target pond is empty -> always valid
  if (toCol.ducks.length === 0) return true;

  // Target pond top duck matches color -> valid
  const targetTopColor = toCol.ducks[toCol.ducks.length - 1];
  return targetTopColor === movingColor;
}

export function executeMove(
  state: DuckPondSortState,
  fromIndex: number,
  toIndex: number
): { success: boolean; ducksMoved: DuckColor[]; won: boolean } {
  if (state.isWon || fromIndex === toIndex) {
    state.selectedColumnIndex = null;
    return { success: false, ducksMoved: [], won: false };
  }

  const fromCol = state.columns[fromIndex];
  const toCol = state.columns[toIndex];
  if (!fromCol || !toCol) {
    state.selectedColumnIndex = null;
    return { success: false, ducksMoved: [], won: false };
  }

  if (!canMoveDuck(fromCol, toCol)) {
    state.selectedColumnIndex = null;
    return { success: false, ducksMoved: [], won: false };
  }

  // Move top ducks of matching color up to remaining capacity
  const movingColor = fromCol.ducks[fromCol.ducks.length - 1];
  const availableSpace = toCol.maxCapacity - toCol.ducks.length;

  let countToMove = 0;
  for (let i = fromCol.ducks.length - 1; i >= 0; i--) {
    if (fromCol.ducks[i] === movingColor && countToMove < availableSpace) {
      countToMove++;
    } else {
      break;
    }
  }

  const ducksMoved: DuckColor[] = [];
  for (let i = 0; i < countToMove; i++) {
    const duck = fromCol.ducks.pop();
    if (duck) {
      toCol.ducks.push(duck);
      ducksMoved.push(duck);
    }
  }

  state.moveHistory.push({
    fromIndex,
    toIndex,
    ducksMoved,
  });

  state.movesCount++;
  state.score += ducksMoved.length * 25;
  if (state.score > state.highScore) {
    state.highScore = state.score;
  }
  state.selectedColumnIndex = null;

  // Check victory
  const won = checkVictory(state.columns);
  if (won) {
    state.isWon = true;
    state.score += 500;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
  }

  return { success: true, ducksMoved, won };
}

export function undoMove(state: DuckPondSortState): boolean {
  if (state.moveHistory.length === 0 || state.isWon) return false;

  const lastMove = state.moveHistory.pop();
  if (!lastMove) return false;

  const fromCol = state.columns[lastMove.fromIndex];
  const toCol = state.columns[lastMove.toIndex];
  if (!fromCol || !toCol) return false;

  // Return ducks from toCol back to fromCol
  for (let i = 0; i < lastMove.ducksMoved.length; i++) {
    const duck = toCol.ducks.pop();
    if (duck) {
      fromCol.ducks.push(duck);
    }
  }

  state.score = Math.max(0, state.score - lastMove.ducksMoved.length * 25);
  state.movesCount = Math.max(0, state.movesCount - 1);
  state.selectedColumnIndex = null;
  return true;
}

export function checkVictory(columns: PondColumn[]): boolean {
  for (const col of columns) {
    // Empty column is allowed
    if (col.ducks.length === 0) continue;

    // Must be full to capacity
    if (col.ducks.length !== col.maxCapacity) return false;

    // All ducks in column must match
    const firstColor = col.ducks[0];
    for (let i = 1; i < col.ducks.length; i++) {
      if (col.ducks[i] !== firstColor) return false;
    }
  }
  return true;
}

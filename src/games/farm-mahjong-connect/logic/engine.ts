import {
  ConnectGameState,
  ConnectLevelConfig,
  ConnectMoveHint,
  ConnectTile,
  GridPoint,
  GravityMode,
  MahjongConnectTileType,
} from './types';

export const ALL_TILE_TYPES: MahjongConnectTileType[] = [
  'carrot',
  'corn',
  'pumpkin',
  'strawberry',
  'apple',
  'sunflower',
  'egg',
  'milk',
  'wheat',
  'honey',
  'cherry',
  'watering_can',
];

export const CONNECT_LEVELS: ConnectLevelConfig[] = [
  {
    levelNumber: 1,
    rows: 6,
    cols: 8,
    timeLimit: 120,
    gravity: 'none',
    tilePool: ALL_TILE_TYPES.slice(0, 6),
  },
  {
    levelNumber: 2,
    rows: 6,
    cols: 10,
    timeLimit: 140,
    gravity: 'fall_down',
    tilePool: ALL_TILE_TYPES.slice(0, 8),
  },
  {
    levelNumber: 3,
    rows: 8,
    cols: 10,
    timeLimit: 160,
    gravity: 'slide_left',
    tilePool: ALL_TILE_TYPES.slice(0, 10),
  },
  {
    levelNumber: 4,
    rows: 8,
    cols: 12,
    timeLimit: 180,
    gravity: 'fall_down',
    tilePool: ALL_TILE_TYPES,
  },
];

export function createConnectGame(levelIndex: number = 0): ConnectGameState {
  const config = CONNECT_LEVELS[levelIndex] || CONNECT_LEVELS[0];
  const { rows, cols, tilePool } = config;
  const totalCells = rows * cols;

  // Total cells must be even
  const numPairs = totalCells / 2;
  const tileTypes: MahjongConnectTileType[] = [];

  for (let i = 0; i < numPairs; i++) {
    const type = tilePool[i % tilePool.length];
    tileTypes.push(type, type);
  }

  // Shuffle tile types
  for (let i = tileTypes.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = tileTypes[i];
    tileTypes[i] = tileTypes[j];
    tileTypes[j] = temp;
  }

  const grid: (ConnectTile | null)[][] = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < cols; c++) {
      grid[r][c] = {
        id: `tile-${r}-${c}`,
        r,
        c,
        type: tileTypes[idx++],
        isEmpty: false,
      };
    }
  }

  const state: ConnectGameState = {
    level: config.levelNumber,
    score: 0,
    timeRemaining: config.timeLimit,
    totalTime: config.timeLimit,
    rows,
    cols,
    grid,
    selectedTile: null,
    activePath: null,
    pathTimer: 0,
    shufflesRemaining: 3,
    hintsRemaining: 3,
    isGameOver: false,
    isWon: false,
    gravity: config.gravity,
    events: [],
  };

  // Ensure initial board has at least 1 valid move
  if (!findValidMove(state)) {
    return shuffleBoard(state);
  }

  return state;
}

// Check if cell (r, c) is free/passable.
// Outer perimeter (-1 and rows, -1 and cols) is always passable!
function isCellEmpty(grid: (ConnectTile | null)[][], rows: number, cols: number, r: number, c: number): boolean {
  if (r < 0 || r >= rows || c < 0 || c >= cols) return true;
  const tile = grid[r][c];
  return !tile || tile.isEmpty;
}

// Check straight line (0 turns) between (r1, c1) and (r2, c2)
function isStraightLineClear(
  grid: (ConnectTile | null)[][],
  rows: number,
  cols: number,
  p1: GridPoint,
  p2: GridPoint
): boolean {
  if (p1.r !== p2.r && p1.c !== p2.c) return false;

  if (p1.r === p2.r) {
    const minC = Math.min(p1.c, p2.c);
    const maxC = Math.max(p1.c, p2.c);
    for (let c = minC + 1; c < maxC; c++) {
      if (!isCellEmpty(grid, rows, cols, p1.r, c)) return false;
    }
    return true;
  } else {
    const minR = Math.min(p1.r, p2.r);
    const maxR = Math.max(p1.r, p2.r);
    for (let r = minR + 1; r < maxR; r++) {
      if (!isCellEmpty(grid, rows, cols, r, p1.c)) return false;
    }
    return true;
  }
}

// Find connection path with at most 2 turns (3 segments)
export function findConnectionPath(
  grid: (ConnectTile | null)[][],
  rows: number,
  cols: number,
  p1: GridPoint,
  p2: GridPoint
): GridPoint[] | null {
  // 1. Direct Straight Line (0 turns)
  if (isStraightLineClear(grid, rows, cols, p1, p2)) {
    return [p1, p2];
  }

  // 2. One Turn (2 segments via corner C)
  // Corner 1: (p1.r, p2.c)
  const c1: GridPoint = { r: p1.r, c: p2.c };
  if (
    isCellEmpty(grid, rows, cols, c1.r, c1.c) &&
    isStraightLineClear(grid, rows, cols, p1, c1) &&
    isStraightLineClear(grid, rows, cols, c1, p2)
  ) {
    return [p1, c1, p2];
  }

  // Corner 2: (p2.r, p1.c)
  const c2: GridPoint = { r: p2.r, c: p1.c };
  if (
    isCellEmpty(grid, rows, cols, c2.r, c2.c) &&
    isStraightLineClear(grid, rows, cols, p1, c2) &&
    isStraightLineClear(grid, rows, cols, c2, p2)
  ) {
    return [p1, c2, p2];
  }

  // 3. Two Turns (3 segments)
  // Scan all columns from -1 to cols
  for (let c = -1; c <= cols; c++) {
    const inter1: GridPoint = { r: p1.r, c };
    const inter2: GridPoint = { r: p2.r, c };

    // Point inter1 and inter2 must be empty cells
    const inter1Empty = (inter1.r === p1.r && inter1.c === p1.c) || isCellEmpty(grid, rows, cols, inter1.r, inter1.c);
    const inter2Empty = (inter2.r === p2.r && inter2.c === p2.c) || isCellEmpty(grid, rows, cols, inter2.r, inter2.c);

    if (
      inter1Empty &&
      inter2Empty &&
      isStraightLineClear(grid, rows, cols, p1, inter1) &&
      isStraightLineClear(grid, rows, cols, inter1, inter2) &&
      isStraightLineClear(grid, rows, cols, inter2, p2)
    ) {
      return [p1, inter1, inter2, p2];
    }
  }

  // Scan all rows from -1 to rows
  for (let r = -1; r <= rows; r++) {
    const inter1: GridPoint = { r, c: p1.c };
    const inter2: GridPoint = { r, c: p2.c };

    const inter1Empty = (inter1.r === p1.r && inter1.c === p1.c) || isCellEmpty(grid, rows, cols, inter1.r, inter1.c);
    const inter2Empty = (inter2.r === p2.r && inter2.c === p2.c) || isCellEmpty(grid, rows, cols, inter2.r, inter2.c);

    if (
      inter1Empty &&
      inter2Empty &&
      isStraightLineClear(grid, rows, cols, p1, inter1) &&
      isStraightLineClear(grid, rows, cols, inter1, inter2) &&
      isStraightLineClear(grid, rows, cols, inter2, p2)
    ) {
      return [p1, inter1, inter2, p2];
    }
  }

  return null;
}

export function selectConnectTile(state: ConnectGameState, target: GridPoint): ConnectGameState {
  if (state.isGameOver || state.isWon) return state;

  const { r, c } = target;
  if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) return state;

  const tile = state.grid[r][c];
  if (!tile || tile.isEmpty) return state;

  // First selection
  if (!state.selectedTile) {
    return {
      ...state,
      selectedTile: target,
      events: [{ type: 'select_tile' }],
    };
  }

  const prev = state.selectedTile;
  // Clicking the same tile deselects it
  if (prev.r === r && prev.c === c) {
    return { ...state, selectedTile: null };
  }

  const prevTile = state.grid[prev.r][prev.c];
  if (!prevTile) return { ...state, selectedTile: target };

  // If different types, switch selection to new tile
  if (prevTile.type !== tile.type) {
    return {
      ...state,
      selectedTile: target,
      events: [{ type: 'select_tile' }],
    };
  }

  // Same type! Check path with <= 2 turns
  const path = findConnectionPath(state.grid, state.rows, state.cols, prev, target);
  if (!path) {
    // Blocked, change selection to target
    return {
      ...state,
      selectedTile: target,
      events: [{ type: 'blocked_path' }],
    };
  }

  // Valid Match Found!
  const newGrid = state.grid.map((row) => row.map((t) => (t ? { ...t } : null)));
  newGrid[prev.r][prev.c]!.isEmpty = true;
  newGrid[r][c]!.isEmpty = true;

  // Apply gravity if enabled
  const afterGravityGrid = applyGravity(newGrid, state.rows, state.cols, state.gravity);

  // Check victory (all empty)
  let allEmpty = true;
  for (let row = 0; row < state.rows; row++) {
    for (let col = 0; col < state.cols; col++) {
      if (afterGravityGrid[row][col] && !afterGravityGrid[row][col]!.isEmpty) {
        allEmpty = false;
        break;
      }
    }
    if (!allEmpty) break;
  }

  let nextState: ConnectGameState = {
    ...state,
    grid: afterGravityGrid,
    selectedTile: null,
    activePath: path,
    pathTimer: 0.35,
    score: state.score + 100,
    timeRemaining: Math.min(state.totalTime, state.timeRemaining + 5),
    isWon: allEmpty,
    events: [{ type: 'match_pair', points: 100, path }],
  };

  // If not won, verify there is at least 1 move available; auto-shuffle if deadlocked
  if (!allEmpty && !findValidMove(nextState)) {
    nextState = shuffleBoard(nextState);
    nextState.events.push({ type: 'auto_shuffle' });
  }

  return nextState;
}

function applyGravity(
  grid: (ConnectTile | null)[][],
  rows: number,
  cols: number,
  gravity: GravityMode
): (ConnectTile | null)[][] {
  if (gravity === 'none') return grid;

  const result: (ConnectTile | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));

  if (gravity === 'fall_down') {
    // Tiles fall to the bottom of their column
    for (let c = 0; c < cols; c++) {
      const activeTiles: ConnectTile[] = [];
      for (let r = 0; r < rows; r++) {
        const tile = grid[r][c];
        if (tile && !tile.isEmpty) {
          activeTiles.push(tile);
        }
      }

      const emptyCount = rows - activeTiles.length;
      for (let r = 0; r < emptyCount; r++) {
        result[r][c] = { id: `empty-${r}-${c}`, r, c, type: 'carrot', isEmpty: true };
      }
      for (let i = 0; i < activeTiles.length; i++) {
        const r = emptyCount + i;
        result[r][c] = { ...activeTiles[i], r, c };
      }
    }
  } else if (gravity === 'slide_left') {
    // Tiles slide to the left of their row
    for (let r = 0; r < rows; r++) {
      const activeTiles: ConnectTile[] = [];
      for (let c = 0; c < cols; c++) {
        const tile = grid[r][c];
        if (tile && !tile.isEmpty) {
          activeTiles.push(tile);
        }
      }

      for (let i = 0; i < activeTiles.length; i++) {
        result[r][i] = { ...activeTiles[i], r, c: i };
      }
      for (let c = activeTiles.length; c < cols; c++) {
        result[r][c] = { id: `empty-${r}-${c}`, r, c, type: 'carrot', isEmpty: true };
      }
    }
  }

  return result;
}

export function findValidMove(state: ConnectGameState): ConnectMoveHint | null {
  const activeTiles: ConnectTile[] = [];
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const t = state.grid[r][c];
      if (t && !t.isEmpty) {
        activeTiles.push(t);
      }
    }
  }

  for (let i = 0; i < activeTiles.length; i++) {
    for (let j = i + 1; j < activeTiles.length; j++) {
      const t1 = activeTiles[i];
      const t2 = activeTiles[j];
      if (t1.type === t2.type) {
        const p1: GridPoint = { r: t1.r, c: t1.c };
        const p2: GridPoint = { r: t2.r, c: t2.c };
        const path = findConnectionPath(state.grid, state.rows, state.cols, p1, p2);
        if (path) {
          return { tile1: p1, tile2: p2, path };
        }
      }
    }
  }

  return null;
}

export function shuffleBoard(state: ConnectGameState): ConnectGameState {
  const remainingTiles: MahjongConnectTileType[] = [];
  const coords: GridPoint[] = [];

  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const t = state.grid[r][c];
      if (t && !t.isEmpty) {
        remainingTiles.push(t.type);
        coords.push({ r, c });
      }
    }
  }

  if (remainingTiles.length === 0) return state;

  let attempts = 0;
  let newGrid = state.grid.map((row) => row.map((t) => (t ? { ...t } : null)));

  while (attempts < 30) {
    attempts++;
    // Shuffle remaining tile values
    for (let i = remainingTiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = remainingTiles[i];
      remainingTiles[i] = remainingTiles[j];
      remainingTiles[j] = temp;
    }

    // Assign back
    for (let i = 0; i < coords.length; i++) {
      const { r, c } = coords[i];
      newGrid[r][c] = {
        ...newGrid[r][c]!,
        type: remainingTiles[i],
        isEmpty: false,
      };
    }

    const testState: ConnectGameState = {
      ...state,
      grid: newGrid,
    };

    if (findValidMove(testState)) {
      break;
    }
  }

  return {
    ...state,
    grid: newGrid,
    selectedTile: null,
    events: [{ type: 'shuffle_board' }],
  };
}

export function updateConnectTimer(state: ConnectGameState, dt: number): ConnectGameState {
  if (state.isGameOver || state.isWon) return state;

  const nextPathTimer = Math.max(0, state.pathTimer - dt);
  const activePath = nextPathTimer > 0 ? state.activePath : null;

  const nextTime = state.timeRemaining - dt;
  if (nextTime <= 0) {
    return {
      ...state,
      timeRemaining: 0,
      activePath: null,
      pathTimer: 0,
      isGameOver: true,
      events: [{ type: 'game_over_timeout' }],
    };
  }

  return {
    ...state,
    timeRemaining: nextTime,
    activePath,
    pathTimer: nextPathTimer,
  };
}

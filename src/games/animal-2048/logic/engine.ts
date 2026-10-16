import { Direction, GameState2048, MergeEvent, SlideResult } from './types';

export const GRID_SIZE = 4;

/**
 * Creates an empty 4x4 numerical grid (0 = empty cell)
 */
export function createEmptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0)
  );
}

/**
 * Finds all currently unoccupied coordinates in the 4x4 grid
 */
export function getEmptyCells(grid: number[][]): { row: number; col: number }[] {
  const empty: { row: number; col: number }[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c] === 0) {
        empty.push({ row: r, col: c });
      }
    }
  }
  return empty;
}

/**
 * Spawns a new animal tile in a random empty cell (90% Mouse: 2, 10% Hamster: 4)
 */
export function spawnRandomTile(
  grid: number[][],
  forcedRow?: number,
  forcedCol?: number,
  forcedValue?: number
): {
  grid: number[][];
  spawned: { row: number; col: number; value: number } | null;
} {
  const newGrid = grid.map((row) => [...row]);
  const emptyCells = getEmptyCells(newGrid);

  if (emptyCells.length === 0) {
    return { grid: newGrid, spawned: null };
  }

  let targetRow: number;
  let targetCol: number;

  if (forcedRow !== undefined && forcedCol !== undefined) {
    targetRow = forcedRow;
    targetCol = forcedCol;
  } else {
    const picked = emptyCells[Math.floor(Math.random() * emptyCells.length)]!;
    targetRow = picked.row;
    targetCol = picked.col;
  }

  const value = forcedValue !== undefined ? forcedValue : Math.random() < 0.9 ? 2 : 4;
  newGrid[targetRow]![targetCol] = value;

  return {
    grid: newGrid,
    spawned: { row: targetRow, col: targetCol, value },
  };
}

/**
 * Slides and merges a single 1D row or column vector to the left
 */
export function slideAndMergeLine(line: number[]): {
  newLine: number[];
  score: number;
  mergedIndices: { index: number; value: number }[];
} {
  // Filter out empty spaces (0)
  const nonZeros = line.filter((val) => val !== 0);
  const newLine: number[] = [];
  const mergedIndices: { index: number; value: number }[] = [];
  let score = 0;
  let i = 0;

  while (i < nonZeros.length) {
    if (i + 1 < nonZeros.length && nonZeros[i] === nonZeros[i + 1]) {
      // Identical adjacent animals collide and evolve!
      const mergedVal = nonZeros[i]! * 2;
      const targetIndex = newLine.length;
      newLine.push(mergedVal);
      score += mergedVal;
      mergedIndices.push({ index: targetIndex, value: mergedVal });
      i += 2; // Both tiles consumed
    } else {
      newLine.push(nonZeros[i]!);
      i += 1;
    }
  }

  // Pad the rest with 0s
  while (newLine.length < GRID_SIZE) {
    newLine.push(0);
  }

  return { newLine, score, mergedIndices };
}

/**
 * Slides all tiles in the given direction, merges matching animals,
 * calculates score gained, and detects tile merge events.
 */
export function slideGrid(grid: number[][], direction: Direction): SlideResult {
  const newGrid: number[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => 0)
  );
  let scoreGained = 0;
  const merges: MergeEvent[] = [];

  if (direction === 'left') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const line = grid[r]!;
      const res = slideAndMergeLine(line);
      newGrid[r] = res.newLine;
      scoreGained += res.score;
      for (const m of res.mergedIndices) {
        merges.push({ row: r, col: m.index, value: m.value });
      }
    }
  } else if (direction === 'right') {
    for (let r = 0; r < GRID_SIZE; r++) {
      const line = [...grid[r]!].reverse();
      const res = slideAndMergeLine(line);
      newGrid[r] = res.newLine.reverse();
      scoreGained += res.score;
      for (const m of res.mergedIndices) {
        merges.push({ row: r, col: GRID_SIZE - 1 - m.index, value: m.value });
      }
    }
  } else if (direction === 'up') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const line: number[] = [];
      for (let r = 0; r < GRID_SIZE; r++) {
        line.push(grid[r]![c]!);
      }
      const res = slideAndMergeLine(line);
      scoreGained += res.score;
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[r]![c] = res.newLine[r]!;
      }
      for (const m of res.mergedIndices) {
        merges.push({ row: m.index, col: c, value: m.value });
      }
    }
  } else if (direction === 'down') {
    for (let c = 0; c < GRID_SIZE; c++) {
      const line: number[] = [];
      for (let r = GRID_SIZE - 1; r >= 0; r--) {
        line.push(grid[r]![c]!);
      }
      const res = slideAndMergeLine(line);
      scoreGained += res.score;
      for (let r = 0; r < GRID_SIZE; r++) {
        newGrid[GRID_SIZE - 1 - r]![c] = res.newLine[r]!;
      }
      for (const m of res.mergedIndices) {
        merges.push({ row: GRID_SIZE - 1 - m.index, col: c, value: m.value });
      }
    }
  }

  // Check if grid state changed
  let moved = false;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (newGrid[r]![c] !== grid[r]![c]) {
        moved = true;
        break;
      }
    }
    if (moved) break;
  }

  return { grid: newGrid, moved, scoreGained, merges };
}

/**
 * Checks if any valid moves remain on the board
 */
export function isGameOver(grid: number[][]): boolean {
  // 1. Any empty cells available?
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c] === 0) return false;
    }
  }

  // 2. Any adjacent horizontal matching pairs?
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE - 1; c++) {
      if (grid[r]![c] === grid[r]![c + 1]) return false;
    }
  }

  // 3. Any adjacent vertical matching pairs?
  for (let c = 0; c < GRID_SIZE; c++) {
    for (let r = 0; r < GRID_SIZE - 1; r++) {
      if (grid[r]![c] === grid[r + 1]![c]) return false;
    }
  }

  return true;
}

/**
 * Finds the highest animal tier currently on the board
 */
export function getMaxTier(grid: number[][]): number {
  let max = 0;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r]![c]! > max) {
        max = grid[r]![c]!;
      }
    }
  }
  return max;
}

/**
 * Creates the initial game state with 2 starting animal tiles (e.g. 🐭 Mouse)
 */
export function createInitialGameState(savedBestScore: number = 0): GameState2048 {
  let grid = createEmptyGrid();
  // Spawn two starting tiles
  grid = spawnRandomTile(grid).grid;
  grid = spawnRandomTile(grid).grid;

  return {
    grid,
    score: 0,
    bestScore: savedBestScore,
    maxTier: getMaxTier(grid),
    isGameOver: false,
    hasWon: false,
    keepPlayingAfterWin: false,
  };
}

/**
 * Executes a player slide move, updates score, spawns a new animal,
 * and detects game over or Elephant victory (2048).
 */
export function performMove(
  state: GameState2048,
  direction: Direction
): {
  state: GameState2048;
  slideResult: SlideResult;
  spawned: { row: number; col: number; value: number } | null;
} {
  if (state.isGameOver) {
    return {
      state,
      slideResult: { grid: state.grid, moved: false, scoreGained: 0, merges: [] },
      spawned: null,
    };
  }

  const slideResult = slideGrid(state.grid, direction);

  if (!slideResult.moved) {
    return { state, slideResult, spawned: null };
  }

  // Save history for undo
  const history = {
    grid: state.grid.map((r) => [...r]),
    score: state.score,
  };

  const newScore = state.score + slideResult.scoreGained;
  const newBestScore = Math.max(state.bestScore, newScore);

  // Spawn new random tile in empty cell
  const spawnRes = spawnRandomTile(slideResult.grid);
  const nextGrid = spawnRes.grid;
  const currentMaxTier = getMaxTier(nextGrid);

  // Check victory condition (Elephant 2048 reached for the first time)
  const reachedElephant = currentMaxTier >= 2048;
  const hasWon = !state.keepPlayingAfterWin && (state.hasWon || reachedElephant);

  // Check Game Over
  const gameOver = isGameOver(nextGrid);

  const nextState: GameState2048 = {
    ...state,
    grid: nextGrid,
    score: newScore,
    bestScore: newBestScore,
    maxTier: currentMaxTier,
    isGameOver: gameOver,
    hasWon,
    history,
  };

  return {
    state: nextState,
    slideResult,
    spawned: spawnRes.spawned,
  };
}

/**
 * Undoes the previous move
 */
export function undoMove(state: GameState2048): GameState2048 {
  if (!state.history) return state;

  return {
    ...state,
    grid: state.history.grid,
    score: state.history.score,
    maxTier: getMaxTier(state.history.grid),
    isGameOver: false,
    history: undefined,
  };
}

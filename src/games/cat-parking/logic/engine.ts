import { Cat, ExitGate, GameState, LevelConfig, MoveResult, Obstacle } from './types';

/**
 * Creates initial game state from a level configuration.
 */
export function createGameState(level: LevelConfig): GameState {
  return {
    levelId: level.id,
    width: level.width,
    height: level.height,
    cats: level.cats.map(c => ({ ...c })),
    obstacles: (level.obstacles || []).map(o => ({ ...o })),
    exit: { ...level.exit },
    movesCount: 0,
    isCompleted: false,
    history: [],
  };
}

/**
 * Returns a 2D occupancy grid where cells are marked by cat id, obstacle, or null.
 */
export function buildOccupancyGrid(
  width: number,
  height: number,
  cats: Cat[],
  obstacles: Obstacle[],
  excludeCatId?: string
): (string | null)[][] {
  const grid: (string | null)[][] = Array.from({ length: height }, () =>
    Array(width).fill(null)
  );

  // Place obstacles
  for (const obs of obstacles) {
    if (obs.x >= 0 && obs.x < width && obs.y >= 0 && obs.y < height) {
      grid[obs.y]![obs.x] = `obstacle_${obs.id}`;
    }
  }

  // Place cats
  for (const cat of cats) {
    if (excludeCatId && cat.id === excludeCatId) continue;

    for (let i = 0; i < cat.length; i++) {
      const cx = cat.orientation === 'horizontal' ? cat.x + i : cat.x;
      const cy = cat.orientation === 'vertical' ? cat.y + i : cat.y;
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy]![cx] = cat.id;
      }
    }
  }

  return grid;
}

/**
 * Calculates the minimum and maximum coordinates (x for horizontal, y for vertical)
 * that a cat can legally slide to in the current state.
 */
export function getCatMoveRange(
  state: GameState,
  catId: string
): { min: number; max: number; canExit: boolean } {
  const cat = state.cats.find(c => c.id === catId);
  if (!cat) return { min: 0, max: 0, canExit: false };

  const grid = buildOccupancyGrid(
    state.width,
    state.height,
    state.cats,
    state.obstacles,
    catId
  );

  if (cat.orientation === 'horizontal') {
    // Sliding horizontally: check left and right
    let minX = cat.x;
    while (minX > 0 && grid[cat.y]![minX - 1] === null) {
      minX--;
    }

    let maxX = cat.x;
    const maxAllowedOnBoard = state.width - cat.length;
    while (maxX < maxAllowedOnBoard && grid[cat.y]![maxX + cat.length] === null) {
      maxX++;
    }

    let canExit = false;
    // Check if hero cat can exit to the right gate
    if (cat.isHero && state.exit.side === 'right' && state.exit.coordinate === cat.y) {
      if (maxX === maxAllowedOnBoard) {
        canExit = true;
      }
    }

    return { min: minX, max: maxX, canExit };
  } else {
    // Sliding vertically: check up and down
    let minY = cat.y;
    while (minY > 0 && grid[minY - 1]![cat.x] === null) {
      minY--;
    }

    let maxY = cat.y;
    const maxAllowedOnBoard = state.height - cat.length;
    while (maxY < maxAllowedOnBoard && grid[maxY + cat.length]![cat.x] === null) {
      maxY++;
    }

    let canExit = false;
    // Check if hero cat can exit to bottom or top gate
    if (cat.isHero && state.exit.side === 'bottom' && state.exit.coordinate === cat.x) {
      if (maxY === maxAllowedOnBoard) {
        canExit = true;
      }
    }

    return { min: minY, max: maxY, canExit };
  }
}

/**
 * Validates and applies a cat move to target coordinate.
 */
export function applyMove(
  state: GameState,
  catId: string,
  targetCoord: number
): { newState: GameState; result: MoveResult } {
  const catIndex = state.cats.findIndex(c => c.id === catId);
  if (catIndex === -1) {
    return {
      newState: state,
      result: { valid: false, reason: 'Cat not found' },
    };
  }

  const cat = state.cats[catIndex]!;
  const currentCoord = cat.orientation === 'horizontal' ? cat.x : cat.y;

  if (targetCoord === currentCoord) {
    return {
      newState: state,
      result: { valid: false, reason: 'Zero movement' },
    };
  }

  const { min, max, canExit } = getCatMoveRange(state, catId);

  // Check if moving to exit gate
  let isExitMove = false;
  if (cat.isHero && canExit) {
    const exitTargetCoord = cat.orientation === 'horizontal' ? max + 1 : max + 1;
    if (targetCoord >= exitTargetCoord) {
      isExitMove = true;
    }
  }

  // Validate range
  if (!isExitMove && (targetCoord < min || targetCoord > max)) {
    return {
      newState: state,
      result: {
        valid: false,
        reason: `Target ${targetCoord} out of allowable range [${min}, ${max}]`,
      },
    };
  }

  // Create new state
  const updatedCats = state.cats.map((c, idx) => {
    if (idx !== catIndex) return { ...c };
    if (c.orientation === 'horizontal') {
      return {
        ...c,
        x: isExitMove ? state.width : targetCoord,
      };
    } else {
      return {
        ...c,
        y: isExitMove ? state.height : targetCoord,
      };
    }
  });

  const fromX = cat.x;
  const fromY = cat.y;
  const toX = cat.orientation === 'horizontal' ? (isExitMove ? state.width : targetCoord) : cat.x;
  const toY = cat.orientation === 'vertical' ? (isExitMove ? state.height : targetCoord) : cat.y;

  const newState: GameState = {
    ...state,
    cats: updatedCats,
    movesCount: state.movesCount + 1,
    isCompleted: isExitMove,
    history: [
      ...state.history,
      { catId, fromX, fromY, toX, toY },
    ],
  };

  return {
    newState,
    result: {
      valid: true,
      newPosition: { x: toX, y: toY },
      exited: isExitMove,
    },
  };
}

/**
 * Reverts the most recent move in history.
 */
export function undoMove(state: GameState): GameState {
  if (state.history.length === 0 || state.isCompleted) {
    return state;
  }

  const lastMove = state.history[state.history.length - 1]!;
  const newHistory = state.history.slice(0, -1);

  const updatedCats = state.cats.map(c => {
    if (c.id === lastMove.catId) {
      return {
        ...c,
        x: lastMove.fromX,
        y: lastMove.fromY,
      };
    }
    return { ...c };
  });

  return {
    ...state,
    cats: updatedCats,
    movesCount: Math.max(0, state.movesCount - 1),
    history: newHistory,
  };
}

/**
 * Checks whether the hero cat has reached the designated exit gate.
 */
export function checkWinCondition(state: GameState): boolean {
  const hero = state.cats.find(c => c.isHero);
  if (!hero) return false;

  if (state.exit.side === 'right') {
    return hero.y === state.exit.coordinate && hero.x + hero.length >= state.width;
  }
  if (state.exit.side === 'bottom') {
    return hero.x === state.exit.coordinate && hero.y + hero.length >= state.height;
  }
  return false;
}

/**
 * Breadth-First Search (BFS) Solver for Cat Parking puzzle verification.
 * Returns minimum moves to solve, or null if unsolvable.
 */
export function findShortestSolutionBFS(
  level: LevelConfig,
  maxStates = 60000
): { solvable: boolean; moves: number; path: string[] } | null {
  const initial = createGameState(level);

  // Encode state as compact string
  const serializeState = (s: GameState): string => {
    return s.cats
      .map(c => `${c.id}:${c.x},${c.y}`)
      .sort()
      .join('|');
  };

  interface QueueNode {
    state: GameState;
    depth: number;
    path: string[];
  }

  const visited = new Set<string>();
  const queue: QueueNode[] = [{ state: initial, depth: 0, path: [] }];
  visited.add(serializeState(initial));

  while (queue.length > 0) {
    if (visited.size > maxStates) {
      return null;
    }

    const current = queue.shift()!;

    // Check if won
    if (current.state.isCompleted || checkWinCondition(current.state)) {
      return {
        solvable: true,
        moves: current.depth,
        path: current.path,
      };
    }

    // Try all possible moves for each cat
    for (const cat of current.state.cats) {
      const { min, max, canExit } = getCatMoveRange(current.state, cat.id);
      const currentCoord = cat.orientation === 'horizontal' ? cat.x : cat.y;

      const candidates: number[] = [];
      for (let c = min; c <= max; c++) {
        if (c !== currentCoord) {
          candidates.push(c);
        }
      }
      if (cat.isHero && canExit) {
        candidates.push(max + 1); // Exit move
      }

      for (const target of candidates) {
        const { newState, result } = applyMove(current.state, cat.id, target);
        if (result.valid) {
          const key = serializeState(newState);
          if (!visited.has(key)) {
            visited.add(key);
            queue.push({
              state: newState,
              depth: current.depth + 1,
              path: [...current.path, `${cat.id}->${target}`],
            });
          }
        }
      }
    }
  }

  return { solvable: false, moves: -1, path: [] };
}

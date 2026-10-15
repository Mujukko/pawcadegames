import { Dog, ExitGate, GameState, LevelConfig, MoveResult, Obstacle } from './types';

/**
 * Creates initial game state from a level configuration.
 */
export function createGameState(level: LevelConfig): GameState {
  return {
    levelId: level.id,
    width: level.width,
    height: level.height,
    dogs: level.dogs.map(d => ({ ...d })),
    obstacles: (level.obstacles || []).map(o => ({ ...o })),
    exit: { ...level.exit },
    movesCount: 0,
    isCompleted: false,
    history: [],
  };
}

/**
 * Returns a 2D occupancy grid where cells are marked by dog id, obstacle, or null.
 */
export function buildOccupancyGrid(
  width: number,
  height: number,
  dogs: Dog[],
  obstacles: Obstacle[],
  excludeDogId?: string
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

  // Place dogs
  for (const dog of dogs) {
    if (excludeDogId && dog.id === excludeDogId) continue;

    for (let i = 0; i < dog.length; i++) {
      const cx = dog.orientation === 'horizontal' ? dog.x + i : dog.x;
      const cy = dog.orientation === 'vertical' ? dog.y + i : dog.y;
      if (cx >= 0 && cx < width && cy >= 0 && cy < height) {
        grid[cy]![cx] = dog.id;
      }
    }
  }

  return grid;
}

/**
 * Calculates the minimum and maximum coordinates (x for horizontal, y for vertical)
 * that a dog can legally slide to in the current state.
 */
export function getDogMoveRange(
  state: GameState,
  dogId: string
): { min: number; max: number; canExit: boolean } {
  const dog = state.dogs.find(d => d.id === dogId);
  if (!dog) return { min: 0, max: 0, canExit: false };

  const grid = buildOccupancyGrid(
    state.width,
    state.height,
    state.dogs,
    state.obstacles,
    dogId
  );

  if (dog.orientation === 'horizontal') {
    // Sliding horizontally: check left and right
    let minX = dog.x;
    while (minX > 0 && grid[dog.y]![minX - 1] === null) {
      minX--;
    }

    let maxX = dog.x;
    const maxAllowedOnBoard = state.width - dog.length;
    while (maxX < maxAllowedOnBoard && grid[dog.y]![maxX + dog.length] === null) {
      maxX++;
    }

    let canExit = false;
    // Check if hero dog can exit to the right gate
    if (dog.isHero && state.exit.side === 'right' && state.exit.coordinate === dog.y) {
      if (maxX === maxAllowedOnBoard) {
        canExit = true;
      }
    }

    return { min: minX, max: maxX, canExit };
  } else {
    // Sliding vertically: check up and down
    let minY = dog.y;
    while (minY > 0 && grid[minY - 1]![dog.x] === null) {
      minY--;
    }

    let maxY = dog.y;
    const maxAllowedOnBoard = state.height - dog.length;
    while (maxY < maxAllowedOnBoard && grid[maxY + dog.length]![dog.x] === null) {
      maxY++;
    }

    let canExit = false;
    // Check if hero dog can exit to the bottom gate
    if (dog.isHero && state.exit.side === 'bottom' && state.exit.coordinate === dog.x) {
      if (maxY === maxAllowedOnBoard) {
        canExit = true;
      }
    }

    return { min: minY, max: maxY, canExit };
  }
}

/**
 * Validates and executes a move for a dog.
 * If targetPosition represents an exit move for the hero dog, marks completion.
 */
export function moveDog(
  state: GameState,
  dogId: string,
  newCoord: number
): { success: boolean; state: GameState; win: boolean } {
  const dogIndex = state.dogs.findIndex(d => d.id === dogId);
  if (dogIndex === -1) return { success: false, state, win: false };

  const dog = state.dogs[dogIndex]!;
  const range = getDogMoveRange(state, dogId);

  // Check if this is an exit move for hero
  if (dog.isHero && range.canExit) {
    if (dog.orientation === 'horizontal' && state.exit.side === 'right') {
      const exitCoord = state.width; // 1 step past edge
      if (newCoord >= state.width - dog.length) {
        // Hero dog successfully escapes through the gate!
        const updatedDogs = [...state.dogs];
        updatedDogs[dogIndex] = { ...dog, x: exitCoord };
        return {
          success: true,
          win: true,
          state: {
            ...state,
            dogs: updatedDogs,
            movesCount: state.movesCount + 1,
            isCompleted: true,
            history: [
              ...state.history,
              { dogId, fromX: dog.x, fromY: dog.y, toX: exitCoord, toY: dog.y },
            ],
          },
        };
      }
    }
  }

  // Clamped move within legal range
  if (newCoord < range.min || newCoord > range.max) {
    return { success: false, state, win: false };
  }

  const currentCoord = dog.orientation === 'horizontal' ? dog.x : dog.y;
  if (newCoord === currentCoord) {
    return { success: false, state, win: false };
  }

  const updatedDogs = [...state.dogs];
  const newX = dog.orientation === 'horizontal' ? newCoord : dog.x;
  const newY = dog.orientation === 'vertical' ? newCoord : dog.y;

  updatedDogs[dogIndex] = {
    ...dog,
    x: newX,
    y: newY,
  };

  const newState: GameState = {
    ...state,
    dogs: updatedDogs,
    movesCount: state.movesCount + 1,
    isCompleted: false,
    history: [
      ...state.history,
      { dogId, fromX: dog.x, fromY: dog.y, toX: newX, toY: newY },
    ],
  };

  return { success: true, state: newState, win: false };
}

/**
 * Checks if the state is in a winning configuration.
 */
export function isWinningState(state: GameState): boolean {
  if (state.isCompleted) return true;
  const hero = state.dogs.find(d => d.isHero);
  if (!hero) return false;

  // Hero reached or exited through the gate
  if (state.exit.side === 'right') {
    return hero.y === state.exit.coordinate && hero.x + hero.length >= state.width;
  }
  if (state.exit.side === 'left') {
    return hero.y === state.exit.coordinate && hero.x <= 0;
  }
  if (state.exit.side === 'bottom') {
    return hero.x === state.exit.coordinate && hero.y + hero.length >= state.height;
  }
  if (state.exit.side === 'top') {
    return hero.x === state.exit.coordinate && hero.y <= 0;
  }
  return false;
}

/**
 * Generates a unique state key for solver deduplication.
 */
function serializeState(dogs: Dog[]): string {
  // Sort by id for deterministic key
  return dogs
    .slice()
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(d => `${d.id}:${d.x},${d.y}`)
    .join('|');
}

export interface SolveResult {
  solvable: boolean;
  minMoves: number;
  solutionPath?: { dogId: string; newCoord: number }[];
}

/**
 * Solves a level using Breadth-First Search (BFS) to guarantee solvability
 * and determine the minimum number of moves.
 */
export function solveLevel(level: LevelConfig, maxIterations = 50000): SolveResult {
  const initialState = createGameState(level);

  if (isWinningState(initialState)) {
    return { solvable: true, minMoves: 0, solutionPath: [] };
  }

  interface QueueNode {
    state: GameState;
    path: { dogId: string; newCoord: number }[];
  }

  const queue: QueueNode[] = [{ state: initialState, path: [] }];
  const visited = new Set<string>();
  visited.add(serializeState(initialState.dogs));

  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const current = queue.shift()!;

    for (const dog of current.state.dogs) {
      const range = getDogMoveRange(current.state, dog.id);
      const currentCoord = dog.orientation === 'horizontal' ? dog.x : dog.y;

      // Try all reachable positions for this dog
      for (let targetCoord = range.min; targetCoord <= range.max; targetCoord++) {
        if (targetCoord === currentCoord) continue;

        const moveResult = moveDog(current.state, dog.id, targetCoord);
        if (!moveResult.success) continue;

        if (moveResult.win || isWinningState(moveResult.state)) {
          return {
            solvable: true,
            minMoves: current.path.length + 1,
            solutionPath: [...current.path, { dogId: dog.id, newCoord: targetCoord }],
          };
        }

        const stateKey = serializeState(moveResult.state.dogs);
        if (!visited.has(stateKey)) {
          visited.add(stateKey);
          queue.push({
            state: moveResult.state,
            path: [...current.path, { dogId: dog.id, newCoord: targetCoord }],
          });
        }
      }

      // If hero can exit, check exit move
      if (dog.isHero && range.canExit) {
        const exitCoord = current.state.width;
        return {
          solvable: true,
          minMoves: current.path.length + 1,
          solutionPath: [...current.path, { dogId: dog.id, newCoord: exitCoord }],
        };
      }
    }
  }

  return { solvable: false, minMoves: -1 };
}

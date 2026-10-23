/**
 * Grain Sand Fall: Farm Physics Puzzle — Pure TypeScript Sand Simulation Engine
 * Inspired by Sand Blocks / Setris / Sand Tetris (547K+ US App Store viral hit).
 *
 * Mechanics:
 * - Falling grain polyomino pieces made of farm crop sands (Golden Corn 🌽, Ruby Cranberry 🍓, Sky Berry 🫐, Clover Green 🍀).
 * - While falling, the active block moves left/right, drops, and rotates.
 * - When touching the floor or resting grains, the block dissolves into individual sand particles.
 * - Cellular Automata Physics: Each grain drops straight down or rolls down-left / down-right.
 * - Clear Condition: When grains of the same color form a contiguous path from the LEFT wall to the RIGHT wall,
 *   that entire connected color strand dissolves, awarding points and clearing the silo!
 */

export type GrainColor = 1 | 2 | 3 | 4; // 1: Corn Gold, 2: Cranberry Red, 3: Sky Blue, 4: Clover Green
export type GrainCell = GrainColor | 0;

export interface GrainColorMeta {
  id: GrainColor;
  name: string;
  hex: string;
  glow: string;
  emoji: string;
}

export const GRAIN_COLORS: Record<GrainColor, GrainColorMeta> = {
  1: { id: 1, name: 'Golden Corn', hex: '#eab308', glow: '#fef08a', emoji: '🌽' },
  2: { id: 2, name: 'Ruby Cranberry', hex: '#ef4444', glow: '#fca5a5', emoji: '🍓' },
  3: { id: 3, name: 'Sky Berry', hex: '#0ea5e9', glow: '#7dd3fc', emoji: '🫐' },
  4: { id: 4, name: 'Clover Green', hex: '#22c55e', glow: '#86efac', emoji: '🍀' },
};

export interface FallingShape {
  matrix: GrainCell[][];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SandSimulationState {
  cols: number; // default 40
  rows: number; // default 50
  grid: number[][]; // 0 = empty, 1-4 = grain color
  activeShape: FallingShape | null;
  nextColor: GrainColor;
  score: number;
  clearedLines: number;
  isGameOver: boolean;
}

export const DEFAULT_COLS = 36;
export const DEFAULT_ROWS = 48;

/**
 * Standard Sand Tetromino shapes defined as matrices.
 */
export const SHAPE_TEMPLATES: number[][][] = [
  // O-Square (2x2)
  [
    [1, 1],
    [1, 1],
  ],
  // I-Bar (4x1)
  [[1, 1, 1, 1]],
  // T-Shape
  [
    [0, 1, 0],
    [1, 1, 1],
  ],
  // L-Shape
  [
    [1, 0],
    [1, 0],
    [1, 1],
  ],
  // J-Shape
  [
    [0, 1],
    [0, 1],
    [1, 1],
  ],
  // S-Shape
  [
    [0, 1, 1],
    [1, 1, 0],
  ],
  // Z-Shape
  [
    [1, 1, 0],
    [0, 1, 1],
  ],
];

/**
 * Creates an empty sand grid.
 */
export function createEmptyGrid(cols: number = DEFAULT_COLS, rows: number = DEFAULT_ROWS): number[][] {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

/**
 * Generates a new falling shape with random color and template.
 */
export function spawnRandomShape(cols: number, color?: GrainColor): FallingShape {
  const chosenColor: GrainColor = color || ((Math.floor(Math.random() * 4) + 1) as GrainColor);
  const template = SHAPE_TEMPLATES[Math.floor(Math.random() * SHAPE_TEMPLATES.length)];

  // Scale template slightly (each cell is 2x2 grains for better sand flow)
  const matrix: GrainCell[][] = [];
  for (let r = 0; r < template.length; r++) {
    const row1: GrainCell[] = [];
    const row2: GrainCell[] = [];
    for (let c = 0; c < template[r].length; c++) {
      const val = template[r][c] ? chosenColor : 0;
      row1.push(val, val);
      row2.push(val, val);
    }
    matrix.push(row1, row2);
  }

  const width = matrix[0].length;
  const height = matrix.length;
  const startX = Math.floor((cols - width) / 2);

  return {
    matrix,
    x: startX,
    y: 0,
    width,
    height,
  };
}

/**
 * Rotates a shape matrix 90 degrees clockwise.
 */
export function rotateMatrix(matrix: GrainCell[][]): GrainCell[][] {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated: GrainCell[][] = [];

  for (let c = 0; c < cols; c++) {
    const newRow: GrainCell[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(matrix[r][c]);
    }
    rotated.push(newRow);
  }
  return rotated;
}

/**
 * Checks if the falling shape collides with walls or resting grains.
 */
export function doesShapeCollide(shape: FallingShape, grid: number[][], cols: number, rows: number): boolean {
  for (let r = 0; r < shape.height; r++) {
    for (let c = 0; c < shape.width; c++) {
      if (shape.matrix[r][c] !== 0) {
        const targetX = shape.x + c;
        const targetY = shape.y + r;

        // Wall collisions
        if (targetX < 0 || targetX >= cols || targetY >= rows) {
          return true;
        }
        // Sand collision
        if (targetY >= 0 && grid[targetY][targetX] !== 0) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Disperses active shape into resting sand grains on the grid.
 */
export function solidifyShapeToGrid(shape: FallingShape, grid: number[][]): number[][] {
  const newGrid = grid.map(row => [...row]);
  for (let r = 0; r < shape.height; r++) {
    for (let c = 0; c < shape.width; c++) {
      const val = shape.matrix[r][c];
      if (val !== 0) {
        const targetX = shape.x + c;
        const targetY = shape.y + r;
        if (targetY >= 0 && targetY < newGrid.length && targetX >= 0 && targetX < newGrid[0].length) {
          newGrid[targetY][targetX] = val;
        }
      }
    }
  }
  return newGrid;
}

/**
 * Advances the falling sand physics by one tick.
 * Bottom-to-top traversal: grains fall down, or roll down-left / down-right.
 */
export function stepSandPhysics(grid: number[][], cols: number, rows: number): { newGrid: number[][]; movedCount: number } {
  const next = grid.map(r => [...r]);
  let moved = 0;

  // Process from second-to-last row up to top
  for (let y = rows - 2; y >= 0; y--) {
    // Randomize horizontal scan direction to avoid directional bias
    const scanOrder = Math.random() > 0.5;
    for (let step = 0; step < cols; step++) {
      const x = scanOrder ? step : cols - 1 - step;
      const grain = next[y][x];

      if (grain !== 0) {
        // 1. Try directly below
        if (next[y + 1][x] === 0) {
          next[y + 1][x] = grain;
          next[y][x] = 0;
          moved++;
        } else {
          // 2. Try diagonal roll (down-left or down-right)
          const rollLeftFirst = Math.random() > 0.5;
          const leftOpen = x > 0 && next[y + 1][x - 1] === 0;
          const rightOpen = x < cols - 1 && next[y + 1][x + 1] === 0;

          if (rollLeftFirst) {
            if (leftOpen) {
              next[y + 1][x - 1] = grain;
              next[y][x] = 0;
              moved++;
            } else if (rightOpen) {
              next[y + 1][x + 1] = grain;
              next[y][x] = 0;
              moved++;
            }
          } else {
            if (rightOpen) {
              next[y + 1][x + 1] = grain;
              next[y][x] = 0;
              moved++;
            } else if (leftOpen) {
              next[y + 1][x - 1] = grain;
              next[y][x] = 0;
              moved++;
            }
          }
        }
      }
    }
  }

  return { newGrid: next, movedCount: moved };
}

/**
 * Finds and clears all contiguous same-color sand strands that stretch from the left wall (x=0) to the right wall (x=cols-1).
 * Uses BFS/flood-fill.
 */
export function checkAndClearConnectedLines(
  grid: number[][],
  cols: number,
  rows: number
): { newGrid: number[][]; clearedGrains: number; strandsCleared: number } {
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const toDelete: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  let totalCleared = 0;
  let strands = 0;

  for (let startY = 0; startY < rows; startY++) {
    const color = grid[startY][0];
    if (color === 0 || visited[startY][0]) continue;

    // BFS to find connected component of same color
    const queue: [number, number][] = [[0, startY]];
    visited[startY][0] = true;
    const component: [number, number][] = [[0, startY]];
    let reachedRightWall = false;

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      if (cx === cols - 1) {
        reachedRightWall = true;
      }

      // Check 4 neighbors
      const neighbors: [number, number][] = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
          if (!visited[ny][nx] && grid[ny][nx] === color) {
            visited[ny][nx] = true;
            queue.push([nx, ny]);
            component.push([nx, ny]);
          }
        }
      }
    }

    // If component touched right wall, mark for deletion!
    if (reachedRightWall) {
      strands++;
      for (const [cx, cy] of component) {
        toDelete[cy][cx] = true;
      }
    }
  }

  // Delete all marked grains
  const newGrid = grid.map(row => [...row]);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (toDelete[y][x]) {
        newGrid[y][x] = 0;
        totalCleared++;
      }
    }
  }

  return { newGrid, clearedGrains: totalCleared, strandsCleared: strands };
}

/**
 * Initializes a fresh game state.
 */
export function initializeSandGame(cols: number = DEFAULT_COLS, rows: number = DEFAULT_ROWS): SandSimulationState {
  const nextColor: GrainColor = (Math.floor(Math.random() * 4) + 1) as GrainColor;
  return {
    cols,
    rows,
    grid: createEmptyGrid(cols, rows),
    activeShape: spawnRandomShape(cols),
    nextColor,
    score: 0,
    clearedLines: 0,
    isGameOver: false,
  };
}

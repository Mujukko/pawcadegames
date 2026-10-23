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
  lightHex: string;
  darkHex: string;
  sparkleHex: string;
  emoji: string;
}

export const GRAIN_COLORS: Record<GrainColor, GrainColorMeta> = {
  1: {
    id: 1,
    name: 'Golden Corn',
    hex: '#f59e0b',
    glow: '#fef08a',
    lightHex: '#fde047',
    darkHex: '#d97706',
    sparkleHex: '#ffffff',
    emoji: '🌽',
  },
  2: {
    id: 2,
    name: 'Ruby Cranberry',
    hex: '#ef4444',
    glow: '#fca5a5',
    lightHex: '#f87171',
    darkHex: '#dc2626',
    sparkleHex: '#ffffff',
    emoji: '🍓',
  },
  3: {
    id: 3,
    name: 'Sky Berry',
    hex: '#0ea5e9',
    glow: '#7dd3fc',
    lightHex: '#38bdf8',
    darkHex: '#0284c7',
    sparkleHex: '#ffffff',
    emoji: '🫐',
  },
  4: {
    id: 4,
    name: 'Clover Green',
    hex: '#22c55e',
    glow: '#86efac',
    lightHex: '#4ade80',
    darkHex: '#16a34a',
    sparkleHex: '#ffffff',
    emoji: '🍀',
  },
};

export interface FallingShape {
  matrix: GrainCell[][];
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SandSimulationState {
  cols: number; // default 36
  rows: number; // default 48
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
 * Wall contact detection for dynamic UI sensor rail illumination.
 * Returns sets of grain colors touching left border, right border, and both.
 */
export interface WallContacts {
  leftColors: Set<GrainColor>;
  rightColors: Set<GrainColor>;
  connectedColors: Set<GrainColor>;
}

export function getWallContacts(grid: number[][], cols: number, rows: number): WallContacts {
  const leftColors = new Set<GrainColor>();
  const rightColors = new Set<GrainColor>();
  const connectedColors = new Set<GrainColor>();

  for (let y = 0; y < rows; y++) {
    // Left boundary zone (x = 0 or 1)
    const l0 = grid[y][0];
    const l1 = cols > 1 ? grid[y][1] : 0;
    if (l0 > 0) leftColors.add(l0 as GrainColor);
    if (l1 > 0) leftColors.add(l1 as GrainColor);

    // Right boundary zone (x = cols - 1 or cols - 2)
    const r0 = grid[y][cols - 1];
    const r1 = cols > 1 ? grid[y][cols - 2] : 0;
    if (r0 > 0) rightColors.add(r0 as GrainColor);
    if (r1 > 0) rightColors.add(r1 as GrainColor);
  }

  for (const c of leftColors) {
    if (rightColors.has(c)) {
      connectedColors.add(c);
    }
  }

  return { leftColors, rightColors, connectedColors };
}

/**
 * Finds and clears all contiguous same-color sand strands that stretch from the left wall zone
 * to the right wall zone.
 * Uses 8-neighbor Moore connectivity (orthogonals + diagonals) so natural 45° sand dunes
 * connect fluidly without breaking!
 */
export function checkAndClearConnectedLines(
  grid: number[][],
  cols: number,
  rows: number
): { newGrid: number[][]; clearedGrains: number; strandsCleared: number; clearedColor: GrainColor | null } {
  const visited: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  const toDelete: boolean[][] = Array.from({ length: rows }, () => Array(cols).fill(false));
  let totalCleared = 0;
  let strands = 0;
  let clearedColor: GrainColor | null = null;

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const color = grid[y][x];
      if (color === 0 || visited[y][x]) continue;

      // BFS to find all connected grains of the same color (8-direction Moore neighborhood)
      const queue: [number, number][] = [[x, y]];
      visited[y][x] = true;
      const component: [number, number][] = [[x, y]];
      let minX = x;
      let maxX = x;

      while (queue.length > 0) {
        const [cx, cy] = queue.shift()!;
        if (cx < minX) minX = cx;
        if (cx > maxX) maxX = cx;

        // 8-neighbor Moore connectivity: cardinal + diagonal
        const neighbors: [number, number][] = [
          [cx + 1, cy],
          [cx - 1, cy],
          [cx, cy + 1],
          [cx, cy - 1],
          [cx + 1, cy + 1],
          [cx + 1, cy - 1],
          [cx - 1, cy + 1],
          [cx - 1, cy - 1],
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

      // Check if this continuous sand strand spans from the left border zone to the right border zone
      // Tolerance: minX <= 1 and maxX >= cols - 2 (covers full width even with 1-cell edge rolling)
      const touchesLeft = minX <= 1;
      const touchesRight = maxX >= cols - 2;

      if (touchesLeft && touchesRight) {
        strands++;
        clearedColor = color as GrainColor;
        for (const [cx, cy] of component) {
          toDelete[cy][cx] = true;
        }
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

  return { newGrid, clearedGrains: totalCleared, strandsCleared: strands, clearedColor };
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

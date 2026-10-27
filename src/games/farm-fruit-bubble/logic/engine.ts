export type FruitType = 'apple' | 'pear' | 'plum' | 'lemon' | 'berry';

export interface FruitDef {
  type: FruitType;
  name: string;
  emoji: string;
  color: string;
  borderColor: string;
  highlightColor: string;
  points: number;
}

export const FRUIT_DEFS: Record<FruitType, FruitDef> = {
  apple: {
    type: 'apple',
    name: 'Crisp Apple',
    emoji: '🍎',
    color: '#ef4444', // red-500
    borderColor: '#b91c1c', // red-700
    highlightColor: '#fca5a5',
    points: 30,
  },
  pear: {
    type: 'pear',
    name: 'Golden Pear',
    emoji: '🍐',
    color: '#84cc16', // lime-500
    borderColor: '#4d7c0f', // lime-700
    highlightColor: '#d9f99d',
    points: 35,
  },
  plum: {
    type: 'plum',
    name: 'Juicy Plum',
    emoji: '🍇',
    color: '#a855f7', // purple-500
    borderColor: '#7e22ce', // purple-700
    highlightColor: '#e9d5ff',
    points: 40,
  },
  lemon: {
    type: 'lemon',
    name: 'Sun Lemon',
    emoji: '🍋',
    color: '#eab308', // yellow-500
    borderColor: '#a16207', // yellow-700
    highlightColor: '#fef08a',
    points: 45,
  },
  berry: {
    type: 'berry',
    name: 'Sweet Berry',
    emoji: '🍓',
    color: '#f43f5e', // rose-500
    borderColor: '#be123c', // rose-700
    highlightColor: '#fecdd3',
    points: 50,
  },
};

export const FRUIT_KEYS: FruitType[] = ['apple', 'pear', 'plum', 'lemon', 'berry'];

export const BOARD_COLS_EVEN = 8;
export const BOARD_COLS_ODD = 7;
export const BUBBLE_RADIUS = 22;
export const BUBBLE_DIAMETER = BUBBLE_RADIUS * 2;
export const ROW_HEIGHT = Math.round(BUBBLE_DIAMETER * 0.866); // cos(30 deg) * D = 38px
export const BOARD_WIDTH = 400;
export const BOARD_HEIGHT = 560;
export const SLINGSHOT_X = 200;
export const SLINGSHOT_Y = 500;
export const DANGER_LINE_Y = 445;

export interface BubbleCell {
  row: number;
  col: number;
  type: FruitType;
  x: number;
  y: number;
}

export interface FlyingBubble {
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export interface DroppingFruit {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  vy: number;
  vx: number;
}

export interface FarmFruitBubbleState {
  score: number;
  highScore: number;
  level: number;
  grid: (FruitType | null)[][];
  currentBubble: FruitType;
  nextBubble: FruitType;
  flyingBubble: FlyingBubble | null;
  aimAngleDeg: number; // -75 to +75 deg
  shotsFired: number;
  shotsUntilDescent: number;
  combo: number;
  maxCombo: number;
  droppingFruits: DroppingFruit[];
  gameOver: boolean;
  gameWon: boolean;
  lastPopCount: number;
}

/**
 * Calculates world coordinates (x, y) for a grid cell (row, col)
 */
export function getCellCenter(row: number, col: number): { x: number; y: number } {
  const isOdd = row % 2 === 1;
  const colCount = isOdd ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
  const rowStartX = isOdd ? BUBBLE_RADIUS + BUBBLE_RADIUS : BUBBLE_RADIUS + (BOARD_WIDTH - BOARD_COLS_EVEN * BUBBLE_DIAMETER) / 2;
  const x = rowStartX + col * BUBBLE_DIAMETER;
  const y = BUBBLE_RADIUS + 10 + row * ROW_HEIGHT;
  return { x, y };
}

/**
 * Generates an initial board of fruits
 */
export function createInitialGrid(initialRows: number = 5): (FruitType | null)[][] {
  const grid: (FruitType | null)[][] = [];
  const maxRows = 12;

  for (let r = 0; r < maxRows; r++) {
    const isOdd = r % 2 === 1;
    const cols = isOdd ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
    const rowList: (FruitType | null)[] = [];

    for (let c = 0; c < cols; c++) {
      if (r < initialRows) {
        // Random fruit with slight cluster continuity
        const fruit = FRUIT_KEYS[Math.floor(Math.random() * FRUIT_KEYS.length)] || 'apple';
        rowList.push(fruit);
      } else {
        rowList.push(null);
      }
    }
    grid.push(rowList);
  }
  return grid;
}

export function getRandomFruit(availableTypes: FruitType[] = FRUIT_KEYS): FruitType {
  return availableTypes[Math.floor(Math.random() * availableTypes.length)] || 'apple';
}

/**
 * Initializes a new game level state
 */
export function createInitialBubbleState(highScore: number = 0, level: number = 1): FarmFruitBubbleState {
  const grid = createInitialGrid(Math.min(7, 4 + level));
  const current = getRandomFruit();
  const next = getRandomFruit();

  return {
    score: 0,
    highScore,
    level,
    grid,
    currentBubble: current,
    nextBubble: next,
    flyingBubble: null,
    aimAngleDeg: 0,
    shotsFired: 0,
    shotsUntilDescent: 6,
    combo: 0,
    maxCombo: 0,
    droppingFruits: [],
    gameOver: false,
    gameWon: false,
    lastPopCount: 0,
  };
}

/**
 * Computes aiming trajectory points reflecting off walls
 */
export function calculateAimTrajectory(
  startX: number,
  startY: number,
  angleDeg: number,
  maxDistance: number = 700
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  let currX = startX;
  let currY = startY;
  let dirX = Math.cos(rad);
  let dirY = Math.sin(rad);
  let remainingDist = maxDistance;

  while (remainingDist > 0 && currY > BUBBLE_RADIUS) {
    let nextX = currX + dirX * remainingDist;
    let nextY = currY + dirY * remainingDist;

    // Left wall bounce
    if (nextX < BUBBLE_RADIUS) {
      const distToWall = (currX - BUBBLE_RADIUS) / Math.abs(dirX);
      currX = BUBBLE_RADIUS;
      currY += dirY * distToWall;
      dirX = -dirX;
      remainingDist -= distToWall;
      points.push({ x: currX, y: currY });
      continue;
    }

    // Right wall bounce
    if (nextX > BOARD_WIDTH - BUBBLE_RADIUS) {
      const distToWall = (BOARD_WIDTH - BUBBLE_RADIUS - currX) / dirX;
      currX = BOARD_WIDTH - BUBBLE_RADIUS;
      currY += dirY * distToWall;
      dirX = -dirX;
      remainingDist -= distToWall;
      points.push({ x: currX, y: currY });
      continue;
    }

    points.push({ x: nextX, y: nextY });
    break;
  }

  return points;
}

/**
 * Fires the current bubble along the current aim angle
 */
export function fireCurrentBubble(state: FarmFruitBubbleState): FarmFruitBubbleState {
  if (state.gameOver || state.gameWon || state.flyingBubble !== null) {
    return state;
  }

  const speed = 920; // px/s
  const rad = ((state.aimAngleDeg - 90) * Math.PI) / 180;
  const vx = Math.cos(rad) * speed;
  const vy = Math.sin(rad) * speed;

  const flying: FlyingBubble = {
    type: state.currentBubble,
    x: SLINGSHOT_X,
    y: SLINGSHOT_Y,
    vx,
    vy,
  };

  return {
    ...state,
    flyingBubble: flying,
    shotsFired: state.shotsFired + 1,
  };
}

/**
 * Updates flying bubble position and tests collisions
 */
export function updateFlyingBubble(
  state: FarmFruitBubbleState,
  dtSeconds: number
): { state: FarmFruitBubbleState; event: 'none' | 'pop' | 'land' | 'gameover' | 'levelclear' } {
  if (!state.flyingBubble) {
    return { state, event: 'none' };
  }

  const flying = { ...state.flyingBubble };
  let newX = flying.x + flying.vx * dtSeconds;
  let newY = flying.y + flying.vy * dtSeconds;
  let newVx = flying.vx;

  // Wall bounce
  if (newX <= BUBBLE_RADIUS) {
    newX = BUBBLE_RADIUS;
    newVx = Math.abs(newVx);
  } else if (newX >= BOARD_WIDTH - BUBBLE_RADIUS) {
    newX = BOARD_WIDTH - BUBBLE_RADIUS;
    newVx = -Math.abs(newVx);
  }

  flying.x = newX;
  flying.y = newY;
  flying.vx = newVx;

  // Check top ceiling collision
  if (newY <= BUBBLE_RADIUS + 10) {
    const snapResult = snapBubbleToGrid(state.grid, flying);
    return resolveGridAfterSnap(state, snapResult.row, snapResult.col, flying.type);
  }

  // Check collision with existing bubbles
  const hitCell = checkGridCollision(state.grid, flying.x, flying.y);
  if (hitCell) {
    const snapResult = snapBubbleToGrid(state.grid, flying);
    return resolveGridAfterSnap(state, snapResult.row, snapResult.col, flying.type);
  }

  return {
    state: {
      ...state,
      flyingBubble: flying,
    },
    event: 'none',
  };
}

/**
 * Checks if a point (x, y) collides with any occupied grid bubble
 */
function checkGridCollision(grid: (FruitType | null)[][], x: number, y: number): boolean {
  for (let r = 0; r < grid.length; r++) {
    const isOdd = r % 2 === 1;
    const cols = isOdd ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== null) {
        const center = getCellCenter(r, c);
        const dist = Math.hypot(x - center.x, y - center.y);
        if (dist <= BUBBLE_DIAMETER - 4) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * Snaps a flying bubble to the nearest empty valid grid slot
 */
export function snapBubbleToGrid(
  grid: (FruitType | null)[][],
  flying: FlyingBubble
): { row: number; col: number } {
  let closestRow = 0;
  let closestCol = 0;
  let minDist = Infinity;

  for (let r = 0; r < grid.length; r++) {
    const isOdd = r % 2 === 1;
    const cols = isOdd ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === null) {
        const center = getCellCenter(r, c);
        const dist = Math.hypot(flying.x - center.x, flying.y - center.y);
        if (dist < minDist) {
          minDist = dist;
          closestRow = r;
          closestCol = c;
        }
      }
    }
  }
  return { row: closestRow, col: closestCol };
}

/**
 * Returns neighbor cells for a hex grid cell (row, col)
 */
export function getHexNeighbors(row: number, col: number, grid: (FruitType | null)[][]): { r: number; c: number }[] {
  const isOdd = row % 2 === 1;
  const neighbors: { r: number; c: number }[] = [];

  // Same row left / right
  neighbors.push({ r: row, c: col - 1 }, { r: row, c: col + 1 });

  // Top / bottom rows
  if (isOdd) {
    neighbors.push(
      { r: row - 1, c: col },
      { r: row - 1, c: col + 1 },
      { r: row + 1, c: col },
      { r: row + 1, c: col + 1 }
    );
  } else {
    neighbors.push(
      { r: row - 1, c: col - 1 },
      { r: row - 1, c: col },
      { r: row + 1, c: col - 1 },
      { r: row + 1, c: col }
    );
  }

  // Filter valid bounds
  return neighbors.filter(({ r, c }) => {
    if (r < 0 || r >= grid.length) return false;
    const cols = r % 2 === 1 ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
    return c >= 0 && c < cols;
  });
}

/**
 * Finds all connected bubbles of the same type via BFS
 */
export function findConnectedCluster(
  grid: (FruitType | null)[][],
  startRow: number,
  startCol: number,
  type: FruitType
): { r: number; c: number }[] {
  const visited = new Set<string>();
  const queue: { r: number; c: number }[] = [{ r: startRow, c: startCol }];
  visited.add(`${startRow},${startCol}`);
  const cluster: { r: number; c: number }[] = [];

  while (queue.length > 0) {
    const curr = queue.shift()!;
    cluster.push(curr);

    const neighbors = getHexNeighbors(curr.r, curr.c, grid);
    for (const n of neighbors) {
      const key = `${n.r},${n.c}`;
      if (!visited.has(key) && grid[n.r][n.c] === type) {
        visited.add(key);
        queue.push(n);
      }
    }
  }

  return cluster;
}

/**
 * Finds floating disconnected bubbles not anchored to the ceiling (row 0)
 */
export function findDisconnectedBubbles(grid: (FruitType | null)[][]): { r: number; c: number; type: FruitType }[] {
  const connected = new Set<string>();
  const queue: { r: number; c: number }[] = [];

  // Seed with all occupied bubbles in row 0 (anchored to top)
  const cols0 = BOARD_COLS_EVEN;
  for (let c = 0; c < cols0; c++) {
    if (grid[0][c] !== null) {
      connected.add(`0,${c}`);
      queue.push({ r: 0, c });
    }
  }

  // Traverse all connected to ceiling
  while (queue.length > 0) {
    const curr = queue.shift()!;
    const neighbors = getHexNeighbors(curr.r, curr.c, grid);
    for (const n of neighbors) {
      const key = `${n.r},${n.c}`;
      if (!connected.has(key) && grid[n.r][n.c] !== null) {
        connected.add(key);
        queue.push(n);
      }
    }
  }

  // All occupied cells NOT in connected are orphans
  const orphans: { r: number; c: number; type: FruitType }[] = [];
  for (let r = 0; r < grid.length; r++) {
    const cols = r % 2 === 1 ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] !== null && !connected.has(`${r},${c}`)) {
        orphans.push({ r, c, type: grid[r][c]! });
      }
    }
  }

  return orphans;
}

/**
 * Resolves grid match, cluster popping, gravity drop, and ceiling descent after snap
 */
export function resolveGridAfterSnap(
  state: FarmFruitBubbleState,
  row: number,
  col: number,
  type: FruitType
): { state: FarmFruitBubbleState; event: 'pop' | 'land' | 'gameover' | 'levelclear' } {
  // 1. Insert into grid
  const newGrid = state.grid.map((r) => [...r]);
  newGrid[row][col] = type;

  // 2. Check cluster of matching fruits
  const cluster = findConnectedCluster(newGrid, row, col, type);
  let newScore = state.score;
  let newCombo = state.combo;
  let event: 'pop' | 'land' | 'gameover' | 'levelclear' = 'land';
  let popCount = 0;
  const newDroppingFruits: DroppingFruit[] = [...state.droppingFruits];

  if (cluster.length >= 3) {
    event = 'pop';
    popCount = cluster.length;
    newCombo += 1;
    const basePoints = cluster.length * FRUIT_DEFS[type].points;
    const comboBonus = (newCombo - 1) * 60;
    newScore += basePoints + comboBonus;

    // Remove popped cluster from grid
    cluster.forEach(({ r, c }) => {
      newGrid[r][c] = null;
    });

    // 3. Find any disconnected orphan bubbles that fall down
    const orphans = findDisconnectedBubbles(newGrid);
    orphans.forEach(({ r, c, type: orphanType }) => {
      newGrid[r][c] = null;
      const center = getCellCenter(r, c);
      newDroppingFruits.push({
        id: `drop-${Date.now()}-${r}-${c}-${Math.random()}`,
        type: orphanType,
        x: center.x,
        y: center.y,
        vx: (Math.random() - 0.5) * 120,
        vy: 120 + Math.random() * 80,
      });
      newScore += 120; // Gravity bonus points!
    });
  } else {
    newCombo = 0;
  }

  // 4. Check if level is cleared
  let remainingBubbles = 0;
  let lowestOccupiedY = 0;

  for (let r = 0; r < newGrid.length; r++) {
    const cols = r % 2 === 1 ? BOARD_COLS_ODD : BOARD_COLS_EVEN;
    for (let c = 0; c < cols; c++) {
      if (newGrid[r][c] !== null) {
        remainingBubbles++;
        const center = getCellCenter(r, c);
        lowestOccupiedY = Math.max(lowestOccupiedY, center.y);
      }
    }
  }

  if (remainingBubbles === 0) {
    newScore += 1500;
    return {
      state: {
        ...state,
        grid: newGrid,
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
        flyingBubble: null,
        currentBubble: state.nextBubble,
        nextBubble: getRandomFruit(),
        gameWon: true,
        combo: newCombo,
        maxCombo: Math.max(state.maxCombo, newCombo),
        droppingFruits: newDroppingFruits,
        lastPopCount: popCount,
      },
      event: 'levelclear',
    };
  }

  // 5. Check if bubbles have touched the danger line
  if (lowestOccupiedY >= DANGER_LINE_Y) {
    return {
      state: {
        ...state,
        grid: newGrid,
        score: newScore,
        highScore: Math.max(state.highScore, newScore),
        flyingBubble: null,
        gameOver: true,
        droppingFruits: newDroppingFruits,
        lastPopCount: popCount,
      },
      event: 'gameover',
    };
  }

  // 6. Ceiling descent countdown on non-pop shots
  let shotsUntilDescent = state.shotsUntilDescent;
  if (cluster.length < 3) {
    shotsUntilDescent -= 1;
    if (shotsUntilDescent <= 0) {
      shotsUntilDescent = 5;
      // Push ceiling down by 1 row
      const newTopRow: (FruitType | null)[] = [];
      for (let c = 0; c < BOARD_COLS_EVEN; c++) {
        newTopRow.push(getRandomFruit());
      }
      newGrid.unshift(newTopRow);
      if (newGrid.length > 12) {
        newGrid.pop();
      }
    }
  }

  const finalState: FarmFruitBubbleState = {
    ...state,
    grid: newGrid,
    score: newScore,
    highScore: Math.max(state.highScore, newScore),
    flyingBubble: null,
    currentBubble: state.nextBubble,
    nextBubble: getRandomFruit(),
    shotsUntilDescent,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
    droppingFruits: newDroppingFruits,
    lastPopCount: popCount,
  };

  return { state: finalState, event };
}

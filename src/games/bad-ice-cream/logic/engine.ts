import {
  BadIceCreamInput,
  BadIceCreamPlayer,
  BadIceCreamState,
  EnemyEntity,
  FruitItem,
  TileType,
} from './types';

export const GRID_COLS = 15;
export const GRID_ROWS = 11;
export const TOTAL_ICE_CREAM_LEVELS = 3;
export const PLAYER_SPEED = 4.0; // Grid cells per second
export const ENEMY_SPEED = 2.4;

export function createEmptyGrid(cols: number, rows: number): TileType[][] {
  const grid: TileType[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: TileType[] = [];
    for (let c = 0; c < cols; c++) {
      if (r === 0 || r === rows - 1 || c === 0 || c === cols - 1) {
        row.push('wall');
      } else {
        row.push('empty');
      }
    }
    grid.push(row);
  }
  return grid;
}

export function getIceCreamLevelConfig(levelIndex: number): {
  walls: [number, number][]; // [row, col]
  initialIce: [number, number][];
  playerStart: [number, number];
  enemies: { x: number; y: number; dirX: number; dirY: number; type: 'fox' | 'wolf' }[];
  fruits: { x: number; y: number; type: 'strawberry' | 'banana' | 'watermelon' | 'grape'; wave: number }[];
} {
  switch (levelIndex) {
    case 1:
      return {
        walls: [
          [2, 3], [2, 11],
          [4, 5], [4, 6], [4, 8], [4, 9],
          [6, 5], [6, 6], [6, 8], [6, 9],
          [8, 3], [8, 11],
        ],
        initialIce: [
          [3, 7], [7, 7],
        ],
        playerStart: [5, 7],
        enemies: [
          { x: 2, y: 2, dirX: 1, dirY: 0, type: 'fox' },
          { x: 12, y: 8, dirX: -1, dirY: 0, type: 'fox' },
        ],
        fruits: [
          // Wave 1: Strawberries
          { x: 2, y: 4, type: 'strawberry', wave: 1 },
          { x: 12, y: 4, type: 'strawberry', wave: 1 },
          { x: 2, y: 6, type: 'strawberry', wave: 1 },
          { x: 12, y: 6, type: 'strawberry', wave: 1 },
          { x: 7, y: 2, type: 'strawberry', wave: 1 },
          { x: 7, y: 8, type: 'strawberry', wave: 1 },
          // Wave 2: Bananas
          { x: 4, y: 2, type: 'banana', wave: 2 },
          { x: 10, y: 2, type: 'banana', wave: 2 },
          { x: 4, y: 8, type: 'banana', wave: 2 },
          { x: 10, y: 8, type: 'banana', wave: 2 },
        ],
      };

    case 2:
      return {
        walls: [
          [2, 5], [2, 9],
          [3, 2], [3, 12],
          [5, 4], [5, 10],
          [7, 2], [7, 12],
          [8, 5], [8, 9],
        ],
        initialIce: [
          [4, 7], [6, 7], [5, 2], [5, 12]
        ],
        playerStart: [5, 7],
        enemies: [
          { x: 2, y: 2, dirX: 1, dirY: 0, type: 'fox' },
          { x: 12, y: 2, dirX: 0, dirY: 1, type: 'fox' },
          { x: 7, y: 8, dirX: -1, dirY: 0, type: 'wolf' },
        ],
        fruits: [
          // Wave 1: Watermelons
          { x: 3, y: 5, type: 'watermelon', wave: 1 },
          { x: 3, y: 9, type: 'watermelon', wave: 1 },
          { x: 7, y: 5, type: 'watermelon', wave: 1 },
          { x: 7, y: 9, type: 'watermelon', wave: 1 },
          { x: 2, y: 7, type: 'watermelon', wave: 1 },
          { x: 8, y: 7, type: 'watermelon', wave: 1 },
          // Wave 2: Grapes
          { x: 1, y: 1, type: 'grape', wave: 2 },
          { x: 13, y: 1, type: 'grape', wave: 2 },
          { x: 1, y: 9, type: 'grape', wave: 2 },
          { x: 13, y: 9, type: 'grape', wave: 2 },
        ],
      };

    case 3:
    default:
      return {
        walls: [
          [2, 2], [2, 4], [2, 10], [2, 12],
          [4, 6], [4, 8],
          [6, 6], [6, 8],
          [8, 2], [8, 4], [8, 10], [8, 12],
        ],
        initialIce: [
          [3, 3], [3, 11], [7, 3], [7, 11],
          [5, 5], [5, 9]
        ],
        playerStart: [5, 7],
        enemies: [
          { x: 2, y: 1, dirX: 0, dirY: 1, type: 'wolf' },
          { x: 12, y: 1, dirX: 0, dirY: 1, type: 'wolf' },
          { x: 1, y: 9, dirX: 1, dirY: 0, type: 'fox' },
          { x: 13, y: 9, dirX: -1, dirY: 0, type: 'fox' },
        ],
        fruits: [
          // Wave 1: Strawberries & Bananas
          { x: 3, y: 2, type: 'strawberry', wave: 1 },
          { x: 11, y: 2, type: 'strawberry', wave: 1 },
          { x: 3, y: 8, type: 'strawberry', wave: 1 },
          { x: 11, y: 8, type: 'strawberry', wave: 1 },
          { x: 5, y: 3, type: 'banana', wave: 1 },
          { x: 5, y: 11, type: 'banana', wave: 1 },
          // Wave 2: Grapes & Watermelons
          { x: 1, y: 5, type: 'watermelon', wave: 2 },
          { x: 13, y: 5, type: 'watermelon', wave: 2 },
          { x: 7, y: 5, type: 'grape', wave: 2 },
          { x: 7, y: 9, type: 'grape', wave: 2 },
        ],
      };
  }
}

export function initBadIceCreamGame(levelIndex: number = 1, currentScore: number = 0, currentLives: number = 3): BadIceCreamState {
  const config = getIceCreamLevelConfig(levelIndex);
  const grid = createEmptyGrid(GRID_COLS, GRID_ROWS);

  // Set walls
  for (const [r, c] of config.walls) {
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      grid[r][c] = 'wall';
    }
  }

  // Set initial ice
  for (const [r, c] of config.initialIce) {
    if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
      grid[r][c] = 'ice';
    }
  }

  const [pr, pc] = config.playerStart;
  const player: BadIceCreamPlayer = {
    x: pc,
    y: pr,
    targetX: pc,
    targetY: pr,
    facingX: 0,
    facingY: 1, // Facing down initially
    isMoving: false,
    lives: currentLives,
    score: currentScore,
  };

  const enemies: EnemyEntity[] = config.enemies.map((e, idx) => ({
    id: `e-${idx}`,
    x: e.x,
    y: e.y,
    dirX: e.dirX,
    dirY: e.dirY,
    speed: e.type === 'wolf' ? ENEMY_SPEED * 1.2 : ENEMY_SPEED,
    type: e.type,
  }));

  const fruits: FruitItem[] = config.fruits.map((f, idx) => ({
    id: `f-${idx}`,
    x: f.x,
    y: f.y,
    type: f.type,
    collected: false,
    wave: f.wave,
  }));

  return {
    levelIndex,
    gridCols: GRID_COLS,
    gridRows: GRID_ROWS,
    grid,
    player,
    enemies,
    fruits,
    currentWave: 1,
    status: 'playing',
    totalLevels: TOTAL_ICE_CREAM_LEVELS,
  };
}

export function executeIceBreath(state: BadIceCreamState): { grid: TileType[][]; actionType: 'create' | 'break' | 'none' } {
  const { player, gridCols, gridRows } = state;
  const newGrid = state.grid.map((r) => [...r]);
  const startC = Math.round(player.x) + player.facingX;
  const startR = Math.round(player.y) + player.facingY;

  // Boundary check
  if (startR < 0 || startR >= gridRows || startC < 0 || startC >= gridCols) {
    return { grid: newGrid, actionType: 'none' };
  }

  const firstTile = newGrid[startR][startC];

  if (firstTile === 'ice') {
    // Break line of ice blocks
    let c = startC;
    let r = startR;
    while (r >= 0 && r < gridRows && c >= 0 && c < gridCols && newGrid[r][c] === 'ice') {
      newGrid[r][c] = 'empty';
      c += player.facingX;
      r += player.facingY;
    }
    return { grid: newGrid, actionType: 'break' };
  } else if (firstTile === 'empty') {
    // Create line of ice blocks until wall or obstacle
    let c = startC;
    let r = startR;
    while (r >= 0 && r < gridRows && c >= 0 && c < gridCols && newGrid[r][c] === 'empty') {
      // Don't build ice on top of an enemy
      const enemyOnTile = state.enemies.some(
        (e) => Math.hypot(e.x - c, e.y - r) < 0.6
      );
      if (enemyOnTile) break;

      newGrid[r][c] = 'ice';
      c += player.facingX;
      r += player.facingY;
    }
    return { grid: newGrid, actionType: 'create' };
  }

  return { grid: newGrid, actionType: 'none' };
}

export function stepBadIceCreamGame(
  state: BadIceCreamState,
  input: BadIceCreamInput,
  dt: number
): { state: BadIceCreamState; event?: 'ice_create' | 'ice_break' | 'fruit_eaten' | 'hit' | 'clear' | 'victory' } {
  if (state.status !== 'playing') {
    return { state };
  }

  const safeDt = Math.min(dt, 0.05);
  let event: 'ice_create' | 'ice_break' | 'fruit_eaten' | 'hit' | 'clear' | 'victory' | undefined;
  let newGrid = state.grid;

  // 1. Handle Ice Breath Action
  if (input.action) {
    const breathResult = executeIceBreath(state);
    newGrid = breathResult.grid;
    if (breathResult.actionType === 'create') event = 'ice_create';
    if (breathResult.actionType === 'break') event = 'ice_break';
  }

  // 2. Handle Player Movement
  const player: BadIceCreamPlayer = { ...state.player };
  const currentGridX = Math.round(player.x);
  const currentGridY = Math.round(player.y);

  if (input.moveX !== undefined && input.moveX !== 0) {
    player.facingX = input.moveX > 0 ? 1 : -1;
    player.facingY = 0;
  } else if (input.moveY !== undefined && input.moveY !== 0) {
    player.facingY = input.moveY > 0 ? 1 : -1;
    player.facingX = 0;
  }

  // Smooth grid movement
  if (player.isMoving) {
    const dx = player.targetX - player.x;
    const dy = player.targetY - player.y;
    const dist = Math.hypot(dx, dy);
    const stepDist = PLAYER_SPEED * safeDt;

    if (dist <= stepDist) {
      player.x = player.targetX;
      player.y = player.targetY;
      player.isMoving = false;
    } else {
      player.x += (dx / dist) * stepDist;
      player.y += (dy / dist) * stepDist;
    }
  } else {
    // Try to initiate move to next cell
    const targetC = currentGridX + player.facingX;
    const targetR = currentGridY + player.facingY;

    if (
      (input.moveX !== 0 || input.moveY !== 0) &&
      targetR >= 0 &&
      targetR < state.gridRows &&
      targetC >= 0 &&
      targetC < state.gridCols
    ) {
      const targetTile = newGrid[targetR][targetC];
      if (targetTile === 'empty') {
        player.targetX = targetC;
        player.targetY = targetR;
        player.isMoving = true;
      }
    }
  }

  // 3. Fruit Collection
  const fruits = state.fruits.map((f) => ({ ...f }));
  for (const fruit of fruits) {
    if (!fruit.collected && fruit.wave === state.currentWave) {
      const dist = Math.hypot(player.x - fruit.x, player.y - fruit.y);
      if (dist < 0.6) {
        fruit.collected = true;
        player.score += 50;
        event = 'fruit_eaten';
      }
    }
  }

  // Check Wave / Level completion
  let currentWave = state.currentWave;
  const activeWaveFruits = fruits.filter((f) => f.wave === currentWave);
  const waveCleared = activeWaveFruits.every((f) => f.collected);

  let status: BadIceCreamState['status'] = state.status;
  if (waveCleared) {
    const maxWave = Math.max(...fruits.map((f) => f.wave));
    if (currentWave < maxWave) {
      currentWave += 1;
    } else {
      // All waves cleared!
      if (state.levelIndex >= state.totalLevels) {
        status = 'victory';
        event = 'victory';
      } else {
        status = 'level_cleared';
        event = 'clear';
      }
    }
  }

  // 4. Enemy AI & Movement
  const enemies = state.enemies.map((e) => {
    let ex = e.x;
    let ey = e.y;
    let dirX = e.dirX;
    let dirY = e.dirY;

    const nextX = ex + dirX * e.speed * safeDt;
    const nextY = ey + dirY * e.speed * safeDt;

    // Check collision with walls or ice
    const checkC = Math.round(nextX + dirX * 0.4);
    const checkR = Math.round(nextY + dirY * 0.4);

    const isBlocked =
      checkR < 0 ||
      checkR >= state.gridRows ||
      checkC < 0 ||
      checkC >= state.gridCols ||
      newGrid[checkR][checkC] !== 'empty';

    if (isBlocked) {
      // Pick random alternate direction
      const choices: [number, number][] = [
        [1, 0], [-1, 0], [0, 1], [0, -1]
      ].filter(([dx, dy]) => !(dx === dirX && dy === dirY) && !(dx === -dirX && dy === -dirY)) as [number, number][];

      const validChoices = choices.filter(([dx, dy]) => {
        const testC = Math.round(ex + dx * 0.8);
        const testR = Math.round(ey + dy * 0.8);
        return (
          testR >= 0 &&
          testR < state.gridRows &&
          testC >= 0 &&
          testC < state.gridCols &&
          newGrid[testR][testC] === 'empty'
        );
      });

      if (validChoices.length > 0) {
        const pick = validChoices[Math.floor(Math.random() * validChoices.length)];
        dirX = pick[0];
        dirY = pick[1];
      } else {
        dirX = -dirX;
        dirY = -dirY;
      }
    } else {
      ex = nextX;
      ey = nextY;
    }

    return {
      ...e,
      x: ex,
      y: ey,
      dirX,
      dirY,
    };
  });

  // 5. Enemy collision with Player
  if (status === 'playing') {
    for (const enemy of enemies) {
      const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
      if (dist < 0.65) {
        player.lives -= 1;
        event = 'hit';
        if (player.lives <= 0) {
          status = 'game_over';
        } else {
          // Reset player to center safe position
          const config = getIceCreamLevelConfig(state.levelIndex);
          player.x = config.playerStart[1];
          player.y = config.playerStart[0];
          player.targetX = player.x;
          player.targetY = player.y;
          player.isMoving = false;
        }
        break;
      }
    }
  }

  return {
    state: {
      ...state,
      grid: newGrid,
      player,
      enemies,
      fruits,
      currentWave,
      status,
    },
    event,
  };
}

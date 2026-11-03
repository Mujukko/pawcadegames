import {
  PacChickState,
  TileType,
  Direction,
  Fox,
} from './types';

export const GRID_COLS = 19;
export const GRID_ROWS = 21;
export const PLAYER_SPEED = 4.2; // tiles per second
export const FOX_SPEED = 3.6;
export const FRIGHTENED_SPEED = 2.4;

// 19 x 21 Farm Maze Grid
// 1 = wall, 2 = dot, 3 = power, 0 = empty, 4 = fox gate
const MAZE_TEMPLATE: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,3,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,2,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,1,1,1,2,1,1,1,0,1,0,1,1,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0], // Side tunnel
  [1,1,1,1,2,1,0,1,1,4,1,1,0,1,2,1,1,1,1],
  [0,0,0,0,2,0,0,1,0,0,0,1,0,0,2,0,0,0,0], // Den center
  [1,1,1,1,2,1,0,1,1,1,1,1,0,1,2,1,1,1,1],
  [0,0,0,1,2,1,0,0,0,0,0,0,0,1,2,1,0,0,0], // Side tunnel
  [1,1,1,1,2,1,2,1,1,1,1,1,2,1,2,1,1,1,1],
  [1,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,1],
  [1,2,1,1,2,1,1,1,2,1,2,1,1,1,2,1,1,2,1],
  [1,3,2,1,2,2,2,2,2,0,2,2,2,2,2,1,2,3,1],
  [1,1,2,1,2,1,2,1,1,1,1,1,2,1,2,1,2,1,1],
  [1,2,2,2,2,1,2,2,2,1,2,2,2,1,2,2,2,2,1],
  [1,2,1,1,1,1,1,1,2,1,2,1,1,1,1,1,1,2,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

export function getInitialGrid(): { grid: TileType[][]; dotCount: number } {
  let dotCount = 0;
  const grid: TileType[][] = [];

  for (let r = 0; r < GRID_ROWS; r++) {
    const row: TileType[] = [];
    for (let c = 0; c < GRID_COLS; c++) {
      const val = MAZE_TEMPLATE[r][c];
      if (val === 1) row.push('wall');
      else if (val === 2) {
        row.push('dot');
        dotCount++;
      } else if (val === 3) {
        row.push('power');
        dotCount++;
      } else if (val === 4) row.push('gate');
      else row.push('empty');
    }
    grid.push(row);
  }

  return { grid, dotCount };
}

export function createPacChickGame(highScore = 0): PacChickState {
  const { grid, dotCount } = getInitialGrid();

  const foxes: Fox[] = [
    { id: 'fox_red', name: 'Rusty', color: '#ef4444', x: 9, y: 8, dir: 'up', targetDir: 'up', mode: 'chase', frightenedTimer: 0 },
    { id: 'fox_pink', name: 'Pip', color: '#f472b6', x: 8, y: 10, dir: 'up', targetDir: 'up', mode: 'chase', frightenedTimer: 0 },
    { id: 'fox_cyan', name: 'Sly', color: '#38bdf8', x: 9, y: 10, dir: 'up', targetDir: 'up', mode: 'chase', frightenedTimer: 0 },
    { id: 'fox_orange', name: 'Barnaby', color: '#fb923c', x: 10, y: 10, dir: 'up', targetDir: 'up', mode: 'chase', frightenedTimer: 0 },
  ];

  return {
    status: 'ready',
    score: 0,
    highScore,
    lives: 3,
    level: 1,
    dotsRemaining: dotCount,
    grid,
    player: {
      x: 9,
      y: 16,
      dir: 'left',
      nextDir: 'left',
      mouthAngle: 0.2,
    },
    foxes,
    fruit: null,
    events: [],
  };
}

export function setPacChickDirection(state: PacChickState, dir: Direction): PacChickState {
  if (state.status === 'game_over' || state.status === 'victory') return state;

  return {
    ...state,
    status: 'playing',
    player: {
      ...state.player,
      nextDir: dir,
    },
  };
}

function canMoveInDir(grid: TileType[][], x: number, y: number, dir: Direction): boolean {
  let targetCol = Math.round(x);
  let targetRow = Math.round(y);

  if (dir === 'up') targetRow -= 1;
  else if (dir === 'down') targetRow += 1;
  else if (dir === 'left') targetCol -= 1;
  else if (dir === 'right') targetCol += 1;

  // Screen wrap corridors
  if (targetCol < 0 || targetCol >= GRID_COLS) return true;
  if (targetRow < 0 || targetRow >= GRID_ROWS) return false;

  const tile = grid[targetRow][targetCol];
  return tile !== 'wall' && tile !== 'gate';
}

export function updatePacChickGame(state: PacChickState, rawDt: number): PacChickState {
  if (state.status !== 'playing' && state.status !== 'frightened') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: PacChickState['events'] = [];
  let status: PacChickState['status'] = state.status;
  let score = state.score;
  let highScore = state.highScore;
  let dotsRemaining = state.dotsRemaining;
  let lives = state.lives;

  const grid = state.grid.map((row) => [...row]);
  const player = { ...state.player };

  // Animate Clucky's gobble mouth
  player.mouthAngle = (Math.sin(Date.now() * 0.015) + 1) * 0.25;

  // Turn buffering check: can player turn into queued direction?
  const isCentered =
    Math.abs(player.x - Math.round(player.x)) < 0.15 &&
    Math.abs(player.y - Math.round(player.y)) < 0.15;

  if (isCentered && player.nextDir !== player.dir) {
    if (canMoveInDir(grid, Math.round(player.x), Math.round(player.y), player.nextDir)) {
      player.dir = player.nextDir;
      player.x = Math.round(player.x);
      player.y = Math.round(player.y);
    }
  }

  // Move Clucky
  const moveSpeed = PLAYER_SPEED * dt;
  if (canMoveInDir(grid, player.x, player.y, player.dir)) {
    if (player.dir === 'up') player.y -= moveSpeed;
    else if (player.dir === 'down') player.y += moveSpeed;
    else if (player.dir === 'left') player.x -= moveSpeed;
    else if (player.dir === 'right') player.x += moveSpeed;
  } else {
    // Snap to grid when hitting a wall
    player.x = Math.round(player.x);
    player.y = Math.round(player.y);
  }

  // Screen wrap tunnels
  if (player.x < -0.5) player.x = GRID_COLS - 0.5;
  else if (player.x > GRID_COLS - 0.5) player.x = -0.5;

  // Eat Corn Kernel / Power Pellet
  const pCol = Math.round(player.x);
  const pRow = Math.round(player.y);

  let powerTriggered = false;
  if (pCol >= 0 && pCol < GRID_COLS && pRow >= 0 && pRow < GRID_ROWS) {
    const tile = grid[pRow][pCol];
    if (tile === 'dot') {
      grid[pRow][pCol] = 'empty';
      score += 10;
      dotsRemaining--;
      events.push({ type: 'waka' });
    } else if (tile === 'power') {
      grid[pRow][pCol] = 'empty';
      score += 50;
      dotsRemaining--;
      powerTriggered = true;
      status = 'frightened';
      events.push({ type: 'power' });
    }
  }

  if (score > highScore) highScore = score;

  // Update Foxes AI
  const foxes = state.foxes.map((fox) => {
    const f = { ...fox };

    if (powerTriggered) {
      f.mode = 'frightened';
      f.frightenedTimer = 8.0; // 8 seconds frightened
    } else if (f.mode === 'frightened') {
      f.frightenedTimer -= dt;
      if (f.frightenedTimer <= 0) {
        f.mode = 'chase';
      }
    }

    const curSpeed = (f.mode === 'frightened' ? FRIGHTENED_SPEED : FOX_SPEED) * dt;

    // Fox movement & AI junction decision
    const fCentered =
      Math.abs(f.x - Math.round(f.x)) < 0.12 &&
      Math.abs(f.y - Math.round(f.y)) < 0.12;

    if (fCentered) {
      f.x = Math.round(f.x);
      f.y = Math.round(f.y);

      // Available directions (no 180 flip unless dead end)
      const dirs: Direction[] = ['up', 'down', 'left', 'right'];
      const opposite: Record<Direction, Direction> = {
        up: 'down',
        down: 'up',
        left: 'right',
        right: 'left',
        none: 'none',
      };

      const validDirs = dirs.filter((d) => {
        if (d === opposite[f.dir]) return false;
        return canMoveInDir(grid, f.x, f.y, d);
      });

      if (validDirs.length > 0) {
        if (f.mode === 'chase') {
          // Greedily choose direction minimizing distance to Clucky
          let bestDir = validDirs[0];
          let bestDist = Infinity;
          for (const d of validDirs) {
            let nx = f.x + (d === 'left' ? -1 : d === 'right' ? 1 : 0);
            let ny = f.y + (d === 'up' ? -1 : d === 'down' ? 1 : 0);
            const dist = Math.hypot(nx - player.x, ny - player.y);
            if (dist < bestDist) {
              bestDist = dist;
              bestDir = d;
            }
          }
          f.dir = bestDir;
        } else {
          // Frightened: pick random valid turn
          f.dir = validDirs[Math.floor(Math.random() * validDirs.length)];
        }
      } else {
        // Reverse if dead end
        f.dir = opposite[f.dir];
      }
    }

    // Step fox
    if (f.dir === 'up') f.y -= curSpeed;
    else if (f.dir === 'down') f.y += curSpeed;
    else if (f.dir === 'left') f.x -= curSpeed;
    else if (f.dir === 'right') f.x += curSpeed;

    return f;
  });

  // Check Fox Collision with Player
  for (const fox of foxes) {
    const dist = Math.hypot(fox.x - player.x, fox.y - player.y);
    if (dist < 0.75) {
      if (fox.mode === 'frightened') {
        // Clucky gobbles the fox!
        score += 200;
        fox.mode = 'chase';
        fox.x = 9;
        fox.y = 10;
        events.push({ type: 'eat_ghost' });
      } else {
        // Clucky caught by fox!
        lives -= 1;
        events.push({ type: 'die' });
        if (lives <= 0) {
          status = 'game_over';
        } else {
          // Reset positions
          player.x = 9;
          player.y = 16;
          player.dir = 'left';
          player.nextDir = 'left';
        }
        break;
      }
    }
  }

  // Victory check: all dots cleared!
  if (dotsRemaining <= 0) {
    status = 'victory';
    events.push({ type: 'level_clear' });
  }

  return {
    ...state,
    status,
    score,
    highScore,
    dotsRemaining,
    lives,
    grid,
    player,
    foxes,
    events,
  };
}

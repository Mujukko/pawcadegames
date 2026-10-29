import {
  CoinModel,
  CrossyChickenState,
  LaneModel,
  LaneType,
  ObstacleModel,
  PlayerModel,
} from './types';

export const GRID_COLS = 9;
export const CELL_WIDTH = 44.44; // 400 / 9
export const LANE_HEIGHT = 44;
export const IDLE_LIMIT = 4.0; // seconds before hawk swoops

let nextObstacleId = 1;
let nextCoinId = 1;

export function getLaneY(laneIndex: number): number {
  return -laneIndex * LANE_HEIGHT;
}

export function getColX(colIndex: number): number {
  return colIndex * CELL_WIDTH + CELL_WIDTH / 2;
}

function generateObstaclesForLane(
  type: LaneType,
  direction: 1 | -1,
  speed: number
): ObstacleModel[] {
  const obstacles: ObstacleModel[] = [];
  if (type === 'road') {
    const carCount = 2 + Math.floor(Math.random() * 2);
    const spacing = 400 / carCount;
    const colors = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#8b5cf6'];
    for (let i = 0; i < carCount; i++) {
      const isTruck = Math.random() > 0.65;
      obstacles.push({
        id: nextObstacleId++,
        x: i * spacing + Math.random() * 30,
        width: isTruck ? 68 : 46,
        height: 28,
        speed: speed * direction,
        type: isTruck ? 'truck' : 'car',
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  } else if (type === 'river') {
    const logCount = 2;
    const spacing = 220;
    for (let i = 0; i < logCount; i++) {
      obstacles.push({
        id: nextObstacleId++,
        x: i * spacing + Math.random() * 40,
        width: 76 + Math.floor(Math.random() * 2) * 24, // 76 or 100
        height: 32,
        speed: speed * direction,
        type: 'log',
      });
    }
  }
  return obstacles;
}

export function generateLane(index: number): LaneModel {
  // First 3 lanes are always safe grass
  if (index <= 2) {
    return {
      index,
      type: 'grass',
      y: getLaneY(index),
      obstacles: [],
      direction: 1,
      speed: 0,
    };
  }

  // Determine lane type by probabilistic weights
  const rand = Math.random();
  let type: LaneType = 'road';
  if (rand < 0.28) type = 'grass';
  else if (rand < 0.65) type = 'road';
  else if (rand < 0.88) type = 'river';
  else type = 'railroad';

  const direction: 1 | -1 = Math.random() > 0.5 ? 1 : -1;
  const speed =
    type === 'road'
      ? 55 + Math.random() * 65
      : type === 'river'
      ? 45 + Math.random() * 40
      : 0;

  const lane: LaneModel = {
    index,
    type,
    y: getLaneY(index),
    obstacles: generateObstaclesForLane(type, direction, speed),
    direction,
    speed,
    trainWarningTimer: type === 'railroad' ? 3.0 + Math.random() * 4.0 : undefined,
    isTrainPassing: false,
  };

  return lane;
}

export function createInitialState(highScore = 0): CrossyChickenState {
  const lanes: LaneModel[] = [];
  const coins: CoinModel[] = [];

  // Generate initial 25 lanes
  for (let i = 0; i < 25; i++) {
    lanes.push(generateLane(i));
    // Chance to spawn coin on grass or road lanes
    if (i > 2 && Math.random() < 0.25) {
      const coinCol = Math.floor(Math.random() * GRID_COLS);
      coins.push({
        id: nextCoinId++,
        x: getColX(coinCol),
        y: getLaneY(i),
        collected: false,
      });
    }
  }

  const initialPlayer: PlayerModel = {
    x: getColX(4),
    y: getLaneY(0),
    gridX: 4,
    gridY: 0,
    targetX: getColX(4),
    targetY: getLaneY(0),
    isHopping: false,
    hopProgress: 1,
    direction: 'up',
    dead: false,
  };

  return {
    player: initialPlayer,
    lanes,
    coins,
    cameraY: 0,
    distance: 0,
    score: 0,
    highScore,
    coinsCount: 0,
    idleTimer: 0,
    hawkActive: false,
    hawkY: -100,
    isGameOver: false,
    events: [],
  };
}

export function hop(
  state: CrossyChickenState,
  dir: 'up' | 'down' | 'left' | 'right'
): CrossyChickenState {
  if (state.player.dead || state.isGameOver) return state;

  state.idleTimer = 0; // Reset idle timer on player hop
  state.player.direction = dir;

  let newGridX = state.player.gridX;
  let newGridY = state.player.gridY;

  if (dir === 'up') newGridY += 1;
  else if (dir === 'down') newGridY = Math.max(0, newGridY - 1);
  else if (dir === 'left') newGridX = Math.max(0, newGridX - 1);
  else if (dir === 'right') newGridX = Math.min(GRID_COLS - 1, newGridX + 1);

  state.player.gridX = newGridX;
  state.player.gridY = newGridY;
  state.player.targetX = getColX(newGridX);
  state.player.targetY = getLaneY(newGridY);
  state.player.isHopping = true;
  state.player.hopProgress = 0;

  // Update distance & score
  if (newGridY > state.distance) {
    state.distance = newGridY;
    state.score = newGridY;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
  }

  // Generate more lanes if nearing edge
  const maxLaneIndex = Math.max(...state.lanes.map((l) => l.index));
  if (newGridY + 15 > maxLaneIndex) {
    for (let i = maxLaneIndex + 1; i <= maxLaneIndex + 15; i++) {
      state.lanes.push(generateLane(i));
      if (Math.random() < 0.25) {
        state.coins.push({
          id: nextCoinId++,
          x: getColX(Math.floor(Math.random() * GRID_COLS)),
          y: getLaneY(i),
          collected: false,
        });
      }
    }
    // Prune very old lanes far behind player
    state.lanes = state.lanes.filter((l) => l.index >= newGridY - 12);
  }

  state.events.push({
    type: 'hop',
    direction: dir,
    gridX: newGridX,
    gridY: newGridY,
    score: state.score,
  });

  return state;
}

export function updateEngine(
  state: CrossyChickenState,
  dt: number
): CrossyChickenState {
  state.events = [];
  if (state.isGameOver) return state;

  // 1. Update player hop animation
  if (state.player.isHopping) {
    state.player.hopProgress += dt * 8.5; // ~0.12s hop duration
    if (state.player.hopProgress >= 1) {
      state.player.hopProgress = 1;
      state.player.isHopping = false;
      state.player.x = state.player.targetX;
      state.player.y = state.player.targetY;
    } else {
      state.player.x += (state.player.targetX - state.player.x) * Math.min(1, dt * 18);
      state.player.y += (state.player.targetY - state.player.y) * Math.min(1, dt * 18);
    }
  }

  // 2. Camera smooth tracking
  const targetCamY = state.player.y + 160;
  state.cameraY += (targetCamY - state.cameraY) * Math.min(1, dt * 6);

  // 3. Idle timer & Hawk swoop
  if (!state.player.dead) {
    state.idleTimer += dt;
    if (state.idleTimer >= IDLE_LIMIT && !state.hawkActive) {
      state.hawkActive = true;
      state.hawkY = state.player.y - 250;
      state.events.push({ type: 'hawk_swoop' });
    }
  }

  if (state.hawkActive) {
    state.hawkY += 380 * dt;
    if (state.hawkY >= state.player.y && !state.player.dead) {
      state.player.dead = true;
      state.player.deathReason = 'hawk';
      state.isGameOver = true;
      state.events.push({ type: 'death', reason: 'hawk', score: state.score });
    }
  }

  // 4. Update lanes and obstacles
  const currentLane = state.lanes.find((l) => l.index === state.player.gridY);

  for (const lane of state.lanes) {
    // Road & River obstacles
    for (const obs of lane.obstacles) {
      obs.x += obs.speed * dt;
      // Wrap around screen boundaries with margin
      if (obs.speed > 0 && obs.x > 450) {
        obs.x = -obs.width - 20;
      } else if (obs.speed < 0 && obs.x < -obs.width - 20) {
        obs.x = 450;
      }
    }

    // Railroad signals & train pass
    if (lane.type === 'railroad' && lane.trainWarningTimer !== undefined) {
      lane.trainWarningTimer -= dt;
      if (lane.trainWarningTimer <= 1.2 && lane.trainWarningTimer > 0) {
        if (!lane.isTrainPassing) {
          state.events.push({ type: 'train_warning', laneIndex: lane.index });
        }
      } else if (lane.trainWarningTimer <= 0) {
        if (!lane.isTrainPassing) {
          lane.isTrainPassing = true;
          state.events.push({ type: 'train_pass', laneIndex: lane.index });
          // Spawn speeding train obstacle
          lane.obstacles = [
            {
              id: nextObstacleId++,
              x: lane.direction > 0 ? -400 : 800,
              width: 380,
              height: 36,
              speed: lane.direction * 520, // High-speed train
              type: 'train',
            },
          ];
        }
      }

      // Check if train finished passing
      if (lane.isTrainPassing && lane.obstacles.length > 0) {
        const train = lane.obstacles[0];
        if (
          (lane.direction > 0 && train.x > 500) ||
          (lane.direction < 0 && train.x < -500)
        ) {
          lane.obstacles = [];
          lane.isTrainPassing = false;
          lane.trainWarningTimer = 4.0 + Math.random() * 5.0; // Reset timer
        }
      }
    }
  }

  // 5. Collision checks & River raft riding
  if (!state.player.dead && !state.player.isHopping && currentLane) {
    // 5A. Road collision (cars & trucks)
    if (currentLane.type === 'road') {
      for (const car of currentLane.obstacles) {
        const pBox = {
          left: state.player.x - 14,
          right: state.player.x + 14,
          top: state.player.y - 14,
          bottom: state.player.y + 14,
        };
        const cBox = {
          left: car.x,
          right: car.x + car.width,
          top: currentLane.y - car.height / 2,
          bottom: currentLane.y + car.height / 2,
        };

        if (
          pBox.right > cBox.left &&
          pBox.left < cBox.right &&
          pBox.bottom > cBox.top &&
          pBox.top < cBox.bottom
        ) {
          state.player.dead = true;
          state.player.deathReason = 'car';
          state.isGameOver = true;
          state.events.push({ type: 'death', reason: 'car', score: state.score });
          break;
        }
      }
    }

    // 5B. River collision (must stand on a log)
    else if (currentLane.type === 'river') {
      let onLog = false;
      let ridingLogSpeed = 0;

      for (const log of currentLane.obstacles) {
        if (
          state.player.x >= log.x - 4 &&
          state.player.x <= log.x + log.width + 4
        ) {
          onLog = true;
          ridingLogSpeed = log.speed;
          break;
        }
      }

      if (onLog) {
        // Drift with log
        state.player.x += ridingLogSpeed * dt;
        state.player.targetX = state.player.x;

        // Check if carried off-screen
        if (state.player.x < -10 || state.player.x > 410) {
          state.player.dead = true;
          state.player.deathReason = 'drown';
          state.isGameOver = true;
          state.events.push({ type: 'death', reason: 'drown', score: state.score });
        }
      } else {
        // Drown in river
        state.player.dead = true;
        state.player.deathReason = 'drown';
        state.isGameOver = true;
        state.events.push({ type: 'death', reason: 'drown', score: state.score });
      }
    }

    // 5C. Railroad collision (train)
    else if (currentLane.type === 'railroad' && currentLane.isTrainPassing) {
      for (const train of currentLane.obstacles) {
        if (
          state.player.x >= train.x &&
          state.player.x <= train.x + train.width
        ) {
          state.player.dead = true;
          state.player.deathReason = 'train';
          state.isGameOver = true;
          state.events.push({ type: 'death', reason: 'train', score: state.score });
          break;
        }
      }
    }
  }

  // 6. Coin collection
  if (!state.player.dead) {
    for (const coin of state.coins) {
      if (!coin.collected) {
        const dist = Math.hypot(state.player.x - coin.x, state.player.y - coin.y);
        if (dist <= 22) {
          coin.collected = true;
          state.coinsCount++;
          state.score += 50;
          if (state.score > state.highScore) {
            state.highScore = state.score;
          }
          state.events.push({
            type: 'coin_collect',
            coinsCount: state.coinsCount,
            score: state.score,
          });
        }
      }
    }
  }

  return state;
}

export function restartGame(state: CrossyChickenState): CrossyChickenState {
  const next = createInitialState(state.highScore);
  next.events.push({ type: 'restart' });
  return next;
}

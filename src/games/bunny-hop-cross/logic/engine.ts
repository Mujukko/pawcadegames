import {
  BunnyHopEvent,
  BunnyHopState,
  BunnyState,
  Direction,
  GRID_COLS,
  IDLE_HAWK_LIMIT,
  LaneConfig,
  LaneType,
  MAX_LIVES,
  MovingEntity,
  ObstacleEntity,
  StageConfig,
} from './types';

export const STAGE_CONFIGS: StageConfig[] = [
  { stage: 1, name: 'Peaceful Pasture', totalRows: 20, theme: 'pasture' },
  { stage: 2, name: 'Autumn Orchard Highway', totalRows: 24, theme: 'orchard' },
  { stage: 3, name: 'Railroad Junction', totalRows: 28, theme: 'railroad' },
  { stage: 4, name: 'Grand Barnyard Jubilee', totalRows: 32, theme: 'jubilee' },
];

/**
 * Generate handcrafted, balanced lanes for each stage.
 */
export function generateStageLanes(stageNum: number): LaneConfig[] {
  const config = STAGE_CONFIGS[(stageNum - 1) % STAGE_CONFIGS.length];
  const totalRows = config.totalRows;
  const lanes: LaneConfig[] = [];

  for (let r = 0; r < totalRows; r++) {
    // Row 0 is always safe starting grass
    if (r === 0) {
      lanes.push({
        row: r,
        type: 'grass',
        speed: 0,
        obstacles: [],
        collectibles: [],
        movingEntities: [],
      });
      continue;
    }

    // Top row is finish farm gate grass
    if (r === totalRows - 1) {
      lanes.push({
        row: r,
        type: 'grass',
        speed: 0,
        obstacles: [],
        collectibles: [],
        movingEntities: [],
      });
      continue;
    }

    // Determine lane type based on stage patterns
    let type: LaneType = 'grass';
    const patternIndex = r % 8;

    if (stageNum === 1) {
      if (patternIndex === 2 || patternIndex === 3) type = 'road';
      else if (patternIndex === 5 || patternIndex === 6) type = 'river';
      else type = 'grass';
    } else if (stageNum === 2) {
      if (patternIndex === 1 || patternIndex === 2 || patternIndex === 3) type = 'road';
      else if (patternIndex === 5 || patternIndex === 6 || patternIndex === 7) type = 'river';
      else type = 'grass';
    } else if (stageNum === 3) {
      if (patternIndex === 1 || patternIndex === 2) type = 'road';
      else if (patternIndex === 3) type = 'railroad';
      else if (patternIndex === 5 || patternIndex === 6) type = 'river';
      else type = 'grass';
    } else {
      // Stage 4
      if (patternIndex === 1 || patternIndex === 2 || patternIndex === 3) type = 'road';
      else if (patternIndex === 4) type = 'railroad';
      else if (patternIndex === 6 || patternIndex === 7) type = 'river';
      else type = 'grass';
    }

    const obstacles: ObstacleEntity[] = [];
    const collectibles = [];
    const movingEntities: MovingEntity[] = [];
    let speed = 0;

    if (type === 'grass') {
      // Occasional tree obstacle (ensure at least 2 clear paths)
      const obstacleCols = [1, 7, 3];
      if (r % 3 === 0) {
        const obsCol = obstacleCols[r % obstacleCols.length];
        obstacles.push({ id: `obs_${r}_${obsCol}`, col: obsCol, type: 'tree' });
      }

      // Collectible carrots on some grass lanes
      if (r % 2 === 1) {
        const carrotCol = (r * 3 + 2) % GRID_COLS;
        if (!obstacles.some((o) => o.col === carrotCol)) {
          collectibles.push({
            id: `carrot_${r}`,
            col: carrotCol,
            type: r % 4 === 0 ? ('golden_carrot' as const) : ('carrot' as const),
            collected: false,
          });
        }
      }
    } else if (type === 'road') {
      const isRight = r % 2 === 0;
      speed = (isRight ? 1 : -1) * (1.8 + (stageNum * 0.3) + ((r % 3) * 0.4));
      const vehicleType = r % 3 === 0 ? 'grain_truck' : r % 2 === 0 ? 'tractor' : 'pickup';
      const width = vehicleType === 'grain_truck' ? 2.2 : 1.4;

      // 2 to 3 vehicles spaced across the road
      const spacing = 4.2;
      for (let i = 0; i < 3; i++) {
        movingEntities.push({
          id: `road_${r}_veh_${i}`,
          x: (i * spacing + (r * 1.5)) % (GRID_COLS + 6) - 3,
          width,
          speed,
          type: vehicleType,
        });
      }
    } else if (type === 'river') {
      const isRight = r % 2 === 1;
      speed = (isRight ? 1 : -1) * (1.4 + (stageNum * 0.25) + ((r % 2) * 0.3));
      const logType = r % 3 === 0 ? 'lily_pad' : r % 2 === 0 ? 'log_large' : 'log_small';
      const width = logType === 'log_large' ? 2.6 : logType === 'log_small' ? 1.8 : 1.1;

      // 3 to 4 logs/pads floating down the creek
      const spacing = 3.6;
      for (let i = 0; i < 4; i++) {
        movingEntities.push({
          id: `river_${r}_log_${i}`,
          x: (i * spacing + (r * 2.1)) % (GRID_COLS + 6) - 3,
          width,
          speed,
          type: logType,
        });
      }
    } else if (type === 'railroad') {
      speed = 0; // Train moves only when rushing
    }

    lanes.push({
      row: r,
      type,
      speed,
      obstacles,
      collectibles,
      movingEntities,
      trainWarningTimer: type === 'railroad' ? 5.0 + (r % 3) * 1.5 : undefined,
      trainRushing: false,
      trainX: -8,
    });
  }

  return lanes;
}

export function createInitialBunny(gridX = 4, gridY = 0): BunnyState {
  return {
    gridX,
    gridY,
    visualX: gridX,
    visualY: gridY,
    hopProgress: 1,
    isHopping: false,
    facing: 'up',
    ridingEntityId: null,
    alive: true,
  };
}

export function createInitialState(stage = 1, highScore = 0): BunnyHopState {
  const lanes = generateStageLanes(stage);
  return {
    bunny: createInitialBunny(4, 0),
    lanes,
    score: 0,
    carrots: 0,
    maxRowReached: 0,
    idleTimer: 0,
    lives: MAX_LIVES,
    stage,
    totalStages: STAGE_CONFIGS.length,
    gameOver: false,
    stageComplete: false,
    gameComplete: false,
    highScore,
    events: [],
  };
}

export function moveBunny(state: BunnyHopState, dir: Direction): BunnyHopState {
  if (state.gameOver || state.stageComplete || state.gameComplete || !state.bunny.alive) {
    return state;
  }

  const events: BunnyHopEvent[] = [];
  let nextGridX = state.bunny.gridX;
  let nextGridY = state.bunny.gridY;

  if (dir === 'up') nextGridY += 1;
  else if (dir === 'down') nextGridY = Math.max(0, nextGridY - 1);
  else if (dir === 'left') nextGridX = Math.max(0, nextGridX - 1);
  else if (dir === 'right') nextGridX = Math.min(GRID_COLS - 1, nextGridX + 1);

  // If outside row bounds
  if (nextGridY >= state.lanes.length) {
    return state;
  }

  const targetLane = state.lanes[nextGridY];

  // Check obstacle collision (trees/boulders)
  if (targetLane && targetLane.obstacles.some((o) => o.col === nextGridX)) {
    return state; // Blocked by obstacle
  }

  events.push({ type: 'hop', facing: dir });

  // Update max row and score
  let nextMaxRow = state.maxRowReached;
  let nextScore = state.score;
  let nextIdleTimer = state.idleTimer;

  if (nextGridY > nextMaxRow) {
    const rowsJumped = nextGridY - nextMaxRow;
    nextScore += rowsJumped * 10;
    nextMaxRow = nextGridY;
    nextIdleTimer = 0; // Reset idle timer when making forward progress
  }

  // Check collectible carrots on target lane
  let nextCarrots = state.carrots;
  const updatedLanes = state.lanes.map((lane) => {
    if (lane.row !== nextGridY) return lane;
    const nextCollectibles = lane.collectibles.map((item) => {
      if (item.col === nextGridX && !item.collected) {
        const points = item.type === 'golden_carrot' ? 150 : 50;
        nextScore += points;
        nextCarrots += 1;
        events.push({ type: 'carrot_collect', points, isGolden: item.type === 'golden_carrot' });
        return { ...item, collected: true };
      }
      return item;
    });
    return { ...lane, collectibles: nextCollectibles };
  });

  // Check stage clear if reached finish row
  let nextStageComplete = false;
  let nextGameComplete = false;
  if (nextGridY >= updatedLanes.length - 1) {
    nextStageComplete = true;
    nextScore += 500 * state.stage; // Stage clear bonus
    events.push({ type: 'stage_clear', stage: state.stage, score: nextScore });

    if (state.stage >= state.totalStages) {
      nextGameComplete = true;
      events.push({ type: 'game_complete', finalScore: nextScore });
    }
  }

  const nextHighScore = Math.max(state.highScore, nextScore);

  return {
    ...state,
    bunny: {
      ...state.bunny,
      gridX: nextGridX,
      gridY: nextGridY,
      facing: dir,
      isHopping: true,
      hopProgress: 0,
      ridingEntityId: null, // Re-evaluated when landing
    },
    lanes: updatedLanes,
    score: nextScore,
    carrots: nextCarrots,
    maxRowReached: nextMaxRow,
    idleTimer: nextIdleTimer,
    highScore: nextHighScore,
    stageComplete: nextStageComplete,
    gameComplete: nextGameComplete,
    events,
  };
}

function findSafeGrassRow(lanes: LaneConfig[], targetRow: number): number {
  for (let r = targetRow; r >= 0; r--) {
    if (lanes[r] && lanes[r].type === 'grass') {
      return r;
    }
  }
  return 0;
}

export function updateEngine(state: BunnyHopState, dt: number): BunnyHopState {
  if (state.gameOver || state.stageComplete || state.gameComplete) {
    return state;
  }

  const clampedDt = Math.min(dt, 0.05);
  const events: BunnyHopEvent[] = [];

  // 1. Update all moving entities across all lanes
  const updatedLanes: LaneConfig[] = state.lanes.map((lane) => {
    if (lane.type === 'road' || lane.type === 'river') {
      const updatedEntities = lane.movingEntities.map((ent) => {
        let newX = ent.x + ent.speed * clampedDt;
        // Wrap around screen bounds with generous padding
        if (ent.speed > 0 && newX > GRID_COLS + 2) {
          newX = -ent.width - 2;
        } else if (ent.speed < 0 && newX < -ent.width - 2) {
          newX = GRID_COLS + 2;
        }
        return { ...ent, x: newX };
      });
      return { ...lane, movingEntities: updatedEntities };
    }

    if (lane.type === 'railroad') {
      let timer = (lane.trainWarningTimer ?? 5.0) - clampedDt;
      let rushing = lane.trainRushing ?? false;
      let trainX = lane.trainX ?? -10;

      if (timer <= 0) {
        if (!rushing) {
          // Warning period ended, trigger train rush
          rushing = true;
          trainX = -8;
          timer = 2.5; // rush lasts 2.5s
        } else {
          // Rush ended, reset for next pass
          rushing = false;
          trainX = -10;
          timer = 6.0 + Math.random() * 3.0;
        }
      }

      if (rushing) {
        trainX += 20 * clampedDt; // Zoom across
      }

      return {
        ...lane,
        trainWarningTimer: timer,
        trainRushing: rushing,
        trainX,
      };
    }

    return lane;
  });

  // 2. Update bunny hopping animation
  let bunny = { ...state.bunny };
  if (bunny.isHopping) {
    const hopSpeed = 8.0; // hops finish in ~0.125s
    const nextProgress = Math.min(1, bunny.hopProgress + clampedDt * hopSpeed);
    bunny.hopProgress = nextProgress;

    // Lerp visual position toward grid target
    bunny.visualX = bunny.visualX + (bunny.gridX - bunny.visualX) * Math.min(1, clampedDt * 18);
    bunny.visualY = bunny.visualY + (bunny.gridY - bunny.visualY) * Math.min(1, clampedDt * 18);

    if (nextProgress >= 1) {
      bunny.isHopping = false;
      bunny.visualX = bunny.gridX;
      bunny.visualY = bunny.gridY;
    }
  }

  // 3. Check idle timer (Hawk patrol)
  let nextIdleTimer = state.idleTimer + clampedDt;
  let lifeLost = false;
  let deathReason: 'crash' | 'splash' | 'hawk' | null = null;

  if (nextIdleTimer >= IDLE_HAWK_LIMIT) {
    lifeLost = true;
    deathReason = 'hawk';
    events.push({ type: 'hawk_swoop' });
  }

  // 4. Collision and water checks when on the lane
  const currentLane = updatedLanes[bunny.gridY];
  if (!lifeLost && currentLane) {
    if (currentLane.type === 'road') {
      // Check collision with vehicles
      const bunnyHitbox = { left: bunny.visualX + 0.15, right: bunny.visualX + 0.85 };
      for (const veh of currentLane.movingEntities) {
        const vehLeft = veh.x;
        const vehRight = veh.x + veh.width;
        if (bunnyHitbox.left < vehRight && bunnyHitbox.right > vehLeft) {
          lifeLost = true;
          deathReason = 'crash';
          events.push({ type: 'crash' });
          break;
        }
      }
    } else if (currentLane.type === 'river') {
      // Must be on a log or lily pad
      const bunnyCenter = bunny.visualX + 0.5;
      let onPlatform: MovingEntity | null = null;

      for (const ent of currentLane.movingEntities) {
        if (bunnyCenter >= ent.x && bunnyCenter <= ent.x + ent.width) {
          onPlatform = ent;
          break;
        }
      }

      if (onPlatform) {
        // Bunny rides the platform! Drift with it
        bunny.ridingEntityId = onPlatform.id;
        bunny.visualX += onPlatform.speed * clampedDt;
        bunny.gridX = Math.round(bunny.visualX);

        // Check if carried offscreen
        if (bunny.visualX < -0.6 || bunny.visualX > GRID_COLS - 0.4) {
          lifeLost = true;
          deathReason = 'splash';
          events.push({ type: 'splash' });
        }
      } else if (!bunny.isHopping) {
        // Splashed into water!
        lifeLost = true;
        deathReason = 'splash';
        events.push({ type: 'splash' });
      }
    } else if (currentLane.type === 'railroad') {
      if (currentLane.trainRushing) {
        const trainLeft = currentLane.trainX ?? -10;
        const trainRight = trainLeft + 6.0; // Train length
        const bunnyLeft = bunny.visualX + 0.15;
        const bunnyRight = bunny.visualX + 0.85;

        if (bunnyLeft < trainRight && bunnyRight > trainLeft) {
          lifeLost = true;
          deathReason = 'crash';
          events.push({ type: 'crash' });
        }
      }
    }
  }

  // 5. Handle life deduction & respawn
  let nextLives = state.lives;
  let nextGameOver: boolean = state.gameOver;

  if (lifeLost) {
    nextLives -= 1;
    events.push({ type: 'life_lost', remainingLives: nextLives });

    if (nextLives <= 0) {
      nextGameOver = true;
      events.push({ type: 'game_over', finalScore: state.score });
      bunny.alive = false;
    } else {
      // Respawn at safest lower grass row
      const safeRow = findSafeGrassRow(updatedLanes, Math.max(0, bunny.gridY - 1));
      bunny = createInitialBunny(4, safeRow);
      nextIdleTimer = 0;
    }
  }

  return {
    ...state,
    bunny,
    lanes: updatedLanes,
    idleTimer: nextIdleTimer,
    lives: nextLives,
    gameOver: nextGameOver,
    events,
  };
}

export function restartStage(state: BunnyHopState): BunnyHopState {
  const lanes = generateStageLanes(state.stage);
  return {
    ...state,
    bunny: createInitialBunny(4, 0),
    lanes,
    maxRowReached: 0,
    idleTimer: 0,
    lives: MAX_LIVES,
    gameOver: false,
    stageComplete: false,
    gameComplete: false,
    events: [],
  };
}

export function nextStage(state: BunnyHopState): BunnyHopState {
  const nextStageNum = Math.min(state.totalStages, state.stage + 1);
  const lanes = generateStageLanes(nextStageNum);
  return {
    ...state,
    stage: nextStageNum,
    bunny: createInitialBunny(4, 0),
    lanes,
    maxRowReached: 0,
    idleTimer: 0,
    stageComplete: false,
    gameComplete: false,
    events: [],
  };
}

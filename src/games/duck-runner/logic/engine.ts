import {
  BoundingBox,
  DEFAULT_DUCK_CONFIG,
  DUCK_DIMENSIONS,
  DuckRunnerConfig,
  DuckRunnerState,
  Obstacle,
  ObstacleType,
} from './types';

/**
 * Creates a fresh, clean initial game state for Duck Runner.
 */
export function createInitialState(
  savedHighScore: number = 0,
  config: DuckRunnerConfig = DEFAULT_DUCK_CONFIG
): DuckRunnerState {
  const groundY = config.canvasHeight - config.groundHeight;
  const duckHeight = DUCK_DIMENSIONS.standing.height;
  const duckWidth = DUCK_DIMENSIONS.standing.width;

  return {
    score: 0,
    highScore: savedHighScore,
    distance: 0,
    speed: config.initialSpeed,
    groundY,

    duckX: 60,
    duckY: groundY - duckHeight,
    duckVelocityY: 0,
    isGrounded: true,
    isCrouching: false,
    duckWidth,
    duckHeight,

    obstacles: [],
    nextObstacleDistance: 450,
    obstacleIdCounter: 1,

    isStarted: false,
    isGameOver: false,

    isNightMode: false,
    nightTransitionAlpha: 0,

    lastMilestoneScore: 0,
    pendingSoundEvents: [],
  };
}

/**
 * Triggers a jump impulse if the duck is on the ground.
 */
export function jump(
  state: DuckRunnerState,
  config: DuckRunnerConfig = DEFAULT_DUCK_CONFIG
): DuckRunnerState {
  if (state.isGameOver) return state;

  // Auto-start on first jump input if not already running
  const startedState: DuckRunnerState = !state.isStarted
    ? { ...state, isStarted: true }
    : state;

  if (!startedState.isGrounded) return startedState;

  return {
    ...startedState,
    duckVelocityY: config.jumpForce,
    isGrounded: false,
    isCrouching: false,
    duckWidth: DUCK_DIMENSIONS.standing.width,
    duckHeight: DUCK_DIMENSIONS.standing.height,
    pendingSoundEvents: [...startedState.pendingSoundEvents, 'jump'],
  };
}

/**
 * Starts crouching / ducking down.
 * If in mid-air, crouching activates fast-fall gravity (just like Chrome Dino!).
 */
export function startCrouch(state: DuckRunnerState): DuckRunnerState {
  if (state.isGameOver) return state;

  // If already crouching, no-op
  if (state.isCrouching) return state;

  const newHeight = DUCK_DIMENSIONS.crouching.height;
  const newWidth = DUCK_DIMENSIONS.crouching.width;

  return {
    ...state,
    isCrouching: true,
    duckWidth: newWidth,
    duckHeight: newHeight,
    duckY: state.isGrounded ? state.groundY - newHeight : state.duckY,
    pendingSoundEvents: state.isGrounded
      ? [...state.pendingSoundEvents, 'duck']
      : state.pendingSoundEvents,
  };
}

/**
 * Stops crouching and restores standing dimensions.
 */
export function stopCrouch(state: DuckRunnerState): DuckRunnerState {
  if (!state.isCrouching) return state;

  const newHeight = DUCK_DIMENSIONS.standing.height;
  const newWidth = DUCK_DIMENSIONS.standing.width;

  return {
    ...state,
    isCrouching: false,
    duckWidth: newWidth,
    duckHeight: newHeight,
    duckY: state.isGrounded ? state.groundY - newHeight : state.duckY,
  };
}

/**
 * Returns the active collision bounding box for the duck (with forgiving padding).
 */
export function getDuckHitbox(state: DuckRunnerState): BoundingBox {
  const padX = 6;
  const padY = 4;
  return {
    x: state.duckX + padX,
    y: state.duckY + padY,
    width: Math.max(8, state.duckWidth - padX * 2),
    height: Math.max(8, state.duckHeight - padY * 2),
  };
}

/**
 * Returns the collision bounding box for an obstacle (with forgiving padding).
 */
export function getObstacleHitbox(obstacle: Obstacle): BoundingBox {
  const padX = 5;
  const padY = 5;
  return {
    x: obstacle.x + padX,
    y: obstacle.y + padY,
    width: Math.max(8, obstacle.width - padX * 2),
    height: Math.max(8, obstacle.height - padY * 2),
  };
}

/**
 * Axis-Aligned Bounding Box (AABB) intersection check.
 */
export function checkCollision(b1: BoundingBox, b2: BoundingBox): boolean {
  return (
    b1.x < b2.x + b2.width &&
    b1.x + b1.width > b2.x &&
    b1.y < b2.y + b2.height &&
    b1.y + b1.height > b2.y
  );
}

/**
 * Generates an obstacle based on the current score progression.
 */
export function createObstacle(
  type: ObstacleType,
  id: number,
  groundY: number,
  canvasWidth: number
): Obstacle {
  switch (type) {
    case 'hay_bale_single':
      return {
        id,
        type,
        x: canvasWidth + 10,
        y: groundY - 34,
        width: 32,
        height: 34,
      };
    case 'hay_bale_double':
      return {
        id,
        type,
        x: canvasWidth + 10,
        y: groundY - 36,
        width: 58,
        height: 36,
      };
    case 'fence_post':
      return {
        id,
        type,
        x: canvasWidth + 10,
        y: groundY - 46,
        width: 38,
        height: 46,
      };
    case 'flying_crow_low':
      // Flying low: must be jumped over!
      return {
        id,
        type,
        x: canvasWidth + 10,
        y: groundY - 52,
        width: 42,
        height: 28,
        speedMultiplier: 1.15,
        frame: 0,
      };
    case 'flying_crow_high':
      // Flying at duck head level: duck can slide underneath while crouching!
      return {
        id,
        type,
        x: canvasWidth + 10,
        y: groundY - 56,
        width: 44,
        height: 26,
        speedMultiplier: 1.18,
        frame: 0,
      };
  }
}

/**
 * Picks a random obstacle type based on the score tier.
 */
export function pickRandomObstacleType(score: number): ObstacleType {
  // Early game: simple ground obstacles (hay bales, fences)
  if (score < 150) {
    return Math.random() < 0.65 ? 'hay_bale_single' : 'fence_post';
  }
  // Mid game: introduce double hay bales and flying crows
  if (score < 350) {
    const r = Math.random();
    if (r < 0.4) return 'hay_bale_single';
    if (r < 0.7) return 'fence_post';
    if (r < 0.85) return 'hay_bale_double';
    return 'flying_crow_high';
  }
  // Late game: full diversity including low and high crows
  const r = Math.random();
  if (r < 0.25) return 'hay_bale_single';
  if (r < 0.45) return 'hay_bale_double';
  if (r < 0.65) return 'fence_post';
  if (r < 0.85) return 'flying_crow_high';
  return 'flying_crow_low';
}

/**
 * Main game simulation update function.
 * Moves duck physics, shifts obstacles, updates score and speeds, checks collisions.
 */
export function updateGame(
  state: DuckRunnerState,
  dt: number,
  config: DuckRunnerConfig = DEFAULT_DUCK_CONFIG
): DuckRunnerState {
  if (!state.isStarted || state.isGameOver) {
    return state;
  }

  // Cap dt to prevent massive simulation jumps (e.g. tab switching)
  const clampedDt = Math.min(0.08, Math.max(0.001, dt));

  // 1. Update distance & score
  const newDistance = state.distance + state.speed * clampedDt;
  const newScore = Math.floor(newDistance / 10);
  const newHighScore = Math.max(state.highScore, newScore);

  // 2. Milestone check (every 100 points)
  const soundEvents: Array<'jump' | 'duck' | 'milestone' | 'hit' | 'quack'> = [
    ...state.pendingSoundEvents,
  ];
  let newLastMilestone = state.lastMilestoneScore;
  const prevHundred = Math.floor(state.score / 100);
  const newHundred = Math.floor(newScore / 100);
  if (newHundred > prevHundred && newScore >= 100) {
    soundEvents.push('milestone');
    newLastMilestone = newHundred * 100;
  }

  // 3. Progressive Speed Increase
  const speedBoost = Math.floor(newScore / 100) * config.speedIncrement;
  const targetSpeed = Math.min(config.maxSpeed, config.initialSpeed + speedBoost);

  // 4. Day / Night Cycle (transitions every 600 points)
  const cycleIndex = Math.floor(newScore / 600);
  const isNight = cycleIndex % 2 === 1;
  const targetAlpha = isNight ? 1 : 0;
  const currentAlpha = state.nightTransitionAlpha;
  const newAlpha =
    currentAlpha < targetAlpha
      ? Math.min(1, currentAlpha + clampedDt * 0.8)
      : Math.max(0, currentAlpha - clampedDt * 0.8);

  // 5. Duck Vertical Physics
  // Fast fall if crouching in the air!
  const currentGravity =
    state.isCrouching && !state.isGrounded ? config.fastFallGravity : config.gravity;

  let newVelocityY = state.duckVelocityY + currentGravity * clampedDt;
  let newDuckY = state.duckY + newVelocityY * clampedDt;
  let isGrounded = false;

  const targetHeight = state.isCrouching
    ? DUCK_DIMENSIONS.crouching.height
    : DUCK_DIMENSIONS.standing.height;
  const floorY = state.groundY - targetHeight;

  if (newDuckY >= floorY) {
    newDuckY = floorY;
    newVelocityY = 0;
    isGrounded = true;
  }

  // 6. Obstacle Spawning & Movement
  let newObstacles: Obstacle[] = [];
  let nextDistance = state.nextObstacleDistance - state.speed * clampedDt;
  let counter = state.obstacleIdCounter;

  // Move existing obstacles
  for (const obs of state.obstacles) {
    const obsSpeed = state.speed * (obs.speedMultiplier || 1);
    const updatedX = obs.x - obsSpeed * clampedDt;
    // Animate wing flap for flying crows
    const updatedFrame =
      obs.type.startsWith('flying_crow') && obs.frame !== undefined
        ? (obs.frame + clampedDt * 10) % 2
        : obs.frame;

    // Keep if still on screen
    if (updatedX + obs.width > -20) {
      newObstacles.push({
        ...obs,
        x: updatedX,
        frame: updatedFrame,
      });
    }
  }

  // Spawn new obstacle when distance threshold is reached
  if (nextDistance <= 0) {
    const type = pickRandomObstacleType(newScore);
    const newObs = createObstacle(type, counter++, state.groundY, config.canvasWidth);
    newObstacles.push(newObs);

    // Random distance between obstacles (280px to 480px, scales with speed)
    const baseGap = 290 + Math.random() * 220;
    const speedRatio = state.speed / config.initialSpeed;
    nextDistance = baseGap * Math.min(1.4, Math.max(0.9, speedRatio));
  }

  // 7. Collision Detection
  const tempStateForHitbox: DuckRunnerState = {
    ...state,
    duckY: newDuckY,
    duckWidth: state.isCrouching
      ? DUCK_DIMENSIONS.crouching.width
      : DUCK_DIMENSIONS.standing.width,
    duckHeight: targetHeight,
  };
  const duckBox = getDuckHitbox(tempStateForHitbox);

  let isGameOver = false;
  for (const obs of newObstacles) {
    const obsBox = getObstacleHitbox(obs);
    if (checkCollision(duckBox, obsBox)) {
      isGameOver = true;
      soundEvents.push('hit');
      break;
    }
  }

  return {
    ...state,
    score: newScore,
    highScore: newHighScore,
    distance: newDistance,
    speed: targetSpeed,

    duckY: newDuckY,
    duckVelocityY: newVelocityY,
    isGrounded,
    duckHeight: targetHeight,
    duckWidth: state.isCrouching
      ? DUCK_DIMENSIONS.crouching.width
      : DUCK_DIMENSIONS.standing.width,

    obstacles: newObstacles,
    nextObstacleDistance: nextDistance,
    obstacleIdCounter: counter,

    isGameOver,
    isNightMode: isNight,
    nightTransitionAlpha: newAlpha,

    lastMilestoneScore: newLastMilestone,
    pendingSoundEvents: soundEvents,
  };
}

/**
 * Resets the game after game over while preserving high score.
 */
export function resetGame(
  state: DuckRunnerState,
  config: DuckRunnerConfig = DEFAULT_DUCK_CONFIG
): DuckRunnerState {
  const fresh = createInitialState(state.highScore, config);
  return {
    ...fresh,
    isStarted: true,
  };
}

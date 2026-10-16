import { ChickenState, FlappyGameState, GameEvent, ObstaclePipe } from './types';

export const GAME_WIDTH = 480;
export const GAME_HEIGHT = 640;
export const GROUND_Y = 560; // Bottom 80px is farm ground
export const CHICKEN_X = 110;
export const CHICKEN_RADIUS = 16;
export const GRAVITY = 950; // px/s^2
export const FLAP_VELOCITY = -340; // px/s
export const MAX_FALL_VELOCITY = 620; // px/s
export const PIPE_SPEED = 165; // px/s
export const PIPE_WIDTH = 68;
export const DEFAULT_PIPE_GAP = 148;
export const MIN_GAP_Y = 140;
export const MAX_GAP_Y = 420;
export const DEFAULT_WHEAT_GOAL = 15; // Pass 15 farm gates to reach Golden Wheat!

let nextPipeId = 1;

/**
 * Creates initial starting state
 */
export function createInitialState(
  savedBestScore: number = 0,
  wheatGoalPipes: number = DEFAULT_WHEAT_GOAL
): FlappyGameState {
  return {
    chicken: {
      x: CHICKEN_X,
      y: 260,
      vy: 0,
      radius: CHICKEN_RADIUS,
      rotation: 0,
      wingState: 'mid',
      alive: true,
    },
    pipes: [],
    score: 0,
    grains: 0,
    bestScore: savedBestScore,
    wheatGoalPipes,
    distanceRatio: 0,
    status: 'ready',
    isGameOver: false,
    hasWon: false,
    wheatFieldSpawned: false,
    wheatFieldX: 99999,
    timeAlive: 0,
  };
}

/**
 * Flap the chicken wings upward
 */
export function flap(state: FlappyGameState): { state: FlappyGameState; event: GameEvent | null } {
  if (state.isGameOver || state.hasWon) {
    return { state, event: null };
  }

  // If in 'ready' state, first flap starts the flight
  const newStatus = state.status === 'ready' ? 'playing' : state.status;

  const nextChicken: ChickenState = {
    ...state.chicken,
    vy: FLAP_VELOCITY,
    rotation: -0.45, // ~-26 degrees pitch up
    wingState: 'up',
  };

  return {
    state: {
      ...state,
      status: newStatus,
      chicken: nextChicken,
    },
    event: { type: 'cluck' },
  };
}

/**
 * Precise circle-to-rectangle intersection check
 */
export function circleIntersectsRect(
  cx: number,
  cy: number,
  r: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  // Find closest point on rectangle to circle center
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));

  const dx = cx - closestX;
  const dy = cy - closestY;

  return dx * dx + dy * dy < r * r;
}

/**
 * Spawns a new pipe obstacle pair
 */
export function createPipe(
  x: number,
  gapY?: number,
  gapHeight: number = DEFAULT_PIPE_GAP
): ObstaclePipe {
  const finalGapY =
    gapY !== undefined
      ? gapY
      : Math.floor(MIN_GAP_Y + Math.random() * (MAX_GAP_Y - MIN_GAP_Y));

  return {
    id: nextPipeId++,
    x,
    gapY: finalGapY,
    gapHeight,
    width: PIPE_WIDTH,
    passed: false,
    hasGrain: true,
    grainCollected: false,
    grainY: finalGapY,
  };
}

/**
 * Updates flappy chicken simulation by delta time (dt in seconds)
 */
export function updateGame(
  state: FlappyGameState,
  dt: number
): { state: FlappyGameState; events: GameEvent[] } {
  // Clamp dt to avoid physics spiral
  const clampedDt = Math.min(dt, 0.05);
  const events: GameEvent[] = [];

  // In 'ready' status, chicken hovers gently with a sine wave
  if (state.status === 'ready') {
    const time = state.timeAlive + clampedDt;
    const hoverY = 260 + Math.sin(time * 4) * 8;
    return {
      state: {
        ...state,
        timeAlive: time,
        chicken: {
          ...state.chicken,
          y: hoverY,
          vy: 0,
          rotation: 0,
          wingState: Math.sin(time * 8) > 0 ? 'mid' : 'down',
        },
      },
      events: [],
    };
  }

  if (state.isGameOver || state.hasWon) {
    return { state, events: [] };
  }

  // 1. Update Chicken Physics (Gravity, Velocity, Rotation)
  let vy = state.chicken.vy + GRAVITY * clampedDt;
  if (vy > MAX_FALL_VELOCITY) vy = MAX_FALL_VELOCITY;

  let y = state.chicken.y + vy * clampedDt;

  // Ceiling clamp
  if (y - state.chicken.radius <= 0) {
    y = state.chicken.radius;
    vy = 0;
  }

  // Rotation pitch based on velocity
  let rotation = state.chicken.rotation;
  if (vy < 0) {
    rotation = -0.45; // Pitched up
  } else {
    rotation = Math.min(1.2, rotation + clampedDt * 3.5); // Smoothly dip beak down (up to ~68 deg)
  }

  let wingState = state.chicken.wingState;
  if (vy > 100) {
    wingState = 'down';
  } else if (vy > -50) {
    wingState = 'mid';
  }

  // Ground collision check
  if (y + state.chicken.radius >= GROUND_Y) {
    y = GROUND_Y - state.chicken.radius;
    events.push({ type: 'hit_ground' });
    const finalScore = state.score;
    const finalBest = Math.max(state.bestScore, finalScore);
    return {
      state: {
        ...state,
        score: finalScore,
        bestScore: finalBest,
        status: 'gameover',
        isGameOver: true,
        chicken: {
          ...state.chicken,
          y,
          vy: 0,
          rotation: 0.8,
          alive: false,
        },
      },
      events,
    };
  }

  // 2. Move Pipes Leftward & Collision Check
  const updatedPipes: ObstaclePipe[] = [];
  let scoreGained = 0;
  let grainsCollected = state.grains;
  let collisionWithPipe = false;

  for (const pipe of state.pipes) {
    const nextX = pipe.x - PIPE_SPEED * clampedDt;

    // Check if pipe is completely offscreen
    if (nextX + pipe.width < -10) {
      continue; // Despawn
    }

    const updatedPipe = { ...pipe, x: nextX };

    // Check passing pipe
    if (!pipe.passed && nextX + pipe.width < state.chicken.x) {
      updatedPipe.passed = true;
      scoreGained += 1;
      events.push({ type: 'point' });
    }

    // Check grain collection in center of gap
    if (
      updatedPipe.hasGrain &&
      !updatedPipe.grainCollected &&
      Math.abs(nextX + pipe.width / 2 - state.chicken.x) < 22 &&
      Math.abs(updatedPipe.grainY - y) < 26
    ) {
      updatedPipe.grainCollected = true;
      grainsCollected += 1;
      events.push({ type: 'grain' });
    }

    // Collision check against upper & lower pipe rectangles
    const upperHeight = updatedPipe.gapY - updatedPipe.gapHeight / 2;
    const lowerY = updatedPipe.gapY + updatedPipe.gapHeight / 2;
    const lowerHeight = GROUND_Y - lowerY;

    const hitUpper = circleIntersectsRect(
      state.chicken.x,
      y,
      state.chicken.radius,
      updatedPipe.x,
      0,
      updatedPipe.width,
      upperHeight
    );

    const hitLower = circleIntersectsRect(
      state.chicken.x,
      y,
      state.chicken.radius,
      updatedPipe.x,
      lowerY,
      updatedPipe.width,
      lowerHeight
    );

    if (hitUpper || hitLower) {
      collisionWithPipe = true;
    }

    updatedPipes.push(updatedPipe);
  }

  // If hit a pipe, trigger game over
  if (collisionWithPipe) {
    events.push({ type: 'hit_pipe' });
    const finalScore = state.score + scoreGained;
    const finalBest = Math.max(state.bestScore, finalScore);
    return {
      state: {
        ...state,
        pipes: updatedPipes,
        score: finalScore,
        grains: grainsCollected,
        bestScore: finalBest,
        status: 'gameover',
        isGameOver: true,
        chicken: {
          ...state.chicken,
          y,
          vy: 200, // fall down
          rotation: 0.8,
          alive: false,
        },
      },
      events,
    };
  }

  const newScore = state.score + scoreGained;
  const newBest = Math.max(state.bestScore, newScore);

  // 3. Spawning Logic: Pipes or Golden Wheat Field!
  let wheatFieldSpawned = state.wheatFieldSpawned;
  let wheatFieldX = state.wheatFieldX;
  const totalPipesSpawned = newScore + updatedPipes.filter((p) => !p.passed).length;

  // Decide if we should spawn another pipe or the grand wheat field
  if (totalPipesSpawned < state.wheatGoalPipes) {
    // Normal pipe spawning when last pipe has moved enough
    const lastPipe = updatedPipes[updatedPipes.length - 1];
    if (!lastPipe || GAME_WIDTH - lastPipe.x >= 230) {
      updatedPipes.push(createPipe(GAME_WIDTH + 20));
    }
  } else if (!wheatFieldSpawned) {
    // We reached the target pipe count! Spawn the Golden Wheat Field!
    const lastPipe = updatedPipes[updatedPipes.length - 1];
    if (!lastPipe || lastPipe.x < GAME_WIDTH - 200) {
      wheatFieldSpawned = true;
      wheatFieldX = GAME_WIDTH + 140;
    }
  }

  // 4. Update Wheat Field position if spawned
  let hasWon = false;
  let status = state.status;
  if (wheatFieldSpawned) {
    wheatFieldX -= PIPE_SPEED * clampedDt;

    // Check if chicken reached the Golden Wheat field!
    if (state.chicken.x >= wheatFieldX - 20) {
      hasWon = true;
      status = 'won';
      events.push({ type: 'wheat_victory' });
    }
  }

  // Calculate distance ratio toward 100% wheat goal
  const distanceRatio = Math.min(1.0, newScore / state.wheatGoalPipes);

  return {
    state: {
      ...state,
      chicken: {
        ...state.chicken,
        y,
        vy,
        rotation,
        wingState,
      },
      pipes: updatedPipes,
      score: newScore,
      grains: grainsCollected,
      bestScore: newBest,
      distanceRatio,
      wheatFieldSpawned,
      wheatFieldX,
      status,
      hasWon,
      timeAlive: state.timeAlive + clampedDt,
    },
    events,
  };
}

export interface TrackSegment {
  id: string;
  startY: number;
  endY: number;
  trackWidth: number;
  centerX: number;
  hasRails: boolean;
  isTube: boolean;
  type: 'straight' | 'curve_left' | 'curve_right' | 'ramp_jump' | 'narrow_bridge';
}

export interface SunflowerSeed {
  id: string;
  x: number;
  y: number;
  z: number;
  collected: boolean;
}

export interface BoostPad {
  id: string;
  x: number;
  y: number;
  width: number;
  length: number;
  type: 'boost' | 'magnet' | 'ramp';
}

export interface HazardObstacle {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: 'hay_bale' | 'mud_puddle' | 'rock' | 'pendulum';
  vx?: number; // for moving hazards
  minX?: number;
  maxX?: number;
}

export interface Checkpoint {
  id: string;
  y: number;
  passed: boolean;
}

export interface LevelConfig {
  levelNumber: number;
  name: string;
  lengthY: number;
  trackWidth: number;
  segments: TrackSegment[];
  seeds: SunflowerSeed[];
  boostPads: BoostPad[];
  hazards: HazardObstacle[];
  checkpoints: Checkpoint[];
  targetTime: number; // for 3-star time bonus
}

export interface HamsterBallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  rollAngle: number;
  yawAngle: number; // steering tilt
  isAirborne: boolean;
  boostTimer: number;
  magnetTimer: number;
  isInvulnerable: boolean;
  invulnerableTimer: number;
  isFallen: boolean;
  respawnTimer: number;
  lastCheckpointY: number;
  lastCheckpointX: number;
  score: number;
  seedsCollected: number;
  totalSeedsInLevel: number;
  lives: number;
  currentLevel: number;
  status: 'ready' | 'playing' | 'paused' | 'level_cleared' | 'game_over' | 'victory';
  elapsedTime: number;
}

export interface HamsterInput {
  steer: number; // -1 (left) to +1 (right)
  accelerate: number; // 0 to 1
  brake: boolean;
}

export const BASE_FORWARD_SPEED = 320; // px/s
export const MAX_FORWARD_SPEED = 560; // px/s
export const BOOST_SPEED_MULTIPLIER = 1.75;
export const LATERAL_STEER_SPEED = 420; // px/s
export const GRAVITY = 980; // px/s^2 for jumps
export const BALL_RADIUS = 22; // px

export function createLevel(levelNumber: number): LevelConfig {
  const lengthY = levelNumber === 1 ? 3200 : levelNumber === 2 ? 4600 : 6000;
  const trackWidth = levelNumber === 1 ? 260 : levelNumber === 2 ? 220 : 190;
  const defaultCenterX = 200;

  const segments: TrackSegment[] = [];
  const seeds: SunflowerSeed[] = [];
  const boostPads: BoostPad[] = [];
  const hazards: HazardObstacle[] = [];
  const checkpoints: Checkpoint[] = [];

  // Break track into sections
  const stepY = 600;
  for (let y = 0; y < lengthY; y += stepY) {
    const endY = Math.min(lengthY, y + stepY);
    const isTube = levelNumber >= 2 && y > 1200 && y < 2400;
    const isBridge = levelNumber >= 2 && y >= 3000 && y <= 4000;
    const isRamp = (y + 300) % 1200 === 0 && y < lengthY - 500;

    segments.push({
      id: `seg-${y}`,
      startY: y,
      endY,
      trackWidth: isBridge ? trackWidth * 0.75 : trackWidth,
      centerX: defaultCenterX,
      hasRails: !isBridge && !isTube && levelNumber === 1,
      isTube,
      type: isRamp ? 'ramp_jump' : isBridge ? 'narrow_bridge' : 'straight',
    });

    if (isRamp) {
      boostPads.push({
        id: `ramp-${y}`,
        x: defaultCenterX,
        y: y + 260,
        width: 80,
        length: 60,
        type: 'ramp',
      });
    }
  }

  // Add Boost Pads
  for (let y = 400; y < lengthY - 400; y += 750) {
    boostPads.push({
      id: `boost-${y}`,
      x: defaultCenterX + (Math.sin(y) * 40),
      y,
      width: 60,
      length: 50,
      type: y % 1500 === 0 ? 'magnet' : 'boost',
    });
  }

  // Add Sunflower Seeds along track lines
  for (let y = 150; y < lengthY - 200; y += 70) {
    const offset = Math.sin(y * 0.005) * (trackWidth * 0.3);
    seeds.push({
      id: `seed-${y}`,
      x: defaultCenterX + offset,
      y,
      z: 0,
      collected: false,
    });
  }

  // Add Hazards (Mud patches, hay bales)
  for (let y = 500; y < lengthY - 300; y += 420) {
    if (y % 840 === 0) {
      hazards.push({
        id: `hay-${y}`,
        x: defaultCenterX + (Math.cos(y) > 0 ? 50 : -50),
        y,
        radius: 24,
        type: 'hay_bale',
      });
    } else {
      hazards.push({
        id: `mud-${y}`,
        x: defaultCenterX + (Math.sin(y * 2) * 40),
        y,
        radius: 30,
        type: 'mud_puddle',
      });
    }
  }

  // Add Checkpoints
  const cpCount = Math.floor(lengthY / 1500);
  for (let i = 1; i <= cpCount; i++) {
    checkpoints.push({
      id: `cp-${i}`,
      y: i * 1500,
      passed: false,
    });
  }

  return {
    levelNumber,
    name:
      levelNumber === 1
        ? 'Barnyard Meadow Dash'
        : levelNumber === 2
        ? 'Silo Tube Stunt'
        : 'Windmill Skyway',
    lengthY,
    trackWidth,
    segments,
    seeds,
    boostPads,
    hazards,
    checkpoints,
    targetTime: levelNumber === 1 ? 25 : levelNumber === 2 ? 38 : 50,
  };
}

export function createInitialHamsterState(levelNumber: number = 1): {
  state: HamsterBallState;
  level: LevelConfig;
} {
  const level = createLevel(levelNumber);
  const state: HamsterBallState = {
    x: 200,
    y: 40,
    z: 0,
    vx: 0,
    vy: BASE_FORWARD_SPEED,
    vz: 0,
    rollAngle: 0,
    yawAngle: 0,
    isAirborne: false,
    boostTimer: 0,
    magnetTimer: 0,
    isInvulnerable: false,
    invulnerableTimer: 0,
    isFallen: false,
    respawnTimer: 0,
    lastCheckpointY: 40,
    lastCheckpointX: 200,
    score: 0,
    seedsCollected: 0,
    totalSeedsInLevel: level.seeds.length,
    lives: 3,
    currentLevel: levelNumber,
    status: 'ready',
    elapsedTime: 0,
  };

  return { state, level };
}

export interface StepEvents {
  seedCollected: boolean;
  boostActivated: boolean;
  magnetActivated: boolean;
  rampJumped: boolean;
  hazardHit: 'hay_bale' | 'mud_puddle' | null;
  checkpointPassed: boolean;
  fellOff: boolean;
  levelCompleted: boolean;
  gameOver: boolean;
}

export function stepHamsterPhysics(
  state: HamsterBallState,
  level: LevelConfig,
  input: HamsterInput,
  dt: number
): { state: HamsterBallState; events: StepEvents } {
  const events: StepEvents = {
    seedCollected: false,
    boostActivated: false,
    magnetActivated: false,
    rampJumped: false,
    hazardHit: null,
    checkpointPassed: false,
    fellOff: false,
    levelCompleted: false,
    gameOver: false,
  };

  if (state.status !== 'playing' || dt <= 0) {
    return { state, events };
  }

  state.elapsedTime += dt;

  // Handle respawn timer if fallen
  if (state.isFallen) {
    state.respawnTimer -= dt;
    if (state.respawnTimer <= 0) {
      if (state.lives <= 0) {
        state.status = 'game_over';
        events.gameOver = true;
      } else {
        // Respawn at checkpoint
        state.isFallen = false;
        state.x = state.lastCheckpointX;
        state.y = state.lastCheckpointY;
        state.z = 0;
        state.vx = 0;
        state.vy = BASE_FORWARD_SPEED;
        state.vz = 0;
        state.isAirborne = false;
        state.boostTimer = 0;
        state.isInvulnerable = true;
        state.invulnerableTimer = 2.0; // 2s invulnerability after respawn
      }
    }
    return { state, events };
  }

  // Update timers
  if (state.invulnerableTimer > 0) {
    state.invulnerableTimer -= dt;
    if (state.invulnerableTimer <= 0) {
      state.isInvulnerable = false;
    }
  }

  let speedMult = 1.0;
  if (state.boostTimer > 0) {
    state.boostTimer -= dt;
    speedMult = BOOST_SPEED_MULTIPLIER;
  }

  if (state.magnetTimer > 0) {
    state.magnetTimer -= dt;
  }

  // Lateral steering
  const targetVx = input.steer * LATERAL_STEER_SPEED;
  const steerLerp = Math.min(1, dt * 12);
  state.vx += (targetVx - state.vx) * steerLerp;
  state.yawAngle = (state.vx / LATERAL_STEER_SPEED) * 0.45; // tilt visual angle

  // Forward speed calculations
  let targetForward = BASE_FORWARD_SPEED * speedMult;
  if (input.accelerate > 0) {
    targetForward = Math.min(MAX_FORWARD_SPEED * speedMult, targetForward + input.accelerate * 140);
  }
  if (input.brake) {
    targetForward *= 0.45;
  }

  const forwardLerp = Math.min(1, dt * 8);
  state.vy += (targetForward - state.vy) * forwardLerp;

  // Airborne / Jump Physics
  if (state.isAirborne) {
    state.vz -= GRAVITY * dt;
    state.z += state.vz * dt;

    if (state.z <= 0) {
      state.z = 0;
      state.vz = 0;
      state.isAirborne = false;
    }
  }

  // Integrate position
  state.x += state.vx * dt;
  state.y += state.vy * dt;

  // Roll angle animation
  state.rollAngle += (state.vy / BALL_RADIUS) * dt;

  // Find current segment to check track bounds
  const currentSegment =
    level.segments.find((s) => state.y >= s.startY && state.y < s.endY) ||
    level.segments[level.segments.length - 1];

  const halfWidth = currentSegment.trackWidth / 2;
  const minX = currentSegment.centerX - halfWidth;
  const maxX = currentSegment.centerX + halfWidth;

  // Edge boundary checks
  if (currentSegment.hasRails) {
    // Hard bumper collision with rails
    if (state.x - BALL_RADIUS < minX) {
      state.x = minX + BALL_RADIUS;
      state.vx = Math.abs(state.vx) * 0.6 + 50;
    } else if (state.x + BALL_RADIUS > maxX) {
      state.x = maxX - BALL_RADIUS;
      state.vx = -Math.abs(state.vx) * 0.6 - 50;
    }
  } else {
    // Open ledge: Can fall off if not in tube and not airborne over safe area
    if (!currentSegment.isTube && !state.isAirborne) {
      if (state.x < minX - 10 || state.x > maxX + 10) {
        // Hamster fell off!
        state.isFallen = true;
        state.respawnTimer = 1.2;
        state.lives -= 1;
        events.fellOff = true;
        return { state, events };
      }
    }
  }

  // Check Boost / Ramp Pads
  for (const pad of level.boostPads) {
    const padHalfW = pad.width / 2;
    if (
      Math.abs(state.y - pad.y) < pad.length / 2 + BALL_RADIUS &&
      Math.abs(state.x - pad.x) < padHalfW + BALL_RADIUS &&
      state.z < 10
    ) {
      if (pad.type === 'boost') {
        state.boostTimer = 2.5;
        state.score += 25;
        events.boostActivated = true;
      } else if (pad.type === 'magnet') {
        state.magnetTimer = 5.0;
        state.score += 30;
        events.magnetActivated = true;
      } else if (pad.type === 'ramp') {
        state.isAirborne = true;
        state.vz = 420; // launch velocity
        state.boostTimer = Math.max(state.boostTimer, 1.5);
        events.rampJumped = true;
      }
    }
  }

  // Check Sunflower Seeds
  const magnetRadius = state.magnetTimer > 0 ? 160 : 35;
  for (const seed of level.seeds) {
    if (seed.collected) continue;

    const dx = state.x - seed.x;
    const dy = state.y - seed.y;
    const dist = Math.hypot(dx, dy);

    // Magnetic pull
    if (state.magnetTimer > 0 && dist < magnetRadius && dist > 10) {
      seed.x += (dx / dist) * -380 * dt;
      seed.y += (dy / dist) * -380 * dt;
    }

    if (dist < BALL_RADIUS + 14) {
      seed.collected = true;
      state.seedsCollected += 1;
      state.score += 15;
      events.seedCollected = true;
    }
  }

  // Check Hazards
  if (!state.isInvulnerable && !state.isAirborne && state.boostTimer <= 0) {
    for (const h of level.hazards) {
      const dist = Math.hypot(state.x - h.x, state.y - h.y);
      if (dist < BALL_RADIUS + h.radius) {
        if (h.type === 'hay_bale') {
          // Bounce back and lose speed
          state.vy = Math.max(80, state.vy * 0.4);
          state.vx = (state.x < h.x ? -1 : 1) * 220;
          events.hazardHit = 'hay_bale';
        } else if (h.type === 'mud_puddle') {
          // Slow down heavily in mud
          state.vy = Math.max(100, state.vy * 0.6);
          events.hazardHit = 'mud_puddle';
        }
      }
    }
  }

  // Check Checkpoints
  for (const cp of level.checkpoints) {
    if (!cp.passed && state.y >= cp.y) {
      cp.passed = true;
      state.lastCheckpointY = cp.y;
      state.lastCheckpointX = currentSegment.centerX;
      state.score += 100;
      events.checkpointPassed = true;
    }
  }

  // Check Finish Line
  if (state.y >= level.lengthY) {
    state.status = 'level_cleared';
    events.levelCompleted = true;

    // Time bonus
    if (state.elapsedTime < level.targetTime) {
      state.score += Math.floor((level.targetTime - state.elapsedTime) * 20);
    }

    if (state.currentLevel >= 3) {
      state.status = 'victory';
    }
  }

  return { state, events };
}

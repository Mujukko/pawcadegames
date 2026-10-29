import {
  DodoEntity,
  DodoGameEvent,
  DodoGameState,
  DodoGameStatus,
  ObstacleType,
  PickupType,
  TrackObstacle,
  TrackPickup,
} from './types';

export const TRACK_WIDTH = 400;
export const JUMP_GRAVITY = 22; // m/s²
export const HOP_VELOCITY = 7.5; // m/s
export const RAMP_VELOCITY = 9.5; // m/s

export function generateTrackElements(trackIndex: number): {
  obstacles: TrackObstacle[];
  pickups: TrackPickup[];
  targetDistance: number;
  baseSpeed: number;
  maxSpeed: number;
} {
  const obstacles: TrackObstacle[] = [];
  const pickups: TrackPickup[] = [];

  const targetDistance = trackIndex === 1 ? 500 : trackIndex === 2 ? 750 : 1000;
  const baseSpeed = trackIndex === 1 ? 22 : trackIndex === 2 ? 26 : 30;
  const maxSpeed = trackIndex === 1 ? 38 : trackIndex === 2 ? 46 : 54;

  let oId = 0;
  let pId = 0;

  // Start with a clear runway (first 30m is safe)
  let currentZ = 35;

  while (currentZ < targetDistance - 30) {
    const sectionProgress = currentZ / targetDistance;

    // Place speed boost pads periodically
    if (Math.random() < 0.35) {
      const padX = (Math.random() - 0.5) * 1.2;
      pickups.push({
        id: `pickup-${pId++}`,
        z: currentZ,
        x: padX,
        type: 'boost_pad',
      });
    }

    // Place frost berries
    if (Math.random() < 0.5) {
      const berryX = (Math.random() - 0.5) * 1.3;
      pickups.push({
        id: `pickup-${pId++}`,
        z: currentZ + 5,
        x: berryX,
        type: 'frost_berry',
      });
    }

    // Place ramp jumps over crevasses on track 2 and 3
    if ((trackIndex >= 2 && Math.random() < 0.25) || (trackIndex === 1 && currentZ > 250 && Math.random() < 0.15)) {
      const rampX = (Math.random() - 0.5) * 0.8;
      pickups.push({
        id: `ramp-${pId++}`,
        z: currentZ + 12,
        x: rampX,
        type: 'ramp_jump',
      });
      // Crevasse gap immediately following the ramp
      obstacles.push({
        id: `crevasse-${oId++}`,
        z: currentZ + 18,
        x: rampX,
        width: 0.6,
        type: 'crevasse',
      });
      currentZ += 28;
      continue;
    }

    // Determine obstacle type based on track and progression
    const roll = Math.random();
    let obsType: ObstacleType = 'ice_cone';
    let count = 1;

    if (trackIndex === 1) {
      obsType = roll < 0.7 ? 'ice_cone' : 'snow_boulder';
    } else if (trackIndex === 2) {
      obsType = roll < 0.4 ? 'ice_cone' : roll < 0.75 ? 'snow_boulder' : 'fence_post';
      if (sectionProgress > 0.4 && Math.random() < 0.3) count = 2;
    } else {
      obsType = roll < 0.3 ? 'ice_cone' : roll < 0.6 ? 'snow_boulder' : 'fence_post';
      if (Math.random() < 0.4) count = 2;
    }

    if (count === 1) {
      const obsX = (Math.random() - 0.5) * 1.4;
      obstacles.push({
        id: `obs-${oId++}`,
        z: currentZ,
        x: obsX,
        width: 0.25,
        type: obsType,
      });
    } else {
      // Slalom / gate layout (two obstacles leaving an open corridor)
      const gapX = (Math.random() - 0.5) * 0.8;
      obstacles.push({
        id: `obs-${oId++}`,
        z: currentZ,
        x: gapX - 0.45,
        width: 0.25,
        type: obsType,
      });
      obstacles.push({
        id: `obs-${oId++}`,
        z: currentZ,
        x: gapX + 0.45,
        width: 0.25,
        type: obsType,
      });
    }

    // Advance Z based on speed and difficulty
    const minSpacing = trackIndex === 1 ? 16 : trackIndex === 2 ? 14 : 12;
    currentZ += minSpacing + Math.random() * 8;
  }

  return { obstacles, pickups, targetDistance, baseSpeed, maxSpeed };
}

export function createInitialState(trackIndex = 1): DodoGameState {
  const { obstacles, pickups, targetDistance, baseSpeed, maxSpeed } = generateTrackElements(trackIndex);

  const dodo: DodoEntity = {
    x: 0,
    vx: 0,
    targetX: 0,
    z: 0,
    y: 0,
    vy: 0,
    isAirborne: false,
    hasShield: false,
    skateTilt: 0,
  };

  return {
    status: 'ready',
    trackIndex,
    distance: 0,
    targetDistance,
    speed: baseSpeed,
    baseSpeed,
    maxSpeed,
    score: 0,
    frostBerries: 0,
    dodo,
    obstacles,
    pickups,
    events: [],
  };
}

export function startSkating(state: DodoGameState): DodoGameState {
  if (state.status !== 'ready') return state;
  return {
    ...state,
    status: 'skating',
    events: [...state.events, { type: 'start' }],
  };
}

export function steerDodo(state: DodoGameState, targetX: number): DodoGameState {
  const clampedX = Math.max(-0.85, Math.min(0.85, targetX));
  return {
    ...state,
    dodo: {
      ...state.dodo,
      targetX: clampedX,
    },
  };
}

export function jumpDodo(state: DodoGameState): DodoGameState {
  if (state.status !== 'skating' || state.dodo.isAirborne) return state;

  return {
    ...state,
    dodo: {
      ...state.dodo,
      vy: HOP_VELOCITY,
      isAirborne: true,
    },
    events: [...state.events, { type: 'jump' }],
  };
}

export function updateGame(state: DodoGameState, dt: number): DodoGameState {
  if (state.status !== 'skating') {
    return state;
  }

  const events: DodoGameEvent[] = [];
  const clampedDt = Math.min(0.04, Math.max(0.001, dt));

  let dodo = { ...state.dodo };
  let currentSpeed = state.speed;
  let score = state.score;
  let berries = state.frostBerries;

  // 1. Smooth lateral steering with skate inertia
  const dx = dodo.targetX - dodo.x;
  dodo.vx = dx * 8; // lateral responsiveness
  dodo.x += dodo.vx * clampedDt;
  dodo.x = Math.max(-0.88, Math.min(0.88, dodo.x));
  dodo.skateTilt = Math.max(-0.35, Math.min(0.35, dx * 0.4));

  // 2. Vertical jump physics
  if (dodo.isAirborne) {
    dodo.y += dodo.vy * clampedDt;
    dodo.vy -= JUMP_GRAVITY * clampedDt;

    if (dodo.y <= 0) {
      dodo.y = 0;
      dodo.vy = 0;
      dodo.isAirborne = false;
      events.push({ type: 'land' });
    }
  }

  // 3. Forward movement along track
  dodo.z += currentSpeed * clampedDt;
  const newDistance = Math.min(state.targetDistance, dodo.z);

  // Passive score accrual per meter
  score += Math.round(currentSpeed * clampedDt * 2);

  // Speed decay towards base speed (if boosted) or gentle progression speedup
  if (currentSpeed > state.baseSpeed + 2) {
    currentSpeed -= 4.5 * clampedDt;
  } else if (currentSpeed < state.baseSpeed) {
    currentSpeed += 2.0 * clampedDt;
  }

  // 4. Pickup interaction
  const nextPickups = state.pickups.map((p) => {
    if (p.collected) return p;
    const dz = Math.abs(dodo.z - p.z);
    const lateralDist = Math.abs(dodo.x - p.x);

    if (dz < 1.8 && lateralDist < 0.28) {
      if (p.type === 'boost_pad') {
        currentSpeed = Math.min(state.maxSpeed, currentSpeed + 14);
        events.push({ type: 'boost', speed: currentSpeed });
      } else if (p.type === 'frost_berry') {
        berries += 1;
        score += 150;
        if (berries % 5 === 0) {
          dodo.hasShield = true;
        }
        events.push({ type: 'berry_pickup', x: p.x, z: p.z, points: 150 });
      } else if (p.type === 'ramp_jump') {
        dodo.vy = RAMP_VELOCITY;
        dodo.isAirborne = true;
        events.push({ type: 'jump' });
      }
      return { ...p, collected: true };
    }
    return p;
  });

  // 5. Obstacle collision
  let didCrash = false;
  let nextStatus: DodoGameStatus = 'skating';

  const nextObstacles = state.obstacles.map((obs) => {
    if (obs.hit || didCrash) return obs;

    const dz = Math.abs(dodo.z - obs.z);
    const lateralDist = Math.abs(dodo.x - obs.x);

    if (dz < 1.4 && lateralDist < obs.width + 0.12) {
      // Check airborne clearance
      if (obs.type === 'crevasse') {
        if (dodo.y < 0.5) {
          didCrash = true;
          events.push({ type: 'crash', obstacleType: obs.type, distance: Math.round(dodo.z) });
          return { ...obs, hit: true };
        }
      } else {
        // Ice cone, boulder, or fence post
        if (dodo.y > 1.2) {
          // Cleared via jump!
          return obs;
        }
        if (dodo.hasShield) {
          dodo.hasShield = false;
          events.push({ type: 'shield_lost' });
          return { ...obs, hit: true };
        }
        // Direct crash
        didCrash = true;
        events.push({ type: 'crash', obstacleType: obs.type, distance: Math.round(dodo.z) });
        return { ...obs, hit: true };
      }
    }
    return obs;
  });

  // 6. Check finish line victory or crash
  if (didCrash) {
    nextStatus = 'crashed';
  } else if (dodo.z >= state.targetDistance) {
    nextStatus = 'victory';
    events.push({
      type: 'track_clear',
      trackIndex: state.trackIndex,
      distance: Math.round(dodo.z),
      score,
    });
  }

  return {
    ...state,
    status: nextStatus,
    distance: newDistance,
    speed: currentSpeed,
    score,
    frostBerries: berries,
    dodo,
    obstacles: nextObstacles,
    pickups: nextPickups,
    events,
  };
}

export function advanceTrack(state: DodoGameState): DodoGameState {
  const nextTrack = Math.min(3, state.trackIndex + 1);
  return createInitialState(nextTrack);
}

export function restartTrack(state: DodoGameState): DodoGameState {
  return createInitialState(state.trackIndex);
}

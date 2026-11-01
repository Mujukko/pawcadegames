import {
  SlopeBall,
  SlopeInput,
  SlopeObstacle,
  SlopeState,
  TrackSegment,
} from './types';

export const BASE_SPEED = 24;
export const MAX_SPEED = 55;
export const LATERAL_SPEED = 2.4;
export const GRAVITY = 22;
export const TRACK_WIDTH = 2.0; // From x = -1.0 to +1.0

export function generateTrackSegment(z: number): TrackSegment {
  const obstacles: SlopeObstacle[] = [];

  // Initial 40m safe runway
  if (z > 40) {
    const r = Math.random();
    if (r < 0.5) {
      // 1 obstacle on left or right
      const ox = Math.random() < 0.5 ? -0.5 : 0.5;
      obstacles.push({
        x: ox,
        z,
        width: 0.5,
        height: 0.6,
        type: 'block',
      });
    } else if (r < 0.75) {
      // Center obstacle
      obstacles.push({
        x: 0,
        z,
        width: 0.6,
        height: 0.6,
        type: 'block',
      });
    } else if (r < 0.9) {
      // Speed launch ramp
      obstacles.push({
        x: 0,
        z,
        width: 0.8,
        height: 0.3,
        type: 'ramp',
      });
    }
  }

  return {
    z,
    width: 2.0,
    curve: Math.sin(z * 0.03) * 0.4,
    obstacles,
  };
}

export function initSlopeGame(bestScore: number = 0): SlopeState {
  const segments: TrackSegment[] = [];
  for (let z = 0; z < 180; z += 10) {
    segments.push(generateTrackSegment(z));
  }

  const ball: SlopeBall = {
    x: 0,
    y: 0,
    vy: 0,
    rollAngle: 0,
    speed: BASE_SPEED,
  };

  return {
    ball,
    distance: 0,
    score: 0,
    bestScore,
    status: 'playing',
    segments,
  };
}

export function stepSlopeGame(
  state: SlopeState,
  input: SlopeInput,
  dt: number
): {
  state: SlopeState;
  event?: 'jump' | 'crash';
} {
  if (state.status !== 'playing') {
    return { state };
  }

  const safeDt = Math.min(dt, 0.05);
  let event: 'jump' | 'crash' | undefined;

  const ball: SlopeBall = { ...state.ball };
  let distance = state.distance;
  let status: SlopeState['status'] = state.status;

  // 1. Accelerate speed gradually
  ball.speed = Math.min(MAX_SPEED, BASE_SPEED + distance * 0.04);
  const forwardStep = ball.speed * safeDt;
  distance += forwardStep;

  // 2. Lateral Movement
  ball.x += input.steerX * LATERAL_SPEED * safeDt;
  ball.rollAngle += (ball.speed / 1.5) * safeDt;

  // 3. Jump Physics
  if (ball.y > 0 || ball.vy > 0) {
    ball.y += ball.vy * safeDt;
    ball.vy -= GRAVITY * safeDt;
    if (ball.y <= 0) {
      ball.y = 0;
      ball.vy = 0;
    }
  }

  // 4. Edge Drop Collision (Fell off the platform)
  if (Math.abs(ball.x) > 1.05 && ball.y <= 0) {
    status = 'crashed';
    event = 'crash';
  }

  // 5. Obstacle Collisions
  if (status === 'playing') {
    for (const seg of state.segments) {
      for (const obs of seg.obstacles) {
        // Distance check
        const dz = obs.z - distance;
        if (Math.abs(dz) < 1.0) {
          const dx = Math.abs(ball.x - obs.x);
          const collisionRange = obs.width / 2 + 0.12;

          if (dx < collisionRange) {
            if (obs.type === 'ramp') {
              // Launch over obstacles
              ball.vy = 8.5;
              event = 'jump';
            } else if (obs.type === 'block') {
              // Crash into block unless jumped over
              if (ball.y < obs.height * 0.7) {
                status = 'crashed';
                event = 'crash';
                break;
              }
            }
          }
        }
      }
      if (status === 'crashed') break;
    }
  }

  // 6. Track Generation / Recycle Segments
  let segments = state.segments.filter((s) => s.z >= distance - 20);
  const maxZ = Math.max(...segments.map((s) => s.z), 0);
  if (maxZ < distance + 180) {
    for (let z = maxZ + 10; z < distance + 190; z += 10) {
      segments.push(generateTrackSegment(z));
    }
  }

  const score = Math.round(distance);
  const bestScore = Math.max(state.bestScore, score);

  return {
    state: {
      ...state,
      ball,
      distance,
      score,
      bestScore,
      status,
      segments,
    },
    event,
  };
}

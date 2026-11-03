import {
  HelixGameState,
  SiloFloor,
  SiloSector,
} from './types';

export const FLOOR_SPACING = 130;
export const GRAVITY = 950;
export const BOUNCE_VELOCITY = -410;
export const BALL_RADIUS = 14;

export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

export function generateSiloFloors(totalFloors: number): SiloFloor[] {
  const floors: SiloFloor[] = [];

  for (let i = 0; i < totalFloors; i++) {
    const isGoal = i === totalFloors - 1;
    const y = (i + 1) * FLOOR_SPACING;

    if (isGoal) {
      // Complete solid golden victory pad
      floors.push({
        floorIndex: i,
        y,
        sectors: [{ startAngle: 0, endAngle: Math.PI * 2, type: 'safe' }],
        isBroken: false,
      });
      continue;
    }

    // Gap opening width (between 50 and 80 degrees)
    const gapWidth = 0.85 + Math.random() * 0.45;
    const gapStart = Math.random() * Math.PI * 2;
    const gapEnd = normalizeAngle(gapStart + gapWidth);

    const sectors: SiloSector[] = [];

    // Gap sector
    sectors.push({
      startAngle: gapStart,
      endAngle: gapStart + gapWidth,
      type: 'gap',
    });

    // Remainder of floor has safe and hazard zones
    const solidLength = Math.PI * 2 - gapWidth;
    const hasHazard = i >= 1; // First floor has no hazard for easy start
    const hazardLength = hasHazard ? 0.35 + Math.min(0.8, i * 0.06) : 0;
    const hazardStart = gapStart + gapWidth + Math.random() * (solidLength - hazardLength - 0.2);

    if (hasHazard && solidLength > hazardLength + 0.3) {
      // Safe piece 1
      sectors.push({
        startAngle: gapStart + gapWidth,
        endAngle: hazardStart,
        type: 'safe',
      });
      // Hazard piece
      sectors.push({
        startAngle: hazardStart,
        endAngle: hazardStart + hazardLength,
        type: 'hazard',
      });
      // Safe piece 2
      sectors.push({
        startAngle: hazardStart + hazardLength,
        endAngle: gapStart + Math.PI * 2,
        type: 'safe',
      });
    } else {
      sectors.push({
        startAngle: gapStart + gapWidth,
        endAngle: gapStart + Math.PI * 2,
        type: 'safe',
      });
    }

    floors.push({
      floorIndex: i,
      y,
      sectors,
      isBroken: false,
    });
  }

  return floors;
}

export function createHelixGame(totalFloors = 15, highScore = 0): HelixGameState {
  return {
    status: 'ready',
    towerAngle: 0,
    targetTowerAngle: 0,
    ball: {
      y: 40,
      vy: 0,
      radius: BALL_RADIUS,
      comboStreak: 0,
      isSuperSmash: false,
    },
    floors: generateSiloFloors(totalFloors),
    currentFloor: 0,
    totalFloors,
    score: 0,
    highScore,
    events: [],
  };
}

export function rotateTower(state: HelixGameState, deltaAngle: number): HelixGameState {
  if (state.status === 'game_over' || state.status === 'victory') return state;

  return {
    ...state,
    status: state.status === 'ready' ? 'playing' : state.status,
    targetTowerAngle: state.targetTowerAngle + deltaAngle,
  };
}

export function updateHelixGame(state: HelixGameState, rawDt: number): HelixGameState {
  if (state.status === 'game_over' || state.status === 'victory') {
    return state;
  }

  const dt = Math.min(rawDt, 0.05);
  const events: HelixGameState['events'] = [];
  let status: HelixGameState['status'] = state.status;
  let score = state.score;
  let highScore = state.highScore;

  // Smooth tower rotation
  const angleDiff = state.targetTowerAngle - state.towerAngle;
  const towerAngle = state.towerAngle + angleDiff * Math.min(1, dt * 18);

  const ball = { ...state.ball };
  const floors = state.floors.map((f) => ({ ...f, sectors: [...f.sectors] }));

  // Ball gravity
  ball.vy += GRAVITY * dt;
  const nextBallY = ball.y + ball.vy * dt;

  // Find next active floor directly below or at ball
  for (let i = 0; i < floors.length; i++) {
    const floor = floors[i];
    if (floor.isBroken) continue;

    const floorTop = floor.y - 12;

    // Check if ball crosses or touches this floor
    if (ball.y <= floorTop && nextBallY >= floorTop) {
      // Check which sector the ball hits based on tower rotation
      // Ball is located at front view (angle = Math.PI / 2 in world)
      // Relative sector angle on tower:
      const relativeAngle = normalizeAngle(Math.PI / 2 - towerAngle);

      let hitSector: SiloSector | undefined;
      for (const s of floor.sectors) {
        const normStart = normalizeAngle(s.startAngle);
        const normEnd = normalizeAngle(s.endAngle);
        const spansZero = s.endAngle - s.startAngle >= Math.PI * 2 || normEnd < normStart;

        if (spansZero) {
          if (relativeAngle >= normStart || relativeAngle <= normEnd) {
            hitSector = s;
            break;
          }
        } else {
          if (relativeAngle >= normStart && relativeAngle <= normEnd) {
            hitSector = s;
            break;
          }
        }
      }

      if (!hitSector || hitSector.type === 'gap') {
        // Dropped through gap!
        ball.comboStreak += 1;
        score += 15 * ball.comboStreak;
        if (ball.comboStreak >= 3) {
          ball.isSuperSmash = true;
        }
        events.push({ type: 'pass_floor', points: 15 * ball.comboStreak });
      } else if (hitSector.type === 'hazard') {
        if (ball.isSuperSmash) {
          // Smash through hazard!
          floor.isBroken = true;
          ball.comboStreak += 1;
          score += 60 * ball.comboStreak;
          events.push({ type: 'smash_floor', points: 60 * ball.comboStreak });
        } else {
          // Smashed on hazard -> game over!
          ball.y = floorTop;
          ball.vy = 0;
          status = 'game_over';
          events.push({ type: 'hit_hazard' });
          break;
        }
      } else {
        // Hit safe sector
        if (i === floors.length - 1) {
          // Goal victory!
          ball.y = floorTop;
          ball.vy = 0;
          status = 'victory';
          score += 500;
          events.push({ type: 'victory', points: 500 });
          break;
        }

        if (ball.isSuperSmash) {
          // Break through safe floor on high combo!
          floor.isBroken = true;
          ball.comboStreak += 1;
          score += 40 * ball.comboStreak;
          events.push({ type: 'smash_floor', points: 40 * ball.comboStreak });
        } else {
          // Normal bounce!
          ball.y = floorTop;
          ball.vy = BOUNCE_VELOCITY;
          ball.comboStreak = 0;
          ball.isSuperSmash = false;
          events.push({ type: 'bounce' });
        }
      }
    }
  }

  if (status !== 'game_over' && status !== 'victory') {
    ball.y = nextBallY;
  }

  // Current floor tracking
  let currentFloor = 0;
  for (let i = 0; i < floors.length; i++) {
    if (ball.y >= floors[i].y) currentFloor = i + 1;
  }

  if (score > highScore) {
    highScore = score;
  }

  return {
    ...state,
    status,
    towerAngle,
    ball,
    floors,
    currentFloor,
    score,
    highScore,
    events,
  };
}

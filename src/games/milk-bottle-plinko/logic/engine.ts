import {
  PlinkoState,
  PlinkoBottle,
  PlinkoPeg,
  PlinkoBucket,
  PlinkoEvent,
  BottleType,
} from './types';

export const BOARD_WIDTH = 420;
export const BOARD_HEIGHT = 540;
export const WALL_LEFT = 24;
export const WALL_RIGHT = 396;
export const BUCKET_TOP_Y = 475;

export const PENTATONIC_FREQS = [
  523.25, // C5
  587.33, // D5
  659.25, // E5
  783.99, // G5
  880.0,  // A5
  1046.5, // C6
  1174.66,// D6
  1318.51,// E6
  1567.98,// G6
  1760.0, // A6
];

export function createPegs(): PlinkoPeg[] {
  const pegs: PlinkoPeg[] = [];
  const startY = 100;
  const rowSpacing = 35;
  const totalRows = 10;

  for (let r = 0; r < totalRows; r++) {
    const y = startY + r * rowSpacing;
    const isEven = r % 2 === 0;
    const count = isEven ? 7 : 8;
    const spacing = (WALL_RIGHT - WALL_LEFT) / (count + 1);

    for (let c = 0; c < count; c++) {
      const x = WALL_LEFT + spacing * (c + 1);
      const isCenterBumper = (r === 4 && (c === 3 || c === 4)) || (r === 5 && (c === 3 || c === 4));

      pegs.push({
        id: `peg-${r}-${c}`,
        x,
        y,
        radius: isCenterBumper ? 6.5 : 4.5,
        glowTimer: 0,
        isBumper: isCenterBumper,
      });
    }
  }

  return pegs;
}

export function createBuckets(): PlinkoBucket[] {
  return [
    {
      id: 'bucket-0',
      index: 0,
      minX: WALL_LEFT,
      maxX: 76,
      multiplier: 20,
      label: '20x',
      color: '#a855f7', // purple
      highlightTimer: 0,
    },
    {
      id: 'bucket-1',
      index: 1,
      minX: 76,
      maxX: 130,
      multiplier: 5,
      label: '5x',
      color: '#3b82f6', // blue
      highlightTimer: 0,
    },
    {
      id: 'bucket-2',
      index: 2,
      minX: 130,
      maxX: 182,
      multiplier: 2,
      label: '2x',
      color: '#10b981', // green
      highlightTimer: 0,
    },
    {
      id: 'bucket-3',
      index: 3,
      minX: 182,
      maxX: 238,
      multiplier: 100,
      label: '100x',
      color: '#eab308', // gold jackpot
      isJackpot: true,
      highlightTimer: 0,
    },
    {
      id: 'bucket-4',
      index: 4,
      minX: 238,
      maxX: 290,
      multiplier: 2,
      label: '2x',
      color: '#10b981', // green
      highlightTimer: 0,
    },
    {
      id: 'bucket-5',
      index: 5,
      minX: 290,
      maxX: 344,
      multiplier: 5,
      label: '5x',
      color: '#3b82f6', // blue
      highlightTimer: 0,
    },
    {
      id: 'bucket-6',
      index: 6,
      minX: 344,
      maxX: WALL_RIGHT,
      multiplier: 20,
      label: '20x',
      color: '#a855f7', // purple
      highlightTimer: 0,
    },
  ];
}

export function createInitialState(savedHighScore: number = 0): PlinkoState {
  return {
    status: 'playing',
    bottlesLeft: 30,
    score: 0,
    highScore: savedHighScore,
    bottlesInPlay: [],
    pegs: createPegs(),
    buckets: createBuckets(),
    hopper: {
      x: 210,
      speed: 120,
      dir: 1,
      minX: 65,
      maxX: 355,
      isManual: false,
    },
    frenzyMeter: 25,
    frenzyActive: false,
    frenzyTimer: 0,
    totalDropped: 0,
    totalBucketed: 0,
  };
}

export function dropBottle(
  state: PlinkoState,
  targetX?: number,
  forcedType?: BottleType
): { state: PlinkoState; event?: PlinkoEvent } {
  if (state.bottlesLeft <= 0 && state.status !== 'playing') {
    return { state };
  }

  const dropX = targetX !== undefined
    ? Math.max(state.hopper.minX, Math.min(state.hopper.maxX, targetX))
    : state.hopper.x;

  let bottleType: BottleType = forcedType || 'standard_milk';
  let value = 10;
  let radius = 10;

  if (state.frenzyActive) {
    bottleType = 'golden_milk';
    value = 50;
    radius = 12;
  } else if (!forcedType) {
    const roll = Math.random();
    if (roll < 0.12) {
      bottleType = 'golden_milk';
      value = 50;
      radius = 12;
    } else if (roll < 0.35) {
      bottleType = 'strawberry_milk';
      value = 20;
      radius = 10;
    } else if (roll < 0.55) {
      bottleType = 'chocolate_milk';
      value = 25;
      radius = 10;
    }
  }

  const newBottle: PlinkoBottle = {
    id: `bottle-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    x: dropX,
    y: 55,
    vx: (Math.random() - 0.5) * 20,
    vy: 60,
    radius,
    type: bottleType,
    value,
  };

  const nextBottlesLeft = Math.max(0, state.bottlesLeft - 1);

  return {
    state: {
      ...state,
      bottlesLeft: nextBottlesLeft,
      bottlesInPlay: [...state.bottlesInPlay, newBottle],
      totalDropped: state.totalDropped + 1,
    },
    event: { type: 'bottle_dropped', bottleType, x: dropX },
  };
}

export function activateFrenzy(state: PlinkoState): { state: PlinkoState; event?: PlinkoEvent } {
  if (state.frenzyMeter < 100 || state.frenzyActive) {
    return { state };
  }

  return {
    state: {
      ...state,
      frenzyActive: true,
      frenzyTimer: 8.0,
      frenzyMeter: 0,
    },
    event: { type: 'frenzy_activated' },
  };
}

export function refillBottles(state: PlinkoState, amount: number = 25): PlinkoState {
  return {
    ...state,
    status: 'playing',
    bottlesLeft: state.bottlesLeft + amount,
  };
}

export function updateEngine(
  state: PlinkoState,
  dt: number
): { state: PlinkoState; events: PlinkoEvent[] } {
  const events: PlinkoEvent[] = [];
  const safeDt = Math.min(0.04, Math.max(0.001, dt));

  // 1. Update Hopper Motion
  let nextHopperX = state.hopper.x;
  let nextHopperDir = state.hopper.dir;

  if (!state.hopper.isManual) {
    nextHopperX += state.hopper.dir * state.hopper.speed * safeDt;
    if (nextHopperX >= state.hopper.maxX) {
      nextHopperX = state.hopper.maxX;
      nextHopperDir = -1;
    } else if (nextHopperX <= state.hopper.minX) {
      nextHopperX = state.hopper.minX;
      nextHopperDir = 1;
    }
  }

  // 2. Update Frenzy Timer
  let nextFrenzyTimer = Math.max(0, state.frenzyTimer - safeDt);
  let nextFrenzyActive = nextFrenzyTimer > 0;
  let nextFrenzyMeter = state.frenzyMeter;

  // 3. Update Peg and Bucket glow/highlight timers
  const nextPegs = state.pegs.map((peg) => ({
    ...peg,
    glowTimer: Math.max(0, peg.glowTimer - safeDt * 3.5),
  }));

  const nextBuckets = state.buckets.map((b) => ({
    ...b,
    highlightTimer: Math.max(0, b.highlightTimer - safeDt * 3.0),
  }));

  // 4. Sub-Stepped Physics for Bottles
  const SUB_STEPS = 4;
  const subDt = safeDt / SUB_STEPS;
  const gravity = 480;

  let activeBottles = [...state.bottlesInPlay];
  let scoreGained = 0;
  let bucketedCount = 0;

  for (let step = 0; step < SUB_STEPS; step++) {
    for (let i = activeBottles.length - 1; i >= 0; i--) {
      const b = activeBottles[i];
      if (b.settled) continue;

      // Integrate Gravity & Velocity
      b.vy += gravity * subDt;
      b.vx *= Math.pow(0.99, subDt * 60);
      b.vy *= Math.pow(0.995, subDt * 60);

      b.x += b.vx * subDt;
      b.y += b.vy * subDt;

      // Left & Right Wall Collision
      if (b.x - b.radius < WALL_LEFT) {
        b.x = WALL_LEFT + b.radius;
        b.vx = Math.abs(b.vx) * 0.65;
      } else if (b.x + b.radius > WALL_RIGHT) {
        b.x = WALL_RIGHT - b.radius;
        b.vx = -Math.abs(b.vx) * 0.65;
      }

      // Peg Collisions
      for (let pIdx = 0; pIdx < nextPegs.length; pIdx++) {
        const peg = nextPegs[pIdx];
        const dx = b.x - peg.x;
        const dy = b.y - peg.y;
        const dist = Math.hypot(dx, dy);
        const minDist = b.radius + peg.radius;

        if (dist < minDist && dist > 0.001) {
          const nx = dx / dist;
          const ny = dy / dist;
          const overlap = minDist - dist;

          // Push bottle out
          b.x += nx * overlap;
          b.y += ny * overlap;

          // Normal velocity
          const vDotN = b.vx * nx + b.vy * ny;
          if (vDotN < 0) {
            const restitution = peg.isBumper ? 1.05 : 0.68;
            b.vx = (b.vx - (1 + restitution) * vDotN * nx) + (Math.random() - 0.5) * 15;
            b.vy = (b.vy - (1 + restitution) * vDotN * ny);

            // Light up peg
            peg.glowTimer = 1.0;

            // Frenzy charge
            nextFrenzyMeter = Math.min(100, nextFrenzyMeter + (peg.isBumper ? 3.0 : 1.2));

            // Frequency based on peg Y level
            const rowIdx = Math.min(PENTATONIC_FREQS.length - 1, Math.max(0, Math.floor((peg.y - 100) / 35)));
            const noteFreq = PENTATONIC_FREQS[rowIdx];

            events.push({
              type: 'peg_hit',
              pegId: peg.id,
              x: peg.x,
              y: peg.y,
              noteFreq,
            });
          }
        }
      }

      // Check Bucket Landing at Bottom
      if (b.y >= BUCKET_TOP_Y) {
        b.settled = true;
        bucketedCount++;

        // Determine which bucket it fell into
        let matchedBucket: PlinkoBucket | undefined = nextBuckets.find(
          (bucket) => b.x >= bucket.minX && b.x <= bucket.maxX
        );

        if (!matchedBucket) {
          // Clamp to closest edge bucket
          matchedBucket = b.x < WALL_LEFT + (WALL_RIGHT - WALL_LEFT) / 2 ? nextBuckets[0] : nextBuckets[nextBuckets.length - 1];
        }

        matchedBucket.highlightTimer = 1.0;

        const earned = b.value * matchedBucket.multiplier;
        scoreGained += earned;

        events.push({
          type: 'bucket_scored',
          bucketIndex: matchedBucket.index,
          multiplier: matchedBucket.multiplier,
          scoreEarned: earned,
          isJackpot: !!matchedBucket.isJackpot,
        });

        if (matchedBucket.isJackpot) {
          events.push({ type: 'jackpot_celebration', scoreEarned: earned });
        }
      }
    }
  }

  // Filter out settled bottles
  const remainingBottles = activeBottles.filter((b) => !b.settled);

  const nextScore = state.score + scoreGained;
  const nextHighScore = Math.max(state.highScore, nextScore);

  // Status check: if 0 bottles left and no bottles in flight
  let nextStatus = state.status;
  if (state.bottlesLeft === 0 && remainingBottles.length === 0) {
    nextStatus = 'game_over';
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: nextHighScore,
      bottlesInPlay: remainingBottles,
      pegs: nextPegs,
      buckets: nextBuckets,
      hopper: {
        ...state.hopper,
        x: nextHopperX,
        dir: nextHopperDir,
      },
      frenzyActive: nextFrenzyActive,
      frenzyTimer: nextFrenzyTimer,
      frenzyMeter: nextFrenzyMeter,
      totalBucketed: state.totalBucketed + bucketedCount,
    },
    events,
  };
}

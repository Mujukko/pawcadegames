import {
  BarnyardPopcornPopperState,
  KernelModel,
  StageDefinition,
  WallSegment,
} from './types';

export const STAGES: StageDefinition[] = [
  {
    id: 1,
    name: 'Butter Barn Kettle',
    subtitle: 'Hold to pour golden corn into the copper kettle!',
    spawnerX: 200,
    spawnerY: 100,
    maxKernels: 45,
    maxSpillsAllowed: 4,
    bucket: {
      x: 200,
      y: 350,
      width: 170,
      height: 190,
      targetLineY: 410,
      brimY: 350,
      walls: [
        { x1: 115, y1: 350, x2: 130, y2: 540 }, // left wall
        { x1: 130, y1: 540, x2: 270, y2: 540 }, // bottom
        { x1: 270, y1: 540, x2: 285, y2: 350 }, // right wall
      ],
    },
    obstacles: [],
  },
  {
    id: 2,
    name: 'Caramel Swirl Funnel',
    subtitle: 'Pour through the narrow silo chute without overflowing!',
    spawnerX: 200,
    spawnerY: 80,
    maxKernels: 55,
    maxSpillsAllowed: 5,
    bucket: {
      x: 200,
      y: 360,
      width: 180,
      height: 180,
      targetLineY: 420,
      brimY: 360,
      walls: [
        // Funnel guides
        { x1: 140, y1: 170, x2: 180, y2: 250 },
        { x1: 260, y1: 170, x2: 220, y2: 250 },
        // Kettle
        { x1: 110, y1: 360, x2: 130, y2: 540 },
        { x1: 130, y1: 540, x2: 270, y2: 540 },
        { x1: 270, y1: 540, x2: 290, y2: 360 },
      ],
    },
    obstacles: [],
  },
  {
    id: 3,
    name: 'Windmill Paddle Popper',
    subtitle: 'Time your pour past the spinning wooden paddle!',
    spawnerX: 200,
    spawnerY: 80,
    maxKernels: 55,
    maxSpillsAllowed: 5,
    bucket: {
      x: 200,
      y: 360,
      width: 180,
      height: 180,
      targetLineY: 420,
      brimY: 360,
      walls: [
        { x1: 110, y1: 360, x2: 130, y2: 540 },
        { x1: 130, y1: 540, x2: 270, y2: 540 },
        { x1: 270, y1: 540, x2: 290, y2: 360 },
      ],
    },
    obstacles: [
      {
        id: 'paddle_center',
        type: 'paddle',
        x: 200,
        y: 230,
        width: 90,
        height: 14,
        angle: 0,
        rotationSpeed: 1.8,
      },
    ],
  },
  {
    id: 4,
    name: 'County Fair Cinema Tub',
    subtitle: 'Fill the massive jumbo bucket right to the golden rim!',
    spawnerX: 200,
    spawnerY: 70,
    maxKernels: 65,
    maxSpillsAllowed: 6,
    bucket: {
      x: 200,
      y: 350,
      width: 210,
      height: 200,
      targetLineY: 410,
      brimY: 350,
      walls: [
        // Wide Cinema Tub
        { x1: 95, y1: 350, x2: 120, y2: 550 },
        { x1: 120, y1: 550, x2: 280, y2: 550 },
        { x1: 280, y1: 550, x2: 305, y2: 350 },
      ],
    },
    obstacles: [
      {
        id: 'paddle_left',
        type: 'paddle',
        x: 160,
        y: 210,
        width: 70,
        height: 12,
        angle: 0.5,
        rotationSpeed: 1.5,
      },
      {
        id: 'paddle_right',
        type: 'paddle',
        x: 240,
        y: 210,
        width: 70,
        height: 12,
        angle: -0.5,
        rotationSpeed: -1.5,
      },
    ],
  },
];

let nextKernelId = 1;

export function createInitialState(stageIndex = 0, highScore = 0): BarnyardPopcornPopperState {
  const stage = STAGES[stageIndex] || STAGES[0];
  return {
    stage: stage.id,
    kernels: [],
    isPouring: false,
    phase: 'ready',
    kernelsPoured: 0,
    maxKernels: stage.maxKernels,
    fillRatio: 0,
    spilledCount: 0,
    maxSpillsAllowed: stage.maxSpillsAllowed,
    score: 0,
    highScore,
    stars: 0,
    evaluationTimer: 0,
    events: [],
  };
}

export function startPouring(state: BarnyardPopcornPopperState): BarnyardPopcornPopperState {
  if (state.phase !== 'ready' && state.phase !== 'pouring') {
    return state;
  }
  state.isPouring = true;
  state.phase = 'pouring';
  state.events.push({ type: 'start_pour' });
  return state;
}

export function stopPouring(state: BarnyardPopcornPopperState): BarnyardPopcornPopperState {
  state.isPouring = false;
  if (state.phase === 'pouring') {
    state.phase = 'popping';
    state.events.push({ type: 'stop_pour' });
  }
  return state;
}

function spawnKernel(spawnerX: number, spawnerY: number): KernelModel {
  const spreadX = (Math.random() - 0.5) * 16;
  return {
    id: nextKernelId++,
    x: spawnerX + spreadX,
    y: spawnerY,
    vx: (Math.random() - 0.5) * 40,
    vy: 60 + Math.random() * 50,
    radius: 5,
    isPopped: false,
    popTimer: 0.6 + Math.random() * 0.8, // pops shortly after heating
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 6,
    color: '#f59e0b',
    settled: false,
  };
}

// Distance from point to line segment
function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; nearestX: number; nearestY: number; nx: number; ny: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) {
    const d = Math.hypot(px - x1, py - y1);
    return { dist: d, nearestX: x1, nearestY: y1, nx: 0, ny: -1 };
  }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const nearestX = x1 + t * dx;
  const nearestY = y1 + t * dy;
  const dist = Math.hypot(px - nearestX, py - nearestY);

  // Normal vector
  let nx = -(y2 - y1);
  let ny = x2 - x1;
  const nLen = Math.hypot(nx, ny);
  if (nLen > 0) {
    nx /= nLen;
    ny /= nLen;
  }
  return { dist, nearestX, nearestY, nx, ny };
}

export function updateEngine(
  state: BarnyardPopcornPopperState,
  dt: number
): BarnyardPopcornPopperState {
  state.events = [];
  const currentStage = STAGES.find((s) => s.id === state.stage) || STAGES[0];

  // 1. Spawning kernels while pouring
  if (state.isPouring && state.kernelsPoured < state.maxKernels) {
    // Spawn 1-2 kernels every ~0.08s
    const toSpawn = Math.min(2, state.maxKernels - state.kernelsPoured);
    for (let i = 0; i < toSpawn; i++) {
      state.kernels.push(spawnKernel(currentStage.spawnerX, currentStage.spawnerY));
      state.kernelsPoured++;
      state.events.push({ type: 'kernel_drop' });
    }
    if (state.kernelsPoured >= state.maxKernels) {
      state.isPouring = false;
      state.phase = 'popping';
    }
  }

  // 2. Update rotating obstacles
  for (const obs of currentStage.obstacles) {
    if (obs.type === 'paddle') {
      obs.angle += obs.rotationSpeed * dt;
    }
  }

  const gravity = 620; // px/s²
  const restitution = 0.35; // bounce damping

  // 3. Update kernels physics
  for (const k of state.kernels) {
    // Apply gravity
    k.vy += gravity * dt;
    k.x += k.vx * dt;
    k.y += k.vy * dt;
    k.rotation += k.rotationSpeed * dt;
    k.vx *= Math.pow(0.98, dt * 60);

    // Heat & Popping countdown
    if (!k.isPopped) {
      // Pops faster when near bottom kettle area (heating surface)
      const heatMultiplier = k.y > 380 ? 1.8 : 0.8;
      k.popTimer -= dt * heatMultiplier;
      if (k.popTimer <= 0) {
        k.isPopped = true;
        k.radius = 12.5; // Expands to fluffy popcorn
        k.color = Math.random() > 0.4 ? '#fffbeb' : '#fef08a'; // Cream butter
        k.vy = -(120 + Math.random() * 130); // Pop blast upwards
        k.vx += (Math.random() - 0.5) * 80;
        k.rotationSpeed = (Math.random() - 0.5) * 12;
        state.events.push({ type: 'kernel_pop', id: k.id, x: k.x, y: k.y });
      }
    }

    // Static Wall collisions
    for (const wall of currentStage.bucket.walls) {
      const col = distToSegment(k.x, k.y, wall.x1, wall.y1, wall.x2, wall.y2);
      if (col.dist < k.radius) {
        const overlap = k.radius - col.dist;
        // Push out along normal
        const sign = (k.x - col.nearestX) * col.nx + (k.y - col.nearestY) * col.ny >= 0 ? 1 : -1;
        k.x += col.nx * overlap * sign;
        k.y += col.ny * overlap * sign;

        // Reflect velocity
        const dot = k.vx * col.nx + k.vy * col.ny;
        k.vx = (k.vx - 2 * dot * col.nx) * restitution;
        k.vy = (k.vy - 2 * dot * col.ny) * restitution;
      }
    }

    // Dynamic Paddle collisions
    for (const obs of currentStage.obstacles) {
      if (obs.type === 'paddle') {
        const cos = Math.cos(obs.angle);
        const sin = Math.sin(obs.angle);
        const halfW = obs.width / 2;
        const x1 = obs.x - cos * halfW;
        const y1 = obs.y - sin * halfW;
        const x2 = obs.x + cos * halfW;
        const y2 = obs.y + sin * halfW;

        const col = distToSegment(k.x, k.y, x1, y1, x2, y2);
        if (col.dist < k.radius + obs.height / 2) {
          const overlap = k.radius + obs.height / 2 - col.dist;
          const sign = (k.x - col.nearestX) * col.nx + (k.y - col.nearestY) * col.ny >= 0 ? 1 : -1;
          k.x += col.nx * overlap * sign;
          k.y += col.ny * overlap * sign;

          // Paddle rotational kick
          const kickX = -sin * obs.rotationSpeed * 35;
          const kickY = cos * obs.rotationSpeed * 35;
          k.vx = (k.vx + kickX) * 0.5;
          k.vy = (k.vy + kickY) * 0.5;
        }
      }
    }

    // Out of bounds spill check
    if (k.y > 580 || (k.y < currentStage.bucket.brimY && (k.x < 70 || k.x > 330))) {
      if (!k.settled) {
        k.settled = true;
        state.spilledCount++;
        state.events.push({ type: 'spill', spilledCount: state.spilledCount });
      }
    }
  }

  // 4. Circle-to-circle particle stacking relaxation (for bottom pile volume)
  const len = state.kernels.length;
  for (let i = 0; i < len; i++) {
    const p1 = state.kernels[i];
    if (p1.y > 600) continue;
    for (let j = i + 1; j < len; j++) {
      const p2 = state.kernels[j];
      if (p2.y > 600) continue;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const minDist = p1.radius + p2.radius;
      const distSq = dx * dx + dy * dy;

      if (distSq < minDist * minDist && distSq > 0.001) {
        const dist = Math.sqrt(distSq);
        const overlap = (minDist - dist) * 0.5;
        const nx = dx / dist;
        const ny = dy / dist;

        p1.x -= nx * overlap;
        p1.y -= ny * overlap;
        p2.x += nx * overlap;
        p2.y += ny * overlap;

        p1.vx -= nx * overlap * 10;
        p1.vy -= ny * overlap * 10;
        p2.vx += nx * overlap * 10;
        p2.vy += ny * overlap * 10;
      }
    }
  }

  // 5. Calculate fill ratio
  // Measure volume of popped kernels inside bucket bounds
  const bucket = currentStage.bucket;
  let inBucketCount = 0;
  let topPopcornY = bucket.y + bucket.height;

  for (const k of state.kernels) {
    if (
      k.isPopped &&
      k.y >= bucket.brimY - 20 &&
      k.y <= bucket.y + bucket.height &&
      k.x >= bucket.x - bucket.width / 2 &&
      k.x <= bucket.x + bucket.width / 2
    ) {
      inBucketCount++;
      if (k.y < topPopcornY) {
        topPopcornY = k.y;
      }
    }
  }

  const fillHeight = Math.max(0, bucket.y + bucket.height - topPopcornY);
  const targetHeight = bucket.y + bucket.height - bucket.targetLineY;
  state.fillRatio = Math.min(1.2, fillHeight / Math.max(1, targetHeight));

  // 6. Win / Loss evaluation
  if (state.phase === 'popping' || state.phase === 'evaluating') {
    state.phase = 'evaluating';
    state.evaluationTimer += dt;

    // Check spill limit breach
    if (state.spilledCount > state.maxSpillsAllowed) {
      state.phase = 'lost';
      state.events.push({ type: 'game_over', reason: 'spill_limit' });
    } else if (state.evaluationTimer >= 2.8) {
      // Evaluation finishes
      if (state.fillRatio >= 0.85) {
        state.phase = 'won';
        // Star calculation
        let stars = 1;
        if (state.fillRatio >= 0.95 && state.spilledCount <= 1) stars = 3;
        else if (state.fillRatio >= 0.9 && state.spilledCount <= 3) stars = 2;

        const baseScore = 1000 * state.stage;
        const accuracyBonus = Math.round((1 - Math.abs(1.0 - state.fillRatio)) * 500);
        const spillPenalty = state.spilledCount * 60;
        state.stars = stars;
        state.score += Math.max(100, baseScore + accuracyBonus - spillPenalty);
        if (state.score > state.highScore) {
          state.highScore = state.score;
        }
        state.events.push({ type: 'victory', stars, score: state.score });
      } else {
        state.phase = 'lost';
        state.events.push({ type: 'game_over', reason: 'underfilled' });
      }
    }
  }

  return state;
}

export function restartStage(
  state: BarnyardPopcornPopperState,
  stageIndex?: number
): BarnyardPopcornPopperState {
  const currentStageIdx =
    stageIndex !== undefined
      ? stageIndex
      : STAGES.findIndex((s) => s.id === state.stage);
  const idx = Math.max(0, currentStageIdx);
  const next = createInitialState(idx, state.highScore);
  next.score = state.score;
  next.events.push({ type: 'restart' });
  return next;
}

export function nextStage(state: BarnyardPopcornPopperState): BarnyardPopcornPopperState {
  const currentIdx = STAGES.findIndex((s) => s.id === state.stage);
  const nextIdx = (currentIdx + 1) % STAGES.length;
  const next = createInitialState(nextIdx, state.highScore);
  next.score = state.score;
  next.events.push({ type: 'stage_advance', stage: next.stage });
  return next;
}

import { AnimalTierConfig, AnimalBall, SuikaState } from './types';

export const BOX_LEFT = 25;
export const BOX_RIGHT = 375;
export const BOX_BOTTOM = 535;
export const DANGER_Y = 110;

export const ANIMAL_TIERS: AnimalTierConfig[] = [
  { tier: 0, name: 'Chick', emoji: '🐥', radius: 18, score: 2, color: '#fef08a', borderColor: '#eab308' },
  { tier: 1, name: 'Duckling', emoji: '🦆', radius: 24, score: 4, color: '#fed7aa', borderColor: '#f97316' },
  { tier: 2, name: 'Kitten', emoji: '🐱', radius: 30, score: 8, color: '#fbcfe8', borderColor: '#ec4899' },
  { tier: 3, name: 'Bunny', emoji: '🐰', radius: 36, score: 16, color: '#e0e7ff', borderColor: '#6366f1' },
  { tier: 4, name: 'Puppy', emoji: '🐶', radius: 43, score: 32, color: '#fde68a', borderColor: '#d97706' },
  { tier: 5, name: 'Piglet', emoji: '🐷', radius: 51, score: 64, color: '#f472b6', borderColor: '#db2777' },
  { tier: 6, name: 'Sheep', emoji: '🐑', radius: 60, score: 128, color: '#f8fafc', borderColor: '#94a3b8' },
  { tier: 7, name: 'Cow', emoji: '🐮', radius: 70, score: 256, color: '#a7f3d0', borderColor: '#059669' },
  { tier: 8, name: 'Capybara', emoji: '🦫', radius: 82, score: 512, color: '#d97706', borderColor: '#78350f' },
  { tier: 9, name: 'Watermelon Elephant', emoji: '🍉🐘', radius: 96, score: 1024, color: '#4ade80', borderColor: '#166534' },
];

let ballIdCounter = 1;

export function getRandomDropTier(): number {
  // Only drop small starter animals (tiers 0, 1, or 2)
  const rand = Math.random();
  if (rand < 0.5) return 0;
  if (rand < 0.85) return 1;
  return 2;
}

export function createInitialState(savedHighScore: number = 0): SuikaState {
  const currentDropTier = getRandomDropTier();
  const nextDropTier = getRandomDropTier();

  return {
    currentDropTier,
    nextDropTier,
    dropX: 200,
    balls: [],
    score: 0,
    highScore: savedHighScore,
    gameOver: false,
    overflowTimer: 0,
  };
}

export function dropBall(state: SuikaState): AnimalBall | null {
  if (state.gameOver) return null;

  const tierCfg = ANIMAL_TIERS[state.currentDropTier];
  if (!tierCfg) return null;

  // Clamp drop position so ball starts completely inside the container
  const clampedX = Math.max(BOX_LEFT + tierCfg.radius, Math.min(BOX_RIGHT - tierCfg.radius, state.dropX));

  const newBall: AnimalBall = {
    id: ballIdCounter++,
    tier: state.currentDropTier,
    x: clampedX,
    y: 70,
    vx: 0,
    vy: 100, // Initial drop velocity
    radius: tierCfg.radius,
  };

  state.balls.push(newBall);
  state.currentDropTier = state.nextDropTier;
  state.nextDropTier = getRandomDropTier();

  return newBall;
}

function singlePhysicsStep(state: SuikaState, dt: number): {
  merges: { x: number; y: number; newTier: number }[];
  bounced: boolean;
} {
  const gravity = 980; // pixels / sec^2
  let bounced = false;
  const merges: { x: number; y: number; newTier: number }[] = [];

  // 1. Integration
  for (const ball of state.balls) {
    ball.vy += gravity * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;

    ball.vx *= Math.pow(0.99, dt * 60);
    ball.vy *= Math.pow(0.99, dt * 60);

    // Floor
    if (ball.y + ball.radius >= BOX_BOTTOM) {
      ball.y = BOX_BOTTOM - ball.radius;
      if (Math.abs(ball.vy) > 40) bounced = true;
      ball.vy = -ball.vy * 0.25;
      ball.vx *= 0.92;
    }

    // Left Wall
    if (ball.x - ball.radius <= BOX_LEFT) {
      ball.x = BOX_LEFT + ball.radius;
      ball.vx = -ball.vx * 0.35;
      bounced = true;
    }

    // Right Wall
    if (ball.x + ball.radius >= BOX_RIGHT) {
      ball.x = BOX_RIGHT - ball.radius;
      ball.vx = -ball.vx * 0.35;
      bounced = true;
    }
  }

  // 2. Pairwise Collisions (2 relaxation passes for stacking rigidity)
  const ballsToRemove = new Set<number>();
  const ballsToAdd: AnimalBall[] = [];

  for (let pass = 0; pass < 2; pass++) {
    for (let i = 0; i < state.balls.length; i++) {
      const b1 = state.balls[i]!;
      if (ballsToRemove.has(b1.id)) continue;

      for (let j = i + 1; j < state.balls.length; j++) {
        const b2 = state.balls[j]!;
        if (ballsToRemove.has(b2.id)) continue;

        const dx = b2.x - b1.x;
        const dy = b2.y - b1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0.001) {
          if (pass === 0 && b1.tier === b2.tier && b1.tier < ANIMAL_TIERS.length - 1) {
            ballsToRemove.add(b1.id);
            ballsToRemove.add(b2.id);

            const nextTier = b1.tier + 1;
            const nextCfg = ANIMAL_TIERS[nextTier]!;
            const midX = (b1.x + b2.x) / 2;
            const midY = (b1.y + b2.y) / 2;

            ballsToAdd.push({
              id: ballIdCounter++,
              tier: nextTier,
              x: midX,
              y: midY,
              vx: (b1.vx + b2.vx) * 0.5,
              vy: Math.min(-60, (b1.vy + b2.vy) * 0.5),
              radius: nextCfg.radius,
            });

            state.score += nextCfg.score;
            if (state.score > state.highScore) {
              state.highScore = state.score;
            }

            merges.push({ x: midX, y: midY, newTier: nextTier });
            break;
          }

          // Positional relaxation
          const overlap = minDist - dist;
          const nx = dx / dist;
          const ny = dy / dist;

          const m1 = b1.radius * b1.radius;
          const m2 = b2.radius * b2.radius;
          const totalMass = m1 + m2;

          b1.x -= nx * overlap * (m2 / totalMass);
          b1.y -= ny * overlap * (m2 / totalMass);
          b2.x += nx * overlap * (m1 / totalMass);
          b2.y += ny * overlap * (m1 / totalMass);

          if (pass === 0) {
            const kx = b1.vx - b2.vx;
            const ky = b1.vy - b2.vy;
            const p = 2 * (nx * kx + ny * ky) / totalMass;

            b1.vx -= p * m2 * nx * 0.35;
            b1.vy -= p * m2 * ny * 0.35;
            b2.vx += p * m1 * nx * 0.35;
            b2.vy += p * m1 * ny * 0.35;

            if (Math.abs(kx) + Math.abs(ky) > 80) bounced = true;
          }
        }
      }
    }
  }

  if (ballsToRemove.size > 0) {
    state.balls = state.balls.filter(b => !ballsToRemove.has(b.id));
    state.balls.push(...ballsToAdd);
  }

  return { merges, bounced };
}

export function updatePhysics(state: SuikaState, dt: number): {
  merges: { x: number; y: number; newTier: number }[];
  bounced: boolean;
} {
  if (state.gameOver) return { merges: [], bounced: false };

  // Sub-step for physics stability
  const subDt = 0.016; // 60 FPS sub-steps
  let steps = Math.max(1, Math.ceil(dt / subDt));
  if (steps > 150) steps = 150;
  const actualSubDt = dt / steps;

  let anyBounced = false;
  const allMerges: { x: number; y: number; newTier: number }[] = [];

  for (let s = 0; s < steps; s++) {
    const res = singlePhysicsStep(state, actualSubDt);
    if (res.bounced) anyBounced = true;
    allMerges.push(...res.merges);
  }

  // 3. Overflow Danger Line Check
  let hasRestingAboveDanger = false;
  for (const b of state.balls) {
    if (b.y - b.radius < DANGER_Y && Math.abs(b.vy) < 150) {
      hasRestingAboveDanger = true;
      break;
    }
  }

  if (hasRestingAboveDanger) {
    state.overflowTimer += dt;
    if (state.overflowTimer >= 2.0) {
      state.gameOver = true;
    }
  } else {
    state.overflowTimer = Math.max(0, state.overflowTimer - dt * 1.5);
  }

  return { merges: allMerges, bounced: anyBounced };
}


/**
 * Egg Buster: Barnyard Smash — Pure TypeScript Physics Engine
 * Inspired by Smash Fest! / Royal Smash! (1.81M US App Store Downloads).
 *
 * Mechanics:
 * - Pippin the Chick aims a wooden slingshot on the farm.
 * - Drag and release to launch eggs with 2D gravity physics.
 * - Projectiles bounce off metal milk cans and smash through wooden crates.
 * - Eliminate all sneaky foxes to achieve victory!
 */

export type TargetType = 'fox' | 'crate' | 'hay' | 'metal';

export interface Target {
  id: string;
  type: TargetType;
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  isDestroyed: boolean;
}

export interface EggProjectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isActive: boolean;
  bouncesLeft: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface EggBusterState {
  level: number;
  eggsRemaining: number;
  targets: Target[];
  egg: EggProjectile | null;
  score: number;
  isWon: boolean;
  isGameOver: boolean;
  slingshotAnchor: { x: number; y: number };
}

export interface EggLevelConfig {
  level: number;
  eggsAllowed: number;
  slingshot: { x: number; y: number };
  targets: {
    id: string;
    type: TargetType;
    x: number;
    y: number;
    width: number;
    height: number;
    hp: number;
  }[];
}

export const GRAVITY = 750; // px / sec^2
export const BOUNCE_RESTITUTION = 0.55;
export const MAX_BOUNCES = 4;
export const WORLD_WIDTH = 500;
export const WORLD_HEIGHT = 420;
export const FLOOR_Y = 385;
export const POWER_SCALE = 8.0; // Responsive slingshot launch power

export const EGG_LEVELS: EggLevelConfig[] = [
  // Level 1: Beginner Target (1 Fox perched on 2 crates)
  {
    level: 1,
    eggsAllowed: 3,
    slingshot: { x: 120, y: 295 },
    targets: [
      { id: 'c1', type: 'crate', x: 370, y: 340, width: 44, height: 44, hp: 1 },
      { id: 'c2', type: 'crate', x: 370, y: 295, width: 44, height: 44, hp: 1 },
      { id: 'f1', type: 'fox', x: 372, y: 250, width: 40, height: 40, hp: 1 },
    ],
  },
  // Level 2: Barricade & High Perch (2 Foxes)
  {
    level: 2,
    eggsAllowed: 3,
    slingshot: { x: 120, y: 295 },
    targets: [
      // Metal guard milk can (bounces)
      { id: 'm1', type: 'metal', x: 260, y: 340, width: 34, height: 44, hp: 99 },
      // Wooden crate tower
      { id: 'c1', type: 'crate', x: 360, y: 340, width: 44, height: 44, hp: 1 },
      { id: 'f1', type: 'fox', x: 362, y: 295, width: 40, height: 40, hp: 1 },
      // High shelf fox
      { id: 'c2', type: 'crate', x: 430, y: 340, width: 44, height: 44, hp: 1 },
      { id: 'c3', type: 'crate', x: 430, y: 295, width: 44, height: 44, hp: 1 },
      { id: 'c4', type: 'crate', x: 430, y: 250, width: 44, height: 44, hp: 1 },
      { id: 'f2', type: 'fox', x: 432, y: 205, width: 40, height: 40, hp: 1 },
    ],
  },
  // Level 3: Bunker Defense (3 Foxes behind hay & crates)
  {
    level: 3,
    eggsAllowed: 4,
    slingshot: { x: 120, y: 295 },
    targets: [
      { id: 'h1', type: 'hay', x: 230, y: 340, width: 50, height: 44, hp: 2 },
      { id: 'c1', type: 'crate', x: 320, y: 340, width: 44, height: 44, hp: 1 },
      { id: 'f1', type: 'fox', x: 322, y: 295, width: 40, height: 40, hp: 1 },
      { id: 'm1', type: 'metal', x: 375, y: 340, width: 34, height: 44, hp: 99 },
      { id: 'c2', type: 'crate', x: 435, y: 340, width: 44, height: 44, hp: 1 },
      { id: 'f2', type: 'fox', x: 437, y: 295, width: 40, height: 40, hp: 1 },
      { id: 'c3', type: 'crate', x: 435, y: 250, width: 44, height: 44, hp: 1 },
      { id: 'f3', type: 'fox', x: 437, y: 205, width: 40, height: 40, hp: 1 },
    ],
  },
];

export function initializeEggBusterLevel(lvl: number): EggBusterState {
  const config = EGG_LEVELS.find(l => l.level === lvl) || EGG_LEVELS[0];

  return {
    level: config.level,
    eggsRemaining: config.eggsAllowed,
    targets: config.targets.map(t => ({ ...t, isDestroyed: false })),
    egg: null,
    score: 0,
    isWon: false,
    isGameOver: false,
    slingshotAnchor: { ...config.slingshot },
  };
}

/**
 * Predicts the projectile trajectory based on pull-back offset.
 */
export function calculateTrajectory(
  anchor: { x: number; y: number },
  pullX: number,
  pullY: number,
  steps: number = 24,
  dt: number = 0.04
): TrajectoryPoint[] {
  // Vector from current touch point back to anchor
  const dx = anchor.x - pullX;
  const dy = anchor.y - pullY;

  // Power multiplier
  const powerScale = POWER_SCALE;
  let vx = dx * powerScale;
  let vy = dy * powerScale;

  let x = anchor.x;
  let y = anchor.y;

  const points: TrajectoryPoint[] = [{ x, y }];

  for (let i = 0; i < steps; i++) {
    x += vx * dt;
    y += vy * dt;
    vy += GRAVITY * dt;

    if (y >= FLOOR_Y || x >= WORLD_WIDTH) {
      points.push({ x, y: Math.min(y, FLOOR_Y) });
      break;
    }
    points.push({ x, y });
  }

  return points;
}

/**
 * Launches an egg based on slingshot drag displacement.
 */
export function launchEgg(
  state: EggBusterState,
  pullX: number,
  pullY: number
): EggBusterState {
  if (state.egg !== null || state.eggsRemaining <= 0 || state.isWon || state.isGameOver) {
    return state;
  }

  const dx = state.slingshotAnchor.x - pullX;
  const dy = state.slingshotAnchor.y - pullY;
  const powerScale = POWER_SCALE;

  const vx = dx * powerScale;
  const vy = dy * powerScale;

  const newEgg: EggProjectile = {
    x: state.slingshotAnchor.x,
    y: state.slingshotAnchor.y,
    vx,
    vy,
    radius: 10,
    isActive: true,
    bouncesLeft: MAX_BOUNCES,
  };

  return {
    ...state,
    eggsRemaining: state.eggsRemaining - 1,
    egg: newEgg,
  };
}

/**
 * Steps the physics simulation of the in-flight egg.
 * Detects collisions with targets and floor boundaries.
 */
export function stepPhysics(
  state: EggBusterState,
  dt: number
): {
  nextState: EggBusterState;
  hitTarget: Target | null;
  destroyedTarget: Target | null;
  bounced: boolean;
} {
  if (!state.egg || !state.egg.isActive) {
    return { nextState: state, hitTarget: null, destroyedTarget: null, bounced: false };
  }

  const egg = { ...state.egg };
  let newVx = egg.vx;
  let newVy = egg.vy + GRAVITY * dt;
  let newX = egg.x + newVx * dt;
  let newY = egg.y + newVy * dt;

  let hitTarget: Target | null = null;
  let destroyedTarget: Target | null = null;
  let bounced = false;
  let pointsAwarded = 0;

  // 1. Collision with Targets
  const updatedTargets = state.targets.map(t => {
    if (t.isDestroyed) return t;

    // AABB vs Circle collision check
    const nearestX = Math.max(t.x, Math.min(newX, t.x + t.width));
    const nearestY = Math.max(t.y, Math.min(newY, t.y + t.height));
    const deltaX = newX - nearestX;
    const deltaY = newY - nearestY;
    const distSq = deltaX * deltaX + deltaY * deltaY;

    if (distSq <= egg.radius * egg.radius) {
      hitTarget = t;
      bounced = true;

      // Reverse velocity based on collision normal
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        newVx = -newVx * BOUNCE_RESTITUTION;
      } else {
        newVy = -newVy * BOUNCE_RESTITUTION;
      }

      const nextHp = t.hp - 1;
      if (nextHp <= 0) {
        destroyedTarget = { ...t, isDestroyed: true, hp: 0 };
        pointsAwarded += t.type === 'fox' ? 500 : 150;
        return { ...t, isDestroyed: true, hp: 0 };
      }
      return { ...t, hp: nextHp };
    }
    return t;
  });

  // 1.5. Tower Gravity Collapse: If a supporting crate was destroyed, drop stacked targets directly above it
  if (destroyedTarget && (destroyedTarget.type === 'crate' || destroyedTarget.type === 'hay')) {
    const destX = destroyedTarget.x;
    const destY = destroyedTarget.y;
    const destH = destroyedTarget.height;
    for (let i = 0; i < updatedTargets.length; i++) {
      const obj = updatedTargets[i];
      if (!obj.isDestroyed && Math.abs(obj.x - destX) < 24 && obj.y < destY) {
        obj.y = Math.min(obj.y + destH, FLOOR_Y - obj.height);
      }
    }
  }

  // 2. Collision with Floor
  if (newY >= FLOOR_Y - egg.radius) {
    newY = FLOOR_Y - egg.radius;
    newVy = -newVy * BOUNCE_RESTITUTION;
    newVx = newVx * 0.85; // friction
    egg.bouncesLeft--;
    bounced = true;
  }

  // 3. Right & Left Wall Bounces
  if (newX >= WORLD_WIDTH - egg.radius) {
    newX = WORLD_WIDTH - egg.radius;
    newVx = -newVx * BOUNCE_RESTITUTION;
    bounced = true;
  }

  // Check if egg has stopped or ran out of bounces
  const speed = Math.sqrt(newVx * newVx + newVy * newVy);
  if (egg.bouncesLeft <= 0 || speed < 25 || newX > WORLD_WIDTH + 50) {
    egg.isActive = false;
  } else {
    egg.x = newX;
    egg.y = newY;
    egg.vx = newVx;
    egg.vy = newVy;
  }

  // Check Win condition (All foxes destroyed)
  const remainingFoxes = updatedTargets.filter(t => t.type === 'fox' && !t.isDestroyed);
  const isWon = remainingFoxes.length === 0;

  // Check Game Over condition (No eggs left and egg is inactive and foxes still remain)
  const isGameOver = !isWon && state.eggsRemaining === 0 && !egg.isActive;

  return {
    nextState: {
      ...state,
      targets: updatedTargets,
      egg: egg.isActive ? egg : null,
      score: state.score + pointsAwarded,
      isWon,
      isGameOver,
    },
    hitTarget,
    destroyedTarget,
    bounced,
  };
}

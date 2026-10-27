export type ItemType =
  | 'apple'
  | 'acorn'
  | 'carrot'
  | 'milk_can'
  | 'wood_crate'
  | 'pumpkin'
  | 'hay_bale'
  | 'fence_post'
  | 'tractor'
  | 'grain_silo';

export interface FoodItem {
  id: string;
  type: ItemType;
  x: number;
  y: number;
  radius: number;
  points: number;
  minTier: number;
}

export interface PiggyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  tier: number; // 1 to 4
  tierTitle: string;
  nextTierThreshold: number;
  score: number;
  highScore: number;
  streak: number;
  streakTimer: number; // seconds left
  multiplier: number;
  wobblePhase: number;
  isChomping: boolean;
  chompTimer: number;
}

export interface HungryPiggyGame {
  piggy: PiggyState;
  items: FoodItem[];
  worldWidth: number;
  worldHeight: number;
  timeLeft: number;
  gameOver: boolean;
  itemsEatenCount: number;
}

export interface EatEvent {
  item: FoodItem;
  pointsEarned: number;
  tierUp: boolean;
  newTier: number;
}

export const TIER_CONFIG = [
  { tier: 1, title: 'Little Piglet', threshold: 120, radius: 18, speed: 200 },
  { tier: 2, title: 'Chubby Porker', threshold: 350, radius: 28, speed: 215 },
  { tier: 3, title: 'Big Barn Hog', threshold: 800, radius: 40, speed: 225 },
  { tier: 4, title: 'Mega Barn Boss', threshold: Infinity, radius: 56, speed: 240 },
];

export const ITEM_DEFS: Record<ItemType, { radius: number; points: number; minTier: number }> = {
  acorn: { radius: 7, points: 10, minTier: 1 },
  apple: { radius: 9, points: 12, minTier: 1 },
  carrot: { radius: 8, points: 15, minTier: 1 },
  milk_can: { radius: 14, points: 35, minTier: 2 },
  wood_crate: { radius: 16, points: 40, minTier: 2 },
  pumpkin: { radius: 15, points: 45, minTier: 2 },
  hay_bale: { radius: 24, points: 90, minTier: 3 },
  fence_post: { radius: 20, points: 80, minTier: 3 },
  tractor: { radius: 36, points: 220, minTier: 4 },
  grain_silo: { radius: 44, points: 300, minTier: 4 },
};

export const WORLD_WIDTH = 1200;
export const WORLD_HEIGHT = 1200;
export const GAME_DURATION = 60; // seconds

export function createInitialPiggyGame(highScore: number = 0): HungryPiggyGame {
  const piggy: PiggyState = {
    x: WORLD_WIDTH / 2,
    y: WORLD_HEIGHT / 2,
    vx: 0,
    vy: 0,
    radius: TIER_CONFIG[0].radius,
    angle: 0,
    tier: 1,
    tierTitle: TIER_CONFIG[0].title,
    nextTierThreshold: TIER_CONFIG[0].threshold,
    score: 0,
    highScore,
    streak: 0,
    streakTimer: 0,
    multiplier: 1,
    wobblePhase: 0,
    isChomping: false,
    chompTimer: 0,
  };

  const items = spawnInitialItems(60);

  return {
    piggy,
    items,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
    timeLeft: GAME_DURATION,
    gameOver: false,
    itemsEatenCount: 0,
  };
}

export function spawnFoodItem(id: string, currentTier: number = 1): FoodItem {
  // Select an item type compatible with current tier, with bias toward current tier
  const availableTypes: ItemType[] = (Object.keys(ITEM_DEFS) as ItemType[]).filter(
    (t) => ITEM_DEFS[t].minTier <= currentTier + 1 // allow a few teaser items from next tier
  );

  const type = availableTypes[Math.floor(Math.random() * availableTypes.length)];
  const def = ITEM_DEFS[type];

  const margin = 50;
  const x = margin + Math.random() * (WORLD_WIDTH - margin * 2);
  const y = margin + Math.random() * (WORLD_HEIGHT - margin * 2);

  return {
    id,
    type,
    x,
    y,
    radius: def.radius,
    points: def.points,
    minTier: def.minTier,
  };
}

function spawnInitialItems(count: number): FoodItem[] {
  const items: FoodItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(spawnFoodItem(`food-${i}`, 1));
  }
  return items;
}

export function updatePiggyPhysics(
  game: HungryPiggyGame,
  targetX: number | null,
  targetY: number | null,
  dt: number
): { eatEvents: EatEvent[] } {
  if (game.gameOver || dt <= 0) return { eatEvents: [] };

  // Countdown timer
  game.timeLeft = Math.max(0, game.timeLeft - dt);
  if (game.timeLeft <= 0) {
    game.gameOver = true;
    if (game.piggy.score > game.piggy.highScore) {
      game.piggy.highScore = game.piggy.score;
    }
    return { eatEvents: [] };
  }

  const p = game.piggy;
  const config = TIER_CONFIG[p.tier - 1] || TIER_CONFIG[0];

  // Streak timer decay
  if (p.streakTimer > 0) {
    p.streakTimer -= dt;
    if (p.streakTimer <= 0) {
      p.streak = 0;
      p.multiplier = 1;
    }
  }

  // Chomp visual timer decay
  if (p.chompTimer > 0) {
    p.chompTimer -= dt;
    if (p.chompTimer <= 0) {
      p.isChomping = false;
    }
  }

  // Movement towards target (world coords)
  if (targetX !== null && targetY !== null) {
    const dx = targetX - p.x;
    const dy = targetY - p.y;
    const dist = Math.hypot(dx, dy);

    if (dist > 5) {
      const targetAngle = Math.atan2(dy, dx);
      // Smooth angle interpolation
      p.angle = targetAngle;

      const targetVx = Math.cos(targetAngle) * config.speed;
      const targetVy = Math.sin(targetAngle) * config.speed;

      const lerpSpeed = Math.min(1, dt * 10);
      p.vx += (targetVx - p.vx) * lerpSpeed;
      p.vy += (targetVy - p.vy) * lerpSpeed;
      p.wobblePhase += dt * 14;
    } else {
      p.vx *= Math.max(0, 1 - dt * 8);
      p.vy *= Math.max(0, 1 - dt * 8);
    }
  } else {
    // Friction deceleration
    p.vx *= Math.max(0, 1 - dt * 6);
    p.vy *= Math.max(0, 1 - dt * 6);
  }

  // Integrate position
  p.x += p.vx * dt;
  p.y += p.vy * dt;

  // World bounds clamp
  p.x = Math.max(p.radius, Math.min(game.worldWidth - p.radius, p.x));
  p.y = Math.max(p.radius, Math.min(game.worldHeight - p.radius, p.y));

  // Check food collision
  const eatEvents: EatEvent[] = [];
  const remainingItems: FoodItem[] = [];

  for (const item of game.items) {
    const dist = Math.hypot(p.x - item.x, p.y - item.y);
    const canEat = dist < p.radius + item.radius && p.tier >= item.minTier;

    if (canEat) {
      // Eat the item!
      p.streak += 1;
      p.streakTimer = 2.0; // 2 seconds to keep streak alive
      p.multiplier = Math.min(4, 1 + Math.floor(p.streak / 4));

      const points = item.points * p.multiplier;
      p.score += points;
      if (p.score > p.highScore) {
        p.highScore = p.score;
      }

      game.itemsEatenCount += 1;
      p.isChomping = true;
      p.chompTimer = 0.25;

      // Check Tier Up
      let tierUp = false;
      const nextTierIdx = p.tier; // next tier index is current tier (since 1-indexed)
      if (nextTierIdx < TIER_CONFIG.length && p.score >= TIER_CONFIG[p.tier - 1].threshold) {
        p.tier += 1;
        const newConfig = TIER_CONFIG[p.tier - 1];
        p.tierTitle = newConfig.title;
        p.nextTierThreshold = newConfig.threshold;
        p.radius = newConfig.radius;
        tierUp = true;
      }

      eatEvents.push({
        item,
        pointsEarned: points,
        tierUp,
        newTier: p.tier,
      });
    } else {
      remainingItems.push(item);
    }
  }

  // Replenish eaten items to keep the farmyard crowded
  while (remainingItems.length < 60) {
    remainingItems.push(spawnFoodItem(`food-${Date.now()}-${Math.random()}`, p.tier));
  }
  game.items = remainingItems;

  return { eatEvents };
}

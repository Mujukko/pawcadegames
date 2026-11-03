import {
  HoleIOState,
  FarmObject,
  HolePlayer,
  ObjectTier,
} from './types';

export const WORLD_SIZE = 1200;
export const ROUND_DURATION = 60; // 60 seconds
export const BASE_SPEED = 240;

const OBJECT_TEMPLATES: Array<{
  tier: ObjectTier;
  label: string;
  radius: number;
  points: number;
}> = [
  { tier: 1, label: 'Carrot', radius: 8, points: 5 },
  { tier: 1, label: 'Apple', radius: 8, points: 5 },
  { tier: 2, label: 'Pumpkin', radius: 14, points: 15 },
  { tier: 2, label: 'Hay Bale', radius: 16, points: 20 },
  { tier: 3, label: 'Pig', radius: 22, points: 35 },
  { tier: 3, label: 'Sheep', radius: 24, points: 40 },
  { tier: 4, label: 'Cow', radius: 32, points: 75 },
  { tier: 4, label: 'Tractor', radius: 38, points: 90 },
  { tier: 5, label: 'Red Barn', radius: 52, points: 200 },
  { tier: 5, label: 'Grain Silo', radius: 56, points: 250 },
];

export function createHoleIOGame(highScore = 0): HoleIOState {
  const objects: FarmObject[] = [];

  // Generate initial distribution
  for (let i = 0; i < 90; i++) {
    // 50% tier 1, 25% tier 2, 15% tier 3, 7% tier 4, 3% tier 5
    const rand = Math.random();
    let templateIdx = 0;
    if (rand < 0.5) templateIdx = Math.floor(Math.random() * 2);
    else if (rand < 0.75) templateIdx = 2 + Math.floor(Math.random() * 2);
    else if (rand < 0.90) templateIdx = 4 + Math.floor(Math.random() * 2);
    else if (rand < 0.97) templateIdx = 6 + Math.floor(Math.random() * 2);
    else templateIdx = 8 + Math.floor(Math.random() * 2);

    const tmpl = OBJECT_TEMPLATES[templateIdx];
    objects.push({
      id: `obj_${i}`,
      x: 60 + Math.random() * (WORLD_SIZE - 120),
      y: 60 + Math.random() * (WORLD_SIZE - 120),
      radius: tmpl.radius,
      tier: tmpl.tier,
      label: tmpl.label,
      points: tmpl.points,
      eaten: false,
      fallProgress: 0,
    });
  }

  const player: HolePlayer = {
    x: WORLD_SIZE * 0.5,
    y: WORLD_SIZE * 0.5,
    vx: 0,
    vy: 0,
    radius: 18,
    growthProgress: 0,
  };

  return {
    status: 'ready',
    score: 0,
    highScore,
    timeRemaining: ROUND_DURATION,
    player,
    objects,
    worldSize: WORLD_SIZE,
    events: [],
  };
}

export function setHoleVelocity(state: HoleIOState, vx: number, vy: number): HoleIOState {
  if (state.status === 'time_up') return state;

  return {
    ...state,
    status: 'playing',
    player: {
      ...state.player,
      vx: vx * BASE_SPEED,
      vy: vy * BASE_SPEED,
    },
  };
}

export function updateHoleIOGame(state: HoleIOState, rawDt: number): HoleIOState {
  if (state.status !== 'playing') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: HoleIOState['events'] = [];
  let status: HoleIOState['status'] = state.status;
  let score = state.score;
  let highScore = state.highScore;
  let timeRemaining = Math.max(0, state.timeRemaining - dt);

  if (timeRemaining <= 0) {
    status = 'time_up';
    events.push({ type: 'time_up' });
  }

  const player = { ...state.player };

  // Move hole within world boundaries
  player.x = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.x + player.vx * dt));
  player.y = Math.max(player.radius, Math.min(WORLD_SIZE - player.radius, player.y + player.vy * dt));

  let didEat = false;
  let didGrow = false;

  // Check swallowing collisions
  const objects = state.objects.map((obj) => {
    if (obj.eaten) return obj;

    const dist = Math.hypot(obj.x - player.x, obj.y - player.y);
    if (dist < player.radius * 0.95 && player.radius >= obj.radius) {
      didEat = true;
      score += obj.points;
      player.growthProgress += obj.points;

      // Check Hole Radius Growth
      const prevRad = player.radius;
      if (player.growthProgress >= 500) player.radius = 65;
      else if (player.growthProgress >= 260) player.radius = 48;
      else if (player.growthProgress >= 120) player.radius = 34;
      else if (player.growthProgress >= 40) player.radius = 24;

      if (player.radius > prevRad) didGrow = true;

      return {
        ...obj,
        eaten: true,
        fallProgress: 1,
      };
    }
    return obj;
  });

  if (didEat) events.push({ type: 'eat' });
  if (didGrow) events.push({ type: 'grow' });

  if (score > highScore) highScore = score;

  // Replenish small objects if too many eaten
  const activeCount = objects.filter((o) => !o.eaten).length;
  if (activeCount < 40) {
    for (let k = 0; k < 15; k++) {
      const tmpl = OBJECT_TEMPLATES[Math.floor(Math.random() * 4)]; // Tier 1-2
      objects.push({
        id: `obj_spawn_${Date.now()}_${k}`,
        x: 60 + Math.random() * (WORLD_SIZE - 120),
        y: 60 + Math.random() * (WORLD_SIZE - 120),
        radius: tmpl.radius,
        tier: tmpl.tier,
        label: tmpl.label,
        points: tmpl.points,
        eaten: false,
        fallProgress: 0,
      });
    }
  }

  return {
    ...state,
    status,
    score,
    highScore,
    timeRemaining,
    player,
    objects,
    events,
  };
}

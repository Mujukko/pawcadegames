export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  p1: Point;
  p2: Point;
}

export interface Beehive {
  id: string;
  x: number;
  y: number;
  beeCount: number;
}

export interface StaticPlatform {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'grass' | 'spikes' | 'water';
}

export interface SheepEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isGrounded: boolean;
  isStung: boolean;
}

export interface BeeEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  active: boolean;
}

export interface SheepLevelConfig {
  levelNumber: number;
  name: string;
  platforms: StaticPlatform[];
  sheep: Point;
  beehives: Beehive[];
  maxInk: number; // maximum line length in px
}

export interface SaveTheSheepState {
  level: number;
  levelName: string;
  status: 'drawing' | 'simulating' | 'level_cleared' | 'game_over' | 'victory';
  sheep: SheepEntity;
  platforms: StaticPlatform[];
  beehives: Beehive[];
  drawnPoints: Point[];
  fenceSegments: LineSegment[];
  bees: BeeEntity[];
  maxInk: number;
  usedInk: number;
  survivalTimer: number; // 5.0 seconds countdown
  score: number;
  stars: number;
  lives: number;
}

export interface SheepStepEvents {
  beeSpawned: boolean;
  fenceDeflectedBee: boolean;
  sheepStung: boolean;
  sheepFell: boolean;
  levelCompleted: boolean;
  gameOver: boolean;
}

export const SHEEP_RADIUS = 24;
export const BEE_RADIUS = 7;
export const FENCE_WIDTH = 12;
export const GRAVITY = 750;
export const SURVIVAL_DURATION = 5.0; // seconds to survive

export const LEVELS: SheepLevelConfig[] = [
  {
    levelNumber: 1,
    name: 'Meadow Hilltop',
    platforms: [
      { x: 100, y: 380, width: 200, height: 40, type: 'grass' },
    ],
    sheep: { x: 200, y: 350 },
    beehives: [{ id: 'hive-1', x: 200, y: 120, beeCount: 16 }],
    maxInk: 400,
  },
  {
    levelNumber: 2,
    name: 'Cliffside Gap',
    platforms: [
      { x: 40, y: 360, width: 140, height: 40, type: 'grass' },
      { x: 240, y: 360, width: 140, height: 40, type: 'grass' },
      { x: 140, y: 550, width: 140, height: 40, type: 'spikes' },
    ],
    sheep: { x: 110, y: 330 },
    beehives: [{ id: 'hive-1', x: 310, y: 150, beeCount: 18 }],
    maxInk: 420,
  },
  {
    levelNumber: 3,
    name: 'Twin Hive Swarm',
    platforms: [
      { x: 120, y: 380, width: 160, height: 40, type: 'grass' },
    ],
    sheep: { x: 200, y: 350 },
    beehives: [
      { id: 'hive-1', x: 60, y: 160, beeCount: 12 },
      { id: 'hive-2', x: 340, y: 160, beeCount: 12 },
    ],
    maxInk: 450,
  },
  {
    levelNumber: 4,
    name: 'The Thorn Trench',
    platforms: [
      { x: 150, y: 300, width: 100, height: 30, type: 'grass' },
      { x: 50, y: 480, width: 300, height: 30, type: 'spikes' },
    ],
    sheep: { x: 200, y: 270 },
    beehives: [{ id: 'hive-1', x: 200, y: 100, beeCount: 22 }],
    maxInk: 480,
  },
  {
    levelNumber: 5,
    name: 'Grand Pasture Citadel',
    platforms: [
      { x: 60, y: 400, width: 120, height: 40, type: 'grass' },
      { x: 220, y: 400, width: 120, height: 40, type: 'grass' },
    ],
    sheep: { x: 120, y: 370 },
    beehives: [
      { id: 'hive-1', x: 280, y: 130, beeCount: 16 },
      { id: 'hive-2', x: 120, y: 100, beeCount: 14 },
    ],
    maxInk: 500,
  },
];

export function createInitialSheepState(levelNumber: number = 1): SaveTheSheepState {
  const config = LEVELS[levelNumber - 1] || LEVELS[0];

  return {
    level: levelNumber,
    levelName: config.name,
    status: 'drawing',
    sheep: {
      x: config.sheep.x,
      y: config.sheep.y,
      vx: 0,
      vy: 0,
      radius: SHEEP_RADIUS,
      isGrounded: false,
      isStung: false,
    },
    platforms: [...config.platforms],
    beehives: [...config.beehives],
    drawnPoints: [],
    fenceSegments: [],
    bees: [],
    maxInk: config.maxInk,
    usedInk: 0,
    survivalTimer: SURVIVAL_DURATION,
    score: 0,
    stars: 3,
    lives: 3,
  };
}

export function addDrawnPoint(state: SaveTheSheepState, pt: Point): boolean {
  if (state.status !== 'drawing') return false;

  if (state.drawnPoints.length === 0) {
    state.drawnPoints.push(pt);
    return true;
  }

  const lastPt = state.drawnPoints[state.drawnPoints.length - 1];
  const dist = Math.hypot(pt.x - lastPt.x, pt.y - lastPt.y);

  if (dist < 4) return false; // filter micro jitters

  if (state.usedInk + dist > state.maxInk) {
    return false; // out of ink
  }

  state.usedInk += dist;
  state.drawnPoints.push(pt);
  return true;
}

export function finishDrawingAndStartSimulation(state: SaveTheSheepState): boolean {
  if (state.status !== 'drawing' || state.drawnPoints.length < 2) {
    return false;
  }

  // Convert points to line segments
  const segments: LineSegment[] = [];
  for (let i = 0; i < state.drawnPoints.length - 1; i++) {
    segments.push({
      p1: state.drawnPoints[i],
      p2: state.drawnPoints[i + 1],
    });
  }
  state.fenceSegments = segments;
  state.status = 'simulating';
  state.survivalTimer = SURVIVAL_DURATION;

  // Calculate star rating based on ink efficiency
  const inkRatio = state.usedInk / state.maxInk;
  if (inkRatio < 0.45) state.stars = 3;
  else if (inkRatio < 0.75) state.stars = 2;
  else state.stars = 1;

  // Initialize Bees from Hives
  const bees: BeeEntity[] = [];
  let beeIndex = 0;
  for (const hive of state.beehives) {
    for (let b = 0; b < hive.beeCount; b++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 140 + Math.random() * 80;
      bees.push({
        id: `bee-${beeIndex++}`,
        x: hive.x + Math.cos(angle) * 8,
        y: hive.y + Math.sin(angle) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        speed,
        active: true,
      });
    }
  }
  state.bees = bees;

  return true;
}

// Distance from point P to line segment AB
export function distToSegment(p: Point, p1: Point, p2: Point): { dist: number; closest: Point } {
  const l2 = (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2;
  if (l2 === 0) {
    const dist = Math.hypot(p.x - p1.x, p.y - p1.y);
    return { dist, closest: { ...p1 } };
  }
  let t = ((p.x - p1.x) * (p2.x - p1.x) + (p.y - p1.y) * (p2.y - p1.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const closest = {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
  const dist = Math.hypot(p.x - closest.x, p.y - closest.y);
  return { dist, closest };
}

export function stepSheepPhysics(
  state: SaveTheSheepState,
  dt: number
): { state: SaveTheSheepState; events: SheepStepEvents } {
  const events: SheepStepEvents = {
    beeSpawned: false,
    fenceDeflectedBee: false,
    sheepStung: false,
    sheepFell: false,
    levelCompleted: false,
    gameOver: false,
  };

  if (state.status !== 'simulating' || dt <= 0) {
    return { state, events };
  }

  // 1. Survival Timer Countdown
  state.survivalTimer = Math.max(0, state.survivalTimer - dt);

  // 2. Sheep Gravity & Movement
  const s = state.sheep;
  s.vy += GRAVITY * dt;
  s.y += s.vy * dt;
  s.x += s.vx * dt;
  s.vx *= 0.95; // lateral damping

  // Platform collisions for sheep
  s.isGrounded = false;
  for (const plat of state.platforms) {
    if (
      s.x + s.radius > plat.x &&
      s.x - s.radius < plat.x + plat.width &&
      s.y + s.radius > plat.y &&
      s.y - s.radius < plat.y + plat.height
    ) {
      if (plat.type === 'spikes' || plat.type === 'water') {
        // Sheep died in hazard!
        state.status = 'game_over';
        events.sheepFell = true;
        events.gameOver = true;
        return { state, events };
      }

      // Rest on top of grass platform
      if (s.vy > 0 && s.y < plat.y + 15) {
        s.y = plat.y - s.radius;
        s.vy = 0;
        s.isGrounded = true;
      }
    }
  }

  // Fence collisions for sheep (sheep cannot fall through drawn fence)
  for (const seg of state.fenceSegments) {
    const { dist, closest } = distToSegment({ x: s.x, y: s.y }, seg.p1, seg.p2);
    const minDist = s.radius + FENCE_WIDTH / 2;
    if (dist < minDist && dist > 0) {
      const nx = (s.x - closest.x) / dist;
      const ny = (s.y - closest.y) / dist;
      s.x = closest.x + nx * minDist;
      s.y = closest.y + ny * minDist;
      if (ny < -0.3) {
        s.vy = 0;
        s.isGrounded = true;
      }
    }
  }

  // Fell off screen
  if (s.y > 650) {
    state.status = 'game_over';
    events.sheepFell = true;
    events.gameOver = true;
    return { state, events };
  }

  // 3. Bees AI & Swarm Movement
  for (const bee of state.bees) {
    if (!bee.active) continue;

    // Seek towards sheep
    const dx = s.x - bee.x;
    const dy = s.y - bee.y;
    const distToSheep = Math.hypot(dx, dy);

    if (distToSheep > 2) {
      const targetVx = (dx / distToSheep) * bee.speed;
      const targetVy = (dy / distToSheep) * bee.speed;
      // Add a slight jitter wave for realistic bee buzzing
      const jitter = (Math.random() - 0.5) * 60;
      bee.vx += (targetVx + jitter - bee.vx) * Math.min(1, dt * 6);
      bee.vy += (targetVy + jitter - bee.vy) * Math.min(1, dt * 6);
    }

    // Integrate bee position
    bee.x += bee.vx * dt;
    bee.y += bee.vy * dt;

    // Check collision against fence segments
    for (const seg of state.fenceSegments) {
      const { dist, closest } = distToSegment({ x: bee.x, y: bee.y }, seg.p1, seg.p2);
      const minDistance = BEE_RADIUS + FENCE_WIDTH / 2;
      if (dist < minDistance && dist > 0) {
        // Bounce bee off fence
        const nx = (bee.x - closest.x) / dist;
        const ny = (bee.y - closest.y) / dist;
        bee.x = closest.x + nx * minDistance;
        bee.y = closest.y + ny * minDistance;
        bee.vx = (nx * 120) + (Math.random() - 0.5) * 40;
        bee.vy = (ny * 120) + (Math.random() - 0.5) * 40;
        events.fenceDeflectedBee = true;
      }
    }

    // Check sting against sheep!
    if (distToSheep < s.radius + BEE_RADIUS) {
      s.isStung = true;
      state.status = 'game_over';
      events.sheepStung = true;
      events.gameOver = true;
      return { state, events };
    }
  }

  // 4. Survival Timer Check
  if (state.survivalTimer <= 0) {
    state.status = state.level >= LEVELS.length ? 'victory' : 'level_cleared';
    state.score += 500 + state.stars * 250;
    events.levelCompleted = true;
  }

  return { state, events };
}

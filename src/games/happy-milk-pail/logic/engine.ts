import {
  HappyMilkPailState,
  PailLevel,
  Point,
  LineSegment,
  Droplet,
} from './types';

export const CANVAS_WIDTH = 400;
export const CANVAS_HEIGHT = 650;
export const GRAVITY = 720;
export const MAX_INK = 450;
export const TOTAL_DROPLETS = 40;

export const LEVELS: PailLevel[] = [
  {
    levelNumber: 1,
    pipeX: 120,
    pipeY: 70,
    pailX: 250,
    pailY: 460,
    capacityNeeded: 24,
    obstacles: [],
  },
  {
    levelNumber: 2,
    pipeX: 100,
    pipeY: 70,
    pailX: 280,
    pailY: 480,
    capacityNeeded: 24,
    obstacles: [{ x: 160, y: 260, width: 80, height: 25 }],
  },
  {
    levelNumber: 3,
    pipeX: 200,
    pipeY: 70,
    pailX: 200,
    pailY: 480,
    capacityNeeded: 24,
    obstacles: [
      { x: 120, y: 220, width: 40, height: 40 },
      { x: 240, y: 220, width: 40, height: 40 },
    ],
  },
  {
    levelNumber: 4,
    pipeX: 80,
    pipeY: 70,
    pailX: 300,
    pailY: 470,
    capacityNeeded: 22,
    obstacles: [
      { x: 180, y: 180, width: 140, height: 20 },
      { x: 60, y: 320, width: 150, height: 20 },
    ],
  },
  {
    levelNumber: 5,
    pipeX: 200,
    pipeY: 60,
    pailX: 190,
    pailY: 500,
    capacityNeeded: 22,
    obstacles: [
      { x: 140, y: 190, width: 120, height: 20 },
      { x: 80, y: 310, width: 100, height: 20 },
      { x: 220, y: 310, width: 100, height: 20 },
    ],
  },
];

export function createMilkPailGame(levelIndex = 1, highScore = 0): HappyMilkPailState {
  const lvl = LEVELS[(levelIndex - 1) % LEVELS.length];

  return {
    status: 'drawing',
    level: lvl.levelNumber,
    score: (levelIndex - 1) * 300,
    highScore,
    stars: 3,
    inkRemaining: MAX_INK,
    maxInk: MAX_INK,
    lines: [],
    currentLine: [],
    droplets: [],
    pail: {
      x: lvl.pailX,
      y: lvl.pailY,
      width: 72,
      height: 72,
      dropletCount: 0,
      capacityNeeded: lvl.capacityNeeded,
      isHappy: false,
    },
    pipe: { x: lvl.pipeX, y: lvl.pipeY },
    obstacles: lvl.obstacles,
    events: [],
  };
}

export function addPointToCurrentLine(state: HappyMilkPailState, pt: Point): HappyMilkPailState {
  if (state.status !== 'drawing' || state.inkRemaining <= 0) return state;

  const current = [...state.currentLine];
  let inkRem = state.inkRemaining;

  if (current.length > 0) {
    const last = current[current.length - 1];
    const dist = Math.hypot(pt.x - last.x, pt.y - last.y);
    if (dist < 4) return state; // ignore tiny tremors
    if (dist > inkRem) return state;
    inkRem -= dist;
  }

  current.push(pt);

  return {
    ...state,
    currentLine: current,
    inkRemaining: inkRem,
  };
}

export function finishCurrentLine(state: HappyMilkPailState): HappyMilkPailState {
  if (state.currentLine.length < 2) {
    return { ...state, currentLine: [] };
  }

  const newSegments: LineSegment[] = [];
  for (let i = 0; i < state.currentLine.length - 1; i++) {
    newSegments.push({
      p1: state.currentLine[i],
      p2: state.currentLine[i + 1],
    });
  }

  return {
    ...state,
    lines: [...state.lines, ...newSegments],
    currentLine: [],
  };
}

export function startPouring(state: HappyMilkPailState): HappyMilkPailState {
  if (state.status !== 'drawing') return state;

  const finishedState = finishCurrentLine(state);

  // Generate 40 staggered droplets
  const droplets: Droplet[] = [];
  for (let i = 0; i < TOTAL_DROPLETS; i++) {
    droplets.push({
      id: i,
      x: finishedState.pipe.x + (Math.random() - 0.5) * 8,
      y: finishedState.pipe.y - i * 16, // staggered release
      vx: (Math.random() - 0.5) * 20,
      vy: 120 + Math.random() * 40,
      radius: 4,
      inPail: false,
      lost: false,
    });
  }

  return {
    ...finishedState,
    status: 'pouring',
    droplets,
    events: [{ type: 'pour' }],
  };
}

// Distance from point to line segment
function distToSegment(p: Point, s: LineSegment): { dist: number; nx: number; ny: number } {
  const l2 = (s.p2.x - s.p1.x) ** 2 + (s.p2.y - s.p1.y) ** 2;
  if (l2 === 0) {
    const d = Math.hypot(p.x - s.p1.x, p.y - s.p1.y);
    return { dist: d, nx: 0, ny: -1 };
  }
  let t = ((p.x - s.p1.x) * (s.p2.x - s.p1.x) + (p.y - s.p1.y) * (s.p2.y - s.p1.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = s.p1.x + t * (s.p2.x - s.p1.x);
  const projY = s.p1.y + t * (s.p2.y - s.p1.y);
  const d = Math.hypot(p.x - projX, p.y - projY);

  // Normal vector perpendicular to segment
  const dx = s.p2.x - s.p1.x;
  const dy = s.p2.y - s.p1.y;
  const len = Math.hypot(dx, dy);
  const nx = -dy / len;
  const ny = dx / len;

  return { dist: d, nx, ny };
}

export function updateMilkPailGame(state: HappyMilkPailState, rawDt: number): HappyMilkPailState {
  if (state.status !== 'pouring') return state;

  const dt = Math.min(rawDt, 0.04);
  const events: HappyMilkPailState['events'] = [];
  let status: HappyMilkPailState['status'] = state.status;
  const pail = { ...state.pail };

  let activeCount = 0;

  const droplets = state.droplets.map((d) => {
    if (d.lost || d.inPail) return d;

    activeCount++;
    const drop = { ...d };

    // Gravity
    drop.vy += GRAVITY * dt;
    drop.x += drop.vx * dt;
    drop.y += drop.vy * dt;

    // Check collision against drawn lines
    for (const seg of state.lines) {
      const { dist, nx, ny } = distToSegment({ x: drop.x, y: drop.y }, seg);
      if (dist < drop.radius + 3) {
        // Dot product of velocity and normal
        const dot = drop.vx * nx + drop.vy * ny;
        if (dot < 0) {
          // Bounce reflection
          drop.vx = (drop.vx - 1.5 * dot * nx) * 0.65;
          drop.vy = (drop.vy - 1.5 * dot * ny) * 0.65;
        }
      }
    }

    // Check collision against static obstacles
    for (const obs of state.obstacles) {
      if (
        drop.x >= obs.x &&
        drop.x <= obs.x + obs.width &&
        drop.y >= obs.y &&
        drop.y <= obs.y + obs.height
      ) {
        drop.vy = -Math.abs(drop.vy) * 0.5;
        drop.vx += (Math.random() - 0.5) * 60;
      }
    }

    // Check Pail boundaries & collection
    const pailLeft = pail.x;
    const pailRight = pail.x + pail.width;
    const pailBottom = pail.y + pail.height;
    const pailTop = pail.y;

    if (
      drop.x >= pailLeft + 4 &&
      drop.x <= pailRight - 4 &&
      drop.y >= pailTop + 10 &&
      drop.y <= pailBottom
    ) {
      drop.inPail = true;
      drop.vx = 0;
      drop.vy = 0;
      pail.dropletCount++;
      events.push({ type: 'drop_in' });

      if (pail.dropletCount >= pail.capacityNeeded && !pail.isHappy) {
        pail.isHappy = true;
        events.push({ type: 'happy' });
      }
    }

    // Lost if fallen below canvas
    if (drop.y > CANVAS_HEIGHT + 20) {
      drop.lost = true;
    }

    return drop;
  });

  // Calculate Star Rating based on ink conservation
  const inkRatio = state.inkRemaining / state.maxInk;
  let stars = 1;
  if (inkRatio >= 0.5) stars = 3;
  else if (inkRatio >= 0.2) stars = 2;

  // Level Complete / Fail Evaluation when all droplets finished
  if (activeCount === 0 && droplets.length > 0) {
    if (pail.isHappy) {
      status = 'victory';
    } else {
      status = 'failed';
      events.push({ type: 'fail' });
    }
  }

  const score = state.score + (status === 'victory' ? stars * 100 : 0);
  const highScore = Math.max(state.highScore, score);

  return {
    ...state,
    status,
    score,
    highScore,
    stars,
    pail,
    droplets,
    events,
  };
}

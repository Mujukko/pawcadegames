import { DashEvent, DashGameState, DashProp, DashStage } from './types';

export const CUBE_SIZE = 32;
export const CEILING_Y = 268;
export const GRAVITY = -2350;
export const JUMP_VEL = 735;
export const PAD_VEL = 960;
export const ORB_VEL = 770;
export const SHIP_ACCEL_UP = 1650;
export const SHIP_GRAVITY = -1150;

function buildStage1Props(): DashProp[] {
  let id = 1;
  const p: DashProp[] = [];
  const spike = (x: number, y = 0) => p.push({ id: id++, kind: 'spike', x, y, w: 30, h: 32 });
  const block = (x: number, y: number, w = 36, h = 36) => p.push({ id: id++, kind: 'block', x, y, w, h });
  const pad = (x: number, y = 0) => p.push({ id: id++, kind: 'pad', x, y, w: 32, h: 10 });
  const coin = (x: number, y: number) => p.push({ id: id++, kind: 'coin', x, y, w: 26, h: 26 });

  // Warmup single spikes
  spike(420);
  spike(690);
  // Hay staircase
  block(960, 0, 48, 36);
  block(1110, 36, 48, 36);
  coin(1122, 96);
  block(1260, 72, 64, 36);
  // Pad jump over twin spikes
  pad(1520, 0);
  spike(1610);
  spike(1642);
  // Elevated platform run
  block(1860, 0, 120, 36);
  spike(2070);
  // Ship portal section!
  p.push({ id: id++, kind: 'portal_ship', x: 2280, y: 0, w: 34, h: 140 });
  block(2560, 0, 90, 70);
  coin(2600, 130);
  block(2820, 185, 90, 85);
  block(3080, 0, 80, 80);
  // Back to Cube for finish sprint
  p.push({ id: id++, kind: 'portal_cube', x: 3320, y: 0, w: 34, h: 140 });
  spike(3580);
  coin(3720, 80);
  spike(3820);

  return p;
}

function buildStage2Props(): DashProp[] {
  let id = 1;
  const p: DashProp[] = [];
  const spike = (x: number, y = 0) => p.push({ id: id++, kind: 'spike', x, y, w: 30, h: 32 });
  const block = (x: number, y: number, w = 44, h = 36) => p.push({ id: id++, kind: 'block', x, y, w, h });
  const pad = (x: number, y = 0) => p.push({ id: id++, kind: 'pad', x, y, w: 32, h: 10 });
  const orb = (x: number, y: number) => p.push({ id: id++, kind: 'orb', x, y, w: 30, h: 30 });
  const coin = (x: number, y: number) => p.push({ id: id++, kind: 'coin', x, y, w: 26, h: 26 });

  spike(390);
  spike(420);
  block(660, 0, 60, 36);
  block(830, 42, 60, 36);
  // Orb chain over spike pit
  spike(1060);
  spike(1092);
  spike(1124);
  orb(1085, 68);
  coin(1220, 110);
  // Spring pad + block landing
  pad(1420, 0);
  block(1580, 88, 130, 32);
  spike(1830);
  // Ship canyon
  p.push({ id: id++, kind: 'portal_ship', x: 2040, y: 0, w: 34, h: 140 });
  block(2300, 0, 80, 85);
  block(2300, 200, 80, 70);
  coin(2540, 155);
  block(2640, 0, 80, 105);
  block(2920, 165, 85, 105);
  p.push({ id: id++, kind: 'portal_cube', x: 3180, y: 0, w: 34, h: 140 });
  pad(3420, 0);
  spike(3500);
  spike(3532);
  coin(3690, 75);
  spike(3840);

  return p;
}

function buildStage3Props(): DashProp[] {
  let id = 1;
  const p: DashProp[] = [];
  const spike = (x: number, y = 0) => p.push({ id: id++, kind: 'spike', x, y, w: 30, h: 32 });
  const block = (x: number, y: number, w = 46, h = 36) => p.push({ id: id++, kind: 'block', x, y, w, h });
  const pad = (x: number, y = 0) => p.push({ id: id++, kind: 'pad', x, y, w: 32, h: 10 });
  const orb = (x: number, y: number) => p.push({ id: id++, kind: 'orb', x, y, w: 30, h: 30 });
  const coin = (x: number, y: number) => p.push({ id: id++, kind: 'coin', x, y, w: 26, h: 26 });

  spike(380);
  block(590, 0, 50, 36);
  block(750, 40, 50, 36);
  block(910, 80, 60, 36);
  coin(925, 135);
  p.push({ id: id++, kind: 'speed_fast', x: 1120, y: 0, w: 32, h: 110 });
  pad(1320, 0);
  spike(1420);
  spike(1452);
  spike(1484);
  orb(1720, 62);
  spike(1705);
  spike(1737);
  p.push({ id: id++, kind: 'portal_ship', x: 1980, y: 0, w: 34, h: 140 });
  block(2260, 0, 90, 95);
  block(2540, 170, 90, 100);
  coin(2570, 95);
  block(2840, 0, 90, 100);
  block(3120, 175, 90, 95);
  p.push({ id: id++, kind: 'portal_cube', x: 3400, y: 0, w: 34, h: 140 });
  spike(3680);
  pad(3900, 0);
  spike(3990);
  spike(4022);
  coin(4140, 95);

  return p;
}

export const DASH_STAGES: DashStage[] = [
  {
    id: 0,
    name: 'Sunny Meadow',
    stars: 1,
    accent: '#84cc16',
    bgTop: '#064e3b',
    bgBottom: '#052e16',
    baseSpeed: 310,
    length: 4100,
    props: buildStage1Props(),
  },
  {
    id: 1,
    name: 'Neon Barn',
    stars: 2,
    accent: '#38bdf8',
    bgTop: '#1e1b4b',
    bgBottom: '#0f172a',
    baseSpeed: 335,
    length: 4150,
    props: buildStage2Props(),
  },
  {
    id: 2,
    name: 'Turbo Silo',
    stars: 3,
    accent: '#fb923c',
    bgTop: '#450a0a',
    bgBottom: '#1c1917',
    baseSpeed: 350,
    length: 4400,
    props: buildStage3Props(),
  },
];

export function createDashGame(stageIndex = 0, bestProgress = [0, 0, 0], attempt = 1): DashGameState {
  const idx = Math.max(0, Math.min(DASH_STAGES.length - 1, stageIndex));
  const stage = DASH_STAGES[idx]!;
  return {
    stageIndex: idx,
    stageName: stage.name,
    length: stage.length,
    props: stage.props.map((p) => ({ ...p, used: false })),
    mode: 'cube',
    x: 60,
    y: 0,
    vy: 0,
    rotation: 0,
    grounded: true,
    holding: false,
    freshPress: false,
    speedMult: 1,
    status: 'ready',
    crashTimer: 0,
    attempt,
    progress: 0,
    bestProgress: bestProgress.slice(),
    coinsCollected: 0,
    lastBeatIndex: 0,
    events: [],
  };
}

export function setDashInput(state: DashGameState, down: boolean): DashGameState {
  if (state.status === 'complete') return state;
  if (state.status === 'crashed') {
    if (down && state.crashTimer <= 0.35) {
      const next = createDashGame(state.stageIndex, state.bestProgress, state.attempt + 1);
      return { ...next, status: 'playing', holding: true, freshPress: true };
    }
    return { ...state, holding: down };
  }
  if (state.status === 'ready' && down) {
    return {
      ...state,
      status: 'playing',
      holding: true,
      freshPress: true,
    };
  }
  return {
    ...state,
    holding: down,
    freshPress: down && !state.holding ? true : state.freshPress,
  };
}

function rectsOverlap(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function updateDashGame(state: DashGameState, rawDt: number): DashGameState {
  if (state.status === 'ready' || state.status === 'complete') {
    return state.events.length ? { ...state, events: [] } : state;
  }

  const dt = Math.min(rawDt, 0.035);
  if (state.status === 'crashed') {
    const nextTimer = state.crashTimer - dt;
    if (nextTimer <= 0) {
      const restarted = createDashGame(state.stageIndex, state.bestProgress, state.attempt + 1);
      return { ...restarted, status: 'playing', holding: state.holding, freshPress: false };
    }
    return { ...state, crashTimer: nextTimer, events: [] };
  }

  const stage = DASH_STAGES[state.stageIndex]!;
  const events: DashEvent[] = [];
  const props = state.props.map((p) => ({ ...p }));

  let { x, y, vy, rotation, grounded, mode, speedMult, freshPress, coinsCollected, lastBeatIndex } = state;
  const prevY = y;

  // Rhythm beat pulse every 155 world units
  const beatIdx = Math.floor(x / 155);
  if (beatIdx > lastBeatIndex) {
    lastBeatIndex = beatIdx;
    events.push({ type: 'beat', step: beatIdx });
  }

  // Horizontal advance
  const vx = stage.baseSpeed * speedMult;
  x += vx * dt;

  // Vertical physics
  if (mode === 'cube') {
    if (grounded && state.holding) {
      vy = JUMP_VEL;
      grounded = false;
      freshPress = false;
      events.push({ type: 'jump' });
    }
    vy += GRAVITY * dt;
    y += vy * dt;

    if (y <= 0) {
      y = 0;
      vy = 0;
      grounded = true;
      rotation = Math.round(rotation / 90) * 90;
    } else {
      grounded = false;
      rotation = (rotation + 380 * dt) % 360;
    }
  } else {
    // Ship flight mode
    const acc = state.holding ? SHIP_ACCEL_UP : SHIP_GRAVITY;
    vy = Math.max(-420, Math.min(420, vy + acc * dt));
    y += vy * dt;
    if (y <= 0) {
      y = 0;
      vy = Math.max(0, vy);
    }
    if (y + CUBE_SIZE >= CEILING_Y) {
      y = CEILING_Y - CUBE_SIZE;
      vy = Math.min(0, vy);
    }
    grounded = y === 0;
    rotation = Math.max(-32, Math.min(32, -vy * 0.065));
  }

  // Interact with nearby props
  let crashed = false;
  for (const p of props) {
    if (p.x + p.w < x - 40 || p.x > x + CUBE_SIZE + 40) continue;

    if (p.kind === 'spike') {
      // Forgiving center hitbox on spikes (authentic GD fairness!)
      if (rectsOverlap(x + 6, y + 4, CUBE_SIZE - 12, CUBE_SIZE - 8, p.x + 7, p.y, p.w - 14, p.h - 6)) {
        crashed = true;
        break;
      }
    } else if (p.kind === 'block') {
      if (rectsOverlap(x + 2, y, CUBE_SIZE - 4, CUBE_SIZE, p.x, p.y, p.w, p.h)) {
        const blockTop = p.y + p.h;
        if (prevY >= blockTop - 12 && vy <= 40) {
          y = blockTop;
          vy = 0;
          grounded = true;
          if (mode === 'cube') {
            rotation = Math.round(rotation / 90) * 90;
          }
        } else {
          crashed = true;
          break;
        }
      }
    } else if (p.kind === 'pad') {
      if (!p.used && rectsOverlap(x, y, CUBE_SIZE, CUBE_SIZE, p.x, p.y, p.w, p.h + 6)) {
        p.used = true;
        vy = PAD_VEL;
        grounded = false;
        events.push({ type: 'pad' });
      }
    } else if (p.kind === 'orb') {
      if (!p.used && (freshPress || state.holding) && rectsOverlap(x - 6, y - 6, CUBE_SIZE + 12, CUBE_SIZE + 12, p.x, p.y, p.w, p.h)) {
        p.used = true;
        vy = ORB_VEL;
        grounded = false;
        freshPress = false;
        events.push({ type: 'orb' });
      }
    } else if (p.kind === 'portal_ship') {
      if (!p.used && rectsOverlap(x, y, CUBE_SIZE, CUBE_SIZE, p.x, p.y, p.w, p.h)) {
        p.used = true;
        mode = 'ship';
        vy = Math.max(vy, 120);
        events.push({ type: 'portal', mode: 'ship' });
      }
    } else if (p.kind === 'portal_cube') {
      if (!p.used && rectsOverlap(x, y, CUBE_SIZE, CUBE_SIZE, p.x, p.y, p.w, p.h)) {
        p.used = true;
        mode = 'cube';
        events.push({ type: 'portal', mode: 'cube' });
      }
    } else if (p.kind === 'speed_fast') {
      if (!p.used && rectsOverlap(x, y, CUBE_SIZE, CUBE_SIZE, p.x, p.y, p.w, p.h)) {
        p.used = true;
        speedMult = 1.18;
      }
    } else if (p.kind === 'coin') {
      if (!p.used && rectsOverlap(x, y, CUBE_SIZE, CUBE_SIZE, p.x, p.y, p.w, p.h)) {
        p.used = true;
        coinsCollected += 1;
        events.push({ type: 'coin' });
      }
    }
  }

  const progress = Math.min(100, Math.max(0, Math.floor((x / stage.length) * 100)));
  const bestProgress = state.bestProgress.slice();
  bestProgress[state.stageIndex] = Math.max(bestProgress[state.stageIndex] || 0, progress);

  if (crashed) {
    events.push({ type: 'crash' });
    return {
      ...state,
      props,
      x,
      y,
      vy: 0,
      status: 'crashed',
      crashTimer: 0.55,
      progress,
      bestProgress,
      coinsCollected,
      lastBeatIndex,
      events,
    };
  }

  if (x >= stage.length) {
    bestProgress[state.stageIndex] = 100;
    events.push({ type: 'complete' });
    return {
      ...state,
      props,
      x: stage.length,
      y,
      vy: 0,
      rotation: 0,
      status: 'complete',
      progress: 100,
      bestProgress,
      coinsCollected,
      lastBeatIndex,
      events,
    };
  }

  return {
    ...state,
    props,
    mode,
    x,
    y,
    vy,
    rotation,
    grounded,
    freshPress: false,
    speedMult,
    progress,
    bestProgress,
    coinsCollected,
    lastBeatIndex,
    events,
  };
}

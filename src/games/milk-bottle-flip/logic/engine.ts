import {
  MilkBottleFlipState,
  MilkBottle,
  BottlePlatform,
} from './types';

export const GRAVITY = 1250;
export const BASE_FLIGHT_TIME = 0.75;

const PLATFORM_PRESETS = [
  { label: 'Farm Table', color: '#b45309', width: 110, height: 35 },
  { label: 'Kitchen Counter', color: '#0369a1', width: 130, height: 40 },
  { label: 'Toaster', color: '#475569', width: 75, height: 50 },
  { label: 'Microwave', color: '#334155', width: 90, height: 55 },
  { label: 'Cozy Couch', color: '#b91c1c', width: 125, height: 45 },
  { label: 'Wooden Stool', color: '#92400e', width: 70, height: 35 },
  { label: 'Bookshelf', color: '#854d0e', width: 105, height: 35 },
  { label: 'Red Tractor', color: '#dc2626', width: 140, height: 60 },
];

export function normalizeAngle(rad: number): number {
  let a = rad % (Math.PI * 2);
  if (a < 0) a += Math.PI * 2;
  return a;
}

export function createMilkBottleFlipGame(highScore = 0): MilkBottleFlipState {
  const platforms: BottlePlatform[] = [
    {
      id: 'plat_0',
      x: 60,
      y: 420,
      width: 130,
      height: 40,
      label: 'Kitchen Counter',
      color: '#0369a1',
    },
  ];

  let currentX = 60 + 130;
  for (let i = 1; i < 15; i++) {
    const preset = PLATFORM_PRESETS[i % PLATFORM_PRESETS.length];
    const gap = 80 + Math.random() * 60;
    const platX = currentX + gap;
    // Vary surface height between 340 and 440
    const platY = 360 + (Math.sin(i * 1.5) * 60);

    platforms.push({
      id: `plat_${i}`,
      x: platX,
      y: platY,
      width: preset.width,
      height: preset.height,
      label: preset.label,
      color: preset.color,
    });

    currentX = platX + preset.width;
  }

  const initialBottle: MilkBottle = {
    x: platforms[0].x + platforms[0].width * 0.5,
    y: platforms[0].y,
    vx: 0,
    vy: 0,
    angle: 0,
    omega: 0,
    isFlipping: false,
    canDoubleFlip: false,
    didDoubleFlip: false,
  };

  return {
    status: 'ready',
    score: 0,
    highScore,
    currentPlatformIndex: 0,
    cameraX: 0,
    bottle: initialBottle,
    platforms,
    events: [],
  };
}

export function flipMilkBottle(state: MilkBottleFlipState): MilkBottleFlipState {
  if (state.status === 'game_over') return state;

  const bottle = { ...state.bottle };

  // Mid-air Double Flip
  if (bottle.isFlipping && bottle.canDoubleFlip) {
    bottle.vy -= 260; // Extra lift
    bottle.omega += (Math.PI * 2) / 0.52; // Extra full spin
    bottle.canDoubleFlip = false;
    bottle.didDoubleFlip = true;

    return {
      ...state,
      bottle,
      events: [...state.events, { type: 'double_flip' }],
    };
  }

  // Initial Flip from Platform
  if (!bottle.isFlipping) {
    const nextIdx = state.currentPlatformIndex + 1;
    if (nextIdx >= state.platforms.length) return state;

    const target = state.platforms[nextIdx];
    const targetCenterX = target.x + target.width * 0.5;
    const dx = targetCenterX - bottle.x;
    const dy = target.y - bottle.y;

    const T = BASE_FLIGHT_TIME;
    bottle.vx = dx / T;
    bottle.vy = (dy - 0.5 * GRAVITY * T * T) / T;
    // Exactly 1 full clockwise rotation (2*PI) over duration T
    bottle.omega = (Math.PI * 2) / T;
    bottle.isFlipping = true;
    bottle.canDoubleFlip = true;
    bottle.didDoubleFlip = false;
    bottle.angle = 0;

    return {
      ...state,
      status: 'flipping',
      bottle,
      events: [...state.events, { type: 'flip' }],
    };
  }

  return state;
}

export function updateMilkBottleFlipGame(
  state: MilkBottleFlipState,
  rawDt: number
): MilkBottleFlipState {
  if (state.status !== 'flipping' && state.status !== 'game_over') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: MilkBottleFlipState['events'] = [];
  let status: MilkBottleFlipState['status'] = state.status;
  let score = state.score;
  let highScore = state.highScore;
  let currentIdx = state.currentPlatformIndex;

  const bottle = { ...state.bottle };

  if (status === 'flipping') {
    bottle.vy += GRAVITY * dt;
    bottle.x += bottle.vx * dt;
    bottle.y += bottle.vy * dt;
    bottle.angle += bottle.omega * dt;

    const targetIdx = currentIdx + 1;
    const target = state.platforms[targetIdx];

    // Check Landing on Target Platform
    if (target && bottle.y >= target.y && bottle.vy > 0) {
      const isHorizontallyOnPlatform =
        bottle.x >= target.x - 8 && bottle.x <= target.x + target.width + 8;

      if (isHorizontallyOnPlatform) {
        const normAngle = normalizeAngle(bottle.angle);
        // Landing window: upright within ~26 degrees
        const isUpright = normAngle < 0.45 || normAngle > Math.PI * 2 - 0.45;

        if (isUpright) {
          // Clean landing!
          bottle.y = target.y;
          bottle.vx = 0;
          bottle.vy = 0;
          bottle.angle = 0;
          bottle.omega = 0;
          bottle.isFlipping = false;
          bottle.canDoubleFlip = false;

          currentIdx = targetIdx;
          score += bottle.didDoubleFlip ? 2 : 1;
          if (score > highScore) highScore = score;

          status = 'landed';
          events.push({ type: 'land' });
        } else {
          // Tipped over!
          status = 'game_over';
          bottle.omega = 3.5;
          events.push({ type: 'fail' });
        }
      }
    }

    // Missed and fallen into the abyss
    if (bottle.y > 600) {
      status = 'game_over';
      events.push({ type: 'fail' });
    }
  }

  // Camera follows bottle horizontally
  let cameraX = state.cameraX;
  const targetCamX = bottle.x - 140;
  if (targetCamX > cameraX) {
    cameraX += (targetCamX - cameraX) * 0.15;
  }

  // Spawn more platforms infinitely
  const platforms = [...state.platforms];
  const lastPlat = platforms[platforms.length - 1];
  if (lastPlat.x < cameraX + 800) {
    const nextI = platforms.length;
    const preset = PLATFORM_PRESETS[nextI % PLATFORM_PRESETS.length];
    const gap = 80 + Math.random() * 60;
    const platX = lastPlat.x + lastPlat.width + gap;
    const platY = 360 + Math.sin(nextI * 1.5) * 60;

    platforms.push({
      id: `plat_${nextI}`,
      x: platX,
      y: platY,
      width: preset.width,
      height: preset.height,
      label: preset.label,
      color: preset.color,
    });
  }

  return {
    ...state,
    status,
    score,
    highScore,
    currentPlatformIndex: currentIdx,
    cameraX,
    bottle,
    platforms,
    events,
  };
}

import {
  Basket,
  KittyEntity,
  Peg,
  SushiGameEvent,
  SushiGameState,
  SushiItem,
} from './types';

export const BOARD_WIDTH = 400;
export const BOARD_HEIGHT = 600;
export const GRAVITY = 520;
export const BASE_KITTY_RADIUS = 15;
export const MAX_KITTY_RADIUS = 30;
export const DROP_Y = 48;
export const BASKET_TOP_Y = 545;

export function getBaskets(): Basket[] {
  return [
    { id: 'b1', minX: 10, maxX: 85, y: BASKET_TOP_Y, label: '100', points: 100, multiplier: 1 },
    { id: 'b2', minX: 85, maxX: 165, y: BASKET_TOP_Y, label: '300', points: 300, multiplier: 2 },
    { id: 'b3', minX: 165, maxX: 235, y: BASKET_TOP_Y, label: '500', points: 500, multiplier: 3 },
    { id: 'b4', minX: 235, maxX: 315, y: BASKET_TOP_Y, label: '300', points: 300, multiplier: 2 },
    { id: 'b5', minX: 315, maxX: 390, y: BASKET_TOP_Y, label: '100', points: 100, multiplier: 1 },
  ];
}

export function generateLevelPegsAndSushi(level: number): { pegs: Peg[]; sushi: SushiItem[]; targetFullness: number } {
  const pegs: Peg[] = [];
  const sushi: SushiItem[] = [];
  let sIndex = 0;

  // Level tuning
  const targetFullness = level === 1 ? 50 : level === 2 ? 65 : 80;

  // Staggered peg grid between y = 110 and y = 510
  const rows = 8;
  const startY = 120;
  const rowSpacing = 48;

  for (let r = 0; r < rows; r++) {
    const y = startY + r * rowSpacing;
    const isOdd = r % 2 === 1;
    const cols = isOdd ? 7 : 8;
    const startX = isOdd ? 45 : 30;
    const colSpacing = 48;

    for (let c = 0; c < cols; c++) {
      const x = startX + c * colSpacing;
      if (x < 24 || x > BOARD_WIDTH - 24) continue;

      // Decide if this spot is a special bumper peg or normal peg
      const isBumper = (r === 2 && (c === 2 || c === 4)) || (r === 5 && (c === 1 || c === 5));
      pegs.push({
        id: `peg-${r}-${c}`,
        x,
        y,
        radius: isBumper ? 8 : 6,
        isBumper,
      });
    }
  }

  // Place floating sushi items strategically between pegs
  if (level === 1) {
    // Level 1: Plentiful nigiri and maki rolls
    const positions = [
      { x: 120, y: 144, type: 'nigiri' as const },
      { x: 280, y: 144, type: 'nigiri' as const },
      { x: 200, y: 192, type: 'maki' as const },
      { x: 75, y: 240, type: 'nigiri' as const },
      { x: 325, y: 240, type: 'nigiri' as const },
      { x: 155, y: 288, type: 'sashimi' as const },
      { x: 245, y: 288, type: 'maki' as const },
      { x: 100, y: 336, type: 'nigiri' as const },
      { x: 300, y: 336, type: 'nigiri' as const },
      { x: 200, y: 384, type: 'golden' as const },
      { x: 125, y: 432, type: 'maki' as const },
      { x: 275, y: 432, type: 'maki' as const },
      { x: 70, y: 480, type: 'nigiri' as const },
      { x: 330, y: 480, type: 'nigiri' as const },
    ];

    for (const p of positions) {
      sushi.push({
        id: `sushi-${sIndex++}`,
        x: p.x,
        y: p.y,
        radius: p.type === 'golden' ? 14 : 11,
        type: p.type,
        points: p.type === 'golden' ? 250 : p.type === 'sashimi' ? 150 : p.type === 'maki' ? 80 : 40,
        fullness: p.type === 'golden' ? 16 : p.type === 'sashimi' ? 12 : p.type === 'maki' ? 8 : 5,
        eaten: false,
      });
    }
  } else if (level === 2) {
    // Level 2: Staggered with some moving sushi platters
    const staticPositions = [
      { x: 80, y: 144, type: 'nigiri' as const },
      { x: 320, y: 144, type: 'nigiri' as const },
      { x: 150, y: 240, type: 'sashimi' as const },
      { x: 250, y: 240, type: 'sashimi' as const },
      { x: 80, y: 336, type: 'maki' as const },
      { x: 320, y: 336, type: 'maki' as const },
      { x: 150, y: 432, type: 'golden' as const },
      { x: 250, y: 432, type: 'golden' as const },
    ];
    for (const p of staticPositions) {
      sushi.push({
        id: `sushi-${sIndex++}`,
        x: p.x,
        y: p.y,
        radius: p.type === 'golden' ? 14 : 11,
        type: p.type,
        points: p.type === 'golden' ? 250 : p.type === 'sashimi' ? 150 : p.type === 'maki' ? 80 : 40,
        fullness: p.type === 'golden' ? 15 : p.type === 'sashimi' ? 11 : p.type === 'maki' ? 7 : 5,
        eaten: false,
      });
    }
    // Moving sushi
    sushi.push({
      id: `sushi-${sIndex++}`,
      x: 200,
      y: 192,
      radius: 12,
      type: 'maki',
      points: 100,
      fullness: 8,
      eaten: false,
      vx: 45,
      minX: 100,
      maxX: 300,
    });
    sushi.push({
      id: `sushi-${sIndex++}`,
      x: 200,
      y: 384,
      radius: 13,
      type: 'sashimi',
      points: 180,
      fullness: 12,
      eaten: false,
      vx: -55,
      minX: 90,
      maxX: 310,
    });
  } else {
    // Level 3: Challenging layout with high-value sashimi & golden rolls, faster movers
    const staticPositions = [
      { x: 60, y: 144, type: 'maki' as const },
      { x: 340, y: 144, type: 'maki' as const },
      { x: 110, y: 240, type: 'sashimi' as const },
      { x: 290, y: 240, type: 'sashimi' as const },
      { x: 70, y: 336, type: 'golden' as const },
      { x: 330, y: 336, type: 'golden' as const },
      { x: 130, y: 432, type: 'sashimi' as const },
      { x: 270, y: 432, type: 'sashimi' as const },
    ];
    for (const p of staticPositions) {
      sushi.push({
        id: `sushi-${sIndex++}`,
        x: p.x,
        y: p.y,
        radius: p.type === 'golden' ? 14 : 11,
        type: p.type,
        points: p.type === 'golden' ? 250 : p.type === 'sashimi' ? 150 : p.type === 'maki' ? 80 : 40,
        fullness: p.type === 'golden' ? 14 : p.type === 'sashimi' ? 10 : p.type === 'maki' ? 7 : 5,
        eaten: false,
      });
    }
    // Multiple moving platters
    sushi.push({
      id: `sushi-${sIndex++}`,
      x: 180,
      y: 192,
      radius: 12,
      type: 'golden',
      points: 300,
      fullness: 16,
      eaten: false,
      vx: 65,
      minX: 80,
      maxX: 320,
    });
    sushi.push({
      id: `sushi-${sIndex++}`,
      x: 220,
      y: 288,
      radius: 12,
      type: 'sashimi',
      points: 180,
      fullness: 12,
      eaten: false,
      vx: -70,
      minX: 70,
      maxX: 330,
    });
    sushi.push({
      id: `sushi-${sIndex++}`,
      x: 150,
      y: 384,
      radius: 13,
      type: 'golden',
      points: 300,
      fullness: 16,
      eaten: false,
      vx: 80,
      minX: 90,
      maxX: 310,
    });
  }

  return { pegs, sushi, targetFullness };
}

export function createInitialState(level = 1): SushiGameState {
  const { pegs, sushi, targetFullness } = generateLevelPegsAndSushi(level);
  const baskets = getBaskets();

  const kitty: KittyEntity = {
    x: BOARD_WIDTH / 2,
    y: DROP_Y,
    vx: 0,
    vy: 0,
    radius: BASE_KITTY_RADIUS,
    baseRadius: BASE_KITTY_RADIUS,
    isFalling: false,
    inBasket: false,
  };

  return {
    status: 'aiming',
    level,
    score: 0,
    fullness: 0,
    targetFullness,
    dropsRemaining: 4,
    totalDrops: 4,
    dropperX: BOARD_WIDTH / 2,
    dropperSpeed: 80,
    dropperDirection: 1,
    kitty,
    pegs,
    sushi,
    baskets,
    combo: 0,
    events: [],
    boardWidth: BOARD_WIDTH,
    boardHeight: BOARD_HEIGHT,
  };
}

export function moveDropper(state: SushiGameState, x: number): SushiGameState {
  if (state.status !== 'aiming') return state;
  const clampedX = Math.max(30, Math.min(BOARD_WIDTH - 30, x));
  return {
    ...state,
    dropperX: clampedX,
    kitty: {
      ...state.kitty,
      x: clampedX,
      y: DROP_Y,
    },
  };
}

export function dropKitty(state: SushiGameState): SushiGameState {
  if (state.status !== 'aiming' || state.dropsRemaining <= 0) return state;

  const events: SushiGameEvent[] = [...state.events, { type: 'drop', x: state.dropperX }];

  return {
    ...state,
    status: 'falling',
    kitty: {
      ...state.kitty,
      x: state.dropperX,
      y: DROP_Y,
      vx: (Math.random() - 0.5) * 20, // subtle initial jitter
      vy: 40,
      isFalling: true,
      inBasket: false,
      landedBasketId: undefined,
    },
    combo: 0,
    events,
  };
}

export function calculateKittyRadius(fullness: number): number {
  const clampedFullness = Math.max(0, Math.min(100, fullness));
  return BASE_KITTY_RADIUS + (clampedFullness / 100) * (MAX_KITTY_RADIUS - BASE_KITTY_RADIUS);
}

export function updateGame(state: SushiGameState, dt: number): SushiGameState {
  if (state.status !== 'falling' && state.status !== 'aiming') {
    return state;
  }

  const events: SushiGameEvent[] = [];
  const clampedDt = Math.min(0.04, Math.max(0.001, dt));

  // If in aiming state, sway dropper gently if idle
  if (state.status === 'aiming') {
    let newX = state.dropperX + state.dropperDirection * state.dropperSpeed * clampedDt;
    let newDir = state.dropperDirection;
    if (newX <= 40) {
      newX = 40;
      newDir = 1;
    } else if (newX >= BOARD_WIDTH - 40) {
      newX = BOARD_WIDTH - 40;
      newDir = -1;
    }

    return {
      ...state,
      dropperX: newX,
      dropperDirection: newDir,
      kitty: {
        ...state.kitty,
        x: newX,
        y: DROP_Y,
      },
      events,
    };
  }

  // Update moving sushi platters
  const nextSushi = state.sushi.map((item) => {
    if (item.eaten || item.vx === undefined || item.minX === undefined || item.maxX === undefined) {
      return item;
    }
    let nextX = item.x + item.vx * clampedDt;
    let nextVx = item.vx;
    if (nextX <= item.minX) {
      nextX = item.minX;
      nextVx = Math.abs(nextVx);
    } else if (nextX >= item.maxX) {
      nextX = item.maxX;
      nextVx = -Math.abs(nextVx);
    }
    return { ...item, x: nextX, vx: nextVx };
  });

  // Falling physics
  let kitty = { ...state.kitty };
  let currentFullness = state.fullness;
  let currentScore = state.score;
  let combo = state.combo;

  // Apply gravity and slight air friction
  kitty.vy += GRAVITY * clampedDt;
  kitty.vx *= 0.996;

  // Sub-step movement to prevent tunneling through small pegs
  const steps = 3;
  const subDt = clampedDt / steps;

  for (let s = 0; s < steps; s++) {
    kitty.x += kitty.vx * subDt;
    kitty.y += kitty.vy * subDt;

    // Wall bounce
    const minWallX = kitty.radius + 10;
    const maxWallX = BOARD_WIDTH - kitty.radius - 10;
    if (kitty.x < minWallX) {
      kitty.x = minWallX;
      kitty.vx = Math.abs(kitty.vx) * 0.7 + 10;
    } else if (kitty.x > maxWallX) {
      kitty.x = maxWallX;
      kitty.vx = -Math.abs(kitty.vx) * 0.7 - 10;
    }

    // Peg collisions
    for (const peg of state.pegs) {
      const dx = kitty.x - peg.x;
      const dy = kitty.y - peg.y;
      const dist = Math.hypot(dx, dy);
      const minDist = kitty.radius + peg.radius;

      if (dist < minDist && dist > 0.0001) {
        // Normal vector from peg to kitty
        const nx = dx / dist;
        const ny = dy / dist;

        // Push kitty outside peg
        kitty.x = peg.x + nx * (minDist + 0.5);
        kitty.y = peg.y + ny * (minDist + 0.5);

        // Dot product of velocity and normal
        const vDotN = kitty.vx * nx + kitty.vy * ny;
        if (vDotN < 0) {
          const restitution = peg.isBumper ? 0.95 : 0.68;
          kitty.vx = (kitty.vx - (1 + restitution) * vDotN * nx) + (Math.random() - 0.5) * 12;
          kitty.vy = (kitty.vy - (1 + restitution) * vDotN * ny);

          if (peg.isBumper) {
            kitty.vy -= 40; // spring boost
          }

          events.push({
            type: 'peg_bounce',
            x: peg.x,
            y: peg.y,
            isBumper: !!peg.isBumper,
          });
        }
      }
    }

    // Sushi chomp collisions
    for (const sushiItem of nextSushi) {
      if (sushiItem.eaten) continue;
      const dx = kitty.x - sushiItem.x;
      const dy = kitty.y - sushiItem.y;
      const dist = Math.hypot(dx, dy);
      if (dist < kitty.radius + sushiItem.radius) {
        sushiItem.eaten = true;
        combo++;
        const pointsAward = sushiItem.points * combo;
        currentScore += pointsAward;
        currentFullness = Math.min(100, currentFullness + sushiItem.fullness);
        kitty.radius = calculateKittyRadius(currentFullness);

        events.push({
          type: 'sushi_chomp',
          sushiType: sushiItem.type,
          points: pointsAward,
          x: sushiItem.x,
          y: sushiItem.y,
        });
      }
    }
  }

  // Check if kitty has reached bottom baskets
  if (kitty.y >= BASKET_TOP_Y) {
    const landedBasket = state.baskets.find((b) => kitty.x >= b.minX && kitty.x <= b.maxX) || state.baskets[2];
    const basketScore = landedBasket.points * landedBasket.multiplier;
    currentScore += basketScore;

    events.push({
      type: 'basket_land',
      basketId: landedBasket.id,
      points: basketScore,
    });

    const nextDropsRemaining = state.dropsRemaining - 1;
    let nextStatus: SushiGameState['status'] = 'aiming';

    if (currentFullness >= state.targetFullness) {
      // Level cleared!
      if (state.level < 3) {
        nextStatus = 'round_end';
        events.push({ type: 'level_clear', level: state.level, score: currentScore });
      } else {
        nextStatus = 'victory';
        events.push({ type: 'victory', finalScore: currentScore });
      }
    } else if (nextDropsRemaining <= 0) {
      // Out of drops and didn't reach target fullness
      nextStatus = 'game_over';
      events.push({ type: 'game_over', score: currentScore });
    }

    kitty = {
      ...kitty,
      x: state.dropperX,
      y: DROP_Y,
      vx: 0,
      vy: 0,
      isFalling: false,
      inBasket: true,
      landedBasketId: landedBasket.id,
    };

    return {
      ...state,
      status: nextStatus,
      score: currentScore,
      fullness: currentFullness,
      dropsRemaining: nextDropsRemaining,
      kitty,
      sushi: nextSushi,
      combo: 0,
      events,
    };
  }

  return {
    ...state,
    score: currentScore,
    fullness: currentFullness,
    kitty,
    sushi: nextSushi,
    combo,
    events,
  };
}

export function advanceLevel(state: SushiGameState): SushiGameState {
  if (state.level >= 3) {
    return { ...state, status: 'victory' };
  }
  const nextLevel = state.level + 1;
  const { pegs, sushi, targetFullness } = generateLevelPegsAndSushi(nextLevel);

  return {
    ...state,
    status: 'aiming',
    level: nextLevel,
    fullness: 0,
    targetFullness,
    dropsRemaining: 4,
    totalDrops: 4,
    kitty: {
      x: state.dropperX,
      y: DROP_Y,
      vx: 0,
      vy: 0,
      radius: BASE_KITTY_RADIUS,
      baseRadius: BASE_KITTY_RADIUS,
      isFalling: false,
      inBasket: false,
      landedBasketId: undefined,
    },
    pegs,
    sushi,
    combo: 0,
    events: [],
  };
}

export function restartLevel(state: SushiGameState): SushiGameState {
  const { pegs, sushi, targetFullness } = generateLevelPegsAndSushi(state.level);

  return {
    ...state,
    status: 'aiming',
    fullness: 0,
    targetFullness,
    dropsRemaining: 4,
    totalDrops: 4,
    kitty: {
      x: state.dropperX,
      y: DROP_Y,
      vx: 0,
      vy: 0,
      radius: BASE_KITTY_RADIUS,
      baseRadius: BASE_KITTY_RADIUS,
      isFalling: false,
      inBasket: false,
      landedBasketId: undefined,
    },
    pegs,
    sushi,
    combo: 0,
    events: [],
  };
}

import {
  SweetType,
  SweetItem,
  StackedSweet,
  BakeryStage,
  HamsterCookieStackState,
} from './types';

export const BAKERY_STAGES: BakeryStage[] = [
  {
    id: 1,
    title: 'Morning Cookie Counter',
    subtitle: 'Catch fresh warm choc-chip cookies and vanilla cupcakes on your plate!',
    targetCount: 10,
    allowedTypes: ['cookie', 'cupcake'],
    fallSpeed: 170,
    wobbleSensitivity: 0.8,
  },
  {
    id: 2,
    title: 'Macaron Wonderland',
    subtitle: 'Stack delicate pastel macarons and strawberry tarts without tipping!',
    targetCount: 18,
    allowedTypes: ['cookie', 'cupcake', 'macaron'],
    fallSpeed: 195,
    wobbleSensitivity: 1.0,
  },
  {
    id: 3,
    title: 'Donut Carnival',
    subtitle: 'Glazed donuts and crispy golden waffles drop at a brisk pace!',
    targetCount: 26,
    allowedTypes: ['cookie', 'cupcake', 'macaron', 'donut', 'waffle'],
    fallSpeed: 220,
    wobbleSensitivity: 1.2,
  },
  {
    id: 4,
    title: 'Royal Wedding Cake Summit',
    subtitle: 'Build the grand multi-tiered patisserie masterpiece into the clouds!',
    targetCount: 36,
    allowedTypes: ['cookie', 'cupcake', 'macaron', 'donut', 'waffle', 'cake'],
    fallSpeed: 245,
    wobbleSensitivity: 1.4,
  },
];

export interface CatchResult {
  sweet: StackedSweet;
  isPerfect: boolean;
  pointsEarned: number;
  stageCompleted: boolean;
  gameCompleted: boolean;
  towerCollapsed: boolean;
}

export function getSweetDimensions(type: SweetType): {
  width: number;
  height: number;
  points: number;
  color: string;
  frostingColor: string;
} {
  switch (type) {
    case 'cookie':
      return { width: 56, height: 18, points: 50, color: '#d97706', frostingColor: '#78350f' };
    case 'cupcake':
      return { width: 52, height: 26, points: 75, color: '#f59e0b', frostingColor: '#f472b6' };
    case 'macaron':
      return { width: 48, height: 20, points: 100, color: '#fb7185', frostingColor: '#ffffff' };
    case 'donut':
      return { width: 58, height: 22, points: 125, color: '#eab308', frostingColor: '#ec4899' };
    case 'waffle':
      return { width: 62, height: 20, points: 150, color: '#b45309', frostingColor: '#fde047' };
    case 'cake':
      return { width: 66, height: 28, points: 250, color: '#fbcfe8', frostingColor: '#db2777' };
  }
}

export function createFallingSweet(
  stageConfig: BakeryStage,
  worldWidth: number = 480
): SweetItem {
  const types = stageConfig.allowedTypes;
  const type = types[Math.floor(Math.random() * types.length)];
  const info = getSweetDimensions(type);

  const x = 70 + Math.random() * (worldWidth - 140);
  const vy = stageConfig.fallSpeed * (0.9 + Math.random() * 0.2);

  return {
    id: `sweet-${Date.now()}-${Math.random()}`,
    type,
    x,
    y: -30,
    width: info.width,
    height: info.height,
    vx: (Math.random() - 0.5) * 20,
    vy,
    points: info.points,
    color: info.color,
    frostingColor: info.frostingColor,
  };
}

export function initCookieStackGame(stageId: number = 1): HamsterCookieStackState {
  const stageConfig = BAKERY_STAGES.find((s) => s.id === stageId) || BAKERY_STAGES[0];

  return {
    stage: stageConfig.id,
    stageConfig,
    plateX: 240,
    plateY: 560,
    plateWidth: 100,
    plateVx: 0,
    fallingSweets: [],
    stackedSweets: [],
    lives: 3,
    score: 0,
    highScore: 0,
    combo: 0,
    towerHeight: 0,
    wobbleAngle: 0,
    wobbleVelocity: 0,
    status: 'playing',
    spawnTimer: 0,
    spawnInterval: 1.4,
    isPaused: false,
  };
}

export function movePlate(state: HamsterCookieStackState, targetX: number): HamsterCookieStackState {
  if (state.status !== 'playing' || state.isPaused) return state;

  const minX = state.plateWidth * 0.5 + 20;
  const maxX = 480 - state.plateWidth * 0.5 - 20;
  const clampedX = Math.max(minX, Math.min(maxX, targetX));
  const vx = (clampedX - state.plateX) * 10;

  return {
    ...state,
    plateX: clampedX,
    plateVx: vx,
  };
}

export function updateCookieStackGame(
  state: HamsterCookieStackState,
  dt: number
): {
  newState: HamsterCookieStackState;
  events: CatchResult[];
} {
  if (state.status !== 'playing' || state.isPaused) {
    return { newState: state, events: [] };
  }

  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const events: CatchResult[] = [];

  let {
    plateX,
    plateY,
    plateWidth,
    fallingSweets,
    stackedSweets,
    lives,
    score,
    combo,
    towerHeight,
    wobbleAngle,
    wobbleVelocity,
    spawnTimer,
    spawnInterval,
    status,
  } = { ...state };

  // 1. Spawning falling sweets
  spawnTimer += clampedDt;
  const newFalling = [...fallingSweets];
  if (spawnTimer >= spawnInterval && status === 'playing') {
    spawnTimer = 0;
    newFalling.push(createFallingSweet(state.stageConfig));
  }

  // 2. Physics & Catch Detection
  const remainingFalling: SweetItem[] = [];
  let updatedStacked = [...stackedSweets];

  // Calculate current top of the stack
  let currentTopY = plateY;
  let currentTopOffsetX = 0;
  for (const s of updatedStacked) {
    currentTopY -= s.height;
    currentTopOffsetX = s.offsetX;
  }
  const currentTopX = plateX + currentTopOffsetX;

  for (const sweet of newFalling) {
    let sx = sweet.x + sweet.vx * clampedDt;
    let sy = sweet.y + sweet.vy * clampedDt;

    // Check catch collision with top of plate or top stacked sweet
    const catchRadius = (sweet.width + (updatedStacked.length > 0 ? 50 : plateWidth)) * 0.45;
    const isAtLandingAltitude = sy + sweet.height * 0.5 >= currentTopY - 6 && sy - sweet.height * 0.5 <= currentTopY + 12;
    const isHorizontallyAligned = Math.abs(sx - currentTopX) <= catchRadius;

    if (isAtLandingAltitude && isHorizontallyAligned) {
      // Landed!
      const offsetFromCenter = sx - currentTopX;
      const isPerfect = Math.abs(offsetFromCenter) <= 10;

      const newCombo = isPerfect ? combo + 1 : 0;
      const comboMultiplier = Math.min(4, 1 + newCombo * 0.5);
      const earnedPoints = Math.round(sweet.points * comboMultiplier + (isPerfect ? 100 : 0));

      const newStackedSweet: StackedSweet = {
        id: sweet.id,
        type: sweet.type,
        offsetX: isPerfect ? currentTopOffsetX : currentTopOffsetX + offsetFromCenter * 0.6,
        y: currentTopY - sweet.height * 0.5,
        width: sweet.width,
        height: sweet.height,
        angle: (offsetFromCenter / catchRadius) * 0.25,
        points: earnedPoints,
        color: sweet.color,
        frostingColor: sweet.frostingColor,
        isPerfect,
      };

      updatedStacked.push(newStackedSweet);
      currentTopY -= sweet.height;
      currentTopOffsetX = newStackedSweet.offsetX;
      towerHeight += sweet.height;

      score += earnedPoints;
      combo = newCombo;

      // Impart wobble based on off-center impact
      const wobbleImpulse = (offsetFromCenter / 40) * state.stageConfig.wobbleSensitivity * 0.3;
      wobbleVelocity += wobbleImpulse;

      // Check stage completion
      const stageCompleted = updatedStacked.length >= state.stageConfig.targetCount;
      const gameCompleted = stageCompleted && state.stage === BAKERY_STAGES.length;

      if (stageCompleted) {
        status = 'won';
        score += 500;
      }

      events.push({
        sweet: newStackedSweet,
        isPerfect,
        pointsEarned: earnedPoints,
        stageCompleted,
        gameCompleted,
        towerCollapsed: false,
      });
    } else if (sy > 640) {
      // Missed and fell off screen
      // Lose combo
      combo = 0;
    } else {
      // Still falling
      remainingFalling.push({
        ...sweet,
        x: sx,
        y: sy,
      });
    }
  }

  // 3. Wobble Physics & Damping (Spring-mass-damper)
  const springK = 8.5; // restore to zero
  const damping = 4.2;
  const springAcc = -springK * wobbleAngle - damping * wobbleVelocity;
  wobbleVelocity += springAcc * clampedDt;
  wobbleAngle += wobbleVelocity * clampedDt;

  // 4. Catastrophic Tower Collapse Check if wobble is too extreme
  let towerCollapsed = false;
  if (Math.abs(wobbleAngle) > 0.48 && updatedStacked.length > 3) {
    // Shed top 3 items to regain balance
    updatedStacked.splice(updatedStacked.length - 3, 3);
    wobbleAngle = 0;
    wobbleVelocity = 0;
    lives -= 1;
    combo = 0;
    towerCollapsed = true;

    if (lives <= 0) {
      status = 'lost';
    }

    events.push({
      sweet: updatedStacked[updatedStacked.length - 1] || null,
      isPerfect: false,
      pointsEarned: 0,
      stageCompleted: false,
      gameCompleted: false,
      towerCollapsed: true,
    });
  }

  const newState: HamsterCookieStackState = {
    ...state,
    plateX,
    plateY,
    fallingSweets: remainingFalling,
    stackedSweets: updatedStacked,
    lives,
    score,
    combo,
    towerHeight,
    wobbleAngle,
    wobbleVelocity,
    spawnTimer,
    status,
  };

  return { newState, events };
}

export function advanceToNextBakeryStage(state: HamsterCookieStackState): HamsterCookieStackState {
  if (state.stage >= BAKERY_STAGES.length) return state;
  const next = initCookieStackGame(state.stage + 1);
  return {
    ...next,
    score: state.score,
    highScore: Math.max(state.highScore, state.score),
  };
}

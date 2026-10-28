import {
  CaterpillarState,
  CaterpillarEvent,
  Direction,
  GardenFruit,
  GardenObstacle,
  GardenStageConfig,
  FruitType,
} from './types';

export const STAGE_CONFIGS: GardenStageConfig[] = [
  {
    stage: 1,
    name: 'Daisy Meadow',
    subtitle: 'Open Green Grass • Sweet Cherries',
    targetFruits: 10,
    targetScore: 350,
    speed: 7.2,
    cols: 18,
    rows: 22,
    obstacles: [],
  },
  {
    stage: 2,
    name: 'Strawberry Patch',
    subtitle: 'Garden Stones • Juicy Berries',
    targetFruits: 12,
    targetScore: 550,
    speed: 8.2,
    cols: 18,
    rows: 22,
    obstacles: [
      { x: 5, y: 6, type: 'rock' },
      { x: 12, y: 6, type: 'rock' },
      { x: 5, y: 15, type: 'rock' },
      { x: 12, y: 15, type: 'rock' },
    ],
  },
  {
    stage: 3,
    name: 'Thorn Hedge Maze',
    subtitle: 'Wooden Hedges • Narrow Paths',
    targetFruits: 15,
    targetScore: 800,
    speed: 9.2,
    cols: 18,
    rows: 22,
    obstacles: [
      // Left vertical hedge
      { x: 4, y: 8, type: 'hedge' },
      { x: 4, y: 9, type: 'hedge' },
      { x: 4, y: 10, type: 'hedge' },
      { x: 4, y: 11, type: 'hedge' },
      { x: 4, y: 12, type: 'hedge' },
      // Right vertical hedge
      { x: 13, y: 8, type: 'hedge' },
      { x: 13, y: 9, type: 'hedge' },
      { x: 13, y: 10, type: 'hedge' },
      { x: 13, y: 11, type: 'hedge' },
      { x: 13, y: 12, type: 'hedge' },
      // Center thorn
      { x: 8, y: 10, type: 'thorn' },
      { x: 9, y: 10, type: 'thorn' },
    ],
  },
  {
    stage: 4,
    name: 'Butterfly Greenhouse',
    subtitle: 'Golden Apples • Fast Speed Frenzy',
    targetFruits: 18,
    targetScore: 1200,
    speed: 10.5,
    cols: 18,
    rows: 22,
    obstacles: [
      { x: 6, y: 5, type: 'hedge' },
      { x: 7, y: 5, type: 'hedge' },
      { x: 10, y: 5, type: 'hedge' },
      { x: 11, y: 5, type: 'hedge' },
      { x: 6, y: 16, type: 'hedge' },
      { x: 7, y: 16, type: 'hedge' },
      { x: 10, y: 16, type: 'hedge' },
      { x: 11, y: 16, type: 'hedge' },
      { x: 3, y: 10, type: 'rock' },
      { x: 14, y: 10, type: 'rock' },
    ],
  },
];

export function getDirDelta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'up':
      return { dx: 0, dy: -1 };
    case 'down':
      return { dx: 0, dy: 1 };
    case 'left':
      return { dx: -1, dy: 0 };
    case 'right':
      return { dx: 1, dy: 0 };
  }
}

export function isOpposite(dir1: Direction, dir2: Direction): boolean {
  return (
    (dir1 === 'up' && dir2 === 'down') ||
    (dir1 === 'down' && dir2 === 'up') ||
    (dir1 === 'left' && dir2 === 'right') ||
    (dir1 === 'right' && dir2 === 'left')
  );
}

export function getRandomFruitType(stage: number): { type: FruitType; points: number } {
  const rand = Math.random();
  if (stage >= 4 && rand < 0.15) {
    return { type: 'golden_apple', points: 150 };
  }
  if (rand < 0.2) {
    return { type: 'leaf', points: 50 };
  }
  if (rand < 0.45) {
    return { type: 'apple', points: 60 };
  }
  if (rand < 0.72) {
    return { type: 'strawberry', points: 40 };
  }
  return { type: 'cherry', points: 25 };
}

export function spawnFruit(
  cols: number,
  rows: number,
  occupiedCells: Set<string>,
  stage: number
): GardenFruit | null {
  const available: Array<{ x: number; y: number }> = [];

  for (let c = 1; c < cols - 1; c++) {
    for (let r = 1; r < rows - 1; r++) {
      const key = `${c},${r}`;
      if (!occupiedCells.has(key)) {
        available.push({ x: c, y: r });
      }
    }
  }

  if (available.length === 0) return null;

  const chosen = available[Math.floor(Math.random() * available.length)]!;
  const fruitInfo = getRandomFruitType(stage);

  return {
    id: `fruit-${Date.now()}-${Math.random()}`,
    x: chosen.x,
    y: chosen.y,
    type: fruitInfo.type,
    points: fruitInfo.points,
    bonus: fruitInfo.type === 'leaf' ? 'speed' : undefined,
  };
}

export function createInitialState(stageIndex = 1, currentHighScore = 0): CaterpillarState {
  const config = STAGE_CONFIGS.find((s) => s.stage === stageIndex) || STAGE_CONFIGS[0]!;
  const cols = config.cols;
  const rows = config.rows;

  // Initial 4-segment caterpillar facing right
  const startX = Math.floor(cols / 2) - 2;
  const startY = Math.floor(rows / 2);
  const segments = [
    { x: startX + 2, y: startY },
    { x: startX + 1, y: startY },
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
  ];

  const obstacles: GardenObstacle[] = config.obstacles.map((o, idx) => ({
    id: `obs-${config.stage}-${idx}`,
    x: o.x,
    y: o.y,
    type: o.type,
  }));

  const occupied = new Set<string>();
  segments.forEach((s) => occupied.add(`${s.x},${s.y}`));
  obstacles.forEach((o) => occupied.add(`${o.x},${o.y}`));

  const fruits: GardenFruit[] = [];
  for (let i = 0; i < 3; i++) {
    const f = spawnFruit(cols, rows, occupied, config.stage);
    if (f) {
      fruits.push(f);
      occupied.add(`${f.x},${f.y}`);
    }
  }

  return {
    status: 'ready',
    stage: config.stage,
    score: 0,
    highScore: currentHighScore,
    segments,
    direction: 'right',
    nextDirection: 'right',
    fruits,
    obstacles,
    fruitsEaten: 0,
    targetFruits: config.targetFruits,
    moveTimer: 0,
    moveInterval: 1 / config.speed,
    speedBoostRemaining: 0,
    sparkles: [],
    floatingBadges: [],
    timeInState: 0,
    cols,
    rows,
    cellSize: 24,
    width: 500,
    height: 720,
  };
}

export function setDirection(state: CaterpillarState, newDir: Direction): CaterpillarState {
  if (isOpposite(state.direction, newDir)) {
    return state; // Cannot turn 180 degrees directly
  }

  const nextStatus = state.status === 'ready' ? 'crawling' : state.status;

  return {
    ...state,
    status: nextStatus,
    nextDirection: newDir,
  };
}

export function updateEngine(
  state: CaterpillarState,
  dt: number
): { state: CaterpillarState; events: CaterpillarEvent[] } {
  const events: CaterpillarEvent[] = [];
  const safeDt = Math.min(0.25, Math.max(0.001, dt));

  if (state.status !== 'crawling') {
    return { state: { ...state, timeInState: state.timeInState + safeDt }, events };
  }

  let nextScore = state.score;
  let nextHighScore = Math.max(state.highScore, nextScore);
  let nextFruitsEaten = state.fruitsEaten;
  let nextStatus: CaterpillarState['status'] = state.status;
  let nextSpeedBoost = Math.max(0, state.speedBoostRemaining - safeDt);

  const newSparkles: CaterpillarState['sparkles'] = [];
  const newBadges: CaterpillarState['floatingBadges'] = [];

  // Speed calculation (boost reduces moveInterval)
  const currentInterval = nextSpeedBoost > 0 ? state.moveInterval * 0.65 : state.moveInterval;
  let nextTimer = state.moveTimer + safeDt;

  let currentSegments = [...state.segments];
  let currentFruits = [...state.fruits];
  let currentDirection = state.nextDirection;

  if (nextTimer >= currentInterval) {
    nextTimer = 0;

    const head = currentSegments[0]!;
    const delta = getDirDelta(currentDirection);
    const newHead = { x: head.x + delta.dx, y: head.y + delta.dy };

    // 1. Boundary Crash Check
    if (newHead.x < 0 || newHead.x >= state.cols || newHead.y < 0 || newHead.y >= state.rows) {
      events.push({ type: 'crash', x: head.x, y: head.y });
      return {
        state: {
          ...state,
          status: 'game_over',
          score: nextScore,
          highScore: Math.max(nextHighScore, nextScore),
          timeInState: state.timeInState + safeDt,
        },
        events,
      };
    }

    // 2. Obstacle Crash Check
    const hitObstacle = state.obstacles.some((o) => o.x === newHead.x && o.y === newHead.y);
    if (hitObstacle) {
      events.push({ type: 'crash', x: newHead.x, y: newHead.y });
      return {
        state: {
          ...state,
          status: 'game_over',
          score: nextScore,
          highScore: Math.max(nextHighScore, nextScore),
          timeInState: state.timeInState + safeDt,
        },
        events,
      };
    }

    // 3. Self-Collision Check (excluding tail which moves)
    const hitSelf = currentSegments.slice(0, -1).some((s) => s.x === newHead.x && s.y === newHead.y);
    if (hitSelf) {
      events.push({ type: 'crash', x: newHead.x, y: newHead.y });
      return {
        state: {
          ...state,
          status: 'game_over',
          score: nextScore,
          highScore: Math.max(nextHighScore, nextScore),
          timeInState: state.timeInState + safeDt,
        },
        events,
      };
    }

    // 4. Check Food Eating
    const eatenFruitIdx = currentFruits.findIndex((f) => f.x === newHead.x && f.y === newHead.y);

    if (eatenFruitIdx >= 0) {
      const fruit = currentFruits[eatenFruitIdx]!;
      currentFruits.splice(eatenFruitIdx, 1);

      nextFruitsEaten += 1;
      nextScore += fruit.points;

      if (fruit.type === 'leaf') {
        nextSpeedBoost = 4.0; // 4 seconds of turbo crawl!
        events.push({ type: 'speed_boost', pointsEarned: fruit.points, x: fruit.x, y: fruit.y });
      } else {
        events.push({ type: 'fruit_eat', fruitType: fruit.type, pointsEarned: fruit.points, x: fruit.x, y: fruit.y });
      }

      // Sparkles
      const sparkColor =
        fruit.type === 'golden_apple'
          ? '#fbbf24'
          : fruit.type === 'leaf'
          ? '#22c55e'
          : fruit.type === 'strawberry'
          ? '#ef4444'
          : '#f43f5e';

      for (let p = 0; p < 10; p++) {
        newSparkles.push({
          id: `sp-${Date.now()}-${p}`,
          x: fruit.x * state.cellSize + state.cellSize / 2,
          y: fruit.y * state.cellSize + state.cellSize / 2,
          vx: (Math.random() - 0.5) * 160,
          vy: (Math.random() - 0.5) * 160,
          radius: 3,
          color: sparkColor,
          alpha: 1,
          life: 0,
          maxLife: 0.45,
        });
      }

      newBadges.push({
        id: `b-${Date.now()}`,
        x: fruit.x * state.cellSize + state.cellSize / 2,
        y: fruit.y * state.cellSize,
        text: `+${fruit.points}`,
        color: sparkColor,
        alpha: 1,
        vy: -35,
      });

      // Grow: prepend new head, do NOT pop tail
      currentSegments = [newHead, ...currentSegments];

      // Spawn replacement fruit
      const occupied = new Set<string>();
      currentSegments.forEach((s) => occupied.add(`${s.x},${s.y}`));
      state.obstacles.forEach((o) => occupied.add(`${o.x},${o.y}`));
      currentFruits.forEach((f) => occupied.add(`${f.x},${f.y}`));

      const replacement = spawnFruit(state.cols, state.rows, occupied, state.stage);
      if (replacement) {
        currentFruits.push(replacement);
      }

      // Check Stage Clear
      if (nextFruitsEaten >= state.targetFruits) {
        if (state.stage >= STAGE_CONFIGS.length) {
          nextStatus = 'victory';
          events.push({ type: 'victory', pointsEarned: nextScore });
        } else {
          nextStatus = 'stage_cleared';
          events.push({ type: 'stage_cleared', pointsEarned: nextScore });
        }
      }
    } else {
      // Normal crawl step: prepend new head, pop tail
      currentSegments = [newHead, ...currentSegments.slice(0, -1)];
    }
  }

  // Update sparkles and badges
  const activeSparkles = [...state.sparkles, ...newSparkles]
    .map((sp) => ({
      ...sp,
      x: sp.x + sp.vx * safeDt,
      y: sp.y + sp.vy * safeDt,
      life: sp.life + safeDt,
      alpha: Math.max(0, 1 - (sp.life + safeDt) / sp.maxLife),
    }))
    .filter((sp) => sp.life < sp.maxLife);

  const activeBadges = [...state.floatingBadges, ...newBadges]
    .map((b) => ({
      ...b,
      y: b.y + b.vy * safeDt,
      alpha: Math.max(0, b.alpha - safeDt * 1.3),
    }))
    .filter((b) => b.alpha > 0.05);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: Math.max(nextHighScore, nextScore),
      segments: currentSegments,
      direction: currentDirection,
      fruits: currentFruits,
      fruitsEaten: nextFruitsEaten,
      moveTimer: nextTimer,
      speedBoostRemaining: nextSpeedBoost,
      sparkles: activeSparkles,
      floatingBadges: activeBadges,
      timeInState: state.timeInState + safeDt,
    },
    events,
  };
}

export function nextStage(state: CaterpillarState): CaterpillarState {
  const nextStageNum = state.stage + 1;
  const config = STAGE_CONFIGS.find((s) => s.stage === nextStageNum) || STAGE_CONFIGS[0]!;
  const cols = config.cols;
  const rows = config.rows;

  const startX = Math.floor(cols / 2) - 2;
  const startY = Math.floor(rows / 2);
  const segments = [
    { x: startX + 2, y: startY },
    { x: startX + 1, y: startY },
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
  ];

  const obstacles: GardenObstacle[] = config.obstacles.map((o, idx) => ({
    id: `obs-${config.stage}-${idx}`,
    x: o.x,
    y: o.y,
    type: o.type,
  }));

  const occupied = new Set<string>();
  segments.forEach((s) => occupied.add(`${s.x},${s.y}`));
  obstacles.forEach((o) => occupied.add(`${o.x},${o.y}`));

  const fruits: GardenFruit[] = [];
  for (let i = 0; i < 3; i++) {
    const f = spawnFruit(cols, rows, occupied, config.stage);
    if (f) {
      fruits.push(f);
      occupied.add(`${f.x},${f.y}`);
    }
  }

  return {
    ...state,
    status: 'ready',
    stage: config.stage,
    segments,
    direction: 'right',
    nextDirection: 'right',
    fruits,
    obstacles,
    fruitsEaten: 0,
    targetFruits: config.targetFruits,
    moveTimer: 0,
    moveInterval: 1 / config.speed,
    speedBoostRemaining: 0,
    sparkles: [],
    floatingBadges: [],
    timeInState: 0,
  };
}

export function resetStage(state: CaterpillarState): CaterpillarState {
  const config = STAGE_CONFIGS.find((s) => s.stage === state.stage) || STAGE_CONFIGS[0]!;
  const cols = config.cols;
  const rows = config.rows;

  const startX = Math.floor(cols / 2) - 2;
  const startY = Math.floor(rows / 2);
  const segments = [
    { x: startX + 2, y: startY },
    { x: startX + 1, y: startY },
    { x: startX, y: startY },
    { x: startX - 1, y: startY },
  ];

  const obstacles: GardenObstacle[] = config.obstacles.map((o, idx) => ({
    id: `obs-${config.stage}-${idx}`,
    x: o.x,
    y: o.y,
    type: o.type,
  }));

  const occupied = new Set<string>();
  segments.forEach((s) => occupied.add(`${s.x},${s.y}`));
  obstacles.forEach((o) => occupied.add(`${o.x},${o.y}`));

  const fruits: GardenFruit[] = [];
  for (let i = 0; i < 3; i++) {
    const f = spawnFruit(cols, rows, occupied, config.stage);
    if (f) {
      fruits.push(f);
      occupied.add(`${f.x},${f.y}`);
    }
  }

  return {
    ...state,
    status: 'ready',
    segments,
    direction: 'right',
    nextDirection: 'right',
    fruits,
    obstacles,
    fruitsEaten: 0,
    moveTimer: 0,
    speedBoostRemaining: 0,
    sparkles: [],
    floatingBadges: [],
    timeInState: 0,
  };
}

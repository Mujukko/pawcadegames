import {
  CropMowerState,
  CropMowerStage,
  FieldTile,
  Direction,
  CropMowerEvent,
} from './types';

export const TILE_SIZE = 28;
export const FIELD_OFFSET_X = 32;
export const FIELD_OFFSET_Y = 80;

export const STAGES: CropMowerStage[] = [
  {
    id: 1,
    name: 'Sunny Wheat Paddock',
    rows: 14,
    cols: 12,
    cropType: 'wheat',
    obstacles: [
      { row: 4, col: 3 },
      { row: 4, col: 8 },
      { row: 9, col: 3 },
      { row: 9, col: 8 },
    ],
    barnChute: { row: 0, col: 5 },
  },
  {
    id: 2,
    name: 'Golden Maize Maze',
    rows: 14,
    cols: 12,
    cropType: 'corn',
    obstacles: [
      { row: 3, col: 2 },
      { row: 3, col: 3 },
      { row: 3, col: 4 },
      { row: 7, col: 7 },
      { row: 7, col: 8 },
      { row: 7, col: 9 },
      { row: 11, col: 4 },
      { row: 11, col: 5 },
    ],
    barnChute: { row: 0, col: 6 },
  },
  {
    id: 3,
    name: 'Sunflower Valley',
    rows: 14,
    cols: 12,
    cropType: 'sunflower',
    obstacles: [
      { row: 2, col: 2 },
      { row: 2, col: 9 },
      { row: 6, col: 5 },
      { row: 6, col: 6 },
      { row: 7, col: 5 },
      { row: 7, col: 6 },
      { row: 11, col: 2 },
      { row: 11, col: 9 },
    ],
    barnChute: { row: 0, col: 5 },
  },
  {
    id: 4,
    name: 'Grand Harvest Ranch',
    rows: 14,
    cols: 12,
    cropType: 'wheat',
    obstacles: [
      { row: 3, col: 3 },
      { row: 3, col: 8 },
      { row: 5, col: 5 },
      { row: 5, col: 6 },
      { row: 8, col: 5 },
      { row: 8, col: 6 },
      { row: 10, col: 3 },
      { row: 10, col: 8 },
    ],
    barnChute: { row: 0, col: 6 },
  },
];

export function buildGrid(stage: CropMowerStage): { grid: FieldTile[][]; totalCrops: number } {
  const grid: FieldTile[][] = [];
  let totalCrops = 0;

  const obstacleSet = new Set(stage.obstacles.map((o) => `${o.row},${o.col}`));

  for (let r = 0; r < stage.rows; r++) {
    const rowList: FieldTile[] = [];
    for (let c = 0; c < stage.cols; c++) {
      const isChute = r === stage.barnChute.row && c === stage.barnChute.col;
      const isObs = obstacleSet.has(`${r},${c}`);

      let state: FieldTile['state'] = 'uncut';
      if (isChute) {
        state = 'barn_chute';
      } else if (isObs) {
        state = 'obstacle';
      } else {
        totalCrops++;
      }

      rowList.push({
        row: r,
        col: c,
        type: stage.cropType,
        state,
        height: 1.0,
      });
    }
    grid.push(rowList);
  }

  return { grid, totalCrops };
}

export function createInitialState(savedHighScore: number = 0, stageIdx: number = 0): CropMowerState {
  const stage = STAGES[stageIdx] || STAGES[0];
  const { grid, totalCrops } = buildGrid(stage);

  // Start tractor near bottom center
  const startX = FIELD_OFFSET_X + 5 * TILE_SIZE + TILE_SIZE / 2;
  const startY = FIELD_OFFSET_Y + 12 * TILE_SIZE + TILE_SIZE / 2;

  return {
    status: 'playing',
    currentStageIndex: stageIdx,
    score: 0,
    highScore: savedHighScore,
    totalCut: 0,
    totalCropsInStage: totalCrops,
    grid,
    player: {
      x: startX,
      y: startY,
      dir: 'up',
      targetDir: 'up',
      speed: 130,
      bladeAngle: 0,
      isMoving: false,
      basket: 0,
      maxBasket: 30,
    },
    turboTimer: 0,
    comboStreak: 0,
  };
}

export function setMowerDirection(state: CropMowerState, dir: Direction): CropMowerState {
  if (state.status !== 'playing') return state;
  return {
    ...state,
    player: {
      ...state.player,
      targetDir: dir,
      isMoving: true,
    },
  };
}

export function stopMower(state: CropMowerState): CropMowerState {
  return {
    ...state,
    player: {
      ...state.player,
      isMoving: false,
    },
  };
}

export function restartStage(state: CropMowerState): CropMowerState {
  const next = createInitialState(state.highScore, state.currentStageIndex);
  next.score = state.score;
  return next;
}

export function nextStage(state: CropMowerState): CropMowerState {
  const nextIdx = (state.currentStageIndex + 1) % STAGES.length;
  const next = createInitialState(state.highScore, nextIdx);
  next.score = state.score;
  return next;
}

export function updateEngine(
  state: CropMowerState,
  dt: number
): { state: CropMowerState; events: CropMowerEvent[] } {
  if (state.status !== 'playing') {
    return { state, events: [] };
  }

  const events: CropMowerEvent[] = [];
  const safeDt = Math.min(0.04, Math.max(0.001, dt));

  const stage = STAGES[state.currentStageIndex] || STAGES[0];
  const player = { ...state.player };

  // 1. Update Blade Angle
  player.bladeAngle += safeDt * 18;

  // 2. Update Turbo Timer
  let nextTurbo = Math.max(0, state.turboTimer - safeDt);
  const currentSpeed = nextTurbo > 0 ? player.speed * 1.5 : player.speed;

  // 3. Move Tractor If Active
  if (player.isMoving) {
    player.dir = player.targetDir;
    let dx = 0;
    let dy = 0;

    if (player.dir === 'up') dy = -currentSpeed * safeDt;
    if (player.dir === 'down') dy = currentSpeed * safeDt;
    if (player.dir === 'left') dx = -currentSpeed * safeDt;
    if (player.dir === 'right') dx = currentSpeed * safeDt;

    const nextX = player.x + dx;
    const nextY = player.y + dy;

    // Check bounds
    const minX = FIELD_OFFSET_X + TILE_SIZE / 2;
    const maxX = FIELD_OFFSET_X + stage.cols * TILE_SIZE - TILE_SIZE / 2;
    const minY = FIELD_OFFSET_Y + TILE_SIZE / 2;
    const maxY = FIELD_OFFSET_Y + stage.rows * TILE_SIZE - TILE_SIZE / 2;

    const clampedX = Math.max(minX, Math.min(maxX, nextX));
    const clampedY = Math.max(minY, Math.min(maxY, nextY));

    // Check obstacle collision
    const targetCol = Math.floor((clampedX - FIELD_OFFSET_X) / TILE_SIZE);
    const targetRow = Math.floor((clampedY - FIELD_OFFSET_Y) / TILE_SIZE);

    const isObstacle =
      targetRow >= 0 &&
      targetRow < stage.rows &&
      targetCol >= 0 &&
      targetCol < stage.cols &&
      state.grid[targetRow][targetCol].state === 'obstacle';

    if (!isObstacle) {
      player.x = clampedX;
      player.y = clampedY;
    }
  }

  // 4. Check Crop Cutting at Current Tractor Position
  const playerCol = Math.floor((player.x - FIELD_OFFSET_X) / TILE_SIZE);
  const playerRow = Math.floor((player.y - FIELD_OFFSET_Y) / TILE_SIZE);

  let nextScore = state.score;
  let nextTotalCut = state.totalCut;
  let nextCombo = state.comboStreak;
  const nextGrid = state.grid.map((r) => r.map((c) => ({ ...c })));

  if (
    playerRow >= 0 &&
    playerRow < stage.rows &&
    playerCol >= 0 &&
    playerCol < stage.cols
  ) {
    const tile = nextGrid[playerRow][playerCol];

    if (tile.state === 'uncut') {
      tile.state = 'cut';
      nextTotalCut++;
      nextCombo++;

      let pts = 10;
      if (tile.type === 'corn') pts = 20;
      if (tile.type === 'sunflower') pts = 30;

      const comboBonus = Math.floor(nextCombo / 10) * 5;
      const earned = pts + comboBonus;
      nextScore += earned;

      player.basket = Math.min(player.maxBasket, player.basket + 1);

      events.push({
        type: 'crop_cut',
        row: playerRow,
        col: playerCol,
        cropType: tile.type,
        points: earned,
      });
    } else if (tile.state === 'barn_chute' && player.basket > 0) {
      // Deposit Bales
      const bonus = player.basket * 25;
      nextScore += bonus;
      events.push({
        type: 'basket_deposited',
        count: player.basket,
        points: bonus,
      });
      player.basket = 0;
    }
  }

  // 5. Stage Clear Verification (100% Crops Cut)
  let nextStatus: CropMowerState['status'] = state.status;
  if (nextTotalCut >= state.totalCropsInStage && state.totalCropsInStage > 0) {
    nextStatus = 'stage_clear';
    nextScore += 1000; // stage completion bonus
    events.push({
      type: 'stage_clear',
      stageIndex: state.currentStageIndex,
    });
  }

  const nextHighScore = Math.max(state.highScore, nextScore);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: nextHighScore,
      totalCut: nextTotalCut,
      grid: nextGrid,
      player,
      turboTimer: nextTurbo,
      comboStreak: nextCombo,
    },
    events,
  };
}

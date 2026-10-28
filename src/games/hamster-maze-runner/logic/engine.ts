import {
  HamsterMazeState,
  HamsterMazeStage,
  MazeItem,
  HamsterMazeEvent,
} from './types';

export const CELL_SIZE = 30;
export const MAZE_OFFSET_X = 35;
export const MAZE_OFFSET_Y = 100;

export const STAGES: HamsterMazeStage[] = [
  {
    id: 1,
    name: 'Cozy Burrow',
    startRow: 1,
    startCol: 1,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 0, 1, 2, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [
      { row: 1, col: 3, type: 'acorn' },
      { row: 3, col: 7, type: 'acorn' },
      { row: 5, col: 2, type: 'acorn' },
      { row: 7, col: 1, type: 'key' },
      { row: 7, col: 7, type: 'sunflower_seed' },
      { row: 9, col: 4, type: 'acorn' },
    ],
  },
  {
    id: 2,
    name: 'Pantry Labyrinth',
    startRow: 1,
    startCol: 1,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 2, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [
      { row: 1, col: 9, type: 'key' },
      { row: 3, col: 3, type: 'acorn' },
      { row: 5, col: 7, type: 'sunflower_seed' },
      { row: 7, col: 2, type: 'acorn' },
      { row: 7, col: 8, type: 'acorn' },
    ],
  },
  {
    id: 3,
    name: 'Garden Hedge',
    startRow: 1,
    startCol: 1,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
      [1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 2, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [
      { row: 1, col: 4, type: 'acorn' },
      { row: 3, col: 6, type: 'sunflower_seed' },
      { row: 7, col: 3, type: 'key' },
      { row: 9, col: 2, type: 'acorn' },
      { row: 9, col: 7, type: 'acorn' },
    ],
  },
  {
    id: 4,
    name: 'Grand Labyrinth',
    startRow: 1,
    startCol: 1,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
      [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1],
      [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
      [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 0, 1, 1, 1, 0, 1, 1, 1, 2, 1],
      [1, 0, 0, 0, 1, 0, 0, 0, 0, 3, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
    items: [
      { row: 1, col: 8, type: 'acorn' },
      { row: 3, col: 3, type: 'sunflower_seed' },
      { row: 5, col: 7, type: 'acorn' },
      { row: 7, col: 1, type: 'key' },
      { row: 9, col: 5, type: 'acorn' },
    ],
  },
];

export function createInitialState(savedHighScore: number = 0, stageIdx: number = 0): HamsterMazeState {
  const stage = STAGES[stageIdx] || STAGES[0];

  const items: MazeItem[] = stage.items.map((it, idx) => ({
    id: `item-${idx}-${it.row}-${it.col}`,
    row: it.row,
    col: it.col,
    type: it.type,
    isCollected: false,
  }));

  const startX = MAZE_OFFSET_X + stage.startCol * CELL_SIZE + CELL_SIZE / 2;
  const startY = MAZE_OFFSET_Y + stage.startRow * CELL_SIZE + CELL_SIZE / 2;

  return {
    status: 'playing',
    currentStageIndex: stageIdx,
    score: 0,
    highScore: savedHighScore,
    player: {
      row: stage.startRow,
      col: stage.startCol,
      x: startX,
      y: startY,
      targetX: startX,
      targetY: startY,
      dir: 'down',
      isMoving: false,
      hasKey: false,
      acornsCollected: 0,
      totalAcorns: items.filter((i) => i.type === 'acorn').length,
    },
    items,
    grid: stage.grid.map((r) => [...r]),
    timeElapsed: 0,
  };
}

export function moveHamster(
  state: HamsterMazeState,
  dir: 'up' | 'down' | 'left' | 'right'
): { state: HamsterMazeState; event?: HamsterMazeEvent } {
  if (state.status !== 'playing') {
    return { state };
  }

  let dr = 0;
  let dc = 0;
  if (dir === 'up') dr = -1;
  if (dir === 'down') dr = 1;
  if (dir === 'left') dc = -1;
  if (dir === 'right') dc = 1;

  const nextRow = state.player.row + dr;
  const nextCol = state.player.col + dc;

  // Check Grid Boundaries
  if (
    nextRow < 0 ||
    nextRow >= state.grid.length ||
    nextCol < 0 ||
    nextCol >= state.grid[0].length
  ) {
    return { state, event: { type: 'bump_wall' } };
  }

  const cell = state.grid[nextRow][nextCol];

  // Wall check
  if (cell === 1) {
    return {
      state: {
        ...state,
        player: { ...state.player, dir },
      },
      event: { type: 'bump_wall' },
    };
  }

  // Locked Gate check (cell 2)
  if (cell === 2 && !state.player.hasKey) {
    return {
      state: {
        ...state,
        player: { ...state.player, dir },
      },
      event: { type: 'bump_wall' },
    };
  }

  let nextGrid = state.grid;
  let nextScore = state.score;
  let event: HamsterMazeEvent | undefined;

  // Unlock gate
  if (cell === 2 && state.player.hasKey) {
    nextGrid = state.grid.map((r, ri) =>
      r.map((c, ci) => (ri === nextRow && ci === nextCol ? 0 : c))
    );
    nextScore += 250;
    event = { type: 'gate_unlocked' };
  }

  // Target coordinates
  const targetX = MAZE_OFFSET_X + nextCol * CELL_SIZE + CELL_SIZE / 2;
  const targetY = MAZE_OFFSET_Y + nextRow * CELL_SIZE + CELL_SIZE / 2;

  // Check Item Pickups
  let nextHasKey = state.player.hasKey;
  let nextAcorns = state.player.acornsCollected;
  const nextItems = state.items.map((it) => {
    if (!it.isCollected && it.row === nextRow && it.col === nextCol) {
      if (it.type === 'key') {
        nextHasKey = true;
        nextScore += 150;
        event = { type: 'item_collected', itemType: 'key', points: 150 };
      } else if (it.type === 'acorn') {
        nextAcorns++;
        nextScore += 50;
        event = { type: 'item_collected', itemType: 'acorn', points: 50 };
      } else if (it.type === 'sunflower_seed') {
        nextScore += 100;
        event = { type: 'item_collected', itemType: 'sunflower_seed', points: 100 };
      }
      return { ...it, isCollected: true };
    }
    return it;
  });

  // Check Exit (cell 3)
  let nextStatus: HamsterMazeState['status'] = state.status;
  if (cell === 3) {
    nextStatus = 'stage_clear';
    nextScore += 1000;
    event = { type: 'stage_clear', stageIndex: state.currentStageIndex };
  }

  const nextHighScore = Math.max(state.highScore, nextScore);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: nextHighScore,
      grid: nextGrid,
      items: nextItems,
      player: {
        ...state.player,
        row: nextRow,
        col: nextCol,
        targetX,
        targetY,
        dir,
        isMoving: true,
        hasKey: nextHasKey,
        acornsCollected: nextAcorns,
      },
    },
    event,
  };
}

export function restartStage(state: HamsterMazeState): HamsterMazeState {
  const next = createInitialState(state.highScore, state.currentStageIndex);
  next.score = state.score;
  return next;
}

export function nextStage(state: HamsterMazeState): HamsterMazeState {
  const nextIdx = (state.currentStageIndex + 1) % STAGES.length;
  const next = createInitialState(state.highScore, nextIdx);
  next.score = state.score;
  return next;
}

export function updateEngine(
  state: HamsterMazeState,
  dt: number
): { state: HamsterMazeState; events: HamsterMazeEvent[] } {
  if (state.status !== 'playing') {
    return { state, events: [] };
  }

  const safeDt = Math.min(0.04, Math.max(0.001, dt));
  const player = { ...state.player };

  // Smooth position lerp
  const speed = 14;
  player.x += (player.targetX - player.x) * Math.min(1, safeDt * speed);
  player.y += (player.targetY - player.y) * Math.min(1, safeDt * speed);

  const distSq =
    (player.targetX - player.x) * (player.targetX - player.x) +
    (player.targetY - player.y) * (player.targetY - player.y);

  if (distSq < 1) {
    player.x = player.targetX;
    player.y = player.targetY;
    player.isMoving = false;
  }

  return {
    state: {
      ...state,
      player,
      timeElapsed: state.timeElapsed + safeDt,
    },
    events: [],
  };
}

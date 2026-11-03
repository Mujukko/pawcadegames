import {
  HayStackGameState,
  HayBlock,
  MovingHayBlock,
  SlicedPiece,
} from './types';

export const BLOCK_HEIGHT = 28;
export const BASE_BLOCK_WIDTH = 200;
export const SLIDE_BOUND = 180;
export const BLOCK_SPEED = 190;

export const HAY_PALETTE = [
  '#f59e0b', // warm golden hay
  '#10b981', // meadow clover green
  '#06b6d4', // sky cyan
  '#ec4899', // wild flower pink
  '#8b5cf6', // dusk purple
  '#f97316', // autumn pumpkin orange
  '#eab308', // sunny dandelion yellow
  '#14b8a6', // fresh pasture teal
];

export function getBlockColor(index: number): string {
  return HAY_PALETTE[index % HAY_PALETTE.length];
}

export function createHayStackGame(highScore = 0): HayStackGameState {
  const baseBlock: HayBlock = {
    id: 'base_0',
    x: 0,
    y: 0,
    width: BASE_BLOCK_WIDTH,
    height: BLOCK_HEIGHT,
    color: getBlockColor(0),
  };

  const activeBlock: MovingHayBlock = {
    x: -SLIDE_BOUND,
    y: BLOCK_HEIGHT,
    width: BASE_BLOCK_WIDTH,
    height: BLOCK_HEIGHT,
    speed: BLOCK_SPEED,
    direction: 1,
    color: getBlockColor(1),
  };

  return {
    status: 'ready',
    stack: [baseBlock],
    activeBlock,
    slicedPieces: [],
    perfectStreak: 0,
    score: 0,
    highScore,
    events: [],
  };
}

export function dropBlock(state: HayStackGameState): HayStackGameState {
  if (state.status === 'game_over' || !state.activeBlock) return state;

  const active = state.activeBlock;
  const topBlock = state.stack[state.stack.length - 1];

  const diffX = active.x - topBlock.x;
  const absDiff = Math.abs(diffX);

  const events: HayStackGameState['events'] = [];
  let status: HayStackGameState['status'] = 'playing';
  let perfectStreak = state.perfectStreak;
  let score = state.score + 1;
  let highScore = Math.max(state.highScore, score);

  // Complete Miss
  if (absDiff >= topBlock.width) {
    // Falls off completely!
    const fallenPiece: SlicedPiece = {
      id: `fall_${Date.now()}`,
      x: active.x,
      y: active.y,
      width: active.width,
      height: active.height,
      vy: 0,
      vx: active.direction * 60,
      angularVel: active.direction * 2,
      angle: 0,
      color: active.color,
    };

    return {
      ...state,
      status: 'game_over',
      activeBlock: null,
      slicedPieces: [...state.slicedPieces, fallenPiece],
      events: [{ type: 'miss' }],
      highScore,
    };
  }

  let finalX = active.x;
  let finalWidth = topBlock.width - absDiff;
  const slicedPieces = [...state.slicedPieces];

  // Perfect Snap (tolerance <= 3.5px)
  if (absDiff <= 3.5) {
    finalX = topBlock.x;
    finalWidth = topBlock.width;
    perfectStreak += 1;
    // Reward consecutive perfect placements with width expansion
    if (perfectStreak >= 5) {
      finalWidth = Math.min(BASE_BLOCK_WIDTH, finalWidth + 8);
    }
    events.push({ type: 'perfect' });
  } else {
    // Sliced overhang piece
    perfectStreak = 0;
    const sliceWidth = absDiff;
    const isRightSlice = diffX > 0;
    const sliceCenterX = isRightSlice
      ? topBlock.x + topBlock.width * 0.5 + sliceWidth * 0.5
      : topBlock.x - topBlock.width * 0.5 - sliceWidth * 0.5;

    finalX = isRightSlice
      ? topBlock.x + (topBlock.width - sliceWidth) * 0.5
      : topBlock.x - (topBlock.width - sliceWidth) * 0.5;

    slicedPieces.push({
      id: `slice_${Date.now()}`,
      x: sliceCenterX,
      y: active.y,
      width: sliceWidth,
      height: active.height,
      vy: 0,
      vx: isRightSlice ? 90 : -90,
      angularVel: isRightSlice ? 3.5 : -3.5,
      angle: 0,
      color: active.color,
    });

    events.push({ type: 'slice' });
  }

  // Add new settled block to stack
  const settledBlock: HayBlock = {
    id: `block_${state.stack.length}`,
    x: finalX,
    y: active.y,
    width: finalWidth,
    height: BLOCK_HEIGHT,
    color: active.color,
  };

  const nextStack = [...state.stack, settledBlock];

  // Spawn next moving block
  const nextSpeed = Math.min(340, BLOCK_SPEED + nextStack.length * 2.5);
  const nextActive: MovingHayBlock = {
    x: state.stack.length % 2 === 0 ? -SLIDE_BOUND : SLIDE_BOUND,
    y: active.y + BLOCK_HEIGHT,
    width: finalWidth,
    height: BLOCK_HEIGHT,
    speed: nextSpeed,
    direction: state.stack.length % 2 === 0 ? 1 : -1,
    color: getBlockColor(nextStack.length),
  };

  return {
    ...state,
    status,
    stack: nextStack,
    activeBlock: nextActive,
    slicedPieces,
    perfectStreak,
    score,
    highScore,
    events,
  };
}

export function updateHayStackGame(state: HayStackGameState, rawDt: number): HayStackGameState {
  const dt = Math.min(rawDt, 0.05);

  let activeBlock = state.activeBlock ? { ...state.activeBlock } : null;

  if (activeBlock && state.status !== 'game_over') {
    activeBlock.x += activeBlock.direction * activeBlock.speed * dt;
    if (activeBlock.x >= SLIDE_BOUND) {
      activeBlock.x = SLIDE_BOUND;
      activeBlock.direction = -1;
    } else if (activeBlock.x <= -SLIDE_BOUND) {
      activeBlock.x = -SLIDE_BOUND;
      activeBlock.direction = 1;
    }
  }

  // Gravity & tumble physics for sliced pieces
  let slicedPieces = state.slicedPieces.map((p) => {
    const next = { ...p };
    next.vy += 900 * dt;
    next.y -= next.vy * dt;
    next.x += next.vx * dt;
    next.angle += next.angularVel * dt;
    return next;
  });

  // Filter pieces fallen far below
  const lowestY = state.stack[0]?.y || 0;
  slicedPieces = slicedPieces.filter((p) => p.y > lowestY - 400);

  return {
    ...state,
    activeBlock,
    slicedPieces,
  };
}

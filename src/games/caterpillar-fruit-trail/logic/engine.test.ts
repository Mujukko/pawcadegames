import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  getDirDelta,
  isOpposite,
  setDirection,
  updateEngine,
  nextStage,
  resetStage,
  STAGE_CONFIGS,
} from './engine';

describe('Caterpillar Fruit Trail Logic Engine', () => {
  it('initializes Stage 1 properly with correct default parameters', () => {
    const state = createInitialState(1, 600);
    expect(state.stage).toBe(1);
    expect(state.status).toBe('ready');
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(600);
    expect(state.segments.length).toBe(4);
    expect(state.fruits.length).toBeGreaterThanOrEqual(1);
    expect(state.obstacles.length).toBe(0);
  });

  it('accurately maps direction deltas', () => {
    expect(getDirDelta('up')).toEqual({ dx: 0, dy: -1 });
    expect(getDirDelta('down')).toEqual({ dx: 0, dy: 1 });
    expect(getDirDelta('left')).toEqual({ dx: -1, dy: 0 });
    expect(getDirDelta('right')).toEqual({ dx: 1, dy: 0 });
  });

  it('correctly identifies opposite directions and blocks 180-degree self-reversals', () => {
    expect(isOpposite('left', 'right')).toBe(true);
    expect(isOpposite('up', 'down')).toBe(true);
    expect(isOpposite('left', 'up')).toBe(false);

    let state = createInitialState(1);
    state.direction = 'right';
    const nextSt = setDirection(state, 'left');
    expect(nextSt.nextDirection).toBe('right'); // Reversal blocked
  });

  it('switches status to crawling upon setting a valid direction', () => {
    let state = createInitialState(1);
    expect(state.status).toBe('ready');
    state = setDirection(state, 'up');
    expect(state.status).toBe('crawling');
    expect(state.nextDirection).toBe('up');
  });

  it('advances segments forward on movement interval tick', () => {
    let state = createInitialState(1);
    state.status = 'crawling';
    state.direction = 'right';
    state.nextDirection = 'right';
    const initialHead = { ...state.segments[0]! };

    // Advance by full moveInterval
    const { state: nextSt } = updateEngine(state, state.moveInterval + 0.01);
    expect(nextSt.segments[0]!.x).toBe(initialHead.x + 1);
    expect(nextSt.segments[0]!.y).toBe(initialHead.y);
  });

  it('eats fruit, grows by one segment, and awards points', () => {
    let state = createInitialState(1);
    state.status = 'crawling';
    state.direction = 'right';
    state.nextDirection = 'right';

    // Place a cherry directly in front of head
    const head = state.segments[0]!;
    state.fruits = [{ id: 'test-cherry', x: head.x + 1, y: head.y, type: 'cherry', points: 25 }];
    const initialLen = state.segments.length;

    const { state: nextSt, events } = updateEngine(state, state.moveInterval + 0.01);
    expect(events.some((e) => e.type === 'fruit_eat')).toBe(true);
    expect(nextSt.segments.length).toBe(initialLen + 1); // Grown!
    expect(nextSt.score).toBe(25);
    expect(nextSt.fruitsEaten).toBe(1);
  });

  it('detects boundary collision and triggers game over', () => {
    let state = createInitialState(1);
    state.status = 'crawling';
    state.direction = 'right';
    state.nextDirection = 'right';
    // Position head at right boundary
    state.segments[0]!.x = state.cols - 1;
    state.segments[0]!.y = 10;

    const { state: nextSt, events } = updateEngine(state, state.moveInterval + 0.01);
    expect(events.some((e) => e.type === 'crash')).toBe(true);
    expect(nextSt.status).toBe('game_over');
  });

  it('detects obstacle collision and triggers game over', () => {
    let state = createInitialState(2); // Stage 2 has rock obstacles
    state.status = 'crawling';
    state.direction = 'right';
    state.nextDirection = 'right';

    const rock = state.obstacles[0]!;
    state.segments[0]!.x = rock.x - 1;
    state.segments[0]!.y = rock.y;

    const { state: nextSt, events } = updateEngine(state, state.moveInterval + 0.01);
    expect(events.some((e) => e.type === 'crash')).toBe(true);
    expect(nextSt.status).toBe('game_over');
  });

  it('triggers speed boost when eating a green leaf', () => {
    let state = createInitialState(1);
    state.status = 'crawling';
    state.direction = 'right';
    state.nextDirection = 'right';

    const head = state.segments[0]!;
    state.fruits = [{ id: 'test-leaf', x: head.x + 1, y: head.y, type: 'leaf', points: 50, bonus: 'speed' }];

    const { state: nextSt, events } = updateEngine(state, state.moveInterval + 0.01);
    expect(events.some((e) => e.type === 'speed_boost')).toBe(true);
    expect(nextSt.speedBoostRemaining).toBeGreaterThan(0);
  });

  it('clears stage when target fruit quota is reached and advances to next stage', () => {
    let state = createInitialState(1);
    state.status = 'crawling';
    state.direction = 'right';
    state.nextDirection = 'right';
    state.fruitsEaten = STAGE_CONFIGS[0]!.targetFruits - 1; // 1 away from clear

    const head = state.segments[0]!;
    state.fruits = [{ id: 'test-fruit', x: head.x + 1, y: head.y, type: 'cherry', points: 25 }];

    const { state: clearedSt } = updateEngine(state, state.moveInterval + 0.01);
    expect(clearedSt.status).toBe('stage_cleared');

    const nextSt = nextStage(clearedSt);
    expect(nextSt.stage).toBe(2);
    expect(nextSt.status).toBe('ready');
    expect(nextSt.fruitsEaten).toBe(0);
  });

  it('resets current stage properly', () => {
    let state = createInitialState(2);
    state.fruitsEaten = 4;
    const resetSt = resetStage(state);
    expect(resetSt.stage).toBe(2);
    expect(resetSt.status).toBe('ready');
    expect(resetSt.fruitsEaten).toBe(0);
  });
});

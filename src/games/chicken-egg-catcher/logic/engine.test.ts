import { describe, it, expect } from 'bun:test';
import {
  createInitialCatcherState,
  setBasketTargetX,
  moveBasketDirection,
  stepEggCatcherEngine,
  GAME_WIDTH,
  BASKET_WIDTH,
  BASKET_Y,
  FLOOR_Y,
} from './engine';
import { ChickenEggCatcherState, FallingEgg } from './types';

describe('Chicken Egg Catcher Core Logic Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialCatcherState(500);

    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.lives).toBe(3);
    expect(state.maxLives).toBe(3);
    expect(state.combo).toBe(0);
    expect(state.perches.length).toBe(4);
    expect(state.basket.x).toBe(GAME_WIDTH / 2);
    expect(state.basket.y).toBe(BASKET_Y);
  });

  it('clamps basket target X within game boundaries', () => {
    let state = createInitialCatcherState();
    const halfWidth = BASKET_WIDTH / 2;

    // Try moving too far left
    state = setBasketTargetX(state, -100);
    expect(state.basket.targetX).toBe(halfWidth);

    // Try moving too far right
    state = setBasketTargetX(state, 1000);
    expect(state.basket.targetX).toBe(GAME_WIDTH - halfWidth);

    // Move within valid zone
    state = setBasketTargetX(state, 200);
    expect(state.basket.targetX).toBe(200);
  });

  it('moves basket left and right via directional controls', () => {
    let state = createInitialCatcherState();
    state = setBasketTargetX(state, 200);

    state = moveBasketDirection(state, 'left', 50);
    expect(state.basket.targetX).toBe(150);

    state = moveBasketDirection(state, 'right', 80);
    expect(state.basket.targetX).toBe(230);
  });

  it('catches a regular egg in the basket and awards points & combo', () => {
    let state = createInitialCatcherState();
    state.basket.x = 200;
    state.basket.targetX = 200;

    const testEgg: FallingEgg = {
      id: 'test-egg-1',
      x: 200,
      y: BASKET_Y - 2, // perfectly positioned right above basket
      vy: 100,
      type: 'regular',
      points: 10,
      radius: 10,
      wobble: 0,
    };

    state.fallingEggs = [testEgg];

    const { state: next, events } = stepEggCatcherEngine(state, 0.03);

    expect(next.fallingEggs.length).toBe(0); // caught!
    expect(next.eggsCaught).toBe(1);
    expect(next.combo).toBe(1);
    expect(next.score).toBeGreaterThan(0);
    expect(events.some((e) => e.type === 'egg_caught')).toBe(true);
  });

  it('catches a golden egg, awards bonus points, and triggers golden fever', () => {
    let state = createInitialCatcherState();
    state.basket.x = 200;
    state.basket.targetX = 200;

    const goldenEgg: FallingEgg = {
      id: 'golden-egg-1',
      x: 200,
      y: BASKET_Y - 2,
      vy: 100,
      type: 'golden',
      points: 100,
      radius: 12,
      wobble: 0,
    };

    state.fallingEggs = [goldenEgg];

    const { state: next, events } = stepEggCatcherEngine(state, 0.03);

    expect(next.feverTime).toBe(6.0);
    expect(next.score).toBeGreaterThanOrEqual(100);
    expect(events.some((e) => e.type === 'fever_start')).toBe(true);
  });

  it('catches a rotten egg, loses 1 life and resets combo', () => {
    let state = createInitialCatcherState();
    state.basket.x = 200;
    state.basket.targetX = 200;
    state.combo = 5;

    const rottenEgg: FallingEgg = {
      id: 'rotten-egg-1',
      x: 200,
      y: BASKET_Y - 2,
      vy: 100,
      type: 'rotten',
      points: -50,
      radius: 11,
      wobble: 0,
    };

    state.fallingEggs = [rottenEgg];

    const { state: next, events } = stepEggCatcherEngine(state, 0.03);

    expect(next.lives).toBe(2);
    expect(next.combo).toBe(0);
    expect(events.some((e) => e.type === 'egg_splat' && e.eggType === 'rotten')).toBe(true);
  });

  it('drops a normal egg onto the floor, splats yolk and deducts life', () => {
    let state = createInitialCatcherState();
    state.basket.x = 50; // basket far away
    state.basket.targetX = 50;
    state.combo = 4;

    const droppedEgg: FallingEgg = {
      id: 'dropped-egg-1',
      x: 250,
      y: FLOOR_Y - 1,
      vy: 100,
      type: 'regular',
      points: 10,
      radius: 10,
      wobble: 0,
    };

    state.fallingEggs = [droppedEgg];

    const { state: next, events } = stepEggCatcherEngine(state, 0.04);

    expect(next.lives).toBe(2);
    expect(next.combo).toBe(0);
    expect(next.eggsDropped).toBe(1);
    expect(events.some((e) => e.type === 'egg_splat')).toBe(true);
  });

  it('safely breaks a rotten egg on the floor without penalty (good dodge!)', () => {
    let state = createInitialCatcherState();
    state.basket.x = 50;
    state.basket.targetX = 50;
    state.lives = 3;
    state.combo = 3;

    const dodgedRotten: FallingEgg = {
      id: 'dodged-rotten-1',
      x: 300,
      y: FLOOR_Y - 1,
      vy: 100,
      type: 'rotten',
      points: -50,
      radius: 11,
      wobble: 0,
    };

    state.fallingEggs = [dodgedRotten];

    const { state: next } = stepEggCatcherEngine(state, 0.04);

    expect(next.lives).toBe(3); // lives intact!
    expect(next.combo).toBe(3); // combo preserved!
  });

  it('triggers game_over when lives reach zero', () => {
    let state = createInitialCatcherState();
    state.lives = 1;
    state.basket.x = 50;
    state.basket.targetX = 50;

    const fatalEgg: FallingEgg = {
      id: 'fatal-egg-1',
      x: 200,
      y: FLOOR_Y - 1,
      vy: 100,
      type: 'regular',
      points: 10,
      radius: 10,
      wobble: 0,
    };

    state.fallingEggs = [fatalEgg];

    const { state: next, events } = stepEggCatcherEngine(state, 0.04);

    expect(next.lives).toBe(0);
    expect(next.status).toBe('game_over');
    expect(events.some((e) => e.type === 'game_over')).toBe(true);
  });
});

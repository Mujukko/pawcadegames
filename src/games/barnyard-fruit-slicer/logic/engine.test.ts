import { describe, expect, it } from 'bun:test';
import {
  initFruitSlicer,
  distanceToSegment,
  spawnFruitWave,
  performSlice,
  updateFruitSlicer,
  addSliceTrailPoint,
  FRUIT_CONFIGS,
} from './engine';
import { FlyingFruit } from './types';

describe('Barnyard Fruit Slicer: Farm Juice Rush Engine', () => {
  it('initializes with proper defaults, 3 lives, 0 score, and stage 1', () => {
    const state = initFruitSlicer(1, 480, 640);
    expect(state.status).toBe('playing');
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.stage).toBe(1);
    expect(state.stageTarget).toBe(20);
    expect(state.fruits.length).toBe(0);
  });

  it('calculates point-to-segment distance accurately', () => {
    // Segment from (0, 0) to (100, 0)
    // Point at (50, 10) -> distance should be 10
    expect(distanceToSegment(50, 10, 0, 0, 100, 0)).toBeCloseTo(10, 4);

    // Point before start: (-10, 0) -> distance to (0, 0) is 10
    expect(distanceToSegment(-10, 0, 0, 0, 100, 0)).toBeCloseTo(10, 4);

    // Point after end: (110, 0) -> distance to (100, 0) is 10
    expect(distanceToSegment(110, 0, 0, 0, 100, 0)).toBeCloseTo(10, 4);

    // Degenerate segment (0, 0) to (0, 0)
    expect(distanceToSegment(3, 4, 0, 0, 0, 0)).toBeCloseTo(5, 4);
  });

  it('spawns a wave of fruits with valid types and upward velocity', () => {
    const state = initFruitSlicer(1, 480, 640);
    const { state: nextState, newFruits } = spawnFruitWave(state);

    expect(newFruits.length).toBeGreaterThanOrEqual(2);
    expect(nextState.fruits.length).toBe(newFruits.length);

    newFruits.forEach((f) => {
      expect(f.y).toBe(670); // 640 + 30
      expect(f.vy).toBeLessThan(0); // Upward velocity
      expect(f.isSliced).toBe(false);
      expect(FRUIT_CONFIGS[f.type]).toBeDefined();
    });
  });

  it('slices an unsliced fruit when swipe segment intersects its body', () => {
    let state = initFruitSlicer(1, 480, 640);
    const mockFruit: FlyingFruit = {
      id: 'test_apple',
      type: 'apple',
      x: 200,
      y: 300,
      vx: 0,
      vy: -100,
      radius: 26,
      points: 10,
      isBomb: false,
      color: '#ef4444',
      juiceColor: '#dc2626',
      rotation: 0,
      rotationSpeed: 1,
      isSliced: false,
    };
    state.fruits = [mockFruit];

    // Swipe cutting through (180, 300) to (220, 300)
    const result = performSlice(state, 180, 300, 220, 300, 1.0);

    expect(result.events.length).toBe(1);
    expect(result.events[0]!.type).toBe('slice');
    expect(result.events[0]!.pointsEarned).toBe(10);
    expect(result.state.score).toBe(10);
    expect(result.state.fruits[0]!.isSliced).toBe(true);
    expect(result.state.fruits[0]!.half1).toBeDefined();
    expect(result.state.fruits[0]!.half2).toBeDefined();
    expect(result.state.particles.length).toBeGreaterThan(0);
  });

  it('triggers combo bonus when 3 or more fruits are sliced in succession', () => {
    let state = initFruitSlicer(1, 480, 640);
    const fruits: FlyingFruit[] = [
      {
        id: 'f1',
        type: 'apple',
        x: 100,
        y: 200,
        vx: 0,
        vy: 0,
        radius: 26,
        points: 10,
        isBomb: false,
        color: '#ef4444',
        juiceColor: '#dc2626',
        rotation: 0,
        rotationSpeed: 0,
        isSliced: false,
      },
      {
        id: 'f2',
        type: 'watermelon',
        x: 150,
        y: 200,
        vx: 0,
        vy: 0,
        radius: 34,
        points: 15,
        isBomb: false,
        color: '#10b981',
        juiceColor: '#f43f5e',
        rotation: 0,
        rotationSpeed: 0,
        isSliced: false,
      },
      {
        id: 'f3',
        type: 'strawberry',
        x: 200,
        y: 200,
        vx: 0,
        vy: 0,
        radius: 22,
        points: 12,
        isBomb: false,
        color: '#fb7185',
        juiceColor: '#f43f5e',
        rotation: 0,
        rotationSpeed: 0,
        isSliced: false,
      },
    ];
    state.fruits = fruits;

    // Single sweep across all 3
    const result = performSlice(state, 50, 200, 250, 200, 1.0);

    const comboEvent = result.events.find((e) => e.type === 'combo');
    expect(comboEvent).toBeDefined();
    expect(comboEvent?.comboCount).toBe(3);
    // Base points = 10 + 15 + 12 = 37. Combo bonus = 3 * 10 = 30. Total score = 67
    expect(result.state.score).toBe(67);
  });

  it('slicing a thistle bomb deducts 1 life and causes game over if lives deplete', () => {
    let state = initFruitSlicer(1, 480, 640);
    state.lives = 1;
    const bomb: FlyingFruit = {
      id: 'bomb1',
      type: 'thistle_bomb',
      x: 240,
      y: 250,
      vx: 0,
      vy: 0,
      radius: 28,
      points: 0,
      isBomb: true,
      color: '#475569',
      juiceColor: '#334155',
      rotation: 0,
      rotationSpeed: 0,
      isSliced: false,
    };
    state.fruits = [bomb];

    const result = performSlice(state, 200, 250, 280, 250, 1.0);

    expect(result.state.lives).toBe(0);
    expect(result.state.status).toBe('game_over');
    expect(result.events.some((e) => e.type === 'bomb')).toBe(true);
    expect(result.events.some((e) => e.type === 'game_over')).toBe(true);
  });

  it('deducts 1 life when an unsliced fruit drops below the bottom of the screen', () => {
    let state = initFruitSlicer(1, 480, 640);
    const fallingFruit: FlyingFruit = {
      id: 'falling_fruit',
      type: 'apple',
      x: 200,
      y: 695, // Near bottom threshold 700
      vx: 0,
      vy: 200, // Falling downward
      radius: 26,
      points: 10,
      isBomb: false,
      color: '#ef4444',
      juiceColor: '#dc2626',
      rotation: 0,
      rotationSpeed: 0,
      isSliced: false,
    };
    state.fruits = [fallingFruit];

    const result = updateFruitSlicer(state, 0.1, 1.0);

    expect(result.state.lives).toBe(2);
    expect(result.events.some((e) => e.type === 'fruit_dropped')).toBe(true);
    expect(result.state.fruits.length).toBe(0); // Removed after fall
  });

  it('does not penalize dropping bombs off screen', () => {
    let state = initFruitSlicer(1, 480, 640);
    const fallingBomb: FlyingFruit = {
      id: 'falling_bomb',
      type: 'thistle_bomb',
      x: 200,
      y: 695,
      vx: 0,
      vy: 200,
      radius: 28,
      points: 0,
      isBomb: true,
      color: '#475569',
      juiceColor: '#334155',
      rotation: 0,
      rotationSpeed: 0,
      isSliced: false,
    };
    state.fruits = [fallingBomb];

    const result = updateFruitSlicer(state, 0.1, 1.0);

    expect(result.state.lives).toBe(3); // Lives untouched
    expect(result.events.some((e) => e.type === 'fruit_dropped')).toBe(false);
  });

  it('adds and cleans slice trail points based on timestamps', () => {
    let state = initFruitSlicer(1, 480, 640);
    state = addSliceTrailPoint(state, 100, 100, 1.0);
    state = addSliceTrailPoint(state, 120, 120, 1.1);
    expect(state.sliceTrail.length).toBe(2);

    // Update at time 1.3s (points older than 0.2s expire: 1.0 is 0.3s old, 1.1 is 0.2s old)
    const result = updateFruitSlicer(state, 0.05, 1.35);
    expect(result.state.sliceTrail.length).toBe(0);
  });
});

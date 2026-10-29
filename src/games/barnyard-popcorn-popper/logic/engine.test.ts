import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  nextStage,
  restartStage,
  startPouring,
  stopPouring,
  updateEngine,
} from './engine';

describe('Barnyard Popcorn Popper Logic Engine', () => {
  it('initializes with stage 1 defaults, 0 kernels, and ready phase', () => {
    const state = createInitialState(0, 500);
    expect(state.stage).toBe(1);
    expect(state.kernels.length).toBe(0);
    expect(state.phase).toBe('ready');
    expect(state.isPouring).toBe(false);
    expect(state.spilledCount).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.maxKernels).toBe(45);
  });

  it('starts pouring and emits start_pour event', () => {
    let state = createInitialState(0);
    state = startPouring(state);
    expect(state.isPouring).toBe(true);
    expect(state.phase).toBe('pouring');
    expect(state.events.some((e) => e.type === 'start_pour')).toBe(true);
  });

  it('stops pouring and transitions to popping phase', () => {
    let state = createInitialState(0);
    state = startPouring(state);
    state = stopPouring(state);
    expect(state.isPouring).toBe(false);
    expect(state.phase).toBe('popping');
    expect(state.events.some((e) => e.type === 'stop_pour')).toBe(true);
  });

  it('spawns kernels and tracks poured count during update while pouring', () => {
    let state = createInitialState(0);
    state = startPouring(state);
    state = updateEngine(state, 0.05);
    expect(state.kernels.length).toBeGreaterThan(0);
    expect(state.kernelsPoured).toBe(state.kernels.length);
    expect(state.events.some((e) => e.type === 'kernel_drop')).toBe(true);
  });

  it('stops pouring automatically once maxKernels is reached', () => {
    let state = createInitialState(0);
    state = startPouring(state);
    // Step engine until maxKernels reached and pouring stops
    while (state.isPouring) {
      state = updateEngine(state, 0.05);
    }
    expect(state.kernelsPoured).toBe(state.maxKernels);
    expect(state.isPouring).toBe(false);
    expect(state.phase).toBe('evaluating');
  });

  it('pops unpopped kernels when popTimer expires and launches them upward', () => {
    let state = createInitialState(0);
    state.kernels.push({
      id: 99,
      x: 200,
      y: 450,
      vx: 0,
      vy: 10,
      radius: 5,
      isPopped: false,
      popTimer: 0.05,
      rotation: 0,
      rotationSpeed: 0,
      color: '#f59e0b',
      settled: false,
    });

    state = updateEngine(state, 0.1);
    const kernel = state.kernels.find((k) => k.id === 99);
    expect(kernel).toBeDefined();
    expect(kernel!.isPopped).toBe(true);
    expect(kernel!.radius).toBe(12.5);
    expect(kernel!.vy).toBeLessThan(0); // Launch impulse
    expect(state.events.some((e) => e.type === 'kernel_pop')).toBe(true);
  });

  it('tracks spilled kernels and triggers lost when spill limit is exceeded', () => {
    let state = createInitialState(0);
    state.phase = 'evaluating';
    state.maxSpillsAllowed = 2;

    // Add 3 spilled kernels out of bounds
    for (let i = 0; i < 3; i++) {
      state.kernels.push({
        id: 100 + i,
        x: 400, // far right out of bounds
        y: 650, // below floor
        vx: 0,
        vy: 0,
        radius: 12.5,
        isPopped: true,
        popTimer: 0,
        rotation: 0,
        rotationSpeed: 0,
        color: '#fffbeb',
        settled: false,
      });
    }

    state = updateEngine(state, 0.05);
    expect(state.spilledCount).toBe(3);
    expect(state.phase).toBe('lost');
    expect(state.events.some((e) => e.type === 'game_over' && e.reason === 'spill_limit')).toBe(true);
  });

  it('triggers game over when bucket is underfilled after evaluation timer', () => {
    let state = createInitialState(0);
    state.phase = 'evaluating';
    state.evaluationTimer = 2.75;
    // No kernels inside bucket, fill ratio is 0
    state = updateEngine(state, 0.1);
    expect(state.phase).toBe('lost');
    expect(state.events.some((e) => e.type === 'game_over' && e.reason === 'underfilled')).toBe(true);
  });

  it('evaluates victory with 3 stars when bucket is well filled with minimal spills', () => {
    let state = createInitialState(0);
    state.phase = 'evaluating';
    state.evaluationTimer = 2.75;
    state.spilledCount = 0;

    // Fill bucket with popped kernels up to target line
    // Bucket targetLineY is 410, brimY is 350, y+h is 540
    for (let y = 410; y <= 530; y += 20) {
      for (let x = 160; x <= 240; x += 20) {
        state.kernels.push({
          id: y * 100 + x,
          x,
          y,
          vx: 0,
          vy: 0,
          radius: 12.5,
          isPopped: true,
          popTimer: 0,
          rotation: 0,
          rotationSpeed: 0,
          color: '#fffbeb',
          settled: true,
        });
      }
    }

    state = updateEngine(state, 0.1);
    expect(state.phase).toBe('won');
    expect(state.stars).toBeGreaterThanOrEqual(2);
    expect(state.score).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'victory')).toBe(true);
  });

  it('restarts current stage and preserves accumulated score and high score', () => {
    let state = createInitialState(0, 1200);
    state.score = 2500;
    state = restartStage(state);
    expect(state.stage).toBe(1);
    expect(state.score).toBe(2500);
    expect(state.highScore).toBe(1200);
    expect(state.kernels.length).toBe(0);
    expect(state.phase).toBe('ready');
  });

  it('advances to next stage with clean state and preserved score', () => {
    let state = createInitialState(0, 1500);
    state.score = 3000;
    state = nextStage(state);
    expect(state.stage).toBe(2);
    expect(state.score).toBe(3000);
    expect(state.kernels.length).toBe(0);
    expect(state.phase).toBe('ready');
  });
});

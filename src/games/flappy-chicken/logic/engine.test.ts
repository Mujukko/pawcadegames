import { describe, expect, it } from 'bun:test';
import {
  circleIntersectsRect,
  createInitialState,
  createPipe,
  flap,
  GROUND_Y,
  updateGame,
} from './engine';

describe('Flappy Chicken: Wheat Run Core Engine', () => {
  it('initializes state in ready mode with chicken at rest', () => {
    const state = createInitialState(10, 15);
    expect(state.status).toBe('ready');
    expect(state.score).toBe(0);
    expect(state.bestScore).toBe(10);
    expect(state.wheatGoalPipes).toBe(15);
    expect(state.chicken.alive).toBe(true);
    expect(state.chicken.y).toBe(260);
    expect(state.pipes.length).toBe(0);
  });

  it('hovers gently during ready state without falling', () => {
    let state = createInitialState(0);
    const initialY = state.chicken.y;
    const res = updateGame(state, 0.1);
    expect(res.state.status).toBe('ready');
    expect(Math.abs(res.state.chicken.y - initialY)).toBeLessThan(10);
  });

  it('starts flight on first flap with upward velocity', () => {
    const state = createInitialState(0);
    const flapped = flap(state);
    expect(flapped.state.status).toBe('playing');
    expect(flapped.state.chicken.vy).toBeLessThan(0); // Upward impulse
    expect(flapped.event?.type).toBe('cluck');
  });

  it('applies gravity when flying in playing mode', () => {
    let state = createInitialState(0);
    state = flap(state).state; // vy is negative (-340)
    const initialVy = state.chicken.vy;

    const res = updateGame(state, 0.05); // gravity increases vy
    expect(res.state.chicken.vy).toBeGreaterThan(initialVy);
  });

  describe('circleIntersectsRect collision math', () => {
    it('detects overlap when circle intersects rectangle', () => {
      // Circle at (100, 100), r=15. Rect at (90, 90), w=50, h=50
      expect(circleIntersectsRect(100, 100, 15, 90, 90, 50, 50)).toBe(true);
    });

    it('returns false when circle is well outside rectangle', () => {
      // Circle at (100, 100), r=15. Rect at (200, 200), w=50, h=50
      expect(circleIntersectsRect(100, 100, 15, 200, 200, 50, 50)).toBe(false);
    });
  });

  it('detects ground collision and ends game', () => {
    let state = createInitialState(0);
    state = flap(state).state;
    // Force chicken near ground
    state.chicken.y = GROUND_Y - 5;
    state.chicken.vy = 200;

    const res = updateGame(state, 0.05);
    expect(res.state.isGameOver).toBe(true);
    expect(res.state.chicken.alive).toBe(false);
    expect(res.events.some((e) => e.type === 'hit_ground')).toBe(true);
  });

  it('detects upper and lower pipe collisions', () => {
    let state = createInitialState(0);
    state = flap(state).state;

    // Place an obstacle pipe directly at chicken's X with gap far below
    const pipe = createPipe(state.chicken.x - 10, 400, 100);
    // Upper pipe reaches from y=0 to y=350. Chicken is at y=260!
    state.pipes = [pipe];

    const res = updateGame(state, 0.02);
    expect(res.state.isGameOver).toBe(true);
    expect(res.events.some((e) => e.type === 'hit_pipe')).toBe(true);
  });

  it('increments score when successfully clearing a pipe', () => {
    let state = createInitialState(0);
    state = flap(state).state;

    // Place pipe so its right edge is just crossing the chicken
    // pipe.x + PIPE_WIDTH is at state.chicken.x + 4.
    // In 0.05s with speed 165, it moves ~8.25px left, making right edge < chicken.x
    const pipe = createPipe(state.chicken.x - 68 + 4, state.chicken.y, 160);
    state.pipes = [pipe];

    const res = updateGame(state, 0.05);
    expect(res.state.isGameOver).toBe(false);
    expect(res.state.score).toBe(1);
    expect(res.events.some((e) => e.type === 'point')).toBe(true);
  });

  it('collects golden grains in pipe center', () => {
    let state = createInitialState(0);
    state = flap(state).state;

    // Center of pipe (where grain is) matches chicken.x
    const pipe = createPipe(state.chicken.x - 34, state.chicken.y, 160);
    pipe.hasGrain = true;
    pipe.grainCollected = false;
    pipe.grainY = state.chicken.y;
    state.pipes = [pipe];

    const res = updateGame(state, 0.01);
    expect(res.state.grains).toBe(1);
    expect(res.events.some((e) => e.type === 'grain')).toBe(true);
  });

  it('spawns Golden Wheat Field when pipe goal is reached and triggers victory upon contact', () => {
    // Set low goal of 2 pipes
    let state = createInitialState(0, 2);
    state = flap(state).state;
    state.score = 2; // already cleared 2 pipes!
    state.pipes = []; // no remaining pipes

    // Next update should spawn wheat field
    const res1 = updateGame(state, 0.05);
    expect(res1.state.wheatFieldSpawned).toBe(true);

    // Simulate chicken reaching the wheat field
    res1.state.wheatFieldX = res1.state.chicken.x + 10;
    const res2 = updateGame(res1.state, 0.05);
    expect(res2.state.hasWon).toBe(true);
    expect(res2.state.status).toBe('won');
    expect(res2.events.some((e) => e.type === 'wheat_victory')).toBe(true);
  });
});

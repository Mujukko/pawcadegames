import { describe, expect, it } from 'bun:test';
import {
  initPegPop,
  setCannonAngle,
  fireBall,
  updatePegPop,
  generateStagePegs,
  PEG_CONFIGS,
} from './engine';
import { Peg, BouncingBall } from './types';

describe('Barnyard Peg Pop: Acorn Bounce Logic Engine', () => {
  it('initializes with 10 balls, aiming status, and stage 1 pegs', () => {
    const state = initPegPop(1, 480, 640);
    expect(state.status).toBe('aiming');
    expect(state.ballsLeft).toBe(10);
    expect(state.score).toBe(0);
    expect(state.stage).toBe(1);
    expect(state.ball).toBeNull();
    expect(state.pegs.length).toBeGreaterThan(20);
    expect(state.orangePegsRemaining).toBeGreaterThanOrEqual(6);
  });

  it('clamps cannon aim angle to safe downward cone', () => {
    let state = initPegPop(1, 480, 640);

    // Negative angle or pointing straight up clamped to minAngle 0.25
    state = setCannonAngle(state, -0.5);
    expect(state.aimAngle).toBeCloseTo(0.25, 4);

    // Angle greater than PI clamped to maxAngle PI - 0.25
    state = setCannonAngle(state, Math.PI + 0.5);
    expect(state.aimAngle).toBeCloseTo(Math.PI - 0.25, 4);

    // Valid downward angle untouched
    state = setCannonAngle(state, Math.PI / 2);
    expect(state.aimAngle).toBeCloseTo(Math.PI / 2, 4);
  });

  it('fires a ball from the cannon and transitions to ball_active status', () => {
    let state = initPegPop(1, 480, 640);
    const { state: nextState, success } = fireBall(state);

    expect(success).toBe(true);
    expect(nextState.status).toBe('ball_active');
    expect(nextState.ballsLeft).toBe(9);
    expect(nextState.ball).toBeDefined();
    expect(nextState.ball?.vy).toBeGreaterThan(0); // Firing downward
  });

  it('bounces ball off a peg, marks it hit, and accumulates score', () => {
    let state = initPegPop(1, 480, 640);
    state.status = 'ball_active';

    const testPeg: Peg = {
      id: 'test_blue',
      x: 240,
      y: 200,
      radius: 12,
      type: 'blue',
      isHit: false,
      fadeAlpha: 1.0,
      points: 100,
    };
    state.pegs = [testPeg];

    // Place ball directly above peg falling downward
    const testBall: BouncingBall = {
      id: 'test_b',
      x: 240,
      y: 180, // Distance to peg center is 20 (minDist = 9 + 12 = 21, so colliding)
      vx: 0,
      vy: 200,
      radius: 9,
      isStuck: false,
    };
    state.ball = testBall;

    const result = updatePegPop(state, 0.05);

    expect(result.events.some((e) => e.type === 'peg_hit')).toBe(true);
    expect(result.state.pegs[0]!.isHit).toBe(true);
    expect(result.state.score).toBeGreaterThanOrEqual(100);
    expect(result.state.ball).toBeDefined();
    expect(result.state.ball!.vy).toBeLessThan(0); // Upward rebound bounce!
  });

  it('catches ball in moving basket and awards a free ball', () => {
    let state = initPegPop(1, 480, 640);
    state.status = 'ball_active';
    state.ballsLeft = 5;

    // Basket at y = 598, x = 240
    // Place ball falling right into basket
    state.ball = {
      id: 'b_catch',
      x: state.basket.x,
      y: state.basket.y - 5,
      vx: 0,
      vy: 300,
      radius: 9,
      isStuck: false,
    };

    const result = updatePegPop(state, 0.05);

    expect(result.events.some((e) => e.type === 'basket_catch')).toBe(true);
    expect(result.state.ballsLeft).toBe(6); // 5 + 1 = 6 free ball!
    expect(result.state.ball).toBeNull(); // Caught!
  });

  it('triggers game over when last ball drops without clearing all orange pegs', () => {
    let state = initPegPop(1, 480, 640);
    state.status = 'ball_active';
    state.ballsLeft = 0; // Out of extra balls
    state.orangePegsRemaining = 3;

    // Ball falls below screen bottom (y > 665)
    state.ball = {
      id: 'b_fall',
      x: 240,
      y: 670,
      vx: 0,
      vy: 300,
      radius: 9,
      isStuck: false,
    };

    const result = updatePegPop(state, 0.05);

    expect(result.events.some((e) => e.type === 'game_over')).toBe(true);
    expect(result.state.status).toBe('game_over');
  });

  it('triggers stage cleared when all orange pegs are eliminated', () => {
    let state = initPegPop(1, 480, 640);
    state.status = 'ball_active';
    state.orangePegsRemaining = 0; // Cleared!

    state.ball = {
      id: 'b_win',
      x: 240,
      y: 670,
      vx: 0,
      vy: 300,
      radius: 9,
      isStuck: false,
    };

    const result = updatePegPop(state, 0.05);

    expect(result.events.some((e) => e.type === 'stage_clear')).toBe(true);
    expect(result.state.status).toBe('stage_cleared');
  });
});

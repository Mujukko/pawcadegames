import { describe, expect, it } from 'bun:test';
import {
  initSlopeGame,
  stepSlopeGame,
} from './engine';

describe('Slope: Rolling Acorn Dash Engine', () => {
  it('initializes game with valid track segments and centered ball', () => {
    const state = initSlopeGame(100);
    expect(state.ball.x).toBe(0);
    expect(state.ball.y).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.bestScore).toBe(100);
    expect(state.segments.length).toBeGreaterThan(10);
  });

  it('moves ball laterally based on steer input and advances distance', () => {
    const state = initSlopeGame(0);
    const { state: next } = stepSlopeGame(state, { steerX: 1 }, 0.05);

    expect(next.ball.x).toBeGreaterThan(0);
    expect(next.distance).toBeGreaterThan(0);
    expect(next.score).toBeGreaterThanOrEqual(0);
  });

  it('triggers crash when ball steers off the track edge', () => {
    const state = initSlopeGame(0);
    state.ball.x = 1.1; // Off the right edge

    const { state: next, event } = stepSlopeGame(state, { steerX: 0 }, 0.05);
    expect(next.status).toBe('crashed');
    expect(event).toBe('crash');
  });

  it('triggers crash when ball collides with an obstacle block', () => {
    const state = initSlopeGame(0);
    // Add obstacle directly in front of ball
    state.distance = 50;
    state.segments = [
      {
        z: 50.5,
        width: 2.0,
        curve: 0,
        obstacles: [{ x: 0, z: 50.5, width: 0.6, height: 0.6, type: 'block' }],
      },
    ];

    const { state: next, event } = stepSlopeGame(state, { steerX: 0 }, 0.05);
    expect(next.status).toBe('crashed');
    expect(event).toBe('crash');
  });

  it('launches ball upward into air when hitting a ramp', () => {
    const state = initSlopeGame(0);
    state.distance = 50;
    state.segments = [
      {
        z: 50.5,
        width: 2.0,
        curve: 0,
        obstacles: [{ x: 0, z: 50.5, width: 0.8, height: 0.3, type: 'ramp' }],
      },
    ];

    const { state: next, event } = stepSlopeGame(state, { steerX: 0 }, 0.05);
    expect(event).toBe('jump');
    expect(next.ball.vy).toBeGreaterThan(0);
    expect(next.status).toBe('playing');
  });

  it('survives obstacle block if ball is airborne above block height', () => {
    const state = initSlopeGame(0);
    state.distance = 50;
    state.ball.y = 1.2; // Airborne above block height 0.6
    state.segments = [
      {
        z: 50.5,
        width: 2.0,
        curve: 0,
        obstacles: [{ x: 0, z: 50.5, width: 0.6, height: 0.6, type: 'block' }],
      },
    ];

    const { state: next, event } = stepSlopeGame(state, { steerX: 0 }, 0.05);
    expect(next.status).toBe('playing');
    expect(event).toBeUndefined();
  });
});

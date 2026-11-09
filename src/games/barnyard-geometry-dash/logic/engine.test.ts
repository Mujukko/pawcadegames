import { describe, expect, test } from 'bun:test';
import {
  DASH_STAGES,
  JUMP_VEL,
  PAD_VEL,
  createDashGame,
  setDashInput,
  updateDashGame,
} from './engine';
import { DashGameState } from './types';

describe('Barnyard Geometry Dash Engine', () => {
  test('initializes stage 0 in ready state with 3 stages available', () => {
    expect(DASH_STAGES.length).toBe(3);
    const s = createDashGame(0);
    expect(s.status).toBe('ready');
    expect(s.mode).toBe('cube');
    expect(s.attempt).toBe(1);
  });

  test('pressing jump starts game and launches cube upward', () => {
    let s = createDashGame(0);
    s = setDashInput(s, true);
    expect(s.status).toBe('playing');
    s = updateDashGame(s, 0.02);
    expect(s.y).toBeGreaterThan(0);
    expect(s.vy).toBeLessThan(JUMP_VEL);
  });

  test('timed jump cleanly clears the first spike on Sunny Meadow', () => {
    let s: DashGameState = { ...createDashGame(0), status: 'playing' };
    while (s.x < 355 && s.status === 'playing') {
      s = updateDashGame(s, 0.016);
    }
    s = setDashInput(s, true);
    s = updateDashGame(s, 0.016);
    s = setDashInput(s, false);
    while (s.x < 500 && s.status === 'playing') {
      s = updateDashGame(s, 0.016);
    }
    expect(s.status).toBe('playing');
    expect(s.x).toBeGreaterThanOrEqual(500);
  });

  test('running straight into a spike crashes and auto-restarts into Attempt 2', () => {
    let s: DashGameState = { ...createDashGame(0), status: 'playing' };
    while (s.status === 'playing' && s.x < 500) {
      s = updateDashGame(s, 0.02);
    }
    expect(s.status).toBe('crashed');
    for (let i = 0; i < 25; i++) {
      s = updateDashGame(s, 0.03);
    }
    expect(s.status).toBe('playing');
    expect(s.attempt).toBe(2);
    expect(s.x).toBeLessThan(200);
  });

  test('landing on top of a hay block is safe and keeps grounded true', () => {
    let s: DashGameState = {
      ...createDashGame(0),
      status: 'playing',
      props: [{ id: 1, kind: 'block', x: 100, y: 0, w: 120, h: 36 }],
      x: 110,
      y: 42,
      vy: -80,
      grounded: false,
    };
    for (let i = 0; i < 6; i++) {
      s = updateDashGame(s, 0.016);
    }
    expect(s.status).toBe('playing');
    expect(s.y).toBe(36);
    expect(s.grounded).toBe(true);
  });

  test('yellow spring pad launches higher than normal jump', () => {
    let s: DashGameState = {
      ...createDashGame(0),
      status: 'playing',
      props: [{ id: 1, kind: 'pad', x: 70, y: 0, w: 32, h: 10 }],
    };
    s = updateDashGame(s, 0.016);
    expect(s.vy).toBeGreaterThan(JUMP_VEL);
    expect(s.vy).toBeLessThanOrEqual(PAD_VEL);
  });

  test('ship portal switches mode to ship and holding flies upward', () => {
    let s: DashGameState = {
      ...createDashGame(0),
      status: 'playing',
      holding: true,
      props: [{ id: 1, kind: 'portal_ship', x: 70, y: 0, w: 34, h: 140 }],
    };
    for (let i = 0; i < 10; i++) {
      s = updateDashGame(s, 0.02);
    }
    expect(s.mode).toBe('ship');
    expect(s.y).toBeGreaterThan(20);
  });

  test('crossing stage finish line reaches 100% complete', () => {
    let s: DashGameState = {
      ...createDashGame(1),
      status: 'playing',
      props: [],
      x: DASH_STAGES[1]!.length - 5,
    };
    s = updateDashGame(s, 0.03);
    expect(s.status).toBe('complete');
    expect(s.progress).toBe(100);
    expect(s.bestProgress[1]).toBe(100);
  });
});

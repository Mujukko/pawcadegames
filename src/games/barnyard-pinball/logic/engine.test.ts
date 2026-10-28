import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  startPlungerCharge,
  releasePlunger,
  setFlipper,
  restartGame,
  updateEngine,
  PLUNGER_REST_X,
  PLUNGER_REST_Y,
} from './engine';

describe('Barnyard Pinball Core Physics Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialState(5000);
    expect(state.status).toBe('ready');
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(5000);
    expect(state.multiplier).toBe(1);
    expect(state.ballsRemaining).toBe(3);
    expect(state.balls.length).toBe(1);
    expect(state.balls[0].x).toBe(PLUNGER_REST_X);
    expect(state.balls[0].y).toBe(PLUNGER_REST_Y);
    expect(state.bumpers.length).toBe(3);
    expect(state.rolloverLanes.length).toBe(4);
    expect(state.leftFlipper.isEngaged).toBe(false);
    expect(state.rightFlipper.isEngaged).toBe(false);
  });

  it('charges and releases plunger with upward launch velocity', () => {
    let state = createInitialState();
    state = startPlungerCharge(state);
    expect(state.isPlungerCharging).toBe(true);

    // Advance frames to build charge
    let current = state;
    for (let i = 0; i < 15; i++) {
      current = updateEngine(current, 0.03).state;
    }
    expect(current.plungerCharge).toBeGreaterThan(0.5);

    const launchRes = releasePlunger(current);
    expect(launchRes.state.status).toBe('playing');
    expect(launchRes.state.isPlungerCharging).toBe(false);
    expect(launchRes.state.plungerCharge).toBe(0);
    expect(launchRes.state.balls[0].vy).toBeLessThan(-500); // upward launch
    expect(launchRes.event?.type).toBe('ball_launched');
  });

  it('engages flippers and emits clack event', () => {
    const state = createInitialState();
    const res = setFlipper(state, 'left', true);
    expect(res.state.leftFlipper.isEngaged).toBe(true);
    expect(res.state.rightFlipper.isEngaged).toBe(false);
    expect(res.event?.type).toBe('flipper_clack');

    const res2 = setFlipper(res.state, 'left', false);
    expect(res2.state.leftFlipper.isEngaged).toBe(false);
  });

  it('bounces ball off bumper and awards score', () => {
    let state = createInitialState();
    state.status = 'playing';
    // Position ball moving directly toward center milk bumper (x: 200, y: 245, r: 26)
    state.balls = [
      {
        id: 'test-ball',
        x: 200,
        y: 215, // just 4px above bumper radius (26 + 8.5 = 34.5)
        vx: 0,
        vy: 200, // moving downward
        radius: 8.5,
        isActive: true,
        trail: [],
      },
    ];

    const res = updateEngine(state, 0.03);
    const hitEvent = res.events.find((e) => e.type === 'bumper_hit');
    expect(hitEvent).toBeDefined();
    expect(res.state.score).toBeGreaterThan(0);
    expect(res.state.balls[0].vy).toBeLessThan(0); // bounced back upwards
  });

  it('lights rollover lanes and increases multiplier when all F-A-R-M lanes are lit', () => {
    let state = createInitialState();
    state.status = 'playing';
    // Light F, A, R beforehand
    state.rolloverLanes[0].isLit = true;
    state.rolloverLanes[1].isLit = true;
    state.rolloverLanes[2].isLit = true;

    // Position ball rolling through lane M (x: 275, y: 70)
    state.balls = [
      {
        id: 'test-ball',
        x: 275,
        y: 70,
        vx: 0,
        vy: 50,
        radius: 8.5,
        isActive: true,
        trail: [],
      },
    ];

    const res = updateEngine(state, 0.02);
    const rolloverEvent = res.events.find((e) => e.type === 'rollover_lit');
    expect(rolloverEvent).toBeDefined();
    expect(res.state.multiplier).toBe(2); // increased multiplier!
  });

  it('deflects ball off slingshot with kick velocity', () => {
    let state = createInitialState();
    state.status = 'playing';
    // Position ball near left slingshot (x1: 75, y1: 400, x2: 110, y2: 475)
    state.balls = [
      {
        id: 'test-ball',
        x: 90,
        y: 435,
        vx: -60,
        vy: 30,
        radius: 8.5,
        isActive: true,
        trail: [],
      },
    ];

    const res = updateEngine(state, 0.02);
    const slingEvent = res.events.find((e) => e.type === 'slingshot_hit');
    expect(slingEvent).toBeDefined();
    expect(res.state.score).toBeGreaterThan(0);
    expect(res.state.balls[0].vx).toBeGreaterThan(0); // deflected to the right
  });

  it('handles drained ball by decrementing balls and spawning fresh ball in plunger', () => {
    let state = createInitialState();
    state.status = 'playing';
    state.ballsRemaining = 3;
    // Position ball below drain line (y > 590)
    state.balls = [
      {
        id: 'test-ball',
        x: 200,
        y: 595,
        vx: 0,
        vy: 100,
        radius: 8.5,
        isActive: true,
        trail: [],
      },
    ];

    const res = updateEngine(state, 0.02);
    expect(res.state.ballsRemaining).toBe(2);
    expect(res.state.status).toBe('ready');
    expect(res.state.balls[0].x).toBe(PLUNGER_REST_X);
    expect(res.state.balls[0].y).toBe(PLUNGER_REST_Y);
    const drainEvent = res.events.find((e) => e.type === 'ball_drained');
    expect(drainEvent).toBeDefined();
  });

  it('triggers game over when last ball drains', () => {
    let state = createInitialState();
    state.status = 'playing';
    state.ballsRemaining = 1;
    state.balls = [
      {
        id: 'test-ball',
        x: 200,
        y: 595,
        vx: 0,
        vy: 100,
        radius: 8.5,
        isActive: true,
        trail: [],
      },
    ];

    const res = updateEngine(state, 0.02);
    expect(res.state.ballsRemaining).toBe(0);
    expect(res.state.status).toBe('game_over');
    const overEvent = res.events.find((e) => e.type === 'game_over');
    expect(overEvent).toBeDefined();
  });

  it('restarts game while preserving high score', () => {
    let state = createInitialState(12000);
    state.score = 8500;
    state.status = 'game_over';

    const restarted = restartGame(state);
    expect(restarted.status).toBe('ready');
    expect(restarted.score).toBe(0);
    expect(restarted.highScore).toBe(12000);
    expect(restarted.ballsRemaining).toBe(3);
  });
});

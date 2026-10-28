import { describe, expect, it } from 'bun:test';
import {
  ACCELERATION,
  createInitialState,
  MAX_FORWARD_SPEED,
  TRACK_CONFIGS,
  updateEngine,
} from './engine';
import { KartInput } from './types';

const neutralInput: KartInput = { steer: 0, gas: false, reverse: false, drift: false };
const gasInput: KartInput = { steer: 0, gas: true, reverse: false, drift: false };

describe('Barnyard Kart: Tractor Grand Prix Logic Engine', () => {
  it('initializes game state with 4 racers, correct track, and 3-second countdown', () => {
    const state = createInitialState(0);
    expect(state.status).toBe('ready');
    expect(state.countdown).toBe(3.0);
    expect(state.racers.length).toBe(4);
    expect(state.racers[0].id).toBe('player');
    expect(state.racers[0].name).toBe('Sunny Corgi');
    expect(state.racers[0].isAI).toBe(false);
    expect(state.racers[1].isAI).toBe(true);
    expect(state.track.id).toBe('clover-meadow');
    expect(state.totalLaps).toBe(3);
    expect(state.playerLap).toBe(1);
    expect(state.playerRank).toBe(1);
  });

  it('transitions from ready to racing after countdown timer expires', () => {
    let state = createInitialState(0);
    const allEvents = [];
    for (let i = 0; i < 35; i++) {
      state = updateEngine(state, neutralInput, 0.1);
      allEvents.push(...state.events);
    }
    expect(state.status).toBe('racing');
    expect(state.countdown).toBe(0);
    expect(allEvents.some((e) => e.type === 'engine_rev')).toBe(true);
  });

  it('accelerates player kart forward when gas is pressed and clamps to maximum speed', () => {
    let state = createInitialState(0);
    // bypass countdown
    state.status = 'racing';
    state.countdown = 0;

    // Apply gas for 1 second
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, gasInput, 0.1);
    }

    const player = state.racers.find((r) => r.id === 'player')!;
    expect(player.speed).toBeGreaterThan(150);
    expect(player.speed).toBeLessThanOrEqual(MAX_FORWARD_SPEED);
  });

  it('steers kart left and right based on steer input', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    // Build some speed first
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, gasInput, 0.1);
    }
    const initialAngle = state.racers[0].angle;

    // Steer right with gas
    const steerRightInput: KartInput = { steer: 1, gas: true, reverse: false, drift: false };
    for (let i = 0; i < 5; i++) {
      state = updateEngine(state, steerRightInput, 0.1);
    }
    const player = state.racers[0];
    expect(player.angle).not.toBe(initialAngle);
  });

  it('activates drift mode on steer + drift input at speed and charges mini-turbo', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    // Accelerate to speed
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, gasInput, 0.1);
    }

    // Drift right
    const driftInput: KartInput = { steer: 1, gas: true, reverse: false, drift: true };
    const allEvents = [];
    for (let i = 0; i < 8; i++) {
      state = updateEngine(state, driftInput, 0.1);
      allEvents.push(...state.events);
    }

    const player = state.racers[0];
    expect(player.isDrifting).toBe(true);
    expect(player.driftCharge).toBeGreaterThan(0.3);
    expect(allEvents.some((e) => e.type === 'drift_start')).toBe(true);
  });

  it('releases drift with charge to trigger mini-turbo boost', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    // Speed up
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, gasInput, 0.1);
    }

    // Drift for 1 second to accumulate >= 0.5 charge
    const driftInput: KartInput = { steer: 1, gas: true, reverse: false, drift: true };
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, driftInput, 0.1);
    }

    // Release drift
    const allEvents = [];
    state = updateEngine(state, gasInput, 0.1);
    allEvents.push(...state.events);

    const player = state.racers[0];
    expect(player.isDrifting).toBe(false);
    expect(player.turboTimer).toBeGreaterThan(0);
    expect(allEvents.some((e) => e.type === 'drift_boost')).toBe(true);
  });

  it('slows down kart and triggers mud_hit event on mud obstacle collision', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    const mudObs = state.track.obstacles.find((o) => o.type === 'mud')!;
    // Place player right at mud obstacle with forward speed
    state.racers[0].x = mudObs.x;
    state.racers[0].y = mudObs.y;
    state.racers[0].speed = 200;

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.1);
    allEvents.push(...state.events);

    const player = state.racers[0];
    expect(player.mudTimer).toBeGreaterThan(0);
    expect(player.speed).toBeLessThan(150);
    expect(allEvents.some((e) => e.type === 'mud_hit')).toBe(true);
  });

  it('induces spinout on slick obstacle collision', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    const slickObs = state.track.obstacles.find((o) => o.type === 'slick')!;
    state.racers[0].x = slickObs.x;
    state.racers[0].y = slickObs.y;
    state.racers[0].speed = 180;

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.1);
    allEvents.push(...state.events);

    const player = state.racers[0];
    expect(player.spinTimer).toBeGreaterThan(0);
    expect(allEvents.some((e) => e.type === 'slick_spin')).toBe(true);
  });

  it('collects turbo corn pickup, triggers event, and sets turboTimer', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    const pickup = state.track.pickups.find((p) => p.type === 'turbo_corn')!;
    state.racers[0].x = pickup.x;
    state.racers[0].y = pickup.y;

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.1);
    allEvents.push(...state.events);

    const player = state.racers[0];
    expect(player.turboTimer).toBeGreaterThan(1.5);
    expect(allEvents.some((e) => e.type === 'turbo_collect')).toBe(true);
  });

  it('detects checkpoint crossing and advances currentCheckpoint index', () => {
    let state = createInitialState(0);
    state.status = 'racing';
    state.countdown = 0;

    // Place player at checkpoint 0
    const wp0 = state.track.waypoints[0];
    state.racers[0].x = wp0.x;
    state.racers[0].y = wp0.y;

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.1);
    allEvents.push(...state.events);

    const player = state.racers[0];
    expect(player.currentCheckpoint).toBe(1);
    expect(allEvents.some((e) => e.type === 'checkpoint_pass')).toBe(true);
  });

  it('supports 4 unique handcrafted championship circuits with valid waypoints and obstacles', () => {
    expect(TRACK_CONFIGS.length).toBe(4);
    for (let i = 0; i < TRACK_CONFIGS.length; i++) {
      const state = createInitialState(i);
      expect(state.track.waypoints.length).toBeGreaterThanOrEqual(8);
      expect(state.track.obstacles.length).toBeGreaterThanOrEqual(3);
      expect(state.track.pickups.length).toBeGreaterThanOrEqual(3);
      expect(state.track.startPositions.length).toBe(4);
    }
  });
});

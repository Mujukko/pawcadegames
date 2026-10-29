import { describe, expect, it } from 'bun:test';
import {
  advanceTrack,
  createInitialState,
  jumpDodo,
  restartTrack,
  startSkating,
  steerDodo,
  updateGame,
} from './engine';

describe('Frozen Pasture Dash: Ice Dodo Logic Engine', () => {
  it('initializes game state with valid defaults, track 1, and obstacles', () => {
    const state = createInitialState(1);
    expect(state.status).toBe('ready');
    expect(state.trackIndex).toBe(1);
    expect(state.distance).toBe(0);
    expect(state.targetDistance).toBe(500);
    expect(state.speed).toBe(22);
    expect(state.dodo.x).toBe(0);
    expect(state.obstacles.length).toBeGreaterThan(10);
    expect(state.pickups.length).toBeGreaterThan(5);
  });

  it('transitions from ready to skating on startSkating', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    expect(state.status).toBe('skating');
    expect(state.events.some((e) => e.type === 'start')).toBe(true);
  });

  it('steers dodo and clamps lateral target within track boundaries', () => {
    let state = createInitialState(1);
    state = steerDodo(state, -1.5);
    expect(state.dodo.targetX).toBe(-0.85);

    state = steerDodo(state, 1.5);
    expect(state.dodo.targetX).toBe(0.85);

    state = steerDodo(state, 0.4);
    expect(state.dodo.targetX).toBe(0.4);
  });

  it('advances forward and updates lateral position towards targetX during update', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    state = steerDodo(state, 0.5);

    state = updateGame(state, 0.033);
    expect(state.dodo.z).toBeGreaterThan(0);
    expect(state.dodo.x).toBeGreaterThan(0);
    expect(state.score).toBeGreaterThan(0);
  });

  it('handles jumping and airborne gravity landing', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    state = jumpDodo(state);

    expect(state.dodo.isAirborne).toBe(true);
    expect(state.dodo.vy).toBeGreaterThan(0);

    // Update through airborne ascent
    state = updateGame(state, 0.1);
    expect(state.dodo.y).toBeGreaterThan(0);

    // Update through descent and landing
    let landed = false;
    for (let i = 0; i < 30; i++) {
      state = updateGame(state, 0.033);
      if (state.events.some((e) => e.type === 'land')) {
        landed = true;
      }
    }
    expect(state.dodo.y).toBe(0);
    expect(state.dodo.isAirborne).toBe(false);
    expect(landed).toBe(true);
  });

  it('collects speed boost pads and accelerates dodo', () => {
    let state = createInitialState(1);
    state = startSkating(state);

    // Place a boost pad right in front of dodo
    state.pickups = [
      { id: 'p1', z: 2, x: 0, type: 'boost_pad' },
    ];

    state = updateGame(state, 0.1);
    expect(state.events.some((e) => e.type === 'boost')).toBe(true);
    expect(state.speed).toBeGreaterThan(state.baseSpeed);
    expect(state.pickups[0].collected).toBe(true);
  });

  it('collects frost berries, awards points, and grants shield at 5 berries', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    state.frostBerries = 4;

    state.pickups = [
      { id: 'b1', z: 2, x: 0, type: 'frost_berry' },
    ];

    state = updateGame(state, 0.1);
    expect(state.frostBerries).toBe(5);
    expect(state.dodo.hasShield).toBe(true);
    expect(state.events.some((e) => e.type === 'berry_pickup')).toBe(true);
  });

  it('triggers crash when colliding with an obstacle without a shield', () => {
    let state = createInitialState(1);
    state = startSkating(state);

    state.obstacles = [
      { id: 'o1', z: 2, x: 0, width: 0.25, type: 'ice_cone' },
    ];

    state = updateGame(state, 0.1);
    expect(state.status).toBe('crashed');
    expect(state.events.some((e) => e.type === 'crash')).toBe(true);
  });

  it('absorbs impact with shield and avoids crashing', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    state.dodo.hasShield = true;

    state.obstacles = [
      { id: 'o1', z: 2, x: 0, width: 0.25, type: 'ice_cone' },
    ];

    state = updateGame(state, 0.1);
    expect(state.status).toBe('skating');
    expect(state.dodo.hasShield).toBe(false);
    expect(state.events.some((e) => e.type === 'shield_lost')).toBe(true);
  });

  it('clears crevasse when jumping over it', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    state.dodo.y = 1.0; // airborne high above crevasse

    state.obstacles = [
      { id: 'c1', z: 2, x: 0, width: 0.5, type: 'crevasse' },
    ];

    state = updateGame(state, 0.1);
    expect(state.status).toBe('skating'); // Did not crash
  });

  it('triggers victory upon reaching target distance', () => {
    let state = createInitialState(1);
    state = startSkating(state);
    state.dodo.z = 499.5;
    state.obstacles = []; // isolate from random obstacles near finish line

    state = updateGame(state, 0.05);
    expect(state.status).toBe('victory');
    expect(state.events.some((e) => e.type === 'track_clear')).toBe(true);
  });

  it('advances to track 2 on advanceTrack', () => {
    let state = createInitialState(1);
    state = advanceTrack(state);
    expect(state.trackIndex).toBe(2);
    expect(state.targetDistance).toBe(750);
    expect(state.status).toBe('ready');
  });
});

import { describe, it, expect } from 'bun:test';
import {
  createFrogGame,
  hopFrog,
  flickTongue,
  updateFrogGame,
} from './engine';

describe('Frog Games: Barnyard Pond Hop Logic Engine', () => {
  it('initializes game state with frog on bank, lily pads, insects, and 3 lives', () => {
    const state = createFrogGame(0);
    expect(state.player.x).toBe(400);
    expect(state.player.y).toBe(540);
    expect(state.player.lives).toBe(3);
    expect(state.pads.length).toBeGreaterThan(20);
    expect(state.insects.length).toBeGreaterThan(5);
    expect(state.status).toBe('playing');
  });

  it('triggers hop upward and executes jump progress arc', () => {
    let state = createFrogGame(0);
    state = hopFrog(state, 'up');

    expect(state.player.isJumping).toBe(true);
    expect(state.player.targetY).toBeLessThan(540);
    expect(state.events.some((e) => e.type === 'frog_hop')).toBe(true);

    // Advance halfway through jump
    state = updateFrogGame(state, 0.12);
    expect(state.player.jumpHeight).toBeGreaterThan(0);
    expect(state.player.jumpProgress).toBeGreaterThan(0);
  });

  it('lands on valid lily pad, snaps to pad, and awards forward lane score', () => {
    let state = createFrogGame(0);
    const targetY = 540 - state.zone.laneSpacing;

    // Place a lily pad directly at landing position
    state.pads = [
      {
        id: 'test-pad',
        lane: 1,
        x: 400,
        y: targetY,
        radius: 30,
        type: 'standard',
        vx: 20,
        sinkTimer: 2,
        isSunk: false,
        hasLanded: false,
      },
    ];

    state = hopFrog(state, 'up');

    // Complete jump
    for (let i = 0; i < 15; i++) {
      state = updateFrogGame(state, 0.03);
      if (!state.player.isJumping) break;
    }

    expect(state.player.isJumping).toBe(false);
    expect(state.player.currentPadId).toBe('test-pad');
    expect(state.score).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'land_pad')).toBe(true);
  });

  it('deducts a life and respawns at bank when jumping into open water', () => {
    let state = createFrogGame(0);
    state.pads = []; // empty water

    state = hopFrog(state, 'up');

    for (let i = 0; i < 15; i++) {
      state = updateFrogGame(state, 0.03);
      if (!state.player.isJumping) break;
    }

    expect(state.player.lives).toBe(2);
    expect(state.player.y).toBe(540); // respawned on starting bank
    expect(state.events.some((e) => e.type === 'splash_water')).toBe(true);
  });

  it('flicks sticky tongue to catch nearby insect and adds bonus points', () => {
    let state = createFrogGame(0);
    state.insects = [
      {
        id: 'bug-1',
        x: state.player.x + 30,
        y: state.player.y - 30,
        type: 'fly',
        points: 100,
        collected: false,
      },
    ];

    state = flickTongue(state);

    expect(state.player.tongueActive).toBe(true);
    expect(state.insects[0].collected).toBe(true);
    expect(state.score).toBe(100);
    expect(state.fliesEaten).toBe(1);
    expect(state.events.some((e) => e.type === 'catch_fly')).toBe(true);
  });

  it('triggers victory crossing when reaching the opposite bank', () => {
    let state = createFrogGame(0);
    state.player.y = 80;
    state.zone.laneSpacing = 40;

    state = hopFrog(state, 'up'); // targetY = 80 - 40 = 40 <= 70

    for (let i = 0; i < 15; i++) {
      state = updateFrogGame(state, 0.03);
      if (state.status === 'won') break;
    }

    expect(state.status).toBe('won');
    expect(state.score).toBeGreaterThanOrEqual(1000);
    expect(state.events.some((e) => e.type === 'victory_crossing')).toBe(true);
  });
});

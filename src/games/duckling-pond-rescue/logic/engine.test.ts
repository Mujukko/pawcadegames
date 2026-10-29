import { describe, it, expect } from 'bun:test';
import {
  initRescueGame,
  stepRescueGame,
  calculateRescueStars,
  WAVE_TARGETS,
} from './engine';
import { PondInput } from './types';

const IDLE_INPUT: PondInput = {};

describe('Ducklings.io: Duckling Pond Rescue Logic Engine', () => {
  it('initializes game with valid defaults, ready status, and ducklings', () => {
    const state = initRescueGame(1);
    expect(state.status).toBe('ready');
    expect(state.wave).toBe(1);
    expect(state.ducksInLine).toBe(0);
    expect(state.ducklings.length).toBe(8);
    expect(state.nest.totalRescued).toBe(0);
  });

  it('transitions from ready to playing on input', () => {
    const state = initRescueGame(1);
    const input: PondInput = { moveUp: true };
    const next = stepRescueGame(state, input, 0.016);
    expect(next.status).toBe('playing');
    expect(next.mama.y).toBeLessThan(state.mama.y);
  });

  it('moves Mama Duck toward pointer target coordinates', () => {
    const state = initRescueGame(1);
    state.status = 'playing';

    const input: PondInput = { targetX: state.mama.x + 100, targetY: state.mama.y };
    const next = stepRescueGame(state, input, 0.1);
    expect(next.mama.x).toBeGreaterThan(state.mama.x);
  });

  it('picks up lost ducklings and adds them to the follow line', () => {
    const state = initRescueGame(1);
    state.status = 'playing';
    const duckling = state.ducklings[0];

    // Position Mama Duck right next to duckling
    state.mama.x = duckling.x;
    state.mama.y = duckling.y;

    const next = stepRescueGame(state, IDLE_INPUT, 0.016);
    expect(next.ducksInLine).toBe(1);
    expect(next.ducklings.find(d => d.id === duckling.id)!.isFollowing).toBe(true);
    expect(next.score).toBeGreaterThan(0);
  });

  it('deposits following ducklings into reeds nest, awards bonus, and upgrades nest level', () => {
    const state = initRescueGame(1);
    state.status = 'playing';
    // Make 2 ducklings follow
    state.ducksInLine = 2;
    state.ducklings[0].isFollowing = true;
    state.ducklings[0].followIndex = 0;
    state.ducklings[1].isFollowing = true;
    state.ducklings[1].followIndex = 1;

    // Swim Mama into nest
    state.mama.x = state.nest.x;
    state.mama.y = state.nest.y;

    const next = stepRescueGame(state, IDLE_INPUT, 0.016);
    expect(next.ducksInLine).toBe(0);
    expect(next.nest.totalRescued).toBe(2);
    expect(next.score).toBeGreaterThan(200);
  });

  it('triggers game over when rowboat hits Mama Duck', () => {
    const state = initRescueGame(1);
    state.status = 'playing';
    const boat = state.boats[0];

    // Position Mama Duck right in boat path
    state.mama.x = boat.x + 20;
    state.mama.y = boat.y + 10;

    const next = stepRescueGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('game_over');
  });

  it('breaks following duckling line when rowboat hits trailing duckling', () => {
    const state = initRescueGame(1);
    state.status = 'playing';
    state.ducksInLine = 3;
    state.ducklings[0].isFollowing = true;
    state.ducklings[0].followIndex = 0;
    state.ducklings[1].isFollowing = true;
    state.ducklings[1].followIndex = 1;
    state.ducklings[2].isFollowing = true;
    state.ducklings[2].followIndex = 2;

    const boat = state.boats[0];
    // Position duckling 1 inside boat, keep Mama safe far away
    state.mama.x = 100;
    state.mama.y = 500;
    state.ducklings[1].x = boat.x + 10;
    state.ducklings[1].y = boat.y + 10;

    const next = stepRescueGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('playing'); // Mama is still alive!
    expect(next.ducksInLine).toBe(1); // Line severed at index 1, only index 0 remains
  });

  it('unlocks flower hat when rescuing 8 ducklings', () => {
    const state = initRescueGame(1);
    state.status = 'playing';
    state.ducksInLine = 8;
    for (let i = 0; i < 8; i++) {
      state.ducklings[i].isFollowing = true;
      state.ducklings[i].followIndex = i;
    }

    state.mama.x = state.nest.x;
    state.mama.y = state.nest.y;

    const next = stepRescueGame(state, IDLE_INPUT, 0.016);
    expect(next.unlockedHats.includes('flower')).toBe(true);
    expect(next.mama.activeHat).toBe('flower');
  });

  it('triggers victory when completing wave 3 quota', () => {
    const state = initRescueGame(3);
    state.status = 'playing';
    state.nest.totalRescued = WAVE_TARGETS[2] - 2; // Need 2 more
    state.ducksInLine = 2;
    state.ducklings[0].isFollowing = true;
    state.ducklings[0].followIndex = 0;
    state.ducklings[1].isFollowing = true;
    state.ducklings[1].followIndex = 1;

    state.mama.x = state.nest.x;
    state.mama.y = state.nest.y;

    const next = stepRescueGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('victory');
  });

  it('calculates rescue stars accurately', () => {
    expect(calculateRescueStars(28, 3)).toBe(3);
    expect(calculateRescueStars(18, 2)).toBe(2);
    expect(calculateRescueStars(8, 1)).toBe(1);
  });
});

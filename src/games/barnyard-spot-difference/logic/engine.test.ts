import { describe, expect, it } from 'bun:test';
import {
  advanceLevel,
  clickDifference,
  createInitialState,
  restartLevel,
  updateGame,
  useHint,
} from './engine';

describe('Barnyard Spot the Difference: Farm Detective Logic Engine', () => {
  it('initializes level 1 with 5 differences, 3 lives, 3 hints, and 90s timer', () => {
    const state = createInitialState(1);
    expect(state.level).toBe(1);
    expect(state.status).toBe('playing');
    expect(state.lives).toBe(3);
    expect(state.hints).toBe(3);
    expect(state.timeRemaining).toBe(90);
    expect(state.foundIds.length).toBe(0);
    expect(state.scene.differences.length).toBe(5);
  });

  it('detects a correct click on a difference point, marks it found, and awards score', () => {
    let state = createInitialState(1);
    const targetDiff = state.scene.differences[0]; // (0.50, 0.16)

    state = clickDifference(state, targetDiff.x, targetDiff.y);
    expect(state.foundIds).toContain(targetDiff.id);
    expect(state.score).toBeGreaterThan(250);
    expect(state.events.some((e) => e.type === 'found')).toBe(true);
  });

  it('tolerates small clicking offsets within difference radius', () => {
    let state = createInitialState(1);
    const targetDiff = state.scene.differences[0]; // (0.50, 0.16)

    // Click 0.04 away (radius is 0.08)
    state = clickDifference(state, targetDiff.x + 0.04, targetDiff.y - 0.03);
    expect(state.foundIds).toContain(targetDiff.id);
  });

  it('penalizes a misclick by deducting 1 life', () => {
    let state = createInitialState(1);
    // Click empty sky far from differences
    state = clickDifference(state, 0.05, 0.05);

    expect(state.lives).toBe(2);
    expect(state.foundIds.length).toBe(0);
    expect(state.events.some((e) => e.type === 'miss')).toBe(true);
  });

  it('triggers game over when all 3 lives are lost from misclicks', () => {
    let state = createInitialState(1);
    state = clickDifference(state, 0.05, 0.05);
    state = clickDifference(state, 0.05, 0.05);
    state = clickDifference(state, 0.05, 0.05);

    expect(state.lives).toBe(0);
    expect(state.status).toBe('game_over');
    expect(state.events.some((e) => e.type === 'game_over' && e.reason === 'out_of_lives')).toBe(true);
  });

  it('triggers game over when level timer expires', () => {
    let state = createInitialState(1);
    state.timeRemaining = 0.02;

    state = updateGame(state, 0.05);
    expect(state.status).toBe('game_over');
    expect(state.timeRemaining).toBe(0);
    expect(state.events.some((e) => e.type === 'game_over' && e.reason === 'out_of_time')).toBe(true);
  });

  it('uses a hint to reveal an unspotted difference and decrements hint counter', () => {
    let state = createInitialState(1);
    state = useHint(state);

    expect(state.hints).toBe(2);
    expect(state.activeHintId).toBe(state.scene.differences[0].id);
    expect(state.events.some((e) => e.type === 'hint_used')).toBe(true);
  });

  it('clears round when all 5 differences are spotted on level 1', () => {
    let state = createInitialState(1);
    for (const diff of state.scene.differences) {
      state = clickDifference(state, diff.x, diff.y);
    }

    expect(state.foundIds.length).toBe(5);
    expect(state.status).toBe('round_clear');
    expect(state.events.some((e) => e.type === 'round_clear')).toBe(true);
  });

  it('advances to level 2 and loads the new scene', () => {
    let state = createInitialState(1);
    state = advanceLevel(state);

    expect(state.level).toBe(2);
    expect(state.status).toBe('playing');
    expect(state.foundIds.length).toBe(0);
    expect(state.scene.name).toBe('Apple Orchard Harvest');
  });

  it('triggers victory when completing all differences on level 3', () => {
    let state = createInitialState(3);
    for (const diff of state.scene.differences) {
      state = clickDifference(state, diff.x, diff.y);
    }

    expect(state.status).toBe('victory');
    expect(state.events.some((e) => e.type === 'victory')).toBe(true);
  });
});

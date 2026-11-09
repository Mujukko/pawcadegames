import { describe, expect, test } from 'bun:test';
import {
  MIN_BOOST_MASS,
  WORLD_RADIUS,
  createSlitherGame,
  nudgeSlitherAngle,
  setSlitherInput,
  updateSlitherGame,
  wormSegmentCount,
} from './engine';

describe('Slither Pasture.io Engine', () => {
  test('initializes player worm, 7 AI worms, and glowing orbs', () => {
    const state = createSlitherGame(120);
    expect(state.status).toBe('ready');
    expect(state.worms.length).toBe(8);
    expect(state.orbs.length).toBeGreaterThanOrEqual(130);
    expect(state.bestLength).toBe(120);
    expect(state.worms[0]!.segments.length).toBe(wormSegmentCount(40));
  });

  test('steering starts game from ready state', () => {
    const s0 = createSlitherGame();
    const s1 = setSlitherInput(s0, Math.PI / 2, false);
    expect(s1.status).toBe('playing');
    expect(s1.worms[0]!.angle).toBeCloseTo(Math.PI / 2);
  });

  test('eating an orb grows worm mass and updates bestLength', () => {
    let state = setSlitherInput(createSlitherGame(40), 0);
    const head = state.worms[0]!.segments[0]!;
    state.orbs.push({
      id: 99999,
      x: head.x + 4,
      y: head.y,
      value: 25,
      radius: 8,
      color: '#fbbf24',
      jumbo: true,
    });
    state = updateSlitherGame(state, 0.04);
    expect(state.worms[0]!.mass).toBeGreaterThanOrEqual(65);
    expect(state.bestLength).toBeGreaterThanOrEqual(65);
  });

  test('boosting burns mass down to MIN_BOOST_MASS and sheds orbs', () => {
    let state = setSlitherInput(createSlitherGame(), 0, true);
    state.worms[0]!.mass = 80;
    for (let i = 0; i < 15; i++) {
      state = updateSlitherGame(state, 0.04);
    }
    expect(state.worms[0]!.mass).toBeLessThan(80);
    expect(state.worms[0]!.mass).toBeGreaterThanOrEqual(MIN_BOOST_MASS);
  });

  test('crossing OWN body does NOT kill player worm (authentic slither rule)', () => {
    let state = setSlitherInput(createSlitherGame(), 0);
    state.worms[0]!.mass = 150;
    // Place tail segments directly on head path
    state.worms[0]!.segments.push({ x: 5, y: 0 }, { x: 6, y: 0 });
    state = updateSlitherGame(state, 0.04);
    expect(state.status).toBe('playing');
  });

  test('crashing into rival worm body ends game with worm reason', () => {
    let state = setSlitherInput(createSlitherGame(), 0);
    // Position rival worm #1 vertically right across player's path at x = 8
    state.worms[1]!.angle = Math.PI / 2;
    state.worms[1]!.targetAngle = Math.PI / 2;
    state.worms[1]!.segments = state.worms[1]!.segments.map((_, idx) => ({
      x: 8,
      y: 20 - idx * 10,
    }));
    state = updateSlitherGame(state, 0.04);
    expect(state.status).toBe('game_over');
    expect(state.deathReason).toBe('worm');
  });

  test('crossing circular orchard fence ends game with wall reason', () => {
    let state = setSlitherInput(createSlitherGame(), 0);
    state.worms[0]!.segments[0] = { x: WORLD_RADIUS + 10, y: 0 };
    state = updateSlitherGame(state, 0.02);
    expect(state.status).toBe('game_over');
    expect(state.deathReason).toBe('wall');
  });

  test('nudgeSlitherAngle rotates targetAngle cleanly', () => {
    const s0 = setSlitherInput(createSlitherGame(), 0);
    const s1 = nudgeSlitherAngle(s0, 0.5);
    expect(s1.worms[0]!.targetAngle).toBeCloseTo(0.5);
  });
});

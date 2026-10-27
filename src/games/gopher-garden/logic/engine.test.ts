import { describe, expect, it } from 'bun:test';
import {
  createInitialGardenState,
  updateGardenState,
  tapGardenMound,
  GAME_DURATION_SECONDS,
} from './engine';

describe('Gopher Garden Engine Unit Tests', () => {
  it('initializes with 9 mounds and 60 seconds duration', () => {
    const state = createInitialGardenState(1200);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(1200);
    expect(state.timeLeft).toBe(GAME_DURATION_SECONDS);
    expect(state.mounds.length).toBe(9);
    expect(state.isFrenzy).toBe(false);
    expect(state.gameOver).toBe(false);
  });

  it('whacking a normal gopher scores points and increases combo', () => {
    let state = createInitialGardenState();
    // Force mound 0 to be active normal gopher
    state.mounds[0].state = 'up';
    state.mounds[0].content = 'normal';

    const result = tapGardenMound(state, 0);
    expect(result.hit).toBe(true);
    expect(result.pointsEarned).toBe(100);
    expect(result.state.score).toBe(100);
    expect(result.state.combo).toBe(1);
    expect(result.state.mounds[0].state).toBe('hit');
  });

  it('whacking a golden gopher activates harvest frenzy and double points', () => {
    let state = createInitialGardenState();
    state.mounds[2].state = 'up';
    state.mounds[2].content = 'golden';

    const result = tapGardenMound(state, 2);
    expect(result.hit).toBe(true);
    expect(result.pointsEarned).toBe(300);
    expect(result.state.isFrenzy).toBe(true);
    expect(result.state.goldenWhacked).toBe(1);
    expect(result.state.frenzyTimeLeft).toBeGreaterThan(0);
  });

  it('whacking a thistle penalizes score and resets combo', () => {
    let state = createInitialGardenState();
    state.score = 500;
    state.combo = 5;
    state.mounds[1].state = 'up';
    state.mounds[1].content = 'thistle';

    const result = tapGardenMound(state, 1);
    expect(result.hit).toBe(false);
    expect(result.pointsEarned).toBe(-150);
    expect(result.state.score).toBe(350);
    expect(result.state.combo).toBe(0);
  });

  it('tapping empty dirt resets combo without penalty points', () => {
    let state = createInitialGardenState();
    state.score = 300;
    state.combo = 4;
    state.mounds[0].state = 'empty';

    const result = tapGardenMound(state, 0);
    expect(result.hit).toBe(false);
    expect(result.pointsEarned).toBe(0);
    expect(result.state.score).toBe(300);
    expect(result.state.combo).toBe(0);
  });

  it('triggers game over when timer reaches 0', () => {
    let state = createInitialGardenState();
    state.timeLeft = 0.5;

    state = updateGardenState(state, 1.0);
    expect(state.timeLeft).toBe(0);
    expect(state.gameOver).toBe(true);
  });
});

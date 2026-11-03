import { describe, it, expect } from 'bun:test';
import {
  createHelixGame,
  rotateTower,
  updateHelixGame,
  normalizeAngle,
} from './engine';

describe('Helix Silo Drop Core Logic Engine', () => {
  it('initializes game with valid defaults, 15 floors, and ready status', () => {
    const state = createHelixGame(15);
    expect(state.status).toBe('ready');
    expect(state.totalFloors).toBe(15);
    expect(state.floors.length).toBe(15);
    expect(state.ball.y).toBe(40);
    expect(state.ball.comboStreak).toBe(0);
    expect(state.floors[14].sectors[0].type).toBe('safe'); // Victory pad
  });

  it('normalizes angles within 0 to 2*PI', () => {
    expect(normalizeAngle(0)).toBe(0);
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 4);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2, 4);
  });

  it('rotates tower and switches status to playing', () => {
    let state = createHelixGame(10);
    state = rotateTower(state, 0.45);
    expect(state.status).toBe('playing');
    expect(state.targetTowerAngle).toBe(0.45);
  });

  it('bounces ball when landing on a safe sector', () => {
    const state = createHelixGame(10);
    state.status = 'playing';
    state.floors[0].y = 100;
    state.floors[0].sectors = [{ startAngle: 0, endAngle: Math.PI * 2, type: 'safe' }];

    state.ball.y = 80;
    state.ball.vy = 200;

    const next = updateHelixGame(state, 0.05); // ball lands on y = 88
    expect(next.ball.vy).toBeLessThan(0); // bounced upward
    expect(next.events.some((e) => e.type === 'bounce')).toBe(true);
  });

  it('drops through gap and increases combo streak', () => {
    const state = createHelixGame(10);
    state.status = 'playing';
    state.floors[0].y = 100;
    // Set gap directly at relative ball view angle
    state.floors[0].sectors = [{ startAngle: 0, endAngle: Math.PI * 2, type: 'gap' }];

    state.ball.y = 80;
    state.ball.vy = 200;

    const next = updateHelixGame(state, 0.05);
    expect(next.ball.comboStreak).toBe(1);
    expect(next.score).toBeGreaterThan(0);
    expect(next.events.some((e) => e.type === 'pass_floor')).toBe(true);
  });

  it('triggers game over when landing on a hazard without super smash', () => {
    const state = createHelixGame(10);
    state.status = 'playing';
    state.floors[0].y = 100;
    state.floors[0].sectors = [{ startAngle: 0, endAngle: Math.PI * 2, type: 'hazard' }];
    state.ball.y = 80;
    state.ball.vy = 200;
    state.ball.isSuperSmash = false;

    const next = updateHelixGame(state, 0.05);
    expect(next.status).toBe('game_over');
    expect(next.events.some((e) => e.type === 'hit_hazard')).toBe(true);
  });

  it('breaks through hazard when super smash is active', () => {
    const state = createHelixGame(10);
    state.status = 'playing';
    state.floors[0].y = 100;
    state.floors[0].sectors = [{ startAngle: 0, endAngle: Math.PI * 2, type: 'hazard' }];
    state.ball.y = 80;
    state.ball.vy = 200;
    state.ball.isSuperSmash = true;
    state.ball.comboStreak = 3;

    const next = updateHelixGame(state, 0.05);
    expect(next.status).not.toBe('game_over');
    expect(next.floors[0].isBroken).toBe(true);
    expect(next.events.some((e) => e.type === 'smash_floor')).toBe(true);
  });
});

import { describe, expect, it } from 'bun:test';
import {
  createHoleIOGame,
  setHoleVelocity,
  updateHoleIOGame,
} from './engine';

describe('Pasture Hole IO Engine', () => {
  it('initializes hole, objects and 60-second timer', () => {
    const game = createHoleIOGame(500);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.highScore).toBe(500);
    expect(game.timeRemaining).toBe(60);
    expect(game.player.radius).toBe(18);
    expect(game.objects.length).toBeGreaterThan(50);
  });

  it('updates steering and sets playing status', () => {
    const game = createHoleIOGame();
    const updated = setHoleVelocity(game, 1, 0);
    expect(updated.status).toBe('playing');
    expect(updated.player.vx).toBeGreaterThan(0);
  });

  it('swallows smaller tier 1 object and increments score', () => {
    const game = createHoleIOGame();
    game.status = 'playing';
    game.player.x = 200;
    game.player.y = 200;
    game.player.radius = 20;

    game.objects = [
      {
        id: 'apple_1',
        x: 202,
        y: 202,
        radius: 8,
        tier: 1,
        label: 'Apple',
        points: 5,
        eaten: false,
        fallProgress: 0,
      },
    ];

    const next = updateHoleIOGame(game, 0.05);
    expect(next.score).toBe(5);
    expect(next.objects[0].eaten).toBe(true);
    expect(next.events.some((e) => e.type === 'eat')).toBe(true);
  });

  it('cannot swallow object larger than hole radius', () => {
    const game = createHoleIOGame();
    game.status = 'playing';
    game.player.x = 200;
    game.player.y = 200;
    game.player.radius = 20;

    game.objects = [
      {
        id: 'barn_1',
        x: 202,
        y: 202,
        radius: 52, // bigger than hole!
        tier: 5,
        label: 'Barn',
        points: 200,
        eaten: false,
        fallProgress: 0,
      },
    ];

    const next = updateHoleIOGame(game, 0.05);
    expect(next.score).toBe(0);
    expect(next.objects[0].eaten).toBe(false);
  });

  it('hole expands in radius after sufficient growth', () => {
    const game = createHoleIOGame();
    game.status = 'playing';
    game.player.x = 200;
    game.player.y = 200;
    game.player.radius = 18;
    game.player.growthProgress = 35;

    game.objects = [
      {
        id: 'pumpkin_1',
        x: 200,
        y: 200,
        radius: 12,
        tier: 2,
        label: 'Pumpkin',
        points: 15, // reaches 50 total growth
        eaten: false,
        fallProgress: 0,
      },
    ];

    const next = updateHoleIOGame(game, 0.05);
    expect(next.player.radius).toBe(24); // expanded!
    expect(next.events.some((e) => e.type === 'grow')).toBe(true);
  });

  it('triggers time_up when round ends', () => {
    const game = createHoleIOGame();
    game.status = 'playing';
    game.timeRemaining = 0.02;

    const next = updateHoleIOGame(game, 0.05);
    expect(next.status).toBe('time_up');
    expect(next.events.some((e) => e.type === 'time_up')).toBe(true);
  });
});

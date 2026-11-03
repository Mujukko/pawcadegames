import { describe, expect, it } from 'bun:test';
import {
  createDoodleGame,
  moveDoodlePlayer,
  updateDoodleGame,
  WORLD_WIDTH,
  BOUNCE_IMPULSE,
  SPRING_IMPULSE,
} from './engine';

describe('Barnyard Doodle Jump Engine', () => {
  it('creates initial state with player and starter platforms', () => {
    const game = createDoodleGame(150);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.highScore).toBe(150);
    expect(game.player.x).toBe(WORLD_WIDTH * 0.5);
    expect(game.platforms.length).toBeGreaterThan(10);
    expect(game.platforms[0].type).toBe('standard');
  });

  it('updates player horizontal velocity and switches facing direction', () => {
    const game = createDoodleGame();
    const movedLeft = moveDoodlePlayer(game, -1);
    expect(movedLeft.status).toBe('playing');
    expect(movedLeft.player.vx).toBeLessThan(0);
    expect(movedLeft.player.facing).toBe('left');

    const movedRight = moveDoodlePlayer(game, 1);
    expect(movedRight.player.vx).toBeGreaterThan(0);
    expect(movedRight.player.facing).toBe('right');
  });

  it('bounces upward upon landing on a standard platform', () => {
    const game = createDoodleGame();
    game.status = 'playing';
    game.player.x = 100;
    game.player.y = 52;
    game.player.vy = -50;
    game.platforms = [
      {
        id: 'test_plat',
        x: 80,
        y: 50,
        width: 60,
        height: 14,
        type: 'standard',
        vx: 0,
        isBroken: false,
        hasSpring: false,
      },
    ];

    const next = updateDoodleGame(game, 0.05);
    expect(next.player.vy).toBe(BOUNCE_IMPULSE);
    expect(next.events.some((e) => e.type === 'bounce')).toBe(true);
  });

  it('launches extra high with a spring platform', () => {
    const game = createDoodleGame();
    game.status = 'playing';
    game.player.x = 100;
    game.player.y = 52;
    game.player.vy = -50;
    game.platforms = [
      {
        id: 'spring_plat',
        x: 80,
        y: 50,
        width: 60,
        height: 14,
        type: 'spring',
        vx: 0,
        isBroken: false,
        hasSpring: true,
      },
    ];

    const next = updateDoodleGame(game, 0.05);
    expect(next.player.vy).toBe(SPRING_IMPULSE);
    expect(next.events.some((e) => e.type === 'spring')).toBe(true);
  });

  it('breaks fragile platform when stepped on', () => {
    const game = createDoodleGame();
    game.status = 'playing';
    game.player.x = 100;
    game.player.y = 52;
    game.player.vy = -50;
    game.platforms = [
      {
        id: 'fragile_plat',
        x: 80,
        y: 50,
        width: 60,
        height: 14,
        type: 'fragile',
        vx: 0,
        isBroken: false,
        hasSpring: false,
      },
    ];

    const next = updateDoodleGame(game, 0.05);
    expect(next.platforms[0].isBroken).toBe(true);
  });

  it('triggers game over when player falls below screen camera', () => {
    const game = createDoodleGame();
    game.status = 'playing';
    game.cameraY = 500;
    game.player.y = 350; // below cameraY - 80
    game.player.vy = -300;

    const next = updateDoodleGame(game, 0.05);
    expect(next.status).toBe('game_over');
    expect(next.events.some((e) => e.type === 'fall')).toBe(true);
  });
});

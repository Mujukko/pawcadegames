import { describe, expect, it } from 'bun:test';
import {
  createPacChickGame,
  setPacChickDirection,
  updatePacChickGame,
} from './engine';

describe('Barnyard Pac Chick Engine', () => {
  it('initializes grid, player, foxes and dots', () => {
    const game = createPacChickGame(500);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.highScore).toBe(500);
    expect(game.lives).toBe(3);
    expect(game.foxes.length).toBe(4);
    expect(game.dotsRemaining).toBeGreaterThan(50);
  });

  it('updates direction buffer and sets playing status', () => {
    const game = createPacChickGame();
    const updated = setPacChickDirection(game, 'up');
    expect(updated.status).toBe('playing');
    expect(updated.player.nextDir).toBe('up');
  });

  it('eats corn dots and increments score', () => {
    const game = createPacChickGame();
    game.status = 'playing';
    game.player.x = 2;
    game.player.y = 1; // Dot at (2, 1)
    const initialDots = game.dotsRemaining;

    const next = updatePacChickGame(game, 0.05);
    expect(next.score).toBe(10);
    expect(next.dotsRemaining).toBe(initialDots - 1);
    expect(next.events.some((e) => e.type === 'waka')).toBe(true);
  });

  it('eating power sunflower triggers frightened mode for foxes', () => {
    const game = createPacChickGame();
    game.status = 'playing';
    game.player.x = 1;
    game.player.y = 1; // Power pellet at (1, 1)

    const next = updatePacChickGame(game, 0.05);
    expect(next.status).toBe('frightened');
    expect(next.score).toBe(50);
    expect(next.foxes[0].mode).toBe('frightened');
    expect(next.events.some((e) => e.type === 'power')).toBe(true);
  });

  it('eats frightened fox for bonus points', () => {
    const game = createPacChickGame();
    game.status = 'frightened';
    game.player.x = 5;
    game.player.y = 5;
    game.foxes[0].x = 5;
    game.foxes[0].y = 5.2;
    game.foxes[0].mode = 'frightened';
    game.foxes[0].frightenedTimer = 5.0;

    const next = updatePacChickGame(game, 0.02);
    expect(next.score).toBe(200);
    expect(next.foxes[0].x).toBe(9); // Sent back to den
    expect(next.events.some((e) => e.type === 'eat_ghost')).toBe(true);
  });

  it('losing life when caught by chasing fox', () => {
    const game = createPacChickGame();
    game.status = 'playing';
    game.player.x = 5;
    game.player.y = 5;
    game.foxes[0].x = 5;
    game.foxes[0].y = 5.2;
    game.foxes[0].mode = 'chase';

    const next = updatePacChickGame(game, 0.02);
    expect(next.lives).toBe(2);
    expect(next.events.some((e) => e.type === 'die')).toBe(true);
  });
});

import { describe, expect, it } from 'bun:test';
import {
  createColorSwitchGame,
  jumpColorPlayer,
  updateColorSwitchGame,
  JUMP_IMPULSE,
} from './engine';

describe('Barnyard Color Switch Engine', () => {
  it('initializes game state with player, obstacles, switchers and stars', () => {
    const game = createColorSwitchGame(12);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.highScore).toBe(12);
    expect(game.obstacles.length).toBeGreaterThan(5);
    expect(game.switchers.length).toBeGreaterThan(5);
    expect(game.stars.length).toBeGreaterThan(5);
    expect(['gold', 'emerald', 'sky', 'rose']).toContain(game.player.color);
  });

  it('triggers jump and sets playing status', () => {
    const game = createColorSwitchGame();
    const jumped = jumpColorPlayer(game);
    expect(jumped.status).toBe('playing');
    expect(jumped.player.vy).toBe(JUMP_IMPULSE);
    expect(jumped.events.some((e) => e.type === 'jump')).toBe(true);
  });

  it('collects stars and increments score', () => {
    const game = createColorSwitchGame();
    game.status = 'playing';
    game.player.y = 315;
    game.player.vy = 200;
    game.stars[0].y = 320;
    game.stars[0].collected = false;

    const next = updateColorSwitchGame(game, 0.03);
    expect(next.score).toBe(1);
    expect(next.stars[0].collected).toBe(true);
    expect(next.events.some((e) => e.type === 'star')).toBe(true);
  });

  it('switches player color when reaching a color switcher orb', () => {
    const game = createColorSwitchGame();
    game.status = 'playing';
    game.player.color = 'gold';
    game.player.y = 435;
    game.player.vy = 100;
    game.switchers[0].y = 440;
    game.switchers[0].collected = false;

    const next = updateColorSwitchGame(game, 0.05);
    expect(next.switchers[0].collected).toBe(true);
    expect(next.player.color).not.toBe('gold');
    expect(next.events.some((e) => e.type === 'switch')).toBe(true);
  });

  it('causes game over when hitting mismatched obstacle color', () => {
    const game = createColorSwitchGame();
    game.status = 'playing';
    game.player.color = 'rose';
    // Obstacle at y = 300, radius = 70. Bottom is at 230.
    game.player.y = 228;
    game.player.vy = 200;
    // Set circle rotation so that the bottom segment is NOT rose
    game.obstacles[0].y = 300;
    game.obstacles[0].radius = 70;
    game.obstacles[0].type = 'circle';
    game.obstacles[0].rotation = 0; // bottom is 3pi/2 -> segmentIdx = 3 (rose) if rot = 0.
    // Let's set rotation = Math.PI / 2 so bottom maps to segment 2 ('sky')
    game.obstacles[0].rotation = Math.PI / 2;

    const next = updateColorSwitchGame(game, 0.02);
    expect(next.status).toBe('game_over');
    expect(next.events.some((e) => e.type === 'crash')).toBe(true);
  });

  it('ends game when player falls below camera', () => {
    const game = createColorSwitchGame();
    game.status = 'playing';
    game.cameraY = 600;
    game.player.y = 400; // below cameraY - 140
    game.player.vy = -300;

    const next = updateColorSwitchGame(game, 0.05);
    expect(next.status).toBe('game_over');
  });
});

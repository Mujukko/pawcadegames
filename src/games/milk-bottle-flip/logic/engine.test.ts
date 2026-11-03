import { describe, expect, it } from 'bun:test';
import {
  createMilkBottleFlipGame,
  flipMilkBottle,
  updateMilkBottleFlipGame,
} from './engine';

describe('Milk Bottle Flip Engine', () => {
  it('creates initial state with platforms and resting bottle', () => {
    const game = createMilkBottleFlipGame(10);
    expect(game.status).toBe('ready');
    expect(game.score).toBe(0);
    expect(game.highScore).toBe(10);
    expect(game.platforms.length).toBeGreaterThan(5);
    expect(game.bottle.isFlipping).toBe(false);
    expect(game.bottle.angle).toBe(0);
  });

  it('triggers initial flip with upward velocity and spin', () => {
    const game = createMilkBottleFlipGame();
    const flipped = flipMilkBottle(game);
    expect(flipped.status).toBe('flipping');
    expect(flipped.bottle.isFlipping).toBe(true);
    expect(flipped.bottle.canDoubleFlip).toBe(true);
    expect(flipped.bottle.vx).toBeGreaterThan(0);
    expect(flipped.bottle.vy).toBeLessThan(0);
    expect(flipped.bottle.omega).toBeGreaterThan(0);
    expect(flipped.events.some((e) => e.type === 'flip')).toBe(true);
  });

  it('triggers mid-air double flip with boost and extra spin', () => {
    const game = createMilkBottleFlipGame();
    const flipped = flipMilkBottle(game);
    const initialVy = flipped.bottle.vy;
    const initialOmega = flipped.bottle.omega;

    const doubleFlipped = flipMilkBottle(flipped);
    expect(doubleFlipped.bottle.didDoubleFlip).toBe(true);
    expect(doubleFlipped.bottle.canDoubleFlip).toBe(false);
    expect(doubleFlipped.bottle.vy).toBeLessThan(initialVy);
    expect(doubleFlipped.bottle.omega).toBeGreaterThan(initialOmega);
    expect(doubleFlipped.events.some((e) => e.type === 'double_flip')).toBe(true);
  });

  it('lands successfully when upright on target platform', () => {
    const game = createMilkBottleFlipGame();
    const target = game.platforms[1];
    game.status = 'flipping';
    game.bottle.isFlipping = true;
    game.bottle.x = target.x + target.width * 0.5;
    game.bottle.y = target.y;
    game.bottle.vy = 50; // descending
    game.bottle.angle = 0.05; // almost upright

    const next = updateMilkBottleFlipGame(game, 0.02);
    expect(next.status).toBe('landed');
    expect(next.score).toBe(1);
    expect(next.currentPlatformIndex).toBe(1);
    expect(next.bottle.isFlipping).toBe(false);
    expect(next.events.some((e) => e.type === 'land')).toBe(true);
  });

  it('fails with game over when landing tilted', () => {
    const game = createMilkBottleFlipGame();
    const target = game.platforms[1];
    game.status = 'flipping';
    game.bottle.isFlipping = true;
    game.bottle.x = target.x + target.width * 0.5;
    game.bottle.y = target.y;
    game.bottle.vy = 50;
    game.bottle.angle = Math.PI * 0.5; // sideways! 90 degrees

    const next = updateMilkBottleFlipGame(game, 0.02);
    expect(next.status).toBe('game_over');
    expect(next.events.some((e) => e.type === 'fail')).toBe(true);
  });

  it('triggers game over when falling past screen bounds', () => {
    const game = createMilkBottleFlipGame();
    game.status = 'flipping';
    game.bottle.isFlipping = true;
    game.bottle.y = 650;
    game.bottle.vy = 200;

    const next = updateMilkBottleFlipGame(game, 0.02);
    expect(next.status).toBe('game_over');
  });
});

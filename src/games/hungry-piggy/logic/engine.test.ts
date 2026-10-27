import { describe, expect, it } from 'bun:test';
import {
  createInitialPiggyGame,
  ITEM_DEFS,
  TIER_CONFIG,
  updatePiggyPhysics,
  WORLD_HEIGHT,
  WORLD_WIDTH,
  type FoodItem,
} from './engine';

describe('Hungry Piggy Engine', () => {
  it('initializes Piggy at center with Tier 1 and standard stats', () => {
    const game = createInitialPiggyGame(150);
    expect(game.piggy.tier).toBe(1);
    expect(game.piggy.tierTitle).toBe('Little Piglet');
    expect(game.piggy.score).toBe(0);
    expect(game.piggy.highScore).toBe(150);
    expect(game.piggy.x).toBe(WORLD_WIDTH / 2);
    expect(game.piggy.y).toBe(WORLD_HEIGHT / 2);
    expect(game.items.length).toBe(60);
    expect(game.gameOver).toBe(false);
  });

  it('moves piggy towards target coordinates over time', () => {
    const game = createInitialPiggyGame();
    const initialX = game.piggy.x;
    const initialY = game.piggy.y;

    // Target is to the right
    updatePiggyPhysics(game, initialX + 200, initialY, 0.2);

    expect(game.piggy.x).toBeGreaterThan(initialX);
    expect(game.piggy.vx).toBeGreaterThan(0);
  });

  it('clamps piggy within world boundaries', () => {
    const game = createInitialPiggyGame();
    game.piggy.x = 10;
    game.piggy.vx = -500;

    // Try to move far off left boundary
    updatePiggyPhysics(game, -1000, game.piggy.y, 0.5);

    expect(game.piggy.x).toBeGreaterThanOrEqual(game.piggy.radius);
  });

  it('eats Tier 1 items when touching them and earns points', () => {
    const game = createInitialPiggyGame();
    // Place an apple right in front of piggy
    const apple: FoodItem = {
      id: 'test-apple',
      type: 'apple',
      x: game.piggy.x + 5,
      y: game.piggy.y,
      radius: ITEM_DEFS.apple.radius,
      points: ITEM_DEFS.apple.points,
      minTier: ITEM_DEFS.apple.minTier,
    };
    game.items = [apple];

    const result = updatePiggyPhysics(game, game.piggy.x + 10, game.piggy.y, 0.05);

    expect(result.eatEvents.length).toBe(1);
    expect(result.eatEvents[0].item.type).toBe('apple');
    expect(game.piggy.score).toBe(ITEM_DEFS.apple.points);
    expect(game.itemsEatenCount).toBe(1);
  });

  it('cannot eat higher tier items before reaching required tier', () => {
    const game = createInitialPiggyGame();
    // Place a tractor (Tier 4) right on top of piggy
    const tractor: FoodItem = {
      id: 'test-tractor',
      type: 'tractor',
      x: game.piggy.x,
      y: game.piggy.y,
      radius: ITEM_DEFS.tractor.radius,
      points: ITEM_DEFS.tractor.points,
      minTier: 4,
    };
    game.items = [tractor];

    const result = updatePiggyPhysics(game, game.piggy.x, game.piggy.y, 0.05);

    expect(result.eatEvents.length).toBe(0);
    expect(game.piggy.score).toBe(0);
    expect(game.itemsEatenCount).toBe(0);
  });

  it('increments streak and multiplier on rapid eating', () => {
    const game = createInitialPiggyGame();
    game.piggy.tier = 3; // allow eating any medium item

    // Simulate eating 5 items
    for (let i = 0; i < 5; i++) {
      const item: FoodItem = {
        id: `streak-item-${i}`,
        type: 'apple',
        x: game.piggy.x,
        y: game.piggy.y,
        radius: 10,
        points: 10,
        minTier: 1,
      };
      game.items = [item];
      updatePiggyPhysics(game, game.piggy.x, game.piggy.y, 0.01);
    }

    expect(game.piggy.streak).toBe(5);
    expect(game.piggy.multiplier).toBeGreaterThanOrEqual(2);
  });

  it('triggers Tier Up when score reaches tier threshold', () => {
    const game = createInitialPiggyGame();
    expect(game.piggy.tier).toBe(1);

    // Place a big batch of food to cross 120 threshold
    const bigPumpkin: FoodItem = {
      id: 'big-pumpkin',
      type: 'pumpkin',
      x: game.piggy.x,
      y: game.piggy.y,
      radius: 15,
      points: 150, // exceeds 120 threshold
      minTier: 1,
    };
    game.items = [bigPumpkin];

    const result = updatePiggyPhysics(game, game.piggy.x, game.piggy.y, 0.05);

    expect(result.eatEvents[0].tierUp).toBe(true);
    expect(game.piggy.tier).toBe(2);
    expect(game.piggy.tierTitle).toBe(TIER_CONFIG[1].title);
    expect(game.piggy.radius).toBe(TIER_CONFIG[1].radius);
  });

  it('ends game when timer elapses', () => {
    const game = createInitialPiggyGame();
    game.timeLeft = 0.5;

    updatePiggyPhysics(game, null, null, 1.0);

    expect(game.timeLeft).toBe(0);
    expect(game.gameOver).toBe(true);
  });
});

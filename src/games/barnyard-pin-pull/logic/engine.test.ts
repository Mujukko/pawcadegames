import { describe, expect, it } from 'bun:test';
import {
  initPinPullGame,
  pullPin,
  updatePinPullGame,
  advanceToNextPinLevel,
  PIN_LEVELS,
} from './engine';

describe('Barnyard Pin Pull Logic Engine', () => {
  it('initializes Level 1 with pins, barriers, carrots, and puppy', () => {
    const game = initPinPullGame(1);
    expect(game.level).toBe(1);
    expect(game.status).toBe('playing');
    expect(game.pins.length).toBe(1);
    expect(game.pins[0].isPulled).toBe(false);
    expect(game.particles.length).toBeGreaterThanOrEqual(8);
    expect(game.creatures.length).toBe(1);
    expect(game.creatures[0].type).toBe('puppy');
  });

  it('triggers pin pull on command and slides out smoothly', () => {
    let game = initPinPullGame(1);
    const pinId = game.pins[0].id;
    game = pullPin(game, pinId);
    expect(game.pins[0].isPulling).toBe(true);

    // Update simulation
    for (let i = 0; i < 10; i++) {
      game = updatePinPullGame(game, 0.05);
    }
    expect(game.pins[0].pullProgress).toBeGreaterThan(0);
    expect(game.pins[0].isPulled).toBe(true);
  });

  it('holds particles safely while pin is in place', () => {
    let game = initPinPullGame(1);
    const initialY = game.particles[0].y;

    // Simulate several ticks without pulling the pin
    for (let i = 0; i < 10; i++) {
      game = updatePinPullGame(game, 0.03);
    }

    // Particles should not have fallen past the pin (y=235)
    for (const p of game.particles) {
      expect(p.y).toBeLessThanOrEqual(235);
    }
  });

  it('quenches lava into safe stone when contacted by water', () => {
    let game = initPinPullGame(2);
    // Put one water particle directly next to one lava particle
    game.particles = [
      { id: 't-water', type: 'water', x: 200, y: 200, vx: 0, vy: 0, radius: 8 },
      { id: 't-lava', type: 'lava', x: 204, y: 204, vx: 0, vy: 0, radius: 8 },
    ];

    game = updatePinPullGame(game, 0.05);

    // Lava should have solidified into stone
    const stoneParticles = game.particles.filter((p) => p.type === 'stone');
    expect(stoneParticles.length).toBeGreaterThanOrEqual(1);
    expect(game.steamParticles.length).toBeGreaterThanOrEqual(1);
  });

  it('feeds puppy when carrots fall into holding chamber', () => {
    let game = initPinPullGame(1);
    // Position carrots inside puppy holding chamber
    game.particles = [
      { id: 'feed-1', type: 'carrot', x: 210, y: 475, vx: 0, vy: 10, radius: 8 },
      { id: 'feed-2', type: 'carrot', x: 220, y: 475, vx: 0, vy: 10, radius: 8 },
    ];

    game = updatePinPullGame(game, 0.05);

    expect(game.foodCollected).toBe(2);
    expect(game.creatures[0].foodReceived).toBe(2);
  });

  it('triggers game over if lava touches the puppy', () => {
    let game = initPinPullGame(1);
    // Position a burning lava droplet directly at the puppy
    game.particles = [
      { id: 'bad-lava', type: 'lava', x: 220, y: 480, vx: 0, vy: 50, radius: 8 },
    ];

    game = updatePinPullGame(game, 0.05);

    expect(game.status).toBe('lost');
  });

  it('eliminates thieving fox when lava drops into fox pit', () => {
    let game = initPinPullGame(3);
    const initialScore = game.score;

    // Drop lava into fox chamber (x: 120, y: 300)
    game.particles = [
      { id: 'fox-lava', type: 'lava', x: 130, y: 310, vx: 0, vy: 50, radius: 8 },
    ];

    game = updatePinPullGame(game, 0.05);

    const fox = game.creatures.find((c) => c.type === 'thief_fox');
    expect(fox?.isEliminated).toBe(true);
    expect(game.score).toBeGreaterThan(initialScore);
  });

  it('achieves victory when puppy receives required food quota', () => {
    let game = initPinPullGame(1);
    const quota = game.levelConfig.targetFoodCount;

    // Feed puppy exactly quota carrots
    game.particles = Array.from({ length: quota }, (_, i) => ({
      id: `win-c-${i}`,
      type: 'carrot',
      x: 210 + (i % 3) * 5,
      y: 470,
      vx: 0,
      vy: 10,
      radius: 8,
    }));

    game = updatePinPullGame(game, 0.05);

    expect(game.status).toBe('won');
    expect(game.creatures[0].isSatisfied).toBe(true);
  });

  it('advances cleanly through all 5 handcrafted levels', () => {
    let game = initPinPullGame(1);
    expect(game.level).toBe(1);

    game = advanceToNextPinLevel(game);
    expect(game.level).toBe(2);
    expect(game.levelConfig.title).toBe('Steam Quencher');

    game = advanceToNextPinLevel(game);
    expect(game.level).toBe(3);
    expect(game.levelConfig.title).toBe('Fox in the Hayloft');

    game = advanceToNextPinLevel(game);
    expect(game.level).toBe(4);
    expect(game.levelConfig.title).toBe('Treasure Granary');

    game = advanceToNextPinLevel(game);
    expect(game.level).toBe(5);
    expect(game.levelConfig.title).toBe('Barnyard Fortress');
  });
});

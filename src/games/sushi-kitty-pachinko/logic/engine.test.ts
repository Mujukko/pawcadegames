import { describe, expect, it } from 'bun:test';
import {
  advanceLevel,
  calculateKittyRadius,
  createInitialState,
  dropKitty,
  moveDropper,
  restartLevel,
  updateGame,
} from './engine';

describe('Sushi Kitty: Pachinko Feast Logic Engine', () => {
  it('initializes game with valid defaults, aiming status, and baskets', () => {
    const state = createInitialState(1);
    expect(state.level).toBe(1);
    expect(state.status).toBe('aiming');
    expect(state.fullness).toBe(0);
    expect(state.dropsRemaining).toBe(4);
    expect(state.kitty.radius).toBe(15);
    expect(state.baskets.length).toBe(5);
    expect(state.pegs.length).toBeGreaterThan(30);
    expect(state.sushi.length).toBeGreaterThan(10);
  });

  it('clamps dropper position within safe margins', () => {
    let state = createInitialState(1);
    state = moveDropper(state, 10);
    expect(state.dropperX).toBe(30);

    state = moveDropper(state, 500);
    expect(state.dropperX).toBe(370);

    state = moveDropper(state, 200);
    expect(state.dropperX).toBe(200);
    expect(state.kitty.x).toBe(200);
  });

  it('drops kitty and transitions state to falling', () => {
    let state = createInitialState(1);
    state = moveDropper(state, 150);
    state = dropKitty(state);

    expect(state.status).toBe('falling');
    expect(state.kitty.isFalling).toBe(true);
    expect(state.kitty.vy).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'drop')).toBe(true);
  });

  it('applies gravity during update when falling', () => {
    let state = createInitialState(1);
    state = dropKitty(state);
    const initialVy = state.kitty.vy;

    state = updateGame(state, 0.033);
    expect(state.kitty.vy).toBeGreaterThan(initialVy);
    expect(state.kitty.y).toBeGreaterThan(48);
  });

  it('eats sushi and increases belly fullness and cat radius', () => {
    let state = createInitialState(1);
    // Find first sushi item and place falling kitty directly on it
    const targetSushi = state.sushi[0];
    state = dropKitty(state);
    state.kitty.x = targetSushi.x;
    state.kitty.y = targetSushi.y - 2;

    state = updateGame(state, 0.016);

    expect(state.fullness).toBeGreaterThan(0);
    expect(state.score).toBeGreaterThan(0);
    expect(state.kitty.radius).toBeGreaterThan(15);
    expect(state.events.some((e) => e.type === 'sushi_chomp')).toBe(true);
    expect(state.sushi[0].eaten).toBe(true);
  });

  it('calculates dynamic kitty radius accurately based on fullness', () => {
    expect(calculateKittyRadius(0)).toBe(15);
    expect(calculateKittyRadius(50)).toBe(22.5);
    expect(calculateKittyRadius(100)).toBe(30);
  });

  it('bounces kitty off pegs with restitution', () => {
    let state = createInitialState(1);
    const peg = state.pegs[0];
    state = dropKitty(state);
    // Place kitty right above peg moving downwards
    state.kitty.x = peg.x;
    state.kitty.y = peg.y - (state.kitty.radius + peg.radius - 2);
    state.kitty.vy = 100;

    state = updateGame(state, 0.016);
    expect(state.events.some((e) => e.type === 'peg_bounce')).toBe(true);
  });

  it('lands in basket, consumes drop, and awards basket points', () => {
    let state = createInitialState(1);
    state = dropKitty(state);
    // Position kitty just above the center basket (b3: 165 to 235, points 500, multiplier 3)
    state.kitty.x = 200;
    state.kitty.y = 544;
    state.kitty.vy = 80;

    state = updateGame(state, 0.02);

    expect(state.dropsRemaining).toBe(3);
    expect(state.kitty.inBasket).toBe(true);
    expect(state.events.some((e) => e.type === 'basket_land')).toBe(true);
    expect(state.score).toBe(1500); // 500 * 3
  });

  it('clears level when target fullness is reached upon landing', () => {
    let state = createInitialState(1);
    state.fullness = 60; // target is 50 for L1
    state = dropKitty(state);
    state.kitty.x = 200;
    state.kitty.y = 544;
    state.kitty.vy = 50;

    state = updateGame(state, 0.02);
    expect(state.status).toBe('round_end');
    expect(state.events.some((e) => e.type === 'level_clear')).toBe(true);

    // Advance to level 2
    state = advanceLevel(state);
    expect(state.level).toBe(2);
    expect(state.status).toBe('aiming');
    expect(state.fullness).toBe(0);
    expect(state.targetFullness).toBe(65);
  });

  it('triggers game over when drops run out without meeting target fullness', () => {
    let state = createInitialState(1);
    state.dropsRemaining = 1;
    state.fullness = 20; // below 50
    state = dropKitty(state);
    state.kitty.x = 200;
    state.kitty.y = 544;
    state.kitty.vy = 50;

    state = updateGame(state, 0.02);
    expect(state.status).toBe('game_over');
    expect(state.events.some((e) => e.type === 'game_over')).toBe(true);
  });

  it('triggers victory on level 3 completion', () => {
    let state = createInitialState(3);
    state.fullness = 90; // above 80
    state = dropKitty(state);
    state.kitty.x = 200;
    state.kitty.y = 544;
    state.kitty.vy = 50;

    state = updateGame(state, 0.02);
    expect(state.status).toBe('victory');
    expect(state.events.some((e) => e.type === 'victory')).toBe(true);
  });
});

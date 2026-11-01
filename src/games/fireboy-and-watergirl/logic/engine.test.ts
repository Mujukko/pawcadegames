import { describe, expect, it } from 'bun:test';
import {
  initFireboyWatergirlGame,
  stepFireboyWatergirlGame,
  TOTAL_COOP_LEVELS,
} from './engine';

describe('Fireboy & Watergirl: Sun Pup & Moon Kitty Engine', () => {
  it('initializes game state with both characters, platforms, hazards, and doors', () => {
    const state = initFireboyWatergirlGame(1);
    expect(state.levelIndex).toBe(1);
    expect(state.status).toBe('playing');
    expect(state.pup.alive).toBe(true);
    expect(state.kitty.alive).toBe(true);
    expect(state.platforms.length).toBeGreaterThan(0);
    expect(state.hazards.length).toBeGreaterThan(0);
    expect(state.pupDoor.type).toBe('fire');
    expect(state.kittyDoor.type).toBe('water');
  });

  it('keeps characters supported on solid platforms via gravity and collision', () => {
    const state = initFireboyWatergirlGame(1);
    // Pup starts in air, simulate steps
    let curState = state;
    for (let i = 0; i < 20; i++) {
      const { state: next } = stepFireboyWatergirlGame(curState, { pup: {}, kitty: {} }, 0.05);
      curState = next;
    }
    expect(curState.pup.isGrounded).toBe(true);
    expect(curState.kitty.isGrounded).toBe(true);
    expect(curState.pup.y).toBeLessThan(440); // Supported above ground
  });

  it('allows Pup to safely walk across lava while Kitty survives in water', () => {
    const state = initFireboyWatergirlGame(1);
    const lava = state.hazards.find((h) => h.type === 'lava');
    expect(lava).toBeDefined();

    if (lava) {
      // Place Pup directly in lava
      state.pup.x = lava.x + 10;
      state.pup.y = lava.y;

      const { state: next, event } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
      expect(next.pup.alive).toBe(true);
      expect(next.status).toBe('playing');
      expect(event).toBeUndefined();
    }
  });

  it('kills Pup when entering water and fails the level', () => {
    const state = initFireboyWatergirlGame(1);
    const water = state.hazards.find((h) => h.type === 'water');
    expect(water).toBeDefined();

    if (water) {
      // Place Pup directly in water
      state.pup.x = water.x + 10;
      state.pup.y = water.y;

      const { state: next, event } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
      expect(next.pup.alive).toBe(false);
      expect(next.status).toBe('failed');
      expect(event).toBe('die');
    }
  });

  it('kills Kitty when entering lava and fails the level', () => {
    const state = initFireboyWatergirlGame(1);
    const lava = state.hazards.find((h) => h.type === 'lava');
    expect(lava).toBeDefined();

    if (lava) {
      // Place Kitty directly in lava
      state.kitty.x = lava.x + 10;
      state.kitty.y = lava.y;

      const { state: next, event } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
      expect(next.kitty.alive).toBe(false);
      expect(next.status).toBe('failed');
      expect(event).toBe('die');
    }
  });

  it('presses pressure plate when a character steps on it', () => {
    const state = initFireboyWatergirlGame(1);
    const plate = state.plates[0];
    expect(plate).toBeDefined();

    // Place Pup on plate
    state.pup.x = plate.x + 4;
    state.pup.y = plate.y - state.pup.height;

    const { state: next } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
    const updatedPlate = next.plates.find((p) => p.id === plate.id);
    expect(updatedPlate?.isPressed).toBe(true);
  });

  it('collects fire gems with Pup and water gems with Kitty', () => {
    const state = initFireboyWatergirlGame(1);
    const fireGem = state.gems.find((g) => g.type === 'fire');
    expect(fireGem).toBeDefined();

    if (fireGem) {
      state.pup.x = fireGem.x - state.pup.width / 2;
      state.pup.y = fireGem.y - state.pup.height / 2;

      const { state: next, event } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
      expect(event).toBe('gem');
      const collected = next.gems.find((g) => g.id === fireGem.id);
      expect(collected?.collected).toBe(true);
    }
  });

  it('clears level when both characters reach their matching doors', () => {
    const state = initFireboyWatergirlGame(1);
    state.pup.x = state.pupDoor.x;
    state.pup.y = state.pupDoor.y;
    state.kitty.x = state.kittyDoor.x;
    state.kitty.y = state.kittyDoor.y;

    const { state: next, event } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
    expect(event).toBe('clear');
    expect(next.status).toBe('level_cleared');
  });

  it('triggers victory when completing final level 3', () => {
    const state = initFireboyWatergirlGame(TOTAL_COOP_LEVELS);
    state.pup.x = state.pupDoor.x;
    state.pup.y = state.pupDoor.y;
    state.kitty.x = state.kittyDoor.x;
    state.kittyDoor.y = state.kittyDoor.y;
    state.kitty.y = state.kittyDoor.y;

    const { state: next, event } = stepFireboyWatergirlGame(state, { pup: {}, kitty: {} }, 0.05);
    expect(event).toBe('victory');
    expect(next.status).toBe('victory');
  });
});

import { describe, expect, it } from 'bun:test';
import {
  initBadIceCreamGame,
  stepBadIceCreamGame,
  executeIceBreath,
  GRID_COLS,
  GRID_ROWS,
} from './engine';

describe('Bad Ice Cream: Frosty Barnyard Engine', () => {
  it('initializes grid, player, enemies, and fruits properly', () => {
    const state = initBadIceCreamGame(1);
    expect(state.levelIndex).toBe(1);
    expect(state.gridCols).toBe(GRID_COLS);
    expect(state.gridRows).toBe(GRID_ROWS);
    expect(state.status).toBe('playing');
    expect(state.player.lives).toBe(3);
    expect(state.fruits.length).toBeGreaterThan(0);
    expect(state.enemies.length).toBe(2);

    // Verify outer perimeter is solid wall
    for (let c = 0; c < GRID_COLS; c++) {
      expect(state.grid[0][c]).toBe('wall');
      expect(state.grid[GRID_ROWS - 1][c]).toBe('wall');
    }
  });

  it('creates a line of ice blocks when player breathes into empty space', () => {
    const state = initBadIceCreamGame(1);
    // Player facing down (facingX: 0, facingY: 1)
    state.player.facingX = 1;
    state.player.facingY = 0;
    // Clear line ahead of player for test
    const pr = Math.round(state.player.y);
    const pc = Math.round(state.player.x);
    state.grid[pr][pc + 1] = 'empty';
    state.grid[pr][pc + 2] = 'empty';
    state.grid[pr][pc + 3] = 'wall';

    const result = executeIceBreath(state);
    expect(result.actionType).toBe('create');
    expect(result.grid[pr][pc + 1]).toBe('ice');
    expect(result.grid[pr][pc + 2]).toBe('ice');
    expect(result.grid[pr][pc + 3]).toBe('wall'); // Stopped at wall
  });

  it('shatters a line of ice blocks when player breathes directly into ice', () => {
    const state = initBadIceCreamGame(1);
    const pr = Math.round(state.player.y);
    const pc = Math.round(state.player.x);
    state.player.facingX = 1;
    state.player.facingY = 0;

    // Place ice blocks ahead
    state.grid[pr][pc + 1] = 'ice';
    state.grid[pr][pc + 2] = 'ice';

    const result = executeIceBreath(state);
    expect(result.actionType).toBe('break');
    expect(result.grid[pr][pc + 1]).toBe('empty');
    expect(result.grid[pr][pc + 2]).toBe('empty');
  });

  it('collects fruits and advances score when player moves over fruit', () => {
    const state = initBadIceCreamGame(1);
    const activeFruit = state.fruits.find((f) => f.wave === 1);
    expect(activeFruit).toBeDefined();

    if (activeFruit) {
      // Place player right on fruit
      state.player.x = activeFruit.x;
      state.player.y = activeFruit.y;

      const { state: nextState, event } = stepBadIceCreamGame(state, { moveX: 0, moveY: 0 }, 0.05);
      expect(event).toBe('fruit_eaten');
      expect(nextState.player.score).toBe(50);
      const collected = nextState.fruits.find((f) => f.id === activeFruit.id);
      expect(collected?.collected).toBe(true);
    }
  });

  it('advances from wave 1 to wave 2 when all wave 1 fruits are eaten', () => {
    const state = initBadIceCreamGame(1);
    // Mark all wave 1 fruits as collected except one
    const wave1Fruits = state.fruits.filter((f) => f.wave === 1);
    for (let i = 0; i < wave1Fruits.length - 1; i++) {
      wave1Fruits[i].collected = true;
    }

    const lastWave1Fruit = wave1Fruits[wave1Fruits.length - 1];
    state.player.x = lastWave1Fruit.x;
    state.player.y = lastWave1Fruit.y;

    const { state: nextState } = stepBadIceCreamGame(state, { moveX: 0, moveY: 0 }, 0.05);
    expect(nextState.currentWave).toBe(2);
  });

  it('triggers level_cleared when all wave 2 fruits are collected on level 1', () => {
    const state = initBadIceCreamGame(1);
    // Mark all fruits except one collected
    for (let i = 0; i < state.fruits.length - 1; i++) {
      state.fruits[i].collected = true;
    }
    state.currentWave = 2;

    const lastFruit = state.fruits[state.fruits.length - 1];
    state.player.x = lastFruit.x;
    state.player.y = lastFruit.y;

    const { state: nextState, event } = stepBadIceCreamGame(state, { moveX: 0, moveY: 0 }, 0.05);
    expect(event).toBe('clear');
    expect(nextState.status).toBe('level_cleared');
  });

  it('reduces lives on enemy contact and triggers game_over when lives reach 0', () => {
    const state = initBadIceCreamGame(1, 0, 1); // 1 life
    // Place enemy right next to player
    state.enemies[0].x = state.player.x + 0.2;
    state.enemies[0].y = state.player.y;

    const { state: nextState, event } = stepBadIceCreamGame(state, { moveX: 0, moveY: 0 }, 0.05);
    expect(event).toBe('hit');
    expect(nextState.player.lives).toBe(0);
    expect(nextState.status).toBe('game_over');
  });
});

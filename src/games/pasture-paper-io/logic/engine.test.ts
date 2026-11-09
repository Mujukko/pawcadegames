import { describe, expect, test } from 'bun:test';
import {
  GRID_SIZE,
  STEP_DURATION,
  claimTerritoryLoop,
  computeOwnerPercent,
  createPaperGame,
  idxOf,
  steerPaperPlayer,
  stepPaperTick,
  updatePaperGame,
} from './engine';

describe('Pasture Paper.io Engine', () => {
  test('creates initial game with 3x3 player base and 4 AI bots', () => {
    const state = createPaperGame(12.5);
    expect(state.status).toBe('ready');
    expect(state.agents.length).toBe(5);
    expect(state.gridSize).toBe(GRID_SIZE);
    // 3x3 = 9 cells out of 1024 -> 0.9%
    expect(state.playerPercent).toBe(0.9);
    expect(state.bestPercent).toBe(12.5);
  });

  test('steering from ready starts playing immediately', () => {
    const s0 = createPaperGame();
    const s1 = steerPaperPlayer(s0, 'up');
    expect(s1.status).toBe('playing');
    expect(s1.agents[0]!.dir).toBe('up');
  });

  test('ignores 180-degree instant self-reversal while playing', () => {
    let state = steerPaperPlayer(createPaperGame(), 'right');
    state = steerPaperPlayer(state, 'left');
    expect(state.agents[0]!.nextDir).toBe('right');
  });

  test('flood-fills enclosed interior region when closing a trail loop', () => {
    const size = 10;
    const grid = new Array<number>(size * size).fill(-1);
    // Base along top of a 4x4 box: (2,2), (3,2), (4,2), (5,2)
    for (let x = 2; x <= 5; x++) grid[idxOf(x, 2, size)] = 0;

    // Trail forms right, bottom, and left walls enclosing (3,3),(4,3),(3,4),(4,4)
    const trail = [
      { x: 5, y: 3 },
      { x: 5, y: 4 },
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
      { x: 2, y: 5 },
      { x: 2, y: 4 },
      { x: 2, y: 3 },
    ];

    const gained = claimTerritoryLoop(grid, size, 0, trail);
    // 8 trail cells + 4 interior cells = 12 newly claimed cells!
    expect(gained).toBe(12);
    expect(grid[idxOf(3, 3, size)]).toBe(0);
    expect(grid[idxOf(4, 4, size)]).toBe(0);
    expect(grid[idxOf(1, 1, size)]).toBe(-1);
  });

  test('walking a small rectangle outside base claims turf and scores points', () => {
    let state = steerPaperPlayer(createPaperGame(), 'right');
    // Player starts at (16,16) with 3x3 base [15..17, 15..17]
    // Step right twice -> (17,16) then (18,16) outside!
    state = stepPaperTick(state); // (17,16)
    state = stepPaperTick(state); // (18,16) - trail has (18,16)
    expect(state.agents[0]!.trail.length).toBe(1);

    // Step down -> (18,17)
    state = steerPaperPlayer(state, 'down');
    state = stepPaperTick(state);
    expect(state.agents[0]!.trail.length).toBe(2);

    // Step left -> (17,17) which is owned turf! Loop closes!
    state = steerPaperPlayer(state, 'left');
    state = stepPaperTick(state);
    expect(state.agents[0]!.trail.length).toBe(0);
    expect(state.score).toBeGreaterThan(0);
    expect(computeOwnerPercent(state.grid, 0)).toBeGreaterThan(0.9);
  });

  test('crossing own ribbon triggers game_over with reason self', () => {
    let state = steerPaperPlayer(createPaperGame(), 'right');
    state = stepPaperTick(state); // 17,16
    state = stepPaperTick(state); // 18,16 (trail)
    state = stepPaperTick(state); // 19,16 (trail)
    state = steerPaperPlayer(state, 'down');
    state = stepPaperTick(state); // 19,17 (trail)
    state = steerPaperPlayer(state, 'left');
    state = stepPaperTick(state); // 18,17 (trail)
    state = steerPaperPlayer(state, 'up');
    state = stepPaperTick(state); // 18,16 -> hits own trail!
    expect(state.status).toBe('game_over');
    expect(state.deathReason).toBe('self');
  });

  test('hitting arena boundary triggers fence game_over', () => {
    let state = steerPaperPlayer(createPaperGame(), 'up');
    for (let i = 0; i < 20 && state.status === 'playing'; i++) {
      state = stepPaperTick(state);
    }
    expect(state.status).toBe('game_over');
    expect(state.deathReason).toBe('fence');
  });

  test('cutting a rival ribbon eliminates rival and awards bonus points', () => {
    let state = steerPaperPlayer(createPaperGame(), 'right');
    // Place bot 1's trail right in front of player at (17, 16)
    state.agents[1]!.trail = [{ x: 17, y: 16 }];
    state = stepPaperTick(state);
    expect(state.agents[1]!.alive).toBe(false);
    expect(state.agents[0]!.kills).toBe(1);
    expect(state.score).toBeGreaterThanOrEqual(250);
  });

  test('updatePaperGame clamps dt spikes safely', () => {
    const s0 = steerPaperPlayer(createPaperGame(), 'right');
    const s1 = updatePaperGame(s0, 2.5); // Clamped to 0.1s (< STEP_DURATION 0.125s)
    expect(s1.agents[0]!.x).toBe(16);
    expect(s1.tickProgress).toBeGreaterThan(0.7);
  });
});

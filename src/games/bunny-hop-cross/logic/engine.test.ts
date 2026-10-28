import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  moveBunny,
  nextStage,
  restartStage,
  STAGE_CONFIGS,
  updateEngine,
} from './engine';
import { GRID_COLS, IDLE_HAWK_LIMIT } from './types';

describe('Bunny Hop: Road & River Cross Logic Engine', () => {
  it('initializes with bunny at bottom safe grass row and default lives', () => {
    const state = createInitialState(1, 100);
    expect(state.bunny.gridX).toBe(4);
    expect(state.bunny.gridY).toBe(0);
    expect(state.bunny.alive).toBe(true);
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.carrots).toBe(0);
    expect(state.highScore).toBe(100);
    expect(state.lanes.length).toBe(STAGE_CONFIGS[0].totalRows);
    expect(state.lanes[0].type).toBe('grass');
  });

  it('hops bunny forward and updates score and maxRowReached', () => {
    let state = createInitialState(1);
    state = moveBunny(state, 'up');

    expect(state.bunny.gridY).toBe(1);
    expect(state.maxRowReached).toBe(1);
    expect(state.score).toBe(10);
    expect(state.events.some((e) => e.type === 'hop')).toBe(true);
  });

  it('clamps bunny movement within side column boundaries', () => {
    let state = createInitialState(1);
    // Move bunny all the way to the right
    for (let i = 0; i < 10; i++) {
      state = moveBunny(state, 'right');
    }
    expect(state.bunny.gridX).toBe(GRID_COLS - 1);

    // Move bunny all the way to the left
    for (let i = 0; i < 15; i++) {
      state = moveBunny(state, 'left');
    }
    expect(state.bunny.gridX).toBe(0);

    // Move down at row 0 should stay at 0
    state = moveBunny(state, 'down');
    expect(state.bunny.gridY).toBe(0);
  });

  it('prevents bunny from hopping into a tree obstacle', () => {
    const state = createInitialState(1);
    // Artificially place an obstacle right above the bunny at (4, 1)
    state.lanes[1].obstacles = [{ id: 'test_tree', col: 4, type: 'tree' }];

    const next = moveBunny(state, 'up');
    expect(next.bunny.gridY).toBe(0); // Hop rejected
  });

  it('collects carrots and awards bonus points', () => {
    const state = createInitialState(1);
    state.lanes[1].collectibles = [
      { id: 'c1', col: 4, type: 'carrot', collected: false },
    ];

    const next = moveBunny(state, 'up');
    expect(next.carrots).toBe(1);
    expect(next.score).toBe(10 + 50); // 10 for row + 50 for carrot
    expect(next.events.some((e) => e.type === 'carrot_collect')).toBe(true);
  });

  it('detects vehicle collision on road lane and loses a life', () => {
    let state = createInitialState(1);
    // Put a vehicle right at column 4 on lane 1
    state.lanes[1] = {
      row: 1,
      type: 'road',
      speed: 0,
      obstacles: [],
      collectibles: [],
      movingEntities: [{ id: 'veh1', x: 3.5, width: 2.0, speed: 0, type: 'tractor' }],
    };

    // Hop into lane 1
    state = moveBunny(state, 'up');
    // Step engine to process collisions
    state = updateEngine(state, 0.02);

    expect(state.lives).toBe(2);
    expect(state.events.some((e) => e.type === 'crash')).toBe(true);
    // Bunny respawned at safe grass row 0
    expect(state.bunny.gridY).toBe(0);
  });

  it('rides a moving river log without drowning', () => {
    let state = createInitialState(1);
    // Put a river on lane 1 with a log right under column 4
    state.lanes[1] = {
      row: 1,
      type: 'river',
      speed: 2.0,
      obstacles: [],
      collectibles: [],
      movingEntities: [{ id: 'log1', x: 3.0, width: 3.0, speed: 2.0, type: 'log_large' }],
    };

    state = moveBunny(state, 'up');
    // Step frame while on the log
    state = updateEngine(state, 0.03);

    expect(state.lives).toBe(3); // Alive and well
    expect(state.bunny.ridingEntityId).toBe('log1');
  });

  it('splashes into water when landing on river lane without a log', () => {
    let state = createInitialState(1);
    // Put a river on lane 1 with no logs near column 4
    state.lanes[1] = {
      row: 1,
      type: 'river',
      speed: 1.0,
      obstacles: [],
      collectibles: [],
      movingEntities: [{ id: 'far_log', x: 8.0, width: 1.0, speed: 1.0, type: 'log_small' }],
    };

    state = moveBunny(state, 'up');
    const allEvents = [...state.events];
    // Finish hopping animation to land
    for (let i = 0; i < 15; i++) {
      state = updateEngine(state, 0.02);
      allEvents.push(...state.events);
    }

    expect(state.lives).toBe(2);
    expect(allEvents.some((e) => e.type === 'splash')).toBe(true);
  });

  it('triggers hawk swoop if bunny idles in place for too long', () => {
    let state = createInitialState(1);
    const allEvents = [...state.events];
    // Step engine forward past idle limit
    const steps = Math.ceil((IDLE_HAWK_LIMIT + 0.5) / 0.04);
    for (let i = 0; i < steps; i++) {
      state = updateEngine(state, 0.04);
      allEvents.push(...state.events);
    }

    expect(state.lives).toBe(2);
    expect(allEvents.some((e) => e.type === 'hawk_swoop')).toBe(true);
  });

  it('clears stage when reaching top finish farm row', () => {
    let state = createInitialState(1);
    const finishRow = state.lanes.length - 1;

    // Fast-forward bunny to row right before finish
    state.bunny.gridY = finishRow - 1;
    state.bunny.visualY = finishRow - 1;

    // Hop onto finish row
    state = moveBunny(state, 'up');

    expect(state.stageComplete).toBe(true);
    expect(state.events.some((e) => e.type === 'stage_clear')).toBe(true);

    // Can transition to next stage
    const next = nextStage(state);
    expect(next.stage).toBe(2);
    expect(next.stageComplete).toBe(false);
    expect(next.bunny.gridY).toBe(0);
  });
});

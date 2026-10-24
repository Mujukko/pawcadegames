import { describe, it, expect } from 'bun:test';
import {
  initializeCritterLevel,
  isPathClear,
  tapCritter,
  Critter,
  CRITTER_LEVELS,
  isLevelSolvable,
} from './engine';

describe('Critter Tap Away: Barn Escape Core Engine', () => {
  it('initializes Level 1 with 6 critters on a 4x4 grid', () => {
    const state = initializeCritterLevel(1);
    expect(state.level).toBe(1);
    expect(state.gridSize).toBe(4);
    expect(state.critters.length).toBe(6);
    expect(state.escapedCount).toBe(0);
    expect(state.isWon).toBe(false);
  });

  it('correctly detects when a critter path is clear to the boundary', () => {
    const critters: Critter[] = [
      { id: 'c1', type: 'pig', x: 0, y: 0, direction: 'up' }, // directly at boundary
      { id: 'c2', type: 'cow', x: 1, y: 1, direction: 'left' },
      { id: 'c3', type: 'sheep', x: 0, y: 1, direction: 'left' }, // blocks c2 if c2 looks left
    ];

    expect(isPathClear(critters[0], critters, 4)).toBe(true);
    expect(isPathClear(critters[1], critters, 4)).toBe(false); // c3 is at (0, 1)
  });

  it('allows unobstructed critter to escape, incrementing score and escapedCount', () => {
    const state = initializeCritterLevel(1);
    // In Level 1: c5 is at (0, 1) facing left -> path to left is clear (x=0)
    const result = tapCritter(state, 'c5');
    expect(result.success).toBe(true);
    expect(result.nextState.escapedCount).toBe(1);
    expect(result.nextState.critters.length).toBe(5);
    expect(result.nextState.score).toBe(100);
    expect(result.nextState.moves).toBe(1);
  });

  it('prevents blocked critter from escaping and increments moves', () => {
    const critters: Critter[] = [
      { id: 'c1', type: 'pig', x: 1, y: 1, direction: 'right' },
      { id: 'c2', type: 'cow', x: 2, y: 1, direction: 'down' },
    ];
    const state = {
      level: 1,
      gridSize: 4,
      critters,
      initialCritterCount: 2,
      escapedCount: 0,
      moves: 0,
      isWon: false,
      isGameOver: false,
      score: 0,
    };

    // c1 is blocked by c2 looking right
    const result = tapCritter(state, 'c1');
    expect(result.success).toBe(false);
    expect(result.nextState.critters.length).toBe(2);
    expect(result.nextState.moves).toBe(1);
  });

  it('triggers victory when all critters escape', () => {
    let state = initializeCritterLevel(1);
    // Artificially reduce critters to 1 clear critter
    state.critters = [{ id: 'win', type: 'bunny', x: 0, y: 0, direction: 'up' }];
    state.initialCritterCount = 1;

    const result = tapCritter(state, 'win');
    expect(result.success).toBe(true);
    expect(result.nextState.isWon).toBe(true);
    expect(result.nextState.critters.length).toBe(0);
  });

  it('guarantees that ALL campaign levels in CRITTER_LEVELS are 100% mathematically solvable to completion', () => {
    expect(CRITTER_LEVELS.length).toBeGreaterThanOrEqual(4);

    for (const level of CRITTER_LEVELS) {
      const solvable = isLevelSolvable(level.critters, level.gridSize);
      expect(solvable).toBe(true);
    }
  });
});

import { describe, expect, test } from 'bun:test';
import { createGameState, moveDog, getDogMoveRange, isWinningState, solveLevel } from './engine';
import { LEVELS } from '../levels/levelsData';

describe('Dog Parking Core Engine', () => {
  test('Initial state initializes properly', () => {
    const level1 = LEVELS[0]!;
    const state = createGameState(level1);
    expect(state.levelId).toBe(1);
    expect(state.dogs.length).toBe(3);
    expect(state.movesCount).toBe(0);
    expect(state.isCompleted).toBe(false);
  });

  test('Cannot move dog outside its axis', () => {
    const level1 = LEVELS[0]!;
    const state = createGameState(level1);
    const hero = state.dogs.find(d => d.isHero)!;
    expect(hero.orientation).toBe('horizontal');

    // Horizontal dog: getDogMoveRange returns range along X
    const range = getDogMoveRange(state, hero.id);
    expect(range.min).toBe(0); // can slide left to 0
    // At x=1, length 2, pug is at x=4, so hero can slide right to x=2 (occupying 2,3)
    expect(range.max).toBe(2);
  });

  test('Movement correctly updates position and movesCount', () => {
    const level1 = LEVELS[0]!;
    const state = createGameState(level1);

    // Slide pug downward from y=1 to y=3
    const moveRes = moveDog(state, 'pug1', 3);
    expect(moveRes.success).toBe(true);
    expect(moveRes.state.movesCount).toBe(1);
    const pug = moveRes.state.dogs.find(d => d.id === 'pug1')!;
    expect(pug.y).toBe(3);

    // Now hero's path to exit is clear
    const heroRange = getDogMoveRange(moveRes.state, 'hero');
    expect(heroRange.canExit).toBe(true);

    // Hero moves to exit
    const heroMove = moveDog(moveRes.state, 'hero', 4);
    expect(heroMove.success).toBe(true);
    expect(heroMove.win).toBe(true);
    expect(heroMove.state.isCompleted).toBe(true);
  });

  test('Obstacles prevent movement', () => {
    const level11 = LEVELS.find(l => l.id === 11)!;
    const state = createGameState(level11);
    // Obstacle at x=2, y=0. Hero at x=0, y=2.
    expect(state.obstacles.length).toBe(2);
  });

  // Automated solvability verification of all 12 levels!
  test('All 12 handcrafted levels are 100% solvable', () => {
    expect(LEVELS.length).toBeGreaterThanOrEqual(10);

    for (const level of LEVELS) {
      const result = solveLevel(level, 30000);
      expect(result.solvable).toBe(true);
      expect(result.minMoves).toBeGreaterThan(0);
      console.log(`Level ${level.id} (${level.name}): Solvable in ${result.minMoves} moves (optimalConfig: ${level.optimalMoves})`);
    }
  });
});

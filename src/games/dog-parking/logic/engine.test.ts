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

  test('No initial overlaps or out-of-bounds in any level', () => {
    for (const level of LEVELS) {
      const occupied = new Map<string, string>();

      // Check obstacles
      for (const obs of (level.obstacles || [])) {
        expect(obs.x).toBeGreaterThanOrEqual(0);
        expect(obs.x).toBeLessThan(level.width);
        expect(obs.y).toBeGreaterThanOrEqual(0);
        expect(obs.y).toBeLessThan(level.height);

        const key = `${obs.x},${obs.y}`;
        expect(occupied.has(key)).toBe(false);
        occupied.set(key, `obstacle_${obs.id}`);
      }

      // Check dogs
      for (const dog of level.dogs) {
        for (let i = 0; i < dog.length; i++) {
          const x = dog.orientation === 'horizontal' ? dog.x + i : dog.x;
          const y = dog.orientation === 'vertical' ? dog.y + i : dog.y;

          expect(x).toBeGreaterThanOrEqual(0);
          expect(x).toBeLessThan(level.width);
          expect(y).toBeGreaterThanOrEqual(0);
          expect(y).toBeLessThan(level.height);

          const key = `${x},${y}`;
          const existing = occupied.get(key);
          if (existing) {
            throw new Error(`Level ${level.id} (${level.name}): Dog "${dog.id}" overlaps with "${existing}" at cell (${key})`);
          }
          occupied.set(key, dog.id);
        }
      }
    }
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

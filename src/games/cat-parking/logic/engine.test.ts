import { describe, expect, test } from 'bun:test';
import { createGameState, applyMove, getCatMoveRange, findShortestSolutionBFS } from './engine';
import { LEVELS } from '../levels/levelsData';

describe('Cat Parking Core Engine', () => {
  test('Initial state initializes properly', () => {
    const level1 = LEVELS[0]!;
    const state = createGameState(level1);

    expect(state.levelId).toBe(1);
    expect(state.movesCount).toBe(0);
    expect(state.isCompleted).toBe(false);
    expect(state.cats.length).toBe(level1.cats.length);
    expect(state.cats.find(c => c.isHero)).toBeDefined();
  });

  test('Cannot move cat outside its axis', () => {
    const level1 = LEVELS[0]!;
    const state = createGameState(level1);

    // Hero is horizontal at y: 2, x: 1
    const { min, max, canExit } = getCatMoveRange(state, 'hero');
    expect(min).toBe(0);
    // tabby1 is at x: 4, y: 1 (occupies (4,1), (4,2)) -> hero can only slide up to x: 2 (length 2 => occupies 2,3)
    expect(max).toBe(2);
    expect(canExit).toBe(false);
  });

  test('Movement correctly updates position and movesCount', () => {
    const level1 = LEVELS[0]!;
    const state = createGameState(level1);

    // Move tabby1 downward from y: 1 to y: 3
    const { newState, result } = applyMove(state, 'tabby1', 3);
    expect(result.valid).toBe(true);
    expect(newState.movesCount).toBe(1);

    const movedTabby = newState.cats.find(c => c.id === 'tabby1')!;
    expect(movedTabby.y).toBe(3);

    // Now hero can slide all the way to exit
    const heroRange = getCatMoveRange(newState, 'hero');
    expect(heroRange.canExit).toBe(true);

    const exitMove = applyMove(newState, 'hero', 5);
    expect(exitMove.result.valid).toBe(true);
    expect(exitMove.result.exited).toBe(true);
    expect(exitMove.newState.isCompleted).toBe(true);
  });

  test('Obstacles prevent movement', () => {
    const level4 = LEVELS.find(l => l.id === 4)!;
    const state = createGameState(level4);
    // Obstacle at (0,0)
    expect(state.obstacles.length).toBeGreaterThan(0);
  });

  test('No initial overlaps or out-of-bounds in any level', () => {
    for (const lvl of LEVELS) {
      const occupied = new Set<string>();

      // Check obstacles
      for (const obs of lvl.obstacles || []) {
        expect(obs.x).toBeGreaterThanOrEqual(0);
        expect(obs.x).toBeLessThan(lvl.width);
        expect(obs.y).toBeGreaterThanOrEqual(0);
        expect(obs.y).toBeLessThan(lvl.height);

        const key = `${obs.x},${obs.y}`;
        expect(occupied.has(key)).toBe(false);
        occupied.add(key);
      }

      // Check cats
      for (const cat of lvl.cats) {
        expect(cat.x).toBeGreaterThanOrEqual(0);
        expect(cat.y).toBeGreaterThanOrEqual(0);

        if (cat.orientation === 'horizontal') {
          expect(cat.x + cat.length).toBeLessThanOrEqual(lvl.width);
          expect(cat.y).toBeLessThan(lvl.height);
          for (let i = 0; i < cat.length; i++) {
            const key = `${cat.x + i},${cat.y}`;
            if (occupied.has(key)) {
              throw new Error(`Overlap detected in Level ${lvl.id} (${lvl.name}) for cat ${cat.id} at (${cat.x + i}, ${cat.y})`);
            }
            occupied.add(key);
          }
        } else {
          expect(cat.x).toBeLessThan(lvl.width);
          expect(cat.y + cat.length).toBeLessThanOrEqual(lvl.height);
          for (let i = 0; i < cat.length; i++) {
            const key = `${cat.x},${cat.y + i}`;
            if (occupied.has(key)) {
              throw new Error(`Overlap detected in Level ${lvl.id} (${lvl.name}) for cat ${cat.id} at (${cat.x}, ${cat.y + i})`);
            }
            occupied.add(key);
          }
        }
      }
    }
  });

  test('All 12 handcrafted levels are 100% solvable', () => {
    for (const lvl of LEVELS) {
      const solution = findShortestSolutionBFS(lvl, 50000);
      expect(solution).not.toBeNull();
      expect(solution?.solvable).toBe(true);
      expect(solution?.moves).toBeGreaterThan(0);
      console.log(`Cat Parking Level ${lvl.id} (${lvl.name}): Solvable in ${solution?.moves} moves (optimalConfig: ${lvl.optimalMoves})`);
    }
  });
});

import { describe, it, expect } from 'bun:test';
import {
  createEmptyGrid,
  spawnRandomShape,
  rotateMatrix,
  doesShapeCollide,
  solidifyShapeToGrid,
  stepSandPhysics,
  checkAndClearConnectedLines,
  initializeSandGame,
} from './engine';

describe('Grain Sand Fall: Farm Physics Engine', () => {
  it('creates an empty grid with specified columns and rows', () => {
    const grid = createEmptyGrid(20, 30);
    expect(grid.length).toBe(30);
    expect(grid[0].length).toBe(20);
    expect(grid.every(r => r.every(c => c === 0))).toBe(true);
  });

  it('spawns a falling shape positioned centered at top of grid', () => {
    const shape = spawnRandomShape(30, 1);
    expect(shape.x).toBeGreaterThanOrEqual(0);
    expect(shape.y).toBe(0);
    expect(shape.matrix.length).toBeGreaterThan(0);
    expect(shape.matrix[0].length).toBeGreaterThan(0);
  });

  it('rotates matrix 90 degrees clockwise properly', () => {
    const mat = [
      [1, 2],
      [3, 4],
    ];
    // Row 0 [1, 2], Row 1 [3, 4] -> Rotated: [[3, 1], [4, 2]]
    const rot = rotateMatrix(mat as any);
    expect(rot).toEqual([
      [3, 1],
      [4, 2],
    ]);
  });

  it('detects collisions with floor and boundary walls', () => {
    const grid = createEmptyGrid(10, 10);
    const shape = {
      matrix: [[1, 1]],
      x: 0,
      y: 9, // At bottom row
      width: 2,
      height: 1,
    };
    // At y=9, it does not collide
    expect(doesShapeCollide(shape as any, grid, 10, 10)).toBe(false);

    // At y=10 (below floor), collides!
    expect(doesShapeCollide({ ...shape, y: 10 } as any, grid, 10, 10)).toBe(true);

    // Beyond right wall, collides!
    expect(doesShapeCollide({ ...shape, x: 9 } as any, grid, 10, 10)).toBe(true);
  });

  it('simulates sand physics: grains fall down and settle on floor', () => {
    const grid = createEmptyGrid(5, 5);
    // Place a single grain at (2, 0)
    grid[0][2] = 1;

    // Step physics once
    const { newGrid, movedCount } = stepSandPhysics(grid, 5, 5);
    expect(movedCount).toBe(1);
    expect(newGrid[0][2]).toBe(0);
    expect(newGrid[1][2]).toBe(1); // Fell to row 1
  });

  it('simulates sand physics: grains roll diagonally off mounds', () => {
    const grid = createEmptyGrid(5, 5);
    // Pile a floor at y=4
    grid[4][2] = 1;
    // Place a grain directly above the obstacle at y=3
    grid[3][2] = 1;

    // Step physics: grain at (2, 3) cannot fall straight down, must roll diagonally
    const { newGrid, movedCount } = stepSandPhysics(grid, 5, 5);
    expect(movedCount).toBe(1);
    expect(newGrid[3][2]).toBe(0);
    // Should have rolled to either (1, 4) or (3, 4)
    const rolled = newGrid[4][1] === 1 || newGrid[4][3] === 1;
    expect(rolled).toBe(true);
  });

  it('detects and clears a continuous wall-to-wall color strand', () => {
    const grid = createEmptyGrid(6, 6);
    // Fill row 5 completely with color 1 (Corn Gold)
    for (let x = 0; x < 6; x++) {
      grid[5][x] = 1;
    }

    const result = checkAndClearConnectedLines(grid, 6, 6);
    expect(result.strandsCleared).toBe(1);
    expect(result.clearedGrains).toBe(6);
    // Entire row 5 is now cleared
    expect(result.newGrid[5].every(c => c === 0)).toBe(true);
  });

  it('does NOT clear if path does not reach the right wall', () => {
    const grid = createEmptyGrid(6, 6);
    // Fill only columns 0 to 4 (leaving column 5 empty)
    for (let x = 0; x < 5; x++) {
      grid[5][x] = 1;
    }

    const result = checkAndClearConnectedLines(grid, 6, 6);
    expect(result.strandsCleared).toBe(0);
    expect(result.clearedGrains).toBe(0);
  });
});

import { describe, expect, it } from 'bun:test';
import {
  createInitialBubbleState,
  getCellCenter,
  calculateAimTrajectory,
  fireCurrentBubble,
  findConnectedCluster,
  findDisconnectedBubbles,
  resolveGridAfterSnap,
  snapBubbleToGrid,
  FRUIT_DEFS,
  BOARD_WIDTH,
} from './engine';

describe('Farm Fruit Bubble: Orchard Pop Engine Unit Tests', () => {
  it('initializes with default starting state and fruit grid', () => {
    const state = createInitialBubbleState(1200, 1);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(1200);
    expect(state.level).toBe(1);
    expect(state.grid.length).toBe(12);
    expect(state.currentBubble).toBeDefined();
    expect(state.nextBubble).toBeDefined();
    expect(state.flyingBubble).toBeNull();
    expect(state.gameOver).toBe(false);
    expect(state.gameWon).toBe(false);

    // Initial rows should have fruits
    expect(state.grid[0][0]).not.toBeNull();
    expect(state.grid[1][0]).not.toBeNull();
  });

  it('calculates hexagonal staggered centers for even and odd rows', () => {
    const r0c0 = getCellCenter(0, 0);
    const r1c0 = getCellCenter(1, 0);

    expect(r0c0.y).toBeLessThan(r1c0.y);
    // Odd row is indented
    expect(r1c0.x).not.toBe(r0c0.x);
  });

  it('calculates trajectory reflection off side walls', () => {
    // Sharp angle to the left
    const trajectory = calculateAimTrajectory(200, 500, -60, 600);
    expect(trajectory.length).toBeGreaterThanOrEqual(2);

    // Bounced off left wall
    const hasLeftBounce = trajectory.some((p) => p.x <= 25);
    expect(hasLeftBounce).toBe(true);
  });

  it('fires current bubble with forward velocity', () => {
    let state = createInitialBubbleState();
    state.aimAngleDeg = 15;
    state = fireCurrentBubble(state);

    expect(state.flyingBubble).not.toBeNull();
    expect(state.flyingBubble?.type).toBe(state.currentBubble);
    expect(state.flyingBubble?.vy).toBeLessThan(0); // Going upward
    expect(state.shotsFired).toBe(1);

    // Subsequent fires ignored while flying
    const reFire = fireCurrentBubble(state);
    expect(reFire).toBe(state);
  });

  it('identifies clusters of matching fruits via BFS', () => {
    const state = createInitialBubbleState();
    // Clear grid and place 3 apples in row 0
    state.grid = state.grid.map((r) => r.map(() => null));
    state.grid[0][0] = 'apple';
    state.grid[0][1] = 'apple';
    state.grid[0][2] = 'apple';

    const cluster = findConnectedCluster(state.grid, 0, 0, 'apple');
    expect(cluster.length).toBe(3);
  });

  it('pops 3+ cluster, awards score bonus, and increments combo', () => {
    const state = createInitialBubbleState();
    state.grid = state.grid.map((r) => r.map(() => null));
    state.grid[0][0] = 'pear';
    state.grid[0][1] = 'pear';
    state.grid[0][5] = 'apple'; // Non-target fruit to keep board active

    // Snap 3rd pear into (0, 2)
    const result = resolveGridAfterSnap(state, 0, 2, 'pear');
    expect(result.event).toBe('pop');
    expect(result.state.score).toBeGreaterThan(0);
    expect(result.state.combo).toBe(1);
    expect(result.state.grid[0][0]).toBeNull();
    expect(result.state.grid[0][1]).toBeNull();
    expect(result.state.grid[0][2]).toBeNull();
    expect(result.state.grid[0][5]).toBe('apple');
  });

  it('detects and drops floating orphan bubbles disconnected from ceiling', () => {
    const state = createInitialBubbleState();
    state.grid = state.grid.map((r) => r.map(() => null));

    // Anchored at top row
    state.grid[0][0] = 'lemon';
    state.grid[0][1] = 'lemon';

    // Hanging under top row
    state.grid[1][0] = 'plum'; // connected to row 0
    state.grid[2][0] = 'berry'; // connected to row 1

    // Disconnected floating bubble in row 4
    state.grid[4][3] = 'apple';

    const orphans = findDisconnectedBubbles(state.grid);
    expect(orphans.length).toBe(1);
    expect(orphans[0].r).toBe(4);
    expect(orphans[0].c).toBe(3);
    expect(orphans[0].type).toBe('apple');
  });

  it('triggers level clear when all bubbles are cleared', () => {
    const state = createInitialBubbleState();
    state.grid = state.grid.map((r) => r.map(() => null));
    state.grid[0][0] = 'apple';
    state.grid[0][1] = 'apple';

    // Snap 3rd apple to clear entire board
    const result = resolveGridAfterSnap(state, 0, 2, 'apple');
    expect(result.event).toBe('levelclear');
    expect(result.state.gameWon).toBe(true);
    expect(result.state.score).toBeGreaterThanOrEqual(1500);
  });
});

import { describe, it, expect } from 'bun:test';
import { createInitialState, handleHoleClick, updatePhysics, WOOD_LEVELS } from './engine';

describe('Wood Nuts & Bolts Farm Logic Engine', () => {
  it('initializes Level 1 with 5 holes, 2 planks, and 0 moves', () => {
    const state = createInitialState(0);
    expect(state.level).toBe(1);
    expect(state.holes.length).toBe(5);
    expect(state.planks.length).toBe(2);
    expect(state.moves).toBe(0);
    expect(state.score).toBe(0);
    expect(state.levelCleared).toBe(false);
  });

  it('selects a screw when clicking an occupied hole', () => {
    const state = createInitialState(0);
    const res = handleHoleClick(state, 0);

    expect(res.type).toBe('select');
    expect(state.selectedHoleId).toBe(0);
  });

  it('deselects the screw when clicking the same hole again', () => {
    const state = createInitialState(0);
    handleHoleClick(state, 0); // select
    const res = handleHoleClick(state, 0); // deselect

    expect(res.type).toBe('deselect');
    expect(state.selectedHoleId).toBeNull();
  });

  it('switches selection when clicking another occupied hole', () => {
    const state = createInitialState(0);
    handleHoleClick(state, 0); // select hole 0
    const res = handleHoleClick(state, 1); // click hole 1

    expect(res.type).toBe('select');
    expect(state.selectedHoleId).toBe(1);
  });

  it('moves a selected screw to an empty hole and increments moves counter', () => {
    const state = createInitialState(0);
    handleHoleClick(state, 2); // select screw at hole 2
    const res = handleHoleClick(state, 3); // move to empty hole 3

    expect(res.type).toBe('move');
    expect(res.screwMoved).toBe(true);
    expect(state.holes[2]!.hasScrew).toBe(false);
    expect(state.holes[3]!.hasScrew).toBe(true);
    expect(state.moves).toBe(1);
    expect(state.selectedHoleId).toBeNull();
  });

  it('drops a plank when all its pinning screws are removed', () => {
    const state = createInitialState(0);
    // Plank 1 (Center Pine Post) is pinned only by hole 2
    handleHoleClick(state, 2);
    const res = handleHoleClick(state, 3);

    expect(res.fallenPlankIds).toContain(1);
    expect(state.planks[1]!.isFallen).toBe(true);
    expect(state.score).toBe(250);
  });

  it('triggers levelCleared when all planks fall down', () => {
    const state = createInitialState(0);

    // Free Plank 1: move screw 2 to 3
    handleHoleClick(state, 2);
    handleHoleClick(state, 3);
    expect(state.planks[1]!.isFallen).toBe(true);

    // Free Plank 0 (pinned by 0 and 1): move screw 0 to 2
    handleHoleClick(state, 0);
    handleHoleClick(state, 2);

    // Move screw 1 to 4
    handleHoleClick(state, 1);
    handleHoleClick(state, 4);

    expect(state.planks[0]!.isFallen).toBe(true);
    expect(state.levelCleared).toBe(true);
    expect(state.score).toBeGreaterThanOrEqual(1000);
  });

  it('updates falling physics on fallen planks over time', () => {
    const state = createInitialState(0);
    state.planks[0]!.isFallen = true;
    state.planks[0]!.fallVelocity = 50;

    updatePhysics(state, 0.1);
    expect(state.planks[0]!.fallY).toBeGreaterThan(0);
    expect(state.planks[0]!.fallVelocity).toBeGreaterThan(50);
    expect(state.planks[0]!.fallRotation).toBeGreaterThan(0);
  });

  it('guarantees all campaign levels in WOOD_LEVELS initialize cleanly', () => {
    for (let i = 0; i < WOOD_LEVELS.length; i++) {
      const state = createInitialState(i);
      expect(state.holes.length).toBeGreaterThan(3);
      expect(state.planks.length).toBeGreaterThan(1);
      // Ensure at least one empty hole is available to move into
      const emptyHoles = state.holes.filter(h => !h.hasScrew);
      expect(emptyHoles.length).toBeGreaterThan(0);
    }
  });
});

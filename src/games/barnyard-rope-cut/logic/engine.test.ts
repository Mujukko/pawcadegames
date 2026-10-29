import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  cutRopesAlongLine,
  linesIntersect,
  popBubble,
  ROPE_CUT_LEVELS,
  updateEngine,
} from './engine';

describe('Barnyard Rope Cut: Feed the Piggy Logic Engine', () => {
  it('initializes level 0 with 1 rope, 3 stars, apple, and Penny Piglet target', () => {
    const state = createInitialState(0);
    expect(state.levelIndex).toBe(0);
    expect(state.ropes.length).toBe(1);
    expect(state.ropes[0].segments.length).toBeGreaterThan(5);
    expect(state.stars.length).toBe(3);
    expect(state.apple.inBubble).toBe(false);
    expect(state.status).toBe('playing');
    expect(state.starsCollected).toBe(0);
    expect(state.piggy.mouthOpen).toBe(false);
  });

  it('correctly calculates 2D line segment intersections', () => {
    // Intersecting cross
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 100, y: 100 };
    const p3 = { x: 0, y: 100 };
    const p4 = { x: 100, y: 0 };
    expect(linesIntersect(p1, p2, p3, p4)).toBe(true);

    // Parallel lines
    const p5 = { x: 0, y: 200 };
    const p6 = { x: 100, y: 200 };
    expect(linesIntersect(p1, p2, p5, p6)).toBe(false);
  });

  it('cuts rope when swipe line intersects rope segments', () => {
    let state = createInitialState(0);
    expect(state.ropes[0].cut).toBe(false);

    // Swipe horizontally across the middle of the vertical rope (x=250, y=60 to 220)
    const swipeStart = { x: 200, y: 140 };
    const swipeEnd = { x: 300, y: 140 };

    state = cutRopesAlongLine(state, swipeStart, swipeEnd);
    expect(state.ropes[0].cut).toBe(true);
    expect(state.events.some((e) => e.type === 'rope_cut')).toBe(true);
  });

  it('drops apple downward with gravity after rope is cut', () => {
    let state = createInitialState(0);
    // Cut the rope
    state = cutRopesAlongLine(state, { x: 200, y: 120 }, { x: 300, y: 120 });

    const initialY = state.apple.y;
    for (let i = 0; i < 15; i++) {
      state = updateEngine(state, 0.05);
    }

    expect(state.apple.y).toBeGreaterThan(initialY + 50);
  });

  it('collects stars when apple passes through star radius', () => {
    let state = createInitialState(0);
    // Position apple right on star 1
    state.apple.x = state.stars[0].x;
    state.apple.y = state.stars[0].y;

    const allEvents = [];
    state = updateEngine(state, 0.02);
    allEvents.push(...state.events);

    expect(state.starsCollected).toBe(1);
    expect(state.stars[0].collected).toBe(true);
    expect(allEvents.some((e) => e.type === 'star_collect')).toBe(true);
  });

  it('entraps apple in bubble and floats upward', () => {
    let state = createInitialState(2); // Level 2 has bubble at (180, 330)
    state.ropes.forEach((r) => { r.cut = true; });
    state.apple.x = 180;
    state.apple.y = 330;
    state.apple.oldX = 180;
    state.apple.oldY = 330;

    const allEvents = [];
    state = updateEngine(state, 0.05);
    allEvents.push(...state.events);

    expect(state.apple.inBubble).toBe(true);
    expect(allEvents.some((e) => e.type === 'bubble_enter')).toBe(true);

    // Should float upward
    const initialY = state.apple.y;
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, 0.05);
    }
    expect(state.apple.y).toBeLessThan(initialY);
  });

  it('pops bubble on popBubble() call and releases apple back to downward gravity', () => {
    let state = createInitialState(2);
    state.ropes.forEach((r) => { r.cut = true; });
    state.apple.x = 180;
    state.apple.y = 330;
    state.apple.oldX = 180;
    state.apple.oldY = 330;
    state = updateEngine(state, 0.05);
    expect(state.apple.inBubble).toBe(true);

    // Pop the bubble
    state = popBubble(state);
    expect(state.apple.inBubble).toBe(false);
    expect(state.events.some((e) => e.type === 'bubble_pop')).toBe(true);

    // Now apple falls downward
    const poppedY = state.apple.y;
    for (let i = 0; i < 10; i++) {
      state = updateEngine(state, 0.05);
    }
    expect(state.apple.y).toBeGreaterThan(poppedY);
  });

  it('bounces apple upward when colliding with a trampoline', () => {
    let state = createInitialState(3); // Level 3 has trampoline at (220, 520)
    state.ropes.forEach((r) => { r.cut = true; });
    state.apple.x = 220;
    state.apple.y = 515;
    state.apple.oldX = 220;
    state.apple.oldY = 490; // falling down

    const allEvents = [];
    state = updateEngine(state, 0.05);
    allEvents.push(...state.events);

    expect(allEvents.some((e) => e.type === 'trampoline_bounce')).toBe(true);
    expect(state.apple.y).toBeLessThan(state.apple.oldY);
  });

  it('fails level when apple touches a thistle hazard', () => {
    let state = createInitialState(1); // Level 1 has thistle at (120, 400)
    state.ropes.forEach((r) => { r.cut = true; });
    state.apple.x = 120;
    state.apple.y = 400;
    state.apple.oldX = 120;
    state.apple.oldY = 400;

    const allEvents = [];
    state = updateEngine(state, 0.05);
    allEvents.push(...state.events);

    expect(state.status).toBe('lost');
    expect(allEvents.some((e) => e.type === 'thistle_hit')).toBe(true);
  });

  it('wins level when apple reaches Penny Piglet mouth', () => {
    let state = createInitialState(0);
    state.ropes.forEach((r) => { r.cut = true; });
    // Place apple right at Penny's mouth
    state.apple.x = state.piggy.x;
    state.apple.y = state.piggy.y;
    state.apple.oldX = state.piggy.x;
    state.apple.oldY = state.piggy.y;

    const allEvents = [];
    state = updateEngine(state, 0.05);
    allEvents.push(...state.events);

    expect(state.status).toBe('won');
    expect(allEvents.some((e) => e.type === 'piggy_fed')).toBe(true);
    expect(allEvents.some((e) => e.type === 'level_won')).toBe(true);
  });

  it('supports 4 unique handcrafted stages with valid configurations', () => {
    expect(ROPE_CUT_LEVELS.length).toBe(4);
    for (let i = 0; i < ROPE_CUT_LEVELS.length; i++) {
      const state = createInitialState(i);
      expect(state.ropes.length).toBeGreaterThanOrEqual(1);
      expect(state.stars.length).toBe(3);
      expect(state.piggy.x).toBeGreaterThan(0);
    }
  });
});

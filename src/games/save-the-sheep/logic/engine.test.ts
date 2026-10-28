import { describe, expect, it } from 'bun:test';
import {
  addDrawnPoint,
  createInitialSheepState,
  distToSegment,
  finishDrawingAndStartSimulation,
  stepSheepPhysics,
} from './engine';

describe('Save The Sheep Logic Engine', () => {
  it('initializes Level 1 with sheep, platforms, and beehives', () => {
    const state = createInitialSheepState(1);
    expect(state.level).toBe(1);
    expect(state.status).toBe('drawing');
    expect(state.sheep.x).toBe(200);
    expect(state.sheep.y).toBe(350);
    expect(state.platforms.length).toBeGreaterThan(0);
    expect(state.beehives.length).toBeGreaterThan(0);
    expect(state.usedInk).toBe(0);
    expect(state.maxInk).toBe(400);
  });

  it('draws line points and consumes ink accurately', () => {
    const state = createInitialSheepState(1);
    expect(addDrawnPoint(state, { x: 100, y: 100 })).toBe(true);
    expect(addDrawnPoint(state, { x: 100, y: 150 })).toBe(true); // +50 px
    expect(state.usedInk).toBe(50);
    expect(state.drawnPoints.length).toBe(2);
  });

  it('prevents drawing when ink is exhausted', () => {
    const state = createInitialSheepState(1);
    state.usedInk = 390;
    state.drawnPoints = [{ x: 100, y: 100 }];

    // Attempting a 50px line when only 10px ink is left
    const added = addDrawnPoint(state, { x: 100, y: 150 });
    expect(added).toBe(false);
  });

  it('calculates point-to-segment distance correctly', () => {
    const p = { x: 10, y: 5 };
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 20, y: 0 };
    const { dist, closest } = distToSegment(p, p1, p2);
    expect(dist).toBe(5);
    expect(closest.x).toBe(10);
    expect(closest.y).toBe(0);
  });

  it('finishes drawing, creates fence segments, spawns bees, and sets stars', () => {
    const state = createInitialSheepState(1);
    addDrawnPoint(state, { x: 100, y: 200 });
    addDrawnPoint(state, { x: 300, y: 200 }); // 200 px ink (50% of 400 = 2 stars)

    const started = finishDrawingAndStartSimulation(state);
    expect(started).toBe(true);
    expect(state.status).toBe('simulating');
    expect(state.fenceSegments.length).toBe(1);
    expect(state.bees.length).toBeGreaterThan(0);
    expect(state.stars).toBe(2);
  });

  it('keeps sheep grounded on grass platform', () => {
    const state = createInitialSheepState(1);
    addDrawnPoint(state, { x: 50, y: 100 });
    addDrawnPoint(state, { x: 100, y: 100 });
    finishDrawingAndStartSimulation(state);

    // Initial platform is at y: 380, sheep at y: 350 (radius 24, resting at y: 356)
    for (let i = 0; i < 5; i++) {
      stepSheepPhysics(state, 0.05);
    }
    expect(state.sheep.isGrounded).toBe(true);
    expect(state.status).toBe('simulating');
  });

  it('triggers game over if sheep falls into spikes', () => {
    const state = createInitialSheepState(2); // Level 2 has spikes at y: 550
    addDrawnPoint(state, { x: 50, y: 100 });
    addDrawnPoint(state, { x: 100, y: 100 });
    finishDrawingAndStartSimulation(state);

    // Drop sheep onto spikes
    state.sheep.x = 180;
    state.sheep.y = 540;

    const res = stepSheepPhysics(state, 0.05);
    expect(res.events.sheepFell).toBe(true);
    expect(res.state.status).toBe('game_over');
  });

  it('deflects bees when they collide with fence', () => {
    const state = createInitialSheepState(1);
    // Draw horizontal fence directly between hive (y: 120) and sheep (y: 350)
    addDrawnPoint(state, { x: 50, y: 220 });
    addDrawnPoint(state, { x: 350, y: 220 });
    finishDrawingAndStartSimulation(state);

    // Position a bee right above fence moving downward
    const bee = state.bees[0];
    bee.x = 200;
    bee.y = 210;
    bee.vy = 150;

    const res = stepSheepPhysics(state, 0.05);
    expect(res.events.fenceDeflectedBee).toBe(true);
  });

  it('triggers game over when a bee stings the sheep', () => {
    const state = createInitialSheepState(1);
    addDrawnPoint(state, { x: 50, y: 100 });
    addDrawnPoint(state, { x: 100, y: 100 });
    finishDrawingAndStartSimulation(state);

    // Place a bee touching the sheep
    const bee = state.bees[0];
    bee.x = state.sheep.x + 5;
    bee.y = state.sheep.y;

    const res = stepSheepPhysics(state, 0.02);
    expect(res.events.sheepStung).toBe(true);
    expect(res.state.status).toBe('game_over');
  });

  it('triggers level cleared when surviving the full 5 seconds', () => {
    const state = createInitialSheepState(1);
    addDrawnPoint(state, { x: 50, y: 220 });
    addDrawnPoint(state, { x: 350, y: 220 });
    finishDrawingAndStartSimulation(state);

    state.survivalTimer = 0.05;
    // Clear bees so sheep doesn't get stung at the last frame
    state.bees = [];

    const res = stepSheepPhysics(state, 0.1);
    expect(res.events.levelCompleted).toBe(true);
    expect(res.state.status).toBe('level_cleared');
  });
});

import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  getRingPoints,
  startPull,
  updatePull,
  releasePull,
  calculateTrajectory,
  updateEngine,
  nextStage,
  resetStage,
  STAGE_CONFIGS,
} from './engine';

describe('Duck Archery Range Logic Engine', () => {
  it('initializes stage 1 properly with correct default parameters', () => {
    const state = createInitialState(1, 500);
    expect(state.stage).toBe(1);
    expect(state.status).toBe('aiming');
    expect(state.arrowsLeft).toBe(6);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.targets.length).toBeGreaterThanOrEqual(1);
    expect(state.apples.length).toBe(1);
    expect(state.arrow).toBeNull();
  });

  it('accurately evaluates target rings and points based on radius', () => {
    const bullseye = getRingPoints(10);
    expect(bullseye).not.toBeNull();
    expect(bullseye?.ring).toBe('bullseye');
    expect(bullseye?.points).toBe(100);

    const red = getRingPoints(22);
    expect(red?.ring).toBe('red');
    expect(red?.points).toBe(50);

    const blue = getRingPoints(35);
    expect(blue?.ring).toBe('blue');
    expect(blue?.points).toBe(25);

    const white = getRingPoints(50);
    expect(white?.ring).toBe('white');
    expect(white?.points).toBe(10);

    const miss = getRingPoints(65);
    expect(miss).toBeNull();
  });

  it('handles pulling mechanics and clamps maximum pull distance', () => {
    let state = createInitialState(1);
    state = startPull(state, 200, 300);
    expect(state.isPulling).toBe(true);
    expect(state.pullStartX).toBe(200);

    // Pull backward by 150px (should clamp to MAX_PULL = 100)
    state = updatePull(state, 50, 300);
    expect(state.pullDistance).toBe(100);
  });

  it('rejects tiny taps (< 14px) on release to prevent accidental fires', () => {
    let state = createInitialState(1);
    state = startPull(state, 200, 300);
    state = updatePull(state, 195, 300); // Only 5px
    const result = releasePull(state);
    expect(result.state.arrow).toBeNull();
    expect(result.state.arrowsLeft).toBe(6); // Arrow not consumed
  });

  it('successfully fires arrow on valid release with proper velocity', () => {
    let state = createInitialState(1);
    state = startPull(state, 200, 300);
    state = updatePull(state, 130, 300); // 70px pull
    const result = releasePull(state);
    expect(result.state.status).toBe('arrow_flying');
    expect(result.state.arrowsLeft).toBe(5);
    expect(result.state.arrow).not.toBeNull();
    expect(result.state.arrow?.vx).toBeGreaterThan(0); // Flying forward
    expect(result.event?.type).toBe('bow_release');
  });

  it('calculates trajectory points affected by gravity', () => {
    const points = calculateTrajectory(85, 420, 500, -100, 0, 10, 0.04);
    expect(points.length).toBe(10);
    expect(points[0]?.x).toBe(85);
    expect(points[9]?.x).toBeGreaterThan(points[0]?.x ?? 0);
  });

  it('detects collision with target bullseye and awards points', () => {
    let state = createInitialState(1);
    // Position target right in front of arrow
    state.targets[0]!.x = 250;
    state.targets[0]!.y = 420;
    state.targets[0]!.baseX = 250;
    state.targets[0]!.baseY = 420;

    state.status = 'arrow_flying';
    state.arrow = {
      id: 'test-arrow',
      x: 227.2,
      y: 420,
      vx: 800,
      vy: 0,
      angle: 0,
      isActive: true,
      flightTime: 0.1,
    };

    const { state: nextSt, events } = updateEngine(state, 0.001);
    expect(events.some((e) => e.type === 'target_hit')).toBe(true);
    expect(nextSt.score).toBeGreaterThanOrEqual(100);
    expect(nextSt.targets[0]!.stuckArrows.length).toBe(1);
  });

  it('detects apple hit, triggers juice particles, and awards 150 points', () => {
    let state = createInitialState(1);
    state.apples = [{ id: 'test-apple', x: 250, y: 400, radius: 14, points: 150, isHit: false }];
    state.status = 'arrow_flying';
    state.arrow = {
      id: 'test-arrow',
      x: 235,
      y: 400,
      vx: 500,
      vy: 0,
      angle: 0,
      isActive: true,
      flightTime: 0.1,
    };

    const { state: nextSt, events } = updateEngine(state, 0.02);
    expect(events.some((e) => e.type === 'apple_hit')).toBe(true);
    expect(nextSt.apples[0]!.isHit).toBe(true);
    expect(nextSt.score).toBe(150);
  });

  it('detects bell hit and awards bonus arrow', () => {
    let state = createInitialState(2);
    state.arrowsLeft = 3;
    state.bells = [{ id: 'test-bell', x: 260, y: 350, radius: 16, points: 75, isHit: false }];
    state.status = 'arrow_flying';
    state.arrow = {
      id: 'test-arrow',
      x: 245,
      y: 350,
      vx: 500,
      vy: 0,
      angle: 0,
      isActive: true,
      flightTime: 0.1,
    };

    const { state: nextSt, events } = updateEngine(state, 0.02);
    expect(events.some((e) => e.type === 'bell_hit')).toBe(true);
    expect(nextSt.arrowsLeft).toBe(4); // +1 Arrow awarded
  });

  it('clears stage when target score is achieved and advances to next stage', () => {
    let state = createInitialState(1);
    state.score = 260; // Target is 250
    state.status = 'arrow_flying';
    state.arrow = {
      id: 'finishing-arrow',
      x: 600, // Out of bounds
      y: 800,
      vx: 400,
      vy: 400,
      angle: 0,
      isActive: false,
      flightTime: 2.0,
    };

    const { state: clearedSt } = updateEngine(state, 0.05);
    expect(clearedSt.status).toBe('stage_cleared');

    const nextSt = nextStage(clearedSt);
    expect(nextSt.stage).toBe(2);
    expect(nextSt.status).toBe('aiming');
    expect(nextSt.arrowsLeft).toBe(STAGE_CONFIGS[1]!.arrowsGiven);
  });

  it('resets current stage without losing score progress', () => {
    let state = createInitialState(2);
    state.arrowsLeft = 1;
    const reset = resetStage(state);
    expect(reset.stage).toBe(2);
    expect(reset.status).toBe('aiming');
    expect(reset.arrowsLeft).toBe(STAGE_CONFIGS[1]!.arrowsGiven);
  });
});

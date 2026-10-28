import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  distToSegment,
  startAim,
  updateAim,
  releaseAim,
  getScoreRating,
  updateEngine,
  nextHole,
  resetHole,
  HOLE_CONFIGS,
} from './engine';

describe('Corgi Mini Golf Logic Engine', () => {
  it('initializes Hole 1 properly with correct defaults', () => {
    const state = createInitialState(0, 400);
    expect(state.holeIndex).toBe(0);
    expect(state.strokesInHole).toBe(0);
    expect(state.totalStrokes).toBe(0);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(400);
    expect(state.ball.x).toBe(HOLE_CONFIGS[0]!.ballStart.x);
    expect(state.ball.y).toBe(HOLE_CONFIGS[0]!.ballStart.y);
    expect(state.ball.isMoving).toBe(false);
    expect(state.ball.isPotted).toBe(false);
    expect(state.bones.length).toBeGreaterThanOrEqual(1);
  });

  it('accurately computes distance and normal vector to line segments', () => {
    // Horizontal segment from (100, 200) to (300, 200)
    // Point at (200, 250) is 50px below
    const seg = distToSegment(200, 250, 100, 200, 300, 200);
    expect(seg.dist).toBe(50);
    expect(seg.closestX).toBe(200);
    expect(seg.closestY).toBe(200);
    expect(seg.normalY).toBeGreaterThan(0); // Points downward towards ball
  });

  it('handles aiming pull and clamps power within 0 to 100 range', () => {
    let state = createInitialState(0);
    state = startAim(state, 250, 600);
    expect(state.isAiming).toBe(true);

    // Pull back 45px (half of 90px max)
    state = updateAim(state, 250, 645);
    expect(state.aimPower).toBeCloseTo(50, 0);

    // Pull back 150px (should clamp to 100)
    state = updateAim(state, 250, 750);
    expect(state.aimPower).toBe(100);
  });

  it('rejects jitter taps (< 10px) on release to prevent accidental putts', () => {
    let state = createInitialState(0);
    state = startAim(state, 250, 600);
    state = updateAim(state, 250, 605); // 5px
    const result = releaseAim(state);
    expect(result.state.ball.isMoving).toBe(false);
    expect(result.state.strokesInHole).toBe(0);
  });

  it('launches ball on valid release and increments stroke counter', () => {
    let state = createInitialState(0);
    state = startAim(state, 250, 600);
    state = updateAim(state, 250, 650); // 50px
    const result = releaseAim(state);
    expect(result.state.status).toBe('ball_rolling');
    expect(result.state.ball.isMoving).toBe(true);
    expect(result.state.strokesInHole).toBe(1);
    expect(result.event?.type).toBe('putt_hit');
  });

  it('returns authentic golf score ratings for various strokes vs par', () => {
    expect(getScoreRating(1, 3).label).toContain('HOLE-IN-ONE');
    expect(getScoreRating(1, 3).points).toBe(500);

    expect(getScoreRating(2, 4).label).toContain('EAGLE');
    expect(getScoreRating(2, 3).label).toContain('BIRDIE');
    expect(getScoreRating(3, 3).label).toContain('PAR');
    expect(getScoreRating(4, 3).label).toContain('BOGEY');
    expect(getScoreRating(5, 3).label).toContain('DOUBLE BOGEY');
  });

  it('reflects velocity off wooden walls with restitution damping', () => {
    let state = createInitialState(0);
    state.ball.x = 95; // Near left wall at x = 90
    state.ball.y = 300;
    state.ball.vx = -200; // Moving left into wall
    state.ball.vy = 0;
    state.ball.isMoving = true;
    state.status = 'ball_rolling';

    const { state: nextSt, events } = updateEngine(state, 0.02);
    expect(events.some((e) => e.type === 'rail_bounce')).toBe(true);
    expect(nextSt.ball.vx).toBeGreaterThan(0); // Bounced back to the right!
  });

  it('bounces off round bumpers with bounce power boost', () => {
    let state = createInitialState(0);
    // Bumper 1 is at (180, 360, radius: 20)
    state.ball.x = 180;
    state.ball.y = 390; // Approaching from below
    state.ball.vx = 0;
    state.ball.vy = -200;
    state.ball.isMoving = true;
    state.status = 'ball_rolling';

    const { state: nextSt, events } = updateEngine(state, 0.02);
    expect(events.some((e) => e.type === 'bumper_bounce')).toBe(true);
    expect(nextSt.ball.vy).toBeGreaterThan(0); // Bounced downward
  });

  it('pots ball in cup when within cup radius at low speed', () => {
    let state = createInitialState(0);
    const cup = HOLE_CONFIGS[0]!.cup;
    state.ball.x = cup.x + 3;
    state.ball.y = cup.y + 3;
    state.ball.vx = 20;
    state.ball.vy = 20;
    state.ball.isMoving = true;
    state.status = 'ball_rolling';

    const { state: nextSt, events } = updateEngine(state, 0.02);
    expect(events.some((e) => e.type === 'cup_sink')).toBe(true);
    expect(nextSt.ball.isPotted).toBe(true);
  });

  it('collects bonus bones when ball rolls over them', () => {
    let state = createInitialState(0);
    const bone = state.bones[0]!;
    state.ball.x = bone.x;
    state.ball.y = bone.y;
    state.ball.vx = 40;
    state.ball.vy = 0;
    state.ball.isMoving = true;
    state.status = 'ball_rolling';

    const { state: nextSt, events } = updateEngine(state, 0.02);
    expect(events.some((e) => e.type === 'bone_collect')).toBe(true);
    expect(nextSt.bones[0]!.isCollected).toBe(true);
    expect(nextSt.score).toBe(100);
  });

  it('advances to next hole and resets ball position', () => {
    let state = createInitialState(0);
    state.strokesInHole = 3;
    const nextSt = nextHole(state);
    expect(nextSt.holeIndex).toBe(1);
    expect(nextSt.strokesInHole).toBe(0);
    expect(nextSt.ball.x).toBe(HOLE_CONFIGS[1]!.ballStart.x);
    expect(nextSt.ball.y).toBe(HOLE_CONFIGS[1]!.ballStart.y);
  });

  it('resets current hole properly', () => {
    let state = createInitialState(1);
    state.strokesInHole = 2;
    const resetSt = resetHole(state);
    expect(resetSt.holeIndex).toBe(1);
    expect(resetSt.strokesInHole).toBe(0);
  });
});

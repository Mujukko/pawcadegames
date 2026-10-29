import { describe, it, expect } from 'bun:test';
import {
  initGame,
  resetToCheckpoint,
  stepStuntGame,
  getClosestPointOnSegment,
  calculateStars,
  AIR_TORQUE,
} from './engine';
import { ControlInput } from './types';
import { ALL_TRACKS } from './tracks';

const EMPTY_INPUT: ControlInput = {
  throttle: 0,
  brake: 0,
  tiltLeft: false,
  tiltRight: false,
};

describe('Tractor Stunt Trials: Pasture Splash Logic Engine', () => {
  it('initializes game with valid defaults, ready status, and wheels grounded', () => {
    const state = initGame(0);
    expect(state.status).toBe('ready');
    expect(state.trackIndex).toBe(0);
    expect(state.elapsedTime).toBe(0);
    expect(state.timeBonus).toBe(0);
    expect(state.flipsCount.backflips).toBe(0);
    expect(state.flipsCount.frontflips).toBe(0);
    expect(state.tractor.rearWheel.isGrounded).toBe(true);
    expect(state.tractor.frontWheel.isGrounded).toBe(true);
    expect(state.tractor.isCrashed).toBe(false);
  });

  it('calculates closest point on terrain segment accurately', () => {
    // Segment from (0, 100) to (100, 100)
    const p1 = getClosestPointOnSegment(50, 50, 0, 100, 100, 100);
    expect(p1.x).toBe(50);
    expect(p1.y).toBe(100);
    expect(p1.distSq).toBe(2500); // 50^2

    // Clamping to start point
    const pStart = getClosestPointOnSegment(-20, 100, 0, 100, 100, 100);
    expect(pStart.x).toBe(0);
    expect(pStart.y).toBe(100);

    // Clamping to end point
    const pEnd = getClosestPointOnSegment(120, 100, 0, 100, 100, 100);
    expect(pEnd.x).toBe(100);
    expect(pEnd.y).toBe(100);
  });

  it('transitions from ready to playing on first control input', () => {
    const state = initGame(0);
    expect(state.status).toBe('ready');

    const input: ControlInput = { ...EMPTY_INPUT, throttle: 1 };
    const next = stepStuntGame(state, input, 0.016);
    expect(next.status).toBe('playing');
    expect(next.elapsedTime).toBeGreaterThan(0);
  });

  it('accelerates tractor forward when throttle is pressed on ground', () => {
    const state = initGame(0);
    const input: ControlInput = { ...EMPTY_INPUT, throttle: 1 };
    let next = stepStuntGame(state, input, 0.016);
    for (let i = 0; i < 10; i++) {
      next = stepStuntGame(next, input, 0.016);
    }
    expect(next.tractor.vx).toBeGreaterThan(0);
    expect(next.tractor.x).toBeGreaterThan(state.tractor.x);
  });

  it('decelerates and reverses wheels when brake is pressed', () => {
    const state = initGame(0);
    const brakeInput: ControlInput = { ...EMPTY_INPUT, brake: 1 };
    let next = stepStuntGame(state, brakeInput, 0.016);
    for (let i = 0; i < 5; i++) {
      next = stepStuntGame(next, brakeInput, 0.016);
    }
    expect(next.tractor.vx).toBeLessThan(0);
  });

  it('applies tilt torque to tractor chassis when airborne', () => {
    const state = initGame(0);
    // Lift into air
    state.status = 'playing';
    state.tractor.y = 100; // high above terrain
    state.tractor.rearWheel.y = 118;
    state.tractor.frontWheel.y = 118;
    state.tractor.rearWheel.isGrounded = false;
    state.tractor.frontWheel.isGrounded = false;
    state.tractor.isGrounded = false;

    // Tilt left (lean back / counter-clockwise)
    const tiltLeftInput: ControlInput = { ...EMPTY_INPUT, tiltLeft: true };
    const tilted = stepStuntGame(state, tiltLeftInput, 0.02);
    expect(tilted.tractor.angularVelocity).toBeLessThan(0);

    // Tilt right (lean forward / clockwise)
    const tiltRightInput: ControlInput = { ...EMPTY_INPUT, tiltRight: true };
    const tiltedRight = stepStuntGame(state, tiltRightInput, 0.02);
    expect(tiltedRight.tractor.angularVelocity).toBeGreaterThan(0);
  });

  it('detects backflip and awards 0.5s time deduction bonus', () => {
    const state = initGame(0);
    state.status = 'playing';
    state.tractor.y = 50; // high in air
    state.tractor.rearWheel.y = 68;
    state.tractor.frontWheel.y = 68;
    state.tractor.rearWheel.isGrounded = false;
    state.tractor.frontWheel.isGrounded = false;
    state.tractor.isGrounded = false;
    // Set airborne angle just before completing a full backflip (-2*PI)
    state.accumulatedAirAngle = -2 * Math.PI + 0.2;
    state.tractor.angularVelocity = -AIR_TORQUE;

    const next = stepStuntGame(state, EMPTY_INPUT, 0.02);
    expect(next.flipsCount.backflips).toBe(1);
    expect(next.timeBonus).toBe(0.5);
    expect(next.floatingTexts.some(ft => ft.text.includes('BACKFLIP!'))).toBe(true);
  });

  it('detects frontflip and awards 0.5s time deduction bonus', () => {
    const state = initGame(0);
    state.status = 'playing';
    state.tractor.y = 50;
    state.tractor.rearWheel.y = 68;
    state.tractor.frontWheel.y = 68;
    state.tractor.rearWheel.isGrounded = false;
    state.tractor.frontWheel.isGrounded = false;
    state.tractor.isGrounded = false;
    // Set airborne angle just before completing a full frontflip (+2*PI)
    state.accumulatedAirAngle = 2 * Math.PI - 0.2;
    state.tractor.angularVelocity = AIR_TORQUE;

    const next = stepStuntGame(state, EMPTY_INPUT, 0.02);
    expect(next.flipsCount.frontflips).toBe(1);
    expect(next.timeBonus).toBe(0.5);
    expect(next.floatingTexts.some(ft => ft.text.includes('FRONTFLIP!'))).toBe(true);
  });

  it('triggers crash when driver head contacts terrain', () => {
    const state = initGame(0);
    state.status = 'playing';
    // Flip tractor upside down so driver head hits the ground at y=450
    state.tractor.angle = Math.PI; // upside down
    state.tractor.y = 440;
    state.tractor.driverHead = { x: 100, y: 450 }; // on ground line

    const next = stepStuntGame(state, EMPTY_INPUT, 0.016);
    expect(next.status).toBe('crashed');
    expect(next.tractor.isCrashed).toBe(true);
  });

  it('finishes track, updates best time, and unlocks next track', () => {
    const state = initGame(0, 1);
    state.status = 'playing';
    state.elapsedTime = 16.5;
    const track = ALL_TRACKS[0];
    state.tractor.x = track.finishX + 5; // crossed finish line

    const next = stepStuntGame(state, EMPTY_INPUT, 0.016);
    expect(next.status).toBe('finished');
    expect(next.unlockedTracks).toBe(2);
    expect(next.trackBestTimes[0]).toBeLessThanOrEqual(16.52);
  });

  it('resets crashed tractor to active checkpoint', () => {
    let state = initGame(0);
    state.status = 'crashed';
    state.activeCheckpointIndex = 0; // First checkpoint
    const cp = ALL_TRACKS[0].checkpoints[0];

    const reset = resetToCheckpoint(state);
    expect(reset.status).toBe('playing');
    expect(reset.tractor.isCrashed).toBe(false);
    expect(reset.tractor.x).toBe(cp.x);
    expect(reset.tractor.vx).toBe(0);
  });

  it('calculates stars based on final times accurately', () => {
    expect(calculateStars(0, 15.0)).toBe(3);
    expect(calculateStars(0, 20.0)).toBe(2);
    expect(calculateStars(0, 30.0)).toBe(1);
  });
});

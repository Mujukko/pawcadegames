import { describe, it, expect } from 'bun:test';
import {
  initializeHorseshoeTwistLevel,
  rotateRing,
  normalizeAngle,
  isRingAlignedWithExit,
  checkLockSolvability,
  HORSESHOE_TWIST_LEVELS,
} from './engine';

describe('Horseshoe Twist: Barn Unlock Core Engine', () => {
  it('initializes Level 1 with 2 rings and exit at 0 degrees', () => {
    const state = initializeHorseshoeTwistLevel(1);
    expect(state.level).toBe(1);
    expect(state.exitAngleDeg).toBe(0);
    expect(state.rings.length).toBe(2);
    expect(state.status).toBe('playing');
    expect(state.movesCount).toBe(0);
  });

  it('normalizes negative and overflowing angles properly', () => {
    expect(normalizeAngle(370)).toBe(10);
    expect(normalizeAngle(-30)).toBe(330);
    expect(normalizeAngle(720)).toBe(0);
  });

  it('detects when a ring notch aligns with the exit angle', () => {
    const ring = {
      id: 0,
      radius: 70,
      currentAngleDeg: 350,
      notches: [{ id: 'n0', angleDeg: 0, widthDeg: 40 }], // half-width is 20 deg
      color: '#f59e0b',
      label: 'Inner Ring',
    };

    // Exit at 0 deg: 350 is within 10 deg of 0, so it aligns!
    expect(isRingAlignedWithExit(ring, 0)).toBe(true);

    // Turn ring to 90 deg -> not aligned with exit 0 deg
    ring.currentAngleDeg = 90;
    expect(isRingAlignedWithExit(ring, 0)).toBe(false);
  });

  it('rotates ring and verifies non-aligned lock is not solved', () => {
    let state = initializeHorseshoeTwistLevel(1);
    // Ring 0 is at 90 deg, Ring 1 is at 180 deg
    expect(checkLockSolvability(state.rings, state.exitAngleDeg)).toBe(false);

    // Rotate ring 0 by 45 deg -> 135 deg
    state = rotateRing(state, 0, 45);
    expect(state.rings[0]!.currentAngleDeg).toBe(135);
    expect(state.movesCount).toBe(1);
    expect(state.status).toBe('playing');
  });

  it('triggers victory when all rings align with exit angle', () => {
    let state = initializeHorseshoeTwistLevel(1);
    // Ring 0 starts at 90 deg. Rotate -90 deg to align at 0 deg
    state = rotateRing(state, 0, -90);
    expect(state.status).toBe('playing'); // Ring 1 still at 180

    // Ring 1 starts at 180 deg. Rotate -180 deg to align at 0 deg
    state = rotateRing(state, 1, -180);
    expect(state.status).toBe('won');
    expect(state.pins[0]!.escaped).toBe(true);
    expect(state.score).toBeGreaterThan(1000);
  });

  it('handles geared rings where rotating one ring moves a linked ring', () => {
    let state = initializeHorseshoeTwistLevel(3);
    // Level 3 has Ring 0 linked to Ring 1 with gearRatio: -1
    const ring0Initial = state.rings[0]!.currentAngleDeg;
    const ring1Initial = state.rings[1]!.currentAngleDeg;

    state = rotateRing(state, 0, 60);

    expect(state.rings[0]!.currentAngleDeg).toBe(normalizeAngle(ring0Initial + 60));
    expect(state.rings[1]!.currentAngleDeg).toBe(normalizeAngle(ring1Initial - 60));
  });
});

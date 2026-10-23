import { describe, it, expect } from 'bun:test';
import {
  initializeEggBusterLevel,
  calculateTrajectory,
  launchEgg,
  stepPhysics,
} from './engine';

describe('Egg Buster: Barnyard Smash Physics Engine', () => {
  it('initializes Level 1 with 3 eggs and 3 targets (1 Fox, 2 Crates)', () => {
    const state = initializeEggBusterLevel(1);
    expect(state.level).toBe(1);
    expect(state.eggsRemaining).toBe(3);
    expect(state.targets.length).toBe(3);
    expect(state.egg).toBeNull();
    expect(state.isWon).toBe(false);
  });

  it('calculates trajectory points given a pull displacement', () => {
    const anchor = { x: 70, y: 320 };
    const points = calculateTrajectory(anchor, 40, 350, 10);
    expect(points.length).toBeGreaterThan(1);
    expect(points[0].x).toBe(70);
    expect(points[0].y).toBe(320);
    // Trajectory moves forward (positive x)
    expect(points[1].x).toBeGreaterThan(points[0].x);
  });

  it('launches an egg projectile when slingshot is released', () => {
    const state = initializeEggBusterLevel(1);
    const launched = launchEgg(state, 30, 360);
    expect(launched.eggsRemaining).toBe(2);
    expect(launched.egg).not.toBeNull();
    expect(launched.egg!.isActive).toBe(true);
    expect(launched.egg!.vx).toBeGreaterThan(0);
  });

  it('steps physics and detects collision with targets', () => {
    const state = initializeEggBusterLevel(1);
    // Artificially place an active egg right in front of crate c1 (x=340, y=350)
    state.egg = {
      x: 335,
      y: 360,
      vx: 200,
      vy: 0,
      radius: 10,
      isActive: true,
      bouncesLeft: 3,
    };

    const { nextState, hitTarget } = stepPhysics(state, 0.05);
    expect(hitTarget).not.toBeNull();
    expect(hitTarget!.id).toBe('c1');
  });

  it('triggers victory when all foxes are eliminated', () => {
    const state = initializeEggBusterLevel(1);
    // Destroy the only fox f1
    state.targets = state.targets.map(t =>
      t.type === 'fox' ? { ...t, isDestroyed: true, hp: 0 } : t
    );
    state.egg = {
      x: 300,
      y: 300,
      vx: 100,
      vy: 100,
      radius: 10,
      isActive: true,
      bouncesLeft: 2,
    };

    const { nextState } = stepPhysics(state, 0.02);
    expect(nextState.isWon).toBe(true);
  });
});

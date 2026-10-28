import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  getRandomDropTier,
  dropBall,
  updatePhysics,
  ANIMAL_TIERS,
  BOX_LEFT,
  BOX_RIGHT,
  BOX_BOTTOM,
  DANGER_Y,
} from './engine';

describe('Animal Suika Drop Logic Engine', () => {
  it('initializes with starter drop tiers, empty balls array, and 0 score', () => {
    const state = createInitialState(100);
    expect(state.balls.length).toBe(0);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(100);
    expect(state.gameOver).toBe(false);
    expect([0, 1, 2]).toContain(state.currentDropTier);
    expect([0, 1, 2]).toContain(state.nextDropTier);
  });

  it('generates only small starter drop tiers (0, 1, or 2)', () => {
    for (let i = 0; i < 30; i++) {
      const tier = getRandomDropTier();
      expect([0, 1, 2]).toContain(tier);
    }
  });

  it('drops a ball within valid container boundaries and updates next drop tier', () => {
    const state = createInitialState();
    state.dropX = 150;
    const oldNext = state.nextDropTier;

    const ball = dropBall(state);
    expect(ball).not.toBeNull();
    expect(state.balls.length).toBe(1);
    expect(state.balls[0]!.x).toBe(150);
    expect(state.balls[0]!.y).toBe(70);
    expect(state.currentDropTier).toBe(oldNext);
  });

  it('clamps drop position if aiming outside the container walls', () => {
    const state = createInitialState();
    state.currentDropTier = 0;
    const r = ANIMAL_TIERS[0]!.radius;

    // Aim too far left
    state.dropX = 5;
    const bLeft = dropBall(state);
    expect(bLeft!.x).toBeGreaterThanOrEqual(BOX_LEFT + r);

    // Aim too far right
    state.dropX = 500;
    const bRight = dropBall(state);
    expect(bRight!.x).toBeLessThanOrEqual(BOX_RIGHT - r);
  });

  it('accelerates dropped balls with gravity and bounces off floor', () => {
    const state = createInitialState();
    state.dropX = 200;
    dropBall(state);

    // Simulate 0.5s of physics
    updatePhysics(state, 0.5);
    const ball = state.balls[0]!;
    expect(ball.y).toBeGreaterThan(70);
    expect(ball.vy).toBeGreaterThan(0);

    // Advance to ground contact
    for (let i = 0; i < 30; i++) {
      updatePhysics(state, 0.05);
    }
    expect(ball.y + ball.radius).toBeLessThanOrEqual(BOX_BOTTOM);
  });

  it('bounces balls off left and right container walls', () => {
    const state = createInitialState();
    state.dropX = BOX_LEFT + 25;
    const ball = dropBall(state)!;
    ball.vx = -120; // moving fast towards left wall

    updatePhysics(state, 0.1);
    expect(ball.x - ball.radius).toBeGreaterThanOrEqual(BOX_LEFT);
    expect(ball.vx).toBeGreaterThan(0); // bounced to the right
  });

  it('separates two different animal tiers without merging', () => {
    const state = createInitialState();
    state.balls = [
      { id: 1, tier: 0, x: 200, y: 400, vx: 0, vy: 0, radius: ANIMAL_TIERS[0]!.radius },
      { id: 2, tier: 1, x: 200, y: 420, vx: 0, vy: 0, radius: ANIMAL_TIERS[1]!.radius },
    ];

    const res = updatePhysics(state, 0.02);
    expect(res.merges.length).toBe(0);
    expect(state.balls.length).toBe(2);
  });

  it('merges two identical tier balls into the next bigger tier', () => {
    const state = createInitialState();
    const r0 = ANIMAL_TIERS[0]!.radius;
    // Two tier 0 Chicks touching each other
    state.balls = [
      { id: 1, tier: 0, x: 200, y: 500, vx: 0, vy: 0, radius: r0 },
      { id: 2, tier: 0, x: 200 + r0, y: 500, vx: 0, vy: 0, radius: r0 },
    ];

    const res = updatePhysics(state, 0.02);
    expect(res.merges.length).toBe(1);
    expect(res.merges[0]!.newTier).toBe(1); // Merged into tier 1 Duckling!
    expect(state.balls.length).toBe(1);
    expect(state.balls[0]!.tier).toBe(1);
    expect(state.score).toBe(ANIMAL_TIERS[1]!.score);
  });

  it('updates high score when current score surpasses it', () => {
    const state = createInitialState(5);
    const r0 = ANIMAL_TIERS[0]!.radius;
    state.balls = [
      { id: 1, tier: 0, x: 200, y: 500, vx: 0, vy: 0, radius: r0 },
      { id: 2, tier: 0, x: 200 + r0, y: 500, vx: 0, vy: 0, radius: r0 },
    ];

    updatePhysics(state, 0.02);
    expect(state.score).toBe(4); // tier 1 score
    expect(state.highScore).toBe(5);

    // Merge to tier 2 (Kitten = +8 points, total 12)
    const r1 = ANIMAL_TIERS[1]!.radius;
    state.balls.push({ id: 3, tier: 1, x: state.balls[0]!.x + r1, y: 500, vx: 0, vy: 0, radius: r1 });
    updatePhysics(state, 0.02);

    expect(state.score).toBe(12);
    expect(state.highScore).toBe(12);
  });

  it('triggers game over when resting above danger line for 2 seconds', () => {
    const state = createInitialState();
    // Stack different animal tiers from floor up past danger line
    const r7 = ANIMAL_TIERS[7]!.radius; // Cow (70)
    const r6 = ANIMAL_TIERS[6]!.radius; // Sheep (60)
    const r5 = ANIMAL_TIERS[5]!.radius; // Piglet (51)
    const r4 = ANIMAL_TIERS[4]!.radius; // Puppy (43)

    const y7 = BOX_BOTTOM - r7;
    const y6 = y7 - r7 - r6;
    const y5 = y6 - r6 - r5;
    const y4 = y5 - r5 - r4; // ~130, top edge = 130 - 43 = 87 < DANGER_Y (110)

    state.balls = [
      { id: 1, tier: 7, x: 200, y: y7, vx: 0, vy: 0, radius: r7 },
      { id: 2, tier: 6, x: 200, y: y6, vx: 0, vy: 0, radius: r6 },
      { id: 3, tier: 5, x: 200, y: y5, vx: 0, vy: 0, radius: r5 },
      { id: 4, tier: 4, x: 200, y: y4, vx: 0, vy: 0, radius: r4 },
    ];

    updatePhysics(state, 1.0);
    expect(state.overflowTimer).toBeGreaterThanOrEqual(1.0);
    expect(state.gameOver).toBe(false);

    updatePhysics(state, 1.1);
    expect(state.gameOver).toBe(true);
  });
});

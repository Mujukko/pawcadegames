import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  createStageState,
  throwCarrot,
  updateEngine,
  nextStage,
  resetStage,
  restartGame,
  normalizeAngle,
  angularDifference,
  MIN_CLASH_ANGLE_DIFF,
  STUMP_CENTER_X,
  STUMP_CENTER_Y,
  STUMP_RADIUS,
} from './engine';

describe('Carrot Target Throw Logic Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialState(1200);
    expect(state.status).toBe('ready');
    expect(state.stage).toBe(1);
    expect(state.totalStages).toBe(4);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(1200);
    expect(state.carrotsRemaining).toBe(6);
    expect(state.totalCarrotsInStage).toBe(6);
    expect(state.stump.radius).toBe(72);
    expect(state.embeddedPegs.length).toBe(1);
    expect(state.bonusFruits.length).toBe(1);
    expect(state.bonusFruits[0].type).toBe('apple');
    expect(state.flyingCarrot).toBeNull();
    expect(state.deflectedCarrot).toBeNull();
  });

  it('normalizes angles and calculates minimal angular difference correctly', () => {
    expect(normalizeAngle(Math.PI * 3)).toBeCloseTo(Math.PI, 4);
    expect(normalizeAngle(-Math.PI * 0.5)).toBeCloseTo(Math.PI * 1.5, 4);

    // Difference between 0.1 rad and 0.2 rad is 0.1 rad
    expect(angularDifference(0.1, 0.2)).toBeCloseTo(0.1, 4);

    // Difference across 0 / 2*PI boundary
    const nearZero = 0.05;
    const nearTwoPi = Math.PI * 2 - 0.05;
    expect(angularDifference(nearZero, nearTwoPi)).toBeCloseTo(0.1, 4);
  });

  it('launches a flying carrot on throw and ignores duplicate throws while flying', () => {
    const initial = createInitialState();
    const { state: thrown, event } = throwCarrot(initial);

    expect(thrown.status).toBe('playing');
    expect(thrown.flyingCarrot).not.toBeNull();
    expect(thrown.flyingCarrot?.y).toBe(465);
    expect(thrown.flyingCarrot?.vy).toBeLessThan(0);
    expect(event?.type).toBe('carrot_thrown');

    // Attempt second throw while first is still in the air
    const { state: duplicate } = throwCarrot(thrown);
    expect(duplicate.flyingCarrot).toBe(thrown.flyingCarrot);
  });

  it('rotates the target stump over time', () => {
    const initial = createInitialState();
    const { state: updated } = updateEngine(initial, 0.05);

    expect(updated.stump.rotation).toBeGreaterThan(0);
    expect(updated.stump.timer).toBeCloseTo(0.05, 3);
  });

  it('successfully embeds a carrot into open wood and awards points', () => {
    let state = createInitialState();
    // Clear initial obstacles for deterministic hit test
    state.embeddedPegs = [];
    state.stump.rotation = 0; // Stump at 0 rotation: bottom impact relAngle is Math.PI / 2

    const { state: thrown } = throwCarrot(state);

    // Simulate flying carrot near impact
    const preImpact = {
      ...thrown,
      flyingCarrot: {
        ...thrown.flyingCarrot!,
        y: STUMP_CENTER_Y + STUMP_RADIUS + 2, // 2px before tip hits
      },
    };

    // Advance 0.01s (vy = -1250 px/s, moves -12.5px, crossing threshold)
    const { state: resolved, events } = updateEngine(preImpact, 0.01);

    expect(resolved.flyingCarrot).toBeNull();
    expect(resolved.carrotsRemaining).toBe(5);
    expect(resolved.score).toBe(100);
    expect(resolved.embeddedPegs.length).toBe(1);
    expect(resolved.embeddedPegs[0].type).toBe('carrot');
    expect(events.some((e) => e.type === 'carrot_stuck')).toBe(true);
  });

  it('detects a clash with an existing peg and triggers game over', () => {
    let state = createInitialState();
    state.stump.rotation = 0;
    // Place an obstacle exactly at Math.PI / 2 (the bottom entry point)
    state.embeddedPegs = [
      {
        id: 'clash-test-obstacle',
        angle: Math.PI / 2,
        type: 'wood_obstacle',
      },
    ];

    const { state: thrown } = throwCarrot(state);

    const preImpact = {
      ...thrown,
      flyingCarrot: {
        ...thrown.flyingCarrot!,
        y: STUMP_CENTER_Y + STUMP_RADIUS + 2,
      },
    };

    const { state: clashing, events } = updateEngine(preImpact, 0.01);

    expect(clashing.status).toBe('game_over');
    expect(clashing.flyingCarrot).toBeNull();
    expect(clashing.deflectedCarrot).not.toBeNull();
    expect(events.some((e) => e.type === 'carrot_clash')).toBe(true);
    expect(events.some((e) => e.type === 'game_over')).toBe(true);
  });

  it('slices bonus fruit when throwing close to fruit position', () => {
    let state = createInitialState();
    state.stump.rotation = 0;
    // Place a fruit exactly at Math.PI / 2
    state.embeddedPegs = []; // No clash
    state.bonusFruits = [
      {
        id: 'apple-test',
        angle: Math.PI / 2,
        type: 'apple',
        points: 250,
        isSliced: false,
      },
    ];

    const { state: thrown } = throwCarrot(state);

    const preImpact = {
      ...thrown,
      flyingCarrot: {
        ...thrown.flyingCarrot!,
        y: STUMP_CENTER_Y + STUMP_RADIUS + 2,
      },
    };

    const { state: resolved, events } = updateEngine(preImpact, 0.01);

    expect(resolved.score).toBe(100 + 250); // 100 for stick + 250 for apple
    expect(resolved.bonusFruits[0].isSliced).toBe(true);
    expect(events.some((e) => e.type === 'fruit_sliced')).toBe(true);
  });

  it('triggers stage_cleared when all carrots in stage are embedded', () => {
    let state = createInitialState();
    state.carrotsRemaining = 1;
    state.embeddedPegs = [];
    state.stump.rotation = 0;

    const { state: thrown } = throwCarrot(state);
    const preImpact = {
      ...thrown,
      flyingCarrot: {
        ...thrown.flyingCarrot!,
        y: STUMP_CENTER_Y + STUMP_RADIUS + 2,
      },
    };

    const { state: resolved, events } = updateEngine(preImpact, 0.01);

    expect(resolved.carrotsRemaining).toBe(0);
    expect(resolved.status).toBe('stage_cleared');
    expect(events.some((e) => e.type === 'stage_clear')).toBe(true);
  });

  it('triggers victory when final stage (stage 4) is cleared', () => {
    let state = createStageState(4, 3000, 3000);
    state.carrotsRemaining = 1;
    state.embeddedPegs = [];
    state.stump.rotation = 0;

    const { state: thrown } = throwCarrot(state);
    const preImpact = {
      ...thrown,
      flyingCarrot: {
        ...thrown.flyingCarrot!,
        y: STUMP_CENTER_Y + STUMP_RADIUS + 2,
      },
    };

    const { state: resolved, events } = updateEngine(preImpact, 0.01);

    expect(resolved.carrotsRemaining).toBe(0);
    expect(resolved.status).toBe('victory');
    expect(events.some((e) => e.type === 'victory')).toBe(true);
  });

  it('advances stages and resets properly', () => {
    const s1 = createInitialState(500);
    const s2 = nextStage(s1);

    expect(s2.stage).toBe(2);
    expect(s2.carrotsRemaining).toBe(7);

    const restarted = restartGame(s2);
    expect(restarted.stage).toBe(1);
    expect(restarted.score).toBe(0);
    expect(restarted.highScore).toBe(500);
  });
});

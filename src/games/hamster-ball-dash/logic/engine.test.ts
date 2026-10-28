import { describe, expect, it } from 'bun:test';
import {
  BALL_RADIUS,
  BASE_FORWARD_SPEED,
  createInitialHamsterState,
  createLevel,
  stepHamsterPhysics,
} from './engine';

describe('Hamster Ball Dash Engine', () => {
  it('creates level 1 with valid track segments, seeds, and checkpoints', () => {
    const level = createLevel(1);
    expect(level.levelNumber).toBe(1);
    expect(level.lengthY).toBe(3200);
    expect(level.trackWidth).toBe(260);
    expect(level.segments.length).toBeGreaterThan(0);
    expect(level.seeds.length).toBeGreaterThan(10);
    expect(level.checkpoints.length).toBeGreaterThan(0);
    expect(level.boostPads.length).toBeGreaterThan(0);
  });

  it('initializes hamster ball at start position with full lives and 0 score', () => {
    const { state, level } = createInitialHamsterState(1);
    expect(state.status).toBe('ready');
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.seedsCollected).toBe(0);
    expect(state.x).toBe(200);
    expect(state.y).toBe(40);
    expect(state.z).toBe(0);
    expect(level.levelNumber).toBe(1);
  });

  it('rolls forward when playing', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';

    const prevY = state.y;
    const { state: nextState } = stepHamsterPhysics(
      state,
      level,
      { steer: 0, accelerate: 0, brake: false },
      0.1
    );

    expect(nextState.y).toBeGreaterThan(prevY);
    expect(nextState.rollAngle).toBeGreaterThan(0);
  });

  it('steers laterally when steering input is given', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';

    const startX = state.x;
    // Steer right
    const { state: rightState } = stepHamsterPhysics(
      state,
      level,
      { steer: 1, accelerate: 0, brake: false },
      0.1
    );

    expect(rightState.vx).toBeGreaterThan(0);
    expect(rightState.x).toBeGreaterThan(startX);
  });

  it('bounces off rails in level 1', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';
    // Move ball near left rail
    const segment = level.segments[0];
    const minX = segment.centerX - segment.trackWidth / 2;
    state.x = minX;
    state.vx = -100;

    const { state: bouncedState } = stepHamsterPhysics(
      state,
      level,
      { steer: -1, accelerate: 0, brake: false },
      0.05
    );

    // Ball should be clamped inside rail and reversed velocity
    expect(bouncedState.x).toBeGreaterThanOrEqual(minX + BALL_RADIUS);
    expect(bouncedState.vx).toBeGreaterThan(0);
  });

  it('collects sunflower seeds and increments score', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';

    // Place a seed directly in front of hamster
    const targetSeed = level.seeds[0];
    state.x = targetSeed.x;
    state.y = targetSeed.y - 10;

    const { state: nextState, events } = stepHamsterPhysics(
      state,
      level,
      { steer: 0, accelerate: 0, brake: false },
      0.1
    );

    expect(events.seedCollected).toBe(true);
    expect(targetSeed.collected).toBe(true);
    expect(nextState.seedsCollected).toBe(1);
    expect(nextState.score).toBeGreaterThan(0);
  });

  it('activates turbo boost when hitting a boost pad', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';

    // Find first boost pad
    const pad = level.boostPads.find((p) => p.type === 'boost')!;
    state.x = pad.x;
    state.y = pad.y;

    const { state: nextState, events } = stepHamsterPhysics(
      state,
      level,
      { steer: 0, accelerate: 0, brake: false },
      0.05
    );

    expect(events.boostActivated).toBe(true);
    expect(nextState.boostTimer).toBeGreaterThan(0);
  });

  it('launches into the air on ramp jump and lands back', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';

    // Find ramp pad
    let ramp = level.boostPads.find((p) => p.type === 'ramp');
    if (!ramp) {
      ramp = {
        id: 'test-ramp',
        x: 200,
        y: 100,
        width: 80,
        length: 60,
        type: 'ramp',
      };
      level.boostPads.push(ramp);
    }

    state.x = ramp.x;
    state.y = ramp.y;

    const { state: jumpState, events } = stepHamsterPhysics(
      state,
      level,
      { steer: 0, accelerate: 0, brake: false },
      0.02
    );

    expect(events.rampJumped).toBe(true);
    expect(jumpState.isAirborne).toBe(true);
    expect(jumpState.vz).toBeGreaterThan(0);

    // Simulate airborne fall until landing
    let current = jumpState;
    for (let i = 0; i < 60; i++) {
      const res = stepHamsterPhysics(
        current,
        level,
        { steer: 0, accelerate: 0, brake: false },
        0.05
      );
      current = res.state;
      if (!current.isAirborne) break;
    }

    expect(current.isAirborne).toBe(false);
    expect(current.z).toBe(0);
  });

  it('detects fall off edge on open bridges, decreases lives and initiates respawn', () => {
    const { state, level } = createInitialHamsterState(2);
    state.status = 'playing';

    // Move to open bridge section without rails
    const bridgeSeg = level.segments.find((s) => s.type === 'narrow_bridge')!;
    state.y = bridgeSeg.startY + 50;
    // Push far past right ledge
    state.x = bridgeSeg.centerX + bridgeSeg.trackWidth;

    const { state: fallenState, events } = stepHamsterPhysics(
      state,
      level,
      { steer: 1, accelerate: 0, brake: false },
      0.05
    );

    expect(events.fellOff).toBe(true);
    expect(fallenState.isFallen).toBe(true);
    expect(fallenState.lives).toBe(2);
    expect(fallenState.respawnTimer).toBeGreaterThan(0);

    // Simulate respawn timer finish
    let current = fallenState;
    for (let i = 0; i < 30; i++) {
      const res = stepHamsterPhysics(
        current,
        level,
        { steer: 0, accelerate: 0, brake: false },
        0.1
      );
      current = res.state;
      if (!current.isFallen) break;
    }

    expect(current.isFallen).toBe(false);
    expect(current.isInvulnerable).toBe(true);
  });

  it('triggers level cleared when crossing finish line', () => {
    const { state, level } = createInitialHamsterState(1);
    state.status = 'playing';
    state.y = level.lengthY - 5;

    const { state: finishedState, events } = stepHamsterPhysics(
      state,
      level,
      { steer: 0, accelerate: 0, brake: false },
      0.1
    );

    expect(events.levelCompleted).toBe(true);
    expect(finishedState.status).toBe('level_cleared');
  });
});

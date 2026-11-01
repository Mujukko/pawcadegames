import { describe, expect, it } from 'bun:test';
import {
  initRetroBowlPlay,
  stepRetroBowlPlay,
  executeThrow,
} from './engine';

describe('Retro Bowl: Barnyard Gridiron Engine', () => {
  it('initializes play with valid down, yard line, QB, and receivers', () => {
    const state = initRetroBowlPlay(20, 1, 10, 0, 0, 1);
    expect(state.yardLine).toBe(20);
    expect(state.down).toBe(1);
    expect(state.yardsToGo).toBe(10);
    expect(state.phase).toBe('aiming');
    expect(state.qb.x).toBe(16);
    expect(state.receivers.length).toBe(2);
    expect(state.defenders.length).toBe(2);
  });

  it('launches football into air when throw is released with power', () => {
    const state = initRetroBowlPlay(20);
    const { state: next, event } = stepRetroBowlPlay(
      state,
      { isAiming: false, aimAngle: 0, aimPower: 0.8, releaseThrow: true },
      { moveY: 0 },
      0.05
    );

    expect(event).toBe('throw');
    expect(next.phase).toBe('ball_in_air');
    expect(next.ball.inFlight).toBe(true);
    expect(next.ball.vx).toBeGreaterThan(0);
  });

  it('triggers catch when ball lands near a receiver', () => {
    const state = initRetroBowlPlay(20);
    const targetWR = state.receivers[0];

    // Throw right onto the receiver
    const thrownState = executeThrow(state, targetWR.x + 10, targetWR.y);
    targetWR.x = thrownState.ball.targetX;
    targetWR.y = thrownState.ball.targetY;
    thrownState.ball.x = thrownState.ball.targetX - 0.5;
    thrownState.ball.y = thrownState.ball.targetY;

    const { state: next, event } = stepRetroBowlPlay(
      thrownState,
      { isAiming: false, aimAngle: 0, aimPower: 0, releaseThrow: false },
      { moveY: 0 },
      0.05
    );

    expect(event).toBe('catch');
    expect(next.phase).toBe('receiver_running');
    expect(next.controlledReceiverIndex).toBe(0);
  });

  it('triggers incomplete pass when ball lands without receiver', () => {
    const state = initRetroBowlPlay(20);
    const thrownState = executeThrow(state, 50, 10); // Far away
    // Place everyone far away
    thrownState.receivers.forEach((r) => (r.x = 20));
    thrownState.defenders.forEach((d) => (d.x = 20));
    thrownState.ball.x = 50;
    thrownState.ball.y = 10;

    const { state: next, event } = stepRetroBowlPlay(
      thrownState,
      { isAiming: false, aimAngle: 0, aimPower: 0, releaseThrow: false },
      { moveY: 0 },
      0.05
    );

    expect(event).toBe('incomplete');
    expect(next.down).toBe(2);
    expect(next.phase).toBe('play_ended');
  });

  it('triggers touchdown when receiver reaches end zone at yard line 100', () => {
    const state = initRetroBowlPlay(90);
    state.phase = 'receiver_running';
    state.controlledReceiverIndex = 0;
    state.receivers[0].x = 99.5;
    state.receivers[0].y = 80;

    const { state: next, event } = stepRetroBowlPlay(
      state,
      { isAiming: false, aimAngle: 0, aimPower: 0, releaseThrow: false },
      { moveY: 0 },
      0.05
    );

    expect(event).toBe('touchdown');
    expect(next.phase).toBe('touchdown');
    expect(next.score).toBe(7);
  });

  it('triggers first down when receiver gains >= yardsToGo upon tackle', () => {
    const state = initRetroBowlPlay(20, 1, 10);
    state.phase = 'receiver_running';
    state.controlledReceiverIndex = 0;
    // Receiver advanced to 35 (gain of 15 > 10)
    state.receivers[0].x = 35;
    state.receivers[0].y = 80;
    // Defender tackles him
    state.defenders[0].x = 35;
    state.defenders[0].y = 80;

    const { state: next, event } = stepRetroBowlPlay(
      state,
      { isAiming: false, aimAngle: 0, aimPower: 0, releaseThrow: false },
      { moveY: 0 },
      0.05
    );

    expect(event).toBe('first_down');
    expect(next.down).toBe(1);
    expect(next.yardsToGo).toBe(10);
    expect(next.yardLine).toBe(36);
  });
});

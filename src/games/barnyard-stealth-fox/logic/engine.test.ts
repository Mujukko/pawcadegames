import { describe, it, expect } from 'bun:test';
import {
  initStealthGame,
  stepStealthGame,
  calculateStealthStars,
  PLAYER_WALK_SPEED,
  PLAYER_CLIMB_SPEED,
} from './engine';
import { StealthInput } from './types';
import { ALL_STEALTH_LEVELS } from './levels';

const IDLE_INPUT: StealthInput = {
  moveLeft: false,
  moveRight: false,
  moveUp: false,
  moveDown: false,
  action: false,
};

describe('Barnyard Sly Fox: Stealth Heist Logic Engine', () => {
  it('initializes game with valid defaults, ready status, and level data', () => {
    const state = initStealthGame(0);
    expect(state.status).toBe('ready');
    expect(state.levelIndex).toBe(0);
    expect(state.player.x).toBe(ALL_STEALTH_LEVELS[0].playerStartX);
    expect(state.player.floor).toBe(0);
    expect(state.collectedLootValue).toBe(0);
    expect(state.alarmTriggered).toBe(false);
    expect(state.doors.some(d => d.isLocked)).toBe(true);
  });

  it('transitions from ready to playing on input', () => {
    const state = initStealthGame(0);
    const input: StealthInput = { ...IDLE_INPUT, moveRight: true };
    const next = stepStealthGame(state, input, 0.016);
    expect(next.status).toBe('playing');
    expect(next.elapsedTime).toBeGreaterThan(0);
  });

  it('walks player horizontally and updates direction', () => {
    const state = initStealthGame(0);
    state.status = 'playing';

    const moveRight: StealthInput = { ...IDLE_INPUT, moveRight: true };
    const nextRight = stepStealthGame(state, moveRight, 0.1);
    expect(nextRight.player.x).toBeGreaterThan(state.player.x);
    expect(nextRight.player.direction).toBe('right');

    const moveLeft: StealthInput = { ...IDLE_INPUT, moveLeft: true };
    const nextLeft = stepStealthGame(nextRight, moveLeft, 0.1);
    expect(nextLeft.player.x).toBeLessThan(nextRight.player.x);
    expect(nextLeft.player.direction).toBe('left');
  });

  it('climbs ladder up and switches floor when reaching top', () => {
    const state = initStealthGame(0);
    state.status = 'playing';
    const ladder = ALL_STEALTH_LEVELS[0].ladders[0];
    state.player.x = ladder.x;
    state.player.y = ladder.bottomY;
    state.player.floor = ladder.fromFloor;

    const climbUp: StealthInput = { ...IDLE_INPUT, moveUp: true };
    // Step multiple times until reaching top (160px / 110px/s ≈ 1.45s)
    let next = state;
    for (let i = 0; i < 60; i++) {
      next = stepStealthGame(next, climbUp, 0.05);
    }
    expect(next.player.floor).toBe(ladder.toFloor);
    expect(next.player.y).toBe(ladder.topY);
    expect(next.player.isClimbing).toBe(false);
  });

  it('sets isHiding to true when standing inside shadow doorway', () => {
    const state = initStealthGame(0);
    state.status = 'playing';
    const shadow = ALL_STEALTH_LEVELS[0].shadows[0];
    state.player.x = shadow.x + 10;
    state.player.y = shadow.y;
    state.player.floor = shadow.floor;

    const duckInput: StealthInput = { ...IDLE_INPUT, moveDown: true };
    const hidingState = stepStealthGame(state, duckInput, 0.016);
    expect(hidingState.player.isHiding).toBe(true);
  });

  it('alerts patrolling guard and triggers alarm when player is exposed in vision cone', () => {
    const state = initStealthGame(1); // Level 2 has patrolling guard
    state.status = 'playing';
    const guard = state.guards[0]; // Deputy hound on floor 0
    guard.state = 'patrolling';
    guard.direction = 'right';
    guard.x = 200;
    state.player.floor = guard.floor;
    state.player.x = 230; // Ahead of guard in vision cone, outside doorway shadow (260..304)
    state.player.isHiding = false;

    const next = stepStealthGame(state, IDLE_INPUT, 0.016);
    expect(next.guards[0].state).toBe('alerted');
    expect(next.alarmTriggered).toBe(true);
  });

  it('prevents guard detection when player is hiding in shadow', () => {
    const state = initStealthGame(1);
    state.status = 'playing';
    const guard = state.guards[0];
    guard.state = 'patrolling';
    guard.direction = 'right';
    guard.x = 200;

    const shadow = ALL_STEALTH_LEVELS[1].shadows[0]; // doorway at x=260
    state.player.floor = guard.floor;
    state.player.x = shadow.x + 10; // 270
    state.player.isHiding = true;

    const next = stepStealthGame(state, { ...IDLE_INPUT, moveDown: true }, 0.016);
    expect(next.guards[0].state).toBe('patrolling');
    expect(next.alarmTriggered).toBe(false);
  });

  it('knocks out sleeping or unsuspecting guard from behind with action', () => {
    const state = initStealthGame(0);
    state.status = 'playing';
    const sleeper = state.guards[0]; // Barnaby sleeping at x=360
    expect(sleeper.state).toBe('sleeping');

    state.player.floor = sleeper.floor;
    state.player.x = sleeper.x - 15; // Standing close

    const knockoutInput: StealthInput = { ...IDLE_INPUT, action: true };
    const next = stepStealthGame(state, knockoutInput, 0.016);
    expect(next.guards[0].state).toBe('knocked_out');
    expect(next.guards[0].knockoutTimer).toBeGreaterThan(0);
  });

  it('picks locked door over time with action input', () => {
    const state = initStealthGame(0);
    state.status = 'playing';
    const door = state.doors[0];
    expect(door.isLocked).toBe(true);

    state.player.floor = door.floor;
    state.player.x = door.x - 10;

    const pickInput: StealthInput = { ...IDLE_INPUT, action: true };
    let next = stepStealthGame(state, pickInput, 0.1);
    expect(next.player.isPickingLock).toBe(true);
    expect(next.player.pickProgress).toBeGreaterThan(0);

    // Pick for full duration (2.2s at 0.033s/step = 67 steps)
    for (let i = 0; i < 75; i++) {
      next = stepStealthGame(next, pickInput, 0.05);
    }
    expect(next.doors[0].isLocked).toBe(false);
  });

  it('collects loot items and adds keys to inventory', () => {
    const state = initStealthGame(0);
    state.status = 'playing';
    const keyItem = state.loot.find(l => l.type === 'key')!;

    state.player.floor = keyItem.floor;
    state.player.x = keyItem.x;

    const next = stepStealthGame(state, IDLE_INPUT, 0.016);
    expect(next.loot.find(l => l.id === keyItem.id)!.collected).toBe(true);
    expect(next.collectedLootValue).toBe(keyItem.value);
    expect(next.player.keysHeld.bronze).toBe(true);
  });

  it('escapes through exit with target loot, updates best time, and unlocks next level', () => {
    const state = initStealthGame(0, 1);
    state.status = 'playing';
    const level = ALL_STEALTH_LEVELS[0];
    state.collectedLootValue = level.targetLoot + 100;
    state.player.floor = level.escapeFloor;
    state.player.x = level.escapeX;
    state.elapsedTime = 22.0;

    const next = stepStealthGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('escaped');
    expect(next.unlockedLevels).toBe(2);
    expect(next.levelBestTimes[0]).toBe(22.02);
  });

  it('calculates stealth stars based on time and alarm status', () => {
    expect(calculateStealthStars(0, 20.0, false)).toBe(3); // Under par time and stealth clean
    expect(calculateStealthStars(0, 20.0, true)).toBe(2); // Alarm tripped
    expect(calculateStealthStars(0, 55.0, true)).toBe(1); // Slow
  });
});

import { describe, it, expect } from 'bun:test';
import {
  initJumperGame,
  stepJumperGame,
  calculateJumperStars,
  JUMP_IMPULSE,
} from './engine';
import { JumperInput } from './types';

const IDLE_INPUT: JumperInput = {
  moveLeft: false,
  moveRight: false,
  jump: false,
  slide: false,
};

describe('Cluster Rush: Barnyard Truck Jumper Logic Engine', () => {
  it('initializes game with valid defaults, ready status, and player on start truck roof', () => {
    const state = initJumperGame(0);
    expect(state.status).toBe('ready');
    expect(state.player.y).toBe(38);
    expect(state.player.isGrounded).toBe(true);
    expect(state.player.jumpsRemaining).toBe(2);
    expect(state.trucks.length).toBeGreaterThanOrEqual(5);
  });

  it('transitions from ready to playing on input', () => {
    const state = initJumperGame(0);
    const input: JumperInput = { ...IDLE_INPUT, moveRight: true };
    const next = stepJumperGame(state, input, 0.016);
    expect(next.status).toBe('playing');
    expect(next.player.z).toBeGreaterThan(state.player.z);
  });

  it('jumps upward and allows double jump in mid-air', () => {
    const state = initJumperGame(0);
    state.status = 'playing';

    // First Jump
    const jumpInput: JumperInput = { ...IDLE_INPUT, jump: true };
    const jumped = stepJumperGame(state, jumpInput, 0.016);
    expect(jumped.player.vy).toBeGreaterThan(250);
    expect(jumped.player.isGrounded).toBe(false);
    expect(jumped.player.jumpsRemaining).toBe(1);

    // Double Jump in mid-air
    const doubleJumped = stepJumperGame(jumped, jumpInput, 0.016);
    expect(doubleJumped.player.vy).toBeGreaterThan(250);
    expect(doubleJumped.player.jumpsRemaining).toBe(0);
  });

  it('strafes player horizontally within road boundaries', () => {
    const state = initJumperGame(0);
    state.status = 'playing';

    const strafeRight: JumperInput = { ...IDLE_INPUT, moveRight: true };
    const nextRight = stepJumperGame(state, strafeRight, 0.1);
    expect(nextRight.player.x).toBeGreaterThan(state.player.x);

    const strafeLeft: JumperInput = { ...IDLE_INPUT, moveLeft: true };
    const nextLeft = stepJumperGame(nextRight, strafeLeft, 0.1);
    expect(nextLeft.player.x).toBeLessThan(nextRight.player.x);
  });

  it('lands on another truck roof, resets double jump, and increases combo', () => {
    const state = initJumperGame(0);
    state.status = 'playing';
    state.arches = []; // Clear arches for isolated landing test
    const nextTruck = state.trucks[1];

    // Position player directly above next truck
    state.player.x = nextTruck.x;
    state.player.z = nextTruck.z + nextTruck.length / 2;
    state.player.y = nextTruck.height + 2;
    state.player.vy = -50; // falling downward
    state.player.jumpsRemaining = 0;

    const landed = stepJumperGame(state, IDLE_INPUT, 0.016);
    expect(landed.player.isGrounded).toBe(true);
    expect(landed.player.y).toBe(nextTruck.height);
    expect(landed.player.jumpsRemaining).toBe(2);
    expect(landed.comboStreak).toBeGreaterThan(1);
  });

  it('triggers fallen game over when player touches road pavement', () => {
    const state = initJumperGame(0);
    state.status = 'playing';
    state.player.y = -1; // fell below truck roofs onto road

    const next = stepJumperGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('fallen');
  });

  it('allows sliding under low overhead signs safely', () => {
    const state = initJumperGame(0);
    state.status = 'playing';
    const arch = state.arches[0];

    // Position right at arch z
    state.player.z = arch.z;
    state.player.y = 38; // truck roof
    state.player.isSliding = true; // ducking under
    state.player.slideTimer = 0.5;

    const next = stepJumperGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('playing'); // Did not crash!
  });

  it('knocks player off if hitting overhead arch while standing', () => {
    const state = initJumperGame(0);
    state.status = 'playing';
    const arch = state.arches[0];

    state.player.z = arch.z;
    state.player.y = 38;
    state.player.isSliding = false; // Standing tall (38 + 32 = 70 > 46 clearance)

    const next = stepJumperGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('fallen');
  });

  it('collects highway coins and awards score', () => {
    const state = initJumperGame(0);
    state.status = 'playing';
    const coin = state.coins[0];

    state.player.x = coin.x;
    state.player.z = coin.z;
    state.player.y = coin.y;

    const next = stepJumperGame(state, IDLE_INPUT, 0.016);
    expect(next.coins.find(c => c.id === coin.id)!.collected).toBe(true);
    expect(next.score).toBeGreaterThan(0);
  });

  it('achieves victory when reaching target distance', () => {
    const state = initJumperGame(0, 1);
    state.status = 'playing';
    state.player.z = state.targetMeters + 5; // Reached goal

    const next = stepJumperGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('victory');
    expect(next.unlockedLevels).toBe(2);
  });

  it('calculates jumper stars accurately', () => {
    expect(calculateJumperStars(450, 400, 7)).toBe(3);
    expect(calculateJumperStars(450, 400, 3)).toBe(2);
    expect(calculateJumperStars(300, 400, 3)).toBe(1);
  });
});

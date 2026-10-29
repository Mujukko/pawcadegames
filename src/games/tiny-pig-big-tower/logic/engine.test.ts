import { describe, it, expect } from 'bun:test';
import {
  initBigTowerGame,
  stepBigTowerGame,
  respawnPlayer,
  calculateTowerStars,
  JUMP_FORCE,
  WALL_JUMP_FORCE_Y,
  TRAMPOLINE_BOOST,
} from './engine';
import { TowerInput } from './types';

const IDLE_INPUT: TowerInput = {
  moveLeft: false,
  moveRight: false,
  jump: false,
  restart: false,
};

describe('Big Tower Tiny Pig: Silo Clamber Logic Engine', () => {
  it('initializes game with valid defaults and player at entrance checkpoint', () => {
    const state = initBigTowerGame();
    expect(state.status).toBe('ready');
    expect(state.player.x).toBe(state.activeCheckpoint.x);
    expect(state.player.isGrounded).toBe(true);
    expect(state.deathsCount).toBe(0);
    expect(state.checkpoints.length).toBe(4);
    expect(state.blocks.length).toBeGreaterThan(15);
  });

  it('transitions from ready to playing on input', () => {
    const state = initBigTowerGame();
    const input: TowerInput = { ...IDLE_INPUT, moveRight: true };
    const next = stepBigTowerGame(state, input, 0.016);
    expect(next.status).toBe('playing');
    expect(next.elapsedTime).toBeGreaterThan(0);
  });

  it('moves player horizontally and stops at solid walls', () => {
    const state = initBigTowerGame();
    state.status = 'playing';

    const moveRight: TowerInput = { ...IDLE_INPUT, moveRight: true };
    const nextRight = stepBigTowerGame(state, moveRight, 0.05);
    expect(nextRight.player.x).toBeGreaterThan(state.player.x);

    const moveLeft: TowerInput = { ...IDLE_INPUT, moveLeft: true };
    const nextLeft = stepBigTowerGame(nextRight, moveLeft, 0.05);
    expect(nextLeft.player.x).toBeLessThan(nextRight.player.x);
  });

  it('executes ground jump when grounded', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    expect(state.player.isGrounded).toBe(true);

    const jumpInput: TowerInput = { ...IDLE_INPUT, jump: true };
    const jumped = stepBigTowerGame(state, jumpInput, 0.016);
    expect(jumped.player.vy).toBeLessThan(0);
    expect(jumped.player.isGrounded).toBe(false);
  });

  it('wall slides and executes wall jump off vertical surface', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    // Position player next to outer left wall (wall from x:20 to 40)
    state.player.x = 40;
    state.player.y = 1200;
    state.player.vy = 200;
    state.player.isGrounded = false;

    // Push into left wall
    const pushWall: TowerInput = { ...IDLE_INPUT, moveLeft: true };
    const sliding = stepBigTowerGame(state, pushWall, 0.016);
    expect(sliding.player.isWallSliding).toBe(true);
    expect(sliding.player.wallDirection).toBe(-1);

    // Wall Jump
    const wallJumpInput: TowerInput = { ...IDLE_INPUT, jump: true, moveLeft: true };
    const wallJumped = stepBigTowerGame(sliding, wallJumpInput, 0.016);
    expect(wallJumped.player.vy).toBeLessThan(0);
    expect(wallJumped.player.vx).toBeGreaterThan(0); // Kicked to the right!
  });

  it('launches player on trampoline contact', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    const tramp = state.blocks.find(b => b.type === 'trampoline')!;

    state.player.x = tramp.x + 10;
    state.player.y = tramp.y - 2;
    state.player.vy = 100; // falling down onto trampoline

    const next = stepBigTowerGame(state, IDLE_INPUT, 0.016);
    expect(next.player.vy).toBeLessThan(-300);
  });

  it('triggers instant respawn when touching lava syrup', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    const lava = state.blocks.find(b => b.type === 'lava')!;

    state.player.x = lava.x + 10;
    state.player.y = lava.y;

    const next = stepBigTowerGame(state, IDLE_INPUT, 0.016);
    expect(next.deathsCount).toBe(1);
    expect(next.player.x).toBe(state.activeCheckpoint.x);
  });

  it('triggers instant respawn when touching moving laser', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    const laser = state.movingLasers[0];

    state.player.x = laser.x;
    state.player.y = laser.y;

    const next = stepBigTowerGame(state, IDLE_INPUT, 0.016);
    expect(next.deathsCount).toBe(1);
    expect(next.player.x).toBe(state.activeCheckpoint.x);
  });

  it('activates new checkpoint upon contact', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    const cp1 = state.checkpoints[1];

    state.player.x = cp1.x;
    state.player.y = cp1.y;

    const next = stepBigTowerGame(state, IDLE_INPUT, 0.016);
    expect(next.activeCheckpoint.id).toBe(cp1.id);
    expect(next.checkpoints[1].reached).toBe(true);
  });

  it('triggers victory upon reaching the Golden Acorn', () => {
    const state = initBigTowerGame();
    state.status = 'playing';
    const acorn = state.blocks.find(b => b.type === 'golden_acorn')!;

    state.player.x = acorn.x;
    state.player.y = acorn.y;
    state.elapsedTime = 42.0;

    const next = stepBigTowerGame(state, IDLE_INPUT, 0.016);
    expect(next.status).toBe('victory');
    expect(next.bestTimeSeconds).toBeLessThanOrEqual(42.1);
  });

  it('calculates tower stars based on time and death count', () => {
    expect(calculateTowerStars(45, 1)).toBe(3);
    expect(calculateTowerStars(85, 5)).toBe(2);
    expect(calculateTowerStars(120, 15)).toBe(1);
  });
});

import { describe, expect, test } from 'bun:test';
import {
  initializeNinjaChickGame,
  stepNinjaChickGame,
  restartLevel,
  advanceToNextLevel,
} from './engine';

describe('Barnyard Ninja Chick: Silo Parkour Logic Engine', () => {
  test('initializes player at spawn point with valid level defaults', () => {
    const state = initializeNinjaChickGame(0);
    expect(state.player.x).toBe(state.level.spawnPoint.x);
    expect(state.player.y).toBe(state.level.spawnPoint.y);
    expect(state.deaths).toBe(0);
    expect(state.levelCompleted).toBe(false);
    expect(state.level.id).toBe(1);
  });

  test('moves player right when right input is pressed', () => {
    let state = initializeNinjaChickGame(0);
    state.player.isGrounded = true;

    const res = stepNinjaChickGame(state, { left: false, right: true, jump: false, down: false }, 0.03);
    expect(res.state.player.vx).toBeGreaterThan(0);
    expect(res.state.player.facing).toBe(1);
  });

  test('executes ground jump and lifts player into the air', () => {
    let state = initializeNinjaChickGame(0);
    state.player.isGrounded = true;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: true, down: false }, 0.02);
    expect(res.events.jumped).toBe(true);
    expect(res.state.player.vy).toBeLessThan(0);
    expect(res.state.player.isGrounded).toBe(false);
  });

  test('reduces player height during slide / crouch', () => {
    let state = initializeNinjaChickGame(0);
    state.player.isGrounded = true;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: false, down: true }, 0.02);
    expect(res.state.player.isSliding).toBe(true);
    expect(res.state.player.h).toBe(12);
  });

  test('detects wall contact and executes wall jump away from wall', () => {
    let state = initializeNinjaChickGame(0);
    state.player.isOnWallLeft = true;
    state.player.isGrounded = false;

    // Press jump while clinging to left wall
    const res = stepNinjaChickGame(state, { left: false, right: false, jump: true, down: false }, 0.02);
    expect(res.events.wallJumped).toBe(true);
    expect(res.state.player.vx).toBeGreaterThan(0); // leaping away to the right
    expect(res.state.player.vy).toBeLessThan(0);
  });

  test('launches player upward upon hitting a trampoline bouncer', () => {
    let state = initializeNinjaChickGame(0);
    // Position player directly on bouncer (b1 at x:440, y:290)
    state.player.x = 445;
    state.player.y = 285;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: false, down: false }, 0.02);
    expect(res.events.bounced).toBe(true);
    expect(res.state.player.vy).toBeLessThan(-500);
  });

  test('hazard collision kills player, increments deaths, and respawns at checkpoint', () => {
    let state = initializeNinjaChickGame(0);
    const spawnX = state.player.x;
    const spawnY = state.player.y;

    // Place player directly on hazard (spikes at x:340, y:440)
    state.player.x = 340;
    state.player.y = 440;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: false, down: false }, 0.02);
    expect(res.events.playerDied).toBe(true);
    expect(res.state.deaths).toBe(1);
    expect(res.state.player.x).toBe(spawnX);
    expect(res.state.player.y).toBe(spawnY);
  });

  test('activates checkpoint flag when player touches it', () => {
    let state = initializeNinjaChickGame(0);
    const cp = state.level.checkpoints[0];
    state.player.x = cp.x;
    state.player.y = cp.y;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: false, down: false }, 0.02);
    expect(res.events.checkpointActivated).toBe(true);
    expect(res.state.player.activeCheckpoint.x).toBe(cp.x);
  });

  test('collects star coin and awards points', () => {
    let state = initializeNinjaChickGame(0);
    const coin = state.level.starCoins[0];
    state.player.x = coin.x - 9;
    state.player.y = coin.y - 11;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: false, down: false }, 0.02);
    expect(res.events.coinCollected).toBe(true);
    expect(res.state.coinsCollected).toBe(5);
  });

  test('completes level upon touching exit door and advances to next act', () => {
    let state = initializeNinjaChickGame(0);
    const door = state.level.exitDoor;
    state.player.x = door.x;
    state.player.y = door.y;

    const res = stepNinjaChickGame(state, { left: false, right: false, jump: false, down: false }, 0.02);
    expect(res.events.levelCleared).toBe(true);
    expect(res.state.levelCompleted).toBe(true);

    const nextState = advanceToNextLevel(res.state);
    expect(nextState.currentLevelIndex).toBe(1);
    expect(nextState.level.id).toBe(2);
  });
});

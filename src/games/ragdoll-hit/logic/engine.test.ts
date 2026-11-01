import { describe, expect, it } from 'bun:test';
import {
  initRagdollHitGame,
  stepRagdollHitGame,
  TOTAL_ROUNDS,
} from './engine';

describe('Ragdoll Hit: Barnyard Brawler Engine', () => {
  it('initializes game with valid player, enemy, arena bounds, and full health', () => {
    const state = initRagdollHitGame(1);
    expect(state.round).toBe(1);
    expect(state.player.health).toBe(100);
    expect(state.enemy.health).toBeGreaterThan(0);
    expect(state.status).toBe('fighting');
    expect(state.player.isGrounded).toBe(true);
    expect(state.enemy.isGrounded).toBe(true);
  });

  it('moves fighter and applies jump physics', () => {
    const state = initRagdollHitGame(1);
    const { state: next } = stepRagdollHitGame(
      state,
      { moveX: 1, jump: true, attack: false },
      { moveX: 0, jump: false, attack: false },
      0.05
    );

    expect(next.player.vx).toBeGreaterThan(0);
    expect(next.player.vy).toBeLessThan(0); // Jump impulse upward
    expect(next.player.isGrounded).toBe(false);
  });

  it('initiates arm swing upon attack input', () => {
    const state = initRagdollHitGame(1);
    const { state: next } = stepRagdollHitGame(
      state,
      { moveX: 0, jump: false, attack: true },
      { moveX: 0, jump: false, attack: false },
      0.05
    );

    expect(next.player.isAttacking).toBe(true);
    expect(next.player.armAngularVelocity).not.toBe(0);
  });

  it('damages enemy and applies recoil knockback on weapon hit', () => {
    const state = initRagdollHitGame(1);
    // Position player right next to enemy
    state.player.x = 400;
    state.enemy.x = 420;
    state.player.armAngle = Math.PI / 4;
    state.player.isAttacking = true;

    const initialHealth = state.enemy.health;
    const { state: next, event } = stepRagdollHitGame(
      state,
      { moveX: 0, jump: false, attack: false },
      { moveX: 0, jump: false, attack: false },
      0.05
    );

    expect(event).toBe('hit');
    expect(next.enemy.health).toBeLessThan(initialHealth);
    expect(next.enemy.vx).toBeGreaterThan(0); // Pushed back
  });

  it('triggers round_won when enemy health reaches 0 on round 1', () => {
    const state = initRagdollHitGame(1);
    state.player.x = 400;
    state.enemy.x = 420;
    state.player.armAngle = Math.PI / 4;
    state.player.isAttacking = true;
    state.enemy.health = 5; // Low health

    const { state: next, event } = stepRagdollHitGame(
      state,
      { moveX: 0, jump: false, attack: false },
      { moveX: 0, jump: false, attack: false },
      0.05
    );

    expect(next.enemy.health).toBe(0);
    expect(next.enemy.knockedOut).toBe(true);
    expect(event).toBe('round_won');
    expect(next.status).toBe('round_won');
  });

  it('triggers match_victory on final round 3 knockout', () => {
    const state = initRagdollHitGame(TOTAL_ROUNDS);
    state.player.x = 400;
    state.enemy.x = 420;
    state.player.armAngle = Math.PI / 4;
    state.player.isAttacking = true;
    state.enemy.health = 5;

    const { state: next, event } = stepRagdollHitGame(
      state,
      { moveX: 0, jump: false, attack: false },
      { moveX: 0, jump: false, attack: false },
      0.05
    );

    expect(event).toBe('match_victory');
    expect(next.status).toBe('match_victory');
  });
});

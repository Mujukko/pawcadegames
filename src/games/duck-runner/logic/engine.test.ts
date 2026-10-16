import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  jump,
  startCrouch,
  stopCrouch,
  updateGame,
  resetGame,
  getDuckHitbox,
  getObstacleHitbox,
  checkCollision,
} from './engine';
import { DEFAULT_DUCK_CONFIG, DUCK_DIMENSIONS, Obstacle } from './types';

describe('Duck Runner Core Engine', () => {
  it('initializes game state with proper ground and standing duck dimensions', () => {
    const state = createInitialState(150);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(150);
    expect(state.isStarted).toBe(false);
    expect(state.isGameOver).toBe(false);
    expect(state.isGrounded).toBe(true);
    expect(state.duckWidth).toBe(DUCK_DIMENSIONS.standing.width);
    expect(state.duckHeight).toBe(DUCK_DIMENSIONS.standing.height);
    expect(state.duckY).toBe(state.groundY - DUCK_DIMENSIONS.standing.height);
  });

  describe('Jump and Gravity Physics', () => {
    it('applies jump impulse when duck is on the ground', () => {
      let state = createInitialState();
      state = jump(state);

      expect(state.isStarted).toBe(true);
      expect(state.isGrounded).toBe(false);
      expect(state.duckVelocityY).toBe(DEFAULT_DUCK_CONFIG.jumpForce);
      expect(state.pendingSoundEvents).toContain('jump');
    });

    it('does not allow double-jumping while in the air', () => {
      let state = createInitialState();
      state = jump(state);
      const velAfterFirstJump = state.duckVelocityY;

      // Try jumping again while in air
      state = jump(state);
      expect(state.duckVelocityY).toBe(velAfterFirstJump);
    });

    it('brings the jumping duck back to the ground with gravity', () => {
      let state = createInitialState();
      state = jump(state);

      // Simulate 1.5 seconds of game physics
      for (let i = 0; i < 45; i++) {
        state = updateGame(state, 0.033);
      }

      expect(state.isGrounded).toBe(true);
      expect(state.duckY).toBe(state.groundY - DUCK_DIMENSIONS.standing.height);
      expect(state.duckVelocityY).toBe(0);
    });

    it('applies fast-fall gravity when crouching in mid-air', () => {
      let normalState = createInitialState();
      normalState = jump(normalState);

      let fastFallState = createInitialState();
      fastFallState = jump(fastFallState);
      fastFallState = startCrouch(fastFallState);

      // Advance physics by 0.1s
      normalState = updateGame(normalState, 0.1);
      fastFallState = updateGame(fastFallState, 0.1);

      // Fast-fall state should have higher downward velocity (pulled down faster)
      expect(fastFallState.duckVelocityY).toBeGreaterThan(normalState.duckVelocityY);
    });
  });

  describe('Crouch / Ducking Mechanics', () => {
    it('shrinks duck hitbox height while crouching', () => {
      let state = createInitialState();
      state = startCrouch(state);

      expect(state.isCrouching).toBe(true);
      expect(state.duckHeight).toBe(DUCK_DIMENSIONS.crouching.height);
      expect(state.duckWidth).toBe(DUCK_DIMENSIONS.crouching.width);
      expect(state.duckY).toBe(state.groundY - DUCK_DIMENSIONS.crouching.height);
    });

    it('restores standing dimensions when crouch is released', () => {
      let state = createInitialState();
      state = startCrouch(state);
      state = stopCrouch(state);

      expect(state.isCrouching).toBe(false);
      expect(state.duckHeight).toBe(DUCK_DIMENSIONS.standing.height);
      expect(state.duckY).toBe(state.groundY - DUCK_DIMENSIONS.standing.height);
    });
  });

  describe('Obstacle Collision & Evasion', () => {
    it('detects collision when running into a ground hay bale while standing', () => {
      let state = createInitialState();
      state.isStarted = true;

      const hayBale: Obstacle = {
        id: 1,
        type: 'hay_bale_single',
        x: state.duckX + 10, // right in front of the duck
        y: state.groundY - 34,
        width: 32,
        height: 34,
      };
      state.obstacles = [hayBale];

      state = updateGame(state, 0.016);
      expect(state.isGameOver).toBe(true);
      expect(state.pendingSoundEvents).toContain('hit');
    });

    it('clears ground hay bale when jumping over it', () => {
      let state = createInitialState();
      state.isStarted = true;
      // Position duck in the air high above ground
      state.duckY = state.groundY - 120;
      state.isGrounded = false;

      const hayBale: Obstacle = {
        id: 1,
        type: 'hay_bale_single',
        x: state.duckX,
        y: state.groundY - 34,
        width: 32,
        height: 34,
      };
      state.obstacles = [hayBale];

      const duckBox = getDuckHitbox(state);
      const obsBox = getObstacleHitbox(hayBale);
      expect(checkCollision(duckBox, obsBox)).toBe(false);
    });

    it('duck collides with high flying crow when standing, but slides underneath when crouching', () => {
      const standingState = createInitialState();
      const highCrow: Obstacle = {
        id: 2,
        type: 'flying_crow_high',
        x: standingState.duckX,
        y: standingState.groundY - 56, // 56px above ground, height 26 -> bottom is groundY - 30
        width: 44,
        height: 26,
      };

      // 1. Standing: height is 46, top is groundY - 46, overlaps crow!
      const standingDuckBox = getDuckHitbox(standingState);
      const crowBox = getObstacleHitbox(highCrow);
      expect(checkCollision(standingDuckBox, crowBox)).toBe(true);

      // 2. Crouching: height is 24, top is groundY - 24, safely underneath crow (y: groundY - 40)!
      const crouchingState = startCrouch(standingState);
      const crouchingDuckBox = getDuckHitbox(crouchingState);
      expect(checkCollision(crouchingDuckBox, crowBox)).toBe(false);
    });
  });

  describe('Score, Speed, Milestones and Day/Night Progression', () => {
    it('increases distance and score during running simulation', () => {
      let state = createInitialState();
      state.isStarted = true;

      // Simulate 1 second
      state = updateGame(state, 1.0);
      expect(state.distance).toBeGreaterThan(0);
      expect(state.score).toBeGreaterThan(0);
    });

    it('triggers milestone chime when passing 100 points', () => {
      let state = createInitialState();
      state.isStarted = true;
      state.distance = 990; // will cross 1000px = score 100

      state = updateGame(state, 0.1);
      expect(state.score).toBeGreaterThanOrEqual(100);
      expect(state.pendingSoundEvents).toContain('milestone');
    });

    it('increases speed gradually as score rises', () => {
      let state = createInitialState();
      state.isStarted = true;
      state.distance = 2500; // score ~250

      state = updateGame(state, 0.05);
      expect(state.speed).toBeGreaterThan(DEFAULT_DUCK_CONFIG.initialSpeed);
    });

    it('activates night mode when score crosses 600', () => {
      let state = createInitialState();
      state.isStarted = true;
      state.distance = 6100; // score 610

      state = updateGame(state, 0.05);
      expect(state.isNightMode).toBe(true);
    });

    it('resets game state while preserving the achieved high score', () => {
      let state = createInitialState();
      state.isStarted = true;
      state.distance = 3200; // score 320
      state = updateGame(state, 0.05);
      state.isGameOver = true;

      const reset = resetGame(state);
      expect(reset.score).toBe(0);
      expect(reset.highScore).toBe(state.highScore);
      expect(reset.isGameOver).toBe(false);
      expect(reset.isStarted).toBe(true);
      expect(reset.obstacles.length).toBe(0);
    });
  });
});

import { describe, expect, it } from 'bun:test';
import {
  createInitialJumpState,
  updateHorizontalSteering,
  stepJumpPhysics,
  NORMAL_JUMP_VY,
  SPRING_JUMP_VY,
  WORLD_WIDTH,
} from './engine';

describe('Pasture Sheep Jump: Cloud Leap Engine Unit Tests', () => {
  it('initializes with default starting state and platforms', () => {
    const state = createInitialJumpState(1500);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(1500);
    expect(state.altitude).toBe(0);
    expect(state.platforms.length).toBeGreaterThanOrEqual(5);
    expect(state.player.x).toBe(200);
    expect(state.player.vy).toBe(NORMAL_JUMP_VY);
    expect(state.gameOver).toBe(false);
  });

  it('steers player horizontally and wraps around screen edges', () => {
    let player = createInitialJumpState().player;
    // Steer towards 90% right
    player = updateHorizontalSteering(player, 90, 0.1);
    expect(player.facing).toBe('right');

    // Steer off right edge wraps around to left
    player.x = WORLD_WIDTH + 20;
    player = updateHorizontalSteering(player, 100, 0.01);
    expect(player.x).toBeLessThan(0);
  });

  it('bounces when landing on a platform from above', () => {
    const state = createInitialJumpState();
    // Position player directly above base platform (y=500, x=150-250)
    state.player.x = 200;
    state.player.y = 480;
    state.player.vy = 400; // Falling downward

    const result = stepJumpPhysics(state, 0.05);
    expect(result.event).toBe('bounce');
    expect(result.state.player.vy).toBe(NORMAL_JUMP_VY);
  });

  it('ignores platform collision when ascending upward', () => {
    const state = createInitialJumpState();
    state.player.x = 200;
    state.player.y = 500;
    state.player.vy = -500; // Moving upward through platform

    const result = stepJumpPhysics(state, 0.02);
    expect(result.event).toBe('none');
    expect(result.state.player.vy).toBeLessThan(0);
  });

  it('activates super jump boost on spring hay bale', () => {
    const state = createInitialJumpState();
    const springPlat = state.platforms.find((p) => p.type === 'spring')!;
    state.player.x = springPlat.x + springPlat.width / 2;
    state.player.y = springPlat.y - state.player.height / 2;
    state.player.vy = 200; // Falling onto spring

    const result = stepJumpPhysics(state, 0.02);
    expect(result.event).toBe('superbounce');
    expect(result.state.player.vy).toBe(SPRING_JUMP_VY);
    expect(result.state.player.isSuperJumping).toBe(true);
  });

  it('scrolls camera and increases altitude when sheep leaps high', () => {
    const state = createInitialJumpState();
    state.player.y = 200; // Higher than targetScreenY (240)
    state.player.vy = -600;

    const result = stepJumpPhysics(state, 0.05);
    expect(result.state.altitude).toBeGreaterThan(0);
    expect(result.state.score).toBeGreaterThan(0);
  });

  it('collects golden wool bell and awards 200 bonus points', () => {
    const state = createInitialJumpState();
    const bellPlat = state.platforms.find((p) => p.hasBell)!;
    state.player.x = bellPlat.x + bellPlat.width / 2;
    state.player.y = bellPlat.y - 18;

    const result = stepJumpPhysics(state, 0.02);
    expect(result.state.bellsCollected).toBe(1);
    expect(result.state.score).toBeGreaterThanOrEqual(200);
  });

  it('triggers game over when sheep falls off the bottom', () => {
    const state = createInitialJumpState();
    state.player.y = 580; // Past bottom of world
    state.player.vy = 800;

    const result = stepJumpPhysics(state, 0.05);
    expect(result.event).toBe('gameover');
    expect(result.state.gameOver).toBe(true);
  });
});

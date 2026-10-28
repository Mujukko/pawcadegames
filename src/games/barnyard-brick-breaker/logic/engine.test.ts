import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  launchBall,
  updateEngine,
  nextStage,
  restartGame,
  GAME_WIDTH,
  PADDLE_WIDE_WIDTH,
  PADDLE_DEFAULT_WIDTH,
} from './engine';

describe('Barnyard Brick Breaker Logic Engine', () => {
  it('initializes with Stage 1, 3 lives, paddle centered, and ball stuck to paddle', () => {
    const state = createInitialState();
    expect(state.currentStageIndex).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.balls.length).toBe(1);
    expect(state.balls[0]!.stuckToPaddle).toBe(true);
    expect(state.paddle.width).toBe(PADDLE_DEFAULT_WIDTH);
    expect(state.bricks.length).toBeGreaterThan(0);
    expect(state.gameOver).toBe(false);
    expect(state.stageComplete).toBe(false);
  });

  it('launches ball upward upon trigger', () => {
    let state = createInitialState();
    expect(state.balls[0]!.stuckToPaddle).toBe(true);

    state = launchBall(state);
    expect(state.balls[0]!.stuckToPaddle).toBe(false);
    expect(state.balls[0]!.vy).toBeLessThan(0); // Moving upwards
  });

  it('clamps paddle within left and right screen boundaries', () => {
    let state = createInitialState();
    const halfW = state.paddle.width / 2;

    // Target far left (-100)
    state = updateEngine(state, 0.016, -100);
    expect(state.paddle.x).toBe(halfW);

    // Target far right (999)
    state = updateEngine(state, 0.016, 999);
    expect(state.paddle.x).toBe(GAME_WIDTH - halfW);
  });

  it('bounces launched ball off side and top walls', () => {
    let state = createInitialState();
    state = launchBall(state);

    // Place ball near right wall moving right
    state.balls[0]!.x = GAME_WIDTH - 2;
    state.balls[0]!.vx = 200;
    state.balls[0]!.vy = -100;

    state = updateEngine(state, 0.016, GAME_WIDTH / 2);
    expect(state.balls[0]!.vx).toBeLessThan(0); // Bounced left!
    expect(state.lastEvents.some((e) => e.type === 'bounce_wall')).toBe(true);
  });

  it('deflects ball off paddle top and resets combo counter', () => {
    let state = createInitialState();
    state = launchBall(state);
    state.combo = 5;

    // Position ball directly above paddle moving down
    state.balls[0]!.x = state.paddle.x + 10;
    state.balls[0]!.y = state.paddle.y - state.paddle.height / 2 - 2;
    state.balls[0]!.vy = 200;

    state = updateEngine(state, 0.016, state.paddle.x);
    expect(state.balls[0]!.vy).toBeLessThan(0); // Bounced upward
    expect(state.combo).toBe(0); // Combo reset at paddle
    expect(state.lastEvents.some((e) => e.type === 'bounce_paddle')).toBe(true);
  });

  it('hits and destroys a wooden crate, awarding score points', () => {
    let state = createInitialState();
    state = launchBall(state);
    const firstBrick = state.bricks.find((b) => b.type === 'wood_crate')!;

    // Position ball directly colliding with the brick
    state.balls[0]!.x = firstBrick.x;
    state.balls[0]!.y = firstBrick.y + firstBrick.height / 2 + 3;
    state.balls[0]!.vy = -200;

    const initialBrickCount = state.bricks.length;
    state = updateEngine(state, 0.016, state.paddle.x);

    expect(state.bricks.length).toBe(initialBrickCount - 1);
    expect(state.score).toBeGreaterThan(0);
    expect(state.combo).toBe(1);
    expect(state.lastEvents.some((e) => e.type === 'brick_destroyed')).toBe(true);
  });

  it('damages stone brick on first hit and destroys it on second hit', () => {
    let state = createInitialState(1); // Stage 2 has stone bricks
    state = launchBall(state);
    const stoneBrick = state.bricks.find((b) => b.type === 'stone_brick')!;

    // First hit
    state.balls[0]!.x = stoneBrick.x;
    state.balls[0]!.y = stoneBrick.y + stoneBrick.height / 2 + 2;
    state.balls[0]!.vy = -200;

    state = updateEngine(state, 0.016, state.paddle.x);
    const damagedBrick = state.bricks.find((b) => b.id === stoneBrick.id);
    expect(damagedBrick).toBeDefined();
    expect(damagedBrick!.hitsLeft).toBe(1);

    // Second hit
    state.balls[0]!.x = stoneBrick.x;
    state.balls[0]!.y = stoneBrick.y + stoneBrick.height / 2 + 2;
    state.balls[0]!.vy = -200;

    state = updateEngine(state, 0.016, state.paddle.x);
    expect(state.bricks.some((b) => b.id === stoneBrick.id)).toBe(false);
  });

  it('activates wide paddle power-up when collected', () => {
    let state = createInitialState();
    // Drop a wide_paddle powerup right above paddle
    state.powerUps.push({
      id: 99,
      x: state.paddle.x,
      y: state.paddle.y - 5,
      vy: 100,
      type: 'wide_paddle',
    });

    state = updateEngine(state, 0.016, state.paddle.x);
    expect(state.paddle.width).toBe(PADDLE_WIDE_WIDTH);
    expect(state.paddle.wideTimer).toBeGreaterThan(0);
    expect(state.lastEvents.some((e) => e.type === 'collect_powerup')).toBe(true);
  });

  it('decrements life when all balls fall below bottom, and triggers game over at 0 lives', () => {
    let state = createInitialState();
    state = launchBall(state);
    state.lives = 1;

    // Drop ball below screen
    state.balls[0]!.y = 530;

    state = updateEngine(state, 0.016, state.paddle.x);
    expect(state.lives).toBe(0);
    expect(state.gameOver).toBe(true);
    expect(state.lastEvents.some((e) => e.type === 'game_over')).toBe(true);
  });

  it('detects stage clear when all bricks are removed and advances to next stage', () => {
    let state = createInitialState();
    state.bricks = []; // Clear all bricks

    state = updateEngine(state, 0.016, state.paddle.x);
    expect(state.stageComplete).toBe(true);
    expect(state.score).toBeGreaterThanOrEqual(500);

    state = nextStage(state);
    expect(state.currentStageIndex).toBe(1);
    expect(state.stageComplete).toBe(false);
    expect(state.bricks.length).toBeGreaterThan(0);
  });
});

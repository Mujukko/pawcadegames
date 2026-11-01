import { describe, expect, it } from 'bun:test';
import {
  createInitialPlayers,
  initBasketRandomGame,
  resetBasketRound,
  stepBasketRandomGame,
  TARGET_SCORE,
} from './engine';

describe('Basket Random: Barnyard Dunkers Logic Engine', () => {
  it('initializes game with 4 ragdoll players, 2 hoops, and 0-0 score', () => {
    const state = initBasketRandomGame('vs_ai');
    expect(state.players.length).toBe(4);
    expect(state.score.p1).toBe(0);
    expect(state.score.p2).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.hoopLeft.team).toBe(1);
    expect(state.hoopRight.team).toBe(2);
  });

  it('pulls airborne ball and players toward floor with gravity', () => {
    let state = initBasketRandomGame('vs_ai');
    state.ball.y = 100;
    state.ball.vy = 0;

    state = stepBasketRandomGame(state, {}, 0.05);
    expect(state.ball.vy).toBeGreaterThan(0);
    expect(state.ball.y).toBeGreaterThan(100);
  });

  it('triggers jump impulse and arm tilt when player jumps', () => {
    let state = initBasketRandomGame('vs_ai');
    const p1 = state.players.find((p) => p.team === 1 && p.onGround)!;
    expect(p1.onGround).toBe(true);

    state = stepBasketRandomGame(state, { p1Jump: true }, 0.016);
    const updatedP1 = state.players.find((p) => p.id === p1.id)!;
    expect(updatedP1.vy).toBeLessThan(0);
    expect(updatedP1.onGround).toBe(false);
  });

  it('catches ball when player is close to it', () => {
    let state = initBasketRandomGame('vs_ai');
    const p1 = state.players[0];
    state.ball.x = p1.x;
    state.ball.y = p1.y - 20;
    state.ball.vy = 10;
    state.ball.heldBy = null;

    state = stepBasketRandomGame(state, {}, 0.016);
    expect(state.ball.heldBy).toBe(p1.id);
  });

  it('launches ball towards opponent hoop when holding player jumps', () => {
    let state = initBasketRandomGame('vs_ai');
    const p1 = state.players[0];
    state.ball.heldBy = p1.id;
    p1.onGround = true;

    state = stepBasketRandomGame(state, { p1Jump: true }, 0.016);
    expect(state.ball.heldBy).toBeNull();
    expect(state.ball.vx).toBeGreaterThan(0); // Shooting toward right hoop
  });

  it('scores point for Team 1 when ball falls through right hoop', () => {
    let state = initBasketRandomGame('vs_ai');
    state.ball.heldBy = null;
    state.ball.x = state.hoopRight.x;
    state.ball.y = state.hoopRight.rimY;
    state.ball.vy = 150; // downward motion

    state = stepBasketRandomGame(state, {}, 0.016);
    expect(state.score.p1).toBe(1);
    expect(state.status).toBe('scored');
    expect(state.scoredBy).toBe(1);
  });

  it('scores point for Team 2 when ball falls through left hoop', () => {
    let state = initBasketRandomGame('vs_ai');
    state.ball.heldBy = null;
    state.ball.x = state.hoopLeft.x;
    state.ball.y = state.hoopLeft.rimY;
    state.ball.vy = 150;

    state = stepBasketRandomGame(state, {}, 0.016);
    expect(state.score.p2).toBe(1);
    expect(state.status).toBe('scored');
    expect(state.scoredBy).toBe(2);
  });

  it('triggers game over when a team reaches target score of 5', () => {
    let state = initBasketRandomGame('vs_ai');
    state.score.p1 = TARGET_SCORE;
    state.status = 'scored';
    state.celebrationTimer = 0.01;

    state = stepBasketRandomGame(state, {}, 0.02);
    expect(state.status).toBe('game_over');
    expect(state.winner).toBe(1);
  });

  it('resets round with new random ball and positions on resetBasketRound', () => {
    let state = initBasketRandomGame('vs_ai');
    state.score.p1 = 2;
    state.status = 'scored';

    const nextRound = resetBasketRound(state);
    expect(nextRound.status).toBe('playing');
    expect(nextRound.score.p1).toBe(2); // preserves score
    expect(nextRound.players.length).toBe(4);
  });
});

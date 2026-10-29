import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  playerJump,
  playerShoot,
  restartMatch,
  startNextRound,
  updateGame,
} from './engine';

describe('Barnyard Roof Duel: Ragdoll Showdown Logic Engine', () => {
  it('initializes match with both players grounded, score 0, and roof geometry', () => {
    const state = createInitialState('vs_ai', 'red_barn');
    expect(state.status).toBe('dueling');
    expect(state.round).toBe(1);
    expect(state.p1.score).toBe(0);
    expect(state.p2.score).toBe(0);
    expect(state.p1.isGrounded).toBe(true);
    expect(state.p2.isGrounded).toBe(true);
    expect(state.roofSegments.length).toBeGreaterThan(0);
  });

  it('allows grounded player to jump and applies upward velocity', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state = playerJump(state, 'p1');

    expect(state.p1.vy).toBeLessThan(0);
    expect(state.p1.isGrounded).toBe(false);
    expect(state.events.some((e) => e.type === 'jump' && e.playerId === 'p1')).toBe(true);
  });

  it('prevents airborne player from double-jumping', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state = playerJump(state, 'p1');
    const initialVy = state.p1.vy;

    state = playerJump(state, 'p1');
    expect(state.p1.vy).toBe(initialVy);
  });

  it('shoots bullet and applies recoil pushback to shooter', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state = playerShoot(state, 'p1');

    expect(state.bullets.length).toBe(1);
    expect(state.bullets[0].shooterId).toBe('p1');
    expect(state.bullets[0].vx).toBeGreaterThan(0);
    expect(state.p1.vx).toBeLessThan(0); // Recoil pushback
    expect(state.events.some((e) => e.type === 'shoot')).toBe(true);
  });

  it('applies gravity during update and keeps grounded player on roof slope', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state = updateGame(state, 0.033);

    expect(state.p1.isGrounded).toBe(true);
    expect(state.p1.y).toBeGreaterThan(280);
    expect(state.p1.y).toBeLessThan(350);
  });

  it('transfers kinetic impulse and registers hit when bullet strikes opponent', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    // Spawn a bullet moving fast toward p2
    state.bullets = [
      {
        id: 'test-bullet',
        x: state.p2.x - 5,
        y: state.p2.y - 10,
        vx: 600,
        vy: 0,
        shooterId: 'p1',
        ricochets: 0,
        active: true,
      },
    ];

    state = updateGame(state, 0.016);
    expect(state.events.some((e) => e.type === 'hit' && e.victimId === 'p2')).toBe(true);
    expect(state.p2.vx).toBeGreaterThan(100); // knocked backward
  });

  it('ricochets bullet once off roof shingles', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state.bullets = [
      {
        id: 'test-ricochet',
        x: 200,
        y: 338, // near left roof slope
        vx: 300,
        vy: 200,
        shooterId: 'p1',
        ricochets: 0,
        active: true,
      },
    ];

    state = updateGame(state, 0.016);
    expect(state.events.some((e) => e.type === 'ricochet')).toBe(true);
  });

  it('awards round win to p1 when p2 is knocked off the roof', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state.p2.x = 580; // Knocked past the right roof edge
    state.p2.y = 480; // Fallen off bottom
    state.p2.isGrounded = false;

    state = updateGame(state, 0.02);
    expect(state.status).toBe('round_over');
    expect(state.roundWinner).toBe('p1');
    expect(state.p1.score).toBe(1);
    expect(state.events.some((e) => e.type === 'round_win')).toBe(true);
  });

  it('triggers match victory when a player reaches 5 wins', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state.p1.score = 4;
    state.p2.x = 580; // Knocked past the right roof edge
    state.p2.y = 480; // p2 falls off, giving p1 5th win
    state.p2.isGrounded = false;

    state = updateGame(state, 0.02);
    expect(state.status).toBe('match_over');
    expect(state.matchWinner).toBe('p1');
    expect(state.p1.score).toBe(5);
    expect(state.events.some((e) => e.type === 'match_win')).toBe(true);
  });

  it('resets player positions and advances round on startNextRound', () => {
    let state = createInitialState('vs_ai', 'red_barn');
    state.p1.score = 2;
    state = startNextRound(state);

    expect(state.round).toBe(2);
    expect(state.status).toBe('dueling');
    expect(state.p1.isGrounded).toBe(true);
    expect(state.bullets.length).toBe(0);
  });

  it('supports windmill map with rotating blades', () => {
    let state = createInitialState('vs_ai', 'windmill');
    expect(state.windmill).toBeDefined();
    const initialAngle = state.windmill!.angle;

    state = updateGame(state, 0.05);
    expect(state.windmill!.angle).toBeGreaterThan(initialAngle);
  });
});

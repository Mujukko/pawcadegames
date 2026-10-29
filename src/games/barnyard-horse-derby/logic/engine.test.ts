import { describe, it, expect } from 'bun:test';
import {
  createDerbyGame,
  triggerPlayerJump,
  switchPlayerLane,
  updateDerbyGame,
  TRACK_CONFIGS,
} from './engine';

describe('Horse Racing Game: Barnyard Derby Logic Engine', () => {
  it('initializes game in countdown mode with valid player, rivals, and track', () => {
    const state = createDerbyGame('meadow-cup');
    expect(state.status).toBe('countdown');
    expect(state.countdownTimer).toBe(3);
    expect(state.player.lane).toBe(1);
    expect(state.player.stamina).toBe(100);
    expect(state.rivals.length).toBe(2);
    expect(state.track.totalDistance).toBe(600);
    expect(state.obstacles.length).toBeGreaterThan(5);
    expect(state.collectibles.length).toBeGreaterThan(5);
  });

  it('transitions from countdown to racing when timer elapses', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1);
    expect(state.status).toBe('racing');
    expect(state.countdownTimer).toBe(0);
  });

  it('accelerates player forward and updates distance in racing state', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing

    const initialDist = state.player.distance;
    state = updateDerbyGame(state, 0.5);

    expect(state.player.speed).toBeGreaterThan(0);
    expect(state.player.distance).toBeGreaterThan(initialDist);
  });

  it('switches player lanes between 0, 1, and 2 safely without exceeding boundaries', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing

    expect(state.player.targetLane).toBe(1);

    // Switch up (lane 0)
    state = switchPlayerLane(state, -1);
    expect(state.player.targetLane).toBe(0);

    // Try switching up again (should clamp at 0)
    state = switchPlayerLane(state, -1);
    expect(state.player.targetLane).toBe(0);

    // Switch down twice (to lane 2)
    state = switchPlayerLane(state, 1);
    expect(state.player.targetLane).toBe(1);
    state = switchPlayerLane(state, 1);
    expect(state.player.targetLane).toBe(2);

    // Try switching down past 2 (should clamp at 2)
    state = switchPlayerLane(state, 1);
    expect(state.player.targetLane).toBe(2);
  });

  it('triggers jump, executes parabolic arc, and lands back on ground', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing

    state = triggerPlayerJump(state);
    expect(state.player.isJumping).toBe(true);
    expect(state.player.jumpVelocity).toBeGreaterThan(0);
    expect(state.player.jumpY).toBeGreaterThan(0);

    // Update steps through peak and back down
    let landed = false;
    for (let i = 0; i < 40; i++) {
      state = updateDerbyGame(state, 0.05);
      if (state.events.some((e) => e.type === 'jump_land')) {
        landed = true;
        break;
      }
    }

    expect(landed).toBe(true);
    expect(state.player.isJumping).toBe(false);
    expect(state.player.jumpY).toBe(0);
  });

  it('evaluates jump timing against upcoming obstacle and grants perfect grade with speed boost', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing

    // Place an obstacle 4m ahead in current lane (1)
    state.obstacles = [
      {
        id: 'obs-test',
        distance: state.player.distance + 4,
        lane: 1,
        type: 'fence',
        width: 4,
        cleared: false,
        hit: false,
      },
    ];

    state = triggerPlayerJump(state);
    expect(state.player.lastJumpGrade).toBe('perfect');
    expect(state.score).toBeGreaterThan(0);
    expect(state.player.boostTimer).toBeGreaterThan(0);
    expect(state.obstacles[0].cleared).toBe(true);
  });

  it('penalizes player with stumble slowdown when colliding with unjumped obstacle', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing

    // Place obstacle directly at player distance
    state.obstacles = [
      {
        id: 'obs-hit',
        distance: state.player.distance + 0.5,
        lane: 1,
        type: 'fence',
        width: 4,
        cleared: false,
        hit: false,
      },
    ];
    state.player.jumpY = 0; // on ground
    state.player.isJumping = false;
    state.player.speed = 15;

    state = updateDerbyGame(state, 0.04);
    expect(state.obstacles[0].hit).toBe(true);
    expect(state.player.stumbleTimer).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'obstacle_hit')).toBe(true);
  });

  it('collects carrots and horseshoes, replenishing stamina and awarding score', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing
    state.player.stamina = 50;

    state.collectibles = [
      {
        id: 'col-carrot',
        distance: state.player.distance + 0.5,
        lane: 1,
        type: 'carrot',
        collected: false,
      },
      {
        id: 'col-horseshoe',
        distance: state.player.distance + 1.0,
        lane: 1,
        type: 'horseshoe',
        collected: false,
      },
    ];

    state = updateDerbyGame(state, 0.05);

    expect(state.carrotsEaten).toBe(1);
    expect(state.horseshoesCollected).toBe(1);
    expect(state.player.stamina).toBeGreaterThan(50);
    expect(state.score).toBeGreaterThan(0);
  });

  it('detects race finish, ranks player, and awards gold trophy when winning', () => {
    let state = createDerbyGame('meadow-cup');
    state = updateDerbyGame(state, 3.1); // enter racing

    // Put player past total distance ahead of rivals
    state.player.distance = state.track.totalDistance + 10;
    state.rivals.forEach((r) => {
      r.distance = 200;
      r.finished = false;
    });

    state = updateDerbyGame(state, 0.05);
    expect(state.status).toBe('finished');
    expect(state.finalRank).toBe(1);
    expect(state.trophy).toBe('gold');
    expect(state.events.some((e) => e.type === 'finish_race')).toBe(true);
  });
});

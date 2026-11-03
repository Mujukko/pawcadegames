import { describe, it, expect } from 'bun:test';
import {
  createSubwayGame,
  changeLane,
  jumpPlayer,
  rollPlayer,
  updateSubwayGame,
} from './engine';

describe('Pasture Subway Run Logic Engine', () => {
  it('initializes game with valid defaults, 3 tracks, and 0 distance', () => {
    const state = createSubwayGame();
    expect(state.status).toBe('ready');
    expect(state.player.lane).toBe(0);
    expect(state.player.y).toBe(0);
    expect(state.coins).toBe(0);
    expect(state.obstacles.length).toBeGreaterThan(0);
    expect(state.coinsList.length).toBeGreaterThan(0);
  });

  it('switches tracks left and right within -1 to 1 limits', () => {
    let state = createSubwayGame();
    state = changeLane(state, 'left');
    expect(state.player.targetLane).toBe(-1);
    expect(state.status).toBe('playing');

    // Cannot go past left boundary
    state = changeLane(state, 'left');
    expect(state.player.targetLane).toBe(-1);

    // Switch right
    state = changeLane(state, 'right');
    expect(state.player.targetLane).toBe(0);
    state = changeLane(state, 'right');
    expect(state.player.targetLane).toBe(1);
  });

  it('jumps with upward velocity and lands back down', () => {
    let state = createSubwayGame();
    state.status = 'playing';
    state = jumpPlayer(state);

    expect(state.player.isJumping).toBe(true);
    expect(state.player.vy).toBeGreaterThan(0);

    // Update through jump arc
    for (let i = 0; i < 20; i++) {
      state = updateSubwayGame(state, 0.04);
      if (!state.player.isJumping) break;
    }

    expect(state.player.isJumping).toBe(false);
    expect(state.player.y).toBe(0);
  });

  it('rolls under low beam obstacles safely', () => {
    let state = createSubwayGame();
    state.status = 'playing';
    state.player.lane = 0;
    state.player.targetLane = 0;
    state.player.laneX = 0;
    state.obstacles = [
      {
        id: 'test_beam',
        lane: 0,
        z: 20,
        type: 'low_beam',
        width: 70,
        height: 40,
        canJumpOver: false,
        canRollUnder: true,
      },
    ];

    state = rollPlayer(state);
    expect(state.player.isRolling).toBe(true);

    const next = updateSubwayGame(state, 0.05);
    expect(next.status).toBe('playing'); // Did not crash!
  });

  it('crashes when hitting an obstacle without jumping or rolling', () => {
    let state = createSubwayGame();
    state.status = 'playing';
    state.player.lane = 0;
    state.player.targetLane = 0;
    state.player.laneX = 0;
    state.obstacles = [
      {
        id: 'test_fence',
        lane: 0,
        z: 20,
        type: 'fence',
        width: 70,
        height: 40,
        canJumpOver: true,
        canRollUnder: false,
      },
    ];

    const next = updateSubwayGame(state, 0.05);
    expect(next.status).toBe('crashed');
    expect(next.events.some((e) => e.type === 'crash')).toBe(true);
  });

  it('collects coins in the same lane', () => {
    let state = createSubwayGame();
    state.status = 'playing';
    state.player.lane = 0;
    state.player.laneX = 0;
    state.coinsList = [
      {
        id: 'c1',
        lane: 0,
        z: 20,
        y: 0,
        collected: false,
      },
    ];

    const next = updateSubwayGame(state, 0.05);
    expect(next.coins).toBe(1);
    expect(next.events.some((e) => e.type === 'coin')).toBe(true);
  });
});

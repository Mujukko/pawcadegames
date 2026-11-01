import { describe, expect, it } from 'bun:test';
import {
  initGoldMinerGame,
  stepGoldMinerGame,
  TOTAL_SHIFTS,
  triggerClawShoot,
  useDynamite,
} from './engine';

describe('Gold Miner: Barnyard Gem Digger Logic Engine', () => {
  it('initializes game with valid defaults, swinging claw, and shift 1 items', () => {
    const state = initGoldMinerGame(1, 0, 1);
    expect(state.shift).toBe(1);
    expect(state.money).toBe(0);
    expect(state.dynamiteCount).toBe(1);
    expect(state.claw.state).toBe('swinging');
    expect(state.items.length).toBeGreaterThan(0);
    expect(state.status).toBe('playing');
  });

  it('oscillates claw angle smoothly when swinging', () => {
    let state = initGoldMinerGame(1);
    const startAngle = state.claw.angle;

    state = stepGoldMinerGame(state, 0.05);
    expect(state.claw.angle).not.toBe(startAngle);
    expect(state.claw.state).toBe('swinging');
  });

  it('shoots claw forward on triggerClawShoot', () => {
    let state = initGoldMinerGame(1);
    state = triggerClawShoot(state);
    expect(state.claw.state).toBe('shooting');

    const startLength = state.claw.length;
    state = stepGoldMinerGame(state, 0.05);
    expect(state.claw.length).toBeGreaterThan(startLength);
  });

  it('grabs item when claw tip intersects item radius', () => {
    let state = initGoldMinerGame(1);
    state.claw.state = 'shooting';
    state.claw.angle = 0; // pointing straight down
    // Position small gold directly in trajectory
    state.items = [
      { id: 'test_gold', type: 'small_gold', x: 400, y: 150, radius: 14, value: 100, weight: 1, collected: false },
    ];
    state.claw.length = 75; // Tip will be at (400, 70 + 75 = 145)

    state = stepGoldMinerGame(state, 0.016);
    expect(state.claw.state).toBe('reeling');
    expect(state.claw.grabbedItem).not.toBeNull();
    expect(state.claw.grabbedItem!.id).toBe('test_gold');
  });

  it('adds money and returns to swinging when claw reels in item', () => {
    let state = initGoldMinerGame(1, 0);
    state.claw.state = 'reeling';
    state.claw.length = 32; // almost back
    state.claw.grabbedItem = {
      id: 'test_gold',
      type: 'small_gold',
      x: 400,
      y: 100,
      radius: 14,
      value: 100,
      weight: 1,
      collected: false,
    };

    state = stepGoldMinerGame(state, 0.05);
    expect(state.money).toBe(100);
    expect(state.claw.state).toBe('swinging');
    expect(state.claw.grabbedItem).toBeNull();
  });

  it('uses dynamite to blow up grabbed heavy rock and reels back quickly', () => {
    let state = initGoldMinerGame(1, 0, 2);
    state.claw.state = 'reeling';
    state.claw.grabbedItem = {
      id: 'heavy_rock',
      type: 'rock',
      x: 400,
      y: 200,
      radius: 28,
      value: 20,
      weight: 4.0,
      collected: false,
    };

    state = useDynamite(state);
    expect(state.dynamiteCount).toBe(1);
    expect(state.claw.grabbedItem).toBeNull();
  });

  it('triggers shift_clear when timer ends with target money achieved', () => {
    let state = initGoldMinerGame(1, 800); // target is 650
    state.timeLeft = 0.02;

    state = stepGoldMinerGame(state, 0.05);
    expect(state.status).toBe('shift_clear');
  });

  it('triggers game_over when timer ends with insufficient money', () => {
    let state = initGoldMinerGame(1, 200); // target is 650
    state.timeLeft = 0.02;

    state = stepGoldMinerGame(state, 0.05);
    expect(state.status).toBe('game_over');
  });

  it('triggers victory when completing final shift with quota', () => {
    let state = initGoldMinerGame(TOTAL_SHIFTS, 3500); // target is 3200
    state.timeLeft = 0.02;

    state = stepGoldMinerGame(state, 0.05);
    expect(state.status).toBe('victory');
  });
});

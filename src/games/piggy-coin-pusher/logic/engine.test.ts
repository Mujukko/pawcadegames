import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  dropCoin,
  updateEngine,
  activateQuake,
  activateWalls,
  refillCoins,
  TABLE_LEFT_WALL,
  TABLE_RIGHT_WALL,
  FRONT_LEDGE_Y,
  PUSHER_MIN_Y,
  PUSHER_MAX_Y,
} from './engine';

describe('Piggy Coin Pusher Logic Engine', () => {
  it('initializes game state with starting wallet and pre-seeded coins', () => {
    const state = createInitialState(1000);
    expect(state.status).toBe('playing');
    expect(state.coinsInWallet).toBe(45);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(1000);
    expect(state.coinsOnTable.length).toBeGreaterThan(30);
    expect(state.pusher.y).toBe(PUSHER_MIN_Y);
    expect(state.powerUps.quakeTimer).toBe(0);
    expect(state.powerUps.coinWallsTimer).toBe(0);
  });

  it('drops a coin, consumes wallet balance, and clamps within table borders', () => {
    const initial = createInitialState();
    const { state: dropped, event } = dropCoin(initial, 200, 'gold_corn');

    expect(dropped.coinsInWallet).toBe(44);
    expect(dropped.coinsOnTable.length).toBe(initial.coinsOnTable.length + 1);
    expect(event?.type).toBe('coin_dropped');

    // Test clamped drop boundary
    const { state: leftClamped } = dropCoin(initial, 10);
    const newest = leftClamped.coinsOnTable[0];
    expect(newest.x).toBeGreaterThanOrEqual(TABLE_LEFT_WALL + 20);
  });

  it('oscillates pusher rake over time between minY and maxY', () => {
    const initial = createInitialState();
    expect(initial.pusher.dir).toBe(1);

    // Update for 1 second
    const { state: updated } = updateEngine(initial, 1.0);
    expect(updated.pusher.y).toBeGreaterThan(initial.pusher.y);
  });

  it('collects coins pushed over the front ledge and awards score & wallet refund', () => {
    let state = createInitialState();
    state.coinsOnTable = [
      {
        id: 'test-ledge-coin',
        x: 200,
        y: FRONT_LEDGE_Y - 2, // 2px before ledge
        radius: 14,
        vx: 0,
        vy: 200, // moving forward
        type: 'gold_corn',
        value: 1,
      },
    ];

    const initialWallet = state.coinsInWallet;
    const { state: resolved, events } = updateEngine(state, 0.05);

    expect(resolved.coinsOnTable.length).toBe(0); // Fell over ledge
    expect(resolved.coinsInWallet).toBe(initialWallet + 1);
    expect(resolved.score).toBeGreaterThan(0);
    expect(resolved.totalPushedFront).toBe(1);
    expect(events.some((e) => e.type === 'coin_pushed_front')).toBe(true);
  });

  it('loses coins that fall into side gutters when walls are down', () => {
    let state = createInitialState();
    state.powerUps.coinWallsTimer = 0; // Walls down
    state.coinsOnTable = [
      {
        id: 'test-gutter-coin',
        x: TABLE_LEFT_WALL - 10, // past left wall
        y: 250,
        radius: 14,
        vx: -50,
        vy: 0,
        type: 'gold_corn',
        value: 1,
      },
    ];

    const { state: resolved, events } = updateEngine(state, 0.05);
    expect(resolved.coinsOnTable.length).toBe(0);
    expect(resolved.totalLostSide).toBe(1);
    expect(events.some((e) => e.type === 'coin_lost_side')).toBe(true);
  });

  it('bounces coins off active coin walls and prevents gutter loss', () => {
    let state = createInitialState();
    state.powerUps.coinWallsTimer = 8.0; // Walls UP!
    state.coinsOnTable = [
      {
        id: 'test-wall-coin',
        x: TABLE_LEFT_WALL + 5,
        y: 250,
        radius: 14,
        vx: -120, // Heading into left gutter
        vy: 0,
        type: 'gold_corn',
        value: 1,
      },
    ];

    const { state: resolved, events } = updateEngine(state, 0.05);
    expect(resolved.coinsOnTable.length).toBe(1);
    expect(resolved.totalLostSide).toBe(0);
    expect(resolved.coinsOnTable[0].x).toBeGreaterThanOrEqual(TABLE_LEFT_WALL + 14);
    expect(events.some((e) => e.type === 'coin_lost_side')).toBe(false);
  });

  it('activates quake and wall power-ups when progress reaches 100', () => {
    let state = createInitialState();
    state.progress.quakeProgress = 100;
    state.progress.wallProgress = 100;

    const { state: quaked, event: qEvent } = activateQuake(state);
    expect(quaked.powerUps.quakeTimer).toBeGreaterThan(0);
    expect(quaked.progress.quakeProgress).toBe(0);
    expect(qEvent?.type).toBe('powerup_activated');

    const { state: walled, event: wEvent } = activateWalls(quaked);
    expect(walled.powerUps.coinWallsTimer).toBeGreaterThan(0);
    expect(walled.progress.wallProgress).toBe(0);
    expect(wEvent?.type).toBe('powerup_activated');
  });

  it('refills wallet with bonus coins and resets game over status', () => {
    let state = createInitialState();
    state.status = 'game_over';
    state.coinsInWallet = 0;

    const refilled = refillCoins(state, 30);
    expect(refilled.status).toBe('playing');
    expect(refilled.coinsInWallet).toBe(30);
  });
});

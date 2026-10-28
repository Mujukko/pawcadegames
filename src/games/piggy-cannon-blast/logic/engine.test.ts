import { describe, expect, it } from 'bun:test';
import {
  activateRocketNitro,
  createInitialState,
  launchCannon,
  lockAngle,
  purchaseUpgrade,
  resetFlight,
  updateEngine,
} from './engine';

const neutralInput = { tilt: 0, boost: false };

describe('Piggy Cannon Blast: Barnyard Launch Logic Engine', () => {
  it('initializes game in aiming_angle phase with 1 nitro charge and entities', () => {
    const state = createInitialState();
    expect(state.phase).toBe('aiming_angle');
    expect(state.angleDeg).toBe(45);
    expect(state.fuelRemaining).toBe(1);
    expect(state.bouncesRemaining).toBeGreaterThanOrEqual(3);
    expect(state.entities.length).toBeGreaterThan(30);
    expect(state.distanceTraveled).toBe(0);
  });

  it('oscillates launch angle between 15 and 75 degrees in aiming phase', () => {
    let state = createInitialState();
    for (let i = 0; i < 20; i++) {
      state = updateEngine(state, neutralInput, 0.05);
    }
    expect(state.angleDeg).toBeGreaterThanOrEqual(15);
    expect(state.angleDeg).toBeLessThanOrEqual(75);
    expect(state.angleDeg).not.toBe(45);
  });

  it('locks angle and transitions to charging_power phase', () => {
    let state = createInitialState();
    state = lockAngle(state);
    expect(state.phase).toBe('charging_power');
    expect(state.powerRatio).toBe(0.1);
  });

  it('oscillates power ratio between 0.1 and 1.0 in charging phase', () => {
    let state = createInitialState();
    state = lockAngle(state);
    for (let i = 0; i < 15; i++) {
      state = updateEngine(state, neutralInput, 0.05);
    }
    expect(state.powerRatio).toBeGreaterThanOrEqual(0.1);
    expect(state.powerRatio).toBeLessThanOrEqual(1.0);
  });

  it('fires cannon and launches Penny into flying phase with forward velocity', () => {
    let state = createInitialState();
    state = lockAngle(state);
    state.powerRatio = 0.8;
    state = launchCannon(state);

    expect(state.phase).toBe('flying');
    expect(state.vx).toBeGreaterThan(200);
    expect(state.vy).toBeGreaterThan(200);
    expect(state.events.some((e) => e.type === 'cannon_fire')).toBe(true);
  });

  it('applies gravity and updates horizontal distance during flight', () => {
    let state = createInitialState();
    state = lockAngle(state);
    state.powerRatio = 0.9;
    state = launchCannon(state);

    const initialVy = state.vy;
    for (let i = 0; i < 5; i++) {
      state = updateEngine(state, neutralInput, 0.05);
    }

    expect(state.vy).toBeLessThan(initialVy);
    expect(state.distanceTraveled).toBeGreaterThan(0);
  });

  it('activates rocket nitro boost and deducts 1 fuel unit', () => {
    let state = createInitialState();
    state = lockAngle(state);
    state = launchCannon(state);

    const prevFuel = state.fuelRemaining;
    const prevVx = state.vx;

    state = activateRocketNitro(state);
    expect(state.fuelRemaining).toBe(prevFuel - 1);
    expect(state.vx).toBeGreaterThan(prevVx);
    expect(state.events.some((e) => e.type === 'rocket_boost')).toBe(true);
  });

  it('collects coins upon collision and credits coins earned', () => {
    let state = createInitialState();
    state = lockAngle(state);
    state = launchCannon(state);

    // Place a coin directly on Penny's path
    state.entities = [
      { id: 'test-coin', type: 'coin', x: state.x + 10, y: state.y, radius: 15, collected: false },
    ];

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.05);
    allEvents.push(...state.events);

    expect(state.coinsEarnedThisRun).toBe(10);
    expect(state.totalCoins).toBe(10);
    expect(allEvents.some((e) => e.type === 'coin_collect')).toBe(true);
  });

  it('bounces Penny into the air when hitting a bouncy sheep on ground', () => {
    let state = createInitialState();
    state = lockAngle(state);
    state = launchCannon(state);

    // Place bouncy sheep on ground under Penny
    state.x = 250;
    state.y = 15;
    state.vy = -100;
    state.entities = [
      { id: 'test-sheep', type: 'bouncy_sheep', x: 250, y: 10, radius: 25 },
    ];

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.05);
    allEvents.push(...state.events);

    expect(state.vy).toBeGreaterThan(200);
    expect(allEvents.some((e) => e.type === 'sheep_bounce')).toBe(true);
  });

  it('purchases upgrades with sufficient coins and rejects when coins are insufficient', () => {
    let state = createInitialState(undefined, 100);
    expect(state.upgrades.cannonPower).toBe(1);

    // Level 2 cannonPower costs 60 coins
    state = purchaseUpgrade(state, 'cannonPower');
    expect(state.upgrades.cannonPower).toBe(2);
    expect(state.totalCoins).toBe(40);

    // Level 3 costs 150 coins, but we only have 40 -> should reject
    state = purchaseUpgrade(state, 'cannonPower');
    expect(state.upgrades.cannonPower).toBe(2);
    expect(state.totalCoins).toBe(40);
  });

  it('transitions to landed phase when forward velocity decays near zero on ground', () => {
    let state = createInitialState();
    state = lockAngle(state);
    state = launchCannon(state);

    state.y = 0;
    state.vy = 0;
    state.vx = 2; // slow slide
    state.bouncesRemaining = 0;

    const allEvents = [];
    state = updateEngine(state, neutralInput, 0.1);
    allEvents.push(...state.events);

    expect(state.phase).toBe('landed');
    expect(allEvents.some((e) => e.type === 'flight_landed')).toBe(true);
  });

  it('resets flight for a new launch while preserving upgrades and coins', () => {
    let state = createInitialState(undefined, 250, 680);
    state = lockAngle(state);
    state = launchCannon(state);
    state.distanceTraveled = 450;

    const resetState = resetFlight(state);
    expect(resetState.phase).toBe('aiming_angle');
    expect(resetState.x).toBe(0);
    expect(resetState.distanceTraveled).toBe(0);
    expect(resetState.totalCoins).toBe(250);
    expect(resetState.bestDistance).toBe(680);
  });
});

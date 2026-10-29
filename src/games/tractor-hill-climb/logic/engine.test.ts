import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  getTerrainHeight,
  getTerrainSlope,
  createPickups,
  updateEngine,
  checkDriverHeadCrash,
  BASE_GROUND_Y,
  METERS_TO_WORLD,
  STAGES,
} from './engine';

describe('Tractor Hill Climb Engine Tests', () => {
  it('initializes game state with valid defaults', () => {
    const state = createInitialState(0);
    expect(state.status).toBe('ready');
    expect(state.fuel).toBe(100);
    expect(state.coins).toBe(0);
    expect(state.distance).toBe(0);
    expect(state.stageId).toBe('clover_pasture');
    expect(state.chassis.x).toBe(120);
    expect(state.chassis.rearWheel.isGrounded).toBe(true);
    expect(state.chassis.frontWheel.isGrounded).toBe(true);
    expect(state.coinsList.length).toBeGreaterThan(10);
    expect(state.fuelList.length).toBeGreaterThan(2);
  });

  it('calculates flat starting pad and wave terrain height', () => {
    // Starting pad (x < 180) should be baseline
    const h0 = getTerrainHeight(50, 'clover_pasture');
    const h100 = getTerrainHeight(100, 'clover_pasture');
    expect(h0).toBe(BASE_GROUND_Y);
    expect(h100).toBe(BASE_GROUND_Y);

    // Higher x has undulating elevation
    const h500 = getTerrainHeight(500, 'clover_pasture');
    expect(typeof h500).toBe('number');
    expect(Math.abs(h500 - BASE_GROUND_Y)).toBeLessThanOrEqual(STAGES.clover_pasture.hillsAmplitude * 1.5);
  });

  it('computes accurate terrain slope and upward normal vector', () => {
    const slope = getTerrainSlope(100, 'clover_pasture');
    // On flat start, slope angle should be approximately 0
    expect(Math.abs(slope.angle)).toBeLessThan(0.01);
    // Upward normal vector in canvas coords (y down) should point to (0, -1)
    expect(Math.abs(slope.normalX)).toBeLessThan(0.01);
    expect(slope.normalY).toBeCloseTo(-1, 2);
    // Normal vector must have unit length
    const len = Math.sqrt(slope.normalX ** 2 + slope.normalY ** 2);
    expect(len).toBeCloseTo(1, 4);
  });

  it('generates distributed coins and diesel cans across the stage', () => {
    const { coins, fuels } = createPickups('clover_pasture');
    expect(coins.length).toBeGreaterThan(15);
    expect(fuels.length).toBeGreaterThan(3);

    // All pickups start uncollected
    expect(coins.every((c) => !c.collected)).toBe(true);
    expect(fuels.every((f) => !f.collected)).toBe(true);

    // Pickups have positive world x coordinates
    expect(coins[0].x).toBeGreaterThan(200);
    expect(fuels[0].x).toBeGreaterThan(600);
  });

  it('transitions from ready to driving on user throttle', () => {
    const state = createInitialState(0);
    expect(state.status).toBe('ready');

    const nextState = updateEngine(state, { gas: true, brake: false }, 0.016);
    expect(nextState.status).toBe('driving');
  });

  it('accelerates forward and drains fuel when gas is pressed', () => {
    let state = createInitialState(0);
    // Apply gas for several frames
    for (let i = 0; i < 20; i++) {
      state = updateEngine(state, { gas: true, brake: false }, 0.016);
    }

    expect(state.chassis.vx).toBeGreaterThan(0);
    expect(state.fuel).toBeLessThan(100);
    expect(state.distance).toBeGreaterThanOrEqual(0);
  });

  it('detects driver head crash when tractor flips upside down', () => {
    const state = createInitialState(0);
    const crashedChassis = {
      ...state.chassis,
      // Fully upside down (PI radians = 180 degrees)
      angle: Math.PI,
      y: BASE_GROUND_Y, // low altitude upside down pushes head into ground
    };

    const isCrashed = checkDriverHeadCrash(crashedChassis, 'clover_pasture');
    expect(isCrashed).toBe(true);
  });

  it('accumulates air time when both wheels leave the ground', () => {
    let state = createInitialState(0);
    // Lift tractor high into the air
    state.chassis.y = 100;
    state.chassis.rearWheel.worldY = 118;
    state.chassis.frontWheel.worldY = 122;
    state.chassis.rearWheel.isGrounded = false;
    state.chassis.frontWheel.isGrounded = false;
    state.status = 'driving';

    state = updateEngine(state, { gas: false, brake: false }, 0.1);
    expect(state.airTime).toBeGreaterThan(0);
  });

  it('collects coins upon proximity and awards score', () => {
    let state = createInitialState(0);
    // Force first coin right next to tractor chassis
    state.coinsList[0].x = state.chassis.x + 5;
    state.coinsList[0].y = state.chassis.y + 5;

    state = updateEngine(state, { gas: true, brake: false }, 0.016);
    expect(state.coins).toBe(1);
    expect(state.score).toBeGreaterThan(0);
    expect(state.coinsList[0].collected).toBe(true);
  });

  it('collects diesel can to replenish fuel and trigger boost', () => {
    let state = createInitialState(0);
    state.fuel = 30; // low fuel
    // Place first fuel can at tractor
    state.fuelList[0].x = state.chassis.x;
    state.fuelList[0].y = state.chassis.y;

    state = updateEngine(state, { gas: true, brake: false }, 0.016);
    expect(state.fuel).toBeGreaterThan(30);
    expect(state.fuelList[0].collected).toBe(true);
    expect(state.activeStunt?.type).toBe('fuel_boost');
  });

  it('triggers victory status when reaching stage target distance', () => {
    let state = createInitialState(0);
    const targetMeters = STAGES.clover_pasture.targetMeters;
    // Set chassis position past target meters
    state.chassis.x = targetMeters * METERS_TO_WORLD + 150;
    state.status = 'driving';

    state = updateEngine(state, { gas: true, brake: false }, 0.016);
    expect(state.status).toBe('victory');
    expect(state.score).toBeGreaterThanOrEqual(1000);
  });
});

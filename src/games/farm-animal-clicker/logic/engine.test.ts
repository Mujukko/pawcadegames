import { describe, expect, it } from 'bun:test';
import {
  buyBuilding,
  buyClickUpgrade,
  buyHat,
  calculateClickPower,
  calculateOfflineEarnings,
  calculatePps,
  clickGoldenEvent,
  createInitialState,
  equipHat,
  getBuildingCost,
  getUpgradeCost,
  handleClick,
  isAnimalUnlocked,
  selectAnimal,
  spawnGoldenEvent,
  tickState,
} from './engine';

describe('Farm Animal Idle Clicker: Pure Logic Engine', () => {
  it('initializes with proper starting defaults (0 produce, 1 click power, 0 PPS)', () => {
    const state = createInitialState();
    expect(state.produce).toBe(0);
    expect(state.lifetimeProduce).toBe(0);
    expect(state.selectedAnimal).toBe('corgi');
    expect(calculateClickPower(state)).toBe(1);
    expect(calculatePps(state)).toBe(0);
    expect(state.equippedHat).toBeNull();
    expect(state.goldenEvent.active).toBe(false);
  });

  it('handles basic click increments correctly', () => {
    const s0 = createInitialState();
    const { state: s1, amountAdded } = handleClick(s0);

    expect(amountAdded).toBe(1);
    expect(s1.produce).toBe(1);
    expect(s1.lifetimeProduce).toBe(1);
    expect(s1.totalClicks).toBe(1);

    const { state: s2 } = handleClick(s1);
    expect(s2.produce).toBe(2);
    expect(s2.lifetimeProduce).toBe(2);
    expect(s2.totalClicks).toBe(2);
  });

  it('calculates upgrade costs and applies click upgrades properly', () => {
    let state = createInitialState();
    state.produce = 100;

    const gloves = state.clickUpgrades['farmer_gloves'];
    expect(gloves).toBeDefined();
    expect(getUpgradeCost(gloves)).toBe(15);

    // Buy farmer gloves level 1
    const nextState = buyClickUpgrade(state, 'farmer_gloves');
    expect(nextState).not.toBeNull();
    state = nextState!;

    expect(state.produce).toBe(85); // 100 - 15
    expect(state.clickUpgrades['farmer_gloves'].level).toBe(1);
    expect(calculateClickPower(state)).toBe(2); // base 1 + 1 bonus

    // Next level costs more
    expect(getUpgradeCost(state.clickUpgrades['farmer_gloves'])).toBe(17);
  });

  it('rejects upgrade purchase if produce is insufficient', () => {
    const state = createInitialState();
    state.produce = 5; // Costs 15
    const next = buyClickUpgrade(state, 'farmer_gloves');
    expect(next).toBeNull();
  });

  it('calculates building costs and generates PPS correctly', () => {
    let state = createInitialState();
    state.produce = 150;

    const hand = state.buildings['patting_hand'];
    expect(hand).toBeDefined();
    expect(getBuildingCost(hand)).toBe(20);

    // Buy patting hand
    const s1 = buyBuilding(state, 'patting_hand')!;
    expect(s1).not.toBeNull();
    expect(s1.produce).toBe(130);
    expect(s1.buildings['patting_hand'].count).toBe(1);
    expect(calculatePps(s1)).toBe(1);

    // Buy farmhand dog (costs 100, produces 5 pps)
    const s2 = buyBuilding(s1, 'farmhand_dog')!;
    expect(s2).not.toBeNull();
    expect(s2.produce).toBe(30);
    expect(s2.buildings['farmhand_dog'].count).toBe(1);
    expect(calculatePps(s2)).toBe(6); // 1 + 5
  });

  it('handles hat accessory purchase and click multipliers', () => {
    let state = createInitialState();
    state.produce = 600;

    const next = buyHat(state, 'straw_hat')!;
    expect(next).not.toBeNull();
    expect(next.produce).toBe(100); // 600 - 500
    expect(next.hats['straw_hat'].unlocked).toBe(true);
    expect(next.equippedHat).toBe('straw_hat');

    // Straw hat gives 1.1x multiplier
    // Base 1 * 1.1 = Math.floor(1.1) = 1
    // If base click is 10, 10 * 1.1 = 11
    next.clickUpgrades['farmer_gloves'].level = 9; // base = 1 + 9 = 10
    expect(calculateClickPower(next)).toBe(11);

    // Unequip hat
    const unequipped = equipHat(next, null);
    expect(unequipped.equippedHat).toBeNull();
    expect(calculateClickPower(unequipped)).toBe(10);
  });

  it('verifies animal species unlock thresholds', () => {
    const state = createInitialState();
    expect(isAnimalUnlocked(state, 'corgi')).toBe(true);
    expect(isAnimalUnlocked(state, 'capybara')).toBe(false);
    expect(isAnimalUnlocked(state, 'cow')).toBe(false);

    state.lifetimeProduce = 1000;
    expect(isAnimalUnlocked(state, 'capybara')).toBe(true);

    const sWithCapy = selectAnimal(state, 'capybara');
    expect(sWithCapy.selectedAnimal).toBe('capybara');

    // Locked animal cannot be selected
    const sLockedCow = selectAnimal(sWithCapy, 'cow');
    expect(sLockedCow.selectedAnimal).toBe('capybara'); // stays capybara
  });

  it('spawns golden event and triggers 7x Golden Frenzy multiplier', () => {
    let state = createInitialState();
    state.buildings['farmhand_dog'].count = 2; // 10 PPS
    expect(calculatePps(state)).toBe(10);

    state = spawnGoldenEvent(state, 60, 40);
    expect(state.goldenEvent.active).toBe(true);
    expect(state.goldenEvent.x).toBe(60);
    expect(state.goldenEvent.y).toBe(40);

    const { state: frenzyState, bonusWon } = clickGoldenEvent(state);
    expect(frenzyState.goldenEvent.active).toBe(false);
    expect(frenzyState.goldenEvent.frenzyActive).toBe(true);
    expect(frenzyState.goldenEvent.frenzyRemainingMs).toBe(15000);
    expect(bonusWon).toBe(150); // 10 PPS * 15 sec

    // While frenzy is active, PPS and Click Power are multiplied by 7!
    expect(calculatePps(frenzyState)).toBe(70);
    expect(calculateClickPower(frenzyState)).toBe(7); // 1 * 7
  });

  it('ticks state with passive income and handles timer decay', () => {
    let state = createInitialState();
    state.buildings['patting_hand'].count = 10; // 10 PPS

    // 1 second tick (1000ms)
    state = tickState(state, 1000);
    expect(state.produce).toBe(10);
    expect(state.lifetimeProduce).toBe(10);

    // Frenzy timer decay
    state.goldenEvent.frenzyActive = true;
    state.goldenEvent.frenzyRemainingMs = 1500;

    state = tickState(state, 1000);
    expect(state.goldenEvent.frenzyActive).toBe(true);
    expect(state.goldenEvent.frenzyRemainingMs).toBe(500);

    state = tickState(state, 600);
    expect(state.goldenEvent.frenzyActive).toBe(false);
    expect(state.goldenEvent.frenzyRemainingMs).toBe(0);
  });

  it('calculates offline earnings with 4-hour max cap', () => {
    const state = createInitialState();
    state.buildings['patting_hand'].count = 2; // 2 PPS

    const now = Date.now();
    // 1 hour offline = 3600 seconds * 2 PPS = 7200 produce
    const result1h = calculateOfflineEarnings(state, now - 3600 * 1000, now);
    expect(result1h.elapsedSeconds).toBe(3600);
    expect(result1h.earned).toBe(7200);

    // 5 hours offline = capped at 4 hours (14400 seconds) * 2 = 28800 produce
    const result5h = calculateOfflineEarnings(state, now - 5 * 3600 * 1000, now);
    expect(result5h.elapsedSeconds).toBe(14400);
    expect(result5h.earned).toBe(28800);
  });
});

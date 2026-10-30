import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  calculateProducerCost,
  calculateCps,
  calculateClickPower,
  handleClick,
  buyProducer,
  buyUpgrade,
  selectSkin,
  stepPassiveEarnings,
  calculateOfflineEarnings,
  PRODUCERS,
  UPGRADES,
  SKINS,
} from './engine';

describe('Capybara Clicker Logic Engine', () => {
  it('initializes with 0 capybaras, click power 1, and default classic skin', () => {
    const state = createInitialState();
    expect(state.capybaras).toBe(0);
    expect(state.totalEarned).toBe(0);
    expect(state.clickPower).toBe(1);
    expect(state.selectedSkin).toBe('classic');
    expect(state.unlockedSkins).toContain('classic');
  });

  it('increments capybaras and stats on manual click', () => {
    const state = createInitialState();
    const { state: next, earned } = handleClick(state);

    expect(earned).toBe(1);
    expect(next.capybaras).toBe(1);
    expect(next.totalEarned).toBe(1);
    expect(next.stats.totalClicks).toBe(1);
    expect(next.stats.manualCapybaras).toBe(1);
  });

  it('calculates producer cost scaling by 15% per level', () => {
    const base = 15;
    expect(calculateProducerCost(base, 0)).toBe(15);
    expect(calculateProducerCost(base, 1)).toBe(17);
    expect(calculateProducerCost(base, 2)).toBe(19);
    expect(calculateProducerCost(base, 5)).toBe(30);
  });

  it('buys producer when player has enough capybaras', () => {
    let state = createInitialState();
    state.capybaras = 50;

    const res = buyProducer(state, 'guinea-pig');
    expect(res.success).toBe(true);
    expect(res.state.producers['guinea-pig']).toBe(1);
    expect(res.state.capybaras).toBe(35); // 50 - 15

    const failed = buyProducer(res.state, 'onsen-resort'); // costs 12000
    expect(failed.success).toBe(false);
  });

  it('calculates total CPS accurately across multiple producers', () => {
    const producers = {
      'guinea-pig': 3, // 3 * 1 = 3
      'yuzu-bath': 2,   // 2 * 5 = 10
      'citrus-grove': 1, // 1 * 32 = 32
    };
    expect(calculateCps(producers)).toBe(45);
  });

  it('buys upgrades and multiplies click power', () => {
    let state = createInitialState();
    state.capybaras = 2000;

    const res1 = buyUpgrade(state, 'soft-sponge'); // 2x, cost 100
    expect(res1.success).toBe(true);
    expect(res1.state.clickPower).toBe(2);
    expect(res1.state.capybaras).toBe(1900);

    const res2 = buyUpgrade(res1.state, 'golden-brush'); // 3x, cost 1000
    expect(res2.success).toBe(true);
    expect(res2.state.clickPower).toBe(6); // 2 * 3 = 6
    expect(res2.state.capybaras).toBe(900);
  });

  it('unlocks capybara skins automatically on totalEarned milestones', () => {
    let state = createInitialState();
    state.totalEarned = 150; // exceeds 100 for yuzu skin
    const { state: next } = handleClick(state);

    expect(next.unlockedSkins).toContain('yuzu');
    const selected = selectSkin(next, 'yuzu');
    expect(selected.selectedSkin).toBe('yuzu');
  });

  it('steps passive earnings with delta time', () => {
    let state = createInitialState();
    state.producers['guinea-pig'] = 10; // 10 CPS

    const next = stepPassiveEarnings(state, 1.5);
    expect(next.capybaras).toBe(15);
    expect(next.totalEarned).toBe(15);
    expect(next.stats.passiveCapybaras).toBe(15);
  });

  it('calculates offline earnings capped at 2 hours', () => {
    let state = createInitialState(1000000);
    state.producers['guinea-pig'] = 10; // 10 CPS

    // 1 hour later (3600 seconds)
    const res1 = calculateOfflineEarnings(state, 1000000 + 3600 * 1000);
    expect(res1.offlineSeconds).toBe(3600);
    expect(res1.earned).toBe(36000);

    // 5 hours later: should cap at 2 hours (7200 seconds)
    const res2 = calculateOfflineEarnings(state, 1000000 + 5 * 3600 * 1000);
    expect(res2.offlineSeconds).toBe(7200);
    expect(res2.earned).toBe(72000);
  });
});

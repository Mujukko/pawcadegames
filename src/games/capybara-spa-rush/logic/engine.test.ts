import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  seatCritterInTub,
  addYuzuToTub,
  scrubTub,
  serveHerbalTea,
  checkoutSatisfiedCritter,
  buyUpgrade,
  updateSpa,
  generateRandomCritter,
} from './engine';

describe('Capybara Spa Rush Logic Engine', () => {
  it('initializes with 4 tubs (2 unlocked), starting coins, and 1 queued guest', () => {
    const state = createInitialState();
    expect(state.coins).toBe(50);
    expect(state.tubs.length).toBe(4);
    expect(state.tubs[0]!.unlocked).toBe(true);
    expect(state.tubs[1]!.unlocked).toBe(true);
    expect(state.tubs[2]!.unlocked).toBe(false);
    expect(state.tubs[3]!.unlocked).toBe(false);
    expect(state.guestQueue.length).toBe(1);
    expect(state.reputationLevel).toBe(1);
  });

  it('generates valid critters with appropriate traits and rewards', () => {
    const critter = generateRandomCritter();
    expect(['capybara', 'duckling', 'turtle', 'monkey']).toContain(critter.type);
    expect(critter.bliss).toBe(10);
    expect(critter.targetBliss).toBe(100);
    expect(critter.baseReward).toBeGreaterThan(0);
  });

  it('seats a queued critter into an open unlocked tub', () => {
    const state = createInitialState();
    const guestId = state.guestQueue[0]!.id;

    const seated = seatCritterInTub(state, guestId, 0);
    expect(seated).toBe(true);
    expect(state.guestQueue.length).toBe(0);
    expect(state.tubs[0]!.critter).not.toBeNull();
    expect(state.tubs[0]!.critter!.id).toBe(guestId);

    // Cannot seat another guest in the same tub
    const secondGuest = generateRandomCritter();
    state.guestQueue.push(secondGuest);
    const seatedAgain = seatCritterInTub(state, secondGuest.id, 0);
    expect(seatedAgain).toBe(false);

    // Cannot seat in a locked tub
    const seatedLocked = seatCritterInTub(state, secondGuest.id, 2);
    expect(seatedLocked).toBe(false);
  });

  it('adds floating yuzu fruits and satisfies yuzu service requests', () => {
    const state = createInitialState();
    const guest = generateRandomCritter();
    guest.currentNeed = 'yuzu';
    guest.bliss = 20;
    state.guestQueue = [guest];
    seatCritterInTub(state, guest.id, 0);

    const initialYuzu = state.tubs[0]!.yuzuCount;
    const initialCoins = state.coins;

    const added = addYuzuToTub(state, 0);
    expect(added).toBe(true);
    expect(state.tubs[0]!.yuzuCount).toBe(initialYuzu + 1);
    expect(state.tubs[0]!.critter!.currentNeed).toBe('relax');
    expect(state.tubs[0]!.critter!.bliss).toBe(45);
    expect(state.coins).toBe(initialCoins + 15);
    expect(state.stats.yuzuServed).toBe(1);
  });

  it('scrubs dirty tubs and satisfies scrub service requests', () => {
    const state = createInitialState();
    const guest = generateRandomCritter();
    guest.currentNeed = 'scrub';
    guest.bliss = 30;
    state.guestQueue = [guest];
    seatCritterInTub(state, guest.id, 1);
    state.tubs[1]!.cleanliness = 40;

    const initialCoins = state.coins;
    const cleaned = scrubTub(state, 1);
    expect(cleaned).toBe(true);
    expect(state.tubs[1]!.cleanliness).toBeGreaterThan(40);
    expect(state.tubs[1]!.critter!.currentNeed).toBe('relax');
    expect(state.tubs[1]!.critter!.bliss).toBe(60);
    expect(state.coins).toBe(initialCoins + 20);
    expect(state.stats.tubsScrubbed).toBe(1);
  });

  it('serves herbal tea and earns generous customer tips', () => {
    const state = createInitialState();
    const guest = generateRandomCritter();
    guest.currentNeed = 'tea';
    guest.bliss = 40;
    state.guestQueue = [guest];
    seatCritterInTub(state, guest.id, 0);

    const initialCoins = state.coins;
    const served = serveHerbalTea(state, 0);
    expect(served).toBe(true);
    expect(state.tubs[0]!.critter!.currentNeed).toBe('relax');
    expect(state.tubs[0]!.critter!.bliss).toBe(75);
    expect(state.coins).toBe(initialCoins + 25);
    expect(state.stats.teaCupsServed).toBe(1);
  });

  it('processes checkout for fully satisfied critters and awards coins', () => {
    const state = createInitialState();
    const guest = generateRandomCritter();
    guest.bliss = 90;
    state.guestQueue = [guest];
    seatCritterInTub(state, guest.id, 0);

    // Not yet 100 bliss
    const prematureEarnings = checkoutSatisfiedCritter(state, 0);
    expect(prematureEarnings).toBe(0);
    expect(state.tubs[0]!.critter).not.toBeNull();

    // Maximize bliss to 100
    state.tubs[0]!.critter!.bliss = 100;
    const initialCoins = state.coins;
    const earnings = checkoutSatisfiedCritter(state, 0);

    expect(earnings).toBeGreaterThan(0);
    expect(state.coins).toBe(initialCoins + earnings);
    expect(state.tubs[0]!.critter).toBeNull();
    expect(state.totalBlissEarned).toBe(100);
    expect(state.stats.capybarasServed).toBe(1);
  });

  it('buys upgrades and unlocks additional hot tubs', () => {
    const state = createInitialState();
    state.coins = 500;

    // Buy tub 3
    const boughtTub3 = buyUpgrade(state, 'extraTubs');
    expect(boughtTub3).toBe(true);
    expect(state.upgrades.extraTubs).toBe(1);
    expect(state.tubs[2]!.unlocked).toBe(true);

    // Buy tub 4
    const boughtTub4 = buyUpgrade(state, 'extraTubs');
    expect(boughtTub4).toBe(true);
    expect(state.upgrades.extraTubs).toBe(2);
    expect(state.tubs[3]!.unlocked).toBe(true);

    // Cannot buy past max level
    const boughtTooMany = buyUpgrade(state, 'extraTubs');
    expect(boughtTooMany).toBe(false);
  });

  it('rejects upgrades if coins are insufficient', () => {
    const state = createInitialState();
    state.coins = 10;
    const bought = buyUpgrade(state, 'herbalBath');
    expect(bought).toBe(false);
    expect(state.upgrades.herbalBath).toBe(0);
  });

  it('advances natural bliss accumulation and spawns new guests over time', () => {
    const state = createInitialState();
    const guest = generateRandomCritter();
    guest.bliss = 20;
    state.guestQueue = [guest];
    seatCritterInTub(state, guest.id, 0);

    // Simulate 3 seconds
    updateSpa(state, 3.0);
    expect(state.tubs[0]!.critter!.bliss).toBeGreaterThan(20);

    // Spawn timer triggers new guest
    state.spawnTimer = 0.1;
    updateSpa(state, 0.2);
    expect(state.guestQueue.length).toBeGreaterThanOrEqual(1);
  });
});

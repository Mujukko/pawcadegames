import { describe, expect, it } from 'bun:test';
import {
  collectLatte,
  collectTaiyaki,
  createInitialCatCafeState,
  discardPlatterItem,
  prepDonut,
  prepStrawberryCake,
  serveCustomerAtSeat,
  spawnCustomer,
  startBakingTaiyaki,
  startSteamingLatte,
  stepCatCafe,
} from './engine';

describe('Cat Cafe Rush Logic Engine', () => {
  it('initializes day 1 with proper default state and empty platter', () => {
    const state = createInitialCatCafeState(1);
    expect(state.day).toBe(1);
    expect(state.status).toBe('ready');
    expect(state.coins).toBe(0);
    expect(state.score).toBe(0);
    expect(state.servedCount).toBe(0);
    expect(state.missedCount).toBe(0);
    expect(state.readyPlatter.length).toBe(0);
    expect(state.waffleIron.status).toBe('empty');
    expect(state.steamer.status).toBe('empty');
    expect(state.targetServed).toBe(6);
  });

  it('spawns a customer at an open seat', () => {
    const state = createInitialCatCafeState(1);
    const cat = spawnCustomer(state);
    expect(cat).not.toBeNull();
    if (cat) {
      expect(cat.patience).toBe(100);
      expect([0, 1, 2]).toContain(cat.seatIndex);
      expect(['taiyaki', 'purr_donut']).toContain(cat.order);
      state.customers.push(cat);
    }
  });

  it('handles taiyaki baking lifecycle: empty -> baking -> ready -> collected', () => {
    const state = createInitialCatCafeState(1);
    state.status = 'playing';

    // Start baking
    const started = startBakingTaiyaki(state);
    expect(started).toBe(true);
    expect(state.waffleIron.status).toBe('baking');

    // Simulate baking time
    let res = stepCatCafe(state, 3.5);
    expect(res.state.waffleIron.status).toBe('ready');
    expect(res.events.itemCooked).toBe('taiyaki');

    // Collect onto platter
    const collected = collectTaiyaki(res.state);
    expect(collected).toBe(true);
    expect(res.state.readyPlatter).toContain('taiyaki');
    expect(res.state.waffleIron.status).toBe('empty');
  });

  it('burns taiyaki if left on iron for too long', () => {
    const state = createInitialCatCafeState(1);
    state.status = 'playing';
    startBakingTaiyaki(state);

    // Bake to ready
    stepCatCafe(state, 3.5);
    expect(state.waffleIron.status).toBe('ready');

    // Leave until burnt (6s burn duration)
    const res = stepCatCafe(state, 6.5);
    expect(res.state.waffleIron.status).toBe('burnt');
    expect(res.events.itemBurnt).toBe(true);

    // Collecting burnt waffle clears the iron without adding to platter
    const cleared = collectTaiyaki(res.state);
    expect(cleared).toBe(true);
    expect(res.state.waffleIron.status).toBe('empty');
    expect(res.state.readyPlatter).not.toContain('taiyaki');
  });

  it('steams matcha latte and collects onto platter', () => {
    const state = createInitialCatCafeState(2);
    state.status = 'playing';

    const started = startSteamingLatte(state);
    expect(started).toBe(true);
    expect(state.steamer.status).toBe('steaming');

    stepCatCafe(state, 3.0);
    expect(state.steamer.status).toBe('ready');

    const collected = collectLatte(state);
    expect(collected).toBe(true);
    expect(state.readyPlatter).toContain('matcha_latte');
    expect(state.steamer.status).toBe('empty');
  });

  it('preps strawberry cakes and donuts directly to platter up to max capacity', () => {
    const state = createInitialCatCafeState(2);
    expect(prepStrawberryCake(state)).toBe(true);
    expect(prepDonut(state)).toBe(true);
    expect(prepDonut(state)).toBe(true);
    expect(prepDonut(state)).toBe(true);
    // Platter is now full (4 items)
    expect(state.readyPlatter.length).toBe(4);
    expect(prepDonut(state)).toBe(false);

    // Discard one item
    discardPlatterItem(state, 0);
    expect(state.readyPlatter.length).toBe(3);
  });

  it('serves customer with matching platter item and calculates tips & combo', () => {
    const state = createInitialCatCafeState(1);
    state.status = 'playing';

    // Put taiyaki on platter
    state.readyPlatter.push('taiyaki');

    // Create waiting customer at seat 0 requesting taiyaki
    state.customers.push({
      id: 'cat-test',
      name: 'Luna',
      breed: 'calico',
      order: 'taiyaki',
      seatIndex: 0,
      patience: 90,
      maxPatience: 20,
      patienceLeftSec: 18,
      isVip: false,
      status: 'waiting',
    });

    const result = serveCustomerAtSeat(state, 0);
    expect(result.success).toBe(true);
    expect(result.earned).toBeGreaterThan(35); // base price + speed bonus
    expect(state.coins).toBe(result.earned);
    expect(state.servedCount).toBe(1);
    expect(state.combo).toBe(1);
    expect(state.customers.length).toBe(0);
    expect(state.readyPlatter.length).toBe(0);
  });

  it('fails to serve if ordered item is not on platter', () => {
    const state = createInitialCatCafeState(1);
    state.status = 'playing';
    state.readyPlatter.push('purr_donut');

    state.customers.push({
      id: 'cat-test',
      name: 'Milo',
      breed: 'tabby',
      order: 'taiyaki',
      seatIndex: 1,
      patience: 80,
      maxPatience: 20,
      patienceLeftSec: 16,
      isVip: false,
      status: 'waiting',
    });

    const result = serveCustomerAtSeat(state, 1);
    expect(result.success).toBe(false);
    expect(state.servedCount).toBe(0);
    expect(state.customers.length).toBe(1);
  });

  it('resets combo and increments missed count when customer runs out of patience', () => {
    const state = createInitialCatCafeState(1);
    state.status = 'playing';
    state.combo = 4;
    state.customerSpawnTimer = 50; // prevent spontaneous new customer spawn

    state.customers.push({
      id: 'cat-test',
      name: 'Cleo',
      breed: 'siamese',
      order: 'taiyaki',
      seatIndex: 2,
      patience: 5,
      maxPatience: 20,
      patienceLeftSec: 0.5,
      isVip: false,
      status: 'waiting',
    });

    // Advance time past remaining patience
    const res = stepCatCafe(state, 1.0);
    expect(res.events.customerLeftAngry).not.toBeNull();
    expect(res.events.customerLeftAngry?.name).toBe('Cleo');
    expect(res.state.missedCount).toBe(1);
    expect(res.state.combo).toBe(0);
    expect(res.state.customers.some((c) => c.name === 'Cleo')).toBe(false);
  });

  it('triggers shift cleared when target served is reached and shift ends', () => {
    const state = createInitialCatCafeState(1);
    state.status = 'playing';
    state.servedCount = 6;
    state.shiftTimeLeft = 0.5;

    const res = stepCatCafe(state, 1.0);
    expect(res.events.shiftCleared).toBe(true);
    expect(res.state.status).toBe('shift_cleared');
  });
});

import { describe, expect, it } from 'bun:test';
import {
  addSweetness,
  addTopping,
  calculateOrderAccuracy,
  createEmptyCup,
  createInitialState,
  nextShift,
  pourTea,
  restartShift,
  sealAndStraw,
  serveOrder,
  toggleIce,
  trashCup,
  updateEngine,
} from './engine';
import { MAX_TOPPINGS } from './types';

describe('Farm Boba Tea: Animal Cafe Logic Engine', () => {
  it('initializes with an empty cup, fresh customer, and default lives', () => {
    const state = createInitialState(1, 500);
    expect(state.currentCup.teaBase).toBeNull();
    expect(state.currentCup.toppings.length).toBe(0);
    expect(state.currentCustomer).not.toBeNull();
    expect(state.currentCustomer?.patience).toBe(100);
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.shift).toBe(1);
    expect(state.customersServed).toBe(0);
  });

  it('adds toppings to cup up to MAX_TOPPINGS', () => {
    let state = createInitialState(1);
    state = addTopping(state, 'tapioca');
    expect(state.currentCup.toppings).toContain('tapioca');

    state = addTopping(state, 'mango_boba');
    expect(state.currentCup.toppings.length).toBe(2);

    // Exceeding MAX_TOPPINGS should be ignored
    state = addTopping(state, 'strawberry_jelly');
    expect(state.currentCup.toppings.length).toBe(MAX_TOPPINGS);
  });

  it('pours tea base and cycles ice levels', () => {
    let state = createInitialState(1);
    state = pourTea(state, 'matcha');
    expect(state.currentCup.teaBase).toBe('matcha');

    expect(state.currentCup.iceLevel).toBe('none');
    state = toggleIce(state);
    expect(state.currentCup.iceLevel).toBe('normal');
    state = toggleIce(state);
    expect(state.currentCup.iceLevel).toBe('extra');
    state = toggleIce(state);
    expect(state.currentCup.iceLevel).toBe('none');
  });

  it('sets sweetness and requires tea base to seal cup', () => {
    let state = createInitialState(1);
    state = addSweetness(state, 'full');
    expect(state.currentCup.sweetness).toBe('full');

    // Trying to seal without tea base should fail
    state = sealAndStraw(state);
    expect(state.currentCup.isSealed).toBe(false);

    // Pour tea and seal
    state = pourTea(state, 'farm_milk');
    state = sealAndStraw(state);
    expect(state.currentCup.isSealed).toBe(true);
    expect(state.currentCup.hasStraw).toBe(true);

    // Modifications after seal should be prevented
    const postSeal = addTopping(state, 'honeycomb');
    expect(postSeal.currentCup.toppings.length).toBe(0);
  });

  it('calculates order accuracy correctly', () => {
    const order = {
      id: 'test_order',
      customerId: 'daisy_calf' as const,
      customerName: 'Daisy Calf',
      mascot: '🐮',
      avatarColor: 'from-emerald-500 to-green-600',
      requestedTea: 'farm_milk' as const,
      requestedTopping: 'tapioca' as const,
      requestedIce: 'normal' as const,
      requestedSweetness: 'half' as const,
      patience: 100,
      maxPatience: 25,
    };

    // Perfect cup: 40 + 35 + 15 + 10 = 100%
    const perfectCup = {
      teaBase: 'farm_milk' as const,
      toppings: ['tapioca' as const],
      iceLevel: 'normal' as const,
      sweetness: 'half' as const,
      isSealed: true,
      hasStraw: true,
    };
    expect(calculateOrderAccuracy(perfectCup, order)).toBe(100);

    // Wrong tea, but correct topping and ice: 0 + 35 + 15 + 0 = 50%
    const partialCup = {
      teaBase: 'matcha' as const,
      toppings: ['tapioca' as const],
      iceLevel: 'normal' as const,
      sweetness: null,
      isSealed: true,
      hasStraw: true,
    };
    expect(calculateOrderAccuracy(partialCup, order)).toBe(50);
  });

  it('serves a matching order, awards coins and score, and advances customer count', () => {
    let state = createInitialState(1);
    const order = state.currentCustomer!;

    // Build the exact drink the customer requested
    state = pourTea(state, order.requestedTea);
    state = addTopping(state, order.requestedTopping);
    if (order.requestedIce === 'normal') state = toggleIce(state);
    else if (order.requestedIce === 'extra') {
      state = toggleIce(state);
      state = toggleIce(state);
    }
    state = addSweetness(state, order.requestedSweetness);
    state = sealAndStraw(state);

    const servedState = serveOrder(state);
    expect(servedState.customersServed).toBe(1);
    expect(servedState.combo).toBe(1);
    expect(servedState.coins).toBeGreaterThan(0);
    expect(servedState.score).toBeGreaterThan(0);
    expect(servedState.currentCup.teaBase).toBeNull(); // Reset for next order
    expect(servedState.events.some((e) => e.type === 'order_served')).toBe(true);
  });

  it('fails order on wrong ingredients and deducts a life', () => {
    let state = createInitialState(1);
    // Deliberately make wrong drink
    state = pourTea(state, state.currentCustomer?.requestedTea === 'thai_tea' ? 'farm_milk' : 'thai_tea');
    state = sealAndStraw(state);

    const servedState = serveOrder(state);
    expect(servedState.lives).toBe(2);
    expect(servedState.combo).toBe(0);
    expect(servedState.events.some((e) => e.type === 'order_failed')).toBe(true);
  });

  it('empties cup on trash without penalty', () => {
    let state = createInitialState(1);
    state = pourTea(state, 'strawberry');
    state = addTopping(state, 'honeycomb');
    expect(state.currentCup.teaBase).toBe('strawberry');

    state = trashCup(state);
    expect(state.currentCup.teaBase).toBeNull();
    expect(state.currentCup.toppings.length).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.events.some((e) => e.type === 'trash_cup')).toBe(true);
  });

  it('depletes customer patience over time and triggers timeout failure', () => {
    let state = createInitialState(1);
    const initialPatience = state.currentCustomer!.patience;

    // Advance 1 second
    state = updateEngine(state, 1.0);
    expect(state.currentCustomer!.patience).toBeLessThan(initialPatience);

    // Fast-forward past patience duration (28s duration, 0.1s max dt per step)
    const allEvents = [...state.events];
    for (let i = 0; i < 350; i++) {
      state = updateEngine(state, 0.1);
      allEvents.push(...state.events);
      if (state.lives < 3) break;
    }

    expect(state.lives).toBe(2);
    expect(allEvents.some((e) => e.type === 'order_failed')).toBe(true);
  });

  it('completes shift when target customers are served and advances to next shift', () => {
    let state = createInitialState(1);
    // Artificially set target customers to 1
    state.targetCustomers = 1;

    // Fulfill customer
    const order = state.currentCustomer!;
    state = pourTea(state, order.requestedTea);
    state = addTopping(state, order.requestedTopping);
    state = sealAndStraw(state);

    state = serveOrder(state);
    expect(state.shiftComplete).toBe(true);
    expect(state.events.some((e) => e.type === 'shift_clear')).toBe(true);

    // Advance to next shift
    const next = nextShift(state);
    expect(next.shift).toBe(2);
    expect(next.shiftComplete).toBe(false);
    expect(next.customersServed).toBe(0);
  });
});

import { describe, expect, it } from 'bun:test';
import {
  addCherry,
  addScoop,
  addSyrup,
  addTopping,
  addWhippedCream,
  calculateIceCreamAccuracy,
  createEmptyCone,
  createInitialState,
  nextShift,
  serveIceCream,
  switchBase,
  trashCone,
  updateEngine,
} from './engine';
import { MAX_SCOOPS } from './types';

describe('Barnyard Ice Cream: Scoop & Stack Logic Engine', () => {
  it('initializes with empty cone, waiting customer, and default lives', () => {
    const state = createInitialState(1, 400);
    expect(state.currentCone.scoops.length).toBe(0);
    expect(state.currentCone.base).toBe('waffle_cone');
    expect(state.currentCustomer).not.toBeNull();
    expect(state.currentCustomer?.patience).toBe(100);
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(400);
    expect(state.shift).toBe(1);
  });

  it('switches base between waffle cone and sundae bowl', () => {
    let state = createInitialState(1);
    state = switchBase(state, 'sundae_bowl');
    expect(state.currentCone.base).toBe('sundae_bowl');

    state = switchBase(state, 'waffle_cone');
    expect(state.currentCone.base).toBe('waffle_cone');
  });

  it('stacks scoops up to MAX_SCOOPS', () => {
    let state = createInitialState(1);
    state = addScoop(state, 'vanilla');
    state = addScoop(state, 'strawberry');
    state = addScoop(state, 'chocolate');
    expect(state.currentCone.scoops.length).toBe(3);

    state = addScoop(state, 'mint');
    expect(state.currentCone.scoops.length).toBe(4);

    // 5th scoop should be rejected (MAX_SCOOPS is 4)
    state = addScoop(state, 'caramel');
    expect(state.currentCone.scoops.length).toBe(MAX_SCOOPS);
  });

  it('adds syrup and toppings only when scoops exist', () => {
    let state = createInitialState(1);
    // Cannot add syrup or topping to empty cone
    state = addSyrup(state, 'fudge');
    state = addTopping(state, 'rainbow_sprinkles');
    expect(state.currentCone.syrups.length).toBe(0);
    expect(state.currentCone.toppings.length).toBe(0);

    // Add scoop first
    state = addScoop(state, 'caramel');
    state = addSyrup(state, 'fudge');
    state = addTopping(state, 'rainbow_sprinkles');
    expect(state.currentCone.syrups).toContain('fudge');
    expect(state.currentCone.toppings).toContain('rainbow_sprinkles');

    // Duplicate additions should be ignored
    state = addSyrup(state, 'fudge');
    expect(state.currentCone.syrups.length).toBe(1);
  });

  it('adds whipped cream and cherry toppers', () => {
    let state = createInitialState(1);
    state = addScoop(state, 'vanilla');
    state = addWhippedCream(state);
    state = addCherry(state);

    expect(state.currentCone.hasWhippedCream).toBe(true);
    expect(state.currentCone.hasCherry).toBe(true);
  });

  it('calculates order accuracy correctly', () => {
    const order = {
      id: 'test_order',
      customerId: 'penny_piglet' as const,
      name: 'Penny Piglet',
      mascot: '🐷',
      avatarColor: 'from-pink-500 to-rose-600',
      requestedBase: 'waffle_cone' as const,
      requestedScoops: ['strawberry' as const, 'vanilla' as const],
      requestedSyrup: 'strawberry_glaze' as const,
      requestedTopping: 'rainbow_sprinkles' as const,
      wantsCherry: true,
      patience: 100,
      maxPatience: 25,
    };

    // Perfect cone: 15 (base) + 55 (scoops) + 15 (syrup) + 10 (topping) + 5 (cherry) = 100
    const perfectCone = {
      base: 'waffle_cone' as const,
      scoops: ['strawberry' as const, 'vanilla' as const],
      syrups: ['strawberry_glaze' as const],
      toppings: ['rainbow_sprinkles' as const],
      hasWhippedCream: false,
      hasCherry: true,
    };
    expect(calculateIceCreamAccuracy(perfectCone, order)).toBe(100);

    // Empty cone: 0
    const emptyCone = createEmptyCone('waffle_cone');
    expect(calculateIceCreamAccuracy(emptyCone, order)).toBe(0);
  });

  it('serves a matching ice cream order, awards score and coins, and clears cone', () => {
    let state = createInitialState(1);
    const order = state.currentCustomer!;

    // Build matching order
    state = switchBase(state, order.requestedBase);
    order.requestedScoops.forEach((flavor) => {
      state = addScoop(state, flavor);
    });
    if (order.requestedSyrup) state = addSyrup(state, order.requestedSyrup);
    if (order.requestedTopping) state = addTopping(state, order.requestedTopping);
    if (order.wantsCherry) state = addCherry(state);

    const servedState = serveIceCream(state);
    expect(servedState.customersServed).toBe(1);
    expect(servedState.combo).toBe(1);
    expect(servedState.coins).toBeGreaterThan(0);
    expect(servedState.score).toBeGreaterThan(0);
    expect(servedState.currentCone.scoops.length).toBe(0); // Reset for next order
    expect(servedState.events.some((e) => e.type === 'order_served')).toBe(true);
  });

  it('fails order on completely wrong scoops and deducts a life', () => {
    let state = createInitialState(1);
    // Add completely wrong flavor
    state = addScoop(state, 'mint');
    state = addScoop(state, 'chocolate');
    // Change requested customer to want strawberry only
    state.currentCustomer!.requestedScoops = ['strawberry'];
    state.currentCustomer!.requestedBase = 'sundae_bowl';

    const servedState = serveIceCream(state);
    expect(servedState.lives).toBe(2);
    expect(servedState.combo).toBe(0);
    expect(servedState.events.some((e) => e.type === 'order_failed')).toBe(true);
  });

  it('resets cone on trash without life loss', () => {
    let state = createInitialState(1);
    state = addScoop(state, 'chocolate');
    state = addSyrup(state, 'fudge');
    expect(state.currentCone.scoops.length).toBe(1);

    state = trashCone(state);
    expect(state.currentCone.scoops.length).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.events.some((e) => e.type === 'trash_cone')).toBe(true);
  });

  it('depletes patience over time and drops life on timeout', () => {
    let state = createInitialState(1);
    const allEvents = [...state.events];

    // Step loop forward past patience duration (28s duration, 0.1s max dt per step)
    for (let i = 0; i < 350; i++) {
      state = updateEngine(state, 0.1);
      allEvents.push(...state.events);
      if (state.lives < 3) break;
    }

    expect(state.lives).toBe(2);
    expect(allEvents.some((e) => e.type === 'order_failed')).toBe(true);
  });
});

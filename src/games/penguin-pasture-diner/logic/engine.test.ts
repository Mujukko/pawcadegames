import { describe, expect, it } from 'bun:test';
import {
  advanceDay,
  buyUpgrade,
  clearTable,
  createInitialState,
  pickupDish,
  restartShift,
  seatCustomer,
  serveDish,
  takeOrder,
  updateGame,
} from './engine';

describe('Penguin Pasture Diner: Cafe Dash Logic Engine', () => {
  it('initializes day 1 diner state with 4 empty tables, waitress, and target money', () => {
    const state = createInitialState(1);
    expect(state.day).toBe(1);
    expect(state.status).toBe('shift_active');
    expect(state.tables.length).toBe(4);
    expect(state.tables.every((t) => t.status === 'empty')).toBe(true);
    expect(state.targetMoney).toBe(110);
    expect(state.upgrades.length).toBe(3);
  });

  it('seats customer from door to an empty table', () => {
    let state = createInitialState(1);
    state.customers = [
      {
        id: 'c1',
        species: 'penguin',
        x: 45,
        y: 220,
        targetX: 45,
        targetY: 220,
        state: 'at_door',
        patience: 100,
        eatTimer: 5,
      },
    ];

    state = seatCustomer(state, 'c1', 't1');
    expect(state.tables[0].status).toBe('occupied');
    expect(state.tables[0].customerId).toBe('c1');
    expect(state.customers[0].state).toBe('seated');
    expect(state.events.some((e) => e.type === 'seat_customer')).toBe(true);
  });

  it('takes order from ordering customer and queues food in kitchen', () => {
    let state = createInitialState(1);
    state.customers = [
      {
        id: 'c1',
        species: 'penguin',
        x: 150,
        y: 160,
        targetX: 150,
        targetY: 160,
        state: 'ordering',
        patience: 80,
        tableId: 't1',
        eatTimer: 5,
      },
    ];
    state.tables[0].status = 'occupied';
    state.tables[0].customerId = 'c1';

    state = takeOrder(state, 't1');
    expect(state.kitchenOrders.length).toBe(1);
    expect(state.customers[0].state).toBe('waiting_food');
    expect(state.events.some((e) => e.type === 'take_order')).toBe(true);
  });

  it('cooks food order over time until ready', () => {
    let state = createInitialState(1);
    state.kitchenOrders = [
      {
        id: 'ord-1',
        dish: 'kelp_shake',
        tableId: 't1',
        prepTimeLeft: 0.02,
        ready: false,
      },
    ];

    state = updateGame(state, 0.05);
    expect(state.kitchenOrders[0].ready).toBe(true);
    expect(state.events.some((e) => e.type === 'dish_ready')).toBe(true);
  });

  it('picks up ready dish from food counter', () => {
    let state = createInitialState(1);
    state.kitchenOrders = [
      {
        id: 'ord-1',
        dish: 'clam_pie',
        tableId: 't1',
        prepTimeLeft: 0,
        ready: true,
      },
    ];

    state = pickupDish(state, 'ord-1');
    expect(state.waitress.carriedDish).toBe('clam_pie');
    expect(state.kitchenOrders.length).toBe(0);
    expect(state.events.some((e) => e.type === 'pickup_dish')).toBe(true);
  });

  it('serves carried dish to waiting table and starts customer eating', () => {
    let state = createInitialState(1);
    state.waitress.carriedDish = 'fish_sundae';
    state.tables[0].status = 'occupied';
    state.tables[0].customerId = 'c1';

    state.customers = [
      {
        id: 'c1',
        species: 'penguin',
        x: 150,
        y: 160,
        targetX: 150,
        targetY: 160,
        state: 'waiting_food',
        order: 'fish_sundae',
        tableId: 't1',
        patience: 75,
        eatTimer: 4.5,
      },
    ];

    state = serveDish(state, 't1');
    expect(state.waitress.carriedDish).toBeUndefined();
    expect(state.customers[0].state).toBe('eating');
    expect(state.tables[0].servedDish).toBe('fish_sundae');
    expect(state.events.some((e) => e.type === 'serve_dish')).toBe(true);
  });

  it('completes eating, customer leaves tip, and marks table dirty', () => {
    let state = createInitialState(1);
    state.tables[0].status = 'occupied';
    state.tables[0].customerId = 'c1';

    state.customers = [
      {
        id: 'c1',
        species: 'penguin',
        x: 150,
        y: 160,
        targetX: 150,
        targetY: 160,
        state: 'eating',
        order: 'ice_cake',
        tableId: 't1',
        patience: 80,
        eatTimer: 0.02,
      },
    ];

    state = updateGame(state, 0.05);
    expect(state.tables[0].status).toBe('dirty');
    expect(state.tables[0].tipAmount).toBeGreaterThan(30);
    expect(state.events.some((e) => e.type === 'table_dirty')).toBe(true);
    expect(state.customers.length).toBe(0); // Left table
  });

  it('clears dirty table, collects cash tip, and resets table to empty', () => {
    let state = createInitialState(1);
    state.tables[0].status = 'dirty';
    state.tables[0].tipAmount = 45;

    state = clearTable(state, 't1');
    expect(state.tables[0].status).toBe('empty');
    expect(state.tables[0].tipAmount).toBe(0);
    expect(state.money).toBe(45);
    expect(state.events.some((e) => e.type === 'clear_table')).toBe(true);
  });

  it('purchases upgrades with earnings and applies speed boosts', () => {
    let state = createInitialState(1);
    state.money = 100;
    const initialSpeed = state.waitress.speed;

    state = buyUpgrade(state, 'speed_skates');
    expect(state.money).toBe(40); // 100 - 60
    expect(state.waitress.speed).toBeGreaterThan(initialSpeed);
    expect(state.upgrades[0].purchased).toBe(true);
  });

  it('triggers shift_summary when shift ends with earnings above target', () => {
    let state = createInitialState(1);
    state.money = 120; // Target is 110
    state.shiftTimer = 0.02;

    state = updateGame(state, 0.05);
    expect(state.status).toBe('shift_summary');
    expect(state.events.some((e) => e.type === 'shift_complete')).toBe(true);
  });

  it('triggers game_over when shift ends below target earnings', () => {
    let state = createInitialState(1);
    state.money = 60; // Below 110
    state.shiftTimer = 0.02;

    state = updateGame(state, 0.05);
    expect(state.status).toBe('game_over');
  });

  it('triggers victory when clearing day 3 with target met', () => {
    let state = createInitialState(3);
    state.money = 280; // Target is 260
    state.shiftTimer = 0.02;

    state = updateGame(state, 0.05);
    expect(state.status).toBe('victory');
    expect(state.events.some((e) => e.type === 'victory')).toBe(true);
  });
});

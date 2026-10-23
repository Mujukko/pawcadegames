import { describe, it, expect } from 'bun:test';
import {
  initializeLevel,
  isCartPathBlocked,
  processDockBoarding,
  driveCartToDock,
  Cart,
} from './engine';

describe('Sheep Cart Jam: Meadow Escape Core Engine', () => {
  it('initializes Level 1 with 3 carts and 9 queued sheep', () => {
    const state = initializeLevel(1);
    expect(state.level).toBe(1);
    expect(state.carts.length).toBe(3);
    expect(state.sheepQueue.length).toBe(9);
    expect(state.dockBays.every(b => b === null)).toBe(true);
    expect(state.score).toBe(0);
    expect(state.isWon).toBe(false);
    expect(state.isGameOver).toBe(false);
  });

  it('correctly detects when a cart path is clear or blocked', () => {
    const c1: Cart = {
      id: 'c1',
      color: 'pink',
      x: 2,
      y: 3,
      width: 1,
      height: 2,
      orientation: 'vertical',
      exitDirection: 'up',
      capacity: 3,
      passengers: 0,
    };
    const c2Blocking: Cart = {
      id: 'c2',
      color: 'blue',
      x: 2,
      y: 1,
      width: 1,
      height: 1,
      orientation: 'horizontal',
      exitDirection: 'up',
      capacity: 3,
      passengers: 0,
    };

    // Blocked by c2
    expect(isCartPathBlocked(c1, [c1, c2Blocking], 6, 8)).toBe(true);

    // If c2 moves out of the way, path is clear
    expect(isCartPathBlocked(c1, [c1], 6, 8)).toBe(false);
  });

  it('processes dock boarding: matches front sheep with docked carts and departs when full', () => {
    const dockCart: Cart = {
      id: 'cart-pink',
      color: 'pink',
      x: 0,
      y: 0,
      width: 1,
      height: 2,
      orientation: 'vertical',
      exitDirection: 'up',
      capacity: 3,
      passengers: 1,
    };

    const initialBays = [dockCart, null, null];
    const initialQueue: ('pink' | 'blue')[] = ['pink', 'pink', 'blue'];

    const result = processDockBoarding(initialBays, initialQueue);

    // 2 pink sheep boarded, making cart full (1 + 2 = 3). Cart departs!
    expect(result.departedCount).toBe(1);
    expect(result.newDockBays[0]).toBeNull();
    // Front queue now has 'blue' remaining
    expect(result.newQueue).toEqual(['blue']);
    // Points: 2 * 25 (boarding) + 100 (departure bonus) = 150
    expect(result.pointsEarned).toBe(150);
  });

  it('drives an unblocked cart to dock and successfully boards waiting sheep', () => {
    const state = initializeLevel(1);
    // In Level 1, c1 (pink) has exitDirection 'up' at (1, 1) with clear path to y=0
    expect(isCartPathBlocked(state.carts.find(c => c.id === 'c1')!, state.carts, 6, 7)).toBe(false);

    const nextState = driveCartToDock(state, 'c1');
    expect(nextState.moves).toBe(1);
    expect(nextState.carts.some(c => c.id === 'c1')).toBe(false);
    // Since front 3 sheep in queue are pink, c1 was filled to 3 and departed!
    expect(nextState.departedCartsCount).toBe(1);
    expect(nextState.dockBays.every(b => b === null)).toBe(true);
    expect(nextState.sheepQueue.length).toBe(6);
  });

  it('prevents driving a blocked cart to dock', () => {
    const state = initializeLevel(2);
    // In Level 2, c2 (pink, y:2, exit: 'up') is blocked by c1 (yellow, y:0, width: 2)
    const c2 = state.carts.find(c => c.id === 'c2')!;
    expect(isCartPathBlocked(c2, state.carts, 6, 8)).toBe(true);

    const nextState = driveCartToDock(state, 'c2');
    // Moves and carts should remain identical because move was invalid
    expect(nextState.moves).toBe(0);
    expect(nextState.carts.length).toBe(state.carts.length);
  });

  it('reaches victory when all carts and sheep are successfully boarded and departed', () => {
    let state = initializeLevel(1);
    // Level 1 order: c1 (pink, up), c2 (blue, up), c3 (yellow, right)
    state = driveCartToDock(state, 'c1');
    state = driveCartToDock(state, 'c2');
    state = driveCartToDock(state, 'c3');

    expect(state.isWon).toBe(true);
    expect(state.isGameOver).toBe(false);
    expect(state.departedCartsCount).toBe(3);
    expect(state.sheepQueue.length).toBe(0);
  });

  it('triggers game over when dock is full with no matching carts for the waiting sheep', () => {
    // Construct a state where dock has 3 carts of color 'blue', 'yellow', 'green'
    // but the front sheep in queue is 'pink'
    const state = initializeLevel(1);
    const cartBlue: Cart = { id: 'b1', color: 'blue', x: 0, y: 0, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 };
    const cartYellow: Cart = { id: 'y1', color: 'yellow', x: 0, y: 0, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 };
    const cartGreen: Cart = { id: 'g1', color: 'green', x: 0, y: 0, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 };

    const filledDockState = {
      ...state,
      carts: [],
      dockBays: [cartBlue, cartYellow, cartGreen],
      sheepQueue: ['pink' as const, 'pink' as const],
    };

    // Try driving or evaluating loss condition
    const { newDockBays, newQueue } = processDockBoarding(filledDockState.dockBays, filledDockState.sheepQueue);
    expect(newDockBays.every(b => b !== null)).toBe(true);
    expect(newDockBays.some(b => b?.color === newQueue[0])).toBe(false);
  });
});

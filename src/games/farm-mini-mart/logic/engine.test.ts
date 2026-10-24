import { describe, it, expect } from 'bun:test';
import {
  createInitialMartState,
  updateMartGame,
  spawnCustomer,
  upgradePlayerSpeed,
  upgradePlayerCapacity,
  distance,
  saveMartState,
  loadMartState,
  isPadVisible,
  PRODUCTS,
} from './engine';

describe('Farm Mini Mart Core Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialMartState();

    expect(state.player.coins).toBe(15);
    expect(state.player.capacity).toBe(4);
    expect(state.player.speed).toBe(150);
    expect(state.player.stack).toEqual([]);

    // Tomato plot and shelf are unlocked initially
    const tomatoPlot = state.plots.find((p) => p.id === 'plot-tomato');
    const tomatoShelf = state.shelves.find((s) => s.id === 'shelf-tomato');
    expect(tomatoPlot?.unlocked).toBe(true);
    expect(tomatoShelf?.unlocked).toBe(true);

    // Other plots are locked initially
    const cornPlot = state.plots.find((p) => p.id === 'plot-corn');
    expect(cornPlot?.unlocked).toBe(false);

    expect(state.helper.unlocked).toBe(false);
    expect(state.register.hasCashier).toBe(false);
  });

  describe('Player Movement & Boundary Constraints', () => {
    it('moves player based on directional input', () => {
      const state = createInitialMartState();
      const initialX = state.player.x;
      const initialY = state.player.y;

      const { nextState } = updateMartGame(state, 100, { dx: 1, dy: 0 });
      expect(nextState.player.x).toBeGreaterThan(initialX);
      expect(nextState.player.facing).toBe('right');
    });

    it('clamps player within world bounds', () => {
      let state = createInitialMartState();
      // Try to run off the screen to the left
      for (let i = 0; i < 50; i++) {
        state = updateMartGame(state, 100, { dx: -1, dy: 0 }).nextState;
      }
      expect(state.player.x).toBeGreaterThanOrEqual(30);
    });
  });

  describe('Crop Growth & Player Harvesting', () => {
    it('grows crops over time up to plot capacity', () => {
      const state = createInitialMartState();
      const plot = state.plots.find((p) => p.id === 'plot-tomato')!;
      plot.readyCount = 0;
      plot.growTimer = 0;

      // Advance time by growTimeMs
      const { nextState } = updateMartGame(state, plot.growTimeMs + 50, { dx: 0, dy: 0 });
      const updatedPlot = nextState.plots.find((p) => p.id === 'plot-tomato')!;
      expect(updatedPlot.readyCount).toBe(1);
    });

    it('harvests crops when player stands near plot up to carry capacity', () => {
      const state = createInitialMartState();
      const plot = state.plots.find((p) => p.id === 'plot-tomato')!;
      plot.readyCount = 3;

      // Position player next to tomato plot
      state.player.x = plot.x + plot.width / 2;
      state.player.y = plot.y + plot.height / 2;
      state.player.stack = [];

      const { nextState, events } = updateMartGame(state, 50, { dx: 0, dy: 0 });
      expect(nextState.player.stack.length).toBe(1);
      expect(nextState.player.stack[0]).toBe('tomato');
      expect(events).toContain('harvest');
      expect(nextState.plots.find((p) => p.id === 'plot-tomato')!.readyCount).toBe(2);
    });

    it('does not harvest more crops once player carry capacity is reached', () => {
      const state = createInitialMartState();
      const plot = state.plots.find((p) => p.id === 'plot-tomato')!;
      plot.readyCount = 4;

      // Fill player stack to full capacity (4)
      state.player.x = plot.x + plot.width / 2;
      state.player.y = plot.y + plot.height / 2;
      state.player.stack = ['tomato', 'tomato', 'tomato', 'tomato'];

      const { nextState } = updateMartGame(state, 50, { dx: 0, dy: 0 });
      expect(nextState.player.stack.length).toBe(4);
      expect(nextState.plots.find((p) => p.id === 'plot-tomato')!.readyCount).toBe(4);
    });
  });

  describe('Shelf Restocking', () => {
    it('restocks matching shelf when player stands near it with items in stack', () => {
      const state = createInitialMartState();
      const shelf = state.shelves.find((s) => s.id === 'shelf-tomato')!;
      shelf.currentStock = 2;

      state.player.stack = ['tomato', 'tomato'];
      state.player.x = shelf.x + shelf.width / 2;
      state.player.y = shelf.y + shelf.height / 2;

      const { nextState, events } = updateMartGame(state, 50, { dx: 0, dy: 0 });
      expect(nextState.player.stack.length).toBe(1);
      expect(nextState.shelves.find((s) => s.id === 'shelf-tomato')!.currentStock).toBe(3);
      expect(events).toContain('stock');
    });

    it('does not overfill shelf past maxStock', () => {
      const state = createInitialMartState();
      const shelf = state.shelves.find((s) => s.id === 'shelf-tomato')!;
      shelf.currentStock = shelf.maxStock;

      state.player.stack = ['tomato'];
      state.player.x = shelf.x + shelf.width / 2;
      state.player.y = shelf.y + shelf.height / 2;

      const { nextState } = updateMartGame(state, 50, { dx: 0, dy: 0 });
      expect(nextState.player.stack.length).toBe(1);
      expect(nextState.shelves.find((s) => s.id === 'shelf-tomato')!.currentStock).toBe(shelf.maxStock);
    });
  });

  describe('Unlock Pads & Progression', () => {
    it('transfers coins to unlock pad when player stands on it', () => {
      const state = createInitialMartState();
      state.player.coins = 50;
      const cornPad = state.unlockPads.find((p) => p.id === 'pad-corn-plot')!;

      state.player.x = cornPad.x;
      state.player.y = cornPad.y;

      const { nextState, events } = updateMartGame(state, 100, { dx: 0, dy: 0 });
      const updatedPad = nextState.unlockPads.find((p) => p.id === 'pad-corn-plot')!;
      expect(updatedPad.paid).toBeGreaterThan(0);
      expect(nextState.player.coins).toBeLessThan(50);
      expect(events).toContain('coin_deposit');
    });

    it('unlocks target station when paid cost reaches total cost', () => {
      const state = createInitialMartState();
      state.player.coins = 100;
      const cornPad = state.unlockPads.find((p) => p.id === 'pad-corn-plot')!;
      cornPad.paid = cornPad.cost - 2;

      state.player.x = cornPad.x;
      state.player.y = cornPad.y;

      const { nextState, events } = updateMartGame(state, 100, { dx: 0, dy: 0 });
      const updatedPad = nextState.unlockPads.find((p) => p.id === 'pad-corn-plot')!;
      expect(updatedPad.unlocked).toBe(true);
      expect(nextState.plots.find((p) => p.id === 'plot-corn')!.unlocked).toBe(true);
      expect(events).toContain('unlock_station');
    });
  });

  describe('Customer AI, Shopping & Checkout', () => {
    it('spawns a customer with wishlist from unlocked shelves', () => {
      const state = createInitialMartState();
      const nextState = spawnCustomer(state);

      expect(nextState.customers.length).toBe(1);
      const customer = nextState.customers[0]!;
      expect(customer.wants.length).toBeGreaterThan(0);
      expect(customer.wants[0]!.product).toBe('tomato'); // Only tomato unlocked initially
      expect(customer.state).toBe('shopping');
    });

    it('customer picks item from shelf and enters checkout queue', () => {
      const state = createInitialMartState();
      const shelf = state.shelves.find((s) => s.id === 'shelf-tomato')!;
      shelf.currentStock = 5;

      const customerState = spawnCustomer(state);
      const cust = customerState.customers[0]!;
      cust.wants[0]!.amount = 1;
      cust.wants[0]!.collected = 0;

      // Position customer directly at shelf interaction point
      cust.x = shelf.x + shelf.width / 2;
      cust.y = shelf.y + shelf.height + 25;

      const { nextState, events } = updateMartGame(customerState, 50, { dx: 0, dy: 0 });
      const updatedCust = nextState.customers.find((c) => c.id === cust.id)!;

      expect(updatedCust.basket).toContain('tomato');
      expect(updatedCust.state).toBe('in_queue');
      expect(events).toContain('customer_pick');
      expect(nextState.shelves.find((s) => s.id === 'shelf-tomato')!.currentStock).toBe(4);
    });

    it('processes checkout when player stands at cash register', () => {
      const state = createInitialMartState();
      const customerState = spawnCustomer(state);
      const cust = customerState.customers[0]!;
      cust.state = 'in_queue';
      cust.queueIndex = 0;
      cust.basket = ['tomato', 'tomato'];

      // Position player at cashier register counter
      state.player.x = state.register.x + state.register.width / 2;
      state.player.y = state.register.y + state.register.height / 2 - 15;

      // Run multiple steps to complete serveTimer (700ms)
      let current = customerState;
      let kachingEventTriggered = false;

      for (let i = 0; i < 16; i++) {
        const step = updateMartGame(current, 50, { dx: 0, dy: 0 });
        current = step.nextState;
        if (step.events.includes('kaching')) {
          kachingEventTriggered = true;
          break;
        }
      }

      expect(kachingEventTriggered).toBe(true);
      expect(current.player.totalEarned).toBe(PRODUCTS.tomato.sellPrice * 2);
      expect(current.player.customersServed).toBe(1);

      const updatedCust = current.customers.find((c) => c.id === cust.id);
      expect(updatedCust?.state).toBe('leaving');
    });

    it('collects coins from register counter into player wallet', () => {
      const state = createInitialMartState();
      state.register.coinsOnCounter = 100;
      state.player.coins = 20;

      // Move player into register area
      state.player.x = state.register.x + state.register.width / 2;
      state.player.y = state.register.y + state.register.height / 2;

      const { nextState, events } = updateMartGame(state, 50, { dx: 0, dy: 0 });
      expect(nextState.player.coins).toBe(120);
      expect(nextState.register.coinsOnCounter).toBe(0);
      expect(events).toContain('coin_pickup');
    });
  });

  describe('Helper Worker AI & Automation', () => {
    it('unlocked helper harvests ready crops and restocks shelves', () => {
      const state = createInitialMartState();
      state.helper.unlocked = true;
      const plot = state.plots.find((p) => p.id === 'plot-tomato')!;
      plot.readyCount = 4;

      const shelf = state.shelves.find((s) => s.id === 'shelf-tomato')!;
      shelf.currentStock = 1;

      // Place helper directly at tomato plot
      state.helper.x = plot.x + plot.width / 2;
      state.helper.y = plot.y + plot.height / 2;
      state.helper.stack = [];

      const { nextState } = updateMartGame(state, 50, { dx: 0, dy: 0 });
      expect(nextState.helper.stack.length).toBe(1);
      expect(nextState.helper.stack[0]).toBe('tomato');
    });
  });

  describe('Shop Upgrades & Persistence', () => {
    it('upgrades player walking speed with sufficient coins', () => {
      const state = createInitialMartState();
      state.player.coins = 100;
      const initialSpeed = state.player.speed;

      const res = upgradePlayerSpeed(state);
      expect(res.success).toBe(true);
      expect(res.nextState.player.speedLevel).toBe(2);
      expect(res.nextState.player.speed).toBeGreaterThan(initialSpeed);
      expect(res.nextState.player.coins).toBe(100 - res.cost);
    });

    it('rejects speed upgrade when coins are insufficient', () => {
      const state = createInitialMartState();
      state.player.coins = 5;

      const res = upgradePlayerSpeed(state);
      expect(res.success).toBe(false);
      expect(res.nextState.player.speedLevel).toBe(1);
    });

    it('upgrades player carry capacity with sufficient coins', () => {
      const state = createInitialMartState();
      state.player.coins = 100;
      const initialCapacity = state.player.capacity;

      const res = upgradePlayerCapacity(state);
      expect(res.success).toBe(true);
      expect(res.nextState.player.capacityLevel).toBe(2);
      expect(res.nextState.player.capacity).toBe(initialCapacity + 2);
    });
  });

  describe('Progressive Unlock Disclosure & Anti-Clutter Layout', () => {
    it('only reveals the immediate next progression pad at start (zero screen clutter)', () => {
      const state = createInitialMartState();

      // Only pad-corn-plot should be visible initially
      const visiblePads = state.unlockPads.filter((pad) => isPadVisible(pad, state));
      expect(visiblePads.length).toBe(1);
      expect(visiblePads[0]!.id).toBe('pad-corn-plot');

      // Heavy endgame pads must NEVER be visible at start
      expect(isPadVisible(state.unlockPads.find((p) => p.id === 'pad-milk-plot')!, state)).toBe(false);
      expect(isPadVisible(state.unlockPads.find((p) => p.id === 'pad-pumpkin-plot')!, state)).toBe(false);
      expect(isPadVisible(state.unlockPads.find((p) => p.id === 'pad-cashier')!, state)).toBe(false);
    });

    it('reveals corn crate pad once sweet corn plot is unlocked', () => {
      let state = createInitialMartState();
      state.plots.find((p) => p.id === 'plot-corn')!.unlocked = true;

      const visiblePads = state.unlockPads.filter((pad) => isPadVisible(pad, state));
      const cornShelfPad = visiblePads.find((p) => p.id === 'pad-corn-shelf');
      expect(cornShelfPad).toBeDefined();
    });

    it('guarantees cashier mat zone is 100% free of any unlock pads', () => {
      const state = createInitialMartState();
      // Cashier mat is north of the register: x in [350, 450], y in [360, 420]
      const cashierMatMinX = 350;
      const cashierMatMaxX = 450;
      const cashierMatMinY = 360;
      const cashierMatMaxY = 420;

      for (const pad of state.unlockPads) {
        const insideCashierMat =
          pad.x >= cashierMatMinX - pad.radius &&
          pad.x <= cashierMatMaxX + pad.radius &&
          pad.y >= cashierMatMinY - pad.radius &&
          pad.y <= cashierMatMaxY + pad.radius;

        expect(insideCashierMat).toBe(false);
      }
    });
  });
});


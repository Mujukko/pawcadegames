import {
  CustomerLifecycle,
  CustomerSpecies,
  CustomerState,
  DinerEvent,
  DinerGameState,
  DishType,
  FoodOrder,
  ShopUpgrade,
  TableState,
  WaitressEntity,
} from './types';

export const BOARD_WIDTH = 540;
export const BOARD_HEIGHT = 420;
export const SHIFT_DURATION = 65; // seconds

export const DISH_PRICES: Record<DishType, { price: number; prepTime: number; name: string }> = {
  fish_sundae: { price: 15, prepTime: 3.0, name: 'Fish Sundae' },
  clam_pie: { price: 25, prepTime: 4.0, name: 'Clam Pie' },
  kelp_shake: { price: 18, prepTime: 2.5, name: 'Kelp Shake' },
  ice_cake: { price: 35, prepTime: 4.5, name: 'Ice Berry Cake' },
};

export const INITIAL_TABLES: TableState[] = [
  { id: 't1', number: 1, x: 150, y: 160, status: 'empty', tipAmount: 0 },
  { id: 't2', number: 2, x: 330, y: 160, status: 'empty', tipAmount: 0 },
  { id: 't3', number: 3, x: 150, y: 290, status: 'empty', tipAmount: 0 },
  { id: 't4', number: 4, x: 330, y: 290, status: 'empty', tipAmount: 0 },
];

export const INITIAL_UPGRADES: ShopUpgrade[] = [
  {
    id: 'speed_skates',
    name: 'Speed Skates',
    description: 'Glide 30% faster between tables and kitchen.',
    cost: 60,
    purchased: false,
    icon: '⛸️',
  },
  {
    id: 'plush_booths',
    name: 'Plush Booths',
    description: 'Guests wait 35% longer before losing patience.',
    cost: 85,
    purchased: false,
    icon: '🛋️',
  },
  {
    id: 'golden_tray',
    name: 'Golden Platter',
    description: 'Delivering meals awards 25% larger cash tips.',
    cost: 110,
    purchased: false,
    icon: '✨',
  },
];

let customerCounter = 1;
let orderCounter = 1;

export function createInitialState(day = 1): DinerGameState {
  const targetMoney = day === 1 ? 110 : day === 2 ? 180 : 260;

  const waitress: WaitressEntity = {
    x: 240,
    y: 180,
    targetX: 240,
    targetY: 180,
    speed: 180,
    skatesLevel: 0,
  };

  const tables = INITIAL_TABLES.map((t) => ({ ...t, status: 'empty' as const, tipAmount: 0, customerId: undefined, servedDish: undefined }));

  return {
    status: 'shift_active',
    day,
    shiftTimer: SHIFT_DURATION,
    maxShiftTime: SHIFT_DURATION,
    money: 0,
    totalBank: 0,
    targetMoney,
    tables,
    customers: [],
    kitchenOrders: [],
    waitress,
    upgrades: INITIAL_UPGRADES.map((u) => ({ ...u })),
    customerSpawnTimer: 2.0, // spawn first customer after 2s
    events: [],
    boardWidth: BOARD_WIDTH,
    boardHeight: BOARD_HEIGHT,
  };
}

export function spawnCustomer(day: number): CustomerState {
  const speciesList: CustomerSpecies[] = ['penguin', 'polar_bear', 'seal'];
  const species = speciesList[Math.floor(Math.random() * speciesList.length)];
  const maxPatience = species === 'polar_bear' ? 85 : species === 'seal' ? 95 : 100;

  return {
    id: `cust-${customerCounter++}`,
    species,
    x: 45,
    y: 220,
    targetX: 45,
    targetY: 220,
    state: 'at_door',
    patience: maxPatience,
    eatTimer: 5.0,
  };
}

export function getRandomDish(): DishType {
  const dishes: DishType[] = ['fish_sundae', 'clam_pie', 'kelp_shake', 'ice_cake'];
  return dishes[Math.floor(Math.random() * dishes.length)];
}

// Player Action: Tap customer, then tap table
export function seatCustomer(state: DinerGameState, customerId: string, tableId: string): DinerGameState {
  const table = state.tables.find((t) => t.id === tableId);
  const customer = state.customers.find((c) => c.id === customerId);

  if (!table || !customer || table.status !== 'empty' || customer.state !== 'at_door') {
    return state;
  }

  const updatedCustomers = state.customers.map((c) => {
    if (c.id === customerId) {
      return {
        ...c,
        state: 'seated' as CustomerLifecycle,
        tableId,
        targetX: table.x,
        targetY: table.y,
        x: table.x,
        y: table.y,
        patience: Math.min(100, c.patience + 20), // patience boost for getting seated
      };
    }
    return c;
  });

  const updatedTables = state.tables.map((t) => {
    if (t.id === tableId) {
      return { ...t, status: 'occupied' as const, customerId };
    }
    return t;
  });

  const events: DinerEvent[] = [...state.events, { type: 'seat_customer', tableId, customerId }];

  return {
    ...state,
    customers: updatedCustomers,
    tables: updatedTables,
    waitress: {
      ...state.waitress,
      targetX: table.x - 25,
      targetY: table.y,
    },
    events,
  };
}

// Player Action: Take order from a table that is ready
export function takeOrder(state: DinerGameState, tableId: string): DinerGameState {
  const table = state.tables.find((t) => t.id === tableId);
  if (!table || !table.customerId) return state;

  const customer = state.customers.find((c) => c.id === table.customerId);
  if (!customer || customer.state !== 'ordering') return state;

  const chosenDish = getRandomDish();
  const prepTime = DISH_PRICES[chosenDish].prepTime;

  const newOrder: FoodOrder = {
    id: `order-${orderCounter++}`,
    dish: chosenDish,
    tableId,
    prepTimeLeft: prepTime,
    ready: false,
  };

  const updatedCustomers = state.customers.map((c) => {
    if (c.id === customer.id) {
      return {
        ...c,
        state: 'waiting_food' as CustomerLifecycle,
        order: chosenDish,
        patience: Math.min(100, c.patience + 15),
      };
    }
    return c;
  });

  const events: DinerEvent[] = [...state.events, { type: 'take_order', tableId, dish: chosenDish }];

  return {
    ...state,
    customers: updatedCustomers,
    kitchenOrders: [...state.kitchenOrders, newOrder],
    waitress: {
      ...state.waitress,
      targetX: table.x - 25,
      targetY: table.y,
    },
    events,
  };
}

// Player Action: Pick up ready dish from food counter
export function pickupDish(state: DinerGameState, orderId: string): DinerGameState {
  const order = state.kitchenOrders.find((o) => o.id === orderId && o.ready);
  if (!order || state.waitress.carriedDish) return state;

  const remainingOrders = state.kitchenOrders.filter((o) => o.id !== orderId);
  const events: DinerEvent[] = [...state.events, { type: 'pickup_dish', dish: order.dish }];

  return {
    ...state,
    kitchenOrders: remainingOrders,
    waitress: {
      ...state.waitress,
      carriedDish: order.dish,
      targetX: 240,
      targetY: 80,
    },
    events,
  };
}

// Player Action: Serve carried dish to customer table
export function serveDish(state: DinerGameState, tableId: string): DinerGameState {
  if (!state.waitress.carriedDish) return state;

  const table = state.tables.find((t) => t.id === tableId);
  if (!table || !table.customerId) return state;

  const customer = state.customers.find((c) => c.id === table.customerId);
  if (!customer || customer.state !== 'waiting_food' || customer.order !== state.waitress.carriedDish) {
    return state;
  }

  const servedDish = state.waitress.carriedDish;

  const updatedCustomers = state.customers.map((c) => {
    if (c.id === customer.id) {
      return {
        ...c,
        state: 'eating' as CustomerLifecycle,
        eatTimer: 4.5,
      };
    }
    return c;
  });

  const updatedTables = state.tables.map((t) => {
    if (t.id === tableId) {
      return { ...t, servedDish };
    }
    return t;
  });

  const events: DinerEvent[] = [...state.events, { type: 'serve_dish', tableId, dish: servedDish }];

  return {
    ...state,
    customers: updatedCustomers,
    tables: updatedTables,
    waitress: {
      ...state.waitress,
      carriedDish: undefined,
      targetX: table.x - 25,
      targetY: table.y,
    },
    events,
  };
}

// Player Action: Clear table and collect cash tip
export function clearTable(state: DinerGameState, tableId: string): DinerGameState {
  const table = state.tables.find((t) => t.id === tableId);
  if (!table || table.status !== 'dirty') return state;

  const tip = table.tipAmount;
  const newMoney = state.money + tip;

  const updatedTables = state.tables.map((t) => {
    if (t.id === tableId) {
      return {
        ...t,
        status: 'empty' as const,
        customerId: undefined,
        servedDish: undefined,
        tipAmount: 0,
      };
    }
    return t;
  });

  const events: DinerEvent[] = [...state.events, { type: 'clear_table', tableId, coinsEarned: tip }];

  return {
    ...state,
    money: newMoney,
    tables: updatedTables,
    waitress: {
      ...state.waitress,
      targetX: table.x - 25,
      targetY: table.y,
    },
    events,
  };
}

export function buyUpgrade(state: DinerGameState, upgradeId: string): DinerGameState {
  const up = state.upgrades.find((u) => u.id === upgradeId);
  if (!up || up.purchased || state.money < up.cost) return state;

  const updatedUpgrades = state.upgrades.map((u) => {
    if (u.id === upgradeId) return { ...u, purchased: true };
    return u;
  });

  let speed = state.waitress.speed;
  let skatesLevel = state.waitress.skatesLevel;
  if (upgradeId === 'speed_skates') {
    speed += 50;
    skatesLevel += 1;
  }

  return {
    ...state,
    money: state.money - up.cost,
    upgrades: updatedUpgrades,
    waitress: {
      ...state.waitress,
      speed,
      skatesLevel,
    },
  };
}

// Main Frame Tick
export function updateGame(state: DinerGameState, dt: number): DinerGameState {
  if (state.status !== 'shift_active') {
    return state;
  }

  const events: DinerEvent[] = [];
  const clampedDt = Math.min(0.04, Math.max(0.001, dt));

  // 1. Shift Timer Tick
  const shiftTimer = Math.max(0, state.shiftTimer - clampedDt);

  // 2. Waitress Movement
  let waitress = { ...state.waitress };
  const dWx = waitress.targetX - waitress.x;
  const dWy = waitress.targetY - waitress.y;
  const wDist = Math.hypot(dWx, dWy);

  if (wDist > 4) {
    const step = Math.min(wDist, waitress.speed * clampedDt);
    waitress.x += (dWx / wDist) * step;
    waitress.y += (dWy / wDist) * step;
  }

  // 3. Kitchen Orders Cooking Tick
  const kitchenOrders = state.kitchenOrders.map((order) => {
    if (order.ready) return order;
    const timeLeft = order.prepTimeLeft - clampedDt;
    if (timeLeft <= 0) {
      events.push({ type: 'dish_ready', dish: order.dish });
      return { ...order, prepTimeLeft: 0, ready: true };
    }
    return { ...order, prepTimeLeft: timeLeft };
  });

  // 4. Customer Spawning
  let customers = [...state.customers];
  let spawnTimer = state.customerSpawnTimer - clampedDt;

  if (shiftTimer > 10 && spawnTimer <= 0) {
    // Only spawn if fewer than 2 waiting at the door
    const doorCount = customers.filter((c) => c.state === 'at_door').length;
    if (doorCount < 2) {
      customers.push(spawnCustomer(state.day));
    }
    spawnTimer = 6.0 + Math.random() * 4.0;
  }

  // Check Plush Booths upgrade
  const hasPlush = state.upgrades.find((u) => u.id === 'plush_booths')?.purchased;
  const patienceRate = hasPlush ? 1.2 : 1.9;

  let tables = [...state.tables];

  // 5. Customer Patience and State Transitions
  customers = customers
    .map((cust) => {
      let c = { ...cust };

      // Seated transition to ordering
      if (c.state === 'seated') {
        c.patience = Math.max(0, c.patience - patienceRate * clampedDt);
        if (c.patience > 0 && Math.random() < clampedDt * 0.4) {
          c.state = 'ordering';
        }
      } else if (c.state === 'at_door' || c.state === 'ordering' || c.state === 'waiting_food') {
        c.patience = Math.max(0, c.patience - patienceRate * clampedDt);
      } else if (c.state === 'eating') {
        c.eatTimer -= clampedDt;
        if (c.eatTimer <= 0) {
          // Finished eating! Leave tip and mark table dirty
          c.state = 'leaving';
          const basePrice = c.order ? DISH_PRICES[c.order].price : 20;
          const patienceBonus = Math.round((c.patience / 100) * 8);
          const hasGoldTray = state.upgrades.find((u) => u.id === 'golden_tray')?.purchased;
          const totalTip = Math.round((basePrice + patienceBonus) * (hasGoldTray ? 1.25 : 1.0));

          tables = tables.map((t) => {
            if (t.id === c.tableId) {
              return { ...t, status: 'dirty' as const, tipAmount: totalTip, servedDish: undefined };
            }
            return t;
          });

          events.push({ type: 'table_dirty', tableId: c.tableId || 't1', tip: totalTip });
        }
      }

      // Check if patience ran out while not eating
      if (c.patience <= 0 && c.state !== 'eating' && c.state !== 'leaving') {
        c.state = 'leaving';
        events.push({ type: 'customer_left', customerId: c.id, reason: 'patience_lost' });

        if (c.tableId) {
          tables = tables.map((t) => {
            if (t.id === c.tableId) {
              return { ...t, status: 'empty' as const, customerId: undefined, servedDish: undefined };
            }
            return t;
          });
        }
      }

      return c;
    })
    .filter((c) => c.state !== 'leaving'); // Remove customers who left

  // 6. Check Shift Completion
  let nextStatus: DinerGameState['status'] = state.status;
  if (shiftTimer <= 0) {
    if (state.money >= state.targetMoney) {
      if (state.day < 3) {
        nextStatus = 'shift_summary';
      } else {
        nextStatus = 'victory';
        events.push({ type: 'victory', totalBank: state.totalBank + state.money });
      }
    } else {
      nextStatus = 'game_over';
    }
    events.push({
      type: 'shift_complete',
      day: state.day,
      earned: state.money,
      target: state.targetMoney,
    });
  }

  return {
    ...state,
    status: nextStatus,
    shiftTimer,
    tables,
    customers,
    kitchenOrders,
    waitress,
    customerSpawnTimer: spawnTimer,
    events,
  };
}

export function advanceDay(state: DinerGameState): DinerGameState {
  const nextDay = Math.min(3, state.day + 1);
  const nextTarget = nextDay === 2 ? 180 : 260;

  return {
    ...state,
    status: 'shift_active',
    day: nextDay,
    shiftTimer: SHIFT_DURATION,
    totalBank: state.totalBank + state.money,
    money: 0,
    targetMoney: nextTarget,
    tables: INITIAL_TABLES.map((t) => ({ ...t, status: 'empty' as const, tipAmount: 0, customerId: undefined, servedDish: undefined })),
    customers: [],
    kitchenOrders: [],
    waitress: {
      ...state.waitress,
      carriedDish: undefined,
      x: 240,
      y: 180,
      targetX: 240,
      targetY: 180,
    },
    customerSpawnTimer: 2.0,
    events: [],
  };
}

export function restartShift(state: DinerGameState): DinerGameState {
  return createInitialState(state.day);
}

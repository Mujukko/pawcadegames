export type ProductType = 'tomato' | 'corn' | 'egg' | 'milk' | 'pumpkin';

export interface ProductDef {
  type: ProductType;
  name: string;
  emoji: string;
  sellPrice: number;
  growTimeMs: number;
  color: string;
}

export const PRODUCTS: Record<ProductType, ProductDef> = {
  tomato: {
    type: 'tomato',
    name: 'Juicy Tomato',
    emoji: '🍅',
    sellPrice: 10,
    growTimeMs: 1400,
    color: '#ef4444',
  },
  corn: {
    type: 'corn',
    name: 'Sweet Corn',
    emoji: '🌽',
    sellPrice: 18,
    growTimeMs: 2000,
    color: '#eab308',
  },
  egg: {
    type: 'egg',
    name: 'Fresh Egg',
    emoji: '🥚',
    sellPrice: 30,
    growTimeMs: 2600,
    color: '#f8fafc',
  },
  milk: {
    type: 'milk',
    name: 'Farm Milk',
    emoji: '🥛',
    sellPrice: 45,
    growTimeMs: 3400,
    color: '#38bdf8',
  },
  pumpkin: {
    type: 'pumpkin',
    name: 'Halloween Pumpkin',
    emoji: '🎃',
    sellPrice: 75,
    growTimeMs: 4200,
    color: '#ea580c',
  },
};

export interface ProductionPlot {
  id: string;
  product: ProductType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  readyCount: number;
  maxCapacity: number;
  growTimer: number;
  growTimeMs: number;
  unlocked: boolean;
}

export interface Shelf {
  id: string;
  product: ProductType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  currentStock: number;
  maxStock: number;
  unlocked: boolean;
}

export interface CashRegister {
  x: number;
  y: number;
  width: number;
  height: number;
  coinsOnCounter: number;
  hasCashier: boolean;
  serveTimer: number;
}

export interface UnlockPad {
  id: string;
  title: string;
  cost: number;
  paid: number;
  x: number;
  y: number;
  radius: number;
  unlocked: boolean;
  unlocks: {
    type: 'plot' | 'shelf' | 'helper' | 'cashier';
    targetId: string;
  };
}

export type CustomerState =
  | 'entering'
  | 'shopping'
  | 'waiting_stock'
  | 'to_register'
  | 'in_queue'
  | 'paying'
  | 'leaving';

export type AnimalSpecies = 'bunny' | 'bear' | 'cat' | 'dog' | 'pig' | 'ghost';

export interface Customer {
  id: string;
  species: AnimalSpecies;
  name: string;
  emoji: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  state: CustomerState;
  targetShelfId: string | null;
  wants: {
    product: ProductType;
    amount: number;
    collected: number;
  }[];
  basket: ProductType[];
  queueIndex: number;
  waitTimer: number;
  patienceTimer: number;
  facing: 'left' | 'right';
}

export interface HelperWorker {
  id: string;
  name: string;
  emoji: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  capacity: number;
  stack: ProductType[];
  state: 'idle' | 'harvesting' | 'stocking';
  targetPlotId: string | null;
  targetShelfId: string | null;
  unlocked: boolean;
}

export interface FloatingNotification {
  id: string;
  text: string;
  x: number;
  y: number;
  lifeMs: number;
  maxLifeMs: number;
  color: string;
}

export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  capacity: number;
  stack: ProductType[];
  coins: number;
  totalEarned: number;
  customersServed: number;
  facing: 'left' | 'right' | 'up' | 'down';
  speedLevel: number;
  capacityLevel: number;
}

export interface MartGameState {
  player: PlayerState;
  plots: ProductionPlot[];
  shelves: Shelf[];
  register: CashRegister;
  unlockPads: UnlockPad[];
  customers: Customer[];
  helper: HelperWorker;
  floatingNotes: FloatingNotification[];
  customerSpawnTimer: number;
  customerSpawnIntervalMs: number;
  maxCustomers: number;
  reputationLevel: number;
  marketOpen: boolean;
}

export const WORLD_BOUNDS = {
  minX: 40,
  maxX: 1460,
  minY: 40,
  maxY: 1060,
  width: 1500,
  height: 1100,
  entrance: { x: 450, y: 530 },
  checkoutSpots: [
    { x: 410, y: 460 }, // slot 0 (in front of turquoise counter)
    { x: 410, y: 495 }, // slot 1
    { x: 410, y: 530 }, // slot 2
    { x: 410, y: 565 }, // slot 3 (outside entrance on sidewalk)
  ],
};

const ANIMAL_ROSTER: { species: AnimalSpecies; name: string; emoji: string }[] = [
  { species: 'bunny', name: 'Barnaby Bunny', emoji: '🐰' },
  { species: 'cat', name: 'Cleo Cat', emoji: '🐱' },
  { species: 'dog', name: 'Doug Pup', emoji: '🐶' },
  { species: 'bear', name: 'Barry Bear', emoji: '🐻' },
  { species: 'pig', name: 'Penny Pig', emoji: '🐷' },
];

/**
 * Evaluates whether an unlock pad should be visible to the player
 * Enforces idle arcade tycoon progressive disclosure: only 1 or 2 relevant next goals appear at any time.
 */
export function isPadVisible(pad: UnlockPad, state: MartGameState): boolean {
  if (pad.unlocked) return false;

  switch (pad.id) {
    case 'pad-corn-plot':
      // First progression target: visible from game start
      return true;

    case 'pad-corn-shelf':
      // Appears once sweet corn plot has been unlocked
      return state.plots.find((p) => p.id === 'plot-corn')?.unlocked === true;

    case 'pad-helper':
      // Appears once corn crate shelf is unlocked
      return state.shelves.find((s) => s.id === 'shelf-corn')?.unlocked === true;

    case 'pad-egg-plot':
      // Appears once corn crate shelf is unlocked
      return state.shelves.find((s) => s.id === 'shelf-corn')?.unlocked === true;

    case 'pad-egg-shelf':
      // Appears once chicken coop is unlocked
      return state.plots.find((p) => p.id === 'plot-egg')?.unlocked === true;

    case 'pad-cashier':
      // Appears once egg basket shelf is unlocked
      return state.shelves.find((s) => s.id === 'shelf-egg')?.unlocked === true;

    case 'pad-milk-plot':
      // Appears once egg basket shelf is unlocked
      return state.shelves.find((s) => s.id === 'shelf-egg')?.unlocked === true;

    case 'pad-milk-shelf':
      // Appears once dairy pasture is unlocked
      return state.plots.find((p) => p.id === 'plot-milk')?.unlocked === true;

    case 'pad-pumpkin-plot':
      // Appears once milk cooler shelf is unlocked
      return state.shelves.find((s) => s.id === 'shelf-milk')?.unlocked === true;

    case 'pad-pumpkin-shelf':
      // Appears once pumpkin patch is unlocked
      return state.plots.find((p) => p.id === 'plot-pumpkin')?.unlocked === true;

    default:
      return true;
  }
}

/**
 * Creates the initial game state with starting tomato patch, tomato stand, and unlock pads
 */
export function createInitialMartState(): MartGameState {
  const plots: ProductionPlot[] = [
    {
      id: 'plot-tomato',
      product: 'tomato',
      name: 'Tomato Bed',
      x: 650,
      y: 640,
      width: 140,
      height: 70,
      readyCount: 4,
      maxCapacity: 8,
      growTimer: 0,
      growTimeMs: PRODUCTS.tomato.growTimeMs,
      unlocked: true,
    },
    {
      id: 'plot-corn',
      product: 'corn',
      name: 'Corn Bed',
      x: 920,
      y: 640,
      width: 140,
      height: 70,
      readyCount: 0,
      maxCapacity: 8,
      growTimer: 0,
      growTimeMs: PRODUCTS.corn.growTimeMs,
      unlocked: false,
    },
    {
      id: 'plot-egg',
      product: 'egg',
      name: 'Chicken Coop',
      x: 180,
      y: 660,
      width: 150,
      height: 90,
      readyCount: 0,
      maxCapacity: 6,
      growTimer: 0,
      growTimeMs: PRODUCTS.egg.growTimeMs,
      unlocked: false,
    },
    {
      id: 'plot-milk',
      product: 'milk',
      name: 'Dairy Pasture',
      x: 1160,
      y: 640,
      width: 150,
      height: 90,
      readyCount: 0,
      maxCapacity: 6,
      growTimer: 0,
      growTimeMs: PRODUCTS.milk.growTimeMs,
      unlocked: false,
    },
    {
      id: 'plot-pumpkin',
      product: 'pumpkin',
      name: 'Pumpkin Plot 🎃',
      x: 750,
      y: 860,
      width: 140,
      height: 75,
      readyCount: 0,
      maxCapacity: 6,
      growTimer: 0,
      growTimeMs: PRODUCTS.pumpkin.growTimeMs,
      unlocked: false,
    },
  ];

  const shelves: Shelf[] = [
    {
      id: 'shelf-tomato',
      product: 'tomato',
      name: 'Tomato Table',
      x: 650,
      y: 340,
      width: 90,
      height: 60,
      currentStock: 4,
      maxStock: 8,
      unlocked: true,
    },
    {
      id: 'shelf-corn',
      product: 'corn',
      name: 'Corn Table',
      x: 880,
      y: 340,
      width: 90,
      height: 60,
      currentStock: 0,
      maxStock: 8,
      unlocked: false,
    },
    {
      id: 'shelf-egg',
      product: 'egg',
      name: 'Egg Table',
      x: 650,
      y: 170,
      width: 90,
      height: 60,
      currentStock: 0,
      maxStock: 8,
      unlocked: false,
    },
    {
      id: 'shelf-milk',
      product: 'milk',
      name: 'Milk Cooler',
      x: 880,
      y: 170,
      width: 90,
      height: 60,
      currentStock: 0,
      maxStock: 8,
      unlocked: false,
    },
    {
      id: 'shelf-pumpkin',
      product: 'pumpkin',
      name: 'Pumpkin Stand 🎃',
      x: 1080,
      y: 250,
      width: 90,
      height: 60,
      currentStock: 0,
      maxStock: 6,
      unlocked: false,
    },
  ];

  const register: CashRegister = {
    x: 350,
    y: 400,
    width: 120,
    height: 42,
    coinsOnCounter: 0,
    hasCashier: false,
    serveTimer: 0,
  };

  const unlockPads: UnlockPad[] = [
    {
      id: 'pad-corn-plot',
      title: 'Unlock Corn Bed',
      cost: 40,
      paid: 0,
      x: 990,
      y: 745,
      radius: 32,
      unlocked: false,
      unlocks: { type: 'plot', targetId: 'plot-corn' },
    },
    {
      id: 'pad-corn-shelf',
      title: 'Unlock Corn Table',
      cost: 30,
      paid: 0,
      x: 925,
      y: 430,
      radius: 28,
      unlocked: false,
      unlocks: { type: 'shelf', targetId: 'shelf-corn' },
    },
    {
      id: 'pad-helper',
      title: 'Hire Farmhand Dog 🐶',
      cost: 80,
      paid: 0,
      x: 450,
      y: 720,
      radius: 32,
      unlocked: false,
      unlocks: { type: 'helper', targetId: 'helper-dog' },
    },
    {
      id: 'pad-egg-plot',
      title: 'Unlock Chicken Coop',
      cost: 100,
      paid: 0,
      x: 255,
      y: 785,
      radius: 32,
      unlocked: false,
      unlocks: { type: 'plot', targetId: 'plot-egg' },
    },
    {
      id: 'pad-egg-shelf',
      title: 'Unlock Egg Table',
      cost: 70,
      paid: 0,
      x: 695,
      y: 255,
      radius: 28,
      unlocked: false,
      unlocks: { type: 'shelf', targetId: 'shelf-egg' },
    },
    {
      id: 'pad-cashier',
      title: 'Hire Register Cashier 🧑‍💼',
      cost: 140,
      paid: 0,
      x: 250,
      y: 400,
      radius: 30,
      unlocked: false,
      unlocks: { type: 'cashier', targetId: 'cashier' },
    },
    {
      id: 'pad-milk-plot',
      title: 'Unlock Dairy Pasture',
      cost: 180,
      paid: 0,
      x: 1235,
      y: 765,
      radius: 32,
      unlocked: false,
      unlocks: { type: 'plot', targetId: 'plot-milk' },
    },
    {
      id: 'pad-milk-shelf',
      title: 'Unlock Milk Cooler',
      cost: 150,
      paid: 0,
      x: 925,
      y: 255,
      radius: 28,
      unlocked: false,
      unlocks: { type: 'shelf', targetId: 'shelf-milk' },
    },
    {
      id: 'pad-pumpkin-plot',
      title: 'Unlock Pumpkin Plot 🎃',
      cost: 240,
      paid: 0,
      x: 820,
      y: 965,
      radius: 32,
      unlocked: false,
      unlocks: { type: 'plot', targetId: 'plot-pumpkin' },
    },
    {
      id: 'pad-pumpkin-shelf',
      title: 'Unlock Pumpkin Stand 🎃',
      cost: 200,
      paid: 0,
      x: 1125,
      y: 335,
      radius: 28,
      unlocked: false,
      unlocks: { type: 'shelf', targetId: 'shelf-pumpkin' },
    },
  ];

  const helper: HelperWorker = {
    id: 'helper-dog',
    name: 'Barnaby Dog',
    emoji: '🐶',
    x: 450,
    y: 720,
    targetX: 450,
    targetY: 720,
    speed: 110,
    capacity: 4,
    stack: [],
    state: 'idle',
    targetPlotId: null,
    targetShelfId: null,
    unlocked: false,
  };

  const player: PlayerState = {
    x: 410,
    y: 365,
    vx: 0,
    vy: 0,
    speed: 150,
    capacity: 4,
    stack: [],
    coins: 15,
    totalEarned: 0,
    customersServed: 0,
    facing: 'down',
    speedLevel: 1,
    capacityLevel: 1,
  };

  return {
    player,
    plots,
    shelves,
    register,
    unlockPads,
    customers: [],
    helper,
    floatingNotes: [],
    customerSpawnTimer: 500, // spawn first customer quickly
    customerSpawnIntervalMs: 3200,
    maxCustomers: 4,
    reputationLevel: 1,
    marketOpen: true,
  };
}

/**
 * Checks distance between two 2D points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Checks if point is inside rectangle
 */
export function isPointInsideRect(
  px: number,
  py: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

/**
 * Spawns a customer that wants products from currently unlocked shelves
 */
export function spawnCustomer(state: MartGameState): MartGameState {
  const unlockedShelves = state.shelves.filter((s) => s.unlocked);
  if (unlockedShelves.length === 0) return state;

  const randomAnimal = ANIMAL_ROSTER[Math.floor(Math.random() * ANIMAL_ROSTER.length)]!;
  // Pick 1 to 2 random products from unlocked shelves
  const targetShelf = unlockedShelves[Math.floor(Math.random() * unlockedShelves.length)]!;
  const amount = Math.floor(Math.random() * 2) + 1; // 1 or 2 items

  const newCustomer: Customer = {
    id: `cust-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    species: randomAnimal.species,
    name: randomAnimal.name,
    emoji: randomAnimal.emoji,
    x: WORLD_BOUNDS.entrance.x,
    y: WORLD_BOUNDS.entrance.y,
    targetX: targetShelf.x + targetShelf.width / 2,
    targetY: targetShelf.y + targetShelf.height + 25,
    speed: 95,
    state: 'shopping',
    targetShelfId: targetShelf.id,
    wants: [
      {
        product: targetShelf.product,
        amount,
        collected: 0,
      },
    ],
    basket: [],
    queueIndex: -1,
    waitTimer: 0,
    patienceTimer: 25000,
    facing: 'left',
  };

  return {
    ...state,
    customers: [...state.customers, newCustomer],
  };
}

/**
 * Core game loop tick step
 */
export function updateMartGame(
  state: MartGameState,
  dt: number,
  input: { dx: number; dy: number }
): { nextState: MartGameState; events: string[] } {
  const events: string[] = [];
  const dtSec = Math.min(dt / 1000, 0.1); // clamp to prevent delta spikes

  let player = { ...state.player };
  let plots = state.plots.map((p) => ({ ...p }));
  let shelves = state.shelves.map((s) => ({ ...s }));
  let register = { ...state.register };
  let unlockPads = state.unlockPads.map((p) => ({ ...p }));
  let customers = state.customers.map((c) => ({ ...c, wants: c.wants.map((w) => ({ ...w })) }));
  let helper = { ...state.helper, stack: [...state.helper.stack] };
  let floatingNotes = state.floatingNotes
    .map((n) => ({ ...n, lifeMs: n.lifeMs - dt }))
    .filter((n) => n.lifeMs > 0);

  // 1. Update Player Movement
  const moveLen = Math.hypot(input.dx, input.dy);
  if (moveLen > 0.05) {
    const normX = input.dx / moveLen;
    const normY = input.dy / moveLen;
    player.vx = normX * player.speed;
    player.vy = normY * player.speed;
    player.x += player.vx * dtSec;
    player.y += player.vy * dtSec;

    // Determine facing
    if (Math.abs(normX) > Math.abs(normY)) {
      player.facing = normX < 0 ? 'left' : 'right';
    } else {
      player.facing = normY < 0 ? 'up' : 'down';
    }
  } else {
    player.vx = 0;
    player.vy = 0;
  }

  // Clamp player to bounds
  player.x = Math.max(WORLD_BOUNDS.minX, Math.min(WORLD_BOUNDS.maxX, player.x));
  player.y = Math.max(WORLD_BOUNDS.minY, Math.min(WORLD_BOUNDS.maxY, player.y));

  // 2. Production Plots: Growth & Harvesting
  for (const plot of plots) {
    if (!plot.unlocked) continue;

    // Grow crops up to max capacity
    if (plot.readyCount < plot.maxCapacity) {
      plot.growTimer += dt;
      if (plot.growTimer >= plot.growTimeMs) {
        plot.readyCount++;
        plot.growTimer = 0;
      }
    }

    // Player Harvests when nearby
    const plotCenterX = plot.x + plot.width / 2;
    const plotCenterY = plot.y + plot.height / 2;
    const distPlayer = distance(player.x, player.y, plotCenterX, plotCenterY);

    if (distPlayer < 75 && plot.readyCount > 0 && player.stack.length < player.capacity) {
      plot.readyCount--;
      player.stack = [...player.stack, plot.product];
      events.push('harvest');
      floatingNotes.push({
        id: `pop-${Date.now()}-${Math.random()}`,
        text: `+1 ${PRODUCTS[plot.product].emoji}`,
        x: player.x,
        y: player.y - 30,
        lifeMs: 800,
        maxLifeMs: 800,
        color: PRODUCTS[plot.product].color,
      });
    }
  }

  // 3. Shelves: Stocking from Player Stack
  for (const shelf of shelves) {
    if (!shelf.unlocked) continue;

    const shelfCenterX = shelf.x + shelf.width / 2;
    const shelfCenterY = shelf.y + shelf.height / 2;
    const distPlayer = distance(player.x, player.y, shelfCenterX, shelfCenterY);

    if (distPlayer < 75 && shelf.currentStock < shelf.maxStock) {
      // Find if player has matching product
      const itemIndex = player.stack.lastIndexOf(shelf.product);
      if (itemIndex !== -1) {
        player.stack = [
          ...player.stack.slice(0, itemIndex),
          ...player.stack.slice(itemIndex + 1),
        ];
        shelf.currentStock++;
        events.push('stock');
      }
    }
  }

  // 4. Helper Worker AI (if unlocked)
  if (helper.unlocked) {
    // If empty stack, find an unlocked plot with ready crops
    if (helper.stack.length < helper.capacity) {
      helper.state = 'harvesting';
      // Find best plot with ready crops that has an unlocked shelf needing stock
      const candidatePlot = plots.find((p) => {
        if (!p.unlocked || p.readyCount === 0) return false;
        const matchingShelf = shelves.find((s) => s.unlocked && s.product === p.product);
        return matchingShelf && matchingShelf.currentStock < matchingShelf.maxStock;
      });

      if (candidatePlot) {
        helper.targetX = candidatePlot.x + candidatePlot.width / 2;
        helper.targetY = candidatePlot.y + candidatePlot.height / 2;

        const distPlot = distance(helper.x, helper.y, helper.targetX, helper.targetY);
        if (distPlot < 55 && candidatePlot.readyCount > 0) {
          candidatePlot.readyCount--;
          helper.stack.push(candidatePlot.product);
          events.push('harvest');
        }
      } else {
        // Idle near center
        helper.targetX = 450;
        helper.targetY = 720;
      }
    } else {
      // Stack is full -> go to matching shelf to restock
      helper.state = 'stocking';
      const carriedProduct = helper.stack[helper.stack.length - 1];
      const targetShelf = shelves.find((s) => s.unlocked && s.product === carriedProduct);

      if (targetShelf) {
        helper.targetX = targetShelf.x + targetShelf.width / 2;
        helper.targetY = targetShelf.y + targetShelf.height / 2;

        const distShelf = distance(helper.x, helper.y, helper.targetX, helper.targetY);
        if (distShelf < 55 && targetShelf.currentStock < targetShelf.maxStock) {
          helper.stack.pop();
          targetShelf.currentStock++;
          events.push('stock');
        }
      }
    }

    // Move helper towards target
    const hDist = distance(helper.x, helper.y, helper.targetX, helper.targetY);
    if (hDist > 5) {
      const hNormX = (helper.targetX - helper.x) / hDist;
      const hNormY = (helper.targetY - helper.y) / hDist;
      helper.x += hNormX * helper.speed * dtSec;
      helper.y += hNormY * helper.speed * dtSec;
    }
  }

  // 5. Unlock Pads: Coin Transfer & Activation
  for (const pad of unlockPads) {
    if (pad.unlocked) continue;
    if (!isPadVisible(pad, state)) continue; // Must be visible & active in current progression!

    const distPlayer = distance(player.x, player.y, pad.x, pad.y);
    if (distPlayer < pad.radius + 20 && player.coins > 0) {
      // Transfer coins rapidly
      const needed = pad.cost - pad.paid;
      const transfer = Math.min(needed, player.coins, Math.max(1, Math.floor(dt / 50)));
      if (transfer > 0) {
        player.coins -= transfer;
        pad.paid += transfer;
        events.push('coin_deposit');

        if (pad.paid >= pad.cost) {
          pad.unlocked = true;
          events.push('unlock_station');
          floatingNotes.push({
            id: `unlock-${Date.now()}`,
            text: `🎉 UNLOCKED!`,
            x: pad.x,
            y: pad.y - 30,
            lifeMs: 1400,
            maxLifeMs: 1400,
            color: '#22c55e',
          });

          // Apply unlock
          if (pad.unlocks.type === 'plot') {
            const targetPlot = plots.find((p) => p.id === pad.unlocks.targetId);
            if (targetPlot) targetPlot.unlocked = true;
          } else if (pad.unlocks.type === 'shelf') {
            const targetShelf = shelves.find((s) => s.id === pad.unlocks.targetId);
            if (targetShelf) targetShelf.unlocked = true;
          } else if (pad.unlocks.type === 'helper') {
            helper.unlocked = true;
          } else if (pad.unlocks.type === 'cashier') {
            register.hasCashier = true;
          }
        }
      }
    }
  }

  // 6. Cash Register & Checkout
  const regCenterX = register.x + register.width / 2;
  const regCenterY = register.y + register.height / 2;
  // Player is at cashier if standing on cashier mat behind counter or near counter
  const isBehindCounter =
    player.x >= register.x - 15 &&
    player.x <= register.x + register.width + 15 &&
    player.y >= register.y - 75 &&
    player.y <= register.y + 15;
  const isNearRegister = distance(player.x, player.y, regCenterX, regCenterY) < 85;
  const isPlayerAtRegister = isBehindCounter || isNearRegister;
  const isCashierActive = register.hasCashier;

  // Serve the customer at index 0 of the checkout queue
  const queueLeader = customers.find((c) => c.state === 'in_queue' && c.queueIndex === 0);
  if (queueLeader && (isPlayerAtRegister || isCashierActive)) {
    register.serveTimer += dt;
    // Serve customer every 600ms (faster, responsive checkout)
    if (register.serveTimer >= 600) {
      register.serveTimer = 0;
      queueLeader.state = 'leaving';
      queueLeader.targetX = WORLD_BOUNDS.entrance.x;
      queueLeader.targetY = WORLD_BOUNDS.entrance.y + 30;

      // Calculate bill
      let billTotal = 0;
      for (const item of queueLeader.basket) {
        billTotal += PRODUCTS[item].sellPrice;
      }

      register.coinsOnCounter += billTotal;
      player.totalEarned += billTotal;
      player.customersServed++;
      events.push('kaching');

      floatingNotes.push({
        id: `bill-${Date.now()}`,
        text: `+${billTotal} 💰`,
        x: register.x + register.width / 2,
        y: register.y - 25,
        lifeMs: 1200,
        maxLifeMs: 1200,
        color: '#facc15',
      });

      // Shift other customers in queue forward
      for (const cust of customers) {
        if (cust.state === 'in_queue' && cust.queueIndex > 0) {
          cust.queueIndex--;
          const spot = WORLD_BOUNDS.checkoutSpots[cust.queueIndex] || WORLD_BOUNDS.checkoutSpots[3]!;
          cust.targetX = spot.x;
          cust.targetY = spot.y;
        }
      }
    }
  }

  // Player collects coins from register counter when nearby (generous magnet collection!)
  if ((isPlayerAtRegister || distance(player.x, player.y, regCenterX, regCenterY) < 95) && register.coinsOnCounter > 0) {
    player.coins += register.coinsOnCounter;
    events.push('coin_pickup');
    floatingNotes.push({
      id: `pickup-${Date.now()}`,
      text: `+${register.coinsOnCounter} COINS!`,
      x: player.x,
      y: player.y - 45,
      lifeMs: 900,
      maxLifeMs: 900,
      color: '#fbbf24',
    });
    register.coinsOnCounter = 0;
  }

  // 7. Customer AI Simulation
  const remainingCustomers: Customer[] = [];
  for (const cust of customers) {
    // Movement towards current target
    const distTarget = distance(cust.x, cust.y, cust.targetX, cust.targetY);
    if (distTarget > 4) {
      const normX = (cust.targetX - cust.x) / distTarget;
      const normY = (cust.targetY - cust.y) / distTarget;
      cust.x += normX * cust.speed * dtSec;
      cust.y += normY * cust.speed * dtSec;
      cust.facing = normX < 0 ? 'left' : 'right';
    }

    if (cust.state === 'shopping') {
      const targetShelf = shelves.find((s) => s.id === cust.targetShelfId);
      const distShelf = targetShelf
        ? distance(cust.x, cust.y, targetShelf.x + targetShelf.width / 2, targetShelf.y + targetShelf.height + 25)
        : 999;

      if (distShelf < 15 && targetShelf) {
        const want = cust.wants.find((w) => w.product === targetShelf.product);
        if (want && want.collected < want.amount) {
          if (targetShelf.currentStock > 0) {
            targetShelf.currentStock--;
            want.collected++;
            cust.basket.push(targetShelf.product);
            events.push('customer_pick');
          } else {
            // Wait for stock
            cust.waitTimer += dt;
            if (cust.waitTimer > 8000) {
              // Impatient customer leaves if no stock
              cust.state = 'leaving';
              cust.targetX = WORLD_BOUNDS.entrance.x;
              cust.targetY = WORLD_BOUNDS.entrance.y + 30;
            }
          }
        }

        // All wants satisfied or has at least 1 item and shelf is empty
        const isComplete = cust.wants.every((w) => w.collected >= w.amount);
        if (isComplete || (cust.basket.length > 0 && targetShelf.currentStock === 0)) {
          // Head to register queue!
          cust.state = 'in_queue';
          // Count how many are already in queue
          const queueLength = customers.filter((c) => c.state === 'in_queue').length;
          cust.queueIndex = Math.min(queueLength, WORLD_BOUNDS.checkoutSpots.length - 1);
          const spot = WORLD_BOUNDS.checkoutSpots[cust.queueIndex] || WORLD_BOUNDS.checkoutSpots[3]!;
          cust.targetX = spot.x;
          cust.targetY = spot.y;
        }
      }
    } else if (cust.state === 'leaving') {
      if (distance(cust.x, cust.y, WORLD_BOUNDS.entrance.x, WORLD_BOUNDS.entrance.y + 30) < 15) {
        // Exited market cleanly, do not keep in active list
        continue;
      }
    }

    remainingCustomers.push(cust);
  }
  customers = remainingCustomers;

  // 8. Customer Spawner
  let customerSpawnTimer = state.customerSpawnTimer - dt;
  if (customerSpawnTimer <= 0 && customers.length < state.maxCustomers && state.marketOpen) {
    customerSpawnTimer = state.customerSpawnIntervalMs;
    const tempState = spawnCustomer({
      ...state,
      customers,
      shelves,
    });
    customers = tempState.customers;
  }

  // 9. Reputation Level Progression
  const reputationLevel = Math.max(1, 1 + Math.floor(player.customersServed / 5));
  const maxCustomers = Math.min(6, 3 + reputationLevel);

  return {
    nextState: {
      player,
      plots,
      shelves,
      register,
      unlockPads,
      customers,
      helper,
      floatingNotes,
      customerSpawnTimer,
      customerSpawnIntervalMs: Math.max(2200, 3200 - reputationLevel * 200),
      maxCustomers,
      reputationLevel,
      marketOpen: state.marketOpen,
    },
    events,
  };
}

/**
 * Upgrade player walking speed
 */
export function upgradePlayerSpeed(state: MartGameState): {
  success: boolean;
  nextState: MartGameState;
  cost: number;
} {
  const cost = 25 * Math.pow(2, state.player.speedLevel - 1);
  if (state.player.coins < cost || state.player.speedLevel >= 5) {
    return { success: false, nextState: state, cost };
  }

  return {
    success: true,
    cost,
    nextState: {
      ...state,
      player: {
        ...state.player,
        coins: state.player.coins - cost,
        speedLevel: state.player.speedLevel + 1,
        speed: state.player.speed + 25,
      },
    },
  };
}

/**
 * Upgrade player carry stack capacity
 */
export function upgradePlayerCapacity(state: MartGameState): {
  success: boolean;
  nextState: MartGameState;
  cost: number;
} {
  const cost = 35 * Math.pow(2, state.player.capacityLevel - 1);
  if (state.player.coins < cost || state.player.capacityLevel >= 5) {
    return { success: false, nextState: state, cost };
  }

  return {
    success: true,
    cost,
    nextState: {
      ...state,
      player: {
        ...state.player,
        coins: state.player.coins - cost,
        capacityLevel: state.player.capacityLevel + 1,
        capacity: state.player.capacity + 2,
      },
    },
  };
}

/**
 * Local storage save key
 */
export const STORAGE_KEY_MART = 'pawcade_farm_mini_mart_save_v1';

/**
 * Save mart progress to localStorage
 */
export function saveMartState(state: MartGameState): void {
  if (typeof window === 'undefined') return;
  try {
    const data = {
      coins: state.player.coins,
      totalEarned: state.player.totalEarned,
      customersServed: state.player.customersServed,
      speedLevel: state.player.speedLevel,
      capacityLevel: state.player.capacityLevel,
      plotsUnlocked: state.plots.filter((p) => p.unlocked).map((p) => p.id),
      shelvesUnlocked: state.shelves.filter((s) => s.unlocked).map((s) => s.id),
      helperUnlocked: state.helper.unlocked,
      cashierUnlocked: state.register.hasCashier,
      padsPaid: state.unlockPads.map((p) => ({ id: p.id, paid: p.paid, unlocked: p.unlocked })),
    };
    window.localStorage.setItem(STORAGE_KEY_MART, JSON.stringify(data));
  } catch {
    // Ignore storage quota or access errors
  }
}

/**
 * Load mart progress from localStorage
 */
export function loadMartState(): MartGameState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_MART);
    if (!raw) return null;
    const data = JSON.parse(raw);
    const initial = createInitialMartState();

    // Restore player upgrades
    initial.player.coins = Number(data.coins) || 0;
    initial.player.totalEarned = Number(data.totalEarned) || 0;
    initial.player.customersServed = Number(data.customersServed) || 0;
    initial.player.speedLevel = Number(data.speedLevel) || 1;
    initial.player.speed = 150 + (initial.player.speedLevel - 1) * 25;
    initial.player.capacityLevel = Number(data.capacityLevel) || 1;
    initial.player.capacity = 4 + (initial.player.capacityLevel - 1) * 2;

    // Restore plots
    if (Array.isArray(data.plotsUnlocked)) {
      for (const plot of initial.plots) {
        if (data.plotsUnlocked.includes(plot.id)) {
          plot.unlocked = true;
        }
      }
    }

    // Restore shelves
    if (Array.isArray(data.shelvesUnlocked)) {
      for (const shelf of initial.shelves) {
        if (data.shelvesUnlocked.includes(shelf.id)) {
          shelf.unlocked = true;
        }
      }
    }

    // Restore pads
    if (Array.isArray(data.padsPaid)) {
      for (const padData of data.padsPaid) {
        const targetPad = initial.unlockPads.find((p) => p.id === padData.id);
        if (targetPad) {
          targetPad.paid = Number(padData.paid) || 0;
          targetPad.unlocked = Boolean(padData.unlocked);
        }
      }
    }

    // Restore helper & cashier
    initial.helper.unlocked = Boolean(data.helperUnlocked);
    initial.register.hasCashier = Boolean(data.cashierUnlocked);

    return initial;
  } catch {
    return null;
  }
}

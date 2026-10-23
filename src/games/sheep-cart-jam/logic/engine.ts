/**
 * Sheep Cart Jam: Meadow Escape — Pure TypeScript Core Logic Engine
 * Inspired by Bus Jam / Car Jam / Bus Fever (Top #1 US App Store Mechanic).
 *
 * Mechanics:
 * - Farm parking maze with colored tractor hay carts (capacity: 3 sheep per cart).
 * - Carts are oriented horizontally or vertically and need an unobstructed path to exit lane.
 * - Farm Station Dock has limited loading bays (default: 3 bays).
 * - Waiting Queue of colored fluffy sheep (Pink 🌸, Blue 🌊, Yellow ☀️, Green 🍀, Purple 🍇).
 * - When a cart docks, matching sheep at the front of the queue board the cart.
 * - When full (3/3), cart departs to the meadow, freeing up the dock bay!
 * - Win: All sheep boarded and all carts cleared.
 * - Fail: All dock bays full with no matching carts for the front sheep.
 */

export type SheepColor = 'pink' | 'blue' | 'yellow' | 'green' | 'purple';

export interface Cart {
  id: string;
  color: SheepColor;
  x: number;
  y: number;
  width: number;  // 1 if vertical, 2 or 3 if horizontal
  height: number; // 2 or 3 if vertical, 1 if horizontal
  orientation: 'horizontal' | 'vertical';
  exitDirection: 'up' | 'down' | 'left' | 'right';
  capacity: number; // usually 3
  passengers: number;
}

export interface GridDimensions {
  cols: number; // default 6
  rows: number; // default 8
}

export interface SheepCartJamState {
  level: number;
  gridCols: number;
  gridRows: number;
  carts: Cart[];
  dockBays: (Cart | null)[]; // Max bays (e.g. 3)
  sheepQueue: SheepColor[];
  score: number;
  moves: number;
  isWon: boolean;
  isGameOver: boolean;
  departedCartsCount: number;
}

export const SHEEP_COLOR_CONFIG: Record<
  SheepColor,
  { name: string; hex: string; bgClass: string; borderClass: string; emoji: string }
> = {
  pink: { name: 'Berry Pink', hex: '#ec4899', bgClass: 'bg-pink-500', borderClass: 'border-pink-300', emoji: '🌸' },
  blue: { name: 'Sky Blue', hex: '#0ea5e9', bgClass: 'bg-sky-500', borderClass: 'border-sky-300', emoji: '🌊' },
  yellow: { name: 'Golden Sun', hex: '#eab308', bgClass: 'bg-yellow-500', borderClass: 'border-yellow-300', emoji: '☀️' },
  green: { name: 'Clover Green', hex: '#22c55e', bgClass: 'bg-green-500', borderClass: 'border-green-300', emoji: '🍀' },
  purple: { name: 'Lavender', hex: '#a855f7', bgClass: 'bg-purple-500', borderClass: 'border-purple-300', emoji: '🍇' },
};

export const MAX_DOCK_BAYS = 3;
export const CART_CAPACITY = 3;

/**
 * Checks if a cart on the board is blocked by any other cart along its exit path.
 */
export function isCartPathBlocked(cart: Cart, allCarts: Cart[], cols: number, rows: number): boolean {
  // If cart is already in dock, it's not on board
  const otherCarts = allCarts.filter(c => c.id !== cart.id);

  // Helper to test if a point (px, py) is inside another cart
  const isPointOccupied = (px: number, py: number) => {
    return otherCarts.some(c => px >= c.x && px < c.x + c.width && py >= c.y && py < c.y + c.height);
  };

  switch (cart.exitDirection) {
    case 'up': {
      // Must have clear path from (x .. x+width-1, 0 .. y-1)
      for (let y = cart.y - 1; y >= 0; y--) {
        for (let x = cart.x; x < cart.x + cart.width; x++) {
          if (isPointOccupied(x, y)) return true;
        }
      }
      return false;
    }
    case 'down': {
      // Must have clear path from (x .. x+width-1, y+height .. rows-1)
      for (let y = cart.y + cart.height; y < rows; y++) {
        for (let x = cart.x; x < cart.x + cart.width; x++) {
          if (isPointOccupied(x, y)) return true;
        }
      }
      return false;
    }
    case 'left': {
      // Must have clear path from (0 .. x-1, y .. y+height-1)
      for (let x = cart.x - 1; x >= 0; x--) {
        for (let y = cart.y; y < cart.y + cart.height; y++) {
          if (isPointOccupied(x, y)) return true;
        }
      }
      return false;
    }
    case 'right': {
      // Must have clear path from (x+width .. cols-1, y .. y+height-1)
      for (let x = cart.x + cart.width; x < cols; x++) {
        for (let y = cart.y; y < cart.y + cart.height; y++) {
          if (isPointOccupied(x, y)) return true;
        }
      }
      return false;
    }
  }
}

/**
 * Processes boarding of sheep from the front of the queue into any docked carts.
 * When a cart reaches capacity, it departs, opening up its dock bay.
 */
export function processDockBoarding(
  dockBays: (Cart | null)[],
  sheepQueue: SheepColor[]
): {
  newDockBays: (Cart | null)[];
  newQueue: SheepColor[];
  departedCount: number;
  pointsEarned: number;
} {
  const currentBays = dockBays.map(c => (c ? { ...c } : null));
  const queue = [...sheepQueue];
  let departed = 0;
  let points = 0;

  let progress = true;
  while (progress && queue.length > 0) {
    progress = false;
    const frontSheep = queue[0];

    // Find a docked cart that matches front sheep color and has empty seats
    const targetBayIndex = currentBays.findIndex(
      cart => cart !== null && cart.color === frontSheep && cart.passengers < cart.capacity
    );

    if (targetBayIndex !== -1) {
      const cart = currentBays[targetBayIndex]!;
      cart.passengers += 1;
      points += 25; // 25 pts per passenger board
      queue.shift(); // Remove boarded sheep
      progress = true;

      // If cart is full, it departs!
      if (cart.passengers >= cart.capacity) {
        currentBays[targetBayIndex] = null;
        departed += 1;
        points += 100; // 100 pts departure bonus
      }
    }
  }

  return {
    newDockBays: currentBays,
    newQueue: queue,
    departedCount: departed,
    pointsEarned: points,
  };
}

/**
 * Attempts to drive a cart from the board to the loading dock.
 */
export function driveCartToDock(state: SheepCartJamState, cartId: string): SheepCartJamState {
  if (state.isGameOver || state.isWon) return state;

  const cart = state.carts.find(c => c.id === cartId);
  if (!cart) return state;

  // 1. Check if path is blocked
  if (isCartPathBlocked(cart, state.carts, state.gridCols, state.gridRows)) {
    return state; // Cannot move blocked cart
  }

  // 2. Check if dock has an empty bay
  const emptyBayIndex = state.dockBays.findIndex(bay => bay === null);
  if (emptyBayIndex === -1) {
    return state; // Dock is completely full!
  }

  // 3. Move cart to dock
  const newCarts = state.carts.filter(c => c.id !== cartId);
  const updatedBays = [...state.dockBays];
  updatedBays[emptyBayIndex] = { ...cart, passengers: 0 };

  // 4. Process boarding
  const { newDockBays, newQueue, departedCount, pointsEarned } = processDockBoarding(
    updatedBays,
    state.sheepQueue
  );

  const totalDeparted = state.departedCartsCount + departedCount;
  const newScore = state.score + pointsEarned;
  const newMoves = state.moves + 1;

  // 5. Check Win: No carts on board, no carts in dock, no sheep left in queue
  const isWon = newCarts.length === 0 && newDockBays.every(b => b === null) && newQueue.length === 0;

  // 6. Check Game Over (Loss): Dock is full, and none of the docked carts match front sheep in queue
  const isDockFull = newDockBays.every(b => b !== null);
  let isGameOver = false;
  if (isDockFull && newQueue.length > 0) {
    const frontSheep = newQueue[0];
    const canBoardAny = newDockBays.some(
      b => b !== null && b.color === frontSheep && b.passengers < b.capacity
    );
    if (!canBoardAny) {
      isGameOver = true;
    }
  }

  return {
    ...state,
    carts: newCarts,
    dockBays: newDockBays,
    sheepQueue: newQueue,
    score: newScore,
    moves: newMoves,
    isWon,
    isGameOver,
    departedCartsCount: totalDeparted,
  };
}

/**
 * Pre-designed level configurations for progressive challenges.
 */
export interface LevelConfig {
  level: number;
  gridCols: number;
  gridRows: number;
  carts: Cart[];
  sheepQueue: SheepColor[];
}

export const LEVELS: LevelConfig[] = [
  // Level 1: Gentle tutorial - 3 carts, 9 sheep
  {
    level: 1,
    gridCols: 6,
    gridRows: 7,
    carts: [
      { id: 'c1', color: 'pink', x: 1, y: 1, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 },
      { id: 'c2', color: 'blue', x: 3, y: 1, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 },
      { id: 'c3', color: 'yellow', x: 2, y: 4, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'right', capacity: 3, passengers: 0 },
    ],
    sheepQueue: ['pink', 'pink', 'pink', 'blue', 'blue', 'blue', 'yellow', 'yellow', 'yellow'],
  },
  // Level 2: Interlocking jam - 5 carts, 15 sheep
  {
    level: 2,
    gridCols: 6,
    gridRows: 8,
    carts: [
      // Blocking top row
      { id: 'c1', color: 'yellow', x: 1, y: 0, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'right', capacity: 3, passengers: 0 },
      { id: 'c2', color: 'pink', x: 1, y: 2, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 },
      { id: 'c3', color: 'blue', x: 3, y: 2, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 },
      { id: 'c4', color: 'green', x: 1, y: 5, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'left', capacity: 3, passengers: 0 },
      { id: 'c5', color: 'pink', x: 3, y: 5, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'right', capacity: 3, passengers: 0 },
    ],
    sheepQueue: [
      'yellow', 'yellow', 'yellow',
      'pink', 'pink', 'pink',
      'blue', 'blue', 'blue',
      'green', 'green', 'green',
      'pink', 'pink', 'pink',
    ],
  },
  // Level 3: Master Meadow Jam - 7 carts, 21 sheep
  {
    level: 3,
    gridCols: 6,
    gridRows: 8,
    carts: [
      { id: 'c1', color: 'purple', x: 0, y: 1, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'left', capacity: 3, passengers: 0 },
      { id: 'c2', color: 'blue', x: 3, y: 1, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 },
      { id: 'c3', color: 'pink', x: 1, y: 3, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'right', capacity: 3, passengers: 0 },
      { id: 'c4', color: 'yellow', x: 0, y: 5, width: 1, height: 2, orientation: 'vertical', exitDirection: 'down', capacity: 3, passengers: 0 },
      { id: 'c5', color: 'green', x: 2, y: 5, width: 1, height: 2, orientation: 'vertical', exitDirection: 'down', capacity: 3, passengers: 0 },
      { id: 'c6', color: 'purple', x: 4, y: 4, width: 1, height: 2, orientation: 'vertical', exitDirection: 'up', capacity: 3, passengers: 0 },
      { id: 'c7', color: 'yellow', x: 3, y: 3, width: 2, height: 1, orientation: 'horizontal', exitDirection: 'right', capacity: 3, passengers: 0 },
    ],
    sheepQueue: [
      'purple', 'purple', 'purple',
      'blue', 'blue', 'blue',
      'pink', 'pink', 'pink',
      'yellow', 'yellow', 'yellow',
      'green', 'green', 'green',
      'purple', 'purple', 'purple',
      'yellow', 'yellow', 'yellow',
    ],
  },
];

export function initializeLevel(levelNum: number = 1): SheepCartJamState {
  const config = LEVELS.find(l => l.level === levelNum) || LEVELS[0]!;
  return {
    level: config.level,
    gridCols: config.gridCols,
    gridRows: config.gridRows,
    carts: config.carts.map(c => ({ ...c })),
    dockBays: Array(MAX_DOCK_BAYS).fill(null),
    sheepQueue: [...config.sheepQueue],
    score: 0,
    moves: 0,
    isWon: false,
    isGameOver: false,
    departedCartsCount: 0,
  };
}

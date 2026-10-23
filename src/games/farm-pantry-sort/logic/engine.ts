/**
 * Farm Pantry Sort: Triple Pick — Pure TypeScript Core Logic Engine
 * Inspired by Goods Sort / Magic Sort (Top Casual Puzzle Mechanic in US App Store).
 *
 * Mechanics:
 * - Sammy the Squirrel organizes Grandma's rustic farm pantry.
 * - Shelves hold 3 slots each.
 * - Move farm goods (Honey, Milk, Eggs, Jam, Cheese, Pie) between shelves.
 * - When 3 matching items sit on the same shelf, they merge and clear!
 * - Shelves can hold background layers that slide forward when front slots clear.
 * - Win: Clear all items from the pantry.
 * - Lose: Time runs out or no open slots / moves available.
 */

export type PantryGoodType = 'honey' | 'milk' | 'eggs' | 'jam' | 'cheese' | 'pie';

export interface PantryGoodConfig {
  type: PantryGoodType;
  name: string;
  emoji: string;
  color: string;
  bgGradient: string;
  assetPath: string;
}

export const PANTRY_GOODS_CONFIG: Record<PantryGoodType, PantryGoodConfig> = {
  honey: {
    type: 'honey',
    name: 'Clover Honey',
    emoji: '🍯',
    color: '#f59e0b',
    bgGradient: 'from-amber-400 to-yellow-600',
    assetPath: '/assets/tiles/farm-pantry-sort/good-honey.svg',
  },
  milk: {
    type: 'milk',
    name: 'Fresh Farm Milk',
    emoji: '🥛',
    color: '#38bdf8',
    bgGradient: 'from-sky-300 to-blue-500',
    assetPath: '/assets/tiles/farm-pantry-sort/good-milk.svg',
  },
  eggs: {
    type: 'eggs',
    name: 'Pasture Eggs',
    emoji: '🥚',
    color: '#fbbf24',
    bgGradient: 'from-amber-200 to-amber-500',
    assetPath: '/assets/tiles/farm-pantry-sort/good-eggs.svg',
  },
  jam: {
    type: 'jam',
    name: 'Strawberry Jam',
    emoji: '🍓',
    color: '#f43f5e',
    bgGradient: 'from-rose-400 to-red-600',
    assetPath: '/assets/tiles/farm-pantry-sort/good-jam.svg',
  },
  cheese: {
    type: 'cheese',
    name: 'Country Cheese',
    emoji: '🧀',
    color: '#eab308',
    bgGradient: 'from-yellow-300 to-amber-500',
    assetPath: '/assets/tiles/farm-pantry-sort/good-cheese.svg',
  },
  pie: {
    type: 'pie',
    name: 'Baked Apple Pie',
    emoji: '🥧',
    color: '#ea580c',
    bgGradient: 'from-amber-500 to-orange-700',
    assetPath: '/assets/tiles/farm-pantry-sort/good-pie.svg',
  },
};

export interface PantryItem {
  id: string;
  type: PantryGoodType;
}

export interface Shelf {
  id: string;
  capacity: number; // typically 3
  items: PantryItem[]; // visible front items (length <= capacity)
  hiddenQueue: PantryItem[]; // reserve items behind front row
}

export interface PantryState {
  level: number;
  shelves: Shelf[];
  score: number;
  moves: number;
  timeRemaining: number;
  totalItemsRemaining: number;
  isWon: boolean;
  isGameOver: boolean;
  selectedShelfId: string | null;
  selectedItemIndex: number | null;
  consecutiveMatches: number;
}

export interface LevelConfig {
  level: number;
  timeLimit: number;
  shelves: {
    id: string;
    items: PantryGoodType[];
    hiddenQueue?: PantryGoodType[];
  }[];
}

export const PANTRY_LEVELS: LevelConfig[] = [
  // Level 1: Gentle Introduction - 3 shelves, 2 types (Honey, Milk)
  {
    level: 1,
    timeLimit: 90,
    shelves: [
      { id: 's1', items: ['honey', 'milk', 'honey'] },
      { id: 's2', items: ['milk', 'honey', 'milk'] },
      { id: 's3', items: [] }, // empty shelf for sorting maneuvers
    ],
  },
  // Level 2: 4 shelves, 3 types (Honey, Milk, Eggs)
  {
    level: 2,
    timeLimit: 120,
    shelves: [
      { id: 's1', items: ['honey', 'eggs', 'milk'] },
      { id: 's2', items: ['milk', 'honey', 'eggs'] },
      { id: 's3', items: ['eggs', 'milk', 'honey'] },
      { id: 's4', items: [] }, // empty sorting space
    ],
  },
  // Level 3: 5 shelves with hidden back layers (Honey, Milk, Jam, Cheese)
  {
    level: 3,
    timeLimit: 150,
    shelves: [
      { id: 's1', items: ['jam', 'cheese', 'honey'], hiddenQueue: ['jam', 'jam'] },
      { id: 's2', items: ['milk', 'jam', 'cheese'], hiddenQueue: ['cheese', 'cheese'] },
      { id: 's3', items: ['honey', 'milk', 'honey'], hiddenQueue: ['honey', 'honey'] },
      { id: 's4', items: ['milk', 'milk', 'jam'] },
      { id: 's5', items: [] },
    ],
  },
  // Level 4: 6 shelves, 5 types with deep storage (Pie, Cheese, Jam, Eggs, Honey)
  {
    level: 4,
    timeLimit: 180,
    shelves: [
      { id: 's1', items: ['pie', 'cheese', 'jam'], hiddenQueue: ['pie', 'pie'] },
      { id: 's2', items: ['eggs', 'honey', 'cheese'], hiddenQueue: ['cheese', 'cheese'] },
      { id: 's3', items: ['jam', 'eggs', 'pie'], hiddenQueue: ['jam', 'jam'] },
      { id: 's4', items: ['honey', 'jam', 'eggs'], hiddenQueue: ['eggs', 'eggs'] },
      { id: 's5', items: ['honey', 'pie', 'honey'], hiddenQueue: ['honey', 'honey'] },
      { id: 's6', items: [] },
    ],
  },
];

let nextItemId = 1;
function createItem(type: PantryGoodType): PantryItem {
  return { id: `item-${nextItemId++}-${type}`, type };
}

export function initializePantryLevel(lvl: number): PantryState {
  const config = PANTRY_LEVELS.find(l => l.level === lvl) || PANTRY_LEVELS[0];

  let totalItems = 0;
  const shelves: Shelf[] = config.shelves.map(s => {
    const items = s.items.map(t => createItem(t));
    const hidden = (s.hiddenQueue || []).map(t => createItem(t));
    totalItems += items.length + hidden.length;
    return {
      id: s.id,
      capacity: 3,
      items,
      hiddenQueue: hidden,
    };
  });

  return {
    level: config.level,
    shelves,
    score: 0,
    moves: 0,
    timeRemaining: config.timeLimit,
    totalItemsRemaining: totalItems,
    isWon: false,
    isGameOver: false,
    selectedShelfId: null,
    selectedItemIndex: null,
    consecutiveMatches: 0,
  };
}

/**
 * Handle selecting an item on a shelf, or moving previously selected item to a target shelf.
 */
export function handleSlotClick(
  state: PantryState,
  shelfId: string,
  itemIndex?: number
): PantryState {
  if (state.isWon || state.isGameOver) return state;

  const targetShelf = state.shelves.find(s => s.id === shelfId);
  if (!targetShelf) return state;

  // Case 1: No item selected yet
  if (state.selectedShelfId === null) {
    if (itemIndex === undefined || itemIndex < 0 || itemIndex >= targetShelf.items.length) {
      return state; // clicked empty slot when nothing selected
    }
    // Select this item
    return {
      ...state,
      selectedShelfId: shelfId,
      selectedItemIndex: itemIndex,
    };
  }

  // Case 2: An item is already selected
  const fromShelfId = state.selectedShelfId;
  const fromIndex = state.selectedItemIndex ?? 0;

  // Clicking the exact same selected item deselects it
  if (fromShelfId === shelfId && fromIndex === itemIndex) {
    return {
      ...state,
      selectedShelfId: null,
      selectedItemIndex: null,
    };
  }

  // Clicking another item on the same shelf switches selection
  if (fromShelfId === shelfId && itemIndex !== undefined && itemIndex < targetShelf.items.length) {
    return {
      ...state,
      selectedItemIndex: itemIndex,
    };
  }

  // Move item from fromShelfId to targetShelf
  return moveItem(state, fromShelfId, fromIndex, shelfId);
}

/**
 * Moves an item from one shelf to another and checks for 3-item matches.
 */
export function moveItem(
  state: PantryState,
  fromShelfId: string,
  fromIndex: number,
  toShelfId: string
): PantryState {
  if (state.isWon || state.isGameOver) return state;

  const fromShelf = state.shelves.find(s => s.id === fromShelfId);
  const toShelf = state.shelves.find(s => s.id === toShelfId);

  if (!fromShelf || !toShelf) {
    return { ...state, selectedShelfId: null, selectedItemIndex: null };
  }

  // Validation: fromIndex must exist
  if (fromIndex < 0 || fromIndex >= fromShelf.items.length) {
    return { ...state, selectedShelfId: null, selectedItemIndex: null };
  }

  // Validation: toShelf must have open capacity
  if (toShelf.items.length >= toShelf.capacity) {
    return { ...state, selectedShelfId: null, selectedItemIndex: null };
  }

  // Execute transfer
  const itemToMove = fromShelf.items[fromIndex];
  const newFromItems = fromShelf.items.filter((_, idx) => idx !== fromIndex);
  const newToItems = [...toShelf.items, itemToMove];

  let newShelves = state.shelves.map(s => {
    if (s.id === fromShelfId) {
      return { ...s, items: newFromItems };
    }
    if (s.id === toShelfId) {
      return { ...s, items: newToItems };
    }
    return s;
  });

  // Check and process 3-matches
  const { updatedShelves, clearedCount, pointsEarned } = resolveMatchesAndHiddenItems(newShelves);

  const newTotalRemaining = state.totalItemsRemaining - clearedCount;
  const newMoves = state.moves + 1;
  const newScore = state.score + pointsEarned;
  const isWon = newTotalRemaining <= 0;

  return {
    ...state,
    shelves: updatedShelves,
    score: newScore,
    moves: newMoves,
    totalItemsRemaining: Math.max(0, newTotalRemaining),
    isWon,
    selectedShelfId: null,
    selectedItemIndex: null,
    consecutiveMatches: clearedCount > 0 ? state.consecutiveMatches + 1 : 0,
  };
}

/**
 * Detects any shelf with 3 identical items, clears them, and pulls forward hidden reserve items.
 */
export function resolveMatchesAndHiddenItems(shelves: Shelf[]): {
  updatedShelves: Shelf[];
  clearedCount: number;
  pointsEarned: number;
} {
  let clearedCount = 0;
  let pointsEarned = 0;

  let currentShelves = shelves.map(s => ({
    ...s,
    items: [...s.items],
    hiddenQueue: [...s.hiddenQueue],
  }));

  let foundMatch = true;
  while (foundMatch) {
    foundMatch = false;

    for (let i = 0; i < currentShelves.length; i++) {
      const shelf = currentShelves[i];
      if (shelf.items.length === 3) {
        const type0 = shelf.items[0].type;
        const isMatch = shelf.items.every(it => it.type === type0);

        if (isMatch) {
          // Clear the 3 items
          clearedCount += 3;
          pointsEarned += 300;
          foundMatch = true;

          // Pull up to 3 items from hiddenQueue
          const newItems: PantryItem[] = [];
          while (newItems.length < 3 && shelf.hiddenQueue.length > 0) {
            newItems.push(shelf.hiddenQueue.shift()!);
          }

          shelf.items = newItems;
        }
      }
    }
  }

  return {
    updatedShelves: currentShelves,
    clearedCount,
    pointsEarned,
  };
}

/**
 * Ticks time down by delta seconds.
 */
export function tickPantryTimer(state: PantryState, deltaSeconds: number): PantryState {
  if (state.isWon || state.isGameOver) return state;

  const nextTime = Math.max(0, state.timeRemaining - deltaSeconds);
  const isGameOver = nextTime <= 0;

  return {
    ...state,
    timeRemaining: nextTime,
    isGameOver,
  };
}

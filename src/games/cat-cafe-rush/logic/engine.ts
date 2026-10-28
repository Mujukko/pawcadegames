export type RecipeId = 'taiyaki' | 'strawberry_cake' | 'matcha_latte' | 'purr_donut';

export interface RecipeDef {
  id: RecipeId;
  name: string;
  emoji: string;
  basePrice: number;
  prepType: 'waffle_iron' | 'instant' | 'steamer' | 'prep_board';
}

export const RECIPES: Record<RecipeId, RecipeDef> = {
  taiyaki: {
    id: 'taiyaki',
    name: 'Fish Taiyaki Waffle',
    emoji: '🐟🧇',
    basePrice: 35,
    prepType: 'waffle_iron',
  },
  strawberry_cake: {
    id: 'strawberry_cake',
    name: 'Cat Shortcake',
    emoji: '🍰🍓',
    basePrice: 45,
    prepType: 'prep_board',
  },
  matcha_latte: {
    id: 'matcha_latte',
    name: 'Matcha Cat Latte',
    emoji: '🍵🥛',
    basePrice: 40,
    prepType: 'steamer',
  },
  purr_donut: {
    id: 'purr_donut',
    name: 'Purr-fect Donut',
    emoji: '🍩✨',
    basePrice: 30,
    prepType: 'instant',
  },
};

export type CatBreed = 'calico' | 'tabby' | 'tuxedo' | 'siamese' | 'persian' | 'golden_king';

export interface CustomerCat {
  id: string;
  name: string;
  breed: CatBreed;
  order: RecipeId;
  seatIndex: number; // 0, 1, 2
  patience: number; // 0 to 100
  maxPatience: number; // seconds
  patienceLeftSec: number;
  isVip: boolean;
  status: 'waiting' | 'satisfied' | 'leaving_angry';
}

export interface WaffleIronState {
  status: 'empty' | 'baking' | 'ready' | 'burnt';
  timer: number;
  bakeDuration: number;
  burnDuration: number;
}

export interface SteamerState {
  status: 'empty' | 'steaming' | 'ready';
  timer: number;
  steamDuration: number;
}

export interface CatCafeState {
  day: number;
  dayName: string;
  shiftDuration: number;
  shiftTimeLeft: number;
  score: number;
  coins: number;
  combo: number;
  maxCombo: number;
  servedCount: number;
  missedCount: number;
  targetServed: number;
  status: 'ready' | 'playing' | 'paused' | 'shift_cleared' | 'game_over' | 'victory';
  customers: CustomerCat[];
  customerSpawnTimer: number;
  waffleIron: WaffleIronState;
  steamer: SteamerState;
  readyPlatter: RecipeId[]; // finished items held on counter tray (max 4)
}

export interface CatCafeEvents {
  itemCooked: RecipeId | null;
  itemBurnt: boolean;
  customerServed: {
    cat: CustomerCat;
    coinsEarned: number;
    speedBonus: boolean;
    combo: number;
  } | null;
  customerLeftAngry: CustomerCat | null;
  shiftCleared: boolean;
  gameOver: boolean;
}

export const DAY_CONFIGS = [
  {
    day: 1,
    name: 'Morning Meow Breakfast',
    shiftDuration: 65,
    targetServed: 6,
    availableRecipes: ['taiyaki', 'purr_donut'] as RecipeId[],
    customerPatience: 22,
    spawnInterval: 5.5,
  },
  {
    day: 2,
    name: 'Afternoon Sweet Treat',
    shiftDuration: 75,
    targetServed: 9,
    availableRecipes: ['taiyaki', 'strawberry_cake', 'matcha_latte'] as RecipeId[],
    customerPatience: 18,
    spawnInterval: 4.5,
  },
  {
    day: 3,
    name: 'VIP Cat Critic Rush',
    shiftDuration: 85,
    targetServed: 12,
    availableRecipes: ['taiyaki', 'strawberry_cake', 'matcha_latte', 'purr_donut'] as RecipeId[],
    customerPatience: 16,
    spawnInterval: 3.8,
  },
];

export const CAT_NAMES: Record<CatBreed, string[]> = {
  calico: ['Luna', 'Maple', 'Patches'],
  tabby: ['Milo', 'Tiger', 'Oliver'],
  tuxedo: ['Oreo', 'Sylvester', 'Felix'],
  siamese: ['Cleo', 'Simba', 'Mocha'],
  persian: ['Princess', 'Snowball', 'Duchess'],
  golden_king: ['King Whiskers', 'Baron von Fluff'],
};

export function createInitialCatCafeState(day: number = 1): CatCafeState {
  const config = DAY_CONFIGS[day - 1] || DAY_CONFIGS[0];

  return {
    day,
    dayName: config.name,
    shiftDuration: config.shiftDuration,
    shiftTimeLeft: config.shiftDuration,
    score: 0,
    coins: 0,
    combo: 0,
    maxCombo: 0,
    servedCount: 0,
    missedCount: 0,
    targetServed: config.targetServed,
    status: 'ready',
    customers: [],
    customerSpawnTimer: 1.0, // spawn first customer quickly
    waffleIron: {
      status: 'empty',
      timer: 0,
      bakeDuration: 3.2,
      burnDuration: 6.0,
    },
    steamer: {
      status: 'empty',
      timer: 0,
      steamDuration: 2.6,
    },
    readyPlatter: [],
  };
}

export function spawnCustomer(state: CatCafeState): CustomerCat | null {
  // Find open seat index (0, 1, 2)
  const occupiedSeats = new Set(state.customers.map((c) => c.seatIndex));
  const openSeats: number[] = [0, 1, 2].filter((s) => !occupiedSeats.has(s));

  if (openSeats.length === 0) return null;

  const config = DAY_CONFIGS[state.day - 1] || DAY_CONFIGS[0];
  const seatIndex = openSeats[0];

  // Pick breed
  const isVip = state.day >= 3 && Math.random() < 0.25;
  const breed: CatBreed = isVip
    ? 'golden_king'
    : (['calico', 'tabby', 'tuxedo', 'siamese', 'persian'][
        Math.floor(Math.random() * 5)
      ] as CatBreed);

  const names = CAT_NAMES[breed];
  const name = names[Math.floor(Math.random() * names.length)];

  const order =
    config.availableRecipes[Math.floor(Math.random() * config.availableRecipes.length)];
  const patienceDuration = isVip ? config.customerPatience * 0.85 : config.customerPatience;

  return {
    id: `cat-${Date.now()}-${Math.random()}`,
    name,
    breed,
    order,
    seatIndex,
    patience: 100,
    maxPatience: patienceDuration,
    patienceLeftSec: patienceDuration,
    isVip,
    status: 'waiting',
  };
}

// User Actions
export function startBakingTaiyaki(state: CatCafeState): boolean {
  if (state.waffleIron.status !== 'empty') return false;
  state.waffleIron.status = 'baking';
  state.waffleIron.timer = 0;
  return true;
}

export function collectTaiyaki(state: CatCafeState): boolean {
  if (state.waffleIron.status === 'ready') {
    if (state.readyPlatter.length < 4) {
      state.readyPlatter.push('taiyaki');
      state.waffleIron.status = 'empty';
      state.waffleIron.timer = 0;
      return true;
    }
  } else if (state.waffleIron.status === 'burnt') {
    // Trash burnt waffle
    state.waffleIron.status = 'empty';
    state.waffleIron.timer = 0;
    return true;
  }
  return false;
}

export function startSteamingLatte(state: CatCafeState): boolean {
  if (state.steamer.status !== 'empty') return false;
  state.steamer.status = 'steaming';
  state.steamer.timer = 0;
  return true;
}

export function collectLatte(state: CatCafeState): boolean {
  if (state.steamer.status === 'ready') {
    if (state.readyPlatter.length < 4) {
      state.readyPlatter.push('matcha_latte');
      state.steamer.status = 'empty';
      state.steamer.timer = 0;
      return true;
    }
  }
  return false;
}

export function prepStrawberryCake(state: CatCafeState): boolean {
  if (state.readyPlatter.length < 4) {
    state.readyPlatter.push('strawberry_cake');
    return true;
  }
  return false;
}

export function prepDonut(state: CatCafeState): boolean {
  if (state.readyPlatter.length < 4) {
    state.readyPlatter.push('purr_donut');
    return true;
  }
  return false;
}

export function discardPlatterItem(state: CatCafeState, index: number): boolean {
  if (index >= 0 && index < state.readyPlatter.length) {
    state.readyPlatter.splice(index, 1);
    return true;
  }
  return false;
}

export function serveCustomerAtSeat(
  state: CatCafeState,
  seatIndex: number
): { success: boolean; earned: number } {
  const customerIndex = state.customers.findIndex((c) => c.seatIndex === seatIndex);
  if (customerIndex === -1) return { success: false, earned: 0 };

  const customer = state.customers[customerIndex];
  const platterIdx = state.readyPlatter.indexOf(customer.order);

  if (platterIdx === -1) {
    return { success: false, earned: 0 };
  }

  // Remove from platter
  state.readyPlatter.splice(platterIdx, 1);

  // Calculate earnings
  const recipe = RECIPES[customer.order];
  state.combo += 1;
  if (state.combo > state.maxCombo) {
    state.maxCombo = state.combo;
  }

  const speedBonus = customer.patience >= 60;
  let earned = recipe.basePrice;

  if (speedBonus) {
    earned = Math.floor(earned * 1.5);
  }
  if (customer.isVip) {
    earned *= 2;
  }

  // Combo multiplier
  const comboMultiplier = Math.min(3, 1 + Math.floor(state.combo / 3) * 0.5);
  earned = Math.floor(earned * comboMultiplier);

  state.coins += earned;
  state.score += earned;
  state.servedCount += 1;

  // Remove customer
  state.customers.splice(customerIndex, 1);

  return { success: true, earned };
}

// Main Frame Step
export function stepCatCafe(
  state: CatCafeState,
  dt: number
): { state: CatCafeState; events: CatCafeEvents } {
  const events: CatCafeEvents = {
    itemCooked: null,
    itemBurnt: false,
    customerServed: null,
    customerLeftAngry: null,
    shiftCleared: false,
    gameOver: false,
  };

  if (state.status !== 'playing' || dt <= 0) {
    return { state, events };
  }

  const config = DAY_CONFIGS[state.day - 1] || DAY_CONFIGS[0];

  // Shift countdown timer
  state.shiftTimeLeft = Math.max(0, state.shiftTimeLeft - dt);
  if (state.shiftTimeLeft <= 0) {
    if (state.servedCount >= state.targetServed) {
      if (state.day >= 3) {
        state.status = 'victory';
      } else {
        state.status = 'shift_cleared';
      }
      events.shiftCleared = true;
    } else {
      state.status = 'game_over';
      events.gameOver = true;
    }
    return { state, events };
  }

  // Waffle Iron timer
  if (state.waffleIron.status === 'baking') {
    state.waffleIron.timer += dt;
    if (state.waffleIron.timer >= state.waffleIron.bakeDuration) {
      state.waffleIron.status = 'ready';
      events.itemCooked = 'taiyaki';
    }
  } else if (state.waffleIron.status === 'ready') {
    state.waffleIron.timer += dt;
    if (state.waffleIron.timer >= state.waffleIron.burnDuration) {
      state.waffleIron.status = 'burnt';
      events.itemBurnt = true;
    }
  }

  // Steamer timer
  if (state.steamer.status === 'steaming') {
    state.steamer.timer += dt;
    if (state.steamer.timer >= state.steamer.steamDuration) {
      state.steamer.status = 'ready';
      events.itemCooked = 'matcha_latte';
    }
  }

  // Customer Spawning
  state.customerSpawnTimer -= dt;
  if (state.customerSpawnTimer <= 0) {
    const newCat = spawnCustomer(state);
    if (newCat) {
      state.customers.push(newCat);
    }
    state.customerSpawnTimer = config.spawnInterval + Math.random() * 1.5;
  }

  // Customer Patience Decay
  const remainingCustomers: CustomerCat[] = [];
  for (const cat of state.customers) {
    cat.patienceLeftSec -= dt;
    cat.patience = Math.max(0, Math.floor((cat.patienceLeftSec / cat.maxPatience) * 100));

    if (cat.patienceLeftSec <= 0) {
      // Cat left angry!
      state.missedCount += 1;
      state.combo = 0; // reset combo
      events.customerLeftAngry = cat;
    } else {
      remainingCustomers.push(cat);
    }
  }
  state.customers = remainingCustomers;

  // Immediate check if target served reached before timer runs out
  if (state.servedCount >= state.targetServed && state.customers.length === 0) {
    if (state.day >= 3) {
      state.status = 'victory';
    } else {
      state.status = 'shift_cleared';
    }
    events.shiftCleared = true;
  }

  return { state, events };
}

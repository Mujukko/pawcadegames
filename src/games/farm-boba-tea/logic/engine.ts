import {
  BobaCup,
  BobaEvent,
  BobaTeaBase,
  BobaTopping,
  CustomerOrder,
  FarmBobaState,
  IceLevel,
  MAX_LIVES,
  MAX_TOPPINGS,
  ShiftConfig,
  SweetnessLevel,
} from './types';

export const SHIFT_CONFIGS: ShiftConfig[] = [
  { shift: 1, name: 'Morning Pasture Rush', targetCustomers: 4, patienceDuration: 28 },
  { shift: 2, name: 'Afternoon Barnyard Cafe', targetCustomers: 5, patienceDuration: 24 },
  { shift: 3, name: 'Sunset Boba Hour', targetCustomers: 6, patienceDuration: 20 },
  { shift: 4, name: 'County Fair Boba Festival', targetCustomers: 7, patienceDuration: 17 },
];

export const CUSTOMER_PROFILES = [
  {
    id: 'daisy_calf' as const,
    name: 'Daisy Calf',
    mascot: '🐮',
    avatarColor: 'from-emerald-500 to-green-600',
    favoriteTea: 'farm_milk' as BobaTeaBase,
    favoriteTopping: 'tapioca' as BobaTopping,
  },
  {
    id: 'corgi_sunny' as const,
    name: 'Sunny Corgi',
    mascot: '🐶',
    avatarColor: 'from-amber-500 to-orange-600',
    favoriteTea: 'strawberry' as BobaTeaBase,
    favoriteTopping: 'strawberry_jelly' as BobaTopping,
  },
  {
    id: 'whiskers_cat' as const,
    name: 'Whiskers Cat',
    mascot: '🐱',
    avatarColor: 'from-purple-500 to-indigo-600',
    favoriteTea: 'matcha' as BobaTeaBase,
    favoriteTopping: 'mango_boba' as BobaTopping,
  },
  {
    id: 'woolly_lamb' as const,
    name: 'Woolly Lamb',
    mascot: '🐑',
    avatarColor: 'from-sky-500 to-blue-600',
    favoriteTea: 'thai_tea' as BobaTeaBase,
    favoriteTopping: 'honeycomb' as BobaTopping,
  },
];

export function createEmptyCup(): BobaCup {
  return {
    toppings: [],
    teaBase: null,
    iceLevel: 'none',
    sweetness: null,
    isSealed: false,
    hasStraw: false,
  };
}

let customerCounter = 1;

export function spawnCustomer(shift: number): CustomerOrder {
  const profileIndex = (customerCounter + shift) % CUSTOMER_PROFILES.length;
  const profile = CUSTOMER_PROFILES[profileIndex];
  customerCounter++;

  const teas: BobaTeaBase[] = ['farm_milk', 'matcha', 'strawberry', 'thai_tea'];
  const toppings: BobaTopping[] = ['tapioca', 'strawberry_jelly', 'mango_boba', 'honeycomb'];
  const ices: IceLevel[] = ['none', 'normal', 'extra'];
  const sweets: SweetnessLevel[] = ['half', 'full'];

  // Higher chance to pick their favorite, or random
  const requestedTea = Math.random() > 0.4 ? profile.favoriteTea : teas[Math.floor(Math.random() * teas.length)];
  const requestedTopping = Math.random() > 0.4 ? profile.favoriteTopping : toppings[Math.floor(Math.random() * toppings.length)];
  const requestedIce = ices[Math.floor(Math.random() * ices.length)];
  const requestedSweetness = sweets[Math.floor(Math.random() * sweets.length)];

  const config = SHIFT_CONFIGS[(shift - 1) % SHIFT_CONFIGS.length];

  return {
    id: `cust_${Date.now()}_${customerCounter}`,
    customerId: profile.id,
    customerName: profile.name,
    mascot: profile.mascot,
    avatarColor: profile.avatarColor,
    requestedTea,
    requestedTopping,
    requestedIce,
    requestedSweetness,
    patience: 100,
    maxPatience: config.patienceDuration,
  };
}

export function createInitialState(shift = 1, highScore = 0): FarmBobaState {
  const config = SHIFT_CONFIGS[(shift - 1) % SHIFT_CONFIGS.length];
  return {
    currentCup: createEmptyCup(),
    currentCustomer: spawnCustomer(shift),
    customersServed: 0,
    targetCustomers: config.targetCustomers,
    shift,
    totalShifts: SHIFT_CONFIGS.length,
    coins: 0,
    score: 0,
    combo: 0,
    lives: MAX_LIVES,
    highScore,
    shiftComplete: false,
    gameComplete: false,
    gameOver: false,
    events: [],
  };
}

export function addTopping(state: FarmBobaState, topping: BobaTopping): FarmBobaState {
  if (state.gameOver || state.shiftComplete || state.currentCup.isSealed) {
    return state;
  }
  if (state.currentCup.toppings.length >= MAX_TOPPINGS) {
    return state;
  }

  const nextToppings = [...state.currentCup.toppings, topping];
  return {
    ...state,
    currentCup: {
      ...state.currentCup,
      toppings: nextToppings,
    },
    events: [{ type: 'add_topping', topping }],
  };
}

export function pourTea(state: FarmBobaState, teaBase: BobaTeaBase): FarmBobaState {
  if (state.gameOver || state.shiftComplete || state.currentCup.isSealed) {
    return state;
  }

  return {
    ...state,
    currentCup: {
      ...state.currentCup,
      teaBase,
    },
    events: [{ type: 'pour_tea', teaBase }],
  };
}

export function toggleIce(state: FarmBobaState): FarmBobaState {
  if (state.gameOver || state.shiftComplete || state.currentCup.isSealed) {
    return state;
  }

  const cycle: Record<IceLevel, IceLevel> = {
    none: 'normal',
    normal: 'extra',
    extra: 'none',
  };
  const nextIce = cycle[state.currentCup.iceLevel];

  return {
    ...state,
    currentCup: {
      ...state.currentCup,
      iceLevel: nextIce,
    },
    events: [{ type: 'add_ice', iceLevel: nextIce }],
  };
}

export function addSweetness(state: FarmBobaState, sweetness: SweetnessLevel): FarmBobaState {
  if (state.gameOver || state.shiftComplete || state.currentCup.isSealed) {
    return state;
  }

  return {
    ...state,
    currentCup: {
      ...state.currentCup,
      sweetness,
    },
    events: [{ type: 'add_sweetness', sweetness }],
  };
}

export function sealAndStraw(state: FarmBobaState): FarmBobaState {
  if (state.gameOver || state.shiftComplete || state.currentCup.isSealed) {
    return state;
  }
  // Require at least pouring the tea base
  if (!state.currentCup.teaBase) {
    return state;
  }

  return {
    ...state,
    currentCup: {
      ...state.currentCup,
      isSealed: true,
      hasStraw: true,
    },
    events: [{ type: 'seal_cup' }, { type: 'poke_straw' }],
  };
}

export function trashCup(state: FarmBobaState): FarmBobaState {
  if (state.gameOver || state.shiftComplete) {
    return state;
  }

  return {
    ...state,
    currentCup: createEmptyCup(),
    events: [{ type: 'trash_cup' }],
  };
}

export function calculateOrderAccuracy(cup: BobaCup, order: CustomerOrder): number {
  let score = 0;

  // 1. Tea Base (40 pts)
  if (cup.teaBase === order.requestedTea) {
    score += 40;
  }

  // 2. Topping Match (35 pts)
  if (cup.toppings.includes(order.requestedTopping)) {
    score += 35;
  }

  // 3. Ice Level (15 pts)
  if (cup.iceLevel === order.requestedIce) {
    score += 15;
  } else if (
    (cup.iceLevel === 'normal' && order.requestedIce === 'extra') ||
    (cup.iceLevel === 'extra' && order.requestedIce === 'normal')
  ) {
    score += 8; // Partial credit for close ice
  }

  // 4. Sweetness (10 pts)
  if (cup.sweetness === order.requestedSweetness) {
    score += 10;
  } else if (cup.sweetness !== null) {
    score += 5; // Partial credit
  }

  return score;
}

export function serveOrder(state: FarmBobaState): FarmBobaState {
  if (state.gameOver || state.shiftComplete || !state.currentCustomer || !state.currentCup.isSealed) {
    return state;
  }

  const accuracy = calculateOrderAccuracy(state.currentCup, state.currentCustomer);
  const events: BobaEvent[] = [];

  if (accuracy >= 60) {
    // Satisfied Customer!
    const nextCombo = state.combo + 1;
    const baseCoins = Math.round(15 * (accuracy / 100) * (1 + nextCombo * 0.15));
    const tip = Math.round((state.currentCustomer.patience / 100) * 12);
    const earnedScore = 150 + baseCoins * 5 + tip * 10;

    const nextScore = state.score + earnedScore;
    const nextCoins = state.coins + baseCoins + tip;
    const nextCustomersServed = state.customersServed + 1;
    const nextHighScore = Math.max(state.highScore, nextScore);

    events.push({
      type: 'order_served',
      accuracy,
      coins: baseCoins,
      tip,
    });

    let nextShiftComplete = false;
    let nextGameComplete = false;

    if (nextCustomersServed >= state.targetCustomers) {
      nextShiftComplete = true;
      events.push({ type: 'shift_clear', shift: state.shift, score: nextScore });

      if (state.shift >= state.totalShifts) {
        nextGameComplete = true;
        events.push({ type: 'game_complete', finalScore: nextScore });
      }
    }

    return {
      ...state,
      currentCup: createEmptyCup(),
      currentCustomer: nextShiftComplete ? null : spawnCustomer(state.shift),
      customersServed: nextCustomersServed,
      score: nextScore,
      coins: nextCoins,
      combo: nextCombo,
      highScore: nextHighScore,
      shiftComplete: nextShiftComplete,
      gameComplete: nextGameComplete,
      events,
    };
  } else {
    // Failed Drink! Wrong ingredients
    const nextLives = state.lives - 1;
    let nextGameOver = false;

    events.push({ type: 'order_failed', reason: 'wrong_order' });

    if (nextLives <= 0) {
      nextGameOver = true;
      events.push({ type: 'game_over', finalScore: state.score });
    }

    return {
      ...state,
      currentCup: createEmptyCup(),
      currentCustomer: nextGameOver ? null : spawnCustomer(state.shift),
      lives: nextLives,
      combo: 0,
      gameOver: nextGameOver,
      events,
    };
  }
}

export function updateEngine(state: FarmBobaState, dt: number): FarmBobaState {
  if (state.gameOver || state.shiftComplete || state.gameComplete || !state.currentCustomer) {
    return state;
  }

  const clampedDt = Math.min(dt, 0.1);
  const events: BobaEvent[] = [];

  // Patience decreases based on maxPatience duration
  const decayRate = 100 / state.currentCustomer.maxPatience;
  const nextPatience = state.currentCustomer.patience - decayRate * clampedDt;

  if (nextPatience <= 0) {
    // Customer timed out and left angry!
    const nextLives = state.lives - 1;
    let nextGameOver = false;

    events.push({ type: 'order_failed', reason: 'timeout' });

    if (nextLives <= 0) {
      nextGameOver = true;
      events.push({ type: 'game_over', finalScore: state.score });
    }

    return {
      ...state,
      currentCup: createEmptyCup(),
      currentCustomer: nextGameOver ? null : spawnCustomer(state.shift),
      lives: nextLives,
      combo: 0,
      gameOver: nextGameOver,
      events,
    };
  }

  return {
    ...state,
    currentCustomer: {
      ...state.currentCustomer,
      patience: nextPatience,
    },
    events,
  };
}

export function restartShift(state: FarmBobaState): FarmBobaState {
  const config = SHIFT_CONFIGS[(state.shift - 1) % SHIFT_CONFIGS.length];
  return {
    ...state,
    currentCup: createEmptyCup(),
    currentCustomer: spawnCustomer(state.shift),
    customersServed: 0,
    targetCustomers: config.targetCustomers,
    lives: MAX_LIVES,
    combo: 0,
    shiftComplete: false,
    gameComplete: false,
    gameOver: false,
    events: [],
  };
}

export function nextShift(state: FarmBobaState): FarmBobaState {
  const nextShiftNum = Math.min(state.totalShifts, state.shift + 1);
  const config = SHIFT_CONFIGS[(nextShiftNum - 1) % SHIFT_CONFIGS.length];
  return {
    ...state,
    shift: nextShiftNum,
    currentCup: createEmptyCup(),
    currentCustomer: spawnCustomer(nextShiftNum),
    customersServed: 0,
    targetCustomers: config.targetCustomers,
    combo: 0,
    shiftComplete: false,
    gameComplete: false,
    events: [],
  };
}

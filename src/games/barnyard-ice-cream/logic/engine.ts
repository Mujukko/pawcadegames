import {
  BarnyardIceCreamState,
  IceCreamCone,
  IceCreamCustomer,
  IceCreamEvent,
  IceCreamFlavor,
  IceCreamShiftConfig,
  IceCreamSyrup,
  IceCreamTopping,
  MAX_LIVES,
  MAX_SCOOPS,
} from './types';

export const SHIFT_CONFIGS: IceCreamShiftConfig[] = [
  { shift: 1, name: 'Morning Country Cart', targetCustomers: 4, patienceDuration: 28 },
  { shift: 2, name: 'Afternoon Fair Booth', targetCustomers: 5, patienceDuration: 24 },
  { shift: 3, name: 'Sunset Boardwalk Social', targetCustomers: 6, patienceDuration: 21 },
  { shift: 4, name: 'County Fair Jubilee', targetCustomers: 7, patienceDuration: 18 },
];

export const CUSTOMER_PROFILES = [
  {
    id: 'penny_piglet' as const,
    name: 'Penny Piglet',
    mascot: '🐷',
    avatarColor: 'from-pink-500 to-rose-600',
    favoriteFlavor: 'strawberry' as IceCreamFlavor,
    favoriteSyrup: 'strawberry_glaze' as IceCreamSyrup,
  },
  {
    id: 'barnaby_pup' as const,
    name: 'Barnaby Pup',
    mascot: '🐶',
    avatarColor: 'from-amber-500 to-orange-600',
    favoriteFlavor: 'chocolate' as IceCreamFlavor,
    favoriteSyrup: 'fudge' as IceCreamSyrup,
  },
  {
    id: 'whiskers_cat' as const,
    name: 'Whiskers Cat',
    mascot: '🐱',
    avatarColor: 'from-emerald-500 to-teal-600',
    favoriteFlavor: 'mint' as IceCreamFlavor,
    favoriteSyrup: 'fudge' as IceCreamSyrup,
  },
  {
    id: 'bessie_cow' as const,
    name: 'Bessie Cow',
    mascot: '🐮',
    avatarColor: 'from-blue-500 to-indigo-600',
    favoriteFlavor: 'vanilla' as IceCreamFlavor,
    favoriteSyrup: 'caramel_drizzle' as IceCreamSyrup,
  },
];

export function createEmptyCone(base: 'waffle_cone' | 'sundae_bowl' = 'waffle_cone'): IceCreamCone {
  return {
    base,
    scoops: [],
    syrups: [],
    toppings: [],
    hasWhippedCream: false,
    hasCherry: false,
  };
}

let customerIdCounter = 1;

export function spawnIceCreamCustomer(shift: number): IceCreamCustomer {
  const profileIndex = (customerIdCounter + shift) % CUSTOMER_PROFILES.length;
  const profile = CUSTOMER_PROFILES[profileIndex];
  customerIdCounter++;

  const flavors: IceCreamFlavor[] = ['vanilla', 'strawberry', 'chocolate', 'mint', 'caramel'];
  const syrups: IceCreamSyrup[] = ['fudge', 'strawberry_glaze', 'caramel_drizzle'];
  const toppings: IceCreamTopping[] = ['rainbow_sprinkles', 'crushed_nuts', 'waffle_crunch'];

  // Higher shifts order more scoops
  const scoopCount = shift === 1 ? (Math.random() > 0.5 ? 1 : 2) : shift === 2 ? 2 : shift === 3 ? (Math.random() > 0.4 ? 3 : 2) : (Math.random() > 0.3 ? 3 : 4);
  const requestedScoops: IceCreamFlavor[] = [];

  // Always include favorite flavor
  requestedScoops.push(profile.favoriteFlavor);
  for (let i = 1; i < scoopCount; i++) {
    const randomFlavor = flavors[Math.floor(Math.random() * flavors.length)];
    requestedScoops.push(randomFlavor);
  }

  const requestedBase: 'waffle_cone' | 'sundae_bowl' = scoopCount >= 3 || Math.random() > 0.6 ? 'sundae_bowl' : 'waffle_cone';
  const requestedSyrup = shift >= 2 ? syrups[Math.floor(Math.random() * syrups.length)] : null;
  const requestedTopping = shift >= 2 ? toppings[Math.floor(Math.random() * toppings.length)] : null;
  const wantsCherry = shift >= 3 || Math.random() > 0.5;

  const config = SHIFT_CONFIGS[(shift - 1) % SHIFT_CONFIGS.length];

  return {
    id: `cust_${Date.now()}_${customerIdCounter}`,
    customerId: profile.id,
    name: profile.name,
    mascot: profile.mascot,
    avatarColor: profile.avatarColor,
    requestedBase,
    requestedScoops,
    requestedSyrup,
    requestedTopping,
    wantsCherry,
    patience: 100,
    maxPatience: config.patienceDuration,
  };
}

export function createInitialState(shift = 1, highScore = 0): BarnyardIceCreamState {
  const config = SHIFT_CONFIGS[(shift - 1) % SHIFT_CONFIGS.length];
  return {
    currentCone: createEmptyCone('waffle_cone'),
    currentCustomer: spawnIceCreamCustomer(shift),
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

export function switchBase(state: BarnyardIceCreamState, base: 'waffle_cone' | 'sundae_bowl'): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete) return state;
  return {
    ...state,
    currentCone: {
      ...state.currentCone,
      base,
    },
  };
}

export function addScoop(state: BarnyardIceCreamState, flavor: IceCreamFlavor): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || state.currentCone.scoops.length >= MAX_SCOOPS) {
    return state;
  }

  const nextScoops = [...state.currentCone.scoops, flavor];
  return {
    ...state,
    currentCone: {
      ...state.currentCone,
      scoops: nextScoops,
    },
    events: [{ type: 'add_scoop', flavor }],
  };
}

export function addSyrup(state: BarnyardIceCreamState, syrup: IceCreamSyrup): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || state.currentCone.scoops.length === 0) {
    return state;
  }
  if (state.currentCone.syrups.includes(syrup)) {
    return state;
  }

  return {
    ...state,
    currentCone: {
      ...state.currentCone,
      syrups: [...state.currentCone.syrups, syrup],
    },
    events: [{ type: 'add_syrup', syrup }],
  };
}

export function addTopping(state: BarnyardIceCreamState, topping: IceCreamTopping): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || state.currentCone.scoops.length === 0) {
    return state;
  }
  if (state.currentCone.toppings.includes(topping)) {
    return state;
  }

  return {
    ...state,
    currentCone: {
      ...state.currentCone,
      toppings: [...state.currentCone.toppings, topping],
    },
    events: [{ type: 'add_topping', topping }],
  };
}

export function addWhippedCream(state: BarnyardIceCreamState): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || state.currentCone.scoops.length === 0 || state.currentCone.hasWhippedCream) {
    return state;
  }

  return {
    ...state,
    currentCone: {
      ...state.currentCone,
      hasWhippedCream: true,
    },
    events: [{ type: 'add_whipped_cream' }],
  };
}

export function addCherry(state: BarnyardIceCreamState): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || state.currentCone.scoops.length === 0 || state.currentCone.hasCherry) {
    return state;
  }

  return {
    ...state,
    currentCone: {
      ...state.currentCone,
      hasCherry: true,
    },
    events: [{ type: 'add_cherry' }],
  };
}

export function trashCone(state: BarnyardIceCreamState): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete) return state;
  return {
    ...state,
    currentCone: createEmptyCone(state.currentCone.base),
    events: [{ type: 'trash_cone' }],
  };
}

export function calculateIceCreamAccuracy(cone: IceCreamCone, order: IceCreamCustomer): number {
  let score = 0;

  // 1. Base Match (15 pts)
  if (cone.base === order.requestedBase) {
    score += 15;
  }

  // 2. Scoops Matching (55 pts)
  if (cone.scoops.length === 0) {
    return 0;
  }

  const reqScoops = [...order.requestedScoops];
  let matchedScoops = 0;
  cone.scoops.forEach((flavor) => {
    const idx = reqScoops.indexOf(flavor);
    if (idx !== -1) {
      matchedScoops++;
      reqScoops.splice(idx, 1);
    }
  });

  const scoopFraction = matchedScoops / order.requestedScoops.length;
  // Penalty for overfilling or underfilling
  const lengthPenalty = Math.abs(cone.scoops.length - order.requestedScoops.length) * 0.15;
  const netFraction = Math.max(0, scoopFraction - lengthPenalty);
  score += Math.round(netFraction * 55);

  // 3. Syrup Matching (15 pts)
  if (order.requestedSyrup === null) {
    score += cone.syrups.length === 0 ? 15 : 8;
  } else if (cone.syrups.includes(order.requestedSyrup)) {
    score += 15;
  }

  // 4. Topping Matching (10 pts)
  if (order.requestedTopping === null) {
    score += cone.toppings.length === 0 ? 10 : 5;
  } else if (cone.toppings.includes(order.requestedTopping)) {
    score += 10;
  }

  // 5. Cherry Matching (5 pts)
  if (cone.hasCherry === order.wantsCherry) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}

export function serveIceCream(state: BarnyardIceCreamState): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || !state.currentCustomer || state.currentCone.scoops.length === 0) {
    return state;
  }

  const accuracy = calculateIceCreamAccuracy(state.currentCone, state.currentCustomer);
  const events: IceCreamEvent[] = [];

  if (accuracy >= 60) {
    // Customer delighted!
    const nextCombo = state.combo + 1;
    const baseCoins = Math.round(18 * (accuracy / 100) * (1 + nextCombo * 0.15));
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
      currentCone: createEmptyCone(state.currentCone.base),
      currentCustomer: nextShiftComplete ? null : spawnIceCreamCustomer(state.shift),
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
    // Bad order / melted mess
    const nextLives = state.lives - 1;
    let nextGameOver = false;

    events.push({ type: 'order_failed', reason: 'wrong_order' });

    if (nextLives <= 0) {
      nextGameOver = true;
      events.push({ type: 'game_over', finalScore: state.score });
    }

    return {
      ...state,
      currentCone: createEmptyCone(state.currentCone.base),
      currentCustomer: nextGameOver ? null : spawnIceCreamCustomer(state.shift),
      lives: nextLives,
      combo: 0,
      gameOver: nextGameOver,
      events,
    };
  }
}

export function updateEngine(state: BarnyardIceCreamState, dt: number): BarnyardIceCreamState {
  if (state.gameOver || state.shiftComplete || state.gameComplete || !state.currentCustomer) {
    return state;
  }

  const clampedDt = Math.min(dt, 0.1);
  const events: IceCreamEvent[] = [];

  const decayRate = 100 / state.currentCustomer.maxPatience;
  const nextPatience = state.currentCustomer.patience - decayRate * clampedDt;

  if (nextPatience <= 0) {
    const nextLives = state.lives - 1;
    let nextGameOver = false;

    events.push({ type: 'order_failed', reason: 'timeout' });

    if (nextLives <= 0) {
      nextGameOver = true;
      events.push({ type: 'game_over', finalScore: state.score });
    }

    return {
      ...state,
      currentCone: createEmptyCone(state.currentCone.base),
      currentCustomer: nextGameOver ? null : spawnIceCreamCustomer(state.shift),
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

export function restartShift(state: BarnyardIceCreamState): BarnyardIceCreamState {
  const config = SHIFT_CONFIGS[(state.shift - 1) % SHIFT_CONFIGS.length];
  return {
    ...state,
    currentCone: createEmptyCone('waffle_cone'),
    currentCustomer: spawnIceCreamCustomer(state.shift),
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

export function nextShift(state: BarnyardIceCreamState): BarnyardIceCreamState {
  const nextShiftNum = Math.min(state.totalShifts, state.shift + 1);
  const config = SHIFT_CONFIGS[(nextShiftNum - 1) % SHIFT_CONFIGS.length];
  return {
    ...state,
    shift: nextShiftNum,
    currentCone: createEmptyCone('waffle_cone'),
    currentCustomer: spawnIceCreamCustomer(nextShiftNum),
    customersServed: 0,
    targetCustomers: config.targetCustomers,
    combo: 0,
    shiftComplete: false,
    gameComplete: false,
    events: [],
  };
}

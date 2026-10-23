// Pure TypeScript Game Logic Engine for Chef Rat Rush (Ratatouille Kitchen Bistro)

export interface Ingredient {
  id: string;
  name: string;
  icon: string;
  category: 'produce' | 'bakery' | 'dairy' | 'pantry';
  keyShortcut: string;
}

export const INGREDIENTS: Record<string, Ingredient> = {
  eggplant: { id: 'eggplant', name: 'Eggplant', icon: '🍆', category: 'produce', keyShortcut: '1' },
  tomato: { id: 'tomato', name: 'Tomato', icon: '🍅', category: 'produce', keyShortcut: '2' },
  zucchini: { id: 'zucchini', name: 'Zucchini', icon: '🥒', category: 'produce', keyShortcut: '3' },
  cheese: { id: 'cheese', name: 'Swiss Cheese', icon: '🧀', category: 'dairy', keyShortcut: '4' },
  baguette: { id: 'baguette', name: 'Baguette', icon: '🥖', category: 'bakery', keyShortcut: '5' },
  berries: { id: 'berries', name: 'Fresh Berries', icon: '🍓', category: 'produce', keyShortcut: '6' },
  croissant: { id: 'croissant', name: 'Croissant', icon: '🥐', category: 'bakery', keyShortcut: '7' },
  lettuce: { id: 'lettuce', name: 'Crisp Lettuce', icon: '🥬', category: 'produce', keyShortcut: '8' },
};

export interface Recipe {
  id: string;
  name: string;
  icon: string;
  requiresCooking: boolean;
  cookTimeSeconds: number; // e.g., 3.0s on stove
  burnTimeSeconds: number; // e.g., 4.5s (burns if left too long)
  requiredIngredients: string[]; // Ingredient IDs
  baseReward: number; // Coins
  description: string;
}

export const RECIPES: Record<string, Recipe> = {
  ratatouille: {
    id: 'ratatouille',
    name: 'Gourmet Ratatouille',
    icon: '🍲',
    requiresCooking: true,
    cookTimeSeconds: 3.2,
    burnTimeSeconds: 4.8,
    requiredIngredients: ['eggplant', 'tomato', 'zucchini'],
    baseReward: 35,
    description: 'Signature layered vegetable stew simmered to perfection.',
  },
  'cheese-baguette': {
    id: 'cheese-baguette',
    name: 'French Cheese Baguette',
    icon: '🥖',
    requiresCooking: false,
    cookTimeSeconds: 0,
    burnTimeSeconds: 0,
    requiredIngredients: ['baguette', 'cheese', 'tomato'],
    baseReward: 24,
    description: 'Crusty artisan baguette layered with Swiss cheese and ripe tomatoes.',
  },
  'berry-crepe': {
    id: 'berry-crepe',
    name: 'Chef\'s Berry Crepe',
    icon: '🥞',
    requiresCooking: true,
    cookTimeSeconds: 2.8,
    burnTimeSeconds: 4.2,
    requiredIngredients: ['berries', 'cheese'],
    baseReward: 28,
    description: 'Golden skillet crepe folded with melted sweet cheese and fresh berries.',
  },
  'bistro-salad': {
    id: 'bistro-salad',
    name: 'Parisian Bistro Salad',
    icon: '🥗',
    requiresCooking: false,
    cookTimeSeconds: 0,
    burnTimeSeconds: 0,
    requiredIngredients: ['lettuce', 'tomato', 'cheese'],
    baseReward: 22,
    description: 'Crisp garden greens tossed with ripe tomato and shaved Swiss cheese.',
  },
  'golden-croissant': {
    id: 'golden-croissant',
    name: 'Golden Croissant Plate',
    icon: '🥐',
    requiresCooking: false,
    cookTimeSeconds: 0,
    burnTimeSeconds: 0,
    requiredIngredients: ['croissant', 'berries'],
    baseReward: 20,
    description: 'Flaky French butter croissant served with fresh hand-picked berries.',
  },
};

export interface OrderTicket {
  id: string;
  recipeId: string;
  customerName: string;
  customerIcon: string;
  isVIP: boolean;
  totalPatience: number; // Max seconds (e.g. 18s)
  currentPatience: number; // Remaining seconds
}

export type StoveStatus = 'empty' | 'cooking' | 'ready' | 'burnt';

export interface StoveStation {
  status: StoveStatus;
  recipeId: string | null;
  cookingProgress: number; // 0.0 to 1.0 (ready at 1.0)
  burnProgress: number; // 0.0 to 1.0 (burnt at 1.0)
  elapsedSeconds: number;
}

export interface ShiftConfig {
  shiftNumber: number;
  title: string;
  shiftDuration: number; // In seconds (e.g. 60s)
  targetScore: number;
  maxActiveTickets: number;
  allowedRecipes: string[];
  ticketInterval: number; // Seconds between incoming orders
}

export const SHIFT_CONFIGS: ShiftConfig[] = [
  {
    shiftNumber: 1,
    title: 'Shift 1: Bistro Opening',
    shiftDuration: 45,
    targetScore: 100,
    maxActiveTickets: 2,
    allowedRecipes: ['cheese-baguette', 'golden-croissant'],
    ticketInterval: 8,
  },
  {
    shiftNumber: 2,
    title: 'Shift 2: First Simmer',
    shiftDuration: 55,
    targetScore: 180,
    maxActiveTickets: 2,
    allowedRecipes: ['cheese-baguette', 'berry-crepe', 'bistro-salad'],
    ticketInterval: 7,
  },
  {
    shiftNumber: 3,
    title: 'Shift 3: The Great Ratatouille',
    shiftDuration: 65,
    targetScore: 260,
    maxActiveTickets: 3,
    allowedRecipes: ['cheese-baguette', 'ratatouille', 'bistro-salad', 'golden-croissant'],
    ticketInterval: 6.5,
  },
  {
    shiftNumber: 4,
    title: 'Shift 4: Dinner Rush Madness',
    shiftDuration: 75,
    targetScore: 360,
    maxActiveTickets: 3,
    allowedRecipes: ['cheese-baguette', 'ratatouille', 'berry-crepe', 'bistro-salad', 'golden-croissant'],
    ticketInterval: 5.5,
  },
  {
    shiftNumber: 5,
    title: 'Shift 5: The Grand Food Critic',
    shiftDuration: 85,
    targetScore: 480,
    maxActiveTickets: 4,
    allowedRecipes: ['cheese-baguette', 'ratatouille', 'berry-crepe', 'bistro-salad', 'golden-croissant'],
    ticketInterval: 5.0,
  },
];

export interface GameState {
  shiftNumber: number;
  timeRemaining: number; // Countdown in seconds
  score: number;
  coins: number;
  combo: number;
  maxCombo: number;
  ordersServed: number;
  ordersLost: number;
  activeTickets: OrderTicket[];
  prepBoard: string[]; // List of ingredient IDs currently selected on board
  stove: StoveStation;
  status: 'playing' | 'shift-won' | 'shift-lost' | 'paused';
  stars: number; // 0 to 3
}

const CUSTOMER_NAMES = [
  { name: 'Gourmet Pierre', icon: '🦊' },
  { name: 'Madame Colette', icon: '🐰' },
  { name: 'Baron Jean-Luc', icon: '🐻' },
  { name: 'Critic Anton', icon: '🦉' },
  { name: 'Little Gaston', icon: '🐭' },
  { name: 'Patissier Claire', icon: '🐱' },
];

export function createInitialGameState(shiftNum = 1): GameState {
  const config = SHIFT_CONFIGS[shiftNum - 1] || SHIFT_CONFIGS[0]!;
  
  // Initial 1 or 2 tickets to start immediately
  const initialTicket: OrderTicket = {
    id: 'ticket-1',
    recipeId: config.allowedRecipes[0]!,
    customerName: CUSTOMER_NAMES[0]!.name,
    customerIcon: CUSTOMER_NAMES[0]!.icon,
    isVIP: false,
    totalPatience: 22,
    currentPatience: 22,
  };

  return {
    shiftNumber: shiftNum,
    timeRemaining: config.shiftDuration,
    score: 0,
    coins: 0,
    combo: 0,
    maxCombo: 0,
    ordersServed: 0,
    ordersLost: 0,
    activeTickets: [initialTicket],
    prepBoard: [],
    stove: {
      status: 'empty',
      recipeId: null,
      cookingProgress: 0,
      burnProgress: 0,
      elapsedSeconds: 0,
    },
    status: 'playing',
    stars: 0,
  };
}

let ticketCounter = 2;

export function spawnCustomerTicket(state: GameState, config: ShiftConfig): OrderTicket | null {
  if (state.activeTickets.length >= config.maxActiveTickets) return null;

  // Pick random allowed recipe
  const recipeIndex = Math.floor(Math.random() * config.allowedRecipes.length);
  const recipeId = config.allowedRecipes[recipeIndex]!;
  
  // Pick random customer
  const cust = CUSTOMER_NAMES[Math.floor(Math.random() * CUSTOMER_NAMES.length)]!;
  const isVIP = Math.random() < 0.25;

  const ticket: OrderTicket = {
    id: `ticket-${ticketCounter++}`,
    recipeId,
    customerName: isVIP ? `⭐ Critic ${cust.name}` : cust.name,
    customerIcon: cust.icon,
    isVIP,
    totalPatience: isVIP ? 16 : 20,
    currentPatience: isVIP ? 16 : 20,
  };

  return ticket;
}

export function addIngredientToPrepBoard(state: GameState, ingredientId: string): GameState {
  if (state.status !== 'playing') return state;
  if (!INGREDIENTS[ingredientId]) return state;

  // Limit board to max 5 ingredients
  if (state.prepBoard.length >= 5) return state;

  return {
    ...state,
    prepBoard: [...state.prepBoard, ingredientId],
  };
}

export function clearPrepBoard(state: GameState): GameState {
  return {
    ...state,
    prepBoard: [],
  };
}

export function startCookingOnStove(state: GameState): { state: GameState; success: boolean; message: string } {
  if (state.status !== 'playing') return { state, success: false, message: 'Game not playing' };
  if (state.stove.status !== 'empty') {
    return { state, success: false, message: 'Stove is currently occupied!' };
  }

  // Find if current prep board matches any cookable recipe
  const matchedRecipe = findMatchingRecipe(state.prepBoard);
  if (!matchedRecipe) {
    return { state, success: false, message: 'Ingredients do not match any recipe!' };
  }

  if (!matchedRecipe.requiresCooking) {
    return { state, success: false, message: `${matchedRecipe.name} is served cold, no cooking needed!` };
  }

  // Clear board and place on stove
  return {
    state: {
      ...state,
      prepBoard: [],
      stove: {
        status: 'cooking',
        recipeId: matchedRecipe.id,
        cookingProgress: 0,
        burnProgress: 0,
        elapsedSeconds: 0,
      },
    },
    success: true,
    message: `Started cooking ${matchedRecipe.name}!`,
  };
}

export function discardStove(state: GameState): GameState {
  return {
    ...state,
    stove: {
      status: 'empty',
      recipeId: null,
      cookingProgress: 0,
      burnProgress: 0,
      elapsedSeconds: 0,
    },
  };
}

export function findMatchingRecipe(ingredients: string[]): Recipe | null {
  if (ingredients.length === 0) return null;

  const sortedBoard = [...ingredients].sort();

  for (const recipe of Object.values(RECIPES)) {
    const sortedRequired = [...recipe.requiredIngredients].sort();
    if (sortedBoard.length === sortedRequired.length &&
        sortedBoard.every((val, index) => val === sortedRequired[index])) {
      return recipe;
    }
  }

  return null;
}

export interface ServeResult {
  state: GameState;
  success: boolean;
  servedRecipeName?: string;
  pointsEarned: number;
  tipEarned: number;
  message: string;
}

export function serveDish(state: GameState): ServeResult {
  if (state.status !== 'playing') {
    return { state, success: false, pointsEarned: 0, tipEarned: 0, message: 'Game is not playing' };
  }

  let readyRecipeId: string | null = null;
  let fromStove = false;

  // 1. Check if the stove has a READY dish
  if (state.stove.status === 'ready' && state.stove.recipeId) {
    readyRecipeId = state.stove.recipeId;
    fromStove = true;
  } else if (state.prepBoard.length > 0) {
    // 2. Check if prep board matches a cold/ready recipe
    const matched = findMatchingRecipe(state.prepBoard);
    if (matched) {
      if (matched.requiresCooking) {
        return {
          state,
          success: false,
          pointsEarned: 0,
          tipEarned: 0,
          message: `${matched.name} needs to be cooked on the stove first!`,
        };
      }
      readyRecipeId = matched.id;
    }
  }

  if (!readyRecipeId) {
    return {
      state,
      success: false,
      pointsEarned: 0,
      tipEarned: 0,
      message: 'No completed dish ready to serve! Check your ingredients.',
    };
  }

  const recipe = RECIPES[readyRecipeId];
  if (!recipe) {
    return { state, success: false, pointsEarned: 0, tipEarned: 0, message: 'Invalid recipe' };
  }

  // 3. Find first waiting ticket matching this recipe
  const ticketIndex = state.activeTickets.findIndex((t) => t.recipeId === readyRecipeId);
  if (ticketIndex === -1) {
    // No customer ordered this!
    return {
      state: {
        ...state,
        combo: 0, // Reset combo on wrong order
      },
      success: false,
      pointsEarned: 0,
      tipEarned: 0,
      message: `No customer ordered ${recipe.name}!`,
    };
  }

  const targetTicket = state.activeTickets[ticketIndex]!;
  
  // Calculate reward and speed tip
  const patienceRatio = targetTicket.currentPatience / targetTicket.totalPatience;
  const speedBonusMultiplier = patienceRatio > 0.6 ? 1.5 : patienceRatio > 0.3 ? 1.2 : 1.0;
  const vipMultiplier = targetTicket.isVIP ? 2.0 : 1.0;
  
  const newCombo = state.combo + 1;
  const comboMultiplier = 1.0 + (newCombo - 1) * 0.15; // +15% per combo
  
  const basePoints = recipe.baseReward;
  const tip = Math.round(basePoints * (speedBonusMultiplier - 1.0) * vipMultiplier);
  const totalEarned = Math.round((basePoints + tip) * comboMultiplier * vipMultiplier);

  // Remove ticket from active list
  const remainingTickets = [...state.activeTickets];
  remainingTickets.splice(ticketIndex, 1);

  // Clear prep board or empty stove
  let newStove = { ...state.stove };
  let newPrepBoard = [...state.prepBoard];
  if (fromStove) {
    newStove = {
      status: 'empty',
      recipeId: null,
      cookingProgress: 0,
      burnProgress: 0,
      elapsedSeconds: 0,
    };
  } else {
    newPrepBoard = [];
  }

  const nextState: GameState = {
    ...state,
    score: state.score + totalEarned,
    coins: state.coins + totalEarned,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
    ordersServed: state.ordersServed + 1,
    activeTickets: remainingTickets,
    prepBoard: newPrepBoard,
    stove: newStove,
  };

  return {
    state: nextState,
    success: true,
    servedRecipeName: recipe.name,
    pointsEarned: totalEarned,
    tipEarned: tip,
    message: `Served ${recipe.name}! +$${totalEarned} (${newCombo}x Combo!)`,
  };
}

export function updateEngineTick(
  state: GameState,
  deltaSeconds: number,
  config: ShiftConfig,
  timeSinceLastSpawn: number
): { state: GameState; newSpawnTimer: number; expiredTicketId?: string } {
  if (state.status !== 'playing') {
    return { state, newSpawnTimer: timeSinceLastSpawn };
  }

  // 1. Time Countdown
  const nextTimeRemaining = Math.max(0, state.timeRemaining - deltaSeconds);

  // 2. Update Stove
  let nextStove = { ...state.stove };
  if (nextStove.status === 'cooking' && nextStove.recipeId) {
    const recipe = RECIPES[nextStove.recipeId];
    if (recipe) {
      nextStove.elapsedSeconds += deltaSeconds;
      nextStove.cookingProgress = Math.min(1.0, nextStove.elapsedSeconds / recipe.cookTimeSeconds);

      if (nextStove.cookingProgress >= 1.0) {
        nextStove.status = 'ready';
        nextStove.elapsedSeconds = 0; // reset for burn timer
      }
    }
  } else if (nextStove.status === 'ready' && nextStove.recipeId) {
    const recipe = RECIPES[nextStove.recipeId];
    if (recipe) {
      nextStove.elapsedSeconds += deltaSeconds;
      nextStove.burnProgress = Math.min(1.0, nextStove.elapsedSeconds / recipe.burnTimeSeconds);

      if (nextStove.burnProgress >= 1.0) {
        nextStove.status = 'burnt';
      }
    }
  }

  // 3. Update Customer Ticket Patience
  let expiredTicketId: string | undefined;
  const updatedTickets: OrderTicket[] = [];
  let lostCount = state.ordersLost;
  let combo = state.combo;

  for (const ticket of state.activeTickets) {
    const remainingPatience = ticket.currentPatience - deltaSeconds;
    if (remainingPatience <= 0) {
      // Customer left unhappy!
      expiredTicketId = ticket.id;
      lostCount++;
      combo = 0; // Reset combo
    } else {
      updatedTickets.push({
        ...ticket,
        currentPatience: remainingPatience,
      });
    }
  }

  // 4. Spawn new tickets if needed
  let updatedSpawnTimer = timeSinceLastSpawn + deltaSeconds;
  if (updatedSpawnTimer >= config.ticketInterval && updatedTickets.length < config.maxActiveTickets && nextTimeRemaining > 5) {
    const newTicket = spawnCustomerTicket(state, config);
    if (newTicket) {
      updatedTickets.push(newTicket);
      updatedSpawnTimer = 0;
    }
  }

  // 5. Check Shift Win / Loss
  let nextStatus: GameState['status'] = state.status;
  let stars = state.stars;

  if (nextTimeRemaining <= 0) {
    if (state.score >= config.targetScore) {
      nextStatus = 'shift-won';
      const target = config.targetScore;
      if (state.score >= target * 1.5) {
        stars = 3;
      } else if (state.score >= target * 1.2) {
        stars = 2;
      } else {
        stars = 1;
      }
    } else {
      nextStatus = 'shift-lost';
      stars = 0;
    }
  }

  const nextState: GameState = {
    ...state,
    timeRemaining: nextTimeRemaining,
    activeTickets: updatedTickets,
    stove: nextStove,
    ordersLost: lostCount,
    combo,
    status: nextStatus,
    stars,
  };

  return {
    state: nextState,
    newSpawnTimer: updatedSpawnTimer,
    expiredTicketId,
  };
}

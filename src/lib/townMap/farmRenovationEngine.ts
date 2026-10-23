export type FarmElementId =
  | 'barn'
  | 'silo'
  | 'windmill'
  | 'mini-mart'
  | 'duck-pond'
  | 'dog-kennel'
  | 'cat-castle'
  | 'dairy-pasture'
  | 'sweet-mill';

export interface LevelTrackItem {
  levelNumber: number;
  unlocked: boolean;
  completed: boolean;
  stars: number; // 0, 1, 2, 3
  bestScore?: number;
}

export interface FarmBuildingRenovation {
  id: FarmElementId;
  name: string;
  gameTitle: string;
  gameId: string;
  gameRoute: string;
  mascot: string;
  repairStage: number; // 0 = Damaged/Broken, 1 = Restored (1-10), 2 = Expanded (11-20), 3 = Legendary (21-30)
  maxStage: number; // 3
  brokenVisual: {
    emoji: string;
    label: string;
    description: string;
    flaw: string;
  };
  stages: {
    stage: number;
    name: string;
    emoji: string;
    description: string;
    requiredBracket: string; // e.g. "Seviye 1-10"
    requiredStars: number; // e.g. 24
  }[];
  levels: LevelTrackItem[];
}

export interface FarmRenovationState {
  buildings: Record<FarmElementId, FarmBuildingRenovation>;
  totalStars: number;
  completedRenovations: number;
  lastUpdated: number;
}

const STORAGE_KEY = 'pawcade_farm_renovations_v1';

export const INITIAL_BUILDING_CONFIGS: Record<
  FarmElementId,
  {
    name: string;
    gameTitle: string;
    gameId: string;
    gameRoute: string;
    mascot: string;
    brokenVisual: {
      emoji: string;
      label: string;
      description: string;
      flaw: string;
    };
    stages: {
      stage: number;
      name: string;
      emoji: string;
      description: string;
      requiredBracket: string;
      requiredStars: number;
    }[];
  }
> = {
  barn: {
    name: 'Red Barn',
    gameTitle: 'Farm Tetris',
    gameId: 'farm-tetris',
    gameRoute: '/games/farm-tetris/',
    mascot: '🐮',
    brokenVisual: {
      emoji: '🏚️',
      label: 'Dilapidated Red Barn',
      description: 'Collapsed roof, cracked timbers, and fallen barn doors awaiting renovation.',
      flaw: '⚠️ Roof holes & broken planks!',
    },
    stages: [
      {
        stage: 1,
        name: 'Cozy Restored Barn',
        emoji: '🏠',
        description: 'Fresh red paint, weatherproof roof shingles, and clean hayloft!',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Expanded Dairy Barn',
        emoji: '🚜',
        description: 'Spacious stalls, brass milk jugs, and warm lantern lighting!',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Royal Heritage Barn Palace',
        emoji: '🏰',
        description: 'Golden rooster weathervane, flower boxes, and legendary barn monument!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  silo: {
    name: 'Harvest Silo',
    gameTitle: 'Farm Tetris',
    gameId: 'farm-tetris',
    gameRoute: '/games/farm-tetris/',
    mascot: '🌾',
    brokenVisual: {
      emoji: '📦',
      label: 'Rusty Broken Silo',
      description: 'Dented steel panels, tilted dome roof, and overgrown wild brambles.',
      flaw: '⚠️ Cracked steel shell & broken ladder!',
    },
    stages: [
      {
        stage: 1,
        name: 'Reinforced Steel Silo',
        emoji: '🏗️',
        description: 'Polished steel sheeting, sturdy safety ladder, and sealed grain bin.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Dual-Chamber Harvest Complex',
        emoji: '🎪',
        description: 'Automated grain conveyor and golden corn storage elevator.',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Grand Mega Granary Silo',
        emoji: '🏛️',
        description: 'Silver observatory dome and harvest chimes echoing across the valley!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  windmill: {
    name: 'Windmill',
    gameTitle: 'Flappy Chicken',
    gameId: 'flappy-chicken',
    gameRoute: '/games/flappy-chicken/',
    mascot: '🐔',
    brokenVisual: {
      emoji: '🪵',
      label: 'Broken-Vane Windmill',
      description: 'Shattered timber blades, jammed axle gear, and crumbling stone base.',
      flaw: '⚠️ Mill sails snapped & gears seized!',
    },
    stages: [
      {
        stage: 1,
        name: 'Spinning Timber Windmill',
        emoji: '💨',
        description: 'Fresh oak sails catching the meadow breeze with smooth grinding action.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Cobblestone Flour Mill',
        emoji: '🪶',
        description: 'Rustic stone masonry with cozy warm lanterns and grain chutes.',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Golden Crest Windmill',
        emoji: '✨',
        description: 'Vibrant festival banners and golden wheat sheaf sculpture at the summit!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'mini-mart': {
    name: 'Farm Mini Mart',
    gameTitle: 'Farm Mini Mart',
    gameId: 'farm-mini-mart',
    gameRoute: '/games/farm-mini-mart/',
    mascot: '🏪',
    brokenVisual: {
      emoji: '🧺',
      label: 'Boarded-Up Roadside Shack',
      description: 'Torn canvas awning, broken produce crates, and locked boarded windows.',
      flaw: '⚠️ Torn awning & shattered display shelves!',
    },
    stages: [
      {
        stage: 1,
        name: 'Charming Village Market',
        emoji: '🏪',
        description: 'Green-and-white striped awning with crates of fresh ripe farm goods!',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Countryside Supermarket',
        emoji: '🏬',
        description: 'Walk-in milk cooler, automated checkout, and friendly pup cashiers!',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Grand Agricultural Emporium',
        emoji: '🏛️',
        description: 'Neon storefront signage, polished cash registers, and artisan bakery!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'duck-pond': {
    name: 'Duck Pond',
    gameTitle: 'Duck Runner',
    gameId: 'duck-runner',
    gameRoute: '/games/duck-runner/',
    mascot: '🦆',
    brokenVisual: {
      emoji: '🌾',
      label: 'Muddy Stagnant Puddle',
      description: 'Drained basin, withered cattails, and collapsed wooden fishing dock.',
      flaw: '⚠️ Water drained & dock collapsed!',
    },
    stages: [
      {
        stage: 1,
        name: 'Sparkling Lilypad Pond',
        emoji: '🦆',
        description: 'Fresh spring water, emerald lilypads, and charming duck ramp pier.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Arched Bridge Lake Course',
        emoji: '🎃',
        description: 'Rustic wooden footbridge, koi fish, and glowing pumpkin lanterns.',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Swan Oasis & Marble Fountain',
        emoji: '✨',
        description: 'Illuminated fountains, swan paddleboats, and festival waterworks!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'dog-kennel': {
    name: 'Dog Kennel',
    gameTitle: 'Dog Parking',
    gameId: 'dog-parking',
    gameRoute: '/games/dog-parking/',
    mascot: '🐶',
    brokenVisual: {
      emoji: '🪵',
      label: 'Derelict Dog Kennel',
      description: 'Blown-off tin roof, fallen fence rails, and overturned water bowls.',
      flaw: '⚠️ Broken fences & missing roof!',
    },
    stages: [
      {
        stage: 1,
        name: 'Warm Wooden Doghouse',
        emoji: '🏡',
        description: 'Fleece dog beds, painted picket fences, and bone treat dispenser.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Agility Park & Paddock',
        emoji: '🐕‍🦺',
        description: 'Double-gated dog run, agility ramps, and shiny golden fire hydrant.',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Grand Canine Resort & Spa',
        emoji: '🏰',
        description: '5-star doggy hotel with bone-shaped pool and Mayor Dog statue!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'cat-castle': {
    name: 'Cat Castle',
    gameTitle: 'Cat Parking',
    gameId: 'cat-parking',
    gameRoute: '/games/cat-parking/',
    mascot: '🐱',
    brokenVisual: {
      emoji: '📦',
      label: 'Soggy Cardboard Box',
      description: 'Rain-soaked shredded cardboard box tangled in thorny briars.',
      flaw: '⚠️ Crushed box & damp nesting!',
    },
    stages: [
      {
        stage: 1,
        name: 'Cozy Cat Cottage',
        emoji: '☕',
        description: 'Sisal scratching posts, plush feather cushions, and fresh saucers of cream.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Victorian Feline Manor',
        emoji: '🐈‍⬛',
        description: 'Velvet climbing perches and rooftop moonlit observation balcony!',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Royal Cat Citadel',
        emoji: '👑',
        description: 'Gilded battlements and royal velvet cushion throne for monarch cats!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'dairy-pasture': {
    name: 'Dairy Pasture',
    gameTitle: 'Animal Farm Parking',
    gameId: 'animal-farm-parking',
    gameRoute: '/games/animal-farm-parking/',
    mascot: '🐮',
    brokenVisual: {
      emoji: '🪵',
      label: 'Muddy Overgrown Pasture',
      description: 'Fallen fence posts, rutted tractor mud tracks, and cracked feed troughs.',
      flaw: '⚠️ Fences fallen & tractor tracks flooded!',
    },
    stages: [
      {
        stage: 1,
        name: 'Clean Pasture Corral',
        emoji: '🏠',
        description: 'Fresh split-rail fences, crystal water troughs, and parking bay for Bessie.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Automated Milking Pasture',
        emoji: '🚜',
        description: 'Paved tractor lanes, stainless steel milk tankers, and watchtower.',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Golden Butter & Creamery Estate',
        emoji: '🥛',
        description: 'Award-winning ice cream parlor stand and gleaming golden cow bell monument!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
  'sweet-mill': {
    name: 'Sweet Mill',
    gameTitle: 'Farm Animal Match',
    gameId: 'pet-candy-crush',
    gameRoute: '/games/pet-candy-crush/',
    mascot: '🍬',
    brokenVisual: {
      emoji: '🪨',
      label: 'Cracked Stone Mill',
      description: 'Fractured grindstone, burst syrup piping, and abandoned candy press.',
      flaw: '⚠️ Cracked grindstone & burst pipes!',
    },
    stages: [
      {
        stage: 1,
        name: 'Fruit & Candy Press',
        emoji: '🍎',
        description: 'Baskets of fresh orchard apples and honeycomb syrup presses.',
        requiredBracket: 'Levels 1 - 10',
        requiredStars: 24,
      },
      {
        stage: 2,
        name: 'Waterwheel Confectionery',
        emoji: '🎡',
        description: 'Turning wooden waterwheel powering sparkling candy and jelly churns!',
        requiredBracket: 'Levels 11 - 20',
        requiredStars: 24,
      },
      {
        stage: 3,
        name: 'Rainbow Candy Palace',
        emoji: '🌟',
        description: 'Cascading sugar syrup waterfalls and shimmering candy cane spire!',
        requiredBracket: 'Levels 21 - 30',
        requiredStars: 24,
      },
    ],
  },
};

/**
 * Generates 30 levels for a building track (Level 1 unlocked by default)
 */
export function generateInitial30Levels(): LevelTrackItem[] {
  return Array.from({ length: 30 }, (_, index) => {
    const levelNumber = index + 1;
    return {
      levelNumber,
      unlocked: levelNumber === 1,
      completed: false,
      stars: 0,
      bestScore: 0,
    };
  });
}

/**
 * Reads state from LocalStorage or builds fresh state
 */
let memoryFarmState: FarmRenovationState | null = null;

export function resetFarmRenovationState(): FarmRenovationState {
  memoryFarmState = createDefaultFarmState();
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(memoryFarmState));
    } catch {}
  }
  return memoryFarmState;
}

export function getFarmRenovationState(): FarmRenovationState {
  if (typeof window === 'undefined') {
    if (!memoryFarmState) {
      memoryFarmState = createDefaultFarmState();
    }
    return memoryFarmState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as FarmRenovationState;
      if (parsed && parsed.buildings && parsed.buildings.barn) {
        memoryFarmState = parsed;
        return parsed;
      }
    }
  } catch {}

  const fresh = memoryFarmState || createDefaultFarmState();
  saveFarmRenovationState(fresh);
  return fresh;
}

export function saveFarmRenovationState(state: FarmRenovationState): void {
  state.lastUpdated = Date.now();
  memoryFarmState = state;
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function createDefaultFarmState(): FarmRenovationState {
  const buildingIds = Object.keys(INITIAL_BUILDING_CONFIGS) as FarmElementId[];
  const buildings = {} as Record<FarmElementId, FarmBuildingRenovation>;

  for (const id of buildingIds) {
    const config = INITIAL_BUILDING_CONFIGS[id]!;
    buildings[id] = {
      id,
      name: config.name,
      gameTitle: config.gameTitle,
      gameId: config.gameId,
      gameRoute: config.gameRoute,
      mascot: config.mascot,
      repairStage: 0, // Starts broken!
      maxStage: 3,
      brokenVisual: config.brokenVisual,
      stages: config.stages,
      levels: generateInitial30Levels(),
    };
  }

  return {
    buildings,
    totalStars: 0,
    completedRenovations: 0,
    lastUpdated: Date.now(),
  };
}

/**
 * Calculates total stars earned in a given level bracket (e.g. 1-10)
 */
export function getStarsInBracket(
  levels: LevelTrackItem[],
  startLevel: number,
  endLevel: number
): { earned: number; max: number; completedCount: number } {
  let earned = 0;
  let completedCount = 0;
  const count = endLevel - startLevel + 1;

  for (let l = startLevel; l <= endLevel; l++) {
    const item = levels[l - 1];
    if (item && item.completed) {
      earned += item.stars;
      completedCount++;
    }
  }

  return {
    earned,
    max: count * 3,
    completedCount,
  };
}

/**
 * Evaluates whether an upgrade proposal should trigger for a building
 */
export function checkUpgradeEligibility(
  building: FarmBuildingRenovation,
  tier: 1 | 2 | 3
): {
  eligible: boolean;
  tier: 1 | 2 | 3;
  starsEarned: number;
  requiredStars: number;
  completedLevels: number;
  requiredLevels: number;
  nextStage: number;
} {
  const startLevel = tier === 1 ? 1 : tier === 2 ? 11 : 21;
  const endLevel = tier === 1 ? 10 : tier === 2 ? 20 : 30;
  const requiredStars = 24; // 24 stars out of 30 in this 10-level bracket (80% threshold)
  const requiredLevels = 10;

  const bracket = getStarsInBracket(building.levels, startLevel, endLevel);
  // Eligible if all 10 levels are completed OR stars threshold met
  const eligible =
    building.repairStage < tier &&
    (bracket.completedCount >= requiredLevels || bracket.earned >= requiredStars);

  return {
    eligible,
    tier,
    starsEarned: bracket.earned,
    requiredStars,
    completedLevels: bracket.completedCount,
    requiredLevels,
    nextStage: tier,
  };
}

/**
 * Records a level win, unlocks next level, and recalculates stars
 */
export function recordLevelResult(
  buildingId: FarmElementId,
  levelNumber: number,
  stars: number,
  score: number = 0
): {
  state: FarmRenovationState;
  unlockedNextLevel: boolean;
  triggeredUpgradeTier: (1 | 2 | 3) | null;
} {
  const state = getFarmRenovationState();
  const building = state.buildings[buildingId];
  if (!building) {
    return { state, unlockedNextLevel: false, triggeredUpgradeTier: null };
  }

  const levelIdx = levelNumber - 1;
  if (levelIdx >= 0 && levelIdx < building.levels.length) {
    const current = building.levels[levelIdx]!;
    current.completed = true;
    current.stars = Math.max(current.stars, Math.min(3, Math.max(1, stars)));
    current.bestScore = Math.max(current.bestScore || 0, score);

    // Unlock next level
    let unlockedNext = false;
    if (levelNumber < building.levels.length) {
      building.levels[levelNumber]!.unlocked = true;
      unlockedNext = true;
    }

    // Check if milestone upgrade triggers
    let triggeredUpgradeTier: (1 | 2 | 3) | null = null;
    if (levelNumber <= 10 && building.repairStage < 1) {
      const check = checkUpgradeEligibility(building, 1);
      if (check.eligible) triggeredUpgradeTier = 1;
    } else if (levelNumber <= 20 && building.repairStage < 2) {
      const check = checkUpgradeEligibility(building, 2);
      if (check.eligible) triggeredUpgradeTier = 2;
    } else if (levelNumber <= 30 && building.repairStage < 3) {
      const check = checkUpgradeEligibility(building, 3);
      if (check.eligible) triggeredUpgradeTier = 3;
    }

    // Recalculate global stars
    let totalStars = 0;
    let completedRenovations = 0;
    for (const b of Object.values(state.buildings)) {
      completedRenovations += b.repairStage;
      for (const l of b.levels) {
        totalStars += l.stars;
      }
    }
    state.totalStars = totalStars;
    state.completedRenovations = completedRenovations;

    saveFarmRenovationState(state);
    return { state, unlockedNextLevel: unlockedNext, triggeredUpgradeTier };
  }

  return { state, unlockedNextLevel: false, triggeredUpgradeTier: null };
}

/**
 * Applies a building renovation upgrade (e.g. Broken -> Tier 1)
 */
export function applyBuildingUpgrade(
  buildingId: FarmElementId,
  targetStage: number
): FarmRenovationState {
  const state = getFarmRenovationState();
  const building = state.buildings[buildingId];
  if (building && targetStage > building.repairStage) {
    building.repairStage = Math.min(3, targetStage);

    let completedRenovations = 0;
    for (const b of Object.values(state.buildings)) {
      completedRenovations += b.repairStage;
    }
    state.completedRenovations = completedRenovations;

    saveFarmRenovationState(state);
  }
  return state;
}

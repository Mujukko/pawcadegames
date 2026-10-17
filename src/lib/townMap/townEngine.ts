import { BuildingId, TownBuilding, TownMapState, TownProsperity } from './types';
import { getCompletedLevels } from '../storage';

export const BUILDING_CONFIGS: Record<
  BuildingId,
  {
    name: string;
    gameId: string;
    gameTitle: string;
    gameRoute: string;
    category: 'pets' | 'farm' | 'arcade';
    mascot: string;
    metricLabel: string;
    stageRequirements: number[];
    coords: { x: number; y: number };
    stages: {
      stage: number;
      name: string;
      badge: string;
      description: string;
      visualEmoji: string;
      perk: string;
    }[];
  }
> = {
  'dog-kennel': {
    name: 'Canine Care Resort',
    gameId: 'dog-parking',
    gameTitle: 'Dog Parking',
    gameRoute: '/games/dog-parking/',
    category: 'pets',
    mascot: '🐶',
    metricLabel: 'Levels Solved',
    stageRequirements: [1, 4, 8],
    coords: { x: 18, y: 22 },
    stages: [
      {
        stage: 0,
        name: 'Empty Puppy Yard',
        badge: '0/1 Lot',
        description: 'An open grassy yard waiting for cute shelter pups.',
        visualEmoji: '🪵',
        perk: 'Unlocks building foundation',
      },
      {
        stage: 1,
        name: 'Sunny Puppy Kennel',
        badge: '1/3 Shelter',
        description: 'A cozy wooden doghouse with warm blankets & bone treats.',
        visualEmoji: '🏡',
        perk: '+10% Dog happiness score',
      },
      {
        stage: 2,
        name: 'Canine Lodge & Yard',
        badge: '2/3 Lodge',
        description: 'Multi-pen dog boarding lodge with doggy agility ramps!',
        visualEmoji: '🐕‍🦺',
        perk: 'Golden fire hydrant ornament',
      },
      {
        stage: 3,
        name: 'Grand Canine Palace',
        badge: '3/3 MAX',
        description: 'A luxury 5-star dog sanctuary with fountains and groomers!',
        visualEmoji: '🏰',
        perk: 'Legendary Dog Mayor Mascot',
      },
    ],
  },
  'duck-pond': {
    name: "Quacky's Pond & Track",
    gameId: 'duck-runner',
    gameTitle: 'Duck Runner',
    gameRoute: '/games/duck-runner/',
    category: 'arcade',
    mascot: '🦆',
    metricLabel: 'Best Score',
    stageRequirements: [100, 300, 600],
    coords: { x: 50, y: 18 },
    stages: [
      {
        stage: 0,
        name: 'Muddy Creek',
        badge: '0/1 Creek',
        description: 'A wild creek where Quacky practices hopping over twigs.',
        visualEmoji: '🌾',
        perk: 'Basic running trail',
      },
      {
        stage: 1,
        name: 'Duckling Lily Pond',
        badge: '1/3 Pond',
        description: 'Sparkling freshwater pond with green lilypads and reeds.',
        visualEmoji: '🦆',
        perk: 'Daytime milestone chimes',
      },
      {
        stage: 2,
        name: 'Autumn Twilight Track',
        badge: '2/3 Track',
        description: 'Smooth cobblestone track with pumpkin lanterns and wooden bridges.',
        visualEmoji: '🎃',
        perk: 'Harvest full moon view',
      },
      {
        stage: 3,
        name: 'Vampire Duck Oasis',
        badge: '3/3 MAX',
        description: 'Enchanted lake with glowing night fountains & fireworks!',
        visualEmoji: '✨',
        perk: 'Golden Witch Trophy',
      },
    ],
  },
  'cat-castle': {
    name: 'Feline Purr Castle',
    gameId: 'cat-parking',
    gameTitle: 'Cat Parking',
    gameRoute: '/games/cat-parking/',
    category: 'pets',
    mascot: '🐱',
    metricLabel: 'Levels Solved',
    stageRequirements: [1, 4, 8],
    coords: { x: 82, y: 22 },
    stages: [
      {
        stage: 0,
        name: 'Cardboard Box Corner',
        badge: '0/1 Box',
        description: 'A simple cardboard box where sleepy kitties nap.',
        visualEmoji: '📦',
        perk: 'Kitty nap corner',
      },
      {
        stage: 1,
        name: 'Cozy Cat Cafe',
        badge: '1/3 Cafe',
        description: 'Charming sunlit tearoom with scratching posts and milk saucers.',
        visualEmoji: '☕',
        perk: 'Warm fireplace cushions',
      },
      {
        stage: 2,
        name: 'Multi-Tier Cat Manor',
        badge: '2/3 Manor',
        description: 'A 2-story Victorian manor with velvet towers and dangling toys!',
        visualEmoji: '🐈‍⬛',
        perk: 'Luna the Star Cat VIP Room',
      },
      {
        stage: 3,
        name: 'Grand Feline Citadel',
        badge: '3/3 MAX',
        description: 'Majestic castle with golden towers and a rooftop observation deck!',
        visualEmoji: '👑',
        perk: 'Royal Velvet Cat Throne',
      },
    ],
  },
  'sugar-mill': {
    name: 'Barnyard Sweet Mill',
    gameId: 'pet-candy-crush',
    gameTitle: 'Farm Animal Match',
    gameRoute: '/games/pet-candy-crush/',
    category: 'farm',
    mascot: '🍬',
    metricLabel: 'Levels Cleared',
    stageRequirements: [1, 3, 6],
    coords: { x: 18, y: 50 },
    stages: [
      {
        stage: 0,
        name: 'Old Sugar Press',
        badge: '0/1 Press',
        description: 'A modest stone grinder waiting for sweet cane harvests.',
        visualEmoji: '🪨',
        perk: 'Basic candy press',
      },
      {
        stage: 1,
        name: 'Honey & Apple Orchard',
        badge: '1/3 Orchard',
        description: 'Fragrant fruit trees and beehives producing clover honey.',
        visualEmoji: '🍎',
        perk: 'Dynamite candy recipe',
      },
      {
        stage: 2,
        name: 'Waterwheel Candy Mill',
        badge: '2/3 Mill',
        description: 'Rotating wooden waterwheel grinding candy drops into jars.',
        visualEmoji: '🎡',
        perk: 'Mega Crater explosion vat',
      },
      {
        stage: 3,
        name: 'Grand Barnyard Confectionery',
        badge: '3/3 MAX',
        description: 'A spectacular candy palace with rainbow star syrup fountains!',
        visualEmoji: '🌟',
        perk: 'Infinite Sweet Harvest Celebration',
      },
    ],
  },
  'farm-supermarket': {
    name: 'Town Central Mini Mart',
    gameId: 'farm-mini-mart',
    gameTitle: 'Farm Mini Mart',
    gameRoute: '/games/farm-mini-mart/',
    category: 'farm',
    mascot: '🏪',
    metricLabel: 'Coins Earned',
    stageRequirements: [40, 150, 400],
    coords: { x: 50, y: 50 },
    stages: [
      {
        stage: 0,
        name: 'Roadside Produce Stand',
        badge: '0/1 Stand',
        description: 'A simple wooden crate selling fresh backyard tomatoes.',
        visualEmoji: '🧺',
        perk: 'Basic cash drawer',
      },
      {
        stage: 1,
        name: 'Country Mini Mart',
        badge: '1/3 Mart',
        description: 'A cute neighborhood grocery shop with multiple veggie reyon racks.',
        visualEmoji: '🏪',
        perk: 'Egg & corn shelf unlocked',
      },
      {
        stage: 2,
        name: 'Barnyard Supermarket',
        badge: '2/3 Market',
        description: 'Expanded market hall with dairy coolers and helper dog staff!',
        visualEmoji: '🏬',
        perk: 'Automated Cashier desk',
      },
      {
        stage: 3,
        name: 'Grand Agricultural Emporium',
        badge: '3/3 MAX',
        description: 'The pinnacle of rural commerce with gold registers and gourmet bakery!',
        visualEmoji: '🏛️',
        perk: 'Town Prosperity Hub',
      },
    ],
  },
  'safari-sanctuary': {
    name: 'Wild Evolution Safari',
    gameId: 'animal-2048',
    gameTitle: 'Animal 2048',
    gameRoute: '/games/animal-2048/',
    category: 'pets',
    mascot: '🐘',
    metricLabel: 'Highest Animal',
    stageRequirements: [32, 512, 2048],
    coords: { x: 82, y: 50 },
    stages: [
      {
        stage: 0,
        name: 'Little Meadow Patch',
        badge: '0/1 Meadow',
        description: 'A cozy clearing where tiny mice and hamsters scurry.',
        visualEmoji: '🐭',
        perk: 'Small critter burrow',
      },
      {
        stage: 1,
        name: 'Woodland Wildlife Park',
        badge: '1/3 Forest',
        description: 'Tall pine groves harboring bunnies, foxes, and spotted deer.',
        visualEmoji: '🦊',
        perk: 'Brass trumpet audio chime',
      },
      {
        stage: 2,
        name: 'Grand Savanna Reserve',
        badge: '2/3 Savanna',
        description: 'Sprawling grasslands hosting boars, grizzly bears, and rhinos!',
        visualEmoji: '🦏',
        perk: 'Undo history crystal',
      },
      {
        stage: 3,
        name: 'Mammoth Elephant Kingdom',
        badge: '3/3 MAX',
        description: 'Legendary sanctuary crowned by the royal Elephant and Blue Whale!',
        visualEmoji: '👑',
        perk: 'Golden Elephant Monument',
      },
    ],
  },
  'dairy-barn': {
    name: "Bessie's Dairy Barn",
    gameId: 'animal-farm-parking',
    gameTitle: 'Animal Farm Parking',
    gameRoute: '/games/animal-farm-parking/',
    category: 'farm',
    mascot: '🐮',
    metricLabel: 'Levels Completed',
    stageRequirements: [1, 3, 6],
    coords: { x: 18, y: 78 },
    stages: [
      {
        stage: 0,
        name: 'Open Cow Paddock',
        badge: '0/1 Paddock',
        description: 'Fenced pasture where Bessie practices precision steering.',
        visualEmoji: '🪵',
        perk: 'Basic parking stall',
      },
      {
        stage: 1,
        name: 'Red Gambrel Barn',
        badge: '1/3 Barn',
        description: 'Traditional crimson barn with hay lofts and milk collection bottles.',
        visualEmoji: '🏠',
        perk: 'Milk bottle chime tracker',
      },
      {
        stage: 2,
        name: 'Modernized Dairy Complex',
        badge: '2/3 Dairy',
        description: 'Automated milking stalls, paved tractor lanes, and sheep patrols!',
        visualEmoji: '🚜',
        perk: 'Smooth wall-sliding fenders',
      },
      {
        stage: 3,
        name: 'Bessie Supreme Creamery',
        badge: '3/3 MAX',
        description: 'Award-winning dairy farm producing the finest butter and ice cream!',
        visualEmoji: '🥛',
        perk: 'Golden Cowbell Fanfare',
      },
    ],
  },
  'windmill-flight': {
    name: "Clucky's Windmill Field",
    gameId: 'flappy-chicken',
    gameTitle: 'Flappy Chicken',
    gameRoute: '/games/flappy-chicken/',
    category: 'arcade',
    mascot: '🐔',
    metricLabel: 'Gates Cleared',
    stageRequirements: [3, 8, 15],
    coords: { x: 50, y: 82 },
    stages: [
      {
        stage: 0,
        name: 'Rustic Farm Gate',
        badge: '0/1 Gate',
        description: 'A single wooden gate where Clucky first flaps her wings.',
        visualEmoji: '🪵',
        perk: 'Feather particle trail',
      },
      {
        stage: 1,
        name: 'Golden Windmill',
        badge: '1/3 Windmill',
        description: 'A traditional timber windmill turning gently in the prairie breeze.',
        visualEmoji: '💨',
        perk: 'Golden grain seeds',
      },
      {
        stage: 2,
        name: 'Flight Aviary & Course',
        badge: '2/3 Aviary',
        description: 'An obstacle course lined with festive pennants and nesting perches!',
        visualEmoji: '🪶',
        perk: 'Cartoon cluck synthesizer boost',
      },
      {
        stage: 3,
        name: 'Golden Wheat Granary Citadel',
        badge: '3/3 MAX',
        description: 'The legendary granary overflowing with golden grain for eternity!',
        visualEmoji: '🌾',
        perk: 'Permanent Golden Wheat Fanfare',
      },
    ],
  },
  'hay-silo': {
    name: 'Harvest Silo Tower',
    gameId: 'farm-tetris',
    gameTitle: 'Farm Tetris',
    gameRoute: '/games/farm-tetris/',
    category: 'farm',
    mascot: '🌾',
    metricLabel: 'Harvest Score',
    stageRequirements: [200, 800, 2000],
    coords: { x: 82, y: 78 },
    stages: [
      {
        stage: 0,
        name: 'Hay Stacking Pad',
        badge: '0/1 Pad',
        description: 'Wooden pallets where fresh crop crates are placed.',
        visualEmoji: '📦',
        perk: 'Manual drop controls',
      },
      {
        stage: 1,
        name: 'Timber Silo Tower',
        badge: '1/3 Silo',
        description: 'Stave-wood silo storing golden hay and harvest bushels.',
        visualEmoji: '🏗️',
        perk: 'Farmer WOW reaction dome',
      },
      {
        stage: 2,
        name: '3D Steel Hoop Silo',
        badge: '2/3 Silo',
        description: 'Architectural red silo with steel dome, ladder, and flying straws!',
        visualEmoji: '🎪',
        perk: 'Super Harvest Tetris bonus',
      },
      {
        stage: 3,
        name: 'Grand Agricultural Megasilo',
        badge: '3/3 MAX',
        description: 'Towering grain complex with harvest bells and automated conveyors!',
        visualEmoji: '🏰',
        perk: 'Infinite Silo Fill Gauge',
      },
    ],
  },
};

/**
 * Reads real progress from localStorage or fallback state
 */
export function getMetricForBuilding(buildingId: BuildingId): number {
  if (typeof window === 'undefined') return 0;

  try {
    switch (buildingId) {
      case 'dog-kennel': {
        const completed = getCompletedLevels('dog-parking');
        return Object.values(completed).filter((l) => l.completed).length;
      }
      case 'cat-castle': {
        const completed = getCompletedLevels('cat-parking');
        return Object.values(completed).filter((l) => l.completed).length;
      }
      case 'dairy-barn': {
        const completed = getCompletedLevels('animal-farm-parking');
        return Object.values(completed).filter((l) => l.completed).length;
      }
      case 'duck-pond': {
        const raw = localStorage.getItem('pawcade_duck_runner_high_score');
        return raw ? parseInt(raw, 10) || 0 : 0;
      }
      case 'hay-silo': {
        const raw = localStorage.getItem('pawcade_farm_tetris_highscore');
        return raw ? parseInt(raw, 10) || 0 : 0;
      }
      case 'windmill-flight': {
        const raw = localStorage.getItem('pawcade_flappy_chicken_best');
        return raw ? parseInt(raw, 10) || 0 : 0;
      }
      case 'safari-sanctuary': {
        const raw = localStorage.getItem('pawcade_animal_2048_highest_tier');
        return raw ? parseInt(raw, 10) || 0 : 0;
      }
      case 'sugar-mill': {
        const raw = localStorage.getItem('pawcade_farm_crush_unlocked_level');
        const unlockedLvl = raw ? parseInt(raw, 10) || 1 : 1;
        return Math.max(0, unlockedLvl - 1); // levels cleared
      }
      case 'farm-supermarket': {
        const raw = localStorage.getItem('pawcade_farm_mini_mart_save_v1');
        if (raw) {
          const parsed = JSON.parse(raw);
          return Number(parsed.totalEarned) || Number(parsed.coins) || 0;
        }
        return 0;
      }
      default:
        return 0;
    }
  } catch {
    return 0;
  }
}

/**
 * Calculates building stage (0 to 3) based on metric and requirements
 */
export function calculateBuildingStage(
  currentMetric: number,
  requirements: number[]
): {
  stage: number;
  progressRatio: string;
  progressPercent: number;
  nextRequirement: number | null;
  remaining: number;
} {
  const [req1 = 1, req2 = 4, req3 = 8] = requirements;

  if (currentMetric >= req3) {
    return {
      stage: 3,
      progressRatio: '3/3 MAX',
      progressPercent: 100,
      nextRequirement: null,
      remaining: 0,
    };
  }

  if (currentMetric >= req2) {
    const range = req3 - req2;
    const current = currentMetric - req2;
    const pct = Math.min(99, Math.floor((current / range) * 100));
    return {
      stage: 2,
      progressRatio: '2/3',
      progressPercent: Math.max(0, pct),
      nextRequirement: req3,
      remaining: req3 - currentMetric,
    };
  }

  if (currentMetric >= req1) {
    const range = req2 - req1;
    const current = currentMetric - req1;
    const pct = Math.min(99, Math.floor((current / range) * 100));
    return {
      stage: 1,
      progressRatio: '1/3',
      progressPercent: Math.max(0, pct),
      nextRequirement: req2,
      remaining: req2 - currentMetric,
    };
  }

  // Stage 0 (Empty plot waiting for first completion)
  const pct = Math.min(99, Math.floor((currentMetric / req1) * 100));
  return {
    stage: 0,
    progressRatio: '0/1',
    progressPercent: Math.max(0, pct),
    nextRequirement: req1,
    remaining: req1 - currentMetric,
  };
}

/**
 * Returns overall town prosperity level and title
 */
export function calculateTownProsperity(buildings: TownBuilding[]): TownProsperity {
  const totalStars = buildings.reduce((acc, b) => acc + b.currentStage, 0);
  const maxStars = buildings.length * 3; // 9 * 3 = 27
  const percent = Math.min(100, Math.floor((totalStars / maxStars) * 100));

  let townLevel = 1;
  let townTitle = 'Quiet Rural Clearing 🌾';
  let nextLevelStars: number | null = 6;

  if (totalStars >= 24) {
    townLevel = 5;
    townTitle = 'Golden Animal Utopia 🌟🏰';
    nextLevelStars = null;
  } else if (totalStars >= 18) {
    townLevel = 4;
    townTitle = 'Thriving Animal Metropolis 🏛️✨';
    nextLevelStars = 24;
  } else if (totalStars >= 12) {
    townLevel = 3;
    townTitle = 'Prosperous Pet County 🚜🏡';
    nextLevelStars = 18;
  } else if (totalStars >= 6) {
    townLevel = 2;
    townTitle = 'Happy Animal Village 🏘️🐶';
    nextLevelStars = 12;
  }

  return {
    totalStars,
    maxStars,
    percent,
    townLevel,
    townTitle,
    nextLevelStars,
  };
}

/**
 * Builds the complete Town Map State
 */
export function getTownMapState(metricOverrides?: Partial<Record<BuildingId, number>>): TownMapState {
  const buildingIds = Object.keys(BUILDING_CONFIGS) as BuildingId[];

  const buildings: TownBuilding[] = buildingIds.map((id) => {
    const config = BUILDING_CONFIGS[id]!;
    const metric =
      metricOverrides && typeof metricOverrides[id] === 'number'
        ? metricOverrides[id]!
        : getMetricForBuilding(id);

    const { stage, progressRatio, progressPercent, nextRequirement, remaining } =
      calculateBuildingStage(metric, config.stageRequirements);

    return {
      id,
      name: config.name,
      gameId: config.gameId,
      gameTitle: config.gameTitle,
      gameRoute: config.gameRoute,
      category: config.category,
      mascot: config.mascot,
      currentStage: stage,
      maxStage: 3,
      metricLabel: config.metricLabel,
      currentMetric: metric,
      stageRequirements: config.stageRequirements,
      progressRatio,
      progressPercent,
      nextStageRequirement: nextRequirement,
      metricRemaining: remaining,
      stages: config.stages,
      mapCoords: config.coords,
    };
  });

  const prosperity = calculateTownProsperity(buildings);

  return {
    buildings,
    prosperity,
    lastUpdated: Date.now(),
  };
}

export type AnimalSpecies =
  | 'corgi'
  | 'capybara'
  | 'cow'
  | 'chicken'
  | 'pig'
  | 'duck'
  | 'sheep'
  | 'llama'
  | 'golden_goose';

export interface AnimalConfig {
  id: AnimalSpecies;
  name: string;
  emoji: string;
  soundName: string;
  produceName: string;
  produceEmoji: string;
  unlockThreshold: number; // Total lifetime produce needed to unlock
  colorScheme: {
    bg: string;
    border: string;
    glow: string;
  };
}

export interface ClickUpgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  powerBonus: number;
  level: number;
  emoji: string;
}

export interface IdleBuilding {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  basePps: number; // produce per second
  count: number;
  emoji: string;
}

export interface HatAccessory {
  id: string;
  name: string;
  emoji: string;
  cost: number;
  clickMultiplier: number; // e.g. 1.1x = +10%
  unlocked: boolean;
}

export interface GoldenEvent {
  active: boolean;
  x: number; // 0 - 100% viewport position
  y: number; // 0 - 100% viewport position
  durationRemainingMs: number;
  frenzyActive: boolean;
  frenzyRemainingMs: number;
}

export interface ClickerState {
  produce: number;
  lifetimeProduce: number;
  selectedAnimal: AnimalSpecies;
  clickUpgrades: Record<string, ClickUpgrade>;
  buildings: Record<string, IdleBuilding>;
  hats: Record<string, HatAccessory>;
  equippedHat: string | null;
  goldenEvent: GoldenEvent;
  lastTickTimestamp: number;
  totalClicks: number;
}

export const ANIMALS: Record<AnimalSpecies, AnimalConfig> = {
  corgi: {
    id: 'corgi',
    name: 'Sunny the Corgi',
    emoji: '🐶',
    soundName: 'bark',
    produceName: 'Puppy Pats',
    produceEmoji: '🐾',
    unlockThreshold: 0,
    colorScheme: {
      bg: '#ffedd5',
      border: '#ea580c',
      glow: '#fb923c',
    },
  },
  capybara: {
    id: 'capybara',
    name: 'Chill Capybara',
    emoji: '🦫',
    soundName: 'purr',
    produceName: 'Citrus Slices',
    produceEmoji: '🍊',
    unlockThreshold: 1000,
    colorScheme: {
      bg: '#fef3c7',
      border: '#d97706',
      glow: '#f59e0b',
    },
  },
  cow: {
    id: 'cow',
    name: 'Bessie the Dairy Cow',
    emoji: '🐮',
    soundName: 'moo',
    produceName: 'Fresh Milk',
    produceEmoji: '🥛',
    unlockThreshold: 25000,
    colorScheme: {
      bg: '#e0f2fe',
      border: '#0284c7',
      glow: '#38bdf8',
    },
  },
  chicken: {
    id: 'chicken',
    name: 'Clucky the Hen',
    emoji: '🐔',
    soundName: 'cluck',
    produceName: 'Golden Eggs',
    produceEmoji: '🥚',
    unlockThreshold: 100000,
    colorScheme: {
      bg: '#fef9c3',
      border: '#ca8a04',
      glow: '#eab308',
    },
  },
  pig: {
    id: 'pig',
    name: 'Penny the Piglet',
    emoji: '🐷',
    soundName: 'oink',
    produceName: 'Forest Truffles',
    produceEmoji: '🍄',
    unlockThreshold: 500000,
    colorScheme: {
      bg: '#ffe4e6',
      border: '#e11d48',
      glow: '#fb7185',
    },
  },
  duck: {
    id: 'duck',
    name: 'Quacky the Mallard',
    emoji: '🦆',
    soundName: 'quack',
    produceName: 'Rainbow Feathers',
    produceEmoji: '🪶',
    unlockThreshold: 2500000,
    colorScheme: {
      bg: '#ccfbf1',
      border: '#0d9488',
      glow: '#2dd4bf',
    },
  },
  sheep: {
    id: 'sheep',
    name: 'Woolly the Merino Sheep',
    emoji: '🐑',
    soundName: 'baa',
    produceName: 'Fluffy Cashmere',
    produceEmoji: '🧶',
    unlockThreshold: 15000000,
    colorScheme: {
      bg: '#ede9fe',
      border: '#7c3aed',
      glow: '#a78bfa',
    },
  },
  llama: {
    id: 'llama',
    name: 'Paco the Highland Llama',
    emoji: '🦙',
    soundName: 'hum',
    produceName: 'Mystic Ponchos',
    produceEmoji: '🧣',
    unlockThreshold: 80000000,
    colorScheme: {
      bg: '#fae8ff',
      border: '#c026d3',
      glow: '#e879f9',
    },
  },
  golden_goose: {
    id: 'golden_goose',
    name: 'Honk the Mythic Goose',
    emoji: '🪿',
    soundName: 'honk',
    produceName: 'Fabergé Eggs',
    produceEmoji: '🪺',
    unlockThreshold: 400000000,
    colorScheme: {
      bg: '#fef08a',
      border: '#b45309',
      glow: '#facc15',
    },
  },
};

export const INITIAL_CLICK_UPGRADES: ClickUpgrade[] = [
  {
    id: 'farmer_gloves',
    name: 'Farmer Gloves',
    description: '+1 per click',
    baseCost: 15,
    costMultiplier: 1.15,
    powerBonus: 1,
    level: 0,
    emoji: '🧤',
  },
  {
    id: 'grooming_brush',
    name: 'Soft Grooming Brush',
    description: '+5 per click',
    baseCost: 100,
    costMultiplier: 1.15,
    powerBonus: 5,
    level: 0,
    emoji: '🪥',
  },
  {
    id: 'clover_treats',
    name: 'Sweet Clover Treats',
    description: '+25 per click',
    baseCost: 1100,
    costMultiplier: 1.15,
    powerBonus: 25,
    level: 0,
    emoji: '🍀',
  },
  {
    id: 'magic_whistle',
    name: 'Golden Shepherd Whistle',
    description: '+100 per click',
    baseCost: 12000,
    costMultiplier: 1.15,
    powerBonus: 100,
    level: 0,
    emoji: '🪈',
  },
  {
    id: 'golden_horseshoe',
    name: 'Enchanted Horseshoe',
    description: '+500 per click',
    baseCost: 130000,
    costMultiplier: 1.15,
    powerBonus: 500,
    level: 0,
    emoji: '🧲',
  },
  {
    id: 'crystal_comb',
    name: 'Crystal Fur Comb',
    description: '+3,000 per click',
    baseCost: 1500000,
    costMultiplier: 1.15,
    powerBonus: 3000,
    level: 0,
    emoji: '💎',
  },
  {
    id: 'quantum_whistle',
    name: 'Quantum Shepherd Horn',
    description: '+18,000 per click',
    baseCost: 16000000,
    costMultiplier: 1.15,
    powerBonus: 18000,
    level: 0,
    emoji: '📯',
  },
  {
    id: 'celestial_touch',
    name: 'Celestial Midas Touch',
    description: '+120,000 per click',
    baseCost: 180000000,
    costMultiplier: 1.15,
    powerBonus: 120000,
    level: 0,
    emoji: '✨',
  },
];

export const INITIAL_BUILDINGS: IdleBuilding[] = [
  {
    id: 'patting_hand',
    name: 'Automatic Pat Hand',
    description: 'A gentle mechanical hand patting your pet',
    baseCost: 20,
    costMultiplier: 1.15,
    basePps: 1,
    count: 0,
    emoji: '👋',
  },
  {
    id: 'farmhand_dog',
    name: 'Helper Puppy',
    description: 'An eager pup collecting pasture treats',
    baseCost: 100,
    costMultiplier: 1.15,
    basePps: 5,
    count: 0,
    emoji: '🐕',
  },
  {
    id: 'feed_trough',
    name: 'Automated Feed Trough',
    description: 'Keep critters happily nourished',
    baseCost: 1100,
    costMultiplier: 1.15,
    basePps: 32,
    count: 0,
    emoji: '🥣',
  },
  {
    id: 'tractor_harvester',
    name: 'Harvest Tractor',
    description: 'Scooping up produce by the wagonload',
    baseCost: 12000,
    costMultiplier: 1.15,
    basePps: 260,
    count: 0,
    emoji: '🚜',
  },
  {
    id: 'golden_windmill',
    name: 'Prairie Windmill',
    description: 'Wind-powered automated farm machinery',
    baseCost: 130000,
    costMultiplier: 1.15,
    basePps: 1400,
    count: 0,
    emoji: '💨',
  },
  {
    id: 'mega_silo',
    name: 'Grand Harvest Silo',
    description: 'Massive automated crop & treat silo',
    baseCost: 1400000,
    costMultiplier: 1.15,
    basePps: 7800,
    count: 0,
    emoji: '🏰',
  },
  {
    id: 'biogas_reactor',
    name: 'Eco Bio-Gas Plant',
    description: 'High-tech eco pasture green energy',
    baseCost: 15000000,
    costMultiplier: 1.15,
    basePps: 45000,
    count: 0,
    emoji: '⚡',
  },
  {
    id: 'solar_combine',
    name: 'Autonomous Solar Harvester',
    description: 'Self-driving solar combine swarm',
    baseCost: 160000000,
    costMultiplier: 1.15,
    basePps: 280000,
    count: 0,
    emoji: '🛰️',
  },
  {
    id: 'cosmic_barn_portal',
    name: 'Cosmic Farm Portal',
    description: 'Interdimensional portal delivering galactic treats',
    baseCost: 1800000000,
    costMultiplier: 1.15,
    basePps: 1800000,
    count: 0,
    emoji: '🌌',
  },
];

export const INITIAL_HATS: HatAccessory[] = [
  {
    id: 'straw_hat',
    name: 'Straw Farmer Hat',
    emoji: '🌾',
    cost: 500,
    clickMultiplier: 1.1,
    unlocked: false,
  },
  {
    id: 'party_crown',
    name: 'Golden Party Crown',
    emoji: '👑',
    cost: 5000,
    clickMultiplier: 1.25,
    unlocked: false,
  },
  {
    id: 'cool_shades',
    name: 'Pasture Sunglasses',
    emoji: '🕶️',
    cost: 50000,
    clickMultiplier: 1.5,
    unlocked: false,
  },
  {
    id: 'witch_hat',
    name: 'Witch Wizard Hat',
    emoji: '🧙',
    cost: 500000,
    clickMultiplier: 2.0,
    unlocked: false,
  },
  {
    id: 'diamond_tiara',
    name: 'Royal Diamond Tiara',
    emoji: '💎',
    cost: 5000000,
    clickMultiplier: 3.0,
    unlocked: false,
  },
  {
    id: 'space_helmet',
    name: 'Cosmic Astro Helmet',
    emoji: '🧑‍🚀',
    cost: 50000000,
    clickMultiplier: 5.0,
    unlocked: false,
  },
];

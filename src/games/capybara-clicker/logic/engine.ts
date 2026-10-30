import {
  CapybaraClickerState,
  CapybaraSkin,
  ProducerConfig,
  UpgradeConfig,
  WeatherType,
} from './types';

export const PRODUCERS: ProducerConfig[] = [
  {
    id: 'guinea-pig',
    name: 'Guinea Pig Pal',
    icon: '🐹',
    baseCost: 15,
    baseCps: 1,
    desc: 'Friendly rodent buddy who gently squeaks for +1 capy/sec.',
  },
  {
    id: 'yuzu-bath',
    name: 'Warm Yuzu Bath',
    icon: '🍊',
    baseCost: 100,
    baseCps: 5,
    desc: 'Floating citrus tubs that soothe capybaras for +5 capy/sec.',
  },
  {
    id: 'citrus-grove',
    name: 'Citrus Tree Grove',
    icon: '🌳',
    baseCost: 1100,
    baseCps: 32,
    desc: 'Shady orchard dropping ripe yuzus for +32 capy/sec.',
  },
  {
    id: 'onsen-resort',
    name: 'Hot Spring Resort',
    icon: '♨️',
    baseCost: 12000,
    baseCps: 260,
    desc: 'Natural geothermal onsen resort attracting +260 capy/sec.',
  },
  {
    id: 'capy-temple',
    name: 'Capybara Temple',
    icon: '⛩️',
    baseCost: 130000,
    baseCps: 1400,
    desc: 'Ancient sanctuary honoring noble capybaras for +1,400 capy/sec.',
  },
  {
    id: 'sun-sanctuary',
    name: 'Golden Sun Sanctuary',
    icon: '☀️',
    baseCost: 1400000,
    baseCps: 7800,
    desc: 'Utopian solar meadow bathed in light for +7,800 capy/sec.',
  },
];

export const UPGRADES: UpgradeConfig[] = [
  {
    id: 'soft-sponge',
    name: 'Bamboo Sponge',
    icon: '🧽',
    cost: 100,
    multiplier: 2,
    desc: 'Gentle scrubbing doubles click power (2x)!',
  },
  {
    id: 'golden-brush',
    name: 'Golden Brush',
    icon: '✨',
    cost: 1000,
    multiplier: 3,
    desc: 'Bristles imbued with amber shine triple click power (3x)!',
  },
  {
    id: 'royal-towel',
    name: 'Silk Royal Towel',
    icon: '👑',
    cost: 25000,
    multiplier: 5,
    desc: 'Luxury drying towel supercharges clicks by 5x!',
  },
  {
    id: 'celestial-comb',
    name: 'Celestial Comb',
    icon: '🌟',
    cost: 500000,
    multiplier: 10,
    desc: 'Starry groomer elevates your tap force by 10x!',
  },
];

export const SKINS: CapybaraSkin[] = [
  { id: 'classic', name: 'Chill Natural', unlockedAt: 0, accessory: 'none' },
  { id: 'yuzu', name: 'Yuzu Crown', unlockedAt: 100, accessory: 'yuzu' },
  { id: 'cool', name: 'Cool Shades', unlockedAt: 1000, accessory: 'sunglasses' },
  { id: 'gentleman', name: 'Gentleman Capy', unlockedAt: 10000, accessory: 'tophat' },
  { id: 'emperor', name: 'Golden King', unlockedAt: 100000, accessory: 'crown' },
];

export const WEATHERS: WeatherType[] = ['sunny', 'blossom', 'mist', 'golden'];

export function createInitialState(now = Date.now()): CapybaraClickerState {
  return {
    capybaras: 0,
    totalEarned: 0,
    clickPower: 1,
    producers: {
      'guinea-pig': 0,
      'yuzu-bath': 0,
      'citrus-grove': 0,
      'onsen-resort': 0,
      'capy-temple': 0,
      'sun-sanctuary': 0,
    },
    upgrades: [],
    selectedSkin: 'classic',
    unlockedSkins: ['classic'],
    weather: 'sunny',
    lastSaveTimestamp: now,
    stats: {
      totalClicks: 0,
      manualCapybaras: 0,
      passiveCapybaras: 0,
    },
  };
}

/** Cost increases by 15% per existing producer owned */
export function calculateProducerCost(baseCost: number, count: number): number {
  return Math.floor(baseCost * Math.pow(1.15, count));
}

/** Calculates total capybaras per second produced passively */
export function calculateCps(producers: Record<string, number>): number {
  let total = 0;
  for (const p of PRODUCERS) {
    const count = producers[p.id] || 0;
    total += count * p.baseCps;
  }
  return total;
}

/** Calculates click power based on purchased upgrades */
export function calculateClickPower(upgrades: string[]): number {
  let power = 1;
  for (const u of UPGRADES) {
    if (upgrades.includes(u.id)) {
      power *= u.multiplier;
    }
  }
  return power;
}

/** Checks and unlocks skins when totalEarned meets threshold */
export function checkSkinUnlocks(state: CapybaraClickerState): string[] {
  const unlocked = [...state.unlockedSkins];
  for (const s of SKINS) {
    if (state.totalEarned >= s.unlockedAt && !unlocked.includes(s.id)) {
      unlocked.push(s.id);
    }
  }
  return unlocked;
}

/** Handles manual player tap/click */
export function handleClick(state: CapybaraClickerState): {
  state: CapybaraClickerState;
  earned: number;
} {
  const earned = state.clickPower;
  const newCapy = state.capybaras + earned;
  const newTotal = state.totalEarned + earned;

  const nextState: CapybaraClickerState = {
    ...state,
    capybaras: newCapy,
    totalEarned: newTotal,
    unlockedSkins: checkSkinUnlocks({ ...state, totalEarned: newTotal }),
    stats: {
      ...state.stats,
      totalClicks: state.stats.totalClicks + 1,
      manualCapybaras: state.stats.manualCapybaras + earned,
    },
  };

  return { state: nextState, earned };
}

/** Buys an idle producer */
export function buyProducer(
  state: CapybaraClickerState,
  producerId: string
): { success: boolean; state: CapybaraClickerState } {
  const producer = PRODUCERS.find((p) => p.id === producerId);
  if (!producer) return { success: false, state };

  const count = state.producers[producerId] || 0;
  const cost = calculateProducerCost(producer.baseCost, count);

  if (state.capybaras < cost) return { success: false, state };

  const nextState: CapybaraClickerState = {
    ...state,
    capybaras: state.capybaras - cost,
    producers: {
      ...state.producers,
      [producerId]: count + 1,
    },
  };

  return { success: true, state: nextState };
}

/** Buys a click power upgrade */
export function buyUpgrade(
  state: CapybaraClickerState,
  upgradeId: string
): { success: boolean; state: CapybaraClickerState } {
  if (state.upgrades.includes(upgradeId)) return { success: false, state };

  const upgrade = UPGRADES.find((u) => u.id === upgradeId);
  if (!upgrade) return { success: false, state };

  if (state.capybaras < upgrade.cost) return { success: false, state };

  const newUpgrades = [...state.upgrades, upgradeId];
  const newClickPower = calculateClickPower(newUpgrades);

  const nextState: CapybaraClickerState = {
    ...state,
    capybaras: state.capybaras - upgrade.cost,
    upgrades: newUpgrades,
    clickPower: newClickPower,
  };

  return { success: true, state: nextState };
}

/** Selects an unlocked capybara skin */
export function selectSkin(state: CapybaraClickerState, skinId: string): CapybaraClickerState {
  if (!state.unlockedSkins.includes(skinId)) return state;
  return { ...state, selectedSkin: skinId };
}

/** Steps passive idle production */
export function stepPassiveEarnings(
  state: CapybaraClickerState,
  deltaSeconds: number
): CapybaraClickerState {
  const cps = calculateCps(state.producers);
  if (cps <= 0 || deltaSeconds <= 0) return state;

  const earned = cps * deltaSeconds;
  const newCapy = state.capybaras + earned;
  const newTotal = state.totalEarned + earned;

  return {
    ...state,
    capybaras: newCapy,
    totalEarned: newTotal,
    unlockedSkins: checkSkinUnlocks({ ...state, totalEarned: newTotal }),
    stats: {
      ...state.stats,
      passiveCapybaras: state.stats.passiveCapybaras + earned,
    },
  };
}

/** Calculates offline welcome back bonus capped at 2 hours */
export function calculateOfflineEarnings(
  state: CapybaraClickerState,
  now = Date.now()
): { state: CapybaraClickerState; offlineSeconds: number; earned: number } {
  const elapsedMs = now - state.lastSaveTimestamp;
  if (elapsedMs < 3000) return { state, offlineSeconds: 0, earned: 0 };

  const maxOfflineMs = 2 * 60 * 60 * 1000; // 2 hours max
  const actualMs = Math.min(elapsedMs, maxOfflineMs);
  const seconds = actualMs / 1000;

  const cps = calculateCps(state.producers);
  const earned = Math.floor(cps * seconds);

  const nextState: CapybaraClickerState = {
    ...state,
    capybaras: state.capybaras + earned,
    totalEarned: state.totalEarned + earned,
    lastSaveTimestamp: now,
    stats: {
      ...state.stats,
      passiveCapybaras: state.stats.passiveCapybaras + earned,
    },
  };

  return { state: nextState, offlineSeconds: Math.floor(seconds), earned };
}

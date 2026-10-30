export interface ProducerConfig {
  id: string;
  name: string;
  icon: string;
  baseCost: number;
  baseCps: number; // Capybaras per second
  desc: string;
}

export interface UpgradeConfig {
  id: string;
  name: string;
  icon: string;
  cost: number;
  multiplier: number; // Multiplies click power
  desc: string;
}

export interface CapybaraSkin {
  id: string;
  name: string;
  unlockedAt: number; // Total capybaras needed
  accessory: 'none' | 'yuzu' | 'sunglasses' | 'tophat' | 'crown';
}

export type WeatherType = 'sunny' | 'blossom' | 'mist' | 'golden';

export interface CapybaraClickerState {
  capybaras: number;
  totalEarned: number;
  clickPower: number;
  producers: Record<string, number>; // producerId -> quantity
  upgrades: string[]; // purchased upgrade IDs
  selectedSkin: string;
  unlockedSkins: string[];
  weather: WeatherType;
  lastSaveTimestamp: number;
  stats: {
    totalClicks: number;
    manualCapybaras: number;
    passiveCapybaras: number;
  };
}

export type CritterType = 'capybara' | 'duckling' | 'turtle' | 'monkey';

export type CritterNeed = 'yuzu' | 'scrub' | 'tea' | 'relax';

export interface Critter {
  id: string;
  type: CritterType;
  name: string;
  emoji: string;
  bliss: number;         // 0 to 100
  targetBliss: number;   // 100
  currentNeed: CritterNeed;
  needTimer: number;     // seconds before need changes
  baseReward: number;    // base coins
}

export interface HotTub {
  id: number;
  unlocked: boolean;
  critter: Critter | null;
  yuzuCount: number;     // 0 to 4 (boosts bliss accumulation)
  waterWarmth: number;   // 0 to 100
  isBubbling: boolean;
  cleanliness: number;   // 0 to 100
}

export interface SpaUpgrade {
  id: string;
  name: string;
  cost: number;
  level: number;
  maxLevel: number;
  desc: string;
}

export interface CapybaraSpaState {
  coins: number;
  totalBlissEarned: number;
  reputationLevel: number;
  guestQueue: Critter[];
  maxQueueSize: number;
  tubs: HotTub[];
  spawnTimer: number;
  spawnInterval: number;
  upgrades: {
    yuzuTree: number;      // max 3: faster yuzu recharge
    herbalBath: number;    // max 3: +25% bliss speed
    deluxeScrub: number;   // max 3: 2x scrub power
    teaStation: number;    // max 3: 2x tea tip
    extraTubs: number;     // max 2: unlocks tubs 3 and 4
  };
  stats: {
    capybarasServed: number;
    yuzuServed: number;
    tubsScrubbed: number;
    teaCupsServed: number;
  };
}

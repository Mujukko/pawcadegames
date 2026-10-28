export type BottleType =
  | 'standard_milk'
  | 'golden_milk'
  | 'strawberry_milk'
  | 'chocolate_milk';

export interface PlinkoBottle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: BottleType;
  value: number;
  settled?: boolean;
}

export interface PlinkoPeg {
  id: string;
  x: number;
  y: number;
  radius: number;
  glowTimer: number; // 0 to 1
  isBumper?: boolean;
}

export interface PlinkoBucket {
  id: string;
  index: number;
  minX: number;
  maxX: number;
  multiplier: number;
  label: string;
  color: string;
  isJackpot?: boolean;
  highlightTimer: number; // 0 to 1
}

export interface PlinkoHopper {
  x: number;
  speed: number;
  dir: 1 | -1;
  minX: number;
  maxX: number;
  isManual?: boolean;
}

export interface PlinkoState {
  status: 'playing' | 'game_over';
  bottlesLeft: number;
  score: number;
  highScore: number;
  bottlesInPlay: PlinkoBottle[];
  pegs: PlinkoPeg[];
  buckets: PlinkoBucket[];
  hopper: PlinkoHopper;
  frenzyMeter: number; // 0 to 100
  frenzyActive: boolean;
  frenzyTimer: number;
  totalDropped: number;
  totalBucketed: number;
}

export type PlinkoEvent =
  | { type: 'bottle_dropped'; bottleType: BottleType; x: number }
  | { type: 'peg_hit'; pegId: string; x: number; y: number; noteFreq: number }
  | { type: 'bucket_scored'; bucketIndex: number; multiplier: number; scoreEarned: number; isJackpot: boolean }
  | { type: 'jackpot_celebration'; scoreEarned: number }
  | { type: 'frenzy_activated' };

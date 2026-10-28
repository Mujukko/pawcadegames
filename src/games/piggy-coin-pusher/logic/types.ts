export type CoinType =
  | 'gold_corn'
  | 'clover_silver'
  | 'giant_mega'
  | 'prize_egg'
  | 'milk_bottle';

export interface CoinItem {
  id: string;
  x: number; // 30 to 390
  y: number; // 80 to 395 (front ledge is at y = 385)
  radius: number; // 14 for normal, 24 for mega, 16 for prize
  vx: number;
  vy: number;
  type: CoinType;
  value: number; // 1 for gold, 2 for silver, 10 for mega, 5 for egg, 8 for bottle
  isFrontFalling?: boolean;
  isSideFalling?: boolean;
}

export interface PusherRake {
  y: number;
  speed: number;
  minY: number;
  maxY: number;
  dir: 1 | -1;
}

export interface PowerUps {
  quakeTimer: number; // seconds remaining
  coinWallsTimer: number; // seconds remaining
}

export interface PusherSpecialProgress {
  quakeProgress: number; // 0 to 100
  wallProgress: number; // 0 to 100
}

export interface PusherState {
  status: 'playing' | 'game_over';
  coinsInWallet: number; // available to drop (starts at 50)
  score: number;
  highScore: number;
  coinsOnTable: CoinItem[];
  pusher: PusherRake;
  powerUps: PowerUps;
  progress: PusherSpecialProgress;
  totalPushedFront: number;
  totalLostSide: number;
}

export type PusherEvent =
  | { type: 'coin_dropped'; x: number; coinType: CoinType }
  | { type: 'coin_pushed_front'; coinType: CoinType; value: number }
  | { type: 'coin_lost_side'; coinType: CoinType }
  | { type: 'powerup_activated'; powerUp: 'quake' | 'walls' }
  | { type: 'jackpot_awarded'; amount: number };

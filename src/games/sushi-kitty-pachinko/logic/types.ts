export type SushiType = 'nigiri' | 'maki' | 'sashimi' | 'golden';

export interface Peg {
  id: string;
  x: number;
  y: number;
  radius: number;
  isBumper?: boolean;
}

export interface SushiItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: SushiType;
  points: number;
  fullness: number; // percentage (e.g. 5 = 5%)
  eaten: boolean;
  vx?: number;
  minX?: number;
  maxX?: number;
}

export interface Basket {
  id: string;
  minX: number;
  maxX: number;
  y: number;
  label: string;
  points: number;
  multiplier: number;
}

export interface KittyEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseRadius: number;
  isFalling: boolean;
  inBasket: boolean;
  landedBasketId?: string;
}

export type SushiGameStatus = 'ready' | 'aiming' | 'falling' | 'round_end' | 'game_over' | 'victory';

export type SushiGameEvent =
  | { type: 'drop'; x: number }
  | { type: 'peg_bounce'; x: number; y: number; isBumper: boolean }
  | { type: 'sushi_chomp'; sushiType: SushiType; points: number; x: number; y: number }
  | { type: 'basket_land'; basketId: string; points: number }
  | { type: 'level_clear'; level: number; score: number }
  | { type: 'game_over'; score: number }
  | { type: 'victory'; finalScore: number };

export interface SushiGameState {
  status: SushiGameStatus;
  level: number;
  score: number;
  fullness: number; // 0 to 100
  targetFullness: number;
  dropsRemaining: number;
  totalDrops: number;
  dropperX: number;
  dropperSpeed: number;
  dropperDirection: number; // -1 or 1 for auto-sway when idle
  kitty: KittyEntity;
  pegs: Peg[];
  sushi: SushiItem[];
  baskets: Basket[];
  combo: number;
  events: SushiGameEvent[];
  boardWidth: number;
  boardHeight: number;
}

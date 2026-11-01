export type MineItemType =
  | 'small_gold'
  | 'medium_gold'
  | 'giant_gold'
  | 'diamond'
  | 'rock'
  | 'tnt'
  | 'mystery';

export interface MineItem {
  id: string;
  type: MineItemType;
  x: number;
  y: number;
  radius: number;
  value: number;
  weight: number; // 1 (light) to 5 (heavy rock/giant gold)
  collected: boolean;
  exploded?: boolean;
}

export interface ClawState {
  originX: number;
  originY: number;
  angle: number;       // radians (-1.2 to 1.2)
  angleDir: number;    // 1 or -1
  length: number;
  maxLength: number;
  state: 'swinging' | 'shooting' | 'reeling';
  grabbedItem: MineItem | null;
}

export interface GoldMinerState {
  shift: number;
  targetMoney: number;
  money: number;
  timeLeft: number;
  dynamiteCount: number;
  hasStrengthDrink: boolean;
  claw: ClawState;
  items: MineItem[];
  status: 'playing' | 'shift_clear' | 'game_over' | 'victory';
  totalShifts: number;
}

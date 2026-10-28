export type SheepColor = 'white' | 'black' | 'golden' | 'pink';

export type GateDirection = 'left' | 'right';

export interface RunningSheep {
  id: string;
  color: SheepColor;
  targetGate: GateDirection; // which corral it belongs to (white/pink -> left, black/golden -> right)
  y: number; // 0 down to 320 (gate junction)
  speed: number;
  points: number;
  bobOffset: number;
  isSorted?: boolean;
  isMissed?: boolean;
}

export interface SheepSorterState {
  status: 'playing' | 'game_over';
  gateDir: GateDirection;
  gateAngle: number; // visual lerp
  score: number;
  highScore: number;
  combo: number;
  maxCombo: number;
  lives: number; // 3 hearts
  sheepList: RunningSheep[];
  spawnTimer: number;
  spawnInterval: number; // 1.4s down to 0.65s
  difficultySpeed: number; // base speed 130 up to 260
  totalSorted: number;
  feverActive: boolean;
  feverTimer: number;
}

export type SheepSorterEvent =
  | { type: 'sheep_sorted'; sheep: RunningSheep; isCorrect: boolean; points: number; combo: number }
  | { type: 'gate_switched'; newDir: GateDirection }
  | { type: 'life_lost'; remainingLives: number }
  | { type: 'fever_activated' };

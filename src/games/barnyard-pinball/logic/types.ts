export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isActive: boolean;
  trail: Array<{ x: number; y: number; alpha: number }>;
}

export interface Flipper {
  pivotX: number;
  pivotY: number;
  length: number;
  baseAngle: number;
  upAngle: number;
  currentAngle: number;
  angularVelocity: number;
  isEngaged: boolean;
  side: 'left' | 'right';
}

export interface Bumper {
  id: string;
  x: number;
  y: number;
  radius: number;
  points: number;
  label: string;
  color: string;
  hitTimer: number; // for flash animation
}

export interface RolloverLane {
  id: string;
  letter: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isLit: boolean;
}

export interface Slingshot {
  side: 'left' | 'right';
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  normalX: number;
  normalY: number;
  hitTimer: number;
}

export interface PinballState {
  status: 'ready' | 'playing' | 'game_over';
  score: number;
  highScore: number;
  multiplier: number; // 1x, 2x, 3x, 5x
  ballsRemaining: number; // starts with 3
  balls: Ball[];
  leftFlipper: Flipper;
  rightFlipper: Flipper;
  bumpers: Bumper[];
  rolloverLanes: RolloverLane[];
  slingshots: Slingshot[];
  plungerCharge: number; // 0 to 1
  isPlungerCharging: boolean;
  multiballActive: boolean;
  barnHits: number; // 3 hits unlock multiball
  lastHitTime: number;
  tiltWarnings: number;
}

export type PinballEvent =
  | { type: 'ball_launched'; ballId: string; power: number }
  | { type: 'bumper_hit'; bumperId: string; points: number }
  | { type: 'slingshot_hit'; side: 'left' | 'right'; points: number }
  | { type: 'rollover_lit'; letter: string; allLit: boolean; multiplier: number }
  | { type: 'flipper_clack'; side: 'left' | 'right' }
  | { type: 'multiball_started' }
  | { type: 'ball_drained'; remainingBalls: number }
  | { type: 'game_over'; finalScore: number };

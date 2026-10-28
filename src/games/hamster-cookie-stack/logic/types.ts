export type SweetType =
  | 'cookie'
  | 'cupcake'
  | 'macaron'
  | 'donut'
  | 'waffle'
  | 'cake';

export interface SweetItem {
  id: string;
  type: SweetType;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  points: number;
  color: string;
  frostingColor: string;
}

export interface StackedSweet {
  id: string;
  type: SweetType;
  offsetX: number; // offset relative to plate center
  y: number;
  width: number;
  height: number;
  angle: number;
  points: number;
  color: string;
  frostingColor: string;
  isPerfect: boolean;
}

export interface BakeryStage {
  id: number;
  title: string;
  subtitle: string;
  targetCount: number;
  allowedTypes: SweetType[];
  fallSpeed: number;
  wobbleSensitivity: number;
}

export interface HamsterCookieStackState {
  stage: number;
  stageConfig: BakeryStage;
  plateX: number;
  plateY: number;
  plateWidth: number;
  plateVx: number;
  fallingSweets: SweetItem[];
  stackedSweets: StackedSweet[];
  lives: number;
  score: number;
  highScore: number;
  combo: number;
  towerHeight: number;
  wobbleAngle: number;
  wobbleVelocity: number;
  status: 'playing' | 'won' | 'lost';
  spawnTimer: number;
  spawnInterval: number;
  isPaused: boolean;
}

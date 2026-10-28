export type GameStatus =
  | 'ready'
  | 'playing'
  | 'stage_cleared'
  | 'game_over'
  | 'victory';

export type SpeedPattern = 'constant' | 'oscillating' | 'reversing' | 'stutter';

export type PegType = 'carrot' | 'wood_obstacle';
export type FruitType = 'apple' | 'golden_acorn';

export interface TargetStump {
  x: number;
  y: number;
  radius: number;
  rotation: number; // in radians
  rotationSpeed: number; // in radians/sec
  speedPattern: SpeedPattern;
  timer: number;
}

export interface EmbeddedPeg {
  id: string;
  angle: number; // relative angle on stump in radians [0, 2*PI)
  type: PegType;
}

export interface BonusFruit {
  id: string;
  angle: number; // relative angle on stump in radians [0, 2*PI)
  type: FruitType;
  points: number;
  isSliced: boolean;
}

export interface FlyingCarrot {
  x: number;
  y: number;
  vy: number;
  length: number;
  width: number;
}

export interface DeflectedCarrot {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
}

export interface WoodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface StageConfig {
  stage: number;
  title: string;
  subtitle: string;
  targetCarrots: number;
  baseSpeed: number;
  speedPattern: SpeedPattern;
  initialObstacles: number[]; // relative angles in radians
  initialFruits: Array<{ angle: number; type: FruitType; points: number }>;
}

export interface CarrotTargetState {
  status: GameStatus;
  stage: number;
  totalStages: number;
  score: number;
  carrotsRemaining: number;
  totalCarrotsInStage: number;
  stump: TargetStump;
  embeddedPegs: EmbeddedPeg[];
  bonusFruits: BonusFruit[];
  flyingCarrot: FlyingCarrot | null;
  deflectedCarrot: DeflectedCarrot | null;
  particles: WoodParticle[];
  highScore: number;
}

export type CarrotEvent =
  | { type: 'carrot_thrown' }
  | { type: 'carrot_stuck'; points: number; angle: number }
  | { type: 'fruit_sliced'; fruitType: FruitType; points: number; x: number; y: number }
  | { type: 'carrot_clash'; x: number; y: number }
  | { type: 'stage_clear'; stage: number }
  | { type: 'victory'; finalScore: number }
  | { type: 'game_over'; finalScore: number };

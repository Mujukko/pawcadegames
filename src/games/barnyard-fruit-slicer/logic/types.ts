export type FruitType =
  | 'apple'
  | 'watermelon'
  | 'strawberry'
  | 'corn'
  | 'eggplant'
  | 'golden_pineapple'
  | 'thistle_bomb';

export interface FruitConfig {
  type: FruitType;
  label: string;
  emoji: string;
  radius: number;
  points: number;
  isBomb: boolean;
  color: string;
  juiceColor: string;
}

export interface FlyingFruit {
  id: string;
  type: FruitType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  points: number;
  isBomb: boolean;
  color: string;
  juiceColor: string;
  rotation: number;
  rotationSpeed: number;
  isSliced: boolean;
  half1?: { x: number; y: number; vx: number; vy: number; rotation: number };
  half2?: { x: number; y: number; vx: number; vy: number; rotation: number };
  sliceAngle?: number;
}

export interface JuiceParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface SlicePoint {
  x: number;
  y: number;
  timestamp: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface FruitSlicerState {
  status: 'ready' | 'playing' | 'game_over' | 'victory';
  stage: number;
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  fruits: FlyingFruit[];
  particles: JuiceParticle[];
  floatingTexts: FloatingText[];
  sliceTrail: SlicePoint[];
  comboCount: number;
  lastSliceTime: number;
  spawnTimer: number;
  stageTarget: number;
  fruitsSlicedInStage: number;
  width: number;
  height: number;
}

export interface SliceEvent {
  type: 'slice' | 'bomb' | 'combo' | 'fruit_dropped' | 'stage_complete' | 'game_over';
  fruitType?: FruitType;
  pointsEarned?: number;
  comboCount?: number;
  x?: number;
  y?: number;
}

export type GamePhase = 'ready' | 'pouring' | 'popping' | 'evaluating' | 'won' | 'lost';

export interface KernelModel {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isPopped: boolean;
  popTimer: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  settled: boolean;
}

export interface WallSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface BucketObstacle {
  id: string;
  type: 'paddle' | 'barrier';
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;
  rotationSpeed: number;
}

export interface BucketModel {
  x: number;
  y: number;
  width: number;
  height: number;
  targetLineY: number; // height where popcorn should reach
  brimY: number;       // top line, above which kernels spill
  walls: WallSegment[];
}

export interface StageDefinition {
  id: number;
  name: string;
  subtitle: string;
  spawnerX: number;
  spawnerY: number;
  maxKernels: number;
  maxSpillsAllowed: number;
  bucket: BucketModel;
  obstacles: BucketObstacle[];
}

export interface BarnyardPopcornPopperState {
  stage: number;
  kernels: KernelModel[];
  isPouring: boolean;
  phase: GamePhase;
  kernelsPoured: number;
  maxKernels: number;
  fillRatio: number;
  spilledCount: number;
  maxSpillsAllowed: number;
  score: number;
  highScore: number;
  stars: number;
  evaluationTimer: number;
  events: Array<{ type: string; [key: string]: any }>;
}

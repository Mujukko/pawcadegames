export type ObstacleType =
  | 'hay_bale_single'
  | 'hay_bale_double'
  | 'fence_post'
  | 'flying_crow_low'
  | 'flying_crow_high';

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Obstacle {
  id: number;
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  speedMultiplier?: number;
  frame?: number;
}

export interface DuckRunnerState {
  score: number;
  highScore: number;
  distance: number;
  speed: number; // px per second
  groundY: number; // Y position of the ground

  // Duck physics
  duckX: number;
  duckY: number;
  duckVelocityY: number;
  isGrounded: boolean;
  isCrouching: boolean;
  duckWidth: number;
  duckHeight: number;

  // Obstacles
  obstacles: Obstacle[];
  nextObstacleDistance: number;
  obstacleIdCounter: number;

  // Game lifecycle
  isStarted: boolean;
  isGameOver: boolean;

  // Day / Night cycle (swaps every 500 score points)
  isNightMode: boolean;
  nightTransitionAlpha: number; // 0 (day) to 1 (night)

  // Audio triggers (consumed by rendering / audio system)
  lastMilestoneScore: number;
  pendingSoundEvents: Array<'jump' | 'duck' | 'milestone' | 'hit' | 'quack'>;
}

export interface DuckRunnerConfig {
  canvasWidth: number;
  canvasHeight: number;
  groundHeight: number;
  initialSpeed: number;
  maxSpeed: number;
  speedIncrement: number; // speed increase per 100 points
  gravity: number;
  jumpForce: number;
  fastFallGravity: number;
}

export const DEFAULT_DUCK_CONFIG: DuckRunnerConfig = {
  canvasWidth: 800,
  canvasHeight: 360,
  groundHeight: 70, // ground is canvasHeight - groundHeight = 290
  initialSpeed: 300,
  maxSpeed: 720,
  speedIncrement: 18,
  gravity: 1600,
  jumpForce: -620,
  fastFallGravity: 3400,
};

export const DUCK_DIMENSIONS = {
  standing: { width: 44, height: 46 },
  crouching: { width: 54, height: 24 },
};

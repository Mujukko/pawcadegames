export type BrickType = 'wood_crate' | 'stone_brick' | 'golden_honey';

export type PowerUpType = 'multiball' | 'wide_paddle' | 'fireball' | 'extra_life';

export interface Brick {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  hitsLeft: number;
  maxHits: number;
  color: string;
}

export interface Ball {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  stuckToPaddle: boolean;
  isFireball: boolean;
}

export interface Paddle {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  wideTimer: number;
  fireballTimer: number;
}

export interface FallingPowerUp {
  id: number;
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
}

export interface BrickBreakerEvent {
  type: 'bounce_wall' | 'bounce_paddle' | 'hit_brick' | 'brick_destroyed' | 'collect_powerup' | 'ball_lost' | 'stage_clear' | 'game_over';
  x?: number;
  y?: number;
  brickType?: BrickType;
  powerUpType?: PowerUpType;
}

export interface StageConfig {
  id: number;
  name: string;
  subtitle: string;
  brickRows: string[]; // ASCII representation of layout
}

export interface BarnyardBrickBreakerState {
  currentStageIndex: number;
  score: number;
  highScore: number;
  lives: number;
  combo: number;
  balls: Ball[];
  paddle: Paddle;
  bricks: Brick[];
  powerUps: FallingPowerUp[];
  stageComplete: boolean;
  gameOver: boolean;
  gameComplete: boolean;
  lastEvents: BrickBreakerEvent[];
}

export type PegType = 'blue' | 'orange' | 'purple' | 'green';

export interface Peg {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: PegType;
  isHit: boolean;
  fadeAlpha: number;
  points: number;
}

export interface BouncingBall {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isStuck: boolean;
}

export interface CatchBasket {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  minX: number;
  maxX: number;
}

export interface PegSparkle {
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

export interface PegFloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface PegPopStageConfig {
  stage: number;
  name: string;
  ballsGiven: number;
  pegs: Array<{ x: number; y: number; type: PegType }>;
}

export interface PegPopState {
  status: 'aiming' | 'ball_active' | 'stage_cleared' | 'game_over' | 'victory';
  stage: number;
  score: number;
  highScore: number;
  ballsLeft: number;
  aimAngle: number; // In radians (-PI to 0, shooting downwards)
  cannonX: number;
  cannonY: number;
  pegs: Peg[];
  ball: BouncingBall | null;
  basket: CatchBasket;
  sparkles: PegSparkle[];
  floatingTexts: PegFloatingText[];
  pegsHitInShot: number;
  orangePegsRemaining: number;
  totalOrangePegs: number;
  isFeverActive: boolean;
  width: number;
  height: number;
}

export interface PegPopEvent {
  type: 'peg_hit' | 'basket_catch' | 'ball_lost' | 'fever_started' | 'stage_clear' | 'game_over';
  pegType?: PegType;
  pointsEarned?: number;
  pegsHitCount?: number;
  x?: number;
  y?: number;
}

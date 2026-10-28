export type ParticleType = 'water' | 'lava' | 'gold' | 'carrot' | 'stone';

export interface PinParticle {
  id: string;
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isExtinguished?: boolean;
}

export interface LockingPin {
  id: string;
  orientation: 'horizontal' | 'vertical';
  x: number;
  y: number;
  length: number;
  thickness: number;
  pullDirection: 'left' | 'right' | 'up' | 'down';
  pullProgress: number; // 0 (in place) to 1 (fully pulled out)
  isPulled: boolean;
  pullSpeed: number;
  isPulling: boolean;
  ringX: number;
  ringY: number;
  ringRadius: number;
}

export interface PinChamberBarrier {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
}

export interface CreatureTarget {
  id: string;
  type: 'puppy' | 'thief_fox';
  x: number;
  y: number;
  width: number;
  height: number;
  isSatisfied: boolean;
  isEliminated: boolean;
  requiredFoodCount: number;
  foodReceived: number;
}

export interface PinLevelConfig {
  id: number;
  title: string;
  subtitle: string;
  pins: LockingPin[];
  barriers: PinChamberBarrier[];
  initialParticles: PinParticle[];
  creatures: CreatureTarget[];
  targetFoodCount: number;
}

export interface PinPullGameState {
  level: number;
  levelConfig: PinLevelConfig;
  pins: LockingPin[];
  particles: PinParticle[];
  creatures: CreatureTarget[];
  steamParticles: { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number }[];
  status: 'playing' | 'won' | 'lost';
  score: number;
  foodCollected: number;
  isPaused: boolean;
}

export type EggType = 'regular' | 'speckled' | 'golden' | 'rotten' | 'feather';

export interface FallingEgg {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: EggType;
  points: number;
  radius: number;
  wobble: number;
}

export interface SplatParticle {
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

export interface EggCatcherBasket {
  x: number;
  targetX: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

export interface ChickenPerch {
  id: number;
  x: number;
  y: number;
  eggCooldown: number;
  isClucking: boolean;
}

export interface ChickenEggCatcherState {
  status: 'playing' | 'game_over';
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  basket: EggCatcherBasket;
  perches: ChickenPerch[];
  fallingEggs: FallingEgg[];
  splats: SplatParticle[];
  combo: number;
  maxCombo: number;
  feverTime: number; // >0 means 2x golden fever
  timeElapsed: number;
  eggsCaught: number;
  eggsDropped: number;
  wave: number;
}

export type EggCatcherEvent =
  | { type: 'egg_caught'; eggType: EggType; points: number; combo: number }
  | { type: 'egg_splat'; eggType: EggType; livesRemaining: number }
  | { type: 'fever_start' }
  | { type: 'game_over'; finalScore: number };

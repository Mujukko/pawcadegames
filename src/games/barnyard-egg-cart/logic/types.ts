export interface Vector2D {
  x: number;
  y: number;
}

export type PowerUpType = 'shield' | 'magnet' | 'turbo';

export interface PowerUpItem {
  id: string;
  type: PowerUpType;
  x: number;
  y: number;
  collected: boolean;
}

export interface CoinPickup {
  id: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
}

export interface TerrainPoint {
  x: number;
  y: number;
  type?: 'ground' | 'bridge';
}

export interface WheelState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  onGround: boolean;
  angularVelocity: number;
  angle: number;
}

export interface EggState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  radiusX: number;
  radiusY: number;
  inCup: boolean;
  cracked: boolean;
  distress: 'happy' | 'nervous' | 'screaming' | 'cracked';
}

export interface CartUpgrades {
  suspension: number; // 0 to 5 (smoother terrain riding)
  eggCupCushion: number; // 0 to 5 (cushions egg against shocks)
  tireTraction: number; // 0 to 5 (better hill climbing acceleration)
  cupDepth: number; // 0 to 5 (higher side barriers to keep egg inside)
}

export interface ActivePowerUps {
  shieldTimer: number; // seconds remaining
  magnetTimer: number;
  turboTimer: number;
}

export interface CartPhysicsState {
  // Chassis
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  length: number;
  height: number;
  
  // Wheels
  frontWheel: WheelState;
  rearWheel: WheelState;
  
  // Egg
  egg: EggState;
}

export interface EggCartGameState {
  cart: CartPhysicsState;
  distanceMeters: number;
  highScoreDistance: number;
  coins: number;
  coinsThisRun: number;
  gameOver: boolean;
  gameOverReason: 'cracked' | 'lost_egg' | 'tipped' | null;
  upgrades: CartUpgrades;
  activePowerUps: ActivePowerUps;
  gasPressed: boolean;
  brakePressed: boolean;
  elapsedTime: number;
  coinsPickups: CoinPickup[];
  powerUpPickups: PowerUpItem[];
}

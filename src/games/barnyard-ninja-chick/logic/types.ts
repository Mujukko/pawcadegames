export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type HazardType = 'saw' | 'spikes';

export interface Hazard {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: HazardType;
  rotation?: number;
  rotationSpeed?: number;
}

export interface Bouncer {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  bounceForce: number;
}

export interface Checkpoint {
  id: string;
  x: number;
  y: number;
  activated: boolean;
}

export interface NinjaChickLevel {
  id: number;
  title: string;
  spawnPoint: { x: number; y: number };
  exitDoor: Rect;
  platforms: Rect[];
  hazards: Hazard[];
  bouncers: Bouncer[];
  checkpoints: Checkpoint[];
  starCoins: { id: string; x: number; y: number; collected: boolean }[];
  targetTimeSeconds: number;
}

export interface PlayerPhysics {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  isGrounded: boolean;
  isOnWallLeft: boolean;
  isOnWallRight: boolean;
  isSliding: boolean;
  coyoteTimer: number;
  jumpBufferTimer: number;
  facing: 1 | -1;
  activeCheckpoint: { x: number; y: number };
}

export interface NinjaChickGameState {
  currentLevelIndex: number;
  player: PlayerPhysics;
  level: NinjaChickLevel;
  levelCompleted: boolean;
  gameOver: boolean;
  elapsedTime: number;
  deaths: number;
  coinsCollected: number;
  starsInLevel: number;
}

export type HazardType = 'spike' | 'falling_spike' | 'moving_hazard';
export type PlatformType = 'solid' | 'trap' | 'moving' | 'disappearing';

export interface LevelDevilPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  onGround: boolean;
  alive: boolean;
  reachedDoor: boolean;
  facing: 'left' | 'right';
  controlsInverted?: boolean;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  triggered?: boolean;
  dropVy?: number;
  opacity?: number;
  minX?: number;
  maxX?: number;
  speedX?: number;
}

export interface Hazard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: HazardType;
  triggered?: boolean;
  vy?: number;
  triggerX?: number; // Player X threshold to trigger drop
}

export interface Door {
  x: number;
  y: number;
  width: number;
  height: number;
  originalX: number;
  originalY: number;
  shifted?: boolean;
  isDecoy?: boolean;
}

export interface LevelDevilInput {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
}

export interface LevelDevilState {
  levelIndex: number;
  player: LevelDevilPlayer;
  platforms: Platform[];
  hazards: Hazard[];
  door: Door;
  decoyDoor?: Door;
  deaths: number;
  status: 'playing' | 'level_cleared' | 'victory' | 'died';
  message: string;
  levelTitle: string;
}

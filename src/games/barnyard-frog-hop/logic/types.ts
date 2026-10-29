export type LilyPadType = 'standard' | 'sinking' | 'drifting_log' | 'lotus_flower';

export type InsectType = 'fly' | 'dragonfly' | 'firefly';

export interface LilyPad {
  id: string;
  lane: number; // 0 is starting bank, 1..N are river lanes
  x: number; // horizontal center
  y: number; // vertical position
  radius: number;
  width?: number; // for logs
  height?: number;
  type: LilyPadType;
  vx: number; // drift speed
  sinkTimer: number; // seconds before sinking (if sinking type)
  isSunk: boolean;
  hasLanded: boolean;
}

export interface PondInsect {
  id: string;
  x: number;
  y: number;
  type: InsectType;
  points: number;
  collected: boolean;
}

export interface HeronHazard {
  id: string;
  x: number;
  y: number;
  warningTimer: number; // counts down while shadow is cast
  isStriking: boolean;
  strikeTimer: number;
}

export interface FrogPlayer {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  isJumping: boolean;
  jumpProgress: number; // 0 to 1
  jumpHeight: number;
  currentPadId: string | null;
  tongueActive: boolean;
  tongueTarget: { x: number; y: number } | null;
  tongueTimer: number;
  lives: number;
}

export interface FrogZoneConfig {
  id: string;
  name: string;
  totalLanes: number; // e.g. 15 lanes to cross
  laneSpacing: number; // vertical distance between rows
  waterSpeed: number;
}

export interface FrogGameState {
  zone: FrogZoneConfig;
  status: 'playing' | 'drowned' | 'won';
  score: number;
  fliesEaten: number;
  furthestLane: number;
  player: FrogPlayer;
  pads: LilyPad[];
  insects: PondInsect[];
  heron: HeronHazard | null;
  events: Array<{ type: string; points?: number; text?: string }>;
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface TerrainSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  surfaceType?: 'grass' | 'wood' | 'mud' | 'metal';
}

export type TrackHazardType = 'water_pit' | 'springboard' | 'tnt_barrel' | 'speed_boost';

export interface TrackHazard {
  id: string;
  type: TrackHazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  triggered?: boolean;
}

export interface TrackCheckpoint {
  id: string;
  x: number;
  y: number;
  passed: boolean;
}

export interface WheelState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isGrounded: boolean;
  angularVelocity: number;
}

export interface TractorState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians
  angularVelocity: number;
  rearWheel: WheelState;
  frontWheel: WheelState;
  driverHead: Vector2D;
  isGrounded: boolean;
  isCrashed: boolean;
}

export interface TrackData {
  id: string;
  name: string;
  description: string;
  targetTimes: {
    threeStars: number;
    twoStars: number;
  };
  startX: number;
  startY: number;
  finishX: number;
  finishY: number;
  terrain: TerrainSegment[];
  hazards: TrackHazard[];
  checkpoints: TrackCheckpoint[];
}

export interface ControlInput {
  throttle: number; // 0 to 1 (accelerate)
  brake: number; // 0 to 1 (reverse/brake)
  tiltLeft: boolean; // lean back / rotate counter-clockwise
  tiltRight: boolean; // lean forward / rotate clockwise
}

export interface FloatingText {
  id: string;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  scale: number;
}

export interface StuntGameState {
  trackIndex: number;
  status: 'ready' | 'playing' | 'crashed' | 'finished';
  elapsedTime: number; // seconds
  timeBonus: number; // seconds deducted from stunts
  flipsCount: {
    backflips: number;
    frontflips: number;
  };
  airborneTime: number;
  accumulatedAirAngle: number;
  tractor: TractorState;
  activeCheckpointIndex: number;
  floatingTexts: FloatingText[];
  unlockedTracks: number;
  trackBestTimes: number[]; // best final times per track
}

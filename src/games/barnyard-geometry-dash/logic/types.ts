export type DashMode = 'cube' | 'ship';

export type ObstacleKind =
  | 'spike'
  | 'block'
  | 'pad' // yellow spring pad on ground/block
  | 'orb' // mid-air yellow jump ring (requires fresh tap or hold)
  | 'portal_ship'
  | 'portal_cube'
  | 'speed_fast'
  | 'coin';

export interface DashProp {
  id: number;
  kind: ObstacleKind;
  x: number;
  y: number; // world Y measured UPWARD from ground (ground = 0)
  w: number;
  h: number;
  used?: boolean;
}

export interface DashStage {
  id: number;
  name: string;
  stars: number;
  accent: string;
  bgTop: string;
  bgBottom: string;
  baseSpeed: number;
  length: number;
  props: DashProp[];
}

export type DashEvent =
  | { type: 'jump' }
  | { type: 'pad' }
  | { type: 'orb' }
  | { type: 'portal'; mode: DashMode }
  | { type: 'coin' }
  | { type: 'beat'; step: number }
  | { type: 'crash' }
  | { type: 'complete' };

export interface DashGameState {
  stageIndex: number;
  stageName: string;
  length: number;
  props: DashProp[];
  mode: DashMode;
  x: number;
  y: number; // height above ground (0 = on floor)
  vy: number;
  rotation: number; // degrees
  grounded: boolean;
  holding: boolean;
  freshPress: boolean;
  speedMult: number;
  status: 'ready' | 'playing' | 'crashed' | 'complete';
  crashTimer: number;
  attempt: number;
  progress: number; // 0..100
  bestProgress: number[]; // per stage
  coinsCollected: number;
  lastBeatIndex: number;
  events: DashEvent[];
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export type LaneType = 'grass' | 'road' | 'river' | 'railroad';

export interface ObstacleEntity {
  id: string;
  col: number;
  type: 'tree' | 'boulder';
}

export interface CollectibleEntity {
  id: string;
  col: number;
  type: 'carrot' | 'golden_carrot';
  collected: boolean;
}

export interface MovingEntity {
  id: string;
  x: number; // continuous float position in columns (0 to COLS_COUNT)
  width: number; // width in columns
  speed: number; // columns per second (+ for right, - for left)
  type: 'tractor' | 'pickup' | 'grain_truck' | 'log_small' | 'log_large' | 'lily_pad';
}

export interface LaneConfig {
  row: number;
  type: LaneType;
  speed: number;
  obstacles: ObstacleEntity[];
  collectibles: CollectibleEntity[];
  movingEntities: MovingEntity[];
  trainWarningTimer?: number;
  trainRushing?: boolean;
  trainX?: number;
}

export interface BunnyState {
  gridX: number;
  gridY: number;
  visualX: number;
  visualY: number;
  hopProgress: number; // 0 to 1 during jump
  isHopping: boolean;
  facing: Direction;
  ridingEntityId: string | null;
  alive: boolean;
}

export type BunnyHopEvent =
  | { type: 'hop'; facing: Direction }
  | { type: 'carrot_collect'; points: number; isGolden: boolean }
  | { type: 'splash' }
  | { type: 'crash' }
  | { type: 'hawk_swoop' }
  | { type: 'life_lost'; remainingLives: number }
  | { type: 'stage_clear'; stage: number; score: number }
  | { type: 'game_over'; finalScore: number }
  | { type: 'game_complete'; finalScore: number };

export interface StageConfig {
  stage: number;
  name: string;
  totalRows: number;
  theme: string;
}

export interface BunnyHopState {
  bunny: BunnyState;
  lanes: LaneConfig[];
  score: number;
  carrots: number;
  maxRowReached: number;
  idleTimer: number; // seconds standing still on same row
  lives: number;
  stage: number;
  totalStages: number;
  gameOver: boolean;
  stageComplete: boolean;
  gameComplete: boolean;
  highScore: number;
  events: BunnyHopEvent[];
}

export const GRID_COLS = 9;
export const MAX_LIVES = 3;
export const IDLE_HAWK_LIMIT = 7.0; // hawk attacks after 7s of no forward progress

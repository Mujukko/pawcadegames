export type GameStatus = 'ready' | 'playing' | 'won' | 'gameover';

export interface ChickenState {
  x: number;
  y: number;
  vy: number;
  radius: number;
  rotation: number;
  wingState: 'up' | 'mid' | 'down';
  alive: boolean;
}

export interface ObstaclePipe {
  id: number;
  x: number;
  gapY: number;
  gapHeight: number;
  width: number;
  passed: boolean;
  hasGrain: boolean;
  grainCollected: boolean;
  grainY: number;
}

export interface WheatGoalData {
  targetPipes: number;
  wheatX: number; // Position where grand golden wheat field is spawned
  reached: boolean;
}

export interface FlappyGameState {
  chicken: ChickenState;
  pipes: ObstaclePipe[];
  score: number;
  grains: number;
  bestScore: number;
  wheatGoalPipes: number;
  distanceRatio: number; // 0.0 to 1.0 progress to golden wheat
  status: GameStatus;
  isGameOver: boolean;
  hasWon: boolean;
  wheatFieldSpawned: boolean;
  wheatFieldX: number;
  timeAlive: number;
}

export type GameEventType =
  | 'flap'
  | 'cluck'
  | 'point'
  | 'grain'
  | 'hit_pipe'
  | 'hit_ground'
  | 'wheat_victory';

export interface GameEvent {
  type: GameEventType;
  payload?: Record<string, unknown>;
}

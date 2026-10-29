export interface DifferencePoint {
  id: string;
  x: number; // normalized coordinate 0 to 1
  y: number; // normalized coordinate 0 to 1
  radius: number; // detection radius tolerance 0.06 to 0.1
  description: string;
}

export interface SpotScene {
  id: string;
  name: string;
  differences: DifferencePoint[];
}

export type SpotGameStatus = 'ready' | 'playing' | 'round_clear' | 'game_over' | 'victory';

export type SpotGameEvent =
  | { type: 'found'; diffId: string; x: number; y: number; points: number }
  | { type: 'miss'; x: number; y: number; livesRemaining: number }
  | { type: 'hint_used'; diffId: string }
  | { type: 'round_clear'; level: number; score: number }
  | { type: 'game_over'; reason: 'out_of_time' | 'out_of_lives'; score: number }
  | { type: 'victory'; finalScore: number };

export interface SpotGameState {
  status: SpotGameStatus;
  level: number;
  score: number;
  lives: number;
  hints: number;
  timeRemaining: number;
  maxTime: number;
  foundIds: string[];
  activeHintId?: string;
  scene: SpotScene;
  events: SpotGameEvent[];
}

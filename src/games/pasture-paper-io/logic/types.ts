export type Direction = 'up' | 'down' | 'left' | 'right';

export interface CellPos {
  x: number;
  y: number;
}

export interface CritterAgent {
  id: number; // 0 = player, 1..4 = AI bots
  name: string;
  emoji: string;
  color: string;
  trailColor: string;
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  dir: Direction;
  nextDir: Direction;
  alive: boolean;
  respawnTimer: number;
  trail: CellPos[];
  kills: number;
  aiStepsOut: number;
}

export type PaperEvent =
  | { type: 'claim'; cellsGained: number }
  | { type: 'kill'; victimName: string }
  | { type: 'die'; reason: 'fence' | 'self' | 'rival'; killerName?: string }
  | { type: 'victory' };

export interface PaperGameState {
  gridSize: number;
  grid: number[]; // -1 = neutral, 0 = player, 1..4 = bots
  agents: CritterAgent[];
  tickProgress: number; // 0..1 interpolation within current cell step
  status: 'ready' | 'playing' | 'game_over' | 'victory';
  deathReason?: 'fence' | 'self' | 'rival';
  killerName?: string;
  score: number;
  bestPercent: number;
  playerPercent: number;
  events: PaperEvent[];
}

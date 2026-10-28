export type MazeCellType = 'wall' | 'path' | 'gate' | 'exit';

export interface MazeItem {
  id: string;
  row: number;
  col: number;
  type: 'acorn' | 'key' | 'sunflower_seed';
  isCollected: boolean;
}

export interface HamsterPlayer {
  row: number;
  col: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  dir: 'up' | 'down' | 'left' | 'right';
  isMoving: boolean;
  hasKey: boolean;
  acornsCollected: number;
  totalAcorns: number;
}

export interface HamsterMazeStage {
  id: number;
  name: string;
  grid: number[][]; // 0: path, 1: wall, 2: locked gate, 3: exit
  items: Array<{ row: number; col: number; type: 'acorn' | 'key' | 'sunflower_seed' }>;
  startRow: number;
  startCol: number;
}

export interface HamsterMazeState {
  status: 'playing' | 'stage_clear' | 'game_over';
  currentStageIndex: number;
  score: number;
  highScore: number;
  player: HamsterPlayer;
  items: MazeItem[];
  grid: number[][];
  timeElapsed: number;
}

export type HamsterMazeEvent =
  | { type: 'item_collected'; itemType: MazeItem['type']; points: number }
  | { type: 'gate_unlocked' }
  | { type: 'stage_clear'; stageIndex: number }
  | { type: 'bump_wall' };

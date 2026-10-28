export type CropType = 'wheat' | 'corn' | 'sunflower';

export type TileState = 'uncut' | 'cut' | 'obstacle' | 'barn_chute';

export interface FieldTile {
  row: number;
  col: number;
  type: CropType;
  state: TileState;
  height: number; // for visual grass swaying
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface MowerPlayer {
  x: number;
  y: number;
  dir: Direction;
  targetDir: Direction;
  speed: number;
  bladeAngle: number;
  isMoving: boolean;
  basket: number;
  maxBasket: number;
}

export interface CropMowerStage {
  id: number;
  name: string;
  rows: number;
  cols: number;
  cropType: CropType;
  obstacles: Array<{ row: number; col: number }>;
  barnChute: { row: number; col: number };
}

export interface CropMowerState {
  status: 'playing' | 'stage_clear' | 'game_over';
  currentStageIndex: number;
  score: number;
  highScore: number;
  totalCut: number;
  totalCropsInStage: number;
  grid: FieldTile[][];
  player: MowerPlayer;
  turboTimer: number; // for speed boost
  comboStreak: number;
}

export type CropMowerEvent =
  | { type: 'crop_cut'; row: number; col: number; cropType: CropType; points: number }
  | { type: 'basket_deposited'; count: number; points: number }
  | { type: 'turbo_activated' }
  | { type: 'stage_clear'; stageIndex: number }
  | { type: 'game_over' };

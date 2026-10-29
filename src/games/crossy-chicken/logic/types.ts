export type LaneType = 'grass' | 'road' | 'river' | 'railroad';

export interface ObstacleModel {
  id: number;
  x: number;
  width: number;
  height: number;
  speed: number;
  type: 'car' | 'truck' | 'tractor' | 'log' | 'train';
  color?: string;
}

export interface CoinModel {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export interface LaneModel {
  index: number;
  type: LaneType;
  y: number; // world Y coordinate
  obstacles: ObstacleModel[];
  direction: 1 | -1;
  speed: number;
  trainWarningTimer?: number; // for railroad warning lights
  isTrainPassing?: boolean;
}

export interface PlayerModel {
  x: number;
  y: number;
  gridX: number; // grid column (0 to cols-1)
  gridY: number; // lane index (0 to ...)
  targetX: number;
  targetY: number;
  isHopping: boolean;
  hopProgress: number;
  direction: 'up' | 'down' | 'left' | 'right';
  dead: boolean;
  deathReason?: 'car' | 'drown' | 'train' | 'hawk';
}

export interface CrossyChickenState {
  player: PlayerModel;
  lanes: LaneModel[];
  coins: CoinModel[];
  cameraY: number;
  distance: number;
  score: number;
  highScore: number;
  coinsCount: number;
  idleTimer: number; // Hawk swoops if player stays idle > 4.0s
  hawkActive: boolean;
  hawkY: number;
  isGameOver: boolean;
  events: Array<{ type: string; [key: string]: any }>;
}

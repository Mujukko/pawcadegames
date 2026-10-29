export type MahjongConnectTileType =
  | 'carrot'
  | 'corn'
  | 'pumpkin'
  | 'strawberry'
  | 'apple'
  | 'sunflower'
  | 'egg'
  | 'milk'
  | 'wheat'
  | 'honey'
  | 'cherry'
  | 'watering_can';

export interface GridPoint {
  r: number;
  c: number;
}

export interface ConnectTile {
  id: string;
  r: number;
  c: number;
  type: MahjongConnectTileType;
  isEmpty: boolean;
}

export interface ConnectMoveHint {
  tile1: GridPoint;
  tile2: GridPoint;
  path: GridPoint[];
}

export type GravityMode = 'none' | 'fall_down' | 'slide_left';

export interface ConnectLevelConfig {
  levelNumber: number;
  rows: number;
  cols: number;
  timeLimit: number; // seconds
  gravity: GravityMode;
  tilePool: MahjongConnectTileType[];
}

export interface ConnectGameState {
  level: number;
  score: number;
  timeRemaining: number;
  totalTime: number;
  rows: number;
  cols: number;
  grid: (ConnectTile | null)[][];
  selectedTile: GridPoint | null;
  activePath: GridPoint[] | null;
  pathTimer: number;
  shufflesRemaining: number;
  hintsRemaining: number;
  isGameOver: boolean;
  isWon: boolean;
  gravity: GravityMode;
  events: Array<{ type: string; points?: number; path?: GridPoint[] }>;
}

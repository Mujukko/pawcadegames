// Types for Barnyard Tile Match: Triple Pick (farm-tile-triple)

export type FarmTileType =
  | 'apple'
  | 'corn'
  | 'pumpkin'
  | 'eggplant'
  | 'strawberry'
  | 'honey'
  | 'chick'
  | 'sunflower';

export interface FarmTileMeta {
  type: FarmTileType;
  name: string;
  emoji: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}

export interface BoardTile {
  id: number;
  type: FarmTileType;
  x: number; // grid or coordinate units
  y: number;
  layer: number; // 0 = base, 1 = mid, 2 = top
  width: number;
  height: number;
  isBlocked: boolean;
  inTray: boolean;
  cleared: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  targetMatches: number;
  tileDefs: { type: FarmTileType; x: number; y: number; layer: number }[];
}

export interface TileTripleState {
  level: number;
  tiles: BoardTile[];
  tray: BoardTile[];
  maxTrayCapacity: number;
  score: number;
  highScore: number;
  moves: number;
  matchesMade: number;
  status: 'playing' | 'won' | 'lost';
  history: {
    tiles: BoardTile[];
    tray: BoardTile[];
    score: number;
  }[];
}

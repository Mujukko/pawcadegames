// Types for Farm Pipe Flow: Barnyard Plumber (farm-pipe-flow)

export type Direction = 'north' | 'east' | 'south' | 'west';

export const DIR_NORTH = 1 << 0; // 1
export const DIR_EAST = 1 << 1;  // 2
export const DIR_SOUTH = 1 << 2; // 4
export const DIR_WEST = 1 << 3;  // 8

export type PipeType =
  | 'straight' // 2 opposite ports (e.g. North-South)
  | 'elbow'    // 2 adjacent ports (e.g. North-East)
  | 'tee'      // 3 ports (e.g. North-East-South)
  | 'cross'    // 4 ports
  | 'source'   // Water pump starting point
  | 'target';  // Thirsty crop destination

export interface PipeTile {
  row: number;
  col: number;
  type: PipeType;
  ports: number; // Bitmask of DIR_NORTH, DIR_EAST, DIR_SOUTH, DIR_WEST
  rotation: number; // 0, 90, 180, 270 degrees
  isFixed: boolean; // Source or target might be locked
  hasWater: boolean; // Currently connected to water source
  targetLabel?: string; // e.g. "🥕 Carrots", "🍓 Berries", "🐮 Trough"
}

export interface PipeLevelConfig {
  id: number;
  name: string;
  rows: number;
  cols: number;
  grid: {
    type: PipeType;
    initialRotation: number; // 0, 90, 180, 270
    isFixed?: boolean;
    targetLabel?: string;
  }[][];
}

export interface PipeGameState {
  level: number;
  rows: number;
  cols: number;
  grid: PipeTile[][];
  moves: number;
  score: number;
  highScore: number;
  status: 'playing' | 'won';
  waterFlowPercent: number; // 0 to 100% of pipeline connected
  history: {
    row: number;
    col: number;
    prevRotation: number;
  }[];
}

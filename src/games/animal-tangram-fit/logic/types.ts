export type GameStatus =
  | 'ready'
  | 'playing'
  | 'stage_cleared'
  | 'victory';

export type WoodColor = 'cherry' | 'walnut' | 'oak' | 'pine' | 'mahogany';

export interface TangramPiece {
  id: string;
  name: string;
  color: WoodColor;
  shape: number[][]; // 2D matrix (1 for filled cell, 0 for empty)
  // Placement on board (null if in tray)
  placedRow: number | null;
  placedCol: number | null;
}

export interface SilhouetteCell {
  row: number;
  col: number;
}

export interface StageConfig {
  stage: number;
  title: string;
  animalName: string;
  animalMascot: string;
  gridRows: number;
  gridCols: number;
  targetCells: SilhouetteCell[];
  pieces: Array<{
    id: string;
    name: string;
    color: WoodColor;
    shape: number[][];
  }>;
}

export interface TangramState {
  status: GameStatus;
  stage: number;
  totalStages: number;
  score: number;
  selectedPieceId: string | null;
  pieces: TangramPiece[];
  boardGrid: (string | null)[][]; // piece id placed at (r, c), or null
  targetMask: boolean[][]; // true if cell is part of target silhouette
  totalTargetCells: number;
  filledTargetCells: number;
  highScore: number;
}

export type TangramEvent =
  | { type: 'piece_selected'; pieceId: string }
  | { type: 'piece_placed'; pieceId: string; row: number; col: number }
  | { type: 'piece_removed'; pieceId: string }
  | { type: 'piece_rotated'; pieceId: string }
  | { type: 'stage_clear'; stage: number; animalName: string }
  | { type: 'victory'; finalScore: number };

export type TetrominoType = 'I' | 'J' | 'L' | 'O' | 'S' | 'T' | 'Z';

export type CellValue = TetrominoType | null;

export type Board = CellValue[][]; // 20 rows x 10 cols (0-indexed, row 0 is top)

export interface Piece {
  type: TetrominoType;
  rotation: number; // 0, 1, 2, 3 (0°, 90°, 180°, 270°)
  x: number; // grid column (0 to 9)
  y: number; // grid row (0 to 19, can be negative when spawning)
  shape: number[][]; // 2D matrix (1 for block, 0 for empty)
}

export interface FarmerReaction {
  type: 'cheer' | 'wave' | 'thumbs_up' | 'super_wow';
  text: string; // e.g. "WOW! 🌾", "GREAT! 🚜", "YEE-HAW! 🎉"
  lines: number;
  timestamp: number;
}

export interface LineClearEvent {
  rows: number[]; // row indices that were cleared
  linesCount: number;
  scoreGained: number;
  siloProgressBefore: number;
  siloProgressAfter: number;
  siloCompleted: boolean;
  farmerReaction: FarmerReaction;
}

export interface TetrisGameState {
  board: Board;
  currentPiece: Piece | null;
  ghostY: number; // projected landing row for current piece
  holdPiece: TetrominoType | null;
  canHold: boolean;
  nextQueue: TetrominoType[];
  score: number;
  highScore: number;
  linesCleared: number;
  level: number;
  siloProgress: number; // 0 to 100%
  siloMaxLines: number; // lines to fill one complete silo (e.g. 10)
  silosFilled: number; // total silos filled
  lastLineClear: LineClearEvent | null;
  combo: number;
  isGameOver: boolean;
  isPaused: boolean;
  dropInterval: number; // ms between automatic gravity drop steps
}

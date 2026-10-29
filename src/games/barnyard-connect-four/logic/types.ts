export type Player = 1 | 2; // 1 = Yellow Chicks (P1), 2 = Red Apples (P2 / AI)

export type CellValue = 0 | 1 | 2; // 0 = Empty

export type GameMode = 'ai' | 'local_2p';

export type AiDifficulty = 'easy' | 'medium' | 'hard';

export interface BoardPosition {
  row: number;
  col: number;
}

export interface WinningLine {
  player: Player;
  positions: BoardPosition[];
}

export interface DroppingToken {
  col: number;
  targetRow: number;
  currentRow: number;
  player: Player;
  progress: number; // 0 to 1
}

export interface ConnectFourState {
  board: CellValue[][]; // 6 rows (0 is top, 5 is bottom), 7 columns
  currentPlayer: Player;
  winner: Player | 'draw' | null;
  winningLine: WinningLine | null;
  mode: GameMode;
  aiDifficulty: AiDifficulty;
  isAiThinking: boolean;
  moveHistory: { col: number; player: Player }[];
  p1Score: number;
  p2Score: number;
  draws: number;
  hoveredCol: number | null;
}

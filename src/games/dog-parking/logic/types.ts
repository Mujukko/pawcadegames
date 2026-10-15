export type Orientation = 'horizontal' | 'vertical';

export type DogBreed = 
  | 'hero'        // Star Corgi (Golden/Yellow)
  | 'corgi'       // Amber Corgi
  | 'pug'         // Charcoal/Fawn Pug
  | 'shiba'       // Red Shiba Inu
  | 'dachshund'   // Chocolate Sausage Dog (Length 3)
  | 'retriever'   // Honey Golden Retriever (Length 3)
  | 'dalmatian'   // White with black spots (Length 2 or 3)
  | 'poodle';     // Fluffy Apricot Poodle

export interface Dog {
  id: string;
  breed: DogBreed;
  name: string;
  x: number; // grid col (0..width-1)
  y: number; // grid row (0..height-1)
  length: number; // 2 or 3
  orientation: Orientation;
  isHero?: boolean;
}

export interface Obstacle {
  id: string;
  x: number;
  y: number;
  type: 'hydrant' | 'crate' | 'fence';
}

export interface ExitGate {
  side: 'right' | 'left' | 'top' | 'bottom';
  coordinate: number; // row index if right/left, col index if top/bottom
}

export interface LevelConfig {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  width: number;
  height: number;
  dogs: Dog[];
  obstacles?: Obstacle[];
  exit: ExitGate;
  optimalMoves?: number;
  hint?: string;
}

export interface GameState {
  levelId: number;
  width: number;
  height: number;
  dogs: Dog[];
  obstacles: Obstacle[];
  exit: ExitGate;
  movesCount: number;
  isCompleted: boolean;
  history: { dogId: string; fromX: number; fromY: number; toX: number; toY: number }[];
}

export interface MoveResult {
  valid: boolean;
  newPosition?: { x: number; y: number };
  reason?: string;
  exited?: boolean;
}

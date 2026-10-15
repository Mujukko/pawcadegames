export type Orientation = 'horizontal' | 'vertical';

export type CatBreed = 
  | 'hero'          // Luna the Star Calico (White with ginger/dark patches, star medal)
  | 'calico'        // Calico kitty
  | 'siamese'       // Cream with chocolate points and sapphire eyes
  | 'tabby'         // Warm ginger marmalade striped cat
  | 'black'         // Midnight black/tuxedo cat with golden eyes
  | 'russian_blue'  // Sleek silvery slate-blue cat with emerald eyes
  | 'persian'       // Fluffy cloud-white Persian
  | 'maine_coon'    // Big fluffy striped Maine Coon (Length 3)
  | 'bengal';       // Golden leopard-spotted Bengal (Length 3)

export interface Cat {
  id: string;
  breed: CatBreed;
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
  type: 'yarn' | 'box' | 'scratching_post';
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
  cats: Cat[];
  obstacles?: Obstacle[];
  exit: ExitGate;
  optimalMoves?: number;
  hint?: string;
}

export interface GameState {
  levelId: number;
  width: number;
  height: number;
  cats: Cat[];
  obstacles: Obstacle[];
  exit: ExitGate;
  movesCount: number;
  isCompleted: boolean;
  history: { catId: string; fromX: number; fromY: number; toX: number; toY: number }[];
}

export interface MoveResult {
  valid: boolean;
  newPosition?: { x: number; y: number };
  reason?: string;
  exited?: boolean;
}

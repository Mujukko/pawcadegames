export type TileType = 'empty' | 'wall' | 'ice';

export type FruitType = 'strawberry' | 'banana' | 'watermelon' | 'grape';

export interface FruitItem {
  id: string;
  x: number; // Grid column (0-indexed)
  y: number; // Grid row (0-indexed)
  type: FruitType;
  collected: boolean;
  wave: number; // Which wave this fruit belongs to (1 or 2)
}

export interface EnemyEntity {
  id: string;
  x: number; // Continuous or grid coordinate
  y: number;
  dirX: number;
  dirY: number;
  speed: number;
  type: 'fox' | 'wolf';
}

export interface BadIceCreamPlayer {
  x: number; // Grid column (float during movement interpolation)
  y: number; // Grid row
  targetX: number;
  targetY: number;
  facingX: number; // -1, 0, 1
  facingY: number; // -1, 0, 1
  isMoving: boolean;
  lives: number;
  score: number;
}

export interface BadIceCreamState {
  levelIndex: number;
  gridCols: number;
  gridRows: number;
  grid: TileType[][]; // [row][col]
  player: BadIceCreamPlayer;
  enemies: EnemyEntity[];
  fruits: FruitItem[];
  currentWave: number;
  status: 'playing' | 'level_cleared' | 'victory' | 'game_over';
  totalLevels: number;
}

export interface BadIceCreamInput {
  moveX?: number; // -1 (left), 1 (right), 0
  moveY?: number; // -1 (up), 1 (down), 0
  action?: boolean; // Ice breath (create/break ice line)
}

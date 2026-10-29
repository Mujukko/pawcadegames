export type DuckHat = 'none' | 'flower' | 'straw' | 'sailor' | 'crown';

export interface Position2D {
  x: number;
  y: number;
}

export interface MamaDuckState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  speed: number;
  activeHat: DuckHat;
  trail: Position2D[];
}

export interface LostDuckling {
  id: string;
  x: number;
  y: number;
  isFollowing: boolean;
  followIndex: number; // 0, 1, 2... behind mama
}

export interface RowboatHazard {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  speedX: number;
  minX: number;
  maxX: number;
}

export interface SnappingTurtle {
  id: string;
  x: number;
  y: number;
  radius: number;
  patrolAngle: number;
  orbitCenterX: number;
  orbitCenterY: number;
  orbitRadius: number;
  speed: number;
}

export interface ReedsNest {
  x: number;
  y: number;
  radius: number;
  totalRescued: number;
  nestLevel: number; // 1 to 5
}

export interface RescueGameState {
  wave: number;
  status: 'ready' | 'playing' | 'game_over' | 'victory';
  score: number;
  ducksInLine: number;
  highestLine: number;
  elapsedTime: number;
  mama: MamaDuckState;
  ducklings: LostDuckling[];
  boats: RowboatHazard[];
  turtles: SnappingTurtle[];
  nest: ReedsNest;
  unlockedHats: DuckHat[];
  highScore: number;
}

export interface PondInput {
  targetX?: number; // Pointer / touch navigation
  targetY?: number;
  moveLeft?: boolean; // Keyboard arrows/WASD
  moveRight?: boolean;
  moveUp?: boolean;
  moveDown?: boolean;
  boost?: boolean; // Turbo paddle
}

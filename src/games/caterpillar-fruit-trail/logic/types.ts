export type Direction = 'up' | 'down' | 'left' | 'right';
export type FruitType = 'cherry' | 'strawberry' | 'apple' | 'golden_apple' | 'leaf';
export type ObstacleType = 'hedge' | 'rock' | 'thorn';

export interface BodySegment {
  x: number;
  y: number;
}

export interface GardenFruit {
  id: string;
  x: number;
  y: number;
  type: FruitType;
  points: number;
  bonus?: 'speed' | 'double';
}

export interface GardenObstacle {
  id: string;
  x: number;
  y: number;
  type: ObstacleType;
}

export interface GardenStageConfig {
  stage: number;
  name: string;
  subtitle: string;
  targetFruits: number;
  targetScore: number;
  speed: number; // updates per second (e.g. 7.5 to 11)
  cols: number;
  rows: number;
  obstacles: Array<{ x: number; y: number; type: ObstacleType }>;
}

export interface CaterpillarSparkle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface CaterpillarFloatingBadge {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface CaterpillarState {
  status: 'ready' | 'crawling' | 'stage_cleared' | 'game_over' | 'victory';
  stage: number;
  score: number;
  highScore: number;
  segments: BodySegment[];
  direction: Direction;
  nextDirection: Direction;
  fruits: GardenFruit[];
  obstacles: GardenObstacle[];
  fruitsEaten: number;
  targetFruits: number;
  moveTimer: number;
  moveInterval: number; // seconds per grid step
  speedBoostRemaining: number;
  sparkles: CaterpillarSparkle[];
  floatingBadges: CaterpillarFloatingBadge[];
  timeInState: number;
  cols: number;
  rows: number;
  cellSize: number;
  width: number;
  height: number;
}

export interface CaterpillarEvent {
  type: 'fruit_eat' | 'speed_boost' | 'crash' | 'stage_cleared' | 'victory';
  fruitType?: FruitType;
  pointsEarned?: number;
  x?: number;
  y?: number;
}

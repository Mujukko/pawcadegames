export interface Vector2D {
  x: number;
  y: number;
}

export interface PatrolConfig {
  axis: 'x' | 'y';
  min: number; // Minimum boundary coordinate
  max: number; // Maximum boundary coordinate
  speed: number; // Pixels per second
}

export interface Obstacle {
  id: string;
  type: 'fence' | 'hay_bale' | 'tractor' | 'barn_wall' | 'water_trough' | 'rock' | 'sheep';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number; // radians
  patrol?: PatrolConfig;
}

export interface ParkingSlot {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number; // radians
  targetAccuracy: number; // e.g. 80 (80%)
  requiredHoldSeconds: number; // e.g. 0.8 seconds
}

export interface CowState {
  x: number;
  y: number;
  rotation: number; // radians (0 = facing right)
  speed: number;
  width: number; // length of cow along its facing direction
  height: number; // width across body
  health: number; // 0 to 100%
  maxSpeed: number;
  maxReverseSpeed: number;
  acceleration: number;
  turnSpeed: number;
  friction: number;
}

export interface MilkBottle {
  id: string;
  x: number;
  y: number;
  collected?: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Expert';
  farmWidth: number;
  farmHeight: number;
  cowStart: { x: number; y: number; rotation: number };
  parkingSlot: ParkingSlot;
  obstacles: Obstacle[];
  milkBottles: MilkBottle[];
  targetAccuracy: number;
  hint?: string;
}

export interface PlayerInput {
  up?: boolean;
  down?: boolean;
  left?: boolean;
  right?: boolean;
  forward?: boolean;
  reverse?: boolean;
  turnLeft?: boolean;
  turnRight?: boolean;
  brake?: boolean;
}

export interface GameState {
  levelId: number;
  cow: CowState;
  obstacles?: Obstacle[];
  parkingAccuracy: number; // 0 - 100%
  isColliding: boolean;
  collidingWithIds: string[];
  parkedHoldTime: number; // seconds currently held in park
  milkBottles: MilkBottle[];
  milkCollected: number;
  totalMilk: number;
  justCollectedMilkId?: string | null;
  elapsedTime: number;
  isCompleted: boolean;
  isGameOver: boolean;
}

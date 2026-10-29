export type HorseLane = 0 | 1 | 2; // 0: Top, 1: Middle, 2: Bottom

export type DerbyTrackId = 'meadow-cup' | 'autumn-steeplechase' | 'sunset-championship';

export type JumpGrade = 'none' | 'ok' | 'great' | 'perfect';

export interface DerbyObstacle {
  id: string;
  distance: number; // in meters along track
  lane: HorseLane;
  type: 'fence' | 'water' | 'hay_bale';
  width: number;
  cleared: boolean;
  hit: boolean;
}

export interface DerbyCollectible {
  id: string;
  distance: number;
  lane: HorseLane;
  type: 'horseshoe' | 'carrot' | 'golden_apple';
  collected: boolean;
}

export interface RivalHorse {
  id: string;
  name: string;
  color: string;
  maneColor: string;
  lane: HorseLane;
  distance: number;
  speed: number;
  targetSpeed: number;
  jumpTimer: number;
  isJumping: boolean;
  finished: boolean;
  finishTime: number | null;
}

export interface PlayerHorse {
  lane: HorseLane;
  targetLane: HorseLane;
  laneY: number; // smoothly interpolated Y coordinate
  distance: number; // meters traveled
  speed: number; // current speed m/s
  maxSpeed: number;
  acceleration: number;
  stamina: number; // 0 to 100
  maxStamina: number;
  isJumping: boolean;
  jumpY: number; // vertical height offset from ground
  jumpVelocity: number;
  lastJumpGrade: JumpGrade;
  gradeTimer: number;
  boostTimer: number; // speed boost duration
  stumbleTimer: number; // slowdown duration on hurdle hit
}

export interface DerbyTrackConfig {
  id: DerbyTrackId;
  name: string;
  totalDistance: number; // meters, e.g. 800, 1200, 1600
  targetTimeGold: number; // seconds
  rivalCount: number;
  obstacleInterval: number;
  collectibleInterval: number;
}

export type DerbyGameStatus = 'countdown' | 'racing' | 'finished';

export interface DerbyEvent {
  type: 'gallop_step' | 'jump_start' | 'jump_land' | 'jump_grade' | 'obstacle_hit' | 'collect_item' | 'stamina_low' | 'boost_start' | 'finish_race';
  grade?: JumpGrade;
  itemType?: string;
  rank?: number;
}

export interface DerbyGameState {
  track: DerbyTrackConfig;
  status: DerbyGameStatus;
  countdownTimer: number; // 3, 2, 1, GO
  elapsedTime: number; // seconds
  player: PlayerHorse;
  rivals: RivalHorse[];
  obstacles: DerbyObstacle[];
  collectibles: DerbyCollectible[];
  score: number;
  horseshoesCollected: number;
  carrotsEaten: number;
  finalRank: number; // 1 = 1st place, 2 = 2nd, etc.
  trophy: 'gold' | 'silver' | 'bronze' | 'none';
  events: DerbyEvent[];
}

export type TrackLane = -1 | 0 | 1;

export type ObstacleType = 'fence' | 'tractor' | 'hay_bale' | 'low_beam';
export type PowerUpType = 'magnet' | 'sneakers' | 'multiplier';

export interface SubwayObstacle {
  id: string;
  lane: TrackLane;
  z: number; // distance in front of player (meters/px)
  type: ObstacleType;
  width: number;
  height: number;
  canJumpOver: boolean;
  canRollUnder: boolean;
}

export interface SubwayCoin {
  id: string;
  lane: TrackLane;
  z: number;
  y: number; // ground level or in-air for jumps
  collected: boolean;
}

export interface SubwayPowerUp {
  id: string;
  lane: TrackLane;
  z: number;
  type: PowerUpType;
  collected: boolean;
}

export interface PlayerRunner {
  lane: TrackLane;
  targetLane: TrackLane;
  laneX: number; // current interpolated X (-120 to +120)
  y: number; // jump height
  vy: number;
  isJumping: boolean;
  isRolling: boolean;
  rollTimer: number;
  activePowerUp: PowerUpType | null;
  powerUpTimeRemaining: number;
}

export interface SubwayGameState {
  status: 'ready' | 'playing' | 'crashed' | 'game_over';
  speed: number;
  distance: number;
  coins: number;
  score: number;
  highScore: number;
  multiplier: number;
  player: PlayerRunner;
  obstacles: SubwayObstacle[];
  coinsList: SubwayCoin[];
  powerUps: SubwayPowerUp[];
  events: Array<{ type: 'jump' | 'roll' | 'coin' | 'powerup' | 'crash' }>;
}

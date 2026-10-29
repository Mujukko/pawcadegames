export type ObstacleType = 'ice_cone' | 'snow_boulder' | 'fence_post' | 'crevasse';
export type PickupType = 'frost_berry' | 'boost_pad' | 'ramp_jump';

export interface TrackObstacle {
  id: string;
  z: number; // distance in meters along track
  x: number; // normalized lateral position (-0.8 to 0.8)
  width: number;
  type: ObstacleType;
  hit?: boolean;
}

export interface TrackPickup {
  id: string;
  z: number;
  x: number;
  type: PickupType;
  collected?: boolean;
}

export interface DodoEntity {
  x: number; // normalized -0.9 to 0.9 (0 = center of track)
  vx: number;
  targetX: number;
  z: number; // forward position in meters
  y: number; // airborne height (0 = on ice)
  vy: number;
  isAirborne: boolean;
  hasShield: boolean;
  skateTilt: number; // tilt angle for visual skate leaning
}

export type DodoGameStatus = 'ready' | 'skating' | 'crashed' | 'victory';

export type DodoGameEvent =
  | { type: 'start' }
  | { type: 'boost'; speed: number }
  | { type: 'jump' }
  | { type: 'land' }
  | { type: 'berry_pickup'; x: number; z: number; points: number }
  | { type: 'shield_lost' }
  | { type: 'crash'; obstacleType: ObstacleType; distance: number }
  | { type: 'track_clear'; trackIndex: number; distance: number; score: number };

export interface DodoGameState {
  status: DodoGameStatus;
  trackIndex: number; // 1, 2, or 3
  distance: number;
  targetDistance: number;
  speed: number;
  baseSpeed: number;
  maxSpeed: number;
  score: number;
  frostBerries: number;
  dodo: DodoEntity;
  obstacles: TrackObstacle[];
  pickups: TrackPickup[];
  events: DodoGameEvent[];
}

export type KartAnimal = 'corgi' | 'cow' | 'chicken' | 'piglet';

export interface KartInput {
  steer: number; // -1 (left) to +1 (right)
  gas: boolean;
  reverse: boolean;
  drift: boolean;
}

export interface TrackPoint {
  x: number;
  y: number;
}

export interface TrackObstacle {
  id: string;
  type: 'mud' | 'slick' | 'hay_bale';
  x: number;
  y: number;
  radius: number;
}

export interface TrackPickup {
  id: string;
  type: 'turbo_corn' | 'golden_carrot';
  x: number;
  y: number;
  radius: number;
  collected: boolean;
  respawnTimer: number;
}

export interface KartRacer {
  id: string;
  name: string;
  animal: KartAnimal;
  color: string;
  x: number;
  y: number;
  angle: number; // in radians
  speed: number;
  steerAngle: number;
  isDrifting: boolean;
  driftDirection: number; // -1 for left drift, +1 for right drift
  driftCharge: number; // accumulates 0 to 1
  spinTimer: number; // for slick spin-out
  mudTimer: number; // for mud slowdown
  turboTimer: number; // for nitrous boost
  lap: number;
  currentCheckpoint: number;
  totalDistance: number;
  totalTime: number;
  isAI: boolean;
  aiTargetWaypoint: number;
  rank: number;
  finished: boolean;
}

export interface TrackConfig {
  id: string;
  name: string;
  lapsRequired: number;
  trackWidth: number;
  waypoints: TrackPoint[];
  obstacles: TrackObstacle[];
  pickups: TrackPickup[];
  startPositions: Array<{ x: number; y: number; angle: number }>;
}

export type KartEventType =
  | 'engine_rev'
  | 'drift_start'
  | 'drift_boost'
  | 'mud_hit'
  | 'slick_spin'
  | 'turbo_collect'
  | 'checkpoint_pass'
  | 'lap_complete'
  | 'final_lap'
  | 'race_finish';

export interface KartEvent {
  type: KartEventType;
  racerId: string;
  x?: number;
  y?: number;
  timestamp: number;
}

export interface BarnyardKartState {
  track: TrackConfig;
  trackIndex: number;
  racers: KartRacer[];
  playerRank: number;
  playerLap: number;
  totalLaps: number;
  raceTime: number;
  bestLapTime: number;
  currentLapTime: number;
  status: 'ready' | 'racing' | 'finished';
  countdown: number; // 3, 2, 1, 0 (Go!)
  events: KartEvent[];
}

export interface FlightUpgradeState {
  cannonPower: number; // Level 1 to 5
  aerodynamics: number; // Level 1 to 5 (reduces air drag)
  rocketNitro: number; // Level 1 to 5 (number of rocket thruster bursts)
  bouncyShoes: number; // Level 1 to 5 (bounce retention)
  coinMagnet: number; // Level 1 to 5 (attraction radius)
}

export interface SkyEntity {
  id: string;
  type: 'coin' | 'fuel_soda' | 'star_balloon' | 'bouncy_sheep' | 'hay_bale' | 'mud_puddle';
  x: number;
  y: number; // 0 = ground, positive = up into sky
  radius: number;
  collected?: boolean;
}

export type LaunchPhase = 'aiming_angle' | 'charging_power' | 'flying' | 'skidding' | 'landed';

export type CannonEventType =
  | 'cannon_fire'
  | 'rocket_boost'
  | 'sheep_bounce'
  | 'hay_bounce'
  | 'mud_splash'
  | 'coin_collect'
  | 'fuel_collect'
  | 'balloon_pop'
  | 'milestone_reached'
  | 'flight_landed';

export interface CannonEvent {
  type: CannonEventType;
  x?: number;
  y?: number;
  value?: number;
  timestamp: number;
}

export interface PiggyCannonState {
  phase: LaunchPhase;
  angleDeg: number; // 15 to 75 degrees
  angleDirection: number; // +1 or -1 for oscillating needle
  powerRatio: number; // 0 to 1
  powerDirection: number;
  x: number; // distance in meters/pixels
  y: number; // altitude in meters/pixels
  vx: number;
  vy: number;
  rotation: number; // in radians
  fuelRemaining: number; // 0 to maxFuel
  maxFuel: number;
  bouncesRemaining: number;
  distanceTraveled: number;
  maxAltitude: number;
  coinsEarnedThisRun: number;
  totalCoins: number;
  bestDistance: number;
  upgrades: FlightUpgradeState;
  entities: SkyEntity[];
  events: CannonEvent[];
  flightTime: number;
}

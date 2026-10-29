export type StageId = 'clover_pasture' | 'autumn_orchard' | 'windmill_ridge' | 'muddy_mountain';

export interface StageConfig {
  id: StageId;
  name: string;
  themeColor: string;
  targetMeters: number; // e.g. 500m
  baseFriction: number;
  hillsFrequency: number;
  hillsAmplitude: number;
  description: string;
}

export interface VehicleInput {
  gas: boolean;
  brake: boolean;
}

export interface WheelState {
  offsetX: number;
  offsetY: number;
  radius: number;
  worldX: number;
  worldY: number;
  angularVel: number;
  isGrounded: boolean;
  suspensionCompression: number; // 0 to 1
}

export interface TractorChassis {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // radians
  angularVelocity: number;
  width: number;
  height: number;
  rearWheel: WheelState;
  frontWheel: WheelState;
}

export interface CoinPickup {
  id: string;
  x: number;
  y: number;
  value: number;
  collected: boolean;
}

export interface FuelPickup {
  id: string;
  x: number;
  y: number;
  amount: number;
  collected: boolean;
}

export interface StuntEvent {
  id: string;
  type: 'backflip' | 'frontflip' | 'big_air' | 'fuel_boost';
  label: string;
  points: number;
  duration: number; // remaining display timer in seconds
}

export type GameStatus = 'ready' | 'driving' | 'crashed' | 'out_of_fuel' | 'victory';

export interface TractorHillClimbState {
  chassis: TractorChassis;
  fuel: number; // 0 to 100
  maxFuel: number;
  distance: number; // in meters (1m = 12 world units)
  bestDistance: number;
  coins: number;
  score: number;
  stageId: StageId;
  stageIndex: number;
  status: GameStatus;
  airTime: number; // seconds
  continuousAirRotation: number; // accumulated radians in air
  activeStunt: StuntEvent | null;
  coinsList: CoinPickup[];
  fuelList: FuelPickup[];
  timeElapsed: number;
}

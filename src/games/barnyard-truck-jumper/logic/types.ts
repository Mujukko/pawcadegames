export type TruckType = 'hay_wagon' | 'milk_tanker' | 'livestock_crate' | 'flatbed';

export interface TruckObstacle {
  id: string;
  type: TruckType;
  x: number; // lane position (-120 to +120)
  y: number; // elevation
  z: number; // distance down the highway
  width: number;
  length: number;
  height: number;
  speed: number;
  swaySpeed: number;
  swayAmplitude: number;
  swayPhase: number;
}

export interface OverheadArch {
  id: string;
  name: string;
  z: number;
  clearanceHeight: number; // player must slide if standing height > clearance
}

export interface HighwayCoin {
  id: string;
  x: number;
  y: number;
  z: number;
  value: number;
  collected: boolean;
}

export interface GoatPlayer {
  x: number;
  y: number; // 0 is road floor, truck roofs are at height ~35-45
  z: number;
  vx: number;
  vy: number;
  vz: number;
  isGrounded: boolean;
  currentTruckId: string | null;
  jumpsRemaining: number;
  isSliding: boolean;
  slideTimer: number;
}

export interface JumperLevelConfig {
  id: string;
  name: string;
  targetMeters: number;
  description: string;
  convoyDensity: number; // frequency of trucks
  truckSpeed: number;
}

export interface JumperGameState {
  levelIndex: number;
  status: 'ready' | 'playing' | 'fallen' | 'victory';
  distanceMeters: number;
  targetMeters: number;
  score: number;
  comboStreak: number;
  highestCombo: number;
  player: GoatPlayer;
  trucks: TruckObstacle[];
  arches: OverheadArch[];
  coins: HighwayCoin[];
  unlockedLevels: number;
  bestDistances: number[];
}

export interface JumperInput {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  slide: boolean;
}

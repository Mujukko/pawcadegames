export type DuckHat = 'none' | 'headband' | 'cap' | 'crown' | 'goggles' | 'straw_hat';

export interface DuckStats {
  runningLevel: number;
  runningXp: number;
  flyingLevel: number;
  flyingXp: number;
  swimmingLevel: number;
  swimmingXp: number;
  energyLevel: number;
  coins: number;
  activeHat: DuckHat;
  unlockedHats: DuckHat[];
  racesWon: number;
}

export type GameView = 'hub' | 'train_running' | 'train_flying' | 'train_swimming' | 'race' | 'shop';

export interface RunningObstacle {
  id: string;
  x: number;
  y: number;
  type: 'rock' | 'fence';
  passed: boolean;
}

export interface CornSeed {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface SwimmingObstacle {
  id: string;
  x: number;
  y: number; // surface or underwater
  isUnderwater: boolean;
  passed: boolean;
}

export interface RivalDuck {
  name: string;
  color: string;
  hat: DuckHat;
  speed: number;
  progress: number; // 0 to 1000m
  laneY: number;
}

export interface RunningTrainState {
  duckY: number;
  duckVy: number;
  isGrounded: boolean;
  distance: number;
  speed: number;
  obstacles: RunningObstacle[];
  seeds: CornSeed[];
  seedsCollected: number;
  gameOver: boolean;
}

export interface FlyingTrainState {
  duckY: number;
  duckVy: number;
  distance: number;
  speed: number;
  seeds: CornSeed[];
  seedsCollected: number;
  gameOver: boolean;
}

export interface SwimmingTrainState {
  duckY: number; // surface (e.g. 240) or diving (e.g. 320)
  isDiving: boolean;
  distance: number;
  speed: number;
  obstacles: SwimmingObstacle[];
  seeds: CornSeed[];
  seedsCollected: number;
  gameOver: boolean;
}

export interface RaceState {
  raceType: 'sprint' | 'swim_dash' | 'triathlon';
  distanceTotal: number;
  playerProgress: number;
  playerSpeed: number;
  rivals: RivalDuck[];
  finished: boolean;
  winnerName: string | null;
  playerPlace: number | null;
}

export interface DuckChampionState {
  stats: DuckStats;
  view: GameView;
  runningTrain: RunningTrainState | null;
  flyingTrain: FlyingTrainState | null;
  swimmingTrain: SwimmingTrainState | null;
  race: RaceState | null;
  lastTrainedSkill: 'running' | 'flying' | 'swimming' | null;
  lastXpGained: number;
}

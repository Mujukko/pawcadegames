export type ObjectTier = 1 | 2 | 3 | 4 | 5;

export interface FarmObject {
  id: string;
  x: number;
  y: number;
  radius: number; // size for swallowing
  tier: ObjectTier;
  label: string;
  points: number;
  eaten: boolean;
  fallProgress: number; // 0 to 1 as it spirals into hole
}

export interface HolePlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  growthProgress: number;
}

export interface HoleIOState {
  status: 'ready' | 'playing' | 'time_up';
  score: number;
  highScore: number;
  timeRemaining: number;
  player: HolePlayer;
  objects: FarmObject[];
  worldSize: number;
  events: Array<{ type: 'eat' | 'grow' | 'time_up' }>;
}

export interface SiloSector {
  startAngle: number; // in radians
  endAngle: number;
  type: 'safe' | 'hazard' | 'gap';
}

export interface SiloFloor {
  floorIndex: number;
  y: number; // vertical height in world
  sectors: SiloSector[];
  isBroken: boolean;
}

export interface BallPhysics {
  y: number; // height relative to top
  vy: number; // vertical velocity
  radius: number;
  comboStreak: number; // number of floors passed in single drop
  isSuperSmash: boolean; // if comboStreak >= 3, breaks any floor!
}

export interface HelixGameState {
  status: 'ready' | 'playing' | 'game_over' | 'victory';
  towerAngle: number; // rotation in radians
  targetTowerAngle: number;
  ball: BallPhysics;
  floors: SiloFloor[];
  currentFloor: number;
  totalFloors: number;
  score: number;
  highScore: number;
  events: Array<{ type: 'bounce' | 'pass_floor' | 'smash_floor' | 'hit_hazard' | 'victory'; points?: number }>;
}

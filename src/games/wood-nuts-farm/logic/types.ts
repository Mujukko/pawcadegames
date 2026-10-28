export interface PegHole {
  id: number;
  x: number;
  y: number;
  hasScrew: boolean;
  screwColor: string;
}

export interface WoodPlank {
  id: number;
  name: string;
  color: string;
  borderColor: string;
  holeIds: number[];       // Holes that this plank spans across
  pinHoleIds: number[];    // Holes that currently pin this plank down
  isFallen: boolean;
  fallY: number;
  fallRotation: number;
  fallVelocity: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
    radius: number;
  };
}

export interface LevelConfig {
  id: number;
  name: string;
  targetPlanks: number;
  holes: PegHole[];
  planks: Omit<WoodPlank, 'isFallen' | 'fallY' | 'fallRotation' | 'fallVelocity'>[];
}

export interface WoodNutsState {
  level: number;
  maxLevels: number;
  holes: PegHole[];
  planks: WoodPlank[];
  selectedHoleId: number | null;
  moves: number;
  score: number;
  levelCleared: boolean;
  levelFailed: boolean;
  targetPlanks: number;
}

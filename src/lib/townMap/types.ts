export type BuildingId =
  | 'dog-kennel'
  | 'cat-castle'
  | 'dairy-barn'
  | 'hay-silo'
  | 'windmill-flight'
  | 'safari-sanctuary'
  | 'sugar-mill'
  | 'duck-pond'
  | 'farm-supermarket';

export interface StageDefinition {
  stage: number;
  name: string;
  badge: string;
  description: string;
  visualEmoji: string;
  perk: string;
}

export interface TownBuilding {
  id: BuildingId;
  name: string;
  gameId: string;
  gameTitle: string;
  gameRoute: string;
  category: 'pets' | 'farm' | 'arcade';
  mascot: string;
  currentStage: number; // 0 to 3
  maxStage: number; // 3
  metricLabel: string;
  currentMetric: number;
  stageRequirements: number[]; // e.g. [1, 4, 8]
  progressRatio: string; // e.g. "0/1", "1/2", "2/3", "3/3 MAX"
  progressPercent: number; // 0 to 100
  nextStageRequirement: number | null;
  metricRemaining: number;
  stages: StageDefinition[];
  mapCoords: {
    x: number; // percentage 0 - 100
    y: number; // percentage 0 - 100
  };
}

export interface TownProsperity {
  totalStars: number;
  maxStars: number;
  percent: number;
  townLevel: number;
  townTitle: string;
  nextLevelStars: number | null;
}

export interface TownMapState {
  buildings: TownBuilding[];
  prosperity: TownProsperity;
  lastUpdated: number;
}

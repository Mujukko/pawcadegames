export type MudAnimalId = 'piggy' | 'puppy' | 'calf' | 'lamb';

export type CleaningTool = 'sponge' | 'water' | 'towel';

export interface MudPatch {
  id: number;
  x: number; // 0 to 400 normalized or pixel coordinate
  y: number; // 0 to 500
  radius: number;
  dirtLevel: number; // 1.0 (fully muddy) to 0.0 (clean)
  soapLevel: number; // 0.0 to 1.0 (soapy lather)
  isWet: boolean;    // true after water rinse, false after towel dry
}

export interface AnimalStageConfig {
  id: MudAnimalId;
  name: string;
  species: string;
  title: string;
  story: string;
  accentColor: string;
  patches: Array<{ x: number; y: number; radius: number }>;
}

export interface PiggyMudWashState {
  currentStageIndex: number;
  selectedTool: CleaningTool;
  score: number;
  cleanPercent: number;
  stageComplete: boolean;
  gameComplete: boolean;
  patches: MudPatch[];
  ribbonAwarded: boolean;
  totalDirtInitial: number;
}

export interface ScrubResult {
  cleanedAmount: number;
  soapApplied: number;
  rinsedAmount: number;
  driedAmount: number;
  nextCleanPercent: number;
  isStageNowComplete: boolean;
}

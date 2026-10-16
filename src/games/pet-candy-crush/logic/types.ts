export type AnimalType = 'cow' | 'pig' | 'sheep' | 'chicken' | 'duck' | 'horse';
export type TreatType = AnimalType;

export type SpecialType =
  | 'none'
  | 'striped_h'
  | 'striped_v'
  | 'wrapped_bomb'
  | 'rainbow_star'
  | 'square_bomb';

export type BlockerType = 'none' | 'swirl';

export type CandyShapeType =
  | 'sphere'    // Blue round lollipop sphere (Cow)
  | 'bean'      // Red glossy jelly bean / heart pill (Pig)
  | 'cushion'   // Green rounded pillow gummy (Sheep)
  | 'teardrop'  // Yellow glossy Lemon drop (Chicken)
  | 'flower'    // Purple 6-petal flower cluster (Duck)
  | 'lozenge';  // Orange oval lozenge candy (Horse)

export interface AnimalConfig {
  type: AnimalType;
  name: string;
  emoji: string;
  shape: CandyShapeType;
  color: string;
  borderColor: string;
  bgGradient: string;
  topHex: string;
  midHex: string;
  bottomHex: string;
  lipHex: string;
  innerGlowHex: string;
  bubbleColor: string;
  soundName: 'moo' | 'oink' | 'baa' | 'bawk' | 'quack' | 'whinny';
}

export type TreatConfig = AnimalConfig;

export const ANIMAL_CONFIGS: Record<AnimalType, AnimalConfig> = {
  cow: {
    type: 'cow',
    name: 'Blueberry Cow',
    emoji: '🐮',
    shape: 'sphere',
    color: '#0284c7',
    borderColor: '#7dd3fc',
    bgGradient: 'from-sky-400 to-blue-600',
    topHex: '#60a5fa',
    midHex: '#2563eb',
    bottomHex: '#1d4ed8',
    lipHex: '#1e3a8a',
    innerGlowHex: '#dbeafe',
    bubbleColor: '#38bdf8',
    soundName: 'moo',
  },
  pig: {
    type: 'pig',
    name: 'Cherry Piglet',
    emoji: '🐷',
    shape: 'bean',
    color: '#e11d48',
    borderColor: '#fda4af',
    bgGradient: 'from-red-400 to-rose-600',
    topHex: '#ff4d6d',
    midHex: '#e11d48',
    bottomHex: '#be123c',
    lipHex: '#881337',
    innerGlowHex: '#ffe4e6',
    bubbleColor: '#fb7185',
    soundName: 'oink',
  },
  sheep: {
    type: 'sheep',
    name: 'Apple Sheep',
    emoji: '🐑',
    shape: 'cushion',
    color: '#16a34a',
    borderColor: '#86efac',
    bgGradient: 'from-lime-400 to-green-600',
    topHex: '#4ade80',
    midHex: '#16a34a',
    bottomHex: '#15803d',
    lipHex: '#14532d',
    innerGlowHex: '#dcfce7',
    bubbleColor: '#4ade80',
    soundName: 'baa',
  },
  chicken: {
    type: 'chicken',
    name: 'Lemon Chicken',
    emoji: '🐔',
    shape: 'teardrop',
    color: '#eab308',
    borderColor: '#fef08a',
    bgGradient: 'from-yellow-300 to-amber-500',
    topHex: '#fef08a',
    midHex: '#facc15',
    bottomHex: '#ca8a04',
    lipHex: '#854d0e',
    innerGlowHex: '#fef9c3',
    bubbleColor: '#facc15',
    soundName: 'bawk',
  },
  duck: {
    type: 'duck',
    name: 'Grape Duck',
    emoji: '🦆',
    shape: 'flower',
    color: '#9333ea',
    borderColor: '#e9d5ff',
    bgGradient: 'from-fuchsia-400 to-purple-700',
    topHex: '#e879f9',
    midHex: '#a855f7',
    bottomHex: '#7e22ce',
    lipHex: '#4c1d95',
    innerGlowHex: '#f3e8ff',
    bubbleColor: '#d946ef',
    soundName: 'quack',
  },
  horse: {
    type: 'horse',
    name: 'Orange Horse',
    emoji: '🐴',
    shape: 'lozenge',
    color: '#ea580c',
    borderColor: '#fdba74',
    bgGradient: 'from-orange-400 to-orange-600',
    topHex: '#fb923c',
    midHex: '#f97316',
    bottomHex: '#c2410c',
    lipHex: '#7c2d12',
    innerGlowHex: '#ffedd5',
    bubbleColor: '#fb923c',
    soundName: 'whinny',
  },
};

export const TREAT_CONFIGS = ANIMAL_CONFIGS;
export const ALL_ANIMAL_TYPES: AnimalType[] = ['cow', 'pig', 'sheep', 'chicken', 'duck', 'horse'];
export const ALL_TREAT_TYPES = ALL_ANIMAL_TYPES;

export interface TileData {
  id: string; // Unique persistent id for animations
  type: TreatType;
  special: SpecialType;
  row: number;
  col: number;
  isLocked?: boolean;       // X-Cage Lock (unlocked by matching or bomb blast)
  blocker?: BlockerType;    // 'swirl' licorice/hay blocker (cleared by adjacent match or bomb)
  isMatched?: boolean;
  isNew?: boolean;
}

export interface MatchGroup {
  type: TreatType;
  tiles: { row: number; col: number }[];
  isRow: boolean;
  createdSpecial?: {
    row: number;
    col: number;
    special: SpecialType;
    type: TreatType;
  };
}

export interface CascadeStep {
  matches: MatchGroup[];
  clearedCoords: { row: number; col: number }[];
  unlockedCoords?: { row: number; col: number }[];
  scoreGained: number;
  hayGained?: number;
  comboCount: number;
  boardAfterClear: (TileData | null)[][];
  boardAfterDrop: TileData[][];
}

export interface LockedCellConfig {
  row: number;
  col: number;
  animal?: TreatType;
}

export interface LevelGoal {
  levelNumber?: number;
  levelName?: string;
  targetScore: number; // Also used as targetHay!
  targetHay?: number;
  maxMoves: number;
  collectTargets?: Partial<Record<TreatType, number>>;
  targetLocks?: number;
  lockedCells?: LockedCellConfig[];
  swirlCells?: { row: number; col: number }[];
  starThresholds: [number, number, number]; // 1, 2, 3 stars
}

export interface PetCrushGameState {
  levelNumber: number;
  board: TileData[][];
  score: number;
  hayCollected: number;
  locksCleared: number;
  movesRemaining: number;
  collected: Record<TreatType, number>;
  goal: LevelGoal;
  stars: number;
  isGameOver: boolean;
  hasWon: boolean;
  inSugarCrush: boolean;
  comboLevel: number;
  selectedTile: { row: number; col: number } | null;
}

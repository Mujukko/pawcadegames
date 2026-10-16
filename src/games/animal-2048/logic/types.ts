export type Direction = 'up' | 'down' | 'left' | 'right';

export interface AnimalTier {
  value: number; // 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048, 4096
  name: string;
  emoji: string;
  color: string;
  textColor: string;
  soundPitch: number;
}

export interface TileData {
  id: string; // Unique ID for tween tracking
  value: number;
  row: number;
  col: number;
  isNew?: boolean;
  isMerged?: boolean;
}

export interface MergeEvent {
  row: number;
  col: number;
  value: number;
}

export interface SlideResult {
  grid: number[][];
  moved: boolean;
  scoreGained: number;
  merges: MergeEvent[];
}

export interface GameState2048 {
  grid: number[][];
  score: number;
  bestScore: number;
  maxTier: number;
  isGameOver: boolean;
  hasWon: boolean;
  keepPlayingAfterWin: boolean;
  history?: {
    grid: number[][];
    score: number;
  };
}

export const ANIMAL_TIERS: Record<number, AnimalTier> = {
  2: {
    value: 2,
    name: 'Mouse',
    emoji: '🐭',
    color: '#e2e8f0', // Soft Silver Gray
    textColor: '#1e293b',
    soundPitch: 680,
  },
  4: {
    value: 4,
    name: 'Hamster',
    emoji: '🐹',
    color: '#fed7aa', // Peach Gold
    textColor: '#7c2d12',
    soundPitch: 620,
  },
  8: {
    value: 8,
    name: 'Bunny',
    emoji: '🐰',
    color: '#fbcfe8', // Bunny Pink
    textColor: '#831843',
    soundPitch: 580,
  },
  16: {
    value: 16,
    name: 'Cat',
    emoji: '🐱',
    color: '#fdba74', // Calico Orange
    textColor: '#7c2d12',
    soundPitch: 520,
  },
  32: {
    value: 32,
    name: 'Dog',
    emoji: '🐶',
    color: '#fde047', // Golden Puppy
    textColor: '#713f12',
    soundPitch: 480,
  },
  64: {
    value: 64,
    name: 'Fox',
    emoji: '🦊',
    color: '#fb923c', // Rusty Fox
    textColor: '#ffffff',
    soundPitch: 440,
  },
  128: {
    value: 128,
    name: 'Deer',
    emoji: '🦌',
    color: '#a3e635', // Meadow Green
    textColor: '#1a2e05',
    soundPitch: 400,
  },
  256: {
    value: 256,
    name: 'Wild Boar',
    emoji: '🐗',
    color: '#ca8a04', // Boar Bronze
    textColor: '#ffffff',
    soundPitch: 360,
  },
  512: {
    value: 512,
    name: 'Grizzly Bear',
    emoji: '🐻',
    color: '#b45309', // Forest Amber
    textColor: '#ffffff',
    soundPitch: 320,
  },
  1024: {
    value: 1024,
    name: 'Rhino',
    emoji: '🦏',
    color: '#0284c7', // Slate Sky Blue
    textColor: '#ffffff',
    soundPitch: 280,
  },
  2048: {
    value: 2048,
    name: 'Elephant',
    emoji: '🐘',
    color: '#8b5cf6', // Royal Purple Titan
    textColor: '#ffffff',
    soundPitch: 240,
  },
  4096: {
    value: 4096,
    name: 'Blue Whale',
    emoji: '🐋',
    color: '#06b6d4', // Deep Ocean Cyan
    textColor: '#ffffff',
    soundPitch: 200,
  },
};

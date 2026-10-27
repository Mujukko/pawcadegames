export type AnimalType = 'pig' | 'chick' | 'sheep' | 'cow' | 'cat';

export interface AnimalDef {
  type: AnimalType;
  name: string;
  emoji: string;
  width: number;
  height: number;
  color: string;
  borderColor: string;
}

export const ANIMAL_DEFS: Record<AnimalType, AnimalDef> = {
  chick: { type: 'chick', name: 'Chick', emoji: '🐥', width: 64, height: 56, color: '#fef08a', borderColor: '#eab308' },
  pig: { type: 'pig', name: 'Piglet', emoji: '🐷', width: 72, height: 60, color: '#fbcfe8', borderColor: '#ec4899' },
  sheep: { type: 'sheep', name: 'Fluffy Sheep', emoji: '🐑', width: 76, height: 64, color: '#e2e8f0', borderColor: '#94a3b8' },
  cat: { type: 'cat', name: 'Calico Cat', emoji: '🐱', width: 70, height: 60, color: '#fed7aa', borderColor: '#f97316' },
  cow: { type: 'cow', name: 'Bessie Cow', emoji: '🐮', width: 84, height: 70, color: '#ffffff', borderColor: '#1e293b' },
};

export const ANIMAL_KEYS: AnimalType[] = ['chick', 'pig', 'sheep', 'cat', 'cow'];

export interface StackedAnimal {
  id: string;
  type: AnimalType;
  x: number; // center x relative to tower base
  y: number; // vertical height in stack
  width: number;
  height: number;
  rotation: number;
  isPerfect: boolean;
}

export interface FallingAnimal {
  type: AnimalType;
  x: number;
  y: number; // current y pos
  vy: number; // velocity
  width: number;
  height: number;
}

export interface BarnyardTowerState {
  score: number;
  highScore: number;
  height: number; // count of stacked animals
  lives: number;
  maxLives: number;
  wobble: number; // current tilt angle (-30 to +30)
  maxWobble: number;
  combo: number;
  maxCombo: number;
  craneX: number; // 0 to 100 percentage
  craneDir: number; // 1 or -1
  craneSpeed: number; // percent per second
  currentAnimal: AnimalType;
  fallingAnimal: FallingAnimal | null;
  stackedAnimals: StackedAnimal[];
  gameOver: boolean;
  lastEvent: 'none' | 'perfect' | 'good' | 'miss' | 'milestone' | 'gameover';
  milestoneReached: number | null;
}

export const BASE_PLATFORM_WIDTH = 110;
export const PERFECT_THRESHOLD_PX = 8;
export const MAX_WOBBLE_DEGREES = 26;

export function createInitialTowerState(highScore: number = 0): BarnyardTowerState {
  return {
    score: 0,
    highScore,
    height: 0,
    lives: 3,
    maxLives: 3,
    wobble: 0,
    maxWobble: MAX_WOBBLE_DEGREES,
    combo: 0,
    maxCombo: 0,
    craneX: 50,
    craneDir: 1,
    craneSpeed: 45, // oscillation speed
    currentAnimal: 'pig',
    fallingAnimal: null,
    stackedAnimals: [],
    gameOver: false,
    lastEvent: 'none',
    milestoneReached: null,
  };
}

export function getNextAnimalType(height: number): AnimalType {
  const index = (height + Math.floor(Math.random() * 2)) % ANIMAL_KEYS.length;
  return ANIMAL_KEYS[index] || 'chick';
}

export function updateCranePosition(state: BarnyardTowerState, dtSeconds: number): BarnyardTowerState {
  if (state.gameOver) return state;

  let newX = state.craneX + state.craneDir * state.craneSpeed * dtSeconds;
  let newDir = state.craneDir;

  if (newX >= 88) {
    newX = 88;
    newDir = -1;
  } else if (newX <= 12) {
    newX = 12;
    newDir = 1;
  }

  return {
    ...state,
    craneX: newX,
    craneDir: newDir,
  };
}

export function dropCurrentAnimal(state: BarnyardTowerState): BarnyardTowerState {
  if (state.gameOver || state.fallingAnimal !== null) return state;

  const def = ANIMAL_DEFS[state.currentAnimal];
  const falling: FallingAnimal = {
    type: state.currentAnimal,
    x: state.craneX,
    y: 100, // drops from top crane
    vy: 650, // downward fall speed in px/s
    width: def.width,
    height: def.height,
  };

  return {
    ...state,
    fallingAnimal: falling,
    lastEvent: 'none',
  };
}

export interface LandResult {
  state: BarnyardTowerState;
  landed: boolean;
  event: 'perfect' | 'good' | 'miss' | 'gameover' | 'milestone' | 'none';
}

export function resolveAnimalLanding(
  state: BarnyardTowerState,
  targetXPercent: number, // 50 is center of cart
  boardPixelWidth: number = 400
): LandResult {
  if (!state.fallingAnimal) {
    return { state, landed: false, event: 'none' };
  }

  const def = ANIMAL_DEFS[state.fallingAnimal.type];
  const fallingXPixels = (state.fallingAnimal.x / 100) * boardPixelWidth;
  const targetXPixels = (targetXPercent / 100) * boardPixelWidth;
  
  // Calculate top of stack position
  let topXPixels = targetXPixels;
  let topWidth = BASE_PLATFORM_WIDTH;

  if (state.stackedAnimals.length > 0) {
    const topAnimal = state.stackedAnimals[state.stackedAnimals.length - 1];
    topXPixels = topAnimal.x;
    topWidth = topAnimal.width;
  }

  const offsetPixels = fallingXPixels - topXPixels;
  const absOffset = Math.abs(offsetPixels);
  const maxAllowedOffset = (topWidth + def.width) * 0.44;

  // Case 1: Miss! Fell off the platform
  if (absOffset > maxAllowedOffset) {
    const newLives = state.lives - 1;
    const isGameOver = newLives <= 0;
    const newState: BarnyardTowerState = {
      ...state,
      lives: newLives,
      combo: 0,
      fallingAnimal: null,
      currentAnimal: getNextAnimalType(state.height),
      gameOver: isGameOver,
      lastEvent: isGameOver ? 'gameover' : 'miss',
    };
    return { state: newState, landed: false, event: isGameOver ? 'gameover' : 'miss' };
  }

  // Case 2: Perfect or Good Stack
  const isPerfect = absOffset <= PERFECT_THRESHOLD_PX;
  const newCombo = isPerfect ? state.combo + 1 : 0;
  const comboBonus = isPerfect ? newCombo * 50 : 0;
  const basePoints = 100 + (state.height + 1) * 10;
  const addedScore = basePoints + comboBonus;
  const newScore = state.score + addedScore;
  const newHighScore = Math.max(state.highScore, newScore);

  // Wobble physics calculation:
  // If perfect, wobble is gently corrected towards 0.
  // If off-center, wobble tilts in the direction of the offset.
  const tiltAddition = (offsetPixels / maxAllowedOffset) * 5.2;
  let newWobble = isPerfect ? state.wobble * 0.4 : state.wobble + tiltAddition;

  // Check if tower collapses from extreme tilt
  if (Math.abs(newWobble) > MAX_WOBBLE_DEGREES) {
    const newState: BarnyardTowerState = {
      ...state,
      fallingAnimal: null,
      wobble: newWobble,
      gameOver: true,
      lastEvent: 'gameover',
      score: newScore,
      highScore: newHighScore,
    };
    return { state: newState, landed: true, event: 'gameover' };
  }

  const newHeight = state.height + 1;
  const newStackedAnimal: StackedAnimal = {
    id: `animal-${Date.now()}-${newHeight}`,
    type: state.fallingAnimal.type,
    x: fallingXPixels,
    y: newHeight,
    width: def.width,
    height: def.height,
    rotation: isPerfect ? 0 : (offsetPixels / maxAllowedOffset) * 4,
    isPerfect,
  };

  // Milestone triggers (e.g. 5, 10, 20, 35, 50)
  const isMilestone = [5, 10, 20, 35, 50].includes(newHeight);

  // Crane speed gently scales with height for fun arcade tension
  const newCraneSpeed = Math.min(85, 45 + newHeight * 1.8);

  const finalState: BarnyardTowerState = {
    ...state,
    score: newScore,
    highScore: newHighScore,
    height: newHeight,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
    wobble: newWobble,
    craneSpeed: newCraneSpeed,
    fallingAnimal: null,
    currentAnimal: getNextAnimalType(newHeight),
    stackedAnimals: [...state.stackedAnimals, newStackedAnimal],
    lastEvent: isMilestone ? 'milestone' : isPerfect ? 'perfect' : 'good',
    milestoneReached: isMilestone ? newHeight : null,
  };

  return {
    state: finalState,
    landed: true,
    event: isMilestone ? 'milestone' : isPerfect ? 'perfect' : 'good',
  };
}

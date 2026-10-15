export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestMoves: number;
}

const STORAGE_KEY_PROGRESS = 'pawcade_dog_parking_progress';
const STORAGE_KEY_CURRENT_LEVEL = 'pawcade_dog_parking_current_level';

export function getCompletedLevels(): Record<number, LevelProgress> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

export function saveLevelProgress(levelId: number, moves: number, stars: number): void {
  try {
    const existing = getCompletedLevels();
    const prev = existing[levelId];

    const bestMoves = prev ? Math.min(prev.bestMoves, moves) : moves;
    const bestStars = prev ? Math.max(prev.stars, stars) : stars;

    existing[levelId] = {
      completed: true,
      stars: bestStars,
      bestMoves,
    };

    localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(existing));
  } catch {}
}

export function getSavedCurrentLevel(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_LEVEL);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
        return parsed;
      }
    }
  } catch {}
  return 1;
}

export function saveCurrentLevel(levelId: number): void {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_LEVEL, String(levelId));
  } catch {}
}

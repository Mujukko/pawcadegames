export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestMoves: number;
}

const getProgressKey = (gameId: string) => 
  gameId === 'dog-parking' ? 'pawcade_dog_parking_progress' : `pawcade_${gameId}_progress`;

const getCurrentLevelKey = (gameId: string) => 
  gameId === 'dog-parking' ? 'pawcade_dog_parking_current_level' : `pawcade_${gameId}_current_level`;

export function getCompletedLevels(gameId: string = 'dog-parking'): Record<number, LevelProgress> {
  try {
    const raw = localStorage.getItem(getProgressKey(gameId));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {}
  return {};
}

export function saveLevelProgress(levelId: number, moves: number, stars: number, gameId: string = 'dog-parking'): void {
  try {
    const existing = getCompletedLevels(gameId);
    const prev = existing[levelId];

    const bestMoves = prev ? Math.min(prev.bestMoves, moves) : moves;
    const bestStars = prev ? Math.max(prev.stars, stars) : stars;

    existing[levelId] = {
      completed: true,
      stars: bestStars,
      bestMoves,
    };

    localStorage.setItem(getProgressKey(gameId), JSON.stringify(existing));
  } catch {}
}

export function getSavedCurrentLevel(gameId: string = 'dog-parking'): number {
  try {
    const raw = localStorage.getItem(getCurrentLevelKey(gameId));
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
        return parsed;
      }
    }
  } catch {}
  return 1;
}

export function saveCurrentLevel(levelId: number, gameId: string = 'dog-parking'): void {
  try {
    localStorage.setItem(getCurrentLevelKey(gameId), String(levelId));
  } catch {}
}


export type LetterState = 'correct' | 'present' | 'absent';

export interface WordGameState {
  status: 'playing' | 'won' | 'lost';
  answer: string;
  guesses: string[];
  results: LetterState[][];
  current: string;
  /** best known state per letter, drives keyboard colours */
  keyStates: Record<string, LetterState>;
  message: string | null;
  mode: 'daily' | 'random';
  streak: number;
  bestStreak: number;
}

export interface WordStats {
  streak: number;
  bestStreak: number;
  played: number;
  won: number;
  lastDailyIndex: number;
  lastDailyResult: 'won' | 'lost' | null;
}

export const WORD_LENGTH = 5;
export const MAX_GUESSES = 6;

/** Five-letter farm, food, weather and countryside words. Answers only. */
export const ANSWER_WORDS: string[] = [
  'apple', 'bacon', 'beans', 'berry', 'bison', 'bloom', 'bread', 'brook', 'bunny', 'cabin',
  'chick', 'chive', 'cider', 'cloud', 'cocoa', 'colts', 'corgi', 'crate', 'crops', 'daisy',
  'dairy', 'ditch', 'dough', 'drove', 'field', 'flock', 'flour', 'foxes', 'fresh', 'fruit',
  'geese', 'goats', 'grain', 'grape', 'grass', 'graze', 'gravy', 'hatch', 'hazel', 'honey',
  'horse', 'hound', 'house', 'hutch', 'jelly', 'kitty', 'lambs', 'lemon', 'lilac', 'llama',
  'lunch', 'maize', 'mango', 'maple', 'marsh', 'melon', 'mouse', 'mules', 'mulch', 'nests',
  'noble', 'onion', 'otter', 'ovens', 'paddy', 'pasta', 'patch', 'peach', 'pears', 'petal',
  'plant', 'plows', 'plums', 'pluck', 'pooch', 'pound', 'prune', 'puppy', 'quail', 'quilt',
  'ranch', 'reeds', 'rider', 'roost', 'roots', 'salad', 'sauce', 'scoop', 'shade', 'shear',
  'sheep', 'shell', 'sheds', 'silos', 'sleep', 'slope', 'snack', 'snail', 'sowed', 'spade',
  'spoon', 'stall', 'stalk', 'stove', 'straw', 'sunny', 'sweet', 'swine', 'syrup', 'tabby',
  'table', 'tasty', 'thyme', 'toast', 'trail', 'treat', 'trees', 'trout', 'tulip', 'udder',
  'vines', 'wagon', 'water', 'wheat', 'wheel', 'windy', 'wools', 'worms', 'yeast', 'yield',
  'zebra',
];

/**
 * Scores a guess. Handles duplicate letters the standard way:
 * greens are claimed first, then yellows consume the remaining letters left to right.
 */
export function evaluateGuess(guess: string, answer: string): LetterState[] {
  const g = guess.toLowerCase();
  const a = answer.toLowerCase();
  const result: LetterState[] = Array(g.length).fill('absent');
  const remaining: Record<string, number> = {};

  for (let i = 0; i < a.length; i++) {
    if (g[i] === a[i]) result[i] = 'correct';
    else remaining[a[i]] = (remaining[a[i]] || 0) + 1;
  }
  for (let i = 0; i < g.length; i++) {
    if (result[i] === 'correct') continue;
    if (remaining[g[i]] > 0) {
      result[i] = 'present';
      remaining[g[i]] -= 1;
    }
  }
  return result;
}

const RANK: Record<LetterState, number> = { absent: 0, present: 1, correct: 2 };

export function mergeKeyStates(
  keyStates: Record<string, LetterState>,
  guess: string,
  result: LetterState[]
): Record<string, LetterState> {
  const next = { ...keyStates };
  for (let i = 0; i < guess.length; i++) {
    const letter = guess[i].toLowerCase();
    const prev = next[letter];
    if (prev === undefined || RANK[result[i]] > RANK[prev]) next[letter] = result[i];
  }
  return next;
}

/** Days since 2026-01-01 (UTC) → index into the answer list. */
export function dailyIndex(date: Date = new Date()): number {
  const start = Date.UTC(2026, 0, 1);
  const today = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return Math.floor((today - start) / 86400000);
}

export function dailyAnswer(date: Date = new Date()): string {
  const idx = dailyIndex(date);
  // Multiply by a prime coprime with the list length so neighbours differ
  return ANSWER_WORDS[(((idx * 37) % ANSWER_WORDS.length) + ANSWER_WORDS.length) % ANSWER_WORDS.length];
}

export function createWordGame(
  answer: string,
  mode: 'daily' | 'random',
  stats: Pick<WordStats, 'streak' | 'bestStreak'> = { streak: 0, bestStreak: 0 }
): WordGameState {
  return {
    status: 'playing',
    answer: answer.toLowerCase(),
    guesses: [],
    results: [],
    current: '',
    keyStates: {},
    message: null,
    mode,
    streak: stats.streak,
    bestStreak: stats.bestStreak,
  };
}

export function randomAnswer(exclude?: string, rng: () => number = Math.random): string {
  const pool = ANSWER_WORDS.filter((w) => w !== exclude);
  return pool[Math.min(pool.length - 1, Math.floor(rng() * pool.length))];
}

export function typeLetter(state: WordGameState, letter: string): WordGameState {
  if (state.status !== 'playing') return state;
  if (!/^[a-zA-Z]$/.test(letter)) return state;
  if (state.current.length >= WORD_LENGTH) return state;
  return { ...state, current: state.current + letter.toLowerCase(), message: null };
}

export function deleteLetter(state: WordGameState): WordGameState {
  if (state.status !== 'playing' || state.current.length === 0) return state;
  return { ...state, current: state.current.slice(0, -1), message: null };
}

/** Any five letters are accepted, so players are never blocked by a missing dictionary entry. */
export function submitGuess(state: WordGameState): WordGameState {
  if (state.status !== 'playing') return state;
  if (state.current.length < WORD_LENGTH) return { ...state, message: 'Not enough letters' };

  const guess = state.current;
  const result = evaluateGuess(guess, state.answer);
  const guesses = [...state.guesses, guess];
  const results = [...state.results, result];
  const keyStates = mergeKeyStates(state.keyStates, guess, result);

  if (guess === state.answer) {
    const streak = state.streak + 1;
    return {
      ...state,
      guesses,
      results,
      keyStates,
      current: '',
      status: 'won',
      message: ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'][guesses.length - 1],
      streak,
      bestStreak: Math.max(state.bestStreak, streak),
    };
  }
  if (guesses.length >= MAX_GUESSES) {
    return {
      ...state,
      guesses,
      results,
      keyStates,
      current: '',
      status: 'lost',
      message: state.answer.toUpperCase(),
      streak: 0,
    };
  }
  return { ...state, guesses, results, keyStates, current: '', message: null };
}

export function shareText(state: WordGameState, dayLabel: string): string {
  const sym: Record<LetterState, string> = { correct: '🟩', present: '🟨', absent: '⬛' };
  const score = state.status === 'won' ? `${state.guesses.length}/${MAX_GUESSES}` : `X/${MAX_GUESSES}`;
  const grid = state.results.map((r) => r.map((s) => sym[s]).join('')).join('\n');
  return `Barnyard Word Guess ${dayLabel} ${score}\n${grid}\nhttps://pawcadegames.com/games/barnyard-word-guess/`;
}

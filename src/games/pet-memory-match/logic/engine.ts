/**
 * Pet Memory Match: Barnyard Cards — Core Game Logic Engine
 * 100% pure TypeScript module with deterministic unit testability.
 */

export interface MemoryCard {
  id: string;
  pairId: string;
  symbol: string;
  label: string;
  icon: string;
  isFlipped: boolean;
  isMatched: boolean;
}

export interface MemoryLevelConfig {
  level: number;
  rows: number;
  cols: number;
  totalCards: number;
  totalPairs: number;
  timeLimitSeconds: number;
  starThresholdMoves: [number, number]; // [3-star max moves, 2-star max moves]
}

export const MEMORY_LEVELS: Record<number, MemoryLevelConfig> = {
  1: { level: 1, rows: 3, cols: 4, totalCards: 12, totalPairs: 6, timeLimitSeconds: 50, starThresholdMoves: [8, 12] },
  2: { level: 2, rows: 4, cols: 4, totalCards: 16, totalPairs: 8, timeLimitSeconds: 65, starThresholdMoves: [12, 18] },
  3: { level: 3, rows: 4, cols: 5, totalCards: 20, totalPairs: 10, timeLimitSeconds: 80, starThresholdMoves: [16, 24] },
  4: { level: 4, rows: 5, cols: 6, totalCards: 30, totalPairs: 15, timeLimitSeconds: 110, starThresholdMoves: [24, 34] },
};

export const PET_SYMBOLS = [
  { symbol: 'corgi', label: 'Corgi', icon: '🐶' },
  { symbol: 'cat', label: 'Witch Cat', icon: '🐱' },
  { symbol: 'cow', label: 'Daisy Cow', icon: '🐮' },
  { symbol: 'pig', label: 'Barnaby Pig', icon: '🐷' },
  { symbol: 'chicken', label: 'Clucky Hen', icon: '🐔' },
  { symbol: 'sheep', label: 'Woolly Sheep', icon: '🐑' },
  { symbol: 'duck', label: 'Quacky Duck', icon: '🦆' },
  { symbol: 'bunny', label: 'Hoppy Bunny', icon: '🐰' },
  { symbol: 'mouse', label: 'Chef Mouse', icon: '🐭' },
  { symbol: 'horse', label: 'Clover Horse', icon: '🐴' },
  { symbol: 'squirrel', label: 'Sammy Squirrel', icon: '🐿️' },
  { symbol: 'bear', label: 'Grizzly Bear', icon: '🐻' },
  { symbol: 'fox', label: 'Foxy Red', icon: '🦊' },
  { symbol: 'owl', label: 'Midnight Owl', icon: '🦉' },
  { symbol: 'hedgehog', label: 'Hedgy', icon: '🦔' },
];

export interface FlipResult {
  action: 'first_flip' | 'match' | 'mismatch' | 'already_flipped';
  matchedCards?: [MemoryCard, MemoryCard];
  pointsAwarded: number;
  comboStreak: number;
  isGameComplete: boolean;
}

export interface MemoryGameState {
  level: number;
  config: MemoryLevelConfig;
  cards: MemoryCard[];
  flippedIndices: number[]; // [index1, index2]
  score: number;
  highScore: number;
  moves: number;
  pairsMatched: number;
  comboStreak: number;
  timeRemaining: number;
  stars: number;
  isComplete: boolean;
  isGameOver: boolean;
  peekActive: boolean;
  peekTimer: number;
  freezeTimer: number;
  peekCharges: number;
}

/**
 * Shuffles array deterministically using Fisher-Yates
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = temp;
  }
  return arr;
}

/**
 * Generates deck of paired memory cards
 */
export function generateDeck(level: number = 1): MemoryCard[] {
  const config = MEMORY_LEVELS[level] || MEMORY_LEVELS[1]!;
  const availableSymbols = shuffleArray(PET_SYMBOLS).slice(0, config.totalPairs);

  const cards: MemoryCard[] = [];

  availableSymbols.forEach((item, pairIdx) => {
    // Card A
    cards.push({
      id: `card-${level}-${pairIdx}-A`,
      pairId: `pair-${item.symbol}`,
      symbol: item.symbol,
      label: item.label,
      icon: item.icon,
      isFlipped: false,
      isMatched: false,
    });
    // Card B
    cards.push({
      id: `card-${level}-${pairIdx}-B`,
      pairId: `pair-${item.symbol}`,
      symbol: item.symbol,
      label: item.label,
      icon: item.icon,
      isFlipped: false,
      isMatched: false,
    });
  });

  return shuffleArray(cards);
}

/**
 * Creates initial Memory Game State
 */
export function createInitialMemoryState(level: number = 1, savedHighScore: number = 0): MemoryGameState {
  const config = MEMORY_LEVELS[level] || MEMORY_LEVELS[1]!;
  const cards = generateDeck(level);

  return {
    level,
    config,
    cards,
    flippedIndices: [],
    score: 0,
    highScore: savedHighScore,
    moves: 0,
    pairsMatched: 0,
    comboStreak: 1,
    timeRemaining: config.timeLimitSeconds,
    stars: 3,
    isComplete: false,
    isGameOver: false,
    peekActive: false,
    peekTimer: 0,
    freezeTimer: 0,
    peekCharges: 1, // 1 free peek booster per level
  };
}

/**
 * Flips a card at given index
 */
export function flipCard(state: MemoryGameState, cardIndex: number): FlipResult {
  if (state.isComplete || state.isGameOver) {
    return { action: 'already_flipped', pointsAwarded: 0, comboStreak: state.comboStreak, isGameComplete: false };
  }

  const card = state.cards[cardIndex];
  if (!card || card.isFlipped || card.isMatched) {
    return { action: 'already_flipped', pointsAwarded: 0, comboStreak: state.comboStreak, isGameComplete: false };
  }

  // If already 2 cards are flipped waiting to be resolved, auto-resolve mismatch first
  if (state.flippedIndices.length === 2) {
    processMismatch(state);
  }

  // Flip this card
  card.isFlipped = true;
  state.flippedIndices.push(cardIndex);

  // 1. First card flipped in turn
  if (state.flippedIndices.length === 1) {
    return {
      action: 'first_flip',
      pointsAwarded: 0,
      comboStreak: state.comboStreak,
      isGameComplete: false,
    };
  }

  // 2. Second card flipped in turn -> evaluate pair!
  state.moves++;
  const idx1 = state.flippedIndices[0]!;
  const idx2 = state.flippedIndices[1]!;
  const card1 = state.cards[idx1]!;
  const card2 = state.cards[idx2]!;

  // MATCH!
  if (card1.pairId === card2.pairId) {
    card1.isMatched = true;
    card2.isMatched = true;
    state.flippedIndices = [];
    state.pairsMatched++;

    // Points calculation: Base 150 × combo streak + time bonus
    const pointsAwarded = 150 * state.comboStreak + Math.floor(state.timeRemaining * 2);
    state.score += pointsAwarded;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }

    state.comboStreak = Math.min(state.comboStreak + 1, 5); // up to 5x streak

    // Check complete
    const isGameComplete = state.pairsMatched === state.config.totalPairs;
    if (isGameComplete) {
      state.isComplete = true;

      // Calculate star rating
      const [threeStarMax, twoStarMax] = state.config.starThresholdMoves;
      if (state.moves <= threeStarMax) {
        state.stars = 3;
      } else if (state.moves <= twoStarMax) {
        state.stars = 2;
      } else {
        state.stars = 1;
      }
    }

    return {
      action: 'match',
      matchedCards: [card1, card2],
      pointsAwarded,
      comboStreak: state.comboStreak,
      isGameComplete,
    };
  }

  // MISMATCH!
  state.comboStreak = 1; // reset combo streak
  return {
    action: 'mismatch',
    pointsAwarded: 0,
    comboStreak: 1,
    isGameComplete: false,
  };
}

/**
 * Resolves flipped non-matching cards by turning them face down
 */
export function processMismatch(state: MemoryGameState): void {
  if (state.flippedIndices.length === 2) {
    const idx1 = state.flippedIndices[0]!;
    const idx2 = state.flippedIndices[1]!;
    const card1 = state.cards[idx1];
    const card2 = state.cards[idx2];

    if (card1 && !card1.isMatched) card1.isFlipped = false;
    if (card2 && !card2.isMatched) card2.isFlipped = false;

    state.flippedIndices = [];
  }
}

/**
 * Activates Peek / X-Ray booster: briefly reveals all face-down cards
 */
export function activatePeek(state: MemoryGameState): boolean {
  if (state.peekCharges <= 0 || state.peekActive || state.isComplete || state.isGameOver) {
    return false;
  }
  state.peekCharges--;
  state.peekActive = true;
  state.peekTimer = 1.2; // 1.2 seconds peek
  return true;
}

/**
 * Freezes countdown timer for extra seconds
 */
export function freezeTimer(state: MemoryGameState, seconds: number = 10): void {
  state.freezeTimer += seconds;
}

/**
 * Updates game timers (countdown, peek, freeze)
 */
export function updateMemoryTimer(state: MemoryGameState, dt: number): void {
  if (state.isComplete || state.isGameOver) return;

  // Peek timer
  if (state.peekActive) {
    state.peekTimer -= dt;
    if (state.peekTimer <= 0) {
      state.peekActive = false;
    }
  }

  // Freeze timer
  if (state.freezeTimer > 0) {
    state.freezeTimer -= dt;
    return; // time paused while freeze is active!
  }

  // Main countdown timer
  state.timeRemaining -= dt;
  if (state.timeRemaining <= 0) {
    state.timeRemaining = 0;
    state.isGameOver = true;
  }
}

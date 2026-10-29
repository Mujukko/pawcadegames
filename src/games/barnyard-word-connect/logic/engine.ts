import {
  BarnyardWordConnectState,
  DialLetter,
  GridSlot,
  LevelDefinition,
  WordModel,
} from './types';

export const LEVELS: LevelDefinition[] = [
  {
    id: 1,
    name: 'Sunlit Meadow',
    subtitle: 'Connect letters to find farm words!',
    letters: ['B', 'A', 'R', 'N'],
    words: [
      { id: 'w1', word: 'BARN', row: 0, col: 0, direction: 'across', found: false },
      { id: 'w2', word: 'BAR', row: 0, col: 0, direction: 'down', found: false },
      { id: 'w3', word: 'RAN', row: 0, col: 2, direction: 'down', found: false },
    ],
    bonusWords: ['BAN', 'BRA'],
  },
  {
    id: 2,
    name: 'Apple Orchard',
    subtitle: 'Spell sweet harvest words on the orchard grid!',
    letters: ['F', 'A', 'R', 'M'],
    words: [
      { id: 'w1', word: 'FARM', row: 0, col: 0, direction: 'across', found: false },
      { id: 'w2', word: 'RAM', row: 0, col: 2, direction: 'down', found: false },
      { id: 'w3', word: 'ARM', row: 0, col: 1, direction: 'down', found: false },
      { id: 'w4', word: 'FAR', row: 2, col: 0, direction: 'across', found: false },
    ],
    bonusWords: ['MAR'],
  },
  {
    id: 3,
    name: 'Whispering Windmill',
    subtitle: 'Find five windmill pond words around the wheel!',
    letters: ['P', 'O', 'N', 'D', 'S'],
    words: [
      { id: 'w1', word: 'POND', row: 0, col: 0, direction: 'across', found: false },
      { id: 'w2', word: 'PODS', row: 0, col: 0, direction: 'down', found: false },
      { id: 'w3', word: 'NODS', row: 0, col: 2, direction: 'down', found: false },
      { id: 'w4', word: 'SON', row: 3, col: 0, direction: 'across', found: false },
    ],
    bonusWords: ['SOD', 'DON', 'SOP'],
  },
  {
    id: 4,
    name: 'Grand Barnyard Harvest',
    subtitle: 'Uncover golden wheat harvest words with Sunny Corgi!',
    letters: ['W', 'H', 'E', 'A', 'T'],
    words: [
      { id: 'w1', word: 'WHEAT', row: 0, col: 0, direction: 'across', found: false },
      { id: 'w2', word: 'HEAT', row: 2, col: 1, direction: 'across', found: false },
      { id: 'w3', word: 'HAT', row: 0, col: 1, direction: 'down', found: false },
      { id: 'w4', word: 'EAT', row: 0, col: 2, direction: 'down', found: false },
      { id: 'w5', word: 'TEA', row: 3, col: 2, direction: 'across', found: false },
    ],
    bonusWords: ['WET', 'HAW', 'AWE'],
  },
];

// Generates dial letters arranged in an aesthetic circular dial
export function generateDialLetters(
  letters: string[],
  centerX = 200,
  centerY = 450,
  radius = 65
): DialLetter[] {
  const count = letters.length;
  const startAngle = -Math.PI / 2;
  return letters.map((char, index) => {
    const angle = startAngle + (index * (Math.PI * 2)) / count;
    return {
      id: index,
      char,
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      angle,
    };
  });
}

// Builds the crossword grid slots from the words list
export function buildGridSlots(words: WordModel[]): GridSlot[] {
  const slotMap = new Map<string, GridSlot>();

  for (const w of words) {
    for (let i = 0; i < w.word.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      const key = `${r}_${c}`;

      if (!slotMap.has(key)) {
        slotMap.set(key, {
          id: key,
          row: r,
          col: c,
          letter: w.word[i],
          revealed: w.found,
          wordId: w.id,
          charIndex: i,
        });
      }
    }
  }

  return Array.from(slotMap.values());
}

export function createInitialState(
  levelIndex = 0,
  highScore = 0
): BarnyardWordConnectState {
  const levelDef = LEVELS[levelIndex] || LEVELS[0];
  const words = levelDef.words.map((w) => ({ ...w, found: false }));
  const grid = buildGridSlots(words);
  const dialLetters = generateDialLetters(levelDef.letters);

  return {
    level: levelDef.id,
    words,
    grid,
    dialLetters,
    selectedIndices: [],
    currentGuess: '',
    bonusWordsFound: [],
    bonusWordsList: [...levelDef.bonusWords],
    hintsRemaining: 3,
    score: 0,
    highScore,
    isWon: false,
    events: [],
  };
}

export function selectLetter(
  state: BarnyardWordConnectState,
  index: number
): BarnyardWordConnectState {
  if (state.isWon) return state;
  if (index < 0 || index >= state.dialLetters.length) return state;

  // Don't duplicate the same letter index in the current drag path
  if (state.selectedIndices.includes(index)) {
    // If dragging back to previous index, unwind the last selection
    if (
      state.selectedIndices.length >= 2 &&
      state.selectedIndices[state.selectedIndices.length - 2] === index
    ) {
      state.selectedIndices.pop();
      state.currentGuess = state.selectedIndices
        .map((i) => state.dialLetters[i].char)
        .join('');
      state.events.push({ type: 'letter_unwind', index });
    }
    return state;
  }

  state.selectedIndices.push(index);
  state.currentGuess += state.dialLetters[index].char;
  state.events.push({
    type: 'letter_select',
    index,
    char: state.dialLetters[index].char,
    guess: state.currentGuess,
  });
  return state;
}

export function cancelSelection(
  state: BarnyardWordConnectState
): BarnyardWordConnectState {
  state.selectedIndices = [];
  state.currentGuess = '';
  return state;
}

export function submitGuess(
  state: BarnyardWordConnectState
): BarnyardWordConnectState {
  state.events = [];
  if (state.isWon || state.currentGuess.length === 0) {
    return cancelSelection(state);
  }

  const guess = state.currentGuess.toUpperCase();
  let foundTarget = false;

  // 1. Check target crossword words
  for (const w of state.words) {
    if (w.word === guess) {
      if (w.found) {
        state.events.push({ type: 'word_already_found', word: guess });
        return cancelSelection(state);
      }
      w.found = true;
      foundTarget = true;
      state.score += guess.length * 100;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
      state.events.push({ type: 'word_found', word: guess, points: guess.length * 100 });

      // Reveal matching slots in grid
      for (let i = 0; i < w.word.length; i++) {
        const r = w.direction === 'across' ? w.row : w.row + i;
        const c = w.direction === 'across' ? w.col + i : w.col;
        const key = `${r}_${c}`;
        const slot = state.grid.find((s) => s.id === key);
        if (slot) {
          slot.revealed = true;
        }
      }
      break;
    }
  }

  // 2. Check bonus words
  if (!foundTarget) {
    if (
      state.bonusWordsList.includes(guess) &&
      !state.bonusWordsFound.includes(guess)
    ) {
      state.bonusWordsFound.push(guess);
      state.score += 150;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
      state.events.push({ type: 'bonus_word', word: guess, points: 150 });
      return cancelSelection(state);
    } else {
      state.events.push({ type: 'word_invalid', guess });
      return cancelSelection(state);
    }
  }

  // 3. Check for level victory
  const allFound = state.words.every((w) => w.found);
  if (allFound) {
    state.isWon = true;
    const levelBonus = 500 * state.level;
    state.score += levelBonus;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
    state.events.push({ type: 'victory', level: state.level, score: state.score });
  }

  return cancelSelection(state);
}

export function shuffleDial(
  state: BarnyardWordConnectState
): BarnyardWordConnectState {
  // Shuffle dial letter order
  const letters = [...state.dialLetters.map((d) => d.char)];
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  state.dialLetters = generateDialLetters(letters);
  state.selectedIndices = [];
  state.currentGuess = '';
  state.events.push({ type: 'dial_shuffled' });
  return state;
}

export function useHint(
  state: BarnyardWordConnectState
): BarnyardWordConnectState {
  state.events = [];
  if (state.isWon || state.hintsRemaining <= 0) return state;

  // Find unrevealed grid slots
  const unrevealed = state.grid.filter((s) => !s.revealed);
  if (unrevealed.length === 0) return state;

  const target = unrevealed[Math.floor(Math.random() * unrevealed.length)];
  target.revealed = true;
  state.hintsRemaining--;
  state.events.push({
    type: 'hint_used',
    slotId: target.id,
    char: target.letter,
    remaining: state.hintsRemaining,
  });
  return state;
}

export function restartLevel(
  state: BarnyardWordConnectState
): BarnyardWordConnectState {
  const currentIdx = LEVELS.findIndex((l) => l.id === state.level);
  const next = createInitialState(Math.max(0, currentIdx), state.highScore);
  next.score = state.score;
  next.events.push({ type: 'restart' });
  return next;
}

export function nextLevel(
  state: BarnyardWordConnectState
): BarnyardWordConnectState {
  const currentIdx = LEVELS.findIndex((l) => l.id === state.level);
  const nextIdx = (currentIdx + 1) % LEVELS.length;
  const next = createInitialState(nextIdx, state.highScore);
  next.score = state.score;
  next.events.push({ type: 'level_advance', level: next.level });
  return next;
}

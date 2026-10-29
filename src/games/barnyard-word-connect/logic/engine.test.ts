import { describe, expect, it } from 'bun:test';
import {
  cancelSelection,
  createInitialState,
  nextLevel,
  restartLevel,
  selectLetter,
  shuffleDial,
  submitGuess,
  useHint,
} from './engine';

describe('Barnyard Word Connect Logic Engine', () => {
  it('initializes with level 1 defaults, correct word count, and 3 hints', () => {
    const state = createInitialState(0, 1000);
    expect(state.level).toBe(1);
    expect(state.words.length).toBe(3);
    expect(state.dialLetters.length).toBe(4);
    expect(state.currentGuess).toBe('');
    expect(state.hintsRemaining).toBe(3);
    expect(state.highScore).toBe(1000);
    expect(state.isWon).toBe(false);
  });

  it('selects letters in order and builds current guess string', () => {
    let state = createInitialState(0);
    state = selectLetter(state, 0); // 'B'
    state = selectLetter(state, 1); // 'A'
    state = selectLetter(state, 2); // 'R'
    expect(state.selectedIndices).toEqual([0, 1, 2]);
    expect(state.currentGuess).toBe('BAR');
    expect(state.events.some((e) => e.type === 'letter_select')).toBe(true);
  });

  it('prevents selecting duplicate letters already in current selection', () => {
    let state = createInitialState(0);
    state = selectLetter(state, 0);
    state = selectLetter(state, 0); // duplicate
    expect(state.selectedIndices).toEqual([0]);
    expect(state.currentGuess).toBe('B');
  });

  it('unwinds last letter when dragging back to the second-to-last letter', () => {
    let state = createInitialState(0);
    state = selectLetter(state, 0); // B
    state = selectLetter(state, 1); // A
    state = selectLetter(state, 2); // R
    expect(state.currentGuess).toBe('BAR');

    // Drag back to A (index 1)
    state = selectLetter(state, 1);
    expect(state.selectedIndices).toEqual([0, 1]);
    expect(state.currentGuess).toBe('BA');
    expect(state.events.some((e) => e.type === 'letter_unwind')).toBe(true);
  });

  it('cancels selection and resets current guess', () => {
    let state = createInitialState(0);
    state = selectLetter(state, 0);
    state = selectLetter(state, 1);
    state = cancelSelection(state);
    expect(state.selectedIndices).toEqual([]);
    expect(state.currentGuess).toBe('');
  });

  it('submits a valid crossword word, reveals grid slots, and awards points', () => {
    let state = createInitialState(0);
    // Find indices for B-A-R-N
    const bIdx = state.dialLetters.findIndex((d) => d.char === 'B');
    const aIdx = state.dialLetters.findIndex((d) => d.char === 'A');
    const rIdx = state.dialLetters.findIndex((d) => d.char === 'R');
    const nIdx = state.dialLetters.findIndex((d) => d.char === 'N');

    state = selectLetter(state, bIdx);
    state = selectLetter(state, aIdx);
    state = selectLetter(state, rIdx);
    state = selectLetter(state, nIdx);
    expect(state.currentGuess).toBe('BARN');

    state = submitGuess(state);
    const barnWord = state.words.find((w) => w.word === 'BARN');
    expect(barnWord?.found).toBe(true);
    expect(state.score).toBe(400); // 4 letters * 100
    expect(state.events.some((e) => e.type === 'word_found')).toBe(true);

    // Verify grid slots for BARN are revealed
    const barnSlots = state.grid.filter((s) => s.row === 0 && s.col <= 3);
    expect(barnSlots.length).toBe(4);
    expect(barnSlots.every((s) => s.revealed)).toBe(true);
  });

  it('rejects submitting a word that has already been found', () => {
    let state = createInitialState(0);
    state.words[0].found = true;
    state.currentGuess = state.words[0].word;
    state = submitGuess(state);
    expect(state.events.some((e) => e.type === 'word_already_found')).toBe(true);
  });

  it('awards bonus points for finding bonus words outside the grid', () => {
    let state = createInitialState(0);
    state.currentGuess = 'BAN';
    state = submitGuess(state);
    expect(state.bonusWordsFound).toContain('BAN');
    expect(state.score).toBe(150);
    expect(state.events.some((e) => e.type === 'bonus_word')).toBe(true);
  });

  it('rejects an invalid word not on the grid or bonus list', () => {
    let state = createInitialState(0);
    state.currentGuess = 'ZZZ';
    state = submitGuess(state);
    expect(state.events.some((e) => e.type === 'word_invalid')).toBe(true);
  });

  it('triggers level victory when all target crossword words are found', () => {
    let state = createInitialState(0);
    // Mark first 2 words as found
    state.words[0].found = true;
    state.words[1].found = true;

    // Submit 3rd word
    state.currentGuess = state.words[2].word;
    state = submitGuess(state);
    expect(state.isWon).toBe(true);
    expect(state.events.some((e) => e.type === 'victory')).toBe(true);
    expect(state.score).toBeGreaterThan(500); // Word points + level clear bonus
  });

  it('shuffles dial letters without changing total letter count', () => {
    let state = createInitialState(0);
    const originalChars = state.dialLetters.map((d) => d.char).sort();
    state = shuffleDial(state);
    const shuffledChars = state.dialLetters.map((d) => d.char).sort();
    expect(shuffledChars).toEqual(originalChars);
    expect(state.events.some((e) => e.type === 'dial_shuffled')).toBe(true);
  });

  it('reveals an unrevealed grid slot and decrements hintsRemaining', () => {
    let state = createInitialState(0);
    expect(state.hintsRemaining).toBe(3);
    const unrevealedBefore = state.grid.filter((s) => !s.revealed).length;

    state = useHint(state);
    expect(state.hintsRemaining).toBe(2);
    const unrevealedAfter = state.grid.filter((s) => !s.revealed).length;
    expect(unrevealedAfter).toBe(unrevealedBefore - 1);
    expect(state.events.some((e) => e.type === 'hint_used')).toBe(true);
  });

  it('restarts current level and advances to next level while preserving score', () => {
    let state = createInitialState(0, 500);
    state.score = 800;
    state = restartLevel(state);
    expect(state.level).toBe(1);
    expect(state.score).toBe(800);
    expect(state.words.every((w) => !w.found)).toBe(true);

    state = nextLevel(state);
    expect(state.level).toBe(2);
    expect(state.score).toBe(800);
  });
});

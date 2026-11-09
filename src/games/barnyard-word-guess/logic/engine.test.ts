import { describe, expect, it } from 'bun:test';
import {
  ANSWER_WORDS,
  MAX_GUESSES,
  createWordGame,
  dailyAnswer,
  dailyIndex,
  deleteLetter,
  evaluateGuess,
  mergeKeyStates,
  randomAnswer,
  shareText,
  submitGuess,
  typeLetter,
} from './engine';

function typeWord(state: ReturnType<typeof createWordGame>, word: string) {
  let s = state;
  for (const ch of word) s = typeLetter(s, ch);
  return s;
}

describe('Barnyard Word Guess Engine', () => {
  it('answer list is five lowercase letters, unique, and big enough', () => {
    expect(ANSWER_WORDS.length).toBeGreaterThan(120);
    expect(new Set(ANSWER_WORDS).size).toBe(ANSWER_WORDS.length);
    for (const w of ANSWER_WORDS) expect(w).toMatch(/^[a-z]{5}$/);
  });

  it('marks exact, misplaced and missing letters', () => {
    expect(evaluateGuess('apple', 'apple')).toEqual(Array(5).fill('correct'));
    expect(evaluateGuess('hound', 'horse')).toEqual(['correct', 'correct', 'absent', 'absent', 'absent']);
    expect(evaluateGuess('stall', 'plats')).toEqual(['present', 'present', 'correct', 'present', 'absent']);
  });

  it('handles duplicate letters like the classic rules', () => {
    // answer has one E, already matched green at the end: earlier Es stay grey
    expect(evaluateGuess('geese', 'horse')).toEqual(['absent', 'absent', 'absent', 'correct', 'correct']);
    // answer has one E in slot 2: the green wins, the other Es are grey
    expect(evaluateGuess('geese', 'zebra')).toEqual(['absent', 'correct', 'absent', 'absent', 'absent']);
    // the final E is green, so the earlier Es are grey while R is still yellow
    expect(evaluateGuess('eerie', 'trace')).toEqual(['absent', 'absent', 'present', 'absent', 'correct']);
    // no green available: only the first E earns a yellow
    expect(evaluateGuess('speed', 'abide')).toEqual(['absent', 'absent', 'present', 'absent', 'present']);
    // two Ps in apple, guess poppy
    expect(evaluateGuess('poppy', 'apple')).toEqual(['present', 'absent', 'correct', 'absent', 'absent']);
    // green claims the letter before a yellow can
    expect(evaluateGuess('sleds', 'sheds')).toEqual(['correct', 'absent', 'correct', 'correct', 'correct']);
  });

  it('typing is limited to five letters and ignores non-letters', () => {
    let g = createWordGame('apple', 'random');
    g = typeWord(g, 'abc1 d');
    expect(g.current).toBe('abcd');
    g = typeLetter(g, 'e');
    g = typeLetter(g, 'f');
    expect(g.current).toBe('abcde');
    expect(deleteLetter(g).current).toBe('abcd');
  });

  it('rejects short guesses with a message', () => {
    const g = submitGuess(typeWord(createWordGame('apple', 'random'), 'app'));
    expect(g.message).toBe('Not enough letters');
    expect(g.guesses.length).toBe(0);
  });

  it('wins on the correct word, extends the streak and keeps best streak', () => {
    let g = createWordGame('apple', 'daily', { streak: 2, bestStreak: 5 });
    g = submitGuess(typeWord(g, 'apple'));
    expect(g.status).toBe('won');
    expect(g.streak).toBe(3);
    expect(g.bestStreak).toBe(5);
    expect(g.message).toBe('Genius!');
  });

  it('loses after six wrong guesses, reveals the answer and resets the streak', () => {
    let g = createWordGame('apple', 'daily', { streak: 4, bestStreak: 4 });
    for (let i = 0; i < MAX_GUESSES; i++) g = submitGuess(typeWord(g, 'horse'));
    expect(g.status).toBe('lost');
    expect(g.message).toBe('APPLE');
    expect(g.streak).toBe(0);
    expect(typeLetter(g, 'a').current).toBe('');
  });

  it('keyboard colours never downgrade', () => {
    let keys = mergeKeyStates({}, 'sheep', ['correct', 'absent', 'present', 'absent', 'absent']);
    keys = mergeKeyStates(keys, 'sleep', ['absent', 'absent', 'absent', 'absent', 'absent']);
    expect(keys.s).toBe('correct');
    expect(keys.e).toBe('present');
    expect(keys.h).toBe('absent');
  });

  it('daily answer is stable for a day and changes the next day', () => {
    const d1 = new Date(Date.UTC(2026, 10, 9, 3));
    const d1b = new Date(Date.UTC(2026, 10, 9, 22));
    const d2 = new Date(Date.UTC(2026, 10, 10, 3));
    expect(dailyAnswer(d1)).toBe(dailyAnswer(d1b));
    expect(dailyAnswer(d1)).not.toBe(dailyAnswer(d2));
    expect(dailyIndex(new Date(Date.UTC(2026, 0, 1)))).toBe(0);
    expect(ANSWER_WORDS).toContain(dailyAnswer(new Date(Date.UTC(2025, 5, 1))));
  });

  it('random answer excludes the previous word', () => {
    for (let i = 0; i < 30; i++) expect(randomAnswer('apple')).not.toBe('apple');
    expect(randomAnswer(undefined, () => 0)).toBe(ANSWER_WORDS[0]);
  });

  it('builds a spoiler-free share card', () => {
    let g = createWordGame('apple', 'daily');
    g = submitGuess(typeWord(g, 'horse'));
    g = submitGuess(typeWord(g, 'apple'));
    const txt = shareText(g, '#313');
    expect(txt).toContain('2/6');
    expect(txt).toContain('🟩🟩🟩🟩🟩');
    expect(txt.toLowerCase()).not.toContain('apple\n');
  });
});

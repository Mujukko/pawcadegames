export interface GridSlot {
  id: string;
  row: number;
  col: number;
  letter: string;
  revealed: boolean;
  wordId: string;
  charIndex: number;
}

export interface WordModel {
  id: string;
  word: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
  found: boolean;
}

export interface DialLetter {
  id: number;
  char: string;
  x: number;
  y: number;
  angle: number;
}

export interface LevelDefinition {
  id: number;
  name: string;
  subtitle: string;
  letters: string[];
  words: WordModel[];
  bonusWords: string[];
}

export interface BarnyardWordConnectState {
  level: number;
  words: WordModel[];
  grid: GridSlot[];
  dialLetters: DialLetter[];
  selectedIndices: number[];
  currentGuess: string;
  bonusWordsFound: string[];
  bonusWordsList: string[];
  hintsRemaining: number;
  score: number;
  highScore: number;
  isWon: boolean;
  events: Array<{ type: string; [key: string]: any }>;
}

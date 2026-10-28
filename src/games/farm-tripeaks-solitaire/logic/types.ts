export type FarmSuit = 'clover' | 'wheat' | 'apple' | 'acorn';

export interface TriPeaksCard {
  id: string;
  suit: FarmSuit;
  rank: number; // 1 (Ace) to 13 (King)
  isFaceUp: boolean;
  isCleared: boolean;
  row: number;
  col: number;
  x: number;
  y: number;
  blockedBy: string[]; // IDs of cards covering this card
}

export interface TriPeaksStage {
  id: number;
  name: string;
  tableau: TriPeaksCard[];
  stockDeck: TriPeaksCard[];
}

export interface TriPeaksState {
  status: 'playing' | 'stage_clear' | 'game_over';
  currentStageIndex: number;
  score: number;
  highScore: number;
  streak: number;
  wasteCard: TriPeaksCard | null;
  stockDeck: TriPeaksCard[];
  tableau: TriPeaksCard[];
  wildcardsLeft: number;
  totalCardsCleared: number;
  canUndo: boolean;
  history?: {
    wasteCard: TriPeaksCard;
    stockDeck: TriPeaksCard[];
    tableau: TriPeaksCard[];
    score: number;
    streak: number;
  }[];
}

export type TriPeaksEvent =
  | { type: 'card_cleared'; card: TriPeaksCard; streak: number; points: number }
  | { type: 'card_drawn'; card: TriPeaksCard }
  | { type: 'card_revealed'; cardId: string }
  | { type: 'wildcard_used' }
  | { type: 'undo_used' }
  | { type: 'stage_completed'; stageIndex: number; bonus: number };

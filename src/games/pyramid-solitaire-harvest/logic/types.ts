export type CardSuit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export interface Card {
  id: string;
  suit: CardSuit;
  rank: number; // 1 to 13 (1=Ace, 11=Jack, 12=Queen, 13=King)
  value: number; // 1 to 13
}

export interface PyramidCard extends Card {
  row: number; // 0 to 6
  col: number; // 0 to row
  isCovered: boolean;
  isRemoved: boolean;
  isSelected?: boolean;
}

export type PyramidGameStatus = 'ready' | 'playing' | 'no_moves' | 'victory';

export type PyramidEvent =
  | { type: 'draw'; cardId: string }
  | { type: 'redeal'; redealsLeft: number }
  | { type: 'match'; card1Id: string; card2Id?: string; points: number }
  | { type: 'king_clear'; cardId: string; points: number }
  | { type: 'invalid_match' }
  | { type: 'victory'; finalScore: number };

export interface PyramidGameState {
  status: PyramidGameStatus;
  score: number;
  streak: number;
  pyramid: PyramidCard[];
  stock: Card[];
  waste: Card[];
  selectedCardId?: string;
  redealsRemaining: number;
  events: PyramidEvent[];
  cardsRemainingInPyramid: number;
}

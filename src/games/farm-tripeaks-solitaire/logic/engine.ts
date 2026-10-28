import {
  TriPeaksState,
  TriPeaksCard,
  TriPeaksEvent,
  FarmSuit,
  TriPeaksStage,
} from './types';

export const SUITS: FarmSuit[] = ['clover', 'wheat', 'apple', 'acorn'];

export function createShuffledDeck(seed: number = 42): TriPeaksCard[] {
  const cards: TriPeaksCard[] = [];
  let id = 0;

  for (const suit of SUITS) {
    for (let rank = 1; rank <= 13; rank++) {
      cards.push({
        id: `card-${id++}`,
        suit,
        rank,
        isFaceUp: false,
        isCleared: false,
        row: 0,
        col: 0,
        x: 0,
        y: 0,
        blockedBy: [],
      });
    }
  }

  // Linear Congruential Generator pseudo-shuffle for deterministic solvable layouts
  let s = seed;
  const nextRand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };

  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(nextRand() * (i + 1));
    const temp = cards[i];
    cards[i] = cards[j];
    cards[j] = temp;
  }

  return cards;
}

export function createStage(stageIndex: number): TriPeaksStage {
  const names = [
    'The Orchard Peak',
    'Golden Silo Summit',
    'Lush Pasture Peaks',
    'Grand Barnyard Horizon',
  ];
  const stageName = names[stageIndex % names.length];
  const deck = createShuffledDeck(stageIndex * 137 + 73);

  const tableau: TriPeaksCard[] = [];
  let deckIdx = 0;

  // 28 Tableau cards: 3-Peak Pyramid structure
  // Row 0: 3 cards (peak tips)
  const row0Cards: TriPeaksCard[] = [];
  for (let c = 0; c < 3; c++) {
    const card = {
      ...deck[deckIdx++],
      id: `r0-c${c}`,
      row: 0,
      col: c,
      x: 70 + c * 140,
      y: 60,
      isFaceUp: false,
      isCleared: false,
      blockedBy: [],
    };
    row0Cards.push(card);
    tableau.push(card);
  }

  // Row 1: 6 cards (2 under each peak)
  const row1Cards: TriPeaksCard[] = [];
  for (let c = 0; c < 6; c++) {
    const card = {
      ...deck[deckIdx++],
      id: `r1-c${c}`,
      row: 1,
      col: c,
      x: 45 + Math.floor(c / 2) * 140 + (c % 2) * 50,
      y: 110,
      isFaceUp: false,
      isCleared: false,
      blockedBy: [],
    };
    row1Cards.push(card);
    tableau.push(card);

    // Block row 0 cards
    const parentPeak = Math.floor(c / 2);
    if (row0Cards[parentPeak]) {
      row0Cards[parentPeak].blockedBy.push(card.id);
    }
  }

  // Row 2: 9 cards
  const row2Cards: TriPeaksCard[] = [];
  for (let c = 0; c < 9; c++) {
    const card = {
      ...deck[deckIdx++],
      id: `r2-c${c}`,
      row: 2,
      col: c,
      x: 25 + Math.floor(c / 3) * 140 + (c % 3) * 45,
      y: 160,
      isFaceUp: false,
      isCleared: false,
      blockedBy: [],
    };
    row2Cards.push(card);
    tableau.push(card);

    // Block row 1 cards
    // Each row 1 card is covered by 2 adjacent row 2 cards
    const peakIdx = Math.floor(c / 3);
    const subIdx = c % 3;
    if (subIdx === 0 && row1Cards[peakIdx * 2]) {
      row1Cards[peakIdx * 2].blockedBy.push(card.id);
    } else if (subIdx === 1) {
      if (row1Cards[peakIdx * 2]) row1Cards[peakIdx * 2].blockedBy.push(card.id);
      if (row1Cards[peakIdx * 2 + 1]) row1Cards[peakIdx * 2 + 1].blockedBy.push(card.id);
    } else if (subIdx === 2 && row1Cards[peakIdx * 2 + 1]) {
      row1Cards[peakIdx * 2 + 1].blockedBy.push(card.id);
    }
  }

  // Row 3: 10 cards (Bottom Row, all Face Up!)
  for (let c = 0; c < 10; c++) {
    const card = {
      ...deck[deckIdx++],
      id: `r3-c${c}`,
      row: 3,
      col: c,
      x: 18 + c * 42,
      y: 215,
      isFaceUp: true, // Exposed to start!
      isCleared: false,
      blockedBy: [],
    };
    tableau.push(card);

    // Block row 2 cards
    if (c < 9 && row2Cards[c]) {
      row2Cards[c].blockedBy.push(card.id);
    }
    if (c > 0 && c <= 9 && row2Cards[c - 1]) {
      row2Cards[c - 1].blockedBy.push(card.id);
    }
  }

  // Remaining cards form the stock deck (24 cards)
  const stockDeck: TriPeaksCard[] = [];
  while (deckIdx < deck.length) {
    stockDeck.push({
      ...deck[deckIdx++],
      isFaceUp: false,
      isCleared: false,
    });
  }

  return {
    id: stageIndex,
    name: stageName,
    tableau,
    stockDeck,
  };
}

export function createInitialState(savedHighScore: number = 0, stageIndex: number = 0): TriPeaksState {
  const stage = createStage(stageIndex);
  const stock = [...stage.stockDeck];
  const firstWaste = stock.pop()!;
  firstWaste.isFaceUp = true;

  return {
    status: 'playing',
    currentStageIndex: stageIndex,
    score: 0,
    highScore: savedHighScore,
    streak: 1,
    wasteCard: firstWaste,
    stockDeck: stock,
    tableau: stage.tableau,
    wildcardsLeft: 1,
    totalCardsCleared: 0,
    canUndo: false,
    history: [],
  };
}

export function canClearCard(card: TriPeaksCard, wasteCard: TriPeaksCard | null): boolean {
  if (!wasteCard || !card.isFaceUp || card.isCleared) {
    return false;
  }

  const diff = Math.abs(card.rank - wasteCard.rank);
  // Normal consecutive (+1 or -1)
  if (diff === 1) return true;
  // Wrap-around King (13) and Ace (1)
  if ((card.rank === 1 && wasteCard.rank === 13) || (card.rank === 13 && wasteCard.rank === 1)) {
    return true;
  }

  return false;
}

export function clearTableauCard(
  state: TriPeaksState,
  cardId: string,
  isWildcard: boolean = false
): { state: TriPeaksState; event?: TriPeaksEvent } {
  if (state.status !== 'playing' || !state.wasteCard) {
    return { state };
  }

  const card = state.tableau.find((c) => c.id === cardId);
  if (!card || !card.isFaceUp || card.isCleared) {
    return { state };
  }

  if (!isWildcard && !canClearCard(card, state.wasteCard)) {
    return { state };
  }

  // Save history for undo
  const currentSnapshot = {
    wasteCard: { ...state.wasteCard },
    stockDeck: state.stockDeck.map((c) => ({ ...c })),
    tableau: state.tableau.map((c) => ({ ...c, blockedBy: [...c.blockedBy] })),
    score: state.score,
    streak: state.streak,
  };

  const nextStreak = state.streak + 1;
  const points = isWildcard ? 150 : 100 * nextStreak;
  const nextScore = state.score + points;
  const nextHighScore = Math.max(state.highScore, nextScore);

  // Mark card as cleared and become new waste card
  const newWasteCard: TriPeaksCard = {
    ...card,
    isCleared: true,
    isFaceUp: true,
  };

  // Update tableau and uncover blocked cards
  const nextTableau = state.tableau.map((c) => {
    if (c.id === cardId) {
      return { ...c, isCleared: true };
    }

    // Remove cleared card from blockedBy
    if (c.blockedBy.includes(cardId)) {
      const nextBlocked = c.blockedBy.filter((id) => id !== cardId);
      const isNowFaceUp = nextBlocked.length === 0;
      return {
        ...c,
        blockedBy: nextBlocked,
        isFaceUp: c.isFaceUp || isNowFaceUp,
      };
    }

    return c;
  });

  const nextClearedCount = state.totalCardsCleared + 1;
  const allCleared = nextTableau.every((c) => c.isCleared);

  let nextStatus: TriPeaksState['status'] = state.status;
  if (allCleared) {
    nextStatus = 'stage_clear';
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: nextHighScore,
      streak: nextStreak,
      wasteCard: newWasteCard,
      tableau: nextTableau,
      totalCardsCleared: nextClearedCount,
      wildcardsLeft: isWildcard ? Math.max(0, state.wildcardsLeft - 1) : state.wildcardsLeft,
      canUndo: true,
      history: [...(state.history || []), currentSnapshot],
    },
    event: allCleared
      ? { type: 'stage_completed', stageIndex: state.currentStageIndex, bonus: 1000 + state.stockDeck.length * 100 }
      : { type: 'card_cleared', card, streak: nextStreak, points },
  };
}

export function drawCard(state: TriPeaksState): { state: TriPeaksState; event?: TriPeaksEvent } {
  if (state.status !== 'playing' || state.stockDeck.length === 0) {
    return { state };
  }

  const currentSnapshot = {
    wasteCard: { ...state.wasteCard! },
    stockDeck: state.stockDeck.map((c) => ({ ...c })),
    tableau: state.tableau.map((c) => ({ ...c, blockedBy: [...c.blockedBy] })),
    score: state.score,
    streak: state.streak,
  };

  const nextStock = [...state.stockDeck];
  const drawnCard = nextStock.pop()!;
  drawnCard.isFaceUp = true;

  // Check Game Over: if stock is now empty, and no playable moves exist on tableau
  let nextStatus: TriPeaksState['status'] = state.status;
  if (nextStock.length === 0 && state.wildcardsLeft === 0) {
    const hasValidMove = state.tableau.some((c) => canClearCard(c, drawnCard));
    if (!hasValidMove) {
      nextStatus = 'game_over';
    }
  }

  return {
    state: {
      ...state,
      status: nextStatus,
      streak: 1, // Reset streak on stock draw
      wasteCard: drawnCard,
      stockDeck: nextStock,
      canUndo: true,
      history: [...(state.history || []), currentSnapshot],
    },
    event: { type: 'card_drawn', card: drawnCard },
  };
}

export function undoMove(state: TriPeaksState): { state: TriPeaksState; event?: TriPeaksEvent } {
  if (!state.canUndo || !state.history || state.history.length === 0) {
    return { state };
  }

  const prev = state.history[state.history.length - 1];
  const nextHistory = state.history.slice(0, -1);

  return {
    state: {
      ...state,
      wasteCard: prev.wasteCard,
      stockDeck: prev.stockDeck,
      tableau: prev.tableau,
      score: prev.score,
      streak: prev.streak,
      canUndo: nextHistory.length > 0,
      history: nextHistory,
    },
    event: { type: 'undo_used' },
  };
}

export function nextStage(state: TriPeaksState): TriPeaksState {
  const nextIndex = state.currentStageIndex + 1;
  const stage = createStage(nextIndex);
  const stock = [...stage.stockDeck];
  const firstWaste = stock.pop()!;
  firstWaste.isFaceUp = true;

  return {
    ...state,
    status: 'playing',
    currentStageIndex: nextIndex,
    streak: 1,
    wasteCard: firstWaste,
    stockDeck: stock,
    tableau: stage.tableau,
    wildcardsLeft: Math.min(3, state.wildcardsLeft + 1),
    canUndo: false,
    history: [],
  };
}

export function getRankLabel(rank: number): string {
  switch (rank) {
    case 1:
      return 'A';
    case 11:
      return 'J';
    case 12:
      return 'Q';
    case 13:
      return 'K';
    default:
      return rank.toString();
  }
}

export function getSuitSymbol(suit: FarmSuit): string {
  switch (suit) {
    case 'clover':
      return '🍀';
    case 'wheat':
      return '🌾';
    case 'apple':
      return '🍎';
    case 'acorn':
      return '🌰';
  }
}

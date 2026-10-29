import {
  Card,
  CardSuit,
  PyramidCard,
  PyramidEvent,
  PyramidGameState,
} from './types';

export const PYRAMID_ROWS = 7;
export const MAX_REDEALS = 2;

export function createDeck(seed?: number): Card[] {
  const suits: CardSuit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  const deck: Card[] = [];

  for (const suit of suits) {
    for (let rank = 1; rank <= 13; rank++) {
      deck.push({
        id: `${suit}-${rank}`,
        suit,
        rank,
        value: rank,
      });
    }
  }

  // Pseudo-random deterministic shuffle if seed provided, else standard Fisher-Yates
  let rng = seed !== undefined ? () => {
    seed = (seed! * 9301 + 49297) % 233280;
    return seed / 233280;
  } : Math.random;

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  return deck;
}

export function updateCoveredStatus(pyramid: PyramidCard[]): PyramidCard[] {
  return pyramid.map((card) => {
    if (card.isRemoved) return card;

    // Bottom row cards are never covered by other cards
    if (card.row === PYRAMID_ROWS - 1) {
      return { ...card, isCovered: false };
    }

    // A card at (row, col) is covered if either (row+1, col) or (row+1, col+1) is NOT removed
    const leftChild = pyramid.find((c) => c.row === card.row + 1 && c.col === card.col);
    const rightChild = pyramid.find((c) => c.row === card.row + 1 && c.col === card.col + 1);

    const isCovered = (leftChild ? !leftChild.isRemoved : false) || (rightChild ? !rightChild.isRemoved : false);

    return { ...card, isCovered };
  });
}

export function createInitialState(seed?: number): PyramidGameState {
  const deck = createDeck(seed);

  const pyramidCards: PyramidCard[] = [];
  let deckIndex = 0;

  for (let r = 0; r < PYRAMID_ROWS; r++) {
    for (let c = 0; c <= r; c++) {
      const card = deck[deckIndex++];
      pyramidCards.push({
        ...card,
        row: r,
        col: c,
        isCovered: r < PYRAMID_ROWS - 1, // initial covered state
        isRemoved: false,
        isSelected: false,
      });
    }
  }

  const updatedPyramid = updateCoveredStatus(pyramidCards);
  const stock = deck.slice(deckIndex); // remaining 24 cards

  return {
    status: 'playing',
    score: 0,
    streak: 0,
    pyramid: updatedPyramid,
    stock,
    waste: [],
    selectedCardId: undefined,
    redealsRemaining: MAX_REDEALS,
    events: [],
    cardsRemainingInPyramid: 28,
  };
}

export function drawStockCard(state: PyramidGameState): PyramidGameState {
  if (state.status !== 'playing') return state;

  if (state.stock.length === 0) {
    // Attempt redeal if available
    return redealWaste(state);
  }

  const [topCard, ...remainingStock] = state.stock;
  const newWaste = [topCard, ...state.waste];

  const events: PyramidEvent[] = [...state.events, { type: 'draw', cardId: topCard.id }];

  return {
    ...state,
    stock: remainingStock,
    waste: newWaste,
    selectedCardId: undefined,
    streak: 0, // Reset streak on draw
    events,
  };
}

export function redealWaste(state: PyramidGameState): PyramidGameState {
  if (state.redealsRemaining <= 0 || state.waste.length === 0) return state;

  const newStock = [...state.waste].reverse();
  const nextRedeals = state.redealsRemaining - 1;

  const events: PyramidEvent[] = [...state.events, { type: 'redeal', redealsLeft: nextRedeals }];

  return {
    ...state,
    stock: newStock,
    waste: [],
    redealsRemaining: nextRedeals,
    selectedCardId: undefined,
    streak: 0,
    events,
  };
}

// Check if a card is selectable (either unblocked in pyramid or top of waste)
export function isCardSelectable(state: PyramidGameState, cardId: string): boolean {
  if (state.waste.length > 0 && state.waste[0].id === cardId) {
    return true;
  }
  const pyramidCard = state.pyramid.find((c) => c.id === cardId);
  return !!pyramidCard && !cardId.startsWith('stock') && !pyramidCard.isRemoved && !pyramidCard.isCovered;
}

export function selectCard(state: PyramidGameState, cardId: string): PyramidGameState {
  if (state.status !== 'playing') return state;

  // Validate that the card is currently playable
  if (!isCardSelectable(state, cardId)) {
    return state;
  }

  // Find card object
  const isWaste = state.waste.length > 0 && state.waste[0].id === cardId;
  const card = isWaste ? state.waste[0] : state.pyramid.find((c) => c.id === cardId);
  if (!card) return state;

  // 1. King (Value 13): Clears singly immediately!
  if (card.value === 13) {
    let updatedPyramid = state.pyramid;
    let updatedWaste = state.waste;
    let cardsRemaining = state.cardsRemainingInPyramid;

    if (isWaste) {
      updatedWaste = state.waste.slice(1);
    } else {
      updatedPyramid = state.pyramid.map((c) => (c.id === cardId ? { ...c, isRemoved: true } : c));
      updatedPyramid = updateCoveredStatus(updatedPyramid);
      cardsRemaining -= 1;
    }

    const points = 100 + state.streak * 20;
    const newScore = state.score + points;
    const nextStreak = state.streak + 1;

    const events: PyramidEvent[] = [...state.events, { type: 'king_clear', cardId, points }];

    let nextStatus: PyramidGameState['status'] = 'playing';
    if (cardsRemaining === 0) {
      nextStatus = 'victory';
      events.push({ type: 'victory', finalScore: newScore });
    }

    return {
      ...state,
      status: nextStatus,
      score: newScore,
      streak: nextStreak,
      pyramid: updatedPyramid,
      waste: updatedWaste,
      selectedCardId: undefined,
      cardsRemainingInPyramid: cardsRemaining,
      events,
    };
  }

  // 2. If no card previously selected -> select this one
  if (!state.selectedCardId) {
    return {
      ...state,
      selectedCardId: cardId,
    };
  }

  // 3. If tapped the same card again -> deselect
  if (state.selectedCardId === cardId) {
    return {
      ...state,
      selectedCardId: undefined,
    };
  }

  // 4. Two cards selected: Check if they sum to 13
  const prevCardIsWaste = state.waste.length > 0 && state.waste[0].id === state.selectedCardId;
  const prevCard = prevCardIsWaste
    ? state.waste[0]
    : state.pyramid.find((c) => c.id === state.selectedCardId);

  if (!prevCard) {
    return { ...state, selectedCardId: cardId };
  }

  if (prevCard.value + card.value === 13) {
    // Valid Pair Match!
    let updatedPyramid = state.pyramid;
    let updatedWaste = state.waste;
    let cardsRemaining = state.cardsRemainingInPyramid;

    // Remove first card
    if (prevCardIsWaste) {
      updatedWaste = updatedWaste.filter((c) => c.id !== prevCard.id);
    } else {
      updatedPyramid = updatedPyramid.map((c) => (c.id === prevCard.id ? { ...c, isRemoved: true } : c));
      cardsRemaining -= 1;
    }

    // Remove second card
    if (isWaste) {
      updatedWaste = updatedWaste.filter((c) => c.id !== card.id);
    } else {
      updatedPyramid = updatedPyramid.map((c) => (c.id === card.id ? { ...c, isRemoved: true } : c));
      cardsRemaining -= 1;
    }

    updatedPyramid = updateCoveredStatus(updatedPyramid);

    const points = 150 + state.streak * 25;
    const newScore = state.score + points;
    const nextStreak = state.streak + 1;

    const events: PyramidEvent[] = [
      ...state.events,
      { type: 'match', card1Id: prevCard.id, card2Id: card.id, points },
    ];

    let nextStatus: PyramidGameState['status'] = 'playing';
    if (cardsRemaining === 0) {
      nextStatus = 'victory';
      events.push({ type: 'victory', finalScore: newScore });
    }

    return {
      ...state,
      status: nextStatus,
      score: newScore,
      streak: nextStreak,
      pyramid: updatedPyramid,
      waste: updatedWaste,
      selectedCardId: undefined,
      cardsRemainingInPyramid: cardsRemaining,
      events,
    };
  } else {
    // Cards do not sum to 13 -> Switch selection to second card
    return {
      ...state,
      selectedCardId: cardId,
      events: [...state.events, { type: 'invalid_match' }],
    };
  }
}

// Helper: Find a valid move hint
export function getHint(state: PyramidGameState): { card1Id: string; card2Id?: string } | null {
  const availableCards: Card[] = [];

  // Uncovered pyramid cards
  for (const c of state.pyramid) {
    if (!c.isRemoved && !c.isCovered) {
      availableCards.push(c);
    }
  }

  // Top waste card
  if (state.waste.length > 0) {
    availableCards.push(state.waste[0]);
  }

  // Check for any King
  const king = availableCards.find((c) => c.value === 13);
  if (king) {
    return { card1Id: king.id };
  }

  // Check for any pair summing to 13
  for (let i = 0; i < availableCards.length; i++) {
    for (let j = i + 1; j < availableCards.length; j++) {
      if (availableCards[i].value + availableCards[j].value === 13) {
        return { card1Id: availableCards[i].id, card2Id: availableCards[j].id };
      }
    }
  }

  return null;
}

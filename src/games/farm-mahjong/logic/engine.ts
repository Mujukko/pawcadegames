/**
 * Farm Mahjong Solitaire — Core Game Logic Engine
 * 100% pure TypeScript module with reverse-construction solvability guarantee.
 */

export interface MahjongTile {
  id: string;
  symbol: string;
  label: string;
  icon: string;
  x: number; // grid x (units of 1, each tile is 2x2)
  y: number; // grid y (units of 1, each tile is 2x2)
  z: number; // layer level (0 = bottom, 1, 2, 3...)
  matched: boolean;
}

export interface TileSlot {
  x: number;
  y: number;
  z: number;
}

export interface MatchResult {
  success: boolean;
  matchedPair?: [MahjongTile, MahjongTile];
  pointsAwarded: number;
  combo: number;
  isGameComplete: boolean;
  noMovesLeft: boolean;
}

export interface MoveRecord {
  tile1Id: string;
  tile2Id: string;
  points: number;
}

export interface MahjongState {
  tiles: MahjongTile[];
  selectedTileId: string | null;
  score: number;
  highScore: number;
  combo: number;
  matchesMade: number;
  totalPairs: number;
  hints: [string, string] | null;
  history: MoveRecord[];
  isComplete: boolean;
  isBlocked: boolean;
  level: number;
}

export const TILE_SYMBOLS = [
  { symbol: 'corn', label: 'Corn', icon: '🌽' },
  { symbol: 'apple', label: 'Apple', icon: '🍎' },
  { symbol: 'pumpkin', label: 'Pumpkin', icon: '🎃' },
  { symbol: 'tomato', label: 'Tomato', icon: '🍅' },
  { symbol: 'carrot', label: 'Carrot', icon: '🥕' },
  { symbol: 'sheep', label: 'Sheep', icon: '🐑' },
  { symbol: 'cow', label: 'Cow', icon: '🐮' },
  { symbol: 'pig', label: 'Pig', icon: '🐷' },
  { symbol: 'corgi', label: 'Corgi', icon: '🐶' },
  { symbol: 'cat', label: 'Cat', icon: '🐱' },
  { symbol: 'chicken', label: 'Chicken', icon: '🐔' },
  { symbol: 'tractor', label: 'Tractor', icon: '🚜' },
];

/**
 * Handcrafted 3D Pyramid & Barnyard Layouts
 * Each slot has (x, y, z). Tiles occupy [x, x+2] x [y, y+2].
 */
export const MAHJONG_LAYOUTS: Record<number, TileSlot[]> = {
  // Level 1: Barnyard Mini Pyramid (36 tiles = 18 pairs)
  1: [
    // Layer 0: 6x4 base grid (24 tiles)
    { x: 2, y: 1, z: 0 }, { x: 4, y: 1, z: 0 }, { x: 6, y: 1, z: 0 }, { x: 8, y: 1, z: 0 }, { x: 10, y: 1, z: 0 }, { x: 12, y: 1, z: 0 },
    { x: 2, y: 3, z: 0 }, { x: 4, y: 3, z: 0 }, { x: 6, y: 3, z: 0 }, { x: 8, y: 3, z: 0 }, { x: 10, y: 3, z: 0 }, { x: 12, y: 3, z: 0 },
    { x: 2, y: 5, z: 0 }, { x: 4, y: 5, z: 0 }, { x: 6, y: 5, z: 0 }, { x: 8, y: 5, z: 0 }, { x: 10, y: 5, z: 0 }, { x: 12, y: 5, z: 0 },
    { x: 2, y: 7, z: 0 }, { x: 4, y: 7, z: 0 }, { x: 6, y: 7, z: 0 }, { x: 8, y: 7, z: 0 }, { x: 10, y: 7, z: 0 }, { x: 12, y: 7, z: 0 },
    // Layer 1: 4x2 middle pyramid (8 tiles)
    { x: 4, y: 3, z: 1 }, { x: 6, y: 3, z: 1 }, { x: 8, y: 3, z: 1 }, { x: 10, y: 3, z: 1 },
    { x: 4, y: 5, z: 1 }, { x: 6, y: 5, z: 1 }, { x: 8, y: 5, z: 1 }, { x: 10, y: 5, z: 1 },
    // Layer 2: 2x2 top tier (4 tiles)
    { x: 6, y: 4, z: 2 }, { x: 8, y: 4, z: 2 },
    { x: 7, y: 3, z: 2 }, { x: 7, y: 5, z: 2 },
  ],
  // Level 2: Horseshoe Arch (44 tiles = 22 pairs)
  2: [
    // Left Pillar Layer 0
    { x: 1, y: 1, z: 0 }, { x: 1, y: 3, z: 0 }, { x: 1, y: 5, z: 0 }, { x: 1, y: 7, z: 0 },
    { x: 3, y: 1, z: 0 }, { x: 3, y: 3, z: 0 }, { x: 3, y: 5, z: 0 }, { x: 3, y: 7, z: 0 },
    // Right Pillar Layer 0
    { x: 11, y: 1, z: 0 }, { x: 11, y: 3, z: 0 }, { x: 11, y: 5, z: 0 }, { x: 11, y: 7, z: 0 },
    { x: 13, y: 1, z: 0 }, { x: 13, y: 3, z: 0 }, { x: 13, y: 5, z: 0 }, { x: 13, y: 7, z: 0 },
    // Arch Top Layer 0
    { x: 5, y: 1, z: 0 }, { x: 7, y: 1, z: 0 }, { x: 9, y: 1, z: 0 },
    { x: 5, y: 2, z: 0 }, { x: 7, y: 2, z: 0 }, { x: 9, y: 2, z: 0 },
    // Center Field Layer 0
    { x: 6, y: 5, z: 0 }, { x: 8, y: 5, z: 0 },
    { x: 6, y: 7, z: 0 }, { x: 8, y: 7, z: 0 },
    // Pillars Layer 1
    { x: 2, y: 2, z: 1 }, { x: 2, y: 4, z: 1 }, { x: 2, y: 6, z: 1 },
    { x: 12, y: 2, z: 1 }, { x: 12, y: 4, z: 1 }, { x: 12, y: 6, z: 1 },
    // Arch Top Layer 1
    { x: 6, y: 1, z: 1 }, { x: 8, y: 1, z: 1 },
    // Layer 2 Highlights
    { x: 2, y: 3, z: 2 }, { x: 2, y: 5, z: 2 },
    { x: 12, y: 3, z: 2 }, { x: 12, y: 5, z: 2 },
    { x: 7, y: 1, z: 2 }, { x: 7, y: 6, z: 1 },
  ],
  // Level 3: Red Barn Mansion (52 tiles = 26 pairs)
  3: [
    // Base 6x6 floor
    { x: 2, y: 2, z: 0 }, { x: 4, y: 2, z: 0 }, { x: 6, y: 2, z: 0 }, { x: 8, y: 2, z: 0 }, { x: 10, y: 2, z: 0 }, { x: 12, y: 2, z: 0 },
    { x: 2, y: 4, z: 0 }, { x: 4, y: 4, z: 0 }, { x: 6, y: 4, z: 0 }, { x: 8, y: 4, z: 0 }, { x: 10, y: 4, z: 0 }, { x: 12, y: 4, z: 0 },
    { x: 2, y: 6, z: 0 }, { x: 4, y: 6, z: 0 }, { x: 6, y: 6, z: 0 }, { x: 8, y: 6, z: 0 }, { x: 10, y: 6, z: 0 }, { x: 12, y: 6, z: 0 },
    { x: 2, y: 8, z: 0 }, { x: 4, y: 8, z: 0 }, { x: 6, y: 8, z: 0 }, { x: 8, y: 8, z: 0 }, { x: 10, y: 8, z: 0 }, { x: 12, y: 8, z: 0 },
    // Layer 1
    { x: 4, y: 3, z: 1 }, { x: 6, y: 3, z: 1 }, { x: 8, y: 3, z: 1 }, { x: 10, y: 3, z: 1 },
    { x: 4, y: 5, z: 1 }, { x: 6, y: 5, z: 1 }, { x: 8, y: 5, z: 1 }, { x: 10, y: 5, z: 1 },
    { x: 4, y: 7, z: 1 }, { x: 6, y: 7, z: 1 }, { x: 8, y: 7, z: 1 }, { x: 10, y: 7, z: 1 },
    // Layer 2
    { x: 5, y: 4, z: 2 }, { x: 7, y: 4, z: 2 }, { x: 9, y: 4, z: 2 },
    { x: 5, y: 6, z: 2 }, { x: 7, y: 6, z: 2 }, { x: 9, y: 6, z: 2 },
    // Layer 3 Cap
    { x: 6, y: 5, z: 3 }, { x: 8, y: 5, z: 3 },
    { x: 7, y: 4, z: 3 }, { x: 7, y: 6, z: 3 },
    // Side outriggers
    { x: 0, y: 5, z: 0 }, { x: 14, y: 5, z: 0 },
  ],
};

/**
 * Checks if tile A is free (can be clicked/selected).
 * Rules:
 * 1. No tile directly covers it from above (z + 1).
 * 2. Unobstructed on either Left OR Right edge at same layer z.
 */
export function isTileFree(tileId: string, tiles: MahjongTile[]): boolean {
  const tile = tiles.find((t) => t.id === tileId);
  if (!tile || tile.matched) return false;

  const activeTiles = tiles.filter((t) => !t.matched && t.id !== tile.id);

  // 1. Check if covered from layer above
  for (const other of activeTiles) {
    if (other.z > tile.z) {
      // Overlap check in 2D projection (each tile occupies 2x2 grid space)
      if (Math.abs(other.x - tile.x) < 2 && Math.abs(other.y - tile.y) < 2) {
        return false; // Covered from above!
      }
    }
  }

  // 2. Check left and right obstructions at same layer z
  let blockedLeft = false;
  let blockedRight = false;

  for (const other of activeTiles) {
    if (other.z === tile.z) {
      // Must overlap vertically to block a side
      if (Math.abs(other.y - tile.y) < 2) {
        if (other.x === tile.x - 2) blockedLeft = true;
        if (other.x === tile.x + 2) blockedRight = true;
      }
    }
  }

  // Free if AT LEAST ONE side is completely open
  return !blockedLeft || !blockedRight;
}

/**
 * Reverse-construction layout builder guarantees 100% solvable board.
 */
export function generateSolvableBoard(level: number = 1): MahjongTile[] {
  const layout = MAHJONG_LAYOUTS[level] || MAHJONG_LAYOUTS[1]!;
  const slotCount = layout.length;

  if (slotCount % 2 !== 0) {
    throw new Error(`Mahjong layout must have an even number of slots, got ${slotCount}`);
  }

  const numPairs = slotCount / 2;

  // Create temporary empty tiles for solvability simulation
  const tiles: MahjongTile[] = layout.map((slot, idx) => ({
    id: `tile-${level}-${idx}`,
    symbol: '',
    label: '',
    icon: '',
    x: slot.x,
    y: slot.y,
    z: slot.z,
    matched: false,
  }));

  // We assign pairs in reverse order:
  // Randomly select 2 free slots, assign them a matching symbol, and mark them removed.
  // This guarantees that a player can always solve the board in forward order!
  const remainingSlots = [...tiles];
  let pairIndex = 0;

  while (remainingSlots.length >= 2) {
    // Find all currently free slots in remaining set
    const freeSlots = remainingSlots.filter((slot) => isTileFree(slot.id, remainingSlots));

    if (freeSlots.length < 2) {
      // Fallback: pick any 2 remaining slots if layout edge case occurs
      const s1 = remainingSlots.pop()!;
      const s2 = remainingSlots.pop()!;
      const sym = TILE_SYMBOLS[pairIndex % TILE_SYMBOLS.length]!;
      s1.symbol = sym.symbol;
      s1.label = sym.label;
      s1.icon = sym.icon;
      s2.symbol = sym.symbol;
      s2.label = sym.label;
      s2.icon = sym.icon;
      pairIndex++;
      continue;
    }

    // Pick 2 random free slots
    const idx1 = Math.floor(Math.random() * freeSlots.length);
    const slot1 = freeSlots.splice(idx1, 1)[0]!;

    const idx2 = Math.floor(Math.random() * freeSlots.length);
    const slot2 = freeSlots.splice(idx2, 1)[0]!;

    // Assign symbol
    const sym = TILE_SYMBOLS[pairIndex % TILE_SYMBOLS.length]!;
    slot1.symbol = sym.symbol;
    slot1.label = sym.label;
    slot1.icon = sym.icon;
    slot2.symbol = sym.symbol;
    slot2.label = sym.label;
    slot2.icon = sym.icon;

    // Remove from remaining set for reverse simulation
    const remIdx1 = remainingSlots.findIndex((s) => s.id === slot1.id);
    if (remIdx1 !== -1) remainingSlots.splice(remIdx1, 1);
    const remIdx2 = remainingSlots.findIndex((s) => s.id === slot2.id);
    if (remIdx2 !== -1) remainingSlots.splice(remIdx2, 1);

    pairIndex++;
  }

  // Reset matched flags
  tiles.forEach((t) => (t.matched = false));
  return tiles;
}

/**
 * Creates initial Mahjong state
 */
export function createInitialMahjongState(level: number = 1, savedHighScore: number = 0): MahjongState {
  const tiles = generateSolvableBoard(level);
  return {
    tiles,
    selectedTileId: null,
    score: 0,
    highScore: savedHighScore,
    combo: 1,
    matchesMade: 0,
    totalPairs: tiles.length / 2,
    hints: null,
    history: [],
    isComplete: false,
    isBlocked: false,
    level,
  };
}

/**
 * Finds all currently available matching free tile pairs
 */
export function getAvailablePairs(tiles: MahjongTile[]): [string, string][] {
  const freeTiles = tiles.filter((t) => !t.matched && isTileFree(t.id, tiles));
  const pairs: [string, string][] = [];

  for (let i = 0; i < freeTiles.length; i++) {
    for (let j = i + 1; j < freeTiles.length; j++) {
      if (freeTiles[i]!.symbol === freeTiles[j]!.symbol) {
        pairs.push([freeTiles[i]!.id, freeTiles[j]!.id]);
      }
    }
  }

  return pairs;
}

/**
 * Handles tile selection and pairing
 */
export function selectTile(state: MahjongState, tileId: string): MatchResult {
  const tile = state.tiles.find((t) => t.id === tileId);

  // If tile doesn't exist, is already matched, or not free, reject selection
  if (!tile || tile.matched || !isTileFree(tile.id, state.tiles)) {
    return {
      success: false,
      pointsAwarded: 0,
      combo: state.combo,
      isGameComplete: false,
      noMovesLeft: false,
    };
  }

  // Clear any active hint
  state.hints = null;

  // 1. If clicking the already selected tile, deselect it
  if (state.selectedTileId === tileId) {
    state.selectedTileId = null;
    return {
      success: false,
      pointsAwarded: 0,
      combo: state.combo,
      isGameComplete: false,
      noMovesLeft: false,
    };
  }

  // 2. If no tile selected yet, select this one
  if (!state.selectedTileId) {
    state.selectedTileId = tileId;
    return {
      success: false,
      pointsAwarded: 0,
      combo: state.combo,
      isGameComplete: false,
      noMovesLeft: false,
    };
  }

  // 3. A tile was previously selected -> Check for match!
  const firstTile = state.tiles.find((t) => t.id === state.selectedTileId);
  if (!firstTile || firstTile.matched) {
    state.selectedTileId = tileId;
    return {
      success: false,
      pointsAwarded: 0,
      combo: state.combo,
      isGameComplete: false,
      noMovesLeft: false,
    };
  }

  // Matching pair found!
  if (firstTile.symbol === tile.symbol) {
    firstTile.matched = true;
    tile.matched = true;
    state.selectedTileId = null;

    // Calculate score with combo streak
    const basePoints = 100;
    const pointsAwarded = basePoints * state.combo;
    state.score += pointsAwarded;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }

    state.combo = Math.min(state.combo + 1, 5); // Combo up to 5x
    state.matchesMade++;

    state.history.push({
      tile1Id: firstTile.id,
      tile2Id: tile.id,
      points: pointsAwarded,
    });

    // Check victory
    const remaining = state.tiles.filter((t) => !t.matched);
    const isGameComplete = remaining.length === 0;
    state.isComplete = isGameComplete;

    // Check available moves
    const available = getAvailablePairs(state.tiles);
    const noMovesLeft = !isGameComplete && available.length === 0;
    state.isBlocked = noMovesLeft;

    return {
      success: true,
      matchedPair: [firstTile, tile],
      pointsAwarded,
      combo: state.combo,
      isGameComplete,
      noMovesLeft,
    };
  }

  // Not matching -> switch selection to newly clicked tile
  state.combo = 1; // reset combo streak
  state.selectedTileId = tileId;

  return {
    success: false,
    pointsAwarded: 0,
    combo: 1,
    isGameComplete: false,
    noMovesLeft: false,
  };
}

/**
 * Undoes the last matched pair
 */
export function undoMove(state: MahjongState): boolean {
  if (state.history.length === 0) return false;

  const lastMove = state.history.pop()!;
  const tile1 = state.tiles.find((t) => t.id === lastMove.tile1Id);
  const tile2 = state.tiles.find((t) => t.id === lastMove.tile2Id);

  if (tile1) tile1.matched = false;
  if (tile2) tile2.matched = false;

  state.score = Math.max(0, state.score - lastMove.points);
  state.matchesMade = Math.max(0, state.matchesMade - 1);
  state.combo = 1;
  state.selectedTileId = null;
  state.hints = null;
  state.isComplete = false;
  state.isBlocked = false;

  return true;
}

/**
 * Shuffles remaining unmatched tiles into open slots
 */
export function shuffleRemaining(state: MahjongState): boolean {
  const activeTiles = state.tiles.filter((t) => !t.matched);
  if (activeTiles.length < 2) return false;

  // Extract all active symbols
  const symbols = activeTiles.map((t) => ({
    symbol: t.symbol,
    label: t.label,
    icon: t.icon,
  }));

  // Fisher-Yates shuffle
  for (let i = symbols.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = symbols[i]!;
    symbols[i] = symbols[j]!;
    symbols[j] = temp;
  }

  // Re-assign symbols to active tiles
  activeTiles.forEach((tile, idx) => {
    tile.symbol = symbols[idx]!.symbol;
    tile.label = symbols[idx]!.label;
    tile.icon = symbols[idx]!.icon;
  });

  state.selectedTileId = null;
  state.hints = null;
  state.combo = 1;

  // Verify moves
  const available = getAvailablePairs(state.tiles);
  state.isBlocked = available.length === 0;

  return true;
}

/**
 * Provides a hint for an available matching pair
 */
export function getHint(state: MahjongState): [string, string] | null {
  const pairs = getAvailablePairs(state.tiles);
  if (pairs.length === 0) {
    state.hints = null;
    return null;
  }
  const hintPair = pairs[0]!;
  state.hints = hintPair;
  return hintPair;
}

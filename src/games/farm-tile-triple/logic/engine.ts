import { FarmTileType, FarmTileMeta, BoardTile, LevelConfig, TileTripleState } from './types';

export const TILE_WIDTH = 54;
export const TILE_HEIGHT = 62;
export const MAX_TRAY_CAPACITY = 7;

export const FARM_TILES_META: Record<FarmTileType, FarmTileMeta> = {
  apple: {
    type: 'apple',
    name: 'Red Apple',
    emoji: '🍎',
    bgColor: '#fecdd3',
    borderColor: '#e11d48',
    textColor: '#881337',
  },
  corn: {
    type: 'corn',
    name: 'Sweet Corn',
    emoji: '🌽',
    bgColor: '#fef08a',
    borderColor: '#ca8a04',
    textColor: '#713f12',
  },
  pumpkin: {
    type: 'pumpkin',
    name: 'Barn Pumpkin',
    emoji: '🎃',
    bgColor: '#fed7aa',
    borderColor: '#ea580c',
    textColor: '#7c2d12',
  },
  eggplant: {
    type: 'eggplant',
    name: 'Eggplant',
    emoji: '🍆',
    bgColor: '#e9d5ff',
    borderColor: '#9333ea',
    textColor: '#581c87',
  },
  strawberry: {
    type: 'strawberry',
    name: 'Ripe Berry',
    emoji: '🍓',
    bgColor: '#ffe4e6',
    borderColor: '#f43f5e',
    textColor: '#9f1239',
  },
  honey: {
    type: 'honey',
    name: 'Golden Honey',
    emoji: '🍯',
    bgColor: '#fef3c7',
    borderColor: '#d97706',
    textColor: '#78350f',
  },
  chick: {
    type: 'chick',
    name: 'Fluffy Chick',
    emoji: '🐥',
    bgColor: '#fef9c3',
    borderColor: '#eab308',
    textColor: '#854d0e',
  },
  sunflower: {
    type: 'sunflower',
    name: 'Sunflower',
    emoji: '🌻',
    bgColor: '#fef08a',
    borderColor: '#d97706',
    textColor: '#78350f',
  },
};

// Check if two tiles overlap in 2D space
export function doTilesOverlap(t1: BoardTile, t2: BoardTile): boolean {
  const overlapX = Math.abs(t1.x - t2.x) < TILE_WIDTH * 0.85;
  const overlapY = Math.abs(t1.y - t2.y) < TILE_HEIGHT * 0.85;
  return overlapX && overlapY;
}

// Recompute blocked state for all tiles currently on the board
export function updateBlockedStatus(tiles: BoardTile[]): void {
  for (const t1 of tiles) {
    if (t1.cleared || t1.inTray) {
      t1.isBlocked = false;
      continue;
    }

    let blocked = false;
    for (const t2 of tiles) {
      if (t2.id === t1.id || t2.cleared || t2.inTray) continue;

      if (t2.layer > t1.layer && doTilesOverlap(t1, t2)) {
        blocked = true;
        break;
      }
    }
    t1.isBlocked = blocked;
  }
}

// Handcrafted Campaign Stages
export const CAMPAIGN_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Garden Gate',
    targetMatches: 6, // 18 tiles
    tileDefs: [
      // Base layer (layer 0) - 3x4 grid centered around (175, 140)
      { type: 'apple', x: 70, y: 70, layer: 0 },
      { type: 'apple', x: 130, y: 70, layer: 0 },
      { type: 'apple', x: 190, y: 70, layer: 0 },

      { type: 'corn', x: 70, y: 140, layer: 0 },
      { type: 'corn', x: 130, y: 140, layer: 0 },
      { type: 'corn', x: 190, y: 140, layer: 0 },

      { type: 'pumpkin', x: 70, y: 210, layer: 0 },
      { type: 'pumpkin', x: 130, y: 210, layer: 0 },
      { type: 'pumpkin', x: 190, y: 210, layer: 0 },

      { type: 'chick', x: 70, y: 280, layer: 0 },
      { type: 'chick', x: 130, y: 280, layer: 0 },
      { type: 'chick', x: 190, y: 280, layer: 0 },

      // Top layer (layer 1) - 6 tiles overlapping the intersections
      { type: 'strawberry', x: 100, y: 105, layer: 1 },
      { type: 'strawberry', x: 160, y: 105, layer: 1 },
      { type: 'strawberry', x: 100, y: 175, layer: 1 },
      { type: 'honey', x: 160, y: 175, layer: 1 },
      { type: 'honey', x: 100, y: 245, layer: 1 },
      { type: 'honey', x: 160, y: 245, layer: 1 },
    ],
  },
  {
    id: 2,
    name: 'Orchard Basket',
    targetMatches: 9, // 27 tiles
    tileDefs: [
      // Layer 0: 4x3 base
      { type: 'apple', x: 40, y: 60, layer: 0 },
      { type: 'apple', x: 100, y: 60, layer: 0 },
      { type: 'apple', x: 160, y: 60, layer: 0 },
      { type: 'corn', x: 220, y: 60, layer: 0 },

      { type: 'corn', x: 40, y: 130, layer: 0 },
      { type: 'corn', x: 100, y: 130, layer: 0 },
      { type: 'pumpkin', x: 160, y: 130, layer: 0 },
      { type: 'pumpkin', x: 220, y: 130, layer: 0 },

      { type: 'pumpkin', x: 40, y: 200, layer: 0 },
      { type: 'strawberry', x: 100, y: 200, layer: 0 },
      { type: 'strawberry', x: 160, y: 200, layer: 0 },
      { type: 'strawberry', x: 220, y: 200, layer: 0 },

      // Layer 1: 3x3 mid
      { type: 'honey', x: 70, y: 95, layer: 1 },
      { type: 'honey', x: 130, y: 95, layer: 1 },
      { type: 'honey', x: 190, y: 95, layer: 1 },

      { type: 'chick', x: 70, y: 165, layer: 1 },
      { type: 'chick', x: 130, y: 165, layer: 1 },
      { type: 'chick', x: 190, y: 165, layer: 1 },

      { type: 'eggplant', x: 70, y: 235, layer: 1 },
      { type: 'eggplant', x: 130, y: 235, layer: 1 },
      { type: 'eggplant', x: 190, y: 235, layer: 1 },

      // Layer 2: 2x3 crown
      { type: 'sunflower', x: 100, y: 130, layer: 2 },
      { type: 'sunflower', x: 160, y: 130, layer: 2 },
      { type: 'sunflower', x: 100, y: 200, layer: 2 },
      { type: 'apple', x: 160, y: 200, layer: 2 },
      { type: 'apple', x: 130, y: 90, layer: 2 },
      { type: 'apple', x: 130, y: 240, layer: 2 },
    ],
  },
  {
    id: 3,
    name: 'Harvest Festival',
    targetMatches: 12, // 36 tiles
    tileDefs: [
      // Base layer 0: 4x4
      { type: 'apple', x: 30, y: 50, layer: 0 },
      { type: 'apple', x: 95, y: 50, layer: 0 },
      { type: 'apple', x: 160, y: 50, layer: 0 },
      { type: 'corn', x: 225, y: 50, layer: 0 },

      { type: 'corn', x: 30, y: 120, layer: 0 },
      { type: 'corn', x: 95, y: 120, layer: 0 },
      { type: 'pumpkin', x: 160, y: 120, layer: 0 },
      { type: 'pumpkin', x: 225, y: 120, layer: 0 },

      { type: 'pumpkin', x: 30, y: 190, layer: 0 },
      { type: 'strawberry', x: 95, y: 190, layer: 0 },
      { type: 'strawberry', x: 160, y: 190, layer: 0 },
      { type: 'strawberry', x: 225, y: 190, layer: 0 },

      { type: 'honey', x: 30, y: 260, layer: 0 },
      { type: 'honey', x: 95, y: 260, layer: 0 },
      { type: 'honey', x: 160, y: 260, layer: 0 },
      { type: 'chick', x: 225, y: 260, layer: 0 },

      // Layer 1: 3x3 staggered
      { type: 'chick', x: 62, y: 85, layer: 1 },
      { type: 'chick', x: 127, y: 85, layer: 1 },
      { type: 'eggplant', x: 192, y: 85, layer: 1 },

      { type: 'eggplant', x: 62, y: 155, layer: 1 },
      { type: 'eggplant', x: 127, y: 155, layer: 1 },
      { type: 'sunflower', x: 192, y: 155, layer: 1 },

      { type: 'sunflower', x: 62, y: 225, layer: 1 },
      { type: 'sunflower', x: 127, y: 225, layer: 1 },
      { type: 'apple', x: 192, y: 225, layer: 1 },

      // Layer 2: 2x2 centerpiece + wings
      { type: 'apple', x: 95, y: 120, layer: 2 },
      { type: 'apple', x: 160, y: 120, layer: 2 },
      { type: 'corn', x: 95, y: 190, layer: 2 },
      { type: 'corn', x: 160, y: 190, layer: 2 },

      { type: 'corn', x: 30, y: 155, layer: 2 },
      { type: 'pumpkin', x: 225, y: 155, layer: 2 },

      // Layer 3: Crown pin
      { type: 'pumpkin', x: 127, y: 155, layer: 3 },
      { type: 'pumpkin', x: 127, y: 95, layer: 3 },
      { type: 'strawberry', x: 127, y: 215, layer: 3 },
      { type: 'strawberry', x: 65, y: 155, layer: 3 },
      { type: 'strawberry', x: 190, y: 155, layer: 3 },
    ],
  },
  {
    id: 4,
    name: 'Barnyard Cornucopia',
    targetMatches: 15, // 45 tiles
    tileDefs: [
      // Base layer 0: 5x3
      { type: 'apple', x: 20, y: 60, layer: 0 },
      { type: 'apple', x: 75, y: 60, layer: 0 },
      { type: 'apple', x: 130, y: 60, layer: 0 },
      { type: 'corn', x: 185, y: 60, layer: 0 },
      { type: 'corn', x: 240, y: 60, layer: 0 },

      { type: 'corn', x: 20, y: 130, layer: 0 },
      { type: 'pumpkin', x: 75, y: 130, layer: 0 },
      { type: 'pumpkin', x: 130, y: 130, layer: 0 },
      { type: 'pumpkin', x: 185, y: 130, layer: 0 },
      { type: 'strawberry', x: 240, y: 130, layer: 0 },

      { type: 'strawberry', x: 20, y: 200, layer: 0 },
      { type: 'strawberry', x: 75, y: 200, layer: 0 },
      { type: 'honey', x: 130, y: 200, layer: 0 },
      { type: 'honey', x: 185, y: 200, layer: 0 },
      { type: 'honey', x: 240, y: 200, layer: 0 },

      // Layer 1: 4x3
      { type: 'chick', x: 47, y: 95, layer: 1 },
      { type: 'chick', x: 102, y: 95, layer: 1 },
      { type: 'chick', x: 157, y: 95, layer: 1 },
      { type: 'eggplant', x: 212, y: 95, layer: 1 },

      { type: 'eggplant', x: 47, y: 165, layer: 1 },
      { type: 'eggplant', x: 102, y: 165, layer: 1 },
      { type: 'sunflower', x: 157, y: 165, layer: 1 },
      { type: 'sunflower', x: 212, y: 165, layer: 1 },

      { type: 'sunflower', x: 47, y: 235, layer: 1 },
      { type: 'apple', x: 102, y: 235, layer: 1 },
      { type: 'apple', x: 157, y: 235, layer: 1 },
      { type: 'apple', x: 212, y: 235, layer: 1 },

      // Layer 2: 3x3 diamond
      { type: 'corn', x: 75, y: 130, layer: 2 },
      { type: 'corn', x: 130, y: 130, layer: 2 },
      { type: 'corn', x: 185, y: 130, layer: 2 },

      { type: 'pumpkin', x: 75, y: 200, layer: 2 },
      { type: 'pumpkin', x: 130, y: 200, layer: 2 },
      { type: 'pumpkin', x: 185, y: 200, layer: 2 },

      { type: 'strawberry', x: 130, y: 65, layer: 2 },
      { type: 'strawberry', x: 130, y: 265, layer: 2 },
      { type: 'strawberry', x: 20, y: 165, layer: 2 },
      { type: 'honey', x: 240, y: 165, layer: 2 },

      // Layer 3: Pyramid Peak
      { type: 'honey', x: 102, y: 165, layer: 3 },
      { type: 'honey', x: 157, y: 165, layer: 3 },
      { type: 'chick', x: 130, y: 130, layer: 3 },
      { type: 'chick', x: 130, y: 200, layer: 3 },
      { type: 'chick', x: 130, y: 165, layer: 4 }, // Ultimate Crown
    ],
  },
];

// Initialize game state for given level
export function createInitialState(levelIndex: number = 0, savedHighScore: number = 0): TileTripleState {
  const safeIdx = Math.max(0, Math.min(levelIndex, CAMPAIGN_LEVELS.length - 1));
  const cfg = CAMPAIGN_LEVELS[safeIdx]!;

  const tiles: BoardTile[] = cfg.tileDefs.map((def, idx) => ({
    id: idx + 1,
    type: def.type,
    x: def.x,
    y: def.y,
    layer: def.layer,
    width: TILE_WIDTH,
    height: TILE_HEIGHT,
    isBlocked: false,
    inTray: false,
    cleared: false,
  }));

  updateBlockedStatus(tiles);

  return {
    level: safeIdx + 1,
    tiles,
    tray: [],
    maxTrayCapacity: MAX_TRAY_CAPACITY,
    score: 0,
    highScore: savedHighScore,
    moves: 0,
    matchesMade: 0,
    status: 'playing',
    history: [],
  };
}

// Clone state snapshot for undo support
function cloneTiles(tiles: BoardTile[]): BoardTile[] {
  return tiles.map(t => ({ ...t }));
}

// Pick a tile from board into tray
export function pickTile(
  state: TileTripleState,
  tileId: number
): { success: boolean; matchedType?: FarmTileType; comboScore?: number } {
  if (state.status !== 'playing') return { success: false };

  const target = state.tiles.find(t => t.id === tileId);
  if (!target || target.isBlocked || target.inTray || target.cleared) {
    return { success: false };
  }

  if (state.tray.length >= state.maxTrayCapacity) {
    return { success: false };
  }

  // Save history snapshot before modifying
  state.history.push({
    tiles: cloneTiles(state.tiles),
    tray: cloneTiles(state.tray),
    score: state.score,
  });

  // Move tile to tray
  target.inTray = true;
  state.tray.push(target);
  state.moves += 1;

  // Update remaining board blocking status
  updateBlockedStatus(state.tiles);

  // Check for 3-match in tray
  const typeCounts = new Map<FarmTileType, number>();
  for (const t of state.tray) {
    typeCounts.set(t.type, (typeCounts.get(t.type) || 0) + 1);
  }

  let matchedType: FarmTileType | undefined;
  let comboScore = 0;

  for (const [type, count] of typeCounts.entries()) {
    if (count >= 3) {
      matchedType = type;
      // Remove 3 matching tiles from tray and mark them cleared
      let removed = 0;
      state.tray = state.tray.filter(t => {
        if (t.type === type && removed < 3) {
          t.cleared = true;
          t.inTray = false;
          removed++;
          return false;
        }
        return true;
      });

      comboScore = 300;
      state.score += comboScore;
      state.matchesMade += 1;
      if (state.score > state.highScore) {
        state.highScore = state.score;
      }
      break;
    }
  }

  // Check Win condition: All tiles cleared from board and tray is empty
  const remainingUncleared = state.tiles.filter(t => !t.cleared);
  if (remainingUncleared.length === 0 && state.tray.length === 0) {
    state.status = 'won';
    state.score += 500; // Level clear bonus
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
    return { success: true, matchedType, comboScore };
  }

  // Check Loss condition: Tray full with no active match
  if (state.tray.length >= state.maxTrayCapacity) {
    state.status = 'lost';
  }

  return { success: true, matchedType, comboScore };
}

// Undo the last tile pick move
export function undoMove(state: TileTripleState): boolean {
  if (state.status !== 'playing' || state.history.length === 0) return false;

  const previous = state.history.pop()!;
  state.tiles = previous.tiles;
  state.tray = previous.tray;
  state.score = previous.score;
  state.moves = Math.max(0, state.moves - 1);

  updateBlockedStatus(state.tiles);
  return true;
}

// Shuffle the types of uncleared tiles on the board
export function shuffleBoard(state: TileTripleState): boolean {
  if (state.status !== 'playing') return false;

  const unclearedOnBoard = state.tiles.filter(t => !t.cleared && !t.inTray);
  if (unclearedOnBoard.length <= 1) return false;

  // Extract all types
  const types = unclearedOnBoard.map(t => t.type);

  // Fisher-Yates shuffle
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = types[i]!;
    types[i] = types[j]!;
    types[j] = tmp;
  }

  // Reassign types
  unclearedOnBoard.forEach((tile, idx) => {
    tile.type = types[idx]!;
  });

  return true;
}

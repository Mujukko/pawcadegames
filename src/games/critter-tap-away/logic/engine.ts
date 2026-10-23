/**
 * Critter Tap Away: Barn Escape — Pure TypeScript Core Logic Engine
 * Inspired by CubeAway / Arrows GO! / Tap Away 3D (Top #1 US App Store Mechanic).
 *
 * Mechanics:
 * - A grid cluster of cute farm animals (Cow, Pig, Sheep, Bunny, Chick) inside the barn.
 * - Each animal faces an outward direction: 'up', 'down', 'left', or 'right'.
 * - When tapped:
 *   - If its forward path to the grid boundary is empty: it zooms off into the meadow!
 *   - If blocked by another animal in front of it: it wobbles and bonks in place.
 * - Win: Clear all critters from the barn pen!
 */

export type CritterType = 'cow' | 'pig' | 'sheep' | 'bunny' | 'chick';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface CritterConfig {
  type: CritterType;
  name: string;
  emoji: string;
  color: string;
  bgColor: string;
  borderColor: string;
  assetPath: string;
}

export const CRITTER_CONFIGS: Record<CritterType, CritterConfig> = {
  cow: {
    type: 'cow',
    name: 'Bessie the Cow',
    emoji: '🐮',
    color: '#0f172a',
    bgColor: 'bg-slate-100',
    borderColor: 'border-slate-400',
    assetPath: '/assets/tiles/farm-block-blast/tile-cow.svg',
  },
  pig: {
    type: 'pig',
    name: 'Barnaby Piglet',
    emoji: '🐷',
    color: '#ec4899',
    bgColor: 'bg-pink-100',
    borderColor: 'border-pink-300',
    assetPath: '/assets/tiles/farm-block-blast/tile-pig.svg',
  },
  sheep: {
    type: 'sheep',
    name: 'Woolly Sheep',
    emoji: '🐑',
    color: '#38bdf8',
    bgColor: 'bg-sky-100',
    borderColor: 'border-sky-300',
    assetPath: '/assets/tiles/farm-block-blast/tile-sheep.svg',
  },
  bunny: {
    type: 'bunny',
    name: 'Fluffy Bunny',
    emoji: '🐰',
    color: '#a855f7',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    assetPath: '/assets/tiles/farm-block-blast/tile-cat.svg', // cozy companion tile
  },
  chick: {
    type: 'chick',
    name: 'Pippin Chick',
    emoji: '🐥',
    color: '#eab308',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    assetPath: '/assets/tiles/farm-block-blast/tile-chick.svg',
  },
};

export interface Critter {
  id: string;
  type: CritterType;
  x: number; // grid col (0 to gridSize - 1)
  y: number; // grid row (0 to gridSize - 1)
  direction: Direction;
}

export interface CritterTapAwayState {
  level: number;
  gridSize: number;
  critters: Critter[];
  initialCritterCount: number;
  escapedCount: number;
  moves: number;
  isWon: boolean;
  isGameOver: boolean;
  score: number;
}

export interface CritterLevelConfig {
  level: number;
  gridSize: number;
  critters: {
    id: string;
    type: CritterType;
    x: number;
    y: number;
    direction: Direction;
  }[];
}

export const CRITTER_LEVELS: CritterLevelConfig[] = [
  // Level 1: Gentle Warmup (4x4, 6 critters)
  {
    level: 1,
    gridSize: 4,
    critters: [
      { id: 'c1', type: 'pig', x: 1, y: 1, direction: 'up' },
      { id: 'c2', type: 'cow', x: 2, y: 1, direction: 'right' },
      { id: 'c3', type: 'chick', x: 1, y: 2, direction: 'left' },
      { id: 'c4', type: 'sheep', x: 2, y: 2, direction: 'down' },
      { id: 'c5', type: 'bunny', x: 0, y: 1, direction: 'left' },
      { id: 'c6', type: 'pig', x: 3, y: 2, direction: 'right' },
    ],
  },
  // Level 2: Interlocking Ring (5x5, 12 critters)
  {
    level: 2,
    gridSize: 5,
    critters: [
      // Outer perimeter guides
      { id: 'c1', type: 'chick', x: 1, y: 0, direction: 'up' },
      { id: 'c2', type: 'chick', x: 3, y: 0, direction: 'up' },
      { id: 'c3', type: 'pig', x: 4, y: 1, direction: 'right' },
      { id: 'c4', type: 'pig', x: 4, y: 3, direction: 'right' },
      { id: 'c5', type: 'sheep', x: 3, y: 4, direction: 'down' },
      { id: 'c6', type: 'sheep', x: 1, y: 4, direction: 'down' },
      { id: 'c7', type: 'bunny', x: 0, y: 3, direction: 'left' },
      { id: 'c8', type: 'bunny', x: 0, y: 1, direction: 'left' },
      // Inner core interlocking
      { id: 'c9', type: 'cow', x: 1, y: 1, direction: 'right' }, // blocked by c10
      { id: 'c10', type: 'cow', x: 2, y: 1, direction: 'down' },  // blocked by c12
      { id: 'c11', type: 'cow', x: 1, y: 2, direction: 'up' },    // blocked by c9
      { id: 'c12', type: 'cow', x: 2, y: 2, direction: 'left' },  // blocked by c11
    ],
  },
  // Level 3: Deep Barn Maze (6x6, 18 critters)
  {
    level: 3,
    gridSize: 6,
    critters: [
      // Row 1
      { id: 'c1', type: 'bunny', x: 1, y: 1, direction: 'up' },
      { id: 'c2', type: 'pig', x: 2, y: 1, direction: 'up' },
      { id: 'c3', type: 'cow', x: 3, y: 1, direction: 'right' },
      { id: 'c4', type: 'sheep', x: 4, y: 1, direction: 'right' },
      // Row 2
      { id: 'c5', type: 'chick', x: 1, y: 2, direction: 'left' },
      { id: 'c6', type: 'cow', x: 2, y: 2, direction: 'down' },
      { id: 'c7', type: 'pig', x: 3, y: 2, direction: 'left' },
      { id: 'c8', type: 'bunny', x: 4, y: 2, direction: 'right' },
      // Row 3
      { id: 'c9', type: 'sheep', x: 1, y: 3, direction: 'left' },
      { id: 'c10', type: 'chick', x: 2, y: 3, direction: 'right' },
      { id: 'c11', type: 'bunny', x: 3, y: 3, direction: 'up' },
      { id: 'c12', type: 'cow', x: 4, y: 3, direction: 'right' },
      // Row 4
      { id: 'c13', type: 'pig', x: 1, y: 4, direction: 'down' },
      { id: 'c14', type: 'sheep', x: 2, y: 4, direction: 'down' },
      { id: 'c15', type: 'chick', x: 3, y: 4, direction: 'down' },
      { id: 'c16', type: 'bunny', x: 4, y: 4, direction: 'down' },
      // Side wings
      { id: 'c17', type: 'cow', x: 0, y: 2, direction: 'left' },
      { id: 'c18', type: 'sheep', x: 5, y: 3, direction: 'right' },
    ],
  },
  // Level 4: Master Pen (6x6, 22 critters)
  {
    level: 4,
    gridSize: 6,
    critters: [
      { id: 'c1', type: 'chick', x: 0, y: 1, direction: 'left' },
      { id: 'c2', type: 'pig', x: 1, y: 0, direction: 'up' },
      { id: 'c3', type: 'cow', x: 2, y: 0, direction: 'up' },
      { id: 'c4', type: 'sheep', x: 3, y: 0, direction: 'up' },
      { id: 'c5', type: 'bunny', x: 4, y: 0, direction: 'up' },
      { id: 'c6', type: 'chick', x: 5, y: 1, direction: 'right' },
      { id: 'c7', type: 'pig', x: 1, y: 1, direction: 'right' },
      { id: 'c8', type: 'cow', x: 2, y: 1, direction: 'down' },
      { id: 'c9', type: 'sheep', x: 3, y: 1, direction: 'left' },
      { id: 'c10', type: 'bunny', x: 4, y: 1, direction: 'down' },
      { id: 'c11', type: 'chick', x: 1, y: 2, direction: 'up' },
      { id: 'c12', type: 'pig', x: 2, y: 2, direction: 'right' },
      { id: 'c13', type: 'cow', x: 3, y: 2, direction: 'left' },
      { id: 'c14', type: 'sheep', x: 4, y: 2, direction: 'down' },
      { id: 'c15', type: 'bunny', x: 1, y: 3, direction: 'down' },
      { id: 'c16', type: 'chick', x: 2, y: 3, direction: 'up' },
      { id: 'c17', type: 'pig', x: 3, y: 3, direction: 'right' },
      { id: 'c18', type: 'cow', x: 4, y: 3, direction: 'down' },
      { id: 'c19', type: 'sheep', x: 1, y: 5, direction: 'down' },
      { id: 'c20', type: 'bunny', x: 2, y: 5, direction: 'down' },
      { id: 'c21', type: 'chick', x: 3, y: 5, direction: 'down' },
      { id: 'c22', type: 'pig', x: 4, y: 5, direction: 'down' },
    ],
  },
];

export function initializeCritterLevel(levelNum: number): CritterTapAwayState {
  const config = CRITTER_LEVELS.find(l => l.level === levelNum) || CRITTER_LEVELS[0];

  return {
    level: config.level,
    gridSize: config.gridSize,
    critters: config.critters.map(c => ({ ...c })),
    initialCritterCount: config.critters.length,
    escapedCount: 0,
    moves: 0,
    isWon: false,
    isGameOver: false,
    score: 0,
  };
}

/**
 * Checks if the path in the critter's facing direction to the grid boundary is completely clear.
 */
export function isPathClear(critter: Critter, allCritters: Critter[], gridSize: number): boolean {
  const otherCritters = allCritters.filter(c => c.id !== critter.id);

  switch (critter.direction) {
    case 'up': {
      for (let y = critter.y - 1; y >= 0; y--) {
        if (otherCritters.some(c => c.x === critter.x && c.y === y)) {
          return false;
        }
      }
      return true;
    }
    case 'down': {
      for (let y = critter.y + 1; y < gridSize; y++) {
        if (otherCritters.some(c => c.x === critter.x && c.y === y)) {
          return false;
        }
      }
      return true;
    }
    case 'left': {
      for (let x = critter.x - 1; x >= 0; x--) {
        if (otherCritters.some(c => c.x === x && c.y === critter.y)) {
          return false;
        }
      }
      return true;
    }
    case 'right': {
      for (let x = critter.x + 1; x < gridSize; x++) {
        if (otherCritters.some(c => c.x === x && c.y === critter.y)) {
          return false;
        }
      }
      return true;
    }
  }
}

/**
 * Processes tapping a critter.
 * Returns updated state and whether the move resulted in a successful escape.
 */
export function tapCritter(
  state: CritterTapAwayState,
  critterId: string
): { nextState: CritterTapAwayState; success: boolean } {
  if (state.isWon || state.isGameOver) {
    return { nextState: state, success: false };
  }

  const critter = state.critters.find(c => c.id === critterId);
  if (!critter) {
    return { nextState: state, success: false };
  }

  const clear = isPathClear(critter, state.critters, state.gridSize);

  if (!clear) {
    // Blocked move - count move, no escape
    return {
      nextState: {
        ...state,
        moves: state.moves + 1,
      },
      success: false,
    };
  }

  // Successful escape!
  const remaining = state.critters.filter(c => c.id !== critterId);
  const newEscaped = state.escapedCount + 1;
  const newMoves = state.moves + 1;
  const newScore = state.score + 100;
  const isWon = remaining.length === 0;

  return {
    nextState: {
      ...state,
      critters: remaining,
      escapedCount: newEscaped,
      moves: newMoves,
      score: newScore,
      isWon,
    },
    success: true,
  };
}

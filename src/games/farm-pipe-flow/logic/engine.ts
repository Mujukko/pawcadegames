import {
  PipeType,
  PipeTile,
  PipeLevelConfig,
  PipeGameState,
  DIR_NORTH,
  DIR_EAST,
  DIR_SOUTH,
  DIR_WEST,
} from './types';

export function getBasePortsForType(type: PipeType): number {
  switch (type) {
    case 'straight':
      return DIR_NORTH | DIR_SOUTH; // 1 + 4 = 5
    case 'elbow':
      return DIR_NORTH | DIR_EAST; // 1 + 2 = 3
    case 'tee':
      return DIR_NORTH | DIR_EAST | DIR_SOUTH; // 1 + 2 + 4 = 7
    case 'cross':
      return DIR_NORTH | DIR_EAST | DIR_SOUTH | DIR_WEST; // 15
    case 'source':
      return DIR_EAST; // Default water pumps eastward
    case 'target':
      return DIR_WEST; // Default water enters westward
    default:
      return 0;
  }
}

// Rotate port bitmask clockwise by 90 degrees `times` times
export function rotatePortsClockwise(ports: number, times: number = 1): number {
  let p = ports;
  const count = ((times % 4) + 4) % 4;
  for (let i = 0; i < count; i++) {
    const westBit = p & DIR_WEST ? DIR_NORTH : 0;
    p = ((p << 1) & 0xF) | westBit;
  }
  return p;
}

export function getOppositeDirection(dir: number): number {
  switch (dir) {
    case DIR_NORTH:
      return DIR_SOUTH;
    case DIR_EAST:
      return DIR_WEST;
    case DIR_SOUTH:
      return DIR_NORTH;
    case DIR_WEST:
      return DIR_EAST;
    default:
      return 0;
  }
}

// Handcrafted Campaign Stages
export const PIPE_CAMPAIGN_LEVELS: PipeLevelConfig[] = [
  {
    id: 1,
    name: 'Carrot Patch',
    rows: 3,
    cols: 3,
    grid: [
      // Row 0: Source (top-left) pumping East -> Elbow -> Elbow turning South
      [
        { type: 'source', initialRotation: 0, isFixed: true },
        { type: 'straight', initialRotation: 90 }, // Horizontal East-West
        { type: 'elbow', initialRotation: 90 },    // East-South
      ],
      // Row 1: Empty or vertical pipe -> Elbow -> Straight
      [
        { type: 'elbow', initialRotation: 180 },
        { type: 'straight', initialRotation: 0 },
        { type: 'straight', initialRotation: 0 },
      ],
      // Row 2: Elbow turning East -> Straight -> Target (bottom-right)
      [
        { type: 'straight', initialRotation: 90 },
        { type: 'straight', initialRotation: 90 },
        { type: 'target', initialRotation: 180, isFixed: true, targetLabel: '🥕 Carrots' },
      ],
    ],
  },
  {
    id: 2,
    name: 'Strawberry Greenhouse',
    rows: 4,
    cols: 4,
    grid: [
      // Row 0: Source at (0, 0)
      [
        { type: 'source', initialRotation: 90, isFixed: true }, // Pumps South
        { type: 'elbow', initialRotation: 90 },
        { type: 'straight', initialRotation: 90 },
        { type: 'elbow', initialRotation: 180 },
      ],
      // Row 1: Winding snake path
      [
        { type: 'elbow', initialRotation: 0 },
        { type: 'elbow', initialRotation: 180 },
        { type: 'straight', initialRotation: 0 },
        { type: 'elbow', initialRotation: 90 },
      ],
      // Row 2
      [
        { type: 'straight', initialRotation: 90 },
        { type: 'straight', initialRotation: 0 },
        { type: 'elbow', initialRotation: 270 },
        { type: 'straight', initialRotation: 0 },
      ],
      // Row 3: Connects to Target at (3, 3)
      [
        { type: 'elbow', initialRotation: 0 },
        { type: 'straight', initialRotation: 90 },
        { type: 'straight', initialRotation: 90 },
        { type: 'target', initialRotation: 0, isFixed: true, targetLabel: '🍓 Strawberries' },
      ],
    ],
  },
  {
    id: 3,
    name: 'Apple Orchard',
    rows: 4,
    cols: 4,
    grid: [
      // Row 0: Source at (0, 1) pumping South
      [
        { type: 'elbow', initialRotation: 90 },
        { type: 'source', initialRotation: 90, isFixed: true },
        { type: 'elbow', initialRotation: 180 },
        { type: 'target', initialRotation: 90, isFixed: true, targetLabel: '🍎 Orchard A' },
      ],
      // Row 1: Split Tee pipe
      [
        { type: 'straight', initialRotation: 0 },
        { type: 'tee', initialRotation: 0 },
        { type: 'straight', initialRotation: 90 },
        { type: 'straight', initialRotation: 0 },
      ],
      // Row 2
      [
        { type: 'elbow', initialRotation: 0 },
        { type: 'straight', initialRotation: 0 },
        { type: 'elbow', initialRotation: 270 },
        { type: 'elbow', initialRotation: 90 },
      ],
      // Row 3: Target 2 at (3, 2)
      [
        { type: 'straight', initialRotation: 90 },
        { type: 'elbow', initialRotation: 0 },
        { type: 'target', initialRotation: 270, isFixed: true, targetLabel: '🍏 Orchard B' },
        { type: 'elbow', initialRotation: 180 },
      ],
    ],
  },
  {
    id: 4,
    name: 'Barnyard Dairy Trough',
    rows: 5,
    cols: 5,
    grid: [
      // Row 0: Source at (0, 0)
      [
        { type: 'source', initialRotation: 0, isFixed: true },
        { type: 'straight', initialRotation: 90 },
        { type: 'tee', initialRotation: 90 },
        { type: 'straight', initialRotation: 90 },
        { type: 'target', initialRotation: 0, isFixed: true, targetLabel: '🐮 Cow Trough' },
      ],
      // Row 1
      [
        { type: 'straight', initialRotation: 0 },
        { type: 'elbow', initialRotation: 180 },
        { type: 'cross', initialRotation: 0 },
        { type: 'elbow', initialRotation: 270 },
        { type: 'straight', initialRotation: 0 },
      ],
      // Row 2: Target at (2, 4)
      [
        { type: 'elbow', initialRotation: 0 },
        { type: 'tee', initialRotation: 180 },
        { type: 'straight', initialRotation: 0 },
        { type: 'straight', initialRotation: 90 },
        { type: 'target', initialRotation: 180, isFixed: true, targetLabel: '🐑 Sheep Corral' },
      ],
      // Row 3
      [
        { type: 'straight', initialRotation: 90 },
        { type: 'straight', initialRotation: 0 },
        { type: 'elbow', initialRotation: 90 },
        { type: 'straight', initialRotation: 90 },
        { type: 'elbow', initialRotation: 180 },
      ],
      // Row 4: Target at (4, 2)
      [
        { type: 'elbow', initialRotation: 0 },
        { type: 'straight', initialRotation: 90 },
        { type: 'target', initialRotation: 270, isFixed: true, targetLabel: '🐷 Piglet Mud Tub' },
        { type: 'elbow', initialRotation: 270 },
        { type: 'straight', initialRotation: 0 },
      ],
    ],
  },
];

// BFS algorithm to trace continuous water flow through connected pipe network
export function evaluateWaterFlow(grid: PipeTile[][]): {
  connectedTargets: number;
  totalTargets: number;
  flowPercent: number;
  isWon: boolean;
} {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  // 1. Reset all water status
  let sourceTile: PipeTile | null = null;
  let totalTargets = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = grid[r]![c]!;
      tile.hasWater = false;
      if (tile.type === 'source') {
        sourceTile = tile;
      } else if (tile.type === 'target') {
        totalTargets++;
      }
    }
  }

  if (!sourceTile) {
    return { connectedTargets: 0, totalTargets, flowPercent: 0, isWon: false };
  }

  // 2. BFS from source
  sourceTile.hasWater = true;
  const queue: PipeTile[] = [sourceTile];
  const visited = new Set<string>();
  visited.add(`${sourceTile.row},${sourceTile.col}`);

  let connectedCount = 1;
  let connectedTargets = 0;

  const neighbors = [
    { dir: DIR_NORTH, dr: -1, dc: 0 },
    { dir: DIR_EAST, dr: 0, dc: 1 },
    { dir: DIR_SOUTH, dr: 1, dc: 0 },
    { dir: DIR_WEST, dr: 0, dc: -1 },
  ];

  while (queue.length > 0) {
    const curr = queue.shift()!;

    for (const { dir, dr, dc } of neighbors) {
      if (curr.ports & dir) {
        const nr = curr.row + dr;
        const nc = curr.col + dc;

        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
          const nbr = grid[nr]![nc]!;
          const oppDir = getOppositeDirection(dir);

          // Check if neighbor has matching inlet
          if (nbr.ports & oppDir) {
            const key = `${nr},${nc}`;
            if (!visited.has(key)) {
              visited.add(key);
              nbr.hasWater = true;
              connectedCount++;
              if (nbr.type === 'target') {
                connectedTargets++;
              }
              queue.push(nbr);
            }
          }
        }
      }
    }
  }

  const isWon = totalTargets > 0 && connectedTargets === totalTargets;
  const flowPercent = totalTargets > 0 ? Math.round((connectedTargets / totalTargets) * 100) : 0;

  return { connectedTargets, totalTargets, flowPercent, isWon };
}

// Scramble non-fixed tiles on level initialization so player must solve it
function scrambleGrid(grid: PipeTile[][]): void {
  const rows = grid.length;
  const cols = grid[0]?.length || 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = grid[r]![c]!;
      if (!tile.isFixed) {
        // Random 1, 2, or 3 clockwise turns
        const turns = Math.floor(Math.random() * 3) + 1;
        tile.rotation = (tile.rotation + turns * 90) % 360;
        tile.ports = rotatePortsClockwise(tile.ports, turns);
      }
    }
  }
}

// Initialize game state for given level
export function createInitialState(
  levelIndex: number = 0,
  savedHighScore: number = 0,
  shouldScramble: boolean = true
): PipeGameState {
  const safeIdx = Math.max(0, Math.min(levelIndex, PIPE_CAMPAIGN_LEVELS.length - 1));
  const cfg = PIPE_CAMPAIGN_LEVELS[safeIdx]!;

  const grid: PipeTile[][] = cfg.grid.map((row, r) =>
    row.map((cell, c) => {
      const basePorts = getBasePortsForType(cell.type);
      const turns = Math.round(cell.initialRotation / 90);
      const ports = rotatePortsClockwise(basePorts, turns);

      return {
        row: r,
        col: c,
        type: cell.type,
        ports,
        rotation: cell.initialRotation,
        isFixed: !!cell.isFixed,
        hasWater: false,
        targetLabel: cell.targetLabel,
      };
    })
  );

  if (shouldScramble) {
    scrambleGrid(grid);
  }

  const flowResult = evaluateWaterFlow(grid);

  return {
    level: safeIdx + 1,
    rows: cfg.rows,
    cols: cfg.cols,
    grid,
    moves: 0,
    score: 0,
    highScore: savedHighScore,
    status: flowResult.isWon ? 'won' : 'playing',
    waterFlowPercent: flowResult.flowPercent,
    history: [],
  };
}

// Rotate a pipe tile 90 degrees clockwise
export function rotateTile(
  state: PipeGameState,
  row: number,
  col: number
): { success: boolean; isWon: boolean; newFlowPercent: number } {
  if (state.status !== 'playing') {
    return { success: false, isWon: false, newFlowPercent: state.waterFlowPercent };
  }

  const tile = state.grid[row]?.[col];
  if (!tile || tile.isFixed) {
    return { success: false, isWon: false, newFlowPercent: state.waterFlowPercent };
  }

  // Record history
  state.history.push({
    row,
    col,
    prevRotation: tile.rotation,
  });

  // Rotate tile 90 degrees clockwise
  tile.rotation = (tile.rotation + 90) % 360;
  tile.ports = rotatePortsClockwise(tile.ports, 1);
  state.moves += 1;

  // Re-evaluate water flow
  const flowResult = evaluateWaterFlow(state.grid);
  state.waterFlowPercent = flowResult.flowPercent;

  if (flowResult.isWon) {
    state.status = 'won';
    // Fewer moves = higher score (Max 1000 - moves * 20, min 200)
    const bonus = Math.max(200, 1000 - state.moves * 20);
    state.score += bonus;
    if (state.score > state.highScore) {
      state.highScore = state.score;
    }
  }

  return {
    success: true,
    isWon: flowResult.isWon,
    newFlowPercent: flowResult.flowPercent,
  };
}

// Undo the last rotation move
export function undoRotate(state: PipeGameState): boolean {
  if (state.status !== 'playing' || state.history.length === 0) return false;

  const last = state.history.pop()!;
  const tile = state.grid[last.row]?.[last.col];
  if (!tile) return false;

  // Rotate counter-clockwise 90 deg (3 clockwise turns)
  tile.rotation = last.prevRotation;
  tile.ports = rotatePortsClockwise(tile.ports, 3);
  state.moves = Math.max(0, state.moves - 1);

  const flowResult = evaluateWaterFlow(state.grid);
  state.waterFlowPercent = flowResult.flowPercent;
  return true;
}

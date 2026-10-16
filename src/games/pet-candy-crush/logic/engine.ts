import {
  ALL_TREAT_TYPES,
  CascadeStep,
  LevelGoal,
  LockedCellConfig,
  MatchGroup,
  PetCrushGameState,
  SpecialType,
  TileData,
  TreatType,
} from './types';

export const BOARD_ROWS = 8;
export const BOARD_COLS = 8;

let tileIdCounter = 1;

export function generateTileId(): string {
  return `tile_${tileIdCounter++}_${Math.random().toString(36).substring(2, 6)}`;
}

export function getRandomTreatType(exclude?: TreatType[]): TreatType {
  const available = exclude
    ? ALL_TREAT_TYPES.filter((t) => !exclude.includes(t))
    : ALL_TREAT_TYPES;
  if (available.length === 0) {
    return ALL_TREAT_TYPES[Math.floor(Math.random() * ALL_TREAT_TYPES.length)]!;
  }
  return available[Math.floor(Math.random() * available.length)]!;
}

export function createTile(
  row: number,
  col: number,
  type?: TreatType,
  special: SpecialType = 'none',
  isLocked: boolean = false,
  blocker: 'none' | 'swirl' = 'none'
): TileData {
  return {
    id: generateTileId(),
    type: type || getRandomTreatType(),
    special,
    row,
    col,
    isLocked,
    blocker,
  };
}

/**
 * Creates an 8x8 board guaranteed to have no matches upon initialization,
 * placing level-specific Caged Animals (lockedCells) and Swirl Blockers.
 */
export function createInitialBoard(
  lockedCells: LockedCellConfig[] = [],
  swirlCells: { row: number; col: number }[] = []
): TileData[][] {
  let board: TileData[][] = [];
  let attempts = 0;

  const lockedMap = new Map<string, TreatType | undefined>();
  for (const cell of lockedCells) {
    lockedMap.set(`${cell.row},${cell.col}`, cell.animal);
  }
  const swirlSet = new Set(swirlCells.map((c) => `${c.row},${c.col}`));

  do {
    const grid: (TileData | null)[][] = Array.from({ length: BOARD_ROWS }, () =>
      Array.from({ length: BOARD_COLS }, () => null)
    );

    // 1. Place predetermined Caged Animals first so their exact species are preserved
    for (const cell of lockedCells) {
      if (
        cell.row >= 0 &&
        cell.row < BOARD_ROWS &&
        cell.col >= 0 &&
        cell.col < BOARD_COLS &&
        cell.animal
      ) {
        grid[cell.row]![cell.col] = createTile(
          cell.row,
          cell.col,
          cell.animal,
          'none',
          true,
          'none'
        );
      }
    }

    const getPlacedType = (r: number, c: number): TreatType | null => {
      const t = grid[r]?.[c];
      if (!t || t.blocker === 'swirl') return null;
      return t.type;
    };

    // 2. Fill all remaining cells while avoiding any 3-in-a-row or 2x2 square with placed tiles
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (grid[r]![c] !== null) continue;

        const forbidden: TreatType[] = [];
        const addForbidden = (t: TreatType | null) => {
          if (t && !forbidden.includes(t)) forbidden.push(t);
        };

        // Horizontal 3-in-a-row checks (left-left, left-right, right-right)
        if (c >= 2 && getPlacedType(r, c - 1) && getPlacedType(r, c - 1) === getPlacedType(r, c - 2)) {
          addForbidden(getPlacedType(r, c - 1));
        }
        if (c >= 1 && c + 1 < BOARD_COLS && getPlacedType(r, c - 1) && getPlacedType(r, c - 1) === getPlacedType(r, c + 1)) {
          addForbidden(getPlacedType(r, c - 1));
        }
        if (c + 2 < BOARD_COLS && getPlacedType(r, c + 1) && getPlacedType(r, c + 1) === getPlacedType(r, c + 2)) {
          addForbidden(getPlacedType(r, c + 1));
        }

        // Vertical 3-in-a-row checks (up-up, up-down, down-down)
        if (r >= 2 && getPlacedType(r - 1, c) && getPlacedType(r - 1, c) === getPlacedType(r - 2, c)) {
          addForbidden(getPlacedType(r - 1, c));
        }
        if (r >= 1 && r + 1 < BOARD_ROWS && getPlacedType(r - 1, c) && getPlacedType(r - 1, c) === getPlacedType(r + 1, c)) {
          addForbidden(getPlacedType(r - 1, c));
        }
        if (r + 2 < BOARD_ROWS && getPlacedType(r + 1, c) && getPlacedType(r + 1, c) === getPlacedType(r + 2, c)) {
          addForbidden(getPlacedType(r + 1, c));
        }

        // 2x2 Square checks around (r, c)
        const squareOffsets: [[number, number], [number, number], [number, number]][] = [
          [[-1, -1], [-1, 0], [0, -1]],
          [[-1, 0], [-1, 1], [0, 1]],
          [[0, -1], [1, -1], [1, 0]],
          [[0, 1], [1, 0], [1, 1]],
        ];
        for (const [o1, o2, o3] of squareOffsets) {
          const t1 = getPlacedType(r + o1[0], c + o1[1]);
          const t2 = getPlacedType(r + o2[0], c + o2[1]);
          const t3 = getPlacedType(r + o3[0], c + o3[1]);
          if (t1 && t1 === t2 && t2 === t3) {
            addForbidden(t1);
          }
        }

        const key = `${r},${c}`;
        const isLocked = lockedMap.has(key);
        const blocker = swirlSet.has(key) ? 'swirl' : 'none';
        const chosenType = getRandomTreatType(forbidden);
        grid[r]![c] = createTile(r, c, chosenType, 'none', isLocked, blocker);
      }
    }

    board = grid as TileData[][];
    attempts++;
  } while ((findMatches(board).length > 0 || !hasPossibleMoves(board)) && attempts < 30);

  return board;
}

/**
 * Detects all horizontal runs, vertical runs, L/T intersections, and 2x2 square matches
 */
export function findMatches(board: TileData[][]): MatchGroup[] {
  const horizMatches: MatchGroup[] = [];
  const vertMatches: MatchGroup[] = [];
  const rows = board.length;
  const cols = board[0]!.length;

  // Dedicated booster boxes (Dynamite, Bomb, Rocket, Star) and Swirl Blockers
  // do not passively match as regular animal candies.
  // Locked X-Cage tiles (isLocked: true) DO contain an animal and CAN be matched!
  const getMatchableType = (r: number, c: number): TreatType | null => {
    const t = board[r]?.[c];
    if (!t || t.special !== 'none' || t.blocker === 'swirl') return null;
    return t.type;
  };

  // 1. Horizontal Matches (3, 4, 5+)
  for (let r = 0; r < rows; r++) {
    let matchStart = 0;
    while (matchStart < cols) {
      const currentType = getMatchableType(r, matchStart);
      if (!currentType) {
        matchStart++;
        continue;
      }

      let matchEnd = matchStart + 1;
      while (matchEnd < cols && getMatchableType(r, matchEnd) === currentType) {
        matchEnd++;
      }

      const matchLength = matchEnd - matchStart;
      if (matchLength >= 3) {
        const tiles: { row: number; col: number }[] = [];
        for (let c = matchStart; c < matchEnd; c++) {
          tiles.push({ row: r, col: c });
        }

        let createdSpecial: MatchGroup['createdSpecial'];
        const pivotCol = Math.floor((matchStart + matchEnd) / 2);

        if (matchLength === 4) {
          createdSpecial = {
            row: r,
            col: pivotCol,
            special: 'striped_v',
            type: currentType,
          };
        } else if (matchLength >= 5) {
          createdSpecial = {
            row: r,
            col: pivotCol,
            special: 'rainbow_star',
            type: currentType,
          };
        }

        horizMatches.push({
          type: currentType,
          tiles,
          isRow: true,
          createdSpecial,
        });
      }

      matchStart = matchEnd;
    }
  }

  // 2. Vertical Matches (3, 4, 5+)
  for (let c = 0; c < cols; c++) {
    let matchStart = 0;
    while (matchStart < rows) {
      const currentType = getMatchableType(matchStart, c);
      if (!currentType) {
        matchStart++;
        continue;
      }

      let matchEnd = matchStart + 1;
      while (matchEnd < rows && getMatchableType(matchEnd, c) === currentType) {
        matchEnd++;
      }

      const matchLength = matchEnd - matchStart;
      if (matchLength >= 3) {
        const tiles: { row: number; col: number }[] = [];
        for (let r = matchStart; r < matchEnd; r++) {
          tiles.push({ row: r, col: c });
        }

        let createdSpecial: MatchGroup['createdSpecial'];
        const pivotRow = Math.floor((matchStart + matchEnd) / 2);

        if (matchLength === 4) {
          createdSpecial = {
            row: pivotRow,
            col: c,
            special: 'striped_h',
            type: currentType,
          };
        } else if (matchLength >= 5) {
          createdSpecial = {
            row: pivotRow,
            col: c,
            special: 'rainbow_star',
            type: currentType,
          };
        }

        vertMatches.push({
          type: currentType,
          tiles,
          isRow: false,
          createdSpecial,
        });
      }

      matchStart = matchEnd;
    }
  }

  // 3. Merge L / T Shape Intersections into Wrapped Barrel Bombs (💣)
  const matches: MatchGroup[] = [];
  const usedHoriz = new Set<number>();
  const usedVert = new Set<number>();

  for (let hi = 0; hi < horizMatches.length; hi++) {
    const h = horizMatches[hi]!;
    for (let vi = 0; vi < vertMatches.length; vi++) {
      if (usedVert.has(vi)) continue;
      const v = vertMatches[vi]!;
      if (h.type !== v.type) continue;

      const intersection = h.tiles.find((ht) =>
        v.tiles.some((vt) => vt.row === ht.row && vt.col === ht.col)
      );

      if (intersection) {
        usedHoriz.add(hi);
        usedVert.add(vi);

        const combinedMap = new Map<string, { row: number; col: number }>();
        for (const t of [...h.tiles, ...v.tiles]) {
          combinedMap.set(`${t.row},${t.col}`, t);
        }

        const isFiveLine = h.tiles.length >= 5 || v.tiles.length >= 5;
        matches.push({
          type: h.type,
          tiles: Array.from(combinedMap.values()),
          isRow: true,
          createdSpecial: {
            row: intersection.row,
            col: intersection.col,
            special: isFiveLine ? 'rainbow_star' : 'wrapped_bomb',
            type: h.type,
          },
        });
        break;
      }
    }
  }

  for (let hi = 0; hi < horizMatches.length; hi++) {
    if (!usedHoriz.has(hi)) matches.push(horizMatches[hi]!);
  }
  for (let vi = 0; vi < vertMatches.length; vi++) {
    if (!usedVert.has(vi)) matches.push(vertMatches[vi]!);
  }

  const lineMatchedCoords = new Set<string>();
  for (const m of matches) {
    for (const t of m.tiles) {
      lineMatchedCoords.add(`${t.row},${t.col}`);
    }
  }

  // 4. 2x2 Square Matches (4'lü Kare -> Square Dynamite Bomb 🧨)
  const squareUsedCoords = new Set<string>();
  for (let r = 0; r < rows - 1; r++) {
    for (let c = 0; c < cols - 1; c++) {
      const t00 = getMatchableType(r, c);
      if (!t00) continue;

      if (
        getMatchableType(r, c + 1) === t00 &&
        getMatchableType(r + 1, c) === t00 &&
        getMatchableType(r + 1, c + 1) === t00
      ) {
        const sqCoords = [
          { row: r, col: c },
          { row: r, col: c + 1 },
          { row: r + 1, col: c },
          { row: r + 1, col: c + 1 },
        ];

        const allInLineMatch = sqCoords.every((coord) =>
          lineMatchedCoords.has(`${coord.row},${coord.col}`)
        );
        const anyInSquare = sqCoords.some((coord) =>
          squareUsedCoords.has(`${coord.row},${coord.col}`)
        );

        if (!allInLineMatch && !anyInSquare) {
          for (const coord of sqCoords) {
            squareUsedCoords.add(`${coord.row},${coord.col}`);
          }
          matches.push({
            type: t00,
            tiles: sqCoords,
            isRow: true,
            createdSpecial: {
              row: r,
              col: c,
              special: 'square_bomb',
              type: t00,
            },
          });
        }
      }
    }
  }

  return matches;
}

/**
 * Validates whether two tiles are adjacent and swapping them produces a match or triggers a booster
 */
export function canSwap(
  board: TileData[][],
  r1: number,
  c1: number,
  r2: number,
  c2: number
): boolean {
  const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
  if (dist !== 1) return false;

  const t1 = board[r1]?.[c1];
  const t2 = board[r2]?.[c2];
  if (!t1 || !t2) return false;

  // Locked X-Cage tiles and Swirl Blockers cannot be dragged/swapped directly!
  if (t1.isLocked || t2.isLocked || t1.blocker === 'swirl' || t2.blocker === 'swirl') {
    return false;
  }

  // Swapping any special booster (Rainbow Star, Bomb, Dynamite, Striped) is always valid!
  if (t1.special !== 'none' || t2.special !== 'none') {
    return true;
  }

  // Simulate swap
  const testBoard = board.map((row) => row.map((tile) => ({ ...tile })));
  testBoard[r1]![c1] = { ...t2, row: r1, col: c1 };
  testBoard[r2]![c2] = { ...t1, row: r2, col: c2 };

  const matches = findMatches(testBoard);
  return matches.length > 0;
}

/**
 * Checks if the board currently has any valid moves
 */
export function hasPossibleMoves(board: TileData[][]): boolean {
  const rows = board.length;
  const cols = board[0]!.length;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const t = board[r]?.[c];
      if (t && t.special !== 'none' && !t.isLocked && t.blocker !== 'swirl') {
        return true;
      }
      if (c + 1 < cols && canSwap(board, r, c, r, c + 1)) {
        return true;
      }
      if (r + 1 < rows && canSwap(board, r, c, r + 1, c)) {
        return true;
      }
    }
  }
  return false;
}

export interface TutorialMoveHint {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  breaksCage: boolean;
}

/**
 * Finds the best swap move on the board to highlight with the animated tutorial finger,
 * prioritizing moves that break a locked cage or occur right next to a locked cage.
 */
export function findBestTutorialMove(board: TileData[][]): TutorialMoveHint | null {
  const rows = board.length;
  const cols = board[0]?.length || 0;
  let bestMove: TutorialMoveHint | null = null;
  let bestScore = -1;

  // Locate locked cells for proximity scoring
  const lockedCoords: { row: number; col: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r]?.[c]?.isLocked) {
        lockedCoords.push({ row: r, col: c });
      }
    }
  }

  const evaluatePair = (r1: number, c1: number, r2: number, c2: number) => {
    if (!canSwap(board, r1, c1, r2, c2)) return;

    const testBoard = board.map((row) => row.map((tile) => ({ ...tile })));
    const t1 = testBoard[r1]![c1]!;
    const t2 = testBoard[r2]![c2]!;
    testBoard[r1]![c1] = { ...t2, row: r1, col: c1 };
    testBoard[r2]![c2] = { ...t1, row: r2, col: c2 };

    const matches = findMatches(testBoard);
    let score = 10;
    let breaksCage = false;

    for (const m of matches) {
      if (m.createdSpecial) score += 35;
      for (const mt of m.tiles) {
        if (board[mt.row]?.[mt.col]?.isLocked) {
          score += 120;
          breaksCage = true;
        }
        for (const lc of lockedCoords) {
          const dist = Math.abs(mt.row - lc.row) + Math.abs(mt.col - lc.col);
          if (dist === 1) {
            score += 90;
            breaksCage = true;
          } else if (dist === 2) {
            score += 25;
          } else if (dist === 3) {
            score += 10;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMove = { r1, c1, r2, c2, breaksCage };
    }
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (c + 1 < cols) evaluatePair(r, c, r, c + 1);
      if (r + 1 < rows) evaluatePair(r, c, r + 1, c);
    }
  }

  return bestMove;
}

/**
 * Expands special tile explosions with chain-reaction BFS
 */
export function expandSpecialExplosions(
  board: TileData[][],
  coordsToClear: Set<string>
): void {
  const queue = Array.from(coordsToClear);
  const processedSpecials = new Set<string>();

  while (queue.length > 0) {
    const key = queue.shift()!;
    if (processedSpecials.has(key)) continue;

    const [r, c] = key.split(',').map(Number) as [number, number];
    const tile = board[r]?.[c];
    if (!tile || tile.special === 'none') continue;

    processedSpecials.add(key);

    const addCoord = (nr: number, nc: number) => {
      if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
        const nKey = `${nr},${nc}`;
        if (!coordsToClear.has(nKey)) {
          coordsToClear.add(nKey);
          queue.push(nKey);
        }
      }
    };

    if (tile.special === 'striped_h') {
      for (let col = 0; col < BOARD_COLS; col++) {
        addCoord(r, col);
      }
    } else if (tile.special === 'striped_v') {
      for (let row = 0; row < BOARD_ROWS; row++) {
        addCoord(row, c);
      }
    } else if (tile.special === 'wrapped_bomb') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          addCoord(r + dr, c + dc);
        }
      }
    } else if (tile.special === 'square_bomb') {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          addCoord(r + dr, c + dc);
        }
      }
      addCoord(r - 2, c);
      addCoord(r + 2, c);
      addCoord(r, c - 2);
      addCoord(r, c + 2);

      let homingCount = 0;
      for (let hr = 0; hr < BOARD_ROWS && homingCount < 2; hr++) {
        for (let hc = 0; hc < BOARD_COLS && homingCount < 2; hc++) {
          const hKey = `${hr},${hc}`;
          if (!coordsToClear.has(hKey) && board[hr]![hc]!.type === tile.type) {
            addCoord(hr, hc);
            homingCount++;
          }
        }
      }
    } else if (tile.special === 'rainbow_star') {
      for (let rr = 0; rr < BOARD_ROWS; rr++) {
        for (let rc = 0; rc < BOARD_COLS; rc++) {
          if (board[rr]![rc]!.type === tile.type) {
            addCoord(rr, rc);
          }
        }
      }
    }
  }
}

/**
 * Cracks adjacent Swirl Blockers and X-Cage Locks around any matched/exploded coordinates
 */
function applyAdjacentBlockerAndLockDamage(
  board: TileData[][],
  coordsToClear: Set<string>,
  unlockedCoords: { row: number; col: number }[]
): number {
  let locksBroken = 0;
  const baseCoords = Array.from(coordsToClear).map((key) => {
    const [r, c] = key.split(',').map(Number) as [number, number];
    return { row: r, col: c };
  });

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  // 1. Any tile directly in coordsToClear that was locked counts as a broken lock!
  for (const { row, col } of baseCoords) {
    const t = board[row]?.[col];
    if (t?.isLocked) {
      t.isLocked = false;
      locksBroken++;
      unlockedCoords.push({ row, col });
    }
  }

  // 2. Check 4-way orthogonal neighbors for Swirl Blockers or adjacent Locked tiles
  for (const { row, col } of baseCoords) {
    for (const [dr, dc] of dirs) {
      const nr = row + dr!;
      const nc = col + dc!;
      if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
        const neighbor = board[nr]![nc]!;
        const nKey = `${nr},${nc}`;
        if (neighbor.blocker === 'swirl' && !coordsToClear.has(nKey)) {
          coordsToClear.add(nKey);
        } else if (neighbor.isLocked && !coordsToClear.has(nKey)) {
          neighbor.isLocked = false;
          locksBroken++;
          unlockedCoords.push({ row: nr, col: nc });
        }
      }
    }
  }

  return locksBroken;
}

/**
 * Resolves a full cascade chain (matches -> clearing -> gravity drop -> spawn -> repeat)
 */
export function resolveCascades(
  initialBoard: TileData[][],
  initialScoreGained: number = 0,
  initialClearedCoords: { row: number; col: number }[] = []
): {
  finalBoard: TileData[][];
  steps: CascadeStep[];
  totalScore: number;
  totalLocksBroken: number;
  clearedByTreat: Record<TreatType, number>;
} {
  let currentBoard = initialBoard.map((row) => row.map((t) => ({ ...t })));
  const steps: CascadeStep[] = [];
  let totalScore = initialScoreGained;
  let totalLocksBroken = 0;
  let comboCount = 0;

  const clearedByTreat: Record<TreatType, number> = {
    cow: 0,
    pig: 0,
    sheep: 0,
    chicken: 0,
    duck: 0,
    horse: 0,
  };

  if (initialClearedCoords.length > 0) {
    comboCount = 1;
    const initialSet = new Set(initialClearedCoords.map((c) => `${c.row},${c.col}`));
    expandSpecialExplosions(currentBoard, initialSet);

    const unlockedCoords: { row: number; col: number }[] = [];
    totalLocksBroken += applyAdjacentBlockerAndLockDamage(
      currentBoard,
      initialSet,
      unlockedCoords
    );

    const expandedList = Array.from(initialSet).map((key) => {
      const [r, c] = key.split(',').map(Number) as [number, number];
      const tile = currentBoard[r]?.[c];
      if (tile && tile.blocker !== 'swirl') {
        clearedByTreat[tile.type] = (clearedByTreat[tile.type] || 0) + 1;
      }
      return { row: r, col: c };
    });

    const boardAfterClear: (TileData | null)[][] = currentBoard.map((row) => [...row]);
    for (const coord of expandedList) {
      boardAfterClear[coord.row]![coord.col] = null;
    }

    const { boardAfterDrop } = dropAndFillBoard(currentBoard, initialSet);
    const stepScore = expandedList.length * 60 + unlockedCoords.length * 100;
    totalScore += stepScore;

    steps.push({
      matches: [],
      clearedCoords: expandedList,
      unlockedCoords,
      scoreGained: initialScoreGained + stepScore,
      hayGained: initialScoreGained + stepScore,
      comboCount,
      boardAfterClear,
      boardAfterDrop,
    });

    currentBoard = boardAfterDrop;
  }

  while (true) {
    const matches = findMatches(currentBoard);
    if (matches.length === 0) break;

    comboCount++;
    const coordsToClear = new Set<string>();
    const specialsToSpawn: MatchGroup['createdSpecial'][] = [];

    for (const match of matches) {
      for (const t of match.tiles) {
        coordsToClear.add(`${t.row},${t.col}`);
      }
      if (match.createdSpecial) {
        specialsToSpawn.push(match.createdSpecial);
      }
    }

    expandSpecialExplosions(currentBoard, coordsToClear);

    const unlockedCoords: { row: number; col: number }[] = [];
    totalLocksBroken += applyAdjacentBlockerAndLockDamage(
      currentBoard,
      coordsToClear,
      unlockedCoords
    );

    const clearedCoordsList = Array.from(coordsToClear).map((key) => {
      const [r, c] = key.split(',').map(Number) as [number, number];
      const tile = currentBoard[r]?.[c];
      if (tile && tile.blocker !== 'swirl') {
        clearedByTreat[tile.type] = (clearedByTreat[tile.type] || 0) + 1;
      }
      return { row: r, col: c };
    });

    const specialCreationBonus = specialsToSpawn.length * 150 + unlockedCoords.length * 100;
    const stepScore = clearedCoordsList.length * 60 * comboCount + specialCreationBonus;
    totalScore += stepScore;

    const boardAfterClear: (TileData | null)[][] = currentBoard.map((row) => [...row]);
    for (const coord of clearedCoordsList) {
      boardAfterClear[coord.row]![coord.col] = null;
    }

    for (const sp of specialsToSpawn) {
      if (sp) {
        boardAfterClear[sp.row]![sp.col] = createTile(sp.row, sp.col, sp.type, sp.special);
      }
    }

    const { boardAfterDrop } = dropAndFillBoard(
      currentBoard,
      coordsToClear,
      specialsToSpawn
    );

    steps.push({
      matches,
      clearedCoords: clearedCoordsList,
      unlockedCoords,
      scoreGained: stepScore,
      hayGained: stepScore,
      comboCount,
      boardAfterClear,
      boardAfterDrop,
    });

    currentBoard = boardAfterDrop;
  }

  return {
    finalBoard: currentBoard,
    steps,
    totalScore,
    totalLocksBroken,
    clearedByTreat,
  };
}

/**
 * Gravity drop of existing tiles and filling empty top slots with new random treats.
 * Pinned tiles (locked X-Cage tiles or Swirl Blockers) stay anchored at their coordinates
 * while movable tiles flow into open slots!
 */
export function dropAndFillBoard(
  board: TileData[][],
  clearedCoords: Set<string>,
  specialsToSpawn: MatchGroup['createdSpecial'][] = []
): { boardAfterDrop: TileData[][] } {
  const rows = BOARD_ROWS;
  const cols = BOARD_COLS;
  const newBoard: (TileData | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!clearedCoords.has(`${r},${c}`)) {
        newBoard[r]![c] = { ...board[r]![c]! };
      }
    }
  }

  for (const sp of specialsToSpawn) {
    if (sp) {
      newBoard[sp.row]![sp.col] = createTile(sp.row, sp.col, sp.type, sp.special);
    }
  }

  const resultBoard: (TileData | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  for (let c = 0; c < cols; c++) {
    const movableInCol: TileData[] = [];
    for (let r = rows - 1; r >= 0; r--) {
      const tile = newBoard[r]![c];
      if (tile !== null) {
        if (tile.isLocked || tile.blocker === 'swirl') {
          resultBoard[r]![c] = {
            ...tile,
            row: r,
            col: c,
            isNew: false,
          };
        } else {
          movableInCol.push(tile);
        }
      }
    }

    let moveIdx = 0;
    for (let r = rows - 1; r >= 0; r--) {
      if (resultBoard[r]![c] !== null) continue;
      if (moveIdx < movableInCol.length) {
        resultBoard[r]![c] = {
          ...movableInCol[moveIdx]!,
          row: r,
          col: c,
          isNew: false,
        };
        moveIdx++;
      } else {
        resultBoard[r]![c] = {
          ...createTile(r, c),
          isNew: true,
        };
      }
    }
  }

  return { boardAfterDrop: resultBoard as TileData[][] };
}

/**
 * 12 Handcrafted Farm Levels Following an Optimal Fun-to-Challenge Curve:
 * - Levels 1–6: 1 to 5 Caged Animals to Rescue (Smooth Onboarding -> Tactical Combos)
 * - Levels 7–12: 5 to 8 Caged Animals + Strategic Hay Swirls (Mid-Game -> Grand Finale)
 */
export const LEVEL_CONFIGS: LevelGoal[] = [
  {
    levelNumber: 1,
    levelName: 'First Pasture Rescue',
    targetScore: 1000,
    targetHay: 1000,
    maxMoves: 22,
    targetLocks: 1,
    lockedCells: [{ row: 5, col: 4, animal: 'cow' }],
    swirlCells: [],
    starThresholds: [800, 1400, 2000],
  },
  {
    levelNumber: 2,
    levelName: 'Twin Barn Cages',
    targetScore: 1200,
    targetHay: 1200,
    maxMoves: 22,
    targetLocks: 2,
    lockedCells: [
      { row: 4, col: 2, animal: 'cow' },
      { row: 4, col: 5, animal: 'pig' },
    ],
    swirlCells: [],
    starThresholds: [1000, 1600, 2300],
  },
  {
    levelNumber: 3,
    levelName: 'Clover Meadow Trio',
    targetScore: 1500,
    targetHay: 1500,
    maxMoves: 24,
    targetLocks: 3,
    lockedCells: [
      { row: 4, col: 1, animal: 'sheep' },
      { row: 5, col: 3, animal: 'chicken' },
      { row: 4, col: 6, animal: 'sheep' },
    ],
    swirlCells: [
      { row: 5, col: 2 },
      { row: 5, col: 5 },
    ],
    starThresholds: [1200, 1900, 2600],
  },
  {
    levelNumber: 4,
    levelName: 'Windmill Hay Coils',
    targetScore: 1700,
    targetHay: 1700,
    maxMoves: 24,
    targetLocks: 3,
    lockedCells: [
      { row: 5, col: 1, animal: 'duck' },
      { row: 6, col: 4, animal: 'horse' },
      { row: 5, col: 6, animal: 'duck' },
    ],
    swirlCells: [
      { row: 4, col: 2 },
      { row: 4, col: 5 },
      { row: 6, col: 2 },
      { row: 6, col: 5 },
    ],
    starThresholds: [1400, 2100, 2900],
  },
  {
    levelNumber: 5,
    levelName: 'Four Corners Ranch',
    targetScore: 1900,
    targetHay: 1900,
    maxMoves: 25,
    targetLocks: 4,
    lockedCells: [
      { row: 3, col: 2, animal: 'cow' },
      { row: 3, col: 5, animal: 'pig' },
      { row: 6, col: 2, animal: 'pig' },
      { row: 6, col: 5, animal: 'cow' },
    ],
    swirlCells: [
      { row: 4, col: 3 },
      { row: 4, col: 4 },
    ],
    starThresholds: [1500, 2300, 3100],
  },
  {
    levelNumber: 6,
    levelName: 'Five Star Barnyard',
    targetScore: 2200,
    targetHay: 2200,
    maxMoves: 26,
    targetLocks: 5,
    lockedCells: [
      { row: 4, col: 1, animal: 'sheep' },
      { row: 4, col: 6, animal: 'sheep' },
      { row: 5, col: 3, animal: 'horse' },
      { row: 6, col: 2, animal: 'chicken' },
      { row: 6, col: 5, animal: 'chicken' },
    ],
    swirlCells: [
      { row: 5, col: 1 },
      { row: 5, col: 6 },
      { row: 6, col: 3 },
      { row: 6, col: 4 },
    ],
    starThresholds: [1700, 2500, 3400],
  },
  {
    levelNumber: 7,
    levelName: 'Golden V-Paddock',
    targetScore: 2400,
    targetHay: 2400,
    maxMoves: 26,
    targetLocks: 5,
    lockedCells: [
      { row: 3, col: 1, animal: 'pig' },
      { row: 3, col: 6, animal: 'pig' },
      { row: 5, col: 2, animal: 'duck' },
      { row: 5, col: 5, animal: 'duck' },
      { row: 6, col: 3, animal: 'cow' },
    ],
    swirlCells: [
      { row: 4, col: 1 },
      { row: 4, col: 6 },
      { row: 6, col: 2 },
      { row: 6, col: 5 },
    ],
    starThresholds: [1800, 2700, 3600],
  },
  {
    levelNumber: 8,
    levelName: 'Orchard Cross Cages',
    targetScore: 2600,
    targetHay: 2600,
    maxMoves: 26,
    targetLocks: 5,
    lockedCells: [
      { row: 3, col: 3, animal: 'horse' },
      { row: 4, col: 2, animal: 'chicken' },
      { row: 4, col: 4, animal: 'sheep' },
      { row: 4, col: 5, animal: 'chicken' },
      { row: 5, col: 3, animal: 'horse' },
    ],
    swirlCells: [
      { row: 3, col: 2 },
      { row: 3, col: 5 },
      { row: 5, col: 2 },
      { row: 5, col: 5 },
      { row: 6, col: 3 },
    ],
    starThresholds: [2000, 2900, 3900],
  },
  {
    levelNumber: 9,
    levelName: 'Double Fence Line',
    targetScore: 2800,
    targetHay: 2800,
    maxMoves: 27,
    targetLocks: 6,
    lockedCells: [
      { row: 5, col: 1, animal: 'cow' },
      { row: 5, col: 3, animal: 'pig' },
      { row: 5, col: 6, animal: 'sheep' },
      { row: 7, col: 1, animal: 'sheep' },
      { row: 7, col: 4, animal: 'pig' },
      { row: 7, col: 6, animal: 'cow' },
    ],
    swirlCells: [
      { row: 6, col: 1 },
      { row: 6, col: 3 },
      { row: 6, col: 4 },
      { row: 6, col: 6 },
    ],
    starThresholds: [2100, 3100, 4200],
  },
  {
    levelNumber: 10,
    levelName: 'Silo Ridge Rescue',
    targetScore: 3000,
    targetHay: 3000,
    maxMoves: 27,
    targetLocks: 6,
    lockedCells: [
      { row: 6, col: 0, animal: 'chicken' },
      { row: 6, col: 2, animal: 'duck' },
      { row: 6, col: 5, animal: 'duck' },
      { row: 6, col: 7, animal: 'chicken' },
      { row: 7, col: 3, animal: 'horse' },
      { row: 7, col: 4, animal: 'horse' },
    ],
    swirlCells: [
      { row: 5, col: 1 },
      { row: 5, col: 3 },
      { row: 5, col: 4 },
      { row: 5, col: 6 },
      { row: 7, col: 1 },
      { row: 7, col: 6 },
    ],
    starThresholds: [2200, 3300, 4500],
  },
  {
    levelNumber: 11,
    levelName: 'Grand Barn Lockdown',
    targetScore: 3200,
    targetHay: 3200,
    maxMoves: 28,
    targetLocks: 7,
    lockedCells: [
      { row: 4, col: 1, animal: 'cow' },
      { row: 4, col: 6, animal: 'cow' },
      { row: 5, col: 3, animal: 'pig' },
      { row: 5, col: 4, animal: 'pig' },
      { row: 7, col: 1, animal: 'sheep' },
      { row: 7, col: 4, animal: 'cow' },
      { row: 7, col: 6, animal: 'sheep' },
    ],
    swirlCells: [
      { row: 5, col: 1 },
      { row: 5, col: 6 },
      { row: 6, col: 2 },
      { row: 6, col: 3 },
      { row: 6, col: 4 },
      { row: 6, col: 5 },
    ],
    starThresholds: [2400, 3500, 4800],
  },
  {
    levelNumber: 12,
    levelName: 'Golden Harvest Finale',
    targetScore: 3500,
    targetHay: 3500,
    maxMoves: 28,
    targetLocks: 8,
    lockedCells: [
      { row: 5, col: 0, animal: 'cow' },
      { row: 5, col: 2, animal: 'pig' },
      { row: 5, col: 5, animal: 'pig' },
      { row: 5, col: 7, animal: 'cow' },
      { row: 7, col: 1, animal: 'duck' },
      { row: 7, col: 3, animal: 'horse' },
      { row: 7, col: 4, animal: 'horse' },
      { row: 7, col: 6, animal: 'duck' },
    ],
    swirlCells: [
      { row: 6, col: 1 },
      { row: 6, col: 2 },
      { row: 6, col: 3 },
      { row: 6, col: 4 },
      { row: 6, col: 5 },
      { row: 6, col: 6 },
    ],
    starThresholds: [2600, 3800, 5200],
  },
];

export const DEFAULT_LEVEL_1_GOAL: LevelGoal = LEVEL_CONFIGS[0]!;

export function getLevelGoal(levelNumber: number): LevelGoal {
  const idx = Math.max(0, (levelNumber - 1) % LEVEL_CONFIGS.length);
  return LEVEL_CONFIGS[idx]!;
}

/**
 * Creates initial game state for a given goal or level
 */
export function createInitialGameState(
  goal: LevelGoal = DEFAULT_LEVEL_1_GOAL
): PetCrushGameState {
  const board = createInitialBoard(goal.lockedCells || [], goal.swirlCells || []);
  return {
    levelNumber: goal.levelNumber || 1,
    board,
    score: 0,
    hayCollected: 0,
    locksCleared: 0,
    movesRemaining: goal.maxMoves,
    collected: {
      cow: 0,
      pig: 0,
      sheep: 0,
      chicken: 0,
      duck: 0,
      horse: 0,
    },
    goal,
    stars: 0,
    isGameOver: false,
    hasWon: false,
    inSugarCrush: false,
    comboLevel: 0,
    selectedTile: null,
  };
}

function finalizeTurnState(
  state: PetCrushGameState,
  finalBoard: TileData[][],
  newMoves: number,
  totalScore: number,
  totalLocksBroken: number,
  clearedByTreat: Record<TreatType, number>
): PetCrushGameState {
  let newScore = state.score + totalScore;
  let newHay = state.hayCollected + totalScore;
  const newLocksCleared = state.locksCleared + totalLocksBroken;

  const newCollected = { ...state.collected };
  for (const [key, count] of Object.entries(clearedByTreat)) {
    const treat = key as TreatType;
    newCollected[treat] = (newCollected[treat] || 0) + count;
  }

  let collectTargetsMet = true;
  if (state.goal.collectTargets) {
    for (const [key, target] of Object.entries(state.goal.collectTargets)) {
      if ((newCollected[key as TreatType] || 0) < target!) {
        collectTargetsMet = false;
        break;
      }
    }
  }

  // Check if all Caged Animals on the board have been rescued!
  const hasCageObjective = Boolean(state.goal.targetLocks && state.goal.targetLocks > 0);
  let locksGoalMet = true;
  if (hasCageObjective) {
    let remainingBoardLocks = 0;
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        if (finalBoard[r]?.[c]?.isLocked) remainingBoardLocks++;
      }
    }
    locksGoalMet = remainingBoardLocks === 0 || newLocksCleared >= state.goal.targetLocks!;
  }

  // In Caged Animal Rescue levels, rescuing all caged animals wins the level!
  // In custom score/collect levels without cages, reaching collectTargets + targetScore wins.
  const hasWon = hasCageObjective
    ? locksGoalMet && collectTargetsMet
    : collectTargetsMet && newScore >= state.goal.targetScore;

  // Award Harvest Silo Bonus for remaining moves when all caged animals are rescued!
  if (hasWon && hasCageObjective && newMoves > 0) {
    const moveBonus = newMoves * 60;
    newScore += moveBonus;
    newHay += moveBonus;
  }

  let stars = 0;
  if (newScore >= state.goal.starThresholds[2]) stars = 3;
  else if (newScore >= state.goal.starThresholds[1]) stars = 2;
  else if (newScore >= state.goal.starThresholds[0]) stars = 1;
  else if (hasWon) stars = 1;

  const isGameOver = !hasWon && newMoves <= 0;

  let boardToKeep = finalBoard;
  if (!hasWon && !isGameOver && !hasPossibleMoves(finalBoard)) {
    const remainingLocked: LockedCellConfig[] = [];
    const remainingSwirls: { row: number; col: number }[] = [];
    for (let r = 0; r < BOARD_ROWS; r++) {
      for (let c = 0; c < BOARD_COLS; c++) {
        const t = finalBoard[r]?.[c];
        if (t?.isLocked) remainingLocked.push({ row: r, col: c, animal: t.type });
        if (t?.blocker === 'swirl') remainingSwirls.push({ row: r, col: c });
      }
    }
    boardToKeep = createInitialBoard(remainingLocked, remainingSwirls);
  }

  return {
    ...state,
    board: boardToKeep,
    score: newScore,
    hayCollected: newHay,
    locksCleared: newLocksCleared,
    movesRemaining: newMoves,
    collected: newCollected,
    stars,
    isGameOver,
    hasWon,
    selectedTile: null,
  };
}

/**
 * Executes a player swap action and handles cascades and level objectives
 */
export function executeSwap(
  state: PetCrushGameState,
  r1: number,
  c1: number,
  r2: number,
  c2: number
): {
  nextState: PetCrushGameState;
  valid: boolean;
  steps: CascadeStep[];
} {
  if (state.isGameOver || state.hasWon || state.movesRemaining <= 0) {
    return { nextState: state, valid: false, steps: [] };
  }

  if (!canSwap(state.board, r1, c1, r2, c2)) {
    return { nextState: state, valid: false, steps: [] };
  }

  const t1 = state.board[r1]![c1]!;
  const t2 = state.board[r2]![c2]!;
  const newMoves = state.movesRemaining - 1;

  let initialScore = 0;
  const clearedCoords: { row: number; col: number }[] = [];

  const swappedBoard = state.board.map((row) => row.map((t) => ({ ...t })));
  swappedBoard[r1]![c1] = { ...t2, row: r1, col: c1 };
  swappedBoard[r2]![c2] = { ...t1, row: r2, col: c2 };

  const isBomb = (s: SpecialType) => s === 'wrapped_bomb' || s === 'square_bomb';
  const isStriped = (s: SpecialType) => s === 'striped_h' || s === 'striped_v';

  if (t1.special === 'rainbow_star' || t2.special === 'rainbow_star') {
    const otherTile = t1.special === 'rainbow_star' ? t2 : t1;
    clearedCoords.push({ row: r1, col: c1 }, { row: r2, col: c2 });

    if (t1.special === 'rainbow_star' && t2.special === 'rainbow_star') {
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          clearedCoords.push({ row: r, col: c });
        }
      }
      initialScore += 3000;
    } else {
      const targetType = otherTile.type;
      for (let r = 0; r < BOARD_ROWS; r++) {
        for (let c = 0; c < BOARD_COLS; c++) {
          if (swappedBoard[r]![c]!.type === targetType) {
            if (otherTile.special !== 'none') {
              swappedBoard[r]![c] = {
                ...swappedBoard[r]![c]!,
                special: otherTile.special,
              };
            }
            clearedCoords.push({ row: r, col: c });
          }
        }
      }
      initialScore += otherTile.special !== 'none' ? 2000 : 1200;
    }
  } else if (isBomb(t1.special) && isBomb(t2.special)) {
    for (let dr = -2; dr <= 2; dr++) {
      for (let dc = -2; dc <= 2; dc++) {
        const nr = r2 + dr;
        const nc = c2 + dc;
        if (nr >= 0 && nr < BOARD_ROWS && nc >= 0 && nc < BOARD_COLS) {
          clearedCoords.push({ row: nr, col: nc });
        }
      }
    }
    initialScore += 1500;
  } else if (
    (isStriped(t1.special) && isBomb(t2.special)) ||
    (isBomb(t1.special) && isStriped(t2.special))
  ) {
    for (let d = -1; d <= 1; d++) {
      const nr = r2 + d;
      const nc = c2 + d;
      if (nr >= 0 && nr < BOARD_ROWS) {
        for (let c = 0; c < BOARD_COLS; c++) clearedCoords.push({ row: nr, col: c });
      }
      if (nc >= 0 && nc < BOARD_COLS) {
        for (let r = 0; r < BOARD_ROWS; r++) clearedCoords.push({ row: r, col: nc });
      }
    }
    initialScore += 1500;
  } else if (isStriped(t1.special) && isStriped(t2.special)) {
    for (let c = 0; c < BOARD_COLS; c++) clearedCoords.push({ row: r2, col: c });
    for (let r = 0; r < BOARD_ROWS; r++) clearedCoords.push({ row: r, col: c2 });
    initialScore += 1000;
  } else if (t1.special !== 'none' || t2.special !== 'none') {
    if (t1.special !== 'none') clearedCoords.push({ row: r2, col: c2 });
    if (t2.special !== 'none') clearedCoords.push({ row: r1, col: c1 });
    initialScore += 300;
  }

  const { finalBoard, steps, totalScore, totalLocksBroken, clearedByTreat } =
    resolveCascades(swappedBoard, initialScore, clearedCoords);

  const nextState = finalizeTurnState(
    state,
    finalBoard,
    newMoves,
    totalScore,
    totalLocksBroken,
    clearedByTreat
  );

  return {
    nextState,
    valid: true,
    steps,
  };
}

/**
 * Directly detonates a special bomb/booster tile when double-tapped in-place
 */
export function detonateSpecialTile(
  state: PetCrushGameState,
  r: number,
  c: number
): {
  nextState: PetCrushGameState;
  valid: boolean;
  steps: CascadeStep[];
} {
  if (state.isGameOver || state.hasWon || state.movesRemaining <= 0) {
    return { nextState: state, valid: false, steps: [] };
  }

  const tile = state.board[r]?.[c];
  if (!tile || tile.special === 'none' || tile.isLocked) {
    return { nextState: state, valid: false, steps: [] };
  }

  const newMoves = state.movesRemaining - 1;
  const { finalBoard, steps, totalScore, totalLocksBroken, clearedByTreat } =
    resolveCascades(state.board, 300, [{ row: r, col: c }]);

  const nextState = finalizeTurnState(
    state,
    finalBoard,
    newMoves,
    totalScore,
    totalLocksBroken,
    clearedByTreat
  );

  return {
    nextState,
    valid: true,
    steps,
  };
}

/**
 * Candy Crush Lollipop Hammer / Brush Booster: Smashes any single tile, lock, or swirl blocker without using a move!
 */
export function smashTileWithHammer(
  state: PetCrushGameState,
  r: number,
  c: number
): {
  nextState: PetCrushGameState;
  valid: boolean;
  steps: CascadeStep[];
} {
  if (state.isGameOver || state.hasWon) {
    return { nextState: state, valid: false, steps: [] };
  }

  const tile = state.board[r]?.[c];
  if (!tile) {
    return { nextState: state, valid: false, steps: [] };
  }

  const { finalBoard, steps, totalScore, totalLocksBroken, clearedByTreat } =
    resolveCascades(state.board, 150, [{ row: r, col: c }]);

  const nextState = finalizeTurnState(
    state,
    finalBoard,
    state.movesRemaining,
    totalScore,
    totalLocksBroken,
    clearedByTreat
  );

  return {
    nextState,
    valid: true,
    steps,
  };
}

import { Bottle, DrinkColor, WaterSortState } from './types';

export const BOTTLE_CAPACITY = 4;
export const TOTAL_WATER_SORT_LEVELS = 5;

export const COLOR_MAP: Record<DrinkColor, { hex: string; name: string }> = {
  strawberry: { hex: '#f43f5e', name: 'Strawberry' },
  blueberry: { hex: '#3b82f6', name: 'Blueberry' },
  honey: { hex: '#f59e0b', name: 'Golden Honey' },
  matcha: { hex: '#10b981', name: 'Matcha Milk' },
  grape: { hex: '#8b5cf6', name: 'Grape Juice' },
  cream: { hex: '#fef08a', name: 'Fresh Cream' },
};

export function getWaterSortLevelBottles(levelIndex: number): Bottle[] {
  switch (levelIndex) {
    case 1:
      // 3 bottles: 2 colors, 1 empty
      return [
        { id: 0, slots: ['strawberry', 'blueberry', 'strawberry', 'blueberry'], completed: false },
        { id: 1, slots: ['blueberry', 'strawberry', 'blueberry', 'strawberry'], completed: false },
        { id: 2, slots: [], completed: false },
      ];

    case 2:
      // 4 bottles: 3 colors, 1 empty
      return [
        { id: 0, slots: ['strawberry', 'honey', 'blueberry', 'strawberry'], completed: false },
        { id: 1, slots: ['honey', 'blueberry', 'strawberry', 'honey'], completed: false },
        { id: 2, slots: ['blueberry', 'strawberry', 'honey', 'blueberry'], completed: false },
        { id: 3, slots: [], completed: false },
      ];

    case 3:
      // 5 bottles: 3 colors, 2 empty
      return [
        { id: 0, slots: ['honey', 'strawberry', 'honey', 'blueberry'], completed: false },
        { id: 1, slots: ['blueberry', 'honey', 'strawberry', 'strawberry'], completed: false },
        { id: 2, slots: ['strawberry', 'blueberry', 'blueberry', 'honey'], completed: false },
        { id: 3, slots: [], completed: false },
        { id: 4, slots: [], completed: false },
      ];

    case 4:
      // 6 bottles: 4 colors, 2 empty
      return [
        { id: 0, slots: ['matcha', 'strawberry', 'blueberry', 'honey'], completed: false },
        { id: 1, slots: ['strawberry', 'matcha', 'honey', 'blueberry'], completed: false },
        { id: 2, slots: ['blueberry', 'matcha', 'strawberry', 'honey'], completed: false },
        { id: 3, slots: ['honey', 'matcha', 'blueberry', 'strawberry'], completed: false },
        { id: 4, slots: [], completed: false },
        { id: 5, slots: [], completed: false },
      ];

    case 5:
    default:
      // 7 bottles: 5 colors, 2 empty
      return [
        { id: 0, slots: ['grape', 'matcha', 'strawberry', 'blueberry'], completed: false },
        { id: 1, slots: ['honey', 'grape', 'matcha', 'strawberry'], completed: false },
        { id: 2, slots: ['blueberry', 'honey', 'grape', 'matcha'], completed: false },
        { id: 3, slots: ['strawberry', 'blueberry', 'honey', 'grape'], completed: false },
        { id: 4, slots: ['matcha', 'strawberry', 'blueberry', 'honey'], completed: false },
        { id: 5, slots: [], completed: false },
        { id: 6, slots: [], completed: false },
      ];
  }
}

export function isBottleCompleted(b: Bottle): boolean {
  if (b.slots.length !== BOTTLE_CAPACITY) return false;
  return b.slots.every((s) => s === b.slots[0]);
}

export function initWaterSortGame(levelIndex: number = 1): WaterSortState {
  const safeLvl = Math.max(1, Math.min(TOTAL_WATER_SORT_LEVELS, levelIndex));
  const rawBottles = getWaterSortLevelBottles(safeLvl);
  const bottles = rawBottles.map((b) => ({
    ...b,
    completed: isBottleCompleted(b),
  }));

  return {
    levelIndex: safeLvl,
    bottles,
    selectedBottleId: null,
    moves: 0,
    history: [],
    status: 'playing',
    totalLevels: TOTAL_WATER_SORT_LEVELS,
  };
}

export function canPour(source: Bottle, target: Bottle): boolean {
  if (source.id === target.id) return false;
  if (source.slots.length === 0) return false;
  if (target.slots.length >= BOTTLE_CAPACITY) return false;

  // If source is already completed, do not allow pouring out
  if (source.completed) return false;

  const sourceTop = source.slots[source.slots.length - 1];

  // Empty bottle can accept any color
  if (target.slots.length === 0) return true;

  const targetTop = target.slots[target.slots.length - 1];
  return sourceTop === targetTop;
}

export function pourWater(state: WaterSortState, sourceId: number, targetId: number): WaterSortState {
  const source = state.bottles.find((b) => b.id === sourceId);
  const target = state.bottles.find((b) => b.id === targetId);

  if (!source || !target || !canPour(source, target)) {
    return { ...state, selectedBottleId: null };
  }

  // Deep clone current state for history
  const historySnapshot = state.bottles.map((b) => ({ ...b, slots: [...b.slots] }));

  const nextBottles = state.bottles.map((b) => ({
    ...b,
    slots: [...b.slots],
  }));

  const src = nextBottles.find((b) => b.id === sourceId)!;
  const dst = nextBottles.find((b) => b.id === targetId)!;

  const topColor = src.slots[src.slots.length - 1];

  // Transfer all contiguous matching units as long as dst has capacity
  while (
    src.slots.length > 0 &&
    dst.slots.length < BOTTLE_CAPACITY &&
    src.slots[src.slots.length - 1] === topColor
  ) {
    const unit = src.slots.pop()!;
    dst.slots.push(unit);
  }

  // Update completion flags
  src.completed = isBottleCompleted(src);
  dst.completed = isBottleCompleted(dst);

  // Check victory
  const allSolved = nextBottles.every((b) => b.slots.length === 0 || b.completed);
  let status: WaterSortState['status'] = state.status;
  if (allSolved) {
    status = state.levelIndex >= TOTAL_WATER_SORT_LEVELS ? 'victory' : 'level_cleared';
  }

  return {
    ...state,
    bottles: nextBottles,
    selectedBottleId: null,
    moves: state.moves + 1,
    history: [...state.history, historySnapshot],
    status,
  };
}

export function undoWaterSortMove(state: WaterSortState): WaterSortState {
  if (state.history.length === 0) return state;

  const history = [...state.history];
  const prevBottles = history.pop()!;

  return {
    ...state,
    bottles: prevBottles,
    selectedBottleId: null,
    history,
    moves: Math.max(0, state.moves - 1),
    status: 'playing',
  };
}

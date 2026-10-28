import { PegHole, WoodPlank, LevelConfig, WoodNutsState } from './types';

export const WOOD_LEVELS: LevelConfig[] = [
  {
    id: 1,
    name: 'Garden Gate',
    targetPlanks: 2,
    holes: [
      { id: 0, x: 120, y: 180, hasScrew: true, screwColor: '#f59e0b' },
      { id: 1, x: 280, y: 180, hasScrew: true, screwColor: '#f59e0b' },
      { id: 2, x: 200, y: 260, hasScrew: true, screwColor: '#38bdf8' },
      { id: 3, x: 140, y: 370, hasScrew: false, screwColor: '#94a3b8' },
      { id: 4, x: 260, y: 370, hasScrew: false, screwColor: '#94a3b8' },
    ],
    planks: [
      {
        id: 0,
        name: 'Top Cedar Rail',
        color: '#b45309',
        borderColor: '#78350f',
        holeIds: [0, 1],
        pinHoleIds: [0, 1],
        rect: { x: 80, y: 160, width: 240, height: 40, radius: 20 },
      },
      {
        id: 1,
        name: 'Center Pine Post',
        color: '#0284c7',
        borderColor: '#0369a1',
        holeIds: [2],
        pinHoleIds: [2],
        rect: { x: 180, y: 230, width: 40, height: 110, radius: 20 },
      },
    ],
  },
  {
    id: 2,
    name: 'Windmill Vane',
    targetPlanks: 3,
    holes: [
      { id: 0, x: 120, y: 160, hasScrew: true, screwColor: '#ea580c' },
      { id: 1, x: 280, y: 160, hasScrew: true, screwColor: '#ea580c' },
      { id: 2, x: 120, y: 280, hasScrew: true, screwColor: '#16a34a' },
      { id: 3, x: 280, y: 280, hasScrew: true, screwColor: '#16a34a' },
      { id: 4, x: 200, y: 220, hasScrew: false, screwColor: '#94a3b8' },
      { id: 5, x: 200, y: 370, hasScrew: false, screwColor: '#94a3b8' },
    ],
    planks: [
      {
        id: 0,
        name: 'Upper Orange Blade',
        color: '#ea580c',
        borderColor: '#c2410c',
        holeIds: [0, 1],
        pinHoleIds: [0, 1],
        rect: { x: 80, y: 140, width: 240, height: 40, radius: 20 },
      },
      {
        id: 1,
        name: 'Lower Green Blade',
        color: '#16a34a',
        borderColor: '#15803d',
        holeIds: [2, 3],
        pinHoleIds: [2, 3],
        rect: { x: 80, y: 260, width: 240, height: 40, radius: 20 },
      },
      {
        id: 2,
        name: 'Center Pivot Post',
        color: '#b45309',
        borderColor: '#78350f',
        holeIds: [4, 5],
        pinHoleIds: [], // Free once others move or starts unpinned
        rect: { x: 180, y: 180, width: 40, height: 160, radius: 20 },
      },
    ],
  },
  {
    id: 3,
    name: 'Silo Ladder',
    targetPlanks: 3,
    holes: [
      { id: 0, x: 130, y: 140, hasScrew: true, screwColor: '#8b5cf6' },
      { id: 1, x: 270, y: 140, hasScrew: true, screwColor: '#8b5cf6' },
      { id: 2, x: 130, y: 240, hasScrew: true, screwColor: '#f59e0b' },
      { id: 3, x: 270, y: 240, hasScrew: true, screwColor: '#f59e0b' },
      { id: 4, x: 130, y: 340, hasScrew: true, screwColor: '#06b6d4' },
      { id: 5, x: 270, y: 340, hasScrew: false, screwColor: '#94a3b8' },
      { id: 6, x: 200, y: 410, hasScrew: false, screwColor: '#94a3b8' },
    ],
    planks: [
      {
        id: 0,
        name: 'Top Purple Rung',
        color: '#8b5cf6',
        borderColor: '#7c3aed',
        holeIds: [0, 1],
        pinHoleIds: [0, 1],
        rect: { x: 90, y: 120, width: 220, height: 40, radius: 20 },
      },
      {
        id: 1,
        name: 'Middle Gold Rung',
        color: '#f59e0b',
        borderColor: '#d97706',
        holeIds: [2, 3],
        pinHoleIds: [2, 3],
        rect: { x: 90, y: 220, width: 220, height: 40, radius: 20 },
      },
      {
        id: 2,
        name: 'Bottom Cyan Rung',
        color: '#06b6d4',
        borderColor: '#0891b2',
        holeIds: [4, 5],
        pinHoleIds: [4],
        rect: { x: 90, y: 320, width: 220, height: 40, radius: 20 },
      },
    ],
  },
  {
    id: 4,
    name: 'Barn Truss',
    targetPlanks: 4,
    holes: [
      { id: 0, x: 110, y: 140, hasScrew: true, screwColor: '#ec4899' },
      { id: 1, x: 290, y: 140, hasScrew: true, screwColor: '#ec4899' },
      { id: 2, x: 110, y: 240, hasScrew: true, screwColor: '#10b981' },
      { id: 3, x: 290, y: 240, hasScrew: true, screwColor: '#10b981' },
      { id: 4, x: 200, y: 190, hasScrew: true, screwColor: '#f97316' },
      { id: 5, x: 110, y: 340, hasScrew: true, screwColor: '#6366f1' },
      { id: 6, x: 290, y: 340, hasScrew: false, screwColor: '#94a3b8' },
      { id: 7, x: 200, y: 380, hasScrew: false, screwColor: '#94a3b8' },
    ],
    planks: [
      {
        id: 0,
        name: 'Pink Cross Beam',
        color: '#ec4899',
        borderColor: '#db2777',
        holeIds: [0, 1],
        pinHoleIds: [0, 1],
        rect: { x: 70, y: 120, width: 260, height: 40, radius: 20 },
      },
      {
        id: 1,
        name: 'Emerald Brace',
        color: '#10b981',
        borderColor: '#059669',
        holeIds: [2, 3],
        pinHoleIds: [2, 3],
        rect: { x: 70, y: 220, width: 260, height: 40, radius: 20 },
      },
      {
        id: 2,
        name: 'Orange Tie Pin',
        color: '#f97316',
        borderColor: '#ea580c',
        holeIds: [4],
        pinHoleIds: [4],
        rect: { x: 175, y: 165, width: 50, height: 110, radius: 20 },
      },
      {
        id: 3,
        name: 'Indigo Base Beam',
        color: '#6366f1',
        borderColor: '#4f46e5',
        holeIds: [5, 6],
        pinHoleIds: [5],
        rect: { x: 70, y: 320, width: 260, height: 40, radius: 20 },
      },
    ],
  },
];

export function createInitialState(levelIndex: number = 0): WoodNutsState {
  const safeIdx = Math.max(0, Math.min(levelIndex, WOOD_LEVELS.length - 1));
  const config = WOOD_LEVELS[safeIdx]!;

  const holes: PegHole[] = config.holes.map(h => ({ ...h }));
  const planks: WoodPlank[] = config.planks.map(p => ({
    ...p,
    holeIds: [...p.holeIds],
    pinHoleIds: [...p.pinHoleIds],
    isFallen: false,
    fallY: 0,
    fallRotation: 0,
    fallVelocity: 0,
  }));

  return {
    level: safeIdx + 1,
    maxLevels: WOOD_LEVELS.length,
    holes,
    planks,
    selectedHoleId: null,
    moves: 0,
    score: 0,
    levelCleared: false,
    levelFailed: false,
    targetPlanks: config.targetPlanks,
  };
}

export function handleHoleClick(state: WoodNutsState, clickedHoleId: number): {
  type: 'select' | 'move' | 'deselect' | 'invalid';
  screwMoved?: boolean;
  fallenPlankIds?: number[];
} {
  if (state.levelCleared || state.levelFailed) return { type: 'invalid' };

  const hole = state.holes.find(h => h.id === clickedHoleId);
  if (!hole) return { type: 'invalid' };

  // Case 1: No screw currently selected
  if (state.selectedHoleId === null) {
    if (hole.hasScrew) {
      state.selectedHoleId = clickedHoleId;
      return { type: 'select' };
    }
    return { type: 'invalid' };
  }

  // Case 2: Clicking the already selected hole deselects it
  if (state.selectedHoleId === clickedHoleId) {
    state.selectedHoleId = null;
    return { type: 'deselect' };
  }

  // Case 3: Moving selected screw to an empty hole
  const sourceHole = state.holes.find(h => h.id === state.selectedHoleId);
  if (!sourceHole || !sourceHole.hasScrew) {
    state.selectedHoleId = null;
    return { type: 'invalid' };
  }

  if (hole.hasScrew) {
    // Switch selection to this new screw
    state.selectedHoleId = clickedHoleId;
    return { type: 'select' };
  }

  // Move the screw from sourceHole to clickedHole
  hole.hasScrew = true;
  hole.screwColor = sourceHole.screwColor;

  sourceHole.hasScrew = false;
  sourceHole.screwColor = '#94a3b8';

  const movedHoleId = sourceHole.id;
  state.selectedHoleId = null;
  state.moves += 1;

  // Update plank pinning
  const fallenPlankIds: number[] = [];

  for (const plank of state.planks) {
    if (plank.isFallen) continue;

    // If source hole was pinning this plank, remove it
    const pinIdx = plank.pinHoleIds.indexOf(movedHoleId);
    if (pinIdx !== -1) {
      plank.pinHoleIds.splice(pinIdx, 1);
    }

    // Check if target hole now pins this plank
    if (plank.holeIds.includes(clickedHoleId) && !plank.pinHoleIds.includes(clickedHoleId)) {
      plank.pinHoleIds.push(clickedHoleId);
    }

    // Check if plank is now completely free of pins!
    if (plank.pinHoleIds.length === 0) {
      plank.isFallen = true;
      plank.fallVelocity = 120;
      fallenPlankIds.push(plank.id);
      state.score += 250;
    }
  }

  // Check if all planks have fallen
  const remainingPlanks = state.planks.filter(p => !p.isFallen);
  if (remainingPlanks.length === 0) {
    state.levelCleared = true;
    state.score += 500;
  }

  return { type: 'move', screwMoved: true, fallenPlankIds };
}

export function updatePhysics(state: WoodNutsState, dt: number): void {
  // Update falling animations for freed planks
  for (const plank of state.planks) {
    if (plank.isFallen) {
      plank.fallVelocity += 900 * dt; // Gravity
      plank.fallY += plank.fallVelocity * dt;
      plank.fallRotation += 1.2 * dt;
    }
  }
}

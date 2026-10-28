import { AnimalStageConfig, CleaningTool, MudAnimalId, MudPatch, PiggyMudWashState, ScrubResult } from './types';

export const STAGES: AnimalStageConfig[] = [
  {
    id: 'piggy',
    name: 'Penny the Piglet',
    species: 'Farm Piglet',
    title: 'The Mud Puddle Splasher',
    story: 'Penny rolled around the farm mud pit all morning! Give her a warm bubbly bath for the County Fair.',
    accentColor: '#f472b6',
    patches: [
      { x: 200, y: 190, radius: 42 }, // Snout & cheeks
      { x: 155, y: 150, radius: 32 }, // Left ear
      { x: 245, y: 150, radius: 32 }, // Right ear
      { x: 160, y: 260, radius: 46 }, // Left flank & belly
      { x: 240, y: 260, radius: 46 }, // Right flank & belly
      { x: 200, y: 320, radius: 38 }, // Lower tummy
      { x: 170, y: 380, radius: 30 }, // Left trotter
      { x: 230, y: 380, radius: 30 }, // Right trotter
    ],
  },
  {
    id: 'puppy',
    name: 'Barnaby the Golden Pup',
    species: 'Golden Retriever',
    title: 'The Garden Digger',
    story: 'Barnaby dug up the potato patch and covered his golden coat in rich garden soil. Clean him up!',
    accentColor: '#f59e0b',
    patches: [
      { x: 200, y: 165, radius: 40 }, // Muzzle & nose
      { x: 150, y: 180, radius: 34 }, // Left floppy ear
      { x: 250, y: 180, radius: 34 }, // Right floppy ear
      { x: 200, y: 240, radius: 44 }, // Chest
      { x: 150, y: 300, radius: 40 }, // Left front paw
      { x: 250, y: 300, radius: 40 }, // Right front paw
      { x: 170, y: 375, radius: 35 }, // Left back foot
      { x: 230, y: 375, radius: 35 }, // Right back foot
    ],
  },
  {
    id: 'calf',
    name: 'Daisy the Baby Calf',
    species: 'Dairy Calf',
    title: 'The Pasture Romper',
    story: 'Daisy galloped through the rainy pasture marsh! Wash her spotted coat clean and shiny.',
    accentColor: '#10b981',
    patches: [
      { x: 200, y: 175, radius: 45 }, // Cow muzzle & pink nose
      { x: 145, y: 135, radius: 36 }, // Left horn bud & ear
      { x: 255, y: 135, radius: 36 }, // Right horn bud & ear
      { x: 190, y: 255, radius: 48 }, // Spot on chest
      { x: 140, y: 320, radius: 42 }, // Left flank splash
      { x: 260, y: 320, radius: 42 }, // Right flank splash
      { x: 160, y: 390, radius: 32 }, // Front hoof
      { x: 240, y: 390, radius: 32 }, // Rear hoof
    ],
  },
  {
    id: 'lamb',
    name: 'Woolly the Little Lamb',
    species: 'Merino Lamb',
    title: 'The Bramble Wanderer',
    story: 'Woolly got peat moss and damp leaves tangled in her fluffy white wool. Give her a spa treatment!',
    accentColor: '#8b5cf6',
    patches: [
      { x: 200, y: 160, radius: 40 }, // Face & forehead
      { x: 140, y: 165, radius: 34 }, // Left wool curl
      { x: 260, y: 165, radius: 34 }, // Right wool curl
      { x: 200, y: 240, radius: 52 }, // Center woolly fleece
      { x: 145, y: 290, radius: 45 }, // Left wool side
      { x: 255, y: 290, radius: 45 }, // Right wool side
      { x: 170, y: 370, radius: 30 }, // Left hoof
      { x: 230, y: 370, radius: 30 }, // Right hoof
    ],
  },
];

export function createInitialPatches(stageConfig: AnimalStageConfig): MudPatch[] {
  return stageConfig.patches.map((p, idx) => ({
    id: idx,
    x: p.x,
    y: p.y,
    radius: p.radius,
    dirtLevel: 1.0,
    soapLevel: 0.0,
    isWet: false,
  }));
}

export function calculateCleanPercent(patches: MudPatch[]): number {
  if (patches.length === 0) return 100;
  
  let totalScore = 0;
  for (const patch of patches) {
    const mudRemoved = Math.max(0, 1 - patch.dirtLevel); // 0.0 (all mud) to 1.0 (no mud)
    let score = mudRemoved * 80; // 0 to 80%

    // Bonus for rinsing soap and drying
    if (patch.dirtLevel <= 0.2) {
      score += (1 - patch.soapLevel) * 10; // +10%
      if (!patch.isWet && patch.dirtLevel <= 0.05 && patch.soapLevel <= 0.05) {
        score += 10; // +10% for dry
      }
    }
    totalScore += score;
  }

  const rawPercent = totalScore / patches.length;
  return Math.min(100, Math.max(0, Math.round(rawPercent)));
}

export function isStageFullyClean(patches: MudPatch[]): boolean {
  return patches.every(
    (p) => p.dirtLevel <= 0.02 && p.soapLevel <= 0.02 && !p.isWet
  );
}

export function createInitialState(stageIndex = 0): PiggyMudWashState {
  const safeStage = Math.max(0, Math.min(stageIndex, STAGES.length - 1));
  const stageConfig = STAGES[safeStage]!;
  const patches = createInitialPatches(stageConfig);

  return {
    currentStageIndex: safeStage,
    selectedTool: 'sponge',
    score: 0,
    cleanPercent: 0,
    stageComplete: false,
    gameComplete: false,
    patches,
    ribbonAwarded: false,
    totalDirtInitial: patches.length,
  };
}

export function selectTool(state: PiggyMudWashState, tool: CleaningTool): PiggyMudWashState {
  return {
    ...state,
    selectedTool: tool,
  };
}

export function applyScrub(
  state: PiggyMudWashState,
  x: number,
  y: number,
  brushRadius = 38
): { nextState: PiggyMudWashState; result: ScrubResult } {
  if (state.stageComplete || state.gameComplete) {
    return {
      nextState: state,
      result: {
        cleanedAmount: 0,
        soapApplied: 0,
        rinsedAmount: 0,
        driedAmount: 0,
        nextCleanPercent: state.cleanPercent,
        isStageNowComplete: state.stageComplete,
      },
    };
  }

  let cleanedAmount = 0;
  let soapApplied = 0;
  let rinsedAmount = 0;
  let driedAmount = 0;

  const nextPatches = state.patches.map((patch) => {
    const dx = x - patch.x;
    const dy = y - patch.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxReach = patch.radius + brushRadius;

    if (dist >= maxReach) {
      return patch;
    }

    // Proximity factor: 1.0 at center, drops off toward edge
    const factor = Math.max(0.15, 1 - dist / maxReach);

    let nextDirt = patch.dirtLevel;
    let nextSoap = patch.soapLevel;
    let nextWet = patch.isWet;

    if (state.selectedTool === 'sponge') {
      // Sponge applies soapy bubbles and loosens mud
      const soapAdd = 0.28 * factor;
      const dirtSub = 0.18 * factor;

      if (nextSoap < 1.0) {
        soapApplied += soapAdd;
        nextSoap = Math.min(1.0, nextSoap + soapAdd);
      }
      if (nextDirt > 0) {
        cleanedAmount += dirtSub;
        nextDirt = Math.max(0, nextDirt - dirtSub);
      }
    } else if (state.selectedTool === 'water') {
      // Water jet rinses soap away, rinses loosened mud, leaves area wet
      const rinseVal = 0.35 * factor;
      if (nextSoap > 0) {
        rinsedAmount += Math.min(nextSoap, rinseVal);
        nextSoap = Math.max(0, nextSoap - rinseVal);
      }
      if (nextDirt > 0) {
        // Water also washes off remaining mud if soaped
        const dirtRinse = 0.25 * factor;
        cleanedAmount += Math.min(nextDirt, dirtRinse);
        nextDirt = Math.max(0, nextDirt - dirtRinse);
      }
      nextWet = true;
    } else if (state.selectedTool === 'towel') {
      // Towel dries wetness once soap and dirt are mostly washed away
      if (nextDirt <= 0.15 && nextSoap <= 0.15 && nextWet) {
        driedAmount += 1;
        nextWet = false;
        // Polish remaining minor trace dirt to zero
        nextDirt = 0;
        nextSoap = 0;
      }
    }

    return {
      ...patch,
      dirtLevel: Number(nextDirt.toFixed(3)),
      soapLevel: Number(nextSoap.toFixed(3)),
      isWet: nextWet,
    };
  });

  const nextPercent = calculateCleanPercent(nextPatches);
  const nowComplete = isStageFullyClean(nextPatches);

  let addedScore = 0;
  if (cleanedAmount > 0) addedScore += Math.round(cleanedAmount * 50);
  if (rinsedAmount > 0) addedScore += Math.round(rinsedAmount * 40);
  if (driedAmount > 0) addedScore += driedAmount * 25;
  if (nowComplete && !state.stageComplete) {
    addedScore += 500; // Stage completion blue ribbon bonus
  }

  const nextState: PiggyMudWashState = {
    ...state,
    patches: nextPatches,
    score: state.score + addedScore,
    cleanPercent: nextPercent,
    stageComplete: nowComplete,
    ribbonAwarded: nowComplete,
  };

  return {
    nextState,
    result: {
      cleanedAmount,
      soapApplied,
      rinsedAmount,
      driedAmount,
      nextCleanPercent: nextPercent,
      isStageNowComplete: nowComplete,
    },
  };
}

export function nextStage(state: PiggyMudWashState): PiggyMudWashState {
  const nextIdx = state.currentStageIndex + 1;
  if (nextIdx >= STAGES.length) {
    return {
      ...state,
      gameComplete: true,
      stageComplete: true,
    };
  }

  const stageConfig = STAGES[nextIdx]!;
  const patches = createInitialPatches(stageConfig);

  return {
    ...state,
    currentStageIndex: nextIdx,
    selectedTool: 'sponge',
    cleanPercent: 0,
    stageComplete: false,
    ribbonAwarded: false,
    patches,
    totalDirtInitial: patches.length,
  };
}

export function restartStage(state: PiggyMudWashState): PiggyMudWashState {
  const stageConfig = STAGES[state.currentStageIndex]!;
  const patches = createInitialPatches(stageConfig);

  return {
    ...state,
    selectedTool: 'sponge',
    cleanPercent: 0,
    stageComplete: false,
    ribbonAwarded: false,
    patches,
  };
}

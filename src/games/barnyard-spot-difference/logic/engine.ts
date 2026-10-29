import {
  DifferencePoint,
  SpotGameEvent,
  SpotGameState,
  SpotScene,
} from './types';

export const LEVEL_SCENES: SpotScene[] = [
  {
    id: 'scene-1',
    name: 'Sunny Barnyard Morning',
    differences: [
      { id: 'd1_1', x: 0.50, y: 0.16, radius: 0.08, description: 'Weather Vane on Barn Roof' },
      { id: 'd1_2', x: 0.82, y: 0.18, radius: 0.08, description: 'Sun vs Fluffy Cloud' },
      { id: 'd1_3', x: 0.28, y: 0.62, radius: 0.08, description: 'Golden Bell on Cow Collar' },
      { id: 'd1_4', x: 0.88, y: 0.72, radius: 0.08, description: 'Purple vs Yellow Sunflower' },
      { id: 'd1_5', x: 0.64, y: 0.78, radius: 0.08, description: 'Tractor Wheel Hubcap' },
    ],
  },
  {
    id: 'scene-2',
    name: 'Apple Orchard Harvest',
    differences: [
      { id: 'd2_1', x: 0.48, y: 0.32, radius: 0.08, description: 'Scarecrow Hat Ribbon' },
      { id: 'd2_2', x: 0.22, y: 0.25, radius: 0.08, description: 'Golden Apple in Tree' },
      { id: 'd2_3', x: 0.78, y: 0.36, radius: 0.08, description: 'Barn Kitten in Tree Branch' },
      { id: 'd2_4', x: 0.35, y: 0.78, radius: 0.08, description: 'Fruit Basket Apple Pile' },
      { id: 'd2_5', x: 0.68, y: 0.65, radius: 0.08, description: 'Pasture Butterfly' },
    ],
  },
  {
    id: 'scene-3',
    name: 'Duck Pond Picnic',
    differences: [
      { id: 'd3_1', x: 0.30, y: 0.70, radius: 0.08, description: 'Little Green Frog on Lilypad' },
      { id: 'd3_2', x: 0.55, y: 0.58, radius: 0.08, description: 'Mama Duck Pink Flower Hat' },
      { id: 'd3_3', x: 0.76, y: 0.82, radius: 0.08, description: 'Cherry Pie on Blanket' },
      { id: 'd3_4', x: 0.15, y: 0.42, radius: 0.08, description: 'Bridge Wooden Lantern' },
      { id: 'd3_5', x: 0.40, y: 0.20, radius: 0.08, description: 'Flying Dragonfly in Sky' },
    ],
  },
];

export const MAX_LEVEL_TIME = 90; // seconds

export function createInitialState(level = 1): SpotGameState {
  const sceneIndex = Math.max(0, Math.min(LEVEL_SCENES.length - 1, level - 1));
  const scene = LEVEL_SCENES[sceneIndex];

  return {
    status: 'playing',
    level,
    score: 0,
    lives: 3,
    hints: 3,
    timeRemaining: MAX_LEVEL_TIME,
    maxTime: MAX_LEVEL_TIME,
    foundIds: [],
    activeHintId: undefined,
    scene,
    events: [],
  };
}

export function clickDifference(
  state: SpotGameState,
  normX: number,
  normY: number
): SpotGameState {
  if (state.status !== 'playing') return state;

  // Check if click hits any unspotted difference
  const unspotted = state.scene.differences.filter((d) => !state.foundIds.includes(d.id));

  let matchedDiff: DifferencePoint | null = null;
  for (const diff of unspotted) {
    const dist = Math.hypot(normX - diff.x, normY - diff.y);
    if (dist <= diff.radius) {
      matchedDiff = diff;
      break;
    }
  }

  if (matchedDiff) {
    // Correct Spot!
    const updatedFound = [...state.foundIds, matchedDiff.id];
    const pointsEarned = 250 + Math.round(state.timeRemaining * 2);
    const newScore = state.score + pointsEarned;

    const events: SpotGameEvent[] = [
      ...state.events,
      {
        type: 'found',
        diffId: matchedDiff.id,
        x: matchedDiff.x,
        y: matchedDiff.y,
        points: pointsEarned,
      },
    ];

    let nextStatus: SpotGameState['status'] = 'playing';
    if (updatedFound.length >= state.scene.differences.length) {
      if (state.level < LEVEL_SCENES.length) {
        nextStatus = 'round_clear';
        events.push({ type: 'round_clear', level: state.level, score: newScore });
      } else {
        nextStatus = 'victory';
        events.push({ type: 'victory', finalScore: newScore });
      }
    }

    return {
      ...state,
      status: nextStatus,
      score: newScore,
      foundIds: updatedFound,
      activeHintId: state.activeHintId === matchedDiff.id ? undefined : state.activeHintId,
      events,
    };
  } else {
    // Misclick penalty
    const nextLives = state.lives - 1;
    const events: SpotGameEvent[] = [
      ...state.events,
      { type: 'miss', x: normX, y: normY, livesRemaining: nextLives },
    ];

    let nextStatus: SpotGameState['status'] = 'playing';
    if (nextLives <= 0) {
      nextStatus = 'game_over';
      events.push({ type: 'game_over', reason: 'out_of_lives', score: state.score });
    }

    return {
      ...state,
      status: nextStatus,
      lives: nextLives,
      events,
    };
  }
}

export function useHint(state: SpotGameState): SpotGameState {
  if (state.status !== 'playing' || state.hints <= 0) return state;

  const unspotted = state.scene.differences.filter((d) => !state.foundIds.includes(d.id));
  if (unspotted.length === 0) return state;

  const chosenHint = unspotted[0];
  const events: SpotGameEvent[] = [
    ...state.events,
    { type: 'hint_used', diffId: chosenHint.id },
  ];

  return {
    ...state,
    hints: state.hints - 1,
    activeHintId: chosenHint.id,
    events,
  };
}

export function updateGame(state: SpotGameState, dt: number): SpotGameState {
  if (state.status !== 'playing') {
    return state;
  }

  const clampedDt = Math.min(0.04, Math.max(0.001, dt));
  const newTime = Math.max(0, state.timeRemaining - clampedDt);

  if (newTime <= 0) {
    const events: SpotGameEvent[] = [
      ...state.events,
      { type: 'game_over', reason: 'out_of_time', score: state.score },
    ];
    return {
      ...state,
      status: 'game_over',
      timeRemaining: 0,
      events,
    };
  }

  return {
    ...state,
    timeRemaining: newTime,
    events: [],
  };
}

export function advanceLevel(state: SpotGameState): SpotGameState {
  const nextLevel = Math.min(LEVEL_SCENES.length, state.level + 1);
  const nextScene = LEVEL_SCENES[nextLevel - 1];

  return {
    ...state,
    status: 'playing',
    level: nextLevel,
    timeRemaining: MAX_LEVEL_TIME,
    foundIds: [],
    activeHintId: undefined,
    scene: nextScene,
    events: [],
  };
}

export function restartLevel(state: SpotGameState): SpotGameState {
  return createInitialState(state.level);
}

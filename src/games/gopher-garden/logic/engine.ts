export type MoundContent = 'none' | 'normal' | 'golden' | 'thistle';
export type MoundState = 'empty' | 'emerging' | 'up' | 'hit' | 'hiding';
export type VegetableType = 'carrot' | 'corn' | 'pumpkin';

export interface GardenMound {
  id: number;
  content: MoundContent;
  state: MoundState;
  stateTimer: number; // in seconds
  vegetable: VegetableType;
}

export interface GopherGardenState {
  score: number;
  highScore: number;
  timeLeft: number; // 60 seconds game
  isFrenzy: boolean;
  frenzyTimeLeft: number;
  combo: number;
  maxCombo: number;
  totalWhacked: number;
  goldenWhacked: number;
  mounds: GardenMound[];
  gameOver: boolean;
  lastHitResult: {
    moundId: number;
    points: number;
    type: MoundContent;
  } | null;
}

export const GAME_DURATION_SECONDS = 60;
export const FRENZY_DURATION_SECONDS = 6;
export const POP_DURATION_SECONDS = 1.35;

export function createInitialGardenState(highScore: number = 0): GopherGardenState {
  const veggies: VegetableType[] = ['carrot', 'corn', 'pumpkin'];
  const mounds: GardenMound[] = Array.from({ length: 9 }, (_, i) => ({
    id: i,
    content: 'none',
    state: 'empty',
    stateTimer: 0.5 + Math.random() * 1.5,
    vegetable: veggies[i % 3],
  }));

  return {
    score: 0,
    highScore,
    timeLeft: GAME_DURATION_SECONDS,
    isFrenzy: false,
    frenzyTimeLeft: 0,
    combo: 0,
    maxCombo: 0,
    totalWhacked: 0,
    goldenWhacked: 0,
    mounds,
    gameOver: false,
    lastHitResult: null,
  };
}

export function updateGardenState(state: GopherGardenState, dtSeconds: number): GopherGardenState {
  if (state.gameOver) return state;

  // 1. Update Game Timer
  const newTimeLeft = Math.max(0, state.timeLeft - dtSeconds);
  if (newTimeLeft <= 0) {
    return {
      ...state,
      timeLeft: 0,
      gameOver: true,
      highScore: Math.max(state.highScore, state.score),
      lastHitResult: null,
    };
  }

  // 2. Update Harvest Frenzy Timer
  let isFrenzy = state.isFrenzy;
  let frenzyTimeLeft = state.frenzyTimeLeft;
  if (isFrenzy) {
    frenzyTimeLeft -= dtSeconds;
    if (frenzyTimeLeft <= 0) {
      isFrenzy = false;
      frenzyTimeLeft = 0;
    }
  }

  // 3. Update Mounds
  const speedMultiplier = isFrenzy ? 1.4 : 1.0;
  const newMounds = state.mounds.map((mound) => {
    let nextTimer = mound.stateTimer - dtSeconds * speedMultiplier;
    let nextState = mound.state;
    let nextContent = mound.content;

    if (nextTimer <= 0) {
      if (nextState === 'empty') {
        // Spawn chance
        const spawnRoll = Math.random();
        if (spawnRoll < 0.7) {
          nextState = 'up';
          // 15% Golden King, 20% Thistle, 65% Normal
          const typeRoll = Math.random();
          if (typeRoll < 0.15) {
            nextContent = 'golden';
          } else if (typeRoll < 0.35) {
            nextContent = 'thistle';
          } else {
            nextContent = 'normal';
          }
          nextTimer = isFrenzy ? 0.95 : POP_DURATION_SECONDS;
        } else {
          nextTimer = 0.8 + Math.random() * 1.2;
        }
      } else if (nextState === 'up') {
        // Missed, retreats underground
        nextState = 'hiding';
        nextTimer = 0.25;
      } else if (nextState === 'hiding' || nextState === 'hit') {
        nextState = 'empty';
        nextContent = 'none';
        nextTimer = 0.5 + Math.random() * 1.5;
      }
    }

    return {
      ...mound,
      state: nextState,
      content: nextContent,
      stateTimer: nextTimer,
    };
  });

  return {
    ...state,
    timeLeft: newTimeLeft,
    isFrenzy,
    frenzyTimeLeft,
    mounds: newMounds,
  };
}

export interface TapResult {
  state: GopherGardenState;
  hit: boolean;
  type: MoundContent;
  pointsEarned: number;
}

export function tapGardenMound(state: GopherGardenState, moundId: number): TapResult {
  if (state.gameOver || moundId < 0 || moundId >= state.mounds.length) {
    return { state, hit: false, type: 'none', pointsEarned: 0 };
  }

  const targetMound = state.mounds[moundId];

  // Only tap if up or emerging
  if (targetMound.state !== 'up' || targetMound.content === 'none') {
    // Tapped empty dirt - small combo break
    return {
      state: {
        ...state,
        combo: 0,
      },
      hit: false,
      type: 'none',
      pointsEarned: 0,
    };
  }

  let points = 0;
  let newCombo = state.combo;
  let isFrenzy = state.isFrenzy;
  let frenzyTimeLeft = state.frenzyTimeLeft;
  let goldenWhacked = state.goldenWhacked;
  let totalWhacked = state.totalWhacked;

  if (targetMound.content === 'normal') {
    newCombo += 1;
    const multiplier = 1 + Math.min(4, Math.floor(newCombo / 4));
    points = 100 * multiplier * (isFrenzy ? 2 : 1);
    totalWhacked += 1;
  } else if (targetMound.content === 'golden') {
    newCombo += 2;
    points = 300 * (isFrenzy ? 2 : 1);
    isFrenzy = true;
    frenzyTimeLeft = FRENZY_DURATION_SECONDS;
    goldenWhacked += 1;
    totalWhacked += 1;
  } else if (targetMound.content === 'thistle') {
    // Penalty
    points = -150;
    newCombo = 0;
  }

  const newScore = Math.max(0, state.score + points);
  const newHighScore = Math.max(state.highScore, newScore);

  const updatedMounds = state.mounds.map((mound) => {
    if (mound.id === moundId) {
      return {
        ...mound,
        state: 'hit' as MoundState,
        stateTimer: 0.35, // stays in hit squash frame
      };
    }
    return mound;
  });

  const nextState: GopherGardenState = {
    ...state,
    score: newScore,
    highScore: newHighScore,
    combo: newCombo,
    maxCombo: Math.max(state.maxCombo, newCombo),
    totalWhacked,
    goldenWhacked,
    isFrenzy,
    frenzyTimeLeft,
    mounds: updatedMounds,
    lastHitResult: {
      moundId,
      points,
      type: targetMound.content,
    },
  };

  return {
    state: nextState,
    hit: targetMound.content !== 'thistle',
    type: targetMound.content,
    pointsEarned: points,
  };
}

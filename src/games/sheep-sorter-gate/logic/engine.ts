import {
  SheepSorterState,
  RunningSheep,
  SheepSorterEvent,
  SheepColor,
  GateDirection,
} from './types';

export const GATE_JUNCTION_Y = 310;
export const RUNWAY_TOP_Y = -30;
export const RUNWAY_X = 210;

export function createInitialState(savedHighScore: number = 0): SheepSorterState {
  return {
    status: 'playing',
    gateDir: 'left',
    gateAngle: -1, // -1 for left, 1 for right
    score: 0,
    highScore: savedHighScore,
    combo: 0,
    maxCombo: 0,
    lives: 3,
    sheepList: [],
    spawnTimer: 0.5, // first sheep spawns in 0.5s
    spawnInterval: 1.35,
    difficultySpeed: 130,
    totalSorted: 0,
    feverActive: false,
    feverTimer: 0,
  };
}

export function switchGate(
  state: SheepSorterState,
  targetDir?: GateDirection
): { state: SheepSorterState; event?: SheepSorterEvent } {
  if (state.status !== 'playing') {
    return { state };
  }

  const nextDir: GateDirection = targetDir || (state.gateDir === 'left' ? 'right' : 'left');
  if (nextDir === state.gateDir) {
    return { state };
  }

  return {
    state: {
      ...state,
      gateDir: nextDir,
    },
    event: { type: 'gate_switched', newDir: nextDir },
  };
}

export function spawnSheep(state: SheepSorterState): RunningSheep {
  const roll = Math.random();
  let color: SheepColor = 'white';
  let targetGate: GateDirection = 'left';
  let points = 10;

  if (state.feverActive) {
    // During fever, lots of golden sheep
    color = Math.random() < 0.6 ? 'golden' : (Math.random() < 0.5 ? 'white' : 'black');
  } else if (state.totalSorted > 20 && roll < 0.12) {
    color = 'golden';
    points = 50;
    targetGate = 'right';
  } else if (state.totalSorted > 10 && roll < 0.35) {
    color = 'pink';
    points = 25;
    targetGate = 'left';
  } else if (roll < 0.65) {
    color = 'black';
    points = 15;
    targetGate = 'right';
  } else {
    color = 'white';
    points = 10;
    targetGate = 'left';
  }

  if (color === 'golden') {
    targetGate = 'right';
    points = 50;
  } else if (color === 'pink') {
    targetGate = 'left';
    points = 25;
  } else if (color === 'black') {
    targetGate = 'right';
    points = 15;
  } else {
    targetGate = 'left';
    points = 10;
  }

  return {
    id: `sheep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    color,
    targetGate,
    y: RUNWAY_TOP_Y,
    speed: state.difficultySpeed + (Math.random() - 0.5) * 15,
    points,
    bobOffset: Math.random() * Math.PI * 2,
  };
}

export function restartGame(state: SheepSorterState): SheepSorterState {
  return createInitialState(state.highScore);
}

export function updateEngine(
  state: SheepSorterState,
  dt: number
): { state: SheepSorterState; events: SheepSorterEvent[] } {
  if (state.status !== 'playing') {
    return { state, events: [] };
  }

  const events: SheepSorterEvent[] = [];
  const safeDt = Math.min(0.04, Math.max(0.001, dt));

  // 1. Update Fever Timer
  let nextFeverTimer = Math.max(0, state.feverTimer - safeDt);
  let nextFeverActive = nextFeverTimer > 0;

  // 2. Gate Angle Lerp
  const targetAngle = state.gateDir === 'left' ? -1 : 1;
  const nextAngle = state.gateAngle + (targetAngle - state.gateAngle) * Math.min(1, safeDt * 18);

  // 3. Spawn Sheep
  let nextSpawnTimer = state.spawnTimer - safeDt;
  const nextSheepList: RunningSheep[] = [];

  if (nextSpawnTimer <= 0) {
    nextSheepList.push(spawnSheep(state));
    nextSpawnTimer = state.spawnInterval;
  }

  // 4. Update Existing Sheep
  let nextScore = state.score;
  let nextCombo = state.combo;
  let nextMaxCombo = state.maxCombo;
  let nextLives = state.lives;
  let nextTotalSorted = state.totalSorted;

  for (let i = 0; i < state.sheepList.length; i++) {
    const sheep = { ...state.sheepList[i] };
    sheep.y += sheep.speed * safeDt;

    // Check Junction Crossing
    if (sheep.y >= GATE_JUNCTION_Y && !sheep.isSorted) {
      sheep.isSorted = true;
      const isCorrect = state.gateDir === sheep.targetGate;

      if (isCorrect) {
        nextCombo++;
        nextMaxCombo = Math.max(nextMaxCombo, nextCombo);
        nextTotalSorted++;

        const comboMultiplier = 1 + Math.floor(nextCombo / 5);
        const feverMultiplier = nextFeverActive ? 2 : 1;
        const earned = sheep.points * comboMultiplier * feverMultiplier;
        nextScore += earned;

        events.push({
          type: 'sheep_sorted',
          sheep,
          isCorrect: true,
          points: earned,
          combo: nextCombo,
        });

        // Trigger Fever every 15 combo
        if (nextCombo > 0 && nextCombo % 15 === 0 && !nextFeverActive) {
          nextFeverActive = true;
          nextFeverTimer = 5.0;
          events.push({ type: 'fever_activated' });
        }
      } else {
        // Wrong gate!
        nextCombo = 0;
        nextLives = Math.max(0, nextLives - 1);

        events.push({
          type: 'sheep_sorted',
          sheep,
          isCorrect: false,
          points: 0,
          combo: 0,
        });

        events.push({
          type: 'life_lost',
          remainingLives: nextLives,
        });
      }

      // Continue to let it run off screen into corral
      nextSheepList.push(sheep);
    } else if (sheep.y < 560) {
      nextSheepList.push(sheep);
    }
  }

  // 5. Dynamic Difficulty Scaling
  const progression = Math.min(1, nextTotalSorted / 50);
  const nextInterval = Math.max(0.68, 1.35 - progression * 0.65);
  const nextSpeed = Math.min(240, 130 + progression * 110);

  const nextHighScore = Math.max(state.highScore, nextScore);
  const nextStatus = nextLives <= 0 ? 'game_over' : 'playing';

  return {
    state: {
      ...state,
      status: nextStatus,
      gateAngle: nextAngle,
      score: nextScore,
      highScore: nextHighScore,
      combo: nextCombo,
      maxCombo: nextMaxCombo,
      lives: nextLives,
      sheepList: nextSheepList,
      spawnTimer: nextSpawnTimer,
      spawnInterval: nextInterval,
      difficultySpeed: nextSpeed,
      totalSorted: nextTotalSorted,
      feverActive: nextFeverActive,
      feverTimer: nextFeverTimer,
    },
    events,
  };
}

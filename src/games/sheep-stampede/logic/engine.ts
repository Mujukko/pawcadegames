export interface SheepPosition {
  id: number;
  x: number; // local offset from flock center [-40..40]
  y: number; // local offset from flock center [-30..30]
  color?: string;
}

export type GateOp = 'add' | 'multiply' | 'subtract' | 'divide';

export interface Gate {
  id: string;
  distY: number; // Distance down the track (0 to trackLength)
  lane: 'left' | 'right';
  x: number; // Center X of gate
  width: number;
  op: GateOp;
  value: number;
  label: string;
  isPositive: boolean;
  collected?: boolean;
}

export interface Obstacle {
  id: string;
  distY: number;
  x: number;
  width: number;
  height: number;
  type: 'mud' | 'shearer' | 'hay';
  sheepLoss: number; // Sheep lost on hit
  hit?: boolean;
}

export interface SheepStampedeLevelConfig {
  level: number;
  title: string;
  trackLength: number; // Total track length in px (e.g. 2400)
  forwardSpeed: number; // px per second
  initialSheep: number;
  targetSheepGoal: number;
  gates: Gate[];
  obstacles: Obstacle[];
}

export interface SheepStampedeState {
  level: number;
  trackLength: number;
  trackProgress: number; // Current distance traveled (0 to trackLength)
  flockX: number; // Flock lateral position [-120..120], 0 is center
  flockCount: number;
  sheepList: SheepPosition[];
  score: number;
  status: 'ready' | 'running' | 'won' | 'lost';
  forwardSpeed: number;
  gates: Gate[];
  obstacles: Obstacle[];
  targetGoal: number;
  comboStreak: number;
}

export const TRACK_WIDTH = 360; // Internal lane width (-180 to +180)
export const MAX_FLOCK_VISUAL = 60; // Max visual sheep rendered for performance

export const SHEEP_STAMPEDE_LEVELS: SheepStampedeLevelConfig[] = [
  {
    level: 1,
    title: 'Sunny Pasture: Math Meadow',
    trackLength: 2000,
    forwardSpeed: 195,
    initialSheep: 10,
    targetSheepGoal: 30,
    gates: [
      { id: 'g1a', distY: 450, lane: 'left', x: -75, width: 120, op: 'add', value: 10, label: '+10', isPositive: true },
      { id: 'g1b', distY: 450, lane: 'right', x: 75, width: 120, op: 'add', value: 5, label: '+5', isPositive: true },

      { id: 'g2a', distY: 950, lane: 'left', x: -75, width: 120, op: 'multiply', value: 2, label: 'x2', isPositive: true },
      { id: 'g2b', distY: 950, lane: 'right', x: 75, width: 120, op: 'subtract', value: 5, label: '-5', isPositive: false },

      { id: 'g3a', distY: 1450, lane: 'left', x: -75, width: 120, op: 'add', value: 15, label: '+15', isPositive: true },
      { id: 'g3b', distY: 1450, lane: 'right', x: 75, width: 120, op: 'multiply', value: 2, label: 'x2', isPositive: true },
    ],
    obstacles: [
      { id: 'obs1', distY: 700, x: 0, width: 70, height: 42, type: 'mud', sheepLoss: 4 },
      { id: 'obs2', distY: 1200, x: -75, width: 60, height: 42, type: 'hay', sheepLoss: 5 },
    ],
  },
  {
    level: 2,
    title: 'Clover Trail: Gate Multiplier',
    trackLength: 2600,
    forwardSpeed: 215,
    initialSheep: 12,
    targetSheepGoal: 50,
    gates: [
      { id: 'l2_g1a', distY: 500, lane: 'left', x: -75, width: 120, op: 'multiply', value: 2, label: 'x2', isPositive: true },
      { id: 'l2_g1b', distY: 500, lane: 'right', x: 75, width: 120, op: 'add', value: 15, label: '+15', isPositive: true },

      { id: 'l2_g2a', distY: 1000, lane: 'left', x: -75, width: 120, op: 'subtract', value: 8, label: '-8', isPositive: false },
      { id: 'l2_g2b', distY: 1000, lane: 'right', x: 75, width: 120, op: 'multiply', value: 3, label: 'x3', isPositive: true },

      { id: 'l2_g3a', distY: 1600, lane: 'left', x: -75, width: 120, op: 'add', value: 25, label: '+25', isPositive: true },
      { id: 'l2_g3b', distY: 1600, lane: 'right', x: 75, width: 120, op: 'divide', value: 2, label: '÷2', isPositive: false },

      { id: 'l2_g4a', distY: 2100, lane: 'left', x: -75, width: 120, op: 'multiply', value: 2, label: 'x2', isPositive: true },
      { id: 'l2_g4b', distY: 2100, lane: 'right', x: 75, width: 120, op: 'add', value: 20, label: '+20', isPositive: true },
    ],
    obstacles: [
      { id: 'l2_obs1', distY: 750, x: -60, width: 65, height: 45, type: 'shearer', sheepLoss: 6 },
      { id: 'l2_obs2', distY: 1300, x: 60, width: 70, height: 42, type: 'mud', sheepLoss: 8 },
      { id: 'l2_obs3', distY: 1850, x: 0, width: 80, height: 42, type: 'hay', sheepLoss: 10 },
    ],
  },
  {
    level: 3,
    title: 'Barnyard Blitz: Herd Rush',
    trackLength: 3000,
    forwardSpeed: 235,
    initialSheep: 15,
    targetSheepGoal: 80,
    gates: [
      { id: 'l3_g1a', distY: 450, lane: 'left', x: -75, width: 120, op: 'multiply', value: 3, label: 'x3', isPositive: true },
      { id: 'l3_g1b', distY: 450, lane: 'right', x: 75, width: 120, op: 'add', value: 10, label: '+10', isPositive: true },

      { id: 'l3_g2a', distY: 950, lane: 'left', x: -75, width: 120, op: 'divide', value: 2, label: '÷2', isPositive: false },
      { id: 'l3_g2b', distY: 950, lane: 'right', x: 75, width: 120, op: 'multiply', value: 2, label: 'x2', isPositive: true },

      { id: 'l3_g3a', distY: 1500, lane: 'left', x: -75, width: 120, op: 'add', value: 30, label: '+30', isPositive: true },
      { id: 'l3_g3b', distY: 1500, lane: 'right', x: 75, width: 120, op: 'subtract', value: 12, label: '-12', isPositive: false },

      { id: 'l3_g4a', distY: 2050, lane: 'left', x: -75, width: 120, op: 'multiply', value: 2, label: 'x2', isPositive: true },
      { id: 'l3_g4b', distY: 2050, lane: 'right', x: 75, width: 120, op: 'multiply', value: 3, label: 'x3', isPositive: true },

      { id: 'l3_g5a', distY: 2550, lane: 'left', x: -75, width: 120, op: 'add', value: 40, label: '+40', isPositive: true },
      { id: 'l3_g5b', distY: 2550, lane: 'right', x: 75, width: 120, op: 'divide', value: 2, label: '÷2', isPositive: false },
    ],
    obstacles: [
      { id: 'l3_obs1', distY: 700, x: 0, width: 85, height: 42, type: 'mud', sheepLoss: 10 },
      { id: 'l3_obs2', distY: 1200, x: -65, width: 60, height: 45, type: 'shearer', sheepLoss: 12 },
      { id: 'l3_obs3', distY: 1800, x: 65, width: 65, height: 45, type: 'shearer', sheepLoss: 12 },
      { id: 'l3_obs4', distY: 2300, x: 0, width: 80, height: 42, type: 'hay', sheepLoss: 15 },
    ],
  },
];

export function generateSheepPositions(count: number): SheepPosition[] {
  const displayCount = Math.min(count, MAX_FLOCK_VISUAL);
  const sheep: SheepPosition[] = [];
  const radius = Math.min(60, 16 + Math.sqrt(count) * 4);

  for (let i = 0; i < displayCount; i++) {
    // Golden spiral distribution for natural flocking circle
    const phi = i * 2.39996; // Golden angle in radians
    const r = Math.sqrt((i + 1) / displayCount) * radius;
    const x = Math.cos(phi) * r;
    const y = Math.sin(phi) * r * 0.7; // slightly squished oval

    sheep.push({
      id: i,
      x: Math.round(x),
      y: Math.round(y),
    });
  }
  return sheep;
}

export function initializeSheepStampedeLevel(levelNumber: number = 1): SheepStampedeState {
  const cfg =
    SHEEP_STAMPEDE_LEVELS.find((l) => l.level === levelNumber) ||
    SHEEP_STAMPEDE_LEVELS[0]!;

  return {
    level: cfg.level,
    trackLength: cfg.trackLength,
    trackProgress: 0,
    flockX: 0,
    flockCount: cfg.initialSheep,
    sheepList: generateSheepPositions(cfg.initialSheep),
    score: 0,
    status: 'ready',
    forwardSpeed: cfg.forwardSpeed,
    gates: cfg.gates.map((g) => ({ ...g, collected: false })),
    obstacles: cfg.obstacles.map((o) => ({ ...o, hit: false })),
    targetGoal: cfg.targetSheepGoal,
    comboStreak: 0,
  };
}

export function steerFlock(state: SheepStampedeState, targetX: number): SheepStampedeState {
  // Clamp targetX within playable pasture boundaries [-140, 140]
  const clampedX = Math.max(-140, Math.min(140, targetX));
  return {
    ...state,
    flockX: clampedX,
  };
}

export interface StepResult {
  nextState: SheepStampedeState;
  events: {
    gateHit?: Gate;
    obstacleHit?: Obstacle;
    victory?: boolean;
    loss?: boolean;
  };
}

export function applyGateOperation(currentCount: number, gate: Gate): number {
  switch (gate.op) {
    case 'add':
      return currentCount + gate.value;
    case 'multiply':
      return currentCount * gate.value;
    case 'subtract':
      return Math.max(0, currentCount - gate.value);
    case 'divide':
      return Math.max(1, Math.floor(currentCount / gate.value));
    default:
      return currentCount;
  }
}

export function stepStampedeEngine(state: SheepStampedeState, dtSeconds: number): StepResult {
  if (state.status !== 'running') {
    return { nextState: state, events: {} };
  }

  const newProgress = state.trackProgress + state.forwardSpeed * dtSeconds;
  let newFlockCount = state.flockCount;
  let newScore = state.score + Math.round(state.flockCount * dtSeconds * 5);
  let newCombo = state.comboStreak;
  let hitGate: Gate | undefined;
  let hitObstacle: Obstacle | undefined;

  // 1. Check Gates
  const updatedGates = state.gates.map((g) => {
    if (g.collected) return g;
    // Check if progress passed gate Y (with 25px trigger window)
    if (newProgress >= g.distY - 15 && state.trackProgress < g.distY + 15) {
      // Check lateral overlap with flockX
      const halfGate = g.width / 2;
      const flockRadius = 25;
      const overlaps =
        state.flockX + flockRadius >= g.x - halfGate &&
        state.flockX - flockRadius <= g.x + halfGate;

      if (overlaps) {
        hitGate = g;
        newFlockCount = applyGateOperation(newFlockCount, g);
        if (g.isPositive) {
          newCombo += 1;
          newScore += 150 * newCombo;
        } else {
          newCombo = 0;
        }
        return { ...g, collected: true };
      }
    }
    return g;
  });

  // 2. Check Obstacles
  const updatedObstacles = state.obstacles.map((obs) => {
    if (obs.hit) return obs;
    if (newProgress >= obs.distY - 15 && state.trackProgress < obs.distY + 15) {
      const halfW = obs.width / 2;
      const overlaps =
        state.flockX + 20 >= obs.x - halfW &&
        state.flockX - 20 <= obs.x + halfW;

      if (overlaps) {
        hitObstacle = obs;
        newFlockCount = Math.max(0, newFlockCount - obs.sheepLoss);
        newCombo = 0;
        return { ...obs, hit: true };
      }
    }
    return obs;
  });

  // 3. Check Loss Condition (0 sheep left)
  if (newFlockCount <= 0) {
    return {
      nextState: {
        ...state,
        trackProgress: newProgress,
        flockCount: 0,
        sheepList: [],
        status: 'lost',
        gates: updatedGates,
        obstacles: updatedObstacles,
        score: newScore,
        comboStreak: 0,
      },
      events: {
        gateHit: hitGate,
        obstacleHit: hitObstacle,
        loss: true,
      },
    };
  }

  // 4. Check Finish Line / Victory
  if (newProgress >= state.trackLength) {
    const finalBonus = newFlockCount * 50;
    return {
      nextState: {
        ...state,
        trackProgress: state.trackLength,
        flockCount: newFlockCount,
        sheepList: generateSheepPositions(newFlockCount),
        status: 'won',
        score: newScore + finalBonus,
        gates: updatedGates,
        obstacles: updatedObstacles,
      },
      events: {
        gateHit: hitGate,
        obstacleHit: hitObstacle,
        victory: true,
      },
    };
  }

  // 5. Normal Running Step
  const nextSheepList =
    newFlockCount !== state.flockCount
      ? generateSheepPositions(newFlockCount)
      : state.sheepList;

  return {
    nextState: {
      ...state,
      trackProgress: newProgress,
      flockCount: newFlockCount,
      sheepList: nextSheepList,
      gates: updatedGates,
      obstacles: updatedObstacles,
      score: newScore,
      comboStreak: newCombo,
    },
    events: {
      gateHit: hitGate,
      obstacleHit: hitObstacle,
    },
  };
}

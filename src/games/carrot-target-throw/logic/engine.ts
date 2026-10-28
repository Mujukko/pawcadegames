import {
  CarrotTargetState,
  CarrotEvent,
  StageConfig,
  SpeedPattern,
  TargetStump,
  EmbeddedPeg,
  BonusFruit,
  FlyingCarrot,
  DeflectedCarrot,
  WoodParticle,
} from './types';

export const STAGE_CONFIGS: StageConfig[] = [
  {
    stage: 1,
    title: 'Oak Tree Stump',
    subtitle: 'Steady rhythm • 6 Carrots',
    targetCarrots: 6,
    baseSpeed: 1.75,
    speedPattern: 'constant',
    initialObstacles: [0], // 1 pre-stuck wood obstacle
    initialFruits: [
      { angle: Math.PI, type: 'apple', points: 250 },
    ],
  },
  {
    stage: 2,
    title: 'Waterwheel Timber',
    subtitle: 'Surging flow • 7 Carrots',
    targetCarrots: 7,
    baseSpeed: 2.1,
    speedPattern: 'oscillating',
    initialObstacles: [0.35, 3.4],
    initialFruits: [
      { angle: 1.8, type: 'apple', points: 250 },
      { angle: 4.9, type: 'apple', points: 250 },
    ],
  },
  {
    stage: 3,
    title: 'Windmill Rotor',
    subtitle: 'Shifting winds • 8 Carrots',
    targetCarrots: 8,
    baseSpeed: 2.4,
    speedPattern: 'reversing',
    initialObstacles: [0.6, 2.5],
    initialFruits: [
      { angle: 4.2, type: 'golden_acorn', points: 500 },
    ],
  },
  {
    stage: 4,
    title: 'Grand Barn Melon',
    subtitle: 'Sudden bursts • 9 Carrots',
    targetCarrots: 9,
    baseSpeed: 2.7,
    speedPattern: 'stutter',
    initialObstacles: [0.2, 2.1, 4.3],
    initialFruits: [
      { angle: 1.2, type: 'golden_acorn', points: 500 },
      { angle: 3.2, type: 'apple', points: 250 },
    ],
  },
];

export const MIN_CLASH_ANGLE_DIFF = 0.22; // ~12.6 degrees
export const FRUIT_SLICE_ANGLE_DIFF = 0.28; // ~16 degrees
export const CARROT_FLIGHT_SPEED = -1250; // px/sec upwards
export const STUMP_CENTER_X = 210;
export const STUMP_CENTER_Y = 175;
export const STUMP_RADIUS = 72;
export const CARROT_START_Y = 465;
export const CARROT_LENGTH = 54;
export const CARROT_WIDTH = 16;

export function normalizeAngle(angle: number): number {
  const twoPi = Math.PI * 2;
  let normalized = angle % twoPi;
  if (normalized < 0) {
    normalized += twoPi;
  }
  return normalized;
}

export function angularDifference(a: number, b: number): number {
  const diff = Math.abs(normalizeAngle(a) - normalizeAngle(b));
  return diff > Math.PI ? Math.PI * 2 - diff : diff;
}

export function createStageState(stageNumber: number, currentScore: number = 0, highScore: number = 0): CarrotTargetState {
  const stageIndex = Math.max(0, Math.min(STAGE_CONFIGS.length - 1, stageNumber - 1));
  const config = STAGE_CONFIGS[stageIndex];

  const stump: TargetStump = {
    x: STUMP_CENTER_X,
    y: STUMP_CENTER_Y,
    radius: STUMP_RADIUS,
    rotation: 0,
    rotationSpeed: config.baseSpeed,
    speedPattern: config.speedPattern,
    timer: 0,
  };

  const embeddedPegs: EmbeddedPeg[] = config.initialObstacles.map((angle, idx) => ({
    id: `obstacle-${config.stage}-${idx}`,
    angle: normalizeAngle(angle),
    type: 'wood_obstacle',
  }));

  const bonusFruits: BonusFruit[] = config.initialFruits.map((f, idx) => ({
    id: `fruit-${config.stage}-${idx}`,
    angle: normalizeAngle(f.angle),
    type: f.type,
    points: f.points,
    isSliced: false,
  }));

  return {
    status: 'ready',
    stage: config.stage,
    totalStages: STAGE_CONFIGS.length,
    score: currentScore,
    carrotsRemaining: config.targetCarrots,
    totalCarrotsInStage: config.targetCarrots,
    stump,
    embeddedPegs,
    bonusFruits,
    flyingCarrot: null,
    deflectedCarrot: null,
    particles: [],
    highScore: Math.max(highScore, currentScore),
  };
}

export function createInitialState(savedHighScore: number = 0): CarrotTargetState {
  return createStageState(1, 0, savedHighScore);
}

export function throwCarrot(state: CarrotTargetState): { state: CarrotTargetState; event?: CarrotEvent } {
  if (state.status !== 'ready' && state.status !== 'playing') {
    return { state };
  }

  // If a carrot is already in flight or deflected, cannot throw another
  if (state.flyingCarrot !== null || state.deflectedCarrot !== null) {
    return { state };
  }

  const flyingCarrot: FlyingCarrot = {
    x: STUMP_CENTER_X,
    y: CARROT_START_Y,
    vy: CARROT_FLIGHT_SPEED,
    length: CARROT_LENGTH,
    width: CARROT_WIDTH,
  };

  return {
    state: {
      ...state,
      status: 'playing',
      flyingCarrot,
    },
    event: { type: 'carrot_thrown' },
  };
}

export function updateEngine(
  state: CarrotTargetState,
  dt: number
): { state: CarrotTargetState; events: CarrotEvent[] } {
  const events: CarrotEvent[] = [];
  const safeDt = Math.min(0.1, Math.max(0.001, dt));

  let nextStump = { ...state.stump };
  nextStump.timer += safeDt;

  // Calculate rotation speed based on speedPattern
  const config = STAGE_CONFIGS[state.stage - 1] || STAGE_CONFIGS[0];
  let currentSpeed = config.baseSpeed;

  switch (nextStump.speedPattern) {
    case 'constant':
      currentSpeed = config.baseSpeed;
      break;
    case 'oscillating':
      currentSpeed = config.baseSpeed + config.baseSpeed * 0.7 * Math.sin(nextStump.timer * 2.8);
      break;
    case 'reversing': {
      const cycle = nextStump.timer % 3.6;
      if (cycle < 1.8) {
        currentSpeed = config.baseSpeed;
      } else {
        currentSpeed = -config.baseSpeed;
      }
      break;
    }
    case 'stutter': {
      const cycle = nextStump.timer % 1.8;
      if (cycle < 0.35) {
        currentSpeed = config.baseSpeed * 0.2;
      } else {
        currentSpeed = config.baseSpeed * 1.45;
      }
      break;
    }
  }

  nextStump.rotationSpeed = currentSpeed;
  nextStump.rotation = normalizeAngle(nextStump.rotation + currentSpeed * safeDt);

  // Update particles
  const nextParticles: WoodParticle[] = [];
  for (const p of state.particles) {
    const life = p.life - safeDt;
    if (life > 0) {
      nextParticles.push({
        ...p,
        x: p.x + p.vx * safeDt,
        y: p.y + p.vy * safeDt,
        vy: p.vy + 380 * safeDt, // gravity
        life,
      });
    }
  }

  // Update deflected carrot if exists
  let nextDeflected = state.deflectedCarrot;
  if (nextDeflected) {
    nextDeflected = {
      ...nextDeflected,
      x: nextDeflected.x + nextDeflected.vx * safeDt,
      y: nextDeflected.y + nextDeflected.vy * safeDt,
      vy: nextDeflected.vy + 750 * safeDt, // strong gravity
      rotation: nextDeflected.rotation + nextDeflected.rotationSpeed * safeDt,
    };
  }

  let nextFlyingCarrot = state.flyingCarrot;
  let nextEmbeddedPegs = [...state.embeddedPegs];
  let nextBonusFruits = [...state.bonusFruits];
  let nextScore = state.score;
  let nextCarrotsRemaining = state.carrotsRemaining;
  let nextStatus = state.status;

  if (nextFlyingCarrot) {
    const newY = nextFlyingCarrot.y + nextFlyingCarrot.vy * safeDt;
    const carrotTipY = newY - nextFlyingCarrot.length / 2;
    const impactBoundaryY = nextStump.y + nextStump.radius;

    if (carrotTipY <= impactBoundaryY) {
      // Impact occurred!
      // In world space, impact is at (STUMP_CENTER_X, impactBoundaryY)
      // Angle from stump center to bottom impact point is Math.PI / 2 (90 degrees, down)
      // In stump relative space: relAngle = (Math.PI / 2 - nextStump.rotation)
      const relAngle = normalizeAngle(Math.PI / 2 - nextStump.rotation);

      // Check collision with existing pegs
      let hasClash = false;
      for (const peg of nextEmbeddedPegs) {
        if (angularDifference(relAngle, peg.angle) < MIN_CLASH_ANGLE_DIFF) {
          hasClash = true;
          break;
        }
      }

      if (hasClash) {
        // DEFLECT & GAME OVER
        nextFlyingCarrot = null;
        nextDeflected = {
          x: STUMP_CENTER_X,
          y: impactBoundaryY,
          vx: (Math.random() - 0.5) * 280,
          vy: 260,
          rotation: 0,
          rotationSpeed: (Math.random() > 0.5 ? 1 : -1) * 9.5,
        };
        nextStatus = 'game_over';

        // Spawn clash spark particles
        for (let i = 0; i < 14; i++) {
          const ang = Math.random() * Math.PI * 2;
          const spd = 60 + Math.random() * 160;
          nextParticles.push({
            x: STUMP_CENTER_X,
            y: impactBoundaryY,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            life: 0.5,
            maxLife: 0.5,
            color: '#ef4444',
            size: 3 + Math.random() * 3,
          });
        }

        events.push({ type: 'carrot_clash', x: STUMP_CENTER_X, y: impactBoundaryY });
        events.push({ type: 'game_over', finalScore: nextScore });
      } else {
        // SUCCESSFUL STICK!
        nextFlyingCarrot = null;
        nextEmbeddedPegs.push({
          id: `carrot-${Date.now()}-${nextEmbeddedPegs.length}`,
          angle: relAngle,
          type: 'carrot',
        });

        nextCarrotsRemaining = Math.max(0, nextCarrotsRemaining - 1);
        const stickPoints = 100;
        nextScore += stickPoints;
        events.push({ type: 'carrot_stuck', points: stickPoints, angle: relAngle });

        // Spawn wood chips
        for (let i = 0; i < 8; i++) {
          const ang = Math.PI * 0.25 + Math.random() * Math.PI * 0.5;
          const spd = 40 + Math.random() * 90;
          nextParticles.push({
            x: STUMP_CENTER_X,
            y: impactBoundaryY,
            vx: (Math.random() - 0.5) * spd,
            vy: spd * 0.5,
            life: 0.4,
            maxLife: 0.4,
            color: '#f97316',
            size: 2.5 + Math.random() * 2,
          });
        }

        // Check fruit slicing
        nextBonusFruits = nextBonusFruits.map((fruit) => {
          if (!fruit.isSliced && angularDifference(relAngle, fruit.angle) < FRUIT_SLICE_ANGLE_DIFF) {
            nextScore += fruit.points;
            events.push({
              type: 'fruit_sliced',
              fruitType: fruit.type,
              points: fruit.points,
              x: STUMP_CENTER_X,
              y: impactBoundaryY,
            });

            // Fruit slice juice particles
            const juiceColor = fruit.type === 'apple' ? '#ef4444' : '#eab308';
            for (let j = 0; j < 12; j++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 80 + Math.random() * 140;
              nextParticles.push({
                x: STUMP_CENTER_X,
                y: impactBoundaryY,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 0.55,
                maxLife: 0.55,
                color: juiceColor,
                size: 3 + Math.random() * 3,
              });
            }

            return { ...fruit, isSliced: true };
          }
          return fruit;
        });

        // Check stage progression
        if (nextCarrotsRemaining === 0) {
          if (state.stage >= state.totalStages) {
            nextStatus = 'victory';
            events.push({ type: 'victory', finalScore: nextScore });
          } else {
            nextStatus = 'stage_cleared';
            events.push({ type: 'stage_clear', stage: state.stage });
          }
        }
      }
    } else {
      nextFlyingCarrot = {
        ...nextFlyingCarrot,
        y: newY,
      };
    }
  }

  const newHighScore = Math.max(state.highScore, nextScore);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      carrotsRemaining: nextCarrotsRemaining,
      stump: nextStump,
      embeddedPegs: nextEmbeddedPegs,
      bonusFruits: nextBonusFruits,
      flyingCarrot: nextFlyingCarrot,
      deflectedCarrot: nextDeflected,
      particles: nextParticles,
      highScore: newHighScore,
    },
    events,
  };
}

export function nextStage(state: CarrotTargetState): CarrotTargetState {
  if (state.stage >= state.totalStages) {
    return state;
  }
  return createStageState(state.stage + 1, state.score, state.highScore);
}

export function resetStage(state: CarrotTargetState): CarrotTargetState {
  return createStageState(state.stage, state.score, state.highScore);
}

export function restartGame(state: CarrotTargetState): CarrotTargetState {
  return createStageState(1, 0, state.highScore);
}

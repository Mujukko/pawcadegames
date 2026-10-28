import {
  FruitType,
  FruitConfig,
  FlyingFruit,
  JuiceParticle,
  FloatingText,
  FruitSlicerState,
  SliceEvent,
} from './types';

export const FRUIT_CONFIGS: Record<FruitType, FruitConfig> = {
  apple: {
    type: 'apple',
    label: 'Barnyard Apple',
    emoji: '🍎',
    radius: 26,
    points: 10,
    isBomb: false,
    color: '#ef4444',
    juiceColor: '#dc2626',
  },
  watermelon: {
    type: 'watermelon',
    label: 'Sweet Watermelon',
    emoji: '🍉',
    radius: 34,
    points: 15,
    isBomb: false,
    color: '#10b981',
    juiceColor: '#f43f5e',
  },
  strawberry: {
    type: 'strawberry',
    label: 'Wild Strawberry',
    emoji: '🍓',
    radius: 22,
    points: 12,
    isBomb: false,
    color: '#fb7185',
    juiceColor: '#f43f5e',
  },
  corn: {
    type: 'corn',
    label: 'Golden Sweetcorn',
    emoji: '🌽',
    radius: 28,
    points: 10,
    isBomb: false,
    color: '#eab308',
    juiceColor: '#fde047',
  },
  eggplant: {
    type: 'eggplant',
    label: 'Garden Eggplant',
    emoji: '🍆',
    radius: 27,
    points: 12,
    isBomb: false,
    color: '#a855f7',
    juiceColor: '#7e22ce',
  },
  golden_pineapple: {
    type: 'golden_pineapple',
    label: 'Golden Pineapple',
    emoji: '🍍',
    radius: 32,
    points: 50,
    isBomb: false,
    color: '#f59e0b',
    juiceColor: '#fbbf24',
  },
  thistle_bomb: {
    type: 'thistle_bomb',
    label: 'Rotten Thistle Bomb',
    emoji: '💣',
    radius: 28,
    points: 0,
    isBomb: true,
    color: '#475569',
    juiceColor: '#334155',
  },
};

export const STAGE_CONFIGS = [
  { stage: 1, name: 'Orchard Sunrise', target: 20, bombChance: 0.05, spawnInterval: 1.8, maxSimultaneous: 2 },
  { stage: 2, name: 'Berry Harvest', target: 35, bombChance: 0.12, spawnInterval: 1.5, maxSimultaneous: 3 },
  { stage: 3, name: 'Pumpkin Festival', target: 50, bombChance: 0.18, spawnInterval: 1.2, maxSimultaneous: 4 },
  { stage: 4, name: 'Mega Juice Frenzy', target: 70, bombChance: 0.22, spawnInterval: 1.0, maxSimultaneous: 5 },
];

export const GRAVITY = 850; // px/s^2

export function initFruitSlicer(stage = 1, width = 480, height = 640): FruitSlicerState {
  const currentStage = Math.max(1, Math.min(STAGE_CONFIGS.length, stage));
  const cfg = STAGE_CONFIGS[currentStage - 1]!;

  return {
    status: 'playing',
    stage: currentStage,
    score: 0,
    highScore: 0,
    lives: 3,
    maxLives: 3,
    fruits: [],
    particles: [],
    floatingTexts: [],
    sliceTrail: [],
    comboCount: 0,
    lastSliceTime: 0,
    spawnTimer: 0.5,
    stageTarget: cfg.target,
    fruitsSlicedInStage: 0,
    width,
    height,
  };
}

export function distanceToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const dpx = px - x1;
    const dpy = py - y1;
    return Math.sqrt(dpx * dpx + dpy * dpy);
  }

  // Projection parameter t clamped to [0, 1]
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;

  const distSq = (px - projX) * (px - projX) + (py - projY) * (py - projY);
  return Math.sqrt(distSq);
}

export function spawnFruitWave(state: FruitSlicerState): { state: FruitSlicerState; newFruits: FlyingFruit[] } {
  const cfg = STAGE_CONFIGS[state.stage - 1]!;
  const newFruits: FlyingFruit[] = [];

  // Determine wave count (1 to maxSimultaneous)
  const count = Math.min(
    cfg.maxSimultaneous,
    Math.floor(Math.random() * (cfg.maxSimultaneous - 1)) + 2
  );

  const fruitTypes: FruitType[] = ['apple', 'watermelon', 'strawberry', 'corn', 'eggplant'];

  for (let i = 0; i < count; i++) {
    const isBomb = Math.random() < cfg.bombChance;
    const isRare = !isBomb && Math.random() < 0.12;

    const chosenType: FruitType = isBomb
      ? 'thistle_bomb'
      : isRare
      ? 'golden_pineapple'
      : fruitTypes[Math.floor(Math.random() * fruitTypes.length)]!;

    const config = FRUIT_CONFIGS[chosenType];

    // Launch coordinates
    const margin = 60;
    const startX = margin + Math.random() * (state.width - margin * 2);
    const startY = state.height + 30;

    // Aim toward center quadrant
    const targetX = state.width * 0.2 + Math.random() * (state.width * 0.6);
    const vx = (targetX - startX) * (0.8 + Math.random() * 0.6);

    // Initial upward velocity to reach comfortable upper screen height
    const vy = -(620 + Math.random() * 220);

    const fruit: FlyingFruit = {
      id: `fruit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: chosenType,
      x: startX,
      y: startY,
      vx,
      vy,
      radius: config.radius,
      points: config.points,
      isBomb: config.isBomb,
      color: config.color,
      juiceColor: config.juiceColor,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 6,
      isSliced: false,
    };

    newFruits.push(fruit);
  }

  return {
    state: {
      ...state,
      fruits: [...state.fruits, ...newFruits],
      spawnTimer: cfg.spawnInterval * (0.85 + Math.random() * 0.3),
    },
    newFruits,
  };
}

export function performSlice(
  state: FruitSlicerState,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  currentTime: number
): { state: FruitSlicerState; events: SliceEvent[] } {
  if (state.status !== 'playing') {
    return { state, events: [] };
  }

  const events: SliceEvent[] = [];
  const updatedFruits = [...state.fruits];
  let slicedInThisStroke = 0;
  let pointsAdded = 0;
  const newParticles: JuiceParticle[] = [];
  const newTexts: FloatingText[] = [];
  let bombHit = false;

  const strokeAngle = Math.atan2(y2 - y1, x2 - x1);

  for (let i = 0; i < updatedFruits.length; i++) {
    const f = updatedFruits[i]!;
    if (f.isSliced) continue;

    // Check hit segment distance
    const dist = distanceToSegment(f.x, f.y, x1, y1, x2, y2);
    if (dist <= f.radius * 1.15) {
      // Sliced!
      f.isSliced = true;
      f.sliceAngle = strokeAngle;

      if (f.isBomb) {
        bombHit = true;
        events.push({
          type: 'bomb',
          fruitType: f.type,
          x: f.x,
          y: f.y,
        });

        // Bomb sparks
        for (let p = 0; p < 24; p++) {
          const pAngle = Math.random() * Math.PI * 2;
          const speed = 120 + Math.random() * 260;
          newParticles.push({
            id: `p_${Date.now()}_${Math.random()}`,
            x: f.x,
            y: f.y,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            radius: 3 + Math.random() * 4,
            color: Math.random() > 0.5 ? '#f97316' : '#ef4444',
            alpha: 1,
            life: 0,
            maxLife: 0.5 + Math.random() * 0.4,
          });
        }
      } else {
        slicedInThisStroke++;

        // Split into 2 halves
        const perpAngle = strokeAngle + Math.PI / 2;
        const pushSpeed = 100 + Math.random() * 80;

        f.half1 = {
          x: f.x - Math.cos(perpAngle) * 8,
          y: f.y - Math.sin(perpAngle) * 8,
          vx: f.vx - Math.cos(perpAngle) * pushSpeed,
          vy: f.vy - Math.sin(perpAngle) * pushSpeed - 50,
          rotation: f.rotation - 0.2,
        };

        f.half2 = {
          x: f.x + Math.cos(perpAngle) * 8,
          y: f.y + Math.sin(perpAngle) * 8,
          vx: f.vx + Math.cos(perpAngle) * pushSpeed,
          vy: f.vy + Math.sin(perpAngle) * pushSpeed - 50,
          rotation: f.rotation + 0.2,
        };

        // Juice splash particles
        for (let p = 0; p < 16; p++) {
          const pAngle = strokeAngle + (Math.random() - 0.5) * Math.PI * 1.5;
          const speed = 80 + Math.random() * 200;
          newParticles.push({
            id: `p_${Date.now()}_${Math.random()}`,
            x: f.x,
            y: f.y,
            vx: Math.cos(pAngle) * speed,
            vy: Math.sin(pAngle) * speed,
            radius: 3 + Math.random() * 5,
            color: f.juiceColor,
            alpha: 1,
            life: 0,
            maxLife: 0.4 + Math.random() * 0.35,
          });
        }

        pointsAdded += f.points;

        events.push({
          type: 'slice',
          fruitType: f.type,
          pointsEarned: f.points,
          x: f.x,
          y: f.y,
        });
      }
    }
  }

  // Handle combo logic
  let newCombo = state.comboCount;
  if (currentTime - state.lastSliceTime < 0.35) {
    newCombo += slicedInThisStroke;
  } else {
    newCombo = slicedInThisStroke;
  }

  let finalPoints = pointsAdded;
  if (newCombo >= 3) {
    const comboBonus = newCombo * 10;
    finalPoints += comboBonus;

    events.push({
      type: 'combo',
      comboCount: newCombo,
      pointsEarned: comboBonus,
      x: x2,
      y: y2,
    });

    newTexts.push({
      id: `txt_${Date.now()}_combo`,
      x: x2,
      y: y2 - 20,
      text: `COMBO x${newCombo}! +${comboBonus}`,
      color: '#facc15',
      alpha: 1,
      vy: -60,
    });
  } else if (pointsAdded > 0) {
    newTexts.push({
      id: `txt_${Date.now()}_pts`,
      x: x2,
      y: y2 - 15,
      text: `+${pointsAdded}`,
      color: '#ffffff',
      alpha: 1,
      vy: -50,
    });
  }

  let newLives = state.lives;
  let newStatus: FruitSlicerState['status'] = state.status;

  if (bombHit) {
    newLives = Math.max(0, state.lives - 1);
    newTexts.push({
      id: `txt_${Date.now()}_bomb`,
      x: x2,
      y: y2 - 25,
      text: `BOOM! -1 ❤️`,
      color: '#ef4444',
      alpha: 1,
      vy: -70,
    });

    if (newLives <= 0) {
      newStatus = 'game_over';
      events.push({ type: 'game_over' });
    }
  }

  const newScore = state.score + finalPoints;
  const newFruitsSliced = state.fruitsSlicedInStage + slicedInThisStroke;

  // Check stage advance
  let newStage = state.stage;
  let newStageTarget = state.stageTarget;
  if (newFruitsSliced >= state.stageTarget && newStatus === 'playing') {
    if (state.stage < STAGE_CONFIGS.length) {
      newStage++;
      const nextCfg = STAGE_CONFIGS[newStage - 1]!;
      newStageTarget = nextCfg.target;
      events.push({ type: 'stage_complete' });
      newTexts.push({
        id: `txt_${Date.now()}_stage`,
        x: state.width / 2,
        y: state.height / 2 - 40,
        text: `STAGE ${newStage}: ${nextCfg.name}! 🎉`,
        color: '#4ade80',
        alpha: 1,
        vy: -40,
      });
    } else {
      newStatus = 'victory';
      events.push({ type: 'stage_complete' });
    }
  }

  return {
    state: {
      ...state,
      score: newScore,
      highScore: Math.max(state.highScore, newScore),
      lives: newLives,
      status: newStatus,
      fruits: updatedFruits,
      particles: [...state.particles, ...newParticles],
      floatingTexts: [...state.floatingTexts, ...newTexts],
      comboCount: newCombo,
      lastSliceTime: currentTime,
      stage: newStage,
      stageTarget: newStageTarget,
      fruitsSlicedInStage: newFruitsSliced,
    },
    events,
  };
}

export function updateFruitSlicer(
  state: FruitSlicerState,
  dt: number,
  currentTime: number
): { state: FruitSlicerState; events: SliceEvent[] } {
  if (state.status !== 'playing') {
    return { state, events: [] };
  }

  const events: SliceEvent[] = [];
  let newLives = state.lives;
  let newStatus: FruitSlicerState['status'] = state.status;

  // 1. Update fruit positions & handle floor fall
  const remainingFruits: FlyingFruit[] = [];

  for (let i = 0; i < state.fruits.length; i++) {
    const f = state.fruits[i]!;

    if (!f.isSliced) {
      const nextX = f.x + f.vx * dt;
      const nextVy = f.vy + GRAVITY * dt;
      const nextY = f.y + nextVy * dt;
      const nextRot = f.rotation + f.rotationSpeed * dt;

      // Check drop off bottom
      if (nextY > state.height + 60 && f.vy > 0) {
        if (!f.isBomb) {
          // Missed fruit penalty!
          newLives--;
          events.push({
            type: 'fruit_dropped',
            fruitType: f.type,
            x: f.x,
            y: state.height - 20,
          });

          if (newLives <= 0) {
            newStatus = 'game_over';
            events.push({ type: 'game_over' });
          }
        }
        continue;
      }

      remainingFruits.push({
        ...f,
        x: nextX,
        y: nextY,
        vy: nextVy,
        rotation: nextRot,
      });
    } else {
      // Update halves
      if (f.half1 && f.half2) {
        const h1Vy = f.half1.vy + GRAVITY * dt;
        const h1 = {
          ...f.half1,
          x: f.half1.x + f.half1.vx * dt,
          y: f.half1.y + h1Vy * dt,
          vy: h1Vy,
          rotation: f.half1.rotation - 4 * dt,
        };

        const h2Vy = f.half2.vy + GRAVITY * dt;
        const h2 = {
          ...f.half2,
          x: f.half2.x + f.half2.vx * dt,
          y: f.half2.y + h2Vy * dt,
          vy: h2Vy,
          rotation: f.half2.rotation + 4 * dt,
        };

        // If either half is still on screen, retain
        if (h1.y < state.height + 80 || h2.y < state.height + 80) {
          remainingFruits.push({
            ...f,
            half1: h1,
            half2: h2,
          });
        }
      }
    }
  }

  // 2. Update particles
  const remainingParticles: JuiceParticle[] = [];
  for (let i = 0; i < state.particles.length; i++) {
    const p = state.particles[i]!;
    const nextLife = p.life + dt;
    if (nextLife < p.maxLife) {
      const alpha = 1 - nextLife / p.maxLife;
      remainingParticles.push({
        ...p,
        x: p.x + p.vx * dt,
        y: p.y + p.vy * dt,
        vy: p.vy + GRAVITY * 0.4 * dt,
        life: nextLife,
        alpha,
      });
    }
  }

  // 3. Update floating texts
  const remainingTexts: FloatingText[] = [];
  for (let i = 0; i < state.floatingTexts.length; i++) {
    const t = state.floatingTexts[i]!;
    const nextAlpha = t.alpha - dt * 1.5;
    if (nextAlpha > 0) {
      remainingTexts.push({
        ...t,
        y: t.y + t.vy * dt,
        alpha: nextAlpha,
      });
    }
  }

  // 4. Update slice trail decay (keep points < 0.2s old)
  const remainingTrail = state.sliceTrail.filter(
    (pt) => currentTime - pt.timestamp < 0.2
  );

  // 5. Spawn timer
  let nextSpawnTimer = state.spawnTimer - dt;
  let intermediateState: FruitSlicerState = {
    ...state,
    fruits: remainingFruits,
    particles: remainingParticles,
    floatingTexts: remainingTexts,
    sliceTrail: remainingTrail,
    lives: Math.max(0, newLives),
    status: newStatus,
    spawnTimer: nextSpawnTimer,
  };

  if (nextSpawnTimer <= 0 && newStatus === 'playing') {
    const wave = spawnFruitWave(intermediateState);
    intermediateState = wave.state;
  }

  return {
    state: intermediateState,
    events,
  };
}

export function addSliceTrailPoint(
  state: FruitSlicerState,
  x: number,
  y: number,
  timestamp: number
): FruitSlicerState {
  return {
    ...state,
    sliceTrail: [...state.sliceTrail, { x, y, timestamp }],
  };
}

import {
  KoiBreed,
  KoiFish,
  FoodPellet,
  WaterRipple,
  LotusLilyPad,
  AmbientParticle,
  ZenGardenStage,
  KoiPondState,
} from './types';

export const STAGES: ZenGardenStage[] = [
  {
    id: 1,
    title: 'Bamboo Grove Spring',
    subtitle: 'Gentle morning waters beneath nodding green bamboo stalks.',
    targetZen: 150,
    unlockedBreeds: ['kohaku', 'yamabuki'],
    lilyPadCount: 4,
    ambientType: 'water_sparkle',
    themeColor: '#10b981', // emerald
  },
  {
    id: 2,
    title: 'Cherry Blossom Basin',
    subtitle: 'Crisp spring breeze scattering delicate pink sakura petals.',
    targetZen: 350,
    unlockedBreeds: ['kohaku', 'yamabuki', 'showa'],
    lilyPadCount: 6,
    ambientType: 'sakura_petal',
    themeColor: '#ec4899', // pink
  },
  {
    id: 3,
    title: 'Golden Pavilion Pool',
    subtitle: 'Reflecting ancient gilded eaves in sun-kissed amber depths.',
    targetZen: 700,
    unlockedBreeds: ['kohaku', 'yamabuki', 'showa', 'tancho'],
    lilyPadCount: 8,
    ambientType: 'water_sparkle',
    themeColor: '#f59e0b', // amber
  },
  {
    id: 4,
    title: 'Moonlit Sanctuary',
    subtitle: 'Bioluminescent night waters illuminated by glowing fireflies.',
    targetZen: 1200,
    unlockedBreeds: ['kohaku', 'yamabuki', 'showa', 'tancho', 'butterfly_sakura'],
    lilyPadCount: 10,
    ambientType: 'firefly',
    themeColor: '#8b5cf6', // purple
  },
];

export interface FeedResult {
  fishId: string;
  breed: KoiBreed;
  pointsEarned: number;
  bloomTriggered: boolean;
  leveledUpFish: boolean;
}

export interface PondUpdateResult {
  fedEvents: FeedResult[];
  bloomedPadsCount: number;
  stageJustCompleted: boolean;
  gameJustCompleted: boolean;
}

export function createFish(
  id: string,
  breed: KoiBreed,
  pondWidth: number,
  pondHeight: number,
  tier: number = 1
): KoiFish {
  const angle = Math.random() * Math.PI * 2;
  const baseSpeed = 40 + Math.random() * 25;
  const length = 42 + tier * 12;
  const width = 16 + tier * 5;

  return {
    id,
    breed,
    x: 60 + Math.random() * (pondWidth - 120),
    y: 80 + Math.random() * (pondHeight - 160),
    vx: Math.cos(angle) * baseSpeed,
    vy: Math.sin(angle) * baseSpeed,
    speed: baseSpeed,
    maxSpeed: baseSpeed * 1.6,
    angle,
    targetAngle: angle,
    length,
    width,
    wigglePhase: Math.random() * Math.PI * 2,
    wiggleSpeed: 5 + Math.random() * 2,
    sizeTier: tier,
    zenValue: tier * 10,
    isHungry: true,
    eatCooldown: 0,
  };
}

export function createLilyPads(count: number, width: number, height: number): LotusLilyPad[] {
  const pads: LotusLilyPad[] = [];
  const colors = ['#f472b6', '#fb7185', '#e879f9', '#c084fc', '#fbcfe8'];
  const margin = 70;

  for (let i = 0; i < count; i++) {
    // Generate well-distributed positions across the pond
    const col = i % 3;
    const row = Math.floor(i / 3);
    const cellW = (width - margin * 2) / 3;
    const cellH = (height - margin * 2) / Math.max(1, Math.ceil(count / 3));

    const x = margin + col * cellW + cellW * 0.5 + (Math.random() - 0.5) * (cellW * 0.4);
    const y = margin + row * cellH + cellH * 0.5 + (Math.random() - 0.5) * (cellH * 0.4);

    pads.push({
      id: `pad-${i}-${Date.now()}`,
      x,
      y,
      radius: 28 + (i % 3) * 6,
      rotation: (Math.PI * 2 * i) / count + Math.random() * 0.5,
      bloomProgress: 0,
      isBloomed: false,
      bloomColor: colors[i % colors.length],
      zenAwarded: false,
    });
  }
  return pads;
}

export function createAmbientParticles(
  type: 'water_sparkle' | 'sakura_petal' | 'firefly',
  count: number,
  width: number,
  height: number
): AmbientParticle[] {
  const particles: AmbientParticle[] = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      id: `p-${i}-${Math.random()}`,
      x: Math.random() * width,
      y: Math.random() * height,
      vx: type === 'sakura_petal' ? 15 + Math.random() * 20 : (Math.random() - 0.5) * 16,
      vy: type === 'sakura_petal' ? 20 + Math.random() * 25 : (Math.random() - 0.5) * 16,
      size: type === 'sakura_petal' ? 7 + Math.random() * 4 : 3 + Math.random() * 3,
      alpha: 0.3 + Math.random() * 0.5,
      type,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 2,
    });
  }
  return particles;
}

export function initKoiPond(
  stageId: number = 1,
  pondWidth: number = 480,
  pondHeight: number = 640
): KoiPondState {
  const stageConfig = STAGES.find((s) => s.id === stageId) || STAGES[0];
  const fish: KoiFish[] = [];

  // Generate 4 to 7 fish based on unlocked breeds
  const fishCount = 3 + stageConfig.unlockedBreeds.length;
  for (let i = 0; i < fishCount; i++) {
    const breed = stageConfig.unlockedBreeds[i % stageConfig.unlockedBreeds.length];
    fish.push(createFish(`koi-${i}`, breed, pondWidth, pondHeight, 1 + (i % 2)));
  }

  const lilyPads = createLilyPads(stageConfig.lilyPadCount, pondWidth, pondHeight);
  const particles = createAmbientParticles(stageConfig.ambientType, 24, pondWidth, pondHeight);

  return {
    stage: stageConfig.id,
    stageConfig,
    zenPoints: 0,
    targetZen: stageConfig.targetZen,
    totalFedCount: 0,
    pondWidth,
    pondHeight,
    fish,
    pellets: [],
    ripples: [],
    lilyPads,
    particles,
    isStageCompleted: false,
    gameCompleted: false,
    singingBowlCooldown: 0,
    petalShowerActive: false,
    petalShowerTimer: 0,
    multiplier: 1,
  };
}

export function dropFoodPellet(
  state: KoiPondState,
  x: number,
  y: number,
  isGolden: boolean = false
): KoiPondState {
  const pellet: FoodPellet = {
    id: `pellet-${Date.now()}-${Math.random()}`,
    x: Math.max(20, Math.min(state.pondWidth - 20, x)),
    y: Math.max(30, Math.min(state.pondHeight - 30, y)),
    radius: isGolden ? 6 : 4,
    sinkSpeed: 6,
    life: 0,
    maxLife: 15, // seconds before dissolving into pond nutrients
    isGolden,
    points: isGolden ? 30 : 10,
  };

  // Add water ripple at drop location
  const ripple: WaterRipple = {
    id: `rip-${Date.now()}-${Math.random()}`,
    x: pellet.x,
    y: pellet.y,
    radius: 3,
    maxRadius: isGolden ? 55 : 38,
    speed: 45,
    alpha: 0.8,
    color: isGolden ? 'rgba(251, 191, 36, 0.7)' : 'rgba(255, 255, 255, 0.65)',
  };

  return {
    ...state,
    pellets: [...state.pellets, pellet],
    ripples: [...state.ripples, ripple],
  };
}

export function triggerSingingBowl(state: KoiPondState): {
  state: KoiPondState;
  success: boolean;
} {
  if (state.singingBowlCooldown > 0) {
    return { state, success: false };
  }

  const centerX = state.pondWidth * 0.5;
  const centerY = state.pondHeight * 0.5;

  const bowlRipple: WaterRipple = {
    id: `bowl-rip-${Date.now()}`,
    x: centerX,
    y: centerY,
    radius: 5,
    maxRadius: Math.max(state.pondWidth, state.pondHeight) * 0.7,
    speed: 70,
    alpha: 0.9,
    color: 'rgba(253, 224, 71, 0.85)',
  };

  // Turn all fish towards pond center
  const updatedFish = state.fish.map((f) => {
    const angleToCenter = Math.atan2(centerY - f.y, centerX - f.x);
    return {
      ...f,
      targetAngle: angleToCenter,
      speed: f.maxSpeed * 1.3,
    };
  });

  return {
    state: {
      ...state,
      fish: updatedFish,
      ripples: [...state.ripples, bowlRipple],
      singingBowlCooldown: 20, // 20s cooldown
      zenPoints: state.zenPoints + 25 * state.multiplier,
    },
    success: true,
  };
}

export function activatePetalShower(state: KoiPondState): KoiPondState {
  return {
    ...state,
    petalShowerActive: true,
    petalShowerTimer: 12, // 12 seconds
    multiplier: 2,
  };
}

export function updateKoiPond(state: KoiPondState, dt: number): {
  newState: KoiPondState;
  result: PondUpdateResult;
} {
  const clampedDt = Math.min(0.05, Math.max(0.001, dt));
  const fedEvents: FeedResult[] = [];
  let bloomedPadsCount = 0;

  // 1. Update singing bowl cooldown & booster timers
  let singingBowlCooldown = Math.max(0, state.singingBowlCooldown - clampedDt);
  let petalShowerTimer = Math.max(0, state.petalShowerTimer - clampedDt);
  let petalShowerActive = petalShowerTimer > 0;
  let multiplier = petalShowerActive ? 2 : 1;

  // 2. Update Pellets
  const remainingPellets: FoodPellet[] = [];
  for (const p of state.pellets) {
    p.life += clampedDt;
    if (p.life < p.maxLife) {
      remainingPellets.push(p);
    }
  }

  // 3. Update Fish Movement and Feeding AI
  const margin = 40;
  const updatedFish: KoiFish[] = [];
  let newZen = state.zenPoints;
  let newTotalFed = state.totalFedCount;
  const consumedPelletIds = new Set<string>();

  for (const fish of state.fish) {
    let {
      x,
      y,
      vx,
      vy,
      speed,
      maxSpeed,
      angle,
      targetAngle,
      wigglePhase,
      wiggleSpeed,
      eatCooldown,
      sizeTier,
      length,
      width,
    } = { ...fish };

    eatCooldown = Math.max(0, eatCooldown - clampedDt);

    // Search for closest unconsumed food pellet
    let nearestPellet: FoodPellet | null = null;
    let minPelletDist = 260; // scent detection radius

    for (const p of remainingPellets) {
      if (consumedPelletIds.has(p.id)) continue;
      const dx = p.x - x;
      const dy = p.y - y;
      const dist = Math.hypot(dx, dy);
      if (dist < minPelletDist) {
        minPelletDist = dist;
        nearestPellet = p;
      }
    }

    if (nearestPellet) {
      // Steer eagerly towards pellet
      const targetDx = nearestPellet.x - x;
      const targetDy = nearestPellet.y - y;
      targetAngle = Math.atan2(targetDy, targetDx);
      speed = Math.min(maxSpeed * 1.4, speed + clampedDt * 80);
      wiggleSpeed = 8.5;

      // Check mouth contact distance (mouth is at front of fish: length * 0.45 ahead)
      const mouthX = x + Math.cos(angle) * (length * 0.45);
      const mouthY = y + Math.sin(angle) * (length * 0.45);
      const mouthDist = Math.hypot(nearestPellet.x - mouthX, nearestPellet.y - mouthY);

      if (mouthDist < nearestPellet.radius + 14 && eatCooldown <= 0) {
        // Feed Event!
        consumedPelletIds.add(nearestPellet.id);
        const earned = nearestPellet.points * multiplier;
        newZen += earned;
        newTotalFed += 1;
        eatCooldown = 0.4;

        // Check fish size growth
        let leveledUp = false;
        if (sizeTier < 3 && newTotalFed % 8 === 0) {
          sizeTier += 1;
          length += 10;
          width += 4;
          leveledUp = true;
        }

        fedEvents.push({
          fishId: fish.id,
          breed: fish.breed,
          pointsEarned: earned,
          bloomTriggered: false,
          leveledUpFish: leveledUp,
        });
      }
    } else {
      // Natural serene cruising
      speed = Math.max(35, speed - clampedDt * 30);
      wiggleSpeed = 4.5;

      // Occasional wandering steering
      if (Math.random() < clampedDt * 0.8) {
        targetAngle += (Math.random() - 0.5) * 1.2;
      }
    }

    // Boundary avoidance steering
    if (x < margin) targetAngle = 0;
    else if (x > state.pondWidth - margin) targetAngle = Math.PI;
    if (y < margin) targetAngle = Math.PI * 0.5;
    else if (y > state.pondHeight - margin) targetAngle = -Math.PI * 0.5;

    // Smooth angle interpolation
    let angleDiff = targetAngle - angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
    angle += angleDiff * Math.min(1, clampedDt * 4.5);

    // Compute velocity from angle
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;

    x += vx * clampedDt;
    y += vy * clampedDt;

    // Hard clamp within pond
    x = Math.max(25, Math.min(state.pondWidth - 25, x));
    y = Math.max(35, Math.min(state.pondHeight - 35, y));

    wigglePhase = (wigglePhase + wiggleSpeed * clampedDt) % (Math.PI * 2);

    updatedFish.push({
      ...fish,
      x,
      y,
      vx,
      vy,
      speed,
      angle,
      targetAngle,
      wigglePhase,
      wiggleSpeed,
      eatCooldown,
      sizeTier,
      length,
      width,
    });
  }

  // Remove consumed pellets
  const finalPellets = remainingPellets.filter((p) => !consumedPelletIds.has(p.id));

  // 4. Update Lily Pads & Lotus Blooming
  const updatedLilyPads: LotusLilyPad[] = [];
  let feedToDistribute = fedEvents.length;

  for (const pad of state.lilyPads) {
    let { bloomProgress, isBloomed, zenAwarded } = { ...pad };

    if (!isBloomed && feedToDistribute > 0) {
      bloomProgress = Math.min(1, bloomProgress + 0.35 * feedToDistribute);
      feedToDistribute = 0; // applied to this pad
    }

    if (bloomProgress >= 1 && !isBloomed) {
      isBloomed = true;
      bloomedPadsCount++;
      if (!zenAwarded) {
        zenAwarded = true;
        newZen += 40 * multiplier;
      }
    }

    updatedLilyPads.push({
      ...pad,
      bloomProgress,
      isBloomed,
      zenAwarded,
    });
  }

  // 5. Update Water Ripples
  const updatedRipples: WaterRipple[] = [];
  for (const rip of state.ripples) {
    const nextRadius = rip.radius + rip.speed * clampedDt;
    const progress = nextRadius / rip.maxRadius;
    const nextAlpha = Math.max(0, 1 - progress);

    if (nextRadius < rip.maxRadius && nextAlpha > 0.02) {
      updatedRipples.push({
        ...rip,
        radius: nextRadius,
        alpha: nextAlpha,
      });
    }
  }

  // 6. Update Ambient Particles (falling sakura petals / fireflies)
  const updatedParticles: AmbientParticle[] = [];
  for (const part of state.particles) {
    let px = part.x + part.vx * clampedDt;
    let py = part.y + part.vy * clampedDt;
    let rot = part.rotation + part.rotationSpeed * clampedDt;

    // Wrap around screen
    if (px < -15) px = state.pondWidth + 15;
    if (px > state.pondWidth + 15) px = -15;
    if (py < -15) py = state.pondHeight + 15;
    if (py > state.pondHeight + 15) py = -15;

    updatedParticles.push({
      ...part,
      x: px,
      y: py,
      rotation: rot,
    });
  }

  // 7. Check Stage Completion & Game Victory
  const stageJustCompleted = !state.isStageCompleted && newZen >= state.targetZen;
  const isStageCompleted = state.isStageCompleted || stageJustCompleted;
  const gameJustCompleted = stageJustCompleted && state.stage === STAGES.length;

  const newState: KoiPondState = {
    ...state,
    zenPoints: newZen,
    totalFedCount: newTotalFed,
    fish: updatedFish,
    pellets: finalPellets,
    ripples: updatedRipples,
    lilyPads: updatedLilyPads,
    particles: updatedParticles,
    isStageCompleted,
    gameCompleted: state.gameCompleted || gameJustCompleted,
    singingBowlCooldown,
    petalShowerActive,
    petalShowerTimer,
    multiplier,
  };

  return {
    newState,
    result: {
      fedEvents,
      bloomedPadsCount,
      stageJustCompleted,
      gameJustCompleted,
    },
  };
}

export function advanceToNextStage(state: KoiPondState): KoiPondState {
  if (state.stage >= STAGES.length) {
    return state;
  }
  const nextStageId = state.stage + 1;
  return initKoiPond(nextStageId, state.pondWidth, state.pondHeight);
}

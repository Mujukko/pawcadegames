import {
  DuckArcheryState,
  DuckArcheryEvent,
  ArcheryTarget,
  AppleTarget,
  BellTarget,
  StageConfig,
  TargetRingType,
} from './types';

export const STAGE_CONFIGS: StageConfig[] = [
  {
    stage: 1,
    name: 'Pasture Warmup',
    subtitle: 'Static Target • Calm Wind',
    targetScore: 250,
    arrowsGiven: 6,
    windMin: 0,
    windMax: 0,
    targets: [
      { x: 410, y: 380, movementType: 'static', amplitude: 0, speed: 0 },
    ],
    apples: [
      { x: 300, y: 270 },
    ],
    bells: [],
  },
  {
    stage: 2,
    name: 'Windmill Breeze',
    subtitle: 'Moving Target • Crosswinds',
    targetScore: 450,
    arrowsGiven: 7,
    windMin: -2.5,
    windMax: 2.5,
    targets: [
      { x: 410, y: 360, movementType: 'vertical', amplitude: 85, speed: 1.8 },
    ],
    apples: [
      { x: 320, y: 220 },
    ],
    bells: [
      { x: 260, y: 190 },
    ],
  },
  {
    stage: 3,
    name: 'Orchard Trickshot',
    subtitle: 'Apples & Bells • Oscillating Rings',
    targetScore: 650,
    arrowsGiven: 7,
    windMin: -3.2,
    windMax: 3.2,
    targets: [
      { x: 400, y: 380, movementType: 'vertical', amplitude: 100, speed: 2.2 },
    ],
    apples: [
      { x: 280, y: 250 },
      { x: 330, y: 500 },
    ],
    bells: [
      { x: 240, y: 180 },
    ],
  },
  {
    stage: 4,
    name: 'Grand Championship',
    subtitle: 'Dual Targets • Strong Wind Gusts',
    targetScore: 950,
    arrowsGiven: 8,
    windMin: -4.0,
    windMax: 4.0,
    targets: [
      { x: 370, y: 290, movementType: 'vertical', amplitude: 75, speed: 2.4 },
      { x: 430, y: 460, movementType: 'vertical', amplitude: 70, speed: 1.9 },
    ],
    apples: [
      { x: 290, y: 200 },
      { x: 310, y: 400 },
    ],
    bells: [
      { x: 230, y: 170 },
    ],
  },
];

export const GRAVITY = 640; // px/s^2
export const MAX_PULL = 100; // px
export const MAX_LAUNCH_SPEED = 840; // px/s
export const MIN_LAUNCH_SPEED = 280; // px/s
export const WIND_ACCEL_FACTOR = 18; // px/s^2 per m/s

export function getRingPoints(distFromCenter: number): { ring: TargetRingType; points: number; label: string } | null {
  if (distFromCenter <= 14) return { ring: 'bullseye', points: 100, label: '🎯 BULLSEYE!' };
  if (distFromCenter <= 28) return { ring: 'red', points: 50, label: 'RED RING (+50)' };
  if (distFromCenter <= 42) return { ring: 'blue', points: 25, label: 'BLUE RING (+25)' };
  if (distFromCenter <= 54) return { ring: 'white', points: 10, label: 'WHITE RING (+10)' };
  return null;
}

export function generateWind(min: number, max: number): number {
  if (min === 0 && max === 0) return 0;
  const raw = min + Math.random() * (max - min);
  return Math.round(raw * 10) / 10;
}

export function createStageTargets(config: StageConfig): ArcheryTarget[] {
  return config.targets.map((t, idx) => ({
    id: `target-${config.stage}-${idx}`,
    x: t.x,
    y: t.y,
    baseX: t.x,
    baseY: t.y,
    radius: 54,
    movementType: t.movementType,
    amplitude: t.amplitude,
    speed: t.speed,
    phase: idx * Math.PI,
    stuckArrows: [],
  }));
}

export function createStageApples(config: StageConfig): AppleTarget[] {
  return config.apples.map((a, idx) => ({
    id: `apple-${config.stage}-${idx}`,
    x: a.x,
    y: a.y,
    radius: 14,
    points: 150,
    isHit: false,
  }));
}

export function createStageBells(config: StageConfig): BellTarget[] {
  return config.bells.map((b, idx) => ({
    id: `bell-${config.stage}-${idx}`,
    x: b.x,
    y: b.y,
    radius: 16,
    points: 75,
    isHit: false,
  }));
}

export function createInitialState(stageIndex = 1, currentHighScore = 0): DuckArcheryState {
  const config = STAGE_CONFIGS.find((s) => s.stage === stageIndex) || STAGE_CONFIGS[0]!;
  const wind = generateWind(config.windMin, config.windMax);

  return {
    status: 'aiming',
    stage: config.stage,
    score: 0,
    highScore: currentHighScore,
    arrowsLeft: config.arrowsGiven,
    currentWind: wind,
    bowX: 85,
    bowY: 420,
    isPulling: false,
    pullStartX: 0,
    pullStartY: 0,
    pullCurrentX: 0,
    pullCurrentY: 0,
    pullDistance: 0,
    pullAngle: 0,
    arrow: null,
    targets: createStageTargets(config),
    apples: createStageApples(config),
    bells: createStageBells(config),
    particles: [],
    floatingBadges: [],
    consecutiveBullseyes: 0,
    bullseyeCount: 0,
    timeInState: 0,
    width: 500,
    height: 720,
  };
}

export function calculateTrajectory(
  bowX: number,
  bowY: number,
  vx: number,
  vy: number,
  wind: number,
  steps = 22,
  dt = 0.04
): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [];
  let curX = bowX;
  let curY = bowY;
  let curVx = vx;
  let curVy = vy;
  const windAx = wind * WIND_ACCEL_FACTOR;

  for (let i = 0; i < steps; i++) {
    points.push({ x: curX, y: curY });
    curX += curVx * dt;
    curY += curVy * dt;
    curVy += GRAVITY * dt;
    curVx += windAx * dt;
    if (curY > 720 || curX > 520 || curX < 0) break;
  }
  return points;
}

export function startPull(state: DuckArcheryState, screenX: number, screenY: number): DuckArcheryState {
  if (state.status !== 'aiming' || state.arrowsLeft <= 0 || state.arrow !== null) {
    return state;
  }

  return {
    ...state,
    isPulling: true,
    pullStartX: screenX,
    pullStartY: screenY,
    pullCurrentX: screenX,
    pullCurrentY: screenY,
    pullDistance: 0,
    pullAngle: 0,
  };
}

export function updatePull(state: DuckArcheryState, screenX: number, screenY: number): DuckArcheryState {
  if (!state.isPulling) return state;

  // Vector from current touch to start touch (pulling backward launches forward)
  const dx = state.pullStartX - screenX;
  const dy = state.pullStartY - screenY;
  const rawDist = Math.hypot(dx, dy);
  const pullDist = Math.min(MAX_PULL, rawDist);

  // Angle aimed: forward into the field (typically rightward, between -60 deg and +25 deg)
  let angle = Math.atan2(-dy, dx); // Invert y for standard math coords

  // Clamp angle so arrow can't fire backwards
  const minAngle = -Math.PI / 3; // -60 deg
  const maxAngle = Math.PI / 7; // ~25 deg
  angle = Math.max(minAngle, Math.min(maxAngle, angle));

  return {
    ...state,
    pullCurrentX: screenX,
    pullCurrentY: screenY,
    pullDistance: pullDist,
    pullAngle: angle,
  };
}

export function releasePull(state: DuckArcheryState): { state: DuckArcheryState; event?: DuckArcheryEvent } {
  if (!state.isPulling || state.arrowsLeft <= 0) {
    return { state: { ...state, isPulling: false } };
  }

  // Minimum pull threshold to avoid accidental tap releases
  if (state.pullDistance < 14) {
    return {
      state: {
        ...state,
        isPulling: false,
        pullDistance: 0,
      },
    };
  }

  const speedFraction = state.pullDistance / MAX_PULL;
  const speed = MIN_LAUNCH_SPEED + speedFraction * (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED);

  const vx = Math.cos(state.pullAngle) * speed;
  const vy = -Math.sin(state.pullAngle) * speed; // Negative vy launches upward in screen coords

  const newArrow = {
    id: `arrow-${Date.now()}`,
    x: state.bowX,
    y: state.bowY,
    vx,
    vy,
    angle: Math.atan2(vy, vx),
    isActive: true,
    flightTime: 0,
  };

  const nextArrows = state.arrowsLeft - 1;

  return {
    state: {
      ...state,
      status: 'arrow_flying',
      isPulling: false,
      pullDistance: 0,
      arrowsLeft: nextArrows,
      arrow: newArrow,
      timeInState: 0,
    },
    event: {
      type: 'bow_release',
      x: state.bowX,
      y: state.bowY,
    },
  };
}

export function updateEngine(
  state: DuckArcheryState,
  dt: number
): { state: DuckArcheryState; events: DuckArcheryEvent[] } {
  const events: DuckArcheryEvent[] = [];
  const safeDt = Math.min(0.05, Math.max(0.001, dt));

  let nextScore = state.score;
  let nextHighScore = Math.max(state.highScore, nextScore);
  let nextConsecutiveBullseyes = state.consecutiveBullseyes;
  let nextBullseyeCount = state.bullseyeCount;
  let nextArrowsLeft = state.arrowsLeft;
  let nextStatus = state.status;
  let nextTimeInState = state.timeInState + safeDt;

  // 1. Update moving targets
  const updatedTargets = state.targets.map((tgt) => {
    let nextY = tgt.baseY;
    let nextX = tgt.baseX;
    const newPhase = tgt.phase + tgt.speed * safeDt;

    if (tgt.movementType === 'vertical') {
      nextY = tgt.baseY + Math.sin(newPhase) * tgt.amplitude;
    } else if (tgt.movementType === 'horizontal') {
      nextX = tgt.baseX + Math.sin(newPhase) * tgt.amplitude;
    } else if (tgt.movementType === 'oscillation') {
      nextX = tgt.baseX + Math.cos(newPhase) * (tgt.amplitude * 0.4);
      nextY = tgt.baseY + Math.sin(newPhase) * tgt.amplitude;
    }

    return {
      ...tgt,
      x: nextX,
      y: nextY,
      phase: newPhase,
    };
  });

  // 2. Update active arrow flight & collision detection
  let updatedArrow = state.arrow ? { ...state.arrow } : null;
  const newParticles: DuckArcheryState['particles'] = [];
  const newBadges: DuckArcheryState['floatingBadges'] = [];
  const updatedApples = [...state.apples];
  const updatedBells = [...state.bells];

  if (updatedArrow && updatedArrow.isActive) {
    const windAx = state.currentWind * WIND_ACCEL_FACTOR;
    updatedArrow.x += updatedArrow.vx * safeDt;
    updatedArrow.y += updatedArrow.vy * safeDt;
    updatedArrow.vy += GRAVITY * safeDt;
    updatedArrow.vx += windAx * safeDt;
    updatedArrow.angle = Math.atan2(updatedArrow.vy, updatedArrow.vx);
    updatedArrow.flightTime += safeDt;

    const arrowTipX = updatedArrow.x + Math.cos(updatedArrow.angle) * 22;
    const arrowTipY = updatedArrow.y + Math.sin(updatedArrow.angle) * 22;

    let hasHit = false;

    // Check hit against apples
    for (let i = 0; i < updatedApples.length; i++) {
      const apple = updatedApples[i]!;
      if (!apple.isHit) {
        const d = Math.hypot(arrowTipX - apple.x, arrowTipY - apple.y);
        if (d <= apple.radius + 12) {
          apple.isHit = true;
          hasHit = true;
          const points = apple.points;
          nextScore += points;
          events.push({ type: 'apple_hit', pointsEarned: points, x: apple.x, y: apple.y });

          // Apple juice splatter particles
          for (let p = 0; p < 14; p++) {
            newParticles.push({
              id: `p-${Date.now()}-${p}`,
              x: apple.x,
              y: apple.y,
              vx: (Math.random() - 0.5) * 220,
              vy: (Math.random() - 0.5) * 220,
              radius: 3 + Math.random() * 3,
              color: p % 2 === 0 ? '#ef4444' : '#f87171',
              alpha: 1,
              life: 0,
              maxLife: 0.45 + Math.random() * 0.3,
            });
          }

          newBadges.push({
            id: `b-${Date.now()}`,
            x: apple.x,
            y: apple.y - 15,
            text: `+${points} JUICY APPLE!`,
            color: '#ef4444',
            alpha: 1,
            vy: -45,
          });
          break;
        }
      }
    }

    // Check hit against bells
    if (!hasHit) {
      for (let i = 0; i < updatedBells.length; i++) {
        const bell = updatedBells[i]!;
        if (!bell.isHit) {
          const d = Math.hypot(arrowTipX - bell.x, arrowTipY - bell.y);
          if (d <= bell.radius + 12) {
            bell.isHit = true;
            hasHit = true;
            nextScore += bell.points;
            nextArrowsLeft += 1; // +1 Arrow bonus!
            events.push({ type: 'bell_hit', pointsEarned: bell.points, bonusArrows: 1, x: bell.x, y: bell.y });

            // Bell gold sparkle particles
            for (let p = 0; p < 12; p++) {
              newParticles.push({
                id: `p-${Date.now()}-${p}`,
                x: bell.x,
                y: bell.y,
                vx: (Math.random() - 0.5) * 200,
                vy: (Math.random() - 0.5) * 200,
                radius: 3.5,
                color: '#fbbf24',
                alpha: 1,
                life: 0,
                maxLife: 0.5,
              });
            }

            newBadges.push({
              id: `b-${Date.now()}`,
              x: bell.x,
              y: bell.y - 15,
              text: `+${bell.points} (+1 ARROW!)`,
              color: '#f59e0b',
              alpha: 1,
              vy: -45,
            });
            break;
          }
        }
      }
    }

    // Check hit against wooden targets
    if (!hasHit) {
      for (let i = 0; i < updatedTargets.length; i++) {
        const target = updatedTargets[i]!;
        const distFromCenter = Math.hypot(arrowTipX - target.x, arrowTipY - target.y);

        if (distFromCenter <= target.radius) {
          const ringResult = getRingPoints(distFromCenter);
          if (ringResult) {
            hasHit = true;
            let earnedPoints = ringResult.points;

            if (ringResult.ring === 'bullseye') {
              nextConsecutiveBullseyes += 1;
              nextBullseyeCount += 1;
              if (nextConsecutiveBullseyes > 1) {
                earnedPoints += (nextConsecutiveBullseyes - 1) * 50; // Bullseye streak bonus!
              }
            } else {
              nextConsecutiveBullseyes = 0;
            }

            nextScore += earnedPoints;

            // Stick arrow into target
            target.stuckArrows.push({
              offsetX: arrowTipX - target.x,
              offsetY: arrowTipY - target.y,
              angle: updatedArrow.angle,
            });

            events.push({
              type: 'target_hit',
              ringType: ringResult.ring,
              pointsEarned: earnedPoints,
              x: arrowTipX,
              y: arrowTipY,
            });

            // Target hit particles
            const particleColor =
              ringResult.ring === 'bullseye'
                ? '#f59e0b'
                : ringResult.ring === 'red'
                ? '#ef4444'
                : ringResult.ring === 'blue'
                ? '#3b82f6'
                : '#e2e8f0';

            for (let p = 0; p < 12; p++) {
              newParticles.push({
                id: `p-${Date.now()}-${p}`,
                x: arrowTipX,
                y: arrowTipY,
                vx: (Math.random() - 0.5) * 180,
                vy: (Math.random() - 0.5) * 180,
                radius: 2.5 + Math.random() * 2.5,
                color: particleColor,
                alpha: 1,
                life: 0,
                maxLife: 0.4 + Math.random() * 0.25,
              });
            }

            // Floating badge
            let badgeText = `+${earnedPoints} ${ringResult.label}`;
            if (nextConsecutiveBullseyes > 1 && ringResult.ring === 'bullseye') {
              badgeText = `+${earnedPoints} BULLSEYE STREAK x${nextConsecutiveBullseyes}!`;
            }

            newBadges.push({
              id: `b-${Date.now()}`,
              x: arrowTipX,
              y: arrowTipY - 18,
              text: badgeText,
              color: particleColor,
              alpha: 1,
              vy: -40,
            });
            break;
          }
        }
      }
    }

    // Check boundary miss
    const isOutOfBounds =
      arrowTipX > state.width + 40 ||
      arrowTipY > state.height + 40 ||
      arrowTipX < -40 ||
      updatedArrow.flightTime > 2.8;

    if (hasHit || isOutOfBounds) {
      updatedArrow.isActive = false;

      if (!hasHit) {
        nextConsecutiveBullseyes = 0;
        events.push({ type: 'arrow_miss' });
        newBadges.push({
          id: `b-${Date.now()}`,
          x: Math.min(state.width - 60, Math.max(60, updatedArrow.x)),
          y: Math.min(state.height - 60, Math.max(60, updatedArrow.y)),
          text: 'MISS',
          color: '#94a3b8',
          alpha: 1,
          vy: -30,
        });
      }
    }
  }

  // 3. State transitions when arrow finishes flight
  if (updatedArrow && !updatedArrow.isActive && nextStatus === 'arrow_flying') {
    const stageConfig = STAGE_CONFIGS.find((s) => s.stage === state.stage) || STAGE_CONFIGS[0]!;

    if (nextScore >= stageConfig.targetScore) {
      // Stage Cleared!
      if (state.stage >= STAGE_CONFIGS.length) {
        nextStatus = 'victory';
        events.push({ type: 'victory', pointsEarned: nextScore });
      } else {
        nextStatus = 'stage_cleared';
        events.push({ type: 'stage_cleared', pointsEarned: nextScore });
      }
    } else if (nextArrowsLeft <= 0) {
      // Out of arrows and haven't met target score
      nextStatus = 'game_over';
      events.push({ type: 'game_over', pointsEarned: nextScore });
    } else {
      // Ready for next shot: generate fresh gust of wind
      const nextWind = generateWind(stageConfig.windMin, stageConfig.windMax);
      return {
        state: {
          ...state,
          status: 'aiming',
          score: nextScore,
          highScore: Math.max(nextHighScore, nextScore),
          arrowsLeft: nextArrowsLeft,
          currentWind: nextWind,
          consecutiveBullseyes: nextConsecutiveBullseyes,
          bullseyeCount: nextBullseyeCount,
          targets: updatedTargets,
          apples: updatedApples,
          bells: updatedBells,
          particles: [...state.particles, ...newParticles],
          floatingBadges: [...state.floatingBadges, ...newBadges],
          arrow: null,
          timeInState: 0,
        },
        events,
      };
    }
  }

  // 4. Update particles and floating badges
  const activeParticles = [...state.particles, ...newParticles]
    .map((p) => ({
      ...p,
      x: p.x + p.vx * safeDt,
      y: p.y + p.vy * safeDt,
      life: p.life + safeDt,
      alpha: Math.max(0, 1 - (p.life + safeDt) / p.maxLife),
    }))
    .filter((p) => p.life < p.maxLife);

  const activeBadges = [...state.floatingBadges, ...newBadges]
    .map((b) => ({
      ...b,
      y: b.y + b.vy * safeDt,
      alpha: Math.max(0, b.alpha - safeDt * 1.2),
    }))
    .filter((b) => b.alpha > 0.05);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: Math.max(nextHighScore, nextScore),
      arrowsLeft: nextArrowsLeft,
      consecutiveBullseyes: nextConsecutiveBullseyes,
      bullseyeCount: nextBullseyeCount,
      targets: updatedTargets,
      apples: updatedApples,
      bells: updatedBells,
      particles: activeParticles,
      floatingBadges: activeBadges,
      arrow: updatedArrow,
      timeInState: nextTimeInState,
    },
    events,
  };
}

export function nextStage(state: DuckArcheryState): DuckArcheryState {
  const nextStageNum = state.stage + 1;
  const config = STAGE_CONFIGS.find((s) => s.stage === nextStageNum) || STAGE_CONFIGS[0]!;
  const wind = generateWind(config.windMin, config.windMax);

  return {
    ...state,
    status: 'aiming',
    stage: config.stage,
    arrowsLeft: config.arrowsGiven,
    currentWind: wind,
    isPulling: false,
    pullDistance: 0,
    arrow: null,
    targets: createStageTargets(config),
    apples: createStageApples(config),
    bells: createStageBells(config),
    particles: [],
    floatingBadges: [],
    timeInState: 0,
  };
}

export function resetStage(state: DuckArcheryState): DuckArcheryState {
  const config = STAGE_CONFIGS.find((s) => s.stage === state.stage) || STAGE_CONFIGS[0]!;
  const wind = generateWind(config.windMin, config.windMax);

  return {
    ...state,
    status: 'aiming',
    arrowsLeft: config.arrowsGiven,
    currentWind: wind,
    isPulling: false,
    pullDistance: 0,
    arrow: null,
    targets: createStageTargets(config),
    apples: createStageApples(config),
    bells: createStageBells(config),
    particles: [],
    floatingBadges: [],
    consecutiveBullseyes: 0,
    timeInState: 0,
  };
}

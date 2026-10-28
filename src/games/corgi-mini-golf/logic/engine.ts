import {
  CorgiMiniGolfState,
  CorgiMiniGolfEvent,
  HoleConfig,
  GolfWall,
  GolfBumper,
  GolfHazard,
  BonusBone,
} from './types';

export const HOLE_CONFIGS: HoleConfig[] = [
  {
    holeNumber: 1,
    name: 'Pasture Fairway',
    par: 3,
    ballStart: { x: 250, y: 600 },
    cup: { x: 250, y: 160, radius: 15 },
    walls: [
      { x1: 90, y1: 100, x2: 410, y2: 100 },
      { x1: 410, y1: 100, x2: 410, y2: 660 },
      { x1: 410, y1: 660, x2: 90, y2: 660 },
      { x1: 90, y1: 660, x2: 90, y2: 100 },
    ],
    bumpers: [
      { id: 'b1-1', x: 180, y: 360, radius: 20, bouncePower: 1.15 },
      { id: 'b1-2', x: 320, y: 360, radius: 20, bouncePower: 1.15 },
    ],
    hazards: [
      { id: 'h1-1', type: 'sand', x: 215, y: 330, width: 70, height: 60, frictionMultiplier: 3.2 },
    ],
    bones: [
      { x: 250, y: 260 },
      { x: 140, y: 480 },
    ],
  },
  {
    holeNumber: 2,
    name: 'Windmill Dogleg',
    par: 3,
    ballStart: { x: 150, y: 600 },
    cup: { x: 370, y: 170, radius: 15 },
    walls: [
      // Outer perimeter
      { x1: 90, y1: 100, x2: 420, y2: 100 },
      { x1: 420, y1: 100, x2: 420, y2: 320 },
      { x1: 420, y1: 320, x2: 230, y2: 320 },
      { x1: 230, y1: 320, x2: 230, y2: 660 },
      { x1: 230, y1: 660, x2: 90, y2: 660 },
      { x1: 90, y1: 660, x2: 90, y2: 100 },
    ],
    bumpers: [
      { id: 'b2-1', x: 160, y: 260, radius: 24, bouncePower: 1.2 },
      { id: 'b2-2', x: 300, y: 140, radius: 20, bouncePower: 1.15 },
    ],
    hazards: [
      { id: 'h2-1', type: 'mud', x: 110, y: 400, width: 80, height: 60, frictionMultiplier: 4.0 },
    ],
    bones: [
      { x: 160, y: 180 },
      { x: 300, y: 250 },
    ],
  },
  {
    holeNumber: 3,
    name: 'Mud Trap Chicane',
    par: 4,
    ballStart: { x: 250, y: 620 },
    cup: { x: 250, y: 150, radius: 15 },
    walls: [
      // Outer box
      { x1: 80, y1: 90, x2: 420, y2: 90 },
      { x1: 420, y1: 90, x2: 420, y2: 670 },
      { x1: 420, y1: 670, x2: 80, y2: 670 },
      { x1: 80, y1: 670, x2: 80, y2: 90 },
      // Internal baffles / chicane walls
      { x1: 80, y1: 460, x2: 280, y2: 460 },
      { x1: 220, y1: 290, x2: 420, y2: 290 },
    ],
    bumpers: [
      { id: 'b3-1', x: 350, y: 460, radius: 22, bouncePower: 1.25 },
      { id: 'b3-2', x: 150, y: 290, radius: 22, bouncePower: 1.25 },
    ],
    hazards: [
      { id: 'h3-1', type: 'mud', x: 300, y: 370, width: 80, height: 50, frictionMultiplier: 3.8 },
      { id: 'h3-2', type: 'sand', x: 120, y: 200, width: 70, height: 50, frictionMultiplier: 3.2 },
    ],
    bones: [
      { x: 340, y: 530 },
      { x: 150, y: 380 },
      { x: 320, y: 210 },
    ],
  },
  {
    holeNumber: 4,
    name: 'Barnyard Championship',
    par: 4,
    ballStart: { x: 250, y: 630 },
    cup: { x: 250, y: 140, radius: 15 },
    walls: [
      // Funnel entrance
      { x1: 70, y1: 80, x2: 430, y2: 80 },
      { x1: 430, y1: 80, x2: 430, y2: 680 },
      { x1: 430, y1: 680, x2: 70, y2: 680 },
      { x1: 70, y1: 680, x2: 70, y2: 80 },
      // Central island walls
      { x1: 190, y1: 340, x2: 310, y2: 340 },
      { x1: 310, y1: 340, x2: 310, y2: 450 },
      { x1: 310, y1: 450, x2: 190, y2: 450 },
      { x1: 190, y1: 450, x2: 190, y2: 340 },
    ],
    bumpers: [
      { id: 'b4-1', x: 130, y: 240, radius: 24, bouncePower: 1.3 },
      { id: 'b4-2', x: 370, y: 240, radius: 24, bouncePower: 1.3 },
      { id: 'b4-3', x: 250, y: 240, radius: 20, bouncePower: 1.2 },
    ],
    hazards: [
      { id: 'h4-1', type: 'sand', x: 100, y: 360, width: 70, height: 80, frictionMultiplier: 3.2 },
      { id: 'h4-2', type: 'sand', x: 330, y: 360, width: 70, height: 80, frictionMultiplier: 3.2 },
    ],
    bones: [
      { x: 130, y: 530 },
      { x: 370, y: 530 },
      { x: 250, y: 395 },
    ],
  },
];

export const MAX_PUTT_DISTANCE = 90; // px
export const MAX_PUTT_SPEED = 780; // px/s
export const MIN_PUTT_SPEED = 120; // px/s
export const BASE_FRICTION = 0.982; // per 1/60s frame
export const STOP_SPEED_THRESHOLD = 9; // px/s

export function createBones(config: HoleConfig): BonusBone[] {
  return config.bones.map((b, idx) => ({
    id: `bone-${config.holeNumber}-${idx}`,
    x: b.x,
    y: b.y,
    radius: 14,
    points: 100,
    isCollected: false,
  }));
}

export function createInitialState(holeIndex = 0, currentHighScore = 0): CorgiMiniGolfState {
  const config = HOLE_CONFIGS[holeIndex] || HOLE_CONFIGS[0]!;

  return {
    status: 'aiming',
    holeIndex: config.holeNumber - 1,
    strokesInHole: 0,
    totalStrokes: 0,
    score: 0,
    highScore: currentHighScore,
    ball: {
      x: config.ballStart.x,
      y: config.ballStart.y,
      vx: 0,
      vy: 0,
      radius: 10,
      isMoving: false,
      isPotted: false,
      sinkScale: 1,
      sinkAlpha: 1,
    },
    isAiming: false,
    aimStartX: 0,
    aimStartY: 0,
    aimCurrentX: 0,
    aimCurrentY: 0,
    aimPower: 0,
    aimAngle: 0,
    bones: createBones(config),
    sparkles: [],
    floatingBadges: [],
    holeHistory: [],
    timeInState: 0,
    width: 500,
    height: 720,
  };
}

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
export function distToSegment(
  px: number,
  py: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number
): { dist: number; closestX: number; closestY: number; normalX: number; normalY: number } {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;

  if (lenSq === 0) {
    const d = Math.hypot(px - x1, py - y1);
    return { dist: d, closestX: x1, closestY: y1, normalX: 0, normalY: -1 };
  }

  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = x1 + t * dx;
  const closestY = y1 + t * dy;
  const dist = Math.hypot(px - closestX, py - closestY);

  // Normal vector facing the ball
  let nx = px - closestX;
  let ny = py - closestY;
  const nLen = Math.hypot(nx, ny);
  if (nLen > 0.001) {
    nx /= nLen;
    ny /= nLen;
  } else {
    // Default perpendicular normal
    nx = -dy / Math.sqrt(lenSq);
    ny = dx / Math.sqrt(lenSq);
  }

  return { dist, closestX, closestY, normalX: nx, normalY: ny };
}

export function startAim(state: CorgiMiniGolfState, screenX: number, screenY: number): CorgiMiniGolfState {
  if (state.status !== 'aiming' || state.ball.isMoving || state.ball.isPotted) {
    return state;
  }

  return {
    ...state,
    isAiming: true,
    aimStartX: screenX,
    aimStartY: screenY,
    aimCurrentX: screenX,
    aimCurrentY: screenY,
    aimPower: 0,
    aimAngle: 0,
  };
}

export function updateAim(state: CorgiMiniGolfState, screenX: number, screenY: number): CorgiMiniGolfState {
  if (!state.isAiming) return state;

  // Pull back to launch forward
  const dx = state.aimStartX - screenX;
  const dy = state.aimStartY - screenY;
  const rawDist = Math.hypot(dx, dy);
  const clampedDist = Math.min(MAX_PUTT_DISTANCE, rawDist);
  const power = (clampedDist / MAX_PUTT_DISTANCE) * 100;
  const angle = Math.atan2(dy, dx);

  return {
    ...state,
    aimCurrentX: screenX,
    aimCurrentY: screenY,
    aimPower: power,
    aimAngle: angle,
  };
}

export function releaseAim(state: CorgiMiniGolfState): { state: CorgiMiniGolfState; event?: CorgiMiniGolfEvent } {
  if (!state.isAiming || state.ball.isMoving || state.ball.isPotted) {
    return { state: { ...state, isAiming: false } };
  }

  // Reject tiny jitter taps (< 10px)
  const dx = state.aimStartX - state.aimCurrentX;
  const dy = state.aimStartY - state.aimCurrentY;
  const dist = Math.hypot(dx, dy);

  if (dist < 10) {
    return {
      state: {
        ...state,
        isAiming: false,
        aimPower: 0,
      },
    };
  }

  const powerFrac = Math.min(MAX_PUTT_DISTANCE, dist) / MAX_PUTT_DISTANCE;
  const speed = MIN_PUTT_SPEED + powerFrac * (MAX_PUTT_SPEED - MIN_PUTT_SPEED);

  const vx = Math.cos(state.aimAngle) * speed;
  const vy = Math.sin(state.aimAngle) * speed;

  const nextStrokes = state.strokesInHole + 1;
  const nextTotal = state.totalStrokes + 1;

  return {
    state: {
      ...state,
      status: 'ball_rolling',
      isAiming: false,
      aimPower: 0,
      strokesInHole: nextStrokes,
      totalStrokes: nextTotal,
      ball: {
        ...state.ball,
        vx,
        vy,
        isMoving: true,
      },
    },
    event: {
      type: 'putt_hit',
      strokes: nextStrokes,
      x: state.ball.x,
      y: state.ball.y,
    },
  };
}

export function getScoreRating(strokes: number, par: number): { label: string; points: number } {
  if (strokes === 1) return { label: '🌟 HOLE-IN-ONE!', points: 500 };
  const diff = strokes - par;
  if (diff <= -2) return { label: '🦅 EAGLE!', points: 300 };
  if (diff === -1) return { label: '🐦 BIRDIE!', points: 150 };
  if (diff === 0) return { label: '⛳ PAR', points: 50 };
  if (diff === 1) return { label: 'BOGEY', points: 20 };
  return { label: 'DOUBLE BOGEY', points: 10 };
}

export function updateEngine(
  state: CorgiMiniGolfState,
  dt: number
): { state: CorgiMiniGolfState; events: CorgiMiniGolfEvent[] } {
  const events: CorgiMiniGolfEvent[] = [];
  const safeDt = Math.min(0.05, Math.max(0.001, dt));

  let nextScore = state.score;
  let nextHighScore = Math.max(state.highScore, nextScore);
  let nextStatus = state.status;
  const nextTimeInState = state.timeInState + safeDt;

  const config = HOLE_CONFIGS[state.holeIndex] || HOLE_CONFIGS[0]!;
  const ball = { ...state.ball };
  const newSparkles: CorgiMiniGolfState['sparkles'] = [];
  const newBadges: CorgiMiniGolfState['floatingBadges'] = [];
  const updatedBones = [...state.bones];

  // 1. If ball is sinking in cup animation
  if (ball.isPotted) {
    ball.sinkScale = Math.max(0, ball.sinkScale - safeDt * 3.5);
    ball.sinkAlpha = Math.max(0, ball.sinkAlpha - safeDt * 3.5);

    if (ball.sinkScale <= 0.05 && nextStatus !== 'hole_cleared' && nextStatus !== 'victory') {
      const rating = getScoreRating(state.strokesInHole, config.par);
      nextScore += rating.points;

      const historyEntry = {
        hole: config.holeNumber,
        name: config.name,
        par: config.par,
        strokes: state.strokesInHole,
        scoreRating: rating.label,
        points: rating.points,
      };

      const nextHistory = [...state.holeHistory, historyEntry];

      if (state.holeIndex >= HOLE_CONFIGS.length - 1) {
        nextStatus = 'victory';
        events.push({
          type: 'victory',
          strokes: state.totalStrokes,
          pointsEarned: nextScore,
        });
      } else {
        nextStatus = 'hole_cleared';
        events.push({
          type: 'hole_cleared',
          strokes: state.strokesInHole,
          par: config.par,
          rating: rating.label,
          pointsEarned: rating.points,
        });
      }

      return {
        state: {
          ...state,
          status: nextStatus,
          score: nextScore,
          highScore: Math.max(nextHighScore, nextScore),
          ball,
          holeHistory: nextHistory,
          timeInState: nextTimeInState,
        },
        events,
      };
    }
  }

  // 2. Ball movement and sub-stepped physics
  if (ball.isMoving && !ball.isPotted) {
    const subSteps = 3;
    const subDt = safeDt / subSteps;

    for (let step = 0; step < subSteps; step++) {
      let currentFriction = Math.pow(BASE_FRICTION, subDt * 60);

      // Check hazards (Sand / Mud)
      for (const h of config.hazards) {
        if (
          ball.x >= h.x &&
          ball.x <= h.x + h.width &&
          ball.y >= h.y &&
          ball.y <= h.y + h.height
        ) {
          currentFriction = Math.pow(0.93, subDt * 60);
          break;
        }
      }

      ball.x += ball.vx * subDt;
      ball.y += ball.vy * subDt;
      ball.vx *= currentFriction;
      ball.vy *= currentFriction;

      // Check cup suction & pot
      const distToCup = Math.hypot(ball.x - config.cup.x, ball.y - config.cup.y);
      const currentSpeed = Math.hypot(ball.vx, ball.vy);

      if (distToCup <= config.cup.radius && currentSpeed <= 270) {
        // Potted in the cup!
        ball.isPotted = true;
        ball.isMoving = false;
        ball.vx = 0;
        ball.vy = 0;
        ball.x = config.cup.x;
        ball.y = config.cup.y;
        events.push({ type: 'cup_sink', x: config.cup.x, y: config.cup.y });

        // Cup sink star sparkles
        for (let p = 0; p < 16; p++) {
          newSparkles.push({
            id: `sp-${Date.now()}-${p}`,
            x: config.cup.x,
            y: config.cup.y,
            vx: (Math.random() - 0.5) * 180,
            vy: (Math.random() - 0.5) * 180,
            radius: 3 + Math.random() * 3,
            color: p % 2 === 0 ? '#fbbf24' : '#ffffff',
            alpha: 1,
            life: 0,
            maxLife: 0.5 + Math.random() * 0.3,
          });
        }

        const rating = getScoreRating(state.strokesInHole, config.par);
        newBadges.push({
          id: `b-${Date.now()}`,
          x: config.cup.x,
          y: config.cup.y - 20,
          text: rating.label,
          color: rating.points >= 150 ? '#fbbf24' : '#4ade80',
          alpha: 1,
          vy: -40,
        });
        break;
      }

      // Check bone collection
      for (let i = 0; i < updatedBones.length; i++) {
        const bone = updatedBones[i]!;
        if (!bone.isCollected) {
          const d = Math.hypot(ball.x - bone.x, ball.y - bone.y);
          if (d <= ball.radius + bone.radius) {
            bone.isCollected = true;
            nextScore += bone.points;
            events.push({ type: 'bone_collect', pointsEarned: bone.points, x: bone.x, y: bone.y });

            newBadges.push({
              id: `b-${Date.now()}`,
              x: bone.x,
              y: bone.y - 12,
              text: `+${bone.points} BONE!`,
              color: '#facc15',
              alpha: 1,
              vy: -35,
            });

            for (let p = 0; p < 8; p++) {
              newSparkles.push({
                id: `sp-${Date.now()}-${p}`,
                x: bone.x,
                y: bone.y,
                vx: (Math.random() - 0.5) * 140,
                vy: (Math.random() - 0.5) * 140,
                radius: 2.5,
                color: '#fef08a',
                alpha: 1,
                life: 0,
                maxLife: 0.4,
              });
            }
          }
        }
      }

      // Check round bumper bounces
      for (const bumper of config.bumpers) {
        const d = Math.hypot(ball.x - bumper.x, ball.y - bumper.y);
        if (d <= ball.radius + bumper.radius) {
          const nx = (ball.x - bumper.x) / (d || 1);
          const ny = (ball.y - bumper.y) / (d || 1);

          // Displace outside bumper
          ball.x = bumper.x + nx * (ball.radius + bumper.radius + 1);
          ball.y = bumper.y + ny * (ball.radius + bumper.radius + 1);

          // Reflect velocity with bounce boost
          const dot = ball.vx * nx + ball.vy * ny;
          if (dot < 0) {
            ball.vx = (ball.vx - 2 * dot * nx) * bumper.bouncePower;
            ball.vy = (ball.vy - 2 * dot * ny) * bumper.bouncePower;
            events.push({ type: 'bumper_bounce', x: bumper.x, y: bumper.y });

            for (let p = 0; p < 8; p++) {
              newSparkles.push({
                id: `sp-${Date.now()}-${p}`,
                x: ball.x,
                y: ball.y,
                vx: nx * 100 + (Math.random() - 0.5) * 60,
                vy: ny * 100 + (Math.random() - 0.5) * 60,
                radius: 2.5,
                color: '#38bdf8',
                alpha: 1,
                life: 0,
                maxLife: 0.35,
              });
            }
          }
        }
      }

      // Check line wall collisions
      for (const wall of config.walls) {
        const seg = distToSegment(ball.x, ball.y, wall.x1, wall.y1, wall.x2, wall.y2);
        if (seg.dist <= ball.radius) {
          // Push ball outside wall
          ball.x = seg.closestX + seg.normalX * (ball.radius + 0.8);
          ball.y = seg.closestY + seg.normalY * (ball.radius + 0.8);

          // Reflect velocity with 0.78 restitution
          const dot = ball.vx * seg.normalX + ball.vy * seg.normalY;
          if (dot < 0) {
            ball.vx = (ball.vx - 2 * dot * seg.normalX) * 0.78;
            ball.vy = (ball.vy - 2 * dot * seg.normalY) * 0.78;
            events.push({ type: 'rail_bounce', x: ball.x, y: ball.y });
          }
        }
      }
    }

    // Stop ball if slow enough
    const finalSpeed = Math.hypot(ball.vx, ball.vy);
    if (finalSpeed < STOP_SPEED_THRESHOLD && !ball.isPotted) {
      ball.isMoving = false;
      ball.vx = 0;
      ball.vy = 0;
      nextStatus = 'aiming';
    }
  }

  // 3. Update sparkles and floating texts
  const activeSparkles = [...state.sparkles, ...newSparkles]
    .map((sp) => ({
      ...sp,
      x: sp.x + sp.vx * safeDt,
      y: sp.y + sp.vy * safeDt,
      life: sp.life + safeDt,
      alpha: Math.max(0, 1 - (sp.life + safeDt) / sp.maxLife),
    }))
    .filter((sp) => sp.life < sp.maxLife);

  const activeBadges = [...state.floatingBadges, ...newBadges]
    .map((b) => ({
      ...b,
      y: b.y + b.vy * safeDt,
      alpha: Math.max(0, b.alpha - safeDt * 1.3),
    }))
    .filter((b) => b.alpha > 0.05);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: Math.max(nextHighScore, nextScore),
      ball,
      bones: updatedBones,
      sparkles: activeSparkles,
      floatingBadges: activeBadges,
      timeInState: nextTimeInState,
    },
    events,
  };
}

export function nextHole(state: CorgiMiniGolfState): CorgiMiniGolfState {
  const nextIdx = state.holeIndex + 1;
  const config = HOLE_CONFIGS[nextIdx] || HOLE_CONFIGS[0]!;

  return {
    ...state,
    status: 'aiming',
    holeIndex: config.holeNumber - 1,
    strokesInHole: 0,
    ball: {
      x: config.ballStart.x,
      y: config.ballStart.y,
      vx: 0,
      vy: 0,
      radius: 10,
      isMoving: false,
      isPotted: false,
      sinkScale: 1,
      sinkAlpha: 1,
    },
    isAiming: false,
    aimPower: 0,
    bones: createBones(config),
    sparkles: [],
    floatingBadges: [],
    timeInState: 0,
  };
}

export function resetHole(state: CorgiMiniGolfState): CorgiMiniGolfState {
  const config = HOLE_CONFIGS[state.holeIndex] || HOLE_CONFIGS[0]!;

  return {
    ...state,
    status: 'aiming',
    strokesInHole: 0,
    ball: {
      x: config.ballStart.x,
      y: config.ballStart.y,
      vx: 0,
      vy: 0,
      radius: 10,
      isMoving: false,
      isPotted: false,
      sinkScale: 1,
      sinkAlpha: 1,
    },
    isAiming: false,
    aimPower: 0,
    bones: createBones(config),
    sparkles: [],
    floatingBadges: [],
    timeInState: 0,
  };
}

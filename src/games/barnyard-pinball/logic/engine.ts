import {
  PinballState,
  Ball,
  Flipper,
  Bumper,
  RolloverLane,
  Slingshot,
  PinballEvent,
} from './types';

export const TABLE_WIDTH = 400;
export const TABLE_HEIGHT = 600;
export const GRAVITY = 720;
export const BALL_RADIUS = 8.5;
export const PLUNGER_REST_X = 378;
export const PLUNGER_REST_Y = 530;

export function createInitialState(savedHighScore: number = 0): PinballState {
  const leftFlipper: Flipper = {
    pivotX: 130,
    pivotY: 515,
    length: 56,
    baseAngle: 0.45, // downward resting angle in radians
    upAngle: -0.52, // upward raised angle
    currentAngle: 0.45,
    angularVelocity: 0,
    isEngaged: false,
    side: 'left',
  };

  const rightFlipper: Flipper = {
    pivotX: 270,
    pivotY: 515,
    length: 56,
    baseAngle: Math.PI - 0.45,
    upAngle: Math.PI + 0.52,
    currentAngle: Math.PI - 0.45,
    angularVelocity: 0,
    isEngaged: false,
    side: 'right',
  };

  const bumpers: Bumper[] = [
    {
      id: 'bumper-barn',
      x: 145,
      y: 175,
      radius: 25,
      points: 100,
      label: 'BARN',
      color: '#ef4444',
      hitTimer: 0,
    },
    {
      id: 'bumper-corn',
      x: 255,
      y: 175,
      radius: 25,
      points: 100,
      label: 'CORN',
      color: '#f59e0b',
      hitTimer: 0,
    },
    {
      id: 'bumper-milk',
      x: 200,
      y: 245,
      radius: 26,
      points: 150,
      label: 'MILK',
      color: '#38bdf8',
      hitTimer: 0,
    },
  ];

  const rolloverLanes: RolloverLane[] = [
    { id: 'lane-f', letter: 'F', x: 95, y: 70, width: 28, height: 26, isLit: false },
    { id: 'lane-a', letter: 'A', x: 145, y: 60, width: 28, height: 26, isLit: false },
    { id: 'lane-r', letter: 'R', x: 225, y: 60, width: 28, height: 26, isLit: false },
    { id: 'lane-m', letter: 'M', x: 275, y: 70, width: 28, height: 26, isLit: false },
  ];

  const slingshots: Slingshot[] = [
    {
      side: 'left',
      x1: 75,
      y1: 400,
      x2: 110,
      y2: 475,
      normalX: 0.9,
      normalY: -0.4,
      hitTimer: 0,
    },
    {
      side: 'right',
      x1: 325,
      y1: 400,
      x2: 290,
      y2: 475,
      normalX: -0.9,
      normalY: -0.4,
      hitTimer: 0,
    },
  ];

  const starterBall: Ball = {
    id: `ball-${Date.now()}-1`,
    x: PLUNGER_REST_X,
    y: PLUNGER_REST_Y,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    isActive: true,
    trail: [],
  };

  return {
    status: 'ready',
    score: 0,
    highScore: savedHighScore,
    multiplier: 1,
    ballsRemaining: 3,
    balls: [starterBall],
    leftFlipper,
    rightFlipper,
    bumpers,
    rolloverLanes,
    slingshots,
    plungerCharge: 0,
    isPlungerCharging: false,
    multiballActive: false,
    barnHits: 0,
    lastHitTime: 0,
    tiltWarnings: 0,
  };
}

export function startPlungerCharge(state: PinballState): PinballState {
  if (state.status !== 'ready' && state.status !== 'playing') return state;
  // Plunger is only usable when a ball is resting in the plunger lane
  const ballInLane = state.balls.find((b) => b.x > 360 && b.y > 450);
  if (!ballInLane) return state;

  return {
    ...state,
    isPlungerCharging: true,
  };
}

export function releasePlunger(
  state: PinballState
): { state: PinballState; event?: PinballEvent } {
  if (!state.isPlungerCharging && state.plungerCharge <= 0) {
    return { state };
  }

  const charge = Math.max(0.35, state.plungerCharge);
  const launchSpeed = 550 + charge * 450; // 700 to 1000 px/s upward launch

  const nextBalls = state.balls.map((b) => {
    if (b.x > 360 && b.y > 450) {
      return {
        ...b,
        vy: -launchSpeed,
        vx: (Math.random() - 0.5) * 15,
      };
    }
    return b;
  });

  const nextState: PinballState = {
    ...state,
    status: 'playing',
    isPlungerCharging: false,
    plungerCharge: 0,
    balls: nextBalls,
  };

  return {
    state: nextState,
    event: {
      type: 'ball_launched',
      ballId: nextBalls[0]?.id || 'ball',
      power: charge,
    },
  };
}

export function setFlipper(
  state: PinballState,
  side: 'left' | 'right' | 'both',
  engaged: boolean
): { state: PinballState; event?: PinballEvent } {
  if (state.status === 'game_over') return { state };

  const nextLeft = { ...state.leftFlipper };
  const nextRight = { ...state.rightFlipper };

  let changed = false;
  if (side === 'left' || side === 'both') {
    if (nextLeft.isEngaged !== engaged) {
      nextLeft.isEngaged = engaged;
      changed = true;
    }
  }
  if (side === 'right' || side === 'both') {
    if (nextRight.isEngaged !== engaged) {
      nextRight.isEngaged = engaged;
      changed = true;
    }
  }

  return {
    state: {
      ...state,
      leftFlipper: nextLeft,
      rightFlipper: nextRight,
    },
    event: changed && engaged ? { type: 'flipper_clack', side: side === 'both' ? 'left' : side } : undefined,
  };
}

export function restartGame(state: PinballState): PinballState {
  return createInitialState(state.highScore);
}

export function updateEngine(
  state: PinballState,
  dt: number
): { state: PinballState; events: PinballEvent[] } {
  if (state.status === 'game_over') {
    return { state, events: [] };
  }

  const events: PinballEvent[] = [];
  const safeDt = Math.min(0.04, Math.max(0.001, dt));

  // 1. Update Plunger Charging
  let nextCharge = state.plungerCharge;
  if (state.isPlungerCharging) {
    nextCharge = Math.min(1.0, nextCharge + safeDt * 1.6);
  }

  // 2. Update Flippers Angular Motion
  const updateFlipperAngle = (flipper: Flipper): Flipper => {
    const target = flipper.isEngaged ? flipper.upAngle : flipper.baseAngle;
    const speed = 28; // fast snappy flip speed
    const diff = target - flipper.currentAngle;
    const nextAngle = flipper.currentAngle + diff * Math.min(1, safeDt * speed);
    const angularVel = (nextAngle - flipper.currentAngle) / safeDt;
    return {
      ...flipper,
      currentAngle: nextAngle,
      angularVelocity: angularVel,
    };
  };

  const nextLeftFlipper = updateFlipperAngle(state.leftFlipper);
  const nextRightFlipper = updateFlipperAngle(state.rightFlipper);

  // 3. Update Bumper and Slingshot Hit Timers
  const nextBumpers = state.bumpers.map((b) => ({
    ...b,
    hitTimer: Math.max(0, b.hitTimer - safeDt),
  }));
  const nextSlingshots = state.slingshots.map((s) => ({
    ...s,
    hitTimer: Math.max(0, s.hitTimer - safeDt),
  }));

  // 4. Sub-Stepped Physics for Balls (4 sub-steps per frame)
  const SUB_STEPS = 4;
  const subDt = safeDt / SUB_STEPS;

  let currentBalls: Ball[] = state.balls.map((b) => ({
    ...b,
    trail: b.trail
      .map((t) => ({ ...t, alpha: t.alpha - safeDt * 3.5 }))
      .filter((t) => t.alpha > 0),
  }));

  let nextScore = state.score;
  let nextMultiplier = state.multiplier;
  let nextLanes = [...state.rolloverLanes];
  let nextBarnHits = state.barnHits;
  let nextMultiballActive = state.multiballActive;

  for (let step = 0; step < SUB_STEPS; step++) {
    for (let bi = 0; bi < currentBalls.length; bi++) {
      const ball = currentBalls[bi];
      if (!ball.isActive) continue;

      // Apply Gravity
      ball.vy += GRAVITY * subDt;

      // Air Friction
      ball.vx *= 0.998;
      ball.vy *= 0.998;

      // Integrate Position
      ball.x += ball.vx * subDt;
      ball.y += ball.vy * subDt;

      // Record trail in last sub-step
      if (step === SUB_STEPS - 1 && (Math.abs(ball.vx) > 30 || Math.abs(ball.vy) > 30)) {
        ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.6 });
        if (ball.trail.length > 8) ball.trail.shift();
      }

      // --- Collisions ---

      // A. Plunger Lane Outer Wall & Launch Ramp
      if (ball.x > 360) {
        // Plunger lane right wall
        if (ball.x + ball.radius > 392) {
          ball.x = 392 - ball.radius;
          ball.vx = -Math.abs(ball.vx) * 0.6;
        }
        // Plunger bottom floor
        if (ball.y + ball.radius > 560) {
          ball.y = 560 - ball.radius;
          ball.vy = -Math.abs(ball.vy) * 0.4;
          if (Math.abs(ball.vy) < 15) ball.vy = 0;
        }
        // Plunger left divider wall (y > 100)
        if (ball.y > 100 && ball.x - ball.radius < 362) {
          ball.x = 362 + ball.radius;
          ball.vx = Math.abs(ball.vx) * 0.6;
        }
      }

      // B. Top Arch & Curved Ceiling
      if (ball.y < 90) {
        // Upper arch collision (circular ceiling approximation)
        const archCenterX = 195;
        const archCenterY = 90;
        const archRadius = 175;
        const dx = ball.x - archCenterX;
        const dy = ball.y - archCenterY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > archRadius - ball.radius && dy < 0) {
          const nx = -dx / (dist || 1);
          const ny = -dy / (dist || 1);
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx -= 1.65 * dot * nx;
          ball.vy -= 1.65 * dot * ny;
          ball.x = archCenterX - nx * (archRadius - ball.radius - 1);
          ball.y = archCenterY - ny * (archRadius - ball.radius - 1);
        }
      }

      // C. Left and Right Outer Walls
      if (ball.x - ball.radius < 24) {
        ball.x = 24 + ball.radius;
        ball.vx = Math.abs(ball.vx) * 0.75;
      }
      if (ball.y > 100 && ball.x + ball.radius > 360 && ball.x < 365) {
        ball.x = 360 - ball.radius;
        ball.vx = -Math.abs(ball.vx) * 0.75;
      }

      // D. Rollover Lanes Collision
      for (let li = 0; li < nextLanes.length; li++) {
        const lane = nextLanes[li];
        if (
          ball.x > lane.x - lane.width / 2 &&
          ball.x < lane.x + lane.width / 2 &&
          ball.y > lane.y - lane.height / 2 &&
          ball.y < lane.y + lane.height / 2 &&
          !lane.isLit
        ) {
          lane.isLit = true;
          const earned = 250 * nextMultiplier;
          nextScore += earned;

          const allLit = nextLanes.every((l) => l.isLit);
          if (allLit) {
            nextMultiplier = Math.min(5, nextMultiplier + 1);
            nextScore += 5000 * nextMultiplier;
            // Reset lanes for next cycle
            nextLanes = nextLanes.map((l) => ({ ...l, isLit: false }));
          }

          events.push({
            type: 'rollover_lit',
            letter: lane.letter,
            allLit,
            multiplier: nextMultiplier,
          });
        }
      }

      // E. Bumpers Collision
      for (let bi2 = 0; bi2 < nextBumpers.length; bi2++) {
        const bmp = nextBumpers[bi2];
        const dx = ball.x - bmp.x;
        const dy = ball.y - bmp.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = bmp.radius + ball.radius;

        if (dist < minDist) {
          const nx = dx / (dist || 1);
          const ny = dy / (dist || 1);
          const kickSpeed = 460;

          ball.vx = nx * kickSpeed;
          ball.vy = ny * kickSpeed;
          ball.x = bmp.x + nx * (minDist + 1);
          ball.y = bmp.y + ny * (minDist + 1);

          bmp.hitTimer = 0.18;
          const earned = bmp.points * nextMultiplier;
          nextScore += earned;

          if (bmp.id === 'bumper-barn') {
            nextBarnHits++;
            if (nextBarnHits >= 3 && !nextMultiballActive) {
              nextMultiballActive = true;
              events.push({ type: 'multiball_started' });
              // Spawn an extra ball
              currentBalls.push({
                id: `ball-multi-${Date.now()}`,
                x: 200,
                y: 220,
                vx: (Math.random() - 0.5) * 200,
                vy: -350,
                radius: BALL_RADIUS,
                isActive: true,
                trail: [],
              });
            }
          }

          events.push({
            type: 'bumper_hit',
            bumperId: bmp.id,
            points: earned,
          });
        }
      }

      // F. Slingshots Collision
      for (let si = 0; si < nextSlingshots.length; si++) {
        const sling = nextSlingshots[si];
        // Line collision with slingshot hypotenuse
        const x1 = sling.x1;
        const y1 = sling.y1;
        const x2 = sling.x2;
        const y2 = sling.y2;

        const lineLen = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
        const u = ((ball.x - x1) * (x2 - x1) + (ball.y - y1) * (y2 - y1)) / (lineLen * lineLen);

        if (u >= 0 && u <= 1) {
          const closeX = x1 + u * (x2 - x1);
          const closeY = y1 + u * (y2 - y1);
          const dist = Math.sqrt((ball.x - closeX) * (ball.x - closeX) + (ball.y - closeY) * (ball.y - closeY));

          if (dist < ball.radius + 6) {
            sling.hitTimer = 0.15;
            const kickSpeed = 420;
            ball.vx = sling.normalX * kickSpeed;
            ball.vy = sling.normalY * kickSpeed;
            ball.x = closeX + sling.normalX * (ball.radius + 8);
            ball.y = closeY + sling.normalY * (ball.radius + 8);

            const earned = 75 * nextMultiplier;
            nextScore += earned;
            events.push({
              type: 'slingshot_hit',
              side: sling.side,
              points: earned,
            });
          }
        }
      }

      // G. Left Flipper Collision
      collideWithFlipper(ball, nextLeftFlipper);

      // H. Right Flipper Collision
      collideWithFlipper(ball, nextRightFlipper);

      // I. Bottom Inlane / Outlane Ramps to Flippers
      // Left guide wall
      if (ball.x < 130 && ball.y > 470 && ball.y < 520) {
        const slope = (520 - 470) / (130 - 60);
        const expectedY = 470 + (ball.x - 60) * slope;
        if (ball.y + ball.radius > expectedY) {
          ball.y = expectedY - ball.radius;
          ball.vy = -Math.abs(ball.vy) * 0.5;
          ball.vx += 30;
        }
      }
      // Right guide wall
      if (ball.x > 270 && ball.x < 360 && ball.y > 470 && ball.y < 520) {
        const slope = (520 - 470) / (270 - 340);
        const expectedY = 470 + (ball.x - 340) * slope;
        if (ball.y + ball.radius > expectedY) {
          ball.y = expectedY - ball.radius;
          ball.vy = -Math.abs(ball.vy) * 0.5;
          ball.vx -= 30;
        }
      }
    }
  }

  // 5. Check Drained Balls (y > 585)
  const remainingActiveBalls: Ball[] = [];
  let drainedCount = 0;

  for (let i = 0; i < currentBalls.length; i++) {
    const ball = currentBalls[i];
    if (ball.y > 590) {
      drainedCount++;
    } else {
      remainingActiveBalls.push(ball);
    }
  }

  let nextBallsRemaining = state.ballsRemaining;
  let nextStatus: PinballState['status'] = state.status;

  if (remainingActiveBalls.length === 0) {
    nextBallsRemaining = Math.max(0, state.ballsRemaining - 1);
    events.push({
      type: 'ball_drained',
      remainingBalls: nextBallsRemaining,
    });

    if (nextBallsRemaining > 0) {
      // Spawn new ball in plunger lane
      remainingActiveBalls.push({
        id: `ball-${Date.now()}`,
        x: PLUNGER_REST_X,
        y: PLUNGER_REST_Y,
        vx: 0,
        vy: 0,
        radius: BALL_RADIUS,
        isActive: true,
        trail: [],
      });
      nextStatus = 'ready';
    } else {
      nextStatus = 'game_over';
      events.push({
        type: 'game_over',
        finalScore: nextScore,
      });
    }
  }

  const nextHighScore = Math.max(state.highScore, nextScore);

  return {
    state: {
      ...state,
      status: nextStatus,
      score: nextScore,
      highScore: nextHighScore,
      multiplier: nextMultiplier,
      ballsRemaining: nextBallsRemaining,
      balls: remainingActiveBalls,
      leftFlipper: nextLeftFlipper,
      rightFlipper: nextRightFlipper,
      bumpers: nextBumpers,
      rolloverLanes: nextLanes,
      slingshots: nextSlingshots,
      plungerCharge: nextCharge,
      multiballActive: nextMultiballActive && remainingActiveBalls.length > 1,
      barnHits: nextBarnHits,
    },
    events,
  };
}

function collideWithFlipper(ball: Ball, flipper: Flipper): void {
  const tipX = flipper.pivotX + Math.cos(flipper.currentAngle) * flipper.length;
  const tipY = flipper.pivotY + Math.sin(flipper.currentAngle) * flipper.length;

  const dx = tipX - flipper.pivotX;
  const dy = tipY - flipper.pivotY;
  const lenSq = dx * dx + dy * dy;

  const u = ((ball.x - flipper.pivotX) * dx + (ball.y - flipper.pivotY) * dy) / lenSq;

  if (u >= -0.05 && u <= 1.05) {
    const clampedU = Math.max(0, Math.min(1, u));
    const closeX = flipper.pivotX + clampedU * dx;
    const closeY = flipper.pivotY + clampedU * dy;

    const dist = Math.sqrt((ball.x - closeX) * (ball.x - closeX) + (ball.y - closeY) * (ball.y - closeY));
    const hitRadius = ball.radius + 7;

    if (dist < hitRadius) {
      // Normal vector of the flipper blade
      let nx = -dy / Math.sqrt(lenSq);
      let ny = dx / Math.sqrt(lenSq);

      // Ensure normal points upward into the playfield
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }

      // Reposition ball out of flipper surface
      ball.x = closeX + nx * (hitRadius + 1);
      ball.y = closeY + ny * (hitRadius + 1);

      // Flipper velocity at impact point
      const impactDist = clampedU * flipper.length;
      const flipperVel = flipper.angularVelocity * impactDist;

      // Base bounce
      const dot = ball.vx * nx + ball.vy * ny;
      let bounceSpeed = Math.max(120, -dot * 0.85);

      // If flipper is swinging upward, add tremendous launch impulse
      if (flipper.isEngaged && Math.abs(flipper.angularVelocity) > 2) {
        bounceSpeed += Math.min(650, Math.abs(flipperVel) * 1.4);
      }

      ball.vx = nx * bounceSpeed + (flipper.side === 'left' ? 40 : -40);
      ball.vy = ny * bounceSpeed;
    }
  }
}

import {
  BallType,
  BasketBall,
  BasketRandomInput,
  BasketRandomState,
  CourtTheme,
  Hoop,
  RagdollPlayer,
} from './types';

export const COURT_WIDTH = 800;
export const COURT_HEIGHT = 480;
export const FLOOR_Y = 410;
export const GRAVITY = 920;
export const TARGET_SCORE = 5;

export const BALL_TYPES: BallType[] = ['basketball', 'watermelon', 'pumpkin', 'egg'];
export const COURT_THEMES: CourtTheme[] = ['barn', 'snow', 'sunset'];

export function createInitialBall(type: BallType = 'basketball'): BasketBall {
  return {
    x: COURT_WIDTH / 2,
    y: 180,
    vx: (Math.random() - 0.5) * 80,
    vy: -120,
    radius: type === 'egg' ? 12 : type === 'watermelon' ? 16 : 14,
    heldBy: null,
    ballType: type,
    rotation: 0,
  };
}

export function createInitialPlayers(): RagdollPlayer[] {
  return [
    // Team 1: Chicks & Dogs
    {
      id: 'p1_guard',
      team: 1,
      role: 'guard',
      x: 220,
      y: FLOOR_Y - 40,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      onGround: true,
      armAngle: 0,
      jumpCooldown: 0,
      bodyColor: '#facc15',
      faceType: 'chick',
    },
    {
      id: 'p1_dunker',
      team: 1,
      role: 'dunker',
      x: 320,
      y: FLOOR_Y - 40,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      onGround: true,
      armAngle: 0,
      jumpCooldown: 0,
      bodyColor: '#f97316',
      faceType: 'dog',
    },
    // Team 2: Pigs & Cows
    {
      id: 'p2_dunker',
      team: 2,
      role: 'dunker',
      x: 480,
      y: FLOOR_Y - 40,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      onGround: true,
      armAngle: 0,
      jumpCooldown: 0,
      bodyColor: '#f472b6',
      faceType: 'pig',
    },
    {
      id: 'p2_guard',
      team: 2,
      role: 'guard',
      x: 580,
      y: FLOOR_Y - 40,
      vx: 0,
      vy: 0,
      angle: 0,
      angularVelocity: 0,
      onGround: true,
      armAngle: 0,
      jumpCooldown: 0,
      bodyColor: '#38bdf8',
      faceType: 'cow',
    },
  ];
}

export function createHoops(): { hoopLeft: Hoop; hoopRight: Hoop } {
  return {
    hoopLeft: {
      team: 1,
      x: 80,
      y: 240,
      rimWidth: 44,
      rimY: 240,
      backboardX: 52,
      backboardTop: 180,
      backboardBottom: 270,
    },
    hoopRight: {
      team: 2,
      x: 720,
      y: 240,
      rimWidth: 44,
      rimY: 240,
      backboardX: 748,
      backboardTop: 180,
      backboardBottom: 270,
    },
  };
}

export function initBasketRandomGame(mode: 'vs_ai' | 'two_player' = 'vs_ai'): BasketRandomState {
  const { hoopLeft, hoopRight } = createHoops();
  const theme = COURT_THEMES[Math.floor(Math.random() * COURT_THEMES.length)];
  const ballType = BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)];

  return {
    players: createInitialPlayers(),
    ball: createInitialBall(ballType),
    hoopLeft,
    hoopRight,
    score: { p1: 0, p2: 0 },
    mode,
    courtTheme: theme,
    status: 'playing',
    scoredBy: null,
    winner: null,
    roundTimer: 0,
    celebrationTimer: 0,
  };
}

export function resetBasketRound(state: BasketRandomState): BasketRandomState {
  const theme = COURT_THEMES[Math.floor(Math.random() * COURT_THEMES.length)];
  const ballType = BALL_TYPES[Math.floor(Math.random() * BALL_TYPES.length)];

  return {
    ...state,
    players: createInitialPlayers(),
    ball: createInitialBall(ballType),
    courtTheme: theme,
    status: 'playing',
    scoredBy: null,
    celebrationTimer: 0,
  };
}

export function stepBasketRandomGame(
  state: BasketRandomState,
  input: BasketRandomInput,
  dt: number
): BasketRandomState {
  const safeDt = Math.min(dt, 0.05);

  if (state.status === 'game_over') {
    return state;
  }

  // 1. Handle Celebration Countdown after a basket
  if (state.status === 'scored') {
    const celebrationTimer = state.celebrationTimer - safeDt;
    if (celebrationTimer <= 0) {
      if (state.score.p1 >= TARGET_SCORE || state.score.p2 >= TARGET_SCORE) {
        return {
          ...state,
          status: 'game_over',
          winner: state.score.p1 >= TARGET_SCORE ? 1 : 2,
        };
      }
      return resetBasketRound(state);
    }
    return { ...state, celebrationTimer };
  }

  // 2. AI Input Generation (If vs_ai mode)
  let p2Jump = Boolean(input.p2Jump);
  if (state.mode === 'vs_ai') {
    const ball = state.ball;
    // AI jumps when ball is near, or randomly to intercept
    const nearestP2 = state.players
      .filter((p) => p.team === 2)
      .sort((a, b) => Math.hypot(a.x - ball.x, a.y - ball.y) - Math.hypot(b.x - ball.x, b.y - ball.y))[0];

    if (nearestP2) {
      const dist = Math.hypot(nearestP2.x - ball.x, nearestP2.y - ball.y);
      if (dist < 140 && Math.random() < 0.08) {
        p2Jump = true;
      }
    }
  }

  const p1Jump = Boolean(input.p1Jump);

  // 3. Update Players
  const players = state.players.map((p) => {
    const pl = { ...p };
    pl.jumpCooldown = Math.max(0, pl.jumpCooldown - safeDt);

    const shouldJump = pl.team === 1 ? p1Jump : p2Jump;

    // Apply Jump Torque and Impulse
    if (shouldJump && pl.onGround && pl.jumpCooldown <= 0) {
      pl.vy = -480 - Math.random() * 80;
      pl.vx += (pl.team === 1 ? 1 : -1) * (140 + Math.random() * 90);
      pl.angularVelocity = (Math.random() - 0.5) * 6;
      pl.armAngle = -Math.PI * 0.45;
      pl.onGround = false;
      pl.jumpCooldown = 0.25;

      // If holding ball, shoot it!
      if (state.ball.heldBy === pl.id) {
        state.ball.heldBy = null;
        const targetHoop = pl.team === 1 ? state.hoopRight : state.hoopLeft;
        const angle = Math.atan2(targetHoop.rimY - pl.y - 60, targetHoop.x - pl.x);
        state.ball.vx = Math.cos(angle) * 440;
        state.ball.vy = Math.sin(angle) * 480 - 120;
      }
    }

    // Apply Gravity & Floor
    pl.vy += GRAVITY * safeDt;
    pl.y += pl.vy * safeDt;
    pl.x += pl.vx * safeDt;

    // Friction & Tilt Restoring Torque
    pl.vx *= 0.94;
    pl.angularVelocity *= 0.92;
    pl.angle += pl.angularVelocity * safeDt;
    pl.angle *= 0.95; // restoring upright bias
    pl.armAngle *= 0.92;

    if (pl.y >= FLOOR_Y - 40) {
      pl.y = FLOOR_Y - 40;
      pl.vy = 0;
      pl.onGround = true;
    }

    // Boundary constraints
    if (pl.x < 70) {
      pl.x = 70;
      pl.vx = Math.abs(pl.vx) * 0.5;
    }
    if (pl.x > COURT_WIDTH - 70) {
      pl.x = COURT_WIDTH - 70;
      pl.vx = -Math.abs(pl.vx) * 0.5;
    }

    return pl;
  });

  // 4. Update Ball
  const ball: BasketBall = { ...state.ball };

  if (ball.heldBy) {
    const holder = players.find((p) => p.id === ball.heldBy);
    if (holder) {
      const armCos = Math.cos(holder.angle);
      const armSin = Math.sin(holder.angle);
      ball.x = holder.x + (holder.team === 1 ? 20 : -20) * armCos;
      ball.y = holder.y - 20 + armSin * 10;
      ball.vx = holder.vx;
      ball.vy = holder.vy;
    } else {
      ball.heldBy = null;
    }
  } else {
    // Free flying ball
    ball.vy += GRAVITY * 0.85 * safeDt;
    ball.x += ball.vx * safeDt;
    ball.y += ball.vy * safeDt;
    ball.rotation += (ball.vx / ball.radius) * safeDt;

    // Floor bounce
    if (ball.y >= FLOOR_Y - ball.radius) {
      ball.y = FLOOR_Y - ball.radius;
      ball.vy = -ball.vy * 0.72;
      ball.vx *= 0.92;
    }

    // Wall bounce
    if (ball.x <= 40 + ball.radius) {
      ball.x = 40 + ball.radius;
      ball.vx = Math.abs(ball.vx) * 0.7;
    }
    if (ball.x >= COURT_WIDTH - 40 - ball.radius) {
      ball.x = COURT_WIDTH - 40 - ball.radius;
      ball.vx = -Math.abs(ball.vx) * 0.7;
    }

    // Backboards collision
    // Left backboard: x in [48, 56], y in [180, 270]
    if (
      ball.x >= 46 &&
      ball.x <= 58 &&
      ball.y >= state.hoopLeft.backboardTop &&
      ball.y <= state.hoopLeft.backboardBottom
    ) {
      ball.x = 60;
      ball.vx = Math.abs(ball.vx) * 0.8 + 80;
    }

    // Right backboard: x in [744, 752], y in [180, 270]
    if (
      ball.x >= 742 &&
      ball.x <= 754 &&
      ball.y >= state.hoopRight.backboardTop &&
      ball.y <= state.hoopRight.backboardBottom
    ) {
      ball.x = 740;
      ball.vx = -Math.abs(ball.vx) * 0.8 - 80;
    }

    // Player Steal / Catch
    for (const p of players) {
      const dist = Math.hypot(p.x - ball.x, p.y - 20 - ball.y);
      if (dist < 34 && Math.abs(ball.vy) < 550) {
        ball.heldBy = p.id;
        break;
      }
    }
  }

  // 5. Hoop Scoring Detection
  let score = { ...state.score };
  let scoredBy: 1 | 2 | null = null;
  let status: BasketRandomState['status'] = state.status;
  let celebrationTimer = state.celebrationTimer;

  // Check Right Hoop (Team 1 scores!)
  if (
    ball.vy > 0 &&
    ball.x >= state.hoopRight.x - 22 &&
    ball.x <= state.hoopRight.x + 22 &&
    ball.y >= state.hoopRight.rimY - 8 &&
    ball.y <= state.hoopRight.rimY + 16
  ) {
    score.p1 += 1;
    scoredBy = 1;
    status = 'scored';
    celebrationTimer = 1.6;
    ball.vy = 120;
    ball.heldBy = null;
  }

  // Check Left Hoop (Team 2 scores!)
  if (
    ball.vy > 0 &&
    ball.x >= state.hoopLeft.x - 22 &&
    ball.x <= state.hoopLeft.x + 22 &&
    ball.y >= state.hoopLeft.rimY - 8 &&
    ball.y <= state.hoopLeft.rimY + 16
  ) {
    score.p2 += 1;
    scoredBy = 2;
    status = 'scored';
    celebrationTimer = 1.6;
    ball.vy = 120;
    ball.heldBy = null;
  }

  return {
    ...state,
    players,
    ball,
    score,
    status,
    scoredBy,
    celebrationTimer,
    roundTimer: state.roundTimer + safeDt,
  };
}

import {
  Ball,
  BarnyardBrickBreakerState,
  Brick,
  BrickBreakerEvent,
  FallingPowerUp,
  Paddle,
  PowerUpType,
  StageConfig,
} from './types';

export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 500;
export const PADDLE_DEFAULT_WIDTH = 80;
export const PADDLE_WIDE_WIDTH = 120;
export const PADDLE_HEIGHT = 14;
export const PADDLE_Y = 460;
export const BALL_RADIUS = 7;
export const BASE_BALL_SPEED = 280;

export const STAGES: StageConfig[] = [
  {
    id: 1,
    name: 'Apple Orchard Crates',
    subtitle: 'Harvest the wooden fruit crates!',
    brickRows: [
      'WWWWWW',
      'WWGWWG',
      'WWWWWW',
      ' W  W ',
    ],
  },
  {
    id: 2,
    name: 'Red Barn Gable',
    subtitle: 'Break through stone foundations!',
    brickRows: [
      ' WGGW ',
      'WWSSWW',
      'SSSSSS',
      'WW  WW',
    ],
  },
  {
    id: 3,
    name: 'Windmill Rotor',
    subtitle: 'Dodge stone blades and grab honey!',
    brickRows: [
      'S W W S',
      ' GSSG ',
      'WWGGWW',
      'S WW S',
    ],
  },
  {
    id: 4,
    name: 'Grand Harvest Silo',
    subtitle: 'The ultimate agricultural brick peak!',
    brickRows: [
      'GGGGGG',
      'SSSSSS',
      'WWSSWW',
      'SWGWSW',
      ' S  S ',
    ],
  },
];

export function createBricksForStage(stageIndex: number): Brick[] {
  const safeStage = Math.max(0, Math.min(stageIndex, STAGES.length - 1));
  const config = STAGES[safeStage]!;
  const bricks: Brick[] = [];
  let brickId = 1;

  const rows = config.brickRows;
  const numRows = rows.length;
  const startY = 70;
  const brickHeight = 18;
  const gap = 4;

  for (let r = 0; r < numRows; r++) {
    const rowStr = rows[r]!;
    const numCols = rowStr.length;
    const totalRowWidth = numCols * 48 + (numCols - 1) * gap;
    const startX = (GAME_WIDTH - totalRowWidth) / 2;

    for (let c = 0; c < numCols; c++) {
      const char = rowStr[c];
      if (!char || char === ' ') continue;

      const x = startX + c * (48 + gap) + 24; // center X
      const y = startY + r * (brickHeight + gap) + 9; // center Y

      if (char === 'W') {
        // Wood Crate: 1 hit, 10 pts
        bricks.push({
          id: brickId++,
          x,
          y,
          width: 48,
          height: brickHeight,
          type: 'wood_crate',
          hitsLeft: 1,
          maxHits: 1,
          color: '#d97706',
        });
      } else if (char === 'S') {
        // Stone Brick: 2 hits, 25 pts
        bricks.push({
          id: brickId++,
          x,
          y,
          width: 48,
          height: brickHeight,
          type: 'stone_brick',
          hitsLeft: 2,
          maxHits: 2,
          color: '#64748b',
        });
      } else if (char === 'G') {
        // Golden Honeycomb: 1 hit, 50 pts, guaranteed power-up
        bricks.push({
          id: brickId++,
          x,
          y,
          width: 48,
          height: brickHeight,
          type: 'golden_honey',
          hitsLeft: 1,
          maxHits: 1,
          color: '#eab308',
        });
      }
    }
  }

  return bricks;
}

export function createInitialBall(paddle: Paddle, id = 1): Ball {
  return {
    id,
    x: paddle.x,
    y: paddle.y - PADDLE_HEIGHT / 2 - BALL_RADIUS - 1,
    vx: 0,
    vy: 0,
    radius: BALL_RADIUS,
    speed: BASE_BALL_SPEED,
    stuckToPaddle: true,
    isFireball: false,
  };
}

export function createInitialState(stageIndex = 0): BarnyardBrickBreakerState {
  const paddle: Paddle = {
    x: GAME_WIDTH / 2,
    y: PADDLE_Y,
    width: PADDLE_DEFAULT_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 400,
    wideTimer: 0,
    fireballTimer: 0,
  };

  const ball = createInitialBall(paddle);
  const bricks = createBricksForStage(stageIndex);

  let highScore = 0;
  if (typeof localStorage !== 'undefined') {
    try {
      highScore = parseInt(localStorage.getItem('pawcade_brick_breaker_highscore') || '0', 10) || 0;
    } catch {
      highScore = 0;
    }
  }

  return {
    currentStageIndex: stageIndex,
    score: 0,
    highScore,
    lives: 3,
    combo: 0,
    balls: [ball],
    paddle,
    bricks,
    powerUps: [],
    stageComplete: false,
    gameOver: false,
    gameComplete: false,
    lastEvents: [],
  };
}

export function launchBall(state: BarnyardBrickBreakerState): BarnyardBrickBreakerState {
  if (state.gameOver || state.stageComplete) return state;

  const nextBalls = state.balls.map((b) => {
    if (!b.stuckToPaddle) return b;
    // Launch slightly randomized upwards
    const angle = -Math.PI / 2 + (Math.random() * 0.4 - 0.2);
    return {
      ...b,
      stuckToPaddle: false,
      vx: b.speed * Math.cos(angle),
      vy: b.speed * Math.sin(angle),
    };
  });

  return {
    ...state,
    balls: nextBalls,
  };
}

export function updateEngine(
  state: BarnyardBrickBreakerState,
  dt: number,
  targetPaddleX: number
): BarnyardBrickBreakerState {
  if (state.gameOver || state.stageComplete || state.gameComplete) {
    return { ...state, lastEvents: [] };
  }

  const events: BrickBreakerEvent[] = [];
  const clampedDt = Math.min(0.04, Math.max(0.001, dt));

  // 1. Update Paddle Position & Timers
  const clampedPaddleX = Math.max(
    state.paddle.width / 2,
    Math.min(GAME_WIDTH - state.paddle.width / 2, targetPaddleX)
  );

  let nextWideTimer = Math.max(0, state.paddle.wideTimer - clampedDt);
  let nextFireballTimer = Math.max(0, state.paddle.fireballTimer - clampedDt);
  let nextPaddleWidth = nextWideTimer > 0 ? PADDLE_WIDE_WIDTH : PADDLE_DEFAULT_WIDTH;

  const nextPaddle: Paddle = {
    ...state.paddle,
    x: clampedPaddleX,
    width: nextPaddleWidth,
    wideTimer: nextWideTimer,
    fireballTimer: nextFireballTimer,
  };

  // 2. Update Power-Ups Fall & Catch
  let nextScore = state.score;
  let nextLives = state.lives;
  const remainingPowerUps: FallingPowerUp[] = [];
  let spawnedBalls: Ball[] = [];

  for (const pu of state.powerUps) {
    const nextY = pu.y + pu.vy * clampedDt;

    // Check collision with paddle
    const halfW = nextPaddle.width / 2 + 10;
    const halfH = nextPaddle.height / 2 + 8;
    const hitPaddle =
      Math.abs(pu.x - nextPaddle.x) <= halfW &&
      Math.abs(nextY - nextPaddle.y) <= halfH;

    if (hitPaddle) {
      events.push({ type: 'collect_powerup', powerUpType: pu.type, x: pu.x, y: pu.y });
      nextScore += 100;

      if (pu.type === 'multiball') {
        const baseBall = state.balls[0] || createInitialBall(nextPaddle);
        spawnedBalls.push(
          {
            id: Date.now() + 1,
            x: baseBall.x,
            y: baseBall.y,
            vx: baseBall.speed * Math.cos(-Math.PI / 3),
            vy: baseBall.speed * Math.sin(-Math.PI / 3),
            radius: BALL_RADIUS,
            speed: baseBall.speed,
            stuckToPaddle: false,
            isFireball: nextFireballTimer > 0,
          },
          {
            id: Date.now() + 2,
            x: baseBall.x,
            y: baseBall.y,
            vx: baseBall.speed * Math.cos(-2 * Math.PI / 3),
            vy: baseBall.speed * Math.sin(-2 * Math.PI / 3),
            radius: BALL_RADIUS,
            speed: baseBall.speed,
            stuckToPaddle: false,
            isFireball: nextFireballTimer > 0,
          }
        );
      } else if (pu.type === 'wide_paddle') {
        nextWideTimer = 10; // 10s wide paddle
        nextPaddle.width = PADDLE_WIDE_WIDTH;
        nextPaddle.wideTimer = nextWideTimer;
      } else if (pu.type === 'fireball') {
        nextFireballTimer = 8; // 8s fireball
        nextPaddle.fireballTimer = nextFireballTimer;
      } else if (pu.type === 'extra_life') {
        nextLives = Math.min(5, nextLives + 1);
      }
    } else if (nextY < GAME_HEIGHT + 20) {
      remainingPowerUps.push({ ...pu, y: nextY });
    }
  }

  // 3. Update Bricks & Collisions with Balls
  let currentBricks = [...state.bricks];
  let nextCombo = state.combo;
  const nextPowerUps = [...remainingPowerUps];

  const updatedBalls: Ball[] = [];

  for (const ball of [...state.balls, ...spawnedBalls]) {
    if (ball.stuckToPaddle) {
      updatedBalls.push({
        ...ball,
        x: nextPaddle.x,
        y: nextPaddle.y - nextPaddle.height / 2 - ball.radius - 1,
      });
      continue;
    }

    let bx = ball.x + ball.vx * clampedDt;
    let by = ball.y + ball.vy * clampedDt;
    let bvx = ball.vx;
    let bvy = ball.vy;
    const isFireball = nextFireballTimer > 0;

    // Bounce off left & right walls
    if (bx - ball.radius <= 0) {
      bx = ball.radius;
      bvx = Math.abs(bvx);
      events.push({ type: 'bounce_wall', x: bx, y: by });
    } else if (bx + ball.radius >= GAME_WIDTH) {
      bx = GAME_WIDTH - ball.radius;
      bvx = -Math.abs(bvx);
      events.push({ type: 'bounce_wall', x: bx, y: by });
    }

    // Bounce off top wall
    if (by - ball.radius <= 0) {
      by = ball.radius;
      bvy = Math.abs(bvy);
      events.push({ type: 'bounce_wall', x: bx, y: by });
    }

    // Collision with Paddle
    const paddleTop = nextPaddle.y - nextPaddle.height / 2;
    const paddleBottom = nextPaddle.y + nextPaddle.height / 2;
    const paddleLeft = nextPaddle.x - nextPaddle.width / 2;
    const paddleRight = nextPaddle.x + nextPaddle.width / 2;

    if (
      by + ball.radius >= paddleTop &&
      by - ball.radius <= paddleBottom &&
      bx >= paddleLeft - 4 &&
      bx <= paddleRight + 4 &&
      bvy > 0
    ) {
      // Deflect based on hit location relative to paddle center
      const hitOffset = (bx - nextPaddle.x) / (nextPaddle.width / 2);
      const clampedOffset = Math.max(-0.95, Math.min(0.95, hitOffset));
      const bounceAngle = clampedOffset * (Math.PI * 0.38) - Math.PI / 2;

      bvx = ball.speed * Math.cos(bounceAngle);
      bvy = ball.speed * Math.sin(bounceAngle);
      by = paddleTop - ball.radius - 1;
      nextCombo = 0; // Reset combo when ball touches paddle
      events.push({ type: 'bounce_paddle', x: bx, y: by });
    }

    // Collision with Bricks
    for (let i = 0; i < currentBricks.length; i++) {
      const br = currentBricks[i]!;
      const halfW = br.width / 2;
      const halfH = br.height / 2;

      // Find closest point on AABB to circle
      const closestX = Math.max(br.x - halfW, Math.min(bx, br.x + halfW));
      const closestY = Math.max(br.y - halfH, Math.min(by, br.y + halfH));

      const distX = bx - closestX;
      const distY = by - closestY;
      const distSq = distX * distX + distY * distY;

      if (distSq <= ball.radius * ball.radius) {
        // Hit detected!
        events.push({ type: 'hit_brick', x: closestX, y: closestY, brickType: br.type });

        if (!isFireball) {
          // Normal bounce: determine collision normal by penetration depth
          const overlapX = ball.radius - Math.abs(distX);
          const overlapY = ball.radius - Math.abs(distY);

          if (overlapX < overlapY) {
            bvx = -bvx;
          } else {
            bvy = -bvy;
          }
        }

        const hitsRemaining = br.hitsLeft - 1;
        if (hitsRemaining <= 0) {
          // Brick destroyed!
          events.push({ type: 'brick_destroyed', x: br.x, y: br.y, brickType: br.type });
          nextCombo++;
          const brickBasePoints = br.type === 'golden_honey' ? 50 : br.type === 'stone_brick' ? 25 : 10;
          nextScore += brickBasePoints + nextCombo * 5;

          // Power-up drop chance
          const shouldDropPowerUp =
            br.type === 'golden_honey' || Math.random() < 0.22;

          if (shouldDropPowerUp) {
            const types: PowerUpType[] = ['multiball', 'wide_paddle', 'fireball', 'extra_life'];
            const chosenType =
              br.type === 'golden_honey'
                ? types[Math.floor(Math.random() * (types.length - 1))]! // multiball, wide, or fireball
                : types[Math.floor(Math.random() * types.length)]!;

            nextPowerUps.push({
              id: Date.now() + Math.random(),
              x: br.x,
              y: br.y,
              vy: 140, // drops smoothly
              type: chosenType,
            });
          }

          // Remove brick
          currentBricks.splice(i, 1);
          i--;
        } else {
          // Damaged stone brick
          currentBricks[i] = {
            ...br,
            hitsLeft: hitsRemaining,
            color: '#475569', // darker cracked stone
          };
        }

        if (!isFireball) {
          break; // only hit 1 brick per frame if not fireball
        }
      }
    }

    // Check if ball fell below floor
    if (by > GAME_HEIGHT + 20) {
      events.push({ type: 'ball_lost', x: bx, y: by });
      continue; // drop ball
    }

    updatedBalls.push({
      ...ball,
      x: bx,
      y: by,
      vx: bvx,
      vy: bvy,
      isFireball,
    });
  }

  // 4. Check Ball Drain & Lives
  let nextGameOver: boolean = state.gameOver;
  let finalBalls = updatedBalls;

  if (finalBalls.length === 0) {
    nextLives--;
    if (nextLives <= 0) {
      nextGameOver = true;
      events.push({ type: 'game_over' });
    } else {
      // Respawn 1 ball on paddle
      finalBalls = [createInitialBall(nextPaddle)];
    }
  }

  // 5. Check Stage Clear
  const isStageClear = currentBricks.length === 0 && !nextGameOver;
  if (isStageClear && !state.stageComplete) {
    events.push({ type: 'stage_clear' });
    nextScore += 500; // Stage clear bonus
  }

  // Update High Score
  let nextHighScore = Math.max(state.highScore, nextScore);
  if (nextScore > state.highScore && typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem('pawcade_brick_breaker_highscore', String(nextHighScore));
    } catch {
      // Ignore storage errors
    }
  }

  return {
    ...state,
    paddle: nextPaddle,
    balls: finalBalls,
    bricks: currentBricks,
    powerUps: nextPowerUps,
    score: nextScore,
    highScore: nextHighScore,
    lives: Math.max(0, nextLives),
    combo: nextCombo,
    stageComplete: isStageClear,
    gameOver: nextGameOver,
    lastEvents: events,
  };
}

export function nextStage(state: BarnyardBrickBreakerState): BarnyardBrickBreakerState {
  const nextIdx = state.currentStageIndex + 1;
  if (nextIdx >= STAGES.length) {
    return {
      ...state,
      gameComplete: true,
      stageComplete: true,
    };
  }

  const paddle: Paddle = {
    ...state.paddle,
    x: GAME_WIDTH / 2,
    wideTimer: 0,
    fireballTimer: 0,
    width: PADDLE_DEFAULT_WIDTH,
  };

  const ball = createInitialBall(paddle);
  const bricks = createBricksForStage(nextIdx);

  return {
    ...state,
    currentStageIndex: nextIdx,
    paddle,
    balls: [ball],
    bricks,
    powerUps: [],
    stageComplete: false,
    combo: 0,
    lastEvents: [],
  };
}

export function restartGame(state: BarnyardBrickBreakerState): BarnyardBrickBreakerState {
  const paddle: Paddle = {
    x: GAME_WIDTH / 2,
    y: PADDLE_Y,
    width: PADDLE_DEFAULT_WIDTH,
    height: PADDLE_HEIGHT,
    speed: 400,
    wideTimer: 0,
    fireballTimer: 0,
  };

  const ball = createInitialBall(paddle);
  const bricks = createBricksForStage(state.currentStageIndex);

  return {
    ...state,
    score: 0,
    lives: 3,
    combo: 0,
    balls: [ball],
    paddle,
    bricks,
    powerUps: [],
    stageComplete: false,
    gameOver: false,
    gameComplete: false,
    lastEvents: [],
  };
}

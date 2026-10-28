import {
  PegType,
  Peg,
  BouncingBall,
  CatchBasket,
  PegSparkle,
  PegFloatingText,
  PegPopState,
  PegPopEvent,
} from './types';

export const PEG_CONFIGS: Record<PegType, { radius: number; points: number; color: string; label: string }> = {
  blue: { radius: 11, points: 100, color: '#38bdf8', label: 'Blue Acorn Peg' },
  orange: { radius: 12, points: 250, color: '#f97316', label: 'Orange Target Peg' },
  purple: { radius: 12, points: 500, color: '#a855f7', label: 'Purple Bonus Peg' },
  green: { radius: 13, points: 300, color: '#22c55e', label: 'Green Magic Peg' },
};

export const GRAVITY = 750; // px/s^2
export const BALL_SPEED = 620; // px/s
export const RESTITUTION = 0.82;

// Generate handcrafted layouts for 4 stages
export function generateStagePegs(stage: number, width = 480, height = 640): Peg[] {
  const pegs: Peg[] = [];
  const rows = stage === 1 ? 5 : stage === 2 ? 6 : stage === 3 ? 7 : 8;
  const cols = 8;
  const startY = 130;
  const rowSpacing = (height * 0.58) / rows;
  const colSpacing = (width - 100) / (cols - 1);

  let idCounter = 1;

  for (let r = 0; r < rows; r++) {
    const isStaggered = r % 2 === 1;
    const currentCols = isStaggered ? cols - 1 : cols;
    const offsetX = isStaggered ? 50 + colSpacing * 0.5 : 50;

    for (let c = 0; c < currentCols; c++) {
      const px = offsetX + c * colSpacing;
      const py = startY + r * rowSpacing;

      // Assign peg type:
      // ~30% Orange (targets), ~5% Purple, ~5% Green, remainder Blue
      const rand = Math.sin(r * 11 + c * 17 + stage * 23) * 10000;
      const frac = rand - Math.floor(rand);

      let type: PegType = 'blue';
      if (frac < 0.32) {
        type = 'orange';
      } else if (frac < 0.37) {
        type = 'purple';
      } else if (frac < 0.42) {
        type = 'green';
      }

      const cfg = PEG_CONFIGS[type];
      pegs.push({
        id: `peg_${stage}_${idCounter++}`,
        x: px,
        y: py,
        radius: cfg.radius,
        type,
        isHit: false,
        fadeAlpha: 1.0,
        points: cfg.points,
      });
    }
  }

  // Ensure at least 6 orange target pegs exist
  const orangeCount = pegs.filter((p) => p.type === 'orange').length;
  if (orangeCount < 6) {
    for (let i = 0; i < pegs.length && pegs.filter((p) => p.type === 'orange').length < 6; i++) {
      if (pegs[i]!.type === 'blue') {
        pegs[i]!.type = 'orange';
        pegs[i]!.radius = PEG_CONFIGS.orange.radius;
        pegs[i]!.points = PEG_CONFIGS.orange.points;
      }
    }
  }

  return pegs;
}

export function initPegPop(stage = 1, width = 480, height = 640): PegPopState {
  const currentStage = Math.max(1, Math.min(4, stage));
  const pegs = generateStagePegs(currentStage, width, height);
  const orangeCount = pegs.filter((p) => p.type === 'orange').length;

  return {
    status: 'aiming',
    stage: currentStage,
    score: 0,
    highScore: 0,
    ballsLeft: 10,
    aimAngle: Math.PI / 2, // Aim straight down
    cannonX: width / 2,
    cannonY: 45,
    pegs,
    ball: null,
    basket: {
      x: width / 2,
      y: height - 42,
      width: 96,
      height: 24,
      vx: 130,
      minX: 55,
      maxX: width - 55,
    },
    sparkles: [],
    floatingTexts: [],
    pegsHitInShot: 0,
    orangePegsRemaining: orangeCount,
    totalOrangePegs: orangeCount,
    isFeverActive: false,
    width,
    height,
  };
}

export function setCannonAngle(state: PegPopState, angle: number): PegPopState {
  // Clamp aim angle between ~15 degrees and ~165 degrees (downward cone)
  const minAngle = 0.25;
  const maxAngle = Math.PI - 0.25;
  const clamped = Math.max(minAngle, Math.min(maxAngle, angle));

  return {
    ...state,
    aimAngle: clamped,
  };
}

export function fireBall(state: PegPopState): { state: PegPopState; success: boolean } {
  if (state.status !== 'aiming' || state.ballsLeft <= 0 || state.ball !== null) {
    return { state, success: false };
  }

  const vx = Math.cos(state.aimAngle) * BALL_SPEED;
  const vy = Math.sin(state.aimAngle) * BALL_SPEED;

  const newBall: BouncingBall = {
    id: `ball_${Date.now()}`,
    x: state.cannonX + Math.cos(state.aimAngle) * 32,
    y: state.cannonY + Math.sin(state.aimAngle) * 32,
    vx,
    vy,
    radius: 9,
    isStuck: false,
  };

  return {
    state: {
      ...state,
      status: 'ball_active',
      ballsLeft: state.ballsLeft - 1,
      ball: newBall,
      pegsHitInShot: 0,
    },
    success: true,
  };
}

export function updatePegPop(
  state: PegPopState,
  dt: number
): { state: PegPopState; events: PegPopEvent[] } {
  const events: PegPopEvent[] = [];

  // 1. Move Basket back and forth
  let basketX = state.basket.x + state.basket.vx * dt;
  let basketVx = state.basket.vx;

  if (basketX <= state.basket.minX) {
    basketX = state.basket.minX;
    basketVx = Math.abs(basketVx);
  } else if (basketX >= state.basket.maxX) {
    basketX = state.basket.maxX;
    basketVx = -Math.abs(basketVx);
  }

  const updatedBasket: CatchBasket = {
    ...state.basket,
    x: basketX,
    vx: basketVx,
  };

  // 2. Update Ball physics if active
  let ball = state.ball;
  let score = state.score;
  let pegsHitInShot = state.pegsHitInShot;
  let orangeRemaining = state.orangePegsRemaining;
  let ballsLeft = state.ballsLeft;
  let status = state.status;
  let isFeverActive = state.isFeverActive;

  const newSparkles: PegSparkle[] = [];
  const newTexts: PegFloatingText[] = [];
  const updatedPegs = state.pegs.map((p) => ({ ...p }));

  if (ball && status === 'ball_active') {
    // Sub-step ball physics (3 sub-steps for tunnel-free collision detection)
    const subSteps = 3;
    const subDt = dt / subSteps;

    for (let s = 0; s < subSteps; s++) {
      ball.vy += GRAVITY * subDt;
      ball.x += ball.vx * subDt;
      ball.y += ball.vy * subDt;

      // Bounce off walls
      if (ball.x - ball.radius <= 14) {
        ball.x = 14 + ball.radius;
        ball.vx = Math.abs(ball.vx) * RESTITUTION;
      } else if (ball.x + ball.radius >= state.width - 14) {
        ball.x = state.width - 14 - ball.radius;
        ball.vx = -Math.abs(ball.vx) * RESTITUTION;
      }

      // Check collision with pegs
      for (let i = 0; i < updatedPegs.length; i++) {
        const peg = updatedPegs[i]!;
        if (peg.fadeAlpha <= 0) continue;

        const dx = ball.x - peg.x;
        const dy = ball.y - peg.y;
        const distSq = dx * dx + dy * dy;
        const minDist = ball.radius + peg.radius;

        if (distSq <= minDist * minDist) {
          const dist = Math.sqrt(distSq) || 0.001;
          const nx = dx / dist;
          const ny = dy / dist;

          // Push ball outside peg
          ball.x = peg.x + nx * (minDist + 1);
          ball.y = peg.y + ny * (minDist + 1);

          // Bounce velocity reflection
          const dot = ball.vx * nx + ball.vy * ny;
          ball.vx = (ball.vx - 2 * dot * nx) * RESTITUTION;
          ball.vy = (ball.vy - 2 * dot * ny) * RESTITUTION;

          // If green magic peg hit, add super upward launch boost!
          if (peg.type === 'green') {
            ball.vy = -Math.abs(ball.vy) * 1.25 - 180;
          }

          if (!peg.isHit) {
            peg.isHit = true;
            pegsHitInShot++;

            let pointsAwarded = peg.points;
            if (pegsHitInShot > 1) {
              pointsAwarded = Math.floor(pointsAwarded * (1 + (pegsHitInShot - 1) * 0.25));
            }
            score += pointsAwarded;

            if (peg.type === 'orange') {
              orangeRemaining = Math.max(0, orangeRemaining - 1);
              if (orangeRemaining === 0 && !isFeverActive) {
                isFeverActive = true;
                events.push({ type: 'fever_started' });
                newTexts.push({
                  id: `fever_${Date.now()}`,
                  x: state.width / 2,
                  y: state.height / 2 - 40,
                  text: 'EXTREME FEVER! 🌟🌈',
                  color: '#facc15',
                  alpha: 1.0,
                  vy: -40,
                });
              }
            }

            events.push({
              type: 'peg_hit',
              pegType: peg.type,
              pointsEarned: pointsAwarded,
              pegsHitCount: pegsHitInShot,
              x: peg.x,
              y: peg.y,
            });

            // Sparkles
            for (let sp = 0; sp < 10; sp++) {
              const ang = Math.random() * Math.PI * 2;
              const spd = 60 + Math.random() * 120;
              newSparkles.push({
                id: `sp_${Date.now()}_${Math.random()}`,
                x: peg.x,
                y: peg.y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                radius: 2 + Math.random() * 3,
                color: PEG_CONFIGS[peg.type].color,
                alpha: 1.0,
                life: 0,
                maxLife: 0.4 + Math.random() * 0.3,
              });
            }

            newTexts.push({
              id: `txt_${Date.now()}_${i}`,
              x: peg.x,
              y: peg.y - 12,
              text: `+${pointsAwarded}`,
              color: PEG_CONFIGS[peg.type].color,
              alpha: 1.0,
              vy: -40,
            });
          }
        }
      }

      // Check Catch Basket intersection
      const inBasketX =
        ball.x >= updatedBasket.x - updatedBasket.width / 2 &&
        ball.x <= updatedBasket.x + updatedBasket.width / 2;
      const inBasketY =
        ball.y + ball.radius >= updatedBasket.y &&
        ball.y - ball.radius <= updatedBasket.y + updatedBasket.height;

      if (inBasketX && inBasketY && ball.vy > 0) {
        // Free ball awarded!
        ballsLeft++;
        events.push({
          type: 'basket_catch',
          x: updatedBasket.x,
          y: updatedBasket.y,
        });

        newTexts.push({
          id: `catch_${Date.now()}`,
          x: updatedBasket.x,
          y: updatedBasket.y - 20,
          text: 'FREE BALL! +1 🌰',
          color: '#4ade80',
          alpha: 1.0,
          vy: -50,
        });

        // Clear ball from play
        ball = null;
        break;
      }
    }

    // Ball fell below screen
    if (ball && ball.y > state.height + 25) {
      events.push({ type: 'ball_lost' });
      ball = null;
    }

    // Shot has completed if ball is no longer active
    if (!ball) {
      // Remove all hit pegs
      for (let i = 0; i < updatedPegs.length; i++) {
        if (updatedPegs[i]!.isHit) {
          updatedPegs[i]!.fadeAlpha = 0;
        }
      }

      // Evaluate Win / Loss / Next shot
      if (orangeRemaining === 0) {
        if (state.stage < 4) {
          status = 'stage_cleared';
          events.push({ type: 'stage_clear' });
        } else {
          status = 'victory';
          events.push({ type: 'stage_clear' });
        }
      } else if (ballsLeft <= 0) {
        status = 'game_over';
        events.push({ type: 'game_over' });
      } else {
        status = 'aiming';
      }
    }
  }

  // 3. Update Sparkles
  const remainingSparkles: PegSparkle[] = [];
  for (let i = 0; i < state.sparkles.length; i++) {
    const sp = state.sparkles[i]!;
    const nextLife = sp.life + dt;
    if (nextLife < sp.maxLife) {
      remainingSparkles.push({
        ...sp,
        x: sp.x + sp.vx * dt,
        y: sp.y + sp.vy * dt,
        life: nextLife,
        alpha: 1 - nextLife / sp.maxLife,
      });
    }
  }

  // 4. Update Floating Texts
  const remainingTexts: PegFloatingText[] = [];
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

  return {
    state: {
      ...state,
      status,
      score,
      highScore: Math.max(state.highScore, score),
      ballsLeft,
      ball,
      basket: updatedBasket,
      pegs: updatedPegs,
      sparkles: [...remainingSparkles, ...newSparkles],
      floatingTexts: [...remainingTexts, ...newTexts],
      pegsHitInShot,
      orangePegsRemaining: orangeRemaining,
      isFeverActive,
    },
    events,
  };
}

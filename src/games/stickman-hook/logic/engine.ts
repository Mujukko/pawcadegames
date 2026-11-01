import { HookPeg, StickmanHookState, StickmanPlayer, Trampoline } from './types';

export const GRAVITY = 750;
export const TOTAL_HOOK_LEVELS = 4;
export const MAX_HOOK_RANGE = 280;

export function getHookLevelConfig(levelIndex: number): {
  playerStart: { x: number; y: number; vx: number; vy: number };
  pegs: HookPeg[];
  trampolines: Trampoline[];
  finishLineX: number;
} {
  switch (levelIndex) {
    case 1:
      return {
        playerStart: { x: 60, y: 220, vx: 220, vy: -100 },
        pegs: [
          { id: 'p1', x: 220, y: 140, radius: 10 },
          { id: 'p2', x: 440, y: 130, radius: 10 },
          { id: 'p3', x: 660, y: 140, radius: 10 },
          { id: 'p4', x: 880, y: 120, radius: 10 },
        ],
        trampolines: [
          { id: 't1', x: 330, y: 410, width: 90, height: 22, bouncePower: 680 },
          { id: 't2', x: 770, y: 410, width: 90, height: 22, bouncePower: 680 },
        ],
        finishLineX: 1050,
      };

    case 2:
      return {
        playerStart: { x: 60, y: 200, vx: 240, vy: -120 },
        pegs: [
          { id: 'p1', x: 200, y: 120, radius: 10 },
          { id: 'p2', x: 420, y: 100, radius: 10 },
          { id: 'p3', x: 640, y: 140, radius: 10 },
          { id: 'p4', x: 860, y: 110, radius: 10 },
          { id: 'p5', x: 1080, y: 130, radius: 10 },
        ],
        trampolines: [
          { id: 't1', x: 310, y: 420, width: 80, height: 22, bouncePower: 700 },
          { id: 't2', x: 530, y: 420, width: 80, height: 22, bouncePower: 700 },
          { id: 't3', x: 970, y: 420, width: 80, height: 22, bouncePower: 700 },
        ],
        finishLineX: 1260,
      };

    case 3:
      return {
        playerStart: { x: 60, y: 200, vx: 250, vy: -140 },
        pegs: [
          { id: 'p1', x: 220, y: 150, radius: 10 },
          { id: 'p2', x: 400, y: 90, radius: 10 },
          { id: 'p3', x: 600, y: 130, radius: 10 },
          { id: 'p4', x: 800, y: 80, radius: 10 },
          { id: 'p5', x: 1020, y: 140, radius: 10 },
          { id: 'p6', x: 1240, y: 100, radius: 10 },
        ],
        trampolines: [
          { id: 't1', x: 500, y: 420, width: 70, height: 22, bouncePower: 720 },
          { id: 't2', x: 910, y: 420, width: 70, height: 22, bouncePower: 720 },
          { id: 't3', x: 1130, y: 420, width: 70, height: 22, bouncePower: 720 },
        ],
        finishLineX: 1420,
      };

    case 4:
    default:
      return {
        playerStart: { x: 60, y: 200, vx: 260, vy: -150 },
        pegs: [
          { id: 'p1', x: 200, y: 140, radius: 10 },
          { id: 'p2', x: 420, y: 80, radius: 10 },
          { id: 'p3', x: 640, y: 150, radius: 10 },
          { id: 'p4', x: 860, y: 90, radius: 10 },
          { id: 'p5', x: 1080, y: 120, radius: 10 },
          { id: 'p6', x: 1300, y: 80, radius: 10 },
          { id: 'p7', x: 1520, y: 130, radius: 10 },
        ],
        trampolines: [
          { id: 't1', x: 310, y: 420, width: 75, height: 22, bouncePower: 740 },
          { id: 't2', x: 750, y: 420, width: 75, height: 22, bouncePower: 740 },
          { id: 't3', x: 1190, y: 420, width: 75, height: 22, bouncePower: 740 },
          { id: 't4', x: 1410, y: 420, width: 75, height: 22, bouncePower: 740 },
        ],
        finishLineX: 1700,
      };
  }
}

export function initStickmanHookGame(levelIndex: number = 1): StickmanHookState {
  const safeLvl = Math.max(1, Math.min(TOTAL_HOOK_LEVELS, levelIndex));
  const cfg = getHookLevelConfig(safeLvl);

  const player: StickmanPlayer = {
    x: cfg.playerStart.x,
    y: cfg.playerStart.y,
    vx: cfg.playerStart.vx,
    vy: cfg.playerStart.vy,
    radius: 14,
    attachedPegId: null,
    ropeLength: 0,
    angle: 0,
    angularVelocity: 0,
    rotation: 0,
    alive: true,
    reachedFinish: false,
  };

  return {
    levelIndex: safeLvl,
    player,
    pegs: cfg.pegs,
    trampolines: cfg.trampolines,
    finishLineX: cfg.finishLineX,
    status: 'playing',
    totalLevels: TOTAL_HOOK_LEVELS,
  };
}

export function findBestHookPeg(player: StickmanPlayer, pegs: HookPeg[]): HookPeg | null {
  // Find peg that is ahead or right above, within MAX_HOOK_RANGE
  let bestPeg: HookPeg | null = null;
  let bestDist = Infinity;

  for (const peg of pegs) {
    const dist = Math.hypot(peg.x - player.x, peg.y - player.y);
    if (dist <= MAX_HOOK_RANGE && peg.x >= player.x - 30) {
      if (dist < bestDist) {
        bestDist = dist;
        bestPeg = peg;
      }
    }
  }
  return bestPeg;
}

export function stepStickmanHookGame(
  state: StickmanHookState,
  hookHeld: boolean,
  dt: number
): StickmanHookState {
  if (state.status !== 'playing') {
    return state;
  }

  const safeDt = Math.min(dt, 0.05);
  const player: StickmanPlayer = { ...state.player };
  let status: StickmanHookState['status'] = state.status;

  // 1. Hook Attachment & Release
  if (hookHeld) {
    if (!player.attachedPegId) {
      const targetPeg = findBestHookPeg(player, state.pegs);
      if (targetPeg) {
        player.attachedPegId = targetPeg.id;
        const dx = player.x - targetPeg.x;
        const dy = player.y - targetPeg.y;
        player.ropeLength = Math.hypot(dx, dy);
        player.angle = Math.atan2(dx, dy); // Angle from downward vertical

        // Tangent vector in direction of increasing angle (clockwise/forward): (cos(angle), -sin(angle))
        const tangentX = Math.cos(player.angle);
        const tangentY = -Math.sin(player.angle);
        const tangentialSpeed = player.vx * tangentX + player.vy * tangentY;
        player.angularVelocity = tangentialSpeed / player.ropeLength;
      }
    }
  } else {
    // Released hook!
    if (player.attachedPegId) {
      const activePeg = state.pegs.find((p) => p.id === player.attachedPegId);
      if (activePeg) {
        const tangentX = Math.cos(player.angle);
        const tangentY = -Math.sin(player.angle);
        const tangentialSpeed = player.angularVelocity * player.ropeLength;
        player.vx = tangentX * tangentialSpeed;
        player.vy = tangentY * tangentialSpeed;
      }
      player.attachedPegId = null;
      player.ropeLength = 0;
    }
  }

  // 2. Physics Simulation
  if (player.attachedPegId) {
    // Pendulum physics around attached peg
    const peg = state.pegs.find((p) => p.id === player.attachedPegId);
    if (peg) {
      const angularAcc = -(GRAVITY / Math.max(40, player.ropeLength)) * Math.sin(player.angle);
      player.angularVelocity += angularAcc * safeDt;
      player.angle += player.angularVelocity * safeDt;

      // Position derived from rope and angle
      player.x = peg.x + Math.sin(player.angle) * player.ropeLength;
      player.y = peg.y + Math.cos(player.angle) * player.ropeLength;
      player.rotation += player.angularVelocity * safeDt * 1.5;
    }
  } else {
    // Free flight
    player.vy += GRAVITY * safeDt;
    player.vx *= 0.998; // slight air drag
    player.x += player.vx * safeDt;
    player.y += player.vy * safeDt;
    player.rotation += (player.vx / 30) * safeDt;
  }

  // 3. Trampoline Bounces
  for (const tramp of state.trampolines) {
    if (
      player.x >= tramp.x &&
      player.x <= tramp.x + tramp.width &&
      player.y + player.radius >= tramp.y &&
      player.y - player.radius <= tramp.y + tramp.height &&
      player.vy > 0
    ) {
      // Bounce!
      player.y = tramp.y - player.radius;
      player.vy = -tramp.bouncePower;
      player.vx = Math.max(player.vx, 220); // boost forward momentum
      if (player.attachedPegId) {
        player.attachedPegId = null;
      }
      break;
    }
  }

  // 4. Abyss Death Check
  if (player.y > 520) {
    player.alive = false;
    status = 'failed';
  }

  // 5. Finish Line Reached
  if (player.x >= state.finishLineX) {
    player.reachedFinish = true;
    status = state.levelIndex >= TOTAL_HOOK_LEVELS ? 'victory' : 'level_cleared';
  }

  return {
    ...state,
    player,
    status,
  };
}

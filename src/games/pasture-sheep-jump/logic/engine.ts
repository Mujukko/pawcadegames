export type PlatformType = 'standard' | 'spring' | 'moving' | 'fragile';

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: PlatformType;
  broken?: boolean;
  dir?: number; // 1 or -1 for moving platforms
  speed?: number;
  hasBell?: boolean;
}

export interface SheepPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  facing: 'left' | 'right';
  isSuperJumping: boolean;
}

export interface PastureSheepJumpState {
  score: number;
  highScore: number;
  altitude: number; // in pixels climbed
  platforms: Platform[];
  player: SheepPlayer;
  bellsCollected: number;
  cameraY: number;
  gameOver: boolean;
  milestoneReached: number | null;
}

export const WORLD_WIDTH = 400;
export const WORLD_HEIGHT = 560;
export const GRAVITY = 1180; // px/s^2
export const NORMAL_JUMP_VY = -660; // px/s
export const SPRING_JUMP_VY = -1080; // px/s
export const HORIZONTAL_SPEED = 320; // px/s

export function createInitialJumpState(highScore: number = 0): PastureSheepJumpState {
  const initialPlatforms: Platform[] = [
    { id: 'plat-base', x: 150, y: 500, width: 100, height: 16, type: 'standard' },
    { id: 'plat-1', x: 80, y: 410, width: 85, height: 16, type: 'standard' },
    { id: 'plat-2', x: 240, y: 320, width: 85, height: 16, type: 'spring' },
    { id: 'plat-3', x: 120, y: 220, width: 85, height: 16, type: 'moving', dir: 1, speed: 65 },
    { id: 'plat-4', x: 260, y: 120, width: 80, height: 16, type: 'standard', hasBell: true },
    { id: 'plat-5', x: 160, y: 20, width: 80, height: 16, type: 'standard' },
  ];

  return {
    score: 0,
    highScore,
    altitude: 0,
    platforms: initialPlatforms,
    player: {
      x: 200,
      y: 450,
      vx: 0,
      vy: NORMAL_JUMP_VY,
      width: 44,
      height: 42,
      facing: 'right',
      isSuperJumping: false,
    },
    bellsCollected: 0,
    cameraY: 0,
    gameOver: false,
    milestoneReached: null,
  };
}

export function updateHorizontalSteering(
  player: SheepPlayer,
  targetXPercent: number, // 0 to 100
  dtSeconds: number
): SheepPlayer {
  const targetX = (targetXPercent / 100) * WORLD_WIDTH;
  const diff = targetX - player.x;
  const facing = diff < -2 ? 'left' : diff > 2 ? 'right' : player.facing;
  const maxMove = HORIZONTAL_SPEED * dtSeconds;
  const move = Math.max(-maxMove, Math.min(maxMove, diff * 7 * dtSeconds));

  let newX = player.x + move;

  // Screen horizontal wraparound
  if (newX < -15) {
    newX = WORLD_WIDTH + 15;
  } else if (newX > WORLD_WIDTH + 15) {
    newX = -15;
  }

  return {
    ...player,
    x: newX,
    facing,
  };
}

export interface JumpStepResult {
  state: PastureSheepJumpState;
  event: 'none' | 'bounce' | 'superbounce' | 'bell' | 'milestone' | 'gameover';
}

export function stepJumpPhysics(state: PastureSheepJumpState, dtSeconds: number): JumpStepResult {
  if (state.gameOver) {
    return { state, event: 'none' };
  }

  let event: 'none' | 'bounce' | 'superbounce' | 'bell' | 'milestone' | 'gameover' = 'none';
  let player = { ...state.player };
  let platforms = state.platforms.map((p) => ({ ...p }));
  let score = state.score;
  let bells = state.bellsCollected;
  let altitude = state.altitude;

  // 1. Move platforms (for 'moving' type)
  platforms.forEach((p) => {
    if (p.type === 'moving' && p.speed && p.dir) {
      p.x += p.dir * p.speed * dtSeconds;
      if (p.x <= 20) {
        p.x = 20;
        p.dir = 1;
      } else if (p.x + p.width >= WORLD_WIDTH - 20) {
        p.x = WORLD_WIDTH - 20 - p.width;
        p.dir = -1;
      }
    }
  });

  // 2. Apply gravity to player
  player.vy += GRAVITY * dtSeconds;
  player.y += player.vy * dtSeconds;

  if (player.vy > 0) {
    player.isSuperJumping = false;
  }

  // 3. Platform Collision Check (Only when falling downward, vy > 0)
  if (player.vy > 0) {
    const feetY = player.y + player.height / 2;
    const prevFeetY = feetY - player.vy * dtSeconds;

    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      if (p.broken) continue;

      // Check horizontal overlap
      const playerLeft = player.x - player.width * 0.4;
      const playerRight = player.x + player.width * 0.4;
      const platLeft = p.x;
      const platRight = p.x + p.width;

      if (playerRight >= platLeft && playerLeft <= platRight) {
        // Feet crossed platform top edge
        const platTop = p.y;
        if (prevFeetY <= platTop + 8 && feetY >= platTop - 4) {
          player.y = platTop - player.height / 2;

          if (p.type === 'spring') {
            player.vy = SPRING_JUMP_VY;
            player.isSuperJumping = true;
            event = 'superbounce';
          } else if (p.type === 'fragile') {
            p.broken = true;
            player.vy = NORMAL_JUMP_VY * 0.9;
            event = 'bounce';
          } else {
            player.vy = NORMAL_JUMP_VY;
            event = 'bounce';
          }
          break;
        }
      }
    }
  }

  // 4. Collectible Bell Check
  platforms.forEach((p) => {
    if (p.hasBell) {
      const bellX = p.x + p.width / 2;
      const bellY = p.y - 18;
      const dist = Math.hypot(player.x - bellX, player.y - bellY);
      if (dist < 32) {
        p.hasBell = false;
        bells += 1;
        score += 200;
        if (event === 'none') event = 'bell';
      }
    }
  });

  // 5. Camera Tracking Upward
  let cameraShift = 0;
  const targetScreenY = 240;
  if (player.y < targetScreenY) {
    cameraShift = targetScreenY - player.y;
    player.y = targetScreenY;
    altitude += cameraShift;
    score = Math.max(score, Math.floor(altitude / 8) + bells * 200);

    // Shift platforms down
    platforms.forEach((p) => {
      p.y += cameraShift;
    });

    // Milestone check (every 1000 altitude)
    const currentMilestone = Math.floor(altitude / 1000);
    const prevMilestone = Math.floor((altitude - cameraShift) / 1000);
    if (currentMilestone > prevMilestone && currentMilestone > 0) {
      event = 'milestone';
    }
  }

  // 6. Recycle Platforms that drop below bottom
  let highestPlatY = Math.min(...platforms.map((p) => p.y));
  for (let i = 0; i < platforms.length; i++) {
    const p = platforms[i];
    if (p.y > WORLD_HEIGHT + 20) {
      // Recycle platform to top
      const newY = highestPlatY - (68 + Math.random() * 45);
      highestPlatY = newY;
      p.y = newY;
      p.x = 25 + Math.random() * (WORLD_WIDTH - 120);
      p.broken = false;

      // Platform type probabilities
      const rand = Math.random();
      if (rand < 0.2) {
        p.type = 'spring';
        p.width = 75;
      } else if (rand < 0.45) {
        p.type = 'moving';
        p.width = 80;
        p.dir = Math.random() > 0.5 ? 1 : -1;
        p.speed = 60 + Math.random() * 50;
      } else if (rand < 0.6) {
        p.type = 'fragile';
        p.width = 75;
      } else {
        p.type = 'standard';
        p.width = 85;
      }

      p.hasBell = Math.random() < 0.25;
    }
  }

  // 7. Check Fall Death (Game Over)
  if (player.y > WORLD_HEIGHT + 30) {
    return {
      state: {
        ...state,
        score,
        highScore: Math.max(state.highScore, score),
        altitude,
        player,
        platforms,
        bellsCollected: bells,
        gameOver: true,
      },
      event: 'gameover',
    };
  }

  return {
    state: {
      ...state,
      score,
      highScore: Math.max(state.highScore, score),
      altitude,
      player,
      platforms,
      bellsCollected: bells,
    },
    event,
  };
}

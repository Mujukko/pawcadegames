import {
  Hazard,
  NinjaChickGameState,
  NinjaChickLevel,
  PlayerPhysics,
  Rect,
} from './types';
import { NINJA_CHICK_LEVELS } from './levels';

export const GRAVITY = 1100; // px/s^2
export const RUN_SPEED = 220; // px/s
export const JUMP_VELOCITY = -450; // px/s
export const WALL_JUMP_VX = 260;
export const WALL_JUMP_VY = -420;
export const WALL_SLIDE_MAX_VY = 75;

export function createInitialPlayer(spawn: { x: number; y: number }): PlayerPhysics {
  return {
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    w: 18,
    h: 22,
    isGrounded: false,
    isOnWallLeft: false,
    isOnWallRight: false,
    isSliding: false,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    facing: 1,
    activeCheckpoint: { ...spawn },
  };
}

export function initializeNinjaChickGame(levelIndex: number = 0): NinjaChickGameState {
  const level = NINJA_CHICK_LEVELS[levelIndex] || NINJA_CHICK_LEVELS[0];
  const player = createInitialPlayer(level.spawnPoint);

  return {
    currentLevelIndex: levelIndex,
    player,
    level,
    levelCompleted: false,
    gameOver: false,
    elapsedTime: 0,
    deaths: 0,
    coinsCollected: 0,
    starsInLevel: 0,
  };
}

export function rectsOverlap(r1: Rect, r2: Rect): boolean {
  return (
    r1.x < r2.x + r2.w &&
    r1.x + r1.w > r2.x &&
    r1.y < r2.y + r2.h &&
    r1.y + r1.h > r2.y
  );
}

export interface EngineEvents {
  jumped?: boolean;
  wallJumped?: boolean;
  bounced?: boolean;
  coinCollected?: boolean;
  checkpointActivated?: boolean;
  playerDied?: boolean;
  levelCleared?: boolean;
}

export function stepNinjaChickGame(
  state: NinjaChickGameState,
  input: {
    left: boolean;
    right: boolean;
    jump: boolean;
    down: boolean;
  },
  dt: number
): { state: NinjaChickGameState; events: EngineEvents } {
  if (state.levelCompleted || state.gameOver) {
    return { state, events: {} };
  }

  const events: EngineEvents = {};
  const safeDt = Math.min(dt, 0.033);
  const player = { ...state.player };
  const level = state.level;

  // 1. Sliding / Crouching Height
  if (input.down && player.isGrounded) {
    player.isSliding = true;
    player.h = 12; // crouched height
  } else {
    // Only uncrouch if space above allows
    player.h = 22;
    player.isSliding = false;
  }

  // 2. Horizontal Movement
  let targetVx = 0;
  if (input.left) {
    targetVx -= player.isSliding ? RUN_SPEED * 1.2 : RUN_SPEED;
    player.facing = -1;
  }
  if (input.right) {
    targetVx += player.isSliding ? RUN_SPEED * 1.2 : RUN_SPEED;
    player.facing = 1;
  }

  const accel = player.isGrounded ? 18 : 10;
  player.vx += (targetVx - player.vx) * Math.min(1, accel * safeDt);

  // 3. Timers (Coyote & Jump Buffering)
  if (player.isGrounded) {
    player.coyoteTimer = 0.09;
  } else {
    player.coyoteTimer = Math.max(0, player.coyoteTimer - safeDt);
  }

  if (input.jump) {
    player.jumpBufferTimer = 0.12;
  } else {
    player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - safeDt);
  }

  // 4. Wall Slide & Jump Mechanics
  const isTouchingWall = player.isOnWallLeft || player.isOnWallRight;
  if (isTouchingWall && !player.isGrounded && player.vy > 0) {
    player.vy = Math.min(player.vy, WALL_SLIDE_MAX_VY);
  } else {
    player.vy += GRAVITY * safeDt;
  }

  // Check jump execution
  if (player.jumpBufferTimer > 0) {
    if (player.coyoteTimer > 0) {
      // Normal ground jump
      player.vy = JUMP_VELOCITY;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
      player.isGrounded = false;
      events.jumped = true;
    } else if (player.isOnWallLeft) {
      // Wall jump leaping right
      player.vx = WALL_JUMP_VX;
      player.vy = WALL_JUMP_VY;
      player.facing = 1;
      player.jumpBufferTimer = 0;
      player.isOnWallLeft = false;
      events.wallJumped = true;
    } else if (player.isOnWallRight) {
      // Wall jump leaping left
      player.vx = -WALL_JUMP_VX;
      player.vy = WALL_JUMP_VY;
      player.facing = -1;
      player.jumpBufferTimer = 0;
      player.isOnWallRight = false;
      events.wallJumped = true;
    }
  }

  // 5. Horizontal Collision Pass
  player.x += player.vx * safeDt;
  player.isOnWallLeft = false;
  player.isOnWallRight = false;

  const playerBox: Rect = { x: player.x, y: player.y, w: player.w, h: player.h };

  for (const plat of level.platforms) {
    if (rectsOverlap({ ...playerBox, x: player.x }, plat)) {
      if (player.vx > 0) {
        player.x = plat.x - player.w;
        player.isOnWallRight = true;
      } else if (player.vx < 0) {
        player.x = plat.x + plat.w;
        player.isOnWallLeft = true;
      }
      player.vx = 0;
    }
  }

  // 6. Vertical Collision Pass
  player.y += player.vy * safeDt;
  player.isGrounded = false;

  for (const plat of level.platforms) {
    const box = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (rectsOverlap(box, plat)) {
      if (player.vy > 0) {
        // Landing on floor
        player.y = plat.y - player.h;
        player.isGrounded = true;
        player.vy = 0;
      } else if (player.vy < 0) {
        // Hitting ceiling
        player.y = plat.y + plat.h;
        player.vy = 0;
      }
    }
  }

  // 7. Trampoline Bouncers
  for (const bouncer of level.bouncers) {
    const box = { x: player.x, y: player.y, w: player.w, h: player.h };
    if (rectsOverlap(box, bouncer)) {
      player.vy = bouncer.bounceForce;
      player.isGrounded = false;
      events.bounced = true;
    }
  }

  // 8. Rotating Hazard Collision
  let playerDied = false;
  for (const haz of level.hazards) {
    const pcx = player.x + player.w * 0.5;
    const pcy = player.y + player.h * 0.5;
    const dist = Math.hypot(pcx - haz.x, pcy - haz.y);
    if (dist < haz.radius + player.w * 0.4) {
      playerDied = true;
      break;
    }
  }

  // Bottom pit fall death
  if (player.y > 470) {
    playerDied = true;
  }

  let deaths = state.deaths;
  if (playerDied) {
    // Respawn at active checkpoint
    player.x = player.activeCheckpoint.x;
    player.y = player.activeCheckpoint.y;
    player.vx = 0;
    player.vy = 0;
    deaths++;
    events.playerDied = true;
  }

  // 9. Checkpoints
  const checkpoints = level.checkpoints.map((cp) => {
    if (!cp.activated) {
      const dist = Math.hypot(player.x - cp.x, player.y - cp.y);
      if (dist < 32) {
        player.activeCheckpoint = { x: cp.x, y: cp.y - 10 };
        events.checkpointActivated = true;
        return { ...cp, activated: true };
      }
    }
    return cp;
  });

  // 10. Star Coins
  let coinsCollected = state.coinsCollected;
  let starsInLevel = state.starsInLevel;
  const starCoins = level.starCoins.map((sc) => {
    if (!sc.collected) {
      const dist = Math.hypot(player.x + 9 - sc.x, player.y + 11 - sc.y);
      if (dist < 24) {
        coinsCollected += 5;
        starsInLevel++;
        events.coinCollected = true;
        return { ...sc, collected: true };
      }
    }
    return sc;
  });

  // 11. Exit Door Clearance
  let levelCompleted = false;
  if (rectsOverlap({ x: player.x, y: player.y, w: player.w, h: player.h }, level.exitDoor)) {
    levelCompleted = true;
    events.levelCleared = true;
  }

  return {
    state: {
      ...state,
      player,
      level: {
        ...level,
        checkpoints,
        starCoins,
      },
      deaths,
      coinsCollected,
      starsInLevel,
      levelCompleted,
      elapsedTime: state.elapsedTime + safeDt,
    },
    events,
  };
}

export function restartLevel(state: NinjaChickGameState): NinjaChickGameState {
  const level = NINJA_CHICK_LEVELS[state.currentLevelIndex] || NINJA_CHICK_LEVELS[0];
  const player = createInitialPlayer(level.spawnPoint);

  return {
    ...state,
    player,
    level,
    levelCompleted: false,
    gameOver: false,
    elapsedTime: 0,
    starsInLevel: 0,
  };
}

export function advanceToNextLevel(state: NinjaChickGameState): NinjaChickGameState {
  const nextIndex = (state.currentLevelIndex + 1) % NINJA_CHICK_LEVELS.length;
  return initializeNinjaChickGame(nextIndex);
}

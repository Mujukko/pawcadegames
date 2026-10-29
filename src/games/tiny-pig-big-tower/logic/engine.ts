import {
  BigTowerGameState,
  TinyPigPlayer,
  TowerInput,
  TowerBlock,
  MovingLaser,
  CheckpointFlag,
} from './types';
import { INITIAL_BLOCKS, INITIAL_LASERS, CHECKPOINTS } from './towerMap';

export const PIG_SIZE = 14;
export const RUN_SPEED = 180;
export const JUMP_FORCE = 370;
export const WALL_JUMP_FORCE_Y = 350;
export const WALL_JUMP_FORCE_X = 220;
export const GRAVITY = 920;
export const WALL_SLIDE_SPEED = 75;
export const TRAMPOLINE_BOOST = 540;
export const COYOTE_TIME = 0.09;
export const JUMP_BUFFER = 0.12;

export function initBigTowerGame(bestTimeSeconds = 999): BigTowerGameState {
  const checkpoints: CheckpointFlag[] = CHECKPOINTS.map((cp, idx) => ({
    ...cp,
    reached: idx === 0,
  }));

  const activeCheckpoint = checkpoints[0];

  const player: TinyPigPlayer = {
    x: activeCheckpoint.x,
    y: activeCheckpoint.y - PIG_SIZE,
    width: PIG_SIZE,
    height: PIG_SIZE,
    vx: 0,
    vy: 0,
    isGrounded: true,
    isWallSliding: false,
    wallDirection: 0,
    coyoteTimer: 0,
    jumpBufferTimer: 0,
    respawnX: activeCheckpoint.x,
    respawnY: activeCheckpoint.y - PIG_SIZE,
  };

  const blocks: TowerBlock[] = INITIAL_BLOCKS.map(b => ({
    ...b,
    isBroken: false,
    crumbleTimer: b.type === 'crumble' ? 0.45 : undefined,
  }));

  const movingLasers: MovingLaser[] = INITIAL_LASERS.map(l => ({ ...l }));

  return {
    status: 'ready',
    elapsedTime: 0,
    deathsCount: 0,
    activeCheckpoint,
    player,
    blocks,
    movingLasers,
    checkpoints,
    bestTimeSeconds,
  };
}

export function respawnPlayer(state: BigTowerGameState): BigTowerGameState {
  return {
    ...state,
    deathsCount: state.deathsCount + 1,
    player: {
      ...state.player,
      x: state.activeCheckpoint.x,
      y: state.activeCheckpoint.y - PIG_SIZE,
      vx: 0,
      vy: 0,
      isGrounded: true,
      isWallSliding: false,
      wallDirection: 0,
      coyoteTimer: 0,
      jumpBufferTimer: 0,
    },
  };
}

export function checkAABB(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

export function stepBigTowerGame(
  state: BigTowerGameState,
  input: TowerInput,
  dt: number
): BigTowerGameState {
  if (state.status === 'victory') return state;

  let nextStatus: BigTowerGameState['status'] = state.status;
  let elapsedTime = state.elapsedTime;
  let deathsCount = state.deathsCount;
  let activeCheckpoint = { ...state.activeCheckpoint };
  let bestTimeSeconds = state.bestTimeSeconds;

  if (input.restart) {
    return respawnPlayer(state);
  }

  // Start timer on first movement
  if (state.status === 'ready') {
    if (input.moveLeft || input.moveRight || input.jump) {
      nextStatus = 'playing';
    } else {
      return state;
    }
  }

  const fixedDt = Math.min(dt, 0.033);
  elapsedTime += fixedDt;

  const player: TinyPigPlayer = { ...state.player };

  // 1. Update Timers
  if (player.isGrounded) {
    player.coyoteTimer = COYOTE_TIME;
  } else if (player.coyoteTimer > 0) {
    player.coyoteTimer -= fixedDt;
  }

  if (input.jump) {
    player.jumpBufferTimer = JUMP_BUFFER;
  } else if (player.jumpBufferTimer > 0) {
    player.jumpBufferTimer -= fixedDt;
  }

  // 2. Horizontal Movement Input
  let targetVx = 0;
  if (input.moveLeft) targetVx = -RUN_SPEED;
  if (input.moveRight) targetVx = RUN_SPEED;

  player.vx = targetVx;

  // 3. Wall Sliding / Gravity
  if (player.isWallSliding && player.vy > 0) {
    player.vy = Math.min(player.vy, WALL_SLIDE_SPEED);
  } else {
    player.vy += GRAVITY * fixedDt;
  }

  // 4. Jump Execution (Ground Jump or Wall Jump)
  if (player.jumpBufferTimer > 0) {
    if (player.coyoteTimer > 0) {
      // Ground Jump
      player.vy = -JUMP_FORCE;
      player.isGrounded = false;
      player.coyoteTimer = 0;
      player.jumpBufferTimer = 0;
    } else if (player.isWallSliding && player.wallDirection !== 0) {
      // Wall Jump
      player.vy = -WALL_JUMP_FORCE_Y;
      player.vx = -player.wallDirection * WALL_JUMP_FORCE_X;
      player.isWallSliding = false;
      player.wallDirection = 0;
      player.jumpBufferTimer = 0;
    }
  }

  // 5. Update Moving Lasers
  const movingLasers = state.movingLasers.map(laser => {
    const l = { ...laser };
    l.x += l.speed * l.direction * fixedDt;
    if (l.x >= l.maxX) {
      l.x = l.maxX;
      l.direction = -1;
    } else if (l.x <= l.minX) {
      l.x = l.minX;
      l.direction = 1;
    }
    return l;
  });

  // 6. Integrate Horizontal Movement & Collisions
  player.x += player.vx * fixedDt;
  player.isWallSliding = false;
  player.wallDirection = 0;

  const blocks = state.blocks.map(b => ({ ...b }));

  for (const block of blocks) {
    if (block.isBroken) continue;
    if (block.type === 'solid' || block.type === 'crumble') {
      if (
        checkAABB(
          player.x,
          player.y,
          player.width,
          player.height,
          block.x,
          block.y,
          block.width,
          block.height
        )
      ) {
        if (player.vx > 0) {
          player.x = block.x - player.width;
          if (!player.isGrounded && player.vy > 0) {
            player.isWallSliding = true;
            player.wallDirection = 1;
          }
        } else if (player.vx < 0) {
          player.x = block.x + block.width;
          if (!player.isGrounded && player.vy > 0) {
            player.isWallSliding = true;
            player.wallDirection = -1;
          }
        }
        player.vx = 0;
      }
    }
  }

  // 7. Integrate Vertical Movement & Collisions
  player.y += player.vy * fixedDt;
  player.isGrounded = false;

  for (const block of blocks) {
    if (block.isBroken) continue;

    const collides = checkAABB(
      player.x,
      player.y,
      player.width,
      player.height,
      block.x,
      block.y,
      block.width,
      block.height
    );

    if (collides) {
      if (block.type === 'solid' || block.type === 'crumble') {
        if (player.vy > 0) {
          // Land on top
          player.y = block.y - player.height;
          player.vy = 0;
          player.isGrounded = true;

          // Crumble block countdown
          if (block.type === 'crumble') {
            if (block.crumbleTimer !== undefined) {
              block.crumbleTimer -= fixedDt;
              if (block.crumbleTimer <= 0) {
                block.isBroken = true;
              }
            }
          }
        } else if (player.vy < 0) {
          // Hit head on bottom
          player.y = block.y + block.height;
          player.vy = 0;
        }
      } else if (block.type === 'trampoline') {
        // High bouncy trampoline jump
        player.vy = -TRAMPOLINE_BOOST;
        player.isGrounded = false;
      } else if (block.type === 'lava') {
        // Lava / syrup hazard -> Instant death
        return respawnPlayer({
          ...state,
          status: nextStatus,
          elapsedTime,
          deathsCount,
          activeCheckpoint,
        });
      } else if (block.type === 'golden_acorn') {
        // SNATCHED THE GOLDEN ACORN! VICTORY!
        nextStatus = 'victory';
        if (elapsedTime < bestTimeSeconds) {
          bestTimeSeconds = parseFloat(elapsedTime.toFixed(2));
        }
      }
    }
  }

  // 8. Laser Collision (Death)
  for (const laser of movingLasers) {
    if (
      checkAABB(
        player.x,
        player.y,
        player.width,
        player.height,
        laser.x,
        laser.y,
        laser.width,
        laser.height
      )
    ) {
      return respawnPlayer({
        ...state,
        status: nextStatus,
        elapsedTime,
        deathsCount,
        activeCheckpoint,
      });
    }
  }

  // 9. Checkpoint Flag Touching
  const checkpoints = state.checkpoints.map(cp => {
    const flag = { ...cp };
    if (!flag.reached && Math.abs(player.x - flag.x) <= 24 && Math.abs(player.y - flag.y) <= 30) {
      flag.reached = true;
      activeCheckpoint = flag;
      player.respawnX = flag.x;
      player.respawnY = flag.y - PIG_SIZE;
    }
    return flag;
  });

  return {
    ...state,
    status: nextStatus,
    elapsedTime,
    deathsCount,
    activeCheckpoint,
    player,
    blocks,
    movingLasers,
    checkpoints,
    bestTimeSeconds,
  };
}

export function calculateTowerStars(elapsedTime: number, deaths: number): number {
  if (elapsedTime <= 60 && deaths <= 3) return 3;
  if (elapsedTime <= 100 && deaths <= 10) return 2;
  return 1;
}

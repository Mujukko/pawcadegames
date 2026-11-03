import {
  TunnelRunnerState,
  TunnelPlayer,
  TunnelTile,
} from './types';

export const TOTAL_LANES = 8;
export const BASE_SPEED = 14;
export const MAX_SPEED = 28;
export const JUMP_IMPULSE = 13;
export const GRAVITY = 34;
export const TILE_DEPTH = 2.5;
export const TUNNEL_LENGTH = 35; // units ahead

export function createTunnelRunnerGame(highScore = 0): TunnelRunnerState {
  const tiles: TunnelTile[] = [];

  // Generate starter safe runway (first 10 units)
  for (let z = 0; z < TUNNEL_LENGTH; z += TILE_DEPTH) {
    const isStarter = z < 12;
    for (let lane = 0; lane < TOTAL_LANES; lane++) {
      const hasFloor = isStarter || Math.random() > 0.28;
      const hasObstacle = !isStarter && hasFloor && Math.random() < 0.12;

      tiles.push({
        z,
        lane,
        hasFloor,
        hasObstacle,
      });
    }
  }

  const player: TunnelPlayer = {
    lane: 0, // Bottom floor
    subLaneOffset: 0,
    jumpHeight: 0,
    jumpVelocity: 0,
    isJumping: false,
  };

  return {
    status: 'ready',
    score: 0,
    highScore,
    distance: 0,
    speed: BASE_SPEED,
    player,
    tiles,
    events: [],
  };
}

export function rotateTunnel(state: TunnelRunnerState, dir: -1 | 1): TunnelRunnerState {
  if (state.status === 'game_over') return state;

  const nextLane = (state.player.lane + dir + TOTAL_LANES) % TOTAL_LANES;

  return {
    ...state,
    status: 'running',
    player: {
      ...state.player,
      lane: nextLane,
    },
    events: [...state.events, { type: 'rotate' }],
  };
}

export function jumpTunnelPlayer(state: TunnelRunnerState): TunnelRunnerState {
  if (state.status === 'game_over') return state;
  if (state.player.isJumping) return state;

  return {
    ...state,
    status: 'running',
    player: {
      ...state.player,
      isJumping: true,
      jumpVelocity: JUMP_IMPULSE,
    },
    events: [...state.events, { type: 'jump' }],
  };
}

export function updateTunnelRunnerGame(
  state: TunnelRunnerState,
  rawDt: number
): TunnelRunnerState {
  if (state.status !== 'running') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: TunnelRunnerState['events'] = [];
  let status: TunnelRunnerState['status'] = state.status;
  const speed = Math.min(MAX_SPEED, state.speed + dt * 0.15);
  const distance = state.distance + speed * dt;
  const score = Math.floor(distance * 10);
  const highScore = Math.max(state.highScore, score);

  const player = { ...state.player };

  // Jump physics
  if (player.isJumping) {
    player.jumpVelocity -= GRAVITY * dt;
    player.jumpHeight += player.jumpVelocity * dt;

    if (player.jumpHeight <= 0) {
      player.jumpHeight = 0;
      player.jumpVelocity = 0;
      player.isJumping = false;
    }
  }

  // Shift tiles forward relative to player
  let tiles = state.tiles
    .map((t) => ({ ...t, z: t.z - speed * dt }))
    .filter((t) => t.z > -TILE_DEPTH);

  // Check collision at player position (z ~ 0 to 1.5)
  if (!player.isJumping) {
    const activeTile = tiles.find(
      (t) => t.lane === player.lane && t.z >= -0.5 && t.z <= 1.8
    );

    if (activeTile) {
      if (!activeTile.hasFloor || activeTile.hasObstacle) {
        // Fall through hole or hit barrier!
        status = 'game_over';
        events.push({ type: 'fall' });
      }
    }
  }

  // Generate new tiles at tunnel end
  const maxZ = tiles.reduce((max, t) => Math.max(max, t.z), 0);
  if (maxZ < TUNNEL_LENGTH) {
    const nextZ = maxZ + TILE_DEPTH;
    for (let lane = 0; lane < TOTAL_LANES; lane++) {
      const hasFloor = Math.random() > 0.32;
      const hasObstacle = hasFloor && Math.random() < 0.15;
      tiles.push({
        z: nextZ,
        lane,
        hasFloor,
        hasObstacle,
      });
    }
  }

  return {
    ...state,
    status,
    score,
    highScore,
    distance,
    speed,
    player,
    tiles,
    events,
  };
}

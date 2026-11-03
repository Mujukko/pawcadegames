import {
  DoodleGameState,
  DoodlePlayer,
  DoodlePlatform,
  PlatformType,
} from './types';

export const WORLD_WIDTH = 400;
export const WORLD_HEIGHT = 650;
export const GRAVITY = 1100;
export const BOUNCE_IMPULSE = 680;
export const SPRING_IMPULSE = 1180;
export const PLATFORM_WIDTH = 68;
export const PLATFORM_HEIGHT = 14;

export function createDoodleGame(highScore = 0): DoodleGameState {
  const initialPlatforms = generateInitialPlatforms();

  const player: DoodlePlayer = {
    x: WORLD_WIDTH * 0.5,
    y: 80,
    vx: 0,
    vy: BOUNCE_IMPULSE,
    facing: 'right',
    hasPropeller: false,
    propellerTimer: 0,
  };

  return {
    status: 'ready',
    score: 0,
    highScore,
    altitude: 0,
    player,
    platforms: initialPlatforms,
    cameraY: 0,
    events: [],
  };
}

function generateInitialPlatforms(): DoodlePlatform[] {
  const platforms: DoodlePlatform[] = [
    // Starter platform right under player
    {
      id: 'plat_0',
      x: WORLD_WIDTH * 0.5 - PLATFORM_WIDTH * 0.5,
      y: 50,
      width: PLATFORM_WIDTH + 40,
      height: PLATFORM_HEIGHT,
      type: 'standard',
      vx: 0,
      isBroken: false,
      hasSpring: false,
    },
  ];

  let currentY = 120;
  for (let i = 1; i < 18; i++) {
    const pType: PlatformType =
      i > 4 && Math.random() < 0.25
        ? 'moving'
        : i > 6 && Math.random() < 0.2
        ? 'fragile'
        : 'standard';

    const hasSpring = pType === 'standard' && Math.random() < 0.18;

    platforms.push({
      id: `plat_${i}`,
      x: Math.random() * (WORLD_WIDTH - PLATFORM_WIDTH - 20) + 10,
      y: currentY,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: pType,
      vx: pType === 'moving' ? (Math.random() < 0.5 ? 90 : -90) : 0,
      isBroken: false,
      hasSpring,
    });

    currentY += 55 + Math.random() * 35;
  }

  return platforms;
}

export function moveDoodlePlayer(state: DoodleGameState, moveDir: number): DoodleGameState {
  if (state.status === 'game_over') return state;

  const player = { ...state.player };
  player.vx = moveDir * 340;
  if (moveDir < 0) player.facing = 'left';
  else if (moveDir > 0) player.facing = 'right';

  return {
    ...state,
    status: 'playing',
    player,
  };
}

export function updateDoodleGame(state: DoodleGameState, rawDt: number): DoodleGameState {
  if (state.status === 'game_over') return state;

  const dt = Math.min(rawDt, 0.05);
  const events: DoodleGameState['events'] = [];
  let status: DoodleGameState['status'] = state.status;
  let score = state.score;
  let highScore = state.highScore;

  const player = { ...state.player };

  // Horizontal motion with screen wrap
  player.x += player.vx * dt;
  if (player.x < -15) player.x = WORLD_WIDTH + 10;
  else if (player.x > WORLD_WIDTH + 15) player.x = -10;

  // Propeller hat power-up
  if (player.hasPropeller) {
    player.propellerTimer -= dt;
    player.vy = 650;
    if (player.propellerTimer <= 0) {
      player.hasPropeller = false;
      player.propellerTimer = 0;
    }
  } else {
    // Standard gravity
    player.vy -= GRAVITY * dt;
  }

  const nextY = player.y + player.vy * dt;

  // Update moving platforms
  let platforms = state.platforms.map((p) => {
    const updated = { ...p };
    if (updated.type === 'moving') {
      updated.x += updated.vx * dt;
      if (updated.x >= WORLD_WIDTH - updated.width - 10) {
        updated.x = WORLD_WIDTH - updated.width - 10;
        updated.vx = -Math.abs(updated.vx);
      } else if (updated.x <= 10) {
        updated.x = 10;
        updated.vx = Math.abs(updated.vx);
      }
    }
    return updated;
  });

  // Check collision when falling downward (vy < 0)
  if (player.vy < 0 && !player.hasPropeller) {
    for (const plat of platforms) {
      if (plat.isBroken) continue;

      const platTop = plat.y;
      // Feet cross platform threshold
      if (player.y >= platTop && nextY <= platTop) {
        // Horizontal overlap check
        const playerLeft = player.x - 14;
        const playerRight = player.x + 14;
        const platLeft = plat.x;
        const platRight = plat.x + plat.width;

        if (playerRight >= platLeft && playerLeft <= platRight) {
          if (plat.type === 'fragile') {
            plat.isBroken = true;
            // Short broken hop
            player.vy = BOUNCE_IMPULSE * 0.5;
            events.push({ type: 'bounce' });
          } else if (plat.hasSpring) {
            player.vy = SPRING_IMPULSE;
            events.push({ type: 'spring' });
          } else {
            player.vy = BOUNCE_IMPULSE;
            events.push({ type: 'bounce' });
          }
          break;
        }
      }
    }
  }

  player.y = nextY;

  // Camera follows upward motion
  let cameraY = state.cameraY;
  const targetCamY = player.y - WORLD_HEIGHT * 0.45;
  if (targetCamY > cameraY) {
    cameraY = targetCamY;
  }

  // Update score based on highest altitude reached
  score = Math.max(score, Math.floor(cameraY + player.y));
  if (score > highScore) highScore = score;

  // Game over check: fallen below bottom of screen
  if (player.y < cameraY - 80) {
    status = 'game_over';
    events.push({ type: 'fall' });
  }

  // Despawn low platforms and spawn new ones high above
  platforms = platforms.filter((p) => p.y > cameraY - 120);
  const highestPlatY = platforms.reduce((max, p) => Math.max(max, p.y), cameraY);

  if (highestPlatY < cameraY + WORLD_HEIGHT + 150) {
    const pType: PlatformType =
      Math.random() < 0.28 ? 'moving' : Math.random() < 0.2 ? 'fragile' : 'standard';
    const hasSpring = pType === 'standard' && Math.random() < 0.16;

    platforms.push({
      id: `plat_${Date.now()}_${Math.random()}`,
      x: Math.random() * (WORLD_WIDTH - PLATFORM_WIDTH - 20) + 10,
      y: highestPlatY + 60 + Math.random() * 35,
      width: PLATFORM_WIDTH,
      height: PLATFORM_HEIGHT,
      type: pType,
      vx: pType === 'moving' ? (Math.random() < 0.5 ? 95 : -95) : 0,
      isBroken: false,
      hasSpring,
    });
  }

  return {
    ...state,
    status,
    score,
    highScore,
    altitude: Math.floor(player.y),
    player,
    platforms,
    cameraY,
    events,
  };
}

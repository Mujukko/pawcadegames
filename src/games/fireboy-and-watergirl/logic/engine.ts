import {
  CharacterInput,
  CharacterState,
  DualInput,
  FireboyWatergirlState,
  Platform,
} from './types';

export const GRAVITY = 1100;
export const MOVE_SPEED = 180;
export const JUMP_SPEED = -400;
export const CHAR_WIDTH = 24;
export const CHAR_HEIGHT = 30;
export const TOTAL_COOP_LEVELS = 3;

export function getCoopLevelConfig(levelIndex: number): {
  pupStart: { x: number; y: number };
  kittyStart: { x: number; y: number };
  pupDoor: { x: number; y: number };
  kittyDoor: { x: number; y: number };
  platforms: Platform[];
  hazards: { id: string; x: number; y: number; width: number; height: number; type: 'lava' | 'water' | 'acid' }[];
  plates: { id: string; x: number; y: number; width: number; height: number }[];
  gems: { id: string; x: number; y: number; type: 'fire' | 'water' }[];
} {
  switch (levelIndex) {
    case 1:
      return {
        pupStart: { x: 50, y: 390 },
        kittyStart: { x: 90, y: 390 },
        pupDoor: { x: 700, y: 110 },
        kittyDoor: { x: 740, y: 110 },
        platforms: [
          // Outer boundaries
          { id: 'ground', x: 0, y: 440, width: 800, height: 40 },
          { id: 'leftWall', x: 0, y: 0, width: 24, height: 440 },
          { id: 'rightWall', x: 776, y: 0, width: 24, height: 440 },
          { id: 'ceiling', x: 0, y: 0, width: 800, height: 24 },

          // Floor 1 platforms
          { id: 'plat-1-mid', x: 260, y: 360, width: 140, height: 18 },
          // Floor 2
          { id: 'plat-2-left', x: 24, y: 270, width: 320, height: 18 },
          { id: 'plat-2-right', x: 440, y: 270, width: 336, height: 18 },
          // Floor 3 (Exits floor)
          { id: 'plat-3-top', x: 180, y: 160, width: 596, height: 18 },

          // Pressure plate door on Floor 2
          {
            id: 'gate-1',
            x: 350,
            y: 200,
            width: 16,
            height: 70,
            requiresPlateId: 'p-1',
            openOffsetY: -75,
          },
        ],
        hazards: [
          // Ground floor pools
          { id: 'h-lava', x: 160, y: 432, width: 80, height: 12, type: 'lava' },
          { id: 'h-water', x: 440, y: 432, width: 80, height: 12, type: 'water' },
          // Floor 2 acid puddle
          { id: 'h-acid', x: 520, y: 262, width: 60, height: 12, type: 'acid' },
        ],
        plates: [
          { id: 'p-1', x: 240, y: 264, width: 36, height: 6 },
        ],
        gems: [
          { id: 'g-pup-1', x: 200, y: 390, type: 'fire' },
          { id: 'g-kitty-1', x: 480, y: 390, type: 'water' },
          { id: 'g-pup-2', x: 100, y: 230, type: 'fire' },
          { id: 'g-kitty-2', x: 640, y: 230, type: 'water' },
        ],
      };

    case 2:
      return {
        pupStart: { x: 50, y: 390 },
        kittyStart: { x: 90, y: 390 },
        pupDoor: { x: 60, y: 100 },
        kittyDoor: { x: 100, y: 100 },
        platforms: [
          { id: 'ground', x: 0, y: 440, width: 800, height: 40 },
          { id: 'leftWall', x: 0, y: 0, width: 24, height: 440 },
          { id: 'rightWall', x: 776, y: 0, width: 24, height: 440 },
          { id: 'ceiling', x: 0, y: 0, width: 800, height: 24 },

          // Stepping platforms
          { id: 'plat-mid-1', x: 200, y: 360, width: 120, height: 18 },
          { id: 'plat-mid-2', x: 480, y: 340, width: 140, height: 18 },
          { id: 'plat-mid-3', x: 640, y: 260, width: 136, height: 18 },
          { id: 'plat-mid-4', x: 380, y: 210, width: 180, height: 18 },
          { id: 'plat-top-left', x: 24, y: 150, width: 280, height: 18 },

          // Pressure plate door
          {
            id: 'gate-2',
            x: 290,
            y: 80,
            width: 16,
            height: 70,
            requiresPlateId: 'p-2',
            openOffsetY: -75,
          },
        ],
        hazards: [
          { id: 'h-water-1', x: 130, y: 432, width: 65, height: 12, type: 'water' },
          { id: 'h-lava-1', x: 340, y: 432, width: 120, height: 12, type: 'lava' },
          { id: 'h-acid-1', x: 640, y: 432, width: 80, height: 12, type: 'acid' },
        ],
        plates: [
          { id: 'p-2', x: 440, y: 204, width: 36, height: 6 },
        ],
        gems: [
          { id: 'g-pup-1', x: 400, y: 400, type: 'fire' },
          { id: 'g-kitty-1', x: 160, y: 400, type: 'water' },
          { id: 'g-pup-2', x: 700, y: 220, type: 'fire' },
          { id: 'g-kitty-2', x: 440, y: 170, type: 'water' },
        ],
      };

    case 3:
    default:
      return {
        pupStart: { x: 50, y: 390 },
        kittyStart: { x: 100, y: 390 },
        pupDoor: { x: 700, y: 80 },
        kittyDoor: { x: 740, y: 80 },
        platforms: [
          { id: 'ground', x: 0, y: 440, width: 800, height: 40 },
          { id: 'leftWall', x: 0, y: 0, width: 24, height: 440 },
          { id: 'rightWall', x: 776, y: 0, width: 24, height: 440 },
          { id: 'ceiling', x: 0, y: 0, width: 800, height: 24 },

          // Tower staggered jumps
          { id: 'step-1', x: 220, y: 360, width: 100, height: 18 },
          { id: 'step-2', x: 80, y: 290, width: 100, height: 18 },
          { id: 'step-3', x: 260, y: 220, width: 140, height: 18 },
          { id: 'step-4', x: 480, y: 220, width: 140, height: 18 },
          { id: 'step-5', x: 360, y: 140, width: 120, height: 18 },
          { id: 'step-top', x: 580, y: 130, width: 196, height: 18 },

          // Gate opening
          {
            id: 'gate-3',
            x: 620,
            y: 50,
            width: 16,
            height: 80,
            requiresPlateId: 'p-3',
            openOffsetY: -85,
          },
        ],
        hazards: [
          { id: 'h-lava-1', x: 140, y: 432, width: 70, height: 12, type: 'lava' },
          { id: 'h-water-1', x: 330, y: 432, width: 70, height: 12, type: 'water' },
          { id: 'h-acid-1', x: 450, y: 432, width: 120, height: 12, type: 'acid' },
        ],
        plates: [
          { id: 'p-3', x: 400, y: 134, width: 36, height: 6 },
        ],
        gems: [
          { id: 'g-pup-1', x: 170, y: 400, type: 'fire' },
          { id: 'g-kitty-1', x: 360, y: 400, type: 'water' },
          { id: 'g-pup-2', x: 130, y: 250, type: 'fire' },
          { id: 'g-kitty-2', x: 330, y: 180, type: 'water' },
        ],
      };
  }
}

export function initFireboyWatergirlGame(levelIndex: number = 1): FireboyWatergirlState {
  const config = getCoopLevelConfig(levelIndex);

  const pup: CharacterState = {
    x: config.pupStart.x,
    y: config.pupStart.y,
    vx: 0,
    vy: 0,
    width: CHAR_WIDTH,
    height: CHAR_HEIGHT,
    isGrounded: false,
    facing: 1,
    alive: true,
    atExit: false,
  };

  const kitty: CharacterState = {
    x: config.kittyStart.x,
    y: config.kittyStart.y,
    vx: 0,
    vy: 0,
    width: CHAR_WIDTH,
    height: CHAR_HEIGHT,
    isGrounded: false,
    facing: 1,
    alive: true,
    atExit: false,
  };

  const plates = config.plates.map((p) => ({
    ...p,
    isPressed: false,
  }));

  const gems = config.gems.map((g) => ({
    id: g.id,
    x: g.x,
    y: g.y,
    radius: 9,
    type: g.type,
    collected: false,
  }));

  return {
    levelIndex,
    pup,
    kitty,
    platforms: config.platforms,
    hazards: config.hazards,
    plates,
    gems,
    pupDoor: { ...config.pupDoor, width: 36, height: 48, type: 'fire' },
    kittyDoor: { ...config.kittyDoor, width: 36, height: 48, type: 'water' },
    status: 'playing',
    totalLevels: TOTAL_COOP_LEVELS,
  };
}

function updateCharacterPhysics(
  char: CharacterState,
  input: CharacterInput,
  platforms: Platform[],
  dt: number
): CharacterState {
  if (!char.alive) return char;

  const next = { ...char };

  // Horizontal acceleration
  if (input.left) {
    next.vx = -MOVE_SPEED;
    next.facing = -1;
  } else if (input.right) {
    next.vx = MOVE_SPEED;
    next.facing = 1;
  } else {
    next.vx = 0;
  }

  // Jump
  if (input.jump && next.isGrounded) {
    next.vy = JUMP_SPEED;
    next.isGrounded = false;
  }

  // Gravity
  next.vy += GRAVITY * dt;

  // Move X & Collide
  next.x += next.vx * dt;
  for (const plat of platforms) {
    if (checkAABBOverlap(next.x, next.y, next.width, next.height, plat.x, plat.y, plat.width, plat.height)) {
      if (next.vx > 0) {
        next.x = plat.x - next.width;
      } else if (next.vx < 0) {
        next.x = plat.x + plat.width;
      }
      next.vx = 0;
    }
  }

  // Move Y & Collide
  next.y += next.vy * dt;
  next.isGrounded = false;

  for (const plat of platforms) {
    if (checkAABBOverlap(next.x, next.y, next.width, next.height, plat.x, plat.y, plat.width, plat.height)) {
      if (next.vy > 0) {
        // Landing on platform
        next.y = plat.y - next.height;
        next.vy = 0;
        next.isGrounded = true;
      } else if (next.vy < 0) {
        // Hitting ceiling
        next.y = plat.y + plat.height;
        next.vy = 0;
      }
    }
  }

  return next;
}

function checkAABBOverlap(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

export function stepFireboyWatergirlGame(
  state: FireboyWatergirlState,
  input: DualInput,
  dt: number
): {
  state: FireboyWatergirlState;
  event?: 'gem' | 'plate' | 'die' | 'clear' | 'victory';
} {
  if (state.status !== 'playing') {
    return { state };
  }

  const safeDt = Math.min(dt, 0.05);
  let event: 'gem' | 'plate' | 'die' | 'clear' | 'victory' | undefined;

  // 1. Update Pressure Plates
  const plates = state.plates.map((plate) => {
    const pupOver = checkAABBOverlap(
      state.pup.x,
      state.pup.y,
      state.pup.width,
      state.pup.height + 2,
      plate.x,
      plate.y,
      plate.width,
      plate.height + 4
    );
    const kittyOver = checkAABBOverlap(
      state.kitty.x,
      state.kitty.y,
      state.kitty.width,
      state.kitty.height + 2,
      plate.x,
      plate.y,
      plate.width,
      plate.height + 4
    );
    const isPressed = pupOver || kittyOver;
    return { ...plate, isPressed };
  });

  // 2. Active Platform Geometry (Open doors slide)
  const activePlatforms = state.platforms.map((plat) => {
    if (plat.requiresPlateId) {
      const parentPlate = plates.find((p) => p.id === plat.requiresPlateId);
      if (parentPlate?.isPressed && plat.openOffsetY) {
        return {
          ...plat,
          y: plat.y + plat.openOffsetY,
        };
      }
    }
    return plat;
  });

  // 3. Update Character Physics
  const pup = updateCharacterPhysics(state.pup, input.pup, activePlatforms, safeDt);
  const kitty = updateCharacterPhysics(state.kitty, input.kitty, activePlatforms, safeDt);

  // 4. Hazard Collisions
  let status: FireboyWatergirlState['status'] = state.status;

  for (const h of state.hazards) {
    const pupHit = checkAABBOverlap(pup.x, pup.y, pup.width, pup.height, h.x, h.y, h.width, h.height);
    const kittyHit = checkAABBOverlap(kitty.x, kitty.y, kitty.width, kitty.height, h.x, h.y, h.width, h.height);

    // Pup is hurt by water or acid
    if (pupHit && (h.type === 'water' || h.type === 'acid')) {
      pup.alive = false;
      status = 'failed';
      event = 'die';
    }

    // Kitty is hurt by lava or acid
    if (kittyHit && (h.type === 'lava' || h.type === 'acid')) {
      kitty.alive = false;
      status = 'failed';
      event = 'die';
    }
  }

  // 5. Gem Collection
  const gems = state.gems.map((g) => {
    if (g.collected) return g;

    if (g.type === 'fire') {
      const dist = Math.hypot(pup.x + pup.width / 2 - g.x, pup.y + pup.height / 2 - g.y);
      if (dist < g.radius + pup.width / 2) {
        event = 'gem';
        return { ...g, collected: true };
      }
    } else if (g.type === 'water') {
      const dist = Math.hypot(kitty.x + kitty.width / 2 - g.x, kitty.y + kitty.height / 2 - g.y);
      if (dist < g.radius + kitty.width / 2) {
        event = 'gem';
        return { ...g, collected: true };
      }
    }
    return g;
  });

  // 6. Exit Doors
  pup.atExit = checkAABBOverlap(
    pup.x,
    pup.y,
    pup.width,
    pup.height,
    state.pupDoor.x,
    state.pupDoor.y,
    state.pupDoor.width,
    state.pupDoor.height
  );

  kitty.atExit = checkAABBOverlap(
    kitty.x,
    kitty.y,
    kitty.width,
    kitty.height,
    state.kittyDoor.x,
    state.kittyDoor.y,
    state.kittyDoor.width,
    state.kittyDoor.height
  );

  if (status === 'playing' && pup.atExit && kitty.atExit) {
    if (state.levelIndex >= state.totalLevels) {
      status = 'victory';
      event = 'victory';
    } else {
      status = 'level_cleared';
      event = 'clear';
    }
  }

  return {
    state: {
      ...state,
      pup,
      kitty,
      platforms: activePlatforms,
      plates,
      gems,
      status,
    },
    event,
  };
}

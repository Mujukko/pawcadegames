import {
  Door,
  Hazard,
  LevelDevilInput,
  LevelDevilPlayer,
  LevelDevilState,
  Platform,
} from './types';

export const WORLD_WIDTH = 800;
export const WORLD_HEIGHT = 480;
export const GRAVITY = 980;
export const MOVE_SPEED = 240;
export const JUMP_FORCE = -460;
export const TOTAL_LEVELS = 6;

export function createInitialPlayer(startX: number = 60, startY: number = 380): LevelDevilPlayer {
  return {
    x: startX,
    y: startY,
    vx: 0,
    vy: 0,
    width: 24,
    height: 28,
    onGround: false,
    alive: true,
    reachedDoor: false,
    facing: 'right',
    controlsInverted: false,
  };
}

export function getLevelConfig(levelIndex: number): {
  playerStart: { x: number; y: number };
  door: Door;
  decoyDoor?: Door;
  platforms: Platform[];
  hazards: Hazard[];
  title: string;
} {
  switch (levelIndex) {
    case 1: // Level 1: "Easy Peasy" - crumbling bridge trap right before door
      return {
        title: 'Level 1: The Trust Test',
        playerStart: { x: 80, y: 380 },
        door: { x: 720, y: 360, width: 34, height: 48, originalX: 720, originalY: 360 },
        platforms: [
          { id: 'p_start', x: 0, y: 410, width: 320, height: 70, type: 'solid' },
          { id: 'p_troll', x: 320, y: 410, width: 140, height: 70, type: 'trap' },
          { id: 'p_end', x: 540, y: 410, width: 260, height: 70, type: 'solid' },
        ],
        hazards: [
          { id: 'h_pit', x: 460, y: 460, width: 80, height: 20, type: 'spike' },
        ],
      };

    case 2: // Level 2: "Door Jumper" - door teleports backward when approached
      return {
        title: 'Level 2: The Shy Barn Door',
        playerStart: { x: 80, y: 380 },
        door: { x: 720, y: 360, width: 34, height: 48, originalX: 720, originalY: 360 },
        platforms: [
          { id: 'p_floor', x: 0, y: 410, width: 800, height: 70, type: 'solid' },
          { id: 'p_step', x: 400, y: 320, width: 80, height: 20, type: 'solid' },
        ],
        hazards: [
          { id: 'h_mid', x: 380, y: 390, width: 40, height: 20, type: 'spike' },
        ],
      };

    case 3: // Level 3: "Look Up!" - falling stalactite ceiling spikes
      return {
        title: 'Level 3: Falling Ceiling Shingles',
        playerStart: { x: 80, y: 380 },
        door: { x: 720, y: 360, width: 34, height: 48, originalX: 720, originalY: 360 },
        platforms: [
          { id: 'p_floor', x: 0, y: 410, width: 800, height: 70, type: 'solid' },
        ],
        hazards: [
          { id: 'sp_1', x: 260, y: 60, width: 24, height: 32, type: 'falling_spike', triggerX: 200 },
          { id: 'sp_2', x: 420, y: 60, width: 24, height: 32, type: 'falling_spike', triggerX: 360 },
          { id: 'sp_3', x: 580, y: 60, width: 24, height: 32, type: 'falling_spike', triggerX: 520 },
        ],
      };

    case 4: // Level 4: "False Bottom" - vanishing stepping stones
      return {
        title: 'Level 4: Ghost Hay Bales',
        playerStart: { x: 80, y: 380 },
        door: { x: 720, y: 260, width: 34, height: 48, originalX: 720, originalY: 260 },
        platforms: [
          { id: 'p_start', x: 0, y: 410, width: 180, height: 70, type: 'solid' },
          { id: 'p_step1', x: 250, y: 360, width: 80, height: 20, type: 'solid' },
          { id: 'p_ghost', x: 390, y: 320, width: 90, height: 20, type: 'disappearing' },
          { id: 'p_step2', x: 530, y: 330, width: 80, height: 20, type: 'solid' },
          { id: 'p_end', x: 670, y: 310, width: 130, height: 170, type: 'solid' },
        ],
        hazards: [
          { id: 'h_floor_pit', x: 180, y: 460, width: 490, height: 20, type: 'spike' },
        ],
      };

    case 5: // Level 5: "Rainbow Confusion" - controls invert halfway
      return {
        title: 'Level 5: Dizzy Hayloft',
        playerStart: { x: 80, y: 380 },
        door: { x: 720, y: 360, width: 34, height: 48, originalX: 720, originalY: 360 },
        platforms: [
          { id: 'p_floor1', x: 0, y: 410, width: 360, height: 70, type: 'solid' },
          { id: 'p_floor2', x: 440, y: 410, width: 360, height: 70, type: 'solid' },
        ],
        hazards: [
          { id: 'h_gap_spike', x: 360, y: 460, width: 80, height: 20, type: 'spike' },
          { id: 'h_spike_trap', x: 560, y: 390, width: 36, height: 20, type: 'spike' },
        ],
      };

    case 6: // Level 6: "The Grand Finale" - decoy trap door + high ledge real door
    default:
      return {
        title: 'Level 6: The Decoy Exit',
        playerStart: { x: 80, y: 380 },
        door: { x: 420, y: 150, width: 34, height: 48, originalX: 420, originalY: 150 },
        decoyDoor: { x: 720, y: 360, width: 34, height: 48, originalX: 720, originalY: 360, isDecoy: true },
        platforms: [
          { id: 'p_floor', x: 0, y: 410, width: 800, height: 70, type: 'solid' },
          { id: 'p_high1', x: 180, y: 310, width: 100, height: 20, type: 'solid' },
          { id: 'p_high2', x: 340, y: 200, width: 160, height: 20, type: 'solid' },
        ],
        hazards: [
          { id: 'h_decoy_spike', x: 670, y: 390, width: 50, height: 20, type: 'spike' },
          { id: 'sp_high', x: 440, y: 40, width: 24, height: 32, type: 'falling_spike', triggerX: 380 },
        ],
      };
  }
}

export function initLevelDevilGame(levelIndex: number = 1, currentDeaths: number = 0): LevelDevilState {
  const safeLevel = Math.max(1, Math.min(TOTAL_LEVELS, levelIndex));
  const cfg = getLevelConfig(safeLevel);
  const player = createInitialPlayer(cfg.playerStart.x, cfg.playerStart.y);

  return {
    levelIndex: safeLevel,
    player,
    platforms: cfg.platforms.map((p) => ({ ...p, opacity: 1, dropVy: 0 })),
    hazards: cfg.hazards.map((h) => ({ ...h, vy: 0 })),
    door: { ...cfg.door, shifted: false },
    decoyDoor: cfg.decoyDoor ? { ...cfg.decoyDoor } : undefined,
    deaths: currentDeaths,
    status: 'playing',
    message: '',
    levelTitle: cfg.title,
  };
}

export function stepLevelDevilGame(
  state: LevelDevilState,
  input: LevelDevilInput,
  dt: number
): LevelDevilState {
  if (state.status !== 'playing') {
    return state;
  }

  const safeDt = Math.min(dt, 0.05);
  const player: LevelDevilPlayer = { ...state.player };
  let status: LevelDevilState['status'] = state.status;
  let deaths = state.deaths;
  let message = state.message;

  // 1. Process Input with Optional Inversion (Level 5)
  let moveX = 0;
  let moveLeft = Boolean(input.left);
  let moveRight = Boolean(input.right);

  // Trigger control inversion in Level 5 once player crosses x=380
  if (state.levelIndex === 5 && player.x >= 380) {
    player.controlsInverted = true;
  }

  if (player.controlsInverted) {
    const tmp = moveLeft;
    moveLeft = moveRight;
    moveRight = tmp;
  }

  if (moveLeft) {
    moveX -= 1;
    player.facing = 'left';
  }
  if (moveRight) {
    moveX += 1;
    player.facing = 'right';
  }

  player.vx = moveX * MOVE_SPEED;

  if (input.jump && player.onGround) {
    player.vy = JUMP_FORCE;
    player.onGround = false;
  }

  // 2. Gravity
  player.vy += GRAVITY * safeDt;

  // 3. Move Player X and check Platform/World Collisions
  player.x += player.vx * safeDt;
  if (player.x < 10) player.x = 10;
  if (player.x > WORLD_WIDTH - player.width - 10) player.x = WORLD_WIDTH - player.width - 10;

  // 4. Move Player Y
  player.y += player.vy * safeDt;
  player.onGround = false;

  // 5. Platform Logic & Troll Traps
  const platforms = state.platforms.map((plat) => {
    const p = { ...plat };

    // Trigger platform trap in Level 1 when player steps or approaches
    if (p.type === 'trap') {
      if (player.x >= p.x - 20 && player.x <= p.x + p.width + 20) {
        p.triggered = true;
      }
      if (p.triggered) {
        p.dropVy = (p.dropVy || 0) + GRAVITY * 1.5 * safeDt;
        p.y += p.dropVy * safeDt;
      }
    }

    // Disappearing platform in Level 4
    if (p.type === 'disappearing') {
      if (
        player.x + player.width > p.x &&
        player.x < p.x + p.width &&
        player.y + player.height >= p.y &&
        player.y + player.height <= p.y + 16
      ) {
        p.triggered = true;
      }
      if (p.triggered) {
        p.opacity = Math.max(0, (p.opacity ?? 1) - safeDt * 4);
      }
    }

    // Solid surface landing collision
    const isSolid = p.type === 'solid' || (p.type === 'trap' && !p.triggered) || (p.type === 'disappearing' && (p.opacity ?? 1) > 0.3);

    if (isSolid) {
      const pLeft = p.x;
      const pRight = p.x + p.width;
      const pTop = p.y;
      const pBottom = p.y + p.height;

      const playerBottom = player.y + player.height;
      const playerPrevBottom = playerBottom - player.vy * safeDt;

      // Check landing on top
      if (
        player.x + player.width > pLeft + 4 &&
        player.x < pRight - 4 &&
        playerBottom >= pTop &&
        playerPrevBottom <= pTop + 14 &&
        player.vy >= 0
      ) {
        player.y = pTop - player.height;
        player.vy = 0;
        player.onGround = true;
      }
    }

    return p;
  });

  // 6. Hazard Logic & Spikes
  let hitHazard = false;
  const hazards = state.hazards.map((haz) => {
    const h = { ...haz };

    // Falling spikes trigger when player walks under triggerX
    if (h.type === 'falling_spike') {
      if (!h.triggered && h.triggerX !== undefined && player.x >= h.triggerX) {
        h.triggered = true;
      }
      if (h.triggered) {
        h.vy = (h.vy || 0) + GRAVITY * 2.2 * safeDt;
        h.y += h.vy * safeDt;
      }
    }

    // AABB collision check
    if (
      player.x + player.width - 6 > h.x &&
      player.x + 6 < h.x + h.width &&
      player.y + player.height > h.y + 4 &&
      player.y < h.y + h.height
    ) {
      hitHazard = true;
    }

    return h;
  });

  // 7. Door Logic & Troll Shifts (Level 2)
  let door = { ...state.door };
  if (state.levelIndex === 2 && !door.shifted && player.x >= 520) {
    door.shifted = true;
    door.x = 220; // Teleport back!
    message = 'Gotcha! The door ran away!';
  }

  // 8. Death Check (Hazard or Fell into Abyss)
  if (hitHazard || player.y > WORLD_HEIGHT + 40) {
    player.alive = false;
    deaths += 1;
    status = 'died';
    message = getRandomTaunt();
    return {
      ...state,
      player,
      platforms,
      hazards,
      door,
      deaths,
      status,
      message,
    };
  }

  // 9. Goal Reached Check
  const distToDoor = Math.hypot(
    player.x + player.width / 2 - (door.x + door.width / 2),
    player.y + player.height / 2 - (door.y + door.height / 2)
  );

  if (distToDoor < 34) {
    player.reachedDoor = true;
    if (state.levelIndex >= TOTAL_LEVELS) {
      status = 'victory';
      message = `Incredible! You beat all ${TOTAL_LEVELS} troll levels in ${deaths} deaths!`;
    } else {
      status = 'level_cleared';
      message = 'Stage Cleared! Get ready for more mischief!';
    }
  }

  return {
    ...state,
    player,
    platforms,
    hazards,
    door,
    deaths,
    status,
    message,
  };
}

export function getRandomTaunt(): string {
  const taunts = [
    'Ouch! Did not see that coming, did you?',
    'Classic trap! Try again!',
    'The meadow never forgives an easy step!',
    'Sneaky! Watch your footing!',
    'Almost had it! Remember where the trap is!',
  ];
  return taunts[Math.floor(Math.random() * taunts.length)];
}

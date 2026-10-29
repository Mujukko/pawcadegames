import {
  FrogGameState,
  FrogPlayer,
  FrogZoneConfig,
  LilyPad,
  PondInsect,
} from './types';

export const POND_ZONES: FrogZoneConfig[] = [
  {
    id: 'sunny-duck-pond',
    name: 'Sunny Duck Pond',
    totalLanes: 12,
    laneSpacing: 46,
    waterSpeed: 45,
  },
  {
    id: 'misty-marsh',
    name: 'Misty Cattail Marsh',
    totalLanes: 15,
    laneSpacing: 44,
    waterSpeed: 60,
  },
  {
    id: 'golden-sunset-lagoon',
    name: 'Golden Sunset Lagoon',
    totalLanes: 18,
    laneSpacing: 42,
    waterSpeed: 80,
  },
];

export function createFrogGame(zoneIndex: number = 0): FrogGameState {
  const zone = POND_ZONES[zoneIndex] || POND_ZONES[0];

  const player: FrogPlayer = {
    x: 400,
    y: 540,
    targetX: 400,
    targetY: 540,
    isJumping: false,
    jumpProgress: 0,
    jumpHeight: 0,
    currentPadId: null,
    tongueActive: false,
    tongueTarget: null,
    tongueTimer: 0,
    lives: 3,
  };

  const pads: LilyPad[] = [];
  const insects: PondInsect[] = [];

  // Generate lily pads for each lane (1 to totalLanes - 1)
  for (let lane = 1; lane < zone.totalLanes; lane++) {
    const laneY = 540 - lane * zone.laneSpacing;
    const direction = lane % 2 === 0 ? 1 : -1;
    const speed = (zone.waterSpeed + (lane % 3) * 15) * direction;

    const padCount = 4 + (lane % 2);
    const spacing = 800 / padCount;

    for (let p = 0; p < padCount; p++) {
      const padX = p * spacing + (lane % 2 === 0 ? 30 : 60);
      const isLog = lane % 4 === 0;
      const isSinking = lane % 3 === 0 && !isLog;

      const padId = `pad-${lane}-${p}`;
      pads.push({
        id: padId,
        lane,
        x: padX,
        y: laneY,
        radius: isLog ? 40 : 26,
        width: isLog ? 84 : undefined,
        height: isLog ? 28 : undefined,
        type: isLog ? 'drifting_log' : isSinking ? 'sinking' : 'standard',
        vx: speed,
        sinkTimer: 1.6,
        isSunk: false,
        hasLanded: false,
      });

      // Spawn insect on some pads
      if ((lane + p) % 3 === 0) {
        insects.push({
          id: `bug-${lane}-${p}`,
          x: padX,
          y: laneY - 14,
          type: lane % 4 === 0 ? 'dragonfly' : 'fly',
          points: lane % 4 === 0 ? 250 : 100,
          collected: false,
        });
      }
    }
  }

  return {
    zone,
    status: 'playing',
    score: 0,
    fliesEaten: 0,
    furthestLane: 0,
    player,
    pads,
    insects,
    heron: null,
    events: [],
  };
}

export function hopFrog(state: FrogGameState, dir: 'up' | 'left' | 'right' | 'down'): FrogGameState {
  if (state.status !== 'playing' || state.player.isJumping) return state;

  const player = { ...state.player };
  const stepY = state.zone.laneSpacing;
  const stepX = 55;

  let targetX = player.x;
  let targetY = player.y;

  if (dir === 'up') targetY -= stepY;
  else if (dir === 'down') targetY += stepY;
  else if (dir === 'left') targetX -= stepX;
  else if (dir === 'right') targetX += stepX;

  // Boundary clamp
  targetX = Math.max(30, Math.min(770, targetX));
  targetY = Math.max(40, Math.min(540, targetY));

  player.targetX = targetX;
  player.targetY = targetY;
  player.isJumping = true;
  player.jumpProgress = 0;
  player.currentPadId = null;

  return {
    ...state,
    player,
    events: [{ type: 'frog_hop' }],
  };
}

export function flickTongue(state: FrogGameState): FrogGameState {
  if (state.status !== 'playing' || state.player.tongueActive) return state;

  // Find nearest uncollected insect within tongue range (130px)
  let nearestBug: PondInsect | null = null;
  let minDist = 130;

  state.insects.forEach((bug) => {
    if (bug.collected) return;
    const dx = bug.x - state.player.x;
    const dy = bug.y - state.player.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearestBug = bug;
    }
  });

  const player = { ...state.player };
  player.tongueActive = true;
  player.tongueTimer = 0.25;

  if (nearestBug) {
    player.tongueTarget = { x: (nearestBug as PondInsect).x, y: (nearestBug as PondInsect).y };
    const bugPoints = (nearestBug as PondInsect).points;

    const updatedInsects = state.insects.map((b) =>
      b.id === (nearestBug as PondInsect).id ? { ...b, collected: true } : b
    );

    return {
      ...state,
      player,
      score: state.score + bugPoints,
      fliesEaten: state.fliesEaten + 1,
      insects: updatedInsects,
      events: [{ type: 'catch_fly', points: bugPoints }],
    };
  }

  // Tongue shot with no bug
  player.tongueTarget = { x: player.x, y: player.y - 70 };
  return {
    ...state,
    player,
    events: [{ type: 'tongue_flick' }],
  };
}

export function updateFrogGame(state: FrogGameState, rawDt: number): FrogGameState {
  if (state.status !== 'playing') return state;
  const dt = Math.min(rawDt, 0.05);
  const events: Array<{ type: string; points?: number; text?: string }> = [];

  const player = { ...state.player };
  let nextScore = state.score;
  let nextFurthest = state.furthestLane;

  // Tongue timer
  if (player.tongueActive) {
    player.tongueTimer -= dt;
    if (player.tongueTimer <= 0) {
      player.tongueActive = false;
      player.tongueTarget = null;
    }
  }

  // Update Lily Pads drift
  const updatedPads = state.pads.map((pad) => {
    const updated = { ...pad };
    updated.x += updated.vx * dt;

    // Wrap around screen boundaries
    if (updated.vx > 0 && updated.x > 860) {
      updated.x = -60;
    } else if (updated.vx < 0 && updated.x < -60) {
      updated.x = 860;
    }

    // Sinking pads countdown if player is on it
    if (updated.id === player.currentPadId && updated.type === 'sinking') {
      updated.sinkTimer -= dt;
      if (updated.sinkTimer <= 0) {
        updated.isSunk = true;
      }
    }

    return updated;
  });

  // Jump animation physics
  if (player.isJumping) {
    player.jumpProgress += dt * 4.2; // ~0.24s jump duration
    const t = Math.min(1, player.jumpProgress);
    player.jumpHeight = Math.sin(t * Math.PI) * 28;

    // Interpolate position
    player.x = player.x + (player.targetX - player.x) * t;
    player.y = player.y + (player.targetY - player.y) * t;

    if (player.jumpProgress >= 1) {
      player.isJumping = false;
      player.jumpProgress = 0;
      player.jumpHeight = 0;
      player.x = player.targetX;
      player.y = player.targetY;

      // Check landing zone
      // 1. Check if landed on starting bank (y >= 520) or goal bank (y <= 70)
      if (player.y >= 520) {
        player.currentPadId = null;
      } else if (player.y <= 70) {
        // Reached opposite victory bank!
        events.push({ type: 'victory_crossing', points: 1000 });
        return {
          ...state,
          status: 'won',
          score: nextScore + 1000,
          events,
        };
      } else {
        // Must land on an active lily pad or log
        let landedPad: LilyPad | null = null;
        for (const pad of updatedPads) {
          if (pad.isSunk) continue;

          if (pad.type === 'drifting_log' && pad.width && pad.height) {
            const inX = Math.abs(player.x - pad.x) <= pad.width * 0.55;
            const inY = Math.abs(player.y - pad.y) <= pad.height * 0.7;
            if (inX && inY) {
              landedPad = pad;
              break;
            }
          } else {
            const dx = player.x - pad.x;
            const dy = player.y - pad.y;
            if (Math.sqrt(dx * dx + dy * dy) <= pad.radius + 12) {
              landedPad = pad;
              break;
            }
          }
        }

        if (landedPad) {
          player.currentPadId = (landedPad as LilyPad).id;
          events.push({ type: 'land_pad' });

          // Score bonus for advancing to higher lanes
          const currentLane = Math.round((540 - player.y) / state.zone.laneSpacing);
          if (currentLane > nextFurthest) {
            nextScore += (currentLane - nextFurthest) * 50;
            nextFurthest = currentLane;
          }
        } else {
          // Frog fell in the water (drowned splash!)
          player.lives -= 1;
          events.push({ type: 'splash_water' });

          if (player.lives <= 0) {
            return {
              ...state,
              status: 'drowned',
              score: nextScore,
              events: [...events, { type: 'game_over' }],
            };
          } else {
            // Respawn at starting bank
            player.x = 400;
            player.y = 540;
            player.targetX = 400;
            player.targetY = 540;
            player.currentPadId = null;
          }
        }
      }
    }
  } else if (player.currentPadId) {
    // Frog drifts horizontally along with current pad!
    const activePad = updatedPads.find((p) => p.id === player.currentPadId);
    if (activePad) {
      if (activePad.isSunk) {
        // Pad sunk underneath frog!
        player.lives -= 1;
        events.push({ type: 'splash_water' });
        if (player.lives <= 0) {
          return {
            ...state,
            status: 'drowned',
            score: nextScore,
            events: [...events, { type: 'game_over' }],
          };
        } else {
          player.x = 400;
          player.y = 540;
          player.currentPadId = null;
        }
      } else {
        player.x += activePad.vx * dt;
        player.targetX = player.x;

        // Fall off edge of screen
        if (player.x < 15 || player.x > 785) {
          player.lives -= 1;
          events.push({ type: 'splash_water' });
          if (player.lives <= 0) {
            return { ...state, status: 'drowned', score: nextScore, events };
          }
          player.x = 400;
          player.y = 540;
          player.currentPadId = null;
        }
      }
    }
  }

  // Update floating insects along with their parent pads
  const updatedInsects = state.insects.map((bug) => {
    if (bug.collected) return bug;
    // Mild bobbing flutter
    const bobY = Math.sin(Date.now() * 0.008 + bug.x) * 0.4;
    return { ...bug, y: bug.y + bobY };
  });

  return {
    ...state,
    score: nextScore,
    furthestLane: nextFurthest,
    player,
    pads: updatedPads,
    insects: updatedInsects,
    events,
  };
}

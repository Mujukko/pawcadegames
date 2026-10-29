import {
  StealthGameState,
  FoxPlayer,
  GuardDog,
  SecurityCamera,
  LaserTripwire,
  LockedDoor,
  LootItem,
  StealthInput,
  StealthLevelData,
} from './types';
import { ALL_STEALTH_LEVELS } from './levels';

export const PLAYER_WALK_SPEED = 145;
export const PLAYER_CLIMB_SPEED = 110;
export const ALARM_GRACE_TIME = 8.0; // 8 seconds countdown before dog catches you

export function initStealthGame(
  levelIndex = 0,
  unlockedLevels = 1,
  levelBestTimes = [999, 999, 999]
): StealthGameState {
  const safeIdx = Math.max(0, Math.min(levelIndex, ALL_STEALTH_LEVELS.length - 1));
  const level = ALL_STEALTH_LEVELS[safeIdx];

  const player: FoxPlayer = {
    x: level.playerStartX,
    y: level.playerStartY,
    vx: 0,
    floor: level.playerStartFloor,
    direction: 'right',
    isHiding: false,
    isClimbing: false,
    isPickingLock: false,
    pickProgress: 0,
    keysHeld: {
      bronze: false,
      silver: false,
      gold: false,
    },
  };

  const guards: GuardDog[] = level.guards.map(g => ({ ...g }));
  const cameras: SecurityCamera[] = level.cameras.map(c => ({ ...c }));
  const lasers: LaserTripwire[] = level.lasers.map(l => ({ ...l }));
  const doors: LockedDoor[] = level.doors.map(d => ({ ...d }));
  const loot: LootItem[] = level.loot.map(item => ({ ...item }));

  return {
    levelIndex: safeIdx,
    status: 'ready',
    elapsedTime: 0,
    collectedLootValue: 0,
    alarmTriggered: false,
    alarmCountdown: ALARM_GRACE_TIME,
    player,
    guards,
    cameras,
    lasers,
    doors,
    loot,
    unlockedLevels: Math.max(1, unlockedLevels),
    levelBestTimes,
  };
}

export function stepStealthGame(
  state: StealthGameState,
  input: StealthInput,
  dt: number
): StealthGameState {
  if (state.status === 'busted' || state.status === 'escaped') {
    return state;
  }

  const level = ALL_STEALTH_LEVELS[state.levelIndex];
  let nextStatus: StealthGameState['status'] = state.status;
  let nextElapsedTime = state.elapsedTime;
  let nextCollectedLoot = state.collectedLootValue;
  let alarmTriggered = state.alarmTriggered;
  let alarmCountdown = state.alarmCountdown;
  let unlockedLevels = state.unlockedLevels;
  const levelBestTimes = [...state.levelBestTimes];

  // Start on first movement / action
  if (state.status === 'ready') {
    if (input.moveLeft || input.moveRight || input.moveUp || input.moveDown || input.action) {
      nextStatus = 'playing';
    } else {
      return state;
    }
  }

  const fixedDt = Math.min(dt, 0.033);
  nextElapsedTime += fixedDt;

  const player: FoxPlayer = {
    ...state.player,
    keysHeld: { ...state.player.keysHeld },
  };

  // Current floor reference
  const currentFloor = level.floors.find(f => f.floorIndex === player.floor) || level.floors[0];

  // 1. Ladder Check & Climbing
  const activeLadder = level.ladders.find(
    lad =>
      Math.abs(player.x - lad.x) <= 16 &&
      (player.floor === lad.fromFloor || player.floor === lad.toFloor)
  );

  if (activeLadder && (input.moveUp || input.moveDown)) {
    player.isClimbing = true;
    player.x = activeLadder.x; // Snap to ladder column
    if (input.moveUp) {
      player.y -= PLAYER_CLIMB_SPEED * fixedDt;
      if (player.y <= activeLadder.topY) {
        player.y = activeLadder.topY;
        player.floor = activeLadder.toFloor;
        player.isClimbing = false;
      }
    } else if (input.moveDown) {
      player.y += PLAYER_CLIMB_SPEED * fixedDt;
      if (player.y >= activeLadder.bottomY) {
        player.y = activeLadder.bottomY;
        player.floor = activeLadder.fromFloor;
        player.isClimbing = false;
      }
    }
  } else if (!player.isClimbing) {
    player.y = currentFloor.y;
  }

  // 2. Horizontal Movement (when not climbing)
  if (!player.isClimbing) {
    player.vx = 0;
    if (input.moveLeft) {
      player.vx = -PLAYER_WALK_SPEED;
      player.direction = 'left';
    } else if (input.moveRight) {
      player.vx = PLAYER_WALK_SPEED;
      player.direction = 'right';
    }

    // Check locked door blocking
    let targetX = player.x + player.vx * fixedDt;
    for (const door of state.doors) {
      if (door.isLocked && door.floor === player.floor) {
        if (player.x < door.x && targetX >= door.x - 10) {
          targetX = door.x - 10;
        } else if (player.x > door.x && targetX <= door.x + 10) {
          targetX = door.x + 10;
        }
      }
    }

    // Floor boundaries
    targetX = Math.max(currentFloor.minX, Math.min(currentFloor.maxX, targetX));
    player.x = targetX;
  }

  // 3. Shadow Hiding Detection
  const inShadow = level.shadows.some(
    s =>
      s.floor === player.floor &&
      player.x >= s.x &&
      player.x <= s.x + s.width &&
      !player.isClimbing
  );
  // Hide if in shadow and holding down or stationary
  player.isHiding = inShadow && (input.moveDown || Math.abs(player.vx) === 0);

  // 4. Doors & Lockpicking
  const doors = state.doors.map(door => {
    const updated = { ...door };
    const nearDoor =
      updated.isLocked &&
      updated.floor === player.floor &&
      Math.abs(player.x - updated.x) <= 22;

    if (nearDoor) {
      // Key unlock
      if (
        (updated.requiredKeyType === 'bronze' && player.keysHeld.bronze) ||
        (updated.requiredKeyType === 'silver' && player.keysHeld.silver) ||
        (updated.requiredKeyType === 'gold' && player.keysHeld.gold)
      ) {
        updated.isLocked = false;
        player.isPickingLock = false;
        player.pickProgress = 0;
      } else if (input.action) {
        // Lockpicking with bobby pin
        player.isPickingLock = true;
        player.pickProgress = Math.min(
          1,
          player.pickProgress + fixedDt / updated.pickTimeSeconds
        );
        if (player.pickProgress >= 1) {
          updated.isLocked = false;
          player.isPickingLock = false;
          player.pickProgress = 0;
        }
      }
    }
    return updated;
  });

  if (!doors.some(d => d.isLocked && Math.abs(player.x - d.x) <= 22) || !input.action) {
    if (!input.action) {
      player.isPickingLock = false;
      player.pickProgress = 0;
    }
  }

  // 5. Loot Collection
  const loot = state.loot.map(item => {
    const updated = { ...item };
    if (!updated.collected && updated.floor === player.floor) {
      if (Math.abs(player.x - updated.x) <= 20) {
        updated.collected = true;
        nextCollectedLoot += updated.value;
        if (updated.type === 'key' && updated.keyType) {
          player.keysHeld[updated.keyType] = true;
        }
      }
    }
    return updated;
  });

  // 6. Guards Patrol AI & Knockout
  const guards = state.guards.map(guard => {
    const g = { ...guard };

    // Knockout check: player behind guard or sleeper
    if (input.action && g.floor === player.floor && Math.abs(player.x - g.x) <= 26) {
      const isBehind =
        (g.direction === 'right' && player.x < g.x) ||
        (g.direction === 'left' && player.x > g.x);
      if (g.state === 'sleeping' || isBehind) {
        g.state = 'knocked_out';
        g.knockoutTimer = 16.0;
      }
    }

    if (g.state === 'knocked_out') {
      if (g.knockoutTimer && g.knockoutTimer > 0) {
        g.knockoutTimer -= fixedDt;
        if (g.knockoutTimer <= 0) {
          g.state = 'patrolling';
        }
      }
      return g;
    }

    if (g.state === 'sleeping') {
      // Sleep stays sleeping unless alarm sounds
      if (alarmTriggered) {
        g.state = 'alerted';
      }
      return g;
    }

    // Patrolling Guard
    if (g.state === 'patrolling') {
      if (g.direction === 'right') {
        g.x += g.speed * fixedDt;
        if (g.x >= g.patrolMaxX) {
          g.x = g.patrolMaxX;
          g.direction = 'left';
        }
      } else {
        g.x -= g.speed * fixedDt;
        if (g.x <= g.patrolMinX) {
          g.x = g.patrolMinX;
          g.direction = 'right';
        }
      }

      // Check vision cone against player
      if (g.floor === player.floor && !player.isHiding) {
        const inFacing =
          (g.direction === 'right' && player.x > g.x && player.x - g.x <= g.visionRange) ||
          (g.direction === 'left' && player.x < g.x && g.x - player.x <= g.visionRange);

        if (inFacing) {
          g.state = 'alerted';
          alarmTriggered = true;
        }
      }
    }

    // Alerted Guard (chases player)
    if (g.state === 'alerted') {
      if (g.floor === player.floor) {
        const chaseDir = player.x > g.x ? 1 : -1;
        g.direction = chaseDir > 0 ? 'right' : 'left';
        g.x += chaseDir * (g.speed * 1.35) * fixedDt;

        // Caught check
        if (Math.abs(player.x - g.x) <= 22) {
          nextStatus = 'busted';
        }
      }
    }

    return g;
  });

  // 7. Security Cameras / Owl Spotlights
  const cameras = state.cameras.map(cam => {
    const c = { ...cam };
    if (!c.active) return c;

    c.angle += c.sweepSpeed * fixedDt;
    if (c.angle > c.maxAngle || c.angle < c.minAngle) {
      c.sweepSpeed = -c.sweepSpeed;
    }

    // Check if player is illuminated by camera cone
    if (c.floor === player.floor && !player.isHiding) {
      const coneX = c.x + Math.cos(c.angle) * c.range;
      if (Math.abs(player.x - coneX) <= 30) {
        alarmTriggered = true;
      }
    }
    return c;
  });

  // 8. Laser Tripwires
  const lasers = state.lasers.map(laser => {
    const l = { ...laser };
    if (l.active && l.floor === player.floor && !player.isHiding) {
      if (Math.abs(player.x - l.x1) <= 12) {
        alarmTriggered = true;
      }
    }
    return l;
  });

  // 9. Alarm Countdown
  if (alarmTriggered && nextStatus === 'playing') {
    alarmCountdown -= fixedDt;
    if (alarmCountdown <= 0) {
      nextStatus = 'busted';
    }
  }

  // 10. Escape / Win Condition
  if (
    player.floor === level.escapeFloor &&
    Math.abs(player.x - level.escapeX) <= 25 &&
    nextCollectedLoot >= level.targetLoot &&
    nextStatus === 'playing'
  ) {
    nextStatus = 'escaped';
    if (nextElapsedTime < levelBestTimes[state.levelIndex]) {
      levelBestTimes[state.levelIndex] = parseFloat(nextElapsedTime.toFixed(2));
    }
    if (state.levelIndex + 1 < ALL_STEALTH_LEVELS.length) {
      unlockedLevels = Math.max(unlockedLevels, state.levelIndex + 2);
    }
  }

  return {
    ...state,
    status: nextStatus,
    elapsedTime: nextElapsedTime,
    collectedLootValue: nextCollectedLoot,
    alarmTriggered,
    alarmCountdown: Math.max(0, alarmCountdown),
    player,
    guards,
    cameras,
    lasers,
    doors,
    loot,
    unlockedLevels,
    levelBestTimes,
  };
}

export function calculateStealthStars(
  levelIndex: number,
  elapsedTime: number,
  alarmTriggered: boolean
): number {
  const level = ALL_STEALTH_LEVELS[levelIndex] || ALL_STEALTH_LEVELS[0];
  if (!alarmTriggered && elapsedTime <= level.parTimeSeconds) return 3;
  if (elapsedTime <= level.parTimeSeconds * 1.5) return 2;
  return 1;
}

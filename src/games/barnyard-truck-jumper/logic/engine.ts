import {
  JumperGameState,
  GoatPlayer,
  TruckObstacle,
  OverheadArch,
  HighwayCoin,
  JumperInput,
  JumperLevelConfig,
} from './types';

export const GRAVITY = -680;
export const JUMP_IMPULSE = 280;
export const FORWARD_SPEED = 220; // Units/s
export const STRAFE_SPEED = 210;
export const PLAYER_HEIGHT_STAND = 32;
export const PLAYER_HEIGHT_SLIDE = 14;

export const JUMPER_LEVELS: JumperLevelConfig[] = [
  {
    id: 'lvl_1',
    name: 'Route 66 Morning Stampede',
    description: 'Leap across steady hay wagons and flatbed tractors under the golden morning sun!',
    targetMeters: 400,
    convoyDensity: 1.0,
    truckSpeed: 80,
  },
  {
    id: 'lvl_2',
    name: 'Canyon Overpass Switchback',
    description: 'Dodge low overhead timber signs and balance on swaying silver milk tankers!',
    targetMeters: 700,
    convoyDensity: 1.2,
    truckSpeed: 100,
  },
  {
    id: 'lvl_3',
    name: 'Interstate Storm Rush',
    description: 'Thunderstorm convoy with high-speed trailers, rain slicks, and narrow gap jumps!',
    targetMeters: 1000,
    convoyDensity: 1.4,
    truckSpeed: 125,
  },
];

export function generateInitialTrucks(level: JumperLevelConfig): TruckObstacle[] {
  const trucks: TruckObstacle[] = [];
  const types: TruckObstacle['type'][] = ['hay_wagon', 'flatbed', 'milk_tanker', 'livestock_crate'];

  // Start truck directly beneath player at z = 0
  trucks.push({
    id: 'truck_start',
    type: 'hay_wagon',
    x: 0,
    y: 0,
    z: -30,
    width: 64,
    length: 120,
    height: 38,
    speed: level.truckSpeed,
    swaySpeed: 1.2,
    swayAmplitude: 0,
    swayPhase: 0,
  });

  let currentZ = 120;
  let idCounter = 1;

  while (currentZ < level.targetMeters + 300) {
    const laneX = (Math.floor(Math.random() * 3) - 1) * 60; // -60, 0, +60
    const type = types[Math.floor(Math.random() * types.length)];
    const length = type === 'hay_wagon' ? 110 : type === 'flatbed' ? 90 : 100;
    const width = type === 'milk_tanker' ? 52 : 62;
    const height = type === 'flatbed' ? 30 : 38;

    trucks.push({
      id: `truck_${idCounter++}`,
      type,
      x: laneX,
      y: 0,
      z: currentZ,
      width,
      length,
      height,
      speed: level.truckSpeed + (Math.random() * 20 - 10),
      swaySpeed: 1.0 + Math.random() * 0.8,
      swayAmplitude: Math.random() < 0.4 ? 18 : 0,
      swayPhase: Math.random() * Math.PI * 2,
    });

    // Gap between trucks: 30 to 65 units (reachable with regular or double jump)
    currentZ += length + 35 + Math.random() * 30;
  }

  return trucks;
}

export function generateArches(targetMeters: number): OverheadArch[] {
  const arches: OverheadArch[] = [];
  let z = 180;
  let id = 1;
  while (z < targetMeters) {
    arches.push({
      id: `arch_${id++}`,
      name: 'LOW OVERHEAD SIGN',
      z,
      clearanceHeight: 46, // Requires ducking/sliding (roof 38 + slide 14 = 52 vs stand 38+32 = 70)
    });
    z += 220 + Math.random() * 100;
  }
  return arches;
}

export function generateCoins(trucks: TruckObstacle[]): HighwayCoin[] {
  const coins: HighwayCoin[] = [];
  trucks.forEach((t, idx) => {
    if (idx === 0) return;
    if (Math.random() < 0.7) {
      coins.push({
        id: `coin_${t.id}`,
        x: t.x,
        y: t.height + 15,
        z: t.z + t.length / 2,
        value: 50,
        collected: false,
      });
    }
  });
  return coins;
}

export function initJumperGame(
  levelIndex = 0,
  unlockedLevels = 1,
  bestDistances = [0, 0, 0]
): JumperGameState {
  const safeIdx = Math.max(0, Math.min(levelIndex, JUMPER_LEVELS.length - 1));
  const level = JUMPER_LEVELS[safeIdx];
  const trucks = generateInitialTrucks(level);
  const arches = generateArches(level.targetMeters);
  const coins = generateCoins(trucks);

  const player: GoatPlayer = {
    x: 0,
    y: 38, // Spawn standing on roof of start truck
    z: 10,
    vx: 0,
    vy: 0,
    vz: 0,
    isGrounded: true,
    currentTruckId: 'truck_start',
    jumpsRemaining: 2,
    isSliding: false,
    slideTimer: 0,
  };

  return {
    levelIndex: safeIdx,
    status: 'ready',
    distanceMeters: 0,
    targetMeters: level.targetMeters,
    score: 0,
    comboStreak: 1,
    highestCombo: 1,
    player,
    trucks,
    arches,
    coins,
    unlockedLevels: Math.max(1, unlockedLevels),
    bestDistances,
  };
}

export function stepJumperGame(
  state: JumperGameState,
  input: JumperInput,
  dt: number
): JumperGameState {
  if (state.status === 'fallen' || state.status === 'victory') {
    return state;
  }

  let nextStatus: JumperGameState['status'] = state.status;
  let score = state.score;
  let comboStreak = state.comboStreak;
  let highestCombo = state.highestCombo;
  let unlockedLevels = state.unlockedLevels;
  const bestDistances = [...state.bestDistances];

  // Start on first forward or action input
  if (state.status === 'ready') {
    if (input.moveLeft || input.moveRight || input.jump || input.slide) {
      nextStatus = 'playing';
    } else {
      return state;
    }
  }

  const fixedDt = Math.min(dt, 0.033);

  const player: GoatPlayer = { ...state.player };

  // 1. Sliding Mechanic
  if (input.slide && player.isGrounded) {
    player.isSliding = true;
    player.slideTimer = 0.6; // 600ms slide duration
  }
  if (player.slideTimer > 0) {
    player.slideTimer -= fixedDt;
    if (player.slideTimer <= 0) {
      player.isSliding = false;
    }
  }

  // 2. Jump Impulse (Handles double jump)
  if (input.jump && player.jumpsRemaining > 0) {
    player.vy = JUMP_IMPULSE;
    player.isGrounded = false;
    player.jumpsRemaining--;
    player.isSliding = false;
  }

  // 3. Horizontal Strafe
  player.vx = 0;
  if (input.moveLeft) player.vx = -STRAFE_SPEED;
  if (input.moveRight) player.vx = STRAFE_SPEED;

  player.x += player.vx * fixedDt;
  player.x = Math.max(-140, Math.min(140, player.x)); // Highway shoulders

  // 4. Forward Velocity & Gravity
  player.vz = FORWARD_SPEED;
  player.z += player.vz * fixedDt;

  player.vy += GRAVITY * fixedDt;
  player.y += player.vy * fixedDt;

  // 5. Update Truck Sway Positions
  const trucks = state.trucks.map(truck => {
    const t = { ...truck };
    if (t.swayAmplitude > 0) {
      t.swayPhase += t.swaySpeed * fixedDt;
      t.x += Math.sin(t.swayPhase) * t.swayAmplitude * fixedDt;
    }
    return t;
  });

  // 6. Truck Roof Collision Check
  let landedTruck: TruckObstacle | null = null;
  const playerHeight = player.isSliding ? PLAYER_HEIGHT_SLIDE : PLAYER_HEIGHT_STAND;

  for (const truck of trucks) {
    const onZ = player.z >= truck.z && player.z <= truck.z + truck.length;
    const onX = Math.abs(player.x - truck.x) <= truck.width / 2 + 6;
    const onY = player.y <= truck.height + 4 && player.y >= truck.height - 12;

    if (onZ && onX && onY && player.vy <= 0) {
      landedTruck = truck;
      break;
    }
  }

  if (landedTruck) {
    player.y = landedTruck.height;
    player.vy = 0;
    player.isGrounded = true;
    player.jumpsRemaining = 2; // Reset double jumps on landing

    // Check for truck-to-truck combo leap
    if (landedTruck.id !== player.currentTruckId) {
      comboStreak++;
      highestCombo = Math.max(highestCombo, comboStreak);
      score += 50 * comboStreak;
      player.currentTruckId = landedTruck.id;
    }
  } else {
    player.isGrounded = false;
  }

  // 7. Highway Floor Fall Check (Game Over)
  if (player.y <= 0) {
    nextStatus = 'fallen';
    comboStreak = 0;
  }

  // 8. Overhead Arch Collision
  for (const arch of state.arches) {
    if (Math.abs(player.z - arch.z) <= 18) {
      const totalHeadHeight = player.y + playerHeight;
      if (totalHeadHeight > arch.clearanceHeight && !player.isSliding) {
        // Slammed into overhead sign!
        nextStatus = 'fallen';
        comboStreak = 0;
        break;
      }
    }
  }

  // 9. Collect Highway Coins
  const coins = state.coins.map(coin => {
    const c = { ...coin };
    if (!c.collected && Math.abs(player.z - c.z) <= 24 && Math.abs(player.x - c.x) <= 24) {
      c.collected = true;
      score += c.value;
    }
    return c;
  });

  // 10. Distance & Victory Check
  const distanceMeters = Math.max(0, Math.floor(player.z));
  if (distanceMeters > bestDistances[state.levelIndex]) {
    bestDistances[state.levelIndex] = distanceMeters;
  }

  if (distanceMeters >= state.targetMeters && nextStatus === 'playing') {
    nextStatus = 'victory';
    score += 500 + comboStreak * 100;
    if (state.levelIndex + 1 < JUMPER_LEVELS.length) {
      unlockedLevels = Math.max(unlockedLevels, state.levelIndex + 2);
    }
  }

  return {
    ...state,
    status: nextStatus,
    distanceMeters,
    score,
    comboStreak,
    highestCombo,
    player,
    trucks,
    arches: state.arches,
    coins,
    unlockedLevels,
    bestDistances,
  };
}

export function calculateJumperStars(
  distance: number,
  targetDistance: number,
  highestCombo: number
): number {
  if (distance >= targetDistance && highestCombo >= 6) return 3;
  if (distance >= targetDistance) return 2;
  return 1;
}

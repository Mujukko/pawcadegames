import {
  StageId,
  StageConfig,
  VehicleInput,
  TractorHillClimbState,
  WheelState,
  TractorChassis,
  CoinPickup,
  FuelPickup,
  StuntEvent,
  GameStatus,
} from './types';

export const METERS_TO_WORLD = 12; // 1 meter = 12 world pixels
export const BASE_GROUND_Y = 360;

export const STAGES: Record<StageId, StageConfig> = {
  clover_pasture: {
    id: 'clover_pasture',
    name: 'Clover Pasture',
    themeColor: '#22c55e',
    targetMeters: 400,
    baseFriction: 0.98,
    hillsFrequency: 0.0035,
    hillsAmplitude: 55,
    description: 'Gentle sunlit pastures with rolling clover hills and easy jump ramps.',
  },
  autumn_orchard: {
    id: 'autumn_orchard',
    name: 'Autumn Orchard',
    themeColor: '#f97316',
    targetMeters: 500,
    baseFriction: 0.97,
    hillsFrequency: 0.0045,
    hillsAmplitude: 75,
    description: 'Bumpy apple knolls, hay bale drop ramps, and fallen leaf trails.',
  },
  windmill_ridge: {
    id: 'windmill_ridge',
    name: 'Windmill Ridge',
    themeColor: '#0ea5e9',
    targetMeters: 600,
    baseFriction: 0.96,
    hillsFrequency: 0.0055,
    hillsAmplitude: 95,
    description: 'Breezy highland peaks with suspension timber bridges over ravines.',
  },
  muddy_mountain: {
    id: 'muddy_mountain',
    name: 'Muddy Mountain',
    themeColor: '#a855f7',
    targetMeters: 700,
    baseFriction: 0.94,
    hillsFrequency: 0.0065,
    hillsAmplitude: 120,
    description: 'Challenging steep mountain ridges with slippery mud and rocky steps.',
  },
};

export const STAGE_ORDER: StageId[] = [
  'clover_pasture',
  'autumn_orchard',
  'windmill_ridge',
  'muddy_mountain',
];

/**
 * Calculates continuous terrain height at world coordinate x.
 * Lower y = higher in canvas (sky). Higher y = lower in canvas (ground).
 */
export function getTerrainHeight(x: number, stageId: StageId): number {
  const config = STAGES[stageId] || STAGES.clover_pasture;
  const freq = config.hillsFrequency;
  const amp = config.hillsAmplitude;

  // Flatten starting launch pad for first 200px
  if (x < 180) {
    return BASE_GROUND_Y;
  }
  const rampIn = Math.min(1, (x - 180) / 120);

  // Multi-octave undulating sine/cosine wave
  const wave1 = Math.sin(x * freq) * amp;
  const wave2 = Math.sin(x * freq * 2.3 + 1.2) * (amp * 0.35);
  const wave3 = Math.cos(x * freq * 0.45 + 0.6) * (amp * 0.25);

  let elevation = (wave1 + wave2 + wave3) * rampIn;

  // Special features per stage
  if (stageId === 'autumn_orchard') {
    // Hay ramp around x = 1400
    if (x >= 1350 && x <= 1450) {
      elevation -= Math.sin(((x - 1350) / 100) * Math.PI) * 35;
    }
  } else if (stageId === 'windmill_ridge') {
    // Wooden suspension bridge around x = 2000 to 2400
    if (x >= 2000 && x <= 2400) {
      const bridgeT = (x - 2000) / 400;
      elevation = -15 + Math.sin(bridgeT * Math.PI) * 20;
    }
  } else if (stageId === 'muddy_mountain') {
    // Sudden steep ramp around x = 2200
    if (x >= 2150 && x <= 2300) {
      elevation -= Math.sin(((x - 2150) / 150) * Math.PI) * 50;
    }
  }

  return BASE_GROUND_Y + elevation;
}

/**
 * Computes surface tangent angle and normal vector at world coordinate x.
 */
export function getTerrainSlope(x: number, stageId: StageId): { angle: number; normalX: number; normalY: number } {
  const eps = 1.0;
  const y1 = getTerrainHeight(x - eps, stageId);
  const y2 = getTerrainHeight(x + eps, stageId);
  const dy = y2 - y1;
  const dx = 2 * eps;
  const angle = Math.atan2(dy, dx);

  // Normal pointing upward into the air (away from ground)
  // Tangent = (cos(angle), sin(angle))
  // Normal pointing upward = (sin(angle), -cos(angle))
  const normalX = Math.sin(angle);
  const normalY = -Math.cos(angle);

  return { angle, normalX, normalY };
}

/**
 * Creates deterministic pickups (coins and fuel cans) for a stage.
 */
export function createPickups(stageId: StageId): { coins: CoinPickup[]; fuels: FuelPickup[] } {
  const config = STAGES[stageId];
  const maxWorldX = config.targetMeters * METERS_TO_WORLD + 400;

  const coins: CoinPickup[] = [];
  const fuels: FuelPickup[] = [];

  // Coins placed every 45 meters (approx 540px)
  let coinId = 0;
  for (let x = 320; x < maxWorldX; x += 180 + (coinId % 3) * 60) {
    const gy = getTerrainHeight(x, stageId);
    coins.push({
      id: `c_${stageId}_${coinId++}`,
      x,
      y: gy - 32, // floating just above ground
      value: 10,
      collected: false,
    });
  }

  // Fuel cans placed every 140 meters (approx 1680px)
  let fuelId = 0;
  for (let x = 850; x < maxWorldX; x += 1200 + (fuelId % 2) * 250) {
    const gy = getTerrainHeight(x, stageId);
    fuels.push({
      id: `f_${stageId}_${fuelId++}`,
      x,
      y: gy - 36,
      amount: 45,
      collected: false,
    });
  }

  return { coins, fuels };
}

/**
 * Initializes a new game state for a given stage.
 */
export function createInitialState(stageIndex: number = 0, bestDistance: number = 0): TractorHillClimbState {
  const clampedIndex = Math.max(0, Math.min(STAGE_ORDER.length - 1, stageIndex));
  const stageId = STAGE_ORDER[clampedIndex];
  const { coins, fuels } = createPickups(stageId);

  const startX = 120;
  const startGroundY = getTerrainHeight(startX, stageId);

  const rearWheel: WheelState = {
    offsetX: -26,
    offsetY: 16,
    radius: 18,
    worldX: startX - 26,
    worldY: startGroundY - 18,
    angularVel: 0,
    isGrounded: true,
    suspensionCompression: 0,
  };

  const frontWheel: WheelState = {
    offsetX: 26,
    offsetY: 20,
    radius: 14,
    worldX: startX + 26,
    worldY: startGroundY - 14,
    angularVel: 0,
    isGrounded: true,
    suspensionCompression: 0,
  };

  const chassis: TractorChassis = {
    x: startX,
    y: startGroundY - 36,
    vx: 0,
    vy: 0,
    angle: 0,
    angularVelocity: 0,
    width: 72,
    height: 42,
    rearWheel,
    frontWheel,
  };

  return {
    chassis,
    fuel: 100,
    maxFuel: 100,
    distance: 0,
    bestDistance,
    coins: 0,
    score: 0,
    stageId,
    stageIndex: clampedIndex,
    status: 'ready',
    airTime: 0,
    continuousAirRotation: 0,
    activeStunt: null,
    coinsList: coins,
    fuelList: fuels,
    timeElapsed: 0,
  };
}

/**
 * Updates wheel world positions based on chassis center and orientation.
 */
export function updateWheelWorldPositions(chassis: TractorChassis): void {
  const cos = Math.cos(chassis.angle);
  const sin = Math.sin(chassis.angle);

  // Rear wheel
  chassis.rearWheel.worldX = chassis.x + chassis.rearWheel.offsetX * cos - chassis.rearWheel.offsetY * sin;
  chassis.rearWheel.worldY = chassis.y + chassis.rearWheel.offsetX * sin + chassis.rearWheel.offsetY * cos;

  // Front wheel
  chassis.frontWheel.worldX = chassis.x + chassis.frontWheel.offsetX * cos - chassis.frontWheel.offsetY * sin;
  chassis.frontWheel.worldY = chassis.y + chassis.frontWheel.offsetX * sin + chassis.frontWheel.offsetY * cos;
}

/**
 * Checks if driver's head contacted the ground (crash condition).
 */
export function checkDriverHeadCrash(chassis: TractorChassis, stageId: StageId): boolean {
  const cos = Math.cos(chassis.angle);
  const sin = Math.sin(chassis.angle);

  // Driver head local offset (-6, -32) relative to chassis center
  const headX = chassis.x - 6 * cos - (-32) * sin;
  const headY = chassis.y - 6 * sin + (-32) * cos;

  const groundY = getTerrainHeight(headX, stageId);
  return headY >= groundY - 4;
}

/**
 * Primary physics and logic step (substepped internally for numerical stability).
 */
export function updateEngine(
  state: TractorHillClimbState,
  input: VehicleInput,
  dt: number
): TractorHillClimbState {
  if (state.status === 'crashed' || state.status === 'victory') {
    return state;
  }

  // Active status transitions to driving on first input or motion
  let status: GameStatus = state.status;
  if (status === 'ready' && (input.gas || input.brake)) {
    status = 'driving';
  }

  // Decay active stunt notification timer
  let activeStunt = state.activeStunt;
  if (activeStunt) {
    const remaining = activeStunt.duration - dt;
    if (remaining <= 0) {
      activeStunt = null;
    } else {
      activeStunt = { ...activeStunt, duration: remaining };
    }
  }

  let fuel = state.fuel;
  let score = state.score;
  let coins = state.coins;
  let airTime = state.airTime;
  let continuousAirRotation = state.continuousAirRotation;
  const chassis = {
    ...state.chassis,
    rearWheel: { ...state.chassis.rearWheel },
    frontWheel: { ...state.chassis.frontWheel },
  };

  // Fuel consumption
  if (status === 'driving') {
    const fuelRate = input.gas ? 2.5 : 0.4;
    fuel = Math.max(0, fuel - fuelRate * dt);
  }

  // Substepped physics (2 substeps per frame)
  const substeps = 2;
  const subDt = Math.min(0.033, dt) / substeps;
  const gravity = 550; // pixels / s^2

  for (let s = 0; s < substeps; s++) {
    // 1. Apply gravity
    chassis.vy += gravity * subDt;

    // 2. Air pitch control (when both wheels are off the ground)
    const bothInAir = !chassis.rearWheel.isGrounded && !chassis.frontWheel.isGrounded;
    if (bothInAir) {
      if (input.gas) {
        // Gas tilts nose up (counter-clockwise)
        chassis.angularVelocity -= 6.2 * subDt;
      }
      if (input.brake) {
        // Brake tilts nose down (clockwise)
        chassis.angularVelocity += 6.2 * subDt;
      }
      // Natural air drag
      chassis.angularVelocity *= 0.985;
    }

    // 3. Update positions
    chassis.x += chassis.vx * subDt;
    chassis.y += chassis.vy * subDt;
    chassis.angle += chassis.angularVelocity * subDt;

    // 4. Update wheel world coordinates
    updateWheelWorldPositions(chassis);

    // 5. Ground collision & suspension for each wheel
    let rearGrounded = false;
    let frontGrounded = false;

    // Physics parameters
    const springK = 220;
    const damperC = 14;
    const drivePower = fuel > 0 ? 380 : 0;
    const reversePower = fuel > 0 ? 190 : 0;

    // Evaluate rear wheel
    const rearGy = getTerrainHeight(chassis.rearWheel.worldX, state.stageId);
    const rearDepth = chassis.rearWheel.worldY + chassis.rearWheel.radius - rearGy;
    if (rearDepth > 0) {
      rearGrounded = true;
      const { normalX, normalY } = getTerrainSlope(chassis.rearWheel.worldX, state.stageId);
      chassis.rearWheel.suspensionCompression = Math.min(1, rearDepth / 20);

      // Spring + damper force
      const vNormal = chassis.vx * normalX + chassis.vy * normalY;
      const fSpring = springK * rearDepth - damperC * vNormal;
      const fNorm = Math.max(0, fSpring);

      chassis.vx += normalX * fNorm * subDt;
      chassis.vy += normalY * fNorm * subDt;

      // Traction along ground tangent
      const tanX = -normalY;
      const tanY = normalX;
      if (input.gas) {
        chassis.vx += tanX * drivePower * subDt;
        chassis.vy += tanY * drivePower * subDt;
        chassis.rearWheel.angularVel = 18;
      } else if (input.brake) {
        chassis.vx -= tanX * reversePower * subDt;
        chassis.vy -= tanY * reversePower * subDt;
        chassis.rearWheel.angularVel = -10;
      } else {
        // Ground friction
        chassis.vx *= 0.988;
      }

      // Wheel lever torque on chassis
      const rx = chassis.rearWheel.worldX - chassis.x;
      const ry = chassis.rearWheel.worldY - chassis.y;
      const torque = (rx * normalY - ry * normalX) * fNorm * 0.003;
      chassis.angularVelocity += torque * subDt;
    } else {
      chassis.rearWheel.suspensionCompression = 0;
    }

    // Evaluate front wheel
    const frontGy = getTerrainHeight(chassis.frontWheel.worldX, state.stageId);
    const frontDepth = chassis.frontWheel.worldY + chassis.frontWheel.radius - frontGy;
    if (frontDepth > 0) {
      frontGrounded = true;
      const { normalX, normalY } = getTerrainSlope(chassis.frontWheel.worldX, state.stageId);
      chassis.frontWheel.suspensionCompression = Math.min(1, frontDepth / 16);

      const vNormal = chassis.vx * normalX + chassis.vy * normalY;
      const fSpring = springK * frontDepth - damperC * vNormal;
      const fNorm = Math.max(0, fSpring);

      chassis.vx += normalX * fNorm * subDt;
      chassis.vy += normalY * fNorm * subDt;

      // Front wheel rolling friction
      chassis.vx *= 0.992;

      const rx = chassis.frontWheel.worldX - chassis.x;
      const ry = chassis.frontWheel.worldY - chassis.y;
      const torque = (rx * normalY - ry * normalX) * fNorm * 0.003;
      chassis.angularVelocity += torque * subDt;
    } else {
      chassis.frontWheel.suspensionCompression = 0;
    }

    chassis.rearWheel.isGrounded = rearGrounded;
    chassis.frontWheel.isGrounded = frontGrounded;

    // Angular damping
    chassis.angularVelocity *= 0.97;
  }

  // 6. Air-time and Stunt tracking
  const airborne = !chassis.rearWheel.isGrounded && !chassis.frontWheel.isGrounded;
  if (airborne) {
    airTime += dt;
    continuousAirRotation += chassis.angularVelocity * dt;

    // Check 360-degree backflip (accumulated rotation <= -2 * PI)
    if (continuousAirRotation <= -Math.PI * 1.85) {
      score += 500;
      continuousAirRotation += Math.PI * 2;
      activeStunt = {
        id: `stunt_${Date.now()}`,
        type: 'backflip',
        label: 'BACKFLIP! +500',
        points: 500,
        duration: 1.8,
      };
    } else if (continuousAirRotation >= Math.PI * 1.85) {
      score += 500;
      continuousAirRotation -= Math.PI * 2;
      activeStunt = {
        id: `stunt_${Date.now()}`,
        type: 'frontflip',
        label: 'FRONTFLIP! +500',
        points: 500,
        duration: 1.8,
      };
    }
  } else {
    // Just landed
    if (airTime >= 1.25) {
      const airPoints = Math.round(airTime * 120);
      score += airPoints;
      activeStunt = {
        id: `stunt_${Date.now()}`,
        type: 'big_air',
        label: `BIG AIR! +${airPoints}`,
        points: airPoints,
        duration: 1.6,
      };
    }
    airTime = 0;
    continuousAirRotation = 0;
  }

  // 7. Driver head crash detection
  if (checkDriverHeadCrash(chassis, state.stageId)) {
    status = 'crashed';
  }

  // 8. Distance calculation
  const currentMeters = Math.max(0, Math.floor((chassis.x - 120) / METERS_TO_WORLD));
  const distance = Math.max(state.distance, currentMeters);
  const bestDistance = Math.max(state.bestDistance, distance);

  // 9. Collect pickups
  const updatedCoins = state.coinsList.map((coin) => {
    if (coin.collected) return coin;
    const distSq = (coin.x - chassis.x) ** 2 + (coin.y - chassis.y) ** 2;
    if (distSq < 42 * 42) {
      coins += 1;
      score += coin.value;
      return { ...coin, collected: true };
    }
    return coin;
  });

  const updatedFuels = state.fuelList.map((f) => {
    if (f.collected) return f;
    const distSq = (f.x - chassis.x) ** 2 + (f.y - chassis.y) ** 2;
    if (distSq < 48 * 48) {
      fuel = Math.min(100, fuel + f.amount);
      score += 50;
      activeStunt = {
        id: `stunt_fuel_${Date.now()}`,
        type: 'fuel_boost',
        label: 'DIESEL REFILL! +50',
        points: 50,
        duration: 1.5,
      };
      return { ...f, collected: true };
    }
    return f;
  });

  // 10. Check out of fuel stop condition
  if (fuel <= 0 && Math.abs(chassis.vx) < 5 && !airborne && status === 'driving') {
    status = 'out_of_fuel';
  }

  // 11. Stage Victory check
  const config = STAGES[state.stageId];
  if (distance >= config.targetMeters && status !== 'crashed') {
    status = 'victory';
    score += 1000;
  }

  return {
    ...state,
    chassis,
    fuel,
    distance,
    bestDistance,
    coins,
    score,
    status,
    airTime,
    continuousAirRotation,
    activeStunt,
    coinsList: updatedCoins,
    fuelList: updatedFuels,
    timeElapsed: state.timeElapsed + dt,
  };
}

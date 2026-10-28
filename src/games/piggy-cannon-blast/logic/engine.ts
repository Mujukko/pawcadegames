import {
  CannonEvent,
  FlightUpgradeState,
  LaunchPhase,
  PiggyCannonState,
  SkyEntity,
} from './types';

export const GRAVITY = 360; // px/sec^2
export const GROUND_Y = 0; // ground altitude
export const UPGRADE_COSTS: Record<number, number> = {
  1: 0,
  2: 60,
  3: 150,
  4: 320,
  5: 650,
};

export const DEFAULT_UPGRADES: FlightUpgradeState = {
  cannonPower: 1,
  aerodynamics: 1,
  rocketNitro: 1,
  bouncyShoes: 1,
  coinMagnet: 1,
};

export function generateSkyEntities(endDistance = 8000): SkyEntity[] {
  const entities: SkyEntity[] = [];
  let idCounter = 1;

  for (let x = 200; x < endDistance; x += 90 + Math.random() * 60) {
    const roll = Math.random();
    if (roll < 0.45) {
      // Coins at various altitudes
      const y = 30 + Math.random() * 380;
      entities.push({
        id: `coin-${idCounter++}`,
        type: 'coin',
        x,
        y,
        radius: 14,
        collected: false,
      });
    } else if (roll < 0.60) {
      // Golden Balloons in sky
      const y = 120 + Math.random() * 320;
      entities.push({
        id: `balloon-${idCounter++}`,
        type: 'star_balloon',
        x,
        y,
        radius: 20,
        collected: false,
      });
    } else if (roll < 0.75) {
      // Fuel cans in sky
      const y = 80 + Math.random() * 260;
      entities.push({
        id: `fuel-${idCounter++}`,
        type: 'fuel_soda',
        x,
        y,
        radius: 16,
        collected: false,
      });
    } else if (roll < 0.85) {
      // Ground Bouncy Sheep
      entities.push({
        id: `sheep-${idCounter++}`,
        type: 'bouncy_sheep',
        x,
        y: 10,
        radius: 24,
      });
    } else if (roll < 0.94) {
      // Ground Hay Bale
      entities.push({
        id: `hay-${idCounter++}`,
        type: 'hay_bale',
        x,
        y: 10,
        radius: 22,
      });
    } else {
      // Ground Mud Puddle
      entities.push({
        id: `mud-${idCounter++}`,
        type: 'mud_puddle',
        x,
        y: 5,
        radius: 28,
      });
    }
  }

  return entities;
}

export function createInitialState(savedUpgrades?: FlightUpgradeState, savedTotalCoins = 0, savedBestDistance = 0): PiggyCannonState {
  const upgrades = savedUpgrades ? { ...savedUpgrades } : { ...DEFAULT_UPGRADES };
  const maxFuel = upgrades.rocketNitro; // 1 burst per level

  return {
    phase: 'aiming_angle',
    angleDeg: 45,
    angleDirection: 1,
    powerRatio: 0.1,
    powerDirection: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    fuelRemaining: maxFuel,
    maxFuel,
    bouncesRemaining: 2 + upgrades.bouncyShoes,
    distanceTraveled: 0,
    maxAltitude: 0,
    coinsEarnedThisRun: 0,
    totalCoins: savedTotalCoins,
    bestDistance: savedBestDistance,
    upgrades,
    entities: generateSkyEntities(),
    events: [],
    flightTime: 0,
  };
}

export function lockAngle(state: PiggyCannonState): PiggyCannonState {
  if (state.phase !== 'aiming_angle') return state;
  return {
    ...state,
    phase: 'charging_power',
    powerRatio: 0.1,
    powerDirection: 1,
    events: [],
  };
}

export function launchCannon(state: PiggyCannonState): PiggyCannonState {
  if (state.phase !== 'charging_power') return state;

  const baseSpeed = 460 + state.upgrades.cannonPower * 85;
  const launchSpeed = baseSpeed * Math.max(0.25, state.powerRatio);
  const rad = (state.angleDeg * Math.PI) / 180;

  const vx = Math.cos(rad) * launchSpeed;
  const vy = Math.sin(rad) * launchSpeed;

  const events: CannonEvent[] = [
    { type: 'cannon_fire', x: 0, y: 10, timestamp: 0 },
  ];

  return {
    ...state,
    phase: 'flying',
    x: 20,
    y: 20,
    vx,
    vy,
    rotation: rad,
    events,
  };
}

export function activateRocketNitro(state: PiggyCannonState): PiggyCannonState {
  if (state.phase !== 'flying' || state.fuelRemaining <= 0) return state;

  // Nitro impulse forward and upward
  const boostVx = 160;
  const boostVy = 200;

  const events: CannonEvent[] = [
    { type: 'rocket_boost', x: state.x, y: state.y, timestamp: state.flightTime },
  ];

  return {
    ...state,
    fuelRemaining: state.fuelRemaining - 1,
    vx: state.vx + boostVx,
    vy: Math.max(state.vy + boostVy, boostVy * 0.8),
    events,
  };
}

export function purchaseUpgrade(
  state: PiggyCannonState,
  upgradeType: keyof FlightUpgradeState
): PiggyCannonState {
  const currentLevel = state.upgrades[upgradeType];
  if (currentLevel >= 5) return state;

  const nextLevel = currentLevel + 1;
  const cost = UPGRADE_COSTS[nextLevel];
  if (state.totalCoins < cost) return state;

  const updatedUpgrades: FlightUpgradeState = {
    ...state.upgrades,
    [upgradeType]: nextLevel,
  };

  return {
    ...state,
    totalCoins: state.totalCoins - cost,
    upgrades: updatedUpgrades,
    maxFuel: updatedUpgrades.rocketNitro,
  };
}

export function resetFlight(state: PiggyCannonState): PiggyCannonState {
  const maxFuel = state.upgrades.rocketNitro;
  return {
    ...state,
    phase: 'aiming_angle',
    angleDeg: 45,
    angleDirection: 1,
    powerRatio: 0.1,
    powerDirection: 1,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    rotation: 0,
    fuelRemaining: maxFuel,
    maxFuel,
    bouncesRemaining: 2 + state.upgrades.bouncyShoes,
    distanceTraveled: 0,
    maxAltitude: 0,
    coinsEarnedThisRun: 0,
    entities: generateSkyEntities(),
    events: [],
    flightTime: 0,
  };
}

export function updateEngine(
  state: PiggyCannonState,
  input: { tilt: number; boost: boolean },
  dt: number
): PiggyCannonState {
  const clampedDt = Math.max(0.001, Math.min(dt, 0.1));
  const events: CannonEvent[] = [];

  // Phase 1: Aiming angle oscillation (15° to 75°)
  if (state.phase === 'aiming_angle') {
    let newAngle = state.angleDeg + state.angleDirection * 55 * clampedDt;
    let newDir = state.angleDirection;
    if (newAngle >= 75) {
      newAngle = 75;
      newDir = -1;
    } else if (newAngle <= 15) {
      newAngle = 15;
      newDir = 1;
    }
    return {
      ...state,
      angleDeg: newAngle,
      angleDirection: newDir,
      events,
    };
  }

  // Phase 2: Power charging oscillation (0.1 to 1.0)
  if (state.phase === 'charging_power') {
    let newPower = state.powerRatio + state.powerDirection * 1.5 * clampedDt;
    let newDir = state.powerDirection;
    if (newPower >= 1.0) {
      newPower = 1.0;
      newDir = -1;
    } else if (newPower <= 0.1) {
      newPower = 0.1;
      newDir = 1;
    }
    return {
      ...state,
      powerRatio: newPower,
      powerDirection: newDir,
      events,
    };
  }

  // Phase 3 & 4: Flying & Skidding
  if (state.phase === 'flying' || state.phase === 'skidding') {
    let stateCopy = { ...state };
    const flightTime = stateCopy.flightTime + clampedDt;

    // Check boost input
    if (input.boost && stateCopy.fuelRemaining > 0 && stateCopy.phase === 'flying') {
      stateCopy = activateRocketNitro(stateCopy);
      events.push(...stateCopy.events);
    }

    // Aerodynamics drag reduction (level 1 = 0.05, level 5 = 0.015)
    const dragCoeff = 0.055 - stateCopy.upgrades.aerodynamics * 0.008;

    // Air steering tilt (-1 dive for speed, +1 pull up for glide)
    if (stateCopy.phase === 'flying' && input.tilt !== 0) {
      stateCopy.rotation += input.tilt * 1.8 * clampedDt;
      // Pulling up gives a small vertical glide force
      if (input.tilt > 0 && stateCopy.vx > 100) {
        stateCopy.vy += 80 * clampedDt;
        stateCopy.vx -= 40 * clampedDt; // trade speed for altitude
      }
    } else if (stateCopy.phase === 'flying') {
      // Natural alignment with velocity vector
      const targetRot = Math.atan2(stateCopy.vy, stateCopy.vx);
      stateCopy.rotation += (targetRot - stateCopy.rotation) * 4.0 * clampedDt;
    }

    // Velocity update
    let newVx = stateCopy.vx - stateCopy.vx * dragCoeff * clampedDt;
    let newVy = stateCopy.vy - GRAVITY * clampedDt;

    let newX = stateCopy.x + newVx * clampedDt;
    let newY = stateCopy.y + newVy * clampedDt;

    let newCoinsEarned = stateCopy.coinsEarnedThisRun;
    let newTotalCoins = stateCopy.totalCoins;
    let newFuel = stateCopy.fuelRemaining;
    let newBounces = stateCopy.bouncesRemaining;
    let newPhase: LaunchPhase = stateCopy.phase;

    // Magnet radius for coins & collectibles (level 1 = 28px, level 5 = 110px)
    const magnetRadius = 24 + stateCopy.upgrades.coinMagnet * 18;

    // Collectibles & Obstacles Check
    const updatedEntities = stateCopy.entities.map((ent) => {
      if (ent.collected) return ent;

      const d = Math.hypot(newX - ent.x, newY - ent.y);

      // Magnet pull for coins/balloons/fuel
      if (d <= magnetRadius && (ent.type === 'coin' || ent.type === 'star_balloon' || ent.type === 'fuel_soda')) {
        const pullSpeed = 280 * clampedDt;
        const angle = Math.atan2(newY - ent.y, newX - ent.x);
        ent = {
          ...ent,
          x: ent.x + Math.cos(angle) * pullSpeed,
          y: ent.y + Math.sin(angle) * pullSpeed,
        };
      }

      // Direct collision
      if (d <= ent.radius + 18) {
        if (ent.type === 'coin') {
          newCoinsEarned += 10;
          newTotalCoins += 10;
          events.push({ type: 'coin_collect', x: ent.x, y: ent.y, value: 10, timestamp: flightTime });
          return { ...ent, collected: true };
        } else if (ent.type === 'star_balloon') {
          // Extra altitude bounce!
          newVy = Math.max(newVy + 260, 300);
          newVx += 80;
          newCoinsEarned += 25;
          newTotalCoins += 25;
          events.push({ type: 'balloon_pop', x: ent.x, y: ent.y, value: 25, timestamp: flightTime });
          return { ...ent, collected: true };
        } else if (ent.type === 'fuel_soda') {
          newFuel = Math.min(stateCopy.maxFuel, newFuel + 1);
          events.push({ type: 'fuel_collect', x: ent.x, y: ent.y, timestamp: flightTime });
          return { ...ent, collected: true };
        } else if (ent.type === 'bouncy_sheep' && newY <= 30) {
          // Trampoline mega bounce!
          newVy = 340 + stateCopy.upgrades.bouncyShoes * 35;
          newVx = Math.max(newVx, 180);
          events.push({ type: 'sheep_bounce', x: ent.x, y: ent.y, timestamp: flightTime });
        } else if (ent.type === 'hay_bale' && newY <= 30) {
          newVy = 220 + stateCopy.upgrades.bouncyShoes * 25;
          newVx += 40;
          events.push({ type: 'hay_bounce', x: ent.x, y: ent.y, timestamp: flightTime });
        } else if (ent.type === 'mud_puddle' && newY <= 15) {
          newVx *= 0.35;
          newVy = 0;
          newBounces = 0;
          events.push({ type: 'mud_splash', x: ent.x, y: ent.y, timestamp: flightTime });
        }
      }
      return ent;
    });

    // Ground Collision
    if (newY <= GROUND_Y) {
      newY = GROUND_Y;

      if (newBounces > 0 && Math.abs(newVy) > 80 && newVx > 40) {
        // Bounce!
        const bounceRetention = 0.40 + stateCopy.upgrades.bouncyShoes * 0.08;
        newVy = Math.abs(newVy) * bounceRetention;
        newVx *= 0.88;
        newBounces -= 1;
        events.push({ type: 'hay_bounce', x: newX, y: 0, timestamp: flightTime });
      } else {
        // Skidding along ground
        newVy = 0;
        newPhase = 'skidding';
        newVx = Math.max(0, newVx - 220 * clampedDt);
        stateCopy.rotation = 0;

        if (newVx <= 8) {
          newVx = 0;
          newPhase = 'landed';
          events.push({ type: 'flight_landed', x: newX, y: 0, timestamp: flightTime });
        }
      }
    }

    const currentDist = Math.round(newX);
    const newBest = Math.max(stateCopy.bestDistance, currentDist);
    const newMaxAlt = Math.max(stateCopy.maxAltitude, Math.round(newY));

    return {
      ...stateCopy,
      phase: newPhase,
      x: newX,
      y: newY,
      vx: newVx,
      vy: newVy,
      distanceTraveled: currentDist,
      maxAltitude: newMaxAlt,
      bestDistance: newBest,
      coinsEarnedThisRun: newCoinsEarned,
      totalCoins: newTotalCoins,
      fuelRemaining: newFuel,
      bouncesRemaining: newBounces,
      entities: updatedEntities,
      events,
      flightTime,
    };
  }

  // Phase 5: Landed
  return {
    ...state,
    events,
  };
}

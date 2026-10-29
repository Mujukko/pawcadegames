import {
  AnimalSpecies,
  ANIMALS,
  ClickerState,
  ClickUpgrade,
  HatAccessory,
  IdleBuilding,
  INITIAL_BUILDINGS,
  INITIAL_CLICK_UPGRADES,
  INITIAL_HATS,
} from './types';

export function createInitialState(saved?: Partial<ClickerState>): ClickerState {
  const clickUpgrades: Record<string, ClickUpgrade> = {};
  for (const up of INITIAL_CLICK_UPGRADES) {
    clickUpgrades[up.id] = { ...up };
  }

  const buildings: Record<string, IdleBuilding> = {};
  for (const b of INITIAL_BUILDINGS) {
    buildings[b.id] = { ...b };
  }

  const hats: Record<string, HatAccessory> = {};
  for (const h of INITIAL_HATS) {
    hats[h.id] = { ...h };
  }

  const defaultState: ClickerState = {
    produce: 0,
    lifetimeProduce: 0,
    selectedAnimal: 'corgi',
    clickUpgrades,
    buildings,
    hats,
    equippedHat: null,
    goldenEvent: {
      active: false,
      x: 50,
      y: 50,
      durationRemainingMs: 0,
      frenzyActive: false,
      frenzyRemainingMs: 0,
    },
    lastTickTimestamp: Date.now(),
    totalClicks: 0,
  };

  if (!saved) return defaultState;

  return {
    ...defaultState,
    ...saved,
    clickUpgrades: {
      ...defaultState.clickUpgrades,
      ...(saved.clickUpgrades || {}),
    },
    buildings: {
      ...defaultState.buildings,
      ...(saved.buildings || {}),
    },
    hats: {
      ...defaultState.hats,
      ...(saved.hats || {}),
    },
    goldenEvent: {
      ...defaultState.goldenEvent,
      ...(saved.goldenEvent || {}),
    },
  };
}

export function getUpgradeCost(upgrade: ClickUpgrade): number {
  return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.level));
}

export function getBuildingCost(building: IdleBuilding): number {
  return Math.floor(building.baseCost * Math.pow(building.costMultiplier, building.count));
}

export function calculateClickPower(state: ClickerState): number {
  let base = 1;
  for (const up of Object.values(state.clickUpgrades)) {
    base += up.level * up.powerBonus;
  }

  let multiplier = 1;
  if (state.equippedHat && state.hats[state.equippedHat]?.unlocked) {
    multiplier *= state.hats[state.equippedHat].clickMultiplier;
  }

  if (state.goldenEvent.frenzyActive) {
    multiplier *= 7; // 7x Golden Frenzy Multiplier!
  }

  return Math.floor(base * multiplier);
}

export function calculatePps(state: ClickerState): number {
  let basePps = 0;
  for (const b of Object.values(state.buildings)) {
    basePps += b.count * b.basePps;
  }

  if (state.goldenEvent.frenzyActive) {
    basePps *= 7; // 7x Golden Frenzy Multiplier!
  }

  return basePps;
}

export function isAnimalUnlocked(state: ClickerState, animal: AnimalSpecies): boolean {
  const config = ANIMALS[animal];
  if (!config) return false;
  return state.lifetimeProduce >= config.unlockThreshold;
}

export function handleClick(state: ClickerState): { state: ClickerState; amountAdded: number } {
  const clickPower = calculateClickPower(state);
  const nextProduce = state.produce + clickPower;
  const nextLifetime = state.lifetimeProduce + clickPower;
  const nextTotalClicks = state.totalClicks + 1;

  return {
    amountAdded: clickPower,
    state: {
      ...state,
      produce: nextProduce,
      lifetimeProduce: nextLifetime,
      totalClicks: nextTotalClicks,
    },
  };
}

export function buyClickUpgrade(state: ClickerState, upgradeId: string): ClickerState | null {
  const upgrade = state.clickUpgrades[upgradeId];
  if (!upgrade) return null;

  const cost = getUpgradeCost(upgrade);
  if (state.produce < cost) return null;

  return {
    ...state,
    produce: state.produce - cost,
    clickUpgrades: {
      ...state.clickUpgrades,
      [upgradeId]: {
        ...upgrade,
        level: upgrade.level + 1,
      },
    },
  };
}

export function buyBuilding(state: ClickerState, buildingId: string): ClickerState | null {
  const building = state.buildings[buildingId];
  if (!building) return null;

  const cost = getBuildingCost(building);
  if (state.produce < cost) return null;

  return {
    ...state,
    produce: state.produce - cost,
    buildings: {
      ...state.buildings,
      [buildingId]: {
        ...building,
        count: building.count + 1,
      },
    },
  };
}

export function buyHat(state: ClickerState, hatId: string): ClickerState | null {
  const hat = state.hats[hatId];
  if (!hat || hat.unlocked) return null;

  if (state.produce < hat.cost) return null;

  return {
    ...state,
    produce: state.produce - hat.cost,
    hats: {
      ...state.hats,
      [hatId]: {
        ...hat,
        unlocked: true,
      },
    },
    equippedHat: hatId, // Auto-equip when purchased
  };
}

export function equipHat(state: ClickerState, hatId: string | null): ClickerState {
  if (hatId === null) {
    return { ...state, equippedHat: null };
  }
  const hat = state.hats[hatId];
  if (!hat || !hat.unlocked) return state;

  return {
    ...state,
    equippedHat: hatId,
  };
}

export function selectAnimal(state: ClickerState, animalId: AnimalSpecies): ClickerState {
  if (!isAnimalUnlocked(state, animalId)) return state;
  return {
    ...state,
    selectedAnimal: animalId,
  };
}

export function spawnGoldenEvent(state: ClickerState, xPercent = 50, yPercent = 50): ClickerState {
  return {
    ...state,
    goldenEvent: {
      ...state.goldenEvent,
      active: true,
      x: Math.max(10, Math.min(90, xPercent)),
      y: Math.max(15, Math.min(85, yPercent)),
      durationRemainingMs: 12000, // 12 seconds to click before flying away
    },
  };
}

export function clickGoldenEvent(state: ClickerState): { state: ClickerState; bonusWon: number } {
  if (!state.goldenEvent.active) return { state, bonusWon: 0 };

  // Bonus: 15 seconds of 7x frenzy + instant reward (15 seconds of current PPS or 50 produce minimum)
  const pps = calculatePps(state);
  const bonusWon = Math.max(50, Math.floor(pps * 15));

  const nextProduce = state.produce + bonusWon;
  const nextLifetime = state.lifetimeProduce + bonusWon;

  return {
    bonusWon,
    state: {
      ...state,
      produce: nextProduce,
      lifetimeProduce: nextLifetime,
      goldenEvent: {
        ...state.goldenEvent,
        active: false,
        durationRemainingMs: 0,
        frenzyActive: true,
        frenzyRemainingMs: 15000, // 15 seconds 7x rush
      },
    },
  };
}

export function tickState(state: ClickerState, deltaMs: number, now = Date.now()): ClickerState {
  if (deltaMs <= 0) return { ...state, lastTickTimestamp: now };

  let nextProduce = state.produce;
  let nextLifetime = state.lifetimeProduce;

  const pps = calculatePps(state);
  if (pps > 0) {
    const earned = (pps * deltaMs) / 1000;
    nextProduce += earned;
    nextLifetime += earned;
  }

  // Handle Golden Event timers
  let eventActive = state.goldenEvent.active;
  let eventDuration = state.goldenEvent.durationRemainingMs;
  if (eventActive) {
    eventDuration -= deltaMs;
    if (eventDuration <= 0) {
      eventActive = false;
      eventDuration = 0;
    }
  }

  let frenzyActive = state.goldenEvent.frenzyActive;
  let frenzyRemaining = state.goldenEvent.frenzyRemainingMs;
  if (frenzyActive) {
    frenzyRemaining -= deltaMs;
    if (frenzyRemaining <= 0) {
      frenzyActive = false;
      frenzyRemaining = 0;
    }
  }

  return {
    ...state,
    produce: nextProduce,
    lifetimeProduce: nextLifetime,
    lastTickTimestamp: now,
    goldenEvent: {
      ...state.goldenEvent,
      active: eventActive,
      durationRemainingMs: eventDuration,
      frenzyActive,
      frenzyRemainingMs: frenzyRemaining,
    },
  };
}

export function calculateOfflineEarnings(
  state: ClickerState,
  lastTimestamp: number,
  nowTimestamp: number
): { earned: number; elapsedSeconds: number } {
  if (lastTimestamp >= nowTimestamp) return { earned: 0, elapsedSeconds: 0 };

  const rawElapsed = Math.floor((nowTimestamp - lastTimestamp) / 1000);
  // Cap at 4 hours (14400 seconds) max offline progress
  const cappedElapsed = Math.min(14400, rawElapsed);
  if (cappedElapsed <= 5) return { earned: 0, elapsedSeconds: 0 }; // Ignore micro-glitches < 5s

  // Compute base PPS (without active frenzy)
  let basePps = 0;
  for (const b of Object.values(state.buildings)) {
    basePps += b.count * b.basePps;
  }

  const earned = Math.floor(basePps * cappedElapsed);
  return { earned, elapsedSeconds: cappedElapsed };
}

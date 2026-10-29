import {
  CornSeed,
  DuckChampionState,
  DuckHat,
  DuckStats,
  FlyingTrainState,
  RaceState,
  RivalDuck,
  RunningObstacle,
  RunningTrainState,
  SwimmingObstacle,
  SwimmingTrainState,
} from './types';

export const STORAGE_KEY = 'pawcade_duck_champion_stats';

export const HAT_INFO: Record<DuckHat, { name: string; icon: string; cost: number; desc: string }> = {
  none: { name: 'Natural Duck', icon: '🦆', cost: 0, desc: 'Au naturel farm duckling feathers.' },
  headband: { name: 'Speed Headband', icon: '🔴', cost: 30, desc: 'Sweat-wicking red athlete headband.' },
  cap: { name: 'Baseball Cap', icon: '🧢', cost: 50, desc: 'Cool blue sun visor for training sprints.' },
  goggles: { name: 'Swim Goggles', icon: '🥽', cost: 75, desc: 'Aerodynamic lenses for underwater diving.' },
  straw_hat: { name: 'Farmer Straw Hat', icon: '🌾', cost: 100, desc: 'Classic woven straw hat for country flair.' },
  crown: { name: 'Champion Crown', icon: '👑', cost: 200, desc: 'Golden imperial crown for Olympic champions.' },
};

export function getDefaultStats(): DuckStats {
  return {
    runningLevel: 1,
    runningXp: 0,
    flyingLevel: 1,
    flyingXp: 0,
    swimmingLevel: 1,
    swimmingXp: 0,
    energyLevel: 1,
    coins: 25,
    activeHat: 'none',
    unlockedHats: ['none'],
    racesWon: 0,
  };
}

export function loadSavedStats(): DuckStats {
  if (typeof window === 'undefined') return getDefaultStats();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        runningLevel: Math.max(1, Number(parsed.runningLevel) || 1),
        runningXp: Math.max(0, Number(parsed.runningXp) || 0),
        flyingLevel: Math.max(1, Number(parsed.flyingLevel) || 1),
        flyingXp: Math.max(0, Number(parsed.flyingXp) || 0),
        swimmingLevel: Math.max(1, Number(parsed.swimmingLevel) || 1),
        swimmingXp: Math.max(0, Number(parsed.swimmingXp) || 0),
        energyLevel: Math.max(1, Number(parsed.energyLevel) || 1),
        coins: Math.max(0, Number(parsed.coins) || 0),
        activeHat: parsed.activeHat || 'none',
        unlockedHats: Array.isArray(parsed.unlockedHats) ? parsed.unlockedHats : ['none'],
        racesWon: Math.max(0, Number(parsed.racesWon) || 0),
      };
    }
  } catch {
    // fallback
  }
  return getDefaultStats();
}

export function saveStats(stats: DuckStats): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // fallback
  }
}

export function getXpForNextLevel(level: number): number {
  return level * 40;
}

export function addXpToSkill(
  stats: DuckStats,
  skill: 'running' | 'flying' | 'swimming',
  amount: number
): { stats: DuckStats; leveledUp: boolean } {
  let leveledUp = false;
  const nextStats = { ...stats };

  if (skill === 'running') {
    nextStats.runningXp += amount;
    while (nextStats.runningXp >= getXpForNextLevel(nextStats.runningLevel)) {
      nextStats.runningXp -= getXpForNextLevel(nextStats.runningLevel);
      nextStats.runningLevel++;
      leveledUp = true;
    }
  } else if (skill === 'flying') {
    nextStats.flyingXp += amount;
    while (nextStats.flyingXp >= getXpForNextLevel(nextStats.flyingLevel)) {
      nextStats.flyingXp -= getXpForNextLevel(nextStats.flyingLevel);
      nextStats.flyingLevel++;
      leveledUp = true;
    }
  } else if (skill === 'swimming') {
    nextStats.swimmingXp += amount;
    while (nextStats.swimmingXp >= getXpForNextLevel(nextStats.swimmingLevel)) {
      nextStats.swimmingXp -= getXpForNextLevel(nextStats.swimmingLevel);
      nextStats.swimmingLevel++;
      leveledUp = true;
    }
  }

  saveStats(nextStats);
  return { stats: nextStats, leveledUp };
}

export function initializeDuckGame(savedStats?: DuckStats): DuckChampionState {
  return {
    stats: savedStats || loadSavedStats(),
    view: 'hub',
    runningTrain: null,
    flyingTrain: null,
    swimmingTrain: null,
    race: null,
    lastTrainedSkill: null,
    lastXpGained: 0,
  };
}

// -------------------------------------------------------------
// Running Training Mini-Game
// -------------------------------------------------------------

export function startRunningTraining(stats: DuckStats): RunningTrainState {
  const obstacles: RunningObstacle[] = [];
  const seeds: CornSeed[] = [];

  for (let i = 1; i <= 20; i++) {
    const x = 300 + i * 220 + Math.random() * 80;
    obstacles.push({
      id: `ro_${i}`,
      x,
      y: 280,
      type: i % 3 === 0 ? 'fence' : 'rock',
      passed: false,
    });

    seeds.push({
      id: `rs_${i}`,
      x: x - 80,
      y: 240,
      collected: false,
    });
  }

  return {
    duckY: 280,
    duckVy: 0,
    isGrounded: true,
    distance: 0,
    speed: 210 + stats.runningLevel * 8,
    obstacles,
    seeds,
    seedsCollected: 0,
    gameOver: false,
  };
}

export function stepRunningTraining(
  train: RunningTrainState,
  jumpInput: boolean,
  dt: number
): { train: RunningTrainState; seedPicked: boolean; collided: boolean } {
  if (train.gameOver) return { train, seedPicked: false, collided: false };

  let seedPicked = false;
  let collided = false;
  const safeDt = Math.min(dt, 0.05);

  let duckY = train.duckY;
  let duckVy = train.duckVy;
  let isGrounded = train.isGrounded;

  // Jump physics
  if (jumpInput && isGrounded) {
    duckVy = -460;
    isGrounded = false;
  }

  if (!isGrounded) {
    duckVy += 1150 * safeDt;
    duckY += duckVy * safeDt;

    if (duckY >= 280) {
      duckY = 280;
      duckVy = 0;
      isGrounded = true;
    }
  }

  const forwardDelta = train.speed * safeDt;
  const distance = train.distance + forwardDelta;

  // Move obstacles and check collisions
  const duckX = 80;
  const duckRadius = 16;

  const obstacles = train.obstacles.map((obs) => {
    const ox = obs.x - forwardDelta;
    if (!obs.passed && ox < duckX + duckRadius && ox + 20 > duckX - duckRadius) {
      const obstacleHeight = obs.type === 'fence' ? 36 : 22;
      if (duckY + duckRadius > 280 - obstacleHeight + 6) {
        collided = true;
      }
    }
    const passed = ox < duckX - 30;
    return { ...obs, x: ox, passed };
  });

  // Check seeds collection
  let seedsCollected = train.seedsCollected;
  const seeds = train.seeds.map((s) => {
    if (s.collected) return s;
    const sx = s.x - forwardDelta;
    const dist = Math.hypot(sx - duckX, s.y - duckY);
    if (dist < 26) {
      seedPicked = true;
      seedsCollected++;
      return { ...s, x: sx, collected: true };
    }
    return { ...s, x: sx };
  });

  const gameOver = collided;

  return {
    train: {
      ...train,
      duckY,
      duckVy,
      isGrounded,
      distance,
      obstacles,
      seeds,
      seedsCollected,
      gameOver,
    },
    seedPicked,
    collided,
  };
}

// -------------------------------------------------------------
// Flying Training Mini-Game
// -------------------------------------------------------------

export function startFlyingTraining(stats: DuckStats): FlyingTrainState {
  const seeds: CornSeed[] = [];
  for (let i = 1; i <= 25; i++) {
    seeds.push({
      id: `fs_${i}`,
      x: 250 + i * 160,
      y: 120 + Math.sin(i * 1.5) * 80,
      collected: false,
    });
  }

  return {
    duckY: 180,
    duckVy: 0,
    distance: 0,
    speed: 190 + stats.flyingLevel * 8,
    seeds,
    seedsCollected: 0,
    gameOver: false,
  };
}

export function stepFlyingTraining(
  train: FlyingTrainState,
  flapInput: boolean,
  dt: number
): { train: FlyingTrainState; seedPicked: boolean; crashed: boolean } {
  if (train.gameOver) return { train, seedPicked: false, crashed: false };

  let seedPicked = false;
  let crashed = false;
  const safeDt = Math.min(dt, 0.05);

  let duckY = train.duckY;
  let duckVy = train.duckVy;

  if (flapInput) {
    duckVy = -240;
  } else {
    duckVy += 360 * safeDt; // gravity
  }

  duckY += duckVy * safeDt;

  // Collision with ground or ceiling
  if (duckY < 40 || duckY > 320) {
    crashed = true;
  }

  const forwardDelta = train.speed * safeDt;
  const distance = train.distance + forwardDelta;

  const duckX = 80;
  let seedsCollected = train.seedsCollected;
  const seeds = train.seeds.map((s) => {
    if (s.collected) return s;
    const sx = s.x - forwardDelta;
    const dist = Math.hypot(sx - duckX, s.y - duckY);
    if (dist < 28) {
      seedPicked = true;
      seedsCollected++;
      return { ...s, x: sx, collected: true };
    }
    return { ...s, x: sx };
  });

  return {
    train: {
      ...train,
      duckY,
      duckVy,
      distance,
      seeds,
      seedsCollected,
      gameOver: crashed,
    },
    seedPicked,
    crashed,
  };
}

// -------------------------------------------------------------
// Swimming Training Mini-Game
// -------------------------------------------------------------

export function startSwimmingTraining(stats: DuckStats): SwimmingTrainState {
  const obstacles: SwimmingObstacle[] = [];
  const seeds: CornSeed[] = [];

  for (let i = 1; i <= 20; i++) {
    const isUnderwater = i % 2 === 0;
    const x = 300 + i * 200;
    obstacles.push({
      id: `so_${i}`,
      x,
      y: isUnderwater ? 310 : 220,
      isUnderwater,
      passed: false,
    });

    seeds.push({
      id: `ss_${i}`,
      x: x - 60,
      y: isUnderwater ? 220 : 310,
      collected: false,
    });
  }

  return {
    duckY: 220, // default surface
    isDiving: false,
    distance: 0,
    speed: 190 + stats.swimmingLevel * 8,
    obstacles,
    seeds,
    seedsCollected: 0,
    gameOver: false,
  };
}

export function stepSwimmingTraining(
  train: SwimmingTrainState,
  diveInput: boolean,
  dt: number
): { train: SwimmingTrainState; seedPicked: boolean; collided: boolean } {
  if (train.gameOver) return { train, seedPicked: false, collided: false };

  let seedPicked = false;
  let collided = false;
  const safeDt = Math.min(dt, 0.05);

  const targetY = diveInput ? 310 : 220;
  const duckY = train.duckY + (targetY - train.duckY) * Math.min(1, 10 * safeDt);

  const forwardDelta = train.speed * safeDt;
  const distance = train.distance + forwardDelta;

  const duckX = 80;
  const obstacles = train.obstacles.map((obs) => {
    const ox = obs.x - forwardDelta;
    if (!obs.passed && Math.abs(ox - duckX) < 24) {
      if (Math.abs(obs.y - duckY) < 32) {
        collided = true;
      }
    }
    const passed = ox < duckX - 30;
    return { ...obs, x: ox, passed };
  });

  let seedsCollected = train.seedsCollected;
  const seeds = train.seeds.map((s) => {
    if (s.collected) return s;
    const sx = s.x - forwardDelta;
    const dist = Math.hypot(sx - duckX, s.y - duckY);
    if (dist < 26) {
      seedPicked = true;
      seedsCollected++;
      return { ...s, x: sx, collected: true };
    }
    return { ...s, x: sx };
  });

  return {
    train: {
      ...train,
      duckY,
      isDiving: diveInput,
      distance,
      obstacles,
      seeds,
      seedsCollected,
      gameOver: collided,
    },
    seedPicked,
    collided,
  };
}

// -------------------------------------------------------------
// Championship Race Mode
// -------------------------------------------------------------

export function startRace(stats: DuckStats, raceType: 'sprint' | 'swim_dash' | 'triathlon'): RaceState {
  let playerSpeed = 140;
  if (raceType === 'sprint') {
    playerSpeed = 130 + stats.runningLevel * 14 + stats.energyLevel * 4;
  } else if (raceType === 'swim_dash') {
    playerSpeed = 130 + stats.swimmingLevel * 14 + stats.energyLevel * 4;
  } else {
    playerSpeed = 110 + (stats.runningLevel + stats.flyingLevel + stats.swimmingLevel) * 5 + stats.energyLevel * 4;
  }

  const rivals: RivalDuck[] = [
    { name: 'Pip the Drake', color: '#38bdf8', hat: 'cap', speed: 175, progress: 0, laneY: 100 },
    { name: 'Daisy Feather', color: '#f472b6', hat: 'headband', speed: 195, progress: 0, laneY: 160 },
    { name: 'Chester Champ', color: '#a855f7', hat: 'crown', speed: 220, progress: 0, laneY: 220 },
  ];

  return {
    raceType,
    distanceTotal: 800,
    playerProgress: 0,
    playerSpeed,
    rivals,
    finished: false,
    winnerName: null,
    playerPlace: null,
  };
}

export function stepRace(
  race: RaceState,
  boostInput: boolean,
  dt: number
): { race: RaceState; justFinished: boolean; wonFirstPlace: boolean } {
  if (race.finished) return { race, justFinished: false, wonFirstPlace: false };

  const safeDt = Math.min(dt, 0.05);
  const boostMultiplier = boostInput ? 1.25 : 1.0;

  const playerProgress = race.playerProgress + race.playerSpeed * boostMultiplier * safeDt;

  const rivals = race.rivals.map((r) => {
    // Add small random pacing variation
    const jitter = (Math.random() - 0.5) * 10;
    return {
      ...r,
      progress: r.progress + (r.speed + jitter) * safeDt,
    };
  });

  let finished = false;
  let winnerName = race.winnerName;
  let playerPlace = race.playerPlace;
  let justFinished = false;
  let wonFirstPlace = false;

  // Check if anyone crossed 800m
  const allRacers = [
    { name: 'You (Quacky)', progress: playerProgress, isPlayer: true },
    ...rivals.map((r) => ({ name: r.name, progress: r.progress, isPlayer: false })),
  ];

  allRacers.sort((a, b) => b.progress - a.progress);

  if (allRacers[0].progress >= race.distanceTotal) {
    finished = true;
    justFinished = true;
    winnerName = allRacers[0].name;
    playerPlace = allRacers.findIndex((r) => r.isPlayer) + 1;
    wonFirstPlace = playerPlace === 1;
  }

  return {
    race: {
      ...race,
      playerProgress,
      rivals,
      finished,
      winnerName,
      playerPlace,
    },
    justFinished,
    wonFirstPlace,
  };
}

// -------------------------------------------------------------
// Shop & Hat Customization
// -------------------------------------------------------------

export function buyHat(stats: DuckStats, hat: DuckHat): DuckStats {
  const info = HAT_INFO[hat];
  if (stats.unlockedHats.includes(hat) || stats.coins < info.cost) {
    return stats;
  }
  const nextStats: DuckStats = {
    ...stats,
    coins: stats.coins - info.cost,
    unlockedHats: [...stats.unlockedHats, hat],
    activeHat: hat,
  };
  saveStats(nextStats);
  return nextStats;
}

export function equipHat(stats: DuckStats, hat: DuckHat): DuckStats {
  if (!stats.unlockedHats.includes(hat)) return stats;
  const nextStats: DuckStats = { ...stats, activeHat: hat };
  saveStats(nextStats);
  return nextStats;
}

export function buyEnergySeed(stats: DuckStats): DuckStats {
  const cost = 25;
  if (stats.coins < cost) return stats;
  const nextStats: DuckStats = {
    ...stats,
    coins: stats.coins - cost,
    energyLevel: stats.energyLevel + 1,
  };
  saveStats(nextStats);
  return nextStats;
}

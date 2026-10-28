import { CapybaraSpaState, Critter, CritterType, CritterNeed, HotTub } from './types';

export const CRITTER_TEMPLATES: Record<CritterType, { name: string; emoji: string; baseReward: number; weight: number }> = {
  capybara: { name: 'Capy Baro', emoji: '🦫', baseReward: 40, weight: 50 },
  duckling: { name: 'Pip Duck', emoji: '🐥', baseReward: 25, weight: 25 },
  turtle: { name: 'Shelly', emoji: '🐢', baseReward: 35, weight: 15 },
  monkey: { name: 'Koko', emoji: '🐒', baseReward: 50, weight: 10 },
};

export const UPGRADE_COSTS = {
  yuzuTree: [60, 150, 350],
  herbalBath: [80, 200, 450],
  deluxeScrub: [70, 180, 400],
  teaStation: [90, 220, 500],
  extraTubs: [120, 300], // tub 3, tub 4
};

let critterIdCounter = 1;

export function generateRandomCritter(): Critter {
  const rand = Math.random() * 100;
  let type: CritterType = 'capybara';
  if (rand < 50) type = 'capybara';
  else if (rand < 75) type = 'duckling';
  else if (rand < 90) type = 'turtle';
  else type = 'monkey';

  const tpl = CRITTER_TEMPLATES[type];
  const needs: CritterNeed[] = ['relax', 'yuzu', 'scrub', 'tea'];
  const initialNeed = needs[Math.floor(Math.random() * needs.length)]!;

  return {
    id: `guest_${Date.now()}_${critterIdCounter++}`,
    type,
    name: tpl.name,
    emoji: tpl.emoji,
    bliss: 10,
    targetBliss: 100,
    currentNeed: initialNeed,
    needTimer: 5 + Math.random() * 5,
    baseReward: tpl.baseReward,
  };
}

export function createInitialState(): CapybaraSpaState {
  const tubs: HotTub[] = [
    { id: 0, unlocked: true, critter: null, yuzuCount: 1, waterWarmth: 100, isBubbling: true, cleanliness: 100 },
    { id: 1, unlocked: true, critter: null, yuzuCount: 0, waterWarmth: 100, isBubbling: true, cleanliness: 100 },
    { id: 2, unlocked: false, critter: null, yuzuCount: 0, waterWarmth: 100, isBubbling: true, cleanliness: 100 },
    { id: 3, unlocked: false, critter: null, yuzuCount: 0, waterWarmth: 100, isBubbling: true, cleanliness: 100 },
  ];

  const firstGuest = generateRandomCritter();

  return {
    coins: 50,
    totalBlissEarned: 0,
    reputationLevel: 1,
    guestQueue: [firstGuest],
    maxQueueSize: 3,
    tubs,
    spawnTimer: 4.0,
    spawnInterval: 5.0,
    upgrades: {
      yuzuTree: 0,
      herbalBath: 0,
      deluxeScrub: 0,
      teaStation: 0,
      extraTubs: 0,
    },
    stats: {
      capybarasServed: 0,
      yuzuServed: 0,
      tubsScrubbed: 0,
      teaCupsServed: 0,
    },
  };
}

export function seatCritterInTub(state: CapybaraSpaState, critterId: string, tubId: number): boolean {
  const tub = state.tubs.find(t => t.id === tubId);
  if (!tub || !tub.unlocked || tub.critter !== null) return false;

  const queueIdx = state.guestQueue.findIndex(c => c.id === critterId);
  if (queueIdx === -1) return false;

  const critter = state.guestQueue[queueIdx]!;
  state.guestQueue.splice(queueIdx, 1);
  tub.critter = critter;
  return true;
}

export function addYuzuToTub(state: CapybaraSpaState, tubId: number): boolean {
  const tub = state.tubs.find(t => t.id === tubId);
  if (!tub || !tub.unlocked) return false;
  if (tub.yuzuCount >= 4) return false;

  tub.yuzuCount += 1;
  state.stats.yuzuServed += 1;

  if (tub.critter && tub.critter.currentNeed === 'yuzu') {
    tub.critter.bliss = Math.min(100, tub.critter.bliss + 25);
    tub.critter.currentNeed = 'relax';
    tub.critter.needTimer = 6.0;
    state.coins += 15;
  }

  return true;
}

export function scrubTub(state: CapybaraSpaState, tubId: number): boolean {
  const tub = state.tubs.find(t => t.id === tubId);
  if (!tub || !tub.unlocked) return false;

  const scrubPower = 35 * (1 + state.upgrades.deluxeScrub * 0.5);
  tub.cleanliness = Math.min(100, tub.cleanliness + scrubPower);
  state.stats.tubsScrubbed += 1;

  if (tub.critter && tub.critter.currentNeed === 'scrub') {
    tub.critter.bliss = Math.min(100, tub.critter.bliss + 30);
    tub.critter.currentNeed = 'relax';
    tub.critter.needTimer = 6.0;
    state.coins += 20;
  }

  return true;
}

export function serveHerbalTea(state: CapybaraSpaState, tubId: number): boolean {
  const tub = state.tubs.find(t => t.id === tubId);
  if (!tub || !tub.unlocked || !tub.critter) return false;

  state.stats.teaCupsServed += 1;
  const tipBonus = 25 * (1 + state.upgrades.teaStation * 0.5);

  if (tub.critter.currentNeed === 'tea') {
    tub.critter.bliss = Math.min(100, tub.critter.bliss + 35);
    tub.critter.currentNeed = 'relax';
    tub.critter.needTimer = 7.0;
    state.coins += Math.round(tipBonus);
    return true;
  } else {
    // Generous tea treat boosts bliss slightly even without explicit request
    tub.critter.bliss = Math.min(100, tub.critter.bliss + 15);
    return true;
  }
}

export function checkoutSatisfiedCritter(state: CapybaraSpaState, tubId: number): number {
  const tub = state.tubs.find(t => t.id === tubId);
  if (!tub || !tub.critter || tub.critter.bliss < 100) return 0;

  const yuzuMultiplier = 1 + tub.yuzuCount * 0.15;
  const earnings = Math.round(tub.critter.baseReward * yuzuMultiplier);

  state.coins += earnings;
  state.totalBlissEarned += 100;
  state.stats.capybarasServed += 1;

  // Level up reputation for every 300 bliss
  state.reputationLevel = 1 + Math.floor(state.totalBlissEarned / 300);

  // Consume 1 yuzu and leave tub ready for next guest
  tub.yuzuCount = Math.max(0, tub.yuzuCount - 1);
  tub.critter = null;
  tub.cleanliness = Math.max(40, tub.cleanliness - 20);

  return earnings;
}

export function buyUpgrade(state: CapybaraSpaState, upgradeKey: keyof typeof UPGRADE_COSTS): boolean {
  const currentLvl = state.upgrades[upgradeKey];
  const costs = UPGRADE_COSTS[upgradeKey];
  if (currentLvl >= costs.length) return false;

  const cost = costs[currentLvl]!;
  if (state.coins < cost) return false;

  state.coins -= cost;
  state.upgrades[upgradeKey] += 1;

  // If upgrading extraTubs, unlock tub 3 or tub 4
  if (upgradeKey === 'extraTubs') {
    if (state.upgrades.extraTubs === 1) {
      const tub3 = state.tubs.find(t => t.id === 2);
      if (tub3) tub3.unlocked = true;
    } else if (state.upgrades.extraTubs === 2) {
      const tub4 = state.tubs.find(t => t.id === 3);
      if (tub4) tub4.unlocked = true;
    }
  }

  return true;
}

export function updateSpa(state: CapybaraSpaState, dt: number): void {
  // 1. Guest arrival queue
  state.spawnTimer -= dt;
  if (state.spawnTimer <= 0) {
    if (state.guestQueue.length < state.maxQueueSize) {
      state.guestQueue.push(generateRandomCritter());
    }
    state.spawnTimer = state.spawnInterval;
  }

  // 2. Tubs processing
  const herbalMultiplier = 1 + state.upgrades.herbalBath * 0.25;

  for (const tub of state.tubs) {
    if (!tub.unlocked || !tub.critter) continue;

    // Bliss natural accumulation
    const yuzuBliss = tub.yuzuCount * 1.8;
    const cleanFactor = tub.cleanliness > 60 ? 1.0 : 0.6;
    const blissGain = (3.5 + yuzuBliss) * herbalMultiplier * cleanFactor * dt;

    tub.critter.bliss = Math.min(100, tub.critter.bliss + blissGain);

    // Need timer tick
    if (tub.critter.bliss < 100) {
      tub.critter.needTimer -= dt;
      if (tub.critter.needTimer <= 0) {
        if (tub.critter.currentNeed === 'relax') {
          // Trigger a random service request
          const possibleNeeds: CritterNeed[] = ['yuzu', 'scrub', 'tea'];
          tub.critter.currentNeed = possibleNeeds[Math.floor(Math.random() * possibleNeeds.length)]!;
          tub.critter.needTimer = 8.0;
        } else {
          // Revert back to relaxing if not addressed
          tub.critter.currentNeed = 'relax';
          tub.critter.needTimer = 5.0;
        }
      }
    }

    // Gradual tub wear
    tub.cleanliness = Math.max(20, tub.cleanliness - 0.8 * dt);
  }
}

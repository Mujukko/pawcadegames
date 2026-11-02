import {
  PuppyAccessory,
  PuppyCareActivity,
  PuppyGameState,
  PuppyMood,
  PuppyStats,
} from './types';

export const ACCESSORY_COSTS: Record<PuppyAccessory, number> = {
  none: 0,
  red_bandana: 50,
  bell_collar: 100,
  detective_hat: 180,
  party_bowtie: 250,
};

export function createPuppyGame(): PuppyGameState {
  return {
    puppyName: 'Buster',
    breed: 'Golden Retriever Pup',
    level: 1,
    xp: 0,
    maxXp: 100,
    stats: {
      hunger: 65,
      hygiene: 60,
      happiness: 70,
      energy: 85,
    },
    currentActivity: 'idle',
    accessory: 'none',
    unlockedAccessories: ['none'],
    bones: 25,
    tricksKnown: ['Sit'],
    ballPosition: null,
    foamBubbles: [],
    activityTimer: 0,
    events: [],
  };
}

export function determinePuppyMood(stats: PuppyStats): PuppyMood {
  if (stats.hunger < 35) return 'hungry';
  if (stats.hygiene < 35) return 'dirty';
  if (stats.energy < 30) return 'sleepy';
  if (stats.happiness > 75) return 'playful';
  return 'happy';
}

export function feedPuppy(state: PuppyGameState, food: 'kibble' | 'milk' | 'bone'): PuppyGameState {
  const isFull = state.stats.hunger >= 100;
  const hungerBoost = isFull ? 0 : food === 'bone' ? 35 : food === 'kibble' ? 25 : 15;
  const xpBoost = isFull ? 8 : food === 'bone' ? 25 : 15;
  const boneReward = isFull ? 2 : 5;

  const newHunger = Math.min(100, state.stats.hunger + hungerBoost);
  const nextStats = { ...state.stats, hunger: newHunger };

  const { newXp, newLevel, newMaxXp, didLevelUp } = addXp(state.xp + xpBoost, state.level, state.maxXp);

  return {
    ...state,
    stats: nextStats,
    currentActivity: 'feeding',
    activityTimer: 2.2,
    foamBubbles: [], // Shake off any old soap bubbles when eating
    xp: newXp,
    level: newLevel,
    maxXp: newMaxXp,
    bones: state.bones + boneReward,
    events: [
      {
        type: 'feed_puppy',
        stat: 'hunger',
        delta: hungerBoost,
        text: isFull ? 'Buster enjoyed a tasty treat snack! 🍖' : 'Buster munched up his meal happily! 🍗',
      },
      ...(didLevelUp ? [{ type: 'level_up', text: `Buster reached Level ${newLevel}!` }] : []),
    ],
  };
}

export function washPuppy(state: PuppyGameState, tool: 'soap' | 'rinse'): PuppyGameState {
  if (tool === 'soap') {
    // Generate bubbles directly on Buster's body and ears (centered at x: 400, y: 335)
    // Keep max 16 bubbles so it never turns into an overwhelming clump
    const existing = state.foamBubbles.slice(-10);
    const newBubbles = Array.from({ length: 6 }, (_, i) => ({
      id: `bubble-${Date.now()}-${i}-${Math.random()}`,
      x: 400 + (Math.random() - 0.5) * 85,
      y: 335 + (Math.random() - 0.5) * 60,
      size: 11 + Math.random() * 12,
    }));

    const newHygiene = Math.min(85, state.stats.hygiene + 15);

    return {
      ...state,
      stats: { ...state.stats, hygiene: newHygiene },
      currentActivity: 'washing',
      activityTimer: 4.5,
      foamBubbles: [...existing, ...newBubbles],
      events: [{ type: 'soap_puppy', text: 'Lathered Buster with bubbly soap! Tap bubbles or Rinse to wash! 🧼' }],
    };
  } else {
    // Rinse cleans bubbles and restores hygiene to 100
    const hygieneGain = Math.max(15, 100 - state.stats.hygiene);
    const { newXp, newLevel, newMaxXp, didLevelUp } = addXp(state.xp + 20, state.level, state.maxXp);

    return {
      ...state,
      stats: { ...state.stats, hygiene: 100 },
      currentActivity: 'idle',
      activityTimer: 0,
      foamBubbles: [],
      xp: newXp,
      level: newLevel,
      maxXp: newMaxXp,
      bones: state.bones + 10,
      events: [
        { type: 'rinse_puppy', stat: 'hygiene', delta: hygieneGain, text: 'Rinsed clean! Buster is squeaky clean! ✨🛁' },
        ...(didLevelUp ? [{ type: 'level_up', text: `Buster reached Level ${newLevel}!` }] : []),
      ],
    };
  }
}

export function popBubble(state: PuppyGameState, bubbleId: string): PuppyGameState {
  const filtered = state.foamBubbles.filter((b) => b.id !== bubbleId);
  if (filtered.length === state.foamBubbles.length) return state;

  const nextHygiene = Math.min(100, state.stats.hygiene + 2);
  const nextHappiness = Math.min(100, state.stats.happiness + 1);

  return {
    ...state,
    stats: {
      ...state.stats,
      hygiene: nextHygiene,
      happiness: nextHappiness,
    },
    foamBubbles: filtered,
    currentActivity: filtered.length === 0 ? 'idle' : state.currentActivity,
  };
}

export function throwTennisBall(state: PuppyGameState, targetX: number, targetY: number): PuppyGameState {
  if (state.stats.energy < 15) {
    return {
      ...state,
      events: [{ type: 'too_tired', text: 'Buster is too sleepy to chase the ball! Put him to bed first! 💤' }],
    };
  }

  // Calculate ball impulse within room boundaries
  const safeTargetX = Math.max(120, Math.min(680, targetX));
  const dx = safeTargetX - 400;
  const dy = targetY - 260;
  const dist = Math.max(1, Math.sqrt(dx * dx + dy * dy));

  return {
    ...state,
    currentActivity: 'playing_fetch',
    activityTimer: 3.5, // 3.5s auto-retrieve failsafe
    foamBubbles: [], // Shake off soap before playing
    ballPosition: {
      x: 400,
      y: 260,
      vx: (dx / dist) * 260,
      vy: (dy / dist) * 260 - 100, // upward arc
      isThrown: true,
    },
    events: [{ type: 'throw_ball', text: 'Fetch! Go get the tennis ball, Buster! 🎾' }],
  };
}

export function retrieveBall(state: PuppyGameState): PuppyGameState {
  const happinessBoost = 25;
  const energyDrain = 12;

  const nextHappiness = Math.min(100, state.stats.happiness + happinessBoost);
  const nextEnergy = Math.max(0, state.stats.energy - energyDrain);

  const { newXp, newLevel, newMaxXp, didLevelUp } = addXp(state.xp + 25, state.level, state.maxXp);

  return {
    ...state,
    stats: {
      ...state.stats,
      happiness: nextHappiness,
      energy: nextEnergy,
    },
    currentActivity: 'idle',
    ballPosition: null,
    xp: newXp,
    level: newLevel,
    maxXp: newMaxXp,
    bones: state.bones + 8,
    events: [
      { type: 'catch_ball', stat: 'happiness', delta: happinessBoost },
      ...(didLevelUp ? [{ type: 'level_up', text: `Buster reached Level ${newLevel}!` }] : []),
    ],
  };
}

export function restPuppy(state: PuppyGameState): PuppyGameState {
  const isSleeping = state.currentActivity === 'sleeping';
  return {
    ...state,
    foamBubbles: [], // Clean off any bubbles when tucking in
    currentActivity: isSleeping ? 'idle' : 'sleeping',
    activityTimer: 0,
    events: [{ type: 'toggle_sleep', text: isSleeping ? 'Good morning, Buster! ☀️' : 'Shh... Buster is taking a nap! 💤' }],
  };
}

export function buyAndEquipAccessory(state: PuppyGameState, accessory: PuppyAccessory): PuppyGameState {
  if (state.unlockedAccessories.includes(accessory)) {
    return {
      ...state,
      accessory,
      events: [{ type: 'equip_accessory', text: `Equipped ${accessory.replace('_', ' ')}!` }],
    };
  }

  const cost = ACCESSORY_COSTS[accessory];
  if (state.bones < cost) {
    return {
      ...state,
      events: [{ type: 'not_enough_bones', text: `Need ${cost} bones to unlock!` }],
    };
  }

  return {
    ...state,
    bones: state.bones - cost,
    accessory,
    unlockedAccessories: [...state.unlockedAccessories, accessory],
    events: [{ type: 'unlock_accessory', text: `Unlocked ${accessory.replace('_', ' ')}!` }],
  };
}

function addXp(totalXp: number, currentLevel: number, maxXp: number) {
  let xp = totalXp;
  let level = currentLevel;
  let nextMax = maxXp;
  let didLevelUp = false;

  while (xp >= nextMax) {
    xp -= nextMax;
    level += 1;
    nextMax = Math.round(nextMax * 1.35);
    didLevelUp = true;
  }

  return { newXp: xp, newLevel: level, newMaxXp: nextMax, didLevelUp };
}

export function updatePuppyGame(state: PuppyGameState, rawDt: number): PuppyGameState {
  const dt = Math.min(rawDt, 0.1);
  const timerDt = Math.min(rawDt, 10.0);
  const events: Array<{ type: string; stat?: string; delta?: number; text?: string }> = [];

  const stats = { ...state.stats };

  // Sleeping regenerates energy fast
  if (state.currentActivity === 'sleeping') {
    stats.energy = Math.min(100, stats.energy + timerDt * 14);
    // Wake up automatically when full
    if (stats.energy >= 100) {
      return {
        ...state,
        stats,
        currentActivity: 'idle',
        activityTimer: 0,
        events: [{ type: 'woke_up', text: 'Buster is fully rested and ready to play! 🐾' }],
      };
    }
    return { ...state, stats };
  }

  // Activity timer progression (auto-return to idle so state is never stuck)
  let activityTimer = (state.activityTimer !== undefined ? state.activityTimer : 0) - timerDt;
  let currentActivity = state.currentActivity;
  if (activityTimer <= 0) {
    activityTimer = 0;
    if (currentActivity === 'feeding' || currentActivity === 'washing') {
      currentActivity = 'idle';
    }
  }

  // Natural gradual bubble dissipation if idle
  let foamBubbles = state.foamBubbles;
  if (foamBubbles.length > 0 && currentActivity !== 'washing' && Math.random() < timerDt * 0.75) {
    foamBubbles = foamBubbles.slice(1);
  }

  // Natural slow stat decay during daytime activities
  stats.hunger = Math.max(0, stats.hunger - timerDt * 0.4);
  stats.hygiene = Math.max(0, stats.hygiene - timerDt * 0.3);
  stats.happiness = Math.max(0, stats.happiness - timerDt * 0.5);
  stats.energy = Math.max(0, stats.energy - timerDt * 0.25);

  // Ball physics if currently thrown
  let ballPosition = state.ballPosition ? { ...state.ballPosition } : null;
  if (ballPosition && ballPosition.isThrown) {
    ballPosition.x += ballPosition.vx * dt;
    ballPosition.y += ballPosition.vy * dt;
    ballPosition.vy += 450 * dt; // gravity

    // Wall bounces inside room
    if (ballPosition.x <= 100) {
      ballPosition.x = 100;
      ballPosition.vx = Math.abs(ballPosition.vx) * 0.7;
    } else if (ballPosition.x >= 700) {
      ballPosition.x = 700;
      ballPosition.vx = -Math.abs(ballPosition.vx) * 0.7;
    }

    // Ground bounce
    if (ballPosition.y >= 380) {
      ballPosition.y = 380;
      ballPosition.vy = -ballPosition.vy * 0.55;
      ballPosition.vx *= 0.75;
      if (Math.abs(ballPosition.vy) < 40 || activityTimer <= 0) {
        ballPosition.vy = 0;
        ballPosition.vx = 0;
        // Ball resting; puppy retrieves it!
        return retrieveBall({ ...state, stats, ballPosition, foamBubbles, currentActivity, activityTimer: 0 });
      }
    }
  }

  return {
    ...state,
    stats,
    foamBubbles,
    currentActivity,
    activityTimer,
    ballPosition,
    events,
  };
}

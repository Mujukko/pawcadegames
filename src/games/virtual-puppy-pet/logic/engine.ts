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
  if (state.stats.hunger >= 100) return state;

  const hungerBoost = food === 'bone' ? 35 : food === 'kibble' ? 25 : 15;
  const xpBoost = food === 'bone' ? 25 : 15;
  const boneReward = 5;

  const newHunger = Math.min(100, state.stats.hunger + hungerBoost);
  const nextStats = { ...state.stats, hunger: newHunger };

  const { newXp, newLevel, newMaxXp, didLevelUp } = addXp(state.xp + xpBoost, state.level, state.maxXp);

  return {
    ...state,
    stats: nextStats,
    currentActivity: 'feeding',
    xp: newXp,
    level: newLevel,
    maxXp: newMaxXp,
    bones: state.bones + boneReward,
    events: [
      { type: 'feed_puppy', stat: 'hunger', delta: hungerBoost },
      ...(didLevelUp ? [{ type: 'level_up', text: `Buster reached Level ${newLevel}!` }] : []),
    ],
  };
}

export function washPuppy(state: PuppyGameState, tool: 'soap' | 'rinse'): PuppyGameState {
  if (tool === 'soap') {
    // Generate soapy bubbles on puppy body
    const newBubbles = Array.from({ length: 6 }, (_, i) => ({
      id: `bubble-${Date.now()}-${i}`,
      x: 350 + (Math.random() - 0.5) * 140,
      y: 260 + (Math.random() - 0.5) * 80,
      size: 10 + Math.random() * 14,
    }));

    return {
      ...state,
      currentActivity: 'washing',
      foamBubbles: [...state.foamBubbles, ...newBubbles],
      events: [{ type: 'soap_puppy' }],
    };
  } else {
    // Rinse cleans bubbles and restores hygiene to 100
    const hygieneGain = Math.max(10, 100 - state.stats.hygiene);
    const { newXp, newLevel, newMaxXp, didLevelUp } = addXp(state.xp + 20, state.level, state.maxXp);

    return {
      ...state,
      stats: { ...state.stats, hygiene: 100 },
      currentActivity: 'idle',
      foamBubbles: [],
      xp: newXp,
      level: newLevel,
      maxXp: newMaxXp,
      bones: state.bones + 10,
      events: [
        { type: 'rinse_puppy', stat: 'hygiene', delta: hygieneGain },
        ...(didLevelUp ? [{ type: 'level_up', text: `Buster reached Level ${newLevel}!` }] : []),
      ],
    };
  }
}

export function throwTennisBall(state: PuppyGameState, targetX: number, targetY: number): PuppyGameState {
  if (state.stats.energy < 15) {
    return {
      ...state,
      events: [{ type: 'too_tired', text: 'Buster is too sleepy to chase the ball!' }],
    };
  }

  // Calculate ball impulse
  const dx = targetX - 400;
  const dy = targetY - 260;
  const dist = Math.sqrt(dx * dx + dy * dy);

  return {
    ...state,
    currentActivity: 'playing_fetch',
    ballPosition: {
      x: 400,
      y: 260,
      vx: (dx / dist) * 280,
      vy: (dy / dist) * 280 - 120, // upward arc
      isThrown: true,
    },
    events: [{ type: 'throw_ball' }],
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
  return {
    ...state,
    currentActivity: state.currentActivity === 'sleeping' ? 'idle' : 'sleeping',
    events: [{ type: 'toggle_sleep' }],
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
  const events: Array<{ type: string; stat?: string; delta?: number; text?: string }> = [];

  const stats = { ...state.stats };

  // Sleeping regenerates energy fast
  if (state.currentActivity === 'sleeping') {
    stats.energy = Math.min(100, stats.energy + dt * 14);
    // Wake up automatically when full
    if (stats.energy >= 100) {
      return {
        ...state,
        stats,
        currentActivity: 'idle',
        events: [{ type: 'woke_up', text: 'Buster is fully rested and ready to play!' }],
      };
    }
    return { ...state, stats };
  }

  // Natural slow stat decay during daytime activities
  stats.hunger = Math.max(0, stats.hunger - dt * 0.4);
  stats.hygiene = Math.max(0, stats.hygiene - dt * 0.3);
  stats.happiness = Math.max(0, stats.happiness - dt * 0.5);
  stats.energy = Math.max(0, stats.energy - dt * 0.25);

  // Ball physics if currently thrown
  let ballPosition = state.ballPosition ? { ...state.ballPosition } : null;
  if (ballPosition && ballPosition.isThrown) {
    ballPosition.x += ballPosition.vx * dt;
    ballPosition.y += ballPosition.vy * dt;
    ballPosition.vy += 450 * dt; // gravity

    // Ground bounce
    if (ballPosition.y >= 380) {
      ballPosition.y = 380;
      ballPosition.vy = -ballPosition.vy * 0.55;
      ballPosition.vx *= 0.75;
      if (Math.abs(ballPosition.vy) < 40) {
        ballPosition.vy = 0;
        ballPosition.vx = 0;
        // Ball resting; puppy retrieves it!
        return retrieveBall({ ...state, stats, ballPosition });
      }
    }
  }

  return {
    ...state,
    stats,
    ballPosition,
    events,
  };
}

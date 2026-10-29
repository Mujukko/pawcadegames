import { describe, it, expect } from 'bun:test';
import {
  createPuppyGame,
  determinePuppyMood,
  feedPuppy,
  washPuppy,
  throwTennisBall,
  retrieveBall,
  restPuppy,
  buyAndEquipAccessory,
  updatePuppyGame,
} from './engine';

describe('Virtual Pet: Cozy Puppy Care Logic Engine', () => {
  it('initializes puppy game with valid starter stats and bones', () => {
    const state = createPuppyGame();
    expect(state.puppyName).toBe('Buster');
    expect(state.level).toBe(1);
    expect(state.bones).toBe(25);
    expect(state.stats.hunger).toBeGreaterThan(50);
    expect(state.stats.happiness).toBeGreaterThan(50);
    expect(state.unlockedAccessories).toContain('none');
  });

  it('determines puppy mood dynamically based on hunger, hygiene, and energy', () => {
    expect(determinePuppyMood({ hunger: 20, hygiene: 80, happiness: 80, energy: 80 })).toBe('hungry');
    expect(determinePuppyMood({ hunger: 80, hygiene: 20, happiness: 80, energy: 80 })).toBe('dirty');
    expect(determinePuppyMood({ hunger: 80, hygiene: 80, happiness: 80, energy: 20 })).toBe('sleepy');
    expect(determinePuppyMood({ hunger: 80, hygiene: 80, happiness: 90, energy: 80 })).toBe('playful');
    expect(determinePuppyMood({ hunger: 60, hygiene: 60, happiness: 60, energy: 60 })).toBe('happy');
  });

  it('feeds puppy, increases hunger gauge, awards bones and XP', () => {
    let state = createPuppyGame();
    state.stats.hunger = 40;
    const initialBones = state.bones;

    state = feedPuppy(state, 'bone');
    expect(state.stats.hunger).toBe(75);
    expect(state.bones).toBeGreaterThan(initialBones);
    expect(state.xp).toBeGreaterThan(0);
    expect(state.events.some((e) => e.type === 'feed_puppy')).toBe(true);
  });

  it('washes puppy with soap generating foam, then rinse restores hygiene to 100', () => {
    let state = createPuppyGame();
    state.stats.hygiene = 30;

    // Apply soap
    state = washPuppy(state, 'soap');
    expect(state.foamBubbles.length).toBeGreaterThan(0);
    expect(state.currentActivity).toBe('washing');

    // Rinse clean
    state = washPuppy(state, 'rinse');
    expect(state.stats.hygiene).toBe(100);
    expect(state.foamBubbles.length).toBe(0);
    expect(state.currentActivity).toBe('idle');
  });

  it('throws ball and retrieves it, boosting happiness and burning energy', () => {
    let state = createPuppyGame();
    state.stats.happiness = 40;
    state.stats.energy = 80;

    state = throwTennisBall(state, 600, 200);
    expect(state.ballPosition).not.toBeNull();
    expect(state.ballPosition?.isThrown).toBe(true);

    state = retrieveBall(state);
    expect(state.stats.happiness).toBe(65);
    expect(state.stats.energy).toBe(68);
    expect(state.ballPosition).toBeNull();
  });

  it('toggles sleep mode and replenishes energy during update steps', () => {
    let state = createPuppyGame();
    state.stats.energy = 30;

    state = restPuppy(state);
    expect(state.currentActivity).toBe('sleeping');

    state = updatePuppyGame(state, 2.0);
    expect(state.stats.energy).toBeGreaterThan(30);
  });

  it('buys and equips cute puppy accessories with earned bones', () => {
    let state = createPuppyGame();
    state.bones = 100;

    state = buyAndEquipAccessory(state, 'red_bandana'); // cost 50
    expect(state.accessory).toBe('red_bandana');
    expect(state.unlockedAccessories).toContain('red_bandana');
    expect(state.bones).toBe(50);

    // Unequip / switch to none
    state = buyAndEquipAccessory(state, 'none');
    expect(state.accessory).toBe('none');
  });

  it('levels up when XP exceeds maxXp threshold', () => {
    let state = createPuppyGame();
    state.xp = 95;
    state.stats.hunger = 40;

    state = feedPuppy(state, 'bone'); // +25 XP -> 120 >= 100 -> level up!
    expect(state.level).toBe(2);
    expect(state.events.some((e) => e.type === 'level_up')).toBe(true);
  });
});

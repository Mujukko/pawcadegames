import { describe, expect, test } from 'bun:test';
import {
  initializeDuckGame,
  addXpToSkill,
  startRunningTraining,
  stepRunningTraining,
  startFlyingTraining,
  stepFlyingTraining,
  startSwimmingTraining,
  stepSwimmingTraining,
  startRace,
  stepRace,
  buyHat,
  equipHat,
  buyEnergySeed,
} from './engine';
import { DuckStats } from './types';

describe('Duck Life: Barnyard Champion Logic Engine', () => {
  test('initializes default stats with Level 1 in all skills and 25 coins', () => {
    const game = initializeDuckGame({
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
    });

    expect(game.stats.runningLevel).toBe(1);
    expect(game.stats.flyingLevel).toBe(1);
    expect(game.stats.swimmingLevel).toBe(1);
    expect(game.stats.coins).toBe(25);
    expect(game.view).toBe('hub');
  });

  test('adds XP to skills and triggers level-up upon reaching threshold', () => {
    const initialStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    // Level 1 -> 2 requires 40 XP
    const { stats: s1, leveledUp: l1 } = addXpToSkill(initialStats, 'running', 45);
    expect(l1).toBe(true);
    expect(s1.runningLevel).toBe(2);
    expect(s1.runningXp).toBe(5);
  });

  test('executes running jump physics with upward velocity and ground collision', () => {
    const initialStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    let train = startRunningTraining(initialStats);
    expect(train.isGrounded).toBe(true);
    expect(train.duckY).toBe(280);

    // Jump
    const res = stepRunningTraining(train, true, 0.02);
    expect(res.train.duckVy).toBeLessThan(0);
    expect(res.train.isGrounded).toBe(false);

    // Simulate flight and landing
    let sim = res.train;
    for (let i = 0; i < 40; i++) {
      sim = stepRunningTraining(sim, false, 0.03).train;
    }
    expect(sim.isGrounded).toBe(true);
    expect(sim.duckY).toBe(280);
  });

  test('collects corn seeds during running training', () => {
    const initialStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    let train = startRunningTraining(initialStats);
    // Place seed directly on duck position (duckX=80, duckY=280)
    train.seeds = [{ id: 'test_s', x: 80, y: 280, collected: false }];

    const res = stepRunningTraining(train, false, 0.02);
    expect(res.seedPicked).toBe(true);
    expect(res.train.seedsCollected).toBe(1);
  });

  test('flapping wing lifts duck in flying training while falling crashes to ground', () => {
    const initialStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    let train = startFlyingTraining(initialStats);
    const res = stepFlyingTraining(train, true, 0.02);
    expect(res.train.duckVy).toBe(-240);

    // Drop duck to ground
    train.duckY = 325;
    const crashRes = stepFlyingTraining(train, false, 0.02);
    expect(crashRes.crashed).toBe(true);
    expect(crashRes.train.gameOver).toBe(true);
  });

  test('swimming training dives underwater when dive input is held', () => {
    const initialStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    let train = startSwimmingTraining(initialStats);
    expect(train.duckY).toBe(220); // surface

    // Hold dive for 5 steps
    for (let i = 0; i < 5; i++) {
      train = stepSwimmingTraining(train, true, 0.03).train;
    }
    expect(train.duckY).toBeGreaterThan(220); // moved underwater towards 310
    expect(train.isDiving).toBe(true);
  });

  test('starts championship sprint race with speed scaled by running level', () => {
    const statsLvl1 = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    const statsLvl5 = { ...statsLvl1, runningLevel: 5 };

    const race1 = startRace(statsLvl1, 'sprint');
    const race5 = startRace(statsLvl5, 'sprint');

    expect(race5.playerSpeed).toBeGreaterThan(race1.playerSpeed);
    expect(race1.rivals.length).toBe(3);
    expect(race1.distanceTotal).toBe(800);
  });

  test('detects race finish and awards first place when crossing 800m ahead of rivals', () => {
    const stats = {
      runningLevel: 10,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 25,
      activeHat: 'none' as const,
      unlockedHats: ['none' as const],
      racesWon: 0,
    };

    let race = startRace(stats, 'sprint');
    // Set player right before finish line
    race.playerProgress = 795;
    race.rivals.forEach((r) => (r.progress = 500));

    const res = stepRace(race, false, 0.05);
    expect(res.justFinished).toBe(true);
    expect(res.wonFirstPlace).toBe(true);
    expect(res.race.playerPlace).toBe(1);
    expect(res.race.finished).toBe(true);
  });

  test('purchases and equips hats in shop with valid coin transactions', () => {
    let stats: DuckStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 100,
      activeHat: 'none',
      unlockedHats: ['none'],
      racesWon: 0,
    };

    // Buy headband (30 coins)
    stats = buyHat(stats, 'headband');
    expect(stats.coins).toBe(70);
    expect(stats.unlockedHats).toContain('headband');
    expect(stats.activeHat).toBe('headband');

    // Equip back to none
    stats = equipHat(stats, 'none');
    expect(stats.activeHat).toBe('none');

    // Equip headband again
    stats = equipHat(stats, 'headband');
    expect(stats.activeHat).toBe('headband');
  });

  test('purchases energy seeds and increases energyLevel', () => {
    let stats: DuckStats = {
      runningLevel: 1,
      runningXp: 0,
      flyingLevel: 1,
      flyingXp: 0,
      swimmingLevel: 1,
      swimmingXp: 0,
      energyLevel: 1,
      coins: 50,
      activeHat: 'none',
      unlockedHats: ['none'],
      racesWon: 0,
    };

    stats = buyEnergySeed(stats);
    expect(stats.coins).toBe(25);
    expect(stats.energyLevel).toBe(2);
  });
});

import { describe, expect, it } from 'bun:test';
import {
  BUILDING_CONFIGS,
  calculateBuildingStage,
  calculateTownProsperity,
  getTownMapState,
} from './townEngine';
import { TownBuilding } from './types';

describe('Town Map Progression & Building Engine', () => {
  describe('calculateBuildingStage', () => {
    const requirements = [1, 4, 8];

    it('returns Stage 0 (0/1 Lot) when metric is 0', () => {
      const result = calculateBuildingStage(0, requirements);
      expect(result.stage).toBe(0);
      expect(result.progressRatio).toBe('0/1');
      expect(result.progressPercent).toBe(0);
      expect(result.nextRequirement).toBe(1);
      expect(result.remaining).toBe(1);
    });

    it('returns Stage 1 (1/3 Shelter) when metric meets first milestone', () => {
      const result = calculateBuildingStage(1, requirements);
      expect(result.stage).toBe(1);
      expect(result.progressRatio).toBe('1/3');
      expect(result.progressPercent).toBe(0);
      expect(result.nextRequirement).toBe(4);
      expect(result.remaining).toBe(3);
    });

    it('returns Stage 1 with partial progress toward Stage 2', () => {
      const result = calculateBuildingStage(2, requirements);
      expect(result.stage).toBe(1);
      expect(result.progressRatio).toBe('1/3');
      expect(result.progressPercent).toBe(33); // (2-1)/(4-1) = 33%
      expect(result.nextRequirement).toBe(4);
      expect(result.remaining).toBe(2);
    });

    it('returns Stage 2 (2/3 Lodge) when metric meets second milestone', () => {
      const result = calculateBuildingStage(4, requirements);
      expect(result.stage).toBe(2);
      expect(result.progressRatio).toBe('2/3');
      expect(result.progressPercent).toBe(0);
      expect(result.nextRequirement).toBe(8);
      expect(result.remaining).toBe(4);
    });

    it('returns Stage 3 (3/3 MAX) when metric reaches or exceeds third milestone', () => {
      const result = calculateBuildingStage(8, requirements);
      expect(result.stage).toBe(3);
      expect(result.progressRatio).toBe('3/3 MAX');
      expect(result.progressPercent).toBe(100);
      expect(result.nextRequirement).toBeNull();
      expect(result.remaining).toBe(0);

      const beyond = calculateBuildingStage(15, requirements);
      expect(beyond.stage).toBe(3);
      expect(beyond.progressRatio).toBe('3/3 MAX');
      expect(beyond.remaining).toBe(0);
    });
  });

  describe('calculateTownProsperity', () => {
    function makeDummyBuilding(stage: number): TownBuilding {
      return {
        id: 'dog-kennel',
        name: 'Canine Care Resort',
        gameId: 'dog-parking',
        gameTitle: 'Dog Parking',
        gameRoute: '/games/dog-parking/',
        category: 'pets',
        mascot: '🐶',
        currentStage: stage,
        maxStage: 3,
        metricLabel: 'Levels',
        currentMetric: stage,
        stageRequirements: [1, 4, 8],
        progressRatio: `${stage}/3`,
        progressPercent: stage * 33,
        nextStageRequirement: stage < 3 ? stage + 1 : null,
        metricRemaining: 0,
        stages: [],
        mapCoords: { x: 0, y: 0 },
      };
    }

    it('calculates Level 1 (Quiet Rural Clearing) for 0 stars', () => {
      const buildings = Array(9)
        .fill(0)
        .map(() => makeDummyBuilding(0));
      const prosperity = calculateTownProsperity(buildings);
      expect(prosperity.totalStars).toBe(0);
      expect(prosperity.maxStars).toBe(27);
      expect(prosperity.percent).toBe(0);
      expect(prosperity.townLevel).toBe(1);
      expect(prosperity.townTitle).toContain('Quiet Rural Clearing');
      expect(prosperity.nextLevelStars).toBe(6);
    });

    it('calculates Level 2 (Happy Animal Village) for 6 stars', () => {
      const buildings = [
        ...Array(6).fill(0).map(() => makeDummyBuilding(1)),
        ...Array(3).fill(0).map(() => makeDummyBuilding(0)),
      ];
      const prosperity = calculateTownProsperity(buildings);
      expect(prosperity.totalStars).toBe(6);
      expect(prosperity.townLevel).toBe(2);
      expect(prosperity.townTitle).toContain('Happy Animal Village');
      expect(prosperity.nextLevelStars).toBe(12);
    });

    it('calculates Level 3 (Prosperous Pet County) for 12 stars', () => {
      const buildings = Array(9)
        .fill(0)
        .map((_, i) => makeDummyBuilding(i < 6 ? 2 : 0)); // 6 * 2 = 12
      const prosperity = calculateTownProsperity(buildings);
      expect(prosperity.totalStars).toBe(12);
      expect(prosperity.townLevel).toBe(3);
      expect(prosperity.townTitle).toContain('Prosperous Pet County');
      expect(prosperity.nextLevelStars).toBe(18);
    });

    it('calculates Level 4 (Thriving Animal Metropolis) for 18 stars', () => {
      const buildings = Array(9)
        .fill(0)
        .map(() => makeDummyBuilding(2)); // 9 * 2 = 18
      const prosperity = calculateTownProsperity(buildings);
      expect(prosperity.totalStars).toBe(18);
      expect(prosperity.townLevel).toBe(4);
      expect(prosperity.townTitle).toContain('Thriving Animal Metropolis');
      expect(prosperity.nextLevelStars).toBe(24);
    });

    it('calculates Level 5 (Golden Animal Utopia) for 27 stars (All MAX)', () => {
      const buildings = Array(9)
        .fill(0)
        .map(() => makeDummyBuilding(3)); // 9 * 3 = 27
      const prosperity = calculateTownProsperity(buildings);
      expect(prosperity.totalStars).toBe(27);
      expect(prosperity.townLevel).toBe(5);
      expect(prosperity.townTitle).toContain('Golden Animal Utopia');
      expect(prosperity.nextLevelStars).toBeNull();
      expect(prosperity.percent).toBe(100);
    });
  });

  describe('getTownMapState and building registry', () => {
    it('contains all 9 games mapped to buildings', () => {
      const keys = Object.keys(BUILDING_CONFIGS);
      expect(keys.length).toBe(9);
      expect(keys).toContain('dog-kennel');
      expect(keys).toContain('cat-castle');
      expect(keys).toContain('dairy-barn');
      expect(keys).toContain('hay-silo');
      expect(keys).toContain('windmill-flight');
      expect(keys).toContain('safari-sanctuary');
      expect(keys).toContain('sugar-mill');
      expect(keys).toContain('duck-pond');
      expect(keys).toContain('farm-supermarket');
    });

    it('generates state with overrides accurately', () => {
      const state = getTownMapState({
        'dog-kennel': 8, // Max stage 3
        'cat-castle': 1, // Stage 1
        'duck-pond': 600, // Max stage 3
        'farm-supermarket': 160, // Stage 2
      });

      expect(state.buildings.length).toBe(9);

      const dog = state.buildings.find((b) => b.id === 'dog-kennel')!;
      expect(dog.currentStage).toBe(3);
      expect(dog.progressRatio).toBe('3/3 MAX');

      const cat = state.buildings.find((b) => b.id === 'cat-castle')!;
      expect(cat.currentStage).toBe(1);
      expect(cat.progressRatio).toBe('1/3');

      const duck = state.buildings.find((b) => b.id === 'duck-pond')!;
      expect(duck.currentStage).toBe(3);
      expect(duck.progressRatio).toBe('3/3 MAX');

      const mart = state.buildings.find((b) => b.id === 'farm-supermarket')!;
      expect(mart.currentStage).toBe(2);
      expect(mart.progressRatio).toBe('2/3');
    });
  });
});

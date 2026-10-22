import { beforeEach, describe, expect, it } from 'bun:test';
import {
  applyBuildingUpgrade,
  checkUpgradeEligibility,
  createDefaultFarmState,
  generateInitial30Levels,
  getFarmRenovationState,
  getStarsInBracket,
  INITIAL_BUILDING_CONFIGS,
  recordLevelResult,
  saveFarmRenovationState,
} from './farmRenovationEngine';

describe('Farm Renovation Engine & 30-Level Progression', () => {
  beforeEach(() => {
    // Reset state before each test
    const fresh = createDefaultFarmState();
    saveFarmRenovationState(fresh);
  });

  describe('createDefaultFarmState and initial config', () => {
    it('initializes all 9 farm buildings in broken stage (repairStage = 0)', () => {
      const state = createDefaultFarmState();
      const buildingKeys = Object.keys(INITIAL_BUILDING_CONFIGS);

      expect(buildingKeys.length).toBe(9);
      for (const key of buildingKeys) {
        const b = state.buildings[key as keyof typeof state.buildings];
        expect(b).toBeDefined();
        expect(b.repairStage).toBe(0); // Starts broken!
        expect(b.brokenVisual).toBeDefined();
        expect(b.brokenVisual.flaw).toContain('⚠️');
        expect(b.levels.length).toBe(30);
        expect(b.levels[0].unlocked).toBe(true);
        expect(b.levels[0].completed).toBe(false);
        expect(b.levels[1].unlocked).toBe(false);
      }
      expect(state.totalStars).toBe(0);
      expect(state.completedRenovations).toBe(0);
    });

    it('generates 30 levels with correct defaults', () => {
      const levels = generateInitial30Levels();
      expect(levels.length).toBe(30);
      expect(levels[0].levelNumber).toBe(1);
      expect(levels[0].unlocked).toBe(true);
      expect(levels[29].levelNumber).toBe(30);
      expect(levels[29].unlocked).toBe(false);
      expect(levels[29].stars).toBe(0);
    });
  });

  describe('getStarsInBracket calculation', () => {
    it('calculates stars accurately for level 1-10 bracket', () => {
      const levels = generateInitial30Levels();

      // No levels completed
      const initial = getStarsInBracket(levels, 1, 10);
      expect(initial.earned).toBe(0);
      expect(initial.max).toBe(30);
      expect(initial.completedCount).toBe(0);

      // Complete 5 levels with 3 stars each
      for (let i = 0; i < 5; i++) {
        levels[i].completed = true;
        levels[i].stars = 3;
      }
      const half = getStarsInBracket(levels, 1, 10);
      expect(half.earned).toBe(15);
      expect(half.completedCount).toBe(5);

      // Complete all 10 levels with 3 stars
      for (let i = 5; i < 10; i++) {
        levels[i].completed = true;
        levels[i].stars = 3;
      }
      const full = getStarsInBracket(levels, 1, 10);
      expect(full.earned).toBe(30);
      expect(full.completedCount).toBe(10);
    });
  });

  describe('recordLevelResult and unlocking mechanics', () => {
    it('records level win, assigns stars, unlocks next level, and recalculates totalStars', () => {
      // Record Level 1 for Barn
      const res1 = recordLevelResult('barn', 1, 3, 1500);
      expect(res1.unlockedNextLevel).toBe(true);

      const barn = res1.state.buildings.barn;
      expect(barn.levels[0].completed).toBe(true);
      expect(barn.levels[0].stars).toBe(3);
      expect(barn.levels[0].bestScore).toBe(1500);
      expect(barn.levels[1].unlocked).toBe(true);
      expect(res1.state.totalStars).toBe(3);

      // Record a worse score later, should retain best stars & best score
      const resRepeat = recordLevelResult('barn', 1, 1, 800);
      expect(resRepeat.state.buildings.barn.levels[0].stars).toBe(3);
      expect(resRepeat.state.buildings.barn.levels[0].bestScore).toBe(1500);
    });

    it('triggers upgrade tier when reaching level 10 with sufficient stars', () => {
      // Complete levels 1 through 9 with 3 stars
      for (let l = 1; l <= 9; l++) {
        recordLevelResult('barn', l, 3, 1000);
      }

      // Complete level 10 with 3 stars -> triggers Tier 1 renovation offer!
      const res10 = recordLevelResult('barn', 10, 3, 1000);
      expect(res10.triggeredUpgradeTier).toBe(1);

      // State now has 30 stars from barn
      expect(res10.state.totalStars).toBe(30);
      expect(res10.state.buildings.barn.repairStage).toBe(0); // Offer triggered, user must accept/apply
    });
  });

  describe('checkUpgradeEligibility and applyBuildingUpgrade', () => {
    it('correctly assesses eligibility and upgrades the building stage', () => {
      const state = getFarmRenovationState();
      const barn = state.buildings.barn;

      // Initially ineligible (0 stars, 0 completed)
      const initialCheck = checkUpgradeEligibility(barn, 1);
      expect(initialCheck.eligible).toBe(false);

      // Simulate completing 10 levels with 24 stars
      for (let i = 0; i < 8; i++) {
        barn.levels[i].completed = true;
        barn.levels[i].stars = 3; // 8 * 3 = 24
      }
      const eligibleCheck = checkUpgradeEligibility(barn, 1);
      expect(eligibleCheck.eligible).toBe(true);
      expect(eligibleCheck.starsEarned).toBe(24);

      // Apply Tier 1 upgrade
      const upgradedState = applyBuildingUpgrade('barn', 1);
      expect(upgradedState.buildings.barn.repairStage).toBe(1);
      expect(upgradedState.completedRenovations).toBe(1);

      // Now Tier 1 should no longer be eligible since it is already at stage 1
      const checkAfter = checkUpgradeEligibility(upgradedState.buildings.barn, 1);
      expect(checkAfter.eligible).toBe(false);

      // Verify Tier 2 eligibility with 24 stars in levels 11-20
      const barnAfter = upgradedState.buildings.barn;
      expect(checkUpgradeEligibility(barnAfter, 2).eligible).toBe(false);

      for (let i = 10; i < 18; i++) {
        barnAfter.levels[i].completed = true;
        barnAfter.levels[i].stars = 3; // 8 * 3 = 24 stars in bracket 11-20
      }

      const tier2Check = checkUpgradeEligibility(barnAfter, 2);
      expect(tier2Check.eligible).toBe(true);
      expect(tier2Check.starsEarned).toBe(24);
      expect(tier2Check.requiredStars).toBe(24);

      // Apply Tier 2 upgrade
      const stage2State = applyBuildingUpgrade('barn', 2);
      expect(stage2State.buildings.barn.repairStage).toBe(2);

      // Verify Tier 3 eligibility with 24 stars in levels 21-30
      const barnStage2 = stage2State.buildings.barn;
      expect(checkUpgradeEligibility(barnStage2, 3).eligible).toBe(false);

      for (let i = 20; i < 28; i++) {
        barnStage2.levels[i].completed = true;
        barnStage2.levels[i].stars = 3; // 8 * 3 = 24 stars in bracket 21-30
      }

      const tier3Check = checkUpgradeEligibility(barnStage2, 3);
      expect(tier3Check.eligible).toBe(true);
      expect(tier3Check.starsEarned).toBe(24);
      expect(tier3Check.requiredStars).toBe(24);

      // Apply Tier 3 upgrade
      const stage3State = applyBuildingUpgrade('barn', 3);
      expect(stage3State.buildings.barn.repairStage).toBe(3);
    });

    it('verifies all 9 building stages have consistent requiredStars (24) per bracket', () => {
      for (const [id, config] of Object.entries(INITIAL_BUILDING_CONFIGS)) {
        expect(config.stages.length).toBe(3);
        expect(config.stages[0].requiredStars).toBe(24);
        expect(config.stages[1].requiredStars).toBe(24);
        expect(config.stages[2].requiredStars).toBe(24);
      }
    });

    it('prevents downgrading building stage', () => {
      applyBuildingUpgrade('silo', 2);
      const state = getFarmRenovationState();
      expect(state.buildings.silo.repairStage).toBe(2);

      // Attempt to downgrade to stage 1
      const attemptDowngrade = applyBuildingUpgrade('silo', 1);
      expect(attemptDowngrade.buildings.silo.repairStage).toBe(2);
    });
  });
});

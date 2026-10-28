import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  selectTool,
  applyScrub,
  calculateCleanPercent,
  isStageFullyClean,
  nextStage,
  restartStage,
  STAGES,
} from './engine';

describe('Piggy Mud Wash Logic Engine', () => {
  it('initializes with Penny the Piglet, sponge tool, and 0% clean progress', () => {
    const state = createInitialState();
    expect(state.currentStageIndex).toBe(0);
    expect(state.selectedTool).toBe('sponge');
    expect(state.score).toBe(0);
    expect(state.cleanPercent).toBe(0);
    expect(state.stageComplete).toBe(false);
    expect(state.gameComplete).toBe(false);
    expect(state.patches.length).toBe(STAGES[0]!.patches.length);
    expect(state.patches.every((p) => p.dirtLevel === 1.0)).toBe(true);
  });

  it('allows switching between sponge, water jet, and fluffy towel tools', () => {
    let state = createInitialState();
    expect(state.selectedTool).toBe('sponge');

    state = selectTool(state, 'water');
    expect(state.selectedTool).toBe('water');

    state = selectTool(state, 'towel');
    expect(state.selectedTool).toBe('towel');
  });

  it('scrubs mud with sponge, applying soap bubbles and loosening dirt', () => {
    const state = createInitialState();
    const patch0 = state.patches[0]!;

    const { nextState, result } = applyScrub(state, patch0.x, patch0.y);
    expect(result.soapApplied).toBeGreaterThan(0);
    expect(result.cleanedAmount).toBeGreaterThan(0);
    expect(nextState.patches[0]!.soapLevel).toBeGreaterThan(0);
    expect(nextState.patches[0]!.dirtLevel).toBeLessThan(1.0);
    expect(nextState.score).toBeGreaterThan(0);
  });

  it('rinses soapy mud away with water tool, leaving patch clean and wet', () => {
    let state = createInitialState();
    const patch0 = state.patches[0]!;

    // Soap it first
    state = applyScrub(state, patch0.x, patch0.y).nextState;

    // Switch to water and rinse
    state = selectTool(state, 'water');
    const { nextState, result } = applyScrub(state, patch0.x, patch0.y);

    expect(result.rinsedAmount).toBeGreaterThan(0);
    expect(nextState.patches[0]!.isWet).toBe(true);
    expect(nextState.patches[0]!.soapLevel).toBeLessThan(state.patches[0]!.soapLevel);
  });

  it('dries wet animal patches with towel tool once dirt and soap are clear', () => {
    let state = createInitialState();
    // Artificially clean patch 0 to mostly clean & wet
    state.patches[0]!.dirtLevel = 0.05;
    state.patches[0]!.soapLevel = 0.05;
    state.patches[0]!.isWet = true;

    state = selectTool(state, 'towel');
    const { nextState, result } = applyScrub(state, state.patches[0]!.x, state.patches[0]!.y);

    expect(result.driedAmount).toBe(1);
    expect(nextState.patches[0]!.isWet).toBe(false);
    expect(nextState.patches[0]!.dirtLevel).toBe(0);
    expect(nextState.patches[0]!.soapLevel).toBe(0);
  });

  it('computes clean percentage correctly based on dirt, soap, and dry state', () => {
    const state = createInitialState();
    expect(calculateCleanPercent(state.patches)).toBe(0);

    // Set all patches to clean, rinsed, and dry
    const cleanPatches = state.patches.map((p) => ({
      ...p,
      dirtLevel: 0,
      soapLevel: 0,
      isWet: false,
    }));
    expect(calculateCleanPercent(cleanPatches)).toBe(100);
    expect(isStageFullyClean(cleanPatches)).toBe(true);
  });

  it('awards blue ribbon and 500 bonus points when stage is fully completed', () => {
    let state = createInitialState();
    // Leave all patches almost clean
    state.patches = state.patches.map((p) => ({
      ...p,
      dirtLevel: 0.02,
      soapLevel: 0.02,
      isWet: true,
    }));

    state = selectTool(state, 'towel');
    // Dry each patch
    for (const p of state.patches) {
      state = applyScrub(state, p.x, p.y).nextState;
    }

    expect(state.stageComplete).toBe(true);
    expect(state.ribbonAwarded).toBe(true);
    expect(state.score).toBeGreaterThanOrEqual(500);
  });

  it('advances through all 4 animal stages and triggers game complete', () => {
    let state = createInitialState();
    expect(state.currentStageIndex).toBe(0); // Penny the Piglet

    state = nextStage(state);
    expect(state.currentStageIndex).toBe(1); // Barnaby the Golden Pup
    expect(state.cleanPercent).toBe(0);

    state = nextStage(state);
    expect(state.currentStageIndex).toBe(2); // Daisy the Baby Calf

    state = nextStage(state);
    expect(state.currentStageIndex).toBe(3); // Woolly the Lamb

    state = nextStage(state);
    expect(state.gameComplete).toBe(true);
  });

  it('resets current stage patches on restart while retaining accumulated score', () => {
    let state = createInitialState();
    state = applyScrub(state, state.patches[0]!.x, state.patches[0]!.y).nextState;
    const scoreBefore = state.score;

    state = restartStage(state);
    expect(state.cleanPercent).toBe(0);
    expect(state.stageComplete).toBe(false);
    expect(state.patches[0]!.dirtLevel).toBe(1.0);
    expect(state.score).toBe(scoreBefore);
  });
});

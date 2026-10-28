import { describe, expect, it } from 'bun:test';
import {
  initKoiPond,
  dropFoodPellet,
  addWaterRipple,
  triggerSingingBowl,
  activatePetalShower,
  updateKoiPond,
  advanceToNextStage,
  STAGES,
} from './engine';

describe('Koi Pond: Zen Water Garden Engine', () => {
  it('initializes Stage 1 correctly with pure state', () => {
    const pond = initKoiPond(1, 480, 640);
    expect(pond.stage).toBe(1);
    expect(pond.stageConfig.title).toBe('Bamboo Grove Spring');
    expect(pond.targetZen).toBe(150);
    expect(pond.zenPoints).toBe(0);
    expect(pond.fish.length).toBeGreaterThanOrEqual(4);
    expect(pond.lilyPads.length).toBe(4);
    expect(pond.isStageCompleted).toBe(false);
    expect(pond.gameCompleted).toBe(false);
  });

  it('drops standard and golden food pellets with ripples', () => {
    let pond = initKoiPond(1, 480, 640);
    pond = dropFoodPellet(pond, 200, 300, false);
    expect(pond.pellets.length).toBe(1);
    expect(pond.pellets[0].points).toBe(10);
    expect(pond.pellets[0].isGolden).toBe(false);
    expect(pond.ripples.length).toBe(1);

    pond = dropFoodPellet(pond, 250, 350, true);
    expect(pond.pellets.length).toBe(2);
    expect(pond.pellets[1].points).toBe(30);
    expect(pond.pellets[1].isGolden).toBe(true);
    expect(pond.ripples.length).toBe(2);
  });

  it('clamps pellet drop coordinates within pond margins', () => {
    let pond = initKoiPond(1, 480, 640);
    pond = dropFoodPellet(pond, -50, 9999);
    expect(pond.pellets[0].x).toBe(20);
    expect(pond.pellets[0].y).toBe(610);
  });

  it('triggers singing bowl boost and respects cooldown', () => {
    let pond = initKoiPond(1, 480, 640);
    const initialZen = pond.zenPoints;
    const res1 = triggerSingingBowl(pond);
    expect(res1.success).toBe(true);
    expect(res1.state.singingBowlCooldown).toBe(20);
    expect(res1.state.zenPoints).toBe(initialZen + 25);
    expect(res1.state.ripples.length).toBe(1);

    // Immediate second trigger should fail due to cooldown
    const res2 = triggerSingingBowl(res1.state);
    expect(res2.success).toBe(false);
    expect(res2.state.singingBowlCooldown).toBe(20);
  });

  it('activates petal shower multiplier boost', () => {
    let pond = initKoiPond(1, 480, 640);
    expect(pond.multiplier).toBe(1);
    pond = activatePetalShower(pond);
    expect(pond.petalShowerActive).toBe(true);
    expect(pond.multiplier).toBe(2);
    expect(pond.petalShowerTimer).toBe(12);
  });

  it('simulates fish pursuing and eating food pellets', () => {
    let pond = initKoiPond(1, 480, 640);
    // Position fish 0 directly at (200, 200) facing right
    pond.fish[0].x = 200;
    pond.fish[0].y = 200;
    pond.fish[0].angle = 0;
    pond.fish[0].length = 45;

    // Drop pellet directly in front of fish 0 mouth
    pond = dropFoodPellet(pond, 220, 200, false);

    // Update simulation
    const { newState, result } = updateKoiPond(pond, 0.05);

    expect(result.fedEvents.length).toBeGreaterThanOrEqual(1);
    expect(result.fedEvents[0].pointsEarned).toBe(10);
    expect(newState.zenPoints).toBe(10);
    expect(newState.totalFedCount).toBe(1);
    expect(newState.pellets.length).toBe(0); // consumed
  });

  it('blooms lotus lily pads upon feeding fish', () => {
    let pond = initKoiPond(1, 480, 640);
    // Pad 0 starts at bloomProgress 0
    expect(pond.lilyPads[0].isBloomed).toBe(false);

    // Simulate several feeding events with cooldowns handled
    for (let i = 0; i < 4; i++) {
      pond.fish[0].x = 100;
      pond.fish[0].y = 100;
      pond.fish[0].angle = 0;
      pond.fish[0].eatCooldown = 0;
      pond = dropFoodPellet(pond, 115, 100, false);
      const update = updateKoiPond(pond, 0.05);
      pond = update.newState;
    }

    // At least one lily pad should have bloomed
    const anyBloomed = pond.lilyPads.some((p) => p.isBloomed);
    expect(anyBloomed).toBe(true);
  });

  it('detects stage completion when target zen is reached', () => {
    let pond = initKoiPond(1, 480, 640);
    expect(pond.isStageCompleted).toBe(false);

    // Set zen points just below target (150)
    pond.zenPoints = 145;
    pond.fish[0].x = 100;
    pond.fish[0].y = 100;
    pond.fish[0].angle = 0;
    pond.fish[0].eatCooldown = 0;
    pond = dropFoodPellet(pond, 115, 100, false);

    const { newState, result } = updateKoiPond(pond, 0.05);
    expect(result.stageJustCompleted).toBe(true);
    expect(newState.isStageCompleted).toBe(true);
  });

  it('advances cleanly through stages up to the grand finale', () => {
    let pond = initKoiPond(1, 480, 640);
    expect(pond.stage).toBe(1);

    // Advance to Stage 2
    pond = advanceToNextStage(pond);
    expect(pond.stage).toBe(2);
    expect(pond.stageConfig.title).toBe('Cherry Blossom Basin');
    expect(pond.stageConfig.unlockedBreeds).toContain('showa');

    // Advance to Stage 3
    pond = advanceToNextStage(pond);
    expect(pond.stage).toBe(3);
    expect(pond.stageConfig.unlockedBreeds).toContain('tancho');

    // Advance to Stage 4 (Moonlit Sanctuary)
    pond = advanceToNextStage(pond);
    expect(pond.stage).toBe(4);
    expect(pond.stageConfig.unlockedBreeds).toContain('butterfly_sakura');

    // Victory in Stage 4
    pond.zenPoints = STAGES[3].targetZen - 5;
    pond.fish[0].x = 150;
    pond.fish[0].y = 150;
    pond.fish[0].angle = 0;
    pond.fish[0].eatCooldown = 0;
    pond = dropFoodPellet(pond, 165, 150, false);
    const { newState, result } = updateKoiPond(pond, 0.05);
    expect(result.gameJustCompleted).toBe(true);
    expect(newState.gameCompleted).toBe(true);
  });

  it('keeps fish swimming inside pond boundaries via edge repulsion', () => {
    let pond = initKoiPond(1, 480, 640);
    // Put fish near far right edge moving right
    pond.fish[0].x = 475;
    pond.fish[0].y = 300;
    pond.fish[0].angle = 0; // facing right

    const { newState } = updateKoiPond(pond, 0.05);
    // Target angle should be redirected away from edge (Math.PI)
    expect(newState.fish[0].targetAngle).toBe(Math.PI);
    expect(newState.fish[0].x).toBeLessThanOrEqual(480);
  });

  it('creates water ripples along touch drag path with bounding clamps', () => {
    let pond = initKoiPond(1, 480, 640);
    expect(pond.ripples.length).toBe(0);

    pond = addWaterRipple(pond, 150, 220);
    expect(pond.ripples.length).toBe(1);
    expect(pond.ripples[0].x).toBe(150);
    expect(pond.ripples[0].y).toBe(220);
    expect(pond.ripples[0].radius).toBe(3);

    // Out-of-bounds coordinates get clamped
    pond = addWaterRipple(pond, -100, 9999);
    expect(pond.ripples.length).toBe(2);
    expect(pond.ripples[1].x).toBe(10);
    expect(pond.ripples[1].y).toBe(630);
  });
});

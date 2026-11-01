import { describe, expect, it } from 'bun:test';
import {
  initLevelDevilGame,
  stepLevelDevilGame,
  TOTAL_LEVELS,
} from './engine';

describe('Level Devil: Mischief Meadow Logic Engine', () => {
  it('initializes game with valid defaults, player coordinates, and 0 deaths', () => {
    const state = initLevelDevilGame(1, 0);
    expect(state.levelIndex).toBe(1);
    expect(state.player.alive).toBe(true);
    expect(state.player.reachedDoor).toBe(false);
    expect(state.deaths).toBe(0);
    expect(state.status).toBe('playing');
    expect(state.platforms.length).toBeGreaterThan(0);
  });

  it('moves player horizontally on directional input', () => {
    let state = initLevelDevilGame(1, 0);
    const startX = state.player.x;

    // Simulate stepping right for 3 frames
    for (let i = 0; i < 3; i++) {
      state = stepLevelDevilGame(state, { right: true }, 0.016);
    }
    expect(state.player.x).toBeGreaterThan(startX);
    expect(state.player.facing).toBe('right');
  });

  it('jumps upward when on ground and jump input is pressed', () => {
    let state = initLevelDevilGame(1, 0);
    state.player.onGround = true;

    state = stepLevelDevilGame(state, { jump: true }, 0.016);
    expect(state.player.vy).toBeLessThan(0);
    expect(state.player.onGround).toBe(false);
  });

  it('triggers Level 1 trap platform when player steps near it', () => {
    let state = initLevelDevilGame(1, 0);
    const trapPlatform = state.platforms.find((p) => p.type === 'trap')!;
    expect(trapPlatform.triggered).toBeFalsy();

    // Position player right before trap platform
    state.player.x = trapPlatform.x;
    state = stepLevelDevilGame(state, {}, 0.033);

    const updatedTrap = state.platforms.find((p) => p.type === 'trap')!;
    expect(updatedTrap.triggered).toBe(true);
    expect(updatedTrap.y).toBeGreaterThan(trapPlatform.y);
  });

  it('teleports the door backward in Level 2 when approached', () => {
    let state = initLevelDevilGame(2, 0);
    expect(state.door.shifted).toBeFalsy();
    const origDoorX = state.door.x;

    // Move player past the trigger line (x >= 520)
    state.player.x = 540;
    state = stepLevelDevilGame(state, {}, 0.016);

    expect(state.door.shifted).toBe(true);
    expect(state.door.x).toBeLessThan(origDoorX);
  });

  it('drops ceiling spike in Level 3 when player walks underneath', () => {
    let state = initLevelDevilGame(3, 0);
    const fallingSpike = state.hazards.find((h) => h.type === 'falling_spike')!;
    expect(fallingSpike.triggered).toBeFalsy();

    // Walk player past triggerX
    state.player.x = fallingSpike.triggerX! + 10;
    state = stepLevelDevilGame(state, {}, 0.033);

    const updatedSpike = state.hazards.find((h) => h.id === fallingSpike.id)!;
    expect(updatedSpike.triggered).toBe(true);
    expect(updatedSpike.y).toBeGreaterThan(fallingSpike.y);
  });

  it('triggers death and increments death counter when hitting a hazard', () => {
    let state = initLevelDevilGame(1, 2);
    // Position player right inside a hazard
    const hazard = state.hazards[0];
    state.player.x = hazard.x;
    state.player.y = hazard.y;

    state = stepLevelDevilGame(state, {}, 0.016);
    expect(state.player.alive).toBe(false);
    expect(state.status).toBe('died');
    expect(state.deaths).toBe(3);
    expect(state.message.length).toBeGreaterThan(0);
  });

  it('triggers death when falling below the bottom of the world', () => {
    let state = initLevelDevilGame(1, 0);
    state.player.y = 550; // below 480 + 40

    state = stepLevelDevilGame(state, {}, 0.016);
    expect(state.status).toBe('died');
    expect(state.deaths).toBe(1);
  });

  it('clears level when player reaches the exit door', () => {
    let state = initLevelDevilGame(1, 0);
    // Move player right into the door
    state.player.x = state.door.x;
    state.player.y = state.door.y;

    state = stepLevelDevilGame(state, {}, 0.016);
    expect(state.player.reachedDoor).toBe(true);
    expect(state.status).toBe('level_cleared');
  });

  it('triggers victory when completing Level 6', () => {
    let state = initLevelDevilGame(TOTAL_LEVELS, 4);
    // Move player into final door
    state.player.x = state.door.x;
    state.player.y = state.door.y;

    state = stepLevelDevilGame(state, {}, 0.016);
    expect(state.status).toBe('victory');
  });
});

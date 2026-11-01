import { describe, expect, it } from 'bun:test';
import {
  findBestHookPeg,
  initStickmanHookGame,
  stepStickmanHookGame,
  TOTAL_HOOK_LEVELS,
} from './engine';

describe('Stickman Hook: Fluffy Grapple Swing Logic Engine', () => {
  it('initializes game with valid defaults, pegs, trampolines, and finish line', () => {
    const state = initStickmanHookGame(1);
    expect(state.levelIndex).toBe(1);
    expect(state.player.alive).toBe(true);
    expect(state.player.attachedPegId).toBeNull();
    expect(state.pegs.length).toBeGreaterThan(0);
    expect(state.trampolines.length).toBeGreaterThan(0);
    expect(state.status).toBe('playing');
  });

  it('pulls airborne player down with gravity when unattached', () => {
    let state = initStickmanHookGame(1);
    const startY = state.player.y;
    state.player.vy = 0;

    state = stepStickmanHookGame(state, false, 0.05);
    expect(state.player.vy).toBeGreaterThan(0);
    expect(state.player.y).toBeGreaterThan(startY);
  });

  it('finds best hook peg ahead of player within range', () => {
    const state = initStickmanHookGame(1);
    const bestPeg = findBestHookPeg(state.player, state.pegs);
    expect(bestPeg).not.toBeNull();
    expect(bestPeg!.x).toBeGreaterThan(state.player.x);
  });

  it('latches hook to nearby peg when hook is held', () => {
    let state = initStickmanHookGame(1);
    state = stepStickmanHookGame(state, true, 0.016);
    expect(state.player.attachedPegId).not.toBeNull();
    expect(state.player.ropeLength).toBeGreaterThan(0);
  });

  it('flings player forward on hook release with tangential velocity', () => {
    let state = initStickmanHookGame(1);
    // Attach hook and swing for 3 frames
    for (let i = 0; i < 3; i++) {
      state = stepStickmanHookGame(state, true, 0.016);
    }
    expect(state.player.attachedPegId).not.toBeNull();

    // Release hook
    state = stepStickmanHookGame(state, false, 0.016);
    expect(state.player.attachedPegId).toBeNull();
    expect(state.player.vx).toBeGreaterThan(0); // Forward velocity
  });

  it('bounces player upward when landing on trampoline', () => {
    let state = initStickmanHookGame(1);
    const tramp = state.trampolines[0];
    state.player.x = tramp.x + tramp.width / 2;
    state.player.y = tramp.y - state.player.radius;
    state.player.vy = 300; // falling down

    state = stepStickmanHookGame(state, false, 0.016);
    expect(state.player.vy).toBeLessThan(0); // bounced up
  });

  it('triggers failed status when player falls into abyss', () => {
    let state = initStickmanHookGame(1);
    state.player.y = 560;

    state = stepStickmanHookGame(state, false, 0.016);
    expect(state.status).toBe('failed');
    expect(state.player.alive).toBe(false);
  });

  it('triggers level_cleared when crossing finish line', () => {
    let state = initStickmanHookGame(1);
    state.player.x = state.finishLineX + 10;

    state = stepStickmanHookGame(state, false, 0.016);
    expect(state.status).toBe('level_cleared');
    expect(state.player.reachedFinish).toBe(true);
  });

  it('triggers victory on final level 4 finish line crossing', () => {
    let state = initStickmanHookGame(TOTAL_HOOK_LEVELS);
    state.player.x = state.finishLineX + 10;

    state = stepStickmanHookGame(state, false, 0.016);
    expect(state.status).toBe('victory');
  });
});

import { describe, it, expect } from 'bun:test';
import {
  createHayStackGame,
  dropBlock,
  updateHayStackGame,
  BASE_BLOCK_WIDTH,
} from './engine';

describe('Barnyard Hay Stack Core Logic Engine', () => {
  it('initializes stack with base block and moving top block', () => {
    const state = createHayStackGame();
    expect(state.status).toBe('ready');
    expect(state.stack.length).toBe(1);
    expect(state.stack[0].width).toBe(BASE_BLOCK_WIDTH);
    expect(state.activeBlock).not.toBeNull();
    expect(state.score).toBe(0);
  });

  it('drops block with perfect alignment when offset <= 3.5px', () => {
    let state = createHayStackGame();
    // Simulate near-perfect placement
    if (state.activeBlock) state.activeBlock.x = 1.5;

    state = dropBlock(state);
    expect(state.status).toBe('playing');
    expect(state.score).toBe(1);
    expect(state.perfectStreak).toBe(1);
    expect(state.stack.length).toBe(2);
    expect(state.stack[1].width).toBe(BASE_BLOCK_WIDTH); // Full width preserved!
    expect(state.events.some((e) => e.type === 'perfect')).toBe(true);
  });

  it('slices off overhanging piece when misaligned', () => {
    let state = createHayStackGame();
    if (state.activeBlock) state.activeBlock.x = 40; // 40px overhang

    state = dropBlock(state);
    expect(state.score).toBe(1);
    expect(state.perfectStreak).toBe(0);
    expect(state.stack[1].width).toBe(BASE_BLOCK_WIDTH - 40);
    expect(state.slicedPieces.length).toBe(1);
    expect(state.slicedPieces[0].width).toBe(40);
    expect(state.events.some((e) => e.type === 'slice')).toBe(true);
  });

  it('triggers game over when block completely misses the stack', () => {
    let state = createHayStackGame();
    if (state.activeBlock) state.activeBlock.x = BASE_BLOCK_WIDTH + 50; // Total miss

    state = dropBlock(state);
    expect(state.status).toBe('game_over');
    expect(state.activeBlock).toBeNull();
    expect(state.events.some((e) => e.type === 'miss')).toBe(true);
  });

  it('moves active block back and forth inside slide bounds during updates', () => {
    let state = createHayStackGame();
    const initialX = state.activeBlock?.x || 0;

    state = updateHayStackGame(state, 0.05);
    expect(state.activeBlock?.x).not.toBe(initialX);
  });
});

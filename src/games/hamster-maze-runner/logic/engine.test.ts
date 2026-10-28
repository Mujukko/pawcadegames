import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  moveHamster,
  restartStage,
  nextStage,
  STAGES,
} from './engine';

describe('Hamster Maze: Nut Escape Core Logic Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialState(2500, 0);
    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(2500);
    expect(state.player.row).toBe(1);
    expect(state.player.col).toBe(1);
    expect(state.player.hasKey).toBe(false);
    expect(state.grid.length).toBe(STAGES[0].grid.length);
    expect(state.items.length).toBeGreaterThan(0);
  });

  it('moves hamster into open path and updates target coordinates', () => {
    let state = createInitialState();
    // In Stage 1, (1, 1) has path to the right (1, 2) which is 0
    const res = moveHamster(state, 'right');
    expect(res.state.player.col).toBe(2);
    expect(res.state.player.row).toBe(1);
    expect(res.state.player.dir).toBe('right');
    expect(res.state.player.isMoving).toBe(true);
  });

  it('blocks movement into walls and emits bump_wall event', () => {
    let state = createInitialState();
    // (1, 1) has wall above it (0, 1 is 1)
    const res = moveHamster(state, 'up');
    expect(res.state.player.row).toBe(1);
    expect(res.state.player.col).toBe(1);
    expect(res.event?.type).toBe('bump_wall');
  });

  it('collects acorn and awards points', () => {
    let state = createInitialState();
    // Stage 1 item at (1, 3) is an acorn
    let cur = moveHamster(state, 'right').state; // to (1, 2)
    const res = moveHamster(cur, 'right'); // to (1, 3)
    expect(res.state.player.col).toBe(3);
    expect(res.state.score).toBeGreaterThan(0);
    expect(res.event?.type).toBe('item_collected');
    expect(res.state.items.find((i) => i.row === 1 && i.col === 3)?.isCollected).toBe(true);
  });

  it('blocks locked gate when hamster has no key', () => {
    let state = createInitialState();
    // Position player adjacent to gate at (8, 9)
    state.grid[8][8] = 0;
    state.player.row = 8;
    state.player.col = 8;
    state.player.hasKey = false;

    const res = moveHamster(state, 'right');
    expect(res.state.player.col).toBe(8); // blocked!
    expect(res.event?.type).toBe('bump_wall');
  });

  it('unlocks gate when hamster possesses key', () => {
    let state = createInitialState();
    state.grid[8][8] = 0;
    state.player.row = 8;
    state.player.col = 8;
    state.player.hasKey = true;

    const res = moveHamster(state, 'right');
    expect(res.state.player.col).toBe(9); // passed through gate!
    expect(res.state.grid[8][9]).toBe(0); // gate unlocked to open path
    expect(res.event?.type).toBe('gate_unlocked');
  });

  it('triggers stage_clear when entering exit door', () => {
    let state = createInitialState();
    // Stage 1 exit is at (9, 9)
    state.player.row = 8;
    state.player.col = 9;
    state.grid[8][9] = 0;
    // Exit is at (9, 9) which is cell 3
    state.grid[9][9] = 3;

    const res = moveHamster(state, 'down');
    expect(res.state.status).toBe('stage_clear');
    expect(res.event?.type).toBe('stage_clear');
    expect(res.state.score).toBeGreaterThan(500);
  });

  it('advances to next stage and restarts stage preserving high score', () => {
    let state = createInitialState(5000, 0);
    state.score = 600;
    const next = nextStage(state);
    expect(next.currentStageIndex).toBe(1);
    expect(next.score).toBe(600);
    expect(next.highScore).toBe(5000);

    const restarted = restartStage(next);
    expect(restarted.currentStageIndex).toBe(1);
    expect(restarted.player.row).toBe(STAGES[1].startRow);
    expect(restarted.player.col).toBe(STAGES[1].startCol);
  });
});

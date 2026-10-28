import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  setMowerDirection,
  stopMower,
  updateEngine,
  restartStage,
  nextStage,
  STAGES,
  FIELD_OFFSET_X,
  FIELD_OFFSET_Y,
  TILE_SIZE,
} from './engine';

describe('Crop Mower: Harvest Rush Core Logic Engine', () => {
  it('initializes game state with proper defaults and stage grid', () => {
    const state = createInitialState(3500, 0);
    expect(state.status).toBe('playing');
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(3500);
    expect(state.totalCut).toBe(0);
    expect(state.totalCropsInStage).toBeGreaterThan(100);
    expect(state.grid.length).toBe(STAGES[0].rows);
    expect(state.grid[0].length).toBe(STAGES[0].cols);
    expect(state.player.isMoving).toBe(false);
  });

  it('updates mower direction and begins movement', () => {
    let state = createInitialState();
    state = setMowerDirection(state, 'left');
    expect(state.player.targetDir).toBe('left');
    expect(state.player.isMoving).toBe(true);

    state = stopMower(state);
    expect(state.player.isMoving).toBe(false);
  });

  it('moves tractor and cuts crops along the way', () => {
    let state = createInitialState();
    state = setMowerDirection(state, 'up');

    // Advance 0.5s of movement
    const res = updateEngine(state, 0.5);
    expect(res.state.player.y).toBeLessThan(state.player.y); // moved up
    expect(res.state.totalCut).toBeGreaterThan(0);
    expect(res.events.some((e) => e.type === 'crop_cut')).toBe(true);
  });

  it('does not re-cut already cut crop tiles', () => {
    let state = createInitialState();
    // Force tile under player to cut
    const playerCol = Math.floor((state.player.x - FIELD_OFFSET_X) / TILE_SIZE);
    const playerRow = Math.floor((state.player.y - FIELD_OFFSET_Y) / TILE_SIZE);
    state.grid[playerRow][playerCol].state = 'cut';
    state.totalCut = 1;

    // Advance engine without moving
    state.player.isMoving = false;
    const res = updateEngine(state, 0.05);
    expect(res.state.totalCut).toBe(1);
    expect(res.events.some((e) => e.type === 'crop_cut')).toBe(false);
  });

  it('deposits basket at barn chute for score bonus', () => {
    let state = createInitialState();
    state.player.basket = 10;
    // Position player right at the barn chute (row: 0, col: 5)
    state.player.x = FIELD_OFFSET_X + 5 * TILE_SIZE + TILE_SIZE / 2;
    state.player.y = FIELD_OFFSET_Y + 0 * TILE_SIZE + TILE_SIZE / 2;
    state.player.isMoving = false;

    const res = updateEngine(state, 0.05);
    expect(res.state.player.basket).toBe(0);
    expect(res.state.score).toBeGreaterThan(0);
    const depositEv = res.events.find((e) => e.type === 'basket_deposited');
    expect(depositEv).toBeDefined();
  });

  it('triggers stage_clear when all crops are harvested', () => {
    let state = createInitialState();
    // Simulate all crops cut
    state.totalCut = state.totalCropsInStage - 1;

    // Position player on the last uncut crop
    const targetRow = 1;
    const targetCol = 1;
    state.grid[targetRow][targetCol].state = 'uncut';
    state.player.x = FIELD_OFFSET_X + targetCol * TILE_SIZE + TILE_SIZE / 2;
    state.player.y = FIELD_OFFSET_Y + targetRow * TILE_SIZE + TILE_SIZE / 2;
    state.player.isMoving = false;

    const res = updateEngine(state, 0.05);
    expect(res.state.status).toBe('stage_clear');
    expect(res.events.some((e) => e.type === 'stage_clear')).toBe(true);
  });

  it('advances to next stage and resets field', () => {
    let state = createInitialState(1000, 0);
    state.score = 500;
    const next = nextStage(state);
    expect(next.currentStageIndex).toBe(1);
    expect(next.score).toBe(500);
    expect(next.status).toBe('playing');
    expect(next.totalCut).toBe(0);
  });

  it('restarts current stage keeping accumulated score', () => {
    let state = createInitialState(1000, 1);
    state.score = 750;
    state.totalCut = 25;
    const restarted = restartStage(state);
    expect(restarted.currentStageIndex).toBe(1);
    expect(restarted.score).toBe(750);
    expect(restarted.totalCut).toBe(0);
  });
});

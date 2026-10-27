import { describe, expect, it } from 'bun:test';
import {
  createInitialTowerState,
  updateCranePosition,
  dropCurrentAnimal,
  resolveAnimalLanding,
  MAX_WOBBLE_DEGREES,
} from './engine';

describe('Barnyard Tower Engine Unit Tests', () => {
  it('initializes with default starting state', () => {
    const state = createInitialTowerState(500);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(500);
    expect(state.height).toBe(0);
    expect(state.lives).toBe(3);
    expect(state.wobble).toBe(0);
    expect(state.fallingAnimal).toBeNull();
    expect(state.gameOver).toBe(false);
  });

  it('updates crane position and reverses direction at boundaries', () => {
    let state = createInitialTowerState();
    state.craneX = 87;
    state.craneDir = 1;
    state.craneSpeed = 100;

    // Moving right reaches boundary
    state = updateCranePosition(state, 0.1);
    expect(state.craneX).toBe(88);
    expect(state.craneDir).toBe(-1);

    // Moving left
    state = updateCranePosition(state, 0.1);
    expect(state.craneX).toBeLessThan(88);
  });

  it('drops animal when dropCurrentAnimal is called', () => {
    let state = createInitialTowerState();
    state.craneX = 50;
    state = dropCurrentAnimal(state);

    expect(state.fallingAnimal).not.toBeNull();
    expect(state.fallingAnimal?.x).toBe(50);
    expect(state.fallingAnimal?.type).toBe(state.currentAnimal);

    // Multiple drop calls while falling are ignored
    const dropAgain = dropCurrentAnimal(state);
    expect(dropAgain).toBe(state);
  });

  it('records perfect stack and awards combo bonus', () => {
    let state = createInitialTowerState();
    state.craneX = 50; // exact center
    state = dropCurrentAnimal(state);

    const result = resolveAnimalLanding(state, 50, 400);
    expect(result.landed).toBe(true);
    expect(result.event).toBe('perfect');
    expect(result.state.height).toBe(1);
    expect(result.state.combo).toBe(1);
    expect(result.state.score).toBeGreaterThan(100);
  });

  it('deducts life and resets combo on missed drop', () => {
    let state = createInitialTowerState();
    state.combo = 3;
    state.craneX = 15; // far off target (target is 50)
    state = dropCurrentAnimal(state);

    const result = resolveAnimalLanding(state, 50, 400);
    expect(result.landed).toBe(false);
    expect(result.event).toBe('miss');
    expect(result.state.lives).toBe(2);
    expect(result.state.combo).toBe(0);
    expect(result.state.height).toBe(0);
  });

  it('ends game when all 3 lives are lost', () => {
    let state = createInitialTowerState();
    state.lives = 1;
    state.craneX = 12;
    state = dropCurrentAnimal(state);

    const result = resolveAnimalLanding(state, 50, 400);
    expect(result.state.lives).toBe(0);
    expect(result.state.gameOver).toBe(true);
    expect(result.event).toBe('gameover');
  });

  it('triggers milestone celebration at height 5', () => {
    let state = createInitialTowerState();
    state.height = 4;
    state.craneX = 50;
    state = dropCurrentAnimal(state);

    const result = resolveAnimalLanding(state, 50, 400);
    expect(result.state.height).toBe(5);
    expect(result.event).toBe('milestone');
    expect(result.state.milestoneReached).toBe(5);
  });
});

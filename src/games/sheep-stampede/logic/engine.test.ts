import { describe, it, expect } from 'bun:test';
import {
  initializeSheepStampedeLevel,
  steerFlock,
  stepStampedeEngine,
  applyGateOperation,
  generateSheepPositions,
  SHEEP_STAMPEDE_LEVELS,
  Gate,
} from './engine';

describe('Sheep Stampede: Pasture Rush Core Engine', () => {
  it('initializes Level 1 with 10 sheep and zero progress', () => {
    const state = initializeSheepStampedeLevel(1);
    expect(state.level).toBe(1);
    expect(state.flockCount).toBe(10);
    expect(state.trackProgress).toBe(0);
    expect(state.status).toBe('ready');
    expect(state.sheepList.length).toBe(10);
  });

  it('clamps steering within lateral pasture boundary [-140, 140]', () => {
    const state = initializeSheepStampedeLevel(1);
    const leftSteered = steerFlock(state, -250);
    expect(leftSteered.flockX).toBe(-140);

    const rightSteered = steerFlock(state, 300);
    expect(rightSteered.flockX).toBe(140);

    const centerSteered = steerFlock(state, 45);
    expect(centerSteered.flockX).toBe(45);
  });

  it('correctly calculates math gate operations', () => {
    const addGate: Gate = {
      id: 'g1',
      distY: 100,
      lane: 'left',
      x: -60,
      width: 80,
      op: 'add',
      value: 15,
      label: '+15',
      isPositive: true,
    };
    expect(applyGateOperation(10, addGate)).toBe(25);

    const multGate: Gate = {
      id: 'g2',
      distY: 100,
      lane: 'right',
      x: 60,
      width: 80,
      op: 'multiply',
      value: 3,
      label: 'x3',
      isPositive: true,
    };
    expect(applyGateOperation(10, multGate)).toBe(30);

    const subGate: Gate = {
      id: 'g3',
      distY: 100,
      lane: 'left',
      x: -60,
      width: 80,
      op: 'subtract',
      value: 4,
      label: '-4',
      isPositive: false,
    };
    expect(applyGateOperation(10, subGate)).toBe(6);

    const divGate: Gate = {
      id: 'g4',
      distY: 100,
      lane: 'right',
      x: 60,
      width: 80,
      op: 'divide',
      value: 2,
      label: '÷2',
      isPositive: false,
    };
    expect(applyGateOperation(15, divGate)).toBe(7);
  });

  it('multiplies sheep when running through a positive multiplier gate', () => {
    let state = initializeSheepStampedeLevel(1);
    state = { ...state, status: 'running' };

    // Steer left toward g1a (+10 at distY: 450, x: -75)
    state = steerFlock(state, -75);

    // Step forward past distY: 450
    // speed is 195 px/s, in 2.5 seconds it travels 487.5px
    const result = stepStampedeEngine(state, 2.5);

    expect(result.events.gateHit).toBeDefined();
    expect(result.events.gateHit?.id).toBe('g1a');
    expect(result.nextState.flockCount).toBe(20); // 10 + 10 = 20
    expect(result.nextState.comboStreak).toBe(1);
  });

  it('reduces sheep when colliding with mud obstacle', () => {
    let state = initializeSheepStampedeLevel(1);
    state = { ...state, status: 'running', trackProgress: 650 }; // obstacle is at 700, x: 0, loss: 4
    state = steerFlock(state, 0);

    // Step forward 0.25s (60px) -> progress 710
    const result = stepStampedeEngine(state, 0.25);
    expect(result.events.obstacleHit).toBeDefined();
    expect(result.events.obstacleHit?.type).toBe('mud');
    expect(result.nextState.flockCount).toBe(6); // 10 - 4 = 6
  });

  it('triggers loss when flock count drops to zero', () => {
    let state = initializeSheepStampedeLevel(1);
    state = { ...state, status: 'running', flockCount: 2, trackProgress: 650 };
    state = steerFlock(state, 0); // mud obstacle loses 4 sheep

    const result = stepStampedeEngine(state, 0.25);
    expect(result.events.loss).toBe(true);
    expect(result.nextState.status).toBe('lost');
    expect(result.nextState.flockCount).toBe(0);
  });

  it('triggers victory when reaching track finish line', () => {
    let state = initializeSheepStampedeLevel(1);
    state = { ...state, status: 'running', trackProgress: 1980 }; // trackLength is 2000

    const result = stepStampedeEngine(state, 0.2); // +48px -> 2028 >= 2000
    expect(result.events.victory).toBe(true);
    expect(result.nextState.status).toBe('won');
    expect(result.nextState.score).toBeGreaterThan(0);
  });
});

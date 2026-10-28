import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  switchGate,
  spawnSheep,
  updateEngine,
  restartGame,
  GATE_JUNCTION_Y,
} from './engine';

describe('Barnyard Sheep Sorter Core Engine', () => {
  it('initializes game state with proper defaults', () => {
    const state = createInitialState(850);
    expect(state.status).toBe('playing');
    expect(state.gateDir).toBe('left');
    expect(state.lives).toBe(3);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(850);
    expect(state.combo).toBe(0);
    expect(state.sheepList).toHaveLength(0);
    expect(state.spawnInterval).toBe(1.35);
  });

  it('switches gate direction and emits gate_switched event', () => {
    let state = createInitialState();
    expect(state.gateDir).toBe('left');

    const res = switchGate(state, 'right');
    expect(res.event?.type).toBe('gate_switched');
    expect(res.state.gateDir).toBe('right');

    const toggled = switchGate(res.state);
    expect(toggled.state.gateDir).toBe('left');
  });

  it('spawns a sheep with valid properties and target corral', () => {
    const state = createInitialState();
    const sheep = spawnSheep(state);

    expect(sheep.id).toBeDefined();
    expect(['white', 'black', 'golden', 'pink']).toContain(sheep.color);
    expect(['left', 'right']).toContain(sheep.targetGate);
    expect(sheep.speed).toBeGreaterThanOrEqual(115);
    expect(sheep.points).toBeGreaterThan(0);
  });

  it('routes correctly sorted sheep and awards combo score', () => {
    let state = createInitialState();
    state.gateDir = 'left';

    // Place a white sheep (targetGate: 'left') right at junction
    state.sheepList = [
      {
        id: 'sheep-test',
        color: 'white',
        targetGate: 'left',
        y: GATE_JUNCTION_Y - 2,
        speed: 150,
        points: 10,
        bobOffset: 0,
      },
    ];

    const res = updateEngine(state, 0.04);
    expect(res.state.lives).toBe(3);
    expect(res.state.combo).toBe(1);
    expect(res.state.totalSorted).toBe(1);
    expect(res.state.score).toBe(10);

    const sortedEvent = res.events.find((e) => e.type === 'sheep_sorted');
    expect(sortedEvent).toBeDefined();
    if (sortedEvent && sortedEvent.type === 'sheep_sorted') {
      expect(sortedEvent.isCorrect).toBe(true);
      expect(sortedEvent.points).toBe(10);
    }
  });

  it('deducts a life and resets combo on wrong gate sorting', () => {
    let state = createInitialState();
    state.gateDir = 'left';
    state.combo = 8;

    // Place a black sheep (targetGate: 'right') right at junction while gate is 'left'
    state.sheepList = [
      {
        id: 'sheep-black',
        color: 'black',
        targetGate: 'right',
        y: GATE_JUNCTION_Y - 2,
        speed: 150,
        points: 15,
        bobOffset: 0,
      },
    ];

    const res = updateEngine(state, 0.04);
    expect(res.state.lives).toBe(2);
    expect(res.state.combo).toBe(0);

    const lifeEvent = res.events.find((e) => e.type === 'life_lost');
    expect(lifeEvent).toBeDefined();
    if (lifeEvent && lifeEvent.type === 'life_lost') {
      expect(lifeEvent.remainingLives).toBe(2);
    }
  });

  it('triggers Golden Fever mode when combo reaches 15', () => {
    let state = createInitialState();
    state.gateDir = 'right';
    state.combo = 14;

    state.sheepList = [
      {
        id: 'sheep-15',
        color: 'black',
        targetGate: 'right',
        y: GATE_JUNCTION_Y - 2,
        speed: 150,
        points: 15,
        bobOffset: 0,
      },
    ];

    const res = updateEngine(state, 0.04);
    expect(res.state.combo).toBe(15);
    expect(res.state.feverActive).toBe(true);
    expect(res.state.feverTimer).toBe(5.0);

    const feverEvent = res.events.find((e) => e.type === 'fever_activated');
    expect(feverEvent).toBeDefined();
  });

  it('triggers game over when all 3 lives are lost', () => {
    let state = createInitialState();
    state.lives = 1;
    state.gateDir = 'left';

    state.sheepList = [
      {
        id: 'fatal-sheep',
        color: 'black',
        targetGate: 'right',
        y: GATE_JUNCTION_Y - 2,
        speed: 150,
        points: 15,
        bobOffset: 0,
      },
    ];

    const res = updateEngine(state, 0.04);
    expect(res.state.lives).toBe(0);
    expect(res.state.status).toBe('game_over');
  });

  it('restarts game while keeping high score intact', () => {
    let state = createInitialState(1000);
    state.score = 650;
    state.lives = 0;
    state.status = 'game_over';

    const restarted = restartGame(state);
    expect(restarted.status).toBe('playing');
    expect(restarted.lives).toBe(3);
    expect(restarted.score).toBe(0);
    expect(restarted.highScore).toBe(1000);
  });
});

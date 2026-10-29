import { describe, expect, it } from 'bun:test';
import {
  createInitialState,
  getColX,
  getLaneY,
  hop,
  restartGame,
  updateEngine,
} from './engine';

describe('Crossy Chicken Logic Engine', () => {
  it('initializes with player at center column on safe grass lane with 0 score', () => {
    const state = createInitialState(150);
    expect(state.player.gridX).toBe(4);
    expect(state.player.gridY).toBe(0);
    expect(state.player.dead).toBe(false);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(150);
    expect(state.lanes.length).toBeGreaterThanOrEqual(20);
    expect(state.lanes[0].type).toBe('grass');
  });

  it('hops forward and updates gridY, distance, and score', () => {
    let state = createInitialState(0);
    state = hop(state, 'up');
    expect(state.player.gridY).toBe(1);
    expect(state.player.targetY).toBe(getLaneY(1));
    expect(state.score).toBe(1);
    expect(state.distance).toBe(1);
    expect(state.events.some((e) => e.type === 'hop')).toBe(true);
  });

  it('hops left and right while clamping within horizontal grid columns', () => {
    let state = createInitialState(0);
    state = hop(state, 'left');
    expect(state.player.gridX).toBe(3);

    // Hop left to boundary
    state = hop(state, 'left');
    state = hop(state, 'left');
    state = hop(state, 'left');
    state = hop(state, 'left'); // exceeds 0
    expect(state.player.gridX).toBe(0);

    // Hop right
    state = hop(state, 'right');
    expect(state.player.gridX).toBe(1);
  });

  it('prevents hopping backwards past the bottom boundary', () => {
    let state = createInitialState(0);
    state = hop(state, 'down');
    expect(state.player.gridY).toBe(0);
  });

  it('triggers car collision death and game over when hit by a vehicle on road', () => {
    let state = createInitialState(0);
    state.lanes[1] = {
      index: 1,
      type: 'road',
      y: getLaneY(1),
      obstacles: [
        {
          id: 99,
          x: getColX(4) - 20, // overlapping player X
          width: 50,
          height: 28,
          speed: 0,
          type: 'car',
        },
      ],
      direction: 1,
      speed: 0,
    };

    // Hop onto the road lane
    state = hop(state, 'up');
    // Complete hop transition
    state.player.isHopping = false;
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;

    state = updateEngine(state, 0.05);
    expect(state.player.dead).toBe(true);
    expect(state.player.deathReason).toBe('car');
    expect(state.isGameOver).toBe(true);
    expect(state.events.some((e) => e.type === 'death' && e.reason === 'car')).toBe(true);
  });

  it('allows player to survive on a floating river log and drift with its speed', () => {
    let state = createInitialState(0);
    state.lanes[1] = {
      index: 1,
      type: 'river',
      y: getLaneY(1),
      obstacles: [
        {
          id: 101,
          x: getColX(4) - 40,
          width: 80, // covers player X
          height: 32,
          speed: 60, // drifting right
          type: 'log',
        },
      ],
      direction: 1,
      speed: 60,
    };

    state = hop(state, 'up');
    state.player.isHopping = false;
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;

    const initialX = state.player.x;
    state = updateEngine(state, 0.1);
    expect(state.player.dead).toBe(false);
    expect(state.player.x).toBeGreaterThan(initialX); // drifted right with log
  });

  it('triggers drowning death when stepping onto river without a log', () => {
    let state = createInitialState(0);
    state.lanes[1] = {
      index: 1,
      type: 'river',
      y: getLaneY(1),
      obstacles: [], // no logs!
      direction: 1,
      speed: 60,
    };

    state = hop(state, 'up');
    state.player.isHopping = false;
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;

    state = updateEngine(state, 0.05);
    expect(state.player.dead).toBe(true);
    expect(state.player.deathReason).toBe('drown');
    expect(state.isGameOver).toBe(true);
  });

  it('triggers train collision death when freight train passes on railroad', () => {
    let state = createInitialState(0);
    state.lanes[1] = {
      index: 1,
      type: 'railroad',
      y: getLaneY(1),
      obstacles: [
        {
          id: 202,
          x: getColX(4) - 100,
          width: 300,
          height: 36,
          speed: 500,
          type: 'train',
        },
      ],
      direction: 1,
      speed: 500,
      isTrainPassing: true,
    };

    state = hop(state, 'up');
    state.player.isHopping = false;
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;

    state = updateEngine(state, 0.05);
    expect(state.player.dead).toBe(true);
    expect(state.player.deathReason).toBe('train');
    expect(state.isGameOver).toBe(true);
  });

  it('triggers hawk swoop death when player stands idle for longer than IDLE_LIMIT', () => {
    let state = createInitialState(0);
    // Simulate idle wait past 4.0s
    state = updateEngine(state, 4.1);
    expect(state.hawkActive).toBe(true);
    expect(state.events.some((e) => e.type === 'hawk_swoop')).toBe(true);

    // Hawk descends to player level
    state = updateEngine(state, 1.0);
    expect(state.player.dead).toBe(true);
    expect(state.player.deathReason).toBe('hawk');
    expect(state.isGameOver).toBe(true);
  });

  it('collects golden coins on tiles and increments coin count and score', () => {
    let state = createInitialState(0);
    state.coins = [
      {
        id: 303,
        x: getColX(4),
        y: getLaneY(1),
        collected: false,
      },
    ];

    state = hop(state, 'up');
    state.player.isHopping = false;
    state.player.x = state.player.targetX;
    state.player.y = state.player.targetY;

    state = updateEngine(state, 0.05);
    expect(state.coinsCount).toBe(1);
    expect(state.coins[0].collected).toBe(true);
    expect(state.events.some((e) => e.type === 'coin_collect')).toBe(true);
  });

  it('resets game on restart while preserving high score', () => {
    let state = createInitialState(0);
    state.score = 24;
    state.highScore = 24;
    state = restartGame(state);
    expect(state.score).toBe(0);
    expect(state.highScore).toBe(24);
    expect(state.player.gridY).toBe(0);
    expect(state.player.dead).toBe(false);
    expect(state.events.some((e) => e.type === 'restart')).toBe(true);
  });
});

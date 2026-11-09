import { describe, expect, it } from 'bun:test';
import {
  createSnakeGame,
  queueDirection,
  stepSnake,
  updateSnakeGame,
  pickFreeCell,
  ROCK_EVERY,
  COLS,
  ROWS,
} from './engine';
import { SnakeGameState } from './types';

const seeded = (values: number[]) => {
  let i = 0;
  return () => values[i++ % values.length];
};

function playing(overrides: Partial<SnakeGameState> = {}): SnakeGameState {
  return { ...createSnakeGame(0, seeded([0.5])), status: 'playing', ...overrides };
}

describe('Barnyard Snake Engine', () => {
  it('creates a 3-segment worm facing right with an apple off the body', () => {
    const g = createSnakeGame(42, seeded([0.1]));
    expect(g.status).toBe('ready');
    expect(g.snake.length).toBe(3);
    expect(g.dir).toBe('right');
    expect(g.highScore).toBe(42);
    expect(g.snake.some((s) => s.x === g.apple.x && s.y === g.apple.y)).toBe(false);
  });

  it('first direction input starts the game', () => {
    const g = queueDirection(createSnakeGame(), 'up');
    expect(g.status).toBe('playing');
    expect(g.queue).toEqual(['up']);
  });

  it('ignores reversing into the neck and duplicate inputs', () => {
    const g = playing();
    expect(queueDirection(g, 'left').queue.length).toBe(0);
    const up = queueDirection(g, 'up');
    expect(queueDirection(up, 'up').queue.length).toBe(1);
    expect(queueDirection(up, 'down').queue.length).toBe(1); // reverse of queued up
  });

  it('caps the input queue at two turns', () => {
    let g = playing();
    g = queueDirection(g, 'up');
    g = queueDirection(g, 'left');
    g = queueDirection(g, 'down');
    expect(g.queue).toEqual(['up', 'left']);
  });

  it('moves one cell per step and keeps its length', () => {
    const g = playing();
    const head = g.snake[0];
    const next = stepSnake(g);
    expect(next.snake[0]).toEqual({ x: head.x + 1, y: head.y });
    expect(next.snake.length).toBe(3);
  });

  it('eats an apple: grows, scores 10, speeds up, spawns a new apple', () => {
    const g = playing();
    const head = g.snake[0];
    g.apple = { x: head.x + 1, y: head.y };
    const next = stepSnake(g, seeded([0.3]));
    expect(next.snake.length).toBe(4);
    expect(next.score).toBe(10);
    expect(next.tickSeconds).toBeLessThan(g.tickSeconds);
    expect(next.events.some((e) => e.type === 'eat')).toBe(true);
    expect(next.apple).not.toEqual({ x: head.x + 1, y: head.y });
  });

  it('dies on the wall', () => {
    const g = playing();
    g.snake = [{ x: COLS - 1, y: 3 }, { x: COLS - 2, y: 3 }, { x: COLS - 3, y: 3 }];
    const next = stepSnake(g);
    expect(next.status).toBe('game_over');
    expect(next.deathReason).toBe('wall');
  });

  it('dies when biting itself but may follow its own tail', () => {
    const loop = playing({
      dir: 'down',
      snake: [
        { x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 4, y: 5 },
      ],
    });
    // heading down into (5,6) which is body and not the tail
    expect(stepSnake(loop).deathReason).toBe('self');

    const chase = playing({
      dir: 'down',
      snake: [{ x: 5, y: 5 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 5, y: 6 }],
    });
    // (5,6) is the tail and it moves away this tick
    expect(stepSnake(chase).status).toBe('playing');
  });

  it('dies on a rock', () => {
    const g = playing();
    const head = g.snake[0];
    g.obstacles = [{ x: head.x + 1, y: head.y }];
    expect(stepSnake(g).deathReason).toBe('rock');
  });

  it('adds a rock every few apples and a golden apple every fourth', () => {
    let g = playing();
    g.applesEaten = ROCK_EVERY - 1;
    let head = g.snake[0];
    g.apple = { x: head.x + 1, y: head.y };
    g = stepSnake(g, seeded([0.2, 0.7, 0.4]));
    expect(g.obstacles.length).toBe(1);

    let h = playing();
    h.applesEaten = 3;
    head = h.snake[0];
    h.apple = { x: head.x + 1, y: head.y };
    h = stepSnake(h, seeded([0.6, 0.2]));
    expect(h.golden).not.toBeNull();
  });

  it('golden apple gives 50 points and expires', () => {
    const g = playing();
    const head = g.snake[0];
    g.golden = { x: head.x + 1, y: head.y, ticksLeft: 10 };
    const eaten = stepSnake(g);
    expect(eaten.score).toBe(50);
    expect(eaten.golden).toBeNull();

    const fading = playing();
    fading.golden = { x: 0, y: 0, ticksLeft: 1 };
    expect(stepSnake(fading).golden).toBeNull();
  });

  it('updateSnakeGame converts elapsed time into whole moves', () => {
    const g = playing();
    const start = g.snake[0].x;
    let next = g;
    for (let i = 0; i < 22; i++) next = updateSnakeGame(next, g.tickSeconds / 10); // 2.2 ticks
    expect(next.snake[0].x).toBe(start + 2);

    // a long frame hitch is clamped instead of teleporting the worm
    const hitch = updateSnakeGame(g, 5);
    expect(hitch.snake[0].x).toBeLessThanOrEqual(start + 1);
  });

  it('pickFreeCell returns null on a full board', () => {
    expect(pickFreeCell(3, 3, () => true, Math.random)).toBeNull();
    expect(pickFreeCell(ROWS, COLS, () => false, () => 0)).toEqual({ x: 0, y: 0 });
  });
});

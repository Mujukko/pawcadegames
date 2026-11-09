import { Direction, Point, SnakeGameState } from './types';

export const COLS = 15;
export const ROWS = 19;
export const START_TICK = 0.16;
export const MIN_TICK = 0.075;
export const GOLDEN_LIFETIME_TICKS = 40;
export const ROCK_EVERY = 5;
export const MAX_ROCKS = 14;

export type Rng = () => number;

const DELTAS: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const same = (a: Point, b: Point) => a.x === b.x && a.y === b.y;

function isOccupied(state: Pick<SnakeGameState, 'snake' | 'obstacles' | 'apple' | 'golden'>, p: Point): boolean {
  return (
    state.snake.some((s) => same(s, p)) ||
    state.obstacles.some((o) => same(o, p)) ||
    (state.apple !== null && same(state.apple, p)) ||
    (state.golden !== null && same(state.golden, p))
  );
}

/** Picks a random free cell. Returns null when the board is full. */
export function pickFreeCell(
  cols: number,
  rows: number,
  blocked: (p: Point) => boolean,
  rng: Rng
): Point | null {
  const free: Point[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const p = { x, y };
      if (!blocked(p)) free.push(p);
    }
  }
  if (free.length === 0) return null;
  return free[Math.min(free.length - 1, Math.floor(rng() * free.length))];
}

export function createSnakeGame(highScore = 0, rng: Rng = Math.random): SnakeGameState {
  const midY = Math.floor(ROWS / 2);
  const snake: Point[] = [
    { x: 7, y: midY },
    { x: 6, y: midY },
    { x: 5, y: midY },
  ];
  const base = { snake, obstacles: [] as Point[], apple: { x: -1, y: -1 }, golden: null };
  const apple =
    pickFreeCell(COLS, ROWS, (p) => isOccupied(base, p), rng) ?? { x: 12, y: midY };

  return {
    status: 'ready',
    cols: COLS,
    rows: ROWS,
    snake,
    dir: 'right',
    queue: [],
    apple,
    golden: null,
    obstacles: [],
    score: 0,
    highScore,
    applesEaten: 0,
    tickSeconds: START_TICK,
    accumulator: 0,
    deathReason: null,
    events: [],
  };
}

/** Queue a turn. Reversing into the neck is ignored; the first input starts the game. */
export function queueDirection(state: SnakeGameState, dir: Direction): SnakeGameState {
  if (state.status === 'game_over') return state;
  const last = state.queue.length > 0 ? state.queue[state.queue.length - 1] : state.dir;
  if (dir === last || dir === OPPOSITE[last]) return state;
  if (state.queue.length >= 2) return state;
  return {
    ...state,
    status: 'playing',
    queue: [...state.queue, dir],
    events: [...state.events, { type: 'turn' }],
  };
}

/** Advance the worm exactly one cell. */
export function stepSnake(state: SnakeGameState, rng: Rng = Math.random): SnakeGameState {
  if (state.status === 'game_over') return state;

  const queue = [...state.queue];
  let dir = state.dir;
  const next = queue.shift();
  if (next && next !== OPPOSITE[dir]) dir = next;

  const head = state.snake[0];
  const d = DELTAS[dir];
  const newHead = { x: head.x + d.x, y: head.y + d.y };
  const events: SnakeGameState['events'] = [];

  const die = (reason: NonNullable<SnakeGameState['deathReason']>): SnakeGameState => ({
    ...state,
    status: 'game_over',
    dir,
    queue,
    deathReason: reason,
    events: [{ type: 'die' }],
  });

  if (newHead.x < 0 || newHead.x >= state.cols || newHead.y < 0 || newHead.y >= state.rows) {
    return die('wall');
  }
  if (state.obstacles.some((o) => same(o, newHead))) return die('rock');

  const eatsApple = same(newHead, state.apple);
  const eatsGolden = state.golden !== null && same(newHead, state.golden);
  const grows = eatsApple || eatsGolden;

  // The tail cell frees up this tick unless the worm is growing.
  const body = grows ? state.snake : state.snake.slice(0, -1);
  if (body.some((s) => same(s, newHead))) return die('self');

  const snake = [newHead, ...body];
  let score = state.score;
  let applesEaten = state.applesEaten;
  let apple = state.apple;
  let golden = state.golden
    ? { ...state.golden, ticksLeft: state.golden.ticksLeft - 1 }
    : null;
  let obstacles = state.obstacles;
  let tickSeconds = state.tickSeconds;

  if (golden && golden.ticksLeft <= 0) golden = null;

  if (eatsGolden) {
    score += 50;
    golden = null;
    events.push({ type: 'golden' });
  }

  if (eatsApple) {
    applesEaten += 1;
    score += 10;
    tickSeconds = Math.max(MIN_TICK, tickSeconds - 0.004);
    events.push({ type: 'eat' });

    const blocked = (p: Point) =>
      snake.some((s) => same(s, p)) ||
      obstacles.some((o) => same(o, p)) ||
      (golden !== null && same(golden, p));
    apple = pickFreeCell(state.cols, state.rows, blocked, rng) ?? apple;

    // A new rock every few apples, never directly in front of the head
    if (applesEaten % ROCK_EVERY === 0 && obstacles.length < MAX_ROCKS) {
      const ahead = { x: newHead.x + d.x, y: newHead.y + d.y };
      const ahead2 = { x: newHead.x + d.x * 2, y: newHead.y + d.y * 2 };
      const rock = pickFreeCell(
        state.cols,
        state.rows,
        (p) => blocked(p) || same(p, apple) || same(p, ahead) || same(p, ahead2),
        rng
      );
      if (rock) {
        obstacles = [...obstacles, rock];
        events.push({ type: 'rock' });
      }
    }

    // A golden apple every 4th apple
    if (applesEaten % 4 === 0 && !golden) {
      const g = pickFreeCell(
        state.cols,
        state.rows,
        (p) => snake.some((s) => same(s, p)) || obstacles.some((o) => same(o, p)) || same(p, apple),
        rng
      );
      if (g) golden = { ...g, ticksLeft: GOLDEN_LIFETIME_TICKS };
    }
  }

  const highScore = Math.max(state.highScore, score);

  return {
    ...state,
    snake,
    dir,
    queue,
    apple,
    golden,
    obstacles,
    score,
    highScore,
    applesEaten,
    tickSeconds,
    events,
  };
}

/** Frame update: converts elapsed time into whole worm moves. */
export function updateSnakeGame(state: SnakeGameState, rawDt: number, rng: Rng = Math.random): SnakeGameState {
  if (state.status !== 'playing') return state;
  let s: SnakeGameState = { ...state, events: [] };
  s.accumulator += Math.min(rawDt, 0.1);
  const events: SnakeGameState['events'] = [];
  let guard = 0;
  while (s.accumulator >= s.tickSeconds && s.status === 'playing' && guard < 4) {
    s.accumulator -= s.tickSeconds;
    s = stepSnake(s, rng);
    events.push(...s.events);
    guard++;
  }
  return { ...s, events };
}

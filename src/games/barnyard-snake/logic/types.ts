export interface Point {
  x: number;
  y: number;
}

export type Direction = 'up' | 'down' | 'left' | 'right';

export interface GoldenApple extends Point {
  ticksLeft: number;
}

export interface SnakeGameState {
  status: 'ready' | 'playing' | 'game_over';
  cols: number;
  rows: number;
  /** snake[0] is the head */
  snake: Point[];
  dir: Direction;
  /** queued turns (max 2) so quick swipes are never lost */
  queue: Direction[];
  apple: Point;
  golden: GoldenApple | null;
  obstacles: Point[];
  score: number;
  highScore: number;
  applesEaten: number;
  /** seconds between moves; shrinks as the worm eats */
  tickSeconds: number;
  accumulator: number;
  deathReason: 'wall' | 'self' | 'rock' | null;
  events: Array<{ type: 'eat' | 'golden' | 'turn' | 'die' | 'rock' }>;
}

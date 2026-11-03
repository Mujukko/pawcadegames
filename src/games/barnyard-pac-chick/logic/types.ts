export type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

export type TileType = 'wall' | 'empty' | 'dot' | 'power' | 'gate';

export interface Fox {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  dir: Direction;
  targetDir: Direction;
  mode: 'chase' | 'frightened' | 'eaten';
  frightenedTimer: number;
}

export interface PacChickState {
  status: 'ready' | 'playing' | 'frightened' | 'game_over' | 'victory';
  score: number;
  highScore: number;
  lives: number;
  level: number;
  dotsRemaining: number;
  grid: TileType[][];
  player: {
    x: number; // grid float coordinates
    y: number;
    dir: Direction;
    nextDir: Direction;
    mouthAngle: number;
  };
  foxes: Fox[];
  fruit: {
    active: boolean;
    x: number;
    y: number;
    type: 'cherry' | 'strawberry' | 'corn';
    points: number;
  } | null;
  events: Array<{ type: 'waka' | 'power' | 'eat_ghost' | 'die' | 'level_clear' }>;
}

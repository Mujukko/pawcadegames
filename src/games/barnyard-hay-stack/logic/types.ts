export interface HayBlock {
  id: string;
  x: number; // center position
  y: number; // height level in stack
  width: number;
  height: number;
  color: string;
}

export interface MovingHayBlock {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  direction: 1 | -1;
  color: string;
}

export interface SlicedPiece {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  vx: number;
  angularVel: number;
  angle: number;
  color: string;
}

export interface HayStackGameState {
  status: 'ready' | 'playing' | 'game_over';
  stack: HayBlock[];
  activeBlock: MovingHayBlock | null;
  slicedPieces: SlicedPiece[];
  perfectStreak: number;
  score: number;
  highScore: number;
  events: Array<{ type: 'drop' | 'perfect' | 'slice' | 'miss' }>;
}

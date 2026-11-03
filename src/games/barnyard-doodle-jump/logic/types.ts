export type PlatformType = 'standard' | 'moving' | 'fragile' | 'spring';

export interface DoodlePlatform {
  id: string;
  x: number;
  y: number; // world height (increases as you go up)
  width: number;
  height: number;
  type: PlatformType;
  vx: number;
  isBroken: boolean;
  hasSpring: boolean;
}

export interface DoodlePlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 'left' | 'right';
  hasPropeller: boolean;
  propellerTimer: number;
}

export interface DoodleGameState {
  status: 'ready' | 'playing' | 'game_over';
  score: number;
  highScore: number;
  altitude: number;
  player: DoodlePlayer;
  platforms: DoodlePlatform[];
  cameraY: number;
  events: Array<{ type: 'bounce' | 'spring' | 'propeller' | 'fall' }>;
}

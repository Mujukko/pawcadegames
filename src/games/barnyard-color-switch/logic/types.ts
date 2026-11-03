export type SwitchColor = 'gold' | 'emerald' | 'sky' | 'rose';

export const SWITCH_COLORS: SwitchColor[] = ['gold', 'emerald', 'sky', 'rose'];

export const COLOR_HEX: Record<SwitchColor, string> = {
  gold: '#f59e0b',
  emerald: '#10b981',
  sky: '#0284c7',
  rose: '#f43f5e',
};

export type ObstacleType = 'circle' | 'cross' | 'bar';

export interface ColorObstacle {
  id: string;
  y: number; // world Y (ball moves upwards)
  type: ObstacleType;
  radius: number;
  rotation: number; // current angle in radians
  rotSpeed: number; // radians per second
  passed: boolean;
}

export interface ColorSwitcherOrb {
  id: string;
  y: number;
  collected: boolean;
}

export interface ColorStar {
  id: string;
  y: number;
  collected: boolean;
}

export interface ColorSwitchState {
  status: 'ready' | 'playing' | 'game_over';
  score: number;
  highScore: number;
  player: {
    y: number;
    vy: number;
    color: SwitchColor;
  };
  cameraY: number;
  obstacles: ColorObstacle[];
  switchers: ColorSwitcherOrb[];
  stars: ColorStar[];
  events: Array<{ type: 'jump' | 'star' | 'switch' | 'crash' }>;
}

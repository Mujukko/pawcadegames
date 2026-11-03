export interface BottlePlatform {
  id: string;
  x: number;
  y: number; // surface Y from top
  width: number;
  height: number;
  label: string; // e.g. "Table", "Toaster", "Shelf", "Couch"
  color: string;
}

export interface MilkBottle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // in radians (0 = upright)
  omega: number; // angular velocity rad/s
  isFlipping: boolean;
  canDoubleFlip: boolean;
  didDoubleFlip: boolean;
}

export interface MilkBottleFlipState {
  status: 'ready' | 'flipping' | 'landed' | 'game_over';
  score: number;
  highScore: number;
  currentPlatformIndex: number;
  cameraX: number;
  bottle: MilkBottle;
  platforms: BottlePlatform[];
  events: Array<{ type: 'flip' | 'double_flip' | 'land' | 'fail' }>;
}

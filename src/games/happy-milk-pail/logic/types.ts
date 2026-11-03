export interface Point {
  x: number;
  y: number;
}

export interface LineSegment {
  p1: Point;
  p2: Point;
}

export interface Droplet {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  inPail: boolean;
  lost: boolean;
}

export interface MilkPail {
  x: number;
  y: number;
  width: number;
  height: number;
  dropletCount: number;
  capacityNeeded: number;
  isHappy: boolean;
}

export interface PailLevel {
  levelNumber: number;
  pipeX: number;
  pipeY: number;
  pailX: number;
  pailY: number;
  capacityNeeded: number;
  obstacles: Array<{ x: number; y: number; width: number; height: number }>;
}

export interface HappyMilkPailState {
  status: 'drawing' | 'pouring' | 'victory' | 'failed';
  level: number;
  score: number;
  highScore: number;
  stars: number;
  inkRemaining: number;
  maxInk: number;
  lines: LineSegment[];
  currentLine: Point[];
  droplets: Droplet[];
  pail: MilkPail;
  pipe: Point;
  obstacles: Array<{ x: number; y: number; width: number; height: number }>;
  events: Array<{ type: 'drop_in' | 'happy' | 'fail' | 'pour' }>;
}

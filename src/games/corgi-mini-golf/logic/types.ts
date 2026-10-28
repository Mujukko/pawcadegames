export type HazardType = 'sand' | 'mud';

export interface GolfWall {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface GolfBumper {
  id: string;
  x: number;
  y: number;
  radius: number;
  bouncePower: number;
}

export interface GolfHazard {
  id: string;
  type: HazardType;
  x: number;
  y: number;
  width: number;
  height: number;
  frictionMultiplier: number;
}

export interface BonusBone {
  id: string;
  x: number;
  y: number;
  radius: number;
  points: number;
  isCollected: boolean;
}

export interface GolfBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  isMoving: boolean;
  isPotted: boolean;
  sinkScale: number;
  sinkAlpha: number;
}

export interface HoleConfig {
  holeNumber: number;
  name: string;
  par: number;
  ballStart: { x: number; y: number };
  cup: { x: number; y: number; radius: number };
  walls: GolfWall[];
  bumpers: GolfBumper[];
  hazards: GolfHazard[];
  bones: Array<{ x: number; y: number }>;
}

export interface MiniGolfSparkle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface MiniGolfFloatingBadge {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface HoleHistoryEntry {
  hole: number;
  name: string;
  par: number;
  strokes: number;
  scoreRating: string;
  points: number;
}

export interface CorgiMiniGolfState {
  status: 'aiming' | 'ball_rolling' | 'hole_cleared' | 'game_over' | 'victory';
  holeIndex: number;
  strokesInHole: number;
  totalStrokes: number;
  score: number;
  highScore: number;
  ball: GolfBall;
  isAiming: boolean;
  aimStartX: number;
  aimStartY: number;
  aimCurrentX: number;
  aimCurrentY: number;
  aimPower: number; // 0 to 100
  aimAngle: number;
  bones: BonusBone[];
  sparkles: MiniGolfSparkle[];
  floatingBadges: MiniGolfFloatingBadge[];
  holeHistory: HoleHistoryEntry[];
  timeInState: number;
  width: number;
  height: number;
}

export interface CorgiMiniGolfEvent {
  type: 'putt_hit' | 'rail_bounce' | 'bumper_bounce' | 'bone_collect' | 'hazard_enter' | 'cup_sink' | 'hole_cleared' | 'victory';
  strokes?: number;
  par?: number;
  rating?: string;
  pointsEarned?: number;
  x?: number;
  y?: number;
}

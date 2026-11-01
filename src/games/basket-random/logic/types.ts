export type BallType = 'basketball' | 'watermelon' | 'pumpkin' | 'egg';
export type CourtTheme = 'barn' | 'snow' | 'sunset';

export interface BasketBall {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  heldBy: string | null;
  ballType: BallType;
  rotation: number;
}

export interface RagdollPlayer {
  id: string;
  team: 1 | 2;
  role: 'guard' | 'dunker';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  angularVelocity: number;
  onGround: boolean;
  armAngle: number;
  jumpCooldown: number;
  bodyColor: string;
  faceType: 'chick' | 'dog' | 'pig' | 'cow';
}

export interface Hoop {
  team: 1 | 2; // defending team
  x: number;
  y: number;
  rimWidth: number;
  rimY: number;
  backboardX: number;
  backboardTop: number;
  backboardBottom: number;
}

export interface BasketRandomInput {
  p1Jump?: boolean;
  p2Jump?: boolean;
}

export interface BasketRandomState {
  players: RagdollPlayer[];
  ball: BasketBall;
  hoopLeft: Hoop;  // Team 1 defends
  hoopRight: Hoop; // Team 2 defends
  score: { p1: number; p2: number };
  mode: 'vs_ai' | 'two_player';
  courtTheme: CourtTheme;
  status: 'playing' | 'scored' | 'game_over';
  scoredBy: 1 | 2 | null;
  winner: 1 | 2 | null;
  roundTimer: number;
  celebrationTimer: number;
}

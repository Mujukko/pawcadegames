export type RouteType = 'fly' | 'slant_up' | 'slant_down' | 'curl';

export interface FootballReceiver {
  id: string;
  name: string;
  x: number; // Yard line (0 - 100)
  y: number; // Field lateral (0 - 160)
  vx: number;
  vy: number;
  route: RouteType;
  caught: boolean;
  tackled: boolean;
}

export interface FootballDefender {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
}

export interface FootballBall {
  x: number;
  y: number;
  z: number; // Height in air (parabolic arc)
  vx: number;
  vy: number;
  vz: number;
  inFlight: boolean;
  targetX: number;
  targetY: number;
}

export interface RetroBowlState {
  yardLine: number; // Current line of scrimmage (e.g. 20 to 100)
  down: number; // 1 to 4
  yardsToGo: number;
  score: number;
  opponentScore: number;
  quarter: number;
  playClock: number;
  phase: 'pre_snap' | 'aiming' | 'ball_in_air' | 'receiver_running' | 'play_ended' | 'touchdown' | 'turnover';
  qb: { x: number; y: number };
  receivers: FootballReceiver[];
  defenders: FootballDefender[];
  ball: FootballBall;
  controlledReceiverIndex: number | null;
}

export interface RetroBowlAimInput {
  isAiming: boolean;
  aimAngle: number; // In radians
  aimPower: number; // 0.0 to 1.0
  releaseThrow: boolean;
}

export interface ReceiverMoveInput {
  moveY: number; // -1 (up), 1 (down), 0
  turbo?: boolean;
}

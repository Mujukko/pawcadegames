export type CharacterType = 'rooster' | 'fox';
export type GameMode = 'vs_ai' | 'two_player';
export type MapType = 'red_barn' | 'windmill' | 'silo_catwalk';

export interface DuelPlayer {
  id: 'p1' | 'p2';
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number; // ragdoll body tilt in radians
  vAngle: number;
  armAngle: number; // arm aim angle (-Math.PI/3 to Math.PI/3)
  armDirection: number; // 1 or -1
  isAiming: boolean;
  isGrounded: boolean;
  character: CharacterType;
  score: number;
}

export interface Bullet {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  shooterId: 'p1' | 'p2';
  ricochets: number;
  active: boolean;
}

export interface RoofSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  isSlippery?: boolean;
}

export interface WindmillEntity {
  cx: number;
  cy: number;
  angle: number;
  vAngle: number;
  bladeLength: number;
}

export type DuelGameStatus = 'ready' | 'dueling' | 'round_over' | 'match_over';

export type DuelEvent =
  | { type: 'jump'; playerId: 'p1' | 'p2' }
  | { type: 'shoot'; playerId: 'p1' | 'p2'; x: number; y: number; vx: number; vy: number }
  | { type: 'hit'; victimId: 'p1' | 'p2' }
  | { type: 'ricochet'; x: number; y: number }
  | { type: 'round_win'; winnerId: 'p1' | 'p2'; p1Score: number; p2Score: number }
  | { type: 'match_win'; winnerId: 'p1' | 'p2' };

export interface DuelGameState {
  status: DuelGameStatus;
  gameMode: GameMode;
  mapType: MapType;
  round: number;
  targetWins: number;
  roundWinner?: 'p1' | 'p2';
  matchWinner?: 'p1' | 'p2';
  p1: DuelPlayer;
  p2: DuelPlayer;
  bullets: Bullet[];
  roofSegments: RoofSegment[];
  windmill?: WindmillEntity;
  aiTimer: number;
  events: DuelEvent[];
  boardWidth: number;
  boardHeight: number;
}

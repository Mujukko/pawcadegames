export interface Vec2 {
  x: number;
  y: number;
}

export interface GlowOrb {
  id: number;
  x: number;
  y: number;
  value: number;
  radius: number;
  color: string;
  jumbo: boolean;
}

export interface WormAgent {
  id: number; // 0 = player, 1..7 = AI worms
  name: string;
  colors: [string, string];
  angle: number;
  targetAngle: number;
  boosting: boolean;
  alive: boolean;
  respawnTimer: number;
  mass: number;
  segments: Vec2[];
  kills: number;
  boostDropAcc: number;
}

export type SlitherEvent =
  | { type: 'eat'; jumbo: boolean }
  | { type: 'kill'; victimName: string }
  | { type: 'die'; reason: 'wall' | 'worm'; killerName?: string };

export interface SlitherGameState {
  worldRadius: number;
  worms: WormAgent[];
  orbs: GlowOrb[];
  nextOrbId: number;
  status: 'ready' | 'playing' | 'game_over';
  deathReason?: 'wall' | 'worm';
  killerName?: string;
  bestLength: number;
  events: SlitherEvent[];
}

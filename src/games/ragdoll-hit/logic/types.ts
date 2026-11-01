export type WeaponType = 'fists' | 'broom' | 'pitchfork';

export interface RagdollFighter {
  id: string;
  name: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  armAngle: number;
  armAngularVelocity: number;
  weapon: WeaponType;
  health: number; // 0 to 100
  isGrounded: boolean;
  facing: 1 | -1;
  isAttacking: boolean;
  knockedOut: boolean;
}

export interface RagdollHitState {
  round: number;
  maxRounds: number;
  player: RagdollFighter;
  enemy: RagdollFighter;
  status: 'fighting' | 'round_won' | 'round_lost' | 'match_victory' | 'match_game_over';
  arenaWidth: number;
  arenaFloorY: number;
}

export interface FighterInput {
  moveX: number; // -1, 0, 1
  jump: boolean;
  attack: boolean; // Swing arm / punch
}

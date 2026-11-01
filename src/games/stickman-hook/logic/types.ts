export interface HookPeg {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface Trampoline {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  bouncePower: number;
}

export interface StickmanPlayer {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  attachedPegId: string | null;
  ropeLength: number;
  angle: number;
  angularVelocity: number;
  rotation: number;
  alive: boolean;
  reachedFinish: boolean;
}

export interface StickmanHookState {
  levelIndex: number;
  player: StickmanPlayer;
  pegs: HookPeg[];
  trampolines: Trampoline[];
  finishLineX: number;
  status: 'playing' | 'level_cleared' | 'victory' | 'failed';
  totalLevels: number;
}

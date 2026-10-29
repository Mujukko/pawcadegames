export type BlockType =
  | 'solid'
  | 'crumble'
  | 'lava'
  | 'laser'
  | 'trampoline'
  | 'checkpoint'
  | 'golden_acorn';

export interface TowerBlock {
  id: string;
  type: BlockType;
  x: number;
  y: number;
  width: number;
  height: number;
  crumbleTimer?: number;
  isBroken?: boolean;
}

export interface MovingLaser {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  minX: number;
  maxX: number;
  speed: number;
  direction: 1 | -1;
}

export interface CheckpointFlag {
  id: string;
  x: number;
  y: number;
  floorName: string;
  reached: boolean;
}

export interface TinyPigPlayer {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  vy: number;
  isGrounded: boolean;
  isWallSliding: boolean;
  wallDirection: -1 | 1 | 0; // -1 on left wall, 1 on right wall
  coyoteTimer: number;
  jumpBufferTimer: number;
  respawnX: number;
  respawnY: number;
}

export interface BigTowerGameState {
  status: 'ready' | 'playing' | 'victory';
  elapsedTime: number;
  deathsCount: number;
  activeCheckpoint: CheckpointFlag;
  player: TinyPigPlayer;
  blocks: TowerBlock[];
  movingLasers: MovingLaser[];
  checkpoints: CheckpointFlag[];
  bestTimeSeconds: number;
}

export interface TowerInput {
  moveLeft: boolean;
  moveRight: boolean;
  jump: boolean;
  restart: boolean;
}

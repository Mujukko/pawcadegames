export interface TunnelTile {
  z: number; // distance ahead in tunnel
  lane: number; // 0 to 7 (8 lanes forming the octagonal cylinder)
  hasFloor: boolean;
  hasObstacle: boolean;
}

export interface TunnelPlayer {
  lane: number; // 0 to 7
  subLaneOffset: number; // smooth transition between lanes
  jumpHeight: number; // 0 = on floor, > 0 = in air
  jumpVelocity: number;
  isJumping: boolean;
}

export interface TunnelRunnerState {
  status: 'ready' | 'running' | 'game_over';
  score: number;
  highScore: number;
  distance: number;
  speed: number;
  player: TunnelPlayer;
  tiles: TunnelTile[];
  events: Array<{ type: 'jump' | 'rotate' | 'fall' }>;
}

export type ElementType = 'fire' | 'water';

export interface CharacterState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  isGrounded: boolean;
  facing: 1 | -1;
  alive: boolean;
  atExit: boolean;
}

export interface Platform {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  isDoor?: boolean;
  requiresPlateId?: string; // If set, opens (disappears/slides) when plate is pressed
  openOffsetY?: number; // How much it slides when open
}

export interface HazardPool {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'lava' | 'water' | 'acid'; // lava hurts watergirl, water hurts fireboy, acid hurts both
}

export interface PressurePlate {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  isPressed: boolean;
}

export interface GemItem {
  id: string;
  x: number;
  y: number;
  radius: number;
  type: ElementType;
  collected: boolean;
}

export interface ExitDoor {
  x: number;
  y: number;
  width: number;
  height: number;
  type: ElementType;
}

export interface FireboyWatergirlState {
  levelIndex: number;
  pup: CharacterState; // Fire element (Sun Pup)
  kitty: CharacterState; // Water element (Moon Kitty)
  platforms: Platform[];
  hazards: HazardPool[];
  plates: PressurePlate[];
  gems: GemItem[];
  pupDoor: ExitDoor;
  kittyDoor: ExitDoor;
  status: 'playing' | 'level_cleared' | 'victory' | 'failed';
  totalLevels: number;
}

export interface CharacterInput {
  left?: boolean;
  right?: boolean;
  jump?: boolean;
}

export interface DualInput {
  pup: CharacterInput;
  kitty: CharacterInput;
}

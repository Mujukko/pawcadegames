export interface Position {
  x: number;
  y: number;
}

export type GuardState = 'patrolling' | 'sleeping' | 'knocked_out' | 'suspicious' | 'alerted';

export interface GuardDog {
  id: string;
  name: string;
  x: number;
  y: number;
  floor: number;
  direction: 'left' | 'right';
  patrolMinX: number;
  patrolMaxX: number;
  speed: number;
  state: GuardState;
  sleepTimer?: number;
  knockoutTimer?: number;
  alertTimer?: number;
  visionRange: number;
}

export interface SecurityCamera {
  id: string;
  x: number;
  y: number;
  floor: number;
  angle: number; // current sweep angle in radians
  minAngle: number;
  maxAngle: number;
  sweepSpeed: number;
  active: boolean;
  range: number;
}

export interface LaserTripwire {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  floor: number;
  active: boolean;
}

export interface ShadowZone {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  floor: number;
  type: 'doorway' | 'haystack' | 'curtain';
}

export interface Ladder {
  id: string;
  x: number;
  bottomY: number;
  topY: number;
  fromFloor: number;
  toFloor: number;
}

export interface LockedDoor {
  id: string;
  x: number;
  floor: number;
  isLocked: boolean;
  requiredKeyType?: 'bronze' | 'silver' | 'gold';
  pickTimeSeconds: number; // time required to pick lock
}

export interface LootItem {
  id: string;
  name: string;
  type: 'golden_egg' | 'cash_bag' | 'diamond_horseshoe' | 'key';
  keyType?: 'bronze' | 'silver' | 'gold';
  x: number;
  y: number;
  floor: number;
  value: number;
  collected: boolean;
}

export interface FloorLevel {
  floorIndex: number;
  y: number;
  minX: number;
  maxX: number;
}

export interface StealthLevelData {
  id: string;
  levelNumber: number;
  name: string;
  description: string;
  targetLoot: number; // minimum loot value required to open escape
  parTimeSeconds: number; // for 3-star rating
  playerStartX: number;
  playerStartY: number;
  playerStartFloor: number;
  escapeX: number;
  escapeY: number;
  escapeFloor: number;
  floors: FloorLevel[];
  shadows: ShadowZone[];
  ladders: Ladder[];
  doors: LockedDoor[];
  loot: LootItem[];
  guards: GuardDog[];
  cameras: SecurityCamera[];
  lasers: LaserTripwire[];
}

export interface FoxPlayer {
  x: number;
  y: number;
  vx: number;
  floor: number;
  direction: 'left' | 'right';
  isHiding: boolean;
  isClimbing: boolean;
  isPickingLock: boolean;
  pickProgress: number; // 0 to 1
  keysHeld: {
    bronze: boolean;
    silver: boolean;
    gold: boolean;
  };
}

export interface StealthGameState {
  levelIndex: number;
  status: 'ready' | 'playing' | 'busted' | 'escaped';
  elapsedTime: number;
  collectedLootValue: number;
  alarmTriggered: boolean;
  alarmCountdown: number; // seconds left when alarm is blaring before capture
  player: FoxPlayer;
  guards: GuardDog[];
  cameras: SecurityCamera[];
  lasers: LaserTripwire[];
  doors: LockedDoor[];
  loot: LootItem[];
  unlockedLevels: number;
  levelBestTimes: number[];
}

export interface StealthInput {
  moveLeft: boolean;
  moveRight: boolean;
  moveUp: boolean; // climb ladder up
  moveDown: boolean; // climb ladder down / duck into shadow
  action: boolean; // pick lock / knockout guard / collect / exit
}

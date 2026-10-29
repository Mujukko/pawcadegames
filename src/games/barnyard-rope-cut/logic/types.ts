export interface RopeSegment {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  pinned: boolean;
}

export interface RopeModel {
  id: string;
  anchorX: number;
  anchorY: number;
  segments: RopeSegment[];
  segmentLength: number;
  cut: boolean;
  cutIndex?: number;
}

export interface StarModel {
  id: string;
  x: number;
  y: number;
  radius: number;
  collected: boolean;
}

export interface BubbleModel {
  id: string;
  x: number;
  y: number;
  radius: number;
  popped: boolean;
}

export interface TrampolineModel {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number; // in radians
  bounceFactor: number;
}

export interface ThistleModel {
  id: string;
  x: number;
  y: number;
  radius: number;
}

export interface AppleModel {
  x: number;
  y: number;
  oldX: number;
  oldY: number;
  radius: number;
  inBubble: boolean;
  lost: boolean;
}

export interface PiggyTarget {
  x: number;
  y: number;
  radius: number;
  mouthOpen: boolean;
}

export interface RopeCutLevelConfig {
  id: string;
  name: string;
  appleStart: { x: number; y: number };
  ropes: Array<{
    id: string;
    anchorX: number;
    anchorY: number;
    numSegments: number;
    segmentLength: number;
  }>;
  stars: Array<{ id: string; x: number; y: number }>;
  bubbles: Array<{ id: string; x: number; y: number }>;
  trampolines: Array<{ id: string; x: number; y: number; width: number; height: number; angle: number }>;
  thistles: Array<{ id: string; x: number; y: number }>;
  piggy: { x: number; y: number };
}

export type RopeCutEventType =
  | 'rope_cut'
  | 'star_collect'
  | 'bubble_enter'
  | 'bubble_pop'
  | 'trampoline_bounce'
  | 'thistle_hit'
  | 'piggy_fed'
  | 'level_won'
  | 'level_lost';

export interface RopeCutEvent {
  type: RopeCutEventType;
  x?: number;
  y?: number;
  timestamp: number;
}

export interface BarnyardRopeCutState {
  levelIndex: number;
  level: RopeCutLevelConfig;
  apple: AppleModel;
  ropes: RopeModel[];
  stars: StarModel[];
  bubbles: BubbleModel[];
  trampolines: TrampolineModel[];
  thistles: ThistleModel[];
  piggy: PiggyTarget;
  starsCollected: number;
  status: 'playing' | 'won' | 'lost';
  timeSpent: number;
  events: RopeCutEvent[];
}

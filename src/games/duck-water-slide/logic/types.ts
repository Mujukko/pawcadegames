export type SlideItemType =
  | 'rubber_duck'
  | 'watermelon'
  | 'speed_boost'
  | 'water_ramp'
  | 'soap_bar'
  | 'beach_ball';

export interface SlideItem {
  id: number;
  trackX: number; // -120 to +120 within flume channel
  worldDistance: number; // in meters down the flume
  type: SlideItemType;
  collected: boolean;
}

export interface DuckRacer {
  x: number; // -120 to +120
  vx: number;
  speed: number;
  baseSpeed: number;
  inAir: boolean;
  airTimer: number;
  spinTimer: number;
  boostTimer: number;
}

export interface SlideCourseConfig {
  id: number;
  name: string;
  theme: string;
  totalDistance: number; // meters to finish splash pool
  waterHue: string;
}

export interface DuckWaterSlideEvent {
  type: 'collect_duck' | 'collect_melon' | 'hit_boost' | 'hit_ramp' | 'hit_soap' | 'hit_hazard' | 'stunt_landing' | 'course_finish' | 'game_over';
  itemType?: SlideItemType;
  x?: number;
  y?: number;
}

export interface DuckWaterSlideState {
  currentCourseIndex: number;
  distanceCovered: number; // 0 to totalDistance
  duck: DuckRacer;
  score: number;
  highScore: number;
  lives: number;
  combo: number;
  items: SlideItem[];
  courseComplete: boolean;
  gameOver: boolean;
  gameComplete: boolean;
  lastEvents: DuckWaterSlideEvent[];
}

export type TargetRingType = 'bullseye' | 'red' | 'blue' | 'white';

export interface TargetRing {
  type: TargetRingType;
  points: number;
  maxRadius: number;
  label: string;
}

export interface StuckArrow {
  offsetX: number;
  offsetY: number;
  angle: number;
}

export interface ArcheryTarget {
  id: string;
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  radius: number;
  movementType: 'static' | 'vertical' | 'horizontal' | 'oscillation';
  amplitude: number;
  speed: number;
  phase: number;
  stuckArrows: StuckArrow[];
}

export interface AppleTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  points: number;
  isHit: boolean;
}

export interface BellTarget {
  id: string;
  x: number;
  y: number;
  radius: number;
  points: number;
  isHit: boolean;
}

export interface FlyingArrow {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  isActive: boolean;
  flightTime: number;
}

export interface ArcheryParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export interface ArcheryFloatingBadge {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
}

export interface StageConfig {
  stage: number;
  name: string;
  subtitle: string;
  targetScore: number;
  arrowsGiven: number;
  windMin: number;
  windMax: number;
  targets: Array<{
    x: number;
    y: number;
    movementType: 'static' | 'vertical' | 'horizontal' | 'oscillation';
    amplitude: number;
    speed: number;
  }>;
  apples: Array<{ x: number; y: number }>;
  bells: Array<{ x: number; y: number }>;
}

export interface DuckArcheryState {
  status: 'aiming' | 'arrow_flying' | 'stage_cleared' | 'game_over' | 'victory';
  stage: number;
  score: number;
  highScore: number;
  arrowsLeft: number;
  currentWind: number; // In m/s (-4.0 to +4.0)
  bowX: number;
  bowY: number;
  isPulling: boolean;
  pullStartX: number;
  pullStartY: number;
  pullCurrentX: number;
  pullCurrentY: number;
  pullDistance: number;
  pullAngle: number;
  arrow: FlyingArrow | null;
  targets: ArcheryTarget[];
  apples: AppleTarget[];
  bells: BellTarget[];
  particles: ArcheryParticle[];
  floatingBadges: ArcheryFloatingBadge[];
  consecutiveBullseyes: number;
  bullseyeCount: number;
  timeInState: number;
  width: number;
  height: number;
}

export interface DuckArcheryEvent {
  type: 'bow_release' | 'target_hit' | 'apple_hit' | 'bell_hit' | 'arrow_miss' | 'stage_cleared' | 'game_over' | 'victory';
  ringType?: TargetRingType;
  pointsEarned?: number;
  bonusArrows?: number;
  x?: number;
  y?: number;
}

export type KoiBreed =
  | 'kohaku'
  | 'yamabuki'
  | 'showa'
  | 'tancho'
  | 'butterfly_sakura';

export interface KoiFish {
  id: string;
  breed: KoiBreed;
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  maxSpeed: number;
  angle: number;
  targetAngle: number;
  length: number;
  width: number;
  wigglePhase: number;
  wiggleSpeed: number;
  sizeTier: number; // 1 (Young), 2 (Adult), 3 (Majestic)
  zenValue: number;
  isHungry: boolean;
  eatCooldown: number;
}

export interface FoodPellet {
  id: string;
  x: number;
  y: number;
  radius: number;
  sinkSpeed: number;
  life: number;
  maxLife: number;
  isGolden: boolean;
  points: number;
}

export interface WaterRipple {
  id: string;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  speed: number;
  alpha: number;
  color?: string;
}

export interface LotusLilyPad {
  id: string;
  x: number;
  y: number;
  radius: number;
  rotation: number;
  bloomProgress: number; // 0 (closed bud) to 1 (full bloom)
  isBloomed: boolean;
  bloomColor: string;
  zenAwarded: boolean;
}

export interface AmbientParticle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  type: 'sakura_petal' | 'firefly' | 'water_sparkle';
  rotation: number;
  rotationSpeed: number;
}

export interface ZenGardenStage {
  id: number;
  title: string;
  subtitle: string;
  targetZen: number;
  unlockedBreeds: KoiBreed[];
  lilyPadCount: number;
  ambientType: 'water_sparkle' | 'sakura_petal' | 'firefly';
  themeColor: string;
}

export interface KoiPondState {
  stage: number;
  stageConfig: ZenGardenStage;
  zenPoints: number;
  targetZen: number;
  totalFedCount: number;
  pondWidth: number;
  pondHeight: number;
  fish: KoiFish[];
  pellets: FoodPellet[];
  ripples: WaterRipple[];
  lilyPads: LotusLilyPad[];
  particles: AmbientParticle[];
  isStageCompleted: boolean;
  gameCompleted: boolean;
  singingBowlCooldown: number; // seconds remaining
  petalShowerActive: boolean;
  petalShowerTimer: number; // seconds remaining
  multiplier: number;
}

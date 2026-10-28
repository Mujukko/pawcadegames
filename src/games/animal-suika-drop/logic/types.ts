export interface AnimalTierConfig {
  tier: number;
  name: string;
  emoji: string;
  radius: number;
  score: number;
  color: string;
  borderColor: string;
}

export interface AnimalBall {
  id: number;
  tier: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  restingTimer?: number;
}

export interface SuikaState {
  currentDropTier: number;
  nextDropTier: number;
  dropX: number;
  balls: AnimalBall[];
  score: number;
  highScore: number;
  gameOver: boolean;
  overflowTimer: number; // Seconds any ball rests above danger line
}

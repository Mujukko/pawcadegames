export type PuppyMood = 'happy' | 'hungry' | 'dirty' | 'sleepy' | 'playful';

export type PuppyAccessory = 'none' | 'red_bandana' | 'bell_collar' | 'detective_hat' | 'party_bowtie';

export type PuppyCareActivity = 'idle' | 'feeding' | 'washing' | 'playing_fetch' | 'sleeping' | 'trick_training';

export interface PuppyStats {
  hunger: number; // 0 to 100 (100 = full)
  hygiene: number; // 0 to 100 (100 = squeaky clean)
  happiness: number; // 0 to 100 (100 = overjoyed)
  energy: number; // 0 to 100 (100 = fully rested)
}

export interface PuppyGameState {
  puppyName: string;
  breed: string;
  level: number;
  xp: number;
  maxXp: number;
  stats: PuppyStats;
  currentActivity: PuppyCareActivity;
  accessory: PuppyAccessory;
  unlockedAccessories: PuppyAccessory[];
  bones: number; // currency earned from good care
  tricksKnown: string[];
  ballPosition: { x: number; y: number; vx: number; vy: number; isThrown: boolean } | null;
  foamBubbles: Array<{ id: string; x: number; y: number; size: number }>;
  events: Array<{ type: string; stat?: string; delta?: number; text?: string }>;
}

import { AnimalType } from '../logic/types';
import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

class PetCandyCrushSoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastMatchTime = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('pawcade_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  private initCtx() {
    this.ctx = getSharedAudioContext();
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('pawcade_sound_muted', String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Subtle tactile tap when clicking/selecting a candy
   */
  public playSelect(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * Aerodynamic card swap whoosh
   */
  public playSwap(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.06);

      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Rubbery bonk for an illegal/invalid swap
   */
  public playInvalid(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Juicy Bubble-Pop Cascade + Sparkling Candy Crush Marimba Chord!
   * Plays rapid ascending bubble pops ("blop-pop-pop!") followed by a triumphant harmonic chime.
   */
  public playMatch(comboCount: number = 1, tileCount: number = 3): void {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastMatchTime < 45) return;
    this.lastMatchTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Rapid Juicy Bubble Pops (Pet Rescue / Bubble Pop feel)
      const popCount = Math.min(6, Math.max(3, tileCount));
      const basePopFreq = 320 + Math.min(comboCount, 5) * 55;
      for (let i = 0; i < popCount; i++) {
        const popStart = now + i * 0.032;
        const popOsc = this.ctx.createOscillator();
        const popGain = this.ctx.createGain();

        popOsc.type = 'sine';
        const startF = basePopFreq + i * 48;
        // Classic bubble pop pitch envelope: fast upward sweep then tiny drop
        popOsc.frequency.setValueAtTime(startF * 0.65, popStart);
        popOsc.frequency.exponentialRampToValueAtTime(startF * 1.45, popStart + 0.038);
        popOsc.frequency.exponentialRampToValueAtTime(startF * 1.1, popStart + 0.055);

        popGain.gain.setValueAtTime(0.001, popStart);
        popGain.gain.linearRampToValueAtTime(0.22, popStart + 0.01);
        popGain.gain.exponentialRampToValueAtTime(0.001, popStart + 0.06);

        popOsc.connect(popGain);
        popGain.connect(this.ctx.destination);

        popOsc.start(popStart);
        popOsc.stop(popStart + 0.065);
      }

      // 2. Celebratory Candy Crush Marimba + Bell Chord ("I did it!" reward feel)
      const scales = [
        [523.25, 659.25, 783.99], // Combo 1: C5, E5, G5 major triad
        [587.33, 739.99, 880.0], // Combo 2: D5, F#5, A5
        [659.25, 830.61, 987.77, 1318.51], // Combo 3: E5 major + E6 sparkle
        [783.99, 987.77, 1174.66, 1567.98], // Combo 4+: G5 major + G6 fanfare!
      ];

      const notes = scales[Math.min(comboCount - 1, scales.length - 1)] || scales[0]!;
      notes.forEach((freq, idx) => {
        const noteTime = now + 0.05 + idx * 0.045;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.34);
      });
    } catch {}
  }

  /**
   * Procedural vocal accents for matching farm animals
   */
  public playAnimalVocal(animal: AnimalType): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (animal === 'cow') {
        // Warm low pitch-bending moo
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(155, now);
        osc.frequency.linearRampToValueAtTime(175, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(130, now + 0.35);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.14, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.36);
      } else if (animal === 'pig') {
        // Cute cartoon oink (two quick snorts)
        [0, 0.08].forEach((offset) => {
          const osc = this.ctx!.createOscillator();
          const gain = this.ctx!.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(420, now + offset);
          osc.frequency.exponentialRampToValueAtTime(280, now + offset + 0.06);

          gain.gain.setValueAtTime(0.13, now + offset);
          gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.065);

          osc.connect(gain);
          gain.connect(this.ctx!.destination);

          osc.start(now + offset);
          osc.stop(now + offset + 0.07);
        });
      } else if (animal === 'sheep') {
        // Gentle bleat with vibrato
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(260, now);
        osc.frequency.linearRampToValueAtTime(275, now + 0.06);
        osc.frequency.linearRampToValueAtTime(245, now + 0.22);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.26);
      } else if (animal === 'chicken') {
        // Quick cheerful bawk
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.14);
      } else if (animal === 'duck') {
        // Nasal resonant quack
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(380, now);
        osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, now);
        filter.Q.setValueAtTime(3, now);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.17);
      } else if (animal === 'horse') {
        // Gentle horse whinny / trot tone
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(460, now);
        osc.frequency.linearRampToValueAtTime(620, now + 0.08);
        osc.frequency.exponentialRampToValueAtTime(340, now + 0.22);

        gain.gain.setValueAtTime(0.13, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.23);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.24);
      }
    } catch {}
  }

  /**
   * Deep festive popping chord when Striped Treat or Wrapped Bomb triggers
   */
  public playSpecialExplosion(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [180, 260, 520].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.03);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + 0.2 + i * 0.03);

        gain.gain.setValueAtTime(0.25, now + i * 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25 + i * 0.03);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.03);
        osc.stop(now + 0.26 + i * 0.03);
      });
    } catch {}
  }

  /**
   * Dazzling celestial harp chime when Rainbow Star clears a color!
   */
  public playRainbowBlast(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const rainbowNotes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      rainbowNotes.forEach((freq, idx) => {
        const noteStart = now + idx * 0.05;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.18, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.38);
      });
    } catch {}
  }

  /**
   * Joyful Sugar Crush victory celebration fanfare!
   */
  public playSugarCrush(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const fanfare = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      fanfare.forEach((freq, idx) => {
        const noteStart = now + idx * 0.09;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        gain.gain.setValueAtTime(0.24, noteStart);
        gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.55);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.6);
      });
    } catch {}
  }

  /**
   * Gentle descending tone on game over
   */
  public playGameOver(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [440, 392, 349.23, 261.63].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.15);

        gain.gain.setValueAtTime(0.16, now + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + i * 0.15);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.15);
        osc.stop(now + 0.5 + i * 0.15);
      });
    } catch {}
  }
}

export const petCrushSound = new PetCandyCrushSoundManager();

import { ANIMAL_TIERS } from '../logic/types';

class Animal2048SoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastSlideSoundTime = 0;

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
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
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
   * Aerodynamic card/tile slide whoosh
   */
  public playSlide(): void {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastSlideSoundTime < 60) return;
    this.lastSlideSoundTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.06);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.07);
    } catch {}
  }

  /**
   * Dynamic animal tier merge chime scaled to the animal's natural frequency
   */
  public playMerge(value: number): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const tier = ANIMAL_TIERS[value];
      const baseFreq = tier ? tier.soundPitch : 440;

      // Dual tone bell harmonic
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(baseFreq, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.28);
      osc2.stop(now + 0.28);
    } catch {}
  }

  /**
   * Cute tiny mouse squeak when initial mouse tiles collide or spawn
   */
  public playMouseSqueak(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.linearRampToValueAtTime(1800, now + 0.04);
      osc.frequency.linearRampToValueAtTime(1400, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }

  /**
   * Grand Royal Brass Elephant Trumpet Fanfare (2048 Victory Celebration!)
   */
  public playElephantFanfare(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Mighty low elephant trumpet slide: 120Hz -> 260Hz -> 180Hz
      const oscTrumpet = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gainTrumpet = this.ctx.createGain();

      oscTrumpet.type = 'sawtooth';
      oscTrumpet.frequency.setValueAtTime(140, now);
      oscTrumpet.frequency.linearRampToValueAtTime(260, now + 0.2);
      oscTrumpet.frequency.exponentialRampToValueAtTime(160, now + 0.55);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, now);
      filter.frequency.linearRampToValueAtTime(2200, now + 0.2);
      filter.frequency.linearRampToValueAtTime(900, now + 0.55);

      gainTrumpet.gain.setValueAtTime(0.001, now);
      gainTrumpet.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainTrumpet.gain.setValueAtTime(0.28, now + 0.35);
      gainTrumpet.gain.exponentialRampToValueAtTime(0.001, now + 0.58);

      oscTrumpet.connect(filter);
      filter.connect(gainTrumpet);
      gainTrumpet.connect(this.ctx.destination);

      oscTrumpet.start(now);
      oscTrumpet.stop(now + 0.58);

      // 2. Triumphant royal arpeggio fanfare chord progression (C5 -> E5 -> G5 -> C6)
      const fanfareNotes = [523.25, 659.25, 783.99, 1046.5];
      fanfareNotes.forEach((freq, idx) => {
        const noteStart = now + 0.45 + idx * 0.12;
        const osc = this.ctx!.createOscillator();
        const g = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteStart);

        g.gain.setValueAtTime(0.22, noteStart);
        g.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.6);

        osc.connect(g);
        g.connect(this.ctx!.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 0.65);
      });
    } catch {}
  }

  /**
   * Reverse harp undo chime
   */
  public playUndo(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [659.25, 523.25].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0.18, now + i * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18 + i * 0.06);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.06);
        osc.stop(now + 0.2 + i * 0.06);
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
        osc.frequency.setValueAtTime(freq, now + i * 0.14);

        gain.gain.setValueAtTime(0.15, now + i * 0.14);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45 + i * 0.14);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.14);
        osc.stop(now + 0.5 + i * 0.14);
      });
    } catch {}
  }

  /**
   * UI click tap
   */
  public playClick(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(200, now + 0.03);

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.035);
    } catch {}
  }
}

export const animal2048Sound = new Animal2048SoundManager();

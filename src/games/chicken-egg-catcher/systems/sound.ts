import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

// Procedural Web Audio Sound Synthesizer for Chicken Egg Catcher: Barnyard Rush
// Zero external audio files, zero latency, resilient to mobile touch unlocking

class ChickenEggCatcherAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastCatchTime: number = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('pawcade_sound_muted');
      this.isMuted = saved === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      this.ctx = getSharedAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('pawcade_sound_muted', this.isMuted ? 'true' : 'false');
    } catch {}
    return this.isMuted;
  }

  // Soft bouncy straw basket catch thump + upward scale with combo
  public playEggCatch(combo = 1): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastCatchTime < 0.04) return;
    this.lastCatchTime = now;

    const t = now;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    const baseFreq = 440 * Math.pow(1.05, Math.min(20, combo));
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.07);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.07);
  }

  // Sparkly ascending glockenspiel arpeggio for golden egg
  public playGoldenEgg(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const chord = [783.99, 987.77, 1174.66, 1567.98]; // G5, B5, D6, G6
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.045);

      gain.gain.setValueAtTime(0.16, t + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.045 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.045);
      osc.stop(t + idx * 0.045 + 0.22);
    });
  }

  // Liquid egg yolk splat & squelch on floor
  public playSplat(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, t);
    osc.frequency.exponentialRampToValueAtTime(65, t + 0.09);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Cartoon hen "Bawk bawk!" cluck sound
  public playCluck(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, t);
    osc.frequency.exponentialRampToValueAtTime(820, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.09);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Melancholy descending game over tone
  public playGameOver(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [440, 415.3, 392, 349.23]; // A4, Ab4, G4, F4
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.15, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.12 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.25);
    });
  }
}

export const catcherAudio = new ChickenEggCatcherAudioSystem();

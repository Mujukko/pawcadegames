import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

// Procedural Web Audio Sound Synthesizer for Hamster Maze: Nut Escape
// Zero external audio files, zero latency, resilient to mobile touch unlocking

class HamsterMazeAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastCrunchTime: number = 0;

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

  // Cute high-pitch chirp/squeak for Pip when stepping or celebrating
  public playHamsterSqueak(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, t);
    osc.frequency.exponentialRampToValueAtTime(1900, t + 0.04);
    osc.frequency.exponentialRampToValueAtTime(1600, t + 0.08);

    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Satisfying crispy nut/seed munch sound
  public playAcornCrunch(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    if (now - this.lastCrunchTime < 0.05) return;
    this.lastCrunchTime = now;

    const t = now;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800 + Math.random() * 200, t);
    osc.frequency.exponentialRampToValueAtTime(320, t + 0.06);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Bright golden key pickup chime
  public playKeyChime(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const chord = [880, 1108.73, 1318.51, 1760]; // A5 major arpeggio
    chord.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);

      gain.gain.setValueAtTime(0.16, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.005, t + idx * 0.05 + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.25);
    });
  }

  // Wooden latch / gate unlatch sound
  public playGateUnlock(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    // Low mechanical click
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(240, t);
    osc1.frequency.exponentialRampToValueAtTime(80, t + 0.08);
    gain1.gain.setValueAtTime(0.14, t);
    gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(t);
    osc1.stop(t + 0.08);

    // High metal ring
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(659.25, t + 0.04);
    osc2.frequency.exponentialRampToValueAtTime(1046.5, t + 0.12);
    gain2.gain.setValueAtTime(0.15, t + 0.04);
    gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(t + 0.04);
    osc2.stop(t + 0.18);
  }

  // Soft wooden bump against maze wall
  public playBump(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(160, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.06);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.06);
  }

  // Ascending brass-style stage victory fanfare
  public playStageClear(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.08);

      gain.gain.setValueAtTime(0.2, t + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.08);
      osc.stop(t + idx * 0.08 + 0.28);
    });
  }

  // Grand triumph fanfare when completing all stages
  public playAllComplete(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.0],
      [659.25, 830.61, 987.77],
      [783.99, 987.77, 1318.51],
      [1046.5, 1318.51, 1567.98],
    ];

    chords.forEach((chord, step) => {
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + step * 0.12);

        gain.gain.setValueAtTime(0.12, t + step * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.005, t + step * 0.12 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(t + step * 0.12);
        osc.stop(t + step * 0.12 + 0.35);
      });
    });
  }
}

export const hamsterAudio = new HamsterMazeAudioSystem();

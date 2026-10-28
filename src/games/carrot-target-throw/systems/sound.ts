import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

class CarrotAudioSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

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

  public playThrow(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const t = ctx.currentTime;
    osc.frequency.setValueAtTime(480, t);
    osc.frequency.exponentialRampToValueAtTime(140, t + 0.12);

    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playStick(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Wooden thud body
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(70, t + 0.08);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.09);

    // High snap
    const snap = ctx.createOscillator();
    const snapGain = ctx.createGain();
    snap.type = 'sine';
    snap.frequency.setValueAtTime(750, t);
    snap.frequency.exponentialRampToValueAtTime(280, t + 0.04);
    snapGain.gain.setValueAtTime(0.15, t);
    snapGain.gain.exponentialRampToValueAtTime(0.01, t + 0.04);

    snap.connect(snapGain);
    snapGain.connect(ctx.destination);

    snap.start(t);
    snap.stop(t + 0.04);
  }

  public playSlice(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;

    // Juicy slice chime
    const notes = [659.25, 880, 1174.66]; // E5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.035);

      gain.gain.setValueAtTime(0.18, t + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.01, t + idx * 0.035 + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + idx * 0.035);
      osc.stop(t + idx * 0.035 + 0.15);
    });
  }

  public playClash(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(190, t);
    osc.frequency.linearRampToValueAtTime(60, t + 0.18);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  public playStageClear(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    melody.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.09);

      gain.gain.setValueAtTime(0.22, t + i * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.09 + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + i * 0.09);
      osc.stop(t + i * 0.09 + 0.22);
    });
  }

  public playVictory(): void {
    const ctx = this.initCtx();
    if (!ctx) return;

    const t = ctx.currentTime;
    const fanfare = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    fanfare.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + i * 0.11);

      gain.gain.setValueAtTime(0.24, t + i * 0.11);
      gain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.11 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(t + i * 0.11);
      osc.stop(t + i * 0.11 + 0.35);
    });
  }
}

export const carrotAudio = new CarrotAudioSystem();

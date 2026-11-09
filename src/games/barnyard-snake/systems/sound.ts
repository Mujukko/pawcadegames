// Barnyard Snake Web Audio Synthesizer — 100% native Web Audio, zero external assets

class SnakeSoundManager {
  private ctx: AudioContext | null = null;
  private isMuted = false;

  private init(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  private blip(freqFrom: number, freqTo: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqFrom, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch {
      /* audio is optional */
    }
  }

  public playEat() {
    this.blip(420, 760, 0.09, 'triangle', 0.18);
  }

  public playGolden() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => this.blip(f, f * 1.02, 0.12, 'sine', 0.16, i * 0.06));
  }

  public playRock() {
    this.blip(140, 90, 0.12, 'square', 0.1);
  }

  public playDie() {
    this.blip(300, 55, 0.4, 'sawtooth', 0.22);
  }
}

export const snakeSound = new SnakeSoundManager();

// Barnyard Slither.io Web Audio Synthesizer — 100% native Web Audio, zero external assets

class SlitherSoundManager {
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

  private chirp(from: number, to: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(from, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur);
      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur + 0.02);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    } catch {
      /* audio optional */
    }
  }

  public playEat(jumbo: boolean) {
    if (jumbo) {
      this.chirp(520, 920, 0.11, 'sine', 0.16);
    } else {
      this.chirp(420, 620, 0.06, 'sine', 0.09);
    }
  }

  public playKill() {
    [440, 587.33, 783.99, 1046.5].forEach((f, i) =>
      this.chirp(f, f * 1.05, 0.11, 'triangle', 0.16, i * 0.05)
    );
  }

  public playDie() {
    this.chirp(260, 52, 0.42, 'sawtooth', 0.22);
  }
}

export const slitherSound = new SlitherSoundManager();

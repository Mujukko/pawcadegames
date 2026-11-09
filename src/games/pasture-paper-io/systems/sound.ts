// Pasture Paper.io Web Audio Synthesizer — 100% native Web Audio, zero external assets

class PaperSoundManager {
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

  private tone(from: number, to: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
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

  public playClaim(cells: number) {
    const boost = Math.min(300, cells * 8);
    this.tone(360 + boost * 0.4, 680 + boost, 0.14, 'triangle', 0.18);
    if (cells >= 12) {
      this.tone(523.25, 1046.5, 0.18, 'sine', 0.15, 0.07);
    }
  }

  public playKill() {
    [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, f * 1.05, 0.1, 'triangle', 0.16, i * 0.05));
  }

  public playDie() {
    this.tone(280, 55, 0.38, 'sawtooth', 0.22);
  }

  public playVictory() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.tone(f, f * 1.02, 0.16, 'sine', 0.18, i * 0.07)
    );
  }
}

export const paperSound = new PaperSoundManager();

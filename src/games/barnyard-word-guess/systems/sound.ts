// Barnyard Word Guess Web Audio Synthesizer — 100% native Web Audio, zero external assets

class WordSoundManager {
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

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slideTo?: number) {
    if (this.isMuted) return;
    try {
      const ctx = this.init();
      if (!ctx) return;
      const t = ctx.currentTime + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
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

  public playKey() {
    this.tone(660, 0.04, 'triangle', 0.06);
  }

  public playReveal(index: number, state: 'correct' | 'present' | 'absent') {
    const base = state === 'correct' ? 659.25 : state === 'present' ? 523.25 : 196;
    this.tone(base, 0.12, state === 'absent' ? 'sine' : 'triangle', 0.11, index * 0.2);
  }

  public playError() {
    this.tone(180, 0.14, 'square', 0.07);
  }

  public playWin() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.2, 'sine', 0.15, 1.1 + i * 0.09));
  }

  public playLose() {
    this.tone(330, 0.5, 'sawtooth', 0.12, 1.1, 90);
  }
}

export const wordSound = new WordSoundManager();

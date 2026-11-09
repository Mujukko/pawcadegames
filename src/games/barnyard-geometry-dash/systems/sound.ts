// Barnyard Geometry Dash Web Audio Synthesizer — Chiptune rhythm pulse + SFX, zero external files

const BASS_RIFF = [130.81, 130.81, 155.56, 174.61, 196.0, 174.61, 155.56, 146.83];

class DashSoundManager {
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

  private synth(from: number, to: number, dur: number, type: OscillatorType, vol: number, delay = 0) {
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

  public playBeat(step: number) {
    const note = BASS_RIFF[step % BASS_RIFF.length]!;
    this.synth(note, note * 0.98, 0.08, 'triangle', 0.09);
    if (step % 2 === 0) {
      this.synth(note * 2, note * 2.01, 0.05, 'square', 0.04);
    }
  }

  public playJump() {
    this.synth(300, 560, 0.09, 'square', 0.12);
  }

  public playPad() {
    this.synth(380, 880, 0.14, 'triangle', 0.17);
  }

  public playOrb() {
    this.synth(520, 960, 0.11, 'sine', 0.16);
  }

  public playPortal() {
    [440, 659.25, 880].forEach((f, i) => this.synth(f, f * 1.1, 0.1, 'sine', 0.14, i * 0.04));
  }

  public playCoin() {
    this.synth(987.77, 1318.5, 0.14, 'sine', 0.18);
  }

  public playCrash() {
    this.synth(220, 45, 0.28, 'sawtooth', 0.22);
  }

  public playComplete() {
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
      this.synth(f, f * 1.02, 0.16, 'triangle', 0.18, i * 0.07)
    );
  }
}

export const dashSound = new DashSoundManager();

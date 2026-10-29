// Virtual Puppy Pet Care Web Audio Synthesizer
// 100% Native Web Audio API - Zero External Files

class PuppySoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public playBark() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Cute puppy yip: two quick resonant chirps
      [0, 0.09].forEach((delay) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(420, t + delay);
        osc.frequency.exponentialRampToValueAtTime(780, t + delay + 0.04);
        osc.frequency.exponentialRampToValueAtTime(320, t + delay + 0.08);

        gain.gain.setValueAtTime(0.16, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.09);

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, t + delay);
        filter.Q.setValueAtTime(2.5, t + delay);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + delay);
        osc.stop(t + delay + 0.1);
      });
    } catch {}
  }

  public playEat() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Crunchy kibble munches
      for (let i = 0; i < 3; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300 + Math.random() * 80, t + i * 0.07);
        osc.frequency.exponentialRampToValueAtTime(120, t + i * 0.07 + 0.04);

        gain.gain.setValueAtTime(0.18, t + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.07 + 0.05);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + i * 0.07);
        osc.stop(t + i * 0.07 + 0.06);
      }
    } catch {}
  }

  public playSplash() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(500, t);
      osc.frequency.exponentialRampToValueAtTime(180, t + 0.12);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  public playBallSqueak() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Squeaky tennis ball
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, t);
      osc.frequency.linearRampToValueAtTime(1400, t + 0.06);
      osc.frequency.linearRampToValueAtTime(900, t + 0.12);

      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.15);
    } catch {}
  }

  public playLullaby() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const notes = [523.25, 440, 392, 329.63];
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.18);

        gain.gain.setValueAtTime(0.12, t + idx * 0.18);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.18 + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.18);
        osc.stop(t + idx * 0.18 + 0.38);
      });
    } catch {}
  }

  public playLevelUp() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const fanfare = [392, 523.25, 659.25, 783.99, 1046.5];
      fanfare.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t + idx * 0.08);

        gain.gain.setValueAtTime(0.2, t + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.08);
        osc.stop(t + idx * 0.08 + 0.32);
      });
    } catch {}
  }
}

export const puppySound = new PuppySoundManager();

// Barnyard Derby Procedural Web Audio Synthesizer
// 100% Native Web Audio API - Zero External Files

class DerbySoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastGallopTime: number = 0;

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

  public playGallop(speedRatio: number = 1.0) {
    if (this.isMuted) return;
    const now = Date.now();
    const interval = Math.max(160, 320 / Math.max(0.4, speedRatio));
    if (now - this.lastGallopTime < interval) return;
    this.lastGallopTime = now;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Gallop consists of two quick wooden clip-clops (fore and hind hooves)
      [0, 0.08].forEach((delay, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = 'triangle';
        const baseFreq = idx === 0 ? 180 : 140;
        osc.frequency.setValueAtTime(baseFreq, t + delay);
        osc.frequency.exponentialRampToValueAtTime(60, t + delay + 0.05);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(320, t + delay);
        filter.Q.setValueAtTime(3.0, t + delay);

        gain.gain.setValueAtTime(0.08, t + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, t + delay + 0.06);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + delay);
        osc.stop(t + delay + 0.07);
      });
    } catch {}
  }

  public playJump() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, t);
      osc.frequency.exponentialRampToValueAtTime(540, t + 0.22);

      gain.gain.setValueAtTime(0.18, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.26);
    } catch {}
  }

  public playJumpGrade(grade: 'ok' | 'great' | 'perfect') {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const freqs = grade === 'perfect' ? [523.25, 659.25, 783.99, 1046.5] : grade === 'great' ? [440, 554.37, 659.25] : [349.23, 440];
      const step = 0.06;

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * step);

        gain.gain.setValueAtTime(0.14, t + idx * step);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * step + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * step);
        osc.stop(t + idx * step + 0.2);
      });
    } catch {}
  }

  public playStumble() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Wooden fence crash impact
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.25);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.3);
    } catch {}
  }

  public playCollect(itemType: string) {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      if (itemType === 'carrot') {
        // Crisp crunch
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.08);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      } else {
        // Metallic horseshoe bell
        osc.type = 'sine';
        osc.frequency.setValueAtTime(itemType === 'golden_apple' ? 987.77 : 880, t);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
      }

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.36);
    } catch {}
  }

  public playWhinny() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Horse whinny frequency modulation
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(550, t);
      osc.frequency.linearRampToValueAtTime(950, t + 0.18);
      osc.frequency.linearRampToValueAtTime(700, t + 0.35);
      osc.frequency.linearRampToValueAtTime(850, t + 0.5);
      osc.frequency.exponentialRampToValueAtTime(300, t + 0.75);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.linearRampToValueAtTime(0.18, t + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.78);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1200, t);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.8);
    } catch {}
  }

  public playBugleFanfare() {
    if (this.isMuted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      // Traditional Derby "First Call / Call to the Post" bugle pattern:
      // C4 (261.63), G4 (392.00), C5 (523.25), E5 (659.25), G5 (783.99)
      const notes = [
        { f: 392.0, d: 0.12 },
        { f: 523.25, d: 0.12 },
        { f: 659.25, d: 0.14 },
        { f: 783.99, d: 0.35 },
      ];

      let cur = t;
      notes.forEach((n) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, cur);

        gain.gain.setValueAtTime(0.2, cur);
        gain.gain.exponentialRampToValueAtTime(0.001, cur + n.d);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(cur);
        osc.stop(cur + n.d + 0.02);

        cur += n.d + 0.03;
      });
    } catch {}
  }
}

export const derbySound = new DerbySoundManager();

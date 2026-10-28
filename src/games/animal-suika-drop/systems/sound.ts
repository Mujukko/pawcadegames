// Web Audio Synthesizer for Animal Drop: Watermelon Merge (animal-suika-drop)
// Zero external sound files - 100% native Web Audio API with touch unlock

class SuikaSoundSystem {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Soft whoosh when dropping an animal
  public playDrop() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // AudioContext safe failover
    }
  }

  // Rubbery bouncy pop when animal bounces
  public playBounce(speedRatio: number = 0.5) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;
      const vol = Math.min(0.25, Math.max(0.06, speedRatio * 0.22));

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + speedRatio * 120, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.08);

      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // AudioContext safe failover
    }
  }

  // Ascending musical chime when two animals merge, pitch scaled by new tier
  public playMerge(tier: number) {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      // Pentatonic / major scale frequencies based on tier
      const baseFreqs = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 1046.5];
      const freq = baseFreqs[Math.min(tier, baseFreqs.length - 1)] || 523.25;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.18);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);

      // Higher tiers (>=5) get a shimmering harmonic overtone
      if (tier >= 5) {
        const oscHarm = this.ctx.createOscillator();
        const gainHarm = this.ctx.createGain();
        oscHarm.type = 'triangle';
        oscHarm.frequency.setValueAtTime(freq * 2, now + 0.04);
        oscHarm.frequency.exponentialRampToValueAtTime(freq * 2.5, now + 0.22);
        gainHarm.gain.setValueAtTime(0.15, now + 0.04);
        gainHarm.gain.exponentialRampToValueAtTime(0.001, now + 0.26);

        oscHarm.connect(gainHarm);
        gainHarm.connect(this.ctx.destination);
        oscHarm.start(now + 0.04);
        oscHarm.stop(now + 0.26);
      }
    } catch {
      // AudioContext safe failover
    }
  }

  // Grand fanfare when creating the Mega Watermelon Elephant (Tier 9)
  public playMegaFanfare() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const chords = [523.25, 659.25, 783.99, 1046.5]; // C major
      const now = this.ctx.currentTime;

      chords.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.08;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.2, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.6);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.65);
      });
    } catch {
      // AudioContext safe failover
    }
  }

  // Danger warning blip when overflow timer is rising
  public playWarning() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(680, now);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.08);
    } catch {
      // AudioContext safe failover
    }
  }

  // Game over descending trombone
  public playGameOver() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.45);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.5);
    } catch {
      // AudioContext safe failover
    }
  }
}

export const suikaSound = new SuikaSoundSystem();

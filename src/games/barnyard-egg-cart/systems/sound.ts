class ProceduralEggCartAudio {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private isEngineRunning: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_sound_muted');
        this.muted = saved === 'true';
      } catch {
        // fallback
      }
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pawcade_sound_muted', this.muted ? 'true' : 'false');
      } catch {
        // fallback
      }
    }
    if (this.muted && this.engineGain) {
      this.engineGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    }
    return this.muted;
  }

  public startEngine(): void {
    if (this.isEngineRunning) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      this.engineOsc = ctx.createOscillator();
      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(45, ctx.currentTime);

      this.engineFilter = ctx.createBiquadFilter();
      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(140, ctx.currentTime);

      this.engineGain = ctx.createGain();
      this.engineGain.gain.setValueAtTime(this.muted ? 0 : 0.04, ctx.currentTime);

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(ctx.destination);

      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // audio error handling
    }
  }

  public updateEnginePitch(speedRatio: number): void {
    if (!this.isEngineRunning || !this.ctx || !this.engineOsc || !this.engineFilter || !this.engineGain) return;
    if (this.muted) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
      return;
    }

    const clampedRatio = Math.max(0, Math.min(1.5, speedRatio));
    const targetFreq = 45 + clampedRatio * 65; // 45Hz idle up to 142Hz rev
    const filterFreq = 140 + clampedRatio * 220;
    const targetVol = 0.03 + clampedRatio * 0.04;

    this.engineOsc.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.08);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, this.ctx.currentTime, 0.08);
    this.engineGain.gain.setTargetAtTime(targetVol, this.ctx.currentTime, 0.08);
  }

  public stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc?.stop();
      this.engineOsc?.disconnect();
      this.engineFilter?.disconnect();
      this.engineGain?.disconnect();
    } catch {
      // cleanup
    }
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  public playEggWobble(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(280 + Math.random() * 40, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(160, ctx.currentTime + 0.06);

    gain.gain.setValueAtTime(0.04, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  }

  public playSuspensionSqueak(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  public playCoinPickup(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [659.25, 783.99, 1046.5]; // E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.04);

      gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.04 + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.04);
      osc.stop(ctx.currentTime + i * 0.04 + 0.12);
    });
  }

  public playPowerUp(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.22);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.24);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.24);
  }

  public playEggCrack(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    // 1. White noise burst for crunchy shell break
    const bufferSize = ctx.sampleRate * 0.18;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, ctx.currentTime);
    noiseFilter.Q.setValueAtTime(1.5, ctx.currentTime);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.2, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Resonant low squishy thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.2);

    oscGain.gain.setValueAtTime(0.18, ctx.currentTime);
    oscGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    noise.start();
    osc.start();
    osc.stop(ctx.currentTime + 0.22);
  }

  public playNewRecord(): void {
    if (this.muted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const fanNotes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    fanNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.1, ctx.currentTime + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.08 + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + idx * 0.08);
      osc.stop(ctx.currentTime + idx * 0.08 + 0.28);
    });
  }
}

export const eggCartAudio = new ProceduralEggCartAudio();

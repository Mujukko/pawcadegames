class TractorHillClimbSoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private engineActive: boolean = false;

  private initCtx(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
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

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.engineGain && this.ctx) {
      this.engineGain.gain.setValueAtTime(0, this.ctx.currentTime);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public updateEngineSound(speed: number, isGas: boolean, isDriving: boolean) {
    if (this.isMuted || !isDriving) {
      if (this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    const ctx = this.initCtx();
    if (!ctx) return;

    if (!this.engineActive || !this.engineOsc) {
      try {
        this.engineOsc = ctx.createOscillator();
        this.engineGain = ctx.createGain();
        this.engineFilter = ctx.createBiquadFilter();

        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.setValueAtTime(45, ctx.currentTime);

        this.engineFilter.type = 'lowpass';
        this.engineFilter.frequency.setValueAtTime(140, ctx.currentTime);

        this.engineGain.gain.setValueAtTime(0.06, ctx.currentTime);

        this.engineOsc.connect(this.engineFilter);
        this.engineFilter.connect(this.engineGain);
        this.engineGain.connect(ctx.destination);

        this.engineOsc.start();
        this.engineActive = true;
      } catch {
        return;
      }
    }

    if (this.engineOsc && this.engineGain && this.engineFilter) {
      const targetFreq = 42 + Math.min(65, Math.abs(speed) * 0.18) + (isGas ? 25 : 0);
      const targetCutoff = 120 + Math.min(180, Math.abs(speed) * 0.4) + (isGas ? 70 : 0);
      const targetGain = isGas ? 0.08 : 0.04;

      this.engineOsc.frequency.setTargetAtTime(targetFreq, ctx.currentTime, 0.08);
      this.engineFilter.frequency.setTargetAtTime(targetCutoff, ctx.currentTime, 0.08);
      this.engineGain.gain.setTargetAtTime(targetGain, ctx.currentTime, 0.05);
    }
  }

  public stopEngineSound() {
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
    }
  }

  public playSuspensionBump() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(95, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public playCoin() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    const now = ctx.currentTime;
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.setValueAtTime(1320, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(now + 0.22);
  }

  public playFuelRefill() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Ascending power refill arpeggio (C5 -> E5 -> G5 -> C6)
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.15, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.18);
    });
  }

  public playStuntFanfare() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Bold brass fanfare
    const chord = [440, 554.37, 659.25, 880];
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.14, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + i * 0.04);
      osc.stop(now + i * 0.04 + 0.35);
    });
  }

  public playCrash() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopEngineSound();
    const now = ctx.currentTime;

    // Metal thud
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(25, now + 0.35);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.35);

    // Crunch noise
    const bufferSize = ctx.sampleRate * 0.25;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.05));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.2, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    noise.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start();
  }

  public playLowFuelWarning() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public playVictory() {
    if (this.isMuted) return;
    const ctx = this.initCtx();
    if (!ctx) return;

    this.stopEngineSound();
    const now = ctx.currentTime;
    const fanfareNotes = [523.25, 659.25, 783.99, 1046.5];
    fanfareNotes.forEach((f, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.1);
      gain.gain.setValueAtTime(0.18, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.45);
    });
  }
}

export const tractorSound = new TractorHillClimbSoundSystem();

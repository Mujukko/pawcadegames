class WaterSortAudio {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pawcade_water_sort_muted');
      this.muted = saved === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pawcade_water_sort_muted', String(this.muted));
    }
    return this.muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public playSelect() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(480, this.ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.08);
  }

  public playPour() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    // Bubbling trickle
    [260, 340, 420].forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.3, this.ctx!.currentTime + idx * 0.04 + 0.06);

      gain.gain.setValueAtTime(0.12, this.ctx!.currentTime + idx * 0.04);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.04 + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * 0.04);
      osc.stop(this.ctx!.currentTime + idx * 0.04 + 0.06);
    });
  }

  public playBottleComplete() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [587, 740, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.08);

      gain.gain.setValueAtTime(0.18, this.ctx!.currentTime + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.08 + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * 0.08);
      osc.stop(this.ctx!.currentTime + idx * 0.08 + 0.2);
    });
  }

  public playLevelClear() {
    if (this.muted) return;
    this.initCtx();
    if (!this.ctx) return;

    const notes = [523, 659, 784, 1046];
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx!.currentTime + idx * 0.09);

      gain.gain.setValueAtTime(0.22, this.ctx!.currentTime + idx * 0.09);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx!.currentTime + idx * 0.09 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(this.ctx!.currentTime + idx * 0.09);
      osc.stop(this.ctx!.currentTime + idx * 0.09 + 0.3);
    });
  }
}

export const waterSortAudio = new WaterSortAudio();

class FlappyChickenSoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastCluckTime = 0;
  private cluckVariant = 0;

  constructor() {
    try {
      const saved = localStorage.getItem('pawcade_sound_muted');
      if (saved !== null) {
        this.muted = saved === 'true';
      }
    } catch {
      this.muted = false;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    try {
      localStorage.setItem('pawcade_sound_muted', String(muted));
    } catch {}
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  /**
   * Procedural Cartoon Chicken Cluck ("Gıdak! / Bok-bawk!")
   */
  public playCluck(): void {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastCluckTime < 90) return; // Debounce rapid flaps
    this.lastCluckTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      this.cluckVariant = (this.cluckVariant + 1) % 3;

      // 1. Feathery wing flap whoosh
      const noiseBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.08, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(650, now);
      noiseFilter.Q.setValueAtTime(1.8, now);
      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.08, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.ctx.destination);
      noise.start(now);

      // 2. Formant-modeled Chicken Vocalization ("Bok!" / "Gıdak!")
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const formantFilter = this.ctx.createBiquadFilter();
      const voiceGain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      if (this.cluckVariant === 0) {
        // Quick "Bok!"
        const duration = 0.09;
        osc1.frequency.setValueAtTime(520, now);
        osc1.frequency.linearRampToValueAtTime(880, now + 0.03);
        osc1.frequency.exponentialRampToValueAtTime(640, now + duration);

        osc2.frequency.setValueAtTime(1040, now);
        osc2.frequency.linearRampToValueAtTime(1760, now + 0.03);

        formantFilter.type = 'bandpass';
        formantFilter.frequency.setValueAtTime(950, now);
        formantFilter.Q.setValueAtTime(3.2, now);

        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.24, now + 0.015);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(formantFilter);
        osc2.connect(formantFilter);
        formantFilter.connect(voiceGain);
        voiceGain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      } else if (this.cluckVariant === 1) {
        // Double "Bok-bawk!"
        const part1 = 0.06;
        const part2 = 0.11;

        // Part 1: "Bok"
        osc1.frequency.setValueAtTime(580, now);
        osc1.frequency.exponentialRampToValueAtTime(920, now + 0.02);
        osc1.frequency.exponentialRampToValueAtTime(680, now + part1);

        // Part 2: "-bawk!"
        osc1.frequency.setValueAtTime(620, now + part1 + 0.02);
        osc1.frequency.linearRampToValueAtTime(1150, now + part1 + 0.06);
        osc1.frequency.exponentialRampToValueAtTime(740, now + part1 + part2);

        osc2.frequency.setValueAtTime(1160, now);
        osc2.frequency.exponentialRampToValueAtTime(1840, now + 0.02);

        formantFilter.type = 'bandpass';
        formantFilter.frequency.setValueAtTime(1100, now);
        formantFilter.Q.setValueAtTime(2.8, now);

        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.2, now + 0.01);
        voiceGain.gain.exponentialRampToValueAtTime(0.02, now + part1);
        voiceGain.gain.linearRampToValueAtTime(0.26, now + part1 + 0.03);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, now + part1 + part2);

        osc1.connect(formantFilter);
        osc2.connect(formantFilter);
        formantFilter.connect(voiceGain);
        voiceGain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + part1 + part2);
        osc2.stop(now + part1 + part2);
      } else {
        // High-pitched "Gı-dak!"
        const duration = 0.12;
        osc1.frequency.setValueAtTime(480, now);
        osc1.frequency.exponentialRampToValueAtTime(1250, now + 0.04);
        osc1.frequency.exponentialRampToValueAtTime(680, now + duration);

        osc2.frequency.setValueAtTime(960, now);
        osc2.frequency.exponentialRampToValueAtTime(2500, now + 0.04);

        formantFilter.type = 'bandpass';
        formantFilter.frequency.setValueAtTime(1200, now);
        formantFilter.Q.setValueAtTime(3.5, now);

        voiceGain.gain.setValueAtTime(0.001, now);
        voiceGain.gain.linearRampToValueAtTime(0.25, now + 0.02);
        voiceGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        osc1.connect(formantFilter);
        osc2.connect(formantFilter);
        formantFilter.connect(voiceGain);
        voiceGain.connect(this.ctx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + duration);
        osc2.stop(now + duration);
      }
    } catch {}
  }

  /**
   * Cheerful farm bell / chime on passing a gate
   */
  public playPoint(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.setValueAtTime(1318.51, now + 0.04); // E6

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {}
  }

  /**
   * Crisp golden wheat grain pickup sound
   */
  public playGrainPickup(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [1046.5, 1318.51, 1567.98].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.025);

        gain.gain.setValueAtTime(0.16, now + idx * 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + idx * 0.025);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.025);
        osc.stop(now + 0.18 + idx * 0.025);
      });
    } catch {}
  }

  /**
   * Comical cartoon chicken hit / squawk + hay thud
   */
  public playHit(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Surprised chicken squawk
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.linearRampToValueAtTime(400, now + 0.2);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.Q.setValueAtTime(3.0, now);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);

      // 2. Soft ground/fence thud
      const thud = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();

      thud.type = 'triangle';
      thud.frequency.setValueAtTime(160, now);
      thud.frequency.exponentialRampToValueAtTime(50, now + 0.12);

      thudGain.gain.setValueAtTime(0.25, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      thud.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thud.start(now);
      thud.stop(now + 0.14);
    } catch {}
  }

  /**
   * Joyous Golden Wheat Victory Fanfare!
   * (Clucky happily feasts on golden wheat with rapid celebration clucks & fanfare!)
   */
  public playWheatVictory(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Triumphant Harvest Folk Arpeggio (C5 -> E5 -> G5 -> C6)
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.1;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.24, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.5);
      });

      // 2. Excited victory cluck sequence: "Bawk! Bok-bok-bok-GAAAWK!"
      const cluckTimes = [0.15, 0.28, 0.4, 0.52, 0.68];
      cluckTimes.forEach((delay, idx) => {
        const cTime = now + delay;
        const osc = this.ctx!.createOscillator();
        const filter = this.ctx!.createBiquadFilter();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        const startFreq = idx === 4 ? 600 : 540 + idx * 40;
        const peakFreq = idx === 4 ? 1350 : 900 + idx * 60;

        osc.frequency.setValueAtTime(startFreq, cTime);
        osc.frequency.linearRampToValueAtTime(peakFreq, cTime + 0.03);
        osc.frequency.exponentialRampToValueAtTime(startFreq, cTime + 0.1);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1100, cTime);
        filter.Q.setValueAtTime(3.2, cTime);

        gain.gain.setValueAtTime(0.22, cTime);
        gain.gain.exponentialRampToValueAtTime(0.001, cTime + (idx === 4 ? 0.22 : 0.1));

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(cTime);
        osc.stop(cTime + (idx === 4 ? 0.24 : 0.11));
      });
    } catch {}
  }
}

export const flappySoundManager = new FlappyChickenSoundManager();

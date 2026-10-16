import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

class CatSoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private noiseBuffer: AudioBuffer | null = null;

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
    this.ctx = getSharedAudioContext();
    if (this.ctx && !this.noiseBuffer) {
      this.noiseBuffer = this.generatePinkNoiseBuffer(this.ctx);
    }
  }

  private generatePinkNoiseBuffer(ctx: AudioContext, duration = 0.5): AudioBuffer {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.08;
      b6 = white * 0.115926;
    }
    return buffer;
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
   * Organic tactile tap: Soft cat paw tap
   */
  public playTap(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(540, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.05);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.055);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.055);
    } catch {}
  }

  /**
   * Gentle whispering paw scuff
   */
  public playSlide(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const filter = this.ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(1400, now);
        filter.Q.setValueAtTime(2.2, now);

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.09, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.16);
      }
    } catch {}
  }

  /**
   * Procedural Meow: Cute expressive kitten meow with pitch bend and formant filtering
   */
  public playMeow(variant: 'cheerful' | 'soft' | 'curious' = 'cheerful'): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Primary vocal cord oscillator
      const osc = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const formantFilter = this.ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc2.type = 'sine';

      formantFilter.type = 'bandpass';
      formantFilter.Q.setValueAtTime(4.0, now);

      let duration = 0.32;
      if (variant === 'cheerful') {
        // "Mee-ooow" glide: starts around 650Hz, swells to 820Hz, drops to 520Hz
        osc.frequency.setValueAtTime(620, now);
        osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(480, now + 0.32);

        osc2.frequency.setValueAtTime(1240, now);
        osc2.frequency.exponentialRampToValueAtTime(1680, now + 0.12);
        osc2.frequency.exponentialRampToValueAtTime(960, now + 0.32);

        formantFilter.frequency.setValueAtTime(1200, now);
        formantFilter.frequency.linearRampToValueAtTime(1900, now + 0.12);
        formantFilter.frequency.linearRampToValueAtTime(900, now + 0.32);

        duration = 0.34;
      } else if (variant === 'curious') {
        // Question chirrup: rising pitch
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(920, now + 0.22);

        osc2.frequency.setValueAtTime(1160, now);
        osc2.frequency.exponentialRampToValueAtTime(1840, now + 0.22);

        formantFilter.frequency.setValueAtTime(1300, now);
        formantFilter.frequency.linearRampToValueAtTime(2200, now + 0.22);

        duration = 0.24;
      } else {
        // Soft purry meow
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.1);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.28);

        formantFilter.frequency.setValueAtTime(1100, now);

        duration = 0.3;
      }

      // Smooth amplitude envelope
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.setValueAtTime(0.20, now + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(formantFilter);
      osc2.connect(formantFilter);
      formantFilter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc2.start(now);
      osc.stop(now + duration);
      osc2.stop(now + duration);
    } catch {}
  }

  /**
   * Cat purr: Warm vibrating tremolo
   */
  public playPurr(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const tremolo = this.ctx.createOscillator();
      const tremoloGain = this.ctx.createGain();
      const mainGain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(85, now);

      tremolo.type = 'sine';
      tremolo.frequency.setValueAtTime(24, now); // ~24 Hz purr rumble

      tremoloGain.gain.setValueAtTime(0.08, now);
      tremolo.connect(tremoloGain);

      mainGain.gain.setValueAtTime(0.001, now);
      mainGain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      mainGain.gain.setValueAtTime(0.18, now + 0.45);
      mainGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

      tremoloGain.connect(mainGain.gain);
      osc.connect(mainGain);
      mainGain.connect(this.ctx.destination);

      tremolo.start(now);
      osc.start(now);
      tremolo.stop(now + 0.6);
      osc.stop(now + 0.6);
    } catch {}
  }

  /**
   * Blocked / Irritated "mrrp" sound when bumping an obstacle
   */
  public playBlocked(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(500, now);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {}
  }

  /**
   * Cat flap exit whoosh
   */
  public playGateWhoosh(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.28);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.18, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Victory Fanfare: Jubilant ascending bells & celebratory kitty purr
   */
  public playVictory(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5, E5, G5, C6, E6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.08;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.18, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });

      // Play joyful celebratory meow after chimes
      setTimeout(() => {
        this.playMeow('cheerful');
      }, 420);
    } catch {}
  }

  /**
   * Twinkling Star Pop Chime
   */
  public playStarPop(index: number): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const freqs = [784, 988, 1318]; // G5, B5, E6
      const freq = freqs[Math.min(index - 1, 2)] || 880;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.4);
    } catch {}
  }
}

export const catSoundManager = new CatSoundManager();

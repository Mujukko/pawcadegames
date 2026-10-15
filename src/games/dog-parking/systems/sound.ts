class SoundManager {
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
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.noiseBuffer = this.generatePinkNoiseBuffer(this.ctx);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  /**
   * Generates a reusable pink noise buffer for realistic breath, aspiration & tactile textures.
   */
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
   * Organic tactile tap: Warm woodblock / bubble pop
   */
  public playTap(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Resonant body
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(680, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.055);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /**
   * Smooth tactile wooden slide / paw scuff
   */
  public playSlide(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Tone glide
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(310, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);

      // Subtle tactile friction scuff
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;
        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(800, now);
        noiseFilter.Q.setValueAtTime(2.0, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(0.04, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);
        noise.stop(now + 0.08);
      }
    } catch {}
  }

  /**
   * Rubbery cartoon bounce thud
   */
  public playBump(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160, now);
      osc.frequency.exponentialRampToValueAtTime(75, now + 0.1);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch {}
  }

  /**
   * Natural, organic puppy bark with vocal tract formant resonance & breath aspiration.
   */
  public playBark(pitchMultiplier = 1.0, volume = 0.22): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Voiced vocal cords (warm harmonic blend)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const voiceGain = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';

      const baseFreq = 380 * pitchMultiplier;
      const peakFreq = 520 * pitchMultiplier;
      const endFreq = 260 * pitchMultiplier;

      // Realistic pitch envelope: quick rise then natural dip
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.linearRampToValueAtTime(peakFreq, now + 0.035);
      osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.14);

      osc2.frequency.setValueAtTime(baseFreq * 1.5, now);
      osc2.frequency.linearRampToValueAtTime(peakFreq * 1.45, now + 0.035);
      osc2.frequency.exponentialRampToValueAtTime(endFreq * 1.4, now + 0.14);

      // Formant filter 1: Vocal tract throat resonance (warm "woof")
      const formant1 = this.ctx.createBiquadFilter();
      formant1.type = 'bandpass';
      formant1.frequency.setValueAtTime(750 * pitchMultiplier, now);
      formant1.Q.setValueAtTime(3.5, now);

      // Formant filter 2: Mouth shape resonance
      const formant2 = this.ctx.createBiquadFilter();
      formant2.type = 'bandpass';
      formant2.frequency.setValueAtTime(1750 * pitchMultiplier, now);
      formant2.Q.setValueAtTime(4.0, now);

      voiceGain.gain.setValueAtTime(0.001, now);
      voiceGain.gain.linearRampToValueAtTime(volume, now + 0.025);
      voiceGain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc1.connect(formant1);
      osc2.connect(formant2);
      formant1.connect(voiceGain);
      formant2.connect(voiceGain);
      voiceGain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.14);
      osc2.stop(now + 0.14);

      // 2. Breath / throat aspiration noise burst (gives organic realism)
      if (this.noiseBuffer) {
        const noise = this.ctx.createBufferSource();
        noise.buffer = this.noiseBuffer;

        const noiseFilter = this.ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(1100 * pitchMultiplier, now);
        noiseFilter.Q.setValueAtTime(2.2, now);

        const noiseGain = this.ctx.createGain();
        noiseGain.gain.setValueAtTime(volume * 0.35, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);

        noise.start(now);
        noise.stop(now + 0.09);
      }
    } catch {}
  }

  /**
   * Joyful excited puppy celebration: Playful double yip-woof!
   */
  public playHappyBark(): void {
    if (this.muted) return;
    // First high playful yip
    this.playBark(1.35, 0.22);
    // Second energetic celebratory bark
    setTimeout(() => {
      this.playBark(1.05, 0.25);
    }, 130);
  }

  /**
   * Adorable puppy whimper/chirp of happiness & tail wag
   */
  public playJoyfulWhine(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();

      // Gentle joyful vibrato
      lfo.frequency.setValueAtTime(7.5, now);
      lfoGain.gain.setValueAtTime(18, now);
      lfo.connect(osc.frequency);

      osc.type = 'sine';
      // Joyful rising inflection
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.linearRampToValueAtTime(1020, now + 0.11);
      osc.frequency.exponentialRampToValueAtTime(820, now + 0.24);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      lfo.start(now);
      osc.start(now);
      lfo.stop(now + 0.24);
      osc.stop(now + 0.24);
    } catch {}
  }

  /**
   * Sparkling music-box star pop when stars pop in on victory
   */
  public playStarPop(starIndex: number = 1): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // C6, E6, G6 (higher and brighter for each consecutive star)
      const freqs = [1046.5, 1318.5, 1567.98];
      const freq = freqs[Math.max(0, Math.min(2, starIndex - 1))] || 1046.5;

      // Bell fundamental
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // Shimmering bell overtone (2.76x)
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.76, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.35);
      osc2.stop(now + 0.35);
    } catch {}
  }

  /**
   * Grand Level Victory Celebration:
   * Sparkling chime fanfare + joyous star sparkles + excited happy puppy barks & whimpers!
   */
  public playWin(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      // 1. Sparkling Glockenspiel arpeggio: C5 -> E5 -> G5 -> B5 -> C6 -> E6
      const notes = [523.25, 659.25, 783.99, 987.77, 1046.5, 1318.5];
      const baseTime = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        const time = baseTime + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const overtone = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);

        // Gentle sparkle overtone
        overtone.type = 'triangle';
        overtone.frequency.setValueAtTime(freq * 2.0, time);

        gain.gain.setValueAtTime(0.16, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.28);

        osc.connect(gain);
        overtone.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(time);
        overtone.start(time);
        osc.stop(time + 0.28);
        overtone.stop(time + 0.28);
      });

      // 2. Excited happy puppy celebration (happy barks & joyful whimpers!)
      setTimeout(() => {
        this.playHappyBark();
      }, 420);

      setTimeout(() => {
        this.playJoyfulWhine();
      }, 740);

      setTimeout(() => {
        this.playBark(1.2, 0.2);
      }, 1020);
    } catch {}
  }
}

export const soundManager = new SoundManager();

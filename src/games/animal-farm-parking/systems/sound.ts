import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

class FarmSoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastTrotTime: number = 0;

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
   * Procedural Cow Moo: Deep resonant dual formant synth
   */
  public playMoo(variant: 'happy' | 'hurt' | 'alert' = 'happy'): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      filter.type = 'bandpass';
      filter.Q.setValueAtTime(3.5, now);

      let duration = 0.55;
      if (variant === 'happy') {
        // Classic "Moooo"
        osc1.frequency.setValueAtTime(165, now);
        osc1.frequency.exponentialRampToValueAtTime(195, now + 0.18);
        osc1.frequency.exponentialRampToValueAtTime(130, now + 0.55);

        osc2.frequency.setValueAtTime(330, now);
        osc2.frequency.exponentialRampToValueAtTime(390, now + 0.18);
        osc2.frequency.exponentialRampToValueAtTime(260, now + 0.55);

        filter.frequency.setValueAtTime(550, now);
        filter.frequency.linearRampToValueAtTime(750, now + 0.2);
        filter.frequency.linearRampToValueAtTime(450, now + 0.55);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.24, now + 0.08);
        gain.gain.setValueAtTime(0.22, now + 0.35);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        duration = 0.55;
      } else if (variant === 'hurt') {
        // Sharp startled moo
        osc1.frequency.setValueAtTime(240, now);
        osc1.frequency.exponentialRampToValueAtTime(140, now + 0.25);

        osc2.frequency.setValueAtTime(480, now);
        osc2.frequency.exponentialRampToValueAtTime(280, now + 0.25);

        filter.frequency.setValueAtTime(800, now);
        filter.frequency.linearRampToValueAtTime(400, now + 0.25);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.28, now + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.26);
        duration = 0.26;
      } else {
        // Low greeting grunt
        osc1.frequency.setValueAtTime(140, now);
        osc1.frequency.exponentialRampToValueAtTime(110, now + 0.35);

        osc2.frequency.setValueAtTime(280, now);
        osc2.frequency.exponentialRampToValueAtTime(220, now + 0.35);

        filter.frequency.setValueAtTime(450, now);

        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        duration = 0.35;
      }

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch {}
  }

  /**
   * Hoof trot step sound
   */
  public playHoofTrot(): void {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastTrotTime < 240) return; // Throttle trot sound
    this.lastTrotTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.04);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.045);
    } catch {}
  }

  /**
   * Collision thud sound
   */
  public playBump(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.12);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(320, now);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.14);
    } catch {}
  }

  /**
   * Cowbell chime
   */
  public playCowbell(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(820, now);
      filter.Q.setValueAtTime(8.0, now);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Milk Bottle Pickup Chime: Sparkling glass clink + sweet harmonic arpeggio (D5 -> A5 -> D6)
   */
  public playMilkCollect(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const freqs = [587.33, 880, 1174.66];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.055;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.35);
      });
    } catch {}
  }

  /**
   * Level Complete Victory Fanfare: Jubilant barnyard chime + happy cow moo
   */
  public playParkSuccess(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;

      const notes = [392, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const noteTime = now + idx * 0.09;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.45);
      });

      // Play joyful celebratory moo after fanfare
      setTimeout(() => {
        this.playMoo('happy');
        this.playCowbell();
      }, 450);
    } catch {}
  }

  public playStarPop(index: number): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const freqs = [659, 880, 1174];
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

  /**
   * Procedural Sheep Bleat: Warbling farm "Baaa-aa-ah"
   */
  public playSheepBaa(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const vibrato = this.ctx.createOscillator();
      const vibratoGain = this.ctx.createGain();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Sheep bleat fundamental frequency with wavering flutter
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(290, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.45);

      vibrato.frequency.setValueAtTime(14, now); // 14 Hz flutter
      vibratoGain.gain.setValueAtTime(18, now);
      vibrato.connect(osc.frequency);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(850, now);
      filter.frequency.linearRampToValueAtTime(620, now + 0.45);
      filter.Q.setValueAtTime(2.8, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05);
      gain.gain.setValueAtTime(0.20, now + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      vibrato.start(now);
      osc.start(now);
      vibrato.stop(now + 0.45);
      osc.stop(now + 0.45);
    } catch {}
  }
}

export const farmSoundManager = new FarmSoundManager();

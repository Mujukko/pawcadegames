/**
 * Sheep Cart Jam: Meadow Escape — Procedural Web Audio Sound Synthesizer
 * Zero external audio assets, zero network latency, 100% offline synthesis.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    try {
      this.isMuted = localStorage.getItem('pawcade_sound_muted') === 'true';
    } catch {
      this.isMuted = false;
    }
  }

  private initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    try {
      localStorage.setItem('pawcade_sound_muted', String(this.isMuted));
    } catch {
      // Ignore storage write issues
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Cute procedural Sheep "Baa-a-a!"
   * Dual formant frequencies around 700Hz and 1100Hz with subtle pitch tremor.
   */
  public playSheepBaa() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Base pitch around 320Hz with slight dip
    osc1.frequency.setValueAtTime(340, t);
    osc1.frequency.linearRampToValueAtTime(310, t + 0.15);
    osc1.frequency.linearRampToValueAtTime(290, t + 0.3);

    osc2.frequency.setValueAtTime(345, t);
    osc2.frequency.linearRampToValueAtTime(315, t + 0.15);
    osc2.frequency.linearRampToValueAtTime(295, t + 0.3);

    // Filter to shape sheep vocal formant
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(850, t);
    filter.Q.setValueAtTime(3, t);

    gainNode.gain.setValueAtTime(0.01, t);
    gainNode.gain.linearRampToValueAtTime(0.2, t + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.36);
    osc2.stop(t + 0.36);
  }

  /**
   * Cart driving to dock: Tractor engine rev + smooth slide
   */
  public playCartDrive() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(180, t + 0.3);

    gainNode.gain.setValueAtTime(0.01, t);
    gainNode.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.32);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.33);
  }

  /**
   * Blocked Cart Error Thud
   */
  public playBlockedCart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(110, t);
    osc.frequency.linearRampToValueAtTime(70, t + 0.15);

    gainNode.gain.setValueAtTime(0.15, t);
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gainNode);
    gainNode.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.19);
  }

  /**
   * Cart departure to meadow: Friendly "Toot-Toot!" honk & celebration chime
   */
  public playCartDepart() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    [0, 0.12].forEach((offset, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(idx === 0 ? 440 : 554, t + offset); // A4, C#5

      gain.gain.setValueAtTime(0.01, t + offset);
      gain.gain.linearRampToValueAtTime(0.16, t + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + offset + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + offset);
      osc.stop(t + offset + 0.15);
    });
  }

  /**
   * Victory Fanfare
   */
  public playVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.1);

      gain.gain.setValueAtTime(0.01, t + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.1 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);

      osc.start(t + idx * 0.1);
      osc.stop(t + idx * 0.1 + 0.36);
    });
  }
}

export const sound = new SoundSystem();

/**
 * Web Audio procedural sound synthesizer for Farm Mini Mart.
 * Engineered with warm, cozy low-mid acoustic frequencies, soft fade-in envelopes
 * (zero click/pop artifacts), and strict per-effect throttling so rapid coin deposits
 * or unlocks never buzz or clip.
 */

class FarmMartSoundSystem {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private lastDepositTime: number = 0;
  private depositStep: number = 0;
  private lastHarvestTime: number = 0;
  private lastStockTime: number = 0;
  private lastPickupTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('pawcade_sound_muted');
      this.isMuted = stored === 'true';
    }
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
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

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Crop harvest soft wooden pop sound
   */
  public playHarvestSound() {
    if (this.isMuted) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastHarvestTime < 75) return;
    this.lastHarvestTime = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(480, now + 0.075);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.07, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.095);
  }

  /**
   * Shelf stocking warm wooden tap
   */
  public playStockSound() {
    if (this.isMuted) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastStockTime < 75) return;
    this.lastStockTime = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(135, now + 0.065);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.075, now + 0.008);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.075);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Soft, throttled marimba-like wooden tick when depositing coins into an unlock pad.
   * Throttled to once every 105ms so 60 FPS coin drainage sounds like gentle tactile drops
   * instead of a continuous high-frequency buzz.
   */
  public playCoinDepositSound() {
    if (this.isMuted) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastDepositTime > 450) {
      this.depositStep = 0;
    }
    if (nowMs - this.lastDepositTime < 105) return;
    this.lastDepositTime = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    // Gentle pentatonic marimba notes in warm low-mid octave (C4 to A4)
    const scale = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
    const baseFreq = scale[this.depositStep % scale.length]!;
    this.depositStep++;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.06, now + 0.055);

    // Ultra-soft envelope with smooth 10ms fade-in to prevent any click/buzz
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.038, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.065);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  }

  /**
   * Station unlocked: warm, soft acoustic marimba chord (C4 - E4 - G4 - C5).
   * Low-mid frequencies and gentle volume so unlocking feels cozy and rewarding, never shrill.
   */
  public playUnlockSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    this.depositStep = 0;
    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.0, 523.25]; // Warm C4 major arpeggio (one full octave lower)

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.075;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.0001, startTime);
      gain.gain.linearRampToValueAtTime(0.055, startTime + 0.018);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.29);
    });
  }

  /**
   * Register checkout chime: soft, warm shopkeeper bell
   */
  public playKachingSound() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // First note (warm E5)
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.linearRampToValueAtTime(0.065, now + 0.012);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
    osc1.connect(gain1);
    gain1.connect(this.ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.17);

    // Second note (warm A5)
    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.0, now + 0.075);
    gain2.gain.setValueAtTime(0.0001, now + 0.075);
    gain2.gain.linearRampToValueAtTime(0.075, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
    osc2.connect(gain2);
    gain2.connect(this.ctx.destination);
    osc2.start(now + 0.075);
    osc2.stop(now + 0.35);
  }

  /**
   * Coin pickup soft chime
   */
  public playCoinPickupSound() {
    if (this.isMuted) return;
    const nowMs = typeof performance !== 'undefined' ? performance.now() : Date.now();
    if (nowMs - this.lastPickupTime < 80) return;
    this.lastPickupTime = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, now); // D5
    osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.055); // G5

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.065, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.14);
  }
}

export const farmMartAudio = new FarmMartSoundSystem();

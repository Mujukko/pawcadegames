import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';

class TetrisSoundManager {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;
  private lastMoveSoundTime = 0;

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
   * Procedural Voice Formant Synth: Cheerful cartoon farmer "WOOOW!"
   */
  public playWow(variant: 'single' | 'double' | 'triple' | 'super' = 'single'): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Base pitch adjusted by intensity
      const baseFreq = variant === 'super' ? 340 : variant === 'triple' ? 310 : 270;
      const duration = variant === 'super' ? 0.65 : 0.48;

      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'triangle';

      // Vocal pitch sweep: "W-o-o-o-w!"
      osc1.frequency.setValueAtTime(baseFreq * 0.85, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.35, now + duration * 0.45);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.05, now + duration);

      osc2.frequency.setValueAtTime(baseFreq * 1.7, now);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.7, now + duration * 0.45);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.1, now + duration);

      // Vocal Formant Bandpass sweep for vowel "O-W"
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(4.2, now);
      filter.frequency.setValueAtTime(450, now); // /w/
      filter.frequency.linearRampToValueAtTime(950, now + duration * 0.45); // /o/
      filter.frequency.linearRampToValueAtTime(600, now + duration); // /w/

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.32, now + 0.05);
      gain.gain.setValueAtTime(0.28, now + duration * 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);

      // Add cheerful chime harmonic on multi-line clears
      if (variant === 'super' || variant === 'triple') {
        const chime = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chime.type = 'sine';
        chime.frequency.setValueAtTime(880, now + 0.1);
        chime.frequency.exponentialRampToValueAtTime(1760, now + 0.4);
        chimeGain.gain.setValueAtTime(0.18, now + 0.1);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        chime.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);
        chime.start(now + 0.1);
        chime.stop(now + 0.55);
      }
    } catch {}
  }

  /**
   * Banjo / Folk Guitar line clear arpeggio
   */
  public playLineClear(lines: number): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const scales = [
        [523.25, 659.25], // 1 line: C5, E5
        [523.25, 659.25, 783.99], // 2 lines: C5, E5, G5
        [523.25, 659.25, 783.99, 1046.5], // 3 lines: C5, E5, G5, C6
        [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98], // 4 lines (TETRIS): Full arpeggio!
      ];

      const notes = scales[Math.min(lines - 1, 3)] || scales[0]!;
      notes.forEach((freq, idx) => {
        const noteTime = now + idx * 0.07;
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.24, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.32);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.32);
      });
    } catch {}
  }

  /**
   * Silo filling golden grain sound
   */
  public playSiloFill(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(680, now + 0.22);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch {}
  }

  /**
   * Silo 100% full complete celebration bell
   */
  public playSiloComplete(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      // Farm bell dual tone
      [880, 1174.66, 1760].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0.28, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8 + i * 0.08);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + 0.85 + i * 0.08);
      });
    } catch {}
  }

  /**
   * Subtle wooden block tap sound for movement
   */
  public playMove(): void {
    if (this.muted) return;
    const nowMs = performance.now();
    if (nowMs - this.lastMoveSoundTime < 65) return;
    this.lastMoveSoundTime = nowMs;

    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.025);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.03);
    } catch {}
  }

  /**
   * Rustic wooden crate rotation swoosh
   */
  public playRotate(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(540, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {}
  }

  /**
   * Heavy hay bundle landing thud (hard drop)
   */
  public playHardDrop(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  /**
   * Hold piece swap chime
   */
  public playHold(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, now);
      osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);

      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.1);
    } catch {}
  }

  /**
   * Melancholic farm harmonica / low chord on game over
   */
  public playGameOver(): void {
    if (this.muted) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;

      [392, 349.23, 311.13, 261.63].forEach((freq, idx) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.16);

        gain.gain.setValueAtTime(0.18, now + idx * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6 + idx * 0.16);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + idx * 0.16);
        osc.stop(now + 0.65 + idx * 0.16);
      });
    } catch {}
  }
}

export const tetrisSoundManager = new TetrisSoundManager();

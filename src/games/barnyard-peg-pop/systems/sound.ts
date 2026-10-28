import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';
import { PegType } from '../logic/types';

// Pentatonic musical scale for consecutive peg hits (C5 to E7)
const PEG_SCALE = [
  523.25, 587.33, 659.25, 783.99, 880.0, // C5, D5, E5, G5, A5
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0, // C6, D6, E6, G6, A6
  2093.0, 2349.32, 2637.02, // C7, D7, E7
];

class PegPopAudio {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      this.ctx = getSharedAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Pneumatic cork pop cannon fire
  public playCannonFire() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }

  // Melodic rising chime for peg hits
  public playPegHit(pegType: PegType, comboCount: number) {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const scaleIndex = Math.min(PEG_SCALE.length - 1, Math.max(0, comboCount - 1));
      let freq = PEG_SCALE[scaleIndex]!;

      if (pegType === 'purple') freq *= 1.25; // Higher sparkle
      if (pegType === 'green') freq *= 1.5; // Magic shimmer

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = pegType === 'orange' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Audio fallback
    }
  }

  // Wooden basket catch + ding
  public playBasketCatch() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Wooden clunk
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.exponentialRampToValueAtTime(90, now + 0.1);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.13);

      // Golden chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.05); // E6
      gain2.gain.setValueAtTime(0.25, now + 0.05);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.05);
      osc2.stop(now + 0.38);
    } catch {
      // Audio fallback
    }
  }

  // Ode to Joy extreme fever celebration
  public playFeverFanfare() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      // Opening notes of Beethoven's Ode to Joy (E4, E4, F4, G4, G4, F4, E4, D4)
      const notes = [
        { f: 659.25, d: 0.18 }, // E5
        { f: 659.25, d: 0.18 }, // E5
        { f: 698.46, d: 0.18 }, // F5
        { f: 783.99, d: 0.28 }, // G5
        { f: 783.99, d: 0.18 }, // G5
        { f: 698.46, d: 0.18 }, // F5
        { f: 659.25, d: 0.18 }, // E5
        { f: 587.33, d: 0.35 }, // D5
      ];

      let elapsed = 0;
      notes.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + elapsed);

        gain.gain.setValueAtTime(0.22, now + elapsed);
        gain.gain.exponentialRampToValueAtTime(0.001, now + elapsed + n.d);

        osc.connect(gain);
        gain.connect(this.ctx!.destination);

        osc.start(now + elapsed);
        osc.stop(now + elapsed + n.d + 0.02);
        elapsed += n.d;
      });
    } catch {
      // Audio fallback
    }
  }

  // Ball lost below screen
  public playBallLost() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.22);

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Audio fallback
    }
  }
}

export const pegPopAudio = new PegPopAudio();

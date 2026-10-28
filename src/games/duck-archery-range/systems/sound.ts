import { getSharedAudioContext } from '../../../lib/audio/webAudioUnlocker';
import { TargetRingType } from '../logic/types';

class DuckArcheryAudio {
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

  // Bowstring tension creak
  public playBowDraw() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(120, now);
      osc.frequency.linearRampToValueAtTime(180, now + 0.1);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
    } catch {
      // Audio fallback
    }
  }

  // Crisp string snap & release "TWANG"
  public playBowTwang() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(95, now + 0.14);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch {
      // Audio fallback
    }
  }

  // Target impact thud & bullseye chime
  public playTargetHit(ring: TargetRingType = 'red') {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;

      // Heavy wooden thud
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(160, now);
      thudOsc.frequency.exponentialRampToValueAtTime(45, now + 0.08);

      thudGain.gain.setValueAtTime(0.32, now);
      thudGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      thudOsc.connect(thudGain);
      thudGain.connect(this.ctx.destination);

      thudOsc.start(now);
      thudOsc.stop(now + 0.11);

      // Bullseye golden chime
      if (ring === 'bullseye') {
        const chimeOsc = this.ctx.createOscillator();
        const chimeGain = this.ctx.createGain();
        chimeOsc.type = 'sine';
        chimeOsc.frequency.setValueAtTime(1318.51, now + 0.03); // E6
        chimeOsc.frequency.setValueAtTime(1760.0, now + 0.12); // A6

        chimeGain.gain.setValueAtTime(0.28, now + 0.03);
        chimeGain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        chimeOsc.connect(chimeGain);
        chimeGain.connect(this.ctx.destination);

        chimeOsc.start(now + 0.03);
        chimeOsc.stop(now + 0.42);
      }
    } catch {
      // Audio fallback
    }
  }

  // Juicy apple splatter
  public playAppleSplatter() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(650, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Audio fallback
    }
  }

  // Golden bell ring & +1 arrow ding
  public playBellRing() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(2093.0, now); // C7
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.48);
    } catch {
      // Audio fallback
    }
  }

  // Missed arrow whoosh
  public playMiss() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(90, now + 0.18);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // Audio fallback
    }
  }

  // Triumphal stage clear fanfare
  public playStageVictory() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 523.25, d: 0.12 }, // C5
        { f: 659.25, d: 0.12 }, // E5
        { f: 783.99, d: 0.14 }, // G5
        { f: 1046.5, d: 0.35 }, // C6
      ];

      let elapsed = 0;
      notes.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + elapsed);

        gain.gain.setValueAtTime(0.24, now + elapsed);
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

  // Descending gentle game over chime
  public playGameOver() {
    if (this.isMuted) return;
    this.initCtx();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [
        { f: 440.0, d: 0.15 }, // A4
        { f: 392.0, d: 0.15 }, // G4
        { f: 349.23, d: 0.25 }, // F4
        { f: 293.66, d: 0.35 }, // D4
      ];

      let elapsed = 0;
      notes.forEach((n) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, now + elapsed);

        gain.gain.setValueAtTime(0.2, now + elapsed);
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
}

export const duckArcheryAudio = new DuckArcheryAudio();

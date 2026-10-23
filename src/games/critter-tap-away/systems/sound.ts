/**
 * Critter Tap Away: Procedural Web Audio Sound Synthesizer
 * 100% native Web Audio API — zero asset downloads, zero latency.
 */

import { CritterType } from '../logic/engine';

class CritterSoundSystem {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  constructor() {}

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    return this.muted;
  }

  public playCritterEscape(type: CritterType) {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Fast whoosh whoop (upwards pitch slide)
    const whoosh = this.ctx.createOscillator();
    const whooshGain = this.ctx.createGain();

    whoosh.type = 'triangle';
    whoosh.frequency.setValueAtTime(300, now);
    whoosh.frequency.exponentialRampToValueAtTime(1200, now + 0.15);

    whooshGain.gain.setValueAtTime(0.2, now);
    whooshGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    whoosh.connect(whooshGain);
    whooshGain.connect(this.ctx.destination);

    whoosh.start(now);
    whoosh.stop(now + 0.18);

    // Mini cute vocal chime per animal
    const vocal = this.ctx.createOscillator();
    const vocalGain = this.ctx.createGain();

    const freqMap: Record<CritterType, number> = {
      cow: 220,     // Deep low moo note
      pig: 440,     // Cheerful oink
      sheep: 587.3, // Bright baa note
      bunny: 880,   // High hop squeak
      chick: 1046.5 // Peep chirp
    };

    vocal.type = type === 'cow' ? 'sawtooth' : 'sine';
    vocal.frequency.setValueAtTime(freqMap[type] || 500, now + 0.05);
    vocal.frequency.linearRampToValueAtTime((freqMap[type] || 500) * 1.2, now + 0.14);

    vocalGain.gain.setValueAtTime(0.18, now + 0.05);
    vocalGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    vocal.connect(vocalGain);
    vocalGain.connect(this.ctx.destination);

    vocal.start(now + 0.05);
    vocal.stop(now + 0.2);
  }

  public playCritterBlocked() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  public playVictory() {
    if (this.muted) return;
    this.initContext();
    if (!this.ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.08;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.25, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.35);
    });
  }
}

export const sound = new CritterSoundSystem();

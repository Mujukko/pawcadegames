import { AnimalSpecies } from '../logic/types';

class SoundSynthesizer {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Check localStorage for global sound state
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('pawcade_sound_muted');
      this.isMuted = storedMute === 'true';
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('pawcade_sound_muted', String(muted));
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  /**
   * Cheerful cute tap sound varying slightly in pitch and tailored to each animal
   */
  public playTap(species: AnimalSpecies = 'corgi'): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Small random micro-pitch variation (+- 5%)
      const pitchJitter = 1 + (Math.random() - 0.5) * 0.1;

      switch (species) {
        case 'corgi': // Cheerful dog yap pop
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(480 * pitchJitter, now);
          osc.frequency.exponentialRampToValueAtTime(720 * pitchJitter, now + 0.04);
          osc.frequency.exponentialRampToValueAtTime(320 * pitchJitter, now + 0.1);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          break;

        case 'capybara': // Warm chill bubble pop
          osc.type = 'sine';
          osc.frequency.setValueAtTime(260 * pitchJitter, now);
          osc.frequency.exponentialRampToValueAtTime(440 * pitchJitter, now + 0.05);
          osc.frequency.exponentialRampToValueAtTime(220 * pitchJitter, now + 0.12);
          gain.gain.setValueAtTime(0.2, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          break;

        case 'cow': // Low rich warm thud
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(175 * pitchJitter, now);
          osc.frequency.exponentialRampToValueAtTime(195 * pitchJitter, now + 0.06);
          osc.frequency.exponentialRampToValueAtTime(140 * pitchJitter, now + 0.15);
          gain.gain.setValueAtTime(0.22, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
          break;

        case 'chicken': // Cheerful hen bawk chirp
          osc.type = 'square';
          osc.frequency.setValueAtTime(560 * pitchJitter, now);
          osc.frequency.exponentialRampToValueAtTime(420 * pitchJitter, now + 0.08);
          gain.gain.setValueAtTime(0.12, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          break;

        case 'pig': // Cute double oink pop
          osc.type = 'sine';
          osc.frequency.setValueAtTime(380 * pitchJitter, now);
          osc.frequency.exponentialRampToValueAtTime(280 * pitchJitter, now + 0.05);
          osc.frequency.exponentialRampToValueAtTime(340 * pitchJitter, now + 0.09);
          osc.frequency.exponentialRampToValueAtTime(240 * pitchJitter, now + 0.14);
          gain.gain.setValueAtTime(0.18, now);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
          break;
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // AudioContext policy safe catch
    }
  }

  /**
   * Cash cha-ching sound for purchasing upgrades
   */
  public playUpgrade(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [659.25, 880]; // E5 -> A5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.15, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.18);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.2);
      });
    } catch {}
  }

  /**
   * Resonant marimba chime when unlocking a new building
   */
  public playBuildingUnlock(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const chord = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      chord.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.16, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.3);
      });
    } catch {}
  }

  /**
   * Triumphant golden fanfare when clicking the Golden Butterfly / 7x Frenzy
   */
  public playGoldenFrenzy(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const fanfare = [
        { f: 392.0, d: 0.1 },  // G4
        { f: 523.25, d: 0.1 }, // C5
        { f: 659.25, d: 0.1 }, // E5
        { f: 783.99, d: 0.35 },// G5
      ];
      let offset = 0;
      fanfare.forEach((n) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.f, now + offset);
        gain.gain.setValueAtTime(0.2, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + n.d);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + n.d + 0.05);
        offset += n.d * 0.8;
      });
    } catch {}
  }

  /**
   * Crisp hat/accessory equipping sound
   */
  public playHatEquip(): void {
    if (this.isMuted) return;
    const ctx = this.initContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(740, now);
      osc.frequency.exponentialRampToValueAtTime(1100, now + 0.05);
      gain.gain.setValueAtTime(0.14, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {}
  }
}

export const soundManager = new SoundSynthesizer();

/**
 * Global Web Audio Manager & Mobile Audio Unlocker for Pawcade Games
 *
 * Solves:
 * 1. iOS Safari silent switch muting (routes audio to 'playback' channel via navigator.audioSession).
 * 2. Mobile Web Audio autoplay policy (AudioContext starts in 'suspended' state on mobile).
 * 3. Mobile hardware context limit (shares a single singleton AudioContext across all 7 games).
 * 4. Silent 1-sample buffer playback on the very first touch/gesture to force iOS WebKit mixer awake.
 */

let sharedAudioCtx: AudioContext | null = null;
let isUnlocked = false;

/**
 * Configure audio session to bypass the physical silent switch on iOS 17+
 */
export function configureAudioSession(): void {
  if (typeof navigator !== 'undefined' && 'audioSession' in navigator) {
    try {
      (navigator as unknown as { audioSession: { type: string } }).audioSession.type = 'playback';
    } catch {}
  }
}

/**
 * Returns the singleton AudioContext instance for the entire application.
 * Reuses the same context across all games to prevent mobile hardware context exhaustion.
 */
export function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (!sharedAudioCtx) {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioCtx) {
      sharedAudioCtx = new AudioCtx();
    }
  }

  configureAudioSession();

  if (sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
    sharedAudioCtx.resume().catch(() => {});
  }

  return sharedAudioCtx;
}

/**
 * Permanently unlocks Web Audio on mobile devices (iOS Safari, Android Chrome).
 * Plays a 1-sample silent buffer during a user interaction gesture so WebKit unlocks the audio hardware.
 */
export function unlockMobileAudio(): void {
  if (typeof window === 'undefined') return;

  configureAudioSession();

  const ctx = getSharedAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  if (!isUnlocked) {
    try {
      // 1-sample silent buffer to unlock the iOS audio graph
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      isUnlocked = true;
    } catch {}
  }
}

// Auto-register touch, click and key listeners on window once this module is imported
if (typeof window !== 'undefined') {
  configureAudioSession();

  const events = ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown'];
  const onFirstInteraction = () => {
    unlockMobileAudio();
    if (isUnlocked && sharedAudioCtx?.state === 'running') {
      events.forEach((evt) => window.removeEventListener(evt, onFirstInteraction, true));
    }
  };

  events.forEach((evt) => {
    window.addEventListener(evt, onFirstInteraction, { capture: true, passive: true });
  });

  // Re-resume context if tab was hidden and becomes visible again
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && sharedAudioCtx && sharedAudioCtx.state === 'suspended') {
      sharedAudioCtx.resume().catch(() => {});
    }
  });
}

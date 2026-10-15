# DECISIONS.md — Architecture & Product Decision Log

## [2026-10-15] DEC-001: Technology Stack — TypeScript + React 18 + Phaser 3 + Vite
- **Decision:** Use TypeScript with Vite as bundler, React 18 for responsive portal shell and UI overlays, and Phaser 3 for 2D game rendering.
- **Reason:** Separates web shell (SEO, navigation, portal controls, metadata) from high-performance 60fps canvas game loop. Vite provides instant HMR and minimal production bundles.
- **Alternatives Considered:** 
  - Pure Canvas/DOM: Lacks built-in particle, tween, and sprite batching systems.
  - PixiJS: Great for rendering, but Phaser provides complete scene lifecycle, input management, and tweens out-of-the-box.
- **Consequences:** Need a strict boundary between React and Phaser so Phaser game instance is instantiated once and destroyed cleanly on unmount.
- **Reversibility:** Medium.

## [2026-10-15] DEC-002: Core Game Mechanic — Rush Hour / Parking Jam Grid Puzzle
- **Decision:** Dog vehicles have fixed length (2-tile pups, 3-tile hounds), horizontal/vertical movement axes on an N×M grid, and clear exit targets/kennels.
- **Reason:** Well-understood casual mechanic with deep spatial puzzle depth, zero language barrier, instant mobile touch/swipe and desktop mouse drag compatibility, and mathematically provable solvability.
- **Alternatives Considered:**
  - Turn-based grid walking (Sokoban): Harder to animate playfully without rich walk cycles; sliding dogs feel like "dog car" parking and fit the "Dog Parking" title directly.
- **Consequences:** Levels can be serialized cleanly as compact JSON arrays and verified with a breadth-first search (BFS) solver test.
- **Reversibility:** High.

## [2026-10-15] DEC-003: Procedural Audio via Web Audio API
- **Decision:** Synthesize sound effects (barks, woofs, slides, clicks, victory fanfare) programmatically using the Web Audio API (`AudioContext`, oscillators, gain envelopes).
- **Reason:** 0 KB asset payload, zero external asset licensing risk, 100% offline availability, instantaneous loading, no CORS or broken asset path issues.
- **Alternatives Considered:** MP3/WAV audio files. Adds network requests and asset management overhead.
- **Consequences:** Sound is crisp, immediate, and fully responsive to user mute toggle.
- **Reversibility:** High.

## [2026-10-15] DEC-004: Package Manager & Runtime — Bun
- **Decision:** Use Bun 1.4 for package management and local script execution.
- **Reason:** Already installed and permitted in local environment, runs tests (`bun test`) at lightning speed, produces exact standard npm lockfiles.
- **Reversibility:** High (standard package.json compatible with npm/pnpm/yarn).

## [2026-10-15] DEC-005: Code-Splitting Portal from Game Engine
- **Decision:** Isolate the Phaser 3 engine into a separate dynamic chunk (`vendor_phaser`) loaded on-demand via `React.lazy` when the user enters a game page.
- **Reason:** Protects the landing page initial load time (homepage bundle is just 29 KB), ensuring maximum Google PageSpeed and Core Web Vitals performance for organic search crawling.
- **Alternatives Considered:** Bundling everything in a single index.js. Would force homepage visitors to download 1.5MB upfront.
- **Consequences:** Near-instant initial page render; game chunk streams in parallel with smooth loading spinner.
- **Reversibility:** High.

## [2026-10-15] DEC-006: First-Time User Experience (FTUE) & Visual Affordances
- **Decision:** Implement zero-friction visual tutorial overlays directly inside Level 1:
  1. A pulsating neon-yellow border and bouncing animated arrow over Barnaby the Pug with clear text `"⬇️ SLIDE DOWN"`.
  2. Once the blocker clears row 2, the guide automatically transitions to Sunny with a glowing golden halo and `"⭐ 2. SLIDE TO EXIT ➔"`.
  3. Sunny's star badge was enlarged from a 9px circle to an 18px golden hero medallion with a royal red collar.
  4. The exit gate was redesigned with a golden-amber kennel aesthetic, wooden roof gables, bone emblem, and animated runway arrows matching Sunny's palette.
  5. Dynamic track guides appear during dragging showing allowable movement slots.
- **Reason:** In casual puzzle games, high bounce rates happen in the first 5 seconds if the objective or primary move isn't crystal clear without reading blocks of text.
- **Alternatives Considered:** Modal pop-up dialogues (interruptive, players skip without reading) or full text overlays.
- **Consequences:** Near-zero cognitive load on first launch; intuitive learning-by-doing mechanic.
- **Reversibility:** High.

## [2026-10-15] DEC-008: Celebratory Audio-Visual Overhaul & Organic Sound Synthesis
- **Decision:** Replace robotic raw synth tones with an organic formant-filtered dog vocalization model, dual-cannon full-screen confetti canvas particle system, and staggered star reveal sequence:
  1. Pink-noise aspiration + dual formant filters (750Hz and 1750Hz bandpass) simulate real canine vocal tract resonance for natural joyful puppy yips, happy barks, and excited whimpers.
  2. Multi-harmonic glockenspiel fanfare replaces raw sine arpeggio.
  3. High-performance 60fps canvas Confetti & Star shower launches on level victory with 3D fluttering ribbons and golden stars.
  4. Animated celebratory Sunny avatar (`🐕✨🎉`) and sequential star slam reveals with music box chimes.
- **Reason:** In casual puzzle games, the victory moment is the primary emotional reward driving session length, replayability, and viral satisfaction. Robotic raw oscillators feel cold and synthetic.
- **Alternatives Considered:** External MP3 audio files (adds network overhead, licensing ambiguity, and CORS issues). Procedural synthesis keeps asset footprint at 0 KB while achieving warm organic character.
- **Consequences:** Maximum dopamine reward upon yard completion with zero asset download penalty.
- **Reversibility:** High.


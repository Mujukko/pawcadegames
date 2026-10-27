# LEARNINGS.md — Persistent Technical & Product Learnings

## [2026-10-15] Bun environment in macOS Sandbox
- **What happened:** Standard `node` binary execution via `/usr/bin/env node` fails inside the sandbox, but running via `bun <script>` works directly.
- **Root cause:** Bun was installed in `/Users/aras/.bun/bin/bun` and permitted by macOS sandbox rules, whereas `node` invoked via `/usr/bin/env` was blocked.
- **Resolution:** Explicitly prefix package scripts with `bun ./node_modules/<pkg>/...` in `package.json`.
- **Preventive Rule:** Use `bun run <script>` and direct binary paths for maximum reliability.

## [2026-10-15] Phaser 3 React Lifecycle Management
- **What happened:** Embedding Phaser inside React can lead to duplicate canvas instances or event listener leaks on component remounts or HMR.
- **Resolution:** Encapsulate Phaser game creation in a `useEffect` hook with a ref to the container DOM element, ensuring `game.destroy(true)` is explicitly invoked in cleanup. Store communication events through a typed event bus or callbacks.

## [2026-10-15] Automated BFS Level Solvability Verification
- **What happened:** When manually creating levels 9, 10, and 12, length-3 vertical dogs placed on columns with length-2 dogs inadvertently created an impossible deadlock (occupying 5 out of 6 tiles).
- **Root cause:** High-density columns without at least 3 consecutive free tiles above or below row 2 permanently lock length-3 hounds.
- **Resolution:** The automated BFS solver caught these deadlocks immediately during `bun test`, allowing us to calibrate layouts and verify exact optimal move counts for 3-star ratings across all 12 levels.
- **Preventive Rule:** Never ship a puzzle level without automated test validation confirming its solvability.

## [2026-10-15] Phaser 3 Direct Scene Initialization & Procedural Textures
- **What happened:** Splitting procedural texture creation into a `BootScene` that immediately starts `GameScene` caused a race condition where `GameScene.create()` executed with uninitialized level data or unbound WebGL textures, resulting in a blank white canvas inside the game border.
- **Root cause:** Unlinked asynchronous scene transition in React wrapper before data was bound.
- **Resolution:** Consolidated procedural canvas textures into a synchronous `ensureDogTextures(scene)` function called at the start of `GameScene.create()` and configured `scene: [GameScene]` directly.
- **Preventive Rule:** When using procedural canvas textures in Phaser with React wrappers, generate textures directly in the active game scene to guarantee immediate, atomic rendering on the first frame.

## [2026-10-15] Casual Puzzle First-Time User Experience (FTUE) Affordances
- **What happened:** Initial playtesters were briefly hesitant on Level 1 about which dog was movable and what the objective was because the star badge on the hero dog was too subtle (9px) and the exit gate looked generic.
- **Root cause:** Without an active pulsing guide on the first move, players expected to move the hero dog first, but the hero dog was blocked by Barnaby.
- **Resolution:** Introduced a two-stage animated intro on Level 1:
  1. Highlight the blocking dog with an animated bouncing arrow and `"⬇️ SLIDE DOWN"`.
  2. As soon as the blocker moves, highlight Sunny with a golden runway arrow pointing directly to the golden kennel exit gate.
  3. Redesigned Sunny's badge into an 18px golden medallion with a red hero cape and bright star symbol (`★`).
  4. Redesigned the exit gate with warm kennel wood, bone icon, and emerald directional arrows matching the dog park theme.
- **Preventive Rule:** The first level must always guide the player's eyes and first finger stroke within 1 second using animations rather than text dialogs.

## [2026-10-15] Phaser Animation Flags & React Level Sync
- **What happened:** Clicking "Replay Level" from the victory modal froze the board and stayed stuck. On page reload, React displayed Level 3/4 but Phaser rendered Level 1 with the Level 1 intro guide.
- **Root cause:**
  1. `executeHeroExit` set `this.isAnimating = true;` during the exit slide, but never reset it back to `false` in `onComplete`. This caused all subsequent pointer and drag handlers as well as `restartLevel()` (which guarded with `if (this.isAnimating) return;`) to permanently abort.
  2. On page reload with saved progress, `levelIndex` loaded from `localStorage`, but Phaser's `scene: [GameScene]` constructor initialized with empty `data`, falling back to `LEVELS[0]`. The check loop attached callbacks without loading `currentLevel`.
- **Resolution:**
  1. Reset `this.isAnimating = false;` in `executeHeroExit.onComplete`.
  2. In `restartLevel()`, unconditionally call `this.tweens.killAll()`, reset `this.isAnimating = false;`, and delegate to `loadLevel(this.currentLevel)`.
  3. Static property `GameScene.initialLevel` and `checkScene` level check guarantee Phaser always initializes and syncs to React's active `currentLevel` from `localStorage`.
- **Preventive Rule:** Never let an animation lock flag persist beyond its tween, and always make restart/load functions cancel in-flight tweens and force-clear animation flags.

## [2026-10-15] Grid Overlap Collision Validation in Level Data
- **What happened:** On Level 10 ("The Great Dogscape"), the vertical poodle (`c4` Chloe at x=2, y=3) and horizontal corgi (`c6` Benny at x=1, y=4) were overlapping at cell (2, 4). On Level 4 ("Poodle Crossing"), `corgi1` and `poodle1` were overlapping at cell (4, 3).
- **Root cause:** Initial level handcrafted configs had overlapping coordinate definitions. The BFS solver previously only simulated legal moves from the initial state without validating whether the initial placement itself had intersecting tiles.
- **Resolution:**
  1. Corrected Level 10 `c6` to `x=0, y=4` (eliminating the overlap while preserving the exact 6-move puzzle depth).
  2. Corrected Level 4 coordinates to eliminate the cell (4, 3) collision while preserving the 4-move puzzle depth.
  3. Added an automated test in `engine.test.ts` verifying that every dog and obstacle in all levels has strictly disjoint grid bounds (`778` assertion checks).
- **Preventive Rule:** In grid puzzle design, always enforce automated initial collision/disjointness validation tests across all handcrafted levels alongside the BFS solvability test.

## [2026-10-15] Poki-Style Game Portal Architecture & Zero-Fluff UX
- **What happened:** When users visit casual game portals like Poki (`poki.com`), having lengthy marketing descriptions and text sections above or around the game tiles increases bounce rates and dilutes engagement.
- **Resolution:**
  1. Converted the homepage into a pure game grid (Bento/Mosaic layout) where 100% of the visible surface is dedicated to playable and upcoming games.
  2. Implemented quick-switch category filter pills (`🎮 All Games`, `🔥 Popular`, `✨ New`, `🐮 Farm`, `🐱 Cats`, `🐶 Dogs`, `🧩 Puzzles`) with instant client-side filtering.
  3. Integrated large interactive hero tiles featuring vibrant background art, mascots, ratings, and immediate "PLAY NOW" hover actions.

## [2026-10-15] Top-Down Continuous Vehicle Physics & Multi-Circle Collision Detection
- **What happened:** Top-down driving games with non-axial rotation often suffer from corner snagging or rotational tunneling when colliding with static rectangular obstacles.
- **Root cause:** Standard AABB bounding boxes rotate into excessively large or ill-fitting collision envelopes, while single-circle approximation leaves front/rear extremities clipping through fences and tractors.
- **Resolution:**
  1. Implemented a 3-point collinear circle model along the cow's spine ($r = 18\text{px}$, spaced $\pm 18\text{px}$ from center).
  2. Detected collision by clamping circle centers to obstacle AABBs. If any circle intersects, continuous health damage is applied proportionally to frame delta (`rate * dt`).
  3. Calibrated damage rate to $28\%$ per second: glancing taps drain only $3-5\%$, while sustained contact or entrapment drains health rapidly and triggers game over.
  4. Accuracy calculation evaluates slot containment ($50\%$), center proximity ($20\%$), and bidirectional angle alignment ($30\%$) so that both forward and reverse parking are rewarded.
- **Preventive Rule:** Use multi-sphere bounding volumes for non-axis-aligned elongated vehicles, and scale damage by true elapsed time rather than fixed frame decrements.

## [2026-10-15] Platform-Wide Single-Language Discipline
- **What happened:** Introducing a new game or translating portions of UI can lead to awkward mixed-language interfaces (e.g. English game instructions alongside Turkish filter tabs).
- **Resolution:** Harmonized 100% of the portal's navigation, filter pills, game instructions, badges, victory modals, and metadata to clean, consistent English.
- **Preventive Rule:** Always verify UI strings across all entry points, headers, footers, and modals to maintain strict single-language consistency.

## [2026-10-15] 60 FPS Game Loop Decoupling from React UI & Axis-Separated Wall Sliding
- **What happened:** Bessie the Cow exhibited noticeable micro-stutters and frame jitter ("takılarak gidiyor") when steering, particularly near walls and fences.
- **Root cause:**
  1. **60 FPS React Re-Render Choking:** `FarmGameScene.update()` was invoking `onStateUpdate(this.gameState)` every single frame, forcing `setGameState({ ...s })` 60 times/sec. This flooded React with virtual DOM diffing, triggering periodic garbage collection spikes and thread contention.
  2. **Speed Oscillation Loop:** When hitting an obstacle, `cow.speed = -cow.speed * 0.35` inverted speed every frame. Because `cow.x` was clamped, next frame moved backward, then accelerated forward, oscillating violently at 60Hz.
  3. **Coupled Axis Collision:** Testing diagonal movement `(dx, dy)` as a single combined vector caused both axes to fail if either was obstructed, stopping diagonal wall sliding dead.
  4. **Diagonal Snout Rotation Collision:** Rotating diagonally toward a wall tilted Bessie's front circle into the obstacle, causing the rotation itself to register as an immediate collision.
- **Resolution:**
  1. **React State Throttling:** Throttled `onStateUpdate` callbacks in the React container to ~12 FPS (75ms window) while immediately flushing on discrete events (milk collected, level completed, game over). Canvas maintains a rock-solid 60 FPS while React rendering load dropped by $>80\%$.
  2. **Axis-Separated Wall Sliding:** Resolved X and Y movement independently. If Y is blocked by a fence, X continues sliding smoothly with subtle wall friction (`speed *= 0.88`), clamping speed to zero only on true head-on collisions.
  3. **Obstacle-Aware Snout Rotation:** If auto-orienting toward a diagonal vector would embed Bessie's nose/horns into a wall, rotation locks parallel to the open axis (e.g. facing horizontally along a fence), enabling butter-smooth wall hugging.
- **Preventive Rule:** Never bind high-frequency (60Hz) game simulation ticks directly to top-level React state. Separate collision axes for wall sliding, and ensure elongated character rotation does not penetrate static geometry.

## [2026-10-15] Perpendicular Parking Rejection & Rotated Stall Aspect Ratio Alignment
- **What happened:** A user screenshot showed a visual crosshair (+) glitch where the stall perimeter was horizontal and the emblem inside was vertical, and the cow could sit sideways in the stall while receiving high accuracy.
- **Root cause:**
  1. **Double-Inversion of Stall Dimensions:** In Levels 3 & 5, `parkingSlot` was configured with `width: 60, height: 100` alongside `rotation: Math.PI / 2`. Because `slot.width` represents the longitudinal axis, rotating 90 degrees turned it horizontal ($100\text{px}\times 60\text{px}$) on screen, while the emblem ($80\text{px}\times 52\text{px}$) became vertical ($52\text{px}\times 80\text{px}$), intersecting at $90^\circ$.
  2. **Competing Outer Emblem Border:** The texture generator for `parking_cow_emblem` drew a hardcoded $76\text{px}\times 48\text{px}$ rounded dashed orange box.
  3. **Permissive Angular Tolerance:** Accuracy was computed additively ($50\%$ containment, $20\%$ distance, $30\%$ angle). A completely sideways cow ($90^\circ$ perpendicular) in the center of the stall scored $1.0\times 0.5 + 1.0\times 0.2 + 0 = 0.70$ ($65\%$ accuracy), triggering green/amber glow.
- **Resolution:**
  1. Normalized all stall dimensions so `width` always denotes longitudinal length ($100$) and `height` denotes transverse width ($60$), with orientation governed solely by `rotation` (`-Math.PI / 2` for up, `Math.PI / 2` for down, `0` for right).
  2. Stripped the outer dashed rectangle from the emblem texture, turning it into a clean stencil floor decal.
  3. Implemented a strict angular threshold in `calculateParkingAccuracy()`: if $\Delta\theta > 35^\circ$ ($0.61\text{ rad}$), accuracy returns strictly $0\%$.
- **Preventive Rule:** In top-down directional parking games, never allow additive score accumulation to grant passing grades when vehicle orientation exceeds strict docking thresholds ($\le 35^\circ$). Keep slot dimension conventions uniform and decouple floor decals from rigid outer frames.

## [2026-10-15] Deterministic Dynamic Obstacle Patrol & Sprite Rendering Decoupling
- **What happened:** Introducing moving obstacles (patrolling sheep) in Level 6+ required maintaining 100% testable game logic in pure TypeScript without depending on Phaser ticks or React render state.
- **Root cause:** Incremental position updates `pos += speed * dt` can accumulate floating-point drift over long play sessions, fall out of sync on tab switches or browser frame drops, and complicate solvability and clearance unit testing.
- **Resolution:**
  1. **Deterministic Function of Elapsed Time:** Implemented `updateObstacles(obstacles, elapsedTime)` using a triangular wave cycle `cycleTime = 2 * (max - min) / speed`. Position and rotation are calculated closed-form from `elapsedTime + phaseOffset`, ensuring zero drift and bit-exact reproducibility.
  2. **Decoupled Visual Presentation:** The pure engine outputs coordinates and orientation; Phaser handles sprite position, subtle walking trot bobbing (`Math.sin(time * 0.012) * 1.5`), and horizontal flip (`setFlipX`) so that leftward-walking sheep are not rendered upside down.
  3. **Automated Patrol Route Clearance Validation:** Unit tests sample 20 discrete time steps across the full patrol period of every moving sheep in the game, guaranteeing $\ge 15\text{px}$ clearance from all static obstacles and $\ge 20\text{px}$ from all collectible milk bottles.
- **Preventive Rule:** Model dynamic game obstacles as closed-form functions of elapsed simulation time rather than stateful frame accumulation. Always write multi-timestep interval clearance tests to prevent moving hazards from colliding with static layout elements.

## [2026-10-15] Dynamic Obstacle Offset Drift & Subpixel Shimmer Elimination
- **What happened:** The moving sheep exhibited rapid vibration / trembling ("titriyor") while patrolling.
- **Root cause:**
  1. **Feedback Loop on Moving Position:** `updateGamePhysics` passed `state.obstacles || level.obstacles` into `updateObstacles`. In each frame, `obs.x` was already updated to the new position, causing `startOffset = (obs.x - min) / speed` to re-evaluate from the live coordinate rather than the static origin. This added live position into the time phase calculation, creating double acceleration and violent flip-flop oscillation around turnaround boundaries.
  2. **1 Decimal Quantization:** Rounding coordinates to 0.1px prevented smooth subpixel canvas interpolation.
  3. **High-Frequency Top-Down Bobbing:** Adding a vertical sine wave `\sin(time * 0.012) * 1.5` onto a top-down horizontal movement caused the 32px sprite to shimmer across sub-pixel boundaries 2 times per second, appearing as vibration/tremor.
- **Resolution:**
  1. Base input to `updateObstacles` is strictly pinned to immutable `level.obstacles`, keeping `startOffset` 100% constant and stable.
  2. Floating-point coordinates are passed directly to Phaser without quantization.
  3. Removed vertical bobbing; sprite position directly follows `(obs.x, obs.y)`.
- **Preventive Rule:** When evaluating time-based trigonometric or triangular wave motion, always evaluate against the immutable initial level coordinates, never against previously mutated state objects. Avoid cross-axis subpixel bobbing in 2D top-down orthogonal movement.

## [2026-10-15] Procedural Formant Voice Synthesis & Silo Fill Gauge Tweening
- **What happened:** The user requested adding a Tetris game where clearing blocks fills a rustic hay silo on the right, and a cute farmer sitting on top does hand gestures and shouts "WOW!".
- **Root cause:** Pre-recorded audio files for speech or character reactions introduce download bloat, licensing headaches, latency, and CORS constraints on web games.
- **Resolution:**
  1. **Dual-Bandpass Formant Voice Synthesis (`sound.ts`):** Created a procedural human vocal formant synth in Web Audio using two harmonic oscillators (sawtooth + triangle) routed through a resonant bandpass filter ($Q = 4.2$). Swept filter cutoff dynamically from $450\text{Hz}$ (/w/) up to $950\text{Hz}$ (/o/) and back down to $600\text{Hz}$ (/w/), generating a cheerful cartoon "WOOOW!" voice exclamation with zero asset bytes.
  2. **Smooth Fill Level Tweening:** The pure engine handles exact silo percentage ($+10\%$ per line, $100\%$ capacity resets with level up). To avoid jarring jumps in the Phaser canvas, `visualSiloPercent` uses linear interpolation (`Phaser.Math.Linear(current, target, 0.14)`) with golden wheat grain stripes and glowing top crest.
  3. **Multi-Stage Farmer Emotion Animation:** When lines pop, the cute farmer transitions from idle to cheerful waving pose (`farmer_cheer`), executes an easing bounce tween (`Back.easeOut`), pops up an animated speech bubble, and returns to resting idle after 1.4 seconds.
- **Preventive Rule:** Use procedural formant filter sweeps to give characters expressive cartoon voices with zero download overhead. Combine decoupled pure game logic metrics with client-side visual interpolation for buttery smooth resource gauge transitions.

## [2026-10-27] Casual & Farm Game Retention Benchmarks (D1, D7, D30) & The Farm Theme Moat
- **Data Source & Empirical Findings:**
  Industry mobile & casual gaming benchmark analysis across top casual, match-3, and arcade puzzle titles demonstrates the following benchmark percentiles:
  - **Day 1 Retention (D1):**
    - **Industry Median:** **42.8%**
    - **Low Benchmark:** Candy Crush Soda (26.5%)
    - **Top Benchmark:** Jelly Busters (59.4%)
    - **Central Cluster:** 35% – 45%
  - **Day 7 Retention (D7):**
    - **Industry Median:** **25.0%**
    - **Low Benchmark:** Angry Birds 2 (10.4% — high mid-core churn / frustration barrier)
    - **Top Benchmark:** **Farm Heroes Saga (38.8%)**
    - **Central Cluster:** 20% – 27%
  - **Day 30 Retention (D30):**
    - **Industry Median:** **15.7%**
    - **Low Benchmark:** Foodstars (2.8%)
    - **Top Benchmark:** **Farm Heroes Saga (31.8% — 2.02x above industry median!)**
    - **Central Cluster:** 14% – 18%
  - **Session Length & Daily Playtime:**
    - **Short Session:** Disney Tsum Tsum (22 minutes/day)
    - **Extended Engagement:** **Colony Flow! (152 minutes/day)** — swarm multiplication and crowd density mechanics generate ~7x longer daily engagement than conventional puzzle games.

- **Strategic Insights & Root Cause Analysis:**
  1. **The Farm & Cozy Animal Retention Moat:**
     - Farm Heroes Saga dominates both D7 (38.8%) and D30 (31.8%) retention compared to all other casual puzzle subgenres.
     - *Why?* Farm and animal harvest loops create organic, low-stress emotional progression without punitive loss-aversion or skill-gate rage quits. Harvesting fresh crops, feeding cute livestock, and watching a homestead grow provides daily habit-forming satisfaction.
     - *Pawcade Takeaway:* Validates Pawcade's dedicated focus on the farm, barnyard, and pet ecosystem as the highest long-term retention genre in web gaming.
  2. **D1 Friction Elimination (The Instant Play Advantage):**
     - Web games have an inherent competitive advantage over 200MB+ mobile app store downloads (zero install delay, zero storage footprint).
     - However, to achieve > 50% D1 retention (approaching Jelly Busters' 59.4%), the first 15 seconds must be flawless: zero tutorial text blocks, immediate tactile visual cues, instant haptic/audio feedback, and early milestone rewards (e.g. 5m confetti in Barnyard Tower, first order in Mini Mart).
  3. **Swarm & Multiplier Mechanics for Session Expansion:**
     - Colony Flow's 152-minute daily engagement demonstrates the psychological appeal of exponential crowd growth and math multiplier gates.
     - *Pawcade Takeaway:* Our implementation of `sheep-stampede` (Pasture Rush) leverages this exact mechanic; future game designs should feature crowd-scaling, snowballing combos, and progressive upgrades.

- **Pawcade Retention Targets & Implementation Rules:**
  - **D1 Retention Target:** $\ge 45\%$ (Median: $42.8\%$, Elite: $59\%$)
  - **D7 Retention Target:** $\ge 28\%$ (Median: $25.0\%$, Elite: $39\%$)
  - **D30 Retention Target:** $\ge 18\%$ (Median: $15.7\%$, Elite: $32\%$)
  - **Actionable Game Design Principles:**
    1. **Persistent Organic Progress:** Every game must save milestones, high scores, unlock levels, and coin balances into `localStorage` so returning players feel lasting ownership.
    2. **Daily Freshness via `ai-trends-scout`:** Releasing 2 new games daily gives returning players a daily reason to revisit the portal.
    3. **Zero Cognitive Fatigue:** Keep game mechanics immediately intuitive with 1-click/1-tap controls and high-contrast, juicy Web Audio reward sounds.


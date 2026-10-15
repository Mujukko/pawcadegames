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
  2. Implemented quick-switch category filter pills (`🎮 Tüm Oyunlar`, `🔥 Popüler`, `✨ Yeni`, `🐱 Kediler`, `🐶 Köpekler`, `🧩 Bulmaca`) with instant client-side filtering.
  3. Integrated large interactive hero tiles featuring vibrant background art, mascots, ratings, and immediate "HEMEN OYNA" hover actions.
- **Preventive Rule:** For browser game portals, prioritize visual game cards and 1-click playability over traditional text-heavy landing page structures.


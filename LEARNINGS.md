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

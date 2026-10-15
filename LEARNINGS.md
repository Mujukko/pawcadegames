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

## [2026-10-15] Portal Bundle Optimization with Code-Splitting
- **What happened:** Phaser 3 is ~1.4MB minified. Including it in the initial portal bundle would hurt SEO and mobile homepage load time.
- **Resolution:** Implemented `React.lazy` on `GamePage` with manual chunk splitting in `vite.config.ts`. The homepage bundle dropped to only 29.18 kB (gzip: 8.75 kB), loading in milliseconds, while the Phaser engine only loads when entering `/games/dog-parking/`.

# PROJECT.md — Dog Parking & Browser Game Portal Specification

## 1. Product Vision
Build a high-retention, delightful browser puzzle game called **Dog Parking** and establish a modular, scalable web game portal foundation (inspired by Poki's discoverability and lightweight web-first UX, but with 100% original identity, art, and mechanics).

## 2. Target Audience & Initial Market
- **Target Audience:** Casual puzzle gamers, pet lovers, commuter/break players seeking instant-play, zero-install 2-5 minute puzzle sessions.
- **Initial Market:** United States (desktop & mobile web).

## 3. Core Game Concept: Dog Parking
A grid-based puzzle game where dogs (such as Corgi, Shiba Inu, Pug, Golden Retriever, Dachshund) are parked in a crowded yard/parking lot. The player must slide/guide each dog to its color/breed-matched kennel/parking bay without collisions or getting blocked.
- Characters have distinct shapes, orientations, and movement axes (e.g., straight-line sliding vehicles/dogs like classic Rush Hour/Parking Jam mechanics, or path-planning grid movement).
- **Chosen Mechanics:** Rush Hour / Parking Jam hybrid — dogs have lengths (e.g., 2-grid Corgi, 3-grid Dachshund) and orientations (horizontal/vertical) or directional paths, and must unblock each other and navigate out to their assigned dog house / gate.
- 12 handcrafted, validated solvable levels progressing from gentle tutorial to brain-teasing spatial puzzles.

## 4. Technology Stack
- **Language:** TypeScript 5.x
- **Runtime & Tooling:** Bun 1.4+ (runtime, package manager, test runner), Vite 5.x (fast bundling, HMR)
- **UI & Portal Shell:** React 18, Lucide React (clean SVGs), Tailwind CSS v4
- **Game Engine:** Phaser 3.90 (Canvas/WebGL renderer, scene graph, tweens, particles)
- **Audio:** Web Audio API procedural sound synthesizer (barks, woofs, engine purrs, success jingles, click feedback) — zero external sound assets needed, 100% reliable offline.
- **Persistence:** Browser `localStorage` for progress, high scores, audio preferences.

## 5. Monetization Roadmap
- **MVP:** No ads, zero friction, instant loading.
- **Phase 2 (Growth):** Non-intrusive rewarded video / interstitial points between level packs, rewarded hints, banner placements reserved in web shell outside gameplay area.

## 6. Non-Goals & Deferred Features
- No backend servers, user auth, or cloud database in MVP.
- No heavy 3D or bloated asset packs.
- No invasive tracking or GDPR/COPPA-violating analytics.

## 7. Current Implementation Status
- Phase 0 (Workspace inspection): Complete.
- Phase 1 (Architecture & Memory): Complete (`AGENTS.md`, `PROJECT.md`, `DECISIONS.md`, `TASKS.md`, `LEARNINGS.md`, `RESEARCH.md`, `docs/ARCHITECTURE.md`, `docs/GAME_DESIGN.md`).
- Phase 2 (Game Engine & Dog Parking MVP): Complete (Pure TS logic, 12 verified levels, procedural Web Audio, Phaser scenes with custom dog art).
- Phase 3 (Testing & Optimization): Complete (Bun test suite passes, code-splitting with React.lazy, 29KB homepage bundle).
- Phase 4 (Growth & SEO Foundation): Complete (Semantic HTML, JSON-LD schema, robots.txt, sitemap.xml, analytics abstraction).
- Phase 5 (Handover): Complete.

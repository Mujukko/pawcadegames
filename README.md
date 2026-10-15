# 🐶 Pawcade — Dog Parking & Browser Game Platform

A production-quality casual browser puzzle game and scalable web gaming portal built with **TypeScript**, **React 18**, **Phaser 3**, **Tailwind CSS v4**, and **Vite**.

Inspired by Poki's discoverability and lightweight web-first UX, but featuring **100% original artwork**, **original gameplay mechanics**, **procedural Web Audio sound effects**, and its own playful brand identity.

---

## 🌟 Key Features

- **Playable Dog Parking Game:** Slide dogs (Corgis, Pugs, Shibas, Dachshunds, Retrievers, Dalmatians, Poodles) along their natural lanes to clear the path for Sunny the Star Corgi to reach the green **EXIT ➔** gate!
- **12 Handcrafted Solvable Levels:** Progressive spatial puzzles ranging from tutorial walkies (2-3 moves) to expert grand master yard traffic jams (10+ moves).
- **100% Mathematically Verified Solvability:** Automated BFS (Breadth-First Search) solver tests every level configuration and guarantees exact optimal move counts for 3-star ratings.
- **Procedural Web Audio Engine:** Zero external sound asset dependencies. Synthesizes gentle clicks, sliding whooshes, soft collision bumps, cute dog barks, and celebratory victory fanfares dynamically.
- **Code-Split High Performance Portal:** The homepage bundle is only **29 KB** (8.7 KB gzip). Phaser's 2D game engine is loaded dynamically on-demand when launching Dog Parking.
- **Mobile-First & Desktop Controls:** Full touch/swipe support with `touch-action: none` to prevent scroll interference, plus full mouse drag and keyboard shortcuts (`R` for restart, `Z` for undo).
- **Technical SEO & Growth Ready:** Pre-configured with OpenGraph cards, Twitter preview metadata, JSON-LD `VideoGame` structured schema, semantic HTML, `sitemap.xml`, and `robots.txt`.
- **Multi-Game Extensibility:** Lightweight TypeScript registry (`src/lib/gamesRegistry.ts`) to easily host future titles under the Pawcade platform umbrella.

---

## 🚀 Quick Start Instructions

### Prerequisites
- [Bun](https://bun.sh) (v1.2+) or Node.js (v18+)

### 1. Install Dependencies
```bash
bun install
```

### 2. Start Local Development Server
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests & Solvability Verification
```bash
bun test
```
Runs the engine unit test suite and programmatically verifies that all 12 levels are 100% solvable via the BFS engine.

### 4. Run TypeScript Check
```bash
bun run typecheck
```

### 5. Build for Production
```bash
bun run build
```
Production assets are generated in the `dist/` directory, ready to deploy to Cloudflare Pages, Vercel, Netlify, GitHub Pages, or any static web host.

### 6. Preview Production Build
```bash
bun run preview
```

---

## 📁 Project Architecture

```
├── AGENTS.md                  # Permanent project constitution & engineering standards
├── PROJECT.md                 # Product vision, mechanics, tech stack & status
├── DECISIONS.md               # Append-only architectural decision log
├── TASKS.md                   # Prioritized backlog & sprint status
├── LEARNINGS.md               # Persistent technical learnings
├── RESEARCH.md                # US search acquisition & retention hypotheses
├── docs/
│   ├── ARCHITECTURE.md        # Portal and game architectural blueprints
│   └── GAME_DESIGN.md         # Gameplay mechanics, dog breeds, and difficulty curves
├── src/
│   ├── app/                   # Web portal routing & pages
│   │   ├── App.tsx            # Main router with dynamic SEO title updates
│   │   ├── HomePage.tsx       # Featured hero game banner, catalog, & SEO copy
│   │   ├── GamePage.tsx       # Playable game frame, controls, & breed guide
│   │   └── NotFoundPage.tsx   # Friendly 404 page
│   ├── components/            # Shared UI components (Header, Footer)
│   ├── games/
│   │   └── dog-parking/
│   │       ├── DogParkingContainer.tsx # React-Phaser lifecycle bridge & HUD
│   │       ├── logic/                  # Pure TypeScript game rules & BFS solver
│   │       ├── levels/                 # 12 handcrafted solvable level configs
│   │       ├── scenes/                 # Phaser 3 BootScene & GameScene
│   │       └── systems/                # Web Audio soundManager
│   ├── lib/                   # Games registry, storage, and analytics hooks
│   └── styles/                # Tailwind CSS v4 design tokens and globals
└── public/                    # robots.txt, sitemap.xml, and static assets
```

---

## 🎮 How to Play Dog Parking

1. **Slide the Dogs:** Tap and drag any dog forward or backward along its lane. Horizontal dogs move left/right; vertical dogs move up/down.
2. **Clear the Obstacles:** Maneuver pups out of the center aisle so the road to the green **EXIT ➔** gate is open.
3. **Free Sunny:** Guide Sunny the Star Corgi through the gate to complete the level!
4. **Keyboard Shortcuts:**
   - <kbd>R</kbd>: Quick Restart Level
   - <kbd>Z</kbd>: Undo Previous Move

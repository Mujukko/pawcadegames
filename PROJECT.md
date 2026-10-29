# PROJECT.md — Dog Parking & Browser Game Portal Specification

## 1. Product Vision
Build a high-retention, delightful browser puzzle game called **Dog Parking** and establish a modular, scalable web game portal foundation (inspired by Poki's discoverability and lightweight web-first UX, but with 100% original identity, art, and mechanics).

## 2. Target Audience & Initial Market
- **Target Audience:** Casual puzzle gamers, pet lovers, commuter/break players seeking instant-play, zero-install 2-5 minute puzzle sessions.
- **Initial Market:** United States (desktop & mobile web).

## 3. Game Portfolio (66 Playable Games)
- **Classic Hits & Driving:** Dog Parking, Cat Parking, Animal Farm Parking, Barnyard Kart: Tractor Grand Prix, Tractor Hill Climb: Barnyard Ridge
- **Physics & Launch:** Piggy Cannon Blast, Barnyard Rope Cut, Barnyard Popcorn Popper, Egg Buster, Grain Sand Fall, Wood Nuts & Bolts, Save the Sheep, Barnyard Tower, Barnyard Pinball, Barnyard Brick Breaker, Milk Bottle Plinko, Barnyard Peg Pop, Barnyard Fruit Slicer, Barnyard Pin Pull
- **Puzzles & Logic:** Barnyard Word Connect, Farm Block Blast, Sheep Cart Jam, Farm Pantry Sort, Critter Tap Away, Horseshoe Twist, Farm Mahjong, Pet Memory Match, Farm Fruit Bubble, Duck Pond Sort, Animal Suika Drop, Farm Tile Triple, Farm Pipe Flow, Hamster Cookie Stack, Animal Tangram Fit, Sheep Sorter Gate, Hamster Maze Runner
- **Arcade & Action:** Crossy Chicken: Farm Highway Run, Duck Hunt Classic, Duck Runner, Flappy Chicken, Farm Tetris, Animal 2048, Pasture Sheep Jump, Hungry Piggy, Hamster Ball Dash, Duck Archery Range, Corgi Mini Golf, Caterpillar Fruit Trail, Carrot Target Throw, Piggy Coin Pusher, Crop Mower Harvest, Chicken Egg Catcher, Duck Water Slide, Bunny Hop Cross
- **Cozy Sim & Tycoon:** Farm Mini Mart, Chef Rat Rush, Cat Cafe Rush, Capybara Spa, Koi Pond Zen, Piggy Mud Wash, Farm Boba Tea, Barnyard Ice Cream, Gopher Garden, Farm TriPeaks Solitaire, Sheep Stampede

## 4. Technology Stack
- **Language:** TypeScript 5.x (`strict: true`)
- **Runtime & Tooling:** Bun 1.4+ (runtime, package manager, test runner), Vite 5.x (fast bundling, HMR)
- **UI & Portal Shell:** React 18, Lucide React (clean SVGs), Tailwind CSS v4, canvas-confetti
- **Game Engines:** Pure TypeScript deterministic logic engines paired with high-performance 60 FPS HTML5 Canvas 2D or Phaser 3 rendering.
- **Audio:** Native Web Audio API procedural sound synthesizers (zero external mp3/wav files, zero latency, offline ready).
- **SEO & AEO:** 7-Pillar Canonical Scoring, Schema.org JSON-LD (`VideoGame`, `WebApplication`), Speedgrapher Anti-Slop (Fog 6.0-8.5, Slop 0/100), automated IndexNow push.
- **Analytics:** Granular GA4 lifecycle event tracking (`game_loaded`, `game_started`, `level_started`, `level_completed`, `level_failed`, `score_milestone`, `game_restarted`).
- **Persistence:** Browser `localStorage` for progress, high scores, audio preferences, and tutorial dismissals.

## 5. Current Implementation Status
- **Total Playable Catalog:** 66 fully playable, mathematically verified games.
- **Test Suite:** 687 automated unit tests passing across 68 test files (5641 assertions).
- **SEO & Readability:** 66/66 games scored 100/100 on the unified 7-pillar Agentic SEO audit with 0/100 AI slop.
- **Build & Pre-rendering:** Vite production bundle passes cleanly with static HTML pre-rendered for all 66 games and category hubs.
- **Continuous Deployment:** All code committed and pushed to `main` (`Mujukko/pawcadegames`).

## 6. Strategic Game Production Roadmap (Ahrefs US Verified Data)

Targeting verified low-KD genre queries and high-traffic potential animal themes:

| Priority | Proposed Game Title | Target Genre / Intent | Search Volume (US) | KD | Traffic Potential (TP) | Core Mechanics |
| :---: | :--- | :--- | :---: | :---: | :---: | :--- |
| **#1** | **Farm Animal Idle Clicker** | `clicker games` + `idle games` | **98,000** | **0 / 25** | **36,000** | Tap animals (Capybara/Corgi/Cow) for milk/wool/eggs, buy automatic farmhands, unlock golden barn upgrades & cosmetics. |
| **#2** | **Barnyard Four in a Row** | `connect 4` (brand-safe) | **92,000** | **39** | **34,000** | 7x6 wooden barn grid, drop red apple & golden corn tokens, AI bot + local 2-player mode. |
| **#3** | **Barnyard Egg Cart: Pasture Hill** | `eggy car` | **181,000** | **18** | **32,000** | 2D hill climbing driving physics with an egg in the vehicle basket. Balance speed and slopes without cracking the egg. |
| **#4** | **Pasture Critter Run: Platformer Quest** | `platformer games` | **5,900** | **4** | **5,100** | Precision mini-stage animal platformer with collectibles and obstacle timing. |
| **#5** | **Barnyard Spot the Difference** | `spot the difference` | **22,000** | **37** | **4,200** | Find 5 differences between two charming illustrated farmyard scenes before the timer expires. |
| **#6** | **Barnyard Horse Derby & Care** | `horse racing game` + `horse games` | **10,300** | **20 / 30** | **3,600** | Grooming, obstacle hurdle jumps, and derby racing. |



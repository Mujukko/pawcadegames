# PROJECT.md — Dog Parking & Browser Game Portal Specification

## 1. Product Vision
Build a high-retention, delightful browser puzzle game called **Dog Parking** and establish a modular, scalable web game portal foundation (inspired by Poki's discoverability and lightweight web-first UX, but with 100% original identity, art, and mechanics).

## 2. Target Audience & Initial Market
- **Target Audience:** Casual puzzle gamers, pet lovers, commuter/break players seeking instant-play, zero-install 2-5 minute puzzle sessions.
- **Initial Market:** United States (desktop & mobile web).

## 3. Game Portfolio (32 Playable Games)
1. **Dog Parking (`/games/dog-parking/`):** Rush Hour / Parking Jam hybrid with 12 verified levels and procedural dog barks.
2. **Cat Parking (`/games/cat-parking/`):** Feline sliding puzzle with 12 verified levels and procedural purrs/meows.
3. **Animal Farm Parking (`/games/animal-farm-parking/`):** Precision tractor driving, pasture milk collection, and docking stalls.
4. **Farm Tetris (`/games/farm-tetris/`):** Farm crop tetrominoes with filling hay silo and cheering animated farmer.
5. **Animal 2048 (`/games/animal-2048/`):** 12-tier animal evolution ladder (Mouse to Elephant) with undo and swipe controls.
6. **Flappy Chicken (`/games/flappy-chicken/`):** Distance flight through fence gates to the grand golden wheat field.
7. **Farm Animal Match (`/games/pet-candy-crush/`):** 8x8 match-3 with striped runners, party animals, and golden barn stars.
8. **Duck Runner (`/games/duck-runner/`):** Offline infinite runner with day/night cycle and vampire bats.
9. **Farm Mini Mart (`/games/farm-mini-mart/`):** 3D arcade idle tycoon with crops, shelves, cash register, and farmhand helpers.
10. **Chef Rat Rush (`/games/chef-rat-rush/`):** Parisian gourmet animal kitchen with orders, chopping boards, and brass service bells.
11. **Farm Block Blast (`/games/farm-block-blast/`):** 8x8 wood polyomino blast with banjo combos and line clears.
12. **Sheep Cart Jam (`/games/sheep-cart-jam/`):** Meadow tractor escape with color-matching sheep trailers and station bays.
13. **Grain Sand Fall (`/games/grain-sand-fall/`):** Sand Tetris fluid granular physics with multi-crop sand dissolution.
14. **Farm Pantry Sort (`/games/farm-pantry-sort/`):** Triple Goods match puzzle with wooden kitchen cupboards and jam jars.
15. **Critter Tap Away (`/games/critter-tap-away/`):** 3D arrow-cube barn escape with clear directional raycasting.
16. **Egg Buster (`/games/egg-buster/`):** Slingshot trajectory physics destroying wooden crates and mischievous foxes.
17. **Sheep Stampede (`/games/sheep-stampede/`):** Colony multiplier gates (x2, x3, +20) leading Buster's flock safely into the red barn.
18. **Horseshoe Twist (`/games/horseshoe-twist/`):** Concentric rotating rings with exit notches to free the lucky golden horseshoe.
19. **Duck Hunt Classic (`/games/duck-hunt-classic/`):** Retro arcade clay & duck shooter with laughing dog and round quotas.
20. **Farm Mahjong (`/games/farm-mahjong/`):** Multi-layer 3D tile solitaire with free-tile BFS detection and farm crops.
21. **Pet Memory Match (`/games/pet-memory-match/`):** Concentration card flipping with flip multipliers and golden pairs.
22. **Barnyard Tower (`/games/barnyard-tower/`):** 60 FPS Canvas 2D swinging crane stacker with center-of-mass physics.
23. **Gopher Garden (`/games/gopher-garden/`):** 3x3 whack-a-mole orchard frenzy with golden king gophers and combo streaks.
24. **Farm Fruit Bubble (`/games/farm-fruit-bubble/`):** Hexagonal bubble shooter with bouncing aiming guide and fruit bursts.
25. **Pasture Sheep Jump (`/games/pasture-sheep-jump/`):** Vertical endless jumping with bouncy hay springs and cloud platforms.
26. **Hungry Piggy (`/games/hungry-piggy/`):** Arena chomper growing through 4 size tiers eating farm produce.
27. **Duck Pond Sort (`/games/duck-pond-sort/`):** Water sort logic puzzle sorting colored ducklings into matching water lily docks.
28. **Hamster Ball Dash (`/games/hamster-ball-dash/`):** High-speed stunt sphere arcade with ramps, tubes, and sunflower seeds.
29. **Cat Cafe Rush (`/games/cat-cafe-rush/`):** Cozy bakery tycoon baking taiyaki waffles and frothing matcha for visiting cats.
30. **Save the Sheep (`/games/save-the-sheep/`):** Physics line drawing puzzle drawing wooden barrier fences to deflect bee swarms.
31. **Capybara Spa (`/games/capybara-spa-rush/`):** Japanese cedar onsen tycoon tossing floating yuzu, scrubbing baths, and serving tea.
32. **Wood Nuts & Bolts (`/games/wood-nuts-farm/`):** Tactile screw & bolt puzzle unfastening pegs to drop heavy wooden planks.

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
- **Total Playable Catalog:** 32 fully playable, mathematically verified games.
- **Test Suite:** 353 automated unit tests passing across 34 test files (4201 assertions).
- **SEO & Readability:** 32/32 games scored 100/100 on the unified 7-pillar Agentic SEO audit with 0/100 AI slop.
- **Build & Pre-rendering:** Vite production bundle passes cleanly with static HTML pre-rendered for all 32 games and category hubs.
- **Continuous Deployment:** All code committed and pushed to `main` (`Mujukko/pawcadegames`).


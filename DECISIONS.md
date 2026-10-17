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

## [2026-10-15] DEC-009: Cat Parking Multi-Game Release & Poki-Inspired Pure Game Homepage
- **Decision:**
  1. Built and launched **Cat Parking** (`/games/cat-parking/`), an independent title featuring Luna the Star Calico, 8 feline breeds (Siamese, Tabby, Black Cat, Persian, Russian Blue, Maine Coon, Bengal), obstacles (yarn ball, cardboard box, scratching post), procedural feline audio (organic meows, purrs, bell chimes), and 12 mathematically proven solvable levels.
  2. Redesigned the homepage into a Poki-inspired pure game portal (`poki.com` model): removed marketing text essays and fluff, replaced with a vibrant responsive Bento game grid, category filter tabs (All Games, Popular, New, Cats, Dogs, Puzzles), and instant one-click play.
  3. Extended localStorage progress persistence with game-scoped keys (`pawcade_cat-parking_progress`).
- **Reason:** Users visiting web game portals prioritize instant visual immersion and immediate gameplay over long marketing text. Cat Parking fulfills the feline counterpart theme while validating the multi-game architectural registry.
- **Consequences:** Near-zero initial cognitive load; high replayability across both canine and feline puzzle domains.
- **Reversibility:** High.

## [2026-10-15] DEC-011: 4-Directional Omnidirectional Movement & Target Cow/Milk Parking Emblem
- **Decision:**
  1. **Direct 4-Directional Movement Model:**
     - Replaced tank-style car controls with responsive 4-directional movement:
       - `W` / `Up Arrow`: Move Up (`dy = -1`)
       - `S` / `Down Arrow`: Move Down (`dy = 1`)
       - `A` / `Left Arrow`: Move Left (`dx = -1`)
       - `D` / `Right Arrow`: Move Right (`dx = 1`)
       - Diagonals (e.g. `W+D`, `S+A`): Smooth omnidirectional diagonal movement
       - `Spacebar` / `STOP button`: Active braking and stopping
     - Cow automatically and rapidly aligns its rotation ($16\text{ rad/s}$) to face the movement vector without turning radius drag.
     - Replaced mobile split pedals with an intuitive 3x3 4-way touch D-Pad with central STOP button.
  2. **Target Stall Cow Logo & Milk Emblem (`parking_cow_emblem`):**
     - Painted a designated farm parking floor emblem in each stall featuring an adorable Holstein cow face silhouette (golden horns, floppy ears, spots, eyes, pink snout) and a fresh glass milk bottle (blue cap, "MILK" badge).
     - Framed with checkered hazard perimeter stripes and glowing guide brackets.
     - Dynamically transitions from neutral white/amber to a glowing emerald green aura when parking accuracy reaches $\ge 80\%$.
- **Reason:** Directly fulfills user request for 4-directional movement and a designated cow logo / milk emblem marking the target parking stall.
## [2026-10-15] DEC-012: Movement Optimization (Wall Sliding) & Milk Bottle Collection Mechanic
- **Decision:**
  1. **Movement Optimization & Stutter Elimination ("Takılarak gidiyor" Fix):**
     - **Axis-Separated Collision Resolution (Wall Sliding):** Decoupled X and Y axis collision checks in `engine.ts`. Moving diagonally into a fence/wall now allows sliding smoothly along the unobstructed axis instead of halting dead.
     - **Obstacle-Aware Snout Rotation:** If auto-orienting toward a diagonal vector would embed Bessie's front/horns into a wall, rotation locks parallel to the open axis, allowing butter-smooth wall hugging without catching.
     - **Speed Oscillation Elimination:** Replaced inverted negative bounce loops (`speed = -speed * 0.35`) with wall friction dampening and zero-clamping upon head-on collisions.
     - **React Re-Render Throttling:** Throttled `onStateUpdate` callbacks in `AnimalFarmParkingContainer.tsx` to ~12 FPS (75ms window) while pushing instantly on discrete events (pickup, win, loss). Stopped 60 FPS React DOM thrashing and frame drops.
  2. **Milk Bottle Collection Mechanic:**
     - Added `MilkBottle` entity (`id`, `x`, `y`, `collected`) placed strategically across tricky, winding pasture corners in all 8 levels.
     - Added procedural `milk_bottle_pickup` canvas texture (glass bottle with milk, sky-blue cap, golden halo).
     - Integrated animated bobbing, sweet harmonic arpeggio pickup chime (`D5 -> A5 -> D6`), and floating `+1 🥛` pop particles on collection.
     - Enforced mandatory milk collection rule: Bessie cannot complete the level until all milk bottles in the pasture are collected.
     - Parking stall glows amber/cyan guide if accurate but milk remains uncollected, unlocking the emerald green victory glow only when all milk is secured.
     - Added live `🥛 Milk: x/y` badge to top HUD and victory stats.
- **Reason:** Directly fulfills user request to eliminate stuttering movement and add a collectible milk bottle mechanic before parking.
- **Consequences:** 60 FPS buttery-smooth steering, zero wall snagging, and deeper spatial puzzle challenge.
- **Reversibility:** High.

## [2026-10-15] DEC-013: Milk Bottle Obstacle Clearance & In-Pasture Transparent Stall Badge
- **Decision:**
  1. **Complete Obstacle Clearance for Milk Bottles:**
     - Audited all 8 levels and shifted milk bottles that were touching or aligned directly with obstacle edges (notably `milk_3_3` on the vertical fence in Level 3, and `milk_8_3` on the bottom fence in Level 8).
     - Repositioned all bottles into clear open pasture corridors, guaranteeing $\ge 40\text{px}$ clearance from all obstacles, perimeter fences, and parking stall boundaries.
     - Added an automated test in `engine.test.ts` verifying clearance constraints for every bottle across all levels ($1,438$ assertions total).
  2. **In-Pasture Transparent Milk Counter Badge (`🥛 0/4`):**
     - Mounted a semi-transparent text badge (`rgba(15, 23, 42, 0.52)`) directly beneath the parking stall on the pasture ground.
     - Dynamically displays `🥛 0/X` and updates with a celebratory pulse tween on each pickup (`1/X`, `2/X`).
     - Turns into a glowing emerald badge (`🥛 X/X ✓`, `rgba(5, 150, 105, 0.65)`) once all bottles are collected and the parking stall is ready to complete.
- **Reason:** Directly fulfills user request to remove milk bottles from the front/edges of obstacles and display a transparent `0/4` milk counter right under the parking area.
- **Consequences:** Pristine visual presentation, zero obstacle clipping, and immediate spatial clarity of milk progress right where the player needs to dock.
- **Reversibility:** High.

## DEC-014: Parking Stall Aspect Ratio Alignment & Sideways Parking Prevention
- **Status:** APPROVED
- **Context:** Player reported an anomalous state where Bessie the Cow could sit sideways/perpendicular to the stall with the green box and inner emblem crossing each other at 90 degrees like a plus sign (+).
- **Decision:**
  1. **Stencil Floor Decal Clean-up:** Stripped the hardcoded rectangular background fill and dashed orange outline (`drawRoundRect(ctx, 2, 2, 76, 48, 10)`) from `parking_cow_emblem` in `textures.ts`. The emblem now functions as a clean, transparent floor stencil (cow face + milk bottle) that never conflicts with stall boundary lines.
  2. **Longitudinal Stall Aspect Ratio Normalization:** Corrected Level 3 and Level 5 `parkingSlot` in `levelsData.ts` from `width: 60, height: 100` to `width: 100, height: 60` with corresponding rotations (`-Math.PI / 2` and `Math.PI / 2`). This aligns local length with local forward direction, eliminating the perpendicular (+) crosshair collision between stall and emblem.
  3. **Strict Angular Tolerance Enforcement ($\le 35^\circ$):** In `calculateParkingAccuracy()` in `engine.ts`, if the cow's angular difference from the stall axis (either forward or reverse) exceeds $35^\circ$ ($0.61\text{ rad}$), accuracy returns strictly $0\%$. Sideways / cross-stall parking is completely blocked from qualifying for amber guide, green aura, or level completion.
- **Consequences:** Stall and floor stencil align in all orientations; players must align their vehicle/cow cleanly with the parking bay to pass.
- **Reversibility:** High.

## DEC-015: Dynamic Patrolling Sheep Mechanics (Level 6+) & Farm Bleat Audio
- **Status:** APPROVED
- **Context:** User requested dynamic obstacles starting from Level 6 onwards ("6. leveldan itibaren koyunlar hareket etsin. İlk leveller için sadece iler geri olabilir").
- **Decision:**
  1. **Deterministic Linear Back-and-Forth Patrol Engine:**
     - Added `PatrolConfig` (`axis: 'x' | 'y'`, `min`, `max`, `speed`) to `Obstacle` in `types.ts`.
     - Implemented pure deterministic `updateObstacles(obstacles, elapsedTime)` in `engine.ts` using constant-velocity triangular waves with phase offsets matching initial coords.
     - Automatically updates obstacle rotation (`0` for right, `Math.PI` for left, `Math.PI / 2` for down, `-Math.PI / 2` for up) when turning around at boundaries.
  2. **Level Obstacle Placement (Levels 6, 7, 8):**
     - Levels 1-5: Sheep remain static (e.g. Level 5 stationary sheep pen).
     - Level 6 ("The Barnyard Reverse"): 1 sheep patrolling horizontally across the lower pasture corridor (`x: 240..440, y: 360, v = 46px/s`).
     - Level 7 ("Windmill Crossing"): 1 sheep patrolling horizontally across the western paddock corridor (`x: 80..180, y: 200, v = 44px/s`).
     - Level 8 ("Grand Farm Master"): 2 sheep patrolling distinct sectors (`sheep_patrol_8_1` across the parking approach at `x: 460..560, y: 330`; `sheep_patrol_8_2` across the southern corridor at `x: 90..210, y: 470`).
  3. **Visual & Audio Polish:**
     - Phaser 3 `FarmGameScene` syncs sprite coordinates at 60 FPS with horizontal flipping (`setFlipX`) to prevent upside-down walking, plus cute walking trot bobbing.
     - Added `playSheepBaa()` in `sound.ts`: an expressive procedural farm sheep bleat synth with 14 Hz flutter vibrato, triggered whenever Bessie touches a sheep.
- **Consequences:** Levels 6-8 feature lively, dynamic farm hazards; 100% verified clear of clipping with 25 unit tests (2,586 assertions).
- **Reversibility:** High.

## DEC-016: Sheep Jitter & Tremble Elimination
- **Status:** APPROVED
- **Context:** User reported: "Koyun titriyor, onu bir optimize eder misin" (The sheep is trembling/jittering).
- **Decision:**
  1. **Eliminated State Re-offset Drift in Physics Loop:**
     - In `engine.ts`, `updateObstacles` previously accepted `state.obstacles || level.obstacles`. Because `state.obstacles` contained already-moved positions from prior frames, `startOffset` was recomputed from the live moving coordinate every frame, fighting against `newElapsedTime` and causing severe high-frequency boundary oscillation.
     - Changed base input strictly to `level.obstacles` (the immutable level definition). `startOffset` is now 100% constant and stable for the entire level duration.
  2. **Removed Decimal Quantization Rounding:**
     - Removed `Math.round(currentCoord * 10) / 10`. Coordinates are now smooth, continuous floating-point values, allowing Phaser's Canvas/WebGL renderer to perform natural subpixel interpolation.
  3. **Removed High-Frequency Top-Down Bobbing Jitter:**
     - In `FarmGameScene.ts`, removed the artificial `Math.sin(time * 0.012) * 1.5` vertical displacement on horizontal movement. In a 2D top-down perspective, vertical bouncing across pixel boundaries produced visible shimmering and shuddering. Position is now cleanly set directly to `(obs.x, obs.y)`.
- **Reason:** Provides rock-solid, butter-smooth 60 FPS sheep movement with zero trembling or visual artifacts.
- **Consequences:** Sheep stroll across the farm with crystal-clear stability.
- **Reversibility:** High.

## DEC-017: Farm Tetris Architecture — Hay Silo Progress & Cute Farmer Reaction System
- **Status:** APPROVED
- **Context:** User requested: "Bir tane tetris ekle. Sağ barda samanlar dolsun, patlattıkça blokları saman silosu dolsun. Silonun üstünde bir tane tatlı çiftçi otursun. Blok patlatınca el işareti falan yapsın, wow desin." (Add a Tetris game. On the right bar, hay should fill up; as blocks/lines are cleared, the hay silo fills. A cute farmer should sit on top of the silo. When clearing blocks, he should do a hand gesture and say 'wow').
- **Decision:**
  1. **Pure Modular Tetris Engine (`src/games/farm-tetris/logic/engine.ts`):**
     - Standard 10×20 grid, 7 standard Tetromino types re-themed as farm goods (Hay Bale `O`, Timber Plank `I`, Apple Crate `T`, Cabbage `S`, Pumpkin `Z`, Blueberry `J`, Sweetcorn `L`).
     - 7-Bag randomizer, standard wall kick tests, ghost piece projection, hard drop, soft drop with DAS repeat, hold piece mechanism.
     - Combo scoring ($100 \times \text{level}$ for 1 line, up to $800 \times \text{level}$ for 4-line Tetris).
  2. **Right Sidebar Hay Silo (`siloProgress` & Silo Completed):**
     - Each cleared line adds $10\%$ silo capacity (`SILO_LINES_PER_FILL = 10`).
     - Silo features barn-red wooden siding, steel reinforcement bands, inspection ladder, measurement ticks (25%, 50%, 75%, 100%), and a central observation gauge with golden hay fill tweening smoothly upwards.
     - Upon reaching 100%, the silo seals, increments `silosFilled`, levels up the harvest, speeds up falling crops, and rings a victory farm bell.
  3. **Cute Farmer on Dome & "WOW!" Reactions:**
     - A handcrafted cute farmer in straw hat and denim overalls sits atop the silo dome.
     - Idle state: sits peacefully watching the harvest.
     - Line clear reaction: switches to cheerful waving pose (`farmer_cheer`), bounces enthusiastically via Phaser ease tween, pops up a speech bubble with context-aware harvest text ("WOW! 🌾", "GREAT! 🚜", "AWESOME! 🌽", "SUPER HARVEST! 🌾🌟"), and plays procedural voice synth audio.
  4. **Procedural Formant Voice Synthesis (`sound.ts`):**
     - 0 KB asset payload: Synthesizes a cartoon farmer saying "WOOOW!" using dual bandpass formant filters sweeping vowel formants from /w/ (450Hz) to /o/ (950Hz) back to /w/ (600Hz), coupled with banjo/folk guitar arpeggio scales on line clears.
  5. **Portal Integration:**
     - Registered in `gamesRegistry.ts`, route in `App.tsx`, frame and guides in `GamePage.tsx`, and prominent top hero bento card on `HomePage.tsx`.
- **Consequences:** 100% test pass rate (9 tests, 43 assertions in `engine.test.ts`), 0 KB audio payload, seamless 60 FPS gameplay on desktop and mobile touch devices.
- **Reversibility:** High.

## DEC-018: Elimination of Stuck Farmer WOW Reaction via Explicit Piece Lock State
- **Status:** APPROVED
- **Context:** User reported: "çiftçinin wow takılı kalıyor" (The farmer's "wow" is getting stuck).
- **Root Cause:**
  1. `FarmTetrisScene` evaluated piece locking via `this.gameState.currentPiece !== prevPiece`. However, `movePiece` inside `softDrop` immutably returned a newly allocated piece object on every single step down. Thus, `currentPiece !== prevPiece` evaluated to `true` on every single gravity tick and soft drop frame.
  2. Because `lastLineClear` was never cleared after the first line clear, `onPieceLocked()` was invoked continuously on every downward step, continually re-triggering `triggerFarmerReaction()` and calling `farmerReactionTimer.remove()`. The dismiss timer could never reach its 1400ms duration, permanently locking the speech bubble ("WOW! 🌾") and cheer pose on screen.
- **Decision:**
  1. **Explicit Lock Result from `softDrop`:** Refactored `softDrop` in `engine.ts` to return `{ state: TetrisGameState; locked: boolean }`. Scene now only triggers `onPieceLocked()` when `res.locked === true`.
  2. **Event Consumption Discipline:** In `onPieceLocked()`, immediately consume and clear `lastLineClear: null` so line-clear events cannot re-fire.
  3. **Movement Event Clean-up:** Any piece movement (`movePiece`), rotation (`rotatePiece`), or hold swap (`holdPieceAction`) explicitly clears any lingering `lastLineClear`.
  4. **Robust Dismiss Function:** Added `dismissFarmerReaction()` ensuring sprite pose, position (`y = SILO_Y - 14`), scale, and speech bubble opacity cleanly reset to 0 upon completion, pause, restart, or game over.
- **Consequences:** Speech bubble and cheering farmer cleanly dismiss after 1.1s with zero lingering artifacts; 35 unit tests (2,633 assertions) pass.
- **Reversibility:** High.

## DEC-019: Atmospheric Semi-Transparent Farm Background & Animated Elements
- **Status:** APPROVED
- **Context:** User requested: "Şöyle bir şey yapsak, arka planda şeffaf bir çiftlik versek?" (What if we put a semi-transparent farm in the background?).
- **Decision:**
  1. **Procedural 580×580 Farm Countryside Canvas (`textures.ts`):**
     - Crafted a multi-layered harvest landscape:
       - Twilight-amber sunset sky gradient with glowing sun disc and distant forest mountain ridge.
       - Midground rolling golden wheat hills with classic red gambrel barn, white roof trim, weather vane cupola, white X-braced crossbeam sliding doors, and cozy farmhouse cottage with smoking chimney.
       - Foreground rich green pasture hills with post-and-rail rustic wooden fences, rolled golden hay bales, and leafy apple trees with red apples.
  2. **Semi-Transparent Layering & Depth (`FarmTetrisScene.ts`):**
     - Rendered with atmospheric semi-transparency (`alpha: 0.60`) over the rustic barn wall base (`depth: 1`).
     - Central Tetris grid utilizes semi-transparent dark slate backboard (`alpha: 0.72`, `depth: 2`), allowing the picturesque farm hills and barn to softly shine through beneath the falling blocks without interfering with gameplay contrast.
  3. **Living Animations (Windmill & Clouds):**
     - Added `farm_windmill_blades` sprite at `x: 82, y: 425` with continuous 360-degree rotation tween (18s cycle).
     - Added 2 fluffy cartoon clouds (`farm_cloud_1`, `farm_cloud_2`) drifting across the sky with soft ping-pong easing tweens.
- **Consequences:** Elevates the game's rustic mood and visual delight while strictly preserving puzzle block readability and 60 FPS performance.
- **Reversibility:** High.

## DEC-020: Animal 2048: Mouse to Elephant Game Architecture
- **Status:** APPROVED
- **Context:** User requested: "bir tane 2048 yap fareden file doğru gitsin" (Make a 2048 game evolving from mouse to elephant).
- **Decision:**
  1. **12-Tier Animal Progression Ladder:**
     - 2: 🐭 Mouse (Fare)
     - 4: 🐹 Hamster
     - 8: 🐰 Bunny (Tavşan)
     - 16: 🐱 Cat (Kedi)
     - 32: 🐶 Dog (Köpek)
     - 64: 🦊 Fox (Tilki)
     - 128: 🦌 Deer (Geyik)
     - 256: 🐗 Wild Boar (Yaban Domuzu)
     - 512: 🐻 Grizzly Bear (Ayı)
     - 1024: 🦏 Rhino (Gergedan)
     - 2048: 🐘 Elephant (Fil) — Grand Target!
     - 4096: 🐋 Blue Whale (Mavi Balina) — Endless Mode Bonus!
  2. **Pure TypeScript Engine (`src/games/animal-2048/logic/`):**
     - Completely decoupled mathematical 2048 engine in `engine.ts`:
       - `slideAndMergeLine`: 1D slide, pairwise collapse, and score calculation.
       - `slideGrid`: 4 directions (`up`, `down`, `left`, `right`), merge detection, move validation.
       - `spawnRandomTile`: 90% Mouse (2), 10% Hamster (4).
       - `isGameOver`: full board and zero adjacent matching pairs check.
       - `performMove`: immutable state transitions, 1-step history snapshot for undo, Elephant victory detection.
       - `undoMove`: 1-step undo restore without memory leak.
     - 20 automated unit tests (62 assertions) in `engine.test.ts`.
  3. **Procedural Web Audio Sound Synthesizer (`systems/sound.ts`):**
     - 0 KB asset payload:
       - `playSlide()`: Crisp aerodynamic whoosh.
       - `playMerge(value)`: Dynamic harmonic dual chime scaled to animal frequency (Mouse 680Hz -> Elephant 240Hz).
       - `playElephantFanfare()`: Multi-oscillator brass trumpet slide (140Hz -> 260Hz -> 160Hz) with royal trumpet triad arpeggio (C5, E5, G5, C6).
       - `playMouseSqueak()`: High-pitched tiny squeak on mouse interactions.
       - `playUndo()`: Soft reverse harp chime.
       - `playGameOver()`: Melancholic descending tone.
  4. **Responsive UI & Mobile Gestures (`Animal2048Container.tsx`):**
     - 4x4 animated board with tile pop, new tile scale-in, and score HUD.
     - Keyboard controls (<kbd>Arrow Keys</kbd> + <kbd>WASD</kbd>) with browser scroll lock prevention.
     - Mobile touch swipe listener with 30px threshold + virtual 4-way D-Pad.
     - Animal Evolution Ladder modal displaying progression and unlocked status.
     - Elephant Victory Modal with `canvas-confetti` burst and "Keep Playing" endless mode option.
     - 1-step Undo button on HUD and game over screen.
- **Consequences:** 100% test pass rate across all 5 games (55 tests, 2695 assertions), zero external asset dependencies, 100% responsive on desktop and mobile.
- **Reversibility:** High.

## DEC-021: Flappy Chicken: Wheat Run Architecture & Cluck Audio
- **Status:** APPROVED
- **Context:** User requested: "Şimdi bir tane flappy bird yap tavuk olsun gıdaklasın. Sonunda buğdaya ulaşsın." (Now make a Flappy Bird game with a chicken that clucks, and at the end it reaches the wheat).
- **Decision:**
  1. **Core Flight & Wheat Goal Mechanics (`logic/engine.ts`):**
     - Pure TypeScript flight simulation decoupled from Phaser rendering:
       - Gravity constant `950 px/s^2`, upward flap impulse `-340 px/s`, horizontal scroll `165 px/s`.
       - Circle-to-rectangle collision detection against rustic upper & lower fence posts.
       - Floating golden grain seed bonus pickups in center of each fence gap.
       - Wheat Progress Meter: Tracks gates cleared toward 15-gate goal (`0% ➔ 100%`).
       - Upon clearing gate 15, the Grand Golden Wheat Field & Granary wagon arrives!
       - Passing into the wheat field triggers `wheat_victory`, `hasWon = true`, and celebration state.
     - 11 unit tests in `engine.test.ts`.
  2. **Procedural Chicken Vocalization ("Gıdak! / Bok-bok-bawk!") (`systems/sound.ts`):**
     - 0 KB asset payload:
       - Modeled after real poultry formant tracts using dual bandpass formant filters (850Hz & 1400Hz).
       - 3 alternating vocal cluck variations ("Bok!", "Bok-bawk!", and excited "Gı-dak!").
       - Feathery wing flap noise burst on flap.
       - Triumphant harvest arpeggio + rapid victory cluck sequence ("Bok-bok-bok-GAAAWK!") when reaching the wheat.
       - Comical cartoon squawk on fence or ground collision.
  3. **Visual & Scene Implementation (`scenes/FlappyChickenScene.ts`, `textures.ts`):**
     - Procedurally rendered Clucky the Chicken with 3 flapping wing states (`mid`, `up`, `down`), comb, beak, and falling feather particles.
     - Rustic wooden fence posts with rivets, knots, and ivy leaves.
     - Parallax country farm sky with sunny clouds, distant red barn and windmill.
     - Grand Golden Wheat Wagon with radiant aura, wheat sheaves, and wooden goal sign.
  4. **Responsive Portal Shell (`FlappyChickenContainer.tsx`):**
     - Golden wheat flight progress bar with real-time percentage and distance markers.
     - Desktop controls (<kbd>Spacebar</kbd>, <kbd>Arrow Up</kbd>, <kbd>W</kbd>, Mouse Click) and big mobile touch button.
     - Confetti celebration modal upon reaching the wheat field.
- **Consequences:** 100% test pass rate across all 6 games (66 tests, 2724 assertions), zero asset download penalty, seamless 60 FPS play.
- **Reversibility:** High.

## DEC-022: Pet Candy Crush: Match-3 Mania Architecture
- **Status:** APPROVED
- **Context:** User requested: "bir tane candy crush gibi yapalım" (Let's make a Candy Crush-style game).
- **Decision:**
  1. **Theme & Treat Roster:**
     - 🦴 Bone Biscuit (`bone`): Crisp golden dog treat.
     - 🐟 Fish Gummy (`fish`): Juicy cyan feline gummy.
     - 🧀 Swiss Cheese (`cheese`): Tasty golden cheddar wedge.
     - 🥕 Crunchy Carrot (`carrot`): Bright orange farm carrot.
     - 🍓 Berry Bonbon (`berry`): Sweet strawberry farm candy.
     - 🧁 Paw Cupcake (`cupcake`): Deluxe purple swirl pastry.
  2. **Special Booster Mechanics:**
     - **Match 4:** Creates a Striped Treat (`striped-h` or `striped-v`). When matched, triggers a row or column laser blast clearing all 8 tiles in its line.
     - **Match 5 (L / T Shape):** Creates a Wrapped Bomb (`wrapped`). When matched, detonates a 3x3 blast clearing 9 surrounding tiles.
     - **Match 5 (Linear):** Creates a Rainbow Star (`rainbow`). Swapping it with any treat clears all tiles of that color from the entire board. Swapping two Rainbow Stars together clears the entire 64-tile board (`+3,000 pts`).
  3. **Pure TypeScript Engine (`src/games/pet-candy-crush/logic/`):**
     - Decoupled from rendering:
       - `createInitialBoard`: Generates 8x8 grid guaranteed zero starting matches and guaranteed at least 1 valid swap move.
       - `findMatches`: Scans rows & columns for contiguous runs of 3, 4, 5+ with special treat creation flags.
       - `dropAndFillBoard`: Column gravity simulation dropping remaining tiles down and generating new random treats from the top.
       - `resolveCascades`: Iterative cascade loop resolving chained drops, combo multipliers (`x1`, `x2`, `x3`...), special triggers, and goal updates.
       - `executeSwap`: Coordinates player input swap, validity check, rainbow star blasting, star ratings, move countdown, and win/loss state detection.
     - 11 unit tests in `engine.test.ts`.
  4. **Procedural Web Audio Sound Synthesizer (`systems/sound.ts`):**
     - 0 KB asset payload:
       - `playSwap`: Crisp tactile pop.
       - `playInvalid`: Low rubber bonk.
       - `playMatch(combo)`: Marimba scale chimes pitch-scaled by combo level (C5 ➔ D5 ➔ E5 ➔ G5 ➔ A5 ➔ C6).
       - `playSpecialTrigger(type)`: Whistle beam sweep for striped, resonant bass boom for wrapped bomb.
       - `playRainbowBlast()`: Sparkling ascending arpeggio sweep across 7 harmonic frequencies.
       - `playSugarCrush()`: Triumphant brass fanfare with bell chimes on level victory.
  5. **Responsive UI & Gestures (`PetCandyCrushContainer.tsx`):**
     - 8x8 CSS grid with smooth scaling, selection glow rings, and dynamic floating text for cascades ("Sweet!", "Tasty!", "Delicious!", "Paw-tastic!").
     - Dual interaction model: Click-to-swap selection and touch swipe dragging (30px threshold).
     - Live Goal Tracker (e.g. 12 Bones, 10 Fish), Moves Left gauge (25 max), and 3-Star Score Progress Bar (1★ 1000 pts, 2★ 1800 pts, 3★ 2500 pts).
     - Confetti celebration modal upon completing all goals.
- **Consequences:** 100% test pass rate across all 7 games (77 tests, 2,754 assertions), 0 KB audio files, instant responsive play on mobile and desktop.
- **Reversibility:** High.

## DEC-023: Farm Animal Match Transition & Procedural Animal Vocal Synthesis
- **Status:** APPROVED
- **Context:** User requested: "çiftlik hayvanlarından yapsan olur mu?" (Could you make it with farm animals instead?).
- **Decision:**
  1. **Harmonized Farm Theme & Animal Cast:**
     - Replaced confectionery treats with 6 farm animals consistent with the Pawcade countryside setting:
       - 🐮 **Bessie the Cow** (`cow`)
       - 🐷 **Barnaby Piglet** (`pig`)
       - 🐑 **Woolly Sheep** (`sheep`)
       - 🐔 **Clucky Hen** (`chicken`)
       - 🦆 **Waddles Duck** (`duck`)
       - 🐴 **Clover Horse** (`horse`)
  2. **Thematic Booster Renaming & Mechanics:**
     - Match 4: **Striped Runner** (dashes across row or column with tractor sprint).
     - Match 5 (L/T-shape): **Party Animal** (explodes 3x3 surrounding barnyard radius).
     - Match 5 (Line): **Golden Barn Star** (gathers all matching farm animals from pasture; dual stars trigger 64-tile Mega Barn Harvest).
  3. **Procedural Farm Animal Vocal Synthesizers (`systems/sound.ts`):**
     - Added `playAnimalVocal(animal: AnimalType)` triggered when animals are matched:
       - Cow: Low resonant pitch-bending moo (155Hz ➔ 175Hz ➔ 130Hz with 450Hz lowpass filter).
       - Pig: Cute double cartoon oink snort (420Hz ➔ 280Hz).
       - Sheep: Gentle vibrato bleat (260Hz ➔ 275Hz ➔ 245Hz).
       - Chicken: Quick cheerful bawk chirp (540Hz ➔ 400Hz).
       - Duck: Nasal resonant quack with Q=3 bandpass filter (380Hz ➔ 260Hz).
       - Horse: Playful whinny & gallop warble (460Hz ➔ 620Hz ➔ 340Hz).
  4. **Multi-Route Extensibility (`App.tsx` & `sitemap.xml`):**
     - Handled both `/games/pet-candy-crush/` and `/games/farm-animal-crush/` seamless routing.
  5. **Verification:**
     - 11 unit tests in `engine.test.ts` updated and passing; all 77 tests pass, zero bundle build errors.
- **Consequences:** Deepens ecosystem immersion alongside `Animal Farm Parking`, `Farm Tetris`, and `Flappy Chicken: Wheat Run`.
- **Reversibility:** High.

## DEC-024: 2x2 Square Dynamite Bomb, 4-in-a-Line Rocket, L/T Barrel Bomb & Booster Combos
- **Status:** APPROVED
- **Context:** User requested: "ve sadece 3lü olmasın. 4lü kare, 4lü yan yana onlar da bomba falan ekleyelim mekanik" (Don't make it only 3-in-a-row; add 2x2 square, 4-in-a-row, and bomb mechanics).
- **Decision:**
  1. **2x2 Square Dynamite Bomb (`square_bomb` / 🧨):**
     - `findMatches()` now detects 2x2 squares of 4 identical farm animals (`4'lü Kare`) and crafts a **Square Dynamite Bomb (`square_bomb`)** at the top-left / swapped tile.
     - `createInitialBoard()` forbids 2x2 squares at board generation so no pre-existing 2x2 matches occur on startup.
     - Detonating a `square_bomb` clears a 3x3 cluster + radius-2 Cross (`+`) wave + launches 2 homing strikes on matching animals across the board (15 tiles total!).
  2. **4-in-a-Row Striped Line Rocket (`striped_h` / `striped_v` / ⚡):**
     - Matching 4 in a horizontal or vertical line crafts a Striped Rocket with glowing laser bars and directional badge (`↔️` / `↕️`) that clears an entire row or column.
  3. **L / T Shape Mega Barrel Bomb (`wrapped_bomb` / 💣):**
     - `findMatches()` detects intersecting horizontal and vertical 3+ runs (L or T shapes) and merges them into a single match group that spawns a `wrapped_bomb` (`💣`) at the intersection coordinate, exploding a 3x3 area.
  4. **Direct Double-Tap Detonation & Booster Combos:**
     - Added `detonateSpecialTile(state, r, c)`: double-tapping any bomb or rocket immediately detonates it in-place.
     - Added special-to-special combo swaps in `executeSwap`:
       - `Bomb + Bomb` (`💣`/`🧨` + `💣`/`🧨`) ➔ 5x5 Mega Crater Explosion (25 tiles!).
       - `Striped + Bomb` (`⚡` + `💣`/`🧨`) ➔ 3-Row AND 3-Column Giant Cross Blast!
       - `Striped + Striped` (`⚡` + `⚡`) ➔ Full Row + Full Column Cross Blast!
       - `Golden Barn Star + Bomb/Rocket` (`🌟` + `💣`/`🧨`/`⚡`) ➔ Upgrades every animal of that type on the board into a bomb/rocket and detonates them all!
     - Added BFS chain-reaction resolution (`expandSpecialExplosions`) so any bomb caught inside another bomb's blast automatically detonates in a chain reaction.
- **Consequences:** 81 unit tests (2,770 assertions) pass across all 7 games.
- **Reversibility:** High.

## DEC-025: 3D Jelly/Cushion Block Design, 6 Distinct Color Families & Bubble-Burst Cascade Choreography
- **Status:** APPROVED
- **Context:** User reported: "Bir de renkler karışıyor, ayrıca çok keskin. Bloklar daha 3 boyutlu olsun ve bir şey yan yana gelp patladığında o hissi yaşamalıyız. Başardım gibi. Baloncuk patlaması olaiblir ya da pet rescue - candy crush efektlerini kullanabilirsin".
- **Decision:**
  1. **6 Unmistakable Pet Rescue / Candy Crush Color Families (`types.ts`):**
     - Eliminated overlapping emerald/teal and amber/orange gradients. Each animal now owns a 100% distinct primary/secondary hue with dedicated `topHex`, `bottomHex`, `lipHex`, `innerGlowHex`, and `bubbleColor`:
       - 🐮 Cow: **Sky Sapphire Blue** (`#38bdf8` ➔ `#0284c7`, lip `#075985`)
       - 🐷 Pig: **Strawberry Bubblegum Pink-Red** (`#fb7185` ➔ `#e11d48`, lip `#9f1239`)
       - 🐑 Sheep: **Meadow Apple Green** (`#4ade80` ➔ `#16a34a`, lip `#14532d`)
       - 🐔 Chicken: **Sunny Buttercup Yellow** (`#fde047` ➔ `#d97706`, lip `#92400e`)
       - 🦆 Duck: **Royal Grape Purple** (`#c084fc` ➔ `#7e22ce`, lip `#4c1d95`)
       - 🐴 Horse: **Tangerine Sunset Orange** (`#fb923c` ➔ `#ea580c`, lip `#9a3412`)
  2. **Soft 3D Toy/Jelly Cushion Blocks (`PetCandyCrushContainer.tsx`):**
     - Each block is rendered with rounded cushion geometry (`rounded-[15px]`), a 4px 3D extruded bottom ledge (`0 4px 0 <lipHex>`), inner top/bottom bevel shadows, a curved glossy top specular reflection dome (`from-white/60 via-white/20`), and a top-left jelly shine dot.
  3. **Step-by-Step Bubble-Burst Cascade Playback & Audio (`PetCandyCrushContainer.tsx`, `sound.ts`):**
     - Implemented `playCascadeSteps` to play each cascade step sequentially:
       - **Pop & Bubble Burst Phase (300ms):** Matched blocks swell and pop (`block-pop-burst`) while spawning an expanding glossy bubble shockwave ring (`bubble-shockwave`) and 8 radial flying bubble droplets (`droplet-fly`).
       - **Floating Score Popups:** Spawns a rising `+180` / `MEGA BLAST!` floating score popup at the center of each matched cluster (`score-float-up`).
       - **3D Jelly Drop Bounce (240ms):** Dropping and newly spawned tiles land with an elastic squash-and-stretch bounce (`jelly-drop-bounce`).
       - **Juicy Multi-Bubble Pop Audio (`playMatch`):** Synthesizes rapid upward frequency-swept bubble pops ("blop-pop-pop!") layered with ascending major triad marimba/bell chords, plus screen micro-shake (`tray-shake`) and mini confetti bursts on big combos.
- **Consequences:** Immediate visual clarity across all 6 animal blocks, tactile 3D depth, and deeply rewarding pop feedback.
- **Reversibility:** High.

## DEC-026: Dedicated Standalone 3D Booster Boxes (Dynamite Crate, Bomb Box, Rocket Crate & Star Chest)
- **Status:** APPROVED
- **Context:** User requested: "Bunlar ayrı kutular olarak gelsin. Dinamitin yıldızın ayrı kutusu olsun" (Let these come as separate boxes. Dynamite and Star should have their own separate boxes).
- **Decision:**
  1. **Standalone Booster Box Rendering (`PetCandyCrushContainer.tsx`):**
     - Replaced animal-face overlays on special tiles with dedicated, self-contained 3D booster crates:
       - 🧨 **Dynamite Crate (`square_bomb`)**: Crimson-red 3D hazard box (`#ef4444` ➔ `#7f1d1d`, lip `#450a0a`) with yellow/black diagonal hazard stripes, corner rivets, and `TNT 2x2` label.
       - 🌟 **Star Chest (`color_bomb`)**: Royal gold-and-violet treasure chest (`#fde047` ➔ `#a855f7`, lip `#4c1d95`) with spinning conic sunbeams and `STAR` badge.
       - 💣 **Mega Bomb Box (`wrapped_bomb`)**: Dark steel-and-amber ordinance crate (`#f97316` ➔ `#431407`, lip `#1c1917`) with metallic corner bolts and `BOMB 3x3` badge.
       - ⚡ **Line Rocket Box (`striped_h` / `striped_v`)**: Electric cyan propulsion crate (`#06b6d4` ➔ `#1d4ed8`, lip `#172554`) with glowing laser beam bar and `ROW ↔` / `COL ↕` label.
- **Consequences:** Boosters stand out immediately on the board as distinct, high-value power-up crates.
- **Reversibility:** High.

## DEC-027: Classic Candy Crush UI Layout, Sculpted Organic 3D Shapes, Locked X-Cage Levels & Right-Side Golden Hay Thermometer
- **Status:** APPROVED
- **Context:** User uploaded a reference screenshot of classic *Candy Crush Saga* and requested: "This is candy crush. Kenarlar keskin değil, renkler ilgi çekici ve bazı kutular kilitli. Levellarda bunlar gelsin, ui aynı candy crushtaki gibi olsun. Sağda puan yerine hay biriktireliim".
- **Decision:**
  1. **Sculpted Organic Non-Sharp 3D Candy Shapes (`CandyShapeType`):**
     - Replaced uniform rectangular blocks with 6 distinct, rounded organic candy silhouettes floating inside a translucent blue-glass grid (`rgba(29, 78, 216, 0.45)`):
       - 🐮 Cow: **3D Glossy Sphere** (`border-radius: 50%`, radial sphere lighting)
       - 🐷 Pig: **3D Jelly Bean Pill** (`border-radius: 46% 54% 48% 52% / 56% 44% 56% 44%`)
       - 🐑 Sheep: **3D Soft Pillow Cushion** (`border-radius: 38%`)
       - 🐔 Chicken: **3D Golden Teardrop Candy** (`border-radius: 50% 50% 42% 58% / 58% 58% 42% 42%`)
       - 🦆 Duck: **3D Royal Grape Cluster** (`border-radius: 44% 56% 44% 56% / 56% 44% 56% 44%`)
       - 🐴 Horse: **3D Tangerine Lozenge Drop** (`border-radius: 52% 48% 52% 48% / 42% 58% 42% 58%`)
  2. **Locked X-Cage Tiles (`isLocked`) & Hay Swirl Blockers (`swirl`) Across Levels 1–6:**
     - Added `LEVEL_CONFIGS` (Levels 1–6) featuring level-specific X-Cage Locked tiles and Swirl blockers.
     - Locked tiles (`isLocked: true`) render with a crossed iron X-Cage overlay, metallic corner bolts, and center padlock badge (`🔒`).
     - Locked tiles cannot be swapped directly and stay anchored during gravity drops (`dropAndFillBoard`), but matching with them, matching orthogonally adjacent to them (`applyAdjacentBlockerAndLockDamage`), or hitting them with a bomb or Hammer booster shatters the X-Cage lock (`locksCleared`).
  3. **Authentic 3-Column Candy Crush UI & Right-Side Golden Hay Silo Thermometer:**
     - **Left Candy-Striped Panel**: Features 3 glossy green 3D booster buttons at the top (`🔨 Hammer`, `+5 Moves`, `🔀 Shuffle`), the pink/white striped **Level Targets Box** (animal targets + `🔒` lock target), and the **Moves & Hay** counter panel.
     - **Center Board**: Translucent frosted blue-glass 8×8 grid with bottom green exit arrows over a sunny countryside backdrop.
     - **Right Vertical Golden Hay Thermometer (`🌾 Hay Silo`)**: Candy-striped vertical thermometer tube that fills from bottom to top with animated golden hay as cascades occur, complete with 3 Star milestone badges (`★`, `★`, `★`) and live hay bale counter.
- **Consequences:** 83 unit tests (2,777 assertions) pass across all 7 games; production build verified clean.
- **Reversibility:** High.

## DEC-028: Blurred Farm Landscape Backdrop, Warm Farm UI Palette, 3D Farm Silo Tower, 1-Charge Monetization Boosters & 12-Level Caged Animal Rescue Pool
- **Status:** APPROVED
- **Context:** User requested:
  1. "tamam şimdi arka plana blurlu çiftlik görseli, pembe olan uiların hepsini çiftlik renkleri, sağdaki yere silo"
  2. "şu an level 1'dan level 2'ye direkt geçiliyor o level bitmeden kapalı olsun; sol üstteki haklar başta 1 tane olsun, ayrıca shuffle hakkı da 1 tane olsun. oraları sonra monetizasyon için kullanabiliriz; Harvest targets şöyle olsun, kafeste olan hayvanları kurtaralım. Başta 1 -5 arası yeter. Sen eğlence-challenge eğrisine göre optimal bir level havuzu üret."
- **Decision:**
  1. **Blurred Farm Landscape Illustration & Warm Timber/Parchment UI:**
     - Replaced all pink Candy Crush UI with `.farm-wood-frame` oak/amber timber frames, warm parchment cards (`bg-amber-50`), and barn-red badges (`bg-red-700`).
     - Added a full-bleed SVG farm landscape illustration with depth-of-field blur (`blur(4px) scale(1.06)`) featuring a red gambrel barn, windmill, golden wheat hills, hay bales, and wooden fences.
  2. **Right-Side 3D Architectural Farm Silo (`🌾 SILO`):**
     - Replaced the thermometer with a 3D barn-red stave Silo featuring a cupola ventilator cap, ribbed galvanized steel dome roof, steel hoop bands, side inspection ladder, central sight-glass window with rising golden straw, 3 star milestone badges, and concrete foundation base.
  3. **Level Progression Gate (`unlockedMaxLevel`):**
     - Next levels remain locked (`🔒`) until the current level is completed. Progress persists in `localStorage` (`pawcade_farm_crush_unlocked_level`).
  4. **Monetization-Ready 1-Charge Boosters (`Hammer: 1`, `+5 Moves: 1`, `Shuffle: 1`):**
     - All 3 top-left green booster buttons start with `1` charge per level, displaying a red counter badge (`1` ➔ `0`) and disabling once spent.
  5. **12-Level Caged Animal Rescue Curve (`LEVEL_CONFIGS`):**
     - Levels 1–6 scale smoothly from **1 to 5 Caged Animals** (`LockedCellConfig` with specific `animal` species); Levels 7–12 scale from **5 to 8 Caged Animals** with strategic Hay Swirl blockers.
     - Left `🔓 Harvest Targets` panel displays each caged animal species (`🐮🔒 0/1`, `🐷🔒 0/1`, etc.) and updates live as cages are broken. Rescuing all caged animals completes the level and converts remaining moves into a Harvest Silo Bonus (`movesRemaining * 60` Hay).
- **Consequences:** 85 unit tests (2,916 assertions) pass across all 7 games; production build verified clean.
- **Reversibility:** High.

## DEC-029: Platform-Wide Halloween Spooktacular Overhaul
- **Status:** APPROVED
- **Context:** User requested: "Tüm siteyi halloween şeklinde günceller misin?" (Can you update the whole site to a Halloween theme?)
- **Decision:**
  1. **Atmospheric Dark Spooky Palette & Typography:**
     - Platform base transitioned to midnight void `bg-slate-950` with spooky accents: Glowing Pumpkin Orange (`#f97316`), Witch Cauldron Purple (`#7e22ce`), and Eerie Ghost White.
     - Custom CSS utility classes added in `globals.css`: `.animate-spooky-float`, `.animate-spooky-pulse`, `.glow-pumpkin`, and `.glow-witch`.
  2. **Portal Identity & Branding:**
     - Favicon set to SVG 🎃 Jack-o'-Lantern with glowing eyes.
     - Document title updated to `Pawcade Spooktacular 🎃 — Free Halloween Browser Games Online`.
     - Header transformed with glowing pumpkin mascot, `PAWCADE HALLOWEEN 🦇` badge, and `Spooky Free Pet Games • Trick or Treat 🍬` tagline.
     - Spooky mobile navigation drawer featuring all 8 games with orange/purple badges.
  3. **Poki-Style Bento Homepage Grand Event Transformation:**
     - Added dedicated `🎃 Spooky (Halloween)` category filter pill.
     - Grand Halloween Event Hero Banner with interactive CTA.
     - Bento game cards restyled with dark midnight slate, glowing pumpkin borders, and Halloween badges for all 8 games.
  4. **Universal In-Game Shell Ribbon:**
     - In `GamePage.tsx`, every playable game displays the `🎃 HALLOWEEN SPECIAL EVENT: Spooky Mode Active!` ribbon above the game canvas with dark themed Controls & How-to-Play cards.
  5. **In-Game Halloween Visuals (Duck Runner):**
     - Quacky the Duck wears an animated pointed Witch Hat (wide purple brim, curved tip, orange band, gold buckle) in standing, running, jumping, and crouching modes.
     - Hay bales procedurally replaced with single and double carved Jack-o'-Lanterns (🎃) featuring glowing yellow/orange eyes and toothy grins.
     - Rustic wooden fence posts decorated with haunted white cobwebs (🕸️) and hanging spiders.
     - Flying crows procedurally replaced with midnight vampire bats (🦇) with pointy ears, sharp fangs, and scalloped wings.
     - Starry midnight twilight sky with craters on a glowing Harvest Full Moon.
- **Consequences:** 101 unit tests (2,960 assertions) pass across 8 test suites; production build verified clean (`vite build`).
- **Reversibility:** High.

## DEC-030: Farm Mini Mart: Animal Market Arcade Idle Tycoon Game
- **Status:** APPROVED
- **Context:** User requested: "Bir tane mall oyunu yapmy mini mart oyunu yap. Çitlik içinde geçsin." (Make a mall / mini mart game set on a farm.)
- **Decision:**
  1. **Core Loop & Mechanics:**
     - Inspired by "My Mini Mart" and arcade idle tycoon games with 100% original farm/animal theming.
     - 5 harvestable crops/produce: 🍅 Tomatoes, 🌽 Corn, 🥚 Fresh Eggs, 🥛 Dairy Milk, and 🎃 Halloween Pumpkins.
     - Physical vertical item stack carried by the player farmer with capacity limits and physics sway.
     - Wooden display stands / shelves stocked by walking near them.
     - Animal customer AI (Bunnies 🐰, Cats 🐱, Dogs 🐶, Bears 🐻, Pigs 🐷, Ghosts 👻) with thought wishlists, picking items from shelves, and waiting in queue lines at the Cash Register.
     - Cash Register counter checkout: Serving customers generates golden coin drops and "ka-ching! 🔔" register bell chimes.
     - Floor unlock pads: Stepping onto pads rapidly deposits coins until the threshold is met, triggering celebration confetti and unlocking new plots, shelves, or workers.
  2. **Automation & Upgrades:**
     - Walking Speed & Carry Stack Capacity upgrades (Level 1..5) with exponential cost curve.
     - Autonomous Farmhand Dog 🐶: Trots between ready plots and empty shelves, harvesting and restocking automatically.
     - Automated Cashier 🧑‍💼: Automatically checks out customers at the register.
  3. **Control Ergonomics:**
     - Desktop: WASD / Arrow keys movement with auto-action upon proximity.
     - Mobile: 360° dynamic floating virtual joystick appearing wherever the thumb touches, zero touch delay, 44x44px touch targets.
  4. **Architecture & Audio:**
     - Pure TypeScript simulation state (`engine.ts`) with 18 automated unit tests.
     - Procedural Web Audio API sound engine (`sound.ts`) with harvest plops, shelf thumps, coin clicks, brass unlock fanfare, and cash register ka-ching.
     - Canvas 2D 60 FPS rendering with layered shadows, customer bubbles, floating coin notifications, and festive Halloween witch hats.
- **Consequences:** 119 unit tests (3,016 assertions) pass across 9 test suites; production build verified clean (`vite build`).
- **Reversibility:** High.

## DEC-031: Farm Mini Mart & 9-Game Portal Responsive Mobile QA & Touch Joystick Optimization
- **Status:** APPROVED
- **Context:** Mobile Web QA audit covering responsive viewports (320px - 430px), single-screen zero-scroll HUDs, touch joystick ergonomics, and cross-game regression across all 9 portal titles.
- **Decision:**
  1. **Touch Joystick Coordinate Space Normalization:**
     - Identified coordinate mismatch in `FarmMiniMartContainer.tsx`: touch client coordinates were stored in CSS pixels but rendered in internal 800x600 canvas coordinate space, displacing the floating joystick indicator from the user's thumb on mobile screens.
     - Implemented dynamic canvas coordinate scaling (`scaleX = 800 / rect.width`, `scaleY = 600 / rect.height`).
     - Upgraded touch handlers to HTML5 Pointer Events (`onPointerDown`, `onPointerMove`, `onPointerUp`, `onPointerCancel`) with `setPointerCapture`, ensuring zero-loss tracking even if the thumb slides outside the canvas edge and adding fluid mouse drag support on desktop.
     - Calibrated base outer radius (50 canvas px) and cap radius (22 canvas px) with max distance 45 canvas px and 6px deadzone.
  2. **Mobile Master HUD Micro-Optimization:**
     - Refactored `FarmMiniMartContainer` top HUD for narrow mobile viewports (320px - 380px): hid non-essential "OPEN" indicator on small screens, made the "UPGRADES" button label compact (`UPG` on `< xs`), ensured all touch targets maintain `>= 44x44px` accessibility sizing, and eliminated unwanted wrapping/overflow.
  3. **GamePage & Portal Consistency Polish:**
     - Fixed `GamePage.tsx` category tag to properly identify `farm-mini-mart` as `🏪 Farm Mini Mart Tycoon` instead of falling through to `🦴 Ghost Pup Puzzle`.
     - Added dedicated 5-point "How to Win" rules section for Farm Mini Mart in `GamePage.tsx`.
     - Harmonized Homepage Grand Event Banner badge to reflect `🍬 9 Spooky Games Online`.
- **Consequences:** 119 automated unit tests (3,016 assertions) pass across 9 test suites; TypeScript typecheck exits with 0 errors; production Vite build completes in ~2.6s.
- **Reversibility:** High.




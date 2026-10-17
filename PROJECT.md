# PROJECT.md — Dog Parking & Browser Game Portal Specification

## 1. Product Vision
Build a high-retention, delightful browser puzzle game called **Dog Parking** and establish a modular, scalable web game portal foundation (inspired by Poki's discoverability and lightweight web-first UX, but with 100% original identity, art, and mechanics).

## 2. Target Audience & Initial Market
- **Target Audience:** Casual puzzle gamers, pet lovers, commuter/break players seeking instant-play, zero-install 2-5 minute puzzle sessions.
- **Initial Market:** United States (desktop & mobile web).

## 3. Game Portfolio
1. **Dog Parking (`/games/dog-parking/`):**
   - Rush Hour / Parking Jam hybrid — slide dogs (Corgi, Pug, Shiba, Dachshund, etc.) along their axes to clear the exit gate for Sunny the Star Dog.
   - 12 handcrafted, mathematically proven solvable levels.
2. **Cat Parking (`/games/cat-parking/`):**
   - Feline sliding puzzle — untangle sleepy cats (Maine Coon, Siamese, Calico, Persian, etc.) and guide Luna the Star Cat to the cozy cat flap.
   - 12 handcrafted, mathematically proven solvable levels with custom cat audio.
3. **Animal Farm Parking (`/games/animal-farm-parking/`):**
   - Top-down 4-directional WASD/touch precision driving game — control Bessie the Cow to collect fresh milk bottles and dock into marked checkered farm stalls with cow & milk emblem.
   - Smooth axis-separated physics with obstacle-aware wall sliding (stutter-free 60 FPS).
   - Collectible Milk Bottle mechanics: player must gather all pasture milk bottles placed across tricky obstacles to unlock the parking stall.
   - Requires $\ge 80\%$ parking accuracy and full stop.
   - Continuous collision damage ($28\%/\text{sec}$) against fences, tractors, hay bales, and sheep with live health percentage gauge.
   - 8 progressive handcrafted levels with procedural cow moos, hoof trotting, milk pickup chimes, cowbells, and victory fanfare.

4. **Farm Tetris (`/games/farm-tetris/`):**
   - Harvest-themed falling block puzzle — stack hay bales, apple crates, cabbages, pumpkins, blueberries, and corn to clear rows.
   - **Right Sidebar Hay Silo:** Progressive golden hay fill meter that rises as lines are cleared (10% capacity per line cleared). Filling the silo to 100% completes the silo, increases level, and rings a harvest bell.
   - **Cute Cheering Farmer on Dome:** Animated farmer sitting atop the silo dome perks up, bounces, waves enthusiastically, pops up harvest speech bubbles ("WOW! 🌾", "GREAT! 🚜", "SUPER HARVEST! 🌾🌟"), and cheers with vocal procedural formant synth audio ("WOOOW!").
   - Authentic Tetris engine: 7-bag randomizer, wall kicks, ghost projection, soft drop, instant hard drop slam, and hold action.
   - Flying straw particles exploding from cleared lines into the silo.

5. **Animal 2048: Mouse to Elephant (`/games/animal-2048/`):**
   - 4x4 slide-and-merge animal evolution puzzle — slide tiles in 4 directions to merge matching creatures.
   - **12-Tier Animal Progression Ladder:** 🐭 Mouse (2) ➔ 🐹 Hamster (4) ➔ 🐰 Bunny (8) ➔ 🐱 Cat (16) ➔ 🐶 Dog (32) ➔ 🦊 Fox (64) ➔ 🦌 Deer (128) ➔ 🐗 Wild Boar (256) ➔ 🐻 Grizzly Bear (512) ➔ 🦏 Rhino (1024) ➔ **🐘 Elephant (2048 Grand Target)** ➔ 🐋 Blue Whale (4096 Bonus Titan).
   - **Rich Interactive Features:** Procedural Web Audio sound system (mouse squeak, pitch-scaled merge chimes, royal brass trumpet fanfare on Elephant reaching, reverse harp undo, sad game over chime), 1-step undo, animated tile scaling & merge pop, animal evolution ladder modal, desktop keyboard & mobile touch swipe gesture controls with virtual D-Pad.

6. **Flappy Chicken: Wheat Run (`/games/flappy-chicken/`):**
   - Farm-themed flight arcade game — guide Clucky the Chicken flapping and clucking through rustic farm fence gates.
   - **Authentic Chicken Vocalization ("Gıdak! / Bok-bok-bawk!"):** Formant-modeled procedural audio with 3 cartoon cluck variations on wing flaps.
   - **Flight to Golden Wheat Progress Meter:** Real-time distance bar (0% ➔ 100%) tracking progress toward clearing 15 farm gates to reach the grand Golden Wheat Field & Granary (`🌾`).
   - **Harvest Pickups & Celebration:** Floating golden grain seeds in gate openings, triumphant harvest fanfare, confetti explosion, and victory feast celebration when reaching the wheat.

7. **Farm Animal Match: Barnyard Crush (`/games/pet-candy-crush/` & `/games/farm-animal-crush/`):**
   - 8x8 Farm Animal Match-3 puzzle — swap cute farm animals to create runs of 3, 4, or 5+.
   - **Farm Animal Cast:** 🐮 Bessie the Cow, 🐷 Barnaby Piglet, 🐑 Woolly Sheep, 🐔 Clucky Hen, 🦆 Waddles Duck, 🐴 Clover Horse.
   - **Barnyard Boosters & Special Animals:**
     - Match 4: Striped Runner (dashes across full row or column with tractor sprint).
     - Match 5 (L/T-shape): Party Animal (explodes 3x3 surrounding barnyard radius).
     - Match 5 (Line): Golden Barn Star (gathers all of target animal from the pasture, or triggers a 64-tile Mega Barn Harvest when swapped with another star).
   - **Dynamic Cascade & Combo System:** Gravity tile drops, combo multiplier announcements ("Nice!", "Sweet Harvest!", "Farmtastic!", "Barnyard Bonanza!"), procedural animal vocal synthesizers (Moo, Oink, Baa, Bawk, Quack, Whinny), confetti celebrations, 25-move limit, 3-star rating gauge, and collectible animal rescue goals.

8. **Duck Runner: Vampire Quack (`/games/duck-runner/`):**
   - Offline T-Rex infinite runner reimagined with Quacky the Duck in a festive Halloween witch hat.
   - Jump over carved Jack-o'-Lanterns and haunted cobweb fence posts; duck flat to slide under midnight vampire bats.
   - In-air fast fall physics, progressive running speed, day-to-night starry sky transitions, retro 100-point milestone chimes, and dual mobile thumb controls (Duck & Jump).

9. **Farm Mini Mart: Animal Market (`/games/farm-mini-mart/`):**
   - "My Mini Mart" style arcade idle tycoon set in a countryside farm.
   - Grow & harvest 5 crops (Tomatoes, Corn, Eggs, Milk, Pumpkins), stack items in hands, stock wooden display stands.
   - Animal customer AI (bunnies, cats, dogs, bears, pigs, ghosts) shopping and queuing at the Cash Register.
   - Cash register checkout with gold coin drops, upgradeable walking speed, carry capacity, autonomous Farmhand Dog helper 🐶, and automated Cashier 🧑‍💼.

## 4. Technology Stack
- **Language:** TypeScript 5.x (`strict: true`)
- **Runtime & Tooling:** Bun 1.4+ (runtime, package manager, test runner), Vite 5.x (fast bundling, HMR)
- **UI & Portal Shell:** React 18, Lucide React (clean SVGs), Tailwind CSS v4, canvas-confetti
- **Game Engine:** Phaser 3.90 (Dog/Cat/Farm Parking, Farm Tetris, Flappy Chicken), Pure React/CSS Canvas & Grid Engines (Animal 2048, Farm Animal Match)
- **Audio:** Web Audio API procedural sound synthesizers (barks, meows, moos, hooves, milk pickup chimes, success jingles, cowbells, banjo arpeggios, vocal formant "WOW!" synth, animal tier chimes, elephant brass fanfare, cartoon chicken clucking synth, animal vocal accents [moo, oink, baa, bawk, quack, whinny], marimba cascade chimes, pop sounds, barn star blast, harvest fanfare) — zero external sound assets needed, 100% reliable offline.
- **Persistence:** Browser `localStorage` for game-scoped progress, star ratings, audio preferences, and high scores.

## 5. Monetization Roadmap
- **MVP:** No ads, zero friction, instant loading.
- **Phase 2 (Growth):** Non-intrusive rewarded video / interstitial points between level packs, rewarded hints, banner placements reserved in web shell outside gameplay area.

## 6. Non-Goals & Deferred Features
- No backend servers, user auth, or cloud database in MVP.
- No heavy 3D or bloated asset packs.
- No invasive tracking or GDPR/COPPA-violating analytics.

## 7. Current Implementation Status
- **Dog Parking:** Complete (12 verified levels, BFS solver, procedural audio, tutorial guides).
- **Cat Parking:** Complete (12 verified levels, BFS solver, procedural meows, cozy art).
- **Animal Farm Parking:** Complete (8 levels, 4-way cow physics, wall sliding, dynamic patrolling sheep in Level 6+, collectible milk bottles, % accuracy, continuous collision damage, procedural moos, sheep bleats, chimes & bells).
- **Farm Tetris:** Complete (Authentic Tetris engine, 7 farm tetrominoes, hay silo progress, cute cheering farmer with "WOW!" formant synth, flying straw particles, desktop & mobile touch controls).
- **Animal 2048: Mouse to Elephant:** Complete (Pure TypeScript 2048 engine, 12 animal tiers, slide/merge mechanics, royal elephant fanfare, confetti celebration, 1-step undo, touch swipe & virtual D-Pad, 20 automated unit tests).
- **Flappy Chicken: Wheat Run:** Complete (Pure TypeScript physics engine, 11 automated unit tests, animated Clucky sprite with falling feathers, procedural cartoon chicken clucking synth, 15-gate wheat goal with progress meter, grand wheat field victory celebration).
- **Farm Animal Match: Barnyard Crush:** Complete (Pure TypeScript 8x8 match-3 engine, 6 farm animals [cow, pig, sheep, chicken, duck, horse], procedural vocal synths, striped runner/party animal/golden barn star boosters, cascading gravity, combo multipliers, touch swipe & click swap, 11 automated unit tests).
- **Portal Shell:** Poki-inspired pure game grid homepage, instant search & category filters (All Games, Popular, New, Farm, Cats, Dogs, Puzzles), 100% English across the platform.
- **Test Suite:** 86 automated unit tests passing across 7 files (2920 assertions), production build verified.
- **Repository:** `https://github.com/Mujukko/pawcadegames` (Continuous Deployment active via Cloudflare Workers / Pages).
- **Live Deployment:** `https://pawcadegames.aras-sayin.workers.dev/` (Global edge CDN, native SPA routing, HTTP/2).

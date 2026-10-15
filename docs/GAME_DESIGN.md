# GAME_DESIGN.md — Dog Parking Game Design Document

## 1. Concept Summary
**Dog Parking** is a joyful spatial traffic-puzzle game. Instead of generic cars, players slide adorable dog breeds (Corgis, Dachshunds, Pugs, Shiba Inus, Golden Retrievers) along parking lanes to help the Lead Dog (or all dogs) safely escape through the kennel gate.

## 2. Core Mechanics
- **Grid:** Typically 6×6 parking yard with marked perimeter borders and designated exit gates.
- **Dog Units:**
  - **Size 2 (Pups):** Occupies 2 adjacent tiles (horizontal `2×1` or vertical `1×2`).
  - **Size 3 (Hounds):** Occupies 3 adjacent tiles (horizontal `3×1` or vertical `1×3`).
  - **Orientation Lock:** Dogs can only slide forward and backward along their longitudinal axis (like cars in a tight lot).
  - **The Star Dog ("Hero Dog" / Golden Corgi):** Marked with a golden collar / star badge. The primary objective is to clear a path so this dog can drive/slide out through the gate on the right (row 2 or 3).
  - **Bonus Objective / Full Clear:** In later levels, clearing secondary dogs or parking them into matching breed spots awards 3 stars.
- **Collisions & Constraints:**
  - Dogs cannot pass through other dogs or static obstacles (fire hydrants, bone crates, dog fences).
  - Dogs cannot slide past the grid boundary unless exiting through the matching open gate.
- **Solvability:**
  - Every level is strictly deterministic and verified by an automated BFS (Breadth-First Search) solver to ensure a guaranteed solution exists.

## 3. Controls & Usability
- **Desktop:**
  - Click & drag along the dog's allowed axis.
  - Arrow keys / WASD to move the currently selected dog.
  - 'R' for instant restart, 'Z' for undo.
- **Mobile:**
  - Touch swipe along the dog's axis with touch-action: none on the canvas to prevent scrolling.
  - Haptic feedback / audio click on snap.
  - Large button hit targets (min 48px) for mobile thumbs.

## 4. Visual & Audio Aesthetics
- **Palette:** Warm, friendly tones — grass green borders, warm cream/amber parking slots, pastel coats (honey gold, fawn, charcoal pug, cream shiba).
- **Juice & Polish:**
  - Eye blinks, ear wiggles on tap.
  - Bouncy spring tween when bumping against an obstacle.
  - Cheerful tail wagging when reaching the exit gate.
  - Confetti burst + celebratory bark arpeggio on level victory.
- **Audio:** Procedural Web Audio API sound generator:
  - Slide whoosh: filtered noise / low frequency pitch sweep.
  - Collision bump: soft thud.
  - Tap / Select: friendly pop / chirp.
  - Exit / Level Clear: joyful 4-note ascending chord with happy bark.

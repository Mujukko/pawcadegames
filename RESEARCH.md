# RESEARCH.md — Market, Product & SEO Hypotheses

## 1. Organic Search & Casual Web Game Discovery (US Market)
- **Question:** How do web gaming portals (e.g. Poki, CrazyGames, Coolmath Games) capture organic US traffic for puzzle games?
- **Source & Date:** Web game market observations, 2026.
- **Key Finding:** Top search queries revolve around genre + mechanic + theme (e.g. "parking jam online", "dog puzzle game", "unblock car puzzle free"). Landing pages that offer instant in-browser play, clear how-to-play instructions, rich schema markup (e.g., `SoftwareApplication` / `VideoGame`), and fast mobile load times rank significantly better and convert traffic into repeat plays.
- **Confidence Level:** High.
- **Implication for Dog Parking:** 
  1. Title tags and meta descriptions must emphasize "Free online dog parking puzzle game", "No download", "Play in browser".
  2. The game landing page must include semantic sections (`<h2>How to Play</h2>`, `<h2>Game Features</h2>`, `<h2>Controls</h2>`) so web crawlers index meaningful content while users see an uncluttered, immediate play experience.

## 2. Core Loop Retention Hypotheses
- **Hypothesis 1:** Bite-sized levels (30s to 90s) with 3-star ratings or move targets drive higher session completion and replay rates.
- **Hypothesis 2:** Distinct dog personalities (Golden, Corgi, Shiba, Dachshund, Dalmatian) with responsive micro-animations (wagging tail, eye blinks, barking sounds) create positive emotional resonance compared to generic vehicle blocks.
- **Validation Method:** Track `level_completed`, `level_restarted`, and session duration in analytics event pipeline.

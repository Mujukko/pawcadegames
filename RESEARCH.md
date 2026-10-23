# RESEARCH.md — Competitive UI/UX Research & Market Architecture

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

---

## 3. Reference Competitive UI/UX Research: AddictingGames vs. CrazyGames

**Author:** Principal UI/UX Designer & Visual Design Lead  
**Scope:** Desktop & Mobile Experience Audit of `AddictingGames.com` and `CrazyGames.com`  
**Purpose:** Identify architectural patterns, interaction flaws, and design opportunities for Pawcade's US portal.

---

### Comparative Evaluation Matrix Across 12 Critical Dimensions

| Dimension | AddictingGames.com Observation | CrazyGames.com Observation | Pawcade Opportunity & Recommendation |
| :--- | :--- | :--- | :--- |
| **1. Header & Navigation** | Sticky top bar with heavy dark theme, brand logo, search trigger, category links, login CTA, and hamburger menu on mobile. | Sleek, compact top bar with left expandable drawer; high visual contrast; persistent logo and instant search box. | **Unified Slim Header:** Logo, persistent instant search, sound toggle, and compact category pills. Zero cognitive friction. |
| **2. Search Placement & Behavior** | Search icon opens a modal overlay or text box; autocomplete can feel slow with cluttered suggestions. | Prominent search bar in header with instant keystroke filtering, showing game thumbnails and tags live. | **Instant Keystroke Filter:** Header search input filtering all 9 games with live matching titles and tags in < 50ms. |
| **3. Category Discovery** | Horizontal text links + heavy dropdowns. Cluttered with retro sub-genres (Action, Puzzle, Funny, Sports). | Horizontal scrolling pill/chip bar at the top with clean icons (🧩 Puzzle, 🚜 Farming, 🚗 Driving, ⚡ Arcade). | **Interactive Pill Bar:** Horizontal scrollable category chips (`All`, `Puzzle`, `Casual`, `Arcade`, `Tycoon`, `Runner`) with tactile active states. |
| **4. Featured Games / Hero** | Large 16:9 carousel banner taking significant vertical fold before the first game grid is visible. | Asymmetrical Bento-style grid with a 2x2 large hero card blending seamlessly into smaller game tiles. | **Integrated Bento Spotlight Card:** First game slot features a 2x-width Spotlight Hero with prominent Play CTA, badge, and animated pulse. |
| **5. Game-Card Hierarchy** | Dense rectangular cards; title on dark overlay; star rating; ad badges. Image crops vary widely. | Square to 4:3 cards with rounded corners (16px), subtle hover zoom (scale 1.05), border glow, and video/GIF hover preview. | **Polished Tactile Card:** Uniform aspect ratio, vibrant original gradient/art, clear title badge, rating pill, hover lift (-4px), and Play button overlay. |
| **6. Popular & New Sections** | Tabbed or stacked vertical shelves ("Hot Games", "New Games", "Weekly Picks"). | Dynamic categorized shelves ("Featured", "Trending Now", "Updated This Week", "Casual Puzzles"). | **Curated Categorized Sections:** "⭐ Featured Spotlight", "🔥 Most Popular in US", "🧩 Brain & Puzzle Quests", "🌾 Farm & Idle Fun". |
| **7. Game-Page Layout** | Game canvas centered but surrounded by multiple ad banners (leaderboard, skyscraper, bottom banner). | Dark theater mode (`slate-950`), full-width focus, clean control strip (Fullscreen, Mute, Restart, Favorite) directly beneath canvas. | **Theater Mode Hero Canvas:** Distraction-free frame, instant play without scrolling, action bar (Fullscreen, Mute, Restart) directly below canvas. |
| **8. Instructions & Related Games** | Text description buried beneath ad units; related games shown in a crowded right sidebar. | Collapsible "About & How to Play" accordion and horizontal carousel of real related games directly below the player. | **Clean Accordion Guide + Related Games Grid:** Interactive "How to Play" and "Controls" guide, followed by a curated 4-card "More Games You'll Love" shelf. |
| **9. Mobile Navigation & Touch** | Mobile layout can feel cramped; banners consume 40% of the viewport; touch targets sometimes < 40px. | Pure touch-optimized bottom bar, horizontal swipeable carousels, >= 48px touch targets, zero lateral page sway. | **Touch-First Ergonomics:** Safe area insets (`env(safe-area)`), >= 48px touch targets, sticky mobile controls, swipeable category bar. |
| **10. Content Density & Hierarchy** | Very dense, retro 2000s web portal feel; visual clutter distracts from game discovery. | Clean modern streaming service aesthetic (Netflix/Steam-like card density with ample breathing room). | **Modern Warm-Dark Aesthetic:** Slate-950 backdrop with warm amber/orange and violet accents; Fredoka display typography; crisp card margins. |
| **11. Ad Placement Patterns** | Aggressive display ads (interstitials, pre-roll video, in-page banners) that harm user trust and bounce rates. | Programmatic pre-roll and sidebar banner with clear "Skip in 5s" and "Ad-free with Club" upsell. | **Zero Disruptive Ads (MVP):** 100% instant play, zero interstitials, zero banner pollution, earning trust for US organic growth. |
| **12. Accessibility & Usability** | Mixed contrast; missing form labels on search; keyboard navigation trapped in iframes. | High contrast text, visible focus rings, aria-labels on cards, reduced-motion compliance. | **WCAG 2.2 AA Compliance:** High-contrast text, visible amber focus rings, semantic landmark roles, full keyboard arrow navigation. |

---

### Architectural Design Directives for Pawcade

1. **Brand Essence:** *"Pawcade — Instant Fun, Zero Friction."* Warm, playful, and trustworthy. Appealing to kids playing on school breaks, parents relaxing at home, and commuters on mobile.
2. **Design Tokens:**
   - **Backgrounds:** `slate-950` (#030712) primary canvas, `slate-900` (#0f172a) card surface, `slate-800` (#1e293b) elevated surfaces.
   - **Accents:** Warm Amber (`#f59e0b`), Energetic Orange (`#f97316`), Regal Purple (`#a855f7`), Lush Emerald (`#10b981`).
   - **Typography:** `Fredoka` for punchy, friendly game titles and headings; `Nunito` for crisp, comfortable UI text.
3. **Core UX Journey:** A visitor landing on `https://pawcadegames.com/` must be able to start playing any game within **2 taps / 1 click** with zero download prompts or popups.

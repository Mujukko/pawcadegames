# Pawcade Games — UI/UX Design System & Specification

**Role:** Principal UI/UX Designer & Visual Design Lead  
**Product:** US Browser Game Portal (`https://pawcadegames.com/`)  
**Design Reference Benchmarks:** AddictingGames.com, CrazyGames.com  
**Updated:** 2026-10-23  

---

## 1. Brand Identity & Art Direction

### Brand Essence
*"Pawcade — Instant Fun, Zero Friction."*  
Pawcade is an original American casual browser games destination. It blends the approachable warmth of cute pet and farm themes with the sleek, high-contrast usability of modern web entertainment platforms (like Steam and Netflix).

### Target Audience
A broad US general-audience spanning:
- Kids and teenagers playing on school Chromebooks or mobile during breaks.
- Young adults and commuters seeking quick 3-minute casual arcade loops.
- Adults and casual gamers relaxing with cozy puzzles and idle tycoon games.

---

## 2. Design Tokens

### 2.1 Color Palette
- **Canvas / Background:**
  - `slate-950` (`#030712` / `#060913`): Deep dark theater canvas, optimizing game contrast.
  - `slate-900` (`#0f172a`): Primary card and container surface.
  - `slate-800` (`#1e293b`): Elevated interactive elements, search inputs, pills.
- **Accents & Brand Identifiers:**
  - **Electric Amber:** `#f59e0b` / `#fbbf24` (Primary brand accent, play CTAs, star ratings).
  - **Energetic Orange:** `#f97316` (Secondary accent, badges, flame highlights).
  - **Playful Purple:** `#8b5cf6` / `#a855f7` (Cozy night/mystery accents, genre badges).
  - **Lush Emerald:** `#10b981` (Success states, farm/nature indicators).
- **Text & Contrast:**
  - Text Primary: `#ffffff` (High contrast headings, 16.5:1 ratio against slate-950).
  - Text Secondary: `#cbd5e1` (Subheadings, instructions, 11:1 ratio).
  - Text Muted: `#94a3b8` (Tags, timestamps, metadata, 6.2:1 ratio).

### 2.2 Typography
- **Display & Headings:** `'Fredoka', system-ui, sans-serif`
  - Personality: Round, friendly, bold, arcade-inspired.
  - Usage: Game titles, section headings, brand logo wordmark, modal titles.
- **Body & Interface:** `'Nunito', -apple-system, BlinkMacSystemFont, sans-serif`
  - Personality: Extremely legible, geometric, comfortable letter spacing.
  - Usage: Instructions, controls, search inputs, button labels, taglines.

### 2.3 Elevation & Shadows
- **Card Surface:** `border border-slate-800 shadow-lg shadow-black/40`
- **Card Hover:** `border-amber-400/80 shadow-2xl -translate-y-1.5`
- **Hero Bento Spotlight:** `border border-orange-500/30 shadow-2xl shadow-orange-950/20`
- **Focus Ring:** `ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950`

---

## 3. Component Architecture & Hierarchy

### 3.1 Global Header (`src/components/Header.tsx`)
- **Logo Lockup:** High-resolution vector SVG (`/assets/branding/logo-pawcade.svg`) combining a modern glowing gamepad and paw emblem.
- **Instant Search:** Central search input on desktop and expandable mobile drawer. Triggers instant keystroke filtering across all games (< 50ms response).
- **Navigation Controls:** `🎮 All Games` quick reset and audio toggle with accessible `aria-label` attributes.

### 3.2 Category Navigation Pills (`src/app/HomePage.tsx`)
- Horizontal scrollable pill row with zero layout shift.
- Tabs: `All Games`, `🧩 Puzzles & Brain`, `🌾 Farm & Tycoon`, `⚡ Arcade & Reflex`, `🐕‍🦺 Pets & Animals`.
- Active state: Radiant Amber gradient with dark text and subtle scale pop (`scale-102`).

### 3.3 Bento Spotlight Hero (`src/components/FeaturedHero.tsx`)
- High-impact asymmetric hero spotlighting the platform's flagship titles (*Dog Parking* or *Farm Mini Mart*).
- Displays rich artwork, star ratings, play counts, `#tag` pills, and a prominent `PLAY NOW FREE` button with zero ad friction.

### 3.4 Reusable Game Card (`src/components/GameCard.tsx`)
- **Visual Container:** 1:1 square aspect ratio.
- **Image Artwork:** Renders production-grade cover art (e.g. `thumb-dog-parking.jpg`, `thumb-farm-mini-mart.jpg`) with fallback stylized gradient and emoji.
- **Hover Play Trigger:** Smooth fade-in circular amber play button (`Play` icon) on desktop hover or mobile touch-focus.
- **Metadata Tray:** Clear clean game title, rating pill (⭐ 5.0), and genre descriptor.

### 3.5 Game Detail Page (`src/app/GamePage.tsx`)
- **Top Fold Dominance:** Playable game canvas sits at the absolute top of the viewport. Zero marketing clutter or interstitial barriers before the game.
- **Controls & Instructions Guide:** Responsive 2-column card breakdown (Desktop Keyboard shortcuts & Mobile Touch gestures).
- **"More Games You'll Love":** Curated 4-card related games discovery shelf directly beneath the gameplay guide to maximize session depth and retention.

### 3.6 Footer (`src/components/Footer.tsx`)
- High-contrast, clean 4-column layout with brand story, top game links, category navigation, and US market assurance ("100% Free Browser Games • No Installs • Zero Tracking Cookies").

---

## 4. Responsive Viewport Standards

| Breakpoint | Target Width | Layout Behavior |
| :--- | :--- | :--- |
| **Mobile Narrow** | `320px - 380px` (iPhone SE, Galaxy A) | 2-column game cards; compact header; expandable search tray; 44px touch targets. |
| **Mobile Standard** | `390px - 430px` (iPhone 14/15/16, Pixel) | 2-column game cards; full touch ergonomics; zero horizontal overflow. |
| **Tablet** | `768px - 820px` (iPad Mini/Air) | 3 to 4-column grid; hero bento stacked; full search bar in header. |
| **Laptop / Desktop** | `1024px - 1440px+` | 5 to 6-column expansive grid; 2-column Bento Spotlight hero; rich hover states. |

---

## 5. Accessibility & Interaction Quality (WCAG 2.2 AA)

1. **Touch Targets:** All buttons, category chips, and search toggles meet or exceed `44x44px`.
2. **Focus Visibility:** Every interactive card and button has a high-contrast amber focus outline (`focus:ring-2 focus:ring-amber-400`).
3. **Contrast Compliance:** All text elements exceed the 4.5:1 ratio for normal text and 3:1 for large display titles.
4. **Accessible Forms:** Search inputs include descriptive `aria-label`, clear placeholder, and dedicated clear action (`X`).
5. **No Disruptive Motion:** All animations use smooth CSS cubic-bezier transitions (`0.2s - 0.3s`) and respect user `prefers-reduced-motion` settings.

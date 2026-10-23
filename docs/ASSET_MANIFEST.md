# ASSET_MANIFEST.md — Design System & Visual Asset Catalog

**Project:** Pawcade Games (US Browser Game Portal)  
**Lead:** Principal UI/UX Designer & Visual Design Lead  
**Created:** 2026-10-23  

---

## 1. Asset Directory Structure

```
public/assets/
├── branding/
│   ├── logo-pawcade.svg (Vector logo with playful paw & arcade gamepad)
│   └── favicon.svg
├── thumbnails/
│   ├── thumb-dog-parking.png
│   ├── thumb-cat-parking.png
│   ├── thumb-farm-mini-mart.png
│   ├── thumb-duck-runner.png
│   ├── thumb-pet-candy-crush.png
│   ├── thumb-flappy-chicken.png
│   ├── thumb-animal-2048.png
│   ├── thumb-farm-tetris.png
│   └── thumb-animal-farm-parking.png
└── featured/
    ├── hero-dog-parking.png
    └── hero-farm-mini-mart.png
```

---

## 2. Asset Specifications

### Asset ID: `ASSET-BRAND-LOGO`
- **Destination File Path:** `public/assets/branding/logo-pawcade.svg`
- **Purpose:** Primary brand identifier across navigation header, footer, and open graph cards.
- **Intended Placement:** Header left corner, footer brand column, mobile menu.
- **Target Dimensions:** Scalable vector (viewBox: `0 0 200 48`).
- **Aspect Ratio:** ~4:1 horizontal lockup.
- **Subject:** Glowing arcade gamepad embedded with a golden dog paw emblem, followed by bold "PAWCADE" typography.
- **Visual Style:** Modern, clean, geometric SVG, high contrast.
- **Color Palette:** Warm Orange (`#f97316`), Golden Amber (`#fbbf24`), Slate Dark (`#0f172a`).
- **Transparency:** Yes (transparent background).
- **Text Allowed:** Yes ("PAWCADE").
- **Intended Audience:** All ages (kids to adults).
- **Format:** SVG (lossless, < 4KB).

---

### Asset ID: `ASSET-THUMB-DOG-PARKING`
- **Destination File Path:** `public/assets/thumbnails/thumb-dog-parking.png`
- **Purpose:** Primary game card thumbnail & hero spotlight visual for Dog Parking.
- **Intended Placement:** Homepage game grid, category listing, related games shelf.
- **Target Dimensions:** 512x512px (displayed at 140px-260px).
- **Aspect Ratio:** 1:1 square.
- **Subject:** Sunny the cheerful Corgi wearing a red bandana in the driver's seat of a cute wooden cart, sliding through a charming suburban lawn parking lot with other adorable pups.
- **Composition:** Isometric / 3/4 perspective, single clear focal hero dog, bright background contrast.
- **Visual Style:** 3D stylized casual game render (Pixar/Clash Royale inspired), clean shapes, readable silhouette.
- **Color Palette:** Golden Honey (`#f59e0b`), Fresh Green Grass (`#22c55e`), Bright Sky Blue (`#38bdf8`), Red Accent (`#ef4444`).
- **Lighting:** Soft warm sunlight with gentle ambient occlusion shadows.
- **Safe Crop Area:** Center 80% circle safe from card rounding.
- **Transparency:** No.
- **Text Allowed:** No (text is rendered dynamically in HTML/CSS for crispness & accessibility).
- **Intended Audience:** Casual puzzle gamers, pet lovers of all ages.
- **Format:** Optimized WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-FARM-MINI-MART`
- **Destination File Path:** `public/assets/thumbnails/thumb-farm-mini-mart.png`
- **Purpose:** Game card thumbnail for Farm Mini Mart.
- **Intended Placement:** Homepage game grid, tycoon category shelf.
- **Target Dimensions:** 512x512px.
- **Aspect Ratio:** 1:1 square.
- **Subject:** Friendly farmer carrying a towering stack of ripe red tomatoes and golden corn in front of a cozy rustic wooden market stall, with cute animal customers (bunny & bear) eagerly queueing.
- **Composition:** Eye-level dynamic angle, hero character centered with vibrant produce stack.
- **Visual Style:** Polished 3D casual mobile arcade style.
- **Color Palette:** Emerald Green (`#10b981`), Ripe Tomato Red (`#ef4444`), Golden Corn (`#eab308`), Rustic Wood (`#78350f`).
- **Transparency:** No.
- **Text Allowed:** No.
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-DUCK-RUNNER`
- **Destination File Path:** `public/assets/thumbnails/thumb-duck-runner.png`
- **Purpose:** Game card thumbnail for Duck Runner.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Quacky the yellow duck leaping energetically over glowing carved Halloween pumpkins under a starry twilight sky with a harvest moon.
- **Visual Style:** High-contrast 2D/3D hybrid cartoon arcade.
- **Color Palette:** Bright Duck Yellow (`#fde047`), Pumpkin Orange (`#f97316`), Midnight Violet (`#4c1d95`).
- **Text Allowed:** No.
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-PET-CANDY-CRUSH`
- **Destination File Path:** `public/assets/thumbnails/thumb-pet-candy-crush.png`
- **Purpose:** Game card thumbnail for Farm Animal Match.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Explosive sparkling 2x2 Dynamite Bomb detonating amidst cute cartoon farm animal tiles (Cow, Pig, Chick).
- **Color Palette:** Berry Pink (`#ec4899`), Neon Purple (`#a855f7`), Golden Star (`#eab308`).
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-FARM-TETRIS`
- **Destination File Path:** `public/assets/thumbnails/thumb-farm-tetris.png`
- **Purpose:** Game card thumbnail for Farm Tetris.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Colorful falling crop blocks (pumpkins, apple crates, corn) locking into place beside a glowing rustic hay silo with a cheerful waving farmer.
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-ANIMAL-2048`
- **Destination File Path:** `public/assets/thumbnails/thumb-animal-2048.png`
- **Purpose:** Game card thumbnail for Animal 2048.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Cute baby mouse tile evolving into a giant, regal cartoon Elephant with golden crown and sparkles on an isometric grid.
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-FLAPPY-CHICKEN`
- **Destination File Path:** `public/assets/thumbnails/thumb-flappy-chicken.png`
- **Purpose:** Game card thumbnail for Flappy Chicken.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Clucky the chubby white hen flapping wings with flying feathers as she glides through rustic farm gate fence posts toward a field of glowing wheat.
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-CAT-PARKING`
- **Destination File Path:** `public/assets/thumbnails/thumb-cat-parking.png`
- **Purpose:** Game card thumbnail for Cat Parking.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Luna the midnight black cat with glowing purple eyes and a tiny witch hat sliding gracefully through sleepy pastel kitties toward an exit door.
- **Format:** WebP/PNG (< 85KB).

---

### Asset ID: `ASSET-THUMB-ANIMAL-FARM-PARKING`
- **Destination File Path:** `public/assets/thumbnails/thumb-animal-farm-parking.png`
- **Purpose:** Game card thumbnail for Animal Farm Parking.
- **Target Dimensions:** 512x512px (1:1).
- **Subject:** Bessie the Cow steering a small green farm tractor into a checkered barnyard parking stall with milk bottles gleaming nearby.
- **Format:** WebP/PNG (< 85KB).

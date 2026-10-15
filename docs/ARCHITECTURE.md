# ARCHITECTURE.md — Portal & Game Architecture

## 1. High-Level System Architecture

The application is structured into three clean layers:
1. **Portal Shell (React 18 + CSS Modules):**
   - Routing: Lightweight client-side hash or HTML5 history router supporting `/`, `/games/:slug`, and `404`.
   - Metadata & SEO: Semantic document head management, open-graph tags, JSON-LD structured data.
   - Portal Navigation: Header, breadcrumb, game cards, footer, responsive drawer.
   - Game Frame: Responsive container maintaining proper 1:1 or 4:3 aspect ratio across mobile portrait, mobile landscape, tablet, and desktop.
2. **Game Adapter & State Bridge:**
   - React-to-Phaser wrapper (`DogParkingContainer.tsx`).
   - Clean EventEmitter / callback interface between React UI (level selection, restart, mute, moves count) and Phaser scenes.
   - LocalStorage manager (`saveProgress`, `loadProgress`, `getAudioMuted`, `setAudioMuted`).
   - Analytics dispatcher (`trackEvent`).
3. **Phaser 3 Game Core:**
   - Pure Logic Layer (`src/games/dog-parking/logic/`): Grid state, dog definitions, bounding box tests, move validation, BFS solver. Independent of DOM/Canvas.
   - Level Definitions (`src/games/dog-parking/levels/`): 10+ levels with grid dimensions, dog positions, target exit gates, obstacles, optimal moves.
   - Phaser Scenes (`src/games/dog-parking/scenes/`):
     - `BootScene`: Procedural texture creation (dog avatars, kennel gates, asphalt grid, paw prints).
     - `GameScene`: Grid rendering, touch/pointer drag handling, tween animations, win particle celebration.
   - Sound System (`src/games/dog-parking/systems/sound.ts`): Procedural Web Audio API sound synthesizer.

## 2. Multi-Game Registry

A lightweight TypeScript registry (`src/lib/gamesRegistry.ts`) exports all available and upcoming portal games:
```typescript
export interface GameMetadata {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  description: string;
  category: 'puzzle' | 'arcade' | 'casual';
  thumbnail: string;
  route: string;
  status: 'playable' | 'coming-soon';
  instructions: {
    desktop: string[];
    mobile: string[];
  };
  features: string[];
}
```
Adding a new game requires only:
1. Creating `src/games/<new-game>/`
2. Adding an entry to `gamesRegistry.ts`
3. The portal shell automatically generates its landing page, SEO tags, cards, and routing.

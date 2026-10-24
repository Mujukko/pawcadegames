import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { GAME_INTROS } from '../src/components/GameIntroModal';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';

const DIST_DIR = resolve(__dirname, '../dist');
const TEMPLATE_PATH = resolve(DIST_DIR, 'index.html');
const PUBLIC_DIR = resolve(__dirname, '../public');

if (!existsSync(TEMPLATE_PATH)) {
  console.error('[Pre-render] Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const template = readFileSync(TEMPLATE_PATH, 'utf-8');
const playableGames = GAMES_REGISTRY.filter((g) => g.status === 'playable');

console.log(`[Pre-render] Generating static semantic HTML for ${playableGames.length} games and 4 category hubs...`);

// Ensure 404.html is copied to dist/404.html
const public404 = resolve(PUBLIC_DIR, '404.html');
const dist404 = resolve(DIST_DIR, '404.html');
if (existsSync(public404)) {
  copyFileSync(public404, dist404);
  console.log('[Pre-render] Successfully deployed dist/404.html for Cloudflare Pages 404 handling.');
}

// 1. Category Definitions
const CATEGORIES: Record<
  string,
  {
    name: string;
    slug: string;
    metaTitle: string;
    metaDescription: string;
    h1: string;
    description: string;
    filter: (game: typeof GAMES_REGISTRY[0]) => boolean;
  }
> = {
  puzzle: {
    name: 'Puzzles & Brain',
    slug: 'puzzle',
    metaTitle: 'Free Online Puzzle Games 🧩 — Brain Teasers & Spatial Puzzles (No Download) | Pawcade',
    metaDescription: 'Play free online puzzle games with zero downloads! Enjoy Farm Mahjong, Farm Block Blast, Sheep Cart Jam, and Critter Tap Away. Instant play on mobile and PC.',
    h1: 'Free Online Puzzle Games 🧩',
    description: 'Challenge your mind with handcrafted spatial puzzles, sliding block challenges, and logic teasers. Instant play with zero downloads.',
    filter: (g) => g.category === 'puzzle' || Boolean(g.categories?.includes('puzzle')),
  },
  farm: {
    name: 'Farm & Barnyard',
    slug: 'farm',
    metaTitle: 'Free Online Farm Games 🚜 — Barnyard Puzzles & Farm Tycoons (No Download) | Pawcade',
    metaDescription: 'Play free casual farm games online at Pawcade! Manage farm markets, drive tractors, herd sheep, and harvest crops directly in your browser with no installs.',
    h1: 'Free Online Farm & Barnyard Games 🚜',
    description: 'Experience cozy agricultural life! Run village markets, herd lively sheep, harvest golden crops, and drive tractors in zero-install browser games.',
    filter: (g) => g.category === 'farm' || Boolean(g.categories?.includes('farm')),
  },
  arcade: {
    name: 'Arcade & Action',
    slug: 'arcade',
    metaTitle: 'Free Online Arcade Games 🕹️ — Retro Reflex & Tap Games (No Download) | Pawcade',
    metaDescription: 'Enjoy free retro-style casual arcade web games on Pawcade! Tap, dodge, flap, and jump in Duck Runner, Flappy Chicken, Egg Buster, and more with zero downloads.',
    h1: 'Free Online Arcade & Tap Games 🕹️',
    description: 'Fast-paced casual reflex games for quick breaks! Dodge obstacles, slingshot eggs, and flap through pastures with instant keyboard and touch controls.',
    filter: (g) => g.category === 'arcade' || Boolean(g.categories?.includes('arcade')),
  },
  pets: {
    name: 'Pets & Animals',
    slug: 'pets',
    metaTitle: 'Cute Pet Games Online 🐾 — Free Animal Puzzles & Care Games (No Download) | Pawcade',
    metaDescription: 'Play free cute pet games in your browser on Pawcade! Enjoy Pet Memory Match, Dog Parking, Cat Parking, and cozy animal puzzles with zero downloads on mobile and PC.',
    h1: 'Cute Pet & Animal Games Online 🐾',
    description: 'Meet playful corgis, mischievous cats, fluffy sheep, and barnyard animals! Cozy, family-friendly browser games designed for animal lovers of all ages.',
    filter: (g) => g.category === 'pets' || Boolean(g.categories?.includes('pets')),
  },
};

// 2. Generate Pre-rendered Game Pages
for (const game of playableGames) {
  const intro = GAME_INTROS[game.id];
  const gameDir = resolve(DIST_DIR, `games/${game.slug}`);
  mkdirSync(gameDir, { recursive: true });

  const targetFile = resolve(gameDir, 'index.html');
  const ogImage = game.thumbnailUrl
    ? game.thumbnailUrl.startsWith('http')
      ? game.thumbnailUrl
      : `https://pawcadegames.com${game.thumbnailUrl}`
    : 'https://pawcadegames.com/og-pawcade.png';

  const categorySlug = game.category.toLowerCase();
  const categoryName = game.category.toUpperCase();
  const gameKeywords = `${game.tags?.join(', ') || ''}, ${game.title.toLowerCase()}, free online games, unblocked casual game, browser game no download`;

  // Semantic Schema.org JSON-LD (@graph with VideoGame, BreadcrumbList, FAQPage)
  const schemaLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['WebApplication', 'VideoGame'],
        name: game.title,
        description: game.metaDescription,
        applicationCategory: 'Game',
        operatingSystem: 'Web Browser',
        browserRequirements: 'Requires JavaScript. Requires HTML5.',
        inLanguage: 'en-US',
        image: ogImage,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: game.rating.toString(),
          bestRating: '5.0',
          ratingCount: '150',
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: 'https://pawcadegames.com/',
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: categoryName,
            item: `https://pawcadegames.com/category/${categorySlug}/`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: game.title,
            item: `https://pawcadegames.com${game.route}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `Is ${game.title} free to play without downloading?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes! ${game.title} is 100% free to play directly in your web browser on desktop, mobile, and Chromebook with zero downloads or installations.`,
            },
          },
          {
            '@type': 'Question',
            name: `Can I play ${game.title} on school Chromebooks or mobile?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `Yes. Pawcade games are lightweight HTML5 games optimized for mobile touch and school Chromebooks without lag or download restrictions.`,
            },
          },
          {
            '@type': 'Question',
            name: `How do I win or progress in ${game.title}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${intro ? intro.goal : game.description}`,
            },
          },
        ],
      },
    ],
  });

  // Semantic HTML content that OAI-SearchBot & non-JS engines read on raw HTTP response
  const semanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-5xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-orange-400">Home</a> &gt; 
        <a href="/category/${categorySlug}/" class="hover:text-orange-400">${categoryName}</a> &gt; 
        <span class="text-orange-400">${game.title}</span>
      </nav>
      <header class="mb-6">
        <h1 class="text-3xl sm:text-4xl font-black text-white mb-2">${game.title}</h1>
        <p class="text-slate-300 text-base max-w-2xl">${game.tagline}</p>
        <div class="mt-2 text-xs font-bold text-amber-400">Rating: ${game.rating} / 5.0 | Free Online Instant Play (No Download)</div>
      </header>

      <section id="game-overview" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-orange-500/20">
        <h2 class="text-xl font-bold text-white mb-3">About ${game.title}</h2>
        <p class="text-slate-300 text-sm leading-relaxed mb-4">${game.description}</p>
        <p class="text-emerald-400 text-xs font-bold">✓ 100% Free Browser Play &bull; Zero Installs &bull; Mobile & Desktop Compatible</p>
      </section>

      <section id="how-to-play" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-orange-500/20">
        <h2 class="text-xl font-bold text-white mb-3">How to Play ${game.title}</h2>
        ${
          intro
            ? `<p class="text-sm text-slate-300 mb-4"><strong>Objective:</strong> ${intro.goal}</p>
               <ol class="list-decimal pl-5 space-y-2 text-sm text-slate-300 mb-4">
                 ${intro.steps.map((s) => `<li><strong>${s.title}:</strong> ${s.desc}</li>`).join('')}
               </ol>
               <div class="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
                 <strong>Pro Tip:</strong> ${intro.proTip}
               </div>`
            : `<p class="text-sm text-slate-300">Play directly in your browser. Complete objectives and progress through handcrafted levels.</p>`
        }
      </section>

      <section id="controls" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-orange-500/20">
        <h2 class="text-xl font-bold text-white mb-3">Controls & Shortcuts</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-300">
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-2">Desktop Keyboard & Mouse:</h3>
            <ul class="list-disc pl-4 space-y-1">
              ${game.controls.desktop.map((c) => `<li>${c}</li>`).join('')}
            </ul>
          </div>
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-2">Mobile Touch Gestures:</h3>
            <ul class="list-disc pl-4 space-y-1">
              ${game.controls.mobile.map((c) => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-orange-500/20">
        <h2 class="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div class="space-y-4 text-sm text-slate-300">
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1">Is ${game.title} free to play without downloading?</h3>
            <p>Yes! ${game.title} is 100% free to play directly in your web browser on desktop, mobile (iOS & Android), and Chromebook with zero downloads, no installations, and no account required.</p>
          </div>
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1">Can I play ${game.title} on school Chromebooks or mobile?</h3>
            <p>Absolutely. Pawcade games are built with lightweight HTML5 and native Web Audio, making them fast-loading, smooth, and classroom-safe for school breaks and mobile touchscreens.</p>
          </div>
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1">How do I win or progress in ${game.title}?</h3>
            <p>${intro ? intro.goal : game.description} Follow the on-screen instructions, master the controls, and enjoy endless replayable fun!</p>
          </div>
        </div>
      </section>

      <section id="features" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-orange-500/20">
        <h2 class="text-xl font-bold text-white mb-3">Game Features</h2>
        <ul class="list-disc pl-5 space-y-1 text-sm text-slate-300">
          ${game.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </section>

      <section id="related-games" class="p-6 bg-slate-950/80 rounded-2xl border border-orange-500/20">
        <h2 class="text-xl font-bold text-white mb-3">More Free Browser Games on Pawcade</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          ${playableGames
            .filter((r) => r.id !== game.id)
            .slice(0, 8)
            .map(
              (r) => `
            <a href="${r.route}" class="p-3 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 text-slate-200 block transition-colors">
              <div class="font-bold text-amber-400 truncate">${r.title}</div>
              <div class="text-slate-400 line-clamp-1 mt-0.5">${r.tagline}</div>
            </a>`
            )
            .join('')}
        </div>
      </section>
    </main>
  </div>`;

  // Inject meta tags, canonical, schema, and pre-rendered content into HTML template
  let pageHtml = template
    .replace(/<title>.*?<\/title>/, `<title>${game.metaTitle}</title>`)
    .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${game.metaTitle}" />`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${game.metaDescription}" />`)
    .replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${gameKeywords}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://pawcadegames.com${game.route}" />`)
    .replace(/<link rel="alternate" hreflang="en-US" href=".*?" \/>/, `<link rel="alternate" hreflang="en-US" href="https://pawcadegames.com${game.route}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, `<link rel="alternate" hreflang="x-default" href="https://pawcadegames.com${game.route}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${game.metaTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${game.metaDescription}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://pawcadegames.com${game.route}" />`)
    .replace(/<meta property="og:image" content=".*?" \/>/, `<meta property="og:image" content="${ogImage}" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${game.metaTitle}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${game.metaDescription}" />`)
    .replace(/<meta property="twitter:url" content=".*?" \/>/, `<meta property="twitter:url" content="https://pawcadegames.com${game.route}" />`)
    .replace(/<meta property="twitter:image" content=".*?" \/>/, `<meta property="twitter:image" content="${ogImage}" />`)
    .replace('</head>', `  <script type="application/ld+json">${schemaLd}</script>\n  </head>`)
    .replace('<div id="root"></div>', semanticContent);

  writeFileSync(targetFile, pageHtml, 'utf-8');
}

// 3. Generate Pre-rendered Category Hub Pages
for (const [key, cat] of Object.entries(CATEGORIES)) {
  const catDir = resolve(DIST_DIR, `category/${cat.slug}`);
  mkdirSync(catDir, { recursive: true });

  const targetFile = resolve(catDir, 'index.html');
  const catGames = playableGames.filter(cat.filter);

  const catSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.metaTitle,
    description: cat.metaDescription,
    url: `https://pawcadegames.com/category/${cat.slug}/`,
    inLanguage: 'en-US',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: catGames.map((g, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        url: `https://pawcadegames.com${g.route}`,
        name: g.title,
      })),
    },
  });

  const catSemanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-6xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-orange-400">Home</a> &gt; 
        <span class="text-orange-400">${cat.name}</span>
      </nav>

      <header class="text-center mb-10">
        <h1 class="text-3xl sm:text-4xl font-black text-white mb-3">${cat.h1}</h1>
        <p class="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed">${cat.description}</p>
        <div class="mt-3 text-xs font-bold text-amber-400">Showing ${catGames.length} free games &bull; 100% Free Browser Play &bull; No Download Required</div>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        ${catGames
          .map(
            (g) => `
          <article class="p-5 bg-slate-950/80 rounded-2xl border border-orange-500/20 hover:border-orange-500/50 transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-slate-800">★ ${g.rating}</span>
                <span class="text-[10px] font-bold text-emerald-400">Instant Play</span>
              </div>
              <h2 class="text-lg font-bold text-white mb-1">
                <a href="${g.route}" class="hover:text-amber-400 transition-colors">${g.title}</a>
              </h2>
              <p class="text-xs text-slate-300 mb-3">${g.tagline}</p>
              <p class="text-xs text-slate-400 leading-relaxed mb-4">${g.description.slice(0, 110)}...</p>
            </div>
            <a href="${g.route}" class="w-full text-center py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl text-xs font-black hover:brightness-110 transition-all block">
              PLAY NOW 🎮
            </a>
          </article>`
          )
          .join('')}
      </section>

      <footer class="mt-12 text-center text-xs text-slate-400 border-t border-slate-800 pt-6">
        <a href="/" class="text-amber-400 hover:underline font-bold">← Back to All Pawcade Games</a>
      </footer>
    </main>
  </div>`;

  let catHtml = template
    .replace(/<title>.*?<\/title>/, `<title>${cat.metaTitle}</title>`)
    .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${cat.metaTitle}" />`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${cat.metaDescription}" />`)
    .replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${cat.slug} games, free online ${cat.slug} games, browser games no download, unblocked casual games" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://pawcadegames.com/category/${cat.slug}/" />`)
    .replace(/<link rel="alternate" hreflang="en-US" href=".*?" \/>/, `<link rel="alternate" hreflang="en-US" href="https://pawcadegames.com/category/${cat.slug}/" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, `<link rel="alternate" hreflang="x-default" href="https://pawcadegames.com/category/${cat.slug}/" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${cat.metaTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${cat.metaDescription}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://pawcadegames.com/category/${cat.slug}/" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${cat.metaTitle}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${cat.metaDescription}" />`)
    .replace(/<meta property="twitter:url" content=".*?" \/>/, `<meta property="twitter:url" content="https://pawcadegames.com/category/${cat.slug}/" />`)
    .replace('</head>', `  <script type="application/ld+json">${catSchema}</script>\n  </head>`)
    .replace('<div id="root"></div>', catSemanticContent);

  writeFileSync(targetFile, catHtml, 'utf-8');
}

// 4. Enhance Root dist/index.html with pre-rendered semantic directory and categories for crawlers
const homeSemanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-6xl mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-black text-white mb-2">Pawcade Games 🎮 — Free Online Browser Games</h1>
        <p class="text-slate-300 text-base max-w-2xl mx-auto">Instant play animal & farm casual web games. No downloads, no installations, 100% free on desktop, mobile, and Chromebook.</p>
        
        <nav aria-label="Quick Category Hubs" class="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
          <a href="/category/puzzle/" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-amber-300 border border-slate-700">🧩 Puzzle Games</a>
          <a href="/category/farm/" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-amber-300 border border-slate-700">🌾 Farm Games</a>
          <a href="/category/arcade/" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-amber-300 border border-slate-700">⚡ Arcade Games</a>
          <a href="/category/pets/" class="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-amber-300 border border-slate-700">🐾 Pet Games</a>
        </nav>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        ${playableGames
          .map(
            (g) => `
          <article class="p-4 bg-slate-950/80 rounded-2xl border border-orange-500/20">
            <h2 class="text-lg font-bold text-amber-400 mb-1">
              <a href="${g.route}" class="hover:underline">${g.title}</a>
            </h2>
            <p class="text-xs text-slate-300 mb-2">${g.tagline}</p>
            <div class="text-[11px] text-slate-400 font-semibold mb-3">${g.description.slice(0, 120)}...</div>
            <a href="${g.route}" class="inline-block px-3 py-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-black">PLAY NOW</a>
          </article>`
          )
          .join('')}
      </section>
    </main>
  </div>`;

const updatedHomeHtml = template.replace('<div id="root"></div>', homeSemanticContent);
writeFileSync(TEMPLATE_PATH, updatedHomeHtml, 'utf-8');

console.log(`[Pre-render] Successfully pre-rendered ${playableGames.length} game routes + 4 category hubs + root homepage!`);

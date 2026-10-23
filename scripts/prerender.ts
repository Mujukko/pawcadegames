import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { GAME_INTROS } from '../src/components/GameIntroModal';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';

const DIST_DIR = resolve(__dirname, '../dist');
const TEMPLATE_PATH = resolve(DIST_DIR, 'index.html');

if (!existsSync(TEMPLATE_PATH)) {
  console.error('[Pre-render] Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const template = readFileSync(TEMPLATE_PATH, 'utf-8');
const playableGames = GAMES_REGISTRY.filter((g) => g.status === 'playable');

console.log(`[Pre-render] Generating static semantic HTML for ${playableGames.length} games to eliminate the AI Search "Empty Shell" problem...`);

// 1. Generate Pre-rendered Game Pages
for (const game of playableGames) {
  const intro = GAME_INTROS[game.id];
  const gameDir = resolve(DIST_DIR, `games/${game.slug}`);
  mkdirSync(gameDir, { recursive: true });

  const targetFile = resolve(gameDir, 'index.html');

  // Semantic Schema.org JSON-LD
  const schemaLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': ['WebApplication', 'VideoGame'],
    name: game.title,
    description: game.metaDescription,
    applicationCategory: 'Game',
    operatingSystem: 'Web Browser',
    browserRequirements: 'Requires JavaScript. Requires HTML5.',
    inLanguage: 'en-US',
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
  });

  // Semantic HTML content that OAI-SearchBot & non-JS engines read on raw HTTP response
  const semanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-5xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-orange-400">Home</a> &gt; <span>${game.category.toUpperCase()}</span> &gt; <span class="text-orange-400">${game.title}</span>
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
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://pawcadegames.com${game.route}" />`)
    .replace(/<link rel="alternate" hreflang="en-US" href=".*?" \/>/, `<link rel="alternate" hreflang="en-US" href="https://pawcadegames.com${game.route}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, `<link rel="alternate" hreflang="x-default" href="https://pawcadegames.com${game.route}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${game.metaTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${game.metaDescription}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://pawcadegames.com${game.route}" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${game.metaTitle}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${game.metaDescription}" />`)
    .replace(/<meta property="twitter:url" content=".*?" \/>/, `<meta property="twitter:url" content="https://pawcadegames.com${game.route}" />`)
    .replace(
      '</head>',
      `  <script type="application/ld+json">${schemaLd}</script>\n  </head>`
    )
    .replace('<div id="root"></div>', semanticContent);

  writeFileSync(targetFile, pageHtml, 'utf-8');
}

// 2. Enhance Root dist/index.html with pre-rendered semantic directory for crawlers
const homeSemanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-6xl mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-black text-white mb-2">Pawcade Games 🎮 — Free Online Browser Games</h1>
        <p class="text-slate-300 text-base max-w-2xl mx-auto">Instant play animal & farm casual web games. No downloads, no installations, 100% free on desktop, mobile, and Chromebook.</p>
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

console.log(`[Pre-render] Successfully pre-rendered ${playableGames.length} game routes + root homepage!`);

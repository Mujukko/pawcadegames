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

// 1. Category Definitions (GEO / AEO Enhanced)
interface CategoryConfig {
  name: string;
  slug: string;
  metaTitle: string;
  metaDescription: string;
  h1: string;
  description: string;
  directAnswer: string;
  filter: (game: typeof GAMES_REGISTRY[0]) => boolean;
  faqs: Array<{ question: string; answer: string }>;
}

const CATEGORIES: Record<string, CategoryConfig> = {
  popular: {
    name: 'Popular Hits',
    slug: 'popular',
    metaTitle: 'Most Popular Free Online Games 🌟 — Top Browser Hits (No Download) | Pawcade',
    metaDescription: 'Play the most popular free online browser games on Pawcade! Enjoy top trending hits like Farm Mini Mart, Farm Block Blast, Dog Parking, and Duck Hunt with zero downloads.',
    h1: 'Most Popular Free Online Games 🌟',
    description: 'The most played, highest-rated casual browser games on Pawcade. Zero downloads, instant play on mobile and desktop.',
    directAnswer: 'The most popular free browser games on Pawcade are Farm Block Blast, Farm Mini Mart, Dog Parking, and Duck Hunt Classic. These titles feature instant touch controls, clean puzzle mechanics, zero required downloads, and seamless play across mobile phones, tablets, and desktop browsers.',
    filter: (g) => Boolean(g.featured),
    faqs: [
      {
        question: 'What are the top games on Pawcade?',
        answer: 'The highest rated titles include Farm Block Blast (puzzle), Farm Mini Mart (tycoon), Dog Parking (sliding puzzle), and Duck Hunt Classic (arcade reflex). All run instantly in modern web browsers.',
      },
      {
        question: 'Do I need to download or install apps to play popular games on Pawcade?',
        answer: 'No downloads or installations are needed. All games run directly in your web browser using HTML5 Canvas and Web Audio with instant loading.',
      },
      {
        question: 'Can I play these popular games on iPhone and Android phones?',
        answer: 'Yes. Every game is mobile optimized with responsive touch controls, zero screen lag, and single-screen viewports.',
      },
    ],
  },
  puzzle: {
    name: 'Puzzles & Brain',
    slug: 'puzzle',
    metaTitle: 'Free Online Puzzle Games 🧩 — Brain Teasers & Spatial Puzzles (No Download) | Pawcade',
    metaDescription: 'Play free online puzzle games with zero downloads! Enjoy Farm Mahjong, Farm Block Blast, Sheep Cart Jam, and Critter Tap Away. Instant play on mobile and PC.',
    h1: 'Free Online Puzzle Games 🧩',
    description: 'Challenge your mind with handcrafted spatial puzzles, sliding block challenges, and logic teasers. Instant play with zero downloads.',
    directAnswer: 'Pawcade puzzle games offer logic teasers, spatial block clearing, sliding traffic unblocking, and matching games. Standout titles include Farm Block Blast, Farm Mahjong Solitaire, Sheep Cart Jam, and Critter Tap Away.',
    filter: (g) => g.category === 'puzzle' || Boolean(g.categories?.includes('puzzle')),
    faqs: [
      {
        question: 'Which puzzle game is similar to Block Blast or Woodoku?',
        answer: 'Farm Block Blast features an 8x8 grid where you place polyomino crop shapes to clear full rows and columns for combo streak points.',
      },
      {
        question: 'What is Sheep Cart Jam?',
        answer: 'Sheep Cart Jam is a spatial parking puzzle inspired by Bus Jam. Players guide color-coded sheep onto matching farm trailers while avoiding gridlocks.',
      },
      {
        question: 'Can I undo moves in Pawcade puzzle games?',
        answer: 'Yes. Games like Farm Mahjong and Animal 2048 include built-in undo actions and shuffle tools to assist puzzle solving.',
      },
    ],
  },
  farm: {
    name: 'Farm & Barnyard',
    slug: 'farm',
    metaTitle: 'Free Online Farm Games 🚜 — Barnyard Puzzles & Farm Tycoons (No Download) | Pawcade',
    metaDescription: 'Play free casual farm games online at Pawcade! Manage farm markets, drive tractors, herd sheep, and harvest crops directly in your browser with no installs.',
    h1: 'Free Online Farm & Barnyard Games 🚜',
    description: 'Experience cozy agricultural life! Run village markets, herd lively sheep, harvest golden crops, and drive tractors in zero-install browser games.',
    directAnswer: 'Free online farm games on Pawcade combine crop harvesting, market management, and barnyard animal puzzles. Players can run a grocery stall in Farm Mini Mart, solve tile matching in Farm Mahjong, steer tractors in Animal Farm Parking, or herd animals in Sheep Stampede without installing any app.',
    filter: (g) => g.category === 'farm' || Boolean(g.categories?.includes('farm')),
    faqs: [
      {
        question: 'What is the best farm market game on Pawcade?',
        answer: 'Farm Mini Mart is the top farm tycoon game. You plant tomatoes, stock market display stands, collect customer cash, and hire helper staff.',
      },
      {
        question: 'Are there farm puzzle games available?',
        answer: 'Yes. Pawcade offers Farm Mahjong Solitaire, Farm Block Blast, Farm Pantry Sort, and Grain Sand Fall with agricultural crop and barnyard themes.',
      },
      {
        question: 'Are Pawcade farm games safe and free for kids?',
        answer: 'Yes. Pawcade games contain zero predatory microtransactions, zero pop-up account requirements, and family-friendly farm animal themes.',
      },
    ],
  },
  arcade: {
    name: 'Arcade & Action',
    slug: 'arcade',
    metaTitle: 'Free Online Arcade Games 🕹️ — Retro Reflex & Tap Games (No Download) | Pawcade',
    metaDescription: 'Enjoy free retro-style casual arcade web games on Pawcade! Tap, dodge, flap, and jump in Duck Runner, Flappy Chicken, Egg Buster, and more with zero downloads.',
    h1: 'Free Online Arcade & Tap Games 🕹️',
    description: 'Fast-paced casual reflex games for quick breaks! Dodge obstacles, slingshot eggs, and flap through pastures with instant keyboard and touch controls.',
    directAnswer: 'Pawcade arcade games deliver instant reflex action with simple tap and key controls. Players can shoot retro targets in Duck Hunt Classic, flap between fences in Flappy Chicken, destroy fox fortresses in Egg Buster, and multiply herds in Sheep Stampede.',
    filter: (g) => g.category === 'arcade' || Boolean(g.categories?.includes('arcade')),
    faqs: [
      {
        question: 'Is Duck Hunt Classic playable on mobile touchscreens?',
        answer: 'Yes. Tap anywhere on the sky to fire your virtual light gun, hit flying ducks before they escape, and rack up high scores across 10 rounds.',
      },
      {
        question: 'What is Egg Buster?',
        answer: 'Egg Buster is a physics slingshot demolition game where you launch bouncy barnyard eggs to smash wooden crates and defeat sneaky foxes.',
      },
      {
        question: 'Do Pawcade arcade games support keyboard shortcuts?',
        answer: 'Yes. Desktop players can use Space, Arrow keys, or Mouse Clicks for reflex jumping, aiming, and navigation.',
      },
    ],
  },
  pets: {
    name: 'Pets & Animals',
    slug: 'pets',
    metaTitle: 'Cute Pet Games Online 🐾 — Free Animal Puzzles & Care Games (No Download) | Pawcade',
    metaDescription: 'Play free cute pet games in your browser on Pawcade! Enjoy Pet Memory Match, Dog Parking, Cat Parking, and cozy animal puzzles with zero downloads on mobile and PC.',
    h1: 'Cute Pet & Animal Games Online 🐾',
    description: 'Meet playful corgis, mischievous cats, fluffy sheep, and barnyard animals! Cozy, family-friendly browser games designed for animal lovers of all ages.',
    directAnswer: 'Pawcade pet games feature cute dogs, cats, hamsters, and barn critters in family-friendly challenges. Test your memory in Pet Memory Match, slide friendly corgis in Dog Parking, untangle felines in Cat Parking, or roll through obstacle courses in Hamster Ball Dash.',
    filter: (g) => g.category === 'pets' || Boolean(g.categories?.includes('pets')),
    faqs: [
      {
        question: 'What dog games are available on Pawcade?',
        answer: 'Dog Parking features Corgis, Pugs, and Dalmatians navigating pasture gates. Sheep Stampede features Buster the border collie leading herds.',
      },
      {
        question: 'How does Pet Memory Match work?',
        answer: 'Pet Memory Match is a classic concentration card game where you flip pairs of cards showing puppies, kittens, hamsters, and bunnies across 4 difficulty levels.',
      },
      {
        question: 'Are these pet games free to play on mobile?',
        answer: 'Yes. All pet games are free with zero ads during gameplay, responsive touch layouts, and native Web Audio sounds.',
      },
    ],
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
            name: `What is the main objective of ${game.title}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${intro ? intro.goal : game.description}`,
            },
          },
          {
            '@type': 'Question',
            name: `How do I control and play ${game.title}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `On desktop, ${game.controls.desktop[0]}. On mobile devices, ${game.controls.mobile[0]}.`,
            },
          },
          {
            '@type': 'Question',
            name: `What is the top strategy or pro tip for ${game.title}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${intro ? intro.proTip : 'Focus on steady rhythm, observe obstacle patterns, and practice smooth controls.'}`,
            },
          },
        ],
      },
    ],
  });

  // Semantic HTML content that OAI-SearchBot, Bingbot & non-JS engines read on raw HTTP response
  const semanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-5xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-amber-400">Home</a> &gt; 
        <a href="/category/${categorySlug}/" class="hover:text-amber-400">${categoryName}</a> &gt; 
        <span class="text-amber-400">${game.title}</span>
      </nav>

      <header class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[11px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
            ${game.badge || 'Playable Game'}
          </span>
          <span class="text-xs text-slate-400 font-bold">Category: ${categoryName}</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-black text-white mb-2">${game.title}</h1>
        <p class="text-slate-300 text-base max-w-2xl">${game.tagline}</p>
        <div class="mt-2 text-xs font-bold text-amber-400">Rating: ${game.rating} / 5.0 | ${game.playCount || '50K+'} Plays | Free Instant Browser Play (No Download)</div>
      </header>

      <!-- Interactive Playable Game Showcase Frame (Signals WebApplication / Playable Game to Crawlers) -->
      <div class="relative w-full aspect-[16/10] sm:aspect-[16/9] max-w-4xl mx-auto bg-slate-950 rounded-2xl sm:rounded-3xl border-2 border-amber-500/40 overflow-hidden mb-8 shadow-2xl flex flex-col items-center justify-center p-6 text-center group">
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent z-10"></div>
        <img src="${game.thumbnailUrl}" alt="${game.title}" class="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-500" loading="eager" />
        <div class="relative z-20 flex flex-col items-center max-w-md">
          <div class="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 flex items-center justify-center text-3xl sm:text-4xl shadow-2xl shadow-amber-500/40 mb-3 cursor-pointer hover:scale-110 active:scale-95 transition-transform">
            ▶
          </div>
          <span class="text-[11px] uppercase tracking-widest text-amber-300 font-extrabold mb-1">Interactive Web Game</span>
          <h2 class="text-xl sm:text-2xl font-black text-white mb-2">Play ${game.title} Online</h2>
          <p class="text-xs text-slate-300 mb-3 line-clamp-2">${game.description}</p>
          <div class="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-emerald-500/30">
            <span>✓ Instant Loading</span>
            <span>•</span>
            <span>✓ 100% Free</span>
            <span>•</span>
            <span>✓ Mobile & PC</span>
          </div>
        </div>
      </div>

      <section id="game-overview" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-3">About ${game.title}</h2>
        <p class="text-slate-300 text-sm leading-relaxed mb-4">${game.description}</p>
        <p class="text-emerald-400 text-xs font-bold">✓ 100% Free Browser Play &bull; Zero Installs &bull; Mobile & Desktop Compatible</p>
      </section>

      <section id="how-to-play" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
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

      <section id="controls" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
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

      <section id="faq" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div class="space-y-4 text-sm text-slate-300">
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1">What is the main objective of ${game.title}?</h3>
            <p>${intro ? intro.goal : game.description}</p>
          </div>
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1">How do I control and play ${game.title}?</h3>
            <p>On desktop: ${game.controls.desktop.slice(0, 2).join(' ')}. On mobile: ${game.controls.mobile[0]}.</p>
          </div>
          <div class="p-4 bg-slate-900 rounded-xl border border-slate-800">
            <h3 class="font-bold text-amber-400 mb-1">What is the top strategy or pro tip for ${game.title}?</h3>
            <p>${intro ? intro.proTip : 'Observe patterns carefully, maintain a steady rhythm, and practice the core controls.'}</p>
          </div>
        </div>
      </section>

      <section id="features" class="mb-8 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-3">Game Features</h2>
        <ul class="list-disc pl-5 space-y-1 text-sm text-slate-300">
          ${game.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </section>

      <!-- Category Navigation Hubs (Crawl Depth Booster) -->
      <section class="mb-8 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
        <span class="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-2">Explore Pawcade Game Categories</span>
        <div class="flex flex-wrap justify-center gap-2 text-xs font-bold">
          <a href="/popular/" class="px-3 py-1 bg-amber-400 text-slate-950 rounded-lg hover:bg-amber-300">🌟 Popular Hits</a>
          <a href="/category/puzzle/" class="px-3 py-1 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg hover:border-amber-400">🧩 Puzzle Games</a>
          <a href="/category/farm/" class="px-3 py-1 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg hover:border-amber-400">🌾 Farm Games</a>
          <a href="/category/arcade/" class="px-3 py-1 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg hover:border-amber-400">⚡ Arcade Games</a>
          <a href="/category/pets/" class="px-3 py-1 bg-slate-900 text-slate-200 border border-slate-700 rounded-lg hover:border-amber-400">🐾 Pet Games</a>
        </div>
      </section>

      <section id="related-games" class="p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
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

// 3. Generate Pre-rendered Category Hub Pages (GEO / AEO Enhanced)
for (const [key, cat] of Object.entries(CATEGORIES)) {
  const catDir = resolve(DIST_DIR, `category/${cat.slug}`);
  mkdirSync(catDir, { recursive: true });

  const targetFile = resolve(catDir, 'index.html');
  const catGames = playableGames.filter(cat.filter);

  // Schema.org Graph (CollectionPage + FAQPage for Answer Engine citation)
  const catSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `https://pawcadegames.com/category/${cat.slug}/#collection`,
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
      },
      {
        '@type': 'FAQPage',
        '@id': `https://pawcadegames.com/category/${cat.slug}/#faq`,
        mainEntity: cat.faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: f.answer,
          },
        })),
      },
    ],
  });

  const catSemanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-6xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-slate-400 mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-orange-400">Home</a> &gt; 
        <span class="text-orange-400">${cat.name}</span>
      </nav>

      <header class="text-center mb-8">
        <h1 class="text-3xl sm:text-4xl font-black text-white mb-3">${cat.h1}</h1>
        <p class="text-slate-300 text-base max-w-2xl mx-auto leading-relaxed mb-4">${cat.description}</p>
        
        <!-- GEO / AEO Direct Answer Hook for AI Search Engines -->
        <div class="p-4 bg-slate-950/90 rounded-2xl border border-amber-400/30 text-left max-w-3xl mx-auto mb-4">
          <div class="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-1">Quick Answer & Overview</div>
          <p class="text-xs sm:text-sm text-slate-200 leading-relaxed">${cat.directAnswer}</p>
        </div>

        <div class="mt-2 text-xs font-bold text-amber-400">Showing ${catGames.length} free games &bull; 100% Free Browser Play &bull; No Download Required</div>
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

      <!-- GEO / AEO Structured Comparative Matrix for AI Citations -->
      <section class="mt-10 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-2">${cat.name} Games Comparison</h2>
        <p class="text-xs text-slate-400 mb-4">Compare key gameplay mechanics, player ratings, and controls across our top free ${cat.name.toLowerCase()} browser games.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-slate-800 text-slate-400">
                <th class="py-2.5 px-3 font-bold text-amber-400">Game</th>
                <th class="py-2.5 px-3 font-bold">Genre</th>
                <th class="py-2.5 px-3 font-bold">Core Mechanic</th>
                <th class="py-2.5 px-3 font-bold">Rating</th>
                <th class="py-2.5 px-3 font-bold">Controls</th>
                <th class="py-2.5 px-3 font-bold">Platform</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-900 text-slate-300">
              ${catGames
                .map(
                  (g) => `
                <tr class="hover:bg-slate-900/50">
                  <td class="py-2.5 px-3 font-bold text-white">
                    <a href="${g.route}" class="hover:text-amber-400 underline decoration-amber-400/40">${g.title}</a>
                  </td>
                  <td class="py-2.5 px-3 capitalize">${g.category}</td>
                  <td class="py-2.5 px-3 text-slate-400">${g.tagline}</td>
                  <td class="py-2.5 px-3 text-amber-400 font-bold">★ ${g.rating}</td>
                  <td class="py-2.5 px-3 text-slate-400">${g.controls.touch ? 'Touch / ' : ''}${g.controls.keyboard ? 'Keys' : 'Mouse'}</td>
                  <td class="py-2.5 px-3 text-emerald-400 font-semibold">Web / Mobile</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- GEO / AEO Semantic Q&A for Answer Engine Extraction -->
      <section class="mt-8 p-6 bg-slate-950/80 rounded-2xl border border-slate-800">
        <h2 class="text-xl font-bold text-white mb-4">Frequently Asked Questions</h2>
        <div class="space-y-4">
          ${cat.faqs
            .map(
              (faq) => `
            <div class="border-b border-slate-800/80 pb-3 last:border-0 last:pb-0">
              <h3 class="text-sm font-bold text-amber-300 mb-1">${faq.question}</h3>
              <p class="text-xs text-slate-300 leading-relaxed">${faq.answer}</p>
            </div>`
            )
            .join('')}
        </div>
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

  // Also pre-render /popular/ root alias if cat.slug is popular
  if (cat.slug === 'popular') {
    const popDir = resolve(DIST_DIR, 'popular');
    mkdirSync(popDir, { recursive: true });
    const popHtml = catHtml
      .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://pawcadegames.com/popular/" />`)
      .replace(/<link rel="alternate" hreflang="en-US" href=".*?" \/>/, `<link rel="alternate" hreflang="en-US" href="https://pawcadegames.com/popular/" />`)
      .replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, `<link rel="alternate" hreflang="x-default" href="https://pawcadegames.com/popular/" />`)
      .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://pawcadegames.com/popular/" />`)
      .replace(/<meta property="twitter:url" content=".*?" \/>/, `<meta property="twitter:url" content="https://pawcadegames.com/popular/" />`);
    writeFileSync(resolve(popDir, 'index.html'), popHtml, 'utf-8');
  }
}

// 4. Enhance Root dist/index.html with pre-rendered semantic directory and categories for crawlers
const homeSemanticContent = `
  <div id="root">
    <main class="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8 max-w-6xl mx-auto">
      <header class="text-center mb-8">
        <h1 class="text-4xl font-black text-white mb-2">Pawcade Games 🎮 — Free Online Browser Games</h1>
        <p class="text-slate-300 text-base max-w-2xl mx-auto">Instant play animal & farm casual web games. No downloads, no installations, 100% free on desktop, mobile, and Chromebook.</p>
        
        <nav aria-label="Quick Category Hubs" class="mt-4 flex flex-wrap justify-center gap-2 text-xs font-bold">
          <a href="/popular/" class="px-3 py-1.5 bg-amber-400 text-slate-950 hover:bg-amber-300 rounded-xl font-black">🌟 Popular Hits</a>
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

console.log(`[Pre-render] Successfully pre-rendered ${playableGames.length} game routes + 5 category/popular hubs + root homepage!`);

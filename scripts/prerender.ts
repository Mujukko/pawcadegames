import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { GAME_INTROS } from '../src/components/GameIntroModal';
import { CATEGORY_LABELS, buildGameFaqs, getRelatedGames, stripEmoji } from '../src/lib/gameSeo';
import { INFO_PAGES } from '../src/lib/sitePages';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'fs';
import { resolve } from 'path';

const DIST_DIR = resolve(__dirname, '../dist');
const TEMPLATE_PATH = resolve(DIST_DIR, 'index.html');
const PUBLIC_DIR = resolve(__dirname, '../public');

if (!existsSync(TEMPLATE_PATH)) {
  console.error('[Pre-render] Error: dist/index.html not found! Run "vite build" first.');
  process.exit(1);
}

const rawTemplate = readFileSync(TEMPLATE_PATH, 'utf-8');

// Defer CSS loading to eliminate render-blocking stylesheet penalty without bloating HTML
let template = rawTemplate;
const cssMatch = rawTemplate.match(/<link rel="stylesheet"[^>]+href="([^">]+\.css)"[^>]*>/);
if (cssMatch && cssMatch[1]) {
  const cssHref = cssMatch[1];
  template = rawTemplate.replace(
    cssMatch[0],
    `<link rel="preload" href="${cssHref}" as="style" />\n    <link rel="stylesheet" href="${cssHref}" media="print" onload="this.media='all'" />\n    <noscript><link rel="stylesheet" href="${cssHref}" /></noscript>`
  );
  console.log(`[Pre-render] Transformed CSS link to non-blocking preload+onload to eliminate render-blocking penalty.`);
}

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
    metaTitle: 'Most Popular Free Online Games — Top Browser Hits | Pawcade',
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
    metaTitle: 'Free Online Puzzle Games — Brain Teasers, No Download | Pawcade',
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
    metaTitle: 'Free Online Farm Games — Barnyard Puzzles & Tycoons | Pawcade',
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
    metaTitle: 'Free Online Arcade Games — Quick Reflex & Tap Games | Pawcade',
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
    metaTitle: 'Pet Games Online — Free Cute Cat & Dog Games | Pawcade',
    metaDescription: 'Play free cat games, dog games, and cute pet puzzles in your browser. Slide corgis in Dog Parking, rescue kittens in Cat Parking, and match pets with zero downloads.',
    h1: 'Free Pet Games Online — Cute Dogs & Cats 🐾',
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
        answer: 'Yes. All pet games are free with responsive touch layouts and work on iPhone, Android, tablets, and Chromebooks.',
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
  const categoryName = CATEGORY_LABELS[game.category];
  const plainTitle = stripEmoji(game.title);
  const relatedGames = getRelatedGames(game, GAMES_REGISTRY, 8);
  const faqs = buildGameFaqs(game, intro, relatedGames);
  const gameKeywords = `${game.tags?.join(', ') || ''}, ${game.title.toLowerCase()}, free online games, unblocked casual game, browser game no download`;

  // Semantic Schema.org JSON-LD (@graph with VideoGame, BreadcrumbList, FAQPage)
  const schemaLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['WebApplication', 'VideoGame'],
        name: plainTitle,
        url: `https://pawcadegames.com${game.route}`,
        description: game.metaDescription,
        genre: game.tags?.slice(0, 3),
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
            name: plainTitle,
            item: `https://pawcadegames.com${game.route}`,
          },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
          '@type': 'Question',
          name: f.question,
          acceptedAnswer: { '@type': 'Answer', text: f.answer },
        })),
      },
    ],
  });

  // Semantic HTML content that OAI-SearchBot, Bingbot & non-JS engines read on raw HTTP response
  const semanticContent = `
  <div id="root">
    <main class="text-ink p-4 sm:p-8 max-w-5xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-ink-soft mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-ink">Home</a> &gt; 
        <a href="/category/${categorySlug}/" class="hover:text-ink">${categoryName}</a> &gt; 
        <span class="text-brand-deep">${game.title}</span>
      </nav>

      <header class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[11px] font-semibold font-display uppercase tracking-wider px-2.5 py-1 rounded-md bg-brand-tint text-brand-deep border border-line">
            ${game.badge || 'Playable Game'}
          </span>
          <span class="text-xs text-ink-soft font-bold">Category: ${categoryName}</span>
        </div>
        <h1 class="text-3xl sm:text-4xl font-semibold font-display text-ink mb-2">${game.title}</h1>
        <p class="text-ink-soft text-base max-w-2xl">${game.tagline}</p>
        <div class="mt-2 text-xs font-bold text-brand-deep">Free to play &bull; No download &bull; Works on phone, tablet &amp; computer</div>
      </header>

      <!-- Game stage placeholder: replaced by the live game when JS loads -->
      <div class="relative w-full aspect-[16/10] sm:aspect-[16/9] max-w-4xl mx-auto bg-stage rounded-[28px] ring-4 ring-white overflow-hidden mb-8 shadow-tile flex items-center justify-center">
        <img src="${game.thumbnailUrl}" alt="${plainTitle} gameplay screenshot" class="absolute inset-0 w-full h-full object-cover opacity-50" loading="eager" fetchpriority="high" width="768" height="432" />
        <div class="relative flex flex-col items-center text-center px-6">
          <span class="w-20 h-20 rounded-full bg-brand text-white flex items-center justify-center text-3xl shadow-tile mb-3" aria-hidden="true">▶</span>
          <h2 class="font-display text-2xl font-semibold text-white drop-shadow">Play ${plainTitle} online</h2>
          <p class="mt-1 text-sm font-bold text-white/90 drop-shadow">Free &bull; No download &bull; Phone &amp; computer</p>
        </div>
      </div>

      <section id="game-overview" class="mb-8 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-3">About ${game.title}</h2>
        <p class="text-ink-soft text-sm leading-relaxed mb-4">${game.description}</p>
        <p class="text-farm-deep text-xs font-bold">✓ 100% Free Browser Play &bull; Zero Installs &bull; Mobile & Desktop Compatible</p>
      </section>

      <section id="how-to-play" class="mb-8 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-3">How to Play ${game.title}</h2>
        ${
          intro
            ? `<p class="text-sm text-ink-soft mb-4"><strong>Objective:</strong> ${intro.goal}</p>
               <ol class="list-decimal pl-5 space-y-2 text-sm text-ink-soft mb-4">
                 ${intro.steps.map((s) => `<li><strong>${s.title}:</strong> ${s.desc}</li>`).join('')}
               </ol>
               <div class="p-3 bg-brand-tint border border-line rounded-xl text-xs text-brand-deep">
                 <strong>Pro Tip:</strong> ${intro.proTip}
               </div>`
            : `<p class="text-sm text-ink-soft">Play directly in your browser. Complete objectives and progress through handcrafted levels.</p>`
        }
      </section>

      <section id="controls" class="mb-8 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-3">Controls & Shortcuts</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-ink-soft">
          <div class="p-4 bg-white rounded-xl border border-line">
            <h3 class="font-bold text-brand-deep mb-2">Desktop Keyboard & Mouse:</h3>
            <ul class="list-disc pl-4 space-y-1">
              ${game.controls.desktop.map((c) => `<li>${c}</li>`).join('')}
            </ul>
          </div>
          <div class="p-4 bg-white rounded-xl border border-line">
            <h3 class="font-bold text-brand-deep mb-2">Mobile Touch Gestures:</h3>
            <ul class="list-disc pl-4 space-y-1">
              ${game.controls.mobile.map((c) => `<li>${c}</li>`).join('')}
            </ul>
          </div>
        </div>
      </section>

      <section id="faq" class="mb-8 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-4">Frequently Asked Questions</h2>
        <div class="space-y-4 text-sm text-ink-soft">
          ${faqs
            .map(
              (f) => `
          <div class="p-4 bg-white rounded-xl border border-line">
            <h3 class="font-bold text-brand-deep mb-1">${f.question}</h3>
            <p>${f.answer}</p>
          </div>`
            )
            .join('')}
        </div>
      </section>

      <section id="features" class="mb-8 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-3">Game Features</h2>
        <ul class="list-disc pl-5 space-y-1 text-sm text-ink-soft">
          ${game.features.map((f) => `<li>${f}</li>`).join('')}
        </ul>
      </section>

      <!-- Category Navigation Hubs (Crawl Depth Booster) -->
      <section class="mb-8 p-4 bg-white rounded-[22px] border border-line text-center">
        <span class="text-xs uppercase tracking-wider text-ink-soft font-bold block mb-2">Explore Pawcade Game Categories</span>
        <div class="flex flex-wrap justify-center gap-2 text-xs font-bold">
          <a href="/popular/" class="px-3 py-1 bg-brand text-white rounded-lg hover:bg-brand-deep">🌟 Popular Hits</a>
          <a href="/category/puzzle/" class="px-3 py-1 bg-white text-ink border border-line rounded-lg hover:border-ink-faint">🧩 Puzzle Games</a>
          <a href="/category/farm/" class="px-3 py-1 bg-white text-ink border border-line rounded-lg hover:border-ink-faint">🌾 Farm Games</a>
          <a href="/category/arcade/" class="px-3 py-1 bg-white text-ink border border-line rounded-lg hover:border-ink-faint">⚡ Arcade Games</a>
          <a href="/category/pets/" class="px-3 py-1 bg-white text-ink border border-line rounded-lg hover:border-ink-faint">🐾 Pet Games</a>
        </div>
      </section>

      <section id="related-games" class="p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-3">More Free Browser Games on Pawcade</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          ${relatedGames
            .map(
              (r) => `
            <a href="${r.route}" class="p-3 bg-white hover:bg-paper rounded-xl border border-line text-ink block transition-colors">
              <div class="font-bold text-brand-deep truncate">${r.title}</div>
              <div class="text-ink-soft line-clamp-1 mt-0.5">${r.tagline}</div>
            </a>`
            )
            .join('')}
        </div>
      </section>
    </main>
  </div>`;

  const isJpg = game.thumbnailUrl.endsWith('.jpg');
  const preloadThumb = isJpg ? game.thumbnailUrl.replace(/\.jpg$/, '.avif') : game.thumbnailUrl;
  const preloadType = isJpg ? ' type="image/avif"' : '';

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
    .replace(/<link rel="preload" as="image" href=".*?" (type="image\/avif" )?fetchpriority="high" \/>/, `<link rel="preload" as="image" href="${preloadThumb}"${preloadType} fetchpriority="high" />`)
    .replace('</head>', `  <script type="application/ld+json">${schemaLd}</script>\n  </head>`)
    .replace('<div id="root"></div>', semanticContent);

  writeFileSync(targetFile, pageHtml, 'utf-8');
}

// 3. Generate Pre-rendered Category Hub Pages (GEO / AEO Enhanced)
for (const [key, cat] of Object.entries(CATEGORIES)) {
  // /popular/ is the single URL for the popular hub; /category/popular/ 301s to it (public/_redirects)
  const catPath = cat.slug === 'popular' ? '/popular/' : `/category/${cat.slug}/`;
  const catDir = resolve(DIST_DIR, catPath.slice(1, -1));
  mkdirSync(catDir, { recursive: true });

  const targetFile = resolve(catDir, 'index.html');
  const catGames = playableGames.filter(cat.filter);

  // Schema.org Graph (CollectionPage + FAQPage for Answer Engine citation)
  const catSchema = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `https://pawcadegames.com${catPath}#collection`,
        name: cat.metaTitle,
        description: cat.metaDescription,
        url: `https://pawcadegames.com${catPath}`,
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
        '@id': `https://pawcadegames.com${catPath}#faq`,
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
    <main class="text-ink p-4 sm:p-8 max-w-6xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-ink-soft mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-ink">Home</a> &gt; 
        <span class="text-brand-deep">${cat.name}</span>
      </nav>

      <header class="text-center mb-8">
        <h1 class="text-3xl sm:text-4xl font-semibold font-display text-ink mb-3">${cat.h1}</h1>
        <p class="text-ink-soft text-base max-w-2xl mx-auto leading-relaxed mb-4">${cat.description}</p>
        
        <!-- GEO / AEO Direct Answer Hook for AI Search Engines -->
        <div class="p-4 bg-white rounded-[22px] border border-line text-left max-w-3xl mx-auto mb-4">
          <div class="text-[11px] font-semibold font-display uppercase tracking-wider text-brand-deep mb-1">Quick Answer & Overview</div>
          <p class="text-xs sm:text-sm text-ink leading-relaxed">${cat.directAnswer}</p>
        </div>

        <div class="mt-2 text-xs font-bold text-brand-deep">Showing ${catGames.length} free games &bull; 100% Free Browser Play &bull; No Download Required</div>
      </header>

      <section class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        ${catGames
          .map(
            (g) => `
          <article class="p-5 bg-white rounded-[22px] border border-line hover:border-ink-faint transition-all flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] font-semibold font-display uppercase tracking-wider px-2 py-0.5 rounded-full bg-white text-brand-deep border border-line">${CATEGORY_LABELS[g.category]}</span>
                <span class="text-[10px] font-bold text-farm-deep">Instant Play</span>
              </div>
              <h2 class="text-lg font-bold text-ink mb-1">
                <a href="${g.route}" class="hover:text-ink transition-colors">${g.title}</a>
              </h2>
              <p class="text-xs text-ink-soft mb-3">${g.tagline}</p>
              <p class="text-xs text-ink-soft leading-relaxed mb-4">${g.description.slice(0, 110)}...</p>
            </div>
            <a href="${g.route}" class="w-full text-center py-2 text-white rounded-xl text-xs font-semibold font-display hover:brightness-110 transition-all block">
              PLAY NOW 🎮
            </a>
          </article>`
          )
          .join('')}
      </section>

      <!-- GEO / AEO Structured Comparative Matrix for AI Citations -->
      <section class="mt-10 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-2">${cat.name} Games Comparison</h2>
        <p class="text-xs text-ink-soft mb-4">Compare key gameplay mechanics and controls across our top free ${cat.name.toLowerCase()} browser games.</p>
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs border-collapse">
            <thead>
              <tr class="border-b border-line text-ink-soft">
                <th class="py-2.5 px-3 font-bold text-brand-deep">Game</th>
                <th class="py-2.5 px-3 font-bold">Genre</th>
                <th class="py-2.5 px-3 font-bold">Core Mechanic</th>
                <th class="py-2.5 px-3 font-bold">Controls</th>
                <th class="py-2.5 px-3 font-bold">Platform</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-line text-ink-soft">
              ${catGames
                .map(
                  (g) => `
                <tr class="hover:bg-paper">
                  <td class="py-2.5 px-3 font-bold text-ink">
                    <a href="${g.route}" class="hover:text-brand-deep underline decoration-line">${g.title}</a>
                  </td>
                  <td class="py-2.5 px-3 capitalize">${g.category}</td>
                  <td class="py-2.5 px-3 text-ink-soft">${g.tagline}</td>
                  <td class="py-2.5 px-3 text-ink-soft">${g.controls.touch ? 'Touch / ' : ''}${g.controls.keyboard ? 'Keys' : 'Mouse'}</td>
                  <td class="py-2.5 px-3 text-farm-deep font-semibold">Web / Mobile</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </section>

      <!-- GEO / AEO Semantic Q&A for Answer Engine Extraction -->
      <section class="mt-8 p-6 bg-white rounded-[22px] border border-line">
        <h2 class="text-xl font-bold text-ink mb-4">Frequently Asked Questions</h2>
        <div class="space-y-4">
          ${cat.faqs
            .map(
              (faq) => `
            <div class="border-b border-line pb-3 last:border-0 last:pb-0">
              <h3 class="text-sm font-bold text-brand-deep mb-1">${faq.question}</h3>
              <p class="text-xs text-ink-soft leading-relaxed">${faq.answer}</p>
            </div>`
            )
            .join('')}
        </div>
      </section>

      <footer class="mt-12 text-center text-xs text-ink-soft border-t border-line pt-6">
        <a href="/" class="text-brand-deep hover:underline font-bold">← Back to All Pawcade Games</a>
      </footer>
    </main>
  </div>`;

  const firstGameThumb = catGames[0]?.thumbnailUrl || '/assets/thumbnails/thumb-farm-mini-mart.svg';

  let catHtml = template
    .replace(/<title>.*?<\/title>/, `<title>${cat.metaTitle}</title>`)
    .replace(/<link rel="preload" as="image" href=".*?" fetchpriority="high" \/>/, `<link rel="preload" as="image" href="${firstGameThumb}" fetchpriority="high" />`)
    .replace(/<meta name="title" content=".*?" \/>/, `<meta name="title" content="${cat.metaTitle}" />`)
    .replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${cat.metaDescription}" />`)
    .replace(/<meta name="keywords" content=".*?" \/>/, `<meta name="keywords" content="${cat.slug} games, free online ${cat.slug} games, browser games no download, unblocked casual games" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, `<link rel="canonical" href="https://pawcadegames.com${catPath}" />`)
    .replace(/<link rel="alternate" hreflang="en-US" href=".*?" \/>/, `<link rel="alternate" hreflang="en-US" href="https://pawcadegames.com${catPath}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, `<link rel="alternate" hreflang="x-default" href="https://pawcadegames.com${catPath}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, `<meta property="og:title" content="${cat.metaTitle}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, `<meta property="og:description" content="${cat.metaDescription}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, `<meta property="og:url" content="https://pawcadegames.com${catPath}" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/, `<meta property="twitter:title" content="${cat.metaTitle}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/, `<meta property="twitter:description" content="${cat.metaDescription}" />`)
    .replace(/<meta property="twitter:url" content=".*?" \/>/, `<meta property="twitter:url" content="https://pawcadegames.com${catPath}" />`)
    .replace('</head>', `  <script type="application/ld+json">${catSchema}</script>\n  </head>`)
    .replace('<div id="root"></div>', catSemanticContent);

  writeFileSync(targetFile, catHtml, 'utf-8');

}

// 4. Enhance Root dist/index.html with pre-rendered semantic directory and categories for crawlers
const homeSemanticContent = `
  <div id="root">
    <main class="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      <nav aria-label="Game categories" class="-mx-3 px-3 sm:mx-0 sm:px-0 pb-2 mb-4 sm:mb-6 flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none">
        <a href="/" class="shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base bg-white text-ink shadow-[0_4px_0_rgb(27_60_110/0.18)] ring-2 ring-white">
          <span>All games</span>
          <span class="text-xs font-bold px-1.5 rounded-full bg-paper">${playableGames.length}</span>
        </a>
        <a href="/popular/" class="shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base bg-brand shadow-[0_4px_0_#c2470a] text-white">Popular</a>
        <a href="/category/puzzle/" class="shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base bg-puzzle shadow-[0_4px_0_#1f62ab] text-white">Puzzle</a>
        <a href="/category/farm/" class="shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base bg-farm shadow-[0_4px_0_#1f7c41] text-white">Farm</a>
        <a href="/category/arcade/" class="shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base bg-arcade shadow-[0_4px_0_#b8303f] text-white">Arcade</a>
        <a href="/category/pets/" class="shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base bg-pets shadow-[0_4px_0_#6c41bd] text-white">Pets</a>
      </nav>

      <section aria-label="Games">
        <div class="grid grid-flow-dense grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-4">
          <div class="col-span-3 sm:col-span-4 md:col-span-3 md:row-span-1 lg:row-span-2 bg-white rounded-[22px] shadow-tile p-4 sm:p-6 flex flex-col justify-center">
            <h1 class="font-display text-2xl sm:text-[2rem] lg:text-4xl font-semibold text-ink leading-[1.1] tracking-tight">
              Free Online Animal &amp; Farm Games
            </h1>
            <p class="mt-2 sm:mt-3 text-sm sm:text-[15px] text-ink-soft leading-relaxed">
              Puzzles, farm sims, and quick arcade games starring corgis, cats, sheep, and friends. Every game plays instantly in your browser, on phone or computer.
            </p>
            <p class="mt-3 sm:mt-4 flex flex-wrap gap-2 text-xs font-bold">
              <span class="px-2.5 py-1 rounded-full bg-farm-tint text-farm-deep">Free</span>
              <span class="px-2.5 py-1 rounded-full bg-puzzle-tint text-puzzle-deep">No download</span>
              <span class="px-2.5 py-1 rounded-full bg-pets-tint text-pets-deep">Phone &amp; computer</span>
            </p>
          </div>

          <!-- Featured Hero LCP Card: Eggy Car (High-Traffic Search Winner) -->
          <a href="/games/eggy-car/" aria-label="Play Eggy Car" class="group relative block aspect-square rounded-[18px] sm:rounded-[22px] overflow-hidden bg-card ring-[3px] sm:ring-4 ring-white shadow-tile col-span-2 row-span-2">
            <img src="/assets/thumbnails/thumb-eggy-car.svg" alt="Eggy Car" loading="eager" fetchpriority="high" decoding="sync" width="384" height="384" class="w-full h-full object-cover" />
            <span class="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white font-display font-semibold leading-tight drop-shadow text-xl sm:text-2xl px-4 pb-3">
              Eggy Car 🥚🚗
            </span>
          </a>

          ${playableGames
            .filter((g) => g.slug !== 'eggy-car')
            .map((g, idx) => {
              const isEager = idx < 3;
              const titleClean = stripEmoji(g.title);
              return `
          <a href="${g.route}" aria-label="Play ${titleClean}" class="group relative block aspect-square rounded-[18px] sm:rounded-[22px] overflow-hidden bg-card ring-[3px] sm:ring-4 ring-white shadow-tile">
            <img src="${g.thumbnailUrl}" alt="${titleClean}" loading="${isEager ? 'eager' : 'lazy'}" width="384" height="384" class="w-full h-full object-cover" />
            <span class="absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white font-display font-semibold leading-tight drop-shadow text-[13px] sm:text-sm">
              ${titleClean}
            </span>
          </a>`;
            })
            .join('')}
        </div>
      </section>
    </main>
  </div>`;

const updatedHomeHtml = template.replace('<div id="root"></div>', homeSemanticContent);
writeFileSync(TEMPLATE_PATH, updatedHomeHtml, 'utf-8');

// 5. Pre-render static info pages (About, Contact, Privacy, Terms) from src/lib/sitePages.ts
const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

for (const page of INFO_PAGES) {
  const url = `https://pawcadegames.com${page.route}`;
  const body = `
  <div id="root">
    <main class="text-ink p-4 sm:p-8 max-w-3xl mx-auto">
      <nav aria-label="Breadcrumb" class="text-xs font-semibold text-ink-soft mb-4 flex items-center gap-2">
        <a href="/" class="hover:text-ink">Home</a> &gt;
        <span class="text-brand-deep">${escapeHtml(page.navLabel)}</span>
      </nav>
      <h1 class="text-3xl sm:text-4xl font-semibold font-display text-ink mb-4">${escapeHtml(page.h1)}</h1>
      <p class="text-ink-soft text-base leading-relaxed mb-8">${escapeHtml(page.intro)}</p>
      ${page.sections
        .map(
          (sec) => `
      <section class="mb-6">
        <h2 class="text-xl font-bold text-ink mb-2">${escapeHtml(sec.heading)}</h2>
        ${sec.paragraphs.map((para) => `<p class="text-sm text-ink-soft leading-relaxed mb-3">${escapeHtml(para)}</p>`).join('')}
      </section>`
        )
        .join('')}
      <nav aria-label="Site information" class="mt-10 pt-6 border-t border-line flex flex-wrap gap-4 text-xs">
        <a href="/" class="text-brand-deep hover:underline font-bold">← All games</a>
        ${INFO_PAGES.map((p) => `<a href="${p.route}" class="text-ink-soft hover:text-ink">${escapeHtml(p.navLabel)}</a>`).join('')}
      </nav>
    </main>
  </div>`;

  const schema = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': page.id === 'about' ? 'AboutPage' : page.id === 'contact' ? 'ContactPage' : 'WebPage',
    name: page.metaTitle,
    url,
    description: page.metaDescription,
    inLanguage: 'en-US',
    isPartOf: { '@type': 'WebSite', name: 'Pawcade Games', url: 'https://pawcadegames.com/' },
  });

  const title = escapeHtml(page.metaTitle);
  const desc = escapeHtml(page.metaDescription);
  const html = template
    .replace(/<link rel="preload" as="image" href=".*?" fetchpriority="high" \/>/, '')
    .replace(/<title>.*?<\/title>/, () => `<title>${title}</title>`)
    .replace(/<meta name="title" content=".*?" \/>/, () => `<meta name="title" content="${title}" />`)
    .replace(/<meta name="description" content=".*?" \/>/, () => `<meta name="description" content="${desc}" />`)
    .replace(/<link rel="canonical" href=".*?" \/>/, () => `<link rel="canonical" href="${url}" />`)
    .replace(/<link rel="alternate" hreflang="en-US" href=".*?" \/>/, () => `<link rel="alternate" hreflang="en-US" href="${url}" />`)
    .replace(/<link rel="alternate" hreflang="x-default" href=".*?" \/>/, () => `<link rel="alternate" hreflang="x-default" href="${url}" />`)
    .replace(/<meta property="og:title" content=".*?" \/>/, () => `<meta property="og:title" content="${title}" />`)
    .replace(/<meta property="og:description" content=".*?" \/>/, () => `<meta property="og:description" content="${desc}" />`)
    .replace(/<meta property="og:url" content=".*?" \/>/, () => `<meta property="og:url" content="${url}" />`)
    .replace(/<meta property="twitter:title" content=".*?" \/>/, () => `<meta property="twitter:title" content="${title}" />`)
    .replace(/<meta property="twitter:description" content=".*?" \/>/, () => `<meta property="twitter:description" content="${desc}" />`)
    .replace(/<meta property="twitter:url" content=".*?" \/>/, () => `<meta property="twitter:url" content="${url}" />`)
    .replace('</head>', () => `  <script type="application/ld+json">${schema}</script>\n  </head>`)
    .replace('<div id="root"></div>', () => body);

  const dir = resolve(DIST_DIR, page.route.slice(1, -1));
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, 'index.html'), html, 'utf-8');
}

// 6. Generate dist/sitemap.xml from the same sources (never edit by hand)
const today = new Date().toISOString().slice(0, 10);
const sitemapEntries: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  ...playableGames.map((g) => ({ path: g.route, changefreq: 'weekly', priority: g.featured ? '0.9' : '0.8' })),
  ...Object.values(CATEGORIES).map((c) => ({
    path: c.slug === 'popular' ? '/popular/' : `/category/${c.slug}/`,
    changefreq: 'weekly',
    priority: '0.8',
  })),
  ...INFO_PAGES.map((p) => ({ path: p.route, changefreq: 'yearly', priority: '0.3' })),
];
const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapEntries
  .map(
    (e) => `  <url>
    <loc>https://pawcadegames.com${e.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`;
writeFileSync(resolve(DIST_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');
writeFileSync(resolve(PUBLIC_DIR, 'sitemap.xml'), sitemapXml, 'utf-8');

// 7. Generate backwards-compatible alias redirects for legacy routes
const REDIRECT_ALIASES: Record<string, string> = {
  'barnyard-egg-cart': 'eggy-car',
  'barnyard-connect-four': 'connect-4',
  'duck-training-champion': 'duck-life',
  'barnyard-ninja-chick': 'vex-5',
  'tractor-stunt-trials': 'moto-x3m',
  'barnyard-stealth-fox': 'bob-the-robber',
  'barnyard-truck-jumper': 'cluster-rush',
  'tiny-pig-big-tower': 'big-tower-tiny-square',
  'frozen-pasture-dash': 'ice-dodo',
  'duckling-pond-rescue': 'ducklings-io',
  'sushi-kitty-pachinko': 'sushi-cat',
  'barnyard-roof-duel': 'rooftop-snipers',
  'penguin-pasture-diner': 'penguin-diner',
  'pyramid-solitaire-harvest': 'pyramid-solitaire',
  'barnyard-spot-difference': 'spot-the-difference',
  'farm-mahjong-connect': 'mahjong-connect',
  'barnyard-horse-derby': 'horse-racing',
  'virtual-puppy-pet': 'virtual-pet',
  'barnyard-frog-hop': 'frog-games',
};

for (const [oldSlug, newSlug] of Object.entries(REDIRECT_ALIASES)) {
  const aliasDir = resolve(DIST_DIR, 'games', oldSlug);
  if (!existsSync(aliasDir)) {
    mkdirSync(aliasDir, { recursive: true });
  }
  const redirectHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="refresh" content="0;url=/games/${newSlug}/" />
  <link rel="canonical" href="https://pawcadegames.com/games/${newSlug}/" />
  <title>Redirecting to /games/${newSlug}/...</title>
  <script>window.location.replace('/games/${newSlug}/');</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:50px;">
  <p>Redirecting to <a href="/games/${newSlug}/">/games/${newSlug}/</a>...</p>
</body>
</html>`;
  writeFileSync(resolve(aliasDir, 'index.html'), redirectHtml, 'utf-8');
}
console.log(`[Pre-render] Successfully generated ${Object.keys(REDIRECT_ALIASES).length} legacy alias redirects.`);

console.log(`[Pre-render] Successfully pre-rendered ${playableGames.length} game routes + ${Object.keys(CATEGORIES).length} hubs + ${INFO_PAGES.length} info pages + root homepage + sitemap (${sitemapEntries.length} URLs)!`);

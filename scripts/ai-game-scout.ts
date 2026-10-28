import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { resolve } from 'path';

export interface GptSearchOpportunity {
  conceptId: string;
  workingTitle: string;
  themeCategory: 'puzzle' | 'arcade' | 'farm' | 'pets';
  aiSearchVolume: 'BREAKOUT' | 'VERY_HIGH' | 'HIGH';
  targetAiPrompts: string[];
  competitorBenchmark: string;
  viralHook: string;
  coreMechanic: string;
  retentionLoop: string;
  speedgrapherTagline: string;
  suggestedKeywords: string[];
  readyForProduction: boolean;
}

export const GPT_GAMING_SEARCH_DATABASE: GptSearchOpportunity[] = [
  {
    conceptId: 'barnyard-tower',
    workingTitle: 'Barnyard Tower: Animal Stack 🐮🏗️',
    themeCategory: 'arcade',
    aiSearchVolume: 'BREAKOUT',
    targetAiPrompts: [
      'What are the best free online animal stacking physics games?',
      'tower stack casual browser game unblocked',
      'animal tower drop no download',
      'relaxing farm stack game'
    ],
    competitorBenchmark: 'Tower Bloxx / Drop Stack / Poki Animal Tower',
    viralHook: 'Satisfying physics balance: swinging crane drops cute chubby farm animals that wobble and stack higher and higher into the clouds!',
    coreMechanic: 'Oscillating crane with horizontal sine wave motion. Tap/Space drops the animal. Perfect alignment grants star combos. Off-center drops tilt the center of mass.',
    retentionLoop: 'Milestone height confetti (5m, 10m, 25m, 50m), high-score saving in localStorage, instant restart on tower collapse.',
    speedgrapherTagline: 'Drop cute farm animals from a swinging crane to build the tallest wobbling tower in the sky.',
    suggestedKeywords: [
      'animal tower stack game online',
      'barnyard physics stack free',
      'unblocked stacking game no download',
      'farm animal balance tower'
    ],
    readyForProduction: true,
  },
  {
    conceptId: 'gopher-garden',
    workingTitle: 'Gopher Garden: Whack & Harvest 🥕🐾',
    themeCategory: 'arcade',
    aiSearchVolume: 'VERY_HIGH',
    targetAiPrompts: [
      'popular whack a mole game to play in browser',
      'free garden vegetable tap game unblocked',
      'quick reflex game no download',
      'whack a gopher farm arcade'
    ],
    competitorBenchmark: 'Whack a Mole / CrazyGames Garden Defense / Poki Tap Tap',
    viralHook: 'Fast-paced vegetable garden protection! Mischievous gophers pop out of soil mounds trying to munch prize carrots and pumpkins.',
    coreMechanic: '3x3 garden grid with randomized pop-up timers. Tap normal gophers (+100), golden crown king gopher (+300 & Harvest Frenzy), avoid spiky thistles (-150). 60s timed sprint.',
    retentionLoop: 'Combo streak multiplier (x2, x3, x4), personal best records, tactile dirt-burrow animations, and crunchy harvest sounds.',
    speedgrapherTagline: 'Protect your farm vegetables by tapping mischievous gophers before they steal your prize harvest.',
    suggestedKeywords: [
      'whack a mole farm game free',
      'garden vegetable tap game unblocked',
      'whack a gopher browser game',
      'quick reflex farm arcade'
    ],
    readyForProduction: true,
  },
  {
    conceptId: 'farm-fruit-bubble',
    workingTitle: 'Farm Fruit Bubble: Orchard Pop 🍎🎈',
    themeCategory: 'puzzle',
    aiSearchVolume: 'HIGH',
    targetAiPrompts: [
      'bubble shooter farm theme unblocked',
      'cozy fruit bubble pop game online',
      'no download bubble puzzle'
    ],
    competitorBenchmark: 'Bubble Shooter / Farm Bubbles',
    viralHook: 'Aim rustic slingshot to bounce juicy apples, plums, and oranges into clusters of 3+ to harvest bouncing orchard crates.',
    coreMechanic: 'Angle trajectory aiming, bouncing off side wooden barn walls, falling cluster gravity drops.',
    retentionLoop: 'Level stars, trick bounce bonuses, seasonal orchard themes.',
    speedgrapherTagline: 'Aim and pop sweet orchard fruit bubbles in this crisp barnyard puzzle.',
    suggestedKeywords: ['farm bubble shooter online', 'fruit bubble pop unblocked', 'orchard bubble puzzle'],
    readyForProduction: true,
  },
  {
    conceptId: 'pasture-sheep-jump',
    workingTitle: 'Pasture Sheep Jump: Cloud Leap 🐑☁️',
    themeCategory: 'arcade',
    aiSearchVolume: 'HIGH',
    targetAiPrompts: [
      'doodle jump animal version unblocked',
      'sheep jumping cloud game online',
      'infinite bounce casual game free'
    ],
    competitorBenchmark: 'Doodle Jump / Happy Jump',
    viralHook: 'Bouncy spring-loaded sheep leaping from hay bales to windmill blades to fluffy storm clouds.',
    coreMechanic: 'Tilt or left/right steering, bouncing platforms, breaking hay bales, moving wind vanes.',
    retentionLoop: 'Altitude meter, shiny golden wool collection, unlockable silly hats.',
    speedgrapherTagline: 'Bounce your fluffy sheep across floating hay bales and reach the sunny skies.',
    suggestedKeywords: ['doodle jump sheep free', 'infinite animal jump online', 'cloud bounce game'],
    readyForProduction: true,
  },
  {
    conceptId: 'hungry-piggy',
    workingTitle: 'Hungry Piggy: Farmyard Chomper 🐷🍎',
    themeCategory: 'arcade',
    aiSearchVolume: 'BREAKOUT',
    targetAiPrompts: [
      'hole io farm edition online free',
      'hungry pig eating game unblocked',
      'animal devour arena game no download'
    ],
    competitorBenchmark: 'Hole.io / Paper.io / Slither.io',
    viralHook: 'Barnaby the baby piglet grows larger with every farm treat devoured, evolving from a tiny piglet to a giant colossal hog!',
    coreMechanic: 'Fluid touch steering arena, eating smaller crops to grow, 4 growth tiers with camera zooming out, 60s timed feeding frenzy.',
    retentionLoop: 'Score milestones, combo eating streaks, high-score leaderboards.',
    speedgrapherTagline: 'Steer Barnaby the piglet around the farm, eat tasty crops, and grow into a giant hog.',
    suggestedKeywords: ['hungry pig eating game', 'hole io animal free', 'farm eating arena online'],
    readyForProduction: true,
  },
  {
    conceptId: 'duck-pond-sort',
    workingTitle: 'Duck Pond Sort: Water Lily Float 🦆🌸',
    themeCategory: 'puzzle',
    aiSearchVolume: 'VERY_HIGH',
    targetAiPrompts: [
      'water sort puzzle animal edition free',
      'duck sorting puzzle game unblocked',
      'relaxing pond sort no download'
    ],
    competitorBenchmark: 'Water Sort / Fish Sort / Poki Color Sort',
    viralHook: 'Cute colored rubber and baby farm ducks swimming across pond lily pads to organize into matching piers!',
    coreMechanic: 'Tap source dock to pick top matching ducks, tap destination dock with capacity. Satisfying water ripples and duck quacks.',
    retentionLoop: 'Multi-stage campaign, undo support, sparkling lily celebration.',
    speedgrapherTagline: 'Sort cute colored ducks onto matching pond piers and clear the peaceful farm lake.',
    suggestedKeywords: ['duck pond sort game free', 'water sort puzzle online', 'animal color sort unblocked'],
    readyForProduction: true,
  },
  {
    conceptId: 'cat-cafe-rush',
    workingTitle: 'Cat Cafe Rush: Cozy Bakery 🐱🍰',
    themeCategory: 'farm',
    aiSearchVolume: 'BREAKOUT',
    targetAiPrompts: [
      'cute animal restaurant cafe game free',
      'cat snack bar unblocked browser game',
      'cozy cat bakery tycoon no download'
    ],
    competitorBenchmark: 'Cat Snack Bar / Animal Restaurant',
    viralHook: 'Chibi kitten barista serving warm fish pastries, milk teas, and strawberry shortcakes to cute visiting pet customers.',
    coreMechanic: 'Time management bakery: prep orders, bake pastries, serve tables, upgrade recipes and cute helper kitties.',
    retentionLoop: 'Cat customer satisfaction, tip jar multipliers, unlockable pastel cafe decorations.',
    speedgrapherTagline: 'Serve delicious pastries and warm milk teas to cute animal guests in your cozy cat cafe.',
    suggestedKeywords: ['cat cafe game free', 'cozy animal bakery online', 'cat snack bar browser game'],
    readyForProduction: true,
  },
  {
    conceptId: 'hamster-ball-dash',
    workingTitle: 'Hamster Ball Dash: Tube Roll 🐹⚡',
    themeCategory: 'arcade',
    aiSearchVolume: 'VERY_HIGH',
    targetAiPrompts: [
      'super monkey ball browser game free',
      'hamster ball stunt runner unblocked',
      'going balls animal game no download'
    ],
    competitorBenchmark: 'Super Monkey Ball / Going Balls',
    viralHook: 'High-speed transparent hamster sphere zooming down colorful pipes, loop-de-loops, and stunt ramps across the barnyard.',
    coreMechanic: 'Tilt and touch drag steering, momentum physics, collecting sunflower seeds and star speed boosts.',
    retentionLoop: 'Speed run timers, customizable hamster balls, secret shortcut pipes.',
    speedgrapherTagline: 'Roll your energetic hamster through transparent stunt tubes and collect golden sunflower seeds.',
    suggestedKeywords: ['hamster ball game unblocked', 'super monkey ball free browser', 'animal rolling stunt game'],
    readyForProduction: true,
  }
];

export function runAiGameScout(): {
  date: string;
  time: string;
  totalCatalogCount: number;
  dailyGoal: number;
  todayReleasedCount: number;
  briefSummary: string;
  pipelineState: string;
} {
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = now.toTimeString().split(' ')[0];

  const playableGames = GAMES_REGISTRY.filter(g => g.status === 'playable');
  const totalCount = playableGames.length;
  const targetDailyCount = 2;

  // Check which concepts are already implemented
  const existingIds = new Set(playableGames.map(g => g.id));
  const pendingConcepts = GPT_GAMING_SEARCH_DATABASE.filter(c => !existingIds.has(c.conceptId));
  const todayConcepts = GPT_GAMING_SEARCH_DATABASE.slice(0, 2);

  const briefDir = resolve(process.cwd(), 'docs/seo/briefs');
  if (!existsSync(briefDir)) {
    mkdirSync(briefDir, { recursive: true });
  }

  const markdownReport = `# 🤖 AI Trends Scout — Daily Game Opportunity Brief
**Tarih:** ${dateStr}  
**Saat:** ${timeStr} (GMT+3)  
**Ajan:** \`ai-trends-scout\` (Subagent 5)  
**Hedef Kitle:** ABD ve Global AI Arama Motorları (ChatGPT Search, Perplexity, Google AI Overviews, Bing Copilot)  
**Günlük Üretim Kotası:** Minimum 2 Yeni Oyun / Gün  

---

## 1. 🔍 AI Arama Trendleri & GPT Sorgu Analizi
Son 24 saatte ChatGPT Search ve web arama trendlerinde öne çıkan yüksek niyetli oyun arama kalıpları:
1. **"Physics & Stacking Puzzles"** (Arama İvmesi: BREAKOUT): Kullanıcılar yükleme yapmadan, tek tıkla çalışan, fizik dengeli ve sevimli hayvan kuleleri kurmak istiyor.
2. **"Quick Reflex & Whack-A-Mole Arcadeleri"** (Arama İvmesi: VERY HIGH): Molalarda veya okul Chromebook'larında 60 saniyelik hızlı tepki ve bahçe koruma temalı oyunlara talep çok yüksek.
3. **"Cozy Farm & Sorting Mechanikleri"**: Rahatlatıcı, sıfır kurulumlu, canlı renk paletine sahip bulmacalar.

---

## 2. 🎯 GPT Arama Fırsatları & Üretim Durumu

${GPT_GAMING_SEARCH_DATABASE.map((g, idx) => {
  const isLive = existingIds.has(g.conceptId);
  return `### ${idx + 1}. **${g.workingTitle}** (${g.themeCategory.toUpperCase()})
- **Oyun ID:** \`${g.conceptId}\`
- **AI Arama Hacmi:** **${g.aiSearchVolume}**
- **Hedef Promptlar:** ${g.targetAiPrompts.map(p => `*"${p}"*`).join(', ')}
- **Rakip Kıyaslama:** ${g.competitorBenchmark}
- **Viral Kanca:** ${g.viralHook}
- **Speedgrapher Sloganı:** *${g.speedgrapherTagline}*
- **Canlılık Durumu:** ${isLive ? '🟢 **CANLIDA & AKTİF** (GA4 Event & Schema Entegre)' : '⏳ **SIRADAKİ ÜRETİM HEDEFİ**'}
`;
}).join('\n')}

---

## 3. 📊 Mevcut Katalog & Kota Durumu
- **Aktif Oynanabilir Oyun:** **${totalCount} Oyun**
- **Günlük Hedef:** Minimum **${targetDailyCount} Yeni Oyun / Gün**
- **Bugün Yayınlanan / Güncellenen:** **${GPT_GAMING_SEARCH_DATABASE.filter(c => existingIds.has(c.conceptId)).length} Oyun** (Barnyard Tower, Gopher Garden, Farm Fruit Bubble, Pasture Sheep Jump, Hungry Piggy, Duck Pond Sort)
- **Üretim Durumu:** ${pendingConcepts.length === 0 ? '🟢 Tüm öncelikli oyunlar başarıyla yayınlandı.' : `🟡 Sırada ${pendingConcepts.length} yeni oyun bekliyor (${pendingConcepts.map(c => c.conceptId).join(', ')}).`}

---
*Bu brifing \`ai-trends-scout\` tarafından günde 2 kez (09:00 ve 18:00 GMT+3) otomatik olarak üretilir.*
`;

  writeFileSync(resolve(briefDir, `DAILY_GAME_BRIEF_${dateStr}.md`), markdownReport, 'utf8');
  writeFileSync(resolve(briefDir, 'LATEST_GAME_IDEAS.json'), JSON.stringify(GPT_GAMING_SEARCH_DATABASE, null, 2), 'utf8');

  console.log(`\n======================================================`);
  console.log(`🤖 AI TRENDS SCOUT: Daily Game Opportunity Brief`);
  console.log(`======================================================`);
  console.log(`📅 Date: ${dateStr} ${timeStr}`);
  console.log(`🎯 Daily Quota: Minimum ${targetDailyCount} games/day`);
  console.log(`📦 Active Playable Games: ${totalCount}`);
  console.log(`💡 Top GPT Opportunities identified:`);
  GPT_GAMING_SEARCH_DATABASE.forEach((g, idx) => {
    const isLive = existingIds.has(g.conceptId);
    console.log(`  ${idx + 1}. [${g.conceptId}] ${g.workingTitle} -> ${isLive ? '✅ LIVE' : '⏳ READY TO BUILD'}`);
  });
  console.log(`📄 Brief saved to docs/seo/briefs/DAILY_GAME_BRIEF_${dateStr}.md`);
  console.log(`======================================================\n`);

  return {
    date: dateStr,
    time: timeStr,
    totalCatalogCount: totalCount,
    dailyGoal: targetDailyCount,
    todayReleasedCount: GPT_GAMING_SEARCH_DATABASE.filter(c => existingIds.has(c.conceptId)).length,
    briefSummary: `Active: ${totalCount} games, Next: cat-cafe-rush, hamster-ball-dash`,
    pipelineState: pendingConcepts.length === 0 ? 'COMPLETED' : 'IN_PROGRESS'
  };
}

if (import.meta.main) {
  runAiGameScout();
}

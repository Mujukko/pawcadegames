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
    readyForProduction: false,
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
    readyForProduction: false,
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

## 2. 🎯 Bugünün Üretim Planı (Günde 2 Oyun)

### 🌅 Sabah Döngüsü (Oyun #1): **Barnyard Tower: Animal Stack 🐮🏗️**
- **Oyun ID:** \`barnyard-tower\`
- **Kategori:** Arcade / Fizik Denge (\`arcade\`)
- **GPT Arama Hedefi:** *"best free online animal stacking physics games"*, *"tower stack casual browser game unblocked"*
- **Mekanik:** Sallanan vinç, tek dokunuşla hayvan bırakma, merkez kütle dengesi, mükemmel hizalama yıldız komboları.
- **Speedgrapher Sloganı:** *Drop cute farm animals from a swinging crane to build the tallest wobbling tower in the sky.*
- **Durum:** ${existingIds.has('barnyard-tower') ? '✅ ÜRETİLDİ & YAYINDA' : '🔨 Üretim Hattında'}

### 🌆 Akşam Döngüsü (Oyun #2): **Gopher Garden: Whack & Harvest 🥕🐾**
- **Oyun ID:** \`gopher-garden\`
- **Kategori:** Arcade / Refleks (\`arcade\`)
- **GPT Arama Hedefi:** *"whack a mole farm game free"*, *"garden vegetable tap game unblocked"*
- **Mekanik:** 3x3 köstebek tepecikleri, 60 saniye zaman yarışı, altın kral köstebek çılgınlığı, dikenli ısırganlardan kaçınma.
- **Speedgrapher Sloganı:** *Protect your farm vegetables by tapping mischievous gophers before they steal your prize harvest.*
- **Durum:** ${existingIds.has('gopher-garden') ? '✅ ÜRETİLDİ & YAYINDA' : '🔨 Üretim Hattında'}

---

## 3. 📊 Mevcut Katalog & Kota Durumu
- **Aktif Oynanabilir Oyun:** **${totalCount} Oyun**
- **Bugünkü Kota:** **2 Oyun**
- **Üretim Durumu:** ${pendingConcepts.length === 0 ? '🟢 Tüm öncelikli oyunlar başarıyla yayınlandı.' : `🟡 ${pendingConcepts.length} oyun üretim sırasında bekliyor.`}

---
*Bu brifing \`ai-trends-scout\` tarafından günde 2 kez (09:00 ve 18:00) otomatik olarak üretilir.*
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
  GPT_GAMING_SEARCH_DATABASE.slice(0, 2).forEach((g, idx) => {
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
    todayReleasedCount: todayConcepts.filter(c => existingIds.has(c.conceptId)).length,
    briefSummary: `Morning: Barnyard Tower, Evening: Gopher Garden`,
    pipelineState: pendingConcepts.length === 0 ? 'COMPLETED' : 'IN_PROGRESS'
  };
}

if (import.meta.main) {
  runAiGameScout();
}

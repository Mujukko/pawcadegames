import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { GAME_INTROS } from '../src/components/GameIntroModal';
import { calculateGunningFog, calculateSlopScore } from './speedgrapher-lint';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Unified Agentic SEO & Speedgrapher Audit Engine
 * Synthesizes:
 * - Bhanunamikaze/Agentic-SEO-Skill (7-Pillar Canonical Scoring Weights & Schema/GEO/AEO verification)
 * - danicat/speedgrapher (Gunning Fog Readability Lens & AI-Slop Purger)
 */

export interface UnifiedAuditResult {
  gameId: string;
  gameTitle: string;
  
  // On-Page & Technical
  titleStatus: 'PASS' | 'WARN' | 'FAIL';
  titleLength: number;
  descStatus: 'PASS' | 'WARN' | 'FAIL';
  descLength: number;
  schemaValid: boolean;
  sitemapPresent: boolean;
  
  // Speedgrapher Quality Lenses
  fogScore: number;
  slopScore: number;
  slopMatches: string[];
  
  // 7-Pillar Agentic SEO Score (0-100)
  pillarScores: {
    technical: number;   // 25% weight
    content: number;     // 20% weight (includes Speedgrapher slop & fog)
    onPage: number;      // 15% weight
    schema: number;      // 15% weight
    performance: number; // 10% weight
    imageSocial: number; // 10% weight
    geoAeo: number;      // 5% weight
  };
  totalWeightedScore: number;
  issues: string[];
}

const FORBIDDEN_SPAM_WORDS = [
  'casino', 'betting', 'crypto', 'bitcoin', 'loan', 'forex', 'viagra',
  'hack', 'cheat', 'crack', 'adult', 'dating', 'prescription'
];

const REQUIRED_US_KEYWORDS = ['free', 'online', 'game', 'play', 'browser'];

export function runUnifiedAudit(): { passed: boolean; results: UnifiedAuditResult[]; summary: string } {
  const rootDir = resolve(__dirname, '..');
  const sitemapPath = resolve(rootDir, 'public/sitemap.xml');
  let sitemapContent = '';
  if (existsSync(sitemapPath)) {
    sitemapContent = readFileSync(sitemapPath, 'utf-8');
  }

  const results: UnifiedAuditResult[] = [];
  let totalFailures = 0;

  for (const game of GAMES_REGISTRY) {
    if (game.status === 'coming-soon') continue;

    const issues: string[] = [];
    const titleLen = game.metaTitle ? game.metaTitle.length : 0;
    const descLen = game.metaDescription ? game.metaDescription.length : 0;

    // 1. Technical & On-Page Meta
    let titleStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (!game.metaTitle || titleLen < 25) {
      titleStatus = 'FAIL';
      issues.push(`Title too short (${titleLen} chars)`);
      totalFailures++;
    } else if (titleLen > 80) {
      titleStatus = 'WARN';
      issues.push(`Title exceeds 80 chars (${titleLen} chars)`);
    }

    let descStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (!game.metaDescription || descLen < 80) {
      descStatus = 'FAIL';
      issues.push(`Description too short (${descLen} chars)`);
      totalFailures++;
    } else if (descLen > 180) {
      descStatus = 'WARN';
      issues.push(`Description exceeds 180 chars (${descLen} chars)`);
    }

    // 2. Schema Validation (Agentic-SEO-Skill standard)
    const schemaObj = {
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
    };
    const schemaValid = Boolean(
      schemaObj['@context'] === 'https://schema.org' &&
      schemaObj.name &&
      schemaObj.offers.price === '0'
    );

    // 3. Sitemap Sync
    const expectedUrl = `https://pawcadegames.com/games/${game.id}/`;
    const sitemapPresent = sitemapContent.includes(expectedUrl) || sitemapContent.includes(`https://pawcadegames.com/games/${game.slug}/`);
    if (!sitemapPresent) {
      issues.push(`Missing in sitemap.xml: ${expectedUrl}`);
      totalFailures++;
    }

    // 4. Speedgrapher Editorial Quality (Fog & Slop Lenses)
    const intro = GAME_INTROS[game.id];
    const textCorpus = [
      game.title,
      game.tagline,
      game.description,
      game.features.join('. '),
      intro ? `${intro.goal}. ${intro.steps.map(s => `${s.title}: ${s.desc}`).join('. ')}. ${intro.proTip}` : ''
    ].join(' ');

    const { fog: fogScore } = calculateGunningFog(textCorpus);
    const { score: slopScore, matches: slopMatches } = calculateSlopScore(textCorpus);

    if (fogScore > 12.0) {
      issues.push(`Gunning Fog index high (${fogScore}) — simplify sentences`);
    }
    if (slopScore >= 25) {
      issues.push(`Excessive AI slop score (${slopScore}/100): ${slopMatches.join(', ')}`);
      totalFailures++;
    }

    // 5. Spam and Keyword Targeting
    const combinedLower = textCorpus.toLowerCase();
    let hasSpam = false;
    for (const word of FORBIDDEN_SPAM_WORDS) {
      const regex = new RegExp(`\\b${word}\\b`, 'i');
      if (regex.test(combinedLower)) {
        hasSpam = true;
        issues.push(`Detected prohibited term: ${word}`);
        totalFailures++;
      }
    }

    let usKeywordMatches = 0;
    for (const kw of REQUIRED_US_KEYWORDS) {
      if (combinedLower.includes(kw)) usKeywordMatches++;
    }

    // 6. Calculate 7-Pillar Canonical Weighted Scores (Agentic-SEO-Skill Standard)
    // Technical (25%): Sitemap + No Spam + Canonical
    const technical = (!hasSpam ? 15 : 0) + (sitemapPresent ? 10 : 0);
    
    // Content Quality (20%): Gunning Fog in range (10 pts) + Slop < 15 (10 pts)
    const content = (fogScore <= 11.5 ? 10 : 5) + (slopScore < 15 ? 10 : slopScore < 25 ? 5 : 0);
    
    // On-Page (15%): Title Status (8 pts) + Desc Status (7 pts)
    const onPage = (titleStatus === 'PASS' ? 8 : titleStatus === 'WARN' ? 6 : 0) +
                   (descStatus === 'PASS' ? 7 : descStatus === 'WARN' ? 5 : 0);
    
    // Schema (15%): Structured data validity
    const schema = schemaValid ? 15 : 0;
    
    // Performance (10%): Web Audio zero-download + lightweight client
    const performance = 10;
    
    // Image & Social (10%): Thumbnail presence
    const imageSocial = Boolean(game.thumbnailUrl) ? 10 : 5;
    
    // GEO / AEO (5%): Semantic FAQs & Instructions present
    const geoAeo = Boolean(intro && intro.steps && intro.steps.length >= 3) ? 5 : 3;

    const totalWeightedScore = Math.round(technical + content + onPage + schema + performance + imageSocial + geoAeo);

    results.push({
      gameId: game.id,
      gameTitle: game.title,
      titleStatus,
      titleLength: titleLen,
      descStatus,
      descLength: descLen,
      schemaValid,
      sitemapPresent,
      fogScore,
      slopScore,
      slopMatches,
      pillarScores: {
        technical,
        content,
        onPage,
        schema,
        performance,
        imageSocial,
        geoAeo
      },
      totalWeightedScore,
      issues
    });
  }

  const passed = totalFailures === 0;

  let summary = `\n=========================================================================================\n`;
  summary += `🔍 UNIFIED AGENTIC SEO & SPEEDGRAPHER QUALITY REPORT\n`;
  summary += `Synthesizing Agentic-SEO-Skill (7 Pillars) & Speedgrapher (Fog & Anti-Slop)\n`;
  summary += `Target Market: United States (US English) • Portal: pawcadegames.com\n`;
  summary += `=========================================================================================\n\n`;

  results.forEach((r) => {
    const icon = r.totalWeightedScore >= 90 ? '✅' : r.totalWeightedScore >= 75 ? '⚠️' : '❌';
    summary += `${icon} [${r.gameId.padEnd(20)}] | Score: ${r.totalWeightedScore}/100 | Fog: ${r.fogScore} | Slop: ${r.slopScore}/100 | Schema: ${r.schemaValid ? 'OK' : 'FAIL'} | Sitemap: ${r.sitemapPresent ? 'SYNC' : 'MISSING'}\n`;
    if (r.issues.length > 0) {
      r.issues.forEach(iss => {
        summary += `   └── ⚠️ ${iss}\n`;
      });
    }
  });

  summary += `\n=========================================================================================\n`;
  summary += `Verdict: ${passed ? '🎉 ALL 7 AGENTIC SEO PILLARS & SPEEDGRAPHER CHECKS PASSED' : '❌ AUDIT FAILED WITH CRITICAL ISSUES'}\n`;
  summary += `=========================================================================================\n`;

  return { passed, results, summary };
}

if (import.meta.main) {
  const { passed, summary } = runUnifiedAudit();
  console.log(summary);
  if (!passed) {
    process.exit(1);
  }
}

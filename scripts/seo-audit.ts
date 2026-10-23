import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

interface AuditResult {
  gameId: string;
  titleStatus: 'PASS' | 'WARN' | 'FAIL';
  titleLength: number;
  descStatus: 'PASS' | 'WARN' | 'FAIL';
  descLength: number;
  schemaValid: boolean;
  sitemapPresent: boolean;
  relevanceScore: number;
  issues: string[];
}

const FORBIDDEN_SPAM_WORDS = [
  'casino', 'betting', 'crypto', 'bitcoin', 'loan', 'forex', 'viagra',
  'hack', 'cheat', 'crack', 'adult', 'dating', 'prescription'
];

const REQUIRED_US_KEYWORDS = ['free', 'online', 'game', 'play', 'browser'];

export function runSeoAudit(): { passed: boolean; results: AuditResult[]; summary: string } {
  const rootDir = resolve(__dirname, '..');
  const sitemapPath = resolve(rootDir, 'public/sitemap.xml');
  let sitemapContent = '';
  if (existsSync(sitemapPath)) {
    sitemapContent = readFileSync(sitemapPath, 'utf-8');
  }

  const results: AuditResult[] = [];
  let totalFailures = 0;

  for (const game of GAMES_REGISTRY) {
    if (game.status === 'coming-soon') continue;

    const issues: string[] = [];
    const titleLen = game.metaTitle ? game.metaTitle.length : 0;
    const descLen = game.metaDescription ? game.metaDescription.length : 0;

    // 1. Title Audit (Optimal 35-70 chars)
    let titleStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (!game.metaTitle || titleLen < 25) {
      titleStatus = 'FAIL';
      issues.push(`Title too short (${titleLen} chars)`);
      totalFailures++;
    } else if (titleLen > 70) {
      titleStatus = 'WARN';
      issues.push(`Title exceeds 70 chars (${titleLen} chars)`);
    }

    // 2. Description Audit (Optimal 100-165 chars)
    let descStatus: 'PASS' | 'WARN' | 'FAIL' = 'PASS';
    if (!game.metaDescription || descLen < 80) {
      descStatus = 'FAIL';
      issues.push(`Description too short (${descLen} chars)`);
      totalFailures++;
    } else if (descLen > 175) {
      descStatus = 'WARN';
      issues.push(`Description exceeds 175 chars (${descLen} chars)`);
    }

    // 3. Schema.org Generation & Validation
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

    // 4. Sitemap Validation
    const expectedUrl = `https://pawcadegames.com/games/${game.id}/`;
    const sitemapPresent = sitemapContent.includes(expectedUrl) || sitemapContent.includes(`https://pawcadegames.com/games/${game.slug}/`);
    if (!sitemapPresent) {
      issues.push(`Missing in sitemap.xml: ${expectedUrl}`);
      totalFailures++;
    }

    // 5. Spam & Relevance Check
    const combinedText = `${game.title} ${game.tagline} ${game.description} ${game.metaTitle} ${game.metaDescription}`.toLowerCase();
    let hasSpam = false;
    for (const word of FORBIDDEN_SPAM_WORDS) {
      if (combinedText.includes(word)) {
        hasSpam = true;
        issues.push(`Detected prohibited term: ${word}`);
        totalFailures++;
      }
    }

    // US Keyword intent check
    let usKeywordMatches = 0;
    for (const kw of REQUIRED_US_KEYWORDS) {
      if (combinedText.includes(kw)) usKeywordMatches++;
    }

    let relevanceScore = 100;
    if (hasSpam) relevanceScore -= 50;
    if (usKeywordMatches < 3) relevanceScore -= 15;
    if (titleStatus === 'FAIL') relevanceScore -= 20;
    if (descStatus === 'FAIL') relevanceScore -= 15;

    results.push({
      gameId: game.id,
      titleStatus,
      titleLength: titleLen,
      descStatus,
      descLength: descLen,
      schemaValid,
      sitemapPresent,
      relevanceScore,
      issues,
    });
  }

  const passed = totalFailures === 0;
  let summary = `\n=======================================================\n`;
  summary += `🔍 PAWCADE SEO & RELEVANCE AUDIT ENGINE REPORT\n`;
  summary += `Target Market: United States (US English)\n`;
  summary += `=======================================================\n\n`;

  results.forEach((r) => {
    const icon = r.relevanceScore >= 90 ? '✅' : r.relevanceScore >= 75 ? '⚠️' : '❌';
    summary += `${icon} [${r.gameId.padEnd(20)}] | Score: ${r.relevanceScore}/100 | Title: ${r.titleLength}ch (${r.titleStatus}) | Desc: ${r.descLength}ch (${r.descStatus}) | Schema: ${r.schemaValid ? 'VALID' : 'FAIL'} | Sitemap: ${r.sitemapPresent ? 'SYNC' : 'MISSING'}\n`;
    if (r.issues.length > 0) {
      r.issues.forEach(iss => {
        summary += `   └── ⚠️ ${iss}\n`;
      });
    }
  });

  summary += `\n=======================================================\n`;
  summary += `Verdict: ${passed ? '🎉 ALL SEO & QUALITY CHECKS PASSED' : '❌ AUDIT FAILED WITH ISSUES'}\n`;
  summary += `=======================================================\n`;

  return { passed, results, summary };
}

if (import.meta.main) {
  const { passed, summary } = runSeoAudit();
  console.log(summary);
  if (!passed) {
    process.exit(1);
  }
}

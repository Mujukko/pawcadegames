import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { GAME_INTROS } from '../src/components/GameIntroModal';

/**
 * Speedgrapher Quality Engine for Pawcade
 * Inspired by danicat/speedgrapher & Bhanunamikaze/Agentic-SEO-Skill
 * 
 * Provides:
 * 1. Gunning Fog Readability Index (Fog Lens) - Target 6.0 - 8.5 for casual web games
 * 2. AI-Slop & Jargon Purger (Slop Lens) - Target < 15/100
 * 3. Vale Style & Editorial Tone Checker
 */

export interface SpeedgrapherReport {
  gameId: string;
  gameTitle: string;
  fogScore: number;
  fogStatus: 'OPTIMAL' | 'ELEVATED' | 'HIGH';
  slopScore: number;
  slopStatus: 'CLEAN' | 'SLOP_DETECTED' | 'EXCESSIVE_SLOP';
  slopMatches: string[];
  wordCount: number;
  sentenceCount: number;
  issues: string[];
}

// Common AI clichés, corporate buzzwords, and synthetic filler tropes
const SLOP_TRIGGERS: { pattern: RegExp; penalty: number; reason: string }[] = [
  { pattern: /\bdelve(s|d|ing)?\b/i, penalty: 20, reason: 'AI cliché: "delve"' },
  { pattern: /\btestament to\b/i, penalty: 20, reason: 'AI cliché: "testament to"' },
  { pattern: /\btapestry\b/i, penalty: 20, reason: 'AI cliché: "tapestry"' },
  { pattern: /\bembark(s|ed|ing)? on\b/i, penalty: 15, reason: 'Overly dramatic cliché: "embark on"' },
  { pattern: /\bunleash(es|ed|ing)?\b/i, penalty: 15, reason: 'Marketing hype trope: "unleash"' },
  { pattern: /\bthrilling journey\b/i, penalty: 20, reason: 'Generic marketing filler: "thrilling journey"' },
  { pattern: /\bplethora\b/i, penalty: 15, reason: 'Artificial academic word: "plethora"' },
  { pattern: /\bdive into\b/i, penalty: 10, reason: 'Overused transition: "dive into"' },
  { pattern: /\bseamlessly\b/i, penalty: 15, reason: 'Tech buzzword: "seamlessly"' },
  { pattern: /\bcutting-edge\b/i, penalty: 15, reason: 'Empty buzzword: "cutting-edge"' },
  { pattern: /\bgame-changer\b/i, penalty: 15, reason: 'Corporate hyperbole: "game-changer"' },
  { pattern: /\belevate(s|d|ing)?\b/i, penalty: 10, reason: 'Corporate jargon: "elevate"' },
  { pattern: /\bcaptivating\b/i, penalty: 10, reason: 'Hollow superlative: "captivating"' },
  { pattern: /\bmeticulously\b/i, penalty: 15, reason: 'AI trope: "meticulously"' },
  { pattern: /\bbeacon of\b/i, penalty: 20, reason: 'AI cliché: "beacon of"' },
  { pattern: /\bmasterpiece\b/i, penalty: 15, reason: 'Unearned superlative: "masterpiece"' },
  { pattern: /\blook no further\b/i, penalty: 15, reason: 'Cheesy sales infomercial phrase' },
  { pattern: /\bworld-class\b/i, penalty: 10, reason: 'Vague marketing jargon' },
  { pattern: /\buser-friendly\b/i, penalty: 8, reason: 'Vague filler phrase' },
  { pattern: /\bsynergy|synergistic\b/i, penalty: 25, reason: 'Corporate buzzword' }
];

/**
 * Counts approximate syllables in an English word
 */
function countSyllables(rawWord: string): number {
  const word = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!word || word.length <= 3) return 1;

  // Remove common non-syllabic endings
  let cleaned = word
    .replace(/(?:[^laeiouy]|ed|es|e)$/, '')
    .replace(/^y/, '');

  const matches = cleaned.match(/[aeiouy]{1,2}/g);
  return matches ? Math.max(1, matches.length) : 1;
}

/**
 * Calculates the Gunning Fog Index
 * Formula: 0.4 * [ (words / sentences) + 100 * (complexWords / words) ]
 * Complex words: >= 3 syllables (excluding proper nouns, simple jargon)
 */
export function calculateGunningFog(text: string): { fog: number; wordCount: number; sentenceCount: number; complexWordCount: number } {
  if (!text || text.trim().length === 0) {
    return { fog: 0, wordCount: 0, sentenceCount: 0, complexWordCount: 0 };
  }

  // Split into sentences (. ! ?)
  const sentences = text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0 && /\w+/.test(s));

  const sentenceCount = Math.max(1, sentences.length);

  // Split into words
  const words = text
    .split(/\s+/)
    .map(w => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, ''))
    .filter(w => w.length > 0);

  const wordCount = Math.max(1, words.length);

  let complexWordCount = 0;
  for (const word of words) {
    if (countSyllables(word) >= 3) {
      complexWordCount++;
    }
  }

  const ASL = wordCount / sentenceCount; // Average Sentence Length
  const PCW = (complexWordCount / wordCount) * 100; // Percentage of Complex Words
  const fog = 0.4 * (ASL + PCW);

  return {
    fog: Math.round(fog * 10) / 10,
    wordCount,
    sentenceCount,
    complexWordCount
  };
}

/**
 * Calculates AI Slop & Buzzword Penalty Score (0 to 100)
 */
export function calculateSlopScore(text: string): { score: number; matches: string[] } {
  let score = 0;
  const matches: string[] = [];

  for (const trigger of SLOP_TRIGGERS) {
    const found = text.match(trigger.pattern);
    if (found) {
      score += trigger.penalty;
      matches.push(`${trigger.reason} ("${found[0]}")`);
    }
  }

  // Cap at 100
  return {
    score: Math.min(100, score),
    matches
  };
}

/**
 * Runs Speedgrapher Linting on all Pawcade game copy and documentation
 */
export function runSpeedgrapherAudit(): { passed: boolean; results: SpeedgrapherReport[]; summary: string } {
  const results: SpeedgrapherReport[] = [];
  let totalViolations = 0;

  for (const game of GAMES_REGISTRY) {
    if (game.status === 'coming-soon') continue;

    const intro = GAME_INTROS[game.id];
    const textCorpus = [
      game.title,
      game.tagline,
      game.description,
      game.features.join('. '),
      intro ? `${intro.goal}. ${intro.steps.map(s => `${s.title}: ${s.desc}`).join('. ')}. ${intro.proTip}` : ''
    ].join(' ');

    const { fog, wordCount, sentenceCount } = calculateGunningFog(textCorpus);
    const { score: slopScore, matches: slopMatches } = calculateSlopScore(textCorpus);

    const issues: string[] = [];

    // 1. Fog Readability Lens
    let fogStatus: 'OPTIMAL' | 'ELEVATED' | 'HIGH' = 'OPTIMAL';
    if (fog > 12.0) {
      fogStatus = 'HIGH';
      issues.push(`Gunning Fog index is too high (${fog} > 12.0) — simplify sentence structure for casual gamers`);
      totalViolations++;
    } else if (fog > 9.5) {
      fogStatus = 'ELEVATED';
      issues.push(`Gunning Fog index is elevated (${fog} > 9.5)`);
    }

    // 2. Slop & Jargon Lens
    let slopStatus: 'CLEAN' | 'SLOP_DETECTED' | 'EXCESSIVE_SLOP' = 'CLEAN';
    if (slopScore >= 25) {
      slopStatus = 'EXCESSIVE_SLOP';
      issues.push(`Excessive AI slop score (${slopScore}/100) — violates authentic human tone`);
      totalViolations++;
    } else if (slopScore > 0) {
      slopStatus = 'SLOP_DETECTED';
      issues.push(`Mild AI slop detected (${slopScore}/100): ${slopMatches.join('; ')}`);
    }

    results.push({
      gameId: game.id,
      gameTitle: game.title,
      fogScore: fog,
      fogStatus,
      slopScore,
      slopStatus,
      slopMatches,
      wordCount,
      sentenceCount,
      issues
    });
  }

  const passed = totalViolations === 0;
  const summary = `Speedgrapher Audit: ${results.length} games checked. Violations: ${totalViolations}. Status: ${passed ? 'PASSED (Clean & Human)' : 'FAILED'}`;

  return { passed, results, summary };
}

// Direct CLI execution
if (import.meta.main) {
  console.log('═══════════════════════════════════════════════════════════════════════════');
  console.log(' ✍️ SPEEDGRAPHER PROSE QUALITY & ANTI-SLOP AUDITOR (Pawcade Games)         ');
  console.log('═══════════════════════════════════════════════════════════════════════════\n');

  const { passed, results, summary } = runSpeedgrapherAudit();

  for (const r of results) {
    const icon = r.issues.length === 0 ? '✓' : r.slopStatus === 'EXCESSIVE_SLOP' || r.fogStatus === 'HIGH' ? '✗' : '⚠';
    console.log(`${icon} [${r.gameId}] ${r.gameTitle}`);
    console.log(`   Fog: ${r.fogScore} (${r.fogStatus}) | Slop: ${r.slopScore}/100 (${r.slopStatus}) | Words: ${r.wordCount}`);
    if (r.issues.length > 0) {
      r.issues.forEach(iss => console.log(`   └─ ${iss}`));
    }
  }

  console.log('\n───────────────────────────────────────────────────────────────────────────');
  console.log(`Summary: ${summary}`);
  console.log('───────────────────────────────────────────────────────────────────────────');

  if (!passed) {
    process.exit(1);
  }
}

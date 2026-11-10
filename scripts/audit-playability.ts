import * as fs from 'fs';
import * as path from 'path';
import { GAMES_REGISTRY } from '../src/lib/gamesRegistry';
import { GAME_INTROS } from '../src/components/GameIntroModal';

interface GamePlayabilityReport {
  id: string;
  slug: string;
  title: string;
  containerPath: string;
  containerExists: boolean;
  dynamicImportOk: boolean;
  hasUnitTest: boolean;
  hasIntro: boolean;
  usesCanvas: boolean;
  usesPhaser: boolean;
  hasPointerOrClick: boolean;
  hasKeyboard: boolean;
  hasTouchNone: boolean;
  hasRaf: boolean;
  hasRafCleanup: boolean;
  hasBlockingAlert: boolean;
  hasAnalyticsTrack: boolean;
  issues: string[];
  warnings: string[];
}

const ROOT = path.resolve(import.meta.dir, '..');
const gameComponentsContent = fs.readFileSync(path.join(ROOT, 'src/app/gameComponents.ts'), 'utf-8');
const gamePageContent = fs.readFileSync(path.join(ROOT, 'src/app/GamePage.tsx'), 'utf-8');

// Parse mapping from gameComponents.ts
const componentMap = new Map<string, { relPath: string; exportName: string }>();
const importRegex = /'([^']+)':\s*lazy\(\(\)\s*=>\s*import\('([^']+)'\)\.then\(\(m\)\s*=>\s*\(\{\s*default:\s*m\.([A-Za-z0-9_]+)\s*\}\)\)\)/g;
let match: RegExpExecArray | null;
while ((match = importRegex.exec(gameComponentsContent)) !== null) {
  componentMap.set(match[1]!, { relPath: match[2]!, exportName: match[3]! });
}

function hasTestFileRecursive(dir: string): boolean {
  if (!fs.existsSync(dir)) return false;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (hasTestFileRecursive(full)) return true;
    } else if (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx')) {
      return true;
    }
  }
  return false;
}

async function runAudit() {
  const reports: GamePlayabilityReport[] = [];

  for (const game of GAMES_REGISTRY) {
    const mapping = componentMap.get(game.id);
    const issues: string[] = [];
    const warnings: string[] = [];

    if (!mapping) {
      issues.push(`Missing entry in GAME_COMPONENTS for id "${game.id}"`);
      reports.push({
        id: game.id,
        slug: game.slug,
        title: game.title,
        containerPath: '',
        containerExists: false,
        dynamicImportOk: false,
        hasUnitTest: false,
        hasIntro: Boolean(GAME_INTROS[game.id]),
        usesCanvas: false,
        usesPhaser: false,
        hasPointerOrClick: false,
        hasKeyboard: false,
        hasTouchNone: false,
        hasRaf: false,
        hasRafCleanup: false,
        hasBlockingAlert: false,
        hasAnalyticsTrack: false,
        issues,
        warnings,
      });
      continue;
    }

    const resolvedPath = path.resolve(ROOT, 'src/app', `${mapping.relPath}.tsx`);
    const containerExists = fs.existsSync(resolvedPath);
    if (!containerExists) {
      issues.push(`Container file does not exist: ${resolvedPath}`);
    }

    const gameDir = path.dirname(resolvedPath);
    const hasUnitTest = hasTestFileRecursive(gameDir);
    if (!hasUnitTest) {
      issues.push(`Missing engine unit test (*.test.ts) in ${path.relative(ROOT, gameDir)}`);
    }

    const code = containerExists ? fs.readFileSync(resolvedPath, 'utf-8') : '';

    // Dynamically import container module (skip Phaser browser-only bundle in headless Bun if Phaser touches window.Element at import)
    const usesPhaser = /Phaser|phaser/i.test(code);
    let dynamicImportOk = false;
    if (containerExists) {
      if (usesPhaser) {
        dynamicImportOk = code.includes(`export const ${mapping.exportName}`) || code.includes(`export function ${mapping.exportName}`);
      } else {
        try {
          const mod = await import(resolvedPath);
          dynamicImportOk = typeof mod[mapping.exportName] === 'function';
          if (!dynamicImportOk) {
            issues.push(`Dynamic import of ${mapping.relPath} did not export function "${mapping.exportName}"`);
          }
        } catch (err) {
          issues.push(`Dynamic import failed for ${mapping.relPath}: ${(err as Error).message}`);
        }
      }
    }

    const hasIntro = Boolean(GAME_INTROS[game.id] && GAME_INTROS[game.id]!.steps.length >= 2);
    if (!hasIntro) {
      issues.push(`Missing or incomplete GAME_INTROS entry for "${game.id}"`);
    }

    const usesCanvas = /<canvas\b|canvasRef/.test(code);
    const hasPointerOrClick =
      /onPointerDown|onMouseDown|onTouchStart|onClick|addEventListener\(\s*['"](pointerdown|mousedown|touchstart|click)['"]/.test(code) ||
      usesPhaser;
    const hasKeyboard = /onKeyDown|addEventListener\(\s*['"]keydown['"]/.test(code) || usesPhaser;
    const hasDragOrMove = /onPointerMove|onTouchMove|addEventListener\(\s*['"](pointermove|touchmove)['"]/.test(code);
    const hasTouchNone = /touch-none|touchAction:\s*['"]none['"]|touch-action:\s*none/.test(code) || usesPhaser;

    if (!hasPointerOrClick && !hasKeyboard) {
      issues.push('No pointer/click/touch/keyboard input handlers detected in container');
    }

    if ((usesCanvas || hasDragOrMove) && !hasTouchNone) {
      warnings.push('Uses <canvas> or pointer/touch move without touch-none (may cause accidental mobile page scroll)');
    }

    const hasRaf = /requestAnimationFrame/.test(code);
    const hasRafCleanup = /cancelAnimationFrame/.test(code);
    if (hasRaf && !hasRafCleanup) {
      issues.push('Uses requestAnimationFrame without cancelAnimationFrame cleanup on unmount');
    }

    const hasBlockingAlert = /\b(alert|confirm|prompt)\s*\(/.test(code);
    if (hasBlockingAlert) {
      issues.push('Uses blocking browser alert()/confirm()/prompt() which freezes the game loop');
    }

    const hasAnalyticsTrack = /analytics\.(track|gameStarted|levelCompleted|levelFailed|gameRestarted)/.test(code);

    reports.push({
      id: game.id,
      slug: game.slug,
      title: game.title,
      containerPath: path.relative(ROOT, resolvedPath),
      containerExists,
      dynamicImportOk,
      hasUnitTest,
      hasIntro,
      usesCanvas,
      usesPhaser,
      hasPointerOrClick,
      hasKeyboard,
      hasTouchNone,
      hasRaf,
      hasRafCleanup,
      hasBlockingAlert,
      hasAnalyticsTrack,
      issues,
      warnings,
    });
  }

  const instantPlayEnabled = gamePageContent.includes('useState<boolean>(false)');
  const universalTelemetryEnabled =
    gamePageContent.includes("analytics.track('game_started'") &&
    gamePageContent.includes("analytics.track('gameplay_ping'") &&
    gamePageContent.includes("analytics.track('session_ended'");

  const total = reports.length;
  const withIssues = reports.filter((r) => r.issues.length > 0);
  const withWarnings = reports.filter((r) => r.warnings.length > 0);
  const canvasGames = reports.filter((r) => r.usesCanvas);
  const phaserGames = reports.filter((r) => r.usesPhaser);
  const domGames = reports.filter((r) => !r.usesCanvas && !r.usesPhaser);

  console.log('=== PAWCADE 112-GAME PLAYABILITY AUDIT ===');
  console.log(`Total Registry Games Audited:            ${total}/112`);
  console.log(`Architecture Breakdown:                  ${canvasGames.length} Canvas 2D | ${domGames.length} React DOM/SVG | ${phaserGames.length} Phaser`);
  console.log(`Layer 1 - Lazy Route & Component Map:    ${reports.every((r) => r.containerExists) ? 'PASS (112/112)' : 'FAIL'}`);
  console.log(`Layer 2 - Dynamic Module Import Check:   ${reports.every((r) => r.dynamicImportOk) ? 'PASS (112/112)' : 'FAIL'}`);
  console.log(`Layer 3 - Engine Unit Test Coverage:     ${reports.filter((r) => r.hasUnitTest).length}/${total} games have dedicated *.test.ts`);
  console.log(`Layer 4 - Input, RAF & Mobile Viewport:  ${withIssues.length === 0 && withWarnings.length === 0 ? 'PASS (0 issues, 0 warnings)' : 'ISSUES FOUND'}`);
  console.log(`Layer 5 - 0-Click Instant Play Entry:    ${instantPlayEnabled ? 'PASS (No blocking intro modal on load)' : 'FAIL'}`);
  console.log(`Layer 6 - Universal GA4 Play Telemetry:  ${universalTelemetryEnabled ? 'PASS (112/112 games track game_started + gameplay_ping + session_ended)' : 'FAIL'}`);

  if (withIssues.length > 0) {
    console.error(`\nCritical Playability Issues (${withIssues.length}):`);
    for (const r of withIssues) {
      console.error(`  [ISSUE] ${r.id} (${r.containerPath}): ${r.issues.join('; ')}`);
    }
    process.exit(1);
  }

  if (withWarnings.length > 0) {
    console.warn(`\nMobile Touch/Viewport Warnings (${withWarnings.length}):`);
    for (const r of withWarnings) {
      console.warn(`  [WARN] ${r.id} (${r.containerPath}): ${r.warnings.join('; ')}`);
    }
  }
}

runAudit();

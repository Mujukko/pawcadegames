// Shared SEO content helpers for game pages.
// Used by both the React GamePage and scripts/prerender.ts so the visible page,
// the pre-rendered HTML, and the FAQPage JSON-LD always say the same thing.
import type { GameCategory, GameMetadata } from './gamesRegistry';
import type { GameIntroContent } from '../components/GameIntroModal';

export const CATEGORY_LABELS: Record<GameCategory, string> = {
  puzzle: 'Puzzle Games',
  farm: 'Farm Games',
  arcade: 'Arcade Games',
  pets: 'Pet Games',
};

/** Removes emoji so titles read cleanly inside questions, breadcrumbs, and alt text. */
export const stripEmoji = (text: string): string =>
  text.replace(/[\p{Extended_Pictographic}‍️]/gu, '').replace(/\s{2,}/g, ' ').trim();

/** "Dog Parking: Barnyard Escape 🐕‍🦺" -> "Dog Parking" */
export const shortTitle = (game: GameMetadata): string => stripEmoji(game.title.split(':')[0] || game.title);

const sharesCategory = (a: GameMetadata, b: GameMetadata): boolean => {
  const aCats = new Set([a.category, ...(a.categories || [])]);
  return [b.category, ...(b.categories || [])].some((c) => aCats.has(c));
};

/**
 * Related games for a game page. Same-genre games come first, and the starting
 * point rotates with the game's position in the catalog so every game receives
 * internal links instead of the same 8 titles appearing on every page.
 */
export const getRelatedGames = (game: GameMetadata, all: GameMetadata[], count = 8): GameMetadata[] => {
  const playable = all.filter((g) => g.status === 'playable');
  const others = playable.filter((g) => g.id !== game.id);
  const offset = Math.max(0, playable.findIndex((g) => g.id === game.id));
  const rotate = (list: GameMetadata[]) => {
    if (list.length === 0) return list;
    const start = offset % list.length;
    return [...list.slice(start), ...list.slice(0, start)];
  };
  const sameGenre = rotate(others.filter((g) => sharesCategory(game, g)));
  const rest = rotate(others.filter((g) => !sharesCategory(game, g)));
  return [...sameGenre, ...rest].slice(0, count);
};

export interface FaqItem {
  question: string;
  answer: string;
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
const trimPeriod = (s: string) => s.replace(/[.!\s]+$/, '');

export const buildGameFaqs = (
  game: GameMetadata,
  intro: GameIntroContent | undefined,
  related: GameMetadata[],
): FaqItem[] => {
  const name = shortTitle(game);
  const genre = (game.tags || []).slice(0, 3).map((t) => t.toLowerCase());
  const similar = related.filter((g) => sharesCategory(game, g)).slice(0, 3).map(shortTitle);
  const faqs: FaqItem[] = [];

  faqs.push({
    question: `How do you play ${name}?`,
    answer: intro
      ? `${trimPeriod(intro.goal)}. ${intro.steps.map((s) => trimPeriod(s.desc)).join('. ')}.`
      : game.description,
  });

  if (genre.length > 0) {
    faqs.push({
      question: `What kind of game is ${name}?`,
      answer: `${name} is a ${genre.join(', ')} game${intro ? ` (${lowerFirst(intro.subtitle)})` : ''}. ${game.tagline}`,
    });
  }

  faqs.push({
    question: `What are the controls for ${name} on a phone and on a computer?`,
    answer: `On a computer: ${trimPeriod(game.controls.desktop[0])}. On a phone or tablet: ${trimPeriod(game.controls.mobile[0])}.`,
  });

  if (intro?.proTip) {
    faqs.push({ question: `Any tips for getting better at ${name}?`, answer: intro.proTip });
  }

  if (similar.length > 0) {
    faqs.push({
      question: `What games are similar to ${name}?`,
      answer: `If you like ${name}, try ${similar.join(', ')}. They are in the same genre and also play free in your browser.`,
    });
  }

  return faqs;
};

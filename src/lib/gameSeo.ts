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

const CUSTOM_QUERY_FAQS: Record<string, FaqItem> = {
  'barnyard-truck-jumper': {
    question: 'Can I play this jumping on trucks game (Cluster Rush) free in my browser?',
    answer:
      'Yes. Cluster Rush: Truck Jumper is a free HTML5 truck jumping game where you hop from roof to roof across a moving highway convoy with no download.',
  },
  'duck-hunt-classic': {
    question: 'Is this a free Duck Hunt game online with no download?',
    answer:
      'Yes. Duck Hunt Classic plays right in your browser on phone or computer—tap or click to aim your light gun at flying mallards across 10 retro rounds.',
  },
  'gopher-garden': {
    question: 'How does the Gopher Garden whack a mole game work?',
    answer:
      'Sneaky gophers pop up from garden burrows to steal carrots; tap or click each gopher fast to chain combo streaks while avoiding friendly bunnies.',
  },
  'animal-2048': {
    question: 'How do you merge tiles in 2048 Animals (Animal 2048)?',
    answer:
      'Slide the 4x4 board with Arrow keys or touch swipes so matching animal tiles combine into the next species tier until you reach the 2048 Elephant.',
  },
  'duckling-pond-rescue': {
    question: 'How do you play the Ducklings.io game online?',
    answer:
      'Steer your mama duck across the lake to rescue stray yellow ducklings, dodge motorboats, and bring your flock home to upgrade your nest and unlock hats.',
  },
  'crossy-chicken': {
    question: 'How do you play Crossy Road Chicken (Crossy Chicken) online?',
    answer:
      'Tap or press Arrow keys to hop Clucky across busy farm roads, drifting river logs, and train tracks without getting caught by traffic or the patrol hawk.',
  },
  'hungry-piggy': {
    question: 'How do you grow bigger in Hungry Piggy Game (Hungry Pig Game)?',
    answer:
      'Steer your hungry pig around the pasture to eat acorns and apples first, then grow big enough to swallow wooden crates, hay bales, and farm tractors in 60 seconds.',
  },
  'hungry-piggy-feast': {
    question: 'How do you score points in Hungry Piggy Feast?',
    answer:
      'Slide the hungry piglet left and right under the orchard to catch falling apples, corn, and golden truffles while dodging rotten cores.',
  },
  'flappy-chicken': {
    question: 'How do you play the Flappy Chicken game online?',
    answer:
      'Tap the screen, click your mouse, or press Spacebar to flap Clucky through 15 wooden farm fence gates and collect golden wheat grains with no download.',
  },
  'egg-buster': {
    question: 'How do you play Egg Buster online?',
    answer:
      'Pull back Pippin the Chick’s slingshot, aim the dotted trajectory line at wooden crates or metal milk cans, and release to bounce eggs and knock out every sneaky fox.',
  },
  'farm-pipe-flow': {
    question: 'How do you connect pipes in Pipe Farm (Farm Pipe Flow)?',
    answer:
      'Tap or click each pipe joint to rotate it 90 degrees until water flows continuously from the red pump tank to every crop patch and animal trough.',
  },
  'frozen-pasture-dash': {
    question: 'How do you steer and jump in Ice Dodo online?',
    answer:
      'Use Left and Right Arrow keys or touch drag to carve across floating ice tracks, hit green boost pads, and press Spacebar or Up to jump over glacial gaps.',
  },
  'cat-parking': {
    question: 'How do you unblock Luna in CatParking (Cat Parking)?',
    answer:
      'Drag horizontal and vertical sleeping cats along their lanes on the 6x6 meadow grid until the path to the right-side exit gate is clear for Luna.',
  },
  'farm-fruit-bubble': {
    question: 'How do you aim in Farm Fruit Pop (Farm Fruit Bubble)?',
    answer:
      'Move your mouse or drag your finger to aim the dotted trajectory line, then release to fire and pop clusters of 3 or more matching orchard fruits.',
  },
  'barnyard-egg-cart': {
    question: 'How do you keep the egg safe in Eggy Car online?',
    answer:
      'Balance throttle and brakes smoothly over steep hills, collect coins to upgrade your cart, and grab Freeze power-ups to lock the egg in place.',
  },
  'barnyard-frog-hop': {
    question: 'How do you cross the river in Frog Games: Pond Hop?',
    answer:
      'Time your hops across moving lily pads, logs, and turtles to reach the home reeds at the top of each pond zone without falling into the water.',
  },
};

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

  const customFaq = CUSTOM_QUERY_FAQS[game.id];
  if (customFaq) {
    faqs.push(customFaq);
  } else if (genre.length > 0) {
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

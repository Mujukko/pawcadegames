import React, { useState, useMemo, useEffect } from 'react';
import { Blocks, Flame, Gamepad2, PawPrint, Tractor, Zap, type LucideIcon } from 'lucide-react';
import { GAMES_REGISTRY, GameMetadata } from '../lib/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { handleNavClick } from '../lib/navClick';

interface HomePageProps {
  navigate: (path: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  initialCategory?: CategoryTab;
}

export type CategoryTab = 'all' | 'popular' | 'puzzle' | 'farm' | 'arcade' | 'pets';

interface CategoryInfo {
  id: CategoryTab;
  label: string;
  href: string;
  icon: LucideIcon;
  title: string;
  tagline: string;
  /** Solid button colors: background, pressed-edge shadow, and text when active (inverted). */
  tone: string;
  activeTone: string;
}

const CATEGORY_INFOS: CategoryInfo[] = [
  {
    id: 'all',
    tone: 'bg-ink shadow-[0_4px_0_#0d1730]',
    activeTone: 'text-ink',
    label: 'All games',
    href: '/',
    icon: Gamepad2,
    title: 'Free Online Animal & Farm Games',
    tagline: 'Puzzles, farm sims, and quick arcade games starring corgis, cats, sheep, and friends. Every game plays instantly in your browser, on phone or computer.',
  },
  {
    id: 'popular',
    tone: 'bg-brand shadow-[0_4px_0_#c2470a]',
    activeTone: 'text-brand-deep',
    label: 'Popular',
    href: '/popular/',
    icon: Flame,
    title: 'Most Popular Free Online Games',
    tagline: 'The games Pawcade players come back to most. No downloads, no sign-up.',
  },
  {
    id: 'puzzle',
    tone: 'bg-puzzle shadow-[0_4px_0_#1f62ab]',
    activeTone: 'text-puzzle-deep',
    label: 'Puzzle',
    href: '/category/puzzle/',
    icon: Blocks,
    title: 'Free Online Puzzle Games',
    tagline: 'Block puzzles, sliding escapes, sorting, merging, and solitaire. Easy to start, satisfying to finish.',
  },
  {
    id: 'farm',
    tone: 'bg-farm shadow-[0_4px_0_#1f7c41]',
    activeTone: 'text-farm-deep',
    label: 'Farm',
    href: '/category/farm/',
    icon: Tractor,
    title: 'Free Online Farm Games',
    tagline: 'Run a market stall, drive tractors, harvest crops, and look after the barnyard.',
  },
  {
    id: 'arcade',
    tone: 'bg-arcade shadow-[0_4px_0_#b8303f]',
    activeTone: 'text-arcade-deep',
    label: 'Arcade',
    href: '/category/arcade/',
    icon: Zap,
    title: 'Free Online Arcade Games',
    tagline: 'Quick reflex games for short breaks: flap, dodge, launch, and chase high scores.',
  },
  {
    id: 'pets',
    tone: 'bg-pets shadow-[0_4px_0_#6c41bd]',
    activeTone: 'text-pets-deep',
    label: 'Pets',
    href: '/category/pets/',
    icon: PawPrint,
    title: 'Cat, Dog & Pet Games',
    tagline: 'Cozy puzzles and adventures with corgis, kittens, hamsters, and capybaras.',
  },
];

const matchCategory = (game: GameMetadata, cat: CategoryTab): boolean => {
  if (cat === 'all') return true;
  if (cat === 'popular') return Boolean(game.featured);
  return game.category === cat || Boolean(game.categories && game.categories.includes(cat));
};

export const HomePage: React.FC<HomePageProps> = ({
  navigate,
  searchQuery = '',
  setSearchQuery,
  initialCategory = 'all',
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>(initialCategory);

  useEffect(() => {
    if (initialCategory) setActiveCategory(initialCategory);
  }, [initialCategory]);

  const categoryCounts = useMemo(() => {
    const playable = GAMES_REGISTRY.filter((g) => g.status === 'playable');
    return Object.fromEntries(
      CATEGORY_INFOS.map((c) => [c.id, playable.filter((g) => matchCategory(g, c.id)).length])
    ) as Record<CategoryTab, number>;
  }, []);

  const isSearching = searchQuery.trim().length > 0;

  const displayedGames = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = q
      ? GAMES_REGISTRY.filter(
          (g) =>
            g.title.toLowerCase().includes(q) ||
            g.description.toLowerCase().includes(q) ||
            g.category.toLowerCase().includes(q) ||
            (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)))
        )
      : GAMES_REGISTRY.filter((g) => matchCategory(g, activeCategory));

    return list;
  }, [activeCategory, searchQuery]);

  const info = CATEGORY_INFOS.find((c) => c.id === activeCategory) || CATEGORY_INFOS[0]!;
  // A few 2x2 spotlight tiles keep the mosaic lively without crowding it
  const largeIds = new Set(isSearching ? [] : displayedGames.filter((g) => g.featured).slice(0, 4).map((g) => g.id));
  const quickPicks = displayedGames.slice(0, 5);

  return (
    <div className="max-w-[1440px] mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      {/* Category buttons */}
      <nav aria-label="Game categories" className="-mx-3 px-3 sm:mx-0 sm:px-0 pb-2 mb-4 sm:mb-6 flex gap-2.5 sm:gap-3 overflow-x-auto scrollbar-none">
        {CATEGORY_INFOS.map((tab) => {
          const isActive = !isSearching && activeCategory === tab.id;
          const Icon = tab.icon;
          return (
            <a
              key={tab.id}
              href={tab.href}
              aria-current={isActive ? 'page' : undefined}
              onClick={(e) =>
                handleNavClick(e, () => {
                  setActiveCategory(tab.id);
                  if (setSearchQuery) setSearchQuery('');
                  navigate(tab.href);
                })
              }
              className={`shrink-0 inline-flex items-center gap-2 h-11 sm:h-12 px-4 sm:px-5 rounded-2xl font-display font-semibold text-[15px] sm:text-base transition-transform active:translate-y-1 active:shadow-none ${
                isActive ? `bg-white ${tab.activeTone} shadow-[0_4px_0_rgb(27_60_110/0.18)] ring-2 ring-white` : `${tab.tone} text-white hover:-translate-y-0.5`
              }`}
            >
              <Icon className="w-5 h-5" strokeWidth={2.5} />
              <span>{tab.label}</span>
              <span className={`text-xs font-bold px-1.5 rounded-full ${isActive ? 'bg-paper' : 'bg-white/25'}`}>
                {categoryCounts[tab.id]}
              </span>
            </a>
          );
        })}
      </nav>

      {displayedGames.length > 0 ? (
        <section aria-label="Games">
          <div className="grid grid-flow-dense grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 xl:grid-cols-8 gap-3 sm:gap-4">
            {/* Heading tile */}
            <div className="col-span-3 sm:col-span-4 md:col-span-3 md:row-span-1 lg:row-span-2 bg-white rounded-[22px] shadow-tile p-4 sm:p-6 flex flex-col justify-center">
              {isSearching ? (
                <>
                  <h1 className="font-display text-2xl sm:text-3xl font-semibold text-ink leading-tight">
                    Results for “{searchQuery.trim()}”
                  </h1>
                  <p className="mt-2 text-sm text-ink-soft">
                    {displayedGames.length} {displayedGames.length === 1 ? 'game' : 'games'} found.{' '}
                    {setSearchQuery && (
                      <button onClick={() => setSearchQuery('')} className="font-bold text-brand-deep underline underline-offset-4 cursor-pointer">
                        Clear search
                      </button>
                    )}
                  </p>
                </>
              ) : (
                <>
                  <h1 className="font-display text-2xl sm:text-[2rem] lg:text-4xl font-semibold text-ink leading-[1.1] tracking-tight">
                    {info.title}
                  </h1>
                  <p className="mt-2 sm:mt-3 text-sm sm:text-[15px] text-ink-soft leading-relaxed">{info.tagline}</p>
                  <p className="mt-3 sm:mt-4 flex flex-wrap gap-2 text-xs font-bold">
                    <span className="px-2.5 py-1 rounded-full bg-farm-tint text-farm-deep">Free</span>
                    <span className="px-2.5 py-1 rounded-full bg-puzzle-tint text-puzzle-deep">No download</span>
                    <span className="px-2.5 py-1 rounded-full bg-pets-tint text-pets-deep">Phone & computer</span>
                  </p>
                  <div className="hidden lg:block mt-5 pt-4 border-t border-line">
                    <p className="text-xs font-bold text-ink-faint mb-2">Jump right in</p>
                    <div className="flex gap-2">
                      {quickPicks.map((g) => (
                        <a
                          key={g.id}
                          href={g.route}
                          title={g.title}
                          onClick={(e) => handleNavClick(e, () => navigate(g.route))}
                          className="w-12 h-12 rounded-xl overflow-hidden ring-2 ring-white shadow-[0_3px_0_rgb(27_60_110/0.16)] hover:-translate-y-0.5 transition-transform"
                        >
                          <img src={g.thumbnailUrl} alt="" width={48} height={48} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {displayedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                size={largeIds.has(game.id) ? 'large' : 'default'}
                onClick={() => navigate(game.route)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 bg-white rounded-[22px] shadow-tile">
          <h1 className="font-display text-2xl font-semibold text-ink">No games found for “{searchQuery.trim()}”</h1>
          <p className="text-sm text-ink-soft mt-1">Try another word, or pick a category above.</p>
        </div>
      )}
    </div>
  );
};

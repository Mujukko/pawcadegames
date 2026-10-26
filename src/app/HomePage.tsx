import React, { useState, useMemo, useEffect } from 'react';
import { GAMES_REGISTRY, GameMetadata } from '../lib/gamesRegistry';
import { GameCard } from '../components/GameCard';

interface HomePageProps {
  navigate: (path: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
  initialCategory?: CategoryTab;
}

export type CategoryTab = 'all' | 'popular' | 'puzzle' | 'farm' | 'arcade' | 'pets';
export type SortOption = 'popular' | 'rating' | 'az';

interface CategoryInfo {
  id: CategoryTab;
  label: string;
  icon: string;
  title: string;
  tagline: string;
}

const CATEGORY_INFOS: CategoryInfo[] = [
  {
    id: 'all',
    label: 'All Games',
    icon: '🎮',
    title: 'All Games 🎮',
    tagline: 'Discover our complete collection of 21 handcrafted browser games. Zero downloads, instant play on mobile & desktop!',
  },
  {
    id: 'popular',
    label: 'Popular Hits',
    icon: '🌟',
    title: 'Popular & Trending Games 🌟',
    tagline: 'The most played, highest-rated free casual web games on Pawcade. Zero downloads, instant play on mobile and PC!',
  },
  {
    id: 'puzzle',
    label: 'Puzzles & Brain',
    icon: '🧩',
    title: 'Puzzles & Brain Games 🧩',
    tagline: 'Sharpen your mind with block blasts, sliding path untangles, goods sorting, and spatial logic puzzles.',
  },
  {
    id: 'farm',
    label: 'Farm & Tycoon',
    icon: '🌾',
    title: 'Farm & Tycoon Games 🌾',
    tagline: 'Harvest crops, stock market shelves, manage bistro kitchens, and build your countryside empire.',
  },
  {
    id: 'arcade',
    label: 'Arcade & Action',
    icon: '⚡',
    title: 'Arcade & Action Games ⚡',
    tagline: 'Fast-paced mob runners, slingshot egg demolition, and quick reflex games for high-energy play.',
  },
  {
    id: 'pets',
    label: 'Pets & Animals',
    icon: '🐕‍🦺',
    title: 'Pets & Animals Games 🐕‍🦺',
    tagline: 'Cozy adventures and playful puzzles starring cute corgis, clever cats, fluffy sheep, and barnyard critters.',
  },
];

const matchCategory = (game: GameMetadata, cat: CategoryTab): boolean => {
  if (cat === 'all') return true;
  if (cat === 'popular') return Boolean(game.featured || game.rating >= 4.9);
  return game.category === cat || Boolean(game.categories && game.categories.includes(cat));
};

export const HomePage: React.FC<HomePageProps> = ({
  navigate,
  searchQuery = '',
  setSearchQuery,
  initialCategory = 'all',
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>(initialCategory);
  const [sortBy, setSortBy] = useState<SortOption>('popular');

  useEffect(() => {
    if (initialCategory) {
      setActiveCategory(initialCategory);
    }
  }, [initialCategory]);

  // Compute live game counts for each category
  const categoryCounts = useMemo(() => {
    const playable = GAMES_REGISTRY.filter((g) => g.status === 'playable');
    return {
      all: playable.length,
      popular: playable.filter((g) => matchCategory(g, 'popular')).length,
      puzzle: playable.filter((g) => matchCategory(g, 'puzzle')).length,
      farm: playable.filter((g) => matchCategory(g, 'farm')).length,
      arcade: playable.filter((g) => matchCategory(g, 'arcade')).length,
      pets: playable.filter((g) => matchCategory(g, 'pets')).length,
    };
  }, []);

  // Filtered and sorted games
  const displayedGames = useMemo(() => {
    let list: GameMetadata[] = [];

    // 1. Search Query Priority
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = GAMES_REGISTRY.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)))
      );
    } else {
      // 2. Strict Category Matching
      list = GAMES_REGISTRY.filter((g) => matchCategory(g, activeCategory));
    }

    // 3. In-Category Sorting
    const sorted = [...list];
    if (sortBy === 'rating') {
      sorted.sort((a, b) => b.rating - a.rating || parseFloat(b.playCount) - parseFloat(a.playCount));
    } else if (sortBy === 'az') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    }
    // 'popular' keeps the curated registry ordering

    return sorted;
  }, [activeCategory, searchQuery, sortBy]);

  const isSearching = searchQuery.trim().length > 0;
  const currentCategoryInfo =
    CATEGORY_INFOS.find((c) => c.id === activeCategory) || CATEGORY_INFOS[0]!;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5">
      {/* TOP CATEGORY FILTER PILLS (100% US ENGLISH) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Game Categories"
          className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none max-w-full"
        >
          {CATEGORY_INFOS.map((tab) => {
            const isActive = !isSearching && activeCategory === tab.id;
            const count = categoryCounts[tab.id];
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id);
                  if (setSearchQuery) setSearchQuery('');
                  if (tab.id === 'all') {
                    navigate('/');
                  } else {
                    navigate(`/category/${tab.id}/`);
                  }
                }}
                className={`px-3.5 py-2 min-h-[42px] rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-102 border border-amber-300'
                    : 'bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 hover:text-white border border-slate-700/80'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-slate-950/20 text-slate-950'
                      : 'bg-slate-700/80 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </nav>

        {isSearching && setSearchQuery && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold bg-amber-400/10 border border-amber-400/30 px-3 py-1 rounded-full">
              Results for "{searchQuery}": {displayedGames.length} games
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer"
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* CATEGORY SUMMARY & SORTING BAR */}
      {!isSearching && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-800/50 border border-slate-700/60 rounded-2xl p-3.5 sm:p-4.5 backdrop-blur-sm">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xl sm:text-2xl">{currentCategoryInfo.icon}</span>
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                {currentCategoryInfo.title}
              </h2>
              <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                {displayedGames.length} {displayedGames.length === 1 ? 'Game' : 'Games'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              {currentCategoryInfo.tagline}
            </p>
          </div>

          {/* In-Category Sorting Controls */}
          <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-900/90 p-1 rounded-xl border border-slate-700/80 text-xs shrink-0 select-none">
            <button
              onClick={() => setSortBy('popular')}
              className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                sortBy === 'popular'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔥 Popular
            </button>
            <button
              onClick={() => setSortBy('rating')}
              className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                sortBy === 'rating'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ⭐ Top Rated
            </button>
            <button
              onClick={() => setSortBy('az')}
              className={`px-2.5 py-1 rounded-lg font-extrabold transition-all cursor-pointer ${
                sortBy === 'az'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🔤 A-Z
            </button>
          </div>
        </div>
      )}

      {/* SINGLE UNIFIED ARCADE GRID: ALL GAMES ON ONE SCREEN */}
      {displayedGames.length > 0 ? (
        <section aria-label="Games List" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 gap-3.5 sm:gap-5">
            {displayedGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => navigate(game.route)}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="text-center py-16 bg-slate-800/60 rounded-3xl border border-slate-700">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-white">No games found</h3>
          <p className="text-xs text-slate-400 mt-1">
            Try a different search term or browse our categories above.
          </p>
        </div>
      )}
    </div>
  );
};

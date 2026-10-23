import React, { useState, useMemo } from 'react';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { FeaturedHero } from '../components/FeaturedHero';
import { GameCard } from '../components/GameCard';
import { Flame, Gamepad2, Puzzle, Tractor, Sparkles } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
  searchQuery?: string;
  setSearchQuery?: (query: string) => void;
}

type CategoryTab = 'all' | 'puzzle' | 'farm' | 'arcade' | 'pets';

export const HomePage: React.FC<HomePageProps> = ({
  navigate,
  searchQuery = '',
  setSearchQuery,
}) => {
  const [activeCategory, setActiveCategory] = useState<CategoryTab>('all');

  // Featured flagship game (Dog Parking)
  const featuredGame = useMemo(() => {
    return GAMES_REGISTRY.find((g) => g.id === 'dog-parking') || GAMES_REGISTRY[0]!;
  }, []);

  // Popular in the US collection
  const popularGames = useMemo(() => {
    const popularIds = ['dog-parking', 'farm-mini-mart', 'pet-candy-crush', 'duck-runner'];
    return GAMES_REGISTRY.filter((g) => popularIds.includes(g.id));
  }, []);

  // Brain Teasers & Spatial Puzzles
  const puzzleGames = useMemo(() => {
    const puzzleIds = ['dog-parking', 'cat-parking', 'farm-tetris', 'animal-2048'];
    return GAMES_REGISTRY.filter((g) => puzzleIds.includes(g.id));
  }, []);

  // Farm & Countryside Fun
  const farmGames = useMemo(() => {
    const farmIds = ['farm-mini-mart', 'pet-candy-crush', 'duck-runner', 'flappy-chicken', 'animal-farm-parking'];
    return GAMES_REGISTRY.filter((g) => farmIds.includes(g.id));
  }, []);

  // Filtered games based on active category tab
  const categoryFilteredGames = useMemo(() => {
    if (activeCategory === 'all') return GAMES_REGISTRY;
    if (activeCategory === 'puzzle') return GAMES_REGISTRY.filter((g) => g.category.toLowerCase().includes('puzzle') || g.id.includes('2048') || g.id.includes('tetris'));
    if (activeCategory === 'farm') return GAMES_REGISTRY.filter((g) => g.category.toLowerCase().includes('farm') || g.id.includes('farm') || g.id.includes('mart') || g.id.includes('chicken'));
    if (activeCategory === 'arcade') return GAMES_REGISTRY.filter((g) => g.category.toLowerCase().includes('arcade') || g.id.includes('runner') || g.id.includes('chicken'));
    if (activeCategory === 'pets') return GAMES_REGISTRY.filter((g) => g.category.toLowerCase().includes('pet') || g.id.includes('dog') || g.id.includes('cat') || g.id.includes('animal'));
    return GAMES_REGISTRY;
  }, [activeCategory]);

  // Search filtered results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return GAMES_REGISTRY.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.category.toLowerCase().includes(q) ||
        (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }, [searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-8 sm:space-y-12">
      {/* CATEGORY FILTER PILLS ROW */}
      <nav aria-label="Game Categories" className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {[
          { id: 'all', label: 'All Games', icon: '🎮' },
          { id: 'puzzle', label: 'Puzzles & Brain', icon: '🧩' },
          { id: 'farm', label: 'Farm & Tycoon', icon: '🌾' },
          { id: 'arcade', label: 'Arcade & Reflex', icon: '⚡' },
          { id: 'pets', label: 'Pets & Animals', icon: '🐕‍🦺' },
        ].map((tab) => {
          const isActive = activeCategory === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveCategory(tab.id as CategoryTab);
                if (setSearchQuery) setSearchQuery('');
              }}
              className={`px-4 py-2 min-h-[44px] rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md shadow-amber-400/20 scale-102 border border-amber-300'
                  : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* CONDITIONAL DISPLAY: SEARCH RESULTS VS PORTAL SECTIONS */}
      {isSearching ? (
        <section aria-label="Search Results" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
              <span>Results for "{searchQuery}"</span>
              <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                {searchResults.length} games
              </span>
            </h2>
            {setSearchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 cursor-pointer"
              >
                Clear Search
              </button>
            )}
          </div>

          {searchResults.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
              {searchResults.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => navigate(game.route)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
              <div className="text-5xl mb-3">🔍</div>
              <h3 className="text-lg font-bold text-white">No games found</h3>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for "dog", "tetris", "runner", or browse our categories.
              </p>
            </div>
          )}
        </section>
      ) : activeCategory !== 'all' ? (
        /* CATEGORY FILTERED VIEW */
        <section aria-label="Category Games" className="space-y-4">
          <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
            <span>
              {activeCategory === 'puzzle' && '🧩 Puzzles & Brain Games'}
              {activeCategory === 'farm' && '🌾 Farm & Tycoon Games'}
              {activeCategory === 'arcade' && '⚡ Arcade & Reflex Games'}
              {activeCategory === 'pets' && '🐕‍🦺 Pets & Animal Games'}
            </span>
            <span className="text-xs bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
              {categoryFilteredGames.length} games
            </span>
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
            {categoryFilteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                onClick={() => navigate(game.route)}
              />
            ))}
          </div>
        </section>
      ) : (
        /* DEFAULT HOMEPAGE: BENTO HERO + CURATED SECTIONS */
        <div className="space-y-10 sm:space-y-14">
          {/* 1. BENTO SPOTLIGHT HERO (Dog Parking) */}
          <FeaturedHero
            game={featuredGame}
            onClick={() => navigate(featuredGame.route)}
          />

          {/* 2. POPULAR IN THE US */}
          <section aria-labelledby="section-popular" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <Flame className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h2 id="section-popular" className="text-xl sm:text-2xl font-black text-white">
                    Popular in the US
                  </h2>
                  <p className="text-xs text-slate-400">Most played casual games by our American community</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
              {popularGames.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => navigate(game.route)}
                />
              ))}
            </div>
          </section>

          {/* 3. ALL PLAYABLE GAMES (COMPLETE ROSTER) */}
          <section aria-labelledby="section-all" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="section-all" className="text-xl sm:text-2xl font-black text-white">
                    All Instant Games
                  </h2>
                  <p className="text-xs text-slate-400">Handcrafted, 100% free casual titles with zero downloads</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
              {GAMES_REGISTRY.map((game) => (
                <GameCard
                  key={game.id}
                  game={game}
                  onClick={() => navigate(game.route)}
                />
              ))}
            </div>
          </section>

          {/* 4. BRAIN TEASERS & SPATIAL PUZZLES */}
          <section aria-labelledby="section-puzzles" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30">
                  <Puzzle className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="section-puzzles" className="text-xl sm:text-2xl font-black text-white">
                    Brain Teasers & Spatial Puzzles
                  </h2>
                  <p className="text-xs text-slate-400">Sharpen your mind with relaxing logic, parking jams, and merge challenges</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {puzzleGames.map((game) => (
                <GameCard
                  key={`puzzle-${game.id}`}
                  game={game}
                  onClick={() => navigate(game.route)}
                />
              ))}
            </div>
          </section>

          {/* 5. FARM & COUNTRYSIDE ADVENTURES */}
          <section aria-labelledby="section-farm" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Tractor className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="section-farm" className="text-xl sm:text-2xl font-black text-white">
                    Farm & Countryside Fun
                  </h2>
                  <p className="text-xs text-slate-400">Idle tycoons, harvest matches, flight runs, and barnyard driving</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 sm:gap-5">
              {farmGames.map((game) => (
                <GameCard
                  key={`farm-${game.id}`}
                  game={game}
                  onClick={() => navigate(game.route)}
                />
              ))}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

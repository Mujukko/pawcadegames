import React, { useState, useMemo } from 'react';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { Sparkles, Gamepad2 } from 'lucide-react';

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

  // Filtered games based on active category tab
  const displayedGames = useMemo(() => {
    // 1. Search Query priority
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return GAMES_REGISTRY.filter(
        (g) =>
          g.title.toLowerCase().includes(q) ||
          g.description.toLowerCase().includes(q) ||
          g.category.toLowerCase().includes(q) ||
          (g.tags && g.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    // 2. Category Filter
    if (activeCategory === 'puzzle') {
      return GAMES_REGISTRY.filter(
        (g) => g.category.toLowerCase().includes('puzzle') || g.id.includes('2048') || g.id.includes('tetris') || g.id.includes('parking')
      );
    }
    if (activeCategory === 'farm') {
      return GAMES_REGISTRY.filter(
        (g) => g.category.toLowerCase().includes('farm') || g.id.includes('farm') || g.id.includes('mart') || g.id.includes('chicken')
      );
    }
    if (activeCategory === 'arcade') {
      return GAMES_REGISTRY.filter(
        (g) => g.category.toLowerCase().includes('arcade') || g.id.includes('runner') || g.id.includes('chicken')
      );
    }
    if (activeCategory === 'pets') {
      return GAMES_REGISTRY.filter(
        (g) => g.category.toLowerCase().includes('pet') || g.id.includes('dog') || g.id.includes('cat') || g.id.includes('animal')
      );
    }

    // Default: Return all games
    return GAMES_REGISTRY;
  }, [activeCategory, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
      {/* TOP BAR: CATEGORY FILTER PILLS */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav aria-label="Game Categories" className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
          {[
            { id: 'all', label: 'Tüm Oyunlar', icon: '🎮', count: GAMES_REGISTRY.length },
            { id: 'puzzle', label: 'Bulmaca & Zeka', icon: '🧩' },
            { id: 'farm', label: 'Çiftlik & Tycoon', icon: '🌾' },
            { id: 'arcade', label: 'Arcade & Refleks', icon: '⚡' },
            { id: 'pets', label: 'Evcil Hayvanlar', icon: '🐕‍🦺' },
          ].map((tab) => {
            const isActive = !isSearching && activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveCategory(tab.id as CategoryTab);
                  if (setSearchQuery) setSearchQuery('');
                }}
                className={`px-3.5 py-2 min-h-[42px] rounded-2xl text-xs sm:text-sm font-extrabold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/25 scale-102 border border-amber-300'
                    : 'bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {isSearching && setSearchQuery && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-300 font-bold bg-amber-400/10 border border-amber-400/30 px-2.5 py-1 rounded-full">
              "{searchQuery}" araması: {displayedGames.length} oyun
            </span>
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-slate-400 hover:text-white underline cursor-pointer"
            >
              Temizle
            </button>
          </div>
        )}
      </div>

      {/* SINGLE UNIFIED ARCADE GRID: ALL GAMES ON ONE SCREEN */}
      {displayedGames.length > 0 ? (
        <section aria-label="Oyun Listesi" className="space-y-4">
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
        <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
          <div className="text-5xl mb-3">🔍</div>
          <h3 className="text-lg font-bold text-white">Oyun bulunamadı</h3>
          <p className="text-xs text-slate-400 mt-1">
            Farklı bir arama yapmayı deneyin veya yukarıdaki kategorilere göz atın.
          </p>
        </div>
      )}

      {/* MINIMALIST TRUST & BRAND BANNER */}
      <footer className="pt-4 pb-2 border-t border-slate-800/60 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-4 h-4 text-amber-400" />
          <span>Pawcade — İndirmesiz, Ücretsiz Tarayıcı Oyunları</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>⚡ Anında Açılır</span>
          <span>📱 Mobil & Masaüstü Uyumlu</span>
          <span>🛡️ Güvenli & Reklamsız</span>
        </div>
      </footer>
    </div>
  );
};

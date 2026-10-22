import React, { useState, useMemo } from 'react';
import { GAMES_REGISTRY, GameMetadata } from '../lib/gamesRegistry';
import { Search, Play, Star, Sparkles, Flame, Trophy } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
  initialView?: string;
}

type FilterCategory = 'all' | 'popular' | 'puzzle' | 'arcade' | 'farm' | 'pets';

interface GameVisualConfig {
  iconEmoji: string;
  secondaryEmoji?: string;
  gradient: string;
  glowBorder: string;
  shortTag: string;
}

const GAME_VISUAL_MAP: Record<string, GameVisualConfig> = {
  'farm-mini-mart': {
    iconEmoji: '🏪',
    secondaryEmoji: '🍅',
    gradient: 'from-emerald-700 via-teal-700 to-amber-700',
    glowBorder: 'border-emerald-500/50 group-hover:border-emerald-400 group-hover:shadow-emerald-500/30',
    shortTag: 'Arcade Tycoon • Köy Pazarı',
  },
  'duck-runner': {
    iconEmoji: '🦆',
    secondaryEmoji: '🌾',
    gradient: 'from-amber-600 via-orange-600 to-yellow-600',
    glowBorder: 'border-amber-500/50 group-hover:border-amber-400 group-hover:shadow-amber-500/30',
    shortTag: 'T-Rex Zıplama • Sonsuz Koşu',
  },
  'pet-candy-crush': {
    iconEmoji: '🍬',
    secondaryEmoji: '🐮',
    gradient: 'from-pink-600 via-purple-600 to-rose-700',
    glowBorder: 'border-pink-500/50 group-hover:border-pink-400 group-hover:shadow-pink-500/30',
    shortTag: 'Match-3 • Çiftlik Eşleştirme',
  },
  'flappy-chicken': {
    iconEmoji: '🐔',
    secondaryEmoji: '🌾',
    gradient: 'from-yellow-600 via-amber-600 to-orange-700',
    glowBorder: 'border-yellow-500/50 group-hover:border-yellow-400 group-hover:shadow-yellow-500/30',
    shortTag: 'Gıdak Uçuşu • Engellerden Kaç',
  },
  'animal-2048': {
    iconEmoji: '🐘',
    secondaryEmoji: '🐭',
    gradient: 'from-indigo-600 via-purple-700 to-violet-800',
    glowBorder: 'border-indigo-500/50 group-hover:border-indigo-400 group-hover:shadow-indigo-500/30',
    shortTag: '2048 Bulmaca • Hayvan Evrimi',
  },
  'farm-tetris': {
    iconEmoji: '🧱',
    secondaryEmoji: '👨‍🌾',
    gradient: 'from-orange-700 via-red-700 to-amber-800',
    glowBorder: 'border-orange-500/50 group-hover:border-orange-400 group-hover:shadow-orange-500/30',
    shortTag: 'Blok Tetris • Silo Doldurma',
  },
  'dog-parking': {
    iconEmoji: '🐕‍🦺',
    secondaryEmoji: '🦴',
    gradient: 'from-amber-600 via-orange-700 to-yellow-800',
    glowBorder: 'border-amber-500/50 group-hover:border-amber-400 group-hover:shadow-amber-500/30',
    shortTag: 'Trafik Bulmaca • Köpek Kurtarma',
  },
  'cat-parking': {
    iconEmoji: '🐈‍⬛',
    secondaryEmoji: '🌙',
    gradient: 'from-purple-700 via-indigo-800 to-blue-900',
    glowBorder: 'border-purple-500/50 group-hover:border-purple-400 group-hover:shadow-purple-500/30',
    shortTag: 'Labirent Bulmaca • Kedi Kaçırma',
  },
  'animal-farm-parking': {
    iconEmoji: '🐮',
    secondaryEmoji: '🚜',
    gradient: 'from-teal-700 via-emerald-800 to-green-900',
    glowBorder: 'border-teal-500/50 group-hover:border-teal-400 group-hover:shadow-teal-500/30',
    shortTag: 'Hassas Sürüş • İnek Park Etme',
  },
  'cat-cafe-rush': {
    iconEmoji: '🧁',
    secondaryEmoji: '🐱',
    gradient: 'from-rose-700 via-pink-700 to-amber-800',
    glowBorder: 'border-rose-500/40 group-hover:border-rose-300 group-hover:shadow-rose-500/20',
    shortTag: 'Kafe Yönetimi • Yakında',
  },
  'hamster-ball-dash': {
    iconEmoji: '🐹',
    secondaryEmoji: '⚽',
    gradient: 'from-cyan-700 via-blue-800 to-indigo-900',
    glowBorder: 'border-cyan-500/40 group-hover:border-cyan-300 group-hover:shadow-cyan-500/20',
    shortTag: 'Fizik Parkuru • Yakında',
  },
};

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter games based on category and query
  const filteredGames = useMemo(() => {
    return GAMES_REGISTRY.filter((game) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          game.title.toLowerCase().includes(q) ||
          game.tagline.toLowerCase().includes(q) ||
          game.category.toLowerCase().includes(q) ||
          game.id.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category matching
      if (activeFilter === 'all') return true;
      if (activeFilter === 'popular') {
        return (
          game.id === 'farm-mini-mart' ||
          game.id === 'duck-runner' ||
          game.id === 'pet-candy-crush' ||
          game.id === 'flappy-chicken' ||
          game.id === 'dog-parking'
        );
      }
      if (activeFilter === 'puzzle') {
        return (
          game.category === 'puzzle' ||
          game.id === 'pet-candy-crush' ||
          game.id === 'farm-tetris' ||
          game.id === 'animal-2048' ||
          game.id === 'dog-parking' ||
          game.id === 'cat-parking'
        );
      }
      if (activeFilter === 'arcade') {
        return (
          game.category === 'arcade' ||
          game.id === 'duck-runner' ||
          game.id === 'flappy-chicken' ||
          game.id === 'farm-mini-mart'
        );
      }
      if (activeFilter === 'farm') {
        return (
          game.id.includes('farm') ||
          game.id.includes('tetris') ||
          game.id.includes('duck') ||
          game.id.includes('chicken')
        );
      }
      if (activeFilter === 'pets') {
        return (
          game.id.includes('dog') ||
          game.id.includes('cat') ||
          game.id.includes('animal') ||
          game.id.includes('pet')
        );
      }
      return true;
    });
  }, [activeFilter, searchQuery]);

  const categories: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'Tüm Oyunlar', icon: '🎮' },
    { id: 'popular', label: 'Popüler', icon: '🔥' },
    { id: 'puzzle', label: 'Bulmaca', icon: '🧩' },
    { id: 'arcade', label: 'Arcade', icon: '⚡' },
    { id: 'farm', label: 'Çiftlik', icon: '🌾' },
    { id: 'pets', label: 'Hayvanlar', icon: '🐾' },
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-slate-950 pb-20">
      {/* Hidden SEO Heading */}
      <h1 className="sr-only">Pawcade — Ücretsiz Çevrimiçi Tarayıcı Oyunları</h1>

      {/* TOP COMPACT FILTER & SEARCH BAR */}
      <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md border-b border-orange-500/20 px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Category Filter Pills (min 44px touch target) */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1 overscroll-x-contain touch-pan-x">
            {categories.map((cat) => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 min-h-[44px] rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 shadow-md scale-102 border border-amber-300'
                      : 'bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span className="text-base sm:text-sm">{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input (min 44px touch target, text-base on mobile to avoid iOS Safari auto-zoom) */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Oyun ara..."
              className="w-full pl-9 pr-10 py-2.5 min-h-[44px] bg-slate-900 border border-orange-500/30 rounded-xl text-base sm:text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                aria-label="Aramayı temizle"
                className="absolute right-0 top-0 bottom-0 w-10 min-h-[44px] flex items-center justify-center text-slate-400 hover:text-white text-sm cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PURE GAME ICON GRID */}
      <section
        aria-label="Oyunlar Listesi"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
          {filteredGames.map((game) => {
            const visual = GAME_VISUAL_MAP[game.id] || {
              iconEmoji: '🎮',
              secondaryEmoji: '✨',
              gradient: 'from-slate-700 to-slate-800',
              glowBorder: 'border-slate-700 hover:border-orange-500',
              shortTag: game.category,
            };

            const isComingSoon = game.status === 'coming-soon';
            const cleanTitle = game.title.split(':')[0] || game.title;

            return (
              <div
                key={game.id}
                className="relative group flex flex-col items-center select-none"
              >
                {/* INTERACTIVE GAME ICON TILE */}
                <button
                  onClick={() => {
                    if (!isComingSoon) {
                      navigate(game.route);
                    }
                  }}
                  aria-disabled={isComingSoon}
                  aria-describedby={`tooltip-${game.id}`}
                  aria-label={`${cleanTitle} ${isComingSoon ? '(Yakında)' : 'oyna'}`}
                  className={`relative w-full aspect-square rounded-2xl sm:rounded-3xl p-3 sm:p-4 bg-gradient-to-br ${visual.gradient} border-2 ${visual.glowBorder} shadow-lg transition-all duration-200 transform group-hover:scale-105 group-hover:-translate-y-1 group-active:scale-95 cursor-pointer flex flex-col items-center justify-between overflow-hidden ${
                    isComingSoon ? 'opacity-65 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Subtle Inner Glow */}
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />

                  {/* Top Meta Badges (Rating / Status) */}
                  <div className="w-full flex items-center justify-between relative z-10">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/70 backdrop-blur-md text-amber-300 border border-white/10 flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                      <span>{game.rating}</span>
                    </span>

                    {game.badge && (
                      <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-orange-500 text-slate-950 shadow-sm">
                        {game.badge.replace('🎃 ', '').split(' ')[0]}
                      </span>
                    )}
                  </div>

                  {/* CENTER ICON ARTWORK */}
                  <div className="relative my-auto flex flex-col items-center justify-center">
                    <span className="text-5xl sm:text-6xl md:text-7xl filter drop-shadow-xl transition-transform duration-200 group-hover:scale-110">
                      {visual.iconEmoji}
                    </span>

                    {visual.secondaryEmoji && (
                      <span className="absolute -bottom-1 -right-2 text-xl sm:text-2xl filter drop-shadow-md animate-bounce">
                        {visual.secondaryEmoji}
                      </span>
                    )}
                  </div>

                  {/* Quick Play Arrow / Action Indicator on Hover */}
                  <div className="w-full flex items-center justify-center relative z-10 pt-1">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-950/80 group-hover:bg-amber-400 group-hover:text-slate-950 text-white flex items-center justify-center transition-all shadow-md">
                      <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                    </div>
                  </div>
                </button>

                {/* ON HOVER / TAP FOCUS: MINIK BİR YAZI GELIR (Sleek Floating Tooltip - Zero Mobile Overflow) */}
                <div
                  id={`tooltip-${game.id}`}
                  role="tooltip"
                  className="pointer-events-none absolute -bottom-10 sm:-bottom-11 left-1/2 -translate-x-1/2 z-40 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 group-active:opacity-100 transition-all duration-200 transform translate-y-1 group-hover:translate-y-0 w-max max-w-[140px] sm:max-w-[280px]"
                >
                  <div className="bg-slate-900/95 text-white text-[10px] sm:text-[11px] font-bold px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-amber-400/50 shadow-2xl shadow-slate-950/90 flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 backdrop-blur-md text-center leading-tight">
                    <span className="text-amber-300 font-black truncate max-w-[124px] sm:max-w-none">
                      {cleanTitle}
                    </span>
                    <span className="hidden sm:inline text-slate-500">•</span>
                    <span className="text-slate-300 text-[9px] sm:text-[10px] truncate max-w-[124px] sm:max-w-none">
                      {visual.shortTag}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state when search produces no results */}
        {filteredGames.length === 0 && (
          <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800 my-8">
            <div className="text-5xl mb-3">🔍</div>
            <h2 className="text-lg font-bold text-white">Oyun Bulunamadı</h2>
            <p className="text-slate-400 text-xs mt-1">
              "{searchQuery}" aramasına uygun oyun bulunamadı. Aramanızı temizlemeyi deneyin.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-4 px-5 py-2.5 min-h-[44px] bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-sm rounded-xl transition-colors cursor-pointer inline-flex items-center justify-center"
            >
              Filtreleri Temizle
            </button>
          </div>
        )}
      </section>
    </main>
  );
};

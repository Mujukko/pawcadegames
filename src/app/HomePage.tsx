import React from 'react';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { Play, Star } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
  initialView?: string;
}

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
  return (
    <main className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-slate-950 pb-20">
      {/* Hidden SEO Heading */}
      <h1 className="sr-only">Pawcade — Ücretsiz Çevrimiçi Tarayıcı Oyunları</h1>

      {/* PURE GAME ICON GRID */}
      <section
        aria-label="Oyunlar Listesi"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 sm:gap-5">
          {GAMES_REGISTRY.map((game) => {
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
      </section>
    </main>
  );
};


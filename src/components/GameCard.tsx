import React from 'react';
import { GameMetadata } from '../lib/gamesRegistry';
import { Play, Star } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  onClick: () => void;
  variant?: 'standard' | 'compact' | 'featured';
}

const FALLBACK_VISUALS: Record<string, { icon: string; gradient: string; glow: string }> = {
  'farm-mini-mart': { icon: '🏪', gradient: 'from-emerald-700 via-teal-700 to-amber-700', glow: 'hover:shadow-emerald-500/25' },
  'duck-runner': { icon: '🦆', gradient: 'from-amber-600 via-orange-600 to-yellow-600', glow: 'hover:shadow-amber-500/25' },
  'pet-candy-crush': { icon: '🍬', gradient: 'from-pink-600 via-purple-600 to-rose-700', glow: 'hover:shadow-pink-500/25' },
  'flappy-chicken': { icon: '🐔', gradient: 'from-yellow-600 via-amber-600 to-orange-700', glow: 'hover:shadow-yellow-500/25' },
  'animal-2048': { icon: '🐘', gradient: 'from-indigo-600 via-purple-700 to-violet-800', glow: 'hover:shadow-indigo-500/25' },
  'farm-tetris': { icon: '🧱', gradient: 'from-orange-700 via-red-700 to-amber-800', glow: 'hover:shadow-orange-500/25' },
  'dog-parking': { icon: '🐕‍🦺', gradient: 'from-amber-600 via-orange-700 to-yellow-800', glow: 'hover:shadow-amber-500/25' },
  'cat-parking': { icon: '🐈‍⬛', gradient: 'from-purple-700 via-indigo-800 to-blue-900', glow: 'hover:shadow-purple-500/25' },
  'animal-farm-parking': { icon: '🐮', gradient: 'from-teal-700 via-emerald-800 to-green-900', glow: 'hover:shadow-teal-500/25' },
  'cat-cafe-rush': { icon: '🧁', gradient: 'from-rose-700 via-pink-700 to-amber-800', glow: 'hover:shadow-rose-500/20' },
  'hamster-ball-dash': { icon: '🐹', gradient: 'from-cyan-700 via-blue-800 to-indigo-900', glow: 'hover:shadow-cyan-500/20' },
};

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const isComingSoon = game.status === 'coming-soon';
  const cleanTitle = game.title.split(':')[0] || game.title;
  const fallback = FALLBACK_VISUALS[game.id] || {
    icon: '🎮',
    gradient: 'from-slate-700 to-slate-800',
    glow: 'hover:shadow-orange-500/20',
  };

  return (
    <button
      onClick={() => {
        if (!isComingSoon) onClick();
      }}
      disabled={isComingSoon}
      aria-label={`${cleanTitle} — ${isComingSoon ? 'Coming Soon' : 'Play Now Free'}`}
      className={`group relative flex flex-col w-full text-left bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-800 hover:border-amber-400/80 shadow-lg hover:shadow-2xl ${fallback.glow} transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 overflow-hidden cursor-pointer select-none ${
        isComingSoon ? 'opacity-65 cursor-not-allowed hover:translate-y-0 hover:border-slate-800' : ''
      }`}
    >
      {/* THUMBNAIL CONTAINER (1:1 Aspect Ratio) */}
      <div className="relative w-full aspect-square overflow-hidden bg-slate-950">
        {game.thumbnailUrl ? (
          <img
            src={game.thumbnailUrl}
            alt={`${cleanTitle} cover artwork`}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
          />
        ) : (
          <div
            className={`w-full h-full bg-gradient-to-br ${fallback.gradient} flex flex-col items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105`}
          >
            <span className="text-5xl sm:text-6xl drop-shadow-2xl transition-transform duration-300 group-hover:scale-115">
              {fallback.icon}
            </span>
          </div>
        )}

        {/* Subtle Dark Gradient Overlay for Badges & Title Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-black/40 pointer-events-none" />

        {/* TOP STATUS BADGES */}
        <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10">
          <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/30 flex items-center gap-1 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
            <span>{game.rating.toFixed(1)}</span>
          </span>

          {game.badge && (
            <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 shadow-md font-sans">
              {game.badge.replace('🎃 ', '').split(' ')[0]}
            </span>
          )}
        </div>

        {/* HOVER PLAY ACTION BUTTON */}
        {!isComingSoon && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-300 bg-slate-950/30 backdrop-blur-[2px]">
            <div className="w-12 h-12 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-400/40 transform scale-75 group-hover:scale-100 transition-all duration-300">
              <Play className="w-6 h-6 fill-current ml-0.5" />
            </div>
          </div>
        )}
      </div>

      {/* METADATA FOOTER */}
      <div className="p-3 sm:p-3.5 w-full flex flex-col gap-0.5 bg-slate-900/95 border-t border-slate-800/80">
        <div className="flex items-center justify-between gap-1">
          <h3 className="font-extrabold text-sm sm:text-base text-white group-hover:text-amber-300 transition-colors truncate">
            {cleanTitle}
          </h3>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/70 px-1.5 py-0.5 rounded shrink-0">
            {game.category}
          </span>
        </div>

        <p className="text-[11px] text-slate-400 line-clamp-1">
          {game.description}
        </p>
      </div>
    </button>
  );
};

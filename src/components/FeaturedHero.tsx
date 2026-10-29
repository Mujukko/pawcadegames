import React from 'react';
import { GameMetadata } from '../lib/gamesRegistry';
import { Play, Star, Flame, Trophy, Sparkles, ShieldCheck } from 'lucide-react';

interface FeaturedHeroProps {
  game: GameMetadata;
  onClick: () => void;
}

export const FeaturedHero: React.FC<FeaturedHeroProps> = ({ game, onClick }) => {
  const cleanTitle = game.title.split(':')[0] || game.title;

  return (
    <section
      aria-label="Featured Game Spotlight"
      className="relative w-full rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900/95 to-slate-950 border border-orange-500/30 shadow-2xl shadow-orange-950/20"
    >
      {/* Decorative Warm Ambient Glow Background */}
      <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 p-5 sm:p-7 md:p-8 lg:p-10 flex flex-col lg:flex-row items-center gap-6 sm:gap-8">
        {/* Left: Thumbnail Spotlight Artwork */}
        <div
          onClick={onClick}
          className="relative w-full max-w-[340px] sm:max-w-[400px] lg:w-[380px] aspect-square shrink-0 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-amber-400/50 group cursor-pointer"
        >
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={`${cleanTitle} cover`}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-108"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-amber-600 via-orange-700 to-yellow-800 flex items-center justify-center p-6">
              <span className="text-7xl sm:text-8xl drop-shadow-2xl transition-transform duration-300 group-hover:scale-110">
                🐕‍🦺
              </span>
            </div>
          )}

          {/* Interactive Play Overlay */}
          <div className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-400/50 transform group-hover:scale-110 transition-transform">
              <Play className="w-8 h-8 fill-current ml-1" />
            </div>
          </div>

          {/* Spotlight Tag */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/30 text-[11px] font-black uppercase text-amber-300 tracking-wider">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" />
            <span>Featured Spotlight</span>
          </div>
        </div>

        {/* Right: Content & Call to Action */}
        <div className="flex-1 flex flex-col justify-center text-center lg:text-left space-y-3 sm:space-y-4">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
            <span className="px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 text-xs font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>#1 Trending Casual Game</span>
            </span>

          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              {cleanTitle}
            </h1>
            <p className="text-sm sm:text-base text-amber-300/90 font-semibold mt-1">
              {game.tagline || 'Slide cute dogs out of the traffic grid into safety!'}
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed line-clamp-3 lg:line-clamp-none">
            {game.description}
          </p>

          {/* Feature Highlights */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 text-xs text-slate-300 pt-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Free • No Download</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>12+ Brain-Teasing Levels</span>
            </span>
            <span className="text-slate-600">•</span>
            <span>Desktop & Mobile Touch</span>
          </div>

          {/* Primary Play Button */}
          <div className="pt-2 flex items-center justify-center lg:justify-start">
            <button
              onClick={onClick}
              aria-label={`Play ${cleanTitle} free now`}
              className="px-8 py-3.5 sm:px-10 sm:py-4 min-h-[48px] rounded-2xl bg-gradient-to-r from-orange-500 via-amber-400 to-yellow-400 hover:from-orange-600 hover:via-amber-500 hover:to-yellow-500 text-slate-950 font-black text-base sm:text-lg shadow-xl shadow-amber-500/25 hover:shadow-amber-500/40 transform hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>PLAY NOW FREE</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

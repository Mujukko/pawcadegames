import React from 'react';
import { GameMetadata } from '../lib/gamesRegistry';
import { Play, Star } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  onClick: () => void;
  variant?: 'standard' | 'compact' | 'featured';
}

interface GameVisualConfig {
  icon: string;
  subIcon: string;
  gradient: string;
  borderGlow: string;
  accentBg: string;
  accentText: string;
  tagline: string;
}

const GAME_VISUALS: Record<string, GameVisualConfig> = {
  'farm-mini-mart': {
    icon: '🏪',
    subIcon: '🌾',
    gradient: 'from-emerald-500 via-teal-600 to-amber-700',
    borderGlow: 'group-hover:border-emerald-400 group-hover:shadow-emerald-500/30',
    accentBg: 'bg-emerald-400/20 border-emerald-400/40',
    accentText: 'text-emerald-300',
    tagline: 'Harvest fresh crops, stock shelves, and serve cute animal customers in your mart!',
  },
  'duck-runner': {
    icon: '🦆',
    subIcon: '🎃',
    gradient: 'from-orange-500 via-amber-600 to-purple-900',
    borderGlow: 'group-hover:border-orange-400 group-hover:shadow-orange-500/30',
    accentBg: 'bg-orange-400/20 border-orange-400/40',
    accentText: 'text-orange-300',
    tagline: 'Jump over carved pumpkins and slide low under midnight vampire bats!',
  },
  'pet-candy-crush': {
    icon: '🍬',
    subIcon: '🧨',
    gradient: 'from-pink-500 via-rose-600 to-purple-800',
    borderGlow: 'group-hover:border-pink-400 group-hover:shadow-pink-500/30',
    accentBg: 'bg-pink-400/20 border-pink-400/40',
    accentText: 'text-pink-300',
    tagline: 'Match cute farm animals and craft explosive 2x2 Square Dynamite Bombs!',
  },
  'flappy-chicken': {
    icon: '🐔',
    subIcon: '🌾',
    gradient: 'from-yellow-500 via-amber-600 to-orange-700',
    borderGlow: 'group-hover:border-yellow-400 group-hover:shadow-yellow-500/30',
    accentBg: 'bg-yellow-400/20 border-yellow-400/40',
    accentText: 'text-yellow-300',
    tagline: 'Flap through rustic wooden fences under the moon to feast on Golden Wheat!',
  },
  'animal-2048': {
    icon: '🐘',
    subIcon: '🐭',
    gradient: 'from-indigo-500 via-purple-600 to-violet-900',
    borderGlow: 'group-hover:border-indigo-400 group-hover:shadow-indigo-500/30',
    accentBg: 'bg-indigo-400/20 border-indigo-400/40',
    accentText: 'text-indigo-300',
    tagline: 'Slide and merge creatures from a tiny mouse to the majestic elephant!',
  },
  'farm-tetris': {
    icon: '🧱',
    subIcon: '🌽',
    gradient: 'from-orange-600 via-red-600 to-amber-800',
    borderGlow: 'group-hover:border-orange-400 group-hover:shadow-orange-500/30',
    accentBg: 'bg-orange-400/20 border-orange-400/40',
    accentText: 'text-orange-300',
    tagline: 'Stack harvest crop blocks, clear full lines, and fill the rustic golden silo!',
  },
  'dog-parking': {
    icon: '🐕‍🦺',
    subIcon: '🐾',
    gradient: 'from-amber-500 via-orange-600 to-amber-700',
    borderGlow: 'group-hover:border-amber-400 group-hover:shadow-amber-500/30',
    accentBg: 'bg-amber-400/20 border-amber-400/40',
    accentText: 'text-amber-300',
    tagline: 'Unblock cute pups and slide Sunny the Star Corgi straight to the exit gate!',
  },
  'cat-parking': {
    icon: '🐈‍⬛',
    subIcon: '🌙',
    gradient: 'from-purple-600 via-indigo-700 to-slate-900',
    borderGlow: 'group-hover:border-purple-400 group-hover:shadow-purple-500/30',
    accentBg: 'bg-purple-400/20 border-purple-400/40',
    accentText: 'text-purple-300',
    tagline: 'Untangle sleepy kitties and guide Luna the Witch Cat through cozy yards!',
  },
  'animal-farm-parking': {
    icon: '🐮',
    subIcon: '🚜',
    gradient: 'from-teal-600 via-emerald-700 to-green-900',
    borderGlow: 'group-hover:border-teal-400 group-hover:shadow-teal-500/30',
    accentBg: 'bg-teal-400/20 border-teal-400/40',
    accentText: 'text-teal-300',
    tagline: 'Steer Bessie the Cow into marked parking bays with precision without crashing!',
  },
  'cat-cafe-rush': {
    icon: '🧁',
    subIcon: '🐱',
    gradient: 'from-rose-600 via-pink-700 to-slate-900',
    borderGlow: 'group-hover:border-rose-400 group-hover:shadow-rose-500/20',
    accentBg: 'bg-rose-400/20 border-rose-400/40',
    accentText: 'text-rose-300',
    tagline: 'Bake delicious pastries and serve hungry cat customers before time expires!',
  },
  'hamster-ball-dash': {
    icon: '🐹',
    subIcon: '⚡',
    gradient: 'from-cyan-600 via-blue-700 to-slate-900',
    borderGlow: 'group-hover:border-cyan-400 group-hover:shadow-cyan-500/20',
    accentBg: 'bg-cyan-400/20 border-cyan-400/40',
    accentText: 'text-cyan-300',
    tagline: 'Roll through twisty obstacle ramps and collect golden sunflower seeds!',
  },
};

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const isComingSoon = game.status === 'coming-soon';
  const cleanTitle = game.title.split(':')[0] || game.title;
  const visual = GAME_VISUALS[game.id] || {
    icon: '🎮',
    subIcon: '✨',
    gradient: 'from-slate-700 to-slate-900',
    borderGlow: 'group-hover:border-amber-400 group-hover:shadow-amber-500/20',
    accentBg: 'bg-slate-800 border-slate-700',
    accentText: 'text-amber-300',
    tagline: game.tagline || game.description,
  };

  return (
    <div className="relative group select-none">
      <button
        onClick={() => {
          if (!isComingSoon) onClick();
        }}
        disabled={isComingSoon}
        aria-label={`${cleanTitle} — ${isComingSoon ? 'Coming Soon' : 'Play Now Free'}`}
        className={`relative flex flex-col w-full text-left bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-800/90 ${visual.borderGlow} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 overflow-hidden cursor-pointer ${
          isComingSoon ? 'opacity-65 cursor-not-allowed hover:translate-y-0 hover:border-slate-800' : ''
        }`}
      >
        {/* ICON TILE (Square 1:1 Aspect Ratio) */}
        <div className={`relative w-full aspect-square bg-gradient-to-br ${visual.gradient} flex flex-col items-center justify-center p-4 overflow-hidden`}>
          {/* Subtle Ambient Radial Lighting */}
          <div className="absolute inset-0 bg-radial from-white/20 via-transparent to-black/40 pointer-events-none" />

          {/* Sub-mascot ambient floating watermark */}
          <span className="absolute -bottom-2 -right-2 text-4xl sm:text-5xl opacity-20 pointer-events-none select-none">
            {visual.subIcon}
          </span>

          {/* MAIN 3D MASCOT ICON */}
          <span className="text-5xl sm:text-6xl md:text-7xl drop-shadow-[0_12px_18px_rgba(0,0,0,0.6)] transform transition-transform duration-300 group-hover:scale-115">
            {visual.icon}
          </span>

          {/* TOP STATUS BADGES */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
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

          {/* HOVER / TAP OVERLAY: "Üzerine gelince minik bir yazı gelsin" */}
          <div className="absolute inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-4 bg-slate-950/95 backdrop-blur-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 pointer-events-none border border-amber-400/40 rounded-2xl sm:rounded-3xl">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="text-lg">{visual.icon}</span>
                <span className="font-black text-xs sm:text-sm text-white truncate">
                  {cleanTitle}
                </span>
              </div>
              {/* Minik açıklama yazısı */}
              <p className="text-[11px] sm:text-xs text-slate-200 font-medium leading-snug line-clamp-3">
                {visual.tagline}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-amber-400">
                {isComingSoon ? 'Yakında' : 'Ücretsiz'}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shadow-md shadow-amber-400/30">
                <Play className="w-3 h-3 fill-current" />
                <span>Oyna</span>
              </span>
            </div>
          </div>
        </div>

        {/* CLEAN LABEL UNDER THE ICON TILE */}
        <div className="p-2.5 sm:p-3 w-full flex items-center justify-between gap-1 bg-slate-900/95 border-t border-slate-800/80">
          <span className="font-black text-xs sm:text-sm text-white group-hover:text-amber-300 transition-colors truncate">
            {cleanTitle}
          </span>
          <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-800/80 px-1.5 py-0.5 rounded shrink-0">
            {game.category}
          </span>
        </div>
      </button>
    </div>
  );
};

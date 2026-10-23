import React, { useState } from 'react';
import { GameMetadata } from '../lib/gamesRegistry';
import { Play, Star } from 'lucide-react';

interface GameCardProps {
  game: GameMetadata;
  onClick: () => void;
  variant?: 'standard' | 'compact' | 'featured';
}

interface GameVisualConfig {
  icon: string;
  gradient: string;
  glow: string;
  tagline: string;
  badgeLabel: string;
}

const GAME_FALLBACKS: Record<string, GameVisualConfig> = {
  'farm-mini-mart': {
    icon: '🏪',
    gradient: 'from-emerald-600 via-teal-700 to-amber-700',
    glow: 'group-hover:border-emerald-400 group-hover:shadow-emerald-500/30',
    tagline: 'Hasat yap, rafları doldur ve sevimli hayvan müşterilerine satış yap!',
    badgeLabel: 'TYCOON',
  },
  'duck-runner': {
    icon: '🦆',
    gradient: 'from-orange-500 via-amber-600 to-purple-900',
    glow: 'group-hover:border-orange-400 group-hover:shadow-orange-500/30',
    tagline: 'Balkabaklarının üzerinden zıpla, yarasaların altından kay ve geceyi fethet!',
    badgeLabel: 'RUNNER',
  },
  'pet-candy-crush': {
    icon: '🍬',
    gradient: 'from-pink-500 via-rose-600 to-purple-800',
    glow: 'group-hover:border-pink-400 group-hover:shadow-pink-500/30',
    tagline: 'Sevimli çiftlik hayvanlarını eşleştir, 2x2 dinamitler ve roketlerle patlat!',
    badgeLabel: 'MATCH-3',
  },
  'flappy-chicken': {
    icon: '🐔',
    gradient: 'from-yellow-500 via-amber-600 to-orange-700',
    glow: 'group-hover:border-yellow-400 group-hover:shadow-yellow-500/30',
    tagline: 'Ahşap çitlerin arasından kanat çırparak altın buğday hedefine uç!',
    badgeLabel: 'ARCADE',
  },
  'animal-2048': {
    icon: '🐘',
    gradient: 'from-indigo-500 via-purple-600 to-violet-900',
    glow: 'group-hover:border-indigo-400 group-hover:shadow-indigo-500/30',
    tagline: 'Hayvanları kaydır ve birleştir; minik fareden görkemli file evril!',
    badgeLabel: '2048',
  },
  'farm-tetris': {
    icon: '🧱',
    gradient: 'from-orange-600 via-red-600 to-amber-800',
    glow: 'group-hover:border-orange-400 group-hover:shadow-orange-500/30',
    tagline: 'Hasat bloklarını diz, sıraları patlat ve altın siloyu doldur!',
    badgeLabel: 'TETRIS',
  },
  'dog-parking': {
    icon: '🐕‍🦺',
    gradient: 'from-amber-500 via-orange-600 to-amber-700',
    glow: 'group-hover:border-amber-400 group-hover:shadow-amber-500/30',
    tagline: 'Köpeklerin yolunu aç ve Sunny Corgi’yi çıkış kapısına ulaştır!',
    badgeLabel: 'POPÜLER',
  },
  'cat-parking': {
    icon: '🐈‍⬛',
    gradient: 'from-purple-600 via-indigo-700 to-slate-900',
    glow: 'group-hover:border-purple-400 group-hover:shadow-purple-500/30',
    tagline: 'Uykucu kedileri kaydır ve Luna’yı çıkış kapısına yönlendir!',
    badgeLabel: 'BULMACA',
  },
  'animal-farm-parking': {
    icon: '🐮',
    gradient: 'from-teal-600 via-emerald-700 to-green-900',
    glow: 'group-hover:border-teal-400 group-hover:shadow-teal-500/30',
    tagline: 'İnek Bessie ile traktörü engellere çarpmadan park alanına yanaştır!',
    badgeLabel: 'SÜRÜŞ',
  },
  'cat-cafe-rush': {
    icon: '🧁',
    gradient: 'from-rose-600 via-pink-700 to-slate-900',
    glow: 'group-hover:border-rose-400 group-hover:shadow-rose-500/20',
    tagline: 'Leziz tatlılar hazırla ve kedi müşterilerin siparişlerini yetiştir!',
    badgeLabel: 'YAKINDA',
  },
  'hamster-ball-dash': {
    icon: '🐹',
    gradient: 'from-cyan-600 via-blue-700 to-slate-900',
    glow: 'group-hover:border-cyan-400 group-hover:shadow-cyan-500/20',
    tagline: 'Hamster topuyla rampalardan uç ve altın ayçiçeği çekirdeklerini topla!',
    badgeLabel: 'YAKINDA',
  },
};

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  const [imageError, setImageError] = useState(false);
  const isComingSoon = game.status === 'coming-soon';
  const cleanTitle = game.title.split(':')[0] || game.title;

  const fallback = GAME_FALLBACKS[game.id] || {
    icon: '🎮',
    gradient: 'from-slate-700 to-slate-900',
    glow: 'group-hover:border-amber-400 group-hover:shadow-amber-500/20',
    tagline: game.tagline || game.description,
    badgeLabel: game.category.toUpperCase(),
  };

  const hasImage = Boolean(game.thumbnailUrl) && !imageError;

  return (
    <div className="relative group select-none">
      <button
        onClick={() => {
          if (!isComingSoon) onClick();
        }}
        disabled={isComingSoon}
        aria-label={`${cleanTitle} — ${isComingSoon ? 'Yakında' : 'Ücretsiz Oyna'}`}
        className={`relative flex flex-col w-full text-left bg-slate-900/90 rounded-2xl sm:rounded-3xl border border-slate-800/90 ${fallback.glow} shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1.5 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:ring-offset-2 focus:ring-offset-slate-950 overflow-hidden cursor-pointer ${
          isComingSoon ? 'opacity-70 cursor-not-allowed hover:translate-y-0 hover:border-slate-800' : ''
        }`}
      >
        {/* GAME VISUAL COVER CONTAINER (1:1 Aspect Ratio) */}
        <div className="relative w-full aspect-square overflow-hidden bg-slate-950">
          {hasImage ? (
            <img
              src={game.thumbnailUrl}
              alt={`${cleanTitle} oyun kapağı`}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
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

          {/* Contrast Vignette Gradient Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-slate-950/45 pointer-events-none" />

          {/* TOP BADGES: STAR RATING & CATEGORY/EVENT BADGE */}
          <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 border border-amber-400/35 flex items-center gap-1 shadow-sm">
              <Star className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
              <span>{game.rating.toFixed(1)}</span>
            </span>

            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-500 text-slate-950 shadow-md font-sans">
              {fallback.badgeLabel}
            </span>
          </div>

          {/* HOVER / TAP OVERLAY: "Üzerine gelince minik bir yazı gelsin" */}
          <div className="absolute inset-0 z-20 flex flex-col justify-between p-3.5 sm:p-4 bg-slate-950/92 backdrop-blur-md opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-all duration-200 pointer-events-none border border-amber-400/50 rounded-2xl sm:rounded-3xl">
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-base sm:text-lg">{fallback.icon}</span>
                <span className="font-black text-xs sm:text-sm text-white truncate">
                  {cleanTitle}
                </span>
              </div>
              {/* Minik açıklama yazısı */}
              <p className="text-[11px] sm:text-xs text-slate-200 font-medium leading-relaxed line-clamp-3">
                {fallback.tagline}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-300/90 flex items-center gap-1">
                <span>⚡</span>
                <span>{isComingSoon ? 'Pek Yakında' : 'İndirmesiz'}</span>
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/30 transform group-hover:scale-105 transition-transform">
                <Play className="w-3 h-3 fill-current" />
                <span>Oyna</span>
              </span>
            </div>
          </div>
        </div>

        {/* CLEAN LABEL UNDER THE VISUAL COVER */}
        <div className="p-2.5 sm:p-3 w-full flex items-center justify-between gap-1.5 bg-slate-900/95 border-t border-slate-800/80">
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

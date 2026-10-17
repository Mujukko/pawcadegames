import React, { useState, useMemo } from 'react';
import { GAMES_REGISTRY, GameMetadata } from '../lib/gamesRegistry';
import { Play, Star, Sparkles, Flame, Heart, Search, Trophy, CheckCircle2 } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

type FilterCategory = 'all' | 'spooky' | 'popular' | 'puzzle' | 'farm' | 'cats' | 'dogs' | 'new';

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter games dynamically
  const filteredGames = useMemo(() => {
    return GAMES_REGISTRY.filter((game) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = game.title.toLowerCase().includes(q) ||
          game.tagline.toLowerCase().includes(q) ||
          game.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Category matching
      if (activeFilter === 'all') return true;
      if (activeFilter === 'spooky') return true; // All games featured in Halloween event!
      if (activeFilter === 'popular') return game.id === 'farm-mini-mart' || game.id === 'duck-runner' || game.id === 'pet-candy-crush' || game.id === 'flappy-chicken' || game.id === 'animal-2048' || game.id === 'farm-tetris' || game.id === 'dog-parking' || game.id === 'animal-farm-parking' || game.badge === 'Popular';
      if (activeFilter === 'new') return game.id === 'farm-mini-mart' || game.id === 'duck-runner' || game.id === 'pet-candy-crush' || game.id === 'flappy-chicken' || game.id === 'animal-2048' || game.id === 'farm-tetris' || game.id === 'animal-farm-parking' || game.id === 'cat-parking' || game.badge === 'New';
      if (activeFilter === 'farm') return game.id.includes('farm') || game.id.includes('animal') || game.id.includes('tetris') || game.id.includes('chicken') || game.id.includes('duck');
      if (activeFilter === 'puzzle') return game.category === 'puzzle' || game.category === 'casual';
      if (activeFilter === 'dogs') return game.id.includes('dog') || game.id.includes('pet');
      if (activeFilter === 'cats') return game.id.includes('cat') || game.id.includes('pet');
      return true;
    });
  }, [activeFilter, searchQuery]);

  const categories: { id: FilterCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All Games', icon: '🎮' },
    { id: 'spooky', label: 'Spooky (Halloween)', icon: '🎃' },
    { id: 'popular', label: 'Popular', icon: '🔥' },
    { id: 'new', label: 'New', icon: '✨' },
    { id: 'farm', label: 'Farm', icon: '🌾' },
    { id: 'puzzle', label: 'Puzzles', icon: '🧩' },
    { id: 'cats', label: 'Cats', icon: '🐈‍⬛' },
    { id: 'dogs', label: 'Dogs', icon: '🦴' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-orange-500 selection:text-slate-950 pb-16 pb-safe">
      {/* Poki-Style Top Filter & Search Bar */}
      <div className="sticky top-16 z-30 bg-slate-950/90 backdrop-blur-md border-b border-orange-500/25 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
            {categories.map((cat) => {
              const isActive = activeFilter === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveFilter(cat.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 via-amber-500 to-purple-600 text-white shadow-lg shadow-orange-500/25 scale-102 border border-orange-400/40'
                      : 'bg-slate-900/90 hover:bg-slate-850 text-slate-300 hover:text-white border border-slate-800'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Quick Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-orange-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search spooky games..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-orange-500/30 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-orange-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Poki Bento Game Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 sm:gap-6">
          {/* GRAND HALLOWEEN SPOOKTACULAR EVENT HERO BANNER */}
          <div className="relative lg:col-span-12 bg-gradient-to-r from-orange-600 via-purple-900 to-amber-900 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl shadow-orange-950/50 border-2 border-orange-500/50 flex flex-col md:flex-row items-center justify-between min-h-[220px]">
            {/* Ambient spooky glow & bats */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-8 right-16 text-8xl sm:text-9xl opacity-20 select-none pointer-events-none animate-spooky-float">
              🎃
            </div>

            <div className="relative z-10 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="bg-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider animate-bounce">
                  <span>🎃 Spooktacular Season Active</span>
                </span>
                <span className="bg-purple-950/80 text-purple-200 border border-purple-500/40 font-bold text-xs px-2.5 py-1 rounded-xl">
                  🦇 Trick or Treat
                </span>
                <span className="bg-black/40 text-amber-300 border border-amber-500/30 font-bold text-xs px-2.5 py-1 rounded-xl">
                  🍬 9 Spooky Games Online
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                Pawcade Halloween Spooktacular! 🎃
              </h1>
              <p className="text-orange-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-xl">
                The pet sanctuary has been enchanted with Halloween magic! Leap over glowing jack-o'-lanterns in Duck Runner, match spooky barnyard beasts, fly through haunted moonlit skies, and solve eerie puzzles!
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => navigate('/games/duck-runner/')}
                  className="bg-orange-500 hover:bg-orange-400 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>PLAY VAMPIRE DUCK 🦆</span>
                </button>
                <button
                  onClick={() => navigate('/games/pet-candy-crush/')}
                  className="bg-purple-700 hover:bg-purple-600 text-white px-5 py-2.5 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer border border-purple-400/30"
                >
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>TRICK OR TREAT MATCH 🍬</span>
                </button>
              </div>
            </div>

            <div className="relative z-10 mt-4 md:mt-0 flex items-center gap-3 text-5xl sm:text-6xl select-none filter drop-shadow-2xl">
              <span className="animate-spooky-float">🎃</span>
              <span className="animate-pulse">👻</span>
              <span className="animate-spooky-float" style={{ animationDelay: '1s' }}>🦇</span>
              <span className="animate-bounce">🍬</span>
            </div>
          </div>

          {/* HERO BANNER: Farm Mini Mart: Animal Market (Brand New Arcade Idle Tycoon) */}
          {filteredGames.some((g) => g.id === 'farm-mini-mart') && (
            <div
              onClick={() => navigate('/games/farm-mini-mart/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-emerald-900 via-amber-800 to-orange-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-amber-500/25 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[300px] border-2 border-amber-500/40 hover:border-amber-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🏪
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Brand New Game</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-amber-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-amber-500/30">
                      🏪 Farm Mini Mart
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-emerald-500/30">
                      🍅 Arcade Idle Tycoon
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>5.0</span>
                      <span className="text-white/60 font-medium ml-1">(16.8K)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Farm Mini Mart: Animal Market 🏪🌾
                  </h2>
                  <p className="text-orange-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    Run your very own bustling countryside farm mini mart! Harvest sweet tomatoes, eggs, and milk, stack items high in your hands, stock market shelves, and serve adorable animal customers at the Cash Register!
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 group-hover:from-amber-400 group-hover:to-orange-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>PLAY FARM MART 🏪</span>
                  </div>
                  <span className="text-xs font-bold text-amber-200/90 uppercase tracking-widest hidden sm:inline">
                    Harvest Crops • Stock Shelves • Cash Register • Hire Workers • 60 FPS
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-4xl sm:text-5xl lg:text-6xl filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 select-none">
                  <span className="animate-bounce">🧑‍🌾</span>
                  <span className="text-2xl text-amber-400">➔</span>
                  <span className="animate-pulse">🍅</span>
                  <span className="text-2xl text-amber-400">➔</span>
                  <span className="animate-spooky-float">🐰</span>
                  <span className="text-3xl sm:text-4xl animate-bounce" style={{ animationDelay: '0.5s' }}>💰</span>
                </div>
                <div className="mt-3 px-3.5 py-1 rounded-full bg-slate-950/80 border border-amber-400/40 text-amber-200 text-xs font-bold shadow-md">
                  Controls: [WASD / Touch Joystick] Move • Auto-Action
                </div>
              </div>
            </div>
          )}

          {/* HERO BANNER: Duck Runner: Vampire Quack (Brand New T-Rex Spooky Runner) */}
          {filteredGames.some((g) => g.id === 'duck-runner') && (
            <div
              onClick={() => navigate('/games/duck-runner/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-orange-700 via-amber-700 to-purple-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[300px] border-2 border-orange-500/40 hover:border-orange-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🦆
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Halloween Special</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-orange-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-orange-500/30">
                      🦆 Vampire Quack
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-purple-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-purple-500/30">
                      🎃 Jack-o'-Lantern Hurdles
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>5.0</span>
                      <span className="text-white/60 font-medium ml-1">(Instant Play)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Duck Runner: Vampire Quack 🦆🎃
                  </h2>
                  <p className="text-orange-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    The beloved offline Chrome T-Rex runner reimagined for Halloween! Leap over glowing carved jack-o'-lanterns, duck under midnight bats, and survive the spooky night speed rush!
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-orange-500 group-hover:bg-orange-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>PLAY VAMPIRE DUCK</span>
                  </div>
                  <span className="text-xs font-bold text-orange-200/90 uppercase tracking-widest hidden sm:inline">
                    Witch Hat Quacky • Glowing Pumpkins • Midnight Bats • 60 FPS
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 text-5xl sm:text-6xl lg:text-7xl filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 select-none">
                  <span className="animate-bounce">🦆</span>
                  <span className="text-3xl text-orange-400">➔</span>
                  <span className="text-5xl sm:text-6xl animate-spooky-float">🎃</span>
                  <span className="text-4xl sm:text-5xl">🦇</span>
                </div>
                <div className="mt-3 px-3.5 py-1 rounded-full bg-purple-950/70 border border-orange-400/40 text-orange-200 text-xs font-bold shadow-md">
                  Controls: [Space/Up] Jump • [Down] Duck Bats
                </div>
              </div>
            </div>
          )}

          {/* HERO BANNER: Farm Animal Match: Spooky Barnyard Crush (Halloween Special) */}
          {filteredGames.some((g) => g.id === 'pet-candy-crush') && (
            <div
              onClick={() => navigate('/games/pet-candy-crush/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-purple-900 via-purple-950 to-orange-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[300px] border-2 border-purple-500/40 hover:border-purple-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🍬
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-purple-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Trick or Treat</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-orange-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-orange-500/30">
                      🍬 Spooky Barnyard Match
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-amber-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-amber-500/30">
                      🎃 Dynamite Pumpkin Bombs
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>5.0</span>
                      <span className="text-white/60 font-medium ml-1">(24.8K)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Farm Animal Match: Spooky Barnyard Crush 🍬
                  </h2>
                  <p className="text-purple-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    Trick or treat! Swap candy corn, spooky pumpkins, and festive farm beasts! Unleash dynamite pumpkin blasts and mega crater combos across the haunted farm!
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-purple-500 group-hover:bg-purple-400 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-white text-white" />
                    <span>PLAY TRICK OR TREAT</span>
                  </div>
                  <span className="text-xs font-bold text-purple-200/90 uppercase tracking-widest hidden sm:inline">
                    Halloween Boosters • Candy Combos • 3-Star Harvest Rewards
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="grid grid-cols-3 gap-2 text-4xl sm:text-5xl filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 select-none bg-black/35 p-3 rounded-2xl border border-white/15">
                  <span>🎃</span>
                  <span>🍬</span>
                  <span>🐮</span>
                  <span>🦇</span>
                  <span className="text-5xl sm:text-6xl animate-pulse">🌟</span>
                  <span>🐱</span>
                  <span>👻</span>
                  <span>🐷</span>
                  <span>🍭</span>
                </div>
                <div className="mt-3 px-3.5 py-1 rounded-full bg-purple-950/80 border border-purple-400/40 text-purple-200 text-xs font-bold shadow-md">
                  Goal: Match 3 ➔ Spooky Halloween Harvest!
                </div>
              </div>
            </div>
          )}

          {/* HERO BANNER: Flappy Chicken: Spooky Night Flight (Halloween Feathered Flight) */}
          {filteredGames.some((g) => g.id === 'flappy-chicken') && (
            <div
              onClick={() => navigate('/games/flappy-chicken/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-orange-800 via-amber-900 to-purple-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-500/25 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[300px] border-2 border-orange-500/40 hover:border-orange-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                👻
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Haunted Flight</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-orange-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-orange-500/30">
                      👻 Ghost Cluck ("Gıdak!")
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-amber-200 font-bold text-xs px-2.5 py-1 rounded-xl border border-amber-500/30">
                      🌕 Full Moon Harvest
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>5.0</span>
                      <span className="text-white/60 font-medium ml-1">(21.4K)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Flappy Chicken: Spooky Night Flight 👻
                  </h2>
                  <p className="text-orange-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    Help Ghost Clucky flap, cluck, and fly through spooky graveyard fence posts! Collect floating golden grain kernels and reach the grand Golden Wheat Granary under the full moon!
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-orange-500 group-hover:bg-orange-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>FLY GHOST CHICKEN</span>
                  </div>
                  <span className="text-xs font-bold text-orange-200/90 uppercase tracking-widest hidden sm:inline">
                    Ghost Cluck Audio • Spooky Fence Posts • 60 FPS
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-3 text-5xl sm:text-6xl lg:text-7xl filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 select-none">
                  <span className="animate-spooky-float">👻🐔</span>
                  <span className="text-3xl text-orange-400">➔</span>
                  <span className="text-6xl sm:text-7xl lg:text-8xl">🌾</span>
                </div>
                <div className="mt-3 px-3.5 py-1 rounded-full bg-purple-950/70 border border-orange-400/40 text-orange-200 text-xs font-bold shadow-md">
                  Goal: 15 Gates ➔ Full Moon Feast!
                </div>
              </div>
            </div>
          )}

          {/* HERO BANNER: Animal 2048: Spooky Evolution (Halloween Special) */}
          {filteredGames.some((g) => g.id === 'animal-2048') && (
            <div
              onClick={() => navigate('/games/animal-2048/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-purple-950 via-indigo-950 to-orange-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[300px] border-2 border-purple-500/40 hover:border-purple-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🦇
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-purple-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Halloween Special</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-purple-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-purple-500/30">
                      🦇 Vampire Bat ➔ 🐘 Gargoyle
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-amber-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-amber-500/30">
                      12 Spooky Tiers
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>5.0</span>
                      <span className="text-white/60 font-medium ml-1">(18.2K)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Animal 2048: Spooky Evolution 🦇
                  </h2>
                  <p className="text-purple-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    Slide matching creatures across the 4x4 haunted board! Start with a fluttering Vampire Bat and evolve along the spooky ladder all the way to the mighty Gargoyle Elephant!
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-purple-500 group-hover:bg-purple-400 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-white text-white" />
                    <span>PLAY SPOOKY 2048</span>
                  </div>
                  <span className="text-xs font-bold text-purple-300/90 uppercase tracking-widest hidden sm:inline">
                    Procedural Spooky Audio • 1-Step Undo • Endless Mode
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="flex items-center gap-2 text-4xl sm:text-5xl lg:text-6xl filter drop-shadow-2xl group-hover:scale-105 transition-transform duration-300 select-none">
                  <span className="animate-spooky-float">🦇</span>
                  <span className="text-2xl text-purple-400">➔</span>
                  <span>🐈‍⬛</span>
                  <span className="text-2xl text-purple-400">➔</span>
                  <span className="text-6xl sm:text-7xl lg:text-8xl">🐘</span>
                </div>
                <div className="mt-3 px-3 py-1 rounded-full bg-purple-900/60 border border-purple-400/30 text-purple-200 text-xs font-bold">
                  Target: 2048 Gargoyle Titan
                </div>
              </div>
            </div>
          )}

          {/* HERO BANNER: Farm Tetris: Haunted Pumpkin Harvest */}
          {filteredGames.some((g) => g.id === 'farm-tetris') && (
            <div
              onClick={() => navigate('/games/farm-tetris/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-orange-900 via-amber-950 to-purple-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[300px] border-2 border-orange-500/40 hover:border-orange-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-orange-400/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🎃
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-orange-400 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Halloween Harvest</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-orange-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-orange-500/30">
                      🎃 Pumpkin Silo Mechanics
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-yellow-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-yellow-500/30">
                      👨‍🌾 "WOW!" Cheering Farmer
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>5.0</span>
                      <span className="text-white/60 font-medium ml-1">(15.6K)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Farm Tetris: Haunted Pumpkin Harvest 🎃
                  </h2>
                  <p className="text-orange-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    Stack glowing harvest crates, fill the enchanted pumpkin silo on the right, and hear the cute farmer cheer "WOW!" with joy when blocks pop!
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-orange-500 group-hover:bg-orange-400 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>PLAY PUMPKIN TETRIS</span>
                  </div>
                  <span className="text-xs font-bold text-orange-200/80 uppercase tracking-widest hidden sm:inline">
                    Authentic Tetris Engine • Silo Mechanics • 60 FPS
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="text-7xl sm:text-8xl lg:text-9xl filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-300 select-none">
                  👨‍🌾🎃🌾
                </div>
              </div>
            </div>
          )}

          {/* HERO BANNER: Animal Farm Parking (Featured New Game) */}
          {filteredGames.some((g) => g.id === 'animal-farm-parking') && (
            <div
              onClick={() => navigate('/games/animal-farm-parking/')}
              className="group cursor-pointer relative lg:col-span-12 bg-gradient-to-r from-emerald-950 via-teal-950 to-purple-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1.5 flex flex-col md:flex-row items-center justify-between min-h-[280px] border-2 border-emerald-500/40 hover:border-emerald-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/15 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 right-20 text-9xl sm:text-[140px] opacity-20 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🐮
              </div>

              {/* Left Column: Info & Action */}
              <div className="relative z-10 flex flex-col justify-between h-full max-w-xl">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className="bg-emerald-400 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                      <span>Halloween Night Drive</span>
                    </span>
                    <span className="bg-black/40 backdrop-blur-md text-emerald-300 font-bold text-xs px-2.5 py-1 rounded-xl border border-emerald-500/30">
                      🎃 Haunted Farm Mist
                    </span>
                    <span className="bg-black/30 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1 rounded-xl border border-white/20">
                      8 Levels
                    </span>
                    <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                      <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                      <span>4.9</span>
                      <span className="text-white/60 font-medium ml-1">(8.2K)</span>
                    </div>
                  </div>

                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                    Animal Farm Parking: Haunted Pasture 🐮
                  </h2>
                  <p className="text-emerald-100 text-sm sm:text-base font-medium mt-2 leading-relaxed max-w-lg drop-shadow-xs">
                    Steer Bessie the Cow into marked farm stalls through spooky mist! Watch your parking percentage accuracy and avoid wandering ghost sheep.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="bg-emerald-400 group-hover:bg-emerald-300 text-slate-950 px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2.5 transition-transform group-hover:scale-105">
                    <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                    <span>DRIVE BESSIE FREE</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-200/80 uppercase tracking-widest hidden sm:inline">
                    Ghost Sheep Hazards • Precision Parking • 8 Levels
                  </span>
                </div>
              </div>

              {/* Right Column: Visual Mascot & Theme Art */}
              <div className="relative z-10 my-4 md:my-0 flex flex-col items-center justify-center">
                <div className="text-7xl sm:text-8xl lg:text-9xl filter drop-shadow-2xl group-hover:scale-110 transition-transform duration-300 select-none">
                  🐮🎃🚜
                </div>
              </div>
            </div>
          )}

          {/* HERO CARD 1: Dog Parking (Featured Large Bento Card) */}
          {filteredGames.some((g) => g.id === 'dog-parking') && (
            <div
              onClick={() => navigate('/games/dog-parking/')}
              className="group cursor-pointer relative lg:col-span-6 bg-gradient-to-br from-orange-700 via-amber-800 to-purple-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between min-h-[320px] sm:min-h-[360px] border-2 border-orange-500/40 hover:border-orange-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-orange-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 -right-10 text-9xl sm:text-[140px] opacity-25 select-none pointer-events-none group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500">
                🐶
              </div>

              {/* Top Badges */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-orange-500 text-slate-950 font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 fill-slate-950 text-slate-950" />
                    <span>Ghost Pups</span>
                  </span>
                  <span className="bg-black/30 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1 rounded-xl border border-white/20">
                    12 Levels
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-amber-300 border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                  <span>4.9</span>
                  <span className="text-white/60 font-medium ml-1">(12.4K)</span>
                </div>
              </div>

              {/* Center Game Visual Icon & Mascot */}
              <div className="my-auto py-4 relative z-10">
                <div className="text-6xl sm:text-7xl mb-2 filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                  👻🐶🐾
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  Dog Parking: Haunted Kennel 🦴
                </h2>
                <p className="text-orange-100 text-sm sm:text-base font-medium max-w-sm mt-1 leading-snug drop-shadow-xs">
                  Slide playful ghost corgis and spooky hounds out of the haunted parking yard!
                </p>
              </div>

              {/* Bottom Play Action Bar */}
              <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/15">
                <span className="text-xs font-bold text-orange-200 uppercase tracking-widest">
                  Spooky Puzzle
                </span>

                <div className="bg-orange-500 group-hover:bg-orange-400 text-slate-950 px-5 py-2.5 rounded-2xl font-black text-sm shadow-lg flex items-center gap-2 transition-transform group-hover:scale-105">
                  <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
                  <span>PLAY GHOST PUPS</span>
                </div>
              </div>
            </div>
          )}

          {/* HERO CARD 2: Cat Parking (Featured Large Bento Card) */}
          {filteredGames.some((g) => g.id === 'cat-parking') && (
            <div
              onClick={() => navigate('/games/cat-parking/')}
              className="group cursor-pointer relative lg:col-span-6 bg-gradient-to-br from-purple-900 via-pink-950 to-indigo-950 rounded-3xl p-6 sm:p-8 overflow-hidden shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between min-h-[320px] sm:min-h-[360px] border-2 border-purple-500/40 hover:border-purple-400"
            >
              {/* Decorative background glow & shapes */}
              <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-500" />
              <div className="absolute -bottom-10 -right-10 text-9xl sm:text-[140px] opacity-25 select-none pointer-events-none group-hover:scale-110 group-hover:-rotate-6 transition-transform duration-500">
                🐱
              </div>

              {/* Top Badges */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-500 text-white font-black text-xs px-3 py-1 rounded-xl shadow-md flex items-center gap-1 uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 fill-white text-white" />
                    <span>Witch Cat</span>
                  </span>
                  <span className="bg-black/30 backdrop-blur-md text-white font-bold text-xs px-2.5 py-1 rounded-xl border border-white/20">
                    12 Levels
                  </span>
                </div>

                <div className="flex items-center gap-1 bg-black/40 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-black text-pink-300 border border-white/10">
                  <Star className="w-3.5 h-3.5 fill-pink-300 text-pink-300" />
                  <span>5.0</span>
                  <span className="text-white/60 font-medium ml-1">(9.8K)</span>
                </div>
              </div>

              {/* Center Game Visual Icon & Mascot */}
              <div className="my-auto py-4 relative z-10">
                <div className="text-6xl sm:text-7xl mb-2 filter drop-shadow-lg group-hover:scale-105 transition-transform duration-300">
                  🐈‍⬛✨🌙
                </div>
                <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
                  Cat Parking: Witch Mystery 🐈‍⬛
                </h2>
                <p className="text-pink-100 text-sm sm:text-base font-medium max-w-sm mt-1 leading-snug drop-shadow-xs">
                  Slide mystical black cats through moonlit bays and guide Luna to the enchanted cat flap!
                </p>
              </div>

              {/* Bottom Play Action Bar */}
              <div className="flex items-center justify-between relative z-10 pt-2 border-t border-white/15">
                <span className="text-xs font-bold text-pink-200 uppercase tracking-widest">
                  Witch Puzzle
                </span>

                <div className="bg-purple-500 group-hover:bg-purple-400 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-lg flex items-center gap-2 transition-transform group-hover:scale-105">
                  <Play className="w-4 h-4 fill-white text-white" />
                  <span>PLAY WITCH CAT</span>
                </div>
              </div>
            </div>
          )}

          {/* SECONDARY TILES: Other Games & Upcoming titles */}
          {filteredGames
            .filter((g) => g.id !== 'dog-parking' && g.id !== 'cat-parking' && g.id !== 'animal-farm-parking' && g.id !== 'farm-tetris' && g.id !== 'animal-2048' && g.id !== 'flappy-chicken' && g.id !== 'pet-candy-crush' && g.id !== 'duck-runner')
            .map((game) => (
              <div
                key={game.id}
                className="group relative lg:col-span-6 bg-slate-800/90 hover:bg-slate-800 rounded-3xl p-6 border border-slate-700/80 shadow-md flex flex-col justify-between min-h-[260px] opacity-80 hover:opacity-100 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="bg-slate-750 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-xl">
                    {game.badge || 'Coming Soon'}
                  </span>
                  <div className="flex items-center text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span>{game.rating}</span>
                  </div>
                </div>

                <div className="my-auto text-center py-4">
                  <div className="text-5xl mb-2">
                    {game.id === 'cat-cafe-rush' ? '🧁' : '🐹'}
                  </div>
                  <h3 className="text-xl font-black text-white">{game.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                    {game.tagline}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-750 flex items-center justify-between text-xs text-slate-400 font-bold">
                  <span className="uppercase tracking-wider">{game.category}</span>
                  <span className="bg-slate-700/80 text-slate-300 px-3 py-1.5 rounded-xl">
                    Coming Soon
                  </span>
                </div>
              </div>
            ))}
        </div>

        {/* Empty state when search produces no results */}
        {filteredGames.length === 0 && (
          <div className="text-center py-20 bg-slate-800/40 rounded-3xl border border-slate-800 my-8">
            <div className="text-5xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-white">No Games Found</h3>
            <p className="text-slate-400 text-sm mt-1">
              No games matched "{searchQuery}". Try clearing your search or filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveFilter('all');
              }}
              className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

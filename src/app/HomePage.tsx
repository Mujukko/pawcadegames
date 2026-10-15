import React from 'react';
import { GAMES_REGISTRY, GameMetadata } from '../lib/gamesRegistry';
import { Play, Star, Sparkles, Zap, ShieldCheck, Heart, Award } from 'lucide-react';

interface HomePageProps {
  navigate: (path: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ navigate }) => {
  const heroGame = GAMES_REGISTRY.find(g => g.id === 'dog-parking')!;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Featured Game Section */}
      <section className="bg-gradient-to-b from-indigo-900 via-indigo-950 to-slate-900 text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Decorative background blurs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Hero Copy */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs sm:text-sm font-bold">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>Trending in the US • Featured Game</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight">
              Slide cute dogs.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-200">
                Clear the yard.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Help Sunny the Golden Corgi and his playful furry friends untangle crowded parking yards in <strong className="text-white">Dog Parking</strong>. 100% free, no downloads, instant play on desktop and mobile!
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <button
                onClick={() => navigate('/games/dog-parking/')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-500 hover:to-yellow-500 text-slate-950 font-black rounded-2xl shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2.5 text-lg transition-transform hover:scale-102 cursor-pointer"
              >
                <Play className="w-6 h-6 fill-slate-950" />
                <span>Play Dog Parking Free</span>
              </button>

              <div className="flex items-center gap-3 text-slate-300 text-sm py-2 px-3">
                <div className="flex items-center text-amber-400">
                  <Star className="w-4 h-4 fill-amber-400" />
                  <span className="font-bold ml-1">4.9</span>
                </div>
                <span>•</span>
                <span>12 Handcrafted Levels</span>
              </div>
            </div>
          </div>

          {/* Featured Game Card Preview */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => navigate('/games/dog-parking/')}
              className="group cursor-pointer relative bg-white/10 backdrop-blur-md rounded-3xl p-5 border border-white/20 shadow-2xl max-w-md w-full hover:border-amber-400/50 transition-all hover:-translate-y-1"
            >
              <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-800 flex items-center justify-center border-2 border-slate-700/60 shadow-inner">
                {/* Visual game card mock */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 to-indigo-500/20" />
                <div className="text-center p-6 z-10">
                  <div className="text-6xl mb-2 animate-bounce">🐶</div>
                  <h3 className="text-2xl font-black text-white">Dog Parking</h3>
                  <p className="text-xs text-amber-300 font-bold mt-1">Tap or Click to Play Now</p>
                </div>

                <div className="absolute bottom-3 right-3 bg-amber-400 text-slate-950 p-2.5 rounded-xl shadow-md group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 fill-slate-950" />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-bold text-slate-300">
                <span className="bg-indigo-500/30 text-indigo-200 px-2.5 py-1 rounded-lg">
                  Casual Puzzle
                </span>
                <span className="text-amber-400">★ 4.9 (12k+ plays)</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Game Catalog Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 w-full">
        <div className="flex flex-col sm:flex-row items-baseline justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Featured Game Collection
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Handpicked browser games built for quick, joyful play sessions
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {GAMES_REGISTRY.map((game: GameMetadata) => {
            const isPlayable = game.status === 'playable';

            return (
              <div
                key={game.id}
                onClick={() => {
                  if (isPlayable) navigate(game.route);
                }}
                className={`group relative bg-white rounded-3xl p-5 border border-slate-200/90 shadow-sm transition-all ${
                  isPlayable
                    ? 'hover:shadow-xl hover:border-indigo-400/80 hover:-translate-y-1 cursor-pointer'
                    : 'opacity-75 cursor-default'
                }`}
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-16/10 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-200 overflow-hidden flex items-center justify-center border border-slate-100 mb-4 shadow-inner">
                  <div className="text-5xl">
                    {game.id === 'dog-parking' ? '🐶' : game.id === 'cat-cafe-rush' ? '🐱' : '🐹'}
                  </div>

                  {/* Badge */}
                  {game.badge && (
                    <span className="absolute top-3 left-3 bg-amber-400 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-sm">
                      {game.badge}
                    </span>
                  )}

                  {!isPlayable && (
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                      <span className="bg-slate-900/90 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-md">
                        Coming Soon
                      </span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                    {game.category}
                  </span>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                    <span>{game.rating}</span>
                  </div>
                </div>

                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  {game.title}
                </h3>
                <p className="text-slate-600 text-xs sm:text-sm mt-1 line-clamp-2 leading-relaxed">
                  {game.tagline}
                </p>

                {/* Card Action */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400">
                    {game.playCount}
                  </span>
                  {isPlayable ? (
                    <span className="text-indigo-600 font-extrabold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      Play Now ➔
                    </span>
                  ) : (
                    <span className="text-slate-400 font-semibold text-xs">
                      In Development
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Why Play on Pawcade / Feature Pillars */}
      <section className="bg-white border-y border-slate-200/80 py-16 px-4 sm:px-6 lg:px-8 select-none">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              Why Casual Gamers Love Pawcade
            </h2>
            <p className="text-slate-600 text-sm mt-2">
              Designed from the ground up for zero-friction browser gaming.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mb-2">Instant In-Browser Play</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                No storage consumption, no 500MB updates, and no app store accounts. Tap and play in 1 second on mobile or desktop.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mb-2">100% Solvable Brain Teasers</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every single level is mathematically verified with automated solver algorithms. Fair, satisfying, and rewarding.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-extrabold text-lg text-slate-900 mb-2">Family & Privacy Friendly</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Zero invasive trackers, zero spam notifications. All game progress is safely stored right in your browser.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SEO & Organic Content Area */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-slate-700 space-y-6">
        <h2 className="text-2xl font-black text-slate-900">
          Free Online Unblock & Parking Puzzle Games
        </h2>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600">
          Looking for a relaxing yet mentally stimulating brain teaser? <strong>Pawcade</strong> brings classic spatial logic puzzles to life with delightful canine and pet themes. In our flagship release, <em>Dog Parking</em>, players guide friendly dogs along parking grid lanes to help Sunny the Golden Corgi escape through the kennel gate.
        </p>

        <h3 className="text-xl font-bold text-slate-900 mt-6">
          How to Play Browser Puzzle Games on Desktop & Mobile
        </h3>
        <p className="text-sm sm:text-base leading-relaxed text-slate-600">
          Our games are powered by cutting-edge HTML5 Canvas and WebGL technology, making them natively compatible with modern browsers including Chrome, Safari, Edge, and Firefox. Simply tap and swipe on your smartphone or click and drag with your mouse.
        </p>
      </section>
    </div>
  );
};

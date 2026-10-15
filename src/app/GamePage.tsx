import React, { useEffect } from 'react';
import { DogParkingContainer } from '../games/dog-parking/DogParkingContainer';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { ChevronRight, Star, Sparkles, Keyboard, Smartphone, CheckCircle2, Shield, Heart } from 'lucide-react';

interface GamePageProps {
  navigate: (path: string) => void;
}

export const GamePage: React.FC<GamePageProps> = ({ navigate }) => {
  const game = GAMES_REGISTRY.find(g => g.id === 'dog-parking')!;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-slate-50/60 pb-16">
      {/* Breadcrumb Header */}
      <div className="bg-white border-b border-slate-200/80 py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-500 gap-1.5">
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors cursor-pointer">
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <button onClick={() => navigate('/')} className="hover:text-slate-900 transition-colors cursor-pointer">
            Puzzle Games
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-900 font-bold">Dog Parking</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full">
        {/* Game Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                Featured Puzzle
              </span>
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                <span>4.9 / 5.0 (US Casual)</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Dog Parking
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
              Slide adorable pups and long hounds through crowded yard bays to guide Sunny the Star Corgi to safety!
            </p>
          </div>
        </div>

        {/* The Playable Game Frame */}
        <div className="bg-slate-900/5 rounded-3xl p-3 sm:p-6 border border-slate-200/80 mb-12 shadow-inner flex justify-center">
          <DogParkingContainer />
        </div>

        {/* Instructions & Controls Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Controls */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Keyboard className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-slate-900">Controls & Shortcuts</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-600">
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-24">Desktop:</span>
                <span>Click and drag dogs along their natural lane (horizontal or vertical). Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">R</kbd> to restart or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Z</kbd> to undo.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                <span>Swipe with your finger along the dog's axis. Large touch-friendly control buttons at the top of the board.</span>
              </div>
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-slate-900">How to Win</h2>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Sunny the Star Corgi</strong> must reach the green <strong>EXIT ➔</strong> gate on the right.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dogs cannot turn corners or jump over each other.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Match or beat the target move count to earn a <strong>3-Star Rating</strong>!</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Meet the Dogs Breed Guide */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs mb-12">
          <h2 className="text-2xl font-black text-slate-900 mb-2">Meet the Yard Pack</h2>
          <p className="text-slate-600 text-sm mb-6">
            Each dog breed has a distinct size, personality, and movement style:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl text-center">
              <div className="text-3xl mb-1">⭐</div>
              <h3 className="font-extrabold text-slate-900 text-sm">Sunny (Hero Corgi)</h3>
              <p className="text-xs text-slate-500 mt-1">2 tiles • Wears a golden star collar. Needs to escape to the gate!</p>
            </div>

            <div className="bg-orange-50/60 border border-orange-100 p-4 rounded-2xl text-center">
              <div className="text-3xl mb-1">🐶</div>
              <h3 className="font-extrabold text-slate-900 text-sm">Slinky (Dachshund)</h3>
              <p className="text-xs text-slate-500 mt-1">3 tiles • Super long sausage dog! Requires 3 clear squares to slide.</p>
            </div>

            <div className="bg-stone-50/80 border border-stone-200 p-4 rounded-2xl text-center">
              <div className="text-3xl mb-1">🐾</div>
              <h3 className="font-extrabold text-slate-900 text-sm">Barnaby (Pug)</h3>
              <p className="text-xs text-slate-500 mt-1">2 tiles • Cute wrinkled face, loves snoozing right in the middle aisle.</p>
            </div>

            <div className="bg-yellow-50/60 border border-yellow-100 p-4 rounded-2xl text-center">
              <div className="text-3xl mb-1">🐕</div>
              <h3 className="font-extrabold text-slate-900 text-sm">Apollo (Retriever)</h3>
              <p className="text-xs text-slate-500 mt-1">3 tiles • Big friendly hound that often acts as a gatekeeper.</p>
            </div>
          </div>
        </section>

        {/* Structured Technical SEO Article */}
        <article className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs prose max-w-none text-slate-600 text-sm leading-relaxed space-y-4">
          <h2 className="text-2xl font-black text-slate-900">
            About Dog Parking — Free Unblock Puzzle Game
          </h2>
          <p>
            <strong>Dog Parking</strong> is an original, family-friendly casual puzzle game inspired by the legendary spatial sliding mechanics of classic traffic jam games (such as Rush Hour and Parking Jam). Created specifically for web browsers, Dog Parking delivers high-framerate 60 FPS gameplay with zero downloads or account creation.
          </p>

          <h3 className="text-lg font-bold text-slate-800">
            Why Dog Parking is Perfect for Casual Brain Training
          </h3>
          <p>
            Spatial puzzle games have been shown in cognitive research to enhance forward-planning, working memory, and spatial reasoning skills. In Dog Parking, each level presents a compact 6×6 yard with limited lanes of movement. Finding the solution requires breaking complex gridlocks down into a sequence of sub-goals—such as sliding a vertical hound downward to make room for a horizontal puppy.
          </p>

          <h3 className="text-lg font-bold text-slate-800">
            Playable On Any Device in the United States & Globally
          </h3>
          <p>
            Whether you are on an iPhone, Android smartphone, iPad, Chromebook, or Windows/Mac desktop, Dog Parking loads instantaneously in your favorite web browser. Enjoy unlimited restarts, undo moves, and explore 12 increasingly challenging handcrafted levels today on Pawcade!
          </p>
        </article>
      </div>
    </div>
  );
};

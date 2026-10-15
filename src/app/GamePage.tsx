import React, { useEffect } from 'react';
import { DogParkingContainer } from '../games/dog-parking/DogParkingContainer';
import { CatParkingContainer } from '../games/cat-parking/CatParkingContainer';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { ChevronRight, Star, Sparkles, Keyboard, Smartphone, CheckCircle2, Shield, Heart } from 'lucide-react';

interface GamePageProps {
  navigate: (path: string) => void;
  gameId?: string;
}

export const GamePage: React.FC<GamePageProps> = ({ navigate, gameId = 'dog-parking' }) => {
  const isCat = gameId === 'cat-parking';
  const game = GAMES_REGISTRY.find(g => g.id === gameId) || GAMES_REGISTRY[0]!;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [gameId]);

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
          <span className="text-slate-900 font-bold">{game.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 w-full">
        {/* Game Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                isCat ? 'bg-pink-100 text-pink-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {isCat ? '🐱 New Feline Puzzle' : '🐶 Featured Puzzle'}
              </span>
              <div className="flex items-center text-amber-500 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                <span>{game.rating} / 5.0 (Instant Play)</span>
              </div>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              {game.title}
            </h1>
            <p className="text-slate-600 text-sm sm:text-base mt-1 max-w-2xl">
              {game.tagline}
            </p>
          </div>
        </div>

        {/* The Playable Game Frame */}
        <div className="bg-slate-900/5 rounded-3xl p-3 sm:p-6 border border-slate-200/80 mb-12 shadow-inner flex justify-center">
          {isCat ? <CatParkingContainer /> : <DogParkingContainer />}
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
                <span>Click and drag {isCat ? 'cats' : 'dogs'} along their natural lane (horizontal or vertical). Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">R</kbd> to restart or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-xs font-mono border">Z</kbd> to undo.</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="font-bold text-slate-900 min-w-24">Mobile:</span>
                <span>Swipe with your finger along the animal's axis. Large touch-friendly control buttons at the top of the board.</span>
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
                <span><strong>{isCat ? 'Luna the Star Cat' : 'Sunny the Star Corgi'}</strong> must reach the green <strong>EXIT ➔</strong> gate on the right.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Pets cannot turn corners or jump over each other.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Earn up to 3 stars by completing each puzzle in the minimum possible moves!</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

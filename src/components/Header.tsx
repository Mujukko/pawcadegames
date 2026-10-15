import React, { useState } from 'react';
import { Gamepad2, Volume2, VolumeX, Sparkles, Menu, X } from 'lucide-react';
import { soundManager } from '../games/dog-parking/systems/sound';

interface HeaderProps {
  currentRoute: string;
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate }) => {
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => {
            navigate('/');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-400 p-0.5 shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center text-xl">
              🐶
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                PAWCADE
              </span>
              <span className="text-[10px] font-black tracking-widest bg-amber-400/20 text-amber-800 px-1.5 py-0.5 rounded-full uppercase">
                GAMES
              </span>
            </div>
            <p className="text-[10px] font-semibold text-slate-400 leading-none">
              Free Casual Pet Puzzles
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => navigate('/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
              currentRoute === '/'
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            All Games
          </button>

          <button
            onClick={() => navigate('/games/dog-parking/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/dog-parking')
                ? 'bg-amber-100 text-amber-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <span>🐶 Dog Parking</span>
          </button>

          <button
            onClick={() => navigate('/games/cat-parking/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/cat-parking')
                ? 'bg-pink-100 text-pink-900'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
            }`}
          >
            <Sparkles className="w-4 h-4 text-pink-500" />
            <span>Cat Parking</span>
            <span className="bg-pink-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
              NEW
            </span>
          </button>
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle sound"
            className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex flex-col gap-2">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold ${
              currentRoute === '/' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => {
              navigate('/games/dog-parking/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
              currentRoute.startsWith('/games/dog-parking') ? 'bg-amber-100 text-amber-900' : 'text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🐶 Dog Parking</span>
            </div>
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
              POPULAR
            </span>
          </button>
          <button
            onClick={() => {
              navigate('/games/cat-parking/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between ${
              currentRoute.startsWith('/games/cat-parking') ? 'bg-pink-100 text-pink-900' : 'text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-pink-500" />
              <span>🐱 Cat Parking</span>
            </div>
            <span className="bg-pink-500 text-white font-black text-[10px] px-1.5 py-0.5 rounded-full">
              NEW
            </span>
          </button>
        </div>
      )}
    </header>
  );
};

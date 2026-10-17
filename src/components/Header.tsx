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
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-orange-500/30 shadow-md shadow-orange-950/20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => {
            navigate('/');
            setMobileMenuOpen(false);
          }}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-orange-600 via-amber-500 to-purple-600 p-0.5 shadow-md shadow-orange-500/25 group-hover:scale-105 transition-transform animate-spooky-pulse">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center text-xl">
              🎃
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-xl tracking-tight text-white group-hover:text-orange-400 transition-colors">
                PAWCADE
              </span>
              <span className="text-[10px] font-black tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 px-1.5 py-0.5 rounded-full uppercase">
                HALLOWEEN 🦇
              </span>
            </div>
            <p className="text-[10px] font-semibold text-orange-300/80 leading-none">
              Spooky Free Pet Games • Trick or Treat 🍬
            </p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1.5">
          <button
            onClick={() => navigate('/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute === '/' || currentRoute.startsWith('/map')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-extrabold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>🌾 Çiftlik Haritası</span>
            <span className="bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              MAP
            </span>
          </button>

          <button
            onClick={() => navigate('/games')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute === '/games'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>🎮 Oyunlar</span>
          </button>

          <button
            onClick={() => navigate('/games/farm-mini-mart/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/farm-mini-mart')
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>🏪 Farm Mart</span>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              HOT
            </span>
          </button>

          <button
            onClick={() => navigate('/games/duck-runner/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/duck-runner')
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>🦆 Vampire Duck</span>
            <span className="bg-orange-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
              NEW
            </span>
          </button>

          <button
            onClick={() => navigate('/games/cat-parking/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/cat-parking')
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>🐈‍⬛ Witch Cat</span>
            <span className="bg-purple-500 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
              SPOOKY
            </span>
          </button>

          <button
            onClick={() => navigate('/games/dog-parking/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/dog-parking')
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>🦴 Ghost Pups</span>
          </button>

          <button
            onClick={() => navigate('/games/animal-farm-parking/')}
            className={`px-3.5 py-2 rounded-xl text-sm font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              currentRoute.startsWith('/games/animal-farm-parking')
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
          >
            <span>🎃 Haunted Farm</span>
            <span className="bg-emerald-600 text-white font-black text-[10px] px-1.5 py-0.2 rounded-full">
              HOT
            </span>
          </button>
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle sound"
            className="p-2 sm:px-3 sm:py-2 text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-orange-500/20 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-300 hover:text-white bg-slate-900 border border-orange-500/20 rounded-xl"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-orange-400" /> : <Menu className="w-5 h-5 text-orange-400" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-950/98 backdrop-blur-lg border-b border-orange-500/30 px-3 py-3 flex flex-col gap-1.5 shadow-2xl max-h-[80vh] overflow-y-auto">
          <button
            onClick={() => {
              navigate('/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute === '/' || currentRoute.startsWith('/map') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🌾 Çiftlik Haritası (Candy Crush Stili)</span>
            </div>
            <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              ANA SAYFA
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute === '/games' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🎮 Tüm Oyunlar (Liste Görünümü)</span>
            </div>
            <span className="text-xs text-orange-400">9 Oyun</span>
          </button>

          <button
            onClick={() => {
              navigate('/games/farm-mini-mart/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/farm-mini-mart') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🏪 Farm Mini Mart (Animal Market)</span>
            </div>
            <span className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              HOT TYCOON
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/duck-runner/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/duck-runner') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🦆 Vampire Duck (T-Rex Quack)</span>
            </div>
            <span className="bg-orange-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              SPOOKY
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/pet-candy-crush/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/pet-candy-crush') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🍬 Spooky Farm Animal Match</span>
            </div>
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              TREAT
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/flappy-chicken/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/flappy-chicken') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>👻 Ghost Chicken (Night Flight)</span>
            </div>
            <span className="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
              HAUNTED
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/animal-2048/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/animal-2048') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🦇 Animal 2048 (Spooky Evolution)</span>
            </div>
            <span className="bg-purple-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
              BAT TIER
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/farm-tetris/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/farm-tetris') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🎃 Farm Tetris (Pumpkin Harvest)</span>
            </div>
            <span className="bg-orange-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              HARVEST
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/dog-parking/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/dog-parking') ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🦴 Dog Parking (Ghost Pups)</span>
            </div>
            <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full">
              PUZZLE
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/cat-parking/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/cat-parking') ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>🐈‍⬛ Cat Parking (Witch Cat)</span>
            </div>
            <span className="bg-purple-500 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
              WITCH
            </span>
          </button>

          <button
            onClick={() => {
              navigate('/games/animal-farm-parking/');
              setMobileMenuOpen(false);
            }}
            className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-bold flex items-center justify-between cursor-pointer min-h-[44px] ${
              currentRoute.startsWith('/games/animal-farm-parking') ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-200 hover:bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <span>🎃 Farm Parking (Haunted Pasture)</span>
            </div>
            <span className="bg-emerald-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full">
              ACTION
            </span>
          </button>
        </div>
      )}
    </header>
  );
};

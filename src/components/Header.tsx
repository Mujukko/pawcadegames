import React, { useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../games/dog-parking/systems/sound';

interface HeaderProps {
  currentRoute: string;
  navigate: (path: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentRoute, navigate }) => {
  const [isMuted, setIsMuted] = useState(() => soundManager.isMuted());

  const toggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-orange-500/30 shadow-md shadow-orange-950/20 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div
          onClick={() => navigate('/')}
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

        {/* Navigation: ONLY All Games */}
        <nav className="flex items-center gap-2">
          <button
            onClick={() => navigate('/')}
            className={`px-3.5 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-black flex items-center gap-1.5 transition-all cursor-pointer ${
              currentRoute === '/' || currentRoute === '/games' || currentRoute === '/games/'
                ? 'bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 shadow-md border border-amber-300'
                : 'bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800'
            }`}
          >
            <span>🎮 All Games</span>
          </button>
        </nav>

        {/* Global Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle sound"
            className="p-2 sm:px-3 sm:py-2 min-h-[44px] min-w-[44px] text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-orange-500/20 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};


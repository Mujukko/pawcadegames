import React, { useState } from 'react';
import { Volume2, VolumeX, Gamepad2, Search, X } from 'lucide-react';
import { soundManager } from '../games/dog-parking/systems/sound';

interface HeaderProps {
  currentRoute: string;
  navigate: (path: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  navigate,
  searchQuery = '',
  onSearchChange,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted());
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);

  const toggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
    if (currentRoute !== '/' && currentRoute !== '/games') {
      navigate('/');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/40 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        {/* Brand Logo Lockup */}
        <div
          onClick={() => {
            navigate('/');
            if (onSearchChange) onSearchChange('');
          }}
          className="flex items-center gap-2 cursor-pointer group select-none shrink-0"
        >
          <img
            src="/assets/branding/logo-pawcade.svg"
            alt="Pawcade Games"
            className="h-9 sm:h-10 w-auto group-hover:scale-103 transition-transform"
          />
        </div>

        {/* Center: Desktop Instant Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search games (e.g. Tetris, Dog Parking, Tycoon)..."
              aria-label="Search all games"
              className="w-full pl-10 pr-9 py-2 bg-slate-900 border border-slate-700/80 hover:border-amber-400/60 focus:border-amber-400 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Navigation & Global Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Mobile Search Toggle Button */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Toggle search input"
            className="md:hidden p-2.5 min-h-[44px] min-w-[44px] text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl flex items-center justify-center transition-colors cursor-pointer"
          >
            <Search className="w-4 h-4 text-amber-400" />
          </button>

          {/* All Games Button */}
          <button
            onClick={() => {
              navigate('/');
              if (onSearchChange) onSearchChange('');
            }}
            className={`px-3.5 py-2 min-h-[44px] rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              currentRoute === '/' || currentRoute === '/games' || currentRoute === '/games/'
                ? 'bg-amber-400 text-slate-950 font-black shadow-md'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-800'
            }`}
          >
            <Gamepad2 className="w-4 h-4" />
            <span className="hidden sm:inline">All Games</span>
          </button>

          {/* Sound Mute Toggle */}
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle sound mute"
            className="p-2 sm:px-3 sm:py-2 min-h-[44px] min-w-[44px] text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            <span className="hidden sm:inline">{isMuted ? 'Muted' : 'Sound'}</span>
          </button>
        </div>
      </div>

      {/* Mobile Search Expandable Tray */}
      {mobileSearchOpen && (
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-800/80 bg-slate-950/95 animate-fade-in">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              autoFocus
              value={searchQuery}
              onChange={handleSearchInput}
              placeholder="Search games (e.g. Tetris, Dog Parking)..."
              aria-label="Search all games"
              className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange && onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

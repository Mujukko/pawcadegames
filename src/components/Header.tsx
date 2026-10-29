import React, { useState } from 'react';
import { Volume2, VolumeX, Search, X } from 'lucide-react';
import { soundManager } from '../games/dog-parking/systems/sound';
import { handleNavClick } from '../lib/navClick';
import { Logo } from './Logo';

interface HeaderProps {
  currentRoute: string;
  navigate: (path: string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

const NAV_LINKS = [
  { href: '/popular/', label: 'Popular' },
  { href: '/category/puzzle/', label: 'Puzzle' },
  { href: '/category/farm/', label: 'Farm' },
  { href: '/category/arcade/', label: 'Arcade' },
  { href: '/category/pets/', label: 'Pets' },
];

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  navigate,
  searchQuery = '',
  onSearchChange,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted());
  const [mobileSearchOpen, setMobileSearchOpen] = useState<boolean>(false);

  const toggleSound = () => {
    setIsMuted(soundManager.toggleMute());
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onSearchChange) onSearchChange(e.target.value);
    if (currentRoute !== '/' && currentRoute !== '/games') navigate('/');
  };

  const searchField = (autoFocus: boolean) => (
    <div className="relative w-full">
      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-faint pointer-events-none" />
      <input
        type="search"
        autoFocus={autoFocus}
        value={searchQuery}
        onChange={handleSearchInput}
        placeholder="Search games"
        aria-label="Search all games"
        className="w-full h-10 pl-10 pr-9 bg-paper border border-line rounded-full text-sm text-ink placeholder:text-ink-faint focus:outline-none focus:border-brand focus:bg-card transition-colors"
      />
      {searchQuery && (
        <button
          onClick={() => onSearchChange && onSearchChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink p-1 rounded-full cursor-pointer"
          aria-label="Clear search"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-40 bg-white shadow-[0_3px_0_rgb(27_60_110/0.08)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4">
        <a
          href="/"
          aria-label="Pawcade Games home"
          onClick={(e) =>
            handleNavClick(e, () => {
              navigate('/');
              if (onSearchChange) onSearchChange('');
            })
          }
          className="shrink-0"
        >
          <Logo />
        </a>

        <nav aria-label="Game categories" className="hidden lg:flex items-center gap-1 ml-2">
          {NAV_LINKS.map((l) => {
            const active = currentRoute.startsWith(l.href);
            return (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => handleNavClick(e, () => navigate(l.href))}
                className={`px-3.5 py-2 rounded-xl font-display font-semibold text-[15px] transition-colors ${
                  active ? 'bg-ink text-white' : 'text-ink hover:bg-paper'
                }`}
              >
                {l.label}
              </a>
            );
          })}
        </nav>

        <div className="hidden md:flex flex-1 justify-end">
          <div className="w-full max-w-xs">{searchField(false)}</div>
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0 shrink-0">
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            aria-label="Search games"
            aria-expanded={mobileSearchOpen}
            className="md:hidden w-11 h-11 rounded-full text-ink-soft hover:text-ink hover:bg-paper flex items-center justify-center cursor-pointer"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute sound' : 'Mute sound'}
            title={isMuted ? 'Unmute sound' : 'Mute sound'}
            className="w-11 h-11 rounded-full text-ink-soft hover:text-ink hover:bg-paper flex items-center justify-center cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileSearchOpen && <div className="md:hidden px-4 pb-3">{searchField(true)}</div>}
    </header>
  );
};

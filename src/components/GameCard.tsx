import React from 'react';
import { GameCategory, GameMetadata } from '../lib/gamesRegistry';
import { handleNavClick } from '../lib/navClick';
import { shortTitle } from '../lib/gameSeo';

interface GameCardProps {
  game: GameMetadata;
  onClick: () => void;
  /** 'large' spans 2x2 grid cells (featured games in the mosaic). */
  size?: 'default' | 'large';
  /** Priority cards above the fold: eager loaded with high fetch priority to optimize LCP. */
  priority?: boolean;
}

export const CATEGORY_CHIP: Record<GameCategory, { label: string; className: string }> = {
  puzzle: { label: 'Puzzle', className: 'bg-puzzle-tint text-puzzle-deep' },
  farm: { label: 'Farm', className: 'bg-farm-tint text-farm-deep' },
  arcade: { label: 'Arcade', className: 'bg-arcade-tint text-arcade-deep' },
  pets: { label: 'Pets', className: 'bg-pets-tint text-pets-deep' },
};

/** Thumbnail-first game tile. The name slides up on hover and is always shown on touch screens. */
export const GameCard: React.FC<GameCardProps> = ({ game, onClick, size = 'default', priority = false }) => {
  const name = shortTitle(game);
  const large = size === 'large';
  const isJpg = game.thumbnailUrl.endsWith('.jpg');
  const avifUrl = isJpg ? game.thumbnailUrl.replace(/\.jpg$/, '.avif') : null;

  return (
    <a
      href={game.route}
      onClick={(e) => handleNavClick(e, onClick)}
      aria-label={`Play ${name}`}
      className={`group relative block aspect-square rounded-[18px] sm:rounded-[22px] overflow-hidden bg-card ring-[3px] sm:ring-4 ring-white shadow-tile transition-transform duration-200 ease-out hover:-translate-y-1 hover:scale-[1.04] hover:shadow-lift hover:z-10 focus:outline-none focus-visible:ring-brand ${
        large ? 'col-span-2 row-span-2' : ''
      }`}
    >
      {avifUrl ? (
        <picture>
          <source srcSet={avifUrl} type="image/avif" />
          <img
            src={game.thumbnailUrl}
            alt=""
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding={priority ? 'sync' : 'async'}
            width={384}
            height={384}
            className="w-full h-full object-cover"
          />
        </picture>
      ) : (
        <img
          src={game.thumbnailUrl}
          alt=""
          loading={priority ? 'eager' : 'lazy'}
          fetchPriority={priority ? 'high' : 'auto'}
          decoding={priority ? 'sync' : 'async'}
          width={384}
          height={384}
          className="w-full h-full object-cover"
        />
      )}
      <span
        className={`absolute inset-x-0 bottom-0 px-2.5 pb-2 pt-8 bg-gradient-to-t from-black/75 via-black/35 to-transparent text-white font-display font-semibold leading-tight drop-shadow translate-y-full group-hover:translate-y-0 group-focus-visible:translate-y-0 [@media(hover:none)]:translate-y-0 transition-transform duration-200 ${
          large ? 'text-xl sm:text-2xl px-4 pb-3' : 'text-[13px] sm:text-sm'
        }`}
      >
        {name}
      </span>
    </a>
  );
};

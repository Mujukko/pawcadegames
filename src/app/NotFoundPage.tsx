import React from 'react';
import { handleNavClick } from '../lib/navClick';
import { Home, Play } from 'lucide-react';

interface NotFoundPageProps {
  navigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigate }) => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full bg-white rounded-[28px] shadow-tile p-8 text-center">
        <div className="text-6xl mb-4" aria-hidden="true">🐾</div>
        <p className="text-sm font-bold text-brand-deep mb-1">Error 404</p>
        <h1 className="font-display text-3xl font-semibold text-ink mb-2">This page wandered off</h1>
        <p className="text-ink-soft text-sm mb-6 leading-relaxed">
          We looked all over the barn and couldn't find it. Pick a game instead!
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="/"
            onClick={(e) => handleNavClick(e, () => navigate('/'))}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-brand text-white font-display font-semibold shadow-[0_4px_0_#c2470a] active:translate-y-1 active:shadow-none"
          >
            <Home className="w-4 h-4" />
            All games
          </a>
          <a
            href="/games/dog-parking/"
            onClick={(e) => handleNavClick(e, () => navigate('/games/dog-parking/'))}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-2xl bg-puzzle text-white font-display font-semibold shadow-[0_4px_0_#1f62ab] active:translate-y-1 active:shadow-none"
          >
            <Play className="w-4 h-4 fill-current" />
            Play Dog Parking
          </a>
        </div>
      </div>
    </div>
  );
};

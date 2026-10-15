import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HomePage } from './HomePage';
import { GamePage } from './GamePage';
import { NotFoundPage } from './NotFoundPage';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';

export const App: React.FC = () => {
  // Normalize current path from browser URL or hash
  const getInitialPath = (): string => {
    if (typeof window === 'undefined') return '/';
    if (window.location.hash.startsWith('#/')) {
      return window.location.hash.slice(1);
    }
    const path = window.location.pathname;
    return path || '/';
  };

  const [currentRoute, setCurrentRoute] = useState<string>(getInitialPath);

  // Sync state on back/forward browser button
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getInitialPath());
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
    };
  }, []);

  // Update SEO document title on route changes
  useEffect(() => {
    const dogParkingGame = GAMES_REGISTRY.find(g => g.id === 'dog-parking');
    const catParkingGame = GAMES_REGISTRY.find(g => g.id === 'cat-parking');

    if (currentRoute.startsWith('/games/dog-parking')) {
      document.title = dogParkingGame?.metaTitle || 'Dog Parking — Free Casual Puzzle Game | Pawcade';
    } else if (currentRoute.startsWith('/games/cat-parking')) {
      document.title = catParkingGame?.metaTitle || 'Cat Parking — Free Casual Cat Puzzle Game | Pawcade';
    } else if (currentRoute === '/' || currentRoute === '') {
      document.title = 'Pawcade — Poki-Style Free Browser Games Online';
    } else {
      document.title = 'Page Not Found (404) | Pawcade Games';
    }
  }, [currentRoute]);

  const navigate = (path: string) => {
    if (path === currentRoute) return;
    try {
      window.history.pushState({}, '', path);
      setCurrentRoute(path);
      window.scrollTo(0, 0);
    } catch {
      window.location.hash = '#' + path;
      setCurrentRoute(path);
    }
  };

  const renderCurrentView = () => {
    if (currentRoute === '/' || currentRoute === '' || currentRoute === '/index.html') {
      return <HomePage navigate={navigate} />;
    }
    if (currentRoute.startsWith('/games/dog-parking')) {
      return <GamePage navigate={navigate} gameId="dog-parking" />;
    }
    if (currentRoute.startsWith('/games/cat-parking')) {
      return <GamePage navigate={navigate} gameId="cat-parking" />;
    }
    return <NotFoundPage navigate={navigate} />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-300 selection:text-slate-900">
      <Header currentRoute={currentRoute} navigate={navigate} />
      <main className="grow">
        {renderCurrentView()}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
};

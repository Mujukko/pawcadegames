import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HomePage } from './HomePage';
import { NotFoundPage } from './NotFoundPage';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';

// Lazy load GamePage so the initial portal homepage bundle is ultra-lightweight
const GamePage = lazy(() => import('./GamePage').then(m => ({ default: m.GamePage })));

const LoadingSpinner: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
    <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center text-3xl animate-bounce shadow-md">
      🐶
    </div>
    <span className="text-slate-600 font-extrabold text-sm tracking-wide">
      Loading Dog Parking...
    </span>
  </div>
);

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

    if (currentRoute.startsWith('/games/dog-parking')) {
      document.title = dogParkingGame?.metaTitle || 'Dog Parking — Free Casual Puzzle Game | Pawcade';
    } else if (currentRoute === '/' || currentRoute === '') {
      document.title = 'Pawcade — Free Casual Pet & Dog Browser Games Online';
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
      return (
        <Suspense fallback={<LoadingSpinner />}>
          <GamePage navigate={navigate} />
        </Suspense>
      );
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

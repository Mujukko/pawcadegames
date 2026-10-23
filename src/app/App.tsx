import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HomePage } from './HomePage';
import { GamePage } from './GamePage';
import { NotFoundPage } from './NotFoundPage';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { analytics } from '../lib/analytics';

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
  const [searchQuery, setSearchQuery] = useState<string>('');

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
    const blockBlastGame = GAMES_REGISTRY.find(g => g.id === 'farm-block-blast');
    const sheepJamGame = GAMES_REGISTRY.find(g => g.id === 'sheep-cart-jam');
    const sandFallGame = GAMES_REGISTRY.find(g => g.id === 'grain-sand-fall');
    const farmMartGame = GAMES_REGISTRY.find(g => g.id === 'farm-mini-mart');
    const duckRunnerGame = GAMES_REGISTRY.find(g => g.id === 'duck-runner');
    const petCrushGame = GAMES_REGISTRY.find(g => g.id === 'pet-candy-crush');
    const flappyChickenGame = GAMES_REGISTRY.find(g => g.id === 'flappy-chicken');
    const animal2048Game = GAMES_REGISTRY.find(g => g.id === 'animal-2048');
    const dogParkingGame = GAMES_REGISTRY.find(g => g.id === 'dog-parking');
    const catParkingGame = GAMES_REGISTRY.find(g => g.id === 'cat-parking');
    const farmParkingGame = GAMES_REGISTRY.find(g => g.id === 'animal-farm-parking');
    const farmTetrisGame = GAMES_REGISTRY.find(g => g.id === 'farm-tetris');
    const chefRatGame = GAMES_REGISTRY.find(g => g.id === 'chef-rat-rush');

    let activeTitle = 'Pawcade Games 🎮 — Free Online Browser Games (No Downloads)';
    let activeDesc = 'Play free browser games on Pawcade! Instant play casual web games, pet and farm puzzles on mobile and desktop with zero downloads.';

    if (currentRoute.startsWith('/games/farm-block-blast') || currentRoute.startsWith('/games/block-blast')) {
      if (blockBlastGame) {
        activeTitle = blockBlastGame.metaTitle;
        activeDesc = blockBlastGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/sheep-cart-jam') || currentRoute.startsWith('/games/bus-jam')) {
      if (sheepJamGame) {
        activeTitle = sheepJamGame.metaTitle;
        activeDesc = sheepJamGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/grain-sand-fall') || currentRoute.startsWith('/games/sand-blocks') || currentRoute.startsWith('/games/sand-tetris')) {
      if (sandFallGame) {
        activeTitle = sandFallGame.metaTitle;
        activeDesc = sandFallGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/chef-rat-rush') || currentRoute.startsWith('/games/cat-cafe-rush')) {
      if (chefRatGame) {
        activeTitle = chefRatGame.metaTitle;
        activeDesc = chefRatGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-mini-mart') && farmMartGame) {
      activeTitle = farmMartGame.metaTitle;
      activeDesc = farmMartGame.metaDescription;
    } else if (currentRoute.startsWith('/games/duck-runner') && duckRunnerGame) {
      activeTitle = duckRunnerGame.metaTitle;
      activeDesc = duckRunnerGame.metaDescription;
    } else if ((currentRoute.startsWith('/games/pet-candy-crush') || currentRoute.startsWith('/games/farm-animal-crush')) && petCrushGame) {
      activeTitle = petCrushGame.metaTitle;
      activeDesc = petCrushGame.metaDescription;
    } else if (currentRoute.startsWith('/games/flappy-chicken') && flappyChickenGame) {
      activeTitle = flappyChickenGame.metaTitle;
      activeDesc = flappyChickenGame.metaDescription;
    } else if (currentRoute.startsWith('/games/animal-2048') && animal2048Game) {
      activeTitle = animal2048Game.metaTitle;
      activeDesc = animal2048Game.metaDescription;
    } else if (currentRoute.startsWith('/games/farm-tetris') && farmTetrisGame) {
      activeTitle = farmTetrisGame.metaTitle;
      activeDesc = farmTetrisGame.metaDescription;
    } else if (currentRoute.startsWith('/games/dog-parking') && dogParkingGame) {
      activeTitle = dogParkingGame.metaTitle;
      activeDesc = dogParkingGame.metaDescription;
    } else if (currentRoute.startsWith('/games/cat-parking') && catParkingGame) {
      activeTitle = catParkingGame.metaTitle;
      activeDesc = catParkingGame.metaDescription;
    } else if (currentRoute.startsWith('/games/animal-farm-parking') && farmParkingGame) {
      activeTitle = farmParkingGame.metaTitle;
      activeDesc = farmParkingGame.metaDescription;
    } else if (currentRoute === '/' || currentRoute === '' || currentRoute === '/games' || currentRoute === '/games/') {
      activeTitle = 'Pawcade Games 🎮 — Free Online Browser Games (No Downloads)';
    } else {
      activeTitle = 'Page Not Found (404) | Pawcade Games';
    }

    document.title = activeTitle;
    const metaDescTag = document.querySelector('meta[name="description"]');
    if (metaDescTag) {
      metaDescTag.setAttribute('content', activeDesc);
    }

    analytics.trackPageView(currentRoute);
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
    if (
      currentRoute === '/' ||
      currentRoute === '' ||
      currentRoute === '/index.html' ||
      currentRoute === '/games' ||
      currentRoute === '/games/' ||
      currentRoute === '#games' ||
      currentRoute === '/map'
    ) {
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />;
    }
    if (currentRoute.startsWith('/games/farm-block-blast') || currentRoute.startsWith('/games/block-blast')) {
      return <GamePage navigate={navigate} gameId="farm-block-blast" />;
    }
    if (currentRoute.startsWith('/games/sheep-cart-jam') || currentRoute.startsWith('/games/bus-jam')) {
      return <GamePage navigate={navigate} gameId="sheep-cart-jam" />;
    }
    if (currentRoute.startsWith('/games/grain-sand-fall') || currentRoute.startsWith('/games/sand-blocks') || currentRoute.startsWith('/games/sand-tetris')) {
      return <GamePage navigate={navigate} gameId="grain-sand-fall" />;
    }
    if (currentRoute.startsWith('/games/chef-rat-rush') || currentRoute.startsWith('/games/cat-cafe-rush')) {
      return <GamePage navigate={navigate} gameId="chef-rat-rush" />;
    }
    if (currentRoute.startsWith('/games/farm-mini-mart')) {
      return <GamePage navigate={navigate} gameId="farm-mini-mart" />;
    }
    if (currentRoute.startsWith('/games/duck-runner')) {
      return <GamePage navigate={navigate} gameId="duck-runner" />;
    }
    if (currentRoute.startsWith('/games/pet-candy-crush') || currentRoute.startsWith('/games/farm-animal-crush')) {
      return <GamePage navigate={navigate} gameId="pet-candy-crush" />;
    }
    if (currentRoute.startsWith('/games/flappy-chicken')) {
      return <GamePage navigate={navigate} gameId="flappy-chicken" />;
    }
    if (currentRoute.startsWith('/games/animal-2048')) {
      return <GamePage navigate={navigate} gameId="animal-2048" />;
    }
    if (currentRoute.startsWith('/games/farm-tetris')) {
      return <GamePage navigate={navigate} gameId="farm-tetris" />;
    }
    if (currentRoute.startsWith('/games/dog-parking')) {
      return <GamePage navigate={navigate} gameId="dog-parking" />;
    }
    if (currentRoute.startsWith('/games/cat-parking')) {
      return <GamePage navigate={navigate} gameId="cat-parking" />;
    }
    if (currentRoute.startsWith('/games/animal-farm-parking')) {
      return <GamePage navigate={navigate} gameId="animal-farm-parking" />;
    }
    return <NotFoundPage navigate={navigate} />;
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 selection:bg-orange-500 selection:text-slate-950">
      <Header
        currentRoute={currentRoute}
        navigate={navigate}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <main className="grow">
        {renderCurrentView()}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
};

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
    const farmMartGame = GAMES_REGISTRY.find(g => g.id === 'farm-mini-mart');
    const duckRunnerGame = GAMES_REGISTRY.find(g => g.id === 'duck-runner');
    const petCrushGame = GAMES_REGISTRY.find(g => g.id === 'pet-candy-crush');
    const flappyChickenGame = GAMES_REGISTRY.find(g => g.id === 'flappy-chicken');
    const animal2048Game = GAMES_REGISTRY.find(g => g.id === 'animal-2048');
    const dogParkingGame = GAMES_REGISTRY.find(g => g.id === 'dog-parking');
    const catParkingGame = GAMES_REGISTRY.find(g => g.id === 'cat-parking');
    const farmParkingGame = GAMES_REGISTRY.find(g => g.id === 'animal-farm-parking');
    const farmTetrisGame = GAMES_REGISTRY.find(g => g.id === 'farm-tetris');

    if (currentRoute.startsWith('/games/farm-mini-mart')) {
      document.title = farmMartGame?.metaTitle || 'Farm Mini Mart: Animal Market 🏪 — Free Online Idle Tycoon Game | Pawcade';
    } else if (currentRoute.startsWith('/games/duck-runner')) {
      document.title = duckRunnerGame?.metaTitle || 'Duck Runner: Vampire Quack 🎃 — Free Online Spooky Game | Pawcade';
    } else if (currentRoute.startsWith('/games/pet-candy-crush') || currentRoute.startsWith('/games/farm-animal-crush')) {
      document.title = petCrushGame?.metaTitle || 'Farm Animal Match: Spooky Trick-or-Treat Crush 🍬 | Pawcade';
    } else if (currentRoute.startsWith('/games/flappy-chicken')) {
      document.title = flappyChickenGame?.metaTitle || 'Flappy Chicken: Spooky Night Flight 👻 | Pawcade';
    } else if (currentRoute.startsWith('/games/animal-2048')) {
      document.title = animal2048Game?.metaTitle || 'Animal 2048: Spooky Evolution 🦇 | Pawcade';
    } else if (currentRoute.startsWith('/games/farm-tetris')) {
      document.title = farmTetrisGame?.metaTitle || 'Farm Tetris: Haunted Pumpkin Harvest 🎃 | Pawcade';
    } else if (currentRoute.startsWith('/games/dog-parking')) {
      document.title = dogParkingGame?.metaTitle || 'Dog Parking: Haunted Kennel Unblock 🦴 | Pawcade';
    } else if (currentRoute.startsWith('/games/cat-parking')) {
      document.title = catParkingGame?.metaTitle || 'Cat Parking: Black Cat Witch Mystery 🐈‍⬛ | Pawcade';
    } else if (currentRoute.startsWith('/games/animal-farm-parking')) {
      document.title = farmParkingGame?.metaTitle || 'Animal Farm Parking: Haunted Pasture 🎃 | Pawcade';
    } else if (currentRoute === '/' || currentRoute === '' || currentRoute === '/games' || currentRoute === '/games/') {
      document.title = 'Pawcade — Ücretsiz Çevrimiçi Tarayıcı Oyunları | Free Online Games';
    } else {
      document.title = 'Sayfa Bulunamadı (404) | Pawcade Games';
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
    if (
      currentRoute === '/' ||
      currentRoute === '' ||
      currentRoute === '/index.html' ||
      currentRoute === '/games' ||
      currentRoute === '/games/' ||
      currentRoute === '#games' ||
      currentRoute === '/map'
    ) {
      return <HomePage navigate={navigate} />;
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
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-500 selection:text-slate-950">
      <Header currentRoute={currentRoute} navigate={navigate} />
      <main className="grow">
        {renderCurrentView()}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
};

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
    const farmMahjongGame = GAMES_REGISTRY.find(g => g.id === 'farm-mahjong');
    const petMemoryGame = GAMES_REGISTRY.find(g => g.id === 'pet-memory-match');
    const duckHuntGame = GAMES_REGISTRY.find(g => g.id === 'duck-hunt-classic');
    const sheepStampedeGame = GAMES_REGISTRY.find(g => g.id === 'sheep-stampede');
    const horseshoeTwistGame = GAMES_REGISTRY.find(g => g.id === 'horseshoe-twist');
    const eggBusterGame = GAMES_REGISTRY.find(g => g.id === 'egg-buster');
    const critterTapGame = GAMES_REGISTRY.find(g => g.id === 'critter-tap-away');
    const pantrySortGame = GAMES_REGISTRY.find(g => g.id === 'farm-pantry-sort');
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
    const barnyardTowerGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-tower');
    const gopherGardenGame = GAMES_REGISTRY.find(g => g.id === 'gopher-garden');
    const fruitBubbleGame = GAMES_REGISTRY.find(g => g.id === 'farm-fruit-bubble');
    const sheepJumpGame = GAMES_REGISTRY.find(g => g.id === 'pasture-sheep-jump');
    const hungryPiggyGame = GAMES_REGISTRY.find(g => g.id === 'hungry-piggy');
    const duckPondGame = GAMES_REGISTRY.find(g => g.id === 'duck-pond-sort');
    const hamsterBallGame = GAMES_REGISTRY.find(g => g.id === 'hamster-ball-dash');
    const catCafeGame = GAMES_REGISTRY.find(g => g.id === 'cat-cafe-rush');

    let activeTitle = 'Pawcade Games 🎮 — Free Online Browser Games (No Downloads)';
    let activeDesc = 'Play free browser games on Pawcade! Instant play casual web games, pet and farm puzzles on mobile and desktop with zero downloads.';

    if (currentRoute.startsWith('/games/cat-cafe-rush')) {
      if (catCafeGame) {
        activeTitle = catCafeGame.metaTitle;
        activeDesc = catCafeGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/hamster-ball-dash') || currentRoute.startsWith('/games/tube-roll')) {
      if (hamsterBallGame) {
        activeTitle = hamsterBallGame.metaTitle;
        activeDesc = hamsterBallGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/duck-pond-sort') || currentRoute.startsWith('/games/duck-sort') || currentRoute.startsWith('/games/water-sort')) {
      if (duckPondGame) {
        activeTitle = duckPondGame.metaTitle;
        activeDesc = duckPondGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/hungry-piggy') || currentRoute.startsWith('/games/piggy-chomper') || currentRoute.startsWith('/games/farm-hole')) {
      if (hungryPiggyGame) {
        activeTitle = hungryPiggyGame.metaTitle;
        activeDesc = hungryPiggyGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-fruit-bubble') || currentRoute.startsWith('/games/fruit-bubble') || currentRoute.startsWith('/games/bubble-shooter')) {
      if (fruitBubbleGame) {
        activeTitle = fruitBubbleGame.metaTitle;
        activeDesc = fruitBubbleGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/pasture-sheep-jump') || currentRoute.startsWith('/games/sheep-jump') || currentRoute.startsWith('/games/doodle-jump')) {
      if (sheepJumpGame) {
        activeTitle = sheepJumpGame.metaTitle;
        activeDesc = sheepJumpGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-tower') || currentRoute.startsWith('/games/animal-stack')) {
      if (barnyardTowerGame) {
        activeTitle = barnyardTowerGame.metaTitle;
        activeDesc = barnyardTowerGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/gopher-garden') || currentRoute.startsWith('/games/whack-a-mole')) {
      if (gopherGardenGame) {
        activeTitle = gopherGardenGame.metaTitle;
        activeDesc = gopherGardenGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-mahjong') || currentRoute.startsWith('/games/mahjong') || currentRoute.startsWith('/games/farm-mahjong-solitaire')) {
      if (farmMahjongGame) {
        activeTitle = farmMahjongGame.metaTitle;
        activeDesc = farmMahjongGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/pet-memory-match') || currentRoute.startsWith('/games/memory-match') || currentRoute.startsWith('/games/card-match')) {
      if (petMemoryGame) {
        activeTitle = petMemoryGame.metaTitle;
        activeDesc = petMemoryGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/duck-hunt-classic') || currentRoute.startsWith('/games/duck-hunt') || currentRoute.startsWith('/games/retro-duck-hunt')) {
      if (duckHuntGame) {
        activeTitle = duckHuntGame.metaTitle;
        activeDesc = duckHuntGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/sheep-stampede') || currentRoute.startsWith('/games/mob-control') || currentRoute.startsWith('/games/colony-flow')) {
      if (sheepStampedeGame) {
        activeTitle = sheepStampedeGame.metaTitle;
        activeDesc = sheepStampedeGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/horseshoe-twist') || currentRoute.startsWith('/games/rotate-rings') || currentRoute.startsWith('/games/ring-unlock')) {
      if (horseshoeTwistGame) {
        activeTitle = horseshoeTwistGame.metaTitle;
        activeDesc = horseshoeTwistGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/egg-buster') || currentRoute.startsWith('/games/royal-smash') || currentRoute.startsWith('/games/smash-fest')) {
      if (eggBusterGame) {
        activeTitle = eggBusterGame.metaTitle;
        activeDesc = eggBusterGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/critter-tap-away') || currentRoute.startsWith('/games/tap-away')) {
      if (critterTapGame) {
        activeTitle = critterTapGame.metaTitle;
        activeDesc = critterTapGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-pantry-sort') || currentRoute.startsWith('/games/goods-sort')) {
      if (pantrySortGame) {
        activeTitle = pantrySortGame.metaTitle;
        activeDesc = pantrySortGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-block-blast') || currentRoute.startsWith('/games/block-blast')) {
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
    } else if (currentRoute.startsWith('/games/chef-rat-rush')) {
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
    } else if (currentRoute.startsWith('/category/popular') || currentRoute.startsWith('/popular')) {
      activeTitle = 'Most Popular Free Online Games 🌟 — Top Browser Hits (No Download) | Pawcade';
      activeDesc = 'Play the most popular free online browser games on Pawcade! Enjoy top trending hits like Farm Mini Mart, Farm Block Blast, Dog Parking, and Duck Hunt with zero downloads.';
    } else if (currentRoute.startsWith('/category/puzzle')) {
      activeTitle = 'Free Online Puzzle Games 🧩 — Brain Teasers & Spatial Puzzles (No Download) | Pawcade';
      activeDesc = 'Play free online puzzle games with zero downloads on Pawcade! Enjoy Farm Block Blast, Sheep Cart Jam, Dog Parking, Critter Tap Away, and more.';
    } else if (currentRoute.startsWith('/category/farm')) {
      activeTitle = 'Free Online Farm Games 🚜 — Barnyard Puzzles & Farm Tycoons (No Download) | Pawcade';
      activeDesc = 'Play free casual farm games online at Pawcade! Manage farm markets, drive tractors, herd sheep, and harvest crops directly in your browser.';
    } else if (currentRoute.startsWith('/category/arcade')) {
      activeTitle = 'Free Online Arcade Games 🕹️ — Retro Reflex & Tap Games (No Download) | Pawcade';
      activeDesc = 'Enjoy free retro-style casual arcade web games on Pawcade! Tap, dodge, flap, and jump in Duck Runner, Flappy Chicken, Egg Buster, and more.';
    } else if (currentRoute.startsWith('/category/pets')) {
      activeTitle = 'Cute Pet Games Online 🐾 — Free Animal Puzzles & Care Games (No Download) | Pawcade';
      activeDesc = 'Play free cute pet games in your browser on Pawcade! Slide corgis in Dog Parking, save cats in Cat Parking, feed cute critters, and solve cozy puzzles.';
    } else if (currentRoute === '/' || currentRoute === '' || currentRoute === '/games' || currentRoute === '/games/') {
      activeTitle = 'Pawcade Games 🎮 — Free Online Browser Games | No Download';
      activeDesc = 'Play free casual browser games online at Pawcade! Enjoy Farm Block Blast, Sheep Cart Jam, Dog Parking, Duck Runner, Pet Candy Crush, and more. Zero downloads, mobile & desktop compatible.';
    } else {
      activeTitle = 'Page Not Found (404) | Pawcade Games';
    }

    document.title = activeTitle;
    const metaDescTag = document.querySelector('meta[name="description"]');
    if (metaDescTag) {
      metaDescTag.setAttribute('content', activeDesc);
    }

    analytics.trackPageView(currentRoute, activeTitle);
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
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialCategory="all" />;
    }
    if (currentRoute.startsWith('/category/popular') || currentRoute.startsWith('/popular')) {
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialCategory="popular" />;
    }
    if (currentRoute.startsWith('/category/puzzle')) {
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialCategory="puzzle" />;
    }
    if (currentRoute.startsWith('/category/farm')) {
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialCategory="farm" />;
    }
    if (currentRoute.startsWith('/category/arcade')) {
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialCategory="arcade" />;
    }
    if (currentRoute.startsWith('/category/pets')) {
      return <HomePage navigate={navigate} searchQuery={searchQuery} setSearchQuery={setSearchQuery} initialCategory="pets" />;
    }
    if (currentRoute.startsWith('/games/cat-cafe-rush')) {
      return <GamePage navigate={navigate} gameId="cat-cafe-rush" />;
    }
    if (currentRoute.startsWith('/games/hamster-ball-dash') || currentRoute.startsWith('/games/tube-roll')) {
      return <GamePage navigate={navigate} gameId="hamster-ball-dash" />;
    }
    if (currentRoute.startsWith('/games/duck-pond-sort') || currentRoute.startsWith('/games/duck-sort') || currentRoute.startsWith('/games/water-sort')) {
      return <GamePage navigate={navigate} gameId="duck-pond-sort" />;
    }
    if (currentRoute.startsWith('/games/hungry-piggy') || currentRoute.startsWith('/games/piggy-chomper') || currentRoute.startsWith('/games/farm-hole')) {
      return <GamePage navigate={navigate} gameId="hungry-piggy" />;
    }
    if (currentRoute.startsWith('/games/farm-fruit-bubble') || currentRoute.startsWith('/games/fruit-bubble') || currentRoute.startsWith('/games/bubble-shooter')) {
      return <GamePage navigate={navigate} gameId="farm-fruit-bubble" />;
    }
    if (currentRoute.startsWith('/games/pasture-sheep-jump') || currentRoute.startsWith('/games/sheep-jump') || currentRoute.startsWith('/games/doodle-jump')) {
      return <GamePage navigate={navigate} gameId="pasture-sheep-jump" />;
    }
    if (currentRoute.startsWith('/games/barnyard-tower') || currentRoute.startsWith('/games/animal-stack')) {
      return <GamePage navigate={navigate} gameId="barnyard-tower" />;
    }
    if (currentRoute.startsWith('/games/gopher-garden') || currentRoute.startsWith('/games/whack-a-mole')) {
      return <GamePage navigate={navigate} gameId="gopher-garden" />;
    }
    if (currentRoute.startsWith('/games/farm-mahjong') || currentRoute.startsWith('/games/mahjong') || currentRoute.startsWith('/games/farm-mahjong-solitaire')) {
      return <GamePage navigate={navigate} gameId="farm-mahjong" />;
    }
    if (currentRoute.startsWith('/games/pet-memory-match') || currentRoute.startsWith('/games/memory-match') || currentRoute.startsWith('/games/card-match')) {
      return <GamePage navigate={navigate} gameId="pet-memory-match" />;
    }
    if (currentRoute.startsWith('/games/duck-hunt-classic') || currentRoute.startsWith('/games/duck-hunt') || currentRoute.startsWith('/games/retro-duck-hunt')) {
      return <GamePage navigate={navigate} gameId="duck-hunt-classic" />;
    }
    if (currentRoute.startsWith('/games/sheep-stampede') || currentRoute.startsWith('/games/mob-control') || currentRoute.startsWith('/games/colony-flow')) {
      return <GamePage navigate={navigate} gameId="sheep-stampede" />;
    }
    if (currentRoute.startsWith('/games/horseshoe-twist') || currentRoute.startsWith('/games/rotate-rings') || currentRoute.startsWith('/games/ring-unlock')) {
      return <GamePage navigate={navigate} gameId="horseshoe-twist" />;
    }
    if (currentRoute.startsWith('/games/egg-buster') || currentRoute.startsWith('/games/royal-smash') || currentRoute.startsWith('/games/smash-fest')) {
      return <GamePage navigate={navigate} gameId="egg-buster" />;
    }
    if (currentRoute.startsWith('/games/critter-tap-away') || currentRoute.startsWith('/games/tap-away')) {
      return <GamePage navigate={navigate} gameId="critter-tap-away" />;
    }
    if (currentRoute.startsWith('/games/farm-pantry-sort') || currentRoute.startsWith('/games/goods-sort')) {
      return <GamePage navigate={navigate} gameId="farm-pantry-sort" />;
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
    if (currentRoute.startsWith('/games/chef-rat-rush')) {
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

import React, { useEffect, Suspense, lazy } from 'react';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { analytics } from '../lib/analytics';
import { ChevronRight, Star, Sparkles, Keyboard, Smartphone, CheckCircle2, Shield, Heart } from 'lucide-react';

// Dynamic lazy-loading for all 9 game containers for optimal initial bundle size
const FarmMiniMartContainer = lazy(() =>
  import('../games/farm-mini-mart/FarmMiniMartContainer').then((m) => ({ default: m.FarmMiniMartContainer }))
);
const DuckRunnerContainer = lazy(() =>
  import('../games/duck-runner/DuckRunnerContainer').then((m) => ({ default: m.DuckRunnerContainer }))
);
const PetCandyCrushContainer = lazy(() =>
  import('../games/pet-candy-crush/PetCandyCrushContainer').then((m) => ({ default: m.PetCandyCrushContainer }))
);
const FlappyChickenContainer = lazy(() =>
  import('../games/flappy-chicken/FlappyChickenContainer').then((m) => ({ default: m.FlappyChickenContainer }))
);
const Animal2048Container = lazy(() =>
  import('../games/animal-2048/Animal2048Container').then((m) => ({ default: m.Animal2048Container }))
);
const DogParkingContainer = lazy(() =>
  import('../games/dog-parking/DogParkingContainer').then((m) => ({ default: m.DogParkingContainer }))
);
const CatParkingContainer = lazy(() =>
  import('../games/cat-parking/CatParkingContainer').then((m) => ({ default: m.CatParkingContainer }))
);
const AnimalFarmParkingContainer = lazy(() =>
  import('../games/animal-farm-parking/AnimalFarmParkingContainer').then((m) => ({ default: m.AnimalFarmParkingContainer }))
);
const FarmTetrisContainer = lazy(() =>
  import('../games/farm-tetris/FarmTetrisContainer').then((m) => ({ default: m.FarmTetrisContainer }))
);

const GameLoadingFallback: React.FC<{ title: string; mascot?: string }> = ({ title, mascot = '🎮' }) => (
  <div className="flex flex-col items-center justify-center min-h-[460px] sm:min-h-[580px] w-full bg-slate-950/80 rounded-2xl border border-orange-500/20 p-8 text-center animate-fade-in">
    <div className="relative mb-6">
      <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-orange-600 to-amber-500 animate-spin flex items-center justify-center p-1 shadow-xl shadow-orange-500/20">
        <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center text-3xl">
          <span className="animate-bounce select-none">{mascot}</span>
        </div>
      </div>
      <span className="absolute -bottom-1 -right-1 text-xl animate-spooky-float select-none">✨</span>
    </div>
    <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight mb-2">
      Loading {title}...
    </h3>
    <p className="text-orange-200/80 text-xs sm:text-sm font-semibold max-w-xs">
      Preparing game engine & spooky assets...
    </p>
    <div className="mt-4 w-48 h-2 bg-slate-800 rounded-full overflow-hidden border border-orange-500/30">
      <div className="h-full bg-gradient-to-r from-orange-500 via-amber-400 to-purple-500 rounded-full animate-pulse w-3/4" />
    </div>
  </div>
);

interface GamePageProps {
  navigate: (path: string) => void;
  gameId?: string;
}

export const GamePage: React.FC<GamePageProps> = ({ navigate, gameId = 'dog-parking' }) => {
  const isFarmMart = gameId === 'farm-mini-mart';
  const isDuckRunner = gameId === 'duck-runner';
  const isPetCrush = gameId === 'pet-candy-crush';
  const isFlappy = gameId === 'flappy-chicken';
  const is2048 = gameId === 'animal-2048';
  const isFarmTetris = gameId === 'farm-tetris';
  const isCat = gameId === 'cat-parking';
  const isFarm = gameId === 'animal-farm-parking';
  const game = GAMES_REGISTRY.find(g => g.id === gameId) || GAMES_REGISTRY[0]!;
  const relatedGames = GAMES_REGISTRY.filter(g => g.id !== gameId && g.status === 'playable').slice(0, 4);

  useEffect(() => {
    window.scrollTo(0, 0);
    analytics.track('game_loaded', { gameId });

    // Dynamic Schema.org VideoGame & WebApplication JSON-LD injection for US Search Crawlers
    const existingScript = document.getElementById('game-schema-ld');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = 'game-schema-ld';
    script.type = 'application/ld+json';
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': ['WebApplication', 'VideoGame'],
      name: game.title,
      description: game.metaDescription,
      applicationCategory: 'Game',
      operatingSystem: 'Web Browser',
      browserRequirements: 'Requires JavaScript. Requires HTML5.',
      inLanguage: 'en-US',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.rating.toString(),
        bestRating: '5.0',
        ratingCount: '150',
      },
    });
    document.head.appendChild(script);

    return () => {
      const el = document.getElementById('game-schema-ld');
      if (el) el.remove();
    };
  }, [gameId, game]);

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 pb-16 pb-safe">
      {/* Breadcrumb Header */}
      <div className="bg-slate-900/90 border-b border-orange-500/20 py-2 sm:py-3 px-3 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-400 gap-1.5 overflow-x-auto scrollbar-none">
          <button onClick={() => navigate('/')} className="hover:text-orange-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1">
            <span>🎃 Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-orange-500/60 shrink-0" />
          <button onClick={() => navigate('/')} className="hover:text-orange-300 transition-colors cursor-pointer shrink-0">
            {isFarmMart ? 'Farm Tycoon' : isDuckRunner ? 'Vampire Runner' : isPetCrush ? 'Trick-or-Treat' : isFlappy ? 'Haunted Flight' : is2048 ? 'Spooky Evolution' : isFarmTetris ? 'Pumpkin Harvest' : isFarm ? 'Haunted Pasture' : 'Spooky Puzzles'}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-orange-500/60 shrink-0" />
          <span className="text-orange-400 font-bold truncate">{game.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 sm:pt-8 w-full">
        {/* Halloween Live Event Banner */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 via-purple-700 to-amber-600 rounded-2xl p-3 sm:p-4 text-white flex items-center justify-between shadow-lg shadow-orange-950/40 border border-orange-400/40">
          <div className="flex items-center gap-3">
            <span className="text-2xl sm:text-3xl animate-spooky-float select-none">🎃</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider bg-black/40 px-2 py-0.5 rounded-full border border-orange-300/40">
                  Halloween Spooktacular Special 🦇
                </span>
                <span className="text-xs font-bold text-orange-200 hidden sm:inline">
                  Limited Festive Season Mode
                </span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-orange-100 mt-0.5">
                Trick or Treat! High scores earn bonus sweet candy ribbons & festive harvest stars! 🍬✨
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-2xl select-none">
            <span>👻</span>
            <span>🍬</span>
            <span>🦇</span>
          </div>
        </div>

        {/* Game Title Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6 px-1">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isFarmMart
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isDuckRunner
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : isPetCrush
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : isFlappy
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : is2048
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : isFarmTetris
                  ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                  : isFarm
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isCat
                  ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                  : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
              }`}>
                {isFarmMart ? '🏪 Farm Mini Mart Tycoon' : isDuckRunner ? '🦆🎃 Vampire Duck Runner' : isPetCrush ? '🍬 Spooky Animal Match' : isFlappy ? '👻 Ghost Chicken Flight' : is2048 ? '🦇 Spooky Animal 2048' : isFarmTetris ? '🎃 Haunted Harvest Tetris' : isFarm ? '🐮 Haunted Cow Driving' : isCat ? '🐈‍⬛ Witch Cat Puzzle' : '🦴 Ghost Pup Puzzle'}
              </span>
              <div className="flex items-center text-amber-400 text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                <span>{game.rating} / 5.0 (Instant Play)</span>
              </div>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight leading-tight">
              {game.title}
            </h1>
            <p className="text-slate-300 text-xs sm:text-base mt-0.5 sm:mt-1 max-w-2xl line-clamp-2 sm:line-clamp-none">
              {game.tagline}
            </p>
          </div>
        </div>

        {/* The Playable Game Frame */}
        <div className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-1 sm:p-6 border border-orange-500/30 mb-8 sm:mb-12 shadow-2xl shadow-orange-950/20 flex justify-center overflow-hidden">
          <Suspense
            fallback={
              <GameLoadingFallback
                title={game.title}
                mascot={
                  isFarmMart
                    ? '🏪'
                    : isDuckRunner
                    ? '🦆'
                    : isPetCrush
                    ? '🍬'
                    : isFlappy
                    ? '🐔'
                    : is2048
                    ? '🐘'
                    : isFarmTetris
                    ? '🌾'
                    : isFarm
                    ? '🐮'
                    : isCat
                    ? '🐱'
                    : '🐶'
                }
              />
            }
          >
            {isFarmMart ? (
              <FarmMiniMartContainer />
            ) : isDuckRunner ? (
              <DuckRunnerContainer />
            ) : isPetCrush ? (
              <PetCandyCrushContainer />
            ) : isFlappy ? (
              <FlappyChickenContainer />
            ) : is2048 ? (
              <Animal2048Container />
            ) : isFarmTetris ? (
              <FarmTetrisContainer />
            ) : isFarm ? (
              <AnimalFarmParkingContainer />
            ) : isCat ? (
              <CatParkingContainer />
            ) : (
              <DogParkingContainer />
            )}
          </Suspense>
        </div>

        {/* Instructions & Controls Guide */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Controls */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-orange-500/20 shadow-lg text-slate-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <Keyboard className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-white">Controls & Shortcuts</h2>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              {isFarmMart ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">W/A/S/D</kbd> or <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Arrow Keys</kbd> to steer the farmer around the mart. Walk up to plots to harvest, shelves to restock, and the Cash Register counter to checkout customers and collect your coins. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">U</kbd> to open the Upgrades shop!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Touch anywhere on the game canvas and drag your thumb to steer with the dynamic 360° virtual joystick. Actions trigger automatically when you stand near plots, shelves, pads, or the cash register. Tap the <strong>UPGRADES</strong> button to level up!</span>
                  </div>
                </>
              ) : isDuckRunner ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Spacebar</kbd> or <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">↑</kbd> to jump over carved jack-o'-lanterns and fences. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">↓</kbd> to duck/crouch under midnight bats, or tap <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">↓</kbd> in mid-air for a fast-fall slam. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">R</kbd> to restart.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Tap anywhere on the upper screen to jump, or use the on-screen bottom dual thumb buttons: <strong>DUCK ⬇️</strong> on the left thumb and <strong>JUMP ⬆️</strong> on the right thumb.</span>
                  </div>
                </>
              ) : isPetCrush ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Click on any animal to select it, then click an adjacent neighbor to swap them (or click and drag in any direction). Match 3 or more identical farm animals to clear them!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Tap a farm animal and tap its neighbor, or swipe your thumb across the grid to swap animals instantly.</span>
                  </div>
                </>
              ) : isFlappy ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Spacebar</kbd>, <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">↑</kbd>, or <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">W</kbd> to flap wings and cluck. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">P</kbd> to pause and <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">R</kbd> to restart.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Tap anywhere directly on the flight canvas, or use the large yellow <strong>TAP TO FLAP</strong> button at the bottom for easy thumb control.</span>
                  </div>
                </>
              ) : is2048 ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Arrow Keys</kbd> or <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">W</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">A</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">S</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">D</kbd> to slide tiles across the 4x4 grid. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Ctrl + Z</kbd> or click <strong>Undo</strong>.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Swipe in any of the 4 directions anywhere across the board, or use the on-screen touch D-Pad buttons at the bottom.</span>
                  </div>
                </>
              ) : isFarmTetris ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">A</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">D</kbd> to move left/right, <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">W</kbd> to rotate, <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Space</kbd> for Hard Drop slam.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Use the bottom touch D-Pad to steer, tap Rotate to turn blocks, and tap SLAM to drop.</span>
                  </div>
                </>
              ) : isFarm ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">W</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">A</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">S</kbd><kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">D</kbd> or <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Arrow Keys</kbd> to steer Bessie. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Space</kbd> to brake.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Use the on-screen 4-way D-Pad and center STOP button for smooth touch steering.</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Click and drag {isCat ? 'cats' : 'dogs'} along their lane. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">R</kbd> to restart or <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Z</kbd> to undo.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Swipe with your finger along the animal's axis. Large touch-friendly control buttons at the top of the board.</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Game Rules */}
          <div className="bg-slate-900/90 rounded-3xl p-6 border border-orange-500/20 shadow-lg text-slate-300">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="text-xl font-black text-white">How to Win</h2>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-300">
              {isFarmMart ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Harvest ripe farm crops (🍅 Tomatoes, 🌽 Corn, 🥚 Eggs, 🥛 Milk, 🎃 Pumpkins) by walking near garden plots into your carried item stack.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Restock wooden display shelves around the mart so animal customers can browse and pick their desired produce.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Step up to the <strong>Cash Register</strong> counter to check out animal shoppers waiting in line and collect drops of golden coins!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Step onto glowing floor <strong>Unlock Pads</strong> to invest your earnings and unlock new crops, shelves, <strong>Barnaby the Helper Dog 🐶</strong>, and an automated Cashier!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Tap <strong>UPGRADES</strong> to level up your <strong>Walking Speed</strong> and <strong>Carry Stack Capacity</strong> to serve more shoppers faster!</span>
                  </li>
                </>
              ) : isDuckRunner ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Run as far as you can across the rustic barnyard meadow! Speed ramps up progressively as your distance increases.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Jump over low farm obstacles: rustic wooden fences, small hay bales, and stacked double hay rolls.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Duck/crouch under high flying crows and seagulls. Low-flying crows require a well-timed jump to leap over!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Celebrate retro milestone chimes every <strong>100 points</strong> and watch the sky transition smoothly through the <strong>day-to-night cycle</strong> every 600 points!</span>
                  </li>
                </>
              ) : isPetCrush ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Match 3 identical farm animals (🐮, 🐷, 🐑, 🐔, 🦆, 🐴) horizontally or vertically to gather them and score points!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Match a <strong>2×2 Square</strong> to craft a <strong>Dynamite Bomb (🧨)</strong> that blasts a 3×3 + Cross (+) area and fires 2 homing strikes!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Match <strong>4 in a line</strong> for a <strong>Striped Line Rocket (⚡)</strong>, <strong>L or T shape</strong> for a <strong>3×3 Barrel Bomb (💣)</strong>, or <strong>5 in a row</strong> for a <strong>Golden Barn Star (🌟)</strong>!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Double-tap any bomb to detonate it in-place, or swap 2 bombs together for a <strong>Mega 5×5 Crater Explosion</strong>!</span>
                  </li>
                </>
              ) : isFlappy ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Flap your wings to stay airborne and steer through the openings between rustic fence pillars.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Watch your live <strong>Flight to Golden Wheat Progress Meter</strong> at the top fill from 0% to 100%!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Collect floating golden grain kernels in the middle of fence openings for bonus harvest points!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>Clear <strong>15 farm gates</strong> to reach the grand <strong>Golden Wheat Field & Granary (🌾)</strong> and feast on the harvest!</span>
                  </li>
                </>
              ) : is2048 ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Slide the grid in 4 directions to merge identical animal tiles (e.g. <strong>🐭 Mouse + 🐭 Mouse = 🐹 Hamster</strong>).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Follow the 12-animal ladder: 🐭 Mouse ➔ 🐹 Hamster ➔ 🐰 Bunny ➔ 🐱 Cat ➔ 🐶 Dog ➔ 🦊 Fox ➔ 🦌 Deer ➔ 🐗 Wild Boar ➔ 🐻 Grizzly Bear ➔ 🦏 Rhino ➔ <strong>🐘 Elephant (2048)</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Reaching the mighty <strong>🐘 Elephant</strong> unlocks the royal trumpet fanfare celebration and enters Endless Mode!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Push beyond 2048 to unlock the supreme titan: <strong>🐋 Blue Whale (4096)</strong>!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <span>Use the <strong>1-step Undo button</strong> if you get stuck or make an accidental slide.</span>
                  </li>
                </>
              ) : isFarmTetris ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Stack falling harvest crops to complete horizontal lines and clear rows.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Watch golden hay burst into the <strong>Hay Silo</strong> on the right! Every line adds <strong>10% silo capacity</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Cheer with the <strong>cute farmer</strong> sitting on top of the silo as he waves and yells <strong>"WOW!"</strong> when lines pop!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Fill the silo to 100% to complete silos, advance your level, and build your high score!</span>
                  </li>
                </>
              ) : isFarm ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Maneuver Bessie into the designated stall marked with the <strong>🐮 Cow Logo & 🥛 Milk Emblem</strong> with at least <strong>80% accuracy</strong> and come to a complete stop.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Avoid collisions with fences, tractors, hay bales, and sheep — contact <strong>drains your health % continuously</strong>!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Park cleanly with high health and accuracy to earn up to 3 stars across all 8 farm levels!</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>{isCat ? 'Luna the Star Cat' : 'Sunny the Star Corgi'}</strong> must reach the green <strong>EXIT ➔</strong> gate on the right.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Pets cannot turn corners or jump over each other.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>Earn up to 3 stars by completing each puzzle in the minimum possible moves!</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* RELATED GAMES SHELF */}
        {relatedGames.length > 0 && (
          <section aria-labelledby="related-games-heading" className="mt-8 border-t border-slate-800/80 pt-8 sm:pt-10">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 id="related-games-heading" className="text-xl sm:text-2xl font-black text-white">
                    More Games You'll Love
                  </h2>
                  <p className="text-xs text-slate-400">Handcrafted instant casual games on Pawcade</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-5">
              {relatedGames.map((relGame) => (
                <GameCard
                  key={relGame.id}
                  game={relGame}
                  onClick={() => navigate(relGame.route)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

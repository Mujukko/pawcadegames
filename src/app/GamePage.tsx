import React, { useState, useEffect, Suspense, lazy } from 'react';
import { GAMES_REGISTRY } from '../lib/gamesRegistry';
import { GameCard } from '../components/GameCard';
import { GameIntroModal } from '../components/GameIntroModal';
import { analytics } from '../lib/analytics';
import { ChevronRight, Star, Sparkles, Keyboard, Smartphone, CheckCircle2, Shield, Heart, HelpCircle } from 'lucide-react';

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
const ChefRatRushContainer = lazy(() =>
  import('../games/chef-rat-rush/ChefRatRushContainer').then((m) => ({ default: m.ChefRatRushContainer }))
);
const FarmBlockBlastContainer = lazy(() =>
  import('../games/farm-block-blast/FarmBlockBlastContainer').then((m) => ({ default: m.FarmBlockBlastContainer }))
);
const SheepCartJamContainer = lazy(() =>
  import('../games/sheep-cart-jam/SheepCartJamContainer').then((m) => ({ default: m.SheepCartJamContainer }))
);
const GrainSandFallContainer = lazy(() =>
  import('../games/grain-sand-fall/GrainSandFallContainer').then((m) => ({ default: m.GrainSandFallContainer }))
);
const FarmPantrySortContainer = lazy(() =>
  import('../games/farm-pantry-sort/FarmPantrySortContainer').then((m) => ({ default: m.FarmPantrySortContainer }))
);
const CritterTapAwayContainer = lazy(() =>
  import('../games/critter-tap-away/CritterTapAwayContainer').then((m) => ({ default: m.CritterTapAwayContainer }))
);
const EggBusterContainer = lazy(() =>
  import('../games/egg-buster/EggBusterContainer').then((m) => ({ default: m.EggBusterContainer }))
);
const SheepStampedeContainer = lazy(() =>
  import('../games/sheep-stampede/SheepStampedeContainer').then((m) => ({ default: m.SheepStampedeContainer }))
);
const HorseshoeTwistContainer = lazy(() =>
  import('../games/horseshoe-twist/HorseshoeTwistContainer').then((m) => ({ default: m.HorseshoeTwistContainer }))
);
const DuckHuntClassicContainer = lazy(() =>
  import('../games/duck-hunt-classic/DuckHuntClassicContainer').then((m) => ({ default: m.DuckHuntClassicContainer }))
);
const FarmMahjongContainer = lazy(() =>
  import('../games/farm-mahjong/FarmMahjongContainer').then((m) => ({ default: m.FarmMahjongContainer }))
);
const PetMemoryMatchContainer = lazy(() =>
  import('../games/pet-memory-match/PetMemoryMatchContainer').then((m) => ({ default: m.PetMemoryMatchContainer }))
);
const BarnyardTowerContainer = lazy(() =>
  import('../games/barnyard-tower/BarnyardTowerContainer').then((m) => ({ default: m.BarnyardTowerContainer }))
);
const GopherGardenContainer = lazy(() =>
  import('../games/gopher-garden/GopherGardenContainer').then((m) => ({ default: m.GopherGardenContainer }))
);
const FarmFruitBubbleContainer = lazy(() =>
  import('../games/farm-fruit-bubble/FarmFruitBubbleContainer').then((m) => ({ default: m.FarmFruitBubbleContainer }))
);
const PastureSheepJumpContainer = lazy(() =>
  import('../games/pasture-sheep-jump/PastureSheepJumpContainer').then((m) => ({ default: m.PastureSheepJumpContainer }))
);
const HungryPiggyContainer = lazy(() =>
  import('../games/hungry-piggy/HungryPiggyContainer').then((m) => ({ default: m.HungryPiggyContainer }))
);
const DuckPondSortContainer = lazy(() =>
  import('../games/duck-pond-sort/DuckPondSortContainer').then((m) => ({ default: m.DuckPondSortContainer }))
);
const HamsterBallDashContainer = lazy(() =>
  import('../games/hamster-ball-dash/HamsterBallDashContainer').then((m) => ({ default: m.HamsterBallDashContainer }))
);
const CatCafeRushContainer = lazy(() =>
  import('../games/cat-cafe-rush/CatCafeRushContainer').then((m) => ({ default: m.CatCafeRushContainer }))
);
const SaveTheSheepContainer = lazy(() =>
  import('../games/save-the-sheep/SaveTheSheepContainer').then((m) => ({ default: m.SaveTheSheepContainer }))
);
const CapybaraSpaRushContainer = lazy(() =>
  import('../games/capybara-spa-rush/CapybaraSpaRushContainer').then((m) => ({ default: m.CapybaraSpaRushContainer }))
);
const WoodNutsFarmContainer = lazy(() =>
  import('../games/wood-nuts-farm/WoodNutsFarmContainer').then((m) => ({ default: m.WoodNutsFarmContainer }))
);
const AnimalSuikaDropContainer = lazy(() =>
  import('../games/animal-suika-drop/AnimalSuikaDropContainer').then((m) => ({ default: m.AnimalSuikaDropContainer }))
);
const FarmTileTripleContainer = lazy(() =>
  import('../games/farm-tile-triple/FarmTileTripleContainer').then((m) => ({ default: m.FarmTileTripleContainer }))
);
const FarmPipeFlowContainer = lazy(() =>
  import('../games/farm-pipe-flow/FarmPipeFlowContainer').then((m) => ({ default: m.FarmPipeFlowContainer }))
);
const KoiPondZenContainer = lazy(() =>
  import('../games/koi-pond-zen/KoiPondZenContainer').then((m) => ({ default: m.KoiPondZenContainer }))
);
const BarnyardPinPullContainer = lazy(() =>
  import('../games/barnyard-pin-pull/BarnyardPinPullContainer').then((m) => ({ default: m.BarnyardPinPullContainer }))
);
const HamsterCookieStackContainer = lazy(() =>
  import('../games/hamster-cookie-stack/HamsterCookieStackContainer').then((m) => ({ default: m.HamsterCookieStackContainer }))
);
const BarnyardFruitSlicerContainer = lazy(() =>
  import('../games/barnyard-fruit-slicer/BarnyardFruitSlicerContainer').then((m) => ({ default: m.BarnyardFruitSlicerContainer }))
);
const BarnyardPegPopContainer = lazy(() =>
  import('../games/barnyard-peg-pop/BarnyardPegPopContainer').then((m) => ({ default: m.BarnyardPegPopContainer }))
);
const DuckArcheryRangeContainer = lazy(() =>
  import('../games/duck-archery-range/DuckArcheryRangeContainer').then((m) => ({ default: m.DuckArcheryRangeContainer }))
);
const CorgiMiniGolfContainer = lazy(() =>
  import('../games/corgi-mini-golf/CorgiMiniGolfContainer').then((m) => ({ default: m.CorgiMiniGolfContainer }))
);
const CaterpillarFruitTrailContainer = lazy(() =>
  import('../games/caterpillar-fruit-trail/CaterpillarFruitTrailContainer').then((m) => ({ default: m.CaterpillarFruitTrailContainer }))
);
const CarrotTargetThrowContainer = lazy(() =>
  import('../games/carrot-target-throw/CarrotTargetThrowContainer').then((m) => ({ default: m.CarrotTargetThrowContainer }))
);
const AnimalTangramFitContainer = lazy(() =>
  import('../games/animal-tangram-fit/AnimalTangramFitContainer').then((m) => ({ default: m.AnimalTangramFitContainer }))
);
const PiggyCoinPusherContainer = lazy(() =>
  import('../games/piggy-coin-pusher/PiggyCoinPusherContainer').then((m) => ({ default: m.PiggyCoinPusherContainer }))
);
const MilkBottlePlinkoContainer = lazy(() =>
  import('../games/milk-bottle-plinko/MilkBottlePlinkoContainer').then((m) => ({ default: m.MilkBottlePlinkoContainer }))
);
const FarmTriPeaksSolitaireContainer = lazy(() =>
  import('../games/farm-tripeaks-solitaire/FarmTriPeaksSolitaireContainer').then((m) => ({ default: m.FarmTriPeaksSolitaireContainer }))
);
const SheepSorterGateContainer = lazy(() =>
  import('../games/sheep-sorter-gate/SheepSorterGateContainer').then((m) => ({ default: m.SheepSorterGateContainer }))
);
const BarnyardPinballContainer = lazy(() =>
  import('../games/barnyard-pinball/BarnyardPinballContainer').then((m) => ({ default: m.BarnyardPinballContainer }))
);
const CropMowerHarvestContainer = lazy(() =>
  import('../games/crop-mower-harvest/CropMowerHarvestContainer').then((m) => ({ default: m.CropMowerHarvestContainer }))
);
const HamsterMazeRunnerContainer = lazy(() =>
  import('../games/hamster-maze-runner/HamsterMazeRunnerContainer').then((m) => ({ default: m.HamsterMazeRunnerContainer }))
);
const ChickenEggCatcherContainer = lazy(() =>
  import('../games/chicken-egg-catcher/ChickenEggCatcherContainer').then((m) => ({ default: m.ChickenEggCatcherContainer }))
);
const PiggyMudWashContainer = lazy(() =>
  import('../games/piggy-mud-wash/PiggyMudWashContainer').then((m) => ({ default: m.PiggyMudWashContainer }))
);
const BarnyardBrickBreakerContainer = lazy(() =>
  import('../games/barnyard-brick-breaker/BarnyardBrickBreakerContainer').then((m) => ({ default: m.BarnyardBrickBreakerContainer }))
);
const DuckWaterSlideContainer = lazy(() =>
  import('../games/duck-water-slide/DuckWaterSlideContainer').then((m) => ({ default: m.DuckWaterSlideContainer }))
);
const BunnyHopCrossContainer = lazy(() =>
  import('../games/bunny-hop-cross/BunnyHopCrossContainer').then((m) => ({ default: m.BunnyHopCrossContainer }))
);
const FarmBobaTeaContainer = lazy(() =>
  import('../games/farm-boba-tea/FarmBobaTeaContainer').then((m) => ({ default: m.FarmBobaTeaContainer }))
);
const BarnyardIceCreamContainer = lazy(() =>
  import('../games/barnyard-ice-cream/BarnyardIceCreamContainer').then((m) => ({ default: m.BarnyardIceCreamContainer }))
);
const BarnyardKartDriftContainer = lazy(() =>
  import('../games/barnyard-kart-drift/BarnyardKartDriftContainer').then((m) => ({ default: m.BarnyardKartDriftContainer }))
);
const PiggyCannonBlastContainer = lazy(() =>
  import('../games/piggy-cannon-blast/PiggyCannonBlastContainer').then((m) => ({ default: m.PiggyCannonBlastContainer }))
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
  const isPiggyCannon = gameId === 'piggy-cannon-blast' || gameId === 'piggy-launch' || gameId === 'cannon-blast';
  const isBarnyardKart = gameId === 'barnyard-kart-drift' || gameId === 'kart-drift' || gameId === 'tractor-grand-prix';
  const isBarnyardIceCream = gameId === 'barnyard-ice-cream' || gameId === 'ice-cream' || gameId === 'scoop-stack';
  const isFarmBoba = gameId === 'farm-boba-tea' || gameId === 'boba-tea' || gameId === 'boba-cafe';
  const isBunnyHop = gameId === 'bunny-hop-cross' || gameId === 'bunny-hop' || gameId === 'road-cross';
  const isWaterSlide = gameId === 'duck-water-slide' || gameId === 'water-slide' || gameId === 'splash-rush';
  const isBrickBreaker = gameId === 'barnyard-brick-breaker' || gameId === 'brick-breaker' || gameId === 'breakout';
  const isPiggyMudWash = gameId === 'piggy-mud-wash' || gameId === 'mud-wash' || gameId === 'pig-wash';
  const isEggCatcher = gameId === 'chicken-egg-catcher' || gameId === 'egg-catcher';
  const isHamsterMaze = gameId === 'hamster-maze-runner' || gameId === 'hamster-maze' || gameId === 'nut-escape';
  const isCropMower = gameId === 'crop-mower-harvest' || gameId === 'crop-mower' || gameId === 'lawn-mower';
  const isPinball = gameId === 'barnyard-pinball' || gameId === 'pinball' || gameId === 'flipper';
  const isSheepSorter = gameId === 'sheep-sorter-gate' || gameId === 'sheep-sorter' || gameId === 'sheep-gate';
  const isTriPeaks = gameId === 'farm-tripeaks-solitaire' || gameId === 'tripeaks' || gameId === 'solitaire';
  const isMilkPlinko = gameId === 'milk-bottle-plinko' || gameId === 'milk-plinko' || gameId === 'plinko';
  const isCoinPusher = gameId === 'piggy-coin-pusher' || gameId === 'coin-pusher' || gameId === 'coin-dozer';
  const isTangram = gameId === 'animal-tangram-fit' || gameId === 'tangram' || gameId === 'wood-fit';
  const isCarrotTarget = gameId === 'carrot-target-throw' || gameId === 'carrot-target' || gameId === 'knife-hit';
  const isCaterpillar = gameId === 'caterpillar-fruit-trail' || gameId === 'caterpillar' || gameId === 'snake';
  const isMiniGolf = gameId === 'corgi-mini-golf' || gameId === 'mini-golf' || gameId === 'golf';
  const isDuckArchery = gameId === 'duck-archery-range' || gameId === 'duck-archery' || gameId === 'archery';
  const isPegPop = gameId === 'barnyard-peg-pop' || gameId === 'peg-pop' || gameId === 'peggle';
  const isFruitSlicer = gameId === 'barnyard-fruit-slicer' || gameId === 'fruit-slicer' || gameId === 'fruit-ninja';
  const isCookieStack = gameId === 'hamster-cookie-stack' || gameId === 'cookie-stack' || gameId === 'bakery-tower';
  const isPinPull = gameId === 'barnyard-pin-pull' || gameId === 'pin-pull' || gameId === 'pull-the-pin';
  const isKoiPond = gameId === 'koi-pond-zen' || gameId === 'koi-pond' || gameId === 'zen-pond';
  const isFarmPipeFlow = gameId === 'farm-pipe-flow' || gameId === 'pipe-flow' || gameId === 'plumber';
  const isFarmTileTriple = gameId === 'farm-tile-triple' || gameId === 'tile-triple' || gameId === 'triple-match';
  const isAnimalSuika = gameId === 'animal-suika-drop' || gameId === 'suika-game' || gameId === 'watermelon-merge';
  const isWoodNuts = gameId === 'wood-nuts-farm' || gameId === 'wood-nuts' || gameId === 'screw-puzzle';
  const isCapybaraSpa = gameId === 'capybara-spa-rush' || gameId === 'capybara-spa';
  const isSaveTheSheep = gameId === 'save-the-sheep' || gameId === 'save-sheep';
  const isCatCafe = gameId === 'cat-cafe-rush';
  const isHamsterBall = gameId === 'hamster-ball-dash' || gameId === 'tube-roll';
  const isDuckPond = gameId === 'duck-pond-sort' || gameId === 'duck-sort' || gameId === 'water-sort';
  const isHungryPiggy = gameId === 'hungry-piggy' || gameId === 'piggy-chomper' || gameId === 'farm-hole';
  const isFruitBubble = gameId === 'farm-fruit-bubble' || gameId === 'fruit-bubble' || gameId === 'bubble-shooter';
  const isSheepJump = gameId === 'pasture-sheep-jump' || gameId === 'sheep-jump' || gameId === 'doodle-jump';
  const isBarnyardTower = gameId === 'barnyard-tower' || gameId === 'animal-stack';
  const isGopherGarden = gameId === 'gopher-garden' || gameId === 'whack-a-mole';
  const isMahjong = gameId === 'farm-mahjong' || gameId === 'mahjong' || gameId === 'farm-mahjong-solitaire';
  const isMemoryMatch = gameId === 'pet-memory-match' || gameId === 'memory-match' || gameId === 'card-match';
  const isDuckHunt = gameId === 'duck-hunt-classic' || gameId === 'duck-hunt' || gameId === 'retro-duck-hunt';
  const isSheepStampede = gameId === 'sheep-stampede' || gameId === 'mob-control' || gameId === 'colony-flow';
  const isHorseshoeTwist = gameId === 'horseshoe-twist' || gameId === 'rotate-rings' || gameId === 'ring-unlock';
  const isEggBuster = gameId === 'egg-buster' || gameId === 'royal-smash' || gameId === 'smash-fest';
  const isCritterTap = gameId === 'critter-tap-away' || gameId === 'tap-away';
  const isPantrySort = gameId === 'farm-pantry-sort' || gameId === 'goods-sort';
  const isBlockBlast = gameId === 'farm-block-blast';
  const isSheepJam = gameId === 'sheep-cart-jam';
  const isSandFall = gameId === 'grain-sand-fall';
  const isFarmMart = gameId === 'farm-mini-mart';
  const isDuckRunner = gameId === 'duck-runner';
  const isPetCrush = gameId === 'pet-candy-crush';
  const isFlappy = gameId === 'flappy-chicken';
  const is2048 = gameId === 'animal-2048';
  const isFarmTetris = gameId === 'farm-tetris';
  const isChefRat = gameId === 'chef-rat-rush';
  const isCat = gameId === 'cat-parking';
  const isFarm = gameId === 'animal-farm-parking';
  const game = GAMES_REGISTRY.find(g => g.id === gameId) || GAMES_REGISTRY[0]!;
  const relatedGames = GAMES_REGISTRY.filter(g => g.id !== gameId && g.status === 'playable').slice(0, 4);

  // Curated lists for Poki / CrazyGames desktop sidebar theater (1920x1080 bounce prevention)
  const desktopTrendingGames = GAMES_REGISTRY.filter(g =>
    g.id !== gameId && ['farm-block-blast', 'barnyard-pinball', 'farm-mini-mart', 'milk-bottle-plinko'].includes(g.id)
  ).slice(0, 4);

  const desktopPuzzleGames = GAMES_REGISTRY.filter(g =>
    g.id !== gameId && ['sheep-cart-jam', 'crop-mower-harvest', 'hamster-maze-runner', 'grain-sand-fall', 'animal-suika-drop'].includes(g.id)
  ).slice(0, 4);

  // Pre-game Intro / How to Play modal state (always opens on first entry)
  const [isIntroOpen, setIsIntroOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`pawcade_intro_seen_${gameId}`) !== 'true';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      const seen = localStorage.getItem(`pawcade_intro_seen_${gameId}`) === 'true';
      setIsIntroOpen(!seen);
    } catch {
      setIsIntroOpen(true);
    }
  }, [gameId]);

  useEffect(() => {
    window.scrollTo(0, 0);
    analytics.track('game_loaded', { gameId });

    // Auto-scroll on short viewports (GA4 800x600 & 1280x720 bounce prevention)
    if (typeof window !== 'undefined' && window.innerHeight <= 760) {
      setTimeout(() => {
        const frame = document.getElementById('playable-game-frame');
        if (frame) {
          frame.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 120);
    }

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
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 pb-16 pb-safe">
      {/* Breadcrumb Header */}
      <div className="bg-slate-900/90 border-b border-orange-500/20 py-2 sm:py-3 px-3 sm:px-6 lg:px-8 short-screen-compact">
        <div className="max-w-7xl mx-auto flex items-center text-xs font-semibold text-slate-400 gap-1.5 overflow-x-auto scrollbar-none">
          <button onClick={() => navigate('/')} className="hover:text-orange-300 transition-colors cursor-pointer shrink-0 flex items-center gap-1">
            <span>🎃 Home</span>
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-orange-500/60 shrink-0" />
          <button onClick={() => navigate(`/category/${game.category.toLowerCase()}/`)} className="hover:text-orange-300 transition-colors cursor-pointer shrink-0">
            {game.category.toUpperCase()}
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-orange-500/60 shrink-0" />
          <span className="text-orange-400 font-bold truncate">{game.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 pt-3 sm:pt-8 w-full">
        {/* Halloween Live Event Banner */}
        <div className="mb-4 sm:mb-6 bg-gradient-to-r from-orange-600 via-purple-700 to-amber-600 rounded-2xl p-3 sm:p-4 text-white flex items-center justify-between shadow-lg shadow-orange-950/40 border border-orange-400/40 short-screen-hide">
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 mb-3 sm:mb-6 px-1 short-screen-condense-title">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                isPiggyCannon
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  : isBarnyardKart
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isBarnyardIceCream
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isFarmBoba
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isBunnyHop
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isWaterSlide
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  : isBrickBreaker
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : isPiggyMudWash
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  : isEggCatcher
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isHamsterMaze
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isCaterpillar
                  ? 'bg-lime-500/20 text-lime-300 border-lime-500/30'
                  : isMiniGolf
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isDuckArchery
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isPegPop
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isFruitSlicer
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isCookieStack
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isPinPull
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isKoiPond
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  : isFarmPipeFlow
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : isFarmTileTriple
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isAnimalSuika
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isMahjong
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isMemoryMatch
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                  : isDuckHunt
                  ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                  : isSheepStampede
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : isHorseshoeTwist
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isEggBuster
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isBlockBlast
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isSheepJam
                  ? 'bg-pink-500/20 text-pink-300 border-pink-500/30'
                  : isSandFall
                  ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
                  : isChefRat
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  : isFarmMart
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
                {game.badge || game.title}
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

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsIntroOpen(true)}
              aria-label="Open How to Play guide"
              className="px-4 py-2.5 min-h-[44px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-400/25 transform hover:scale-103 active:scale-97 transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span>How to Play</span>
            </button>
          </div>
        </div>

        {/* The Playable Game Frame with Desktop Theater Rails (1920x1080 Poki/CrazyGames Style) */}
        <div className="xl:flex xl:items-start xl:justify-center xl:gap-6 w-full mb-8 sm:mb-12">
          {/* DESKTOP THEATER: LEFT SIDEBAR (Trending Games) */}
          <aside className="hidden xl:flex flex-col gap-3 w-[210px] 2xl:w-[240px] shrink-0 select-none">
            <div className="flex items-center gap-2 px-1">
              <span className="text-base select-none">🔥</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Trending Hits</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {desktopTrendingGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate(g.route)}
                  className="group flex items-center gap-2.5 p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-amber-500/40 transition-all text-left cursor-pointer transform hover:-translate-y-0.5 shadow-md"
                >
                  <img
                    src={g.thumbnailUrl}
                    alt={g.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700/60 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                      {g.title.split(':')[0]}
                    </h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span className="text-[10px] font-bold text-slate-400">{g.rating}</span>
                    </div>
                    <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 mt-1">
                      Play
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* CENTER COLUMN: THE GAME FRAME & DESKTOP KEYBOARD STRIP */}
          <div className="flex-1 min-w-0 max-w-full">
            <div
              id="playable-game-frame"
              className="bg-slate-900/90 rounded-2xl sm:rounded-3xl p-1 sm:p-6 border border-orange-500/30 mb-3 sm:mb-4 shadow-2xl shadow-orange-950/20 flex justify-center overflow-hidden short-screen-game-frame"
            >
              <Suspense
                fallback={
                  <GameLoadingFallback
                    title={game.title}
                    mascot={
                      isPiggyCannon
                        ? '🚀🐷'
                        : isBarnyardKart
                        ? '🚜🏁'
                        : isBarnyardIceCream
                        ? '🍦🍨'
                        : isFarmBoba
                        ? '🧋🐮'
                        : isBunnyHop
                        ? '🐰🥕'
                        : isWaterSlide
                        ? '🦆🌊'
                        : isBrickBreaker
                        ? '🍎🧱'
                        : isPiggyMudWash
                        ? '🐷🧼'
                        : isEggCatcher
                        ? '🐔🥚'
                        : isHamsterMaze
                        ? '🐹🌰'
                        : isCaterpillar
                        ? '🐛🍎'
                        : isMiniGolf
                        ? '🐶⛳'
                        : isDuckArchery
                        ? '🎯🦆'
                        : isPegPop
                        ? '🌰🎯'
                        : isFruitSlicer
                        ? '🍉⚔️'
                        : isCookieStack
                        ? '🐹🍪'
                        : isPinPull
                        ? '🚜📌'
                        : isKoiPond
                        ? '🎏🌸'
                        : isFarmPipeFlow
                        ? '🚜💧'
                        : isFarmTileTriple
                        ? '🧺🍎'
                        : isAnimalSuika
                        ? '🍉🐾'
                        : isWoodNuts
                        ? '🔩🚜'
                        : isCapybaraSpa
                        ? '🍊🛁'
                        : isSaveTheSheep
                        ? '🐝🐑'
                        : isCatCafe
                        ? '🐱🍰'
                        : isHamsterBall
                        ? '🐹⚡'
                        : isDuckPond
                        ? '🦆🌸'
                        : isHungryPiggy
                        ? '🐷🍎'
                        : isFruitBubble
                        ? '🍎🎈'
                        : isSheepJump
                        ? '🐑☁️'
                        : isBarnyardTower
                        ? '🐮🏗️'
                        : isGopherGarden
                        ? '🥕🐾'
                        : isMahjong
                        ? '🀄'
                        : isMemoryMatch
                        ? '🃏'
                        : isDuckHunt
                        ? '🦆🎯'
                        : isSheepStampede
                        ? '🐕'
                        : isHorseshoeTwist
                        ? '🐴'
                        : isEggBuster
                        ? '🐥'
                        : isCritterTap
                        ? '🐮'
                        : isPantrySort
                        ? '🐿️'
                        : isBlockBlast
                        ? '🐶'
                        : isSheepJam
                        ? '🐑'
                        : isSandFall
                        ? '⏳'
                        : isChefRat
                        ? '🐭'
                        : isFarmMart
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
                {isPiggyCannon ? (
                  <PiggyCannonBlastContainer />
                ) : isBarnyardKart ? (
                  <BarnyardKartDriftContainer />
                ) : isBarnyardIceCream ? (
                  <BarnyardIceCreamContainer />
                ) : isFarmBoba ? (
                  <FarmBobaTeaContainer />
                ) : isBunnyHop ? (
                  <BunnyHopCrossContainer />
                ) : isWaterSlide ? (
                  <DuckWaterSlideContainer />
                ) : isBrickBreaker ? (
                  <BarnyardBrickBreakerContainer />
                ) : isPiggyMudWash ? (
                  <PiggyMudWashContainer />
                ) : isEggCatcher ? (
                  <ChickenEggCatcherContainer />
                ) : isHamsterMaze ? (
                  <HamsterMazeRunnerContainer />
                ) : isCropMower ? (
                  <CropMowerHarvestContainer />
                ) : isPinball ? (
                  <BarnyardPinballContainer />
                ) : isSheepSorter ? (
                  <SheepSorterGateContainer />
                ) : isTriPeaks ? (
                  <FarmTriPeaksSolitaireContainer />
                ) : isMilkPlinko ? (
                  <MilkBottlePlinkoContainer />
                ) : isCoinPusher ? (
                  <PiggyCoinPusherContainer />
                ) : isTangram ? (
                  <AnimalTangramFitContainer />
                ) : isCarrotTarget ? (
                  <CarrotTargetThrowContainer />
                ) : isCaterpillar ? (
                  <CaterpillarFruitTrailContainer />
                ) : isMiniGolf ? (
                  <CorgiMiniGolfContainer />
                ) : isDuckArchery ? (
                  <DuckArcheryRangeContainer />
                ) : isPegPop ? (
                  <BarnyardPegPopContainer />
                ) : isFruitSlicer ? (
                  <BarnyardFruitSlicerContainer />
                ) : isCookieStack ? (
                  <HamsterCookieStackContainer />
                ) : isPinPull ? (
                  <BarnyardPinPullContainer />
                ) : isKoiPond ? (
                  <KoiPondZenContainer />
                ) : isFarmPipeFlow ? (
                  <FarmPipeFlowContainer />
                ) : isFarmTileTriple ? (
                  <FarmTileTripleContainer />
                ) : isAnimalSuika ? (
                  <AnimalSuikaDropContainer />
                ) : isWoodNuts ? (
                  <WoodNutsFarmContainer />
                ) : isCapybaraSpa ? (
                  <CapybaraSpaRushContainer />
                ) : isSaveTheSheep ? (
                  <SaveTheSheepContainer />
                ) : isCatCafe ? (
                  <CatCafeRushContainer />
                ) : isHamsterBall ? (
                  <HamsterBallDashContainer />
                ) : isDuckPond ? (
                  <DuckPondSortContainer />
                ) : isHungryPiggy ? (
                  <HungryPiggyContainer />
                ) : isFruitBubble ? (
                  <FarmFruitBubbleContainer />
                ) : isSheepJump ? (
                  <PastureSheepJumpContainer />
                ) : isBarnyardTower ? (
                  <BarnyardTowerContainer />
                ) : isGopherGarden ? (
                  <GopherGardenContainer />
                ) : isMahjong ? (
                  <FarmMahjongContainer />
                ) : isMemoryMatch ? (
                  <PetMemoryMatchContainer />
                ) : isDuckHunt ? (
                  <DuckHuntClassicContainer />
                ) : isSheepStampede ? (
                  <SheepStampedeContainer />
                ) : isHorseshoeTwist ? (
                  <HorseshoeTwistContainer />
                ) : isEggBuster ? (
                  <EggBusterContainer />
                ) : isCritterTap ? (
                  <CritterTapAwayContainer />
                ) : isPantrySort ? (
                  <FarmPantrySortContainer />
                ) : isBlockBlast ? (
                  <FarmBlockBlastContainer />
                ) : isSheepJam ? (
                  <SheepCartJamContainer />
                ) : isSandFall ? (
                  <GrainSandFallContainer />
                ) : isChefRat ? (
                  <ChefRatRushContainer />
                ) : isFarmMart ? (
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

            {/* Desktop Keyboard Quick Keycaps Strip */}
            <div className="hidden sm:flex items-center justify-center gap-3 py-2 px-4 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs font-semibold select-none">
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[11px] font-bold">W A S D</kbd>
                <span>/</span>
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[11px] font-bold">Arrows</kbd>
                <span className="text-slate-400">Move</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[11px] font-bold">Space</kbd>
                <span className="text-slate-400">Action</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[11px] font-bold">R</kbd>
                <span className="text-slate-400">Restart</span>
              </div>
              <span className="text-slate-700">•</span>
              <div className="flex items-center gap-1.5">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono text-[11px] font-bold">M</kbd>
                <span className="text-slate-400">Audio</span>
              </div>
            </div>
          </div>

          {/* DESKTOP THEATER: RIGHT SIDEBAR (Quick Play Games) */}
          <aside className="hidden xl:flex flex-col gap-3 w-[210px] 2xl:w-[240px] shrink-0 select-none">
            <div className="flex items-center gap-2 px-1">
              <span className="text-base select-none">🌟</span>
              <h3 className="text-xs font-black uppercase tracking-wider text-amber-400">Quick Play</h3>
            </div>
            <div className="flex flex-col gap-2.5">
              {desktopPuzzleGames.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate(g.route)}
                  className="group flex items-center gap-2.5 p-2 rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800/80 hover:border-amber-500/40 transition-all text-left cursor-pointer transform hover:-translate-y-0.5 shadow-md"
                >
                  <img
                    src={g.thumbnailUrl}
                    alt={g.title}
                    className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-700/60 group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-black text-white truncate group-hover:text-amber-300 transition-colors">
                      {g.title.split(':')[0]}
                    </h4>
                    <span className="text-[10px] text-slate-400 truncate block mt-0.5 capitalize">{g.category}</span>
                    <span className="inline-block text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 mt-1">
                      Instant
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </aside>
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
              {isEggCatcher ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">Left/Right Arrow Keys</kbd> or <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">A/D</kbd> to slide your straw basket across the barn floor. Catch white, speckled, and golden star eggs to build combo streaks. Dodge green rotten eggs—catching one deducts a heart! Press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">Spacebar</kbd> or <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">R</kbd> to restart, and <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">M</kbd> to toggle audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Mobile:</span>
                    <span>Touch and drag your thumb anywhere on the screen for instant basket tracking! Or tap the large bottom <strong>Slide Left</strong> and <strong>Slide Right</strong> buttons.</span>
                  </div>
                </>
              ) : isHamsterMaze ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">Arrow Keys</kbd> or <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">W/A/S/D</kbd> to steer Pip through the wooden maze. Munch all golden acorns, pick up the brass key, unlock the locked gate, and enter the exit door! Press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">Spacebar</kbd> to advance or restart, <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">R</kbd> to restart current stage, and <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">M</kbd> to toggle audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Mobile:</span>
                    <span>Swipe in any direction across the maze, or tap the large bottom D-Pad arrows (Up, Down, Left, Right) for responsive thumb steering!</span>
                  </div>
                </>
              ) : isFarmPipeFlow ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-sky-400 min-w-24">Desktop:</span>
                    <span>Left-click any pipe tile on the grid to rotate it 90 degrees clockwise. Align pipes from the red pump station to all thirsty garden vegetable patches and animal troughs! Press <kbd className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-sky-500/30">U</kbd> to undo, <kbd className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-sky-500/30">R</kbd> to restart, and <kbd className="bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded text-xs font-mono border border-sky-500/30">M</kbd> to toggle audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-sky-400 min-w-24">Mobile:</span>
                    <span>Tap any pipe segment to rotate 90 degrees. Watch glowing water surge through connected pipes until all crops are watered!</span>
                  </div>
                </>
              ) : isFarmTileTriple ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Desktop:</span>
                    <span>Left-click any unblocked crop tile on the board to move it into your 7-slot bottom tray. Collect 3 matching tiles to clear them and score 300 points! Press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">U</kbd> to undo a move, <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">S</kbd> to shuffle, <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">R</kbd> to restart, and <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">M</kbd> to toggle audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Mobile:</span>
                    <span>Tap any unblocked tile to send it into your holding tray. Clear all crops in triplets before your 7 tray slots fill up!</span>
                  </div>
                </>
              ) : isAnimalSuika ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400 min-w-24">Desktop:</span>
                    <span>Move and drag your mouse along the top rail to aim your animal. Left click or release mouse to drop into the puzzle container! Watch matching animals merge and grow. Press <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">R</kbd> to restart, and <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">M</kbd> to toggle Web Audio chimes.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400 min-w-24">Mobile:</span>
                    <span>Touch and drag your finger left or right along the top to aim the drop guide. Lift your finger to drop! Keep animal stacks below the red danger line.</span>
                  </div>
                </>
              ) : isSheepStampede ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">Arrow Keys</kbd> or <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">A/D</kbd> to steer Buster and your flock left and right. Aim for blue math multiplier gates (x2, x3, +20) and steer clear of mud pits and shearers. Press <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">Spacebar</kbd> to start/rush, <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">R</kbd> to restart, and <kbd className="bg-slate-800 text-emerald-300 px-1.5 py-0.5 rounded text-xs font-mono border border-emerald-500/30">M</kbd> to mute audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-emerald-400 min-w-24">Mobile:</span>
                    <span>Drag your finger left and right across the meadow track to steer your herd! Or tap the on-screen <strong>STEER LEFT</strong> / <strong>STEER RIGHT</strong> buttons. Rescue your flock into the red barn corral!</span>
                  </div>
                </>
              ) : isHorseshoeTwist ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Desktop:</span>
                    <span>Click and drag concentric rings around the vault dial to rotate. Or press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">1</kbd> to <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">4</kbd> to select a ring and use <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">Left/Right Arrow Keys</kbd> or <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">A/D</kbd> to rotate it 30 degrees. Align all notches with the green exit ray to pop the lock! Press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">R</kbd> to restart and <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">M</kbd> to mute.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Mobile:</span>
                    <span>Touch and spin the circular rings around the vault center! Or tap the Ring tabs and use the large <strong>ROTATE CCW</strong> / <strong>ROTATE CW</strong> buttons to line up all notches.</span>
                  </div>
                </>
              ) : isEggBuster ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Desktop:</span>
                    <span>Click and drag back on the wooden slingshot to aim and power your shot. Release mouse to launch the egg! Use bounces off walls and metal cans to demolish obstacles. Press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">R</kbd> to restart the stage, and <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">M</kbd> to toggle physics audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Mobile:</span>
                    <span>Touch and drag the slingshot pouch backwards with live dotted trajectory line. Release your finger to launch! Knock down all sneaky foxes to pass.</span>
                  </div>
                </>
              ) : isBlockBlast ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Desktop:</span>
                    <span>Click any wooden crop piece in the barn tray, then click an empty cell on the 8x8 grid to place it. You can also drag & drop pieces directly with your mouse. Press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">R</kbd> or <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">Spacebar</kbd> to restart, and press <kbd className="bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded text-xs font-mono border border-amber-500/30">M</kbd> to toggle banjo sounds.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-amber-400 min-w-24">Mobile:</span>
                    <span>Tap to select a block from the barn tray, then tap any valid grid cell to place it. Or drag the piece directly with tactile ghost placement preview!</span>
                  </div>
                </>
              ) : isSheepJam ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-pink-400 min-w-24">Desktop:</span>
                    <span>Click any unblocked tractor cart to drive it from the farmyard maze to the station loading dock. Press <kbd className="bg-slate-800 text-pink-300 px-1.5 py-0.5 rounded text-xs font-mono border border-pink-500/30">R</kbd> to restart the level, and press <kbd className="bg-slate-800 text-pink-300 px-1.5 py-0.5 rounded text-xs font-mono border border-pink-500/30">M</kbd> to toggle sheep audio.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-pink-400 min-w-24">Mobile:</span>
                    <span>Tap any unblocked tractor cart to send it to an open station dock bay. Matching sheep in the front of the queue automatically board!</span>
                  </div>
                </>
              ) : isSandFall ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-yellow-400 min-w-24">Desktop:</span>
                    <span>Use <kbd className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-yellow-500/30">Arrow Keys</kbd> or <kbd className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-yellow-500/30">A/D</kbd> to steer the falling crop block left and right. Press <kbd className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-yellow-500/30">↑</kbd> or <kbd className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-yellow-500/30">W</kbd> to rotate, <kbd className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-yellow-500/30">↓</kbd> to soft drop, and <kbd className="bg-slate-800 text-yellow-300 px-1.5 py-0.5 rounded text-xs font-mono border border-yellow-500/30">Spacebar</kbd> for instant hard drop slam.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-yellow-400 min-w-24">Mobile:</span>
                    <span>Use on-screen thumb buttons: <strong>◀ / ▶</strong> to steer across the silo, <strong>⟳</strong> to rotate, and <strong>▼</strong> for instant hard drop into the sand bed.</span>
                  </div>
                </>
              ) : isChefRat ? (
                <>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Desktop:</span>
                    <span>Use number keys <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">1</kbd> to <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">8</kbd> to rapidly chop pantry ingredients onto the wooden cutting board. Press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">C</kbd> to cook hot stews on the stove, press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">X</kbd> to clear the board, and press <kbd className="bg-slate-800 text-orange-300 px-1.5 py-0.5 rounded text-xs font-mono border border-orange-500/30">Spacebar</kbd> to ring the brass Service Bell!</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-bold text-orange-400 min-w-24">Mobile:</span>
                    <span>Tap any pantry ingredient button (1-8) to chop on board. Tap <strong>Simmer on Stove</strong> for cookable recipes, and tap the large <strong>SERVE DISH</strong> brass bell to deliver orders before customer patience expires!</span>
                  </div>
                </>
              ) : isFarmMart ? (
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
              {isBlockBlast ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Fit polyomino crop pieces on the 8x8 rustic wooden board from the 3 barn tray slots.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Complete full 8-cell rows or columns to trigger golden crop blasts and clear board space!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Clear lines on consecutive turns to build exponential <strong>Combo Streaks (2x, 3x, 4x+)</strong> accompanied by banjo arpeggios and Barnaby pup barks!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Always preserve open 3x3 square granary pockets so giant shapes don't force a sudden game over.</span>
                  </li>
                </>
              ) : isSheepJam ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Unblock colored tractor hay carts from the farmyard maze that have a clear path to the meadow exit.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Guide carts into the 3 station loading bays. Fluffy sheep at the front of the queue automatically hop into matching colored carts!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>When a cart fills to <strong>capacity (3/3)</strong>, it departs with a cheerful toot-toot, opening its bay for the next cart.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                    <span>Avoid filling all 3 dock bays with colors that don't match the front sheep, or the station will jam!</span>
                  </li>
                </>
              ) : isSandFall ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>Steer falling crop tetrominoes (🌽 Corn, 🍓 Cranberry, 🫐 Sky Berry, 🍀 Clover) into position inside the silo.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>Watch blocks instantly dissolve into physical grains of sand that cascade and roll into dunes upon landing.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>Connect a continuous, unbroken path of the same color from the <strong>left wall to the right wall</strong> to melt the sand for huge bonus points!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                    <span>Keep sand levels low—if grains pile up to the top rim of the silo, it's game over!</span>
                  </li>
                </>
              ) : isChefRat ? (
                <>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Check incoming customer order tickets on the top brass rail to see what dish they desire and their patience timer!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Chop required ingredients from the pantry: 🍆 Eggplants, 🍅 Tomatoes, 🥒 Zucchini, 🧀 Swiss Cheese, 🥖 Baguettes, 🍓 Fresh Berries, 🥐 Croissants, and 🥬 Lettuce.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Cold dishes (French Cheese Baguettes, Parisian Salads, Croissant Plates) are ready instantly—ring the <strong>Service Bell 🛎️</strong> immediately!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Simmer hot dishes (Gourmet Ratatouille & Chef's Berry Crepes) on the copper stove. Watch the simmer gauge closely—ring the bell when ready before it burns!</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>Deliver orders while customer patience is green for a <strong>+50% Speed Tip</strong> and build consecutive combos for 3-star shift mastery!</span>
                  </li>
                </>
              ) : isFarmMart ? (
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

        {/* UNIVERSAL PRE-GAME INTRO / HOW TO PLAY MODAL */}
        <GameIntroModal
          gameId={gameId}
          isOpen={isIntroOpen}
          onClose={() => setIsIntroOpen(false)}
        />
      </div>
    </div>
  );
};

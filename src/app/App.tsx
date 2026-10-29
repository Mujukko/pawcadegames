import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { HomePage } from './HomePage';
import { GamePage } from './GamePage';
import { NotFoundPage } from './NotFoundPage';
import { InfoPage } from './InfoPage';
import { INFO_PAGES } from '../lib/sitePages';
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
    const saveTheSheepGame = GAMES_REGISTRY.find(g => g.id === 'save-the-sheep');
    const capybaraSpaGame = GAMES_REGISTRY.find(g => g.id === 'capybara-spa-rush');
    const woodNutsGame = GAMES_REGISTRY.find(g => g.id === 'wood-nuts-farm');
    const animalSuikaGame = GAMES_REGISTRY.find(g => g.id === 'animal-suika-drop');
    const farmTileTripleGame = GAMES_REGISTRY.find(g => g.id === 'farm-tile-triple');
    const farmPipeFlowGame = GAMES_REGISTRY.find(g => g.id === 'farm-pipe-flow');
    const koiPondGame = GAMES_REGISTRY.find(g => g.id === 'koi-pond-zen');
    const barnyardPinGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-pin-pull');
    const cookieStackGame = GAMES_REGISTRY.find(g => g.id === 'hamster-cookie-stack');
    const fruitSlicerGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-fruit-slicer');
    const pegPopGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-peg-pop');
    const duckArcheryGame = GAMES_REGISTRY.find(g => g.id === 'duck-archery-range');
    const corgiGolfGame = GAMES_REGISTRY.find(g => g.id === 'corgi-mini-golf');
    const caterpillarGame = GAMES_REGISTRY.find(g => g.id === 'caterpillar-fruit-trail');
    const carrotTargetGame = GAMES_REGISTRY.find(g => g.id === 'carrot-target-throw');
    const tangramGame = GAMES_REGISTRY.find(g => g.id === 'animal-tangram-fit');
    const coinPusherGame = GAMES_REGISTRY.find(g => g.id === 'piggy-coin-pusher');
    const milkPlinkoGame = GAMES_REGISTRY.find(g => g.id === 'milk-bottle-plinko');
    const triPeaksGame = GAMES_REGISTRY.find(g => g.id === 'farm-tripeaks-solitaire');
    const sheepSorterGame = GAMES_REGISTRY.find(g => g.id === 'sheep-sorter-gate');
    const pinballGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-pinball');
    const cropMowerGame = GAMES_REGISTRY.find(g => g.id === 'crop-mower-harvest');
    const hamsterMazeGame = GAMES_REGISTRY.find(g => g.id === 'hamster-maze-runner');
    const chickenEggCatcherGame = GAMES_REGISTRY.find(g => g.id === 'chicken-egg-catcher');
    const piggyMudWashGame = GAMES_REGISTRY.find(g => g.id === 'piggy-mud-wash');
    const brickBreakerGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-brick-breaker');
    const duckWaterSlideGame = GAMES_REGISTRY.find(g => g.id === 'duck-water-slide');
    const bunnyHopGame = GAMES_REGISTRY.find(g => g.id === 'bunny-hop-cross');
    const farmBobaGame = GAMES_REGISTRY.find(g => g.id === 'farm-boba-tea');
    const barnyardIceCreamGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-ice-cream');
    const barnyardKartGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-kart-drift');
    const piggyCannonGame = GAMES_REGISTRY.find(g => g.id === 'piggy-cannon-blast');
    const barnyardRopeGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-rope-cut');
    const barnyardPopcornGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-popcorn-popper');
    const barnyardWordGame = GAMES_REGISTRY.find(g => g.id === 'barnyard-word-connect');
    const crossyChickenGame = GAMES_REGISTRY.find(g => g.id === 'crossy-chicken');
    const tractorHillClimbGame = GAMES_REGISTRY.find(g => g.id === 'tractor-hill-climb');

    const infoPage = INFO_PAGES.find((p) => currentRoute === p.route || currentRoute === p.route.slice(0, -1));

    let activeTitle = 'Pawcade Games 🎮 — Free Online Browser Games (No Downloads)';
    let activeDesc = 'Play free browser games on Pawcade! Instant play casual web games, pet and farm puzzles on mobile and desktop with zero downloads.';

    const cleanRoute = currentRoute.replace(/\/$/, '');
    const matchedGame = GAMES_REGISTRY.find(
      (g) =>
        cleanRoute === g.route.replace(/\/$/, '') ||
        cleanRoute.startsWith(`/games/${g.id}`) ||
        cleanRoute.startsWith(`/games/${g.slug}`)
    );

    if (infoPage) {
      activeTitle = infoPage.metaTitle;
      activeDesc = infoPage.metaDescription;
    } else if (matchedGame) {
      activeTitle = matchedGame.metaTitle;
      activeDesc = matchedGame.metaDescription;
    } else if (currentRoute.startsWith('/games/tractor-hill-climb') || currentRoute.startsWith('/games/hill-climb') || currentRoute.startsWith('/games/tractor-climb')) {
      if (tractorHillClimbGame) {
        activeTitle = tractorHillClimbGame.metaTitle;
        activeDesc = tractorHillClimbGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/crossy-chicken') || currentRoute.startsWith('/games/crossy-road') || currentRoute.startsWith('/games/chicken-cross')) {
      if (crossyChickenGame) {
        activeTitle = crossyChickenGame.metaTitle;
        activeDesc = crossyChickenGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-word-connect') || currentRoute.startsWith('/games/word-connect') || currentRoute.startsWith('/games/corgi-cross')) {
      if (barnyardWordGame) {
        activeTitle = barnyardWordGame.metaTitle;
        activeDesc = barnyardWordGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-popcorn-popper') || currentRoute.startsWith('/games/popcorn-popper') || currentRoute.startsWith('/games/popcorn-burst')) {
      if (barnyardPopcornGame) {
        activeTitle = barnyardPopcornGame.metaTitle;
        activeDesc = barnyardPopcornGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-rope-cut') || currentRoute.startsWith('/games/rope-cut') || currentRoute.startsWith('/games/cut-the-rope')) {
      if (barnyardRopeGame) {
        activeTitle = barnyardRopeGame.metaTitle;
        activeDesc = barnyardRopeGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/piggy-cannon-blast') || currentRoute.startsWith('/games/piggy-launch') || currentRoute.startsWith('/games/cannon-blast')) {
      if (piggyCannonGame) {
        activeTitle = piggyCannonGame.metaTitle;
        activeDesc = piggyCannonGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-kart-drift') || currentRoute.startsWith('/games/kart-drift') || currentRoute.startsWith('/games/tractor-grand-prix')) {
      if (barnyardKartGame) {
        activeTitle = barnyardKartGame.metaTitle;
        activeDesc = barnyardKartGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-ice-cream') || currentRoute.startsWith('/games/ice-cream') || currentRoute.startsWith('/games/scoop-stack')) {
      if (barnyardIceCreamGame) {
        activeTitle = barnyardIceCreamGame.metaTitle;
        activeDesc = barnyardIceCreamGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-boba-tea') || currentRoute.startsWith('/games/boba-tea') || currentRoute.startsWith('/games/boba-cafe')) {
      if (farmBobaGame) {
        activeTitle = farmBobaGame.metaTitle;
        activeDesc = farmBobaGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/bunny-hop-cross') || currentRoute.startsWith('/games/bunny-hop') || currentRoute.startsWith('/games/road-cross')) {
      if (bunnyHopGame) {
        activeTitle = bunnyHopGame.metaTitle;
        activeDesc = bunnyHopGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/duck-water-slide') || currentRoute.startsWith('/games/water-slide') || currentRoute.startsWith('/games/splash-rush')) {
      if (duckWaterSlideGame) {
        activeTitle = duckWaterSlideGame.metaTitle;
        activeDesc = duckWaterSlideGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-brick-breaker') || currentRoute.startsWith('/games/brick-breaker') || currentRoute.startsWith('/games/breakout')) {
      if (brickBreakerGame) {
        activeTitle = brickBreakerGame.metaTitle;
        activeDesc = brickBreakerGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/piggy-mud-wash') || currentRoute.startsWith('/games/mud-wash') || currentRoute.startsWith('/games/pig-wash')) {
      if (piggyMudWashGame) {
        activeTitle = piggyMudWashGame.metaTitle;
        activeDesc = piggyMudWashGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/chicken-egg-catcher') || currentRoute.startsWith('/games/egg-catcher')) {
      if (chickenEggCatcherGame) {
        activeTitle = chickenEggCatcherGame.metaTitle;
        activeDesc = chickenEggCatcherGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/hamster-maze-runner') || currentRoute.startsWith('/games/hamster-maze') || currentRoute.startsWith('/games/nut-escape')) {
      if (hamsterMazeGame) {
        activeTitle = hamsterMazeGame.metaTitle;
        activeDesc = hamsterMazeGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/crop-mower-harvest') || currentRoute.startsWith('/games/crop-mower') || currentRoute.startsWith('/games/lawn-mower')) {
      if (cropMowerGame) {
        activeTitle = cropMowerGame.metaTitle;
        activeDesc = cropMowerGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-pinball') || currentRoute.startsWith('/games/pinball') || currentRoute.startsWith('/games/flipper')) {
      if (pinballGame) {
        activeTitle = pinballGame.metaTitle;
        activeDesc = pinballGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/sheep-sorter-gate') || currentRoute.startsWith('/games/sheep-sorter') || currentRoute.startsWith('/games/sheep-gate')) {
      if (sheepSorterGame) {
        activeTitle = sheepSorterGame.metaTitle;
        activeDesc = sheepSorterGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-tripeaks-solitaire') || currentRoute.startsWith('/games/tripeaks') || currentRoute.startsWith('/games/solitaire')) {
      if (triPeaksGame) {
        activeTitle = triPeaksGame.metaTitle;
        activeDesc = triPeaksGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/milk-bottle-plinko') || currentRoute.startsWith('/games/milk-plinko') || currentRoute.startsWith('/games/plinko')) {
      if (milkPlinkoGame) {
        activeTitle = milkPlinkoGame.metaTitle;
        activeDesc = milkPlinkoGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/piggy-coin-pusher') || currentRoute.startsWith('/games/coin-pusher') || currentRoute.startsWith('/games/coin-dozer')) {
      if (coinPusherGame) {
        activeTitle = coinPusherGame.metaTitle;
        activeDesc = coinPusherGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/animal-tangram-fit') || currentRoute.startsWith('/games/tangram') || currentRoute.startsWith('/games/wood-fit')) {
      if (tangramGame) {
        activeTitle = tangramGame.metaTitle;
        activeDesc = tangramGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/carrot-target-throw') || currentRoute.startsWith('/games/carrot-target') || currentRoute.startsWith('/games/knife-hit')) {
      if (carrotTargetGame) {
        activeTitle = carrotTargetGame.metaTitle;
        activeDesc = carrotTargetGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/caterpillar-fruit-trail') || currentRoute.startsWith('/games/caterpillar') || currentRoute.startsWith('/games/snake')) {
      if (caterpillarGame) {
        activeTitle = caterpillarGame.metaTitle;
        activeDesc = caterpillarGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/corgi-mini-golf') || currentRoute.startsWith('/games/mini-golf') || currentRoute.startsWith('/games/golf')) {
      if (corgiGolfGame) {
        activeTitle = corgiGolfGame.metaTitle;
        activeDesc = corgiGolfGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/duck-archery-range') || currentRoute.startsWith('/games/duck-archery') || currentRoute.startsWith('/games/archery')) {
      if (duckArcheryGame) {
        activeTitle = duckArcheryGame.metaTitle;
        activeDesc = duckArcheryGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-peg-pop') || currentRoute.startsWith('/games/peg-pop') || currentRoute.startsWith('/games/peggle')) {
      if (pegPopGame) {
        activeTitle = pegPopGame.metaTitle;
        activeDesc = pegPopGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-fruit-slicer') || currentRoute.startsWith('/games/fruit-slicer') || currentRoute.startsWith('/games/fruit-ninja')) {
      if (fruitSlicerGame) {
        activeTitle = fruitSlicerGame.metaTitle;
        activeDesc = fruitSlicerGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/hamster-cookie-stack') || currentRoute.startsWith('/games/cookie-stack') || currentRoute.startsWith('/games/bakery-tower')) {
      if (cookieStackGame) {
        activeTitle = cookieStackGame.metaTitle;
        activeDesc = cookieStackGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/barnyard-pin-pull') || currentRoute.startsWith('/games/pin-pull') || currentRoute.startsWith('/games/pull-the-pin')) {
      if (barnyardPinGame) {
        activeTitle = barnyardPinGame.metaTitle;
        activeDesc = barnyardPinGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/koi-pond-zen') || currentRoute.startsWith('/games/koi-pond') || currentRoute.startsWith('/games/zen-pond')) {
      if (koiPondGame) {
        activeTitle = koiPondGame.metaTitle;
        activeDesc = koiPondGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-pipe-flow') || currentRoute.startsWith('/games/pipe-flow') || currentRoute.startsWith('/games/plumber')) {
      if (farmPipeFlowGame) {
        activeTitle = farmPipeFlowGame.metaTitle;
        activeDesc = farmPipeFlowGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/farm-tile-triple') || currentRoute.startsWith('/games/tile-triple') || currentRoute.startsWith('/games/triple-match')) {
      if (farmTileTripleGame) {
        activeTitle = farmTileTripleGame.metaTitle;
        activeDesc = farmTileTripleGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/animal-suika-drop') || currentRoute.startsWith('/games/suika-game') || currentRoute.startsWith('/games/watermelon-merge')) {
      if (animalSuikaGame) {
        activeTitle = animalSuikaGame.metaTitle;
        activeDesc = animalSuikaGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/wood-nuts-farm') || currentRoute.startsWith('/games/wood-nuts') || currentRoute.startsWith('/games/screw-puzzle')) {
      if (woodNutsGame) {
        activeTitle = woodNutsGame.metaTitle;
        activeDesc = woodNutsGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/capybara-spa-rush') || currentRoute.startsWith('/games/capybara-spa')) {
      if (capybaraSpaGame) {
        activeTitle = capybaraSpaGame.metaTitle;
        activeDesc = capybaraSpaGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/save-the-sheep') || currentRoute.startsWith('/games/save-sheep')) {
      if (saveTheSheepGame) {
        activeTitle = saveTheSheepGame.metaTitle;
        activeDesc = saveTheSheepGame.metaDescription;
      }
    } else if (currentRoute.startsWith('/games/cat-cafe-rush')) {
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
    } else if ((currentRoute.startsWith('/games/farm-animal-match') || currentRoute.startsWith('/games/pet-candy-crush') || currentRoute.startsWith('/games/farm-animal-crush')) && petCrushGame) {
      activeTitle = petCrushGame.metaTitle;
      activeDesc = petCrushGame.metaDescription;
    } else if (currentRoute.startsWith('/games/flappy-chicken') && flappyChickenGame) {
      activeTitle = flappyChickenGame.metaTitle;
      activeDesc = flappyChickenGame.metaDescription;
    } else if (currentRoute.startsWith('/games/animal-2048') && animal2048Game) {
      activeTitle = animal2048Game.metaTitle;
      activeDesc = animal2048Game.metaDescription;
    } else if ((currentRoute.startsWith('/games/farm-block-drop') || currentRoute.startsWith('/games/farm-tetris')) && farmTetrisGame) {
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
      activeTitle = 'Most Popular Free Online Games — Top Browser Hits | Pawcade';
      activeDesc = 'Play the most popular free online browser games on Pawcade! Enjoy top trending hits like Farm Mini Mart, Farm Block Blast, Dog Parking, and Duck Hunt with zero downloads.';
    } else if (currentRoute.startsWith('/category/puzzle')) {
      activeTitle = 'Free Online Puzzle Games — Brain Teasers, No Download | Pawcade';
      activeDesc = 'Play free online puzzle games with zero downloads on Pawcade! Enjoy Farm Block Blast, Sheep Cart Jam, Dog Parking, Critter Tap Away, and more.';
    } else if (currentRoute.startsWith('/category/farm')) {
      activeTitle = 'Free Online Farm Games — Barnyard Puzzles & Tycoons | Pawcade';
      activeDesc = 'Play free casual farm games online at Pawcade! Manage farm markets, drive tractors, herd sheep, and harvest crops directly in your browser.';
    } else if (currentRoute.startsWith('/category/arcade')) {
      activeTitle = 'Free Online Arcade Games — Quick Reflex & Tap Games | Pawcade';
      activeDesc = 'Enjoy free retro-style casual arcade web games on Pawcade! Tap, dodge, flap, and jump in Duck Runner, Flappy Chicken, Egg Buster, and more.';
    } else if (currentRoute.startsWith('/category/pets')) {
      activeTitle = 'Pet Games Online — Free Cute Cat & Dog Games | Pawcade';
      activeDesc = 'Play free pet games online in your browser on Pawcade! Slide corgis in Dog Parking, save cats in Cat Parking, feed cute critters, and solve cozy puzzles with no downloads.';
    } else if (currentRoute === '/' || currentRoute === '' || currentRoute === '/games' || currentRoute === '/games/') {
      activeTitle = 'Pawcade Games 🎮 — Free Online Browser Games | No Download';
      activeDesc = 'Play free casual browser games online at Pawcade! Enjoy Farm Block Blast, Sheep Cart Jam, Dog Parking, Duck Runner, Farm Animal Match, and more. Zero downloads, mobile & desktop compatible.';
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
    const infoPage = INFO_PAGES.find((p) => currentRoute === p.route || currentRoute === p.route.slice(0, -1));
    if (infoPage) {
      return <InfoPage page={infoPage} navigate={navigate} />;
    }
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
    const cleanRoute = currentRoute.replace(/\/$/, '');
    const matchedGame = GAMES_REGISTRY.find(
      (g) =>
        cleanRoute === g.route.replace(/\/$/, '') ||
        cleanRoute.startsWith(`/games/${g.id}`) ||
        cleanRoute.startsWith(`/games/${g.slug}`)
    );
    if (matchedGame) {
      return <GamePage navigate={navigate} gameId={matchedGame.id} />;
    }
    if (currentRoute.startsWith('/games/tractor-hill-climb') || currentRoute.startsWith('/games/hill-climb') || currentRoute.startsWith('/games/tractor-climb')) {
      return <GamePage navigate={navigate} gameId="tractor-hill-climb" />;
    }
    if (currentRoute.startsWith('/games/crossy-chicken') || currentRoute.startsWith('/games/crossy-road') || currentRoute.startsWith('/games/chicken-cross')) {
      return <GamePage navigate={navigate} gameId="crossy-chicken" />;
    }
    if (currentRoute.startsWith('/games/barnyard-word-connect') || currentRoute.startsWith('/games/word-connect') || currentRoute.startsWith('/games/corgi-cross')) {
      return <GamePage navigate={navigate} gameId="barnyard-word-connect" />;
    }
    if (currentRoute.startsWith('/games/barnyard-popcorn-popper') || currentRoute.startsWith('/games/popcorn-popper') || currentRoute.startsWith('/games/popcorn-burst')) {
      return <GamePage navigate={navigate} gameId="barnyard-popcorn-popper" />;
    }
    if (currentRoute.startsWith('/games/barnyard-rope-cut') || currentRoute.startsWith('/games/rope-cut') || currentRoute.startsWith('/games/cut-the-rope')) {
      return <GamePage navigate={navigate} gameId="barnyard-rope-cut" />;
    }
    if (currentRoute.startsWith('/games/piggy-cannon-blast') || currentRoute.startsWith('/games/piggy-launch') || currentRoute.startsWith('/games/cannon-blast')) {
      return <GamePage navigate={navigate} gameId="piggy-cannon-blast" />;
    }
    if (currentRoute.startsWith('/games/barnyard-kart-drift') || currentRoute.startsWith('/games/kart-drift') || currentRoute.startsWith('/games/tractor-grand-prix')) {
      return <GamePage navigate={navigate} gameId="barnyard-kart-drift" />;
    }
    if (currentRoute.startsWith('/games/barnyard-ice-cream') || currentRoute.startsWith('/games/ice-cream') || currentRoute.startsWith('/games/scoop-stack')) {
      return <GamePage navigate={navigate} gameId="barnyard-ice-cream" />;
    }
    if (currentRoute.startsWith('/games/farm-boba-tea') || currentRoute.startsWith('/games/boba-tea') || currentRoute.startsWith('/games/boba-cafe')) {
      return <GamePage navigate={navigate} gameId="farm-boba-tea" />;
    }
    if (currentRoute.startsWith('/games/bunny-hop-cross') || currentRoute.startsWith('/games/bunny-hop') || currentRoute.startsWith('/games/road-cross')) {
      return <GamePage navigate={navigate} gameId="bunny-hop-cross" />;
    }
    if (currentRoute.startsWith('/games/duck-water-slide') || currentRoute.startsWith('/games/water-slide') || currentRoute.startsWith('/games/splash-rush')) {
      return <GamePage navigate={navigate} gameId="duck-water-slide" />;
    }
    if (currentRoute.startsWith('/games/barnyard-brick-breaker') || currentRoute.startsWith('/games/brick-breaker') || currentRoute.startsWith('/games/breakout')) {
      return <GamePage navigate={navigate} gameId="barnyard-brick-breaker" />;
    }
    if (currentRoute.startsWith('/games/piggy-mud-wash') || currentRoute.startsWith('/games/mud-wash') || currentRoute.startsWith('/games/pig-wash')) {
      return <GamePage navigate={navigate} gameId="piggy-mud-wash" />;
    }
    if (currentRoute.startsWith('/games/chicken-egg-catcher') || currentRoute.startsWith('/games/egg-catcher')) {
      return <GamePage navigate={navigate} gameId="chicken-egg-catcher" />;
    }
    if (currentRoute.startsWith('/games/hamster-maze-runner') || currentRoute.startsWith('/games/hamster-maze') || currentRoute.startsWith('/games/nut-escape')) {
      return <GamePage navigate={navigate} gameId="hamster-maze-runner" />;
    }
    if (currentRoute.startsWith('/games/crop-mower-harvest') || currentRoute.startsWith('/games/crop-mower') || currentRoute.startsWith('/games/lawn-mower')) {
      return <GamePage navigate={navigate} gameId="crop-mower-harvest" />;
    }
    if (currentRoute.startsWith('/games/barnyard-pinball') || currentRoute.startsWith('/games/pinball') || currentRoute.startsWith('/games/flipper')) {
      return <GamePage navigate={navigate} gameId="barnyard-pinball" />;
    }
    if (currentRoute.startsWith('/games/sheep-sorter-gate') || currentRoute.startsWith('/games/sheep-sorter') || currentRoute.startsWith('/games/sheep-gate')) {
      return <GamePage navigate={navigate} gameId="sheep-sorter-gate" />;
    }
    if (currentRoute.startsWith('/games/farm-tripeaks-solitaire') || currentRoute.startsWith('/games/tripeaks') || currentRoute.startsWith('/games/solitaire')) {
      return <GamePage navigate={navigate} gameId="farm-tripeaks-solitaire" />;
    }
    if (currentRoute.startsWith('/games/milk-bottle-plinko') || currentRoute.startsWith('/games/milk-plinko') || currentRoute.startsWith('/games/plinko')) {
      return <GamePage navigate={navigate} gameId="milk-bottle-plinko" />;
    }
    if (currentRoute.startsWith('/games/piggy-coin-pusher') || currentRoute.startsWith('/games/coin-pusher') || currentRoute.startsWith('/games/coin-dozer')) {
      return <GamePage navigate={navigate} gameId="piggy-coin-pusher" />;
    }
    if (currentRoute.startsWith('/games/animal-tangram-fit') || currentRoute.startsWith('/games/tangram') || currentRoute.startsWith('/games/wood-fit')) {
      return <GamePage navigate={navigate} gameId="animal-tangram-fit" />;
    }
    if (currentRoute.startsWith('/games/carrot-target-throw') || currentRoute.startsWith('/games/carrot-target') || currentRoute.startsWith('/games/knife-hit')) {
      return <GamePage navigate={navigate} gameId="carrot-target-throw" />;
    }
    if (currentRoute.startsWith('/games/caterpillar-fruit-trail') || currentRoute.startsWith('/games/caterpillar') || currentRoute.startsWith('/games/snake')) {
      return <GamePage navigate={navigate} gameId="caterpillar-fruit-trail" />;
    }
    if (currentRoute.startsWith('/games/corgi-mini-golf') || currentRoute.startsWith('/games/mini-golf') || currentRoute.startsWith('/games/golf')) {
      return <GamePage navigate={navigate} gameId="corgi-mini-golf" />;
    }
    if (currentRoute.startsWith('/games/duck-archery-range') || currentRoute.startsWith('/games/duck-archery') || currentRoute.startsWith('/games/archery')) {
      return <GamePage navigate={navigate} gameId="duck-archery-range" />;
    }
    if (currentRoute.startsWith('/games/barnyard-peg-pop') || currentRoute.startsWith('/games/peg-pop') || currentRoute.startsWith('/games/peggle')) {
      return <GamePage navigate={navigate} gameId="barnyard-peg-pop" />;
    }
    if (currentRoute.startsWith('/games/barnyard-fruit-slicer') || currentRoute.startsWith('/games/fruit-slicer') || currentRoute.startsWith('/games/fruit-ninja')) {
      return <GamePage navigate={navigate} gameId="barnyard-fruit-slicer" />;
    }
    if (currentRoute.startsWith('/games/hamster-cookie-stack') || currentRoute.startsWith('/games/cookie-stack') || currentRoute.startsWith('/games/bakery-tower')) {
      return <GamePage navigate={navigate} gameId="hamster-cookie-stack" />;
    }
    if (currentRoute.startsWith('/games/barnyard-pin-pull') || currentRoute.startsWith('/games/pin-pull') || currentRoute.startsWith('/games/pull-the-pin')) {
      return <GamePage navigate={navigate} gameId="barnyard-pin-pull" />;
    }
    if (currentRoute.startsWith('/games/koi-pond-zen') || currentRoute.startsWith('/games/koi-pond') || currentRoute.startsWith('/games/zen-pond')) {
      return <GamePage navigate={navigate} gameId="koi-pond-zen" />;
    }
    if (currentRoute.startsWith('/games/farm-pipe-flow') || currentRoute.startsWith('/games/pipe-flow') || currentRoute.startsWith('/games/plumber')) {
      return <GamePage navigate={navigate} gameId="farm-pipe-flow" />;
    }
    if (currentRoute.startsWith('/games/farm-tile-triple') || currentRoute.startsWith('/games/tile-triple') || currentRoute.startsWith('/games/triple-match')) {
      return <GamePage navigate={navigate} gameId="farm-tile-triple" />;
    }
    if (currentRoute.startsWith('/games/animal-suika-drop') || currentRoute.startsWith('/games/suika-game') || currentRoute.startsWith('/games/watermelon-merge')) {
      return <GamePage navigate={navigate} gameId="animal-suika-drop" />;
    }
    if (currentRoute.startsWith('/games/wood-nuts-farm') || currentRoute.startsWith('/games/wood-nuts') || currentRoute.startsWith('/games/screw-puzzle')) {
      return <GamePage navigate={navigate} gameId="wood-nuts-farm" />;
    }
    if (currentRoute.startsWith('/games/capybara-spa-rush') || currentRoute.startsWith('/games/capybara-spa')) {
      return <GamePage navigate={navigate} gameId="capybara-spa-rush" />;
    }
    if (currentRoute.startsWith('/games/save-the-sheep') || currentRoute.startsWith('/games/save-sheep')) {
      return <GamePage navigate={navigate} gameId="save-the-sheep" />;
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
    if (currentRoute.startsWith('/games/farm-animal-match') || currentRoute.startsWith('/games/pet-candy-crush') || currentRoute.startsWith('/games/farm-animal-crush')) {
      return <GamePage navigate={navigate} gameId="pet-candy-crush" />;
    }
    if (currentRoute.startsWith('/games/flappy-chicken')) {
      return <GamePage navigate={navigate} gameId="flappy-chicken" />;
    }
    if (currentRoute.startsWith('/games/animal-2048')) {
      return <GamePage navigate={navigate} gameId="animal-2048" />;
    }
    if (currentRoute.startsWith('/games/farm-block-drop') || currentRoute.startsWith('/games/farm-tetris')) {
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
    <div className="flex flex-col min-h-screen text-ink">
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

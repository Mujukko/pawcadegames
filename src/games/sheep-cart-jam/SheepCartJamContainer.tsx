import React, { useState, useEffect, useCallback } from 'react';
import {
  SheepCartJamState,
  initializeLevel,
  driveCartToDock,
  isCartPathBlocked,
  SHEEP_COLOR_CONFIG,
  MAX_DOCK_BAYS,
  LEVELS,
  Cart,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  HelpCircle,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { analytics } from '../../lib/analytics';

export const SheepCartJamContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<SheepCartJamState>(() => initializeLevel(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [shakeCartId, setShakeCartId] = useState<string | null>(null);
  const [blockedHintId, setBlockedHintId] = useState<string | null>(null);

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
    analytics.track('level_started', { gameId: 'sheep-cart-jam', levelId: lvl });
    setGameState(initializeLevel(lvl));
    setShakeCartId(null);
    setBlockedHintId(null);
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleCartClick = (cartId: string) => {
    if (gameState.isWon || gameState.isGameOver) return;

    const cart = gameState.carts.find(c => c.id === cartId);
    if (!cart) return;

    // Check if blocked
    const isBlocked = isCartPathBlocked(
      cart,
      gameState.carts,
      gameState.gridCols,
      gameState.gridRows
    );

    if (isBlocked) {
      sound.playBlockedCart();
      setShakeCartId(cartId);
      setBlockedHintId(cartId);
      setTimeout(() => setShakeCartId(null), 400);
      setTimeout(() => setBlockedHintId(null), 1500);
      return;
    }

    // Check if dock is full
    const emptyBay = gameState.dockBays.findIndex(b => b === null);
    if (emptyBay === -1) {
      sound.playBlockedCart();
      return;
    }

    // Drive cart to dock
    sound.playCartDrive();
    const nextState = driveCartToDock(gameState, cartId);

    // If passengers boarded or cart departed, play sounds
    if (nextState.departedCartsCount > gameState.departedCartsCount) {
      setTimeout(() => {
        sound.playCartDepart();
      }, 200);
    } else if (nextState.score > gameState.score) {
      sound.playSheepBaa();
    }

    // Check Win
    if (nextState.isWon && !gameState.isWon) {
      analytics.levelCompleted('sheep-cart-jam', {
        level: gameState.level,
        score: nextState.score,
        departedCarts: nextState.departedCartsCount,
      });
      setTimeout(() => {
        sound.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 350);
    }

    setGameState(nextState);
  };

  // Keyboard shortcut: R to restart
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        startLevel(levelNum);
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [levelNum, startLevel]);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-2 sm:p-4 pb-safe select-none text-slate-100">
      {/* 1. TOP HEADER & HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-2xl px-2.5 py-2 sm:px-4 sm:py-2.5 mb-2.5 shadow-xl gap-1.5">
        <div className="flex items-center gap-2 shrink min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center p-1 shadow-md border border-amber-400/40 shrink-0">
            <img
              src={SHEEP_COLOR_CONFIG.pink.assetPath}
              alt="Sheep Cart Jam"
              className="w-7 h-7 sm:w-8 sm:h-8 object-contain drop-shadow"
            />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider truncate">
              Level {gameState.level} of {LEVELS.length}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-tight font-mono">
              Score: <span className="text-yellow-400">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Level Switcher & Quick Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            {LEVELS.map(l => (
              <button
                key={l.level}
                onClick={() => startLevel(l.level)}
                aria-label={`Select Level ${l.level}`}
                className={`px-2 sm:px-2.5 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer min-h-[36px] sm:min-h-[38px] ${
                  levelNum === l.level
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                L{l.level}
              </button>
            ))}
          </div>

          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer relative before:absolute before:-inset-1 before:content-['']"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => startLevel(levelNum)}
            aria-label="Restart Level"
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[36px] min-h-[36px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer relative before:absolute before:-inset-1 before:content-['']"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FARM STATION DOCK (Covered Wooden Station Platforms) */}
      <div className="w-full bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-600/50 rounded-2xl p-2 sm:p-3 mb-2.5 shadow-xl relative overflow-hidden">
        {/* Wooden Station Canopy Trim */}
        <div className="flex items-center justify-between mb-2 px-1 gap-1">
          <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1 shrink-0">
            <span>FARM STATION DOCK</span>
            <span className="text-[10px] text-amber-400/80 font-mono">({MAX_DOCK_BAYS} BAYS)</span>
          </span>
          <span className="text-[9px] sm:text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
            Departs at 3/3
          </span>
        </div>

        {/* 3 Docking Bays */}
        <div className="grid grid-cols-3 gap-2">
          {gameState.dockBays.map((bay, idx) => {
            if (!bay) {
              return (
                <div
                  key={idx}
                  className="h-20 sm:h-22 rounded-xl border-2 border-dashed border-amber-500/30 bg-slate-950/50 flex flex-col items-center justify-center p-1 text-slate-500 transition-all"
                >
                  <span className="text-xs font-black text-amber-400/70">BAY {idx + 1}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500 mt-0.5">OPEN / EMPTY</span>
                </div>
              );
            }

            const colConfig = SHEEP_COLOR_CONFIG[bay.color];
            const isFull = bay.passengers >= bay.capacity;

            return (
              <div
                key={idx}
                className={`h-20 sm:h-22 rounded-xl border-2 ${colConfig.borderClass} ${colConfig.bgClass}/25 bg-slate-900 flex flex-col items-center justify-between p-1.5 shadow-lg relative overflow-hidden animate-bounce-short`}
              >
                {/* Bay Header */}
                <div className="flex items-center justify-between w-full text-[10px] font-black leading-none">
                  <span className="text-white truncate uppercase tracking-tight">{colConfig.name}</span>
                  <span className="px-1.5 py-0.5 rounded-md bg-black/60 text-yellow-300 font-mono font-bold">
                    {bay.passengers}/3
                  </span>
                </div>

                {/* Parked Cart Passenger Slots with Custom Cute Sheep */}
                <div className="flex items-center justify-center gap-1 sm:gap-1.5 my-auto w-full">
                  {[0, 1, 2].map(seatIdx => (
                    <div
                      key={seatIdx}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center p-0.5 border transition-all ${
                        seatIdx < bay.passengers
                          ? `${colConfig.bgClass} border-white shadow-md scale-105`
                          : 'bg-black/40 border-dashed border-white/20'
                      }`}
                    >
                      {seatIdx < bay.passengers ? (
                        <img
                          src={colConfig.assetPath}
                          alt={`${colConfig.name} Sheep`}
                          className="w-full h-full object-contain filter drop-shadow select-none animate-in zoom-in-75 duration-200"
                        />
                      ) : (
                        <span className="text-[10px] text-amber-200/40">🌾</span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Status Footer */}
                <div className="text-[9px] font-black uppercase tracking-wider text-amber-300 text-center">
                  {isFull ? 'DEPARTING! 🚀' : 'BOARDING...'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SHEEP WAITING QUEUE (Barnyard Corral Line) */}
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded-2xl p-2 sm:p-2.5 mb-2.5 flex items-center gap-2 shadow-lg overflow-x-auto">
        <div className="shrink-0 flex items-center gap-1.5 pl-1 pr-2 border-r border-slate-700">
          <span className="text-xs font-black uppercase text-amber-400">Queue:</span>
          <span className="text-xs font-mono font-black text-white bg-slate-800 px-2 py-0.5 rounded-lg border border-slate-700">
            {gameState.sheepQueue.length}
          </span>
        </div>

        {gameState.sheepQueue.length === 0 ? (
          <div className="text-xs text-emerald-400 font-black py-1">All Sheep Boarded! 🎉</div>
        ) : (
          <div className="flex items-center gap-2 py-0.5">
            {gameState.sheepQueue.slice(0, 8).map((color, idx) => {
              const colConfig = SHEEP_COLOR_CONFIG[color];
              const isFront = idx === 0;
              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-center rounded-xl p-1 sm:p-1.5 border transition-all ${
                    colConfig.borderClass
                  } ${colConfig.bgClass}/20 bg-slate-800 shrink-0 ${
                    isFront
                      ? 'ring-2 ring-amber-400 scale-110 bg-amber-400/25 shadow-lg shadow-amber-400/25'
                      : 'opacity-85'
                  }`}
                  title={`${colConfig.name} Sheep`}
                >
                  <img
                    src={colConfig.assetPath}
                    alt={`${colConfig.name} Sheep`}
                    className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow select-none"
                  />
                  <span
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${colConfig.bgClass} border-2 border-white shadow-sm`}
                  />
                  {isFront && (
                    <span className="absolute -bottom-2.5 text-[8px] font-black uppercase text-yellow-300 tracking-tighter bg-slate-950 px-1 rounded-sm border border-amber-400/50 shadow">
                      NEXT
                    </span>
                  )}
                </div>
              );
            })}
            {gameState.sheepQueue.length > 8 && (
              <span className="text-xs text-slate-400 font-black px-1 shrink-0">
                +{gameState.sheepQueue.length - 8} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. THE FARMYARD PASTURE PARKING MAZE (True 1:1 Square Grid with Open Exit Gates) */}
      <div
        data-game-board
        className="relative w-full aspect-[6/8] max-w-[440px] bg-emerald-950/80 border-4 border-amber-800 rounded-3xl p-1.5 shadow-2xl overflow-hidden mx-auto touch-none select-none overscroll-none"
      >
        {/* Lush Farm Pasture Turf Grid Checkerboard */}
        <div
          className="absolute inset-0 grid opacity-40 pointer-events-none"
          style={{
            gridTemplateColumns: `repeat(${gameState.gridCols}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gameState.gridRows}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: gameState.gridCols * gameState.gridRows }).map((_, i) => {
            const row = Math.floor(i / gameState.gridCols);
            const col = i % gameState.gridCols;
            const isDark = (row + col) % 2 === 0;
            return (
              <div
                key={i}
                className={`border border-emerald-600/20 ${isDark ? 'bg-emerald-900/40' : 'bg-emerald-800/20'}`}
              />
            );
          })}
        </div>

        {/* 4 OPEN EXIT GATES ON PERIMETER FENCES */}
        {/* North Meadow Gate (Top) */}
        <div className="absolute top-0 inset-x-0 h-4 bg-gradient-to-b from-emerald-500/40 to-transparent flex items-center justify-center pointer-events-none z-10 border-b border-emerald-400/50">
          <span className="text-[9px] font-black uppercase text-emerald-300 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-400/60 shadow-sm flex items-center gap-1">
            <ArrowUp className="w-2.5 h-2.5 text-emerald-400" />
            <span>NORTH MEADOW EXIT</span>
            <ArrowUp className="w-2.5 h-2.5 text-emerald-400" />
          </span>
        </div>

        {/* South Meadow Gate (Bottom) */}
        <div className="absolute bottom-0 inset-x-0 h-4 bg-gradient-to-t from-emerald-500/40 to-transparent flex items-center justify-center pointer-events-none z-10 border-t border-emerald-400/50">
          <span className="text-[9px] font-black uppercase text-emerald-300 tracking-wider bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-400/60 shadow-sm flex items-center gap-1">
            <ArrowDown className="w-2.5 h-2.5 text-emerald-400" />
            <span>SOUTH MEADOW EXIT</span>
            <ArrowDown className="w-2.5 h-2.5 text-emerald-400" />
          </span>
        </div>

        {/* West Meadow Gate (Left) */}
        <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-emerald-500/40 to-transparent flex items-center justify-center pointer-events-none z-10 border-r border-emerald-400/40">
          <span className="text-[8px] font-black uppercase text-emerald-300 -rotate-90 whitespace-nowrap bg-slate-950/80 px-1 rounded border border-emerald-400/50">
            ◀ WEST
          </span>
        </div>

        {/* East Meadow Gate (Right) */}
        <div className="absolute right-0 inset-y-0 w-3 bg-gradient-to-l from-emerald-500/40 to-transparent flex items-center justify-center pointer-events-none z-10 border-l border-emerald-400/40">
          <span className="text-[8px] font-black uppercase text-emerald-300 rotate-90 whitespace-nowrap bg-slate-950/80 px-1 rounded border border-emerald-400/50">
            EAST ▶
          </span>
        </div>

        {/* RENDER CARTS (Stylized Tractor Hay Wagons with Cute Sheep) */}
        {gameState.carts.map(cart => {
          const colConfig = SHEEP_COLOR_CONFIG[cart.color];
          const isBlocked = isCartPathBlocked(
            cart,
            gameState.carts,
            gameState.gridCols,
            gameState.gridRows
          );
          const isShaking = shakeCartId === cart.id;
          const isHinted = blockedHintId === cart.id;

          // Percentage positioning inside grid
          const leftPercent = (cart.x / gameState.gridCols) * 100;
          const topPercent = (cart.y / gameState.gridRows) * 100;
          const widthPercent = (cart.width / gameState.gridCols) * 100;
          const heightPercent = (cart.height / gameState.gridRows) * 100;

          const isHorizontal = cart.orientation === 'horizontal';
          const isUp = cart.exitDirection === 'up';
          const isDown = cart.exitDirection === 'down';
          const isLeft = cart.exitDirection === 'left';
          const isRight = cart.exitDirection === 'right';

          // Direction Arrow Icon
          const dirIcon = isUp ? (
            <ArrowUp className="w-3.5 h-3.5 stroke-[3]" />
          ) : isDown ? (
            <ArrowDown className="w-3.5 h-3.5 stroke-[3]" />
          ) : isLeft ? (
            <ArrowLeft className="w-3.5 h-3.5 stroke-[3]" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
          );

          // Tractor Cab Element
          const renderTractorCab = () => (
            <div
              className={`relative flex items-center justify-center shrink-0 ${colConfig.bgClass} shadow-md overflow-hidden ${
                isHorizontal
                  ? `h-full w-6 sm:w-7 ${isLeft ? 'rounded-l-xl border-r-2 border-black/30' : 'rounded-r-xl border-l-2 border-black/30'}`
                  : `w-full h-6 sm:h-7 ${isUp ? 'rounded-t-xl border-b-2 border-black/30' : 'rounded-b-xl border-t-2 border-black/30'}`
              }`}
            >
              {/* Headlights on front edge */}
              {isUp && (
                <>
                  <div className="absolute top-0.5 left-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                  <div className="absolute top-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                </>
              )}
              {isDown && (
                <>
                  <div className="absolute bottom-0.5 left-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                  <div className="absolute bottom-0.5 right-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                </>
              )}
              {isLeft && (
                <>
                  <div className="absolute left-0.5 top-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                  <div className="absolute left-0.5 bottom-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                </>
              )}
              {isRight && (
                <>
                  <div className="absolute right-0.5 top-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                  <div className="absolute right-0.5 bottom-1.5 w-1.5 h-1.5 rounded-full bg-yellow-200 border border-amber-400 shadow-[0_0_4px_#fde047]" />
                </>
              )}

              {/* Bold Glowing Direction Arrow Chevron */}
              <div
                className={`p-0.5 rounded-md flex items-center justify-center shadow-sm z-10 ${
                  !isBlocked
                    ? 'bg-emerald-400 text-slate-950 ring-1 ring-white/80 animate-bounce-short'
                    : 'bg-black/60 text-white/60'
                }`}
              >
                {dirIcon}
              </div>
            </div>
          );

          // Hay Wagon Trailer Bed with Cute Colored Sheep
          const renderTrailerBed = () => (
            <div
              className={`flex-1 bg-amber-950/75 border border-amber-800/80 rounded-lg p-0.5 sm:p-1 flex ${
                isHorizontal ? 'flex-row' : 'flex-col'
              } items-center justify-around gap-0.5 relative overflow-hidden`}
            >
              {[0, 1, 2].map(seatIdx => (
                <div
                  key={seatIdx}
                  className="flex-1 w-full h-full rounded-md bg-black/40 border border-amber-600/30 flex items-center justify-center p-0.5 min-w-0 min-h-0 shadow-inner"
                >
                  <img
                    src={colConfig.assetPath}
                    alt={colConfig.name}
                    className="w-full h-full object-contain filter drop-shadow-sm select-none"
                  />
                </div>
              ))}
            </div>
          );

          return (
            <button
              key={cart.id}
              onClick={() => handleCartClick(cart.id)}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`,
              }}
              className={`absolute p-0.5 sm:p-1 cursor-pointer transition-transform transform active:scale-95 select-none ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              <div
                className={`w-full h-full rounded-2xl border-2 sm:border-3 flex ${
                  isHorizontal ? 'flex-row' : 'flex-col'
                } items-stretch justify-between shadow-xl transition-all relative select-none ${
                  colConfig.borderClass
                } ${
                  isBlocked
                    ? 'opacity-85 brightness-90 hover:brightness-100 hover:ring-2 hover:ring-red-400 bg-slate-900/90'
                    : 'ring-2 sm:ring-3 ring-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.65)] hover:scale-102 hover:shadow-2xl animate-pulse-gentle bg-slate-900/95'
                } ${isHinted ? 'ring-4 ring-rose-500 scale-103' : ''}`}
              >
                {/* 4 Rubber Tires on Chassis Sides */}
                {!isHorizontal ? (
                  <>
                    <div className="absolute -left-1 sm:-left-1.5 top-[18%] w-1.5 sm:w-2 h-3 sm:h-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                    <div className="absolute -left-1 sm:-left-1.5 bottom-[18%] w-1.5 sm:w-2 h-3 sm:h-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                    <div className="absolute -right-1 sm:-right-1.5 top-[18%] w-1.5 sm:w-2 h-3 sm:h-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                    <div className="absolute -right-1 sm:-right-1.5 bottom-[18%] w-1.5 sm:w-2 h-3 sm:h-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute -top-1 sm:-top-1.5 left-[18%] h-1.5 sm:h-2 w-3 sm:w-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                    <div className="absolute -top-1 sm:-top-1.5 right-[18%] h-1.5 sm:h-2 w-3 sm:w-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                    <div className="absolute -bottom-1 sm:-bottom-1.5 left-[18%] h-1.5 sm:h-2 w-3 sm:w-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                    <div className="absolute -bottom-1 sm:-bottom-1.5 right-[18%] h-1.5 sm:h-2 w-3 sm:w-4 bg-zinc-950 rounded border border-zinc-700 shadow-md flex items-center justify-center z-20">
                      <div className="w-0.5 h-0.5 rounded-full bg-zinc-400" />
                    </div>
                  </>
                )}

                {/* Subtile 3D Glossy Highlight */}
                <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none rounded-t-xl z-20" />

                {/* Tractor Cab & Hay Trailer Bed Ordered by Exit Direction */}
                {isUp ? (
                  <>
                    {renderTractorCab()}
                    {renderTrailerBed()}
                  </>
                ) : isDown ? (
                  <>
                    {renderTrailerBed()}
                    {renderTractorCab()}
                  </>
                ) : isLeft ? (
                  <>
                    {renderTractorCab()}
                    {renderTrailerBed()}
                  </>
                ) : (
                  <>
                    {renderTrailerBed()}
                    {renderTractorCab()}
                  </>
                )}

                {/* Compact Subtle Lock Badge for Blocked Carts (Zero Text Overflow!) */}
                {isBlocked && (
                  <div
                    className="absolute top-1 right-1 z-30 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-slate-950/90 border border-amber-400/80 flex items-center justify-center text-amber-300 shadow-md pointer-events-none"
                    title="Path Blocked"
                  >
                    <Lock className="w-2.5 h-2.5 stroke-[2.5]" />
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. STRATEGY HINT BANNER */}
      <div className="w-full mt-2.5 text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
        <span className="text-base">💡</span>
        <span>
          Tap <strong className="text-emerald-400">Green Glowing Tractors</strong> to drive them to the station and board matching sheep!
        </span>
      </div>

      {/* 6. VICTORY / GAME OVER MODAL */}
      {(gameState.isWon || gameState.isGameOver) && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {gameState.isWon ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Meadow Cleared!</h3>
                <p className="text-xs text-slate-300 mb-4">
                  All sheep safely boarded their farm carts and escaped to the lush meadow!
                </p>
                <div className="bg-slate-800 rounded-2xl p-3 mb-5 border border-slate-700 flex justify-around">
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Score</div>
                    <div className="text-xl font-black text-amber-300 font-mono">{gameState.score}</div>
                  </div>
                  <div className="border-r border-slate-700" />
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase">Moves</div>
                    <div className="text-xl font-black text-emerald-400 font-mono">{gameState.moves}</div>
                  </div>
                </div>
                {levelNum < LEVELS.length ? (
                  <button
                    onClick={() => startLevel(levelNum + 1)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>NEXT LEVEL</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    onClick={() => startLevel(1)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>PLAY AGAIN</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-rose-500/20">
                  🚜
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Station Gridlocked!</h3>
                <p className="text-xs text-slate-300 mb-4">
                  All 3 station bays are full with carts that don't match the waiting sheep!
                </p>
                <div className="bg-slate-800 rounded-2xl p-3 mb-5 border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Final Score</div>
                  <div className="text-xl font-black text-amber-300 font-mono">{gameState.score}</div>
                </div>
                <button
                  onClick={() => startLevel(levelNum)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RETRY LEVEL</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

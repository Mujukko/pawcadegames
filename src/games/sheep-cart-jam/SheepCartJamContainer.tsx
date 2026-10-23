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

export const SheepCartJamContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<SheepCartJamState>(() => initializeLevel(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [shakeCartId, setShakeCartId] = useState<string | null>(null);
  const [blockedHintId, setBlockedHintId] = useState<string | null>(null);

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
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
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-2 sm:p-4 select-none text-slate-100">
      {/* 1. TOP HEADER & HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-2xl shadow-md border border-amber-400/40">
            🐑
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Level {gameState.level} of {LEVELS.length}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-tight font-mono">
              Score: <span className="text-yellow-400">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Level Switcher & Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            {LEVELS.map(l => (
              <button
                key={l.level}
                onClick={() => startLevel(l.level)}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
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
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => startLevel(levelNum)}
            aria-label="Restart Level"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FARM STATION DOCK (Covered Wooden Station Platforms) */}
      <div className="w-full bg-gradient-to-b from-amber-950/80 to-slate-900 border-2 border-amber-600/50 rounded-2xl p-2.5 sm:p-3 mb-2.5 shadow-xl relative overflow-hidden">
        {/* Wooden Station Canopy Trim */}
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-black uppercase text-amber-300 tracking-wider flex items-center gap-1.5">
            <span>🚜 FARM STATION DOCK</span>
            <span className="text-[10px] text-amber-400/80 font-mono">({MAX_DOCK_BAYS} BAYS)</span>
          </span>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
            Departs at 3/3 Passengers
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

                {/* Parked Cart Passenger Slots with Sheep */}
                <div className="flex items-center justify-center gap-1 my-auto w-full">
                  {[0, 1, 2].map(seatIdx => (
                    <div
                      key={seatIdx}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-base border transition-all ${
                        seatIdx < bay.passengers
                          ? `${colConfig.bgClass} border-white shadow-sm text-white scale-105`
                          : 'bg-black/40 border-dashed border-white/20 text-transparent'
                      }`}
                    >
                      {seatIdx < bay.passengers ? '🐑' : '•'}
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
                  className={`relative flex items-center justify-center rounded-xl px-2 py-1 border transition-all ${
                    colConfig.borderClass
                  } ${colConfig.bgClass}/30 bg-slate-800 shrink-0 ${
                    isFront
                      ? 'ring-2 ring-amber-400 scale-108 bg-amber-400/20 shadow-md shadow-amber-400/20'
                      : 'opacity-85'
                  }`}
                  title={`${colConfig.name} Sheep`}
                >
                  <span className="text-lg select-none">🐑</span>
                  <span
                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full ${colConfig.bgClass} border-2 border-white shadow-sm`}
                  />
                  {isFront && (
                    <span className="absolute -bottom-3 text-[8px] font-black uppercase text-yellow-300 tracking-tighter bg-slate-950 px-1 rounded-sm border border-amber-400/40">
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
      <div className="relative w-full aspect-[6/8] max-w-[440px] bg-emerald-950/80 border-4 border-amber-800 rounded-3xl p-1.5 shadow-2xl overflow-hidden mx-auto">
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

        {/* RENDER CARTS (3D Tractor Hay Wagons) */}
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

          // Direction Arrow Icon & Text
          const dirIcon =
            cart.exitDirection === 'up' ? (
              <ArrowUp className="w-4 h-4 stroke-[3]" />
            ) : cart.exitDirection === 'down' ? (
              <ArrowDown className="w-4 h-4 stroke-[3]" />
            ) : cart.exitDirection === 'left' ? (
              <ArrowLeft className="w-4 h-4 stroke-[3]" />
            ) : (
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            );

          const isHorizontal = cart.orientation === 'horizontal';

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
              className={`absolute p-1 cursor-pointer transition-transform transform active:scale-95 select-none ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              <div
                className={`w-full h-full rounded-2xl border-3 flex flex-col items-center justify-between p-1.5 shadow-xl transition-all relative overflow-hidden ${
                  colConfig.borderClass
                } ${colConfig.bgClass} ${
                  isBlocked
                    ? 'opacity-85 brightness-90 hover:brightness-100 hover:ring-2 hover:ring-red-400'
                    : 'ring-3 ring-emerald-400/90 shadow-emerald-400/40 hover:scale-102 hover:shadow-2xl animate-pulse-gentle'
                } ${isHinted ? 'ring-4 ring-rose-500 scale-103' : ''}`}
              >
                {/* 3D Glossy Bevel Highlight */}
                <div className="absolute inset-x-0 top-0 h-2.5 bg-gradient-to-b from-white/40 to-transparent pointer-events-none rounded-t-xl" />

                {/* Cart Header: Tractor Cab & Bold Glowing Direction Arrow */}
                <div className="w-full flex items-center justify-between text-white font-black z-10 px-0.5 leading-none">
                  <span className="text-sm drop-shadow">🚜</span>
                  <div
                    className={`flex items-center justify-center rounded-md p-0.5 shadow-md ${
                      !isBlocked
                        ? 'bg-emerald-500 text-white animate-bounce'
                        : 'bg-black/50 text-white/90'
                    }`}
                  >
                    {dirIcon}
                  </div>
                </div>

                {/* Sheep Passenger Bench Slots */}
                <div
                  className={`flex items-center justify-center gap-1 my-auto w-full z-10 ${
                    isHorizontal ? 'flex-row' : 'flex-col'
                  }`}
                >
                  {[0, 1, 2].map(seat => (
                    <div
                      key={seat}
                      className="w-5 h-5 sm:w-6 sm:h-6 rounded-md bg-black/25 border border-white/30 flex items-center justify-center text-sm shadow-inner"
                    >
                      <span className="text-white drop-shadow">🐑</span>
                    </div>
                  ))}
                </div>

                {/* Cart Footer: Status Pill */}
                <div className="w-full flex items-center justify-between text-[9px] font-black text-white/90 z-10 px-0.5 leading-none">
                  {!isBlocked ? (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-bold uppercase tracking-tighter shadow-sm w-full text-center">
                      TAP TO DRIVE
                    </span>
                  ) : (
                    <span className="px-1 py-0.5 rounded bg-black/50 text-amber-300 font-bold uppercase tracking-tighter flex items-center justify-center gap-0.5 w-full">
                      <Lock className="w-2.5 h-2.5" />
                      <span>BLOCKED</span>
                    </span>
                  )}
                </div>

                {/* Rubber Wheel Accents on Cart Sides */}
                <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
                <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700" />
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. STRATEGY HINT BANNER */}
      <div className="w-full mt-2.5 text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
        <span className="text-base">💡</span>
        <span>
          Tap <strong className="text-emerald-400">Green Glowing Carts</strong> to drive them to the station and board matching sheep!
        </span>
      </div>

      {/* 6. VICTORY / GAME OVER MODAL */}
      {(gameState.isWon || gameState.isGameOver) && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200">
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

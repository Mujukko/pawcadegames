import React, { useState, useEffect, useCallback } from 'react';
import {
  SheepCartJamState,
  initializeLevel,
  driveCartToDock,
  isCartPathBlocked,
  SHEEP_COLOR_CONFIG,
  MAX_DOCK_BAYS,
  LEVELS,
} from './logic/engine';
import { sound } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Trophy, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

export const SheepCartJamContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<SheepCartJamState>(() => initializeLevel(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [shakeCartId, setShakeCartId] = useState<string | null>(null);

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
    setGameState(initializeLevel(lvl));
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
      setTimeout(() => setShakeCartId(null), 400);
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
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto p-2 sm:p-4 select-none touch-none">
      {/* 1. TOP HEADER & HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 mb-3 shadow-lg shadow-black/40">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xl shadow-md">
            🐑
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
                Level {gameState.level} / {LEVELS.length}
              </span>
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-tight">
              Score: <span className="text-amber-300 font-mono">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Level Switcher & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            {LEVELS.map(l => (
              <button
                key={l.level}
                onClick={() => startLevel(l.level)}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition-all ${
                  levelNum === l.level
                    ? 'bg-amber-400 text-slate-950 shadow-md'
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

      {/* 2. STATION LOADING DOCK (The 3 Waiting Bays) */}
      <div className="w-full bg-slate-950/80 border-2 border-amber-600/40 rounded-2xl p-2.5 sm:p-3 mb-3 shadow-inner">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
            <span>🚜 Farm Station Dock</span>
            <span className="text-[10px] text-slate-400">({MAX_DOCK_BAYS} Bays)</span>
          </span>
          <span className="text-[10px] text-slate-400">
            Carts depart when full (3/3)
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {gameState.dockBays.map((bay, idx) => {
            if (!bay) {
              return (
                <div
                  key={idx}
                  className="h-16 sm:h-20 rounded-xl border-2 border-dashed border-slate-700/80 bg-slate-900/40 flex flex-col items-center justify-center text-slate-600"
                >
                  <span className="text-xs font-mono font-bold">Bay {idx + 1}</span>
                  <span className="text-[10px] uppercase text-slate-500">Empty</span>
                </div>
              );
            }

            const colConfig = SHEEP_COLOR_CONFIG[bay.color];
            return (
              <div
                key={idx}
                className={`h-16 sm:h-20 rounded-xl border-2 ${colConfig.borderClass} ${colConfig.bgClass}/20 bg-slate-900 flex flex-col items-center justify-between p-1.5 animate-bounce-short shadow-md`}
              >
                <div className="flex items-center justify-between w-full text-[10px] font-black">
                  <span className="text-white uppercase truncate">{colConfig.name}</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-black/50 text-amber-300 font-mono">
                    {bay.passengers}/3
                  </span>
                </div>

                {/* 3 Sheep Passenger Seats */}
                <div className="flex items-center gap-1 my-auto">
                  {[0, 1, 2].map(seatIdx => (
                    <div
                      key={seatIdx}
                      className={`w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-sm border ${
                        seatIdx < bay.passengers
                          ? `${colConfig.bgClass} border-white shadow-sm text-white`
                          : 'bg-black/30 border-dashed border-white/20 text-transparent'
                      }`}
                    >
                      {seatIdx < bay.passengers ? '🐑' : '•'}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. SHEEP QUEUE (Waiting Line at Barn Gate) */}
      <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2.5 mb-3 flex items-center gap-2 overflow-x-auto shadow-md">
        <div className="shrink-0 flex items-center gap-1.5 pl-1 pr-2 border-r border-slate-800">
          <span className="text-xs font-black text-amber-400">Queue:</span>
          <span className="text-xs font-mono font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded-md">
            {gameState.sheepQueue.length} Left
          </span>
        </div>

        {gameState.sheepQueue.length === 0 ? (
          <div className="text-xs text-emerald-400 font-black py-1">All Sheep Boarded! 🎉</div>
        ) : (
          <div className="flex items-center gap-1.5 py-0.5">
            {gameState.sheepQueue.slice(0, 10).map((color, idx) => {
              const colConfig = SHEEP_COLOR_CONFIG[color];
              const isFront = idx === 0;
              return (
                <div
                  key={idx}
                  className={`relative flex items-center justify-center rounded-xl px-2 py-1 border transition-all ${
                    colConfig.borderClass
                  } ${colConfig.bgClass}/30 bg-slate-800 ${
                    isFront ? 'ring-2 ring-amber-400 scale-105' : 'opacity-80'
                  }`}
                  title={colConfig.name}
                >
                  <span className="text-base sm:text-lg select-none">🐑</span>
                  <span
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${colConfig.bgClass} border border-white`}
                  />
                  {isFront && (
                    <span className="absolute -bottom-3 text-[8px] font-black uppercase text-amber-300 tracking-tighter">
                      NEXT
                    </span>
                  )}
                </div>
              );
            })}
            {gameState.sheepQueue.length > 10 && (
              <span className="text-xs text-slate-500 font-bold px-1">
                +{gameState.sheepQueue.length - 10} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* 4. FARMYARD PARKING MAZE (Grid with Carts) */}
      <div className="relative w-full aspect-[6/8] sm:max-h-[440px] bg-amber-950/20 border-2 border-amber-600/40 rounded-3xl p-2 sm:p-3 overflow-hidden shadow-2xl">
        {/* Dirt/Grass Tiles Background Pattern */}
        <div className="absolute inset-0 grid grid-cols-6 grid-rows-8 opacity-15 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="border border-amber-400/20" />
          ))}
        </div>

        {/* Exit Gate Indicator */}
        <div className="absolute top-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-emerald-600/80 border border-emerald-400 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1 pointer-events-none shadow-md">
          <span>▲ EXIT LANE TO MEADOW ▲</span>
        </div>

        {/* Render Carts on Grid */}
        {gameState.carts.map(cart => {
          const colConfig = SHEEP_COLOR_CONFIG[cart.color];
          const isBlocked = isCartPathBlocked(
            cart,
            gameState.carts,
            gameState.gridCols,
            gameState.gridRows
          );
          const isShaking = shakeCartId === cart.id;

          // Compute style percentages based on 6 cols and 8 rows
          const leftPercent = (cart.x / gameState.gridCols) * 100;
          const topPercent = (cart.y / gameState.gridRows) * 100;
          const widthPercent = (cart.width / gameState.gridCols) * 100;
          const heightPercent = (cart.height / gameState.gridRows) * 100;

          // Direction icon
          const directionArrow =
            cart.exitDirection === 'up'
              ? '▲'
              : cart.exitDirection === 'down'
              ? '▼'
              : cart.exitDirection === 'left'
              ? '◀'
              : '▶';

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
              className={`absolute p-1 rounded-2xl cursor-pointer transition-transform transform active:scale-95 ${
                isShaking ? 'animate-shake' : ''
              }`}
            >
              <div
                className={`w-full h-full rounded-xl border-2 flex flex-col items-center justify-between p-1.5 shadow-lg transition-all ${
                  colConfig.borderClass
                } ${colConfig.bgClass} ${
                  isBlocked
                    ? 'brightness-90 hover:brightness-100 hover:ring-2 hover:ring-red-500/60'
                    : 'hover:scale-103 hover:shadow-xl hover:ring-2 hover:ring-amber-300'
                }`}
              >
                {/* Cart Direction Arrow & Title */}
                <div className="w-full flex items-center justify-between text-white/90 font-black text-[10px] leading-none">
                  <span>🚜</span>
                  <span className="font-mono text-xs">{directionArrow}</span>
                </div>

                {/* Sheep Icon Placeholder */}
                <div className="flex items-center justify-center my-auto">
                  <span className="text-xl sm:text-2xl select-none filter drop-shadow">🐑</span>
                </div>

                {/* Capacity Dots */}
                <div className="flex items-center gap-1 text-[8px] text-white/80 font-black">
                  <span>3 SEATS</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 5. VICTORY / GAME OVER MODAL */}
      {(gameState.isWon || gameState.isGameOver) && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-400 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            {gameState.isWon ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 mx-auto flex items-center justify-center text-3xl mb-4">
                  🏆
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Meadow Cleared!</h3>
                <p className="text-sm text-slate-300 mb-4">
                  All sheep are happily grazing in the meadow!
                </p>
                <div className="bg-slate-800 rounded-xl p-3 mb-6 font-mono text-amber-300 text-lg font-bold">
                  Score: {gameState.score} Pts
                </div>
                {levelNum < LEVELS.length ? (
                  <button
                    onClick={() => startLevel(levelNum + 1)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-base shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>NEXT LEVEL</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    onClick={() => startLevel(1)}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-base shadow-lg shadow-amber-400/30 cursor-pointer"
                  >
                    PLAY AGAIN
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-400 mx-auto flex items-center justify-center text-3xl mb-4">
                  ⚠️
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Dock Jammed!</h3>
                <p className="text-sm text-slate-300 mb-4">
                  The dock bays are full and none match the waiting sheep.
                </p>
                <button
                  onClick={() => startLevel(levelNum)}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-base shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw className="w-5 h-5" />
                  <span>TRY AGAIN</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

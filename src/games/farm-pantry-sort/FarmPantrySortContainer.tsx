import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  PantryState,
  initializePantryLevel,
  handleSlotClick,
  PANTRY_LEVELS,
  PANTRY_GOODS_CONFIG,
  tickPantryTimer,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  Sparkles,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const FarmPantrySortContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<PantryState>(() => initializePantryLevel(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const timerRef = useRef<number | null>(null);

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
    setGameState(initializePantryLevel(lvl));
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Timer loop
  useEffect(() => {
    if (gameState.isWon || gameState.isGameOver) return;

    timerRef.current = window.setInterval(() => {
      setGameState(prev => {
        if (prev.isWon || prev.isGameOver) return prev;
        const next = tickPantryTimer(prev, 1);
        if (next.isGameOver && !prev.isGameOver) {
          sound.playGameOver();
        }
        return next;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.isWon, gameState.isGameOver]);

  const onSlotClick = (shelfId: string, slotIndex?: number) => {
    if (gameState.isWon || gameState.isGameOver) return;

    const hadSelection = gameState.selectedShelfId !== null;
    const nextState = handleSlotClick(gameState, shelfId, slotIndex);

    // Audio feedback
    if (!hadSelection && nextState.selectedShelfId !== null) {
      sound.playItemPick();
    } else if (hadSelection && nextState.selectedShelfId === null) {
      sound.playItemPlace();
    }

    // Match sound
    if (nextState.score > gameState.score) {
      setTimeout(() => {
        sound.playMatchClear();
      }, 150);
    }

    // Win condition
    if (nextState.isWon && !gameState.isWon) {
      setTimeout(() => {
        sound.playVictory();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }, 300);
    }

    setGameState(nextState);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-2 sm:p-4 select-none text-slate-100">
      {/* 1. TOP HEADER & HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center p-1 shadow-md border border-amber-400/40">
            <span className="text-xl">🐿️</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Level {gameState.level} of {PANTRY_LEVELS.length}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-tight font-mono">
              Score: <span className="text-yellow-400">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Level Controls & Timer */}
        <div className="flex items-center gap-2">
          {/* Timer Pill */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border font-mono text-xs font-black shadow-inner ${
              gameState.timeRemaining <= 20
                ? 'bg-rose-950/80 border-rose-500 text-rose-300 animate-pulse'
                : 'bg-slate-800 border-slate-700 text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{gameState.timeRemaining}s</span>
          </div>

          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => startLevel(levelNum)}
            aria-label="Restart Level"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. GRAND WOODEN PANTRY CABINET */}
      <div className="w-full bg-gradient-to-b from-amber-950/95 via-amber-900/90 to-amber-950 border-4 border-amber-800 rounded-3xl p-3 sm:p-4 shadow-2xl relative overflow-hidden flex flex-col gap-3 touch-none overscroll-none">
        {/* Cabinet Arch Header */}
        <div className="flex items-center justify-between px-1 border-b border-amber-700/50 pb-1.5">
          <span className="text-xs font-black uppercase text-amber-200 tracking-wider flex items-center gap-1.5">
            <span>GRANDMA'S PANTRY SHELVES</span>
          </span>
          <span className="text-[10px] text-amber-300 font-bold bg-amber-900/60 border border-amber-600/40 px-2 py-0.5 rounded-full">
            Items Left: {gameState.totalItemsRemaining}
          </span>
        </div>

        {/* Shelves Stack */}
        <div className="flex flex-col gap-2.5">
          {gameState.shelves.map((shelf) => {
            const hasSpace = shelf.items.length < shelf.capacity;
            const isTargetCandidate = gameState.selectedShelfId !== null && gameState.selectedShelfId !== shelf.id && hasSpace;

            return (
              <div
                key={shelf.id}
                onClick={() => {
                  if (isTargetCandidate) {
                    onSlotClick(shelf.id);
                  }
                }}
                className={`relative bg-amber-950/80 border-2 rounded-2xl p-2 transition-all cursor-pointer ${
                  isTargetCandidate
                    ? 'border-emerald-400 ring-2 ring-emerald-400/50 bg-emerald-950/20'
                    : 'border-amber-800/60 hover:border-amber-600/60'
                }`}
              >
                {/* Wooden Shelf Base Planks */}
                <div className="flex items-center justify-around gap-2 h-16 sm:h-18">
                  {[0, 1, 2].map((slotIdx) => {
                    const item = shelf.items[slotIdx];
                    const isSelected = gameState.selectedShelfId === shelf.id && gameState.selectedItemIndex === slotIdx;

                    if (item) {
                      const goodConfig = PANTRY_GOODS_CONFIG[item.type];
                      return (
                        <div
                          key={slotIdx}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSlotClick(shelf.id, slotIdx);
                          }}
                          className={`flex-1 h-full rounded-xl flex items-center justify-center p-1 relative transition-all duration-150 cursor-pointer ${
                            isSelected
                              ? 'ring-4 ring-yellow-400 bg-yellow-400/25 -translate-y-2 scale-108 shadow-xl shadow-yellow-400/30'
                              : 'bg-black/40 hover:bg-black/30 border border-amber-700/40 shadow-inner'
                          }`}
                        >
                          <img
                            src={goodConfig.assetPath}
                            alt={goodConfig.name}
                            className="w-11 h-11 sm:w-13 sm:h-13 object-contain filter drop-shadow select-none pointer-events-none"
                          />
                        </div>
                      );
                    }

                    // Empty Slot
                    return (
                      <div
                        key={slotIdx}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (gameState.selectedShelfId !== null) {
                            onSlotClick(shelf.id);
                          }
                        }}
                        className={`flex-1 h-full rounded-xl border-2 border-dashed flex items-center justify-center transition-all ${
                          isTargetCandidate
                            ? 'border-emerald-400/80 bg-emerald-500/20 animate-pulse'
                            : 'border-amber-800/30 bg-black/20'
                        }`}
                      >
                        <span className="text-[10px] text-amber-600/40 font-mono font-bold">
                          {isTargetCandidate ? 'PLACE' : 'EMPTY'}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Stored Hidden Items Badge behind shelf */}
                {shelf.hiddenQueue.length > 0 && (
                  <div className="absolute -top-2 right-2 px-1.5 py-0.5 rounded-full bg-amber-600 border border-amber-300 text-[9px] font-black text-white shadow flex items-center gap-0.5">
                    <span>📦 +{shelf.hiddenQueue.length} reserve</span>
                  </div>
                )}

                {/* Wooden Shelf Edge Trim */}
                <div className="w-full h-1.5 bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-700 rounded-full mt-1.5 shadow" />
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. STRATEGY HINT FOOTER */}
      <div className="w-full mt-2.5 text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span>
          Tap any item, then tap an open slot to move it. Match <strong className="text-yellow-400">3 of the same goods</strong> on a shelf to clear!
        </span>
      </div>

      {/* 4. VICTORY / GAME OVER MODAL */}
      {(gameState.isWon || gameState.isGameOver) && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {gameState.isWon ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Pantry Sorted!</h3>
                <p className="text-xs text-slate-300 mb-4">
                  Sammy organized all the delicious farm goods and cleared the shelves!
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
                {levelNum < PANTRY_LEVELS.length ? (
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
                  ⌛
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Time's Up!</h3>
                <p className="text-xs text-slate-300 mb-4">
                  The farm breakfast arrived before all pantry goods could be sorted!
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

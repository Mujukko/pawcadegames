import React, { useState } from 'react';
import {
  BOTTLE_CAPACITY,
  canPour,
  COLOR_MAP,
  initWaterSortGame,
  pourWater,
  TOTAL_WATER_SORT_LEVELS,
  undoWaterSortMove,
} from './logic/engine';
import { Bottle, WaterSortState } from './logic/types';
import { waterSortAudio } from './systems/sound';
import { RotateCcw, Undo2, Volume2, VolumeX, Sparkles } from 'lucide-react';

export const WaterSortContainer: React.FC = () => {
  const [gameState, setGameState] = useState<WaterSortState>(() => initWaterSortGame(1));
  const [isMuted, setIsMuted] = useState(waterSortAudio.isMuted());

  const handleBottleClick = (bottle: Bottle) => {
    if (gameState.status !== 'playing') return;

    if (gameState.selectedBottleId === null) {
      // Cannot select empty bottle
      if (bottle.slots.length === 0 || bottle.completed) return;
      waterSortAudio.playSelect();
      setGameState((prev) => ({ ...prev, selectedBottleId: bottle.id }));
    } else if (gameState.selectedBottleId === bottle.id) {
      // Deselect
      setGameState((prev) => ({ ...prev, selectedBottleId: null }));
    } else {
      // Attempt Pour
      const source = gameState.bottles.find((b) => b.id === gameState.selectedBottleId)!;
      if (canPour(source, bottle)) {
        waterSortAudio.playPour();
        const nextState = pourWater(gameState, source.id, bottle.id);

        // Check if destination completed
        const dst = nextState.bottles.find((b) => b.id === bottle.id);
        if (dst?.completed) {
          waterSortAudio.playBottleComplete();
        }
        if (nextState.status === 'level_cleared') {
          waterSortAudio.playLevelClear();
        } else if (nextState.status === 'victory') {
          waterSortAudio.playLevelClear();
        }

        setGameState(nextState);
      } else {
        // Deselect or switch selection to new non-empty bottle
        if (bottle.slots.length > 0 && !bottle.completed) {
          waterSortAudio.playSelect();
          setGameState((prev) => ({ ...prev, selectedBottleId: bottle.id }));
        } else {
          setGameState((prev) => ({ ...prev, selectedBottleId: null }));
        }
      }
    }
  };

  const handleUndo = () => {
    setGameState((prev) => undoWaterSortMove(prev));
  };

  const handleRestart = () => {
    setGameState(initWaterSortGame(gameState.levelIndex));
  };

  const handleNextLevel = () => {
    const nextLvl = gameState.levelIndex + 1;
    if (nextLvl <= TOTAL_WATER_SORT_LEVELS) {
      setGameState(initWaterSortGame(nextLvl));
    }
  };

  const toggleSound = () => {
    const muted = waterSortAudio.toggleMute();
    setIsMuted(muted);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none touch-none">
      {/* Top Header */}
      <header className="w-full max-w-3xl px-4 py-2.5 flex items-center justify-between text-white border-b border-white/10 z-10 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🧪</span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base sm:text-lg text-amber-400">
              Water Sort: Farm Bottle Pour
            </span>
            <span className="text-xs text-white/70">
              Level {gameState.levelIndex} / {TOTAL_WATER_SORT_LEVELS}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-white font-bold text-xs sm:text-sm">
            Moves: {gameState.moves}
          </div>

          <button
            onClick={handleUndo}
            disabled={gameState.history.length === 0}
            aria-label="Undo move"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed text-white transition-colors"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={handleRestart}
            aria-label="Restart level"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </header>

      {/* Main Glass Bottle Shelf */}
      <main className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-4">
        {/* Farm Wooden Shelf Backdrop */}
        <div className="relative w-full max-w-2xl bg-amber-950/40 border border-amber-900/50 rounded-3xl p-6 sm:p-8 flex flex-wrap items-center justify-center gap-4 sm:gap-6 shadow-2xl backdrop-blur-xs">
          {gameState.bottles.map((bottle) => {
            const isSelected = gameState.selectedBottleId === bottle.id;
            return (
              <button
                key={bottle.id}
                onClick={() => handleBottleClick(bottle)}
                className={`group relative flex flex-col items-center transition-all duration-200 outline-none ${
                  isSelected ? '-translate-y-6 scale-105' : 'hover:-translate-y-1'
                }`}
              >
                {/* Bottle Neck & Cork */}
                <div className="w-6 h-3 bg-amber-200/50 rounded-t-md border-t-2 border-x-2 border-white/40" />

                {/* Glass Bottle Body */}
                <div
                  className={`relative w-14 sm:w-16 h-40 sm:h-44 rounded-b-2xl border-2 sm:border-3 flex flex-col-reverse p-1 overflow-hidden transition-colors ${
                    isSelected
                      ? 'border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)] bg-white/15'
                      : bottle.completed
                      ? 'border-emerald-400/80 bg-white/10 shadow-[0_0_15px_rgba(52,211,153,0.3)]'
                      : 'border-white/40 hover:border-white/70 bg-white/5'
                  }`}
                >
                  {/* Glass Gloss Line */}
                  <div className="absolute top-0 right-2 w-1.5 h-full bg-white/20 rounded-full pointer-events-none z-10" />

                  {/* Completed Star Badge */}
                  {bottle.completed && (
                    <div className="absolute top-2 inset-x-0 flex items-center justify-center pointer-events-none z-20">
                      <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                    </div>
                  )}

                  {/* Liquid Slots (Stacked from bottom to top) */}
                  {bottle.slots.map((colorKey, slotIdx) => {
                    const colorCfg = COLOR_MAP[colorKey];
                    return (
                      <div
                        key={slotIdx}
                        style={{ backgroundColor: colorCfg.hex }}
                        className="relative w-full h-1/4 rounded-sm transition-all duration-300 border-t border-white/20 shadow-inner flex items-center justify-center"
                      >
                        <div className="w-full h-1 bg-white/30 absolute top-0 rounded-full" />
                      </div>
                    );
                  })}

                  {/* Empty slots placeholders */}
                  {Array.from({ length: BOTTLE_CAPACITY - bottle.slots.length }).map((_, emptyIdx) => (
                    <div key={`empty_${emptyIdx}`} className="w-full h-1/4" />
                  ))}
                </div>

                {/* Base Shadow */}
                <div className="w-12 h-2 bg-black/40 rounded-full mt-2 filter blur-xs" />
              </button>
            );
          })}
        </div>

        {/* Level Cleared Modal */}
        {gameState.status === 'level_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-30">
            <span className="text-5xl mb-2">🎉</span>
            <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-amber-400 mb-1">
              Bottle Sort Cleared!
            </h2>
            <p className="text-sm text-white/80 mb-6 text-center max-w-sm">
              All drinks sorted cleanly in {gameState.moves} moves!
            </p>
            <button
              onClick={handleNextLevel}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
            >
              Next Level ➔
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center text-white p-6 z-30">
            <span className="text-6xl mb-3">🏆</span>
            <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-amber-400 mb-2">
              Master Drink Sorter!
            </h2>
            <p className="text-sm text-white/80 mb-6 text-center max-w-md">
              You solved all {TOTAL_WATER_SORT_LEVELS} farm drink stages with absolute precision!
            </p>
            <button
              onClick={() => setGameState(initWaterSortGame(1))}
              className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
            >
              Play Again 🔄
            </button>
          </div>
        )}
      </main>

      {/* Bottom Hint */}
      <footer className="w-full max-w-3xl px-4 py-3 flex items-center justify-center text-xs text-white/60 pb-safe">
        <span>Tap a bottle to lift, then tap another bottle with matching top color to pour.</span>
      </footer>
    </div>
  );
};

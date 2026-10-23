import React, { useState, useEffect, useCallback } from 'react';
import {
  CritterTapAwayState,
  initializeCritterLevel,
  tapCritter,
  isPathClear,
  CRITTER_LEVELS,
  CRITTER_CONFIGS,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Trophy,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CritterTapAwayContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<CritterTapAwayState>(() => initializeCritterLevel(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [shakeCritterId, setShakeCritterId] = useState<string | null>(null);
  const [escapingId, setEscapingId] = useState<string | null>(null);

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
    setGameState(initializeCritterLevel(lvl));
    setShakeCritterId(null);
    setEscapingId(null);
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleCritterClick = (critterId: string) => {
    if (gameState.isWon || gameState.isGameOver || escapingId !== null) return;

    const critter = gameState.critters.find(c => c.id === critterId);
    if (!critter) return;

    const clear = isPathClear(critter, gameState.critters, gameState.gridSize);

    if (!clear) {
      sound.playCritterBlocked();
      setShakeCritterId(critterId);
      setTimeout(() => setShakeCritterId(null), 400);
      setGameState(prev => ({ ...prev, moves: prev.moves + 1 }));
      return;
    }

    // Unobstructed - Escape!
    sound.playCritterEscape(critter.type);
    setEscapingId(critterId);

    setTimeout(() => {
      const { nextState } = tapCritter(gameState, critterId);
      setEscapingId(null);

      if (nextState.isWon && !gameState.isWon) {
        setTimeout(() => {
          sound.playVictory();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }, 250);
      }

      setGameState(nextState);
    }, 220);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-2 sm:p-4 select-none text-slate-100">
      {/* 1. TOP HEADER & HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center p-1 shadow-md border border-emerald-400/40">
            <span className="text-xl">🐮</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider">
              Level {gameState.level} of {CRITTER_LEVELS.length}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-tight font-mono">
              Escaped: <span className="text-emerald-400">{gameState.escapedCount}</span>
              <span className="text-slate-400 text-xs">/{gameState.initialCritterCount}</span>
            </div>
          </div>
        </div>

        {/* Level Selector & Quick Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex bg-slate-800 p-0.5 rounded-xl border border-slate-700">
            {CRITTER_LEVELS.map(l => (
              <button
                key={l.level}
                onClick={() => startLevel(l.level)}
                className={`px-2 py-1 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  levelNum === l.level
                    ? 'bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 shadow-md font-bold'
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
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
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

      {/* 2. THE BARNYARD PEN (1:1 Square Grid with Open Fences) */}
      <div className="relative w-full aspect-square max-w-[390px] bg-amber-950/90 border-4 border-amber-800 rounded-3xl p-2 shadow-2xl overflow-hidden mx-auto touch-none overscroll-none">
        {/* Pasture Grass Grid Checkerboard */}
        <div
          className="absolute inset-0 grid opacity-30 pointer-events-none"
          style={{
            gridTemplateColumns: `repeat(${gameState.gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gameState.gridSize}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: gameState.gridSize * gameState.gridSize }).map((_, i) => {
            const row = Math.floor(i / gameState.gridSize);
            const col = i % gameState.gridSize;
            const isDark = (row + col) % 2 === 0;
            return (
              <div
                key={i}
                className={`border border-amber-600/20 ${isDark ? 'bg-amber-900/40' : 'bg-amber-800/20'}`}
              />
            );
          })}
        </div>

        {/* 4 Open Perimeter Gate Exits */}
        <div className="absolute top-0 inset-x-0 h-3 bg-gradient-to-b from-emerald-500/40 to-transparent pointer-events-none z-10 flex items-center justify-center">
          <ArrowUp className="w-3 h-3 text-emerald-400/80" />
        </div>
        <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-t from-emerald-500/40 to-transparent pointer-events-none z-10 flex items-center justify-center">
          <ArrowDown className="w-3 h-3 text-emerald-400/80" />
        </div>
        <div className="absolute left-0 inset-y-0 w-3 bg-gradient-to-r from-emerald-500/40 to-transparent pointer-events-none z-10 flex items-center justify-center">
          <ArrowLeft className="w-3 h-3 text-emerald-400/80" />
        </div>
        <div className="absolute right-0 inset-y-0 w-3 bg-gradient-to-l from-emerald-500/40 to-transparent pointer-events-none z-10 flex items-center justify-center">
          <ArrowRight className="w-3 h-3 text-emerald-400/80" />
        </div>

        {/* RENDER CRITTERS */}
        {gameState.critters.map(critter => {
          const config = CRITTER_CONFIGS[critter.type];
          const isClear = isPathClear(critter, gameState.critters, gameState.gridSize);
          const isShaking = shakeCritterId === critter.id;
          const isEscaping = escapingId === critter.id;

          const leftPercent = (critter.x / gameState.gridSize) * 100;
          const topPercent = (critter.y / gameState.gridSize) * 100;
          const sizePercent = (1 / gameState.gridSize) * 100;

          // Direction Arrow
          const dirArrow =
            critter.direction === 'up' ? (
              <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            ) : critter.direction === 'down' ? (
              <ArrowDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            ) : critter.direction === 'left' ? (
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            ) : (
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
            );

          // Escape Transform Style
          let escapeTransform = '';
          if (isEscaping) {
            if (critter.direction === 'up') escapeTransform = 'translate-y-[-220%] opacity-0 scale-120';
            else if (critter.direction === 'down') escapeTransform = 'translate-y-[220%] opacity-0 scale-120';
            else if (critter.direction === 'left') escapeTransform = 'translate-x-[-220%] opacity-0 scale-120';
            else escapeTransform = 'translate-x-[220%] opacity-0 scale-120';
          }

          return (
            <button
              key={critter.id}
              onClick={() => handleCritterClick(critter.id)}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${sizePercent}%`,
                height: `${sizePercent}%`,
              }}
              className={`absolute p-0.5 sm:p-1 cursor-pointer transition-all duration-200 select-none ${
                isShaking ? 'animate-shake' : ''
              } ${escapeTransform}`}
            >
              <div
                className={`w-full h-full rounded-2xl border-2 sm:border-3 flex flex-col items-center justify-between p-1 shadow-lg relative transition-all active:scale-95 ${
                  config.borderColor
                } ${
                  isClear
                    ? 'ring-2 ring-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)] bg-slate-900/95 hover:scale-103'
                    : 'bg-slate-900/80 opacity-90'
                }`}
              >
                {/* Direction Chevron Badge */}
                <div
                  className={`w-full flex items-center justify-center p-0.5 rounded-md shadow-sm leading-none ${
                    isClear
                      ? 'bg-emerald-500 text-slate-950 font-black animate-pulse'
                      : 'bg-black/50 text-white/70'
                  }`}
                >
                  {dirArrow}
                </div>

                {/* Cute 3D Animal Face Tile */}
                <div className="w-full flex-1 flex items-center justify-center p-0.5 min-w-0 min-h-0">
                  <img
                    src={config.assetPath}
                    alt={config.name}
                    className="w-full h-full object-contain filter drop-shadow select-none pointer-events-none"
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. STRATEGY HINT FOOTER */}
      <div className="w-full mt-2.5 text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <span>
          Tap <strong className="text-emerald-400">Green Glowing Animals</strong> whose arrows point to open exits to free them!
        </span>
      </div>

      {/* 4. VICTORY MODAL */}
      {gameState.isWon && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
              🎉
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Barnyard Escaped!</h3>
            <p className="text-xs text-slate-300 mb-4">
              All farm critters safely untangled and bounded off into the green clover pasture!
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
            {levelNum < CRITTER_LEVELS.length ? (
              <button
                onClick={() => startLevel(levelNum + 1)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <span>NEXT LEVEL</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                onClick={() => startLevel(1)}
                className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                <span>PLAY AGAIN</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

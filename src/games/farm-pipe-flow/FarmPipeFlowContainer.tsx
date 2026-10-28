import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  rotateTile,
  undoRotate,
  PIPE_CAMPAIGN_LEVELS,
} from './logic/engine';
import { PipeGameState, PipeTile, DIR_NORTH, DIR_EAST, DIR_SOUTH, DIR_WEST } from './logic/types';
import { pipeSound } from './systems/sound';
import { analytics } from '../../lib/analytics';

const STORAGE_KEY = 'pawcade_pipe_flow_high_score';

export const FarmPipeFlowContainer: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<PipeGameState>(() => createInitialState(0));
  const [isMuted, setIsMuted] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Initialize and load high score
  useEffect(() => {
    let saved = 0;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) saved = parseInt(v, 10) || 0;
    } catch {
      // LocalStorage fallback
    }
    setHighScore(saved);
    setGameState(createInitialState(0, saved));

    analytics.gameStarted('farm-pipe-flow');
    analytics.track('level_started', { gameId: 'farm-pipe-flow', levelId: 1 });

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      pipeSound.setMuted(next);
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    const fresh = createInitialState(levelIndex, highScore);
    setGameState(fresh);
    analytics.track('game_restarted', { gameId: 'farm-pipe-flow', levelId: levelIndex + 1 });
  }, [levelIndex, highScore]);

  const handleNextLevel = () => {
    const nextIdx = (levelIndex + 1) % PIPE_CAMPAIGN_LEVELS.length;
    setLevelIndex(nextIdx);
    const fresh = createInitialState(nextIdx, gameState.highScore);
    fresh.score = gameState.score; // Preserve score across stages
    setGameState(fresh);

    analytics.track('level_started', { gameId: 'farm-pipe-flow', levelId: nextIdx + 1 });
  };

  const handleUndo = () => {
    if (gameState.history.length === 0 || gameState.status !== 'playing') return;
    const cloned = { ...gameState };
    const success = undoRotate(cloned);
    if (success) {
      pipeSound.playUndo();
      setGameState({ ...cloned });
    }
  };

  const handleTileClick = (row: number, col: number) => {
    if (gameState.status !== 'playing') return;

    const cloned = { ...gameState };
    const prevFlow = cloned.waterFlowPercent;
    const res = rotateTile(cloned, row, col);

    if (res.success) {
      pipeSound.playPipeRotate();

      if (res.newFlowPercent > prevFlow) {
        pipeSound.playWaterRush();
      }

      if (res.isWon) {
        pipeSound.playCropWatered();
        pipeSound.playVictory();
        analytics.track('level_completed', {
          gameId: 'farm-pipe-flow',
          levelId: cloned.level,
          moves: cloned.moves,
        });

        if (cloned.score > highScore) {
          setHighScore(cloned.score);
          try {
            localStorage.setItem(STORAGE_KEY, cloned.score.toString());
          } catch {
            // LocalStorage ignore
          }
        }
      }

      setGameState({ ...cloned });
    }
  };

  const currentLevelConfig = PIPE_CAMPAIGN_LEVELS[levelIndex] || PIPE_CAMPAIGN_LEVELS[0]!;

  // Helper to render internal SVG pipe arms
  const renderPipeShape = (tile: PipeTile) => {
    const hasN = !!(tile.ports & DIR_NORTH);
    const hasE = !!(tile.ports & DIR_EAST);
    const hasS = !!(tile.ports & DIR_SOUTH);
    const hasW = !!(tile.ports & DIR_WEST);

    const pipeColor = tile.hasWater ? '#38bdf8' : '#d97706';
    const pipeCoreColor = tile.hasWater ? '#0284c7' : '#92400e';
    const waterColor = '#7dd3fc';

    if (tile.type === 'source') {
      return (
        <div className="relative w-full h-full flex items-center justify-center bg-red-900/60 rounded-xl border-2 border-red-500 shadow-md">
          <span className="text-2xl select-none leading-none">🚰</span>
          {/* Outlet Spigot */}
          <div
            className={`absolute w-3.5 h-3.5 rounded-full ${
              hasE ? 'right-0 top-1/2 -translate-y-1/2' : 'bottom-0 left-1/2 -translate-x-1/2'
            } bg-sky-400 animate-pulse`}
          />
        </div>
      );
    }

    if (tile.type === 'target') {
      return (
        <div
          className={`relative w-full h-full flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-300 shadow-md ${
            tile.hasWater
              ? 'bg-emerald-900/70 border-emerald-400 shadow-emerald-500/30'
              : 'bg-stone-900/80 border-stone-600'
          }`}
        >
          <span className="text-2xl select-none leading-none">
            {tile.targetLabel?.split(' ')[0] || '🥕'}
          </span>
          {tile.hasWater && (
            <span className="absolute -top-1 -right-1 text-xs animate-bounce select-none">
              ✨
            </span>
          )}
        </div>
      );
    }

    return (
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full transition-transform duration-200 select-none pointer-events-none"
      >
        {/* Background Pipe Tube (Dark Border) */}
        {hasN && <rect x="36" y="0" width="28" height="50" fill={pipeCoreColor} />}
        {hasS && <rect x="36" y="50" width="28" height="50" fill={pipeCoreColor} />}
        {hasW && <rect x="0" y="36" width="50" height="28" fill={pipeCoreColor} />}
        {hasE && <rect x="50" y="36" width="50" height="28" fill={pipeCoreColor} />}
        <circle cx="50" cy="50" r="14" fill={pipeCoreColor} />

        {/* Foreground Pipe Tube (Copper or Blue) */}
        {hasN && <rect x="40" y="0" width="20" height="50" fill={pipeColor} />}
        {hasS && <rect x="40" y="50" width="20" height="50" fill={pipeColor} />}
        {hasW && <rect x="0" y="40" width="50" height="20" fill={pipeColor} />}
        {hasE && <rect x="50" y="40" width="50" height="20" fill={pipeColor} />}
        <circle cx="50" cy="50" r="10" fill={pipeColor} />

        {/* Water Stream Core (if flowing) */}
        {tile.hasWater && (
          <g>
            {hasN && <rect x="44" y="0" width="12" height="50" fill={waterColor} />}
            {hasS && <rect x="44" y="50" width="12" height="50" fill={waterColor} />}
            {hasW && <rect x="0" y="44" width="50" height="12" fill={waterColor} />}
            {hasE && <rect x="50" y="44" width="50" height="12" fill={waterColor} />}
            <circle cx="50" cy="50" r="6" fill={waterColor} />
          </g>
        )}

        {/* Flange / Valve Center Details */}
        <circle cx="50" cy="50" r="4" fill="#facc15" />
      </svg>
    );
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full max-w-[440px] mx-auto select-none touch-none py-2 px-1 text-slate-100"
      style={{ touchAction: 'none' }}
    >
      {/* TOP HUD CARD */}
      <div className="w-full flex items-center justify-between bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 mb-2 shadow-lg">
        {/* Level Name & Moves */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
              L{gameState.level}: {currentLevelConfig.name}
            </span>
            <span className="text-xl font-extrabold text-white leading-tight">
              {gameState.moves} <span className="text-xs font-normal text-slate-400">turns</span>
            </span>
          </div>
          <div className="h-7 w-[1px] bg-slate-700/70" />
          {/* Water Flow Percentage Meter */}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Water Flow
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`text-sm font-extrabold leading-tight ${
                  gameState.waterFlowPercent === 100 ? 'text-emerald-400' : 'text-sky-300'
                }`}
              >
                {gameState.waterFlowPercent}%
              </span>
              <span className="text-xs">💧</span>
            </div>
          </div>
        </div>

        {/* Action Controls (>= 44x44px touch targets) */}
        <div className="flex items-center gap-1.5">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={gameState.history.length === 0 || gameState.status !== 'playing'}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-700/60 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 active:scale-95 transition-all text-base border border-slate-600/50"
            title="Undo Rotation (U)"
            aria-label="Undo Move"
          >
            ↩️
          </button>

          {/* Sound Toggle */}
          <button
            onClick={toggleMute}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all text-base border border-slate-600/50"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 active:scale-95 transition-all text-base border border-sky-500/40"
            title="Restart Stage (R)"
            aria-label="Restart Game"
          >
            🔄
          </button>
        </div>
      </div>

      {/* MAIN PIPE IRRIGATION GRID BOARD */}
      <div className="relative w-full aspect-[400/440] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-gradient-to-b from-stone-900 via-stone-950 to-slate-900 p-3 sm:p-4 flex items-center justify-center">
        {/* Soil Grid Container */}
        <div
          className="grid gap-2 w-full h-full max-w-[380px] max-h-[380px]"
          style={{
            gridTemplateRows: `repeat(${gameState.rows}, minmax(0, 1fr))`,
            gridTemplateColumns: `repeat(${gameState.cols}, minmax(0, 1fr))`,
          }}
        >
          {gameState.grid.map((row, r) =>
            row.map((tile, c) => (
              <div
                key={`${r}-${c}`}
                onClick={() => handleTileClick(r, c)}
                className={`relative w-full h-full rounded-xl flex items-center justify-center p-1 cursor-pointer transition-all duration-150 border select-none ${
                  tile.isFixed
                    ? 'border-transparent cursor-default'
                    : 'bg-stone-800/80 hover:bg-stone-700/80 active:scale-95 border-stone-600/60 shadow-sm'
                }`}
              >
                {renderPipeShape(tile)}

                {/* Subtle turn hint for non-fixed tiles */}
                {!tile.isFixed && !tile.hasWater && (
                  <span className="absolute bottom-1 right-1 text-[9px] text-stone-500 font-bold opacity-40">
                    ↻
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Victory Celebration Modal */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center animate-fade-in z-30">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border-2 border-emerald-500/50 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🌊
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Crops Watered!</h2>
            <p className="text-xs text-slate-300 max-w-[240px] mb-4">
              Water is rushing through the irrigation pipeline! All garden crops and animal troughs are fully watered!
            </p>

            <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-3 mb-5 w-full max-w-[220px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Stage Score
              </span>
              <span className="text-3xl font-extrabold text-sky-400">{gameState.score}</span>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full max-w-[220px] h-12 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-400 hover:to-blue-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-sky-300/40"
            >
              <span>Next Stage</span>
              <span>➡️</span>
            </button>
          </div>
        )}
      </div>

      {/* FLOW HINT FOOTER */}
      <div className="w-full mt-2 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Plumber Tip:
        </span>
        <span className="text-xs text-slate-300 font-medium">
          Tap pipe joints to turn 90°. Connect from 🚰 pump to every 🥕 crop plot!
        </span>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  pickTile,
  undoMove,
  shuffleBoard,
  CAMPAIGN_LEVELS,
  FARM_TILES_META,
  MAX_TRAY_CAPACITY,
} from './logic/engine';
import { TileTripleState, BoardTile } from './logic/types';
import { tileTripleSound } from './systems/sound';
import { analytics } from '../../lib/analytics';

interface BurstParticle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
}

interface FloatingScore {
  id: number;
  x: number;
  y: number;
  text: string;
  alpha: number;
}

const STORAGE_KEY = 'pawcade_tile_triple_high_score';

export const FarmTileTripleContainer: React.FC = () => {
  const [levelIndex, setLevelIndex] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameState, setGameState] = useState<TileTripleState>(() => createInitialState(0));
  const [isMuted, setIsMuted] = useState(false);
  const [burstParticles, setBurstParticles] = useState<BurstParticle[]>([]);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
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

    analytics.gameStarted('farm-tile-triple');
    analytics.track('level_started', { gameId: 'farm-tile-triple', levelId: 1 });

    // Keyboard controls
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 's' || e.key === 'S') {
        handleShuffle();
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
      tileTripleSound.setMuted(next);
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    const fresh = createInitialState(levelIndex, highScore);
    setGameState(fresh);
    setBurstParticles([]);
    setFloatingScores([]);

    analytics.track('game_restarted', { gameId: 'farm-tile-triple', levelId: levelIndex + 1 });
  }, [levelIndex, highScore]);

  const handleNextLevel = () => {
    const nextIdx = (levelIndex + 1) % CAMPAIGN_LEVELS.length;
    setLevelIndex(nextIdx);
    const fresh = createInitialState(nextIdx, gameState.highScore);
    fresh.score = gameState.score; // Preserve score across levels
    setGameState(fresh);
    setBurstParticles([]);
    setFloatingScores([]);

    analytics.track('level_started', { gameId: 'farm-tile-triple', levelId: nextIdx + 1 });
  };

  const handleUndo = () => {
    if (gameState.history.length === 0 || gameState.status !== 'playing') return;
    const cloned = { ...gameState };
    const success = undoMove(cloned);
    if (success) {
      tileTripleSound.playUndo();
      setGameState({ ...cloned });
    }
  };

  const handleShuffle = () => {
    if (gameState.status !== 'playing') return;
    const cloned = { ...gameState };
    const success = shuffleBoard(cloned);
    if (success) {
      tileTripleSound.playShuffle();
      setGameState({ ...cloned });
    }
  };

  const spawnMatchCelebration = (matchedType: string) => {
    const meta = FARM_TILES_META[matchedType as keyof typeof FARM_TILES_META] || FARM_TILES_META.apple;
    const now = Date.now();

    // Spawn 16 celebration star particles around the tray
    const newParticles: BurstParticle[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16;
      const speed = 70 + Math.random() * 80;
      newParticles.push({
        id: now + i,
        x: 180 + (Math.random() - 0.5) * 60,
        y: 430,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 40,
        color: i % 2 === 0 ? meta.borderColor : '#fde047',
        size: 4 + Math.random() * 4,
        alpha: 1,
      });
    }
    setBurstParticles(newParticles);

    // Spawn floating score popup
    setFloatingScores((prev) => [
      ...prev,
      { id: now, x: 180, y: 395, text: '+300 TRIPLE!', alpha: 1 },
    ]);

    setTimeout(() => {
      setBurstParticles([]);
    }, 600);

    setTimeout(() => {
      setFloatingScores((prev) => prev.filter((fs) => fs.id !== now));
    }, 750);
  };

  const handleTileClick = (tile: BoardTile) => {
    if (gameState.status !== 'playing' || tile.inTray || tile.cleared) return;

    if (tile.isBlocked) {
      tileTripleSound.playTileBlocked();
      return;
    }

    const cloned = { ...gameState };
    const res = pickTile(cloned, tile.id);

    if (res.success) {
      tileTripleSound.playTilePick();

      if (res.matchedType) {
        tileTripleSound.playMatch();
        spawnMatchCelebration(res.matchedType);
      }

      if (cloned.score > highScore) {
        setHighScore(cloned.score);
        try {
          localStorage.setItem(STORAGE_KEY, cloned.score.toString());
        } catch {
          // LocalStorage fallback
        }
      }

      if (cloned.status === 'won') {
        tileTripleSound.playVictory();
        analytics.track('level_completed', {
          gameId: 'farm-tile-triple',
          levelId: cloned.level,
          moves: cloned.moves,
        });
      } else if (cloned.status === 'lost') {
        tileTripleSound.playGameOver();
        analytics.track('game_over', {
          gameId: 'farm-tile-triple',
          score: cloned.score,
          levelId: cloned.level,
        });
      }

      setGameState({ ...cloned });
    }
  };

  const currentLevelConfig = CAMPAIGN_LEVELS[levelIndex] || CAMPAIGN_LEVELS[0]!;
  const unclearedBoardTiles = gameState.tiles.filter((t) => !t.cleared && !t.inTray);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full max-w-[440px] mx-auto select-none touch-none py-2 px-1 text-slate-100"
      style={{ touchAction: 'none' }}
    >
      {/* TOP HUD CARD */}
      <div className="w-full flex items-center justify-between bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 mb-2 shadow-lg">
        {/* Score & Stage Name */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Score</span>
            <span className="text-xl font-extrabold text-white leading-tight">{gameState.score}</span>
          </div>
          <div className="h-7 w-[1px] bg-slate-700/70" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              L{gameState.level}: {currentLevelConfig.name}
            </span>
            <span className="text-xs font-bold text-slate-300 leading-tight">
              {unclearedBoardTiles.length} tiles left
            </span>
          </div>
        </div>

        {/* Action Boosters & Controls (>= 44x44px touch targets) */}
        <div className="flex items-center gap-1.5">
          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={gameState.history.length === 0 || gameState.status !== 'playing'}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-700/60 hover:bg-slate-700 disabled:opacity-40 disabled:pointer-events-none text-slate-200 active:scale-95 transition-all text-base border border-slate-600/50"
            title="Undo Last Pick (U)"
            aria-label="Undo Move"
          >
            ↩️
          </button>

          {/* Shuffle Booster */}
          <button
            onClick={handleShuffle}
            disabled={gameState.status !== 'playing' || unclearedBoardTiles.length <= 1}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-purple-500/20 hover:bg-purple-500/30 disabled:opacity-40 disabled:pointer-events-none text-purple-300 active:scale-95 transition-all text-base border border-purple-500/40"
            title="Shuffle Board Tiles (S)"
            aria-label="Shuffle Tiles"
          >
            🔀
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
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 active:scale-95 transition-all text-base border border-amber-500/40"
            title="Restart Level (R)"
            aria-label="Restart Game"
          >
            🔄
          </button>
        </div>
      </div>

      {/* MAIN GAME BOARD AREA */}
      <div className="relative w-full aspect-[400/520] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-gradient-to-b from-amber-950/40 via-stone-900 to-slate-900">
        {/* Subtle Rustic Wood Grain Board Lines */}
        <div className="absolute inset-0 opacity-15 pointer-events-none">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-full border-b border-amber-300/30"
              style={{ top: `${(i + 1) * 12.5}%`, position: 'absolute' }}
            />
          ))}
        </div>

        {/* Board Tiles Layered View */}
        <div className="relative w-full h-[390px] overflow-hidden">
          {gameState.tiles
            .filter((t) => !t.cleared && !t.inTray)
            .sort((a, b) => a.layer - b.layer) // Layer 0 renders first, higher layers on top
            .map((tile) => {
              const meta = FARM_TILES_META[tile.type];
              return (
                <div
                  key={tile.id}
                  onClick={() => handleTileClick(tile)}
                  style={{
                    left: `${tile.x}px`,
                    top: `${tile.y}px`,
                    width: `${tile.width}px`,
                    height: `${tile.height}px`,
                    borderColor: tile.isBlocked ? '#475569' : meta.borderColor,
                    zIndex: tile.layer * 10 + 1,
                  }}
                  className={`absolute rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-150 shadow-md ${
                    tile.isBlocked
                      ? 'bg-slate-800/90 border border-slate-600/60 opacity-60 grayscale-[40%] cursor-not-allowed'
                      : 'bg-white border-2 hover:scale-105 active:scale-95 shadow-lg'
                  }`}
                >
                  <span className="text-2xl select-none leading-none drop-shadow-sm">
                    {meta.emoji}
                  </span>

                  {/* Dark lock overlay badge for covered tiles */}
                  {tile.isBlocked && (
                    <div className="absolute inset-0 bg-slate-950/40 rounded-xl flex items-center justify-center">
                      <span className="text-xs opacity-75">🔒</span>
                    </div>
                  )}
                </div>
              );
            })}
        </div>

        {/* 7-SLOT HOLDING TRAY CONTAINER */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[95%] max-w-[390px] bg-gradient-to-r from-amber-900 via-amber-800 to-amber-900 border-2 border-amber-500/70 rounded-2xl p-2 shadow-2xl">
          <div className="grid grid-cols-7 gap-1.5 w-full h-[64px]">
            {Array.from({ length: MAX_TRAY_CAPACITY }).map((_, slotIdx) => {
              const trayTile = gameState.tray[slotIdx];
              const meta = trayTile ? FARM_TILES_META[trayTile.type] : null;

              return (
                <div
                  key={slotIdx}
                  className="w-full h-full rounded-xl bg-slate-950/70 border border-amber-600/40 flex items-center justify-center overflow-hidden shadow-inner relative"
                >
                  {trayTile && meta ? (
                    <div
                      className="w-[90%] h-[90%] rounded-lg bg-white border flex items-center justify-center shadow-md animate-pop-in"
                      style={{ borderColor: meta.borderColor }}
                    >
                      <span className="text-2xl select-none leading-none">
                        {meta.emoji}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-amber-500/20 font-black">{slotIdx + 1}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Visual Celebration Particles on 3-Match */}
        {burstParticles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
            }}
            className="absolute rounded-full pointer-events-none transition-all duration-300"
          />
        ))}

        {/* Floating Combo Score */}
        {floatingScores.map((fs) => (
          <div
            key={fs.id}
            style={{ left: `${fs.x}px`, top: `${fs.y}px` }}
            className="absolute -translate-x-1/2 font-black text-amber-300 text-sm tracking-wider drop-shadow-md animate-bounce pointer-events-none"
          >
            {fs.text}
          </div>
        ))}

        {/* Victory Celebration Modal */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center animate-fade-in z-30">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🎉
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Stage Clear!</h2>
            <p className="text-xs text-slate-300 max-w-[240px] mb-4">
              Brilliant harvest! You cleared all barnyard crop tiles and scored full triple points!
            </p>

            <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-3 mb-5 w-full max-w-[220px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Total Score
              </span>
              <span className="text-3xl font-extrabold text-amber-400">{gameState.score}</span>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full max-w-[220px] h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-emerald-300/40"
            >
              <span>Next Stage</span>
              <span>➡️</span>
            </button>
          </div>
        )}

        {/* Defeat / Tray Full Modal */}
        {gameState.status === 'lost' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center animate-fade-in z-30">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🧺
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Tray Jammed!</h2>
            <p className="text-xs text-slate-300 max-w-[240px] mb-4">
              All 7 tray slots filled up with no 3-matching tiles. Use Undo or plan your tile picks in triplets!
            </p>

            <div className="flex gap-2 w-full max-w-[240px]">
              <button
                onClick={handleUndo}
                className="flex-1 h-11 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl border border-slate-600 transition-all flex items-center justify-center gap-1.5"
              >
                <span>↩️ Undo</span>
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 h-11 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5"
              >
                <span>🔄 Restart</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* TILE ENCYCLOPEDIA FOOTER */}
      <div className="w-full mt-2 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
          Crops:
        </span>
        <div className="flex items-center gap-2 shrink-0 text-sm">
          {Object.values(FARM_TILES_META).map((meta) => (
            <span
              key={meta.type}
              className="w-7 h-7 rounded-lg bg-white border flex items-center justify-center shadow-xs"
              style={{ borderColor: meta.borderColor }}
              title={`${meta.name} (+300 pts on 3-match)`}
            >
              {meta.emoji}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

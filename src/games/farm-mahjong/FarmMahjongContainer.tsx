import React, { useState, useEffect, useRef } from 'react';
import {
  createInitialMahjongState,
  selectTile,
  undoMove,
  shuffleRemaining,
  getHint,
  isTileFree,
  MahjongState,
  MahjongTile,
  MAHJONG_LAYOUTS,
} from './logic/engine';
import { mahjongAudio } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, Lightbulb, Shuffle, Undo2, Trophy, Star } from 'lucide-react';
import { analytics } from '../../lib/analytics';

interface FarmMahjongContainerProps {
  onBack?: () => void;
}

export const FarmMahjongContainer: React.FC<FarmMahjongContainerProps> = () => {
  const [level, setLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<MahjongState>(() => {
    let savedHighScore = 0;
    try {
      savedHighScore = parseInt(localStorage.getItem('pawcade_mahjong_highscore') || '0', 10);
    } catch {}
    return createInitialMahjongState(1, savedHighScore);
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => mahjongAudio.getMuted());
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; text: string }[]>([]);

  useEffect(() => {
    analytics.track('level_started', { gameId: 'farm-mahjong', levelId: 1 });
  }, []);

  // Update high score in local storage
  useEffect(() => {
    try {
      if (gameState.highScore > 0) {
        localStorage.setItem('pawcade_mahjong_highscore', gameState.highScore.toString());
      }
    } catch {}
  }, [gameState.highScore]);

  // Handle tile click
  const handleTileClick = (tileId: string, clientX: number, clientY: number) => {
    if (gameState.isComplete) return;

    const tile = gameState.tiles.find((t) => t.id === tileId);
    if (!tile || tile.matched || !isTileFree(tile.id, gameState.tiles)) {
      return;
    }

    mahjongAudio.playTileClick();

    const nextState = { ...gameState, tiles: [...gameState.tiles] };
    const result = selectTile(nextState, tileId);

    if (result.success && result.matchedPair) {
      mahjongAudio.playTileMatch(result.combo);

      // Add celebratory floating particle
      const pId = `part-${Date.now()}`;
      setParticles((prev) => [
        ...prev,
        {
          id: pId,
          x: clientX,
          y: clientY,
          text: `+${result.pointsAwarded} ${result.combo > 1 ? `x${result.combo}!` : ''}`,
        },
      ]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== pId));
      }, 1000);

      if (result.isGameComplete) {
        analytics.levelCompleted('farm-mahjong', {
          levelId: level,
          score: nextState.score,
          moves: nextState.matchesMade,
        });
        mahjongAudio.playVictoryFanfare();
      } else if (result.combo >= 3) {
        analytics.scoreMilestone('farm-mahjong', nextState.score, `${result.combo}x streak`);
      }
    }

    setGameState(nextState);
  };

  const handleHint = () => {
    if (gameState.isComplete) return;
    const nextState = { ...gameState };
    const hint = getHint(nextState);
    if (hint) {
      mahjongAudio.playHintSparkle();
      setGameState(nextState);
    }
  };

  const handleShuffle = () => {
    if (gameState.isComplete) return;
    const nextState = { ...gameState, tiles: [...gameState.tiles] };
    const shuffled = shuffleRemaining(nextState);
    if (shuffled) {
      mahjongAudio.playShuffle();
      setGameState(nextState);
    }
  };

  const handleUndo = () => {
    if (gameState.isComplete || gameState.history.length === 0) return;
    const nextState = { ...gameState, tiles: [...gameState.tiles] };
    const undone = undoMove(nextState);
    if (undone) {
      mahjongAudio.playUndo();
      setGameState(nextState);
    }
  };

  const handleRestart = (newLevel: number = level, isRestart = false) => {
    if (isRestart) {
      analytics.gameRestarted('farm-mahjong', { levelId: newLevel });
    } else {
      analytics.track('level_started', { gameId: 'farm-mahjong', levelId: newLevel });
    }
    const nextState = createInitialMahjongState(newLevel, gameState.highScore);
    setLevel(newLevel);
    setGameState(nextState);
  };

  const toggleMute = () => {
    const muted = mahjongAudio.toggleMute();
    setIsMuted(muted);
  };

  // Convert (x, y, z) into responsive coordinates
  // Grid width is ~16 units, height is ~10 units
  const getTileStyle = (tile: MahjongTile) => {
    const unitX = 6.2; // percentage per x unit
    const unitY = 9.8; // percentage per y unit
    const zOffset = tile.z * 3.5; // pixel offset for 3D elevation

    const isSelected = gameState.selectedTileId === tile.id;
    const isHinted = gameState.hints && gameState.hints.includes(tile.id);
    const free = isTileFree(tile.id, gameState.tiles);

    return {
      left: `${tile.x * unitX}%`,
      top: `${tile.y * unitY}%`,
      transform: `translate(${-zOffset}px, ${-zOffset}px)`,
      zIndex: tile.z * 10 + Math.floor(tile.y) + (isSelected ? 50 : 0),
      opacity: tile.matched ? 0 : 1,
      pointerEvents: (tile.matched ? 'none' : 'auto') as React.CSSProperties['pointerEvents'],
      boxShadow: `${zOffset + 2}px ${zOffset + 4}px 6px rgba(0,0,0,0.45)`,
    };
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto select-none font-sans">
      {/* Top HUD Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-950/95 rounded-t-2xl border-t border-x border-slate-700/80 text-white shadow-xl">
        {/* Level Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[
            { id: 1, label: 'L1: Barn', pairs: 18 },
            { id: 2, label: 'L2: Arch', pairs: 22 },
            { id: 3, label: 'L3: Mansion', pairs: 26 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRestart(tab.id)}
              className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                level === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-102'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Matches & Combo Badge */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              PAIRS
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-300">
              {gameState.matchesMade} / {gameState.totalPairs}
            </span>
          </div>

          {gameState.combo > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs animate-pulse shadow-md">
              x{gameState.combo} STREAK!
            </span>
          )}

          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              SCORE
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
              {gameState.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Quick Audio & Restart */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            aria-label="Toggle Sound"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => handleRestart(level, true)}
            aria-label="Restart Board"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main 3D Mahjong Board Arena */}
      <div
        style={{
          aspectRatio: '16 / 10',
          touchAction: 'none',
        }}
        className="relative w-full overflow-hidden bg-gradient-to-br from-amber-950 via-stone-900 to-slate-950 border-x border-slate-700/80 p-2 sm:p-4 shadow-2xl flex items-center justify-center"
      >
        {/* Felt / Wood Table Texture Accent */}
        <div className="absolute inset-2 sm:inset-4 rounded-2xl border-2 border-amber-600/30 bg-amber-950/20 backdrop-blur-xs pointer-events-none" />

        {/* 3D Isometric Tile Grid Layer */}
        <div className="relative w-full h-full max-w-3xl">
          {gameState.tiles.map((tile) => {
            if (tile.matched) return null;
            const free = isTileFree(tile.id, gameState.tiles);
            const isSelected = gameState.selectedTileId === tile.id;
            const isHinted = gameState.hints && gameState.hints.includes(tile.id);

            return (
              <button
                key={tile.id}
                onClick={(e) => handleTileClick(tile.id, e.clientX, e.clientY)}
                disabled={!free}
                style={getTileStyle(tile)}
                className={`absolute w-[11.8%] h-[17.5%] sm:w-[11.2%] sm:h-[18.2%] rounded-lg sm:rounded-xl flex flex-col items-center justify-center transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-b from-amber-100 to-amber-200 border-2 sm:border-3 border-amber-400 ring-4 ring-amber-400/50 scale-106'
                    : isHinted
                    ? 'bg-gradient-to-b from-emerald-100 to-emerald-200 border-2 sm:border-3 border-emerald-400 ring-4 ring-emerald-400/50 animate-bounce'
                    : free
                    ? 'bg-gradient-to-b from-amber-50 via-stone-100 to-amber-100 border border-amber-200/90 hover:brightness-105 active:scale-96'
                    : 'bg-stone-300/80 border border-stone-400/60 opacity-60 cursor-not-allowed saturate-70'
                }`}
              >
                {/* 3D Tile Bevel Surface */}
                <div className="w-full h-full p-0.5 sm:p-1 flex flex-col items-center justify-between rounded-lg">
                  <span className="text-xl sm:text-3xl drop-shadow-sm select-none leading-none">
                    {tile.icon}
                  </span>
                  <span
                    className={`text-[8px] sm:text-[10px] font-black uppercase tracking-tight truncate max-w-full leading-none select-none ${
                      free ? 'text-amber-950' : 'text-stone-600'
                    }`}
                  >
                    {tile.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Floating Particle Scores */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y - 30}px`,
            }}
            className="fixed pointer-events-none z-50 text-sm sm:text-base font-black text-amber-300 drop-shadow-md animate-fade-out"
          >
            {p.text}
          </div>
        ))}

        {/* Level Complete Celebration Overlay */}
        {gameState.isComplete && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in p-6 text-center">
            <span className="text-5xl sm:text-6xl mb-2 animate-bounce">🀄✨</span>
            <h2 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-wider">
              STAGE CLEARED!
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm font-bold mt-1 max-w-xs">
              All {gameState.totalPairs} barnyard tile pairs dismantled with master precision!
            </p>

            <div className="my-4 bg-slate-900/90 border border-slate-700 p-3.5 rounded-2xl w-64 shadow-xl">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">TOTAL SCORE</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {gameState.score.toLocaleString()}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRestart(level < 3 ? level + 1 : 1)}
                className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-all cursor-pointer"
              >
                {level < 3 ? `PLAY LEVEL ${level + 1} 🚀` : 'REPLAY LEVEL 1 🔄'}
              </button>
            </div>
          </div>
        )}

        {/* Blocked / No Moves Left Overlay */}
        {gameState.isBlocked && !gameState.isComplete && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in p-6 text-center">
            <span className="text-4xl mb-2">🔀</span>
            <h3 className="text-xl sm:text-2xl font-black text-white">NO MOVES REMAINING</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Shuffle open tiles to reveal new matching pairs!
            </p>
            <button
              onClick={handleShuffle}
              className="mt-3 px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-lg transition-transform hover:scale-105 cursor-pointer"
            >
              SHUFFLE TILES 🔀
            </button>
          </div>
        )}
      </div>

      {/* Bottom Power-Ups & Action Bar */}
      <div className="w-full bg-slate-950 px-3 sm:px-6 py-3 rounded-b-2xl border-b border-x border-slate-700/80 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Hint Button */}
          <button
            onClick={handleHint}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Hint</span>
          </button>

          {/* Shuffle Button */}
          <button
            onClick={handleShuffle}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-sky-200 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Shuffle</span>
          </button>

          {/* Undo Button */}
          <button
            onClick={handleUndo}
            disabled={gameState.history.length === 0}
            className={`px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all ${
              gameState.history.length === 0 ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer text-slate-300 hover:text-white'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Undo</span>
          </button>
        </div>

        {/* Quick Rule Reminder */}
        <div className="text-[11px] sm:text-xs font-medium text-slate-400 hidden sm:flex items-center gap-1">
          <span className="text-amber-400">💡 Rule:</span>
          <span>Match tiles that are open on their left or right side and free from above!</span>
        </div>
      </div>
    </div>
  );
};

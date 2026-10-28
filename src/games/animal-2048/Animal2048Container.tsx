import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  RefreshCw,
  Volume2,
  VolumeX,
  Trophy,
  Award,
  Sparkles,
  HelpCircle,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Flame,
} from 'lucide-react';
import {
  createInitialGameState,
  performMove,
  undoMove,
  isGameOver,
} from './logic/engine';
import { Direction, GameState2048, ANIMAL_TIERS } from './logic/types';
import { animal2048Sound } from './systems/sound';
import { analytics } from '../../lib/analytics';

const STORAGE_KEY_BEST = 'pawcade_animal_2048_best';
const SWIPE_THRESHOLD = 14;

export const Animal2048Container: React.FC = () => {
  const [gameState, setGameState] = useState<GameState2048>(() => {
    let savedBest = 0;
    try {
      const val = localStorage.getItem(STORAGE_KEY_BEST);
      if (val) savedBest = parseInt(val, 10) || 0;
    } catch {}
    return createInitialGameState(savedBest);
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => animal2048Sound.isMuted());
  const [isLadderOpen, setIsLadderOpen] = useState<boolean>(false);
  const [mergedCells, setMergedCells] = useState<Set<string>>(new Set());
  const [newCells, setNewCells] = useState<Set<string>>(new Set());
  const [highestEverTier, setHighestEverTier] = useState<number>(() => {
    try {
      const val = localStorage.getItem('pawcade_animal_2048_highest_tier');
      if (val) return parseInt(val, 10) || 2;
    } catch {}
    return 2;
  });

  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    analytics.gameStarted('animal-2048');
  }, []);

  // Sync highest tier & best score to localStorage
  useEffect(() => {
    if (gameState.score > gameState.bestScore) {
      try {
        localStorage.setItem(STORAGE_KEY_BEST, String(gameState.score));
      } catch {}
    }
    if (gameState.maxTier > highestEverTier) {
      setHighestEverTier(gameState.maxTier);
      try {
        localStorage.setItem('pawcade_animal_2048_highest_tier', String(gameState.maxTier));
      } catch {}
    }
  }, [gameState.score, gameState.bestScore, gameState.maxTier, highestEverTier]);

  // Handle Elephant Fanfare when Elephant 2048 is reached
  useEffect(() => {
    if (gameState.hasWon && !gameState.keepPlayingAfterWin) {
      analytics.levelCompleted('animal-2048', {
        score: gameState.score,
        maxTier: gameState.maxTier,
      });
      animal2048Sound.playElephantFanfare();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#f59e0b', '#ec4899', '#10b981', '#3b82f6'],
        });
      } catch {}
    }
  }, [gameState.hasWon, gameState.keepPlayingAfterWin]);

  // Handle Game Over sound
  useEffect(() => {
    if (gameState.isGameOver && !gameState.hasWon) {
      analytics.levelFailed('animal-2048', {
        score: gameState.score,
        maxTier: gameState.maxTier,
      });
      animal2048Sound.playGameOver();
    }
  }, [gameState.isGameOver, gameState.hasWon]);

  // Main Move Handler
  const handleMove = useCallback(
    (direction: Direction) => {
      if (gameState.isGameOver) return;

      const result = performMove(gameState, direction);
      if (!result.slideResult.moved) return;

      // Play audio based on slide & merges
      if (result.slideResult.merges.length > 0) {
        // Highest merged value in this move
        const maxMerge = Math.max(...result.slideResult.merges.map((m) => m.value));
        if (maxMerge < 2048) {
          animal2048Sound.playMerge(maxMerge);
        }
      } else {
        animal2048Sound.playSlide();
      }

      // Mark merged cells for pop animation
      const mergeSet = new Set<string>();
      result.slideResult.merges.forEach((m) => {
        mergeSet.add(`${m.row}-${m.col}`);
      });
      setMergedCells(mergeSet);

      // Mark newly spawned tile for scale-in animation
      const newSet = new Set<string>();
      if (result.spawned) {
        newSet.add(`${result.spawned.row}-${result.spawned.col}`);
      }
      setNewCells(newSet);

      // Clear animation classes after short duration
      setTimeout(() => {
        setMergedCells(new Set());
        setNewCells(new Set());
      }, 250);

      if (result.state.maxTier > gameState.maxTier && result.state.maxTier >= 128) {
        analytics.scoreMilestone('animal-2048', result.state.score, `tier_${result.state.maxTier}`);
      }

      setGameState(result.state);
    },
    [gameState]
  );

  // Desktop Keyboard Input Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if modal is open
      if (isLadderOpen) {
        if (e.key === 'Escape') setIsLadderOpen(false);
        return;
      }

      let dir: Direction | null = null;
      switch (e.key) {
        case 'ArrowUp':
        case 'KeyW':
        case 'w':
        case 'W':
          dir = 'up';
          break;
        case 'ArrowDown':
        case 'KeyS':
        case 's':
        case 'S':
          dir = 'down';
          break;
        case 'ArrowLeft':
        case 'KeyA':
        case 'a':
        case 'A':
          dir = 'left';
          break;
        case 'ArrowRight':
        case 'KeyD':
        case 'd':
        case 'D':
          dir = 'right';
          break;
        case 'KeyZ':
        case 'z':
          if ((e.ctrlKey || e.metaKey) && gameState.history) {
            e.preventDefault();
            handleUndo();
          }
          break;
        default:
          break;
      }

      if (dir) {
        e.preventDefault();
        handleMove(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleMove, isLadderOpen, gameState.history]);

  // Touch Swipe Handlers with scroll lock prevention
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
      };
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0]!.clientX;
    const endY = e.changedTouches[0]!.clientY;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) < SWIPE_THRESHOLD && Math.abs(dy) < SWIPE_THRESHOLD) {
      return; // Not far enough to be a deliberate swipe
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal swipe
      if (dx > 0) handleMove('right');
      else handleMove('left');
    } else {
      // Vertical swipe
      if (dy > 0) handleMove('down');
      else handleMove('up');
    }
  };

  const handleRestart = () => {
    animal2048Sound.playClick();
    analytics.gameRestarted('animal-2048', { score: 0 });
    setGameState(createInitialGameState(gameState.bestScore));
    setMergedCells(new Set());
    setNewCells(new Set());
  };

  const handleUndo = () => {
    if (!gameState.history) return;
    animal2048Sound.playUndo();
    setGameState(undoMove(gameState));
  };

  const handleKeepPlaying = () => {
    animal2048Sound.playClick();
    setGameState((prev) => ({
      ...prev,
      keepPlayingAfterWin: true,
      hasWon: false,
    }));
  };

  const toggleSound = () => {
    const next = animal2048Sound.toggleMute();
    setIsMuted(next);
  };

  const currentMaxAnimal = ANIMAL_TIERS[gameState.maxTier] || ANIMAL_TIERS[2]!;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto px-3 sm:px-4 select-none">
      {/* Top Header / Score Bar */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 sm:mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl sm:text-3xl">🐭</span>
            <span className="text-xs sm:text-sm font-bold tracking-wider uppercase text-amber-500">
              ➔
            </span>
            <span className="text-2xl sm:text-3xl">🐘</span>
            <h1 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight ml-1">
              Animal 2048
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 font-medium">
            Merge creatures from tiny mouse to mighty elephant!
          </p>
        </div>

        {/* Score & Best Badges */}
        <div className="flex items-center gap-2">
          <div className="bg-stone-900/90 border border-amber-900/40 rounded-xl px-3 py-1.5 text-center shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80">
              Score
            </div>
            <div className="text-base sm:text-lg font-black text-amber-100">
              {gameState.score}
            </div>
          </div>
          <div className="bg-stone-900/90 border border-amber-900/40 rounded-xl px-3 py-1.5 text-center shadow-md">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-400/80 flex items-center justify-center gap-1">
              <Trophy className="w-2.5 h-2.5 text-amber-400" />
              Best
            </div>
            <div className="text-base sm:text-lg font-black text-amber-400">
              {Math.max(gameState.score, gameState.bestScore)}
            </div>
          </div>
        </div>
      </div>

      {/* Control Buttons & Current Tier Indicator */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 bg-stone-900/60 border border-amber-900/30 rounded-xl p-2 px-3 backdrop-blur-sm">
        {/* Highest Animal on Board */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-stone-400">Leader:</span>
          <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold">
            <span className="text-sm">{currentMaxAnimal.emoji}</span>
            <span>{currentMaxAnimal.name}</span>
            <span className="text-stone-400 text-[10px]">({currentMaxAnimal.value})</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsLadderOpen(true)}
            title="Animal Evolution Ladder"
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 text-amber-300 border border-amber-900/30 transition-colors flex items-center justify-center cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleUndo}
            disabled={!gameState.history}
            title={gameState.history ? 'Undo Last Move (Ctrl+Z)' : 'No moves to undo'}
            className={`min-h-[44px] min-w-[44px] p-2 rounded-lg border transition-all flex items-center justify-center ${
              gameState.history
                 ? 'bg-amber-600/30 hover:bg-amber-600/50 text-amber-200 border-amber-500/40 cursor-pointer active:scale-95'
                : 'bg-stone-800/40 text-stone-600 border-stone-800 cursor-not-allowed'
            }`}
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="min-h-[44px] min-w-[44px] p-2 rounded-lg bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 border border-amber-900/30 transition-colors flex items-center justify-center cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
          <button
            onClick={handleRestart}
            title="Restart Game"
            className="min-h-[44px] min-w-[44px] p-2 px-3 rounded-lg bg-amber-600/80 hover:bg-amber-500 text-white font-bold transition-all active:scale-95 shadow-md flex items-center justify-center gap-1 text-xs cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Restart</span>
          </button>
        </div>
      </div>

      {/* 4x4 Game Board Container */}
      <div
        ref={boardRef}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full aspect-square max-w-[460px] bg-stone-900/95 border-4 border-amber-950/80 rounded-2xl p-2.5 sm:p-3.5 shadow-2xl backdrop-blur-md touch-none select-none flex flex-col justify-between"
      >
        {/* Background 4x4 Grid Slot Placeholders */}
        <div className="grid grid-cols-4 grid-rows-4 gap-2 sm:gap-3 w-full h-full">
          {Array.from({ length: 16 }).map((_, index) => {
            const row = Math.floor(index / 4);
            const col = index % 4;
            const val = gameState.grid[row]![col]!;
            const cellKey = `${row}-${col}`;
            const isMerged = mergedCells.has(cellKey);
            const isNew = newCells.has(cellKey);
            const tier = val > 0 ? ANIMAL_TIERS[val] : null;

            return (
              <div
                key={cellKey}
                className="relative rounded-xl bg-stone-950/60 border border-stone-800/40 flex items-center justify-center overflow-hidden aspect-square shadow-inner transition-all duration-100"
              >
                {val > 0 && tier ? (
                  <div
                    style={{
                      backgroundColor: tier.color,
                      color: tier.textColor,
                    }}
                    className={`absolute inset-0 rounded-xl flex flex-col items-center justify-center p-1 sm:p-2 shadow-md transition-all duration-150 transform ${
                      isMerged
                        ? 'scale-110 ring-4 ring-amber-300/80 z-20'
                        : isNew
                        ? 'scale-105 z-10'
                        : 'scale-100 z-0'
                    }`}
                  >
                    {/* Animal Emoji */}
                    <span className="text-2xl sm:text-4xl filter drop-shadow-sm transition-transform duration-100 leading-none mb-0.5">
                      {tier.emoji}
                    </span>

                    {/* Animal Name */}
                    <span className="text-[9px] sm:text-[11px] font-black uppercase tracking-tight truncate max-w-full leading-none">
                      {tier.name}
                    </span>

                    {/* Numerical Value Badge */}
                    <span
                      style={{ opacity: 0.85 }}
                      className="text-[9px] sm:text-[10px] font-extrabold mt-0.5 px-1 py-0.2 rounded-md bg-black/15 leading-none"
                    >
                      {tier.value}
                    </span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        {/* Victory Celebration Modal Overlay (Elephant Reached!) */}
        {gameState.hasWon && !gameState.keepPlayingAfterWin && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="w-16 h-16 rounded-full bg-purple-600/30 border-2 border-purple-400 flex items-center justify-center text-4xl mb-3 shadow-lg animate-bounce">
              🐘
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-tight mb-1">
              Elephant Crowned!
            </h2>
            <p className="text-sm text-stone-300 max-w-xs mb-4">
              Magnificent! You evolved from a tiny 🐭 Mouse all the way into the majestic 🐘 Elephant (2048)!
            </p>
            <div className="bg-stone-900 border border-amber-900/40 rounded-xl p-3 mb-5 w-full max-w-xs flex justify-around">
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Score</div>
                <div className="text-xl font-black text-amber-300">{gameState.score}</div>
              </div>
              <div className="border-r border-stone-800" />
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Best</div>
                <div className="text-xl font-black text-amber-400">
                  {Math.max(gameState.score, gameState.bestScore)}
                </div>
              </div>
            </div>
            <div className="flex gap-2 w-full max-w-xs">
              <button
                onClick={handleKeepPlaying}
                className="flex-1 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Keep Playing</span>
                <span className="text-xs">🐋</span>
              </button>
              <button
                onClick={handleRestart}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-bold text-sm border border-amber-900/40 transition-colors cursor-pointer"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal Overlay */}
        {gameState.isGameOver && !gameState.hasWon && (
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-2">🐾</div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-200 tracking-tight mb-1">
              No More Moves!
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mb-4">
              All 16 slots are full and no matching animals can merge.
            </p>

            <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-3 mb-4 w-full max-w-xs flex items-center justify-between px-4">
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400">Final Score</div>
                <div className="text-lg font-black text-amber-300">{gameState.score}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-stone-400">Highest Animal</div>
                <div className="text-sm font-bold text-amber-200 flex items-center gap-1 justify-end">
                  <span>{currentMaxAnimal.emoji}</span>
                  <span>{currentMaxAnimal.name}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-xs">
              {gameState.history && (
                <button
                  onClick={handleUndo}
                  className="w-full py-2.5 px-4 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 border border-amber-500/40 font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Undo Last Move</span>
                </button>
              )}
              <button
                onClick={handleRestart}
                className="w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Virtual Directional D-Pad for Mobile & Desktop quick controls */}
      <div className="mt-4 flex flex-col items-center gap-1.5 sm:hidden touch-none">
        <button
          onPointerDown={(e) => { e.preventDefault(); handleMove('up'); }}
          className="w-14 h-12 rounded-xl bg-stone-900/80 active:bg-amber-600 border border-amber-900/40 text-amber-300 flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
          aria-label="Slide Up"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onPointerDown={(e) => { e.preventDefault(); handleMove('left'); }}
            className="w-14 h-12 rounded-xl bg-stone-900/80 active:bg-amber-600 border border-amber-900/40 text-amber-300 flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
            aria-label="Slide Left"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); handleMove('down'); }}
            className="w-14 h-12 rounded-xl bg-stone-900/80 active:bg-amber-600 border border-amber-900/40 text-amber-300 flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
            aria-label="Slide Down"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); handleMove('right'); }}
            className="w-14 h-12 rounded-xl bg-stone-900/80 active:bg-amber-600 border border-amber-900/40 text-amber-300 flex items-center justify-center shadow-md active:scale-95 cursor-pointer"
            aria-label="Slide Right"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Quick Keyboard Instruction Hint */}
      <p className="mt-3 text-xs text-stone-500 hidden sm:flex items-center gap-2">
        <span>Use</span>
        <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-300 font-mono text-[10px]">
          Arrow Keys
        </kbd>
        <span>or</span>
        <kbd className="px-1.5 py-0.5 bg-stone-800 border border-stone-700 rounded text-stone-300 font-mono text-[10px]">
          W A S D
        </kbd>
        <span>to slide tiles • Swipe on touchscreens</span>
      </p>

      {/* Animal Evolution Ladder Modal */}
      {isLadderOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-2xl p-5 shadow-2xl max-h-[85vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <div>
                  <h3 className="text-lg font-black text-amber-100">Evolution Ladder</h3>
                  <p className="text-xs text-stone-400">Mouse to Elephant Growth Path</p>
                </div>
              </div>
              <button
                onClick={() => setIsLadderOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of 12 Animals */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {Object.values(ANIMAL_TIERS).map((tier) => {
                const isUnlocked = highestEverTier >= tier.value;
                const isTarget = tier.value === 2048;

                return (
                  <div
                    key={tier.value}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      isTarget
                        ? 'bg-purple-950/40 border-purple-500/50 ring-1 ring-purple-500/30'
                        : isUnlocked
                        ? 'bg-stone-850/80 border-stone-700/60'
                        : 'bg-stone-950/40 border-stone-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        style={{
                          backgroundColor: isUnlocked ? tier.color : '#262626',
                          color: isUnlocked ? tier.textColor : '#737373',
                        }}
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-sm"
                      >
                        {isUnlocked ? tier.emoji : '❓'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-100 text-sm">{tier.name}</span>
                          {isTarget && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              Grand Target
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-stone-400 font-mono">Tile Value: {tier.value}</div>
                      </div>
                    </div>

                    <div>
                      {isUnlocked ? (
                        <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          Unlocked
                        </span>
                      ) : (
                        <span className="text-xs text-stone-600 font-medium">Locked</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Close Button */}
            <div className="mt-4 pt-3 border-t border-stone-800">
              <button
                onClick={() => setIsLadderOpen(false)}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors shadow-md"
              >
                Got It, Let's Play!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

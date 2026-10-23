import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import confetti from 'canvas-confetti';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  HelpCircle,
  Trophy,
  Sparkles,
  ArrowUp,
  X,
  Wheat,
} from 'lucide-react';
import { FlappyChickenScene } from './scenes/FlappyChickenScene';
import { FlappyGameState } from './logic/types';
import { flappySoundManager } from './systems/sound';

export const FlappyChickenContainer: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSceneRef = useRef<FlappyChickenScene | null>(null);

  const [gameState, setGameState] = useState<FlappyGameState | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [hasWon, setHasWon] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => flappySoundManager.isMuted());

  // Handle Game Over
  const handleGameOver = useCallback(() => {
    setIsGameOver(true);
  }, []);

  // Handle Wheat Victory (Reached Wheat!)
  const handleVictory = useCallback(() => {
    setHasWon(true);
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#fef08a', '#ef4444', '#16a34a'],
      });
    } catch {}
  }, []);

  // Initialize Phaser 3 Game
  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 480,
      height: 640,
      backgroundColor: '#38bdf8',
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [FlappyChickenScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('FlappyChickenScene') as FlappyChickenScene;
      if (scene) {
        activeSceneRef.current = scene;
        scene.setCallbacks({
          onStateUpdate: (state) => {
            setGameState({ ...state });
            setIsPaused(scene.getIsPaused());
            setIsGameOver(state.isGameOver);
            setHasWon(state.hasWon);
          },
          onGameOver: handleGameOver,
          onVictory: handleVictory,
        });
      }
    });

    return () => {
      activeSceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, [handleGameOver, handleVictory]);

  const handleRestart = () => {
    setIsGameOver(false);
    setHasWon(false);
    setIsPaused(false);
    if (activeSceneRef.current) {
      activeSceneRef.current.restartGame();
    }
  };

  const handleFlapAction = () => {
    if (activeSceneRef.current) {
      activeSceneRef.current.handlePlayerFlap();
    }
  };

  const togglePause = () => {
    if (activeSceneRef.current) {
      const paused = activeSceneRef.current.togglePause();
      setIsPaused(paused);
    }
  };

  const toggleSound = () => {
    const next = flappySoundManager.toggleMute();
    setIsMuted(next);
  };

  const progressPercent = gameState
    ? Math.min(100, Math.round((gameState.score / gameState.wheatGoalPipes) * 100))
    : 0;

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-lg mx-auto select-none">
      {/* Top Header & HUD */}
      <div className="w-full flex items-center justify-between gap-2 mb-3 px-2">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl sm:text-3xl animate-bounce">🐔</span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              ➔
            </span>
            <span className="text-2xl sm:text-3xl">🌾</span>
            <h1 className="text-xl sm:text-2xl font-black text-amber-100 tracking-tight ml-1">
              Flappy Chicken
            </h1>
          </div>
          <p className="text-xs text-amber-200/80 font-semibold">
            Flap, cluck, and fly through farm gates to reach the Golden Wheat!
          </p>
        </div>

        {/* Score & Best Badges */}
        <div className="flex items-center gap-1.5">
          <div className="bg-amber-100 border border-amber-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900">
              Gates
            </div>
            <div className="text-base sm:text-lg font-black text-amber-950">
              {gameState?.score ?? 0}
            </div>
          </div>
          <div className="bg-amber-100 border border-amber-300 rounded-xl px-2.5 py-1 text-center shadow-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-900 flex items-center justify-center gap-0.5">
              <Trophy className="w-2.5 h-2.5 text-amber-600" />
              Best
            </div>
            <div className="text-base sm:text-lg font-black text-amber-700">
              {Math.max(gameState?.score ?? 0, gameState?.bestScore ?? 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Golden Wheat Distance Progress Bar */}
      <div className="w-full bg-amber-950/80 border border-amber-800 rounded-2xl p-2.5 mb-3 shadow-md backdrop-blur-sm">
        <div className="flex items-center justify-between text-xs font-bold text-amber-200 mb-1 px-1">
          <span className="flex items-center gap-1">
            <span>🐔</span>
            <span>Flight to Golden Wheat:</span>
          </span>
          <span className="text-amber-300 font-mono">
            {gameState?.score ?? 0} / {gameState?.wheatGoalPipes ?? 15} Gates ({progressPercent}%)
          </span>
        </div>

        {/* Progress track */}
        <div className="relative w-full h-4 bg-stone-900 rounded-full overflow-hidden border border-amber-900/60 p-0.5">
          <div
            style={{ width: `${progressPercent}%` }}
            className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 rounded-full transition-all duration-300 relative shadow-inner"
          >
            {/* Shimmer light bar */}
            <div className="absolute inset-0 bg-white/25 rounded-full animate-pulse" />
          </div>

          {/* Golden Wheat Goal marker on right edge */}
          <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] drop-shadow-xs">
            🌾
          </span>
        </div>
      </div>

      {/* Control Action Bar */}
      <div className="w-full flex items-center justify-between gap-2 mb-2 px-1">
        {/* Grain Bonus Counter */}
        <div className="flex items-center gap-1 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold shadow-2xs">
          <span>🌾</span>
          <span>Grains: {gameState?.grains ?? 0}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsHelpOpen(true)}
            title="How to Play"
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white hover:bg-stone-100 text-amber-900 border border-stone-200 shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={togglePause}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white hover:bg-stone-100 text-amber-900 border border-stone-200 shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleSound}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="min-h-[44px] min-w-[44px] p-2 rounded-xl bg-white hover:bg-stone-100 text-amber-900 border border-stone-200 shadow-2xs transition-colors cursor-pointer flex items-center justify-center"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
          </button>
          <button
            onClick={handleRestart}
            title="Restart Run"
            className="min-h-[44px] min-w-[44px] p-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restart</span>
          </button>
        </div>
      </div>

      {/* Phaser Canvas Frame with Aspect Ratio */}
      <div className="relative w-full aspect-[480/640] max-w-[440px] bg-sky-300 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-950 touch-none">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center touch-none" />

        {/* Golden Wheat Victory Celebration Modal Overlay */}
        {hasWon && (
          <div className="absolute inset-0 bg-amber-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-2 animate-bounce">🌾🐔🌾</div>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-200 tracking-tight mb-1">
              Golden Wheat Reached!
            </h2>
            <p className="text-xs sm:text-sm text-amber-100 max-w-xs mb-4">
              Magnificent! Clucky navigated through all the farm gates and arrived at the grand Golden Wheat Granary!
            </p>

            <div className="bg-stone-900/90 border border-amber-600/40 rounded-2xl p-3 mb-5 w-full max-w-xs flex justify-around">
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Gates Cleared</div>
                <div className="text-xl font-black text-amber-300">{gameState?.score ?? 0}</div>
              </div>
              <div className="border-r border-stone-800" />
              <div>
                <div className="text-[10px] uppercase font-bold text-stone-400">Grains Eaten</div>
                <div className="text-xl font-black text-amber-400">{gameState?.grains ?? 0}</div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full max-w-xs py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Fly Again 🌾</span>
            </button>
          </div>
        )}

        {/* Game Over Modal Overlay */}
        {isGameOver && !hasWon && (
          <div className="absolute inset-0 bg-stone-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-2">🐾</div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-1">
              Coop Crash!
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 mb-4">
              Clucky bumped into a farm obstacle. You were {progressPercent}% of the way to the Golden Wheat!
            </p>

            <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-3 mb-5 w-full max-w-xs flex items-center justify-between px-5">
              <div className="text-left">
                <div className="text-[10px] uppercase font-bold text-stone-400">Gates Cleared</div>
                <div className="text-lg font-black text-amber-300">{gameState?.score ?? 0}</div>
              </div>
              <div className="text-right">
                <div className="text-[10px] uppercase font-bold text-stone-400">Best Score</div>
                <div className="text-lg font-black text-amber-400">
                  {Math.max(gameState?.score ?? 0, gameState?.bestScore ?? 0)}
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full max-w-xs py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-sm shadow-xl transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Try Again</span>
            </button>
          </div>
        )}
      </div>

      {/* Mobile Big Tap Button & Desktop Hint */}
      <div className="w-full max-w-[440px] mt-3 flex flex-col items-center gap-2">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            handleFlapAction();
          }}
          className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black text-base rounded-2xl shadow-lg border-2 border-amber-600 flex items-center justify-center gap-2 active:scale-95 transition-all cursor-pointer sm:hidden touch-none"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
          <span>TAP TO FLAP & CLUCK! 🐔</span>
        </button>

        <p className="text-xs text-stone-300 hidden sm:flex items-center gap-1.5 font-medium">
          <span>Press</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-amber-300">
            SPACE
          </kbd>
          <span>or</span>
          <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded font-mono text-[10px] text-amber-300">
            UP / W
          </kbd>
          <span>to flap Clucky's wings • Click anywhere to fly!</span>
        </p>
      </div>

      {/* How to Play Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-stone-900 border border-amber-900/50 rounded-3xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🌾</span>
                <h3 className="text-lg font-black text-amber-100">How to Play Flappy Chicken</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-stone-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-base">🐔</span>
                <p>
                  <strong>Flap to Stay Airborne:</strong> Press <kbd className="bg-stone-800 px-1 py-0.5 rounded text-amber-300 border border-stone-700">Space</kbd>, <kbd className="bg-stone-800 px-1 py-0.5 rounded text-amber-300 border border-stone-700">Up Arrow</kbd>, or tap the screen to flap wings and cluck!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🚪</span>
                <p>
                  <strong>Dodge Farm Fences:</strong> Navigate through the gaps between rustic barn pillars. Don't touch the ground or fence caps!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">🌾</span>
                <p>
                  <strong>The Wheat Goal:</strong> Clear 15 gates to reach the grand <strong>Golden Wheat Field</strong>! Feasting on the golden grain crowns your flight with victory!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-base">✨</span>
                <p>
                  <strong>Bonus Grains:</strong> Catch the floating golden grain kernels in the middle of each fence gap for extra harvest score!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm transition-colors cursor-pointer shadow-md"
            >
              Got It, Let's Fly!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { FarmTetrisScene } from './scenes/FarmTetrisScene';
import { TetrisGameState } from './logic/types';
import { tetrisSoundManager } from './systems/sound';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Pause,
  Play,
  HelpCircle,
  Trophy,
  Sparkles,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Repeat,
  Zap,
} from 'lucide-react';

export const FarmTetrisContainer: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSceneRef = useRef<FarmTetrisScene | null>(null);

  const [gameState, setGameState] = useState<TetrisGameState | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => tetrisSoundManager.isMuted());
  const [finalStats, setFinalStats] = useState<{ score: number; lines: number; silos: number }>({
    score: 0,
    lines: 0,
    silos: 0,
  });

  const handleGameOver = useCallback((score: number, lines: number, silos: number) => {
    setIsGameOver(true);
    setFinalStats({ score, lines, silos });
  }, []);

  // Initialize Phaser 3 Game Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 580,
      height: 580,
      backgroundColor: '#1a130f',
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [FarmTetrisScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('FarmTetrisScene') as FarmTetrisScene;
      if (scene) {
        activeSceneRef.current = scene;
        scene.setCallbacks({
          onStateUpdate: (state) => {
            setGameState({ ...state });
            setIsPaused(state.isPaused);
            setIsGameOver(state.isGameOver);
          },
          onGameOver: handleGameOver,
        });
      }
    });

    return () => {
      activeSceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, [handleGameOver]);

  const handleRestart = () => {
    setIsGameOver(false);
    setIsPaused(false);
    if (activeSceneRef.current) {
      activeSceneRef.current.restartGame();
    }
  };

  const togglePause = () => {
    if (activeSceneRef.current) {
      const paused = activeSceneRef.current.togglePause();
      setIsPaused(paused);
    }
  };

  const toggleSound = () => {
    const next = tetrisSoundManager.toggleMute();
    setIsMuted(next);
  };

  // Virtual touch controls for mobile
  const handleTouchLeft = () => activeSceneRef.current?.handleMove(-1, 0);
  const handleTouchRight = () => activeSceneRef.current?.handleMove(1, 0);
  const handleTouchRotate = () => activeSceneRef.current?.handleRotate(1);
  const handleTouchSoftDrop = () => activeSceneRef.current?.handleSoftDrop();
  const handleTouchHardDrop = () => activeSceneRef.current?.handleHardDrop();
  const handleTouchHold = () => activeSceneRef.current?.handleHold();

  // Hold-to-repeat (DAS) for continuous mobile button sliding
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHoldAction = (action: () => void, initialDelay = 150, repeatInterval = 60) => {
    action();
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, repeatInterval);
    }, initialDelay);
  };

  const stopHoldAction = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopHoldAction();
    };
  }, []);

  // Canvas Swipe Gestures for Mobile
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handleCanvasTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      touchStartRef.current = {
        x: e.touches[0]!.clientX,
        y: e.touches[0]!.clientY,
        time: performance.now(),
      };
    }
  };

  const handleCanvasTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current || e.changedTouches.length === 0) return;
    const endX = e.changedTouches[0]!.clientX;
    const endY = e.changedTouches[0]!.clientY;
    const dx = endX - touchStartRef.current.x;
    const dy = endY - touchStartRef.current.y;
    const dt = performance.now() - touchStartRef.current.time;
    touchStartRef.current = null;

    // Quick tap = rotate piece
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18 && dt < 280) {
      handleTouchRotate();
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 22) handleTouchRight();
      else if (dx < -22) handleTouchLeft();
    } else {
      if (dy > 70 && dt < 300) {
        handleTouchHardDrop();
      } else if (dy > 20) {
        handleTouchSoftDrop();
      } else if (dy < -20) {
        handleTouchRotate();
      }
    }
  };

  const score = gameState?.score ?? 0;
  const highScore = gameState?.highScore ?? 0;
  const lines = gameState?.linesCleared ?? 0;
  const level = gameState?.level ?? 1;
  const silosFilled = gameState?.silosFilled ?? 0;
  const siloProgress = gameState?.siloProgress ?? 0;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto select-none">
      {/* Top HUD Bar */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md rounded-2xl p-3 sm:p-4 mb-3 border border-amber-600/30 shadow-lg text-white flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Level & Silos Count */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-xl text-xs sm:text-sm font-black border border-amber-500/30">
            <span>🌾 Level {level}</span>
          </div>

          <div
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/70 text-amber-200 rounded-xl text-xs sm:text-sm font-black border border-amber-500/30 shadow-xs"
            title="Total Silos Filled"
          >
            <span>🚜 {silosFilled} Silos</span>
          </div>
        </div>

        {/* Center: Live Silo Fill Gauge */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-center sm:justify-end">
          <div className="flex flex-col min-w-[130px] sm:min-w-[160px] bg-slate-800/80 rounded-xl p-1.5 px-2.5 border border-slate-700">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider mb-0.5">
              <span className="text-amber-300 flex items-center gap-1">
                <span>🌾 Silo Fill</span>
              </span>
              <span className="font-mono text-amber-400 font-black">{Math.round(siloProgress)}%</span>
            </div>
            {/* Silo progress bar */}
            <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-amber-600/30">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full transition-all duration-300 shadow-sm shadow-amber-400/50"
                style={{ width: `${siloProgress}%` }}
              />
            </div>
          </div>

          {/* Score & Lines display */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Score
              </span>
              <span className="text-base sm:text-lg font-black text-amber-400 leading-tight">
                {score.toLocaleString()}
              </span>
            </div>
            <div className="h-6 w-px bg-slate-700 hidden sm:block" />
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Lines
              </span>
              <span className="text-base sm:text-lg font-black text-slate-200 leading-tight">
                {lines}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={handleRestart}
              title="Restart Game (R)"
              aria-label="Restart game"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePause}
              title={isPaused ? 'Resume (P)' : 'Pause (P)'}
              aria-label="Toggle pause"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-400" /> : <Pause className="w-4 h-4 text-amber-400" />}
            </button>

            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label="Toggle sound"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              title="How to Play"
              aria-label="How to play instructions"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            >
              <HelpCircle className="w-4 h-4 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Phaser Canvas Frame with Touch Gestures */}
      <div 
        onTouchStart={handleCanvasTouchStart}
        onTouchEnd={handleCanvasTouchEnd}
        className="relative w-full aspect-square max-w-[580px] bg-slate-950 rounded-2xl sm:rounded-3xl p-1 sm:p-2 border-2 border-amber-900/60 shadow-2xl flex items-center justify-center overflow-hidden touch-none"
      >
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden touch-none"
        />

        {/* Pause Overlay */}
        {isPaused && (
          <div className="absolute inset-0 z-30 bg-black/75 backdrop-blur-xs flex flex-col items-center justify-center rounded-2xl">
            <div className="text-4xl mb-2">🌾</div>
            <h3 className="text-2xl font-black text-white tracking-wide">PAUSED</h3>
            <p className="text-amber-200 text-xs mt-1">Take a breather, farmer!</p>
            <button
              onClick={togglePause}
              className="mt-4 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-transform active:scale-95 cursor-pointer shadow-lg"
            >
              Resume Harvest
            </button>
          </div>
        )}
      </div>

      {/* Mobile Touch Controls Bar */}
      <div className="w-full mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
        {/* On-Screen Mobile Controls */}
        <div className="flex lg:hidden items-center justify-between w-full bg-slate-900/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-800 shadow-lg text-white touch-none">
          {/* Movement & Drop controls with Hold-to-Repeat DAS */}
          <div className="flex items-center gap-1.5">
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
                startHoldAction(handleTouchLeft);
              }}
              onPointerUp={(e) => {
                try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
                stopHoldAction();
              }}
              onPointerLeave={stopHoldAction}
              onPointerCancel={stopHoldAction}
              className="w-11 h-11 bg-slate-800 active:bg-slate-700 text-amber-300 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 border border-slate-700 cursor-pointer touch-none select-none"
              aria-label="Hold to Move Left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
                startHoldAction(handleTouchSoftDrop, 120, 45);
              }}
              onPointerUp={(e) => {
                try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
                stopHoldAction();
              }}
              onPointerLeave={stopHoldAction}
              onPointerCancel={stopHoldAction}
              className="w-11 h-11 bg-slate-800 active:bg-slate-700 text-amber-300 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 border border-slate-700 cursor-pointer touch-none select-none"
              aria-label="Hold to Soft Drop"
            >
              <ArrowDown className="w-5 h-5" />
            </button>

            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
                startHoldAction(handleTouchRight);
              }}
              onPointerUp={(e) => {
                try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
                stopHoldAction();
              }}
              onPointerLeave={stopHoldAction}
              onPointerCancel={stopHoldAction}
              className="w-11 h-11 bg-slate-800 active:bg-slate-700 text-amber-300 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 border border-slate-700 cursor-pointer touch-none select-none"
              aria-label="Hold to Move Right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

          {/* Action buttons (Rotate, Hold, Hard Drop) */}
          <div className="flex items-center gap-1.5">
            <button
              onPointerDown={(e) => { e.preventDefault(); handleTouchHold(); }}
              className="w-11 h-11 bg-indigo-900/70 active:bg-indigo-800 text-indigo-300 rounded-xl flex flex-col items-center justify-center font-black text-[9px] shadow-xs active:scale-95 border border-indigo-700 cursor-pointer"
              aria-label="Hold Piece"
            >
              <Repeat className="w-4 h-4 mb-0.5" />
              <span>HOLD</span>
            </button>

            <button
              onPointerDown={(e) => { e.preventDefault(); handleTouchRotate(); }}
              className="w-11 h-11 bg-amber-500 active:bg-amber-400 text-slate-950 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 cursor-pointer"
              aria-label="Rotate Piece"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <button
              onPointerDown={(e) => { e.preventDefault(); handleTouchHardDrop(); }}
              className="w-12 h-11 bg-rose-600 active:bg-rose-500 text-white rounded-xl flex flex-col items-center justify-center font-black text-[9px] uppercase shadow-xs active:scale-95 cursor-pointer"
              aria-label="Hard Drop"
            >
              <Zap className="w-4 h-4 mb-0.5" />
              <span>SLAM</span>
            </button>
          </div>
        </div>

        {/* Desktop Quick Hint */}
        <div className="hidden md:flex items-center justify-between w-full text-xs text-slate-300 font-medium px-1">
          <div>
            💡 <span className="font-bold text-amber-300">Controls:</span>{' '}
            <kbd className="bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">A</kbd>/<kbd className="bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">D</kbd> Move,{' '}
            <kbd className="bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">W</kbd> Rotate,{' '}
            <kbd className="bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">Space</kbd> Hard Drop,{' '}
            <kbd className="bg-slate-800 text-amber-300 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono">C</kbd> Hold
          </div>
          <div>
            🏆 High Score: <strong className="text-amber-400">{highScore.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Game Over Modal */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border-2 border-amber-600/40 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300 text-white">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/40 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-amber-500/20">
              🌾
            </div>

            <h3 className="text-2xl font-black text-amber-400 tracking-tight">
              Harvest Complete!
            </h3>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              The barn is stacked to the rafters! Here is your farming report:
            </p>

            {/* Stats Summary */}
            <div className="bg-slate-800/80 rounded-2xl p-3 border border-slate-700 grid grid-cols-3 gap-2 my-5 text-xs font-bold text-slate-300 text-center">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Score</span>
                <span className="text-base text-amber-400 font-black">
                  {finalStats.score.toLocaleString()}
                </span>
              </div>
              <div className="border-x border-slate-700 px-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Lines</span>
                <span className="text-base text-sky-400 font-black">{finalStats.lines}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Silos</span>
                <span className="text-base text-emerald-400 font-black">
                  {finalStats.silos} 🚜
                </span>
              </div>
            </div>

            {/* Play Again Button */}
            <button
              onClick={handleRestart}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            >
              Play Another Harvest! 🌾
            </button>
          </div>
        </div>
      )}

      {/* Help / Instructions Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-white max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                <h3 className="text-xl font-black text-amber-300">How to Play Farm Tetris</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-300 mb-6">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🚜</span>
                <span>
                  <strong>Stack harvest crates:</strong> Golden Hay bales, Apples, Pumpkins, Cabbages, and Corn to fill full rows.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🌾</span>
                <span>
                  <strong>Fill the Hay Silo:</strong> Clearing rows bursts golden hay into the Silo on the right! Every line cleared adds 10% silo capacity.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">👨‍🌾</span>
                <span>
                  <strong>Delight the Cute Farmer:</strong> Pop lines to make the farmer celebrate with a wave and shout <strong>"WOW!"</strong> in delight!
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⚡</span>
                <span>
                  <strong>Controls:</strong> <kbd className="bg-slate-800 px-1 rounded text-xs border border-slate-700 font-mono">A</kbd>/<kbd className="bg-slate-800 px-1 rounded text-xs border border-slate-700 font-mono">D</kbd> or Arrows to move, <kbd className="bg-slate-800 px-1 rounded text-xs border border-slate-700 font-mono">W</kbd> or Up Arrow to rotate, <kbd className="bg-slate-800 px-1 rounded text-xs border border-slate-700 font-mono">Space</kbd> for Hard Drop, and <kbd className="bg-slate-800 px-1 rounded text-xs border border-slate-700 font-mono">C</kbd> or Shift to hold.
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-sm transition-all cursor-pointer"
            >
              Start Stacking! 🌾
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

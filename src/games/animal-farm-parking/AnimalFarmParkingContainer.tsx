import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { FarmGameScene } from './scenes/FarmGameScene';
import { LEVELS, FARM_WIDTH, FARM_HEIGHT } from './levels/levelsData';
import { LevelConfig, GameState } from './logic/types';
import { farmSoundManager } from './systems/sound';
import { analytics } from '../../lib/analytics';
import { getCompletedLevels, saveLevelProgress, getSavedCurrentLevel, saveCurrentLevel } from '../../lib/storage';
import { ConfettiOverlay } from '../../components/ConfettiOverlay';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Grid,
  HelpCircle,
  Star,
  ChevronRight,
  Trophy,
  Lock,
  Heart,
  Target,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';

const GAME_ID = 'animal-farm-parking';

export const AnimalFarmParkingContainer: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSceneRef = useRef<FarmGameScene | null>(null);
  const lastStateUpdateRef = useRef<number>(0);

  const [levelIndex, setLevelIndex] = useState<number>(() => {
    const saved = getSavedCurrentLevel(GAME_ID);
    return Math.max(0, Math.min(LEVELS.length - 1, saved - 1));
  });

  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [earnedStars, setEarnedStars] = useState<number>(3);
  const [revealedStars, setRevealedStars] = useState<number>(0);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => farmSoundManager.isMuted());
  const [progress, setProgress] = useState(() => getCompletedLevels(GAME_ID));
  const [isRestarting, setIsRestarting] = useState<boolean>(false);

  const currentLevel: LevelConfig = LEVELS[levelIndex] || LEVELS[0]!;

  // Staggered star reveal chimes on victory
  useEffect(() => {
    if (isCompleted) {
      setRevealedStars(0);
      const t1 = setTimeout(() => {
        setRevealedStars(1);
        farmSoundManager.playStarPop(1);
      }, 350);

      const t2 = setTimeout(() => {
        if (earnedStars >= 2) {
          setRevealedStars(2);
          farmSoundManager.playStarPop(2);
        }
      }, 750);

      const t3 = setTimeout(() => {
        if (earnedStars >= 3) {
          setRevealedStars(3);
          farmSoundManager.playStarPop(3);
        }
      }, 1150);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setRevealedStars(0);
    }
  }, [isCompleted, earnedStars]);

  // Level complete callback
  const handleLevelComplete = useCallback(
    (lvlId: number, stars: number, accuracy: number, health: number) => {
      setEarnedStars(stars);
      setIsCompleted(true);
      saveLevelProgress(lvlId, Math.round(100 - health), stars, GAME_ID);
      setProgress(getCompletedLevels(GAME_ID));

      analytics.track('level_completed', {
        gameId: GAME_ID,
        levelId: lvlId,
        stars,
        accuracy,
        health,
      });
    },
    []
  );

  const handleGameOver = useCallback((lvlId: number) => {
    setIsGameOver(true);
    analytics.track('level_failed', {
      gameId: GAME_ID,
      levelId: lvlId,
    });
  }, []);

  // Initialize Phaser 3 Game Instance
  useEffect(() => {
    if (!containerRef.current) return;

    FarmGameScene.initialLevel = currentLevel;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: FARM_WIDTH,
      height: FARM_HEIGHT,
      backgroundColor: '#84cc16',
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [FarmGameScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    game.events.once('ready', () => {
      const scene = game.scene.getScene('FarmGameScene') as FarmGameScene;
      if (scene) {
        activeSceneRef.current = scene;
        scene.setCallbacks({
          onStateUpdate: (s) => {
            const now = performance.now();
            const isCriticalEvent =
              s.isCompleted ||
              s.isGameOver ||
              s.justCollectedMilkId != null;

            // Throttle React HUD updates to ~12 FPS (every 75ms)
            // or push immediately on discrete game events to eliminate 60 FPS React re-render stuttering
            if (isCriticalEvent || now - lastStateUpdateRef.current > 75) {
              lastStateUpdateRef.current = now;
              setGameState({ ...s });
            }
          },
          onLevelComplete: handleLevelComplete,
          onGameOver: handleGameOver,
        });
      }
    });

    return () => {
      activeSceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  const selectLevel = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= LEVELS.length) return;
    const target = LEVELS[newIdx]!;
    setLevelIndex(newIdx);
    setIsCompleted(false);
    setIsGameOver(false);
    setIsLevelSelectOpen(false);
    saveCurrentLevel(target.id, GAME_ID);

    if (activeSceneRef.current) {
      activeSceneRef.current.loadLevel(target);
    }
  };

  const handleRestart = () => {
    setIsRestarting(true);
    setTimeout(() => setIsRestarting(false), 300);
    setIsCompleted(false);
    setIsGameOver(false);

    if (activeSceneRef.current) {
      activeSceneRef.current.restartLevel();
    }
  };

  const toggleSound = () => {
    const next = farmSoundManager.toggleMute();
    setIsMuted(next);
  };

  const nextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      selectLevel(levelIndex + 1);
    }
  };

  const isLevelUnlocked = (idx: number) => {
    if (idx === 0) return true;
    const prevLvlId = LEVELS[idx - 1]!.id;
    return !!progress[prevLvlId]?.completed;
  };

  // Virtual mobile controls
  const handleVirtualInput = (key: string, isDown: boolean) => {
    if (!activeSceneRef.current) return;
    const map: Record<string, any> = {
      up: { up: isDown, forward: isDown },
      down: { down: isDown, reverse: isDown },
      left: { left: isDown, turnLeft: isDown },
      right: { right: isDown, turnRight: isDown },
      brake: { brake: isDown },
    };
    if (map[key]) {
      activeSceneRef.current.setVirtualInput(map[key]);
    }
  };

  const health = gameState?.cow.health ?? 100;
  const accuracy = gameState?.parkingAccuracy ?? 0;
  const isColliding = gameState?.isColliding ?? false;
  const isTargetMet = accuracy >= currentLevel.targetAccuracy;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto select-none">
      {/* Top HUD Status & Controls Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 mb-3 border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLevelSelectOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-800 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer"
            title="Level Select"
          >
            <Grid className="w-4 h-4 text-emerald-600" />
            <span>Lvl {currentLevel.id}</span>
          </button>

          <span className="text-xs font-bold text-slate-600 max-w-[140px] truncate hidden sm:inline">
            {currentLevel.name}
          </span>
        </div>

        {/* Live Gauges: Milk, Health % & Accuracy % */}
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-around sm:justify-end">
          {/* Milk Bottles Gauge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              (gameState?.milkCollected ?? 0) >= (gameState?.totalMilk ?? currentLevel.milkBottles.length)
                ? 'bg-sky-100 border-sky-400 text-sky-800 shadow-sm shadow-sky-500/20'
                : 'bg-sky-50 border-sky-200/90 text-sky-900'
            }`}
            title="Collect all milk bottles to unlock parking"
          >
            <span className="text-base select-none">🥛</span>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                Milk
              </span>
              <span className="text-sm font-black leading-tight">
                {gameState?.milkCollected ?? 0} / {gameState?.totalMilk ?? currentLevel.milkBottles.length}
              </span>
            </div>
          </div>

          {/* Health % Bar */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              isColliding
                ? 'bg-rose-100 border-rose-400 text-rose-700 animate-pulse'
                : health < 40
                ? 'bg-rose-50 border-rose-300 text-rose-700'
                : 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
            }`}
          >
            <Heart
              className={`w-4 h-4 ${
                health > 0 ? 'fill-rose-500 text-rose-500' : 'text-slate-400'
              }`}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                Health
              </span>
              <span className="text-sm font-black leading-tight">
                {Math.max(0, Math.round(health))}%
              </span>
            </div>
          </div>

          {/* Parking Accuracy % Gauge */}
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
              isTargetMet
                ? 'bg-emerald-100 border-emerald-400 text-emerald-800 shadow-sm shadow-emerald-500/20'
                : accuracy >= 50
                ? 'bg-amber-50 border-amber-300 text-amber-800'
                : 'bg-slate-100 border-slate-200 text-slate-700'
            }`}
          >
            <Target
              className={`w-4 h-4 ${
                isTargetMet ? 'text-emerald-600 animate-spin' : 'text-slate-500'
              }`}
              style={{ animationDuration: '6s' }}
            />
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider leading-none">
                Accuracy (≥{currentLevel.targetAccuracy}%)
              </span>
              <span className="text-sm font-black leading-tight">
                {accuracy}%
              </span>
            </div>
          </div>

          {/* Utility Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleRestart}
              title="Restart Level (R)"
              aria-label="Restart level"
              className={`min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center ${
                isRestarting ? 'rotate-180 transition-transform duration-300' : ''
              }`}
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label="Toggle sound"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>

            <button
              onClick={() => setIsHelpOpen(true)}
              title="How to Play"
              aria-label="How to play instructions"
              className="min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
            >
              <HelpCircle className="w-4 h-4 text-indigo-500" />
            </button>
          </div>
        </div>
      </div>

      {/* Phaser Canvas Frame */}
      <div className="relative w-full aspect-[640/540] max-w-[640px] bg-slate-900/10 rounded-3xl p-1 sm:p-2 border border-slate-200/90 shadow-inner flex items-center justify-center overflow-hidden">
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden"
        />

        {/* Live Collision Vignette */}
        {isColliding && (
          <div className="absolute inset-0 border-8 border-rose-500/60 rounded-2xl pointer-events-none animate-pulse" />
        )}
      </div>

      {/* Desktop / Mobile Controls Bar */}
      <div className="w-full mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 px-2">
        {/* Level Hint */}
        <div className="text-xs text-slate-600 font-medium">
          💡 <span className="font-bold text-slate-800">Hint:</span> {currentLevel.hint}
        </div>

        {/* Virtual On-Screen 4-Directional Controls for Mobile / Tablets */}
        <div className="flex lg:hidden items-center justify-between w-full bg-white/95 backdrop-blur-md p-2.5 rounded-2xl border border-slate-200 shadow-sm touch-none">
          {/* 4-Direction D-Pad with central STOP brake */}
          <div className="grid grid-cols-3 gap-1.5 w-36 items-center justify-items-center">
            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); handleVirtualInput('up', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualInput('up', false); }}
              onTouchCancel={() => handleVirtualInput('up', false)}
              onPointerDown={() => handleVirtualInput('up', true)}
              onPointerUp={() => handleVirtualInput('up', false)}
              onPointerLeave={() => handleVirtualInput('up', false)}
              className="w-11 h-11 bg-emerald-500 active:bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 cursor-pointer"
              aria-label="Move Up"
            >
              <ArrowUp className="w-5 h-5" />
            </button>
            <div />

            <button
              onTouchStart={(e) => { e.preventDefault(); handleVirtualInput('left', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualInput('left', false); }}
              onTouchCancel={() => handleVirtualInput('left', false)}
              onPointerDown={() => handleVirtualInput('left', true)}
              onPointerUp={() => handleVirtualInput('left', false)}
              onPointerLeave={() => handleVirtualInput('left', false)}
              className="w-11 h-11 bg-slate-100 active:bg-slate-300 text-slate-800 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 cursor-pointer"
              aria-label="Move Left"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleVirtualInput('brake', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualInput('brake', false); }}
              onTouchCancel={() => handleVirtualInput('brake', false)}
              onPointerDown={() => handleVirtualInput('brake', true)}
              onPointerUp={() => handleVirtualInput('brake', false)}
              onPointerLeave={() => handleVirtualInput('brake', false)}
              className="w-11 h-11 bg-rose-500 active:bg-rose-600 text-white rounded-xl flex items-center justify-center font-black text-[10px] uppercase shadow-xs active:scale-95 cursor-pointer"
              aria-label="Brake / Stop"
            >
              STOP
            </button>
            <button
              onTouchStart={(e) => { e.preventDefault(); handleVirtualInput('right', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualInput('right', false); }}
              onTouchCancel={() => handleVirtualInput('right', false)}
              onPointerDown={() => handleVirtualInput('right', true)}
              onPointerUp={() => handleVirtualInput('right', false)}
              onPointerLeave={() => handleVirtualInput('right', false)}
              className="w-11 h-11 bg-slate-100 active:bg-slate-300 text-slate-800 rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 cursor-pointer"
              aria-label="Move Right"
            >
              <ArrowRight className="w-5 h-5" />
            </button>

            <div />
            <button
              onTouchStart={(e) => { e.preventDefault(); handleVirtualInput('down', true); }}
              onTouchEnd={(e) => { e.preventDefault(); handleVirtualInput('down', false); }}
              onTouchCancel={() => handleVirtualInput('down', false)}
              onPointerDown={() => handleVirtualInput('down', true)}
              onPointerUp={() => handleVirtualInput('down', false)}
              onPointerLeave={() => handleVirtualInput('down', false)}
              className="w-11 h-11 bg-emerald-500 active:bg-emerald-600 text-white rounded-xl flex items-center justify-center font-bold shadow-xs active:scale-95 cursor-pointer"
              aria-label="Move Down"
            >
              <ArrowDown className="w-5 h-5" />
            </button>
            <div />
          </div>

          <div className="flex flex-col items-end gap-1 text-right text-xs pr-2">
            <span className="font-black text-slate-800">Touch Controls</span>
            <span className="text-[11px] text-slate-500">👆 Drag on pasture or use D-Pad</span>
          </div>
        </div>
      </div>

      {/* Victory Modal */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <ConfettiOverlay active={true} />

          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-emerald-100 relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-emerald-500/20">
              🐮
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Perfect Park! 🎉
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Bessie safely docked in the barn stall with {accuracy}% accuracy!
            </p>

            {/* Stars Reveal */}
            <div className="flex items-center justify-center gap-2 my-5">
              {[1, 2, 3].map((starNum) => {
                const isEarned = starNum <= earnedStars;
                const isPopped = starNum <= revealedStars;

                return (
                  <div
                    key={starNum}
                    className={`transition-all duration-300 transform ${
                      isPopped ? 'scale-110' : 'scale-90 opacity-40'
                    }`}
                  >
                    <Star
                      className={`w-9 h-9 ${
                        isEarned && isPopped
                          ? 'fill-amber-400 text-amber-500 drop-shadow-md'
                          : 'fill-slate-200 text-slate-300'
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Stats summary */}
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 grid grid-cols-3 gap-2 mb-6 text-xs font-bold text-slate-600 text-center">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Accuracy</span>
                <span className="text-base text-emerald-600 font-black">{accuracy}%</span>
              </div>
              <div className="border-x border-slate-200 px-1">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Milk</span>
                <span className="text-base text-sky-600 font-black">
                  {gameState?.milkCollected ?? currentLevel.milkBottles.length} / {gameState?.totalMilk ?? currentLevel.milkBottles.length} 🥛
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Health</span>
                <span className="text-base text-slate-900 font-black">
                  {Math.round(health)}%
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
              >
                Replay
              </button>

              {levelIndex < LEVELS.length - 1 ? (
                <button
                  onClick={nextLevel}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>Next Level</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsCompleted(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  Farm Champion! 🏆
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal (Health reached 0%) */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-rose-100 relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-rose-500/20">
              💫
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Bessie Got Too Dizzy!
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Collisions drained Bessie's health. Watch out for fences and farm tractors!
            </p>

            <button
              onClick={handleRestart}
              className="w-full mt-6 py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-black text-sm shadow-md transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-black text-slate-900">Select Farm Level</h3>
              </div>
              <button
                onClick={() => setIsLevelSelectOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 overflow-y-auto p-1">
              {LEVELS.map((lvl, idx) => {
                const unlocked = isLevelUnlocked(idx);
                const isCurrent = idx === levelIndex;
                const lvlProgress = progress[lvl.id];
                const starsCount = lvlProgress?.stars || 0;

                return (
                  <button
                    key={lvl.id}
                    disabled={!unlocked}
                    onClick={() => selectLevel(idx)}
                    className={`relative flex flex-col items-center justify-center aspect-square rounded-2xl p-2 border transition-all cursor-pointer ${
                      isCurrent
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-md shadow-emerald-500/25 scale-102'
                        : unlocked
                        ? 'bg-slate-50 hover:bg-emerald-50 text-slate-900 border-slate-200/80'
                        : 'bg-slate-100/60 text-slate-400 border-slate-100 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {!unlocked ? (
                      <Lock className="w-5 h-5 text-slate-400" />
                    ) : (
                      <>
                        <span className="text-lg font-black">{lvl.id}</span>
                        {lvlProgress?.completed && (
                          <div className="flex items-center gap-0.5 mt-1">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`w-2.5 h-2.5 ${
                                  s <= starsCount
                                    ? isCurrent
                                      ? 'fill-amber-300 text-amber-300'
                                      : 'fill-amber-400 text-amber-400'
                                    : 'fill-slate-200 text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Help / Instructions Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <h3 className="text-xl font-black text-slate-900">How to Play</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm text-slate-600 mb-6">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🐮</span>
                <span>Move Bessie the Cow freely in all <strong>4 directions</strong> with <kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">W</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">A</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">S</kbd><kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">D</kbd> or Arrow Keys. Press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">Space</kbd> to brake.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🥛</span>
                <span><strong>Collect all Milk Bottles</strong> scattered around tricky farm corners before parking in the stall!</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🎯</span>
                <span>Park inside the stall marked with the <strong>🐮 Cow Logo & 🥛 Milk Emblem</strong>. You must achieve at least <strong>{currentLevel.targetAccuracy}% Accuracy</strong> and come to a complete stop!</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">❤️</span>
                <span><strong>Avoid collisions!</strong> Touching fences, tractors, or hay bales continuously drains your <strong>Health %</strong> while in contact.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⭐</span>
                <span>Earn 3 Stars by parking with 90%+ Accuracy and 80%+ Health remaining!</span>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Got It, Let's Farm!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { LEVELS } from './levels/levelsData';
import { LevelConfig } from './logic/types';
import { soundManager } from './systems/sound';
import { analytics } from '../../lib/analytics';
import { getCompletedLevels, saveLevelProgress, getSavedCurrentLevel, saveCurrentLevel } from '../../lib/storage';
import { 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Grid, 
  HelpCircle, 
  Undo2, 
  Star, 
  ChevronRight, 
  Trophy, 
  Lock,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export const DogParkingContainer: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSceneRef = useRef<GameScene | null>(null);

  const [levelIndex, setLevelIndex] = useState<number>(() => {
    const saved = getSavedCurrentLevel();
    return Math.max(0, Math.min(LEVELS.length - 1, saved - 1));
  });

  const [moves, setMoves] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedStars, setCompletedStars] = useState<number>(3);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted());
  const [progress, setProgress] = useState(() => getCompletedLevels());

  const currentLevel: LevelConfig = LEVELS[levelIndex] || LEVELS[0]!;

  // Handle level completion
  const handleLevelComplete = useCallback((lvlId: number, movesCount: number, optimalMoves: number) => {
    let stars = 1;
    if (movesCount <= optimalMoves) {
      stars = 3;
    } else if (movesCount <= optimalMoves + 3) {
      stars = 2;
    } else {
      stars = 1;
    }

    setCompletedStars(stars);
    setIsCompleted(true);
    saveLevelProgress(lvlId, movesCount, stars);
    setProgress(getCompletedLevels());

    analytics.track('level_completed', {
      gameId: 'dog-parking',
      levelId: lvlId,
      moves: movesCount,
      stars,
    });
  }, []);

  // Initialize Phaser Game instance once
  useEffect(() => {
    if (!containerRef.current || gameRef.current) return;

    analytics.track('game_loaded', { gameId: 'dog-parking' });
    analytics.track('level_started', { gameId: 'dog-parking', levelId: currentLevel.id });

    GameScene.initialLevel = currentLevel;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 540,
      height: 540,
      backgroundColor: '#f8fafc',
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [GameScene],
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Attach callbacks once GameScene is ready
    let attempts = 0;
    const checkScene = setInterval(() => {
      attempts++;
      if (!gameRef.current) {
        clearInterval(checkScene);
        return;
      }
      try {
        const scene = gameRef.current.scene.getScene('GameScene') as GameScene;
        if (scene && scene.scene && scene.scene.isActive()) {
          activeSceneRef.current = scene;
          scene.setCallbacks({
            onMove: (m) => setMoves(m),
            onLevelComplete: handleLevelComplete,
          });
          if (scene.getCurrentLevel()?.id !== currentLevel.id) {
            scene.loadLevel(currentLevel);
          }
          clearInterval(checkScene);
        } else if (attempts > 60) {
          clearInterval(checkScene);
        }
      } catch {
        clearInterval(checkScene);
      }
    }, 50);

    return () => {
      clearInterval(checkScene);
      if (gameRef.current) {
        try {
          gameRef.current.destroy(true);
        } catch {}
        gameRef.current = null;
      }
    };
  }, []);

  // Keyboard shortcuts (R = restart, Z = undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'z' || e.key === 'Z') {
        handleUndo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentLevel]);

  const handleRestart = () => {
    const scene = activeSceneRef.current || (gameRef.current?.scene.getScene('GameScene') as GameScene);
    if (scene) {
      scene.loadLevel(currentLevel);
      setMoves(0);
      setIsCompleted(false);
      analytics.track('game_restarted', { gameId: 'dog-parking', levelId: currentLevel.id });
    }
  };

  const handleUndo = () => {
    const scene = activeSceneRef.current || (gameRef.current?.scene.getScene('GameScene') as GameScene);
    if (scene) {
      scene.undoMove();
    }
  };

  const switchLevel = (index: number) => {
    const target = LEVELS[index];
    if (!target) return;

    setLevelIndex(index);
    saveCurrentLevel(target.id);
    setMoves(0);
    setIsCompleted(false);
    setIsLevelSelectOpen(false);

    const scene = activeSceneRef.current || (gameRef.current?.scene.getScene('GameScene') as GameScene);
    if (scene) {
      scene.loadLevel(target);
      scene.setCallbacks({
        onMove: (m) => setMoves(m),
        onLevelComplete: handleLevelComplete,
      });
    }

    analytics.track('level_started', { gameId: 'dog-parking', levelId: target.id });
  };

  const handleNextLevel = () => {
    if (levelIndex < LEVELS.length - 1) {
      switchLevel(levelIndex + 1);
    } else {
      setIsLevelSelectOpen(true);
      setIsCompleted(false);
    }
  };

  const toggleSound = () => {
    const newMuted = soundManager.toggleMute();
    setIsMuted(newMuted);
  };

  const isLevelUnlocked = (index: number) => {
    if (index === 0) return true;
    const prevLevel = LEVELS[index - 1]!;
    return !!progress[prevLevel.id]?.completed;
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto select-none">
      {/* Top HUD */}
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-200/80 p-3 sm:p-4 mb-3 sm:mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="bg-indigo-600 text-white font-bold text-sm sm:text-base px-2.5 py-1 rounded-lg shadow-sm">
              Level {currentLevel.id}
            </span>
            <div>
              <h2 className="font-extrabold text-slate-800 text-base sm:text-lg leading-tight">
                {currentLevel.name}
              </h2>
              <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                {currentLevel.difficulty}
              </span>
            </div>
          </div>

          {/* Move Stats */}
          <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Moves</div>
              <div className="font-black text-slate-800 text-base sm:text-lg leading-none">{moves}</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div className="text-center">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Target</div>
              <div className="font-black text-emerald-600 text-base sm:text-lg leading-none">
                {currentLevel.optimalMoves || '—'}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls Bar */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={handleUndo}
              disabled={moves === 0 || isCompleted}
              title="Undo Move (Z)"
              aria-label="Undo previous move"
              className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 disabled:opacity-40 disabled:hover:bg-slate-100 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Undo2 className="w-4 h-4" />
              <span className="hidden sm:inline">Undo</span>
            </button>

            <button
              onClick={handleRestart}
              title="Restart Level (R)"
              aria-label="Restart current level"
              className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Restart</span>
            </button>

            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 sm:px-3 sm:py-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-emerald-600" />}
            </button>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setIsHelpOpen(true)}
              title="How to Play"
              aria-label="How to play instructions"
              className="p-2 sm:px-3 sm:py-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">How to Play</span>
            </button>

            <button
              onClick={() => setIsLevelSelectOpen(true)}
              title="Select Level"
              aria-label="Open level select modal"
              className="p-2 sm:px-3 sm:py-2 text-amber-700 bg-amber-100/70 hover:bg-amber-100 rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden sm:inline">Levels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Phaser Canvas Container */}
      <div 
        className="relative w-full max-w-[530px] bg-slate-100 rounded-3xl overflow-hidden shadow-xl border-4 border-slate-800 touch-none flex items-center justify-center"
        style={{ aspectRatio: '1 / 1', minHeight: '340px' }}
      >
        <div 
          ref={containerRef} 
          className="w-full h-full flex items-center justify-center" 
          style={{ width: '100%', height: '100%', minHeight: '340px' }}
        />
      </div>

      {/* Hint Banner */}
      {currentLevel.hint && (
        <div className="w-full mt-3 bg-amber-50/90 border border-amber-200/80 text-amber-900 rounded-xl px-4 py-2 text-xs sm:text-sm flex items-center gap-2 shadow-sm">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span><strong className="font-bold">Tip:</strong> {currentLevel.hint}</span>
        </div>
      )}

      {/* Level Complete Modal */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border-4 border-amber-400 p-6 sm:p-8 max-w-sm w-full text-center transform scale-100 transition-transform">
            <div className="w-16 h-16 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-inner">
              <Trophy className="w-10 h-10 text-amber-600 animate-bounce" />
            </div>

            <h3 className="text-2xl font-black text-slate-900">Yard Cleared!</h3>
            <p className="text-slate-600 text-sm mt-1">Sunny made it safely through the gate!</p>

            {/* Stars */}
            <div className="flex items-center justify-center gap-2 my-4">
              {[1, 2, 3].map((starIdx) => (
                <Star
                  key={starIdx}
                  className={`w-9 h-9 ${
                    starIdx <= completedStars
                      ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                      : 'text-slate-200 fill-slate-100'
                  }`}
                />
              ))}
            </div>

            {/* Score Stats */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 my-4 flex justify-around">
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Your Moves</span>
                <span className="text-xl font-extrabold text-slate-800">{moves}</span>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <span className="text-xs text-slate-400 font-bold uppercase block">Target</span>
                <span className="text-xl font-extrabold text-emerald-600">
                  {currentLevel.optimalMoves || moves}
                </span>
              </div>
            </div>

            {/* Next / Replay actions */}
            <div className="flex flex-col gap-2.5 mt-5">
              <button
                onClick={handleNextLevel}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 text-base transition-all cursor-pointer"
              >
                <span>{levelIndex < LEVELS.length - 1 ? 'Next Level' : 'View All Levels'}</span>
                <ChevronRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleRestart}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors cursor-pointer"
              >
                Replay Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-lg w-full max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Grid className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-black text-slate-900">Select Level</h3>
              </div>
              <button
                onClick={() => setIsLevelSelectOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 py-4 overflow-y-auto">
              {LEVELS.map((lvl, idx) => {
                const unlocked = isLevelUnlocked(idx);
                const isCurrent = idx === levelIndex;
                const lvlProgress = progress[lvl.id];

                return (
                  <button
                    key={lvl.id}
                    disabled={!unlocked}
                    onClick={() => switchLevel(idx)}
                    className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                      isCurrent
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-md ring-2 ring-indigo-200'
                        : unlocked
                        ? 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
                        : 'border-slate-100 bg-slate-100/60 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {!unlocked ? (
                      <Lock className="w-5 h-5 text-slate-400 mb-1" />
                    ) : (
                      <span className="text-lg font-black text-slate-800">{lvl.id}</span>
                    )}

                    <span className="text-[10px] font-bold text-slate-500 truncate max-w-full">
                      {lvl.name}
                    </span>

                    {/* Stars achieved */}
                    {unlocked && lvlProgress && (
                      <div className="flex items-center gap-0.5 mt-1">
                        {[1, 2, 3].map((s) => (
                          <Star
                            key={s}
                            className={`w-3 h-3 ${
                              s <= lvlProgress.stars
                                ? 'text-amber-400 fill-amber-400'
                                : 'text-slate-200 fill-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <span className="text-xs text-slate-400 font-semibold">
                Complete levels to unlock new yard challenges!
              </span>
            </div>
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 max-w-md w-full">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-xl font-black text-slate-900">How to Play</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 py-4 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 font-black flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold">Slide the Dogs Along Their Lanes</strong>
                  Horizontal dogs slide left & right. Vertical dogs slide up & down. Dogs cannot turn corners or pass through each other.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold">Clear the Exit Gate</strong>
                  Look for the bright green <strong>EXIT ➔</strong> gate on the right side of the yard.
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 font-black flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <strong className="text-slate-900 block font-bold">Guide Sunny the Star Corgi Out!</strong>
                  Sunny has a star medal on his collar. Once the lane is clear, slide Sunny right through the gate to win!
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl transition-colors cursor-pointer"
            >
              Got it, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { LEVELS } from './levels/levelsData';
import { LevelConfig } from './logic/types';
import { catSoundManager } from './systems/sound';
import { analytics } from '../../lib/analytics';
import { getCompletedLevels, saveLevelProgress, getSavedCurrentLevel, saveCurrentLevel } from '../../lib/storage';
import { ConfettiOverlay } from '../../components/ConfettiOverlay';
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

export const CatParkingContainer: React.FC = () => {
  const gameRef = useRef<Phaser.Game | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const activeSceneRef = useRef<GameScene | null>(null);

  const [levelIndex, setLevelIndex] = useState<number>(() => {
    const saved = getSavedCurrentLevel('cat-parking');
    return Math.max(0, Math.min(LEVELS.length - 1, saved - 1));
  });

  const [moves, setMoves] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [completedStars, setCompletedStars] = useState<number>(3);
  const [revealedStars, setRevealedStars] = useState<number>(0);
  const [isLevelSelectOpen, setIsLevelSelectOpen] = useState<boolean>(false);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => catSoundManager.isMuted());
  const [progress, setProgress] = useState(() => getCompletedLevels('cat-parking'));
  const [isRestarting, setIsRestarting] = useState<boolean>(false);

  const currentLevel: LevelConfig = LEVELS[levelIndex] || LEVELS[0]!;

  // Staggered star reveal chimes on victory
  useEffect(() => {
    if (isCompleted) {
      setRevealedStars(0);
      const t1 = setTimeout(() => {
        setRevealedStars(1);
        catSoundManager.playStarPop(1);
      }, 350);

      const t2 = setTimeout(() => {
        if (completedStars >= 2) {
          setRevealedStars(2);
          catSoundManager.playStarPop(2);
        }
      }, 750);

      const t3 = setTimeout(() => {
        if (completedStars >= 3) {
          setRevealedStars(3);
          catSoundManager.playStarPop(3);
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
  }, [isCompleted, completedStars]);

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
    saveLevelProgress(lvlId, movesCount, stars, 'cat-parking');
    setProgress(getCompletedLevels('cat-parking'));

    analytics.track('level_completed', {
      gameId: 'cat-parking',
      levelId: lvlId,
      moves: movesCount,
      stars,
    });
  }, []);

  // Initialize Phaser 3 game instance once
  useEffect(() => {
    if (!containerRef.current) return;

    GameScene.initialLevel = currentLevel;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: 536,
      height: 540,
      backgroundColor: '#f8fafc',
      transparent: false,
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      scene: [GameScene],
      physics: {
        default: 'arcade',
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Attach callbacks once scene boots
    game.events.once('ready', () => {
      const scene = game.scene.getScene('CatGameScene') as GameScene;
      if (scene) {
        activeSceneRef.current = scene;
        scene.setCallbacks({
          onMove: (m) => setMoves(m),
          onLevelComplete: handleLevelComplete,
          onStateUpdate: () => {},
        });
      }
    });

    return () => {
      activeSceneRef.current = null;
      game.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Switch level
  const selectLevel = (newIdx: number) => {
    if (newIdx < 0 || newIdx >= LEVELS.length) return;
    const target = LEVELS[newIdx]!;
    setLevelIndex(newIdx);
    setMoves(0);
    setIsCompleted(false);
    setIsLevelSelectOpen(false);
    saveCurrentLevel(target.id, 'cat-parking');

    if (activeSceneRef.current) {
      activeSceneRef.current.loadLevel(target);
    }
  };

  const handleRestart = () => {
    setIsRestarting(true);
    setTimeout(() => setIsRestarting(false), 300);
    setMoves(0);
    setIsCompleted(false);

    if (activeSceneRef.current) {
      activeSceneRef.current.restartLevel();
    }
  };

  const handleUndo = () => {
    if (activeSceneRef.current) {
      activeSceneRef.current.undoMove();
    }
  };

  const toggleSound = () => {
    const next = catSoundManager.toggleMute();
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

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto select-none">
      {/* Top Controls Header Bar */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl p-3 sm:p-4 mb-3 border border-slate-200/90 shadow-sm flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLevelSelectOpen(true)}
            className="min-h-[44px] flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 active:scale-95 text-slate-800 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer"
            title="Level Select"
          >
            <Grid className="w-4 h-4 text-pink-600" />
            <span>Lvl {currentLevel.id}</span>
          </button>

          <div className="bg-pink-50 border border-pink-200/60 px-2.5 py-1 rounded-lg text-xs font-bold text-pink-700">
            {currentLevel.difficulty}
          </div>
        </div>

        {/* Moves Counter */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-xl">
          <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Moves:</span>
          <span className="font-black text-slate-900 text-sm sm:text-base min-w-6 text-center">
            {moves}
          </span>
          {currentLevel.optimalMoves && (
            <span className="text-[11px] text-amber-600 font-semibold">
              / {currentLevel.optimalMoves}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <button
            onClick={handleUndo}
            disabled={moves === 0 || isCompleted}
            title="Undo Move (Z)"
            aria-label="Undo move"
            className="min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
          >
            <Undo2 className="w-4 h-4" />
          </button>

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
            title="Help / Instructions"
            aria-label="Help and rules"
            className="min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer active:scale-90 flex items-center justify-center"
          >
            <HelpCircle className="w-4 h-4 text-indigo-500" />
          </button>
        </div>
      </div>

      {/* Phaser Canvas Frame */}
      <div className="relative w-full aspect-square max-w-[536px] bg-slate-900/5 rounded-3xl p-1 sm:p-2 border border-slate-200/90 shadow-inner flex items-center justify-center overflow-hidden">
        <div ref={containerRef} className="w-full h-full flex items-center justify-center rounded-2xl overflow-hidden" />
      </div>

      {/* Level Hint Bar */}
      {currentLevel.hint && (
        <div className="mt-2.5 text-center text-xs text-slate-500 font-medium px-4">
          💡 <span className="font-semibold text-slate-700">Tip:</span> {currentLevel.hint}
        </div>
      )}

      {/* Victory Celebration Modal */}
      {isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <ConfettiOverlay active={true} />

          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl border border-pink-100 relative overflow-y-auto max-h-[90vh] animate-in zoom-in-95 duration-300">
            {/* Header visual */}
            <div className="w-16 h-16 bg-gradient-to-tr from-pink-400 to-amber-300 rounded-2xl flex items-center justify-center mx-auto mb-3 text-3xl shadow-lg shadow-pink-500/20">
              🐱
            </div>

            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Purr-fect Paws! 🐾
            </h3>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">
              Luna successfully reached the cozy cat flap!
            </p>

            {/* Stars Reveal */}
            <div className="flex items-center justify-center gap-2 my-5">
              {[1, 2, 3].map((starNum) => {
                const isEarned = starNum <= completedStars;
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
            <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100 flex items-center justify-around mb-6 text-xs font-bold text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Moves</span>
                <span className="text-base text-slate-900 font-black">{moves}</span>
              </div>
              <div className="w-px h-6 bg-slate-200" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Best</span>
                <span className="text-base text-emerald-600 font-black">
                  {currentLevel.optimalMoves || 4}
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestart}
                className="flex-1 py-3 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer"
              >
                Try Again
              </button>

              {levelIndex < LEVELS.length - 1 ? (
                <button
                  onClick={nextLevel}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-pink-500 to-amber-500 hover:from-pink-600 hover:to-amber-600 text-white font-black text-sm shadow-md shadow-pink-500/20 flex items-center justify-center gap-1 transition-all cursor-pointer"
                >
                  <span>Next Level</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => setIsCompleted(false)}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm shadow-md transition-all cursor-pointer"
                >
                  All Cleared! 🏆
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Level Select Modal */}
      {isLevelSelectOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-pink-500" />
                <h3 className="text-xl font-black text-slate-900">Select Level</h3>
              </div>
              <button
                onClick={() => setIsLevelSelectOpen(false)}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 overflow-y-auto p-1">
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
                        ? 'bg-pink-500 text-white border-pink-500 shadow-md shadow-pink-500/25 scale-102'
                        : unlocked
                        ? 'bg-slate-50 hover:bg-pink-50/80 text-slate-900 border-slate-200/80'
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
                <Sparkles className="w-5 h-5 text-pink-500" />
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
                <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <span>Guide <strong>Luna the Star Cat</strong> to the green <strong>EXIT ➔</strong> gate on the right.</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <span>Cats can only slide forward and backward along their natural lane (horizontal or vertical).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <span>Cats cannot jump over each other or obstacles (yarn balls, boxes, scratching posts).</span>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                <span>Use keyboard shortcut <kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">R</kbd> to restart or <kbd className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-xs border">Z</kbd> to undo.</span>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

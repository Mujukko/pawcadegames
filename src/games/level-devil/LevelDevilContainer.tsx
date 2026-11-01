import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initLevelDevilGame,
  stepLevelDevilGame,
  TOTAL_LEVELS,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './logic/engine';
import { LevelDevilInput, LevelDevilState } from './logic/types';
import { levelDevilAudio } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, ArrowLeft, ArrowRight, ArrowUp } from 'lucide-react';

export const LevelDevilContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<LevelDevilState>(initLevelDevilGame(1, 0));
  const inputRef = useRef<LevelDevilInput>({});

  const [hudState, setHudState] = useState({
    levelIndex: 1,
    deaths: 0,
    status: 'playing',
    message: '',
    levelTitle: 'Level 1: The Trust Test',
    isMuted: levelDevilAudio.isMuted(),
  });

  const [showNextModal, setShowNextModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  const resetCurrentLevel = useCallback(() => {
    stateRef.current = initLevelDevilGame(stateRef.current.levelIndex, stateRef.current.deaths);
    setShowNextModal(false);
    setShowVictoryModal(false);
  }, []);

  const advanceNextLevel = useCallback(() => {
    const nextLvl = stateRef.current.levelIndex + 1;
    if (nextLvl <= TOTAL_LEVELS) {
      stateRef.current = initLevelDevilGame(nextLvl, stateRef.current.deaths);
      setShowNextModal(false);
      levelDevilAudio.playLevelClear();
    }
  }, []);

  const restartEntireGame = useCallback(() => {
    stateRef.current = initLevelDevilGame(1, 0);
    setShowVictoryModal(false);
    setShowNextModal(false);
  }, []);

  const toggleSound = () => {
    const muted = levelDevilAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        if (!inputRef.current.jump) {
          levelDevilAudio.playJump();
        }
        inputRef.current.jump = true;
      }
      if (e.code === 'KeyR') resetCurrentLevel();
      if (e.code === 'KeyM') toggleSound();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) inputRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let animId: number;
    let lastTime = performance.now();
    let deathAudioTriggered = false;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const prevState = stateRef.current;
      const nextState = stepLevelDevilGame(prevState, inputRef.current, dt);
      stateRef.current = nextState;

      // Handle sound triggers
      if (nextState.status === 'died' && !deathAudioTriggered) {
        levelDevilAudio.playDie();
        deathAudioTriggered = true;
      } else if (nextState.status !== 'died') {
        deathAudioTriggered = false;
      }

      if (nextState.status === 'level_cleared' && !showNextModal) {
        levelDevilAudio.playLevelClear();
        setShowNextModal(true);
      }
      if (nextState.status === 'victory' && !showVictoryModal) {
        levelDevilAudio.playWin();
        setShowVictoryModal(true);
      }

      // Sync HUD periodically
      setHudState({
        levelIndex: nextState.levelIndex,
        deaths: nextState.deaths,
        status: nextState.status,
        message: nextState.message,
        levelTitle: nextState.levelTitle,
        isMuted: levelDevilAudio.isMuted(),
      });

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

          // 1. Sky & Pasture Background
          const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
          skyGrad.addColorStop(0, '#fef08a');
          skyGrad.addColorStop(0.5, '#bae6fd');
          skyGrad.addColorStop(1, '#bbf7d0');
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

          // 2. Platforms
          nextState.platforms.forEach((p) => {
            ctx.save();
            ctx.globalAlpha = p.opacity ?? 1;

            if (p.type === 'trap') {
              ctx.fillStyle = p.triggered ? '#b45309' : '#854d0e';
            } else if (p.type === 'disappearing') {
              ctx.fillStyle = '#60a5fa';
            } else {
              ctx.fillStyle = '#4d7c0f'; // Earthy solid green/wood
            }

            // Draw rounded platform
            ctx.beginPath();
            ctx.roundRect(p.x, p.y, p.width, p.height, 6);
            ctx.fill();

            // Highlight bar on top
            ctx.fillStyle = '#a3e635';
            ctx.fillRect(p.x + 2, p.y, p.width - 4, 6);

            ctx.restore();
          });

          // 3. Hazards / Spikes
          nextState.hazards.forEach((h) => {
            ctx.save();
            ctx.fillStyle = '#ef4444';
            ctx.strokeStyle = '#991b1b';
            ctx.lineWidth = 2;

            if (h.type === 'falling_spike') {
              // Hanging upside-down spike
              ctx.beginPath();
              ctx.moveTo(h.x, h.y);
              ctx.lineTo(h.x + h.width, h.y);
              ctx.lineTo(h.x + h.width / 2, h.y + h.height);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else {
              // Upward ground spikes
              const spikeCount = Math.max(1, Math.floor(h.width / 16));
              const sw = h.width / spikeCount;
              for (let i = 0; i < spikeCount; i++) {
                ctx.beginPath();
                ctx.moveTo(h.x + i * sw, h.y + h.height);
                ctx.lineTo(h.x + (i + 0.5) * sw, h.y);
                ctx.lineTo(h.x + (i + 1) * sw, h.y + h.height);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
              }
            }
            ctx.restore();
          });

          // 4. Doors
          const drawDoor = (d: typeof nextState.door, isDecoy = false) => {
            ctx.save();
            // Door frame
            ctx.fillStyle = isDecoy ? '#991b1b' : '#78350f';
            ctx.fillRect(d.x - 3, d.y - 3, d.width + 6, d.height + 3);

            // Door plank
            ctx.fillStyle = isDecoy ? '#f87171' : '#b45309';
            ctx.fillRect(d.x, d.y, d.width, d.height);

            // Door handle
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(d.x + 8, d.y + d.height / 2, 3.5, 0, Math.PI * 2);
            ctx.fill();

            // Label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isDecoy ? 'TRAP' : 'EXIT', d.x + d.width / 2, d.y - 8);
            ctx.restore();
          };

          drawDoor(nextState.door);
          if (nextState.decoyDoor) {
            drawDoor(nextState.decoyDoor, true);
          }

          // 5. Player (Pip the Chick)
          const pl = nextState.player;
          ctx.save();
          ctx.translate(pl.x + pl.width / 2, pl.y + pl.height / 2);
          if (pl.facing === 'left') {
            ctx.scale(-1, 1);
          }

          if (!pl.alive) {
            // Squashed / fried X eyes
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.ellipse(0, 4, 16, 8, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = '#1e293b';
            ctx.lineWidth = 2;
            // X eye
            ctx.beginPath();
            ctx.moveTo(-4, 0);
            ctx.lineTo(0, 4);
            ctx.moveTo(0, 0);
            ctx.lineTo(-4, 4);
            ctx.stroke();
          } else {
            // Round yellow chick body
            ctx.fillStyle = '#facc15';
            ctx.strokeStyle = '#ca8a04';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.ellipse(0, 0, 12, 14, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // Red comb
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.arc(0, -14, 4, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#1e293b';
            ctx.beginPath();
            ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
            ctx.fill();

            // Sparkle
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(5, -5, 1, 0, Math.PI * 2);
            ctx.fill();

            // Orange beak
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.moveTo(10, -2);
            ctx.lineTo(16, 1);
            ctx.lineTo(10, 4);
            ctx.closePath();
            ctx.fill();

            // Wing
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.ellipse(-4, 2, 6, 4, 0.2, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [resetCurrentLevel, showNextModal, showVictoryModal]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none touch-none">
      {/* Top Header / Bar */}
      <header className="w-full max-w-4xl px-4 py-2.5 flex items-center justify-between text-white border-b border-white/10 z-10 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">🥷</span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base sm:text-lg text-amber-400">
              Level Devil: Mischief Meadow
            </span>
            <span className="text-xs text-white/70">{hudState.levelTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-xl bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs sm:text-sm flex items-center gap-1.5">
            <span>💀</span>
            <span>{hudState.deaths} Deaths</span>
          </div>

          <button
            onClick={resetCurrentLevel}
            aria-label="Restart current level"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full aspect-[800/480] max-h-[75dvh] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900">
          <canvas
            ref={canvasRef}
            width={WORLD_WIDTH}
            height={WORLD_HEIGHT}
            className="w-full h-full object-contain"
          />

          {/* Quick Death Retry Overlay */}
          {hudState.status === 'died' && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center text-white p-4">
              <span className="text-4xl mb-2">💥</span>
              <p className="font-display font-extrabold text-xl sm:text-2xl text-red-400 mb-1">
                {hudState.message || 'You fell for it!'}
              </p>
              <p className="text-xs text-white/80 mb-4">Press R or Tap to Retry</p>
              <button
                onClick={resetCurrentLevel}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg transition-transform active:scale-95"
              >
                Try Again 🔄
              </button>
            </div>
          )}

          {/* Next Level Modal */}
          {showNextModal && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-20">
              <span className="text-5xl mb-2">🎉</span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-amber-400 mb-1">
                Stage Cleared!
              </h2>
              <p className="text-sm text-white/80 mb-6 text-center max-w-sm">
                You outsmarted the trap! Next stage gets even sneakier...
              </p>
              <button
                onClick={advanceNextLevel}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                Next Level ➔
              </button>
            </div>
          )}

          {/* Victory Modal */}
          {showVictoryModal && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-lg flex flex-col items-center justify-center text-white p-6 z-20">
              <span className="text-6xl mb-3">🏆</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-amber-400 mb-2">
                Troll Master!
              </h2>
              <p className="text-sm text-white/80 mb-2 text-center max-w-md">
                You beat all {TOTAL_LEVELS} treacherous levels with {hudState.deaths} total deaths!
              </p>
              <p className="text-xs text-amber-300 font-bold mb-6">
                {hudState.deaths <= 5 ? '⭐ S-Rank Memory!' : hudState.deaths <= 15 ? '👍 Great Reflexes!' : '💪 Determined Spirit!'}
              </p>
              <button
                onClick={restartEntireGame}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                Play Again 🔄
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Touch Bar */}
      <footer className="w-full max-w-4xl px-4 py-3 flex items-center justify-between pb-safe z-10 sm:hidden">
        <div className="flex gap-2">
          <button
            onTouchStart={() => (inputRef.current.left = true)}
            onTouchEnd={() => (inputRef.current.left = false)}
            onMouseDown={() => (inputRef.current.left = true)}
            onMouseUp={() => (inputRef.current.left = false)}
            aria-label="Move left"
            className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/20 flex items-center justify-center text-white active:bg-amber-500 active:text-slate-950 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <button
            onTouchStart={() => (inputRef.current.right = true)}
            onTouchEnd={() => (inputRef.current.right = false)}
            onMouseDown={() => (inputRef.current.right = true)}
            onMouseUp={() => (inputRef.current.right = false)}
            aria-label="Move right"
            className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/20 flex items-center justify-center text-white active:bg-amber-500 active:text-slate-950 transition-colors"
          >
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>

        <button
          onTouchStart={() => {
            inputRef.current.jump = true;
            levelDevilAudio.playJump();
          }}
          onTouchEnd={() => (inputRef.current.jump = false)}
          onMouseDown={() => {
            inputRef.current.jump = true;
            levelDevilAudio.playJump();
          }}
          onMouseUp={() => (inputRef.current.jump = false)}
          aria-label="Jump"
          className="w-20 h-14 rounded-2xl bg-amber-500 border border-amber-400 font-extrabold text-slate-950 flex items-center justify-center gap-1 active:scale-95 transition-transform"
        >
          <ArrowUp className="w-5 h-5" />
          <span>JUMP</span>
        </button>
      </footer>
    </div>
  );
};

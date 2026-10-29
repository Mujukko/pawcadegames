import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Coins,
  ArrowRight,
  HelpCircle,
  X,
  Skull,
  Timer,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { NinjaChickGameState } from './logic/types';
import {
  initializeNinjaChickGame,
  stepNinjaChickGame,
  restartLevel,
  advanceToNextLevel,
} from './logic/engine';
import { ninjaChickAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const BarnyardNinjaChickContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<NinjaChickGameState>(initializeNinjaChickGame(0));
  const [hudState, setHudState] = useState<{
    levelId: number;
    title: string;
    elapsedTime: number;
    deaths: number;
    coins: number;
    completed: boolean;
  }>({
    levelId: 1,
    title: 'Act 1: Lower Barn Loft',
    elapsedTime: 0,
    deaths: 0,
    coins: 0,
    completed: false,
  });

  const [isMuted, setIsMuted] = useState(ninjaChickAudio.isMuted());
  const [showHelp, setShowHelp] = useState(false);

  // Input states
  const inputRef = useRef({
    left: false,
    right: false,
    jump: false,
    down: false,
  });

  const handleMuteToggle = () => {
    const next = ninjaChickAudio.toggleMute();
    setIsMuted(next);
  };

  const handleRestart = useCallback(() => {
    gameStateRef.current = restartLevel(gameStateRef.current);
    setHudState({
      levelId: gameStateRef.current.level.id,
      title: gameStateRef.current.level.title,
      elapsedTime: 0,
      deaths: gameStateRef.current.deaths,
      coins: gameStateRef.current.coinsCollected,
      completed: false,
    });
  }, []);

  const handleNextLevel = () => {
    gameStateRef.current = advanceToNextLevel(gameStateRef.current);
    setHudState({
      levelId: gameStateRef.current.level.id,
      title: gameStateRef.current.level.title,
      elapsedTime: 0,
      deaths: gameStateRef.current.deaths,
      coins: gameStateRef.current.coinsCollected,
      completed: false,
    });
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        inputRef.current.left = true;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.right = true;
      } else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.jump = true;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.down = true;
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleRestart();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleMuteToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        inputRef.current.left = false;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.right = false;
      } else if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        inputRef.current.jump = false;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        inputRef.current.down = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleRestart]);

  // Main Render & Physics Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // 1. Simulation Step
      const { state, events } = stepNinjaChickGame(
        gameStateRef.current,
        inputRef.current,
        dt
      );
      gameStateRef.current = state;

      // Sound triggers
      if (events.jumped) ninjaChickAudio.playJump();
      if (events.wallJumped) ninjaChickAudio.playWallJump();
      if (events.bounced) ninjaChickAudio.playBounce();
      if (events.coinCollected) ninjaChickAudio.playCoin();
      if (events.checkpointActivated) ninjaChickAudio.playCheckpoint();
      if (events.playerDied) ninjaChickAudio.playDeath();
      if (events.levelCleared) {
        ninjaChickAudio.playVictory();
        confetti({ particleCount: 50, spread: 70 });
        analytics.track('level_completed', {
          game: 'barnyard-ninja-chick',
          act: state.level.id,
          time: state.elapsedTime,
          deaths: state.deaths,
        });
      }

      setHudState({
        levelId: state.level.id,
        title: state.level.title,
        elapsedTime: state.elapsedTime,
        deaths: state.deaths,
        coins: state.coinsCollected,
        completed: state.levelCompleted,
      });

      // 2. Render Frame
      const width = canvas.width;
      const height = canvas.height;
      const level = state.level;
      const player = state.player;

      ctx.clearRect(0, 0, width, height);

      // Silo Dark Wooden Wall Background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Wooden beam lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 4;
      for (let x = 60; x < width; x += 100) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }

      // Exit Door
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(level.exitDoor.x, level.exitDoor.y, level.exitDoor.w, level.exitDoor.h);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', level.exitDoor.x + 16, level.exitDoor.y + 30);

      // Platforms
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2;
      for (const plat of level.platforms) {
        ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
        ctx.strokeRect(plat.x, plat.y, plat.w, plat.h);
      }

      // Checkpoint Flags
      for (const cp of level.checkpoints) {
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y);
        ctx.lineTo(cp.x, cp.y - 32);
        ctx.stroke();

        ctx.fillStyle = cp.activated ? '#22c55e' : '#94a3b8';
        ctx.beginPath();
        ctx.moveTo(cp.x, cp.y - 32);
        ctx.lineTo(cp.x + 18, cp.y - 24);
        ctx.lineTo(cp.x, cp.y - 16);
        ctx.closePath();
        ctx.fill();
      }

      // Bouncers (Hay Trampolines)
      for (const b of level.bouncers) {
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(b.x, b.y, b.w, b.h, 4);
        ctx.fill();
        ctx.stroke();
      }

      // Hazards
      for (const haz of level.hazards) {
        if (haz.type === 'saw') {
          ctx.save();
          ctx.translate(haz.x, haz.y);
          ctx.rotate((time * (haz.rotationSpeed || 5)) / 1000);

          ctx.fillStyle = '#94a3b8';
          ctx.beginPath();
          ctx.arc(0, 0, haz.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#cbd5e1';
          for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
            ctx.beginPath();
            ctx.arc(Math.cos(a) * haz.radius, Math.sin(a) * haz.radius, 4, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.fillStyle = '#334155';
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          // Spikes
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.moveTo(haz.x - haz.radius, haz.y + haz.radius);
          ctx.lineTo(haz.x, haz.y - haz.radius);
          ctx.lineTo(haz.x + haz.radius, haz.y + haz.radius);
          ctx.closePath();
          ctx.fill();
        }
      }

      // Star Coins
      for (const coin of level.starCoins) {
        if (coin.collected) return;
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', coin.x, coin.y);
      }

      // Draw Ninja Chick Character
      ctx.save();
      ctx.translate(player.x + player.w * 0.5, player.y + player.h * 0.5);
      if (player.facing === -1) ctx.scale(-1, 1);

      // Body / Head
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, player.w * 0.5, player.h * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Ninja Black Mask
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-player.w * 0.45, -player.h * 0.35, player.w * 0.9, player.h * 0.4);

      // Eyes peaking through mask
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -player.h * 0.15, 2, 0, Math.PI * 2);
      ctx.fill();

      // Orange Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(player.w * 0.45, -player.h * 0.1);
      ctx.lineTo(player.w * 0.75, 0);
      ctx.lineTo(player.w * 0.45, player.h * 0.1);
      ctx.closePath();
      ctx.fill();

      // Headband Ribbon fluttering behind
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-player.w * 0.8, -player.h * 0.25, player.w * 0.4, 3);

      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 overflow-hidden flex flex-col justify-between select-none touch-none text-white">
      {/* Top Header Bar */}
      <header className="z-20 flex items-center justify-between px-3 sm:px-6 py-2 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            <span className="text-xl">🥷</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-amber-300">
              {hudState.title}
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-white/70">
            <Timer className="w-3.5 h-3.5 text-sky-400" />
            <span>Time: <strong className="text-white">{hudState.elapsedTime.toFixed(1)}s</strong></span>
          </div>

          <div className="flex items-center gap-1 text-xs text-rose-300">
            <Skull className="w-3.5 h-3.5" />
            <span>{hudState.deaths}</span>
          </div>

          <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-0.5 rounded-lg text-xs font-bold text-yellow-300">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{hudState.coins}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleRestart}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-xs font-semibold flex items-center gap-1 transition-transform"
            aria-label="Restart Act"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleMuteToggle}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-contain touch-none bg-slate-950"
        />
      </main>

      {/* Mobile Touch Control Deck */}
      <footer className="z-20 flex items-center justify-between px-4 sm:px-12 py-3 bg-slate-900/70 border-t border-white/10">
        {/* D-Pad Buttons (Left/Right) */}
        <div className="flex items-center gap-2">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputRef.current.left = true;
            }}
            onPointerUp={() => (inputRef.current.left = false)}
            onPointerCancel={() => (inputRef.current.left = false)}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 active:bg-white/30 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white active:scale-95 shadow-lg"
            aria-label="Left"
          >
            <ChevronLeft className="w-8 h-8" />
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputRef.current.right = true;
            }}
            onPointerUp={() => (inputRef.current.right = false)}
            onPointerCancel={() => (inputRef.current.right = false)}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-white/10 active:bg-white/30 rounded-2xl border-2 border-white/20 flex items-center justify-center text-white active:scale-95 shadow-lg"
            aria-label="Right"
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        </div>

        {/* Action Buttons (Slide / Jump) */}
        <div className="flex items-center gap-3">
          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputRef.current.down = true;
            }}
            onPointerUp={() => (inputRef.current.down = false)}
            onPointerCancel={() => (inputRef.current.down = false)}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-500/80 active:bg-amber-600 rounded-2xl border-2 border-amber-300 flex flex-col items-center justify-center text-slate-950 font-extrabold text-xs active:scale-95 shadow-lg"
            aria-label="Slide"
          >
            <ArrowDown className="w-6 h-6" />
            <span>SLIDE</span>
          </button>

          <button
            onPointerDown={(e) => {
              e.preventDefault();
              inputRef.current.jump = true;
            }}
            onPointerUp={() => (inputRef.current.jump = false)}
            onPointerCancel={() => (inputRef.current.jump = false)}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 rounded-3xl border-4 border-emerald-300 flex flex-col items-center justify-center text-slate-950 font-extrabold text-sm active:scale-95 shadow-2xl"
            aria-label="Jump"
          >
            <ArrowUp className="w-8 h-8" />
            <span>JUMP</span>
          </button>
        </div>
      </footer>

      {/* Level Complete Modal */}
      {hudState.completed && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-white/20 rounded-[28px] max-w-sm w-full p-6 text-center text-white shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-500/20 border border-amber-400/40 rounded-full flex items-center justify-center text-3xl">
              🏆
            </div>

            <h2 className="font-display font-extrabold text-2xl mb-1 text-amber-400">
              Act Cleared!
            </h2>
            <p className="text-sm text-white/70 mb-5">
              Acrobatic mastery! You conquered the silo parkour course.
            </p>

            <div className="grid grid-cols-2 gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 mb-5 text-sm">
              <div>
                <div className="text-xs text-white/60">Time</div>
                <div className="font-extrabold text-lg text-emerald-400">{hudState.elapsedTime.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-xs text-white/60">Deaths</div>
                <div className="font-extrabold text-lg text-rose-400">{hudState.deaths}</div>
              </div>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 font-extrabold text-base rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
            >
              <span>Next Act</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-[28px] max-w-sm w-full p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-display font-extrabold text-lg text-amber-400">How to Play</h3>
              <button onClick={() => setShowHelp(false)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            <ul className="space-y-2.5 text-xs text-white/80 mb-5">
              <li className="flex items-start gap-2">
                <span className="text-base">🦘</span>
                <span><strong>WALL JUMP:</strong> Jump toward a wall and press Jump again to leap upward off the surface!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">⬇️</span>
                <span><strong>SLIDE:</strong> Hold Down/Slide while running to duck under low beams and saws.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🌾</span>
                <span><strong>TRAMPOLINES:</strong> Bounce on yellow hay trampolines for massive vertical air launches.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🚩</span>
                <span><strong>CHECKPOINTS:</strong> Touch flags to save your respawn point if you hit a saw hazard.</span>
              </li>
            </ul>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initStickmanHookGame,
  stepStickmanHookGame,
  TOTAL_HOOK_LEVELS,
  findBestHookPeg,
} from './logic/engine';
import { StickmanHookState } from './logic/types';
import { stickmanHookAudio } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, ArrowRight, Trophy } from 'lucide-react';

export const StickmanHookContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<StickmanHookState>(initStickmanHookGame(1));
  const hookHeldRef = useRef<boolean>(false);
  const prevStatusRef = useRef<string>('playing');
  const prevAttachedRef = useRef<string | null>(null);

  const [hudState, setHudState] = useState({
    levelIndex: 1,
    status: 'playing',
    progress: 0,
    isMuted: stickmanHookAudio.isMuted(),
  });

  const [showNextModal, setShowNextModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);

  const resetCurrentLevel = useCallback(() => {
    stateRef.current = initStickmanHookGame(stateRef.current.levelIndex);
    setShowNextModal(false);
    setShowVictoryModal(false);
  }, []);

  const advanceNextLevel = useCallback(() => {
    const nextLvl = stateRef.current.levelIndex + 1;
    if (nextLvl <= TOTAL_HOOK_LEVELS) {
      stateRef.current = initStickmanHookGame(nextLvl);
      setShowNextModal(false);
      stickmanHookAudio.playClear();
    }
  }, []);

  const restartEntireGame = useCallback(() => {
    stateRef.current = initStickmanHookGame(1);
    setShowVictoryModal(false);
    setShowNextModal(false);
  }, []);

  const toggleSound = () => {
    const muted = stickmanHookAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard input (Space or Click/Touch to hook)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        e.preventDefault();
        hookHeldRef.current = true;
      }
      if (e.code === 'KeyR') resetCurrentLevel();
      if (e.code === 'KeyM') toggleSound();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['Space', 'KeyW', 'ArrowUp'].includes(e.code)) {
        e.preventDefault();
        hookHeldRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetCurrentLevel]);

  // Main Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const prevAttached = stateRef.current.player.attachedPegId;
      stateRef.current = stepStickmanHookGame(stateRef.current, hookHeldRef.current, dt);
      const state = stateRef.current;

      // Sound triggers
      if (!prevAttached && state.player.attachedPegId) {
        stickmanHookAudio.playGrappleLatch();
      } else if (prevAttached && !state.player.attachedPegId) {
        stickmanHookAudio.playGrappleRelease();
      }

      if (prevStatusRef.current !== state.status) {
        if (state.status === 'level_cleared') {
          stickmanHookAudio.playClear();
          setShowNextModal(true);
        } else if (state.status === 'victory') {
          stickmanHookAudio.playVictory();
          setShowVictoryModal(true);
        } else if (state.status === 'failed') {
          stickmanHookAudio.playFall();
        }
        prevStatusRef.current = state.status;
      }

      // HUD Progress update
      const totalDist = state.finishLineX - 60;
      const curDist = Math.max(0, Math.min(totalDist, state.player.x - 60));
      const progress = Math.round((curDist / totalDist) * 100);

      setHudState((prev) => ({
        ...prev,
        levelIndex: state.levelIndex,
        status: state.status,
        progress,
      }));

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderHookCanvas(ctx, canvas.width, canvas.height, state, hookHeldRef.current);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700/60 z-10 text-white">
        <div className="flex items-center gap-3">
          <div className="font-extrabold text-amber-400 text-sm tracking-wide flex items-center gap-1.5">
            <span>🐾</span> Level {hudState.levelIndex} / {TOTAL_HOOK_LEVELS}
          </div>
          {/* Progress Bar */}
          <div className="w-28 sm:w-44 h-2.5 bg-slate-700 rounded-full overflow-hidden border border-slate-600/60">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-100 ease-out"
              style={{ width: `${hudState.progress}%` }}
            />
          </div>
          <span className="text-xs font-bold text-slate-300">{hudState.progress}%</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetCurrentLevel}
            aria-label="Restart Level"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div
        className="relative w-full aspect-[16/9] max-h-[72vh] flex items-center justify-center bg-slate-950 cursor-pointer overflow-hidden"
        onMouseDown={(e) => {
          e.preventDefault();
          hookHeldRef.current = true;
        }}
        onMouseUp={() => {
          hookHeldRef.current = false;
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          hookHeldRef.current = true;
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          hookHeldRef.current = false;
        }}
      >
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full object-contain block"
        />

        {/* Failed Overlay Banner */}
        {hudState.status === 'failed' && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4">
            <div className="text-4xl mb-2">😿</div>
            <h3 className="text-2xl font-black tracking-tight text-red-400 mb-2">Missed the Hook!</h3>
            <p className="text-sm text-slate-300 mb-4 text-center max-w-xs">
              Time your grapple swings to gain forward speed and reach the finish!
            </p>
            <button
              onClick={resetCurrentLevel}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
          </div>
        )}

        {/* Level Cleared Modal */}
        {showNextModal && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2 animate-bounce">🎉</div>
            <h3 className="text-2xl font-black text-emerald-400 mb-1">Level Complete!</h3>
            <p className="text-sm text-slate-300 mb-5">Fluffy swung across with perfection!</p>
            <button
              onClick={advanceNextLevel}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              Next Level <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {showVictoryModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-pulse" />
            <h3 className="text-3xl font-black text-amber-400 mb-1">Acrobat Champion!</h3>
            <p className="text-sm text-slate-200 mb-6 text-center max-w-sm">
              You cleared all 4 grapple courses across the barnyard rafters!
            </p>
            <button
              onClick={restartEntireGame}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Play From Start
            </button>
          </div>
        )}
      </div>

      {/* Touch Action Helper Indicator */}
      <div className="w-full py-2 px-4 bg-slate-900 border-t border-slate-800 text-center text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
        <span>Press & hold <b>SPACE</b>, <b>W</b>, or <b>TAP & HOLD SCREEN</b> to grapple. Release to fly!</span>
      </div>
    </div>
  );
};

// Canvas 2D Rendering Function
function renderHookCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: StickmanHookState,
  isHoldingHook: boolean
) {
  // Smooth Camera tracking
  const targetCamX = state.player.x - width * 0.35;
  const camX = Math.max(0, targetCamX);
  const camY = 0;

  // Background Barn Interior
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
  skyGrad.addColorStop(0, '#0f172a');
  skyGrad.addColorStop(0.5, '#1e293b');
  skyGrad.addColorStop(1, '#090d16');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // Wooden Rafter Beams & Backdrop
  ctx.save();
  ctx.translate(-camX * 0.3, 0); // Parallax rafters
  ctx.strokeStyle = 'rgba(78, 52, 46, 0.4)';
  ctx.lineWidth = 14;
  for (let x = -200; x < width * 4; x += 320) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 200, 160);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 200, 0);
    ctx.lineTo(x, 160);
    ctx.stroke();
  }
  ctx.restore();

  // World Rendering Transform
  ctx.save();
  ctx.translate(-camX, -camY);

  // 1. Draw Trampolines
  for (const t of state.trampolines) {
    // Trampoline frame
    ctx.fillStyle = '#475569';
    ctx.fillRect(t.x, t.y + 6, t.width, t.height - 6);

    // Spring base legs
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(t.x + 8, t.y + t.height);
    ctx.lineTo(t.x + 14, t.y + t.height + 14);
    ctx.moveTo(t.x + t.width - 8, t.y + t.height);
    ctx.lineTo(t.x + t.width - 14, t.y + t.height + 14);
    ctx.stroke();

    // Bouncy elastic top
    const trampGrad = ctx.createLinearGradient(t.x, t.y, t.x, t.y + 8);
    trampGrad.addColorStop(0, '#fbbf24');
    trampGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = trampGrad;
    ctx.beginPath();
    ctx.roundRect(t.x - 2, t.y, t.width + 4, 8, 4);
    ctx.fill();

    // Trampoline label/icon
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPRING', t.x + t.width / 2, t.y + 16);
  }

  // 2. Draw Finish Line Banner
  const fx = state.finishLineX;
  ctx.fillStyle = '#64748b';
  ctx.fillRect(fx - 4, 60, 8, height); // Flag pole

  // Checkered banner
  const bannerW = 60;
  const bannerH = 100;
  const checkSize = 10;
  for (let r = 0; r < bannerH / checkSize; r++) {
    for (let c = 0; c < bannerW / checkSize; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#ffffff' : '#000000';
      ctx.fillRect(fx + c * checkSize, 60 + r * checkSize, checkSize, checkSize);
    }
  }
  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('GOAL', fx + 6, 52);

  // 3. Draw Pegs (Hook Anchors)
  const candidatePeg = !state.player.attachedPegId ? findBestHookPeg(state.player, state.pegs) : null;

  for (const peg of state.pegs) {
    const isAttached = state.player.attachedPegId === peg.id;
    const isTarget = candidatePeg?.id === peg.id;

    // Outer glow ring if currently targeted
    if (isTarget) {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, 28, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Anchor mounting peg
    ctx.fillStyle = isAttached ? '#10b981' : isTarget ? '#f59e0b' : '#64748b';
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Draw Rope Line
  if (state.player.attachedPegId) {
    const attachedPeg = state.pegs.find((p) => p.id === state.player.attachedPegId);
    if (attachedPeg) {
      // Glowing rope
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(attachedPeg.x, attachedPeg.y);
      ctx.lineTo(state.player.x, state.player.y);
      ctx.stroke();

      // Core white rope center
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(attachedPeg.x, attachedPeg.y);
      ctx.lineTo(state.player.x, state.player.y);
      ctx.stroke();
    }
  } else if (candidatePeg && isHoldingHook) {
    // Laser aim assist
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(state.player.x, state.player.y);
    ctx.lineTo(candidatePeg.x, candidatePeg.y);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 5. Draw Fluffy Acrobat Cat
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  // Cat Body (Fluffy Orange Tabby)
  const catGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, p.radius);
  catGrad.addColorStop(0, '#f97316');
  catGrad.addColorStop(1, '#c2410c');
  ctx.fillStyle = catGrad;
  ctx.beginPath();
  ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
  ctx.fill();

  // Cat Ears
  ctx.fillStyle = '#ea580c';
  // Left ear
  ctx.beginPath();
  ctx.moveTo(-10, -10);
  ctx.lineTo(-14, -20);
  ctx.lineTo(-4, -14);
  ctx.closePath();
  ctx.fill();
  // Right ear
  ctx.beginPath();
  ctx.moveTo(4, -14);
  ctx.lineTo(14, -20);
  ctx.lineTo(10, -10);
  ctx.closePath();
  ctx.fill();

  // Ear pink inner
  ctx.fillStyle = '#fca5a5';
  ctx.beginPath();
  ctx.moveTo(-9, -11);
  ctx.lineTo(-12, -18);
  ctx.lineTo(-5, -14);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(5, -14);
  ctx.lineTo(12, -18);
  ctx.lineTo(9, -11);
  ctx.closePath();
  ctx.fill();

  // Cute Face (Eyes & Whiskers)
  ctx.fillStyle = '#1e1b4b';
  ctx.beginPath();
  ctx.arc(-5, -2, 2.5, 0, Math.PI * 2);
  ctx.arc(5, -2, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Eye shines
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-6, -3, 1, 0, Math.PI * 2);
  ctx.arc(4, -3, 1, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.arc(0, 2, 1.8, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = '#ea580c';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-p.radius + 2, 4);
  ctx.quadraticCurveTo(-p.radius - 8, 8, -p.radius - 10, -2);
  ctx.stroke();

  ctx.restore();

  ctx.restore(); // Restore camera transform
}

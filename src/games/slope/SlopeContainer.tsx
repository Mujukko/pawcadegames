import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initSlopeGame,
  stepSlopeGame,
} from './logic/engine';
import { SlopeInput, SlopeState } from './logic/types';
import { slopeAudio } from './systems/sound';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowLeft,
  ArrowRight,
  Trophy,
  Flame,
} from 'lucide-react';

export const SlopeContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SlopeState>(initSlopeGame(0));
  const inputRef = useRef<SlopeInput>({ steerX: 0 });

  const [hudState, setHudState] = useState({
    score: 0,
    bestScore: 0,
    speed: 24,
    status: 'playing',
    isMuted: slopeAudio.isMuted(),
  });

  const [showCrashModal, setShowCrashModal] = useState(false);

  // Load best score from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('pawcade_slope_best');
      if (saved) {
        const best = parseInt(saved, 10);
        stateRef.current.bestScore = best;
        setHudState((prev) => ({ ...prev, bestScore: best }));
      }
    }
  }, []);

  const restartGame = useCallback(() => {
    stateRef.current = initSlopeGame(stateRef.current.bestScore);
    setShowCrashModal(false);
  }, []);

  const toggleSound = () => {
    const muted = slopeAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        inputRef.current.steerX = -1;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.steerX = 1;
      } else if (e.code === 'KeyR') {
        restartGame();
      } else if (e.code === 'KeyM') {
        toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code) && inputRef.current.steerX < 0) {
        inputRef.current.steerX = 0;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code) && inputRef.current.steerX > 0) {
        inputRef.current.steerX = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [restartGame]);

  // Main Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const { state: nextState, event } = stepSlopeGame(
        stateRef.current,
        inputRef.current,
        dt
      );
      stateRef.current = nextState;

      if (event === 'jump') slopeAudio.playJump();
      if (event === 'crash') {
        slopeAudio.playCrash();
        setShowCrashModal(true);

        if (nextState.score > nextState.bestScore) {
          slopeAudio.playNewBest();
          if (typeof window !== 'undefined') {
            localStorage.setItem('pawcade_slope_best', String(nextState.score));
          }
        }
      }

      setHudState({
        score: nextState.score,
        bestScore: nextState.bestScore,
        speed: Math.round(nextState.ball.speed * 3.6), // Convert to km/h
        status: nextState.status,
        isMuted: slopeAudio.isMuted(),
      });

      // Canvas 3D Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderSlopePerspectiveCanvas(ctx, canvas.width, canvas.height, nextState);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="font-extrabold text-amber-400 text-sm tracking-wide flex items-center gap-1.5">
            <span>🌰</span>
            <span>Distance: <b className="text-white">{hudState.score} m</b></span>
          </div>
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1">
            <Flame className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            <span>{hudState.speed} km/h</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-xs font-bold text-amber-300 flex items-center gap-1 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/50">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>Best: {hudState.bestScore} m</span>
          </div>

          <button
            onClick={restartGame}
            aria-label="Restart Game"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition active:scale-95"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Perspective Canvas */}
      <div className="relative w-full aspect-[16/9] max-h-[72vh] flex items-center justify-center bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={960}
          height={540}
          className="w-full h-full object-contain block"
        />

        {/* Touch zones for mobile (Left half steers left, right half steers right) */}
        <div
          className="absolute inset-y-0 left-0 w-1/2 cursor-pointer opacity-0"
          onTouchStart={(e) => {
            e.preventDefault();
            inputRef.current.steerX = -1;
          }}
          onTouchEnd={() => (inputRef.current.steerX = 0)}
          onMouseDown={() => (inputRef.current.steerX = -1)}
          onMouseUp={() => (inputRef.current.steerX = 0)}
        />
        <div
          className="absolute inset-y-0 right-0 w-1/2 cursor-pointer opacity-0"
          onTouchStart={(e) => {
            e.preventDefault();
            inputRef.current.steerX = 1;
          }}
          onTouchEnd={() => (inputRef.current.steerX = 0)}
          onMouseDown={() => (inputRef.current.steerX = 1)}
          onMouseUp={() => (inputRef.current.steerX = 0)}
        />

        {/* Crash Modal */}
        {showCrashModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2">💥</div>
            <h3 className="text-3xl font-black text-rose-400 mb-1">Acorn Crashed!</h3>
            <p className="text-sm text-slate-300 mb-2">
              You rolled <span className="font-extrabold text-amber-400">{hudState.score} meters</span> down the autumn slope!
            </p>
            {hudState.score >= hudState.bestScore && hudState.score > 0 && (
              <span className="text-xs font-black text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-700/60 mb-4 animate-bounce">
                🎉 NEW PERSONAL BEST!
              </span>
            )}
            <button
              onClick={restartGame}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95 mt-2"
            >
              <RotateCcw className="w-5 h-5" /> Roll Again
            </button>
          </div>
        )}
      </div>

      {/* Mobile Responsive Controls Bar */}
      <div className="w-full py-2.5 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 font-medium">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping inline-block" />
          <span>Tap Left / Right or press <b>A/D</b> to steer!</span>
        </div>

        {/* On-Screen Steering Buttons */}
        <div className="flex items-center gap-3">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.steerX = -1;
            }}
            onTouchEnd={() => (inputRef.current.steerX = 0)}
            onMouseDown={() => (inputRef.current.steerX = -1)}
            onMouseUp={() => (inputRef.current.steerX = 0)}
            className="w-12 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.steerX = 1;
            }}
            onTouchEnd={() => (inputRef.current.steerX = 0)}
            onMouseDown={() => (inputRef.current.steerX = 1)}
            onMouseUp={() => (inputRef.current.steerX = 0)}
            className="w-12 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Canvas 2D Pseudo-3D Perspective Projection
function renderSlopePerspectiveCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: SlopeState
) {
  const horizonY = height * 0.32;
  const fov = 260;

  // Autumn Night Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  skyGrad.addColorStop(0, '#090d16');
  skyGrad.addColorStop(0.7, '#1e1b4b');
  skyGrad.addColorStop(1, '#431407');
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, horizonY);

  // Distant Mountains / Trees silhouette
  ctx.fillStyle = '#1c1917';
  ctx.beginPath();
  ctx.moveTo(0, horizonY);
  for (let x = 0; x <= width; x += 60) {
    const h = Math.sin(x * 0.02) * 35 + 20;
    ctx.lineTo(x, horizonY - h);
  }
  ctx.lineTo(width, horizonY);
  ctx.closePath();
  ctx.fill();

  // Bottom Void Abyss
  const abyssGrad = ctx.createLinearGradient(0, horizonY, 0, height);
  abyssGrad.addColorStop(0, '#1c1917');
  abyssGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = abyssGrad;
  ctx.fillRect(0, horizonY, width, height - horizonY);

  // Helper projection function
  const project = (x: number, y: number, relZ: number) => {
    const scale = fov / Math.max(1, relZ);
    const screenX = width / 2 + x * scale * 180;
    const screenY = horizonY + (1.2 - y) * scale * 90;
    return { x: screenX, y: screenY, scale };
  };

  // Draw Track Segments (from far to near)
  const visibleSegments = state.segments
    .filter((s) => s.z >= state.distance - 2 && s.z <= state.distance + 140)
    .sort((a, b) => b.z - a.z);

  for (let i = 0; i < visibleSegments.length - 1; i++) {
    const seg1 = visibleSegments[i];
    const seg2 = visibleSegments[i + 1];

    const relZ1 = seg1.z - state.distance;
    const relZ2 = seg2.z - state.distance;
    if (relZ1 < 0.5) continue;

    const p1Left = project(-1.0 + seg1.curve, 0, relZ1);
    const p1Right = project(1.0 + seg1.curve, 0, relZ1);
    const p2Left = project(-1.0 + seg2.curve, 0, relZ2);
    const p2Right = project(1.0 + seg2.curve, 0, relZ2);

    // Draw Track Surface
    const isEven = Math.floor(seg1.z / 10) % 2 === 0;
    ctx.fillStyle = isEven ? '#78350f' : '#92400e';
    ctx.beginPath();
    ctx.moveTo(p1Left.x, p1Left.y);
    ctx.lineTo(p1Right.x, p1Right.y);
    ctx.lineTo(p2Right.x, p2Right.y);
    ctx.lineTo(p2Left.x, p2Left.y);
    ctx.closePath();
    ctx.fill();

    // Track Border Neon Edges
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = Math.max(1, p2Left.scale * 3);
    ctx.beginPath();
    ctx.moveTo(p1Left.x, p1Left.y);
    ctx.lineTo(p2Left.x, p2Left.y);
    ctx.moveTo(p1Right.x, p1Right.y);
    ctx.lineTo(p2Right.x, p2Right.y);
    ctx.stroke();

    // Draw Obstacles on this segment
    for (const obs of seg1.obstacles) {
      const pObs = project(obs.x + seg1.curve, 0, relZ1);
      const obsW = obs.width * pObs.scale * 180;
      const obsH = obs.height * pObs.scale * 120;

      if (obs.type === 'block') {
        // Red Barnyard Tractor Tire Barricade
        ctx.fillStyle = '#dc2626';
        ctx.fillRect(pObs.x - obsW / 2, pObs.y - obsH, obsW, obsH);
        ctx.strokeStyle = '#fef08a';
        ctx.lineWidth = Math.max(1, pObs.scale * 2);
        ctx.strokeRect(pObs.x - obsW / 2, pObs.y - obsH, obsW, obsH);
      } else {
        // Golden Jump Ramp
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(pObs.x - obsW / 2, pObs.y);
        ctx.lineTo(pObs.x + obsW / 2, pObs.y);
        ctx.lineTo(pObs.x, pObs.y - obsH);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Draw Player Rolling Acorn
  const playerRelZ = 4.0; // Player sits 4m in front of camera
  const pPlayer = project(state.ball.x, state.ball.y, playerRelZ);
  const acornRadius = 26;

  ctx.save();
  ctx.translate(pPlayer.x, pPlayer.y - acornRadius);
  ctx.rotate(state.ball.rollAngle);

  // Shadow on track
  if (state.ball.y <= 0.05) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, acornRadius + 4, acornRadius * 0.9, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Acorn Nut Body (Radial Golden Brown)
  const nutGrad = ctx.createRadialGradient(-6, -6, 4, 0, 0, acornRadius);
  nutGrad.addColorStop(0, '#fef08a');
  nutGrad.addColorStop(0.4, '#d97706');
  nutGrad.addColorStop(1, '#78350f');
  ctx.fillStyle = nutGrad;
  ctx.beginPath();
  ctx.arc(0, 0, acornRadius, 0, Math.PI * 2);
  ctx.fill();

  // Acorn Cap (Dark textured hat)
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(0, -acornRadius * 0.4, acornRadius * 0.95, Math.PI, 0);
  ctx.closePath();
  ctx.fill();

  // Cap Stem
  ctx.fillStyle = '#292524';
  ctx.fillRect(-2, -acornRadius * 1.3, 4, acornRadius * 0.4);

  ctx.restore();
}

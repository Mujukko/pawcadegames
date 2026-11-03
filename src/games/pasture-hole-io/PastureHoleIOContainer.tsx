import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HoleIOState } from './logic/types';
import {
  createHoleIOGame,
  setHoleVelocity,
  updateHoleIOGame,
  WORLD_SIZE,
} from './logic/engine';
import { holeSound } from './systems/sound';

interface PastureHoleIOProps {
  onBack?: () => void;
}

const VIEW_W = 400;
const VIEW_H = 650;

export const PastureHoleIOContainer: React.FC<PastureHoleIOProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<HoleIOState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_hole_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createHoleIOGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<HoleIOState>(gameState);
  stateRef.current = gameState;

  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const keyStateRef = useRef<{ up: boolean; down: boolean; left: boolean; right: boolean }>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createHoleIOGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      holeSound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keyStateRef.current.up = true;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keyStateRef.current.down = true;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyStateRef.current.left = true;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyStateRef.current.right = true;
      else if (e.key === ' ' || e.key === 'Enter') {
        if (stateRef.current.status === 'time_up') startNewGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keyStateRef.current.up = false;
      else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keyStateRef.current.down = false;
      else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keyStateRef.current.left = false;
      else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keyStateRef.current.right = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNewGame]);

  // Touch pointer dragging
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragOriginRef.current) return;
    const dx = e.clientX - dragOriginRef.current.x;
    const dy = e.clientY - dragOriginRef.current.y;
    const len = Math.hypot(dx, dy);

    if (len > 8) {
      const vx = dx / Math.max(45, len);
      const vy = dy / Math.max(45, len);
      stateRef.current = setHoleVelocity(stateRef.current, vx, vy);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragOriginRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    stateRef.current = setHoleVelocity(stateRef.current, 0, 0);
  };

  // 60 FPS animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Keyboard steering
      let kx = 0;
      let ky = 0;
      if (keyStateRef.current.left) kx -= 1;
      if (keyStateRef.current.right) kx += 1;
      if (keyStateRef.current.up) ky -= 1;
      if (keyStateRef.current.down) ky += 1;

      if (kx !== 0 || ky !== 0) {
        const len = Math.hypot(kx, ky);
        stateRef.current = setHoleVelocity(stateRef.current, kx / len, ky / len);
      }

      const prevState = stateRef.current;
      const nextState = updateHoleIOGame(prevState, dt);
      stateRef.current = nextState;

      for (const ev of nextState.events) {
        if (ev.type === 'eat') holeSound.playEat();
        else if (ev.type === 'grow') holeSound.playGrow();
        else if (ev.type === 'time_up') holeSound.playTimeUp();
      }

      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_hole_high', nextState.highScore.toString());
        } catch {}
      }

      if (
        nextState.status !== prevState.status ||
        Math.floor(time / 250) !== Math.floor((time - dt * 1000) / 250)
      ) {
        setGameState(nextState);
      }

      renderGame(ctx, nextState, canvas.width, canvas.height);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderGame = (
    ctx: CanvasRenderingContext2D,
    st: HoleIOState,
    width: number,
    height: number
  ) => {
    const scale = Math.min(width / VIEW_W, height / VIEW_H);
    const offsetX = (width - VIEW_W * scale) * 0.5;
    const offsetY = (height - VIEW_H * scale) * 0.5;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Camera translates so hole stays at screen center
    const camX = st.player.x - VIEW_W * 0.5;
    const camY = st.player.y - VIEW_H * 0.5;

    ctx.save();
    ctx.translate(-camX, -camY);

    // Pasture Grass Terrain
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Grid grass patches
    ctx.fillStyle = '#22c55e';
    for (let x = 0; x < WORLD_SIZE; x += 100) {
      for (let y = 0; y < WORLD_SIZE; y += 100) {
        if ((x + y) % 200 === 0) {
          ctx.fillRect(x, y, 100, 100);
        }
      }
    }

    // World fence borders
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 12;
    ctx.strokeRect(0, 0, WORLD_SIZE, WORLD_SIZE);

    // Render Farm Objects
    for (const obj of st.objects) {
      if (obj.eaten) continue;

      // Cull objects outside viewport
      if (
        obj.x < camX - 80 ||
        obj.x > camX + VIEW_W + 80 ||
        obj.y < camY - 80 ||
        obj.y > camY + VIEW_H + 80
      )
        continue;

      ctx.save();
      ctx.translate(obj.x, obj.y);

      // Object shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, obj.radius * 0.6, obj.radius, obj.radius * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Shape according to tier
      if (obj.tier === 1) {
        // Carrot or Apple
        ctx.fillStyle = obj.label === 'Carrot' ? '#f97316' : '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.tier === 2) {
        // Pumpkin or Hay Bale
        ctx.fillStyle = obj.label === 'Pumpkin' ? '#ea580c' : '#eab308';
        ctx.beginPath();
        ctx.roundRect(-obj.radius, -obj.radius, obj.radius * 2, obj.radius * 2, 4);
        ctx.fill();
      } else if (obj.tier === 3) {
        // Sheep or Pig
        ctx.fillStyle = obj.label === 'Pig' ? '#f472b6' : '#f8fafc';
        ctx.beginPath();
        ctx.arc(0, 0, obj.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (obj.tier === 4) {
        // Cow or Tractor
        ctx.fillStyle = obj.label === 'Tractor' ? '#dc2626' : '#334155';
        ctx.beginPath();
        ctx.roundRect(-obj.radius, -obj.radius * 0.7, obj.radius * 2, obj.radius * 1.4, 6);
        ctx.fill();
      } else {
        // Barn or Silo
        ctx.fillStyle = '#b91c1c';
        ctx.beginPath();
        ctx.roundRect(-obj.radius, -obj.radius, obj.radius * 2, obj.radius * 2, 8);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(obj.label, 0, 4);
      }

      ctx.restore();
    }

    // Render Player Void Hole
    const p = st.player;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Glowing void rim
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius + 3, 0, Math.PI * 2);
    ctx.fill();

    // Pitch black abyss
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#020617';
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner depth gradient
    const innerGrad = ctx.createRadialGradient(0, 0, p.radius * 0.2, 0, 0, p.radius);
    innerGrad.addColorStop(0, '#000000');
    innerGrad.addColorStop(0.8, '#0f172a');
    innerGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = innerGrad;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius - 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
    ctx.restore();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-slate-900 select-none overflow-hidden touch-none">
      {/* Top HUD */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white z-10 bg-slate-800/90 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition"
            >
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400">Score</div>
            <div className="text-xl font-black text-white leading-none">{gameState.score}</div>
          </div>
        </div>

        {/* 60s Round Timer */}
        <div className="bg-slate-900 px-3 py-1 rounded-xl border border-slate-700 flex items-center gap-1.5">
          <span className="text-sm">⏱️</span>
          <span className={`text-base font-black ${gameState.timeRemaining < 10 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
            {Math.ceil(gameState.timeRemaining)}s
          </span>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-sky-400">Hole Size</div>
            <div className="text-sm font-bold text-white leading-none">{gameState.player.radius}px</div>
          </div>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 text-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-700 bg-emerald-200 cursor-grab active:cursor-grabbing"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 text-center animate-bounce">
              <div className="text-3xl mb-1">🕳️</div>
              <div className="text-base font-bold text-amber-400">Drag to Move!</div>
              <div className="text-xs text-slate-300">Swallow carrots & apples to grow bigger!</div>
            </div>
          </div>
        )}

        {/* Time Up Modal */}
        {gameState.status === 'time_up' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">🏆</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">Time&apos;s Up!</h2>
            <p className="text-sm text-slate-300 mb-4">Pasture Feast Completed!</p>
            <div className="bg-slate-900/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-800 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Final Score</div>
              <div className="text-3xl font-black text-amber-400">{gameState.score}</div>
              <div className="text-xs text-sky-400 mt-1">Final Hole Size: {gameState.player.radius}px</div>
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Play Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Touch drag instruction */}
      <div className="w-full max-w-md py-3 text-center text-xs font-semibold text-slate-400 bg-slate-800/90 border-t border-slate-700">
        Drag on screen or use WASD/Arrows to slide the hole
      </div>
    </div>
  );
};

export default PastureHoleIOContainer;

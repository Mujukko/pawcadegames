import React, { useEffect, useRef, useState, useCallback } from 'react';
import { TunnelRunnerState } from './logic/types';
import {
  createTunnelRunnerGame,
  rotateTunnel,
  jumpTunnelPlayer,
  updateTunnelRunnerGame,
  TOTAL_LANES,
} from './logic/engine';
import { tunnelSound } from './systems/sound';

interface BarnyardTunnelRunnerProps {
  onBack?: () => void;
}

const VIEW_W = 400;
const VIEW_H = 650;

export const BarnyardTunnelRunnerContainer: React.FC<BarnyardTunnelRunnerProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<TunnelRunnerState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_tunnel_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createTunnelRunnerGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<TunnelRunnerState>(gameState);
  stateRef.current = gameState;

  const currentRotationRef = useRef(0); // smooth visual rotation
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createTunnelRunnerGame(stateRef.current.highScore);
    stateRef.current = next;
    currentRotationRef.current = 0;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      tunnelSound.setMuted(next);
      return next;
    });
  }, []);

  const handleRotate = useCallback((dir: -1 | 1) => {
    stateRef.current = rotateTunnel(stateRef.current, dir);
  }, []);

  const handleJump = useCallback(() => {
    if (stateRef.current.status === 'game_over') {
      startNewGame();
    } else {
      stateRef.current = jumpTunnelPlayer(stateRef.current);
    }
  }, [startNewGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleRotate(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleRotate(1);
      } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleJump();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRotate, handleJump]);

  // Touch Swipe controls
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
    const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 20) {
      if (dx > 0) handleRotate(1);
      else handleRotate(-1);
    } else if (dy < -20) {
      handleJump();
    }
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

      const prevState = stateRef.current;
      const nextState = updateTunnelRunnerGame(prevState, dt);
      stateRef.current = nextState;

      for (const ev of nextState.events) {
        if (ev.type === 'jump') tunnelSound.playJump();
        else if (ev.type === 'rotate') tunnelSound.playRotate();
        else if (ev.type === 'fall') tunnelSound.playFall();
      }

      // Smooth visual rotation interpolation
      const targetAngle = -(nextState.player.lane * (Math.PI * 2) / TOTAL_LANES);
      let angleDiff = targetAngle - currentRotationRef.current;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      currentRotationRef.current += angleDiff * Math.min(1, dt * 14);

      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_tunnel_high', nextState.highScore.toString());
        } catch {}
      }

      if (
        nextState.status !== prevState.status ||
        Math.floor(time / 250) !== Math.floor((time - dt * 1000) / 250)
      ) {
        setGameState(nextState);
      }

      renderGame(ctx, nextState, canvas.width, canvas.height, currentRotationRef.current);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderGame = (
    ctx: CanvasRenderingContext2D,
    st: TunnelRunnerState,
    width: number,
    height: number,
    visualRotation: number
  ) => {
    const scale = Math.min(width / VIEW_W, height / VIEW_H);
    const offsetX = (width - VIEW_W * scale) * 0.5;
    const offsetY = (height - VIEW_H * scale) * 0.5;

    ctx.save();
    // Void outer cosmos
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const centerX = VIEW_W * 0.5;
    const centerY = VIEW_H * 0.52;
    const tunnelRadius = 145;
    const cameraDist = 12;

    // Perspective Projection helper
    const project = (laneAngle: number, z: number, r: number) => {
      const pScale = cameraDist / Math.max(0.2, z + cameraDist);
      const px = centerX + Math.cos(laneAngle + visualRotation) * r * pScale;
      const py = centerY + Math.sin(laneAngle + visualRotation) * r * pScale;
      return { x: px, y: py, scale: pScale };
    };

    // Draw 3D Tunnel Slices sorted back-to-front (high Z to low Z)
    const sortedTiles = [...st.tiles].sort((a, b) => b.z - a.z);

    const laneStep = (Math.PI * 2) / TOTAL_LANES;

    for (const t of sortedTiles) {
      if (!t.hasFloor) continue;

      const a1 = t.lane * laneStep - laneStep * 0.5;
      const a2 = t.lane * laneStep + laneStep * 0.5;

      const pNear1 = project(a1, t.z, tunnelRadius);
      const pNear2 = project(a2, t.z, tunnelRadius);
      const pFar1 = project(a1, t.z + 2.5, tunnelRadius);
      const pFar2 = project(a2, t.z + 2.5, tunnelRadius);

      // Gradient tile shading by depth
      const depthAlpha = Math.max(0.15, Math.min(1, 1 - t.z / 32));
      ctx.fillStyle =
        t.lane % 2 === 0
          ? `rgba(30, 58, 138, ${depthAlpha})`
          : `rgba(3, 105, 161, ${depthAlpha})`;
      ctx.strokeStyle = `rgba(125, 211, 252, ${depthAlpha * 0.7})`;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(pNear1.x, pNear1.y);
      ctx.lineTo(pNear2.x, pNear2.y);
      ctx.lineTo(pFar2.x, pFar2.y);
      ctx.lineTo(pFar1.x, pFar1.y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Obstacle hurdle
      if (t.hasObstacle) {
        const obsH = 20;
        const oNear1 = project(a1, t.z + 1, tunnelRadius - obsH);
        const oNear2 = project(a2, t.z + 1, tunnelRadius - obsH);

        ctx.fillStyle = `rgba(239, 68, 68, ${depthAlpha})`;
        ctx.beginPath();
        ctx.moveTo(pNear1.x, pNear1.y);
        ctx.lineTo(pNear2.x, pNear2.y);
        ctx.lineTo(oNear2.x, oNear2.y);
        ctx.lineTo(oNear1.x, oNear1.y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw Buster Runner at Bottom (Lane angle = Math.PI / 2)
    // When on floor, y is at centerY + tunnelRadius - player.jumpHeight * 12
    const runnerBaseY = centerY + tunnelRadius * 0.82;
    const runnerY = runnerBaseY - st.player.jumpHeight * 12;

    ctx.save();
    ctx.translate(centerX, runnerY);

    // Runner shadow when jumping
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, runnerBaseY - runnerY + 6, 14, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Buster Body (Puppy runner)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 0, 14, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cute ears
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(-12, -8, 5, 10, -0.4, 0, Math.PI * 2);
    ctx.ellipse(12, -8, 5, 10, 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(-4, -4, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -4, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#451a03';
    ctx.beginPath();
    ctx.arc(0, 2, 2.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-full flex flex-col items-center justify-between bg-slate-950 select-none overflow-hidden touch-none"
    >
      {/* Top HUD */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white z-10 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition"
            >
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-sky-400">Score</div>
            <div className="text-xl font-black text-white leading-none">{gameState.score}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Best</div>
            <div className="text-sm font-bold text-white leading-none">{gameState.highScore}</div>
          </div>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          onClick={handleJump}
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-800 bg-slate-950 cursor-pointer"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-slate-900/85 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 text-center animate-bounce">
              <div className="text-3xl mb-1">🌀</div>
              <div className="text-base font-bold text-sky-400">Tap to Jump!</div>
              <div className="text-xs text-slate-300">Rotate left/right to run on walls & ceiling</div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">🪐</div>
            <h2 className="text-2xl font-black text-rose-500 mb-1">Fell into the Void!</h2>
            <p className="text-sm text-slate-300 mb-4">Rotate to find safe floor tiles!</p>
            <div className="bg-slate-900/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-800 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Distance Reached</div>
              <div className="text-3xl font-black text-sky-400">{gameState.score}m</div>
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 hover:to-sky-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Run Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between gap-3 z-10 bg-slate-900/90 border-t border-slate-800">
        <button
          onClick={() => handleRotate(-1)}
          className="flex-1 py-3 bg-slate-800 active:bg-sky-600 text-white font-bold rounded-xl text-lg flex items-center justify-center transition shadow"
        >
          ◀ Rotate Left
        </button>
        <button
          onClick={handleJump}
          className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-amber-600 active:from-amber-600 active:to-amber-700 text-white font-bold rounded-xl text-lg flex items-center justify-center transition shadow"
        >
          Jump ⬆
        </button>
        <button
          onClick={() => handleRotate(1)}
          className="flex-1 py-3 bg-slate-800 active:bg-sky-600 text-white font-bold rounded-xl text-lg flex items-center justify-center transition shadow"
        >
          Rotate Right ▶
        </button>
      </div>
    </div>
  );
};

export default BarnyardTunnelRunnerContainer;

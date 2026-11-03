import React, { useEffect, useRef, useState, useCallback } from 'react';
import { MilkBottleFlipState } from './logic/types';
import {
  createMilkBottleFlipGame,
  flipMilkBottle,
  updateMilkBottleFlipGame,
} from './logic/engine';
import { milkBottleSound } from './systems/sound';

interface MilkBottleFlipProps {
  onBack?: () => void;
}

const VIEW_W = 400;
const VIEW_H = 650;

export const MilkBottleFlipContainer: React.FC<MilkBottleFlipProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<MilkBottleFlipState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_bottle_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createMilkBottleFlipGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<MilkBottleFlipState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createMilkBottleFlipGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      milkBottleSound.setMuted(next);
      return next;
    });
  }, []);

  const handleFlipTap = useCallback(() => {
    if (stateRef.current.status === 'game_over') {
      startNewGame();
    } else {
      stateRef.current = flipMilkBottle(stateRef.current);
      setGameState(stateRef.current);
    }
  }, [startNewGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'Enter') {
        e.preventDefault();
        handleFlipTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlipTap]);

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
      const nextState = updateMilkBottleFlipGame(prevState, dt);
      stateRef.current = nextState;

      // Play Sound effects
      for (const ev of nextState.events) {
        if (ev.type === 'flip') milkBottleSound.playFlip();
        else if (ev.type === 'double_flip') milkBottleSound.playDoubleFlip();
        else if (ev.type === 'land') milkBottleSound.playLand();
        else if (ev.type === 'fail') milkBottleSound.playFail();
      }

      // Persist High Score
      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_bottle_high', nextState.highScore.toString());
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
    st: MilkBottleFlipState,
    width: number,
    height: number
  ) => {
    const scale = Math.min(width / VIEW_W, height / VIEW_H);
    const offsetX = (width - VIEW_W * scale) * 0.5;
    const offsetY = (height - VIEW_H * scale) * 0.5;

    ctx.save();
    // Warm farmhouse kitchen background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#fef3c7');
    bgGrad.addColorStop(0.7, '#fde68a');
    bgGrad.addColorStop(1, '#d97706');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Kitchen floor
    ctx.fillStyle = '#b45309';
    ctx.fillRect(0, 480, VIEW_W, 170);
    ctx.fillStyle = '#92400e';
    for (let f = 0; f < 8; f++) {
      ctx.fillRect(f * 55, 480, 2, 170);
    }

    // Platforms
    for (const plat of st.platforms) {
      const px = plat.x - st.cameraX;
      if (px < -150 || px > VIEW_W + 150) continue;

      // Platform 3D top & base
      ctx.fillStyle = plat.color;
      ctx.beginPath();
      ctx.roundRect(px, plat.y, plat.width, plat.height, 8);
      ctx.fill();

      // Top highlight surface
      ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.fillRect(px + 4, plat.y + 2, plat.width - 8, 4);

      // Label badge
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.beginPath();
      ctx.roundRect(px + plat.width * 0.5 - 28, plat.y + 12, 56, 16, 4);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 9px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(plat.label, px + plat.width * 0.5, plat.y + 24);
    }

    // Render Milk Bottle
    const b = st.bottle;
    const bx = b.x - st.cameraX;
    const by = b.y;

    ctx.save();
    ctx.translate(bx, by);
    ctx.rotate(b.angle);

    // Bottle shadow when near surface
    if (!b.isFlipping) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      ctx.beginPath();
      ctx.ellipse(0, 2, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Bottle Glass Body (Height: 52px, Width: 24px)
    // Bottle coordinates: base sits at y = 0, bottle extends upwards to y = -52
    ctx.fillStyle = 'rgba(240, 249, 255, 0.85)';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.roundRect(-12, -44, 24, 44, 6);
    ctx.fill();
    ctx.stroke();

    // White Fresh Milk filling inside
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-10, -36, 20, 34, 4);
    ctx.fill();

    // Cute Blue Pawcade Milk Label
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(-10, -28, 20, 14);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MILK', 0, -18);

    // Bottle Neck
    ctx.fillStyle = 'rgba(240, 249, 255, 0.9)';
    ctx.fillRect(-6, -50, 12, 8);
    ctx.strokeRect(-6, -50, 12, 8);

    // Silver Foil Bottle Cap
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.roundRect(-7, -54, 14, 5, 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  };

  return (
    <div
      onClick={handleFlipTap}
      className="relative w-full h-full flex flex-col items-center justify-between bg-amber-950 select-none overflow-hidden touch-none cursor-pointer"
    >
      {/* Top HUD */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white z-10 bg-amber-900/80 backdrop-blur-sm border-b border-amber-800"
      >
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1 text-xs font-semibold bg-amber-800 hover:bg-amber-700 rounded text-amber-100 transition"
            >
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-300">Flips Landed</div>
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
            className="p-1.5 rounded-lg bg-amber-800 text-amber-200 hover:bg-amber-700 text-sm"
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
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-amber-800 bg-amber-100"
        />

        {/* First Flip Prompt */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-amber-950/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-amber-700 text-center animate-bounce">
              <div className="text-3xl mb-1">🍼</div>
              <div className="text-base font-bold text-amber-300">Tap to Flip!</div>
              <div className="text-xs text-amber-100">Tap twice in air for a double flip!</div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20"
          >
            <div className="text-4xl mb-2">🥛</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">Spilled Milk!</h2>
            <p className="text-sm text-slate-300 mb-4">Land upright on tables and furniture!</p>
            <div className="bg-slate-900/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-800 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Successful Flips</div>
              <div className="text-3xl font-black text-amber-400">{gameState.score}</div>
              {gameState.score >= gameState.highScore && gameState.score > 0 && (
                <div className="text-xs text-emerald-400 font-semibold mt-1">✨ New Personal Record!</div>
              )}
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Flip Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Tap hint */}
      <div className="w-full max-w-md py-3 text-center text-xs font-semibold text-amber-200 bg-amber-900/80 border-t border-amber-800">
        Tap to flip • Tap again in mid-air for double flip
      </div>
    </div>
  );
};

export default MilkBottleFlipContainer;

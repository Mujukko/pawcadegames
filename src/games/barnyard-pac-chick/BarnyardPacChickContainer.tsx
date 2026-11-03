import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PacChickState, Direction } from './logic/types';
import {
  createPacChickGame,
  setPacChickDirection,
  updatePacChickGame,
  GRID_COLS,
  GRID_ROWS,
} from './logic/engine';
import { pacChickSound } from './systems/sound';

interface BarnyardPacChickProps {
  onBack?: () => void;
}

const TILE_SIZE = 20;
const CANVAS_W = GRID_COLS * TILE_SIZE; // 380px
const CANVAS_H = GRID_ROWS * TILE_SIZE; // 420px

export const BarnyardPacChickContainer: React.FC<BarnyardPacChickProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<PacChickState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_pacchick_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createPacChickGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PacChickState>(gameState);
  stateRef.current = gameState;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createPacChickGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      pacChickSound.setMuted(next);
      return next;
    });
  }, []);

  const handleInputDirection = useCallback((dir: Direction) => {
    stateRef.current = setPacChickDirection(stateRef.current, dir);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleInputDirection('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleInputDirection('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleInputDirection('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        handleInputDirection('right');
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (stateRef.current.status === 'game_over' || stateRef.current.status === 'victory') {
          startNewGame();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleInputDirection, startNewGame]);

  // Touch Swipe Controls
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 18) handleInputDirection('right');
      else if (dx < -18) handleInputDirection('left');
    } else {
      if (dy > 18) handleInputDirection('down');
      else if (dy < -18) handleInputDirection('up');
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
      const nextState = updatePacChickGame(prevState, dt);
      stateRef.current = nextState;

      for (const ev of nextState.events) {
        if (ev.type === 'waka') pacChickSound.playWaka();
        else if (ev.type === 'power') pacChickSound.playPower();
        else if (ev.type === 'eat_ghost') pacChickSound.playEatGhost();
        else if (ev.type === 'die') pacChickSound.playDie();
      }

      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_pacchick_high', nextState.highScore.toString());
        } catch {}
      }

      if (
        nextState.status !== prevState.status ||
        nextState.lives !== prevState.lives ||
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
    st: PacChickState,
    width: number,
    height: number
  ) => {
    const scale = Math.min(width / CANVAS_W, height / CANVAS_H);
    const offsetX = (width - CANVAS_W * scale) * 0.5;
    const offsetY = (height - CANVAS_H * scale) * 0.5;

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Maze ground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // Render Grid Tiles (Hedges & Corn)
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const tile = st.grid[r][c];
        const tx = c * TILE_SIZE;
        const ty = r * TILE_SIZE;

        if (tile === 'wall') {
          // Lush garden hedge
          ctx.fillStyle = '#15803d';
          ctx.beginPath();
          ctx.roundRect(tx + 1, ty + 1, TILE_SIZE - 2, TILE_SIZE - 2, 4);
          ctx.fill();
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(tx + 3, ty + 3, TILE_SIZE - 6, 2);
        } else if (tile === 'gate') {
          ctx.fillStyle = '#ca8a04';
          ctx.fillRect(tx, ty + TILE_SIZE * 0.4, TILE_SIZE, 4);
        } else if (tile === 'dot') {
          // Golden corn kernel
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE * 0.5, ty + TILE_SIZE * 0.5, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (tile === 'power') {
          // Sunflower power pellet
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE * 0.5, ty + TILE_SIZE * 0.5, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.arc(tx + TILE_SIZE * 0.5, ty + TILE_SIZE * 0.5, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Render Foxes
    for (const fox of st.foxes) {
      const fx = fox.x * TILE_SIZE + TILE_SIZE * 0.5;
      const fy = fox.y * TILE_SIZE + TILE_SIZE * 0.5;

      ctx.save();
      ctx.translate(fx, fy);

      const isFrightened = fox.mode === 'frightened';
      const bodyColor = isFrightened ? '#3b82f6' : fox.color;

      // Fox Body
      ctx.fillStyle = bodyColor;
      ctx.beginPath();
      ctx.arc(0, 0, 7.5, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      ctx.beginPath();
      ctx.moveTo(-6, -4);
      ctx.lineTo(-3, -10);
      ctx.lineTo(0, -4);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.lineTo(3, -10);
      ctx.lineTo(6, -4);
      ctx.closePath();
      ctx.fill();

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-2.5, -1, 1.8, 0, Math.PI * 2);
      ctx.arc(2.5, -1, 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = isFrightened ? '#ffffff' : '#0f172a';
      ctx.beginPath();
      ctx.arc(-2, -1, 0.9, 0, Math.PI * 2);
      ctx.arc(3, -1, 0.9, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Render Clucky the Chick
    const px = st.player.x * TILE_SIZE + TILE_SIZE * 0.5;
    const py = st.player.y * TILE_SIZE + TILE_SIZE * 0.5;

    ctx.save();
    ctx.translate(px, py);

    let baseAngle = 0;
    if (st.player.dir === 'right') baseAngle = 0;
    else if (st.player.dir === 'down') baseAngle = Math.PI * 0.5;
    else if (st.player.dir === 'left') baseAngle = Math.PI;
    else if (st.player.dir === 'up') baseAngle = -Math.PI * 0.5;

    ctx.rotate(baseAngle);

    // Chick body with gobble mouth wedge
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    const mAngle = st.player.mouthAngle;
    ctx.arc(0, 0, 8, mAngle, Math.PI * 2 - mAngle);
    ctx.closePath();
    ctx.fill();

    // Eye
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(1, -4, 1.5, 0, Math.PI * 2);
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
            <div className="text-[10px] uppercase font-bold text-amber-400">Score</div>
            <div className="text-xl font-black text-white leading-none">{gameState.score}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: gameState.lives }).map((_, i) => (
              <span key={i} className="text-base">🐣</span>
            ))}
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
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-800 bg-slate-900"
        />

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">🦊</div>
            <h2 className="text-2xl font-black text-rose-500 mb-1">Caught by the Foxes!</h2>
            <p className="text-sm text-slate-300 mb-4">Eat sunflowers to scare the foxes away!</p>
            <div className="bg-slate-900/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-800 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Final Score</div>
              <div className="text-3xl font-black text-amber-400">{gameState.score}</div>
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Try Again (Space)
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">🌻</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1">Maze Cleared!</h2>
            <p className="text-sm text-slate-300 mb-4">Clucky gobbled every single corn kernel!</p>
            <div className="bg-slate-900/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-800 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Victory Score</div>
              <div className="text-3xl font-black text-amber-400">{gameState.score}</div>
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Play Next Level
            </button>
          </div>
        )}
      </div>

      {/* Mobile D-Pad */}
      <div className="w-full max-w-md px-6 py-2 flex flex-col items-center gap-1 z-10 bg-slate-900/90 border-t border-slate-800">
        <button
          onClick={() => handleInputDirection('up')}
          className="w-14 h-11 bg-slate-800 active:bg-amber-600 text-white font-bold rounded-lg flex items-center justify-center shadow"
        >
          ▲
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => handleInputDirection('left')}
            className="w-14 h-11 bg-slate-800 active:bg-amber-600 text-white font-bold rounded-lg flex items-center justify-center shadow"
          >
            ◀
          </button>
          <button
            onClick={() => handleInputDirection('down')}
            className="w-14 h-11 bg-slate-800 active:bg-amber-600 text-white font-bold rounded-lg flex items-center justify-center shadow"
          >
            ▼
          </button>
          <button
            onClick={() => handleInputDirection('right')}
            className="w-14 h-11 bg-slate-800 active:bg-amber-600 text-white font-bold rounded-lg flex items-center justify-center shadow"
          >
            ▶
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarnyardPacChickContainer;

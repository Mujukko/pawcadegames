import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HappyMilkPailState } from './logic/types';
import {
  createMilkPailGame,
  addPointToCurrentLine,
  finishCurrentLine,
  startPouring,
  updateMilkPailGame,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  LEVELS,
} from './logic/engine';
import { milkPailSound } from './systems/sound';

interface HappyMilkPailProps {
  onBack?: () => void;
}

export const HappyMilkPailContainer: React.FC<HappyMilkPailProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<HappyMilkPailState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_pail_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createMilkPailGame(1, high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<HappyMilkPailState>(gameState);
  stateRef.current = gameState;

  const isDrawingRef = useRef(false);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startLevel = useCallback((lvlNum: number) => {
    const next = createMilkPailGame(lvlNum, stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      milkPailSound.setMuted(next);
      return next;
    });
  }, []);

  // Pointer event drawing handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (stateRef.current.status !== 'drawing') return;
    isDrawingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const pt = getCanvasCoords(e);
    stateRef.current = addPointToCurrentLine(stateRef.current, pt);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || stateRef.current.status !== 'drawing') return;
    const pt = getCanvasCoords(e);
    stateRef.current = addPointToCurrentLine(stateRef.current, pt);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    stateRef.current = finishCurrentLine(stateRef.current);
    setGameState({ ...stateRef.current });
  };

  const handlePour = () => {
    if (stateRef.current.status === 'drawing') {
      stateRef.current = startPouring(stateRef.current);
      setGameState({ ...stateRef.current });
    }
  };

  const handleClearLines = () => {
    if (stateRef.current.status === 'drawing') {
      const reset = createMilkPailGame(stateRef.current.level, stateRef.current.highScore);
      stateRef.current = reset;
      setGameState(reset);
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
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.04);
      lastTimeRef.current = time;

      const prevState = stateRef.current;
      const nextState = updateMilkPailGame(prevState, dt);
      stateRef.current = nextState;

      for (const ev of nextState.events) {
        if (ev.type === 'pour') milkPailSound.playPour();
        else if (ev.type === 'drop_in') milkPailSound.playDropIn();
        else if (ev.type === 'happy') milkPailSound.playHappy();
        else if (ev.type === 'fail') milkPailSound.playFail();
      }

      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_pail_high', nextState.highScore.toString());
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
    st: HappyMilkPailState,
    width: number,
    height: number
  ) => {
    const scale = Math.min(width / CANVAS_WIDTH, height / CANVAS_HEIGHT);
    const offsetX = (width - CANVAS_WIDTH * scale) * 0.5;
    const offsetY = (height - CANVAS_HEIGHT * scale) * 0.5;

    ctx.save();
    // Warm pastel yellow grid background
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Notebook grid lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    // Static obstacles (shelves / pegs)
    for (const obs of st.obstacles) {
      ctx.fillStyle = '#64748b';
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 6);
      ctx.fill();
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(obs.x + 2, obs.y + 2, obs.width - 4, 3);
    }

    // Drawn lines
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const seg of st.lines) {
      ctx.beginPath();
      ctx.moveTo(seg.p1.x, seg.p1.y);
      ctx.lineTo(seg.p2.x, seg.p2.y);
      ctx.stroke();
    }

    // Currently drawing line
    if (st.currentLine.length > 1) {
      ctx.beginPath();
      ctx.moveTo(st.currentLine[0].x, st.currentLine[0].y);
      for (let i = 1; i < st.currentLine.length; i++) {
        ctx.lineTo(st.currentLine[i].x, st.currentLine[i].y);
      }
      ctx.stroke();
    }

    // Milk Pipe (Faucet)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.roundRect(st.pipe.x - 16, 0, 32, st.pipe.y, 4);
    ctx.fill();
    ctx.fillStyle = '#64748b';
    ctx.fillRect(st.pipe.x - 20, st.pipe.y - 8, 40, 8);

    // Droplets
    for (const drop of st.droplets) {
      if (drop.lost) continue;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(drop.x, drop.y, drop.radius, 0, Math.PI * 2);
      ctx.fill();
      // White reflection dot
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(drop.x - 1, drop.y - 1, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Milk Pail Container
    const p = st.pail;
    ctx.save();
    ctx.translate(p.x, p.y);

    // Milk level inside pail
    const fillRatio = Math.min(1, p.dropletCount / p.capacityNeeded);
    const fillHeight = (p.height - 12) * fillRatio;
    ctx.fillStyle = '#bae6fd';
    ctx.fillRect(6, p.height - fillHeight - 4, p.width - 12, fillHeight);

    // Outer Pail Body (trapezoid bucket)
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(2, 0);
    ctx.lineTo(8, p.height);
    ctx.lineTo(p.width - 8, p.height);
    ctx.lineTo(p.width - 2, 0);
    ctx.stroke();

    // Required capacity dashed line
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, p.height - (p.height - 12));
    ctx.lineTo(p.width - 6, p.height - (p.height - 12));
    ctx.stroke();
    ctx.setLineDash([]);

    // Face on the pail
    const faceY = p.height * 0.55;
    // Eyes
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(p.width * 0.35, faceY - 4, 3, 0, Math.PI * 2);
    ctx.arc(p.width * 0.65, faceY - 4, 3, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    if (p.isHappy) {
      // Big happy smile! :D
      ctx.arc(p.width * 0.5, faceY + 2, 9, 0.1, Math.PI - 0.1);
      ctx.stroke();
      // Pink blush cheeks
      ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.beginPath();
      ctx.arc(p.width * 0.25, faceY + 2, 4, 0, Math.PI * 2);
      ctx.arc(p.width * 0.75, faceY + 2, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Sad inverted frown :(
      ctx.arc(p.width * 0.5, faceY + 10, 8, Math.PI + 0.3, Math.PI * 2 - 0.3);
      ctx.stroke();
    }

    ctx.restore();

    ctx.restore();
  };

  const inkPercentage = Math.round((gameState.inkRemaining / gameState.maxInk) * 100);

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
            <div className="text-[10px] uppercase font-bold text-amber-400">Level {gameState.level}</div>
            <div className="text-sm font-black text-white leading-none">
              Filled: {gameState.pail.dropletCount}/{gameState.pail.capacityNeeded}
            </div>
          </div>
        </div>

        {/* Ink bar */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] font-bold text-sky-400 mb-0.5">Ink: {inkPercentage}%</div>
          <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                inkPercentage > 50 ? 'bg-emerald-500' : inkPercentage > 20 ? 'bg-amber-500' : 'bg-rose-500'
              }`}
              style={{ width: `${inkPercentage}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
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
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-700 bg-slate-100 cursor-crosshair"
        />

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">🥛✨</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1">Happy Pail Filled!</h2>
            <div className="flex gap-2 text-3xl mb-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i}>{i < gameState.stars ? '⭐' : '☆'}</span>
              ))}
            </div>
            <p className="text-sm text-slate-300 mb-4">You guided the fresh milk right into the pail!</p>
            <button
              onClick={() => startLevel(gameState.level + 1)}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              {gameState.level < LEVELS.length ? 'Next Level ▶' : 'Play Again!'}
            </button>
          </div>
        )}

        {/* Failed Modal */}
        {gameState.status === 'failed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">💧😢</div>
            <h2 className="text-2xl font-black text-rose-500 mb-1">Not Enough Milk!</h2>
            <p className="text-sm text-slate-300 mb-4">Draw steeper ramps to catch every drop!</p>
            <button
              onClick={() => startLevel(gameState.level)}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Try Again ↺
            </button>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between gap-3 z-10 bg-slate-800/90 border-t border-slate-700">
        <button
          onClick={handleClearLines}
          disabled={gameState.status !== 'drawing'}
          className="px-4 py-2.5 bg-slate-700 active:bg-slate-600 disabled:opacity-50 text-slate-200 font-bold rounded-xl text-sm transition"
        >
          Clear
        </button>

        <button
          onClick={handlePour}
          disabled={gameState.status !== 'drawing'}
          className="flex-1 py-2.5 bg-gradient-to-r from-sky-500 to-sky-600 active:from-sky-600 active:to-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-base shadow transition"
        >
          Pour Milk ▶
        </button>
      </div>
    </div>
  );
};

export default HappyMilkPailContainer;

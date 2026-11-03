import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HayStackGameState } from './logic/types';
import {
  createHayStackGame,
  dropBlock,
  updateHayStackGame,
  BLOCK_HEIGHT,
} from './logic/engine';
import { hayStackSound } from './systems/sound';

interface BarnyardHayStackProps {
  onBack?: () => void;
}

export const BarnyardHayStackContainer: React.FC<BarnyardHayStackProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<HayStackGameState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_haystack_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createHayStackGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<HayStackGameState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);
  const cameraYRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createHayStackGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const handleTap = useCallback(() => {
    if (stateRef.current.status === 'game_over') {
      startNewGame();
      return;
    }
    const next = dropBlock(stateRef.current);
    stateRef.current = next;

    if (next.events.length > 0) {
      const evt = next.events[0];
      if (evt.type === 'perfect') hayStackSound.playPerfect(next.perfectStreak);
      else if (evt.type === 'slice') hayStackSound.playSlice();
      else if (evt.type === 'miss') hayStackSound.playMiss();
    }
  }, [startNewGame]);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      hayStackSound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        handleTap();
      } else if (e.key === 'r' || e.key === 'R') {
        startNewGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap, startNewGame]);

  // Main 60 FPS loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updateHayStackGame(current, dt);
      stateRef.current = next;

      // Smooth camera track to top of stack
      const targetCameraY = next.stack[next.stack.length - 1].y;
      cameraYRef.current += (targetCameraY - cameraYRef.current) * Math.min(1, dt * 5);

      renderCanvas(next, cameraYRef.current);

      hudTimer += dt;
      if (hudTimer >= 0.2 || next.status !== current.status) {
        hudTimer = 0;
        setGameState(next);
        if (next.highScore > current.highScore) {
          try {
            localStorage.setItem('pawcade_haystack_high', String(next.highScore));
          } catch {}
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderCanvas = (state: HayStackGameState, cameraY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dynamic sky gradient that shifts as stack climbs into the clouds
    const altitude = state.score;
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    if (altitude < 15) {
      sky.addColorStop(0, '#38bdf8'); // sunlit cyan
      sky.addColorStop(1, '#bae6fd');
    } else if (altitude < 35) {
      sky.addColorStop(0, '#f97316'); // sunset orange
      sky.addColorStop(1, '#fde047');
    } else {
      sky.addColorStop(0, '#0f172a'); // starry space
      sky.addColorStop(1, '#312e81');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Center baseline
    const centerX = width * 0.5;
    const viewBaseY = height * 0.72; // Screen anchor for top block

    // Helper to project 3D isometric-style rectangular bale
    const drawIsometricBlock = (
      bx: number,
      by: number,
      bWidth: number,
      bHeight: number,
      color: string,
      alpha = 1
    ) => {
      const sx = centerX + bx;
      const sy = viewBaseY - (by - cameraY);

      const depth = 38; // isometric extrusion depth
      const depthX = 26;
      const depthY = -14;

      ctx.save();
      ctx.globalAlpha = alpha;

      // 1. Top Face
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(sx - bWidth * 0.5, sy - bHeight);
      ctx.lineTo(sx + bWidth * 0.5, sy - bHeight);
      ctx.lineTo(sx + bWidth * 0.5 + depthX, sy - bHeight + depthY);
      ctx.lineTo(sx - bWidth * 0.5 + depthX, sy - bHeight + depthY);
      ctx.closePath();
      ctx.fill();

      // Top face highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.fill();

      // 2. Right Extrusion Face
      ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
      ctx.beginPath();
      ctx.moveTo(sx + bWidth * 0.5, sy);
      ctx.lineTo(sx + bWidth * 0.5 + depthX, sy + depthY);
      ctx.lineTo(sx + bWidth * 0.5 + depthX, sy - bHeight + depthY);
      ctx.lineTo(sx + bWidth * 0.5, sy - bHeight);
      ctx.closePath();
      ctx.fill();

      // 3. Front Face
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.rect(sx - bWidth * 0.5, sy - bHeight, bWidth, bHeight);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.restore();
    };

    // Draw settled stack blocks
    state.stack.forEach((b) => {
      drawIsometricBlock(b.x, b.y, b.width, b.height, b.color);
    });

    // Draw sliced tumbling pieces
    state.slicedPieces.forEach((p) => {
      ctx.save();
      const sx = centerX + p.x;
      const sy = viewBaseY - (p.y - cameraY);
      ctx.translate(sx, sy);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.width * 0.5, -p.height * 0.5, p.width, p.height);
      ctx.restore();
    });

    // Draw active moving block
    if (state.activeBlock) {
      const ab = state.activeBlock;
      drawIsometricBlock(ab.x, ab.y, ab.width, ab.height, ab.color, 0.95);
    }
  };

  return (
    <div
      onClick={handleTap}
      className="relative flex flex-col items-center justify-between w-full h-full max-w-md mx-auto select-none bg-slate-950 text-white font-sans overflow-hidden cursor-pointer"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD */}
      <header className="w-full px-4 py-2.5 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm z-10 pointer-events-auto">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onBack();
              }}
              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-semibold transition"
            >
              ← Hub
            </button>
          )}
          <div className="font-extrabold text-amber-400 flex items-center gap-1">
            <span>📦🌾</span>
            <span>Barnyard Hay Stack</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-black text-2xl text-white">
            {gameState.score}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main 3D Canvas Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={400}
          height={650}
          className="w-full h-full max-h-[78vh] object-contain block"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
            <div className="text-5xl mb-2 animate-bounce">🌾📦</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">TAP TO STACK!</h2>
            <p className="text-xs text-slate-200 max-w-xs mb-3">
              Drop moving hay blocks precisely on top of the stack. Perfect placements play ascending chords and expand block size!
            </p>
            <div className="text-xs bg-slate-900/90 border border-slate-700 px-3 py-1.5 rounded-full font-bold text-emerald-400 animate-pulse">
              Tap Anywhere or Press Space
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in pointer-events-auto">
            <div className="text-5xl mb-2">💥🌾</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">TOWER COLLAPSED!</h2>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 text-sm font-bold text-emerald-400 w-full max-w-xs">
              Height: {gameState.score} • Best: {gameState.highScore}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                startNewGame();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-black rounded-xl shadow-lg transition active:scale-95"
            >
              🔄 Stack Again
            </button>
          </div>
        )}
      </div>

      {/* Accessible Footer Bar */}
      <footer className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs font-bold z-10 pointer-events-auto">
        <span className="text-slate-400">Streak: {gameState.perfectStreak} ★</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleTap();
          }}
          className="flex-1 max-w-xs py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl shadow transition active:scale-95 mx-4"
        >
          DROP BLOCK (Space)
        </button>
        <span className="text-slate-400">Best: {gameState.highScore}</span>
      </footer>
    </div>
  );
};

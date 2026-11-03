import React, { useEffect, useRef, useState, useCallback } from 'react';
import { HelixGameState } from './logic/types';
import {
  createHelixGame,
  rotateTower,
  updateHelixGame,
  FLOOR_SPACING,
  normalizeAngle,
} from './logic/engine';
import { helixSound } from './systems/sound';

interface HelixSiloDropProps {
  onBack?: () => void;
}

export const HelixSiloDropContainer: React.FC<HelixSiloDropProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<HelixGameState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_helix_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createHelixGame(15, high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<HelixGameState>(gameState);
  stateRef.current = gameState;

  const dragStartXRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback((floors = 15) => {
    const next = createHelixGame(floors, stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      helixSound.setMuted(next);
      return next;
    });
  }, []);

  // Pointer drag controls for rotating the tower
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStartXRef.current = e.clientX;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (dragStartXRef.current === null) return;
    const deltaX = e.clientX - dragStartXRef.current;
    dragStartXRef.current = e.clientX;

    // Rotate tower (sensitivity factor)
    const angleDelta = deltaX * 0.012;
    stateRef.current = rotateTower(stateRef.current, angleDelta);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragStartXRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current = rotateTower(stateRef.current, -0.22);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current = rotateTower(stateRef.current, 0.22);
      } else if (e.key === 'r' || e.key === 'R') {
        startNewGame(stateRef.current.totalFloors);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewGame]);

  // Main 60 FPS loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updateHelixGame(current, dt);
      stateRef.current = next;

      if (next.events.length > 0) {
        for (const evt of next.events) {
          if (evt.type === 'bounce') helixSound.playBounce();
          else if (evt.type === 'pass_floor') helixSound.playPassFloor(next.ball.comboStreak);
          else if (evt.type === 'smash_floor') helixSound.playSmash();
          else if (evt.type === 'hit_hazard') helixSound.playHazard();
          else if (evt.type === 'victory') helixSound.playVictory();
        }
      }

      renderCanvas(next);

      hudTimer += dt;
      if (hudTimer >= 0.2 || next.status !== current.status) {
        hudTimer = 0;
        setGameState(next);
        if (next.highScore > current.highScore) {
          try {
            localStorage.setItem('pawcade_helix_high', String(next.highScore));
          } catch {}
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderCanvas = (state: HelixGameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Dynamic background gradient (pastoral sunset to dusk)
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, '#1e1b4b');
    bg.addColorStop(0.5, '#312e81');
    bg.addColorStop(1, '#0f172a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    // Center coordinates
    const centerX = width * 0.5;
    const ballScreenY = height * 0.35; // Ball stays locked at this screen height
    const cameraY = state.ball.y - ballScreenY;

    // Draw central wooden/metal silo core pillar
    ctx.fillStyle = '#475569';
    ctx.fillRect(centerX - 35, 0, 70, height);
    ctx.fillStyle = '#64748b';
    ctx.fillRect(centerX - 25, 0, 16, height); // highlight strip

    // Draw silo platforms (from back to front, top to bottom)
    const towerRadiusX = 140;
    const towerRadiusY = 42;

    state.floors.forEach((floor) => {
      if (floor.isBroken) return;

      const screenY = floor.y - cameraY;
      // Only render floors reasonably close to viewport
      if (screenY < -100 || screenY > height + 100) return;

      const isGoal = floor.floorIndex === state.totalFloors - 1;

      // Draw each sector
      floor.sectors.forEach((sec) => {
        if (sec.type === 'gap') return;

        const startAngle = sec.startAngle + state.towerAngle;
        const endAngle = sec.endAngle + state.towerAngle;

        ctx.save();
        ctx.translate(centerX, screenY);

        ctx.beginPath();
        // Outer ellipse arc
        ctx.ellipse(0, 0, towerRadiusX, towerRadiusY, 0, startAngle, endAngle);
        // Inner ellipse arc backwards
        ctx.ellipse(0, 0, 36, 12, 0, endAngle, startAngle, true);
        ctx.closePath();

        if (isGoal) {
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ca8a04';
        } else if (sec.type === 'hazard') {
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#991b1b';
        } else {
          ctx.fillStyle = '#10b981';
          ctx.strokeStyle = '#047857';
        }

        ctx.fill();
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 3D Platform Rim / Thickness
        ctx.beginPath();
        ctx.ellipse(0, 10, towerRadiusX, towerRadiusY, 0, startAngle, endAngle);
        ctx.ellipse(0, 0, towerRadiusX, towerRadiusY, 0, endAngle, startAngle, true);
        ctx.closePath();
        ctx.fillStyle = isGoal ? '#b45309' : sec.type === 'hazard' ? '#7f1d1d' : '#065f46';
        ctx.fill();

        ctx.restore();
      });
    });

    // Draw Bouncing Egg/Ball
    ctx.save();
    ctx.translate(centerX, ballScreenY);

    // Ball shadow on platform directly below
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fire / Super Smash aura
    if (state.ball.isSuperSmash) {
      ctx.fillStyle = 'rgba(249, 115, 22, 0.4)';
      ctx.beginPath();
      ctx.arc(0, 0, state.ball.radius + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ball body (cute spotted farm egg)
    const eggGrad = ctx.createRadialGradient(-4, -5, 2, 0, 0, state.ball.radius);
    if (state.ball.isSuperSmash) {
      eggGrad.addColorStop(0, '#fed7aa');
      eggGrad.addColorStop(0.6, '#f97316');
      eggGrad.addColorStop(1, '#c2410c');
    } else {
      eggGrad.addColorStop(0, '#ffffff');
      eggGrad.addColorStop(0.7, '#fef08a');
      eggGrad.addColorStop(1, '#eab308');
    }
    ctx.fillStyle = eggGrad;
    ctx.beginPath();
    ctx.arc(0, 0, state.ball.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = state.ball.isSuperSmash ? '#ea580c' : '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Specular eye catchlight
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-4, -5, 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const progressPercent = Math.min(100, Math.round((gameState.currentFloor / gameState.totalFloors) * 100));

  return (
    <div
      className="relative flex flex-col items-center justify-between w-full h-full max-w-md mx-auto select-none bg-slate-950 text-white font-sans overflow-hidden"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top Header & Progress */}
      <header className="w-full px-4 py-2 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex flex-col gap-2 z-10">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-semibold transition"
              >
                ← Hub
              </button>
            )}
            <div className="font-extrabold text-amber-400 flex items-center gap-1">
              <span>🌾</span>
              <span>Helix Silo Drop</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="font-bold text-emerald-400">
              Score: <span>{gameState.score}</span>
            </div>
            <button
              onClick={toggleSound}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>

        {/* Progress Bar down the Silo */}
        <div className="w-full flex items-center gap-2 text-[11px] font-bold text-slate-300">
          <span>Top</span>
          <div className="flex-1 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span>Floor {gameState.currentFloor}/{gameState.totalFloors}</span>
        </div>
      </header>

      {/* Main 2D Canvas Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={400}
          height={650}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full max-h-[75vh] object-contain block cursor-grab active:cursor-grabbing"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
            <div className="text-5xl mb-2 animate-bounce">🥚🌀</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">SWIPE TO ROTATE</h2>
            <p className="text-xs text-slate-300 max-w-xs mb-3">
              Drop the egg through the silo platform gaps. Avoid red hazard tiles! Drop through 3+ floors to activate Super Smash!
            </p>
            <div className="text-xs bg-slate-900/90 border border-slate-700 p-2 rounded-lg font-bold text-emerald-400">
              👈 Drag or Arrow Keys to Spin 👉
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">💥🥚</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">EGG CRACKED!</h2>
            <p className="text-xs text-slate-300 mb-3">You hit a red hazard sector!</p>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 text-sm font-bold text-amber-300 w-full max-w-xs">
              Score: {gameState.score} • Best: {gameState.highScore}
            </div>
            <button
              onClick={() => startNewGame(gameState.totalFloors)}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-black rounded-xl shadow-lg transition active:scale-95"
            >
              🔄 Play Again
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">🏆🎉</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">SILO CONQUERED!</h2>
            <p className="text-xs text-slate-300 mb-3">You reached the golden victory floor safe & sound!</p>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 text-sm font-bold text-emerald-400 w-full max-w-xs">
              Final Score: {gameState.score} • Best: {gameState.highScore}
            </div>
            <button
              onClick={() => startNewGame(gameState.totalFloors + 3)}
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black rounded-xl shadow-lg transition active:scale-95"
            >
              Next Challenge (+3 Floors) →
            </button>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <footer className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 text-xs font-bold z-10">
        <button
          onClick={() => {
            stateRef.current = rotateTower(stateRef.current, -0.35);
          }}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center gap-1 border border-slate-700 transition active:scale-95"
        >
          <span>◀ Spin Left</span>
        </button>

        <button
          onClick={() => startNewGame(gameState.totalFloors)}
          className="px-4 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl border border-slate-700 transition active:scale-95"
        >
          🔄 Restart
        </button>

        <button
          onClick={() => {
            stateRef.current = rotateTower(stateRef.current, 0.35);
          }}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center gap-1 border border-slate-700 transition active:scale-95"
        >
          <span>Spin Right ▶</span>
        </button>
      </footer>
    </div>
  );
};

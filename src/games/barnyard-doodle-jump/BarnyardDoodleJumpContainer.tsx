import React, { useEffect, useRef, useState, useCallback } from 'react';
import { DoodleGameState } from './logic/types';
import {
  createDoodleGame,
  moveDoodlePlayer,
  updateDoodleGame,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from './logic/engine';
import { doodleSound } from './systems/sound';

interface BarnyardDoodleJumpProps {
  onBack?: () => void;
}

export const BarnyardDoodleJumpContainer: React.FC<BarnyardDoodleJumpProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<DoodleGameState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_doodle_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createDoodleGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<DoodleGameState>(gameState);
  stateRef.current = gameState;

  const keyStateRef = useRef<{ left: boolean; right: boolean }>({ left: false, right: false });
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createDoodleGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      doodleSound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyStateRef.current.left = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyStateRef.current.right = true;
      } else if (e.key === ' ' || e.key === 'Enter') {
        if (stateRef.current.status === 'game_over') {
          startNewGame();
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyStateRef.current.left = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyStateRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [startNewGame]);

  // Touch drag controls
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    if (touchX < rect.width * 0.5) {
      keyStateRef.current.left = true;
      keyStateRef.current.right = false;
    } else {
      keyStateRef.current.right = true;
      keyStateRef.current.left = false;
    }
  };

  const handlePointerUp = () => {
    keyStateRef.current.left = false;
    keyStateRef.current.right = false;
  };

  // Main 60 FPS animation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      // Handle continuous steering
      let dir = 0;
      if (keyStateRef.current.left) dir -= 1;
      if (keyStateRef.current.right) dir += 1;

      if (dir !== 0 || stateRef.current.player.vx !== 0) {
        stateRef.current = moveDoodlePlayer(stateRef.current, dir);
      }

      // Step physics
      const prevState = stateRef.current;
      const nextState = updateDoodleGame(prevState, dt);
      stateRef.current = nextState;

      // Process procedural audio events
      for (const ev of nextState.events) {
        if (ev.type === 'bounce') doodleSound.playBounce();
        else if (ev.type === 'spring') doodleSound.playSpring();
        else if (ev.type === 'propeller') doodleSound.playPropeller();
        else if (ev.type === 'fall') doodleSound.playFall();
      }

      // Persist high score
      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_doodle_high', nextState.highScore.toString());
        } catch {}
      }

      // Sync React state if status changed or periodically
      if (nextState.status !== prevState.status || Math.floor(time / 250) !== Math.floor((time - dt * 1000) / 250)) {
        setGameState(nextState);
      }

      // Render Frame
      renderGame(ctx, nextState, canvas.width, canvas.height);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const renderGame = (
    ctx: CanvasRenderingContext2D,
    st: DoodleGameState,
    width: number,
    height: number
  ) => {
    const scale = Math.min(width / WORLD_WIDTH, height / WORLD_HEIGHT);
    const offsetX = (width - WORLD_WIDTH * scale) * 0.5;
    const offsetY = (height - WORLD_HEIGHT * scale) * 0.5;

    ctx.save();
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, '#7dd3fc');
    sky.addColorStop(0.5, '#bae6fd');
    sky.addColorStop(1, '#e0f2fe');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Decorative background clouds (scrolling with camera)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    for (let c = 0; c < 8; c++) {
      const cloudY = WORLD_HEIGHT - ((c * 180 - st.cameraY * 0.3) % (WORLD_HEIGHT + 200));
      const cloudX = (c * 110 + 40) % WORLD_WIDTH;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 32, 0, Math.PI * 2);
      ctx.arc(cloudX + 24, cloudY - 10, 26, 0, Math.PI * 2);
      ctx.arc(cloudX - 22, cloudY + 4, 22, 0, Math.PI * 2);
      ctx.fill();
    }

    // Coordinate conversion:
    // World Y goes upwards from 0. Screen Y = WORLD_HEIGHT - (worldY - cameraY)
    const toScreenY = (wY: number) => WORLD_HEIGHT - (wY - st.cameraY);

    // Draw Platforms
    for (const plat of st.platforms) {
      const py = toScreenY(plat.y);
      if (py < -50 || py > WORLD_HEIGHT + 50) continue;

      if (plat.isBroken) {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(plat.x, py, plat.width * 0.4, plat.height);
        ctx.fillRect(plat.x + plat.width * 0.6, py + 8, plat.width * 0.4, plat.height);
        continue;
      }

      if (plat.type === 'moving') {
        // Blue high-tech moving rail
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.roundRect(plat.x, py, plat.width, plat.height, 6);
        ctx.fill();
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(plat.x + 4, py + 3, plat.width - 8, 3);
      } else if (plat.type === 'fragile') {
        // Cracked brown wooden plank
        ctx.fillStyle = '#b45309';
        ctx.beginPath();
        ctx.roundRect(plat.x, py, plat.width, plat.height, 5);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(plat.x + plat.width * 0.4, py);
        ctx.lineTo(plat.x + plat.width * 0.55, py + plat.height);
        ctx.stroke();
      } else {
        // Standard green pasture wooden platform
        ctx.fillStyle = '#16a34a';
        ctx.beginPath();
        ctx.roundRect(plat.x, py, plat.width, plat.height, 6);
        ctx.fill();
        ctx.fillStyle = '#4ade80';
        ctx.fillRect(plat.x + 4, py + 2, plat.width - 8, 3);
      }

      // Spring coil on top of platform
      if (plat.hasSpring) {
        const springX = plat.x + plat.width * 0.5 - 6;
        const springY = py - 12;
        ctx.strokeStyle = '#e11d48';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(springX, py);
        ctx.lineTo(springX + 12, py - 4);
        ctx.lineTo(springX, py - 8);
        ctx.lineTo(springX + 12, springY);
        ctx.stroke();
      }
    }

    // Draw Clucky the Bouncing Chick
    const playerScreenY = toScreenY(st.player.y);
    const px = st.player.x;
    const facingLeft = st.player.facing === 'left';

    ctx.save();
    ctx.translate(px, playerScreenY - 16);
    if (facingLeft) ctx.scale(-1, 1);

    // Body shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chick plump yellow body
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belly highlight
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(3, 4, 10, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(6, -6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, -7, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(14, -4);
    ctx.lineTo(22, -2);
    ctx.lineTo(14, 2);
    ctx.closePath();
    ctx.fill();

    // Little cute wing
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(-6, 2, 8, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    // Orange Feet
    ctx.fillStyle = '#ea580c';
    ctx.fillRect(-6, 14, 4, 4);
    ctx.fillRect(2, 14, 4, 4);

    ctx.restore();

    ctx.restore();
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-slate-900 select-none overflow-hidden touch-none">
      {/* Top HUD */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white z-10 bg-slate-800/80 backdrop-blur-sm border-b border-slate-700">
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
            <div className="text-lg font-black text-white leading-none">{gameState.score}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Best</div>
            <div className="text-sm font-bold text-white leading-none">{gameState.highScore}</div>
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
          width={400}
          height={650}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-700 bg-sky-200 cursor-pointer"
        />

        {/* Game Over Modal Overlay */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20">
            <div className="text-4xl mb-2">🌾</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">Puff! Landed in Hay!</h2>
            <p className="text-sm text-slate-300 mb-4">Clucky bounced high above the clouds!</p>
            <div className="bg-slate-800/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-700 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Final Altitude</div>
              <div className="text-3xl font-black text-amber-400">{gameState.score}</div>
              {gameState.score >= gameState.highScore && gameState.score > 0 && (
                <div className="text-xs text-emerald-400 font-semibold mt-1">✨ New Personal Record!</div>
              )}
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Bounce Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Bottom Mobile On-Screen Touch Controls */}
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between gap-4 z-10 bg-slate-800/90 border-t border-slate-700">
        <button
          onPointerDown={() => {
            keyStateRef.current.left = true;
            keyStateRef.current.right = false;
          }}
          onPointerUp={() => {
            keyStateRef.current.left = false;
          }}
          onPointerLeave={() => {
            keyStateRef.current.left = false;
          }}
          className="flex-1 py-3 bg-slate-700 active:bg-amber-600 hover:bg-slate-600 text-white font-bold rounded-xl text-lg flex items-center justify-center transition shadow select-none"
        >
          ◀ Left
        </button>
        <button
          onPointerDown={() => {
            keyStateRef.current.right = true;
            keyStateRef.current.left = false;
          }}
          onPointerUp={() => {
            keyStateRef.current.right = false;
          }}
          onPointerLeave={() => {
            keyStateRef.current.right = false;
          }}
          className="flex-1 py-3 bg-slate-700 active:bg-amber-600 hover:bg-slate-600 text-white font-bold rounded-xl text-lg flex items-center justify-center transition shadow select-none"
        >
          Right ▶
        </button>
      </div>
    </div>
  );
};

export default BarnyardDoodleJumpContainer;

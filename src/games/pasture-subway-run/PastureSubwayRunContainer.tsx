import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SubwayGameState } from './logic/types';
import {
  createSubwayGame,
  changeLane,
  jumpPlayer,
  rollPlayer,
  updateSubwayGame,
  LANE_WIDTH,
} from './logic/engine';
import { subwaySound } from './systems/sound';

interface PastureSubwayRunProps {
  onBack?: () => void;
}

export const PastureSubwayRunContainer: React.FC<PastureSubwayRunProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<SubwayGameState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_subway_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createSubwayGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SubwayGameState>(gameState);
  stateRef.current = gameState;

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createSubwayGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      subwaySound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard controls (Arrows / WASD / Space)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current = changeLane(stateRef.current, 'left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current = changeLane(stateRef.current, 'right');
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        e.preventDefault();
        stateRef.current = jumpPlayer(stateRef.current);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stateRef.current = rollPlayer(stateRef.current);
      } else if (e.key === 'r' || e.key === 'R') {
        startNewGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [startNewGame]);

  // Touch Swipe gestures
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < 20) return; // Too small

    if (absDx > absDy) {
      if (dx < 0) stateRef.current = changeLane(stateRef.current, 'left');
      else stateRef.current = changeLane(stateRef.current, 'right');
    } else {
      if (dy < 0) stateRef.current = jumpPlayer(stateRef.current);
      else stateRef.current = rollPlayer(stateRef.current);
    }
  };

  // Main 60 FPS animation loop
  useEffect(() => {
    lastTimeRef.current = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updateSubwayGame(current, dt);
      stateRef.current = next;

      if (next.events.length > 0) {
        for (const evt of next.events) {
          if (evt.type === 'jump') subwaySound.playJump();
          else if (evt.type === 'roll') subwaySound.playRoll();
          else if (evt.type === 'coin') subwaySound.playCoin();
          else if (evt.type === 'powerup') subwaySound.playPowerUp();
          else if (evt.type === 'crash') subwaySound.playCrash();
        }
      }

      renderCanvas(next);

      hudTimer += dt;
      if (hudTimer >= 0.2 || next.status !== current.status) {
        hudTimer = 0;
        setGameState(next);
        if (next.highScore > current.highScore) {
          try {
            localStorage.setItem('pawcade_subway_high', String(next.highScore));
          } catch {}
        }
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderCanvas = (state: SubwayGameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Sunny countryside sky
    const sky = ctx.createLinearGradient(0, 0, 0, height * 0.4);
    sky.addColorStop(0, '#38bdf8');
    sky.addColorStop(1, '#bae6fd');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height * 0.4);

    // Pastoral green ground
    const ground = ctx.createLinearGradient(0, height * 0.4, 0, height);
    ground.addColorStop(0, '#15803d');
    ground.addColorStop(1, '#166534');
    ctx.fillStyle = ground;
    ctx.fillRect(0, height * 0.4, width, height * 0.6);

    // 3D Perspective Projection
    const vpX = width * 0.5;
    const vpY = height * 0.38; // Vanishing point
    const cameraDist = 220;

    const project = (laneX: number, y: number, z: number) => {
      const scale = cameraDist / Math.max(10, z + cameraDist);
      const px = vpX + laneX * scale;
      const py = vpY + (height * 0.52 - y) * scale;
      return { px, py, scale };
    };

    // Draw 3 Railway Tracks & Wooden Ties
    const lanes = [-1, 0, 1];
    lanes.forEach((l) => {
      const pNear = project(l * LANE_WIDTH, 0, 0);
      const pFar = project(l * LANE_WIDTH, 0, 900);

      // Rails
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 4 * pNear.scale;
      ctx.beginPath();
      ctx.moveTo(pNear.px - 14 * pNear.scale, pNear.py);
      ctx.lineTo(pFar.px - 14 * pFar.scale, pFar.py);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(pNear.px + 14 * pNear.scale, pNear.py);
      ctx.lineTo(pFar.px + 14 * pFar.scale, pFar.py);
      ctx.stroke();
    });

    // Draw wooden ties streaming backward
    const tieOffset = (state.distance * 1.5) % 60;
    for (let z = 900; z > 0; z -= 40) {
      const effZ = z - tieOffset;
      if (effZ < 0) continue;
      lanes.forEach((l) => {
        const p = project(l * LANE_WIDTH, 0, effZ);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(p.px - 22 * p.scale, p.py, 44 * p.scale, 4 * p.scale);
      });
    }

    // Sort objects by Z descending (draw farthest first)
    const renderList: Array<{ type: 'obstacle' | 'coin' | 'powerup'; obj: any; z: number }> = [];
    state.obstacles.forEach((o) => renderList.push({ type: 'obstacle', obj: o, z: o.z }));
    state.coinsList.forEach((c) => {
      if (!c.collected) renderList.push({ type: 'coin', obj: c, z: c.z });
    });
    state.powerUps.forEach((p) => {
      if (!p.collected) renderList.push({ type: 'powerup', obj: p, z: p.z });
    });
    renderList.sort((a, b) => b.z - a.z);

    // Draw objects
    renderList.forEach((item) => {
      if (item.type === 'obstacle') {
        const obs = item.obj;
        const p = project(obs.lane * LANE_WIDTH, 0, obs.z);

        ctx.save();
        ctx.translate(p.px, p.py);

        if (obs.type === 'tractor') {
          // Red farm tractor obstacle
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.roundRect(-28 * p.scale, -70 * p.scale, 56 * p.scale, 55 * p.scale, 8 * p.scale);
          ctx.fill();
          // Wheels
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(-26 * p.scale, -12 * p.scale, 14 * p.scale, 0, Math.PI * 2);
          ctx.arc(26 * p.scale, -12 * p.scale, 14 * p.scale, 0, Math.PI * 2);
          ctx.fill();
        } else if (obs.type === 'low_beam') {
          // Elevated hay trailer / low beam (must roll under)
          ctx.fillStyle = '#f59e0b';
          ctx.fillRect(-35 * p.scale, -65 * p.scale, 70 * p.scale, 28 * p.scale);
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-35 * p.scale, -37 * p.scale, 8 * p.scale, 37 * p.scale);
          ctx.fillRect(27 * p.scale, -37 * p.scale, 8 * p.scale, 37 * p.scale);
        } else {
          // Rustic wooden hurdle fence (must jump over)
          ctx.fillStyle = '#b45309';
          ctx.fillRect(-30 * p.scale, -36 * p.scale, 60 * p.scale, 36 * p.scale);
          ctx.fillStyle = '#fef08a';
          ctx.fillRect(-28 * p.scale, -26 * p.scale, 56 * p.scale, 6 * p.scale);
        }

        ctx.restore();
      } else if (item.type === 'coin') {
        const coin = item.obj;
        const p = project(coin.lane * LANE_WIDTH, coin.y + 12, coin.z);

        ctx.save();
        ctx.translate(p.px, p.py);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, 10 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2 * p.scale;
        ctx.stroke();
        ctx.restore();
      } else if (item.type === 'powerup') {
        const pu = item.obj;
        const p = project(pu.lane * LANE_WIDTH, 18, pu.z);

        ctx.save();
        ctx.translate(p.px, p.py);
        ctx.fillStyle = pu.type === 'magnet' ? '#ef4444' : '#38bdf8';
        ctx.beginPath();
        ctx.arc(0, 0, 14 * p.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = `${Math.round(16 * p.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pu.type === 'magnet' ? '🧲' : '👟', 0, 0);
        ctx.restore();
      }
    });

    // Draw Player Runner (Cute Corgi puppy in foreground)
    const playerZ = 0;
    const pPlayer = project(state.player.laneX, state.player.y, playerZ);

    ctx.save();
    ctx.translate(pPlayer.px, pPlayer.py);

    const bob = state.player.isJumping ? 0 : Math.sin(Date.now() * 0.02) * 4;

    // Shadow on ground
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (state.player.isRolling) {
      // Rolling ball tuck
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -14, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -14, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Golden Corgi body
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(0, -28 + bob, 22, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chest white fur
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(0, -24 + bob, 12, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & Ears
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, -44 + bob, 14, 0, Math.PI * 2);
      ctx.fill();

      // Ears
      [-8, 8].forEach((ex) => {
        ctx.fillStyle = '#d97706';
        ctx.beginPath();
        ctx.ellipse(ex, -58 + bob, 4, 10, ex > 0 ? 0.3 : -0.3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Eyes & Snout
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.arc(-4, -45 + bob, 2, 0, Math.PI * 2);
      ctx.arc(4, -45 + bob, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(0, -40 + bob, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  return (
    <div
      className="relative flex flex-col items-center justify-between w-full h-full max-w-md mx-auto select-none bg-slate-950 text-white font-sans overflow-hidden"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD */}
      <header className="w-full px-4 py-2.5 bg-slate-900/90 backdrop-blur border-b border-slate-800 flex items-center justify-between text-xs sm:text-sm z-10">
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
            <span>🏃</span>
            <span>Pasture Subway Run</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="font-bold text-amber-300">
            🪙 <span>{gameState.coins}</span>
          </div>
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
      </header>

      {/* Main 3D Runner Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={400}
          height={650}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full max-h-[75vh] object-contain block cursor-pointer"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
            <div className="text-5xl mb-2 animate-bounce">🏃🐾</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">SWIPE TO RUN!</h2>
            <p className="text-xs text-slate-300 max-w-xs mb-3">
              Switch between 3 tracks, jump over fences, and roll under low obstacles! Collect shiny golden coins!
            </p>
            <div className="text-xs bg-slate-900/90 border border-slate-700 p-2.5 rounded-lg font-bold text-emerald-400">
              Swipe Left/Right • Up to Jump • Down to Roll
            </div>
          </div>
        )}

        {/* Crashed Game Over Modal */}
        {gameState.status === 'crashed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">💥🚜</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">CRASHED!</h2>
            <div className="bg-slate-900 border border-slate-800 p-3 rounded-xl mb-4 text-sm font-bold text-amber-300 w-full max-w-xs">
              Score: {gameState.score} • Coins: {gameState.coins} • Best: {gameState.highScore}
            </div>
            <button
              onClick={startNewGame}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-black rounded-xl shadow-lg transition active:scale-95"
            >
              🔄 Run Again
            </button>
          </div>
        )}
      </div>

      {/* Accessible Touch Navigation Strip */}
      <footer className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 grid grid-cols-4 gap-2 text-xs font-bold z-10">
        <button
          onClick={() => {
            stateRef.current = changeLane(stateRef.current, 'left');
          }}
          className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-700 transition active:scale-95"
        >
          <span>⬅️ Left</span>
        </button>

        <button
          onClick={() => {
            stateRef.current = jumpPlayer(stateRef.current);
          }}
          className="py-3 bg-emerald-700 hover:bg-emerald-600 active:bg-emerald-800 rounded-xl flex items-center justify-center border border-emerald-600 transition active:scale-95"
        >
          <span>⬆️ Jump</span>
        </button>

        <button
          onClick={() => {
            stateRef.current = rollPlayer(stateRef.current);
          }}
          className="py-3 bg-amber-700 hover:bg-amber-600 active:bg-amber-800 rounded-xl flex items-center justify-center border border-amber-600 transition active:scale-95"
        >
          <span>⬇️ Roll</span>
        </button>

        <button
          onClick={() => {
            stateRef.current = changeLane(stateRef.current, 'right');
          }}
          className="py-3 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 rounded-xl flex items-center justify-center border border-slate-700 transition active:scale-95"
        >
          <span>Right ➡️</span>
        </button>
      </footer>
    </div>
  );
};

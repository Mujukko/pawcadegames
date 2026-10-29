import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceTrack,
  createInitialState,
  jumpDodo,
  restartTrack,
  startSkating,
  steerDodo,
  updateGame,
} from './logic/engine';
import { DodoGameState } from './logic/types';
import { sound } from './systems/sound';

const BOARD_WIDTH = 400;
const BOARD_HEIGHT = 600;
const HORIZON_Y = 230;

export const FrozenPastureDashContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<DodoGameState>(() => createInitialState(1));
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const stateRef = useRef<DodoGameState>(gameState);
  stateRef.current = gameState;

  // Snowflake particles for ambient blizzard
  const snowflakesRef = useRef<{ x: number; y: number; r: number; vy: number; vx: number }[]>(
    Array.from({ length: 45 }, () => ({
      x: Math.random() * BOARD_WIDTH,
      y: Math.random() * BOARD_HEIGHT,
      r: 1 + Math.random() * 2.2,
      vy: 60 + Math.random() * 100,
      vx: -20 + Math.random() * 40,
    }))
  );

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleStart = useCallback(() => {
    setGameState((prev) => startSkating(prev));
  }, []);

  const handleJump = useCallback(() => {
    setGameState((prev) => jumpDodo(prev));
  }, []);

  const handleSteer = useCallback((targetX: number) => {
    setGameState((prev) => steerDodo(prev, targetX));
  }, []);

  // Pointer / Touch steering
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (stateRef.current.status === 'ready') {
      handleStart();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = (e.clientX - rect.left) / rect.width; // 0 to 1
    const normalizedTarget = (touchX - 0.5) * 1.8; // -0.9 to 0.9
    handleSteer(normalizedTarget);
  }, [handleStart, handleSteer]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touchX = (e.clientX - rect.left) / rect.width;
    const normalizedTarget = (touchX - 0.5) * 1.8;
    handleSteer(normalizedTarget);
  }, [handleSteer]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        const current = stateRef.current.dodo.targetX;
        handleSteer(Math.max(-0.85, current - 0.25));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        const current = stateRef.current.dodo.targetX;
        handleSteer(Math.min(0.85, current + 0.25));
      } else if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        if (stateRef.current.status === 'ready') {
          handleStart();
        } else {
          handleJump();
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleStart, handleJump, handleSteer]);

  // Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const currentState = stateRef.current;
      const nextState = updateGame(currentState, dt);

      // Handle sound events
      if (nextState.events.length > 0) {
        for (const ev of nextState.events) {
          if (ev.type === 'boost') {
            sound.playBoost();
          } else if (ev.type === 'jump') {
            sound.playJump();
          } else if (ev.type === 'berry_pickup') {
            sound.playBerry();
          } else if (ev.type === 'crash') {
            sound.playCrash();
          } else if (ev.type === 'track_clear') {
            sound.playVictory();
          }
        }
      }

      // Ambient skate carve sound when moving fast
      if (nextState.status === 'skating' && !nextState.dodo.isAirborne) {
        sound.playSkateCarve();
      }

      // Update ambient snowflakes
      for (const flake of snowflakesRef.current) {
        flake.y += flake.vy * dt;
        flake.x += flake.vx * dt;
        if (flake.y > BOARD_HEIGHT) {
          flake.y = -5;
          flake.x = Math.random() * BOARD_WIDTH;
        }
        if (flake.x < 0) flake.x = BOARD_WIDTH;
        if (flake.x > BOARD_WIDTH) flake.x = 0;
      }

      setGameState(nextState);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, nextState, snowflakesRef.current);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // 3D Scene Rendering
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    state: DodoGameState,
    snowflakes: { x: number; y: number; r: number }[]
  ) => {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 1. Alpine Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, HORIZON_Y);
    skyGrad.addColorStop(0, '#0F172A');
    skyGrad.addColorStop(0.6, '#1E293B');
    skyGrad.addColorStop(1, '#334155');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, BOARD_WIDTH, HORIZON_Y);

    // 2. Distant Snow Peaks
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.moveTo(0, HORIZON_Y);
    ctx.lineTo(60, HORIZON_Y - 90);
    ctx.lineTo(130, HORIZON_Y - 40);
    ctx.lineTo(210, HORIZON_Y - 110);
    ctx.lineTo(290, HORIZON_Y - 50);
    ctx.lineTo(360, HORIZON_Y - 95);
    ctx.lineTo(BOARD_WIDTH, HORIZON_Y);
    ctx.closePath();
    ctx.fill();

    // Snow caps
    ctx.fillStyle = '#E2E8F0';
    ctx.beginPath();
    ctx.moveTo(60, HORIZON_Y - 90);
    ctx.lineTo(40, HORIZON_Y - 60);
    ctx.lineTo(80, HORIZON_Y - 60);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(210, HORIZON_Y - 110);
    ctx.lineTo(185, HORIZON_Y - 75);
    ctx.lineTo(235, HORIZON_Y - 75);
    ctx.closePath();
    ctx.fill();

    // 3. Ground / Ice Field
    const iceGrad = ctx.createLinearGradient(0, HORIZON_Y, 0, BOARD_HEIGHT);
    iceGrad.addColorStop(0, '#67E8F9');
    iceGrad.addColorStop(0.3, '#A5F3FC');
    iceGrad.addColorStop(1, '#E0F2FE');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, HORIZON_Y, BOARD_WIDTH, BOARD_HEIGHT - HORIZON_Y);

    // 4. Perspective Track Runway
    const horizonTrackHalfWidth = 24;
    const baseTrackHalfWidth = 160;
    const trackCenterX = BOARD_WIDTH / 2;

    // Track bed
    ctx.fillStyle = '#BAE6FD';
    ctx.beginPath();
    ctx.moveTo(trackCenterX - horizonTrackHalfWidth, HORIZON_Y);
    ctx.lineTo(trackCenterX + horizonTrackHalfWidth, HORIZON_Y);
    ctx.lineTo(trackCenterX + baseTrackHalfWidth, BOARD_HEIGHT);
    ctx.lineTo(trackCenterX - baseTrackHalfWidth, BOARD_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Track Side Borders
    ctx.strokeStyle = '#0284C7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(trackCenterX - horizonTrackHalfWidth, HORIZON_Y);
    ctx.lineTo(trackCenterX - baseTrackHalfWidth, BOARD_HEIGHT);
    ctx.moveTo(trackCenterX + horizonTrackHalfWidth, HORIZON_Y);
    ctx.lineTo(trackCenterX + baseTrackHalfWidth, BOARD_HEIGHT);
    ctx.stroke();

    // Moving Ice Chevrons / Stripes
    const stripeOffset = (state.dodo.z * 12) % 60;
    ctx.strokeStyle = 'rgba(2, 132, 199, 0.25)';
    ctx.lineWidth = 2;
    for (let d = stripeOffset; d < 370; d += 40) {
      const zProgress = d / 370;
      const y = BOARD_HEIGHT - zProgress * (BOARD_HEIGHT - HORIZON_Y);
      const halfW = baseTrackHalfWidth - zProgress * (baseTrackHalfWidth - horizonTrackHalfWidth);
      ctx.beginPath();
      ctx.moveTo(trackCenterX - halfW * 0.9, y);
      ctx.lineTo(trackCenterX + halfW * 0.9, y);
      ctx.stroke();
    }

    // 5. Projected 3D Pickups & Obstacles (sorted back to front)
    interface Renderable {
      type: 'pickup' | 'obstacle';
      zRel: number;
      item: any;
    }

    const renderables: Renderable[] = [];

    for (const p of state.pickups) {
      if (p.collected) continue;
      const zRel = p.z - state.dodo.z;
      if (zRel > -2 && zRel < 70) {
        renderables.push({ type: 'pickup', zRel, item: p });
      }
    }

    for (const o of state.obstacles) {
      if (o.hit) continue;
      const zRel = o.z - state.dodo.z;
      if (zRel > -2 && zRel < 70) {
        renderables.push({ type: 'obstacle', zRel, item: o });
      }
    }

    // Sort descending by zRel so distant items draw first
    renderables.sort((a, b) => b.zRel - a.zRel);

    for (const ren of renderables) {
      const zRel = Math.max(0.1, ren.zRel);
      const scale = 5.5 / (zRel + 5.5);
      const y = HORIZON_Y + (BOARD_HEIGHT - HORIZON_Y) * scale;
      const currentTrackHalfW = horizonTrackHalfWidth + (baseTrackHalfWidth - horizonTrackHalfWidth) * scale;
      const x = trackCenterX + ren.item.x * currentTrackHalfW;

      if (ren.type === 'pickup') {
        drawProjectedPickup(ctx, ren.item, x, y, scale);
      } else {
        drawProjectedObstacle(ctx, ren.item, x, y, scale);
      }
    }

    // 6. Draw Dodo Bird (Player)
    const playerScale = 1.0;
    const playerX = trackCenterX + state.dodo.x * (baseTrackHalfWidth * 0.85);
    const playerY = 520 - state.dodo.y * 35;
    drawDodo(ctx, state.dodo, playerX, playerY, playerScale);

    // 7. Ambient Blizzard Snowflakes
    ctx.fillStyle = '#FFFFFF';
    for (const flake of snowflakes) {
      ctx.beginPath();
      ctx.arc(flake.x, flake.y, flake.r, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // 3D Projected Pickups
  const drawProjectedPickup = (
    ctx: CanvasRenderingContext2D,
    pickup: DodoGameState['pickups'][0],
    x: number,
    y: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(x, y);

    if (pickup.type === 'boost_pad') {
      const w = 36 * scale;
      const h = 18 * scale;
      ctx.fillStyle = '#10B981';
      ctx.beginPath();
      ctx.moveTo(-w / 2, h / 2);
      ctx.lineTo(0, -h / 2);
      ctx.lineTo(w / 2, h / 2);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#A7F3D0';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    } else if (pickup.type === 'frost_berry') {
      const r = 10 * scale;
      ctx.shadowColor = '#38BDF8';
      ctx.shadowBlur = 8 * scale;
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.arc(0, -r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#BAE6FD';
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 1.3, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
    } else if (pickup.type === 'ramp_jump') {
      const w = 42 * scale;
      const h = 14 * scale;
      ctx.fillStyle = '#EA580C';
      ctx.fillRect(-w / 2, -h, w, h);
      ctx.fillStyle = '#FEF08A';
      ctx.fillRect(-w / 2 + 4 * scale, -h + 2 * scale, w - 8 * scale, h - 4 * scale);
    }

    ctx.restore();
  };

  // 3D Projected Obstacles
  const drawProjectedObstacle = (
    ctx: CanvasRenderingContext2D,
    obs: DodoGameState['obstacles'][0],
    x: number,
    y: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(x, y);

    if (obs.type === 'ice_cone') {
      const w = 24 * scale;
      const h = 42 * scale;
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.moveTo(-w / 2, 0);
      ctx.lineTo(0, -h);
      ctx.lineTo(w / 2, 0);
      ctx.closePath();
      ctx.fill();
      // Snowy tip
      ctx.fillStyle = '#F0F9FF';
      ctx.beginPath();
      ctx.moveTo(-w * 0.22, -h * 0.55);
      ctx.lineTo(0, -h);
      ctx.lineTo(w * 0.22, -h * 0.55);
      ctx.closePath();
      ctx.fill();
    } else if (obs.type === 'snow_boulder') {
      const r = 18 * scale;
      ctx.fillStyle = '#E2E8F0';
      ctx.beginPath();
      ctx.arc(0, -r, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
    } else if (obs.type === 'crevasse') {
      const w = 48 * scale;
      const h = 8 * scale;
      ctx.fillStyle = '#082F49';
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.5 * scale;
      ctx.strokeRect(-w / 2, -h / 2, w, h);
    } else if (obs.type === 'fence_post') {
      const w = 12 * scale;
      const h = 32 * scale;
      ctx.fillStyle = '#78350F';
      ctx.fillRect(-w / 2, -h, w, h);
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(-w / 2, -h, w, 6 * scale);
    }

    ctx.restore();
  };

  // Draw Cute Dodo Bird
  const drawDodo = (
    ctx: CanvasRenderingContext2D,
    dodo: DodoGameState['dodo'],
    x: number,
    y: number,
    scale: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(dodo.skateTilt);

    // Shadow on ice
    if (dodo.y > 0) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.beginPath();
      ctx.ellipse(0, dodo.y * 35 + 10, 18 * scale, 6 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shield bubble if active
    if (dodo.hasShield) {
      ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, -16 * scale, 30 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    // Silver Ice Skates
    ctx.fillStyle = '#94A3B8';
    ctx.fillRect(-14 * scale, 6 * scale, 10 * scale, 4 * scale);
    ctx.fillRect(4 * scale, 6 * scale, 10 * scale, 4 * scale);
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-15 * scale, 9 * scale, 12 * scale, 2 * scale);
    ctx.strokeRect(3 * scale, 9 * scale, 12 * scale, 2 * scale);

    // Dodo Body (Plump blue-grey)
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.ellipse(0, -14 * scale, 18 * scale, 20 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fluffy Belly Patch
    ctx.fillStyle = '#94A3B8';
    ctx.beginPath();
    ctx.ellipse(0, -10 * scale, 11 * scale, 13 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little Wings
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.ellipse(-16 * scale, -15 * scale, 5 * scale, 10 * scale, Math.PI / 8, 0, Math.PI * 2);
    ctx.ellipse(16 * scale, -15 * scale, 5 * scale, 10 * scale, -Math.PI / 8, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#475569';
    ctx.beginPath();
    ctx.arc(0, -32 * scale, 13 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Big Dodo Hooked Beak
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.moveTo(-6 * scale, -32 * scale);
    ctx.lineTo(0, -42 * scale);
    ctx.lineTo(6 * scale, -32 * scale);
    ctx.lineTo(0, -25 * scale);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0F172A';
    ctx.beginPath();
    ctx.arc(-5 * scale, -34 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.arc(5 * scale, -34 * scale, 2.5 * scale, 0, Math.PI * 2);
    ctx.fill();

    // Wool Earmuffs
    ctx.fillStyle = '#EF4444';
    ctx.beginPath();
    ctx.arc(-13 * scale, -32 * scale, 4.5 * scale, 0, Math.PI * 2);
    ctx.arc(13 * scale, -32 * scale, 4.5 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#FCA5A5';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.arc(0, -38 * scale, 12 * scale, Math.PI, 0, false);
    ctx.stroke();

    ctx.restore();
  };

  const handleNextTrack = () => {
    setGameState((prev) => advanceTrack(prev));
  };

  const handleRestart = () => {
    setGameState((prev) => restartTrack(prev));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] max-h-[85vh] bg-[#0B1120] text-white select-none touch-none overflow-hidden rounded-2xl shadow-2xl p-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD */}
      <div className="w-full max-w-[400px] flex items-center justify-between px-3 py-1.5 bg-[#1E293B]/80 border border-cyan-500/30 rounded-xl mb-1.5 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="font-bold text-cyan-400">Track {gameState.trackIndex}</span>
          <span className="text-slate-300">
            Dist: <strong>{Math.round(gameState.distance)}m</strong> / {gameState.targetDistance}m
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-amber-300 font-bold">🍓 {gameState.frostBerries}</span>
          <span className="text-cyan-200 font-mono text-[11px]">{Math.round(gameState.speed * 3.6)} km/h</span>
          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full max-w-[400px] aspect-[400/600] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          className="w-full h-full rounded-xl border border-cyan-500/40 shadow-inner cursor-pointer"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <div className="text-5xl mb-2">🦤❄️</div>
            <h2 className="text-2xl font-black text-cyan-300 mb-1">ICE DODO: PASTURE DASH</h2>
            <p className="text-slate-200 text-xs mb-4 max-w-[280px]">
              Slide down the alpine glacier at breakneck speeds! Dodge spiky cones, jump chasms, and hit speed pads!
            </p>
            <button
              onClick={handleStart}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-white font-black text-base rounded-full shadow-xl transition border border-cyan-300/40 animate-pulse"
            >
              TAP TO SKATE! ⛸️
            </button>
          </div>
        )}

        {/* Action Controls for Mobile */}
        {gameState.status === 'skating' && (
          <button
            onClick={handleJump}
            className="absolute bottom-5 right-5 w-14 h-14 bg-cyan-500/80 hover:bg-cyan-400 active:scale-95 text-white font-black text-xs rounded-full shadow-lg border border-cyan-300/50 flex flex-col items-center justify-center backdrop-blur-sm"
          >
            <span>🦘</span>
            <span>JUMP</span>
          </button>
        )}

        {/* Crash Overlay */}
        {gameState.status === 'crashed' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-rose-400 mb-1">ICE CRUNCH! 💥</h2>
            <p className="text-slate-300 text-xs mb-3">
              Dodo wiped out at {Math.round(gameState.distance)} meters!
            </p>
            <div className="text-lg font-bold text-white mb-4">
              Score: <span className="text-cyan-300">{gameState.score}</span>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Try Again 🔄
            </button>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-amber-400 mb-1">TRACK COMPLETE! 🏁</h2>
            <p className="text-slate-300 text-xs mb-3">
              You conquered the glacier and reached the finish line!
            </p>
            <div className="text-lg font-bold text-white mb-4">
              Track Score: <span className="text-cyan-300">{gameState.score}</span>
            </div>
            <button
              onClick={gameState.trackIndex < 3 ? handleNextTrack : handleRestart}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              {gameState.trackIndex < 3 ? 'Next Track ❄️' : 'Play Again 🦤'}
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint Footer */}
      <div className="text-[11px] text-slate-400 text-center mt-1">
        Drag or tap sides to steer. Tap JUMP or press Space to leap over crevasses!
      </div>
    </div>
  );
};
export default FrozenPastureDashContainer;

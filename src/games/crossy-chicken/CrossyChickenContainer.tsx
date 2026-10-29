import React, { useEffect, useRef, useState, useCallback } from 'react';
import { CrossyChickenState } from './logic/types';
import {
  createInitialState,
  hop,
  LANE_HEIGHT,
  restartGame,
  updateEngine,
} from './logic/engine';
import { crossyChickenSound } from './systems/sound';

export const CrossyChickenContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<CrossyChickenState>(() =>
    createInitialState(0)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => crossyChickenSound.getMuted());
  const stateRef = useRef<CrossyChickenState>(gameState);
  stateRef.current = gameState;

  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    crossyChickenSound.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  // Restart handler
  const handleRestart = useCallback(() => {
    const next = restartGame(stateRef.current);
    setGameState({ ...next });
  }, []);

  // Directional Hop Action
  const triggerHop = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    if (stateRef.current.isGameOver) return;
    crossyChickenSound.playHop();
    const next = hop(stateRef.current, dir);
    setGameState({ ...next });
  }, []);

  // Keyboard navigation listeners (Arrow keys & WASD)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        triggerHop('up');
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        triggerHop('down');
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        triggerHop('left');
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        triggerHop('right');
      } else if (e.code === 'KeyR') {
        handleRestart();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerHop, handleRestart, toggleMute]);

  // Touch Swipe Gesture Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    // Tap (< 15px) defaults to forward hop
    if (dist < 15) {
      triggerHop('up');
    } else {
      // Swipe gesture
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) triggerHop('right');
        else if (dx < -20) triggerHop('left');
      } else {
        if (dy < -20) triggerHop('up');
        else if (dy > 20) triggerHop('down');
      }
    }
    touchStartRef.current = null;
  };

  // Main 60 FPS Engine and Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    lastTimeRef.current = performance.now();

    const render = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const state = stateRef.current;

      // Update engine physics
      if (!state.isGameOver) {
        updateEngine(state, dt);

        // Sound triggers
        for (const evt of state.events) {
          if (evt.type === 'coin_collect') {
            crossyChickenSound.playCoin();
          } else if (evt.type === 'train_warning') {
            crossyChickenSound.playTrainSignal();
          } else if (evt.type === 'train_pass') {
            crossyChickenSound.playTrainPass();
          } else if (evt.type === 'hawk_swoop') {
            crossyChickenSound.playHawk();
          } else if (evt.type === 'death') {
            if (evt.reason === 'drown') crossyChickenSound.playSplash();
            else if (evt.reason === 'car') crossyChickenSound.playCarHonk();
            crossyChickenSound.playDeath();
            setGameState({ ...state });
          }
        }
      }

      // --- RENDERING ---
      const w = 400;
      const h = 580;

      // Clear Screen with Sky gradient
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      // Apply Camera Transform
      ctx.translate(0, -state.cameraY + 360);

      // 1. Render Visible Lanes
      for (const lane of state.lanes) {
        // Only draw visible lanes
        const screenY = lane.y - state.cameraY + 360;
        if (screenY < -60 || screenY > h + 60) continue;

        if (lane.type === 'grass') {
          // Lush Green Pasture
          ctx.fillStyle = lane.index % 2 === 0 ? '#16a34a' : '#15803d';
          ctx.fillRect(0, lane.y - LANE_HEIGHT / 2, w, LANE_HEIGHT);
        } else if (lane.type === 'road') {
          // Dark Asphalt Highway
          ctx.fillStyle = '#334155';
          ctx.fillRect(0, lane.y - LANE_HEIGHT / 2, w, LANE_HEIGHT);

          // Yellow dashed road stripes
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          ctx.setLineDash([12, 10]);
          ctx.beginPath();
          ctx.moveTo(0, lane.y);
          ctx.lineTo(w, lane.y);
          ctx.stroke();
          ctx.setLineDash([]);
        } else if (lane.type === 'river') {
          // Flowing Blue River
          ctx.fillStyle = '#0284c7';
          ctx.fillRect(0, lane.y - LANE_HEIGHT / 2, w, LANE_HEIGHT);

          // River water ripples
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          const waveOffset = (now * 0.05) % 40;
          for (let rx = -20; rx < w + 40; rx += 50) {
            ctx.beginPath();
            ctx.arc(rx + waveOffset, lane.y - 4, 8, 0, Math.PI);
            ctx.stroke();
          }
        } else if (lane.type === 'railroad') {
          // Railroad Gravel & Tracks
          ctx.fillStyle = '#475569';
          ctx.fillRect(0, lane.y - LANE_HEIGHT / 2, w, LANE_HEIGHT);

          // Wooden ties
          ctx.fillStyle = '#78350f';
          for (let tx = 0; tx < w; tx += 20) {
            ctx.fillRect(tx, lane.y - 16, 8, 32);
          }

          // Steel rails
          ctx.fillStyle = '#94a3b8';
          ctx.fillRect(0, lane.y - 10, w, 3);
          ctx.fillRect(0, lane.y + 7, w, 3);

          // Railroad warning light if train coming
          if (
            lane.trainWarningTimer !== undefined &&
            lane.trainWarningTimer <= 1.2
          ) {
            const isBlinkRed = Math.floor(now * 0.008) % 2 === 0;
            ctx.fillStyle = isBlinkRed ? '#ef4444' : '#7f1d1d';
            ctx.beginPath();
            ctx.arc(20, lane.y - 12, 6, 0, Math.PI * 2);
            ctx.arc(w - 20, lane.y - 12, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        // Render Lane Obstacles
        for (const obs of lane.obstacles) {
          if (obs.type === 'log') {
            // Textured Wooden Log
            ctx.fillStyle = '#92400e';
            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(obs.x, lane.y - obs.height / 2, obs.width, obs.height, 12);
            ctx.fill();
            ctx.stroke();

            // End rings
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(obs.x + 12, lane.y, 8, 0, Math.PI * 2);
            ctx.fill();
          } else if (obs.type === 'car' || obs.type === 'truck') {
            // Vehicle Body
            ctx.fillStyle = obs.color || '#ef4444';
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(obs.x, lane.y - obs.height / 2, obs.width, obs.height, 6);
            ctx.fill();
            ctx.stroke();

            // Windshield
            ctx.fillStyle = '#7dd3fc';
            const cabX = obs.speed > 0 ? obs.x + obs.width - 18 : obs.x + 4;
            ctx.fillRect(cabX, lane.y - obs.height / 2 + 4, 14, obs.height - 8);

            // Headlights
            ctx.fillStyle = '#fef08a';
            const lightX = obs.speed > 0 ? obs.x + obs.width : obs.x - 2;
            ctx.fillRect(lightX, lane.y - 8, 3, 4);
            ctx.fillRect(lightX, lane.y + 4, 3, 4);
          } else if (obs.type === 'train') {
            // High-speed Locomotive
            ctx.fillStyle = '#b91c1c';
            ctx.strokeStyle = '#f8fafc';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(obs.x, lane.y - obs.height / 2, obs.width, obs.height, 4);
            ctx.fill();
            ctx.stroke();

            // High beam light
            ctx.fillStyle = '#fef08a';
            const headX = obs.speed > 0 ? obs.x + obs.width : obs.x;
            ctx.beginPath();
            ctx.arc(headX, lane.y, 8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // 2. Render Golden Coins
      for (const coin of state.coins) {
        if (!coin.collected) {
          ctx.save();
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 9, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#78350f';
          ctx.font = 'bold 10px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('★', coin.x, coin.y + 1);
          ctx.restore();
        }
      }

      // 3. Render Clucky the Chicken
      if (!state.player.dead || state.player.deathReason === 'hawk') {
        const p = state.player;
        const hopArc = p.isHopping ? Math.sin(p.hopProgress * Math.PI) * 16 : 0;

        ctx.save();
        ctx.translate(p.x, p.y - hopArc);

        // Ground shadow
        ctx.fillStyle = 'rgba(0,0,0,0.25)';
        ctx.beginPath();
        ctx.ellipse(0, hopArc + 12, 14 - hopArc * 0.3, 7 - hopArc * 0.15, 0, 0, Math.PI * 2);
        ctx.fill();

        // White Chicken Body
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Red Comb
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, -14, 4, 0, Math.PI * 2);
        ctx.arc(4, -14, 3, 0, Math.PI * 2);
        ctx.fill();

        // Yellow Beak
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        if (p.direction === 'up') {
          ctx.fillRect(-3, -16, 6, 4);
        } else if (p.direction === 'right') {
          ctx.fillRect(12, -3, 6, 6);
        } else if (p.direction === 'left') {
          ctx.fillRect(-18, -3, 6, 6);
        } else {
          ctx.fillRect(-3, 12, 6, 4);
        }

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(-4, -6, 2, 0, Math.PI * 2);
        ctx.arc(4, -6, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 4. Render Hawk Swoop
      if (state.hawkActive) {
        ctx.save();
        ctx.fillStyle = '#1e1b4b';
        ctx.beginPath();
        // Giant circling hawk wings
        ctx.moveTo(state.player.x, state.hawkY);
        ctx.lineTo(state.player.x - 35, state.hawkY - 20);
        ctx.lineTo(state.player.x, state.hawkY + 15);
        ctx.lineTo(state.player.x + 35, state.hawkY - 20);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }

      ctx.restore(); // Restore camera translation

      // 5. Canvas HUD (Top Bar)
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'black 22px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`${state.score} m`, 16, 16);

      // Coins counter
      ctx.textAlign = 'right';
      ctx.fillStyle = '#facc15';
      ctx.fillText(`★ ${state.coinsCount}`, w - 16, 16);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[480px] mx-auto select-none touch-none py-2 px-1">
      {/* Top Controls Header */}
      <div className="w-full flex items-center justify-between mb-2 px-3 bg-slate-900/90 py-2 rounded-xl border border-amber-500/30">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐔</span>
          <div>
            <div className="text-xs font-black text-amber-400 uppercase tracking-wide">
              Crossy Chicken
            </div>
            <div className="text-[10px] text-slate-400">High Score: {gameState.highScore} m</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm text-slate-300 hover:bg-slate-700 active:scale-95"
            title="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestart}
            className="w-8 h-8 rounded-lg bg-amber-600 border border-amber-500 flex items-center justify-center text-sm text-white hover:bg-amber-500 active:scale-95"
            title="Restart Run"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div
        className="relative w-full aspect-[400/580] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-amber-950/40 touch-none bg-slate-950"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={580}
          className="w-full h-full block cursor-pointer select-none touch-none"
        />

        {/* Game Over Modal */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">
              {gameState.player.deathReason === 'drown'
                ? '🌊'
                : gameState.player.deathReason === 'hawk'
                ? '🦅'
                : gameState.player.deathReason === 'train'
                ? '🚂'
                : '💥'}
            </div>
            <h2 className="text-2xl font-black text-red-400 mb-1">
              {gameState.player.deathReason === 'drown'
                ? 'SPLASHED IN RIVER!'
                : gameState.player.deathReason === 'hawk'
                ? 'SNATCHED BY HAWK!'
                : gameState.player.deathReason === 'train'
                ? 'TRAIN CRASH!'
                : 'SQUASHED BY TRUCK!'}
            </h2>
            <p className="text-slate-300 text-sm mb-4">
              Clucky hopped <span className="font-bold text-amber-400">{gameState.score} meters</span>!
            </p>

            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 w-full max-w-[240px] mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Distance</span>
                <span className="font-bold text-amber-300">{gameState.score} m</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Coins Collected</span>
                <span className="font-bold text-amber-300">★ {gameState.coinsCount}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Best Record</span>
                <span className="font-bold text-amber-300">{gameState.highScore} m</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 active:scale-95"
            >
              Play Again 🐔
            </button>
          </div>
        )}
      </div>

      {/* Tactile Mobile D-Pad Control Buttons */}
      <div className="w-full flex items-center justify-between gap-2 mt-2 px-1">
        <button
          onClick={() => triggerHop('left')}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 font-black text-base text-slate-200 shadow-md"
        >
          ◄ Left
        </button>
        <button
          onClick={() => triggerHop('up')}
          className="flex-[2] py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 active:scale-95 rounded-xl font-black text-base text-slate-950 shadow-lg shadow-amber-500/30"
        >
          ▲ HOP FORWARD
        </button>
        <button
          onClick={() => triggerHop('right')}
          className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 active:scale-95 rounded-xl border border-slate-700 font-black text-base text-slate-200 shadow-md"
        >
          Right ►
        </button>
      </div>
    </div>
  );
};

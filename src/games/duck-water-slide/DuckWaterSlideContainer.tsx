import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialState,
  updateEngine,
  nextCourse,
  restartCourse,
  COURSES,
  FLUME_HALF_WIDTH,
} from './logic/engine';
import { DuckWaterSlideState } from './logic/types';
import { waterSlideAudio } from './systems/sound';

interface SplashSpray {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

export const DuckWaterSlideContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<DuckWaterSlideState>(() => createInitialState());
  const [isMuted, setIsMuted] = useState<boolean>(() => waterSlideAudio.getMuted());

  const stateRef = useRef<DuckWaterSlideState>(gameState);
  stateRef.current = gameState;

  const steerInputRef = useRef<number>(0);
  const spraysRef = useRef<SplashSpray[]>([]);
  const isHoldingLeft = useRef<boolean>(false);
  const isHoldingRight = useRef<boolean>(false);
  const waterFlowOffset = useRef<number>(0);

  // Toggle audio
  const handleToggleMute = () => {
    const nextMuted = waterSlideAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleNextOrRestart = useCallback(() => {
    const current = stateRef.current;
    if (current.gameOver) {
      setGameState(restartCourse(current));
    } else if (current.courseComplete) {
      setGameState(nextCourse(current));
    }
  }, []);

  // Spawn water splash droplets
  const spawnSplash = (x: number, y: number, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      spraysRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4,
        life: 1.0,
      });
    }
  };

  // Pointer drag steering
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    // Map canvas X (0 to 400) to steer input (-1 to +1)
    const normalized = (clientX / rect.width) * 2 - 1;
    steerInputRef.current = Math.max(-1, Math.min(1, normalized * 1.5));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
  };

  const handlePointerUp = () => {
    if (!isHoldingLeft.current && !isHoldingRight.current) {
      steerInputRef.current = 0;
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        isHoldingLeft.current = true;
      } else if (key === 'arrowright' || key === 'd') {
        isHoldingRight.current = true;
      } else if (key === ' ' || key === 'enter') {
        handleNextOrRestart();
      } else if (key === 'm') {
        handleToggleMute();
      } else if (key === 'r') {
        setGameState(restartCourse(stateRef.current));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        isHoldingLeft.current = false;
      } else if (key === 'arrowright' || key === 'd') {
        isHoldingRight.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleNextOrRestart]);

  // Main 60 FPS animation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.033, (currentTime - lastTime) / 1000);
      lastTime = currentTime;

      // Handle continuous steering
      let steer = steerInputRef.current;
      if (isHoldingLeft.current) steer = -1.0;
      if (isHoldingRight.current) steer = 1.0;

      const current = stateRef.current;
      const next = updateEngine(current, dt, steer);

      // Play audio events
      if (next.lastEvents.length > 0) {
        for (const ev of next.lastEvents) {
          if (ev.type === 'collect_duck') {
            waterSlideAudio.playDuckCollect();
            spawnSplash(200 + ev.x!, 350, 6);
          } else if (ev.type === 'collect_melon') {
            waterSlideAudio.playMelonCollect();
            spawnSplash(200 + ev.x!, 350, 8);
          } else if (ev.type === 'hit_boost') {
            waterSlideAudio.playSpeedBoost();
            spawnSplash(200 + ev.x!, 380, 16);
          } else if (ev.type === 'hit_ramp') {
            waterSlideAudio.playRampLaunch();
            spawnSplash(200 + ev.x!, 380, 20);
          } else if (ev.type === 'hit_soap') {
            waterSlideAudio.playSoapSpin();
          } else if (ev.type === 'hit_hazard') {
            waterSlideAudio.playHazardHit();
            spawnSplash(200 + ev.x!, 380, 12);
          } else if (ev.type === 'stunt_landing') {
            waterSlideAudio.playSplashdown();
            spawnSplash(200 + ev.x!, 380, 24);
          } else if (ev.type === 'course_finish') {
            waterSlideAudio.playCourseFinish();
            spawnSplash(200, 250, 35);
          }
        }
      }

      stateRef.current = next;
      setGameState(next);

      // Advance water visual flow
      waterFlowOffset.current = (waterFlowOffset.current + next.duck.speed * 8 * dt) % 120;

      // --- RENDER SCENE ---
      ctx.clearRect(0, 0, 400, 500);

      // 1. Summer Sky & Park Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 500);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.35, '#38bdf8');
      skyGrad.addColorStop(0.7, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, 400, 500);

      // Fluffy cartoon clouds
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(60, 40, 22, 0, Math.PI * 2);
      ctx.arc(90, 35, 28, 0, Math.PI * 2);
      ctx.arc(120, 42, 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(310, 50, 24, 0, Math.PI * 2);
      ctx.arc(340, 45, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;

      // 2. The Grand Water Flume Channel (Perspective Tube)
      const currentCourse = COURSES[next.currentCourseIndex]!;
      const flumeCenterX = 200;
      const flumeLeft = flumeCenterX - FLUME_HALF_WIDTH;
      const flumeRight = flumeCenterX + FLUME_HALF_WIDTH;
      const flumeWidth = FLUME_HALF_WIDTH * 2;

      // Outer Flume Walls (Smooth rounded water tube)
      ctx.fillStyle = '#0369a1';
      ctx.fillRect(flumeLeft - 14, 0, flumeWidth + 28, 500);

      // Flume Tube Interior
      ctx.fillStyle = currentCourse.waterHue;
      ctx.fillRect(flumeLeft, 0, flumeWidth, 500);

      // Tube Wall Rails
      ctx.fillStyle = '#e0f2fe';
      ctx.fillRect(flumeLeft - 6, 0, 6, 500);
      ctx.fillRect(flumeRight, 0, 6, 500);

      // Animated Water Flow Streaks (Downward rushing motion)
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.globalAlpha = 0.65;
      const streakLines = [-80, -40, 0, 40, 80];
      streakLines.forEach((offset) => {
        const x = flumeCenterX + offset;
        ctx.beginPath();
        for (let y = -60 + (waterFlowOffset.current % 60); y < 520; y += 60) {
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + 25);
        }
        ctx.stroke();
      });
      ctx.globalAlpha = 1.0;

      // 3. Render Track Items
      // Items appear based on their distance relative to duck
      for (const item of next.items) {
        if (item.collected) continue;

        const distanceAhead = item.worldDistance - next.distanceCovered;
        // Render items between 0m (under duck) and 45m ahead (top of screen)
        if (distanceAhead < -3 || distanceAhead > 48) continue;

        // Map distanceAhead to screen Y: 45m = top (y: 20), 0m = duck position (y: 380)
        const progress = 1 - distanceAhead / 48; // 0.0 at top, 1.0 at duck
        const itemY = 30 + progress * 350;
        const itemX = flumeCenterX + item.trackX;
        const scale = 0.5 + progress * 0.5; // grows larger as it approaches

        ctx.save();
        ctx.translate(itemX, itemY);
        ctx.scale(scale, scale);

        if (item.type === 'rubber_duck') {
          // Yellow Rubber Ducky
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 0, 12, 0, Math.PI * 2);
          ctx.arc(5, -6, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Beak
          ctx.fillStyle = '#ea580c';
          ctx.beginPath();
          ctx.moveTo(11, -6);
          ctx.lineTo(17, -4);
          ctx.lineTo(11, -2);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === 'watermelon') {
          // Watermelon Slice
          ctx.fillStyle = '#ef4444';
          ctx.strokeStyle = '#16a34a';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(0, 0, 14, 0, Math.PI);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Seeds
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(-6, 4, 2, 3);
          ctx.fillRect(0, 7, 2, 3);
          ctx.fillRect(6, 4, 2, 3);
        } else if (item.type === 'speed_boost') {
          // Speed Booster Arrows
          ctx.fillStyle = '#22c55e';
          ctx.beginPath();
          ctx.moveTo(-16, 6);
          ctx.lineTo(0, -10);
          ctx.lineTo(16, 6);
          ctx.lineTo(10, 6);
          ctx.lineTo(0, -4);
          ctx.lineTo(-10, 6);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.moveTo(-16, 16);
          ctx.lineTo(0, 0);
          ctx.lineTo(16, 16);
          ctx.lineTo(10, 16);
          ctx.lineTo(0, 6);
          ctx.lineTo(-10, 16);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === 'water_ramp') {
          // Wooden Water Stunt Ramp
          ctx.fillStyle = '#f59e0b';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-22, -10, 44, 20, 4);
          ctx.fill();
          ctx.stroke();

          // Chevron arrows on ramp
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.moveTo(-8, 5);
          ctx.lineTo(0, -5);
          ctx.lineTo(8, 5);
          ctx.lineTo(4, 5);
          ctx.lineTo(0, -1);
          ctx.lineTo(-4, 5);
          ctx.closePath();
          ctx.fill();
        } else if (item.type === 'soap_bar') {
          // Pink Soap Bar with Suds
          ctx.fillStyle = '#f472b6';
          ctx.strokeStyle = '#db2777';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-16, -10, 32, 20, 6);
          ctx.fill();
          ctx.stroke();

          // Foam bubbles
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(-8, -4, 4, 0, Math.PI * 2);
          ctx.arc(6, 4, 3, 0, Math.PI * 2);
          ctx.fill();
        } else if (item.type === 'beach_ball') {
          // Colorful Beach Ball
          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, 15, 0, Math.PI * 0.7);
          ctx.lineTo(0, 0);
          ctx.fillStyle = '#3b82f6';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(0, 0, 15, Math.PI * 0.7, Math.PI * 1.4);
          ctx.lineTo(0, 0);
          ctx.fillStyle = '#facc15';
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        ctx.restore();
      }

      // 4. Render Rooster-Tail Water Spray from Duck
      const duckScreenX = flumeCenterX + next.duck.x;
      const duckScreenY = 380;

      if (!next.duck.inAir) {
        ctx.fillStyle = '#e0f2fe';
        ctx.globalAlpha = 0.75;
        // Left spray
        ctx.beginPath();
        ctx.ellipse(duckScreenX - 22, duckScreenY + 12, 14, 8, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Right spray
        ctx.beginPath();
        ctx.ellipse(duckScreenX + 22, duckScreenY + 12, 14, 8, 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      }

      // 5. Render Quacky the Hero Duck on Red Inflatable Tube
      ctx.save();
      ctx.translate(duckScreenX, duckScreenY);

      // Stunt flip & spin scale
      let duckScale = 1.0;
      if (next.duck.inAir) {
        duckScale = 1.35; // jumps closer to camera!
        ctx.rotate(Date.now() * 0.012); // stunt rotation
      } else if (next.duck.spinTimer > 0) {
        ctx.rotate(Date.now() * 0.02); // soap spinout
      } else {
        // Subtle water tilt
        ctx.rotate(steer * 0.15);
      }
      ctx.scale(duckScale, duckScale);

      // Red Inflatable Swim Tube
      ctx.fillStyle = next.duck.boostTimer > 0 ? '#ea580c' : '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 8, 28, 16, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner tube hole
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.ellipse(0, 7, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Duck Body
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, -2, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Duck Wings Spread Wide
      ctx.beginPath();
      ctx.ellipse(-16, -4, 8, 4, -0.3, 0, Math.PI * 2);
      ctx.ellipse(16, -4, 8, 4, 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Duck Head
      ctx.beginPath();
      ctx.arc(0, -16, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sunglasses
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(-9, -20, 8, 6);
      ctx.fillRect(1, -20, 8, 6);
      ctx.fillRect(-1, -18, 2, 2);

      // Orange Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.ellipse(0, -11, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 6. Render Particle Sprays
      for (let i = spraysRef.current.length - 1; i >= 0; i--) {
        const sp = spraysRef.current[i]!;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.life -= 2.0 * dt;

        if (sp.life <= 0) {
          spraysRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = Math.max(0, sp.life * 0.8);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentCourse = COURSES[gameState.currentCourseIndex]!;
  const distancePercent = Math.min(
    100,
    Math.round((gameState.distanceCovered / currentCourse.totalDistance) * 100)
  );

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto select-none touch-none">
      {/* Top Header & Progress Gauge */}
      <div className="w-full bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700/60 shadow-xl mb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🦆🌊</span>
              <h2 className="text-sm font-bold text-white tracking-wide">{currentCourse.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                Course {gameState.currentCourseIndex + 1}/{COURSES.length}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{currentCourse.theme}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-700 text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Score</span>
              <span className="text-sm font-extrabold text-amber-400">{gameState.score}</span>
            </div>

            <button
              onClick={handleToggleMute}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all text-xs"
              title="Toggle Audio (M)"
            >
              {isMuted ? '🔇' : '🔊'}
            </button>
            <button
              onClick={() => setGameState(restartCourse(stateRef.current))}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all text-xs font-bold"
              title="Reset Run (R)"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Distance Progress Gauge */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-xs font-bold text-slate-300">Distance:</span>
          <div className="flex-1 h-3.5 bg-slate-900/90 rounded-full overflow-hidden border border-slate-700 p-0.5">
            <div
              className="h-full rounded-full transition-all duration-200 ease-out bg-gradient-to-r from-sky-500 to-emerald-400 shadow-sm"
              style={{ width: `${distancePercent}%` }}
            />
          </div>
          <span className="text-xs font-extrabold text-sky-300 min-w-[50px] text-right">
            {Math.round(gameState.distanceCovered)}m / {currentCourse.totalDistance}m
          </span>
        </div>

        {/* Lives & Speedometer Strip */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Lives:</span>
            <div className="flex gap-1 text-base leading-none">
              {Array.from({ length: 3 }).map((_, idx) => (
                <span
                  key={idx}
                  className={idx < gameState.lives ? 'text-red-500' : 'text-slate-600 opacity-40'}
                >
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {gameState.duck.boostTimer > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] animate-pulse">
                ⚡ TURBO JET ({Math.ceil(gameState.duck.boostTimer)}s)
              </span>
            )}
            {gameState.duck.inAir && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                🌪️ STUNT FLIP!
              </span>
            )}
            {gameState.combo > 1 && (
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[10px]">
                COMBO x{gameState.combo}!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas Flume Area */}
      <div className="relative w-full aspect-[4/5] max-w-[400px] rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full cursor-pointer touch-none"
        />

        {/* Course Complete Splashdown Modal */}
        {gameState.courseComplete && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-sky-500 rounded-full flex items-center justify-center border-4 border-sky-300 shadow-[0_0_24px_rgba(14,165,233,0.7)] mb-3 animate-bounce">
              <span className="text-3xl">🏊</span>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-sky-300 mb-1">
              Grand Splashdown!
            </span>
            <h3 className="text-2xl font-black text-white mb-2">
              {currentCourse.name} Cleared!
            </h3>
            <p className="text-xs text-slate-300 max-w-[280px] mb-4">
              {gameState.gameComplete
                ? 'Quacky conquered all 4 farm water flumes! Water Park Grand Champion!'
                : 'Landed perfectly into the farm splash pool! +500 Bonus Points awarded.'}
            </p>

            <button
              onClick={handleNextOrRestart}
              className="w-full max-w-[240px] py-3 px-6 rounded-2xl bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-400 hover:to-emerald-400 text-slate-950 font-black shadow-lg shadow-sky-500/30 transition-all text-sm uppercase tracking-wider"
            >
              {gameState.gameComplete ? 'Play Again 🔄' : 'Next Course (Space) ➡️'}
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-red-600/30 rounded-full flex items-center justify-center border-2 border-red-500/50 mb-3 text-3xl">
              🥀
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
              Splash Out!
            </span>
            <h3 className="text-2xl font-black text-white mb-2">Game Over</h3>
            <p className="text-xs text-slate-300 mb-4">
              Final Score: <span className="font-extrabold text-amber-400">{gameState.score}</span>
            </p>

            <button
              onClick={handleNextOrRestart}
              className="w-full max-w-[240px] py-3 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black shadow-lg shadow-red-500/30 transition-all text-sm uppercase tracking-wider"
            >
              Try Again (Space) 🔄
            </button>
          </div>
        )}
      </div>

      {/* Tactile Steering Buttons Strip */}
      <div className="w-full mt-3 bg-slate-800/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-700/60 shadow-xl">
        <div className="grid grid-cols-2 gap-3">
          <button
            onPointerDown={() => { isHoldingLeft.current = true; }}
            onPointerUp={() => { isHoldingLeft.current = false; }}
            onPointerLeave={() => { isHoldingLeft.current = false; }}
            className="flex items-center justify-center py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-sky-500 active:text-slate-950 border border-slate-600 text-white font-extrabold transition-all min-h-[50px] text-sm"
          >
            ◀ Steer Left
          </button>

          <button
            onPointerDown={() => { isHoldingRight.current = true; }}
            onPointerUp={() => { isHoldingRight.current = false; }}
            onPointerLeave={() => { isHoldingRight.current = false; }}
            className="flex items-center justify-center py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-sky-500 active:text-slate-950 border border-slate-600 text-white font-extrabold transition-all min-h-[50px] text-sm"
          >
            Steer Right ▶
          </button>
        </div>
      </div>

      {/* Controls Hint */}
      <p className="text-[11px] text-slate-400 mt-2 text-center font-medium">
        💡 Drag thumb across screen or use Left / Right arrows to steer Quacky down the flume!
      </p>
    </div>
  );
};

export default DuckWaterSlideContainer;

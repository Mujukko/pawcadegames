import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  moveBunny,
  nextStage,
  restartStage,
  STAGE_CONFIGS,
  updateEngine,
} from './logic/engine';
import { BunnyHopState, Direction, GRID_COLS, IDLE_HAWK_LIMIT } from './logic/types';
import { bunnyHopSound } from './systems/sound';

export const BunnyHopCrossContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<BunnyHopState>(() => createInitialState(1));
  const stateRef = useRef<BunnyHopState>(state);
  stateRef.current = state;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const cameraYRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync sound settings
  const toggleSound = useCallback(() => {
    const next = bunnyHopSound.toggleSound();
    setSoundEnabled(next);
  }, []);

  const handleHop = useCallback((dir: Direction) => {
    const next = moveBunny(stateRef.current, dir);
    if (next !== stateRef.current) {
      next.events.forEach((ev) => {
        if (ev.type === 'hop') bunnyHopSound.playHop();
        else if (ev.type === 'carrot_collect') bunnyHopSound.playCarrot(ev.isGolden);
        else if (ev.type === 'stage_clear') bunnyHopSound.playStageClear();
      });
      setState(next);
    }
  }, []);

  const handleRestart = useCallback(() => {
    const next = restartStage(stateRef.current);
    cameraYRef.current = 0;
    setState(next);
  }, []);

  const handleNextStage = useCallback(() => {
    const next = nextStage(stateRef.current);
    cameraYRef.current = 0;
    setState(next);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === ' ') {
        handleHop('up');
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        handleHop('down');
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleHop('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleHop('right');
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHop, handleRestart, toggleSound]);

  // Touch Swipe Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    touchStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!touchStartRef.current) return;
    const dx = e.clientX - touchStartRef.current.x;
    const dy = e.clientY - touchStartRef.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 18) {
      if (Math.abs(dx) > Math.abs(dy)) {
        handleHop(dx > 0 ? 'right' : 'left');
      } else {
        handleHop(dy < 0 ? 'up' : 'down');
      }
    } else {
      // Tap on canvas: if tap is above center hop up, else hop in direction
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        if (relY < rect.height * 0.4) handleHop('up');
        else if (relY > rect.height * 0.7) handleHop('down');
        else {
          const relX = e.clientX - rect.left;
          handleHop(relX > rect.width * 0.5 ? 'right' : 'left');
        }
      }
    }
    touchStartRef.current = null;
  };

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;

      // Update engine
      const prevState = stateRef.current;
      const nextState = updateEngine(prevState, dt);

      // Play audio for engine-generated events
      if (nextState.events.length > 0) {
        nextState.events.forEach((ev) => {
          if (ev.type === 'crash') bunnyHopSound.playCrash();
          else if (ev.type === 'splash') bunnyHopSound.playSplash();
          else if (ev.type === 'hawk_swoop') bunnyHopSound.playHawkSwoop();
          else if (ev.type === 'game_over') bunnyHopSound.playGameOver();
          else if (ev.type === 'stage_clear') bunnyHopSound.playStageClear();
        });
      }

      stateRef.current = nextState;

      // Render frame
      renderCanvas(nextState);

      // Update React state periodically or on status changes
      if (
        nextState.gameOver !== prevState.gameOver ||
        nextState.stageComplete !== prevState.stageComplete ||
        nextState.lives !== prevState.lives ||
        nextState.score !== prevState.score
      ) {
        setState(nextState);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas 2D Rendering Engine
  const renderCanvas = (currState: BunnyHopState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const colWidth = width / GRID_COLS;
    const rowHeight = 56;

    // Smooth camera tracking
    const targetCameraY = currState.bunny.visualY * rowHeight - height * 0.65;
    cameraYRef.current += (targetCameraY - cameraYRef.current) * 0.12;
    const camY = Math.max(0, cameraYRef.current);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // Visible row range
    const startRow = Math.max(0, Math.floor(camY / rowHeight) - 1);
    const endRow = Math.min(currState.lanes.length - 1, Math.ceil((camY + height) / rowHeight) + 1);

    // 1. Draw Lanes (Backgrounds)
    for (let r = startRow; r <= endRow; r++) {
      const lane = currState.lanes[r];
      if (!lane) continue;
      const screenY = height - (r * rowHeight - camY) - rowHeight;

      if (lane.type === 'grass') {
        ctx.fillStyle = r % 2 === 0 ? '#4ade80' : '#22c55e';
        ctx.fillRect(0, screenY, width, rowHeight);
        // Subtle grassy specks
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(20, screenY + 12, 4, 3);
        ctx.fillRect(80, screenY + 38, 4, 3);
        ctx.fillRect(width - 50, screenY + 22, 4, 3);
      } else if (lane.type === 'road') {
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, screenY, width, rowHeight);
        // Road curb lines
        ctx.fillStyle = '#475569';
        ctx.fillRect(0, screenY, width, 2);
        ctx.fillRect(0, screenY + rowHeight - 2, width, 2);
        // Dashed yellow center line
        ctx.fillStyle = '#facc15';
        for (let x = 10; x < width; x += 40) {
          ctx.fillRect(x, screenY + rowHeight / 2 - 2, 20, 4);
        }
      } else if (lane.type === 'river') {
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(0, screenY, width, rowHeight);
        // Water ripples
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const waveOffset = (performance.now() * 0.05) % 60;
        for (let x = -60 + waveOffset; x < width + 60; x += 60) {
          ctx.moveTo(x, screenY + 18);
          ctx.lineTo(x + 24, screenY + 18);
          ctx.moveTo(x + 30, screenY + 40);
          ctx.lineTo(x + 50, screenY + 40);
        }
        ctx.stroke();
      } else if (lane.type === 'railroad') {
        ctx.fillStyle = '#78350f';
        ctx.fillRect(0, screenY, width, rowHeight);
        // Wooden ties
        ctx.fillStyle = '#451a03';
        for (let x = 6; x < width; x += 18) {
          ctx.fillRect(x, screenY + 4, 10, rowHeight - 8);
        }
        // Steel rails
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(0, screenY + 14, width, 4);
        ctx.fillRect(0, screenY + rowHeight - 18, width, 4);

        // Blinking warning light
        if (lane.trainWarningTimer !== undefined && lane.trainWarningTimer < 2.0) {
          const blink = Math.floor(performance.now() / 200) % 2 === 0;
          ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d';
          ctx.beginPath();
          ctx.arc(width - 24, screenY + rowHeight / 2, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Finish Farm Gate at top row
      if (r === currState.lanes.length - 1) {
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(0, screenY, width, 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 FARM FINISH GATE 🏁', width / 2, screenY + 34);
      }
    }

    // 2. Draw Moving Entities (Vehicles, Logs, Lily Pads)
    for (let r = startRow; r <= endRow; r++) {
      const lane = currState.lanes[r];
      if (!lane) continue;
      const screenY = height - (r * rowHeight - camY) - rowHeight;

      if (lane.type === 'river') {
        for (const log of lane.movingEntities) {
          const logX = log.x * colWidth;
          const logW = log.width * colWidth;

          if (log.type === 'lily_pad') {
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.arc(logX + logW / 2, screenY + rowHeight / 2, logW * 0.42, 0, Math.PI * 2);
            ctx.fill();
            // Flower
            ctx.fillStyle = '#fef08a';
            ctx.beginPath();
            ctx.arc(logX + logW / 2, screenY + rowHeight / 2, 6, 0, Math.PI * 2);
            ctx.fill();
          } else {
            // Wood Log
            ctx.fillStyle = '#854d0e';
            ctx.beginPath();
            ctx.roundRect(logX, screenY + 10, logW, rowHeight - 20, 12);
            ctx.fill();
            ctx.fillStyle = '#713f12';
            ctx.fillRect(logX + 10, screenY + 14, logW - 20, 4);
          }
        }
      } else if (lane.type === 'road') {
        for (const veh of lane.movingEntities) {
          const vehX = veh.x * colWidth;
          const vehW = veh.width * colWidth;

          if (veh.type === 'tractor') {
            ctx.fillStyle = '#16a34a';
            ctx.beginPath();
            ctx.roundRect(vehX, screenY + 12, vehW, rowHeight - 24, 8);
            ctx.fill();
            // Cab
            ctx.fillStyle = '#bae6fd';
            ctx.fillRect(vehX + vehW * 0.4, screenY + 16, vehW * 0.4, rowHeight - 32);
            // Wheels
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(vehX + 4, screenY + 8, 12, 6);
            ctx.fillRect(vehX + vehW - 16, screenY + 8, 12, 6);
            ctx.fillRect(vehX + 4, screenY + rowHeight - 14, 12, 6);
            ctx.fillRect(vehX + vehW - 16, screenY + rowHeight - 14, 12, 6);
          } else if (veh.type === 'grain_truck') {
            ctx.fillStyle = '#eab308';
            ctx.beginPath();
            ctx.roundRect(vehX, screenY + 8, vehW, rowHeight - 16, 6);
            ctx.fill();
            ctx.fillStyle = '#ca8a04';
            ctx.fillRect(vehX + 8, screenY + 12, vehW - 24, rowHeight - 24);
          } else {
            // Pickup truck
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.roundRect(vehX, screenY + 12, vehW, rowHeight - 24, 6);
            ctx.fill();
            ctx.fillStyle = '#bae6fd';
            ctx.fillRect(vehX + vehW * 0.3, screenY + 16, vehW * 0.35, rowHeight - 32);
          }
        }
      } else if (lane.type === 'railroad' && lane.trainRushing) {
        // Fast express grain train
        const trainX = (lane.trainX ?? 0) * colWidth;
        const trainW = 6.0 * colWidth;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(trainX, screenY + 6, trainW, rowHeight - 12, 8);
        ctx.fill();
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(trainX + trainW - 8, screenY + rowHeight / 2, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3. Draw Obstacles & Collectibles
    for (let r = startRow; r <= endRow; r++) {
      const lane = currState.lanes[r];
      if (!lane) continue;
      const screenY = height - (r * rowHeight - camY) - rowHeight;

      // Obstacles (Trees)
      for (const obs of lane.obstacles) {
        const obsX = obs.col * colWidth + colWidth / 2;
        const obsY = screenY + rowHeight / 2;
        // Tree trunk
        ctx.fillStyle = '#78350f';
        ctx.fillRect(obsX - 5, obsY, 10, 16);
        // Foliage
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.arc(obsX, obsY - 4, 18, 0, Math.PI * 2);
        ctx.fill();
      }

      // Collectible Carrots
      for (const item of lane.collectibles) {
        if (item.collected) continue;
        const carrotX = item.col * colWidth + colWidth / 2;
        const carrotY = screenY + rowHeight / 2 + Math.sin(performance.now() * 0.006 + item.col) * 3;

        // Carrot body
        ctx.fillStyle = item.type === 'golden_carrot' ? '#f59e0b' : '#ea580c';
        ctx.beginPath();
        ctx.moveTo(carrotX, carrotY + 12);
        ctx.lineTo(carrotX - 7, carrotY - 6);
        ctx.lineTo(carrotX + 7, carrotY - 6);
        ctx.closePath();
        ctx.fill();

        // Carrot leaves
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(carrotX, carrotY - 8, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 4. Draw Hawk Warning Shadow if Idling
    if (currState.idleTimer > 4.0) {
      const hawkIntensity = (currState.idleTimer - 4.0) / (IDLE_HAWK_LIMIT - 4.0);
      const bunnyScreenX = currState.bunny.visualX * colWidth + colWidth / 2;
      const bunnyScreenY = height - (currState.bunny.visualY * rowHeight - camY) - rowHeight / 2;

      ctx.fillStyle = `rgba(15, 23, 42, ${Math.min(0.65, hawkIntensity * 0.65)})`;
      ctx.beginPath();
      ctx.ellipse(bunnyScreenX, bunnyScreenY, 32 * hawkIntensity, 16 * hawkIntensity, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 5. Draw Hero: Barnaby Bunny
    const bunny = currState.bunny;
    const bunnyX = bunny.visualX * colWidth + colWidth / 2;
    const baseBunnyY = height - (bunny.visualY * rowHeight - camY) - rowHeight / 2;
    // Hop elevation arc
    const hopArc = bunny.isHopping ? Math.sin(bunny.hopProgress * Math.PI) * 16 : 0;
    const bunnyY = baseBunnyY - hopArc;

    // Ground Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(bunnyX, baseBunnyY + 14, 16 - hopArc * 0.3, 6 - hopArc * 0.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bunny Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bunnyX, bunnyY + 4, 15, 0, Math.PI * 2);
    ctx.fill();

    // Red Bandana
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(bunnyX - 8, bunnyY + 6, 16, 4);

    // Bunny Head
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(bunnyX, bunnyY - 6, 13, 0, Math.PI * 2);
    ctx.fill();

    // Ears
    const earWiggle = bunny.isHopping ? Math.sin(bunny.hopProgress * Math.PI * 2) * 3 : 0;
    // Left ear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bunnyX - 6 + earWiggle, bunnyY - 22, 4, 10, -0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(bunnyX - 6 + earWiggle, bunnyY - 22, 2, 7, -0.15, 0, Math.PI * 2);
    ctx.fill();

    // Right ear
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(bunnyX + 6 - earWiggle, bunnyY - 22, 4, 10, 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(bunnyX + 6 - earWiggle, bunnyY - 22, 2, 7, 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(bunnyX - 4, bunnyY - 7, 2, 0, Math.PI * 2);
    ctx.arc(bunnyX + 4, bunnyY - 7, 2, 0, Math.PI * 2);
    ctx.fill();

    // Pink nose
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(bunnyX, bunnyY - 3, 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const currentStageConfig = STAGE_CONFIGS[(state.stage - 1) % STAGE_CONFIGS.length];

  return (
    <div className="flex flex-col items-center w-full select-none touch-none">
      {/* TOP HUD BAR */}
      <div className="w-full max-w-lg flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-t-2xl border-t border-x border-slate-700/80 shadow text-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐰</span>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400">
              Stage {state.stage}: {currentStageConfig.name}
            </div>
            <div className="text-sm font-black text-white">
              Row: {state.bunny.gridY} / {currentStageConfig.totalRows - 1}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-black text-amber-300 text-sm">
            <span>🥕</span>
            <span>{state.carrots}</span>
          </div>

          <div className="flex items-center gap-1 font-black text-white text-sm">
            <span className="text-xs text-slate-400">SCORE</span>
            <span>{state.score}</span>
          </div>

          <div className="flex items-center gap-0.5 text-base">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < state.lives ? 'text-red-500' : 'text-slate-600 opacity-40'}>
                ❤️
              </span>
            ))}
          </div>

          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm cursor-pointer"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative w-full max-w-lg bg-slate-950 border-x border-b border-slate-800 rounded-b-2xl overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={450}
          height={560}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="w-full h-auto aspect-[450/560] block cursor-pointer"
        />

        {/* STAGE CLEAR MODAL */}
        {state.stageComplete && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-400/30">
              🏆
            </div>
            <h3 className="text-2xl font-black text-white mb-1">STAGE CLEARED!</h3>
            <p className="text-sm font-semibold text-amber-300 mb-4">
              Barnaby reached the farm finish gate safely!
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 w-64 mb-5 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Stage Score</span>
                <span className="font-bold text-white">{state.score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Carrots</span>
                <span className="font-bold text-amber-400">+{state.carrots}</span>
              </div>
            </div>
            <button
              onClick={handleNextStage}
              className="w-64 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-400/30 transform hover:scale-102 transition-all cursor-pointer"
            >
              NEXT STAGE →
            </button>
          </div>
        )}

        {/* GAME OVER MODAL */}
        {state.gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-red-500/30">
              💔
            </div>
            <h3 className="text-2xl font-black text-white mb-1">GAME OVER</h3>
            <p className="text-sm font-medium text-slate-400 mb-4">Watch out for traffic and creek water!</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 w-64 mb-5 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Final Score</span>
                <span className="font-bold text-white">{state.score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>High Score</span>
                <span className="font-bold text-amber-400">{state.highScore}</span>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="w-64 py-3 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-400/30 transform hover:scale-102 transition-all cursor-pointer"
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        )}
      </div>

      {/* MOBILE ON-SCREEN TACTILE D-PAD (>=48px touch targets) */}
      <div className="w-full max-w-lg mt-3 flex items-center justify-between px-2">
        <div className="text-[11px] font-bold text-slate-400">
          Swipe or Tap Buttons to Hop
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleHop('left')}
            aria-label="Hop Left"
            className="w-12 h-12 min-w-[48px] min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200 transition-all cursor-pointer shadow"
          >
            ←
          </button>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => handleHop('up')}
              aria-label="Hop Forward"
              className="w-12 h-12 min-w-[48px] min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200 transition-all cursor-pointer shadow"
            >
              ↑
            </button>
            <button
              onClick={() => handleHop('down')}
              aria-label="Hop Backward"
              className="w-12 h-12 min-w-[48px] min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200 transition-all cursor-pointer shadow"
            >
              ↓
            </button>
          </div>
          <button
            onClick={() => handleHop('right')}
            aria-label="Hop Right"
            className="w-12 h-12 min-w-[48px] min-h-[48px] bg-slate-800 hover:bg-slate-700 active:bg-amber-400 active:text-slate-950 rounded-xl border border-slate-700 flex items-center justify-center text-xl font-bold text-slate-200 transition-all cursor-pointer shadow"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
};

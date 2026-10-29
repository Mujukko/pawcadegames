import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarnyardPopcornPopperState } from './logic/types';
import {
  createInitialState,
  nextStage,
  restartStage,
  STAGES,
  startPouring,
  stopPouring,
  updateEngine,
} from './logic/engine';
import { popcornSound } from './systems/sound';

export const BarnyardPopcornPopperContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<BarnyardPopcornPopperState>(() =>
    createInitialState(0)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => popcornSound.getMuted());
  const stateRef = useRef<BarnyardPopcornPopperState>(gameState);
  stateRef.current = gameState;

  const isPointerDownRef = useRef<boolean>(false);
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  // Handle Web Audio toggle
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    popcornSound.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  // Restart handler
  const handleRestart = useCallback(() => {
    const next = restartStage(stateRef.current);
    setGameState({ ...next });
  }, []);

  // Stage switch handler
  const handleSelectStage = useCallback((stageIndex: number) => {
    const next = createInitialState(stageIndex, stateRef.current.highScore);
    next.score = stateRef.current.score;
    setGameState({ ...next });
  }, []);

  // Next stage handler
  const handleNextStage = useCallback(() => {
    const next = nextStage(stateRef.current);
    setGameState({ ...next });
  }, []);

  // Pointer input listeners
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isPointerDownRef.current = true;
    if (stateRef.current.phase === 'ready' || stateRef.current.phase === 'pouring') {
      const next = startPouring(stateRef.current);
      setGameState({ ...next });
    }
  }, []);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    isPointerDownRef.current = false;
    if (stateRef.current.phase === 'pouring') {
      const next = stopPouring(stateRef.current);
      setGameState({ ...next });
    }
  }, []);

  // Main 60 FPS game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      const currentState = stateRef.current;

      // Advance physics if active
      if (
        currentState.phase === 'pouring' ||
        currentState.phase === 'popping' ||
        currentState.phase === 'evaluating'
      ) {
        updateEngine(currentState, dt);

        // Sound triggers
        for (const evt of currentState.events) {
          if (evt.type === 'kernel_drop') {
            popcornSound.playKernelDrop();
          } else if (evt.type === 'kernel_pop') {
            popcornSound.playPop();
          } else if (evt.type === 'spill') {
            popcornSound.playSpill();
          } else if (evt.type === 'victory') {
            popcornSound.playVictory();
          } else if (evt.type === 'game_over') {
            popcornSound.playGameOver();
          }
        }

        // Trigger React UI updates on terminal states
        if ((currentState.phase as any) === 'won' || (currentState.phase as any) === 'lost') {
          setGameState({ ...currentState });
        }
      }

      // --- RENDERING ---
      const w = 400;
      const h = 580;
      const currentStage = STAGES.find((s) => s.id === currentState.stage) || STAGES[0];

      // 1. Background (warm rustic barn kettle ambiance)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.4, '#311005');
      bgGrad.addColorStop(1, '#180803');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Floor
      ctx.fillStyle = '#271108';
      ctx.fillRect(0, 550, w, 30);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, 546, w, 4);

      // 2. Silo Hopper at Top
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(currentStage.spawnerX - 45, 0);
      ctx.lineTo(currentStage.spawnerX + 45, 0);
      ctx.lineTo(currentStage.spawnerX + 22, currentStage.spawnerY);
      ctx.lineTo(currentStage.spawnerX - 22, currentStage.spawnerY);
      ctx.closePath();
      ctx.fill();

      // Hopper glowing spout
      ctx.fillStyle = currentState.isPouring ? '#f59e0b' : '#b45309';
      ctx.fillRect(
        currentStage.spawnerX - 22,
        currentStage.spawnerY - 6,
        44,
        10
      );

      // 3. Rotating Obstacles (Paddles)
      for (const obs of currentStage.obstacles) {
        if (obs.type === 'paddle') {
          ctx.save();
          ctx.translate(obs.x, obs.y);
          ctx.rotate(obs.angle);

          // Wooden paddle arm
          ctx.fillStyle = '#92400e';
          ctx.strokeStyle = '#451a03';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(-obs.width / 2, -obs.height / 2, obs.width, obs.height, 4);
          ctx.fill();
          ctx.stroke();

          // Center axle pin
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }

      // 4. Static Bucket Walls & Fill Indicators
      const bucket = currentStage.bucket;

      // Draw Bucket Backdrop (interior)
      ctx.fillStyle = '#1c1917';
      ctx.beginPath();
      ctx.moveTo(bucket.walls[0].x1, bucket.walls[0].y1);
      for (const wall of bucket.walls) {
        ctx.lineTo(wall.x2, wall.y2);
      }
      ctx.closePath();
      ctx.fill();

      // Target Fill Line (Green Dashed)
      ctx.save();
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 6]);
      ctx.beginPath();
      ctx.moveTo(bucket.x - bucket.width / 2 + 10, bucket.targetLineY);
      ctx.lineTo(bucket.x + bucket.width / 2 - 10, bucket.targetLineY);
      ctx.stroke();

      // Target Label
      ctx.fillStyle = '#86efac';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('TARGET FILL 🏁', bucket.x + bucket.width / 2 - 15, bucket.targetLineY - 6);
      ctx.restore();

      // Red Brim Danger Line
      ctx.save();
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bucket.x - bucket.width / 2, bucket.brimY);
      ctx.lineTo(bucket.x + bucket.width / 2, bucket.brimY);
      ctx.stroke();
      ctx.fillStyle = '#fca5a5';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('BRIM ⚠️', bucket.x - bucket.width / 2 + 10, bucket.brimY - 5);
      ctx.restore();

      // 5. Draw Kernels & Popcorn
      for (const k of currentState.kernels) {
        ctx.save();
        ctx.translate(k.x, k.y);
        ctx.rotate(k.rotation);

        if (!k.isPopped) {
          // Unpopped Golden Seed
          ctx.fillStyle = k.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, k.radius, k.radius * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1;
          ctx.stroke();
        } else {
          // Fluffy multi-lobed butter popcorn
          ctx.fillStyle = k.color;
          ctx.beginPath();
          ctx.arc(-4, -3, 6, 0, Math.PI * 2);
          ctx.arc(4, -3, 6, 0, Math.PI * 2);
          ctx.arc(0, 4, 7, 0, Math.PI * 2);
          ctx.fill();

          // Golden toasted center highlight
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 6. Bucket Exterior Walls & Red/White Stripes
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let i = 0; i < bucket.walls.length; i++) {
        const wall = bucket.walls[i];
        if (i === 0) ctx.moveTo(wall.x1, wall.y1);
        ctx.lineTo(wall.x2, wall.y2);
      }
      ctx.stroke();

      // Bucket Gold Rim
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(bucket.x - bucket.width / 2 - 4, bucket.brimY - 4, bucket.width + 8, 8);

      // 7. Telemetry & Spill HUD Overlay on Canvas
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`🍿 Kernels: ${currentState.kernelsPoured} / ${currentState.maxKernels}`, 16, 28);

      // Spill Counter
      ctx.fillStyle = currentState.spilledCount > currentState.maxSpillsAllowed - 2 ? '#ef4444' : '#f87171';
      ctx.fillText(`⚠️ Spills: ${currentState.spilledCount} / ${currentState.maxSpillsAllowed}`, 16, 46);

      // Fill Ratio Progress Bar (Top Right)
      const barW = 100;
      const barH = 12;
      const barX = w - barW - 16;
      const barY = 20;

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = currentState.fillRatio >= 0.85 ? '#22c55e' : '#f59e0b';
      ctx.fillRect(barX, barY, Math.min(barW, barW * currentState.fillRatio), barH);
      ctx.strokeStyle = '#ffffff40';
      ctx.strokeRect(barX, barY, barW, barH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(currentState.fillRatio * 100)}% Fill`, barX + barW / 2, barY + 10);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  const currentStage = STAGES.find((s) => s.id === gameState.stage) || STAGES[0];

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[480px] mx-auto select-none touch-none py-2 px-1">
      {/* Top Controls Header */}
      <div className="w-full flex items-center justify-between mb-2 px-2 bg-slate-900/90 py-2 rounded-xl border border-amber-500/30">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {STAGES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => handleSelectStage(idx)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                gameState.stage === s.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Stage {s.id}
            </button>
          ))}
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
            title="Restart Stage"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Canvas Container */}
      <div
        className="relative w-full aspect-[400/580] rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl shadow-amber-950/40 touch-none bg-slate-950"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <canvas
          ref={canvasRef}
          width={400}
          height={580}
          className="w-full h-full block cursor-pointer select-none touch-none"
        />

        {/* Ready Overlay */}
        {gameState.phase === 'ready' && (
          <div className="absolute inset-x-0 bottom-6 flex flex-col items-center justify-center pointer-events-none animate-pulse">
            <div className="px-5 py-2.5 rounded-full bg-amber-500/90 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/40 border border-amber-300">
              👇 Hold Screen to Pour Corn!
            </div>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.phase === 'won' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">🍿✨</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">KETTLE MASTER!</h2>
            <p className="text-slate-300 text-sm mb-4">
              Golden buttery popcorn reached the target line!
            </p>

            <div className="flex gap-2 text-3xl mb-4">
              <span className={gameState.stars >= 1 ? 'text-amber-400' : 'text-slate-600'}>⭐</span>
              <span className={gameState.stars >= 2 ? 'text-amber-400' : 'text-slate-600'}>⭐</span>
              <span className={gameState.stars >= 3 ? 'text-amber-400' : 'text-slate-600'}>⭐</span>
            </div>

            <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-3 w-full max-w-[240px] mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Stage Score</span>
                <span className="font-bold text-amber-300">{gameState.score}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>High Score</span>
                <span className="font-bold text-amber-300">{gameState.highScore}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-[260px]">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 active:scale-95"
              >
                Replay 🔄
              </button>
              <button
                onClick={handleNextStage}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 active:scale-95"
              >
                Next 🍿
              </button>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.phase === 'lost' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">💥🌽</div>
            <h2 className="text-2xl font-black text-red-400 mb-1">
              {gameState.spilledCount > gameState.maxSpillsAllowed ? 'TOO MANY SPILLS!' : 'UNDERFILLED!'}
            </h2>
            <p className="text-slate-300 text-sm mb-4">
              {gameState.spilledCount > gameState.maxSpillsAllowed
                ? 'Popcorn overflowed past the kettle brim.'
                : 'Need more kernels to reach the green target line!'}
            </p>

            <button
              onClick={handleRestart}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/30 active:scale-95"
            >
              Try Again 🔄
            </button>
          </div>
        )}
      </div>

      {/* Tactile Mobile Big Pour Button */}
      <div className="w-full mt-2">
        <button
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          disabled={gameState.phase === 'won' || gameState.phase === 'lost'}
          className={`w-full py-3.5 rounded-xl font-black text-base uppercase tracking-wider transition-all shadow-lg active:scale-95 ${
            gameState.isPouring
              ? 'bg-amber-400 text-slate-950 shadow-amber-400/50 scale-[0.98] ring-4 ring-amber-300'
              : 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-slate-950 shadow-orange-500/30 hover:brightness-105'
          }`}
        >
          {gameState.isPouring ? '🔥 POURING CORN...' : '🍿 HOLD TO POUR'}
        </button>
      </div>
    </div>
  );
};

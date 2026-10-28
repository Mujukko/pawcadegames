import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialState,
  launchBall,
  updateEngine,
  nextStage,
  restartGame,
  STAGES,
  GAME_WIDTH,
  GAME_HEIGHT,
  BALL_RADIUS,
} from './logic/engine';
import { BarnyardBrickBreakerState, BrickType } from './logic/types';
import { brickBreakerAudio } from './systems/sound';

interface SplinterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  size: number;
  color: string;
  life: number;
}

export const BarnyardBrickBreakerContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<BarnyardBrickBreakerState>(() => createInitialState());
  const [isMuted, setIsMuted] = useState<boolean>(() => brickBreakerAudio.getMuted());

  const stateRef = useRef<BarnyardBrickBreakerState>(gameState);
  stateRef.current = gameState;

  const targetPaddleXRef = useRef<number>(GAME_WIDTH / 2);
  const splintersRef = useRef<SplinterParticle[]>([]);
  const isHoldingLeft = useRef<boolean>(false);
  const isHoldingRight = useRef<boolean>(false);

  // Toggle audio
  const handleToggleMute = () => {
    const nextMuted = brickBreakerAudio.toggleMute();
    setIsMuted(nextMuted);
  };

  // Launch action
  const handleLaunch = useCallback(() => {
    const current = stateRef.current;
    if (current.gameOver) {
      setGameState(restartGame(current));
    } else if (current.stageComplete) {
      setGameState(nextStage(current));
    } else {
      setGameState(launchBall(current));
      brickBreakerAudio.playPaddleBounce(0);
    }
  }, []);

  // Spawn visual splinter particle burst
  const spawnSplinters = (x: number, y: number, brickType: BrickType = 'wood_crate') => {
    const count = brickType === 'golden_honey' ? 12 : 8;
    const colors =
      brickType === 'golden_honey'
        ? ['#fef08a', '#facc15', '#ca8a04', '#ffffff']
        : brickType === 'stone_brick'
        ? ['#94a3b8', '#64748b', '#475569', '#cbd5e1']
        : ['#fbbf24', '#d97706', '#92400e', '#78350f'];

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 140;
      splintersRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 8,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)]!,
        life: 1.0,
      });
    }
  };

  // Pointer drag steering
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = GAME_WIDTH / rect.width;
    const x = (e.clientX - rect.left) * scaleX;
    targetPaddleXRef.current = x;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
    // If any ball is stuck to paddle, launch it on tap
    if (stateRef.current.balls.some((b) => b.stuckToPaddle)) {
      handleLaunch();
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
        handleLaunch();
      } else if (key === 'm') {
        handleToggleMute();
      } else if (key === 'r') {
        setGameState(restartGame(stateRef.current));
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
  }, [handleLaunch]);

  // Main 60 FPS animation & physics loop
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

      // Handle continuous keyboard holding
      if (isHoldingLeft.current) {
        targetPaddleXRef.current = Math.max(30, targetPaddleXRef.current - 420 * dt);
      }
      if (isHoldingRight.current) {
        targetPaddleXRef.current = Math.min(GAME_WIDTH - 30, targetPaddleXRef.current + 420 * dt);
      }

      // Step logic engine
      const current = stateRef.current;
      const next = updateEngine(current, dt, targetPaddleXRef.current);

      // Play audio & particles from logic events
      if (next.lastEvents.length > 0) {
        for (const ev of next.lastEvents) {
          if (ev.type === 'bounce_wall') {
            brickBreakerAudio.playWallBounce();
          } else if (ev.type === 'bounce_paddle') {
            const offset = (ev.x! - next.paddle.x) / (next.paddle.width / 2);
            brickBreakerAudio.playPaddleBounce(offset);
          } else if (ev.type === 'hit_brick' || ev.type === 'brick_destroyed') {
            brickBreakerAudio.playBrickHit(ev.brickType, ev.type === 'brick_destroyed');
            if (ev.type === 'brick_destroyed' && ev.x && ev.y) {
              spawnSplinters(ev.x, ev.y, ev.brickType);
            }
          } else if (ev.type === 'collect_powerup') {
            brickBreakerAudio.playCollectPowerUp();
          } else if (ev.type === 'ball_lost') {
            brickBreakerAudio.playBallLost();
          } else if (ev.type === 'stage_clear') {
            brickBreakerAudio.playStageClear();
          }
        }
      }

      stateRef.current = next;
      setGameState(next);

      // --- RENDER SCENE ---
      ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // 1. Sky & Sunlit Farm Orchard Backdrop
      const skyGrad = ctx.createLinearGradient(0, 0, 0, GAME_HEIGHT);
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.4, '#38bdf8');
      skyGrad.addColorStop(0.75, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

      // Distant rolling green pastures
      ctx.fillStyle = '#16a34a';
      ctx.beginPath();
      ctx.arc(80, 560, 200, 0, Math.PI * 2);
      ctx.arc(320, 560, 200, 0, Math.PI * 2);
      ctx.fill();

      // Red barn roof silhouette in distance
      ctx.fillStyle = '#991b1b';
      ctx.beginPath();
      ctx.moveTo(160, 480);
      ctx.lineTo(200, 440);
      ctx.lineTo(240, 480);
      ctx.closePath();
      ctx.fill();

      // 2. Render Bricks
      for (const br of next.bricks) {
        ctx.save();
        const halfW = br.width / 2;
        const halfH = br.height / 2;
        const x = br.x - halfW;
        const y = br.y - halfH;

        if (br.type === 'wood_crate') {
          // Wooden Apple Crate
          ctx.fillStyle = '#d97706';
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, y, br.width, br.height, 3);
          ctx.fill();
          ctx.stroke();

          // Horizontal plank line
          ctx.strokeStyle = '#92400e';
          ctx.beginPath();
          ctx.moveTo(x + 2, br.y);
          ctx.lineTo(x + br.width - 2, br.y);
          ctx.stroke();

          // Corner nail rivets
          ctx.fillStyle = '#451a03';
          ctx.fillRect(x + 3, y + 3, 2, 2);
          ctx.fillRect(x + br.width - 5, y + 3, 2, 2);
          ctx.fillRect(x + 3, y + br.height - 5, 2, 2);
          ctx.fillRect(x + br.width - 5, y + br.height - 5, 2, 2);
        } else if (br.type === 'stone_brick') {
          // Stone Foundation Block
          ctx.fillStyle = br.hitsLeft === 2 ? '#64748b' : '#475569';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.roundRect(x, y, br.width, br.height, 3);
          ctx.fill();
          ctx.stroke();

          // Crack lines if damaged
          if (br.hitsLeft === 1) {
            ctx.strokeStyle = '#f87171';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(br.x - 10, br.y - 4);
            ctx.lineTo(br.x + 2, br.y + 2);
            ctx.lineTo(br.x + 12, br.y - 2);
            ctx.stroke();
          }
        } else {
          // Golden Honeycomb Block
          ctx.fillStyle = '#facc15';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(x, y, br.width, br.height, 4);
          ctx.fill();
          ctx.stroke();

          // Golden sparkle icon
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(br.x, br.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 3. Render Falling Power-Ups
      for (const pu of next.powerUps) {
        ctx.save();
        ctx.translate(pu.x, pu.y);

        // Capsule background
        ctx.fillStyle =
          pu.type === 'multiball'
            ? '#ef4444'
            : pu.type === 'wide_paddle'
            ? '#3b82f6'
            : pu.type === 'fireball'
            ? '#f97316'
            : '#ec4899';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(-14, -9, 28, 18, 9);
        ctx.fill();
        ctx.stroke();

        // Icon text
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label =
          pu.type === 'multiball'
            ? 'x3'
            : pu.type === 'wide_paddle'
            ? '↔'
            : pu.type === 'fireball'
            ? '🔥'
            : '❤️';
        ctx.fillText(label, 0, 1);
        ctx.restore();
      }

      // 4. Render Balls (Bouncy Red Apples)
      for (const b of next.balls) {
        ctx.save();
        ctx.translate(b.x, b.y);

        // Fireball aura
        if (b.isFireball) {
          ctx.fillStyle = '#f97316';
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.arc(0, 0, b.radius + 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }

        // Apple body
        ctx.fillStyle = b.isFireball ? '#ea580c' : '#dc2626';
        ctx.strokeStyle = '#7f1d1d';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Little green leaf & stem
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(3, -b.radius + 1, 3, 1.5, -0.4, 0, Math.PI * 2);
        ctx.fill();

        // Glossy gleam
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-2, -2, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // 5. Render Harvester Cart Paddle
      const p = next.paddle;
      ctx.save();
      ctx.translate(p.x, p.y);

      // Rubber wheels
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(-p.width / 2 + 6, 8, 8, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(p.width / 2 - 6, 8, 8, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red harvester body
      ctx.fillStyle = p.wideTimer > 0 ? '#2563eb' : '#dc2626';
      ctx.strokeStyle = p.wideTimer > 0 ? '#1e3a8a' : '#991b1b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 6);
      ctx.fill();
      ctx.stroke();

      // Top guide strip
      ctx.fillStyle = '#f1f5f9';
      ctx.fillRect(-p.width / 2 + 8, -p.height / 2 + 2, p.width - 16, 3);

      // Center chevron arrow
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(-4, 2);
      ctx.lineTo(0, -2);
      ctx.lineTo(4, 2);
      ctx.closePath();
      ctx.fill();

      ctx.restore();

      // 6. Render Particle Splinters
      for (let i = splintersRef.current.length - 1; i >= 0; i--) {
        const sp = splintersRef.current[i]!;
        sp.x += sp.vx * dt;
        sp.y += sp.vy * dt;
        sp.vy += 220 * dt; // Gravity
        sp.rot += sp.vRot * dt;
        sp.life -= 1.8 * dt;

        if (sp.life <= 0) {
          splintersRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rot);
        ctx.globalAlpha = Math.max(0, sp.life);
        ctx.fillStyle = sp.color;
        ctx.fillRect(-sp.size / 2, -sp.size / 2, sp.size, sp.size);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentStage = STAGES[gameState.currentStageIndex]!;

  return (
    <div className="flex flex-col items-center w-full max-w-[500px] mx-auto select-none touch-none">
      {/* Top Header Strip */}
      <div className="w-full bg-slate-800/90 backdrop-blur-md rounded-2xl p-3 border border-slate-700/60 shadow-xl mb-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🍎🧱</span>
              <h2 className="text-sm font-bold text-white tracking-wide">{currentStage.name}</h2>
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Stage {gameState.currentStageIndex + 1}/{STAGES.length}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">{currentStage.subtitle}</p>
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
              onClick={() => setGameState(restartGame(stateRef.current))}
              className="p-2 rounded-xl bg-slate-700/60 hover:bg-slate-700 border border-slate-600 text-slate-200 transition-all text-xs font-bold"
              title="Reset Run (R)"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Lives & Active Status Bar */}
        <div className="flex items-center justify-between text-xs font-bold">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Lives:</span>
            <div className="flex gap-1 text-base leading-none">
              {Array.from({ length: 5 }).map((_, idx) => (
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
            {gameState.paddle.wideTimer > 0 && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-[10px]">
                ↔️ WIDE ({Math.ceil(gameState.paddle.wideTimer)}s)
              </span>
            )}
            {gameState.paddle.fireballTimer > 0 && (
              <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-300 border border-orange-500/40 text-[10px] animate-pulse">
                🔥 FIRE ({Math.ceil(gameState.paddle.fireballTimer)}s)
              </span>
            )}
            {gameState.combo > 1 && (
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px]">
                COMBO x{gameState.combo}!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full aspect-[4/5] max-w-[400px] rounded-3xl overflow-hidden border-2 border-slate-700/80 shadow-2xl bg-slate-900">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full cursor-pointer touch-none"
        />

        {/* Start / Launch Prompt */}
        {gameState.balls.some((b) => b.stuckToPaddle) && !gameState.gameOver && !gameState.stageComplete && (
          <div className="absolute bottom-16 inset-x-0 flex justify-center pointer-events-none">
            <span className="px-4 py-2 rounded-full bg-slate-950/80 backdrop-blur-md text-amber-300 font-extrabold text-xs border border-amber-500/40 shadow-lg animate-bounce">
              👆 Tap or Press Space to Launch Apple!
            </span>
          </div>
        )}

        {/* Stage Clear Overlay */}
        {gameState.stageComplete && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center border-4 border-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.6)] mb-3 animate-bounce">
              <span className="text-3xl">🏆</span>
            </div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1">
              Stage Cleared!
            </span>
            <h3 className="text-2xl font-black text-white mb-2">
              {currentStage.name} Harvested!
            </h3>
            <p className="text-xs text-slate-300 max-w-[280px] mb-4">
              {gameState.gameComplete
                ? 'All 4 farm silos and orchards have been cleared! Grand Champion Harvester!'
                : 'All fruit crates cleared! +500 Bonus Points awarded.'}
            </p>

            <button
              onClick={handleLaunch}
              className="w-full max-w-[240px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black shadow-lg shadow-orange-500/30 transition-all text-sm uppercase tracking-wider"
            >
              {gameState.gameComplete ? 'Play Again 🔄' : 'Next Stage (Space) ➡️'}
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 bg-red-600/30 rounded-full flex items-center justify-center border-2 border-red-500/50 mb-3 text-3xl">
              🥀
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-red-400 mb-1">
              Out of Apples!
            </span>
            <h3 className="text-2xl font-black text-white mb-2">Game Over</h3>
            <p className="text-xs text-slate-300 mb-4">
              Final Score: <span className="font-extrabold text-amber-400">{gameState.score}</span>
            </p>

            <button
              onClick={handleLaunch}
              className="w-full max-w-[240px] py-3 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-400 hover:to-amber-400 text-slate-950 font-black shadow-lg shadow-red-500/30 transition-all text-sm uppercase tracking-wider"
            >
              Try Again (Space) 🔄
            </button>
          </div>
        )}
      </div>

      {/* Tactile Button Strip */}
      <div className="w-full mt-3 bg-slate-800/90 backdrop-blur-md rounded-2xl p-2.5 border border-slate-700/60 shadow-xl">
        <div className="grid grid-cols-3 gap-2">
          <button
            onPointerDown={() => { isHoldingLeft.current = true; }}
            onPointerUp={() => { isHoldingLeft.current = false; }}
            onPointerLeave={() => { isHoldingLeft.current = false; }}
            className="flex items-center justify-center py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 border border-slate-600 text-white font-extrabold transition-all min-h-[50px] text-sm"
          >
            ◀ Left
          </button>

          <button
            onClick={handleLaunch}
            className="flex items-center justify-center py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 active:scale-95 text-slate-950 font-black border border-amber-300 shadow-md min-h-[50px] text-sm uppercase tracking-wide"
          >
            🚀 Launch
          </button>

          <button
            onPointerDown={() => { isHoldingRight.current = true; }}
            onPointerUp={() => { isHoldingRight.current = false; }}
            onPointerLeave={() => { isHoldingRight.current = false; }}
            className="flex items-center justify-center py-3 rounded-xl bg-slate-700/60 hover:bg-slate-700 active:bg-amber-500 active:text-slate-950 border border-slate-600 text-white font-extrabold transition-all min-h-[50px] text-sm"
          >
            Right ▶
          </button>
        </div>
      </div>

      {/* Controls Hint */}
      <p className="text-[11px] text-slate-400 mt-2 text-center font-medium">
        💡 Drag or use Left / Right arrows to steer cart • Spacebar to launch apple
      </p>
    </div>
  );
};

export default BarnyardBrickBreakerContainer;

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialBubbleState,
  calculateAimTrajectory,
  fireCurrentBubble,
  updateFlyingBubble,
  getCellCenter,
  FarmFruitBubbleState,
  FRUIT_DEFS,
  FruitType,
  BOARD_WIDTH,
  BOARD_HEIGHT,
  BUBBLE_RADIUS,
  SLINGSHOT_X,
  SLINGSHOT_Y,
  DANGER_LINE_Y,
} from './logic/engine';
import { bubbleAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Award, Sparkles, RefreshCw } from 'lucide-react';
import { analytics } from '../../lib/analytics';

const HIGH_SCORE_KEY = 'pawcade_farm_fruit_bubble_highscore';

interface JuiceParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingScore {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  life: number;
}

export const FarmFruitBubbleContainer: React.FC = () => {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [hud, setHud] = useState<{
    score: number;
    highScore: number;
    level: number;
    shotsUntilDescent: number;
    gameOver: boolean;
    gameWon: boolean;
  }>({
    score: 0,
    highScore,
    level: 1,
    shotsUntilDescent: 6,
    gameOver: false,
    gameWon: false,
  });

  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<FarmFruitBubbleState>(createInitialBubbleState(highScore, 1));
  const reqAnimRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const isAimingRef = useRef<boolean>(false);

  // Juice refs
  const particlesRef = useRef<JuiceParticle[]>([]);
  const popupsRef = useRef<FloatingScore[]>([]);

  // Update aim angle from canvas pointer position
  const updateAimFromPointer = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Angle relative to slingshot (200, 500)
    const dx = x - SLINGSHOT_X;
    const dy = y - SLINGSHOT_Y;

    if (dy < -20) {
      // Must be aiming upward
      const angleRad = Math.atan2(dx, -dy);
      let angleDeg = (angleRad * 180) / Math.PI;
      angleDeg = Math.max(-75, Math.min(75, angleDeg));
      stateRef.current.aimAngleDeg = angleDeg;
    }
  }, []);

  const shootBubble = useCallback(() => {
    const curr = stateRef.current;
    if (curr.gameOver || curr.gameWon || curr.flyingBubble !== null) return;

    bubbleAudio.playShoot();
    const nextState = fireCurrentBubble(curr);
    stateRef.current = nextState;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const curr = stateRef.current;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        curr.aimAngleDeg = Math.max(-75, curr.aimAngleDeg - 5);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        curr.aimAngleDeg = Math.min(75, curr.aimAngleDeg + 5);
      } else if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault();
        shootBubble();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = bubbleAudio.toggleMute();
        setIsMuted(muted);
      } else if ((e.key === 'r' || e.key === 'R') && (curr.gameOver || curr.gameWon)) {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shootBubble]);

  const restartGame = useCallback(() => {
    analytics.gameRestarted('farm-fruit-bubble', { finalScore: stateRef.current.score, level: stateRef.current.level });
    const nextState = createInitialBubbleState(highScore, 1);
    stateRef.current = nextState;
    particlesRef.current = [];
    popupsRef.current = [];
    setHud({
      score: 0,
      highScore,
      level: 1,
      shotsUntilDescent: 6,
      gameOver: false,
      gameWon: false,
    });
  }, [highScore]);

  const advanceLevel = useCallback(() => {
    const nextLevel = stateRef.current.level + 1;
    analytics.track('level_started', { gameId: 'farm-fruit-bubble', levelId: nextLevel });
    const currentScore = stateRef.current.score;
    const nextState = createInitialBubbleState(Math.max(highScore, currentScore), nextLevel);
    nextState.score = currentScore;
    stateRef.current = nextState;
    particlesRef.current = [];
    popupsRef.current = [];
    setHud({
      score: currentScore,
      highScore: Math.max(highScore, currentScore),
      level: nextLevel,
      shotsUntilDescent: 6,
      gameOver: false,
      gameWon: false,
    });
  }, [highScore]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = BOARD_WIDTH * dpr;
    canvas.height = BOARD_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const renderLoop = (timestamp: number) => {
      if (!active) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      let state = stateRef.current;

      // 1. UPDATE PHYSICS
      if (!state.gameOver && !state.gameWon) {
        // A. Flying bubble physics
        if (state.flyingBubble) {
          const update = updateFlyingBubble(state, dt);
          state = update.state;

          if (update.event === 'pop') {
            bubbleAudio.playPop(state.combo);
            // Spawn juice particles for popped bubbles
            popupsRef.current.push({
              text: state.combo > 1 ? `COMBO x${state.combo}! +${state.lastPopCount * 60}` : `POP! +${state.lastPopCount * 40}`,
              x: SLINGSHOT_X,
              y: 260,
              vy: -60,
              color: '#facc15',
              alpha: 1,
              life: 0,
            });
          } else if (update.event === 'gameover') {
            bubbleAudio.playGameOver();
            analytics.levelFailed('farm-fruit-bubble', {
              score: state.score,
              level: state.level,
            });
            if (state.score > highScore) {
              setHighScore(state.score);
              if (typeof window !== 'undefined') {
                localStorage.setItem(HIGH_SCORE_KEY, state.score.toString());
              }
            }
          } else if (update.event === 'levelclear') {
            bubbleAudio.playLevelClear();
            analytics.levelCompleted('farm-fruit-bubble', {
              score: state.score,
              level: state.level,
            });
            confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
          }

          setHud({
            score: state.score,
            highScore: Math.max(highScore, state.score),
            level: state.level,
            shotsUntilDescent: state.shotsUntilDescent,
            gameOver: state.gameOver,
            gameWon: state.gameWon,
          });
        }

        // B. Dropping orphan bubbles physics
        for (let i = state.droppingFruits.length - 1; i >= 0; i--) {
          const drop = state.droppingFruits[i];
          drop.x += drop.vx * dt;
          drop.y += drop.vy * dt;
          drop.vy += 450 * dt; // gravity

          if (drop.y > BOARD_HEIGHT + 30) {
            bubbleAudio.playHarvestDrop();
            state.droppingFruits.splice(i, 1);
          }
        }

        stateRef.current = state;
      }

      // 2. CANVAS DRAWING
      ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Background Orchard Sky & Garden
      const bgGrad = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
      bgGrad.addColorStop(0, '#bae6fd'); // sky-200
      bgGrad.addColorStop(0.75, '#e0f2fe'); // sky-100
      bgGrad.addColorStop(1, '#bbf7d0'); // green-200 pasture
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

      // Top Orchard Wood Beam
      ctx.fillStyle = '#78350f'; // amber-900
      ctx.fillRect(0, 0, BOARD_WIDTH, 14);
      ctx.fillStyle = '#92400e';
      ctx.fillRect(0, 14, BOARD_WIDTH, 3);

      // Leaves along top beam
      for (let lx = 12; lx < BOARD_WIDTH; lx += 36) {
        ctx.fillStyle = '#16a34a'; // green-600
        ctx.beginPath();
        ctx.ellipse(lx, 14, 10, 5, 0.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Red Danger Line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.moveTo(10, DANGER_LINE_Y);
      ctx.lineTo(BOARD_WIDTH - 10, DANGER_LINE_Y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 9px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('⚠️ DANGER LINE', BOARD_WIDTH - 15, DANGER_LINE_Y - 4);

      // Draw Grid Fruit Bubbles
      for (let r = 0; r < state.grid.length; r++) {
        const isOdd = r % 2 === 1;
        const cols = isOdd ? 7 : 8;
        for (let c = 0; c < cols; c++) {
          const type = state.grid[r][c];
          if (type !== null) {
            const { x, y } = getCellCenter(r, c);
            drawFruitBubble(ctx, x, y, type);
          }
        }
      }

      // Draw Dropping Orphan Fruits
      state.droppingFruits.forEach((drop) => {
        drawFruitBubble(ctx, drop.x, drop.y, drop.type, 0.9);
      });

      // Draw Aim Trajectory Line
      if (!state.flyingBubble && !state.gameOver && !state.gameWon) {
        const trajectory = calculateAimTrajectory(SLINGSHOT_X, SLINGSHOT_Y, state.aimAngleDeg);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        trajectory.forEach((pt, idx) => {
          if (idx === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        });
        ctx.stroke();
        ctx.setLineDash([]);

        // Small aiming guide dot at end
        const lastPt = trajectory[trajectory.length - 1];
        if (lastPt) {
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(lastPt.x, lastPt.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw Flying Bubble
      if (state.flyingBubble) {
        drawFruitBubble(ctx, state.flyingBubble.x, state.flyingBubble.y, state.flyingBubble.type);
      }

      // Draw Slingshot Base & Ready Fruit
      drawSlingshot(ctx, SLINGSHOT_X, SLINGSHOT_Y, state.currentBubble, state.nextBubble);

      // Draw Descent Countdown Meter (Crank wheels on bottom left)
      drawDescentMeter(ctx, 30, BOARD_HEIGHT - 35, state.shotsUntilDescent);

      // Draw Harvest Baskets at bottom
      drawHarvestBaskets(ctx);

      // Floating Score Popups
      popupsRef.current.forEach((pop, idx) => {
        pop.life += dt;
        pop.y += pop.vy * dt;
        pop.alpha = Math.max(0, 1 - pop.life / 0.85);

        ctx.save();
        ctx.translate(pop.x, pop.y);
        ctx.globalAlpha = pop.alpha;
        ctx.font = '900 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3;
        ctx.strokeText(pop.text, 0, 0);
        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, 0, 0);
        ctx.restore();

        if (pop.life >= 0.85) {
          popupsRef.current.splice(idx, 1);
        }
      });

      reqAnimRef.current = requestAnimationFrame(renderLoop);
    };

    reqAnimRef.current = requestAnimationFrame(renderLoop);
    return () => {
      active = false;
      cancelAnimationFrame(reqAnimRef.current);
    };
  }, [highScore]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto h-[560px] sm:h-[620px] max-h-[85vh] select-none bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-800/40 flex flex-col touch-none cursor-crosshair"
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
        isAimingRef.current = true;
        updateAimFromPointer(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (isAimingRef.current) {
          updateAimFromPointer(e.clientX, e.clientY);
        }
      }}
      onPointerUp={(e) => {
        if (isAimingRef.current) {
          try {
            (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
          } catch {}
          isAimingRef.current = false;
          shootBubble();
        }
      }}
      onPointerCancel={(e) => {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        isAimingRef.current = false;
      }}
      style={{ touchAction: 'none' }}
    >
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-slate-900/70 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Level {hud.level}</span>
            <span className="text-xl font-black leading-tight drop-shadow">{hud.score}</span>
          </div>
        </div>

        {/* High Score & Audio */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-amber-300 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>{hud.highScore}</span>
          </div>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              const muted = bubbleAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 flex items-center justify-center cursor-pointer"
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 60 FPS Canvas Game Viewport */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-contain block select-none pointer-events-none" />
      </div>

      {/* Bottom Action Prompt */}
      {!hud.gameOver && !hud.gameWon && (
        <div className="relative z-20 py-2.5 bg-slate-900/80 backdrop-blur-sm border-t border-white/10 text-center text-white/90 text-xs font-semibold">
          Drag to Aim &bull; Release to Shoot Fruit!
        </div>
      )}

      {/* Victory / Next Level Modal */}
      {hud.gameWon && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn overflow-y-auto max-h-full"
        >
          <div className="text-5xl mb-2 animate-bounce">🍎🏆</div>
          <h2 className="text-2xl font-black text-emerald-400 tracking-wide uppercase mb-1">Orchard Cleared!</h2>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            You cleared every fruit bubble and earned a harvest bonus!
          </p>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 w-full max-w-xs mb-5">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Score</span>
            <span className="text-2xl font-black text-amber-400">{hud.score}</span>
          </div>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              advanceLevel();
            }}
            className="w-full max-w-xs min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-black text-sm tracking-wider uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Next Orchard
          </button>
        </div>
      )}

      {/* Game Over Modal */}
      {hud.gameOver && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn overflow-y-auto max-h-full"
        >
          <div className="text-5xl mb-2 animate-bounce">🍇💥</div>
          <h2 className="text-2xl font-black text-rose-400 tracking-wide uppercase mb-1">Branch Collapsed!</h2>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            Fruit bubbles crossed the danger line into the orchard floor.
          </p>

          <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 w-full max-w-xs mb-5">
            <span className="block text-[10px] text-slate-400 uppercase font-bold">Final Score</span>
            <span className="text-2xl font-black text-amber-400">{hud.score}</span>
          </div>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              restartGame();
            }}
            className="w-full max-w-xs min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-sm tracking-wider uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// PURE CANVAS 2D DRAWING UTILITIES
// ==========================================

function drawFruitBubble(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: FruitType,
  scale: number = 1.0
) {
  const def = FRUIT_DEFS[type];
  const r = BUBBLE_RADIUS * scale;

  ctx.save();
  ctx.translate(x, y);

  // Outer glossy sphere
  const grad = ctx.createRadialGradient(-r * 0.35, -r * 0.35, r * 0.1, 0, 0, r);
  grad.addColorStop(0, def.highlightColor);
  grad.addColorStop(0.5, def.color);
  grad.addColorStop(1, def.borderColor);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = def.borderColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Specular glossy reflection arc
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.beginPath();
  ctx.ellipse(-r * 0.3, -r * 0.3, r * 0.35, r * 0.2, -0.6, 0, Math.PI * 2);
  ctx.fill();

  // Fruit Emoji Icon in center
  ctx.font = `${Math.round(20 * scale)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(def.emoji, 0, 1);

  ctx.restore();
}

function drawSlingshot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  current: FruitType,
  next: FruitType
) {
  ctx.save();
  ctx.translate(x, y);

  // Slingshot wooden fork
  ctx.fillStyle = '#78350f'; // amber-900
  ctx.fillRect(-6, 0, 12, 38);

  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.lineTo(-6, 12);
  ctx.lineTo(6, 12);
  ctx.lineTo(18, -14);
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#92400e';
  ctx.stroke();

  // Elastic sling band
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-18, -14);
  ctx.lineTo(0, -2);
  ctx.lineTo(18, -14);
  ctx.stroke();

  // Ready current bubble
  drawFruitBubble(ctx, 0, -4, current, 1.05);

  // Next Bubble wooden nest (bottom right)
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.roundRect(46, -10, 48, 48, 12);
  ctx.fill();

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('NEXT', 70, 0);
  drawFruitBubble(ctx, 70, 18, next, 0.65);

  ctx.restore();
}

function drawDescentMeter(ctx: CanvasRenderingContext2D, x: number, y: number, shotsUntilDescent: number) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(-16, -16, 78, 32, 8);
  ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.font = 'bold 8px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('DESCENT', -8, -5);

  // Red / Green dots for shots remaining
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < shotsUntilDescent ? '#22c55e' : '#ef4444';
    ctx.beginPath();
    ctx.arc(-8 + i * 11, 6, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawHarvestBaskets(ctx: CanvasRenderingContext2D) {
  // 3 woven baskets at bottom to catch orphan falling fruit
  const basketXs = [70, 200, 330];
  basketXs.forEach((bx) => {
    ctx.save();
    ctx.translate(bx, BOARD_HEIGHT - 12);

    ctx.fillStyle = '#b45309'; // amber-700
    ctx.beginPath();
    ctx.roundRect(-24, -14, 48, 18, 4);
    ctx.fill();

    // Woven lines
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-24, -14, 48, 18);

    ctx.restore();
  });
}

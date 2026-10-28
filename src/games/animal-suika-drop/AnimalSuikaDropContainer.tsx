import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialState,
  updatePhysics,
  dropBall,
  ANIMAL_TIERS,
  BOX_LEFT,
  BOX_RIGHT,
  BOX_BOTTOM,
  DANGER_Y,
} from './logic/engine';
import { SuikaState } from './logic/types';
import { suikaSound } from './systems/sound';
import { analytics } from '../../lib/analytics';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

interface FloatingScore {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  life: number;
}

const STORAGE_KEY = 'pawcade_suika_high_score';

export const AnimalSuikaDropContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [nextTier, setNextTier] = useState(0);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasWatermelon, setHasWatermelon] = useState(false);

  // Engine state ref to avoid React re-render churn during 60 FPS loop
  const stateRef = useRef<SuikaState | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const canDropRef = useRef<boolean>(true);
  const dropCooldownTimerRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const floatingScoresRef = useRef<FloatingScore[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameRef = useRef<number>(0);
  const warningBeepCooldownRef = useRef<number>(0);

  // Load high score
  useEffect(() => {
    let saved = 0;
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) saved = parseInt(v, 10) || 0;
    } catch {
      // LocalStorage fallback
    }
    setHighScore(saved);
    const initial = createInitialState(saved);
    stateRef.current = initial;
    setNextTier(initial.nextDropTier);

    analytics.gameStarted('animal-suika-drop');

    // Keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      suikaSound.setMuted(next);
      return next;
    });
  }, []);

  const handleRestart = useCallback(() => {
    let currentHigh = highScore;
    if (stateRef.current && stateRef.current.highScore > currentHigh) {
      currentHigh = stateRef.current.highScore;
    }
    const fresh = createInitialState(currentHigh);
    stateRef.current = fresh;
    particlesRef.current = [];
    floatingScoresRef.current = [];
    canDropRef.current = true;
    dropCooldownTimerRef.current = 0;
    setScore(0);
    setHighScore(currentHigh);
    setNextTier(fresh.nextDropTier);
    setIsGameOver(false);
    setHasWatermelon(false);

    analytics.track('game_restarted', { gameId: 'animal-suika-drop' });
  }, [highScore]);

  // Spawn visual celebration particles on merge
  const spawnMergeVFX = (x: number, y: number, newTier: number) => {
    const tierCfg = ANIMAL_TIERS[newTier] || ANIMAL_TIERS[0]!;
    // Confetti particles
    for (let i = 0; i < 14; i++) {
      const angle = (Math.PI * 2 * i) / 14 + (Math.random() - 0.5) * 0.4;
      const speed = 60 + Math.random() * 120;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        radius: 3 + Math.random() * 3.5,
        color: i % 2 === 0 ? tierCfg.color : '#fde047',
        alpha: 1,
        life: 0,
        maxLife: 0.45 + Math.random() * 0.25,
      });
    }

    // Floating text popup
    floatingScoresRef.current.push({
      x,
      y: y - 10,
      text: `+${tierCfg.score}`,
      color: tierCfg.borderColor,
      alpha: 1,
      life: 0,
    });
  };

  // Convert client pointer coordinates to internal canvas coordinates (400x600 virtual)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 200, y: 50 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 600 / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isGameOver) return;
    isDraggingRef.current = true;
    const { x } = getCanvasCoords(e.clientX, e.clientY);
    if (stateRef.current) {
      const curTierCfg = ANIMAL_TIERS[stateRef.current.currentDropTier]!;
      stateRef.current.dropX = Math.max(
        BOX_LEFT + curTierCfg.radius,
        Math.min(BOX_RIGHT - curTierCfg.radius, x)
      );
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || isGameOver || !stateRef.current) return;
    const { x } = getCanvasCoords(e.clientX, e.clientY);
    const curTierCfg = ANIMAL_TIERS[stateRef.current.currentDropTier]!;
    stateRef.current.dropX = Math.max(
      BOX_LEFT + curTierCfg.radius,
      Math.min(BOX_RIGHT - curTierCfg.radius, x)
    );
  };

  const handlePointerUp = () => {
    if (!isDraggingRef.current || isGameOver || !stateRef.current) return;
    isDraggingRef.current = false;

    if (!canDropRef.current || dropCooldownTimerRef.current > 0) return;

    // Drop active animal
    const dropped = dropBall(stateRef.current);
    if (dropped) {
      suikaSound.playDrop();
      canDropRef.current = false;
      dropCooldownTimerRef.current = 0.45; // 450ms cooldown before next drop
      setNextTier(stateRef.current.nextDropTier);
    }
  };

  // Main 60 FPS Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTimeRef.current) / 1000);
      lastTimeRef.current = time;

      const state = stateRef.current;
      if (state) {
        // Cooldown timer
        if (dropCooldownTimerRef.current > 0) {
          dropCooldownTimerRef.current -= dt;
          if (dropCooldownTimerRef.current <= 0) {
            canDropRef.current = true;
          }
        }

        // Warning sound trigger
        if (state.overflowTimer > 0.8 && !state.gameOver) {
          warningBeepCooldownRef.current -= dt;
          if (warningBeepCooldownRef.current <= 0) {
            suikaSound.playWarning();
            warningBeepCooldownRef.current = 0.45;
          }
        }

        // Physics step
        const { merges, bounced } = updatePhysics(state, dt);

        if (bounced) {
          suikaSound.playBounce(0.6);
        }

        if (merges.length > 0) {
          for (const m of merges) {
            suikaSound.playMerge(m.newTier);
            spawnMergeVFX(m.x, m.y, m.newTier);
            if (m.newTier === 9) {
              setHasWatermelon(true);
              suikaSound.playMegaFanfare();
            }
          }
          setScore(state.score);
          setHighScore(state.highScore);
          try {
            localStorage.setItem(STORAGE_KEY, state.highScore.toString());
          } catch {
            // LocalStorage ignore
          }
        }

        if (state.gameOver && !isGameOver) {
          setIsGameOver(true);
          suikaSound.playGameOver();
          analytics.track('game_over', {
            gameId: 'animal-suika-drop',
            score: state.score,
            levelId: 1,
          });
        }
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]!;
        p.life += dt;
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt; // gravity on particles
        p.alpha = 1 - p.life / p.maxLife;
      }

      // Update floating scores
      for (let i = floatingScoresRef.current.length - 1; i >= 0; i--) {
        const fs = floatingScoresRef.current[i]!;
        fs.life += dt;
        if (fs.life >= 0.75) {
          floatingScoresRef.current.splice(i, 1);
          continue;
        }
        fs.y -= 38 * dt;
        fs.alpha = 1 - fs.life / 0.75;
      }

      // Render Frame
      render(ctx, state);

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [isGameOver]);

  // Render function
  const render = (ctx: CanvasRenderingContext2D, state: SuikaState | null) => {
    // Canvas background
    ctx.clearRect(0, 0, 400, 600);

    // Warm rustic barn background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 600);
    bgGrad.addColorStop(0, '#1e1b4b');
    bgGrad.addColorStop(0.4, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 400, 600);

    // Subtle background wood floor planks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 40; x < 400; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 600);
      ctx.stroke();
    }

    // Glass Playfield Container
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.fillRect(BOX_LEFT, 70, BOX_RIGHT - BOX_LEFT, BOX_BOTTOM - 70);

    // Danger Overflow Warning Line
    const isDangerActive = state && state.overflowTimer > 0;
    ctx.save();
    ctx.lineWidth = isDangerActive ? 3.5 : 2;
    ctx.setLineDash([8, 6]);
    ctx.strokeStyle = isDangerActive
      ? `rgba(244, 63, 94, ${0.5 + Math.sin(Date.now() / 120) * 0.45})`
      : 'rgba(244, 63, 94, 0.45)';
    ctx.beginPath();
    ctx.moveTo(BOX_LEFT, DANGER_Y);
    ctx.lineTo(BOX_RIGHT, DANGER_Y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // Danger timer badge if ticking
    if (state && state.overflowTimer > 0 && !state.gameOver) {
      const remaining = Math.max(0, 2.0 - state.overflowTimer).toFixed(1);
      ctx.fillStyle = '#f43f5e';
      ctx.font = 'bold 12px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ DANGER: ${remaining}s`, 200, DANGER_Y - 8);
    }

    // Container Walls (Wood frame)
    ctx.fillStyle = '#b45309';
    // Left Wall
    ctx.fillRect(BOX_LEFT - 10, 65, 10, BOX_BOTTOM - 65 + 10);
    // Right Wall
    ctx.fillRect(BOX_RIGHT, 65, 10, BOX_BOTTOM - 65 + 10);
    // Floor
    ctx.fillRect(BOX_LEFT - 10, BOX_BOTTOM, BOX_RIGHT - BOX_LEFT + 20, 12);

    // Wall Highlights
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(BOX_LEFT - 10, 65, 2, BOX_BOTTOM - 65 + 10);
    ctx.fillRect(BOX_RIGHT + 8, 65, 2, BOX_BOTTOM - 65 + 10);
    ctx.fillRect(BOX_LEFT - 10, BOX_BOTTOM, BOX_RIGHT - BOX_LEFT + 20, 2);

    // Render Dropped Balls
    if (state) {
      for (const b of state.balls) {
        renderAnimalBall(ctx, b.x, b.y, b.radius, b.tier);
      }

      // Render Aiming Ball at Top (if can drop and not game over)
      if (canDropRef.current && !state.gameOver) {
        const curTierCfg = ANIMAL_TIERS[state.currentDropTier]!;
        const dropY = 46;

        // Dotted trajectory line down to floor
        ctx.save();
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(state.dropX, dropY + curTierCfg.radius);
        ctx.lineTo(state.dropX, BOX_BOTTOM);
        ctx.stroke();
        ctx.restore();

        // Dropper ball
        renderAnimalBall(ctx, state.dropX, dropY, curTierCfg.radius, state.currentDropTier, true);
      }
    }

    // Render Burst Particles
    for (const p of particlesRef.current) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Floating Score Popups
    for (const fs of floatingScoresRef.current) {
      ctx.save();
      ctx.globalAlpha = fs.alpha;
      ctx.fillStyle = fs.color;
      ctx.font = 'bold 18px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(fs.text, fs.x, fs.y);
      ctx.restore();
    }
  };

  // Helper to render cute animal balls with face features & specular sheen
  const renderAnimalBall = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    tier: number,
    isDropper: boolean = false
  ) => {
    const cfg = ANIMAL_TIERS[tier] || ANIMAL_TIERS[0]!;

    ctx.save();

    // Subtle drop shadow
    if (!isDropper) {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 4;
    }

    // Body Circle
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = cfg.color;
    ctx.fill();

    // Body Outline
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = Math.max(2, radius * 0.07);
    ctx.strokeStyle = cfg.borderColor;
    ctx.stroke();

    // Special Watermelon stripes for Tier 9 (Watermelon Elephant)
    if (tier === 9) {
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = '#14532d';
      ctx.lineWidth = radius * 0.16;
      ctx.beginPath();
      ctx.arc(x - radius * 0.45, y, radius * 0.85, -0.6 * Math.PI, 0.6 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + radius * 0.45, y, radius * 0.85, 0.4 * Math.PI, 1.6 * Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Animal Face / Emoji
    ctx.font = `${Math.floor(radius * 1.05)}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(cfg.emoji, x, y + radius * 0.06);

    // Specular Highlight (Glossy sheen arc on top-left)
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.82, 1.15 * Math.PI, 1.6 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = Math.max(1.5, radius * 0.08);
    ctx.stroke();

    ctx.restore();
  };

  const nextTierCfg = ANIMAL_TIERS[nextTier] || ANIMAL_TIERS[0]!;

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-center w-full max-w-[440px] mx-auto select-none touch-none py-2 px-1 text-slate-100"
      style={{ touchAction: 'none' }}
    >
      {/* Top HUD Card */}
      <div className="w-full flex items-center justify-between bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-2xl px-3.5 py-2 mb-2 shadow-lg">
        {/* Score & High Score */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Score</span>
            <span className="text-xl font-extrabold text-white leading-tight">{score}</span>
          </div>
          <div className="h-7 w-[1px] bg-slate-700/70" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best</span>
            <span className="text-sm font-bold text-slate-300 leading-tight">{highScore}</span>
          </div>
        </div>

        {/* Next Animal Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/70 rounded-xl px-2.5 py-1">
          <span className="text-[10px] font-semibold text-slate-400 uppercase">Next</span>
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center border text-sm shadow-inner"
            style={{ backgroundColor: nextTierCfg.color, borderColor: nextTierCfg.borderColor }}
            title={nextTierCfg.name}
          >
            {nextTierCfg.emoji}
          </div>
        </div>

        {/* Action Controls (Mute & Restart, >= 44x44px touch targets) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-200 active:scale-95 transition-all text-base border border-slate-600/50"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestart}
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 active:scale-95 transition-all text-base border border-amber-500/40"
            title="Restart Game (R)"
            aria-label="Restart Game"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Game Canvas with Pointer Events */}
      <div className="relative w-full aspect-[400/600] rounded-2xl overflow-hidden shadow-2xl border-2 border-slate-700/60 bg-slate-900">
        <canvas
          ref={canvasRef}
          width={400}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full cursor-pointer touch-none block"
          style={{ touchAction: 'none' }}
        />

        {/* Watermelon Elephant Unlock Toast */}
        {hasWatermelon && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-slate-950 px-4 py-1.5 rounded-full font-black text-xs uppercase tracking-wider shadow-lg animate-bounce pointer-events-none">
            🍉 Mega Watermelon Discovered! 🐘
          </div>
        )}

        {/* Game Over Modal Overlay */}
        {isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center animate-fade-in z-20">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-500/50 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🧺
            </div>
            <h2 className="text-2xl font-black text-white mb-1">Basket Full!</h2>
            <p className="text-xs text-slate-300 max-w-[240px] mb-4">
              Animals overflowed the danger line. Aim your drops carefully to trigger bigger chain merges!
            </p>

            <div className="bg-slate-900/80 border border-slate-700 rounded-xl px-5 py-3 mb-5 w-full max-w-[220px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                Final Score
              </span>
              <span className="text-3xl font-extrabold text-amber-400">{score}</span>
              {score >= highScore && score > 0 && (
                <span className="block text-[11px] font-black text-emerald-400 mt-1">🎉 New Best Score!</span>
              )}
            </div>

            <button
              onClick={handleRestart}
              className="w-full max-w-[220px] h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-300/40"
            >
              <span>Play Again</span>
              <span>🎮</span>
            </button>
          </div>
        )}
      </div>

      {/* Animal Evolution Progression Bar */}
      <div className="w-full mt-2 bg-slate-800/80 border border-slate-700/70 rounded-xl px-3 py-2 flex items-center justify-between text-xs overflow-x-auto">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-2">
          Evolution:
        </span>
        <div className="flex items-center gap-1.5 shrink-0 text-sm">
          {ANIMAL_TIERS.map((tier, idx) => (
            <React.Fragment key={tier.tier}>
              <span
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs border"
                style={{ backgroundColor: tier.color, borderColor: tier.borderColor }}
                title={`${tier.name} (+${tier.score} pts)`}
              >
                {tier.emoji}
              </span>
              {idx < ANIMAL_TIERS.length - 1 && <span className="text-[10px] text-slate-500 font-bold">›</span>}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

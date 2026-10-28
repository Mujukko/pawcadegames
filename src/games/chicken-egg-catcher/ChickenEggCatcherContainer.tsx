import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialCatcherState,
  setBasketTargetX,
  moveBasketDirection,
  stepEggCatcherEngine,
  GAME_WIDTH,
  GAME_HEIGHT,
  FLOOR_Y,
} from './logic/engine';
import { ChickenEggCatcherState } from './logic/types';
import { catcherAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Trophy, Heart, ArrowLeft, ArrowRight, Flame, Zap } from 'lucide-react';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  opacity: number;
  scale: number;
}

interface Particle {
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

export const ChickenEggCatcherContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Engine state kept in ref for high-frequency 60 FPS loop
  const stateRef = useRef<ChickenEggCatcherState>(createInitialCatcherState());

  // Reactive HUD state (synced on event / score changes)
  const [hudState, setHudState] = useState({
    score: 0,
    highScore: 0,
    lives: 3,
    maxLives: 3,
    combo: 0,
    feverTime: 0,
    wave: 1,
    eggsCaught: 0,
    status: 'playing' as ChickenEggCatcherState['status'],
    isMuted: catcherAudio.getMuted(),
  });

  // Visual effects
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextFloatIdRef = useRef<number>(1);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 140;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        size: 2.5 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.35,
      });
    }
  }, []);

  const spawnFloatingText = useCallback((text: string, x: number, y: number, color = '#fde047') => {
    floatingTextsRef.current.push({
      id: nextFloatIdRef.current++,
      text,
      x,
      y,
      color,
      opacity: 1,
      scale: 1.2,
    });
  }, []);

  const syncHud = useCallback(() => {
    const s = stateRef.current;
    setHudState({
      score: s.score,
      highScore: s.highScore,
      lives: s.lives,
      maxLives: s.maxLives,
      combo: s.combo,
      feverTime: s.feverTime,
      wave: s.wave,
      eggsCaught: s.eggsCaught,
      status: s.status,
      isMuted: catcherAudio.getMuted(),
    });
  }, []);

  // Keyboard controls listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', ' ', 'a', 'd', 'A', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      if (key === 'arrowleft' || key === 'a') {
        stateRef.current = moveBasketDirection(stateRef.current, 'left', 60);
      } else if (key === 'arrowright' || key === 'd') {
        stateRef.current = moveBasketDirection(stateRef.current, 'right', 60);
      } else if (key === 'r') {
        stateRef.current = createInitialCatcherState(stateRef.current.highScore);
        syncHud();
      } else if (key === 'm') {
        const muted = catcherAudio.toggleMute();
        setHudState((h) => ({ ...h, isMuted: muted }));
      } else if (key === ' ' || key === 'enter') {
        if (stateRef.current.status === 'game_over') {
          stateRef.current = createInitialCatcherState(stateRef.current.highScore);
          syncHud();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [syncHud]);

  // Touch pointer tracking on canvas for continuous, instant basket follow
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = ((e.clientX - rect.left) / rect.width) * GAME_WIDTH;
    stateRef.current = setBasketTargetX(stateRef.current, touchX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!e.buttons) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touchX = ((e.clientX - rect.left) / rect.width) * GAME_WIDTH;
    stateRef.current = setBasketTargetX(stateRef.current, touchX);
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let lastTime = performance.now();

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      // Update engine physics & collisions
      const { state: updated, events } = stepEggCatcherEngine(stateRef.current, dt);
      stateRef.current = updated;

      // Process audio & visual events
      events.forEach((ev) => {
        if (ev.type === 'egg_caught') {
          if (ev.eggType === 'golden') {
            catcherAudio.playGoldenEgg();
            spawnParticles(updated.basket.x, updated.basket.y - 10, '#facc15', 24);
            spawnFloatingText(`+${ev.points} 🌟 GOLDEN!`, updated.basket.x, updated.basket.y - 20, '#fde047');
          } else {
            catcherAudio.playEggCatch(ev.combo);
            const color = ev.eggType === 'speckled' ? '#fed7aa' : '#ffffff';
            spawnParticles(updated.basket.x, updated.basket.y - 8, color, 10);
            const comboText = ev.combo > 1 ? ` (x${ev.combo})` : '';
            spawnFloatingText(`+${ev.points}${comboText}`, updated.basket.x, updated.basket.y - 16, '#fef08a');
          }
        } else if (ev.type === 'egg_splat') {
          catcherAudio.playSplat();
          if (ev.eggType === 'rotten') {
            spawnParticles(updated.basket.x, updated.basket.y, '#84cc16', 20);
            spawnFloatingText('ROTTEN EGG! -1 ❤️', updated.basket.x, updated.basket.y - 20, '#ef4444');
          } else {
            spawnParticles(updated.basket.x, FLOOR_Y, '#facc15', 18);
            spawnFloatingText('CRACK! -1 ❤️', updated.basket.x, FLOOR_Y - 20, '#f87171');
          }
        } else if (ev.type === 'fever_start') {
          spawnFloatingText('FEVER TIME! 2X POINTS ⚡', GAME_WIDTH / 2, 220, '#fde047');
        } else if (ev.type === 'game_over') {
          catcherAudio.playGameOver();
        }
      });

      if (events.length > 0) {
        syncHud();
      }

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.life += dt;
        if (p.life >= p.maxLife) {
          particlesRef.current.splice(i, 1);
          continue;
        }
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt; // gravity
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      }

      // Update floating texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 30 * dt;
        ft.opacity -= 1.2 * dt;
        ft.scale = Math.max(1, ft.scale - 0.5 * dt);
        if (ft.opacity <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // CANVAS DRAWING (400 x 520)
      const w = GAME_WIDTH;
      const h = GAME_HEIGHT;

      // 1. Background Barn Interior
      const isFever = updated.feverTime > 0;
      ctx.fillStyle = isFever ? '#3a1a05' : '#291406';
      ctx.fillRect(0, 0, w, h);

      // Wooden Plank Floor Lines
      ctx.strokeStyle = '#1d0c03';
      ctx.lineWidth = 1.5;
      for (let y = 0; y < h; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      // Golden Fever border aura if active
      if (isFever) {
        const auraAlpha = 0.25 + Math.sin(now * 0.01) * 0.15;
        ctx.strokeStyle = `rgba(250, 204, 21, ${auraAlpha})`;
        ctx.lineWidth = 8;
        ctx.strokeRect(4, 4, w - 8, h - 8);
      }

      // 2. Upper Hen Roost Wooden Beam & Nests
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(10, 60, w - 20, 20);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(10, 60, w - 20, 3);

      // Draw Perches & Hens
      updated.perches.forEach((p, idx) => {
        // Straw nest
        ctx.fillStyle = '#ca8a04';
        ctx.beginPath();
        ctx.ellipse(p.x, p.y + 10, 28, 10, 0, 0, Math.PI * 2);
        ctx.fill();

        // Hen body
        const bob = p.isClucking ? Math.sin(now * 0.03) * 3 : Math.sin(now * 0.004 + idx) * 1.5;
        const henY = p.y - 12 + bob;

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(p.x, henY, 18, 15, 0, 0, Math.PI * 2);
        ctx.fill();

        // Red Comb
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(p.x, henY - 14, 5, 0, Math.PI * 2);
        ctx.arc(p.x + 4, henY - 16, 4, 0, Math.PI * 2);
        ctx.fill();

        // Yellow Beak
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.moveTo(p.x - 3, henY - 2);
        ctx.lineTo(p.x + 3, henY - 2);
        ctx.lineTo(p.x, henY + 4);
        ctx.closePath();
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(p.x - 5, henY - 6, 2, 0, Math.PI * 2);
        ctx.arc(p.x + 5, henY - 6, 2, 0, Math.PI * 2);
        ctx.fill();

        // Clucking "Bawk!" bubble
        if (p.isClucking) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.beginPath();
          ctx.roundRect(p.x - 20, henY - 32, 40, 16, 6);
          ctx.fill();
          ctx.fillStyle = '#991b1b';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('BAWK!', p.x, henY - 24);
        }
      });

      // 3. Draw Floor Baseline
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, FLOOR_Y, w, h - FLOOR_Y);
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, FLOOR_Y);
      ctx.lineTo(w, FLOOR_Y);
      ctx.stroke();

      // Straw chaff on floor
      ctx.fillStyle = '#ca8a04';
      for (let x = 16; x < w; x += 48) {
        ctx.fillRect(x, FLOOR_Y + 4, 12, 3);
        ctx.fillRect(x + 20, FLOOR_Y + 12, 8, 3);
      }

      // 4. Draw Falling Eggs
      updated.fallingEggs.forEach((egg) => {
        ctx.save();
        ctx.translate(egg.x, egg.y);
        ctx.rotate(Math.sin(egg.wobble) * 0.15);

        // Soft Shadow
        const distToFloor = FLOOR_Y - egg.y;
        const shadowAlpha = Math.max(0.1, 0.4 - distToFloor / 800);
        ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
        ctx.beginPath();
        ctx.ellipse(0, distToFloor + 4, egg.radius * 0.8, egg.radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        if (egg.type === 'golden') {
          // Golden Star Egg with Glow
          const aura = ctx.createRadialGradient(0, 0, 2, 0, 0, egg.radius * 1.8);
          aura.addColorStop(0, 'rgba(253, 224, 71, 0.8)');
          aura.addColorStop(1, 'rgba(234, 179, 8, 0)');
          ctx.fillStyle = aura;
          ctx.beginPath();
          ctx.arc(0, 0, egg.radius * 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#eab308';
          ctx.strokeStyle = '#a16207';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, egg.radius * 0.85, egg.radius * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Star badge
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⭐', 0, 0);
        } else if (egg.type === 'rotten') {
          // Rotten Green Cracked Egg
          ctx.fillStyle = '#65a30d';
          ctx.strokeStyle = '#3f6212';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, egg.radius * 0.85, egg.radius * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Cracked jagged line
          ctx.strokeStyle = '#14532d';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(-4, -6);
          ctx.lineTo(2, 0);
          ctx.lineTo(-2, 6);
          ctx.stroke();

          // Green skull / stink icon
          ctx.fillStyle = '#d9f99d';
          ctx.font = 'bold 8px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('☠️', 0, 0);
        } else if (egg.type === 'speckled') {
          // Speckled Brown Egg
          ctx.fillStyle = '#fed7aa';
          ctx.strokeStyle = '#c2410c';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, egg.radius * 0.85, egg.radius * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Speckles
          ctx.fillStyle = '#9a3412';
          ctx.beginPath();
          ctx.arc(-3, -2, 1.2, 0, Math.PI * 2);
          ctx.arc(2, 3, 1.2, 0, Math.PI * 2);
          ctx.arc(-2, 5, 1, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Regular White Egg
          ctx.fillStyle = '#f8fafc';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.ellipse(0, 0, egg.radius * 0.85, egg.radius * 1.15, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Gloss highlight
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.ellipse(-3, -3, 2, 4, -0.4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      });

      // 5. Draw Basket on Wheels (The Catcher)
      const basket = updated.basket;
      const bx = basket.x;
      const by = basket.y;
      const bw = basket.width;
      const bh = basket.height;

      // Basket Floor Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.ellipse(bx, FLOOR_Y + 2, bw * 0.65, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Wheels
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(bx - bw * 0.35, by + bh * 0.4, 7, 0, Math.PI * 2);
      ctx.arc(bx + bw * 0.35, by + bh * 0.4, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Woven Basket Body
      ctx.fillStyle = '#ca8a04';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(bx - bw / 2, by - bh / 2);
      ctx.lineTo(bx + bw / 2, by - bh / 2);
      ctx.lineTo(bx + bw * 0.4, by + bh / 2);
      ctx.lineTo(bx - bw * 0.4, by + bh / 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Basket Rim
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx - bw / 2 - 2, by - bh / 2 - 3, bw + 4, 8, 4);
      ctx.fill();
      ctx.stroke();

      // Fluffy Straw Cushion
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(bx, by - bh / 2, bw * 0.4, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Red Bow on Basket
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(bx, by + 2, 4, 0, Math.PI * 2);
      ctx.fill();

      // 6. Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 7. Draw Floating Texts
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.font = `900 ${Math.floor(16 * ft.scale)}px sans-serif`;
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.opacity;
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [spawnFloatingText, spawnParticles, syncHud]);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full max-w-[420px] mx-auto select-none touch-none"
    >
      {/* TOP HEADER HUD */}
      <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 mb-2 border border-amber-500/30 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 shadow-lg">
        {/* Lives & Wave */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 text-rose-500">
            {Array.from({ length: hudState.maxLives }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < hudState.lives ? 'fill-rose-500 text-rose-500' : 'text-slate-600 fill-slate-800'
                }`}
              />
            ))}
          </div>

          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase">
            Wave {hudState.wave}
          </span>
        </div>

        {/* Combo & Fever Status */}
        <div className="flex items-center gap-1.5">
          {hudState.feverTime > 0 ? (
            <span className="text-[11px] font-black text-amber-300 bg-amber-950/80 border border-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-amber-300" />
              <span>2X FEVER {hudState.feverTime.toFixed(1)}s</span>
            </span>
          ) : hudState.combo > 1 ? (
            <span className="text-[11px] font-black text-orange-400 bg-orange-950/60 border border-orange-500/40 px-2 py-0.5 rounded-md flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 fill-orange-400" />
              <span>x{hudState.combo} COMBO</span>
            </span>
          ) : null}
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-yellow-300 font-black">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>{hudState.score}</span>
          </div>

          <button
            onClick={() => {
              const muted = catcherAudio.toggleMute();
              setHudState((h) => ({ ...h, isMuted: muted }));
            }}
            aria-label="Toggle Audio"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => {
              stateRef.current = createInitialCatcherState(stateRef.current.highScore);
              syncHud();
            }}
            aria-label="Restart Game"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME CANVAS (400x520) with single-screen zero scroll & touch drag */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-amber-950/90 w-full aspect-[400/520] max-h-[520px]">
        <canvas
          ref={canvasRef}
          width={GAME_WIDTH}
          height={GAME_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain cursor-ew-resize touch-none select-none block"
        />

        {/* GAME OVER MODAL OVERLAY */}
        {hudState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <span className="text-6xl mb-2 animate-bounce">🥚💔</span>
            <h2 className="text-3xl font-black text-white tracking-tight mb-1">
              Too Many Splats!
            </h2>
            <p className="text-amber-200 text-xs font-semibold mb-4">
              All 3 lives lost on the barn floor!
            </p>

            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 w-52 mb-6 text-center shadow-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Final Score</span>
              <span className="text-3xl font-black text-amber-400">{hudState.score}</span>
              <span className="text-xs text-amber-300/80 font-bold mt-1 block">Best: {hudState.highScore}</span>
              <span className="text-[11px] text-slate-400 mt-0.5 block">Eggs Caught: {hudState.eggsCaught}</span>
            </div>

            <button
              onClick={() => {
                stateRef.current = createInitialCatcherState(stateRef.current.highScore);
                syncHud();
              }}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transform active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Catch Again</span>
            </button>
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM D-PAD / THUMB BUTTONS (>= 48x48px) */}
      <div className="w-full mt-2.5 flex items-center justify-between px-3">
        <button
          onClick={() => {
            stateRef.current = moveBasketDirection(stateRef.current, 'left', 65);
          }}
          aria-label="Slide Basket Left"
          className="flex-1 max-w-[170px] h-12 rounded-2xl bg-slate-800/90 active:bg-amber-500 border border-slate-700/80 active:border-amber-400 flex items-center justify-center gap-1.5 text-slate-200 active:text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Slide Left</span>
        </button>

        <button
          onClick={() => {
            stateRef.current = moveBasketDirection(stateRef.current, 'right', 65);
          }}
          aria-label="Slide Basket Right"
          className="flex-1 max-w-[170px] h-12 rounded-2xl bg-slate-800/90 active:bg-amber-500 border border-slate-700/80 active:border-amber-400 flex items-center justify-center gap-1.5 text-slate-200 active:text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
        >
          <span>Slide Right</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

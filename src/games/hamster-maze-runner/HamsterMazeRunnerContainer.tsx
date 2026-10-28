import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialState,
  moveHamster,
  restartStage,
  nextStage,
  updateEngine,
  CELL_SIZE,
  MAZE_OFFSET_X,
  MAZE_OFFSET_Y,
  STAGES,
} from './logic/engine';
import { HamsterMazeState } from './logic/types';
import { hamsterAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';

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

export const HamsterMazeRunnerContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Engine state kept in ref for high-frequency 60 FPS loop
  const stateRef = useRef<HamsterMazeState>(createInitialState());

  // Reactive HUD state (synced on event / score changes)
  const [hudState, setHudState] = useState({
    score: 0,
    highScore: 0,
    stage: 1,
    totalStages: STAGES.length,
    hasKey: false,
    acornsCollected: 0,
    totalAcorns: 0,
    status: 'playing' as HamsterMazeState['status'],
    isMuted: hamsterAudio.getMuted(),
  });

  // Visual effects
  const floatingTextsRef = useRef<FloatingText[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const nextFloatIdRef = useRef<number>(1);

  // Touch swipe tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const spawnParticles = useCallback((x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 120;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
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
      stage: s.currentStageIndex + 1,
      totalStages: STAGES.length,
      hasKey: s.player.hasKey,
      acornsCollected: s.player.acornsCollected,
      totalAcorns: s.player.totalAcorns,
      status: s.status,
      isMuted: hamsterAudio.getMuted(),
    });
  }, []);

  const triggerMove = useCallback((dir: 'up' | 'down' | 'left' | 'right') => {
    const prev = stateRef.current;
    if (prev.status !== 'playing') return;

    const { state: next, event } = moveHamster(prev, dir);
    stateRef.current = next;

    if (event) {
      if (event.type === 'item_collected') {
        if (event.itemType === 'acorn' || event.itemType === 'sunflower_seed') {
          hamsterAudio.playAcornCrunch();
          spawnParticles(next.player.x, next.player.y, '#facc15', 8);
          spawnFloatingText(`+${event.points}`, next.player.x, next.player.y - 12, '#fef08a');
        } else if (event.itemType === 'key') {
          hamsterAudio.playKeyChime();
          spawnParticles(next.player.x, next.player.y, '#f59e0b', 16);
          spawnFloatingText('KEY UNLOCKED! 🔑', 200, 200, '#fbbf24');
        }
      } else if (event.type === 'gate_unlocked') {
        hamsterAudio.playGateUnlock();
        spawnParticles(next.player.x, next.player.y, '#22c55e', 20);
        spawnFloatingText('GATE OPEN! 🔓', next.player.x, next.player.y - 12, '#4ade80');
      } else if (event.type === 'bump_wall') {
        hamsterAudio.playBump();
      } else if (event.type === 'stage_clear') {
        hamsterAudio.playStageClear();
        spawnParticles(200, 260, '#facc15', 30);
        spawnParticles(200, 260, '#4ade80', 30);
        spawnFloatingText('STAGE CLEAR! 🎉', 200, 220, '#4ade80');
      }
    }

    syncHud();
  }, [spawnParticles, spawnFloatingText, syncHud]);

  // Keyboard navigation listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
        e.preventDefault();
      }

      const key = e.key.toLowerCase();
      if (key === 'arrowup' || key === 'w') {
        triggerMove('up');
      } else if (key === 'arrowdown' || key === 's') {
        triggerMove('down');
      } else if (key === 'arrowleft' || key === 'a') {
        triggerMove('left');
      } else if (key === 'arrowright' || key === 'd') {
        triggerMove('right');
      } else if (key === 'r') {
        stateRef.current = restartStage(stateRef.current);
        syncHud();
      } else if (key === 'm') {
        const muted = hamsterAudio.toggleMute();
        setHudState((h) => ({ ...h, isMuted: muted }));
      } else if (key === ' ' || key === 'enter') {
        if (stateRef.current.status === 'stage_clear') {
          stateRef.current = nextStage(stateRef.current);
          syncHud();
        } else if (stateRef.current.status === 'game_over') {
          stateRef.current = createInitialState(stateRef.current.highScore, 0);
          syncHud();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerMove, syncHud]);

  // Touch Swipe Handlers for mobile zero-delay operation
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length !== 1) return;
    const t = e.touches[0];
    touchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartRef.current.x;
    const dy = t.clientY - touchStartRef.current.y;
    const dist = Math.hypot(dx, dy);

    // 14px threshold for rapid, ultra-responsive swipe gestures
    if (dist >= 14) {
      if (Math.abs(dx) > Math.abs(dy)) {
        triggerMove(dx > 0 ? 'right' : 'left');
      } else {
        triggerMove(dy > 0 ? 'down' : 'up');
      }
    }
    touchStartRef.current = null;
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

      // Update engine physics & position lerp
      const { state: updated } = updateEngine(stateRef.current, dt);
      stateRef.current = updated;

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
        p.vy += 80 * dt; // light gravity
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      }

      // Update floating texts
      for (let i = floatingTextsRef.current.length - 1; i >= 0; i--) {
        const ft = floatingTextsRef.current[i];
        ft.y -= 26 * dt;
        ft.opacity -= 1.1 * dt;
        ft.scale = Math.max(1, ft.scale - 0.4 * dt);
        if (ft.opacity <= 0) {
          floatingTextsRef.current.splice(i, 1);
        }
      }

      // CANVAS DRAWING (400 x 520)
      const w = 400;
      const h = 520;

      // Clear & Background Barn Wood
      ctx.fillStyle = '#291406';
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

      const grid = stateRef.current.grid;
      const rows = grid.length;
      const cols = grid[0].length;

      // 1. Draw Maze Grid Tiles
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = grid[r][c];
          const cx = MAZE_OFFSET_X + c * CELL_SIZE;
          const cy = MAZE_OFFSET_Y + r * CELL_SIZE;

          if (cell === 1) {
            // Wall Block
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.fillRect(cx + 2, cy + 3, CELL_SIZE, CELL_SIZE);

            ctx.fillStyle = '#854d0e';
            ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);

            ctx.fillStyle = '#b45309';
            ctx.fillRect(cx + 1, cy + 1, CELL_SIZE - 2, 3);
            ctx.fillStyle = '#713f12';
            ctx.fillRect(cx + 1, cy + CELL_SIZE - 3, CELL_SIZE - 2, 2);

            ctx.strokeStyle = '#92400e';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + 4, cy + CELL_SIZE / 2);
            ctx.lineTo(cx + CELL_SIZE - 4, cy + CELL_SIZE / 2);
            ctx.stroke();
          } else if (cell === 2) {
            // Locked Gate
            ctx.fillStyle = '#991b1b';
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx + 2, cy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 4);
            ctx.fill();
            ctx.stroke();

            ctx.font = `bold ${Math.floor(CELL_SIZE * 0.55)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🔒', cx + CELL_SIZE / 2, cy + CELL_SIZE / 2);
          } else if (cell === 3) {
            // Exit Door with Glowing Green Arch
            const glowScale = 1 + Math.sin(now * 0.006) * 0.15;
            const grad = ctx.createRadialGradient(
              cx + CELL_SIZE / 2,
              cy + CELL_SIZE / 2,
              2,
              cx + CELL_SIZE / 2,
              cy + CELL_SIZE / 2,
              CELL_SIZE * glowScale
            );
            grad.addColorStop(0, 'rgba(74, 222, 128, 0.7)');
            grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(cx - CELL_SIZE, cy - CELL_SIZE, CELL_SIZE * 3, CELL_SIZE * 3);

            ctx.fillStyle = '#15803d';
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.roundRect(cx + 2, cy + 2, CELL_SIZE - 4, CELL_SIZE - 4, 6);
            ctx.fill();
            ctx.stroke();

            ctx.font = `bold ${Math.floor(CELL_SIZE * 0.6)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🚪', cx + CELL_SIZE / 2, cy + CELL_SIZE / 2);
          } else {
            // Path Floor Tile
            ctx.fillStyle = (r + c) % 2 === 0 ? '#451a03' : '#3b1502';
            ctx.fillRect(cx, cy, CELL_SIZE, CELL_SIZE);
          }
        }
      }

      // 2. Draw Items (Golden Acorns, Keys, Sunflower Seeds)
      stateRef.current.items.forEach((it) => {
        if (it.isCollected) return;

        const ix = MAZE_OFFSET_X + it.col * CELL_SIZE + CELL_SIZE / 2;
        const iy = MAZE_OFFSET_Y + it.row * CELL_SIZE + CELL_SIZE / 2;

        if (it.type === 'acorn') {
          const bob = Math.sin(now * 0.005 + it.col + it.row) * 2;
          const acornRadius = CELL_SIZE * 0.26;

          ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
          ctx.beginPath();
          ctx.arc(ix, iy + bob, acornRadius * 1.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(ix, iy + bob + 2, acornRadius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#78350f';
          ctx.beginPath();
          ctx.arc(ix, iy + bob - acornRadius * 0.5, acornRadius * 0.9, Math.PI, 0, false);
          ctx.fill();
        } else if (it.type === 'sunflower_seed') {
          const bob = Math.sin(now * 0.006 + it.col) * 2;
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.ellipse(ix, iy + bob, CELL_SIZE * 0.22, CELL_SIZE * 0.14, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        } else if (it.type === 'key') {
          const keyScale = 1 + Math.sin(now * 0.008) * 0.12;
          const keySize = Math.floor(CELL_SIZE * 0.65 * keyScale);

          ctx.font = `bold ${keySize}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🔑', ix, iy);
        }
      });

      // 3. Draw Pip the Hamster
      const player = stateRef.current.player;
      const px = player.x;
      const py = player.y;
      const hamsterR = CELL_SIZE * 0.42;

      // Soft Shadow beneath Pip
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.beginPath();
      ctx.ellipse(px, py + hamsterR * 0.8, hamsterR * 0.9, hamsterR * 0.4, 0, 0, Math.PI * 2);
      ctx.fill();

      // Walking wobble
      const wobble = player.isMoving ? Math.sin(now * 0.02) * 0.12 : 0;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(wobble);

      if (player.dir === 'left') {
        ctx.scale(-1, 1);
      }

      // Hamster Round Fur Body
      const bodyGrad = ctx.createRadialGradient(-hamsterR * 0.2, -hamsterR * 0.2, 2, 0, 0, hamsterR);
      bodyGrad.addColorStop(0, '#fed7aa');
      bodyGrad.addColorStop(0.6, '#fb923c');
      bodyGrad.addColorStop(1, '#ea580c');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      ctx.arc(0, 0, hamsterR, 0, Math.PI * 2);
      ctx.fill();

      // Fluffy White Belly
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(0, hamsterR * 0.25, hamsterR * 0.55, hamsterR * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Chubby Cheeks
      ctx.fillStyle = '#fb923c';
      ctx.beginPath();
      ctx.arc(-hamsterR * 0.65, hamsterR * 0.1, hamsterR * 0.32, 0, Math.PI * 2);
      ctx.arc(hamsterR * 0.65, hamsterR * 0.1, hamsterR * 0.32, 0, Math.PI * 2);
      ctx.fill();

      // Pink Blush
      ctx.fillStyle = 'rgba(244, 63, 94, 0.55)';
      ctx.beginPath();
      ctx.arc(-hamsterR * 0.55, hamsterR * 0.2, hamsterR * 0.16, 0, Math.PI * 2);
      ctx.arc(hamsterR * 0.55, hamsterR * 0.2, hamsterR * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Cute Round Ears
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.arc(-hamsterR * 0.6, -hamsterR * 0.75, hamsterR * 0.3, 0, Math.PI * 2);
      ctx.arc(hamsterR * 0.6, -hamsterR * 0.75, hamsterR * 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f472b6';
      ctx.beginPath();
      ctx.arc(-hamsterR * 0.6, -hamsterR * 0.75, hamsterR * 0.18, 0, Math.PI * 2);
      ctx.arc(hamsterR * 0.6, -hamsterR * 0.75, hamsterR * 0.18, 0, Math.PI * 2);
      ctx.fill();

      // Cartoon Eyes
      ctx.fillStyle = '#18181b';
      ctx.beginPath();
      ctx.arc(-hamsterR * 0.3, -hamsterR * 0.15, hamsterR * 0.15, 0, Math.PI * 2);
      ctx.arc(hamsterR * 0.3, -hamsterR * 0.15, hamsterR * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Eye Sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-hamsterR * 0.35, -hamsterR * 0.2, hamsterR * 0.06, 0, Math.PI * 2);
      ctx.arc(hamsterR * 0.25, -hamsterR * 0.2, hamsterR * 0.06, 0, Math.PI * 2);
      ctx.fill();

      // Pink Nose
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, 0, hamsterR * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // Cute Whiskers
      ctx.strokeStyle = '#7c2d12';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-hamsterR * 0.3, hamsterR * 0.05);
      ctx.lineTo(-hamsterR * 0.9, 0);
      ctx.moveTo(-hamsterR * 0.3, hamsterR * 0.15);
      ctx.lineTo(-hamsterR * 0.9, hamsterR * 0.2);
      ctx.moveTo(hamsterR * 0.3, hamsterR * 0.05);
      ctx.lineTo(hamsterR * 0.9, 0);
      ctx.moveTo(hamsterR * 0.3, hamsterR * 0.15);
      ctx.lineTo(hamsterR * 0.9, hamsterR * 0.2);
      ctx.stroke();

      ctx.restore();

      // 4. Draw Particles
      particlesRef.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 5. Draw Floating Texts
      floatingTextsRef.current.forEach((ft) => {
        ctx.save();
        ctx.font = `900 ${Math.floor(18 * ft.scale)}px sans-serif`;
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
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full max-w-[420px] mx-auto select-none touch-none"
    >
      {/* TOP HEADER HUD */}
      <div className="w-full bg-slate-950/80 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 mb-2 border border-amber-500/30 flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 shadow-lg">
        {/* Stage Badge */}
        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-black uppercase">
            Stage {hudState.stage}/{hudState.totalStages}
          </span>
          <span className="text-amber-400 font-extrabold flex items-center gap-1">
            🌰 {hudState.acornsCollected}/{hudState.totalAcorns}
          </span>
        </div>

        {/* Key Status */}
        <div className="flex items-center gap-1">
          {hudState.hasKey ? (
            <span className="text-[11px] font-black text-amber-300 bg-amber-950/60 border border-amber-400 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse">
              🔑 KEY READY
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
              🔒 NEED KEY
            </span>
          )}
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-yellow-300 font-black">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>{hudState.score}</span>
          </div>

          <button
            onClick={() => {
              const muted = hamsterAudio.toggleMute();
              setHudState((h) => ({ ...h, isMuted: muted }));
            }}
            aria-label="Toggle Audio"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={() => {
              stateRef.current = restartStage(stateRef.current);
              syncHud();
            }}
            aria-label="Restart Stage"
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME CANVAS (400x520) with single-screen zero scroll */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-2xl bg-amber-950/90 w-full aspect-[400/520] max-h-[520px]">
        <canvas
          ref={canvasRef}
          width={400}
          height={520}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full object-contain cursor-pointer touch-none select-none block"
        />

        {/* STAGE CLEAR MODAL OVERLAY */}
        {hudState.status === 'stage_clear' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <span className="text-5xl mb-2 animate-bounce">🎉</span>
            <h2 className="text-2xl font-black text-white tracking-tight mb-1">
              Stage {hudState.stage} Cleared!
            </h2>
            <p className="text-amber-200 text-xs font-semibold mb-4">
              Pip gathered all tasty acorns & made it out!
            </p>

            <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl p-3 w-48 mb-5 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Score</span>
              <span className="text-2xl font-black text-amber-300">{hudState.score}</span>
            </div>

            <button
              onClick={() => {
                stateRef.current = nextStage(stateRef.current);
                syncHud();
              }}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transform active:scale-95 transition-all cursor-pointer"
            >
              <span>Next Stage ➔</span>
            </button>
          </div>
        )}

        {/* GRAND VICTORY MODAL OVERLAY */}
        {hudState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <span className="text-6xl mb-2 animate-bounce">🏆</span>
            <h2 className="text-3xl font-black text-amber-300 tracking-tight mb-1">
              Maze Master Pip!
            </h2>
            <p className="text-amber-100/90 text-xs font-semibold max-w-xs mb-4">
              All 4 farmyard mazes solved! Pip is full of acorns!
            </p>

            <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-4 w-52 mb-6 text-center shadow-xl">
              <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block">Final Score</span>
              <span className="text-3xl font-black text-amber-400">{hudState.score}</span>
              <span className="text-xs text-amber-300/80 font-bold mt-1 block">Best: {hudState.highScore}</span>
            </div>

            <button
              onClick={() => {
                stateRef.current = createInitialState(stateRef.current.highScore, 0);
                syncHud();
              }}
              className="w-full max-w-xs py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 transform active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>

      {/* MOBILE TACTILE D-PAD (High touch responsiveness >= 48x48px buttons) */}
      <div className="w-full mt-2.5 flex flex-col items-center justify-center">
        <div className="grid grid-cols-3 gap-1.5 w-48 sm:w-52">
          <div />
          <button
            onClick={() => triggerMove('up')}
            aria-label="Move Up"
            className="h-12 rounded-xl bg-slate-800/90 active:bg-amber-500 border border-slate-700/80 active:border-amber-400 flex items-center justify-center text-slate-200 active:text-slate-950 shadow-md transition-all active:scale-90 cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            onClick={() => triggerMove('left')}
            aria-label="Move Left"
            className="h-12 rounded-xl bg-slate-800/90 active:bg-amber-500 border border-slate-700/80 active:border-amber-400 flex items-center justify-center text-slate-200 active:text-slate-950 shadow-md transition-all active:scale-90 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => triggerMove('down')}
            aria-label="Move Down"
            className="h-12 rounded-xl bg-slate-800/90 active:bg-amber-500 border border-slate-700/80 active:border-amber-400 flex items-center justify-center text-slate-200 active:text-slate-950 shadow-md transition-all active:scale-90 cursor-pointer"
          >
            <ArrowDown className="w-5 h-5" />
          </button>

          <button
            onClick={() => triggerMove('right')}
            aria-label="Move Right"
            className="h-12 rounded-xl bg-slate-800/90 active:bg-amber-500 border border-slate-700/80 active:border-amber-400 flex items-center justify-center text-slate-200 active:text-slate-950 shadow-md transition-all active:scale-90 cursor-pointer"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

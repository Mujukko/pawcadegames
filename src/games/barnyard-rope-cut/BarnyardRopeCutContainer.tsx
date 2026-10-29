import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  cutRopesAlongLine,
  popBubble,
  ROPE_CUT_LEVELS,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  updateEngine,
} from './logic/engine';
import { BarnyardRopeCutState, RopeCutEvent } from './logic/types';
import { ropeSound } from './systems/sound';

interface SwipePoint {
  x: number;
  y: number;
  time: number;
}

interface SparkParticle {
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

export const BarnyardRopeCutContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);

  const [state, setState] = useState<BarnyardRopeCutState>(() => createInitialState(0));
  const stateRef = useRef<BarnyardRopeCutState>(state);
  stateRef.current = state;

  const [isMuted, setIsMuted] = useState(false);

  // Swipe gesture tracking
  const isPointerDown = useRef(false);
  const lastPointerPos = useRef<{ x: number; y: number } | null>(null);
  const swipeTrail = useRef<SwipePoint[]>([]);
  const particlesRef = useRef<SparkParticle[]>([]);

  // Sound event listener
  const syncSoundEvents = useCallback((events: RopeCutEvent[]) => {
    for (const ev of events) {
      switch (ev.type) {
        case 'rope_cut':
          ropeSound.playRopeSlice();
          ropeSound.playRopeSnap();
          break;
        case 'star_collect':
          ropeSound.playStarDing();
          break;
        case 'bubble_pop':
          ropeSound.playBubblePop();
          break;
        case 'trampoline_bounce':
          ropeSound.playTrampolineBounce();
          break;
        case 'piggy_fed':
          ropeSound.playPiggyChew();
          break;
        case 'thistle_hit':
          ropeSound.playThistleHit();
          break;
        case 'level_won':
          ropeSound.playWinFanfare();
          break;
      }
    }
  }, []);

  const handleStartLevel = useCallback((lvlIdx: number) => {
    setCurrentLevelIdx(lvlIdx);
    const fresh = createInitialState(lvlIdx);
    setState(fresh);
    stateRef.current = fresh;
    swipeTrail.current = [];
    particlesRef.current = [];
    lastPointerPos.current = null;
  }, []);

  // Pointer & Swipe handlers
  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isPointerDown.current = true;
    const pt = getCanvasCoords(e);
    lastPointerPos.current = pt;
    swipeTrail.current = [{ x: pt.x, y: pt.y, time: performance.now() }];

    // Check if tapping a bubble directly to pop it
    const cur = stateRef.current;
    for (const b of cur.bubbles) {
      if (!b.popped) {
        const d = Math.hypot(pt.x - b.x, pt.y - b.y);
        if (d <= b.radius + 15) {
          const next = popBubble(cur, b.id);
          setState(next);
          stateRef.current = next;
          syncSoundEvents(next.events);
          return;
        }
      }
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDown.current || !lastPointerPos.current) return;
    const pt = getCanvasCoords(e);
    const now = performance.now();

    swipeTrail.current.push({ x: pt.x, y: pt.y, time: now });

    // Spawn swipe sparks
    particlesRef.current.push({
      x: pt.x,
      y: pt.y,
      vx: (Math.random() - 0.5) * 60,
      vy: (Math.random() - 0.5) * 60,
      size: Math.random() * 3 + 2,
      color: '#38bdf8',
      alpha: 0.9,
      life: 0,
      maxLife: 0.25,
    });

    // Check rope cuts along current movement segment
    const cur = stateRef.current;
    const next = cutRopesAlongLine(cur, lastPointerPos.current, pt);
    if (next !== cur) {
      setState(next);
      stateRef.current = next;
      syncSoundEvents(next.events);
    }

    lastPointerPos.current = pt;
  };

  const onPointerUp = () => {
    isPointerDown.current = false;
    lastPointerPos.current = null;
  };

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const prevState = stateRef.current;
      const nextState = updateEngine(prevState, dt);
      stateRef.current = nextState;

      syncSoundEvents(nextState.events);

      // Clean old swipe points (>200ms)
      const now = performance.now();
      swipeTrail.current = swipeTrail.current.filter((p) => now - p.time < 180);

      // Update spark particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        return p.life < p.maxLife;
      });

      // Render to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderScene(ctx, canvas.width, canvas.height, nextState, swipeTrail.current, particlesRef.current);
        }
      }

      // Sync React state on status change or star collect
      if (
        nextState.status !== prevState.status ||
        nextState.starsCollected !== prevState.starsCollected ||
        nextState.apple.inBubble !== prevState.apple.inBubble
      ) {
        setState(nextState);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [syncSoundEvents]);

  // Render Scene
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameState: BarnyardRopeCutState,
    trail: SwipePoint[],
    particles: SparkParticle[]
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Warm Wooden Barn Wall Background
    ctx.fillStyle = '#78350f';
    ctx.fillRect(0, 0, width, height);

    // Planks shading
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    for (let y = 100; y < height; y += 100) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw Ropes
    for (const rope of gameState.ropes) {
      drawRope(ctx, rope);
    }

    // Draw Trampolines
    for (const t of gameState.trampolines) {
      drawTrampoline(ctx, t);
    }

    // Draw Thistle Hazards
    for (const th of gameState.thistles) {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🦔', th.x, th.y);
    }

    // Draw Floating Bubbles
    for (const b of gameState.bubbles) {
      if (!b.popped) {
        drawBubble(ctx, b.x, b.y, b.radius);
      }
    }

    // Draw Golden Stars
    for (const s of gameState.stars) {
      if (!s.collected) {
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', s.x, s.y);
      }
    }

    // Draw Apple (if not lost)
    if (!gameState.apple.lost) {
      drawApple(ctx, gameState.apple.x, gameState.apple.y, gameState.apple.radius);
      if (gameState.apple.inBubble) {
        drawBubble(ctx, gameState.apple.x, gameState.apple.y, gameState.apple.radius + 12);
      }
    }

    // Draw Penny Piglet Target
    drawPiggy(ctx, gameState.piggy);

    // Draw Spark Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Blade Swipe Slash Trail
    if (trail.length >= 2) {
      ctx.beginPath();
      ctx.moveTo(trail[0].x, trail[0].y);
      for (let i = 1; i < trail.length; i++) {
        ctx.lineTo(trail[i].x, trail[i].y);
      }
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.stroke();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
  };

  const drawRope = (ctx: CanvasRenderingContext2D, rope: BarnyardRopeCutState['ropes'][0]) => {
    // Draw Anchor Peg
    ctx.fillStyle = '#ca8a04';
    ctx.beginPath();
    ctx.arc(rope.anchorX, rope.anchorY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    const segs = rope.segments;
    const maxIdx = rope.cut ? (rope.cutIndex || 0) : segs.length - 1;

    // First part of rope
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(segs[0].x, segs[0].y);
    for (let i = 1; i <= maxIdx; i++) {
      ctx.lineTo(segs[i].x, segs[i].y);
    }
    ctx.stroke();

    // Rope hemp knot rings
    ctx.fillStyle = '#fbbf24';
    for (let i = 1; i <= maxIdx; i++) {
      ctx.beginPath();
      ctx.arc(segs[i].x, segs[i].y, 3, 0, Math.PI * 2);
      ctx.fill();
    }

    // If cut, draw lower falling part
    if (rope.cut && rope.cutIndex !== undefined && rope.cutIndex < segs.length - 1) {
      ctx.beginPath();
      ctx.moveTo(segs[rope.cutIndex + 1].x, segs[rope.cutIndex + 1].y);
      for (let i = rope.cutIndex + 2; i < segs.length; i++) {
        ctx.lineTo(segs[i].x, segs[i].y);
      }
      ctx.stroke();
    }
  };

  const drawApple = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    // Apple Body
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7f1d1d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Highlight
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(x - 5, y - 5, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;

    // Apple Stem & Green Leaf
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, y - r);
    ctx.lineTo(x + 3, y - r - 7);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(x + 7, y - r - 5, 5, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawBubble = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number) => {
    ctx.save();
    ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Specular shine
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawTrampoline = (ctx: CanvasRenderingContext2D, t: BarnyardRopeCutState['trampolines'][0]) => {
    ctx.save();
    ctx.translate(t.x, t.y);
    ctx.rotate(t.angle);

    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.roundRect(-t.width / 2, -t.height / 2, t.width, t.height, 5);
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Spring base coils
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-t.width / 3, t.height / 2);
    ctx.lineTo(-t.width / 3, t.height / 2 + 10);
    ctx.moveTo(t.width / 3, t.height / 2);
    ctx.lineTo(t.width / 3, t.height / 2 + 10);
    ctx.stroke();

    ctx.restore();
  };

  const drawPiggy = (ctx: CanvasRenderingContext2D, piggy: BarnyardRopeCutState['piggy']) => {
    ctx.save();
    ctx.translate(piggy.x, piggy.y);

    // Piggy Body
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.arc(0, 0, piggy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointy Ears
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-25, -20);
    ctx.lineTo(-38, -42);
    ctx.lineTo(-12, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(25, -20);
    ctx.lineTo(38, -42);
    ctx.lineTo(12, -32);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-12, -10, 5, 0, Math.PI * 2);
    ctx.arc(12, -10, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -12, 1.8, 0, Math.PI * 2);
    ctx.arc(14, -12, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(0, 2, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = '#9d174d';
    ctx.beginPath();
    ctx.arc(-4, 2, 2, 0, Math.PI * 2);
    ctx.arc(4, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Mouth (Opens when apple is close!)
    if (piggy.mouthOpen) {
      ctx.fillStyle = '#881337';
      ctx.beginPath();
      ctx.arc(0, 16, 12, 0, Math.PI);
      ctx.fill();
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(0, 20, 7, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#be185d';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 14, 8, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    ctx.restore();
  };

  return (
    <div className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none touch-none">
      {/* Top HUD Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-amber-500/30 rounded-xl mb-2 text-white shadow-lg">
        {/* Stage Name */}
        <div>
          <span className="text-[10px] uppercase font-extrabold text-amber-400 block leading-tight">Stage</span>
          <span className="font-mono text-sm sm:text-base font-black text-white">
            {state.level.name}
          </span>
        </div>

        {/* Stars Collected Indicator */}
        <div className="flex items-center gap-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-lg transition-transform ${
                i < state.starsCollected ? 'scale-110 drop-shadow-[0_0_8px_#facc15]' : 'opacity-30 grayscale'
              }`}
            >
              ⭐
            </span>
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleStartLevel(currentLevelIdx)}
            aria-label="Restart level"
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            🔄
          </button>
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              ropeSound.setMuted(next);
            }}
            aria-label="Toggle audio"
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-slate-950 aspect-[5/6] max-h-[580px]">
        <canvas
          ref={canvasRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="w-full h-full object-contain cursor-crosshair touch-none"
        />

        {/* Instruction overlay for Level 0 */}
        {state.levelIndex === 0 && state.timeSpent < 4 && state.status === 'playing' && (
          <div className="absolute top-28 inset-x-0 mx-auto w-max px-4 py-1.5 bg-slate-900/80 backdrop-blur-xs rounded-full border border-amber-400/40 text-amber-200 text-xs font-bold animate-pulse pointer-events-none">
            ✂️ Swipe across the rope to feed Penny!
          </div>
        )}

        {/* Level Won Celebration Modal */}
        {state.status === 'won' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-6xl mb-2">🎉</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              PENNY IS FULL & HAPPY!
            </h3>
            <div className="flex gap-2 my-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`text-3xl ${i < state.starsCollected ? 'animate-bounce text-yellow-300' : 'opacity-20'}`}
                >
                  ⭐
                </span>
              ))}
            </div>
            <p className="text-amber-300 font-bold text-sm">
              You collected {state.starsCollected} of 3 Stars!
            </p>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => handleStartLevel(currentLevelIdx)}
                className="px-4 py-2 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Replay Level
              </button>
              <button
                onClick={() => handleStartLevel((currentLevelIdx + 1) % ROPE_CUT_LEVELS.length)}
                className="px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
              >
                Next Puzzle 🍎
              </button>
            </div>
          </div>
        )}

        {/* Level Lost Modal */}
        {state.status === 'lost' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-5xl mb-2">😢</span>
            <h3 className="text-2xl font-black text-white">
              APPLE MISSED!
            </h3>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xs">
              Penny is still hungry. Tap below to retry this puzzle!
            </p>
            <button
              onClick={() => handleStartLevel(currentLevelIdx)}
              className="mt-5 px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
            >
              Try Again 🔄
            </button>
          </div>
        )}
      </div>

      {/* Stage Selection Pills */}
      <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
        {ROPE_CUT_LEVELS.map((lvl, idx) => (
          <button
            key={lvl.id}
            onClick={() => handleStartLevel(idx)}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              currentLevelIdx === idx
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {lvl.name}
          </button>
        ))}
      </div>
    </div>
  );
};

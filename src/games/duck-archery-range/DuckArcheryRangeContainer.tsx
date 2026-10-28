import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, ArrowRight, Trophy, Target as TargetIcon, Wind } from 'lucide-react';
import {
  DuckArcheryState,
  DuckArcheryEvent,
} from './logic/types';
import {
  createInitialState,
  startPull,
  updatePull,
  releasePull,
  updateEngine,
  calculateTrajectory,
  nextStage,
  resetStage,
  STAGE_CONFIGS,
  MAX_PULL,
  MIN_LAUNCH_SPEED,
  MAX_LAUNCH_SPEED,
} from './logic/engine';
import { duckArcheryAudio } from './systems/sound';

export const DuckArcheryRangeContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High score persisted in localStorage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_duck_archery_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<DuckArcheryState>(createInitialState(1, highScore));
  const [displayState, setDisplayState] = useState<{
    stage: number;
    score: number;
    highScore: number;
    arrowsLeft: number;
    wind: number;
    status: DuckArcheryState['status'];
    targetScore: number;
  }>({
    stage: 1,
    score: 0,
    highScore,
    arrowsLeft: 6,
    wind: 0,
    status: 'aiming',
    targetScore: 250,
  });

  const [isMuted, setIsMuted] = useState<boolean>(duckArcheryAudio.getMuted());

  const handleAudioEvents = useCallback((events: DuckArcheryEvent[]) => {
    events.forEach((ev) => {
      switch (ev.type) {
        case 'bow_release':
          duckArcheryAudio.playBowTwang();
          break;
        case 'target_hit':
          duckArcheryAudio.playTargetHit(ev.ringType);
          break;
        case 'apple_hit':
          duckArcheryAudio.playAppleSplatter();
          break;
        case 'bell_hit':
          duckArcheryAudio.playBellRing();
          break;
        case 'arrow_miss':
          duckArcheryAudio.playMiss();
          break;
        case 'stage_cleared':
        case 'victory':
          duckArcheryAudio.playStageVictory();
          break;
        case 'game_over':
          duckArcheryAudio.playGameOver();
          break;
      }
    });
  }, []);

  const syncDisplayState = useCallback(() => {
    const s = stateRef.current;
    const stageConf = STAGE_CONFIGS.find((cfg) => cfg.stage === s.stage) || STAGE_CONFIGS[0]!;

    setDisplayState({
      stage: s.stage,
      score: s.score,
      highScore: s.highScore,
      arrowsLeft: s.arrowsLeft,
      wind: s.currentWind,
      status: s.status,
      targetScore: stageConf.targetScore,
    });

    if (s.score > highScore) {
      setHighScore(s.score);
      try {
        localStorage.setItem('pawcade_duck_archery_high_score', s.score.toString());
      } catch {
        // Ignore local storage error
      }
    }
  }, [highScore]);

  // Pointer Event Handlers
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 500 / rect.width;
    const scaleY = 720 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const { x, y } = getCanvasCoords(e);
    duckArcheryAudio.playBowDraw();
    stateRef.current = startPull(stateRef.current, x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isPulling) return;
    const { x, y } = getCanvasCoords(e);
    stateRef.current = updatePull(stateRef.current, x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    const { state: nextSt, event } = releasePull(stateRef.current);
    stateRef.current = nextSt;
    if (event) {
      handleAudioEvents([event]);
    }
    syncDisplayState();
  };

  const handleNextStage = () => {
    stateRef.current = nextStage(stateRef.current);
    syncDisplayState();
  };

  const handleResetStage = () => {
    stateRef.current = resetStage(stateRef.current);
    syncDisplayState();
  };

  const handleToggleMute = () => {
    const muted = duckArcheryAudio.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard shortcut controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleResetStage();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      // Update Engine
      const { state: nextSt, events } = updateEngine(stateRef.current, dt);
      stateRef.current = nextSt;

      if (events.length > 0) {
        handleAudioEvents(events);
        syncDisplayState();
      }

      // Draw Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, stateRef.current);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [handleAudioEvents, syncDisplayState]);

  // Drawing Routine
  const drawScene = (ctx: CanvasRenderingContext2D, state: DuckArcheryState) => {
    ctx.clearRect(0, 0, 500, 720);

    // 1. Sky & Sun
    const skyGrad = ctx.createLinearGradient(0, 0, 0, 720);
    skyGrad.addColorStop(0, '#38bdf8');
    skyGrad.addColorStop(0.55, '#bae6fd');
    skyGrad.addColorStop(1, '#fde68a');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 500, 720);

    // Sun Glow
    const sunGrad = ctx.createRadialGradient(420, 90, 10, 420, 90, 120);
    sunGrad.addColorStop(0, 'rgba(254, 240, 138, 0.8)');
    sunGrad.addColorStop(1, 'rgba(251, 146, 60, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(420, 90, 120, 0, Math.PI * 2);
    ctx.fill();

    // Floating Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    drawCloud(ctx, 110, 80, 40);
    drawCloud(ctx, 280, 130, 32);

    // 2. Rolling Pasture Hills
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(0, 510);
    ctx.quadraticCurveTo(150, 470, 320, 520);
    ctx.quadraticCurveTo(420, 540, 500, 500);
    ctx.lineTo(500, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.moveTo(0, 550);
    ctx.quadraticCurveTo(180, 520, 350, 560);
    ctx.quadraticCurveTo(430, 570, 500, 540);
    ctx.lineTo(500, 720);
    ctx.lineTo(0, 720);
    ctx.closePath();
    ctx.fill();

    // Wooden Fence Rails
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 530);
    ctx.lineTo(500, 520);
    ctx.moveTo(0, 550);
    ctx.lineTo(500, 540);
    ctx.stroke();

    for (let fx = 50; fx < 500; fx += 110) {
      ctx.fillStyle = '#92400e';
      ctx.fillRect(fx - 4, 515, 8, 45);
    }

    // 3. Targets
    state.targets.forEach((tgt) => {
      drawArcheryTarget(ctx, tgt);
    });

    // 4. Apples & Bells
    state.apples.forEach((apple) => {
      if (!apple.isHit) {
        drawApple(ctx, apple.x, apple.y, apple.radius);
      }
    });

    state.bells.forEach((bell) => {
      if (!bell.isHit) {
        drawBell(ctx, bell.x, bell.y, bell.radius);
      }
    });

    // 5. Quacky the Robin Duck Archer & Bow
    drawQuackyArcher(ctx, state);

    // 6. Trajectory Arc Preview (when aiming & pulling)
    if (state.isPulling && state.pullDistance >= 14) {
      const speedFraction = state.pullDistance / MAX_PULL;
      const speed = MIN_LAUNCH_SPEED + speedFraction * (MAX_LAUNCH_SPEED - MIN_LAUNCH_SPEED);
      const vx = Math.cos(state.pullAngle) * speed;
      const vy = -Math.sin(state.pullAngle) * speed;

      const trajPoints = calculateTrajectory(state.bowX, state.bowY, vx, vy, state.currentWind, 20, 0.04);

      ctx.save();
      trajPoints.forEach((pt, idx) => {
        const radius = Math.max(1.5, 4.5 - idx * 0.18);
        ctx.fillStyle = idx % 2 === 0 ? '#fde047' : '#ffffff';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 7. Active Flying Arrow
    if (state.arrow && state.arrow.isActive) {
      drawArrow(ctx, state.arrow.x, state.arrow.y, state.arrow.angle);
    }

    // 8. Particles
    state.particles.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 9. Floating Score Badges
    state.floatingBadges.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.font = '900 15px system-ui, -apple-system, sans-serif';
      ctx.fillStyle = b.color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      ctx.strokeText(b.text, b.x, b.y);
      ctx.fillText(b.text, b.x, b.y);
      ctx.restore();
    });
  };

  // Helper Drawing Functions
  const drawCloud = (ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.arc(cx + r * 0.65, cy - r * 0.2, r * 0.7, 0, Math.PI * 2);
    ctx.arc(cx - r * 0.65, cy + r * 0.1, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawArcheryTarget = (ctx: CanvasRenderingContext2D, target: DuckArcheryState['targets'][0]) => {
    ctx.save();
    ctx.translate(target.x, target.y);

    // Tripod Stand Legs
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-20, 50);
    ctx.lineTo(0, 0);
    ctx.moveTo(20, 50);
    ctx.lineTo(0, 0);
    ctx.stroke();

    // Outer Straw Ring
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, 0, target.radius + 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Target Concentric Rings (White -> Blue -> Red -> Bullseye)
    const rings = [
      { r: 54, fill: '#f8fafc', stroke: '#cbd5e1' },
      { r: 42, fill: '#3b82f6', stroke: '#1d4ed8' },
      { r: 28, fill: '#ef4444', stroke: '#b91c1c' },
      { r: 14, fill: '#fde047', stroke: '#f59e0b' },
    ];

    rings.forEach((ring) => {
      ctx.fillStyle = ring.fill;
      ctx.strokeStyle = ring.stroke;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, ring.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Bullseye Center Star
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    // Render Stuck Arrows that move with target!
    target.stuckArrows.forEach((sa) => {
      ctx.save();
      ctx.translate(sa.offsetX, sa.offsetY);
      ctx.rotate(sa.angle);
      // Shaft
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(-35, 0);
      ctx.lineTo(0, 0);
      ctx.stroke();
      // Green Fletching
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(-35, -4);
      ctx.lineTo(-24, 0);
      ctx.lineTo(-35, 4);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });

    ctx.restore();
  };

  const drawApple = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.save();
    ctx.translate(x, y);

    // Wooden Pedestal
    ctx.fillStyle = '#78350f';
    ctx.fillRect(-6, radius - 2, 12, 45);

    // Apple Body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Apple Highlight
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(-3, -3, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();

    // Stem & Leaf
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(2, -radius - 7, 1, -radius - 8);
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(4, -radius - 5, 5, 2.5, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawBell = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.save();
    ctx.translate(x, y);

    // Hanging Rope
    ctx.strokeStyle = '#92400e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(0, -radius);
    ctx.stroke();

    // Golden Bell Body
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.quadraticCurveTo(radius, -radius * 0.2, radius, radius * 0.7);
    ctx.lineTo(-radius, radius * 0.7);
    ctx.quadraticCurveTo(-radius, -radius * 0.2, 0, -radius);
    ctx.closePath();
    ctx.fill();

    // Bell Clapper
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.arc(0, radius * 0.7, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const drawArrow = (ctx: CanvasRenderingContext2D, x: number, y: number, angle: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Wooden Shaft
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-28, 0);
    ctx.lineTo(16, 0);
    ctx.stroke();

    // Steel Arrowhead
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(22, 0);
    ctx.lineTo(14, -6);
    ctx.lineTo(16, 0);
    ctx.lineTo(14, 6);
    ctx.closePath();
    ctx.fill();

    // Green Feathers
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(-28, -5);
    ctx.lineTo(-16, 0);
    ctx.lineTo(-28, 5);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  const drawQuackyArcher = (ctx: CanvasRenderingContext2D, state: DuckArcheryState) => {
    const { bowX, bowY, isPulling, pullDistance, pullAngle } = state;

    ctx.save();
    ctx.translate(bowX - 45, bowY);

    // Body
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(-15, 20, 32, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little Tail
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.moveTo(-45, 15);
    ctx.lineTo(-58, 5);
    ctx.lineTo(-40, 25);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(10, -10, 22, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Cheek
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.beginPath();
    ctx.arc(8, -4, 5, 0, Math.PI * 2);
    ctx.fill();

    // Orange Beak
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.moveTo(26, -12);
    ctx.lineTo(44, -7);
    ctx.lineTo(26, -2);
    ctx.closePath();
    ctx.fill();

    // Eye with Determined Aim
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(20, -14, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(21.5, -16, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Green Robin Hood Hat with Red Feather
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.moveTo(-6, -22);
    ctx.lineTo(28, -20);
    ctx.lineTo(12, -38);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(2, -26);
    ctx.lineTo(-12, -44);
    ctx.lineTo(6, -30);
    ctx.closePath();
    ctx.fill();

    // Bow & String
    ctx.save();
    ctx.translate(45, 0); // At bow position
    ctx.rotate(isPulling ? pullAngle : 0);

    // Recurve Bow Stave
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -42);
    ctx.quadraticCurveTo(18, 0, 0, 42);
    ctx.stroke();

    // Bowstring
    const stringOffset = isPulling ? -Math.min(32, pullDistance * 0.35) : 0;
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(0, -40);
    ctx.lineTo(stringOffset, 0);
    ctx.lineTo(0, 40);
    ctx.stroke();

    // Ready Arrow on Bow (if not flying)
    if (state.arrowsLeft > 0 && state.status === 'aiming') {
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.moveTo(stringOffset, 0);
      ctx.lineTo(stringOffset + 38, 0);
      ctx.stroke();

      // Steel Tip
      ctx.fillStyle = '#94a3b8';
      ctx.beginPath();
      ctx.moveTo(stringOffset + 44, 0);
      ctx.lineTo(stringOffset + 36, -4);
      ctx.lineTo(stringOffset + 38, 0);
      ctx.lineTo(stringOffset + 36, 4);
      ctx.closePath();
      ctx.fill();

      // Feathers
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(stringOffset, -3.5);
      ctx.lineTo(stringOffset + 10, 0);
      ctx.lineTo(stringOffset, 3.5);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none overflow-hidden touch-none overscroll-none rounded-3xl border border-amber-500/30 shadow-2xl bg-slate-950"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* COMPACT BALANCED MOBILE HUD (320px - 430px) */}
      <div className="w-full flex items-center justify-between px-2 sm:px-3 py-1.5 sm:py-2 bg-slate-900/90 border-b border-amber-500/20 text-white z-20 shrink-0 text-xs sm:text-sm">
        {/* Left Cluster */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 font-black text-amber-400 bg-amber-950/60 px-1.5 sm:px-2 py-1 rounded-lg border border-amber-500/30 text-[11px] sm:text-xs">
            <TargetIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>STG {displayState.stage}/4</span>
          </div>
          <div className="flex items-center gap-1 font-black text-emerald-400 bg-emerald-950/60 px-1.5 sm:px-2 py-1 rounded-lg border border-emerald-500/30 text-[11px] sm:text-xs">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{displayState.score}</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-amber-300 bg-slate-800/80 px-1.5 sm:px-2 py-1 rounded-lg border border-slate-700 text-[11px] sm:text-xs">
            <span>🏹</span>
            <span>x{displayState.arrowsLeft}</span>
          </div>
        </div>

        {/* Right Cluster */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Wind Indicator */}
          <div className="flex items-center gap-1 font-black text-sky-300 bg-sky-950/60 px-1.5 sm:px-2 py-1 rounded-lg border border-sky-500/30 text-[11px] sm:text-xs">
            <Wind className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>
              {displayState.wind > 0 ? `+${displayState.wind}` : displayState.wind} m/s
            </span>
          </div>

          {/* Goal Badge */}
          <div className="hidden sm:flex items-center gap-1 text-[11px] font-bold text-slate-300 bg-slate-800/70 px-1.5 py-1 rounded-lg border border-slate-700">
            <span>GOAL:</span>
            <span className="text-amber-400 font-black">{displayState.targetScore}</span>
          </div>

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation relative after:absolute after:-inset-1.5 after:content-['']"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleResetStage}
            aria-label="Restart Stage"
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation relative after:absolute after:-inset-1.5 after:content-['']"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME CANVAS */}
      <div className="relative w-full aspect-[500/720] max-h-[calc(100vh-140px)] flex items-center justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          width={500}
          height={720}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain cursor-crosshair touch-none select-none"
        />

        {/* STAGE CLEARED OVERLAY */}
        {displayState.status === 'stage_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-400/20 animate-bounce">
                🎯
              </div>
              <h3 className="text-2xl font-black text-amber-300 tracking-tight">STAGE {displayState.stage} CLEARED!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                Awesome archery! Score: <span className="font-bold text-amber-400">{displayState.score}</span> / Target: {displayState.targetScore}
              </p>
              <button
                onClick={handleNextStage}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span>NEXT STAGE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {displayState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-emerald-400/30 animate-pulse">
                🏆
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">CHAMPION ARCHER!</h3>
              <p className="text-sm text-slate-200 mt-1 mb-2">
                You mastered all 4 ranges and hit the championship targets!
              </p>
              <div className="text-lg font-black text-amber-400 bg-amber-950/60 px-4 py-2 rounded-xl border border-amber-500/40 my-3">
                Final Score: {displayState.score}
              </div>
              <button
                onClick={handleResetStage}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>PLAY AGAIN</span>
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER OVERLAY */}
        {displayState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-3xl mb-3">
                🏹
              </div>
              <h3 className="text-2xl font-black text-rose-400 tracking-tight">OUT OF ARROWS</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                Score: <span className="font-bold text-amber-400">{displayState.score}</span> / Needed: {displayState.targetScore}
              </p>
              <button
                onClick={handleResetStage}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>TRY AGAIN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

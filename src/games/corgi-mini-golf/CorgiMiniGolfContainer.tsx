import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, ArrowRight, Trophy, Flag, Sparkles } from 'lucide-react';
import {
  CorgiMiniGolfState,
  CorgiMiniGolfEvent,
} from './logic/types';
import {
  createInitialState,
  startAim,
  updateAim,
  releaseAim,
  updateEngine,
  nextHole,
  resetHole,
  HOLE_CONFIGS,
  MAX_PUTT_DISTANCE,
} from './logic/engine';
import { corgiMiniGolfAudio } from './systems/sound';

export const CorgiMiniGolfContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_corgi_mini_golf_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<CorgiMiniGolfState>(createInitialState(0, highScore));
  const [displayState, setDisplayState] = useState<{
    holeNumber: number;
    holeName: string;
    par: number;
    strokes: number;
    totalStrokes: number;
    score: number;
    highScore: number;
    status: CorgiMiniGolfState['status'];
  }>({
    holeNumber: 1,
    holeName: HOLE_CONFIGS[0]!.name,
    par: HOLE_CONFIGS[0]!.par,
    strokes: 0,
    totalStrokes: 0,
    score: 0,
    highScore,
    status: 'aiming',
  });

  const [isMuted, setIsMuted] = useState<boolean>(corgiMiniGolfAudio.getMuted());

  const handleAudioEvents = useCallback((events: CorgiMiniGolfEvent[]) => {
    events.forEach((ev) => {
      switch (ev.type) {
        case 'putt_hit':
          corgiMiniGolfAudio.playPuttSwing();
          break;
        case 'rail_bounce':
          corgiMiniGolfAudio.playRailBounce();
          break;
        case 'bumper_bounce':
          corgiMiniGolfAudio.playBumperBoing();
          break;
        case 'bone_collect':
          corgiMiniGolfAudio.playBoneCollect();
          break;
        case 'cup_sink':
          corgiMiniGolfAudio.playCupSink();
          break;
        case 'hole_cleared':
          if (ev.strokes === 1) {
            corgiMiniGolfAudio.playHoleInOne();
          } else {
            corgiMiniGolfAudio.playHoleCleared();
          }
          break;
        case 'victory':
          corgiMiniGolfAudio.playHoleInOne();
          break;
      }
    });
  }, []);

  const syncDisplayState = useCallback(() => {
    const s = stateRef.current;
    const config = HOLE_CONFIGS[s.holeIndex] || HOLE_CONFIGS[0]!;

    setDisplayState({
      holeNumber: config.holeNumber,
      holeName: config.name,
      par: config.par,
      strokes: s.strokesInHole,
      totalStrokes: s.totalStrokes,
      score: s.score,
      highScore: s.highScore,
      status: s.status,
    });

    if (s.score > highScore) {
      setHighScore(s.score);
      try {
        localStorage.setItem('pawcade_corgi_mini_golf_high_score', s.score.toString());
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
    stateRef.current = startAim(stateRef.current, x, y);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!stateRef.current.isAiming) return;
    const { x, y } = getCanvasCoords(e);
    stateRef.current = updateAim(stateRef.current, x, y);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
    const { state: nextSt, event } = releaseAim(stateRef.current);
    stateRef.current = nextSt;
    if (event) {
      handleAudioEvents([event]);
    }
    syncDisplayState();
  };

  const handleNextHole = () => {
    stateRef.current = nextHole(stateRef.current);
    syncDisplayState();
  };

  const handleResetHole = () => {
    stateRef.current = resetHole(stateRef.current);
    syncDisplayState();
  };

  const handleToggleMute = () => {
    const muted = corgiMiniGolfAudio.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard shortcut controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleResetHole();
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
  const drawScene = (ctx: CanvasRenderingContext2D, state: CorgiMiniGolfState) => {
    ctx.clearRect(0, 0, 500, 720);
    const config = HOLE_CONFIGS[state.holeIndex] || HOLE_CONFIGS[0]!;

    // 1. Lush Green Fairway & Grass Stripes
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, 500, 720);

    // Subtle checkered mowing stripes
    ctx.fillStyle = '#16a34a';
    for (let y = 0; y < 720; y += 40) {
      if ((y / 40) % 2 === 0) {
        ctx.fillRect(0, y, 500, 40);
      }
    }

    // Putting Green Area around Cup
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(config.cup.x, config.cup.y, 85, 0, Math.PI * 2);
    ctx.fill();

    // 2. Hazards (Sand & Mud)
    config.hazards.forEach((h) => {
      ctx.save();
      if (h.type === 'sand') {
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(h.x, h.y, h.width, h.height, 16);
        ctx.fill();
        ctx.stroke();

        // Sand Stipple dots
        ctx.fillStyle = '#eab308';
        for (let sx = h.x + 8; sx < h.x + h.width - 8; sx += 14) {
          for (let sy = h.y + 8; sy < h.y + h.height - 8; sy += 14) {
            ctx.beginPath();
            ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      } else {
        // Mud Trap
        ctx.fillStyle = '#78350f';
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(h.x, h.y, h.width, h.height, 16);
        ctx.fill();
        ctx.stroke();

        // Mud Rings
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(h.x + h.width * 0.4, h.y + h.height * 0.5, 12, 0, Math.PI * 2);
        ctx.arc(h.x + h.width * 0.7, h.y + h.height * 0.4, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Round Bumpers
    config.bumpers.forEach((b) => {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Wooden Core
      ctx.fillStyle = '#d97706';
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.fill();

      // Bouncy Cyan Rubber Rim
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Golden Star Center
      ctx.fillStyle = '#fde047';
      drawStar(ctx, 0, 0, 5, b.radius * 0.55, b.radius * 0.25);
      ctx.fill();

      ctx.restore();
    });

    // 4. Wooden Wall Borders
    ctx.save();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.shadowColor = '#0f172a';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    config.walls.forEach((w) => {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    });
    ctx.restore();

    // Inner rail highlight
    ctx.save();
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    config.walls.forEach((w) => {
      ctx.beginPath();
      ctx.moveTo(w.x1, w.y1);
      ctx.lineTo(w.x2, w.y2);
      ctx.stroke();
    });
    ctx.restore();

    // 5. Bonus Bones
    state.bones.forEach((bone) => {
      if (!bone.isCollected) {
        drawBone(ctx, bone.x, bone.y, bone.radius);
      }
    });

    // 6. Putting Cup (Hole) & Flagstick
    drawCupAndFlag(ctx, config.cup.x, config.cup.y, config.cup.radius, config.holeNumber);

    // 7. Aiming Guide Line (when player is dragging to aim)
    if (state.isAiming && state.aimPower > 0) {
      drawAimGuide(ctx, state);
    }

    // 8. The Golf Ball
    drawGolfBall(ctx, state.ball);

    // 9. Sparkles
    state.sparkles.forEach((sp) => {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 10. Floating Score Badges
    state.floatingBadges.forEach((b) => {
      ctx.save();
      ctx.globalAlpha = b.alpha;
      ctx.font = '900 16px system-ui, -apple-system, sans-serif';
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
  const drawStar = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerR: number,
    innerR: number
  ) => {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerR);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerR;
      y = cy + Math.sin(rot) * outerR;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerR;
      y = cy + Math.sin(rot) * innerR;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerR);
    ctx.closePath();
  };

  const drawBone = (ctx: CanvasRenderingContext2D, x: number, y: number, radius: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#fef08a';
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 6;

    // Bone shape
    ctx.beginPath();
    ctx.arc(-10, -5, 5, 0, Math.PI * 2);
    ctx.arc(-10, 5, 5, 0, Math.PI * 2);
    ctx.arc(10, -5, 5, 0, Math.PI * 2);
    ctx.arc(10, 5, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillRect(-8, -4, 16, 8);
    ctx.restore();
  };

  const drawCupAndFlag = (ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number, holeNum: number) => {
    ctx.save();

    // Dark Cup Depth
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    // White Cup Rim
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Flagstick
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx, cy - 75);
    ctx.stroke();

    // Golden Finial
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(cx, cy - 76, 4, 0, Math.PI * 2);
    ctx.fill();

    // Red Triangular Flag
    ctx.fillStyle = '#ef4444';
    ctx.strokeStyle = '#b91c1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 74);
    ctx.lineTo(cx + 32, cy - 60);
    ctx.lineTo(cx, cy - 46);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Hole Number
    ctx.font = '900 10px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(holeNum.toString(), cx + 11, cy - 57);

    ctx.restore();
  };

  const drawAimGuide = (ctx: CanvasRenderingContext2D, state: CorgiMiniGolfState) => {
    const { ball, aimPower, aimAngle } = state;

    ctx.save();
    // Line length proportional to power
    const guideLength = Math.max(25, (aimPower / 100) * 160);
    const endX = ball.x + Math.cos(aimAngle) * guideLength;
    const endY = ball.y + Math.sin(aimAngle) * guideLength;

    // Color gradient based on power (Green -> Amber -> Red)
    const color =
      aimPower < 40 ? '#4ade80' : aimPower < 75 ? '#fbbf24' : '#ef4444';

    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(ball.x, ball.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Crosshair circle at predicted tip
    ctx.setLineDash([]);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(endX, endY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Power text badge
    ctx.font = '900 12px system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.5;
    ctx.textAlign = 'center';
    ctx.strokeText(`${Math.round(aimPower)}%`, endX, endY - 10);
    ctx.fillText(`${Math.round(aimPower)}%`, endX, endY - 10);

    ctx.restore();
  };

  const drawGolfBall = (ctx: CanvasRenderingContext2D, ball: CorgiMiniGolfState['ball']) => {
    if (ball.sinkScale <= 0) return;

    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.scale(ball.sinkScale, ball.sinkScale);
    ctx.globalAlpha = ball.sinkAlpha;

    // Drop Shadow
    ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 3, ball.radius, ball.radius * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // White Golf Ball Body
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // Ball Rim
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Paw Print Emblem
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, 2.5, 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(-2, -2, 1, 0, Math.PI * 2);
    ctx.arc(0, -3, 1, 0, Math.PI * 2);
    ctx.arc(2, -2, 1, 0, Math.PI * 2);
    ctx.fill();

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
            <Flag className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>
              <span className="hidden sm:inline">HOLE </span>H{displayState.holeNumber}/4
            </span>
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-300 bg-slate-800/80 px-1.5 sm:px-2 py-1 rounded-lg border border-slate-700 text-[11px] sm:text-xs">
            <span>PAR {displayState.par}</span>
          </div>
          <div className="flex items-center gap-1 font-black text-emerald-400 bg-emerald-950/60 px-1.5 sm:px-2 py-1 rounded-lg border border-emerald-500/30 text-[11px] sm:text-xs">
            <span>
              <span className="hidden sm:inline">STROKES: </span>S:
            </span>
            <span>{displayState.strokes}</span>
          </div>
        </div>

        {/* Right Cluster */}
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-1 font-black text-amber-400 bg-amber-950/60 px-1.5 sm:px-2 py-1 rounded-lg border border-amber-500/30 text-[11px] sm:text-xs">
            <Trophy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>{displayState.score}</span>
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
            onClick={handleResetHole}
            aria-label="Restart Hole"
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

        {/* HOLE CLEARED OVERLAY */}
        {displayState.status === 'hole_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-400/20 animate-bounce">
                ⛳
              </div>
              <h3 className="text-2xl font-black text-emerald-300 tracking-tight">HOLE {displayState.holeNumber} COMPLETED!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                Strokes: <span className="font-bold text-amber-400">{displayState.strokes}</span> (Par {displayState.par}) • Total Score: {displayState.score}
              </p>
              <button
                onClick={handleNextHole}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span>NEXT HOLE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* COURSE VICTORY OVERLAY */}
        {displayState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-amber-400/30 animate-pulse">
                🏆
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">COURSE CHAMPION!</h3>
              <p className="text-sm text-slate-200 mt-1 mb-2">
                You sank every putt across all 4 countryside pasture holes!
              </p>
              <div className="text-lg font-black text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-500/40 my-3">
                Total Strokes: {displayState.totalStrokes} • Final Score: {displayState.score}
              </div>
              <button
                onClick={handleResetHole}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>PLAY AGAIN</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

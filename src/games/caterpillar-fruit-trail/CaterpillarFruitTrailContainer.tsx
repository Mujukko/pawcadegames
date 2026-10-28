import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, ArrowRight, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight as ArrowRightIcon, Zap } from 'lucide-react';
import {
  CaterpillarState,
  CaterpillarEvent,
  Direction,
} from './logic/types';
import {
  createInitialState,
  setDirection,
  updateEngine,
  nextStage,
  resetStage,
  STAGE_CONFIGS,
  getDirDelta,
} from './logic/engine';
import { caterpillarAudio } from './systems/sound';

export const CaterpillarFruitTrailContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_caterpillar_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<CaterpillarState>(createInitialState(1, highScore));
  const [displayState, setDisplayState] = useState<{
    stage: number;
    score: number;
    highScore: number;
    fruitsEaten: number;
    targetFruits: number;
    speedBoost: number;
    status: CaterpillarState['status'];
  }>({
    stage: 1,
    score: 0,
    highScore,
    fruitsEaten: 0,
    targetFruits: STAGE_CONFIGS[0]!.targetFruits,
    speedBoost: 0,
    status: 'ready',
  });

  const [isMuted, setIsMuted] = useState<boolean>(caterpillarAudio.getMuted());

  // Touch Swipe Gesture State
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleAudioEvents = useCallback((events: CaterpillarEvent[]) => {
    events.forEach((ev) => {
      switch (ev.type) {
        case 'fruit_eat':
          caterpillarAudio.playMunch(ev.fruitType);
          break;
        case 'speed_boost':
          caterpillarAudio.playSpeedBoost();
          break;
        case 'crash':
          caterpillarAudio.playCrash();
          break;
        case 'stage_cleared':
        case 'victory':
          caterpillarAudio.playStageCleared();
          break;
      }
    });
  }, []);

  const syncDisplayState = useCallback(() => {
    const s = stateRef.current;
    setDisplayState({
      stage: s.stage,
      score: s.score,
      highScore: s.highScore,
      fruitsEaten: s.fruitsEaten,
      targetFruits: s.targetFruits,
      speedBoost: Math.ceil(s.speedBoostRemaining),
      status: s.status,
    });

    if (s.score > highScore) {
      setHighScore(s.score);
      try {
        localStorage.setItem('pawcade_caterpillar_high_score', s.score.toString());
      } catch {
        // Ignore local storage error
      }
    }
  }, [highScore]);

  const handleTurn = useCallback((dir: Direction) => {
    const prevDir = stateRef.current.direction;
    stateRef.current = setDirection(stateRef.current, dir);
    if (stateRef.current.nextDirection !== prevDir) {
      caterpillarAudio.playTurn();
    }
    syncDisplayState();
  }, [syncDisplayState]);

  // Touch Swipe Handlers on Canvas
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches[0]) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || !e.touches[0]) return;

    const dx = e.touches[0].clientX - touchStartRef.current.x;
    const dy = e.touches[0].clientY - touchStartRef.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    const minSwipeThreshold = 18; // px

    if (absX > minSwipeThreshold || absY > minSwipeThreshold) {
      if (absX > absY) {
        handleTurn(dx > 0 ? 'right' : 'left');
      } else {
        handleTurn(dy > 0 ? 'down' : 'up');
      }
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    }
  };

  const handleTouchEnd = () => {
    touchStartRef.current = null;
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
    const muted = caterpillarAudio.toggleMute();
    setIsMuted(muted);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleTurn('up');
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleTurn('down');
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleTurn('left');
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleTurn('right');
          break;
        case 'r':
        case 'R':
          handleResetStage();
          break;
        case 'm':
        case 'M':
          handleToggleMute();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTurn]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const render = (time: number) => {
      const dt = (time - lastTime) / 1000;
      lastTime = time;

      const { state: nextSt, events } = updateEngine(stateRef.current, dt);
      stateRef.current = nextSt;

      if (events.length > 0) {
        handleAudioEvents(events);
        syncDisplayState();
      }

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
  const drawScene = (ctx: CanvasRenderingContext2D, state: CaterpillarState) => {
    const canvasWidth = 432;
    const canvasHeight = 528;
    const { cols, rows, cellSize } = state;

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 1. Garden Grass Grid Checkerboard
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < rows; r++) {
        ctx.fillStyle = (c + r) % 2 === 0 ? '#22c55e' : '#16a34a';
        ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }
    }

    // 2. Obstacles (Hedges, Rocks, Thorns)
    state.obstacles.forEach((obs) => {
      const ox = obs.x * cellSize;
      const oy = obs.y * cellSize;

      ctx.save();
      if (obs.type === 'rock') {
        ctx.fillStyle = '#64748b';
        ctx.beginPath();
        ctx.roundRect(ox + 2, oy + 2, cellSize - 4, cellSize - 4, 6);
        ctx.fill();
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Highlight
        ctx.fillStyle = '#94a3b8';
        ctx.beginPath();
        ctx.arc(ox + 7, oy + 7, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (obs.type === 'hedge') {
        ctx.fillStyle = '#15803d';
        ctx.beginPath();
        ctx.roundRect(ox + 1, oy + 1, cellSize - 2, cellSize - 2, 4);
        ctx.fill();
        ctx.strokeStyle = '#166534';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Leaf clusters
        ctx.fillStyle = '#4ade80';
        ctx.beginPath();
        ctx.arc(ox + 6, oy + 6, 3, 0, Math.PI * 2);
        ctx.arc(ox + 14, oy + 8, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Thorn Bramble
        ctx.fillStyle = '#581c87';
        ctx.beginPath();
        ctx.arc(ox + cellSize / 2, oy + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
      ctx.restore();
    });

    // 3. Fruits
    state.fruits.forEach((fruit) => {
      const fx = fruit.x * cellSize + cellSize / 2;
      const fy = fruit.y * cellSize + cellSize / 2;

      ctx.save();
      ctx.translate(fx, fy);

      if (fruit.type === 'cherry') {
        // Dual Cherries
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-4, -2);
        ctx.quadraticCurveTo(0, -9, 4, -2);
        ctx.stroke();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(-4, 2, 5.5, 0, Math.PI * 2);
        ctx.arc(4, 2, 5.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-5, 0, 1.5, 0, Math.PI * 2);
        ctx.arc(3, 0, 1.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (fruit.type === 'strawberry') {
        // Strawberry
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.moveTo(0, 7);
        ctx.lineTo(-6, -2);
        ctx.quadraticCurveTo(0, -7, 6, -2);
        ctx.closePath();
        ctx.fill();

        // Green Leaves Cap
        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.arc(0, -6, 3.5, 0, Math.PI * 2);
        ctx.fill();
      } else if (fruit.type === 'golden_apple') {
        // Golden Apple
        ctx.fillStyle = '#facc15';
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(0, 1, 7.5, 0, Math.PI * 2);
        ctx.fill();

        // Stem & Leaf
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(2, -9);
        ctx.stroke();
      } else if (fruit.type === 'leaf') {
        // Speed Boost Leaf
        ctx.fillStyle = '#86efac';
        ctx.shadowColor = '#22c55e';
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(0, 0, 8, 4.5, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else {
        // Red Apple
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, 1, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, -6);
        ctx.lineTo(1, -9);
        ctx.stroke();
      }
      ctx.restore();
    });

    // 4. Sammy the Caterpillar Body Segments
    state.segments.forEach((seg, idx) => {
      const sx = seg.x * cellSize + cellSize / 2;
      const sy = seg.y * cellSize + cellSize / 2;

      ctx.save();
      ctx.translate(sx, sy);

      if (idx === 0) {
        // HEAD SEGMENT
        const radius = cellSize * 0.48;
        ctx.fillStyle = state.speedBoostRemaining > 0 ? '#fde047' : '#a3e635';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Big Eyes facing direction
        const delta = getDirDelta(state.direction);
        const eyeOffsetX = delta.dx * 3;
        const eyeOffsetY = delta.dy * 3;

        // Two Eyes
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(eyeOffsetX - 3, eyeOffsetY - 2, 2.5, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX + 3, eyeOffsetY - 2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeOffsetX - 3.5, eyeOffsetY - 2.5, 1, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX + 2.5, eyeOffsetY - 2.5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Cheerful Smile
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(eyeOffsetX, eyeOffsetY + 2, 2.8, 0, Math.PI);
        ctx.stroke();

        // Rosy Cheeks
        ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
        ctx.beginPath();
        ctx.arc(eyeOffsetX - 5, eyeOffsetY + 1, 1.8, 0, Math.PI * 2);
        ctx.arc(eyeOffsetX + 5, eyeOffsetY + 1, 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Purple Antennae
        ctx.strokeStyle = '#9333ea';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-3, -radius + 2);
        ctx.lineTo(-5, -radius - 4);
        ctx.moveTo(3, -radius + 2);
        ctx.lineTo(5, -radius - 4);
        ctx.stroke();

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(-5, -radius - 4, 1.8, 0, Math.PI * 2);
        ctx.arc(5, -radius - 4, 1.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // BODY SEGMENT
        const radius = Math.max(cellSize * 0.35, cellSize * 0.44 - idx * 0.2);
        ctx.fillStyle = state.speedBoostRemaining > 0 ? '#fef08a' : idx % 2 === 0 ? '#bef264' : '#84cc16';
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#4d7c0f';
        ctx.lineWidth = 1.8;
        ctx.stroke();

        // Yellow dorsal spot
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });

    // 5. Sparkles
    state.sparkles.forEach((sp) => {
      ctx.save();
      ctx.globalAlpha = sp.alpha;
      ctx.fillStyle = sp.color;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 6. Floating Score Badges
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

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-lg mx-auto flex flex-col items-center select-none overflow-hidden touch-none"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* COMPACT BALANCED MOBILE HUD (320px - 430px) */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-amber-500/20 text-white z-20 shrink-0 text-xs sm:text-sm">
        {/* Left Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 font-black text-amber-400 bg-amber-950/60 px-2 py-1 rounded-lg border border-amber-500/30">
            <span>STG {displayState.stage}/4</span>
          </div>
          <div className="flex items-center gap-1 font-black text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded-lg border border-emerald-500/30">
            <Trophy className="w-3.5 h-3.5" />
            <span>{displayState.score}</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-amber-300 bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-700">
            <span>🍎</span>
            <span>
              {displayState.fruitsEaten}/{displayState.targetFruits}
            </span>
          </div>
        </div>

        {/* Right Cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {displayState.speedBoost > 0 && (
            <div className="flex items-center gap-1 font-black text-yellow-300 bg-yellow-950/70 px-2 py-1 rounded-lg border border-yellow-500/40 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>TURBO</span>
            </div>
          )}

          {/* Mute Button */}
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-8 h-8 min-w-[32px] min-h-[32px] sm:w-9 sm:h-9 sm:min-w-[36px] sm:min-h-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleResetStage}
            aria-label="Restart Stage"
            className="w-8 h-8 min-w-[32px] min-h-[32px] sm:w-9 sm:h-9 sm:min-w-[36px] sm:min-h-[36px] rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* GAME CANVAS */}
      <div className="relative w-full aspect-[432/528] max-h-[calc(100vh-210px)] flex items-center justify-center bg-slate-950">
        <canvas
          ref={canvasRef}
          width={432}
          height={528}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          className="w-full h-full object-contain cursor-pointer touch-none select-none"
        />

        {/* READY PROMPT OVERLAY */}
        {displayState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center pointer-events-none z-20">
            <div className="text-3xl mb-2 animate-bounce">🐛</div>
            <h4 className="text-xl font-black text-amber-300 drop-shadow-md">SWIPE OR USE ARROWS TO CRAWL!</h4>
            <p className="text-xs text-slate-200 mt-1 font-semibold">Eat fruits to grow and clear the stage</p>
          </div>
        )}

        {/* STAGE CLEARED OVERLAY */}
        {displayState.status === 'stage_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-400/20 animate-bounce">
                🎉
              </div>
              <h3 className="text-2xl font-black text-amber-300 tracking-tight">STAGE {displayState.stage} CLEARED!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                Great job! Score: <span className="font-bold text-amber-400">{displayState.score}</span>
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
                🦋
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-400 tracking-tight">GARDEN BUTTERFLY!</h3>
              <p className="text-sm text-slate-200 mt-1 mb-2">
                Sammy ate all the garden harvest and turned into a beautiful butterfly!
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
                💥
              </div>
              <h3 className="text-2xl font-black text-rose-400 tracking-tight">OUCH! CRASHED!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                Score: <span className="font-bold text-amber-400">{displayState.score}</span>
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

      {/* COMPACT ON-SCREEN VIRTUAL D-PAD (>= 44x44px touch targets) */}
      <div className="w-full py-2 px-4 flex items-center justify-center gap-2 bg-slate-950 border-t border-slate-800">
        <button
          onClick={() => handleTurn('left')}
          aria-label="Turn Left"
          className="w-12 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-all cursor-pointer touch-manipulation"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col gap-1.5">
          <button
            onClick={() => handleTurn('up')}
            aria-label="Turn Up"
            className="w-12 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-all cursor-pointer touch-manipulation"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <button
            onClick={() => handleTurn('down')}
            aria-label="Turn Down"
            className="w-12 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-all cursor-pointer touch-manipulation"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => handleTurn('right')}
          aria-label="Turn Right"
          className="w-12 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-amber-500 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-all cursor-pointer touch-manipulation"
        >
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

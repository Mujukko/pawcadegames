import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, ArrowRight, Trophy, Zap, Target } from 'lucide-react';
import {
  CarrotTargetState,
  CarrotEvent,
  EmbeddedPeg,
  BonusFruit,
  FlyingCarrot,
  DeflectedCarrot,
  WoodParticle,
} from './logic/types';
import {
  createInitialState,
  throwCarrot,
  updateEngine,
  nextStage,
  resetStage,
  restartGame,
  STAGE_CONFIGS,
  STUMP_CENTER_X,
  STUMP_CENTER_Y,
  STUMP_RADIUS,
} from './logic/engine';
import { carrotAudio } from './systems/sound';

export const CarrotTargetThrowContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_carrot_target_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => carrotAudio.getMuted());

  const stateRef = useRef<CarrotTargetState>(createInitialState(highScore));
  const [displayState, setDisplayState] = useState<CarrotTargetState>(stateRef.current);

  const handleSoundEvents = useCallback((events: CarrotEvent[]) => {
    for (const event of events) {
      switch (event.type) {
        case 'carrot_thrown':
          carrotAudio.playThrow();
          break;
        case 'carrot_stuck':
          carrotAudio.playStick();
          break;
        case 'fruit_sliced':
          carrotAudio.playSlice();
          break;
        case 'carrot_clash':
          carrotAudio.playClash();
          break;
        case 'stage_clear':
          carrotAudio.playStageClear();
          break;
        case 'victory':
          carrotAudio.playVictory();
          break;
      }
    }
  }, []);

  const handleThrow = useCallback(() => {
    const { state: next, event } = throwCarrot(stateRef.current);
    stateRef.current = next;
    setDisplayState({ ...next });
    if (event) {
      handleSoundEvents([event]);
    }
  }, [handleSoundEvents]);

  const handleToggleMute = useCallback(() => {
    const muted = carrotAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleNextStage = useCallback(() => {
    const next = nextStage(stateRef.current);
    stateRef.current = next;
    setDisplayState({ ...next });
  }, []);

  const handleRestart = useCallback(() => {
    const restarted = restartGame(stateRef.current);
    stateRef.current = restarted;
    setDisplayState({ ...restarted });
  }, []);

  const handleRetryStage = useCallback(() => {
    const retried = resetStage(stateRef.current);
    stateRef.current = retried;
    setDisplayState({ ...retried });
  }, []);

  // Keyboard controls (Space or Enter to throw)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        if (stateRef.current.status === 'stage_cleared') {
          handleNextStage();
        } else if (stateRef.current.status === 'game_over') {
          handleRetryStage();
        } else if (stateRef.current.status === 'victory') {
          handleRestart();
        } else {
          handleThrow();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleThrow, handleNextStage, handleRetryStage, handleRestart]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const { state: updated, events } = updateEngine(stateRef.current, dt);
      stateRef.current = updated;

      if (events.length > 0) {
        handleSoundEvents(events);
        setDisplayState({ ...updated });
      }

      // Sync high score
      if (updated.score > highScore) {
        setHighScore(updated.score);
        try {
          localStorage.setItem('pawcade_carrot_target_high_score', updated.score.toString());
        } catch {}
      }

      // Check if status changed or end-game
      if (updated.status !== displayState.status || updated.carrotsRemaining !== displayState.carrotsRemaining) {
        setDisplayState({ ...updated });
      }

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, updated);
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [displayState.status, displayState.carrotsRemaining, handleSoundEvents, highScore]);

  // Canvas 2D Rendering Function
  const renderCanvas = (ctx: CanvasRenderingContext2D, state: CarrotTargetState) => {
    const width = 420;
    const height = 540;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Cozy Orchard Sunset Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#0f172a');
    bgGrad.addColorStop(0.5, '#1e293b');
    bgGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Radial Sunburst behind target stump
    const sunGrad = ctx.createRadialGradient(STUMP_CENTER_X, STUMP_CENTER_Y, 20, STUMP_CENTER_X, STUMP_CENTER_Y, 190);
    sunGrad.addColorStop(0, 'rgba(251, 191, 36, 0.16)');
    sunGrad.addColorStop(0.6, 'rgba(245, 158, 11, 0.06)');
    sunGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(STUMP_CENTER_X, STUMP_CENTER_Y, 190, 0, Math.PI * 2);
    ctx.fill();

    // Concentric orbit dashed guides
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([8, 12]);
    ctx.beginPath();
    ctx.arc(STUMP_CENTER_X, STUMP_CENTER_Y, STUMP_RADIUS + 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Render Central Target Stump with Rotation
    ctx.save();
    ctx.translate(state.stump.x, state.stump.y);
    ctx.rotate(state.stump.rotation);

    // Stump Bark Edge
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(0, 0, state.stump.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Wood Cross-Section Inner Disc
    const woodFaceGrad = ctx.createRadialGradient(-10, -10, 10, 0, 0, state.stump.radius - 6);
    woodFaceGrad.addColorStop(0, '#fef3c7');
    woodFaceGrad.addColorStop(0.6, '#fde68a');
    woodFaceGrad.addColorStop(0.9, '#d97706');
    woodFaceGrad.addColorStop(1, '#92400e');
    ctx.fillStyle = woodFaceGrad;
    ctx.beginPath();
    ctx.arc(0, 0, state.stump.radius - 6, 0, Math.PI * 2);
    ctx.fill();

    // Growth Rings
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, state.stump.radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, state.stump.radius * 0.46, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, 0, state.stump.radius * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Center Core Heartwood
    ctx.fillStyle = 'rgba(146, 64, 14, 0.4)';
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cross-Section Radial Grain Marks
    ctx.strokeStyle = 'rgba(120, 53, 15, 0.4)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const gAngle = (i * Math.PI) / 2;
      ctx.beginPath();
      ctx.moveTo(Math.cos(gAngle) * 14, Math.sin(gAngle) * 14);
      ctx.lineTo(Math.cos(gAngle) * (state.stump.radius - 8), Math.sin(gAngle) * (state.stump.radius - 8));
      ctx.stroke();
    }

    // 3. Render Embedded Pegs on Stump (Rotate together with stump coordinate system)
    for (const peg of state.embeddedPegs) {
      ctx.save();
      ctx.rotate(peg.angle);

      if (peg.type === 'wood_obstacle') {
        // Rustic wooden block obstacle
        ctx.fillStyle = '#451a03';
        ctx.strokeStyle = '#291002';
        ctx.lineWidth = 2;
        ctx.fillRect(-7, state.stump.radius - 4, 14, 38);
        ctx.strokeRect(-7, state.stump.radius - 4, 14, 38);

        // Warning hash marks
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-5, state.stump.radius + 10);
        ctx.lineTo(5, state.stump.radius + 16);
        ctx.moveTo(-5, state.stump.radius + 22);
        ctx.lineTo(5, state.stump.radius + 28);
        ctx.stroke();
      } else {
        // Embedded Carrot pointing inward
        drawCarrotSprite(ctx, 0, state.stump.radius + 22, 44, 14, Math.PI);
      }

      ctx.restore();
    }

    // 4. Render Orbiting Bonus Fruits (Rotate together with stump coordinate system)
    for (const fruit of state.bonusFruits) {
      if (fruit.isSliced) continue;
      ctx.save();
      ctx.rotate(fruit.angle);
      const fruitY = state.stump.radius + 24;

      if (fruit.type === 'apple') {
        // Red Shiny Apple
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(0, fruitY, 13, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#991b1b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Stem & Leaf
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, fruitY - 13);
        ctx.quadraticCurveTo(4, fruitY - 18, 5, fruitY - 16);
        ctx.stroke();

        ctx.fillStyle = '#22c55e';
        ctx.beginPath();
        ctx.ellipse(4, fruitY - 15, 4, 2, 0.4, 0, Math.PI * 2);
        ctx.fill();

        // Specular glint
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, fruitY - 4, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Golden Acorn
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.ellipse(0, fruitY + 2, 9, 13, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#a16207';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Cap
        ctx.fillStyle = '#854d0e';
        ctx.beginPath();
        ctx.arc(0, fruitY - 7, 10, Math.PI, 0);
        ctx.fill();

        // Stem
        ctx.strokeStyle = '#713f12';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, fruitY - 7);
        ctx.lineTo(0, fruitY - 12);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore(); // End Stump rotation

    // 5. Render Deflected Carrot (Game Over animation)
    if (state.deflectedCarrot) {
      ctx.save();
      ctx.translate(state.deflectedCarrot.x, state.deflectedCarrot.y);
      ctx.rotate(state.deflectedCarrot.rotation);
      drawCarrotSprite(ctx, 0, 0, 50, 16, 0);
      ctx.restore();
    }

    // 6. Render Flying Carrot
    if (state.flyingCarrot) {
      ctx.save();
      ctx.translate(state.flyingCarrot.x, state.flyingCarrot.y);

      // Trailing speed lines
      ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(-6, 25);
      ctx.lineTo(-6, 50);
      ctx.moveTo(6, 25);
      ctx.lineTo(6, 50);
      ctx.moveTo(0, 30);
      ctx.lineTo(0, 65);
      ctx.stroke();

      drawCarrotSprite(ctx, 0, 0, state.flyingCarrot.length, state.flyingCarrot.width, 0);
      ctx.restore();
    }

    // 7. Render Ready Carrot (Waiting at bottom launcher)
    if (!state.flyingCarrot && state.status !== 'game_over' && state.status !== 'victory' && state.carrotsRemaining > 0) {
      ctx.save();
      ctx.translate(STUMP_CENTER_X, 470);
      drawCarrotSprite(ctx, 0, 0, 52, 16, 0);
      ctx.restore();
    }

    // 8. Render Particles (Wood chips and Fruit Juice)
    for (const p of state.particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life / p.maxLife;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1.0;
    }

    ctx.restore();
  };

  // Helper: Draw stylized crisp 3D cartoon carrot pointing upward
  const drawCarrotSprite = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    length: number,
    width: number,
    angle: number
  ) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    const halfW = width / 2;
    const halfL = length / 2;

    // Carrot Body Gradient
    const carrotGrad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    carrotGrad.addColorStop(0, '#ea580c');
    carrotGrad.addColorStop(0.4, '#f97316');
    carrotGrad.addColorStop(0.8, '#fb923c');
    carrotGrad.addColorStop(1, '#c2410c');

    // Tapered carrot silhouette (Tip at -halfL, Top at +halfL)
    ctx.fillStyle = carrotGrad;
    ctx.beginPath();
    ctx.moveTo(0, -halfL); // Sharp pointed tip
    ctx.quadraticCurveTo(halfW * 1.15, 0, halfW, halfL);
    ctx.quadraticCurveTo(0, halfL + 3, -halfW, halfL);
    ctx.quadraticCurveTo(-halfW * 1.15, 0, 0, -halfL);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Horizontal ridges
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.7, -halfL * 0.3);
    ctx.lineTo(halfW * 0.7, -halfL * 0.3);
    ctx.moveTo(-halfW * 0.8, halfL * 0.2);
    ctx.lineTo(halfW * 0.8, halfL * 0.2);
    ctx.moveTo(-halfW * 0.85, halfL * 0.65);
    ctx.lineTo(halfW * 0.85, halfL * 0.65);
    ctx.stroke();

    // Specular highlight
    ctx.strokeStyle = 'rgba(255, 237, 213, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-halfW * 0.4, -halfL * 0.6);
    ctx.lineTo(-halfW * 0.4, halfL * 0.7);
    ctx.stroke();

    // Green leafy fronds at top
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(-4, halfL + 7, 3.5, 7, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(4, halfL + 7, 3.5, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#4ade80';
    ctx.beginPath();
    ctx.ellipse(0, halfL + 9, 3, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const currentConfig = STAGE_CONFIGS[displayState.stage - 1] || STAGE_CONFIGS[0];

  return (
    <div
      ref={containerRef}
      className="max-w-md mx-auto flex flex-col items-center select-none overflow-hidden touch-none overscroll-none rounded-3xl border border-amber-500/30 shadow-2xl bg-slate-950 p-2 sm:p-4 text-white"
    >
      {/* COMPACT SINGLE-SCREEN HUD */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-2 px-1">
        {/* Left Cluster: Stage & Score */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="bg-amber-500/20 border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black text-amber-300">
            STAGE {displayState.stage}/4
          </div>
          <div className="bg-slate-900/90 border border-slate-700/80 px-2 sm:px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{displayState.score}</span>
          </div>
        </div>

        {/* Right Cluster: Audio & Restart */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation relative after:absolute after:-inset-1.5 after:content-['']"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleRetryStage}
            aria-label="Restart Stage"
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation relative after:absolute after:-inset-1.5 after:content-['']"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div
        className="relative w-full aspect-[420/540] max-h-[calc(100vh-210px)] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900 cursor-pointer"
        onPointerDown={handleThrow}
      >
        <canvas
          ref={canvasRef}
          width={420}
          height={540}
          className="w-full h-full object-contain block"
        />

        {/* STAGE HEADER OVERLAY (Fades out when playing) */}
        {displayState.status === 'ready' && (
          <div className="absolute top-3 inset-x-0 flex flex-col items-center pointer-events-none animate-pulse">
            <span className="text-xs uppercase tracking-widest text-amber-400 font-bold bg-slate-950/70 px-3 py-1 rounded-full border border-amber-500/30">
              {currentConfig.title} • {currentConfig.subtitle}
            </span>
          </div>
        )}

        {/* STAGE CLEARED MODAL */}
        {displayState.status === 'stage_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-400/20 animate-bounce">
                🎯
              </div>
              <h3 className="text-2xl font-black text-emerald-300 tracking-tight">STAGE {displayState.stage} CLEARED!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                All carrots embedded with precision! Current Score: <span className="font-bold text-amber-400">{displayState.score}</span>
              </p>
              <button
                onClick={handleNextStage}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span>NEXT STAGE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* GAME OVER MODAL */}
        {displayState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-red-500/20">
                💥
              </div>
              <h3 className="text-2xl font-black text-red-400 tracking-tight">CARROT CLASH!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                You hit an existing peg! Final Score: <span className="font-bold text-amber-400">{displayState.score}</span>
              </p>
              <button
                onClick={handleRetryStage}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>TRY AGAIN</span>
              </button>
            </div>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {displayState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-amber-400/30 animate-pulse">
                🏆
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">TARGET MASTER!</h3>
              <p className="text-sm text-slate-200 mt-1 mb-2">
                You conquered all 4 spinning farm targets without a single clash!
              </p>
              <div className="text-lg font-black text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-500/40 my-3">
                Final Score: {displayState.score}
              </div>
              <button
                onClick={handleRestart}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>PLAY AGAIN</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM CARROT TRAY & THROW ACTION BUTTON */}
      <div className="w-full mt-2 flex flex-col gap-1.5">
        {/* Remaining Carrots Visual Rack */}
        <div className="flex items-center justify-center gap-1.5 py-1">
          {Array.from({ length: displayState.totalCarrotsInStage }).map((_, idx) => {
            const isRemaining = idx < displayState.carrotsRemaining;
            return (
              <div
                key={idx}
                className={`transition-all duration-200 ${
                  isRemaining
                    ? 'w-3 h-5 bg-gradient-to-t from-orange-600 to-amber-400 rounded-sm shadow-sm scale-100 opacity-100'
                    : 'w-2 h-4 bg-slate-800 rounded-sm scale-90 opacity-30'
                }`}
                title={`Carrot ${idx + 1}`}
              />
            );
          })}
        </div>

        {/* Tap To Throw Big Touch Button */}
        <button
          onClick={handleThrow}
          disabled={displayState.status !== 'ready' && displayState.status !== 'playing'}
          className="w-full py-3 sm:py-3.5 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 hover:from-orange-400 hover:to-amber-400 active:scale-98 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25 transition-all cursor-pointer touch-manipulation min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Target className="w-5 h-5" />
          <span>TAP TO THROW CARROT</span>
        </button>
      </div>
    </div>
  );
};

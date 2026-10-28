import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  initFruitSlicer,
  performSlice,
  updateFruitSlicer,
  addSliceTrailPoint,
  STAGE_CONFIGS,
  FRUIT_CONFIGS,
} from './logic/engine';
import { FruitSlicerState, SlicePoint, FruitType } from './logic/types';
import { fruitSlicerAudio } from './systems/sound';

export const BarnyardFruitSlicerContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // State maintained in ref for 60 FPS Canvas render loop
  const gameStateRef = useRef<FruitSlicerState>(initFruitSlicer(1, 480, 640));
  const isSlicingRef = useRef<boolean>(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const lastWhooshTimeRef = useRef<number>(0);

  // UI state for HUD updates
  const [uiScore, setUiScore] = useState<number>(0);
  const [uiHighScore, setUiHighScore] = useState<number>(0);
  const [uiLives, setUiLives] = useState<number>(3);
  const [uiStage, setUiStage] = useState<number>(1);
  const [uiStatus, setUiStatus] = useState<'playing' | 'game_over' | 'victory'>('playing');
  const [isMuted, setIsMuted] = useState<boolean>(fruitSlicerAudio.getMuted());

  // Handle Level Restart
  const handleRestart = useCallback(() => {
    const width = canvasRef.current?.width || 480;
    const height = canvasRef.current?.height || 640;
    const newState = initFruitSlicer(1, width, height);
    newState.highScore = Math.max(gameStateRef.current.highScore, gameStateRef.current.score);
    gameStateRef.current = newState;

    setUiScore(0);
    setUiLives(3);
    setUiStage(1);
    setUiStatus('playing');
  }, []);

  // Handle Next Stage
  const handleNextStage = useCallback(() => {
    const width = canvasRef.current?.width || 480;
    const height = canvasRef.current?.height || 640;
    const nextStage = Math.min(STAGE_CONFIGS.length, gameStateRef.current.stage + 1);
    const newState = initFruitSlicer(nextStage, width, height);
    newState.score = gameStateRef.current.score;
    newState.highScore = gameStateRef.current.highScore;
    gameStateRef.current = newState;

    setUiStage(nextStage);
    setUiStatus('playing');
  }, []);

  // Sync canvas size
  useEffect(() => {
    const handleResize = () => {
      const container = containerRef.current;
      const canvas = canvasRef.current;
      if (!container || !canvas) return;

      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;

      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      gameStateRef.current.width = rect.width;
      gameStateRef.current.height = rect.height;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Pointer slice handling
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isSlicingRef.current = true;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now() / 1000;

    lastPointerRef.current = { x, y };
    gameStateRef.current = addSliceTrailPoint(gameStateRef.current, x, y, now);

    if (now - lastWhooshTimeRef.current > 0.18) {
      fruitSlicerAudio.playBladeWhoosh();
      lastWhooshTimeRef.current = now;
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isSlicingRef.current || !lastPointerRef.current) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const now = performance.now() / 1000;

    const prevX = lastPointerRef.current.x;
    const prevY = lastPointerRef.current.y;

    const dist = Math.hypot(x - prevX, y - prevY);
    if (dist < 4) return;

    if (now - lastWhooshTimeRef.current > 0.18) {
      fruitSlicerAudio.playBladeWhoosh();
      lastWhooshTimeRef.current = now;
    }

    gameStateRef.current = addSliceTrailPoint(gameStateRef.current, x, y, now);

    // Perform slice test
    const { state: nextState, events } = performSlice(
      gameStateRef.current,
      prevX,
      prevY,
      x,
      y,
      now
    );

    gameStateRef.current = nextState;
    lastPointerRef.current = { x, y };

    // Trigger audio & haptics based on events
    events.forEach((evt) => {
      if (evt.type === 'slice' && evt.fruitType) {
        fruitSlicerAudio.playFruitSlice(evt.fruitType);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(15);
        }
      } else if (evt.type === 'combo' && evt.comboCount) {
        fruitSlicerAudio.playComboFanfare(evt.comboCount);
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([20, 30, 20]);
        }
      } else if (evt.type === 'bomb') {
        fruitSlicerAudio.playBombExplode();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([50, 40, 50]);
        }
      } else if (evt.type === 'stage_complete') {
        fruitSlicerAudio.playVictory();
      }
    });

    // Update HUD
    setUiScore(nextState.score);
    setUiHighScore(nextState.highScore);
    setUiLives(nextState.lives);
    setUiStage(nextState.stage);
    if (nextState.status !== uiStatus) {
      setUiStatus(nextState.status as 'playing' | 'game_over' | 'victory');
    }
  };

  const handlePointerUp = () => {
    isSlicingRef.current = false;
    lastPointerRef.current = null;
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = fruitSlicerAudio.toggleMute();
        setIsMuted(muted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRestart]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.06, (time - lastTime) / 1000);
      lastTime = time;
      const now = time / 1000;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Update engine state
      const { state: updatedState, events } = updateFruitSlicer(
        gameStateRef.current,
        dt,
        now
      );
      gameStateRef.current = updatedState;

      // Trigger audio on dropped fruits or game over
      events.forEach((evt) => {
        if (evt.type === 'fruit_dropped') {
          fruitSlicerAudio.playFruitDrop();
        }
      });

      // Update HUD if lives or status changed in loop
      if (updatedState.lives !== uiLives || updatedState.status !== uiStatus) {
        setUiLives(updatedState.lives);
        setUiStatus(updatedState.status as 'playing' | 'game_over' | 'victory');
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Orchard Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e293b');
      bgGrad.addColorStop(1, '#064e3b');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Wooden cutting board texture or barn wooden beams
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 2;
      for (let y = 40; y < height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Flying Fruits & Halves
      updatedState.fruits.forEach((f) => {
        const config = FRUIT_CONFIGS[f.type];

        if (!f.isSliced) {
          // Whole Fruit
          ctx.save();
          ctx.translate(f.x, f.y);
          ctx.rotate(f.rotation);

          // Soft drop shadow
          ctx.beginPath();
          ctx.arc(0, 8, f.radius * 0.9, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
          ctx.fill();

          if (f.isBomb) {
            // Thistle Bomb
            ctx.beginPath();
            ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
            ctx.fillStyle = '#334155';
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#ef4444';
            ctx.stroke();

            // Fuse with spark
            ctx.beginPath();
            ctx.moveTo(0, -f.radius);
            ctx.quadraticCurveTo(8, -f.radius - 12, 14, -f.radius - 16);
            ctx.strokeStyle = '#d97706';
            ctx.lineWidth = 3;
            ctx.stroke();

            // Sparkle
            ctx.beginPath();
            ctx.arc(14, -f.radius - 16, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#facc15';
            ctx.fill();

            // Skull/Warning emoji
            ctx.font = `${Math.floor(f.radius * 1.1)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💣', 0, 2);
          } else {
            // Fruit Body
            ctx.beginPath();
            ctx.arc(0, 0, f.radius, 0, Math.PI * 2);
            ctx.fillStyle = f.color;
            ctx.fill();

            // Specular Highlight
            ctx.beginPath();
            ctx.arc(-f.radius * 0.35, -f.radius * 0.35, f.radius * 0.35, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.fill();

            // Fruit Emoji Center
            ctx.font = `${Math.floor(f.radius * 1.2)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.emoji, 0, 2);
          }

          ctx.restore();
        } else if (f.half1 && f.half2) {
          // Half 1
          ctx.save();
          ctx.translate(f.half1.x, f.half1.y);
          ctx.rotate(f.half1.rotation);
          ctx.beginPath();
          ctx.arc(0, 0, f.radius * 0.85, 0, Math.PI);
          ctx.fillStyle = f.juiceColor;
          ctx.fill();
          ctx.font = `${Math.floor(f.radius * 0.8)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(config.emoji, 0, 0);
          ctx.restore();

          // Half 2
          ctx.save();
          ctx.translate(f.half2.x, f.half2.y);
          ctx.rotate(f.half2.rotation);
          ctx.beginPath();
          ctx.arc(0, 0, f.radius * 0.85, Math.PI, Math.PI * 2);
          ctx.fillStyle = f.juiceColor;
          ctx.fill();
          ctx.font = `${Math.floor(f.radius * 0.8)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(config.emoji, 0, 0);
          ctx.restore();
        }
      });

      // 3. Draw Juice Particles
      updatedState.particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 4. Draw Blade Slash Trail
      const trail = updatedState.sliceTrail;
      if (trail.length >= 2) {
        ctx.save();
        for (let i = 1; i < trail.length; i++) {
          const pt1 = trail[i - 1]!;
          const pt2 = trail[i]!;
          const age = now - pt2.timestamp;
          const life = Math.max(0, 1 - age / 0.2);

          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle = `rgba(56, 189, 248, ${life * 0.85})`;
          ctx.lineWidth = 10 * life;
          ctx.lineCap = 'round';
          ctx.stroke();

          // Inner white core
          ctx.beginPath();
          ctx.moveTo(pt1.x, pt1.y);
          ctx.lineTo(pt2.x, pt2.y);
          ctx.strokeStyle = `rgba(255, 255, 255, ${life})`;
          ctx.lineWidth = 4 * life;
          ctx.stroke();
        }
        ctx.restore();
      }

      // 5. Draw Floating Combo / Score Texts
      updatedState.floatingTexts.forEach((t) => {
        ctx.save();
        ctx.font = '900 20px system-ui, -apple-system, sans-serif';
        ctx.fillStyle = t.color;
        ctx.textAlign = 'center';
        ctx.globalAlpha = t.alpha;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 6;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      });

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [uiLives, uiStatus]);

  const currentStageName = STAGE_CONFIGS[uiStage - 1]?.name || 'Orchard';

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden bg-slate-950 border border-emerald-500/30 shadow-2xl select-none"
      style={{ touchAction: 'none' }}
    >
      {/* 60 FPS Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-crosshair select-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Header HUD */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between pointer-events-none">
        {/* Stage & Target */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-2">
          <div className="text-xs font-black text-emerald-300">
            Stage {uiStage}: {currentStageName} 🍉
          </div>
        </div>

        {/* Score & Lives */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Hearts */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-red-500/30 shadow-lg text-sm font-black flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < uiLives ? 'opacity-100 scale-100' : 'opacity-25 grayscale scale-90'}>
                ❤️
              </span>
            ))}
          </div>

          {/* Score Counter */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-500/30 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-base font-black text-amber-300 leading-none">{uiScore}</div>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => {
              const muted = fruitSlicerAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-emerald-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform cursor-pointer"
            aria-label="Restart game"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Swipe Instruction Overlay (At game start) */}
      {uiScore === 0 && uiStatus === 'playing' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse">
          <div className="bg-slate-950/80 backdrop-blur-md border border-cyan-400/40 px-5 py-2 rounded-full text-cyan-200 text-xs sm:text-sm font-black shadow-xl flex items-center gap-2">
            <span>⚔️</span> Swipe anywhere across flying fruits to slice!
          </div>
        </div>
      )}

      {/* Victory / Stage Clear Modal */}
      {uiStatus === 'victory' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">🍉👑⚔️</div>
            <h3 className="text-2xl font-black text-emerald-300">
              Master Fruit Ninja!
            </h3>
            <p className="text-slate-300 text-sm mt-2">
              You completed all four orchard stages with an incredible score of <strong className="text-amber-300">{uiScore}</strong>!
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Play Again & Slice More 🍉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {uiStatus === 'game_over' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">💥💔</div>
            <h3 className="text-2xl font-black text-red-400">
              Fruit Frenzy Ended!
            </h3>
            <p className="text-slate-300 text-sm mt-2">
              You ran out of lives! Final Score: <strong className="text-amber-300">{uiScore}</strong>
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Try Again ⚔️
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  HamsterCookieStackState,
  SweetItem,
  StackedSweet,
} from './logic/types';
import {
  initCookieStackGame,
  movePlate,
  updateCookieStackGame,
  advanceToNextBakeryStage,
  BAKERY_STAGES,
} from './logic/engine';
import { cookieStackAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const HamsterCookieStackContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<HamsterCookieStackState>(initCookieStackGame(1));

  const [uiStage, setUiStage] = useState(1);
  const [uiScore, setUiScore] = useState(0);
  const [uiLives, setUiLives] = useState(3);
  const [uiCount, setUiCount] = useState(0);
  const [uiTargetCount, setUiTargetCount] = useState(BAKERY_STAGES[0].targetCount);
  const [uiCombo, setUiCombo] = useState(0);
  const [uiStatus, setUiStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isMuted, setIsMuted] = useState(cookieStackAudio.getMuted());

  // Canvas size sync
  const updateCanvasDimensions = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const w = parent.clientWidth || 480;
    const h = parent.clientHeight || 640;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
  }, []);

  useEffect(() => {
    updateCanvasDimensions();
    window.addEventListener('resize', updateCanvasDimensions);
    analytics.track('game_started', { gameId: 'hamster-cookie-stack' });
    analytics.track('level_started', { gameId: 'hamster-cookie-stack', levelId: 1 });

    return () => {
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [updateCanvasDimensions]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current.status !== 'playing') return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        stateRef.current = movePlate(stateRef.current, stateRef.current.plateX - 35);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        stateRef.current = movePlate(stateRef.current, stateRef.current.plateX + 35);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const prevStatus = stateRef.current.status;
      const { newState, events } = updateCookieStackGame(stateRef.current, dt);
      stateRef.current = newState;

      // Audio feedback
      for (const ev of events) {
        if (ev.towerCollapsed) {
          cookieStackAudio.playTowerTumble();
        } else {
          cookieStackAudio.playSweetCatch(newState.stackedSweets.length);
          if (ev.isPerfect) {
            cookieStackAudio.playPerfectSparkle();
            cookieStackAudio.playHamsterSqueak();
          }
        }
      }

      if (prevStatus === 'playing' && newState.status === 'won') {
        cookieStackAudio.playVictory();
        analytics.track('level_completed', {
          gameId: 'hamster-cookie-stack',
          levelId: newState.stage,
          stars: 3,
        });
      }
      if (prevStatus === 'playing' && newState.status === 'lost') {
        analytics.track('level_failed', {
          gameId: 'hamster-cookie-stack',
          levelId: newState.stage,
        });
      }

      // UI Sync
      setUiScore(newState.score);
      setUiLives(newState.lives);
      setUiCount(newState.stackedSweets.length);
      setUiTargetCount(newState.stageConfig.targetCount);
      setUiCombo(newState.combo);
      setUiStatus(newState.status);

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, newState, canvas.width, canvas.height);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas 2D Rendering
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    state: HamsterCookieStackState,
    pixelW: number,
    pixelH: number
  ) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.save();
    ctx.scale(dpr, dpr);

    const canvas = canvasRef.current;
    const w = canvas ? canvas.clientWidth : 480;
    const h = canvas ? canvas.clientHeight : 640;

    const scaleX = w / 480;
    const scaleY = h / 640;
    ctx.scale(scaleX, scaleY);

    // 1. Cozy Pastel Bakery Kitchen Wallpaper
    const bgGrad = ctx.createLinearGradient(0, 0, 0, 640);
    bgGrad.addColorStop(0, '#fff1f2');
    bgGrad.addColorStop(0.6, '#fce7f3');
    bgGrad.addColorStop(1, '#f43f5e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 480, 640);

    // Subtle stripes
    ctx.fillStyle = 'rgba(225, 29, 72, 0.08)';
    for (let x = 0; x < 480; x += 60) {
      ctx.fillRect(x, 0, 30, 640);
    }

    // 2. Top Bakery Conveyor Bar
    ctx.fillStyle = '#475569';
    ctx.fillRect(0, 0, 480, 20);
    ctx.fillStyle = '#f59e0b';
    for (let x = 10; x < 480; x += 30) {
      ctx.beginPath();
      ctx.arc(x, 10, 3.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Falling Sweets
    for (const sweet of state.fallingSweets) {
      renderSweetItem(ctx, sweet);
    }

    // 4. Steerable Plate & Hamster Mochi
    renderHamsterAndPlate(ctx, state);

    // 5. Stacked Sweets on the Plate (with Spring Wobble Transform)
    renderStackedTower(ctx, state);

    ctx.restore();
  };

  // Render a Falling Sweet
  const renderSweetItem = (ctx: CanvasRenderingContext2D, s: SweetItem) => {
    ctx.save();
    ctx.translate(s.x, s.y);

    if (s.type === 'cookie') {
      ctx.beginPath();
      ctx.ellipse(0, 0, s.width * 0.5, s.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();
      // Choc chips
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.arc(-12, -2, 3, 0, Math.PI * 2);
      ctx.arc(8, -3, 3.5, 0, Math.PI * 2);
      ctx.arc(-2, 4, 3, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.type === 'donut') {
      ctx.beginPath();
      ctx.ellipse(0, 0, s.width * 0.5, s.height * 0.5, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      // Glaze
      ctx.beginPath();
      ctx.ellipse(0, -2, s.width * 0.44, s.height * 0.38, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.frostingColor;
      ctx.fill();
      // Hole
      ctx.beginPath();
      ctx.ellipse(0, -2, s.width * 0.16, s.height * 0.16, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fce7f3';
      ctx.fill();
    } else if (s.type === 'cupcake') {
      // Cupcake Liner
      ctx.beginPath();
      ctx.moveTo(-s.width * 0.38, s.height * 0.45);
      ctx.lineTo(s.width * 0.38, s.height * 0.45);
      ctx.lineTo(s.width * 0.45, -s.height * 0.1);
      ctx.lineTo(-s.width * 0.45, -s.height * 0.1);
      ctx.closePath();
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
      // Frosting Swirl
      ctx.beginPath();
      ctx.arc(0, -s.height * 0.25, s.width * 0.38, 0, Math.PI * 2);
      ctx.fillStyle = s.frostingColor;
      ctx.fill();
      // Cherry
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(0, -s.height * 0.5, 5, 0, Math.PI * 2);
      ctx.fill();
    } else if (s.type === 'macaron') {
      // Top Shell
      ctx.beginPath();
      ctx.ellipse(0, -4, s.width * 0.48, s.height * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
      // Cream
      ctx.beginPath();
      ctx.ellipse(0, 0, s.width * 0.42, s.height * 0.2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      // Bottom Shell
      ctx.beginPath();
      ctx.ellipse(0, 4, s.width * 0.48, s.height * 0.32, 0, 0, Math.PI * 2);
      ctx.fillStyle = s.color;
      ctx.fill();
    } else if (s.type === 'waffle') {
      ctx.beginPath();
      ctx.roundRect(-s.width * 0.5, -s.height * 0.5, s.width, s.height, 6);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      // Cake
      ctx.beginPath();
      ctx.roundRect(-s.width * 0.5, -s.height * 0.5, s.width, s.height, 8);
      ctx.fillStyle = s.color;
      ctx.fill();
      ctx.strokeStyle = s.frostingColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.restore();
  };

  // Render Mochi the Baker Hamster & Plate
  const renderHamsterAndPlate = (ctx: CanvasRenderingContext2D, state: HamsterCookieStackState) => {
    const px = state.plateX;
    const py = state.plateY;

    ctx.save();
    ctx.translate(px, py);

    // 1. Ceramic Serving Plate
    ctx.beginPath();
    ctx.ellipse(0, 0, state.plateWidth * 0.5, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fef08a';
    ctx.fill();
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 3;
    ctx.stroke();

    // 2. Hamster Body Beneath Plate
    ctx.translate(0, 36);

    // Chubby Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 34, 28, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fb923c';
    ctx.fill();
    ctx.strokeStyle = '#c2410c';
    ctx.lineWidth = 2;
    ctx.stroke();

    // White Belly
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Paws Holding Plate
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(-26, -24, 8, 0, Math.PI * 2);
    ctx.arc(26, -24, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(-18, -4, 6, 0, Math.PI * 2);
    ctx.arc(18, -4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-9, -12, 3.5, 0, Math.PI * 2);
    ctx.arc(9, -12, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-10, -13, 1.2, 0, Math.PI * 2);
    ctx.arc(8, -13, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(0, -7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Baker Hat
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(0, -32, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(-10, -22, 20, 5);

    ctx.restore();
  };

  // Render Stacked Tower with Wobble
  const renderStackedTower = (ctx: CanvasRenderingContext2D, state: HamsterCookieStackState) => {
    if (state.stackedSweets.length === 0) return;

    ctx.save();
    ctx.translate(state.plateX, state.plateY);

    // Apply spring balance wobble
    ctx.rotate(state.wobbleAngle);

    let currentY = 0;
    for (let i = 0; i < state.stackedSweets.length; i++) {
      const s = state.stackedSweets[i];
      currentY -= s.height;

      ctx.save();
      ctx.translate(s.offsetX, currentY + s.height * 0.5);
      ctx.rotate(s.angle);

      // Render sweet shape
      renderSweetItem(ctx, {
        id: s.id,
        type: s.type,
        x: 0,
        y: 0,
        width: s.width,
        height: s.height,
        vx: 0,
        vy: 0,
        points: s.points,
        color: s.color,
        frostingColor: s.frostingColor,
      });

      // Perfect glint sparkle
      if (s.isPerfect) {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(s.width * 0.35, -s.height * 0.3, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }

    ctx.restore();
  };

  // Touch and Mouse Slide Steer Handler
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const scaleX = 480 / canvas.clientWidth;
    const targetWorldX = x * scaleX;

    stateRef.current = movePlate(stateRef.current, targetWorldX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    handlePointerMove(e);
  };

  const handleNextStage = () => {
    const next = advanceToNextBakeryStage(stateRef.current);
    stateRef.current = next;
    setUiStage(next.stage);
    setUiStatus('playing');
    setUiCount(0);
    setUiTargetCount(next.stageConfig.targetCount);
    analytics.track('level_started', {
      gameId: 'hamster-cookie-stack',
      levelId: next.stage,
    });
  };

  const handleRestart = () => {
    stateRef.current = initCookieStackGame(stateRef.current.stage);
    setUiStatus('playing');
    setUiLives(3);
    setUiCount(0);
    setUiCombo(0);
    analytics.track('game_restarted', { gameId: 'hamster-cookie-stack' });
  };

  return (
    <div className="relative w-full h-[620px] max-w-lg mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-pink-500/20 select-none touch-none">
      {/* 60 FPS Interactive Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="w-full h-full block cursor-pointer"
        style={{ touchAction: 'none' }}
      />

      {/* Top HUD */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
        {/* Stage & Stack Progress */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-pink-500/30 shadow-lg">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-pink-300">
              Stage {uiStage} • {BAKERY_STAGES[uiStage - 1]?.title}
            </span>
            {uiCombo > 1 && (
              <span className="bg-gradient-to-r from-amber-400 to-pink-500 text-slate-950 font-black text-[11px] px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                {uiCombo}x COMBO!
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono font-bold text-pink-200">
              🍪 {uiCount} / {uiTargetCount} Stacked
            </span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-rose-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (uiCount / uiTargetCount) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lives & Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Lives Indicator */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-2 rounded-2xl border border-pink-500/30 text-xs font-black text-rose-400 shadow-lg">
            {'❤️'.repeat(Math.max(0, uiLives))}
          </div>
          <button
            onClick={() => {
              const muted = cookieStackAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-10 h-10 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-pink-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Bottom On-Screen Steer Buttons for Easy Thumb Control */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between pointer-events-auto sm:hidden">
        <button
          onClick={() => {
            stateRef.current = movePlate(stateRef.current, stateRef.current.plateX - 45);
          }}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-pink-500/40 text-pink-200 font-black text-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          aria-label="Steer Left"
        >
          ⬅️
        </button>
        <div className="text-[11px] font-bold text-pink-200 bg-slate-900/80 px-3 py-1 rounded-full border border-pink-500/30">
          Slide Finger to Balance
        </div>
        <button
          onClick={() => {
            stateRef.current = movePlate(stateRef.current, stateRef.current.plateX + 45);
          }}
          className="w-14 h-14 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-pink-500/40 text-pink-200 font-black text-2xl flex items-center justify-center shadow-xl active:scale-90 transition-transform"
          aria-label="Steer Right"
        >
          ➡️
        </button>
      </div>

      {/* Stage Victory Modal */}
      {uiStatus === 'won' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <div className="bg-slate-900 border border-pink-400/50 rounded-3xl p-6 text-center max-w-sm shadow-2xl animate-fade-in">
            <div className="text-5xl mb-3">🐹🧁🎉</div>
            <h3 className="text-2xl font-black text-pink-300">
              Delicious Tower Complete!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              Mochi balanced {uiCount} sweet desserts without tipping! You earned {uiScore} bakery points!
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {uiStage < BAKERY_STAGES.length ? (
                <button
                  onClick={handleNextStage}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-pink-400 to-rose-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
                >
                  Enter Next Patisserie ({uiStage + 1}/{BAKERY_STAGES.length}) 🍰
                </button>
              ) : (
                <button
                  onClick={handleRestart}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
                >
                  Bake Summit Masterpiece Again 👑
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stage Defeat Modal */}
      {uiStatus === 'lost' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-6 z-20">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-6 text-center max-w-sm shadow-2xl animate-fade-in">
            <div className="text-5xl mb-3">🧁💥🥺</div>
            <h3 className="text-2xl font-black text-red-400">
              Tower Tumbled!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              The sweets leaned too far off-center and tipped over! Center your catches to keep balance.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px]"
              >
                Try Counter Again 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

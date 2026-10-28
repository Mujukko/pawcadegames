import React, { useEffect, useRef, useState, useCallback } from 'react';
import { PinPullGameState, LockingPin, PinParticle } from './logic/types';
import {
  initPinPullGame,
  pullPin,
  updatePinPullGame,
  advanceToNextPinLevel,
  PIN_LEVELS,
} from './logic/engine';
import { pinPullAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const BarnyardPinPullContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PinPullGameState>(initPinPullGame(1));

  const [uiLevel, setUiLevel] = useState(1);
  const [uiScore, setUiScore] = useState(0);
  const [uiFood, setUiFood] = useState(0);
  const [uiTargetFood, setUiTargetFood] = useState(PIN_LEVELS[0].targetFoodCount);
  const [uiStatus, setUiStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [isMuted, setIsMuted] = useState(pinPullAudio.getMuted());

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
    analytics.track('game_started', { gameId: 'barnyard-pin-pull' });
    analytics.track('level_started', { gameId: 'barnyard-pin-pull', levelId: 1 });

    return () => {
      window.removeEventListener('resize', updateCanvasDimensions);
    };
  }, [updateCanvasDimensions]);

  // 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const prevStatus = stateRef.current.status;
      const prevFood = stateRef.current.foodCollected;
      const nextState = updatePinPullGame(stateRef.current, dt);
      stateRef.current = nextState;

      // Audio feedback
      if (nextState.foodCollected > prevFood) {
        pinPullAudio.playCoinClink();
        pinPullAudio.playPuppyBark();
      }
      if (prevStatus === 'playing' && nextState.status === 'won') {
        pinPullAudio.playVictory();
        analytics.track('level_completed', {
          gameId: 'barnyard-pin-pull',
          levelId: nextState.level,
          stars: 3,
        });
      }
      if (prevStatus === 'playing' && nextState.status === 'lost') {
        pinPullAudio.playDefeat();
        analytics.track('level_failed', {
          gameId: 'barnyard-pin-pull',
          levelId: nextState.level,
        });
      }

      // UI state sync
      setUiScore(nextState.score);
      setUiFood(nextState.foodCollected);
      setUiStatus(nextState.status);
      setUiTargetFood(nextState.levelConfig.targetFoodCount);

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, nextState, canvas.width, canvas.height);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas Rendering
  const renderCanvas = (
    ctx: CanvasRenderingContext2D,
    state: PinPullGameState,
    pixelW: number,
    pixelH: number
  ) => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    ctx.save();
    ctx.scale(dpr, dpr);

    const canvas = canvasRef.current;
    const w = canvas ? canvas.clientWidth : 480;
    const h = canvas ? canvas.clientHeight : 640;

    // Scale world coordinate space (480x640) to responsive screen
    const scaleX = w / 480;
    const scaleY = h / 640;
    ctx.scale(scaleX, scaleY);

    // 1. Cozy Barn Wooden Background
    const bg = ctx.createLinearGradient(0, 0, 0, 640);
    bg.addColorStop(0, '#451a03');
    bg.addColorStop(0.5, '#291206');
    bg.addColorStop(1, '#1c1917');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 480, 640);

    // Vertical plank lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 3;
    for (let x = 80; x < 480; x += 80) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 640);
      ctx.stroke();
    }

    // 2. Static Chamber Barriers
    for (const b of state.levelConfig.barriers) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = b.thickness;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Inner highlight
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = Math.max(2, b.thickness * 0.4);
      ctx.stroke();
      ctx.restore();
    }

    // 3. Creatures (Puppy & Fox)
    for (const c of state.creatures) {
      if (c.type === 'puppy') {
        renderPuppy(ctx, c);
      } else if (c.type === 'thief_fox') {
        renderFox(ctx, c);
      }
    }

    // 4. Fluid & Solid Particles
    for (const p of state.particles) {
      renderParticle(ctx, p);
    }

    // 5. Steam Particles
    for (const s of state.steamParticles) {
      const alpha = Math.max(0, 1 - s.life / s.maxLife);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(241, 245, 249, ${alpha * 0.6})`;
      ctx.fill();
    }

    // 6. Locking Pins with Pull Rings
    for (const pin of state.pins) {
      renderPin(ctx, pin);
    }

    ctx.restore();
  };

  // Render Pin with Sliding Offset and Tactile Pull Ring
  const renderPin = (ctx: CanvasRenderingContext2D, pin: LockingPin) => {
    if (pin.isPulled) return;

    ctx.save();

    let { x, y, length, thickness, pullDirection, pullProgress, ringX, ringY, ringRadius } = pin;

    // Offset based on progress
    if (pullDirection === 'right') {
      x += length * pullProgress;
      ringX += length * pullProgress;
    } else if (pullDirection === 'left') {
      length -= length * pullProgress;
      ringX -= length * pullProgress;
    } else if (pullDirection === 'up') {
      length -= length * pullProgress;
      ringY -= length * pullProgress;
    } else if (pullDirection === 'down') {
      y += length * pullProgress;
      ringY += length * pullProgress;
    }

    // Pin Shaft (Golden Steel)
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;

    const shaftW = pin.orientation === 'horizontal' ? length : thickness;
    const shaftH = pin.orientation === 'horizontal' ? thickness : length;

    const shaftGrad = ctx.createLinearGradient(x, y, x + shaftW, y + shaftH);
    shaftGrad.addColorStop(0, '#fef08a');
    shaftGrad.addColorStop(0.3, '#facc15');
    shaftGrad.addColorStop(0.7, '#eab308');
    shaftGrad.addColorStop(1, '#b45309');

    ctx.fillStyle = shaftGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, shaftW, shaftH, 6);
    ctx.fill();

    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pull Ring Loop
    ctx.shadowColor = 'rgba(250, 204, 21, 0.6)';
    ctx.shadowBlur = pin.isPulling ? 14 : 8;

    ctx.beginPath();
    ctx.arc(ringX, ringY, ringRadius, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fill();

    ctx.strokeStyle = shaftGrad;
    ctx.lineWidth = 6;
    ctx.stroke();

    // Directional Arrow on Ring
    ctx.beginPath();
    ctx.fillStyle = '#fde047';
    if (pullDirection === 'right') {
      ctx.moveTo(ringX + 6, ringY);
      ctx.lineTo(ringX - 4, ringY - 6);
      ctx.lineTo(ringX - 4, ringY + 6);
    } else if (pullDirection === 'left') {
      ctx.moveTo(ringX - 6, ringY);
      ctx.lineTo(ringX + 4, ringY - 6);
      ctx.lineTo(ringX + 4, ringY + 6);
    } else if (pullDirection === 'up') {
      ctx.moveTo(ringX, ringY - 6);
      ctx.lineTo(ringX - 6, ringY + 4);
      ctx.lineTo(ringX + 6, ringY + 4);
    } else {
      ctx.moveTo(ringX, ringY + 6);
      ctx.lineTo(ringX - 6, ringY - 4);
      ctx.lineTo(ringX + 6, ringY - 4);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Render Particle Types
  const renderParticle = (ctx: CanvasRenderingContext2D, p: PinParticle) => {
    ctx.save();
    ctx.beginPath();

    if (p.type === 'water') {
      // Liquid Cyan Water Droplet
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#67e8f9';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (p.type === 'lava') {
      // Burning Hot Lava Embers with Glow
      ctx.shadowColor = '#f97316';
      ctx.shadowBlur = 10;
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(p.x - 2, p.y - 2, 1, p.x, p.y, p.radius);
      grad.addColorStop(0, '#fef08a');
      grad.addColorStop(0.5, '#ea580c');
      grad.addColorStop(1, '#991b1b');
      ctx.fillStyle = grad;
      ctx.fill();
    } else if (p.type === 'stone') {
      // Solidified Stone
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#64748b';
      ctx.fill();
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    } else if (p.type === 'gold') {
      // Golden Coin
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      // Shine glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(p.x - 2, p.y - 2, 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.type === 'carrot') {
      // Crunchy Orange Carrot
      ctx.translate(p.x, p.y);
      ctx.beginPath();
      ctx.moveTo(0, p.radius);
      ctx.lineTo(-p.radius * 0.7, -p.radius * 0.6);
      ctx.lineTo(p.radius * 0.7, -p.radius * 0.6);
      ctx.closePath();
      ctx.fillStyle = '#ea580c';
      ctx.fill();
      // Green tip
      ctx.fillStyle = '#22c55e';
      ctx.fillRect(-p.radius * 0.3, -p.radius * 0.9, p.radius * 0.6, p.radius * 0.4);
    }

    ctx.restore();
  };

  // Render Barnaby the Puppy
  const renderPuppy = (ctx: CanvasRenderingContext2D, c: any) => {
    ctx.save();
    ctx.translate(c.x + c.width * 0.5, c.y + c.height * 0.5);

    // Dog Food Bowl
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.ellipse(0, 26, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(0, 4, 22, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    // Red Bandana
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(-14, -6);
    ctx.lineTo(14, -6);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();

    // Head
    ctx.beginPath();
    ctx.arc(0, -16, 20, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Ears
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(-18, -14, 6, 12, -0.3, 0, Math.PI * 2);
    ctx.ellipse(18, -14, 6, 12, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-7, -18, 3.5, 0, Math.PI * 2);
    ctx.arc(7, -18, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -19, 1.2, 0, Math.PI * 2);
    ctx.arc(6, -19, 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.arc(0, -12, 3, 0, Math.PI * 2);
    ctx.fill();

    // Happy Tongue
    if (c.foodReceived > 0) {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.ellipse(0, -5, 3.5, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Render Thief Fox
  const renderFox = (ctx: CanvasRenderingContext2D, f: any) => {
    ctx.save();
    ctx.translate(f.x + f.width * 0.5, f.y + f.height * 0.5);

    if (f.isEliminated) {
      // Knocked out / spin stars
      ctx.fillStyle = '#64748b';
      ctx.font = '22px sans-serif';
      ctx.fillText('💫', -10, 0);
      ctx.restore();
      return;
    }

    // Fox Body (Orange)
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(0, 6, 20, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Bushy Tail
    ctx.beginPath();
    ctx.ellipse(22, 10, 14, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(32, 14, 5, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.arc(0, -12, 18, 0, Math.PI * 2);
    ctx.fill();

    // Pointy Ears
    ctx.beginPath();
    ctx.moveTo(-16, -20);
    ctx.lineTo(-6, -32);
    ctx.lineTo(-2, -18);
    ctx.moveTo(16, -20);
    ctx.lineTo(6, -32);
    ctx.lineTo(2, -18);
    ctx.fill();

    // Bandit Mask
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(-14, -18, 28, 8, 4);
    ctx.fill();

    // Glowing Sneaky Eyes
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(-6, -14, 2.5, 0, Math.PI * 2);
    ctx.arc(6, -14, 2.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  // Touch & Pointer Down Handler for Pull Rings
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to world coordinate space (480x640)
    const scaleX = 480 / canvas.clientWidth;
    const scaleY = 640 / canvas.clientHeight;
    const worldX = clickX * scaleX;
    const worldY = clickY * scaleY;

    // Check hit test against pins' pull rings (generous 44px threshold)
    for (const pin of stateRef.current.pins) {
      if (pin.isPulled || pin.isPulling) continue;

      let rx = pin.ringX;
      let ry = pin.ringY;

      // Adjust based on current progress
      if (pin.pullDirection === 'right') rx += pin.length * pin.pullProgress;
      else if (pin.pullDirection === 'left') rx -= pin.length * pin.pullProgress;
      else if (pin.pullDirection === 'up') ry -= pin.length * pin.pullProgress;
      else if (pin.pullDirection === 'down') ry += pin.length * pin.pullProgress;

      const dist = Math.hypot(worldX - rx, worldY - ry);
      if (dist <= Math.max(36, pin.ringRadius * 1.6)) {
        stateRef.current = pullPin(stateRef.current, pin.id);
        pinPullAudio.playPinSlide();
        break;
      }
    }
  };

  // Controls
  const handleNextLevel = () => {
    const next = advanceToNextPinLevel(stateRef.current);
    stateRef.current = next;
    setUiLevel(next.level);
    setUiStatus('playing');
    setUiFood(0);
    setUiTargetFood(next.levelConfig.targetFoodCount);
    analytics.track('level_started', {
      gameId: 'barnyard-pin-pull',
      levelId: next.level,
    });
  };

  const handleRestart = () => {
    stateRef.current = initPinPullGame(stateRef.current.level);
    setUiStatus('playing');
    setUiFood(0);
    analytics.track('game_restarted', { gameId: 'barnyard-pin-pull' });
  };

  return (
    <div className="relative w-full h-[540px] sm:h-[620px] max-h-[82vh] min-h-[460px] max-w-lg mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/20 select-none touch-none overscroll-none">
      {/* 60 FPS Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        className="w-full h-full block cursor-pointer select-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Header HUD */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between pointer-events-none">
        {/* Level & Food Target */}
        <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-amber-500/30 shadow-lg">
          <div className="text-xs font-black text-amber-300">
            Level {uiLevel} • {PIN_LEVELS[uiLevel - 1]?.title}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono font-bold text-amber-200">
              🥕 {uiFood} / {uiTargetFood} Fed
            </span>
            <div className="w-20 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, (uiFood / uiTargetFood) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={handleRestart}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform cursor-pointer"
            aria-label="Restart level"
          >
            🔄
          </button>
          <button
            onClick={() => {
              const muted = pinPullAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Win Modal Overlay */}
      {uiStatus === 'won' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">🐶🎉🥕</div>
            <h3 className="text-2xl font-black text-amber-300">
              Barnaby is Rescued!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              You safely guided the farm harvest into the puppy's bowl without getting burned!
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              {uiLevel < PIN_LEVELS.length ? (
                <button
                  onClick={handleNextLevel}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
                >
                  Next Chamber ({uiLevel + 1}/{PIN_LEVELS.length}) 🚜
                </button>
              ) : (
                <button
                  onClick={handleRestart}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
                >
                  Play All Chambers Again 👑
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loss Modal Overlay */}
      {uiStatus === 'lost' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">🔥💔</div>
            <h3 className="text-2xl font-black text-red-400">
              Chamber Trapped!
            </h3>
            <p className="text-sm text-slate-300 mt-2">
              Hot lava or a sneaky fox reached the food first! Quench the lava with water next time.
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Try Chamber Again 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

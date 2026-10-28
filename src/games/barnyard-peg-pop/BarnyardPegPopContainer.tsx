import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  initPegPop,
  setCannonAngle,
  fireBall,
  updatePegPop,
  PEG_CONFIGS,
} from './logic/engine';
import { PegPopState } from './logic/types';
import { pegPopAudio } from './systems/sound';

export const BarnyardPegPopContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // High-performance mutable state in Ref for 60 FPS Canvas loop
  const gameStateRef = useRef<PegPopState>(initPegPop(1, 480, 640));
  const isDraggingRef = useRef<boolean>(false);

  // UI state for reactive React HUD updates
  const [uiScore, setUiScore] = useState<number>(0);
  const [uiBallsLeft, setUiBallsLeft] = useState<number>(10);
  const [uiOrangeRemaining, setUiOrangeRemaining] = useState<number>(6);
  const [uiStage, setUiStage] = useState<number>(1);
  const [uiStatus, setUiStatus] = useState<PegPopState['status']>('aiming');
  const [isMuted, setIsMuted] = useState<boolean>(pegPopAudio.getMuted());

  // Handle Level Restart
  const handleRestart = useCallback(() => {
    const width = canvasRef.current?.width || 480;
    const height = canvasRef.current?.height || 640;
    const newState = initPegPop(1, width, height);
    newState.highScore = Math.max(gameStateRef.current.highScore, gameStateRef.current.score);
    gameStateRef.current = newState;

    setUiScore(0);
    setUiBallsLeft(10);
    setUiOrangeRemaining(newState.orangePegsRemaining);
    setUiStage(1);
    setUiStatus('aiming');
  }, []);

  // Handle Next Stage
  const handleNextStage = useCallback(() => {
    const width = canvasRef.current?.width || 480;
    const height = canvasRef.current?.height || 640;
    const nextStage = Math.min(4, gameStateRef.current.stage + 1);
    const newState = initPegPop(nextStage, width, height);
    newState.score = gameStateRef.current.score;
    newState.highScore = gameStateRef.current.highScore;
    gameStateRef.current = newState;

    setUiScore(newState.score);
    setUiBallsLeft(10);
    setUiOrangeRemaining(newState.orangePegsRemaining);
    setUiStage(nextStage);
    setUiStatus('aiming');
  }, []);

  // Trigger Cannon Fire
  const handleFire = useCallback(() => {
    const { state: nextState, success } = fireBall(gameStateRef.current);
    if (success) {
      gameStateRef.current = nextState;
      pegPopAudio.playCannonFire();
      setUiBallsLeft(nextState.ballsLeft);
      setUiStatus('ball_active');

      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(25);
      }
    }
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
      gameStateRef.current.cannonX = rect.width / 2;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Aiming Pointer handlers
  const updateAimFromPointer = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const cannonX = gameStateRef.current.cannonX;
    const cannonY = gameStateRef.current.cannonY;

    const angle = Math.atan2(y - cannonY, x - cannonX);
    gameStateRef.current = setCannonAngle(gameStateRef.current, angle);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    updateAimFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current && gameStateRef.current.status === 'aiming') {
      handleFire();
    }
    isDraggingRef.current = false;
  };

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        handleFire();
      } else if (e.key === 'ArrowLeft') {
        const cur = gameStateRef.current.aimAngle;
        gameStateRef.current = setCannonAngle(gameStateRef.current, cur - 0.05);
      } else if (e.key === 'ArrowRight') {
        const cur = gameStateRef.current.aimAngle;
        gameStateRef.current = setCannonAngle(gameStateRef.current, cur + 0.05);
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = pegPopAudio.toggleMute();
        setIsMuted(muted);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFire, handleRestart]);

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.05, (time - lastTime) / 1000);
      lastTime = time;

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;

      // Update Engine
      const { state: updatedState, events } = updatePegPop(gameStateRef.current, dt);
      gameStateRef.current = updatedState;

      // Trigger Web Audio based on events
      events.forEach((evt) => {
        if (evt.type === 'peg_hit' && evt.pegType && evt.pegsHitCount) {
          pegPopAudio.playPegHit(evt.pegType, evt.pegsHitCount);
        } else if (evt.type === 'basket_catch') {
          pegPopAudio.playBasketCatch();
        } else if (evt.type === 'fever_started' || evt.type === 'stage_clear') {
          pegPopAudio.playFeverFanfare();
        } else if (evt.type === 'ball_lost') {
          pegPopAudio.playBallLost();
        }
      });

      // Update HUD state if values changed
      if (
        updatedState.score !== uiScore ||
        updatedState.ballsLeft !== uiBallsLeft ||
        updatedState.orangePegsRemaining !== uiOrangeRemaining ||
        updatedState.status !== uiStatus
      ) {
        setUiScore(updatedState.score);
        setUiBallsLeft(updatedState.ballsLeft);
        setUiOrangeRemaining(updatedState.orangePegsRemaining);
        setUiStatus(updatedState.status);
      }

      ctx.save();
      ctx.scale(dpr, dpr);

      // 1. Draw Pegboard Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.4, '#0f172a');
      bgGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Pegboard wooden borders
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.25)';
      ctx.lineWidth = 14;
      ctx.strokeRect(7, 7, width - 14, height - 14);

      // 2. Draw Aiming Line (when aiming)
      if (updatedState.status === 'aiming') {
        ctx.save();
        ctx.beginPath();
        const startX = updatedState.cannonX;
        const startY = updatedState.cannonY;
        const endX = startX + Math.cos(updatedState.aimAngle) * 360;
        const endY = startY + Math.sin(updatedState.aimAngle) * 360;

        ctx.setLineDash([6, 8]);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.75)';
        ctx.lineWidth = 3;
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Draw Pegs
      updatedState.pegs.forEach((peg) => {
        if (peg.fadeAlpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = peg.fadeAlpha;

        // Peg Drop Shadow
        ctx.beginPath();
        ctx.arc(peg.x, peg.y + 3, peg.radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fill();

        // Peg Body
        const cfg = PEG_CONFIGS[peg.type];
        const radGrad = ctx.createRadialGradient(
          peg.x - peg.radius * 0.35,
          peg.y - peg.radius * 0.35,
          1,
          peg.x,
          peg.y,
          peg.radius
        );

        if (peg.type === 'orange') {
          radGrad.addColorStop(0, '#fed7aa');
          radGrad.addColorStop(0.6, '#f97316');
          radGrad.addColorStop(1, '#c2410c');
        } else if (peg.type === 'purple') {
          radGrad.addColorStop(0, '#f5d0fe');
          radGrad.addColorStop(0.6, '#c084fc');
          radGrad.addColorStop(1, '#7e22ce');
        } else if (peg.type === 'green') {
          radGrad.addColorStop(0, '#bbf7d0');
          radGrad.addColorStop(0.6, '#22c55e');
          radGrad.addColorStop(1, '#15803d');
        } else {
          radGrad.addColorStop(0, '#bae6fd');
          radGrad.addColorStop(0.6, '#38bdf8');
          radGrad.addColorStop(1, '#0284c7');
        }

        ctx.beginPath();
        ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
        ctx.fillStyle = radGrad;
        ctx.fill();

        // Glowing ring for Orange targets
        if (peg.type === 'orange' && !peg.isHit) {
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#fef08a';
          ctx.stroke();
        }

        // Hit highlight
        if (peg.isHit) {
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#ffffff';
          ctx.stroke();
        }

        // Center Specular Glint
        ctx.beginPath();
        ctx.arc(peg.x - peg.radius * 0.35, peg.y - peg.radius * 0.35, peg.radius * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fill();

        ctx.restore();
      });

      // 4. Draw Catch Basket (Sliding Hay Cart)
      const b = updatedState.basket;
      ctx.save();
      // Wheels
      ctx.beginPath();
      ctx.arc(b.x - b.width * 0.4, b.y + b.height + 4, 10, 0, Math.PI * 2);
      ctx.arc(b.x + b.width * 0.4, b.y + b.height + 4, 10, 0, Math.PI * 2);
      ctx.fillStyle = '#451a03';
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#d97706';
      ctx.stroke();

      // Cart body
      ctx.fillStyle = '#78350f';
      ctx.fillRect(b.x - b.width / 2, b.y, b.width, b.height);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(b.x - b.width / 2, b.y, b.width, b.height);

      // Hay overflowing
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FREE BALL 🌰', b.x, b.y + 16);
      ctx.restore();

      // 5. Draw Bouncing Ball (Shiny Acorn Nut)
      const ball = updatedState.ball;
      if (ball) {
        ctx.save();
        ctx.translate(ball.x, ball.y);

        // Motion blur glow
        ctx.beginPath();
        ctx.arc(0, 0, ball.radius * 1.6, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.fill();

        // Acorn body
        const acornGrad = ctx.createRadialGradient(-3, -3, 1, 0, 0, ball.radius);
        acornGrad.addColorStop(0, '#fef08a');
        acornGrad.addColorStop(0.5, '#d97706');
        acornGrad.addColorStop(1, '#78350f');

        ctx.beginPath();
        ctx.arc(0, 0, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = acornGrad;
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#fef3c7';
        ctx.stroke();

        ctx.restore();
      }

      // 6. Draw Cannon (Top Center)
      ctx.save();
      ctx.translate(updatedState.cannonX, updatedState.cannonY);
      ctx.rotate(updatedState.aimAngle - Math.PI / 2);

      // Cannon Barrel
      const cannonGrad = ctx.createLinearGradient(-16, 0, 16, 0);
      cannonGrad.addColorStop(0, '#451a03');
      cannonGrad.addColorStop(0.5, '#92400e');
      cannonGrad.addColorStop(1, '#451a03');

      ctx.fillStyle = cannonGrad;
      ctx.fillRect(-14, 0, 28, 42);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#f59e0b';
      ctx.strokeRect(-14, 0, 28, 42);

      // Brass Muzzle ring
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-17, 36, 34, 7);

      ctx.restore();

      // Cannon Base Ring
      ctx.beginPath();
      ctx.arc(updatedState.cannonX, updatedState.cannonY, 26, 0, Math.PI * 2);
      ctx.fillStyle = '#78350f';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#d97706';
      ctx.stroke();
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐿️', updatedState.cannonX, updatedState.cannonY);

      // 7. Draw Sparkles
      updatedState.sparkles.forEach((sp) => {
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.radius, 0, Math.PI * 2);
        ctx.fillStyle = sp.color;
        ctx.globalAlpha = sp.alpha;
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      // 8. Draw Floating Texts
      updatedState.floatingTexts.forEach((t) => {
        ctx.save();
        ctx.font = '900 18px system-ui, -apple-system, sans-serif';
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
  }, [uiScore, uiBallsLeft, uiOrangeRemaining, uiStatus]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[520px] sm:h-[620px] rounded-3xl overflow-hidden bg-slate-950 border border-amber-500/30 shadow-2xl select-none"
      style={{ touchAction: 'none' }}
    >
      {/* 60 FPS Canvas */}
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full block cursor-pointer select-none"
        style={{ touchAction: 'none' }}
      />

      {/* Top Header HUD */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between pointer-events-none">
        {/* Stage & Targets Remaining */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/30 shadow-lg flex items-center gap-1.5">
            <span className="text-xs font-black text-amber-300">Stage {uiStage}</span>
          </div>

          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-orange-500/40 shadow-lg flex items-center gap-1">
            <span className="text-sm">🟠</span>
            <span className="text-xs font-black text-orange-400">{uiOrangeRemaining} targets</span>
          </div>
        </div>

        {/* Balls Left & Score & Controls */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Acorn Balls Left */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-amber-500/30 shadow-lg flex items-center gap-1">
            <span className="text-sm">🌰</span>
            <span className="text-xs font-black text-amber-300">x{uiBallsLeft}</span>
          </div>

          {/* Score Counter */}
          <div className="bg-slate-900/90 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-amber-500/30 shadow-lg">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-base font-black text-amber-300 leading-none">{uiScore}</div>
          </div>

          {/* Mute Button */}
          <button
            onClick={() => {
              const muted = pegPopAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          {/* Restart Button */}
          <button
            onClick={handleRestart}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-2xl bg-slate-900/90 backdrop-blur-md border border-amber-500/30 flex items-center justify-center text-lg shadow-lg active:scale-95 transition-transform cursor-pointer"
            aria-label="Restart level"
          >
            🔄
          </button>
        </div>
      </div>

      {/* On-Screen Fire Button for Mobile Thumb Convenience */}
      {uiStatus === 'aiming' && (
        <div className="absolute bottom-4 right-4 pointer-events-auto">
          <button
            onClick={handleFire}
            className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-sm shadow-xl active:scale-95 transition-transform flex items-center gap-2 cursor-pointer border border-amber-300/40 min-h-[44px]"
            aria-label="Fire acorn ball"
          >
            <span>🌰</span> FIRE!
          </button>
        </div>
      )}

      {/* Aim Hint for First Shot */}
      {uiScore === 0 && uiStatus === 'aiming' && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none animate-pulse">
          <div className="bg-slate-950/80 backdrop-blur-md border border-amber-400/40 px-4 py-1.5 rounded-full text-amber-200 text-xs font-bold shadow-xl flex items-center gap-1.5">
            <span>🐿️</span> Drag to aim, release or tap FIRE to launch acorn!
          </div>
        </div>
      )}

      {/* Stage Clear Modal */}
      {uiStatus === 'stage_cleared' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">🌰🌟🎉</div>
            <h3 className="text-2xl font-black text-amber-300">
              Stage {uiStage} Cleared!
            </h3>
            <p className="text-slate-300 text-sm mt-2">
              All orange targets cleared! Current score: <strong className="text-amber-300">{uiScore}</strong>
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleNextStage}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Next Pegboard (Stage {uiStage + 1}/4) 🎯
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Victory Modal */}
      {uiStatus === 'victory' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">🌰👑🌈</div>
            <h3 className="text-2xl font-black text-emerald-300">
              Extreme Fever Champion!
            </h3>
            <p className="text-slate-300 text-sm mt-2">
              You cleared all four barnyard pegboards with an incredible score of <strong className="text-amber-300">{uiScore}</strong>!
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Play Peg Pop Again 🌰
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Modal */}
      {uiStatus === 'game_over' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 z-20">
          <div className="bg-slate-900 border border-red-500/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="text-5xl mb-3">🌰💔</div>
            <h3 className="text-2xl font-black text-red-400">
              Out of Acorns!
            </h3>
            <p className="text-slate-300 text-sm mt-2">
              {uiOrangeRemaining} orange targets remained. Final Score: <strong className="text-amber-300">{uiScore}</strong>
            </p>
            <div className="mt-5 flex flex-col gap-2.5">
              <button
                onClick={handleRestart}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-black text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all min-h-[44px] cursor-pointer"
              >
                Try Again 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

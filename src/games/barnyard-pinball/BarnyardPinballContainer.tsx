import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PinballState,
  Ball,
  Flipper,
  Bumper,
  RolloverLane,
  Slingshot,
} from './logic/types';
import {
  createInitialState,
  startPlungerCharge,
  releasePlunger,
  setFlipper,
  restartGame,
  updateEngine,
  TABLE_WIDTH,
  TABLE_HEIGHT,
} from './logic/engine';
import { pinballAudio } from './systems/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface ScorePopup {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  scale: number;
}

export const BarnyardPinballContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_pinball_hi');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<PinballState>(createInitialState(highScore));
  const [hudState, setHudState] = useState<{
    score: number;
    ballsRemaining: number;
    multiplier: number;
    status: 'ready' | 'playing' | 'game_over';
    isPlungerCharging: boolean;
    plungerCharge: number;
    multiballActive: boolean;
  }>({
    score: 0,
    ballsRemaining: 3,
    multiplier: 1,
    status: 'ready',
    isPlungerCharging: false,
    plungerCharge: 0,
    multiballActive: false,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => pinballAudio.getMuted());
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const isLeftDownRef = useRef<boolean>(false);
  const isRightDownRef = useRef<boolean>(false);

  const spawnSparkles = (x: number, y: number, color: string = '#facc15', count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        alpha: 1,
        color,
        size: 3 + Math.random() * 3,
      });
    }
  };

  const spawnPopup = (x: number, y: number, text: string, color: string = '#facc15') => {
    popupsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      scale: 1.2,
    });
  };

  const handleFlipperEngage = useCallback((side: 'left' | 'right' | 'both', engaged: boolean) => {
    const res = setFlipper(stateRef.current, side, engaged);
    stateRef.current = res.state;
    if (res.event) {
      pinballAudio.playFlipper();
    }
  }, []);

  const handlePlungerPress = () => {
    stateRef.current = startPlungerCharge(stateRef.current);
  };

  const handlePlungerRelease = () => {
    const res = releasePlunger(stateRef.current);
    stateRef.current = res.state;
    if (res.event) {
      pinballAudio.playPlungerRelease();
      spawnSparkles(378, 520, '#fde047', 15);
    }
  };

  const handleRestart = () => {
    stateRef.current = restartGame(stateRef.current);
    particlesRef.current = [];
    popupsRef.current = [];
  };

  const activePointersRef = useRef<Map<number, 'left' | 'right' | 'plunger'>>(new Map());

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (TABLE_WIDTH / rect.width);
    const clickY = (e.clientY - rect.top) * (TABLE_HEIGHT / rect.height);

    if (clickX > 360 && clickY > 350) {
      activePointersRef.current.set(e.pointerId, 'plunger');
      handlePlungerPress();
      return;
    }

    const side: 'left' | 'right' = clickX < TABLE_WIDTH / 2 ? 'left' : 'right';
    activePointersRef.current.set(e.pointerId, side);
    handleFlipperEngage(side, true);
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const action = activePointersRef.current.get(e.pointerId);
    if (!action) return;
    activePointersRef.current.delete(e.pointerId);

    if (action === 'plunger') {
      handlePlungerRelease();
    } else {
      const stillPressed = Array.from(activePointersRef.current.values()).includes(action);
      if (!stillPressed) {
        handleFlipperEngage(action, false);
      }
    }
  };

  const toggleSound = () => {
    const next = pinballAudio.toggleMute();
    setIsMuted(next);
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'z' || e.key === 'Z') {
        isLeftDownRef.current = true;
        handleFlipperEngage('left', true);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '/') {
        isRightDownRef.current = true;
        handleFlipperEngage('right', true);
      } else if (e.key === 'ArrowDown' || e.key === ' ') {
        handlePlungerPress();
      } else if (e.key === 'ArrowUp') {
        handleFlipperEngage('both', true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'z' || e.key === 'Z') {
        isLeftDownRef.current = false;
        handleFlipperEngage('left', false);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === '/') {
        isRightDownRef.current = false;
        handleFlipperEngage('right', false);
      } else if (e.key === 'ArrowDown' || e.key === ' ') {
        handlePlungerRelease();
      } else if (e.key === 'ArrowUp') {
        handleFlipperEngage('both', false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleFlipperEngage]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = Math.min(0.04, Math.max(0.001, (currentTime - lastTime) / 1000));
      lastTime = currentTime;

      const engineRes = updateEngine(stateRef.current, dt);
      stateRef.current = engineRes.state;

      // Handle Engine Events
      engineRes.events.forEach((ev) => {
        if (ev.type === 'bumper_hit') {
          pinballAudio.playBumperHit(ev.bumperId);
          const bumper = stateRef.current.bumpers.find((b) => b.id === ev.bumperId);
          if (bumper) {
            spawnSparkles(bumper.x, bumper.y, bumper.color, 12);
            spawnPopup(bumper.x, bumper.y - 18, `+${ev.points}`, bumper.color);
          }
        } else if (ev.type === 'slingshot_hit') {
          pinballAudio.playSlingshot();
          const slingX = ev.side === 'left' ? 100 : 300;
          spawnSparkles(slingX, 430, '#fbbf24', 8);
          spawnPopup(slingX, 420, `+${ev.points}`, '#fde047');
        } else if (ev.type === 'rollover_lit') {
          pinballAudio.playRollover();
          if (ev.allLit) {
            spawnPopup(200, 100, `FARM BONUS! ${ev.multiplier}X`, '#facc15');
            spawnSparkles(200, 100, '#fde047', 20);
          }
        } else if (ev.type === 'multiball_started') {
          pinballAudio.playMultiball();
          spawnPopup(200, 200, 'MULTIBALL FRENZY!', '#38bdf8');
          spawnSparkles(200, 200, '#38bdf8', 30);
        } else if (ev.type === 'ball_drained') {
          pinballAudio.playDrain();
          if (ev.remainingBalls === 0) {
            pinballAudio.playGameOver();
            if (stateRef.current.score > highScore) {
              setHighScore(stateRef.current.score);
              try {
                localStorage.setItem('pawcade_pinball_hi', stateRef.current.score.toString());
              } catch {}
            }
          }
        }
      });

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 140 * dt;
        p.alpha -= dt * 2.0;
        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
        }
      }

      // Update Popups
      for (let i = popupsRef.current.length - 1; i >= 0; i--) {
        const pop = popupsRef.current[i];
        pop.y -= 45 * dt;
        pop.alpha -= dt * 1.5;
        if (pop.alpha <= 0) {
          popupsRef.current.splice(i, 1);
        }
      }

      // Update React HUD
      const st = stateRef.current;
      setHudState({
        score: st.score,
        ballsRemaining: st.ballsRemaining,
        multiplier: st.multiplier,
        status: st.status,
        isPlungerCharging: st.isPlungerCharging,
        plungerCharge: st.plungerCharge,
        multiballActive: st.multiballActive,
      });

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCanvas(ctx, st, currentTime / 1000);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  // Canvas 2D Rendering
  const renderCanvas = (ctx: CanvasRenderingContext2D, state: PinballState, time: number) => {
    ctx.save();
    ctx.clearRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // 1. Playfield Board Background (Lush Countryside Green Felt)
    const bgGrad = ctx.createRadialGradient(200, 240, 20, 200, 300, 320);
    bgGrad.addColorStop(0, '#15803d');
    bgGrad.addColorStop(0.7, '#166534');
    bgGrad.addColorStop(1, '#14532d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, TABLE_WIDTH, TABLE_HEIGHT);

    // Decorative Field Silo & Pasture Art
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 360, 560);

    // 2. Plunger Lane & Divider Wall (x: 360)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(362, 100, 34, 480);

    // Plunger Divider Wall
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(360, 100, 3, 460);

    // Plunger Spring Coil
    const springBottom = 545;
    const compression = state.plungerCharge * 40;
    const springTop = 505 + compression;

    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(378, springBottom);
    for (let sy = springBottom; sy > springTop; sy -= 6) {
      const sx = sy % 12 === 0 ? 372 : 384;
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(378, springTop);
    ctx.stroke();

    // Plunger Tip
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(368, springTop - 6, 20, 10, 3);
    ctx.fill();

    // 3. Top Curved Arch Ceiling
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(195, 90, 175, Math.PI, 0, false);
    ctx.stroke();

    // 4. Rollover Lanes (F - A - R - M)
    state.rolloverLanes.forEach((lane) => {
      ctx.save();
      ctx.fillStyle = lane.isLit ? '#fde047' : '#0f172a';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      if (lane.isLit) {
        ctx.shadowColor = '#fde047';
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.roundRect(lane.x - lane.width / 2, lane.y - lane.height / 2, lane.width, lane.height, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = lane.isLit ? '#0f172a' : '#fde047';
      ctx.font = '900 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lane.letter, lane.x, lane.y);
      ctx.restore();
    });

    // 5. 3 Illuminated Mushroom Bumpers
    state.bumpers.forEach((bmp) => {
      ctx.save();
      const isFlashing = bmp.hitTimer > 0;
      const flashScale = isFlashing ? 1.15 : 1.0;

      ctx.translate(bmp.x, bmp.y);
      ctx.scale(flashScale, flashScale);

      // Bumper Outer Glow
      if (isFlashing) {
        ctx.fillStyle = bmp.color;
        ctx.shadowColor = bmp.color;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(0, 0, bmp.radius + 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Outer Cap
      ctx.fillStyle = bmp.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(0, 0, bmp.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Inner Core
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, bmp.radius * 0.65, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bmp.label, 0, 0);

      ctx.restore();
    });

    // 6. Slingshots (Rubber Kickers)
    state.slingshots.forEach((sling) => {
      ctx.save();
      const isHit = sling.hitTimer > 0;
      ctx.fillStyle = isHit ? '#fde047' : '#b45309';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;

      if (sling.side === 'left') {
        ctx.beginPath();
        ctx.moveTo(35, 400);
        ctx.lineTo(110, 475);
        ctx.lineTo(35, 475);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.moveTo(345, 400);
        ctx.lineTo(290, 475);
        ctx.lineTo(345, 475);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }

      // Rubber Band Line
      ctx.strokeStyle = isHit ? '#ffffff' : '#fbbf24';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(sling.x1, sling.y1);
      ctx.lineTo(sling.x2, sling.y2);
      ctx.stroke();

      ctx.restore();
    });

    // 7. Left & Right Bottom Guide Rails to Flippers
    ctx.strokeStyle = '#ca8a04';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(60, 470);
    ctx.lineTo(130, 520);
    ctx.moveTo(340, 470);
    ctx.lineTo(270, 520);
    ctx.stroke();

    // 8. Dual Flippers
    renderFlipper(ctx, state.leftFlipper);
    renderFlipper(ctx, state.rightFlipper);

    // 9. Pinball Balls & Motion Trails
    state.balls.forEach((ball) => {
      // Trail
      ball.trail.forEach((t) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, t.alpha);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(t.x, t.y, ball.radius * 0.75, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Chrome Sphere
      ctx.save();
      const chrome = ctx.createRadialGradient(
        ball.x - 3,
        ball.y - 3,
        1,
        ball.x,
        ball.y,
        ball.radius
      );
      chrome.addColorStop(0, '#ffffff');
      chrome.addColorStop(0.4, '#e2e8f0');
      chrome.addColorStop(0.8, '#94a3b8');
      chrome.addColorStop(1, '#334155');

      ctx.fillStyle = chrome;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // 10. Sparkle Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 11. Score Popups
    popupsRef.current.forEach((pop) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '900 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    ctx.restore();
  };

  const renderFlipper = (ctx: CanvasRenderingContext2D, flipper: Flipper) => {
    ctx.save();
    ctx.translate(flipper.pivotX, flipper.pivotY);
    ctx.rotate(flipper.currentAngle);

    // Pivot Bushing
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Flipper Blade
    ctx.fillStyle = '#ea580c';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(-4, -7, flipper.length, 14, 5);
    ctx.fill();
    ctx.stroke();

    // Inner White Stripe
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(8, -2, flipper.length - 16, 4, 2);
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[420px] mx-auto select-none touch-none">
      {/* Top Header Stats Bar */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-t-2xl p-3 flex items-center justify-between text-white shadow-lg">
        {/* Balls Remaining */}
        <div className="flex items-center space-x-1.5">
          <span className="text-xs text-slate-400 font-bold mr-1">BALLS:</span>
          {[1, 2, 3].map((b) => (
            <span
              key={b}
              className={`w-4 h-4 rounded-full border transition-all ${
                b <= hudState.ballsRemaining
                  ? 'bg-amber-400 border-amber-200 shadow-[0_0_8px_rgba(251,191,36,0.8)] scale-100'
                  : 'bg-slate-800 border-slate-700 opacity-30 scale-90'
              }`}
            />
          ))}
        </div>

        {/* Score & Multiplier */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-black text-amber-300 tracking-wide">
            🏆 {hudState.score.toLocaleString()}
          </div>
          {hudState.multiplier > 1 && (
            <div className="text-xs font-black text-orange-400 animate-pulse">
              ⚡ {hudState.multiplier}X MULTIPLIER!
            </div>
          )}
        </div>

        {/* Controls / High Score */}
        <div className="flex items-center space-x-1.5">
          <div className="text-right text-xs text-slate-400">
            <div>BEST</div>
            <div className="font-bold text-amber-200">{highScore.toLocaleString()}</div>
          </div>
          <button
            onClick={toggleSound}
            className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-base border border-slate-700 transition touch-manipulation"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestart}
            className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-sm border border-slate-700 transition text-slate-300 hover:text-white touch-manipulation"
            aria-label="Restart Machine"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Multiball Alert Banner */}
      {hudState.multiballActive && (
        <div className="w-full bg-gradient-to-r from-sky-500 via-amber-400 to-sky-500 text-slate-950 font-black text-xs py-1 text-center tracking-wider animate-bounce shadow-md">
          ⚡ MULTIBALL FRENZY! 2 BALLS IN PLAY! ⚡
        </div>
      )}

      {/* Main Interactive Canvas Table */}
      <div className="relative w-full aspect-[400/600] bg-slate-950 overflow-hidden shadow-2xl border-x border-slate-800 touch-none">
        <canvas
          ref={canvasRef}
          width={TABLE_WIDTH}
          height={TABLE_HEIGHT}
          onPointerDown={handleCanvasPointerDown}
          onPointerUp={handleCanvasPointerUp}
          onPointerCancel={handleCanvasPointerUp}
          onPointerLeave={handleCanvasPointerUp}
          className="w-full h-full cursor-pointer touch-none select-none"
        />

        {/* Ready Overlay */}
        {hudState.status === 'ready' && (
          <div className="absolute inset-x-0 bottom-24 flex justify-center pointer-events-none px-4">
            <div className="bg-slate-900/85 backdrop-blur text-white text-xs font-black px-4 py-2 rounded-full border border-amber-400/60 animate-pulse shadow-lg">
              👇 PULL & RELEASE PLUNGER TO LAUNCH!
            </div>
          </div>
        )}
      </div>

      {/* Bottom Large Touch Controls for Mobile */}
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded-b-2xl p-2.5 flex space-x-2">
        {/* Left Flipper Button */}
        <button
          onPointerDown={() => handleFlipperEngage('left', true)}
          onPointerUp={() => handleFlipperEngage('left', false)}
          onPointerLeave={() => handleFlipperEngage('left', false)}
          onPointerCancel={() => handleFlipperEngage('left', false)}
          className="flex-1 min-h-[54px] rounded-xl font-black text-xs sm:text-sm transition-all duration-150 flex items-center justify-center space-x-1 border active:scale-95 bg-orange-600 hover:bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.4)] touch-manipulation"
        >
          <span>⬅️</span>
          <span>LEFT FLIPPER</span>
        </button>

        {/* Plunger Button */}
        <button
          onPointerDown={handlePlungerPress}
          onPointerUp={handlePlungerRelease}
          onPointerLeave={handlePlungerRelease}
          onPointerCancel={handlePlungerRelease}
          className={`px-3 sm:px-4 min-h-[54px] rounded-xl font-black text-xs transition-all duration-150 flex flex-col items-center justify-center border active:scale-95 touch-manipulation ${
            hudState.isPlungerCharging
              ? 'bg-red-600 text-white border-red-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.6)]'
              : 'bg-slate-800 text-amber-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <span>🚀</span>
          <span>{hudState.isPlungerCharging ? `${Math.round(hudState.plungerCharge * 100)}%` : 'LAUNCH'}</span>
        </button>

        {/* Right Flipper Button */}
        <button
          onPointerDown={() => handleFlipperEngage('right', true)}
          onPointerUp={() => handleFlipperEngage('right', false)}
          onPointerLeave={() => handleFlipperEngage('right', false)}
          onPointerCancel={() => handleFlipperEngage('right', false)}
          className="flex-1 min-h-[54px] rounded-xl font-black text-xs sm:text-sm transition-all duration-150 flex items-center justify-center space-x-1 border active:scale-95 bg-orange-600 hover:bg-orange-500 text-white border-orange-400 shadow-[0_0_15px_rgba(234,88,12,0.4)] touch-manipulation"
        >
          <span>RIGHT FLIPPER</span>
          <span>➡️</span>
        </button>
      </div>

      {/* Game Over Dialog */}
      {hudState.status === 'game_over' && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 rounded-2xl animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center text-white max-w-xs w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-2">🕹️💥</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">TABLE TILT!</h2>
            <p className="text-xs text-slate-400 mb-4">All 3 balls have drained!</p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-4 space-y-2 border border-slate-700/60">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Final Score:</span>
                <span className="font-bold text-amber-300">{hudState.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Best Score:</span>
                <span className="font-bold text-amber-200">{highScore.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-base rounded-xl shadow-lg active:scale-95 transition touch-manipulation"
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

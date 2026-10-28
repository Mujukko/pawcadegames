import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  SheepSorterState,
  RunningSheep,
  GateDirection,
  SheepColor,
} from './logic/types';
import {
  createInitialState,
  switchGate,
  restartGame,
  updateEngine,
  GATE_JUNCTION_Y,
  RUNWAY_X,
} from './logic/engine';
import { sheepSorterAudio } from './systems/sound';

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

export const SheepSorterGateContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_sheep_sorter_hi');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<SheepSorterState>(createInitialState(highScore));
  const [hudState, setHudState] = useState<{
    score: number;
    lives: number;
    combo: number;
    gateDir: GateDirection;
    feverActive: boolean;
    feverTimer: number;
    isGameOver: boolean;
    totalSorted: number;
  }>({
    score: 0,
    lives: 3,
    combo: 0,
    gateDir: 'left',
    feverActive: false,
    feverTimer: 0,
    isGameOver: false,
    totalSorted: 0,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => sheepSorterAudio.getMuted());
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);
  const shakeRef = useRef<number>(0);

  const spawnSparkles = (x: number, y: number, color: string = '#facc15', count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
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

  const handleFlip = useCallback((targetDir?: GateDirection) => {
    const res = switchGate(stateRef.current, targetDir);
    if (res.event) {
      stateRef.current = res.state;
      sheepSorterAudio.playGateSwitch();
      spawnSparkles(RUNWAY_X, GATE_JUNCTION_Y, '#fbbf24', 6);
    }
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 420 / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;

    if (clickX < 210) {
      handleFlip('left');
    } else {
      handleFlip('right');
    }
  };

  const handleRestart = () => {
    stateRef.current = restartGame(stateRef.current);
    particlesRef.current = [];
    popupsRef.current = [];
    shakeRef.current = 0;
  };

  const toggleSound = () => {
    const next = sheepSorterAudio.toggleMute();
    setIsMuted(next);
  };

  // Keyboard controls for desktop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handleFlip('left');
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handleFlip('right');
      } else if (e.key === ' ') {
        handleFlip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFlip]);

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
        if (ev.type === 'sheep_sorted') {
          if (ev.isCorrect) {
            sheepSorterAudio.playSheepSorted(true, ev.combo);
            const popupColor = ev.sheep.color === 'golden' ? '#fde047' : '#4ade80';
            spawnPopup(RUNWAY_X, GATE_JUNCTION_Y - 20, `+${ev.points}`, popupColor);
            spawnSparkles(RUNWAY_X, GATE_JUNCTION_Y, popupColor, 12);
          } else {
            sheepSorterAudio.playSheepSorted(false, 0);
            shakeRef.current = 0.25;
            spawnPopup(RUNWAY_X, GATE_JUNCTION_Y - 20, 'MISS!', '#ef4444');
            spawnSparkles(RUNWAY_X, GATE_JUNCTION_Y, '#ef4444', 15);
          }
        } else if (ev.type === 'fever_activated') {
          sheepSorterAudio.playFeverFanfare();
          spawnPopup(210, 200, 'GOLDEN FEVER!', '#facc15');
          spawnSparkles(210, 200, '#fde047', 25);
        } else if (ev.type === 'life_lost' && ev.remainingLives === 0) {
          sheepSorterAudio.playGameOver();
          if (stateRef.current.score > highScore) {
            setHighScore(stateRef.current.score);
            try {
              localStorage.setItem('pawcade_sheep_sorter_hi', stateRef.current.score.toString());
            } catch {}
          }
        }
      });

      // Update Screen Shake
      if (shakeRef.current > 0) {
        shakeRef.current = Math.max(0, shakeRef.current - dt);
      }

      // Update Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 120 * dt; // gravity
        p.alpha -= dt * 1.8;
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
        lives: st.lives,
        combo: st.combo,
        gateDir: st.gateDir,
        feverActive: st.feverActive,
        feverTimer: st.feverTimer,
        isGameOver: st.status === 'game_over',
        totalSorted: st.totalSorted,
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
  const renderCanvas = (ctx: CanvasRenderingContext2D, state: SheepSorterState, time: number) => {
    ctx.save();
    ctx.clearRect(0, 0, 420, 540);

    // Apply Screen Shake
    if (shakeRef.current > 0) {
      const intensity = shakeRef.current * 12;
      const ox = (Math.random() - 0.5) * intensity;
      const oy = (Math.random() - 0.5) * intensity;
      ctx.translate(ox, oy);
    }

    // 1. Dual Pasture Background (Left: Emerald, Right: Golden Amber)
    ctx.fillStyle = '#16a34a'; // left lush green
    ctx.fillRect(0, 0, 210, 540);

    ctx.fillStyle = '#d97706'; // right golden meadow
    ctx.fillRect(210, 0, 210, 540);

    // Left Grass Clumps
    ctx.fillStyle = '#22c55e';
    for (let gy = 40; gy < 540; gy += 60) {
      ctx.beginPath();
      ctx.arc(60 + (gy % 40), gy, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // Right Meadow Clumps
    ctx.fillStyle = '#f59e0b';
    for (let gy = 50; gy < 540; gy += 60) {
      ctx.beginPath();
      ctx.arc(320 + (gy % 50), gy, 14, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Central Runway Dirt Track
    ctx.fillStyle = '#fef3c7'; // warm dirt runway
    ctx.fillRect(150, 0, 120, 540);

    // Runway Fences
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(150, 0);
    ctx.lineTo(150, 540);
    ctx.moveTo(270, 0);
    ctx.lineTo(270, 540);
    ctx.stroke();

    // Fence Posts
    ctx.fillStyle = '#92400e';
    for (let fy = 30; fy < 540; fy += 55) {
      ctx.fillRect(144, fy, 12, 16);
      ctx.fillRect(264, fy, 12, 16);
    }

    // Center Dash Line on Runway
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 10]);
    ctx.beginPath();
    ctx.moveTo(RUNWAY_X, 0);
    ctx.lineTo(RUNWAY_X, GATE_JUNCTION_Y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 3. Signs & Indicators
    // Left Corral Sign (White / Pink)
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0,0,0,0.2)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(14, 120, 120, 64, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('WHITE & PINK', 74, 142);
    ctx.font = '20px sans-serif';
    ctx.fillText('⚪ 🌸', 74, 168);
    ctx.restore();

    // Right Corral Sign (Black / Gold)
    ctx.save();
    ctx.fillStyle = '#1e293b';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(286, 120, 120, 64, 10);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BLACK & GOLD', 346, 142);
    ctx.font = '20px sans-serif';
    ctx.fillText('⚫ ⭐', 346, 168);
    ctx.restore();

    // 4. Draw Incoming Sheep
    state.sheepList.forEach((sheep) => {
      renderSheep(ctx, sheep, time);
    });

    // 5. Draw Pasture Gate Junction & Swinging Wooden Gate
    // Gate Hinge Post
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(RUNWAY_X, GATE_JUNCTION_Y, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Gate Paddle with Angle Lerp (-1 -> left, +1 -> right)
    ctx.save();
    ctx.translate(RUNWAY_X, GATE_JUNCTION_Y);
    const rad = state.gateAngle * 0.72; // ~41 degrees swing
    ctx.rotate(rad);

    // Gate Bar (Wood)
    ctx.fillStyle = '#b45309';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 3;
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(-6, -10, 115, 20, 6);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.stroke();

    // Wood Plank Bolts
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(25, 0, 3.5, 0, Math.PI * 2);
    ctx.arc(80, 0, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Directional Arrow on Gate Bar
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(92, -6);
    ctx.lineTo(105, 0);
    ctx.lineTo(92, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 6. Active Arrow Indicators in Corrals
    const pulse = 1 + Math.sin(time * 8) * 0.12;
    if (state.gateDir === 'left') {
      ctx.save();
      ctx.translate(110, GATE_JUNCTION_Y + 70);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⬅️', 0, 0);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(310, GATE_JUNCTION_Y + 70);
      ctx.scale(pulse, pulse);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('➡️', 0, 0);
      ctx.restore();
    }

    // 7. Render Sparkle Particles
    particlesRef.current.forEach((p) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.alpha);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 8. Render Floating Score Popups
    popupsRef.current.forEach((pop) => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pop.alpha);
      ctx.fillStyle = pop.color;
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 3;
      ctx.font = '900 22px sans-serif';
      ctx.textAlign = 'center';
      ctx.strokeText(pop.text, pop.x, pop.y);
      ctx.fillText(pop.text, pop.x, pop.y);
      ctx.restore();
    });

    ctx.restore();
  };

  // Render Individual Fluffy Sheep
  const renderSheep = (ctx: CanvasRenderingContext2D, sheep: RunningSheep, time: number) => {
    ctx.save();

    // Lateral displacement once sorted past gate
    let posX = RUNWAY_X;
    if (sheep.y > GATE_JUNCTION_Y) {
      const exitProgress = (sheep.y - GATE_JUNCTION_Y) / 140;
      if (sheep.targetGate === 'left') {
        posX -= exitProgress * 110;
      } else {
        posX += exitProgress * 110;
      }
    }

    const bob = Math.sin(time * 14 + sheep.bobOffset) * 3;
    ctx.translate(posX, sheep.y + bob);

    // Sheep Wool Color Palettes
    let bodyColor = '#ffffff';
    let outlineColor = '#cbd5e1';
    let faceColor = '#f8fafc';
    let earColor = '#fbcfe8';
    let blushColor = '#f472b6';

    if (sheep.color === 'black') {
      bodyColor = '#334155';
      outlineColor = '#1e293b';
      faceColor = '#475569';
      earColor = '#64748b';
      blushColor = '#94a3b8';
    } else if (sheep.color === 'pink') {
      bodyColor = '#fce7f3';
      outlineColor = '#f472b6';
      faceColor = '#fdf2f8';
      earColor = '#f43f5e';
      blushColor = '#fb7185';
    } else if (sheep.color === 'golden') {
      bodyColor = '#fef08a';
      outlineColor = '#eab308';
      faceColor = '#fef9c3';
      earColor = '#ca8a04';
      blushColor = '#f59e0b';
    }

    // Shadow below sheep
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 22, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // Trot Feet
    const footBob = Math.sin(time * 16 + sheep.bobOffset) * 4;
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-10, 12 + footBob, 4, 0, Math.PI * 2);
    ctx.arc(10, 12 - footBob, 4, 0, Math.PI * 2);
    ctx.fill();

    // Wool Cloud Body (Multi-circle fluffy puffs)
    ctx.fillStyle = bodyColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2.5;

    // Body cloud puffs
    const puffs = [
      { x: -14, y: -8, r: 12 },
      { x: 0, y: -12, r: 13 },
      { x: 14, y: -8, r: 12 },
      { x: -15, y: 6, r: 11 },
      { x: 0, y: 8, r: 13 },
      { x: 15, y: 6, r: 11 },
    ];
    puffs.forEach((p) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // Face Head
    ctx.fillStyle = faceColor;
    ctx.strokeStyle = outlineColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, -4, 13, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Ears
    ctx.fillStyle = earColor;
    ctx.beginPath();
    ctx.ellipse(-14, -8, 6, 3.5, -0.3, 0, Math.PI * 2);
    ctx.ellipse(14, -8, 6, 3.5, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = sheep.color === 'black' ? '#ffffff' : '#0f172a';
    ctx.beginPath();
    ctx.arc(-4, -5, 2, 0, Math.PI * 2);
    ctx.arc(4, -5, 2, 0, Math.PI * 2);
    ctx.fill();

    // Rosy Cheeks
    ctx.fillStyle = blushColor;
    ctx.beginPath();
    ctx.arc(-7, -2, 2.5, 0, Math.PI * 2);
    ctx.arc(7, -2, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Golden Sparkles on Golden Sheep
    if (sheep.color === 'golden') {
      ctx.fillStyle = '#ca8a04';
      ctx.font = '12px sans-serif';
      ctx.fillText('✨', -18, -14);
      ctx.fillText('⭐', 10, -16);
    }

    ctx.restore();
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full max-w-[440px] mx-auto select-none touch-none">
      {/* Top Header Stats Bar */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-t-2xl p-3 flex items-center justify-between text-white shadow-lg">
        {/* Lives */}
        <div className="flex items-center space-x-1">
          {[1, 2, 3].map((heart) => (
            <span
              key={heart}
              className={`text-xl transition-all duration-200 ${
                heart <= hudState.lives ? 'scale-100 opacity-100' : 'scale-90 opacity-25 grayscale'
              }`}
            >
              ❤️
            </span>
          ))}
        </div>

        {/* Score & Combo */}
        <div className="flex flex-col items-center">
          <div className="text-xl font-black text-amber-300 tracking-wide">
            🏆 {hudState.score.toLocaleString()}
          </div>
          {hudState.combo > 1 && (
            <div className="text-xs font-bold text-orange-400 animate-pulse">
              🔥 {hudState.combo} COMBO!
            </div>
          )}
        </div>

        {/* Controls / High Score */}
        <div className="flex items-center space-x-2">
          <div className="text-right text-xs text-slate-400">
            <div>BEST</div>
            <div className="font-bold text-amber-200">{highScore}</div>
          </div>
          <button
            onClick={toggleSound}
            className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-lg border border-slate-700 transition"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Golden Fever Indicator */}
      {hudState.feverActive && (
        <div className="w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs py-1 text-center tracking-wider animate-bounce shadow-md">
          ⚡ GOLDEN FEVER ACTIVE! 2X SCORE! ({hudState.feverTimer.toFixed(1)}s) ⚡
        </div>
      )}

      {/* Main Interactive Canvas */}
      <div className="relative w-full aspect-[420/540] bg-slate-950 overflow-hidden shadow-2xl border-x border-slate-800">
        <canvas
          ref={canvasRef}
          width={420}
          height={540}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full cursor-pointer touch-none select-none"
        />

        {/* Overlay Instructions for First Time */}
        {hudState.totalSorted < 3 && !hudState.isGameOver && (
          <div className="absolute inset-x-0 bottom-16 flex justify-around pointer-events-none px-4">
            <div className="bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-emerald-500/50 animate-pulse">
              👈 TAP LEFT
            </div>
            <div className="bg-slate-900/80 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-amber-500/50 animate-pulse">
              TAP RIGHT 👉
            </div>
          </div>
        )}
      </div>

      {/* Bottom Large Touch Controls for Mobile */}
      <div className="w-full bg-slate-900/95 border border-slate-800 rounded-b-2xl p-2.5 flex space-x-2">
        <button
          onClick={() => handleFlip('left')}
          className={`flex-1 min-h-[52px] rounded-xl font-black text-sm transition-all duration-150 flex items-center justify-center space-x-1.5 border active:scale-95 ${
            hudState.gateDir === 'left'
              ? 'bg-emerald-600 text-white border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)]'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <span>⬅️</span>
          <span>LEFT (White/Pink)</span>
        </button>

        <button
          onClick={() => handleFlip('right')}
          className={`flex-1 min-h-[52px] rounded-xl font-black text-sm transition-all duration-150 flex items-center justify-center space-x-1.5 border active:scale-95 ${
            hudState.gateDir === 'right'
              ? 'bg-amber-600 text-white border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
          }`}
        >
          <span>RIGHT (Black/Gold)</span>
          <span>➡️</span>
        </button>
      </div>

      {/* Game Over Dialog */}
      {hudState.isGameOver && (
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 rounded-2xl animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-2xl p-6 text-center text-white max-w-xs w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-2">🐑💥</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1">PASTURE OVERFLOW!</h2>
            <p className="text-xs text-slate-400 mb-4">A sheep slipped into the wrong corral!</p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-4 space-y-2 border border-slate-700/60">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Final Score:</span>
                <span className="font-bold text-amber-300">{hudState.score.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Sheep Sorted:</span>
                <span className="font-bold text-white">{hudState.totalSorted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Best Score:</span>
                <span className="font-bold text-amber-200">{highScore.toLocaleString()}</span>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-base rounded-xl shadow-lg active:scale-95 transition"
            >
              PLAY AGAIN 🔄
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

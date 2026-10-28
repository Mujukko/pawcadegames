import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PlinkoState,
  PlinkoBottle,
  PlinkoPeg,
  PlinkoBucket,
  BottleType,
} from './logic/types';
import {
  createInitialState,
  dropBottle,
  activateFrenzy,
  refillBottles,
  updateEngine,
  WALL_LEFT,
  WALL_RIGHT,
  BUCKET_TOP_Y,
} from './logic/engine';
import { plinkoAudio } from './systems/sound';

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

export const MilkBottlePlinkoContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_plinko_hi');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<PlinkoState>(createInitialState(highScore));
  const [hudState, setHudState] = useState<{
    bottles: number;
    score: number;
    frenzyMeter: number;
    frenzyActive: boolean;
    frenzyTimer: number;
    isGameOver: boolean;
  }>({
    bottles: 30,
    score: 0,
    frenzyMeter: 25,
    frenzyActive: false,
    frenzyTimer: 0,
    isGameOver: false,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => plinkoAudio.getMuted());
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<ScorePopup[]>([]);

  const spawnSparkles = (x: number, y: number, color: string = '#facc15', count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 90;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 30,
        alpha: 1,
        color,
        size: 2.5 + Math.random() * 3,
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

  const handleDrop = useCallback((targetX?: number) => {
    const res = dropBottle(stateRef.current, targetX);
    stateRef.current = res.state;
    if (res.event && res.event.type === 'bottle_dropped') {
      plinkoAudio.playDrop();
      spawnSparkles(res.event.x, 55, '#bae6fd', 6);
    }
  }, []);

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 420 / rect.width;
    const targetX = (e.clientX - rect.left) * scaleX;
    handleDrop(targetX);
  };

  const handleFrenzyClick = () => {
    const res = activateFrenzy(stateRef.current);
    if (res.event) {
      stateRef.current = res.state;
      plinkoAudio.playFrenzy();
      spawnSparkles(210, 270, '#fde047', 35);
    }
  };

  const handleRefill = () => {
    stateRef.current = refillBottles(stateRef.current, 25);
    plinkoAudio.playJackpot();
    spawnSparkles(210, 300, '#4ade80', 30);
  };

  const handleResetGame = () => {
    stateRef.current = createInitialState(highScore);
    particlesRef.current = [];
    popupsRef.current = [];
  };

  const toggleSound = () => {
    const next = plinkoAudio.toggleMute();
    setIsMuted(next);
  };

  // Main 60 FPS Engine & Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudCounter = 0;

    const renderBottle = (ctx: CanvasRenderingContext2D, b: PlinkoBottle) => {
      ctx.save();
      ctx.translate(b.x, b.y);

      // Glass Bottle Body
      ctx.beginPath();
      ctx.arc(0, 0, b.radius, 0, Math.PI * 2);

      let grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, b.radius);
      if (b.type === 'golden_milk') {
        grad.addColorStop(0, '#fef9c3');
        grad.addColorStop(0.5, '#facc15');
        grad.addColorStop(1, '#a16207');
      } else if (b.type === 'strawberry_milk') {
        grad.addColorStop(0, '#fdf2f8');
        grad.addColorStop(0.5, '#f472b6');
        grad.addColorStop(1, '#be185d');
      } else if (b.type === 'chocolate_milk') {
        grad.addColorStop(0, '#fef3c7');
        grad.addColorStop(0.5, '#b45309');
        grad.addColorStop(1, '#451a03');
      } else {
        // standard_milk
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.6, '#f1f5f9');
        grad.addColorStop(1, '#94a3b8');
      }

      ctx.fillStyle = grad;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.stroke();

      // Milk bottle emblem
      ctx.fillStyle = '#0f172a';
      ctx.font = `${Math.floor(b.radius * 1.1)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.type === 'golden_milk' ? '⭐' : '🥛', 0, 1);

      ctx.restore();
    };

    const renderPeg = (ctx: CanvasRenderingContext2D, peg: PlinkoPeg) => {
      ctx.save();
      ctx.translate(peg.x, peg.y);

      if (peg.isBumper) {
        // Glowing Bumper Ring
        ctx.beginPath();
        ctx.arc(0, 0, peg.radius + 2, 0, Math.PI * 2);
        ctx.fillStyle = peg.glowTimer > 0 ? '#ffedd5' : '#f43f5e';
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#fff';
        ctx.stroke();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⚡', 0, 0.5);
      } else {
        // Normal Brass Pin with glow
        ctx.beginPath();
        ctx.arc(0, 0, peg.radius, 0, Math.PI * 2);
        ctx.fillStyle = peg.glowTimer > 0 ? '#fef08a' : '#cbd5e1';
        ctx.fill();
        ctx.lineWidth = 1.2;
        ctx.strokeStyle = peg.glowTimer > 0 ? '#f59e0b' : '#64748b';
        ctx.stroke();
      }

      ctx.restore();
    };

    const renderBucket = (ctx: CanvasRenderingContext2D, bucket: PlinkoBucket) => {
      const width = bucket.maxX - bucket.minX;
      const height = 540 - BUCKET_TOP_Y;

      ctx.save();
      ctx.fillStyle = bucket.highlightTimer > 0 ? '#ffffff' : bucket.color;
      ctx.fillRect(bucket.minX + 1, BUCKET_TOP_Y, width - 2, height);

      // Top glowing rim
      ctx.fillStyle = bucket.isJackpot ? '#facc15' : 'rgba(255, 255, 255, 0.6)';
      ctx.fillRect(bucket.minX + 1, BUCKET_TOP_Y, width - 2, 4);

      // Label text
      ctx.fillStyle = bucket.highlightTimer > 0 ? '#020617' : bucket.isJackpot ? '#713f12' : '#ffffff';
      ctx.font = bucket.isJackpot ? 'bold 15px sans-serif' : 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(bucket.label, bucket.minX + width / 2, BUCKET_TOP_Y + 24);

      if (bucket.isJackpot) {
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('JACKPOT', bucket.minX + width / 2, BUCKET_TOP_Y + 42);
      }

      ctx.restore();
    };

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // 1. Update Physics
      const res = updateEngine(stateRef.current, dt);
      stateRef.current = res.state;

      // Handle Events
      res.events.forEach((ev) => {
        if (ev.type === 'peg_hit') {
          plinkoAudio.playPegHit(ev.noteFreq);
          spawnSparkles(ev.x, ev.y, '#fef08a', 4);
        } else if (ev.type === 'bucket_scored') {
          plinkoAudio.playBucketScore(ev.multiplier, ev.isJackpot);
          const targetBucket = res.state.buckets[ev.bucketIndex];
          const midX = (targetBucket.minX + targetBucket.maxX) / 2;
          spawnSparkles(midX, BUCKET_TOP_Y, ev.isJackpot ? '#fde047' : '#38bdf8', ev.isJackpot ? 30 : 12);
          spawnPopup(midX, BUCKET_TOP_Y - 15, `+${ev.scoreEarned}`, ev.isJackpot ? '#facc15' : '#4ade80');
        }
      });

      // Update High Score
      if (res.state.score > highScore) {
        setHighScore(res.state.score);
        try {
          localStorage.setItem('pawcade_plinko_hi', res.state.score.toString());
        } catch {}
      }

      // Update HUD at ~15 FPS to avoid React overhead
      hudCounter++;
      if (hudCounter % 4 === 0) {
        setHudState({
          bottles: res.state.bottlesLeft,
          score: res.state.score,
          frenzyMeter: Math.floor(res.state.frenzyMeter),
          frenzyActive: res.state.frenzyActive,
          frenzyTimer: Math.ceil(res.state.frenzyTimer),
          isGameOver: res.state.status === 'game_over',
        });
      }

      // 2. Render Frame
      ctx.clearRect(0, 0, 420, 540);

      // Deep Carnival Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, 540);
      bgGrad.addColorStop(0, '#1e1b4b');
      bgGrad.addColorStop(0.5, '#312e81');
      bgGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 420, 540);

      // Side Guard Rails
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, WALL_LEFT, 540);
      ctx.fillRect(WALL_RIGHT, 0, 420 - WALL_RIGHT, 540);

      // Side neon strip
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(WALL_LEFT - 3, 50, 3, 420);
      ctx.fillRect(WALL_RIGHT, 50, 3, 420);

      // Render Buckets
      res.state.buckets.forEach((b) => renderBucket(ctx, b));

      // Bucket Dividers
      ctx.fillStyle = '#64748b';
      res.state.buckets.forEach((b) => {
        ctx.fillRect(b.minX - 1.5, BUCKET_TOP_Y - 5, 3, 540 - BUCKET_TOP_Y + 5);
      });

      // Render Pegs
      res.state.pegs.forEach((peg) => renderPeg(ctx, peg));

      // Moving Hopper Dispenser at Top
      const hopperX = res.state.hopper.x;

      // Track rail
      ctx.fillStyle = '#334155';
      ctx.fillRect(res.state.hopper.minX - 15, 43, (res.state.hopper.maxX - res.state.hopper.minX) + 30, 6);

      // Hopper Cart
      ctx.fillStyle = res.state.frenzyActive ? '#facc15' : '#e2e8f0';
      ctx.fillRect(hopperX - 22, 28, 44, 24);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#0f172a';
      ctx.strokeRect(hopperX - 22, 28, 44, 24);

      // Bessie Cow Horns on Dispenser
      ctx.fillStyle = '#0f172a';
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐮', hopperX, 39);

      // Drop guide beam
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.moveTo(hopperX, 52);
      ctx.lineTo(hopperX, 90);
      ctx.stroke();
      ctx.setLineDash([]);

      // Render Bottles in Play
      res.state.bottlesInPlay.forEach((b) => renderBottle(ctx, b));

      // 3. Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt;
        p.alpha -= 1.8 * dt;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Render Floating Score Popups
      for (let i = popupsRef.current.length - 1; i >= 0; i--) {
        const pop = popupsRef.current[i];
        pop.y -= 45 * dt;
        pop.alpha -= 1.3 * dt;
        pop.scale = Math.max(1.0, pop.scale - 0.5 * dt);

        if (pop.alpha <= 0) {
          popupsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, pop.alpha);
        ctx.fillStyle = pop.color;
        ctx.font = `bold ${Math.floor(16 * pop.scale)}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 6;
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  return (
    <div className="relative w-full max-w-[440px] mx-auto select-none font-sans text-white touch-none">
      {/* Top Single-Screen HUD */}
      <div className="flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-t-xl px-3 py-2 shadow-lg backdrop-blur-md">
        {/* Bottles Balance */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🥛</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Bottles</span>
            <span className="text-base font-extrabold text-amber-400 leading-tight">
              {hudState.bottles}
            </span>
          </div>
        </div>

        {/* Score & Best */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
            <span className="text-base font-black text-white leading-tight">{hudState.score}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Best</span>
            <span className="text-base font-black text-amber-300 leading-tight">{highScore}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSound}
            className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px] rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm sm:text-base active:scale-95 transition-transform touch-manipulation"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleResetGame}
            className="w-9 h-9 min-w-[36px] min-h-[36px] sm:w-10 sm:h-10 sm:min-w-[40px] sm:min-h-[40px] rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm sm:text-base active:scale-95 transition-transform text-slate-300 hover:text-white touch-manipulation"
            aria-label="Reset Board"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Interactive 60 FPS Canvas Board */}
      <div className="relative w-full aspect-[420/540] bg-slate-950 border-x border-slate-800 overflow-hidden shadow-2xl touch-none">
        <canvas
          ref={canvasRef}
          width={420}
          height={540}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full cursor-pointer block touch-none"
        />
      </div>

      {/* Frenzy Power-Up Bar */}
      <div className="bg-slate-900 border-x border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-md">
        <button
          onClick={handleFrenzyClick}
          disabled={hudState.frenzyMeter < 100 || hudState.frenzyActive}
          className={`w-full py-2 px-3 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all min-h-[44px] touch-manipulation ${
            hudState.frenzyActive
              ? 'bg-amber-500 text-slate-950 animate-pulse font-black'
              : hudState.frenzyMeter >= 100
              ? 'bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-950 hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20 ring-2 ring-amber-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-80'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span>⭐</span>
            <span>GOLDEN MILK FRENZY (5x BOTTLES)</span>
          </div>
          <span className="text-[10px] font-semibold opacity-90 mt-0.5">
            {hudState.frenzyActive
              ? `FRENZY ACTIVE: ${hudState.frenzyTimer}s`
              : hudState.frenzyMeter >= 100
              ? 'READY! TAP TO START'
              : `BOUNCE PEGS TO CHARGE: ${hudState.frenzyMeter}%`}
          </span>
        </button>
      </div>

      {/* Large Bottom Drop Touch Button */}
      <div className="p-2 bg-slate-950 rounded-b-xl border-x border-b border-amber-500/30">
        <button
          onClick={() => handleDrop()}
          disabled={hudState.bottles <= 0}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 min-h-[48px] touch-manipulation transition-all ${
            hudState.bottles > 0
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-[0.98] hover:brightness-105 ring-2 ring-amber-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">🥛</span>
          <span>DROP MILK BOTTLE ({hudState.bottles} LEFT)</span>
        </button>
      </div>

      {/* Game Over / Out of Bottles Modal */}
      {hudState.isGameOver && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <span className="text-4xl mb-2 block">🐮🎪</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Out of Bottles!</h2>
            <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">
              Bessie ran out of fresh milk bottles! Claim 25 free carnival bottles and keep cascading toward the 100x Jackpot Corral!
            </p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-5 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Final Carnival Score</div>
              <div className="text-2xl font-black text-amber-400">{hudState.score}</div>
            </div>

            <button
              onClick={handleRefill}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation"
            >
              <span>🎁</span>
              <span>CLAIM +25 FREE BOTTLES</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MilkBottlePlinkoContainer;

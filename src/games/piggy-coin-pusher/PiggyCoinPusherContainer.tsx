import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PusherState,
  CoinType,
  CoinItem,
} from './logic/types';
import {
  createInitialState,
  dropCoin,
  activateQuake,
  activateWalls,
  refillCoins,
  updateEngine,
  TABLE_LEFT_WALL,
  TABLE_RIGHT_WALL,
  FRONT_LEDGE_Y,
} from './logic/engine';
import { pusherAudio } from './systems/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export const PiggyCoinPusherContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // High score in local storage
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_piggy_coin_pusher_hi');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<PusherState>(createInitialState(highScore));
  const [hudState, setHudState] = useState<{
    wallet: number;
    score: number;
    quakeProgress: number;
    wallProgress: number;
    quakeActive: boolean;
    wallsActive: boolean;
    quakeTimer: number;
    wallsTimer: number;
    isGameOver: boolean;
  }>({
    wallet: 45,
    score: 0,
    quakeProgress: 35,
    wallProgress: 40,
    quakeActive: false,
    wallsActive: false,
    quakeTimer: 0,
    wallsTimer: 0,
    isGameOver: false,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => pusherAudio.getMuted());
  const particlesRef = useRef<Particle[]>([]);
  const selectedCoinTypeRef = useRef<CoinType>('gold_corn');

  const spawnSparkles = (x: number, y: number, color: string = '#facc15', count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        alpha: 1,
        color,
        size: 2.5 + Math.random() * 3,
      });
    }
  };

  const handleDrop = useCallback((targetX: number) => {
    const res = dropCoin(stateRef.current, targetX, selectedCoinTypeRef.current);
    stateRef.current = res.state;
    if (res.event) {
      pusherAudio.playDrop();
      spawnSparkles(targetX, 70, '#fef08a', 5);
    }
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
    } else if ('clientX' in e) {
      clientX = e.clientX;
    } else {
      return;
    }

    const scaleX = 420 / rect.width;
    const targetX = (clientX - rect.left) * scaleX;
    handleDrop(targetX);
  };

  const handleQuakeClick = () => {
    const res = activateQuake(stateRef.current);
    if (res.event) {
      stateRef.current = res.state;
      pusherAudio.playQuake();
      spawnSparkles(210, 270, '#fbbf24', 25);
    }
  };

  const handleWallsClick = () => {
    const res = activateWalls(stateRef.current);
    if (res.event) {
      stateRef.current = res.state;
      pusherAudio.playWallUp();
      spawnSparkles(TABLE_LEFT_WALL, 250, '#38bdf8', 15);
      spawnSparkles(TABLE_RIGHT_WALL, 250, '#38bdf8', 15);
    }
  };

  const handleRefill = () => {
    stateRef.current = refillCoins(stateRef.current, 35);
    pusherAudio.playJackpot();
    spawnSparkles(210, 300, '#4ade80', 30);
  };

  const handleResetGame = () => {
    stateRef.current = createInitialState(highScore);
    particlesRef.current = [];
  };

  const toggleSound = () => {
    const next = pusherAudio.toggleMute();
    setIsMuted(next);
  };

  // Main 60 FPS Engine & Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudCounter = 0;

    const renderCoin = (ctx: CanvasRenderingContext2D, c: CoinItem) => {
      ctx.save();
      ctx.translate(c.x, c.y);

      // Coin base shadow
      ctx.beginPath();
      ctx.arc(1.5, 2.5, c.radius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.fill();

      // Outer rim
      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);

      let outerGrad = ctx.createLinearGradient(-c.radius, -c.radius, c.radius, c.radius);
      let innerGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, c.radius);

      if (c.type === 'clover_silver') {
        outerGrad.addColorStop(0, '#f1f5f9');
        outerGrad.addColorStop(0.5, '#cbd5e1');
        outerGrad.addColorStop(1, '#94a3b8');
        innerGrad.addColorStop(0, '#f8fafc');
        innerGrad.addColorStop(1, '#64748b');
      } else if (c.type === 'giant_mega') {
        outerGrad.addColorStop(0, '#fde047');
        outerGrad.addColorStop(0.5, '#f59e0b');
        outerGrad.addColorStop(1, '#b45309');
        innerGrad.addColorStop(0, '#fef08a');
        innerGrad.addColorStop(1, '#d97706');
      } else if (c.type === 'prize_egg') {
        outerGrad.addColorStop(0, '#fbcfe8');
        outerGrad.addColorStop(0.5, '#f472b6');
        outerGrad.addColorStop(1, '#db2777');
        innerGrad.addColorStop(0, '#fdf2f8');
        innerGrad.addColorStop(1, '#be185d');
      } else if (c.type === 'milk_bottle') {
        outerGrad.addColorStop(0, '#bfdbfe');
        outerGrad.addColorStop(0.5, '#60a5fa');
        outerGrad.addColorStop(1, '#2563eb');
        innerGrad.addColorStop(0, '#eff6ff');
        innerGrad.addColorStop(1, '#1d4ed8');
      } else {
        // gold_corn
        outerGrad.addColorStop(0, '#fef08a');
        outerGrad.addColorStop(0.5, '#eab308');
        outerGrad.addColorStop(1, '#a16207');
        innerGrad.addColorStop(0, '#fef9c3');
        innerGrad.addColorStop(1, '#ca8a04');
      }

      ctx.fillStyle = outerGrad;
      ctx.fill();
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.stroke();

      // Inner Coin Face
      ctx.beginPath();
      ctx.arc(0, 0, c.radius - 2.8, 0, Math.PI * 2);
      ctx.fillStyle = innerGrad;
      ctx.fill();

      // Emblem / Pattern
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (c.type === 'clover_silver') {
        ctx.font = `${Math.floor(c.radius * 0.9)}px sans-serif`;
        ctx.fillText('🍀', 0, 1);
      } else if (c.type === 'giant_mega') {
        ctx.font = `bold ${Math.floor(c.radius * 0.8)}px sans-serif`;
        ctx.fillText('⭐', 0, 1);
      } else if (c.type === 'prize_egg') {
        ctx.font = `${Math.floor(c.radius * 0.9)}px sans-serif`;
        ctx.fillText('🥚', 0, 1);
      } else if (c.type === 'milk_bottle') {
        ctx.font = `${Math.floor(c.radius * 0.9)}px sans-serif`;
        ctx.fillText('🥛', 0, 1);
      } else {
        ctx.font = `bold ${Math.floor(c.radius * 0.9)}px sans-serif`;
        ctx.fillText('🌽', 0, 1);
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

      // Handle Events (Audio / Sparkles)
      res.events.forEach((ev) => {
        if (ev.type === 'coin_pushed_front') {
          pusherAudio.playFrontCollect();
          spawnSparkles(TABLE_LEFT_WALL + Math.random() * (TABLE_RIGHT_WALL - TABLE_LEFT_WALL), FRONT_LEDGE_Y + 10, '#facc15', 12);
        } else if (ev.type === 'coin_lost_side') {
          pusherAudio.playSideLoss();
        }
      });

      // Update High Score
      if (res.state.score > highScore) {
        setHighScore(res.state.score);
        try {
          localStorage.setItem('pawcade_piggy_coin_pusher_hi', res.state.score.toString());
        } catch {}
      }

      // Update HUD at ~15 FPS to avoid React overhead
      hudCounter++;
      if (hudCounter % 4 === 0) {
        setHudState({
          wallet: res.state.coinsInWallet,
          score: res.state.score,
          quakeProgress: Math.floor(res.state.progress.quakeProgress),
          wallProgress: Math.floor(res.state.progress.wallProgress),
          quakeActive: res.state.powerUps.quakeTimer > 0,
          wallsActive: res.state.powerUps.coinWallsTimer > 0,
          quakeTimer: Math.ceil(res.state.powerUps.quakeTimer),
          wallsTimer: Math.ceil(res.state.powerUps.coinWallsTimer),
          isGameOver: res.state.status === 'game_over',
        });
      }

      // 2. Render Frame
      ctx.clearRect(0, 0, 420, 540);

      // Quake table shake
      ctx.save();
      if (res.state.powerUps.quakeTimer > 0) {
        const shakeX = (Math.random() - 0.5) * 6;
        const shakeY = (Math.random() - 0.5) * 4;
        ctx.translate(shakeX, shakeY);
      }

      // Table Bed Background (Stainless Steel Casino Bed)
      const bedGrad = ctx.createLinearGradient(0, 0, 0, 540);
      bedGrad.addColorStop(0, '#1e293b');
      bedGrad.addColorStop(0.3, '#334155');
      bedGrad.addColorStop(0.7, '#1e293b');
      bedGrad.addColorStop(1, '#0f172a');
      ctx.fillStyle = bedGrad;
      ctx.fillRect(0, 0, 420, 540);

      // Bed Reflection Lines (Polished Chrome Sheen)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      ctx.lineWidth = 1.5;
      for (let y = 100; y < 400; y += 32) {
        ctx.beginPath();
        ctx.moveTo(TABLE_LEFT_WALL, y);
        ctx.lineTo(TABLE_RIGHT_WALL, y);
        ctx.stroke();
      }

      // Upper Step Shelf (y = 175)
      ctx.fillStyle = '#090d16';
      ctx.fillRect(TABLE_LEFT_WALL, 172, TABLE_RIGHT_WALL - TABLE_LEFT_WALL, 6);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.fillRect(TABLE_LEFT_WALL, 178, TABLE_RIGHT_WALL - TABLE_LEFT_WALL, 2);

      // Side Gutters
      // Left gutter
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, TABLE_LEFT_WALL, 540);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(TABLE_LEFT_WALL - 5, 175, 4, FRONT_LEDGE_Y - 175);

      // Right gutter
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(TABLE_RIGHT_WALL, 0, 420 - TABLE_RIGHT_WALL, 540);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(TABLE_RIGHT_WALL + 1, 175, 4, FRONT_LEDGE_Y - 175);

      // Moving Pusher Blade (Chrome & Ruby Red Farm Rake)
      const pusherY = res.state.pusher.y;

      // Pusher Face Box
      const pGrad = ctx.createLinearGradient(0, pusherY - 24, 0, pusherY);
      pGrad.addColorStop(0, '#94a3b8');
      pGrad.addColorStop(0.5, '#f8fafc');
      pGrad.addColorStop(1, '#64748b');
      ctx.fillStyle = pGrad;
      ctx.fillRect(TABLE_LEFT_WALL, pusherY - 24, TABLE_RIGHT_WALL - TABLE_LEFT_WALL, 24);

      // Pusher Front Ruby Bumper
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(TABLE_LEFT_WALL, pusherY - 4, TABLE_RIGHT_WALL - TABLE_LEFT_WALL, 5);
      ctx.fillStyle = '#fca5a5';
      ctx.fillRect(TABLE_LEFT_WALL, pusherY - 4, TABLE_RIGHT_WALL - TABLE_LEFT_WALL, 1.5);

      // Pusher Top Cover
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(TABLE_LEFT_WALL - 4, 0, TABLE_RIGHT_WALL - TABLE_LEFT_WALL + 8, pusherY - 24);

      // Coin Walls Energy Shield (When active)
      if (res.state.powerUps.coinWallsTimer > 0) {
        ctx.save();
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;

        // Left Barrier
        ctx.fillStyle = '#38bdf8';
        ctx.fillRect(TABLE_LEFT_WALL - 6, 175, 8, FRONT_LEDGE_Y - 175);
        // Right Barrier
        ctx.fillRect(TABLE_RIGHT_WALL - 2, 175, 8, FRONT_LEDGE_Y - 175);

        ctx.restore();
      }

      // Render Coins (Sorted by Y for correct top-down layering)
      const sortedCoins = [...res.state.coinsOnTable].sort((a, b) => a.y - b.y);
      sortedCoins.forEach((c) => renderCoin(ctx, c));

      // Front Ledge & Drop Chute
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(TABLE_LEFT_WALL - 10, FRONT_LEDGE_Y, TABLE_RIGHT_WALL - TABLE_LEFT_WALL + 20, 540 - FRONT_LEDGE_Y);

      // Golden Edge Rim
      const rimGrad = ctx.createLinearGradient(0, FRONT_LEDGE_Y, 0, FRONT_LEDGE_Y + 12);
      rimGrad.addColorStop(0, '#fde047');
      rimGrad.addColorStop(0.5, '#eab308');
      rimGrad.addColorStop(1, '#854d0e');
      ctx.fillStyle = rimGrad;
      ctx.fillRect(TABLE_LEFT_WALL, FRONT_LEDGE_Y, TABLE_RIGHT_WALL - TABLE_LEFT_WALL, 12);

      // WIN COLLECTION TRAY
      ctx.fillStyle = '#020617';
      ctx.fillRect(TABLE_LEFT_WALL + 15, FRONT_LEDGE_Y + 22, TABLE_RIGHT_WALL - TABLE_LEFT_WALL - 30, 95);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(TABLE_LEFT_WALL + 15, FRONT_LEDGE_Y + 22, TABLE_RIGHT_WALL - TABLE_LEFT_WALL - 30, 95);

      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🏆 PRIZE CHUTE 🏆', 210, FRONT_LEDGE_Y + 48);

      ctx.fillStyle = '#fbbf24';
      ctx.font = '12px sans-serif';
      ctx.fillText(`PUSHED: ${res.state.totalPushedFront} COINS`, 210, FRONT_LEDGE_Y + 70);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px sans-serif';
      ctx.fillText(`LOST IN SIDE GUTTERS: ${res.state.totalLostSide}`, 210, FRONT_LEDGE_Y + 92);

      // Top Drop Chute Guide Indicator
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(TABLE_LEFT_WALL + 20, 35, TABLE_RIGHT_WALL - TABLE_LEFT_WALL - 40, 35);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(250, 204, 21, 0.85)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('▼ TAP ANYWHERE TO DROP COIN ▼', 210, 56);

      // 3. Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 90 * dt; // gravity
        p.alpha -= 1.6 * dt;

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

      ctx.restore(); // Quake transform restore

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore]);

  return (
    <div className="relative w-full max-w-[440px] mx-auto select-none font-sans text-white touch-none">
      {/* Top Single-Screen HUD */}
      <div className="flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-t-xl px-3 py-2 shadow-lg backdrop-blur-md">
        {/* Wallet Balance */}
        <div className="flex items-center gap-1.5">
          <span className="text-xl">🪙</span>
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Wallet</span>
            <span className="text-base font-extrabold text-amber-400 leading-tight">
              {hudState.wallet}
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
        <div className="flex items-center gap-1">
          <button
            onClick={toggleSound}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm active:scale-95 transition-transform"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleResetGame}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm active:scale-95 transition-transform text-slate-300 hover:text-white"
            aria-label="Reset Machine"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Interactive 60 FPS Canvas Table */}
      <div className="relative w-full aspect-[420/540] bg-slate-950 border-x border-slate-800 overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={420}
          height={540}
          onClick={handleCanvasClick}
          onTouchStart={handleCanvasClick}
          className="w-full h-full cursor-pointer block"
        />
      </div>

      {/* Power-Up Controls Bar */}
      <div className="bg-slate-900 border-x border-b border-slate-800 px-3 py-2 flex items-center justify-between gap-2 shadow-md">
        {/* Barn Quake */}
        <button
          onClick={handleQuakeClick}
          disabled={hudState.quakeProgress < 100 || hudState.quakeActive}
          className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all ${
            hudState.quakeActive
              ? 'bg-amber-600 text-white animate-pulse'
              : hudState.quakeProgress >= 100
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:brightness-110 active:scale-95 shadow-md shadow-amber-500/20 ring-1 ring-amber-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>🚜</span>
            <span>BARN QUAKE</span>
          </div>
          <span className="text-[10px] font-semibold opacity-90 mt-0.5">
            {hudState.quakeActive
              ? `SHAKING: ${hudState.quakeTimer}s`
              : hudState.quakeProgress >= 100
              ? 'READY! TAP NOW'
              : `${hudState.quakeProgress}%`}
          </span>
        </button>

        {/* Coin Walls */}
        <button
          onClick={handleWallsClick}
          disabled={hudState.wallProgress < 100 || hudState.wallsActive}
          className={`flex-1 py-2 px-2 rounded-lg font-bold text-xs flex flex-col items-center justify-center transition-all ${
            hudState.wallsActive
              ? 'bg-sky-600 text-white animate-pulse'
              : hudState.wallProgress >= 100
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white hover:brightness-110 active:scale-95 shadow-md shadow-sky-500/20 ring-1 ring-sky-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-75'
          }`}
        >
          <div className="flex items-center gap-1">
            <span>🛡️</span>
            <span>COIN WALLS</span>
          </div>
          <span className="text-[10px] font-semibold opacity-90 mt-0.5">
            {hudState.wallsActive
              ? `ACTIVE: ${hudState.wallsTimer}s`
              : hudState.wallProgress >= 100
              ? 'READY! TAP NOW'
              : `${hudState.wallProgress}%`}
          </span>
        </button>
      </div>

      {/* Large Bottom Drop Touch Button */}
      <div className="p-2 bg-slate-950 rounded-b-xl border-x border-b border-amber-500/30">
        <button
          onClick={() => handleDrop(210 + (Math.random() - 0.5) * 140)}
          disabled={hudState.wallet <= 0}
          className={`w-full py-3.5 px-4 rounded-xl font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
            hudState.wallet > 0
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-lg shadow-amber-500/30 active:scale-[0.98] hover:brightness-105 ring-2 ring-amber-300'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span className="text-lg">🪙</span>
          <span>DROP COIN ({hudState.wallet} LEFT)</span>
        </button>
      </div>

      {/* Game Over / Out of Coins Modal */}
      {hudState.isGameOver && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <span className="text-4xl mb-2 block">🐷🚜</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Out of Coins!</h2>
            <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">
              Your coin wallet ran dry! Claim a fresh supply of 35 free gold coins and keep cascading the barnyard prize chute!
            </p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-5 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Final Score</div>
              <div className="text-2xl font-black text-amber-400">{hudState.score}</div>
            </div>

            <button
              onClick={handleRefill}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>🎁</span>
              <span>CLAIM +35 FREE COINS</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PiggyCoinPusherContainer;

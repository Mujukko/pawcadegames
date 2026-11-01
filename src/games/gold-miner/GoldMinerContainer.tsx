import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CLAW_ORIGIN_X,
  CLAW_ORIGIN_Y,
  initGoldMinerGame,
  MINE_HEIGHT,
  MINE_WIDTH,
  stepGoldMinerGame,
  TOTAL_SHIFTS,
  triggerClawShoot,
  useDynamite,
} from './logic/engine';
import { GoldMinerState } from './logic/types';
import { goldMinerAudio } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, Bomb, ArrowDown } from 'lucide-react';

export const GoldMinerContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<GoldMinerState>(initGoldMinerGame(1, 0, 1));

  const [hudState, setHudState] = useState({
    shift: 1,
    targetMoney: 650,
    money: 0,
    timeLeft: 60,
    dynamiteCount: 1,
    hasStrengthDrink: false,
    status: 'playing',
    isMuted: goldMinerAudio.isMuted(),
  });

  const [showShiftClearModal, setShowShiftClearModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const handleShoot = useCallback(() => {
    if (stateRef.current.claw.state === 'swinging') {
      goldMinerAudio.playShoot();
      stateRef.current = triggerClawShoot(stateRef.current);
    }
  }, []);

  const handleDynamite = useCallback(() => {
    if (stateRef.current.dynamiteCount > 0 && stateRef.current.claw.grabbedItem) {
      goldMinerAudio.playDynamite();
      stateRef.current = useDynamite(stateRef.current);
    }
  }, []);

  const restartGame = useCallback(() => {
    stateRef.current = initGoldMinerGame(1, 0, 1);
    setShowGameOverModal(false);
    setShowVictoryModal(false);
    setShowShiftClearModal(false);
  }, []);

  const advanceNextShift = (boughtDynamite = false, boughtStrength = false) => {
    let money = stateRef.current.money;
    let dynamite = stateRef.current.dynamiteCount;
    let strength = false;

    if (boughtDynamite && money >= 150) {
      money -= 150;
      dynamite += 1;
    }
    if (boughtStrength && money >= 200) {
      money -= 200;
      strength = true;
    }

    const nextShift = stateRef.current.shift + 1;
    const nextState = initGoldMinerGame(nextShift, money, dynamite);
    nextState.hasStrengthDrink = strength;
    stateRef.current = nextState;
    setShowShiftClearModal(false);
  };

  const toggleSound = () => {
    const muted = goldMinerAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'KeyS', 'Space'].includes(e.code)) {
        handleShoot();
      }
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        handleDynamite();
      }
      if (e.code === 'KeyR') restartGame();
      if (e.code === 'KeyM') toggleSound();
    };

    window.addEventListener('keydown', handleKeyDown);

    let animId: number;
    let lastTime = performance.now();
    let prevMoney = 0;

    const render = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const prevState = stateRef.current;
      const nextState = stepGoldMinerGame(prevState, dt);
      stateRef.current = nextState;

      // Money gained sound
      if (nextState.money > prevMoney) {
        goldMinerAudio.playCoin();
        prevMoney = nextState.money;
      }

      // Modals triggers
      if (nextState.status === 'shift_clear' && !showShiftClearModal) {
        goldMinerAudio.playVictory();
        setShowShiftClearModal(true);
      }
      if (nextState.status === 'victory' && !showVictoryModal) {
        goldMinerAudio.playVictory();
        setShowVictoryModal(true);
      }
      if (nextState.status === 'game_over' && !showGameOverModal) {
        setShowGameOverModal(true);
      }

      // Sync HUD
      setHudState({
        shift: nextState.shift,
        targetMoney: nextState.targetMoney,
        money: nextState.money,
        timeLeft: Math.ceil(nextState.timeLeft),
        dynamiteCount: nextState.dynamiteCount,
        hasStrengthDrink: nextState.hasStrengthDrink,
        status: nextState.status,
        isMuted: goldMinerAudio.isMuted(),
      });

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, MINE_WIDTH, MINE_HEIGHT);

          // 1. Earth Layers Background
          ctx.fillStyle = '#451a03'; // Deep underground dirt
          ctx.fillRect(0, 80, MINE_WIDTH, MINE_HEIGHT - 80);

          // Top meadow surface
          const surfaceGrad = ctx.createLinearGradient(0, 0, 0, 80);
          surfaceGrad.addColorStop(0, '#7dd3fc');
          surfaceGrad.addColorStop(0.7, '#bae6fd');
          surfaceGrad.addColorStop(0.71, '#4d7c0f');
          surfaceGrad.addColorStop(1, '#78350f');
          ctx.fillStyle = surfaceGrad;
          ctx.fillRect(0, 0, MINE_WIDTH, 80);

          // Wooden mine tunnel support beams
          ctx.fillStyle = '#78350f';
          ctx.fillRect(40, 80, 16, MINE_HEIGHT - 80);
          ctx.fillRect(MINE_WIDTH - 56, 80, 16, MINE_HEIGHT - 80);

          // 2. Underground Items
          nextState.items.forEach((itm) => {
            if (itm.collected || itm.exploded) return;
            ctx.save();
            ctx.translate(itm.x, itm.y);

            if (itm.type === 'diamond') {
              ctx.fillStyle = '#38bdf8';
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.moveTo(0, -itm.radius);
              ctx.lineTo(itm.radius, 0);
              ctx.lineTo(0, itm.radius * 1.3);
              ctx.lineTo(-itm.radius, 0);
              ctx.closePath();
              ctx.fill();
              ctx.stroke();
            } else if (itm.type === 'rock') {
              ctx.fillStyle = '#64748b';
              ctx.strokeStyle = '#334155';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(0, 0, itm.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
            } else if (itm.type === 'tnt') {
              ctx.fillStyle = '#dc2626';
              ctx.strokeStyle = '#7f1d1d';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(-itm.radius, -itm.radius, itm.radius * 2, itm.radius * 2, 4);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('TNT', 0, 3);
            } else if (itm.type === 'mystery') {
              ctx.fillStyle = '#a855f7';
              ctx.strokeStyle = '#6b21a8';
              ctx.lineWidth = 2;
              ctx.beginPath();
              ctx.roundRect(-itm.radius, -itm.radius, itm.radius * 2, itm.radius * 2, 6);
              ctx.fill();
              ctx.stroke();
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 12px sans-serif';
              ctx.textAlign = 'center';
              ctx.fillText('?', 0, 4);
            } else {
              // Gold Nugget
              ctx.fillStyle = '#facc15';
              ctx.strokeStyle = '#ca8a04';
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(0, 0, itm.radius, 0, Math.PI * 2);
              ctx.fill();
              ctx.stroke();
              // Gold glint
              ctx.fillStyle = '#fef08a';
              ctx.beginPath();
              ctx.arc(-itm.radius * 0.3, -itm.radius * 0.3, itm.radius * 0.3, 0, Math.PI * 2);
              ctx.fill();
            }

            ctx.restore();
          });

          // 3. Winch Miner & Cable Reel
          const claw = nextState.claw;
          const tipX = claw.originX + Math.sin(claw.angle) * claw.length;
          const tipY = claw.originY + Math.cos(claw.angle) * claw.length;

          // Miner at top
          ctx.save();
          ctx.translate(CLAW_ORIGIN_X, CLAW_ORIGIN_Y - 20);
          // Minecart
          ctx.fillStyle = '#78350f';
          ctx.fillRect(-22, -4, 44, 22);
          // Farmer Mole Head
          ctx.fillStyle = '#475569';
          ctx.beginPath();
          ctx.arc(0, -12, 14, 0, Math.PI * 2);
          ctx.fill();
          // Miner Hat & Lamp
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(0, -22, 10, Math.PI, 0);
          ctx.fill();
          ctx.fillStyle = '#fef08a';
          ctx.beginPath();
          ctx.arc(0, -22, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Cable line
          ctx.strokeStyle = '#94a3b8';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(claw.originX, claw.originY);
          ctx.lineTo(tipX, tipY);
          ctx.stroke();

          // Grabber Claw
          ctx.save();
          ctx.translate(tipX, tipY);
          ctx.rotate(-claw.angle);

          ctx.fillStyle = '#64748b';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          // Claw hub
          ctx.beginPath();
          ctx.arc(0, 0, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Left pincer
          ctx.beginPath();
          ctx.moveTo(-4, 0);
          ctx.lineTo(-12, 12);
          ctx.lineTo(-4, 16);
          ctx.stroke();

          // Right pincer
          ctx.beginPath();
          ctx.moveTo(4, 0);
          ctx.lineTo(12, 12);
          ctx.lineTo(4, 16);
          ctx.stroke();

          // Render item if currently grabbed
          if (claw.grabbedItem) {
            const gi = claw.grabbedItem;
            ctx.fillStyle = gi.type === 'rock' ? '#64748b' : '#facc15';
            ctx.beginPath();
            ctx.arc(0, gi.radius + 6, gi.radius, 0, Math.PI * 2);
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      cancelAnimationFrame(animId);
    };
  }, [handleShoot, handleDynamite, restartGame, showShiftClearModal, showVictoryModal, showGameOverModal]);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-950 flex flex-col items-center justify-between overflow-hidden select-none touch-none">
      {/* Top Header */}
      <header className="w-full max-w-4xl px-4 py-2 flex items-center justify-between text-white border-b border-white/10 z-10 bg-slate-900/90 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <span className="text-xl">⛏️</span>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base sm:text-lg text-amber-400">
              Gold Miner: Gem Digger
            </span>
            <span className="text-xs text-white/70">
              Shift {hudState.shift} / {TOTAL_SHIFTS} • Goal: ${hudState.targetMoney}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="px-3 py-1 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 font-extrabold text-sm sm:text-base">
            ${hudState.money}
          </div>

          <div className="px-2.5 py-1 rounded-xl bg-white/10 text-white font-bold text-xs">
            ⏳ {hudState.timeLeft}s
          </div>

          <button
            onClick={handleDynamite}
            disabled={hudState.dynamiteCount <= 0}
            aria-label="Use Dynamite"
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Bomb className="w-3.5 h-3.5 text-red-400" />
            <span>x{hudState.dynamiteCount}</span>
          </button>

          <button
            onClick={restartGame}
            aria-label="Restart"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={toggleSound}
            aria-label="Toggle sound"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-green-400" />}
          </button>
        </div>
      </header>

      {/* Main Canvas Viewport */}
      <main className="relative flex-1 w-full max-w-4xl flex items-center justify-center p-2 sm:p-4">
        <div className="relative w-full aspect-[800/480] max-h-[75dvh] rounded-2xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900">
          <canvas
            ref={canvasRef}
            width={MINE_WIDTH}
            height={MINE_HEIGHT}
            className="w-full h-full object-contain cursor-pointer"
            onClick={handleShoot}
          />

          {/* Shift Clear Shop Modal */}
          {showShiftClearModal && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-30">
              <span className="text-5xl mb-2">💰</span>
              <h2 className="font-display font-extrabold text-2xl sm:text-3xl text-amber-400 mb-1">
                Shift {hudState.shift} Quota Achieved!
              </h2>
              <p className="text-sm text-white/80 mb-4">
                Total Earnings: ${hudState.money} • Next Target: ${hudState.shift < TOTAL_SHIFTS ? [1400, 2200, 3200][hudState.shift - 1] : 0}
              </p>

              {/* Shop items */}
              <div className="flex gap-4 mb-6">
                <button
                  onClick={() => advanceNextShift(true, false)}
                  disabled={hudState.money < 150}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/15 rounded-xl flex flex-col items-center text-xs"
                >
                  <span className="text-2xl mb-1">🧨</span>
                  <span className="font-bold">+1 Dynamite ($150)</span>
                </button>
                <button
                  onClick={() => advanceNextShift(false, true)}
                  disabled={hudState.money < 200}
                  className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-white/15 rounded-xl flex flex-col items-center text-xs"
                >
                  <span className="text-2xl mb-1">🥤</span>
                  <span className="font-bold">Mole Tonic ($200)</span>
                </button>
              </div>

              <button
                onClick={() => advanceNextShift(false, false)}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                Start Next Shift ➔
              </button>
            </div>
          )}

          {/* Game Over Modal */}
          {showGameOverModal && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 z-30">
              <span className="text-5xl mb-2">⌛</span>
              <h2 className="font-display font-extrabold text-3xl text-red-400 mb-1">
                Shift Over!
              </h2>
              <p className="text-sm text-white/80 mb-6">
                You collected ${hudState.money}, but needed ${hudState.targetMoney}.
              </p>
              <button
                onClick={restartGame}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                Try Again 🔄
              </button>
            </div>
          )}

          {/* Victory Modal */}
          {showVictoryModal && (
            <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-lg flex flex-col items-center justify-center text-white p-6 z-30">
              <span className="text-6xl mb-3">👑</span>
              <h2 className="font-display font-extrabold text-3xl sm:text-4xl text-amber-400 mb-2">
                Barnyard Gold Baron!
              </h2>
              <p className="text-base text-white/90 mb-6">
                You conquered all {TOTAL_SHIFTS} shifts with a grand fortune of ${hudState.money}!
              </p>
              <button
                onClick={restartGame}
                className="px-8 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-base rounded-2xl shadow-xl transition-transform active:scale-95"
              >
                Play Again 🔄
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Mobile Touch Bar */}
      <footer className="w-full max-w-4xl px-4 py-3 flex items-center justify-center gap-4 pb-safe z-10 sm:hidden">
        <button
          onClick={handleShoot}
          aria-label="Drop Claw"
          className="flex-1 max-w-xs h-14 rounded-2xl bg-amber-500 border border-amber-400 font-extrabold text-slate-950 flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <ArrowDown className="w-5 h-5" />
          <span>DROP CLAW</span>
        </button>

        <button
          onClick={handleDynamite}
          disabled={hudState.dynamiteCount <= 0}
          aria-label="Use Dynamite"
          className="w-16 h-14 rounded-2xl bg-red-600 border border-red-500 font-extrabold text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform"
        >
          <Bomb className="w-6 h-6" />
        </button>
      </footer>
    </div>
  );
};

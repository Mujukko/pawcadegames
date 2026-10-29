import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Wrench,
  Trophy,
  Coins,
  Shield,
  Magnet,
  Zap,
  ArrowRight,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  CartUpgrades,
  EggCartGameState,
  PowerUpType,
} from './logic/types';
import {
  initializeEggCartGame,
  tickEggCartGame,
  purchaseCartUpgrade,
  getUpgradeCost,
  UPGRADE_INFO,
} from './logic/engine';
import { getTerrainHeight } from './logic/terrain';
import { eggCartAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const BarnyardEggCartContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameStateRef = useRef<EggCartGameState>(initializeEggCartGame());
  const [hudState, setHudState] = useState<{
    distance: number;
    highScore: number;
    coins: number;
    coinsThisRun: number;
    gameOver: boolean;
    gameOverReason: string | null;
    shieldTime: number;
    magnetTime: number;
    turboTime: number;
  }>({
    distance: 0,
    highScore: 0,
    coins: 0,
    coinsThisRun: 0,
    gameOver: false,
    gameOverReason: null,
    shieldTime: 0,
    magnetTime: 0,
    turboTime: 0,
  });

  const [isMuted, setIsMuted] = useState(eggCartAudio.isMuted());
  const [showGarage, setShowGarage] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [gasActive, setGasActive] = useState(false);
  const [brakeActive, setBrakeActive] = useState(false);

  // Restart run
  const handleRestart = useCallback(() => {
    const currentCoins = gameStateRef.current.coins;
    const currentUpgrades = gameStateRef.current.upgrades;
    const bestDist = gameStateRef.current.highScoreDistance;
    gameStateRef.current = initializeEggCartGame(currentCoins, currentUpgrades, bestDist);
    eggCartAudio.startEngine();
    setHudState({
      distance: 0,
      highScore: bestDist,
      coins: currentCoins,
      coinsThisRun: 0,
      gameOver: false,
      gameOverReason: null,
      shieldTime: 0,
      magnetTime: 0,
      turboTime: 0,
    });
  }, []);

  const handleMuteToggle = () => {
    const next = eggCartAudio.toggleMute();
    setIsMuted(next);
  };

  const handleBuyUpgrade = (key: keyof CartUpgrades) => {
    gameStateRef.current = purchaseCartUpgrade(gameStateRef.current, key);
    eggCartAudio.playCoinPickup();
    setHudState((prev) => ({
      ...prev,
      coins: gameStateRef.current.coins,
    }));
  };

  // Input bindings
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'KeyD', 'Space'].includes(e.code)) {
        e.preventDefault();
        gameStateRef.current.gasPressed = true;
        setGasActive(true);
      } else if (['ArrowLeft', 'KeyA', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        gameStateRef.current.brakePressed = true;
        setBrakeActive(true);
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        handleRestart();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        handleMuteToggle();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowRight', 'KeyD', 'Space'].includes(e.code)) {
        gameStateRef.current.gasPressed = false;
        setGasActive(false);
      } else if (['ArrowLeft', 'KeyA', 'KeyS'].includes(e.code)) {
        gameStateRef.current.brakePressed = false;
        setBrakeActive(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleRestart]);

  // Main Render & Simulation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();
    eggCartAudio.startEngine();

    const render = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // 1. Simulation step
      const { state, events } = tickEggCartGame(gameStateRef.current, dt);
      gameStateRef.current = state;

      // Sound triggers
      if (events.coinCollected) {
        eggCartAudio.playCoinPickup();
      }
      if (events.powerUpCollected) {
        eggCartAudio.playPowerUp();
      }
      if (events.eggCracked) {
        eggCartAudio.playEggCrack();
        analytics.track('game_over', {
          game: 'barnyard-egg-cart',
          distance: state.distanceMeters,
          coins: state.coinsThisRun,
          reason: state.gameOverReason,
        });
      }
      if (events.newHighScore) {
        eggCartAudio.playNewRecord();
      }

      // Update engine audio pitch based on forward velocity
      const forwardSpeed = Math.abs(state.cart.vx);
      eggCartAudio.updateEnginePitch(forwardSpeed / 300);

      // Periodically sync HUD state
      setHudState({
        distance: state.distanceMeters,
        highScore: state.highScoreDistance,
        coins: state.coins,
        coinsThisRun: state.coinsThisRun,
        gameOver: state.gameOver,
        gameOverReason: state.gameOverReason,
        shieldTime: Math.ceil(state.activePowerUps.shieldTimer),
        magnetTime: Math.ceil(state.activePowerUps.magnetTimer),
        turboTime: Math.ceil(state.activePowerUps.turboTimer),
      });

      // 2. Render Frame
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Camera follows cart with leading view
      const cart = state.cart;
      const cameraX = cart.x - width * 0.32;
      const cameraY = cart.y - height * 0.62;

      ctx.save();
      ctx.translate(-cameraX, -cameraY);

      // A. Parallax Sky & Background Hills
      const skyGrad = ctx.createLinearGradient(cameraX, cameraY, cameraX, cameraY + height);
      skyGrad.addColorStop(0, '#7dd3fc');
      skyGrad.addColorStop(0.6, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(cameraX, cameraY, width, height);

      // Sun
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(cameraX + width * 0.8, cameraY + 60, 40, 0, Math.PI * 2);
      ctx.fill();

      // Distant rolling mountains (0.2 parallax)
      ctx.fillStyle = '#86efac';
      ctx.beginPath();
      ctx.moveTo(cameraX, cameraY + height);
      for (let x = cameraX - 50; x <= cameraX + width + 50; x += 40) {
        const bgY = cameraY + height * 0.55 + Math.sin(x * 0.0015) * 45;
        ctx.lineTo(x, bgY);
      }
      ctx.lineTo(cameraX + width + 50, cameraY + height);
      ctx.closePath();
      ctx.fill();

      // B. Foreground Pasture Terrain
      const terrainStartX = Math.floor((cameraX - 100) / 10) * 10;
      const terrainEndX = Math.ceil((cameraX + width + 100) / 10) * 10;

      // Deep earth base
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.moveTo(terrainStartX, cameraY + height + 200);
      for (let x = terrainStartX; x <= terrainEndX; x += 10) {
        ctx.lineTo(x, getTerrainHeight(x));
      }
      ctx.lineTo(terrainEndX, cameraY + height + 200);
      ctx.closePath();
      ctx.fill();

      // Top green turf grass layer
      ctx.lineWidth = 14;
      ctx.strokeStyle = '#22c55e';
      ctx.beginPath();
      for (let x = terrainStartX; x <= terrainEndX; x += 10) {
        const y = getTerrainHeight(x);
        if (x === terrainStartX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Lush grassy highlight line
      ctx.lineWidth = 4;
      ctx.strokeStyle = '#86efac';
      ctx.stroke();

      // C. Coins Pickups
      state.coinsPickups.forEach((coin) => {
        if (coin.collected) return;
        if (coin.x < cameraX - 40 || coin.x > cameraX + width + 40) return;

        ctx.save();
        ctx.translate(coin.x, coin.y);
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, 0, 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('★', 0, 0);
        ctx.restore();
      });

      // D. Power-Up Pickups
      state.powerUpPickups.forEach((pw) => {
        if (pw.collected) return;
        if (pw.x < cameraX - 40 || pw.x > cameraX + width + 40) return;

        ctx.save();
        ctx.translate(pw.x, pw.y);

        const colors: Record<PowerUpType, { bg: string; border: string; icon: string }> = {
          shield: { bg: '#38bdf8', border: '#0284c7', icon: '🛡️' },
          magnet: { bg: '#fbbf24', border: '#d97706', icon: '🧲' },
          turbo: { bg: '#f87171', border: '#dc2626', icon: '⚡' },
        };

        const cfg = colors[pw.type];
        ctx.fillStyle = cfg.bg;
        ctx.strokeStyle = cfg.border;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(cfg.icon, 0, 1);
        ctx.restore();
      });

      // E. Draw Cart Wheels & Chassis
      // Rear Wheel
      const drawWheel = (wheel: { x: number; y: number; angle: number; radius: number }) => {
        ctx.save();
        ctx.translate(wheel.x, wheel.y);
        ctx.rotate(wheel.angle);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, 0, wheel.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#475569';
        ctx.beginPath();
        ctx.arc(0, 0, wheel.radius - 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(a) * (wheel.radius - 2), Math.sin(a) * (wheel.radius - 2));
          ctx.stroke();
        }

        ctx.fillStyle = '#cbd5e1';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      };

      drawWheel(cart.rearWheel);
      drawWheel(cart.frontWheel);

      // Chassis & Truck Body
      ctx.save();
      ctx.translate(cart.x, cart.y);
      ctx.rotate(cart.angle);

      // Axle bar
      ctx.fillStyle = '#334155';
      ctx.fillRect(-38, 8, 76, 5);

      // Red vintage truck cabin & hood
      ctx.fillStyle = '#dc2626';
      ctx.strokeStyle = '#991b1b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-42, -14, 84, 22, 6);
      ctx.fill();
      ctx.stroke();

      // Front cab windshield
      ctx.fillStyle = '#7dd3fc';
      ctx.strokeStyle = '#0284c7';
      ctx.beginPath();
      ctx.roundRect(8, -24, 24, 14, 3);
      ctx.fill();
      ctx.stroke();

      // Wooden Egg Basket / Bed in Rear
      ctx.fillStyle = '#b45309';
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(-40, -18, 36, 16, 4);
      ctx.fill();
      ctx.stroke();

      // Straw bedding cushion inside cup
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.ellipse(-22, -16, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();

      // Turbo speed flame effect
      if (state.activePowerUps.turboTimer > 0) {
        ctx.fillStyle = '#f97316';
        ctx.beginPath();
        ctx.moveTo(-44, -2);
        ctx.lineTo(-65, -8);
        ctx.lineTo(-52, -2);
        ctx.lineTo(-68, 4);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // F. The Egg!
      const egg = cart.egg;
      ctx.save();
      ctx.translate(egg.x, egg.y);
      ctx.rotate(egg.angle);

      // Active Shield Bubble
      if (state.activePowerUps.shieldTimer > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(0, 0, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (egg.cracked) {
        // Splattered Egg Yolk
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 4, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fef3c7';
        // Broken shell pieces
        ctx.beginPath();
        ctx.moveTo(-16, -2);
        ctx.lineTo(-24, -14);
        ctx.lineTo(-8, -10);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(22, -16);
        ctx.lineTo(6, -12);
        ctx.closePath();
        ctx.fill();
      } else {
        // Intact Egg
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, egg.radiusX, egg.radiusY, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Egg Faces based on distress
        if (egg.distress === 'happy') {
          // Smiling eyes & rosy cheeks
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(-4, -1, 1.8, 0, Math.PI * 2);
          ctx.arc(4, -1, 1.8, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.arc(0, 3, 3, 0.2, Math.PI - 0.2);
          ctx.stroke();
        } else if (egg.distress === 'nervous') {
          // Nervous squint & sweat drop
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-6, -2, 4, 2);
          ctx.fillRect(2, -2, 4, 2);

          // Sweat drop
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.arc(8, -8, 2, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#b45309';
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(-3, 4);
          ctx.lineTo(3, 4);
          ctx.stroke();
        } else if (egg.distress === 'screaming') {
          // Wide screaming round mouth!
          ctx.fillStyle = '#1e293b';
          ctx.beginPath();
          ctx.arc(-4, -3, 2.2, 0, Math.PI * 2);
          ctx.arc(4, -3, 2.2, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.ellipse(0, 4, 3.5, 5, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // Cute Little Farmer Straw Hat on top
        ctx.fillStyle = '#fef08a';
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, -egg.radiusY + 1, 12, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.roundRect(-6, -egg.radiusY - 6, 12, 7, 2);
        ctx.fill();
        ctx.stroke();
      }

      ctx.restore(); // egg

      ctx.restore(); // camera

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      eggCartAudio.stopEngine();
    };
  }, []);

  return (
    <div className="relative w-full h-[100dvh] bg-slate-900 overflow-hidden flex flex-col select-none touch-none">
      {/* Top HUD Bar */}
      <header className="absolute top-0 inset-x-0 z-20 flex items-center justify-between px-3 sm:px-6 py-2.5 bg-slate-900/85 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            <span className="text-xl">🥚</span>
            <span className="font-display font-extrabold text-lg sm:text-2xl text-amber-400">
              {hudState.distance}m
            </span>
          </div>

          <div className="flex items-center gap-1 text-xs text-white/70">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <span>Best: <strong className="text-white">{hudState.highScore}m</strong></span>
          </div>

          <div className="flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/30 px-2.5 py-1 rounded-xl text-xs font-bold text-yellow-300">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <span>{hudState.coins}</span>
          </div>
        </div>

        {/* Active Power-up Badges */}
        <div className="hidden sm:flex items-center gap-2">
          {hudState.shieldTime > 0 && (
            <div className="flex items-center gap-1 bg-sky-500/20 border border-sky-400/40 px-2 py-0.5 rounded-lg text-xs font-bold text-sky-300 animate-pulse">
              <Shield className="w-3.5 h-3.5" />
              <span>{hudState.shieldTime}s</span>
            </div>
          )}
          {hudState.magnetTime > 0 && (
            <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-lg text-xs font-bold text-amber-300 animate-pulse">
              <Magnet className="w-3.5 h-3.5" />
              <span>{hudState.magnetTime}s</span>
            </div>
          )}
          {hudState.turboTime > 0 && (
            <div className="flex items-center gap-1 bg-rose-500/20 border border-rose-400/40 px-2 py-0.5 rounded-lg text-xs font-bold text-rose-300 animate-pulse">
              <Zap className="w-3.5 h-3.5" />
              <span>{hudState.turboTime}s</span>
            </div>
          )}
        </div>

        {/* Utility Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setShowGarage(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-900 rounded-xl font-bold text-xs shadow-md transition-transform"
            aria-label="Garage Upgrades"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Garage</span>
          </button>

          <button
            onClick={handleRestart}
            className="p-1.5 sm:px-2.5 sm:py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-xs font-semibold flex items-center gap-1 transition-transform"
            aria-label="Restart Run"
          >
            <RotateCcw className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <button
            onClick={handleMuteToggle}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </header>

      {/* Main Physics Canvas */}
      <main className="relative flex-1 w-full h-full flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-cover touch-none"
        />
      </main>

      {/* Mobile Touch Pedals (Thumb Steering) */}
      <footer className="absolute bottom-3 inset-x-0 z-20 flex justify-between px-4 sm:px-12 pointer-events-none">
        {/* Left Pedal: BRAKE */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            gameStateRef.current.brakePressed = true;
            setBrakeActive(true);
          }}
          onPointerUp={() => {
            gameStateRef.current.brakePressed = false;
            setBrakeActive(false);
          }}
          onPointerCancel={() => {
            gameStateRef.current.brakePressed = false;
            setBrakeActive(false);
          }}
          className={`pointer-events-auto flex flex-col items-center justify-center w-28 h-20 sm:w-36 sm:h-24 rounded-2xl border-2 font-display font-extrabold shadow-2xl transition-all ${
            brakeActive
              ? 'bg-rose-600 border-white text-white scale-95 shadow-inner'
              : 'bg-rose-500/90 hover:bg-rose-500 border-rose-300 text-white'
          }`}
          aria-label="Brake Pedal"
        >
          <span className="text-2xl sm:text-3xl">🛑</span>
          <span className="text-xs sm:text-sm tracking-wider uppercase mt-1">BRAKE</span>
        </button>

        {/* Right Pedal: GAS */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            gameStateRef.current.gasPressed = true;
            setGasActive(true);
          }}
          onPointerUp={() => {
            gameStateRef.current.gasPressed = false;
            setGasActive(false);
          }}
          onPointerCancel={() => {
            gameStateRef.current.gasPressed = false;
            setGasActive(false);
          }}
          className={`pointer-events-auto flex flex-col items-center justify-center w-28 h-20 sm:w-36 sm:h-24 rounded-2xl border-2 font-display font-extrabold shadow-2xl transition-all ${
            gasActive
              ? 'bg-emerald-600 border-white text-white scale-95 shadow-inner'
              : 'bg-emerald-500/90 hover:bg-emerald-500 border-emerald-300 text-white'
          }`}
          aria-label="Gas Pedal"
        >
          <span className="text-2xl sm:text-3xl">⚡</span>
          <span className="text-xs sm:text-sm tracking-wider uppercase mt-1">GAS</span>
        </button>
      </footer>

      {/* Game Over Modal */}
      {hudState.gameOver && (
        <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-white/20 rounded-[28px] max-w-sm w-full p-6 text-center text-white shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-500/20 border border-amber-400/40 rounded-full flex items-center justify-center text-3xl">
              🍳
            </div>

            <h2 className="font-display font-extrabold text-2xl mb-1 text-amber-400">
              {hudState.gameOverReason === 'tipped'
                ? 'Cart Overturned!'
                : hudState.gameOverReason === 'lost_egg'
                ? 'Egg Bounced Out!'
                : 'Egg Cracked!'}
            </h2>
            <p className="text-sm text-white/70 mb-5">
              Careful on those steep pasture ridges! Feather the gas and brake to keep your egg safely nestled.
            </p>

            <div className="grid grid-cols-2 gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 mb-5 text-sm">
              <div>
                <div className="text-xs text-white/60">Distance</div>
                <div className="font-extrabold text-lg text-emerald-400">{hudState.distance}m</div>
              </div>
              <div>
                <div className="text-xs text-white/60">Coins Earned</div>
                <div className="font-extrabold text-lg text-yellow-400">+{hudState.coinsThisRun}</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowGarage(true)}
                className="flex-1 py-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl font-bold text-sm transition-transform flex items-center justify-center gap-1.5"
              >
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Garage</span>
              </button>

              <button
                onClick={handleRestart}
                className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 rounded-xl font-extrabold text-sm transition-transform flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/25"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Drive Again</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Garage Upgrades Modal */}
      {showGarage && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-[28px] max-w-md w-full p-5 text-white shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🔧</span>
                <h3 className="font-display font-extrabold text-xl text-amber-400">Pasture Garage</h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-yellow-500/20 px-2 py-1 rounded-xl text-xs font-bold text-yellow-300">
                  <Coins className="w-3.5 h-3.5 text-yellow-400" />
                  <span>{hudState.coins}</span>
                </div>
                <button
                  onClick={() => setShowGarage(false)}
                  className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {(Object.keys(UPGRADE_INFO) as Array<keyof CartUpgrades>).map((key) => {
                const info = UPGRADE_INFO[key];
                const currentLevel = gameStateRef.current.upgrades[key];
                const cost = getUpgradeCost(key, currentLevel);
                const isMax = currentLevel >= 5;
                const canAfford = hudState.coins >= cost && !isMax;

                return (
                  <div
                    key={key}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{info.icon}</span>
                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{info.name}</span>
                          <span className="text-xs text-amber-400">
                            {isMax ? 'MAX' : `Lv ${currentLevel}/5`}
                          </span>
                        </div>
                        <p className="text-xs text-white/60">{info.desc}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleBuyUpgrade(key)}
                      disabled={!canAfford}
                      className={`px-3 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1 transition-all ${
                        isMax
                          ? 'bg-white/5 text-white/40 cursor-not-allowed'
                          : canAfford
                          ? 'bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 shadow-md'
                          : 'bg-white/10 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      {isMax ? (
                        'MAX'
                      ) : (
                        <>
                          <Coins className="w-3 h-3" />
                          <span>{cost}</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setShowGarage(false)}
              className="mt-4 w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-sm rounded-xl"
            >
              Back to Drive
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-[28px] max-w-sm w-full p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-display font-extrabold text-lg text-amber-400">How to Play</h3>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 rounded-lg bg-white/10 hover:bg-white/20"
              >
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            <ul className="space-y-2.5 text-xs text-white/80 mb-5">
              <li className="flex items-start gap-2">
                <span className="text-base">⚡</span>
                <span><strong>GAS:</strong> Accelerate up hills and tilt cart backward.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🛑</span>
                <span><strong>BRAKE:</strong> Decelerate down ridges and tilt cart forward.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🥚</span>
                <span><strong>EGG BALANCE:</strong> If you accelerate or brake too hard, the egg will bounce out and shatter!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🛡️</span>
                <span><strong>POWER-UPS:</strong> Grab Blue Shields to bounce safely, Yellow Magnets to pull coins, and Red Turbo for hill bursts!</span>
              </li>
            </ul>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
            >
              Got It!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

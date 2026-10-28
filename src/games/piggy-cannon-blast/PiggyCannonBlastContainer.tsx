import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  activateRocketNitro,
  createInitialState,
  launchCannon,
  lockAngle,
  purchaseUpgrade,
  resetFlight,
  updateEngine,
  UPGRADE_COSTS,
} from './logic/engine';
import { FlightUpgradeState, PiggyCannonState } from './logic/types';
import { cannonSound } from './systems/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
}

export const PiggyCannonBlastContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [state, setState] = useState<PiggyCannonState>(() => {
    let savedCoins = 0;
    let savedBest = 0;
    let savedUpgrades: FlightUpgradeState | undefined;
    try {
      const c = localStorage.getItem('pawcade_piggy_cannon_coins');
      if (c) savedCoins = parseInt(c, 10) || 0;
      const b = localStorage.getItem('pawcade_piggy_cannon_best');
      if (b) savedBest = parseInt(b, 10) || 0;
      const u = localStorage.getItem('pawcade_piggy_cannon_upgrades');
      if (u) savedUpgrades = JSON.parse(u);
    } catch {}
    return createInitialState(savedUpgrades, savedCoins, savedBest);
  });

  const stateRef = useRef<PiggyCannonState>(state);
  stateRef.current = state;

  const [isMuted, setIsMuted] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Input states
  const tiltInput = useRef(0);
  const boostInput = useRef(false);

  // Particles & camera
  const particlesRef = useRef<Particle[]>([]);
  const cameraRef = useRef({ x: 0, y: 0 });

  // Sound event dispatcher
  const syncSoundEvents = useCallback((events: PiggyCannonState['events']) => {
    for (const ev of events) {
      switch (ev.type) {
        case 'cannon_fire':
          cannonSound.playCannonFire();
          break;
        case 'rocket_boost':
          cannonSound.playRocketThruster();
          break;
        case 'sheep_bounce':
          cannonSound.playSheepBounce();
          break;
        case 'hay_bounce':
          cannonSound.playHayBounce();
          break;
        case 'coin_collect':
          cannonSound.playCoinDing();
          break;
        case 'balloon_pop':
          cannonSound.playBalloonPop();
          break;
        case 'fuel_collect':
          cannonSound.playRocketThruster();
          break;
        case 'flight_landed':
          if (stateRef.current.distanceTraveled > stateRef.current.bestDistance) {
            cannonSound.playRecordFanfare();
          }
          break;
      }
    }
  }, []);

  // Save persistence
  const saveProgress = useCallback((newState: PiggyCannonState) => {
    try {
      localStorage.setItem('pawcade_piggy_cannon_coins', newState.totalCoins.toString());
      localStorage.setItem('pawcade_piggy_cannon_best', newState.bestDistance.toString());
      localStorage.setItem('pawcade_piggy_cannon_upgrades', JSON.stringify(newState.upgrades));
    } catch {}
  }, []);

  // Handle main action button (Angle lock -> Power launch -> Nitro boost)
  const handleMainAction = useCallback(() => {
    const cur = stateRef.current;
    if (cur.phase === 'aiming_angle') {
      const next = lockAngle(cur);
      setState(next);
      stateRef.current = next;
    } else if (cur.phase === 'charging_power') {
      const next = launchCannon(cur);
      setState(next);
      stateRef.current = next;
      syncSoundEvents(next.events);
    } else if (cur.phase === 'flying') {
      if (cur.fuelRemaining > 0) {
        const next = activateRocketNitro(cur);
        setState(next);
        stateRef.current = next;
        syncSoundEvents(next.events);
      }
    } else if (cur.phase === 'landed') {
      const next = resetFlight(cur);
      setState(next);
      stateRef.current = next;
      particlesRef.current = [];
    }
  }, [syncSoundEvents]);

  // Upgrade Purchase
  const handleBuyUpgrade = useCallback((upgradeKey: keyof FlightUpgradeState) => {
    const cur = stateRef.current;
    const next = purchaseUpgrade(cur, upgradeKey);
    if (next !== cur) {
      cannonSound.playUpgradeBuy();
      saveProgress(next);
      setState(next);
      stateRef.current = next;
    }
  }, [saveProgress]);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ([' ', 'ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S'].includes(e.key)) {
        e.preventDefault();
      }

      if (e.key === ' ' || e.key === 'Enter') {
        handleMainAction();
      }
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        tiltInput.current = 1;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        tiltInput.current = -1;
      }
      if (e.key === 'u' || e.key === 'U') {
        setShowShop((prev) => !prev);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        if (tiltInput.current > 0) tiltInput.current = 0;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        if (tiltInput.current < 0) tiltInput.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleMainAction]);

  // 60 FPS Canvas Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const curInput = {
        tilt: tiltInput.current,
        boost: boostInput.current,
      };

      const prevState = stateRef.current;
      const nextState = updateEngine(prevState, curInput, dt);
      stateRef.current = nextState;

      syncSoundEvents(nextState.events);

      // Camera lerp
      if (nextState.phase === 'flying' || nextState.phase === 'skidding') {
        cameraRef.current.x += (nextState.x - cameraRef.current.x) * Math.min(1.0, dt * 6.0);
        cameraRef.current.y += (nextState.y - cameraRef.current.y) * Math.min(1.0, dt * 6.0);

        // Spawn spark particles behind Penny
        if (Math.random() < 0.4) {
          particlesRef.current.push({
            x: nextState.x - Math.cos(nextState.rotation) * 22,
            y: nextState.y - Math.sin(nextState.rotation) * 22,
            vx: -Math.cos(nextState.rotation) * 50 + (Math.random() - 0.5) * 30,
            vy: -Math.sin(nextState.rotation) * 50 + (Math.random() - 0.5) * 30,
            size: Math.random() * 4 + 2,
            color: '#facc15',
            alpha: 0.85,
            life: 0,
            maxLife: 0.4,
          });
        }
      } else if (nextState.phase === 'aiming_angle' || nextState.phase === 'charging_power') {
        cameraRef.current.x += (60 - cameraRef.current.x) * 0.1;
        cameraRef.current.y += (40 - cameraRef.current.y) * 0.1;
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        return p.life < p.maxLife;
      });

      // Render to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderScene(ctx, canvas.width, canvas.height, nextState, cameraRef.current, particlesRef.current);
        }
      }

      // State transitions to save
      if (nextState.phase === 'landed' && prevState.phase !== 'landed') {
        saveProgress(nextState);
        setState(nextState);
      } else if (nextState.phase !== prevState.phase || nextState.coinsEarnedThisRun !== prevState.coinsEarnedThisRun) {
        setState(nextState);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [saveProgress, syncSoundEvents]);

  // Canvas Render
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameState: PiggyCannonState,
    camera: { x: number; y: number },
    particles: Particle[]
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Sky Background Gradient based on Altitude
    const altRatio = Math.min(1.0, camera.y / 600);
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (altRatio < 0.5) {
      skyGrad.addColorStop(0, '#0284c7');
      skyGrad.addColorStop(0.7, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
    } else {
      skyGrad.addColorStop(0, '#0f172a'); // Space twilight
      skyGrad.addColorStop(0.6, '#1e1b4b');
      skyGrad.addColorStop(1, '#0284c7');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // Background Stars at high altitude
    if (camera.y > 250) {
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 25; i++) {
        const sx = ((i * 137) % width);
        const sy = ((i * 93) % (height / 2));
        ctx.fillRect(sx, sy, 2, 2);
      }
    }

    // Save for world translation
    // In our physics: Y is positive UP, so canvas Y = height - (worldY - camera.y + 120)
    ctx.save();
    const groundScreenY = height - 120 + camera.y;
    ctx.translate(width / 3 - camera.x, groundScreenY);

    // Draw Rolling Grass Ground
    ctx.fillStyle = '#16a34a';
    ctx.fillRect(camera.x - width, 0, width * 3, 200);

    // Lush pasture top edge
    ctx.fillStyle = '#4ade80';
    ctx.fillRect(camera.x - width, 0, width * 3, 14);

    // Distance Markers along ground every 100m
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.textAlign = 'center';
    const firstMarker = Math.floor((camera.x - width) / 100) * 100;
    const lastMarker = Math.ceil((camera.x + width * 2) / 100) * 100;
    for (let mx = firstMarker; mx <= lastMarker; mx += 100) {
      if (mx >= 0) {
        ctx.fillRect(mx - 2, -20, 4, 20);
        ctx.fillText(`${mx}m`, mx, -26);
      }
    }

    // Draw Cannon at x = 0
    drawCannon(ctx, gameState);

    // Draw Sky Entities (Coins, Balloons, Sheep, Hay, Mud)
    for (const ent of gameState.entities) {
      if (!ent.collected) {
        drawEntity(ctx, ent);
      }
    }

    // Draw Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, -p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Penny Piglet if not inside cannon before launch
    if (gameState.phase !== 'aiming_angle' && gameState.phase !== 'charging_power') {
      drawPenny(ctx, gameState.x, -gameState.y, gameState.rotation, gameState.phase === 'flying');
    }

    ctx.restore(); // Restore world translation
  };

  const drawCannon = (ctx: CanvasRenderingContext2D, gameState: PiggyCannonState) => {
    // Cannon Base Carriage
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(70, 0);
    ctx.lineTo(40, -35);
    ctx.closePath();
    ctx.fill();

    // Wheel
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(40, 0, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Cannon Barrel (Rotates with angleDeg)
    const rad = (gameState.angleDeg * Math.PI) / 180;
    ctx.save();
    ctx.translate(40, -35);
    ctx.rotate(-rad);

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, -18, 70, 36);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.strokeRect(55, -20, 15, 40);

    // Circus red stripe
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(20, -17, 18, 34);

    // If aiming or charging, draw Penny peeking out!
    if (gameState.phase === 'aiming_angle' || gameState.phase === 'charging_power') {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🐷', 68, 0);
    }

    ctx.restore();
  };

  const drawEntity = (ctx: CanvasRenderingContext2D, ent: PiggyCannonState['entities'][0]) => {
    const screenY = -ent.y;
    if (ent.type === 'coin') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(ent.x, screenY, ent.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.font = 'bold 12px sans-serif';
      ctx.fillStyle = '#78350f';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('$', ent.x, screenY);
    } else if (ent.type === 'star_balloon') {
      ctx.font = '26px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('⭐', ent.x, screenY);
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ent.x, screenY + 12);
      ctx.lineTo(ent.x, screenY + 28);
      ctx.stroke();
    } else if (ent.type === 'fuel_soda') {
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🥤', ent.x, screenY);
    } else if (ent.type === 'bouncy_sheep') {
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('🐑', ent.x, screenY + 4);
    } else if (ent.type === 'hay_bale') {
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.roundRect(ent.x - 20, screenY - 20, 40, 24, 4);
      ctx.fill();
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2;
      ctx.stroke();
    } else if (ent.type === 'mud_puddle') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(ent.x, screenY, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  const drawPenny = (ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, isFlying: boolean) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Cape flapping
    if (isFlying) {
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(-16, 4);
      ctx.lineTo(-45, -6);
      ctx.lineTo(-38, 16);
      ctx.closePath();
      ctx.fill();
    }

    // Rocket Thruster if has fuel
    if (stateRef.current.fuelRemaining > 0 && isFlying) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(-22, -8, 12, 16);
    }

    // Penny Body
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#be185d';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Aviator Goggles
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(4, -12, 14, 8);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, -10, 4, 4);
    ctx.fillRect(12, -10, 4, 4);

    // Snout
    ctx.fillStyle = '#fbcfe8';
    ctx.beginPath();
    ctx.ellipse(16, 2, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Little ears
    ctx.fillStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-2, -22);
    ctx.lineTo(4, -12);
    ctx.fill();

    ctx.restore();
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none">
      {/* Flight Telemetry HUD Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-pink-500/30 rounded-xl mb-2 text-white shadow-lg">
        {/* Distance & Best */}
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block leading-tight">Distance</span>
            <span className="font-mono text-base sm:text-xl font-black text-amber-300">
              {state.distanceTraveled} m
            </span>
          </div>
          <div className="hidden sm:block border-l border-slate-700 pl-3">
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block leading-tight">Best Record</span>
            <span className="font-mono text-xs sm:text-sm font-bold text-slate-300">
              {state.bestDistance} m
            </span>
          </div>
        </div>

        {/* Altitude & Speed */}
        <div className="flex items-center gap-3">
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block leading-tight">Altitude</span>
            <span className="font-mono text-sm sm:text-base font-black text-cyan-300">
              {state.y > 0 ? Math.round(state.y) : 0} m
            </span>
          </div>
          <div>
            <span className="text-[10px] uppercase font-extrabold text-slate-400 block leading-tight">Speed</span>
            <span className="font-mono text-sm sm:text-base font-black text-white">
              {Math.round(Math.hypot(state.vx, state.vy))}
            </span>
          </div>
        </div>

        {/* Coins & Rocket Fuel */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-base">🪙</span>
            <span className="font-mono text-sm sm:text-base font-black text-yellow-300">
              {state.totalCoins}
            </span>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: state.maxFuel }).map((_, i) => (
              <span key={i} className={`text-base ${i < state.fuelRemaining ? 'opacity-100' : 'opacity-25'}`}>
                🚀
              </span>
            ))}
          </div>
        </div>

        {/* Upgrade Shop Toggle & Mute */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowShop((prev) => !prev)}
            aria-label="Open Upgrades Shop"
            className="px-2.5 py-1 min-h-[36px] flex items-center gap-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white font-black text-xs cursor-pointer shadow-md"
          >
            <span>🛒 Shop</span>
          </button>
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              cannonSound.setMuted(next);
            }}
            aria-label="Toggle audio"
            className="p-1.5 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-pink-500/40 shadow-2xl bg-slate-950 aspect-[4/3] max-h-[560px]">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full object-contain"
        />

        {/* Aiming Angle Overlay Gauge */}
        {state.phase === 'aiming_angle' && (
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs p-3 rounded-2xl border border-pink-400/40 text-center">
            <span className="text-xs uppercase font-extrabold text-pink-300 block mb-1">
              Step 1: Set Launch Angle
            </span>
            <div className="font-mono text-2xl font-black text-white">
              {Math.round(state.angleDeg)}°
            </div>
            <p className="text-[10px] text-slate-300 mt-1">Tap button below or SPACE to lock</p>
          </div>
        )}

        {/* Charging Power Overlay Gauge */}
        {state.phase === 'charging_power' && (
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-xs p-3 rounded-2xl border border-amber-400/40 text-center w-52">
            <span className="text-xs uppercase font-extrabold text-amber-300 block mb-1">
              Step 2: Gunpowder Blast
            </span>
            <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden border border-slate-700 p-0.5">
              <div
                className="h-full bg-gradient-to-r from-yellow-500 to-red-500 rounded-full transition-all"
                style={{ width: `${Math.round(state.powerRatio * 100)}%` }}
              />
            </div>
            <div className="font-mono text-base font-black text-white mt-1">
              {Math.round(state.powerRatio * 100)}% POWER
            </div>
          </div>
        )}

        {/* Flight Landed Score Summary Overlay */}
        {state.phase === 'landed' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-6xl mb-2">🎉</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              FLIGHT COMPLETE!
            </h3>
            <p className="text-pink-300 font-bold text-lg mt-1">
              Distance: <span className="font-mono text-white font-black">{state.distanceTraveled} m</span>
            </p>
            <div className="flex gap-4 mt-2 text-xs sm:text-sm text-slate-300">
              <div>Max Altitude: <span className="font-bold text-cyan-300">{state.maxAltitude} m</span></div>
              <div>Coins Collected: <span className="font-bold text-yellow-300">+{state.coinsEarnedThisRun} 🪙</span></div>
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowShop(true)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-pink-600 hover:bg-pink-500 text-white font-bold text-sm cursor-pointer shadow-lg"
              >
                🛒 Upgrade Shop
              </button>
              <button
                onClick={handleMainAction}
                className="px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
              >
                Launch Again 🚀
              </button>
            </div>
          </div>
        )}

        {/* Upgrade Shop Modal */}
        {showShop && (
          <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto z-20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🛒</span>
                <h3 className="text-lg sm:text-xl font-black text-white">Barnyard Launch Upgrades</h3>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm sm:text-base font-black text-yellow-400">
                  🪙 {state.totalCoins}
                </span>
                <button
                  onClick={() => setShowShop(false)}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
              {/* Upgrade 1: Cannon Power */}
              <UpgradeCard
                title="Circus Cannon Gunpowder"
                desc="Increases initial muzzle velocity and launch distance."
                icon="💥"
                level={state.upgrades.cannonPower}
                cost={UPGRADE_COSTS[state.upgrades.cannonPower + 1]}
                canAfford={state.totalCoins >= (UPGRADE_COSTS[state.upgrades.cannonPower + 1] || 99999)}
                onBuy={() => handleBuyUpgrade('cannonPower')}
              />

              {/* Upgrade 2: Aviator Aerodynamics */}
              <UpgradeCard
                title="Aviator Cape & Goggles"
                desc="Reduces air resistance drag for longer glider flight."
                icon="🪂"
                level={state.upgrades.aerodynamics}
                cost={UPGRADE_COSTS[state.upgrades.aerodynamics + 1]}
                canAfford={state.totalCoins >= (UPGRADE_COSTS[state.upgrades.aerodynamics + 1] || 99999)}
                onBuy={() => handleBuyUpgrade('aerodynamics')}
              />

              {/* Upgrade 3: Rocket Nitro Thruster */}
              <UpgradeCard
                title="Rocket Soda Thrusters"
                desc="Grants mid-air turbo boost charges to regain height."
                icon="🚀"
                level={state.upgrades.rocketNitro}
                cost={UPGRADE_COSTS[state.upgrades.rocketNitro + 1]}
                canAfford={state.totalCoins >= (UPGRADE_COSTS[state.upgrades.rocketNitro + 1] || 99999)}
                onBuy={() => handleBuyUpgrade('rocketNitro')}
              />

              {/* Upgrade 4: Bouncy Shoes */}
              <UpgradeCard
                title="Bouncy Spring Shoes"
                desc="Retains more bounce velocity and grants extra skips."
                icon="👟"
                level={state.upgrades.bouncyShoes}
                cost={UPGRADE_COSTS[state.upgrades.bouncyShoes + 1]}
                canAfford={state.totalCoins >= (UPGRADE_COSTS[state.upgrades.bouncyShoes + 1] || 99999)}
                onBuy={() => handleBuyUpgrade('bouncyShoes')}
              />

              {/* Upgrade 5: Coin Magnet */}
              <UpgradeCard
                title="Golden Coin Magnet"
                desc="Pulls airborne coins and star balloons toward Penny."
                icon="🧲"
                level={state.upgrades.coinMagnet}
                cost={UPGRADE_COSTS[state.upgrades.coinMagnet + 1]}
                canAfford={state.totalCoins >= (UPGRADE_COSTS[state.upgrades.coinMagnet + 1] || 99999)}
                onBuy={() => handleBuyUpgrade('coinMagnet')}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tactile Mobile Controls Overlay (>=48px touch targets) */}
      <div className="w-full flex items-center justify-between px-2 pt-2 gap-3 sm:hidden">
        {/* Pitch Tilt Controls */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => { tiltInput.current = 1; }}
            onPointerUp={() => { tiltInput.current = 0; }}
            onPointerLeave={() => { tiltInput.current = 0; }}
            aria-label="Tilt Nose Up"
            className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-pink-600 border border-slate-700 text-xl font-black flex flex-col items-center justify-center text-white shadow-lg touch-none"
          >
            <span>▲</span>
            <span className="text-[9px]">GLIDE</span>
          </button>
          <button
            onPointerDown={() => { tiltInput.current = -1; }}
            onPointerUp={() => { tiltInput.current = 0; }}
            onPointerLeave={() => { tiltInput.current = 0; }}
            aria-label="Tilt Nose Down"
            className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-pink-600 border border-slate-700 text-xl font-black flex flex-col items-center justify-center text-white shadow-lg touch-none"
          >
            <span>▼</span>
            <span className="text-[9px]">DIVE</span>
          </button>
        </div>

        {/* Main Action / Fire / Boost Button */}
        <button
          onClick={handleMainAction}
          aria-label="Action Trigger"
          className="flex-1 h-16 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 active:from-pink-500 active:to-amber-400 text-white font-black text-sm flex flex-col items-center justify-center shadow-lg touch-none"
        >
          {state.phase === 'aiming_angle' && (
            <>
              <span className="text-xl">🎯</span>
              <span>LOCK ANGLE</span>
            </>
          )}
          {state.phase === 'charging_power' && (
            <>
              <span className="text-xl">💥</span>
              <span>FIRE CANNON!</span>
            </>
          )}
          {state.phase === 'flying' && (
            <>
              <span className="text-xl">🚀</span>
              <span>NITRO BOOST ({state.fuelRemaining})</span>
            </>
          )}
          {(state.phase === 'landed' || state.phase === 'skidding') && (
            <>
              <span className="text-xl">🔄</span>
              <span>LAUNCH AGAIN</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

interface UpgradeCardProps {
  title: string;
  desc: string;
  icon: string;
  level: number;
  cost?: number;
  canAfford: boolean;
  onBuy: () => void;
}

const UpgradeCard: React.FC<UpgradeCardProps> = ({
  title,
  desc,
  icon,
  level,
  cost,
  canAfford,
  onBuy,
}) => {
  const isMax = level >= 5;

  return (
    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-3 shadow-md">
      <div className="flex items-start gap-2.5">
        <span className="text-2xl select-none">{icon}</span>
        <div>
          <h4 className="text-xs sm:text-sm font-black text-white">{title}</h4>
          <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{desc}</p>
          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`w-3.5 h-1.5 rounded-full ${i < level ? 'bg-pink-500' : 'bg-slate-800'}`}
              />
            ))}
            <span className="text-[10px] font-bold text-slate-400 ml-1">Lvl {level}/5</span>
          </div>
        </div>
      </div>

      <div className="shrink-0 flex flex-col items-end">
        {isMax ? (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-extrabold text-[10px] uppercase">
            MAX
          </span>
        ) : (
          <button
            onClick={onBuy}
            disabled={!canAfford}
            className={`px-3 py-1.5 min-h-[34px] rounded-xl font-black text-xs transition-all cursor-pointer ${
              canAfford
                ? 'bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 shadow-md'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            🪙 {cost}
          </button>
        )}
      </div>
    </div>
  );
};

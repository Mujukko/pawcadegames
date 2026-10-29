import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TractorHillClimbState,
  VehicleInput,
  StageId,
} from './logic/types';
import {
  createInitialState,
  updateEngine,
  getTerrainHeight,
  STAGES,
  STAGE_ORDER,
  METERS_TO_WORLD,
} from './logic/engine';
import { tractorSound } from './systems/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  maxLife: number;
  life: number;
}

export const TractorHillClimbContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<TractorHillClimbState>(() =>
    createInitialState(0)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => tractorSound.getMuted());
  const stateRef = useRef<TractorHillClimbState>(gameState);
  stateRef.current = gameState;

  const inputRef = useRef<VehicleInput>({ gas: false, brake: false });
  const animFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const particlesRef = useRef<Particle[]>([]);
  const lastStuntIdRef = useRef<string | null>(null);
  const wasAirborneRef = useRef<boolean>(false);
  const lastCoinCountRef = useRef<number>(0);
  const lastFuelPickupTimeRef = useRef<number>(0);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    tractorSound.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  // Restart current stage
  const handleRestart = useCallback(() => {
    tractorSound.stopEngineSound();
    const curr = stateRef.current;
    const next = createInitialState(curr.stageIndex, curr.bestDistance);
    next.coins = curr.coins;
    lastCoinCountRef.current = curr.coins;
    setGameState(next);
  }, []);

  // Next stage progression
  const handleNextStage = useCallback(() => {
    tractorSound.stopEngineSound();
    const curr = stateRef.current;
    const nextIndex = (curr.stageIndex + 1) % STAGE_ORDER.length;
    const next = createInitialState(nextIndex, curr.bestDistance);
    next.coins = curr.coins;
    next.score = curr.score;
    lastCoinCountRef.current = curr.coins;
    setGameState(next);
  }, []);

  // Stage selection
  const handleSelectStage = useCallback((stageId: StageId) => {
    tractorSound.stopEngineSound();
    const index = STAGE_ORDER.indexOf(stageId);
    if (index >= 0) {
      const curr = stateRef.current;
      const next = createInitialState(index, curr.bestDistance);
      next.coins = curr.coins;
      next.score = curr.score;
      setGameState(next);
    }
  }, []);

  // Keyboard navigation listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowRight', 'KeyD', 'KeyW', 'Space'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.gas = true;
      } else if (['ArrowLeft', 'KeyA', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.brake = true;
      } else if (e.code === 'KeyR') {
        handleRestart();
      } else if (e.code === 'KeyM') {
        toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowRight', 'KeyD', 'KeyW', 'Space'].includes(e.code)) {
        inputRef.current.gas = false;
      } else if (['ArrowLeft', 'KeyA', 'KeyS'].includes(e.code)) {
        inputRef.current.brake = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleRestart, toggleMute]);

  // Main 60 FPS animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let mounted = true;
    let cameraX = 0;
    let cameraY = 0;

    const loop = (currentTime: number) => {
      if (!mounted) return;
      const dt = Math.min(0.05, (currentTime - lastTimeRef.current) / 1000);
      lastTimeRef.current = currentTime;

      const currentState = stateRef.current;
      const currentInput = inputRef.current;

      // Update engine physics if in playable status
      if (currentState.status === 'ready' || currentState.status === 'driving') {
        const nextState = updateEngine(currentState, currentInput, dt);
        stateRef.current = nextState;

        // Sound triggers
        tractorSound.updateEngineSound(
          nextState.chassis.vx,
          currentInput.gas,
          nextState.status === 'driving'
        );

        // Suspension bump on landing
        const isAirborne =
          !nextState.chassis.rearWheel.isGrounded && !nextState.chassis.frontWheel.isGrounded;
        if (wasAirborneRef.current && !isAirborne) {
          tractorSound.playSuspensionBump();
        }
        wasAirborneRef.current = isAirborne;

        // Coin audio
        if (nextState.coins > lastCoinCountRef.current) {
          tractorSound.playCoin();
          lastCoinCountRef.current = nextState.coins;
        }

        // Stunt audio
        if (nextState.activeStunt && nextState.activeStunt.id !== lastStuntIdRef.current) {
          lastStuntIdRef.current = nextState.activeStunt.id;
          if (nextState.activeStunt.type === 'fuel_boost') {
            tractorSound.playFuelRefill();
          } else {
            tractorSound.playStuntFanfare();
          }
        }

        // Low fuel beep warning (< 20%)
        if (nextState.fuel < 20 && Math.floor(nextState.timeElapsed * 2) % 2 === 0) {
          if (Math.random() < 0.08) {
            tractorSound.playLowFuelWarning();
          }
        }

        // Crash audio trigger
        if (nextState.status === 'crashed') {
          tractorSound.playCrash();
        } else if (nextState.status === 'victory') {
          tractorSound.playVictory();
        }

        // Spawn particles
        // 1. Exhaust smoke
        if (currentInput.gas && Math.random() < 0.6) {
          const cos = Math.cos(nextState.chassis.angle);
          const sin = Math.sin(nextState.chassis.angle);
          const pipeX = nextState.chassis.x - 18 * cos - (-42) * sin;
          const pipeY = nextState.chassis.y - 18 * sin + (-42) * cos;
          particlesRef.current.push({
            x: pipeX,
            y: pipeY,
            vx: -cos * 35 + (Math.random() * 20 - 10),
            vy: -sin * 35 - Math.random() * 25,
            size: 6 + Math.random() * 6,
            color: '#94a3b8',
            alpha: 0.8,
            maxLife: 0.55,
            life: 0.55,
          });
        }

        // 2. Dirt spray from rear tire
        if (nextState.chassis.rearWheel.isGrounded && currentInput.gas && Math.random() < 0.5) {
          particlesRef.current.push({
            x: nextState.chassis.rearWheel.worldX,
            y: nextState.chassis.rearWheel.worldY + 12,
            vx: -Math.abs(nextState.chassis.vx) * 0.4 - Math.random() * 50,
            vy: -Math.random() * 45 - 15,
            size: 3 + Math.random() * 4,
            color: '#78350f',
            alpha: 0.9,
            maxLife: 0.4,
            life: 0.4,
          });
        }

        // Sync React HUD state
        setGameState({ ...nextState });
      }

      // Update particles
      const updatedParticles: Particle[] = [];
      for (const p of particlesRef.current) {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        p.alpha = Math.max(0, (p.life / p.maxLife) * 0.85);
        p.size += dt * 8;
        if (p.life > 0) {
          updatedParticles.push(p);
        }
      }
      particlesRef.current = updatedParticles;

      // Smooth Camera lerp
      const targetCamX = stateRef.current.chassis.x - canvas.width * 0.32;
      const targetCamY = stateRef.current.chassis.y - canvas.height * 0.58;
      cameraX += (targetCamX - cameraX) * Math.min(1, dt * 7.5);
      cameraY += (targetCamY - cameraY) * Math.min(1, dt * 6.0);

      // RENDER CANVAS
      renderScene(ctx, canvas, stateRef.current, cameraX, cameraY, particlesRef.current);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => {
      mounted = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      tractorSound.stopEngineSound();
    };
  }, []);

  // Scene rendering logic
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    canvas: HTMLCanvasElement,
    state: TractorHillClimbState,
    camX: number,
    camY: number,
    particles: Particle[]
  ) => {
    const width = canvas.width;
    const height = canvas.height;
    const stageConfig = STAGES[state.stageId];

    // 1. Clear & Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (state.stageId === 'autumn_orchard') {
      skyGrad.addColorStop(0, '#fdba74');
      skyGrad.addColorStop(0.5, '#fed7aa');
      skyGrad.addColorStop(1, '#ffedd5');
    } else if (state.stageId === 'windmill_ridge') {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.6, '#7dd3fc');
      skyGrad.addColorStop(1, '#e0f2fe');
    } else if (state.stageId === 'muddy_mountain') {
      skyGrad.addColorStop(0, '#c084fc');
      skyGrad.addColorStop(0.55, '#e9d5ff');
      skyGrad.addColorStop(1, '#fae8ff');
    } else {
      // Clover Pasture
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(0.6, '#bae6fd');
      skyGrad.addColorStop(1, '#fef08a');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Sun & Clouds (Parallax 0.05)
    ctx.save();
    const sunScreenX = width * 0.8 - (camX * 0.02) % (width * 1.5);
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(sunScreenX, 80, 42, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Drifting clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (let i = 0; i < 5; i++) {
      const cloudX = ((i * 320 - camX * 0.08) % (width + 300)) - 100;
      const cloudY = 40 + (i % 3) * 35;
      ctx.beginPath();
      ctx.arc(cloudX, cloudY, 32, 0, Math.PI * 2);
      ctx.arc(cloudX + 26, cloudY - 10, 26, 0, Math.PI * 2);
      ctx.arc(cloudX + 50, cloudY, 28, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Distant Mountain Silhouettes (Parallax 0.15)
    ctx.save();
    ctx.fillStyle = state.stageId === 'autumn_orchard' ? '#ea580c' : '#15803d';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 30) {
      const worldX = camX * 0.15 + x;
      const distY =
        height * 0.55 +
        Math.sin(worldX * 0.002) * 50 +
        Math.cos(worldX * 0.004) * 25;
      ctx.lineTo(x, distY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 4. Midground Rolling Pasture & Windmills (Parallax 0.4)
    ctx.save();
    ctx.fillStyle = state.stageId === 'autumn_orchard' ? '#c2410c' : '#16a34a';
    ctx.globalAlpha = 0.55;
    ctx.beginPath();
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += 25) {
      const worldX = camX * 0.4 + x;
      const midY =
        height * 0.65 +
        Math.sin(worldX * 0.003) * 40 +
        Math.sin(worldX * 0.007) * 20;
      ctx.lineTo(x, midY);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 5. Main Foreground Terrain
    ctx.save();
    ctx.translate(-camX, -camY);

    // Create terrain gradient
    const startScreenWorldX = camX - 40;
    const endScreenWorldX = camX + width + 40;
    const step = 8;

    // Fill deep subsoil
    ctx.beginPath();
    ctx.moveTo(startScreenWorldX, height + camY + 200);
    for (let x = startScreenWorldX; x <= endScreenWorldX; x += step) {
      const y = getTerrainHeight(x, state.stageId);
      ctx.lineTo(x, y);
    }
    ctx.lineTo(endScreenWorldX, height + camY + 200);
    ctx.closePath();

    const dirtGrad = ctx.createLinearGradient(0, camY, 0, camY + height);
    dirtGrad.addColorStop(0, '#582c0b');
    dirtGrad.addColorStop(0.3, '#3e1e07');
    dirtGrad.addColorStop(1, '#271203');
    ctx.fillStyle = dirtGrad;
    ctx.fill();

    // Lush Grass Top Border Layer
    ctx.beginPath();
    for (let x = startScreenWorldX; x <= endScreenWorldX; x += step) {
      const y = getTerrainHeight(x, state.stageId);
      if (x === startScreenWorldX) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.strokeStyle = stageConfig.themeColor;
    ctx.lineWidth = 14;
    ctx.stroke();

    // Highlight Edge Line
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.globalAlpha = 1.0;

    // Wooden fence posts along track
    for (let fx = Math.floor(startScreenWorldX / 140) * 140; fx < endScreenWorldX; fx += 140) {
      if (fx > 200) {
        const fy = getTerrainHeight(fx, state.stageId);
        ctx.fillStyle = '#78350f';
        ctx.fillRect(fx - 4, fy - 28, 8, 28);
        ctx.fillStyle = '#92400e';
        ctx.fillRect(fx - 70, fy - 20, 140, 5);
        ctx.fillRect(fx - 70, fy - 10, 140, 5);
      }
    }

    // 6. Finish Line Flag at Target Distance
    const finishWorldX = stageConfig.targetMeters * METERS_TO_WORLD;
    if (finishWorldX >= startScreenWorldX && finishWorldX <= endScreenWorldX) {
      const flagGroundY = getTerrainHeight(finishWorldX, state.stageId);
      // Pole
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(finishWorldX - 3, flagGroundY - 90, 6, 90);
      // Checkered Flag
      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.moveTo(finishWorldX + 3, flagGroundY - 90);
      ctx.lineTo(finishWorldX + 45, flagGroundY - 72);
      ctx.lineTo(finishWorldX + 3, flagGroundY - 54);
      ctx.closePath();
      ctx.fill();
      // Star emblem
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(finishWorldX + 18, flagGroundY - 72, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // 7. Render Pickups (Coins and Fuel)
    // Coins
    for (const coin of state.coinsList) {
      if (coin.collected) continue;
      if (coin.x < startScreenWorldX || coin.x > endScreenWorldX) continue;

      ctx.save();
      ctx.translate(coin.x, coin.y);
      // Pulse animation
      const scale = 1.0 + Math.sin(state.timeElapsed * 6 + coin.x) * 0.12;
      ctx.scale(scale, scale);

      // Gold Outer Ring
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();

      // Inner Core
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();

      // Star Icon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    // Fuel Jerry Cans
    for (const fuel of state.fuelList) {
      if (fuel.collected) continue;
      if (fuel.x < startScreenWorldX || fuel.x > endScreenWorldX) continue;

      ctx.save();
      ctx.translate(fuel.x, fuel.y);
      // Red can body
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(-14, -18, 28, 36);
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(-10, -24, 20, 8);
      // Yellow diesel badge
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(0, 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ca8a04';
      ctx.font = 'bold 8px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('D', 0, 5);

      ctx.restore();
    }

    // 8. Render Particles
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 9. Render Tractor Vehicle
    renderTractor(ctx, state.chassis, state.timeElapsed);

    ctx.restore(); // restore translated camera
  };

  // Tractor Vehicle Rendering
  const renderTractor = (
    ctx: CanvasRenderingContext2D,
    chassis: TractorHillClimbState['chassis'],
    timeElapsed: number
  ) => {
    ctx.save();
    ctx.translate(chassis.x, chassis.y);
    ctx.rotate(chassis.angle);

    // Chrome Exhaust Pipe
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-16, -45, 6, 32);
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.moveTo(-18, -45);
    ctx.lineTo(-8, -45);
    ctx.lineTo(-10, -40);
    ctx.lineTo(-16, -40);
    ctx.closePath();
    ctx.fill();

    // Driver: Barnaby the Puppy
    ctx.save();
    ctx.translate(-8, -28);

    // Straw Hat
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.ellipse(0, -10, 16, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, -12, 8, Math.PI, 0);
    ctx.fill();

    // Puppy Head
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 11, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Ears
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.ellipse(-10, 2, 4, 7, -0.3, 0, Math.PI * 2);
    ctx.ellipse(10, 2, 4, 7, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Snout & Nose
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.ellipse(0, 4, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 2, 2, 0, Math.PI * 2);
    ctx.fill();

    // Sparkle Eyes
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-4, -1, 2, 0, Math.PI * 2);
    ctx.arc(4, -1, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -2, 0.8, 0, Math.PI * 2);
    ctx.arc(5, -2, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // Blue Overalls Body
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(-6, 9, 12, 10);
    ctx.restore();

    // Rear Mudguard Fender
    ctx.fillStyle = '#b91c1c';
    ctx.beginPath();
    ctx.arc(-26, 16, 26, Math.PI * 1.1, Math.PI * 1.95);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#ef4444';
    ctx.stroke();

    // Tractor Main Red Hood Body
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.roundRect(-4, -8, 48, 24, [4, 8, 8, 4]);
    ctx.fill();

    // Yellow Racing Stripe
    ctx.fillStyle = '#facc15';
    ctx.fillRect(-4, 2, 48, 4);

    // Radiator Front Grill
    ctx.fillStyle = '#334155';
    ctx.fillRect(36, -6, 8, 20);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(38, -2);
    ctx.lineTo(42, -2);
    ctx.moveTo(38, 4);
    ctx.lineTo(42, 4);
    ctx.moveTo(38, 10);
    ctx.lineTo(42, 10);
    ctx.stroke();

    // Front Headlight Beam
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(44, -2, 5, 0, Math.PI * 2);
    ctx.fill();

    // Big Rear Wheel (-26, 16)
    ctx.save();
    ctx.translate(chassis.rearWheel.offsetX, chassis.rearWheel.offsetY);
    ctx.rotate(chassis.rearWheel.angularVel * timeElapsed * 0.2);

    // Outer Tire
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, chassis.rearWheel.radius, 0, Math.PI * 2);
    ctx.fill();

    // Knobby Lugs
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 4) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 12, Math.sin(a) * 12);
      ctx.lineTo(Math.cos(a) * chassis.rearWheel.radius, Math.sin(a) * chassis.rearWheel.radius);
      ctx.stroke();
    }

    // Yellow Hubcap Rim
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#713f12';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Small Front Wheel (+26, 20)
    ctx.save();
    ctx.translate(chassis.frontWheel.offsetX, chassis.frontWheel.offsetY);
    ctx.rotate(chassis.rearWheel.angularVel * timeElapsed * 0.25);

    // Outer Tire
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, chassis.frontWheel.radius, 0, Math.PI * 2);
    ctx.fill();

    // Lugs
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
      ctx.lineTo(Math.cos(a) * chassis.frontWheel.radius, Math.sin(a) * chassis.frontWheel.radius);
      ctx.stroke();
    }

    // Yellow Hubcap Rim
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#713f12';
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore(); // restore chassis transform
  };

  const currentStage = STAGES[gameState.stageId];
  const targetDistance = currentStage.targetMeters;
  const progressPct = Math.min(100, Math.round((gameState.distance / targetDistance) * 100));

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none overscroll-none pb-4">
      {/* Top HUD Card */}
      <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-t-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-xl">
        {/* Stage & Distance Progress */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-xs uppercase tracking-wider font-extrabold text-amber-400">
              {currentStage.name}
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white">{gameState.distance}m</span>
              <span className="text-xs text-slate-400 font-bold">/ {targetDistance}m</span>
            </div>
          </div>
          {/* Progress Bar */}
          <div className="hidden sm:block w-32 h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Diesel Fuel Tank Gauge */}
        <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
          <span className="text-lg">⛽</span>
          <div className="flex flex-col">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-300">
              <span>DIESEL</span>
              <span className={gameState.fuel < 25 ? 'text-red-400 animate-pulse' : 'text-emerald-400'}>
                {Math.round(gameState.fuel)}%
              </span>
            </div>
            <div className="w-24 h-2 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-700">
              <div
                className={`h-full transition-all duration-75 ${
                  gameState.fuel > 50
                    ? 'bg-emerald-500'
                    : gameState.fuel > 25
                    ? 'bg-amber-400'
                    : 'bg-red-500 animate-pulse'
                }`}
                style={{ width: `${Math.max(0, gameState.fuel)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Coins & Score */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
            <span className="text-base">🪙</span>
            <span className="font-extrabold text-amber-300 text-sm">{gameState.coins}</span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase font-bold text-slate-400">Score</span>
            <span className="font-black text-white text-base">{gameState.score}</span>
          </div>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition border border-slate-700 active:scale-95"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] bg-sky-900 overflow-hidden border-x border-slate-800">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full block object-contain"
        />

        {/* Active Stunt Notification Banner */}
        {gameState.activeStunt && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500/90 text-slate-950 font-black px-4 py-1.5 rounded-full shadow-lg border-2 border-white animate-bounce text-sm sm:text-base tracking-wider z-10 flex items-center gap-1.5">
            <span>✨</span>
            <span>{gameState.activeStunt.label}</span>
          </div>
        )}

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900/95 border-2 border-amber-400 p-6 rounded-2xl max-w-sm text-center shadow-2xl">
              <span className="text-4xl mb-2 block">🚜💨</span>
              <h2 className="text-xl font-black text-white mb-1">Tractor Hill Climb</h2>
              <p className="text-xs text-slate-300 mb-4">
                Tackle bumpy ridges, hay ramps and suspension bridges! Balance your tractor in mid-air to pull off backflips and frontflips.
              </p>
              <button
                onClick={() => {
                  inputRef.current.gas = true;
                  setTimeout(() => {
                    inputRef.current.gas = false;
                  }, 150);
                }}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-black rounded-xl text-base shadow-lg transition active:scale-95"
              >
                TAP GAS TO START! 🏁
              </button>
            </div>
          </div>
        )}

        {/* Crashed Overlay */}
        {gameState.status === 'crashed' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border-2 border-red-500/80 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <span className="text-5xl mb-2 block">💥</span>
              <h2 className="text-2xl font-black text-red-400 mb-1">ROLLOVER CRASH!</h2>
              <p className="text-xs text-slate-400 mb-4">Farmer Barnaby bumped his straw hat!</p>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl mb-4 text-left border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">DISTANCE</span>
                  <span className="text-lg font-black text-white">{gameState.distance}m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">BEST</span>
                  <span className="text-lg font-black text-amber-400">{gameState.bestDistance}m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">COINS</span>
                  <span className="text-lg font-black text-yellow-300">{gameState.coins}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">SCORE</span>
                  <span className="text-lg font-black text-emerald-400">{gameState.score}</span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-3 bg-gradient-to-r from-red-500 to-amber-500 text-slate-950 font-black rounded-xl text-base shadow-lg transition active:scale-95 hover:brightness-110"
              >
                TRY AGAIN 🔄
              </button>
            </div>
          </div>
        )}

        {/* Out of Fuel Overlay */}
        {gameState.status === 'out_of_fuel' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border-2 border-amber-500/80 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <span className="text-5xl mb-2 block">⛽</span>
              <h2 className="text-2xl font-black text-amber-400 mb-1">OUT OF DIESEL!</h2>
              <p className="text-xs text-slate-400 mb-4">
                Keep an eye out for red fuel jerry cans on the trail!
              </p>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl mb-4 text-left border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">DISTANCE</span>
                  <span className="text-lg font-black text-white">{gameState.distance}m</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">BEST</span>
                  <span className="text-lg font-black text-amber-400">{gameState.bestDistance}m</span>
                </div>
              </div>

              <button
                onClick={handleRestart}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 text-slate-950 font-black rounded-xl text-base shadow-lg transition active:scale-95 hover:brightness-110"
              >
                REFUEL & RESTART 🔄
              </button>
            </div>
          </div>
        )}

        {/* Victory Overlay */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border-2 border-emerald-400 p-6 rounded-2xl max-w-sm w-full text-center shadow-2xl">
              <span className="text-5xl mb-2 block">🏆</span>
              <h2 className="text-2xl font-black text-emerald-400 mb-1">STAGE CLEARED!</h2>
              <p className="text-xs text-slate-300 mb-4">
                You conquered {currentStage.name} with {gameState.distance}m driven!
              </p>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/60 p-3 rounded-xl mb-4 text-left border border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">COINS</span>
                  <span className="text-lg font-black text-yellow-300">+{gameState.coins}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">SCORE</span>
                  <span className="text-lg font-black text-emerald-400">{gameState.score}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleNextStage}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-amber-400 text-slate-950 font-black rounded-xl text-base shadow-lg transition active:scale-95 hover:brightness-110"
                >
                  NEXT STAGE 🚀
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition border border-slate-700"
                >
                  REPLAY STAGE 🔄
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Touch Pedals Bar */}
      <div className="w-full bg-slate-900/90 border-x border-b border-slate-800 rounded-b-2xl p-3 flex items-center justify-between gap-4">
        {/* BRAKE PEDAL */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            inputRef.current.brake = true;
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            inputRef.current.brake = false;
          }}
          onPointerLeave={() => {
            inputRef.current.brake = false;
          }}
          className="flex-1 min-h-[58px] bg-gradient-to-b from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 active:from-red-700 active:to-red-900 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg border border-red-500/40 active:scale-95 select-none"
        >
          <span className="text-xl">🛑</span>
          <div className="flex flex-col text-left">
            <span className="text-sm font-black tracking-wider leading-none">BRAKE</span>
            <span className="text-[10px] font-bold text-red-200 leading-none mt-0.5">TILT FORWARD</span>
          </div>
        </button>

        {/* Stage Selector Pills */}
        <div className="hidden md:flex items-center gap-1.5 bg-slate-950/60 p-1.5 rounded-xl border border-slate-800">
          {STAGE_ORDER.map((sId) => (
            <button
              key={sId}
              onClick={() => handleSelectStage(sId)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                gameState.stageId === sId
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {STAGES[sId].name.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* GAS PEDAL */}
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            inputRef.current.gas = true;
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            inputRef.current.gas = false;
          }}
          onPointerLeave={() => {
            inputRef.current.gas = false;
          }}
          className="flex-1 min-h-[58px] bg-gradient-to-b from-emerald-600 to-emerald-800 hover:from-emerald-500 hover:to-emerald-700 active:from-emerald-700 active:to-emerald-900 text-white font-black rounded-xl flex items-center justify-center gap-2 shadow-lg border border-emerald-500/40 active:scale-95 select-none"
        >
          <div className="flex flex-col text-right">
            <span className="text-sm font-black tracking-wider leading-none">GAS</span>
            <span className="text-[10px] font-bold text-emerald-200 leading-none mt-0.5">TILT BACK</span>
          </div>
          <span className="text-xl">⛽</span>
        </button>
      </div>

      {/* Desktop Controls Hint */}
      <div className="hidden sm:flex items-center justify-between w-full mt-2 text-xs text-slate-400 px-2 font-medium">
        <span>Desktop Controls: <strong>Right Arrow / D</strong> = Gas | <strong>Left Arrow / A</strong> = Brake</span>
        <span>Perform 360° Flips in mid-air for +500 bonus points!</span>
      </div>
    </div>
  );
};

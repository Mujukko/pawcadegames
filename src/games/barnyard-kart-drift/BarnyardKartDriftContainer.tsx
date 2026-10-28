import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  isRacerOnTrack,
  MAX_FORWARD_SPEED,
  TRACK_CONFIGS,
  updateEngine,
} from './logic/engine';
import { BarnyardKartState, KartInput, KartRacer } from './logic/types';
import { kartSound } from './systems/sound';

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

interface SkidMark {
  x: number;
  y: number;
  alpha: number;
}

export const BarnyardKartDriftContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [state, setState] = useState<BarnyardKartState>(() => createInitialState(0));
  const stateRef = useRef<BarnyardKartState>(state);
  stateRef.current = state;

  const [isMuted, setIsMuted] = useState(false);
  const [activeTrackIdx, setActiveTrackIdx] = useState(0);

  // Input states
  const inputRef = useRef<KartInput>({
    steer: 0,
    gas: false,
    reverse: false,
    drift: false,
  });

  // Touch virtual buttons
  const touchSteerLeft = useRef(false);
  const touchSteerRight = useRef(false);
  const touchGas = useRef(false);
  const touchDrift = useRef(false);

  // Visual effects
  const particlesRef = useRef<Particle[]>([]);
  const skidMarksRef = useRef<SkidMark[]>([]);
  const cameraRef = useRef({ x: 200, y: 300 });

  const syncSoundEvents = useCallback((events: BarnyardKartState['events'], racers: KartRacer[]) => {
    const player = racers.find((r) => r.id === 'player');
    if (player) {
      const speedRatio = Math.min(1.0, Math.abs(player.speed) / MAX_FORWARD_SPEED);
      kartSound.updateEngine(speedRatio);
    }

    for (const ev of events) {
      if (ev.racerId === 'player') {
        switch (ev.type) {
          case 'engine_rev':
            kartSound.startEngine();
            break;
          case 'drift_start':
            kartSound.playDriftSqueak();
            break;
          case 'drift_boost':
            kartSound.playTurboBoost();
            break;
          case 'mud_hit':
            kartSound.playMudHit();
            break;
          case 'slick_spin':
            kartSound.playSlickSpin();
            break;
          case 'turbo_collect':
            kartSound.playTurboBoost();
            break;
          case 'checkpoint_pass':
            kartSound.playCheckpointDing();
            break;
          case 'lap_complete':
            kartSound.playLapComplete();
            break;
          case 'race_finish':
            kartSound.playWinFanfare();
            break;
        }
      }
    }
  }, []);

  const handleStartRace = useCallback((trackIdx: number) => {
    setActiveTrackIdx(trackIdx);
    const fresh = createInitialState(trackIdx);
    setState(fresh);
    stateRef.current = fresh;
    particlesRef.current = [];
    skidMarksRef.current = [];
    kartSound.stopEngine();
  }, []);

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'Shift'].includes(e.key)) {
        e.preventDefault();
      }

      const input = inputRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        input.gas = true;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        input.reverse = true;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        input.steer = -1;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        input.steer = 1;
      }
      if (e.key === ' ' || e.key === 'Shift') {
        input.drift = true;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const input = inputRef.current;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        input.gas = false;
      }
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        input.reverse = false;
      }
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        if (input.steer < 0) input.steer = 0;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        if (input.steer > 0) input.steer = 0;
      }
      if (e.key === ' ' || e.key === 'Shift') {
        input.drift = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      // Merge touch inputs with keyboard
      let finalSteer = inputRef.current.steer;
      if (touchSteerLeft.current) finalSteer = -1;
      if (touchSteerRight.current) finalSteer = 1;

      const finalGas = inputRef.current.gas || touchGas.current;
      const finalDrift = inputRef.current.drift || touchDrift.current;

      const currentInput: KartInput = {
        steer: finalSteer,
        gas: finalGas,
        reverse: inputRef.current.reverse,
        drift: finalDrift,
      };

      const prevState = stateRef.current;
      const nextState = updateEngine(prevState, currentInput, dt);
      stateRef.current = nextState;

      syncSoundEvents(nextState.events, nextState.racers);

      // Camera lerp towards player
      const player = nextState.racers.find((r) => r.id === 'player');
      if (player) {
        cameraRef.current.x += (player.x - cameraRef.current.x) * Math.min(1.0, dt * 5.0);
        cameraRef.current.y += (player.y - cameraRef.current.y) * Math.min(1.0, dt * 5.0);

        // Spawn particles
        if (player.speed > 80) {
          // Exhaust sparks
          if (Math.random() < 0.35) {
            particlesRef.current.push({
              x: player.x - Math.cos(player.angle) * 18,
              y: player.y - Math.sin(player.angle) * 18,
              vx: -Math.cos(player.angle) * 30 + (Math.random() - 0.5) * 20,
              vy: -Math.sin(player.angle) * 30 + (Math.random() - 0.5) * 20,
              size: Math.random() * 3 + 2,
              color: '#f97316',
              alpha: 0.9,
              life: 0,
              maxLife: 0.3,
            });
          }

          // Drift smoke
          if (player.isDrifting) {
            skidMarksRef.current.push({ x: player.x, y: player.y, alpha: 0.5 });
            particlesRef.current.push({
              x: player.x - Math.cos(player.angle) * 16 + (Math.random() - 0.5) * 10,
              y: player.y - Math.sin(player.angle) * 16 + (Math.random() - 0.5) * 10,
              vx: (Math.random() - 0.5) * 40,
              vy: (Math.random() - 0.5) * 40,
              size: Math.random() * 8 + 6,
              color: '#e2e8f0',
              alpha: 0.6,
              life: 0,
              maxLife: 0.45,
            });
          }
        }
      }

      // Update particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        return p.life < p.maxLife;
      });

      // Decay skid marks
      if (skidMarksRef.current.length > 200) {
        skidMarksRef.current = skidMarksRef.current.slice(-180);
      }

      // Render to canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderScene(ctx, canvas.width, canvas.height, nextState, cameraRef.current, particlesRef.current, skidMarksRef.current);
        }
      }

      // Sync React state periodically or on critical events
      if (nextState.status !== prevState.status || nextState.playerRank !== prevState.playerRank || nextState.playerLap !== prevState.playerLap) {
        setState(nextState);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      kartSound.stopEngine();
    };
  }, [syncSoundEvents]);

  // Render function
  const renderScene = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    gameState: BarnyardKartState,
    camera: { x: number; y: number },
    particles: Particle[],
    skidMarks: SkidMark[]
  ) => {
    ctx.clearRect(0, 0, width, height);

    // Save for camera translation
    ctx.save();
    ctx.translate(width / 2 - camera.x, height / 2 - camera.y);

    // Draw Grass Ground
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(camera.x - width, camera.y - height, width * 2, height * 2);

    // Subtle grass grid texture
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 1;
    const step = 80;
    const startX = Math.floor((camera.x - width) / step) * step;
    const endX = Math.ceil((camera.x + width) / step) * step;
    const startY = Math.floor((camera.y - height) / step) * step;
    const endY = Math.ceil((camera.y + height) / step) * step;

    ctx.beginPath();
    for (let x = startX; x <= endX; x += step) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = startY; y <= endY; y += step) {
      ctx.moveTo(startX, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();

    const track = gameState.track;
    const wps = track.waypoints;

    // Draw Racetrack Red & White Curbs (Outer layer)
    ctx.beginPath();
    ctx.moveTo(wps[0].x, wps[0].y);
    for (let i = 1; i < wps.length; i++) {
      ctx.lineTo(wps[i].x, wps[i].y);
    }
    ctx.closePath();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = track.trackWidth + 18;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.setLineDash([20, 20]);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = track.trackWidth + 16;
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Asphalt Track Surface
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = track.trackWidth;
    ctx.stroke();

    // Inner track center line
    ctx.setLineDash([16, 24]);
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.setLineDash([]);

    // Start / Finish Line
    const p1 = wps[0];
    const p2 = wps[1];
    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    ctx.save();
    ctx.translate(p1.x, p1.y);
    ctx.rotate(angle + Math.PI / 2);
    // Draw checkered pattern
    const halfW = track.trackWidth / 2;
    for (let cx = -halfW; cx < halfW; cx += 12) {
      for (let cy = -6; cy < 6; cy += 6) {
        ctx.fillStyle = ((cx / 12 + cy / 6) % 2 === 0) ? '#ffffff' : '#0f172a';
        ctx.fillRect(cx, cy, 12, 6);
      }
    }
    ctx.restore();

    // Draw Skid Marks
    ctx.fillStyle = '#0f172a';
    for (const sm of skidMarks) {
      ctx.globalAlpha = sm.alpha * 0.35;
      ctx.beginPath();
      ctx.arc(sm.x, sm.y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw Obstacles
    for (const obs of track.obstacles) {
      if (obs.type === 'mud') {
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.ellipse(obs.x, obs.y, obs.radius, obs.radius * 0.7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.stroke();
      } else if (obs.type === 'slick') {
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.ellipse(obs.x, obs.y, obs.radius, obs.radius * 0.75, -0.4, 0, Math.PI * 2);
        ctx.fill();
        // Rainbow oil sheen
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      } else if (obs.type === 'hay_bale') {
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(obs.x, obs.y, obs.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 4;
        ctx.stroke();
      }
    }

    // Draw Pickups (Turbo Corn)
    for (const p of track.pickups) {
      if (!p.collected) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = '16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌽', 0, 1);
        ctx.restore();
      }
    }

    // Draw Particles
    for (const p of particles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1.0;

    // Draw All Racers
    for (const racer of gameState.racers) {
      renderTractor(ctx, racer);
    }

    ctx.restore(); // Restore camera translation
  };

  const renderTractor = (ctx: CanvasRenderingContext2D, racer: KartRacer) => {
    ctx.save();
    ctx.translate(racer.x, racer.y);
    ctx.rotate(racer.angle);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(2, 4, 22, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Rear Big Wheels
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-18, -16, 10, 8); // top rear
    ctx.fillRect(-18, 8, 10, 8); // bottom rear
    ctx.fillStyle = '#eab308';
    ctx.fillRect(-16, -14, 6, 4);
    ctx.fillRect(-16, 10, 6, 4);

    // Front Steered Wheels
    ctx.save();
    ctx.translate(14, -12);
    ctx.rotate(racer.steerAngle || 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -3, 8, 5);
    ctx.restore();

    ctx.save();
    ctx.translate(14, 12);
    ctx.rotate(racer.steerAngle || 0);
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-4, -2, 8, 5);
    ctx.restore();

    // Tractor Engine & Hood Body
    ctx.fillStyle = racer.color;
    ctx.beginPath();
    ctx.roundRect(-14, -10, 30, 20, 5);
    ctx.fill();
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Exhaust Pipe
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(2, -12, 4, 3);

    // Driver Face
    const mascot = racer.animal === 'corgi' ? '🐶' : racer.animal === 'cow' ? '🐮' : racer.animal === 'chicken' ? '🐔' : '🐷';
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mascot, -4, 0);

    // Mini turbo fire burst
    if (racer.turboTimer > 0) {
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(-20, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(-18, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  const playerRacer = state.racers.find((r) => r.id === 'player') || state.racers[0];
  const speedDisplay = Math.round(Math.max(0, playerRacer.speed));

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none">
      {/* Top HUD Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-900/90 border border-amber-500/30 rounded-xl mb-2 text-white shadow-lg">
        {/* Placement Badge */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">Position</span>
          <span className={`px-2.5 py-0.5 rounded-lg text-base font-black shadow-inner ${
            playerRacer.rank === 1 ? 'bg-amber-500 text-slate-950 animate-pulse' : 'bg-slate-800 text-slate-200'
          }`}>
            {playerRacer.rank === 1 ? '🥇 1st' : playerRacer.rank === 2 ? '🥈 2nd' : playerRacer.rank === 3 ? '🥉 3rd' : '4th'}
          </span>
        </div>

        {/* Lap Counter */}
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase font-extrabold text-slate-400">Lap</span>
          <span className="font-mono text-sm sm:text-base font-black text-amber-300">
            {state.playerLap} / {state.totalLaps}
          </span>
        </div>

        {/* Speedometer */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs uppercase font-extrabold text-slate-400">MPH</span>
          <span className="font-mono text-base font-black text-white">{speedDisplay}</span>
          {playerRacer.turboTimer > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-orange-600 text-white animate-bounce">
              NITRO 🔥
            </span>
          )}
        </div>

        {/* Audio Mute & Restart */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              const next = !isMuted;
              setIsMuted(next);
              kartSound.setMuted(next);
            }}
            aria-label="Toggle sound"
            className="p-1.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm cursor-pointer"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={() => handleStartRace(activeTrackIdx)}
            aria-label="Restart race"
            className="p-1.5 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs cursor-pointer"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full rounded-2xl overflow-hidden border border-amber-500/40 shadow-2xl bg-slate-950 aspect-[4/3] max-h-[560px]">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full object-contain"
        />

        {/* Countdown Overlay */}
        {state.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs flex flex-col items-center justify-center">
            <span className="text-7xl font-black text-amber-400 animate-ping">
              {Math.ceil(state.countdown)}
            </span>
            <p className="text-white font-extrabold text-sm sm:text-base mt-4 uppercase tracking-wider">
              {TRACK_CONFIGS[activeTrackIdx].name}
            </p>
          </div>
        )}

        {/* Race Finished Overlay */}
        {state.status === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in">
            <span className="text-6xl mb-3">
              {playerRacer.rank === 1 ? '🏆' : '🏁'}
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              {playerRacer.rank === 1 ? 'GRAND PRIX CHAMPION!' : 'RACE FINISHED!'}
            </h3>
            <p className="text-amber-300 font-bold text-base mt-1">
              You placed {playerRacer.rank === 1 ? '1st' : `${playerRacer.rank}th`}!
            </p>
            <div className="mt-3 flex gap-4 text-xs sm:text-sm text-slate-300">
              <div>Total Time: <span className="font-mono text-white font-bold">{state.raceTime.toFixed(1)}s</span></div>
              {state.bestLapTime > 0 && (
                <div>Best Lap: <span className="font-mono text-amber-300 font-bold">{state.bestLapTime.toFixed(1)}s</span></div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => handleStartRace(activeTrackIdx)}
                className="px-5 py-2.5 min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm cursor-pointer"
              >
                Retry Track
              </button>
              <button
                onClick={() => handleStartRace((activeTrackIdx + 1) % TRACK_CONFIGS.length)}
                className="px-6 py-2.5 min-h-[44px] rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-sm shadow-lg cursor-pointer"
              >
                Next Grand Prix Circuit 🏎️
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Circuit Selection Pills */}
      <div className="w-full flex items-center justify-center gap-1.5 overflow-x-auto py-2.5 scrollbar-none">
        {TRACK_CONFIGS.map((t, idx) => (
          <button
            key={t.id}
            onClick={() => handleStartRace(idx)}
            className={`px-3 py-1.5 min-h-[38px] rounded-xl text-xs font-black transition-all cursor-pointer shrink-0 ${
              activeTrackIdx === idx
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {t.name}
          </button>
        ))}
      </div>

      {/* Tactile Mobile Controls Overlay (>=48px touch targets) */}
      <div className="w-full flex items-center justify-between px-2 pt-2 gap-3 sm:hidden">
        {/* Steering Buttons */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => { touchSteerLeft.current = true; }}
            onPointerUp={() => { touchSteerLeft.current = false; }}
            onPointerLeave={() => { touchSteerLeft.current = false; }}
            aria-label="Steer Left"
            className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-amber-600 border border-slate-700 text-2xl flex items-center justify-center text-white shadow-lg touch-none"
          >
            ◀
          </button>
          <button
            onPointerDown={() => { touchSteerRight.current = true; }}
            onPointerUp={() => { touchSteerRight.current = false; }}
            onPointerLeave={() => { touchSteerRight.current = false; }}
            aria-label="Steer Right"
            className="w-16 h-16 rounded-2xl bg-slate-800 active:bg-amber-600 border border-slate-700 text-2xl flex items-center justify-center text-white shadow-lg touch-none"
          >
            ▶
          </button>
        </div>

        {/* Gas & Drift Buttons */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => { touchDrift.current = true; }}
            onPointerUp={() => { touchDrift.current = false; }}
            onPointerLeave={() => { touchDrift.current = false; }}
            aria-label="Drift"
            className="w-16 h-16 rounded-2xl bg-orange-600 active:bg-orange-500 border border-orange-400 text-xs font-black flex flex-col items-center justify-center text-white shadow-lg touch-none"
          >
            <span className="text-xl">🔥</span>
            <span>DRIFT</span>
          </button>
          <button
            onPointerDown={() => { touchGas.current = true; }}
            onPointerUp={() => { touchGas.current = false; }}
            onPointerLeave={() => { touchGas.current = false; }}
            aria-label="Accelerate Gas"
            className="w-16 h-16 rounded-2xl bg-emerald-600 active:bg-emerald-500 border border-emerald-400 text-xs font-black flex flex-col items-center justify-center text-white shadow-lg touch-none"
          >
            <span className="text-xl">⚡</span>
            <span>GAS</span>
          </button>
        </div>
      </div>
    </div>
  );
};

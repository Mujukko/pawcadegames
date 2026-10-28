import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BEE_RADIUS,
  createInitialSheepState,
  FENCE_WIDTH,
  finishDrawingAndStartSimulation,
  LEVELS,
  SaveTheSheepState,
  SHEEP_RADIUS,
  stepSheepPhysics,
  addDrawnPoint,
} from './logic/engine';
import { sheepDefenseAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 650;

export const SaveTheSheepContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const engineRef = useRef<SaveTheSheepState>(createInitialSheepState(1));
  const isPointerDownRef = useRef<boolean>(false);
  const lastMilestoneRef = useRef<number>(0);

  // HUD State
  const [hudState, setHudState] = useState<{
    level: number;
    levelName: string;
    status: SaveTheSheepState['status'];
    usedInk: number;
    maxInk: number;
    survivalTimer: number;
    score: number;
    stars: number;
    isMuted: boolean;
  }>({
    level: 1,
    levelName: LEVELS[0].name,
    status: 'drawing',
    usedInk: 0,
    maxInk: LEVELS[0].maxInk,
    survivalTimer: 5.0,
    score: 0,
    stars: 3,
    isMuted: sheepDefenseAudio.getMuted(),
  });

  const syncHud = useCallback(() => {
    const s = engineRef.current;
    setHudState({
      level: s.level,
      levelName: s.levelName,
      status: s.status,
      usedInk: s.usedInk,
      maxInk: s.maxInk,
      survivalTimer: s.survivalTimer,
      score: s.score,
      stars: s.stars,
      isMuted: sheepDefenseAudio.getMuted(),
    });
  }, []);

  // GA4 Lifecycle
  useEffect(() => {
    analytics.gameStarted('save-the-sheep');
    analytics.track('level_started', { gameId: 'save-the-sheep', levelId: 1 });
  }, []);

  const handleNextLevel = () => {
    const nextLvl = engineRef.current.level + 1;
    const newEngine = createInitialSheepState(nextLvl);
    newEngine.score = engineRef.current.score;
    engineRef.current = newEngine;
    analytics.track('level_started', { gameId: 'save-the-sheep', levelId: nextLvl });
    sheepDefenseAudio.playSheepBaa();
    syncHud();
  };

  const handleRestartLevel = () => {
    const currentLvl = engineRef.current.level;
    const newEngine = createInitialSheepState(currentLvl);
    newEngine.score = engineRef.current.score;
    engineRef.current = newEngine;
    analytics.gameRestarted('save-the-sheep', { levelId: currentLvl });
    analytics.track('level_started', { gameId: 'save-the-sheep', levelId: currentLvl });
    sheepDefenseAudio.playSheepBaa();
    syncHud();
  };

  const handleToggleSound = () => {
    const muted = sheepDefenseAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Pointer Drawing Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const state = engineRef.current;
    if (state.status !== 'drawing') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    isPointerDownRef.current = true;
    state.drawnPoints = [];
    state.usedInk = 0;
    addDrawnPoint(state, { x, y });
    sheepDefenseAudio.playDraw();
    syncHud();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return;
    const state = engineRef.current;
    if (state.status !== 'drawing') return;

    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const added = addDrawnPoint(state, { x, y });
    if (added && Math.random() < 0.25) {
      sheepDefenseAudio.playDraw();
    }
    syncHud();
  };

  const handlePointerUp = () => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    const state = engineRef.current;

    if (state.status === 'drawing' && state.drawnPoints.length >= 2) {
      const started = finishDrawingAndStartSimulation(state);
      if (started) {
        sheepDefenseAudio.playBeeBuzz();
        syncHud();
      }
    }
  };

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.08, (now - lastTime) / 1000);
      lastTime = now;

      const state = engineRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 1. Physics Step
      if (state.status === 'simulating') {
        const { state: nextState, events } = stepSheepPhysics(state, dt);
        engineRef.current = nextState;

        if (events.fenceDeflectedBee && Math.random() < 0.35) {
          sheepDefenseAudio.playBeeBounce();
        }
        if (events.sheepStung || events.sheepFell) {
          sheepDefenseAudio.playStung();
          sheepDefenseAudio.playGameOver();
          analytics.levelFailed('save-the-sheep', {
            levelId: nextState.level,
            reason: events.sheepStung ? 'stung_by_bees' : 'fell_off_platform',
          });
        }
        if (events.levelCompleted) {
          sheepDefenseAudio.playLevelComplete();
          sheepDefenseAudio.playSheepBaa();
          analytics.levelCompleted('save-the-sheep', {
            levelId: nextState.level,
            score: nextState.score,
            stars: nextState.stars,
          });
        }

        // Milestones
        const milestone = Math.floor(nextState.score / 250) * 250;
        if (milestone > lastMilestoneRef.current && milestone > 0) {
          lastMilestoneRef.current = milestone;
          analytics.scoreMilestone('save-the-sheep', milestone);
        }
      }

      // 2. HUD Sync
      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        syncHud();
      }

      // 3. CANVAS RENDERING
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Sky Background
      const skyGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      skyGrad.addColorStop(0, '#38bdf8'); // sky-400
      skyGrad.addColorStop(0.65, '#bae6fd'); // sky-200
      skyGrad.addColorStop(1, '#86efac'); // green-300
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Cartoon Clouds
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.beginPath();
      ctx.arc(80, 90, 40, 0, Math.PI * 2);
      ctx.arc(120, 80, 30, 0, Math.PI * 2);
      ctx.arc(330, 110, 45, 0, Math.PI * 2);
      ctx.arc(365, 100, 32, 0, Math.PI * 2);
      ctx.fill();

      // Platforms
      for (const p of state.platforms) {
        if (p.type === 'grass') {
          // Grass Platform
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(p.x, p.y, p.width, p.height);
          // Darker Dirt Base
          ctx.fillStyle = '#78350f';
          ctx.fillRect(p.x, p.y + 12, p.width, p.height - 12);
          // Grass Blade Fringe
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(p.x, p.y, p.width, 6);
        } else if (p.type === 'spikes') {
          // Dangerous Spikes
          ctx.fillStyle = '#dc2626';
          ctx.fillRect(p.x, p.y + p.height - 8, p.width, 8);
          ctx.fillStyle = '#ef4444';
          const spikeWidth = 14;
          for (let sx = p.x; sx < p.x + p.width - 6; sx += spikeWidth) {
            ctx.beginPath();
            ctx.moveTo(sx, p.y + p.height);
            ctx.lineTo(sx + spikeWidth / 2, p.y);
            ctx.lineTo(sx + spikeWidth, p.y + p.height);
            ctx.fill();
          }
        }
      }

      // Beehives
      for (const hive of state.beehives) {
        ctx.fillStyle = '#d97706';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 3;

        // Hanging string/branch
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(hive.x, 0);
        ctx.lineTo(hive.x, hive.y);
        ctx.stroke();

        // Hive body
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.ellipse(hive.x, hive.y, 24, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Hive entry hole
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(hive.x, hive.y + 4, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Barnaby the Sheep
      const s = state.sheep;
      ctx.save();
      ctx.translate(s.x, s.y);

      // Fluffy wool puffs
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.arc(-14, 4, 12, 0, Math.PI * 2);
      ctx.arc(14, 4, 12, 0, Math.PI * 2);
      ctx.arc(-8, -12, 14, 0, Math.PI * 2);
      ctx.arc(8, -12, 14, 0, Math.PI * 2);
      ctx.arc(0, 10, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Sheep Face
      ctx.fillStyle = '#fed7aa'; // cream skin
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, -2, 14, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Big Kawaii Eyes
      ctx.fillStyle = s.isStung ? '#dc2626' : '#0f172a';
      if (s.isStung) {
        // Dizzy X eyes
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('X', -6, 2);
        ctx.fillText('X', 6, 2);
      } else {
        ctx.beginPath();
        ctx.arc(-5, -4, 3.5, 0, Math.PI * 2);
        ctx.arc(5, -4, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-4, -6, 1.2, 0, Math.PI * 2);
        ctx.arc(6, -6, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cute Pink Cheeks
      ctx.fillStyle = '#fca5a5';
      ctx.beginPath();
      ctx.arc(-9, 3, 3, 0, Math.PI * 2);
      ctx.arc(9, 3, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Drawn Wooden Fence Line
      if (state.drawnPoints.length > 1) {
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Glowing outer halo
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
        ctx.lineWidth = FENCE_WIDTH + 8;
        ctx.beginPath();
        ctx.moveTo(state.drawnPoints[0].x, state.drawnPoints[0].y);
        for (let i = 1; i < state.drawnPoints.length; i++) {
          ctx.lineTo(state.drawnPoints[i].x, state.drawnPoints[i].y);
        }
        ctx.stroke();

        // Wooden Fence Bar
        ctx.strokeStyle = '#92400e';
        ctx.lineWidth = FENCE_WIDTH;
        ctx.beginPath();
        ctx.moveTo(state.drawnPoints[0].x, state.drawnPoints[0].y);
        for (let i = 1; i < state.drawnPoints.length; i++) {
          ctx.lineTo(state.drawnPoints[i].x, state.drawnPoints[i].y);
        }
        ctx.stroke();

        // Inner lighter wood streak
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = FENCE_WIDTH - 6;
        ctx.beginPath();
        ctx.moveTo(state.drawnPoints[0].x, state.drawnPoints[0].y);
        for (let i = 1; i < state.drawnPoints.length; i++) {
          ctx.lineTo(state.drawnPoints[i].x, state.drawnPoints[i].y);
        }
        ctx.stroke();

        ctx.restore();
      }

      // Bees
      for (const bee of state.bees) {
        if (!bee.active) continue;

        // Wing flutter
        const wingOffset = Math.sin(now * 0.05 + Number(bee.id.replace('bee-', ''))) * 5;

        // Wings
        ctx.fillStyle = 'rgba(224, 242, 254, 0.8)';
        ctx.beginPath();
        ctx.ellipse(bee.x - 3, bee.y - 6 + wingOffset, 4, 7, -0.3, 0, Math.PI * 2);
        ctx.ellipse(bee.x + 3, bee.y - 6 - wingOffset, 4, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Bee Body (Gold)
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#78350f';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(bee.x, bee.y, BEE_RADIUS, BEE_RADIUS * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Black stripes
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(bee.x - 2, bee.y - 5, 2, 10);
        ctx.fillRect(bee.x + 2, bee.y - 5, 2, 10);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [syncHud]);

  const inkPercentage = Math.max(
    0,
    Math.min(100, Math.floor(((hudState.maxInk - hudState.usedInk) / hudState.maxInk) * 100))
  );

  return (
    <div className="relative w-full max-w-[440px] mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-amber-500/30 text-slate-100">
      {/* Top Header / HUD */}
      <div className="w-full bg-slate-800/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700/60 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐝</span>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Level {hudState.level}: {hudState.levelName}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <span className="text-yellow-400 font-bold">{hudState.score} pts</span>
              <span className="text-slate-500">•</span>
              <span>⭐ {hudState.stars}/3</span>
            </div>
          </div>
        </div>

        {/* Survival Timer & Sound */}
        <div className="flex items-center gap-3">
          {hudState.status === 'simulating' ? (
            <div className="flex items-center gap-1 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-xl border border-amber-400/50 text-xs font-black animate-pulse">
              <span>⏱️</span>
              <span>{hudState.survivalTimer.toFixed(1)}s SURVIVE!</span>
            </div>
          ) : (
            <div className="text-xs font-bold text-slate-400 bg-slate-700/60 px-2 py-1 rounded-lg">
              ✏️ DRAW FENCE
            </div>
          )}

          <button
            onClick={handleToggleSound}
            className="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center text-sm transition-colors cursor-pointer"
            title={hudState.isMuted ? 'Unmute' : 'Mute'}
            aria-label="Toggle Sound"
          >
            {hudState.isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Ink Gauge Meter */}
      <div className="w-full bg-slate-950 px-3 py-1.5 flex items-center justify-between gap-3 border-b border-slate-800">
        <span className="text-[10px] font-black uppercase text-amber-400 shrink-0">
          INK: {inkPercentage}%
        </span>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden relative border border-slate-700">
          <div
            className={`h-full transition-all duration-75 ${
              inkPercentage > 50
                ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                : inkPercentage > 20
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${inkPercentage}%` }}
          />
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative w-full flex justify-center bg-sky-300">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full max-h-[650px] aspect-[400/650] object-contain cursor-crosshair active:cursor-crosshair touch-none block"
        />

        {/* Level Cleared Overlay */}
        {hudState.status === 'level_cleared' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2 animate-bounce">🎉🐑</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1 tracking-tight">
              SHEEP SAVED!
            </h2>
            <div className="flex gap-1.5 text-2xl my-2">
              {'⭐'.repeat(hudState.stars)}
            </div>
            <p className="text-sm text-slate-300 mb-4">
              Level {hudState.level} cleared with {hudState.score} points!
            </p>
            <button
              onClick={handleNextLevel}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              NEXT LEVEL 🚀
            </button>
          </div>
        )}

        {/* Victory Celebration Overlay */}
        {hudState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2 animate-pulse">👑🐑</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1 tracking-tight">
              ALL SHEEP DEFENDED!
            </h2>
            <p className="text-sm text-slate-200 mb-4 max-w-xs">
              You cleared every hive puzzle! Final score: {hudState.score}
            </p>
            <button
              onClick={handleRestartLevel}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              PLAY AGAIN 🐝🐑
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {hudState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2">🐝💔</div>
            <h2 className="text-2xl font-black text-rose-400 mb-1 tracking-tight">
              SHEEP GOT STUNG!
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              Draw a full closed barrier around the sheep to deflect the swarm!
            </p>
            <button
              onClick={handleRestartLevel}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black text-base rounded-xl shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              TRY AGAIN 🔄
            </button>
          </div>
        )}
      </div>

      {/* Bottom Hint Banner */}
      <div className="w-full bg-slate-800/90 px-4 py-2 flex items-center justify-center text-xs text-slate-300 font-medium border-t border-slate-700/60 z-20">
        💡 Draw a single line to shield Barnaby • Release finger to start 5s defense
      </div>
    </div>
  );
};

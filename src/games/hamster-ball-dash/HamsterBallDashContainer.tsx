import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  BALL_RADIUS,
  createInitialHamsterState,
  createLevel,
  HamsterBallState,
  HamsterInput,
  LevelConfig,
  stepHamsterPhysics,
} from './logic/engine';
import { hamsterAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 650;
const VIEWPORT_AHEAD = 220; // ball position from bottom of canvas

export const HamsterBallDashContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Game Engine Ref State (avoids React re-render lag during 60 FPS loop)
  const engineRef = useRef<{
    state: HamsterBallState;
    level: LevelConfig;
  }>(createInitialHamsterState(1));

  const inputRef = useRef<HamsterInput>({
    steer: 0,
    accelerate: 0,
    brake: false,
  });

  // UI state for HUD updates
  const [hudState, setHudState] = useState<{
    score: number;
    seedsCollected: number;
    totalSeeds: number;
    lives: number;
    level: number;
    levelName: string;
    status: HamsterBallState['status'];
    isMuted: boolean;
    progressPercent: number;
  }>({
    score: 0,
    seedsCollected: 0,
    totalSeeds: engineRef.current.level.seeds.length,
    lives: 3,
    level: 1,
    levelName: engineRef.current.level.name,
    status: 'ready',
    isMuted: hamsterAudio.getMuted(),
    progressPercent: 0,
  });

  const lastMilestoneRef = useRef<number>(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Sync HUD state from engine (throttled to avoid render thrashing)
  const syncHud = useCallback(() => {
    const { state, level } = engineRef.current;
    const progress = Math.min(100, Math.max(0, Math.floor((state.y / level.lengthY) * 100)));
    setHudState({
      score: state.score,
      seedsCollected: state.seedsCollected,
      totalSeeds: level.seeds.length,
      lives: state.lives,
      level: state.currentLevel,
      levelName: level.name,
      status: state.status,
      isMuted: hamsterAudio.getMuted(),
      progressPercent: progress,
    });
  }, []);

  // GA4 game start tracking
  useEffect(() => {
    analytics.gameStarted('hamster-ball-dash');
    analytics.track('level_started', { gameId: 'hamster-ball-dash', levelId: 1 });
  }, []);

  // Start game action
  const handleStartGame = () => {
    const { state } = engineRef.current;
    if (state.status === 'ready' || state.status === 'paused') {
      state.status = 'playing';
      syncHud();
    }
  };

  // Next level action
  const handleNextLevel = () => {
    const currentLvl = engineRef.current.state.currentLevel;
    const nextLvl = currentLvl + 1;
    const newEngine = createInitialHamsterState(nextLvl);
    // Carry over score
    newEngine.state.score = engineRef.current.state.score;
    newEngine.state.status = 'playing';
    engineRef.current = newEngine;
    analytics.track('level_started', { gameId: 'hamster-ball-dash', levelId: nextLvl });
    syncHud();
  };

  // Restart level action
  const handleRestartLevel = () => {
    const currentLvl = engineRef.current.state.currentLevel;
    const newEngine = createInitialHamsterState(currentLvl);
    newEngine.state.status = 'playing';
    engineRef.current = newEngine;
    analytics.gameRestarted('hamster-ball-dash', { levelId: currentLvl });
    analytics.track('level_started', { gameId: 'hamster-ball-dash', levelId: currentLvl });
    syncHud();
  };

  // Sound toggle
  const handleToggleSound = () => {
    const muted = hamsterAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        inputRef.current.steer = -1;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.steer = 1;
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        inputRef.current.accelerate = 1;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        inputRef.current.brake = true;
      } else if (e.code === 'Space') {
        if (engineRef.current.state.status === 'ready') {
          handleStartGame();
        } else {
          inputRef.current.brake = true;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.steer = 0;
      } else if (['ArrowUp', 'KeyW'].includes(e.code)) {
        inputRef.current.accelerate = 0;
      } else if (['ArrowDown', 'KeyS', 'Space'].includes(e.code)) {
        inputRef.current.brake = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Touch / Pointer steering
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    touchStartRef.current = { x, y };

    if (engineRef.current.state.status === 'ready') {
      handleStartGame();
      return;
    }

    // Direct touch steering based on screen position
    const relX = (x / rect.width) * 2 - 1; // -1 (left) to +1 (right)
    inputRef.current.steer = Math.max(-1, Math.min(1, relX * 1.5));
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const relX = (x / rect.width) * 2 - 1;
    inputRef.current.steer = Math.max(-1, Math.min(1, relX * 1.4));

    // Optional drag up for acceleration
    const y = e.clientY - rect.top;
    const dy = touchStartRef.current.y - y;
    if (dy > 40) {
      inputRef.current.accelerate = 1;
      inputRef.current.brake = false;
    } else if (dy < -40) {
      inputRef.current.brake = true;
      inputRef.current.accelerate = 0;
    } else {
      inputRef.current.accelerate = 0;
      inputRef.current.brake = false;
    }
  };

  const handlePointerUp = () => {
    touchStartRef.current = null;
    inputRef.current.steer = 0;
    inputRef.current.accelerate = 0;
    inputRef.current.brake = false;
  };

  // Main 60 FPS Render & Physics Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudTimer = 0;

    const render = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const { state, level } = engineRef.current;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Physics update if playing
      if (state.status === 'playing') {
        const { state: nextState, events } = stepHamsterPhysics(
          state,
          level,
          inputRef.current,
          dt
        );
        engineRef.current.state = nextState;

        // Sound triggers
        if (events.seedCollected) hamsterAudio.playSeed();
        if (events.boostActivated) hamsterAudio.playBoost();
        if (events.magnetActivated) hamsterAudio.playMagnet();
        if (events.rampJumped) hamsterAudio.playJump();
        if (events.hazardHit === 'hay_bale') hamsterAudio.playBump();
        if (events.fellOff) hamsterAudio.playFall();
        if (events.checkpointPassed) hamsterAudio.playCheckpoint();
        if (events.levelCompleted) {
          hamsterAudio.playLevelComplete();
          analytics.levelCompleted('hamster-ball-dash', { levelId: nextState.currentLevel, score: nextState.score });
        }
        if (events.gameOver) {
          hamsterAudio.playGameOver();
          analytics.levelFailed('hamster-ball-dash', { levelId: nextState.currentLevel, reason: 'out_of_lives' });
        }

        // GA4 Milestones (every 250 pts)
        const milestone = Math.floor(nextState.score / 250) * 250;
        if (milestone > lastMilestoneRef.current && milestone > 0) {
          lastMilestoneRef.current = milestone;
          analytics.scoreMilestone('hamster-ball-dash', milestone);
        }
      }

      // HUD sync throttle (10 FPS)
      hudTimer += dt;
      if (hudTimer > 0.1) {
        hudTimer = 0;
        syncHud();
      }

      // ----------------------------------------
      // CANVAS RENDERING
      // ----------------------------------------
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Camera view: Center camera on ball Y with smooth offset
      const cameraY = state.y;
      const cameraX = state.x;
      const screenBallY = CANVAS_HEIGHT - VIEWPORT_AHEAD;
      const screenBallX = CANVAS_WIDTH / 2;

      // 1. Draw Barnyard / Pasture Ground Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      bgGrad.addColorStop(0, '#15803d'); // emerald-700
      bgGrad.addColorStop(1, '#166534'); // emerald-800
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Animated scrolling grass tufts
      ctx.fillStyle = 'rgba(74, 222, 128, 0.25)';
      const grassScroll = (cameraY * 0.8) % 80;
      for (let gy = -80; gy < CANVAS_HEIGHT + 80; gy += 60) {
        const drawGy = gy - grassScroll;
        ctx.fillRect(20, drawGy, 12, 4);
        ctx.fillRect(360, drawGy + 20, 14, 4);
        ctx.fillRect(35, drawGy + 35, 10, 4);
        ctx.fillRect(345, drawGy + 10, 12, 4);
      }

      // 2. Draw Track Segments
      for (const seg of level.segments) {
        // Check if visible
        const segScreenBottom = screenBallY + (cameraY - seg.startY);
        const segScreenTop = screenBallY + (cameraY - seg.endY);

        if (segScreenBottom < -50 || segScreenTop > CANVAS_HEIGHT + 50) {
          continue;
        }

        const trackLeft = screenBallX + (seg.centerX - cameraX) - seg.trackWidth / 2;
        const trackRight = trackLeft + seg.trackWidth;
        const trackHeight = segScreenBottom - segScreenTop;

        if (seg.isTube) {
          // Futuristic Silo Glass Tube Track
          ctx.fillStyle = 'rgba(6, 182, 212, 0.35)'; // cyan glass
          ctx.fillRect(trackLeft, segScreenTop, seg.trackWidth, trackHeight);

          // Glass glowing borders
          ctx.strokeStyle = '#22d3ee';
          ctx.lineWidth = 4;
          ctx.strokeRect(trackLeft, segScreenTop, seg.trackWidth, trackHeight);

          // Glass highlight streak
          ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.fillRect(trackLeft + 15, segScreenTop, 18, trackHeight);
        } else {
          // Rustic Wooden Boardwalk Track
          ctx.fillStyle = '#b45309'; // warm amber-700 base
          ctx.fillRect(trackLeft, segScreenTop, seg.trackWidth, trackHeight);

          // Plank lines
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          const plankSpacing = 35;
          const plankOffset = (seg.startY - cameraY) % plankSpacing;
          for (let py = segScreenTop + plankOffset; py <= segScreenBottom; py += plankSpacing) {
            ctx.beginPath();
            ctx.moveTo(trackLeft, py);
            ctx.lineTo(trackRight, py);
            ctx.stroke();
          }

          // Rails if present
          if (seg.hasRails) {
            ctx.fillStyle = '#f59e0b'; // golden rail posts
            ctx.fillRect(trackLeft - 6, segScreenTop, 6, trackHeight);
            ctx.fillRect(trackRight, segScreenTop, 6, trackHeight);

            ctx.fillStyle = '#d97706';
            ctx.fillRect(trackLeft - 8, segScreenTop, 2, trackHeight);
            ctx.fillRect(trackRight + 6, segScreenTop, 2, trackHeight);
          } else {
            // Drop-off warning stripes on open bridges
            ctx.fillStyle = 'rgba(239, 68, 68, 0.6)';
            ctx.fillRect(trackLeft, segScreenTop, 4, trackHeight);
            ctx.fillRect(trackRight - 4, segScreenTop, 4, trackHeight);
          }
        }
      }

      // 3. Draw Boost Pads & Ramps
      for (const pad of level.boostPads) {
        const padScreenY = screenBallY + (cameraY - pad.y);
        const padScreenX = screenBallX + (pad.x - cameraX);

        if (padScreenY < -50 || padScreenY > CANVAS_HEIGHT + 50) continue;

        if (pad.type === 'boost') {
          // Neon Boost Chevron
          ctx.fillStyle = '#facc15';
          ctx.shadowColor = '#eab308';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.roundRect(
            padScreenX - pad.width / 2,
            padScreenY - pad.length / 2,
            pad.width,
            pad.length,
            8
          );
          ctx.fill();
          ctx.shadowBlur = 0;

          // Triple Chevrons >>>
          ctx.fillStyle = '#ca8a04';
          ctx.font = 'bold 22px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('▲ ▲', padScreenX, padScreenY);
        } else if (pad.type === 'magnet') {
          // Purple Magnet Pad
          ctx.fillStyle = '#c084fc';
          ctx.beginPath();
          ctx.roundRect(
            padScreenX - pad.width / 2,
            padScreenY - pad.length / 2,
            pad.width,
            pad.length,
            8
          );
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.font = '20px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('🧲', padScreenX, padScreenY);
        } else if (pad.type === 'ramp') {
          // Jump Ramp 3D Projection
          ctx.fillStyle = '#e11d48'; // rose-600
          ctx.beginPath();
          ctx.roundRect(
            padScreenX - pad.width / 2,
            padScreenY - pad.length / 2,
            pad.width,
            pad.length,
            6
          );
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 16px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('JUMP ⬆', padScreenX, padScreenY);
        }
      }

      // 4. Draw Hazards (Hay Bales & Mud Puddles)
      for (const h of level.hazards) {
        const hScreenY = screenBallY + (cameraY - h.y);
        const hScreenX = screenBallX + (h.x - cameraX);

        if (hScreenY < -50 || hScreenY > CANVAS_HEIGHT + 50) continue;

        if (h.type === 'hay_bale') {
          // Hay Bale
          ctx.fillStyle = '#eab308';
          ctx.beginPath();
          ctx.arc(hScreenX, hScreenY, h.radius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 3;
          ctx.stroke();

          // Twine ties
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(hScreenX, hScreenY, h.radius * 0.55, 0, Math.PI * 2);
          ctx.stroke();
        } else if (h.type === 'mud_puddle') {
          // Mud Puddle
          ctx.fillStyle = 'rgba(88, 28, 12, 0.75)';
          ctx.beginPath();
          ctx.ellipse(hScreenX, hScreenY, h.radius, h.radius * 0.7, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Draw Sunflower Seeds
      for (const seed of level.seeds) {
        if (seed.collected) continue;
        const sScreenY = screenBallY + (cameraY - seed.y);
        const sScreenX = screenBallX + (seed.x - cameraX);

        if (sScreenY < -30 || sScreenY > CANVAS_HEIGHT + 30) continue;

        // Golden Seed Teardrop / Sunflower
        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#eab308';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(sScreenX, sScreenY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Center dot
        ctx.fillStyle = '#854d0e';
        ctx.beginPath();
        ctx.arc(sScreenX, sScreenY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 6. Draw Checkpoints & Finish Line
      for (const cp of level.checkpoints) {
        const cpScreenY = screenBallY + (cameraY - cp.y);
        if (cpScreenY < -30 || cpScreenY > CANVAS_HEIGHT + 30) continue;

        ctx.fillStyle = cp.passed ? '#22c55e' : '#eab308';
        ctx.fillRect(50, cpScreenY - 4, CANVAS_WIDTH - 100, 8);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(cp.passed ? '✓ CHECKPOINT' : 'CHECKPOINT', CANVAS_WIDTH / 2, cpScreenY - 8);
      }

      // Finish Line Banner
      const finishScreenY = screenBallY + (cameraY - level.lengthY);
      if (finishScreenY > -60 && finishScreenY < CANVAS_HEIGHT + 60) {
        // Checkered board
        const blockW = 20;
        for (let bx = 50; bx < CANVAS_WIDTH - 50; bx += blockW) {
          ctx.fillStyle = Math.floor(bx / blockW) % 2 === 0 ? '#ffffff' : '#000000';
          ctx.fillRect(bx, finishScreenY - 12, blockW, 24);
        }
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁 FINISH 🏁', CANVAS_WIDTH / 2, finishScreenY - 18);
      }

      // 7. Draw Hamster & Transparent Sphere
      if (!state.isFallen) {
        const ballScreenX = screenBallX;
        const ballScreenY = screenBallY - state.z; // lift for jump

        // Sphere Shadow on track
        ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
        const shadowScale = Math.max(0.4, 1 - state.z / 300);
        ctx.beginPath();
        ctx.ellipse(
          ballScreenX,
          screenBallY + BALL_RADIUS + 4,
          BALL_RADIUS * shadowScale,
          BALL_RADIUS * 0.4 * shadowScale,
          0,
          0,
          Math.PI * 2
        );
        ctx.fill();

        // Speed Lines when Boosting
        if (state.boostTimer > 0) {
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 2;
          for (let i = 0; i < 4; i++) {
            const lineX = ballScreenX - BALL_RADIUS + i * 14;
            ctx.beginPath();
            ctx.moveTo(lineX, ballScreenY + BALL_RADIUS);
            ctx.lineTo(lineX, ballScreenY + BALL_RADIUS + 30);
            ctx.stroke();
          }
        }

        // Magnet Aura
        if (state.magnetTimer > 0) {
          ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(ballScreenX, ballScreenY, BALL_RADIUS + 8, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Inside: Pip the Chubby Hamster
        ctx.save();
        ctx.translate(ballScreenX, ballScreenY);
        ctx.rotate(state.yawAngle);

        // Hamster Body (Orange Fur)
        ctx.fillStyle = '#f97316'; // orange-500
        ctx.beginPath();
        ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2);
        ctx.fill();

        // Cream Chest
        ctx.fillStyle = '#fed7aa'; // orange-200
        ctx.beginPath();
        ctx.ellipse(0, 3, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        // Chubby Cheeks
        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.arc(-8, 1, 4, 0, Math.PI * 2);
        ctx.arc(8, 1, 4, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(-5, -4, 2.5, 0, Math.PI * 2);
        ctx.arc(5, -4, 2.5, 0, Math.PI * 2);
        ctx.fill();

        // Eye glints
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(-6, -5, 1, 0, Math.PI * 2);
        ctx.arc(4, -5, 1, 0, Math.PI * 2);
        ctx.fill();

        // Little Hamster Ears
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.arc(-11, -11, 4.5, 0, Math.PI * 2);
        ctx.arc(11, -11, 4.5, 0, Math.PI * 2);
        ctx.fill();

        // Running Little Paws (oscillating with roll angle)
        const pawOffset = Math.sin(state.rollAngle * 2) * 4;
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(-9, 10 + pawOffset, 3, 0, Math.PI * 2);
        ctx.arc(9, 10 - pawOffset, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();

        // Transparent Glossy Sphere Shell
        ctx.save();
        ctx.beginPath();
        ctx.arc(ballScreenX, ballScreenY, BALL_RADIUS, 0, Math.PI * 2);

        // Glass gradient
        const sphereGrad = ctx.createRadialGradient(
          ballScreenX - 7,
          ballScreenY - 7,
          2,
          ballScreenX,
          ballScreenY,
          BALL_RADIUS
        );
        sphereGrad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
        sphereGrad.addColorStop(0.3, 'rgba(186, 230, 253, 0.3)');
        sphereGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.25)');
        sphereGrad.addColorStop(1, 'rgba(2, 132, 199, 0.6)');
        ctx.fillStyle = sphereGrad;
        ctx.fill();

        // Specular glint
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.ellipse(ballScreenX - 7, ballScreenY - 8, 6, 3, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();

        // Sphere rim stroke
        ctx.strokeStyle = state.isInvulnerable
          ? '#eab308'
          : 'rgba(255, 255, 255, 0.6)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
      } else {
        // Comical bubble pop when fallen
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💥 RESPAWNING...', screenBallX, screenBallY);
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [syncHud]);

  return (
    <div className="relative w-full max-w-[440px] mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-700/60">
      {/* Top Header / HUD */}
      <div className="w-full bg-slate-800/95 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-slate-700/60 z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐹</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Lvl {hudState.level}: {hudState.levelName}
            </span>
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <span>🌾 {hudState.seedsCollected}/{hudState.totalSeeds}</span>
              <span className="text-slate-500">•</span>
              <span className="text-yellow-400 font-bold">{hudState.score} pts</span>
            </div>
          </div>
        </div>

        {/* Lives & Sound Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-0.5 text-sm" title="Lives remaining">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={i < hudState.lives ? 'opacity-100 scale-100' : 'opacity-25 grayscale scale-90'}
              >
                ❤️
              </span>
            ))}
          </div>

          <button
            onClick={handleToggleSound}
            className="w-8 h-8 rounded-lg bg-slate-700/80 hover:bg-slate-600 flex items-center justify-center text-sm transition-colors"
            title={hudState.isMuted ? 'Unmute' : 'Mute'}
            aria-label="Toggle Sound"
          >
            {hudState.isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Track Distance Progress Bar */}
      <div className="w-full h-1.5 bg-slate-700 relative">
        <div
          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 transition-all duration-150"
          style={{ width: `${hudState.progressPercent}%` }}
        />
      </div>

      {/* Interactive 60 FPS HTML5 Canvas */}
      <div className="relative w-full flex justify-center bg-emerald-900">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full max-h-[650px] aspect-[400/650] object-contain cursor-grab active:cursor-grabbing touch-none block"
        />

        {/* Ready Overlay */}
        {hudState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border-2 border-amber-400/50 flex items-center justify-center text-4xl mb-3 shadow-[0_0_24px_rgba(245,158,11,0.4)] animate-bounce">
              🐹
            </div>
            <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">
              Hamster Ball Dash
            </h2>
            <p className="text-sm text-slate-300 max-w-xs mb-5 leading-relaxed">
              Drag left or right to steer Pip inside the transparent stunt sphere. Collect sunflower seeds and hit booster ramps!
            </p>
            <button
              onClick={handleStartGame}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95"
            >
              ROLL TO START!
            </button>
          </div>
        )}

        {/* Level Cleared Overlay */}
        {hudState.status === 'level_cleared' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2 animate-bounce">🏁</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1 tracking-tight">
              STAGE COMPLETE!
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              Level {hudState.level} conquered with {hudState.score} points!
            </p>
            <button
              onClick={handleNextLevel}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-transform active:scale-95"
            >
              NEXT STAGE 🚀
            </button>
          </div>
        )}

        {/* Victory Celebration Overlay */}
        {hudState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2 animate-pulse">👑</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1 tracking-tight">
              ULTIMATE CHAMPION!
            </h2>
            <p className="text-sm text-slate-200 mb-4 max-w-xs">
              You cleared all 3 tube stunt circuits with an epic total score of {hudState.score}!
            </p>
            <button
              onClick={handleRestartLevel}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95"
            >
              PLAY AGAIN 🐹⚡
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {hudState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2">💔</div>
            <h2 className="text-2xl font-black text-rose-400 mb-1 tracking-tight">
              GAME OVER
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              All lives lost! Final score: {hudState.score}
            </p>
            <button
              onClick={handleRestartLevel}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-400 hover:to-orange-400 text-white font-black text-base rounded-xl shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-transform active:scale-95"
            >
              TRY AGAIN 🔄
            </button>
          </div>
        )}
      </div>

      {/* On-Screen Mobile Steering Controls (Dual Touch Anchors) */}
      <div className="w-full bg-slate-800/90 px-4 py-2.5 flex items-center justify-between border-t border-slate-700/60 z-20">
        <button
          onPointerDown={() => {
            inputRef.current.steer = -1;
            handleStartGame();
          }}
          onPointerUp={() => {
            inputRef.current.steer = 0;
          }}
          onPointerLeave={() => {
            inputRef.current.steer = 0;
          }}
          className="flex-1 py-3 bg-slate-700/70 active:bg-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 font-bold text-amber-300 border border-slate-600/60 active:border-amber-400 transition-all select-none mr-2 touch-none"
          aria-label="Steer Left"
        >
          <span className="text-lg">◀</span> STEER LEFT
        </button>

        <button
          onPointerDown={() => {
            inputRef.current.steer = 1;
            handleStartGame();
          }}
          onPointerUp={() => {
            inputRef.current.steer = 0;
          }}
          onPointerLeave={() => {
            inputRef.current.steer = 0;
          }}
          className="flex-1 py-3 bg-slate-700/70 active:bg-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 font-bold text-amber-300 border border-slate-600/60 active:border-amber-400 transition-all select-none ml-2 touch-none"
          aria-label="Steer Right"
        >
          STEER RIGHT <span className="text-lg">▶</span>
        </button>
      </div>
    </div>
  );
};

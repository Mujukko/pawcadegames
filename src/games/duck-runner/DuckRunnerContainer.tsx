import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  ArrowDown,
  ArrowUp,
  Sparkles,
  HelpCircle,
  X,
} from 'lucide-react';
import {
  createInitialState,
  jump,
  startCrouch,
  stopCrouch,
  updateGame,
  resetGame,
} from './logic/engine';
import { DEFAULT_DUCK_CONFIG, DuckRunnerState, Obstacle } from './logic/types';
import { duckRunnerSound } from './systems/sound';

const STORAGE_HIGH_SCORE_KEY = 'pawcade_duck_runner_highscore';

export const DuckRunnerContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) || 0 : 0;
    } catch {
      return 0;
    }
  });

  const gameStateRef = useRef<DuckRunnerState>(createInitialState(highScore));
  const [hudState, setHudState] = useState<{
    score: number;
    highScore: number;
    isStarted: boolean;
    isGameOver: boolean;
    isNightMode: boolean;
  }>({
    score: 0,
    highScore,
    isStarted: false,
    isGameOver: false,
    isNightMode: false,
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => duckRunnerSound.isMuted());
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const [isTouchCrouching, setIsTouchCrouching] = useState<boolean>(false);

  const requestRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  // Parallax clouds & scenery state
  const cloudsRef = useRef<Array<{ x: number; y: number; speed: number; scale: number }>>([
    { x: 120, y: 55, speed: 25, scale: 1.1 },
    { x: 380, y: 40, speed: 18, scale: 0.9 },
    { x: 650, y: 70, speed: 22, scale: 1.3 },
  ]);

  const groundPebblesRef = useRef<Array<{ x: number; y: number; size: number }>>(() => {
    const list = [];
    for (let i = 0; i < 35; i++) {
      list.push({
        x: Math.random() * 800,
        y: 298 + Math.random() * 50,
        size: 1.5 + Math.random() * 2.5,
      });
    }
    return list;
  });

  // Handle jump action
  const handleJump = useCallback(() => {
    const current = gameStateRef.current;
    if (current.isGameOver) {
      const restarted = resetGame(current);
      gameStateRef.current = restarted;
      duckRunnerSound.playJump();
      return;
    }
    gameStateRef.current = jump(current);
    duckRunnerSound.playJump();
  }, []);

  // Handle crouch actions
  const handleStartCrouch = useCallback(() => {
    const current = gameStateRef.current;
    if (current.isGameOver) return;
    gameStateRef.current = startCrouch(current);
    setIsTouchCrouching(true);
    if (current.isGrounded) {
      duckRunnerSound.playDuck();
    }
  }, []);

  const handleStopCrouch = useCallback(() => {
    const current = gameStateRef.current;
    gameStateRef.current = stopCrouch(current);
    setIsTouchCrouching(false);
  }, []);

  // Keyboard controls (Space / ArrowUp / W = Jump, ArrowDown / S = Crouch)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStartCrouch();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStopCrouch();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleJump, handleStartCrouch, handleStopCrouch]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = (time: number) => {
      if (!isRunning) return;

      if (!lastTimeRef.current) {
        lastTimeRef.current = time;
      }
      const dt = (time - lastTimeRef.current) / 1000;
      lastTimeRef.current = time;

      // 1. Advance Game Engine Logic
      const prevScore = gameStateRef.current.score;
      const prevGameOver = gameStateRef.current.isGameOver;

      const nextState = updateGame(gameStateRef.current, dt, DEFAULT_DUCK_CONFIG);
      gameStateRef.current = nextState;

      // Consume pending sound events
      if (nextState.pendingSoundEvents.length > 0) {
        for (const evt of nextState.pendingSoundEvents) {
          if (evt === 'milestone') duckRunnerSound.playMilestone();
          if (evt === 'hit') duckRunnerSound.playHit();
          if (evt === 'quack') duckRunnerSound.playQuack();
        }
        nextState.pendingSoundEvents = [];
      }

      // Save high score if updated
      if (nextState.highScore > highScore) {
        setHighScore(nextState.highScore);
        try {
          localStorage.setItem(STORAGE_HIGH_SCORE_KEY, String(nextState.highScore));
        } catch {}
      }

      // Sync React HUD state periodically or on change
      if (
        nextState.score !== prevScore ||
        nextState.isGameOver !== prevGameOver ||
        nextState.isNightMode !== hudState.isNightMode
      ) {
        setHudState({
          score: nextState.score,
          highScore: nextState.highScore,
          isStarted: nextState.isStarted,
          isGameOver: nextState.isGameOver,
          isNightMode: nextState.isNightMode,
        });
      }

      // 2. Clear & Draw Canvas Scene
      const width = DEFAULT_DUCK_CONFIG.canvasWidth;
      const height = DEFAULT_DUCK_CONFIG.canvasHeight;
      const groundY = nextState.groundY;
      const nightAlpha = nextState.nightTransitionAlpha;

      // Sky Background (Interpolate between sunny daylight and twilight night)
      if (nightAlpha <= 0.02) {
        ctx.fillStyle = '#bae6fd'; // Day sky
      } else if (nightAlpha >= 0.98) {
        ctx.fillStyle = '#0f172a'; // Deep night sky
      } else {
        // Blend colors
        ctx.fillStyle = '#bae6fd';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = `rgba(15, 23, 42, ${nightAlpha})`;
      }
      ctx.fillRect(0, 0, width, height);

      // Celestial: Sun or Moon
      if (nightAlpha < 0.9) {
        // Glowing Day Sun
        ctx.save();
        ctx.globalAlpha = 1 - nightAlpha;
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(690, 68, 38, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(690, 68, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (nightAlpha > 0.1) {
        // Crescent Night Moon & Stars
        ctx.save();
        ctx.globalAlpha = nightAlpha;
        // Crescent Moon
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(690, 68, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(680, 62, 20, 0, Math.PI * 2);
        ctx.fill();

        // Twinkling Stars
        ctx.fillStyle = '#f8fafc';
        const stars = [
          { x: 90, y: 35 },
          { x: 210, y: 60 },
          { x: 330, y: 40 },
          { x: 480, y: 55 },
          { x: 590, y: 30 },
          { x: 740, y: 95 },
        ];
        stars.forEach((s, idx) => {
          const blink = Math.sin(time * 0.004 + idx) * 0.5 + 0.5;
          ctx.globalAlpha = nightAlpha * (0.4 + blink * 0.6);
          ctx.beginPath();
          ctx.arc(s.x, s.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.restore();
      }

      // Parallax Drifting Clouds
      cloudsRef.current.forEach((cloud) => {
        if (nextState.isStarted && !nextState.isGameOver) {
          cloud.x -= cloud.speed * dt;
          if (cloud.x + 80 < 0) {
            cloud.x = width + 40;
            cloud.y = 35 + Math.random() * 55;
          }
        }
        ctx.save();
        ctx.fillStyle = nightAlpha > 0.5 ? 'rgba(51, 65, 85, 0.45)' : 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, 18 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(cloud.x + 18 * cloud.scale, cloud.y - 6 * cloud.scale, 22 * cloud.scale, 0, Math.PI * 2);
        ctx.arc(cloud.x + 38 * cloud.scale, cloud.y, 18 * cloud.scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Distant rolling meadow hills
      ctx.fillStyle = nightAlpha > 0.5 ? '#1e293b' : '#86efac';
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      ctx.quadraticCurveTo(200, groundY - 45, 450, groundY - 15);
      ctx.quadraticCurveTo(650, groundY - 55, width, groundY);
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.fill();

      // Ground path surface (warm farm dirt trail)
      ctx.fillStyle = nightAlpha > 0.5 ? '#334155' : '#d97706';
      ctx.fillRect(0, groundY, width, height - groundY);

      // Top green pasture ridge line
      ctx.fillStyle = nightAlpha > 0.5 ? '#0f766e' : '#4ade80';
      ctx.fillRect(0, groundY, width, 5);

      // Moving ground pebbles / grass tufts
      groundPebblesRef.current().forEach((p) => {
        if (nextState.isStarted && !nextState.isGameOver) {
          p.x -= nextState.speed * dt;
          if (p.x < -10) p.x = width + Math.random() * 40;
        }
        ctx.fillStyle = nightAlpha > 0.5 ? '#475569' : '#b45309';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Draw Obstacles
      for (const obs of nextState.obstacles) {
        drawObstacle(ctx, obs, nightAlpha);
      }

      // 4. Draw Quacky the Duck!
      drawDuck(ctx, nextState, time);

      // 5. Draw In-Game Top-Right Retro Score Display
      drawScoreHUD(ctx, nextState, width);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);
    return () => {
      isRunning = false;
      cancelAnimationFrame(requestRef.current);
    };
  }, [highScore, hudState.isNightMode]);

  // Procedural Drawing: Obstacles (Hay Bales, Fences, Flying Crows)
  const drawObstacle = (ctx: CanvasRenderingContext2D, obs: Obstacle, nightAlpha: number) => {
    ctx.save();

    if (obs.type === 'hay_bale_single') {
      // Golden Cylindrical Hay Bale
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;

      // Rounded bale body
      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 8);
      ctx.fill();
      ctx.stroke();

      // Bound twine straps
      ctx.strokeStyle = '#854d0e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.height * 0.35);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.35);
      ctx.moveTo(obs.x, obs.y + obs.height * 0.68);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.68);
      ctx.stroke();

      // Straw tuft strands
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(obs.x + 4, obs.y + 4, 3, 3);
      ctx.fillRect(obs.x + obs.width - 8, obs.y + 7, 3, 3);
    } else if (obs.type === 'hay_bale_double') {
      // Double Hay Bale Bundle
      ctx.fillStyle = '#eab308';
      ctx.strokeStyle = '#a16207';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.roundRect(obs.x, obs.y, obs.width, obs.height, 9);
      ctx.fill();
      ctx.stroke();

      // Center separator
      ctx.beginPath();
      ctx.moveTo(obs.x + obs.width * 0.5, obs.y);
      ctx.lineTo(obs.x + obs.width * 0.5, obs.y + obs.height);
      ctx.stroke();

      // Twin twine straps
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(obs.x, obs.y + obs.height * 0.5);
      ctx.lineTo(obs.x + obs.width, obs.y + obs.height * 0.5);
      ctx.stroke();
    } else if (obs.type === 'fence_post') {
      // Rustic Farm Wooden Fence Post
      ctx.fillStyle = '#78350f';
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 2.5;

      // Vertical post
      ctx.beginPath();
      ctx.roundRect(obs.x + 4, obs.y, obs.width - 8, obs.height, 4);
      ctx.fill();
      ctx.stroke();

      // Crossbars
      ctx.fillStyle = '#92400e';
      ctx.fillRect(obs.x, obs.y + 12, obs.width, 8);
      ctx.strokeRect(obs.x, obs.y + 12, obs.width, 8);
      ctx.fillRect(obs.x, obs.y + 28, obs.width, 8);
      ctx.strokeRect(obs.x, obs.y + 28, obs.width, 8);
    } else if (obs.type.startsWith('flying_crow')) {
      // Flying Barn Crow / Raven
      const isWingsUp = (obs.frame || 0) < 1;
      ctx.fillStyle = nightAlpha > 0.5 ? '#e2e8f0' : '#1e293b';

      // Crow Body
      ctx.beginPath();
      ctx.ellipse(obs.x + 22, obs.y + 14, 14, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      // Head & sharp beak
      ctx.beginPath();
      ctx.arc(obs.x + 8, obs.y + 11, 6, 0, Math.PI * 2);
      ctx.fill();
      // Orange beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(obs.x + 4, obs.y + 10);
      ctx.lineTo(obs.x - 5, obs.y + 12);
      ctx.lineTo(obs.x + 4, obs.y + 14);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(obs.x + 7, obs.y + 10, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Animated Wings
      ctx.fillStyle = nightAlpha > 0.5 ? '#cbd5e1' : '#0f172a';
      ctx.beginPath();
      if (isWingsUp) {
        ctx.moveTo(obs.x + 18, obs.y + 12);
        ctx.lineTo(obs.x + 24, obs.y - 8);
        ctx.lineTo(obs.x + 32, obs.y + 12);
      } else {
        ctx.moveTo(obs.x + 18, obs.y + 12);
        ctx.lineTo(obs.x + 24, obs.y + 28);
        ctx.lineTo(obs.x + 32, obs.y + 12);
      }
      ctx.fill();
    }

    ctx.restore();
  };

  // Procedural Drawing: Quacky the Duck!
  const drawDuck = (ctx: CanvasRenderingContext2D, state: DuckRunnerState, time: number) => {
    ctx.save();
    const x = state.duckX;
    const y = state.duckY;
    const isCrouched = state.isCrouching;
    const isJumping = !state.isGrounded;
    const isGameOver = state.isGameOver;

    if (isCrouched) {
      // 🦆 CROUCHED / DUCKING DUCK (Low aerodynamic sliding duck)
      // Body
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(x + 26, y + 14, 24, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Wing tucked down
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.ellipse(x + 18, y + 13, 12, 6, -0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Duck Head (lower and extended forward)
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x + 44, y + 10, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orange Beak
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.moveTo(x + 50, y + 8);
      ctx.lineTo(x + 60, y + 12);
      ctx.lineTo(x + 49, y + 15);
      ctx.fill();

      // Eye
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(x + 45, y + 8, 2, 0, Math.PI * 2);
      ctx.fill();

      // Speed lines behind crouching duck
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(x - 4, y + 8);
      ctx.lineTo(x - 14, y + 8);
      ctx.moveTo(x - 2, y + 16);
      ctx.lineTo(x - 18, y + 16);
      ctx.stroke();
    } else {
      // 🦆 STANDING / RUNNING / JUMPING DUCK
      // Animated leg trot (waddling feet)
      const legCycle = isJumping ? 0 : Math.sin(time * 0.02);

      // Feet (Orange webbed feet)
      ctx.fillStyle = '#ea580c';
      if (isJumping) {
        // Tucked back jumping feet
        ctx.fillRect(x + 8, y + 42, 10, 4);
      } else {
        // Left foot
        ctx.fillRect(x + 12 + legCycle * 5, y + 42, 8, 4);
        // Right foot
        ctx.fillRect(x + 24 - legCycle * 5, y + 42, 8, 4);
      }

      // Yellow Duck Body
      ctx.fillStyle = '#facc15';
      ctx.strokeStyle = '#ca8a04';
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.ellipse(x + 20, y + 26, 17, 15, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute Little Tail
      ctx.beginPath();
      ctx.moveTo(x + 4, y + 24);
      ctx.lineTo(x - 4, y + 17);
      ctx.lineTo(x + 8, y + 30);
      ctx.fill();
      ctx.stroke();

      // Animated Wing
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      if (isJumping) {
        // Flapping spread wings in air
        ctx.ellipse(x + 18, y + 18, 14, 7, -0.6, 0, Math.PI * 2);
      } else {
        // Running side flutter
        const wingAngle = Math.sin(time * 0.02) * 0.2;
        ctx.ellipse(x + 18, y + 25, 12, 8, wingAngle, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.stroke();

      // Duck Head
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(x + 30, y + 12, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Orange Beak
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(x + 38, y + 10);
      ctx.lineTo(x + 48, y + 14);
      ctx.lineTo(x + 37, y + 18);
      ctx.fill();

      // Eye (Sparkle eye or X eye if game over)
      if (isGameOver) {
        // 'X' Game Over Eye
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + 28, y + 7);
        ctx.lineTo(x + 34, y + 13);
        ctx.moveTo(x + 34, y + 7);
        ctx.lineTo(x + 28, y + 13);
        ctx.stroke();
      } else {
        // Happy cartoon eye with glint
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(x + 32, y + 9, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x + 31, y + 8, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  // Top-Right Retro Score HUD (like classic Chrome Dino!)
  const drawScoreHUD = (
    ctx: CanvasRenderingContext2D,
    state: DuckRunnerState,
    canvasWidth: number
  ) => {
    ctx.save();
    const scoreStr = String(state.score).padStart(5, '0');
    const highStr = String(state.highScore).padStart(5, '0');

    ctx.font = 'bold 18px "Courier New", Courier, monospace';
    ctx.textAlign = 'right';

    const isNight = state.isNightMode;
    const textColor = isNight ? '#f8fafc' : '#1e293b';
    const hiColor = isNight ? '#94a3b8' : '#64748b';

    // Milestone blinking effect
    const isFlashing = state.score % 100 < 25 && state.score > 0;
    ctx.fillStyle = isFlashing ? '#f59e0b' : textColor;

    const fullText = `HI ${highStr}  ${scoreStr}`;
    ctx.fillStyle = hiColor;
    ctx.fillText(`HI ${highStr}  `, canvasWidth - 85, 30);
    ctx.fillStyle = isFlashing ? '#eab308' : textColor;
    ctx.fillText(scoreStr, canvasWidth - 25, 30);

    ctx.restore();
  };

  const toggleSound = () => {
    const next = duckRunnerSound.toggleMute();
    setIsMuted(next);
  };

  const handleRestart = () => {
    const restarted = resetGame(gameStateRef.current);
    gameStateRef.current = restarted;
    duckRunnerSound.playJump();
    setHudState({
      score: 0,
      highScore: restarted.highScore,
      isStarted: true,
      isGameOver: false,
      isNightMode: false,
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-1 sm:px-2 py-1 select-none">
      {/* Scenic Duck Runner Game Frame */}
      <div
        style={{
          boxShadow: '0 14px 36px rgba(15, 23, 42, 0.35)',
        }}
        className="relative w-full rounded-[24px] sm:rounded-[32px] p-2 sm:p-5 border-3 sm:border-4 border-amber-600/80 overflow-hidden bg-slate-900"
      >
        {/* Top Header Bar: Level Name, High Score Badge & Controls */}
        <div className="relative z-20 flex items-center justify-between gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-2">
            <div className="px-3 py-1 rounded-xl bg-amber-500/90 border border-amber-300/60 shadow-md flex items-center gap-1.5">
              <span className="text-base sm:text-lg">🦆</span>
              <span className="text-xs sm:text-sm font-black text-amber-950 uppercase tracking-tight">
                Duck Runner
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700 text-amber-300 text-xs font-black">
              <Trophy className="w-3.5 h-3.5" />
              <span>BEST: {hudState.highScore}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setIsHelpOpen(true)}
              title="How to Play"
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-400/50 shadow-sm cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-100 border border-slate-600 shadow-sm cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-emerald-400" />
              )}
            </button>
            <button
              onClick={handleRestart}
              title="Restart Game"
              className="p-2 px-3 rounded-xl bg-gradient-to-b from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-black text-xs border border-amber-300 flex items-center gap-1 cursor-pointer min-h-[40px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>
        </div>

        {/* The 60 FPS HTML5 Canvas Container */}
        <div
          onClick={handleJump}
          className="relative w-full aspect-[800/360] max-w-[800px] mx-auto rounded-2xl overflow-hidden border-2 border-amber-400/50 cursor-pointer shadow-inner touch-none select-none bg-sky-200"
        >
          <canvas
            ref={canvasRef}
            width={DEFAULT_DUCK_CONFIG.canvasWidth}
            height={DEFAULT_DUCK_CONFIG.canvasHeight}
            className="w-full h-full block"
          />

          {/* Pre-Game Start Overlay */}
          {!hudState.isStarted && !hudState.isGameOver && (
            <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-in fade-in duration-200">
              <span className="text-5xl mb-2 animate-bounce">🦆💨</span>
              <h2 className="text-xl sm:text-3xl font-black text-amber-300 tracking-tight mb-1">
                Press Space or Tap to Jump!
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 max-w-sm mb-4">
                Help Quacky jump over hay bales and duck under flying crows in this classic T-Rex runner!
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleJump();
                }}
                className="py-2.5 px-6 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm shadow-xl border-2 border-amber-200 transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>RUN DUCKY RUN! 🌾</span>
              </button>
            </div>
          )}

          {/* Game Over Modal Overlay */}
          {hudState.isGameOver && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center p-4 text-center z-30 animate-in fade-in duration-200">
              <span className="text-5xl mb-2 animate-pulse">🦆💥</span>
              <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight mb-1">
                QUACK OVER!
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mb-3">
                You scored <strong className="text-yellow-300 font-bold">{hudState.score}</strong> points!
              </p>

              {hudState.score >= hudState.highScore && hudState.score > 0 && (
                <div className="mb-3 px-3 py-1 rounded-full bg-yellow-400 text-slate-950 text-xs font-black flex items-center gap-1 shadow-md animate-bounce">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>NEW HIGH SCORE! 🏆</span>
                </div>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestart();
                }}
                className="py-3 px-6 rounded-xl bg-gradient-to-b from-amber-400 to-orange-600 hover:from-amber-500 hover:to-orange-700 text-slate-950 font-black text-sm sm:text-base shadow-xl border-2 border-yellow-200 transition-all active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Play Again 🦆</span>
              </button>
            </div>
          )}
        </div>

        {/* Mobile Ergonomic Touch Pad (Jump on Right, Crouch/Duck on Left) */}
        <div className="flex sm:hidden items-center justify-between gap-3 mt-2 px-1">
          {/* Left Thumb: Crouch / Duck Down Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleStartCrouch();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleStopCrouch();
            }}
            onMouseDown={handleStartCrouch}
            onMouseUp={handleStopCrouch}
            onMouseLeave={handleStopCrouch}
            className={`flex-1 py-3 rounded-2xl font-black text-sm border-2 flex items-center justify-center gap-1.5 transition-all active:scale-95 touch-none select-none ${
              isTouchCrouching
                ? 'bg-amber-400 text-slate-950 border-white ring-2 ring-yellow-300'
                : 'bg-slate-800 text-amber-300 border-slate-600 active:bg-slate-700'
            }`}
          >
            <ArrowDown className="w-5 h-5" />
            <span>DUCK ⬇️</span>
          </button>

          {/* Right Thumb: Jump Up Button */}
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              handleJump();
            }}
            onClick={handleJump}
            className="flex-1 py-3 rounded-2xl bg-gradient-to-b from-amber-400 via-amber-500 to-orange-600 text-slate-950 font-black text-sm border-2 border-amber-200 flex items-center justify-center gap-1.5 shadow-lg active:scale-95 touch-none select-none"
          >
            <ArrowUp className="w-5 h-5" />
            <span>JUMP ⬆️</span>
          </button>
        </div>

        {/* Desktop Controls Hint Bar */}
        <div className="hidden sm:flex items-center justify-between text-[11px] font-bold text-slate-400 mt-2.5 px-2">
          <div>
            <span>Controls: </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono">
              Space
            </kbd>{' '}
            or{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono">
              ↑
            </kbd>{' '}
            Jump •{' '}
            <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-amber-300 border border-slate-700 font-mono">
              ↓
            </kbd>{' '}
            Duck / Fast Fall
          </div>
          <div className="flex items-center gap-2">
            <span>🌾 Dodge Hay Bales & Fences</span>
            <span>•</span>
            <span>🦅 Duck Under High Crows</span>
          </div>
        </div>
      </div>

      {/* How to Play Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border-2 border-amber-400/70 rounded-3xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🦆</span>
                <h3 className="text-lg font-black text-amber-300">How to Play Duck Runner</h3>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⬆️</span>
                <p>
                  <strong>Jump Over Low Obstacles:</strong> Press <strong>Space</strong>,{' '}
                  <strong>Up Arrow</strong>, or tap to leap over Hay Bales (🌾) and Wooden Fences (🪵).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⬇️</span>
                <p>
                  <strong>Duck Under Flying Crows:</strong> Hold <strong>Down Arrow</strong> or the{' '}
                  <strong>DUCK</strong> button to slide Quacky flat on the ground underneath high-flying crows (🦅)!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">⚡</span>
                <p>
                  <strong>Fast Fall in Air:</strong> Press Down while in mid-air to drop back to the ground faster and prepare for the next jump!
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="text-lg">🌙</span>
                <p>
                  <strong>Day & Night Cycle:</strong> Every 600 points, the farm shifts between sunny daylight and starry moonlit twilight!
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsHelpOpen(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm transition-colors cursor-pointer shadow-md border border-amber-300"
            >
              Got It, Let's Quack! 🦆
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialTowerState,
  updateCranePosition,
  dropCurrentAnimal,
  resolveAnimalLanding,
  BarnyardTowerState,
  ANIMAL_DEFS,
  BASE_PLATFORM_WIDTH,
  AnimalType,
} from './logic/engine';
import { towerAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Award, Heart, Sparkles } from 'lucide-react';
import { analytics } from '../../lib/analytics';

const HIGH_SCORE_KEY = 'pawcade_barnyard_tower_highscore';
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 560;
const CART_Y = 475;
const GROUND_Y = 515;
const ANIMAL_STACK_HEIGHT = 44;
const TARGET_SCREEN_LANDING_Y = 280;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  isStar?: boolean;
}

interface FloatingPopup {
  text: string;
  x: number;
  y: number;
  vy: number;
  color: string;
  alpha: number;
  scale: number;
  life: number;
}

export const BarnyardTowerContainer: React.FC = () => {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  // HUD state updated strictly on gameplay events (0 React re-renders during 60fps loop)
  const [hud, setHud] = useState<{
    score: number;
    height: number;
    lives: number;
    maxLives: number;
    gameOver: boolean;
    highScore: number;
  }>({
    score: 0,
    height: 0,
    lives: 3,
    maxLives: 3,
    gameOver: false,
    highScore,
  });

  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<BarnyardTowerState>(createInitialTowerState(highScore));
  const camYRef = useRef<number>(0);
  const reqAnimRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Transient visual juice (particles, squash, popups)
  const particlesRef = useRef<Particle[]>([]);
  const popupsRef = useRef<FloatingPopup[]>([]);
  const squashRef = useRef<{ index: number; scaleX: number; scaleY: number; time: number } | null>(null);
  const cloudsRef = useRef<{ x: number; y: number; speed: number; scale: number; opacity: number }[]>([
    { x: 30, y: 70, speed: 8, scale: 1.0, opacity: 0.65 },
    { x: 260, y: 130, speed: 12, scale: 1.3, opacity: 0.8 },
    { x: 140, y: 220, speed: 6, scale: 0.9, opacity: 0.5 },
    { x: 320, y: 310, speed: 10, scale: 1.1, opacity: 0.6 },
  ]);

  // Handle Drop Action with zero touch lag
  const triggerDrop = useCallback(() => {
    const curr = stateRef.current;
    if (curr.gameOver || curr.fallingAnimal !== null) return;

    towerAudio.playDrop();
    const nextState = dropCurrentAnimal(curr);
    stateRef.current = nextState;
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        triggerDrop();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = towerAudio.toggleMute();
        setIsMuted(muted);
      } else if ((e.key === 'r' || e.key === 'R') && stateRef.current.gameOver) {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDrop]);

  // Restart Game
  const restartGame = useCallback(() => {
    analytics.gameRestarted('barnyard-tower', { finalScore: stateRef.current.score, height: stateRef.current.height });
    const nextState = createInitialTowerState(highScore);
    stateRef.current = nextState;
    camYRef.current = 0;
    particlesRef.current = [];
    popupsRef.current = [];
    squashRef.current = null;
    setHud({
      score: 0,
      height: 0,
      lives: 3,
      maxLives: 3,
      gameOver: false,
      highScore,
    });
  }, [highScore]);

  // Spawn visual juice helper
  const spawnJuice = (type: 'perfect' | 'good' | 'miss', x: number, screenY: number, combo: number) => {
    if (type === 'perfect') {
      // Golden starburst particles
      for (let i = 0; i < 24; i++) {
        const angle = (i / 24) * Math.PI * 2;
        const speed = 120 + Math.random() * 160;
        particlesRef.current.push({
          x,
          y: screenY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 40,
          size: 7 + Math.random() * 5,
          color: Math.random() > 0.4 ? '#facc15' : '#fb923c',
          alpha: 1,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: (Math.random() - 0.5) * 8,
          life: 0,
          maxLife: 0.75,
          isStar: true,
        });
      }
      // Floating text
      popupsRef.current.push({
        text: combo > 1 ? `PERFECT x${combo}! +${200 + combo * 50}` : `PERFECT! +200`,
        x,
        y: screenY - 20,
        vy: -75,
        color: '#facc15',
        alpha: 1,
        scale: 1.25,
        life: 0,
      });
    } else if (type === 'good') {
      // Soft dust puff particles
      for (let i = 0; i < 14; i++) {
        const angle = Math.PI + (Math.random() - 0.5) * 2;
        const speed = 60 + Math.random() * 80;
        particlesRef.current.push({
          x: x + (Math.random() - 0.5) * 40,
          y: screenY + 15,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed * 0.4 - 20,
          size: 6 + Math.random() * 6,
          color: '#e2e8f0',
          alpha: 0.8,
          rotation: 0,
          rotSpeed: 0,
          life: 0,
          maxLife: 0.55,
        });
      }
      popupsRef.current.push({
        text: `GOOD! +100`,
        x,
        y: screenY - 15,
        vy: -60,
        color: '#38bdf8',
        alpha: 1,
        scale: 1.05,
        life: 0,
      });
    } else if (type === 'miss') {
      popupsRef.current.push({
        text: `MISSED! 💔`,
        x,
        y: screenY - 15,
        vy: -50,
        color: '#f43f5e',
        alpha: 1,
        scale: 1.1,
        life: 0,
      });
    }
  };

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle High-DPI displays
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = CANVAS_WIDTH * dpr;
    canvas.height = CANVAS_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const renderLoop = (timestamp: number) => {
      if (!active) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      let state = stateRef.current;

      // 1. GAME LOGIC TICK
      if (!state.gameOver) {
        // A. Move Crane
        state = updateCranePosition(state, dt);

        // B. Update Camera Target & Smooth Lerp
        const targetWorldLandingY = state.height === 0 ? CART_Y : CART_Y - state.height * ANIMAL_STACK_HEIGHT;
        const targetCamY = targetWorldLandingY < TARGET_SCREEN_LANDING_Y ? TARGET_SCREEN_LANDING_Y - targetWorldLandingY : 0;
        camYRef.current += (targetCamY - camYRef.current) * Math.min(1, dt * 7.5);

        // C. Falling Animal Physics & Collision Check
        if (state.fallingAnimal) {
          const falling = state.fallingAnimal;
          const newY = falling.y + falling.vy * dt;
          const currentScreenLandingY = targetWorldLandingY + camYRef.current;

          if (newY >= currentScreenLandingY) {
            // Animal touches down on stack or ground
            const result = resolveAnimalLanding(state, 50, CANVAS_WIDTH);
            state = result.state;

            const landX = (falling.x / 100) * CANVAS_WIDTH;
            if (result.event === 'perfect') {
              towerAudio.playLand(true);
              spawnJuice('perfect', landX, currentScreenLandingY, state.combo);
              squashRef.current = { index: state.height - 1, scaleX: 1.25, scaleY: 0.75, time: 0 };
            } else if (result.event === 'good') {
              towerAudio.playLand(false);
              spawnJuice('good', landX, currentScreenLandingY, state.combo);
              squashRef.current = { index: state.height - 1, scaleX: 1.15, scaleY: 0.85, time: 0 };
            } else if (result.event === 'miss') {
              towerAudio.playMiss();
              spawnJuice('miss', landX, currentScreenLandingY, 0);
            } else if (result.event === 'milestone') {
              towerAudio.playMilestone();
              analytics.scoreMilestone('barnyard-tower', result.state.score, `Height ${result.state.height}m`);
              spawnJuice('perfect', landX, currentScreenLandingY, state.combo);
              confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
            } else if (result.event === 'gameover') {
              towerAudio.playGameOver();
              analytics.levelFailed('barnyard-tower', {
                score: result.state.score,
                height: result.state.height,
                combo: result.state.combo,
              });
              if (result.state.score > highScore) {
                setHighScore(result.state.score);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(HIGH_SCORE_KEY, result.state.score.toString());
                }
              }
            }

            // Sync HUD once on land event
            setHud({
              score: state.score,
              height: state.height,
              lives: state.lives,
              maxLives: state.maxLives,
              gameOver: state.gameOver,
              highScore: Math.max(highScore, state.score),
            });
          } else {
            state = {
              ...state,
              fallingAnimal: {
                ...falling,
                y: newY,
              },
            };
          }
        }

        stateRef.current = state;
      }

      // 2. CANVAS DRAWING
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // A. Dynamic Atmospheric Sky
      const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      if (state.height < 12) {
        skyGradient.addColorStop(0, '#38bdf8'); // sky-400
        skyGradient.addColorStop(0.65, '#7dd3fc'); // sky-300
        skyGradient.addColorStop(1, '#bae6fd'); // sky-200
      } else if (state.height < 25) {
        skyGradient.addColorStop(0, '#0284c7'); // sky-600
        skyGradient.addColorStop(0.7, '#38bdf8'); // sky-400
        skyGradient.addColorStop(1, '#93c5fd'); // blue-300
      } else {
        skyGradient.addColorStop(0, '#1e1b4b'); // indigo-950 deep space
        skyGradient.addColorStop(0.5, '#312e81'); // indigo-900
        skyGradient.addColorStop(1, '#4f46e5'); // indigo-600
      }
      ctx.fillStyle = skyGradient;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Twinkling stars for high altitudes (25m+)
      if (state.height >= 20) {
        const starAlpha = Math.min(1, (state.height - 20) / 10);
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.8})`;
        for (let i = 0; i < 25; i++) {
          const sx = ((i * 83) % (CANVAS_WIDTH - 20)) + 10;
          const sy = ((i * 47) % (CANVAS_HEIGHT - 60)) + 20;
          const twinkle = Math.sin(timestamp * 0.003 + i) * 0.4 + 0.6;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5 * twinkle, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Parallax drifting clouds
      cloudsRef.current.forEach((cloud) => {
        cloud.x += cloud.speed * dt;
        if (cloud.x > CANVAS_WIDTH + 60) cloud.x = -80;
        drawCloud(ctx, cloud.x, cloud.y, cloud.scale, cloud.opacity);
      });

      // B. World Rendering (with camera translation)
      ctx.save();
      ctx.translate(0, camYRef.current);

      // Distant Pasture Hills & Barn (world space)
      drawPastureHills(ctx);

      // Lush Pasture Ground (world space)
      ctx.fillStyle = '#15803d'; // emerald-700
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 140);
      ctx.fillStyle = '#16a34a'; // emerald-600 grass highlight
      ctx.fillRect(0, GROUND_Y, CANVAS_WIDTH, 8);

      // Ground daisies & grass tufts
      drawGrassDetails(ctx);

      // 1. Hay Cart (The Base Platform - anchored at CART_Y, ALWAYS below animals)
      drawHayCart(ctx, CANVAS_WIDTH / 2, CART_Y);

      // 2. Stacked Animals
      const wobble = state.wobble;
      const swayDeg = Math.min(6, Math.max(-6, wobble * 0.22));

      state.stackedAnimals.forEach((animal, idx) => {
        const animalWorldY = CART_Y - idx * ANIMAL_STACK_HEIGHT - 22;
        const individualSway = Math.sin(timestamp * 0.0028 + idx * 0.18) * (swayDeg * 1.8);

        ctx.save();
        ctx.translate(animal.x + individualSway, animalWorldY);
        ctx.rotate(((animal.rotation + swayDeg * 0.6) * Math.PI) / 180);

        // Squash & stretch on landing
        let sx = 1;
        let sy = 1;
        if (squashRef.current && squashRef.current.index === idx) {
          const s = squashRef.current;
          s.time += dt * 5.5;
          if (s.time < 1) {
            sx = 1 + (s.scaleX - 1) * (1 - s.time);
            sy = 1 + (s.scaleY - 1) * (1 - s.time);
          } else {
            squashRef.current = null;
          }
        }
        ctx.scale(sx, sy);

        drawAnimal(ctx, animal.type);

        // Level altitude indicator badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
        ctx.beginPath();
        ctx.roundRect(animal.width * 0.3, 10, 18, 12, 4);
        ctx.fill();
        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 8px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${idx + 1}`, animal.width * 0.3 + 9, 16);

        ctx.restore();
      });

      ctx.restore(); // Restore world translation

      // C. Falling Animal (Screen Space)
      if (state.fallingAnimal) {
        const fallX = (state.fallingAnimal.x / 100) * CANVAS_WIDTH;
        ctx.save();
        ctx.translate(fallX, state.fallingAnimal.y);
        ctx.scale(0.94, 1.06); // Speed stretch
        drawAnimal(ctx, state.fallingAnimal.type);
        ctx.restore();
      }

      // D. Crane Mechanism (Screen Space, pinned at top)
      drawCrane(ctx, state.craneX, state.currentAnimal, !state.fallingAnimal && !state.gameOver);

      // E. Particles (Screen Space)
      particlesRef.current.forEach((p, idx) => {
        p.life += dt;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 320 * dt; // Gravity
        p.alpha = Math.max(0, 1 - p.life / p.maxLife);
        p.rotation += p.rotSpeed * dt;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.isStar) {
          drawStar(ctx, 0, 0, 4, p.size, p.size * 0.45);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        if (p.life >= p.maxLife) {
          particlesRef.current.splice(idx, 1);
        }
      });

      // F. Floating Score Popups (Screen Space)
      popupsRef.current.forEach((pop, idx) => {
        pop.life += dt;
        pop.y += pop.vy * dt;
        pop.alpha = Math.max(0, 1 - pop.life / 0.85);

        ctx.save();
        ctx.translate(pop.x, pop.y);
        ctx.globalAlpha = pop.alpha;
        ctx.font = '900 13px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Dark outline for punchy contrast
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.strokeText(pop.text, 0, 0);

        ctx.fillStyle = pop.color;
        ctx.fillText(pop.text, 0, 0);
        ctx.restore();

        if (pop.life >= 0.85) {
          popupsRef.current.splice(idx, 1);
        }
      });

      // G. Tower Wobble Warning Banner
      if (Math.abs(state.wobble) > 14 && !state.gameOver) {
        ctx.save();
        const pulse = Math.sin(timestamp * 0.008) * 0.08 + 1;
        ctx.translate(CANVAS_WIDTH / 2, 72);
        ctx.scale(pulse, pulse);
        ctx.fillStyle = '#e11d48'; // rose-600
        ctx.beginPath();
        ctx.roundRect(-90, -12, 180, 24, 12);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '900 10px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`⚠️ TOWER TILTING! (${Math.round(state.wobble)}°)`, 0, 0);
        ctx.restore();
      }

      reqAnimRef.current = requestAnimationFrame(renderLoop);
    };

    reqAnimRef.current = requestAnimationFrame(renderLoop);
    return () => {
      active = false;
      cancelAnimationFrame(reqAnimRef.current);
    };
  }, [highScore]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto h-[620px] select-none bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-900/50 flex flex-col touch-none cursor-pointer"
      onPointerDown={(e) => {
        e.preventDefault();
        triggerDrop();
      }}
      style={{ touchAction: 'none' }}
    >
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-slate-900/70 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Height</span>
            <span className="text-xl font-black leading-tight drop-shadow">{hud.height}m</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Score</span>
            <span className="text-xl font-black leading-tight drop-shadow">{hud.score}</span>
          </div>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-1 bg-black/40 px-2.5 py-1 rounded-full border border-white/10">
          {[...Array(hud.maxLives)].map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-all ${
                i < hud.lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-600 scale-90 opacity-40'
              }`}
            />
          ))}
        </div>

        {/* High Score & Audio */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-amber-300 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>{hud.highScore}</span>
          </div>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              const muted = towerAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 flex items-center justify-center cursor-pointer"
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 60 FPS Canvas Game Viewport */}
      <div className="relative flex-1 w-full overflow-hidden bg-slate-950 flex items-center justify-center">
        <canvas ref={canvasRef} className="w-full h-full object-contain block select-none pointer-events-none" />
      </div>

      {/* Bottom Action Prompt */}
      {!hud.gameOver && (
        <div className="relative z-20 py-2.5 bg-slate-900/80 backdrop-blur-sm border-t border-white/10 text-center text-white/90 text-xs font-semibold">
          Tap or Press <kbd className="px-2 py-0.5 bg-white/20 rounded font-mono text-[10px]">SPACE</kbd> to Drop Animal!
        </div>
      )}

      {/* Game Over Modal */}
      {hud.gameOver && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn overflow-y-auto"
        >
          <div className="text-5xl mb-2 animate-bounce">🐮💥</div>
          <h2 className="text-2xl font-black text-rose-400 tracking-wide uppercase mb-1">Tower Toppled!</h2>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            The barnyard animals reached an epic height of <strong className="text-amber-300">{hud.height}m</strong>!
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-5">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Final Score</span>
              <span className="text-xl font-black text-amber-400">{hud.score}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Best Height</span>
              <span className="text-xl font-black text-emerald-400">{hud.height} Animals</span>
            </div>
          </div>

          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              restartGame();
            }}
            className="w-full max-w-xs min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-sm tracking-wider uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Stack Again
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// PURE CANVAS 2D DRAWING UTILITIES
// ==========================================

function drawCloud(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, opacity: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`;
  ctx.beginPath();
  ctx.arc(0, 0, 18, 0, Math.PI * 2);
  ctx.arc(14, -6, 14, 0, Math.PI * 2);
  ctx.arc(28, 0, 16, 0, Math.PI * 2);
  ctx.arc(14, 6, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPastureHills(ctx: CanvasRenderingContext2D) {
  // Distant green hills
  ctx.fillStyle = '#15803d'; // emerald-700
  ctx.beginPath();
  ctx.moveTo(0, GROUND_Y);
  ctx.bezierCurveTo(100, GROUND_Y - 40, 240, GROUND_Y - 30, CANVAS_WIDTH, GROUND_Y);
  ctx.lineTo(CANVAS_WIDTH, GROUND_Y + 40);
  ctx.lineTo(0, GROUND_Y + 40);
  ctx.fill();

  // Cozy Red Barn Silhouette in distance
  ctx.fillStyle = '#991b1b'; // red-800
  ctx.fillRect(40, GROUND_Y - 48, 44, 28);
  ctx.beginPath();
  ctx.moveTo(36, GROUND_Y - 48);
  ctx.lineTo(62, GROUND_Y - 64);
  ctx.lineTo(88, GROUND_Y - 48);
  ctx.closePath();
  ctx.fill();

  // White cross on barn
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.strokeRect(52, GROUND_Y - 38, 20, 18);
  ctx.beginPath();
  ctx.moveTo(52, GROUND_Y - 38);
  ctx.lineTo(72, GROUND_Y - 20);
  ctx.moveTo(72, GROUND_Y - 38);
  ctx.lineTo(52, GROUND_Y - 20);
  ctx.stroke();

  // Silo
  ctx.fillStyle = '#64748b'; // slate-500
  ctx.fillRect(90, GROUND_Y - 58, 16, 38);
  ctx.beginPath();
  ctx.arc(98, GROUND_Y - 58, 8, Math.PI, 0);
  ctx.fill();
}

function drawGrassDetails(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = '#22c55e'; // green-500
  for (let i = 15; i < CANVAS_WIDTH; i += 32) {
    ctx.beginPath();
    ctx.moveTo(i, GROUND_Y);
    ctx.lineTo(i - 4, GROUND_Y - 8);
    ctx.lineTo(i, GROUND_Y - 2);
    ctx.lineTo(i + 4, GROUND_Y - 10);
    ctx.lineTo(i + 2, GROUND_Y);
    ctx.fill();
  }

  // Little daisies
  for (let i = 28; i < CANVAS_WIDTH; i += 75) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(i, GROUND_Y + 6, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(i, GROUND_Y + 6, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawHayCart(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.save();
  ctx.translate(x, y);

  const w = BASE_PLATFORM_WIDTH;
  const h = 38;

  // Golden straw tufts bursting out of the wagon
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  for (let sx = -w / 2 + 8; sx <= w / 2 - 8; sx += 12) {
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx - 4, -8);
    ctx.lineTo(sx, -4);
    ctx.lineTo(sx + 4, -9);
    ctx.lineTo(sx + 2, 0);
  }
  ctx.fill();

  // Wooden Cart Wagon Body
  const woodGrad = ctx.createLinearGradient(0, 0, 0, h);
  woodGrad.addColorStop(0, '#92400e'); // amber-800
  woodGrad.addColorStop(1, '#713f12'); // amber-900
  ctx.fillStyle = woodGrad;
  ctx.beginPath();
  ctx.roundRect(-w / 2, 0, w, h, 6);
  ctx.fill();

  // Wood plank horizontal seams
  ctx.strokeStyle = '#451a03'; // amber-950
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-w / 2, h * 0.35);
  ctx.lineTo(w / 2, h * 0.35);
  ctx.moveTo(-w / 2, h * 0.7);
  ctx.lineTo(w / 2, h * 0.7);
  ctx.stroke();

  // Iron Corner Reinforcements
  ctx.fillStyle = '#475569'; // slate-600
  ctx.fillRect(-w / 2, 0, 8, h);
  ctx.fillRect(w / 2 - 8, 0, 8, h);

  // Border
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 3.5;
  ctx.strokeRect(-w / 2, 0, w, h);

  // Wagon Wheels with Spokes
  const wheelY = h + 2;
  const wheelRadius = 14;
  [-w / 2 + 18, w / 2 - 18].forEach((wx) => {
    // Outer tire
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelRadius, 0, Math.PI * 2);
    ctx.fill();

    // Wood rim
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.arc(wx, wheelY, wheelRadius - 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Steel Hub
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(wx, wheelY, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Wagon Title Banner
  ctx.fillStyle = '#fef3c7'; // amber-100
  ctx.font = '900 11px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🌾 HAY CART 🚜', 0, h / 2);

  ctx.restore();
}

function drawAnimal(ctx: CanvasRenderingContext2D, type: AnimalType) {
  const def = ANIMAL_DEFS[type];
  const w = def.width;
  const h = def.height;

  // Base Rounded Rect Body
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.roundRect(-w / 2, -h / 2, w, h, 18);
  ctx.fill();

  ctx.strokeStyle = def.borderColor;
  ctx.lineWidth = 3.5;
  ctx.stroke();

  // Top Gloss Highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
  ctx.beginPath();
  ctx.roundRect(-w / 2 + 5, -h / 2 + 4, w - 10, h * 0.32, 10);
  ctx.fill();

  // Draw Specific Animal Details
  if (type === 'pig') {
    // Floppy ears
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(-w / 2 + 10, -h / 2 + 6, 8, 0, Math.PI * 2);
    ctx.arc(w / 2 - 10, -h / 2 + 6, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cute snout
    ctx.fillStyle = '#fbcfe8';
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-14, -2, 28, 18, 9);
    ctx.fill();
    ctx.stroke();

    // Nostrils
    ctx.fillStyle = '#be185d';
    ctx.beginPath();
    ctx.arc(-6, 7, 2.5, 0, Math.PI * 2);
    ctx.arc(6, 7, 2.5, 0, Math.PI * 2);
    ctx.fill();

    drawKawaiiEyes(ctx, -18, -9, 18, -9);
    drawBlushingCheeks(ctx, -24, 7, 24, 7, '#f472b6');
  } else if (type === 'chick') {
    // Top feather tuft
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.arc(0, -h / 2 - 4, 6, 0, Math.PI * 2);
    ctx.fill();

    // Tiny orange beak
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-7, 2);
    ctx.lineTo(7, 2);
    ctx.lineTo(0, 11);
    ctx.closePath();
    ctx.fill();

    drawKawaiiEyes(ctx, -16, -7, 16, -7);
    drawBlushingCheeks(ctx, -22, 5, 22, 5, '#fb923c');
  } else if (type === 'sheep') {
    // Fluffy cloud wool scallops around head
    ctx.fillStyle = '#ffffff';
    [-22, 0, 22].forEach((sx) => {
      ctx.beginPath();
      ctx.arc(sx, -h / 2 + 4, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Face oval
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.roundRect(-18, -6, 36, 26, 12);
    ctx.fill();

    // Sheep smile
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 10, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();

    drawKawaiiEyes(ctx, -14, 0, 14, 0);
  } else if (type === 'cat') {
    // Pointy cat ears
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.moveTo(-w / 2 + 6, -h / 2 + 10);
    ctx.lineTo(-w / 2 + 16, -h / 2 - 8);
    ctx.lineTo(-w / 2 + 24, -h / 2 + 10);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(w / 2 - 6, -h / 2 + 10);
    ctx.lineTo(w / 2 - 16, -h / 2 - 8);
    ctx.lineTo(w / 2 - 24, -h / 2 + 10);
    ctx.fill();

    // Tiny pink nose
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(-4, 4);
    ctx.lineTo(4, 4);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#9a3412';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-16, 5);
    ctx.lineTo(-28, 3);
    ctx.moveTo(-16, 8);
    ctx.lineTo(-28, 10);
    ctx.moveTo(16, 5);
    ctx.lineTo(28, 3);
    ctx.moveTo(16, 8);
    ctx.lineTo(28, 10);
    ctx.stroke();

    drawKawaiiEyes(ctx, -16, -8, 16, -8);
    drawBlushingCheeks(ctx, -22, 6, 22, 6, '#f97316');
  } else if (type === 'cow') {
    // Black dairy spots
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-w / 2 + 14, -h / 2 + 14, 12, 0, Math.PI * 2);
    ctx.arc(w / 2 - 12, h / 2 - 12, 10, 0, Math.PI * 2);
    ctx.fill();

    // Yellow Horns
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(-22, -h / 2 + 4);
    ctx.lineTo(-28, -h / 2 - 8);
    ctx.lineTo(-16, -h / 2 + 2);
    ctx.moveTo(22, -h / 2 + 4);
    ctx.lineTo(28, -h / 2 - 8);
    ctx.lineTo(16, -h / 2 + 2);
    ctx.fill();

    // Muzzle
    ctx.fillStyle = '#fbcfe8';
    ctx.strokeStyle = '#db2777';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-20, 2, 40, 22, 11);
    ctx.fill();
    ctx.stroke();

    // Cow smile
    ctx.strokeStyle = '#9d174d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 14, 5, 0.2, Math.PI - 0.2);
    ctx.stroke();

    drawKawaiiEyes(ctx, -18, -10, 18, -10);
  }
}

function drawKawaiiEyes(ctx: CanvasRenderingContext2D, lx: number, ly: number, rx: number, ry: number) {
  [
    { x: lx, y: ly },
    { x: rx, y: ry },
  ].forEach((pos) => {
    // Big dark iris
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // White shine highlights
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(pos.x - 1.5, pos.y - 1.5, 1.8, 0, Math.PI * 2);
    ctx.arc(pos.x + 1.2, pos.y + 1.2, 0.9, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawBlushingCheeks(
  ctx: CanvasRenderingContext2D,
  lx: number,
  ly: number,
  rx: number,
  ry: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.beginPath();
  ctx.arc(lx, ly, 5.5, 0, Math.PI * 2);
  ctx.arc(rx, ry, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawCrane(
  ctx: CanvasRenderingContext2D,
  craneXPercent: number,
  currentAnimal: AnimalType,
  showReadyAnimal: boolean
) {
  const trolleyX = (craneXPercent / 100) * CANVAS_WIDTH;

  // Top Steel Gantry Girder with Hazard Stripes
  ctx.fillStyle = '#334155'; // slate-700
  ctx.fillRect(0, 0, CANVAS_WIDTH, 14);

  // Black and Yellow Chevron Stripes
  ctx.fillStyle = '#eab308'; // yellow-500
  for (let sx = 0; sx < CANVAS_WIDTH; sx += 24) {
    ctx.beginPath();
    ctx.moveTo(sx, 0);
    ctx.lineTo(sx + 12, 0);
    ctx.lineTo(sx, 14);
    ctx.lineTo(sx - 12, 14);
    ctx.closePath();
    ctx.fill();
  }

  // Steel Trolley
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(trolleyX - 16, 8, 32, 14, 4);
  ctx.fill();
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Braided Steel Cable
  const cableLength = 54;
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(trolleyX, 22);
  ctx.lineTo(trolleyX, 22 + cableLength);
  ctx.stroke();

  // Forged Steel Hook
  const hookY = 22 + cableLength;
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(trolleyX, hookY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(trolleyX + 4, hookY + 6, 7, 0.4, Math.PI * 1.4);
  ctx.stroke();

  // Ready Animal Hanging on Hook
  if (showReadyAnimal) {
    const readyAnimalY = hookY + 36;
    ctx.save();
    ctx.translate(trolleyX, readyAnimalY);

    // Subtle breathing/bounce animation
    const bob = Math.sin(Date.now() * 0.006) * 2;
    ctx.translate(0, bob);

    drawAnimal(ctx, currentAnimal);
    ctx.restore();
  }
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outerRadius: number,
  innerRadius: number
) {
  let rot = (Math.PI / 2) * 3;
  let x = cx;
  let y = cy;
  const step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}

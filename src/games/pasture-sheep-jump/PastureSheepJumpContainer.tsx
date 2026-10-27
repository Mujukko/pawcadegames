import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialJumpState,
  updateHorizontalSteering,
  stepJumpPhysics,
  PastureSheepJumpState,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  Platform,
} from './logic/engine';
import { sheepAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Award, Bell } from 'lucide-react';

const HIGH_SCORE_KEY = 'pawcade_sheep_jump_highscore';

interface DustParticle {
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

export const PastureSheepJumpContainer: React.FC = () => {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [hud, setHud] = useState<{
    score: number;
    highScore: number;
    altitude: number;
    bells: number;
    gameOver: boolean;
  }>({
    score: 0,
    highScore,
    altitude: 0,
    bells: 0,
    gameOver: false,
  });

  const [isMuted, setIsMuted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const stateRef = useRef<PastureSheepJumpState>(createInitialJumpState(highScore));
  const reqAnimRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const touchXPercentRef = useRef<number>(50);
  const isTouchingRef = useRef<boolean>(false);
  const dustRef = useRef<DustParticle[]>([]);

  // Steer from pointer (touch/mouse drag)
  const updatePointerSteering = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const percent = Math.max(5, Math.min(95, ((clientX - rect.left) / rect.width) * 100));
    touchXPercentRef.current = percent;
  }, []);

  // Keyboard controls
  useEffect(() => {
    let keyLeft = false;
    let keyRight = false;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyLeft = true;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyRight = true;
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = sheepAudio.toggleMute();
        setIsMuted(muted);
      } else if ((e.key === 'r' || e.key === 'R') && stateRef.current.gameOver) {
        restartGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keyLeft = false;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keyRight = false;
      }
    };

    const keyInterval = setInterval(() => {
      if (keyLeft && !keyRight) {
        touchXPercentRef.current = Math.max(5, touchXPercentRef.current - 4);
      } else if (keyRight && !keyLeft) {
        touchXPercentRef.current = Math.min(95, touchXPercentRef.current + 4);
      }
    }, 16);

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      clearInterval(keyInterval);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const restartGame = useCallback(() => {
    const nextState = createInitialJumpState(highScore);
    stateRef.current = nextState;
    touchXPercentRef.current = 50;
    dustRef.current = [];
    setHud({
      score: 0,
      highScore,
      altitude: 0,
      bells: 0,
      gameOver: false,
    });
  }, [highScore]);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WORLD_WIDTH * dpr;
    canvas.height = WORLD_HEIGHT * dpr;
    ctx.scale(dpr, dpr);

    const renderLoop = (timestamp: number) => {
      if (!active) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      let state = stateRef.current;

      // 1. UPDATE PHYSICS
      if (!state.gameOver) {
        // A. Horizontal steering towards pointer target
        state.player = updateHorizontalSteering(state.player, touchXPercentRef.current, dt);

        // B. Vertical Jump Physics
        const step = stepJumpPhysics(state, dt);
        state = step.state;

        if (step.event === 'bounce') {
          sheepAudio.playBounce();
          spawnBounceDust(state.player.x, state.player.y + 20, '#cbd5e1');
        } else if (step.event === 'superbounce') {
          sheepAudio.playSuperBounce();
          spawnBounceDust(state.player.x, state.player.y + 20, '#facc15');
        } else if (step.event === 'bell') {
          sheepAudio.playBell();
        } else if (step.event === 'milestone') {
          sheepAudio.playMilestone();
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
        } else if (step.event === 'gameover') {
          sheepAudio.playGameOver();
          if (state.score > highScore) {
            setHighScore(state.score);
            if (typeof window !== 'undefined') {
              localStorage.setItem(HIGH_SCORE_KEY, state.score.toString());
            }
          }
        }

        stateRef.current = state;

        // Periodic HUD sync (every ~10 frames or on death/bell)
        if (step.event !== 'none' || Math.random() < 0.15) {
          setHud({
            score: state.score,
            highScore: Math.max(highScore, state.score),
            altitude: Math.floor(state.altitude / 10),
            bells: state.bellsCollected,
            gameOver: state.gameOver,
          });
        }
      }

      // 2. CANVAS RENDERING
      ctx.clearRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // A. Parallax Atmosphere Sky
      const altMeters = Math.floor(state.altitude / 10);
      const skyGrad = ctx.createLinearGradient(0, 0, 0, WORLD_HEIGHT);
      if (altMeters < 100) {
        skyGrad.addColorStop(0, '#38bdf8'); // sky-400
        skyGrad.addColorStop(1, '#bae6fd'); // sky-200
      } else if (altMeters < 350) {
        skyGrad.addColorStop(0, '#0284c7'); // sky-600
        skyGrad.addColorStop(1, '#7dd3fc'); // sky-300
      } else if (altMeters < 700) {
        skyGrad.addColorStop(0, '#ea580c'); // sunset orange
        skyGrad.addColorStop(0.6, '#db2777'); // pink
        skyGrad.addColorStop(1, '#4f46e5'); // purple
      } else {
        skyGrad.addColorStop(0, '#0f172a'); // night space
        skyGrad.addColorStop(0.5, '#1e1b4b'); // indigo-950
        skyGrad.addColorStop(1, '#312e81'); // indigo-900
      }
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, WORLD_WIDTH, WORLD_HEIGHT);

      // Stars in high altitudes
      if (altMeters > 300) {
        const starAlpha = Math.min(1, (altMeters - 300) / 300);
        ctx.fillStyle = `rgba(255, 255, 255, ${starAlpha * 0.75})`;
        for (let i = 0; i < 20; i++) {
          const sx = ((i * 71) % (WORLD_WIDTH - 20)) + 10;
          const sy = ((i * 43) % (WORLD_HEIGHT - 40)) + 20;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Base Grass Pasture (only visible near starting ground)
      if (state.altitude < 500) {
        const groundY = 515 + state.altitude;
        ctx.fillStyle = '#15803d';
        ctx.fillRect(0, groundY, WORLD_WIDTH, 100);
        ctx.fillStyle = '#16a34a';
        ctx.fillRect(0, groundY, WORLD_WIDTH, 8);
      }

      // B. Draw Platforms
      state.platforms.forEach((p) => {
        if (!p.broken) {
          drawPlatform(ctx, p);
        }
      });

      // C. Draw Particles
      dustRef.current.forEach((d, idx) => {
        d.life += dt;
        d.x += d.vx * dt;
        d.y += d.vy * dt;
        d.alpha = Math.max(0, 1 - d.life / d.maxLife);

        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.alpha;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        if (d.life >= d.maxLife) {
          dustRef.current.splice(idx, 1);
        }
      });

      // D. Draw Barnaby the Sheep Player
      drawSheep(ctx, state.player);

      reqAnimRef.current = requestAnimationFrame(renderLoop);
    };

    reqAnimRef.current = requestAnimationFrame(renderLoop);
    return () => {
      active = false;
      cancelAnimationFrame(reqAnimRef.current);
    };
  }, [highScore]);

  const spawnBounceDust = (x: number, y: number, color: string) => {
    for (let i = 0; i < 10; i++) {
      dustRef.current.push({
        x: x + (Math.random() - 0.5) * 30,
        y,
        vx: (Math.random() - 0.5) * 80,
        vy: 20 + Math.random() * 40,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 0.45,
      });
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto h-[560px] sm:h-[620px] max-h-[85vh] select-none bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-800/40 flex flex-col touch-none cursor-pointer"
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        } catch {}
        isTouchingRef.current = true;
        updatePointerSteering(e.clientX);
      }}
      onPointerMove={(e) => {
        if (isTouchingRef.current) {
          updatePointerSteering(e.clientX);
        }
      }}
      onPointerUp={(e) => {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        isTouchingRef.current = false;
      }}
      onPointerCancel={(e) => {
        try {
          (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
        } catch {}
        isTouchingRef.current = false;
      }}
      style={{ touchAction: 'none' }}
    >
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between px-4 py-2.5 bg-slate-900/70 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Altitude</span>
            <span className="text-xl font-black leading-tight drop-shadow">{hud.altitude}m</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Score</span>
            <span className="text-xl font-black leading-tight drop-shadow">{hud.score}</span>
          </div>
        </div>

        {/* Bells & Audio */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/30 text-amber-300 text-xs font-bold">
            <Bell className="w-3.5 h-3.5 fill-amber-300" />
            <span>{hud.bells}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-xs text-amber-300 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>{hud.highScore}</span>
          </div>
          <button
            onPointerDown={(e) => {
              e.stopPropagation();
              const muted = sheepAudio.toggleMute();
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
          Drag Finger or Press <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-[10px]">&larr;</kbd> <kbd className="px-1.5 py-0.5 bg-white/20 rounded font-mono text-[10px]">&rarr;</kbd> to Steer!
        </div>
      )}

      {/* Game Over Modal */}
      {hud.gameOver && (
        <div
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn overflow-y-auto max-h-full"
        >
          <div className="text-5xl mb-2 animate-bounce">🐑💨</div>
          <h2 className="text-2xl font-black text-rose-400 tracking-wide uppercase mb-1">Sheep Plunged!</h2>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            Barnaby leaped to an epic altitude of <strong className="text-amber-300">{hud.altitude}m</strong>!
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-5">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Score</span>
              <span className="text-xl font-black text-amber-400">{hud.score}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Altitude</span>
              <span className="text-xl font-black text-emerald-400">{hud.altitude}m</span>
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
            Leap Again
          </button>
        </div>
      )}
    </div>
  );
};

// ==========================================
// PURE CANVAS 2D DRAWING UTILITIES
// ==========================================

function drawPlatform(ctx: CanvasRenderingContext2D, p: Platform) {
  ctx.save();
  ctx.translate(p.x, p.y);

  if (p.type === 'spring') {
    // Golden spring-loaded hay bale
    ctx.fillStyle = '#eab308'; // yellow-500
    ctx.beginPath();
    ctx.roundRect(0, 0, p.width, p.height, 6);
    ctx.fill();
    ctx.strokeStyle = '#a16207';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Red coil spring on top
    const springX = p.width / 2;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(springX - 10, 0);
    ctx.lineTo(springX + 10, -3);
    ctx.lineTo(springX - 10, -6);
    ctx.lineTo(springX + 10, -9);
    ctx.stroke();

    ctx.fillStyle = '#451a03';
    ctx.font = 'bold 8px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BOING', p.width / 2, 11);
  } else if (p.type === 'moving') {
    // Drifting cloud platform
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(0, 0, p.width, p.height, 8);
    ctx.fill();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Direction arrows
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('☁️ ↔ ☁️', p.width / 2, 11);
  } else if (p.type === 'fragile') {
    // Dry twig bundle
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(0, 0, p.width, p.height, 4);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Crack line in middle
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(p.width / 2, 0);
    ctx.lineTo(p.width / 2 - 4, p.height / 2);
    ctx.lineTo(p.width / 2 + 3, p.height);
    ctx.stroke();
  } else {
    // Standard sturdy wooden plank
    const woodGrad = ctx.createLinearGradient(0, 0, 0, p.height);
    woodGrad.addColorStop(0, '#92400e');
    woodGrad.addColorStop(1, '#713f12');
    ctx.fillStyle = woodGrad;
    ctx.beginPath();
    ctx.roundRect(0, 0, p.width, p.height, 6);
    ctx.fill();
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }

  // Draw Collectible Bell if present
  if (p.hasBell) {
    const bellX = p.width / 2;
    const bellY = -14;
    ctx.fillStyle = '#facc15'; // yellow-400
    ctx.beginPath();
    ctx.arc(bellX, bellY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b45309';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Bell clapper
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(bellX, bellY + 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function drawSheep(ctx: CanvasRenderingContext2D, player: { x: number; y: number; vy: number; facing: 'left' | 'right'; isSuperJumping: boolean }) {
  ctx.save();
  ctx.translate(player.x, player.y);

  if (player.facing === 'left') {
    ctx.scale(-1, 1);
  }

  // Stretch / Squash based on jump velocity
  let sx = 1;
  let sy = 1;
  if (player.vy < -300) {
    sx = 0.9;
    sy = 1.15; // stretched leaping up
  } else if (player.vy > 300) {
    sx = 1.1;
    sy = 0.92; // compressed falling
  }
  ctx.scale(sx, sy);

  // Fluffy White Wool Cloud Body
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(-8, -4, 14, 0, Math.PI * 2);
  ctx.arc(8, -4, 14, 0, Math.PI * 2);
  ctx.arc(0, -12, 14, 0, Math.PI * 2);
  ctx.arc(0, 6, 15, 0, Math.PI * 2);
  ctx.arc(-14, 2, 11, 0, Math.PI * 2);
  ctx.arc(14, 2, 11, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Sheep Face
  ctx.fillStyle = '#fed7aa'; // warm peach face
  ctx.beginPath();
  ctx.roundRect(2, -8, 18, 16, 7);
  ctx.fill();

  // Floppy horizontal ear
  ctx.fillStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.ellipse(-2, -8, 7, 4, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (Sparkly Kawaii)
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(12, -4, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(11, -5, 1, 0, Math.PI * 2);
  ctx.fill();

  // Blushing Cheek
  ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
  ctx.beginPath();
  ctx.arc(9, 2, 3, 0, Math.PI * 2);
  ctx.fill();

  // Little black hooves
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(-10, 16, 5, 8);
  ctx.fillRect(5, 16, 5, 8);

  // Super Jump Rainbow Trail effect
  if (player.isSuperJumping) {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-10, 26);
    ctx.lineTo(-12, 38);
    ctx.moveTo(8, 26);
    ctx.lineTo(10, 38);
    ctx.stroke();
  }

  ctx.restore();
}

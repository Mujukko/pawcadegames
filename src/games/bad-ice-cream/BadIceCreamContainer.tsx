import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initBadIceCreamGame,
  stepBadIceCreamGame,
  TOTAL_ICE_CREAM_LEVELS,
  GRID_COLS,
  GRID_ROWS,
} from './logic/engine';
import { BadIceCreamInput, BadIceCreamState, FruitItem } from './logic/types';
import { badIceCreamAudio } from './systems/sound';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Trophy,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Flame,
  Snowflake,
  Heart,
} from 'lucide-react';

export const BadIceCreamContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<BadIceCreamState>(initBadIceCreamGame(1));
  const inputRef = useRef<BadIceCreamInput>({});
  const lastTouchTimeRef = useRef<number>(0);

  const [hudState, setHudState] = useState({
    levelIndex: 1,
    score: 0,
    lives: 3,
    currentWave: 1,
    status: 'playing',
    isMuted: badIceCreamAudio.isMuted(),
  });

  const [showNextModal, setShowNextModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showGameOverModal, setShowGameOverModal] = useState(false);

  const resetCurrentLevel = useCallback(() => {
    stateRef.current = initBadIceCreamGame(
      stateRef.current.levelIndex,
      stateRef.current.player.score,
      3
    );
    setShowNextModal(false);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
  }, []);

  const advanceNextLevel = useCallback(() => {
    const nextLvl = stateRef.current.levelIndex + 1;
    if (nextLvl <= TOTAL_ICE_CREAM_LEVELS) {
      stateRef.current = initBadIceCreamGame(
        nextLvl,
        stateRef.current.player.score,
        stateRef.current.player.lives
      );
      setShowNextModal(false);
      badIceCreamAudio.playClear();
    }
  }, []);

  const restartEntireGame = useCallback(() => {
    stateRef.current = initBadIceCreamGame(1, 0, 3);
    setShowVictoryModal(false);
    setShowGameOverModal(false);
    setShowNextModal(false);
  }, []);

  const toggleSound = () => {
    const muted = badIceCreamAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.moveY = -1;
        inputRef.current.moveX = 0;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.moveY = 1;
        inputRef.current.moveX = 0;
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.moveX = -1;
        inputRef.current.moveY = 0;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.moveX = 1;
        inputRef.current.moveY = 0;
      } else if (['Space', 'KeyF'].includes(e.code)) {
        e.preventDefault();
        inputRef.current.action = true;
      } else if (e.code === 'KeyR') {
        resetCurrentLevel();
      } else if (e.code === 'KeyM') {
        toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW', 'ArrowDown', 'KeyS'].includes(e.code)) {
        inputRef.current.moveY = 0;
      }
      if (['ArrowLeft', 'KeyA', 'ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.moveX = 0;
      }
      if (['Space', 'KeyF'].includes(e.code)) {
        inputRef.current.action = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetCurrentLevel]);

  // Main game tick & render loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const { state: nextState, event } = stepBadIceCreamGame(
        stateRef.current,
        inputRef.current,
        dt
      );
      stateRef.current = nextState;

      // Consume one-shot action button trigger
      if (inputRef.current.action) {
        inputRef.current.action = false;
      }

      // Sound events
      if (event === 'ice_create') badIceCreamAudio.playIceCreate();
      if (event === 'ice_break') badIceCreamAudio.playIceBreak();
      if (event === 'fruit_eaten') badIceCreamAudio.playFruitEat();
      if (event === 'hit') badIceCreamAudio.playHit();
      if (event === 'clear') {
        badIceCreamAudio.playClear();
        setShowNextModal(true);
      }
      if (event === 'victory') {
        badIceCreamAudio.playVictory();
        setShowVictoryModal(true);
      }
      if (nextState.status === 'game_over' && !showGameOverModal) {
        badIceCreamAudio.playHit();
        setShowGameOverModal(true);
      }

      setHudState({
        levelIndex: nextState.levelIndex,
        score: nextState.player.score,
        lives: nextState.player.lives,
        currentWave: nextState.currentWave,
        status: nextState.status,
        isMuted: badIceCreamAudio.isMuted(),
      });

      // Canvas Rendering
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderIceCreamCanvas(ctx, canvas.width, canvas.height, nextState);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [showGameOverModal]);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Top HUD */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700/60 z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="font-extrabold text-cyan-400 text-sm tracking-wide flex items-center gap-1.5">
            <Snowflake className="w-4 h-4 text-cyan-300 animate-spin-slow" />
            <span>Level {hudState.levelIndex} / {TOTAL_ICE_CREAM_LEVELS}</span>
          </div>
          <div className="text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-800/50">
            Wave {hudState.currentWave} / 2
          </div>
          <div className="text-xs font-extrabold text-slate-200">
            Score: <span className="text-amber-400">{hudState.score}</span>
          </div>
        </div>

        {/* Lives & Controls */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <Heart
                key={i}
                className={`w-4 h-4 ${
                  i < hudState.lives
                    ? 'text-rose-500 fill-rose-500'
                    : 'text-slate-600'
                }`}
              />
            ))}
          </div>

          <button
            onClick={resetCurrentLevel}
            aria-label="Restart Level"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            {hudState.isMuted ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-cyan-400" />
            )}
          </button>
        </div>
      </div>

      {/* Main Game Screen */}
      <div className="relative w-full aspect-[15/11] max-h-[68vh] flex items-center justify-center bg-sky-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={750}
          height={550}
          className="w-full h-full object-contain block"
        />

        {/* Level Cleared Modal */}
        {showNextModal && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2 animate-bounce">🍦</div>
            <h3 className="text-2xl font-black text-cyan-400 mb-1">Level Cleared!</h3>
            <p className="text-sm text-slate-300 mb-4 text-center">
              All frosty fruits collected! The barnyard is freezing fresh!
            </p>
            <button
              onClick={advanceNextLevel}
              className="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              Next Level <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {showVictoryModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-pulse" />
            <h3 className="text-3xl font-black text-amber-400 mb-1">Frosty Master!</h3>
            <p className="text-sm text-slate-200 mb-6 text-center max-w-sm">
              You defeated all 3 barnyard freeze mazes and scored {hudState.score} points!
            </p>
            <button
              onClick={restartEntireGame}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Play Again
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {showGameOverModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2">🦊</div>
            <h3 className="text-2xl font-black text-red-400 mb-1">Barnyard Caught!</h3>
            <p className="text-sm text-slate-300 mb-5 text-center">
              Use your ice breath to build defensive walls and block predators!
            </p>
            <button
              onClick={resetCurrentLevel}
              className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-400 text-white font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Retry Level
            </button>
          </div>
        )}
      </div>

      {/* Mobile Responsive Touch Controls Bar */}
      <div className="w-full py-2.5 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-2">
        {/* Direction D-Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-36 sm:w-44">
          <div />
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.moveY = -1;
              inputRef.current.moveX = 0;
            }}
            onTouchEnd={() => (inputRef.current.moveY = 0)}
            onMouseDown={() => {
              inputRef.current.moveY = -1;
              inputRef.current.moveX = 0;
            }}
            onMouseUp={() => (inputRef.current.moveY = 0)}
            className="h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-cyan-600 flex items-center justify-center text-slate-200"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
          <div />

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.moveX = -1;
              inputRef.current.moveY = 0;
            }}
            onTouchEnd={() => (inputRef.current.moveX = 0)}
            onMouseDown={() => {
              inputRef.current.moveX = -1;
              inputRef.current.moveY = 0;
            }}
            onMouseUp={() => (inputRef.current.moveX = 0)}
            className="h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-cyan-600 flex items-center justify-center text-slate-200"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.moveY = 1;
              inputRef.current.moveX = 0;
            }}
            onTouchEnd={() => (inputRef.current.moveY = 0)}
            onMouseDown={() => {
              inputRef.current.moveY = 1;
              inputRef.current.moveX = 0;
            }}
            onMouseUp={() => (inputRef.current.moveY = 0)}
            className="h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-cyan-600 flex items-center justify-center text-slate-200"
          >
            <ArrowDown className="w-5 h-5" />
          </button>
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.moveX = 1;
              inputRef.current.moveY = 0;
            }}
            onTouchEnd={() => (inputRef.current.moveX = 0)}
            onMouseDown={() => {
              inputRef.current.moveX = 0;
            }}
            onMouseUp={() => (inputRef.current.moveX = 0)}
            className="h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-cyan-600 flex items-center justify-center text-slate-200"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Frost Breath Action Button */}
        <div className="flex flex-col items-center flex-1 max-w-xs pl-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current.action = true;
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              inputRef.current.action = true;
            }}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Snowflake className="w-5 h-5 text-slate-950 animate-pulse" />
            <span>Frost Breath (Space)</span>
          </button>
          <span className="text-[10px] text-slate-400 mt-1 font-medium hidden sm:inline">
            Creates ice walls in empty tiles, breaks ice when facing ice!
          </span>
        </div>
      </div>
    </div>
  );
};

// Canvas 2D Drawing
function renderIceCreamCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: BadIceCreamState
) {
  const cellW = width / GRID_COLS;
  const cellH = height / GRID_ROWS;

  // Background Frost Field
  ctx.fillStyle = '#082f49';
  ctx.fillRect(0, 0, width, height);

  // Checkerboard floor tiles
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? '#0c4a6e' : '#075985';
      ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
    }
  }

  // Draw Grid Tiles (Walls and Ice)
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const tile = state.grid[r][c];
      const x = c * cellW;
      const y = r * cellH;

      if (tile === 'wall') {
        // Wooden / Stone Barn Pillar
        const wallGrad = ctx.createLinearGradient(x, y, x, y + cellH);
        wallGrad.addColorStop(0, '#78350f');
        wallGrad.addColorStop(1, '#451a03');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(x + 2, y + 2, cellW - 4, cellH - 4);

        ctx.strokeStyle = '#b45309';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 3, y + 3, cellW - 6, cellH - 6);

        // Brick lines
        ctx.strokeStyle = '#292524';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 2, y + cellH / 2);
        ctx.lineTo(x + cellW - 2, y + cellH / 2);
        ctx.stroke();
      } else if (tile === 'ice') {
        // Crystalline Ice Block
        const iceGrad = ctx.createLinearGradient(x, y, x + cellW, y + cellH);
        iceGrad.addColorStop(0, '#e0f2fe');
        iceGrad.addColorStop(0.5, '#7dd3fc');
        iceGrad.addColorStop(1, '#0284c7');
        ctx.fillStyle = iceGrad;
        ctx.beginPath();
        ctx.roundRect(x + 3, y + 3, cellW - 6, cellH - 6, 6);
        ctx.fill();

        // Shimmer shine reflection
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.moveTo(x + 6, y + 6);
        ctx.lineTo(x + cellW * 0.45, y + 6);
        ctx.lineTo(x + 6, y + cellH * 0.45);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }

  // Draw Fruits
  for (const fruit of state.fruits) {
    if (fruit.collected || fruit.wave !== state.currentWave) continue;

    const fx = fruit.x * cellW + cellW / 2;
    const fy = fruit.y * cellH + cellH / 2;

    renderFruit(ctx, fx, fy, fruit.type, Math.min(cellW, cellH) * 0.38);
  }

  // Draw Enemies (Foxes / Wolves)
  for (const enemy of state.enemies) {
    const ex = enemy.x * cellW + cellW / 2;
    const ey = enemy.y * cellH + cellH / 2;
    renderEnemy(ctx, ex, ey, enemy.type, enemy.dirX, Math.min(cellW, cellH) * 0.4);
  }

  // Draw Player (Frosty Pig Ice Cream Character)
  const px = state.player.x * cellW + cellW / 2;
  const py = state.player.y * cellH + cellH / 2;
  renderPlayer(ctx, px, py, state.player.facingX, state.player.facingY, Math.min(cellW, cellH) * 0.42);
}

function renderFruit(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: FruitItem['type'],
  radius: number
) {
  ctx.save();
  ctx.translate(x, y);

  if (type === 'strawberry') {
    // Red Berry
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(0, 2, radius, 0, Math.PI * 2);
    ctx.fill();

    // Green leaves
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.moveTo(-radius * 0.6, -radius * 0.7);
    ctx.lineTo(0, -radius);
    ctx.lineTo(radius * 0.6, -radius * 0.7);
    ctx.lineTo(0, -radius * 0.3);
    ctx.closePath();
    ctx.fill();

    // Seeds
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(-radius * 0.3, 0, 2, 2);
    ctx.fillRect(radius * 0.3, 0, 2, 2);
    ctx.fillRect(0, radius * 0.4, 2, 2);
  } else if (type === 'banana') {
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = radius * 0.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.9, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.arc(-radius * 0.7, radius * 0.5, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 'watermelon') {
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#f87171';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.8, 0, Math.PI);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(-radius * 0.3, radius * 0.3, 2, 2);
    ctx.fillRect(radius * 0.3, radius * 0.3, 2, 2);
  } else {
    // Grape cluster
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(-radius * 0.3, -radius * 0.2, radius * 0.45, 0, Math.PI * 2);
    ctx.arc(radius * 0.3, -radius * 0.2, radius * 0.45, 0, Math.PI * 2);
    ctx.arc(0, radius * 0.35, radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#16a34a';
    ctx.fillRect(-2, -radius * 0.8, 4, 6);
  }

  ctx.restore();
}

function renderEnemy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  type: 'fox' | 'wolf',
  dirX: number,
  radius: number
) {
  ctx.save();
  ctx.translate(x, y);
  if (dirX < 0) ctx.scale(-1, 1);

  // Body color
  const bodyColor = type === 'fox' ? '#ea580c' : '#475569';
  const earColor = type === 'fox' ? '#9a3412' : '#1e293b';

  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.beginPath();
  ctx.moveTo(radius * 0.4, -radius * 0.3);
  ctx.lineTo(radius * 1.2, 0);
  ctx.lineTo(radius * 0.4, radius * 0.3);
  ctx.closePath();
  ctx.fill();

  // Nose tip
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(radius * 1.2, 0, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = earColor;
  ctx.beginPath();
  ctx.moveTo(-radius * 0.4, -radius * 0.8);
  ctx.lineTo(-radius * 0.1, -radius * 1.4);
  ctx.lineTo(radius * 0.2, -radius * 0.8);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.arc(radius * 0.2, -radius * 0.2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(radius * 0.3, -radius * 0.2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderPlayer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  facingX: number,
  facingY: number,
  radius: number
) {
  ctx.save();
  ctx.translate(x, y);

  // Frosty Vanilla Ice Cream / Pig body
  const bodyGrad = ctx.createRadialGradient(-2, -3, 2, 0, 0, radius);
  bodyGrad.addColorStop(0, '#ffffff');
  bodyGrad.addColorStop(0.7, '#bae6fd');
  bodyGrad.addColorStop(1, '#38bdf8');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();

  // Winter Earmuffs
  ctx.fillStyle = '#ec4899';
  ctx.beginPath();
  ctx.arc(-radius * 0.9, -2, radius * 0.35, 0, Math.PI * 2);
  ctx.arc(radius * 0.9, -2, radius * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Headband
  ctx.strokeStyle = '#db2777';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -2, radius * 0.9, Math.PI, 0);
  ctx.stroke();

  // Face features based on direction
  const eyeOffsetX = facingX * 3;
  const eyeOffsetY = facingY * 3;

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-radius * 0.3 + eyeOffsetX, -2 + eyeOffsetY, 2.5, 0, Math.PI * 2);
  ctx.arc(radius * 0.3 + eyeOffsetX, -2 + eyeOffsetY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Cute rosy cheeks
  ctx.fillStyle = 'rgba(244, 114, 182, 0.6)';
  ctx.beginPath();
  ctx.arc(-radius * 0.5 + eyeOffsetX, 4 + eyeOffsetY, 2.5, 0, Math.PI * 2);
  ctx.arc(radius * 0.5 + eyeOffsetX, 4 + eyeOffsetY, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Smile / mouth
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(eyeOffsetX, 4 + eyeOffsetY, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  ctx.restore();
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  advanceLevel,
  createInitialState,
  dropKitty,
  moveDropper,
  restartLevel,
  updateGame,
} from './logic/engine';
import { SushiGameState } from './logic/types';
import { sound } from './systems/sound';

interface FloatingText {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  alpha: number;
  vy: number;
}

export const SushiKittyPachinkoContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<SushiGameState>(() => createInitialState(1));
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const stateRef = useRef<SushiGameState>(gameState);
  stateRef.current = gameState;

  const floatingTextsRef = useRef<FloatingText[]>([]);
  const nextTextId = useRef(1);
  const isDraggingDropper = useRef(false);

  // Mute toggle
  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  // Dropper controls
  const handleAimAt = useCallback((clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const canvasX = (clientX - rect.left) * scaleX;
    setGameState((prev) => moveDropper(prev, canvasX));
  }, []);

  const handleDrop = useCallback(() => {
    if (stateRef.current.status === 'aiming' && stateRef.current.dropsRemaining > 0) {
      setGameState((prev) => dropKitty(prev));
    }
  }, []);

  // Pointer / Touch handlers
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    isDraggingDropper.current = true;
    handleAimAt(e.clientX);
  }, [handleAimAt]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingDropper.current) return;
    e.preventDefault();
    handleAimAt(e.clientX);
  }, [handleAimAt]);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingDropper.current) {
      isDraggingDropper.current = false;
      // If clicked near top dropper, trigger drop
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const scaleY = BOARD_HEIGHT / rect.height;
        const canvasY = (e.clientY - rect.top) * scaleY;
        if (canvasY <= 100) {
          handleDrop();
        }
      }
    }
  }, [handleDrop]);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        setGameState((prev) => moveDropper(prev, prev.dropperX - 20));
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        setGameState((prev) => moveDropper(prev, prev.dropperX + 20));
      } else if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleDrop();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDrop]);

  // Main game loop (60 FPS)
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const currentState = stateRef.current;
      const nextState = updateGame(currentState, dt);

      // Handle sound events and floating notifications
      if (nextState.events.length > 0) {
        for (const ev of nextState.events) {
          if (ev.type === 'drop') {
            sound.playDrop();
          } else if (ev.type === 'peg_bounce') {
            sound.playPegBounce(ev.isBumper);
          } else if (ev.type === 'sushi_chomp') {
            sound.playSushiChomp();
            floatingTextsRef.current.push({
              id: nextTextId.current++,
              text: `+${ev.points}`,
              x: ev.x,
              y: ev.y - 10,
              color: '#FBBF24',
              alpha: 1,
              vy: -40,
            });
          } else if (ev.type === 'basket_land') {
            sound.playBasket();
          } else if (ev.type === 'level_clear' || ev.type === 'victory') {
            sound.playVictory();
          } else if (ev.type === 'game_over') {
            sound.playGameOver();
          }
        }
      }

      // Update floating texts
      floatingTextsRef.current = floatingTextsRef.current
        .map((ft) => ({
          ...ft,
          y: ft.y + ft.vy * dt,
          alpha: ft.alpha - dt * 1.5,
        }))
        .filter((ft) => ft.alpha > 0);

      setGameState(nextState);

      // Draw canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, nextState, floatingTextsRef.current);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Drawing Routine
  const drawScene = (ctx: CanvasRenderingContext2D, state: SushiGameState, texts: FloatingText[]) => {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 1. Rich Japanese Lantern Wood Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
    bgGrad.addColorStop(0, '#1E122A');
    bgGrad.addColorStop(0.6, '#2E193C');
    bgGrad.addColorStop(1, '#1A0E22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Subtle decorative grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    for (let x = 20; x < BOARD_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, BOARD_HEIGHT);
      ctx.stroke();
    }

    // 2. Side Walls
    ctx.fillStyle = '#6B4028';
    ctx.fillRect(0, 0, 10, BOARD_HEIGHT);
    ctx.fillRect(BOARD_WIDTH - 10, 0, 10, BOARD_HEIGHT);

    // 3. Pegs
    for (const peg of state.pegs) {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
      if (peg.isBumper) {
        // Glowing Bumper
        ctx.fillStyle = '#F59E0B';
        ctx.shadowColor = '#F59E0B';
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FEF3C7';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Normal wooden peg
        ctx.fillStyle = '#E2B887';
        ctx.fill();
        ctx.strokeStyle = '#8B5A2B';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }

    // 4. Sushi items
    for (const sushi of state.sushi) {
      if (sushi.eaten) continue;
      drawSushi(ctx, sushi);
    }

    // 5. Baskets at the bottom
    ctx.fillStyle = '#3E2215';
    ctx.fillRect(10, state.boardHeight - 55, state.boardWidth - 20, 55);

    for (let i = 0; i < state.baskets.length; i++) {
      const b = state.baskets[i];
      // Basket divider
      ctx.fillStyle = '#B45309';
      ctx.fillRect(b.maxX - 2, b.y, 4, 55);

      // Multiplier slot text
      ctx.fillStyle = b.multiplier >= 3 ? '#FDE047' : b.multiplier === 2 ? '#93C5FD' : '#E2E8F0';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.label, (b.minX + b.maxX) / 2, b.y + 26);
    }

    // 6. Kitty Dropper at top
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.fillRect(20, 38, BOARD_WIDTH - 40, 4);

    // Dropper guide line
    if (state.status === 'aiming') {
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(state.dropperX, 50);
      ctx.lineTo(state.dropperX, 110);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // 7. Draw Kitty
    drawKitty(ctx, state.kitty, state.status === 'falling');

    // 8. Floating Texts
    for (const ft of texts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  };

  // Helper: Draw Sushi
  const drawSushi = (ctx: CanvasRenderingContext2D, sushi: SushiGameState['sushi'][0]) => {
    ctx.save();
    ctx.translate(sushi.x, sushi.y);

    if (sushi.type === 'nigiri') {
      // White rice oval
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, 3, 11, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      // Salmon strip on top
      ctx.fillStyle = '#FA8072';
      ctx.beginPath();
      ctx.ellipse(0, -1, 13, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      // Nori belt
      ctx.fillStyle = '#1A2E1A';
      ctx.fillRect(-3, -7, 6, 14);
    } else if (sushi.type === 'maki') {
      // Dark green seaweed circle
      ctx.fillStyle = '#152515';
      ctx.beginPath();
      ctx.arc(0, 0, sushi.radius, 0, Math.PI * 2);
      ctx.fill();
      // White rice ring
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, 0, sushi.radius - 2.5, 0, Math.PI * 2);
      ctx.fill();
      // Salmon center core
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(0, 0, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (sushi.type === 'sashimi') {
      // Rich ruby tuna slice
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.ellipse(0, 0, 13, 8, -Math.PI / 8, 0, Math.PI * 2);
      ctx.fill();
      // Marbled streaks
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-7, -4);
      ctx.lineTo(7, 4);
      ctx.stroke();
    } else if (sushi.type === 'golden') {
      // Sparkling Golden Egg Roll
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 12;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(0, 0, sushi.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(0, 0, sushi.radius - 3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  };

  // Helper: Draw Chubby Kitty
  const drawKitty = (ctx: CanvasRenderingContext2D, kitty: SushiGameState['kitty'], isFalling: boolean) => {
    ctx.save();
    ctx.translate(kitty.x, kitty.y);

    const r = kitty.radius;

    // Cat Body
    ctx.fillStyle = '#FFF8EB';
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Calico orange patch on left side
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.25, r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    // Calico dark brown patch on right side
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.arc(r * 0.45, -r * 0.3, r * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Kitty Ears
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(-r * 0.65, -r * 0.6);
    ctx.lineTo(-r * 0.35, -r * 1.25);
    ctx.lineTo(-r * 0.05, -r * 0.7);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.moveTo(r * 0.05, -r * 0.7);
    ctx.lineTo(r * 0.35, -r * 1.25);
    ctx.lineTo(r * 0.65, -r * 0.6);
    ctx.closePath();
    ctx.fill();

    // Ear Inner Pink
    ctx.fillStyle = '#F472B6';
    ctx.beginPath();
    ctx.moveTo(-r * 0.55, -r * 0.65);
    ctx.lineTo(-r * 0.35, -r * 1.05);
    ctx.lineTo(-r * 0.15, -r * 0.72);
    ctx.closePath();
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#1E1B4B';
    if (isFalling) {
      // Big round excited eyes
      ctx.beginPath();
      ctx.arc(-r * 0.3, -r * 0.05, r * 0.16, 0, Math.PI * 2);
      ctx.arc(r * 0.3, -r * 0.05, r * 0.16, 0, Math.PI * 2);
      ctx.fill();

      // Eye sparkle
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-r * 0.26, -r * 0.09, r * 0.06, 0, Math.PI * 2);
      ctx.arc(r * 0.34, -r * 0.09, r * 0.06, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Happy curved closed eyes
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#1E1B4B';
      ctx.beginPath();
      ctx.arc(-r * 0.3, 0, r * 0.15, Math.PI, 0, false);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r * 0.3, 0, r * 0.15, Math.PI, 0, false);
      ctx.stroke();
    }

    // Pink Nose & Mouth
    ctx.fillStyle = '#FB7185';
    ctx.beginPath();
    ctx.ellipse(0, r * 0.15, r * 0.1, r * 0.07, 0, 0, Math.PI * 2);
    ctx.fill();

    // Whiskers
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-r * 0.4, r * 0.15);
    ctx.lineTo(-r * 0.95, r * 0.05);
    ctx.moveTo(-r * 0.4, r * 0.25);
    ctx.lineTo(-r * 0.95, r * 0.3);
    ctx.moveTo(r * 0.4, r * 0.15);
    ctx.lineTo(r * 0.95, r * 0.05);
    ctx.moveTo(r * 0.4, r * 0.25);
    ctx.lineTo(r * 0.95, r * 0.3);
    ctx.stroke();

    ctx.restore();
  };

  const handleNextLevel = () => {
    setGameState((prev) => advanceLevel(prev));
  };

  const handleRestart = () => {
    setGameState((prev) => restartLevel(prev));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] max-h-[85vh] bg-[#120A19] text-white select-none touch-none overflow-hidden rounded-2xl shadow-2xl p-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top Header Controls & Belly Fullness Gauge */}
      <div className="w-full max-w-[400px] flex items-center justify-between px-3 py-1.5 bg-[#231533] border border-amber-500/20 rounded-xl mb-1.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-400">Lv.{gameState.level}</span>
          <span className="text-slate-300">Score: <strong className="text-white">{gameState.score}</strong></span>
        </div>

        {/* Belly Fullness Bar */}
        <div className="flex items-center gap-1.5 flex-1 max-w-[150px] mx-2">
          <span className="text-[10px] text-amber-200">Belly:</span>
          <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-150 ${
                gameState.fullness >= gameState.targetFullness ? 'bg-gradient-to-r from-emerald-500 to-green-400' : 'bg-gradient-to-r from-amber-500 to-orange-400'
              }`}
              style={{ width: `${Math.min(100, gameState.fullness)}%` }}
            />
            {/* Target line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm"
              style={{ left: `${gameState.targetFullness}%` }}
              title={`Target: ${gameState.targetFullness}%`}
            />
          </div>
          <span className="text-[10px] text-slate-300 font-mono">{gameState.fullness}%</span>
        </div>

        {/* Drops & Mute */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5" title="Drops Remaining">
            {Array.from({ length: gameState.totalDrops }).map((_, i) => (
              <span
                key={i}
                className={`text-sm ${i < gameState.dropsRemaining ? 'text-amber-400' : 'text-slate-600'}`}
              >
                🐾
              </span>
            ))}
          </div>
          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-[400px] aspect-[400/600] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          className="w-full h-full rounded-xl border border-amber-500/30 shadow-inner cursor-pointer"
        />

        {/* Drop Button for Mobile Touch Access */}
        {gameState.status === 'aiming' && gameState.dropsRemaining > 0 && (
          <button
            onClick={handleDrop}
            className="absolute bottom-20 px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white font-extrabold text-sm rounded-full shadow-lg border border-amber-300/40 animate-bounce"
          >
            DROP KITTY! 🍣
          </button>
        )}

        {/* Round End Modal */}
        {gameState.status === 'round_end' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-amber-400 mb-1">STAGE CLEARED! 🍣</h2>
            <p className="text-slate-300 text-xs mb-3">
              Kitty is delightfully stuffed! Target {gameState.targetFullness}% achieved.
            </p>
            <div className="text-lg font-bold text-white mb-4">
              Round Score: <span className="text-amber-300">{gameState.score}</span>
            </div>
            <button
              onClick={handleNextLevel}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Next Level 🐾
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-amber-400 mb-1">CHAMPION FEAST! 🏆</h2>
            <p className="text-slate-300 text-xs mb-3">
              You cleared all 3 sushi banquet stages and fed the kitty to supreme satisfaction!
            </p>
            <div className="text-xl font-bold text-white mb-4">
              Final Score: <span className="text-amber-300">{gameState.score}</span>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Play Again 🍣
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-red-400 mb-1">OUT OF DROPS! 😿</h2>
            <p className="text-slate-300 text-xs mb-3">
              Kitty only reached {gameState.fullness}% of the {gameState.targetFullness}% goal.
            </p>
            <div className="text-lg font-bold text-white mb-4">
              Score: <span className="text-amber-300">{gameState.score}</span>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Try Again 🔄
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint Footer */}
      <div className="text-[11px] text-slate-400 text-center mt-1">
        Drag top slider to aim. Release or tap DROP to bounce kitty through sushi!
      </div>
    </div>
  );
};
export default SushiKittyPachinkoContainer;

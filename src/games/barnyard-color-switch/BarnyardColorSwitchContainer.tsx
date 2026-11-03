import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ColorSwitchState, COLOR_HEX, SWITCH_COLORS } from './logic/types';
import {
  createColorSwitchGame,
  jumpColorPlayer,
  updateColorSwitchGame,
} from './logic/engine';
import { colorSwitchSound } from './systems/sound';

interface BarnyardColorSwitchProps {
  onBack?: () => void;
}

const VIEWPORT_WIDTH = 400;
const VIEWPORT_HEIGHT = 650;

export const BarnyardColorSwitchContainer: React.FC<BarnyardColorSwitchProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<ColorSwitchState>(() => {
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('pawcade_colorswitch_high');
        if (saved) high = parseInt(saved, 10) || 0;
      } catch {}
    }
    return createColorSwitchGame(high);
  });

  const [isMuted, setIsMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<ColorSwitchState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewGame = useCallback(() => {
    const next = createColorSwitchGame(stateRef.current.highScore);
    stateRef.current = next;
    setGameState(next);
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      colorSwitchSound.setMuted(next);
      return next;
    });
  }, []);

  const handleTap = useCallback(() => {
    if (stateRef.current.status === 'game_over') {
      startNewGame();
    } else {
      stateRef.current = jumpColorPlayer(stateRef.current);
      setGameState(stateRef.current);
    }
  }, [startNewGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        handleTap();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTap]);

  // Main 60 FPS animation & render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    lastTimeRef.current = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      const prevState = stateRef.current;
      const nextState = updateColorSwitchGame(prevState, dt);
      stateRef.current = nextState;

      // Trigger Web Audio
      for (const ev of nextState.events) {
        if (ev.type === 'jump') colorSwitchSound.playJump();
        else if (ev.type === 'star') colorSwitchSound.playStar();
        else if (ev.type === 'switch') colorSwitchSound.playSwitch();
        else if (ev.type === 'crash') colorSwitchSound.playCrash();
      }

      // Persist high score
      if (nextState.highScore > prevState.highScore && typeof window !== 'undefined') {
        try {
          localStorage.setItem('pawcade_colorswitch_high', nextState.highScore.toString());
        } catch {}
      }

      // Sync React state if game status changed or 4 times per second
      if (
        nextState.status !== prevState.status ||
        Math.floor(time / 250) !== Math.floor((time - dt * 1000) / 250)
      ) {
        setGameState(nextState);
      }

      renderGame(ctx, nextState, canvas.width, canvas.height);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderGame = (
    ctx: CanvasRenderingContext2D,
    st: ColorSwitchState,
    width: number,
    height: number
  ) => {
    const scale = Math.min(width / VIEWPORT_WIDTH, height / VIEWPORT_HEIGHT);
    const offsetX = (width - VIEWPORT_WIDTH * scale) * 0.5;
    const offsetY = (height - VIEWPORT_HEIGHT * scale) * 0.5;

    ctx.save();
    // Night sky barnyard background
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, width, height);

    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Decorative ambient barn stars
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    for (let i = 0; i < 20; i++) {
      const sx = ((i * 73 + 17) % VIEWPORT_WIDTH);
      const sy = VIEWPORT_HEIGHT - ((i * 91 - st.cameraY * 0.2) % VIEWPORT_HEIGHT);
      ctx.fillRect(sx, sy, 2, 2);
    }

    const toScreenY = (wY: number) => VIEWPORT_HEIGHT - (wY - st.cameraY);
    const centerX = VIEWPORT_WIDTH * 0.5;

    // Render Obstacles
    for (const obs of st.obstacles) {
      const sy = toScreenY(obs.y);
      if (sy < -120 || sy > VIEWPORT_HEIGHT + 120) continue;

      ctx.save();
      ctx.translate(centerX, sy);
      ctx.rotate(obs.rotation);

      if (obs.type === 'circle') {
        const segAngle = Math.PI * 0.5;
        const thickness = 14;

        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = COLOR_HEX[SWITCH_COLORS[i]];
          ctx.lineWidth = thickness;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.arc(0, 0, obs.radius, i * segAngle, (i + 1) * segAngle - 0.05);
          ctx.stroke();
        }
      } else if (obs.type === 'cross') {
        const armLength = obs.radius;
        const thickness = 14;

        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = COLOR_HEX[SWITCH_COLORS[i]];
          ctx.lineWidth = thickness;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(0, 0);
          const angle = (i * Math.PI) / 2;
          ctx.lineTo(Math.cos(angle) * armLength, Math.sin(angle) * armLength);
          ctx.stroke();
        }
      }

      ctx.restore();
    }

    // Render Stars
    for (const star of st.stars) {
      if (star.collected) continue;
      const sy = toScreenY(star.y);
      if (sy < -40 || sy > VIEWPORT_HEIGHT + 40) continue;

      ctx.save();
      ctx.translate(centerX, sy);
      ctx.fillStyle = '#fef08a';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      // Draw 5-pointed star
      for (let s = 0; s < 5; s++) {
        const rOuter = 12;
        const rInner = 5;
        const aOuter = (s * Math.PI * 2) / 5 - Math.PI / 2;
        const aInner = aOuter + Math.PI / 5;
        if (s === 0) ctx.moveTo(Math.cos(aOuter) * rOuter, Math.sin(aOuter) * rOuter);
        else ctx.lineTo(Math.cos(aOuter) * rOuter, Math.sin(aOuter) * rOuter);
        ctx.lineTo(Math.cos(aInner) * rInner, Math.sin(aInner) * rInner);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Render Color Switcher Orbs
    for (const sw of st.switchers) {
      if (sw.collected) continue;
      const sy = toScreenY(sw.y);
      if (sy < -40 || sy > VIEWPORT_HEIGHT + 40) continue;

      ctx.save();
      ctx.translate(centerX, sy);
      // 4 colored quadrant orb
      const orbRadius = 14;
      const seg = Math.PI * 0.5;
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = COLOR_HEX[SWITCH_COLORS[i]];
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, orbRadius, i * seg, (i + 1) * seg);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }

    // Render Player Ball
    const playerScreenY = toScreenY(st.player.y);
    ctx.save();
    ctx.translate(centerX, playerScreenY);

    const ballColorHex = COLOR_HEX[st.player.color];

    // Glow
    ctx.shadowColor = ballColorHex;
    ctx.shadowBlur = 14;

    // Body
    ctx.fillStyle = ballColorHex;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.fill();

    // Cute face
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-3, -3, 3, 0, Math.PI * 2);
    ctx.arc(3, -3, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(-2, -3, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -3, 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  };

  return (
    <div
      onClick={handleTap}
      className="relative w-full h-full flex flex-col items-center justify-between bg-slate-950 select-none overflow-hidden touch-none cursor-pointer"
    >
      {/* Top HUD */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white z-10 bg-slate-900/80 backdrop-blur-sm border-b border-slate-800"
      >
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded text-slate-200 transition"
            >
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400">Stars</div>
            <div className="text-xl font-black text-white leading-none">{gameState.score}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-400">Best</div>
            <div className="text-sm font-bold text-white leading-none">{gameState.highScore}</div>
          </div>
          <button
            onClick={toggleSound}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 text-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2">
        <canvas
          ref={canvasRef}
          width={VIEWPORT_WIDTH}
          height={VIEWPORT_HEIGHT}
          className="w-full h-full object-contain rounded-2xl shadow-2xl border-4 border-slate-800 bg-slate-900"
        />

        {/* Ready Prompt */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur-md px-6 py-4 rounded-2xl border border-slate-700 text-center animate-bounce">
              <div className="text-3xl mb-1">👆</div>
              <div className="text-base font-bold text-amber-400">Tap to Jump!</div>
              <div className="text-xs text-slate-300">Match the obstacle colors to pass</div>
            </div>
          </div>
        )}

        {/* Game Over Modal Overlay */}
        {gameState.status === 'game_over' && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white rounded-2xl z-20"
          >
            <div className="text-4xl mb-2">💥</div>
            <h2 className="text-2xl font-black text-rose-500 mb-1">Color Mismatch!</h2>
            <p className="text-sm text-slate-300 mb-4">Pass only through matching colors!</p>
            <div className="bg-slate-900/90 rounded-xl p-4 w-full max-w-xs mb-5 border border-slate-800 text-center">
              <div className="text-xs uppercase text-slate-400 font-bold mb-1">Stars Collected</div>
              <div className="text-3xl font-black text-amber-400">{gameState.score}</div>
              {gameState.score >= gameState.highScore && gameState.score > 0 && (
                <div className="text-xs text-emerald-400 font-semibold mt-1">✨ New High Score!</div>
              )}
            </div>
            <button
              onClick={startNewGame}
              className="w-full max-w-xs py-3 px-6 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 font-bold text-white text-base rounded-xl shadow-lg transition active:scale-95"
            >
              Play Again (Space)
            </button>
          </div>
        )}
      </div>

      {/* Tap Hint Bottom Bar */}
      <div className="w-full max-w-md py-3 text-center text-xs font-semibold text-slate-400 bg-slate-900/80 border-t border-slate-800">
        Tap screen or press Space to jump
      </div>
    </div>
  );
};

export default BarnyardColorSwitchContainer;

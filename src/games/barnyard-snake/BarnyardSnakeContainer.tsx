import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Direction, SnakeGameState } from './logic/types';
import { createSnakeGame, queueDirection, updateSnakeGame } from './logic/engine';
import { snakeSound } from './systems/sound';

interface BarnyardSnakeProps {
  onBack?: () => void;
}

const CELL = 24;
const HIGH_KEY = 'pawcade_snake_high';

function readHigh(): number {
  try {
    return parseInt(localStorage.getItem(HIGH_KEY) || '0', 10) || 0;
  } catch {
    return 0;
  }
}

export const BarnyardSnakeContainer: React.FC<BarnyardSnakeProps> = ({ onBack }) => {
  const [hud, setHud] = useState<SnakeGameState>(() => createSnakeGame(readHigh()));
  const [muted, setMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SnakeGameState>(hud);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const restart = useCallback(() => {
    const next = createSnakeGame(stateRef.current.highScore);
    stateRef.current = next;
    setHud(next);
  }, []);

  const steer = useCallback((dir: Direction) => {
    stateRef.current = queueDirection(stateRef.current, dir);
  }, []);

  const toggleSound = () =>
    setMuted((m) => {
      snakeSound.setMuted(!m);
      return !m;
    });

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = {
        ArrowUp: 'up', w: 'up', W: 'up',
        ArrowDown: 'down', s: 'down', S: 'down',
        ArrowLeft: 'left', a: 'left', A: 'left',
        ArrowRight: 'right', d: 'right', D: 'right',
      };
      if (map[e.key]) {
        e.preventDefault();
        steer(map[e.key]);
      } else if ((e.key === ' ' || e.key === 'Enter') && stateRef.current.status === 'game_over') {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steer, restart]);

  // Swipe steering (instant: fires as soon as the finger moves 14px)
  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = swipeRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 14) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };
  const onPointerUp = () => {
    swipeRef.current = null;
  };

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    let raf = 0;
    let last = performance.now();
    let lastHud = 0;

    const loop = (time: number) => {
      const dt = (time - last) / 1000;
      last = time;
      const prev = stateRef.current;
      const next = updateSnakeGame(prev, dt);
      stateRef.current = next;

      for (const ev of next.events) {
        if (ev.type === 'eat') snakeSound.playEat();
        else if (ev.type === 'golden') snakeSound.playGolden();
        else if (ev.type === 'rock') snakeSound.playRock();
        else if (ev.type === 'die') snakeSound.playDie();
      }
      if (next.highScore > prev.highScore) {
        try {
          localStorage.setItem(HIGH_KEY, String(next.highScore));
        } catch {
          /* storage optional */
        }
      }
      if (next.status !== prev.status || next.score !== prev.score || time - lastHud > 250) {
        lastHud = time;
        setHud(next);
      }
      draw(ctx, next, time);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const pad = (dir: Direction, label: string, aria: string) => (
    <button
      type="button"
      aria-label={aria}
      onPointerDown={(e) => {
        e.preventDefault();
        steer(dir);
      }}
      className="w-14 h-12 rounded-xl bg-emerald-700 active:bg-emerald-500 text-white text-xl font-bold shadow select-none touch-none"
    >
      {label}
    </button>
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 select-none overflow-hidden touch-none overscroll-none">
      <div className="w-full max-w-md px-4 py-2 flex items-center justify-between text-white bg-emerald-900/90 border-b border-emerald-800">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="px-2.5 py-1 text-xs font-semibold bg-emerald-800 rounded">
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-300">Score</div>
            <div className="text-xl font-black leading-none">{hud.score}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-300">Best</div>
            <div className="text-sm font-bold leading-none">{hud.highScore}</div>
          </div>
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-11 h-11 rounded-lg bg-emerald-800 text-sm"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={15 * CELL}
          height={19 * CELL}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="max-w-full max-h-full object-contain rounded-2xl border-4 border-emerald-800 shadow-2xl touch-none"
        />
        {hud.status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="bg-emerald-950/85 px-5 py-3 rounded-2xl border border-emerald-700 text-center">
              <div className="text-3xl">🐛</div>
              <div className="font-bold text-amber-300">Swipe or press an arrow to start</div>
              <div className="text-xs text-emerald-100">Eat apples, dodge rocks and your own tail</div>
            </div>
          </div>
        )}
        {hud.status === 'game_over' && (
          <div className="absolute inset-0 bg-emerald-950/85 flex flex-col items-center justify-center p-6 text-white rounded-2xl">
            <div className="text-4xl mb-1">🪨</div>
            <h2 className="text-2xl font-black text-amber-300">
              {hud.deathReason === 'self' ? 'Tied in a knot!' : hud.deathReason === 'rock' ? 'Bonked a rock!' : 'Hit the fence!'}
            </h2>
            <p className="text-sm text-emerald-100 mb-3">{hud.applesEaten} apples eaten</p>
            <div className="bg-emerald-900 rounded-xl px-6 py-3 mb-4 text-center">
              <div className="text-xs uppercase text-emerald-300 font-bold">Score</div>
              <div className="text-3xl font-black text-amber-300">{hud.score}</div>
              {hud.score > 0 && hud.score >= hud.highScore && (
                <div className="text-xs text-emerald-300 font-semibold">New best!</div>
              )}
            </div>
            <button
              onClick={restart}
              className="w-full max-w-xs py-3 rounded-xl bg-amber-500 hover:bg-amber-600 font-bold text-white active:scale-95"
            >
              Play Again (Space)
            </button>
          </div>
        )}
      </div>

      <div className="w-full max-w-md px-4 py-2 flex flex-col items-center gap-1 bg-emerald-900/90 border-t border-emerald-800">
        {pad('up', '▲', 'Up')}
        <div className="flex gap-3">
          {pad('left', '◀', 'Left')}
          {pad('down', '▼', 'Down')}
          {pad('right', '▶', 'Right')}
        </div>
      </div>
    </div>
  );
};

function draw(ctx: CanvasRenderingContext2D, st: SnakeGameState, time: number) {
  const W = st.cols * CELL;
  const H = st.rows * CELL;

  // Checkerboard lawn
  for (let y = 0; y < st.rows; y++) {
    for (let x = 0; x < st.cols; x++) {
      ctx.fillStyle = (x + y) % 2 === 0 ? '#86efac' : '#4ade80';
      ctx.fillRect(x * CELL, y * CELL, CELL, CELL);
    }
  }

  // Rocks
  for (const o of st.obstacles) {
    ctx.fillStyle = '#78716c';
    ctx.beginPath();
    ctx.roundRect(o.x * CELL + 2, o.y * CELL + 3, CELL - 4, CELL - 5, 7);
    ctx.fill();
    ctx.fillStyle = '#a8a29e';
    ctx.fillRect(o.x * CELL + 6, o.y * CELL + 6, 7, 3);
  }

  // Apple
  const pulse = 1 + Math.sin(time / 180) * 0.06;
  const drawFruit = (x: number, y: number, body: string, shine = '#fff') => {
    ctx.save();
    ctx.translate(x * CELL + CELL / 2, y * CELL + CELL / 2);
    ctx.scale(pulse, pulse);
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 1, CELL * 0.38, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#166534';
    ctx.fillRect(-1, -CELL * 0.45, 2, 6);
    ctx.fillStyle = shine;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(-4, -3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
  drawFruit(st.apple.x, st.apple.y, '#ef4444');
  if (st.golden) {
    // Blink when about to vanish
    if (st.golden.ticksLeft > 10 || Math.floor(time / 120) % 2 === 0) {
      drawFruit(st.golden.x, st.golden.y, '#facc15', '#fffbeb');
    }
  }

  // Worm
  for (let i = st.snake.length - 1; i >= 0; i--) {
    const s = st.snake[i];
    const t = i / Math.max(1, st.snake.length - 1);
    ctx.fillStyle = i === 0 ? '#facc15' : `hsl(${95 + t * 25} 65% ${38 + t * 8}%)`;
    ctx.beginPath();
    ctx.roundRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2, i === 0 ? 9 : 7);
    ctx.fill();
  }
  const h = st.snake[0];
  const eyeOffset: Record<string, [number, number, number, number]> = {
    right: [15, 7, 15, 16],
    left: [8, 7, 8, 16],
    up: [7, 8, 16, 8],
    down: [7, 15, 16, 15],
  };
  const e = eyeOffset[st.dir];
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(h.x * CELL + e[0], h.y * CELL + e[1], 2.6, 0, Math.PI * 2);
  ctx.arc(h.x * CELL + e[2], h.y * CELL + e[3], 2.6, 0, Math.PI * 2);
  ctx.fill();

  if (st.status === 'game_over') {
    ctx.fillStyle = 'rgba(220,38,38,0.18)';
    ctx.fillRect(0, 0, W, H);
  }
}

export default BarnyardSnakeContainer;

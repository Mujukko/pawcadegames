import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Direction, PaperGameState } from './logic/types';
import { computeOwnerPercent, createPaperGame, idxOf, steerPaperPlayer, updatePaperGame } from './logic/engine';
import { paperSound } from './systems/sound';

interface PasturePaperIOProps {
  onBack?: () => void;
}

const BEST_KEY = 'pawcade_paper_io_best';
const CANVAS_W = 400;
const CANVAS_H = 440;
const CELL_PX = 24;

const OWNER_COLORS: Record<number, { fill: string; border: string }> = {
  0: { fill: '#22c55e', border: '#15803d' },
  1: { fill: '#f97316', border: '#c2410c' },
  2: { fill: '#ec4899', border: '#be185d' },
  3: { fill: '#eab308', border: '#a16207' },
  4: { fill: '#3b82f6', border: '#1d4ed8' },
};

function readBest(): number {
  try {
    return parseFloat(localStorage.getItem(BEST_KEY) || '0') || 0;
  } catch {
    return 0;
  }
}

export const PasturePaperIOContainer: React.FC<PasturePaperIOProps> = ({ onBack }) => {
  const [hud, setHud] = useState<PaperGameState>(() => createPaperGame(readBest()));
  const [muted, setMuted] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PaperGameState>(hud);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const restart = useCallback(() => {
    const next = createPaperGame(stateRef.current.bestPercent);
    stateRef.current = next;
    setBanner(null);
    setHud(next);
  }, []);

  const steer = useCallback((dir: Direction) => {
    const next = steerPaperPlayer(stateRef.current, dir);
    stateRef.current = next;
    if (next.status !== hud.status) {
      setHud(next);
    }
  }, [hud.status]);

  const toggleSound = () =>
    setMuted((m) => {
      paperSound.setMuted(!m);
      return !m;
    });

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
        steer(map[e.key]!);
      } else if ((e.key === ' ' || e.key === 'Enter' || e.key === 'r' || e.key === 'R') &&
        (stateRef.current.status === 'game_over' || stateRef.current.status === 'victory')) {
        e.preventDefault();
        restart();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [steer, restart]);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    swipeRef.current = { x: e.clientX, y: e.clientY };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const s = swipeRef.current;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 12) return;
    steer(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up');
    swipeRef.current = { x: e.clientX, y: e.clientY };
  };

  const onPointerUp = () => {
    swipeRef.current = null;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    let raf = 0;
    let last = performance.now();
    let lastHud = 0;

    const loop = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      const prev = stateRef.current;
      const next = updatePaperGame(prev, dt);
      stateRef.current = next;

      for (const ev of next.events) {
        if (ev.type === 'claim') {
          paperSound.playClaim(ev.cellsGained);
          if (ev.cellsGained >= 10) {
            setBanner(`+${ev.cellsGained} Turf Claimed!`);
          }
        } else if (ev.type === 'kill') {
          paperSound.playKill();
          setBanner(`Cut ${ev.victimName}'s trail! +250`);
        } else if (ev.type === 'die') {
          paperSound.playDie();
        } else if (ev.type === 'victory') {
          paperSound.playVictory();
        }
      }

      if (next.bestPercent > prev.bestPercent) {
        try {
          localStorage.setItem(BEST_KEY, String(next.bestPercent));
        } catch {
          /* ignore */
        }
      }

      if (next.status !== prev.status || now - lastHud > 200) {
        lastHud = now;
        setHud(next);
      }

      drawArena(ctx, next);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!banner) return;
    const t = setTimeout(() => setBanner(null), 1300);
    return () => clearTimeout(t);
  }, [banner]);

  const padBtn = (dir: Direction, icon: string, label: string) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        steer(dir);
      }}
      className="w-14 h-11 rounded-xl bg-emerald-800 active:bg-emerald-600 text-white text-lg font-black shadow border border-emerald-600/50 select-none touch-none"
    >
      {icon}
    </button>
  );

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-emerald-950 select-none overflow-hidden touch-none overscroll-none">
      {/* Top HUD */}
      <div className="w-full max-w-md px-3 py-2 flex items-center justify-between text-white bg-emerald-900/95 border-b border-emerald-800">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button onClick={onBack} className="px-2.5 py-1 text-xs font-bold bg-emerald-800 rounded-lg">
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-lime-300">Pasture Owned</div>
            <div className="text-lg font-black leading-none">{hud.playerPercent.toFixed(1)}%</div>
          </div>
          <div className="pl-2 border-l border-emerald-700">
            <div className="text-[10px] uppercase font-bold text-amber-300">Score</div>
            <div className="text-sm font-black leading-none">{hud.score}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-300">Best Turf</div>
            <div className="text-sm font-bold leading-none">{hud.bestPercent.toFixed(1)}%</div>
          </div>
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-10 h-10 rounded-lg bg-emerald-800 text-sm flex items-center justify-center"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Arena Canvas */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          className="max-w-full max-h-full object-contain rounded-2xl border-4 border-emerald-800 shadow-2xl touch-none"
        />

        {banner && hud.status === 'playing' && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-emerald-950 font-black text-xs px-3 py-1 rounded-full shadow-lg pointer-events-none">
            {banner}
          </div>
        )}

        {hud.status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-emerald-950/90 px-5 py-4 rounded-2xl border-2 border-lime-400/60 text-center shadow-xl max-w-xs">
              <div className="text-3xl mb-1">🐑🟩</div>
              <div className="font-black text-lime-300 text-base">Swipe or Press Arrow to Claim Turf!</div>
              <div className="text-xs text-emerald-100 mt-1">
                Loop outside your green grass and return home to capture territory. Cut rival ribbons!
              </div>
            </div>
          </div>
        )}

        {(hud.status === 'game_over' || hud.status === 'victory') && (
          <div className="absolute inset-0 bg-emerald-950/90 flex flex-col items-center justify-center p-5 text-white rounded-2xl overflow-y-auto max-h-[90vh]">
            <div className="text-4xl mb-1">{hud.status === 'victory' ? '👑🐑' : '💥'}</div>
            <h2 className="text-2xl font-black text-lime-300 text-center">
              {hud.status === 'victory'
                ? 'Meadow Conquered!'
                : hud.deathReason === 'rival'
                ? `${hud.killerName || 'A rival'} cut your trail!`
                : hud.deathReason === 'self'
                ? 'Crossed your own ribbon!'
                : 'Hit the pasture fence!'}
            </h2>
            <p className="text-xs text-emerald-200 mt-1 mb-3">
              Peak Territory: <span className="font-bold text-white">{hud.playerPercent.toFixed(1)}%</span> • Rivals Cut:{' '}
              <span className="font-bold text-amber-300">{hud.agents[0]?.kills ?? 0}</span>
            </p>
            <div className="bg-emerald-900 border border-emerald-700 rounded-xl px-6 py-2.5 mb-4 text-center">
              <div className="text-[10px] uppercase text-emerald-300 font-bold">Final Score</div>
              <div className="text-3xl font-black text-amber-300">{hud.score}</div>
            </div>
            <button
              type="button"
              onClick={restart}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 active:scale-95 text-emerald-950 font-black text-base shadow-lg"
            >
              Play Again
            </button>
          </div>
        )}
      </div>

      {/* Compact Mobile Touch D-Pad */}
      <div className="w-full max-w-md px-4 pb-2 pt-0.5 flex items-center justify-center gap-2 sm:hidden">
        {padBtn('left', '◀', 'Turn Left')}
        <div className="flex flex-col gap-1.5">
          {padBtn('up', '▲', 'Turn Up')}
          {padBtn('down', '▼', 'Turn Down')}
        </div>
        {padBtn('right', '▶', 'Turn Right')}
      </div>
    </div>
  );
};

function drawArena(ctx: CanvasRenderingContext2D, state: PaperGameState) {
  const size = state.gridSize;
  const player = state.agents[0]!;
  const interp = state.status === 'playing' ? state.tickProgress : 1;

  const px = player.prevX + (player.x - player.prevX) * interp;
  const py = player.prevY + (player.y - player.prevY) * interp;

  const worldPx = size * CELL_PX;
  let camX = (px + 0.5) * CELL_PX - CANVAS_W / 2;
  let camY = (py + 0.5) * CELL_PX - CANVAS_H / 2;
  camX = Math.max(-24, Math.min(worldPx - CANVAS_W + 24, camX));
  camY = Math.max(-24, Math.min(worldPx - CANVAS_H + 24, camY));

  // Outer void soil
  ctx.fillStyle = '#052e16';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.translate(-camX, -camY);

  // Checkerboard clover meadow
  for (let y = 0; y < size; y++) {
    const drawY = y * CELL_PX;
    if (drawY + CELL_PX < camY || drawY > camY + CANVAS_H) continue;
    for (let x = 0; x < size; x++) {
      const drawX = x * CELL_PX;
      if (drawX + CELL_PX < camX || drawX > camX + CANVAS_W) continue;

      const owner = state.grid[idxOf(x, y, size)]!;
      if (owner === -1) {
        ctx.fillStyle = (x + y) % 2 === 0 ? '#ecfccb' : '#d9f99d';
        ctx.fillRect(drawX, drawY, CELL_PX, CELL_PX);
      } else {
        const pal = OWNER_COLORS[owner] || OWNER_COLORS[0]!;
        ctx.fillStyle = pal.fill;
        ctx.fillRect(drawX, drawY, CELL_PX, CELL_PX);
        ctx.fillStyle = pal.border;
        ctx.fillRect(drawX, drawY + CELL_PX - 3, CELL_PX, 3);
      }
    }
  }

  // Wooden fence boundary
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 5;
  ctx.strokeRect(-2, -2, worldPx + 4, worldPx + 4);

  // Active ribbons (trails)
  for (const ag of state.agents) {
    if (!ag.alive || ag.trail.length === 0) continue;
    ctx.fillStyle = ag.trailColor;
    for (const c of ag.trail) {
      ctx.globalAlpha = 0.78;
      ctx.fillRect(c.x * CELL_PX + 3, c.y * CELL_PX + 3, CELL_PX - 6, CELL_PX - 6);
    }
    ctx.globalAlpha = 1;
  }

  // Agents
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const ag of state.agents) {
    if (!ag.alive) continue;
    const ax = (ag.prevX + (ag.x - ag.prevX) * interp + 0.5) * CELL_PX;
    const ay = (ag.prevY + (ag.y - ag.prevY) * interp + 0.5) * CELL_PX;

    ctx.fillStyle = ag.color;
    ctx.beginPath();
    ctx.arc(ax, ay, CELL_PX * 0.56, 0, Math.PI * 2);
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    ctx.font = '15px sans-serif';
    ctx.fillText(ag.emoji, ax, ay + 1);

    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#052e16';
    ctx.fillText(ag.name, ax, ay - 18);
  }

  ctx.restore();

  // Live Mini-Leaderboard (top-left overlay)
  const standings = state.agents
    .filter((a) => a.alive || a.id === 0)
    .map((a) => ({
      name: a.name,
      emoji: a.emoji,
      color: a.color,
      pct: computeOwnerPercent(state.grid, a.id),
    }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 4);

  ctx.fillStyle = 'rgba(5, 46, 22, 0.78)';
  ctx.fillRect(8, 8, 122, 14 + standings.length * 16);
  ctx.font = 'bold 10px sans-serif';
  ctx.textBaseline = 'middle';
  standings.forEach((s, idx) => {
    const ry = 19 + idx * 16;
    ctx.fillStyle = s.color;
    ctx.fillRect(13, ry - 4, 8, 8);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`${idx === 0 ? '👑' : `${idx + 1}.`} ${s.name}`, 25, ry);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#bef264';
    ctx.fillText(`${s.pct.toFixed(0)}%`, 125, ry);
  });

  // Mini-map (top-right overlay)
  const mapSize = 64;
  const mx = CANVAS_W - mapSize - 8;
  const my = 8;
  ctx.fillStyle = 'rgba(5, 46, 22, 0.82)';
  ctx.fillRect(mx - 2, my - 2, mapSize + 4, mapSize + 4);
  const scale = mapSize / size;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const owner = state.grid[idxOf(x, y, size)]!;
      if (owner >= 0) {
        ctx.fillStyle = OWNER_COLORS[owner]?.fill || '#22c55e';
        ctx.fillRect(mx + x * scale, my + y * scale, Math.ceil(scale), Math.ceil(scale));
      }
    }
  }
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mx + px * scale - 1.5, my + py * scale - 1.5, 4, 4);
}

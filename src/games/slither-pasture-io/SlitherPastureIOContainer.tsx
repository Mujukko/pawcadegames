import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SlitherGameState } from './logic/types';
import {
  MIN_BOOST_MASS,
  createSlitherGame,
  nudgeSlitherAngle,
  setSlitherInput,
  updateSlitherGame,
  wormDisplayLength,
  wormRadius,
} from './logic/engine';
import { slitherSound } from './systems/sound';

interface SlitherPastureIOProps {
  onBack?: () => void;
}

const BEST_KEY = 'pawcade_slither_best';
const CANVAS_W = 420;
const CANVAS_H = 460;

function readBest(): number {
  try {
    return parseInt(localStorage.getItem(BEST_KEY) || '40', 10) || 40;
  } catch {
    return 40;
  }
}

export const SlitherPastureIOContainer: React.FC<SlitherPastureIOProps> = ({ onBack }) => {
  const [hud, setHud] = useState<SlitherGameState>(() => createSlitherGame(readBest()));
  const [muted, setMuted] = useState(false);
  const [killBanner, setKillBanner] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<SlitherGameState>(hud);
  const keysRef = useRef<{ left: boolean; right: boolean; boost: boolean }>({
    left: false,
    right: false,
    boost: false,
  });

  const restart = useCallback(() => {
    const next = createSlitherGame(stateRef.current.bestLength);
    stateRef.current = next;
    setKillBanner(null);
    setHud(next);
  }, []);

  const toggleSound = () =>
    setMuted((m) => {
      slitherSound.setMuted(!m);
      return !m;
    });

  const setBoost = useCallback((on: boolean) => {
    keysRef.current.boost = on;
    stateRef.current = setSlitherInput(stateRef.current, null, on);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        keysRef.current.left = true;
        if (stateRef.current.status === 'ready') {
          stateRef.current = setSlitherInput(stateRef.current, Math.PI);
          setHud(stateRef.current);
        }
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        keysRef.current.right = true;
        if (stateRef.current.status === 'ready') {
          stateRef.current = setSlitherInput(stateRef.current, 0);
          setHud(stateRef.current);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        stateRef.current = setSlitherInput(stateRef.current, -Math.PI / 2);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        stateRef.current = setSlitherInput(stateRef.current, Math.PI / 2);
      } else if (e.key === ' ' || e.key === 'Shift') {
        e.preventDefault();
        if (stateRef.current.status === 'game_over') {
          restart();
        } else {
          setBoost(true);
        }
      } else if (e.key === 'Enter' && stateRef.current.status === 'game_over') {
        e.preventDefault();
        restart();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keysRef.current.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keysRef.current.right = false;
      if (e.key === ' ' || e.key === 'Shift') setBoost(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [restart, setBoost]);

  const steerTowardPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    if (dx * dx + dy * dy < 9) return;
    const angle = Math.atan2(dy, dx);
    const next = setSlitherInput(stateRef.current, angle);
    const statusChanged = next.status !== stateRef.current.status;
    stateRef.current = next;
    if (statusChanged) setHud(next);
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

      if (keysRef.current.left) {
        stateRef.current = nudgeSlitherAngle(stateRef.current, -3.8 * Math.min(dt, 0.05));
      }
      if (keysRef.current.right) {
        stateRef.current = nudgeSlitherAngle(stateRef.current, 3.8 * Math.min(dt, 0.05));
      }

      const prev = stateRef.current;
      const next = updateSlitherGame(prev, dt);
      stateRef.current = next;

      let ateThisFrame = false;
      for (const ev of next.events) {
        if (ev.type === 'eat' && !ateThisFrame) {
          ateThisFrame = true;
          slitherSound.playEat(ev.jumbo);
        } else if (ev.type === 'kill') {
          slitherSound.playKill();
          setKillBanner(`Cut off ${ev.victimName}! Gobble the orbs!`);
        } else if (ev.type === 'die') {
          slitherSound.playDie();
        }
      }

      if (next.bestLength > prev.bestLength) {
        try {
          localStorage.setItem(BEST_KEY, String(next.bestLength));
        } catch {
          /* ignore */
        }
      }

      if (next.status !== prev.status || now - lastHud > 180) {
        lastHud = now;
        setHud(next);
      }

      drawSlitherWorld(ctx, next, now);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (!killBanner) return;
    const t = setTimeout(() => setKillBanner(null), 1500);
    return () => clearTimeout(t);
  }, [killBanner]);

  const player = hud.worms[0]!;
  const curLen = wormDisplayLength(player.mass);
  const canBoost = player.mass > MIN_BOOST_MASS;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-slate-950 select-none overflow-hidden touch-none overscroll-none">
      {/* Top HUD */}
      <div className="w-full max-w-md px-3 py-2 flex items-center justify-between text-white bg-slate-900/95 border-b border-emerald-900/60">
        <div className="flex items-center gap-2.5">
          {onBack && (
            <button onClick={onBack} className="px-2.5 py-1 text-xs font-bold bg-slate-800 rounded-lg">
              Exit
            </button>
          )}
          <div>
            <div className="text-[10px] uppercase font-bold text-lime-400">Length</div>
            <div className="text-lg font-black leading-none">{curLen}</div>
          </div>
          <div className="pl-2 border-l border-slate-700">
            <div className="text-[10px] uppercase font-bold text-amber-300">Cutoffs</div>
            <div className="text-sm font-black leading-none">{player.kills}</div>
          </div>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-emerald-300">Best</div>
            <div className="text-sm font-bold leading-none">{hud.bestLength}</div>
          </div>
          <button
            onClick={toggleSound}
            aria-label={muted ? 'Unmute' : 'Mute'}
            className="w-10 h-10 rounded-lg bg-slate-800 text-sm flex items-center justify-center"
          >
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Arena */}
      <div className="relative flex-1 w-full max-w-md flex items-center justify-center p-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            steerTowardPointer(e);
          }}
          onPointerMove={(e) => {
            if (e.buttons > 0 || e.pointerType === 'mouse') {
              steerTowardPointer(e);
            }
          }}
          className="max-w-full max-h-full object-contain rounded-2xl border-4 border-emerald-900 shadow-2xl touch-none cursor-crosshair"
        />

        {killBanner && hud.status === 'playing' && (
          <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full shadow-lg pointer-events-none">
            {killBanner}
          </div>
        )}

        {hud.status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-slate-950/90 px-5 py-4 rounded-2xl border-2 border-lime-400/60 text-center shadow-xl max-w-xs">
              <div className="text-3xl mb-1">🐛✨</div>
              <div className="font-black text-lime-300 text-base">Touch or Move Mouse to Slither!</div>
              <div className="text-xs text-slate-200 mt-1">
                Eat glowing nectar orbs to grow giant. Hold Boost to cut in front of rival worms!
              </div>
            </div>
          </div>
        )}

        {hud.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-5 text-white rounded-2xl overflow-y-auto max-h-[90vh]">
            <div className="text-4xl mb-1">💫</div>
            <h2 className="text-2xl font-black text-lime-300 text-center">
              {hud.deathReason === 'wall'
                ? 'Hit the glowing orchard fence!'
                : `Bumped into ${hud.killerName || 'a rival worm'}!`}
            </h2>
            <p className="text-xs text-slate-300 mt-1 mb-3">
              Rivals Cut Off: <span className="font-bold text-amber-300">{player.kills}</span> • Best Length:{' '}
              <span className="font-bold text-white">{hud.bestLength}</span>
            </p>
            <div className="bg-slate-900 border border-emerald-800 rounded-xl px-6 py-2.5 mb-4 text-center">
              <div className="text-[10px] uppercase text-emerald-300 font-bold">Final Length</div>
              <div className="text-3xl font-black text-amber-300">{curLen}</div>
            </div>
            <button
              type="button"
              onClick={restart}
              className="px-6 py-3 rounded-xl bg-lime-400 hover:bg-lime-300 active:scale-95 text-slate-950 font-black text-base shadow-lg"
            >
              Slither Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Boost Action Bar */}
      <div className="w-full max-w-md px-4 pb-2.5 pt-0.5 flex items-center justify-between gap-3">
        <div className="text-[11px] text-slate-400 hidden sm:block">
          Mouse / Arrows to steer • Hold <span className="text-lime-300 font-bold">Space</span> to boost
        </div>
        <button
          type="button"
          disabled={!canBoost}
          onPointerDown={(e) => {
            e.preventDefault();
            setBoost(true);
          }}
          onPointerUp={() => setBoost(false)}
          onPointerCancel={() => setBoost(false)}
          onPointerLeave={() => setBoost(false)}
          className={`w-full sm:w-44 h-11 rounded-xl font-black text-sm shadow-lg select-none touch-none transition ${
            canBoost
              ? 'bg-amber-400 active:bg-amber-300 text-slate-950'
              : 'bg-slate-800 text-slate-500'
          }`}
        >
          ⚡ HOLD BOOST {canBoost ? '' : '(Need 45+)'}
        </button>
      </div>
    </div>
  );
};

function drawSlitherWorld(ctx: CanvasRenderingContext2D, state: SlitherGameState, now: number) {
  const player = state.worms[0]!;
  const head = player.segments[0]!;
  const camX = head.x - CANVAS_W / 2;
  const camY = head.y - CANVAS_H / 2;

  // Deep twilight pasture background
  ctx.fillStyle = '#071912';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.translate(-camX, -camY);

  // Subtle hex/grid dots inside world
  const step = 48;
  const startX = Math.floor(camX / step) * step;
  const startY = Math.floor(camY / step) * step;
  ctx.fillStyle = '#113325';
  for (let y = startY; y < camY + CANVAS_H + step; y += step) {
    for (let x = startX; x < camX + CANVAS_W + step; x += step) {
      if (x * x + y * y < state.worldRadius * state.worldRadius) {
        ctx.beginPath();
        ctx.arc(x, y, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Glowing circular arena fence
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(0, 0, state.worldRadius, 0, Math.PI * 2);
  ctx.stroke();

  // Glowing nectar orbs
  const pulse = 1 + Math.sin(now * 0.006) * 0.14;
  for (const o of state.orbs) {
    if (o.x < camX - 20 || o.x > camX + CANVAS_W + 20 || o.y < camY - 20 || o.y > camY + CANVAS_H + 20) {
      continue;
    }
    ctx.fillStyle = o.color;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius * 1.9 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(o.x, o.y, o.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Worms (tail -> head so head renders cleanly on top)
  for (const w of state.worms) {
    if (!w.alive) continue;
    const r = wormRadius(w.mass);

    if (w.boosting && w.mass > MIN_BOOST_MASS) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.35)';
      ctx.lineWidth = r * 2.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      w.segments.forEach((seg, idx) => {
        if (idx === 0) ctx.moveTo(seg.x, seg.y);
        else ctx.lineTo(seg.x, seg.y);
      });
      ctx.stroke();
    }

    for (let i = w.segments.length - 1; i >= 0; i--) {
      const seg = w.segments[i]!;
      if (seg.x < camX - 30 || seg.x > camX + CANVAS_W + 30 || seg.y < camY - 30 || seg.y > camY + CANVAS_H + 30) {
        continue;
      }
      ctx.fillStyle = w.colors[i % 2]!;
      ctx.beginPath();
      ctx.arc(seg.x, seg.y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // Cute worm eyes on head
    const wh = w.segments[0]!;
    const eyeOff = r * 0.45;
    const perpX = -Math.sin(w.angle) * eyeOff;
    const perpY = Math.cos(w.angle) * eyeOff;
    const fwdX = Math.cos(w.angle) * (r * 0.35);
    const fwdY = Math.sin(w.angle) * (r * 0.35);

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(wh.x + fwdX + perpX, wh.y + fwdY + perpY, r * 0.34, 0, Math.PI * 2);
    ctx.arc(wh.x + fwdX - perpX, wh.y + fwdY - perpY, r * 0.34, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(wh.x + fwdX * 1.35 + perpX, wh.y + fwdY * 1.35 + perpY, r * 0.18, 0, Math.PI * 2);
    ctx.arc(wh.x + fwdX * 1.35 - perpX, wh.y + fwdY * 1.35 - perpY, r * 0.18, 0, Math.PI * 2);
    ctx.fill();

    // Name tag
    ctx.font = 'bold 10px sans-serif';
    ctx.fillStyle = '#e2e8f0';
    ctx.textAlign = 'center';
    ctx.fillText(w.name, wh.x, wh.y - r - 7);
  }

  ctx.restore();

  // Top-left Live Leaderboard
  const topWorms = state.worms
    .filter((w) => w.alive)
    .map((w) => ({ id: w.id, name: w.name, len: wormDisplayLength(w.mass), color: w.colors[0] }))
    .sort((a, b) => b.len - a.len)
    .slice(0, 5);

  ctx.fillStyle = 'rgba(2, 6, 23, 0.72)';
  ctx.fillRect(8, 8, 124, 12 + topWorms.length * 15);
  ctx.font = 'bold 10px sans-serif';
  ctx.textBaseline = 'middle';
  topWorms.forEach((tw, i) => {
    const ry = 18 + i * 15;
    ctx.fillStyle = tw.color;
    ctx.beginPath();
    ctx.arc(16, ry, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = tw.id === 0 ? '#bef264' : '#f8fafc';
    ctx.textAlign = 'left';
    ctx.fillText(`${i + 1}. ${tw.name}`, 24, ry);
    ctx.textAlign = 'right';
    ctx.fillText(`${tw.len}`, 126, ry);
  });

  // Top-right Radar Minimap
  const radarR = 28;
  const rx = CANVAS_W - radarR - 10;
  const ry = radarR + 10;
  ctx.fillStyle = 'rgba(2, 6, 23, 0.78)';
  ctx.beginPath();
  ctx.arc(rx, ry, radarR + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  for (const w of state.worms) {
    if (!w.alive) continue;
    const wh = w.segments[0]!;
    const mx = rx + (wh.x / state.worldRadius) * radarR;
    const my = ry + (wh.y / state.worldRadius) * radarR;
    ctx.fillStyle = w.id === 0 ? '#bef264' : '#f87171';
    ctx.beginPath();
    ctx.arc(mx, my, w.id === 0 ? 3 : 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

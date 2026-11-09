import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DashGameState } from './logic/types';
import {
  CEILING_Y,
  CUBE_SIZE,
  DASH_STAGES,
  createDashGame,
  setDashInput,
  updateDashGame,
} from './logic/engine';
import { dashSound } from './systems/sound';

interface BarnyardGeometryDashProps {
  onBack?: () => void;
}

const BEST_KEY = 'pawcade_geo_dash_best';
const CANVAS_W = 460;
const CANVAS_H = 340;
const FLOOR_SCREEN_Y = 282;

function readBest(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(BEST_KEY) || '[0,0,0]');
    if (Array.isArray(parsed) && parsed.length === 3) {
      return parsed.map((n) => Number(n) || 0);
    }
  } catch {
    /* ignore */
  }
  return [0, 0, 0];
}

export const BarnyardGeometryDashContainer: React.FC<BarnyardGeometryDashProps> = ({ onBack }) => {
  const [hud, setHud] = useState<DashGameState>(() => createDashGame(0, readBest(), 1));
  const [muted, setMuted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<DashGameState>(hud);

  const selectStage = useCallback((idx: number) => {
    const next = createDashGame(idx, stateRef.current.bestProgress, 1);
    stateRef.current = next;
    setHud(next);
  }, []);

  const restartStage = useCallback(() => {
    const next = createDashGame(
      stateRef.current.stageIndex,
      stateRef.current.bestProgress,
      stateRef.current.attempt + 1
    );
    stateRef.current = next;
    setHud(next);
  }, []);

  const pressDown = useCallback(() => {
    const next = setDashInput(stateRef.current, true);
    const changed = next.status !== stateRef.current.status;
    stateRef.current = next;
    if (changed) setHud(next);
  }, []);

  const pressUp = useCallback(() => {
    stateRef.current = setDashInput(stateRef.current, false);
  }, []);

  const toggleSound = () =>
    setMuted((m) => {
      dashSound.setMuted(!m);
      return !m;
    });

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        e.preventDefault();
        if (stateRef.current.status === 'complete') {
          restartStage();
        } else {
          pressDown();
        }
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        restartStage();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        pressUp();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [pressDown, pressUp, restartStage]);

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
      const next = updateDashGame(prev, dt);
      stateRef.current = next;

      for (const ev of next.events) {
        if (ev.type === 'beat') dashSound.playBeat(ev.step);
        else if (ev.type === 'jump') dashSound.playJump();
        else if (ev.type === 'pad') dashSound.playPad();
        else if (ev.type === 'orb') dashSound.playOrb();
        else if (ev.type === 'portal') dashSound.playPortal();
        else if (ev.type === 'coin') dashSound.playCoin();
        else if (ev.type === 'crash') dashSound.playCrash();
        else if (ev.type === 'complete') dashSound.playComplete();
      }

      if (next.bestProgress.some((v, idx) => v > (prev.bestProgress[idx] || 0))) {
        try {
          localStorage.setItem(BEST_KEY, JSON.stringify(next.bestProgress));
        } catch {
          /* ignore */
        }
      }

      if (
        next.status !== prev.status ||
        next.attempt !== prev.attempt ||
        next.mode !== prev.mode ||
        now - lastHud > 150
      ) {
        lastHud = now;
        setHud(next);
      }

      drawDashScene(ctx, next, now);
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const stageBest = hud.bestProgress[hud.stageIndex] || 0;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between bg-slate-950 select-none overflow-hidden touch-none overscroll-none">
      {/* Top Bar + Stage Selector */}
      <div className="w-full max-w-lg px-3 py-2 flex items-center justify-between text-white bg-slate-900/95 border-b border-slate-800">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="px-2.5 py-1 text-xs font-bold bg-slate-800 rounded-lg">
              Exit
            </button>
          )}
          <div className="flex items-center gap-1">
            {DASH_STAGES.map((st, idx) => (
              <button
                key={st.id}
                type="button"
                onClick={() => selectStage(idx)}
                className={`px-2 py-1 rounded-lg text-[11px] font-black transition ${
                  hud.stageIndex === idx
                    ? 'bg-lime-400 text-slate-950'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {idx + 1}★ {st.name.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-lime-300">Best</div>
            <div className="text-sm font-black leading-none">{stageBest}%</div>
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

      {/* Progress Bar */}
      <div className="w-full max-w-lg px-4 pt-2 flex items-center gap-2 text-xs text-white">
        <span className="font-black text-amber-300 text-[11px] uppercase">
          {hud.mode === 'ship' ? '🚀 Ship' : '🟧 Cube'}
        </span>
        <div className="flex-1 h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-lime-400 to-cyan-400 transition-all duration-100"
            style={{ width: `${hud.progress}%` }}
          />
        </div>
        <span className="font-black w-10 text-right">{hud.progress}%</span>
      </div>

      {/* Canvas Arena */}
      <div className="relative flex-1 w-full max-w-lg flex items-center justify-center p-2 min-h-0">
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          onPointerDown={(e) => {
            e.preventDefault();
            e.currentTarget.setPointerCapture(e.pointerId);
            pressDown();
          }}
          onPointerUp={pressUp}
          onPointerCancel={pressUp}
          className="max-w-full max-h-full object-contain rounded-2xl border-4 border-slate-800 shadow-2xl touch-none cursor-pointer"
        />

        {hud.status === 'ready' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
            <div className="bg-slate-950/90 px-5 py-3.5 rounded-2xl border-2 border-lime-400/70 text-center shadow-xl max-w-xs">
              <div className="text-3xl mb-1">⚡🐥🎵</div>
              <div className="font-black text-lime-300 text-base">Tap, Hold, or Press Space!</div>
              <div className="text-xs text-slate-200 mt-1">
                Hold to chain cube jumps over spikes. Hold in Ship portals to fly!
              </div>
            </div>
          </div>
        )}

        {hud.status === 'complete' && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-5 text-white rounded-2xl overflow-y-auto max-h-[90vh]">
            <div className="text-4xl mb-1">🏆🎵</div>
            <h2 className="text-2xl font-black text-lime-300">{hud.stageName} Cleared!</h2>
            <p className="text-xs text-slate-300 mt-1 mb-3">
              Attempts: <span className="font-bold text-white">{hud.attempt}</span> • Star Coins:{' '}
              <span className="font-bold text-amber-300">{hud.coinsCollected} / 3</span>
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={restartStage}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-sm"
              >
                Replay
              </button>
              {hud.stageIndex < DASH_STAGES.length - 1 && (
                <button
                  type="button"
                  onClick={() => selectStage(hud.stageIndex + 1)}
                  className="px-5 py-2.5 rounded-xl bg-lime-400 hover:bg-lime-300 text-slate-950 font-black text-sm shadow-lg"
                >
                  Next Course ▶
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Big One-Thumb Mobile Jump/Fly Bar */}
      <div className="w-full max-w-lg px-4 pb-2.5 pt-0.5 flex items-center justify-center">
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            pressDown();
          }}
          onPointerUp={pressUp}
          onPointerCancel={pressUp}
          onPointerLeave={pressUp}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-lime-400 to-emerald-400 active:scale-[0.99] text-slate-950 font-black text-base shadow-lg select-none touch-none"
        >
          {hud.mode === 'ship' ? '🚀 HOLD TO FLY UP' : '⚡ TAP / HOLD TO JUMP'}
        </button>
      </div>
    </div>
  );
};

function drawDashScene(ctx: CanvasRenderingContext2D, state: DashGameState, now: number) {
  const stage = DASH_STAGES[state.stageIndex]!;
  const camX = state.x - 95;

  // Neon gradient sky
  const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  grad.addColorStop(0, stage.bgTop);
  grad.addColorStop(1, stage.bgBottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Scrolling geometric background pillars
  const parallax = (state.x * 0.3) % 120;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  for (let i = -1; i < 6; i++) {
    const bx = i * 120 - parallax;
    ctx.fillRect(bx, 40, 56, FLOOR_SCREEN_Y - 40);
  }

  // Ship mode ceiling rafters
  if (state.mode === 'ship') {
    const ceilScreenY = FLOOR_SCREEN_Y - CEILING_Y;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(0, 0, CANVAS_W, ceilScreenY);
    ctx.strokeStyle = stage.accent;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, ceilScreenY);
    ctx.lineTo(CANVAS_W, ceilScreenY);
    ctx.stroke();
  }

  // Ground floor + neon grid line
  ctx.fillStyle = '#020617';
  ctx.fillRect(0, FLOOR_SCREEN_Y, CANVAS_W, CANVAS_H - FLOOR_SCREEN_Y);
  ctx.strokeStyle = stage.accent;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_SCREEN_Y);
  ctx.lineTo(CANVAS_W, FLOOR_SCREEN_Y);
  ctx.stroke();

  // Attempt text in world
  ctx.font = '900 18px sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  ctx.textAlign = 'left';
  ctx.fillText(`ATTEMPT ${state.attempt}`, Math.max(18, 120 - camX), 76);

  // Props
  for (const p of state.props) {
    const sx = p.x - camX;
    if (sx + p.w < -30 || sx > CANVAS_W + 30) continue;
    const sy = FLOOR_SCREEN_Y - p.y - p.h;

    if (p.kind === 'spike') {
      ctx.fillStyle = '#f43f5e';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + p.w / 2, sy);
      ctx.lineTo(sx + p.w, sy + p.h);
      ctx.lineTo(sx, sy + p.h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (p.kind === 'block') {
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(sx, sy, p.w, p.h);
      ctx.strokeStyle = stage.accent;
      ctx.lineWidth = 2.5;
      ctx.strokeRect(sx + 1, sy + 1, p.w - 2, p.h - 2);
    } else if (p.kind === 'pad') {
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sx + p.w / 2, FLOOR_SCREEN_Y - p.y, p.w / 2, Math.PI, 0);
      ctx.fill();
    } else if (p.kind === 'orb' && !p.used) {
      const pulse = 1 + Math.sin(now * 0.01) * 0.12;
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(sx + p.w / 2, sy + p.h / 2, (p.w / 2) * pulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(sx + p.w / 2, sy + p.h / 2, p.w * 0.28, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'portal_ship' || p.kind === 'portal_cube') {
      ctx.strokeStyle = p.kind === 'portal_ship' ? '#f472b6' : '#4ade80';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.ellipse(sx + p.w / 2, sy + p.h / 2, p.w / 2, p.h / 2, 0, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.kind === 'speed_fast') {
      ctx.fillStyle = '#fb923c';
      ctx.font = '900 22px sans-serif';
      ctx.fillText('⚡»', sx, sy + p.h / 2);
    } else if (p.kind === 'coin' && !p.used) {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(sx + p.w / 2, sy + p.h / 2, p.w / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }

  // Finish beam
  const finishSx = stage.length - camX;
  if (finishSx < CANVAS_W + 40) {
    ctx.fillStyle = 'rgba(132, 204, 22, 0.35)';
    ctx.fillRect(finishSx, 0, 28, FLOOR_SCREEN_Y);
  }

  // Player Chick Cube / Barn Rocket Ship
  const px = state.x - camX + CUBE_SIZE / 2;
  const py = FLOOR_SCREEN_Y - state.y - CUBE_SIZE / 2;

  if (state.status === 'crashed') {
    // Crash burst rings
    const r = (0.55 - state.crashTimer) * 95;
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, py, Math.max(4, r), 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  ctx.save();
  ctx.translate(px, py);
  ctx.rotate((state.rotation * Math.PI) / 180);

  if (state.mode === 'ship') {
    // Barn glider ship + cube rider
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(18, 4);
    ctx.lineTo(-16, 14);
    ctx.lineTo(-12, -4);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#facc15';
  ctx.fillRect(-CUBE_SIZE / 2, -CUBE_SIZE / 2, CUBE_SIZE, CUBE_SIZE);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.strokeRect(-CUBE_SIZE / 2 + 1, -CUBE_SIZE / 2 + 1, CUBE_SIZE - 2, CUBE_SIZE - 2);

  // Cute neon chick cube face
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(-9, -7, 6, 6);
  ctx.fillRect(4, -7, 6, 6);
  ctx.fillStyle = '#f97316';
  ctx.fillRect(-4, 2, 9, 5);

  ctx.restore();
}

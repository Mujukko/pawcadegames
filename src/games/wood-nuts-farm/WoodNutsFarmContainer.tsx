import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createInitialState, handleHoleClick, updatePhysics, WOOD_LEVELS } from './logic/engine';
import { WoodNutsState } from './logic/types';
import { woodSound } from './systems/sound';
import { analytics } from '../../lib/analytics';
import { RotateCcw, Volume2, VolumeX, Award, Sparkles, ChevronRight } from 'lucide-react';

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 520;

export const WoodNutsFarmContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [levelIdx, setLevelIdx] = useState<number>(0);
  const [state, setState] = useState<WoodNutsState>(() => createInitialState(0));
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const stateRef = useRef<WoodNutsState>(state);
  stateRef.current = state;

  // Initialize GA4
  useEffect(() => {
    analytics.gameStarted('wood-nuts-farm');
    analytics.track('level_started', { gameId: 'wood-nuts-farm', levelId: 1 });
  }, []);

  // Reset or Switch Level
  const handleLoadLevel = useCallback((idx: number) => {
    const nextIdx = Math.max(0, Math.min(idx, WOOD_LEVELS.length - 1));
    setLevelIdx(nextIdx);
    const newState = createInitialState(nextIdx);
    stateRef.current = newState;
    setState({ ...newState });
    analytics.track('level_started', { gameId: 'wood-nuts-farm', levelId: nextIdx + 1 });
  }, []);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const s = stateRef.current;
      updatePhysics(s, dt);

      // Render Board
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 1. Pegboard Wooden Texture Background
      ctx.fillStyle = '#78350f';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Pegboard Rim & Texture
      ctx.strokeStyle = '#92400e';
      ctx.lineWidth = 8;
      ctx.strokeRect(4, 4, CANVAS_WIDTH - 8, CANVAS_HEIGHT - 8);

      // Subtle Pegboard Perforations
      ctx.fillStyle = '#451a03';
      for (let x = 30; x < CANVAS_WIDTH; x += 40) {
        for (let y = 30; y < CANVAS_HEIGHT; y += 40) {
          ctx.beginPath();
          ctx.arc(x, y, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Render Empty Holes (Metal Grommets)
      for (const hole of s.holes) {
        // Outer grommet ring
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = '#334155';
        ctx.fill();
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Inner dark hole
        ctx.beginPath();
        ctx.arc(hole.x, hole.y, 14, 0, Math.PI * 2);
        ctx.fillStyle = '#0f172a';
        ctx.fill();
      }

      // 3. Render Planks
      for (const plank of s.planks) {
        ctx.save();

        if (plank.isFallen) {
          ctx.translate(plank.rect.x + plank.rect.width / 2, plank.rect.y + plank.rect.height / 2 + plank.fallY);
          ctx.rotate(plank.fallRotation);
          ctx.translate(-(plank.rect.x + plank.rect.width / 2), -(plank.rect.y + plank.rect.height / 2));
        }

        // Drop shadow for 3D realism
        ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 6;

        // Rounded Plank Body
        ctx.fillStyle = plank.color;
        ctx.strokeStyle = plank.borderColor;
        ctx.lineWidth = 4;

        ctx.beginPath();
        ctx.roundRect(plank.rect.x, plank.rect.y, plank.rect.width, plank.rect.height, plank.rect.radius);
        ctx.fill();
        ctx.stroke();

        ctx.shadowColor = 'transparent';

        // Plank Holes Outlines (showing holes on the plank itself)
        for (const hId of plank.holeIds) {
          const h = s.holes.find(hole => hole.id === hId);
          if (h && !plank.isFallen) {
            ctx.beginPath();
            ctx.arc(h.x, h.y, 15, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.lineWidth = 3;
            ctx.stroke();
          }
        }

        ctx.restore();
      }

      // 4. Render Screws & Selected Screw Halo
      for (const hole of s.holes) {
        if (!hole.hasScrew) continue;

        const isSelected = s.selectedHoleId === hole.id;

        // Halo if selected
        if (isSelected) {
          ctx.beginPath();
          ctx.arc(hole.x, hole.y, 26, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
          ctx.fill();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Screw Head (Hex Bolt)
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetY = 3;

        ctx.beginPath();
        ctx.arc(hole.x, hole.y, 18, 0, Math.PI * 2);
        ctx.fillStyle = isSelected ? '#fde047' : hole.screwColor;
        ctx.fill();
        ctx.strokeStyle = '#1e293b';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Phillips Cross Slot Detail
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(hole.x - 7, hole.y);
        ctx.lineTo(hole.x + 7, hole.y);
        ctx.moveTo(hole.x, hole.y - 7);
        ctx.lineTo(hole.x, hole.y + 7);
        ctx.stroke();

        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Handle User Click / Touch Input
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Find clicked hole (radius threshold: 30px for easy mobile touch)
    const s = { ...stateRef.current };
    const clickedHole = s.holes.find(h => {
      const dx = h.x - clickX;
      const dy = h.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= 30;
    });

    if (clickedHole) {
      const res = handleHoleClick(s, clickedHole.id);
      if (res.type === 'select') {
        woodSound.playUnscrew();
      } else if (res.type === 'move') {
        woodSound.playScrewIn();
        if (res.fallenPlankIds && res.fallenPlankIds.length > 0) {
          woodSound.playPlankDrop();
        }
        if (s.levelCleared) {
          woodSound.playVictory();
          analytics.levelCompleted('wood-nuts-farm', { levelId: s.level, moves: s.moves });
        }
      }
      setState({ ...s });
    }
  };

  return (
    <div className="relative w-full max-w-md mx-auto flex flex-col items-center select-none touch-none bg-gradient-to-b from-slate-900 via-amber-950/40 to-slate-950 p-2 sm:p-4 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden min-h-[580px] sm:min-h-[640px]">
      {/* Top Header / HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-amber-500/20 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl mb-3 shadow-lg">
        {/* Level Title */}
        <div>
          <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
            Stage {state.level} of {state.maxLevels}
          </div>
          <div className="text-sm sm:text-base font-black text-white">
            {WOOD_LEVELS[levelIdx]?.name}
          </div>
        </div>

        {/* Moves & Score */}
        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[10px] font-bold text-slate-400">MOVES</div>
            <div className="text-xs sm:text-sm font-black text-amber-300">{state.moves}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] font-bold text-slate-400">SCORE</div>
            <div className="text-xs sm:text-sm font-black text-white">{state.score}</div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => handleLoadLevel(levelIdx)}
            aria-label="Restart Level"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 transition-all cursor-pointer min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              const muted = woodSound.toggleMute();
              setIsMuted(muted);
            }}
            aria-label="Toggle Sound"
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/20 transition-all cursor-pointer min-h-[44px]"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="relative w-full aspect-[400/520] max-w-[380px] rounded-2xl overflow-hidden shadow-2xl border-2 border-amber-700/60 bg-amber-950 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerDown={handlePointerDown}
          className="w-full h-full cursor-pointer block"
        />

        {/* Level Victory Celebration Overlay */}
        {state.levelCleared && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-3xl shadow-xl shadow-amber-500/30 mb-3 animate-bounce">
              🔩✨
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mb-1">
              Workshop Stage Cleared!
            </h3>
            <p className="text-xs sm:text-sm text-amber-200 font-semibold mb-4">
              All wooden planks safely unbolted in {state.moves} moves!
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => handleLoadLevel(levelIdx)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Replay
              </button>
              {levelIdx < WOOD_LEVELS.length - 1 ? (
                <button
                  onClick={() => handleLoadLevel(levelIdx + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-400/30 cursor-pointer min-h-[44px]"
                >
                  <span>Next Stage</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => handleLoadLevel(0)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 font-black text-xs sm:text-sm cursor-pointer min-h-[44px]"
                >
                  Play All Stages Again
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="mt-3 text-center text-xs font-semibold text-slate-400">
        💡 Tap a screw to unscrew, then tap an empty hole to move it. Drop all planks to win!
      </div>
    </div>
  );
};

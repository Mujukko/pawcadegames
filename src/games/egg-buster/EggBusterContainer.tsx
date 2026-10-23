import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  EggBusterState,
  initializeEggBusterLevel,
  calculateTrajectory,
  launchEgg,
  stepPhysics,
  TrajectoryPoint,
  EGG_LEVELS,
  FLOOR_Y,
  WORLD_WIDTH,
  WORLD_HEIGHT,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const EggBusterContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<EggBusterState>(() => initializeEggBusterLevel(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isPulling, setIsPulling] = useState<boolean>(false);
  const [pullPos, setPullPos] = useState<{ x: number; y: number } | null>(null);
  const [trajectory, setTrajectory] = useState<TrajectoryPoint[]>([]);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());

  const startLevel = useCallback((lvl: number) => {
    setLevelNum(lvl);
    setGameState(initializeEggBusterLevel(lvl));
    setIsPulling(false);
    setPullPos(null);
    setTrajectory([]);
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Convert client touch/mouse event to SVG coordinate space
  const getSvgCoords = (clientX: number, clientY: number): { x: number; y: number } => {
    if (!svgRef.current) return { x: 0, y: 0 };
    const rect = svgRef.current.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    if (gameState.egg !== null || gameState.eggsRemaining <= 0 || gameState.isWon || gameState.isGameOver) {
      return;
    }
    const coords = getSvgCoords(clientX, clientY);
    const anchor = gameState.slingshotAnchor;
    const dist = Math.hypot(coords.x - anchor.x, coords.y - anchor.y);

    if (dist <= 65) {
      setIsPulling(true);
      setPullPos(coords);
      sound.playSlingshotPull();
      setTrajectory(calculateTrajectory(anchor, coords.x, coords.y));
    }
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isPulling) return;
    const coords = getSvgCoords(clientX, clientY);
    const anchor = gameState.slingshotAnchor;

    // Clamp maximum pull distance to 75px
    const dx = coords.x - anchor.x;
    const dy = coords.y - anchor.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 75;

    let clampedX = coords.x;
    let clampedY = coords.y;

    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      clampedX = anchor.x + Math.cos(angle) * maxDist;
      clampedY = anchor.y + Math.sin(angle) * maxDist;
    }

    setPullPos({ x: clampedX, y: clampedY });
    setTrajectory(calculateTrajectory(anchor, clampedX, clampedY));
  };

  const handlePointerUp = () => {
    if (!isPulling || !pullPos) return;

    sound.playSlingshotRelease();
    const next = launchEgg(gameState, pullPos.x, pullPos.y);
    setGameState(next);
    setIsPulling(false);
    setPullPos(null);
    setTrajectory([]);
  };

  // Continuous physics loop when egg is active
  useEffect(() => {
    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      setGameState(prev => {
        if (!prev.egg || !prev.egg.isActive) return prev;

        const { nextState, hitTarget, bounced } = stepPhysics(prev, dt);

        if (hitTarget) {
          sound.playTargetHit(hitTarget.type);
        } else if (bounced) {
          sound.playFloorBounce();
        }

        if (nextState.isWon && !prev.isWon) {
          setTimeout(() => {
            sound.playVictory();
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          }, 200);
        } else if (nextState.isGameOver && !prev.isGameOver) {
          sound.playGameOver();
        }

        return nextState;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto p-2 sm:p-4 select-none text-slate-100">
      {/* 1. TOP HEADER & HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-2.5 mb-2.5 shadow-xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center p-1 shadow-md border border-yellow-300/40">
            <span className="text-xl">🐥</span>
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-yellow-400 tracking-wider">
              Level {gameState.level} of {EGG_LEVELS.length}
            </div>
            <div className="text-sm sm:text-base font-black text-white leading-tight font-mono">
              Score: <span className="text-yellow-400">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Eggs Remaining & Controls */}
        <div className="flex items-center gap-2">
          {/* Egg Ammo Counter */}
          <div className="flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            {Array.from({ length: 3 }).map((_, idx) => (
              <span
                key={idx}
                className={`text-sm transition-transform ${
                  idx < gameState.eggsRemaining ? 'scale-105 opacity-100' : 'opacity-25 grayscale'
                }`}
              >
                🥚
              </span>
            ))}
          </div>

          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-yellow-400" />}
          </button>

          <button
            onClick={() => startLevel(levelNum)}
            aria-label="Restart Level"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. THE BARNYARD SLINGSHOT ARENA (SVG Interactive World) */}
      <div className="relative w-full aspect-[480/440] max-w-[480px] bg-slate-950/90 border-4 border-amber-800 rounded-3xl shadow-2xl overflow-hidden mx-auto touch-none overscroll-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
          className="w-full h-full cursor-crosshair"
          onMouseDown={e => handlePointerDown(e.clientX, e.clientY)}
          onMouseMove={e => handlePointerMove(e.clientX, e.clientY)}
          onMouseUp={handlePointerUp}
          onTouchStart={e => {
            if (e.touches[0]) handlePointerDown(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchMove={e => {
            if (e.touches[0]) handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
          }}
          onTouchEnd={handlePointerUp}
        >
          <defs>
            {/* Sky Gradient */}
            <linearGradient id="arenaSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#0284c7" />
              <stop offset="60%" stop-color="#38bdf8" />
              <stop offset="61%" stop-color="#22c55e" />
              <stop offset="100%" stop-color="#15803d" />
            </linearGradient>

            <linearGradient id="woodCrate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#b45309" />
              <stop offset="100%" stop-color="#78350f" />
            </linearGradient>

            <linearGradient id="metalCan" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#cbd5e1" />
              <stop offset="50%" stop-color="#94a3b8" />
              <stop offset="100%" stop-color="#64748b" />
            </linearGradient>

            <filter id="arenaShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="2" flood-color="#000000" flood-opacity="0.3" />
            </filter>
          </defs>

          {/* Arena Sky & Pasture Floor */}
          <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#arenaSky)" />

          {/* Distant Barn Silo */}
          <rect x="420" y="240" width="40" height="160" fill="#94a3b8" rx="8" opacity="0.6" />
          <polygon points="340,300 420,330 420,400 340,400" fill="#b91c1c" opacity="0.5" />

          {/* Floor Grass Line */}
          <rect x="0" y={FLOOR_Y} width={WORLD_WIDTH} height={WORLD_HEIGHT - FLOOR_Y} fill="#14532d" />
          <line x1="0" y1={FLOOR_Y} x2={WORLD_WIDTH} y2={FLOOR_Y} stroke="#16a34a" stroke-width="3" />

          {/* Trajectory Guide Dotted Arc */}
          {trajectory.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx % 2 === 0 ? 3 : 2}
              fill="#ffffff"
              opacity={0.8 - (idx / trajectory.length) * 0.4}
            />
          ))}

          {/* Targets (Foxes, Wooden Crates, Metal Cans) */}
          {gameState.targets.map(t => {
            if (t.isDestroyed) return null;

            if (t.type === 'crate') {
              return (
                <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                  <rect width={t.width} height={t.height} rx="4" fill="url(#woodCrate)" stroke="#451a03" stroke-width="2" />
                  <line x1="0" y1="0" x2={t.width} y2={t.height} stroke="#451a03" stroke-width="1.5" />
                  <line x1={t.width} y1="0" x2="0" y2={t.height} stroke="#451a03" stroke-width="1.5" />
                </g>
              );
            }

            if (t.type === 'metal') {
              return (
                <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                  <rect width={t.width} height={t.height} rx="6" fill="url(#metalCan)" stroke="#334155" stroke-width="2" />
                  <rect x="4" y="-6" width={t.width - 8} height="8" rx="2" fill="#64748b" stroke="#334155" stroke-width="1.5" />
                  <text x={t.width / 2} y={t.height / 2 + 4} textAnchor="middle" fill="#1e293b" fontSize="12" fontWeight="900">MILK</text>
                </g>
              );
            }

            if (t.type === 'hay') {
              return (
                <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                  <rect width={t.width} height={t.height} rx="6" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
                  <line x1="0" y1="14" x2={t.width} y2="14" stroke="#ca8a04" stroke-width="1.5" />
                  <line x1="0" y1="28" x2={t.width} y2="28" stroke="#ca8a04" stroke-width="1.5" />
                </g>
              );
            }

            // Fox Target (Sneaky Enemy)
            return (
              <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                <circle cx={t.width / 2} cy={t.height / 2} r={t.width / 2} fill="#ea580c" stroke="#9a3412" stroke-width="2.5" />
                {/* White Muzzle */}
                <ellipse cx={t.width / 2} cy={t.height / 2 + 6} rx="12" ry="8" fill="#ffedd5" />
                <circle cx={t.width / 2} cy={t.height / 2 + 8} r="2.5" fill="#1e293b" />
                {/* Fox Ears */}
                <polygon points="4,4 12,-6 18,8" fill="#ea580c" stroke="#9a3412" stroke-width="1.5" />
                <polygon points={`${t.width - 4},4 ${t.width - 12},-6 ${t.width - 18},8`} fill="#ea580c" stroke="#9a3412" stroke-width="1.5" />
                {/* Fox Eyes */}
                <circle cx={t.width / 2 - 6} cy={t.height / 2 - 2} r="2.5" fill="#1e293b" />
                <circle cx={t.width / 2 + 6} cy={t.height / 2 - 2} r="2.5" fill="#1e293b" />
              </g>
            );
          })}

          {/* Slingshot Fork on Ground */}
          <g filter="url(#arenaShadow)">
            <line x1={gameState.slingshotAnchor.x} y1={FLOOR_Y} x2={gameState.slingshotAnchor.x} y2={gameState.slingshotAnchor.y + 20} stroke="#78350f" stroke-width="12" stroke-linecap="round" />
            <line x1={gameState.slingshotAnchor.x} y1={gameState.slingshotAnchor.y + 20} x2={gameState.slingshotAnchor.x - 14} y2={gameState.slingshotAnchor.y - 12} stroke="#78350f" stroke-width="8" stroke-linecap="round" />
            <line x1={gameState.slingshotAnchor.x} y1={gameState.slingshotAnchor.y + 20} x2={gameState.slingshotAnchor.x + 14} y2={gameState.slingshotAnchor.y - 12} stroke="#78350f" stroke-width="8" stroke-linecap="round" />
          </g>

          {/* Pippin the Chick standing next to Slingshot */}
          <g transform={`translate(${gameState.slingshotAnchor.x - 45}, ${FLOOR_Y - 42})`}>
            <circle cx="20" cy="22" r="18" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
            <polygon points="20,18 28,22 20,26" fill="#f97316" />
            <circle cx="16" cy="18" r="2.5" fill="#1e293b" />
            <circle cx="15" cy="17" r="0.8" fill="#ffffff" />
          </g>

          {/* Stretched Rubber Bands when Pulling */}
          {isPulling && pullPos && (
            <>
              <line
                x1={gameState.slingshotAnchor.x - 14}
                y1={gameState.slingshotAnchor.y - 12}
                x2={pullPos.x}
                y2={pullPos.y}
                stroke="#451a03"
                stroke-width="3.5"
              />
              <line
                x1={gameState.slingshotAnchor.x + 14}
                y1={gameState.slingshotAnchor.y - 12}
                x2={pullPos.x}
                y2={pullPos.y}
                stroke="#451a03"
                stroke-width="3.5"
              />
              {/* Egg in Pouch */}
              <ellipse
                cx={pullPos.x}
                cy={pullPos.y}
                rx="9"
                ry="12"
                fill="#fef08a"
                stroke="#ca8a04"
                stroke-width="2"
              />
            </>
          )}

          {/* In-Flight Egg Projectile */}
          {gameState.egg && gameState.egg.isActive && (
            <ellipse
              cx={gameState.egg.x}
              cy={gameState.egg.y}
              rx={gameState.egg.radius - 1}
              ry={gameState.egg.radius + 2}
              fill="#fef08a"
              stroke="#ca8a04"
              stroke-width="2"
              filter="url(#arenaShadow)"
            />
          )}
        </svg>
      </div>

      {/* 3. STRATEGY HINT FOOTER */}
      <div className="w-full mt-2.5 text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5">
        <Sparkles className="w-4 h-4 text-yellow-400" />
        <span>
          Drag back on the slingshot and release to launch eggs! Topple crates and <strong className="text-yellow-400">smash all sneaky foxes</strong>!
        </span>
      </div>

      {/* 4. VICTORY / GAME OVER MODAL */}
      {(gameState.isWon || gameState.isGameOver) && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {gameState.isWon ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-emerald-500/20">
                  🎉
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Foxes Smashed!</h3>
                <p className="text-xs text-slate-300 mb-4">
                  Pippin's egg slingshot cleared the farmyard of sneaky thieves!
                </p>
                <div className="bg-slate-800 rounded-2xl p-3 mb-5 border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Score</div>
                  <div className="text-xl font-black text-amber-300 font-mono">{gameState.score}</div>
                </div>
                {levelNum < EGG_LEVELS.length ? (
                  <button
                    onClick={() => startLevel(levelNum + 1)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-yellow-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <span>NEXT LEVEL</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </button>
                ) : (
                  <button
                    onClick={() => startLevel(1)}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-yellow-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>PLAY AGAIN</span>
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border-2 border-rose-400 flex items-center justify-center text-3xl mx-auto mb-3 shadow-lg shadow-rose-500/20">
                  🥚
                </div>
                <h3 className="text-2xl font-black text-white mb-1">Out of Eggs!</h3>
                <p className="text-xs text-slate-300 mb-4">
                  The foxes escaped with the grain before you could smash them!
                </p>
                <div className="bg-slate-800 rounded-2xl p-3 mb-5 border border-slate-700">
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Final Score</div>
                  <div className="text-xl font-black text-amber-300 font-mono">{gameState.score}</div>
                </div>
                <button
                  onClick={() => startLevel(levelNum)}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-amber-400 hover:from-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-yellow-400/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RETRY LEVEL</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

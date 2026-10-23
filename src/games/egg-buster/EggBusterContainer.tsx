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

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (gameState.egg !== null || gameState.eggsRemaining <= 0 || gameState.isWon || gameState.isGameOver) {
      return;
    }
    const coords = getSvgCoords(e.clientX, e.clientY);
    const anchor = gameState.slingshotAnchor;
    const dist = Math.hypot(coords.x - anchor.x, coords.y - anchor.y);

    // Generous launch initiation: near slingshot (dist <= 90) or clicking the left launch quadrant
    const inLeftLaunchQuadrant =
      coords.x <= anchor.x + 60 &&
      coords.x >= 15 &&
      coords.y >= anchor.y - 95 &&
      coords.y <= anchor.y + 90;

    if (dist <= 90 || inLeftLaunchQuadrant) {
      try {
        (e.target as Element).setPointerCapture(e.pointerId);
      } catch {}

      setIsPulling(true);
      setPullPos({ x: anchor.x, y: anchor.y });
      sound.playSlingshotPull();
      setTrajectory([]);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPulling) return;
    const coords = getSvgCoords(e.clientX, e.clientY);
    const anchor = gameState.slingshotAnchor;

    // Displacement from anchor
    const dx = coords.x - anchor.x;
    const dy = coords.y - anchor.y;
    const dist = Math.hypot(dx, dy);
    const maxDist = 65; // Safe maximum pull distance (guarantees >= 55px cushion to left screen edge)

    let clampedX = coords.x;
    let clampedY = coords.y;

    if (dist > maxDist) {
      const angle = Math.atan2(dy, dx);
      clampedX = anchor.x + Math.cos(angle) * maxDist;
      clampedY = anchor.y + Math.sin(angle) * maxDist;
    }

    // Only compute trajectory if pull has meaningful displacement
    if (dist >= 10) {
      setPullPos({ x: clampedX, y: clampedY });
      setTrajectory(calculateTrajectory(anchor, clampedX, clampedY));
    } else {
      setPullPos({ x: anchor.x, y: anchor.y });
      setTrajectory([]);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPulling) return;
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}

    if (pullPos) {
      const dist = Math.hypot(
        pullPos.x - gameState.slingshotAnchor.x,
        pullPos.y - gameState.slingshotAnchor.y
      );

      // Require minimum pull of 14px to launch (prevents accidental misfires on gentle taps)
      if (dist >= 14) {
        sound.playSlingshotRelease();
        const next = launchEgg(gameState, pullPos.x, pullPos.y);
        setGameState(next);
      }
    }

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

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const totalLevelEggs = EGG_LEVELS.find(l => l.level === gameState.level)?.eggsAllowed || 3;
  const anchor = gameState.slingshotAnchor;

  // Calculate pull tension percentage & angle for visual feedback
  const pullDist = pullPos ? Math.hypot(pullPos.x - anchor.x, pullPos.y - anchor.y) : 0;
  const powerPercent = Math.min(100, Math.round((pullDist / 65) * 100));
  const pullAngle = pullPos ? Math.atan2(pullPos.y - anchor.y, pullPos.x - anchor.x) : 0;

  // Chick pupil offset following pull position
  const pupilOffsetX = isPulling && pullPos ? Math.cos(pullAngle) * 3 : 0;
  const pupilOffsetY = isPulling && pullPos ? Math.sin(pullAngle) * 2 : 0;

  // Impact reticle position (end of trajectory)
  const impactPoint = trajectory.length > 0 ? trajectory[trajectory.length - 1] : null;

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
            {Array.from({ length: totalLevelEggs }).map((_, idx) => (
              <span
                key={idx}
                className={`text-sm transition-transform duration-200 ${
                  idx < gameState.eggsRemaining ? 'scale-105 opacity-100' : 'opacity-20 grayscale'
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
      <div className="relative w-full aspect-[500/420] max-w-[500px] bg-slate-950/90 border-4 border-amber-800 rounded-3xl shadow-2xl overflow-hidden mx-auto touch-none overscroll-none">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
          className="w-full h-full cursor-crosshair"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <defs>
            {/* Sky Gradient */}
            <linearGradient id="arenaSky" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="58%" stopColor="#38bdf8" />
              <stop offset="59%" stopColor="#86efac" />
              <stop offset="68%" stopColor="#22c55e" />
              <stop offset="100%" stopColor="#15803d" />
            </linearGradient>

            {/* Wood Crate Gradient */}
            <linearGradient id="woodCrate" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="50%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Slingshot Wood Fork */}
            <linearGradient id="woodFork" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#92400e" />
              <stop offset="45%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Metal Milk Can Gradient */}
            <linearGradient id="metalCan" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94a3b8" />
              <stop offset="30%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#64748b" />
            </linearGradient>

            {/* Golden Egg Gradient */}
            <linearGradient id="eggGrad" x1="20%" y1="10%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#fef9c3" />
              <stop offset="70%" stopColor="#fef08a" />
              <stop offset="100%" stopColor="#fde047" />
            </linearGradient>

            {/* Drop Shadow Filter */}
            <filter id="arenaShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="4" stdDeviation="3" floodColor="#000000" floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Arena Sky & Pasture Floor */}
          <rect width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="url(#arenaSky)" />

          {/* Distant Puffy Clouds */}
          <g fill="#ffffff" opacity="0.65">
            <ellipse cx="140" cy="70" rx="36" ry="16" />
            <ellipse cx="165" cy="62" rx="26" ry="18" />
            <ellipse cx="380" cy="90" rx="44" ry="18" />
            <ellipse cx="410" cy="80" rx="30" ry="20" />
          </g>

          {/* Distant Red Gambrel Barn & Silo */}
          <rect x="420" y="210" width="36" height="175" fill="#94a3b8" rx="6" opacity="0.75" />
          <path d="M 420 210 Q 438 185 456 210 Z" fill="#64748b" opacity="0.8" />
          <polygon points="340,290 415,260 415,385 340,385" fill="#b91c1c" opacity="0.65" />
          <polygon points="340,290 375,250 415,260" fill="#991b1b" opacity="0.65" />

          {/* Floor Grass Line & Earth Base */}
          <rect x="0" y={FLOOR_Y} width={WORLD_WIDTH} height={WORLD_HEIGHT - FLOOR_Y} fill="#14532d" />
          <rect x="0" y={FLOOR_Y + 14} width={WORLD_WIDTH} height={WORLD_HEIGHT - FLOOR_Y - 14} fill="#3f2e1a" opacity="0.85" />
          <line x1="0" y1={FLOOR_Y} x2={WORLD_WIDTH} y2={FLOOR_Y} stroke="#22c55e" strokeWidth="4" />

          {/* Reserve Eggs Basket on Grass (Left side) */}
          <g transform="translate(32, 345)" filter="url(#arenaShadow)">
            {/* Straw bedding */}
            <ellipse cx="26" cy="28" rx="26" ry="10" fill="#ca8a04" />
            {/* Woven wooden basket bowl */}
            <path d="M 4 24 Q 26 44 48 24 Z" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            <line x1="12" y1="26" x2="16" y2="34" stroke="#92400e" strokeWidth="1.5" />
            <line x1="26" y1="28" x2="26" y2="36" stroke="#92400e" strokeWidth="1.5" />
            <line x1="40" y1="26" x2="36" y2="34" stroke="#92400e" strokeWidth="1.5" />
            {/* Remaining eggs inside basket */}
            {gameState.eggsRemaining > 1 && (
              <ellipse cx="18" cy="18" rx="7" ry="10" fill="url(#eggGrad)" stroke="#ca8a04" strokeWidth="1.2" transform="rotate(-15 18 18)" />
            )}
            {gameState.eggsRemaining > 2 && (
              <ellipse cx="32" cy="18" rx="7" ry="10" fill="url(#eggGrad)" stroke="#ca8a04" strokeWidth="1.2" transform="rotate(12 32 18)" />
            )}
            {gameState.eggsRemaining > 3 && (
              <ellipse cx="25" cy="13" rx="6.5" ry="9" fill="url(#eggGrad)" stroke="#ca8a04" strokeWidth="1.2" />
            )}
          </g>

          {/* Targets (Foxes, Wooden Crates, Metal Cans, Hay Bales) */}
          {gameState.targets.map(t => {
            if (t.isDestroyed) return null;

            if (t.type === 'crate') {
              return (
                <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                  <rect width={t.width} height={t.height} rx="4" fill="url(#woodCrate)" stroke="#451a03" strokeWidth="2.5" />
                  <line x1="0" y1="0" x2={t.width} y2={t.height} stroke="#451a03" strokeWidth="2" />
                  <line x1={t.width} y1="0" x2="0" y2={t.height} stroke="#451a03" strokeWidth="2" />
                  {/* Corner brass rivets */}
                  <circle cx="5" cy="5" r="2" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
                  <circle cx={t.width - 5} cy="5" r="2" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
                  <circle cx="5" cy={t.height - 5} r="2" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
                  <circle cx={t.width - 5} cy={t.height - 5} r="2" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />
                </g>
              );
            }

            if (t.type === 'metal') {
              return (
                <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                  <rect width={t.width} height={t.height} rx="7" fill="url(#metalCan)" stroke="#334155" strokeWidth="2.5" />
                  {/* Can Rim & Cap */}
                  <rect x="4" y="-7" width={t.width - 8} height="9" rx="3" fill="#cbd5e1" stroke="#334155" strokeWidth="2" />
                  <rect x="7" y="-12" width={t.width - 14} height="6" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
                  {/* Embossed MILK Badge */}
                  <rect x="4" y={t.height / 2 - 8} width={t.width - 8} height="16" rx="3" fill="#0284c7" opacity="0.85" />
                  <text x={t.width / 2} y={t.height / 2 + 4} textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" letterSpacing="1">
                    MILK
                  </text>
                </g>
              );
            }

            if (t.type === 'hay') {
              return (
                <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                  <rect width={t.width} height={t.height} rx="8" fill="#facc15" stroke="#ca8a04" strokeWidth="2.5" />
                  <line x1="0" y1="14" x2={t.width} y2="14" stroke="#ca8a04" strokeWidth="2" strokeDasharray="4 2" />
                  <line x1="0" y1="28" x2={t.width} y2="28" stroke="#ca8a04" strokeWidth="2" strokeDasharray="4 2" />
                  {/* Straw Tuft Details */}
                  <text x={t.width / 2} y={t.height / 2 + 5} textAnchor="middle" fill="#854d0e" fontSize="11" fontWeight="800">
                    HAY
                  </text>
                </g>
              );
            }

            // Fox Target (Expressive Sneaky Barnyard Thief)
            return (
              <g key={t.id} transform={`translate(${t.x}, ${t.y})`} filter="url(#arenaShadow)">
                {/* Fox Head Base */}
                <circle cx={t.width / 2} cy={t.height / 2} r={t.width / 2} fill="#ea580c" stroke="#9a3412" strokeWidth="2.5" />
                {/* Fox Ears with Pink Inner */}
                <polygon points="4,5 12,-8 19,8" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
                <polygon points="7,4 12,-4 16,6" fill="#fca5a5" />
                <polygon points={`${t.width - 4},5 ${t.width - 12},-8 ${t.width - 19},8`} fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
                <polygon points={`${t.width - 7},4 ${t.width - 12},-4 ${t.width - 16},6`} fill="#fca5a5" />
                {/* Fluffy White Cheeks & Muzzle */}
                <path d={`M 5 ${t.height / 2 + 2} Q ${t.width / 2} ${t.height + 6} ${t.width - 5} ${t.height / 2 + 2} Q ${t.width / 2} ${t.height / 2 + 2} 5 ${t.height / 2 + 2}`} fill="#fff7ed" />
                {/* Shiny Black Nose */}
                <ellipse cx={t.width / 2} cy={t.height / 2 + 9} rx="3.5" ry="2.5" fill="#0f172a" />
                {/* Sneaky Eyes with Specular Highlights */}
                <ellipse cx={t.width / 2 - 7} cy={t.height / 2 - 1} rx="3" ry="3.5" fill="#0f172a" />
                <circle cx={t.width / 2 - 8} cy={t.height / 2 - 2} r="1.2" fill="#ffffff" />
                <ellipse cx={t.width / 2 + 7} cy={t.height / 2 - 1} rx="3" ry="3.5" fill="#0f172a" />
                <circle cx={t.width / 2 + 6} cy={t.height / 2 - 2} r="1.2" fill="#ffffff" />
                {/* Sneaky Smirk */}
                <path d={`M ${t.width / 2 - 4} ${t.height / 2 + 13} Q ${t.width / 2} ${t.height / 2 + 16} ${t.width / 2 + 4} ${t.height / 2 + 13}`} fill="none" stroke="#9a3412" strokeWidth="1.5" strokeLinecap="round" />
              </g>
            );
          })}

          {/* Rear Wooden Slingshot Prong (Depth layering) */}
          <line
            x1={anchor.x}
            y1={anchor.y + 16}
            x2={anchor.x + 18}
            y2={anchor.y - 18}
            stroke="#78350f"
            strokeWidth="10"
            strokeLinecap="round"
          />

          {/* Rear Elastic Rubber Band */}
          {isPulling && pullPos ? (
            <line
              x1={anchor.x + 18}
              y1={anchor.y - 18}
              x2={pullPos.x}
              y2={pullPos.y}
              stroke="#451a03"
              strokeWidth="4"
              strokeLinecap="round"
            />
          ) : (
            gameState.egg === null && gameState.eggsRemaining > 0 && (
              <line
                x1={anchor.x + 18}
                y1={anchor.y - 18}
                x2={anchor.x}
                y2={anchor.y}
                stroke="#451a03"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )
          )}

          {/* Slingshot Main Post & Base Fork */}
          <g filter="url(#arenaShadow)">
            <line x1={anchor.x} y1={FLOOR_Y} x2={anchor.x} y2={anchor.y + 16} stroke="url(#woodFork)" strokeWidth="14" strokeLinecap="round" />
            <line x1={anchor.x} y1={anchor.y + 16} x2={anchor.x - 18} y2={anchor.y - 18} stroke="url(#woodFork)" strokeWidth="10" strokeLinecap="round" />
            {/* Brass joint band */}
            <rect x={anchor.x - 8} y={anchor.y + 8} width="16" height="8" rx="2" fill="#facc15" stroke="#78350f" strokeWidth="1" />
          </g>

          {/* FRONT Elastic Rubber Band */}
          {isPulling && pullPos ? (
            <line
              x1={anchor.x - 18}
              y1={anchor.y - 18}
              x2={pullPos.x}
              y2={pullPos.y}
              stroke="#581c87"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
          ) : (
            gameState.egg === null && gameState.eggsRemaining > 0 && (
              <line
                x1={anchor.x - 18}
                y1={anchor.y - 18}
                x2={anchor.x}
                y2={anchor.y}
                stroke="#581c87"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            )
          )}

          {/* EGG & LEATHER POUCH (Dynamic: Resting vs Pulling) */}
          {isPulling && pullPos ? (
            <g transform={`translate(${pullPos.x}, ${pullPos.y}) rotate(${(pullAngle * 180) / Math.PI + 90})`} filter="url(#arenaShadow)">
              {/* Leather Pouch Cradle */}
              <ellipse cx="0" cy="0" rx="14" ry="7" fill="#451a03" stroke="#292524" strokeWidth="1.5" />
              {/* Loaded Egg in Pouch */}
              <ellipse cx="0" cy="-2" rx="10" ry="14" fill="url(#eggGrad)" stroke="#ca8a04" strokeWidth="2" />
              <ellipse cx="-3" cy="-6" rx="3" ry="5" fill="#ffffff" opacity="0.6" />
            </g>
          ) : (
            gameState.egg === null && gameState.eggsRemaining > 0 && (
              <g transform={`translate(${anchor.x}, ${anchor.y})`} filter="url(#arenaShadow)">
                {/* Resting Leather Pouch */}
                <ellipse cx="0" cy="2" rx="12" ry="6" fill="#451a03" stroke="#292524" strokeWidth="1.5" />
                {/* Resting Egg ready to launch */}
                <ellipse cx="0" cy="-1" rx="9.5" ry="13.5" fill="url(#eggGrad)" stroke="#ca8a04" strokeWidth="2" />
                <ellipse cx="-2.5" cy="-5" rx="2.5" ry="4" fill="#ffffff" opacity="0.7" />
                {/* Pulsing Guide Arrow indicating 'Pull Backwards' */}
                <g className="animate-pulse">
                  <circle cx="0" cy="0" r="24" fill="none" stroke="#facc15" strokeWidth="2" strokeDasharray="4 4" opacity="0.8" />
                  <polygon points="-28,0 -20,-5 -20,5" fill="#facc15" />
                </g>
              </g>
            )
          )}

          {/* PIPPIN THE CHICK (Perched beside the slingshot post, holding the base) */}
          <g transform={`translate(${anchor.x - 46}, ${FLOOR_Y - 48})`} filter="url(#arenaShadow)">
            {/* Small wooden stepping stool */}
            <rect x="6" y="32" width="28" height="16" rx="3" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            {/* Chick Chubby Body */}
            <circle cx="20" cy="18" r="17" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
            {/* Little Red Farmer Bandana */}
            <polygon points="12,24 28,24 20,32" fill="#ef4444" stroke="#991b1b" strokeWidth="1" />
            {/* Chick Orange Beak */}
            <polygon points={isPulling ? "22,15 32,19 22,23" : "21,16 28,19 21,22"} fill="#f97316" />
            {/* Chick Wings resting on slingshot */}
            <ellipse cx="28" cy="22" rx="5" ry="7" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" transform="rotate(20 28 22)" />
            {/* Cute Googly Eyes Following Drag */}
            <circle cx="15" cy="14" r="4.5" fill="#ffffff" stroke="#713f12" strokeWidth="1" />
            <circle cx={15 + pupilOffsetX} cy={14 + pupilOffsetY} r="2.2" fill="#0f172a" />
            <circle cx={14 + pupilOffsetX} cy={13 + pupilOffsetY} r="0.8" fill="#ffffff" />
          </g>

          {/* TRAJECTORY GUIDE DOTTED ARC */}
          {trajectory.map((pt, idx) => (
            <circle
              key={idx}
              cx={pt.x}
              cy={pt.y}
              r={idx % 2 === 0 ? 3.5 : 2.5}
              fill={idx % 2 === 0 ? '#fde047' : '#ffffff'}
              opacity={0.95 - (idx / trajectory.length) * 0.45}
            />
          ))}

          {/* LANDING IMPACT RETICLE (Target prediction crosshair) */}
          {impactPoint && (
            <g transform={`translate(${impactPoint.x}, ${impactPoint.y})`} className="animate-pulse">
              <circle cx="0" cy="0" r="10" fill="none" stroke="#ef4444" strokeWidth="2" strokeDasharray="3 3" />
              <circle cx="0" cy="0" r="4" fill="#ef4444" />
              <line x1="-14" y1="0" x2="14" y2="0" stroke="#ef4444" strokeWidth="1.5" />
              <line x1="0" y1="-14" x2="0" y2="14" stroke="#ef4444" strokeWidth="1.5" />
            </g>
          )}

          {/* IN-FLIGHT EGG PROJECTILE */}
          {gameState.egg && gameState.egg.isActive && (
            <g transform={`translate(${gameState.egg.x}, ${gameState.egg.y}) rotate(${((Math.atan2(gameState.egg.vy, gameState.egg.vx) * 180) / Math.PI) + 90})`} filter="url(#arenaShadow)">
              <ellipse cx="0" cy="0" rx={gameState.egg.radius - 1} ry={gameState.egg.radius + 3} fill="url(#eggGrad)" stroke="#ca8a04" strokeWidth="2" />
              <ellipse cx="-2.5" cy="-4" rx="2.5" ry="4.5" fill="#ffffff" opacity="0.75" />
              {/* Motion speed particles */}
              <line x1="-5" y1="12" x2="-2" y2="20" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
              <line x1="5" y1="12" x2="2" y2="20" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
            </g>
          )}

          {/* POWER TENSION METER BADGE */}
          {isPulling && pullDist >= 12 && (
            <g transform={`translate(${anchor.x - 30}, ${anchor.y - 65})`}>
              <rect x="0" y="0" width="60" height="22" rx="6" fill="#0f172a" stroke="#facc15" strokeWidth="1.5" />
              <text x="30" y="15" textAnchor="middle" fill="#facc15" fontSize="11" fontWeight="900" fontStyle="italic">
                ⚡ {powerPercent}%
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* 3. STRATEGY HINT FOOTER */}
      <div className="w-full mt-2.5 text-center text-xs text-slate-300 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 flex items-center justify-center gap-1.5 shadow-md">
        <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
        <span>
          Pull back on the egg and release to launch! Topple crates and <strong className="text-yellow-400">smash all sneaky foxes</strong>!
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

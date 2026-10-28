import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  HorseshoeTwistState,
  initializeHorseshoeTwistLevel,
  rotateRing,
  isRingAlignedWithExit,
  HORSESHOE_TWIST_LEVELS,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  RotateCw,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { analytics } from '../../lib/analytics';

const SVG_SIZE = 380;
const CENTER = SVG_SIZE / 2;

export const HorseshoeTwistContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<HorseshoeTwistState>(() =>
    initializeHorseshoeTwistLevel(1)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [selectedRingId, setSelectedRingId] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const lastAngleRef = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const startLevel = useCallback((lvl: number, isRestart = false) => {
    setLevelNum(lvl);
    if (isRestart) {
      analytics.gameRestarted('horseshoe-twist', { levelId: lvl });
    } else {
      analytics.track('level_started', { gameId: 'horseshoe-twist', levelId: lvl });
    }
    const fresh = initializeHorseshoeTwistLevel(lvl);
    setGameState(fresh);
    setSelectedRingId(0);
    sound.playRatchetClick();
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Continuous hold-to-rotate for mobile buttons
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHoldAction = (action: () => void, initialDelay = 160, repeatInterval = 90) => {
    action();
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, repeatInterval);
    }, initialDelay);
  };

  const stopHoldAction = () => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopHoldAction();
    };
  }, []);

  const handleRotate = useCallback(
    (ringId: number, deltaDeg: number) => {
      if (gameState.status === 'won') return;
      sound.playRatchetClick();

      setGameState((prev) => {
        const next = rotateRing(prev, ringId, deltaDeg);
        // Check if now aligned
        const targetRing = next.rings.find((r) => r.id === ringId);
        if (targetRing && isRingAlignedWithExit(targetRing, next.exitAngleDeg)) {
          sound.playAlignChime();
        }
        if (next.status === 'won' && prev.status !== 'won') {
          analytics.levelCompleted('horseshoe-twist', {
            levelId: next.level,
            moves: next.movesCount,
            score: next.score,
          });
          sound.playPinSlide();
          setTimeout(() => {
            sound.playVictory();
            confetti({
              particleCount: 90,
              spread: 80,
              origin: { y: 0.6 },
            });
          }, 200);
        }
        return next;
      });
    },
    [gameState.status]
  );

  // Convert mouse/touch event to angle around center
  const getPointerAngleDeg = (clientX: number, clientY: number): number | null => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const x = clientX - (rect.left + rect.width / 2);
    const y = clientY - (rect.top + rect.height / 2);
    let deg = (Math.atan2(y, x) * 180) / Math.PI;
    return (deg + 360) % 360;
  };

  const handlePointerDown = (ringId: number, e: React.PointerEvent) => {
    setSelectedRingId(ringId);
    setIsDragging(true);
    const angle = getPointerAngleDeg(e.clientX, e.clientY);
    lastAngleRef.current = angle;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging || lastAngleRef.current === null) return;
    const currentAngle = getPointerAngleDeg(e.clientX, e.clientY);
    if (currentAngle === null) return;

    let delta = currentAngle - lastAngleRef.current;
    if (delta > 180) delta -= 360;
    if (delta < -180) delta += 360;

    // Threshold of 15 degrees per ratchet step
    if (Math.abs(delta) >= 12) {
      handleRotate(selectedRingId, delta > 0 ? 15 : -15);
      lastAngleRef.current = currentAngle;
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    lastAngleRef.current = null;
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleRotate(selectedRingId, -30);
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleRotate(selectedRingId, 30);
      } else if (e.key === '1') {
        setSelectedRingId(0);
      } else if (e.key === '2' && gameState.rings.length > 1) {
        setSelectedRingId(1);
      } else if (e.key === '3' && gameState.rings.length > 2) {
        setSelectedRingId(2);
      } else if (e.key === '4' && gameState.rings.length > 3) {
        setSelectedRingId(3);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        startLevel(levelNum);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedRingId, gameState.rings.length, handleRotate, levelNum, startLevel]);

  // Compute Exit Path coordinates for the green laser
  const exitRad = (gameState.exitAngleDeg * Math.PI) / 180;
  const exitX2 = CENTER + Math.cos(exitRad) * (CENTER - 15);
  const exitY2 = CENTER + Math.sin(exitRad) * (CENTER - 15);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto select-none touch-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 mb-2 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐴</span>
          <div>
            <div className="text-[10px] uppercase font-bold text-amber-400">
              Level {gameState.level} / {HORSESHOE_TWIST_LEVELS.length}
            </div>
            <div className="text-xs font-black text-white truncate max-w-[140px] sm:max-w-none">
              {gameState.title}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-center">
            <div className="text-[10px] uppercase font-bold text-slate-400">Moves</div>
            <div className="text-sm font-black text-white">{gameState.movesCount}</div>
          </div>
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-sm font-black text-amber-400">{gameState.score}</div>
          </div>

          <button
            onClick={() => startLevel(levelNum, true)}
            title="Restart Level (R)"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleSound}
            title="Toggle Sound (M)"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Concentric Ring Safe SVG */}
      <div className="relative w-full aspect-square max-w-[380px] bg-slate-950/90 rounded-3xl border-2 border-amber-500/40 p-2 shadow-2xl flex items-center justify-center overflow-hidden">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <defs>
            <radialGradient id="hubGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="#78350f" />
              <stop offset="100%" stop-color="#1c1917" />
            </radialGradient>
            <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Background Vault Face */}
          <circle cx={CENTER} cy={CENTER} r={CENTER - 10} fill="#18181b" stroke="#3f3f46" strokeWidth="6" />

          {/* Exit Laser Guide Line */}
          <line
            x1={CENTER}
            y1={CENTER}
            x2={exitX2}
            y2={exitY2}
            stroke="#22c55e"
            strokeWidth="5"
            strokeDasharray="6 4"
            opacity="0.8"
            filter="url(#goldGlow)"
          />

          {/* Concentric Rings (drawn outer to inner) */}
          {[...gameState.rings].reverse().map((ring) => {
            const isSelected = selectedRingId === ring.id;
            const isAligned = isRingAlignedWithExit(ring, gameState.exitAngleDeg);
            const ringThickness = 24;

            // Arc for notches: We render circle stroke with strokeDasharray to create the physical open gap!
            // Total circumference = 2 * PI * r
            const circ = 2 * Math.PI * ring.radius;
            // Notch width in pixels along circumference
            const notchDeg = ring.notches[0]?.widthDeg || 40;
            const notchLen = (notchDeg / 360) * circ;
            const ringLen = circ - notchLen;

            return (
              <g
                key={ring.id}
                onPointerDown={(e) => handlePointerDown(ring.id, e)}
                className="cursor-pointer transition-transform duration-150"
              >
                {/* Selection ring glow */}
                {isSelected && (
                  <circle
                    cx={CENTER}
                    cy={CENTER}
                    r={ring.radius}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth={ringThickness + 8}
                    opacity="0.35"
                    filter="url(#goldGlow)"
                  />
                )}

                {/* The Physical Ring with Notch Gap */}
                <circle
                  cx={CENTER}
                  cy={CENTER}
                  r={ring.radius}
                  fill="none"
                  stroke={isAligned ? '#22c55e' : ring.color}
                  strokeWidth={ringThickness}
                  strokeDasharray={`${ringLen} ${notchLen}`}
                  strokeDashoffset={-((notchLen / 2))}
                  transform={`rotate(${ring.currentAngleDeg} ${CENTER} ${CENTER})`}
                  className="transition-colors duration-200"
                />

                {/* Rivets on Ring */}
                <circle
                  cx={CENTER + Math.cos((ring.currentAngleDeg * Math.PI) / 180) * ring.radius}
                  cy={CENTER + Math.sin((ring.currentAngleDeg * Math.PI) / 180) * ring.radius}
                  r="3.5"
                  fill="#ffffff"
                />
              </g>
            );
          })}

          {/* Central Hub with Horseshoe */}
          <circle cx={CENTER} cy={CENTER} r="38" fill="url(#hubGrad)" stroke="#f59e0b" strokeWidth="4" />

          {/* Lucky Horseshoe in Center */}
          <text
            x={CENTER}
            y={CENTER + 8}
            fontSize="28"
            textAnchor="middle"
            className="select-none pointer-events-none filter drop-shadow"
          >
            🧲
          </text>

          {/* Sliding Pins */}
          {gameState.pins.map((pin) => {
            const pinDistance = pin.escaped
              ? CENTER - 18
              : 38 + (pin.currentRingIndex / (gameState.rings.length + 1)) * 40;
            const pinX = CENTER + Math.cos(exitRad) * pinDistance;
            const pinY = CENTER + Math.sin(exitRad) * pinDistance;

            return (
              <circle
                key={pin.id}
                cx={pinX}
                cy={pinY}
                r="7"
                fill="#facc15"
                stroke="#ffffff"
                strokeWidth="2.5"
                filter="url(#goldGlow)"
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Victory Modal */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in overflow-y-auto max-h-full">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              BARN VAULT UNLOCKED! 🧲✨
            </h3>
            <p className="text-amber-300 text-xs sm:text-sm font-bold mb-3">
              You freed the Lucky Horseshoe in {gameState.movesCount} moves!
            </p>
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-xl px-4 py-2 mb-4">
              <span className="text-xs text-slate-400">Total Score: </span>
              <span className="text-lg font-black text-amber-400">{gameState.score}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startLevel(levelNum, true)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 min-h-[44px] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Replay</span>
              </button>
              {levelNum < HORSESHOE_TWIST_LEVELS.length ? (
                <button
                  onClick={() => startLevel(levelNum + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-400/25 min-h-[44px] cursor-pointer"
                >
                  <span>Next Vault</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={() => startLevel(1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-amber-400/25 min-h-[44px] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Play Again</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Ring Selector Tabs */}
      <div className="w-full flex items-center justify-center gap-2 mt-3">
        {gameState.rings.map((ring) => (
          <button
            key={ring.id}
            onClick={() => setSelectedRingId(ring.id)}
            className={`px-3.5 py-2 min-h-[44px] min-w-[60px] flex items-center justify-center rounded-xl font-bold text-xs transition-all cursor-pointer border ${
              selectedRingId === ring.id
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            Ring {ring.id + 1}
          </button>
        ))}
      </div>

      {/* On-Screen Rotation Buttons with Hold-to-Rotate */}
      <div className="w-full flex items-center justify-between gap-3 mt-3 px-1">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            startHoldAction(() => handleRotate(selectedRingId, -30));
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            stopHoldAction();
          }}
          onPointerLeave={stopHoldAction}
          onPointerCancel={stopHoldAction}
          aria-label="Hold to Rotate Counter-Clockwise"
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500/20 rounded-xl border border-amber-500/30 flex items-center justify-center text-white font-black text-xs sm:text-sm gap-2 min-h-[48px] cursor-pointer touch-none select-none transition-all active:scale-97 shadow-md"
        >
          <RotateCcw className="w-4 h-4 text-amber-400" />
          <span>HOLD TO ROTATE CCW</span>
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            startHoldAction(() => handleRotate(selectedRingId, 30));
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            stopHoldAction();
          }}
          onPointerLeave={stopHoldAction}
          onPointerCancel={stopHoldAction}
          aria-label="Hold to Rotate Clockwise"
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-amber-500/20 rounded-xl border border-amber-500/30 flex items-center justify-center text-white font-black text-xs sm:text-sm gap-2 min-h-[48px] cursor-pointer touch-none select-none transition-all active:scale-97 shadow-md"
        >
          <span>HOLD TO ROTATE CW</span>
          <RotateCw className="w-4 h-4 text-amber-400" />
        </button>
      </div>
    </div>
  );
};

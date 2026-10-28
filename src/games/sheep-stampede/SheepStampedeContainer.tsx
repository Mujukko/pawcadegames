import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  SheepStampedeState,
  initializeSheepStampedeLevel,
  steerFlock,
  stepStampedeEngine,
  TRACK_WIDTH,
  SHEEP_STAMPEDE_LEVELS,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Trophy,
  ArrowRight,
  Play,
  ArrowLeft,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { analytics } from '../../lib/analytics';

const VIEW_HEIGHT = 620;
const FLOCK_BASE_Y = 480; // Screen Y where flock is rendered
const TRACK_CENTER = 180; // Center X of the 360px track pathway

export const SheepStampedeContainer: React.FC = () => {
  const [levelNum, setLevelNum] = useState<number>(1);
  const [gameState, setGameState] = useState<SheepStampedeState>(() =>
    initializeSheepStampedeLevel(1)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const stateRef = useRef<SheepStampedeState>(gameState);
  stateRef.current = gameState;

  const startLevel = useCallback((lvl: number, isRestart = false) => {
    setLevelNum(lvl);
    if (isRestart) {
      analytics.gameRestarted('sheep-stampede', { levelId: lvl });
    } else {
      analytics.track('level_started', { gameId: 'sheep-stampede', levelId: lvl });
    }
    const fresh = initializeSheepStampedeLevel(lvl);
    setGameState(fresh);
    stateRef.current = fresh;
    sound.playBark();
  }, []);

  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleStartGame = () => {
    if (gameState.status === 'ready') {
      analytics.gameStarted('sheep-stampede', { levelId: gameState.level });
      sound.playBark();
      sound.playBaa();
      setGameState((prev) => ({ ...prev, status: 'running' }));
    }
  };

  const steeringDirRef = useRef<-1 | 0 | 1>(0);
  const targetXRef = useRef<number | null>(null);

  // Steer flock based on clientX pointer position with target reference
  const updateSteeringFromClientX = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;
    const normalized = (relativeX / rect.width) * TRACK_WIDTH - TRACK_WIDTH / 2;
    targetXRef.current = Math.max(-140, Math.min(140, normalized));
  }, []);

  // Mouse / Touch Drag handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {}
    setIsDragging(true);
    if (stateRef.current.status === 'ready') {
      handleStartGame();
    }
    updateSteeringFromClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging && e.buttons === 0) return;
    updateSteeringFromClientX(e.clientX);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    try {
      (e.target as Element).releasePointerCapture(e.pointerId);
    } catch {}
    setIsDragging(false);
    targetXRef.current = null;
  };

  // Keyboard controls with continuous hold-to-steer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        e.preventDefault();
        if (stateRef.current.status === 'ready') handleStartGame();
        steeringDirRef.current = -1;
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        e.preventDefault();
        if (stateRef.current.status === 'ready') handleStartGame();
        steeringDirRef.current = 1;
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (stateRef.current.status === 'ready') {
          handleStartGame();
        } else if (stateRef.current.status === 'won') {
          if (levelNum < SHEEP_STAMPEDE_LEVELS.length) {
            startLevel(levelNum + 1);
          } else {
            startLevel(1);
          }
        } else if (stateRef.current.status === 'lost') {
          startLevel(levelNum);
        }
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        startLevel(levelNum);
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleToggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
        if (steeringDirRef.current === -1) steeringDirRef.current = 0;
      } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
        if (steeringDirRef.current === 1) steeringDirRef.current = 0;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [levelNum, startLevel]);

  // Main 60 FPS animation / physics loop with continuous smooth steering
  useEffect(() => {
    const loop = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = time;

      if (stateRef.current.status === 'running') {
        let currentFlockX = stateRef.current.flockX;

        // 1. Continuous button/key steering
        if (steeringDirRef.current !== 0) {
          const steerSpeed = 280; // px / sec
          currentFlockX += steeringDirRef.current * steerSpeed * dt;
          currentFlockX = Math.max(-140, Math.min(140, currentFlockX));
          stateRef.current.flockX = currentFlockX;
        } else if (targetXRef.current !== null) {
          // 2. Smooth touch drag tracking (lerp for fluid natural movement)
          const diff = targetXRef.current - currentFlockX;
          currentFlockX += diff * Math.min(1, 18 * dt);
          currentFlockX = Math.max(-140, Math.min(140, currentFlockX));
          stateRef.current.flockX = currentFlockX;
        }

        const { nextState, events } = stepStampedeEngine(stateRef.current, dt);
        nextState.flockX = currentFlockX;

        if (events.gateHit) {
          sound.playGateChime(events.gateHit.isPositive);
          if (events.gateHit.isPositive) {
            sound.playBaa();
          }
        }
        if (events.obstacleHit) {
          sound.playSplash();
        }
        if (events.victory) {
          analytics.levelCompleted('sheep-stampede', {
            levelId: nextState.level,
            score: nextState.score,
            flockCount: nextState.flockCount,
          });
          sound.playVictory();
          sound.playBark();
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }

        if (nextState.status === 'lost') {
          analytics.levelFailed('sheep-stampede', {
            levelId: nextState.level,
            score: nextState.score,
            flockCount: 0,
          });
        }

        setGameState(nextState);
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const progressPct = Math.min(
    100,
    Math.round((gameState.trackProgress / gameState.trackLength) * 100)
  );

  // Calculate upcoming gates for lookahead radar
  const upcomingGates = gameState.gates
    .filter((g) => !g.collected && g.distY > gameState.trackProgress)
    .sort((a, b) => a.distY - b.distY);
  const nextPairDist = upcomingGates.length > 0 ? upcomingGates[0].distY - gameState.trackProgress : 9999;
  const showLookahead = gameState.status === 'running' && nextPairDist < 520 && upcomingGates.length >= 2;
  const leftGateUpcoming = upcomingGates.find((g) => g.lane === 'left');
  const rightGateUpcoming = upcomingGates.find((g) => g.lane === 'right');

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto select-none touch-none">
      {/* Top HUD */}
      <div className="w-full bg-slate-900/95 border border-emerald-500/30 rounded-2xl p-3 mb-2 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐕</span>
          <div>
            <div className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">
              Level {gameState.level} / {SHEEP_STAMPEDE_LEVELS.length}
            </div>
            <div className="text-xs font-black text-white flex items-center gap-1.5">
              <span>Flock:</span>
              <span className="text-emerald-300 text-sm font-black font-mono px-2 py-0.5 bg-emerald-950/70 rounded-lg border border-emerald-500/50">
                {gameState.flockCount} 🐑
              </span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="flex-1 mx-3 max-w-[140px]">
          <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-0.5">
            <span>Meadow</span>
            <span>Barn 🏡</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-emerald-500/30">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-100"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400">Score</div>
            <div className="text-sm font-black font-mono text-amber-400">{gameState.score}</div>
          </div>

          <button
            onClick={() => startLevel(levelNum, true)}
            title="Restart Level (R)"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleToggleSound}
            title="Toggle Sound (M)"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center cursor-pointer transition-colors active:scale-95"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </div>

      {/* Main Game Track Container */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="relative w-full h-[560px] sm:h-[620px] max-h-[72vh] bg-gradient-to-b from-sky-400 via-emerald-600 to-emerald-800 rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl cursor-ew-resize"
      >
        {/* Floating Lookahead Radar HUD */}
        {showLookahead && leftGateUpcoming && rightGateUpcoming && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3.5 py-1.5 bg-slate-950/90 backdrop-blur-md rounded-full border border-emerald-400/50 shadow-xl text-xs font-black animate-pulse">
            <span className="text-amber-300 flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider">
              ⚡ NEXT
            </span>
            <div className="flex items-center gap-1.5">
              <span
                className={`px-2 py-0.5 rounded-lg border font-mono text-xs font-black ${
                  leftGateUpcoming.isPositive
                    ? 'bg-blue-600/70 text-cyan-200 border-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    : 'bg-rose-600/70 text-rose-200 border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                }`}
              >
                ⬅️ {leftGateUpcoming.label}
              </span>
              <span className="text-slate-400 text-[10px] font-bold">vs</span>
              <span
                className={`px-2 py-0.5 rounded-lg border font-mono text-xs font-black ${
                  rightGateUpcoming.isPositive
                    ? 'bg-blue-600/70 text-cyan-200 border-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.4)]'
                    : 'bg-rose-600/70 text-rose-200 border-rose-400/60 shadow-[0_0_8px_rgba(244,63,94,0.4)]'
                }`}
              >
                {rightGateUpcoming.label} ➡️
              </span>
            </div>
          </div>
        )}

        {/* Track Pathway */}
        <div className="absolute inset-0 flex justify-center">
          <div className="w-[360px] h-full bg-gradient-to-b from-amber-100 via-amber-200 to-amber-300 border-x-4 border-amber-600/30 relative overflow-hidden">
            {/* Dashed center lane lines moving downward */}
            <div
              className="absolute left-1/2 -translate-x-1/2 w-2 h-[200%] border-r-2 border-dashed border-amber-600/40"
              style={{
                transform: `translate(-50%, ${(gameState.trackProgress % 60) - 60}px)`,
              }}
            />

            {/* Finish Line (Barn corral at end of track) */}
            {gameState.trackLength - gameState.trackProgress < 680 && (
              <div
                className="absolute left-0 right-0 h-20 flex flex-col items-center justify-center bg-red-600 border-y-4 border-white shadow-xl text-white font-black text-base z-10"
                style={{
                  top: `${FLOCK_BASE_Y - (gameState.trackLength - gameState.trackProgress)}px`,
                }}
              >
                <span className="tracking-wide drop-shadow">🏡 BARN CORRAL 🏡</span>
                <span className="text-xs text-amber-200 font-bold tracking-wider">RESCUE FINISH LINE</span>
              </div>
            )}

            {/* Gates */}
            {gameState.gates.map((gate) => {
              const relY = FLOCK_BASE_Y - (gate.distY - gameState.trackProgress);
              if (relY < -100 || relY > VIEW_HEIGHT + 100) return null;

              const opIcon =
                gate.op === 'multiply'
                  ? '⚡'
                  : gate.op === 'add'
                  ? '➕'
                  : gate.op === 'subtract'
                  ? '🔻'
                  : '✂️';
              const opTitle =
                gate.op === 'multiply'
                  ? 'MULTIPLIER'
                  : gate.op === 'add'
                  ? 'BOOST'
                  : gate.op === 'subtract'
                  ? 'HAZARD'
                  : 'CUT';

              return (
                <div
                  key={gate.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-2xl px-2.5 py-2 flex flex-col items-center justify-center font-black shadow-2xl border-2 transition-transform ${
                    gate.collected
                      ? 'opacity-20 scale-90'
                      : gate.isPositive
                      ? 'bg-gradient-to-b from-blue-500 via-indigo-600 to-blue-900 text-white border-cyan-300 ring-4 ring-cyan-400/50 shadow-[0_4px_24px_rgba(6,182,212,0.65)]'
                      : 'bg-gradient-to-b from-rose-500 via-red-600 to-rose-950 text-white border-rose-300 ring-4 ring-rose-500/50 shadow-[0_4px_24px_rgba(244,63,94,0.65)]'
                  }`}
                  style={{
                    left: `${TRACK_CENTER + gate.x}px`,
                    top: `${relY}px`,
                    width: `${gate.width}px`,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg sm:text-xl filter drop-shadow">{opIcon}</span>
                    <span className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]">
                      {gate.label}
                    </span>
                  </div>
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                      gate.isPositive
                        ? 'bg-blue-950/80 text-cyan-200 border border-cyan-400/40'
                        : 'bg-rose-950/80 text-rose-200 border border-rose-400/40'
                    }`}
                  >
                    {opTitle}
                  </span>
                </div>
              );
            })}

            {/* Obstacles */}
            {gameState.obstacles.map((obs) => {
              const relY = FLOCK_BASE_Y - (obs.distY - gameState.trackProgress);
              if (relY < -80 || relY > VIEW_HEIGHT + 80) return null;

              return (
                <div
                  key={obs.id}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-xl flex items-center justify-center shadow-lg font-black text-xs sm:text-sm px-2 ${
                    obs.type === 'mud'
                      ? 'bg-amber-950/95 border-2 border-amber-500 text-amber-200 shadow-amber-950/60'
                      : obs.type === 'shearer'
                      ? 'bg-slate-900/95 border-2 border-red-400 text-red-200 shadow-red-950/60'
                      : 'bg-yellow-900/95 border-2 border-yellow-400 text-yellow-100 shadow-yellow-950/60'
                  } ${obs.hit ? 'opacity-30' : ''}`}
                  style={{
                    left: `${TRACK_CENTER + obs.x}px`,
                    top: `${relY}px`,
                    width: `${obs.width}px`,
                    height: `${obs.height}px`,
                  }}
                >
                  <span className="drop-shadow">
                    {obs.type === 'mud'
                      ? `💩 Mud -${obs.sheepLoss}`
                      : obs.type === 'shearer'
                      ? `✂️ Clip -${obs.sheepLoss}`
                      : `🌾 Hay -${obs.sheepLoss}`}
                  </span>
                </div>
              );
            })}

            {/* The Flock & Buster */}
            <div
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-75 pointer-events-none"
              style={{
                left: `${TRACK_CENTER + gameState.flockX}px`,
                top: `${FLOCK_BASE_Y}px`,
              }}
            >
              {/* Shepherd Dog Buster (Runs ahead of the flock) */}
              <div className="absolute -top-12 -left-4 text-3xl filter drop-shadow-lg animate-bounce">
                🐕
              </div>

              {/* Sheep Circle Cluster */}
              {gameState.sheepList.map((s) => (
                <div
                  key={s.id}
                  className="absolute text-xl filter drop-shadow transform transition-transform"
                  style={{
                    left: `${s.x}px`,
                    top: `${s.y}px`,
                  }}
                >
                  🐑
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <span className="text-6xl mb-3 animate-bounce">🐕🐑</span>
            <h3 className="text-2xl font-black text-white mb-1">
              Sheep Stampede: Pasture Rush
            </h3>
            <p className="text-emerald-300 text-xs sm:text-sm font-semibold max-w-xs mb-4">
              Drag left & right to steer Buster and multiply your flock through math gates!
            </p>
            <button
              onClick={handleStartGame}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center gap-2 shadow-xl shadow-emerald-500/25 transform hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>TAP TO RUSH!</span>
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in overflow-y-auto max-h-full">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mb-3">
              <Trophy className="w-8 h-8 text-yellow-400 animate-bounce" />
            </div>
            <h3 className="text-2xl font-black text-white mb-1">
              PASTURE CLEARED! 🏡
            </h3>
            <p className="text-emerald-300 text-sm font-bold mb-3">
              You safely herded {gameState.flockCount} sheep into the barn!
            </p>
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-xl px-4 py-2 mb-4">
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
              {levelNum < SHEEP_STAMPEDE_LEVELS.length ? (
                <button
                  onClick={() => startLevel(levelNum + 1)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 min-h-[44px] cursor-pointer"
                >
                  <span>Next Pasture</span>
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

        {/* Loss Modal */}
        {gameState.status === 'lost' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in overflow-y-auto max-h-full">
            <span className="text-5xl mb-2">😢🐑</span>
            <h3 className="text-2xl font-black text-white mb-1">FLOCK SCATTERED!</h3>
            <p className="text-red-300 text-xs sm:text-sm font-semibold max-w-xs mb-4">
              You lost all your sheep in the hazards. Avoid red divide gates and mud pits!
            </p>
            <button
              onClick={() => startLevel(levelNum, true)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-red-500 to-amber-500 text-white font-black text-sm flex items-center gap-2 shadow-xl shadow-red-500/25 min-h-[44px] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>TRY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* On-screen continuous touch steering buttons for mobile */}
      <div className="w-full flex items-center justify-between gap-3 mt-2 px-1">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            if (stateRef.current.status === 'ready') handleStartGame();
            steeringDirRef.current = -1;
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            steeringDirRef.current = 0;
          }}
          onPointerCancel={() => { steeringDirRef.current = 0; }}
          onPointerLeave={() => { steeringDirRef.current = 0; }}
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600/30 rounded-xl border-2 border-emerald-500/40 flex items-center justify-center text-white font-black text-xs sm:text-sm gap-2 min-h-[48px] cursor-pointer touch-none select-none transition-all active:scale-97 shadow-lg"
          aria-label="Hold to Steer Left"
        >
          <ArrowLeft className="w-5 h-5 text-emerald-400" />
          <span>HOLD TO STEER LEFT</span>
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            if (stateRef.current.status === 'ready') handleStartGame();
            steeringDirRef.current = 1;
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            steeringDirRef.current = 0;
          }}
          onPointerCancel={() => { steeringDirRef.current = 0; }}
          onPointerLeave={() => { steeringDirRef.current = 0; }}
          className="flex-1 py-3.5 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600/30 rounded-xl border-2 border-emerald-500/40 flex items-center justify-center text-white font-black text-xs sm:text-sm gap-2 min-h-[48px] cursor-pointer touch-none select-none transition-all active:scale-97 shadow-lg"
          aria-label="Hold to Steer Right"
        >
          <span>HOLD TO STEER RIGHT</span>
          <ArrowRight className="w-5 h-5 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};

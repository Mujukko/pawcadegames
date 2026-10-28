import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  fireShot,
  updateGameEngine,
  restartGame,
  GameState,
  Duck,
  Feather,
  WORLD_WIDTH,
  WORLD_HEIGHT,
  BUSH_Y,
} from './logic/engine';
import { duckHuntAudio } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, Crosshair, Award } from 'lucide-react';
import { analytics } from '../../lib/analytics';

interface DuckHuntClassicContainerProps {
  onBack?: () => void;
}

export const DuckHuntClassicContainer: React.FC<DuckHuntClassicContainerProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<GameState>(() => {
    let savedHighScore = 0;
    try {
      savedHighScore = parseInt(localStorage.getItem('pawcade_duckhunt_highscore') || '0', 10);
    } catch {}
    return createInitialState(savedHighScore);
  });

  const [crosshairPos, setCrosshairPos] = useState<{ x: number; y: number } | null>(null);
  const [muzzleFlashes, setMuzzleFlashes] = useState<{ id: string; x: number; y: number }[]>([]);
  const [isMuted, setIsMuted] = useState<boolean>(() => duckHuntAudio.getMuted());

  const stateRef = useRef<GameState>(gameState);
  stateRef.current = gameState;

  const canvasRef = useRef<HTMLDivElement>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const rafRef = useRef<number | null>(null);

  // Sync high score to local storage
  useEffect(() => {
    try {
      if (gameState.highScore > 0) {
        localStorage.setItem('pawcade_duckhunt_highscore', gameState.highScore.toString());
      }
    } catch {}
  }, [gameState.highScore]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let active = true;

    const loop = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const state = stateRef.current;
      const prevPhase = state.phase;
      const prevDogState = state.dog.state;

      updateGameEngine(state, dt);

      // Trigger procedural audio on state transitions
      if (prevDogState !== state.dog.state) {
        if (state.dog.state === 'show_duck') {
          duckHuntAudio.playDogBark();
        } else if (state.dog.state === 'laugh') {
          duckHuntAudio.playDogLaugh();
        }
      }

      if (prevPhase !== state.phase) {
        if (state.phase === 'round_clear') {
          duckHuntAudio.playRoundClearFanfare();
          analytics.levelCompleted('duck-hunt-classic', {
            levelId: state.round,
            score: state.score,
            ducksHit: state.roundHits,
          });
        } else if (state.phase === 'game_over') {
          duckHuntAudio.playGameOverJingle();
          analytics.levelFailed('duck-hunt-classic', {
            levelId: state.round,
            score: state.score,
            quota: state.quota,
          });
        } else if (state.phase === 'intro') {
          duckHuntAudio.playRoundStartFanfare();
          analytics.track('level_started', {
            gameId: 'duck-hunt-classic',
            levelId: state.round,
          });
        }
      }

      // Re-render state
      setGameState({ ...state });

      rafRef.current = requestAnimationFrame(loop);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      active = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Shoot Handler
  const handleFire = useCallback(
    (clientX: number, clientY: number) => {
      const container = canvasRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const scaleX = WORLD_WIDTH / rect.width;
      const scaleY = WORLD_HEIGHT / rect.height;

      const targetX = (clientX - rect.left) * scaleX;
      const targetY = (clientY - rect.top) * scaleY;

      const state = stateRef.current;

      if (state.shells <= 0 && state.phase === 'playing') {
        duckHuntAudio.playEmptyClick();
        return;
      }

      const result = fireShot(state, targetX, targetY);

      if (result.fired) {
        duckHuntAudio.playShotgunBang();

        // Add visual muzzle flash
        const flashId = `flash-${Date.now()}-${Math.random()}`;
        setMuzzleFlashes((prev) => [...prev, { id: flashId, x: targetX, y: targetY }]);
        setTimeout(() => {
          setMuzzleFlashes((prev) => prev.filter((f) => f.id !== flashId));
        }, 120);

        if (result.hit) {
          duckHuntAudio.playDuckQuack();
          setTimeout(() => duckHuntAudio.playDuckFall(), 300);
        }

        setGameState({ ...state });
      }
    },
    []
  );

  // Mouse move for desktop crosshair
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = canvasRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const scaleX = WORLD_WIDTH / rect.width;
    const scaleY = WORLD_HEIGHT / rect.height;
    setCrosshairPos({
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    });
  };

  const handleMouseLeave = () => {
    setCrosshairPos(null);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    handleFire(e.clientX, e.clientY);
  };

  const toggleMute = () => {
    const muted = duckHuntAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = () => {
    const state = stateRef.current;
    analytics.gameRestarted('duck-hunt-classic', { levelId: state.round });
    restartGame(state);
    duckHuntAudio.playRoundStartFanfare();
    setGameState({ ...state });
  };

  // Sky backdrop depending on round
  const getSkyGradient = () => {
    const r = gameState.round;
    if (r <= 3) {
      // Crisp retro daytime blue
      return 'from-sky-400 via-sky-300 to-amber-100';
    } else if (r <= 6) {
      // Warm sunset orange
      return 'from-orange-500 via-amber-400 to-rose-300';
    } else {
      // Twilight violet
      return 'from-indigo-900 via-purple-900 to-slate-900';
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto select-none font-sans">
      {/* Top Arcade Navigation & HUD */}
      <div className="w-full flex items-center justify-between px-3 py-2 bg-slate-950/90 rounded-t-2xl border-t border-x border-slate-700/80 text-white text-xs sm:text-sm font-black shadow-lg">
        <div className="flex items-center gap-3">
          <span className="text-amber-400 flex items-center gap-1.5">
            <span className="text-base">🦆</span>
            <span className="tracking-wider">ROUND {gameState.round}</span>
          </span>
          <span className="hidden sm:inline-block text-slate-400">|</span>
          <span className="hidden sm:inline-block text-emerald-400">
            PASS QUOTA: {gameState.quota}/10
          </span>
        </div>

        {/* Shells Ammo Indicator */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 px-2.5 py-1 rounded-xl border border-red-500/30">
          <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1">
            SHOTS:
          </span>
          {[1, 2, 3].map((num) => (
            <div
              key={num}
              className={`w-3.5 h-6 rounded-xs border transition-all ${
                gameState.shells >= num
                  ? 'bg-gradient-to-t from-red-700 via-red-500 to-amber-400 border-red-400 shadow-[0_0_8px_rgba(239,68,68,0.7)] scale-105'
                  : 'bg-slate-800/80 border-slate-700 opacity-30'
              }`}
              title={`Shell ${num}`}
            />
          ))}
        </div>

        {/* Score & Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[10px] text-slate-400 tracking-wider uppercase">SCORE</div>
            <div className="text-amber-300 font-mono tracking-widest text-sm sm:text-base leading-none">
              {gameState.score.toString().padStart(6, '0')}
            </div>
          </div>

          <button
            onClick={toggleMute}
            aria-label="Toggle Sound"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleRestart}
            aria-label="Restart Game"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Responsive Game Viewport (16:10 Aspect Ratio) */}
      <div
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onPointerDown={handlePointerDown}
        style={{
          aspectRatio: '800 / 500',
          touchAction: 'none',
        }}
        className={`relative w-full overflow-hidden bg-gradient-to-b ${getSkyGradient()} border-x border-slate-700/80 shadow-2xl cursor-crosshair`}
      >
        {/* Retro NES Zapper White CRT Flash on Firing */}
        {gameState.isFlashActive && (
          <div className="absolute inset-0 bg-white/90 z-50 pointer-events-none animate-flash-quick" />
        )}

        {/* Clouds & Sun / Moon in Background */}
        <div className="absolute top-6 left-12 w-28 h-10 bg-white/40 rounded-full blur-[1px] pointer-events-none" />
        <div className="absolute top-14 right-20 w-36 h-12 bg-white/40 rounded-full blur-[1px] pointer-events-none" />
        {gameState.round >= 7 && (
          <div className="absolute top-8 right-12 text-3xl opacity-80 pointer-events-none">🌙</div>
        )}

        {/* Distant Barn & Mountain Silhouettes */}
        <div className="absolute bottom-[90px] left-0 right-0 h-24 flex items-end justify-between px-10 pointer-events-none opacity-40">
          <div className="w-24 h-16 bg-red-800/70 rounded-t-lg relative">
            <div className="absolute -top-6 left-2 w-8 h-8 bg-stone-600 rounded-t-full" />
            <div className="absolute bottom-0 left-8 w-8 h-10 bg-black/60 rounded-t-md" />
          </div>
          <div className="w-48 h-12 bg-emerald-950/60 rounded-t-full" />
        </div>

        {/* Gnarly Rustic Tree on Left */}
        <div className="absolute bottom-[70px] -left-4 pointer-events-none z-10">
          <div className="w-8 sm:w-10 h-64 bg-amber-950 rounded-r-xl relative shadow-lg">
            {/* Tree Foliage */}
            <div className="absolute -top-12 -left-8 w-36 h-36 bg-emerald-800/90 rounded-full blur-[0.5px]" />
            <div className="absolute -top-4 left-6 w-28 h-28 bg-emerald-700/90 rounded-full blur-[0.5px]" />
            <div className="absolute top-12 -left-4 w-32 h-24 bg-emerald-800/90 rounded-full blur-[0.5px]" />
          </div>
        </div>

        {/* Flying & Falling Ducks */}
        {gameState.activeDucks.map((duck: Duck) => {
          const leftPct = (duck.x / WORLD_WIDTH) * 100;
          const topPct = (duck.y / WORLD_HEIGHT) * 100;
          const isHit = duck.state === 'hit_pause' || duck.state === 'falling';
          const isFlyAway = duck.state === 'flying_away';

          return (
            <div
              key={duck.id}
              style={{
                left: `${leftPct}%`,
                top: `${topPct}%`,
                transform: `translate(-50%, -50%) ${
                  duck.facing === 'left' ? 'scaleX(-1)' : 'scaleX(1)'
                } ${isHit ? 'rotate(90deg)' : ''}`,
                transition: isHit ? 'transform 0.1s' : 'none',
              }}
              className="absolute z-20 pointer-events-none"
            >
              {/* Fly Away Alert Badge */}
              {isFlyAway && (
                <div className="absolute -top-7 left-1/2 -translate-x-1/2 whitespace-nowrap bg-red-600 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-red-300 shadow-md animate-bounce">
                  FLY AWAY!
                </div>
              )}

              {/* Render Duck SVG Based on Type & Wing Animation Frame */}
              <div className="relative w-14 h-12 drop-shadow-md">
                {duck.type === 'golden' ? (
                  /* Golden King Duck */
                  <svg viewBox="0 0 54 48" className="w-full h-full">
                    {/* Golden Body */}
                    <ellipse cx="26" cy="28" rx="16" ry="12" fill="#fbbf24" stroke="#d97706" strokeWidth="1.5" />
                    {/* Head */}
                    <circle cx="38" cy="18" r="9" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
                    {/* Crown */}
                    <polygon points="34,10 38,5 42,10 45,5 48,11" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                    {/* Beak */}
                    <polygon points="45,18 53,20 45,23" fill="#ea580c" />
                    {/* Eye */}
                    {isHit ? (
                      <text x="36" y="21" fontSize="9" fontWeight="bold" fill="#000">✕</text>
                    ) : (
                      <circle cx="39" cy="16" r="2.5" fill="#000" />
                    )}
                    {/* Flapping Wing */}
                    {duck.wingFrame === 0 && (
                      <polygon points="18,25 24,10 32,24" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
                    )}
                    {duck.wingFrame === 1 && (
                      <ellipse cx="22" cy="27" rx="10" ry="5" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
                    )}
                    {duck.wingFrame === 2 && (
                      <polygon points="18,27 24,38 32,28" fill="#fde047" stroke="#ca8a04" strokeWidth="1.5" />
                    )}
                  </svg>
                ) : duck.type === 'redhead' ? (
                  /* Crimson Redhead Duck */
                  <svg viewBox="0 0 54 48" className="w-full h-full">
                    <ellipse cx="26" cy="28" rx="16" ry="12" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                    <circle cx="38" cy="18" r="9" fill="#dc2626" stroke="#991b1b" strokeWidth="1.5" />
                    <polygon points="45,18 53,20 45,23" fill="#f97316" />
                    {isHit ? (
                      <text x="36" y="21" fontSize="9" fontWeight="bold" fill="#000">✕</text>
                    ) : (
                      <circle cx="39" cy="16" r="2.5" fill="#000" />
                    )}
                    {/* Flapping Wing */}
                    {duck.wingFrame === 0 && (
                      <polygon points="18,25 22,8 32,24" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
                    )}
                    {duck.wingFrame === 1 && (
                      <ellipse cx="22" cy="27" rx="10" ry="5" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
                    )}
                    {duck.wingFrame === 2 && (
                      <polygon points="18,27 22,40 32,28" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="1.5" />
                    )}
                  </svg>
                ) : (
                  /* Classic Greenhead Mallard */
                  <svg viewBox="0 0 54 48" className="w-full h-full">
                    {/* Brown Body */}
                    <ellipse cx="26" cy="28" rx="16" ry="12" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
                    {/* White Collar Ring */}
                    <ellipse cx="33" cy="22" rx="4" ry="7" fill="#ffffff" />
                    {/* Mallard Emerald Green Head */}
                    <circle cx="38" cy="18" r="9" fill="#059669" stroke="#065f46" strokeWidth="1.5" />
                    {/* Orange Beak */}
                    <polygon points="45,18 53,20 45,23" fill="#f59e0b" />
                    {/* Eye */}
                    {isHit ? (
                      <text x="36" y="21" fontSize="9" fontWeight="bold" fill="#000">✕</text>
                    ) : (
                      <circle cx="39" cy="16" r="2.5" fill="#000" />
                    )}
                    {/* Flapping Wing */}
                    {duck.wingFrame === 0 && (
                      <polygon points="18,25 22,8 32,24" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                    )}
                    {duck.wingFrame === 1 && (
                      <ellipse cx="22" cy="27" rx="10" ry="5" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                    )}
                    {duck.wingFrame === 2 && (
                      <polygon points="18,27 22,40 32,28" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5" />
                    )}
                  </svg>
                )}
              </div>
            </div>
          );
        })}

        {/* Bursting Feather Particles */}
        {gameState.feathers.map((f: Feather, idx: number) => (
          <div
            key={idx}
            style={{
              left: `${(f.x / WORLD_WIDTH) * 100}%`,
              top: `${(f.y / WORLD_HEIGHT) * 100}%`,
              backgroundColor: f.color,
              transform: `rotate(${f.rotation}deg)`,
              opacity: f.life,
            }}
            className="absolute w-2 h-3.5 rounded-full pointer-events-none shadow-xs"
          />
        ))}

        {/* Buster the Hunting Pup Animations */}
        {gameState.dog.state !== 'hidden' && (
          <div
            style={{
              left: `${(gameState.dog.x / WORLD_WIDTH) * 100}%`,
              top: `${(gameState.dog.y / WORLD_HEIGHT) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-15 pointer-events-none flex flex-col items-center"
          >
            {/* Alert Exclamation on Sniff */}
            {gameState.dog.state === 'intro_sniff' && (
              <span className="text-xl sm:text-2xl font-black text-amber-400 bg-black/60 px-2 py-0.5 rounded-full border border-amber-300 animate-bounce mb-1">
                !
              </span>
            )}

            {/* Buster Dog Mascot Character */}
            <div className="relative w-16 h-20 sm:w-20 sm:h-24">
              <svg viewBox="0 0 60 70" className="w-full h-full drop-shadow-xl">
                {/* Dog Body */}
                <ellipse cx="30" cy="45" rx="16" ry="18" fill="#b45309" stroke="#78350f" strokeWidth="2" />
                {/* White Chest Patch */}
                <ellipse cx="30" cy="47" rx="9" ry="11" fill="#fef3c7" />
                {/* Dog Head */}
                <circle cx="30" cy="24" r="14" fill="#b45309" stroke="#78350f" strokeWidth="2" />
                {/* Floppy Brown Ears */}
                <ellipse cx="14" cy="26" rx="5" ry="11" fill="#78350f" transform="rotate(-15 14 26)" />
                <ellipse cx="46" cy="26" rx="5" ry="11" fill="#78350f" transform="rotate(15 46 26)" />
                {/* White Muzzle */}
                <ellipse cx="30" cy="28" rx="8" ry="6" fill="#fef3c7" />
                <circle cx="30" cy="25" r="3" fill="#000000" />
                {/* Eyes */}
                {gameState.dog.state === 'laugh' ? (
                  /* Laughing squint eyes */
                  <g stroke="#000" strokeWidth="2" fill="none">
                    <path d="M 23 20 Q 26 16 29 20" />
                    <path d="M 31 20 Q 34 16 37 20" />
                  </g>
                ) : (
                  <g fill="#000">
                    <circle cx="25" cy="20" r="2.5" />
                    <circle cx="35" cy="20" r="2.5" />
                  </g>
                )}
                {/* Red Collar */}
                <path d="M 20 34 Q 30 38 40 34" stroke="#dc2626" strokeWidth="3" fill="none" />
                <circle cx="30" cy="37" r="2" fill="#fbbf24" />

                {/* Show Duck Trophy In Paws */}
                {gameState.dog.state === 'show_duck' && (
                  <g transform="translate(18, 2)">
                    <ellipse cx="12" cy="10" rx="8" ry="6" fill="#059669" />
                    <polygon points="18,10 24,12 18,14" fill="#f59e0b" />
                    <text x="8" y="12" fontSize="7" fontWeight="bold">✕</text>
                  </g>
                )}
              </svg>
            </div>
          </div>
        )}

        {/* Foreground Reed Marsh & Grass Line (Z-Index 30 covers lower dog & grass) */}
        <div className="absolute bottom-0 left-0 right-0 h-[92px] pointer-events-none z-30 overflow-hidden">
          {/* Layer 1: Dark Back Grass */}
          <div className="absolute inset-0 bg-gradient-to-t from-emerald-950 via-emerald-800 to-emerald-700" />

          {/* Layer 2: Decorative Reeds & Cattails */}
          <div className="absolute inset-0 flex items-end justify-around px-2 opacity-95">
            {[...Array(24)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  style={{
                    height: `${35 + (i % 5) * 12}px`,
                  }}
                  className="w-1.5 bg-lime-500 rounded-t-full relative"
                >
                  {i % 3 === 0 && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-2.5 h-6 bg-amber-900 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Layer 3: Vibrant Bright Grass Blades */}
          <div className="absolute bottom-0 left-0 right-0 h-9 bg-emerald-600/90 border-t-2 border-lime-400" />
        </div>

        {/* Dynamic Muzzle Flash on Pointer Click */}
        {muzzleFlashes.map((flash) => (
          <div
            key={flash.id}
            style={{
              left: `${(flash.x / WORLD_WIDTH) * 100}%`,
              top: `${(flash.y / WORLD_HEIGHT) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="absolute z-40 pointer-events-none"
          >
            <div className="w-14 h-14 bg-amber-300 rounded-full blur-[2px] opacity-90 animate-ping" />
            <div className="absolute inset-0 flex items-center justify-center text-orange-600 font-black text-xs">
              💥 BANG!
            </div>
          </div>
        ))}

        {/* Desktop Reticle / Crosshair */}
        {crosshairPos && (
          <div
            style={{
              left: `${(crosshairPos.x / WORLD_WIDTH) * 100}%`,
              top: `${(crosshairPos.y / WORLD_HEIGHT) * 100}%`,
              transform: 'translate(-50%, -50%)',
            }}
            className="hidden md:block absolute z-40 pointer-events-none"
          >
            <div className="w-12 h-12 rounded-full border-2 border-red-500/90 flex items-center justify-center shadow-[0_0_12px_rgba(239,68,68,0.8)]">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <div className="absolute w-14 h-0.5 bg-red-500/70" />
              <div className="absolute h-14 w-0.5 bg-red-500/70" />
            </div>
          </div>
        )}

        {/* Round Clear Celebration Banner */}
        {gameState.phase === 'round_clear' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs animate-fade-in p-4 text-center">
            <span className="text-4xl sm:text-5xl mb-2 animate-bounce">🏆</span>
            <h2 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-wider">
              ROUND {gameState.round} CLEAR!
            </h2>
            <p className="text-white text-xs sm:text-sm font-bold mt-1">
              Hits: {gameState.roundHits}/10 • Quota Met!
            </p>
            <div className="mt-3 px-4 py-1.5 rounded-full bg-amber-400 text-slate-950 font-black text-xs">
              Preparing Round {gameState.round + 1}...
            </div>
          </div>
        )}

        {/* Game Over Banner */}
        {gameState.phase === 'game_over' && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-4 text-center">
            <span className="text-5xl mb-2">🐕💨</span>
            <h2 className="text-2xl sm:text-4xl font-black text-red-500 tracking-wider">
              GAME OVER
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm font-bold mt-1">
              Missed quota ({gameState.roundHits}/{gameState.quota} ducks needed)
            </p>
            <div className="my-4 bg-slate-900/90 border border-slate-700 p-3 rounded-2xl w-60">
              <div className="text-xs text-slate-400">FINAL SCORE</div>
              <div className="text-2xl font-black text-amber-300 font-mono">
                {gameState.score.toLocaleString()}
              </div>
              <div className="text-[11px] text-emerald-400 font-bold mt-1">
                Round Reached: {gameState.round}
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-all cursor-pointer"
            >
              PLAY AGAIN 🎯
            </button>
          </div>
        )}
      </div>

      {/* Bottom Retro Duck Tracker Strip (Classic NES Style) */}
      <div className="w-full bg-slate-950 px-3 sm:px-6 py-3 rounded-b-2xl border-b border-x border-slate-700/80 text-white shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Tracker 10 Ducks */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400 mr-1">
              HIT:
            </span>
            {gameState.duckTracker.map((status, idx) => (
              <div
                key={idx}
                className={`w-5 h-6 sm:w-6 sm:h-7 rounded-sm flex items-center justify-center text-xs transition-all border ${
                  status === 'hit'
                    ? 'bg-red-600 border-red-400 text-white shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                    : status === 'active'
                    ? 'bg-amber-400 border-amber-200 text-slate-950 animate-pulse'
                    : status === 'miss'
                    ? 'bg-slate-800 border-slate-700 text-slate-600'
                    : 'bg-slate-900 border-slate-700 text-slate-500'
                }`}
                title={`Duck #${idx + 1}: ${status}`}
              >
                {status === 'hit' ? '🦆' : status === 'miss' ? '✕' : status === 'active' ? '●' : '·'}
              </div>
            ))}
          </div>

          {/* Quick How to Aim Prompt for Mobile / Desktop */}
          <div className="text-[11px] sm:text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <span className="text-amber-400">💡 Tip:</span>
            <span>Tap directly on flying ducks to blast them before they escape!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

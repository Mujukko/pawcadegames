import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialTowerState,
  updateCranePosition,
  dropCurrentAnimal,
  resolveAnimalLanding,
  BarnyardTowerState,
  ANIMAL_DEFS,
  BASE_PLATFORM_WIDTH,
  AnimalType,
} from './logic/engine';
import { towerAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Award, Sparkles, Heart } from 'lucide-react';

const HIGH_SCORE_KEY = 'pawcade_barnyard_tower_highscore';

export const BarnyardTowerContainer: React.FC = () => {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [state, setState] = useState<BarnyardTowerState>(() => createInitialTowerState(highScore));
  const [isMuted, setIsMuted] = useState(false);
  const [flashCombo, setFlashCombo] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<BarnyardTowerState>(state);
  stateRef.current = state;

  const lastFrameTimeRef = useRef<number>(performance.now());
  const reqAnimRef = useRef<number>(0);

  // Handle Drop Action
  const triggerDrop = useCallback(() => {
    const curr = stateRef.current;
    if (curr.gameOver || curr.fallingAnimal !== null) return;

    towerAudio.playDrop();
    const nextState = dropCurrentAnimal(curr);
    setState(nextState);
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        triggerDrop();
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = towerAudio.toggleMute();
        setIsMuted(muted);
      } else if ((e.key === 'r' || e.key === 'R') && stateRef.current.gameOver) {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerDrop]);

  // Restart Game
  const restartGame = useCallback(() => {
    const nextState = createInitialTowerState(highScore);
    setState(nextState);
  }, [highScore]);

  // Main game loop (crane oscillation and falling collision)
  useEffect(() => {
    let active = true;

    const gameLoop = (timestamp: number) => {
      if (!active) return;
      const dt = Math.min((timestamp - lastFrameTimeRef.current) / 1000, 0.1);
      lastFrameTimeRef.current = timestamp;

      const curr = stateRef.current;

      if (!curr.gameOver) {
        // 1. Update Crane
        let next = updateCranePosition(curr, dt);

        // 2. Update Falling Animal physics
        if (next.fallingAnimal) {
          const falling = next.fallingAnimal;
          const newY = falling.y + falling.vy * dt;

          // Target landing altitude:
          // Board height is approx 520px. Base cart is at 450px.
          // Each stacked animal adds approx 48px height.
          const landingAltitude = 450 - next.height * 46;

          if (newY >= landingAltitude) {
            // Animal hits stack level
            const result = resolveAnimalLanding(next, 50, 400);
            next = result.state;

            if (result.event === 'perfect') {
              towerAudio.playLand(true);
              setFlashCombo(result.state.combo);
              setTimeout(() => setFlashCombo(null), 800);
            } else if (result.event === 'good') {
              towerAudio.playLand(false);
            } else if (result.event === 'miss') {
              towerAudio.playMiss();
            } else if (result.event === 'milestone') {
              towerAudio.playMilestone();
              confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
            } else if (result.event === 'gameover') {
              towerAudio.playGameOver();
              if (result.state.score > highScore) {
                setHighScore(result.state.score);
                if (typeof window !== 'undefined') {
                  localStorage.setItem(HIGH_SCORE_KEY, result.state.score.toString());
                }
              }
            }
          } else {
            next = {
              ...next,
              fallingAnimal: {
                ...falling,
                y: newY,
              },
            };
          }
        }

        setState(next);
      }

      reqAnimRef.current = requestAnimationFrame(gameLoop);
    };

    reqAnimRef.current = requestAnimationFrame(gameLoop);
    return () => {
      active = false;
      cancelAnimationFrame(reqAnimRef.current);
    };
  }, [highScore]);

  const currDef = ANIMAL_DEFS[state.currentAnimal];

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto h-[620px] select-none bg-gradient-to-b from-sky-400 via-sky-300 to-emerald-200 rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-800/40 flex flex-col touch-none cursor-pointer"
      onClick={triggerDrop}
      style={{ touchAction: 'none' }}
    >
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-slate-900/40 backdrop-blur-md border-b border-white/20 text-white">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Height</span>
            <span className="text-xl font-black leading-tight drop-shadow">{state.height}m</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Score</span>
            <span className="text-xl font-black leading-tight drop-shadow">{state.score}</span>
          </div>
        </div>

        {/* Lives */}
        <div className="flex items-center gap-1 bg-black/30 px-2.5 py-1 rounded-full border border-white/10">
          {[...Array(state.maxLives)].map((_, i) => (
            <Heart
              key={i}
              className={`w-4 h-4 transition-all ${
                i < state.lives ? 'text-rose-500 fill-rose-500 scale-100' : 'text-slate-600 scale-90 opacity-40'
              }`}
            />
          ))}
        </div>

        {/* High Score & Audio */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-amber-300 font-semibold">
            <Award className="w-3.5 h-3.5" />
            <span>{highScore}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              const muted = towerAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 flex items-center justify-center cursor-pointer"
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Floating Clouds Background */}
      <div className="absolute inset-0 pointer-events-none opacity-50 z-0">
        <div className="absolute top-16 left-6 text-4xl animate-pulse">☁️</div>
        <div className="absolute top-28 right-8 text-5xl opacity-80">☁️</div>
        <div className="absolute top-64 left-1/4 text-3xl opacity-60">☁️</div>
      </div>

      {/* Play Area */}
      <div className="relative flex-1 w-full overflow-hidden">
        {/* Crane Structure at Top */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-amber-900/60 shadow z-10" />

        {/* Swinging Crane Hook & Current Animal */}
        {!state.fallingAnimal && !state.gameOver && (
          <div
            className="absolute top-0 transition-transform pointer-events-none z-10 flex flex-col items-center"
            style={{
              left: `${state.craneX}%`,
              transform: 'translateX(-50%)',
            }}
          >
            {/* Cable */}
            <div className="w-1 h-14 bg-amber-950/80 shadow-sm" />
            {/* Hook */}
            <div className="w-5 h-4 border-2 border-amber-950 rounded-b-full bg-amber-800 -mt-1 shadow-md" />
            {/* Ready Animal on Crane */}
            <div
              className="mt-1 flex items-center justify-center rounded-2xl shadow-lg border-3 transition-transform animate-bounce"
              style={{
                width: `${currDef.width}px`,
                height: `${currDef.height}px`,
                backgroundColor: currDef.color,
                borderColor: currDef.borderColor,
              }}
            >
              <span className="text-3xl filter drop-shadow select-none">{currDef.emoji}</span>
            </div>
          </div>
        )}

        {/* Active Falling Animal */}
        {state.fallingAnimal && (
          <div
            className="absolute pointer-events-none z-10 flex items-center justify-center rounded-2xl shadow-xl border-3"
            style={{
              left: `${state.fallingAnimal.x}%`,
              top: `${state.fallingAnimal.y}px`,
              width: `${state.fallingAnimal.width}px`,
              height: `${state.fallingAnimal.height}px`,
              transform: 'translateX(-50%)',
              backgroundColor: ANIMAL_DEFS[state.fallingAnimal.type].color,
              borderColor: ANIMAL_DEFS[state.fallingAnimal.type].borderColor,
            }}
          >
            <span className="text-3xl filter drop-shadow select-none">
              {ANIMAL_DEFS[state.fallingAnimal.type].emoji}
            </span>
          </div>
        )}

        {/* Stack Viewport (translates downward as tower grows) */}
        <div
          className="absolute inset-x-0 bottom-16 pointer-events-none transition-transform duration-300 flex flex-col items-center justify-end"
          style={{
            transform: `translateY(${Math.max(0, (state.height - 4) * 44)}px) rotate(${state.wobble * 0.4}deg)`,
            transformOrigin: 'bottom center',
          }}
        >
          {/* Stacked Animals */}
          <div className="relative flex flex-col-reverse items-center">
            {state.stackedAnimals.map((animal, idx) => {
              const def = ANIMAL_DEFS[animal.type];
              return (
                <div
                  key={animal.id}
                  className="relative flex items-center justify-center rounded-2xl shadow-md border-3 transition-transform -mb-2"
                  style={{
                    width: `${animal.width}px`,
                    height: `${animal.height}px`,
                    backgroundColor: def.color,
                    borderColor: def.borderColor,
                    transform: `translateX(${(animal.x - 200) * 0.45}px) rotate(${animal.rotation}deg)`,
                  }}
                >
                  <span className="text-3xl filter drop-shadow select-none">{def.emoji}</span>
                  {animal.isPerfect && (
                    <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-amber-400 fill-amber-400 animate-spin" />
                  )}
                  <span className="absolute bottom-0.5 right-1 text-[9px] font-black text-slate-700/60">
                    {idx + 1}
                  </span>
                </div>
              );
            })}

            {/* Farm Hay Wagon Base */}
            <div
              className="relative flex flex-col items-center justify-center bg-amber-700 border-4 border-amber-950 rounded-xl shadow-xl z-0"
              style={{ width: `${BASE_PLATFORM_WIDTH}px`, height: '42px' }}
            >
              <div className="text-xs font-black tracking-wider text-amber-100 uppercase drop-shadow flex items-center gap-1">
                🌾 HAY CART 🚜
              </div>
              <div className="absolute -bottom-3 flex justify-between w-full px-2">
                <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700" />
                <div className="w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700" />
              </div>
            </div>
          </div>
        </div>

        {/* Lush Green Farm Ground */}
        <div className="absolute bottom-0 inset-x-0 h-16 bg-gradient-to-t from-emerald-800 to-emerald-600 border-t-4 border-emerald-900 flex items-center justify-center z-0">
          <span className="text-xs font-bold text-emerald-200/90 tracking-widest uppercase">
            🌱 Barnyard Pasture Ground 🌱
          </span>
        </div>

        {/* Combo Flash Banner */}
        {flashCombo && flashCombo > 1 && (
          <div className="absolute top-24 inset-x-0 flex justify-center z-30 pointer-events-none animate-bounce">
            <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white font-black px-4 py-1 rounded-full shadow-2xl border-2 border-white flex items-center gap-1.5 text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              PERFECT STACK x{flashCombo}!
            </div>
          </div>
        )}

        {/* Wobble Warning Meter */}
        {Math.abs(state.wobble) > 14 && !state.gameOver && (
          <div className="absolute top-20 inset-x-0 flex justify-center z-30 pointer-events-none">
            <div className="bg-rose-600/90 text-white font-black px-3 py-0.5 rounded-full text-xs shadow-lg animate-pulse flex items-center gap-1">
              ⚠️ TOWER TILTING! ({Math.round(state.wobble)}°)
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action Prompt */}
      {!state.gameOver && (
        <div className="relative z-20 py-2.5 bg-slate-900/60 backdrop-blur-sm border-t border-white/10 text-center text-white/90 text-xs font-semibold">
          Tap or Press <kbd className="px-2 py-0.5 bg-white/20 rounded font-mono text-[10px]">SPACE</kbd> to Drop Animal!
        </div>
      )}

      {/* Game Over Modal */}
      {state.gameOver && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn"
        >
          <div className="text-5xl mb-2 animate-bounce">🐮💥</div>
          <h2 className="text-2xl font-black text-rose-400 tracking-wide uppercase mb-1">Tower Toppled!</h2>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            The barnyard animals reached an epic height of <strong className="text-amber-300">{state.height}m</strong>!
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-5">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Final Score</span>
              <span className="text-xl font-black text-amber-400">{state.score}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Best Height</span>
              <span className="text-xl font-black text-emerald-400">{state.height} Animals</span>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              restartGame();
            }}
            className="w-full max-w-xs min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-white font-black text-sm tracking-wider uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Stack Again
          </button>
        </div>
      )}
    </div>
  );
};

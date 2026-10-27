import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  createInitialGardenState,
  updateGardenState,
  tapGardenMound,
  GopherGardenState,
  GardenMound,
  VegetableType,
} from './logic/engine';
import { gopherAudio } from './systems/sound';
import { Volume2, VolumeX, RotateCcw, Clock, Award, Flame, Sparkles } from 'lucide-react';

const HIGH_SCORE_KEY = 'pawcade_gopher_garden_highscore';

const VEGGIE_EMOJIS: Record<VegetableType, string> = {
  carrot: '🥕',
  corn: '🌽',
  pumpkin: '🎃',
};

export const GopherGardenContainer: React.FC = () => {
  const [highScore, setHighScore] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(HIGH_SCORE_KEY);
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [state, setState] = useState<GopherGardenState>(() => createInitialGardenState(highScore));
  const [isMuted, setIsMuted] = useState(false);
  const [floatPoints, setFloatPoints] = useState<{ id: number; moundId: number; text: string; color: string }[]>([]);

  const stateRef = useRef<GopherGardenState>(state);
  stateRef.current = state;
  const lastTimeRef = useRef<number>(performance.now());
  const reqAnimRef = useRef<number>(0);

  // Whack a mound
  const handleTapMound = useCallback((moundId: number) => {
    const curr = stateRef.current;
    if (curr.gameOver) return;

    const result = tapGardenMound(curr, moundId);
    setState(result.state);

    if (result.hit) {
      if (result.type === 'golden') {
        gopherAudio.playGolden();
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.5 } });
      } else {
        gopherAudio.playWhack();
      }

      // Add float text
      const floatId = Date.now() + Math.random();
      const pointsText = `+${result.pointsEarned}`;
      const color = result.type === 'golden' ? 'text-amber-300' : 'text-emerald-300';
      setFloatPoints((prev) => [...prev, { id: floatId, moundId, text: pointsText, color }]);
      setTimeout(() => {
        setFloatPoints((prev) => prev.filter((p) => p.id !== floatId));
      }, 700);
    } else if (result.type === 'thistle') {
      gopherAudio.playThistle();
      const floatId = Date.now() + Math.random();
      setFloatPoints((prev) => [...prev, { id: floatId, moundId, text: '-150', color: 'text-rose-400' }]);
      setTimeout(() => {
        setFloatPoints((prev) => prev.filter((p) => p.id !== floatId));
      }, 700);
    }
  }, []);

  // Keyboard support (Keys 1-9 corresponding to 3x3 numpad / number keys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9) {
        // Map 1-9 to 0-8
        handleTapMound(num - 1);
      } else if (e.key === 'm' || e.key === 'M') {
        const muted = gopherAudio.toggleMute();
        setIsMuted(muted);
      } else if ((e.key === 'r' || e.key === 'R') && stateRef.current.gameOver) {
        restartGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTapMound]);

  const restartGame = useCallback(() => {
    const nextState = createInitialGardenState(highScore);
    setState(nextState);
  }, [highScore]);

  // Game loop
  useEffect(() => {
    let active = true;

    const loop = (timestamp: number) => {
      if (!active) return;
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const curr = stateRef.current;
      if (!curr.gameOver) {
        const next = updateGardenState(curr, dt);
        if (next.gameOver && !curr.gameOver) {
          gopherAudio.playGameOver();
          if (next.score > highScore) {
            setHighScore(next.score);
            if (typeof window !== 'undefined') {
              localStorage.setItem(HIGH_SCORE_KEY, next.score.toString());
            }
          }
        }
        setState(next);
      }

      reqAnimRef.current = requestAnimationFrame(loop);
    };

    reqAnimRef.current = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(reqAnimRef.current);
    };
  }, [highScore]);

  return (
    <div
      className={`relative w-full max-w-md mx-auto h-[620px] select-none rounded-3xl overflow-hidden shadow-2xl border-4 flex flex-col touch-none transition-colors duration-500 ${
        state.isFrenzy
          ? 'border-amber-400 bg-gradient-to-b from-amber-900 via-stone-800 to-amber-950 shadow-[0_0_25px_rgba(251,191,36,0.35)]'
          : 'border-amber-900/60 bg-gradient-to-b from-amber-950 via-stone-900 to-emerald-950'
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Top HUD */}
      <div className="relative z-20 flex items-center justify-between px-4 py-3 bg-slate-900/50 backdrop-blur-md border-b border-white/10 text-white">
        <div className="flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Score</span>
            <span className="text-xl font-black leading-tight drop-shadow">{state.score}</span>
          </div>

          {state.combo > 1 && (
            <div className="flex items-center gap-1 bg-amber-500/30 px-2 py-0.5 rounded-full border border-amber-400/40 text-amber-300 font-black text-xs animate-bounce">
              <Flame className="w-3.5 h-3.5 fill-amber-400" />
              <span>x{state.combo}</span>
            </div>
          )}
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1 rounded-full border border-white/20">
          <Clock className={`w-4 h-4 ${state.timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-amber-400'}`} />
          <span
            className={`font-mono text-base font-black ${
              state.timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'
            }`}
          >
            {Math.ceil(state.timeLeft)}s
          </span>
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
              const muted = gopherAudio.toggleMute();
              setIsMuted(muted);
            }}
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-white/20 hover:bg-white/30 text-white transition active:scale-95 flex items-center justify-center cursor-pointer"
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Harvest Frenzy Banner */}
      {state.isFrenzy && (
        <div className="relative z-20 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 font-black text-xs py-1 px-4 flex items-center justify-center gap-2 tracking-wider uppercase shadow-md animate-pulse">
          <Sparkles className="w-4 h-4" />
          HARVEST FRENZY! 2X POINTS & FAST SPAWNS! ({Math.ceil(state.frenzyTimeLeft)}s)
        </div>
      )}

      {/* 3x3 Garden Patch Grid */}
      <div className="relative flex-1 p-4 grid grid-cols-3 gap-3 items-center justify-items-center">
        {state.mounds.map((mound) => {
          const isUp = mound.state === 'up';
          const isHit = mound.state === 'hit';

          return (
            <div
              key={mound.id}
              onClick={() => handleTapMound(mound.id)}
              className="relative w-full aspect-square max-w-[100px] min-w-[72px] min-h-[72px] flex flex-col items-center justify-end cursor-pointer active:scale-95 transition-transform"
            >
              {/* Floating Point Notification */}
              {floatPoints
                .filter((p) => p.moundId === mound.id)
                .map((p) => (
                  <div
                    key={p.id}
                    className={`absolute -top-4 font-black text-sm drop-shadow-md z-30 pointer-events-none animate-bounce ${p.color}`}
                  >
                    {p.text}
                  </div>
                ))}

              {/* Emerging / Active Creature or Thistle */}
              <div
                className={`absolute inset-x-0 bottom-4 flex items-center justify-center transition-all duration-150 z-10 ${
                  isUp
                    ? 'translate-y-0 opacity-100 scale-100'
                    : isHit
                    ? 'translate-y-2 opacity-80 scale-90'
                    : 'translate-y-10 opacity-0 scale-75 pointer-events-none'
                }`}
              >
                {mound.content === 'normal' && (
                  <div className="w-16 h-16 rounded-full bg-amber-700 border-3 border-amber-950 flex flex-col items-center justify-center shadow-lg">
                    <span className="text-3xl select-none filter drop-shadow">🐹</span>
                    <span className="absolute -top-2 text-xs">🥕</span>
                  </div>
                )}

                {mound.content === 'golden' && (
                  <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-3 border-amber-600 flex flex-col items-center justify-center shadow-[0_0_15px_rgba(251,191,36,0.8)] animate-pulse">
                    <span className="text-3xl select-none filter drop-shadow">👑🐹</span>
                  </div>
                )}

                {mound.content === 'thistle' && (
                  <div className="w-16 h-16 rounded-full bg-rose-950/80 border-3 border-rose-500 flex flex-col items-center justify-center shadow-md">
                    <span className="text-3xl select-none filter drop-shadow">🦔🚫</span>
                  </div>
                )}
              </div>

              {/* Garden Soil Mound Base */}
              <div className="relative w-full h-11 bg-amber-950 border-3 border-amber-900 rounded-t-3xl shadow-inner flex items-center justify-center overflow-hidden z-20">
                {/* Vegetable growing in patch */}
                <span className="text-sm select-none opacity-90 drop-shadow">
                  {VEGGIE_EMOJIS[mound.vegetable]}
                </span>
                {/* Number Key hint */}
                <span className="absolute bottom-0.5 right-1.5 text-[8px] font-mono text-amber-500/50">
                  {mound.id + 1}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Hint */}
      <div className="relative z-20 py-2.5 bg-slate-900/60 backdrop-blur-sm border-t border-white/10 text-center text-white/80 text-xs font-semibold">
        Tap gophers before they steal vegetables! Avoid spiky creatures (🦔)!
      </div>

      {/* Game Over Modal */}
      {state.gameOver && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn"
        >
          <div className="text-5xl mb-2 animate-bounce">🥕🏆</div>
          <h2 className="text-2xl font-black text-amber-400 tracking-wide uppercase mb-1">Harvest Time Up!</h2>
          <p className="text-xs text-slate-300 max-w-xs mb-4">
            You protected Farmer Giles' vegetable patch and earned a bounty!
          </p>

          <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-5">
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Total Score</span>
              <span className="text-xl font-black text-amber-400">{state.score}</span>
            </div>
            <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700">
              <span className="block text-[10px] text-slate-400 uppercase font-bold">Gophers Whacked</span>
              <span className="text-xl font-black text-emerald-400">{state.totalWhacked}</span>
            </div>
          </div>

          <button
            onClick={restartGame}
            className="w-full max-w-xs min-h-[48px] py-3 px-6 rounded-2xl bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-white font-black text-sm tracking-wider uppercase shadow-xl transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

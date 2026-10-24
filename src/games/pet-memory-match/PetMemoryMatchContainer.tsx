import React, { useState, useEffect, useRef } from 'react';
import {
  createInitialMemoryState,
  flipCard,
  processMismatch,
  activatePeek,
  freezeTimer,
  updateMemoryTimer,
  MemoryGameState,
  MemoryCard,
  MEMORY_LEVELS,
} from './logic/engine';
import { memorySound } from './systems/sound';
import { RotateCcw, Volume2, VolumeX, Eye, Snowflake, Star, Clock, Trophy } from 'lucide-react';

interface PetMemoryMatchContainerProps {
  onBack?: () => void;
}

export const PetMemoryMatchContainer: React.FC<PetMemoryMatchContainerProps> = () => {
  const [level, setLevel] = useState<number>(1);
  const [gameState, setGameState] = useState<MemoryGameState>(() => {
    let savedHighScore = 0;
    try {
      savedHighScore = parseInt(localStorage.getItem('pawcade_memory_highscore') || '0', 10);
    } catch {}
    return createInitialMemoryState(1, savedHighScore);
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => memorySound.getMuted());
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; text: string }[]>([]);

  const stateRef = useRef<MemoryGameState>(gameState);
  stateRef.current = gameState;

  const mismatchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync high score to localStorage
  useEffect(() => {
    try {
      if (gameState.highScore > 0) {
        localStorage.setItem('pawcade_memory_highscore', gameState.highScore.toString());
      }
    } catch {}
  }, [gameState.highScore]);

  // 60 FPS Game Loop for countdown and peek timers
  useEffect(() => {
    let active = true;
    let lastTime = performance.now();

    const loop = (now: number) => {
      if (!active) return;
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const state = stateRef.current;
      const prevGameOver = state.isGameOver;

      updateMemoryTimer(state, dt);

      if (!prevGameOver && state.isGameOver) {
        memorySound.playGameOverBuzzer();
      }

      setGameState({ ...state });
      requestAnimationFrame(loop);
    };

    const rafId = requestAnimationFrame(loop);
    return () => {
      active = false;
      cancelAnimationFrame(rafId);
      if (mismatchTimeoutRef.current) clearTimeout(mismatchTimeoutRef.current);
    };
  }, []);

  // Card click handler
  const handleCardClick = (index: number, clientX: number, clientY: number) => {
    const state = stateRef.current;
    if (state.isComplete || state.isGameOver) return;

    const card = state.cards[index];
    if (!card || card.isFlipped || card.isMatched) return;

    // Clear any pending mismatch timer so previous cards flip back immediately
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
      processMismatch(state);
    }

    memorySound.playCardFlip();

    const nextState = { ...state, cards: [...state.cards] };
    const result = flipCard(nextState, index);

    if (result.action === 'match') {
      memorySound.playMatchSuccess(result.comboStreak);

      // Spawn floating score particle
      const pId = `part-${Date.now()}`;
      setParticles((prev) => [
        ...prev,
        {
          id: pId,
          x: clientX,
          y: clientY,
          text: `+${result.pointsAwarded} ${result.comboStreak > 1 ? `x${result.comboStreak}!` : ''}`,
        },
      ]);
      setTimeout(() => {
        setParticles((prev) => prev.filter((p) => p.id !== pId));
      }, 1000);

      if (result.isGameComplete) {
        memorySound.playVictoryFanfare();
      }
    } else if (result.action === 'mismatch') {
      memorySound.playMismatch();

      // Delay flip back so player can memorize cards (0.75s)
      mismatchTimeoutRef.current = setTimeout(() => {
        const cur = stateRef.current;
        processMismatch(cur);
        setGameState({ ...cur });
        mismatchTimeoutRef.current = null;
      }, 750);
    }

    setGameState(nextState);
  };

  const handlePeek = () => {
    const state = stateRef.current;
    const activated = activatePeek(state);
    if (activated) {
      memorySound.playPeek();
      setGameState({ ...state });
    }
  };

  const handleFreeze = () => {
    const state = stateRef.current;
    freezeTimer(state, 10);
    memorySound.playPeek();
    setGameState({ ...state });
  };

  const handleRestart = (newLevel: number = level) => {
    if (mismatchTimeoutRef.current) {
      clearTimeout(mismatchTimeoutRef.current);
      mismatchTimeoutRef.current = null;
    }
    const nextState = createInitialMemoryState(newLevel, gameState.highScore);
    setLevel(newLevel);
    setGameState(nextState);
  };

  const toggleMute = () => {
    const muted = memorySound.toggleMute();
    setIsMuted(muted);
  };

  // Determine grid columns based on level
  const getGridColsClass = () => {
    if (level === 1) return 'grid-cols-4'; // 3x4 (12 cards)
    if (level === 2) return 'grid-cols-4'; // 4x4 (16 cards)
    if (level === 3) return 'grid-cols-5'; // 4x5 (20 cards)
    return 'grid-cols-6'; // 5x6 (30 cards)
  };

  const timerColor =
    gameState.freezeTimer > 0
      ? 'text-cyan-300'
      : gameState.timeRemaining < 15
      ? 'text-red-400 animate-pulse'
      : gameState.timeRemaining < 30
      ? 'text-amber-300'
      : 'text-emerald-300';

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto select-none font-sans">
      {/* Top HUD Bar */}
      <div className="w-full flex items-center justify-between px-3 py-2.5 bg-slate-950/95 rounded-t-2xl border-t border-x border-slate-700/80 text-white shadow-xl">
        {/* Level Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {[
            { id: 1, label: 'L1: 12', pairs: 6 },
            { id: 2, label: 'L2: 16', pairs: 8 },
            { id: 3, label: 'L3: 20', pairs: 10 },
            { id: 4, label: 'L4: 30', pairs: 15 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleRestart(tab.id)}
              className={`px-2 py-1 rounded-xl text-xs font-black transition-all cursor-pointer ${
                level === tab.id
                  ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/30 scale-102'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white border border-slate-700/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Center: Timer & Moves */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Clock className={`w-4 h-4 ${timerColor}`} />
            <span className={`text-sm sm:text-base font-mono font-black ${timerColor}`}>
              {gameState.freezeTimer > 0 ? `❄️ ${Math.ceil(gameState.freezeTimer)}s` : `${Math.ceil(gameState.timeRemaining)}s`}
            </span>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">MOVES</span>
            <span className="text-xs sm:text-sm font-black text-slate-200">{gameState.moves}</span>
          </div>

          {gameState.comboStreak > 1 && (
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs animate-pulse shadow-md">
              x{gameState.comboStreak}!
            </span>
          )}

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SCORE</span>
            <span className="text-xs sm:text-sm font-mono font-black text-amber-300">
              {gameState.score.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Audio & Restart */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleMute}
            aria-label="Toggle Sound"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>
          <button
            onClick={() => handleRestart(level)}
            aria-label="Restart Game"
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
          </button>
        </div>
      </div>

      {/* Main Card Flip Arena */}
      <div
        style={{
          aspectRatio: '16 / 10',
          touchAction: 'none',
        }}
        className="relative w-full overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-x border-slate-700/80 p-3 sm:p-5 shadow-2xl flex items-center justify-center"
      >
        {/* Soft Barnyard Table Backdrop */}
        <div className="absolute inset-2 sm:inset-4 rounded-2xl border border-purple-500/20 bg-purple-950/20 backdrop-blur-xs pointer-events-none" />

        {/* Dynamic Card Grid */}
        <div className={`grid ${getGridColsClass()} gap-2 sm:gap-3 w-full h-full max-w-3xl z-10`}>
          {gameState.cards.map((card: MemoryCard, index: number) => {
            const isCardFaceUp = card.isFlipped || card.isMatched || gameState.peekActive;

            return (
              <div
                key={card.id}
                style={{ perspective: '1000px' }}
                className="w-full h-full flex items-center justify-center"
              >
                <button
                  onClick={(e) => handleCardClick(index, e.clientX, e.clientY)}
                  disabled={card.isMatched || isCardFaceUp}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isCardFaceUp ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  }}
                  className={`relative w-full h-full rounded-xl sm:rounded-2xl transition-transform duration-300 shadow-md ${
                    card.isMatched
                      ? 'cursor-default ring-2 ring-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                      : 'cursor-pointer hover:scale-103 active:scale-97'
                  }`}
                >
                  {/* CARD BACK (Rustic Red Barn Wood with Golden Paw Print) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-br from-red-800 via-amber-900 to-slate-950 border-2 border-red-500/40 p-2 flex flex-col items-center justify-center shadow-inner"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-red-950/60 border border-amber-400/40 flex items-center justify-center text-xl sm:text-2xl shadow-inner drop-shadow-md">
                      🐾
                    </div>
                  </div>

                  {/* CARD FACE (Animal Mascot + Label) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className={`absolute inset-0 rounded-xl sm:rounded-2xl p-1.5 sm:p-2 flex flex-col items-center justify-between border-2 shadow-lg ${
                      card.isMatched
                        ? 'bg-gradient-to-b from-emerald-100 to-teal-50 border-emerald-400'
                        : 'bg-gradient-to-b from-amber-50 to-orange-50 border-amber-300'
                    }`}
                  >
                    <div className="w-full flex items-center justify-between text-[10px] text-amber-700/80 font-bold px-1">
                      <span>✨</span>
                      <span>{card.isMatched ? '✓' : ''}</span>
                    </div>

                    <span className="text-3xl sm:text-5xl drop-shadow-sm select-none leading-none">
                      {card.icon}
                    </span>

                    <span className="text-[9px] sm:text-[11px] font-black uppercase text-amber-950 truncate max-w-full leading-none">
                      {card.label}
                    </span>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {/* Floating Particle Scores */}
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y - 30}px`,
            }}
            className="fixed pointer-events-none z-50 text-sm sm:text-base font-black text-amber-300 drop-shadow-md animate-fade-out"
          >
            {p.text}
          </div>
        ))}

        {/* Level Victory Celebration Overlay */}
        {gameState.isComplete && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md animate-fade-in p-6 text-center">
            {/* Stars */}
            <div className="flex items-center gap-2 mb-2 animate-bounce">
              {[...Array(3)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-8 h-8 sm:w-10 sm:h-10 ${
                    i < gameState.stars ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                  }`}
                />
              ))}
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-amber-300 tracking-wider">
              STAGE COMPLETE!
            </h2>
            <p className="text-slate-200 text-xs sm:text-sm font-bold mt-1">
              Cleared in {gameState.moves} moves with {Math.ceil(gameState.timeRemaining)}s remaining!
            </p>

            <div className="my-4 bg-slate-900/90 border border-slate-700 p-3.5 rounded-2xl w-64 shadow-xl">
              <div className="text-[11px] text-slate-400 uppercase tracking-wider">TOTAL SCORE</div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                {gameState.score.toLocaleString()}
              </div>
            </div>

            <button
              onClick={() => handleRestart(level < 4 ? level + 1 : 1)}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/30 transform hover:scale-105 transition-all cursor-pointer"
            >
              {level < 4 ? `PLAY LEVEL ${level + 1} 🚀` : 'REPLAY LEVEL 1 🔄'}
            </button>
          </div>
        )}

        {/* Time's Up Game Over Overlay */}
        {gameState.isGameOver && !gameState.isComplete && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in p-6 text-center">
            <span className="text-5xl mb-2">⏰💨</span>
            <h3 className="text-2xl sm:text-4xl font-black text-red-500 tracking-wider">
              TIME EXPIRED!
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1">
              Matched {gameState.pairsMatched} of {gameState.config.totalPairs} pairs.
            </p>
            <button
              onClick={() => handleRestart(level)}
              className="mt-4 px-6 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm shadow-xl transition-transform hover:scale-105 cursor-pointer"
            >
              TRY AGAIN 🔄
            </button>
          </div>
        )}
      </div>

      {/* Bottom Boosters & Power-Ups Bar */}
      <div className="w-full bg-slate-950 px-3 sm:px-6 py-3 rounded-b-2xl border-b border-x border-slate-700/80 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Peek Booster */}
          <button
            onClick={handlePeek}
            disabled={gameState.peekCharges <= 0 || gameState.peekActive}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
              gameState.peekCharges > 0 && !gameState.peekActive
                ? 'bg-purple-900/70 hover:bg-purple-800 text-purple-200 border-purple-500/50 cursor-pointer shadow-md'
                : 'bg-slate-800/50 text-slate-500 border-slate-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Peek ({gameState.peekCharges})</span>
          </button>

          {/* Freeze Booster */}
          <button
            onClick={handleFreeze}
            className="px-3 py-1.5 rounded-xl bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 border border-cyan-500/50 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Freeze +10s</span>
          </button>
        </div>

        {/* Tip */}
        <div className="text-[11px] sm:text-xs font-medium text-slate-400 hidden sm:flex items-center gap-1">
          <span className="text-amber-400">💡 Tip:</span>
          <span>Consecutive matching pairs trigger massive score streak multipliers!</span>
        </div>
      </div>
    </div>
  );
};

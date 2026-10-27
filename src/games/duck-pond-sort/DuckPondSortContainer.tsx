import React, { useState, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, Undo2, Trophy, HelpCircle, Sparkles, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  createInitialPondSortState,
  executeMove,
  undoMove,
  canMoveDuck,
  DUCK_COLOR_META,
  MAX_CAPACITY,
  type DuckColor,
  type DuckPondSortState,
} from './logic/engine';
import { duckPondSortAudio } from './systems/sound';

export const DuckPondSortContainer: React.FC = () => {
  const [level, setLevel] = useState(1);
  const [game, setGame] = useState<DuckPondSortState>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pawcade_duck_pond_sort_highscore') : null;
    return createInitialPondSortState(1, saved ? parseInt(saved, 10) : 0);
  });

  const [isMuted, setIsMuted] = useState(false);
  const [shakingColIndex, setShakingColIndex] = useState<number | null>(null);

  const toggleMute = () => {
    const muted = duckPondSortAudio.toggleMute();
    setIsMuted(muted);
  };

  const handleRestart = useCallback(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pawcade_duck_pond_sort_highscore') : null;
    setGame(createInitialPondSortState(level, saved ? parseInt(saved, 10) : 0));
    setShakingColIndex(null);
  }, [level]);

  const handleNextLevel = () => {
    const nextLvl = level + 1;
    setLevel(nextLvl);
    const saved = typeof window !== 'undefined' ? localStorage.getItem('pawcade_duck_pond_sort_highscore') : null;
    setGame(createInitialPondSortState(nextLvl, saved ? parseInt(saved, 10) : 0));
    setShakingColIndex(null);
  };

  const handleUndo = useCallback(() => {
    if (game.moveHistory.length === 0 || game.isWon) return;
    const newState = { ...game };
    if (undoMove(newState)) {
      duckPondSortAudio.playSplash();
      setGame(newState);
    }
  }, [game]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'u' || e.key === 'U') {
        handleUndo();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRestart]);

  const handleColumnClick = (colIndex: number) => {
    if (game.isWon) return;

    // If no column is selected, select this one (if it has ducks)
    if (game.selectedColumnIndex === null) {
      if (game.columns[colIndex].ducks.length === 0) return;
      duckPondSortAudio.playQuack();
      setGame((prev) => ({ ...prev, selectedColumnIndex: colIndex }));
      return;
    }

    // If clicking same column, deselect
    if (game.selectedColumnIndex === colIndex) {
      setGame((prev) => ({ ...prev, selectedColumnIndex: null }));
      return;
    }

    // Attempt move from selectedColumnIndex to colIndex
    const fromIndex = game.selectedColumnIndex;
    const toIndex = colIndex;

    const fromCol = game.columns[fromIndex];
    const toCol = game.columns[toIndex];

    if (!canMoveDuck(fromCol, toCol)) {
      // Invalid move -> shake target column
      duckPondSortAudio.playError();
      setShakingColIndex(toIndex);
      setTimeout(() => setShakingColIndex(null), 400);
      setGame((prev) => ({ ...prev, selectedColumnIndex: null }));
      return;
    }

    // Execute move
    const newState = { ...game };
    const result = executeMove(newState, fromIndex, toIndex);

    if (result.success) {
      duckPondSortAudio.playSplash();
      duckPondSortAudio.playQuack();

      if (result.won) {
        duckPondSortAudio.playVictory();
        if (typeof window !== 'undefined') {
          localStorage.setItem('pawcade_duck_pond_sort_highscore', newState.highScore.toString());
        }
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#facc15', '#f472b6', '#38bdf8', '#22c55e', '#ffffff'],
        });
      }

      setGame(newState);
    }
  };

  // Render individual duck SVG
  const renderDuck = (color: DuckColor, isTop: boolean, isLifted: boolean) => {
    const meta = DUCK_COLOR_META[color];

    return (
      <div
        className={`relative w-9 xs:w-11 sm:w-14 h-8 xs:h-10 sm:h-12 flex items-center justify-center transition-all duration-300 ${
          isLifted ? '-translate-y-4 sm:-translate-y-8 scale-110 drop-shadow-[0_8px_12px_rgba(0,0,0,0.4)]' : ''
        }`}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full drop-shadow-md">
          {/* Water Ripple when floating */}
          <ellipse cx="32" cy="54" rx="24" ry="7" fill="rgba(255,255,255,0.25)" />

          {/* Duck Body */}
          <ellipse cx="28" cy="40" rx="22" ry="15" fill={meta.hex} stroke="#78350f" strokeWidth="2.5" />

          {/* Little Wing */}
          <path
            d="M 16 38 Q 28 32 36 40 Q 26 46 16 38"
            fill={meta.hex}
            stroke="#92400e"
            strokeWidth="2"
            opacity="0.8"
          />

          {/* Duck Head */}
          <circle cx="44" cy="24" r="14" fill={meta.hex} stroke="#78350f" strokeWidth="2.5" />

          {/* Orange Bill */}
          <path
            d="M 54 26 Q 64 28 58 32 Q 52 32 50 30 Z"
            fill="#ea580c"
            stroke="#9a3412"
            strokeWidth="2"
          />

          {/* Cute Black Eye with White Gleam */}
          <circle cx="46" cy="20" r="3.5" fill="#0f172a" />
          <circle cx="47" cy="19" r="1.2" fill="#ffffff" />

          {/* Cheerful Blush */}
          <circle cx="42" cy="28" r="3" fill="#f43f5e" opacity="0.45" />

          {/* Feather Tail */}
          <path
            d="M 6 36 Q 2 30 10 32 Z"
            fill={meta.hex}
            stroke="#78350f"
            strokeWidth="2"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl p-2 sm:p-4">
      {/* Top Header HUD */}
      <div className="w-full flex items-center justify-between px-3 py-2 mb-2 bg-slate-800/80 rounded-2xl border border-slate-700/60 backdrop-blur-md">
        {/* Level and Score */}
        <div className="flex items-center gap-3">
          <div className="bg-sky-500/20 text-sky-300 p-2 rounded-xl border border-sky-500/30">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-amber-400">LEVEL {game.level}</span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-semibold">{game.movesCount} MOVES</span>
            </div>
            <div className="text-base sm:text-lg font-black text-white">{game.score} PTS</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleUndo}
            disabled={game.moveHistory.length === 0 || game.isWon}
            className="w-11 h-11 min-w-[44px] min-h-[44px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
            aria-label="Undo Move"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            onClick={toggleMute}
            className="w-11 h-11 min-w-[44px] min-h-[44px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleRestart}
            className="w-11 h-11 min-w-[44px] min-h-[44px] bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl transition-all flex items-center justify-center cursor-pointer"
            aria-label="Restart Level"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Pond Bay Stage */}
      <div className="relative w-full aspect-[4/5] sm:aspect-[16/11] rounded-2xl overflow-hidden border-2 border-emerald-900/60 shadow-inner bg-gradient-to-b from-sky-900 via-teal-900 to-emerald-950 p-2 sm:p-4 flex flex-col justify-end">
        {/* Floating Lily Pads in Background */}
        <div className="absolute top-4 left-6 text-3xl opacity-35 select-none pointer-events-none">🪷</div>
        <div className="absolute top-12 right-10 text-2xl opacity-35 select-none pointer-events-none">🌸</div>
        <div className="absolute top-24 left-1/3 text-xl opacity-25 select-none pointer-events-none">🌿</div>

        {/* Ponds Grid Columns */}
        <div className="w-full flex items-end justify-center gap-1 xs:gap-1.5 sm:gap-3 z-10 pb-4 overflow-x-auto scrollbar-none">
          {game.columns.map((col, colIdx) => {
            const isSelected = game.selectedColumnIndex === colIdx;
            const isShaking = shakingColIndex === colIdx;
            const isEmpty = col.ducks.length === 0;

            return (
              <div
                key={col.id}
                onClick={() => handleColumnClick(colIdx)}
                className={`group relative flex flex-col items-center cursor-pointer transition-transform ${
                  isShaking ? 'animate-wiggle' : ''
                }`}
              >
                {/* Column Selection Indicator */}
                {isSelected && (
                  <div className="absolute -top-7 text-[10px] sm:text-xs font-black text-amber-300 animate-bounce bg-amber-500/20 px-1.5 sm:px-2 py-0.5 rounded-full border border-amber-400/40">
                    TARGET
                  </div>
                )}

                {/* Wooden Dock Pier Column Container */}
                <div
                  className={`relative w-10 xs:w-12 sm:w-16 h-48 xs:h-54 sm:h-64 rounded-xl sm:rounded-2xl flex flex-col-reverse items-center justify-start p-0.5 sm:p-1 border-2 transition-all duration-200 ${
                    isSelected
                      ? 'bg-sky-700/50 border-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.6)]'
                      : 'bg-emerald-950/60 border-amber-800/60 hover:border-amber-600/80 shadow-md'
                  }`}
                >
                  {/* Water Shimmer Base */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-t from-teal-500/20 to-transparent pointer-events-none" />

                  {/* Dock Post Top Lip */}
                  <div className="absolute top-0 inset-x-0 h-2 bg-amber-700/80 rounded-t-xl" />

                  {/* Render Ducks stacked from bottom to top */}
                  {col.ducks.map((duckColor, dIdx) => {
                    const isTopDuck = dIdx === col.ducks.length - 1;
                    const isLifted = isSelected && isTopDuck;
                    return (
                      <React.Fragment key={`${col.id}-${dIdx}`}>
                        {renderDuck(duckColor, isTopDuck, isLifted)}
                      </React.Fragment>
                    );
                  })}

                  {/* Empty Pond Marker */}
                  {isEmpty && (
                    <div className="h-full flex items-center justify-center text-xs font-bold text-teal-400/50 select-none">
                      EMPTY
                    </div>
                  )}
                </div>

                {/* Pond Pad Footer */}
                <div className="mt-1 flex items-center gap-1 text-[11px] font-bold text-slate-400">
                  <span>Pond {colIdx + 1}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Victory Modal Overlay */}
        {game.isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20 overflow-y-auto max-h-full py-4">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-amber-500/30">
              🦆✨
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">ALL DUCKS SORTED!</h2>
            <p className="text-slate-300 text-sm mb-4">
              Happy duckies are swimming together in their matching ponds!
            </p>

            <div className="w-full max-w-xs bg-slate-800/90 rounded-2xl p-4 border border-slate-700/60 mb-5 flex justify-around">
              <div>
                <div className="text-xs text-slate-400 font-semibold">MOVES</div>
                <div className="text-2xl font-black text-sky-400">{game.movesCount}</div>
              </div>
              <div className="w-px bg-slate-700" />
              <div>
                <div className="text-xs text-slate-400 font-semibold">SCORE</div>
                <div className="text-2xl font-black text-amber-400">{game.score}</div>
              </div>
            </div>

            <button
              onClick={handleNextLevel}
              className="w-full max-w-xs py-3.5 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 active:scale-95 text-slate-950 font-black text-base rounded-2xl shadow-xl shadow-amber-400/30 transition-all flex items-center justify-center gap-2"
            >
              <span>NEXT LEVEL</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Control Hint Footer */}
      <div className="w-full mt-2.5 px-3 py-2 bg-slate-800/40 rounded-xl border border-slate-700/30 flex items-center justify-between text-xs text-slate-400">
        <span>Tap source pond to lift duck • Tap target pond to move</span>
        <span className="text-teal-400 font-medium">Sort all colors to win!</span>
      </div>
    </div>
  );
};
export default DuckPondSortContainer;

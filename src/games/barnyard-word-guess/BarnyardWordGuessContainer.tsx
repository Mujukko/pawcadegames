import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LetterState,
  MAX_GUESSES,
  WORD_LENGTH,
  WordGameState,
  WordStats,
  createWordGame,
  dailyAnswer,
  dailyIndex,
  deleteLetter,
  randomAnswer,
  shareText,
  submitGuess,
  typeLetter,
} from './logic/engine';
import { wordSound } from './systems/sound';

interface BarnyardWordGuessProps {
  onBack?: () => void;
}

const STATS_KEY = 'pawcade_wordguess_stats';
const DAILY_KEY = 'pawcade_wordguess_daily';

const DEFAULT_STATS: WordStats = {
  streak: 0,
  bestStreak: 0,
  played: 0,
  won: 0,
  lastDailyIndex: -1,
  lastDailyResult: null,
};

const ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];

function loadStats(): WordStats {
  try {
    return { ...DEFAULT_STATS, ...(JSON.parse(localStorage.getItem(STATS_KEY) || '{}') as Partial<WordStats>) };
  } catch {
    return DEFAULT_STATS;
  }
}

/** Rebuilds today's daily board by replaying saved guesses through the engine. */
function startDaily(stats: WordStats): WordGameState {
  let game = createWordGame(dailyAnswer(), 'daily', stats);
  try {
    const saved = JSON.parse(localStorage.getItem(DAILY_KEY) || 'null') as { day: number; guesses: string[] } | null;
    if (saved && saved.day === dailyIndex()) {
      for (const guess of saved.guesses) {
        for (const ch of guess) game = typeLetter(game, ch);
        game = submitGuess(game);
      }
      // Replaying a finished board must not double count: stats already include it.
      game = { ...game, message: null, streak: stats.streak, bestStreak: stats.bestStreak };
    }
  } catch {
    /* ignore corrupt save */
  }
  return game;
}

const TILE_COLORS: Record<LetterState, string> = {
  correct: 'bg-emerald-500 border-emerald-500 text-white',
  present: 'bg-amber-400 border-amber-400 text-white',
  absent: 'bg-slate-500 border-slate-500 text-white',
};

export const BarnyardWordGuessContainer: React.FC<BarnyardWordGuessProps> = ({ onBack }) => {
  const [stats, setStats] = useState<WordStats>(loadStats);
  const [game, setGame] = useState<WordGameState>(() => startDaily(loadStats()));
  const [muted, setMuted] = useState(false);
  const [shake, setShake] = useState(false);
  const [copied, setCopied] = useState(false);
  const [revealRow, setRevealRow] = useState(-1);
  const gameRef = useRef(game);
  gameRef.current = game;
  const statsRef = useRef(stats);
  statsRef.current = stats;

  const flashMessage = useCallback((msg: string) => {
    setGame((g) => ({ ...g, message: msg }));
    setTimeout(() => setGame((g) => (g.message === msg && g.status === 'playing' ? { ...g, message: null } : g)), 1400);
  }, []);

  const press = useCallback(
    (key: string) => {
      const g = gameRef.current;
      if (g.status !== 'playing' || revealRow >= 0) return;

      if (key === 'Enter') {
        if (g.current.length < WORD_LENGTH) {
          wordSound.playError();
          setShake(true);
          setTimeout(() => setShake(false), 400);
          flashMessage('Not enough letters');
          return;
        }
        const next = submitGuess(g);
        const row = next.guesses.length - 1;
        next.results[row].forEach((r, i) => wordSound.playReveal(i, r));
        setRevealRow(row);
        setTimeout(() => setRevealRow(-1), 1100);
        setGame(next);

        if (g.mode === 'daily') {
          try {
            localStorage.setItem(DAILY_KEY, JSON.stringify({ day: dailyIndex(), guesses: next.guesses }));
          } catch {
            /* optional */
          }
        }
        if (next.status !== 'playing') {
          if (next.status === 'won') wordSound.playWin();
          else wordSound.playLose();
          const s = statsRef.current;
          const firstDailyFinish = g.mode !== 'daily' || s.lastDailyIndex !== dailyIndex();
          if (firstDailyFinish) {
            const updated: WordStats = {
              ...s,
              played: s.played + 1,
              won: s.won + (next.status === 'won' ? 1 : 0),
              streak: next.streak,
              bestStreak: Math.max(s.bestStreak, next.bestStreak),
              lastDailyIndex: g.mode === 'daily' ? dailyIndex() : s.lastDailyIndex,
              lastDailyResult: g.mode === 'daily' ? next.status : s.lastDailyResult,
            };
            setStats(updated);
            try {
              localStorage.setItem(STATS_KEY, JSON.stringify(updated));
            } catch {
              /* optional */
            }
          }
        }
      } else if (key === 'Backspace') {
        setGame(deleteLetter(g));
      } else if (/^[a-zA-Z]$/.test(key)) {
        wordSound.playKey();
        setGame(typeLetter(g, key));
      }
    },
    [flashMessage, revealRow]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press]);

  const newRandom = () => {
    const next = createWordGame(randomAnswer(gameRef.current.answer), 'random', statsRef.current);
    setGame(next);
  };

  const goDaily = () => setGame(startDaily(statsRef.current));

  const share = async () => {
    const text = shareText(game, game.mode === 'daily' ? `#${dailyIndex() + 1}` : '(random)');
    try {
      if (navigator.share) await navigator.share({ text });
      else {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1600);
      }
    } catch {
      /* user cancelled */
    }
  };

  const toggleSound = () =>
    setMuted((m) => {
      wordSound.setMuted(!m);
      return !m;
    });

  const rows = useMemo(() => {
    const out: Array<{ letters: string; results: LetterState[] | null; active: boolean }> = [];
    for (let r = 0; r < MAX_GUESSES; r++) {
      if (r < game.guesses.length) out.push({ letters: game.guesses[r], results: game.results[r], active: false });
      else if (r === game.guesses.length && game.status === 'playing')
        out.push({ letters: game.current, results: null, active: true });
      else out.push({ letters: '', results: null, active: false });
    }
    return out;
  }, [game]);

  const finished = game.status !== 'playing';

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-amber-50 select-none overflow-hidden touch-none overscroll-none">
      <div className="w-full max-w-md px-3 py-2 flex items-center justify-between bg-amber-100 border-b border-amber-200">
        <div className="flex items-center gap-2">
          {onBack && (
            <button onClick={onBack} className="px-2.5 py-1 text-xs font-semibold bg-amber-200 rounded text-amber-900">
              Exit
            </button>
          )}
          <div className="flex rounded-lg overflow-hidden border border-amber-300 text-xs font-bold">
            <button
              onClick={goDaily}
              className={`px-3 h-9 ${game.mode === 'daily' ? 'bg-amber-500 text-white' : 'bg-white text-amber-800'}`}
            >
              Daily
            </button>
            <button
              onClick={newRandom}
              className={`px-3 h-9 ${game.mode === 'random' ? 'bg-amber-500 text-white' : 'bg-white text-amber-800'}`}
            >
              New word
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3 text-amber-900">
          <div className="text-right leading-tight">
            <div className="text-[10px] uppercase font-bold text-amber-700">Streak</div>
            <div className="text-sm font-black">🔥 {game.streak}</div>
          </div>
          <button onClick={toggleSound} aria-label={muted ? 'Unmute' : 'Mute'} className="w-11 h-11 rounded-lg bg-amber-200">
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      <div className="h-8 flex items-center justify-center">
        {game.message && (
          <div className="px-3 py-1 rounded-md bg-slate-800 text-white text-sm font-bold">{game.message}</div>
        )}
      </div>

      <div className="flex-1 min-h-0 w-full max-w-sm flex items-center justify-center px-4">
        <div className="grid gap-1.5 w-full" style={{ gridTemplateRows: `repeat(${MAX_GUESSES}, 1fr)`, maxHeight: '100%', aspectRatio: '5 / 6' }}>
          {rows.map((row, r) => (
            <div
              key={r}
              className={`grid grid-cols-5 gap-1.5 ${row.active && shake ? 'animate-pulse' : ''}`}
            >
              {Array.from({ length: WORD_LENGTH }).map((_, c) => {
                const letter = row.letters[c] || '';
                const res = row.results?.[c];
                const revealing = revealRow === r;
                return (
                  <div
                    key={c}
                    style={revealing ? { transition: `background-color 0.1s ${c * 0.2}s` } : undefined}
                    className={`flex items-center justify-center rounded-md border-2 text-2xl sm:text-3xl font-black uppercase aspect-square ${
                      res
                        ? TILE_COLORS[res]
                        : letter
                        ? 'bg-white border-amber-500 text-slate-800'
                        : 'bg-white border-amber-200 text-slate-800'
                    }`}
                  >
                    {letter}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {finished && (
        <div className="w-full max-w-sm px-4 pb-2 flex gap-2">
          <button onClick={share} className="flex-1 h-12 rounded-xl bg-emerald-500 text-white font-bold active:scale-95">
            {copied ? 'Copied!' : 'Share result'}
          </button>
          <button onClick={newRandom} className="flex-1 h-12 rounded-xl bg-amber-500 text-white font-bold active:scale-95">
            Play new word
          </button>
        </div>
      )}

      <div className="w-full max-w-md px-1.5 pb-2 pt-1 flex flex-col gap-1.5 bg-amber-100 border-t border-amber-200">
        {ROWS.map((row, i) => (
          <div key={row} className="flex justify-center gap-1">
            {i === 2 && (
              <button
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault();
                  press('Enter');
                }}
                className="px-2 min-w-[3.1rem] h-12 rounded-md bg-amber-500 text-white text-xs font-black active:bg-amber-600"
              >
                ENTER
              </button>
            )}
            {row.split('').map((k) => {
              const state = game.keyStates[k];
              return (
                <button
                  key={k}
                  type="button"
                  aria-label={k}
                  onPointerDown={(e) => {
                    e.preventDefault();
                    press(k);
                  }}
                  className={`flex-1 max-w-[2.4rem] h-12 rounded-md text-sm font-black uppercase active:scale-95 ${
                    state ? TILE_COLORS[state] : 'bg-white text-slate-800 border border-amber-200'
                  }`}
                >
                  {k}
                </button>
              );
            })}
            {i === 2 && (
              <button
                type="button"
                aria-label="Backspace"
                onPointerDown={(e) => {
                  e.preventDefault();
                  press('Backspace');
                }}
                className="px-2 min-w-[3.1rem] h-12 rounded-md bg-amber-300 text-amber-900 text-lg font-black active:bg-amber-400"
              >
                ⌫
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BarnyardWordGuessContainer;

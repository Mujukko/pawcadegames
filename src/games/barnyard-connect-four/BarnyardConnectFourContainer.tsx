import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Users,
  Bot,
  Trophy,
  HelpCircle,
  X,
  ChevronDown,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  AiDifficulty,
  ConnectFourState,
  GameMode,
  Player,
} from './logic/types';
import {
  initializeConnectFour,
  dropToken,
  getBestAiMove,
  resetBoard,
  isValidMove,
  NUM_ROWS,
  NUM_COLS,
} from './logic/engine';
import { connectFourAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const BarnyardConnectFourContainer: React.FC = () => {
  const [gameState, setGameState] = useState<ConnectFourState>(() =>
    initializeConnectFour('ai', 'medium')
  );
  const [isMuted, setIsMuted] = useState(connectFourAudio.isMuted());
  const [showHelp, setShowHelp] = useState(false);
  const [droppingToken, setDroppingToken] = useState<{
    col: number;
    targetRow: number;
    player: Player;
    progress: number;
  } | null>(null);

  const isDroppingRef = useRef(false);

  const handleMuteToggle = () => {
    const next = connectFourAudio.toggleMute();
    setIsMuted(next);
  };

  const handleModeChange = (mode: GameMode) => {
    setGameState((prev) => ({
      ...initializeConnectFour(mode, prev.aiDifficulty),
      p1Score: 0,
      p2Score: 0,
      draws: 0,
    }));
  };

  const handleDifficultyChange = (aiDifficulty: AiDifficulty) => {
    setGameState((prev) => ({
      ...resetBoard(prev),
      aiDifficulty,
    }));
  };

  const handleResetMatch = () => {
    setGameState((prev) => resetBoard(prev));
  };

  // Execute a column move
  const handleColumnSelect = useCallback(
    (col: number) => {
      if (gameState.winner !== null || isDroppingRef.current || gameState.isAiThinking) {
        return;
      }
      if (!isValidMove(gameState.board, col)) {
        return;
      }

      isDroppingRef.current = true;
      connectFourAudio.playTokenSlide();

      const player = gameState.currentPlayer;
      const { nextState, droppedRow } = dropToken(gameState, col);

      // Animate drop
      setDroppingToken({
        col,
        targetRow: droppedRow,
        player,
        progress: 0,
      });

      const startTime = performance.now();
      const duration = 240 + droppedRow * 40; // 240ms to 440ms drop time

      const animate = (time: number) => {
        const elapsed = time - startTime;
        const progress = Math.min(1, elapsed / duration);

        if (progress < 1) {
          setDroppingToken({
            col,
            targetRow: droppedRow,
            player,
            progress,
          });
          requestAnimationFrame(animate);
        } else {
          setDroppingToken(null);
          isDroppingRef.current = false;
          connectFourAudio.playTokenClack(droppedRow);
          setGameState(nextState);

          if (nextState.winner !== null) {
            if (nextState.winner === 'draw') {
              connectFourAudio.playDrawThud();
            } else {
              connectFourAudio.playVictoryFanfare();
              confetti({
                particleCount: 50,
                spread: 70,
                origin: { y: 0.6 },
              });
              analytics.track('level_completed', {
                game: 'barnyard-connect-four',
                winner: nextState.winner,
                mode: nextState.mode,
                difficulty: nextState.aiDifficulty,
              });
            }
          }
        }
      };

      requestAnimationFrame(animate);
    },
    [gameState]
  );

  // Trigger AI move when it's Player 2's turn in AI mode
  useEffect(() => {
    if (
      gameState.mode === 'ai' &&
      gameState.currentPlayer === 2 &&
      gameState.winner === null &&
      !isDroppingRef.current &&
      !gameState.isAiThinking
    ) {
      setGameState((prev) => ({ ...prev, isAiThinking: true }));

      // Simulate thoughtful AI delay (450ms)
      const timer = setTimeout(() => {
        const bestCol = getBestAiMove(gameState.board, gameState.aiDifficulty, 2);
        if (bestCol !== -1) {
          handleColumnSelect(bestCol);
        }
      }, 450);

      return () => clearTimeout(timer);
    }
  }, [gameState.currentPlayer, gameState.winner, gameState.mode, gameState.isAiThinking, handleColumnSelect]);

  const p1Name = 'You (Chicks)';
  const p2Name = gameState.mode === 'ai' ? 'Barn Owl AI' : 'Player 2 (Apples)';

  return (
    <div className="relative w-full h-[100dvh] bg-slate-900 overflow-hidden flex flex-col justify-between select-none touch-none text-white">
      {/* Top Header Bar */}
      <header className="z-20 flex items-center justify-between px-3 sm:px-6 py-2 bg-slate-900/90 backdrop-blur-md border-b border-white/10">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-xl">
            <span className="text-xl">🟡</span>
            <span className="font-display font-extrabold text-sm sm:text-base text-amber-300">
              Four in a Row
            </span>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 p-0.5 rounded-xl text-xs font-bold">
            <button
              onClick={() => handleModeChange('ai')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                gameState.mode === 'ai' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>vs AI</span>
            </button>
            <button
              onClick={() => handleModeChange('local_2p')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all ${
                gameState.mode === 'local_2p' ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-white/70 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pass & Play</span>
            </button>
          </div>

          {/* AI Difficulty Selector */}
          {gameState.mode === 'ai' && (
            <div className="hidden sm:flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded-xl text-xs">
              <span className="text-white/50 text-[11px]">AI:</span>
              {(['easy', 'medium', 'hard'] as AiDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => handleDifficultyChange(diff)}
                  className={`px-2 py-0.5 rounded-md font-bold uppercase text-[10px] transition-all ${
                    gameState.aiDifficulty === diff
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'text-white/60 hover:text-white'
                  }`}
                >
                  {diff === 'easy' ? 'Calf' : diff === 'medium' ? 'Fox' : 'Owl'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={handleResetMatch}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl text-xs font-semibold transition-transform"
            aria-label="New Match"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Match</span>
          </button>

          <button
            onClick={handleMuteToggle}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>

          <button
            onClick={() => setShowHelp(true)}
            className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl transition-transform"
            aria-label="Help"
          >
            <HelpCircle className="w-4 h-4 text-white/80" />
          </button>
        </div>
      </header>

      {/* Match Scoreboard & Turn Alert Banner */}
      <div className="z-10 flex flex-col items-center gap-1 py-1 px-4">
        <div className="flex items-center gap-4 sm:gap-8 bg-slate-800/80 border border-white/10 px-4 py-1.5 rounded-2xl text-xs sm:text-sm font-bold shadow-md">
          {/* Player 1 (Yellow Chicks) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              gameState.currentPlayer === 1 && gameState.winner === null
                ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                : 'text-white/80'
            }`}
          >
            <span className="text-base">🐥</span>
            <span>{p1Name}:</span>
            <strong className="text-sm sm:text-base font-extrabold">{gameState.p1Score}</strong>
          </div>

          <span className="text-white/30 font-bold">vs</span>

          {/* Player 2 / AI (Red Apples) */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all ${
              gameState.currentPlayer === 2 && gameState.winner === null
                ? 'bg-rose-500 text-white ring-2 ring-rose-400'
                : 'text-white/80'
            }`}
          >
            <span className="text-base">{gameState.mode === 'ai' ? '🦉' : '🍎'}</span>
            <span>{p2Name}:</span>
            <strong className="text-sm sm:text-base font-extrabold">{gameState.p2Score}</strong>
          </div>
        </div>

        {/* Turn Status Toast */}
        <div className="text-xs font-semibold text-white/70 flex items-center gap-1.5 h-5">
          {gameState.winner !== null ? (
            <span className="text-amber-400 font-bold">
              {gameState.winner === 'draw'
                ? '🤝 Match Drawn! Both played brilliantly.'
                : gameState.winner === 1
                ? '🎉 Golden Chicks Win! Four in a row!'
                : `🎉 ${p2Name} Wins! Four in a row!`}
            </span>
          ) : gameState.isAiThinking ? (
            <span className="text-rose-300 animate-pulse">🦉 Barn Owl AI is pondering next move...</span>
          ) : (
            <span>
              Tap any column arrow to drop a{' '}
              <strong className={gameState.currentPlayer === 1 ? 'text-amber-400' : 'text-rose-400'}>
                {gameState.currentPlayer === 1 ? 'Yellow Chick 🟡' : 'Red Apple 🔴'}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Main Connect 4 Vertical Board Stage */}
      <main className="relative flex-1 flex flex-col items-center justify-center p-2 max-w-lg mx-auto w-full">
        {/* Top Column Drop Indicators */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 w-full mb-1.5 px-2">
          {Array.from({ length: NUM_COLS }).map((_, c) => {
            const canDrop = isValidMove(gameState.board, c) && gameState.winner === null && !gameState.isAiThinking;
            return (
              <button
                key={c}
                onClick={() => handleColumnSelect(c)}
                onMouseEnter={() => {
                  if (canDrop) connectFourAudio.playHoverTick();
                  setGameState((prev) => ({ ...prev, hoveredCol: c }));
                }}
                disabled={!canDrop}
                aria-label={`Drop token in column ${c + 1}`}
                className={`flex flex-col items-center justify-center py-1 sm:py-2 rounded-xl transition-all ${
                  canDrop
                    ? 'hover:bg-amber-400/20 active:scale-95 cursor-pointer text-amber-400'
                    : 'opacity-20 cursor-not-allowed text-white/40'
                }`}
              >
                <div
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 flex items-center justify-center shadow-md transition-transform ${
                    gameState.hoveredCol === c && canDrop ? 'scale-110 -translate-y-1' : ''
                  } ${
                    gameState.currentPlayer === 1
                      ? 'bg-amber-400 border-amber-200 text-slate-900'
                      : 'bg-rose-500 border-rose-300 text-white'
                  }`}
                >
                  <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Connect Four Blue Board Case */}
        <div className="relative bg-gradient-to-b from-blue-600 via-blue-700 to-blue-800 p-2 sm:p-3.5 rounded-[24px] sm:rounded-[32px] border-4 border-blue-900 shadow-2xl w-full aspect-[7/6] flex flex-col justify-between">
          {/* Wooden Stand Side Supports */}
          <div className="absolute -left-3 bottom-0 w-4 h-16 bg-amber-800 rounded-l-lg border-2 border-amber-950" />
          <div className="absolute -right-3 bottom-0 w-4 h-16 bg-amber-800 rounded-r-lg border-2 border-amber-950" />

          {/* 6 Rows x 7 Columns Grid Slots */}
          <div className="grid grid-rows-6 grid-cols-7 gap-1.5 sm:gap-2.5 h-full w-full">
            {gameState.board.map((row, r) =>
              row.map((cell, c) => {
                const isWinningCell = gameState.winningLine?.positions.some(
                  (pos) => pos.row === r && pos.col === c
                );

                // Is this slot currently animating a falling token?
                const isDroppingHere =
                  droppingToken !== null &&
                  droppingToken.col === c &&
                  Math.floor(droppingToken.progress * (droppingToken.targetRow + 1)) === r;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleColumnSelect(c)}
                    className="relative w-full h-full rounded-full bg-slate-950/80 shadow-inner flex items-center justify-center cursor-pointer overflow-hidden ring-2 ring-blue-900/60"
                  >
                    {/* Render settled token or falling token */}
                    {(cell !== 0 || isDroppingHere) && (
                      <div
                        className={`w-full h-full rounded-full flex items-center justify-center shadow-lg transition-transform ${
                          (cell === 1 || (isDroppingHere && droppingToken?.player === 1))
                            ? 'bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 border-2 border-amber-200'
                            : 'bg-gradient-to-br from-rose-400 via-red-500 to-rose-700 border-2 border-rose-200'
                        } ${isWinningCell ? 'animate-bounce ring-4 ring-yellow-300' : ''}`}
                      >
                        <span className="text-base sm:text-2xl select-none">
                          {(cell === 1 || (isDroppingHere && droppingToken?.player === 1))
                            ? '🐥'
                            : gameState.mode === 'ai'
                            ? '🦉'
                            : '🍎'}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Bottom Footer Controls */}
      <footer className="z-10 flex items-center justify-between px-4 sm:px-8 py-2.5 bg-slate-900/90 border-t border-white/10 text-xs text-white/60">
        <div>
          <span>Draws: </span>
          <strong className="text-white">{gameState.draws}</strong>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetMatch}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-extrabold rounded-xl shadow-md transition-transform"
          >
            Clear Board
          </button>
        </div>
      </footer>

      {/* Game Over Modal */}
      {gameState.winner !== null && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-white/20 rounded-[28px] max-w-sm w-full p-6 text-center text-white shadow-2xl">
            <div className="w-16 h-16 mx-auto mb-3 bg-amber-500/20 border border-amber-400/40 rounded-full flex items-center justify-center text-3xl">
              {gameState.winner === 'draw' ? '🤝' : gameState.winner === 1 ? '🏆' : '🦉'}
            </div>

            <h2 className="font-display font-extrabold text-2xl mb-1 text-amber-400">
              {gameState.winner === 'draw'
                ? 'Tied Match!'
                : gameState.winner === 1
                ? 'Golden Chicks Win!'
                : `${p2Name} Wins!`}
            </h2>

            <p className="text-sm text-white/70 mb-5">
              {gameState.winner === 'draw'
                ? 'The 7x6 board is completely full! Both players matched every move.'
                : `Connected four tokens in a straight line! Great strategic play.`}
            </p>

            <div className="flex gap-2">
              <button
                onClick={handleResetMatch}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-slate-950 rounded-xl font-extrabold text-sm transition-transform shadow-lg shadow-emerald-500/25"
              >
                Play Next Round
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="absolute inset-0 z-40 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/20 rounded-[28px] max-w-sm w-full p-5 text-white shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="font-display font-extrabold text-lg text-amber-400">How to Play</h3>
              <button onClick={() => setShowHelp(false)} className="p-1 rounded-lg bg-white/10 hover:bg-white/20">
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>

            <ul className="space-y-2.5 text-xs text-white/80 mb-5">
              <li className="flex items-start gap-2">
                <span className="text-base">🟡</span>
                <span><strong>DROP DISCS:</strong> Tap any column arrow to drop a token into the lowest empty slot.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🎯</span>
                <span><strong>CONNECT FOUR:</strong> Connect 4 of your tokens horizontally, vertically, or diagonally to win!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🛡️</span>
                <span><strong>BLOCK OPPONENT:</strong> Watch for opponent 3-in-a-row threats and drop your disc to block them!</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-base">🦉</span>
                <span><strong>AI LEVELS:</strong> Choose between Easy Calf, Clever Fox, and Master Barn Owl!</span>
              </li>
            </ul>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl"
            >
              Start Playing!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

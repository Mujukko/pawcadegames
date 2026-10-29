import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BarnyardWordConnectState } from './logic/types';
import {
  cancelSelection,
  createInitialState,
  LEVELS,
  nextLevel,
  restartLevel,
  selectLetter,
  shuffleDial,
  submitGuess,
  useHint,
} from './logic/engine';
import { wordConnectSound } from './systems/sound';

export const BarnyardWordConnectContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<BarnyardWordConnectState>(() =>
    createInitialState(0)
  );
  const [isMuted, setIsMuted] = useState<boolean>(() => wordConnectSound.getMuted());
  const stateRef = useRef<BarnyardWordConnectState>(gameState);
  stateRef.current = gameState;

  const isDraggingRef = useRef<boolean>(false);
  const pointerPosRef = useRef<{ x: number; y: number } | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Audio mute toggle
  const toggleMute = useCallback(() => {
    const next = !isMuted;
    wordConnectSound.setMuted(next);
    setIsMuted(next);
  }, [isMuted]);

  // Restart level
  const handleRestart = useCallback(() => {
    const next = restartLevel(stateRef.current);
    setGameState({ ...next });
  }, []);

  // Level selector
  const handleSelectLevel = useCallback((lvlIndex: number) => {
    const next = createInitialState(lvlIndex, stateRef.current.highScore);
    next.score = stateRef.current.score;
    setGameState({ ...next });
  }, []);

  // Next level
  const handleNextLevel = useCallback(() => {
    const next = nextLevel(stateRef.current);
    setGameState({ ...next });
  }, []);

  // Shuffle dial
  const handleShuffle = useCallback(() => {
    wordConnectSound.playShuffle();
    const next = shuffleDial(stateRef.current);
    setGameState({ ...next });
  }, []);

  // Use hint
  const handleHint = useCallback(() => {
    if (stateRef.current.hintsRemaining > 0) {
      wordConnectSound.playHint();
      const next = useHint(stateRef.current);
      setGameState({ ...next });
    }
  }, []);

  // Convert client pointer event coordinates to canvas internal (400x580)
  const getCanvasCoords = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = 400 / rect.width;
    const scaleY = 580 / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  // Find letter at canvas coordinates
  const findLetterAt = useCallback((x: number, y: number): number => {
    const letters = stateRef.current.dialLetters;
    for (let i = 0; i < letters.length; i++) {
      const d = Math.hypot(x - letters[i].x, y - letters[i].y);
      if (d <= 32) {
        return i;
      }
    }
    return -1;
  }, []);

  // Pointer event handlers
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const pos = getCanvasCoords(e);
      pointerPosRef.current = pos;
      const idx = findLetterAt(pos.x, pos.y);

      if (idx !== -1) {
        isDraggingRef.current = true;
        const next = selectLetter(stateRef.current, idx);
        wordConnectSound.playLetterPick(next.selectedIndices.length);
        setGameState({ ...next });
      }
    },
    [getCanvasCoords, findLetterAt]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDraggingRef.current) return;
      const pos = getCanvasCoords(e);
      pointerPosRef.current = pos;
      const idx = findLetterAt(pos.x, pos.y);

      if (idx !== -1) {
        const prevLen = stateRef.current.selectedIndices.length;
        const next = selectLetter(stateRef.current, idx);
        if (next.selectedIndices.length > prevLen) {
          wordConnectSound.playLetterPick(next.selectedIndices.length);
          setGameState({ ...next });
        } else if (next.selectedIndices.length < prevLen) {
          wordConnectSound.playLetterPick(Math.max(1, next.selectedIndices.length));
          setGameState({ ...next });
        }
      }
    },
    [getCanvasCoords, findLetterAt]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      pointerPosRef.current = null;

      if (stateRef.current.selectedIndices.length > 0) {
        const next = submitGuess(stateRef.current);

        // Sound triggers
        for (const evt of next.events) {
          if (evt.type === 'word_found') {
            wordConnectSound.playWordFound();
          } else if (evt.type === 'bonus_word') {
            wordConnectSound.playBonusWord();
          } else if (evt.type === 'word_invalid') {
            wordConnectSound.playWordInvalid();
          } else if (evt.type === 'victory') {
            wordConnectSound.playVictory();
          }
        }

        setGameState({ ...next });
      } else {
        const next = cancelSelection(stateRef.current);
        setGameState({ ...next });
      }
    },
    []
  );

  // 60 FPS Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      const w = 400;
      const h = 580;
      const state = stateRef.current;

      // 1. Background
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#090d16');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Subtle atmospheric glow
      ctx.fillStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.beginPath();
      ctx.arc(200, 160, 150, 0, Math.PI * 2);
      ctx.fill();

      // 2. Draw Crossword Grid
      // Find grid bounds to center the crossword
      let minRow = 999;
      let maxRow = -999;
      let minCol = 999;
      let maxCol = -999;

      for (const s of state.grid) {
        if (s.row < minRow) minRow = s.row;
        if (s.row > maxRow) maxRow = s.row;
        if (s.col < minCol) minCol = s.col;
        if (s.col > maxCol) maxCol = s.col;
      }

      const totalRows = maxRow - minRow + 1;
      const totalCols = maxCol - minCol + 1;
      const tileSize = Math.min(42, Math.floor(260 / Math.max(totalRows, totalCols)));
      const gridGap = 4;
      const gridW = totalCols * (tileSize + gridGap) - gridGap;
      const gridH = totalRows * (tileSize + gridGap) - gridGap;
      const startX = (w - gridW) / 2;
      const startY = 65 + (200 - gridH) / 2;

      for (const slot of state.grid) {
        const slotX = startX + (slot.col - minCol) * (tileSize + gridGap);
        const slotY = startY + (slot.row - minRow) * (tileSize + gridGap);

        if (slot.revealed) {
          // Revealed golden tile
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#ca8a04';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(slotX, slotY, tileSize, tileSize, 6);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#451a03';
          ctx.font = `bold ${Math.round(tileSize * 0.62)}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(slot.letter, slotX + tileSize / 2, slotY + tileSize / 2);
        } else {
          // Blank unrevealed slot
          ctx.fillStyle = '#1e293b';
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.roundRect(slotX, slotY, tileSize, tileSize, 6);
          ctx.fill();
          ctx.stroke();
        }
      }

      // 3. Current Guess Pill (Middle)
      if (state.currentGuess.length > 0) {
        ctx.save();
        const guess = state.currentGuess;
        ctx.font = 'bold 22px sans-serif';
        const textWidth = ctx.measureText(guess).width;
        const pillW = Math.max(90, textWidth + 36);
        const pillH = 36;
        const pillX = (w - pillW) / 2;
        const pillY = 300;

        ctx.fillStyle = '#0284c7';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(guess, pillX + pillW / 2, pillY + pillH / 2);
        ctx.restore();
      }

      // 4. Dial Center and Base Plate
      const dialCenterX = 200;
      const dialCenterY = 450;
      const dialRadius = 95;

      // Wooden base dial circle
      const woodGrad = ctx.createRadialGradient(
        dialCenterX,
        dialCenterY,
        10,
        dialCenterX,
        dialCenterY,
        dialRadius
      );
      woodGrad.addColorStop(0, '#78350f');
      woodGrad.addColorStop(0.8, '#451a03');
      woodGrad.addColorStop(1, '#270e02');

      ctx.fillStyle = woodGrad;
      ctx.strokeStyle = '#b45309';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(dialCenterX, dialCenterY, dialRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 5. Connect Drag Line Trail
      if (state.selectedIndices.length > 0) {
        ctx.save();
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = '#0284c7';
        ctx.shadowBlur = 10;

        ctx.beginPath();
        for (let i = 0; i < state.selectedIndices.length; i++) {
          const letter = state.dialLetters[state.selectedIndices[i]];
          if (i === 0) {
            ctx.moveTo(letter.x, letter.y);
          } else {
            ctx.lineTo(letter.x, letter.y);
          }
        }

        // Draw live connecting line to finger position
        if (isDraggingRef.current && pointerPosRef.current) {
          ctx.lineTo(pointerPosRef.current.x, pointerPosRef.current.y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // 6. Draw Dial Letters
      for (let i = 0; i < state.dialLetters.length; i++) {
        const d = state.dialLetters[i];
        const isSelected = state.selectedIndices.includes(i);

        ctx.save();
        ctx.beginPath();
        ctx.arc(d.x, d.y, 25, 0, Math.PI * 2);

        if (isSelected) {
          ctx.fillStyle = '#38bdf8';
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#0284c7';
          ctx.shadowBlur = 12;
        } else {
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
        }
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = isSelected ? '#ffffff' : '#451a03';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(d.char, d.x, d.y);
        ctx.restore();
      }

      // 7. Telemetry & Counters
      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText(`🏆 Score: ${state.score}`, 16, 20);

      // Bonus Word Jar
      ctx.textAlign = 'right';
      ctx.fillText(`🦴 Bonus: ${state.bonusWordsFound.length}`, w - 16, 20);

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[480px] mx-auto select-none touch-none py-2 px-1">
      {/* Top Header Navigation */}
      <div className="w-full flex items-center justify-between mb-2 px-2 bg-slate-900/90 py-2 rounded-xl border border-sky-500/30">
        <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
          {LEVELS.map((lvl, idx) => (
            <button
              key={lvl.id}
              onClick={() => handleSelectLevel(idx)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border transition-all ${
                gameState.level === lvl.id
                  ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md shadow-sky-500/30'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              Level {lvl.id}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm text-slate-300 hover:bg-slate-700 active:scale-95"
            title="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestart}
            className="w-8 h-8 rounded-lg bg-amber-600 border border-amber-500 flex items-center justify-center text-sm text-white hover:bg-amber-500 active:scale-95"
            title="Restart Level"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Main Game Canvas */}
      <div className="relative w-full aspect-[400/580] rounded-2xl overflow-hidden border-2 border-sky-500/40 shadow-2xl shadow-sky-950/40 touch-none bg-slate-950">
        <canvas
          ref={canvasRef}
          width={400}
          height={580}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          className="w-full h-full block cursor-pointer select-none touch-none"
        />

        {/* Action Buttons (Shuffle & Hint) Overlay on Canvas */}
        <div className="absolute bottom-6 inset-x-6 flex justify-between items-center pointer-events-auto">
          {/* Shuffle Button */}
          <button
            onClick={handleShuffle}
            className="w-12 h-12 rounded-full bg-slate-900/90 border-2 border-amber-500/60 shadow-lg shadow-amber-950/50 flex flex-col items-center justify-center text-sm text-amber-300 hover:bg-slate-800 active:scale-95 transition-all"
            title="Shuffle Letters"
          >
            <span>🔀</span>
          </button>

          {/* Hint Button */}
          <button
            onClick={handleHint}
            disabled={gameState.hintsRemaining <= 0}
            className={`w-12 h-12 rounded-full border-2 shadow-lg flex flex-col items-center justify-center text-sm active:scale-95 transition-all ${
              gameState.hintsRemaining > 0
                ? 'bg-slate-900/90 border-sky-500/60 text-sky-300 shadow-sky-950/50 hover:bg-slate-800'
                : 'bg-slate-900/50 border-slate-700 text-slate-500 opacity-50 cursor-not-allowed'
            }`}
            title="Reveal 1 Letter Hint"
          >
            <span>💡</span>
            <span className="text-[10px] font-black">{gameState.hintsRemaining}</span>
          </button>
        </div>

        {/* Victory Celebration Modal */}
        {gameState.isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20 animate-fade-in">
            <div className="text-5xl mb-2">🐶📖✨</div>
            <h2 className="text-2xl font-black text-sky-400 mb-1">PUZZLE SOLVED!</h2>
            <p className="text-slate-300 text-sm mb-4">
              Sunny Corgi uncovered all the barnyard words!
            </p>

            <div className="bg-slate-900 border border-sky-500/30 rounded-xl p-3 w-full max-w-[240px] mb-5">
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Total Score</span>
                <span className="font-bold text-sky-300">{gameState.score}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-400">
                <span>Bonus Words</span>
                <span className="font-bold text-amber-300">+{gameState.bonusWordsFound.length}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full max-w-[260px]">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 active:scale-95"
              >
                Replay 🔄
              </button>
              <button
                onClick={handleNextLevel}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-sky-500/30 active:scale-95"
              >
                Next 📖
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Instructional Hint Footer */}
      <div className="w-full mt-2 text-center text-xs text-slate-400">
        Swipe across letter tiles on the wooden dial to spell words!
      </div>
    </div>
  );
};

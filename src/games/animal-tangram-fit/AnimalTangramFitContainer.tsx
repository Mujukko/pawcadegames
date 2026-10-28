import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Volume2, VolumeX, RotateCcw, ArrowRight, Trophy, RotateCw, Check, Undo2 } from 'lucide-react';
import {
  TangramState,
  TangramEvent,
  TangramPiece,
  WoodColor,
} from './logic/types';
import {
  createInitialState,
  selectPiece,
  rotatePiece,
  placePiece,
  removePieceToTray,
  canPlacePiece,
  nextStage,
  resetStage,
  restartGame,
  STAGE_CONFIGS,
} from './logic/engine';
import { tangramAudio } from './systems/sound';

export const AnimalTangramFitContainer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_tangram_high_score');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => tangramAudio.getMuted());

  const stateRef = useRef<TangramState>(createInitialState(highScore));
  const [displayState, setDisplayState] = useState<TangramState>(stateRef.current);
  const [hoverCell, setHoverCell] = useState<{ row: number; col: number } | null>(null);

  const handleSoundEvents = useCallback((events: TangramEvent[]) => {
    for (const event of events) {
      switch (event.type) {
        case 'piece_selected':
          tangramAudio.playSelect();
          break;
        case 'piece_placed':
          tangramAudio.playPlace();
          break;
        case 'piece_removed':
          tangramAudio.playRemove();
          break;
        case 'piece_rotated':
          tangramAudio.playRotate();
          break;
        case 'stage_clear':
          tangramAudio.playStageClear();
          break;
        case 'victory':
          tangramAudio.playVictory();
          break;
      }
    }
  }, []);

  const handleSelectPiece = useCallback(
    (pieceId: string) => {
      const piece = stateRef.current.pieces.find((p) => p.id === pieceId);
      if (piece && piece.placedRow !== null) {
        // If already placed, clicking in tray recalls it
        const { state: updated, event } = removePieceToTray(stateRef.current, pieceId);
        stateRef.current = updated;
        setDisplayState({ ...updated });
        if (event) handleSoundEvents([event]);
        return;
      }

      const { state: updated, event } = selectPiece(stateRef.current, pieceId);
      stateRef.current = updated;
      setDisplayState({ ...updated });
      if (event) handleSoundEvents([event]);
    },
    [handleSoundEvents]
  );

  const handleRotateSelected = useCallback(() => {
    if (!stateRef.current.selectedPieceId) return;
    const { state: updated, event } = rotatePiece(stateRef.current, stateRef.current.selectedPieceId);
    stateRef.current = updated;
    setDisplayState({ ...updated });
    if (event) handleSoundEvents([event]);
  }, [handleSoundEvents]);

  const handleBoardClick = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const clickX = (e.clientX - rect.left) * scaleX;
      const clickY = (e.clientY - rect.top) * scaleY;

      const config = STAGE_CONFIGS[stateRef.current.stage - 1] || STAGE_CONFIGS[0];
      const cellSize = 46;
      const boardWidth = config.gridCols * cellSize;
      const boardHeight = config.gridRows * cellSize;
      const startX = (420 - boardWidth) / 2;
      const startY = (480 - boardHeight) / 2;

      const col = Math.floor((clickX - startX) / cellSize);
      const row = Math.floor((clickY - startY) / cellSize);

      if (row < 0 || row >= config.gridRows || col < 0 || col >= config.gridCols) {
        return;
      }

      const existingPieceId = stateRef.current.boardGrid[row][col];

      // If a piece is already at this cell and no piece is selected, recall it
      if (existingPieceId && !stateRef.current.selectedPieceId) {
        const { state: updated, event } = removePieceToTray(stateRef.current, existingPieceId);
        stateRef.current = updated;
        setDisplayState({ ...updated });
        if (event) handleSoundEvents([event]);
        return;
      }

      // If a piece is selected, attempt to place it
      if (stateRef.current.selectedPieceId) {
        const { state: updated, events } = placePiece(
          stateRef.current,
          stateRef.current.selectedPieceId,
          row,
          col
        );

        if (events.length > 0) {
          stateRef.current = updated;
          setDisplayState({ ...updated });
          handleSoundEvents(events);

          if (updated.score > highScore) {
            setHighScore(updated.score);
            try {
              localStorage.setItem('pawcade_tangram_high_score', updated.score.toString());
            } catch {}
          }
        }
      }
    },
    [handleSoundEvents, highScore]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !stateRef.current.selectedPieceId) {
        if (hoverCell !== null) setHoverCell(null);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      const moveX = (e.clientX - rect.left) * scaleX;
      const moveY = (e.clientY - rect.top) * scaleY;

      const config = STAGE_CONFIGS[stateRef.current.stage - 1] || STAGE_CONFIGS[0];
      const cellSize = 46;
      const boardWidth = config.gridCols * cellSize;
      const boardHeight = config.gridRows * cellSize;
      const startX = (420 - boardWidth) / 2;
      const startY = (480 - boardHeight) / 2;

      const col = Math.floor((moveX - startX) / cellSize);
      const row = Math.floor((moveY - startY) / cellSize);

      if (row >= 0 && row < config.gridRows && col >= 0 && col < config.gridCols) {
        if (!hoverCell || hoverCell.row !== row || hoverCell.col !== col) {
          setHoverCell({ row, col });
        }
      } else {
        if (hoverCell !== null) setHoverCell(null);
      }
    },
    [hoverCell]
  );

  const handleToggleMute = useCallback(() => {
    const muted = tangramAudio.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleNextStage = useCallback(() => {
    const next = nextStage(stateRef.current);
    stateRef.current = next;
    setDisplayState({ ...next });
  }, []);

  const handleRestart = useCallback(() => {
    const restarted = restartGame(stateRef.current);
    stateRef.current = restarted;
    setDisplayState({ ...restarted });
  }, []);

  const handleResetCurrent = useCallback(() => {
    const reset = resetStage(stateRef.current);
    stateRef.current = reset;
    setDisplayState({ ...reset });
  }, []);

  // Render Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    renderTangramBoard(ctx, displayState, hoverCell);
  }, [displayState, hoverCell]);

  const renderTangramBoard = (
    ctx: CanvasRenderingContext2D,
    state: TangramState,
    hover: { row: number; col: number } | null
  ) => {
    const width = 420;
    const height = 480;

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    // 1. Cozy Wooden Workbench Texture Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1c0a00');
    bgGrad.addColorStop(0.5, '#2c1204');
    bgGrad.addColorStop(1, '#1c0a00');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Workbench grain slats
    ctx.strokeStyle = 'rgba(69, 26, 3, 0.4)';
    ctx.lineWidth = 1.5;
    for (let y = 30; y < height; y += 45) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    const config = STAGE_CONFIGS[state.stage - 1] || STAGE_CONFIGS[0];
    const cellSize = 46;
    const boardWidth = config.gridCols * cellSize;
    const boardHeight = config.gridRows * cellSize;
    const startX = (width - boardWidth) / 2;
    const startY = (height - boardHeight) / 2;

    // 2. Outer Beveled Carved Frame
    ctx.fillStyle = '#451a03';
    ctx.strokeStyle = '#291002';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.roundRect(startX - 14, startY - 14, boardWidth + 28, boardHeight + 28, 20);
    ctx.fill();
    ctx.stroke();

    // Corner Brass Rivets
    const drawRivet = (rx: number, ry: number) => {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(rx, ry, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#713f12';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    };
    drawRivet(startX - 4, startY - 4);
    drawRivet(startX + boardWidth + 4, startY - 4);
    drawRivet(startX - 4, startY + boardHeight + 4);
    drawRivet(startX + boardWidth + 4, startY + boardHeight + 4);

    // 3. Grid Cells: Target Silhouette vs Empty Wood
    for (let r = 0; r < config.gridRows; r++) {
      for (let c = 0; c < config.gridCols; c++) {
        const cellX = startX + c * cellSize;
        const cellY = startY + r * cellSize;
        const isTarget = state.targetMask[r][c];
        const placedPieceId = state.boardGrid[r][c];

        if (isTarget) {
          // Recessed Carved Silhouette Basin
          ctx.fillStyle = '#0f0702';
          ctx.beginPath();
          ctx.roundRect(cellX + 1.5, cellY + 1.5, cellSize - 3, cellSize - 3, 6);
          ctx.fill();

          // Golden Dashed Outline
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          // Neutral Wooden Board Tile
          ctx.fillStyle = 'rgba(120, 53, 15, 0.35)';
          ctx.beginPath();
          ctx.roundRect(cellX + 2, cellY + 2, cellSize - 4, cellSize - 4, 4);
          ctx.fill();
        }

        // Render Placed Piece Cell
        if (placedPieceId) {
          const piece = state.pieces.find((p) => p.id === placedPieceId);
          if (piece) {
            drawWoodBlockCell(ctx, cellX + 1, cellY + 1, cellSize - 2, piece.color);
          }
        }
      }
    }

    // 4. Ghost Placement Preview (When hovering with selected piece)
    if (state.selectedPieceId && hover) {
      const piece = state.pieces.find((p) => p.id === state.selectedPieceId);
      if (piece) {
        const isValid = canPlacePiece(
          state.boardGrid,
          state.targetMask,
          piece.shape,
          hover.row,
          hover.col,
          piece.id
        );

        const pRows = piece.shape.length;
        const pCols = piece.shape[0].length;

        for (let pr = 0; pr < pRows; pr++) {
          for (let pc = 0; pc < pCols; pc++) {
            if (piece.shape[pr][pc] === 1) {
              const gr = hover.row + pr;
              const gc = hover.col + pc;
              if (gr >= 0 && gr < config.gridRows && gc >= 0 && gc < config.gridCols) {
                const gx = startX + gc * cellSize;
                const gy = startY + gr * cellSize;

                ctx.fillStyle = isValid ? 'rgba(52, 211, 153, 0.55)' : 'rgba(239, 68, 68, 0.55)';
                ctx.beginPath();
                ctx.roundRect(gx + 2, gy + 2, cellSize - 4, cellSize - 4, 6);
                ctx.fill();
                ctx.strokeStyle = isValid ? '#34d399' : '#ef4444';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // 5. Celebration Aura if Stage Cleared
    if (state.status === 'stage_cleared' || state.status === 'victory') {
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 4;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.roundRect(startX - 6, startY - 6, boardWidth + 12, boardHeight + 12, 16);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }

    ctx.restore();
  };

  const drawWoodBlockCell = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    color: WoodColor
  ) => {
    ctx.save();

    // Wood tone gradients
    const grad = ctx.createLinearGradient(x, y, x + size, y + size);
    switch (color) {
      case 'cherry':
        grad.addColorStop(0, '#f87171');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, '#991b1b');
        break;
      case 'oak':
        grad.addColorStop(0, '#fde047');
        grad.addColorStop(0.5, '#eab308');
        grad.addColorStop(1, '#ca8a04');
        break;
      case 'walnut':
        grad.addColorStop(0, '#a16207');
        grad.addColorStop(0.5, '#854d0e');
        grad.addColorStop(1, '#713f12');
        break;
      case 'pine':
        grad.addColorStop(0, '#86efac');
        grad.addColorStop(0.5, '#22c55e');
        grad.addColorStop(1, '#15803d');
        break;
      case 'mahogany':
        grad.addColorStop(0, '#fb923c');
        grad.addColorStop(0.5, '#ea580c');
        grad.addColorStop(1, '#9a3412');
        break;
    }

    // Cell block
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x, y, size, size, 5);
    ctx.fill();

    // Inner Specular Bevel
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.restore();
  };

  const currentConfig = STAGE_CONFIGS[displayState.stage - 1] || STAGE_CONFIGS[0];
  const selectedPiece = displayState.pieces.find((p) => p.id === displayState.selectedPieceId);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-md mx-auto flex flex-col items-center select-none overflow-hidden touch-none overscroll-none rounded-3xl border border-amber-500/30 shadow-2xl bg-slate-950 p-2 sm:p-4 text-white"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* COMPACT SINGLE-SCREEN HUD */}
      <div className="w-full flex items-center justify-between gap-1 sm:gap-2 mb-2 px-1">
        {/* Left Cluster: Stage, Mascot & Score */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="bg-amber-500/20 border border-amber-500/40 px-2 sm:px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black text-amber-300 flex items-center gap-1">
            <span>{currentConfig.animalMascot}</span>
            <span>STG {displayState.stage}/4</span>
          </div>
          <div className="bg-slate-900 border border-slate-700/80 px-2 sm:px-2.5 py-1 rounded-xl text-xs sm:text-sm font-black text-amber-400 flex items-center gap-1 shadow-sm">
            <Trophy className="w-3.5 h-3.5 text-amber-400" />
            <span>{displayState.score}</span>
          </div>
        </div>

        {/* Right Cluster: Rotate, Audio & Restart */}
        <div className="flex items-center gap-1 sm:gap-2">
          {selectedPiece && (
            <button
              onClick={handleRotateSelected}
              aria-label="Rotate Selected Piece"
              className="px-2.5 py-1 min-h-[38px] sm:min-h-[44px] rounded-xl bg-amber-500/20 hover:bg-amber-500/30 active:scale-95 border border-amber-500/40 flex items-center gap-1 text-amber-300 font-extrabold text-xs transition-all cursor-pointer touch-manipulation"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>ROTATE</span>
            </button>
          )}

          <button
            onClick={handleToggleMute}
            aria-label={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation relative after:absolute after:-inset-1.5 after:content-['']"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleResetCurrent}
            aria-label="Restart Level"
            className="w-9 h-9 sm:w-10 sm:h-10 min-w-[38px] sm:min-w-[44px] min-h-[38px] sm:min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 flex items-center justify-center text-slate-300 hover:text-white transition-all cursor-pointer touch-manipulation relative after:absolute after:-inset-1.5 after:content-['']"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CANVAS CONTAINER */}
      <div className="relative w-full aspect-[420/480] max-h-[calc(100vh-220px)] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900">
        <canvas
          ref={canvasRef}
          width={420}
          height={480}
          onPointerDown={handleBoardClick}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-contain block cursor-pointer"
        />

        {/* PROGRESS BADGE OVERLAY */}
        <div className="absolute top-2.5 left-2.5 pointer-events-none">
          <div className="bg-slate-950/80 backdrop-blur-sm border border-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-black text-slate-300 shadow">
            Fitted: <span className="text-amber-400 font-extrabold">{displayState.filledTargetCells}</span> / {displayState.totalTargetCells}
          </div>
        </div>

        {/* STAGE CLEARED MODAL */}
        {displayState.status === 'stage_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-emerald-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-emerald-400/20 border-2 border-emerald-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-emerald-400/20 animate-bounce">
                {currentConfig.animalMascot}
              </div>
              <h3 className="text-2xl font-black text-emerald-300 tracking-tight">{currentConfig.animalName.toUpperCase()} SOLVED!</h3>
              <p className="text-sm text-slate-300 mt-1 mb-4">
                You perfectly fitted every wooden block without overlap! Score: <span className="font-bold text-amber-400">{displayState.score}</span>
              </p>
              <button
                onClick={handleNextStage}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <span>NEXT SILHOUETTE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* VICTORY OVERLAY */}
        {displayState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-fade-in z-30 max-h-[90vh] overflow-y-auto">
            <div className="bg-slate-900 border border-amber-400/50 rounded-3xl p-5 sm:p-6 text-center max-w-sm w-full shadow-2xl flex flex-col items-center">
              <div className="w-20 h-20 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-4xl mb-3 shadow-lg shadow-amber-400/30 animate-pulse">
                🏆
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-300 tracking-tight">TANGRAM MASTER!</h3>
              <p className="text-sm text-slate-200 mt-1 mb-2">
                You carved and assembled all 4 farm animal wooden silhouettes flawlessly!
              </p>
              <div className="text-lg font-black text-emerald-400 bg-emerald-950/60 px-4 py-2 rounded-xl border border-emerald-500/40 my-3">
                Final Score: {displayState.score}
              </div>
              <button
                onClick={handleRestart}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-amber-400/30 active:scale-95 transition-all cursor-pointer min-h-[44px] touch-manipulation"
              >
                <RotateCcw className="w-5 h-5" />
                <span>PLAY AGAIN</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM TRAY OF WOODEN BLOCKS */}
      <div className="w-full mt-2.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-1 text-[11px] font-black text-amber-300/80 uppercase tracking-wider">
          <span>WOODEN TRAY (TAP TO PICK / ROTATE)</span>
          {selectedPiece && <span className="text-emerald-400 font-extrabold animate-pulse">TAP BOARD TO PLACE</span>}
        </div>

        <div className="w-full flex items-center gap-2 overflow-x-auto py-1 px-0.5 scrollbar-thin">
          {displayState.pieces.map((piece) => {
            const isSelected = displayState.selectedPieceId === piece.id;
            const isPlaced = piece.placedRow !== null;

            return (
              <button
                key={piece.id}
                onClick={() => handleSelectPiece(piece.id)}
                className={`relative flex flex-col items-center justify-center p-2 rounded-2xl border transition-all cursor-pointer touch-manipulation shrink-0 min-h-[64px] min-w-[64px] ${
                  isSelected
                    ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_14px_rgba(251,191,36,0.6)] scale-105'
                    : isPlaced
                    ? 'bg-slate-900/60 border-slate-700/60 opacity-60'
                    : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600'
                }`}
                title={piece.name}
              >
                {/* Mini Shape Matrix Preview */}
                <div className="flex flex-col gap-0.5 pointer-events-none">
                  {piece.shape.map((row, rIdx) => (
                    <div key={rIdx} className="flex gap-0.5">
                      {row.map((cell, cIdx) => (
                        <div
                          key={cIdx}
                          className={`w-3 h-3 rounded-[2px] ${
                            cell === 1
                              ? piece.color === 'cherry'
                                ? 'bg-red-500'
                                : piece.color === 'oak'
                                ? 'bg-amber-400'
                                : piece.color === 'walnut'
                                ? 'bg-amber-700'
                                : piece.color === 'pine'
                                ? 'bg-emerald-500'
                                : 'bg-orange-500'
                              : 'bg-transparent'
                          }`}
                        />
                      ))}
                    </div>
                  ))}
                </div>

                {/* Placed badge */}
                {isPlaced && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

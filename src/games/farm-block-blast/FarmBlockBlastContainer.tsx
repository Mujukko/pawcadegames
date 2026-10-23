import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Trophy,
  Flame,
  Sparkles,
  HelpCircle,
  X,
  CheckCircle2,
} from 'lucide-react';
import {
  GRID_SIZE,
  GameState,
  PieceShape,
  canPieceFitAnywhere,
  canPlacePiece,
  createInitialGameState,
  placePiece,
} from './logic/engine';
import { farmBlockAudio } from './systems/sound';

const STORAGE_KEY_BEST = 'pawcade_farm_block_blast_best';

// Block Visual Themes based on colorIndex (1 to 6)
const BLOCK_STYLES: Record<
  number,
  { bg: string; border: string; icon: string; glow: string; text: string }
> = {
  1: {
    bg: 'bg-amber-700',
    border: 'border-amber-500',
    icon: '🪵',
    glow: 'shadow-amber-600/30',
    text: 'text-amber-200',
  },
  2: {
    bg: 'bg-orange-600',
    border: 'border-orange-400',
    icon: '🎃',
    glow: 'shadow-orange-500/30',
    text: 'text-orange-100',
  },
  3: {
    bg: 'bg-yellow-500',
    border: 'border-yellow-300',
    icon: '🌽',
    glow: 'shadow-yellow-400/30',
    text: 'text-yellow-950',
  },
  4: {
    bg: 'bg-rose-600',
    border: 'border-rose-400',
    icon: '🍎',
    glow: 'shadow-rose-500/30',
    text: 'text-rose-100',
  },
  5: {
    bg: 'bg-purple-600',
    border: 'border-purple-400',
    icon: '🫐',
    glow: 'shadow-purple-500/30',
    text: 'text-purple-100',
  },
  6: {
    bg: 'bg-emerald-600',
    border: 'border-emerald-400',
    icon: '🥬',
    glow: 'shadow-emerald-500/30',
    text: 'text-emerald-100',
  },
};

export const FarmBlockBlastContainer: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(() => {
    let saved = 0;
    try {
      const val = localStorage.getItem(STORAGE_KEY_BEST);
      if (val) saved = parseInt(val, 10) || 0;
    } catch {}
    return createInitialGameState(saved);
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => farmBlockAudio.getMuted());
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [hoverTarget, setHoverTarget] = useState<{ row: number; col: number } | null>(null);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [clearingEffect, setClearingEffect] = useState<{ rows: number[]; cols: number[] } | null>(null);

  // Drag and drop state
  const boardRef = useRef<HTMLDivElement>(null);
  const [dragState, setDragState] = useState<{
    pieceIndex: number;
    piece: PieceShape;
    currentX: number;
    currentY: number;
    isDragging: boolean;
    pointerType: string;
  } | null>(null);

  const dragPointerIdRef = useRef<number | null>(null);
  const dragStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Sync best score to localStorage
  useEffect(() => {
    if (gameState.score > gameState.bestScore) {
      try {
        localStorage.setItem(STORAGE_KEY_BEST, String(gameState.score));
      } catch {}
    }
  }, [gameState.score, gameState.bestScore]);

  // Handle Game Over sound & celebrations
  useEffect(() => {
    if (gameState.isGameOver) {
      farmBlockAudio.playGameOver();
      if (gameState.score > 0 && gameState.score >= gameState.bestScore) {
        try {
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#f59e0b', '#10b981', '#ef4444', '#8b5cf6'],
          });
        } catch {}
      }
    }
  }, [gameState.isGameOver, gameState.score, gameState.bestScore]);

  const toggleSound = useCallback(() => {
    const next = farmBlockAudio.toggleMute();
    setIsMuted(next);
  }, []);

  const handleRestart = useCallback(() => {
    farmBlockAudio.playPick();
    setSelectedPieceIndex(null);
    setHoverTarget(null);
    setClearingEffect(null);
    setDragState(null);
    setGameState((prev) => createInitialGameState(prev.bestScore));
  }, []);

  // Keyboard controls (R: restart, M: mute, 1/2/3: select piece, Esc: deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      } else if (e.key === '1') {
        if (gameState.availablePieces[0]) setSelectedPieceIndex(0);
      } else if (e.key === '2') {
        if (gameState.availablePieces[1]) setSelectedPieceIndex(1);
      } else if (e.key === '3') {
        if (gameState.availablePieces[2]) setSelectedPieceIndex(2);
      } else if (e.key === 'Escape') {
        setSelectedPieceIndex(null);
        setIsHowToPlayOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRestart, toggleSound, gameState.availablePieces]);

  // Core placement execution with haptics and audio
  const executePlacement = useCallback(
    (r: number, c: number, pieceIdx: number): boolean => {
      if (gameState.isGameOver) return false;
      const piece = gameState.availablePieces[pieceIdx];
      if (!piece) return false;

      if (!canPlacePiece(gameState.grid, piece, r, c)) {
        return false;
      }

      farmBlockAudio.playPlace();

      // Subtle tactile haptic tick
      try {
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate(15);
        }
      } catch {}

      const result = placePiece(gameState, pieceIdx, r, c);
      if (result.success) {
        if (result.clearedRows.length > 0 || result.clearedCols.length > 0) {
          farmBlockAudio.playLineClear();
          farmBlockAudio.playCombo(result.comboStreak);

          // Haptic burst for line clearing
          try {
            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
              navigator.vibrate([25, 30, 45]);
            }
          } catch {}

          // Visual straw clear flash effect
          setClearingEffect({ rows: result.clearedRows, cols: result.clearedCols });
          setTimeout(() => setClearingEffect(null), 350);

          if (result.comboStreak >= 3) {
            try {
              confetti({
                particleCount: 40,
                spread: 50,
                origin: { y: 0.5 },
                colors: ['#f59e0b', '#eab308', '#22c55e'],
              });
            } catch {}
          }
        }

        setGameState(result.state);
        setSelectedPieceIndex(null);
        setHoverTarget(null);
        setDragState(null);
        return true;
      }
      return false;
    },
    [gameState]
  );

  // Try placing selected piece at target (r, c) via tap/click
  const handleCellClick = (r: number, c: number) => {
    if (selectedPieceIndex === null) return;
    executePlacement(r, c, selectedPieceIndex);
  };

  // Select a piece from the barn tray (tap-to-select)
  const handleSelectPiece = (index: number) => {
    if (gameState.isGameOver) return;
    const piece = gameState.availablePieces[index];
    if (!piece) return;

    farmBlockAudio.playPick();
    if (selectedPieceIndex === index) {
      setSelectedPieceIndex(null); // Toggle off
    } else {
      setSelectedPieceIndex(index);
    }
  };

  // Calculate target grid row/col from screen pointer coordinates
  const calculateGridTarget = useCallback(
    (clientX: number, clientY: number, piece: PieceShape, pointerType: string) => {
      if (!boardRef.current) return null;
      const rect = boardRef.current.getBoundingClientRect();

      // For touch devices, offset upwards by 65px so the finger does not obscure the target cells
      const offsetY = pointerType === 'touch' ? 65 : 25;
      const adjustedX = clientX;
      const adjustedY = clientY - offsetY;

      // Board has 10px inner padding
      const pad = 10;
      const boardWidth = rect.width - pad * 2;
      const cellSize = boardWidth / GRID_SIZE;

      // Anchor piece near center of its bounding box for natural feel
      const col = Math.round((adjustedX - (rect.left + pad)) / cellSize - piece.width / 2);
      const row = Math.round((adjustedY - (rect.top + pad)) / cellSize - piece.height / 2);

      // Check if candidate placement sits inside or slightly at board boundaries
      if (
        row >= 0 &&
        row <= GRID_SIZE - piece.height &&
        col >= 0 &&
        col <= GRID_SIZE - piece.width
      ) {
        return { row, col };
      }

      return null;
    },
    []
  );

  // Pointer Down on Tray Piece: initiates fluid drag or tap selection
  const handlePiecePointerDown = (index: number, e: React.PointerEvent) => {
    if (gameState.isGameOver) return;
    const piece = gameState.availablePieces[index];
    if (!piece || !canPieceFitAnywhere(gameState.grid, piece)) return;

    farmBlockAudio.playPick();
    dragPointerIdRef.current = e.pointerId;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };

    setDragState({
      pieceIndex: index,
      piece,
      currentX: e.clientX,
      currentY: e.clientY,
      isDragging: false,
      pointerType: e.pointerType,
    });
    setSelectedPieceIndex(index);
  };

  // Global window pointer listeners while dragging
  useEffect(() => {
    if (!dragState) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) return;

      const dist = Math.hypot(
        e.clientX - dragStartPosRef.current.x,
        e.clientY - dragStartPosRef.current.y
      );

      const isDraggingNow = dragState.isDragging || dist >= 8;

      const target = isDraggingNow
        ? calculateGridTarget(e.clientX, e.clientY, dragState.piece, dragState.pointerType)
        : null;

      setHoverTarget(target);
      setDragState((prev) =>
        prev
          ? {
              ...prev,
              currentX: e.clientX,
              currentY: e.clientY,
              isDragging: isDraggingNow,
            }
          : null
      );
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (dragPointerIdRef.current !== null && e.pointerId !== dragPointerIdRef.current) return;

      const isDragging = dragState.isDragging;
      const pieceIdx = dragState.pieceIndex;
      const piece = dragState.piece;

      if (isDragging) {
        const target = calculateGridTarget(e.clientX, e.clientY, piece, dragState.pointerType);
        if (target && canPlacePiece(gameState.grid, piece, target.row, target.col)) {
          executePlacement(target.row, target.col, pieceIdx);
        } else {
          // Snap back to tray if dropped on invalid cell
          setHoverTarget(null);
        }
      }

      dragPointerIdRef.current = null;
      setDragState(null);
    };

    const handlePointerCancel = () => {
      dragPointerIdRef.current = null;
      setDragState(null);
      setHoverTarget(null);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [dragState, calculateGridTarget, executePlacement, gameState.grid]);

  const selectedPiece =
    selectedPieceIndex !== null ? gameState.availablePieces[selectedPieceIndex] : null;

  return (
    <div className="flex flex-col items-center justify-start w-full max-w-xl mx-auto px-2 sm:px-4 py-1 select-none text-slate-100">
      {/* 1. Header Bar: Barnaby Avatar, Score, Best, and Controls */}
      <div className="w-full bg-slate-800/90 border border-amber-500/30 rounded-2xl p-2.5 sm:p-3 mb-2 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          {/* Barnaby the Dog Avatar */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-md flex items-center justify-center text-2xl">
              🐶
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  Barnaby's Grid
                </span>
                {gameState.combo > 1 && (
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 font-extrabold text-[10px] animate-pulse flex items-center gap-1">
                    <Flame className="w-3 h-3 text-rose-400" />
                    {gameState.combo}x Combo
                  </span>
                )}
              </div>
              <h1 className="text-sm sm:text-base font-black text-white tracking-tight">
                Farm Block Blast
              </h1>
            </div>
          </div>

          {/* Scores Badges */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="bg-slate-900/90 border border-slate-700 rounded-xl px-2.5 py-1 text-center min-w-[70px]">
              <div className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Score</div>
              <div className="text-sm sm:text-base font-black text-white">{gameState.score}</div>
            </div>

            <div className="bg-slate-900/90 border border-amber-500/40 rounded-xl px-2.5 py-1 text-center min-w-[70px]">
              <div className="text-[9px] font-bold uppercase tracking-wider text-amber-400/90 flex items-center justify-center gap-0.5">
                <Trophy className="w-2.5 h-2.5 text-amber-400" />
                <span>Best</span>
              </div>
              <div className="text-sm sm:text-base font-black text-amber-400">{gameState.bestScore}</div>
            </div>

            {/* Quick Actions (WCAG 44x44px Touch Targets) */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsHowToPlayOpen(true)}
                title="How to Play"
                aria-label="Open How to Play guide"
                className="w-10 h-10 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={toggleSound}
                title={isMuted ? 'Unmute' : 'Mute'}
                aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
                className="w-10 h-10 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
                )}
              </button>
              <button
                onClick={handleRestart}
                title="Restart Game"
                aria-label="Restart Game session"
                className="w-10 h-10 sm:w-11 sm:h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 8x8 Wooden Barnyard Game Board */}
      <div
        ref={boardRef}
        className="relative w-full max-w-[440px] aspect-square bg-slate-950/95 border-4 border-amber-950/80 rounded-2xl p-2 sm:p-2.5 shadow-2xl backdrop-blur-md touch-none select-none flex flex-col justify-between mb-3"
      >
        {/* 8x8 Grid */}
        <div className="grid grid-cols-8 grid-rows-8 gap-1 sm:gap-1.5 w-full h-full">
          {Array.from({ length: 64 }).map((_, idx) => {
            const r = Math.floor(idx / 8);
            const c = idx % 8;
            const cellValue = gameState.grid[r]![c]!;
            const style = cellValue > 0 ? BLOCK_STYLES[cellValue] : null;

            // Check if cell is in clearing animation
            const isClearing =
              clearingEffect &&
              (clearingEffect.rows.includes(r) || clearingEffect.cols.includes(c));

            // Check if cell is hovered by selected piece or dragging piece
            const activePiece = dragState?.isDragging ? dragState.piece : selectedPiece;
            let isPreview = false;
            let isPreviewValid = false;
            if (activePiece && hoverTarget) {
              const relR = r - hoverTarget.row;
              const relC = c - hoverTarget.col;
              if (
                relR >= 0 &&
                relR < activePiece.height &&
                relC >= 0 &&
                relC < activePiece.width
              ) {
                if (activePiece.matrix[relR]![relC]) {
                  isPreview = true;
                  isPreviewValid = canPlacePiece(
                    gameState.grid,
                    activePiece,
                    hoverTarget.row,
                    hoverTarget.col
                  );
                }
              }
            }

            return (
              <div
                key={`${r}-${c}`}
                onClick={() => handleCellClick(r, c)}
                onMouseEnter={() => {
                  if (!dragState?.isDragging) {
                    setHoverTarget({ row: r, col: c });
                  }
                }}
                className={`relative rounded-lg flex items-center justify-center transition-all duration-100 aspect-square cursor-pointer overflow-hidden ${
                  isClearing
                    ? 'bg-amber-300 ring-4 ring-amber-400 scale-110 z-20 animate-pulse'
                    : cellValue > 0 && style
                    ? `${style.bg} border-2 ${style.border} ${style.glow} shadow-md`
                    : isPreview
                    ? isPreviewValid
                      ? 'bg-amber-400/50 border-2 border-amber-300 ring-2 ring-amber-400/40'
                      : 'bg-rose-500/40 border-2 border-rose-400'
                    : 'bg-slate-900/80 border border-slate-800/80 hover:bg-slate-850'
                }`}
              >
                {cellValue > 0 && style && (
                  <span className="text-base sm:text-lg select-none transform transition-transform duration-100 leading-none">
                    {style.icon}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Game Over Modal Overlay */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-5 text-center z-30 animate-in fade-in duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-4xl mb-1 animate-bounce select-none">🐶🦴</div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              No More Room in the Barn!
            </h2>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xs">
              None of the remaining barn crates fit onto the 8x8 grid.
            </p>

            <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3 my-3 w-full max-w-xs flex justify-around shadow-inner">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Score</div>
                <div className="text-lg sm:text-xl font-black text-amber-300">{gameState.score}</div>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Best</div>
                <div className="text-lg sm:text-xl font-black text-amber-400">{gameState.bestScore}</div>
              </div>
              <div className="border-r border-slate-800" />
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Lines Cleared</div>
                <div className="text-lg sm:text-xl font-black text-emerald-400">
                  {gameState.linesClearedTotal}
                </div>
              </div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full max-w-xs py-3 px-4 min-h-[48px] rounded-xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg shadow-amber-400/30 transform active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Play Again</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. Barn Piece Tray (3 Pieces to Place) */}
      <div className="w-full bg-slate-800/90 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl backdrop-blur-md touch-none">
        <div className="flex items-center justify-between mb-1.5 px-1">
          <span className="text-xs font-black uppercase tracking-wider text-amber-300">
            {dragState?.isDragging
              ? 'Drag over grid to drop piece'
              : selectedPieceIndex !== null
              ? 'Tap grid cell to place selected block'
              : 'Drag or Tap a Block from the Barn'}
          </span>
          <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
            Clear full rows & columns for combos!
          </span>
        </div>

        {/* 3 Piece Slots */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full">
          {gameState.availablePieces.map((piece, idx) => {
            if (!piece) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[88px] rounded-xl bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center text-slate-600 text-xs italic"
                >
                  Used
                </div>
              );
            }

            const isSelected = selectedPieceIndex === idx;
            const isDraggingThis = dragState?.pieceIndex === idx && dragState.isDragging;
            const canFit = canPieceFitAnywhere(gameState.grid, piece);
            const style = BLOCK_STYLES[piece.colorIndex] || BLOCK_STYLES[1]!;

            return (
              <button
                key={piece.id + idx}
                onPointerDown={(e) => handlePiecePointerDown(idx, e)}
                disabled={!canFit}
                className={`relative min-h-[88px] rounded-xl p-2 flex flex-col items-center justify-center transition-all select-none touch-none cursor-grab active:cursor-grabbing ${
                  isDraggingThis
                    ? 'opacity-30 scale-95 border-dashed border-2 border-amber-400/60'
                    : isSelected
                    ? 'bg-amber-500/20 border-2 border-amber-400 ring-2 ring-amber-400/30 shadow-lg scale-103'
                    : canFit
                    ? 'bg-slate-900 hover:bg-slate-850 border border-slate-700 hover:border-amber-400/40 shadow-md active:scale-95'
                    : 'bg-slate-950/60 border border-slate-800 opacity-40 cursor-not-allowed'
                }`}
                title={piece.name}
                aria-label={`Barn piece ${piece.name}`}
              >
                {/* Mini Shape Preview Grid */}
                <div
                  className="grid gap-0.5 sm:gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${piece.width}, minmax(0, 1fr))`,
                  }}
                >
                  {piece.matrix.map((row, rIdx) =>
                    row.map((active, cIdx) => (
                      <div
                        key={`${rIdx}-${cIdx}`}
                        className={`w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-[4px] flex items-center justify-center text-[8px] ${
                          active
                            ? `${style.bg} border ${style.border}`
                            : 'bg-transparent'
                        }`}
                      >
                        {active && <span>{style.icon}</span>}
                      </div>
                    ))
                  )}
                </div>

                <span className="text-[10px] font-bold text-slate-400 mt-1.5 truncate max-w-full">
                  {piece.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Floating Drag Ghost Preview (Elevated above finger/cursor for tactile commercial feel) */}
      {dragState?.isDragging && (
        <div
          className="fixed pointer-events-none z-50 transform -translate-x-1/2 -translate-y-1/2 drop-shadow-2xl transition-transform duration-75"
          style={{
            left: `${dragState.currentX}px`,
            top: `${
              dragState.currentY - (dragState.pointerType === 'touch' ? 70 : 25)
            }px`,
          }}
        >
          <div
            className="grid gap-1 p-2 rounded-xl bg-slate-900/80 border border-amber-400/60 backdrop-blur-sm shadow-2xl scale-110"
            style={{
              gridTemplateColumns: `repeat(${dragState.piece.width}, minmax(0, 1fr))`,
            }}
          >
            {dragState.piece.matrix.map((row, rIdx) =>
              row.map((active, cIdx) => {
                const style =
                  BLOCK_STYLES[dragState.piece.colorIndex] || BLOCK_STYLES[1]!;
                return (
                  <div
                    key={`drag-${rIdx}-${cIdx}`}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-sm ${
                      active
                        ? `${style.bg} border-2 ${style.border} ${style.glow} shadow-lg`
                        : 'bg-transparent'
                    }`}
                  >
                    {active && <span>{style.icon}</span>}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 4. How to Play Modal */}
      {isHowToPlayOpen && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto text-slate-100">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🐶</span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  How to Play Farm Block Blast
                </h3>
              </div>
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-xl">1️⃣</span>
                <div>
                  <strong className="text-amber-300 block">Pick a Farm Block</strong>
                  <span>Tap any of the 3 available pieces from the barn tray below the board.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-xl">2️⃣</span>
                <div>
                  <strong className="text-amber-300 block">Place on the 8x8 Grid</strong>
                  <span>Tap any empty spot on the board to place your block. Blocks cannot overlap existing crates.</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-800/60 border border-slate-700">
                <span className="text-xl">3️⃣</span>
                <div>
                  <strong className="text-amber-300 block">Clear Lines for Combos!</strong>
                  <span>Fill entire horizontal rows or vertical columns to clear them and trigger golden straw blasts! Consecutive clears multiply your combo score!</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-purple-950/50 border border-purple-500/40 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <span className="text-xs text-purple-200">
                  <strong>Pro Gamer Tip:</strong> Plan ahead for big 3x3 granary squares and 5-length lines. Leaving open spaces prevents sudden game overs!
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsHowToPlayOpen(false)}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-md transition-colors cursor-pointer"
              >
                Got It, Let's Blast!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

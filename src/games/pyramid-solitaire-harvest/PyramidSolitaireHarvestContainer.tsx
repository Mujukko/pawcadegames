import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  createInitialState,
  drawStockCard,
  getHint,
  isCardSelectable,
  redealWaste,
  selectCard,
} from './logic/engine';
import { Card, CardSuit, PyramidCard, PyramidGameState } from './logic/types';
import { sound } from './systems/sound';

const BOARD_WIDTH = 640;
const BOARD_HEIGHT = 480;
const CARD_W = 50;
const CARD_H = 70;

export const PyramidSolitaireHarvestContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<PyramidGameState>(() => createInitialState());
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const [activeHint, setActiveHint] = useState<{ card1Id: string; card2Id?: string } | null>(null);
  const stateRef = useRef<PyramidGameState>(gameState);
  stateRef.current = gameState;

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleDraw = useCallback(() => {
    setGameState((prev) => drawStockCard(prev));
    setActiveHint(null);
  }, []);

  const handleCardClick = useCallback((cardId: string) => {
    setGameState((prev) => selectCard(prev, cardId));
    setActiveHint(null);
  }, []);

  const handleHint = useCallback(() => {
    const hint = getHint(stateRef.current);
    if (hint) {
      sound.playFlip();
      setActiveHint(hint);
    }
  }, []);

  const handleNewGame = useCallback(() => {
    setGameState(createInitialState());
    setActiveHint(null);
  }, []);

  // Compute card positions
  const getPyramidCardPosition = useCallback((row: number, col: number) => {
    const rowSpacing = 38;
    const colSpacing = 56;
    const y = 45 + row * rowSpacing;
    const totalRowWidth = row * colSpacing;
    const startX = (BOARD_WIDTH - totalRowWidth) / 2;
    const x = startX + col * colSpacing;
    return { x, y };
  }, []);

  // Pointer interactions
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const state = stateRef.current;
    if (state.status !== 'playing') return;

    // 1. Check Stock Pile [x: 185..235, y: 375..445]
    if (clickX >= 185 && clickX <= 235 && clickY >= 375 && clickY <= 445) {
      handleDraw();
      return;
    }

    // 2. Check Waste Pile [x: 260..310, y: 375..445]
    if (state.waste.length > 0) {
      if (clickX >= 260 && clickX <= 310 && clickY >= 375 && clickY <= 445) {
        handleCardClick(state.waste[0].id);
        return;
      }
    }

    // 3. Check Pyramid Cards (iterate bottom to top so lower/uncovered cards take click precedence)
    const sortedPyramid = [...state.pyramid].sort((a, b) => b.row - a.row);
    for (const card of sortedPyramid) {
      if (card.isRemoved) continue;
      const { x, y } = getPyramidCardPosition(card.row, card.col);
      if (
        clickX >= x - CARD_W / 2 &&
        clickX <= x + CARD_W / 2 &&
        clickY >= y &&
        clickY <= y + CARD_H
      ) {
        handleCardClick(card.id);
        return;
      }
    }
  }, [getPyramidCardPosition, handleCardClick, handleDraw]);

  // Audio effects when events fire
  useEffect(() => {
    if (gameState.events.length > 0) {
      for (const ev of gameState.events) {
        if (ev.type === 'draw') {
          sound.playFlip();
        } else if (ev.type === 'redeal') {
          sound.playRedeal();
        } else if (ev.type === 'match') {
          sound.playMatch();
        } else if (ev.type === 'king_clear') {
          sound.playKing();
        } else if (ev.type === 'victory') {
          sound.playVictory();
        }
      }
    }
  }, [gameState.events]);

  // Redraw Canvas Scene
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawScene(ctx, gameState, activeHint);
  }, [gameState, activeHint, getPyramidCardPosition]);

  const drawScene = (
    ctx: CanvasRenderingContext2D,
    state: PyramidGameState,
    hint: { card1Id: string; card2Id?: string } | null
  ) => {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 1. Cozy Emerald Green Baize Felt Table with Warm Wood Border
    const feltGrad = ctx.createRadialGradient(BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 40, BOARD_WIDTH / 2, BOARD_HEIGHT / 2, 380);
    feltGrad.addColorStop(0, '#15803D');
    feltGrad.addColorStop(0.8, '#166534');
    feltGrad.addColorStop(1, '#14532D');
    ctx.fillStyle = feltGrad;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Rustic Wood Table Border
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, BOARD_WIDTH - 10, BOARD_HEIGHT - 10);
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(10, 10, BOARD_WIDTH - 20, BOARD_HEIGHT - 20);

    // 2. Draw 28 Pyramid Cards
    for (const card of state.pyramid) {
      if (card.isRemoved) continue;
      const { x, y } = getPyramidCardPosition(card.row, card.col);
      const isSelected = state.selectedCardId === card.id;
      const isHinted = hint && (hint.card1Id === card.id || hint.card2Id === card.id);

      drawCard(ctx, card, x - CARD_W / 2, y, card.isCovered, isSelected, !!isHinted);
    }

    // 3. Draw Stock & Waste Section at Bottom
    // Stock Pile
    const stockX = 210 - CARD_W / 2;
    const stockY = 375;
    if (state.stock.length > 0) {
      // Draw stacked deck effect
      drawCardBack(ctx, stockX + 3, stockY - 3);
      drawCardBack(ctx, stockX, stockY);
      // Stock count badge
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${state.stock.length}`, stockX + CARD_W / 2, stockY + CARD_H + 15);
    } else {
      // Empty stock slot (redeal indicator)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(stockX, stockY, CARD_W, CARD_H);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(state.redealsRemaining > 0 ? 'REDEAL 🔄' : 'EMPTY', stockX + CARD_W / 2, stockY + CARD_H / 2 + 4);
    }

    // Waste Pile
    const wasteX = 285 - CARD_W / 2;
    const wasteY = 375;
    if (state.waste.length > 0) {
      const topWaste = state.waste[0];
      const isSelected = state.selectedCardId === topWaste.id;
      const isHinted = hint && (hint.card1Id === topWaste.id || hint.card2Id === topWaste.id);

      drawCard(ctx, topWaste, wasteX, wasteY, false, isSelected, !!isHinted);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WASTE', wasteX + CARD_W / 2, wasteY + CARD_H + 15);
    } else {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.strokeRect(wasteX, wasteY, CARD_W, CARD_H);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WASTE', wasteX + CARD_W / 2, wasteY + CARD_H / 2 + 4);
    }

    // Goal Display Box on Right
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(400, 370, 200, 65);
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(400, 370, 200, 65);

    ctx.fillStyle = '#FEF08A';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('RULE: SUM TO 13 TO CLEAR', 500, 390);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '11px sans-serif';
    ctx.fillText('K=13 (Single) &bull; Q+A=13', 500, 408);
    ctx.fillText('J+2 &bull; 10+3 &bull; 9+4 &bull; 8+5 &bull; 7+6', 500, 424);
  };

  // Helper: Draw Card Back
  const drawCardBack = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.fillStyle = '#B91C1C';
    ctx.fillRect(x, y, CARD_W, CARD_H);
    ctx.strokeStyle = '#FEF3C7';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 3, y + 3, CARD_W - 6, CARD_H - 6);
  };

  // Helper: Draw Single Face-Up Card
  const drawCard = (
    ctx: CanvasRenderingContext2D,
    card: Card,
    x: number,
    y: number,
    isCovered: boolean,
    isSelected: boolean,
    isHinted: boolean
  ) => {
    ctx.save();

    // Drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(x + 2, y + 3, CARD_W, CARD_H);

    // Card Body
    ctx.fillStyle = isCovered ? '#CBD5E1' : '#FFFFFF';
    ctx.fillRect(x, y, CARD_W, CARD_H);

    // Highlight / Selection outline
    if (isSelected) {
      ctx.strokeStyle = '#F59E0B';
      ctx.lineWidth = 3.5;
      ctx.strokeRect(x, y, CARD_W, CARD_H);
    } else if (isHinted) {
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, CARD_W, CARD_H);
    } else {
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, CARD_W, CARD_H);
    }

    // Suit and Rank labels
    const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
    ctx.fillStyle = isCovered ? '#64748B' : isRed ? '#DC2626' : '#0F172A';

    const rankLabel =
      card.rank === 1 ? 'A' : card.rank === 11 ? 'J' : card.rank === 12 ? 'Q' : card.rank === 13 ? 'K' : String(card.rank);

    const suitSymbol =
      card.suit === 'hearts' ? '♥' : card.suit === 'diamonds' ? '♦' : card.suit === 'clubs' ? '♣' : '♠';

    // Top-left Rank & Suit
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(rankLabel, x + 4, y + 14);
    ctx.font = '10px sans-serif';
    ctx.fillText(suitSymbol, x + 4, y + 25);

    // Center Large Suit
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(suitSymbol, x + CARD_W / 2, y + CARD_H / 2 + 6);

    // Bottom Value Indicator badge (e.g. 13 for K, 12 for Q, 1 for A)
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`(${card.value})`, x + CARD_W - 4, y + CARD_H - 5);

    // Covered shadow overlay
    if (isCovered) {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
      ctx.fillRect(x, y, CARD_W, CARD_H);
    }

    ctx.restore();
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] max-h-[85vh] bg-[#0F291E] text-white select-none touch-none overflow-hidden rounded-2xl shadow-2xl p-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD */}
      <div className="w-full max-w-[640px] flex items-center justify-between px-3 py-1.5 bg-[#143B2A]/90 border border-amber-500/30 rounded-xl mb-1.5 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-amber-300">Pyramid Cards: {gameState.cardsRemainingInPyramid} / 28</span>
          <span className="text-slate-300">Score: <strong className="text-white">{gameState.score}</strong></span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-cyan-300 font-medium">Redeals: {gameState.redealsRemaining}</span>
          <button
            onClick={handleHint}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-[11px] rounded flex items-center gap-1"
          >
            <span>💡</span>
            <span>Hint</span>
          </button>
          <button
            onClick={handleNewGame}
            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] rounded"
          >
            New Game
          </button>
          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full max-w-[640px] aspect-[640/480] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onPointerDown={onPointerDown}
          className="w-full h-full rounded-xl border border-amber-500/40 shadow-inner cursor-pointer"
        />

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-3xl font-black text-amber-400 mb-1">PYRAMID CONQUERED! 🏆🌾</h2>
            <p className="text-slate-200 text-xs mb-3">
              You cleared all 28 cards in the harvest pyramid!
            </p>
            <div className="text-xl font-bold text-white mb-4">
              Final Score: <span className="text-amber-300">{gameState.score}</span>
            </div>
            <button
              onClick={handleNewGame}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Play Again 🃏
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint Footer */}
      <div className="text-[11px] text-slate-400 text-center mt-1">
        Tap unblocked cards that sum to 13 (or Kings alone) to clear them. Tap stock deck to draw cards!
      </div>
    </div>
  );
};
export default PyramidSolitaireHarvestContainer;

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  TriPeaksState,
  TriPeaksCard,
  FarmSuit,
} from './logic/types';
import {
  createInitialState,
  canClearCard,
  clearTableauCard,
  drawCard,
  undoMove,
  nextStage,
  getRankLabel,
  getSuitSymbol,
} from './logic/engine';
import { triPeaksAudio } from './systems/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

interface ScoreToast {
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
}

export const FarmTriPeaksSolitaireContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('pawcade_tripeaks_hi');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<TriPeaksState>(createInitialState(highScore, 0));
  const [hudState, setHudState] = useState<{
    score: number;
    streak: number;
    stage: number;
    stockCount: number;
    wildcards: number;
    canUndo: boolean;
    isWildcardActive: boolean;
    status: 'playing' | 'stage_clear' | 'game_over';
  }>({
    score: 0,
    streak: 1,
    stage: 1,
    stockCount: 23,
    wildcards: 1,
    canUndo: false,
    isWildcardActive: false,
    status: 'playing',
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => triPeaksAudio.getMuted());
  const [isWildcardMode, setIsWildcardMode] = useState<boolean>(false);
  const particlesRef = useRef<Particle[]>([]);
  const toastsRef = useRef<ScoreToast[]>([]);

  const spawnSparkles = (x: number, y: number, color: string = '#facc15', count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 40 + Math.random() * 80;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 20,
        alpha: 1,
        color,
        size: 2.5 + Math.random() * 3,
      });
    }
  };

  const spawnToast = (x: number, y: number, text: string, color: string = '#facc15') => {
    toastsRef.current.push({
      x,
      y,
      text,
      color,
      alpha: 1,
    });
  };

  const handleCardClick = useCallback((cardId: string) => {
    const isWild = isWildcardMode && stateRef.current.wildcardsLeft > 0;
    const res = clearTableauCard(stateRef.current, cardId, isWild);

    if (res.event) {
      stateRef.current = res.state;
      if (isWild) {
        setIsWildcardMode(false);
        triPeaksAudio.playWildcard();
      } else {
        triPeaksAudio.playCardMatch(res.state.streak);
      }

      const card = stateRef.current.tableau.find((c) => c.id === cardId);
      if (card) {
        spawnSparkles(card.x + 22, card.y + 32, isWild ? '#fde047' : '#4ade80', 14);
        spawnToast(card.x + 22, card.y, `+${100 * res.state.streak}`, '#facc15');
      }

      if (res.event.type === 'stage_completed') {
        triPeaksAudio.playStageClear();
        spawnSparkles(210, 200, '#facc15', 35);
      }
    }
  }, [isWildcardMode]);

  const handleDraw = useCallback(() => {
    const res = drawCard(stateRef.current);
    if (res.event) {
      stateRef.current = res.state;
      setIsWildcardMode(false);
      triPeaksAudio.playCardFlip();
      spawnSparkles(100, 420, '#bae6fd', 6);
    }
  }, []);

  const handleUndo = useCallback(() => {
    const res = undoMove(stateRef.current);
    if (res.event) {
      stateRef.current = res.state;
      setIsWildcardMode(false);
      triPeaksAudio.playUndo();
      spawnSparkles(210, 420, '#cbd5e1', 6);
    }
  }, []);

  const handleNextStage = () => {
    stateRef.current = nextStage(stateRef.current);
    particlesRef.current = [];
    toastsRef.current = [];
    setIsWildcardMode(false);
    triPeaksAudio.playCardFlip();
  };

  const handleRestart = () => {
    stateRef.current = createInitialState(highScore, stateRef.current.currentStageIndex);
    particlesRef.current = [];
    toastsRef.current = [];
    setIsWildcardMode(false);
  };

  const toggleSound = () => {
    const next = triPeaksAudio.toggleMute();
    setIsMuted(next);
  };

  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 420 / rect.width;
    const scaleY = 540 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // 1. Check Stock Deck Click (x: 50 to 110, y: 380 to 470)
    if (clickX >= 50 && clickX <= 110 && clickY >= 380 && clickY <= 470) {
      handleDraw();
      return;
    }

    // 2. Check Wildcard Click (x: 300 to 360, y: 380 to 470)
    if (clickX >= 300 && clickX <= 360 && clickY >= 380 && clickY <= 470) {
      if (stateRef.current.wildcardsLeft > 0) {
        setIsWildcardMode((prev) => !prev);
        triPeaksAudio.playWildcard();
      }
      return;
    }

    // 3. Check Tableau Cards (sorted bottom-row first to handle overlapping correctly)
    const reversedTableau = [...stateRef.current.tableau].reverse();
    for (const card of reversedTableau) {
      if (card.isCleared || !card.isFaceUp) continue;

      const cardW = 44;
      const cardH = 64;
      if (
        clickX >= card.x &&
        clickX <= card.x + cardW &&
        clickY >= card.y &&
        clickY <= card.y + cardH
      ) {
        handleCardClick(card.id);
        return;
      }
    }
  };

  // Main 60 FPS Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let hudCounter = 0;

    const renderCard = (
      ctx: CanvasRenderingContext2D,
      card: TriPeaksCard,
      highlight: boolean = false
    ) => {
      const w = 44;
      const h = 64;

      ctx.save();
      ctx.translate(card.x, card.y);

      // Card Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.beginPath();
      ctx.roundRect(2, 3, w, h, 6);
      ctx.fill();

      if (!card.isFaceUp) {
        // Face Down Card Back (Rustic Wood Plaid)
        const backGrad = ctx.createLinearGradient(0, 0, w, h);
        backGrad.addColorStop(0, '#78350f');
        backGrad.addColorStop(0.5, '#92400e');
        backGrad.addColorStop(1, '#b45309');
        ctx.fillStyle = backGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 6);
        ctx.fill();

        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // Inner ornament
        ctx.strokeStyle = 'rgba(254, 240, 138, 0.5)';
        ctx.setLineDash([2, 2]);
        ctx.strokeRect(4, 4, w - 8, h - 8);
        ctx.setLineDash([]);

        ctx.fillStyle = '#fde047';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🌾', w / 2, h / 2);
      } else {
        // Face Up Card (Ivory Parchment)
        const faceGrad = ctx.createLinearGradient(0, 0, w, h);
        faceGrad.addColorStop(0, '#ffffff');
        faceGrad.addColorStop(0.6, '#fefce8');
        faceGrad.addColorStop(1, '#fef08a');
        ctx.fillStyle = faceGrad;
        ctx.beginPath();
        ctx.roundRect(0, 0, w, h, 6);
        ctx.fill();

        // Highlight ring if playable match
        if (highlight) {
          ctx.strokeStyle = '#22c55e';
          ctx.lineWidth = 2.5;
        } else {
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.2;
        }
        ctx.stroke();

        // Rank & Suit Label
        const isRed = card.suit === 'apple' || card.suit === 'wheat';
        ctx.fillStyle = isRed ? '#dc2626' : '#15803d';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(getRankLabel(card.rank), 5, 4);

        // Small Suit icon top left
        ctx.font = '9px sans-serif';
        ctx.fillText(getSuitSymbol(card.suit), 5, 17);

        // Center Mascot Avatar on Court Cards
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (card.rank === 1) {
          ctx.font = '18px sans-serif';
          ctx.fillText('🐕', w / 2, h / 2 + 4);
        } else if (card.rank === 11) {
          ctx.font = '17px sans-serif';
          ctx.fillText('🐶', w / 2, h / 2 + 4);
        } else if (card.rank === 12) {
          ctx.font = '17px sans-serif';
          ctx.fillText('🐱', w / 2, h / 2 + 4);
        } else if (card.rank === 13) {
          ctx.font = '18px sans-serif';
          ctx.fillText('🐮', w / 2, h / 2 + 4);
        } else {
          ctx.font = '16px sans-serif';
          ctx.fillText(getSuitSymbol(card.suit), w / 2, h / 2 + 4);
        }
      }

      ctx.restore();
    };

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }

      // Update High Score
      if (stateRef.current.score > highScore) {
        setHighScore(stateRef.current.score);
        try {
          localStorage.setItem('pawcade_tripeaks_hi', stateRef.current.score.toString());
        } catch {}
      }

      // Update HUD at ~15 FPS
      hudCounter++;
      if (hudCounter % 4 === 0) {
        setHudState({
          score: stateRef.current.score,
          streak: stateRef.current.streak,
          stage: stateRef.current.currentStageIndex + 1,
          stockCount: stateRef.current.stockDeck.length,
          wildcards: stateRef.current.wildcardsLeft,
          canUndo: stateRef.current.canUndo,
          isWildcardActive: isWildcardMode,
          status: stateRef.current.status,
        });
      }

      // 1. Clear & Background
      ctx.clearRect(0, 0, 420, 540);

      // Deep Farm Pasture Felt Gradient
      const feltGrad = ctx.createLinearGradient(0, 0, 0, 540);
      feltGrad.addColorStop(0, '#064e3b');
      feltGrad.addColorStop(0.6, '#065f46');
      feltGrad.addColorStop(1, '#022c22');
      ctx.fillStyle = feltGrad;
      ctx.fillRect(0, 0, 420, 540);

      // Rustic Wood Border Trim
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 6;
      ctx.strokeRect(3, 3, 414, 534);

      // Meadow Texture Line
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1.5;
      for (let y = 40; y < 500; y += 30) {
        ctx.beginPath();
        ctx.moveTo(10, y);
        ctx.lineTo(410, y);
        ctx.stroke();
      }

      // 2. Render Tableau Cards (from top row down so bottom row renders on top)
      const waste = stateRef.current.wasteCard;
      stateRef.current.tableau.forEach((card) => {
        if (card.isCleared) return;
        const isPlayable = card.isFaceUp && (isWildcardMode || canClearCard(card, waste));
        renderCard(ctx, card, isPlayable);
      });

      // 3. Render Bottom Play Area
      // A. Stock Deck
      const stock = stateRef.current.stockDeck;
      if (stock.length > 0) {
        const dummyStockCard: TriPeaksCard = {
          id: 'stock',
          suit: 'clover',
          rank: 1,
          isFaceUp: false,
          isCleared: false,
          row: 0,
          col: 0,
          x: 60,
          y: 390,
          blockedBy: [],
        };
        renderCard(ctx, dummyStockCard);

        // Stock count badge
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(60 + 22, 390 + 32, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(stock.length.toString(), 60 + 22, 390 + 32);

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('DRAW', 60 + 22, 390 + 74);
      } else {
        // Empty stock placeholder
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.strokeRect(60, 390, 44, 64);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('EMPTY', 60 + 22, 390 + 36);
      }

      // B. Waste Card (Active Current Match)
      if (waste) {
        const wasteToRender = { ...waste, x: 188, y: 390 };
        renderCard(ctx, wasteToRender, true);

        // Active Waste glow indicator
        ctx.fillStyle = '#facc15';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('ACTIVE', 188 + 22, 390 + 74);
      }

      // C. Wildcard Clover Slot
      const wildX = 316;
      const wildY = 390;
      ctx.fillStyle = isWildcardMode ? '#15803d' : '#1e293b';
      ctx.beginPath();
      ctx.roundRect(wildX, wildY, 44, 64, 6);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = isWildcardMode ? '#facc15' : '#64748b';
      ctx.stroke();

      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🍀', wildX + 22, wildY + 28);

      ctx.fillStyle = isWildcardMode ? '#fef08a' : '#cbd5e1';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`WILD (${stateRef.current.wildcardsLeft})`, wildX + 22, wildY + 52);

      // Streak Banner across middle
      if (stateRef.current.streak > 1) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(140, 330, 140, 26, 13);
        ctx.fill();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`🔥 STREAK x${stateRef.current.streak}`, 210, 343);
      }

      // 4. Render Particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 80 * dt;
        p.alpha -= 1.8 * dt;

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 5. Render Toasts
      for (let i = toastsRef.current.length - 1; i >= 0; i--) {
        const toast = toastsRef.current[i];
        toast.y -= 35 * dt;
        toast.alpha -= 1.4 * dt;

        if (toast.alpha <= 0) {
          toastsRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, toast.alpha);
        ctx.fillStyle = toast.color;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 4;
        ctx.fillText(toast.text, toast.x, toast.y);
        ctx.restore();
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [highScore, isWildcardMode]);

  return (
    <div className="relative w-full max-w-[440px] mx-auto select-none font-sans text-white touch-none">
      {/* Top Single-Screen HUD */}
      <div className="flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-t-xl px-3 py-2 shadow-lg backdrop-blur-md">
        {/* Stage & Streak */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">Peak</span>
            <span className="text-base font-extrabold text-white leading-tight">
              #{hudState.stage}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Streak</span>
            <span className="text-base font-extrabold text-emerald-300 leading-tight">
              x{hudState.streak}
            </span>
          </div>
        </div>

        {/* Score & Best */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score</span>
            <span className="text-base font-black text-amber-400 leading-tight">{hudState.score}</span>
          </div>
          <div className="flex flex-col text-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Best</span>
            <span className="text-base font-black text-amber-300 leading-tight">{highScore}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={!hudState.canUndo}
            className={`w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg border flex items-center justify-center text-sm transition-transform touch-manipulation ${
              hudState.canUndo
                ? 'bg-slate-800 border-slate-700 active:scale-95 text-slate-200'
                : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
            }`}
            aria-label="Undo Move"
          >
            ↩️
          </button>
          <button
            onClick={toggleSound}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm active:scale-95 transition-transform touch-manipulation"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
          <button
            onClick={handleRestart}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-sm active:scale-95 transition-transform text-slate-300 hover:text-white touch-manipulation"
            aria-label="Restart Stage"
          >
            🔄
          </button>
        </div>
      </div>

      {/* Interactive 60 FPS Canvas Board */}
      <div className="relative w-full aspect-[420/540] bg-slate-950 border-x border-slate-800 overflow-hidden shadow-2xl">
        <canvas
          ref={canvasRef}
          width={420}
          height={540}
          onPointerDown={handleCanvasPointerDown}
          className="w-full h-full cursor-pointer block touch-none"
        />
      </div>

      {/* Bottom Large Tap & Booster Bar */}
      <div className="p-2 bg-slate-950 rounded-b-xl border-x border-b border-amber-500/30 flex items-center gap-2">
        <button
          onClick={handleDraw}
          disabled={hudState.stockCount <= 0}
          className={`flex-1 py-3 px-3 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 min-h-[48px] touch-manipulation transition-all ${
            hudState.stockCount > 0
              ? 'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white shadow-md shadow-emerald-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <span>🌾</span>
          <span>DRAW CARD ({hudState.stockCount})</span>
        </button>

        <button
          onClick={() => {
            if (hudState.wildcards > 0) {
              setIsWildcardMode((prev) => !prev);
              triPeaksAudio.playWildcard();
            }
          }}
          disabled={hudState.wildcards <= 0}
          className={`py-3 px-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1 min-h-[48px] touch-manipulation transition-all ${
            hudState.wildcards > 0
              ? isWildcardMode
                ? 'bg-amber-400 text-slate-950 ring-2 ring-white animate-pulse'
                : 'bg-slate-800 border border-amber-400/50 text-amber-300 active:scale-95'
              : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed opacity-60'
          }`}
        >
          <span>🍀</span>
          <span>WILD ({hudState.wildcards})</span>
        </button>
      </div>

      {/* Stage Victory Modal */}
      {hudState.status === 'stage_clear' && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <span className="text-4xl mb-2 block">🌾🏆</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Peak Cleared!</h2>
            <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">
              Splendid harvest! You conquered Peak #{hudState.stage} with a streak of x{hudState.streak}. Ready for the next mountain of cards?
            </p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-5 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Total Harvest Score</div>
              <div className="text-2xl font-black text-amber-400">{hudState.score}</div>
            </div>

            <button
              onClick={handleNextStage}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation"
            >
              <span>➡️</span>
              <span>PLAY NEXT PEAK</span>
            </button>
          </div>
        </div>
      )}

      {/* Game Over / Out of Moves Modal */}
      {hudState.status === 'game_over' && (
        <div className="absolute inset-0 z-30 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border-2 border-amber-500/60 rounded-2xl p-6 text-center shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <span className="text-4xl mb-2 block">🌾🍂</span>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Out of Moves!</h2>
            <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed">
              Your draw pile ran dry and no matching cards remain. Retry this peak with fresh luck and build longer streaks!
            </p>

            <div className="bg-slate-800/80 rounded-xl p-3 mb-5 border border-slate-700/60">
              <div className="text-[11px] text-slate-400 uppercase font-semibold">Final Score</div>
              <div className="text-2xl font-black text-amber-400">{hudState.score}</div>
            </div>

            <button
              onClick={handleRestart}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 min-h-[48px] touch-manipulation"
            >
              <span>🔄</span>
              <span>RETRY PEAK</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FarmTriPeaksSolitaireContainer;

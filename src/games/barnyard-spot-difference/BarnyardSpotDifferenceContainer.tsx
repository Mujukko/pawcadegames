import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  advanceLevel,
  clickDifference,
  createInitialState,
  restartLevel,
  updateGame,
  useHint,
} from './logic/engine';
import { SpotGameState } from './logic/types';
import { sound } from './systems/sound';

const BOARD_WIDTH = 640;
const BOARD_HEIGHT = 480;

interface ClickFeedback {
  id: number;
  type: 'hit' | 'miss';
  x: number;
  y: number;
  alpha: number;
}

export const BarnyardSpotDifferenceContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<SpotGameState>(() => createInitialState(1));
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const stateRef = useRef<SpotGameState>(gameState);
  stateRef.current = gameState;

  const feedbacksRef = useRef<ClickFeedback[]>([]);
  const nextFeedbackId = useRef(1);

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleUseHint = useCallback(() => {
    setGameState((prev) => useHint(prev));
  }, []);

  // Handle pointer down on either left or right image
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = BOARD_WIDTH / rect.width;
    const scaleY = BOARD_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Side-by-side picture dimensions
    const imgY = 55;
    const imgH = 370;
    const imgW = 295;

    let normX = -1;
    let normY = -1;

    // Check if clicked Left Image [20 to 315]
    if (clickX >= 20 && clickX <= 20 + imgW && clickY >= imgY && clickY <= imgY + imgH) {
      normX = (clickX - 20) / imgW;
      normY = (clickY - imgY) / imgH;
    }
    // Check if clicked Right Image [325 to 620]
    else if (clickX >= 325 && clickX <= 325 + imgW && clickY >= imgY && clickY <= imgY + imgH) {
      normX = (clickX - 325) / imgW;
      normY = (clickY - imgY) / imgH;
    }

    if (normX >= 0 && normY >= 0) {
      const prevFoundCount = stateRef.current.foundIds.length;
      const nextState = clickDifference(stateRef.current, normX, normY);

      if (nextState.foundIds.length > prevFoundCount) {
        // Successful hit
        feedbacksRef.current.push({
          id: nextFeedbackId.current++,
          type: 'hit',
          x: clickX,
          y: clickY,
          alpha: 1,
        });
      } else if (nextState.lives < stateRef.current.lives) {
        // Miss
        feedbacksRef.current.push({
          id: nextFeedbackId.current++,
          type: 'miss',
          x: clickX,
          y: clickY,
          alpha: 1,
        });
      }

      setGameState(nextState);
    }
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const currentState = stateRef.current;
      const nextState = updateGame(currentState, dt);

      // Trigger Web Audio
      if (nextState.events.length > 0) {
        for (const ev of nextState.events) {
          if (ev.type === 'found') {
            sound.playFound();
          } else if (ev.type === 'miss') {
            sound.playMiss();
          } else if (ev.type === 'hint_used') {
            sound.playHint();
          } else if (ev.type === 'round_clear') {
            sound.playRoundClear();
          } else if (ev.type === 'victory') {
            sound.playVictory();
          } else if (ev.type === 'game_over') {
            sound.playGameOver();
          }
        }
      }

      // Update feedback animations
      feedbacksRef.current = feedbacksRef.current
        .map((f) => ({ ...f, alpha: f.alpha - dt * 2.0 }))
        .filter((f) => f.alpha > 0);

      setGameState(nextState);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, nextState, feedbacksRef.current);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Main Canvas Scene Drawing
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    state: SpotGameState,
    feedbacks: ClickFeedback[]
  ) => {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 1. Rich Wooden Desk Backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
    bgGrad.addColorStop(0, '#1E293B');
    bgGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Picture frame dimensions
    const imgY = 55;
    const imgH = 370;
    const imgW = 295;

    // 2. Draw Left Picture (Original)
    ctx.save();
    ctx.beginPath();
    ctx.rect(20, imgY, imgW, imgH);
    ctx.clip();
    drawVectorScene(ctx, 20, imgY, imgW, imgH, state.level, false);
    ctx.restore();

    // Frame border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(20, imgY, imgW, imgH);

    // Left Title Badge
    ctx.fillStyle = '#D97706';
    ctx.fillRect(20, imgY - 18, 90, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ORIGINAL', 65, imgY - 5);

    // 3. Draw Right Picture (Altered with 5 Differences)
    ctx.save();
    ctx.beginPath();
    ctx.rect(325, imgY, imgW, imgH);
    ctx.clip();
    drawVectorScene(ctx, 325, imgY, imgW, imgH, state.level, true);
    ctx.restore();

    // Frame border
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 3;
    ctx.strokeRect(325, imgY, imgW, imgH);

    // Right Title Badge
    ctx.fillStyle = '#D97706';
    ctx.fillRect(325, imgY - 18, 90, 18);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SPOT 5 HERE', 370, imgY - 5);

    // 4. Draw Gold Rings over all Spotted Differences on BOTH pictures
    for (const diffId of state.foundIds) {
      const diff = state.scene.differences.find((d) => d.id === diffId);
      if (!diff) continue;

      const lx = 20 + diff.x * imgW;
      const ly = imgY + diff.y * imgH;
      const rx = 325 + diff.x * imgW;
      const ry = imgY + diff.y * imgH;
      const r = diff.radius * imgW;

      [
        { x: lx, y: ly },
        { x: rx, y: ry },
      ].forEach((pos) => {
        ctx.strokeStyle = '#F59E0B';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#FEF08A';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('⭐', pos.x + r * 0.7, pos.y - r * 0.7);
      });
    }

    // 5. Draw Active Hint Magnifying Halo if active
    if (state.activeHintId) {
      const hintDiff = state.scene.differences.find((d) => d.id === state.activeHintId);
      if (hintDiff) {
        const pulse = 1 + Math.sin(performance.now() * 0.008) * 0.15;
        const hx = 325 + hintDiff.x * imgW;
        const hy = imgY + hintDiff.y * imgH;
        const hr = hintDiff.radius * imgW * 1.3 * pulse;

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.arc(hx, hy, hr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#38BDF8';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText('🔍', hx, hy - hr - 5);
      }
    }

    // 6. Draw Click Feedbacks
    for (const fb of feedbacks) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, fb.alpha);
      if (fb.type === 'hit') {
        ctx.fillStyle = '#10B981';
        ctx.font = 'bold 22px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✨ PERFECT! ✨', fb.x, fb.y - 15);
      } else {
        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('❌', fb.x, fb.y);
      }
      ctx.restore();
    }
  };

  // Helper: Draw High-Fidelity Procedural Vector Scenes
  const drawVectorScene = (
    ctx: CanvasRenderingContext2D,
    bx: number,
    by: number,
    bw: number,
    bh: number,
    level: number,
    isAltered: boolean
  ) => {
    ctx.save();
    ctx.translate(bx, by);

    if (level === 1) {
      // Scene 1: Sunny Barnyard Morning
      // Sky
      const sky = ctx.createLinearGradient(0, 0, 0, bh * 0.55);
      sky.addColorStop(0, '#38BDF8');
      sky.addColorStop(1, '#BAE6FD');
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, bw, bh * 0.55);

      // Diff 2: Sun vs Cloud (x: 0.82, y: 0.18)
      if (isAltered) {
        // Altered: Fluffy Cloud
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bw * 0.82 - 12, bh * 0.18, 14, 0, Math.PI * 2);
        ctx.arc(bw * 0.82, bh * 0.18 - 4, 18, 0, Math.PI * 2);
        ctx.arc(bw * 0.82 + 12, bh * 0.18, 14, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Original: Golden Sun
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(bw * 0.82, bh * 0.18, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FEF08A';
        ctx.beginPath();
        ctx.arc(bw * 0.82, bh * 0.18, 14, 0, Math.PI * 2);
        ctx.fill();
      }

      // Rolling Green Pasture Hills
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(bw * 0.25, bh * 0.8, bw * 0.5, Math.PI, 0);
      ctx.arc(bw * 0.75, bh * 0.85, bw * 0.6, Math.PI, 0);
      ctx.fill();

      ctx.fillStyle = '#22C55E';
      ctx.fillRect(0, bh * 0.52, bw, bh * 0.48);

      // Red Barn (Center)
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(bw * 0.36, bh * 0.24, bw * 0.28, bh * 0.28);
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.moveTo(bw * 0.34, bh * 0.24);
      ctx.lineTo(bw * 0.50, bh * 0.12);
      ctx.lineTo(bw * 0.66, bh * 0.24);
      ctx.closePath();
      ctx.fill();

      // Diff 1: Weather Vane (x: 0.50, y: 0.16)
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(bw * 0.50, bh * 0.12);
      ctx.lineTo(bw * 0.50, bh * 0.08);
      ctx.stroke();
      ctx.fillStyle = isAltered ? '#EF4444' : '#F59E0B'; // Red arrow vs Golden Rooster
      ctx.beginPath();
      ctx.arc(bw * 0.50, bh * 0.07, 4, 0, Math.PI * 2);
      ctx.fill();

      // Daisy the Cow (Left Foreground)
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(bw * 0.28, bh * 0.64, 28, 20, 0, 0, Math.PI * 2);
      ctx.fill();
      // Black spots
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(bw * 0.24, bh * 0.60, 9, 0, Math.PI * 2);
      ctx.arc(bw * 0.32, bh * 0.66, 7, 0, Math.PI * 2);
      ctx.fill();
      // Cow head
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(bw * 0.20, bh * 0.58, 12, 0, Math.PI * 2);
      ctx.fill();
      // Diff 3: Bell on Cow Collar (x: 0.28, y: 0.62)
      if (!isAltered) {
        ctx.fillStyle = '#F59E0B'; // Bell on original
        ctx.beginPath();
        ctx.arc(bw * 0.26, bh * 0.64, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Green Tractor (Right)
      ctx.fillStyle = '#16A34A';
      ctx.fillRect(bw * 0.56, bh * 0.68, 48, 24);
      ctx.fillStyle = '#1E293B';
      ctx.beginPath();
      ctx.arc(bw * 0.64, bh * 0.80, 14, 0, Math.PI * 2); // Big back wheel
      ctx.arc(bw * 0.76, bh * 0.82, 9, 0, Math.PI * 2); // Front wheel
      ctx.fill();

      // Diff 5: Tractor Wheel Hubcap (x: 0.64, y: 0.78)
      ctx.fillStyle = isAltered ? '#3B82F6' : '#EF4444'; // Blue vs Red hubcap
      ctx.beginPath();
      ctx.arc(bw * 0.64, bh * 0.80, 6, 0, Math.PI * 2);
      ctx.fill();

      // Diff 4: Sunflower Garden (x: 0.88, y: 0.72)
      ctx.fillStyle = isAltered ? '#A855F7' : '#F59E0B'; // Purple vs Yellow sunflower
      ctx.beginPath();
      ctx.arc(bw * 0.88, bh * 0.72, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.arc(bw * 0.88, bh * 0.72, 4, 0, Math.PI * 2);
      ctx.fill();
    } else if (level === 2) {
      // Scene 2: Apple Orchard Harvest
      ctx.fillStyle = '#7DD3FC';
      ctx.fillRect(0, 0, bw, bh * 0.5);
      ctx.fillStyle = '#4ADE80';
      ctx.fillRect(0, bh * 0.5, bw, bh * 0.5);

      // Big Apple Tree Left
      ctx.fillStyle = '#78350F';
      ctx.fillRect(bw * 0.18, bh * 0.35, 20, bh * 0.4);
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(bw * 0.22, bh * 0.28, 48, 0, Math.PI * 2);
      ctx.fill();

      // Apples in Left Tree
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(bw * 0.16, bh * 0.24, 6, 0, Math.PI * 2);
      ctx.arc(bw * 0.28, bh * 0.30, 6, 0, Math.PI * 2);
      ctx.fill();

      // Diff 2: Golden Apple in Tree (x: 0.22, y: 0.25)
      ctx.fillStyle = isAltered ? '#F59E0B' : '#DC2626'; // Gold vs Red apple
      ctx.beginPath();
      ctx.arc(bw * 0.22, bh * 0.25, 7, 0, Math.PI * 2);
      ctx.fill();

      // Scarecrow Center
      ctx.fillStyle = '#78350F';
      ctx.fillRect(bw * 0.47, bh * 0.32, 6, bh * 0.35); // pole
      ctx.fillRect(bw * 0.38, bh * 0.38, 55, 6); // arms
      ctx.fillStyle = '#FDE047'; // Straw head
      ctx.beginPath();
      ctx.arc(bw * 0.50, bh * 0.32, 12, 0, Math.PI * 2);
      ctx.fill();

      // Diff 1: Scarecrow Hat Ribbon (x: 0.48, y: 0.32)
      ctx.fillStyle = '#B45309';
      ctx.fillRect(bw * 0.42, bh * 0.24, 20, 6);
      ctx.fillStyle = isAltered ? '#3B82F6' : '#EF4444'; // Blue vs Red ribbon
      ctx.fillRect(bw * 0.44, bh * 0.22, 16, 3);

      // Right Tree with Barn Kitten
      ctx.fillStyle = '#78350F';
      ctx.fillRect(bw * 0.74, bh * 0.4, 22, bh * 0.35);
      ctx.fillStyle = '#166534';
      ctx.beginPath();
      ctx.arc(bw * 0.78, bh * 0.32, 45, 0, Math.PI * 2);
      ctx.fill();

      // Diff 3: Barn Kitten in Branch (x: 0.78, y: 0.36)
      if (isAltered) {
        ctx.fillStyle = '#F97316'; // Orange kitten
        ctx.beginPath();
        ctx.arc(bw * 0.78, bh * 0.36, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(bw * 0.78, bh * 0.37, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diff 4: Apple Basket (x: 0.35, y: 0.78)
      ctx.fillStyle = '#A16207';
      ctx.beginPath();
      ctx.ellipse(bw * 0.35, bh * 0.80, 24, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#EF4444';
      ctx.beginPath();
      ctx.arc(bw * 0.32, bh * 0.77, 6, 0, Math.PI * 2);
      ctx.arc(bw * 0.38, bh * 0.77, 6, 0, Math.PI * 2);
      if (isAltered) {
        ctx.arc(bw * 0.35, bh * 0.73, 6, 0, Math.PI * 2); // Extra apple
      }
      ctx.fill();

      // Diff 5: Butterfly (x: 0.68, y: 0.65)
      if (!isAltered) {
        ctx.fillStyle = '#EC4899';
        ctx.beginPath();
        ctx.ellipse(bw * 0.68 - 4, bh * 0.65, 5, 8, Math.PI / 6, 0, Math.PI * 2);
        ctx.ellipse(bw * 0.68 + 4, bh * 0.65, 5, 8, -Math.PI / 6, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      // Scene 3: Duck Pond Picnic
      ctx.fillStyle = '#BAE6FD';
      ctx.fillRect(0, 0, bw, bh * 0.45);
      ctx.fillStyle = '#86EFAC';
      ctx.fillRect(0, bh * 0.45, bw, bh * 0.55);

      // Water Pond
      ctx.fillStyle = '#0284C7';
      ctx.beginPath();
      ctx.ellipse(bw * 0.45, bh * 0.68, bw * 0.42, bh * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();

      // Diff 1: Frog on Lily Pad (x: 0.30, y: 0.70)
      ctx.fillStyle = '#15803D';
      ctx.beginPath();
      ctx.arc(bw * 0.30, bh * 0.70, 14, 0, Math.PI * 2);
      ctx.fill();
      if (isAltered) {
        // Frog sitting on it
        ctx.fillStyle = '#22C55E';
        ctx.beginPath();
        ctx.arc(bw * 0.30, bh * 0.68, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(bw * 0.28, bh * 0.66, 1.5, 0, Math.PI * 2);
        ctx.arc(bw * 0.32, bh * 0.66, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diff 2: Mama Duck Hat (x: 0.55, y: 0.58)
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.ellipse(bw * 0.55, bh * 0.60, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(bw * 0.58, bh * 0.54, 9, 0, Math.PI * 2);
      ctx.fill();
      if (isAltered) {
        // Pink flower hat
        ctx.fillStyle = '#F43F5E';
        ctx.beginPath();
        ctx.arc(bw * 0.58, bh * 0.48, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diff 3: Cherry Pie on Blanket (x: 0.76, y: 0.82)
      ctx.fillStyle = '#EF4444'; // Red-checkered blanket
      ctx.fillRect(bw * 0.70, bh * 0.76, 50, 35);
      if (isAltered) {
        // Golden Pie
        ctx.fillStyle = '#F59E0B';
        ctx.beginPath();
        ctx.arc(bw * 0.76, bh * 0.82, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diff 4: Wooden Bridge Lantern (x: 0.15, y: 0.42)
      ctx.fillStyle = '#78350F';
      ctx.fillRect(bw * 0.08, bh * 0.42, 45, 12);
      if (isAltered) {
        // Glowing lantern hanging
        ctx.fillStyle = '#FBBF24';
        ctx.beginPath();
        ctx.arc(bw * 0.15, bh * 0.42, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Diff 5: Flying Dragonfly (x: 0.40, y: 0.20)
      if (!isAltered) {
        ctx.fillStyle = '#06B6D4';
        ctx.beginPath();
        ctx.ellipse(bw * 0.40, bh * 0.20, 3, 10, Math.PI / 4, 0, Math.PI * 2);
        ctx.ellipse(bw * 0.40, bh * 0.20, 3, 10, -Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  };

  const handleNextLevel = () => {
    setGameState((prev) => advanceLevel(prev));
  };

  const handleRestart = () => {
    setGameState((prev) => restartLevel(prev));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] max-h-[85vh] bg-[#0A0F1D] text-white select-none touch-none overflow-hidden rounded-2xl shadow-2xl p-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top Header HUD */}
      <div className="w-full max-w-[640px] flex items-center justify-between px-3 py-1.5 bg-[#1E293B]/90 border border-amber-500/30 rounded-xl mb-1.5 text-xs backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <span className="font-extrabold text-amber-400">Level {gameState.level} / 3</span>
          <span className="text-slate-300 font-medium">{gameState.scene.name}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Spotted Progress */}
          <div className="flex items-center gap-1 font-bold text-amber-300">
            <span>🔍</span>
            <span>{gameState.foundIds.length} / 5 Found</span>
          </div>

          {/* Lives Counter */}
          <div className="flex items-center gap-0.5" title="Lives Remaining">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={`text-xs ${i < gameState.lives ? 'text-rose-500' : 'text-slate-600'}`}>
                ❤️
              </span>
            ))}
          </div>

          {/* Timer Clock */}
          <span className={`font-mono text-xs font-bold ${gameState.timeRemaining < 20 ? 'text-rose-400 animate-pulse' : 'text-cyan-300'}`}>
            ⏱️ {Math.ceil(gameState.timeRemaining)}s
          </span>

          {/* Hint Button */}
          <button
            onClick={handleUseHint}
            disabled={gameState.hints <= 0}
            className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-extrabold text-[11px] rounded flex items-center gap-1"
          >
            <span>💡</span>
            <span>Hint ({gameState.hints})</span>
          </button>

          {/* Mute Button */}
          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full max-w-[640px] aspect-[640/480] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          onPointerDown={handlePointerDown}
          className="w-full h-full rounded-xl border border-amber-500/40 shadow-inner cursor-crosshair"
        />

        {/* Round Clear Modal */}
        {gameState.status === 'round_clear' && (
          <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-amber-400 mb-1">ALL 5 DIFFERENCES SPOTTED! 🔍✨</h2>
            <p className="text-slate-200 text-xs mb-3">
              Superb detective work! Round Score: <strong className="text-amber-300">{gameState.score}</strong>
            </p>
            <button
              onClick={handleNextLevel}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Next Scene 🚜
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-3xl font-black text-amber-400 mb-1">MASTER FARM DETECTIVE! 🏆</h2>
            <p className="text-slate-200 text-xs mb-3">
              You uncovered all differences across all pastoral farm scenes!
            </p>
            <div className="text-xl font-bold text-white mb-4">
              Final Score: <span className="text-amber-300">{gameState.score}</span>
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Play Again 🔍
            </button>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-rose-400 mb-1">
              {gameState.lives <= 0 ? 'OUT OF LIVES! ❌' : 'TIME RAN OUT! ⏱️'}
            </h2>
            <p className="text-slate-300 text-xs mb-3">
              You spotted {gameState.foundIds.length} of 5 differences.
            </p>
            <button
              onClick={handleRestart}
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Try Again 🔄
            </button>
          </div>
        )}
      </div>

      {/* Helpful Hint Footer */}
      <div className="text-[11px] text-slate-400 text-center mt-1">
        Tap on either image where you spot a difference! Misclicks cost 1 heart. Tap 💡 Hint if stuck!
      </div>
    </div>
  );
};
export default BarnyardSpotDifferenceContainer;

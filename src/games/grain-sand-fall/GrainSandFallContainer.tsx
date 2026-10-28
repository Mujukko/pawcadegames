import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SandSimulationState,
  initializeSandGame,
  stepSandPhysics,
  checkAndClearConnectedLines,
  doesShapeCollide,
  solidifyShapeToGrid,
  spawnRandomShape,
  rotateMatrix,
  getWallContacts,
  GRAIN_COLORS,
  DEFAULT_COLS,
  DEFAULT_ROWS,
  GrainColor,
  FallingShape,
} from './logic/engine';
import { sound } from './systems/sound';
import { analytics } from '../../lib/analytics';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ArrowDown,
  Sparkles,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DissolveParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glow: string;
  alpha: number;
  size: number;
  life: number;
  maxLife: number;
}

export const GrainSandFallContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<SandSimulationState>(() => initializeSandGame());
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('pawcade_sand_highscore') || '0', 10);
    } catch {
      return 0;
    }
  });

  const stateRef = useRef<SandSimulationState>(gameState);
  stateRef.current = gameState;

  // Real-time animation & physics refs
  const shakeRef = useRef<number>(0);
  const particlesRef = useRef<DissolveParticle[]>([]);
  const isSoftDroppingRef = useRef<boolean>(false);
  const touchStartRef = useRef<{ x: number; y: number; shapeX: number } | null>(null);

  // Hold-to-repeat (DAS) for mobile buttons
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const holdIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startHoldAction = useCallback((action: () => void, initialDelay = 150, repeatInterval = 60) => {
    action();
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(action, repeatInterval);
    }, initialDelay);
  }, []);

  const stopHoldAction = useCallback(() => {
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
    holdTimerRef.current = null;
    holdIntervalRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      stopHoldAction();
    };
  }, [stopHoldAction]);

  // Sound toggle
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Restart game
  const handleRestart = () => {
    analytics.gameRestarted('grain-sand-fall', { finalScore: stateRef.current.score });
    particlesRef.current = [];
    shakeRef.current = 0;
    const next = initializeSandGame();
    setGameState(next);
  };

  // Move active shape horizontally with sound
  const moveHorizontal = useCallback((dir: -1 | 1) => {
    const s = stateRef.current;
    if (s.isGameOver || !s.activeShape) return;

    const nextShape = { ...s.activeShape, x: s.activeShape.x + dir };
    if (!doesShapeCollide(nextShape, s.grid, s.cols, s.rows)) {
      sound.playShift();
      setGameState({ ...s, activeShape: nextShape });
    }
  }, []);

  // Rotate active shape with wall kicks
  const rotateShape = useCallback(() => {
    const s = stateRef.current;
    if (s.isGameOver || !s.activeShape) return;

    const rotatedMat = rotateMatrix(s.activeShape.matrix);
    const nextShape: FallingShape = {
      ...s.activeShape,
      matrix: rotatedMat,
      width: rotatedMat[0].length,
      height: rotatedMat.length,
    };

    // Try direct rotation, then wall kicks left, right, up
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      const kicked = { ...nextShape, x: nextShape.x + kick };
      if (!doesShapeCollide(kicked, s.grid, s.cols, s.rows)) {
        sound.playRotate();
        setGameState({ ...s, activeShape: kicked });
        return;
      }
    }
  }, []);

  // Drop active shape immediately to floor with screen shake
  const hardDrop = useCallback(() => {
    const s = stateRef.current;
    if (s.isGameOver || !s.activeShape) return;

    let testY = s.activeShape.y;
    while (!doesShapeCollide({ ...s.activeShape, y: testY + 1 }, s.grid, s.cols, s.rows)) {
      testY++;
    }

    const settledShape = { ...s.activeShape, y: testY };
    const solidifiedGrid = solidifyShapeToGrid(settledShape, s.grid);
    sound.playSandImpact();
    shakeRef.current = 8; // Snappy screen shake

    // Check if new shape can spawn at top
    const nextShape = spawnRandomShape(s.cols, s.nextColor);
    const nextCol = (Math.floor(Math.random() * 4) + 1) as GrainColor;
    const isOver = doesShapeCollide(nextShape, solidifiedGrid, s.cols, s.rows);

    setGameState({
      ...s,
      grid: solidifiedGrid,
      activeShape: isOver ? null : nextShape,
      nextColor: nextCol,
      isGameOver: isOver,
      score: s.score + 25,
    });
  }, []);

  // Soft drop step (down 1 cell)
  const dropStep = useCallback(() => {
    const s = stateRef.current;
    if (s.isGameOver || !s.activeShape) return;

    const nextY = s.activeShape.y + 1;
    if (!doesShapeCollide({ ...s.activeShape, y: nextY }, s.grid, s.cols, s.rows)) {
      setGameState({
        ...s,
        activeShape: { ...s.activeShape, y: nextY },
      });
    } else {
      // Impact and solidify into individual sand grains
      const solidifiedGrid = solidifyShapeToGrid(s.activeShape, s.grid);
      sound.playSandImpact();
      shakeRef.current = 4;

      const nextShape = spawnRandomShape(s.cols, s.nextColor);
      const nextCol = (Math.floor(Math.random() * 4) + 1) as GrainColor;
      const isOver = doesShapeCollide(nextShape, solidifiedGrid, s.cols, s.rows);
      if (isOver) {
        analytics.levelCompleted('grain-sand-fall', { score: s.score + 10 });
      }

      setGameState({
        ...s,
        grid: solidifiedGrid,
        activeShape: isOver ? null : nextShape,
        nextColor: nextCol,
        isGameOver: isOver,
        score: s.score + 10,
      });
    }
  }, []);

  // Keyboard navigation with auto-repeat (DAS)
  useEffect(() => {
    const keysDown = new Set<string>();
    let dasTimer: any = null;
    let dasInterval: any = null;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }

      if (e.repeat) return;
      keysDown.add(e.key);

      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveHorizontal(-1);
        clearTimeout(dasTimer);
        clearInterval(dasInterval);
        dasTimer = setTimeout(() => {
          dasInterval = setInterval(() => moveHorizontal(-1), 45);
        }, 130);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveHorizontal(1);
        clearTimeout(dasTimer);
        clearInterval(dasInterval);
        dasTimer = setTimeout(() => {
          dasInterval = setInterval(() => moveHorizontal(1), 45);
        }, 130);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        rotateShape();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        isSoftDroppingRef.current = true;
        dropStep();
      } else if (e.key === ' ') {
        hardDrop();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysDown.delete(e.key);
      if (['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D'].includes(e.key)) {
        clearTimeout(dasTimer);
        clearInterval(dasInterval);
      }
      if (['ArrowDown', 's', 'S'].includes(e.key)) {
        isSoftDroppingRef.current = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearTimeout(dasTimer);
      clearInterval(dasInterval);
    };
  }, [moveHorizontal, rotateShape, dropStep, hardDrop]);

  // Touch & Pointer drag directly on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !stateRef.current.activeShape) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX;
    const clientY = e.clientY;
    touchStartRef.current = {
      x: clientX,
      y: clientY,
      shapeX: stateRef.current.activeShape.x,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!touchStartRef.current || !stateRef.current.activeShape) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - touchStartRef.current.x;
    const cellWidthPx = rect.width / DEFAULT_COLS;
    const steps = Math.round(deltaX / cellWidthPx);
    const targetX = touchStartRef.current.shapeX + steps;

    if (stateRef.current.activeShape && targetX !== stateRef.current.activeShape.x) {
      const s = stateRef.current;
      const active = s.activeShape;
      if (active) {
        const candidate: FallingShape = { ...active, x: targetX };
        if (!doesShapeCollide(candidate, s.grid, s.cols, s.rows)) {
          sound.playShift();
          setGameState({ ...s, activeShape: candidate });
        }
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (touchStartRef.current) {
      const deltaY = e.clientY - touchStartRef.current.y;
      const deltaX = Math.abs(e.clientX - touchStartRef.current.x);
      // Tap (no drag) rotates the shape
      if (deltaX < 10 && Math.abs(deltaY) < 10) {
        rotateShape();
      } else if (deltaY > 50) {
        // Quick swipe down triggers hard drop
        hardDrop();
      }
    }
    touchStartRef.current = null;
  };

  // Main 60 FPS animation & physics simulation loop
  useEffect(() => {
    let animId: number;
    let lastDropTime = performance.now();

    const loop = (time: number) => {
      const s = stateRef.current;

      // Accelerated drop interval (180ms base, scaling with score, 30ms during soft drop)
      const baseDropInterval = Math.max(110, 180 - Math.floor(s.score / 500) * 8);
      const activeDropInterval = isSoftDroppingRef.current ? 30 : baseDropInterval;

      // 1. Advance falling shape
      if (!s.isGameOver && s.activeShape && time - lastDropTime > activeDropInterval) {
        lastDropTime = time;
        dropStep();
      }

      // 2. Liquid Sand Physics: 2 simulation passes per frame for fluid 60 FPS cascading silk sand
      if (!s.isGameOver) {
        let curGrid = stateRef.current.grid;
        for (let iter = 0; iter < 2; iter++) {
          const { newGrid } = stepSandPhysics(curGrid, s.cols, s.rows);
          curGrid = newGrid;
        }

        // Check for connected wall-to-wall color strand clears (8-neighbor Moore connectivity)
        const { newGrid: clearedGrid, clearedGrains, strandsCleared, clearedColor } = checkAndClearConnectedLines(
          curGrid,
          s.cols,
          s.rows
        );

        if (strandsCleared > 0 && clearedColor) {
          sound.playLineClear();
          sound.playCluck();
          shakeRef.current = 10;

          // Spawn sparkling dissolve particle burst
          const colorMeta = GRAIN_COLORS[clearedColor];
          for (let i = 0; i < 40 * strandsCleared; i++) {
            particlesRef.current.push({
              x: Math.random() * (canvasRef.current?.width || 360),
              y: (s.rows - 5 - Math.random() * 20) * ((canvasRef.current?.height || 480) / s.rows),
              vx: (Math.random() - 0.5) * 6,
              vy: -Math.random() * 5 - 2,
              color: Math.random() > 0.4 ? colorMeta.hex : colorMeta.sparkleHex,
              glow: colorMeta.glow,
              alpha: 1,
              size: Math.random() * 4 + 3,
              life: 0,
              maxLife: 35 + Math.random() * 20,
            });
          }

          const bonus = strandsCleared * 350 + clearedGrains * 6;
          const newScore = s.score + bonus;

          confetti({
            particleCount: 45 * strandsCleared,
            spread: 70,
            origin: { y: 0.65 },
          });

          // High score persistence
          if (newScore > highScore) {
            setHighScore(newScore);
            try {
              localStorage.setItem('pawcade_sand_highscore', String(newScore));
            } catch {
              // Ignore
            }
          }

          setGameState(prev => ({
            ...prev,
            grid: clearedGrid,
            score: newScore,
            clearedLines: prev.clearedLines + strandsCleared,
          }));
        } else {
          setGameState(prev => ({
            ...prev,
            grid: curGrid,
          }));
        }
      }

      // 3. Render Canvas Frame
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const cw = canvas.width;
          const ch = canvas.height;
          const cellW = cw / DEFAULT_COLS;
          const cellH = ch / DEFAULT_ROWS;

          // Screen shake decay
          let shakeX = 0;
          let shakeY = 0;
          if (shakeRef.current > 0.1) {
            shakeX = (Math.random() - 0.5) * shakeRef.current;
            shakeY = (Math.random() - 0.5) * shakeRef.current;
            shakeRef.current *= 0.85;
          }

          ctx.save();
          ctx.translate(shakeX, shakeY);

          // Clear background (Deep Rustic Glass Silo Interior)
          ctx.fillStyle = '#0f172a'; // Modern slate-900 chamber
          ctx.fillRect(0, 0, cw, ch);

          // Silo Chamber Ribs & Height Gauge Markers
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let y = 0; y < DEFAULT_ROWS; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellH);
            ctx.lineTo(cw, y * cellH);
            ctx.stroke();
          }

          // Gauge Percentage Markers (25%, 50%, 75%)
          ctx.font = 'bold 9px monospace';
          ctx.fillStyle = '#475569';
          ctx.fillText('75%', cw - 26, DEFAULT_ROWS * 0.25 * cellH + 3);
          ctx.fillText('50%', cw - 26, DEFAULT_ROWS * 0.5 * cellH + 3);
          ctx.fillText('25%', cw - 26, DEFAULT_ROWS * 0.75 * cellH + 3);

          // DANGER Warning Line at row 6 (near top)
          const dangerY = 6 * cellH;
          ctx.strokeStyle = '#ef444466';
          ctx.setLineDash([4, 4]);
          ctx.beginPath();
          ctx.moveTo(0, dangerY);
          ctx.lineTo(cw, dangerY);
          ctx.stroke();
          ctx.setLineDash([]);
          ctx.fillStyle = '#ef4444aa';
          ctx.fillText('⚠ DANGER', 10, dangerY - 4);

          // Wall Contacts: Detect colors touching left and right walls for sensor rail neon
          const contacts = getWallContacts(stateRef.current.grid, stateRef.current.cols, stateRef.current.rows);

          // RENDER RESTING SAND GRAINS WITH ORGANIC MULTI-SHADE TEXTURE
          const curGrid = stateRef.current.grid;
          for (let y = 0; y < DEFAULT_ROWS; y++) {
            for (let x = 0; x < DEFAULT_COLS; x++) {
              const rawVal = curGrid[y][x];
              if (rawVal !== 0) {
                const val = rawVal as GrainColor;
                const meta = GRAIN_COLORS[val];
                const px = x * cellW;
                const py = y * cellH;

                // Deterministic coordinate hash for organic multi-hue grain realism
                const hash = ((x * 374761393 + y * 668265263) ^ (val * 1274126177)) >>> 0;
                const variant = hash % 100;

                let grainColor = meta.hex;
                let isGlint = false;

                if (variant < 14) {
                  grainColor = meta.sparkleHex;
                  isGlint = true;
                } else if (variant < 42) {
                  grainColor = meta.lightHex;
                } else if (variant < 76) {
                  grainColor = meta.hex;
                } else {
                  grainColor = meta.darkHex;
                }

                ctx.fillStyle = grainColor;
                ctx.fillRect(px, py, cellW + 0.3, cellH + 0.3);

                // Sparkling star glint on select grains
                if (isGlint) {
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(px + cellW * 0.25, py + cellH * 0.25, cellW * 0.5, cellH * 0.5);
                }
              }
            }
          }

          // RENDER GHOST PIECE PROJECTION (Translucent guide showing where piece will land)
          const shape = stateRef.current.activeShape;
          if (shape && !stateRef.current.isGameOver) {
            let ghostY = shape.y;
            while (!doesShapeCollide({ ...shape, y: ghostY + 1 }, stateRef.current.grid, stateRef.current.cols, stateRef.current.rows)) {
              ghostY++;
            }

            if (ghostY > shape.y) {
              ctx.save();
              ctx.globalAlpha = 0.28;
              for (let r = 0; r < shape.height; r++) {
                for (let c = 0; c < shape.width; c++) {
                  const rawVal = shape.matrix[r][c];
                  if (rawVal !== 0) {
                    const val = rawVal as GrainColor;
                    const meta = GRAIN_COLORS[val];
                    const gx = (shape.x + c) * cellW;
                    const gy = (ghostY + r) * cellH;
                    ctx.fillStyle = meta.glow;
                    ctx.fillRect(gx + 1, gy + 1, cellW - 2, cellH - 2);
                    ctx.strokeStyle = meta.hex;
                    ctx.lineWidth = 1;
                    ctx.strokeRect(gx + 0.5, gy + 0.5, cellW - 1, cellH - 1);
                  }
                }
              }
              ctx.restore();
            }

            // RENDER ACTIVE FALLING PIECE (Glossy bevel & vibrant neon glow)
            for (let r = 0; r < shape.height; r++) {
              for (let c = 0; c < shape.width; c++) {
                const rawVal = shape.matrix[r][c];
                if (rawVal !== 0) {
                  const val = rawVal as GrainColor;
                  const meta = GRAIN_COLORS[val];
                  const drawX = (shape.x + c) * cellW;
                  const drawY = (shape.y + r) * cellH;

                  // Glossy block base
                  ctx.fillStyle = meta.hex;
                  ctx.fillRect(drawX, drawY, cellW, cellH);

                  // Top sunlight highlight
                  ctx.fillStyle = meta.lightHex;
                  ctx.fillRect(drawX + 1, drawY + 1, cellW - 2, 2);

                  // Specular glint
                  ctx.fillStyle = '#ffffff';
                  ctx.fillRect(drawX + 2, drawY + 2, 3, 2);
                }
              }
            }
          }

          // RENDER LEFT & RIGHT SENSOR RAILS (Neon wall indicators showing connection status!)
          const railW = 5;
          const timeMs = Date.now();
          const pulse = (Math.sin(timeMs / 140) + 1) / 2;

          // Left Sensor Rail
          let leftGlowColor = '#334155';
          if (contacts.connectedColors.size > 0) {
            const firstConnected = Array.from(contacts.connectedColors)[0];
            leftGlowColor = GRAIN_COLORS[firstConnected].hex;
          } else if (contacts.leftColors.size > 0) {
            const firstLeft = Array.from(contacts.leftColors)[0];
            leftGlowColor = GRAIN_COLORS[firstLeft].hex;
          }

          ctx.fillStyle = leftGlowColor;
          ctx.shadowColor = leftGlowColor;
          ctx.shadowBlur = contacts.connectedColors.size > 0 ? 12 + pulse * 10 : 4;
          ctx.fillRect(0, 0, railW, ch);

          // Right Sensor Rail
          let rightGlowColor = '#334155';
          if (contacts.connectedColors.size > 0) {
            const firstConnected = Array.from(contacts.connectedColors)[0];
            rightGlowColor = GRAIN_COLORS[firstConnected].hex;
          } else if (contacts.rightColors.size > 0) {
            const firstRight = Array.from(contacts.rightColors)[0];
            rightGlowColor = GRAIN_COLORS[firstRight].hex;
          }

          ctx.fillStyle = rightGlowColor;
          ctx.shadowColor = rightGlowColor;
          ctx.shadowBlur = contacts.connectedColors.size > 0 ? 12 + pulse * 10 : 4;
          ctx.fillRect(cw - railW, 0, railW, ch);
          ctx.shadowBlur = 0; // Reset shadow

          // RENDER DISSOLVING SPARKLE PARTICLES
          const particles = particlesRef.current;
          for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15; // gentle gravity
            p.life++;
            p.alpha = Math.max(0, 1 - p.life / p.maxLife);

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.glow;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            if (p.life >= p.maxLife) {
              particles.splice(i, 1);
            }
          }

          // Subtle curved glass silo sheen reflection
          const glassGrad = ctx.createLinearGradient(0, 0, cw, ch);
          glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.06)');
          glassGrad.addColorStop(0.35, 'rgba(255, 255, 255, 0.01)');
          glassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)');
          glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = glassGrad;
          ctx.fillRect(0, 0, cw, ch);

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dropStep, highScore]);

  // Wall contact indicators for UI feedback
  const activeContacts = getWallContacts(gameState.grid, gameState.cols, gameState.rows);
  const isConnectingBoth = activeContacts.connectedColors.size > 0;

  return (
    <div className="flex flex-col items-center w-full max-w-xl mx-auto p-2 sm:p-4 select-none touch-none">
      {/* 1. TOP HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/95 border border-amber-500/30 rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 mb-2.5 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-xl shadow-md">
            🌾
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
              <span>Lines: {gameState.clearedLines}</span>
              <span className="text-slate-500">•</span>
              <span>Best: {highScore}</span>
            </div>
            <div className="text-base font-black text-white leading-tight font-mono">
              Score: <span className="text-yellow-400">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Next Crop Sand & Rail Feedback */}
        <div className="flex items-center gap-2">
          {/* Wall-to-Wall Sensor Badge */}
          <div
            className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-black tracking-wider uppercase border transition-all ${
              isConnectingBoth
                ? 'bg-amber-500/20 text-yellow-300 border-amber-400 animate-pulse'
                : 'bg-slate-800/80 text-slate-400 border-slate-700'
            }`}
          >
            <Zap className={`w-3 h-3 ${isConnectingBoth ? 'text-yellow-400' : 'text-slate-500'}`} />
            <span>{isConnectingBoth ? 'CIRCUIT ACTIVE!' : 'WALL-TO-WALL'}</span>
          </div>

          {/* Next Piece Color Indicator */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Next:</span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-white shadow-sm"
              style={{ backgroundColor: GRAIN_COLORS[gameState.nextColor].hex }}
            />
          </div>

          <button
            onClick={handleToggleSound}
            aria-label="Toggle Sound"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            onClick={handleRestart}
            aria-label="Restart Game"
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. THE GRAIN SAND SILO CANVAS */}
      <div className="relative w-full aspect-[36/48] max-h-[500px] bg-slate-950 border-4 border-amber-600/50 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={DEFAULT_COLS * 10}
          height={DEFAULT_ROWS * 10}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full object-contain cursor-grab active:cursor-grabbing"
        />

        {/* Left Sensor Rail Glowing Border Line */}
        <div
          className="absolute inset-y-0 left-0 w-1.5 pointer-events-none transition-colors duration-200"
          style={{
            backgroundColor:
              activeContacts.connectedColors.size > 0
                ? GRAIN_COLORS[Array.from(activeContacts.connectedColors)[0]].hex
                : activeContacts.leftColors.size > 0
                ? GRAIN_COLORS[Array.from(activeContacts.leftColors)[0]].hex
                : 'rgba(234, 179, 8, 0.2)',
            boxShadow:
              activeContacts.connectedColors.size > 0
                ? `0 0 12px ${GRAIN_COLORS[Array.from(activeContacts.connectedColors)[0]].glow}`
                : undefined,
          }}
        />

        {/* Right Sensor Rail Glowing Border Line */}
        <div
          className="absolute inset-y-0 right-0 w-1.5 pointer-events-none transition-colors duration-200"
          style={{
            backgroundColor:
              activeContacts.connectedColors.size > 0
                ? GRAIN_COLORS[Array.from(activeContacts.connectedColors)[0]].hex
                : activeContacts.rightColors.size > 0
                ? GRAIN_COLORS[Array.from(activeContacts.rightColors)[0]].hex
                : 'rgba(234, 179, 8, 0.2)',
            boxShadow:
              activeContacts.connectedColors.size > 0
                ? `0 0 12px ${GRAIN_COLORS[Array.from(activeContacts.connectedColors)[0]].glow}`
                : undefined,
          }}
        />

        {/* GAME OVER OVERLAY */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in max-h-full overflow-y-auto">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg">
              🌾
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Silo Full!</h3>
            <p className="text-xs text-slate-300 mb-4 max-w-xs leading-relaxed">
              Sand reached the top danger zone! Connect same-colored sands from the <strong className="text-amber-400">LEFT wall to the RIGHT wall</strong> to melt lines.
            </p>
            <div className="bg-slate-800 border border-slate-700 rounded-xl px-5 py-2.5 font-mono text-amber-300 font-bold mb-5 shadow-inner">
              Final Score: {gameState.score}
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-3.5 min-h-[48px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-400/30 cursor-pointer active:scale-95 transition-transform"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. TACTILE MOBILE TOUCH CONTROLLER (5 responsive action buttons with hold-to-slide DAS) */}
      <div className="w-full mt-2.5 grid grid-cols-5 gap-2">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            startHoldAction(() => moveHorizontal(-1));
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            stopHoldAction();
          }}
          onPointerLeave={stopHoldAction}
          onPointerCancel={stopHoldAction}
          aria-label="Hold to Move Left"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-colors cursor-pointer shadow-sm touch-none select-none"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={rotateShape}
          aria-label="Rotate Shape"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-amber-400 active:text-slate-950 transition-colors cursor-pointer shadow-sm touch-none select-none"
        >
          <RotateCw className="w-6 h-6" />
        </button>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            isSoftDroppingRef.current = true;
            startHoldAction(() => dropStep(), 120, 45);
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            isSoftDroppingRef.current = false;
            stopHoldAction();
          }}
          onPointerLeave={() => {
            isSoftDroppingRef.current = false;
            stopHoldAction();
          }}
          onPointerCancel={() => {
            isSoftDroppingRef.current = false;
            stopHoldAction();
          }}
          aria-label="Hold to Soft Drop"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-slate-300 active:text-slate-950 transition-colors cursor-pointer shadow-sm touch-none select-none"
        >
          <ArrowDown className="w-6 h-6" />
        </button>

        <button
          onPointerDown={(e) => {
            e.preventDefault();
            try { (e.target as Element).setPointerCapture(e.pointerId); } catch {}
            startHoldAction(() => moveHorizontal(1));
          }}
          onPointerUp={(e) => {
            try { (e.target as Element).releasePointerCapture(e.pointerId); } catch {}
            stopHoldAction();
          }}
          onPointerLeave={stopHoldAction}
          onPointerCancel={stopHoldAction}
          aria-label="Hold to Move Right"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-colors cursor-pointer shadow-sm touch-none select-none"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <button
          onClick={hardDrop}
          aria-label="Hard Drop Slam"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-400/25 active:scale-95 transition-all cursor-pointer touch-none select-none"
        >
          <Sparkles className="w-6 h-6 fill-slate-950" />
        </button>
      </div>

      {/* 4. PRO CONTROLS HINT */}
      <div className="w-full mt-2 text-center text-[11px] text-slate-400 flex items-center justify-center gap-2">
        <span className="hidden sm:inline">Desktop: [A/D] or [Arrows] Move • [W/Up] Rotate • [Space] Hard Drop</span>
        <span className="sm:hidden">Touch: Drag on silo to steer • Tap to rotate • Swipe down to drop</span>
      </div>
    </div>
  );
};

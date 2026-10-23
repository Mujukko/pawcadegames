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
  GRAIN_COLORS,
  DEFAULT_COLS,
  DEFAULT_ROWS,
} from './logic/engine';
import { sound } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  ArrowDown,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

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

  // Sound toggle
  const handleToggleSound = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  // Restart game
  const handleRestart = () => {
    const next = initializeSandGame();
    setGameState(next);
  };

  // Move active shape horizontally
  const moveHorizontal = useCallback((dir: -1 | 1) => {
    const s = stateRef.current;
    if (s.isGameOver || !s.activeShape) return;

    const nextShape = { ...s.activeShape, x: s.activeShape.x + dir };
    if (!doesShapeCollide(nextShape, s.grid, s.cols, s.rows)) {
      setGameState({ ...s, activeShape: nextShape });
    }
  }, []);

  // Rotate active shape
  const rotateShape = useCallback(() => {
    const s = stateRef.current;
    if (s.isGameOver || !s.activeShape) return;

    const rotatedMat = rotateMatrix(s.activeShape.matrix);
    const nextShape = {
      ...s.activeShape,
      matrix: rotatedMat,
      width: rotatedMat[0].length,
      height: rotatedMat.length,
    };

    // If colliding, attempt small wall kicks
    if (!doesShapeCollide(nextShape, s.grid, s.cols, s.rows)) {
      sound.playRotate();
      setGameState({ ...s, activeShape: nextShape });
    } else {
      // Wall kick left or right
      const kickLeft = { ...nextShape, x: nextShape.x - 1 };
      const kickRight = { ...nextShape, x: nextShape.x + 1 };
      if (!doesShapeCollide(kickLeft, s.grid, s.cols, s.rows)) {
        sound.playRotate();
        setGameState({ ...s, activeShape: kickLeft });
      } else if (!doesShapeCollide(kickRight, s.grid, s.cols, s.rows)) {
        sound.playRotate();
        setGameState({ ...s, activeShape: kickRight });
      }
    }
  }, []);

  // Drop active shape immediately to floor
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

    // Check if new shape can spawn at top
    const nextShape = spawnRandomShape(s.cols, s.nextColor);
    const nextCol = (Math.floor(Math.random() * 4) + 1) as any;
    const isOver = doesShapeCollide(nextShape, solidifiedGrid, s.cols, s.rows);

    setGameState({
      ...s,
      grid: solidifiedGrid,
      activeShape: isOver ? null : nextShape,
      nextColor: nextCol,
      isGameOver: isOver,
      score: s.score + 20,
    });
  }, []);

  // Soft drop step
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
      // Impact and solidify
      const solidifiedGrid = solidifyShapeToGrid(s.activeShape, s.grid);
      sound.playSandImpact();

      const nextShape = spawnRandomShape(s.cols, s.nextColor);
      const nextCol = (Math.floor(Math.random() * 4) + 1) as any;
      const isOver = doesShapeCollide(nextShape, solidifiedGrid, s.cols, s.rows);

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        moveHorizontal(-1);
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        moveHorizontal(1);
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        rotateShape();
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        dropStep();
      } else if (e.key === ' ') {
        e.preventDefault();
        hardDrop();
      } else if (e.key === 'r' || e.key === 'R') {
        handleRestart();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [moveHorizontal, rotateShape, dropStep, hardDrop]);

  // Main simulation & render loop
  useEffect(() => {
    let animId: number;
    let lastDropTime = performance.now();
    let lastPhysicsTime = performance.now();
    const dropInterval = 450; // Shape fall speed (ms)
    const physicsInterval = 25; // Sand flow speed (40 FPS physics)

    const loop = (time: number) => {
      const s = stateRef.current;

      // 1. Advance falling shape
      if (!s.isGameOver && s.activeShape && time - lastDropTime > dropInterval) {
        lastDropTime = time;
        dropStep();
      }

      // 2. Advance sand cellular automata physics & line clears
      if (time - lastPhysicsTime > physicsInterval) {
        lastPhysicsTime = time;
        const { newGrid } = stepSandPhysics(stateRef.current.grid, stateRef.current.cols, stateRef.current.rows);

        // Check for connected wall-to-wall color strand clears
        const { newGrid: clearedGrid, clearedGrains, strandsCleared } = checkAndClearConnectedLines(
          newGrid,
          stateRef.current.cols,
          stateRef.current.rows
        );

        if (strandsCleared > 0) {
          sound.playLineClear();
          sound.playCluck();
          const bonus = strandsCleared * 300 + clearedGrains * 5;
          const newScore = stateRef.current.score + bonus;

          confetti({
            particleCount: 50 * strandsCleared,
            spread: 60,
            origin: { y: 0.7 },
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
            grid: newGrid,
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

          // Clear background (Dark Country Silo interior)
          ctx.fillStyle = '#1c1917';
          ctx.fillRect(0, 0, cw, ch);

          // Subtle wooden silo ribs
          ctx.strokeStyle = '#292524';
          ctx.lineWidth = 1;
          for (let y = 0; y < DEFAULT_ROWS; y += 4) {
            ctx.beginPath();
            ctx.moveTo(0, y * cellH);
            ctx.lineTo(cw, y * cellH);
            ctx.stroke();
          }

          // Render resting sand grains
          const curGrid = stateRef.current.grid;
          for (let y = 0; y < DEFAULT_ROWS; y++) {
            for (let x = 0; x < DEFAULT_COLS; x++) {
              const val = curGrid[y][x];
              if (val !== 0) {
                const colorMeta = GRAIN_COLORS[val as 1 | 2 | 3 | 4];
                ctx.fillStyle = colorMeta.hex;
                ctx.fillRect(x * cellW, y * cellH, cellW + 0.3, cellH + 0.3);
              }
            }
          }

          // Render falling active shape
          const shape = stateRef.current.activeShape;
          if (shape && !stateRef.current.isGameOver) {
            for (let r = 0; r < shape.height; r++) {
              for (let c = 0; c < shape.width; c++) {
                const val = shape.matrix[r][c];
                if (val !== 0) {
                  const colorMeta = GRAIN_COLORS[val as 1 | 2 | 3 | 4];
                  const drawX = (shape.x + c) * cellW;
                  const drawY = (shape.y + r) * cellH;

                  // Glossy block preview
                  ctx.fillStyle = colorMeta.hex;
                  ctx.fillRect(drawX, drawY, cellW, cellH);

                  // Inner specular glow
                  ctx.fillStyle = colorMeta.glow;
                  ctx.fillRect(drawX + 1, drawY + 1, cellW - 2, 2);
                }
              }
            }
          }
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [dropStep, highScore]);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto p-2 sm:p-4 select-none touch-none">
      {/* 1. TOP HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-amber-500/30 rounded-2xl px-3 py-2 sm:px-4 sm:py-3 mb-3 shadow-lg">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center text-xl shadow-md">
            🐔
          </div>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
              Lines: {gameState.clearedLines} | Best: {highScore}
            </div>
            <div className="text-base font-black text-white leading-tight font-mono">
              Score: <span className="text-yellow-400">{gameState.score}</span>
            </div>
          </div>
        </div>

        {/* Next Color Indicator & Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400">Next:</span>
            <span
              className="w-3.5 h-3.5 rounded-full border border-white"
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
      <div className="relative w-full aspect-[36/48] max-h-[480px] bg-stone-900 border-4 border-amber-600/40 rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={DEFAULT_COLS * 10}
          height={DEFAULT_ROWS * 10}
          className="w-full h-full object-contain"
        />

        {/* Left & Right Wall Connection Guide lines */}
        <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-amber-400/50 to-transparent pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-amber-400/50 to-transparent pointer-events-none" />

        {/* GAME OVER OVERLAY */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in max-h-full overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-400 flex items-center justify-center text-3xl mb-3">
              🌾
            </div>
            <h3 className="text-2xl font-black text-white mb-1">Silo Overflow!</h3>
            <p className="text-xs text-slate-300 mb-4 max-w-xs">
              The sand reached the top of the farm silo! Connect same colors wall-to-wall to melt sand.
            </p>
            <div className="bg-slate-800 rounded-xl px-4 py-2 font-mono text-amber-300 font-bold mb-5">
              Final Score: {gameState.score}
            </div>
            <button
              onClick={handleRestart}
              className="px-6 py-3 min-h-[48px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black text-sm flex items-center gap-2 shadow-lg shadow-amber-400/30 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>PLAY AGAIN</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. TACTILE MOBILE TOUCH CONTROLLER */}
      <div className="w-full mt-3 grid grid-cols-4 gap-2">
        <button
          onClick={() => moveHorizontal(-1)}
          aria-label="Move Left"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        <button
          onClick={rotateShape}
          aria-label="Rotate Shape"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-amber-400 active:text-slate-950 transition-colors cursor-pointer"
        >
          <RotateCw className="w-6 h-6" />
        </button>

        <button
          onClick={() => moveHorizontal(1)}
          aria-label="Move Right"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-slate-800 active:bg-amber-400 border border-slate-700 flex items-center justify-center text-slate-200 active:text-slate-950 transition-colors cursor-pointer"
        >
          <ArrowRight className="w-6 h-6" />
        </button>

        <button
          onClick={hardDrop}
          aria-label="Hard Drop"
          className="h-13 sm:h-14 min-h-[48px] min-w-[44px] rounded-2xl bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black flex items-center justify-center shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowDown className="w-6 h-6 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  ConnectGameState,
  GridPoint,
  MahjongConnectTileType,
} from './logic/types';
import {
  createConnectGame,
  selectConnectTile,
  findValidMove,
  shuffleBoard,
  updateConnectTimer,
  CONNECT_LEVELS,
} from './logic/engine';
import { connectSound } from './systems/sound';

interface FarmMahjongConnectProps {
  onBack?: () => void;
}

const TILE_ICONS: Record<MahjongConnectTileType, string> = {
  carrot: '🥕',
  corn: '🌽',
  pumpkin: '🎃',
  strawberry: '🍓',
  apple: '🍎',
  sunflower: '🌻',
  egg: '🥚',
  milk: '🥛',
  wheat: '🌾',
  honey: '🍯',
  cherry: '🍒',
  watering_can: '🚿',
};

const TILE_BG_COLORS: Record<MahjongConnectTileType, string> = {
  carrot: '#ffedd5',
  corn: '#fef9c3',
  pumpkin: '#ffedd5',
  strawberry: '#ffe4e6',
  apple: '#fee2e2',
  sunflower: '#fef08a',
  egg: '#f1f5f9',
  milk: '#e0f2fe',
  wheat: '#fef3c7',
  honey: '#fef3c7',
  cherry: '#fce7f3',
  watering_can: '#e0e7ff',
};

export const FarmMahjongConnectContainer: React.FC<FarmMahjongConnectProps> = ({ onBack }) => {
  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [gameState, setGameState] = useState<ConnectGameState>(() => createConnectGame(0));
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [hintPair, setHintPair] = useState<{ t1: GridPoint; t2: GridPoint } | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<ConnectGameState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startLevel = useCallback((lvlIdx: number) => {
    setCurrentLevel(lvlIdx);
    const newState = createConnectGame(lvlIdx);
    setGameState(newState);
    setHintPair(null);
    connectSound.playSelect();
  }, []);

  const handleTileClick = useCallback((point: GridPoint) => {
    setHintPair(null);
    setGameState((prev) => {
      const next = selectConnectTile(prev, point);
      if (next.events.length > 0) {
        next.events.forEach((evt) => {
          if (evt.type === 'select_tile') connectSound.playSelect();
          else if (evt.type === 'match_pair') connectSound.playMatch();
          else if (evt.type === 'blocked_path') connectSound.playBlocked();
          else if (evt.type === 'auto_shuffle') connectSound.playShuffle();
        });
      }
      if (next.isWon && !prev.isWon) {
        connectSound.playVictory();
      }
      return next;
    });
  }, []);

  const handleShuffle = useCallback(() => {
    if (gameState.shufflesRemaining <= 0 || gameState.isGameOver || gameState.isWon) return;
    setHintPair(null);
    setGameState((prev) => {
      const next = shuffleBoard(prev);
      connectSound.playShuffle();
      return { ...next, shufflesRemaining: prev.shufflesRemaining - 1 };
    });
  }, [gameState.shufflesRemaining, gameState.isGameOver, gameState.isWon]);

  const handleHint = useCallback(() => {
    if (gameState.hintsRemaining <= 0 || gameState.isGameOver || gameState.isWon) return;
    const move = findValidMove(gameState);
    if (move) {
      setHintPair({ t1: move.tile1, t2: move.tile2 });
      connectSound.playSelect();
      setGameState((prev) => ({ ...prev, hintsRemaining: prev.hintsRemaining - 1 }));
    }
  }, [gameState]);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      connectSound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyH') {
        e.preventDefault();
        handleHint();
      } else if (e.code === 'KeyS') {
        e.preventDefault();
        handleShuffle();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        startLevel(currentLevel);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHint, handleShuffle, currentLevel, startLevel, toggleSound]);

  // Main animation / timer loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updateConnectTimer(current, dt);

      if (next.isGameOver && !current.isGameOver) {
        connectSound.playBlocked();
      }

      setGameState(next);
      renderCanvas(next);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  // Canvas click detection
  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Grid layout parameters
    const margin = 28;
    const gridW = canvas.width - margin * 2;
    const gridH = canvas.height - margin * 2;
    const tileW = gridW / gameState.cols;
    const tileH = gridH / gameState.rows;

    if (x < margin || x > canvas.width - margin || y < margin || y > canvas.height - margin) return;

    const c = Math.floor((x - margin) / tileW);
    const r = Math.floor((y - margin) / tileH);

    if (r >= 0 && r < gameState.rows && c >= 0 && c < gameState.cols) {
      handleTileClick({ r, c });
    }
  };

  // Render canvas
  const renderCanvas = (state: ConnectGameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Board background felt
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#064e3b'); // deep emerald felt
    bgGrad.addColorStop(1, '#022c22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Subtle wooden border
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, width - 10, height - 10);

    const margin = 28;
    const gridW = width - margin * 2;
    const gridH = height - margin * 2;
    const tileW = gridW / state.cols;
    const tileH = gridH / state.rows;
    const tileGap = 3;

    // Helper to convert grid coordinates (including outer -1 / max borders) to canvas pixels
    const pointToPixel = (p: GridPoint) => {
      return {
        x: margin + (p.c + 0.5) * tileW,
        y: margin + (p.r + 0.5) * tileH,
      };
    };

    // Render active tiles
    for (let r = 0; r < state.rows; r++) {
      for (let c = 0; c < state.cols; c++) {
        const tile = state.grid[r][c];
        if (!tile || tile.isEmpty) continue;

        const tileX = margin + c * tileW + tileGap;
        const tileY = margin + r * tileH + tileGap;
        const w = tileW - tileGap * 2;
        const h = tileH - tileGap * 2;

        const isSelected = state.selectedTile?.r === r && state.selectedTile?.c === c;
        const isHint = (hintPair?.t1.r === r && hintPair?.t1.c === c) || (hintPair?.t2.r === r && hintPair?.t2.c === c);

        ctx.save();

        // Tile shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.roundRect(tileX + 2, tileY + 4, w, h, 6);
        ctx.fill();

        // Tile body
        ctx.fillStyle = TILE_BG_COLORS[tile.type] || '#ffffff';
        ctx.beginPath();
        ctx.roundRect(tileX, tileY, w, h, 6);
        ctx.fill();

        // 3D edge highlight
        ctx.strokeStyle = isSelected ? '#f59e0b' : isHint ? '#38bdf8' : '#cbd5e1';
        ctx.lineWidth = isSelected ? 3.5 : isHint ? 3 : 1.5;
        ctx.stroke();

        // Selected pulsing border glow
        if (isSelected) {
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.lineWidth = 6;
          ctx.stroke();
        }

        // Draw tile emoji icon
        const icon = TILE_ICONS[tile.type] || '🌾';
        const fontSize = Math.min(w * 0.55, h * 0.55);
        ctx.font = `${fontSize}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, tileX + w * 0.5, tileY + h * 0.52);

        ctx.restore();
      }
    }

    // Render Connecting Path Beam (if active)
    if (state.activePath && state.activePath.length >= 2) {
      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#facc15';
      ctx.shadowBlur = 12;

      ctx.beginPath();
      const start = pointToPixel(state.activePath[0]);
      ctx.moveTo(start.x, start.y);

      for (let i = 1; i < state.activePath.length; i++) {
        const pt = pointToPixel(state.activePath[i]);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.stroke();

      // Inner white beam
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.shadowBlur = 0;
      ctx.stroke();

      ctx.restore();
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-between w-full h-full max-w-4xl mx-auto select-none bg-slate-950 text-white font-sans overflow-hidden"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD */}
      <header className="w-full px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between z-10 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-semibold transition"
            >
              ← Hub
            </button>
          )}
          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <span>🧩</span>
            <span>Level {gameState.level} / {CONNECT_LEVELS.length}</span>
          </div>
        </div>

        {/* Timer Bar */}
        <div className="flex-1 max-w-xs mx-4">
          <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-bold">
            <span>TIME</span>
            <span>{Math.ceil(gameState.timeRemaining)}s</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-150 ${
                gameState.timeRemaining < 25 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.min(100, (gameState.timeRemaining / gameState.totalTime) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Score & Audio */}
        <div className="flex items-center gap-3">
          <div className="font-bold text-amber-400">
            ⭐ {gameState.score}
          </div>
          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
            title="Toggle Audio"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full flex items-center justify-center p-2 overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={540}
          onPointerDown={handleCanvasPointer}
          className="w-full h-full max-h-[72vh] object-contain block rounded-xl shadow-2xl cursor-pointer"
        />

        {/* Victory Modal */}
        {gameState.isWon && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-2">
              LEVEL {gameState.level} CLEARED!
            </h2>
            <p className="text-slate-300 text-sm max-w-md mb-4">
              All crop tiles connected cleanly! Great eye for open matching paths!
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-5 text-sm font-bold text-emerald-400">
              Total Score: {gameState.score} PTS
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => startLevel(currentLevel)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
              >
                🔄 Replay
              </button>
              {currentLevel < CONNECT_LEVELS.length - 1 ? (
                <button
                  onClick={() => startLevel(currentLevel + 1)}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
                >
                  Next Level →
                </button>
              ) : (
                <button
                  onClick={() => startLevel(0)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
                >
                  🏆 Play All Again
                </button>
              )}
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.isGameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="text-5xl mb-2">⏳</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-red-400 mb-2">TIME EXPIRED!</h2>
            <p className="text-slate-300 text-sm max-w-md mb-4">
              The clock ran out before all tiles were connected. Try using hints or shuffles when stuck!
            </p>
            <button
              onClick={() => startLevel(currentLevel)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              🔄 Try Again
            </button>
          </div>
        )}
      </div>

      {/* Bottom Tool Bar */}
      <footer className="w-full px-4 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-around z-10">
        <button
          onClick={handleHint}
          disabled={gameState.hintsRemaining <= 0 || gameState.isGameOver || gameState.isWon}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 rounded-xl font-bold text-sm border border-slate-700 shadow transition active:scale-95"
        >
          <span>💡 Hint</span>
          <span className="px-1.5 py-0.5 bg-amber-500 text-slate-950 rounded-full text-xs font-black">
            {gameState.hintsRemaining}
          </span>
        </button>

        <button
          onClick={handleShuffle}
          disabled={gameState.shufflesRemaining <= 0 || gameState.isGameOver || gameState.isWon}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 disabled:opacity-40 rounded-xl font-bold text-sm border border-slate-700 shadow transition active:scale-95"
        >
          <span>🔀 Shuffle</span>
          <span className="px-1.5 py-0.5 bg-cyan-500 text-slate-950 rounded-full text-xs font-black">
            {gameState.shufflesRemaining}
          </span>
        </button>
      </footer>
    </div>
  );
};

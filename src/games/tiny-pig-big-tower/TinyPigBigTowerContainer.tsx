import React, { useEffect, useRef, useState } from 'react';
import {
  initBigTowerGame,
  stepBigTowerGame,
  respawnPlayer,
  calculateTowerStars,
} from './logic/engine';
import { BigTowerGameState, TowerInput } from './logic/types';
import { towerSound } from './systems/sound';

export const TinyPigBigTowerContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<BigTowerGameState>(() => {
    let best = 999;
    if (typeof window !== 'undefined') {
      try {
        const savedBest = localStorage.getItem('pawcade_tower_best');
        if (savedBest) best = parseFloat(savedBest) || 999;
      } catch {
        // Safe catch
      }
    }
    return initBigTowerGame(best);
  });

  const stateRef = useRef<BigTowerGameState>(gameState);
  stateRef.current = gameState;

  const [isMuted, setIsMuted] = useState(false);

  const inputRef = useRef<TowerInput>({
    moveLeft: false,
    moveRight: false,
    jump: false,
    restart: false,
  });

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    towerSound.setMuted(nextMuted);
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        inputRef.current.jump = true;
        if (stateRef.current.player.isWallSliding) {
          towerSound.playWallJump();
        } else if (stateRef.current.player.isGrounded) {
          towerSound.playJump();
        }
      }
      if (e.code === 'KeyR') {
        const restarted = respawnPlayer(stateRef.current);
        setGameState(restarted);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = false;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) inputRef.current.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Main Canvas Render Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let cameraY = 1350;

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      const currentState = stateRef.current;
      const prevDeaths = currentState.deathsCount;
      const prevCpId = currentState.activeCheckpoint.id;
      const prevStatus = currentState.status;

      const nextState = stepBigTowerGame(currentState, inputRef.current, dt);

      // Sound triggers
      if (nextState.deathsCount > prevDeaths) {
        towerSound.playZapped();
      }
      if (nextState.activeCheckpoint.id !== prevCpId) {
        towerSound.playCheckpoint();
      }
      if (nextState.status === 'victory' && prevStatus !== 'victory') {
        towerSound.playVictory();
        try {
          localStorage.setItem('pawcade_tower_best', String(nextState.bestTimeSeconds));
        } catch {
          // Safe catch
        }
      }

      stateRef.current = nextState;
      setGameState(nextState);

      // Render Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;

          // Smooth vertical camera tracking
          const targetCamY = nextState.player.y;
          cameraY += (targetCamY - cameraY) * 0.12;

          // Deep navy silo background
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(0, 0, width, height);

          // Tower grid lines
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          for (let gy = 0; gy < height; gy += 40) {
            ctx.beginPath();
            ctx.moveTo(0, gy);
            ctx.lineTo(width, gy);
            ctx.stroke();
          }

          // Apply camera transform (center player vertically in viewport)
          ctx.save();
          const camOffsetX = (width - 480) / 2; // Center 480px wide tower in canvas
          ctx.translate(camOffsetX, height * 0.5 - cameraY);

          // Draw Tower Blocks
          nextState.blocks.forEach(block => {
            if (block.isBroken) return;

            if (block.type === 'solid') {
              // Charcoal rustic block with bright cyan edge
              ctx.fillStyle = '#1e293b';
              ctx.fillRect(block.x, block.y, block.width, block.height);
              ctx.strokeStyle = '#38bdf8';
              ctx.lineWidth = 2;
              ctx.strokeRect(block.x, block.y, block.width, block.height);
            } else if (block.type === 'crumble') {
              // Crumbling hay platform
              ctx.fillStyle = '#ca8a04';
              ctx.fillRect(block.x, block.y, block.width, block.height);
              ctx.strokeStyle = '#facc15';
              ctx.lineWidth = 2;
              ctx.strokeRect(block.x, block.y, block.width, block.height);
            } else if (block.type === 'trampoline') {
              // Yellow spring trampoline
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(block.x, block.y, block.width, 6);
              // Coils
              ctx.strokeStyle = '#94a3b8';
              ctx.lineWidth = 2;
              ctx.strokeRect(block.x + 4, block.y + 6, block.width - 8, block.height - 6);
            } else if (block.type === 'lava') {
              // Hot bubbling corn syrup
              ctx.fillStyle = '#f97316';
              ctx.fillRect(block.x, block.y, block.width, block.height);
              ctx.strokeStyle = '#fbbf24';
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (let lx = block.x; lx <= block.x + block.width; lx += 12) {
                const ly = block.y + Math.sin(lx * 0.2 + time * 0.006) * 3;
                ctx.lineTo(lx, ly);
              }
              ctx.stroke();
            } else if (block.type === 'golden_acorn') {
              // The Grand Golden Acorn!
              ctx.save();
              ctx.translate(block.x + 10, block.y + 12);
              const floatBounce = Math.sin(time * 0.006) * 4;
              ctx.translate(0, floatBounce);

              ctx.fillStyle = '#facc15';
              ctx.beginPath();
              ctx.ellipse(0, 0, 9, 13, 0, 0, Math.PI * 2);
              ctx.fill();
              // Acorn Cap
              ctx.fillStyle = '#78350f';
              ctx.beginPath();
              ctx.arc(0, -6, 9, Math.PI, 0);
              ctx.fill();
              ctx.fillRect(-2, -15, 4, 7);

              // Sparkles
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.ellipse(-3, 0, 2, 4, 0, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          });

          // Draw Checkpoint Flags
          nextState.checkpoints.forEach(cp => {
            ctx.save();
            ctx.translate(cp.x, cp.y);
            // Flag Pole
            ctx.fillStyle = '#64748b';
            ctx.fillRect(-2, -26, 4, 26);
            // Flag
            ctx.fillStyle = cp.reached ? '#10b981' : '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(2, -26);
            ctx.lineTo(18, -18);
            ctx.lineTo(2, -10);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
          });

          // Draw Moving Lasers
          nextState.movingLasers.forEach(laser => {
            ctx.save();
            ctx.fillStyle = '#06b6d4';
            ctx.shadowColor = '#06b6d4';
            ctx.shadowBlur = 8;
            ctx.fillRect(laser.x, laser.y, laser.width, laser.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(laser.x + 2, laser.y + 2, laser.width - 4, laser.height - 4);
            ctx.restore();
          });

          // Draw Pip the Tiny Square Pig
          const player = nextState.player;
          ctx.save();
          ctx.translate(player.x, player.y);

          // Squish and stretch on jumps/landings
          const stretchX = player.isGrounded ? 1.0 : Math.abs(player.vy) > 100 ? 0.85 : 1.0;
          const stretchY = player.isGrounded ? 1.0 : Math.abs(player.vy) > 100 ? 1.15 : 1.0;
          ctx.scale(stretchX, stretchY);

          // Pink Square Body
          ctx.fillStyle = '#f472b6';
          ctx.beginPath();
          ctx.roundRect(0, 0, player.width, player.height, 3);
          ctx.fill();

          // Cute Pig Snout
          ctx.fillStyle = '#fb7185';
          ctx.beginPath();
          ctx.roundRect(player.width * 0.25, player.height * 0.45, player.width * 0.5, player.height * 0.35, 2);
          ctx.fill();
          // Nostrils
          ctx.fillStyle = '#881337';
          ctx.fillRect(player.width * 0.35, player.height * 0.55, 1.5, 2);
          ctx.fillRect(player.width * 0.55, player.height * 0.55, 1.5, 2);

          // Happy Tiny Eyes
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(player.width * 0.25, player.height * 0.25, 2, 2.5);
          ctx.fillRect(player.width * 0.65, player.height * 0.25, 2, 2.5);

          // Floppy Pink Ears
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(-1, -2, 3, 3);
          ctx.fillRect(player.width - 2, -2, 3, 3);

          ctx.restore();

          ctx.restore(); // Exit camera transform
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const earnedStars = calculateTowerStars(gameState.elapsedTime, gameState.deathsCount);

  return (
    <div className="relative w-full h-[600px] max-w-4xl mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none touch-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐷🏰</span>
          <div>
            <h1 className="text-sm font-black tracking-wide text-amber-400">
              {gameState.activeCheckpoint.floorName}
            </h1>
            <p className="text-[11px] text-slate-400">Big Tower Tiny Pig</p>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">TIME: </span>
            <span className="font-bold text-white">{gameState.elapsedTime.toFixed(1)}s</span>
          </div>

          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">DEATHS: </span>
            <span
              className={`font-bold ${
                gameState.deathsCount === 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              💀 {gameState.deathsCount}
            </span>
          </div>

          {gameState.bestTimeSeconds < 999 && (
            <div className="hidden sm:flex bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400">BEST: </span>
              <span className="font-bold text-amber-400">
                {gameState.bestTimeSeconds.toFixed(1)}s
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setGameState(respawnPlayer(stateRef.current))}
            className="px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
          >
            Retry (R)
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 bg-black">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-cover"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <div className="bg-slate-900/90 border border-amber-500/50 p-6 rounded-2xl text-center max-w-sm shadow-xl">
              <div className="text-4xl mb-2 animate-bounce">🐷🏰</div>
              <h2 className="text-xl font-black text-amber-400 mb-1">Big Tower Tiny Pig</h2>
              <p className="text-xs text-slate-300 mb-3">
                A pesky raccoon snatched your Golden Acorn and ran to the pinnacle of the grain silo!
              </p>
              <div className="text-xs bg-slate-800 p-2.5 rounded-lg text-slate-300 mb-4 text-left">
                <div className="font-bold text-amber-400 mb-1">🎮 TOWER CLIMB CONTROLS:</div>
                <div>• Move: A/D or Left/Right Arrows</div>
                <div>• Jump & Wall-Jump: Space, W, or Up Arrow</div>
                <div>• Wall-Slide: Slide down vertical shafts slowly</div>
                <div>• Hit yellow flagpoles for instant respawns!</div>
              </div>
              <div className="text-sm font-bold text-amber-300 animate-pulse">
                Jump or Move to Start Climbing!
              </div>
            </div>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-amber-500/60 p-6 rounded-2xl text-center max-w-sm shadow-2xl">
              <div className="text-3xl mb-1">🏆🌰</div>
              <h2 className="text-2xl font-black text-amber-400 mb-1">TOWER CONQUERED!</h2>
              <div className="flex justify-center gap-2 text-3xl my-2">
                <span className={earnedStars >= 1 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 2 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 3 ? 'text-amber-400' : 'text-slate-600'}>★</span>
              </div>
              <div className="bg-slate-800/90 rounded-xl p-3 my-3 text-xs text-left border border-slate-700 font-mono">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Ascent Time:</span>
                  <span className="text-emerald-400 font-bold">{gameState.elapsedTime.toFixed(1)}s</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Total Deaths:</span>
                  <span
                    className={
                      gameState.deathsCount <= 3 ? 'text-emerald-400 font-bold' : 'text-rose-400'
                    }
                  >
                    💀 {gameState.deathsCount}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setGameState(initBigTowerGame(gameState.bestTimeSeconds))}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition"
              >
                Climb Again (Speedrun)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Tactile Mobile Controls */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/95 border-t border-slate-800 z-10">
        {/* Left Hand: Left and Right Move */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.moveLeft = true;
            }}
            onPointerUp={() => {
              inputRef.current.moveLeft = false;
            }}
            onPointerLeave={() => {
              inputRef.current.moveLeft = false;
            }}
            className="flex-1 py-3 bg-slate-800 active:bg-amber-600 text-white font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ◀ LEFT
          </button>
          <button
            onPointerDown={() => {
              inputRef.current.moveRight = true;
            }}
            onPointerUp={() => {
              inputRef.current.moveRight = false;
            }}
            onPointerLeave={() => {
              inputRef.current.moveRight = false;
            }}
            className="flex-1 py-3 bg-slate-800 active:bg-amber-600 text-white font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            RIGHT ▶
          </button>
        </div>

        {/* Right Hand: Jump & Wall Jump */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.jump = true;
              if (stateRef.current.player.isWallSliding) {
                towerSound.playWallJump();
              } else if (stateRef.current.player.isGrounded) {
                towerSound.playJump();
              }
            }}
            onPointerUp={() => {
              inputRef.current.jump = false;
            }}
            onPointerLeave={() => {
              inputRef.current.jump = false;
            }}
            className="flex-1 py-3 bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-base rounded-xl border border-amber-400 active:scale-95 transition shadow-lg shadow-amber-900/40"
          >
            ▲ JUMP / WALL-KICK
          </button>
        </div>
      </div>
    </div>
  );
};

export default TinyPigBigTowerContainer;

import React, { useEffect, useRef, useState } from 'react';
import {
  initRescueGame,
  stepRescueGame,
  calculateRescueStars,
  WAVE_TARGETS,
} from './logic/engine';
import { RescueGameState, PondInput, DuckHat } from './logic/types';
import { ducklingSound } from './systems/sound';

export const DucklingPondRescueContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<RescueGameState>(() => {
    let hats: DuckHat[] = ['none'];
    let high = 0;
    if (typeof window !== 'undefined') {
      try {
        const savedHats = localStorage.getItem('pawcade_duckling_hats');
        if (savedHats) hats = JSON.parse(savedHats);
        const savedHigh = localStorage.getItem('pawcade_duckling_high');
        if (savedHigh) high = parseInt(savedHigh, 10) || 0;
      } catch {
        // Safe catch
      }
    }
    return initRescueGame(1, hats, high);
  });

  const stateRef = useRef<RescueGameState>(gameState);
  stateRef.current = gameState;

  const [isMuted, setIsMuted] = useState(false);
  const [showHatsDrawer, setShowHatsDrawer] = useState(false);

  const inputRef = useRef<PondInput>({});

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    ducklingSound.setMuted(nextMuted);
  };

  const equipHat = (hat: DuckHat) => {
    setGameState(prev => ({
      ...prev,
      mama: { ...prev.mama, activeHat: hat },
    }));
    setShowHatsDrawer(false);
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = true;
      if (['ArrowUp', 'KeyW'].includes(e.code)) inputRef.current.moveUp = true;
      if (['ArrowDown', 'KeyS'].includes(e.code)) inputRef.current.moveDown = true;
      if (e.code === 'Space') inputRef.current.boost = true;
      if (e.code === 'KeyR') {
        const fresh = initRescueGame(
          stateRef.current.wave,
          stateRef.current.unlockedHats,
          stateRef.current.highScore
        );
        setGameState(fresh);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = false;
      if (['ArrowUp', 'KeyW'].includes(e.code)) inputRef.current.moveUp = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) inputRef.current.moveDown = false;
      if (e.code === 'Space') inputRef.current.boost = false;
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

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      const currentState = stateRef.current;
      const prevDucks = currentState.ducksInLine;
      const prevRescued = currentState.nest.totalRescued;
      const prevStatus = currentState.status;

      const nextState = stepRescueGame(currentState, inputRef.current, dt);

      // Sound triggers
      if (nextState.ducksInLine > prevDucks) {
        ducklingSound.playPeep();
      }
      if (nextState.nest.totalRescued > prevRescued) {
        ducklingSound.playNestDeposit();
        try {
          localStorage.setItem('pawcade_duckling_hats', JSON.stringify(nextState.unlockedHats));
          localStorage.setItem('pawcade_duckling_high', String(nextState.highScore));
        } catch {
          // Safe catch
        }
      }
      if (nextState.status === 'game_over' && prevStatus !== 'game_over') {
        ducklingSound.playGameOver();
      } else if (nextState.status === 'victory' && prevStatus !== 'victory') {
        ducklingSound.playVictory();
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

          // 1. Serene Pond Water Gradient
          const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
          waterGrad.addColorStop(0, '#0284c7');
          waterGrad.addColorStop(0.6, '#0369a1');
          waterGrad.addColorStop(1, '#0c4a6e');
          ctx.fillStyle = waterGrad;
          ctx.fillRect(0, 0, width, height);

          // Animated Water Ripples
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx.lineWidth = 1.5;
          for (let ry = 40; ry < height - 60; ry += 50) {
            ctx.beginPath();
            for (let rx = 0; rx < width; rx += 25) {
              const waveY = ry + Math.sin(rx * 0.04 + time * 0.003) * 3;
              if (rx === 0) ctx.moveTo(rx, waveY);
              else ctx.lineTo(rx, waveY);
            }
            ctx.stroke();
          }

          // 2. Lilypads with Lotus Flowers
          const lilypads = [
            { x: 140, y: 120, r: 24 },
            { x: 680, y: 160, r: 28 },
            { x: 260, y: 440, r: 22 },
            { x: 740, y: 480, r: 25 },
          ];
          lilypads.forEach(lp => {
            ctx.fillStyle = '#15803d';
            ctx.beginPath();
            ctx.arc(lp.x, lp.y, lp.r, 0.25, Math.PI * 1.85);
            ctx.lineTo(lp.x, lp.y);
            ctx.closePath();
            ctx.fill();
            // Pink Lotus Flower
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(lp.x + 4, lp.y - 4, 6, 0, Math.PI * 2);
            ctx.fill();
          });

          // 3. Reeds Nest Sanctuary on Bottom Shore
          const nest = nextState.nest;
          ctx.save();
          ctx.translate(nest.x, nest.y);

          // Straw Nest Rings
          ctx.fillStyle = '#ca8a04';
          ctx.beginPath();
          ctx.arc(0, 0, nest.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#a16207';
          ctx.beginPath();
          ctx.arc(0, 0, nest.radius - 12, 0, Math.PI * 2);
          ctx.fill();

          // Green Shoreline Reeds around nest
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 3;
          for (let a = -Math.PI; a <= 0; a += 0.3) {
            const rx = Math.cos(a) * (nest.radius + 6);
            const ry = Math.sin(a) * (nest.radius + 6);
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx + Math.cos(a) * 16, ry + Math.sin(a) * 16);
            ctx.stroke();
          }

          // Nest Level Badge & Count
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(`NEST LV.${nest.nestLevel}`, 0, -4);
          ctx.font = 'bold 10px sans-serif';
          ctx.fillText(`🌾 ${nest.totalRescued} Rescued`, 0, 10);
          ctx.restore();

          // 4. Draw Rowboat Hazards
          nextState.boats.forEach(boat => {
            ctx.save();
            ctx.translate(boat.x, boat.y);

            // Rowboat Hull (Timber)
            ctx.fillStyle = '#78350f';
            ctx.beginPath();
            ctx.roundRect(0, 0, boat.width, boat.height, 12);
            ctx.fill();
            ctx.strokeStyle = '#b45309';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner Boat Bench
            ctx.fillStyle = '#92400e';
            ctx.fillRect(boat.width * 0.35, 4, boat.width * 0.3, boat.height - 8);

            // Oars Splashing
            ctx.strokeStyle = '#fde047';
            ctx.lineWidth = 2.5;
            const oarAngle = Math.sin(time * 0.008) * 0.4;
            // Top oar
            ctx.beginPath();
            ctx.moveTo(boat.width * 0.5, 4);
            ctx.lineTo(boat.width * 0.5 + Math.cos(oarAngle) * 22, -14);
            ctx.stroke();
            // Bottom oar
            ctx.beginPath();
            ctx.moveTo(boat.width * 0.5, boat.height - 4);
            ctx.lineTo(boat.width * 0.5 + Math.cos(-oarAngle) * 22, boat.height + 14);
            ctx.stroke();

            ctx.restore();
          });

          // 5. Draw Snapping Turtles
          nextState.turtles.forEach(turtle => {
            ctx.save();
            ctx.translate(turtle.x, turtle.y);
            // Green Shell
            ctx.fillStyle = '#166534';
            ctx.beginPath();
            ctx.arc(0, 0, turtle.radius, 0, Math.PI * 2);
            ctx.fill();
            // Shell Scutes
            ctx.strokeStyle = '#15803d';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Head
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(turtle.radius * 0.9, 0, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          });

          // 6. Draw Lost Ducklings (Bobbing in Pond)
          nextState.ducklings.forEach(duckling => {
            ctx.save();
            ctx.translate(duckling.x, duckling.y);

            // Water Ripple Circle beneath duckling
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.ellipse(0, 4, 10, 5, 0, 0, Math.PI * 2);
            ctx.stroke();

            // Fluffy Yellow Duckling Body
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(0, 0, 9, 0, Math.PI * 2);
            ctx.fill();

            // Duckling Head
            ctx.beginPath();
            ctx.arc(5, -4, 6, 0, Math.PI * 2);
            ctx.fill();

            // Tiny Orange Beak
            ctx.fillStyle = '#f97316';
            ctx.beginPath();
            ctx.arc(10, -3, 3, 0, Math.PI * 2);
            ctx.fill();

            // Eye
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(6, -6, 1.5, 0, Math.PI * 2);
            ctx.fill();

            // "Peep!" speech bubble if lost
            if (!duckling.isFollowing && Math.sin(time * 0.005 + duckling.x) > 0.7) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 9px sans-serif';
              ctx.fillText('peep!', -4, -14);
            }

            ctx.restore();
          });

          // 7. Draw Mama Duck (Player)
          const mama = nextState.mama;
          ctx.save();
          ctx.translate(mama.x, mama.y);
          ctx.rotate(mama.angle);

          // Swimming Wake V-Ripples
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-18, 0);
          ctx.lineTo(-34, -14);
          ctx.moveTo(-18, 0);
          ctx.lineTo(-34, 14);
          ctx.stroke();

          // White Mallard Mama Duck Body
          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
          ctx.fill();

          // Duck Head
          ctx.beginPath();
          ctx.arc(14, 0, 10, 0, Math.PI * 2);
          ctx.fill();

          // Orange Beak
          ctx.fillStyle = '#f97316';
          ctx.beginPath();
          ctx.moveTo(22, -4);
          ctx.lineTo(32, 0);
          ctx.lineTo(22, 4);
          ctx.closePath();
          ctx.fill();

          // Duck Eye
          ctx.fillStyle = '#0f172a';
          ctx.beginPath();
          ctx.arc(16, -3, 2, 0, Math.PI * 2);
          ctx.fill();

          // Equipped Cosmetic Hat
          if (mama.activeHat === 'flower') {
            ctx.fillStyle = '#f472b6';
            ctx.beginPath();
            ctx.arc(12, -8, 5, 0, Math.PI * 2);
            ctx.arc(16, -9, 4, 0, Math.PI * 2);
            ctx.fill();
          } else if (mama.activeHat === 'straw') {
            ctx.fillStyle = '#fde047';
            ctx.fillRect(8, -12, 14, 3);
            ctx.fillRect(11, -16, 8, 4);
          } else if (mama.activeHat === 'sailor') {
            ctx.fillStyle = '#1e3a8a';
            ctx.fillRect(9, -13, 12, 4);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(12, -17, 6, 4);
          } else if (mama.activeHat === 'crown') {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(8, -11);
            ctx.lineTo(11, -18);
            ctx.lineTo(14, -13);
            ctx.lineTo(17, -18);
            ctx.lineTo(20, -11);
            ctx.closePath();
            ctx.fill();
          }

          ctx.restore();
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Pointer drag navigation on canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = 900 / rect.width;
    const scaleY = 650 / rect.height;
    inputRef.current.targetX = (e.clientX - rect.left) * scaleX;
    inputRef.current.targetY = (e.clientY - rect.top) * scaleY;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.buttons === 1) {
      const rect = e.currentTarget.getBoundingClientRect();
      const scaleX = 900 / rect.width;
      const scaleY = 650 / rect.height;
      inputRef.current.targetX = (e.clientX - rect.left) * scaleX;
      inputRef.current.targetY = (e.clientY - rect.top) * scaleY;
    }
  };

  const earnedStars = calculateRescueStars(gameState.nest.totalRescued, gameState.wave);

  return (
    <div className="relative w-full h-[600px] max-w-4xl mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none touch-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🦆🌾</span>
          <div>
            <h1 className="text-sm font-black tracking-wide text-amber-400">
              Duckling Pond Rescue
            </h1>
            <p className="text-[11px] text-slate-400">Pond Wave {gameState.wave} of 3</p>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">IN LINE: </span>
            <span className="font-bold text-amber-400">{gameState.ducksInLine} 🐥</span>
          </div>

          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">RESCUED: </span>
            <span className="font-bold text-emerald-400">
              {gameState.nest.totalRescued} / {WAVE_TARGETS[gameState.wave - 1]}
            </span>
          </div>

          <div className="hidden sm:flex bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">SCORE: </span>
            <span className="font-bold text-white">{gameState.score}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHatsDrawer(!showHatsDrawer)}
            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition"
          >
            👒 Hats ({gameState.unlockedHats.length})
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
          width={900}
          height={650}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          className="w-full h-full object-cover cursor-crosshair"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <div className="bg-slate-900/90 border border-amber-500/50 p-6 rounded-2xl text-center max-w-sm shadow-xl">
              <div className="text-4xl mb-2 animate-bounce">🦆🐥🐥</div>
              <h2 className="text-xl font-black text-amber-400 mb-1">Duckling Pond Rescue</h2>
              <p className="text-xs text-slate-300 mb-3">
                Lost baby ducklings are crying for Mama Duck! Collect them into a line and lead them
                safely to the reeds nest!
              </p>
              <div className="text-xs bg-slate-800 p-2.5 rounded-lg text-slate-300 mb-4 text-left">
                <div className="font-bold text-amber-400 mb-1">🎮 POND CONTROLS:</div>
                <div>• Drag / Move: Touch or tap anywhere to steer</div>
                <div>• WASD / Arrows: Steer with keyboard</div>
                <div>• Spacebar or Turbo: Paddle boost</div>
                <div>• Watch out for speeding rowboats and turtles!</div>
              </div>
              <div className="text-sm font-bold text-amber-300 animate-pulse">
                Tap or Steer to Start Swimming!
              </div>
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl text-center max-w-xs shadow-2xl">
              <div className="text-4xl mb-2">💥🛶</div>
              <h2 className="text-xl font-black text-red-400 mb-1">CAPSIZED BY BOAT!</h2>
              <p className="text-xs text-slate-300 mb-3">
                Rescued <span className="font-bold text-white">{gameState.nest.totalRescued}</span>{' '}
                ducklings!
              </p>
              <button
                onClick={() =>
                  setGameState(
                    initRescueGame(
                      gameState.wave,
                      gameState.unlockedHats,
                      gameState.highScore
                    )
                  )
                }
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition"
              >
                Try Again (R)
              </button>
            </div>
          </div>
        )}

        {/* Victory Modal */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-amber-500/60 p-6 rounded-2xl text-center max-w-sm shadow-2xl">
              <div className="text-3xl mb-1">🏆🦆</div>
              <h2 className="text-2xl font-black text-amber-400 mb-1">ALL DUCKLINGS SAVED!</h2>
              <div className="flex justify-center gap-2 text-3xl my-2">
                <span className={earnedStars >= 1 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 2 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 3 ? 'text-amber-400' : 'text-slate-600'}>★</span>
              </div>
              <div className="bg-slate-800/90 rounded-xl p-3 my-3 text-xs text-left border border-slate-700 font-mono">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Total Ducklings:</span>
                  <span className="text-emerald-400 font-bold">
                    {gameState.nest.totalRescued} rescued
                  </span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Final Score:</span>
                  <span className="text-amber-400 font-bold">{gameState.score} pts</span>
                </div>
              </div>
              <button
                onClick={() =>
                  setGameState(initRescueGame(1, gameState.unlockedHats, gameState.highScore))
                }
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Hats Boutique Drawer */}
        {showHatsDrawer && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-amber-400">Mama Duck Hats</h3>
                <button
                  onClick={() => setShowHatsDrawer(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {(['none', 'flower', 'straw', 'sailor', 'crown'] as DuckHat[]).map(hat => {
                  const unlocked = gameState.unlockedHats.includes(hat);
                  const isCurrent = gameState.mama.activeHat === hat;

                  return (
                    <button
                      key={hat}
                      disabled={!unlocked}
                      onClick={() => equipHat(hat)}
                      className={`p-3 rounded-xl border text-center font-bold text-xs capitalize transition ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : !unlocked
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <div className="text-xl mb-1">
                        {hat === 'none'
                          ? '🦆'
                          : hat === 'flower'
                          ? '🌸'
                          : hat === 'straw'
                          ? '👒'
                          : hat === 'sailor'
                          ? '⚓'
                          : '👑'}
                      </div>
                      <div>{hat}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tactile Mobile Controls */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/95 border-t border-slate-800 z-10">
        {/* Left Thumb: Directional Pad */}
        <div className="grid grid-cols-3 gap-1">
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
            className="py-2.5 bg-slate-800 active:bg-amber-600 text-white font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ◀
          </button>
          <div className="flex flex-col gap-1">
            <button
              onPointerDown={() => {
                inputRef.current.moveUp = true;
              }}
              onPointerUp={() => {
                inputRef.current.moveUp = false;
              }}
              onPointerLeave={() => {
                inputRef.current.moveUp = false;
              }}
              className="py-1 bg-slate-800 active:bg-amber-600 text-white font-black text-xs rounded-lg border border-slate-700 active:scale-95 transition"
            >
              ▲
            </button>
            <button
              onPointerDown={() => {
                inputRef.current.moveDown = true;
              }}
              onPointerUp={() => {
                inputRef.current.moveDown = false;
              }}
              onPointerLeave={() => {
                inputRef.current.moveDown = false;
              }}
              className="py-1 bg-slate-800 active:bg-amber-600 text-white font-black text-xs rounded-lg border border-slate-700 active:scale-95 transition"
            >
              ▼
            </button>
          </div>
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
            className="py-2.5 bg-slate-800 active:bg-amber-600 text-white font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ▶
          </button>
        </div>

        {/* Right Thumb: Turbo Paddle Boost */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.boost = true;
            }}
            onPointerUp={() => {
              inputRef.current.boost = false;
            }}
            onPointerLeave={() => {
              inputRef.current.boost = false;
            }}
            className="flex-1 py-3 bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-sm rounded-xl border border-amber-400 active:scale-95 transition shadow-lg shadow-amber-900/40"
          >
            ⚡ TURBO PADDLE
          </button>
        </div>
      </div>
    </div>
  );
};

export default DucklingPondRescueContainer;

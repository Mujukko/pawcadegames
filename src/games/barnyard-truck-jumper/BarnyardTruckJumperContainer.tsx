import React, { useEffect, useRef, useState } from 'react';
import {
  initJumperGame,
  stepJumperGame,
  calculateJumperStars,
  JUMPER_LEVELS,
} from './logic/engine';
import { JumperGameState, JumperInput } from './logic/types';
import { jumperSound } from './systems/sound';

export const BarnyardTruckJumperContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<JumperGameState>(() => {
    let unlocked = 1;
    let bests = [0, 0, 0];
    if (typeof window !== 'undefined') {
      try {
        const savedLevels = localStorage.getItem('pawcade_jumper_unlocked');
        if (savedLevels) unlocked = parseInt(savedLevels, 10) || 1;
        const savedBests = localStorage.getItem('pawcade_jumper_bests');
        if (savedBests) bests = JSON.parse(savedBests);
      } catch {
        // Safe catch
      }
    }
    return initJumperGame(0, unlocked, bests);
  });

  const stateRef = useRef<JumperGameState>(gameState);
  stateRef.current = gameState;

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'levels'>('game');

  const inputRef = useRef<JumperInput>({
    moveLeft: false,
    moveRight: false,
    jump: false,
    slide: false,
  });

  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    jumperSound.setMuted(nextMuted);
  };

  const handleSelectLevel = (idx: number) => {
    if (idx + 1 > stateRef.current.unlockedLevels) return;
    const newState = initJumperGame(
      idx,
      stateRef.current.unlockedLevels,
      stateRef.current.bestDistances
    );
    setGameState(newState);
    setActiveTab('game');
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = true;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) {
        inputRef.current.jump = true;
        if (stateRef.current.player.jumpsRemaining === 2) {
          jumperSound.playJump();
        } else if (stateRef.current.player.jumpsRemaining === 1) {
          jumperSound.playDoubleJump();
        }
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        inputRef.current.slide = true;
        jumperSound.playSlide();
      }
      if (e.code === 'KeyR') {
        const fresh = initJumperGame(
          stateRef.current.levelIndex,
          stateRef.current.unlockedLevels,
          stateRef.current.bestDistances
        );
        setGameState(fresh);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) inputRef.current.moveLeft = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) inputRef.current.moveRight = false;
      if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) inputRef.current.jump = false;
      if (['ArrowDown', 'KeyS'].includes(e.code)) inputRef.current.slide = false;
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
      const prevGrounded = currentState.player.isGrounded;
      const prevCombo = currentState.comboStreak;
      const prevCoins = currentState.score;
      const prevStatus = currentState.status;

      const nextState = stepJumperGame(currentState, inputRef.current, dt);

      // Sound triggers
      if (nextState.player.isGrounded && !prevGrounded) {
        jumperSound.playLandRoof();
      }
      if (nextState.comboStreak > prevCombo && nextState.comboStreak > 1) {
        jumperSound.playComboChime(nextState.comboStreak);
      }
      if (nextState.score > prevCoins && nextState.score - prevCoins === 50) {
        jumperSound.playCoin();
      }
      if (nextState.status === 'fallen' && prevStatus !== 'fallen') {
        jumperSound.playCrash();
      } else if (nextState.status === 'victory' && prevStatus !== 'victory') {
        jumperSound.playVictory();
        try {
          localStorage.setItem('pawcade_jumper_unlocked', String(nextState.unlockedLevels));
          localStorage.setItem('pawcade_jumper_bests', JSON.stringify(nextState.bestDistances));
        } catch {
          // Safe catch
        }
      }

      stateRef.current = nextState;
      setGameState(nextState);

      // Render Canvas in 2.5D Highway Perspective
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const width = canvas.width;
          const height = canvas.height;
          const level = JUMPER_LEVELS[nextState.levelIndex];

          const cameraZ = nextState.player.z - 75; // Camera slightly behind player
          const horizonY = height * 0.38;
          const focalLength = 180;

          // Project (worldX, worldY, worldZ) into (screenX, screenY, scale)
          const project = (wx: number, wy: number, wz: number) => {
            const relZ = wz - cameraZ;
            if (relZ <= 1) return { x: width / 2, y: height, scale: 0, visible: false };
            const scale = focalLength / relZ;
            const sx = width / 2 + wx * scale * 2.8;
            const sy = horizonY + (100 - wy * 1.6) * scale * 2.2;
            return { x: sx, y: sy, scale, visible: true };
          };

          // 1. Sky & Western Desert/Pasture Gradient
          const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
          skyGrad.addColorStop(0, '#0284c7');
          skyGrad.addColorStop(0.7, '#38bdf8');
          skyGrad.addColorStop(1, '#fef08a');
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, width, horizonY);

          // Sun
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(width * 0.75, horizonY * 0.5, 30, 0, Math.PI * 2);
          ctx.fill();

          // Distant Canyon Mesas
          ctx.fillStyle = '#b45309';
          ctx.beginPath();
          ctx.moveTo(0, horizonY);
          for (let x = 0; x <= width; x += 60) {
            const mh = Math.sin(x * 0.02 + 1) * 20 + 35;
            ctx.lineTo(x, horizonY - mh);
          }
          ctx.lineTo(width, horizonY);
          ctx.closePath();
          ctx.fill();

          // 2. Highway Asphalt Surface
          const roadGrad = ctx.createLinearGradient(0, horizonY, 0, height);
          roadGrad.addColorStop(0, '#1e293b');
          roadGrad.addColorStop(1, '#0f172a');
          ctx.fillStyle = roadGrad;
          ctx.fillRect(0, horizonY, width, height - horizonY);

          // Moving Dashed Yellow Lane Lines
          const lineOffset = (nextState.player.z * 1.5) % 80;
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          for (let lz = cameraZ + (80 - lineOffset); lz < cameraZ + 450; lz += 80) {
            const p1 = project(-20, 0, lz);
            const p2 = project(-20, 0, lz + 35);
            if (p1.visible && p2.visible) {
              ctx.beginPath();
              ctx.moveTo(p1.x, p1.y);
              ctx.lineTo(p2.x, p2.y);
              ctx.stroke();
            }
          }

          // 3. Render Trucks (Sorted from back to front)
          const visibleTrucks = nextState.trucks
            .filter(t => t.z + t.length > cameraZ && t.z < cameraZ + 550)
            .sort((a, b) => b.z - a.z);

          visibleTrucks.forEach(t => {
            const backProj = project(t.x, t.y, t.z + t.length);
            const frontProj = project(t.x, t.y, t.z);
            const topBack = project(t.x, t.height, t.z + t.length);
            const topFront = project(t.x, t.height, t.z);

            if (!frontProj.visible || !backProj.visible) return;

            const halfWFront = (t.width / 2) * frontProj.scale * 2.8;
            const halfWBack = (t.width / 2) * backProj.scale * 2.8;

            // Truck Body Color by Type
            const bodyColor =
              t.type === 'hay_wagon'
                ? '#eab308'
                : t.type === 'milk_tanker'
                ? '#cbd5e1'
                : t.type === 'livestock_crate'
                ? '#b91c1c'
                : '#15803d';

            // Roof Polygon (Where player lands!)
            ctx.fillStyle = bodyColor;
            ctx.beginPath();
            ctx.moveTo(topBack.x - halfWBack, topBack.y);
            ctx.lineTo(topBack.x + halfWBack, topBack.y);
            ctx.lineTo(topFront.x + halfWFront, topFront.y);
            ctx.lineTo(topFront.x - halfWFront, topFront.y);
            ctx.closePath();
            ctx.fill();

            // Roof Trim & Highlighting
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = Math.max(1, 2 * frontProj.scale);
            ctx.stroke();

            // Truck Rear Chassis Wall
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.moveTo(topFront.x - halfWFront, topFront.y);
            ctx.lineTo(topFront.x + halfWFront, topFront.y);
            ctx.lineTo(frontProj.x + halfWFront, frontProj.y);
            ctx.lineTo(frontProj.x - halfWFront, frontProj.y);
            ctx.closePath();
            ctx.fill();

            // Red Taillights
            ctx.fillStyle = '#ef4444';
            const lightR = Math.max(2, 5 * frontProj.scale);
            ctx.beginPath();
            ctx.arc(frontProj.x - halfWFront + 6 * frontProj.scale, frontProj.y - 8 * frontProj.scale, lightR, 0, Math.PI * 2);
            ctx.arc(frontProj.x + halfWFront - 6 * frontProj.scale, frontProj.y - 8 * frontProj.scale, lightR, 0, Math.PI * 2);
            ctx.fill();
          });

          // 4. Render Overhead Arches / Signs
          nextState.arches.forEach(arch => {
            if (arch.z > cameraZ && arch.z < cameraZ + 500) {
              const signLeft = project(-110, arch.clearanceHeight, arch.z);
              const signRight = project(110, arch.clearanceHeight, arch.z);
              const postLeft = project(-110, 0, arch.z);
              const postRight = project(110, 0, arch.z);

              if (signLeft.visible && signRight.visible) {
                // Steel Upright Posts
                ctx.fillStyle = '#475569';
                ctx.fillRect(postLeft.x - 4, signLeft.y, 8, postLeft.y - signLeft.y);
                ctx.fillRect(postRight.x - 4, signRight.y, 8, postRight.y - signRight.y);

                // Overhead Green Highway Sign
                const signH = 30 * signLeft.scale * 2.2;
                ctx.fillStyle = '#15803d';
                ctx.fillRect(signLeft.x, signLeft.y - signH, signRight.x - signLeft.x, signH);
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = Math.max(1, 2 * signLeft.scale);
                ctx.strokeRect(signLeft.x, signLeft.y - signH, signRight.x - signLeft.x, signH);

                // Sign Text
                ctx.fillStyle = '#ffffff';
                ctx.font = `bold ${Math.max(8, Math.round(14 * signLeft.scale * 2))}px sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('LOW CLEARANCE - DUCK!', (signLeft.x + signRight.x) / 2, signLeft.y - signH / 3);
              }
            }
          });

          // 5. Render Highway Coins
          nextState.coins.forEach(coin => {
            if (coin.collected) return;
            if (coin.z > cameraZ && coin.z < cameraZ + 450) {
              const cp = project(coin.x, coin.y, coin.z);
              if (cp.visible) {
                const r = Math.max(3, 10 * cp.scale * 2);
                ctx.fillStyle = '#facc15';
                ctx.beginPath();
                ctx.arc(cp.x, cp.y, r, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ca8a04';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
            }
          });

          // 6. Render Daredevil Goat Buster (Player)
          const player = nextState.player;
          const pp = project(player.x, player.y, player.z);

          if (pp.visible) {
            ctx.save();
            ctx.translate(pp.x, pp.y);

            const scale = pp.scale * 2.4;
            ctx.scale(scale, scale);

            if (player.isSliding) {
              // Sliding Goat flat on belly
              ctx.fillStyle = '#f8fafc'; // White goat fur
              ctx.beginPath();
              ctx.roundRect(-24, -14, 48, 14, 6);
              ctx.fill();

              // Red Daredevil Cape trailing
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(-20, -12);
              ctx.lineTo(-36, -8);
              ctx.lineTo(-20, -4);
              ctx.closePath();
              ctx.fill();

              // Goat Horns
              ctx.fillStyle = '#78350f';
              ctx.fillRect(14, -18, 4, 8);
            } else {
              // Standing / Jumping Goat
              // Red Cape
              ctx.fillStyle = '#ef4444';
              ctx.beginPath();
              ctx.moveTo(-10, -24);
              ctx.lineTo(-22 - Math.sin(time * 0.02) * 6, -14);
              ctx.lineTo(-10, -4);
              ctx.closePath();
              ctx.fill();

              // Goat Body
              ctx.fillStyle = '#f8fafc';
              ctx.beginPath();
              ctx.roundRect(-12, -28, 24, 28, 8);
              ctx.fill();

              // Goat Head
              ctx.fillStyle = '#f8fafc';
              ctx.beginPath();
              ctx.arc(0, -36, 11, 0, Math.PI * 2);
              ctx.fill();

              // Aviator Goggles
              ctx.fillStyle = '#0f172a';
              ctx.fillRect(-9, -40, 18, 6);
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(-7, -39, 6, 4);
              ctx.fillRect(1, -39, 6, 4);

              // Curved Golden Horns
              ctx.strokeStyle = '#ca8a04';
              ctx.lineWidth = 3.5;
              ctx.beginPath();
              ctx.moveTo(-6, -45);
              ctx.quadraticCurveTo(-14, -55, -8, -58);
              ctx.stroke();
              ctx.beginPath();
              ctx.moveTo(6, -45);
              ctx.quadraticCurveTo(14, -55, 8, -58);
              ctx.stroke();

              // Wagging Goat Beard
              ctx.fillStyle = '#e2e8f0';
              ctx.beginPath();
              ctx.moveTo(-3, -27);
              ctx.lineTo(0, -20);
              ctx.lineTo(3, -27);
              ctx.closePath();
              ctx.fill();
            }

            ctx.restore();
          }

          // Speed lines when on a high combo streak
          if (nextState.comboStreak >= 3) {
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
            ctx.lineWidth = 2;
            for (let sl = 0; sl < 6; sl++) {
              const rx = Math.random() * width;
              const ry = Math.random() * height;
              ctx.beginPath();
              ctx.moveTo(rx, ry);
              ctx.lineTo(rx + (rx - width / 2) * 0.2, ry + (ry - horizonY) * 0.2);
              ctx.stroke();
            }
          }
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const level = JUMPER_LEVELS[gameState.levelIndex];
  const earnedStars = calculateJumperStars(
    gameState.distanceMeters,
    gameState.targetMeters,
    gameState.highestCombo
  );

  return (
    <div className="relative w-full h-[600px] max-w-4xl mx-auto bg-slate-950 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none touch-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🐐🚛</span>
          <div>
            <h1 className="text-sm font-black tracking-wide text-amber-400">{level.name}</h1>
            <p className="text-[11px] text-slate-400">Highway Convoy {gameState.levelIndex + 1} of 3</p>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">DISTANCE: </span>
            <span className="font-bold text-white">
              {gameState.distanceMeters}m / {gameState.targetMeters}m
            </span>
          </div>

          {gameState.comboStreak > 1 && (
            <div className="bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/80 text-amber-400 font-black animate-pulse">
              🔥 COMBO x{gameState.comboStreak}
            </div>
          )}

          <div className="hidden sm:flex bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">SCORE: </span>
            <span className="font-bold text-emerald-400">{gameState.score}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'levels' ? 'game' : 'levels')}
            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition"
          >
            {activeTab === 'levels' ? 'Play' : 'Convoys'}
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
              <div className="text-4xl mb-2 animate-bounce">🐐💨</div>
              <h2 className="text-xl font-black text-amber-400 mb-1">{level.name}</h2>
              <p className="text-xs text-slate-300 mb-3">{level.description}</p>
              <div className="text-xs bg-slate-800 p-2.5 rounded-lg text-slate-300 mb-4 text-left">
                <div className="font-bold text-amber-400 mb-1">🎮 TRUCK JUMP CONTROLS:</div>
                <div>• Strafe Left / Right: A/D or Left/Right Arrows</div>
                <div>• Jump & Double Jump: Space or W / Up Arrow</div>
                <div>• Slide under Low Signs: S or Down Arrow</div>
                <div>• Don't touch the highway pavement!</div>
              </div>
              <div className="text-sm font-bold text-amber-300 animate-pulse">
                Jump or Strafe to Start Convoy Rush!
              </div>
            </div>
          </div>
        )}

        {/* Fallen / Game Over Modal */}
        {gameState.status === 'fallen' && (
          <div className="absolute inset-0 bg-red-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl text-center max-w-xs shadow-2xl">
              <div className="text-4xl mb-2">💥🛣️</div>
              <h2 className="text-xl font-black text-red-400 mb-1">FELL OFF THE TRUCKS!</h2>
              <p className="text-xs text-slate-300 mb-3">
                Traveled <span className="font-bold text-white">{gameState.distanceMeters}m</span> of{' '}
                {gameState.targetMeters}m.
              </p>
              <button
                onClick={() =>
                  setGameState(
                    initJumperGame(
                      gameState.levelIndex,
                      gameState.unlockedLevels,
                      gameState.bestDistances
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
              <div className="text-3xl mb-1">🏆🐐</div>
              <h2 className="text-2xl font-black text-amber-400 mb-1">CONVOY SURVIVED!</h2>
              <div className="flex justify-center gap-2 text-3xl my-2">
                <span className={earnedStars >= 1 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 2 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 3 ? 'text-amber-400' : 'text-slate-600'}>★</span>
              </div>
              <div className="bg-slate-800/90 rounded-xl p-3 my-3 text-xs text-left border border-slate-700 font-mono">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Distance Cleared:</span>
                  <span className="text-emerald-400 font-bold">{gameState.distanceMeters}m</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Highest Leap Combo:</span>
                  <span className="text-amber-400 font-bold">x{gameState.highestCombo}</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Total Score:</span>
                  <span className="text-white font-bold">{gameState.score} pts</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {gameState.levelIndex + 1 < JUMPER_LEVELS.length ? (
                  <button
                    onClick={() => handleSelectLevel(gameState.levelIndex + 1)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm transition"
                  >
                    Next Convoy ➔
                  </button>
                ) : (
                  <div className="text-xs text-amber-300 font-bold py-1">
                    🎉 You mastered every runaway highway convoy!
                  </div>
                )}
                <button
                  onClick={() =>
                    setGameState(
                      initJumperGame(
                        gameState.levelIndex,
                        gameState.unlockedLevels,
                        gameState.bestDistances
                      )
                    )
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Replay Convoy
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Levels Drawer */}
        {activeTab === 'levels' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-amber-400">Select Highway Convoy</h3>
                <button
                  onClick={() => setActiveTab('game')}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {JUMPER_LEVELS.map((lvl, idx) => {
                  const isLocked = idx + 1 > gameState.unlockedLevels;
                  const isCurrent = idx === gameState.levelIndex;
                  const bestDist = gameState.bestDistances[idx];

                  return (
                    <button
                      key={lvl.id}
                      disabled={isLocked}
                      onClick={() => handleSelectLevel(idx)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border text-left transition ${
                        isCurrent
                          ? 'bg-amber-500/20 border-amber-500 text-white'
                          : isLocked
                          ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200'
                      }`}
                    >
                      <div>
                        <div className="font-black text-sm flex items-center gap-1.5">
                          {isLocked ? '🔒' : '🚛'} {lvl.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{lvl.description}</div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        {bestDist > 0 ? (
                          <span className="text-emerald-400 font-bold">
                            {bestDist}m / {lvl.targetMeters}m
                          </span>
                        ) : isLocked ? (
                          <span className="text-slate-600">Locked</span>
                        ) : (
                          <span className="text-slate-400">0m</span>
                        )}
                      </div>
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
        {/* Left Thumb: Strafe Buttons */}
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
            ◀ STRAFE LEFT
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
            STRAFE RIGHT ▶
          </button>
        </div>

        {/* Right Thumb: Jump & Slide */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.slide = true;
              jumperSound.playSlide();
            }}
            onPointerUp={() => {
              inputRef.current.slide = false;
            }}
            onPointerLeave={() => {
              inputRef.current.slide = false;
            }}
            className="flex-1 py-3 bg-slate-800 active:bg-rose-700 text-rose-300 font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ▼ SLIDE
          </button>
          <button
            onPointerDown={() => {
              inputRef.current.jump = true;
              if (stateRef.current.player.jumpsRemaining === 2) {
                jumperSound.playJump();
              } else if (stateRef.current.player.jumpsRemaining === 1) {
                jumperSound.playDoubleJump();
              }
            }}
            onPointerUp={() => {
              inputRef.current.jump = false;
            }}
            onPointerLeave={() => {
              inputRef.current.jump = false;
            }}
            className="flex-1 py-3 bg-amber-500 active:bg-amber-400 text-slate-950 font-black text-sm rounded-xl border border-amber-400 active:scale-95 transition shadow-lg shadow-amber-900/40"
          >
            ▲ JUMP
          </button>
        </div>
      </div>
    </div>
  );
};

export default BarnyardTruckJumperContainer;

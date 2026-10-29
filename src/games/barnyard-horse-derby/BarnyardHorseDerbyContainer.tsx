import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  DerbyGameState,
  DerbyTrackId,
} from './logic/types';
import {
  createDerbyGame,
  triggerPlayerJump,
  switchPlayerLane,
  updateDerbyGame,
  TRACK_CONFIGS,
} from './logic/engine';
import { derbySound } from './systems/sound';

interface BarnyardHorseDerbyProps {
  onBack?: () => void;
}

export const BarnyardHorseDerbyContainer: React.FC<BarnyardHorseDerbyProps> = ({ onBack }) => {
  const [selectedTrack, setSelectedTrack] = useState<DerbyTrackId>('meadow-cup');
  const [gameState, setGameState] = useState<DerbyGameState>(() => createDerbyGame('meadow-cup'));
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<DerbyGameState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startNewRace = useCallback((trackId: DerbyTrackId) => {
    setSelectedTrack(trackId);
    const newState = createDerbyGame(trackId);
    setGameState(newState);
    derbySound.playWhinny();
  }, []);

  const handleJump = useCallback(() => {
    setGameState((prev) => {
      const next = triggerPlayerJump(prev);
      if (next.player.isJumping && !prev.player.isJumping) {
        derbySound.playJump();
        if (next.player.lastJumpGrade !== 'none') {
          derbySound.playJumpGrade(next.player.lastJumpGrade as 'ok' | 'great' | 'perfect');
        }
      }
      return next;
    });
  }, []);

  const handleLaneUp = useCallback(() => {
    setGameState((prev) => switchPlayerLane(prev, -1));
  }, []);

  const handleLaneDown = useCallback(() => {
    setGameState((prev) => switchPlayerLane(prev, 1));
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      derbySound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'Space' || e.code === 'ArrowRight') {
        e.preventDefault();
        handleJump();
      } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleLaneUp();
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleLaneDown();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        startNewRace(selectedTrack);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleJump, handleLaneUp, handleLaneDown, selectedTrack, startNewRace, toggleSound]);

  // Main game animation & physics loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updateDerbyGame(current, dt);

      // Process sound events
      if (next.events.length > 0) {
        next.events.forEach((evt) => {
          if (evt.type === 'jump_land') {
            derbySound.playGallop(1.2);
          } else if (evt.type === 'obstacle_hit') {
            derbySound.playStumble();
          } else if (evt.type === 'collect_item' && evt.itemType) {
            derbySound.playCollect(evt.itemType);
          } else if (evt.type === 'finish_race') {
            derbySound.playBugleFanfare();
          }
        });
      }

      if (next.status === 'racing') {
        derbySound.playGallop(next.player.speed / 18);
      }

      setGameState(next);
      renderCanvas(next);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  // Render canvas
  const renderCanvas = (state: DerbyGameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.45);
    if (state.track.id === 'sunset-championship') {
      skyGrad.addColorStop(0, '#f97316');
      skyGrad.addColorStop(0.5, '#fb923c');
      skyGrad.addColorStop(1, '#fed7aa');
    } else {
      skyGrad.addColorStop(0, '#38bdf8');
      skyGrad.addColorStop(1, '#bae6fd');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, width, height * 0.45);

    // Distant rolling hills
    const camX = state.player.distance;
    ctx.fillStyle = state.track.id === 'sunset-championship' ? '#b45309' : '#15803d';
    ctx.beginPath();
    ctx.moveTo(0, height * 0.45);
    for (let x = 0; x <= width; x += 30) {
      const hillY = height * 0.38 + Math.sin((x + camX * 2) * 0.005) * 22;
      ctx.lineTo(x, hillY);
    }
    ctx.lineTo(width, height * 0.45);
    ctx.closePath();
    ctx.fill();

    // Red Barns in background
    const barnOffset = ((camX * 0.4) % 600);
    const barnX = width - barnOffset;
    if (barnX > -80 && barnX < width + 80) {
      ctx.fillStyle = '#b91c1c';
      ctx.fillRect(barnX, height * 0.32, 60, 40);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(barnX - 5, height * 0.32);
      ctx.lineTo(barnX + 30, height * 0.25);
      ctx.lineTo(barnX + 65, height * 0.32);
      ctx.closePath();
      ctx.fill();
    }

    // Racetrack turf area
    const trackTopY = height * 0.45;
    const trackHeight = height * 0.45;
    const turfGrad = ctx.createLinearGradient(0, trackTopY, 0, height * 0.9);
    turfGrad.addColorStop(0, '#22c55e');
    turfGrad.addColorStop(1, '#16a34a');
    ctx.fillStyle = turfGrad;
    ctx.fillRect(0, trackTopY, width, trackHeight);

    // 3 Turf Lanes
    const laneHeight = trackHeight / 3;
    const laneYPositions = [
      trackTopY + laneHeight * 0.5,
      trackTopY + laneHeight * 1.5,
      trackTopY + laneHeight * 2.5,
    ];

    // White rail fences & lane dividers
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, trackTopY, width, trackHeight);

    // Dashed lane separators
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([16, 16]);
    ctx.lineDashOffset = -(camX * 12) % 32;
    [1, 2].forEach((laneIdx) => {
      const dividerY = trackTopY + laneHeight * laneIdx;
      ctx.beginPath();
      ctx.moveTo(0, dividerY);
      ctx.lineTo(width, dividerY);
      ctx.stroke();
    });
    ctx.setLineDash([]); // reset dash

    // Scale conversion: 1 meter = 14 pixels
    const meterPx = 14;
    const playerScreenX = width * 0.25;

    // Finish line
    const finishDist = state.track.totalDistance;
    const finishScreenX = playerScreenX + (finishDist - camX) * meterPx;
    if (finishScreenX > -50 && finishScreenX < width + 50) {
      // Checkerboard finish line
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(finishScreenX - 6, trackTopY, 12, trackHeight);
      ctx.fillStyle = '#000000';
      const boxSize = 10;
      for (let y = trackTopY; y < trackTopY + trackHeight; y += boxSize * 2) {
        ctx.fillRect(finishScreenX - 6, y, 6, boxSize);
        ctx.fillRect(finishScreenX, y + boxSize, 6, boxSize);
      }
      // Finish Banner
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(finishScreenX - 35, trackTopY - 26, 70, 22);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('FINISH', finishScreenX, trackTopY - 11);
    }

    // Draw Obstacles
    state.obstacles.forEach((obs) => {
      const obsScreenX = playerScreenX + (obs.distance - camX) * meterPx;
      if (obsScreenX < -60 || obsScreenX > width + 60) return;

      const obsY = laneYPositions[obs.lane];

      if (obs.type === 'water') {
        // Water hazard pond
        ctx.fillStyle = 'rgba(14, 165, 233, 0.85)';
        ctx.beginPath();
        ctx.ellipse(obsScreenX, obsY, 32, 14, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      } else if (obs.type === 'hay_bale') {
        // Round yellow hay bale
        ctx.fillStyle = obs.hit ? '#92400e' : '#facc15';
        ctx.beginPath();
        ctx.roundRect(obsScreenX - 16, obsY - 18, 32, 28, 6);
        ctx.fill();
        ctx.strokeStyle = '#ca8a04';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // White wooden steeplechase fence
        ctx.fillStyle = obs.hit ? '#94a3b8' : '#ffffff';
        ctx.fillRect(obsScreenX - 4, obsY - 22, 8, 36);
        ctx.fillRect(obsScreenX - 18, obsY - 18, 36, 6);
        ctx.fillRect(obsScreenX - 18, obsY - 6, 36, 6);
        ctx.strokeStyle = '#64748b';
        ctx.lineWidth = 1;
        ctx.strokeRect(obsScreenX - 18, obsY - 18, 36, 6);
      }
    });

    // Draw Collectibles
    state.collectibles.forEach((col) => {
      if (col.collected) return;
      const colScreenX = playerScreenX + (col.distance - camX) * meterPx;
      if (colScreenX < -40 || colScreenX > width + 40) return;

      const colY = laneYPositions[col.lane];

      ctx.save();
      ctx.translate(colScreenX, colY);
      const bob = Math.sin(Date.now() * 0.008 + col.distance) * 4;

      if (col.type === 'horseshoe') {
        // Golden horseshoe
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, bob, 9, Math.PI * 0.2, Math.PI * 0.8, true);
        ctx.stroke();
      } else if (col.type === 'carrot') {
        // Bright orange carrot
        ctx.fillStyle = '#ea580c';
        ctx.beginPath();
        ctx.moveTo(0, bob + 10);
        ctx.lineTo(-6, bob - 6);
        ctx.lineTo(6, bob - 6);
        ctx.closePath();
        ctx.fill();
        // Carrot greens
        ctx.fillStyle = '#22c55e';
        ctx.fillRect(-2, bob - 12, 4, 6);
      } else {
        // Golden apple
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.arc(0, bob, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#15803d';
        ctx.fillRect(-1, bob - 14, 3, 5);
      }
      ctx.restore();
    });

    // Helper to draw a running horse
    const drawHorse = (
      x: number,
      y: number,
      coatColor: string,
      maneColor: string,
      isJumping: boolean,
      jumpHeight: number,
      speed: number,
      isPlayer: boolean
    ) => {
      ctx.save();
      const currentY = y - jumpHeight * 36;
      ctx.translate(x, currentY);

      // Gallop cycle phase based on distance traveled
      const runCycle = (state.player.distance * 1.8) % (Math.PI * 2);
      const legTilt1 = isJumping ? 0.6 : Math.sin(runCycle) * 0.55;
      const legTilt2 = isJumping ? -0.4 : Math.cos(runCycle) * 0.55;

      // Dust puffs behind horse
      if (!isJumping && speed > 5) {
        ctx.fillStyle = 'rgba(217, 119, 6, 0.45)';
        for (let p = 0; p < 3; p++) {
          const puffX = -26 - p * 8 + Math.sin(Date.now() * 0.02 + p) * 4;
          const puffY = 12 + Math.cos(Date.now() * 0.02 + p) * 3;
          ctx.beginPath();
          ctx.arc(puffX, puffY, 4 + p * 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Horse body
      ctx.fillStyle = coatColor;
      ctx.beginPath();
      ctx.roundRect(-22, -10, 44, 20, 8);
      ctx.fill();

      // Horse neck & head
      ctx.beginPath();
      ctx.moveTo(14, -6);
      ctx.lineTo(26, -22);
      ctx.lineTo(34, -18);
      ctx.lineTo(20, 4);
      ctx.closePath();
      ctx.fill();

      // Horse muzzle & ears
      ctx.beginPath();
      ctx.arc(31, -20, 6, 0, Math.PI * 2);
      ctx.fill();
      // Ear
      ctx.beginPath();
      ctx.moveTo(25, -23);
      ctx.lineTo(27, -29);
      ctx.lineTo(30, -23);
      ctx.closePath();
      ctx.fill();

      // Mane
      ctx.fillStyle = maneColor;
      ctx.beginPath();
      ctx.moveTo(15, -8);
      ctx.lineTo(24, -20);
      ctx.lineTo(20, -18);
      ctx.lineTo(13, -4);
      ctx.closePath();
      ctx.fill();

      // Horse legs
      ctx.strokeStyle = coatColor;
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      // Forelegs
      ctx.beginPath();
      ctx.moveTo(14, 8);
      ctx.lineTo(16 + legTilt1 * 12, 22);
      ctx.stroke();

      // Hind legs
      ctx.beginPath();
      ctx.moveTo(-14, 8);
      ctx.lineTo(-12 + legTilt2 * 12, 22);
      ctx.stroke();

      // Jockey (rider)
      ctx.fillStyle = isPlayer ? '#0284c7' : '#dc2626'; // Blue jockey jersey for player, red for rivals
      ctx.beginPath();
      ctx.roundRect(-4, -22, 12, 14, 3);
      ctx.fill();

      // Jockey helmet
      ctx.fillStyle = isPlayer ? '#facc15' : '#ffffff';
      ctx.beginPath();
      ctx.arc(2, -26, 5, 0, Math.PI * 2);
      ctx.fill();

      // Tail
      ctx.fillStyle = maneColor;
      ctx.beginPath();
      ctx.moveTo(-22, -4);
      ctx.quadraticCurveTo(-34, -2, -32 + Math.sin(runCycle) * 6, 8);
      ctx.lineTo(-20, 4);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    };

    // Draw Rivals
    state.rivals.forEach((rival) => {
      const rivalScreenX = playerScreenX + (rival.distance - camX) * meterPx;
      if (rivalScreenX < -60 || rivalScreenX > width + 60) return;

      const rivalY = laneYPositions[rival.lane];
      drawHorse(
        rivalScreenX,
        rivalY,
        rival.color,
        rival.maneColor,
        rival.isJumping,
        rival.isJumping ? 0.9 : 0,
        rival.speed,
        false
      );
    });

    // Draw Player Horse
    const playerY = trackTopY + laneHeight * (state.player.laneY + 0.5);
    drawHorse(
      playerScreenX,
      playerY,
      '#b45309', // rich chestnut coat
      '#fde047', // golden blonde mane
      state.player.isJumping,
      state.player.jumpY,
      state.player.speed,
      true
    );

    // Jump Grade Floating Badge
    if (state.player.gradeTimer > 0 && state.player.lastJumpGrade !== 'none') {
      ctx.save();
      const alpha = Math.min(1, state.player.gradeTimer * 1.5);
      ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.75})`;
      ctx.font = 'bold 22px sans-serif';
      ctx.textAlign = 'center';
      const gradeText =
        state.player.lastJumpGrade === 'perfect'
          ? '🌟 PERFECT JUMP! +250'
          : state.player.lastJumpGrade === 'great'
          ? '⭐ GREAT JUMP! +120'
          : '👍 OK JUMP +50';
      const badgeY = playerY - 45 - (1.2 - state.player.gradeTimer) * 20;

      ctx.fillStyle = state.player.lastJumpGrade === 'perfect' ? '#fbbf24' : '#67e8f9';
      ctx.fillText(gradeText, playerScreenX, badgeY);
      ctx.restore();
    }

    // Countdown 3-2-1 overlay
    if (state.status === 'countdown') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 64px sans-serif';
      ctx.textAlign = 'center';
      const countVal = Math.ceil(state.countdownTimer);
      ctx.fillText(countVal > 0 ? String(countVal) : 'GO!', width * 0.5, height * 0.52);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Tap JUMP to clear hurdles & change lanes!', width * 0.5, height * 0.62);
    }
  };

  return (
    <div
      className="relative flex flex-col items-center justify-between w-full h-full max-w-4xl mx-auto select-none bg-slate-900 text-white font-sans overflow-hidden"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD */}
      <header className="w-full px-4 py-2 bg-slate-950/80 backdrop-blur border-b border-slate-800 flex items-center justify-between z-10 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-semibold transition"
            >
              ← Hub
            </button>
          )}
          <div className="flex items-center gap-1 font-bold text-amber-400">
            <span>🐎</span>
            <span className="hidden sm:inline">Track:</span>
            <select
              value={selectedTrack}
              onChange={(e) => startNewRace(e.target.value as DerbyTrackId)}
              className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-0.5 text-xs font-semibold cursor-pointer"
            >
              <option value="meadow-cup">Green Meadow (600m)</option>
              <option value="autumn-steeplechase">Autumn Pasture (900m)</option>
              <option value="sunset-championship">Sunset Derby (1200m)</option>
            </select>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex-1 max-w-xs mx-3 hidden md:block">
          <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-bold">
            <span>START</span>
            <span>{Math.floor(gameState.player.distance)}m / {gameState.track.totalDistance}m</span>
          </div>
          <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-75"
              style={{
                width: `${Math.min(100, (gameState.player.distance / gameState.track.totalDistance) * 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Stats & Audio */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-amber-300 font-bold">
            <span>🧲</span>
            <span>{gameState.horseshoesCollected}</span>
          </div>
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <span>🏆</span>
            <span>{gameState.score}</span>
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

      {/* Stamina & Speed Sub-HUD */}
      <div className="w-full px-4 py-1.5 bg-slate-900/90 border-b border-slate-800/60 flex items-center justify-between text-xs font-semibold">
        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <span className="text-emerald-400 text-[11px]">STAMINA:</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className={`h-full transition-all duration-75 ${
                gameState.player.stamina < 25 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'
              }`}
              style={{ width: `${gameState.player.stamina}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-300 text-xs">
          <div>
            SPEED: <span className="font-bold text-cyan-400">{Math.round(gameState.player.speed * 2.2)} MPH</span>
          </div>
          <div>
            LANE: <span className="font-bold text-amber-300">{gameState.player.targetLane === 0 ? 'TOP' : gameState.player.targetLane === 1 ? 'MID' : 'BOT'}</span>
          </div>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={450}
          className="w-full h-full max-h-[70vh] object-contain block"
        />

        {/* Finish Podium Overlay */}
        {gameState.status === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="text-5xl mb-2">
              {gameState.finalRank === 1 ? '🥇' : gameState.finalRank === 2 ? '🥈' : '🥉'}
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-1">
              {gameState.finalRank === 1
                ? 'CHAMPION OF THE DERBY!'
                : `${gameState.finalRank === 2 ? '2ND' : '3RD'} PLACE FINISH!`}
            </h2>
            <p className="text-slate-300 text-sm max-w-md mb-4">
              {gameState.finalRank === 1
                ? 'Magnificent gallop! You cleared the hurdles, conserved your stamina, and crossed the wire first!'
                : 'Great steeplechase effort! Time your hurdle jumps for speed boosts to claim the Gold trophy next round!'}
            </p>

            <div className="grid grid-cols-3 gap-3 bg-slate-900/90 border border-slate-800 rounded-xl p-3 w-full max-w-sm mb-5 text-xs">
              <div>
                <div className="text-slate-400">TIME</div>
                <div className="text-base font-bold text-white">{gameState.elapsedTime.toFixed(1)}s</div>
              </div>
              <div>
                <div className="text-slate-400">HORSESHOES</div>
                <div className="text-base font-bold text-amber-400">{gameState.horseshoesCollected}</div>
              </div>
              <div>
                <div className="text-slate-400">TOTAL SCORE</div>
                <div className="text-base font-bold text-emerald-400">{gameState.score}</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => startNewRace(selectedTrack)}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
              >
                🔄 Race Again
              </button>
              {selectedTrack !== 'sunset-championship' && (
                <button
                  onClick={() =>
                    startNewRace(
                      selectedTrack === 'meadow-cup' ? 'autumn-steeplechase' : 'sunset-championship'
                    )
                  }
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
                >
                  🏆 Next Derby Track →
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tactile Mobile Controls Bar */}
      <footer className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 z-10">
        {/* Lane Switch Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleLaneUp}
            disabled={gameState.status !== 'racing'}
            className="w-14 h-12 sm:w-16 sm:h-14 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 disabled:opacity-40 rounded-xl font-extrabold text-lg flex items-center justify-center border border-slate-700 shadow-md transition active:scale-95"
            aria-label="Switch to upper lane"
          >
            ⬆️
          </button>
          <button
            onClick={handleLaneDown}
            disabled={gameState.status !== 'racing'}
            className="w-14 h-12 sm:w-16 sm:h-14 bg-slate-800 hover:bg-slate-700 active:bg-amber-600 disabled:opacity-40 rounded-xl font-extrabold text-lg flex items-center justify-center border border-slate-700 shadow-md transition active:scale-95"
            aria-label="Switch to lower lane"
          >
            ⬇️
          </button>
        </div>

        {/* Jump Button */}
        <button
          onClick={handleJump}
          disabled={gameState.status !== 'racing' || gameState.player.isJumping}
          className="flex-1 max-w-xs h-12 sm:h-14 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:from-emerald-700 active:to-teal-600 disabled:opacity-40 rounded-xl font-extrabold text-base sm:text-lg flex items-center justify-center gap-2 shadow-lg transition active:scale-95 text-white"
        >
          <span>🐎 JUMP HURDLE</span>
          <span className="text-xs font-normal opacity-80 hidden sm:inline">(Space)</span>
        </button>
      </footer>
    </div>
  );
};

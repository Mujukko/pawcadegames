import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initGame,
  stepStuntGame,
  resetToCheckpoint,
  calculateStars,
} from './logic/engine';
import { StuntGameState, ControlInput } from './logic/types';
import { ALL_TRACKS } from './logic/tracks';
import { stuntSound } from './systems/sound';

export const TractorStuntTrialsContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<StuntGameState>(() => {
    // Load persisted best times and unlocked tracks
    let unlocked = 1;
    let bests = [999, 999, 999];
    if (typeof window !== 'undefined') {
      try {
        const savedTracks = localStorage.getItem('pawcade_tractor_unlocked');
        if (savedTracks) unlocked = parseInt(savedTracks, 10) || 1;
        const savedBests = localStorage.getItem('pawcade_tractor_bests');
        if (savedBests) bests = JSON.parse(savedBests);
      } catch {
        // Safe catch
      }
    }
    return initGame(0, unlocked, bests);
  });

  const stateRef = useRef<StuntGameState>(gameState);
  stateRef.current = gameState;

  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'game' | 'tracks'>('game');

  // Input states
  const inputRef = useRef<ControlInput>({
    throttle: 0,
    brake: 0,
    tiltLeft: false,
    tiltRight: false,
  });

  // Sound toggle
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    stuntSound.setMuted(nextMuted);
  };

  // Switch Track
  const handleSelectTrack = (trackIndex: number) => {
    if (trackIndex + 1 > stateRef.current.unlockedTracks) return;
    const newState = initGame(
      trackIndex,
      stateRef.current.unlockedTracks,
      stateRef.current.trackBestTimes
    );
    setGameState(newState);
    setActiveTab('game');
  };

  // Keyboard handlers
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        inputRef.current.throttle = 1;
        stuntSound.startEngine();
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        inputRef.current.brake = 1;
      }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        inputRef.current.tiltLeft = true;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.tiltRight = true;
      }
      if (e.code === 'KeyR') {
        if (stateRef.current.status === 'crashed') {
          const restarted = resetToCheckpoint(stateRef.current);
          setGameState(restarted);
        } else {
          const fresh = initGame(
            stateRef.current.trackIndex,
            stateRef.current.unlockedTracks,
            stateRef.current.trackBestTimes
          );
          setGameState(fresh);
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        inputRef.current.throttle = 0;
      }
      if (['ArrowDown', 'KeyS'].includes(e.code)) {
        inputRef.current.brake = 0;
      }
      if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        inputRef.current.tiltLeft = false;
      }
      if (['ArrowRight', 'KeyD'].includes(e.code)) {
        inputRef.current.tiltRight = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      stuntSound.stopEngine();
    };
  }, []);

  // Main Game Loop & Canvas Rendering
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let cameraX = 100;
    let cameraY = 350;

    const renderLoop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      const currentState = stateRef.current;
      const prevStatus = currentState.status;
      const prevFlips = currentState.flipsCount.backflips + currentState.flipsCount.frontflips;

      const nextState = stepStuntGame(currentState, inputRef.current, dt);

      // Sound triggers
      if (nextState.status === 'crashed' && prevStatus !== 'crashed') {
        stuntSound.playCrash();
      } else if (nextState.status === 'finished' && prevStatus !== 'finished') {
        stuntSound.playVictory();
        // Persist best time
        try {
          localStorage.setItem('pawcade_tractor_unlocked', String(nextState.unlockedTracks));
          localStorage.setItem('pawcade_tractor_bests', JSON.stringify(nextState.trackBestTimes));
        } catch {
          // Safe catch
        }
      }

      const totalFlips = nextState.flipsCount.backflips + nextState.flipsCount.frontflips;
      if (totalFlips > prevFlips) {
        stuntSound.playFlipBonus();
      }

      // Update engine audio pitch
      if (nextState.status === 'playing') {
        const speedRatio = Math.min(1, Math.abs(nextState.tractor.vx) / 500);
        stuntSound.updateEnginePitch(speedRatio, inputRef.current.throttle);
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
          const track = ALL_TRACKS[nextState.trackIndex];

          // Smooth camera tracking
          const targetCamX = nextState.tractor.x + nextState.tractor.vx * 0.35;
          const targetCamY = nextState.tractor.y;
          cameraX += (targetCamX - cameraX) * 0.12;
          cameraY += (targetCamY - cameraY) * 0.1;

          // Sky gradient
          const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
          skyGrad.addColorStop(0, '#60a5fa'); // Vibrant sky blue
          skyGrad.addColorStop(0.65, '#bae6fd');
          skyGrad.addColorStop(1, '#fef08a'); // Warm pasture horizon
          ctx.fillStyle = skyGrad;
          ctx.fillRect(0, 0, width, height);

          // Parallax Hills
          ctx.save();
          const hillOffsetX = (cameraX * 0.2) % 400;
          ctx.fillStyle = '#86efac'; // distant green hills
          ctx.beginPath();
          ctx.moveTo(-100, height);
          for (let x = -100; x < width + 100; x += 80) {
            const h = Math.sin((x + hillOffsetX) * 0.015) * 45 + 130;
            ctx.lineTo(x, height - h);
          }
          ctx.lineTo(width + 100, height);
          ctx.closePath();
          ctx.fill();
          ctx.restore();

          // Camera world transformation
          ctx.save();
          ctx.translate(width * 0.38 - cameraX, height * 0.65 - cameraY);

          // Draw Checkpoints
          track.checkpoints.forEach(cp => {
            ctx.save();
            ctx.translate(cp.x, cp.y);
            // Post
            ctx.fillStyle = '#78350f';
            ctx.fillRect(-3, -40, 6, 40);
            // Flag
            ctx.fillStyle = cp.passed ? '#10b981' : '#f59e0b';
            ctx.beginPath();
            ctx.moveTo(3, -40);
            ctx.lineTo(26, -30);
            ctx.lineTo(3, -20);
            ctx.closePath();
            ctx.fill();
            // Star on passed
            if (cp.passed) {
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 10px sans-serif';
              ctx.fillText('★', 8, -27);
            }
            ctx.restore();
          });

          // Draw Finish Gate
          ctx.save();
          ctx.translate(track.finishX, track.finishY);
          // Gate posts
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(-6, -90, 8, 90);
          ctx.fillRect(20, -90, 8, 90);
          // Arch banner
          ctx.fillStyle = '#ef4444';
          ctx.fillRect(-10, -95, 42, 20);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 9px sans-serif';
          ctx.fillText('FINISH', -5, -81);
          // Chequered flag ribbon
          for (let i = 0; i < 4; i++) {
            ctx.fillStyle = i % 2 === 0 ? '#ffffff' : '#000000';
            ctx.fillRect(i * 7 - 4, -75, 7, 6);
          }
          ctx.restore();

          // Draw Hazards (Water pits, springboards, speed pads, TNT)
          track.hazards.forEach(hazard => {
            if (hazard.type === 'water_pit') {
              ctx.fillStyle = '#38bdf8';
              ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
              // Animated foam
              ctx.strokeStyle = '#ffffff';
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (let wx = hazard.x; wx <= hazard.x + hazard.width; wx += 12) {
                const wy = hazard.y + Math.sin(wx * 0.2 + time * 0.005) * 3;
                ctx.lineTo(wx, wy);
              }
              ctx.stroke();
            } else if (hazard.type === 'springboard') {
              ctx.fillStyle = '#f59e0b';
              ctx.fillRect(hazard.x, hazard.y, hazard.width, 6);
              // Spring coils
              ctx.strokeStyle = '#94a3b8';
              ctx.lineWidth = 3;
              ctx.strokeRect(hazard.x + 8, hazard.y + 6, hazard.width - 16, hazard.height - 6);
            } else if (hazard.type === 'speed_boost') {
              ctx.fillStyle = '#06b6d4';
              ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
              // Chevron arrows
              ctx.fillStyle = '#ffffff';
              ctx.beginPath();
              ctx.moveTo(hazard.x + 10, hazard.y + hazard.height);
              ctx.lineTo(hazard.x + 22, hazard.y + hazard.height / 2);
              ctx.lineTo(hazard.x + 10, hazard.y);
              ctx.lineTo(hazard.x + 20, hazard.y);
              ctx.lineTo(hazard.x + 32, hazard.y + hazard.height / 2);
              ctx.lineTo(hazard.x + 20, hazard.y + hazard.height);
              ctx.closePath();
              ctx.fill();
            } else if (hazard.type === 'tnt_barrel') {
              ctx.fillStyle = hazard.triggered ? '#475569' : '#dc2626';
              ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
              ctx.fillStyle = '#ffffff';
              ctx.font = 'bold 11px monospace';
              ctx.fillText('TNT', hazard.x + 4, hazard.y + 20);
            }
          });

          // Draw Terrain Meshes
          track.terrain.forEach(seg => {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(seg.x1, seg.y1);
            ctx.lineTo(seg.x2, seg.y2);
            ctx.lineTo(seg.x2, seg.y2 + 350);
            ctx.lineTo(seg.x1, seg.y1 + 350);
            ctx.closePath();

            if (seg.surfaceType === 'wood') {
              ctx.fillStyle = '#b45309'; // Rich timber
              ctx.fill();
              // Top plank
              ctx.strokeStyle = '#78350f';
              ctx.lineWidth = 5;
              ctx.beginPath();
              ctx.moveTo(seg.x1, seg.y1);
              ctx.lineTo(seg.x2, seg.y2);
              ctx.stroke();
            } else {
              // Deep farm soil
              ctx.fillStyle = '#713f12';
              ctx.fill();
              // Lush top grass strip
              ctx.strokeStyle = '#22c55e';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.moveTo(seg.x1, seg.y1);
              ctx.lineTo(seg.x2, seg.y2);
              ctx.stroke();
            }
            ctx.restore();
          });

          // Draw Tractor
          const tractor = nextState.tractor;
          ctx.save();
          ctx.translate(tractor.x, tractor.y);
          ctx.rotate(tractor.angle);

          // Exhaust Smoke Particles when driving
          if (inputRef.current.throttle > 0 && Math.random() < 0.4) {
            ctx.fillStyle = 'rgba(200, 200, 200, 0.6)';
            ctx.beginPath();
            ctx.arc(-22, -28 - Math.random() * 8, 4 + Math.random() * 4, 0, Math.PI * 2);
            ctx.fill();
          }

          // Chassis Body (Cherry Red Tractor)
          ctx.fillStyle = '#dc2626';
          ctx.beginPath();
          ctx.roundRect(-24, -14, 48, 20, 6);
          ctx.fill();

          // Engine Hood / Grille
          ctx.fillStyle = '#991b1b';
          ctx.beginPath();
          ctx.roundRect(8, -12, 16, 16, 3);
          ctx.fill();
          ctx.fillStyle = '#facc15'; // Golden front badge
          ctx.fillRect(20, -8, 4, 8);

          // Exhaust Pipe
          ctx.fillStyle = '#475569';
          ctx.fillRect(-18, -26, 4, 14);
          ctx.fillRect(-18, -28, 7, 3);

          // Steering Wheel
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(0, -18, 2, 8);
          ctx.beginPath();
          ctx.arc(0, -18, 5, 0, Math.PI * 2);
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Driver (Cute Barnyard Piggy in Overalls)
          ctx.fillStyle = '#f472b6'; // Pig skin
          ctx.beginPath();
          ctx.arc(-8, -22, 10, 0, Math.PI * 2);
          ctx.fill();

          // Straw Hat
          ctx.fillStyle = '#fde047';
          ctx.fillRect(-16, -30, 16, 4);
          ctx.fillRect(-12, -36, 8, 6);

          // Cute snout & eyes
          ctx.fillStyle = '#f43f5e';
          ctx.beginPath();
          ctx.ellipse(-4, -20, 4, 3, 0, 0, Math.PI * 2);
          ctx.fill();

          // Eye (wide in midair, happy on ground)
          ctx.fillStyle = '#000000';
          if (!tractor.isGrounded) {
            ctx.beginPath();
            ctx.arc(-6, -24, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(-6, -24, 1.8, 0, Math.PI * 2);
            ctx.fill();
          }

          // Blue Overalls
          ctx.fillStyle = '#2563eb';
          ctx.fillRect(-14, -12, 12, 10);

          ctx.restore(); // Exit tractor chassis rotation

          // Draw Wheels (Positioned in world space with rotation)
          // Rear Wheel (Large rubber tire)
          ctx.save();
          ctx.translate(tractor.rearWheel.x, tractor.rearWheel.y);
          ctx.rotate(time * 0.005 * (tractor.vx / 30));
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(0, 0, tractor.rearWheel.radius, 0, Math.PI * 2);
          ctx.fill();
          // Yellow Hubcap & Spokes
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#facc15';
          ctx.lineWidth = 3;
          for (let sp = 0; sp < 4; sp++) {
            ctx.rotate(Math.PI / 2);
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, tractor.rearWheel.radius - 2);
            ctx.stroke();
          }
          ctx.restore();

          // Front Wheel (Smaller guide tire)
          ctx.save();
          ctx.translate(tractor.frontWheel.x, tractor.frontWheel.y);
          ctx.rotate(time * 0.005 * (tractor.vx / 20));
          ctx.fillStyle = '#18181b';
          ctx.beginPath();
          ctx.arc(0, 0, tractor.frontWheel.radius, 0, Math.PI * 2);
          ctx.fill();
          // Yellow Hubcap
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Floating Texts (Flips, Checkpoints, TNT, Crashes)
          nextState.floatingTexts.forEach(ft => {
            ctx.save();
            ctx.globalAlpha = Math.max(0, ft.alpha);
            ctx.fillStyle = ft.color;
            ctx.font = `bold ${Math.round(15 * ft.scale)}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
          });

          ctx.restore(); // Exit camera transform
        }
      }

      animId = requestAnimationFrame(renderLoop);
    };

    animId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const track = ALL_TRACKS[gameState.trackIndex];
  const finalCalculatedTime = Math.max(0, gameState.elapsedTime - gameState.timeBonus);
  const earnedStars = calculateStars(gameState.trackIndex, finalCalculatedTime);

  return (
    <div className="relative w-full h-[600px] max-w-4xl mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-2xl flex flex-col select-none touch-none">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white z-20">
        <div className="flex items-center gap-2">
          <span className="text-xl">🚜</span>
          <div>
            <h1 className="text-sm font-black tracking-wide text-amber-400">
              {track.name}
            </h1>
            <p className="text-[11px] text-slate-400">Track {gameState.trackIndex + 1} of 3</p>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">TIME: </span>
            <span className="font-bold text-white">{gameState.elapsedTime.toFixed(1)}s</span>
            {gameState.timeBonus > 0 && (
              <span className="text-emerald-400 font-black ml-1">
                (-{gameState.timeBonus.toFixed(1)}s)
              </span>
            )}
          </div>
          <div className="hidden sm:flex bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
            <span className="text-slate-400">FLIPS: </span>
            <span className="font-bold text-emerald-400">
              {gameState.flipsCount.backflips + gameState.flipsCount.frontflips}
            </span>
          </div>
          {gameState.trackBestTimes[gameState.trackIndex] < 999 && (
            <div className="hidden md:flex bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700">
              <span className="text-slate-400">BEST: </span>
              <span className="font-bold text-amber-400">
                {gameState.trackBestTimes[gameState.trackIndex].toFixed(1)}s
              </span>
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab(activeTab === 'tracks' ? 'game' : 'tracks')}
            className="px-2.5 py-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg transition"
          >
            {activeTab === 'tracks' ? 'Play' : 'Tracks'}
          </button>
          <button
            onClick={toggleMute}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition text-sm"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
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
          height={500}
          className="w-full h-full object-cover"
        />

        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10 pointer-events-none">
            <div className="bg-slate-900/90 border border-amber-500/50 p-6 rounded-2xl text-center max-w-sm shadow-xl">
              <div className="text-4xl mb-2 animate-bounce">🚜</div>
              <h2 className="text-xl font-black text-amber-400 mb-1">{track.name}</h2>
              <p className="text-xs text-slate-300 mb-4">{track.description}</p>
              <div className="text-xs bg-slate-800 p-2.5 rounded-lg text-slate-300 mb-4 text-left">
                <div className="font-bold text-emerald-400 mb-1">🎮 CONTROLS:</div>
                <div>• Gas / Brake: W/S or Up/Down Arrows</div>
                <div>• Air Tilt: A/D or Left/Right Arrows</div>
                <div>• Stunt Flips: Do 360° flips for -0.5s bonus!</div>
              </div>
              <div className="text-sm font-bold text-amber-300 animate-pulse">
                Press Gas or Tap Right to Start!
              </div>
            </div>
          </div>
        )}

        {/* Crashed Modal */}
        {gameState.status === 'crashed' && (
          <div className="absolute inset-0 bg-red-950/60 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-red-500/50 p-6 rounded-2xl text-center max-w-xs shadow-2xl">
              <div className="text-4xl mb-2">💥</div>
              <h2 className="text-xl font-black text-red-400 mb-1">TRACTOR CRASHED!</h2>
              <p className="text-xs text-slate-300 mb-4">
                Watch your balance and avoid landing on the driver's head!
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setGameState(resetToCheckpoint(stateRef.current))}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-sm transition"
                >
                  Restart from Checkpoint (R)
                </button>
                <button
                  onClick={() =>
                    setGameState(
                      initGame(
                        gameState.trackIndex,
                        gameState.unlockedTracks,
                        gameState.trackBestTimes
                      )
                    )
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Restart Track
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Finished / Victory Modal */}
        {gameState.status === 'finished' && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-sm flex flex-col items-center justify-center text-white z-10">
            <div className="bg-slate-900 border border-amber-500/60 p-6 rounded-2xl text-center max-w-sm shadow-2xl">
              <div className="text-3xl mb-1">🏁</div>
              <h2 className="text-2xl font-black text-amber-400 mb-1">COURSE FINISHED!</h2>
              {/* Star Rating */}
              <div className="flex justify-center gap-2 text-3xl my-2">
                <span className={earnedStars >= 1 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 2 ? 'text-amber-400' : 'text-slate-600'}>★</span>
                <span className={earnedStars >= 3 ? 'text-amber-400' : 'text-slate-600'}>★</span>
              </div>
              <div className="bg-slate-800/90 rounded-xl p-3 my-3 text-xs text-left border border-slate-700 font-mono">
                <div className="flex justify-between py-0.5">
                  <span className="text-slate-400">Raw Time:</span>
                  <span className="text-white font-bold">{gameState.elapsedTime.toFixed(2)}s</span>
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-emerald-400">Stunt Flip Bonuses:</span>
                  <span className="text-emerald-400 font-bold">
                    -{gameState.timeBonus.toFixed(1)}s (
                    {gameState.flipsCount.backflips + gameState.flipsCount.frontflips} flips)
                  </span>
                </div>
                <div className="border-t border-slate-700 mt-1 pt-1 flex justify-between text-sm font-black">
                  <span className="text-amber-300">Final Time:</span>
                  <span className="text-amber-400">{finalCalculatedTime.toFixed(2)}s</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {gameState.trackIndex + 1 < ALL_TRACKS.length ? (
                  <button
                    onClick={() => handleSelectTrack(gameState.trackIndex + 1)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm transition"
                  >
                    Next Track ➔
                  </button>
                ) : (
                  <div className="text-xs text-amber-300 font-bold py-1">
                    🎉 You conquered all pasture stunt tracks!
                  </div>
                )}
                <button
                  onClick={() =>
                    setGameState(
                      initGame(
                        gameState.trackIndex,
                        gameState.unlockedTracks,
                        gameState.trackBestTimes
                      )
                    )
                  }
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs transition"
                >
                  Replay Track
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tracks Selector Drawer Modal */}
        {activeTab === 'tracks' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-20">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-5 shadow-2xl">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-black text-amber-400">Select Stunt Track</h3>
                <button
                  onClick={() => setActiveTab('game')}
                  className="text-slate-400 hover:text-white text-lg font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex flex-col gap-3">
                {ALL_TRACKS.map((t, idx) => {
                  const isLocked = idx + 1 > gameState.unlockedTracks;
                  const isCurrent = idx === gameState.trackIndex;
                  const bestTime = gameState.trackBestTimes[idx];

                  return (
                    <button
                      key={t.id}
                      disabled={isLocked}
                      onClick={() => handleSelectTrack(idx)}
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
                          {isLocked ? '🔒' : '🚜'} {t.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{t.description}</div>
                      </div>
                      <div className="text-right font-mono text-xs">
                        {bestTime < 999 ? (
                          <span className="text-emerald-400 font-bold">{bestTime.toFixed(1)}s</span>
                        ) : isLocked ? (
                          <span className="text-slate-600">Locked</span>
                        ) : (
                          <span className="text-slate-400">--:--</span>
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

      {/* Tactile Mobile Touch Controls (Bottom Dock) */}
      <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900/95 border-t border-slate-800 z-10">
        {/* Left Hand: Air Tilt / Lean Controls */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.tiltLeft = true;
            }}
            onPointerUp={() => {
              inputRef.current.tiltLeft = false;
            }}
            onPointerLeave={() => {
              inputRef.current.tiltLeft = false;
            }}
            className="flex-1 py-3 bg-slate-800 active:bg-amber-600 text-white font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            ↺ TILT LEFT
          </button>
          <button
            onPointerDown={() => {
              inputRef.current.tiltRight = true;
            }}
            onPointerUp={() => {
              inputRef.current.tiltRight = false;
            }}
            onPointerLeave={() => {
              inputRef.current.tiltRight = false;
            }}
            className="flex-1 py-3 bg-slate-800 active:bg-amber-600 text-white font-black text-sm rounded-xl border border-slate-700 active:scale-95 transition"
          >
            TILT RIGHT ↻
          </button>
        </div>

        {/* Right Hand: Drive Throttle & Brake */}
        <div className="flex gap-2">
          <button
            onPointerDown={() => {
              inputRef.current.brake = 1;
            }}
            onPointerUp={() => {
              inputRef.current.brake = 0;
            }}
            onPointerLeave={() => {
              inputRef.current.brake = 0;
            }}
            className="flex-1 py-3 bg-rose-900/60 active:bg-rose-700 text-rose-200 font-black text-sm rounded-xl border border-rose-800/80 active:scale-95 transition"
          >
            BRAKE
          </button>
          <button
            onPointerDown={() => {
              inputRef.current.throttle = 1;
              stuntSound.startEngine();
            }}
            onPointerUp={() => {
              inputRef.current.throttle = 0;
            }}
            onPointerLeave={() => {
              inputRef.current.throttle = 0;
            }}
            className="flex-1 py-3 bg-emerald-600 active:bg-emerald-500 text-slate-950 font-black text-sm rounded-xl border border-emerald-500 active:scale-95 transition shadow-lg shadow-emerald-900/40"
          >
            GAS ➔
          </button>
        </div>
      </div>
    </div>
  );
};

export default TractorStuntTrialsContainer;

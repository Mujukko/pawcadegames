import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  FrogGameState,
} from './logic/types';
import {
  createFrogGame,
  hopFrog,
  flickTongue,
  updateFrogGame,
  POND_ZONES,
} from './logic/engine';
import { frogSound } from './systems/sound';

interface BarnyardFrogHopProps {
  onBack?: () => void;
}

export const BarnyardFrogHopContainer: React.FC<BarnyardFrogHopProps> = ({ onBack }) => {
  const [currentZone, setCurrentZone] = useState<number>(0);
  const [gameState, setGameState] = useState<FrogGameState>(() => createFrogGame(0));
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<FrogGameState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const startZone = useCallback((zoneIdx: number) => {
    setCurrentZone(zoneIdx);
    const newState = createFrogGame(zoneIdx);
    setGameState(newState);
    frogSound.playCroak();
  }, []);

  const handleHop = useCallback((dir: 'up' | 'left' | 'right' | 'down') => {
    setGameState((prev) => {
      const next = hopFrog(prev, dir);
      if (next.player.isJumping && !prev.player.isJumping) {
        frogSound.playHop();
      }
      return next;
    });
  }, []);

  const handleTongue = useCallback(() => {
    setGameState((prev) => {
      const next = flickTongue(prev);
      if (next.events.some((e) => e.type === 'catch_fly')) {
        frogSound.playCatchFly();
      } else {
        frogSound.playTongue();
      }
      return next;
    });
  }, []);

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      frogSound.setMuted(next);
      return next;
    });
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleHop('up');
      } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        handleHop('down');
      } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        e.preventDefault();
        handleHop('left');
      } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        e.preventDefault();
        handleHop('right');
      } else if (e.code === 'Space') {
        e.preventDefault();
        handleTongue();
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        startZone(currentZone);
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        toggleSound();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleHop, handleTongue, currentZone, startZone, toggleSound]);

  // Main animation loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updateFrogGame(current, dt);

      if (next.events.length > 0) {
        next.events.forEach((evt) => {
          if (evt.type === 'splash_water') frogSound.playSplash();
          else if (evt.type === 'land_pad') frogSound.playCroak();
          else if (evt.type === 'victory_crossing') frogSound.playVictory();
        });
      }

      setGameState(next);
      renderCanvas(next);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderCanvas = (state: FrogGameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // River Water Background with ripple highlights
    const waterGrad = ctx.createLinearGradient(0, 0, 0, height);
    waterGrad.addColorStop(0, '#0284c7'); // deep pond blue
    waterGrad.addColorStop(0.5, '#0ea5e9');
    waterGrad.addColorStop(1, '#0369a1');
    ctx.fillStyle = waterGrad;
    ctx.fillRect(0, 0, width, height);

    // Gentle animated wave ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    for (let y = 100; y < 500; y += 45) {
      ctx.beginPath();
      const waveOffset = Math.sin(Date.now() * 0.002 + y) * 20;
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(200 + waveOffset, y - 6, 600 - waveOffset, y + 6, width, y);
      ctx.stroke();
    }

    // Top Goal Bank (Finish Meadow)
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, width, 70);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 60, width, 10);
    // Goal flag text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 VICTORY POND BANK 🏆', width * 0.5, 40);

    // Bottom Starting Bank
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 520, width, 80);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(0, 515, width, 10);

    // Reeds & Cattails on banks
    for (let x = 20; x < width; x += 60) {
      ctx.fillStyle = '#166534';
      ctx.fillRect(x, 500, 4, 30);
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(x + 2, 495, 5, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Render Lily Pads & Logs
    state.pads.forEach((pad) => {
      ctx.save();
      ctx.translate(pad.x, pad.y);

      if (pad.type === 'drifting_log' && pad.width && pad.height) {
        // Brown drifting wooden log
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.roundRect(-pad.width * 0.5, -pad.height * 0.5, pad.width, pad.height, 8);
        ctx.fill();
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        ctx.stroke();
        // Wood grain rings
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-pad.width * 0.3, -4);
        ctx.lineTo(pad.width * 0.3, -4);
        ctx.stroke();
      } else {
        // Lily pad
        const alpha = pad.type === 'sinking' ? Math.max(0.2, pad.sinkTimer / 1.6) : 1;
        ctx.globalAlpha = alpha;

        // Lily pad shadow in water
        ctx.fillStyle = 'rgba(2, 44, 34, 0.4)';
        ctx.beginPath();
        ctx.arc(2, 4, pad.radius, 0, Math.PI * 2);
        ctx.fill();

        // Round Green Pad with notch cut-out
        ctx.fillStyle = pad.type === 'sinking' ? '#e11d48' : '#22c55e';
        ctx.beginPath();
        ctx.arc(0, 0, pad.radius, 0.2, Math.PI * 1.85);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = pad.type === 'sinking' ? '#9f1239' : '#15803d';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Pad veins
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 1.5;
        [0.6, 1.0, 1.4].forEach((angle) => {
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(Math.cos(angle * Math.PI) * (pad.radius - 4), Math.sin(angle * Math.PI) * (pad.radius - 4));
          ctx.stroke();
        });

        // Lotus flower on some pads
        if (pad.type === 'lotus_flower') {
          ctx.fillStyle = '#f43f5e';
          for (let p = 0; p < 5; p++) {
            const petAng = (p * Math.PI * 2) / 5;
            ctx.beginPath();
            ctx.ellipse(Math.cos(petAng) * 8, Math.sin(petAng) * 8, 5, 10, petAng, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = '#fde047';
          ctx.beginPath();
          ctx.arc(0, 0, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    });

    // Render Insects
    state.insects.forEach((bug) => {
      if (bug.collected) return;
      ctx.save();
      ctx.translate(bug.x, bug.y);

      // Flapping wings
      const wingFlap = Math.sin(Date.now() * 0.04) * 6;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.ellipse(-6, -4 + wingFlap * 0.2, 7, 3, -0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(6, -4 - wingFlap * 0.2, 7, 3, 0.4, 0, Math.PI * 2);
      ctx.fill();

      // Bug body
      ctx.fillStyle = bug.type === 'dragonfly' ? '#06b6d4' : '#1e293b';
      ctx.beginPath();
      ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2);
      ctx.fill();

      if (bug.type === 'dragonfly') {
        // Glowing aura
        ctx.strokeStyle = '#67e8f9';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }

      ctx.restore();
    });

    // Render Sticky Frog Tongue
    if (state.player.tongueActive && state.player.tongueTarget) {
      ctx.save();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(state.player.x, state.player.y - state.player.jumpHeight);
      ctx.lineTo(state.player.tongueTarget.x, state.player.tongueTarget.y);
      ctx.stroke();

      // Sticky tip
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(state.player.tongueTarget.x, state.player.tongueTarget.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Render Frog Shadow on Water
    const shadowScale = 1 - state.player.jumpHeight * 0.015;
    ctx.fillStyle = 'rgba(2, 44, 34, 0.45)';
    ctx.beginPath();
    ctx.ellipse(state.player.x, state.player.y + 4, 18 * shadowScale, 10 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Render Frog (Barnaby)
    ctx.save();
    const frogY = state.player.y - state.player.jumpHeight;
    ctx.translate(state.player.x, frogY);

    const isMidAir = state.player.isJumping;

    // Hind webbed legs
    ctx.fillStyle = '#16a34a';
    if (isMidAir) {
      // Extended legs in flight
      ctx.beginPath();
      ctx.ellipse(-20, 16, 8, 18, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(20, 16, 8, 18, -0.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Folded legs resting
      ctx.beginPath();
      ctx.ellipse(-18, 6, 12, 10, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(18, 6, 12, 10, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main Green Body
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // Lime yellow belly patch
    ctx.fillStyle = '#bef264';
    ctx.beginPath();
    ctx.ellipse(0, 3, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();

    // Forelegs
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(-14, -8, 6, 10, -0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(14, -8, 6, 10, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Bulbous Eyes on top of head
    [-11, 11].forEach((eyeX) => {
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(eyeX, -16, 8, 0, Math.PI * 2);
      ctx.fill();

      // Big dark pupil
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(eyeX, -16, 5, 0, Math.PI * 2);
      ctx.fill();

      // White catchlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX - 1.5, -18, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();
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
          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <span>🐸</span>
            <span>{POND_ZONES[currentZone]?.name}</span>
          </div>
        </div>

        {/* Lives & Score */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 font-bold text-red-400">
            {Array.from({ length: gameState.player.lives }).map((_, i) => (
              <span key={i}>❤️</span>
            ))}
          </div>

          <div className="flex items-center gap-1 font-bold text-amber-300">
            <span>🪰</span>
            <span>{gameState.fliesEaten}</span>
          </div>

          <div className="flex items-center gap-1 font-bold text-emerald-400">
            <span>⭐</span>
            <span>{gameState.score}</span>
          </div>

          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* Main Pond Canvas */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-full max-h-[72vh] object-contain block"
        />

        {/* Victory Modal */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="text-5xl mb-2">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-400 mb-2">POND CROSSED!</h2>
            <p className="text-slate-300 text-sm max-w-md mb-4">
              Barnaby hopped safely across all drifting logs and lily pads to the victory bank!
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 mb-5 text-sm font-bold text-emerald-400">
              Score: {gameState.score} PTS • Flies Caught: {gameState.fliesEaten}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => startZone(currentZone)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
              >
                🔄 Replay Pond
              </button>
              {currentZone < POND_ZONES.length - 1 && (
                <button
                  onClick={() => startZone(currentZone + 1)}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
                >
                  Next Pond Zone →
                </button>
              )}
            </div>
          </div>
        )}

        {/* Game Over Modal */}
        {gameState.status === 'drowned' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <div className="text-5xl mb-2">🌊</div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-red-400 mb-2">SPLASH! OUT OF LIVES</h2>
            <p className="text-slate-300 text-sm max-w-md mb-4">
              Barnaby plunged into deep water. Time your jumps to land squarely on drifting logs and stable pads!
            </p>
            <button
              onClick={() => startZone(currentZone)}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg transition active:scale-95"
            >
              🔄 Try Again
            </button>
          </div>
        )}
      </div>

      {/* Tactile D-Pad & Tongue Controls Bar */}
      <footer className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4 z-10">
        {/* D-Pad */}
        <div className="grid grid-cols-3 gap-1.5 w-44">
          <div />
          <button
            onClick={() => handleHop('up')}
            disabled={gameState.status !== 'playing' || gameState.player.isJumping}
            className="h-11 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl font-black text-lg flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            ⬆️
          </button>
          <div />
          <button
            onClick={() => handleHop('left')}
            disabled={gameState.status !== 'playing' || gameState.player.isJumping}
            className="h-11 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl font-black text-lg flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            ⬅️
          </button>
          <button
            onClick={() => handleHop('down')}
            disabled={gameState.status !== 'playing' || gameState.player.isJumping}
            className="h-11 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl font-black text-lg flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            ⬇️
          </button>
          <button
            onClick={() => handleHop('right')}
            disabled={gameState.status !== 'playing' || gameState.player.isJumping}
            className="h-11 bg-slate-800 hover:bg-slate-700 active:bg-emerald-600 rounded-xl font-black text-lg flex items-center justify-center border border-slate-700 transition active:scale-95"
          >
            ➡️
          </button>
        </div>

        {/* Big Tongue Button */}
        <button
          onClick={handleTongue}
          disabled={gameState.status !== 'playing' || gameState.player.tongueActive}
          className="flex-1 max-w-xs h-14 bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 active:from-rose-700 rounded-2xl font-black text-base flex items-center justify-center gap-2 shadow-lg transition active:scale-95"
        >
          <span>👅 STICKY TONGUE</span>
          <span className="text-xs font-normal opacity-80 hidden sm:inline">(Space)</span>
        </button>
      </footer>
    </div>
  );
};

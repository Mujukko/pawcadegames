import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createInitialState,
  playerJump,
  playerShoot,
  restartMatch,
  startNextRound,
  updateGame,
} from './logic/engine';
import { DuelGameState, GameMode, MapType } from './logic/types';
import { sound } from './systems/sound';

interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
}

export const BarnyardRoofDuelContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [gameState, setGameState] = useState<DuelGameState>(() => createInitialState('vs_ai', 'red_barn'));
  const [isMuted, setIsMuted] = useState(sound.isMuted());
  const stateRef = useRef<DuelGameState>(gameState);
  stateRef.current = gameState;

  const sparksRef = useRef<SparkParticle[]>([]);

  const toggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleP1Jump = useCallback(() => {
    setGameState((prev) => playerJump(prev, 'p1'));
  }, []);

  const handleP1Shoot = useCallback(() => {
    setGameState((prev) => playerShoot(prev, 'p1'));
  }, []);

  const handleP2Jump = useCallback(() => {
    setGameState((prev) => playerJump(prev, 'p2'));
  }, []);

  const handleP2Shoot = useCallback(() => {
    setGameState((prev) => playerShoot(prev, 'p2'));
  }, []);

  const switchMode = useCallback((mode: GameMode) => {
    setGameState(createInitialState(mode, stateRef.current.mapType));
  }, []);

  const switchMap = useCallback((map: MapType) => {
    setGameState(createInitialState(stateRef.current.gameMode, map));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // P1 controls: W for Jump, E for Shoot (or Space)
      if (e.code === 'KeyW') {
        e.preventDefault();
        handleP1Jump();
      } else if (e.code === 'KeyE' || e.code === 'Space') {
        e.preventDefault();
        handleP1Shoot();
      }

      // P2 controls (for 2-player local): ArrowUp for Jump, ArrowDown or Enter for Shoot
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        handleP2Jump();
      } else if (e.code === 'ArrowDown' || e.code === 'Enter') {
        e.preventDefault();
        handleP2Shoot();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleP1Jump, handleP1Shoot, handleP2Jump, handleP2Shoot]);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;

      const currentState = stateRef.current;
      const nextState = updateGame(currentState, dt);

      // Handle sound events and sparks
      if (nextState.events.length > 0) {
        for (const ev of nextState.events) {
          if (ev.type === 'jump') {
            sound.playJump();
          } else if (ev.type === 'shoot') {
            sound.playShoot();
            // Muzzle flash sparks
            for (let i = 0; i < 6; i++) {
              sparksRef.current.push({
                x: ev.x,
                y: ev.y,
                vx: ev.vx * 0.1 + (Math.random() - 0.5) * 80,
                vy: (Math.random() - 0.5) * 80,
                alpha: 1,
                color: '#FDE047',
              });
            }
          } else if (ev.type === 'hit') {
            sound.playHit();
          } else if (ev.type === 'ricochet') {
            sound.playRicochet();
            for (let i = 0; i < 5; i++) {
              sparksRef.current.push({
                x: ev.x,
                y: ev.y,
                vx: (Math.random() - 0.5) * 120,
                vy: -Math.random() * 80,
                alpha: 1,
                color: '#F97316',
              });
            }
          } else if (ev.type === 'round_win') {
            sound.playRoundWin();
          } else if (ev.type === 'match_win') {
            sound.playMatchWin();
          }
        }
      }

      // Update sparks
      sparksRef.current = sparksRef.current
        .map((sp) => ({
          ...sp,
          x: sp.x + sp.vx * dt,
          y: sp.y + sp.vy * dt,
          alpha: sp.alpha - dt * 2.5,
        }))
        .filter((sp) => sp.alpha > 0);

      setGameState(nextState);

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          drawScene(ctx, nextState, sparksRef.current);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Canvas Drawing
  const drawScene = (
    ctx: CanvasRenderingContext2D,
    state: DuelGameState,
    sparks: SparkParticle[]
  ) => {
    ctx.clearRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // 1. Sky & Cloud Backdrop
    const skyGrad = ctx.createLinearGradient(0, 0, 0, BOARD_HEIGHT);
    skyGrad.addColorStop(0, '#38BDF8');
    skyGrad.addColorStop(0.6, '#BAE6FD');
    skyGrad.addColorStop(1, '#F0FDF4');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, BOARD_WIDTH, BOARD_HEIGHT);

    // Fluffy clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.arc(100, 80, 35, 0, Math.PI * 2);
    ctx.arc(140, 75, 45, 0, Math.PI * 2);
    ctx.arc(180, 85, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(460, 110, 30, 0, Math.PI * 2);
    ctx.arc(500, 100, 42, 0, Math.PI * 2);
    ctx.arc(540, 115, 25, 0, Math.PI * 2);
    ctx.fill();

    // 2. Draw Map Rooftop Architecture
    if (state.mapType === 'red_barn') {
      // Red barn body
      ctx.fillStyle = '#B91C1C';
      ctx.fillRect(110, 360, 420, 120);

      // White cross-hatch barn door trim
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.strokeRect(270, 380, 100, 100);
      ctx.beginPath();
      ctx.moveTo(270, 380);
      ctx.lineTo(370, 480);
      ctx.moveTo(370, 380);
      ctx.lineTo(270, 480);
      ctx.stroke();

      // Sloped Shingle Roof
      ctx.fillStyle = '#78350F';
      ctx.beginPath();
      ctx.moveTo(90, 370);
      ctx.lineTo(320, 300);
      ctx.lineTo(550, 370);
      ctx.lineTo(530, 380);
      ctx.lineTo(320, 315);
      ctx.lineTo(110, 380);
      ctx.closePath();
      ctx.fill();

      // Weather Vane on peak
      ctx.strokeStyle = '#0F172A';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(320, 300);
      ctx.lineTo(320, 260);
      ctx.stroke();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(320, 258, 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.mapType === 'windmill') {
      // Barn base
      ctx.fillStyle = '#D97706';
      ctx.fillRect(130, 340, 380, 140);

      // Rotating Windmill Blades
      if (state.windmill) {
        const { cx, cy, angle, bladeLength } = state.windmill;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);

        // 4 blades
        for (let i = 0; i < 4; i++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = 'rgba(254, 243, 199, 0.85)';
          ctx.strokeStyle = '#78350F';
          ctx.lineWidth = 2;
          ctx.fillRect(6, -8, bladeLength, 16);
          ctx.strokeRect(6, -8, bladeLength, 16);
        }

        // Center hub
        ctx.fillStyle = '#451A03';
        ctx.beginPath();
        ctx.arc(0, 0, 12, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }
    } else if (state.mapType === 'silo_catwalk') {
      // Two metal silos
      ctx.fillStyle = '#94A3B8';
      ctx.fillRect(100, 330, 170, 150);
      ctx.fillRect(370, 330, 170, 150);

      // Metal domes
      ctx.beginPath();
      ctx.arc(185, 330, 85, Math.PI, 0);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(455, 330, 85, Math.PI, 0);
      ctx.fill();

      // Hazard Warning Edge Stripes
      ctx.fillStyle = '#FBBF24';
      ctx.fillRect(260, 326, 10, 8);
      ctx.fillRect(370, 326, 10, 8);
    }

    // 3. Draw Bullets
    for (const b of state.bullets) {
      if (!b.active) continue;
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Bullet tracer tail
      ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x, b.y);
      ctx.lineTo(b.x - b.vx * 0.02, b.y - b.vy * 0.02);
      ctx.stroke();
    }

    // 4. Draw Sparks
    for (const sp of sparks) {
      ctx.fillStyle = sp.color;
      ctx.globalAlpha = Math.max(0, sp.alpha);
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // 5. Draw Ragdoll Players
    drawPlayer(ctx, state.p1);
    drawPlayer(ctx, state.p2);
  };

  // Helper: Draw Ragdoll Character
  const drawPlayer = (ctx: CanvasRenderingContext2D, p: DuelGameState['p1']) => {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.angle);

    const isP1 = p.id === 'p1';
    const faceDir = isP1 ? 1 : -1;

    // Body
    if (p.character === 'rooster') {
      // Sheriff Rooster
      // White feather body with blue denim overalls
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.ellipse(0, -12, 12, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // Denim overalls
      ctx.fillStyle = '#2563EB';
      ctx.fillRect(-9, -10, 18, 14);

      // Tail Feathers (Floppy behind)
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.moveTo(-faceDir * 10, -14);
      ctx.lineTo(-faceDir * 24, -26);
      ctx.lineTo(-faceDir * 14, -8);
      ctx.closePath();
      ctx.fill();

      // Head
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -30, 10, 0, Math.PI * 2);
      ctx.fill();

      // Red Comb on Top
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(0, -40, 5, 0, Math.PI * 2);
      ctx.arc(faceDir * 4, -41, 4, 0, Math.PI * 2);
      ctx.fill();

      // Yellow Beak
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.moveTo(faceDir * 6, -32);
      ctx.lineTo(faceDir * 16, -29);
      ctx.lineTo(faceDir * 6, -26);
      ctx.closePath();
      ctx.fill();

      // Eye
      ctx.fillStyle = '#0F172A';
      ctx.beginPath();
      ctx.arc(faceDir * 4, -32, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Bandit Fox
      // Orange body with white chest patch
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.ellipse(0, -12, 13, 16, 0, 0, Math.PI * 2);
      ctx.fill();

      // White chest
      ctx.fillStyle = '#FFF7ED';
      ctx.beginPath();
      ctx.ellipse(faceDir * 3, -12, 7, 10, 0, 0, Math.PI * 2);
      ctx.fill();

      // Bushy Orange Tail
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.moveTo(-faceDir * 10, -10);
      ctx.lineTo(-faceDir * 28, -18);
      ctx.lineTo(-faceDir * 14, -4);
      ctx.closePath();
      ctx.fill();
      // White tail tip
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(-faceDir * 27, -18, 4, 0, Math.PI * 2);
      ctx.fill();

      // Head
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(0, -30, 11, 0, Math.PI * 2);
      ctx.fill();

      // Pointy Fox Ears
      ctx.beginPath();
      ctx.moveTo(-6, -38);
      ctx.lineTo(-3, -48);
      ctx.lineTo(2, -39);
      ctx.moveTo(2, -39);
      ctx.lineTo(7, -48);
      ctx.lineTo(10, -38);
      ctx.closePath();
      ctx.fill();

      // Bandit Eye Mask
      ctx.fillStyle = '#1E293B';
      ctx.fillRect(-10, -34, 20, 6);

      // Eye
      ctx.fillStyle = '#FEF08A';
      ctx.beginPath();
      ctx.arc(faceDir * 4, -31, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aiming Arm & Rifle
    ctx.save();
    ctx.translate(0, -15);
    ctx.rotate(isP1 ? -p.armAngle : p.armAngle);

    // Rifle barrel
    ctx.fillStyle = '#451A03';
    ctx.fillRect(0, -4, faceDir * 22, 6);
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(faceDir * 14, -3, faceDir * 14, 4);

    // Arm sleeve
    ctx.fillStyle = isP1 ? '#2563EB' : '#EA580C';
    ctx.beginPath();
    ctx.arc(0, 0, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.restore();
  };

  const handleNextRound = () => {
    setGameState((prev) => startNextRound(prev));
  };

  const handleRestart = () => {
    setGameState((prev) => restartMatch(prev));
  };

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col items-center justify-center w-full min-h-[580px] max-h-[85vh] bg-[#0A101D] text-white select-none touch-none overflow-hidden rounded-2xl shadow-2xl p-2"
      style={{ touchAction: 'none', overscrollBehavior: 'none' }}
    >
      {/* Top HUD: Score & Match Controls */}
      <div className="w-full max-w-[640px] flex items-center justify-between px-3 py-1.5 bg-[#1E293B]/90 border border-amber-500/30 rounded-xl mb-1.5 text-xs backdrop-blur-sm">
        {/* P1 Score Card */}
        <div className="flex items-center gap-2">
          <span className="font-extrabold text-blue-400">🐓 P1:</span>
          <span className="text-xl font-black text-amber-300 font-mono">{gameState.p1.score}</span>
        </div>

        {/* Center Round & Mode Options */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-300">Round {gameState.round} (First to 5)</span>
          <div className="flex items-center gap-1 bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => switchMode('vs_ai')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                gameState.gameMode === 'vs_ai' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              VS AI
            </button>
            <button
              onClick={() => switchMode('two_player')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                gameState.gameMode === 'two_player' ? 'bg-amber-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              2P
            </button>
          </div>
        </div>

        {/* P2 Score Card & Mute */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-amber-300 font-mono">{gameState.p2.score}</span>
            <span className="font-extrabold text-orange-400">:P2 🦊</span>
          </div>
          <button
            onClick={toggleMute}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div className="relative w-full max-w-[640px] aspect-[640/480] flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={BOARD_WIDTH}
          height={BOARD_HEIGHT}
          className="w-full h-full rounded-xl border border-amber-500/40 shadow-inner"
        />

        {/* In-Game Touch Controls for Mobile */}
        {gameState.status === 'dueling' && (
          <>
            {/* P1 Controls (Left Side) */}
            <div className="absolute bottom-4 left-4 flex gap-2 z-10">
              <button
                onClick={handleP1Jump}
                className="w-14 h-14 bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg border border-emerald-300/40 flex flex-col items-center justify-center backdrop-blur-sm"
              >
                <span>🦘</span>
                <span>JUMP</span>
              </button>
              <button
                onClick={handleP1Shoot}
                className="w-14 h-14 bg-amber-600/90 hover:bg-amber-500 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg border border-amber-300/40 flex flex-col items-center justify-center backdrop-blur-sm"
              >
                <span>🎯</span>
                <span>SHOOT</span>
              </button>
            </div>

            {/* P2 Controls (Right Side - Enabled in 2-Player Mode) */}
            {gameState.gameMode === 'two_player' && (
              <div className="absolute bottom-4 right-4 flex gap-2 z-10">
                <button
                  onClick={handleP2Shoot}
                  className="w-14 h-14 bg-orange-600/90 hover:bg-orange-500 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg border border-orange-300/40 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <span>🎯</span>
                  <span>SHOOT</span>
                </button>
                <button
                  onClick={handleP2Jump}
                  className="w-14 h-14 bg-indigo-600/90 hover:bg-indigo-500 active:scale-95 text-white font-black text-xs rounded-2xl shadow-lg border border-indigo-300/40 flex flex-col items-center justify-center backdrop-blur-sm"
                >
                  <span>🦘</span>
                  <span>JUMP</span>
                </button>
              </div>
            )}
          </>
        )}

        {/* Round Over Modal */}
        {gameState.status === 'round_over' && (
          <div className="absolute inset-0 bg-black/75 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-2xl font-black text-amber-400 mb-1">
              {gameState.roundWinner === 'p1' ? '🐓 P1 SCORES!' : '🦊 P2 SCORES!'}
            </h2>
            <p className="text-slate-300 text-xs mb-3">
              {gameState.roundWinner === 'p1'
                ? 'Sheriff Rooster knocked Bandit Fox off the rooftop!'
                : 'Bandit Fox knocked Sheriff Rooster off the rooftop!'}
            </p>
            <div className="text-lg font-bold text-white mb-4">
              P1 <span className="text-blue-400">{gameState.p1.score}</span> —{' '}
              <span className="text-orange-400">{gameState.p2.score}</span> P2
            </div>
            <button
              onClick={handleNextRound}
              className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              Next Round ⚔️
            </button>
          </div>
        )}

        {/* Match Victory Modal */}
        {gameState.status === 'match_over' && (
          <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-6 text-center rounded-xl backdrop-blur-sm z-20">
            <h2 className="text-3xl font-black text-amber-400 mb-1">
              🏆 {gameState.matchWinner === 'p1' ? 'ROOSTER WINS!' : 'FOX WINS!'} 🏆
            </h2>
            <p className="text-slate-300 text-xs mb-3">
              Champion of the barnyard rooftops! Final Score {gameState.p1.score} to {gameState.p2.score}.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-sm rounded-xl shadow-lg transition"
              >
                Rematch 🔄
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Helpful Hint & Map Switcher Footer */}
      <div className="w-full max-w-[640px] flex items-center justify-between text-[11px] text-slate-400 mt-1 px-1">
        <div>
          P1: <strong>W</strong> (Jump) | <strong>E / Space</strong> (Shoot) &bull; P2: <strong>&uarr;</strong> (Jump) | <strong>&darr; / Enter</strong> (Shoot)
        </div>
        <div className="flex items-center gap-1.5">
          <span>Map:</span>
          <button
            onClick={() => switchMap('red_barn')}
            className={`px-1.5 py-0.5 rounded text-[10px] ${gameState.mapType === 'red_barn' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800'}`}
          >
            Barn
          </button>
          <button
            onClick={() => switchMap('windmill')}
            className={`px-1.5 py-0.5 rounded text-[10px] ${gameState.mapType === 'windmill' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800'}`}
          >
            Windmill
          </button>
          <button
            onClick={() => switchMap('silo_catwalk')}
            className={`px-1.5 py-0.5 rounded text-[10px] ${gameState.mapType === 'silo_catwalk' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800'}`}
          >
            Silos
          </button>
        </div>
      </div>
    </div>
  );
};
export default BarnyardRoofDuelContainer;

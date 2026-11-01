import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  initFireboyWatergirlGame,
  stepFireboyWatergirlGame,
  TOTAL_COOP_LEVELS,
} from './logic/engine';
import { DualInput, FireboyWatergirlState } from './logic/types';
import { fireboyWatergirlAudio } from './systems/sound';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  ArrowRight,
  Trophy,
  ArrowUp,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Flame,
  Droplets,
  Users,
} from 'lucide-react';

export const FireboyWatergirlContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<FireboyWatergirlState>(initFireboyWatergirlGame(1));
  const inputRef = useRef<DualInput>({ pup: {}, kitty: {} });

  const [activeMobileChar, setActiveMobileChar] = useState<'pup' | 'kitty'>('pup');
  const [hudState, setHudState] = useState({
    levelIndex: 1,
    status: 'playing',
    gemsCollected: 0,
    totalGems: 4,
    isMuted: fireboyWatergirlAudio.isMuted(),
  });

  const [showNextModal, setShowNextModal] = useState(false);
  const [showVictoryModal, setShowVictoryModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);

  const resetCurrentLevel = useCallback(() => {
    stateRef.current = initFireboyWatergirlGame(stateRef.current.levelIndex);
    setShowNextModal(false);
    setShowVictoryModal(false);
    setShowFailedModal(false);
  }, []);

  const advanceNextLevel = useCallback(() => {
    const nextLvl = stateRef.current.levelIndex + 1;
    if (nextLvl <= TOTAL_COOP_LEVELS) {
      stateRef.current = initFireboyWatergirlGame(nextLvl);
      setShowNextModal(false);
      fireboyWatergirlAudio.playClear();
    }
  }, []);

  const restartEntireGame = useCallback(() => {
    stateRef.current = initFireboyWatergirlGame(1);
    setShowVictoryModal(false);
    setShowFailedModal(false);
    setShowNextModal(false);
  }, []);

  const toggleSound = () => {
    const muted = fireboyWatergirlAudio.toggleMute();
    setHudState((prev) => ({ ...prev, isMuted: muted }));
  };

  // Keyboard Event Listeners (WASD for Pup, Arrows for Kitty)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Pup Controls (WASD)
      if (e.code === 'KeyA') {
        inputRef.current.pup.left = true;
      } else if (e.code === 'KeyD') {
        inputRef.current.pup.right = true;
      } else if (e.code === 'KeyW') {
        if (!inputRef.current.pup.jump) fireboyWatergirlAudio.playJump();
        inputRef.current.pup.jump = true;
      }

      // Kitty Controls (Arrows)
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        inputRef.current.kitty.left = true;
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        inputRef.current.kitty.right = true;
      } else if (e.code === 'ArrowUp') {
        e.preventDefault();
        if (!inputRef.current.kitty.jump) fireboyWatergirlAudio.playJump();
        inputRef.current.kitty.jump = true;
      }

      // Hotkeys
      if (e.code === 'KeyR') resetCurrentLevel();
      if (e.code === 'KeyM') toggleSound();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'KeyA') inputRef.current.pup.left = false;
      if (e.code === 'KeyD') inputRef.current.pup.right = false;
      if (e.code === 'KeyW') inputRef.current.pup.jump = false;

      if (e.code === 'ArrowLeft') inputRef.current.kitty.left = false;
      if (e.code === 'ArrowRight') inputRef.current.kitty.right = false;
      if (e.code === 'ArrowUp') inputRef.current.kitty.jump = false;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [resetCurrentLevel]);

  // Main Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.05);
      lastTime = time;

      const { state: nextState, event } = stepFireboyWatergirlGame(
        stateRef.current,
        inputRef.current,
        dt
      );
      stateRef.current = nextState;

      if (event === 'gem') fireboyWatergirlAudio.playGem();
      if (event === 'plate') fireboyWatergirlAudio.playPlate();
      if (event === 'die') {
        fireboyWatergirlAudio.playDie();
        setShowFailedModal(true);
      }
      if (event === 'clear') {
        fireboyWatergirlAudio.playClear();
        setShowNextModal(true);
      }
      if (event === 'victory') {
        fireboyWatergirlAudio.playVictory();
        setShowVictoryModal(true);
      }

      const collectedCount = nextState.gems.filter((g) => g.collected).length;
      setHudState((prev) => ({
        ...prev,
        levelIndex: nextState.levelIndex,
        status: nextState.status,
        gemsCollected: collectedCount,
        totalGems: nextState.gems.length,
      }));

      // Render
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderCoopCanvas(ctx, canvas.width, canvas.height, nextState);
        }
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-800">
      {/* Top Bar */}
      <div className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-800/90 backdrop-blur border-b border-slate-700/60 z-10 text-white">
        <div className="flex items-center gap-4">
          <div className="font-extrabold text-amber-400 text-sm tracking-wide flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-400 fill-orange-400" />
            <Droplets className="w-4 h-4 text-cyan-400 fill-cyan-400" />
            <span>Level {hudState.levelIndex} / {TOTAL_COOP_LEVELS}</span>
          </div>

          <div className="text-xs font-bold text-slate-300">
            Gems: <span className="text-amber-400 font-extrabold">{hudState.gemsCollected}</span> / {hudState.totalGems}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetCurrentLevel}
            aria-label="Restart Level"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition active:scale-95"
          >
            {hudState.isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas Area */}
      <div className="relative w-full aspect-[8/5] max-h-[70vh] flex items-center justify-center bg-slate-950 overflow-hidden">
        <canvas
          ref={canvasRef}
          width={800}
          height={480}
          className="w-full h-full object-contain block"
        />

        {/* Failed Modal */}
        {showFailedModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-4xl mb-2">💥</div>
            <h3 className="text-2xl font-black text-rose-400 mb-1">Elemental Clash!</h3>
            <p className="text-sm text-slate-300 mb-5 text-center max-w-xs">
              Sun Pup cannot touch water or acid. Moon Kitty cannot touch lava or acid!
            </p>
            <button
              onClick={resetCurrentLevel}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Try Again
            </button>
          </div>
        )}

        {/* Level Cleared Modal */}
        {showNextModal && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-sm flex flex-col items-center justify-center text-white p-4 z-20">
            <div className="text-5xl mb-2 animate-bounce">🚪✨</div>
            <h3 className="text-2xl font-black text-emerald-400 mb-1">Temple Chamber Cleared!</h3>
            <p className="text-sm text-slate-300 mb-5">Sun Pup & Moon Kitty reached the sanctuary doors!</p>
            <button
              onClick={advanceNextLevel}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              Next Level <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Victory Modal */}
        {showVictoryModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center text-white p-4 z-20">
            <Trophy className="w-16 h-16 text-amber-400 mb-3 animate-pulse" />
            <h3 className="text-3xl font-black text-amber-400 mb-1">Temple Champions!</h3>
            <p className="text-sm text-slate-200 mb-6 text-center max-w-sm">
              Sun Pup and Moon Kitty mastered the elemental chambers together!
            </p>
            <button
              onClick={restartEntireGame}
              className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow-lg flex items-center gap-2 text-base transition transform active:scale-95"
            >
              <RotateCcw className="w-5 h-5" /> Play From Start
            </button>
          </div>
        )}
      </div>

      {/* Touch & Mobile Controls Bar */}
      <div className="w-full py-2.5 px-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
        {/* Switch Character on Mobile Button */}
        <button
          onClick={() => {
            const next = activeMobileChar === 'pup' ? 'kitty' : 'pup';
            setActiveMobileChar(next);
            // Reset mobile movement inputs on switch
            inputRef.current.pup = {};
            inputRef.current.kitty = {};
          }}
          className={`px-3 py-2 rounded-xl font-extrabold text-xs flex items-center gap-2 border transition ${
            activeMobileChar === 'pup'
              ? 'bg-amber-600/30 border-amber-500 text-amber-300'
              : 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Controlling: {activeMobileChar === 'pup' ? '🐕 Sun Pup' : '🐈 Moon Kitty'}</span>
        </button>

        {/* Mobile Direction & Jump Buttons */}
        <div className="flex items-center gap-2">
          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current[activeMobileChar].left = true;
            }}
            onTouchEnd={() => (inputRef.current[activeMobileChar].left = false)}
            onMouseDown={() => (inputRef.current[activeMobileChar].left = true)}
            onMouseUp={() => (inputRef.current[activeMobileChar].left = false)}
            className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current[activeMobileChar].right = true;
            }}
            onTouchEnd={() => (inputRef.current[activeMobileChar].right = false)}
            onMouseDown={() => (inputRef.current[activeMobileChar].right = true)}
            onMouseUp={() => (inputRef.current[activeMobileChar].right = false)}
            className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 active:bg-amber-600 flex items-center justify-center text-white"
          >
            <ArrowRightIcon className="w-5 h-5" />
          </button>

          <button
            onTouchStart={(e) => {
              e.preventDefault();
              inputRef.current[activeMobileChar].jump = true;
              fireboyWatergirlAudio.playJump();
            }}
            onTouchEnd={() => (inputRef.current[activeMobileChar].jump = false)}
            onMouseDown={() => {
              inputRef.current[activeMobileChar].jump = true;
              fireboyWatergirlAudio.playJump();
            }}
            onMouseUp={() => (inputRef.current[activeMobileChar].jump = false)}
            className={`w-14 h-11 rounded-xl font-black text-xs uppercase flex items-center justify-center shadow-lg active:scale-95 transition ${
              activeMobileChar === 'pup'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-cyan-500 text-slate-950'
            }`}
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Canvas 2D Rendering
function renderCoopCanvas(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: FireboyWatergirlState
) {
  // Background Temple Wall
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, width, height);

  // Ancient Brick Pattern
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  for (let y = 0; y < height; y += 30) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Draw Platforms
  for (const plat of state.platforms) {
    const isGate = !!plat.requiresPlateId;

    if (isGate) {
      // Mechanical sliding gate
      ctx.fillStyle = '#64748b';
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
    } else {
      // Stone Temple Platform
      const stoneGrad = ctx.createLinearGradient(plat.x, plat.y, plat.x, plat.y + plat.height);
      stoneGrad.addColorStop(0, '#334155');
      stoneGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = stoneGrad;
      ctx.fillRect(plat.x, plat.y, plat.width, plat.height);

      // Grass / Moss Top
      ctx.fillStyle = '#15803d';
      ctx.fillRect(plat.x, plat.y, plat.width, 3);
    }
  }

  // Draw Pressure Plates
  for (const plate of state.plates) {
    ctx.fillStyle = plate.isPressed ? '#d97706' : '#f59e0b';
    const py = plate.isPressed ? plate.y + 3 : plate.y;
    const ph = plate.isPressed ? 3 : plate.height;
    ctx.fillRect(plate.x, py, plate.width, ph);
  }

  // Draw Hazard Pools
  for (const h of state.hazards) {
    if (h.type === 'lava') {
      const lavaGrad = ctx.createLinearGradient(h.x, h.y, h.x, h.y + h.height);
      lavaGrad.addColorStop(0, '#f97316');
      lavaGrad.addColorStop(1, '#dc2626');
      ctx.fillStyle = lavaGrad;
      ctx.fillRect(h.x, h.y, h.width, h.height);
    } else if (h.type === 'water') {
      const waterGrad = ctx.createLinearGradient(h.x, h.y, h.x, h.y + h.height);
      waterGrad.addColorStop(0, '#38bdf8');
      waterGrad.addColorStop(1, '#0284c7');
      ctx.fillStyle = waterGrad;
      ctx.fillRect(h.x, h.y, h.width, h.height);
    } else {
      // Acid
      const acidGrad = ctx.createLinearGradient(h.x, h.y, h.x, h.y + h.height);
      acidGrad.addColorStop(0, '#a3e635');
      acidGrad.addColorStop(1, '#4d7c0f');
      ctx.fillStyle = acidGrad;
      ctx.fillRect(h.x, h.y, h.width, h.height);
    }
  }

  // Draw Exit Doors
  // Pup Door (Fire)
  renderExitDoor(ctx, state.pupDoor.x, state.pupDoor.y, state.pupDoor.width, state.pupDoor.height, 'fire', state.pup.atExit);
  // Kitty Door (Water)
  renderExitDoor(ctx, state.kittyDoor.x, state.kittyDoor.y, state.kittyDoor.width, state.kittyDoor.height, 'water', state.kitty.atExit);

  // Draw Gems
  for (const gem of state.gems) {
    if (gem.collected) continue;
    renderGem(ctx, gem.x, gem.y, gem.radius, gem.type);
  }

  // Draw Characters
  // Sun Pup
  if (state.pup.alive) {
    renderSunPup(ctx, state.pup.x, state.pup.y, state.pup.width, state.pup.height, state.pup.facing);
  }
  // Moon Kitty
  if (state.kitty.alive) {
    renderMoonKitty(ctx, state.kitty.x, state.kitty.y, state.kitty.width, state.kitty.height, state.kitty.facing);
  }
}

function renderExitDoor(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  type: 'fire' | 'water',
  active: boolean
) {
  ctx.save();
  // Frame
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = type === 'fire' ? '#f97316' : '#38bdf8';
  ctx.lineWidth = active ? 4 : 2;
  ctx.strokeRect(x, y, w, h);

  // Portal Arch
  ctx.fillStyle = active
    ? type === 'fire'
      ? 'rgba(249, 115, 22, 0.6)'
      : 'rgba(56, 189, 248, 0.6)'
    : '#090d16';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + 18, 12, Math.PI, 0);
  ctx.lineTo(x + w / 2 + 12, y + h);
  ctx.lineTo(x + w / 2 - 12, y + h);
  ctx.closePath();
  ctx.fill();

  // Emblem
  ctx.fillStyle = type === 'fire' ? '#f59e0b' : '#38bdf8';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(type === 'fire' ? '🔥' : '💧', x + w / 2, y + h - 10);

  ctx.restore();
}

function renderGem(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  type: 'fire' | 'water'
) {
  ctx.save();
  ctx.translate(x, y);

  ctx.fillStyle = type === 'fire' ? '#f59e0b' : '#38bdf8';
  ctx.beginPath();
  ctx.moveTo(0, -radius);
  ctx.lineTo(radius, 0);
  ctx.lineTo(0, radius);
  ctx.lineTo(-radius, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(-2, -2, radius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function renderSunPup(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  facing: 1 | -1
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (facing < 0) ctx.scale(-1, 1);

  // Golden Sun Pup Body
  const pupGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 14);
  pupGrad.addColorStop(0, '#fef08a');
  pupGrad.addColorStop(0.6, '#f59e0b');
  pupGrad.addColorStop(1, '#d97706');
  ctx.fillStyle = pupGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // Floppy Puppy Ears
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.ellipse(-8, -4, 4, 8, Math.PI / 4, 0, Math.PI * 2);
  ctx.fill();

  // Snout
  ctx.fillStyle = '#fbbf24';
  ctx.beginPath();
  ctx.arc(6, 3, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.arc(9, 2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(3, -2, 2, 0, Math.PI * 2);
  ctx.fill();

  // Solar Crown Spark
  ctx.fillStyle = '#f97316';
  ctx.beginPath();
  ctx.moveTo(-2, -12);
  ctx.lineTo(2, -16);
  ctx.lineTo(4, -12);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function renderMoonKitty(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  facing: 1 | -1
) {
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  if (facing < 0) ctx.scale(-1, 1);

  // Moon Kitty Body (Ethereal Blue/Cyan)
  const catGrad = ctx.createRadialGradient(-2, -2, 2, 0, 0, 14);
  catGrad.addColorStop(0, '#e0f2fe');
  catGrad.addColorStop(0.6, '#38bdf8');
  catGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = catGrad;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();

  // Pointed Cat Ears
  ctx.fillStyle = '#0369a1';
  ctx.beginPath();
  ctx.moveTo(-8, -8);
  ctx.lineTo(-4, -16);
  ctx.lineTo(0, -9);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(1, -9);
  ctx.lineTo(6, -16);
  ctx.lineTo(8, -8);
  ctx.closePath();
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(3, -1, 2, 0, Math.PI * 2);
  ctx.fill();

  // Moon Crescent Forehead Symbol
  ctx.fillStyle = '#bae6fd';
  ctx.beginPath();
  ctx.arc(-2, -7, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

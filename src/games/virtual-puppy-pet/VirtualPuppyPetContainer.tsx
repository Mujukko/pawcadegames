import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PuppyGameState,
  PuppyAccessory,
} from './logic/types';
import {
  createPuppyGame,
  feedPuppy,
  washPuppy,
  throwTennisBall,
  restPuppy,
  buyAndEquipAccessory,
  determinePuppyMood,
  updatePuppyGame,
  ACCESSORY_COSTS,
} from './logic/engine';
import { puppySound } from './systems/sound';

interface VirtualPuppyPetProps {
  onBack?: () => void;
}

export const VirtualPuppyPetContainer: React.FC<VirtualPuppyPetProps> = ({ onBack }) => {
  const [gameState, setGameState] = useState<PuppyGameState>(createPuppyGame);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showWardrobe, setShowWardrobe] = useState<boolean>(false);
  const [patHearts, setPatHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stateRef = useRef<PuppyGameState>(gameState);
  stateRef.current = gameState;

  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);

  const handleFeed = (food: 'kibble' | 'bone') => {
    setGameState((prev) => {
      const next = feedPuppy(prev, food);
      puppySound.playEat();
      return next;
    });
  };

  const handleWashSoap = () => {
    setGameState((prev) => {
      const next = washPuppy(prev, 'soap');
      puppySound.playSplash();
      return next;
    });
  };

  const handleWashRinse = () => {
    setGameState((prev) => {
      const next = washPuppy(prev, 'rinse');
      puppySound.playSplash();
      return next;
    });
  };

  const handleThrowBall = () => {
    setGameState((prev) => {
      const next = throwTennisBall(prev, 620, 160);
      puppySound.playBallSqueak();
      return next;
    });
  };

  const handleSleep = () => {
    setGameState((prev) => {
      const next = restPuppy(prev);
      if (next.currentActivity === 'sleeping') {
        puppySound.playLullaby();
      } else {
        puppySound.playBark();
      }
      return next;
    });
  };

  const handlePat = (clientX: number, clientY: number) => {
    puppySound.playBark();
    const id = Date.now() + Math.random();
    setPatHearts((prev) => [...prev, { id, x: clientX, y: clientY }]);
    setTimeout(() => {
      setPatHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1000);

    setGameState((prev) => ({
      ...prev,
      stats: {
        ...prev.stats,
        happiness: Math.min(100, prev.stats.happiness + 8),
      },
    }));
  };

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      puppySound.setMuted(next);
      return next;
    });
  }, []);

  // Main loop
  useEffect(() => {
    lastTimeRef.current = performance.now();

    const loop = (now: number) => {
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updatePuppyGame(current, dt);

      if (next.events.some((e) => e.type === 'level_up')) {
        puppySound.playLevelUp();
      }

      setGameState(next);
      renderCanvas(next);

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animFrameIdRef.current);
  }, []);

  const renderCanvas = (state: PuppyGameState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const isNight = state.currentActivity === 'sleeping';

    // Room background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    if (isNight) {
      bgGrad.addColorStop(0, '#0f172a');
      bgGrad.addColorStop(0.65, '#1e1b4b');
      bgGrad.addColorStop(1, '#312e81');
    } else {
      bgGrad.addColorStop(0, '#fef08a'); // sunny room
      bgGrad.addColorStop(0.65, '#fed7aa');
      bgGrad.addColorStop(1, '#86efac'); // pasture green rug
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Warm wooden floor / pasture rug
    const floorY = height * 0.65;
    ctx.fillStyle = isNight ? '#1e293b' : '#15803d';
    ctx.fillRect(0, floorY, width, height - floorY);

    // Cozy dog cushion bed
    const bedX = width * 0.5;
    const bedY = floorY + 40;
    ctx.fillStyle = isNight ? '#334155' : '#ef4444';
    ctx.beginPath();
    ctx.ellipse(bedX, bedY, 150, 65, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = isNight ? '#475569' : '#b91c1c';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Puppy Center
    const pupX = bedX;
    const pupY = bedY - 15;

    ctx.save();
    ctx.translate(pupX, pupY);

    const mood = determinePuppyMood(state.stats);
    const breathe = Math.sin(Date.now() * 0.005) * (isNight ? 2 : 4);
    const tailWag = isNight ? 0 : Math.sin(Date.now() * 0.015) * 0.55;

    // Tail
    ctx.save();
    ctx.translate(-70, -10);
    ctx.rotate(-0.4 + tailWag);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.ellipse(-20, 0, 28, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Puppy Body
    ctx.fillStyle = '#f59e0b'; // golden coat
    ctx.beginPath();
    ctx.ellipse(0, breathe, 75, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    // Chest fur patch
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(15, breathe + 8, 42, 34, 0, 0, Math.PI * 2);
    ctx.fill();

    // Paws
    ctx.fillStyle = '#d97706';
    [-42, 42].forEach((px) => {
      ctx.beginPath();
      ctx.ellipse(px, 42, 18, 12, 0, 0, Math.PI * 2);
      ctx.fill();
    });

    // Head
    const headY = -35 + breathe;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, headY, 52, 0, Math.PI * 2);
    ctx.fill();

    // Floppy Ears
    const earWiggle = Math.sin(Date.now() * 0.008) * 0.15;
    // Left ear
    ctx.save();
    ctx.translate(-46, headY - 15);
    ctx.rotate(0.3 + earWiggle);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 24, 18, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Right ear
    ctx.save();
    ctx.translate(46, headY - 15);
    ctx.rotate(-0.3 - earWiggle);
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(0, 24, 18, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Puppy Eyes
    if (isNight) {
      // Sleeping eyes (arcs)
      ctx.strokeStyle = '#451a03';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(-18, headY - 6, 10, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(18, headY - 6, 10, 0.2, Math.PI - 0.2);
      ctx.stroke();
    } else {
      // Big shiny puppy eyes
      [-18, 18].forEach((eyeX) => {
        ctx.fillStyle = '#451a03';
        ctx.beginPath();
        ctx.arc(eyeX, headY - 6, 11, 0, Math.PI * 2);
        ctx.fill();
        // Eye catchlights
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(eyeX - 3, headY - 9, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eyeX + 3, headY - 3, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    // Puppy Snout & Nose
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.ellipse(0, headY + 16, 22, 16, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark button nose
    ctx.fillStyle = '#1c1917';
    ctx.beginPath();
    ctx.ellipse(0, headY + 10, 10, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // Happy tongue or smiling mouth
    if (mood === 'playful' || mood === 'happy') {
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath();
      ctx.arc(0, headY + 24, 8, 0, Math.PI);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#1c1917';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(-6, headY + 18, 6, 0.2, Math.PI * 0.8);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(6, headY + 18, 6, 0.2, Math.PI * 0.8);
      ctx.stroke();
    }

    // Render Equipped Accessory
    if (state.accessory === 'red_bandana') {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.moveTo(-32, headY + 28);
      ctx.lineTo(32, headY + 28);
      ctx.lineTo(0, headY + 54);
      ctx.closePath();
      ctx.fill();
    } else if (state.accessory === 'bell_collar') {
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(0, headY + 30, 32, 0.1, Math.PI - 0.1);
      ctx.stroke();
      // Gold bell
      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.arc(0, headY + 40, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (state.accessory === 'detective_hat') {
      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.ellipse(0, headY - 48, 48, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.roundRect(-24, headY - 74, 48, 30, 6);
      ctx.fill();
    } else if (state.accessory === 'party_bowtie') {
      ctx.fillStyle = '#ec4899';
      ctx.beginPath();
      ctx.moveTo(-18, headY + 28);
      ctx.lineTo(0, headY + 34);
      ctx.lineTo(-18, headY + 40);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(18, headY + 28);
      ctx.lineTo(0, headY + 34);
      ctx.lineTo(18, headY + 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#fde047';
      ctx.beginPath();
      ctx.arc(0, headY + 34, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Soapy foam bubbles on body
    state.foamBubbles.forEach((b) => {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
      ctx.beginPath();
      ctx.arc(b.x - pupX, b.y - pupY, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    ctx.restore();

    // Floating Sleep Zzz's
    if (isNight) {
      ctx.fillStyle = '#93c5fd';
      ctx.font = 'bold 24px sans-serif';
      const zOffset = (Date.now() * 0.05) % 60;
      ctx.fillText('Z', bedX + 40, bedY - 70 - zOffset * 0.5);
      ctx.font = 'bold 30px sans-serif';
      ctx.fillText('Z', bedX + 60, bedY - 95 - zOffset * 0.7);
    }

    // Tennis Ball in motion
    if (state.ballPosition && state.ballPosition.isThrown) {
      ctx.save();
      ctx.translate(state.ballPosition.x, state.ballPosition.y);
      ctx.fillStyle = '#84cc16'; // tennis lime
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 10, 0.4, 2.7);
      ctx.stroke();
      ctx.restore();
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
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <span>🐶</span>
            <span>{gameState.puppyName}</span>
            <span className="text-slate-400 font-normal">Lv.{gameState.level}</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="flex-1 max-w-xs mx-4 hidden sm:block">
          <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-bold">
            <span>FRIENDSHIP XP</span>
            <span>{gameState.xp} / {gameState.maxXp}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-150"
              style={{ width: `${Math.min(100, (gameState.xp / gameState.maxXp) * 100)}%` }}
            />
          </div>
        </div>

        {/* Bones currency & Wardrobe button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-bold text-amber-300">
            <span>🦴</span>
            <span>{gameState.bones}</span>
          </div>
          <button
            onClick={() => setShowWardrobe(!showWardrobe)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold"
          >
            🎀 Outfits
          </button>
          <button
            onClick={toggleSound}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </header>

      {/* 4 Status Bars Sub-HUD */}
      <div className="w-full px-4 py-2 bg-slate-900/90 border-b border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-semibold">
        {/* Hunger */}
        <div className="flex items-center gap-2">
          <span>🍗</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 transition-all duration-200"
              style={{ width: `${gameState.stats.hunger}%` }}
            />
          </div>
        </div>
        {/* Hygiene */}
        <div className="flex items-center gap-2">
          <span>🛁</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-200"
              style={{ width: `${gameState.stats.hygiene}%` }}
            />
          </div>
        </div>
        {/* Happiness */}
        <div className="flex items-center gap-2">
          <span>🎾</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-400 transition-all duration-200"
              style={{ width: `${gameState.stats.happiness}%` }}
            />
          </div>
        </div>
        {/* Energy */}
        <div className="flex items-center gap-2">
          <span>💤</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-200"
              style={{ width: `${gameState.stats.energy}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Puppy Canvas Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onClick={(e) => handlePat(e.clientX, e.clientY)}
          className="w-full h-full max-h-[70vh] object-contain block cursor-pointer"
        />

        {/* Floating Heart Particles on Pat */}
        {patHearts.map((h) => (
          <div
            key={h.id}
            className="absolute text-2xl pointer-events-none animate-bounce"
            style={{ left: h.x - 20, top: h.y - 40 }}
          >
            ❤️
          </div>
        ))}

        {/* Wardrobe Modal */}
        {showWardrobe && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-20">
            <h3 className="text-xl font-bold text-amber-400 mb-4">🎀 Puppy Outfits & Accessories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md w-full mb-5">
              {(['none', 'red_bandana', 'bell_collar', 'detective_hat', 'party_bowtie'] as PuppyAccessory[]).map(
                (acc) => {
                  const isUnlocked = gameState.unlockedAccessories.includes(acc);
                  const isEquipped = gameState.accessory === acc;
                  const cost = ACCESSORY_COSTS[acc];

                  return (
                    <button
                      key={acc}
                      onClick={() => {
                        setGameState((prev) => buyAndEquipAccessory(prev, acc));
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-1 transition ${
                        isEquipped
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                          : isUnlocked
                          ? 'border-slate-700 bg-slate-850 hover:bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-900 opacity-70 hover:opacity-100 text-slate-400'
                      }`}
                    >
                      <span className="text-2xl">
                        {acc === 'red_bandana'
                          ? '🧣'
                          : acc === 'bell_collar'
                          ? '🔔'
                          : acc === 'detective_hat'
                          ? '🕵️'
                          : acc === 'party_bowtie'
                          ? '🎀'
                          : '🐾'}
                      </span>
                      <span className="text-xs capitalize">{acc.replace('_', ' ')}</span>
                      <span className="text-[11px] font-bold text-amber-300">
                        {isEquipped ? '✓ Worn' : isUnlocked ? 'Equip' : `🦴 ${cost}`}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
            <button
              onClick={() => setShowWardrobe(false)}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
            >
              Done
            </button>
          </div>
        )}
      </div>

      {/* Care Activities Action Toolbar */}
      <footer className="w-full px-4 py-3 bg-slate-950 border-t border-slate-800 grid grid-cols-5 gap-2 sm:gap-3 z-10 text-xs font-bold">
        <button
          onClick={() => handleFeed('kibble')}
          className="py-2.5 bg-orange-600 hover:bg-orange-500 active:bg-orange-700 rounded-xl flex flex-col items-center justify-center gap-1 shadow transition active:scale-95"
        >
          <span className="text-base">🍗</span>
          <span>Feed</span>
        </button>

        <button
          onClick={handleWashSoap}
          className="py-2.5 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 rounded-xl flex flex-col items-center justify-center gap-1 shadow transition active:scale-95"
        >
          <span className="text-base">🧼</span>
          <span>Soap</span>
        </button>

        <button
          onClick={handleWashRinse}
          className="py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 rounded-xl flex flex-col items-center justify-center gap-1 shadow transition active:scale-95"
        >
          <span className="text-base">🚿</span>
          <span>Rinse</span>
        </button>

        <button
          onClick={handleThrowBall}
          className="py-2.5 bg-pink-600 hover:bg-pink-500 active:bg-pink-700 rounded-xl flex flex-col items-center justify-center gap-1 shadow transition active:scale-95"
        >
          <span className="text-base">🎾</span>
          <span>Fetch</span>
        </button>

        <button
          onClick={handleSleep}
          className={`py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 shadow transition active:scale-95 ${
            gameState.currentActivity === 'sleeping'
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-purple-600 hover:bg-purple-500'
          }`}
        >
          <span className="text-base">{gameState.currentActivity === 'sleeping' ? '☀️' : '💤'}</span>
          <span>{gameState.currentActivity === 'sleeping' ? 'Wake' : 'Sleep'}</span>
        </button>
      </footer>
    </div>
  );
};

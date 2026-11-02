import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PuppyGameState,
  PuppyAccessory,
} from './logic/types';
import {
  createPuppyGame,
  feedPuppy,
  washPuppy,
  popBubble,
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

interface HudState {
  puppyName: string;
  level: number;
  xp: number;
  maxXp: number;
  bones: number;
  stats: {
    hunger: number;
    hygiene: number;
    happiness: number;
    energy: number;
  };
  currentActivity: PuppyGameState['currentActivity'];
  bubbleCount: number;
  accessory: PuppyAccessory;
  unlockedAccessories: PuppyAccessory[];
}

function extractHud(s: PuppyGameState): HudState {
  return {
    puppyName: s.puppyName,
    level: s.level,
    xp: s.xp,
    maxXp: s.maxXp,
    bones: s.bones,
    stats: { ...s.stats },
    currentActivity: s.currentActivity,
    bubbleCount: s.foamBubbles.length,
    accessory: s.accessory,
    unlockedAccessories: [...s.unlockedAccessories],
  };
}

export const VirtualPuppyPetContainer: React.FC<VirtualPuppyPetProps> = ({ onBack }) => {
  const initial = useRef<PuppyGameState>(createPuppyGame());
  const stateRef = useRef<PuppyGameState>(initial.current);
  const [hudState, setHudState] = useState<HudState>(() => extractHud(initial.current));
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showWardrobe, setShowWardrobe] = useState<boolean>(false);
  const [toast, setToast] = useState<string | null>(null);
  const [patHearts, setPatHearts] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const animFrameIdRef = useRef<number>(0);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
    }, 2400);
  }, []);

  const syncHud = useCallback((state: PuppyGameState) => {
    setHudState(extractHud(state));
  }, []);

  const handleFeed = (food: 'kibble' | 'bone' = 'kibble') => {
    const next = feedPuppy(stateRef.current, food);
    stateRef.current = next;
    puppySound.playEat();
    const event = next.events.find((e) => e.type === 'feed_puppy');
    showToast(event?.text || 'Buster enjoyed his meal! 🍗');
    syncHud(next);
  };

  const handleWashSoap = () => {
    const next = washPuppy(stateRef.current, 'soap');
    stateRef.current = next;
    puppySound.playSplash();
    showToast('Lathered Buster with bubbly soap! Tap Rinse or pop bubbles! 🧼');
    syncHud(next);
  };

  const handleWashRinse = () => {
    const next = washPuppy(stateRef.current, 'rinse');
    stateRef.current = next;
    puppySound.playSplash();
    showToast('Rinsed clean! Buster is squeaky clean! ✨🛁');
    syncHud(next);
  };

  const handleThrowBall = () => {
    const next = throwTennisBall(stateRef.current, 620, 160);
    stateRef.current = next;
    if (next.ballPosition?.isThrown) {
      puppySound.playBallSqueak();
      showToast('Fetch! Go get the tennis ball, Buster! 🎾');
    } else {
      const err = next.events.find((e) => e.type === 'too_tired');
      showToast(err?.text || 'Buster is too sleepy! 💤');
    }
    syncHud(next);
  };

  const handleSleep = () => {
    const next = restPuppy(stateRef.current);
    stateRef.current = next;
    if (next.currentActivity === 'sleeping') {
      puppySound.playLullaby();
      showToast('Shh... Buster is taking a cozy nap! 💤');
    } else {
      puppySound.playBark();
      showToast('Good morning, Buster! ☀️ Ready to play!');
    }
    syncHud(next);
  };

  const handlePat = (clientX: number, clientY: number) => {
    puppySound.playBark();
    const id = Date.now() + Math.random();
    setPatHearts((prev) => [...prev, { id, x: clientX, y: clientY }]);
    setTimeout(() => {
      setPatHearts((prev) => prev.filter((h) => h.id !== id));
    }, 1000);

    const prev = stateRef.current;
    const next: PuppyGameState = {
      ...prev,
      stats: {
        ...prev.stats,
        happiness: Math.min(100, prev.stats.happiness + 8),
      },
    };
    stateRef.current = next;
    showToast('Buster loved the gentle pat! ❤️');
    syncHud(next);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 500 / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    const current = stateRef.current;

    // Check if clicked any foam bubble
    if (current.foamBubbles.length > 0) {
      const bubbleIndex = current.foamBubbles.findIndex((b) => {
        const dx = clickX - b.x;
        const dy = clickY - b.y;
        return Math.sqrt(dx * dx + dy * dy) <= b.size + 16;
      });

      if (bubbleIndex >= 0) {
        const popped = current.foamBubbles[bubbleIndex];
        const next = popBubble(current, popped.id);
        stateRef.current = next;
        puppySound.playPop();
        showToast('Pop! 🫧 +2 Hygiene!');
        syncHud(next);
        return;
      }
    }

    // Check if clicked on Buster (center 400, 350; radius 95)
    const distToBuster = Math.hypot(clickX - 400, clickY - 350);
    if (distToBuster < 95) {
      handlePat(e.clientX, e.clientY);
      return;
    }

    // If clicked elsewhere in room and not sleeping, throw ball to that spot
    if (current.currentActivity !== 'sleeping') {
      const next = throwTennisBall(current, clickX, clickY);
      stateRef.current = next;
      if (next.ballPosition?.isThrown) {
        puppySound.playBallSqueak();
        showToast('Fetch! Go get it, Buster! 🎾');
      }
      syncHud(next);
    }
  };

  const toggleSound = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      puppySound.setMuted(next);
      return next;
    });
  }, []);

  // Main 60 FPS animation loop — strictly reads & updates stateRef, decoupled from React setState
  useEffect(() => {
    lastTimeRef.current = performance.now();
    let hudTimer = 0;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const current = stateRef.current;
      const next = updatePuppyGame(current, dt);
      stateRef.current = next;

      if (next.events && next.events.length > 0) {
        for (const evt of next.events) {
          if (evt.type === 'level_up') {
            puppySound.playLevelUp();
            showToast(evt.text || 'Buster Leveled Up! 🎉');
          }
        }
      }

      renderCanvas(next);

      // Sync React HUD state at ~4Hz (every 250ms) to eliminate RAF re-render thrashing
      hudTimer += dt;
      if (hudTimer >= 0.25) {
        hudTimer = 0;
        syncHud(next);
      }

      animFrameIdRef.current = requestAnimationFrame(loop);
    };

    animFrameIdRef.current = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animFrameIdRef.current);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [showToast, syncHud]);

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

    // Soapy foam bubbles on Buster's body and ears (centered, bobbing with breathing)
    state.foamBubbles.forEach((b) => {
      const bubbleRelX = b.x - pupX;
      const bubbleRelY = b.y - pupY + breathe * 0.4;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.78)';
      ctx.beginPath();
      ctx.arc(bubbleRelX, bubbleRelY, b.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(125, 211, 252, 0.85)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Shiny highlight on bubble
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.beginPath();
      ctx.arc(bubbleRelX - b.size * 0.3, bubbleRelY - b.size * 0.3, b.size * 0.28, 0, Math.PI * 2);
      ctx.fill();
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
            <span>{hudState.puppyName}</span>
            <span className="text-slate-400 font-normal">Lv.{hudState.level}</span>
          </div>
        </div>

        {/* XP Bar */}
        <div className="flex-1 max-w-xs mx-4 hidden sm:block">
          <div className="flex justify-between text-[11px] text-slate-300 mb-0.5 font-bold">
            <span>FRIENDSHIP XP</span>
            <span>{hudState.xp} / {hudState.maxXp}</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 transition-all duration-150"
              style={{ width: `${Math.min(100, (hudState.xp / hudState.maxXp) * 100)}%` }}
            />
          </div>
        </div>

        {/* Bones currency & Wardrobe button */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 font-bold text-amber-300">
            <span>🦴</span>
            <span>{hudState.bones}</span>
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
              style={{ width: `${hudState.stats.hunger}%` }}
            />
          </div>
        </div>
        {/* Hygiene */}
        <div className="flex items-center gap-2">
          <span>🛁</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-200"
              style={{ width: `${hudState.stats.hygiene}%` }}
            />
          </div>
        </div>
        {/* Happiness */}
        <div className="flex items-center gap-2">
          <span>🎾</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-pink-400 transition-all duration-200"
              style={{ width: `${hudState.stats.happiness}%` }}
            />
          </div>
        </div>
        {/* Energy */}
        <div className="flex items-center gap-2">
          <span>💤</span>
          <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-400 transition-all duration-200"
              style={{ width: `${hudState.stats.energy}%` }}
            />
          </div>
        </div>
      </div>

      {/* Toast Notification Banner */}
      {toast && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-950/90 border border-amber-400/50 text-amber-200 text-xs sm:text-sm font-semibold rounded-full shadow-xl pointer-events-none z-30 backdrop-blur-md animate-bounce">
          {toast}
        </div>
      )}

      {/* Main Puppy Canvas Area */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-950">
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          onClick={handleCanvasClick}
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
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-20">
            <h3 className="text-xl font-bold text-amber-400 mb-4">🎀 Puppy Outfits & Accessories</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-md w-full mb-5">
              {(['none', 'red_bandana', 'bell_collar', 'detective_hat', 'party_bowtie'] as PuppyAccessory[]).map(
                (acc) => {
                  const isUnlocked = hudState.unlockedAccessories.includes(acc);
                  const isEquipped = hudState.accessory === acc;
                  const cost = ACCESSORY_COSTS[acc];

                  return (
                    <button
                      key={acc}
                      onClick={() => {
                        const next = buyAndEquipAccessory(stateRef.current, acc);
                        stateRef.current = next;
                        syncHud(next);
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
          className={`py-2.5 rounded-xl flex flex-col items-center justify-center gap-1 shadow transition active:scale-95 ${
            hudState.bubbleCount > 0
              ? 'bg-sky-500 ring-2 ring-cyan-300 animate-pulse text-white'
              : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white'
          }`}
        >
          <div className="relative">
            <span className="text-base">🚿</span>
            {hudState.bubbleCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 bg-cyan-300 text-slate-950 text-[10px] px-1 rounded-full font-black">
                {hudState.bubbleCount}
              </span>
            )}
          </div>
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
            hudState.currentActivity === 'sleeping'
              ? 'bg-amber-600 hover:bg-amber-500'
              : 'bg-purple-600 hover:bg-purple-500'
          }`}
        >
          <span className="text-base">{hudState.currentActivity === 'sleeping' ? '☀️' : '💤'}</span>
          <span>{hudState.currentActivity === 'sleeping' ? 'Wake' : 'Sleep'}</span>
        </button>
      </footer>
    </div>
  );
};

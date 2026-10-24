import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialMartState,
  updateMartGame,
  upgradePlayerSpeed,
  upgradePlayerCapacity,
  saveMartState,
  loadMartState,
  isPadVisible,
  MartGameState,
  PRODUCTS,
  WORLD_BOUNDS,
  ProductType,
  ProductionPlot,
  Shelf,
  CashRegister,
  UnlockPad,
  Customer,
  HelperWorker,
  FloatingNotification,
  PlayerState,
} from './logic/engine';
import { farmMartAudio } from './systems/sound';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Zap,
  ShoppingBag,
  Store,
  UserCheck,
  X,
  HelpCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

interface DustParticle {
  x: number;
  y: number;
  r: number;
  alpha: number;
}

export const FarmMiniMartContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<MartGameState>(() => {
    return loadMartState() || createInitialMartState();
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => farmMartAudio.getMuted());
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);
  const [showTouchDpad, setShowTouchDpad] = useState<boolean>(false);

  // Input state
  const inputRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Touch joystick state
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const [touchActive, setTouchActive] = useState<boolean>(false);

  // Trailing dust particles for running capsule dummy
  const dustParticlesRef = useRef<DustParticle[]>([]);

  // Sync state reference for animation loop
  const stateRef = useRef<MartGameState>(gameState);
  stateRef.current = gameState;

  // Sound toggle
  const toggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    farmMartAudio.setMuted(nextMuted);
    try {
      localStorage.setItem('pawcade_sound_muted', String(nextMuted));
    } catch {}
  }, [isMuted]);

  // Restart / Reset market
  const handleReset = useCallback(() => {
    if (window.confirm('Reset your farm mini mart and restart from scratch?')) {
      const fresh = createInitialMartState();
      setGameState(fresh);
      saveMartState(fresh);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        activeKeysRef.current.add(e.code);
      }
      if (e.code === 'KeyU') {
        setShowUpgradeModal((prev) => !prev);
      }
      if (e.code === 'KeyM') {
        toggleSound();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeysRef.current.delete(e.code);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [toggleSound]);

  // Pointer / Touch Joystick Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}

    touchOriginRef.current = { x, y };
    touchCurrentRef.current = { x, y };
    setTouchActive(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !touchOriginRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 800 / rect.width;
    const scaleY = 600 / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    touchCurrentRef.current = { x, y };

    const dx = x - touchOriginRef.current.x;
    const dy = y - touchOriginRef.current.y;
    const dist = Math.hypot(dx, dy);
    const maxRadius = 45;

    if (dist > 5) {
      inputRef.current = {
        dx: dx / Math.max(dist, maxRadius),
        dy: dy / Math.max(dist, maxRadius),
      };
    } else {
      inputRef.current = { dx: 0, dy: 0 };
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {}
    touchOriginRef.current = null;
    touchCurrentRef.current = null;
    setTouchActive(false);
    inputRef.current = { dx: 0, dy: 0 };
  };

  // Virtual D-Pad buttons for accessible mobile navigation
  const setDpadDir = useCallback((dx: number, dy: number) => {
    inputRef.current = { dx, dy };
  }, []);

  // Main 60 FPS Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();
    let saveTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(now - lastTime, 100);
      lastTime = now;

      // Calculate keyboard input vector
      let kx = 0;
      let ky = 0;
      const keys = activeKeysRef.current;
      if (keys.has('ArrowLeft') || keys.has('KeyA')) kx -= 1;
      if (keys.has('ArrowRight') || keys.has('KeyD')) kx += 1;
      if (keys.has('ArrowUp') || keys.has('KeyW')) ky -= 1;
      if (keys.has('ArrowDown') || keys.has('KeyS')) ky += 1;

      let currentInput = inputRef.current;
      if (Math.abs(kx) > 0 || Math.abs(ky) > 0) {
        const len = Math.hypot(kx, ky);
        currentInput = { dx: kx / len, dy: ky / len };
      }

      // Step simulation
      const { nextState, events } = updateMartGame(stateRef.current, dt, currentInput);
      stateRef.current = nextState;

      // Trigger audio events
      for (const ev of events) {
        if (ev === 'harvest') farmMartAudio.playHarvestSound();
        else if (ev === 'stock') farmMartAudio.playStockSound();
        else if (ev === 'coin_deposit') farmMartAudio.playCoinDepositSound();
        else if (ev === 'unlock_station') farmMartAudio.playUnlockSound();
        else if (ev === 'kaching') farmMartAudio.playKachingSound();
        else if (ev === 'coin_pickup') farmMartAudio.playCoinPickupSound();
      }

      // Update trailing dust particles when moving
      const moving = Math.hypot(currentInput.dx, currentInput.dy) > 0.05;
      if (moving && Math.random() < 0.45) {
        dustParticlesRef.current.push({
          x: nextState.player.x + (Math.random() - 0.5) * 6,
          y: nextState.player.y + 12 + (Math.random() - 0.5) * 3,
          r: 2.5 + Math.random() * 2,
          alpha: 0.65,
        });
      }
      for (let i = dustParticlesRef.current.length - 1; i >= 0; i--) {
        const p = dustParticlesRef.current[i]!;
        p.r += 0.22;
        p.alpha -= 0.035;
        if (p.alpha <= 0) {
          dustParticlesRef.current.splice(i, 1);
        }
      }

      // Periodic state sync to React & LocalStorage every 1.5 seconds
      saveTimer += dt;
      if (saveTimer > 1500) {
        saveTimer = 0;
        setGameState(nextState);
        saveMartState(nextState);
      }

      // Render onto 2D Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderMartScene(
            ctx,
            nextState,
            now,
            touchOriginRef.current,
            touchCurrentRef.current,
            moving,
            dustParticlesRef.current
          );
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(animId);
      saveMartState(stateRef.current);
    };
  }, []);

  // Upgrades
  const handleUpgradeSpeed = () => {
    const res = upgradePlayerSpeed(stateRef.current);
    if (res.success) {
      farmMartAudio.playUnlockSound();
      setGameState(res.nextState);
      saveMartState(res.nextState);
    }
  };

  const handleUpgradeCapacity = () => {
    const res = upgradePlayerCapacity(stateRef.current);
    if (res.success) {
      farmMartAudio.playUnlockSound();
      setGameState(res.nextState);
      saveMartState(res.nextState);
    }
  };

  // Determine current active objective / guidance tip for player
  const currentObjective = getActiveObjective(gameState);

  return (
    <div className="relative w-full flex flex-col items-center select-none touch-none max-w-4xl mx-auto">
      {/* 1. TOP FARM MART HUD (Banknotes / Cash Theme) */}
      <div className="w-full bg-slate-900/95 border border-emerald-500/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-2xl flex items-center justify-between shadow-xl gap-2">
        {/* Left: Cash Banknotes Balance & Reputation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-600/30 to-green-500/20 border-2 border-emerald-400/60 px-3 py-1.5 rounded-xl text-emerald-300 font-black text-sm sm:text-base shadow-lg shadow-emerald-500/10 min-h-[44px]">
            <span className="text-lg sm:text-xl shrink-0 animate-bounce">💵</span>
            <span className="font-mono text-white text-base sm:text-lg">${gameState.player.coins}</span>
            <span className="text-[10px] sm:text-xs text-emerald-300 font-bold uppercase tracking-wider hidden xs:inline">CASH</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300">
            <Store className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mini Mart Lvl {gameState.reputationLevel}</span>
          </div>
        </div>

        {/* Center: Live Dynamic Objective Helper Pill */}
        <div className="flex-1 mx-1 sm:mx-2 max-w-md hidden md:flex items-center justify-center">
          <div className="w-full bg-slate-800/90 border border-emerald-400/40 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
            <span className="text-base shrink-0">{currentObjective.icon}</span>
            <span className="text-xs font-black text-emerald-200 truncate">{currentObjective.text}</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm px-3 py-2 rounded-xl shadow-lg shadow-emerald-500/20 cursor-pointer transition-transform active:scale-95 min-h-[44px]"
            title="Open Upgrades Shop (U)"
          >
            <Sparkles className="w-4 h-4 shrink-0 fill-current" />
            <span className="hidden xs:inline tracking-wider">UPGRADES</span>
            <span className="xs:hidden">UPG</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
            title="How to Play"
            aria-label="How to play"
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
            title={isMuted ? 'Unmute Sound (M)' : 'Mute Sound (M)'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={handleReset}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-95"
            title="Reset Game"
            aria-label="Reset Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Quest Pill (shown on smaller screens) */}
      <div className="w-full md:hidden bg-slate-900 border-x border-emerald-500/30 px-3 py-1.5 flex items-center gap-2">
        <span className="text-base shrink-0">{currentObjective.icon}</span>
        <span className="text-xs font-black text-emerald-200 truncate">{currentObjective.text}</span>
      </div>

      {/* 2. MAIN CANVAS VIEWPORT (800x600 coordinate world) */}
      <div className="relative w-full bg-[#92e434] border border-emerald-500/30 shadow-2xl overflow-hidden aspect-[4/3] rounded-b-2xl touch-none overscroll-none select-none">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block cursor-pointer touch-none select-none"
        />

        {/* Floating Touch Guidance on Canvas */}
        {!touchActive && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-emerald-300 border border-emerald-500/40 flex items-center gap-2 shadow-lg animate-pulse">
            <span>👆 Drag thumb anywhere to walk!</span>
          </div>
        )}

        {/* Toggle D-Pad Pill on Mobile */}
        <div className="sm:hidden absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowTouchDpad((prev) => !prev)}
            className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 cursor-pointer touch-none"
          >
            {showTouchDpad ? 'Hide D-Pad' : 'Show D-Pad'}
          </button>
        </div>
      </div>

      {/* Optional Ergonomic Mobile D-Pad Buttons (Continuous Touch Navigation) */}
      {showTouchDpad && (
        <div className="w-full flex justify-center py-2 bg-slate-900/90 border border-slate-800 rounded-xl mt-2 select-none touch-none overscroll-none">
          <div className="grid grid-cols-3 gap-2 w-48 touch-none">
            <div />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                setDpadDir(0, -1);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                setDpadDir(0, 0);
              }}
              onPointerCancel={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-emerald-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow touch-none select-none"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div />
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                setDpadDir(-1, 0);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                setDpadDir(0, 0);
              }}
              onPointerCancel={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-emerald-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow touch-none select-none"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                setDpadDir(0, 1);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                setDpadDir(0, 0);
              }}
              onPointerCancel={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-emerald-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow touch-none select-none"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <button
              onPointerDown={(e) => {
                e.preventDefault();
                try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
                setDpadDir(1, 0);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
                setDpadDir(0, 0);
              }}
              onPointerCancel={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-emerald-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow touch-none select-none"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 3. UPGRADES MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🏪</span>
                <div>
                  <h3 className="text-xl font-black text-emerald-400">Mini Mart Upgrades</h3>
                  <p className="text-xs text-slate-400">Boost walking speed & carried produce capacity</p>
                </div>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Speed Upgrade */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-sm text-white">Walking Speed (Lvl {gameState.player.speedLevel})</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Move faster around your farm & market (+15%)</p>
                </div>
                <button
                  onClick={handleUpgradeSpeed}
                  disabled={gameState.player.coins < 25 * gameState.player.speedLevel}
                  className={`px-4 py-2 rounded-xl font-black text-xs min-h-[44px] flex items-center gap-1 cursor-pointer transition-all ${
                    gameState.player.coins >= 25 * gameState.player.speedLevel
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>${25 * gameState.player.speedLevel} 💵</span>
                </button>
              </div>

              {/* Capacity Upgrade */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-cyan-400" />
                    <span className="font-extrabold text-sm text-white">Backpack Capacity (Lvl {gameState.player.capacityLevel})</span>
                    <span className="text-xs bg-slate-700 text-emerald-300 font-mono px-2 py-0.5 rounded-full font-bold">
                      {gameState.player.capacity} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Carry more harvest produce at once (+2)</p>
                </div>
                <button
                  onClick={handleUpgradeCapacity}
                  disabled={gameState.player.coins < 30 * gameState.player.capacityLevel}
                  className={`px-4 py-2 rounded-xl font-black text-xs min-h-[44px] flex items-center gap-1 cursor-pointer transition-all ${
                    gameState.player.coins >= 30 * gameState.player.capacityLevel
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>${30 * gameState.player.capacityLevel} 💵</span>
                </button>
              </div>

              {/* Helper Dog Status */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🐶</span>
                    <span className="font-extrabold text-sm text-white">Farmhand Dog (Barnaby)</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gameState.helper.unlocked ? 'Working autonomously on farm!' : 'Unlock pad in pasture yard (80 💵)'}
                  </p>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${gameState.helper.unlocked ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-700 text-slate-400'}`}>
                  {gameState.helper.unlocked ? 'HIRED ✅' : 'LOCKED 🔒'}
                </span>
              </div>

              {/* Cashier Status */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-400" />
                    <span className="font-extrabold text-sm text-white">Register Cashier</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gameState.register.hasCashier ? 'Auto-serves all customers!' : 'Unlock pad beside counter (140 💵)'}
                  </p>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${gameState.register.hasCashier ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-700 text-slate-400'}`}>
                  {gameState.register.hasCashier ? 'HIRED ✅' : 'LOCKED 🔒'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl cursor-pointer min-h-[44px] shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
            >
              Resume Farming 🚜
            </button>
          </div>
        </div>
      )}

      {/* 4. HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📖</span>
                <div>
                  <h3 className="text-xl font-black text-emerald-400">How to Play Farm Mini Mart</h3>
                  <p className="text-xs text-slate-400">Build the best animal farm market in town!</p>
                </div>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-200">
              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🍅</span>
                <div>
                  <strong className="text-emerald-300">1. Harvest Crops:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Walk near ripe plots (Tomatoes, Corn, Eggs, Milk, Pumpkins) to collect them in your carried backpack stack.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">📦</span>
                <div>
                  <strong className="text-emerald-300">2. Restock Shelves:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Walk to matching display tables in the market with the glowing yellow arrow ⬇️ to stock fresh produce.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🐰</span>
                <div>
                  <strong className="text-emerald-300">3. Serve Animal Customers:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Cute animal capsule customers enter the shop, take items from tables, and line up at the turquoise checkout counter.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">💵</span>
                <div>
                  <strong className="text-emerald-300">4. Cash Out & Collect:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Stand on the glowing Cashier Mat behind the register to ring up customers. Green cash banknote stacks drop on the counter and are magnetically collected!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🌟</span>
                <div>
                  <strong className="text-emerald-300">5. Unlock & Automate:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Stand on yellow unlock pads to deposit cash and unlock new crop planter beds, tables, the Farmhand Dog 🐶, and Register Cashier 🧑‍💼.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl cursor-pointer min-h-[44px] shadow-lg shadow-emerald-500/25 active:scale-98 transition-all"
            >
              Let's Farm! 🚜
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Computes the smartest current actionable objective for the player
 */
function getActiveObjective(state: MartGameState): { icon: string; text: string } {
  // 1. If cash banknotes are sitting on the counter, collect them!
  if (state.register.coinsOnCounter > 0) {
    return {
      icon: '💵',
      text: `$${state.register.coinsOnCounter} CASH READY! Walk to Cash Register to collect your earnings!`,
    };
  }

  // 2. If customer is waiting at register and player has no cashier
  const queueLeader = state.customers.find((c) => c.state === 'in_queue');
  if (queueLeader && !state.register.hasCashier) {
    return {
      icon: '🔔',
      text: `Customer waiting! Stand on the Cashier Mat behind register to checkout!`,
    };
  }

  // 3. If player is carrying crops and a shelf needs stock
  if (state.player.stack.length > 0) {
    const carriedProduct = state.player.stack[state.player.stack.length - 1];
    const targetShelf = state.shelves.find((s) => s.unlocked && s.product === carriedProduct);
    if (targetShelf) {
      return {
        icon: '📦',
        text: `Walk to ${targetShelf.name} to restock ${PRODUCTS[carriedProduct].emoji} produce!`,
      };
    }
  }

  // 4. If an unlocked shelf is empty or low on stock
  const emptyShelf = state.shelves.find((s) => s.unlocked && s.currentStock < s.maxStock / 2);
  if (emptyShelf) {
    const matchingPlot = state.plots.find((p) => p.unlocked && p.product === emptyShelf.product);
    if (matchingPlot && matchingPlot.readyCount > 0) {
      return {
        icon: '🍅',
        text: `Harvest ripe ${matchingPlot.name} crops on the farm to restock ${emptyShelf.name}!`,
      };
    }
  }

  // 5. If player has enough cash to unlock next station
  const affordablePad = state.unlockPads.find(
    (pad) => !pad.unlocked && isPadVisible(pad, state) && state.player.coins >= pad.cost - pad.paid
  );
  if (affordablePad) {
    return {
      icon: '🔓',
      text: `Stand on yellow pad to unlock ${affordablePad.title}! ($${affordablePad.cost - affordablePad.paid} 💵)`,
    };
  }

  const nextVisiblePad = state.unlockPads.find((pad) => !pad.unlocked && isPadVisible(pad, state));
  if (nextVisiblePad) {
    return {
      icon: '🎯',
      text: `Goal: Save $${nextVisiblePad.cost - nextVisiblePad.paid} 💵 to unlock ${nextVisiblePad.title}!`,
    };
  }

  // Default: Harvest and keep shelves full
  return {
    icon: '🌾',
    text: 'Harvest crops, stock display tables, and serve animal customers!',
  };
}

/**
 * Procedural Canvas 2D scene renderer for Farm Mini Mart (My Mini Mart 2.5D Style)
 * Delivers bright sunny lime grass, warm peach store floor, glass architecture,
 * turquoise counter, wooden tables, raised planter beds, cash stacks, and capsule dummy characters!
 */
function renderMartScene(
  ctx: CanvasRenderingContext2D,
  state: MartGameState,
  time: number,
  touchOrigin: { x: number; y: number } | null,
  touchCurrent: { x: number; y: number } | null,
  isMoving: boolean,
  dustParticles: DustParticle[]
) {
  ctx.save();
  ctx.clearRect(0, 0, 800, 600);

  // 1. OUTDOOR SUNNY LIME GREEN PASTURE (My Mini Mart bright lawn)
  ctx.fillStyle = '#92e434'; // Bright sunny lime green lawn
  ctx.fillRect(0, 0, 800, 600);

  // Subtle checkered lawn stripes
  ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
  for (let x = 0; x < 800; x += 40) {
    for (let y = 0; y < 600; y += 40) {
      if ((x / 40 + y / 40) % 2 === 0) {
        ctx.fillRect(x, y, 40, 40);
      }
    }
  }

  // Outdoor paved pathway to shop entrance
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.roundRect(415, 285, 60, 270, 8);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Paved path horizontal joints
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  for (let py = 310; py < 550; py += 25) {
    ctx.beginPath();
    ctx.moveTo(418, py);
    ctx.lineTo(472, py);
    ctx.stroke();
  }

  // 2. INDOOR STORE AREA (Warm peach/sand tile floor, glass walls, office room, entrance canopy)
  renderModernStoreArchitecture(ctx, time);

  // 3. CASHIER MAT (Dedicated Zone Behind Register Counter)
  renderCashierMat(ctx, state.register, time);

  // 4. TURQUOISE CHECKOUT COUNTER & CASH REGISTER
  renderTurquoiseCounter(ctx, state.register, time);

  // 5. PRODUCTION PLOTS (Raised wooden planter beds & Chicken coop)
  for (const plot of state.plots) {
    if (!plot.unlocked) continue;
    renderProductionPlot(ctx, plot, time);
  }

  // 6. DISPLAY TABLES (Market shelves with floating deposit arrows)
  for (const shelf of state.shelves) {
    if (!shelf.unlocked) continue;
    renderDisplayTable(ctx, shelf, time);
  }

  // 7. UNLOCK PADS (Progressive Disclosure)
  for (const pad of state.unlockPads) {
    if (pad.unlocked || !isPadVisible(pad, state)) continue;
    renderUnlockPad(ctx, pad, time);
  }

  // 8. DUST PUFF PARTICLES (From running capsule characters)
  for (const p of dustParticles) {
    ctx.save();
    ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 9. HELPER WORKER (Barnaby Dog)
  if (state.helper.unlocked) {
    renderHelperWorker(ctx, state.helper, time);
  }

  // 10. ANIMAL CUSTOMERS (Pastel Capsule Dummies)
  for (const cust of state.customers) {
    renderCustomerDummy(ctx, cust, time);
  }

  // 11. THE HERO PLAYER (Blue Capsule Dummy with dynamic tilt and carried stack)
  renderPlayerDummy(ctx, state.player, time, isMoving);

  // 12. FLOATING NOTIFICATIONS (Cash popups & unlocks)
  for (const note of state.floatingNotes) {
    renderFloatingNote(ctx, note);
  }

  // 13. FLOATING ANALOG JOYSTICK (On touch drag)
  if (touchOrigin && touchCurrent) {
    renderFloatingJoystick(ctx, touchOrigin, touchCurrent);
  }

  ctx.restore();
}

/**
 * 2. Modern Store Architecture: Peach tile floor, Glass Walls, Office room, Striped Awning
 */
function renderModernStoreArchitecture(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();
  const storeX = 220;
  const storeY = 20;
  const storeW = 450;
  const storeH = 270;

  // Store floor shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.beginPath();
  ctx.roundRect(storeX - 3, storeY - 3, storeW + 6, storeH + 6, 12);
  ctx.fill();

  // Peach / Sand Warm Tiled Floor Base
  ctx.fillStyle = '#fed7aa';
  ctx.beginPath();
  ctx.roundRect(storeX, storeY, storeW, storeH, 10);
  ctx.fill();

  // Floor grid tiles
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.18)';
  ctx.lineWidth = 1;
  for (let x = storeX; x <= storeX + storeW; x += 30) {
    ctx.beginPath();
    ctx.moveTo(x, storeY);
    ctx.lineTo(x, storeY + storeH);
    ctx.stroke();
  }
  for (let y = storeY; y <= storeY + storeH; y += 30) {
    ctx.beginPath();
    ctx.moveTo(storeX, y);
    ctx.lineTo(storeX + storeW, y);
    ctx.stroke();
  }

  // TOP-LEFT OFFICE ROOM PARTITION (As seen in Screenshot 1)
  const officeW = 85;
  const officeH = 175;
  ctx.fillStyle = 'rgba(254, 215, 170, 0.5)';
  ctx.fillRect(storeX, storeY, officeW, officeH);

  // Office interior desk & computer
  ctx.fillStyle = '#92400e'; // Desk
  ctx.fillRect(storeX + 15, storeY + 45, 50, 24);
  ctx.fillStyle = '#0f172a'; // Monitor base
  ctx.fillRect(storeX + 32, storeY + 48, 16, 12);
  ctx.fillStyle = '#38bdf8'; // Glowing PC screen
  ctx.fillRect(storeX + 34, storeY + 50, 12, 8);
  // Swivel Chair
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.arc(storeX + 40, storeY + 80, 8, 0, Math.PI * 2);
  ctx.fill();
  // Indoor potted plant
  ctx.font = '16px sans-serif';
  ctx.fillText('🪴', storeX + 20, storeY + 145);

  // Office Glass Divider Wall
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(storeX + officeW, storeY);
  ctx.lineTo(storeX + officeW, storeY + officeH);
  ctx.stroke();
  // Horizontal office wall with door gap
  ctx.beginPath();
  ctx.moveTo(storeX, storeY + officeH);
  ctx.lineTo(storeX + 45, storeY + officeH);
  ctx.stroke();

  // EXTERIOR STORE GLASS WALLS (Translucent with white/cyan trim)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 4;
  // Top glass wall
  ctx.beginPath();
  ctx.moveTo(storeX, storeY);
  ctx.lineTo(storeX + storeW, storeY);
  ctx.stroke();
  // Left glass wall
  ctx.beginPath();
  ctx.moveTo(storeX, storeY);
  ctx.lineTo(storeX, storeY + storeH);
  ctx.stroke();
  // Right glass wall
  ctx.beginPath();
  ctx.moveTo(storeX + storeW, storeY);
  ctx.lineTo(storeX + storeW, storeY + storeH);
  ctx.stroke();

  // Front glass wall left section
  ctx.beginPath();
  ctx.moveTo(storeX, storeY + storeH);
  ctx.lineTo(385, storeY + storeH);
  ctx.stroke();

  // Front glass wall right section
  ctx.beginPath();
  ctx.moveTo(505, storeY + storeH);
  ctx.lineTo(storeX + storeW, storeY + storeH);
  ctx.stroke();

  // Cyan glass base accent
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(storeX, storeY, storeW, storeH);

  // ENTRANCE AWNING (Red & White Striped Canopy over entrance)
  const canopyX = 380;
  const canopyY = 280;
  const canopyW = 130;
  const canopyH = 20;

  // Shadow under awning
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.fillRect(canopyX, canopyY + canopyH, canopyW, 6);

  // Awning stripes
  const stripeW = 13;
  const stripeCount = Math.floor(canopyW / stripeW);
  for (let s = 0; s < stripeCount; s++) {
    ctx.fillStyle = s % 2 === 0 ? '#ef4444' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(canopyX + s * stripeW, canopyY, stripeW, canopyH, [3, 3, 5, 5]);
    ctx.fill();
  }

  // Welcome banner text
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#b91c1c';
  ctx.lineWidth = 2;
  ctx.font = 'black 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText('MINI MART 🛒', canopyX + canopyW / 2, canopyY + 13);
  ctx.fillText('MINI MART 🛒', canopyX + canopyW / 2, canopyY + 13);

  ctx.restore();
}

/**
 * 3. Cashier Mat behind the register counter
 */
function renderCashierMat(ctx: CanvasRenderingContext2D, reg: CashRegister, time: number) {
  ctx.save();
  const matX = reg.x;
  const matY = reg.y - 56;
  const matW = reg.width;
  const matH = 52;

  const matPulse = Math.sin(time * 0.006) * 0.15 + 0.85;
  ctx.fillStyle = `rgba(234, 179, 8, ${0.18 * matPulse})`;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.roundRect(matX, matY, matW, matH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // Footprints on the mat
  ctx.fillStyle = '#ca8a04';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👟 STAND HERE 👟', matX + matW / 2, matY + 22);
  ctx.fillStyle = '#713f12';
  ctx.font = 'bold 8px sans-serif';
  ctx.fillText('CASHIER DESK', matX + matW / 2, matY + 38);
  ctx.restore();
}

/**
 * 4. Turquoise Checkout Counter & Cash Register (My Mini Mart Curved Turquoise Design)
 */
function renderTurquoiseCounter(ctx: CanvasRenderingContext2D, reg: CashRegister, time: number) {
  ctx.save();
  // Counter drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.roundRect(reg.x - 2, reg.y + 4, reg.width + 4, reg.height, 10);
  ctx.fill();

  // Dark Cyan Base
  ctx.fillStyle = '#0891b2';
  ctx.beginPath();
  ctx.roundRect(reg.x, reg.y, reg.width, reg.height, 10);
  ctx.fill();

  // Modern Curved Turquoise Top Counter Surface
  ctx.fillStyle = '#22d3ee';
  ctx.beginPath();
  ctx.roundRect(reg.x, reg.y, reg.width, reg.height - 8, [10, 10, 4, 4]);
  ctx.fill();

  // Specular top highlight strip
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(reg.x + 8, reg.y + 3, reg.width - 16, 3);

  // Black POS Touchscreen Terminal
  const posX = reg.x + reg.width / 2 - 14;
  const posY = reg.y + 6;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(posX, posY, 28, 20, 4);
  ctx.fill();
  // Glowing POS Screen
  ctx.fillStyle = '#10b981';
  ctx.fillRect(posX + 3, posY + 3, 22, 10);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 7px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$ PAY', posX + 14, posY + 10);

  // Barcode scanner
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(posX - 12, posY + 8, 8, 4);

  // Counter Front Badge
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText('CHECKOUT', reg.x + reg.width / 2, reg.y + reg.height - 2);

  // Auto-Cashier Capsule Dummy (when hired)
  if (reg.hasCashier) {
    renderMiniMartDummy(ctx, reg.x + reg.width / 2, reg.y - 12, {
      color: '#a855f7', // Purple cashier uniform
      tilt: 0,
      walkPhase: 0,
      isMoving: false,
    });
    // Cashier visor/nametag
    ctx.fillStyle = '#22d3ee';
    ctx.font = 'bold 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CASHIER', reg.x + reg.width / 2, reg.y - 32);
  }

  // GREEN 3D CASH BANKNOTE STACKS ON COUNTER
  if (reg.coinsOnCounter > 0) {
    const cashPileX = reg.x + reg.width + 24;
    const cashPileY = reg.y + 20;

    // Glowing collection ring
    const coinPulse = Math.sin(time * 0.008) * 3;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.beginPath();
    ctx.arc(cashPileX, cashPileY, 28 + coinPulse, 0, Math.PI * 2);
    ctx.fill();

    // 3D Banknote Stacks
    renderBanknoteStack(ctx, cashPileX, cashPileY, reg.coinsOnCounter);

    // Floating Cash Amount Badge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cashPileX - 32, cashPileY - 32, 64, 20, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`+$${reg.coinsOnCounter} 💵`, cashPileX, cashPileY - 18);
  }

  // Customer queue footprints on floor heading south
  for (let i = 0; i < WORLD_BOUNDS.checkoutSpots.length; i++) {
    const spot = WORLD_BOUNDS.checkoutSpots[i]!;
    ctx.fillStyle = 'rgba(217, 119, 6, 0.2)';
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(120, 53, 15, 0.6)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, spot.x, spot.y + 3);
  }

  ctx.restore();
}

/**
 * Renders 3D bundles of green cash banknotes (💵)
 */
function renderBanknoteStack(ctx: CanvasRenderingContext2D, x: number, y: number, count: number) {
  ctx.save();
  const stackLayers = Math.min(5, Math.max(1, Math.floor(count / 5)));
  for (let s = 0; s < stackLayers; s++) {
    const sy = y + 8 - s * 5;
    // Banknote drop shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
    ctx.fillRect(x - 15, sy - 5, 30, 14);

    // Green banknote bill
    ctx.fillStyle = '#15803d'; // Rich dollar green
    ctx.beginPath();
    ctx.roundRect(x - 14, sy - 7, 28, 12, 2);
    ctx.fill();

    // Inner green border
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.stroke();

    // White paper currency belly band
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(x - 4, sy - 7, 8, 12);

    // Dollar symbol on band
    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', x, sy + 2);
  }
  ctx.restore();
}

/**
 * 5. Production Plots: Raised Planter Beds, Chicken Coop, Dairy Pasture
 */
function renderProductionPlot(ctx: CanvasRenderingContext2D, plot: ProductionPlot, time: number) {
  ctx.save();

  if (plot.product === 'egg') {
    // CHICKEN COOP (Split-Rail Fence, Golden Straw, Hens)
    renderChickenCoop(ctx, plot, time);
    ctx.restore();
    return;
  }

  if (plot.product === 'milk') {
    // DAIRY PASTURE (Fenced pasture with cow)
    renderDairyPasture(ctx, plot, time);
    ctx.restore();
    return;
  }

  // RAISED WOODEN PLANTER BEDS (Tomatoes, Corn, Pumpkins)
  // Bed drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.roundRect(plot.x - 2, plot.y + 4, plot.width + 4, plot.height, 10);
  ctx.fill();

  // Dark wooden planter box frame
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 8);
  ctx.fill();

  // Rich dark tilled potting soil inside
  ctx.fillStyle = '#3f200e';
  ctx.fillRect(plot.x + 4, plot.y + 4, plot.width - 8, plot.height - 8);

  // Wooden corner timber posts
  ctx.fillStyle = '#92400e';
  ctx.fillRect(plot.x, plot.y, 8, plot.height);
  ctx.fillRect(plot.x + plot.width - 8, plot.y, 8, plot.height);

  // Bed Title Header
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${PRODUCTS[plot.product].emoji} ${plot.name}`, plot.x + plot.width / 2, plot.y + 14);

  // Green climbing vines & foliage
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(plot.x + 12, plot.y + plot.height / 2 + 5);
  ctx.bezierCurveTo(
    plot.x + plot.width * 0.3, plot.y + 20,
    plot.x + plot.width * 0.7, plot.y + plot.height - 10,
    plot.x + plot.width - 12, plot.y + plot.height / 2 + 5
  );
  ctx.stroke();

  // Render ripe crops on vines with gentle bob
  const maxCols = 4;
  for (let i = 0; i < plot.readyCount; i++) {
    const col = i % maxCols;
    const row = Math.floor(i / maxCols);
    const itemX = plot.x + 22 + col * 26;
    const itemY = plot.y + 28 + row * 18;
    const itemBob = Math.sin(time * 0.005 + i) * 2;

    ctx.font = '16px sans-serif';
    ctx.fillText(PRODUCTS[plot.product].emoji, itemX, itemY + itemBob);
  }

  // Capacity pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + plot.width / 2 - 24, plot.y + plot.height - 15, 48, 14, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height - 5);

  ctx.restore();
}

/**
 * Chicken Coop (plot-egg)
 */
function renderChickenCoop(ctx: CanvasRenderingContext2D, plot: ProductionPlot, time: number) {
  // Rustic split-rail wooden fence
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.beginPath();
  ctx.roundRect(plot.x - 2, plot.y + 4, plot.width + 4, plot.height, 10);
  ctx.fill();

  // Golden straw ground
  ctx.fillStyle = '#fef08a';
  ctx.beginPath();
  ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 8);
  ctx.fill();
  ctx.strokeStyle = '#ca8a04';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Fence posts
  ctx.fillStyle = '#854d0e';
  ctx.fillRect(plot.x, plot.y, 6, plot.height);
  ctx.fillRect(plot.x + plot.width - 6, plot.y, 6, plot.height);

  // Coop Title
  ctx.fillStyle = '#713f12';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐔 Chicken Coop', plot.x + plot.width / 2, plot.y + 14);

  // Straw nests with eggs & hens
  for (let i = 0; i < plot.maxCapacity; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const nx = plot.x + 24 + col * 38;
    const ny = plot.y + 32 + row * 24;

    // Oval straw nest
    ctx.fillStyle = '#eab308';
    ctx.beginPath();
    ctx.ellipse(nx, ny + 4, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    if (i < plot.readyCount) {
      // White egg ready to collect
      ctx.font = '16px sans-serif';
      ctx.fillText('🥚', nx, ny + 4);
    } else {
      // Brooding White Hen
      ctx.font = '16px sans-serif';
      ctx.fillText('🐔', nx, ny + 4);
    }
  }

  // Capacity pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.strokeStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + plot.width / 2 - 24, plot.y + plot.height - 15, 48, 14, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height - 5);
}

/**
 * Dairy Pasture (plot-milk)
 */
function renderDairyPasture(ctx: CanvasRenderingContext2D, plot: ProductionPlot, time: number) {
  ctx.fillStyle = '#86efac';
  ctx.beginPath();
  ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 8);
  ctx.fill();
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#14532d';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐮 Dairy Pasture', plot.x + plot.width / 2, plot.y + 14);

  // Spotted Cow
  ctx.font = '24px sans-serif';
  ctx.fillText('🐄', plot.x + 35, plot.y + 45);

  // Milk churns
  for (let i = 0; i < plot.readyCount; i++) {
    ctx.font = '16px sans-serif';
    ctx.fillText('🥛', plot.x + 75 + (i % 2) * 20, plot.y + 35 + Math.floor(i / 2) * 18);
  }

  // Capacity pill
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
  ctx.beginPath();
  ctx.roundRect(plot.x + plot.width / 2 - 24, plot.y + plot.height - 15, 48, 14, 5);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height - 5);
}

/**
 * 6. Display Tables (Market Shelves with Floating Deposit Arrow ⬇️)
 */
function renderDisplayTable(ctx: CanvasRenderingContext2D, shelf: Shelf, time: number) {
  ctx.save();
  // Table shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.roundRect(shelf.x - 2, shelf.y + 4, shelf.width + 4, shelf.height, 10);
  ctx.fill();

  // 4 Wooden Legs
  ctx.fillStyle = '#78350f';
  ctx.fillRect(shelf.x + 4, shelf.y + shelf.height - 6, 6, 8);
  ctx.fillRect(shelf.x + shelf.width - 10, shelf.y + shelf.height - 6, 6, 8);

  // Table Top Surface (Honey Wood)
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.roundRect(shelf.x, shelf.y, shelf.width, shelf.height - 4, 8);
  ctx.fill();

  // Table top lip
  ctx.fillStyle = '#d97706';
  ctx.fillRect(shelf.x + 3, shelf.y + 2, shelf.width - 6, 12);

  // Title & Icon
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${PRODUCTS[shelf.product].emoji} ${shelf.name}`, shelf.x + shelf.width / 2, shelf.y + 12);

  // Stocked produce displayed neatly on table
  const stockCols = 4;
  for (let i = 0; i < shelf.currentStock; i++) {
    const col = i % stockCols;
    const row = Math.floor(i / stockCols);
    const sx = shelf.x + 16 + col * 18;
    const sy = shelf.y + 28 + row * 14;
    ctx.font = '14px sans-serif';
    ctx.fillText(PRODUCTS[shelf.product].emoji, sx, sy);
  }

  // FLOATING YELLOW DEPOSIT ARROW ⬇️ (Signature My Mini Mart Visual Guide)
  const arrowBob = Math.sin(time * 0.007) * 4;
  const arrowX = shelf.x + shelf.width / 2;
  const arrowY = shelf.y - 12 + arrowBob;

  // Golden glow around deposit arrow
  ctx.fillStyle = 'rgba(250, 204, 21, 0.35)';
  ctx.beginPath();
  ctx.arc(arrowX, arrowY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Bright yellow downward pointer arrow
  ctx.fillStyle = '#facc15';
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(arrowX - 8, arrowY - 4);
  ctx.lineTo(arrowX + 8, arrowY - 4);
  ctx.lineTo(arrowX, arrowY + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Stock progress gauge bar
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(shelf.x + 8, shelf.y + shelf.height - 11, shelf.width - 16, 6);
  const fillW = ((shelf.width - 16) * shelf.currentStock) / shelf.maxStock;
  ctx.fillStyle = shelf.currentStock === 0 ? '#ef4444' : shelf.currentStock === shelf.maxStock ? '#22c55e' : '#f59e0b';
  ctx.fillRect(shelf.x + 8, shelf.y + shelf.height - 11, fillW, 6);

  // Stock count pill
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText(`${shelf.currentStock}/${shelf.maxStock}`, shelf.x + shelf.width / 2, shelf.y + shelf.height + 11);

  ctx.restore();
}

/**
 * 7. Unlock Pads (Progressive Disclosure)
 */
function renderUnlockPad(ctx: CanvasRenderingContext2D, pad: UnlockPad, time: number) {
  ctx.save();
  const pulse = Math.sin(time * 0.005) * 2;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);

  ctx.beginPath();
  ctx.arc(pad.x, pad.y, pad.radius + pulse, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(234, 179, 8, 0.24)';
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // Progress circular arc fill
  if (pad.paid > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (pad.paid / pad.cost) * Math.PI * 2;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, pad.radius + pulse, startAngle, endAngle);
    ctx.stroke();
  }

  // Pad label badge
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pad.x - 55, pad.y - 24, 110, 18, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pad.title, pad.x, pad.y - 12);

  ctx.fillStyle = '#22c55e';
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(`$${pad.paid}/${pad.cost} 💵`, pad.x, pad.y + 12);
  ctx.restore();
}

/**
 * 8. Capsule Dummy Character Anatomy (My Mini Mart Style)
 */
function renderMiniMartDummy(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  options: {
    color: string;
    tilt?: number;
    walkPhase?: number;
    isMoving?: boolean;
  }
) {
  ctx.save();
  const tilt = options.tilt ?? 0;
  const walkPhase = options.walkPhase ?? 0;
  const isMoving = options.isMoving ?? false;
  const bob = isMoving ? Math.abs(Math.sin(walkPhase)) * 2 : 0;

  // Character shadow on ground
  ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y + 13, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Apply movement tilt around center of mass
  ctx.translate(x, y - bob);
  ctx.rotate(tilt);

  // Animated Feet swinging in walk cycle
  const footSwing = isMoving ? Math.sin(walkPhase) * 4 : 0;
  ctx.fillStyle = '#1e293b'; // Dark feet
  ctx.beginPath();
  ctx.ellipse(-5, 10 + footSwing, 4, 3, 0, 0, Math.PI * 2);
  ctx.ellipse(5, 10 - footSwing, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Capsule Torso (Smooth Pill Shape)
  ctx.fillStyle = options.color;
  ctx.beginPath();
  ctx.roundRect(-9, -8, 18, 20, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spherical Head
  ctx.fillStyle = options.color;
  ctx.beginPath();
  ctx.arc(0, -14, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Specular Gloss Highlight on Head (3D arcade look)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.beginPath();
  ctx.arc(-3, -17, 3.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 9. The Hero Player (Blue Capsule Dummy with run tilt & carried produce stack)
 */
function renderPlayerDummy(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  time: number,
  isMoving: boolean
) {
  ctx.save();
  const walkPhase = isMoving ? time * 0.015 : 0;

  // Running tilt angle
  let tilt = 0;
  if (isMoving) {
    if (p.facing === 'left') tilt = -0.14;
    else if (p.facing === 'right') tilt = 0.14;
    else if (p.facing === 'up') tilt = -0.05;
    else if (p.facing === 'down') tilt = 0.05;
  }

  // Beacon Floor Ring (Highlights player position at all times)
  const beaconPulse = Math.sin(time * 0.008) * 3;
  ctx.fillStyle = 'rgba(2, 132, 199, 0.2)';
  ctx.beginPath();
  ctx.arc(p.x, p.y + 12, 24 + beaconPulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Blue Capsule Dummy
  renderMiniMartDummy(ctx, p.x, p.y, {
    color: '#0284c7', // My Mini Mart Blue
    tilt,
    walkPhase,
    isMoving,
  });

  // Floating "YOU" Pill Badge
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(p.x - 16, p.y - 34, 32, 14, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU', p.x, p.y - 24);

  // Carried produce stack neatly stacked above head
  if (p.stack.length > 0) {
    const sway = isMoving ? Math.sin(walkPhase) * 2 : 0;
    renderCarriedStack(ctx, p.x + sway, p.y - 42, p.stack);

    // Capacity Badge
    const stackTopY = p.y - 42 - p.stack.length * 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = p.stack.length >= p.capacity ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p.x - 18, stackTopY - 14, 36, 14, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.stack.length >= p.capacity ? '#ef4444' : '#22c55e';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${p.stack.length}/${p.capacity}`, p.x, stackTopY - 4);
  }

  ctx.restore();
}

/**
 * 10. Animal Customers (Pastel Capsule Dummies with Wishlist Speech Bubble)
 */
function renderCustomerDummy(ctx: CanvasRenderingContext2D, cust: Customer, time: number) {
  ctx.save();
  // Species pastel colors
  const palette: Record<string, string> = {
    bunny: '#f472b6', // Pastel Pink
    bear: '#eab308',  // Pastel Yellow
    cat: '#10b981',   // Pastel Mint Green
    dog: '#a855f7',   // Pastel Purple
    pig: '#fb7185',   // Pastel Coral
    ghost: '#94a3b8', // Pastel Slate
  };
  const dummyColor = palette[cust.species] ?? '#38bdf8';

  const isWalking = cust.state === 'shopping' || cust.state === 'to_register' || cust.state === 'leaving';
  const walkPhase = isWalking ? time * 0.012 : 0;
  const tilt = isWalking ? (cust.facing === 'left' ? -0.12 : 0.12) : 0;

  // Render Capsule Dummy
  renderMiniMartDummy(ctx, cust.x, cust.y, {
    color: dummyColor,
    tilt,
    walkPhase,
    isMoving: isWalking,
  });

  // Customer Thought / Wishlist Speech Bubble
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#0f172a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(cust.x - 24, cust.y - 42, 48, 22, 7);
  ctx.fill();
  ctx.stroke();

  // Speech bubble pointer
  ctx.beginPath();
  ctx.moveTo(cust.x - 4, cust.y - 20);
  ctx.lineTo(cust.x, cust.y - 15);
  ctx.lineTo(cust.x + 4, cust.y - 20);
  ctx.fill();

  if (cust.state === 'in_queue') {
    ctx.font = 'bold 9px sans-serif';
    ctx.fillStyle = '#b45309';
    ctx.textAlign = 'center';
    ctx.fillText('WAITING ⏳', cust.x, cust.y - 27);
  } else if (cust.state === 'leaving') {
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('❤️', cust.x, cust.y - 27);
  } else {
    const want = cust.wants[0];
    if (want) {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.textAlign = 'center';
      ctx.fillText(`${PRODUCTS[want.product].emoji} x${want.amount}`, cust.x, cust.y - 27);
    }
  }

  ctx.restore();
}

/**
 * 11. Helper Worker (Barnaby Dog)
 */
function renderHelperWorker(ctx: CanvasRenderingContext2D, h: HelperWorker, time: number) {
  ctx.save();
  const isWalking = h.state !== 'idle';
  const walkPhase = isWalking ? time * 0.014 : 0;

  renderMiniMartDummy(ctx, h.x, h.y, {
    color: '#f59e0b', // Golden Dog Fur
    tilt: isWalking ? 0.1 : 0,
    walkPhase,
    isMoving: isWalking,
  });

  // Puppy Bandana Badge
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐶', h.x, h.y - 26);

  if (h.stack.length > 0) {
    renderCarriedStack(ctx, h.x, h.y - 34, h.stack);
  }
  ctx.restore();
}

/**
 * Helper to render vertical stack of carried produce items
 */
function renderCarriedStack(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  stack: ProductType[]
) {
  for (let i = 0; i < stack.length; i++) {
    const item = stack[i]!;
    const itemY = baseY - i * 16;
    ctx.save();
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(PRODUCTS[item].emoji, baseX, itemY);
    ctx.restore();
  }
}

/**
 * 12. Floating Notifications (Cash popups & unlocks)
 */
function renderFloatingNote(ctx: CanvasRenderingContext2D, note: FloatingNotification) {
  ctx.save();
  const progress = 1 - note.lifeMs / note.maxLifeMs;
  const alpha = Math.max(0, 1 - progress);
  const riseY = note.y - progress * 35;

  ctx.globalAlpha = alpha;
  ctx.fillStyle = note.color;
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 3;
  ctx.font = 'black 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeText(note.text, note.x, riseY);
  ctx.fillText(note.text, note.x, riseY);
  ctx.restore();
}

/**
 * 13. Floating Analog Touch Joystick (Translucent White Ring + Cyan Knob)
 */
function renderFloatingJoystick(
  ctx: CanvasRenderingContext2D,
  origin: { x: number; y: number },
  current: { x: number; y: number }
) {
  ctx.save();
  // Translucent white outer base ring
  ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.65)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(origin.x, origin.y, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Inner thumb knob
  const dx = current.x - origin.x;
  const dy = current.y - origin.y;
  const dist = Math.hypot(dx, dy);
  const capDist = Math.min(dist, 40);
  const angle = Math.atan2(dy, dx);
  const capX = origin.x + Math.cos(angle) * capDist;
  const capY = origin.y + Math.sin(angle) * capDist;

  // Cyan thumbstick cap matching My Mini Mart
  ctx.fillStyle = '#0284c7';
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(capX, capY, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Subtle center pointer dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(capX, capY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

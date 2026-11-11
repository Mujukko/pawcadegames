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
import { analytics } from '../../lib/analytics';

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
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  // Input state
  const inputRef = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const activeKeysRef = useRef<Set<string>>(new Set());

  // Touch joystick state
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const touchCurrentRef = useRef<{ x: number; y: number } | null>(null);
  const [touchActive, setTouchActive] = useState<boolean>(false);

  // Trailing dust particles for running capsule dummy
  const dustParticlesRef = useRef<DustParticle[]>([]);

  // Smooth follow camera for expansive scrolling world (1500 x 1100)
  const cameraRef = useRef<{ x: number; y: number }>({
    x: Math.max(0, Math.min(WORLD_BOUNDS.maxX - 800, gameState.player.x - 400)),
    y: Math.max(0, Math.min(WORLD_BOUNDS.maxY - 600, gameState.player.y - 300)),
  });

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

  useEffect(() => {
    analytics.gameStarted('farm-mini-mart', { coins: gameState.player.coins });
  }, []);

  // Restart / Reset market
  const handleReset = useCallback(() => {
    if (!confirmReset) {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3500);
      return;
    }
    analytics.gameRestarted('farm-mini-mart', { coins: 0 });
    const fresh = createInitialMartState();
    setGameState(fresh);
    saveMartState(fresh);
    setConfirmReset(false);
  }, [confirmReset]);

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

      // Smooth camera follow tracking (smooth 60 FPS lerp)
      const targetCamX = Math.max(0, Math.min(WORLD_BOUNDS.maxX - 800, nextState.player.x - 400));
      const targetCamY = Math.max(0, Math.min(WORLD_BOUNDS.maxY - 600, nextState.player.y - 300));
      cameraRef.current.x += (targetCamX - cameraRef.current.x) * 0.12;
      cameraRef.current.y += (targetCamY - cameraRef.current.y) * 0.12;

      // Trigger audio events
      for (const ev of events) {
        if (ev === 'harvest') farmMartAudio.playHarvestSound();
        else if (ev === 'stock') farmMartAudio.playStockSound();
        else if (ev === 'coin_deposit') farmMartAudio.playCoinDepositSound();
        else if (ev === 'unlock_station') {
          farmMartAudio.playUnlockSound();
          analytics.scoreMilestone('farm-mini-mart', nextState.player.coins, 'unlock_station');
        }
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

      // Immediate HUD sync on gameplay events + periodic sync every 250ms
      saveTimer += dt;
      if (events.length > 0 || saveTimer > 250) {
        setGameState(nextState);
        if (saveTimer > 1200 || events.includes('kaching') || events.includes('unlock_station')) {
          saveTimer = 0;
          saveMartState(nextState);
        }
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
            dustParticlesRef.current,
            cameraRef.current
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
      analytics.scoreMilestone('farm-mini-mart', res.nextState.player.coins, `speed_lvl_${res.nextState.player.speedLevel}`);
      setGameState(res.nextState);
      saveMartState(res.nextState);
    }
  };

  const handleUpgradeCapacity = () => {
    const res = upgradePlayerCapacity(stateRef.current);
    if (res.success) {
      farmMartAudio.playUnlockSound();
      analytics.scoreMilestone('farm-mini-mart', res.nextState.player.coins, `capacity_lvl_${res.nextState.player.capacityLevel}`);
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
            className={`p-2.5 border rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center gap-1 active:scale-95 text-xs font-bold ${
              confirmReset
                ? 'bg-rose-600 text-white border-rose-500'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border-slate-700'
            }`}
            title="Reset Game"
            aria-label="Reset Game"
          >
            <RotateCcw className="w-4 h-4" />
            {confirmReset && <span>Sure?</span>}
          </button>
        </div>
      </div>

      {/* Mobile Quest Pill (shown on smaller screens) */}
      <div className="w-full md:hidden bg-slate-900 border-x border-emerald-500/30 px-3 py-1.5 flex items-center gap-2">
        <span className="text-base shrink-0">{currentObjective.icon}</span>
        <span className="text-xs font-black text-emerald-200 truncate">{currentObjective.text}</span>
      </div>

      {/* 2. MAIN CANVAS VIEWPORT (800x600 coordinate world) */}
      <div className="relative w-full bg-[#65a30d] border border-emerald-500/30 shadow-2xl overflow-hidden aspect-[4/3] rounded-b-2xl touch-none overscroll-none select-none">
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
            <span>👆 Drag thumb anywhere to explore!</span>
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
                  <p className="text-xs text-slate-400 mt-0.5">Explore the farm pastures to harvest ripe crops (Tomatoes, Corn, Eggs, Milk, Pumpkins).</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">📦</span>
                <div>
                  <strong className="text-emerald-300">2. Restock Shelves:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Walk into the spacious mini mart to stock display tables marked with the floating yellow arrow ⬇️.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🐰</span>
                <div>
                  <strong className="text-emerald-300">3. Serve Animal Customers:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Cute animal capsule customers enter the shop, grab items from tables, and line up at the turquoise checkout counter.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">💵</span>
                <div>
                  <strong className="text-emerald-300">4. Cash Out & Collect:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Stand on the Cashier Mat behind the register to ring up customers. Green cash banknote stacks drop on the counter and are collected!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🌟</span>
                <div>
                  <strong className="text-emerald-300">5. Unlock & Expand:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Deposit cash on yellow unlock pads to unlock new crop fields, tables, the Farmhand Dog 🐶, and Register Cashier 🧑‍💼.</p>
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
 * Procedural 2.5D Canvas Scene Renderer for Farm Mini Mart (1500x1100 Scrolling World)
 * Handcrafted Cozy Country Store & Lush Pasture Aesthetics:
 * - Warm timber & brick store architecture with rooftop sign, hanging lanterns, and bakery nook
 * - Cobblestone walkways, split-rail fences, flower beds, and orchard trees
 * - Chibi Farmer hero with straw sunhat, denim overalls, face, and wooden harvest crate
 * - Chibi Animal Shoppers (Bunny, Cat, Dog, Bear, Pig) with ears, faces, shopping baskets, and non-overlapping side thought bubbles
 * - 3D slanted wooden market stalls & furrowed garden beds with live growth progress
 */
function renderMartScene(
  ctx: CanvasRenderingContext2D,
  state: MartGameState,
  time: number,
  touchOrigin: { x: number; y: number } | null,
  touchCurrent: { x: number; y: number } | null,
  isMoving: boolean,
  dustParticles: DustParticle[],
  camera: { x: number; y: number }
) {
  ctx.save();
  ctx.clearRect(0, 0, 800, 600);

  const camX = Math.round(camera.x);
  const camY = Math.round(camera.y);

  ctx.save();
  ctx.translate(-camX, -camY);

  // 1. LUSH COUNTRY MEADOW LAWN & COBBLESTONE PATHS
  renderOutdoorMeadowAndPaths(ctx, time);

  // 2. COZY COUNTRY MARKET ARCHITECTURE (Walls, Warm Tile Floor, Rugs, Decor)
  renderCozyStoreArchitecture(ctx, state, time);

  // 3. CASHIER MAT (Behind Register — clean, never overlaps player text when occupied)
  const playerOnMat =
    Math.hypot(
      state.player.x - (state.register.x + state.register.width / 2),
      state.player.y - (state.register.y - 26)
    ) < 42;
  renderCashierMat(ctx, state.register, time, playerOnMat || state.register.hasCashier);

  // 4. 2.5D CHECKOUT COUNTER, CONVEYOR BELT & POS REGISTER
  renderCheckoutCounter(ctx, state.register, time);

  // 5. PRODUCTION PLOTS (3D Timber Planter Beds, Chicken Coop, Dairy Pasture)
  for (const plot of state.plots) {
    if (!plot.unlocked) continue;
    renderProductionPlot(ctx, plot, time);
  }

  // 6. DISPLAY TABLES (3D Slanted Wooden Market Stalls with Canopies)
  for (const shelf of state.shelves) {
    if (!shelf.unlocked) continue;
    renderDisplayTable(ctx, shelf, time);
  }

  // 7. UNLOCK PADS (Progressive Disclosure)
  for (const pad of state.unlockPads) {
    if (pad.unlocked || !isPadVisible(pad, state)) continue;
    renderUnlockPad(ctx, pad, time);
  }

  // 8. FOOTSTEP DUST PUFFS
  for (const p of dustParticles) {
    ctx.save();
    ctx.fillStyle = `rgba(254, 243, 199, ${p.alpha * 0.85})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 9. DEPTH-SORTED CHARACTERS (Y-sorted so characters in front naturally overlap characters behind!)
  type RenderEntity =
    | { kind: 'customer'; y: number; cust: Customer }
    | { kind: 'helper'; y: number; helper: HelperWorker }
    | { kind: 'player'; y: number; player: PlayerState };

  const entities: RenderEntity[] = [];
  for (const cust of state.customers) {
    entities.push({ kind: 'customer', y: cust.y, cust });
  }
  if (state.helper.unlocked) {
    entities.push({ kind: 'helper', y: state.helper.y, helper: state.helper });
  }
  entities.push({ kind: 'player', y: state.player.y, player: state.player });

  entities.sort((a, b) => a.y - b.y);

  for (const ent of entities) {
    if (ent.kind === 'customer') {
      renderAnimalCustomer(ctx, ent.cust, time);
    } else if (ent.kind === 'helper') {
      renderHelperDog(ctx, ent.helper, time);
    } else {
      renderFarmerHero(ctx, ent.player, time, isMoving);
    }
  }

  // 10. FLOATING NOTIFICATIONS (Cash popups & unlocks)
  for (const note of state.floatingNotes) {
    renderFloatingNote(ctx, note);
  }

  ctx.restore(); // Restore world translation

  // Screen-Space Overlays:
  if (touchOrigin && touchCurrent) {
    renderFloatingJoystick(ctx, touchOrigin, touchCurrent);
  }

  renderWorldMinimap(ctx, state, camX, camY);

  ctx.restore();
}

/**
 * 1. Lush Country Meadow Lawn, Cobblestone Walkways, Fences & Trees
 */
function renderOutdoorMeadowAndPaths(ctx: CanvasRenderingContext2D, time: number) {
  ctx.save();

  // Soft pastoral mowed grass bands
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, 0, WORLD_BOUNDS.width, WORLD_BOUNDS.height);

  const stripeH = 64;
  for (let y = 0; y < WORLD_BOUNDS.height; y += stripeH * 2) {
    ctx.fillStyle = '#6fb010';
    ctx.fillRect(0, y, WORLD_BOUNDS.width, stripeH);
  }

  // Subtle grass tufts & wildflowers in the meadow
  const tufts = [
    { x: 110, y: 580, flower: '#fef08a' },
    { x: 135, y: 740, flower: '#fbcfe8' },
    { x: 540, y: 600, flower: '#fef08a' },
    { x: 575, y: 780, flower: '#bfdbfe' },
    { x: 840, y: 590, flower: '#fef08a' },
    { x: 870, y: 770, flower: '#fbcfe8' },
    { x: 610, y: 890, flower: '#fef08a' },
    { x: 1090, y: 585, flower: '#fbcfe8' },
    { x: 1290, y: 570, flower: '#fef08a' },
    { x: 350, y: 880, flower: '#bfdbfe' },
  ];
  for (const t of tufts) {
    ctx.fillStyle = '#4d7c0f';
    ctx.beginPath();
    ctx.arc(t.x, t.y, 6, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = t.flower;
    ctx.beginPath();
    ctx.arc(t.x - 2, t.y - 3, 2.5, 0, Math.PI * 2);
    ctx.arc(t.x + 3, t.y - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warm sandstone/cobblestone main avenue (from store entrance 450,530 down to 980)
  ctx.fillStyle = '#d6d3d1';
  ctx.beginPath();
  ctx.roundRect(382, 526, 136, 460, 14);
  ctx.fill();
  ctx.strokeStyle = '#a8a29e';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Cross avenue connecting West (Chicken Coop) & East (Tomato/Corn/Dairy Beds)
  ctx.fillStyle = '#d6d3d1';
  ctx.beginPath();
  ctx.roundRect(310, 650, 900, 48, 12);
  ctx.fill();
  ctx.strokeStyle = '#a8a29e';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Individual cobblestone pavers along main avenue
  for (let py = 542; py < 965; py += 28) {
    ctx.fillStyle = py % 56 === 0 ? '#e7e5e4' : '#f5f5f4';
    ctx.beginPath();
    ctx.roundRect(392, py, 54, 20, 6);
    ctx.roundRect(454, py, 54, 20, 6);
    ctx.fill();
  }

  // Dedicated Queue Stepping Stones on the left side of the entrance avenue (for slot 2 & 3)
  for (let i = 0; i < WORLD_BOUNDS.checkoutSpots.length; i++) {
    const spot = WORLD_BOUNDS.checkoutSpots[i]!;
    if (spot.y >= 525) {
      ctx.fillStyle = '#fef3c7';
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y + 8, 16, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  // Rustic wooden split-rail fence flanking the store front yard
  const drawFenceSegment = (fx: number, fy: number, fw: number) => {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(fx, fy + 10, fw, 6);
    // Rails
    ctx.fillStyle = '#92400e';
    ctx.fillRect(fx, fy, fw, 5);
    ctx.fillRect(fx, fy + 7, fw, 4);
    // Posts
    ctx.fillStyle = '#78350f';
    for (let px = fx; px <= fx + fw; px += 45) {
      ctx.beginPath();
      ctx.roundRect(px - 4, fy - 5, 8, 18, 2);
      ctx.fill();
      ctx.fillStyle = '#b45309';
      ctx.fillRect(px - 3, fy - 4, 6, 3);
      ctx.fillStyle = '#78350f';
    }
  };
  drawFenceSegment(60, 548, 280);
  drawFenceSegment(555, 548, 660);

  // Decorative Orchard Trees flanking the store
  const trees = [
    { x: 115, y: 120 },
    { x: 115, y: 310 },
    { x: 115, y: 480 },
    { x: 1295, y: 140 },
    { x: 1295, y: 340 },
    { x: 1295, y: 500 },
  ];
  const treeSway = Math.sin(time * 0.002) * 1.5;
  for (const tr of trees) {
    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(tr.x, tr.y + 26, 28, 11, 0, 0, Math.PI * 2);
    ctx.fill();
    // Trunk
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(tr.x - 7, tr.y, 14, 26, 3);
    ctx.fill();
    // Layered canopy
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(tr.x + treeSway, tr.y - 6, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(tr.x - 10 + treeSway, tr.y - 2, 18, 0, Math.PI * 2);
    ctx.arc(tr.x + 10 + treeSway, tr.y - 2, 18, 0, Math.PI * 2);
    ctx.arc(tr.x + treeSway, tr.y - 14, 20, 0, Math.PI * 2);
    ctx.fill();
    // Red apples on tree
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(tr.x - 8 + treeSway, tr.y - 8, 3, 0, Math.PI * 2);
    ctx.arc(tr.x + 9 + treeSway, tr.y - 4, 3, 0, Math.PI * 2);
    ctx.arc(tr.x + 2 + treeSway, tr.y - 18, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

/**
 * 2. Cozy Country Market Architecture (Timber Walls, Checkerboard Floor, Entrance Mat, Roof Sign)
 */
function renderCozyStoreArchitecture(ctx: CanvasRenderingContext2D, state: MartGameState, time: number) {
  ctx.save();
  const storeX = 180;
  const storeY = 60;
  const storeW = 1040;
  const storeH = 470;

  // Exterior building drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.roundRect(storeX - 6, storeY - 4, storeW + 12, storeH + 12, 16);
  ctx.fill();

  // Warm Country Cream & Honey Checkerboard Tile Floor
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(storeX, storeY, storeW, storeH, 12);
  ctx.clip();

  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(storeX, storeY, storeW, storeH);

  const tileSize = 40;
  for (let x = storeX; x < storeX + storeW; x += tileSize) {
    for (let y = storeY; y < storeY + storeH; y += tileSize) {
      const isAlt = ((x - storeX) / tileSize + (y - storeY) / tileSize) % 2 === 0;
      if (isAlt) {
        ctx.fillStyle = '#fde68a';
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  // Subtle tile grout lines
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.14)';
  ctx.lineWidth = 1;
  for (let x = storeX; x <= storeX + storeW; x += tileSize) {
    ctx.beginPath();
    ctx.moveTo(x, storeY);
    ctx.lineTo(x, storeY + storeH);
    ctx.stroke();
  }
  for (let y = storeY; y <= storeY + storeH; y += tileSize) {
    ctx.beginPath();
    ctx.moveTo(storeX, y);
    ctx.lineTo(storeX + storeW, y);
    ctx.stroke();
  }

  // Cozy Red Country Woven Runner Rug along the shopping aisle
  ctx.fillStyle = '#dc2626';
  ctx.beginPath();
  ctx.roundRect(510, 320, 22, 180, 6);
  ctx.fill();

  // TOP-LEFT FARMHOUSE LOUNGE & MANAGER OFFICE (x: 180..325, y: 60..260)
  const officeW = 148;
  const officeH = 195;
  // Warm oak wood plank floor in office
  ctx.fillStyle = '#d97706';
  ctx.fillRect(storeX, storeY, officeW, officeH);
  ctx.strokeStyle = 'rgba(120, 53, 15, 0.28)';
  ctx.lineWidth = 1.5;
  for (let py = storeY + 20; py < storeY + officeH; py += 20) {
    ctx.beginPath();
    ctx.moveTo(storeX, py);
    ctx.lineTo(storeX + officeW, py);
    ctx.stroke();
  }

  // Braided circular rug inside office
  ctx.fillStyle = '#fef3c7';
  ctx.strokeStyle = '#dc2626';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(storeX + 74, storeY + 122, 42, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Executive Oak Desk with Ledger & Monitor
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.roundRect(storeX + 26, storeY + 46, 92, 36, 6);
  ctx.fill();
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.roundRect(storeX + 26, storeY + 42, 92, 34, 6);
  ctx.fill();
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.roundRect(storeX + 30, storeY + 45, 84, 26, 4);
  ctx.fill();

  // Laptop / Monitor on desk
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(storeX + 42, storeY + 48, 28, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(storeX + 45, storeY + 51, 22, 12);
  // Accounting Ledger Book & Coffee Mug
  ctx.fillStyle = '#fef08a';
  ctx.fillRect(storeX + 80, storeY + 50, 16, 14);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(storeX + 80, storeY + 50, 4, 14);
  // Cozy Plush Chair
  ctx.fillStyle = '#b91c1c';
  ctx.beginPath();
  ctx.arc(storeX + 58, storeY + 92, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Lush Potted Monstera Plant in Office Corner
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.arc(storeX + 30, storeY + 165, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#16a34a';
  for (let a = 0; a < 5; a++) {
    const ang = (a * Math.PI * 2) / 5;
    ctx.beginPath();
    ctx.ellipse(storeX + 30 + Math.cos(ang) * 8, storeY + 162 + Math.sin(ang) * 8, 7, 4, ang, 0, Math.PI * 2);
    ctx.fill();
  }

  // Office Timber Partition Walls (with warm doorway opening)
  ctx.fillStyle = '#78350f';
  ctx.fillRect(storeX + officeW - 6, storeY, 8, officeH);
  ctx.fillRect(storeX, storeY + officeH - 6, 86, 8);
  ctx.fillStyle = '#b45309';
  ctx.fillRect(storeX + officeW - 4, storeY, 4, officeH);
  ctx.fillRect(storeX, storeY + officeH - 4, 86, 4);

  // Reserved Floor Blueprint Mats for Locked Shelves (keeps spacious interior visually structured)
  for (const shelf of state.shelves) {
    if (shelf.unlocked) continue;
    ctx.save();
    ctx.fillStyle = 'rgba(217, 119, 6, 0.08)';
    ctx.strokeStyle = 'rgba(180, 83, 9, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.roundRect(shelf.x - 4, shelf.y - 4, shelf.width + 8, shelf.height + 8, 10);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(146, 64, 14, 0.45)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${PRODUCTS[shelf.product].emoji} ${shelf.name}`, shelf.x + shelf.width / 2, shelf.y + shelf.height / 2 + 3);
    ctx.restore();
  }

  // North Wall Decorative Country Market Shelving & Banner (y: 60..92)
  ctx.fillStyle = '#fef3c7';
  ctx.fillRect(storeX + officeW + 2, storeY, storeW - officeW - 2, 26);
  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(storeX + officeW, storeY + 26);
  ctx.lineTo(storeX + storeW, storeY + 26);
  ctx.stroke();

  // Decorative wall crates & chalkboard sign on North Wall
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(450, storeY + 4, 210, 20, 4);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🌾 FRESH FARM PRODUCE • DAILY HARVEST 🌾', 555, storeY + 17);

  // Welcome Entrance Floor Mat (Inside the doorway threshold x: 380..520, y: 500..528)
  // Placed flat on the floor so characters walk *over* it naturally without text colliding!
  ctx.fillStyle = '#991b1b';
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(415, 502, 90, 24, 5);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME', 460, 517);

  // Customer Queue Floor Stepping Circles (Slots 0, 1, 2 inside store)
  for (let i = 0; i < WORLD_BOUNDS.checkoutSpots.length; i++) {
    const spot = WORLD_BOUNDS.checkoutSpots[i]!;
    if (spot.y < 525) {
      ctx.fillStyle = 'rgba(217, 119, 6, 0.16)';
      ctx.strokeStyle = 'rgba(180, 83, 9, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(spot.x, spot.y + 8, 15, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
  }

  ctx.restore(); // End floor clip

  // 3D TIMBER EXTERIOR WALLS (10px thick oak walls with highlight trim)
  const drawWallBar = (wx: number, wy: number, ww: number, wh: number) => {
    ctx.fillStyle = '#5c2d0c';
    ctx.beginPath();
    ctx.roundRect(wx, wy, ww, wh, 4);
    ctx.fill();
    ctx.fillStyle = '#92400e';
    ctx.beginPath();
    ctx.roundRect(wx + 2, wy + 2, ww - 4, wh - 4, 3);
    ctx.fill();
  };

  // Top, Left, Right walls
  drawWallBar(storeX - 4, storeY - 6, storeW + 8, 12);
  drawWallBar(storeX - 6, storeY - 6, 12, storeH + 12);
  drawWallBar(storeX + storeW - 6, storeY - 6, 12, storeH + 12);

  // Bottom wall left of doorway (180..372) and right of doorway (528..1220)
  drawWallBar(storeX - 6, storeY + storeH - 6, 198, 12);
  drawWallBar(528, storeY + storeH - 6, storeX + storeW - 522, 12);

  // Storefront Striped Window Awnings (placed along the LEFT and RIGHT walls, NEVER across the doorway!)
  const drawWindowAwning = (ax: number, ay: number, aw: number) => {
    const sw = 18;
    const count = Math.floor(aw / sw);
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(ax, ay + 14, aw, 5);
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#ffffff';
      ctx.beginPath();
      ctx.roundRect(ax + i * sw, ay, sw, 15, [2, 2, 5, 5]);
      ctx.fill();
      ctx.strokeStyle = '#b91c1c';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  };
  drawWindowAwning(storeX + 10, storeY + storeH - 8, 162);
  drawWindowAwning(540, storeY + storeH - 8, 252);
  drawWindowAwning(820, storeY + storeH - 8, 252);

  // Decorative Flower Planter Boxes flanking the entrance doorway (at x: 354 and x: 536)
  const drawEntrancePlanter = (px: number, py: number) => {
    ctx.fillStyle = '#78350f';
    ctx.beginPath();
    ctx.roundRect(px - 14, py - 10, 28, 22, 5);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(px, py - 4, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(px - 3, py - 6, 3, 0, Math.PI * 2);
    ctx.arc(px + 4, py - 3, 3, 0, Math.PI * 2);
    ctx.fill();
  };
  drawEntrancePlanter(362, storeY + storeH + 2);
  drawEntrancePlanter(538, storeY + storeH + 2);

  // GRAND ROOFTOP SIGNBOARD (Above North Wall: y = 26..58)
  ctx.fillStyle = '#78350f';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(455, 26, 200, 28, 8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏪 PAWCADE MINI MART', 555, 44);

  ctx.restore();
}

/**
 * 3. Ergonomic Cashier Floor Mat behind the register counter
 * Never draws overlapping text across the player's feet when the player is standing on it!
 */
function renderCashierMat(
  ctx: CanvasRenderingContext2D,
  reg: CashRegister,
  time: number,
  isOccupied: boolean
) {
  ctx.save();
  const matX = reg.x + 8;
  const matY = reg.y - 50;
  const matW = reg.width - 16;
  const matH = 44;

  // Mat drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
  ctx.beginPath();
  ctx.roundRect(matX - 1, matY + 2, matW + 2, matH, 10);
  ctx.fill();

  // Warm woven mat surface
  const pulse = Math.sin(time * 0.006) * 0.12 + 0.88;
  ctx.fillStyle = isOccupied ? '#dcfce7' : `rgba(254, 240, 138, ${pulse})`;
  ctx.strokeStyle = isOccupied ? '#16a34a' : '#eab308';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(matX, matY, matW, matH, 9);
  ctx.fill();
  ctx.stroke();

  // Inner woven border
  ctx.strokeStyle = isOccupied ? 'rgba(22, 163, 74, 0.35)' : 'rgba(202, 138, 4, 0.4)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.roundRect(matX + 5, matY + 5, matW - 10, matH - 10, 6);
  ctx.stroke();
  ctx.setLineDash([]);

  // Only show the "CASHIER SPOT" prompt when the player/cashier is NOT standing on the mat
  if (!isOccupied) {
    ctx.fillStyle = '#854d0e';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👟 CASHIER SPOT', matX + matW / 2, matY + 25);
  }

  ctx.restore();
}

/**
 * 4. 2.5D Checkout Counter, Conveyor Belt & POS Register
 */
function renderCheckoutCounter(ctx: CanvasRenderingContext2D, reg: CashRegister, time: number) {
  ctx.save();
  // Counter drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
  ctx.beginPath();
  ctx.roundRect(reg.x - 3, reg.y + 6, reg.width + 6, reg.height, 10);
  ctx.fill();

  // 3D Front Apron Panel (Deep Teal-Blue Wood)
  ctx.fillStyle = '#0e7490';
  ctx.beginPath();
  ctx.roundRect(reg.x, reg.y + 10, reg.width, reg.height - 6, 8);
  ctx.fill();

  // Front Apron Recessed Sign Pill (Clean, never collides with POS screen)
  ctx.fillStyle = '#164e63';
  ctx.beginPath();
  ctx.roundRect(reg.x + 26, reg.y + reg.height - 12, reg.width - 52, 12, 4);
  ctx.fill();
  ctx.fillStyle = '#67e8f9';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('CHECKOUT', reg.x + reg.width / 2, reg.y + reg.height - 3);

  // Top Counter Surface (Bright Turquoise with Oak Edge Trim)
  ctx.fillStyle = '#22d3ee';
  ctx.strokeStyle = '#0891b2';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(reg.x, reg.y, reg.width, reg.height - 12, 8);
  ctx.fill();
  ctx.stroke();

  // Top specular gloss highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.fillRect(reg.x + 6, reg.y + 3, reg.width - 12, 3);

  // Left Conveyor Belt Strip
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.roundRect(reg.x + 8, reg.y + 7, 42, 16, 3);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 1;
  for (let bx = reg.x + 15; bx < reg.x + 46; bx += 9) {
    ctx.beginPath();
    ctx.moveTo(bx, reg.y + 8);
    ctx.lineTo(bx, reg.y + 22);
    ctx.stroke();
  }

  // Right POS Cash Register Terminal (Raised 3D Monitor)
  const posX = reg.x + 62;
  const posY = reg.y + 3;
  // Base stand
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(posX, posY, 44, 22, 4);
  ctx.fill();
  // Glowing Emerald Screen
  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.roundRect(posX + 3, posY + 3, 38, 13, 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('$ PAY', posX + 22, posY + 12);

  // Auto-Cashier Character (when hired)
  if (reg.hasCashier) {
    renderChibiCharacter(ctx, reg.x + reg.width / 2, reg.y - 18, {
      shirtColor: '#9333ea',
      overallsColor: '#581c87',
      hatColor: '#facc15',
      skinColor: '#fde68a',
      tilt: 0,
      walkPhase: 0,
      isMoving: false,
      label: 'CASHIER',
      labelColor: '#9333ea',
    });
  }

  // GREEN 3D CASH BANKNOTE STACKS ON COUNTER TRAY
  if (reg.coinsOnCounter > 0) {
    const cashPileX = reg.x + reg.width + 26;
    const cashPileY = reg.y + 18;

    // Glowing collection ring
    const coinPulse = Math.sin(time * 0.008) * 3;
    ctx.fillStyle = 'rgba(34, 197, 94, 0.25)';
    ctx.beginPath();
    ctx.arc(cashPileX, cashPileY, 26 + coinPulse, 0, Math.PI * 2);
    ctx.fill();

    // Wooden cash tray base
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cashPileX - 20, cashPileY - 6, 40, 24, 5);
    ctx.fill();
    ctx.stroke();

    // 3D Banknote Stacks
    renderBanknoteStack(ctx, cashPileX, cashPileY, reg.coinsOnCounter);

    // Floating Cash Amount Badge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cashPileX - 30, cashPileY - 34, 60, 19, 7);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#4ade80';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`+$${reg.coinsOnCounter}`, cashPileX, cashPileY - 21);
  }

  ctx.restore();
}

/**
 * Renders 3D bundles of green cash banknotes (💵)
 */
function renderBanknoteStack(ctx: CanvasRenderingContext2D, x: number, y: number, count: number) {
  ctx.save();
  const stackLayers = Math.min(5, Math.max(1, Math.ceil(count / 10)));
  for (let s = 0; s < stackLayers; s++) {
    const sy = y + 6 - s * 4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.18)';
    ctx.fillRect(x - 14, sy - 4, 28, 12);

    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.roundRect(x - 13, sy - 6, 26, 11, 2);
    ctx.fill();

    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#fef3c7';
    ctx.fillRect(x - 4, sy - 6, 8, 11);

    ctx.fillStyle = '#15803d';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$', x, sy + 2);
  }
  ctx.restore();
}

/**
 * Draws a crisp custom 2D vector produce icon (used on tables, beds, and carried stacks)
 */
function drawProduceIcon(ctx: CanvasRenderingContext2D, product: ProductType, x: number, y: number, radius = 7) {
  ctx.save();
  if (product === 'tomato') {
    // Glossy Red Tomato with green calyx
    ctx.fillStyle = '#dc2626';
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fca5a5';
    ctx.beginPath();
    ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.arc(x, y - radius * 0.75, radius * 0.35, 0, Math.PI * 2);
    ctx.fill();
  } else if (product === 'corn') {
    // Golden Corn Cob with green husk
    ctx.fillStyle = '#16a34a';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, radius * 0.9, radius * 0.65, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(x, y - 1, radius * 0.65, radius * 0.95, 0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (product === 'egg') {
    // Warm White & Cream Farm Egg
    ctx.fillStyle = '#fffbeb';
    ctx.strokeStyle = '#d97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.ellipse(x, y, radius * 0.72, radius * 0.95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  } else if (product === 'milk') {
    // Glass Milk Bottle with blue cap
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(x - radius * 0.6, y - radius * 0.7, radius * 1.2, radius * 1.5, 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(x - radius * 0.45, y - radius * 0.95, radius * 0.9, radius * 0.35);
  } else {
    // Ribbed Orange Pumpkin
    ctx.fillStyle = '#ea580c';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, radius * 1.05, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.ellipse(x, y + 1, radius * 0.6, radius * 0.85, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#15803d';
    ctx.fillRect(x - 1.5, y - radius, 3, 4);
  }
  ctx.restore();
}

/**
 * 5. Production Plots: Raised Timber Planter Beds, Chicken Coop, Dairy Pasture
 */
function renderProductionPlot(ctx: CanvasRenderingContext2D, plot: ProductionPlot, time: number) {
  ctx.save();

  if (plot.product === 'egg') {
    renderChickenCoop(ctx, plot, time);
    ctx.restore();
    return;
  }

  if (plot.product === 'milk') {
    renderDairyPasture(ctx, plot, time);
    ctx.restore();
    return;
  }

  // 3D RAISED TIMBER GARDEN BED (Tomatoes, Corn, Pumpkins)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.roundRect(plot.x - 3, plot.y + 6, plot.width + 6, plot.height + 2, 12);
  ctx.fill();

  // Outer timber frame (3D front wall + top rim)
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.roundRect(plot.x, plot.y, plot.width, plot.height + 4, 10);
  ctx.fill();

  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.roundRect(plot.x + 2, plot.y, plot.width - 4, plot.height - 2, 8);
  ctx.fill();

  // Rich dark furrowed soil bed inside
  ctx.fillStyle = '#3b1d0a';
  ctx.beginPath();
  ctx.roundRect(plot.x + 8, plot.y + 18, plot.width - 16, plot.height - 26, 6);
  ctx.fill();

  // Soil furrow ridges
  ctx.fillStyle = '#4e270e';
  for (let r = 0; r < 2; r++) {
    ctx.beginPath();
    ctx.roundRect(plot.x + 14, plot.y + 23 + r * 18, plot.width - 28, 11, 4);
    ctx.fill();
  }

  // Wooden Header Signpost at top of bed
  ctx.fillStyle = '#451a03';
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + 18, plot.y - 8, plot.width - 36, 20, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fef3c7';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(plot.name.replace(' 🎃', ''), plot.x + plot.width / 2, plot.y + 5);

  // Leafy crop bushes across the 8 slots (always shows green plants; ripe slots show bobbing produce)
  const maxCols = 4;
  for (let i = 0; i < plot.maxCapacity; i++) {
    const col = i % maxCols;
    const row = Math.floor(i / maxCols);
    const itemX = plot.x + 26 + col * 29;
    const itemY = plot.y + 28 + row * 18;

    // Green leafy bush base
    ctx.fillStyle = '#15803d';
    ctx.beginPath();
    ctx.arc(itemX, itemY + 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.arc(itemX - 3, itemY, 5.5, 0, Math.PI * 2);
    ctx.arc(itemX + 3, itemY, 5.5, 0, Math.PI * 2);
    ctx.fill();

    if (i < plot.readyCount) {
      const itemBob = Math.sin(time * 0.006 + i) * 1.8;
      drawProduceIcon(ctx, plot.product, itemX, itemY - 1 + itemBob, 6.5);
    }
  }

  // Bottom Status Pill (Ready Count + Live Growth Bar)
  const pillX = plot.x + plot.width / 2 - 28;
  const pillY = plot.y + plot.height - 8;
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pillX, pillY, 56, 16, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = plot.readyCount === plot.maxCapacity ? '#4ade80' : '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, pillY + 11);

  ctx.restore();
}

/**
 * Chicken Coop (plot-egg)
 */
function renderChickenCoop(ctx: CanvasRenderingContext2D, plot: ProductionPlot, time: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.roundRect(plot.x - 3, plot.y + 5, plot.width + 6, plot.height + 2, 12);
  ctx.fill();

  // Warm straw paddock with timber fence
  ctx.fillStyle = '#fef08a';
  ctx.strokeStyle = '#92400e';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 10);
  ctx.fill();
  ctx.stroke();

  // Little red hen house roof on top left
  ctx.fillStyle = '#dc2626';
  ctx.strokeStyle = '#7f1d1d';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + 6, plot.y - 10, plot.width - 12, 22, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐔 Chicken Coop', plot.x + plot.width / 2, plot.y + 5);

  for (let i = 0; i < plot.maxCapacity; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const nx = plot.x + 30 + col * 44;
    const ny = plot.y + 34 + row * 26;

    // Woven straw nest
    ctx.fillStyle = '#d97706';
    ctx.beginPath();
    ctx.ellipse(nx, ny + 4, 14, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.ellipse(nx, ny + 3, 11, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    if (i < plot.readyCount) {
      const bob = Math.sin(time * 0.006 + i) * 1.5;
      drawProduceIcon(ctx, 'egg', nx, ny + bob, 6.5);
    } else {
      // Cute white hen sitting on nest
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(nx, ny, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(nx, ny - 7, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(nx + 6, ny, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + plot.width / 2 - 26, plot.y + plot.height - 8, 52, 16, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height + 3);
}

/**
 * Dairy Pasture (plot-milk)
 */
function renderDairyPasture(ctx: CanvasRenderingContext2D, plot: ProductionPlot, time: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.beginPath();
  ctx.roundRect(plot.x - 3, plot.y + 5, plot.width + 6, plot.height + 2, 12);
  ctx.fill();

  ctx.fillStyle = '#bbf7d0';
  ctx.strokeStyle = '#15803d';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 10);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#14532d';
  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + 14, plot.y - 10, plot.width - 28, 22, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🐮 Dairy Pasture', plot.x + plot.width / 2, plot.y + 5);

  // Cute Dairy Cow on left
  const cowX = plot.x + 36;
  const cowY = plot.y + 48;
  ctx.fillStyle = '#ffffff';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(cowX - 16, cowY - 12, 32, 22, 8);
  ctx.fill();
  ctx.stroke();
  // Cow spots
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.arc(cowX - 6, cowY - 4, 5, 0, Math.PI * 2);
  ctx.arc(cowX + 7, cowY + 2, 4, 0, Math.PI * 2);
  ctx.fill();
  // Pink snout
  ctx.fillStyle = '#fbcfe8';
  ctx.beginPath();
  ctx.ellipse(cowX, cowY + 6, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Milk bottles on right rack
  for (let i = 0; i < plot.readyCount; i++) {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const bob = Math.sin(time * 0.006 + i) * 1.5;
    drawProduceIcon(ctx, 'milk', plot.x + 76 + col * 22, plot.y + 34 + row * 24 + bob, 6.5);
  }

  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = plot.readyCount === plot.maxCapacity ? '#22c55e' : '#38bdf8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plot.x + plot.width / 2 - 26, plot.y + plot.height - 8, 52, 16, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height + 3);
}

/**
 * 6. 3D Wooden Country Market Stalls (Display Tables)
 */
function renderDisplayTable(ctx: CanvasRenderingContext2D, shelf: Shelf, time: number) {
  ctx.save();

  // Floor shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.roundRect(shelf.x - 4, shelf.y + 6, shelf.width + 8, shelf.height + 6, 10);
  ctx.fill();

  // 3D Wooden Stand Base / Front Apron
  ctx.fillStyle = '#78350f';
  ctx.beginPath();
  ctx.roundRect(shelf.x, shelf.y + 8, shelf.width, shelf.height, 8);
  ctx.fill();

  // Slanted Honey-Oak Crate Top
  ctx.fillStyle = '#b45309';
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(shelf.x, shelf.y, shelf.width, shelf.height - 6, 8);
  ctx.fill();
  ctx.stroke();

  // Recessed Dark Crate Interior Tray (where produce sits)
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.roundRect(shelf.x + 6, shelf.y + 15, shelf.width - 12, shelf.height - 27, 5);
  ctx.fill();

  // Striped Market Valence Header across top of stall
  const headerColors: Record<ProductType, string> = {
    tomato: '#ef4444',
    corn: '#eab308',
    egg: '#f59e0b',
    milk: '#0284c7',
    pumpkin: '#ea580c',
  };
  const accent = headerColors[shelf.product];
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.roundRect(shelf.x + 2, shelf.y + 2, shelf.width - 4, 13, [6, 6, 2, 2]);
  ctx.fill();

  // Clean Stall Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(shelf.name.replace(' 🎃', ''), shelf.x + shelf.width / 2, shelf.y + 11.5);

  // Stocked produce items drawn as crisp glossy vector icons inside the crate
  const stockCols = 4;
  for (let i = 0; i < shelf.currentStock; i++) {
    const col = i % stockCols;
    const row = Math.floor(i / stockCols);
    const sx = shelf.x + 16 + col * 19;
    const sy = shelf.y + 24 + row * 13;
    drawProduceIcon(ctx, shelf.product, sx, sy, 5.8);
  }

  // Front Apron Progress Bar + Stock Pill (Clean, never floating in raw text)
  const barX = shelf.x + 10;
  const barY = shelf.y + shelf.height - 4;
  const barW = shelf.width - 20;
  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(barX, barY, barW, 13, 5);
  ctx.fill();

  const fillW = Math.max(0, ((barW - 2) * shelf.currentStock) / shelf.maxStock);
  if (fillW > 0) {
    ctx.fillStyle = shelf.currentStock === shelf.maxStock ? '#16a34a' : '#d97706';
    ctx.beginPath();
    ctx.roundRect(barX + 1, barY + 1, fillW, 11, 4);
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`${shelf.currentStock}/${shelf.maxStock} ($${PRODUCTS[shelf.product].sellPrice})`, shelf.x + shelf.width / 2, barY + 9.5);

  // Floating Deposit Indicator (Only bounces gently above when not full)
  if (shelf.currentStock < shelf.maxStock) {
    const arrowBob = Math.sin(time * 0.007) * 3;
    const arrowX = shelf.x + shelf.width / 2;
    const arrowY = shelf.y - 11 + arrowBob;

    ctx.fillStyle = '#facc15';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(arrowX - 6, arrowY - 4);
    ctx.lineTo(arrowX + 6, arrowY - 4);
    ctx.lineTo(arrowX, arrowY + 4);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

/**
 * 7. Unlock Pads (Progressive Disclosure)
 */
function renderUnlockPad(ctx: CanvasRenderingContext2D, pad: UnlockPad, time: number) {
  ctx.save();
  const pulse = Math.sin(time * 0.005) * 2;

  // Outer glow
  ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.arc(pad.x, pad.y, pad.radius + pulse, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  if (pad.paid > 0) {
    const startAngle = -Math.PI / 2;
    const endAngle = startAngle + (pad.paid / pad.cost) * Math.PI * 2;
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.arc(pad.x, pad.y, pad.radius + pulse, startAngle, endAngle);
    ctx.stroke();
  }

  // Pad Header Pill
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(pad.x - 56, pad.y - 26, 112, 18, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(pad.title, pad.x, pad.y - 14);

  // Price Pill
  ctx.fillStyle = '#064e3b';
  ctx.strokeStyle = '#22c55e';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(pad.x - 32, pad.y - 2, 64, 16, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#4ade80';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText(`$${pad.paid}/${pad.cost}`, pad.x, pad.y + 9);
  ctx.restore();
}

/**
 * Shared 2.5D Chibi Human Character Renderer (Used for Farmer Hero & Cashier)
 */
function renderChibiCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  opts: {
    shirtColor: string;
    overallsColor: string;
    hatColor: string;
    skinColor: string;
    tilt: number;
    walkPhase: number;
    isMoving: boolean;
    label?: string;
    labelColor?: string;
  }
) {
  ctx.save();
  const bob = opts.isMoving ? Math.abs(Math.sin(opts.walkPhase)) * 2.5 : 0;
  const footSwing = opts.isMoving ? Math.sin(opts.walkPhase) * 4.5 : 0;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.26)';
  ctx.beginPath();
  ctx.ellipse(x, y + 14, 13, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.translate(x, y - bob);
  ctx.rotate(opts.tilt);

  // Boots
  ctx.fillStyle = '#451a03';
  ctx.beginPath();
  ctx.ellipse(-5, 11 + footSwing, 4.5, 3.2, 0, 0, Math.PI * 2);
  ctx.ellipse(5, 11 - footSwing, 4.5, 3.2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Shirt & Overalls Torso
  ctx.fillStyle = opts.shirtColor;
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.roundRect(-10, -6, 20, 17, 7);
  ctx.fill();
  ctx.stroke();

  // Denim Overalls Apron & Straps
  ctx.fillStyle = opts.overallsColor;
  ctx.beginPath();
  ctx.roundRect(-8, -1, 16, 12, [2, 2, 6, 6]);
  ctx.fill();
  ctx.fillRect(-7, -6, 3.5, 6);
  ctx.fillRect(3.5, -6, 3.5, 6);

  // Brass overall buttons
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(-5.2, -1, 1.3, 0, Math.PI * 2);
  ctx.arc(5.2, -1, 1.3, 0, Math.PI * 2);
  ctx.fill();

  // Swinging Hands
  ctx.fillStyle = opts.skinColor;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(-11, 2 - footSwing * 0.5, 3.5, 0, Math.PI * 2);
  ctx.arc(11, 2 + footSwing * 0.5, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Chibi Head
  ctx.fillStyle = opts.skinColor;
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, -14, 10.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Rosy Cheeks, Eyes & Smile
  ctx.fillStyle = '#fda4af';
  ctx.beginPath();
  ctx.arc(-5.5, -12, 2.2, 0, Math.PI * 2);
  ctx.arc(5.5, -12, 2.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-3.5, -14.5, 1.6, 0, Math.PI * 2);
  ctx.arc(3.5, -14.5, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Straw Farmer Hat (Brim + Crown + Red Ribbon)
  ctx.fillStyle = opts.hatColor;
  ctx.strokeStyle = '#854d0e';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.ellipse(0, -21, 14, 4.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(-8, -28, 16, 7.5, [5, 5, 1, 1]);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-8, -22.5, 16, 2.2);

  ctx.restore();

  if (opts.label) {
    ctx.save();
    ctx.fillStyle = opts.labelColor || '#0284c7';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - 18, y - 43, 36, 13, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'black 8px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.label, x, y - 34);
    ctx.restore();
  }
}

/**
 * 9. The Hero Farmer Player (With Straw Sunhat, Overalls & Wooden Harvest Crate Stack)
 */
function renderFarmerHero(
  ctx: CanvasRenderingContext2D,
  p: PlayerState,
  time: number,
  isMoving: boolean
) {
  ctx.save();
  const walkPhase = isMoving ? time * 0.015 : 0;

  let tilt = 0;
  if (isMoving) {
    if (p.facing === 'left') tilt = -0.11;
    else if (p.facing === 'right') tilt = 0.11;
    else if (p.facing === 'up') tilt = -0.04;
    else if (p.facing === 'down') tilt = 0.04;
  }

  // Subtle floor ring under player
  const beaconPulse = Math.sin(time * 0.008) * 2;
  ctx.fillStyle = 'rgba(2, 132, 199, 0.16)';
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 13, 18 + beaconPulse, 8 + beaconPulse * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  renderChibiCharacter(ctx, p.x, p.y, {
    shirtColor: '#ef4444',
    overallsColor: '#1d4ed8',
    hatColor: '#fde047',
    skinColor: '#fde68a',
    tilt,
    walkPhase,
    isMoving,
    label: p.stack.length === 0 ? 'YOU' : undefined,
    labelColor: '#0284c7',
  });

  // Carried produce stack in a 3D wooden crate above head
  if (p.stack.length > 0) {
    const sway = isMoving ? Math.sin(walkPhase) * 2 : 0;
    renderCarriedStack(ctx, p.x + sway, p.y - 38, p.stack);

    const stackTopY = p.y - 38 - p.stack.length * 13;
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = p.stack.length >= p.capacity ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p.x - 18, stackTopY - 16, 36, 14, 5);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.stack.length >= p.capacity ? '#fca5a5' : '#4ade80';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${p.stack.length}/${p.capacity}`, p.x, stackTopY - 6);
  }

  ctx.restore();
}

/**
 * 10. Cute Chibi Animal Customers (Bunny, Cat, Dog, Bear, Pig)
 * Features distinct animal ears, snouts, eyes, shopping baskets, and non-overlapping compact side badges!
 */
function renderAnimalCustomer(ctx: CanvasRenderingContext2D, cust: Customer, time: number) {
  ctx.save();
  const speciesThemes: Record<
    string,
    { fur: string; innerEar: string; shirt: string; snout: string }
  > = {
    bunny: { fur: '#fdf2f8', innerEar: '#f472b6', shirt: '#ec4899', snout: '#fbcfe8' },
    cat: { fur: '#fdba74', innerEar: '#fb7185', shirt: '#0d9488', snout: '#ffedd5' },
    dog: { fur: '#fcd34d', innerEar: '#92400e', shirt: '#2563eb', snout: '#fef3c7' },
    bear: { fur: '#b45309', innerEar: '#fde68a', shirt: '#16a34a', snout: '#fde68a' },
    pig: { fur: '#fda4af', innerEar: '#f43f5e', shirt: '#7c3aed', snout: '#fb7185' },
    ghost: { fur: '#e2e8f0', innerEar: '#94a3b8', shirt: '#475569', snout: '#f8fafc' },
  };
  const theme = speciesThemes[cust.species] ?? speciesThemes.bunny!;

  const isWalking = cust.state === 'shopping' || cust.state === 'to_register' || cust.state === 'leaving';
  const walkPhase = isWalking ? time * 0.012 : 0;
  const bob = isWalking ? Math.abs(Math.sin(walkPhase)) * 2 : 0;
  const footSwing = isWalking ? Math.sin(walkPhase) * 3.5 : 0;
  const tilt = isWalking ? (cust.facing === 'left' ? -0.09 : 0.09) : 0;

  // Ground shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.24)';
  ctx.beginPath();
  ctx.ellipse(cust.x, cust.y + 13, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(cust.x, cust.y - bob);
  ctx.rotate(tilt);

  // Paws / Feet
  ctx.fillStyle = '#334155';
  ctx.beginPath();
  ctx.ellipse(-4.5, 10 + footSwing, 3.8, 2.8, 0, 0, Math.PI * 2);
  ctx.ellipse(4.5, 10 - footSwing, 3.8, 2.8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute Shopper Sweater/Apron Torso
  ctx.fillStyle = theme.shirt;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 16, 7);
  ctx.fill();
  ctx.stroke();

  // White collar trim
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(0, -5, 5, 2, 0, 0, Math.PI);
  ctx.fill();

  // Animal Ears (behind/top of head)
  ctx.fillStyle = theme.fur;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.lineWidth = 1.2;
  if (cust.species === 'bunny') {
    // Tall bunny ears
    ctx.beginPath();
    ctx.ellipse(-4.5, -25, 3.2, 7.5, -0.1, 0, Math.PI * 2);
    ctx.ellipse(4.5, -25, 3.2, 7.5, 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.innerEar;
    ctx.beginPath();
    ctx.ellipse(-4.5, -25, 1.6, 5, -0.1, 0, Math.PI * 2);
    ctx.ellipse(4.5, -25, 1.6, 5, 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (cust.species === 'cat') {
    // Pointed cat ears
    ctx.beginPath();
    ctx.moveTo(-9, -18);
    ctx.lineTo(-6, -26);
    ctx.lineTo(-1, -21);
    ctx.closePath();
    ctx.moveTo(9, -18);
    ctx.lineTo(6, -26);
    ctx.lineTo(1, -21);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } else {
    // Round bear / dog / pig ears
    ctx.beginPath();
    ctx.arc(-7.5, -21, 4.2, 0, Math.PI * 2);
    ctx.arc(7.5, -21, 4.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = theme.innerEar;
    ctx.beginPath();
    ctx.arc(-7.5, -21, 2.2, 0, Math.PI * 2);
    ctx.arc(7.5, -21, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Animal Head
  ctx.fillStyle = theme.fur;
  ctx.strokeStyle = 'rgba(15, 23, 42, 0.5)';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, -13.5, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Cute Snout & Nose
  ctx.fillStyle = theme.snout;
  ctx.beginPath();
  ctx.ellipse(0, -11.5, 4.2, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cust.species === 'pig' ? '#e11d48' : '#1e293b';
  ctx.beginPath();
  ctx.arc(0, -12.3, 1.4, 0, Math.PI * 2);
  ctx.fill();

  // Expressive Eyes
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-3.6, -15, 1.5, 0, Math.PI * 2);
  ctx.arc(3.6, -15, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Little Wicker Shopping Basket held in front when carrying items
  if (cust.basket.length > 0) {
    ctx.fillStyle = '#d97706';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(-8, -1, 16, 9, 3);
    ctx.fill();
    ctx.stroke();
    drawProduceIcon(ctx, cust.basket[0]!, 0, 2, 4.2);
  }

  ctx.restore();

  // COMPACT NON-OVERLAPPING SPEECH BUBBLE:
  // - When in_queue: placed neatly to the RIGHT side (cust.x + 16) so vertically stacked customers NEVER cover each other!
  // - When shopping: placed cleanly above head.
  if (cust.state === 'in_queue') {
    const isFront = cust.queueIndex === 0;
    const bx = cust.x + 15;
    const by = cust.y - 20;
    ctx.fillStyle = isFront ? '#dcfce7' : '#ffffff';
    ctx.strokeStyle = isFront ? '#16a34a' : '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(bx, by, isFront ? 38 : 26, 17, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = isFront ? '#15803d' : '#475569';
    ctx.font = 'bold 8.5px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isFront ? '💵 PAY' : `#${cust.queueIndex + 1}`, bx + (isFront ? 19 : 13), by + 11.5);
  } else if (cust.state === 'leaving') {
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('💚', cust.x, cust.y - 27);
  } else {
    const want = cust.wants[0];
    if (want) {
      const rem = Math.max(1, want.amount - want.collected);
      const bx = cust.x - 20;
      const by = cust.y - 43;
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(bx, by, 40, 18, 6);
      ctx.fill();
      ctx.stroke();

      drawProduceIcon(ctx, want.product, cust.x - 7, by + 9, 4.8);
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 9.5px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`x${rem}`, cust.x, by + 12.5);
    }
  }

  ctx.restore();
}

/**
 * 11. Helper Worker (Barnaby the Farmhand Dog)
 */
function renderHelperDog(ctx: CanvasRenderingContext2D, h: HelperWorker, time: number) {
  ctx.save();
  const isWalking = h.state !== 'idle';
  const walkPhase = isWalking ? time * 0.014 : 0;
  const bob = isWalking ? Math.abs(Math.sin(walkPhase)) * 2 : 0;

  // Shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(h.x, h.y + 13, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(h.x, h.y - bob);

  // Golden Retriever / Corgi Body
  ctx.fillStyle = '#f59e0b';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.roundRect(-9, -6, 18, 16, 7);
  ctx.fill();
  ctx.stroke();

  // Red Farm Bandana
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.moveTo(-7, -5);
  ctx.lineTo(7, -5);
  ctx.lineTo(0, 2);
  ctx.closePath();
  ctx.fill();

  // Floppy Brown Ears & Head
  ctx.fillStyle = '#92400e';
  ctx.beginPath();
  ctx.ellipse(-8.5, -14, 3.5, 6, 0.2, 0, Math.PI * 2);
  ctx.ellipse(8.5, -14, 3.5, 6, -0.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbbf24';
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.arc(0, -14, 9.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Eyes & Nose
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(-3.5, -15, 1.5, 0, Math.PI * 2);
  ctx.arc(3.5, -15, 1.5, 0, Math.PI * 2);
  ctx.arc(0, -12, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  if (h.stack.length > 0) {
    renderCarriedStack(ctx, h.x, h.y - 34, h.stack);
  }
  ctx.restore();
}

/**
 * Helper to render vertical stack of carried produce items inside mini wooden trays
 */
function renderCarriedStack(
  ctx: CanvasRenderingContext2D,
  baseX: number,
  baseY: number,
  stack: ProductType[]
) {
  for (let i = 0; i < stack.length; i++) {
    const item = stack[i]!;
    const itemY = baseY - i * 13;
    ctx.save();
    // Mini wooden crate tray
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(baseX - 11, itemY - 5, 22, 11, 3);
    ctx.fill();
    ctx.stroke();

    drawProduceIcon(ctx, item, baseX, itemY - 1, 5.5);
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

  // Center pointer dot
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(capX, capY, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

/**
 * 14. World Mini-Map Radar (Screen-Space Top-Right HUD)
 * Provides high-level spatial awareness of the entire 1500x1100 expanded farm & mini mart
 */
function renderWorldMinimap(
  ctx: CanvasRenderingContext2D,
  state: MartGameState,
  camX: number,
  camY: number
) {
  ctx.save();
  const mapW = 140;
  const mapH = 95;
  const mapX = 800 - mapW - 14;
  const mapY = 14;
  const scaleX = mapW / WORLD_BOUNDS.width;
  const scaleY = mapH / WORLD_BOUNDS.height;

  // Background map box
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(mapX, mapY, mapW, mapH, 8);
  ctx.fill();
  ctx.stroke();

  // Mini Store Area (Peach rectangle)
  ctx.fillStyle = '#fed7aa';
  ctx.fillRect(
    mapX + 180 * scaleX,
    mapY + 60 * scaleY,
    1040 * scaleX,
    470 * scaleY
  );
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 1;
  ctx.strokeRect(
    mapX + 180 * scaleX,
    mapY + 60 * scaleY,
    1040 * scaleX,
    470 * scaleY
  );

  // Mini Farm Plots (Green squares)
  for (const plot of state.plots) {
    if (!plot.unlocked) continue;
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(
      mapX + plot.x * scaleX,
      mapY + plot.y * scaleY,
      Math.max(5, plot.width * scaleX),
      Math.max(4, plot.height * scaleY)
    );
  }

  // Mini Shelves (Amber dots)
  for (const shelf of state.shelves) {
    if (!shelf.unlocked) continue;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(
      mapX + shelf.x * scaleX,
      mapY + shelf.y * scaleY,
      Math.max(4, shelf.width * scaleX),
      Math.max(3, shelf.height * scaleY)
    );
  }

  // Mini Checkout Counter (Turquoise dot)
  ctx.fillStyle = '#22d3ee';
  ctx.fillRect(
    mapX + state.register.x * scaleX,
    mapY + state.register.y * scaleY,
    Math.max(5, state.register.width * scaleX),
    Math.max(3, state.register.height * scaleY)
  );

  // Camera Viewport Box on Minimap (Shows what is currently on screen)
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(
    mapX + camX * scaleX,
    mapY + camY * scaleY,
    800 * scaleX,
    600 * scaleY
  );

  // Player Marker (Cyan/Blue dot with pulse)
  const px = mapX + state.player.x * scaleX;
  const py = mapY + state.player.y * scaleY;
  ctx.fillStyle = '#0284c7';
  ctx.beginPath();
  ctx.arc(px, py, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Mini Map Title badge
  ctx.fillStyle = '#10b981';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('🗺️ MAP', mapX + 6, mapY + 11);

  ctx.restore();
}

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createInitialMartState,
  updateMartGame,
  upgradePlayerSpeed,
  upgradePlayerCapacity,
  saveMartState,
  loadMartState,
  MartGameState,
  PRODUCTS,
  WORLD_BOUNDS,
  ProductType,
} from './logic/engine';
import { farmMartAudio } from './systems/sound';
import {
  Coins,
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
  Compass,
} from 'lucide-react';

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
    if (window.confirm('Reset your farm market and restart from scratch?')) {
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
            Math.hypot(currentInput.dx, currentInput.dy) > 0.05
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
      {/* 1. TOP FARM MART HUD */}
      <div className="w-full bg-slate-900/95 border border-amber-500/30 px-3 sm:px-4 py-2 sm:py-2.5 rounded-t-2xl flex items-center justify-between shadow-xl gap-2">
        {/* Left: Coins Balance & Reputation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-500/25 to-yellow-500/20 border-2 border-amber-400/60 px-3 py-1.5 rounded-xl text-amber-300 font-black text-sm sm:text-base shadow-lg shadow-amber-500/10 min-h-[44px]">
            <Coins className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0 animate-bounce" />
            <span className="font-mono text-white text-base sm:text-lg">{gameState.player.coins}</span>
            <span className="text-[10px] sm:text-xs text-amber-300 font-bold uppercase tracking-wider hidden xs:inline">Coins</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Market Lvl {gameState.reputationLevel}</span>
          </div>
        </div>

        {/* Center: Live Dynamic Objective Helper Pill */}
        <div className="flex-1 mx-1 sm:mx-2 max-w-md hidden md:flex items-center justify-center">
          <div className="w-full bg-slate-800/90 border border-amber-400/40 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-inner">
            <span className="text-base shrink-0">{currentObjective.icon}</span>
            <span className="text-xs font-black text-amber-200 truncate">{currentObjective.text}</span>
          </div>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs sm:text-sm px-3 py-2 rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer transition-transform active:scale-95 min-h-[44px]"
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
            <HelpCircle className="w-4 h-4 text-amber-400" />
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
      <div className="w-full md:hidden bg-slate-900 border-x border-amber-500/30 px-3 py-1.5 flex items-center gap-2">
        <span className="text-base shrink-0">{currentObjective.icon}</span>
        <span className="text-xs font-black text-amber-200 truncate">{currentObjective.text}</span>
      </div>

      {/* 2. MAIN CANVAS VIEWPORT (800x600 coordinate world) */}
      <div className="relative w-full bg-slate-950 border border-amber-500/30 shadow-2xl overflow-hidden aspect-[4/3] rounded-b-2xl">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="w-full h-full block cursor-pointer touch-none"
        />

        {/* Floating Touch Guidance on Canvas */}
        {!touchActive && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-black text-amber-300 border border-amber-500/40 flex items-center gap-2 shadow-lg animate-pulse">
            <span>👆 Drag thumb anywhere to walk!</span>
          </div>
        )}

        {/* Toggle D-Pad Pill on Mobile */}
        <div className="sm:hidden absolute top-2 right-2 z-10">
          <button
            onClick={() => setShowTouchDpad((prev) => !prev)}
            className="px-2.5 py-1 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-wider active:scale-95 cursor-pointer"
          >
            {showTouchDpad ? 'Hide D-Pad' : 'Show D-Pad'}
          </button>
        </div>
      </div>

      {/* Optional Ergonomic Mobile D-Pad Buttons */}
      {showTouchDpad && (
        <div className="w-full flex justify-center py-2 bg-slate-900/90 border border-slate-800 rounded-xl mt-2 select-none touch-none">
          <div className="grid grid-cols-3 gap-2 w-48">
            <div />
            <button
              onPointerDown={() => setDpadDir(0, -1)}
              onPointerUp={() => setDpadDir(0, 0)}
              onPointerLeave={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-amber-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow"
            >
              <ArrowUp className="w-6 h-6" />
            </button>
            <div />
            <button
              onPointerDown={() => setDpadDir(-1, 0)}
              onPointerUp={() => setDpadDir(0, 0)}
              onPointerLeave={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-amber-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <button
              onPointerDown={() => setDpadDir(0, 1)}
              onPointerUp={() => setDpadDir(0, 0)}
              onPointerLeave={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-amber-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow"
            >
              <ArrowDown className="w-6 h-6" />
            </button>
            <button
              onPointerDown={() => setDpadDir(1, 0)}
              onPointerUp={() => setDpadDir(0, 0)}
              onPointerLeave={() => setDpadDir(0, 0)}
              className="w-14 h-12 bg-slate-800 active:bg-amber-500 border border-slate-700 rounded-xl flex items-center justify-center text-white active:text-slate-950 font-black cursor-pointer shadow"
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 3. UPGRADES MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">🏪</span>
                <div>
                  <h3 className="text-xl font-black text-amber-400">Market Upgrades</h3>
                  <p className="text-xs text-slate-400">Boost walking speed & harvest backpack capacity</p>
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

            {/* Current Balance */}
            <div className="mb-4 bg-gradient-to-r from-amber-500/20 to-yellow-500/10 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between text-amber-300 font-bold">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Your Coins</span>
              </div>
              <span className="text-xl font-mono font-black text-white">{gameState.player.coins} 💰</span>
            </div>

            <div className="space-y-3">
              {/* Speed Upgrade */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-sm text-white">Walking Speed</span>
                    <span className="text-xs bg-slate-700 text-amber-300 font-mono px-2 py-0.5 rounded-full font-bold">
                      Lvl {gameState.player.speedLevel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Move faster around the farm and market</p>
                </div>
                <button
                  onClick={handleUpgradeSpeed}
                  disabled={gameState.player.coins < 25 * gameState.player.speedLevel}
                  className={`px-4 py-2 rounded-xl font-black text-xs min-h-[44px] flex items-center gap-1 cursor-pointer transition-all ${
                    gameState.player.coins >= 25 * gameState.player.speedLevel
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                  }`}
                >
                  <span>{25 * gameState.player.speedLevel} 💰</span>
                </button>
              </div>

              {/* Capacity Upgrade */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-sm text-white">Backpack Capacity</span>
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
                  <span>{30 * gameState.player.capacityLevel} 💰</span>
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
                    {gameState.helper.unlocked ? 'Working autonomously on farm!' : 'Unlock pad in pasture yard (90 💰)'}
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
                    {gameState.register.hasCashier ? 'Auto-serves all customers!' : 'Unlock pad in front of counter (150 💰)'}
                  </p>
                </div>
                <span className={`text-xs font-black px-2.5 py-1 rounded-xl ${gameState.register.hasCashier ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-700 text-slate-400'}`}>
                  {gameState.register.hasCashier ? 'HIRED ✅' : 'LOCKED 🔒'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-6 w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black rounded-xl cursor-pointer min-h-[44px] shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
            >
              Resume Farming 🚜
            </button>
          </div>
        </div>
      )}

      {/* 4. HELP MODAL */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📖</span>
                <div>
                  <h3 className="text-xl font-black text-amber-400">How to Play Farm Mini Mart</h3>
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
                  <strong className="text-amber-300">1. Harvest Crops:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Walk near ripe plots (Tomatoes, Corn, Eggs, Milk, Pumpkins) to collect them in your carried backpack stack.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">📦</span>
                <div>
                  <strong className="text-amber-300">2. Restock Shelves:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Walk to matching display crates in the market to stock them with fresh farm produce.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🐰</span>
                <div>
                  <strong className="text-amber-300">3. Serve Animal Customers:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Animals enter the shop, grab items from shelves, and line up at the Cash Register.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">💰</span>
                <div>
                  <strong className="text-amber-300">4. Cash Out & Collect:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Stand on the glowing Cashier Mat behind the register to ring up customers. Coins drop right on the counter and are magnetically collected!</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/60">
                <span className="text-2xl">🌟</span>
                <div>
                  <strong className="text-amber-300">5. Unlock & Automate:</strong>
                  <p className="text-xs text-slate-400 mt-0.5">Stand on yellow unlock pads to deposit coins and unlock new crops, the Farmhand Dog 🐶, and Register Cashier 🧑‍💼.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl cursor-pointer min-h-[44px] shadow-lg shadow-amber-500/25 active:scale-98 transition-all"
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
  // 1. If coins are sitting on the counter, collect them!
  if (state.register.coinsOnCounter > 0) {
    return {
      icon: '💰',
      text: `${state.register.coinsOnCounter} COINS READY! Walk to Cash Register to collect your earnings!`,
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

  // 5. If player has enough coins to unlock next station
  const affordablePad = state.unlockPads.find(
    (pad) => !pad.unlocked && state.player.coins >= pad.cost - pad.paid
  );
  if (affordablePad) {
    return {
      icon: '🔓',
      text: `Stand on the yellow pad to unlock ${affordablePad.title}! (${affordablePad.cost - affordablePad.paid} 💰)`,
    };
  }

  // Default: Harvest and keep shelves full
  return {
    icon: '🌾',
    text: 'Harvest crops, stock shelves, and serve animal customers!',
  };
}

/**
 * Procedural Canvas 2D scene renderer for Farm Mini Mart
 * Delivers crisp, rich, high-contrast visual clarity and high-budget arcade aesthetic.
 */
function renderMartScene(
  ctx: CanvasRenderingContext2D,
  state: MartGameState,
  time: number,
  touchOrigin: { x: number; y: number } | null,
  touchCurrent: { x: number; y: number } | null,
  isMoving: boolean
) {
  ctx.save();
  ctx.clearRect(0, 0, 800, 600);

  // 1. BACKGROUND FARM PASTURE (Country Grass & Earth)
  ctx.fillStyle = '#166534'; // Lush deep emerald lawn
  ctx.fillRect(0, 0, 800, 600);

  // Decorative lawn stripes / checkered farm grass
  ctx.fillStyle = 'rgba(74, 222, 128, 0.08)';
  for (let x = 0; x < 800; x += 40) {
    for (let y = 0; y < 600; y += 40) {
      if ((x / 40 + y / 40) % 2 === 0) {
        ctx.fillRect(x, y, 40, 40);
      }
    }
  }

  // Little field daisies & clover patches
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  const flowerSpots = [
    [50, 60], [180, 50], [60, 520], [190, 530],
    [720, 60], [740, 500], [620, 540], [300, 40]
  ];
  for (const [fx, fy] of flowerSpots) {
    ctx.beginPath();
    ctx.arc(fx!, fy!, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. INDOOR STORE AREA (Warm Honey Oak Wooden Floor)
  const storeX = 230;
  const storeY = 70;
  const storeW = 340;
  const storeH = 450;

  // Store floor shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.roundRect(storeX - 4, storeY - 4, storeW + 8, storeH + 8, 16);
  ctx.fill();

  // Honey Oak Planks Base
  ctx.fillStyle = '#b45309';
  ctx.beginPath();
  ctx.roundRect(storeX, storeY, storeW, storeH, 14);
  ctx.fill();

  // Alternating wood planks
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 2;
  for (let y = storeY; y <= storeY + storeH; y += 28) {
    ctx.beginPath();
    ctx.moveTo(storeX, y);
    ctx.lineTo(storeX + storeW, y);
    ctx.stroke();
  }

  // Decorative Entrance Mat
  ctx.fillStyle = '#ea580c';
  ctx.beginPath();
  ctx.roundRect(360, 495, 80, 24, 6);
  ctx.fill();
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'black 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME 🛒', 400, 511);

  // 3. CASHIER MAT (KASA PASPASI) - Highly Visible Yellow/Emerald Zone Behind Register
  const reg = state.register;
  const cashierMatX = 350;
  const cashierMatY = 245;
  const cashierMatW = 100;
  const cashierMatH = 55;

  ctx.save();
  const matPulse = Math.sin(time * 0.006) * 0.15 + 0.85;
  ctx.fillStyle = `rgba(234, 179, 8, ${0.18 * matPulse})`;
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  ctx.beginPath();
  ctx.roundRect(cashierMatX, cashierMatY, cashierMatW, cashierMatH, 10);
  ctx.fill();
  ctx.stroke();
  ctx.setLineDash([]);

  // Shoe footprints & label on the mat
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('👟 STAND HERE 👟', cashierMatX + cashierMatW / 2, cashierMatY + 24);
  ctx.font = 'bold 8px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('CASHIER DESK', cashierMatX + cashierMatW / 2, cashierMatY + 40);
  ctx.restore();

  // 4. CASH REGISTER & COUNTER DESK
  ctx.save();
  // Counter drop shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
  ctx.beginPath();
  ctx.roundRect(reg.x - 2, reg.y + 4, reg.width + 4, reg.height, 10);
  ctx.fill();

  // Mahogany Counter
  ctx.fillStyle = '#4c1d95'; // Royal purple velvet counter front
  ctx.strokeStyle = '#fbbf24'; // Gold counter edge
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(reg.x, reg.y, reg.width, reg.height, 10);
  ctx.fill();
  ctx.stroke();

  // Register Machine
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.roundRect(reg.x + reg.width / 2 - 16, reg.y + 8, 32, 24, 6);
  ctx.fill();
  ctx.fillStyle = '#38bdf8';
  ctx.fillRect(reg.x + reg.width / 2 - 12, reg.y + 12, 24, 10); // Glowing register display
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔔', reg.x + reg.width / 2, reg.y + 36);

  // Counter text badge
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('CASH REGISTER', reg.x + reg.width / 2, reg.y + 46);

  // Cashier Worker if unlocked
  if (reg.hasCashier) {
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🧑‍💼', reg.x + reg.width / 2, reg.y - 6);
    ctx.fillStyle = '#a855f7';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('AUTO CASHIER', reg.x + reg.width / 2, reg.y - 24);
  }

  // 3D COIN PILES & COLLECTION ALERT ON COUNTER
  if (reg.coinsOnCounter > 0) {
    const coinPileX = reg.x + reg.width + 25;
    const coinPileY = reg.y + 25;

    // Glowing collection ring
    ctx.save();
    const coinPulse = Math.sin(time * 0.008) * 4;
    ctx.fillStyle = 'rgba(250, 204, 21, 0.3)';
    ctx.beginPath();
    ctx.arc(coinPileX, coinPileY, 32 + coinPulse, 0, Math.PI * 2);
    ctx.fill();

    // Stacked Gold Coins cylinders
    const stackHeight = Math.min(6, Math.max(2, Math.floor(reg.coinsOnCounter / 5)));
    for (let c = 0; c < stackHeight; c++) {
      const cy = coinPileY + 6 - c * 5;
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.ellipse(coinPileX, cy, 14, 6, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.ellipse(coinPileX, cy - 2, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Floating Coin Amount Badge
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(coinPileX - 35, coinPileY - 32, 70, 20, 8);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`+${reg.coinsOnCounter} 💰`, coinPileX, coinPileY - 18);
    ctx.restore();
  }

  // Customer queue footprints on floor
  for (let i = 0; i < WORLD_BOUNDS.checkoutSpots.length; i++) {
    const spot = WORLD_BOUNDS.checkoutSpots[i]!;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${i + 1}`, spot.x, spot.y + 3);
  }
  ctx.restore();

  // 5. PRODUCTION PLOTS (Farm Yard Soil & Crops)
  for (const plot of state.plots) {
    if (!plot.unlocked) continue;

    ctx.save();
    // Soft plot shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.roundRect(plot.x - 2, plot.y + 4, plot.width + 4, plot.height, 12);
    ctx.fill();

    // Dark Rich Tilled Farm Soil
    ctx.fillStyle = '#3f200e';
    ctx.strokeStyle = '#78350f';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 10);
    ctx.fill();
    ctx.stroke();

    // Soil ridges
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.lineWidth = 2;
    for (let py = plot.y + 24; py < plot.y + plot.height - 10; py += 18) {
      ctx.beginPath();
      ctx.moveTo(plot.x + 8, py);
      ctx.lineTo(plot.x + plot.width - 8, py);
      ctx.stroke();
    }

    // Title Header
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${PRODUCTS[plot.product].emoji} ${plot.name}`, plot.x + plot.width / 2, plot.y + 16);

    // Render crop items inside plot with lively bounce
    const maxCols = 4;
    for (let i = 0; i < plot.readyCount; i++) {
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);
      const itemX = plot.x + 20 + col * 24;
      const itemY = plot.y + 36 + row * 24;
      const itemBob = Math.sin(time * 0.005 + i) * 2;

      ctx.font = '18px sans-serif';
      ctx.fillText(PRODUCTS[plot.product].emoji, itemX, itemY + itemBob);
    }

    // Capacity pill
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = plot.readyCount === plot.maxCapacity ? '#facc15' : 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(plot.x + plot.width / 2 - 24, plot.y + plot.height - 18, 48, 15, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = plot.readyCount === plot.maxCapacity ? '#facc15' : '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height - 6);

    ctx.restore();
  }

  // 6. SHELVES / DISPLAY STANDS (Market Crates)
  for (const shelf of state.shelves) {
    if (!shelf.unlocked) continue;

    ctx.save();
    // Stand shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.roundRect(shelf.x - 2, shelf.y + 4, shelf.width + 4, shelf.height, 10);
    ctx.fill();

    // Stand Crate Base
    ctx.fillStyle = '#78350f';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(shelf.x, shelf.y, shelf.width, shelf.height, 10);
    ctx.fill();
    ctx.stroke();

    // Top wooden lip
    ctx.fillStyle = '#92400e';
    ctx.fillRect(shelf.x + 4, shelf.y + 4, shelf.width - 8, 16);

    // Shelf Title & Icon
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${PRODUCTS[shelf.product].emoji} ${shelf.name}`, shelf.x + shelf.width / 2, shelf.y + 16);

    // Stock items stacked inside stand
    const stockCols = 4;
    for (let i = 0; i < shelf.currentStock; i++) {
      const col = i % stockCols;
      const row = Math.floor(i / stockCols);
      const sx = shelf.x + 18 + col * 18;
      const sy = shelf.y + 36 + row * 16;
      ctx.font = '15px sans-serif';
      ctx.fillText(PRODUCTS[shelf.product].emoji, sx, sy);
    }

    // Stock progress gauge bar
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(shelf.x + 8, shelf.y + shelf.height - 11, shelf.width - 16, 6);
    const fillW = ((shelf.width - 16) * shelf.currentStock) / shelf.maxStock;
    ctx.fillStyle = shelf.currentStock === 0 ? '#ef4444' : shelf.currentStock === shelf.maxStock ? '#22c55e' : '#f59e0b';
    ctx.fillRect(shelf.x + 8, shelf.y + shelf.height - 11, fillW, 6);

    // Stock count pill
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${shelf.currentStock}/${shelf.maxStock}`, shelf.x + shelf.width / 2, shelf.y + shelf.height + 12);

    ctx.restore();
  }

  // 7. UNLOCK PADS
  for (const pad of state.unlockPads) {
    if (pad.unlocked) continue;

    ctx.save();
    const pulse = Math.sin(time * 0.005) * 2;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.arc(pad.x, pad.y, pad.radius + pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.22)';
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress circle fill
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

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(`${pad.paid}/${pad.cost} 💰`, pad.x, pad.y + 12);
    ctx.restore();
  }

  // 8. HELPER WORKER (Barnaby Dog 🐶)
  if (state.helper.unlocked) {
    ctx.save();
    const h = state.helper;

    // Helper shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(h.x, h.y + 10, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Helper Dog Emoji & Nametag
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.emoji, h.x, h.y + 4);

    // Carried stack
    renderCarriedStack(ctx, h.x, h.y - 18, h.stack);
    ctx.restore();
  }

  // 9. ANIMAL CUSTOMERS
  for (const cust of state.customers) {
    ctx.save();
    // Soft shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(cust.x, cust.y + 10, 14, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Customer character
    ctx.font = '28px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cust.emoji, cust.x, cust.y + 4);

    // Customer Thought / Wishlist Bubble
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(cust.x - 24, cust.y - 42, 48, 22, 8);
    ctx.fill();
    ctx.stroke();

    // Little triangle pointer under speech bubble
    ctx.beginPath();
    ctx.moveTo(cust.x - 4, cust.y - 20);
    ctx.lineTo(cust.x, cust.y - 15);
    ctx.lineTo(cust.x + 4, cust.y - 20);
    ctx.fill();

    if (cust.state === 'in_queue' || cust.state === 'leaving') {
      ctx.font = 'bold 10px sans-serif';
      ctx.fillStyle = '#16a34a';
      ctx.fillText('PAID 🛒', cust.x, cust.y - 27);
    } else {
      const want = cust.wants[0];
      if (want) {
        ctx.font = 'bold 11px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`${PRODUCTS[want.product].emoji} x${want.amount}`, cust.x, cust.y - 27);
      }
    }

    if (cust.state === 'leaving') {
      ctx.font = '16px sans-serif';
      ctx.fillText('❤️', cust.x + 18, cust.y - 28);
    }

    ctx.restore();
  }

  // 10. THE HERO FARMER (HIGH-CONTRAST, HIGH-VISIBILITY CHARACTER)
  ctx.save();
  const p = state.player;

  // A. Luminous Beacon Floor Ring (Makes character instantly visible!)
  const beaconPulse = Math.sin(time * 0.008) * 3;
  ctx.fillStyle = 'rgba(234, 179, 8, 0.28)';
  ctx.beginPath();
  ctx.arc(p.x, p.y + 12, 28 + beaconPulse, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y + 12, 24, 0, Math.PI * 2);
  ctx.stroke();

  // Directional pointer notch on the beacon ring
  const facingAngles: Record<string, number> = {
    down: Math.PI / 2,
    up: -Math.PI / 2,
    left: Math.PI,
    right: 0,
  };
  const faceAngle = facingAngles[p.facing] ?? Math.PI / 2;
  const notchX = p.x + Math.cos(faceAngle) * 24;
  const notchY = p.y + 12 + Math.sin(faceAngle) * 24;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(notchX, notchY, 5, 0, Math.PI * 2);
  ctx.fill();

  // B. Soft foot shadow
  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 14, 16, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // C. Farmer Walking Legs & Boots Animation
  const walkPhase = isMoving ? time * 0.014 : 0;
  const legOffset = Math.sin(walkPhase) * 5;

  ctx.fillStyle = '#78350f'; // Sturdy brown boots
  ctx.fillRect(p.x - 9, p.y + 10 + legOffset, 6, 8);
  ctx.fillRect(p.x + 3, p.y + 10 - legOffset, 6, 8);

  // D. Farmer Denim Overalls & Flannel Shirt Body
  ctx.fillStyle = '#1d4ed8'; // Vibrant blue overalls
  ctx.beginPath();
  ctx.roundRect(p.x - 12, p.y - 12, 24, 22, 6);
  ctx.fill();

  // Brass Overall Buttons
  ctx.fillStyle = '#facc15';
  ctx.beginPath();
  ctx.arc(p.x - 6, p.y - 8, 2, 0, Math.PI * 2);
  ctx.arc(p.x + 6, p.y - 8, 2, 0, Math.PI * 2);
  ctx.fill();

  // Red Checkered Shirt Collar
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(p.x - 8, p.y - 16, 16, 5);

  // E. Farmer Face & Cheerful Eyes
  ctx.fillStyle = '#fed7aa'; // Rosy peach skin tone
  ctx.beginPath();
  ctx.arc(p.x, p.y - 20, 11, 0, Math.PI * 2);
  ctx.fill();

  // Rosy cheeks
  ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
  ctx.beginPath();
  ctx.arc(p.x - 7, p.y - 18, 2.5, 0, Math.PI * 2);
  ctx.arc(p.x + 7, p.y - 18, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // Big expressive eyes that look towards movement
  const eyeShiftX = p.facing === 'left' ? -2 : p.facing === 'right' ? 2 : 0;
  const eyeShiftY = p.facing === 'up' ? -2 : p.facing === 'down' ? 1 : 0;
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(p.x - 4 + eyeShiftX, p.y - 21 + eyeShiftY, 2.2, 0, Math.PI * 2);
  ctx.arc(p.x + 4 + eyeShiftX, p.y - 21 + eyeShiftY, 2.2, 0, Math.PI * 2);
  ctx.fill();

  // White eye reflections
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(p.x - 4.5 + eyeShiftX, p.y - 21.5 + eyeShiftY, 0.8, 0, Math.PI * 2);
  ctx.arc(p.x + 3.5 + eyeShiftX, p.y - 21.5 + eyeShiftY, 0.8, 0, Math.PI * 2);
  ctx.fill();

  // Smile
  ctx.strokeStyle = '#7c2d12';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y - 17, 3, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.stroke();

  // F. Big Straw Hat with Red Band
  const hatBob = isMoving ? Math.sin(walkPhase) * 2 : 0;
  ctx.fillStyle = '#d97706'; // Straw hat shadow
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 27 + hatBob, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fbbf24'; // Warm golden straw hat
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 29 + hatBob, 19, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Hat Crown Dome
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 33 + hatBob, 11, Math.PI, 0);
  ctx.fill();

  // Red ribbon hat band
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(p.x - 11, p.y - 32 + hatBob, 22, 3);

  // G. Floating "YOU" Marker Badge above Farmer
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(p.x - 16, p.y - 48 + hatBob, 32, 14, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#facc15';
  ctx.font = 'black 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('YOU 🧑‍🌾', p.x, p.y - 38 + hatBob);

  // H. Carried Harvest Backpack Stack
  if (p.stack.length > 0) {
    renderCarriedStack(ctx, p.x, p.y - 54 + hatBob, p.stack);

    // Capacity Badge
    const stackTopY = p.y - 54 + hatBob - p.stack.length * 16;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = p.stack.length >= p.capacity ? '#ef4444' : '#22c55e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(p.x - 20, stackTopY - 14, 40, 15, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = p.stack.length >= p.capacity ? '#ef4444' : '#22c55e';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${p.stack.length}/${p.capacity}`, p.x, stackTopY - 3);
  }

  ctx.restore();

  // 11. FLOATING NOTIFICATIONS (COIN POPUPS & UNLOCKS)
  for (const note of state.floatingNotes) {
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

  // 12. FLOATING VIRTUAL JOYSTICK (ON MOBILE DRAG)
  if (touchOrigin && touchCurrent) {
    ctx.save();
    // Outer base
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(touchOrigin.x, touchOrigin.y, 45, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner thumbstick cap
    const dx = touchCurrent.x - touchOrigin.x;
    const dy = touchCurrent.y - touchOrigin.y;
    const dist = Math.hypot(dx, dy);
    const capDist = Math.min(dist, 40);
    const angle = Math.atan2(dy, dx);
    const capX = touchOrigin.x + Math.cos(angle) * capDist;
    const capY = touchOrigin.y + Math.sin(angle) * capDist;

    ctx.fillStyle = '#f59e0b';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(capX, capY, 20, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  ctx.restore();
}

/**
 * Helper to render carried vertical item stack
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
    ctx.font = '18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(PRODUCTS[item].emoji, baseX, itemY);
    ctx.restore();
  }
}

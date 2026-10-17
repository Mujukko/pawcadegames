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
} from 'lucide-react';

export const FarmMiniMartContainer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<MartGameState>(() => {
    return loadMartState() || createInitialMartState();
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => farmMartAudio.getMuted());
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);
  const [showHelpModal, setShowHelpModal] = useState<boolean>(false);

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
    if (window.confirm('Reset your farm market and start from scratch?')) {
      const fresh = createInitialMartState();
      setGameState(fresh);
      saveMartState(fresh);
    }
  }, []);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if inside an input or modal is open with specific inputs
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
    const maxRadius = 50;

    if (dist > 6) {
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

      // Periodic state sync to React & LocalStorage every 2 seconds
      saveTimer += dt;
      if (saveTimer > 2000) {
        saveTimer = 0;
        setGameState(nextState);
        saveMartState(nextState);
      }

      // Render onto 2D Canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          renderMartScene(ctx, nextState, now, touchOriginRef.current, touchCurrentRef.current);
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

  return (
    <div className="relative w-full flex flex-col items-center select-none touch-none">
      {/* Top Farm Mart HUD */}
      <div className="w-full max-w-4xl bg-slate-900/95 border-b border-orange-500/30 px-2 sm:px-4 py-2 sm:py-2.5 rounded-t-2xl flex items-center justify-between shadow-lg">
        {/* Left: Coins & Reputation */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/40 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-amber-300 font-black text-xs sm:text-base shadow-sm min-h-[38px] sm:min-h-[44px]">
            <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400 shrink-0" />
            <span>{gameState.player.coins}</span>
            <span className="text-[10px] sm:text-xs text-amber-200/80 hidden xs:inline">Coins</span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-300">
            <Store className="w-3.5 h-3.5 text-orange-400" />
            <span>Reputation Lvl {gameState.reputationLevel}</span>
          </div>
        </div>

        {/* Center: Market Status */}
        <div className="hidden md:flex items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            OPEN 🏪
          </span>
        </div>

        {/* Right: Quick Action Buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          <button
            onClick={() => setShowUpgradeModal(true)}
            className="flex items-center gap-1 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black text-xs sm:text-sm px-2.5 py-1.5 sm:px-3 sm:py-1.5 rounded-xl shadow-md cursor-pointer transition-transform active:scale-95 min-h-[44px]"
            title="Open Upgrades Shop"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="hidden xs:inline">UPGRADES</span>
            <span className="xs:hidden">UPG</span>
          </button>

          <button
            onClick={() => setShowHelpModal(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="How to Play"
            aria-label="How to play"
          >
            <HelpCircle className="w-4 h-4 text-orange-400" />
          </button>

          <button
            onClick={toggleSound}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            aria-label="Toggle Sound"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
          </button>

          <button
            onClick={handleReset}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 border border-slate-700 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Reset Game"
            aria-label="Reset Game"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport (800x600 coordinate world) */}
      <div className="relative w-full max-w-4xl bg-slate-950 border border-orange-500/20 shadow-2xl rounded-b-2xl overflow-hidden aspect-[4/3]">
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

        {/* On-screen touch instructions indicator on mobile */}
        {!touchActive && (
          <div className="sm:hidden absolute bottom-3 left-1/2 -translate-x-1/2 pointer-events-none bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold text-orange-300 border border-orange-500/30 flex items-center gap-1.5 animate-pulse">
            <span>👆 Drag thumb anywhere to walk</span>
          </div>
        )}
      </div>

      {/* Upgrades Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-orange-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏪</span>
                <h3 className="text-xl font-black text-orange-400">Farm Shop Upgrades</h3>
              </div>
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Current Balance */}
            <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-center justify-between text-amber-300 font-bold">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-amber-400" />
                <span>Your Coins</span>
              </div>
              <span className="text-lg font-black">{gameState.player.coins} 💰</span>
            </div>

            <div className="space-y-3">
              {/* Speed Upgrade */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <span className="font-extrabold text-sm">Walking Speed</span>
                    <span className="text-xs text-orange-300 font-bold">Lvl {gameState.player.speedLevel}/5</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Move faster around the farm mart</p>
                </div>
                <button
                  onClick={handleUpgradeSpeed}
                  disabled={gameState.player.coins < 25 * Math.pow(2, gameState.player.speedLevel - 1) || gameState.player.speedLevel >= 5}
                  className="px-3 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md min-h-[44px]"
                >
                  {gameState.player.speedLevel >= 5 ? 'MAX' : `${25 * Math.pow(2, gameState.player.speedLevel - 1)} 💰`}
                </button>
              </div>

              {/* Carry Capacity Upgrade */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-400" />
                    <span className="font-extrabold text-sm">Carry Stack Capacity</span>
                    <span className="text-xs text-emerald-300 font-bold">Lvl {gameState.player.capacityLevel}/5</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">Hold up to {gameState.player.capacity} items in your hands</p>
                </div>
                <button
                  onClick={handleUpgradeCapacity}
                  disabled={gameState.player.coins < 35 * Math.pow(2, gameState.player.capacityLevel - 1) || gameState.player.capacityLevel >= 5}
                  className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed shadow-md min-h-[44px]"
                >
                  {gameState.player.capacityLevel >= 5 ? 'MAX' : `${35 * Math.pow(2, gameState.player.capacityLevel - 1)} 💰`}
                </button>
              </div>

              {/* Helper Status */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">🐶</span>
                    <span className="font-extrabold text-sm">Farmhand Dog</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gameState.helper.unlocked ? 'Active & working autonomously!' : 'Unlock pad in the yard (90 💰)'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${gameState.helper.unlocked ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {gameState.helper.unlocked ? 'HIRED ✅' : 'LOCKED 🔒'}
                </span>
              </div>

              {/* Cashier Status */}
              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-purple-400" />
                    <span className="font-extrabold text-sm">Register Cashier</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {gameState.register.hasCashier ? 'Auto-serves all customers!' : 'Unlock pad in front of counter (150 💰)'}
                  </p>
                </div>
                <span className={`text-xs font-bold px-2 py-1 rounded-lg ${gameState.register.hasCashier ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-400'}`}>
                  {gameState.register.hasCashier ? 'HIRED ✅' : 'LOCKED 🔒'}
                </span>
              </div>
            </div>

            <button
              onClick={() => setShowUpgradeModal(false)}
              className="mt-6 w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl cursor-pointer min-h-[44px]"
            >
              Resume Farming 🚜
            </button>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-orange-500/40 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📖</span>
                <h3 className="text-xl font-black text-orange-400">How to Play Farm Mart</h3>
              </div>
              <button
                onClick={() => setShowHelpModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg bg-slate-800"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-sm text-slate-300">
              <div className="flex items-start gap-2.5">
                <span className="text-xl">🍅</span>
                <div>
                  <strong className="text-orange-300">1. Harvest Crops:</strong>
                  <p className="text-xs text-slate-400">Walk near ripe plots (Tomatoes, Corn, Eggs, Milk, Pumpkins) to collect them in your carried stack.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-xl">📦</span>
                <div>
                  <strong className="text-orange-300">2. Restock Shelves:</strong>
                  <p className="text-xs text-slate-400">Walk to matching display stands to stock them with produce.</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-xl">🐰</span>
                <div>
                  <strong className="text-orange-300">3. Serve Animal Customers:</strong>
                  <p className="text-xs text-slate-400">Animals enter the shop, grab items from shelves, and line up at the Cash Register (Kasa).</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-xl">💰</span>
                <div>
                  <strong className="text-orange-300">4. Cash Out:</strong>
                  <p className="text-xs text-slate-400">Stand behind the cash counter to serve the customer, then walk over the gold coins to collect your profit!</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="text-xl">🌟</span>
                <div>
                  <strong className="text-orange-300">5. Unlock & Automate:</strong>
                  <p className="text-xs text-slate-400">Stand on unlock pads to deposit coins and unlock new crops, stands, the Farmhand Dog 🐶, and Cashier 🧑‍💼.</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="mt-6 w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl cursor-pointer min-h-[44px]"
            >
              Got It, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Procedural Canvas 2D scene renderer for Farm Mini Mart
 */
function renderMartScene(
  ctx: CanvasRenderingContext2D,
  state: MartGameState,
  time: number,
  touchOrigin: { x: number; y: number } | null,
  touchCurrent: { x: number; y: number } | null
) {
  ctx.save();
  ctx.clearRect(0, 0, 800, 600);

  // 1. Background Farm Grass & Soil
  ctx.fillStyle = '#1e3a1f'; // Deep rich country grass
  ctx.fillRect(0, 0, 800, 600);

  // Checkered pasture lawn pattern
  ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
  for (let x = 0; x < 800; x += 40) {
    for (let y = 0; y < 600; y += 40) {
      if ((x / 40 + y / 40) % 2 === 0) {
        ctx.fillRect(x, y, 40, 40);
      }
    }
  }

  // 2. Indoor Store Wooden Floor (The Mini Mart Area)
  ctx.fillStyle = '#78350f'; // Warm oak planks
  ctx.fillRect(230, 70, 340, 450);

  // Wooden plank lines
  ctx.strokeStyle = '#451a03';
  ctx.lineWidth = 1.5;
  for (let y = 70; y <= 520; y += 30) {
    ctx.beginPath();
    ctx.moveTo(230, y);
    ctx.lineTo(570, y);
    ctx.stroke();
  }

  // Store Front Door / Welcome Mat
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(360, 500, 80, 20);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WELCOME', 400, 514);

  // 3. Render Production Plots (Left & Right yards)
  for (const plot of state.plots) {
    if (!plot.unlocked) continue;

    ctx.save();
    // Plot soil background
    ctx.fillStyle = '#3e2312';
    ctx.strokeStyle = '#271406';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(plot.x, plot.y, plot.width, plot.height, 10);
    ctx.fill();
    ctx.stroke();

    // Plot Title Header
    ctx.fillStyle = '#fde047';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${PRODUCTS[plot.product].emoji} ${plot.name}`, plot.x + plot.width / 2, plot.y + 16);

    // Render crop items inside plot
    const maxCols = 4;
    for (let i = 0; i < plot.readyCount; i++) {
      const col = i % maxCols;
      const row = Math.floor(i / maxCols);
      const itemX = plot.x + 20 + col * 24;
      const itemY = plot.y + 36 + row * 24;

      // Draw item
      ctx.font = '16px sans-serif';
      ctx.fillText(PRODUCTS[plot.product].emoji, itemX, itemY);
    }

    // Capacity pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.beginPath();
    ctx.roundRect(plot.x + plot.width / 2 - 20, plot.y + plot.height - 18, 40, 14, 6);
    ctx.fill();
    ctx.fillStyle = plot.readyCount === plot.maxCapacity ? '#facc15' : '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${plot.readyCount}/${plot.maxCapacity}`, plot.x + plot.width / 2, plot.y + plot.height - 7);

    ctx.restore();
  }

  // 4. Render Shelves / Display Stands
  for (const shelf of state.shelves) {
    if (!shelf.unlocked) continue;

    ctx.save();
    // 3D Wooden Stand
    ctx.fillStyle = '#92400e';
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(shelf.x, shelf.y, shelf.width, shelf.height, 8);
    ctx.fill();
    ctx.stroke();

    // Top trim
    ctx.fillStyle = '#b45309';
    ctx.fillRect(shelf.x + 4, shelf.y + 4, shelf.width - 8, 16);

    // Shelf Name & Emoji
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${PRODUCTS[shelf.product].emoji} ${shelf.name}`, shelf.x + shelf.width / 2, shelf.y + 16);

    // Stock items visually stacked inside shelf
    const stockCols = 4;
    for (let i = 0; i < shelf.currentStock; i++) {
      const col = i % stockCols;
      const row = Math.floor(i / stockCols);
      const sx = shelf.x + 18 + col * 18;
      const sy = shelf.y + 36 + row * 16;
      ctx.font = '14px sans-serif';
      ctx.fillText(PRODUCTS[shelf.product].emoji, sx, sy);
    }

    // Stock gauge bar
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(shelf.x + 10, shelf.y + shelf.height - 12, shelf.width - 20, 6);
    const fillW = ((shelf.width - 20) * shelf.currentStock) / shelf.maxStock;
    ctx.fillStyle = shelf.currentStock === 0 ? '#ef4444' : '#22c55e';
    ctx.fillRect(shelf.x + 10, shelf.y + shelf.height - 12, fillW, 6);

    // Count text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${shelf.currentStock}/${shelf.maxStock}`, shelf.x + shelf.width / 2, shelf.y + shelf.height + 12);

    ctx.restore();
  }

  // 5. Render Cash Register & Counter
  ctx.save();
  const reg = state.register;
  // Wooden counter desk
  ctx.fillStyle = '#581c87'; // Royal purple counter cloth
  ctx.strokeStyle = '#3b0764';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(reg.x, reg.y, reg.width, reg.height, 8);
  ctx.fill();
  ctx.stroke();

  // Register machine
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(reg.x + reg.width / 2 - 14, reg.y + 8, 28, 22);
  ctx.fillStyle = '#facc15';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🔔', reg.x + reg.width / 2, reg.y + 24);

  // Counter text
  ctx.fillStyle = '#fde047';
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('CASH REGISTER', reg.x + reg.width / 2, reg.y + 44);

  // Coins stacked on counter
  if (reg.coinsOnCounter > 0) {
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#facc15';
    ctx.fillText(`💰 ${reg.coinsOnCounter}`, reg.x + reg.width + 15, reg.y + 25);
  }

  // Cashier if unlocked
  if (reg.hasCashier) {
    ctx.font = '22px sans-serif';
    ctx.fillText('🧑‍💼', reg.x + reg.width / 2, reg.y - 8);
  }

  // Queue slots on floor
  for (let i = 0; i < WORLD_BOUNDS.checkoutSpots.length; i++) {
    const spot = WORLD_BOUNDS.checkoutSpots[i]!;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${i + 1}`, spot.x, spot.y + 3);
  }
  ctx.restore();

  // 6. Render Unlock Pads
  for (const pad of state.unlockPads) {
    if (pad.unlocked) continue;

    ctx.save();
    // Pulse animation
    const pulse = Math.sin(time * 0.005) * 2;
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 4]);

    ctx.beginPath();
    ctx.arc(pad.x, pad.y, pad.radius + pulse, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(234, 179, 8, 0.18)';
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress circle fill
    if (pad.paid > 0) {
      const startAngle = -Math.PI / 2;
      const endAngle = startAngle + (pad.paid / pad.cost) * Math.PI * 2;
      ctx.strokeStyle = '#22c55e';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(pad.x, pad.y, pad.radius + pulse, startAngle, endAngle);
      ctx.stroke();
    }

    // Pad title and price
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pad.title, pad.x, pad.y - 10);

    ctx.fillStyle = '#facc15';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(`${pad.paid}/${pad.cost} 💰`, pad.x, pad.y + 12);
    ctx.restore();
  }

  // 7. Render Helper Worker (Barnaby Dog 🐶)
  if (state.helper.unlocked) {
    ctx.save();
    const h = state.helper;
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(h.emoji, h.x, h.y);

    // Render helper carried stack
    renderCarriedStack(ctx, h.x, h.y - 18, h.stack);
    ctx.restore();
  }

  // 8. Render Animal Customers
  for (const cust of state.customers) {
    ctx.save();
    // Customer emoji
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(cust.emoji, cust.x, cust.y);

    // Customer Thought / Wishlist Bubble
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cust.x - 22, cust.y - 42, 44, 22, 6);
    ctx.fill();
    ctx.stroke();

    // Wishlist emoji inside bubble
    if (cust.state === 'in_queue' || cust.state === 'leaving') {
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#16a34a';
      ctx.fillText('🛒 PAID', cust.x, cust.y - 27);
    } else {
      const want = cust.wants[0];
      if (want) {
        ctx.font = '12px sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(`${PRODUCTS[want.product].emoji} ${want.amount}`, cust.x, cust.y - 27);
      }
    }

    // Little heart on leaving
    if (cust.state === 'leaving') {
      ctx.font = '14px sans-serif';
      ctx.fillText('❤️', cust.x + 18, cust.y - 30);
    }

    ctx.restore();
  }

  // 9. Render Player Farmer & Carried Stack
  ctx.save();
  const p = state.player;

  // Shadow under player feet
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 12, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cute Farmer Emoji (or Witch Hat for Halloween!)
  ctx.font = '32px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🧑‍🌾', p.x, p.y + 6);

  // Spooky Halloween witch hat on top of farmer!
  ctx.fillStyle = '#4c1d95';
  ctx.beginPath();
  ctx.moveTo(p.x - 12, p.y - 16);
  ctx.lineTo(p.x, p.y - 36);
  ctx.lineTo(p.x + 12, p.y - 16);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(p.x - 10, p.y - 18, 20, 3); // orange ribbon band

  // Stack of carried items floating vertically above player!
  renderCarriedStack(ctx, p.x, p.y - 36, p.stack);

  // Capacity Counter Pill above stack
  if (p.stack.length > 0) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.roundRect(p.x - 18, p.y - 48 - p.stack.length * 14, 36, 15, 6);
    ctx.fill();
    ctx.fillStyle = p.stack.length >= p.capacity ? '#ef4444' : '#22c55e';
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText(`${p.stack.length}/${p.capacity}`, p.x, p.y - 37 - p.stack.length * 14);
  }

  ctx.restore();

  // 10. Render Floating Notifications / Coin Popups
  for (const note of state.floatingNotes) {
    ctx.save();
    const progress = 1 - note.lifeMs / note.maxLifeMs;
    const alpha = Math.max(0, 1 - progress);
    const riseY = note.y - progress * 35;

    ctx.globalAlpha = alpha;
    ctx.fillStyle = note.color;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeText(note.text, note.x, riseY);
    ctx.fillText(note.text, note.x, riseY);
    ctx.restore();
  }

  // 11. Render Touch Floating Joystick (Mobile)
  if (touchOrigin && touchCurrent) {
    ctx.save();
    // Outer base
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.strokeStyle = 'rgba(249, 115, 22, 0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(touchOrigin.x, touchOrigin.y, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Inner thumbstick cap
    const dx = touchCurrent.x - touchOrigin.x;
    const dy = touchCurrent.y - touchOrigin.y;
    const dist = Math.hypot(dx, dy);
    const capDist = Math.min(dist, 45);
    const angle = Math.atan2(dy, dx);
    const capX = touchOrigin.x + Math.cos(angle) * capDist;
    const capY = touchOrigin.y + Math.sin(angle) * capDist;

    ctx.fillStyle = '#f97316';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(capX, capY, 22, 0, Math.PI * 2);
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
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(PRODUCTS[item].emoji, baseX, itemY);
  }
}

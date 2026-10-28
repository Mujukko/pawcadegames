import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  CatCafeState,
  CustomerCat,
  RecipeId,
  RECIPES,
  collectLatte,
  collectTaiyaki,
  createInitialCatCafeState,
  discardPlatterItem,
  prepDonut,
  prepStrawberryCake,
  serveCustomerAtSeat,
  startBakingTaiyaki,
  startSteamingLatte,
  stepCatCafe,
} from './logic/engine';
import { catCafeAudio } from './systems/sound';
import { analytics } from '../../lib/analytics';

export const CatCafeRushContainer: React.FC = () => {
  const [gameState, setGameState] = useState<CatCafeState>(() => createInitialCatCafeState(1));
  const [isMuted, setIsMuted] = useState<boolean>(() => catCafeAudio.getMuted());
  const [floatingCoin, setFloatingCoin] = useState<{ id: number; text: string; x: number; y: number } | null>(null);

  const stateRef = useRef<CatCafeState>(gameState);
  stateRef.current = gameState;

  const lastMilestoneRef = useRef<number>(0);

  // GA4 game start tracking
  useEffect(() => {
    analytics.gameStarted('cat-cafe-rush');
    analytics.track('level_started', { gameId: 'cat-cafe-rush', levelId: 1 });
  }, []);

  const handleStartShift = () => {
    setGameState((prev) => {
      const next = { ...prev, status: 'playing' as const };
      catCafeAudio.playMeow();
      return next;
    });
  };

  const handleNextDay = () => {
    const nextDay = stateRef.current.day + 1;
    const newState = createInitialCatCafeState(nextDay);
    newState.coins = stateRef.current.coins;
    newState.score = stateRef.current.score;
    newState.status = 'playing';
    setGameState(newState);
    analytics.track('level_started', { gameId: 'cat-cafe-rush', levelId: nextDay });
    catCafeAudio.playMeow();
  };

  const handleRestartDay = () => {
    const currentDay = stateRef.current.day;
    const newState = createInitialCatCafeState(currentDay);
    newState.status = 'playing';
    setGameState(newState);
    analytics.gameRestarted('cat-cafe-rush', { levelId: currentDay });
    analytics.track('level_started', { gameId: 'cat-cafe-rush', levelId: currentDay });
    catCafeAudio.playMeow();
  };

  const handleToggleSound = () => {
    const muted = catCafeAudio.toggleMute();
    setIsMuted(muted);
  };

  // Kitchen Actions
  const handleWaffleIronClick = () => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;

    if (current.waffleIron.status === 'empty') {
      startBakingTaiyaki(current);
      catCafeAudio.playSizzle();
      setGameState({ ...current });
    } else if (current.waffleIron.status === 'ready' || current.waffleIron.status === 'burnt') {
      const collected = collectTaiyaki(current);
      if (collected) {
        catCafeAudio.playDing();
        setGameState({ ...current });
      }
    }
  };

  const handleSteamerClick = () => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;

    if (current.steamer.status === 'empty') {
      startSteamingLatte(current);
      catCafeAudio.playSteam();
      setGameState({ ...current });
    } else if (current.steamer.status === 'ready') {
      const collected = collectLatte(current);
      if (collected) {
        catCafeAudio.playDing();
        setGameState({ ...current });
      }
    }
  };

  const handlePrepCake = () => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;
    const prepped = prepStrawberryCake(current);
    if (prepped) {
      catCafeAudio.playDing();
      setGameState({ ...current });
    }
  };

  const handlePrepDonut = () => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;
    const prepped = prepDonut(current);
    if (prepped) {
      catCafeAudio.playDing();
      setGameState({ ...current });
    }
  };

  const handleDiscardPlatterItem = (index: number) => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;
    discardPlatterItem(current, index);
    setGameState({ ...current });
  };

  const handleServeCustomer = (seatIndex: number, e: React.MouseEvent) => {
    const current = stateRef.current;
    if (current.status !== 'playing') return;

    const res = serveCustomerAtSeat(current, seatIndex);
    if (res.success) {
      catCafeAudio.playServe();
      catCafeAudio.playPurr();

      // Show floating coin toast
      const rect = e.currentTarget.getBoundingClientRect();
      setFloatingCoin({
        id: Date.now(),
        text: `+${res.earned} 🪙`,
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
      });
      setTimeout(() => setFloatingCoin(null), 900);

      setGameState({ ...current });

      // Milestones
      const milestone = Math.floor(current.score / 250) * 250;
      if (milestone > lastMilestoneRef.current && milestone > 0) {
        lastMilestoneRef.current = milestone;
        analytics.scoreMilestone('cat-cafe-rush', milestone);
      }
    } else {
      catCafeAudio.playAngryHiss();
    }
  };

  // Game Loop
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      const current = stateRef.current;
      if (current.status === 'playing') {
        const { state: nextState, events } = stepCatCafe(current, dt);

        if (events.itemCooked) {
          catCafeAudio.playDing();
        }
        if (events.itemBurnt) {
          catCafeAudio.playAngryHiss();
        }
        if (events.customerLeftAngry) {
          catCafeAudio.playAngryHiss();
        }
        if (events.shiftCleared) {
          catCafeAudio.playShiftComplete();
          analytics.levelCompleted('cat-cafe-rush', {
            levelId: nextState.day,
            score: nextState.score,
          });
        }
        if (events.gameOver) {
          catCafeAudio.playGameOver();
          analytics.levelFailed('cat-cafe-rush', {
            levelId: nextState.day,
            reason: 'missed_shift_target',
          });
        }

        setGameState({ ...nextState });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="relative w-full max-w-[480px] mx-auto flex flex-col items-center select-none bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-rose-500/30 text-slate-100">
      {/* Top Header / HUD */}
      <div className="w-full bg-slate-950/90 backdrop-blur-md px-3.5 py-2.5 flex items-center justify-between border-b border-rose-500/20 z-20">
        <div className="flex items-center gap-2">
          <span className="text-2xl animate-pulse">🐱</span>
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-rose-300">
              Day {gameState.day}: {gameState.dayName}
            </span>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <span className="text-amber-400 font-bold">🪙 {gameState.coins}</span>
              <span className="text-slate-500">•</span>
              <span>
                Orders: {gameState.servedCount}/{gameState.targetServed}
              </span>
            </div>
          </div>
        </div>

        {/* Shift Timer & Sound */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs font-black">
            <span>⏱️</span>
            <span
              className={
                gameState.shiftTimeLeft <= 15 ? 'text-rose-400 animate-pulse' : 'text-slate-200'
              }
            >
              {Math.ceil(gameState.shiftTimeLeft)}s
            </span>
          </div>

          <button
            onClick={handleToggleSound}
            className="w-9 h-9 min-w-[36px] min-h-[36px] rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm border border-slate-700 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
            aria-label="Toggle Sound"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>

      {/* Main Bakery Counter & Customer Arena */}
      <div className="relative w-full bg-gradient-to-b from-rose-950/60 via-slate-900 to-amber-950/30 p-3 flex flex-col gap-3 min-h-[520px]">
        {/* CUSTOMER COUNTER (3 SEATS) */}
        <div className="w-full bg-slate-950/70 backdrop-blur-sm rounded-2xl p-3 border border-rose-400/20 flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase text-rose-300 tracking-wider flex items-center gap-1">
              <span>🐾</span> Counter Seats (Waiting Cats)
            </span>
            {gameState.combo > 1 && (
              <span className="text-xs font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-400/40 animate-bounce">
                🔥 {gameState.combo}X COMBO!
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((seatIndex) => {
              const customer = gameState.customers.find((c) => c.seatIndex === seatIndex);
              const recipe = customer ? RECIPES[customer.order] : null;
              const hasOrderOnPlatter =
                customer && gameState.readyPlatter.includes(customer.order);

              return (
                <div
                  key={seatIndex}
                  className={`relative flex flex-col items-center justify-between p-2 rounded-2xl border transition-all ${
                    customer
                      ? customer.isVip
                        ? 'bg-amber-500/15 border-amber-400/60 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
                        : 'bg-slate-800/80 border-slate-700/80'
                      : 'bg-slate-900/40 border-dashed border-slate-800 text-slate-600'
                  }`}
                  style={{ minHeight: '145px' }}
                >
                  {customer ? (
                    <>
                      {/* Thought Bubble with Order */}
                      <div className="relative -mt-1 bg-white text-slate-950 font-black text-xs px-2 py-1 rounded-xl shadow-md border border-slate-200 flex items-center gap-1 animate-bounce">
                        <span className="text-base">{recipe?.emoji}</span>
                        <span className="text-[10px] hidden sm:inline">{recipe?.name}</span>
                      </div>

                      {/* Cat Avatar */}
                      <div className="text-3xl my-1 select-none">
                        {customer.isVip
                          ? '👑😺'
                          : customer.breed === 'calico'
                          ? '🐱'
                          : customer.breed === 'tabby'
                          ? '😸'
                          : customer.breed === 'tuxedo'
                          ? '🐈‍⬛'
                          : customer.breed === 'siamese'
                          ? '😻'
                          : '😽'}
                      </div>

                      {/* Cat Name & Patience Bar */}
                      <div className="w-full text-center">
                        <span className="text-[10px] font-bold text-slate-300 block truncate">
                          {customer.name}
                        </span>
                        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden mt-0.5">
                          <div
                            className={`h-full transition-all duration-200 ${
                              customer.patience > 60
                                ? 'bg-emerald-400'
                                : customer.patience > 30
                                ? 'bg-yellow-400'
                                : 'bg-rose-500 animate-pulse'
                            }`}
                            style={{ width: `${customer.patience}%` }}
                          />
                        </div>
                      </div>

                      {/* Serve Button */}
                      <button
                        onClick={(e) => handleServeCustomer(seatIndex, e)}
                        className={`w-full mt-1.5 py-1.5 px-2 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
                          hasOrderOnPlatter
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/30 ring-2 ring-emerald-300'
                            : 'bg-slate-700/80 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        SERVE
                      </button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-1 my-auto">
                      <span className="text-2xl opacity-40">🪑</span>
                      <span className="text-[10px] font-bold">Seat {seatIndex + 1}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* READY COUNTER PLATTER (MAX 4 SLOTS) */}
        <div className="w-full bg-slate-950/70 backdrop-blur-sm rounded-2xl p-2.5 border border-amber-500/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase text-amber-300 tracking-wider flex items-center gap-1">
              <span>🍽️</span> Serving Platter ({gameState.readyPlatter.length}/4)
            </span>
            <span className="text-[10px] text-slate-400">Tap item to discard if needed</span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((slotIdx) => {
              const itemId = gameState.readyPlatter[slotIdx];
              const recipe = itemId ? RECIPES[itemId] : null;

              return (
                <button
                  key={slotIdx}
                  onClick={() => itemId && handleDiscardPlatterItem(slotIdx)}
                  disabled={!itemId}
                  className={`h-14 rounded-2xl border flex flex-col items-center justify-center transition-all ${
                    recipe
                      ? 'bg-gradient-to-b from-amber-400/20 to-amber-500/10 border-amber-400/50 hover:border-rose-400/80 cursor-pointer shadow-sm active:scale-95'
                      : 'bg-slate-900/40 border-dashed border-slate-800 text-slate-700 cursor-default'
                  }`}
                >
                  {recipe ? (
                    <>
                      <span className="text-2xl select-none">{recipe.emoji}</span>
                      <span className="text-[9px] font-bold text-amber-200 truncate max-w-[55px]">
                        {recipe.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-xs text-slate-600 font-bold">Slot {slotIdx + 1}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* KITCHEN PREP STATIONS */}
        <div className="w-full bg-slate-950/80 rounded-2xl p-3 border border-rose-500/20 flex flex-col gap-2">
          <span className="text-[11px] font-black uppercase text-rose-300 tracking-wider px-1 flex items-center gap-1">
            <span>👩‍🍳</span> Kitchen Bakery Stations
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {/* 1. Taiyaki Waffle Iron */}
            <button
              onClick={handleWaffleIronClick}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer active:scale-95 min-h-[95px] ${
                gameState.waffleIron.status === 'ready'
                  ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] animate-pulse'
                  : gameState.waffleIron.status === 'burnt'
                  ? 'bg-rose-950 border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                  : gameState.waffleIron.status === 'baking'
                  ? 'bg-orange-500/20 border-orange-400'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700'
              }`}
            >
              <div className="text-2xl select-none">
                {gameState.waffleIron.status === 'burnt'
                  ? '🔥'
                  : gameState.waffleIron.status === 'ready'
                  ? '✨🐟'
                  : '🧇'}
              </div>
              <div className="w-full">
                <span className="text-xs font-black block text-slate-100">Taiyaki Iron</span>
                <span className="text-[10px] font-bold text-amber-300">
                  {gameState.waffleIron.status === 'empty' && 'Tap: Bake'}
                  {gameState.waffleIron.status === 'baking' && 'Baking...'}
                  {gameState.waffleIron.status === 'ready' && 'Ready! Take'}
                  {gameState.waffleIron.status === 'burnt' && 'Burnt! Clear'}
                </span>
              </div>
            </button>

            {/* 2. Matcha Steamer */}
            <button
              onClick={handleSteamerClick}
              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-between text-center transition-all cursor-pointer active:scale-95 min-h-[95px] ${
                gameState.steamer.status === 'ready'
                  ? 'bg-emerald-500/25 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.5)] animate-pulse'
                  : gameState.steamer.status === 'steaming'
                  ? 'bg-teal-500/20 border-teal-400'
                  : 'bg-slate-800/80 hover:bg-slate-750 border-slate-700'
              }`}
            >
              <div className="text-2xl select-none">
                {gameState.steamer.status === 'ready' ? '🍵✨' : '🥛'}
              </div>
              <div className="w-full">
                <span className="text-xs font-black block text-slate-100">Matcha Steamer</span>
                <span className="text-[10px] font-bold text-emerald-300">
                  {gameState.steamer.status === 'empty' && 'Tap: Steam'}
                  {gameState.steamer.status === 'steaming' && 'Frothing...'}
                  {gameState.steamer.status === 'ready' && 'Ready! Take'}
                </span>
              </div>
            </button>

            {/* 3. Strawberry Shortcake Station */}
            <button
              onClick={handlePrepCake}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 flex flex-col items-center justify-between text-center transition-all cursor-pointer active:scale-95 min-h-[95px]"
            >
              <div className="text-2xl select-none">🍰🍓</div>
              <div className="w-full">
                <span className="text-xs font-black block text-slate-100">Cat Shortcake</span>
                <span className="text-[10px] font-bold text-rose-300">Tap: Layer Cake</span>
              </div>
            </button>

            {/* 4. Purr Donut Shelf */}
            <button
              onClick={handlePrepDonut}
              className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-750 border border-slate-700 flex flex-col items-center justify-between text-center transition-all cursor-pointer active:scale-95 min-h-[95px]"
            >
              <div className="text-2xl select-none">🍩✨</div>
              <div className="w-full">
                <span className="text-xs font-black block text-slate-100">Purr Donut</span>
                <span className="text-[10px] font-bold text-yellow-300">Tap: Grab Donut</span>
              </div>
            </button>
          </div>
        </div>

        {/* OVERLAYS */}
        {/* Ready Overlay */}
        {gameState.status === 'ready' && (
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border-2 border-rose-400/50 flex items-center justify-center text-4xl mb-3 shadow-[0_0_24px_rgba(244,63,94,0.4)] animate-bounce">
              🐱🍰
            </div>
            <h2 className="text-2xl font-black text-white mb-1.5 tracking-tight">
              Cat Cafe Rush
            </h2>
            <p className="text-sm text-slate-300 max-w-xs mb-5 leading-relaxed">
              Bake warm fish taiyaki waffles, steam matcha lattes, and serve visiting customer cats before their patience runs out!
            </p>
            <button
              onClick={handleStartShift}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black text-base rounded-xl shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              OPEN CAFE! 🐾
            </button>
          </div>
        )}

        {/* Shift Cleared Overlay */}
        {gameState.status === 'shift_cleared' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2 animate-bounce">🎉</div>
            <h2 className="text-2xl font-black text-emerald-400 mb-1 tracking-tight">
              SHIFT COMPLETE!
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              Day {gameState.day} conquered with {gameState.coins} coins earned!
            </p>
            <button
              onClick={handleNextDay}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(16,185,129,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              NEXT DAY 🚀
            </button>
          </div>
        )}

        {/* Victory Celebration Overlay */}
        {gameState.status === 'victory' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2 animate-pulse">👑</div>
            <h2 className="text-2xl font-black text-amber-400 mb-1 tracking-tight">
              MASTER BARISTA!
            </h2>
            <p className="text-sm text-slate-200 mb-4 max-w-xs">
              King Whiskers gave your cat bakery 5 stars! You finished with {gameState.coins} coins!
            </p>
            <button
              onClick={handleRestartDay}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-black text-base rounded-xl shadow-[0_6px_20px_rgba(245,158,11,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              PLAY AGAIN 🐱🍰
            </button>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameState.status === 'game_over' && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
            <div className="text-5xl mb-2">😿</div>
            <h2 className="text-2xl font-black text-rose-400 mb-1 tracking-tight">
              SHIFT OVER
            </h2>
            <p className="text-sm text-slate-300 mb-4">
              Missed customer target ({gameState.servedCount}/{gameState.targetServed} served)
            </p>
            <button
              onClick={handleRestartDay}
              className="w-full max-w-[220px] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white font-black text-base rounded-xl shadow-[0_6px_20px_rgba(244,63,94,0.4)] transition-transform active:scale-95 cursor-pointer"
            >
              TRY SHIFT AGAIN 🔄
            </button>
          </div>
        )}
      </div>

      {/* Floating Coin Toast Animation */}
      {floatingCoin && (
        <div
          className="fixed pointer-events-none z-50 text-amber-300 font-black text-lg animate-float-fade"
          style={{ left: floatingCoin.x, top: floatingCoin.y }}
        >
          {floatingCoin.text}
        </div>
      )}
    </div>
  );
};

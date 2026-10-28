import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  addSweetness,
  addTopping,
  createInitialState,
  nextShift,
  pourTea,
  restartShift,
  sealAndStraw,
  serveOrder,
  SHIFT_CONFIGS,
  toggleIce,
  trashCup,
  updateEngine,
} from './logic/engine';
import { BobaTeaBase, BobaTopping, FarmBobaState, SweetnessLevel } from './logic/types';
import { farmBobaSound } from './systems/sound';

export const FarmBobaTeaContainer: React.FC = () => {
  const [state, setState] = useState<FarmBobaState>(() => createInitialState(1));
  const stateRef = useRef<FarmBobaState>(state);
  stateRef.current = state;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const lastTimeRef = useRef<number>(performance.now());

  const toggleSound = useCallback(() => {
    const next = farmBobaSound.toggleSound();
    setSoundEnabled(next);
  }, []);

  const handleAddTopping = (topping: BobaTopping) => {
    const next = addTopping(stateRef.current, topping);
    if (next !== stateRef.current) {
      farmBobaSound.playToppingDrop();
      setState(next);
    }
  };

  const handlePourTea = (tea: BobaTeaBase) => {
    const next = pourTea(stateRef.current, tea);
    if (next !== stateRef.current) {
      farmBobaSound.playLiquidPour();
      setState(next);
    }
  };

  const handleToggleIce = () => {
    const next = toggleIce(stateRef.current);
    if (next !== stateRef.current) {
      farmBobaSound.playIceClink();
      setState(next);
    }
  };

  const handleAddSweetness = (level: SweetnessLevel) => {
    const next = addSweetness(stateRef.current, level);
    if (next !== stateRef.current) {
      farmBobaSound.playSyrupPump();
      setState(next);
    }
  };

  const handleSealAndStraw = () => {
    const next = sealAndStraw(stateRef.current);
    if (next !== stateRef.current) {
      farmBobaSound.playStrawPoke();
      setState(next);
    }
  };

  const handleTrashCup = () => {
    const next = trashCup(stateRef.current);
    setState(next);
  };

  const handleServe = () => {
    const next = serveOrder(stateRef.current);
    if (next !== stateRef.current) {
      const served = next.events.find((e) => e.type === 'order_served');
      const failed = next.events.find((e) => e.type === 'order_failed');
      const cleared = next.events.find((e) => e.type === 'shift_clear');

      if (cleared) farmBobaSound.playShiftClear();
      else if (served) farmBobaSound.playOrderServed();
      else if (failed) farmBobaSound.playOrderFailed();

      setState(next);
    }
  };

  const handleNextShift = () => {
    const next = nextShift(stateRef.current);
    setState(next);
  };

  const handleRestart = () => {
    const next = restartShift(stateRef.current);
    setState(next);
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        handleServe();
      } else if (e.key === 't' || e.key === 'T') {
        handleTrashCup();
      } else if (e.key === 's' || e.key === 'S') {
        handleSealAndStraw();
      } else if (e.key === 'i' || e.key === 'I') {
        handleToggleIce();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleServe, handleTrashCup, handleSealAndStraw, handleToggleIce, toggleSound]);

  // Game Loop for Customer Patience Decay
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const prevState = stateRef.current;
      const nextState = updateEngine(prevState, dt);

      if (nextState.events.some((e) => e.type === 'order_failed')) {
        farmBobaSound.playOrderFailed();
      }

      stateRef.current = nextState;

      if (
        nextState.currentCustomer?.patience !== prevState.currentCustomer?.patience ||
        nextState.gameOver !== prevState.gameOver ||
        nextState.shiftComplete !== prevState.shiftComplete
      ) {
        setState(nextState);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, []);

  const currentShiftConfig = SHIFT_CONFIGS[(state.shift - 1) % SHIFT_CONFIGS.length];
  const customer = state.currentCustomer;
  const cup = state.currentCup;

  // Liquid Color mapping
  const teaColors: Record<BobaTeaBase, string> = {
    farm_milk: 'bg-amber-100 text-amber-950',
    matcha: 'bg-emerald-300 text-emerald-950',
    strawberry: 'bg-pink-300 text-pink-950',
    thai_tea: 'bg-orange-400 text-orange-950',
  };

  const teaNames: Record<BobaTeaBase, string> = {
    farm_milk: 'Fresh Milk',
    matcha: 'Matcha Tea',
    strawberry: 'Strawberry',
    thai_tea: 'Thai Tea',
  };

  const toppingNames: Record<BobaTopping, { name: string; icon: string }> = {
    tapioca: { name: 'Tapioca', icon: '⚫' },
    strawberry_jelly: { name: 'Strawb Jelly', icon: '🍓' },
    mango_boba: { name: 'Mango Boba', icon: '🥭' },
    honeycomb: { name: 'Honeycomb', icon: '🍯' },
  };

  return (
    <div className="flex flex-col items-center w-full select-none touch-none">
      {/* TOP BAR HUD */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-t-2xl border-t border-x border-slate-700/80 shadow text-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧋</span>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400">
              Shift {state.shift}: {currentShiftConfig.name}
            </div>
            <div className="text-sm font-black text-white">
              Served: {state.customersServed} / {state.targetCustomers}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 font-black text-amber-300 text-sm">
            <span>🪙</span>
            <span>{state.coins}</span>
          </div>

          <div className="flex items-center gap-1 font-black text-white text-sm">
            <span className="text-xs text-slate-400">SCORE</span>
            <span>{state.score}</span>
          </div>

          {state.combo > 1 && (
            <div className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 text-xs font-black animate-pulse">
              {state.combo}x COMBO
            </div>
          )}

          <div className="flex items-center gap-0.5 text-base">
            {Array.from({ length: 3 }).map((_, i) => (
              <span key={i} className={i < state.lives ? 'text-red-500' : 'text-slate-600 opacity-40'}>
                ❤️
              </span>
            ))}
          </div>

          <button
            onClick={toggleSound}
            aria-label="Toggle Sound"
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-sm cursor-pointer"
          >
            {soundEnabled ? '🔊' : '🔇'}
          </button>
        </div>
      </div>

      {/* MAIN CAFE PREP CONTAINER */}
      <div className="relative w-full max-w-xl bg-slate-950 border-x border-b border-slate-800 rounded-b-2xl p-3 sm:p-4 shadow-2xl flex flex-col gap-3 min-h-[520px]">
        {/* CUSTOMER COUNTER BAR */}
        {customer && (
          <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${customer.avatarColor} flex items-center justify-center text-2xl shadow-inner shrink-0`}
              >
                {customer.mascot}
              </div>
              <div>
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>{customer.customerName}</span>
                  <span className="text-[10px] text-amber-400 font-bold">Wants:</span>
                </div>
                {/* Visual Order Badges */}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                    {teaNames[customer.requestedTea]}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                    {toppingNames[customer.requestedTopping].icon} {toppingNames[customer.requestedTopping].name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-black">
                    🧊 {customer.requestedIce}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-[10px] font-black">
                    🍯 {customer.requestedSweetness}
                  </span>
                </div>
              </div>
            </div>

            {/* Patience Meter */}
            <div className="flex flex-col items-end gap-1 shrink-0 w-24">
              <span className="text-[10px] font-black text-slate-400">PATIENCE</span>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                <div
                  className={`h-full transition-all duration-200 rounded-full ${
                    customer.patience > 50
                      ? 'bg-emerald-400'
                      : customer.patience > 25
                      ? 'bg-yellow-400'
                      : 'bg-red-500 animate-pulse'
                  }`}
                  style={{ width: `${Math.max(0, customer.patience)}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* WORKSTATION: GLASS BOBA CUP (VISUAL BUILDER) */}
        <div className="relative flex-1 flex flex-col items-center justify-center py-4 bg-gradient-to-b from-slate-900/60 to-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden">
          {/* Boba Cup Container */}
          <div className="relative w-36 h-52 flex flex-col items-center justify-end">
            {/* Straw (if sealed) */}
            {cup.hasStraw && (
              <div className="absolute -top-7 left-16 w-5 h-20 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full border border-purple-700 transform rotate-12 z-20 shadow-md">
                <div className="w-1 h-14 bg-white/50 ml-1 rounded-full" />
              </div>
            )}

            {/* Domed Lid (if sealed) */}
            {cup.isSealed && (
              <div className="absolute top-2 w-32 h-8 bg-white/40 border-2 border-white/60 rounded-t-full backdrop-blur-sm z-10 shadow flex items-center justify-center">
                <div className="w-5 h-2 bg-purple-600/40 rounded-full" />
              </div>
            )}

            {/* Clear Cup Glass Tumbler */}
            <div className="relative w-28 h-44 rounded-b-3xl border-2 border-white/40 bg-white/10 backdrop-blur-sm overflow-hidden flex flex-col justify-end p-1 shadow-inner">
              {/* Cold Foam Top */}
              {cup.teaBase && (
                <div className="absolute top-0 inset-x-0 h-6 bg-white/85 rounded-t-sm flex items-center justify-center">
                  {cup.sweetness && (
                    <span className="text-[10px] text-amber-600 font-bold">
                      {cup.sweetness === 'full' ? '🍯🍯' : '🍯'}
                    </span>
                  )}
                </div>
              )}

              {/* Liquid Fill */}
              {cup.teaBase && (
                <div
                  className={`w-full h-36 rounded-b-2xl transition-all duration-300 flex flex-col justify-between items-center ${teaColors[cup.teaBase]}`}
                >
                  {/* Floating Ice Cubes */}
                  {cup.iceLevel !== 'none' && (
                    <div className="flex flex-wrap gap-1 p-1 justify-center mt-1">
                      {Array.from({ length: cup.iceLevel === 'extra' ? 5 : 3 }).map((_, i) => (
                        <div
                          key={i}
                          className="w-4 h-4 rounded bg-white/60 border border-white/80 shadow-sm"
                        />
                      ))}
                    </div>
                  )}

                  {/* Bottom Toppings */}
                  <div className="w-full flex flex-wrap gap-1 p-1 justify-center items-end min-h-[32px]">
                    {cup.toppings.map((top, idx) => (
                      <span key={idx} className="text-sm select-none animate-bounce">
                        {toppingNames[top].icon}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {!cup.teaBase && cup.toppings.length === 0 && (
                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500 text-center p-2">
                  Tap Teas & Toppings Below
                </div>
              )}
            </div>
          </div>

          {/* Cup Status Text */}
          <div className="mt-2 text-xs font-bold text-slate-400 flex items-center gap-2">
            <span>{cup.teaBase ? teaNames[cup.teaBase] : 'No Tea'}</span>
            <span>•</span>
            <span>{cup.toppings.length > 0 ? cup.toppings.map((t) => toppingNames[t].name).join(', ') : 'No Toppings'}</span>
            <span>•</span>
            <span>{cup.isSealed ? '✨ Sealed & Straw' : 'Open Cup'}</span>
          </div>
        </div>

        {/* INGREDIENT & ACTION CONTROLS */}
        <div className="space-y-2">
          {/* 1. TEA BASE SELECTOR (>=44px touch targets) */}
          <div className="grid grid-cols-4 gap-1.5">
            {(['farm_milk', 'matcha', 'strawberry', 'thai_tea'] as BobaTeaBase[]).map((tea) => (
              <button
                key={tea}
                onClick={() => handlePourTea(tea)}
                disabled={cup.isSealed}
                className={`min-h-[46px] px-2 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex flex-col items-center justify-center ${
                  cup.teaBase === tea
                    ? 'border-amber-400 bg-amber-400/20 text-white shadow-lg shadow-amber-400/20'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                } ${cup.isSealed ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{tea === 'farm_milk' ? '🥛' : tea === 'matcha' ? '🍵' : tea === 'strawberry' ? '🍓' : '🧋'}</span>
                <span className="text-[10px] mt-0.5">{teaNames[tea]}</span>
              </button>
            ))}
          </div>

          {/* 2. TOPPING SELECTOR */}
          <div className="grid grid-cols-4 gap-1.5">
            {(['tapioca', 'strawberry_jelly', 'mango_boba', 'honeycomb'] as BobaTopping[]).map((top) => (
              <button
                key={top}
                onClick={() => handleAddTopping(top)}
                disabled={cup.isSealed || cup.toppings.length >= 2}
                className={`min-h-[46px] px-2 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer flex flex-col items-center justify-center ${
                  cup.toppings.includes(top)
                    ? 'border-purple-400 bg-purple-400/20 text-white shadow-lg shadow-purple-400/20'
                    : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                } ${cup.isSealed || cup.toppings.length >= 2 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span className="text-sm">{toppingNames[top].icon}</span>
                <span className="text-[10px] mt-0.5">{toppingNames[top].name}</span>
              </button>
            ))}
          </div>

          {/* 3. ICE & SWEETNESS TOGGLES */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handleToggleIce}
              disabled={cup.isSealed}
              className={`min-h-[44px] px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                cup.iceLevel !== 'none'
                  ? 'border-sky-400 bg-sky-400/20 text-sky-200'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              } ${cup.isSealed ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>🧊</span>
              <span>Ice: {cup.iceLevel}</span>
            </button>

            <button
              onClick={() => handleAddSweetness('half')}
              disabled={cup.isSealed}
              className={`min-h-[44px] px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                cup.sweetness === 'half'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              } ${cup.isSealed ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>🍯</span>
              <span>Half Sweet</span>
            </button>

            <button
              onClick={() => handleAddSweetness('full')}
              disabled={cup.isSealed}
              className={`min-h-[44px] px-2 rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                cup.sweetness === 'full'
                  ? 'border-yellow-400 bg-yellow-400/20 text-yellow-200'
                  : 'border-slate-800 bg-slate-900 text-slate-400'
              } ${cup.isSealed ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>🍯</span>
              <span>Full Sweet</span>
            </button>
          </div>

          {/* 4. ACTIONS: SEAL & STRAW, TRASH, SERVE ORDER */}
          <div className="grid grid-cols-12 gap-1.5 pt-1">
            <button
              onClick={handleTrashCup}
              title="Trash Cup & Start Over"
              aria-label="Trash Cup"
              className="col-span-3 min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-98"
            >
              <span>🗑️</span>
              <span className="hidden sm:inline">Trash</span>
            </button>

            <button
              onClick={handleSealAndStraw}
              disabled={cup.isSealed || !cup.teaBase}
              className={`col-span-4 min-h-[48px] rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border transition-all cursor-pointer active:scale-98 ${
                cup.isSealed
                  ? 'bg-purple-950/60 border-purple-500/40 text-purple-300'
                  : cup.teaBase
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400/50 hover:brightness-110 shadow-lg shadow-purple-600/30'
                  : 'bg-slate-900 border-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>✨</span>
              <span>{cup.isSealed ? 'Sealed ✓' : 'Seal & Straw'}</span>
            </button>

            <button
              onClick={handleServe}
              disabled={!cup.isSealed}
              className={`col-span-5 min-h-[48px] rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-98 ${
                cup.isSealed
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/40 hover:brightness-110'
                  : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>🛎️</span>
              <span>SERVE ORDER!</span>
            </button>
          </div>
        </div>

        {/* SHIFT CLEAR MODAL */}
        {state.shiftComplete && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-400/30">
              🧋
            </div>
            <h3 className="text-2xl font-black text-white mb-1">SHIFT COMPLETED!</h3>
            <p className="text-sm font-semibold text-amber-300 mb-4">
              All animal customers loved their delicious boba tea!
            </p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 w-64 mb-5 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Total Score</span>
                <span className="font-bold text-white">{state.score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Coins Collected</span>
                <span className="font-bold text-amber-400">🪙 {state.coins}</span>
              </div>
            </div>
            <button
              onClick={handleNextShift}
              className="w-64 py-3 bg-gradient-to-r from-amber-400 to-yellow-400 hover:from-amber-300 text-slate-950 font-black rounded-xl shadow-lg shadow-amber-400/30 transform hover:scale-102 transition-all cursor-pointer"
            >
              NEXT SHIFT →
            </button>
          </div>
        )}

        {/* GAME OVER MODAL */}
        {state.gameOver && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-red-500/30">
              💔
            </div>
            <h3 className="text-2xl font-black text-white mb-1">CAFE RUSH OVER</h3>
            <p className="text-sm font-medium text-slate-400 mb-4">Too many customer orders were missed!</p>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 w-64 mb-5 space-y-1 text-sm">
              <div className="flex justify-between text-slate-400">
                <span>Final Score</span>
                <span className="font-bold text-white">{state.score}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>High Score</span>
                <span className="font-bold text-amber-400">{state.highScore}</span>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="w-64 py-3 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-300 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-400/30 transform hover:scale-102 transition-all cursor-pointer"
            >
              OPEN CAFE AGAIN 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

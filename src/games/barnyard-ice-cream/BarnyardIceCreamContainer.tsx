import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  addCherry,
  addScoop,
  addSyrup,
  addTopping,
  addWhippedCream,
  createInitialState,
  nextShift,
  restartShift,
  serveIceCream,
  SHIFT_CONFIGS,
  switchBase,
  trashCone,
  updateEngine,
} from './logic/engine';
import { BarnyardIceCreamState, IceCreamFlavor, IceCreamSyrup, IceCreamTopping } from './logic/types';
import { iceCreamSound } from './systems/sound';

export const BarnyardIceCreamContainer: React.FC = () => {
  const [state, setState] = useState<BarnyardIceCreamState>(() => createInitialState(1));
  const stateRef = useRef<BarnyardIceCreamState>(state);
  stateRef.current = state;

  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const lastTimeRef = useRef<number>(performance.now());

  const toggleSound = useCallback(() => {
    const next = iceCreamSound.toggleSound();
    setSoundEnabled(next);
  }, []);

  const handleAddScoop = (flavor: IceCreamFlavor) => {
    const next = addScoop(stateRef.current, flavor);
    if (next !== stateRef.current) {
      iceCreamSound.playScoopDrop();
      setState(next);
    }
  };

  const handleAddSyrup = (syrup: IceCreamSyrup) => {
    const next = addSyrup(stateRef.current, syrup);
    if (next !== stateRef.current) {
      iceCreamSound.playSyrupSqueeze();
      setState(next);
    }
  };

  const handleAddTopping = (topping: IceCreamTopping) => {
    const next = addTopping(stateRef.current, topping);
    if (next !== stateRef.current) {
      iceCreamSound.playSprinkleScatter();
      setState(next);
    }
  };

  const handleAddWhippedCream = () => {
    const next = addWhippedCream(stateRef.current);
    if (next !== stateRef.current) {
      iceCreamSound.playWhippedHiss();
      setState(next);
    }
  };

  const handleAddCherry = () => {
    const next = addCherry(stateRef.current);
    if (next !== stateRef.current) {
      iceCreamSound.playCherryPlink();
      setState(next);
    }
  };

  const handleSwitchBase = (base: 'waffle_cone' | 'sundae_bowl') => {
    const next = switchBase(stateRef.current, base);
    setState(next);
  };

  const handleTrashCone = () => {
    const next = trashCone(stateRef.current);
    setState(next);
  };

  const handleServe = () => {
    const next = serveIceCream(stateRef.current);
    if (next !== stateRef.current) {
      const served = next.events.find((e) => e.type === 'order_served');
      const failed = next.events.find((e) => e.type === 'order_failed');
      const cleared = next.events.find((e) => e.type === 'shift_clear');

      if (cleared) iceCreamSound.playShiftClear();
      else if (served) iceCreamSound.playOrderServed();
      else if (failed) iceCreamSound.playOrderFailed();

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
        handleTrashCone();
      } else if (e.key === 'c' || e.key === 'C') {
        handleAddCherry();
      } else if (e.key === 'w' || e.key === 'W') {
        handleAddWhippedCream();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleServe, handleTrashCone, handleAddCherry, handleAddWhippedCream, toggleSound]);

  // Patience decay game loop
  useEffect(() => {
    let animId: number;

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = now;

      const prevState = stateRef.current;
      const nextState = updateEngine(prevState, dt);

      if (nextState.events.some((e) => e.type === 'order_failed')) {
        iceCreamSound.playOrderFailed();
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
  const cone = state.currentCone;

  const flavorColors: Record<IceCreamFlavor, { bg: string; text: string; border: string }> = {
    vanilla: { bg: 'bg-amber-100', text: 'text-amber-950', border: 'border-amber-300' },
    strawberry: { bg: 'bg-pink-300', text: 'text-pink-950', border: 'border-pink-400' },
    chocolate: { bg: 'bg-amber-900', text: 'text-amber-100', border: 'border-amber-950' },
    mint: { bg: 'bg-emerald-300', text: 'text-emerald-950', border: 'border-emerald-400' },
    caramel: { bg: 'bg-orange-300', text: 'text-orange-950', border: 'border-orange-400' },
  };

  const flavorLabels: Record<IceCreamFlavor, { name: string; icon: string }> = {
    vanilla: { name: 'Vanilla', icon: '🍦' },
    strawberry: { name: 'Strawberry', icon: '🍓' },
    chocolate: { name: 'Chocolate', icon: '🍫' },
    mint: { name: 'Mint Chip', icon: '🍃' },
    caramel: { name: 'Caramel', icon: '🍯' },
  };

  const syrupLabels: Record<IceCreamSyrup, { name: string; icon: string }> = {
    fudge: { name: 'Hot Fudge', icon: '🍫' },
    strawberry_glaze: { name: 'Strawb Glaze', icon: '🍓' },
    caramel_drizzle: { name: 'Caramel Drizzle', icon: '🍯' },
  };

  const toppingLabels: Record<IceCreamTopping, { name: string; icon: string }> = {
    rainbow_sprinkles: { name: 'Sprinkles', icon: '🌈' },
    crushed_nuts: { name: 'Crushed Nuts', icon: '🥜' },
    waffle_crunch: { name: 'Waffle Crunch', icon: '🧇' },
  };

  return (
    <div className="flex flex-col items-center w-full select-none touch-none">
      {/* TOP BAR HUD */}
      <div className="w-full max-w-xl flex items-center justify-between px-3 py-2 bg-slate-900/90 rounded-t-2xl border-t border-x border-slate-700/80 shadow text-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xl">🍦</span>
          <div>
            <div className="text-[10px] font-black uppercase text-amber-400">
              Shift {state.shift}: {currentShiftConfig.name}
            </div>
            <div className="text-sm font-black text-white">
              Orders: {state.customersServed} / {state.targetCustomers}
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
                  <span>{customer.name}</span>
                  <span className="text-[10px] text-amber-400 font-bold">Wants:</span>
                </div>
                {/* Visual Order Badges */}
                <div className="flex flex-wrap items-center gap-1 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-black">
                    {customer.requestedBase === 'waffle_cone' ? '🧇 Waffle Cone' : '🍨 Sundae Bowl'}
                  </span>
                  {customer.requestedScoops.map((flv, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-300 border border-pink-500/30 text-[10px] font-black"
                    >
                      {flavorLabels[flv].icon} {flavorLabels[flv].name}
                    </span>
                  ))}
                  {customer.requestedSyrup && (
                    <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-300 border border-orange-500/30 text-[10px] font-black">
                      {syrupLabels[customer.requestedSyrup].icon} {syrupLabels[customer.requestedSyrup].name}
                    </span>
                  )}
                  {customer.requestedTopping && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-black">
                      {toppingLabels[customer.requestedTopping].icon} {toppingLabels[customer.requestedTopping].name}
                    </span>
                  )}
                  {customer.wantsCherry && (
                    <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-black">
                      🍒 Cherry
                    </span>
                  )}
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

        {/* WORKSTATION: DYNAMIC ICE CREAM STACK */}
        <div className="relative flex-1 flex flex-col items-center justify-end py-4 bg-gradient-to-b from-slate-900/60 to-slate-950/80 rounded-2xl border border-slate-800/80 overflow-hidden min-h-[220px]">
          <div className="relative flex flex-col items-center justify-end w-48 min-h-[190px]">
            {/* Crown Cherry */}
            {cone.hasCherry && (
              <div className="relative z-30 -mb-2 flex flex-col items-center animate-bounce">
                <div className="w-1 h-4 bg-green-700 rounded-full rotate-12 -mb-1" />
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-rose-400 border border-rose-700 shadow-md flex items-center justify-center">
                  <div className="w-2 h-1.5 bg-white/70 rounded-full -mt-2 -ml-2" />
                </div>
              </div>
            )}

            {/* Whipped Cream */}
            {cone.hasWhippedCream && (
              <div className="relative z-20 -mb-3 w-16 h-8 bg-gradient-to-t from-slate-100 to-white rounded-t-full border border-slate-200 shadow flex items-center justify-center">
                <span className="text-[10px] text-slate-400">☁️</span>
              </div>
            )}

            {/* Stacked Ice Cream Scoops (rendered in reverse order so top is on top) */}
            <div className="flex flex-col-reverse items-center z-10 -space-y-3">
              {cone.scoops.map((flavor, idx) => (
                <div
                  key={idx}
                  className={`relative w-24 h-14 rounded-full border-2 shadow-md flex items-center justify-center ${flavorColors[flavor].bg} ${flavorColors[flavor].border} ${flavorColors[flavor].text} transition-all duration-200 animate-fade-in`}
                >
                  <span className="text-xs font-black opacity-80">{flavorLabels[flavor].name}</span>

                  {/* Syrup drizzle marks */}
                  {cone.syrups.length > 0 && idx === cone.scoops.length - 1 && (
                    <div className="absolute inset-x-2 top-0 h-4 flex justify-around">
                      <div className="w-1.5 h-6 bg-amber-950/70 rounded-full" />
                      <div className="w-1.5 h-4 bg-amber-950/70 rounded-full" />
                      <div className="w-1.5 h-7 bg-amber-950/70 rounded-full" />
                    </div>
                  )}

                  {/* Rainbow sprinkles */}
                  {cone.toppings.includes('rainbow_sprinkles') && idx === cone.scoops.length - 1 && (
                    <div className="absolute inset-2 flex flex-wrap gap-1 items-center justify-center opacity-80">
                      <span className="text-[8px] text-blue-500">▪</span>
                      <span className="text-[8px] text-yellow-500">▪</span>
                      <span className="text-[8px] text-purple-500">▪</span>
                      <span className="text-[8px] text-red-500">▪</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Base (Waffle Cone or Sundae Bowl) */}
            {cone.base === 'waffle_cone' ? (
              <div className="relative w-20 h-28 flex flex-col items-center -mt-2">
                {/* Waffle Cone Triangle */}
                <div
                  className="w-0 h-0 border-l-[36px] border-l-transparent border-r-[36px] border-r-transparent border-t-[90px] border-t-amber-700 shadow-md relative"
                >
                  {/* Waffle texture pattern */}
                  <div className="absolute -top-[80px] -left-[24px] text-[10px] text-amber-900/40 select-none font-mono">
                    # # #<br /># # #
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative w-28 h-12 bg-gradient-to-t from-slate-200 to-white rounded-b-3xl border-2 border-slate-300 shadow-md flex items-center justify-center -mt-2">
                <span className="text-xs font-black text-slate-400">SUNDAE BOWL</span>
              </div>
            )}
          </div>

          {cone.scoops.length === 0 && (
            <div className="text-xs font-bold text-slate-500 text-center pb-2">
              Tap Scoops & Toppings Below to Stack
            </div>
          )}
        </div>

        {/* INGREDIENT SELECTORS & BUTTONS */}
        <div className="space-y-2">
          {/* 1. BASE & SCOOP SELECTOR */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handleSwitchBase(cone.base === 'waffle_cone' ? 'sundae_bowl' : 'waffle_cone')}
              className="min-h-[46px] px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-black text-amber-300 flex items-center gap-1 cursor-pointer"
            >
              <span>{cone.base === 'waffle_cone' ? '🧇 Cone' : '🍨 Bowl'}</span>
            </button>

            <div className="grid grid-cols-5 gap-1 flex-1">
              {(['vanilla', 'strawberry', 'chocolate', 'mint', 'caramel'] as IceCreamFlavor[]).map((flv) => (
                <button
                  key={flv}
                  onClick={() => handleAddScoop(flv)}
                  disabled={cone.scoops.length >= 4}
                  className={`min-h-[46px] rounded-xl text-xs font-black border transition-all cursor-pointer flex flex-col items-center justify-center ${
                    cone.scoops.includes(flv)
                      ? 'border-amber-400 bg-amber-400/20 text-white'
                      : 'border-slate-800 bg-slate-900 text-slate-300 hover:border-slate-700'
                  } ${cone.scoops.length >= 4 ? 'opacity-40 cursor-not-allowed' : ''}`}
                >
                  <span className="text-sm">{flavorLabels[flv].icon}</span>
                  <span className="text-[9px] mt-0.5">{flavorLabels[flv].name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. SYRUPS & TOPPINGS */}
          <div className="grid grid-cols-5 gap-1.5">
            {(['fudge', 'strawberry_glaze', 'caramel_drizzle'] as IceCreamSyrup[]).map((syr) => (
              <button
                key={syr}
                onClick={() => handleAddSyrup(syr)}
                disabled={cone.scoops.length === 0}
                className={`min-h-[44px] rounded-xl text-[10px] font-black border transition-all cursor-pointer flex flex-col items-center justify-center ${
                  cone.syrups.includes(syr)
                    ? 'border-orange-400 bg-orange-400/20 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                } ${cone.scoops.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{syrupLabels[syr].icon}</span>
                <span className="truncate max-w-[55px]">{syrupLabels[syr].name}</span>
              </button>
            ))}

            {(['rainbow_sprinkles', 'crushed_nuts'] as IceCreamTopping[]).map((top) => (
              <button
                key={top}
                onClick={() => handleAddTopping(top)}
                disabled={cone.scoops.length === 0}
                className={`min-h-[44px] rounded-xl text-[10px] font-black border transition-all cursor-pointer flex flex-col items-center justify-center ${
                  cone.toppings.includes(top)
                    ? 'border-purple-400 bg-purple-400/20 text-white'
                    : 'border-slate-800 bg-slate-900 text-slate-400'
                } ${cone.scoops.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
              >
                <span>{toppingLabels[top].icon}</span>
                <span className="truncate max-w-[55px]">{toppingLabels[top].name}</span>
              </button>
            ))}
          </div>

          {/* 3. EXTRAS & ACTIONS */}
          <div className="grid grid-cols-12 gap-1.5 pt-1">
            <button
              onClick={handleTrashCone}
              title="Trash Cone"
              aria-label="Trash Cone"
              className="col-span-2 min-h-[48px] rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>🗑️</span>
            </button>

            <button
              onClick={handleAddWhippedCream}
              disabled={cone.scoops.length === 0 || cone.hasWhippedCream}
              className={`col-span-2 min-h-[48px] rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                cone.hasWhippedCream
                  ? 'border-slate-500 bg-white/20 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300'
              } ${cone.scoops.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>☁️</span>
              <span className="hidden sm:inline">Cream</span>
            </button>

            <button
              onClick={handleAddCherry}
              disabled={cone.scoops.length === 0 || cone.hasCherry}
              className={`col-span-2 min-h-[48px] rounded-xl text-xs font-black border transition-all cursor-pointer flex items-center justify-center gap-1 ${
                cone.hasCherry
                  ? 'border-red-400 bg-red-400/20 text-white'
                  : 'border-slate-800 bg-slate-900 text-slate-300'
              } ${cone.scoops.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <span>🍒</span>
              <span className="hidden sm:inline">Cherry</span>
            </button>

            <button
              onClick={handleServe}
              disabled={cone.scoops.length === 0}
              className={`col-span-6 min-h-[48px] rounded-xl font-black text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer active:scale-98 ${
                cone.scoops.length > 0
                  ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/40 hover:brightness-110'
                  : 'bg-slate-900 border-slate-800 text-slate-600 cursor-not-allowed'
              }`}
            >
              <span>🛎️</span>
              <span>SERVE ICE CREAM!</span>
            </button>
          </div>
        </div>

        {/* SHIFT CLEAR MODAL */}
        {state.shiftComplete && (
          <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-fade-in z-30 rounded-2xl">
            <div className="w-16 h-16 rounded-full bg-amber-400/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-lg shadow-amber-400/30">
              🍨
            </div>
            <h3 className="text-2xl font-black text-white mb-1">SHIFT COMPLETED!</h3>
            <p className="text-sm font-semibold text-amber-300 mb-4">
              All hungry farm pets loved their towering ice creams!
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
            <h3 className="text-2xl font-black text-white mb-1">SHOP CLOSED</h3>
            <p className="text-sm font-medium text-slate-400 mb-4">Too many ice cream orders melted away!</p>
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
              OPEN CART AGAIN 🔄
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

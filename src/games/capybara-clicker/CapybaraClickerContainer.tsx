import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  buyProducer,
  buyUpgrade,
  calculateCps,
  calculateOfflineEarnings,
  calculateProducerCost,
  createInitialState,
  handleClick,
  PRODUCERS,
  selectSkin,
  SKINS,
  stepPassiveEarnings,
  UPGRADES,
  WEATHERS,
} from './logic/engine';
import { CapybaraClickerState } from './logic/types';
import { capyAudio } from './audio/sound';
import { Volume2, VolumeX, Sparkles, RefreshCw, Sun, CloudRain } from 'lucide-react';

const SAVE_KEY = 'pawcade_capybara_clicker_save';

interface Floater {
  id: number;
  x: number;
  y: number;
  text: string;
}

export const CapybaraClickerContainer: React.FC = () => {
  const [state, setState] = useState<CapybaraClickerState>(() => {
    try {
      const saved = localStorage.getItem(SAVE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const { state: resumed, earned, offlineSeconds } = calculateOfflineEarnings(parsed);
        if (earned > 0) {
          // offline bonus welcomed
          setTimeout(() => {
            alert(`Welcome back! While you were away for ${Math.round(offlineSeconds / 60)} minutes, your capybaras collected ${formatNumber(earned)} more friends! 🍊`);
          }, 400);
        }
        return resumed;
      }
    } catch {
      // fallback initial
    }
    return createInitialState();
  });

  const [activeTab, setActiveTab] = useState<'producers' | 'upgrades' | 'skins'>('producers');
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [isBouncing, setIsBouncing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const stateRef = useRef(state);
  stateRef.current = state;

  // Auto-save every 3 seconds
  useEffect(() => {
    const saveTimer = setInterval(() => {
      try {
        const toSave = { ...stateRef.current, lastSaveTimestamp: Date.now() };
        localStorage.setItem(SAVE_KEY, JSON.stringify(toSave));
      } catch {
        // quota ignore
      }
    }, 3000);

    return () => clearInterval(saveTimer);
  }, []);

  // Passive earnings ticker (every 100ms for ultra smooth number progression)
  useEffect(() => {
    let lastTick = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const deltaSec = (now - lastTick) / 1000;
      lastTick = now;

      setState((prev) => stepPassiveEarnings(prev, deltaSec));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Cleanup floaters
  useEffect(() => {
    if (floaters.length === 0) return;
    const t = setTimeout(() => {
      setFloaters((prev) => prev.slice(1));
    }, 800);
    return () => clearTimeout(t);
  }, [floaters]);

  const onCapyClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    let clientX = rect.left + rect.width / 2;
    let clientY = rect.top + rect.height / 2;

    if ('clientX' in e && e.clientX) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if ('touches' in e && e.touches[0]) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    }

    const { state: nextState, earned } = handleClick(stateRef.current);
    setState(nextState);

    // Audio & tactile
    capyAudio.playTapSound(nextState.stats.totalClicks);
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(8);
      } catch {
        // ignore
      }
    }

    setIsBouncing(true);
    setTimeout(() => setIsBouncing(false), 120);

    // Add Floater
    const newFloater: Floater = {
      id: Date.now() + Math.random(),
      x: clientX - rect.left + (Math.random() * 20 - 10),
      y: clientY - rect.top - 20,
      text: `+${formatNumber(earned)}`,
    };
    setFloaters((prev) => [...prev.slice(-8), newFloater]);
  };

  const onBuyProducer = (id: string) => {
    const res = buyProducer(state, id);
    if (res.success) {
      capyAudio.playBuySound();
      setState(res.state);
    }
  };

  const onBuyUpgrade = (id: string) => {
    const res = buyUpgrade(state, id);
    if (res.success) {
      capyAudio.playBuySound();
      setState(res.state);
    }
  };

  const onSelectSkin = (id: string) => {
    capyAudio.playSkinUnlockSound();
    setState((prev) => selectSkin(prev, id));
  };

  const cycleWeather = () => {
    const nextIdx = (WEATHERS.indexOf(state.weather) + 1) % WEATHERS.length;
    setState((prev) => ({ ...prev, weather: WEATHERS[nextIdx] }));
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    capyAudio.enabled = next;
  };

  const resetGame = () => {
    if (confirm('Start fresh from 0 capybaras? This resets current progress.')) {
      localStorage.removeItem(SAVE_KEY);
      setState(createInitialState());
    }
  };

  const cps = calculateCps(state.producers);
  const currentSkin = SKINS.find((s) => s.id === state.selectedSkin) || SKINS[0];

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-3xl overflow-hidden bg-gradient-to-b from-sky-300 via-amber-100 to-emerald-200 border-4 border-white shadow-2xl flex flex-col md:flex-row min-h-[580px] max-h-[85vh] select-none">
      {/* LEFT: Central Capybara Sanctuary Stage */}
      <div className="relative flex-1 flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden">
        {/* Top Floating Info Bar */}
        <div className="w-full flex items-center justify-between gap-2 z-10">
          <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white shadow-sm text-xs font-bold text-slate-700">
            <span>Weather:</span>
            <button
              onClick={cycleWeather}
              className="capitalize text-brand hover:underline font-bold flex items-center gap-1"
            >
              {state.weather === 'sunny' && '☀️ Sunny'}
              {state.weather === 'blossom' && '🌸 Blossoms'}
              {state.weather === 'mist' && '♨️ Mist'}
              {state.weather === 'golden' && '✨ Golden'}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleSound}
              aria-label="Toggle Sound"
              className="p-2 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm text-slate-700 hover:text-brand"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-500" />}
            </button>
            <button
              onClick={resetGame}
              aria-label="Reset Game"
              title="Reset progress"
              className="p-2 rounded-full bg-white/80 backdrop-blur-md border border-white shadow-sm text-slate-700 hover:text-red-500"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Counter Display */}
        <div className="text-center my-2 z-10">
          <div className="text-4xl sm:text-5xl font-black font-display text-slate-900 tracking-tight drop-shadow-sm">
            {formatNumber(Math.floor(state.capybaras))}
          </div>
          <p className="text-xs sm:text-sm font-bold text-amber-900/80 mt-1 flex items-center justify-center gap-2">
            <span>+{formatNumber(cps)} capy/sec</span>
            <span>&bull;</span>
            <span>{formatNumber(state.clickPower)} per click</span>
          </p>
        </div>

        {/* Giant Interactive Capybara Character */}
        <div
          onClick={onCapyClick}
          className={`relative cursor-pointer transition-transform duration-100 ease-out select-none touch-none ${
            isBouncing ? 'scale-90' : 'scale-100 hover:scale-105 active:scale-95'
          }`}
          style={{ width: 260, height: 240 }}
        >
          {/* Ambient Warm Onsen Water Tub Basin */}
          <div className="absolute inset-x-0 bottom-0 h-28 rounded-full bg-gradient-to-t from-emerald-600 via-teal-500 to-cyan-300 opacity-90 shadow-xl border-4 border-amber-800 flex items-center justify-center">
            {/* Gentle Water Ripple Line */}
            <div className="w-3/4 h-2 bg-white/40 rounded-full animate-pulse" />
          </div>

          {/* Capybara Body Vector Art */}
          <svg viewBox="0 0 200 180" className="absolute inset-0 w-full h-full drop-shadow-xl">
            <defs>
              <linearGradient id="capyFurGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#b45309" />
                <stop offset="60%" stop-color="#92400e" />
                <stop offset="100%" stop-color="#78350f" />
              </linearGradient>
            </defs>

            {/* Plump Shoulders & Back */}
            <ellipse cx="100" cy="115" rx="72" ry="50" fill="url(#capyFurGrad)" />

            {/* Capybara Head */}
            <rect x="55" y="45" width="90" height="70" rx="30" fill="url(#capyFurGrad)" />

            {/* Cute Snout muzzle */}
            <rect x="70" y="75" width="60" height="42" rx="18" fill="#78350f" />
            <circle cx="90" cy="92" r="3.5" fill="#1c1917" />
            <circle cx="110" cy="92" r="3.5" fill="#1c1917" />
            <path d="M 94 104 Q 100 108 106 104" stroke="#1c1917" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            {/* Peaceful Closed Chill Eyes */}
            <path d="M 68 64 Q 76 68 84 64" stroke="#451a03" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M 116 64 Q 124 68 132 64" stroke="#451a03" strokeWidth="3.5" fill="none" strokeLinecap="round" />

            {/* Small Rounded Capy Ears */}
            <circle cx="58" cy="46" r="12" fill="#78350f" />
            <circle cx="58" cy="46" r="7" fill="#fbcfe8" />
            <circle cx="142" cy="46" r="12" fill="#78350f" />
            <circle cx="142" cy="46" r="7" fill="#fbcfe8" />

            {/* Accessories depending on skin */}
            {currentSkin.accessory === 'yuzu' && (
              <g>
                <circle cx="100" cy="30" r="16" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
                <ellipse cx="102" cy="14" rx="4" ry="7" fill="#15803d" transform="rotate(30 102 14)" />
                <circle cx="98" cy="28" r="2" fill="#eab308" />
              </g>
            )}

            {currentSkin.accessory === 'sunglasses' && (
              <g>
                <rect x="62" y="56" width="32" height="18" rx="6" fill="#0f172a" />
                <rect x="106" y="56" width="32" height="18" rx="6" fill="#0f172a" />
                <line x1="94" y1="62" x2="106" y2="62" stroke="#0f172a" strokeWidth="3" />
                <line x1="66" y1="60" x2="80" y2="68" stroke="#ffffff" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
                <line x1="110" y1="60" x2="124" y2="68" stroke="#ffffff" strokeWidth="2" opacity="0.6" strokeLinecap="round" />
              </g>
            )}

            {currentSkin.accessory === 'tophat' && (
              <g>
                <rect x="70" y="24" width="60" height="8" rx="3" fill="#0f172a" />
                <rect x="80" y="-8" width="40" height="32" rx="4" fill="#1e293b" />
                <rect x="80" y="16" width="40" height="6" fill="#dc2626" />
              </g>
            )}

            {currentSkin.accessory === 'crown' && (
              <g>
                <polygon points="76,32 86,12 100,24 114,12 124,32" fill="#facc15" stroke="#b45309" strokeWidth="2" />
                <circle cx="86" cy="12" r="3" fill="#ef4444" />
                <circle cx="100" cy="24" r="3.5" fill="#3b82f6" />
                <circle cx="114" cy="12" r="3" fill="#ef4444" />
              </g>
            )}
          </svg>

          {/* Floaters on Tap */}
          {floaters.map((f) => (
            <div
              key={f.id}
              style={{ left: f.x, top: f.y }}
              className="absolute pointer-events-none text-xl sm:text-2xl font-black font-display text-amber-900 drop-shadow animate-bounce"
            >
              {f.text}
            </div>
          ))}
        </div>

        {/* Helper Hint */}
        <div className="z-10 text-center">
          <p className="text-xs font-bold text-slate-700/80 bg-white/70 backdrop-blur-sm px-3 py-1 rounded-full border border-white">
            Tap the Capybara to harvest friends! 🐾
          </p>
        </div>
      </div>

      {/* RIGHT: Shop & Upgrades Navigation Drawer */}
      <div className="w-full md:w-80 bg-white/95 backdrop-blur-xl border-t md:border-t-0 md:border-l border-amber-200 flex flex-col max-h-[340px] md:max-h-full">
        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-200 bg-amber-50/50">
          <button
            onClick={() => setActiveTab('producers')}
            className={`flex-1 py-3 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'producers'
                ? 'border-b-2 border-brand text-brand bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>🧺 Friends</span>
          </button>
          <button
            onClick={() => setActiveTab('upgrades')}
            className={`flex-1 py-3 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'upgrades'
                ? 'border-b-2 border-brand text-brand bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>✨ Upgrades</span>
          </button>
          <button
            onClick={() => setActiveTab('skins')}
            className={`flex-1 py-3 text-xs font-bold font-display uppercase tracking-wider flex items-center justify-center gap-1 transition-colors ${
              activeTab === 'skins'
                ? 'border-b-2 border-brand text-brand bg-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>👑 Wardrobe</span>
          </button>
        </div>

        {/* Tab Scroll Content */}
        <div className="flex-1 p-3 overflow-y-auto space-y-2">
          {/* TAB 1: Producers */}
          {activeTab === 'producers' &&
            PRODUCERS.map((p) => {
              const owned = state.producers[p.id] || 0;
              const cost = calculateProducerCost(p.baseCost, owned);
              const canAfford = state.capybaras >= cost;

              return (
                <div
                  key={p.id}
                  onClick={() => onBuyProducer(p.id)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer ${
                    canAfford
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-sm'
                      : 'bg-slate-50/70 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl p-1 bg-white rounded-xl shadow-xs border border-amber-100">
                      {p.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-500">+{formatNumber(p.baseCps)}/s each</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-amber-700">{formatNumber(cost)} 🍊</div>
                    <div className="text-[10px] font-semibold text-slate-400">Owned: {owned}</div>
                  </div>
                </div>
              );
            })}

          {/* TAB 2: Click Upgrades */}
          {activeTab === 'upgrades' &&
            UPGRADES.map((u) => {
              const purchased = state.upgrades.includes(u.id);
              const canAfford = state.capybaras >= u.cost;

              return (
                <div
                  key={u.id}
                  onClick={() => !purchased && onBuyUpgrade(u.id)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    purchased
                      ? 'bg-emerald-50 border-emerald-200 opacity-80 cursor-default'
                      : canAfford
                      ? 'bg-amber-50 hover:bg-amber-100 border-amber-200 shadow-sm cursor-pointer'
                      : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl p-1 bg-white rounded-xl shadow-xs border border-amber-100">
                      {u.icon}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900 truncate">{u.name}</div>
                      <div className="text-[11px] text-slate-500">{u.desc}</div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    {purchased ? (
                      <span className="text-[11px] font-bold text-emerald-600">✓ Owned</span>
                    ) : (
                      <span className="text-xs font-bold text-amber-700">{formatNumber(u.cost)} 🍊</span>
                    )}
                  </div>
                </div>
              );
            })}

          {/* TAB 3: Wardrobe Skins */}
          {activeTab === 'skins' &&
            SKINS.map((s) => {
              const unlocked = state.unlockedSkins.includes(s.id);
              const isSelected = state.selectedSkin === s.id;

              return (
                <div
                  key={s.id}
                  onClick={() => unlocked && onSelectSkin(s.id)}
                  className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-400'
                      : unlocked
                      ? 'bg-white hover:bg-amber-50 border-amber-200 cursor-pointer'
                      : 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-2xl">
                      {s.accessory === 'none' && '🦫'}
                      {s.accessory === 'yuzu' && '🍊'}
                      {s.accessory === 'sunglasses' && '🕶️'}
                      {s.accessory === 'tophat' && '🎩'}
                      {s.accessory === 'crown' && '👑'}
                    </span>
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-slate-900">{s.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {unlocked ? 'Unlocked' : `Requires ${formatNumber(s.unlockedAt)} capybaras`}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="text-[11px] font-bold text-amber-800">Equipped</span>
                    ) : unlocked ? (
                      <span className="text-[11px] font-bold text-brand">Wear</span>
                    ) : (
                      <span className="text-xs">🔒</span>
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      </div>
    </div>
  );
};

function formatNumber(num: number): string {
  if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
  if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
  if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
  return num.toLocaleString();
}

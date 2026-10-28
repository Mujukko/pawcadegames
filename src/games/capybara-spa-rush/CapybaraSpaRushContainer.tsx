import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  createInitialState,
  seatCritterInTub,
  addYuzuToTub,
  scrubTub,
  serveHerbalTea,
  checkoutSatisfiedCritter,
  buyUpgrade,
  updateSpa,
  UPGRADE_COSTS,
} from './logic/engine';
import { CapybaraSpaState } from './logic/types';
import { spaSound } from './systems/sound';
import { analytics } from '../../lib/analytics';
import { Volume2, VolumeX, Sparkles, Plus, Award, ChevronUp, X, ShoppingBag } from 'lucide-react';

export const CapybaraSpaRushContainer: React.FC = () => {
  const [state, setState] = useState<CapybaraSpaState>(() => createInitialState());
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [isUpgradesOpen, setIsUpgradesOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [floatingTexts, setFloatingTexts] = useState<{ id: number; text: string; x: number; y: number; color: string }[]>([]);

  const stateRef = useRef<CapybaraSpaState>(state);
  stateRef.current = state;
  const floatingIdCounter = useRef(1);

  // Trigger floating feedback text
  const addFloatingText = useCallback((text: string, x: number, y: number, color: string = '#facc15') => {
    const id = floatingIdCounter.current++;
    setFloatingTexts((prev) => [...prev, { id, text, x, y, color }]);
    setTimeout(() => {
      setFloatingTexts((prev) => prev.filter((item) => item.id !== id));
    }, 1100);
  }, []);

  // GA4 Initialization
  useEffect(() => {
    analytics.gameStarted('capybara-spa-rush');
  }, []);

  // Main 10 FPS State Tick (smooth enough for idle time-management with ultra-low CPU load)
  useEffect(() => {
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = Math.min(0.2, (now - lastTime) / 1000);
      lastTime = now;

      const next = { ...stateRef.current };
      updateSpa(next, dt);
      setState({ ...next });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Keyboard Shortcuts (M: mute, U: upgrades)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'm' || e.key === 'M') {
        const muted = spaSound.toggleMute();
        setIsMuted(muted);
      } else if (e.key === 'u' || e.key === 'U') {
        setIsUpgradesOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle seat guest
  const handleSeatGuest = (tubId: number, e: React.MouseEvent) => {
    const s = { ...stateRef.current };
    const targetGuestId = selectedGuestId || (s.guestQueue.length > 0 ? s.guestQueue[0]!.id : null);
    if (!targetGuestId) return;

    const success = seatCritterInTub(s, targetGuestId, tubId);
    if (success) {
      spaSound.playSplash();
      spaSound.playSqueak();
      setSelectedGuestId(null);
      setState({ ...s });
      addFloatingText('Splash! 🫧', e.clientX, e.clientY, '#38bdf8');
    }
  };

  // Handle Yuzu Add
  const handleAddYuzu = (tubId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = { ...stateRef.current };
    const success = addYuzuToTub(s, tubId);
    if (success) {
      spaSound.playSplash();
      spaSound.playBubble();
      setState({ ...s });
      addFloatingText('+1 Yuzu 🍊', e.clientX, e.clientY, '#facc15');
    }
  };

  // Handle Scrub Tub
  const handleScrub = (tubId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = { ...stateRef.current };
    const success = scrubTub(s, tubId);
    if (success) {
      spaSound.playScrub();
      setState({ ...s });
      addFloatingText('Clean & Cozy 🫧', e.clientX, e.clientY, '#4ade80');
    }
  };

  // Handle Serve Tea
  const handleServeTea = (tubId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = { ...stateRef.current };
    const success = serveHerbalTea(s, tubId);
    if (success) {
      spaSound.playTea();
      spaSound.playSqueak();
      setState({ ...s });
      addFloatingText('Warm Tea 🍵', e.clientX, e.clientY, '#a3e635');
    }
  };

  // Handle Collect Coins
  const handleCheckout = (tubId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const s = { ...stateRef.current };
    const earnings = checkoutSatisfiedCritter(s, tubId);
    if (earnings > 0) {
      spaSound.playKaChing();
      spaSound.playSqueak();
      analytics.scoreMilestone('capybara-spa-rush', s.coins);
      setState({ ...s });
      addFloatingText(`+${earnings} Coins! 💰`, e.clientX, e.clientY, '#fbbf24');
    }
  };

  // Handle Upgrade purchase
  const handleBuyUpgrade = (key: keyof typeof UPGRADE_COSTS) => {
    const s = { ...stateRef.current };
    const success = buyUpgrade(s, key);
    if (success) {
      spaSound.playZenFanfare();
      setState({ ...s });
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto flex flex-col items-center select-none touch-none bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-950 p-2 sm:p-5 rounded-3xl border border-amber-500/30 shadow-2xl overflow-hidden min-h-[580px] sm:min-h-[640px]">
      {/* Floating Interactive Feedback Elements */}
      {floatingTexts.map((item) => (
        <div
          key={item.id}
          className="fixed pointer-events-none z-50 font-black text-sm sm:text-base animate-bounce"
          style={{
            left: item.x - 40,
            top: item.y - 40,
            color: item.color,
            textShadow: '0 2px 8px rgba(0,0,0,0.8)',
          }}
        >
          {item.text}
        </div>
      ))}

      {/* Top Header / HUD */}
      <div className="w-full flex items-center justify-between bg-slate-900/90 border border-amber-500/20 px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl mb-3 shadow-lg">
        {/* Coins Wallet */}
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center text-lg shadow-md shadow-amber-500/20">
            🪙
          </div>
          <div>
            <div className="text-[10px] sm:text-xs font-bold text-amber-300 uppercase tracking-wider">Onsen Vault</div>
            <div className="text-base sm:text-xl font-black text-white">{state.coins}</div>
          </div>
        </div>

        {/* Reputation Level */}
        <div className="flex items-center gap-2 bg-indigo-950/80 px-3 py-1 rounded-xl border border-indigo-500/30">
          <Award className="w-5 h-5 text-indigo-400" />
          <div className="text-center">
            <div className="text-[10px] font-bold text-indigo-300">RANK</div>
            <div className="text-xs sm:text-sm font-black text-white">Level {state.reputationLevel}</div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => setIsUpgradesOpen(true)}
            aria-label="Open Onsen Upgrades"
            className="flex items-center gap-1.5 px-3 py-2 min-h-[44px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Upgrades</span>
          </button>
          <button
            onClick={() => {
              const muted = spaSound.toggleMute();
              setIsMuted(muted);
            }}
            aria-label="Toggle Sound"
            className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-300 border border-amber-500/20 transition-all cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Guest Arrival Bench (Queue) */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-2.5 sm:p-3 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🌿</span>
          <span className="text-xs font-bold text-slate-300">
            Waiting Guests ({state.guestQueue.length}/{state.maxQueueSize}):
          </span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto">
          {state.guestQueue.length === 0 ? (
            <span className="text-xs text-slate-500 italic">Next guest arriving soon...</span>
          ) : (
            state.guestQueue.map((guest) => {
              const isSelected = selectedGuestId === guest.id;
              return (
                <button
                  key={guest.id}
                  onClick={() => setSelectedGuestId(isSelected ? null : guest.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer min-h-[44px] ${
                    isSelected
                      ? 'bg-amber-500/30 border-amber-400 text-amber-200 ring-2 ring-amber-400/50 scale-105'
                      : 'bg-slate-800/80 border-slate-700 text-slate-200 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="text-xl">{guest.emoji}</span>
                  <div className="text-left">
                    <div className="text-[11px] font-black">{guest.name}</div>
                    <div className="text-[9px] text-amber-400 font-semibold">
                      Needs: {guest.currentNeed === 'yuzu' ? '🍊 Yuzu' : guest.currentNeed === 'tea' ? '🍵 Tea' : guest.currentNeed === 'scrub' ? '🫧 Scrub' : '💤 Rest'}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* 4 Hot Spring Tubs Grid */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 flex-1">
        {state.tubs.map((tub) => {
          if (!tub.unlocked) {
            const unlockCost = UPGRADE_COSTS.extraTubs[tub.id - 2] || 150;
            const canAfford = state.coins >= unlockCost;
            return (
              <div
                key={tub.id}
                onClick={() => canAfford && handleBuyUpgrade('extraTubs')}
                className={`relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 border-dashed transition-all cursor-pointer min-h-[190px] sm:min-h-[220px] ${
                  canAfford
                    ? 'border-amber-400/50 bg-amber-950/20 hover:bg-amber-950/30'
                    : 'border-slate-800 bg-slate-900/40 opacity-75'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-800/80 flex items-center justify-center text-2xl mb-2 text-slate-400">
                  🔒
                </div>
                <div className="text-sm font-black text-white mb-1">Cedar Tub #{tub.id + 1}</div>
                <button
                  disabled={!canAfford}
                  className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all min-h-[44px] ${
                    canAfford
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20 hover:scale-105'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  <span>Unlock for</span>
                  <span className="font-extrabold">{unlockCost} 🪙</span>
                </button>
              </div>
            );
          }

          // Unlocked Tub
          const critter = tub.critter;
          const isSatisfied = critter && critter.bliss >= 100;

          return (
            <div
              key={tub.id}
              onClick={(e) => !critter && handleSeatGuest(tub.id, e)}
              className={`relative flex flex-col justify-between p-3.5 sm:p-4 rounded-3xl border transition-all ${
                critter
                  ? 'bg-gradient-to-b from-indigo-950/70 to-slate-900/90 border-indigo-500/30 shadow-xl'
                  : 'bg-slate-900/60 border-slate-700/60 hover:border-amber-400/40 cursor-pointer min-h-[190px]'
              }`}
            >
              {/* Tub Header */}
              <div className="flex items-center justify-between w-full mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-amber-300">Tub #{tub.id + 1}</span>
                  <div className="flex items-center gap-0.5 text-xs text-amber-400 font-bold ml-1">
                    {Array.from({ length: tub.yuzuCount }).map((_, i) => (
                      <span key={i} title="Floating Yuzu">🍊</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                  <span>🫧 Clean: {Math.round(tub.cleanliness)}%</span>
                </div>
              </div>

              {/* Bath Water Area */}
              {critter ? (
                <div className="relative flex-1 flex flex-col items-center justify-center py-2">
                  {/* Thought Bubble / Service Need */}
                  {critter.currentNeed !== 'relax' && !isSatisfied && (
                    <div className="absolute -top-1 bg-amber-400 text-slate-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-lg animate-bounce flex items-center gap-1 border border-white">
                      <span>{critter.currentNeed === 'yuzu' ? '🍊 Needs Yuzu!' : critter.currentNeed === 'tea' ? '🍵 Wants Tea!' : '🫧 Scrub Me!'}</span>
                    </div>
                  )}

                  {/* Critter Mascot Visual */}
                  <div className="relative flex items-center justify-center my-1">
                    <div className="w-20 h-20 rounded-full bg-cyan-900/40 border-2 border-cyan-400/40 flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
                      <span className="animate-pulse select-none">{critter.emoji}</span>
                      {tub.yuzuCount > 0 && (
                        <span className="absolute top-0 text-sm animate-bounce select-none">🍊</span>
                      )}
                    </div>
                    {isSatisfied && (
                      <div className="absolute -bottom-1 text-2xl animate-spin select-none">✨</div>
                    )}
                  </div>

                  {/* Bliss Progress Gauge */}
                  <div className="w-full mt-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-0.5">
                      <span>Bliss Level</span>
                      <span className="text-amber-300">{Math.round(critter.bliss)}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isSatisfied
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 animate-pulse'
                            : 'bg-gradient-to-r from-indigo-500 to-cyan-400'
                        }`}
                        style={{ width: `${critter.bliss}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions Toolbar */}
                  <div className="w-full flex items-center justify-center gap-2 mt-3">
                    {isSatisfied ? (
                      <button
                        onClick={(e) => handleCheckout(tub.id, e)}
                        className="w-full py-2.5 min-h-[44px] bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-400/30 flex items-center justify-center gap-1.5 animate-pulse cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>COLLECT COINS 💰</span>
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={(e) => handleAddYuzu(tub.id, e)}
                          title="Toss Yuzu Citrus"
                          disabled={tub.yuzuCount >= 4}
                          className="flex-1 py-1.5 min-h-[44px] bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer disabled:opacity-40"
                        >
                          <span>🍊 Yuzu</span>
                        </button>
                        <button
                          onClick={(e) => handleServeTea(tub.id, e)}
                          title="Serve Herbal Tea"
                          className="flex-1 py-1.5 min-h-[44px] bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🍵 Tea</span>
                        </button>
                        <button
                          onClick={(e) => handleScrub(tub.id, e)}
                          title="Scrub Bath"
                          className="flex-1 py-1.5 min-h-[44px] bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-200 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <span>🫧 Scrub</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-3xl mb-2 text-cyan-300">
                    ♨️
                  </div>
                  <div className="text-xs font-bold text-slate-300">Tub is Warm & Ready</div>
                  <div className="text-[10px] text-amber-400 font-semibold mt-0.5">
                    {state.guestQueue.length > 0 ? 'Tap here to seat waiting guest' : 'Waiting for guests...'}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Upgrades Modal Drawer */}
      {isUpgradesOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-5 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏮</span>
                <h3 className="text-lg font-black text-white">Onsen Spa Upgrades</h3>
              </div>
              <button
                onClick={() => setIsUpgradesOpen(false)}
                aria-label="Close upgrades"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Herbal Bath Upgrade */}
              {(() => {
                const lvl = state.upgrades.herbalBath;
                const cost = UPGRADE_COSTS.herbalBath[lvl];
                const maxed = lvl >= UPGRADE_COSTS.herbalBath.length;
                const canAfford = cost !== undefined && state.coins >= cost;
                return (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>🌿 Chamomile Herbal Bath</span>
                        <span className="text-[10px] text-amber-400 font-bold">Lvl {lvl}/3</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">+25% faster natural bliss accumulation</div>
                    </div>
                    <button
                      disabled={maxed || !canAfford}
                      onClick={() => handleBuyUpgrade('herbalBath')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black min-h-[44px] cursor-pointer ${
                        maxed
                          ? 'bg-slate-700 text-slate-400 cursor-default'
                          : canAfford
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {maxed ? 'MAX' : `${cost} 🪙`}
                    </button>
                  </div>
                );
              })()}

              {/* Deluxe Scrub Upgrade */}
              {(() => {
                const lvl = state.upgrades.deluxeScrub;
                const cost = UPGRADE_COSTS.deluxeScrub[lvl];
                const maxed = lvl >= UPGRADE_COSTS.deluxeScrub.length;
                const canAfford = cost !== undefined && state.coins >= cost;
                return (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>🫧 Deluxe Bamboo Sponge</span>
                        <span className="text-[10px] text-amber-400 font-bold">Lvl {lvl}/3</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">+50% scrubbing efficiency & clean boost</div>
                    </div>
                    <button
                      disabled={maxed || !canAfford}
                      onClick={() => handleBuyUpgrade('deluxeScrub')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black min-h-[44px] cursor-pointer ${
                        maxed
                          ? 'bg-slate-700 text-slate-400 cursor-default'
                          : canAfford
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {maxed ? 'MAX' : `${cost} 🪙`}
                    </button>
                  </div>
                );
              })()}

              {/* Tea Station Upgrade */}
              {(() => {
                const lvl = state.upgrades.teaStation;
                const cost = UPGRADE_COSTS.teaStation[lvl];
                const maxed = lvl >= UPGRADE_COSTS.teaStation.length;
                const canAfford = cost !== undefined && state.coins >= cost;
                return (
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-800/80 border border-slate-700">
                    <div>
                      <div className="text-xs font-black text-white flex items-center gap-1.5">
                        <span>🍵 Premium Roasted Barley Tea</span>
                        <span className="text-[10px] text-amber-400 font-bold">Lvl {lvl}/3</span>
                      </div>
                      <div className="text-[10px] text-slate-300 mt-0.5">+50% coin tips when serving tea</div>
                    </div>
                    <button
                      disabled={maxed || !canAfford}
                      onClick={() => handleBuyUpgrade('teaStation')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black min-h-[44px] cursor-pointer ${
                        maxed
                          ? 'bg-slate-700 text-slate-400 cursor-default'
                          : canAfford
                          ? 'bg-amber-400 text-slate-950 hover:bg-amber-300'
                          : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      }`}
                    >
                      {maxed ? 'MAX' : `${cost} 🪙`}
                    </button>
                  </div>
                );
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-center">
              <button
                onClick={() => setIsUpgradesOpen(false)}
                className="w-full py-2.5 min-h-[44px] bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                Close Upgrades
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
